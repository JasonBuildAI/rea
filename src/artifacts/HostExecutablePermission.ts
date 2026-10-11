import { win32 } from "node:path";

/**
 * Windows has no POSIX execute permission: `fs.stat` reports 0o666 for every
 * writable file (0o444 when read-only), so a mode-bit test marks every host
 * file non-executable, including real PE images. Windows marks launchable files
 * by extension instead, so host files follow the launcher convention there and
 * the permission bit everywhere else.
 */
const WINDOWS_LAUNCHER_EXTENSIONS = new Set([".exe", ".com", ".bat", ".cmd"]);

/** Report whether a host file carries its platform's executable marking. */
export const hostExecutablePermission = (
  platform: NodeJS.Platform,
  path: string,
  mode: number,
): boolean =>
  platform === "win32"
    ? WINDOWS_LAUNCHER_EXTENSIONS.has(win32.extname(path).toLowerCase())
    : (mode & 0o111) !== 0;
