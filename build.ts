/**
 * Remove old files, copy front-end ones.
 */

import fs from "fs-extra";
import logger from "jet-logger";
import childProcess from "child_process";

// Start
(async () => {
  try {
    // Remove current build
    await remove("./dist/");

    await exec("tsc --build tsconfig.prod.json", "./");
  } catch (err) {
    logger.err(err);
  }
})();

/**
 * Remove file
 */
function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err: any) => {
      return !!err ? rej(err) : res();
    });
  });
}

/**
 * Execute system command
 */
function exec(cmd: string, loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (!!stdout) {
        logger.info(stdout);
      }
      if (!!stderr) {
        logger.warn(stderr);
      }
      return !!err ? rej(err) : res();
    });
  });
}
