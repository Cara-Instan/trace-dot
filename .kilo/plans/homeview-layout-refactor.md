# Plan: Refactor HomeView.vue Layout

## Goal
Restructure `src/mainview/views/HomeView.vue` into a three-section vertical hierarchy:
1. **Quick Access** (top) — DropZone + Quick Start cards
2. **Usage Statistics** (middle) — Application usage metrics
3. **History Table** (bottom) — Recent operations list

---

## Current State

`HomeView.vue` (32 lines) contains:
- Welcome text header
- `DropZone` component
- Quick Start section with two `QuickStartCard` components (Merge, Split)

The existing `HistoryView.vue` has a full-page history table with hardcoded mock data, not wired to the real `historyList` RPC.

The DB layer (`src/bun/db/history.ts`) already provides `listHistory(limit)` and `getHistoryCount()`. The RPC layer (`src/bun/rpc/history/types.ts`) exposes `historyList` and `historyClear`.

---

## Plan

### Step 1 — Extract `HistoryTable.vue` component

**New file:** `src/mainview/components/HistoryTable.vue`

Extract the table markup from `HistoryView.vue` into a reusable component. Props:

```ts
defineProps<{
  items: Array<{
    id: number;
    operation: string;
    input_files: string;
    output_files: string;
    created_at: string;
    metadata: string | null;
  }>;
  compact?: boolean;  // omit some columns on home page
  showPagination?: boolean;
}>();
```

- When `compact` is true: hide the "Sources" sub-line and "Actions" column, and reduce the max rows displayed.
- When `showPagination` is false: omit the pagination footer.

### Step 2 — Create `UsageStats.vue` component

**New file:** `src/mainview/components/UsageStats.vue`

Displays a horizontal row of stat cards. This section is purely presentational for now (no RPC wiring required — the data can come from props or remain mock).

Stats to show:
- Total operations (count)
- Merges (count)
- Splits (count)
- Last operation time (relative)

Design: 4-column grid of small stat cards, each with a label and value. Follows the existing zinc/mono design language.

### Step 3 — Create `QuickAccess.vue` component

**New file:** `src/mainview/components/QuickAccess.vue`

Consolidates the current welcome header + DropZone + Quick start cards into a single named section. This keeps `HomeView.vue` as a pure layout shell.

Contents:
- Welcome text (heading + description)
- `DropZone`
- Quick Start grid (`QuickStartCard` × 2)

Props:
```ts
defineProps<{
  onBrowseFile: () => void;
}>();
```

### Step 4 — Rewrite `HomeView.vue` layout

**Modified file:** `src/mainview/views/HomeView.vue`

New structure:

```vue
<template>
  <div class="flex flex-col gap-10 max-w-4xl">
    <!-- 1. Quick Access -->
    <QuickAccess :on-browse-file="handleBrowseFile" />

    <!-- 2. Usage Statistics -->
    <UsageStats />

    <!-- 3. History Table -->
    <div>
      <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Recent Activity</div>
      <HistoryTable :items="recentHistory" compact />
    </div>
  </div>
</template>
```

- Remove inline DropZone/QuickStartCard markup (moved to `QuickAccess`)
- Add `ref` to fetch recent history via RPC on mount (`historyList` with `limit: 5`)
- Wire `handleBrowseFile` (kept in HomeView)

### Step 5 — Refactor `HistoryView.vue` to use shared `HistoryTable.vue`

**Modified file:** `src/mainview/views/HistoryView.vue`

Replace the inline table markup with `<HistoryTable :items="..." />`. Remove duplicated table HTML. Keep the header, search bar, and filter controls in `HistoryView.vue` — only the `<table>` and pagination are delegated.

This is optional but strongly recommended to avoid maintaining two copies of the same table.

---

## Files Changed

| File | Action |
|---|---|
| `src/mainview/components/HistoryTable.vue` | **Create** — reusable table component |
| `src/mainview/components/UsageStats.vue` | **Create** — stat cards row |
| `src/mainview/components/QuickAccess.vue` | **Create** — dropsheet + quick start consolidated |
| `src/mainview/views/HomeView.vue` | **Modify** — new 3-section vertical layout |
| `src/mainview/views/HistoryView.vue` | **Modify** — refactor to use `HistoryTable.vue` |

## Files NOT Changed

- No changes to DB layer, RPC layer, router, or other existing components.
- `QuickStartCard.vue`, `DropZone.vue`, `FileCard.vue` — used as-is inside new components.

## Design Notes

- All new components follow the existing Tailwind v4 + zinc color palette + `font-mono` uppercase label pattern.
- The `AppLayout.vue` main content area (`<main class="flex-1 overflow-auto p-8">`) provides scrolling, so HomeView sections can exceed viewport height.
- `max-w-4xl` on the HomeView container gives breathing room while keeping content readable.
- History data on HomeView will be fetched via `electroview.rpc?.request('historyList', { limit: 5 })` on `onMounted`.
