/**
 * A module resolver that understands this project's import style, so a plain
 * `node` process can import files out of lib/ without Next in front of it.
 *
 *     node --import ./scripts/next-resolve-loader.mjs some-script.mjs
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NEEDED
 * ---------------------------------------------------------------------------
 * Source files here are written for the bundler, which resolves two things
 * node does not:
 *
 *   '@/lib/site-config'   the path alias from jsconfig.json, rooted at the
 *                         repository
 *   './club-serial'       a relative import with the extension left off
 *
 * Node's ESM resolver requires a full specifier and knows nothing about
 * jsconfig.json, so `import('./lib/warranty.js')` in a bare node process dies
 * on the first line of that file. Which means a test that wants to assert
 * what a module EXPORTS — rather than what its source text looks like — has
 * no way in.
 *
 * This closes that gap and nothing else. It is test tooling: nothing in the
 * app, the build or the runtime loads it, and it is not a dependency of any
 * of the three hosts.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 * It does not transform anything. JSX, CSS imports, `next/*` and React server
 * directives all still fail, because they should: a file that needs any of
 * those is a COMPONENT, and a component's behaviour is a question for a
 * rendered page (or a browser test), not for an import in a bare node
 * process. This exists for the plain-JavaScript modules under lib/ — config,
 * helpers, pure functions — where a fresh process is the only honest way to
 * re-evaluate module-level constants.
 */

import module from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The extensions a bundler would try, in the order it would try them. */
const EXTENSIONS = ['.js', '.mjs', '.jsx', '.json'];

function firstExisting(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
  for (const ext of EXTENSIONS) {
    const candidate = `${basePath}${ext}`;
    if (fs.existsSync(candidate)) return candidate;
  }
  for (const ext of EXTENSIONS) {
    const candidate = path.join(basePath, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // 1. The jsconfig.json alias. '@/lib/x' -> <repo>/lib/x
  if (specifier.startsWith('@/')) {
    const resolved = firstExisting(path.join(ROOT, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  // 2. Relative imports with the extension left off. Node is asked first, so
  //    anything it can already resolve keeps its normal behaviour — this only
  //    runs as a fallback, and only for './' and '../' specifiers.
  if (specifier.startsWith('.')) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      const parent = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : ROOT;
      const resolved = firstExisting(path.resolve(parent, specifier));
      if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
      throw error;
    }
  }

  return nextResolve(specifier, context);
}

// Self-registering, so the whole thing is one `--import` flag rather than a
// `--import`/`--loader` pair that has to stay in step.
if (!process.env.NEXT_RESOLVE_LOADER_REGISTERED) {
  process.env.NEXT_RESOLVE_LOADER_REGISTERED = '1';
  module.register(import.meta.url, import.meta.url);
}
