// VexFlow measures every notehead by laying out its glyph in the browser, so the Bravura music font must be
// loaded before anything is built. Otherwise the glyphs are measured in a fallback font (about twice as
// wide) and every stem ends up floating away from its notehead.

/** Resolves once the Bravura font face is loaded (or after a timeout, so drawing is never blocked for long). */
export async function fontsReady(timeoutMs = 8000): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const start = performance.now();
  try {
    void document.fonts.load('30pt Bravura'); // nudge the browser, in case nothing has asked for it yet
  } catch {
    /* ignore */
  }
  while (performance.now() - start < timeoutMs) {
    for (const face of document.fonts) {
      if (face.family.replace(/["']/g, '') === 'Bravura' && face.status === 'loaded') {
        await document.fonts.ready;
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 30));
  }
}
