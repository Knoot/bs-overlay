import { buildSingleFileRelease } from './build-single-file-release-lib.mjs';

const releaseIndexPath = await buildSingleFileRelease();
console.log(`Single-file release generated: ${releaseIndexPath}`);
