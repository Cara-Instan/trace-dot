# Plan: Refactor Merge & Split Initial View Components

## Context

The MergeView and SplitView both share the same "initial view" pattern: when no files are loaded, they render a centered drag-and-drop zone. The user wants:

1. **A descriptive text header above the drag-and-drop area** — providing context about what the operation does.
2. **A History section below the drag-and-drop area** — filtered to the relevant operation type (merge or split), showing recent history items.
3. **Auto-redirect back to HomeView after a successful operation** — once merge/split completes, the app should navigate back to `/`.

## Files to Modify

### 1. `src/mainview/views/MergeView.vue`

**Template changes (empty state / initial view):**
- Add a descriptive header block above the drag-and-drop zone (the `<template v-else>` block starting at line 266). The header should follow the existing design system pattern:
  - Uppercase mono label: `"Merge PDFs"`
  - Heading: `"Combine multiple PDFs into one"`
  - Subtitle: descriptive text like `"Drop multiple PDFs to merge them in any order. You can set per-file page ranges before merging."`
- Add a History section below the drag-and-drop zone, but only in the initial (empty) state. This section:
  - Has a small uppercase mono header: `"Recent merges"`
  - Uses the existing `HistoryTable` component with `compact` mode
  - Filters to show only `operation === 'merge'` items
  - Shows the last 5 merge history items

**Script changes:**
- Import `useRouter` from `vue-router` and `HistoryTable` component
- Import `HistoryItem` type
- Add `recentHistory` ref, populated via `historyList` RPC on mount
- Filter history to merge-only items
- After `mergeResult` is set successfully (inside `handleMerge`, after `mergeResult.value = result`), add a `setTimeout` (~2 seconds) then `router.push('/')` to redirect back to HomeView. Same for cancel button — redirect to home.

### 2. `src/mainview/views/SplitView.vue`

**Template changes (empty state / initial view):**
- Add a descriptive header block above the drag-and-drop zone (the `<template v-else>` block starting at line 293). Same pattern:
  - Uppercase mono label: `"Split PDF"`
  - Heading: `"Extract pages from any PDF"`
  - Subtitle: like `"Drop a single PDF to split it by page selection, ranges, or fixed intervals."`
- Add a History section below the drag-and-drop zone in the initial state:
  - Uppercase mono header: `"Recent splits"`
  - Uses `HistoryTable` with `compact` mode
  - Filters to only `operation === 'split'` items
  - Shows last 5 items

**Script changes:**
- Import `useRouter` from `vue-router` and `HistoryTable` component
- Import `HistoryItem` type
- Add `recentHistory` ref, populated via `historyList` RPC on mount, filtered to split-only
- After `splitResult` is set successfully (inside `handleSplit`), add a `setTimeout` (~2 seconds) then `router.push('/')` to redirect back to HomeView. Cancel button also redirects to home.

### 3. No backend changes needed

The `historyList` RPC already returns all history items. Filtering by operation type will happen client-side in the Vue component. No new RPC endpoints are required.

## Design Details

### Header Layout (both views)

```html
<div class="text-center mb-8">
  <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
    {{ operationLabel }}
  </div>
  <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ heading }}</h1>
  <p class="text-sm text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
    {{ description }}
  </p>
</div>
```

### History Section Layout (both views)

```html
<div class="mt-10">
  <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
    Recent {{ operationType }}s
  </div>
  <HistoryTable :items="recentHistory" compact />
</div>
```

### Auto-redirect Logic

After a successful merge/split:
```ts
if (result) {
  mergeResult.value = result; // or splitResult.value = ...
  setTimeout(() => {
    router.push('/');
  }, 2000);
}
```

The redirect is delayed ~2 seconds so the user can see the success message before being returned to HomeView.

## Implementation Order

1. Modify `MergeView.vue` — add header, history section, auto-redirect
2. Modify `SplitView.vue` — add header, history section, auto-redirect
3. Verify by running `bunx vue-tsc --noEmit` for type checking

## Validation

- Run `bunx vue-tsc --noEmit` to verify no type errors
- Visual inspection: both views should show a header above the drop zone, a history section below it, and auto-redirect after successful operations
