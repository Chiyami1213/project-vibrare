"""Realizer + checker for the partimento mini-notation.

Mini-notation (one string per example; see BUILD_BRIEF.md §4):
  slices separated by spaces, bars by '|'.
  slice  = BASS ':' V1 ',' V2 [',' V3]   [ '@' dur ]
  V1..Vn = upper voices from TOP to BOTTOM, each an interval above the bass:
           [^][#|b|n]NUM[+][<|>]*   ('^' = tied from previous, '+' = augmented, exact,
                              '>'/'<' = octave above/below the nearest-octave choice: leaps in diminutions)
           'a-b' / 'a-b-c'  = the slice is split equally (suspension / motion over one bass)
           '.'  = voice holds previous pitch (no re-attack)
           '_'  = rest
  BASS   = [#|b|n]DEG[<|>]*[~]   ('<'/'>' force octave below/above nearest, '~' tied)
           '.' = bass holds
"""
import re

LET = 'CDEFGAB'
NAT = [0, 2, 4, 5, 7, 9, 11]
KEYS = {  # tonic letter index, mode, key-signature accidentals {letter: acc}
    'C': (0, 'major', {}),
    'G': (4, 'major', {'F': 1}),
    'F': (3, 'major', {'B': -1}),
    'a': (5, 'minor', {}),
    'd': (1, 'minor', {'B': -1}),
    'e': (2, 'minor', {'F': 1}),
}


class P:
    """diatonic pitch: step (0=C0 counted in letters) + accidental"""
    __slots__ = ('step', 'acc')

    def __init__(self, step, acc):
        self.step, self.acc = step, acc

    @property
    def letter(self):
        return LET[self.step % 7]

    @property
    def octave(self):
        return self.step // 7

    @property
    def midi(self):
        return 12 * (self.octave + 1) + NAT[self.step % 7] + self.acc

    def name(self):
        return self.letter + {2: '##', 1: '#', 0: '', -1: 'b', -2: 'bb'}[self.acc] + str(self.octave)

    def __eq__(self, o):
        return o is not None and self.step == o.step and self.acc == o.acc


def sig_acc(key, letter):
    return KEYS[key][2].get(letter, 0)


def degree_pitch(key, deg, acc_mod, octave):
    t = KEYS[key][0]
    step = octave * 7 + t + (deg - 1)
    letter = LET[step % 7]
    a = sig_acc(key, letter)
    if acc_mod == '#':
        a += 1
    elif acc_mod == 'b':
        a -= 1
    elif acc_mod == 'n':
        a = 0
    return P(step, a)


