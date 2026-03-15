# ASSA V3.2 Node.js 迁移与归档计划

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan.

**Goal:** 将 ASSA 扩展的所有逻辑从 Python 迁移到 Node.js，并将原有的 Python 代码归档，以确保零依赖的可移植性。

**Architecture:** 保持 V3.2 架构不变，使用 Node.js 原生模块 (`fs`, `path`, `child_process`) 实现。

---

## Chunk 1: 基础设施与归档

### Task 1: 归档原有 Python 代码

**Files:**
- Create: `archive/python/`
- Move: `hooks/*.py`, `requirements.txt`, `tests/*.py`

- [ ] **Step 1: 创建归档目录并移动文件**
```bash
mkdir -p archive/python
mv hooks/*.py requirements.txt tests/*.py archive/python/
```

### Task 2: 更新插件清单 (`gemini-extension.json`)

**Files:**
- Modify: `gemini-extension.json`

- [ ] **Step 1: 将可执行命令改为 `node` 并指向新的 `.js` 文件**

---

## Chunk 2: Node.js 核心实现

### Task 3: 实现原生 Ledger 工具类

**Files:**
- Create: `hooks/ledgerUtils.js`

- [ ] **Step 1: 使用 `fs.mkdirSync` 实现原子文件锁逻辑**
- [ ] **Step 2: 实现 `loadLedger`, `saveLedger`, `markProcessed` 函数**

### Task 4: 重写钩子与工具

**Files:**
- Create: `hooks/beforeAgentHook.js`
- Create: `hooks/afterToolHook.js`
- Create: `hooks/toolSubmitSignal.js`

- [ ] **Step 1: 实现 `beforeAgentHook.js` (上下文路由 + 回滚逻辑)**
- [ ] **Step 2: 实现 `afterToolHook.js` (子代理非阻塞触发)**
- [ ] **Step 3: 实现 `toolSubmitSignal.js` (L1 信号捕捉)**

---

## Chunk 3: 验证与联调

### Task 5: 验证 Node.js 逻辑

- [ ] **Step 1: 更新并运行 `tests/manual_e2e_mock.sh`（改为调用 node）**
- [ ] **Step 2: 确认账本状态流转与 Context 注入正常**
