import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const esbuild = require(path.join(root, '_tmp', 'runtime', 'node_modules', 'esbuild'));

await esbuild.build({
  entryPoints: [path.join(root, 'src', 'app.js')],
  bundle: true,
  format: 'esm',
  target: ['es2022'],
  outfile: path.join(root, 'app.js'),
  nodePaths: [path.join(root, '_tmp', 'runtime', 'node_modules')],
  legalComments: 'eof',
});
console.log('Built app.js with pinned local ODE dependency.');
