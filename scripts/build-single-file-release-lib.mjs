import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function buildSingleFileRelease({
  browserDir = path.resolve('dist/overlay/browser'),
  releaseDir = path.resolve('dist/overlay/release')
} = {}) {
  const sourceIndexPath = path.join(browserDir, 'index.html');
  const releaseIndexPath = path.join(releaseDir, 'index.html');
  const sourceIndex = await readFile(sourceIndexPath, 'utf8');

  let releaseHtml = sourceIndex;
  releaseHtml = await inlineStyles(releaseHtml, browserDir);
  releaseHtml = await inlineScripts(releaseHtml, browserDir);
  releaseHtml = await inlineImages(releaseHtml, browserDir);
  releaseHtml = await inlineAssetStringReferences(releaseHtml, browserDir);
  releaseHtml = withoutSourceMaps(releaseHtml);

  await rm(releaseDir, { recursive: true, force: true });
  await mkdir(releaseDir, { recursive: true });
  await writeFile(releaseIndexPath, releaseHtml, 'utf8');

  const releaseFiles = await listFiles(releaseDir);

  if (releaseFiles.length !== 1 || releaseFiles[0] !== releaseIndexPath) {
    throw new Error('Release directory must contain only index.html');
  }

  return releaseIndexPath;
}

export function isLocalAsset(value) {
  return !/^(https?:)?\/\//i.test(value) && !value.startsWith('data:');
}

export function collectNonceAttr(attrs) {
  const nonceMatch = attrs.match(/\snonce=(["'][^"']*["'])/i);
  return nonceMatch ? ` nonce=${nonceMatch[1]}` : '';
}

export async function replaceAsync(input, pattern, replacer) {
  const matches = Array.from(input.matchAll(pattern));
  if (matches.length === 0) {
    return input;
  }

  let result = '';
  let lastIndex = 0;

  for (const match of matches) {
    const [fullMatch, ...groups] = match;
    const start = match.index ?? 0;
    result += input.slice(lastIndex, start);
    result += await replacer(fullMatch, ...groups);
    lastIndex = start + fullMatch.length;
  }

  result += input.slice(lastIndex);
  return result;
}

export function withoutSourceMaps(html) {
  return html
    .replace(/\n?\/\/# sourceMappingURL=.*?(?=\n|$)/g, '')
    .replace(/\n?\/\*# sourceMappingURL=.*?\*\//g, '');
}

async function inlineStyles(html, browserDir) {
  const linkPattern = /<link([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;

  return replaceAsync(html, linkPattern, async (match, pre, mid, href, post) => {
    if (!isLocalAsset(href)) {
      return match;
    }

    const assetPath = path.join(browserDir, href);
    const css = await readFile(assetPath, 'utf8');
    return `<style data-release-inline="true"${collectNonceAttr(`${pre} ${mid} ${post}`)}>\n${css}\n</style>`;
  });
}

async function inlineScripts(html, browserDir) {
  const scriptPattern = /<script([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi;

  return replaceAsync(html, scriptPattern, async (match, pre, src, post) => {
    if (!isLocalAsset(src)) {
      return match;
    }

    const assetPath = path.join(browserDir, src);
    const script = await readFile(assetPath, 'utf8');
    const attrs = `${pre} ${post}`.replace(/\s*src=["'][^"']+["']/, '').trim();
    const normalizedAttrs = attrs ? ` ${attrs}` : '';
    return `<script${normalizedAttrs}>\n${script}\n</script>`;
  });
}

async function inlineImages(html, browserDir) {
  const imagePattern = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;

  return replaceAsync(html, imagePattern, async (match, pre, src, post) => {
    if (!isLocalAsset(src)) {
      return match;
    }

    const assetPath = path.join(browserDir, src);
    const dataUrl = await toDataUrl(assetPath);
    return `<img${pre}src="${dataUrl}"${post}>`;
  });
}

async function inlineAssetStringReferences(html, browserDir) {
  const assetPattern = /(["'])(assets\/[^"'?#]+\.(?:png|jpe?g|gif|svg|webp|ico))\1/gi;
  const cache = new Map();

  return replaceAsync(html, assetPattern, async (match, quote, assetPath) => {
    if (!isLocalAsset(assetPath)) {
      return match;
    }

    let dataUrl = cache.get(assetPath);
    if (!dataUrl) {
      dataUrl = await toDataUrl(path.join(browserDir, assetPath));
      cache.set(assetPath, dataUrl);
    }

    return `${quote}${dataUrl}${quote}`;
  });
}

async function toDataUrl(assetPath) {
  const buffer = await readFile(assetPath);
  const extension = path.extname(assetPath).toLowerCase();
  const mimeType = getMimeType(extension);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function getMimeType(extension) {
  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }

    const entryStat = await stat(fullPath);
    if (entryStat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
