# Core Implementation Plan (ASSA V3.2 - Node.js)

**Goal:** Implement the foundational L1/L2/L3 architecture using zero-dependency Node.js.

---

### Phase 1: Node.js Foundation
- [x] Task: Archive legacy Python implementation
- [x] Task: Scaffold `gemini-extension.json` with Node.js hooks
- [x] Task: Implement `hooks/ledgerUtils.js` with atomic locking
- [x] Task: Implement `hooks/toolSubmitSignal.js` for signal capture

### Phase 2: Intelligence & State
- [x] Task: Implement `hooks/beforeAgentHook.js` (Rewind & Context)
- [x] Task: Implement `hooks/afterToolHook.js` (Git Interception)
- [x] Task: Create robust sub-agent prompts in `agents/`
- [x] Task: Synchronize Evolution (Refactored to asynchronous subagent dispatch)

### Phase 3: Finalization & E2E
- [x] Task: Verify with manual E2E mock (`tests/manual_e2e_mock.sh`)
- [x] Task: Create Local Symlink for Installation (Verified via extension loading)
- [x] Task: Document `/assa promote` command in `commands/` (Implemented via Syncer trigger)
