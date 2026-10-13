// Local-only production preview; never publishes or alters the build artifact.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../dist/happy-grad-sweetie/browser/', import.meta.url));
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml',
  '.mp3':'audio/mpeg', '.woff2':'font/woff2', '.ico':'image/x-icon'};
createServer(async (request,response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let file = path.resolve(root, '.'+name);
    if (file !== path.resolve(root) && !file.startsWith(path.resolve(root)+path.sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file=path.join(file,'index.html');
    const body=await readFile(file);
    response.writeHead(200, {'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
    response.end(body);
  } catch { response.writeHead(404);response.end('Not found'); }
}).listen(4203,'127.0.0.1',()=>console.log('Production preview http://127.0.0.1:4203/'));
