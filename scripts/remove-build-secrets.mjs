import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function removeDevVars(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeDevVars(path);
    } else if (entry.name === '.dev.vars' || entry.name.startsWith('.dev.vars.')) {
      await rm(path, { force: true });
    }
  }
}

await removeDevVars(fileURLToPath(new URL('../dist', import.meta.url)));
