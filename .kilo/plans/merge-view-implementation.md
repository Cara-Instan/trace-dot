# MergeView Implementation Plan

## Current State Analysis

`MergeView.vue` is a **static UI mockup** with hardcoded data:
- `stagedFiles` is a hardcoded `ref` array with 2 entries
- `totalPages` / `totalSize` are hardcoded constants
- `MergeConfigFooter.vue` has hardcoded file list entries (not driven by props)
- No file drop/browse, no drag-to-reorder, no backend merge logic, no RPC service

The Split feature is the reference implementation — it demonstrates the full pattern:
renderer → RPC request → Bun service → pdf-lib operation → progress messages → history write.

## Goal

Make MergeView fully functional end-to-end: file drop/browse → stage multiple PDFs → reorder → configure per-file page ranges → pick output path/format → merge → progress → history.

---

## Phase 1: Backend — PDF Merge Utility

**File: `src/bun/pdf/index.ts`**

Add a `mergePdf` function alongside the existing `splitPdf`. It will:

1. Accept an array of `{ filePath: string; pageRange?: { start: number; end: number } }` entries and an output path.
2. Use `pdf-lib` `PDFDocument.load()` for each input, `copyPages()` for specified ranges, and `PDFDocument.create()` + `addPage()` to assemble.
3. Save the result via `Bun.write()`.
4. Call an optional `onProgress(current, total)` callback per file processed.
5. Return `{ outputPath: string; fileSize: number; pageCount: number }`.

**New types to add in `src/bun/pdf/index.ts`:**

```ts
export interface MergeFileInput {
  filePath: string;
  pageRange?: { start: number; end: number };
}

export interface MergeResult {
  outputPath: string;
  fileSize: number;
  pageCount: number;
}

export async function mergePdf(
  files: MergeFileInput[],
  outputPath: string,
  onProgress?: (current: number, total: number) => void,
): Promise<MergeResult>
```

---

## Phase 2: Backend — Merge RPC Types & Service

### 2a. Create `src/bun/rpc/merge/types.ts`

Following the exact pattern of `split/types.ts`:

```ts
import { RPCSchema } from "electrobun";

export type MergeBunRPCType = RPCSchema<{
  requests: {
    mergeLoadFileData: {
      params: { fileName: string; fileData: string };
      response: {
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      } | null;
    };
    mergeLoadMultipleFiles: {
      params: Array<{ fileName: string; fileData: string }>;
      response: Array<{
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      }>;
    };
    mergeTriggerOpenFiles: {
      params: {};
      response: Array<{
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      }> | null;
    };
    mergeTriggerOpenOutputDir: {
      params: {};
      response: string | null;
    };
    mergeExecute: {
      params: {
        files: Array<{
          filePath: string;
          pageRange?: { start: number; end: number };
        }>;
        outputPath: string;
        outputFilename: string;
      };
      response: {
        outputPath: string;
        fileSize: number;
        pageCount: number;
      };
    };
  };
  messages: {};
}>;
```

Key design decisions:
- **`mergeLoadFileData`** — single file via base64 (for drag-drop from webview, same pattern as split)
- **`mergeLoadMultipleFiles`** — batch version for dropping multiple files at once
- **`mergeTriggerOpenFiles`** — native file dialog with `allowsMultipleSelection: true` and multi-file accept
- **`mergeTriggerOpenOutputDir`** — same as split's directory picker
- **`mergeExecute`** — takes ordered file list with optional per-file page ranges, output path/filename

### 2b. Create `src/bun/rpc/merge/service.ts`

Following the pattern of `split/service.ts`:

```ts
export function createMergeRPCService() {
  return {
    mergeLoadFileData: async (params: { fileName: string; fileData: string }) => { ... },
    mergeLoadMultipleFiles: async (params: Array<{ fileName: string; fileData: string }>) => { ... },
    mergeTriggerOpenFiles: async () => { ... },
    mergeTriggerOpenOutputDir: async () => { ... },
    mergeExecute: async (params: { ... }) => { ... },
  };
}
```

Each method will:
- Write base64 data to temp files (for load methods)
- Use `Utils.openFileDialog()` with `allowsMultipleSelection: true` for file picker
- Call `mergePdf()` from `src/bun/pdf/index.ts` for execute
- Write to history via `addHistory("merge", ...)` after successful merge
- Clean up temp directories in `finally` blocks

---

## Phase 3: Wire Backend into Entry Point

