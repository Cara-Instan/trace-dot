# Fix: Timestamp "7h ago" Bug + Full-Screen Success Screen

## Bug 1: "Last op 7h ago" — Timezone Mismatch

### Root Cause
The SQLite database stores `created_at` as `datetime('now')`, which outputs UTC time **without** a timezone suffix (e.g., `2026-06-07 18:59:00`). When JavaScript's `new Date()` parses this string without a `Z` suffix, it interprets it as **local time** rather than UTC.

For a user in UTC+7 (WIB), a merge done "now" at local time 01:59 stores `2026-06-07 18:59:00` (UTC). JS parses that as local `18:59 WIB`, which is `+7h` from actual local time — hence "7h ago".

### Fix
**File: `src/mainview/utils/format.ts`** — In `getRelativeTime()`, append `'Z'` to the date string before parsing so UTC is correctly interpreted:

```ts
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  // ... rest unchanged
}
```

This is the minimal, non-breaking fix. It handles both old records (no Z) and any future records.

---

## Feature 2: Full-Screen Success Screen

### Current Behavior
After merge/split completes, a small green banner appears inline below the file list (`MergeView.vue:276-283`, `SplitView.vue:363-370`), then auto-redirects to home after 2 seconds.

### Desired Behavior
A full-view success overlay that covers the entire content area, showing:
- A large success icon/checkmark
- Operation type (Merge/Split complete)
- Output file details (path, size, pages)
- A "Done" button that navigates back to home
- Auto-redirect back to home after 3 seconds (replacing the current 2s redirect)

### Changes

#### 1. `src/mainview/views/MergeView.vue`
- Replace the inline green `<div>` (lines 276-283) with a full-overlay `fixed` or absolute-positioned success screen
- Remove auto-redirect `setTimeout`
- Add a "Done" button

Template structure:
```html
<div v-if="mergeResult" class="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
  <!-- Large checkmark icon -->
  <!-- "Merge Complete" heading -->
  <!-- File details -->
  <!-- Done button → router.push('/') -->
</div>
```

#### 2. `src/mainview/views/SplitView.vue`
- Same pattern: replace inline green banner (lines 363-370) with full-overlay success screen
- Remove auto-redirect `setTimeout`
- Add a "Done" button

---

## Files to Modify

| File | Change |
|---|---|
| `src/mainview/utils/format.ts` | Append `'Z'` to date string in `getRelativeTime` |
| `src/mainview/views/MergeView.vue` | Replace inline success div with full-screen overlay; remove auto-redirect |
| `src/mainview/views/SplitView.vue` | Replace inline success div with full-screen overlay; remove auto-redirect |

## Verification
1. Run `bunx vue-tsc --noEmit` for type checking
2. Test: perform a merge → "Last op" should show "just now" or "Xm ago" correctly
3. Test: complete a merge → full-screen success screen appears, not a small banner
4. Test: click "Done" → returns to home view
5. Test: same flow for split operations
