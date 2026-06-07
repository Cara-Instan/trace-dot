# Plan: Fix Merge Feature Review Findings

## Issues to Fix (5 total)

### 1. Path traversal in outputFilename (WARNING)
- **File:** `src/bun/rpc/merge/service.ts:124`
- **Problem:** `outputFilename` is used unsanitized in `path.join(params.outputPath, params.outputFilename)`
- **Fix:** Sanitize `outputFilename` by stripping path separators and `..` segments before joining
- **Location:** Add sanitization in `mergeExecute` handler before the `join()` call

### 2. Silent fallback on invalid page ranges (WARNING)
- **File:** `src/mainview/views/MergeView.vue:168-171`
- **Problem:** `parsePageRange()` returns `undefined` for invalid input, which causes `mergePdf()` to silently copy all pages
- **Fix:** Validate page range in `handleMerge()` — if user typed a non-empty invalid range, show an error instead of sending `undefined`
- **Location:** Add validation in `handleMerge()` after mapping files, before sending RPC call

### 3. Dead code: `mergeLoadFileData` (WARNING)
- **Files:** `src/bun/rpc/merge/service.ts:38-46`, `src/bun/rpc/merge/types.ts:5-12`
- **Problem:** `mergeLoadFileData` is defined but never called from renderer
- **Fix:** Remove from both service and types files

### 4. Duplicated `formatFileSize` (SUGGESTION)
- **Files:** `src/mainview/views/MergeView.vue:32-36`, `src/mainview/components/MergeConfigFooter.vue:37-41`
- **Fix:** Extract to `src/mainview/utils/format.ts`, import in both files

### 5. Duplicated `buildFileResult` (SUGGESTION)
- **Files:** `src/bun/rpc/merge/service.ts:11-18`, `src/bun/rpc/split/service.ts:11-18`
- **Fix:** Extract to `src/bun/rpc/utils.ts`, import in both services

## Execution Order

1. Create `src/mainview/utils/format.ts` with `formatFileSize` (fixes #4)
2. Create `src/bun/rpc/utils.ts` with `buildFileResult` (fixes #5)
3. Update `MergeView.vue` and `MergeConfigFooter.vue` to import from shared util (fixes #4)
4. Update `split/service.ts` and `merge/service.ts` to import from shared util (fixes #5)
5. Add path traversal sanitization in `mergeExecute` (fixes #1)
6. Add page range validation in `MergeView.vue` `handleMerge()` (fixes #2)
7. Remove `mergeLoadFileData` from `merge/service.ts` and `merge/types.ts` (fixes #3)
