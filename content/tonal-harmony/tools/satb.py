"""Parser, analyser and part-writing checker for the tonal-harmony example notation.

Notation (one string per example; see BUILD_BRIEF.md §4)
  slices are separated by whitespace; '|' marks a barline (a token on its own).
  slice  = [LABEL ':'] VOICE (',' VOICE)* ['@' BEATS]
  LABEL  = Roman numeral / analysis label shown under the slice (no ':' or ',' inside), e.g. V6/5/V, It+6, I6/4
  VOICE  = voices listed TOP -> BOTTOM (S,A,T,B for four parts; any count 1-4)
           PITCH            e.g. C5, F#4, Bb3, Bbb3, F##4, En4 ('n' = explicit natural, displayed)
           ~PITCH           tied from the previous note of this voice (same pitch)
           -                this voice holds (no new attack)
           _                rest
           P1.P2[.P3]       the slice is split equally inside this voice (non-chord tones)
           !P1.P2           '!' marks the FIRST sub-note as an accented non-chord tone (suspension,
                            appoggiatura, accented passing tone): chord analysis uses P2 instead
  BEATS  = duration of the slice in beats (default 1)
"""
import re

LET = 'CDEFGAB'
NAT = [0, 2, 4, 5, 7, 9, 11]
PITCH = re.compile(r'^([A-G])(##|#|bb|b|n)?(-?\d)$')
ACC = {'##': 2, '#': 1, '': 0, 'n': 0, 'b': -1, 'bb': -2, None: 0}


