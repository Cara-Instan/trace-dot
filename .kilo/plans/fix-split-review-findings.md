# Fix Split-Module Review Findings

## Summary

Address all 11 findings from the local uncommitted code review (8 warnings, 3 suggestions). Organized into 4 work phases by file proximity and risk: Bun-side bug fixes first, then renderer-side improvements, then cleanup.

---

## Phase 1: Bun-side bugs (service + PDF utility)

### 1.1 Sanitize fileName in splitLoadFileData
**File:** `src/bun/rpc/split/service.ts:15`
**Finding:** Unsanitized `params.fileName` in `path.join(tempDir, params.fileName)` — path separators allow writes outside tempDir; Windows reserved device names (NUL, CON, etc.) cause undefined behavior.
**Fix:** Strip path separators and reject/escape Windows reserved names before joining:
```typescript
const safeName = params.fileName
  .replace(/[/\\]/g, '_')
  .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i, '_$1');
const filePath = join(tempDir, safeName);
```

### 1.2 Add default case to mode switch
**File:** `src/bun/rpc/split/service.ts:118-137`
**Finding:** No `default` case in `switch(params.mode)`. If an unknown mode arrives, `config` is uninitialized and `splitPdf` throws `ReferenceError`.
**Fix:** Add after the `"every"` case:
```typescript
default:
  throw new Error("Unknown split mode: " + params.mode);
```

### 1.3 Isolate addHistory from splitPdf error path
**File:** `src/bun/rpc/split/service.ts:147-152`
**Finding:** `addHistory()` is inside the same `try` block as `splitPdf()`. A DB write failure after a successful split reports false error to the user.
**Fix:** Wrap in its own try/catch:
```typescript
try {
  addHistory("split", [params.filePath], outputFiles.map((f) => f.path),
    { mode: params.mode, pageCount: outputFiles.reduce((sum, f) => sum + f.pages.length, 0) });
} catch (e) {
  console.error("[splitExecute] history write failed:", e);
}
```

### 1.4 Clean up temp files after split completes
**File:** `src/bun/rpc/split/service.ts:14-16`
**Finding:** `splitLoadFileData` writes PDFs to temp dirs that are never cleaned up — unbounded disk leak.
**Fix:** Store the temp dir path in a module-level variable set by `splitLoadFileData`. In `splitExecute`'s `finally` block (after split completes), delete the temp dir:
```typescript
// At module scope
let currentTempDir: string | null = null;

// In splitLoadFileData, after writing:
currentTempDir = tempDir;

// In splitExecute's finally block:
if (currentTempDir) {
  try { fs.rmSync(currentTempDir, { recursive: true }); } catch {}
  currentTempDir = null;
}
```

### 1.5 Fix filenamePattern replaceAll
**File:** `src/bun/pdf/index.ts:59-61`
**Finding:** `String.replace("{name}", ...)` only replaces the first occurrence. Patterns like `{name}-{n}-{name}` produce partially applied filenames.
**Fix:** Use `.replaceAll()`:
```typescript
const fileName = filenamePattern
  .replaceAll("{name}", baseName)
  .replaceAll("{n}", String(i + 1).padStart(2, "0"));
```

### 1.6 Validate range bounds in resolvePageGroups
**File:** `src/bun/pdf/index.ts:88-93`
**Finding:** Range mode has no bounds validation. `start < 1` yields negative page indices (crash in `copyPages`). `start > end` yields empty page arrays (0-page PDF files written to disk).
**Fix:**
```typescript
case "range":
  return config.ranges
    .filter((r) => r.start >= 1 && r.start <= r.end)
    .map((r) => {
      const pages: number[] = [];
      for (let p = r.start; p <= r.end && p <= totalPages; p++) {
        pages.push(p);
      }
      return pages;
    })
    .filter((pages) => pages.length > 0);
```

### 1.7 Remove dead splitLoadFilePath handler
**File:** `src/bun/rpc/split/service.ts:32-47`, `src/bun/rpc/split/types.ts:14-22`
**Finding:** `splitLoadFilePath` is defined but never called from the renderer.
**Fix:** Remove the handler from `service.ts` and its type declaration from `types.ts`.

---

## Phase 2: Renderer-side improvements

