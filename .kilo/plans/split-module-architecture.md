# Split-PDF Module — Implementation Plan

## Decisions Confirmed

| Decision | Choice |
|---|---|
| PDF library | `pdf-lib` |
| Thumbnail rendering | Bun-side (base64 via RPC) |
| Split modes | All three (selected pages, by range, every N pages) |
| Output location | Configurable path |

---

## Current State Analysis

### What Exists

| Layer | File | Status |
|---|---|---|
| **RPC Types** | `src/bun/rpc/split/types.ts` | Partially defined — `splitTriggerOpenFile` request exists; `SplitWebviewRPCType` is empty |
| **RPC Service** | `src/bun/rpc/split/service.ts` | Stub with bugs — file dialog opens but return logic is inverted, no actual PDF splitting |
| **View** | `src/mainview/views/SplitView.vue` | Static mockup — all data hardcoded, zero RPC integration |
| **Shared Types** | `src/shared/types.ts` | Correctly composes split types into `MainRPCTypes` |
| **Renderer RPC** | `src/mainview/composables/useRPC.ts` | Functional — `useElectroView()` composable ready for use |
| **Main Process** | `src/bun/index.ts` | Correctly spreads `createSplitRPCService()` into handlers |

### Reference Implementation
The **history module** (`src/bun/rpc/history/`) is the gold standard:
- `types.ts`: Full typed request/response schemas
- `service.ts`: Clean service function delegating to DB layer

### Known Bug
`src/bun/rpc/split/service.ts:31-34` — return logic is inverted:
```typescript
// BROKEN: returns data when NO file selected
if (!file) { return { filename, fileId }; }
else { return { filename: "", fileId: -1 }; }
```

---

## Target RPC Schema

### Bun Requests (renderer → bun)

| Method | Params | Response | Purpose |
|---|---|---|---|
| `splitTriggerOpenFile` | `{}` | `{ filename, filePath, pageCount, fileSize }` | Open native file dialog, return metadata |
| `splitGetThumbnails` | `{ filePath, pageIndices }` | `{ thumbnails: Record<number, string> }` | Get base64 page thumbnails for grid |
| `splitExecute` | `{ filePath, mode, pages, range, interval, filenamePattern, outputPath }` | `{ outputFiles: Array<{ name, path, size, pages }> }` | Execute the split operation |

### Bun Messages (bun → renderer)

| Message | Payload | Purpose |
|---|---|---|
| `onSplitProgress` | `{ current: number, total: number }` | Progress updates during split |
| `onSplitError` | `{ message: string }` | Error notification |

### Renderer Requests (bun → renderer)

| Method | Params | Response |
|---|---|---|
| `onLogTest` | `{ message: string }` | Existing test handler (kept for debugging) |

---

## State Management Design

```
SplitView.vue (ref: sourceFile, selectedPages, splitMode, ...)
  ├── sourceFile: ref<{ name, path, pageCount, size } | null>
  ├── selectedPages: ref<number[]>([])
  ├── splitMode: ref<'selected' | 'range' | 'every'>('selected')
  ├── pageRange: ref('1-5, 6-10')
  ├── everyN: ref(5)
  ├── filenamePattern: ref('{name}-{n}.pdf')
  ├── outputPath: ref('')
  ├── thumbnails: ref<Record<number, string>>({})
  ├── isProcessing: ref(false)
  └── splitResult: ref<OutputFile[] | null>
```

**Flow**:
1. "Browse" → `splitTriggerOpenFile` → populate `sourceFile` + load thumbnails
2. User selects pages / configures mode
3. "Split" → `splitExecute` → progress via `onSplitProgress` → show result
4. On complete → optionally call `historyAdd` (from existing history RPC)

---

## Implementation Phases

### Phase 1: Dependencies + Bug Fix
- **`package.json`**: Add `pdf-lib`
- **`src/bun/rpc/split/service.ts`**: Fix inverted return logic

### Phase 2: PDF Utility Layer
- **Create `src/bun/pdf/index.ts`**: PDF utility functions
  - `getPdfMetadata(filePath)` → `{ pageCount, fileSize }`
  - `getPageThumbnails(filePath, indices, width, height)` → `Record<number, string>` (base64 PNG)
  - `splitPdf(filePath, config)` → `OutputFile[]`

### Phase 3: RPC Schema Expansion
- **`src/bun/rpc/split/types.ts`**: Define full `SplitBunRPCType` and `SplitWebviewRPCType`
- **`src/shared/types.ts`**: Add `onSplitProgress` and `onSplitError` to webview messages

### Phase 4: Service Implementation
- **`src/bun/rpc/split/service.ts`**: Rewrite with full implementations:
  - `splitTriggerOpenFile` — open dialog, read PDF metadata
  - `splitGetThumbnails` — render pages to base64
  - `splitExecute` — perform split, send progress messages

### Phase 5: Renderer Integration
- **`src/mainview/composables/useRPC.ts`**: Add `onSplitProgress` and `onSplitError` handlers
- **`src/mainview/views/SplitView.vue`**: Complete rewrite
  - Replace all hardcoded data with reactive state
  - Wire Browse button → `splitTriggerOpenFile`
  - Load thumbnails → `splitGetThumbnails`
  - Wire Split button → `splitExecute`
  - Show progress during operation
  - Handle errors
  - Update button label dynamically based on mode/selection

### Phase 6: History Integration
- On split completion, call existing `historyAdd` RPC to log the operation

---

## File Change Manifest

| File | Action | Phase |
|---|---|---|
| `package.json` | Edit — add `pdf-lib` | 1 |
| `src/bun/rpc/split/service.ts` | Edit — fix bugs, full rewrite | 1, 4 |
| `src/bun/pdf/index.ts` | Create — PDF utility layer | 2 |
| `src/bun/rpc/split/types.ts` | Edit — expand RPC schema | 3 |
| `src/shared/types.ts` | Edit — add message types | 3 |
| `src/mainview/composables/useRPC.ts` | Edit — add message handlers | 5 |
| `src/mainview/views/SplitView.vue` | Edit — full rewrite with RPC | 5 |

---

## Risk Notes

1. **Thumbnail generation may be slow** for large PDFs. Consider lazy-loading thumbnails (only first 12 initially, load more on scroll).
2. **`pdf-lib` cannot render pages to images natively** — it can only manipulate PDF structure. For thumbnails, we need either `@pdf-lib/pdfjs` or a separate rendering step. May need to reconsider thumbnail strategy — possibly use numbered placeholders (as the mockup currently does) for the initial implementation and add real thumbnails later.
3. **Configurable output path** requires either a native directory picker or a text input. Recommend a "Choose folder" button using `Utils.openDirectoryDialog` (similar to file dialog pattern).
4. **Progress messaging** requires the `splitExecute` request to be non-blocking — the service fires off the operation and sends messages, then resolves when complete.
