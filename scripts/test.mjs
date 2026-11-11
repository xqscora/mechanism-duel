import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const esbuild = require(path.join(root, '_tmp', 'runtime', 'node_modules', 'esbuild'));
const bundledTests = path.join(root, '_tmp', 'model.test.mjs');

await esbuild.build({
  entryPoints: [path.join(root, 'tests', 'model.test.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'bundle',
  external: ['node:*'],
  outfile: bundledTests,
  nodePaths: [path.join(root, '_tmp', 'runtime', 'node_modules')],
});
const result = spawnSync(process.execPath, ['--test', bundledTests], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