class P:
    __slots__ = ('step', 'acc', 'shownat')

    def __init__(self, step, acc, shownat=False):
        self.step, self.acc, self.shownat = step, acc, shownat

    @staticmethod
    def parse(s):
        m = PITCH.match(s)
        if not m:
            raise ValueError('bad pitch %r' % s)
        l, a, o = m.groups()
        return P(int(o) * 7 + LET.index(l), ACC[a], a == 'n')

    @property
    def midi(self):
        return 12 * (self.step // 7 + 1) + NAT[self.step % 7] + self.acc

    @property
    def pc(self):
        return self.midi % 12

    def name(self):
        return LET[self.step % 7] + {2: '##', 1: '#', 0: '', -1: 'b', -2: 'bb'}[self.acc] + str(self.step // 7)

    def __eq__(self, o):
        return isinstance(o, P) and self.step == o.step and self.acc == o.acc


# ---------------------------------------------------------------- keys
KEYSIG = {}  # key -> {letter: acc}
_sharps, _flats = 'FCGDAEB', 'BEADGCF'
for k, n in [('C', 0), ('G', 1), ('D', 2), ('A', 3), ('E', 4), ('B', 5), ('F#', 6), ('C#', 7),
             ('a', 0), ('e', 1), ('b', 2), ('f#', 3), ('c#', 4), ('g#', 5), ('d#', 6)]:
    KEYSIG[k] = {l: 1 for l in _sharps[:n]}
for k, n in [('F', 1), ('Bb', 2), ('Eb', 3), ('Ab', 4), ('Db', 5), ('Gb', 6),
             ('d', 1), ('g', 2), ('c', 3), ('f', 4), ('bb', 5), ('eb', 6)]:
    KEYSIG[k] = {l: -1 for l in _flats[:n]}


def tonic_letter(key):
    return LET.index(key[0].upper())


def degree_of(key, p):
    """scale degree string for display, e.g. '5', '#4', 'b6' (minor = natural minor; raised 6/7 shown as #/n)."""
    d = (p.step - tonic_letter(key)) % 7 + 1
    expect = KEYSIG[key].get(LET[p.step % 7], 0)
    diff = p.acc - expect
    pre = {0: '', 1: '#', -1: 'b', 2: '##', -2: 'bb'}[diff]
    if pre == '#' and expect == -1:
        pre = 'n'
    if pre == 'b' and expect == 1:
        pre = 'n'
    return pre + str(d)


# ---------------------------------------------------------------- parse / realize
def parse(text):
    toks = text.split()
    slices, bar = [], 0
    for tok in toks:
        if tok == '|':
            bar += 1
            continue
        dur = 1.0
        if '@' in tok:
            tok, d = tok.rsplit('@', 1)
            dur = float(d)
        label = None
        if ':' in tok:
            label, tok = tok.split(':', 1)
        slices.append({'label': label or None, 'voices': tok.split(','), 'dur': dur, 'bar': bar})
    return slices


def realize(text):
    sl = parse(text)
    nv = max(len(s['voices']) for s in sl)
    voices = [[] for _ in range(nv)]
    t = 0.0
    for s in sl:
        if len(s['voices']) != nv:
            raise ValueError('slice %r has %d voices, expected %d' % (s['voices'], len(s['voices']), nv))
        s['t'] = t
        s['nct'] = {}
        for vi, tok in enumerate(s['voices']):
            if tok.startswith('!'):
                tok = tok[1:]
                s['nct'][vi] = True
            parts = tok.split('.')
            sub = s['dur'] / len(parts)
            for k, pt in enumerate(parts):
                st = t + k * sub
                if pt == '-':
                    if not voices[vi]:
                        raise ValueError('hold with nothing to hold')
                    voices[vi][-1]['d'] += sub
                    continue
                if pt == '_':
                    voices[vi].append({'t': st, 'd': sub, 'p': None})
                    continue
                tie = pt.startswith('~')
                p = P.parse(pt.lstrip('~'))
                ev = {'t': st, 'd': sub, 'p': p, 'tie': tie}
                if tie:
                    prev = voices[vi][-1]['p'] if voices[vi] else None
                    if prev is None or not prev == p:
                        ev['tieError'] = True
                voices[vi].append(ev)
            if s['nct'].get(vi) and len(parts) > 1:
                s['nct'][vi] = P.parse(parts[1].lstrip('~'))
        t += s['dur']
    return {'voices': voices, 'slices': sl, 'length': t, 'nv': nv}


def sounding(voice, t):
    for e in voice:
        if e['t'] <= t + 1e-9 < e['t'] + e['d']:
            return e
    return None


# ---------------------------------------------------------------- chord analysis
def analyse(pitches):
    """root/quality/members from a list of P (bass last). Returns None when the set is not tertian."""
    ps = [p for p in pitches if p is not None]
    if not ps:
        return None
    letters = {p.step % 7 for p in ps}
    for cand in ps:
        r = cand.step % 7
        offs = {(l - r) % 7 for l in letters}
        if offs <= {0, 2, 4, 6} and 0 in offs:
            root = cand
            mem = {}
            for p in ps:
                g = (p.step - root.step) % 7
                semis = (p.pc - root.pc) % 12
                mem.setdefault({0: 'R', 2: '3', 4: '5', 6: '7'}[g], semis)
            q3, q5, q7 = mem.get('3'), mem.get('5'), mem.get('7')
            return {'root': root, 'members': mem, 'q3': q3, 'q5': q5, 'q7': q7}
    return None


def figures(pitches):
    ps = [p for p in pitches if p is not None]
    if len(ps) < 2:
        return ''
    b = ps[-1]
    nums = set()
    for p in ps[:-1]:
        g = (p.step - b.step) % 7 + 1
        nums.add(g if g != 1 else 8)
    nums.discard(8)
    nums = sorted(nums, reverse=True)
    if not nums:
        return '8'
    if nums in ([5, 3], [5], [3]):
        return '5/3'
    if nums in ([6, 3], [6]):
        return '6/3'
    if nums == [6, 4]:
        return '6/4'
    if nums in ([7, 5, 3], [7, 3], [7, 5], [7]):
        return '7'
    if nums in ([6, 5, 3], [6, 5]):
        return '6/5'
    if nums in ([6, 4, 3], [4, 3]):
        return '4/3'
    if nums in ([6, 4, 2], [4, 2], [2], [6, 2]):
        return '4/2'
    return '/'.join(str(n) for n in nums)


# ---------------------------------------------------------------- checker
RANGES = {  # notes p.15 (normal range, extended range)
    4: [('S', 'C4', 'G5', 'B3', 'A5'), ('A', 'G3', 'C5', 'G3', 'D5'), ('T', 'C3', 'G4', 'C3', 'A4'), ('B', 'E2', 'C4', 'D2', 'D4')],
}
LEVEL = {  # notes p.20 checklist colour for each check type
    'range': 'white', 'leap': 'white',
    'doubling': 'blue', 'contrary': 'blue', 'hidden': 'blue',
    'augLeap': 'green', 'overlap': 'green', 'crossing': 'green',
    'viiRoot': 'yellow', 'sixFour': 'yellow',
    'doubledLT': 'orange', 'spacing': 'orange', 'seventh': 'orange', 'seventhLeap': 'orange', 'leadingTone': 'orange', 'unequal5': 'orange', 'aug6': 'orange',
    'parallel': 'red', 'tie': 'red', 'bigLeap': 'red',
}


def rn_base(label):
    if not label:
        return ''
    return label.split('/')[0] if not label.startswith(('It', 'Fr', 'Ger', 'N')) else label


def lt_member(label):
    """which chord member is a leading tone, judged from the analysis label."""
    if not label:
        return None
    head = label.split('/')[0]
    head = head.lstrip('(').replace('♭', 'b')
    if head.startswith('vii'):
        return 'R'
    if re.match(r'^V(?!I)', head):
        return '3'
    return None


def check(real, allow=()):
    vs = real['voices']
    sl = real['slices']
    nv = real['nv']
    issues = []

    def add(kind, t, voices, detail):
        if kind in allow:
            return
        issues.append({'type': kind, 'level': LEVEL[kind], 'beat': round(t, 3), 'voices': voices, 'detail': detail})

    for vi, v in enumerate(vs):
        for e in v:
            if e.get('tieError'):
                add('tie', e['t'], vi, 'tie marked but pitch differs')
    onsets = sorted({round(e['t'], 6) for v in vs for e in v})
    snap = {t: [(sounding(v, t) or {}).get('p') for v in vs] for t in onsets}
    names = ['S', 'A', 'T', 'B'] if nv == 4 else (['S', 'A', 'B'] if nv == 3 else ['U', 'B'] if nv == 2 else ['M'])

    # ---- pairwise motion
    for i in range(nv):
        for j in range(i + 1, nv):
            prev = None
            for t in onsets:
                a, b = snap[t][i], snap[t][j]
                if a is None or b is None:
                    prev = None
                    continue
                if prev:
                    pa, pb = prev
                    ma, mb = not pa == a, not pb == b
                    if ma and mb:
                        i1, i2 = abs(pa.midi - pb.midi), abs(a.midi - b.midi)
                        g1, g2 = abs(pa.step - pb.step) % 7, abs(a.step - b.step) % 7
                        da, db = a.midi - pa.midi, b.midi - pb.midi
                        same_dir = (da > 0) == (db > 0)
                        for semi, gen, nm in ((7, 4, 'P5'), (0, 0, 'P8/P1')):
                            if i1 % 12 == semi and i2 % 12 == semi and g1 == gen and g2 == gen:
                                kind = 'parallel' if same_dir else 'contrary'
                                add(kind, t, [names[i], names[j]], '%s %s: %s-%s -> %s-%s' % ('parallel' if same_dir else 'contrary', nm, pa.name(), pb.name(), a.name(), b.name()))
                        if j == nv - 1 and nv >= 3 and i1 % 12 == 6 and i2 % 12 == 7 and g1 == 4 and g2 == 4:
                            add('unequal5', t, [names[i], names[j]], 'd5 -> P5 against the bass: %s-%s -> %s-%s' % (pa.name(), pb.name(), a.name(), b.name()))
                        # hidden 5/8 in outer voices, soprano leaps
                        if i == 0 and j == nv - 1 and nv >= 3 and same_dir and abs(a.step - pa.step) > 1:
                            if (i2 % 12 == 7 and g2 == 4 and not (i1 % 12 == 7 and g1 == 4)) or (i2 % 12 == 0 and g2 == 0 and not (i1 % 12 == 0 and g1 == 0)):
                                add('hidden', t, [names[i], names[j]], 'hidden %s in outer voices with a soprano leap' % ('P5' if i2 % 12 == 7 else 'P8'))
                prev = (a, b)

    # ---- vertical checks per onset
    if nv == 4:
        for t in onsets:
            ps = snap[t]
            for k, (nm, lo, hi, elo, ehi) in enumerate(RANGES[4]):
                p = ps[k]
                if p is None:
                    continue
                if p.midi < P.parse(elo).midi or p.midi > P.parse(ehi).midi:
                    add('range', t, nm, '%s outside %s-%s' % (p.name(), elo, ehi))
            for k in range(3):
                a, b = ps[k], ps[k + 1]
                if a is None or b is None:
                    continue
                if a.midi < b.midi:
                    add('crossing', t, [names[k], names[k + 1]], '%s below %s' % (a.name(), b.name()))
                lim = 19 if k == 2 else 12
                if a.midi - b.midi > lim:
                    add('spacing', t, [names[k], names[k + 1]], '%s-%s wider than %s' % (a.name(), b.name(), 'P12' if k == 2 else 'P8'))
    # overlap
    if nv >= 3:
        for k in range(nv - 1):
            for x, y in zip(onsets, onsets[1:]):
                a0, b0, a1, b1 = snap[x][k], snap[x][k + 1], snap[y][k], snap[y][k + 1]
                if None in (a0, b0, a1, b1):
                    continue
                if (a1.midi < b0.midi and not a1 == a0) or (b1.midi > a0.midi and not b1 == b0):
                    add('overlap', y, [names[k], names[k + 1]], 'voices overlap')
    # melodic
    for vi, v in enumerate(vs):
        prev = None
        for e in v:
            p = e['p']
            if p is None:
                prev = None
                continue
            if prev is not None and not prev == p:
                st = abs(p.midi - prev.midi)
                gen = abs(p.step - prev.step)
                if st > 12:
                    add('bigLeap', e['t'], names[vi], 'leap larger than an octave: %s -> %s' % (prev.name(), p.name()))
                elif vi < nv - 1 and nv >= 3 and st > 9 and st != 12:
                    add('leap', e['t'], names[vi], 'leap larger than M6: %s -> %s' % (prev.name(), p.name()))
                g = gen % 7
                natural = {0: 0, 1: 2, 2: 4, 3: 5, 4: 7, 5: 9, 6: 11}[g]
                if gen < 7 and st - natural >= 1 and g in (1, 3, 4) and st > {1: 2, 3: 5, 4: 7}[g]:
                    add('augLeap', e['t'], names[vi], 'augmented melodic interval: %s -> %s' % (prev.name(), p.name()))
            prev = p

    # ---- harmonic obligations (slice level, using the first sub-note of each voice)
    slice_snaps = []
    for s in sl:
        ps = list(snap[round(s['t'], 6)])
        for vi, alt in s.get('nct', {}).items():
            if isinstance(alt, P):
                ps[vi] = alt
        slice_snaps.append(ps)
        s['analysis'] = analyse(ps)
        s['figures'] = figures(ps)
    pending = []  # (voice, pitch, kind, t)
    for si, s in enumerate(sl):
        ps = slice_snaps[si]
        an = s['analysis']
        # resolve pending obligations
        still = []
        for (vi, p0, kind, t0, root0) in pending:
            cur = ps[vi]
            if cur is None:
                continue
            if cur == p0:
                still.append((vi, p0, kind, t0, root0))
                continue
            if an and root0 is not None and an['root'].pc == root0 and kind != 'seventh':
                # same harmony re-voiced: obligation moves with the pitch class if still present in this voice
                still.append((vi, cur, kind, t0, root0)) if cur.pc == p0.pc else None
                continue
            diff = cur.midi - p0.midi
            step = cur.step - p0.step
            if kind == 'seventh' and step == 0 and diff == 1:
                # delayed resolution: a flat 7th raised chromatically (A♭ → A♮) keeps the obligation (notes p.40)
                still.append((vi, cur, kind, t0, root0))
                continue
            if kind == 'seventh' and not (step == -1 and diff in (-1, -2)):
                if not (an and root0 is not None and an['root'].pc == root0):
                    add('seventh', s['t'], names[vi], 'chordal 7th %s does not step down (goes to %s)' % (p0.name(), cur.name()))
                else:
                    still.append((vi, cur, kind, t0, root0)) if cur.pc == p0.pc else None
            if kind == 'lt' and not (step == 1 and diff == 1) and not (step == 0 and diff == -1):
                # (a chromatic inflection 7̂ → ♭7̂ is accepted: the leading tone becomes the 7th of a
                #  secondary dominant — notes p.38)
                add('leadingTone', s['t'], names[vi], 'leading tone %s in an outer voice does not rise to the tonic (goes to %s)' % (p0.name(), cur.name()))
        pending = still
        if not an or nv < 3:
            continue
        label = s['label'] or ''
        mem = an['members']
        root = an['root']
        # leading tone
        ltm = lt_member(label)
        if ltm and ltm in mem:
            ltpc = (root.pc + (0 if ltm == 'R' else mem['3'])) % 12
            idx = [k for k, p in enumerate(ps) if p is not None and p.pc == ltpc]
            if len(idx) >= 2 and nv >= 4:
                add('doubledLT', s['t'], [names[k] for k in idx], 'leading tone doubled')
            nxt = sl[si + 1] if si + 1 < len(sl) else None
            if nxt is not None:
                for k in idx:
                    if k in (0, nv - 1) and not any(x[0] == k for x in pending):
                        pending.append((k, ps[k], 'lt', s['t'], root.pc))
        is_aug6 = label.startswith(('It', 'Fr', 'Ger'))
        if is_aug6 and si + 1 < len(sl):
            b = ps[-1]
            nxt = slice_snaps[si + 1]
            for k, p in enumerate(ps[:-1]):
                if p is not None and (p.midi - b.midi) % 12 == 10 and (p.step - b.step) % 7 == 5:
                    q, nb = nxt[k], nxt[-1]
                    if q is None or nb is None:
                        continue
                    if not (q.midi - p.midi == 1 and nb.midi - b.midi == -1) and not (q == p and nb == b):
                        add('aug6', sl[si + 1]['t'], [names[k], names[-1]], 'augmented 6th %s–%s does not expand to an octave (goes to %s–%s)' % (b.name(), p.name(), nb.name(), q.name()))
        # chordal seventh
        if '7' in mem and si > 0 and not is_aug6:
            for k, p in enumerate(ps):
                q = slice_snaps[si - 1][k]
                if p is None or q is None or (p.step - root.step) % 7 != 6:
                    continue
                if q.step - p.step > 1:
                    add('seventhLeap', s['t'], names[k], 'chordal 7th %s approached by descending leap from %s' % (p.name(), q.name()))
        if '7' in mem and not is_aug6:
            for k, p in enumerate(ps):
                if p is None:
                    continue
                if (p.step - root.step) % 7 == 6 and not any(x[0] == k and x[2] == 'seventh' for x in pending):
                    pending.append((k, p, 'seventh', s['t'], root.pc))
            n7 = sum(1 for p in ps if p is not None and (p.step - root.step) % 7 == 6)
            if n7 >= 2 and nv >= 4:
                add('doubling', s['t'], None, 'chordal 7th doubled')
        # doubling of root-position triads (root preferred), except V-vi
        if nv == 4 and '7' not in mem and s['figures'] == '5/3' and all(p is not None for p in ps):
            cnt = {}
            for p in ps:
                g = {0: 'R', 2: '3', 4: '5'}[(p.step - root.step) % 7]
                cnt[g] = cnt.get(g, 0) + 1
            if cnt.get('R', 0) < 2 and not s.get('dc') and not label.startswith(('vi', 'VI')):
                add('doubling', s['t'], None, 'root-position triad without a doubled root (%s)' % cnt)
        if nv == 4 and s['figures'] == '6/4' and '7' not in mem and all(p is not None for p in ps):
            b = ps[-1]
            nb = sum(1 for p in ps if p.pc == b.pc)
            if nb < 2:
                add('doubling', s['t'], None, '6/4 chord without a doubled bass')
        if label.startswith('vii') and s['figures'] == '5/3' and '7' not in mem:
            add('viiRoot', s['t'], None, 'vii° in root position')
        # 6/4 approach / resolution in the bass
        if s['figures'] == '6/4' and '7' not in mem and nv >= 3:
            b = ps[-1]
            cad = bool(re.match(r'^[Ii]6/4$', label)) and (si + 1 == len(sl) or (sl[si + 1]['label'] or '').startswith('V'))
            for nb_i in (si - 1, si + 1):
                if 0 <= nb_i < len(sl):
                    q = slice_snaps[nb_i][-1]
                    if q is not None and abs(q.step - b.step) > 1 and not (cad and nb_i == si - 1):
                        add('sixFour', s['t'], 'B', '6/4 bass %s by leap (%s)' % ('approached' if nb_i < si else 'left', q.name()))
    return issues


def to_json(real, key):
    out = []
    for v in real['voices']:
        evs = []
        for e in v:
            o = {'t': round(e['t'], 4), 'd': round(e['d'], 4)}
            if e['p'] is None:
                o['rest'] = True
            else:
                o['pitch'] = e['p'].name()
                o['midi'] = e['p'].midi
                if e.get('tie'):
                    o['tie'] = True
                if e['p'].shownat:
                    o['natural'] = True
            evs.append(o)
        out.append(evs)
    slices = []
    for s in real['slices']:
        bass = (sounding(real['voices'][-1], s['t']) or {}).get('p')
        an = s.get('analysis')
        slices.append({
            't': round(s['t'], 4), 'd': s['dur'], 'bar': s['bar'], 'label': s['label'],
            'figures': s.get('figures', ''),
            'bassDegree': degree_of(key, bass) if bass is not None else None,
            'root': an['root'].name()[:-1] if an else None,
        })
    return {'voices': out, 'slices': slices}


if __name__ == '__main__':
    ex = 'I:E5,C5,G4,C3 IV:F5,C5,A4,F3 V:D5,B4,G4,G2 I:C5,C5,E4,C3'
    r = realize(ex)
    print(check(r))
    bad = 'I:G4,E4,C4,C3 ii:A4,F4,D4,D3'
    print([i['type'] for i in check(realize(bad))])
