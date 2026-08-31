import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const SRC = resolve(root, 'src');
const MD_DIR = resolve(SRC, 'markdown');
const SKILLS_DIR = resolve(root, 'skills');
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

let skillDirents = [];
try {
  skillDirents = await readdir(SKILLS_DIR, { withFileTypes: true });
} catch {
  skillDirents = [];
}
const skillNames = skillDirents.filter((d) => d.isDirectory()).map((d) => d.name);

const renderedSkills = Object.fromEntries(
  (
    await Promise.all(
      skillNames.map(async (name) => {
        const skillFile = resolve(SKILLS_DIR, name, 'SKILL.md');
        let raw;
        try {
          raw = await readFile(skillFile, 'utf8');
        } catch {
          return null;
        }
        const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
        const body = frontmatterMatch ? raw.slice(frontmatterMatch[0].length) : raw;
        const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
        const description = descMatch ? marked.parseInline(descMatch[1].trim()) : '';
        const bodyHtml = marked.parse(body);
        const html = `<div class="skill-artifact" data-skill="${name}">${
          description ? `<p class="skill-description">${description}</p>` : ''
        }${bodyHtml}</div>`;
        return [name, html];
      }),
    )
  ).filter(Boolean),
);

let shell = await readFile(resolve(SRC, 'index.html'), 'utf8');
const usedIds = new Set();
shell = shell.replace(/<!--\s*@@MD:([\w-]+)\s*-->/g, (_, id) => {
  if (!rendered[id]) throw new Error(`Missing markdown artifact for placeholder: ${id}`);
  usedIds.add(id);
  return rendered[id];
});

const usedSkillIds = new Set();
shell = shell.replace(/<!--\s*@@SKILL:([\w-]+)\s*-->/g, (_, id) => {
  if (!renderedSkills[id]) throw new Error(`Missing skill artifact for placeholder: ${id}`);
  usedSkillIds.add(id);
  return renderedSkills[id];
});

for (const id of Object.keys(rendered)) {
  if (!usedIds.has(id)) console.warn(`[warn] unused markdown artifact: ${id}`);
}
for (const id of Object.keys(renderedSkills)) {
  if (!usedSkillIds.has(id)) console.warn(`[warn] unused skill artifact: ${id}`);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, shell);
console.log(`bundled ${mdFiles.length} artifact(s), ${skillNames.length} skill(s) -> ${OUT}`);
