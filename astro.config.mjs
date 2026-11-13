// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The address of the published site. Change it here if the site moves to its own domain.
const SITE = 'https://vibrare.pages.dev';

/** A page with almost no text of its own (a heading and nothing else) is a placeholder. */
const MIN_TEXT = 200;

/**
 * After the build: write sitemap.xml with every page that has real content, and mark the placeholder pages
 * noindex (they stay reachable, and are listed again as soon as they have content, with no change to this file).
 */
function searchEngines() {
  return {
    name: 'vibrare-search-engines',
    hooks: {
      /** @param {{ dir: URL, pages: { pathname: string }[] }} ctx */
      'astro:build:done': ({ dir, pages }) => {
        const root = fileURLToPath(dir);
        const listed = [];
        const held = [];
        for (const { pathname } of pages) {
          if (pathname === '404' || pathname === '404/') continue;
          const file = join(root, pathname, 'index.html');
          let html;
          try {
            html = readFileSync(file, 'utf8');
          } catch {
            continue;
          }
          const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html);
          const text = (main ? main[1] : '').replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const alreadyHeld = /<meta name="robots" content="[^"]*noindex/.test(html);
          const isHome = pathname === '' || pathname === '/'; // the home page is short on purpose, and always listed
          if (!isHome && (text.length < MIN_TEXT || alreadyHeld)) {
            if (!alreadyHeld) writeFileSync(file, html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>'));
            held.push(pathname);
          } else {
            listed.push(pathname);
          }
        }
        const today = new Date().toISOString().slice(0, 10);
        const urls = listed
          .sort()
          .map((p) => `  <url><loc>${SITE}/${p}</loc><lastmod>${today}</lastmod></url>`)
          .join('\n');
        writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
        console.log(`sitemap.xml: ${listed.length} pages listed, ${held.length} placeholder pages kept out (noindex)`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [searchEngines()],
});
