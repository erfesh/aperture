// Builds index.html from src/app.jsx and src/styles.css, and finds the images in art/.
// (dist/artifact.html is the same page without the <html> wrapper, for embedding.)
import { transformSync } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);

const jsx = fs.readFileSync(path.join(root, 'src/app.jsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const { code } = transformSync(jsx, { loader: 'jsx', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', target: 'es2020', minify: process.argv.includes('--min'), legalComments: 'inline' });

const artDir = path.join(root, 'art');
const art = {};
if (fs.existsSync(artDir)) for (const f of fs.readdirSync(artDir)) { const m = f.match(/^(.+)-(key|poster)\.(jpe?g|png|webp|avif)$/i); if (m) (art[m[1]] ||= {})[m[2]] = 'art/' + f; else if (/^avatar\.(jpe?g|png|webp)$/i.test(f)) art.__avatar = 'art/' + f; }

const head = `<title>Aperture Discovery</title>
<meta name="description" content="A streaming home screen that starts from your mood. A prototype by Erfan Kooshesh.">
<meta name="author" content="Erfan Kooshesh">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500&display=swap">
<style>
${css}
</style>`;
const body = `<!-- Aperture · designed and built by Erfan Kooshesh · erfesh.com · type "erf" on the page -->
<div id="ek-root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
<script>window.__EK_ART__ = ${JSON.stringify(art)};</script>
<script>
${code}
</script>`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/artifact.html'), head + '\n' + body + '\n');
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
console.log('built', Object.keys(art).length, 'art files,', (code.length / 1024).toFixed(1) + 'KB js');