### 3a. `src/shared/types.ts`

Add `MergeBunRPCType` to `MainRPCTypes`:

```ts
import { MergeBunRPCType } from "../bun/rpc/merge/types";

export type MainRPCTypes = {
  bun: {
    requests: SplitBunRPCType["requests"] & HistoryBunRPCType["requests"] & MergeBunRPCType["requests"];
    messages: SplitBunRPCType["messages"] & HistoryBunRPCType["messages"];
  };
  webview: RPCSchema<{
    requests: {};
    messages: {
      onSplitProgress: { current: number; total: number };
      onSplitError: { message: string };
    };
  }>;
};
```

**Add merge progress/error messages** to the webview messages type:

```ts
messages: {
  onSplitProgress: { current: number; total: number };
  onSplitError: { message: string };
  onMergeProgress: { current: number; total: number };
  onMergeError: { message: string };
};
```

### 3b. `src/bun/index.ts`

Import and spread the merge service:

```ts
import { createMergeRPCService } from "./rpc/merge/service";

// In BrowserView.defineRPC handlers:
requests: {
  ...createSplitRPCService(),
  ...createHistoryRPCService(),
  ...createMergeRPCService(),
},
```

Add merge message handlers to send progress/error to the webview (same pattern as split in `split/service.ts` lines 92-97).

---

## Phase 4: Frontend — RPC Composable Updates

**File: `src/mainview/composables/useRPC.ts`**

Add merge progress/error listener infrastructure (parallel to split):

```ts
type MergeProgressListener = (current: number, total: number) => void;
type MergeErrorListener = (message: string) => void;

let mergeProgressListeners: MergeProgressListener[] = [];
let mergeErrorListeners: MergeErrorListener[] = [];

export function onMergeProgress(listener: MergeProgressListener) { ... }
export function onMergeError(listener: MergeErrorListener) { ... }
```

Add message handlers in the `Electroview.defineRPC` config:

```ts
messages: {
  onSplitProgress: ...,
  onSplitError: ...,
  onMergeProgress: (msg) => {
    mergeProgressListeners.forEach((l) => l(msg.current, msg.total));
  },
  onMergeError: (msg) => {
    mergeErrorListeners.forEach((l) => l(msg.message));
  },
},
```

---

## Phase 5: Frontend — MergeView.vue Rewrite

Replace the static mockup with a fully functional component.

### State

```ts
const stagedFiles = ref<Array<{
  id: string;            // crypto.randomUUID()
  filename: string;
  filePath: string;
  pageCount: number;
  fileSize: number;
  pageRange: string;     // e.g. "1–12"
}>>([]);

const outputFilename = ref('merged-output.pdf');
const savePath = ref('');
const isProcessing = ref(false);
const progress = ref<{ current: number; total: number } | null>(null);
const error = ref<string | null>(null);
const mergeResult = ref<{ outputPath: string; fileSize: number; pageCount: number } | null>(null);
const isDragging = ref(false);
let dragCounter = 0;
```

### Computed properties

- `totalPages` — sum of page counts (or parsed from pageRange if user narrowed ranges)
- `totalSize` — formatted sum of file sizes
- `canMerge` — `stagedFiles.length > 0 && savePath.value && !isProcessing.value`

### Methods to implement

1. **`handleBrowse()`** — call `mergeTriggerOpenFiles` RPC, append results to `stagedFiles`
2. **`handleDrop(e: DragEvent)`** — read dropped files, base64-encode, call `mergeLoadMultipleFiles`, append to `stagedFiles`
3. **`handleDragEnter/Over/Leave`** — manage `isDragging` state (same pattern as SplitView)
4. **`removeFile(id)`** — remove from `stagedFiles` by id
5. **`clearAll()`** — empty `stagedFiles`
6. **`moveFile(fromIndex, toIndex)`** — reorder (for drag-to-reorder)
7. **`handleChooseOutputDir()`** — call `mergeTriggerOpenOutputDir` RPC
8. **`parsePageRange(range)`** — parse "1–12" into `{ start, end }`
9. **`handleMerge()`** — call `mergeExecute` RPC with ordered files + config

### Template structure

The template already has the correct layout from the mockup. Changes needed:
- Remove hardcoded data bindings → use `stagedFiles` computed values
- Add `@click` to "Clear all" button
- Make `MergeConfigFooter` receive props and emit events (or inline the footer in MergeView)
- Add drop zone overlay when `stagedFiles` is empty
- Add drag-to-reorder on file list items in footer
- Add progress bar and error display
- Add merge success result display