def interval_above(key, bass, num, acc_mod, aug):
    step = bass.step + (num - 1)
    letter = LET[step % 7]
    a = sig_acc(key, letter)
    p = P(step, a)
    if aug:  # exact augmented interval (4+ = 6 semitones, 6+ = 10, 2+ = 3, 5+ = 8)
        simple = (num - 1) % 7 + 1
        target = {2: 3, 4: 6, 5: 8, 6: 10}[simple] + 12 * ((num - 1) // 7)
        p.acc += target - (p.midi - bass.midi)
        return p
    if acc_mod == '#':
        p.acc += 1
    elif acc_mod == 'b':
        p.acc -= 1
    elif acc_mod == 'n':
        p.acc = 0
    return p


TOK_V = re.compile(r'^(\^)?([#bn])?(\d+)(\+)?([<>]*)$')
TOK_B = re.compile(r'^([#bn])?([1-7])([<>]*)(~)?$')


def parse(text):
    bars = [b.strip() for b in text.split('|')]
    slices = []
    for bi, bar in enumerate(bars):
        for tok in bar.split():
            dur = 1.0
            if '@' in tok:
                tok, d = tok.split('@')
                dur = float(d)
            bass, ups = tok.split(':', 1) if ':' in tok else (tok, '')
            ups = ups.split(',') if ups else []
            slices.append({'bar': bi, 'bass': bass, 'ups': ups, 'dur': dur})
    return slices


def realize(text, key='C', parts=None, cross=False):
    """returns dict with per-voice event lists and per-slice figures; raises ValueError on syntax."""
    sl = parse(text)
    nup = max(len(s['ups']) for s in sl)
    voices = [[] for _ in range(nup + 1)]  # 0..nup-1 upper (top first), last = bass
    prev = [None] * (nup + 1)
    t = 0.0
    bass_p = None
    figs_out = []
    for s in sl:
        # ---- bass
        b = s['bass']
        if b == '.':
            bp = bass_p
            bass_tie = True
        else:
            m = TOK_B.match(b)
            if not m:
                raise ValueError('bad bass token %r' % b)
            acc, deg, octs, tie = m.groups()
            deg = int(deg)
            if bass_p is None:
                c2, c3 = degree_pitch(key, deg, acc, 2), degree_pitch(key, deg, acc, 3)
                bp = c2 if abs(c2.midi - 45) < abs(c3.midi - 45) else c3  # first bass near A2
            else:
                cands = [degree_pitch(key, deg, acc, o) for o in (1, 2, 3, 4)]
                cands.sort(key=lambda p: abs(p.step - bass_p.step) + 0.3 * abs(p.midi - 43))
                bp = cands[0]
                for c in octs:
                    bp = P(bp.step + (7 if c == '>' else -7), bp.acc)
                    # recompute acc for letter (same letter so same)
                while bp.midi < 36:
                    bp = P(bp.step + 7, bp.acc)
                while bp.midi > 62:
                    bp = P(bp.step - 7, bp.acc)
            bass_tie = bool(tie) or (b == '.')
        if b != '.' or not voices[-1]:
            voices[-1].append({'t': t, 'd': s['dur'], 'p': bp, 'tie': bass_tie and bass_p is not None and bp == bass_p})
        else:
            voices[-1][-1]['d'] += s['dur']
        bass_p = bp
        # ---- uppers
        slice_figs = []
        below = bp
        first = all(x is None for x in prev[:nup])
        order = range(nup - 1, -1, -1) if first else range(nup)
        above = None
        # first slice: bottom-up stacking; later: top-down with a no-crossing preference
        for vi in order:
            tok = s['ups'][vi] if vi < len(s['ups']) else '.'
            parts_ = tok.split('-')
            # '-' inside a token means split; but a lone '-' is not used
            n = len(parts_)
            sub_d = s['dur'] / n
            for k, pt in enumerate(parts_):
                st = t + k * sub_d
                if pt == '.':
                    if voices[vi]:
                        voices[vi][-1]['d'] += sub_d
                    continue
                if pt == '_':
                    voices[vi].append({'t': st, 'd': sub_d, 'p': None})
                    prev[vi] = None
                    continue
                m = TOK_V.match(pt)
                if not m:
                    raise ValueError('bad voice token %r in %r' % (pt, tok))
                tie, acc, num, aug, oct_ = m.groups()
                num = int(num)
                p = interval_above(key, bp, num, acc, aug)
                if prev[vi] is None:
                    if num <= 8 or vi < nup - 1:
                        # place above the voice below (or the bass)
                        ref = below
                        while p.midi <= ref.midi and not (num == 1):
                            p = P(p.step + 7, p.acc)
                        while p.midi < 55:  # keep upper voices in a treble-ish register
                            p = P(p.step + 7, p.acc)
                else:
                    # nearest octave to previous pitch of this voice, but above the bass
                    best = None
                    for o in (-21, -14, -7, 0, 7, 14, 21):
                        q = P(p.step + o, p.acc)
                        if q.midi <= bp.midi:
                            continue
                        d = abs(q.step - prev[vi].step)
                        if not cross and above is not None and q.midi > above.midi:
                            d += 10
                        if best is None or d < best[0]:
                            best = (d, q)
                    p = best[1] if best else P(p.step + 7, p.acc)
                for c in oct_ or '':  # '>' / '<' = octave above / below the default choice
                    p = P(p.step + (7 if c == '>' else -7), p.acc)
                ev = {'t': st, 'd': sub_d, 'p': p, 'tie': bool(tie), 'fig': (acc or '') + str(num) + ('+' if aug else '')}
                if tie:
                    if prev[vi] is None or not (prev[vi] == p):
                        ev['tieError'] = True
                    if voices[vi] and voices[vi][-1].get('p') is not None and voices[vi][-1]['p'] == p:
                        pass
                voices[vi].append(ev)
                prev[vi] = p
            if voices[vi]:
                firstev = next((e for e in voices[vi] if e['t'] >= t - 1e-9 and e.get('p') is not None), None)
                if firstev is None and voices[vi][-1].get('p') is not None:
                    firstev = voices[vi][-1]
                if firstev is not None:
                    if first:
                        below = voices[vi][-1]['p']
                    else:
                        above = firstev['p']
        if first:  # lift the opening sonority if the top voice sits too low
            tops = [e for v in voices[:nup] for e in v if e.get('p') is not None]
            if tops and max(e['p'].midi for e in tops) < (67 if nup >= 2 else 60):
                for e in tops:
                    e['p'] = P(e['p'].step + 7, e['p'].acc)
                for vi in range(nup):
                    if prev[vi] is not None:
                        prev[vi] = P(prev[vi].step + 7, prev[vi].acc)
        t += s['dur']
        figs_out.append(s)
    # if the texture climbs too high, drop the upper voices an octave when that keeps them above the bass
    ups = [e for v in voices[:nup] for e in v if e.get('p') is not None]
    if ups and max(e['p'].midi for e in ups) > 84:
        ok = all(e['p'].midi - 12 > (sounding(voices[-1], e['t']) or {'p': P(0, 0)})['p'].midi for e in ups)
        if ok:
            for e in ups:
                e['p'] = P(e['p'].step - 7, e['p'].acc)
    return {'voices': voices, 'length': t, 'slices': sl, 'nup': nup}


def sounding(voice, t):
    for e in voice:
        if e['t'] <= t + 1e-9 < e['t'] + e['d']:
            return e
    return None


def check(real):
    """parallel 5ths/8ves between any pair of voices; tie errors; voice-crossing info."""
    vs = real['voices']
    onsets = sorted({round(e['t'], 6) for v in vs for e in v})
    issues = []
    for v_i, v in enumerate(vs):
        for e in v:
            if e.get('tieError'):
                issues.append(('tie', round(e['t'], 3), v_i, 'tie marked but pitch differs from previous'))
    for i in range(len(vs)):
        for j in range(i + 1, len(vs)):
            prevpair = None
            for t in onsets:
                a, b = sounding(vs[i], t), sounding(vs[j], t)
                if not a or not b or a['p'] is None or b['p'] is None:
                    prevpair = None
                    continue
                pair = (a['p'], b['p'])
                if prevpair:
                    (pa, pb), (ca, cb) = prevpair, pair
                    moved_a, moved_b = not (pa == ca), not (pb == cb)
                    if moved_a and moved_b:
                        i1 = abs(pa.midi - pb.midi) % 12
                        i2 = abs(ca.midi - cb.midi) % 12
                        g1 = abs(pa.step - pb.step) % 7
                        g2 = abs(ca.step - cb.step) % 7
                        if i1 == i2 == 7 and g1 == g2 == 4:
                            issues.append(('par5', round(t, 3), (i, j), '%s-%s -> %s-%s' % (pa.name(), pb.name(), ca.name(), cb.name())))
                        if i1 == i2 == 0 and g1 == g2 == 0:
                            issues.append(('par8', round(t, 3), (i, j), '%s-%s -> %s-%s' % (pa.name(), pb.name(), ca.name(), cb.name())))
                prevpair = pair
    return issues


def to_json(real):
    out = []
    for v in real['voices']:
        evs = []
        for e in v:
            o = {'t': round(e['t'], 4), 'd': round(e['d'], 4)}
            if e.get('p') is None:
                o['rest'] = True
            else:
                o['pitch'] = e['p'].name()
                o['midi'] = e['p'].midi
                if e.get('tie'):
                    o['tie'] = True
                if e.get('fig'):
                    o['fig'] = e['fig']
            evs.append(o)
        out.append(evs)
    return out


if __name__ == '__main__':
    r = realize('1:5,3 1:6,3 | 2:5,3 2:6,3 | 3:5,3 3:6,3 | 4:5,3 4:6,3 | 5:5,3 5:6,3 | 6:5,3 6:6,3 | 7:5,3 7:6,3 | 1:5,3', 'C')
    for v in r['voices']:
        print([e['p'].name() for e in v])
    print(check(r))