### 2.1 Fix base64 encoding for large files
**File:** `src/mainview/views/SplitView.vue:99-105`
**Finding:** Byte-by-byte string concatenation for base64 encoding causes quadratic memory allocation for large PDFs.
**Fix:** Process in chunks to avoid building one massive intermediate string:
```typescript
const buffer = await file.arrayBuffer();
const bytes = new Uint8Array(buffer);
const CHUNK_SIZE = 8192;
let binary = '';
for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
  binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE));
}
const base64 = btoa(binary);
```

### 2.2 Optimize page grid class binding with Set
**File:** `src/mainview/views/SplitView.vue:277`
**Finding:** `selectedPages.includes(i)` in the `:class` binding is O(n) per page per render. For large PDFs, toggling one page re-evaluates all bindings.
**Fix:** Add a computed Set and use it in the template:
```typescript
const selectedPageSet = computed(() => new Set(selectedPages.value));
```
Then in template: `:class="selectedPageSet.has(i) ? ... : ..."`

### 2.3 Extract applySourceFile helper (dedup)
**File:** `src/mainview/views/SplitView.vue:74-78, 108-112`
**Finding:** `handleBrowse` and `handleDrop` duplicate the same 5-line state-reset block.
**Fix:** Extract helper:
```typescript
function applySourceFile(result: { filename: string; filePath: string; pageCount: number; fileSize: number }) {
  sourceFile.value = result;
  selectedPages.value = [];
  splitResult.value = null;
  error.value = null;
  pageRange.value = `1-${result.pageCount}`;
}
```

---

## Phase 3: Bun-side duplication fix

### 3.1 Extract shared buildFileResult helper
**File:** `src/bun/rpc/split/service.ts:11-75`
**Finding:** Three handlers (`splitLoadFileData`, `splitTriggerOpenFile`) duplicate metadata-fetch + response-construction. (`splitLoadFilePath` is removed in 1.7.)
**Fix:** After removing `splitLoadFilePath`, two handlers remain that share the pattern. Extract:
```typescript
async function buildFileResult(filePath: string, filename?: string) {
  const metadata = await getPdfMetadata(filePath);
  return {
    filename: filename ?? filePath.split(/[/\\]/).pop() ?? filePath,
    filePath,
    pageCount: metadata.pageCount,
    fileSize: metadata.fileSize,
  };
}
```
Then `splitLoadFileData` and `splitTriggerOpenFile` each call `buildFileResult(filePath, params.fileName)` / `buildFileResult(filePath)`.

---

## Phase 4: Optional improvements (low priority)

### 4.1 Remove orphaned onLogTest handler
**File:** `src/mainview/composables/useRPC.ts:29-31`
**Finding:** `onLogTest` handler remains but nothing sends this message anymore (sender was removed in the split service rewrite).
**Fix:** Remove the handler and its type from `shared/types.ts`.

### 4.2 Wire or remove Cancel button
**File:** `src/mainview/views/SplitView.vue:426`
**Finding:** Cancel button has no click handler in the fully-wired reactive component.
**Fix:** Either wire it to reset state (`sourceFile.value = null`) or remove it from the template.

---

## File Change Manifest

| File | Changes | Phase |
|---|---|---|
| `src/bun/rpc/split/service.ts` | Fix fileName sanitization, add default case, isolate addHistory, add temp cleanup, remove splitLoadFilePath, extract buildFileResult | 1, 3 |
| `src/bun/pdf/index.ts` | Fix replaceAll, add range validation | 1 |
| `src/bun/rpc/split/types.ts` | Remove splitLoadFilePath type | 1 |
| `src/mainview/views/SplitView.vue` | Chunked base64, Set-based class binding, extract applySourceFile | 2 |
| `src/mainview/composables/useRPC.ts` | Remove onLogTest handler | 4 |
| `src/shared/types.ts` | Remove onLogTest type | 4 |

## Verification

After all changes, run:
```bash
bunx vue-tsc --noEmit   # Typecheck
bun run start            # Build + launch to manually test split flow
```

Manual test matrix:
1. Browse → select PDF → split by selected pages → verify output files
2. Drag-and-drop PDF → split by range with invalid range (0-5, 10-3) → verify no crash, only valid ranges processed
3. Split by every-N → verify file count matches estimate
4. Verify temp files in `%TEMP%/trace-split-*` are deleted after split completes
5. Test filename pattern `{name}-part-{n}-{name}` → verify both `{name}` tokens are replaced
