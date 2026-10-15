#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map(process.argv.slice(2).reduce((pairs, value, i, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[i + 1]?.startsWith('--') ? 'true' : all[i + 1] ?? 'true']);
  return pairs;
}, []));
const outputPath = resolve(args.get('output') || join(projectRoot, 'data/programming-resources.json'));
const reportPath = resolve(args.get('report') || join(projectRoot, 'data/programming-resources-import-report.json'));
const suppliedBooks = args.get('books-dir');
const suppliedSearch = args.get('search-dir');
const sourceRepos = {
  catalog: 'https://github.com/EbookFoundation/free-programming-books',
  search: 'https://github.com/EbookFoundation/free-programming-books-search',
};
const errors = [];
let tempRoot;

function git(directory, ...command) {
  const result = spawnSync('git', command, { cwd: directory, encoding: 'utf8', timeout: 120000 });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${command.join(' ')} failed`).trim());
  return result.stdout.trim();
}
function stableId(value) { return createHash('sha256').update(value).digest('hex').slice(0, 24); }
function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    url.hash = '';
    return url.toString();
  } catch { return null; }
}
function cleanTitle(value) { return value.replace(/<[^>]*>/g, '').replace(/\\([\\`*_{}\[\]()#+.!|>-])/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(); }
function canonicalUrl(value) {
  try { const u = new URL(value); u.hash = ''; return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/$/, '')}${u.search}`; }
  catch { return value; }
}
function indexRows(root) {
  const result = [];
  function visit(node, kind = '', language = null, section = '', inheritedNotes = []) {
    if (!node || typeof node !== 'object') return;
    if (node.type && node.type !== 'root') kind = node.type;
    if (node.language) language = node.language;
    if (node.section) section = node.section;
    const entries = Array.isArray(node.entries) ? node.entries : [];
    for (const entry of entries) result.push({ ...entry, kind, language, section, isSubject: !!language?.isSubject });
    for (const nested of node.sections || []) visit(nested, kind, language, section, inheritedNotes);
    for (const nested of node.subsections || []) visit(nested, kind, language, section, inheritedNotes);
    for (const child of node.children || []) visit(child, kind, language, section, inheritedNotes);
  }
  visit(root);
  return result;
}
async function markdownFiles(directory) {
  const files = [];
  async function walk(path) {
    let entries;
    try { entries = await readdir(path, { withFileTypes: true }); }
    catch (error) { errors.push(`${path}: ${error.message}`); return; }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name.startsWith('.')) continue;
      const full = join(path, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) files.push(full);
    }
  }
  for (const name of ['books', 'courses', 'casts', 'more']) await walk(join(directory, name));
  return files;
}
function typeFor(kind, sourcePath, notes = []) {
  const path = sourcePath.toLowerCase();
  const note = notes.join(' ').toLowerCase();
  if (kind === 'courses') return 'course';
  if (kind === 'casts') return /screencast|video/.test(note) ? 'screencast' : 'podcast';
  if (kind === 'books') return 'book';
  if (/problem-sets|competitive-programming/.test(path)) return 'problem_set';
  if (/interactive/.test(path)) return 'interactive_tutorial';
  if (/playground/.test(path)) return 'playground';
  if (/cheat/.test(path)) return 'cheatsheet';
  if (/podcast|screencast/.test(path)) return /video|screencast/.test(note) ? 'screencast' : 'podcast';
  return 'reference';
}
function fromIndex(entry, sourcePath = null, sourceLine = null) {
  const url = normalizeUrl(String(entry.url || ''));
  const title = cleanTitle(String(entry.title || ''));
  if (!url || !title) return null;
  const notes = [...new Set((Array.isArray(entry.notes) ? entry.notes : []).filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean))];
  const kind = entry.kind || 'books';
  const resourceType = typeFor(kind, sourcePath || '', notes);
  const subjectMode = !!entry.isSubject;
  const language = !subjectMode && entry.language?.name && entry.language.name !== 'English' ? entry.language.name : (!subjectMode && entry.language?.name === 'English' ? 'English' : null);
  const section = cleanTitle(String(entry.section || '')) || null;
  const languages = language ? [language] : [];
  const subjects = subjectMode && section ? [section] : [];
  if (!subjectMode && section && section.toLowerCase() !== String(language || '').toLowerCase()) subjects.push(section);
  const licenseMatch = notes.join(' ').match(/\bCC\s*(?:BY|0|BY-SA|BY-NC|BY-ND)[\w .-]*/i);
  const license = licenseMatch ? licenseMatch[0].trim() : null;
  const key = `${canonicalUrl(url)}|${title.toLocaleLowerCase()}`;
  return {
    id: stableId(key), title, description: null, resourceType,
    languages, subjects, authors: entry.author ? [String(entry.author).trim()].filter(Boolean) : [],
    sourceRepository: sourceRepos.catalog, sourceUrl: url,
    sourceFile: sourcePath, sourceLine: sourceLine || null,
    catalogLicense: 'CC BY 4.0', contentLicense: license,
    notes, availability: 'external', difficulty: null,
    metadata: { catalogKind: kind, languageCode: entry.language?.code || null, section, searchIndexUpdatedDaily: true },
    _key: key,
  };
}
function markdownRow(line) {
  const match = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)?\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)(.*)$/);
  if (!match) return null;
  return { title: cleanTitle(match[1]), url: normalizeUrl(match[2]), suffix: match[3].trim() };
}
async function parseMarkdown(file, base, indexByUrl) {
  const text = await readFile(file, 'utf8');
  const relativePath = relative(base, file).split(/[\\/]/).join('/');
  let section = '';
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const heading = lines[i].match(/^#{2,4}\s+(.+?)\s*#*\s*$/);
    if (heading) { section = cleanTitle(heading[1]); continue; }
    const parsed = markdownRow(lines[i]);
    if (!parsed?.url || !parsed.title) continue;
    const candidates = indexByUrl.get(canonicalUrl(parsed.url)) || [];
    const match = candidates.find(item => cleanTitle(item.title).toLocaleLowerCase() === parsed.title.toLocaleLowerCase())
      || candidates.find(item => String(item.section || '').toLocaleLowerCase() === section.toLocaleLowerCase())
      || candidates[0];
    if (match) {
      rows.push(fromIndex(match, relativePath, i + 1));
      continue;
    }
    const fileKind = relativePath.split('/')[0];
    const kind = fileKind === 'books' ? 'books' : fileKind;
    const suffix = parsed.suffix.replace(/\[[^]]*]\([^)]*\)/g, '').replace(/[()_*`]/g, '').trim();
    const notes = [...suffix.matchAll(/\b(PDF|HTML|EPUB|ePub|eBook|MOBI|Kindle|CC BY(?:-[A-Z]+)?(?:\s*\d(?:\.\d)?)?)\b/gi)].map(m => m[0]);
    const authorText = suffix.replace(/\([^)]*\)/g, '').trim().replace(/\s*[-–—]\s*$/, '').trim();
    const author = authorText && authorText.length <= 140 && !/^(PDF|HTML|EPUB|ePub|MOBI|podcast|screencast)$/i.test(authorText) ? authorText : null;
    const entry = { url: parsed.url, title: parsed.title, author, notes, kind, section, language: null };
    rows.push(fromIndex(entry, relativePath, i + 1));
  }
  return rows;
}
function merge(a, b) {
  for (const key of ['languages', 'subjects', 'authors', 'notes']) a[key] = [...new Set([...a[key], ...b[key]])];
  if (!a.sourceFile && b.sourceFile) { a.sourceFile = b.sourceFile; a.sourceLine = b.sourceLine; }
  if (!a.contentLicense && b.contentLicense) a.contentLicense = b.contentLicense;
  return a;
}