---

## Phase 6: Frontend — MergeConfigFooter.vue Rewrite

Convert from static to data-driven:

### Props

```ts
defineProps<{
  files: Array<{
    id: string;
    filename: string;
    fileSize: number;
    pageCount: number;
    pageRange: string;
  }>;
  outputFilename: string;
  savePath: string;
  isProcessing: boolean;
  progress: { current: number; total: number } | null;
  canMerge: boolean;
  fileCount: number;
}>();
```

### Emits

```ts
defineEmits<{
  (e: 'update:outputFilename', value: string): void;
  (e: 'update:savePath', value: string): void;
  (e: 'update:pageRange', id: string, value: string): void;
  (e: 'remove', id: string): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
  (e: 'pickOutputDir'): void;
  (e: 'merge'): void;
  (e: 'cancel'): void;
}>();
```

### Drag-to-reorder

Implement native HTML5 drag-and-drop on the file list rows:
- Each row gets `draggable="true"` and `@dragstart`, `@dragover`, `@drop` handlers
- Visual indicator on drop target (border highlight)
- Emit `reorder` event with from/to indices

---

## Phase 7: FileCard.vue Enhancement

Add optional `removable` prop and `remove` emit for when files are displayed as cards in the staged files grid:

```ts
defineProps<{
  name: string;
  size: string;
  pages: number;
  removable?: boolean;
}>();

defineEmits<{
  (e: 'remove'): void;
}>();
```

---

## Integration Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Electrobun RPC type registration** — adding new message types (`onMergeProgress`, `onMergeError`) to `MainRPCTypes` changes the shared type used by both processes | Medium | Both bun and webview define RPC with the same type; update both sides atomically. Build with `bunx vue-tsc --noEmit` to verify. |
| **Multiple file temp dir management** — merge needs to hold multiple temp files simultaneously | Low | Use a single temp dir per merge operation, write all files into it, clean up in `finally` block (same as split). |
| **Large file base64 encoding** — multiple large PDFs via base64 doubles memory | Medium | Process files sequentially in `mergeLoadMultipleFiles`; the webview already streams file data. For very large files, consider streaming in future. |
| **Page range validation** — user may enter invalid ranges (out of bounds, start > end) | Low | Validate ranges server-side in `mergeExecute`, clamp to valid page counts, reject invalid input with descriptive error. |
| **Drag-to-reorder in webview** — HTML5 DnD in Electron/Bun webview can be inconsistent | Medium | Use native HTML5 DnD as primary; test on target platform. If issues arise, implement mouse-based reordering as fallback. |
| **History write failure** — non-fatal but should not break merge | Low | Wrap `addHistory` in try/catch, log error, continue (same pattern as split). |

---

## Step-by-Step Execution Order

| Step | Files | Description |
|---|---|---|
| 1 | `src/bun/pdf/index.ts` | Add `MergeFileInput`, `MergeResult` types and `mergePdf()` function |
| 2 | `src/bun/rpc/merge/types.ts` | Create new file with `MergeBunRPCType` schema |
| 3 | `src/bun/rpc/merge/service.ts` | Create new file with `createMergeRPCService()` |
| 4 | `src/shared/types.ts` | Add `MergeBunRPCType` import + merge messages to `MainRPCTypes` |
| 5 | `src/bun/index.ts` | Import + spread `createMergeRPCService()` into handlers |
| 6 | `src/mainview/composables/useRPC.ts` | Add merge progress/error listeners + message handlers |
| 7 | `src/mainview/components/FileCard.vue` | Add optional `removable` prop + `remove` emit |
| 8 | `src/mainview/components/MergeConfigFooter.vue` | Rewrite as data-driven with props/emits, drag-to-reorder |
| 9 | `src/mainview/views/MergeView.vue` | Full rewrite: state, RPC integration, drop/browse, merge execution |
| 10 | Verify | Run `bunx vue-tsc --noEmit` to check types, then `bun run dev:hmr` to test |

---

## Dependency Impact

- **No new npm packages required** — `pdf-lib` already handles PDF merge; HTML5 DnD needs no library.
- **Existing `pdf-lib` dependency** (`^1.17.1`) supports `copyPages()` from multiple source documents — no version bump needed.
- **Existing `electrobun` dependency** (`1.18.1`) supports `allowsMultipleSelection` in `openFileDialog` — verified in split service usage pattern.
