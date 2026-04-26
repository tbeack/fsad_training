import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const SRC = resolve(root, 'src');
const MD_DIR = resolve(SRC, 'markdown');
const OUT = resolve(root, 'dist/fsad-training.html');

marked.setOptions({ mangle: false, headerIds: true });

const mdFiles = (await readdir(MD_DIR)).filter((f) => f.endsWith('.md'));

const rendered = Object.fromEntries(
  await Promise.all(
    mdFiles.map(async (f) => {
      const id = basename(f, '.md').replace(/^\d+[-_]/, '');
      const html = marked.parse(await readFile(resolve(MD_DIR, f), 'utf8'));
      return [id, `<div class="md-artifact" data-md="${id}">${html}</div>`];
    }),
  ),
);

let shell = await readFile(resolve(SRC, 'index.html'), 'utf8');
const usedIds = new Set();
shell = shell.replace(/<!--\s*@@MD:([\w-]+)\s*-->/g, (_, id) => {
  if (!rendered[id]) throw new Error(`Missing markdown artifact for placeholder: ${id}`);
  usedIds.add(id);
  return rendered[id];
});

for (const id of Object.keys(rendered)) {
  if (!usedIds.has(id)) console.warn(`[warn] unused markdown artifact: ${id}`);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, shell);
console.log(`bundled ${mdFiles.length} artifact(s) -> ${OUT}`);