try {
  if (!suppliedBooks || !suppliedSearch) {
    tempRoot = await mkdtemp(join(tmpdir(), 'blank-life-fpb-'));
    const booksPath = suppliedBooks ? resolve(suppliedBooks) : join(tempRoot, 'free-programming-books');
    const searchPath = suppliedSearch ? resolve(suppliedSearch) : join(tempRoot, 'free-programming-books-search');
    if (!suppliedBooks) git(tempRoot, 'clone', '--depth', '1', sourceRepos.catalog + '.git', booksPath);
    if (!suppliedSearch) git(tempRoot, 'clone', '--depth', '1', sourceRepos.search + '.git', searchPath);
    await importCatalog(booksPath, searchPath);
  } else {
    await importCatalog(resolve(suppliedBooks), resolve(suppliedSearch));
  }
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
}

async function importCatalog(booksPath, searchPath) {
  const indexPath = join(searchPath, 'fpb.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const indexed = indexRows(index);
  const indexByUrl = new Map();
  for (const row of indexed) {
    const url = normalizeUrl(String(row.url || ''));
    if (!url) continue;
    const key = canonicalUrl(url);
    if (!indexByUrl.has(key)) indexByUrl.set(key, []);
    indexByUrl.get(key).push(row);
  }
  const files = await markdownFiles(booksPath);
  const merged = new Map();
  let markdownCount = 0;
  for (const file of files) {
    try {
      const rows = await parseMarkdown(file, booksPath, indexByUrl);
      markdownCount += rows.length;
      for (const row of rows) {
        if (!row) continue;
        const prior = merged.get(row._key);
        if (prior) merge(prior, row); else merged.set(row._key, row);
      }
    } catch (error) { errors.push(`${relative(booksPath, file)}: ${error.message}`); }
  }
  let recoveredFromIndex = 0, invalid = 0;
  for (const row of indexed) {
    const resource = fromIndex(row);
    if (!resource) { invalid++; continue; }
    const prior = merged.get(resource._key);
    if (prior) merge(prior, resource);
    else { merged.set(resource._key, resource); recoveredFromIndex++; }
  }
  const resources = [...merged.values()].map(({ _key, ...resource }) => resource).sort((a, b) => a.title.localeCompare(b.title));
  const prior = await readFile(outputPath, 'utf8').then(JSON.parse).catch(() => []);
  const oldById = new Map(prior.map(x => [x.id, x]));
  const nextIds = new Set(resources.map(x => x.id));
  let added = 0, updated = 0, unchanged = 0;
  for (const resource of resources) {
    const old = oldById.get(resource.id);
    if (!old) added++;
    else if (JSON.stringify(old) !== JSON.stringify(resource)) updated++;
    else unchanged++;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  const tempOutput = `${outputPath}.${process.pid}.tmp`;
  await writeFile(tempOutput, `${JSON.stringify(resources)}\n`);
  await rename(tempOutput, outputPath);
  const report = {
    generatedAt: new Date().toISOString(),
    repositories: {
      catalog: { url: sourceRepos.catalog, commit: git(booksPath, 'rev-parse', 'HEAD'), license: 'CC BY 4.0' },
      search: { url: sourceRepos.search, commit: git(searchPath, 'rev-parse', 'HEAD'), license: 'BSD-2-Clause; no search-application code is copied' },
    },
    scannedMarkdownFiles: files.length, markdownRowsParsed: markdownCount,
    searchIndexRows: indexed.length, resourcesProcessed: resources.length,
    added, updated, unchanged, staleRecordsRetainedInDatabase: Math.max(0, prior.length - nextIds.size),
    recoveredFromSearchIndex: recoveredFromIndex, invalidIndexRows: invalid,
    importErrors: errors.slice(0, 100), additionalErrorCount: Math.max(0, errors.length - 100),
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
