# Plan: Refine `SettingsView.vue`

## 1. Current State Analysis

### What exists now
- `src/mainview/views/SettingsView.vue` — settings page with 4 sections: General, Appearance, Output, About
- `src/mainview/components/SettingsSection.vue` — reusable row component supporting `toggle`, `select`, `text` types
- `src/mainview/components/ToggleSwitch.vue` — standalone toggle component
- Settings are **ephemeral** (`ref()`) — no persistence, no backend RPC support
- Some rows use `SettingsSection`, others are **inline** (theme selector, default save location, default output format) — inconsistent

### Bugs / Issues in current code
1. **`SettingsSection` `select` type is broken** — renders buttons but has no `@click` handler and no emit wiring, so selecting an option does nothing.
2. **Inline theme selector duplicates `SettingsSection` select logic** — should use the component.
3. **No persistence** — settings reset on reload. No backend storage or `localStorage` bridge.
4. **No RPC support** — no bun-side handlers for settings get/set.

---

## 2. Removals

Remove these three settings (and their `ref` properties) entirely:

| Setting | Section | Action |
|---|---|---|
| `openAtLogin` | General | Remove `SettingsSection` block + ref property |
| `showInMenuBar` | General | Remove `SettingsSection` block + ref property |
| `windowVibrancy` | Appearance | Remove `SettingsSection` block + ref property |

After removal, the **General** section retains only "Notify on completion". The **Appearance** section retains only the theme selector. Consider merging the lone "Notify on completion" toggle into a renamed section or keeping it as-is for future expansion.

---

## 3. Structural Fixes

### 3a. Fix `SettingsSection` select type
Add `@click` emit wiring to the `select` buttons in `SettingsSection.vue`:
```vue
<button
  v-for="(opt, idx) in options"
  :key="opt"
  class="px-3 py-1.5 text-xs"
  :class="modelValue === opt ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
  @click="$emit('update:modelValue', opt)"
>
```

### 3b. Replace inline theme selector with `SettingsSection`
Convert the hand-rolled theme row in `SettingsView.vue` to use the `SettingsSection` component with `type="select"` and `:options="['System', 'Light', 'Dark']"`.

### 3c. Replace inline "Default save location" with `SettingsSection`
The current "Default save location" row is inline. Convert it to use `SettingsSection` with `type="text"`.

### 3d. Replace inline "Default output format" with native `<select>`
The current row uses a raw `<select>`. This is fine as-is since it's a dropdown (not a segmented control), but the `SettingsSection` `select` type renders as a button group, not a dropdown. Two options:
- **Option A**: Keep the inline `<select>` for the output format (it's more appropriate for 2+ options than a button group).
- **Option B**: Add a new `type="dropdown"` to `SettingsSection` that renders a native `<select>`.

**Recommendation**: Option A — keep it inline but clean up the markup to match the pattern of other `SettingsSection` rows.

---

## 4. Additional Settings Features

These are relevant for a desktop PDF utility:

### 4a. Default output directory (with folder picker)
Currently hardcoded to `~/Documents/Trace`. Wire up the "Change…" button to invoke an RPC call that opens a native folder picker dialog. Store the chosen path.

### 4b. Overwrite protection
Toggle: "Ask before overwriting existing files". Prevents accidental data loss when output filename collides.

### 4c. Filename template
Text input or select: configure the output filename pattern (e.g., `{original}_merged`, `{date}_{original}`, custom). Useful for power users.

### 4d. Clear history / Reset settings
Add a "Danger Zone" section at the bottom with:
- "Clear history" button (calls existing `historyClear` RPC if available, or adds one)
- "Reset to defaults" button

### 4e. Auto-update channel (informational)
Show the current update channel (dev/canary/stable) as read-only info. Not a toggle — set at build time.

---

## 5. Settings Persistence Strategy

### Current gap
Settings live only in a `ref()` — lost on every reload.

### Recommended approach
1. **Renderer side**: Use `localStorage` as the persistence layer. It's available in the WebView, requires no bun-side changes, and is simple.
2. **Composable**: Create `useSettings()` composable in `src/mainview/composables/useSettings.ts` that:
   - Initializes from `localStorage` with sensible defaults
   - Exposes reactive `settings` object
   - Auto-saves to `localStorage` via `watch()` with `{ deep: true }`
3. **Future**: If settings need to influence bun-side behavior (e.g., auto-update channel, actual open-at-login), add dedicated RPC handlers later. For now, renderer-only persistence covers the UI settings.

---

## 6. Proposed Final Structure

```
SettingsView.vue
├── General
│   └── Notify on completion (toggle)
├── Appearance
│   └── Theme: System / Light / Dark (select)
├── Output
│   ├── Default save location (text — shows path + "Change…" button)
│   ├── Default output format: PDF / PDF/A (dropdown)
│   ├── Open output after creation (toggle)
│   └── Overwrite protection (toggle)  ← NEW
├── Danger Zone
│   ├── Clear history (button)  ← NEW
│   └── Reset to defaults (button)  ← NEW
└── About
    ├── Logo + name + version
    ├── Description
    └── Links: "View on GitHub" → https://github.com/Cara-Instan/trace-dot, "Report an issue" → /issues, "MIT license"
```

---

## 7. Implementation Steps

### Step 1: Fix `SettingsSection.vue`
- Add `@click="$emit('update:modelValue', opt)"` to the select-type buttons.

### Step 2: Create `useSettings` composable
- File: `src/mainview/composables/useSettings.ts`
- Define defaults, read from `localStorage`, watch and persist.

### Step 3: Rewrite `SettingsView.vue`
- Import and use `useSettings()` instead of inline `ref()`.
- Remove `openAtLogin`, `showInMenuBar`, `windowVibrancy` from the settings object and template.
- Convert inline theme selector to `SettingsSection` with `type="select"`.
- Convert "Default save location" to `SettingsSection` with `type="text"`.
- Add "Overwrite protection" toggle to Output section.
- Add "Danger Zone" section with Clear history and Reset buttons.
- Update About section links:
  - "View on GitHub" → `https://github.com/Cara-Instan/trace-dot`
  - "Report an issue" → `https://github.com/Cara-Instan/trace-dot/issues`
  - "MIT license" → `https://github.com/Cara-Instan/trace-dot/blob/main/LICENSE`

### Step 4: Update About section links
- File: `src/mainview/views/SettingsView.vue`
- Replace the three `href="#"` links with real URLs:
  - "View on GitHub" → `https://github.com/Cara-Instan/trace-dot`
  - "Report an issue" → `https://github.com/Cara-Instan/trace-dot/issues`
  - "MIT license" → `https://github.com/Cara-Instan/trace-dot/blob/main/LICENSE`

### Step 5: Add `clearHistory` RPC handler (if not present)
- File: `src/bun/rpc/history/service.ts` — add `historyClear` handler.
- File: `src/bun/rpc/history/types.ts` — add type.
- File: `src/shared/types.ts` — include in `MainRPCTypes`.

### Step 6: Verify
- Run `bunx vue-tsc --noEmit` to check types.
- Manual test: open Settings, toggle switches, reload page, verify persistence.

---

## 8. Output Format Question

> Is the current output format (PDF/PDF/A select) necessary?

**Yes, it's worth keeping.** A PDF utility that supports merging benefits from offering PDF/A (archival) output — it's a meaningful differentiator. The implementation is a simple `<select>` with two options. If you want to defer it, you could mark it as "coming soon" but removing it entirely loses a useful feature for users who need archival-quality output.
