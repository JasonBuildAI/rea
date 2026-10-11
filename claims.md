# REA parallel-agent claim registry

Append-only. One line per active work item; earliest ISO8601 timestamp wins.

Format: `- claim: <agent-id> | <ISO8601> | 旧PR: #<n|none> | 缺陷: <one line> | 文件: <paths> | issue: #<n 待回填>`
- claim: codex-6f2c | 2026-10-11T04:15:48Z | 旧PR: none | 缺陷: settleProcessCaptureJournal declares silence while already-due callbacks remain queued behind an event-loop stall, dropping trailing capture observations and flaking ProcessHarness.test.ts | 文件: src/process/capture/ProcessCaptureLifecycle.ts,src/process/capture/ProcessHarness.test.ts | issue: #1697 PR: #1700
- claim: codex-a7f3c9 | 2026-10-11T12:33:15Z | 旧PR: none | 缺陷: inspect-pe-resources rejects stock Windows resource images (imageres.dll.mun 6476, shell32.dll.mun 5903, wmploc.DLL.mun 5440 examined entries vs default max_entries 4096) | 文件: src/domain/native/peResources.ts,docs/binary-diagnostics.md | issue: #1702 PR: #1703
