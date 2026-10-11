import { chmod, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { hostExecutablePermission } from "./HostExecutablePermission.js";
import { inventoryArtifact } from "../../tests/fixtures/artifactInventory.js";
import { createTestTempDirectory } from "../../tests/fixtures/temporaryDirectory.js";

/** Minimal PE image: a DOS `MZ` stub whose e_lfanew points at the PE signature. */
const minimalPe = (): Buffer => {
  const bytes = Buffer.alloc(68);
  bytes.write("MZ", 0, "ascii");
  bytes.writeUInt32LE(64, 0x3c);
  bytes.write("PE\0\0", 64, "ascii");
  return bytes;
};

const occurrenceExecutable = (
  inventory: Awaited<ReturnType<typeof inventoryArtifact>>,
  logicalPath: string,
): boolean | undefined =>
  inventory.occurrences.find(
    (occurrence) => occurrence.logical_path === logicalPath,
  )?.executable;

describe("host executable marking derivation", () => {
  it.each([
    ["tool.exe", true],
    ["TOOL.EXE", true],
    ["launch.com", true],
    ["script.bat", true],
    ["script.cmd", true],
    ["tool.dll", false],
    ["script.ps1", false],
    ["tool.exe.bak", false],
    ["tool", false],
    ["nested.d/tool", false],
  ] as const)(
    "reads %s on Windows from the launcher extension",
    (path, expected) => {
      expect(hostExecutablePermission("win32", path, 0o666)).toBe(expected);
    },
  );

  it.each([
    [0o755, true],
    [0o700, true],
    [0o644, false],
    [0o600, false],
  ] as const)(
    "keeps the permission bit for POSIX mode %s",
    (mode, expected) => {
      expect(hostExecutablePermission("linux", "payload.bin", mode)).toBe(
        expected,
      );
      expect(hostExecutablePermission("darwin", "payload.bin", mode)).toBe(
        expected,
      );
    },
  );
});

describe("host file occurrences", () => {
  it.runIf(process.platform === "win32")(
    "marks a launcher extension executable for roots and directory entries",
    async () => {
      const root = await createTestTempDirectory("rea-windows-executable-");
      const executablePath = join(root, "tool.exe");
      await writeFile(executablePath, minimalPe());
      await writeFile(join(root, "notes.txt"), "data");
      const direct = await inventoryArtifact(executablePath);
      expect(
        direct.occurrences.find(
          (occurrence) => occurrence.logical_path === ".",
        ),
      ).toMatchObject({
        artifact_kind: "executable",
        artifact_format: "pe",
        executable: true,
      });
      const directory = await inventoryArtifact(root);
      expect(occurrenceExecutable(directory, "tool.exe")).toBe(true);
      expect(occurrenceExecutable(directory, "notes.txt")).toBe(false);
    },
  );

  it.runIf(process.platform !== "win32")(
    "keeps the permission bit for file roots and directory entries",
    async () => {
      const root = await createTestTempDirectory("rea-posix-executable-");
      const scriptPath = join(root, "run.sh");
      await writeFile(scriptPath, "#!/bin/sh\n");
      await chmod(scriptPath, 0o755);
      await writeFile(join(root, "payload.bin"), "data");
      expect(
        occurrenceExecutable(await inventoryArtifact(scriptPath), "."),
      ).toBe(true);
      const directory = await inventoryArtifact(root);
      expect(occurrenceExecutable(directory, "run.sh")).toBe(true);
      expect(occurrenceExecutable(directory, "payload.bin")).toBe(false);
    },
  );
});
