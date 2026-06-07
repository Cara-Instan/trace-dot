<script setup lang="ts">
import { ref } from 'vue';
import SettingsSection from '../components/SettingsSection.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import Toast from '../components/Toast.vue';
import { useSettings } from '../composables/useSettings';
import { useElectroView } from '../composables/useRPC';

const { settings, resetToDefaults } = useSettings();
const { electroview } = useElectroView();

const confirmOpen = ref(false);
const confirmTitle = ref('');
const confirmDescription = ref('');
const confirmVariant = ref<'danger' | 'default'>('default');
let pendingConfirmAction: (() => void) | null = null;

function requestConfirm(title: string, description: string, variant: 'danger' | 'default', action: () => void) {
  confirmTitle.value = title;
  confirmDescription.value = description;
  confirmVariant.value = variant;
  pendingConfirmAction = action;
  confirmOpen.value = true;
}

function handleConfirm() {
  confirmOpen.value = false;
  pendingConfirmAction?.();
  pendingConfirmAction = null;
}

function handleCancel() {
  confirmOpen.value = false;
  pendingConfirmAction = null;
}

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');
const toastShow = ref(false);

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  toastShow.value = true;
}

async function doClearHistory() {
  try {
    await electroview.rpc?.request('historyClear', {});
    showToast('History cleared.');
  } catch {
    showToast('Failed to clear history.', 'error');
  }
}

function doResetDefaults() {
  resetToDefaults();
  showToast('Settings restored to defaults.');
}

function clearHistory() {
  requestConfirm(
    'Clear history',
    'This will permanently delete all operation history. Continue?',
    'danger',
    doClearHistory,
  );
}

function resetAll() {
  requestConfirm(
    'Reset to defaults',
    'This will restore all settings to their default values. Continue?',
    'danger',
    doResetDefaults,
  );
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Preferences</div>
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
    <p class="text-sm text-zinc-500 mt-1">Configure how Trace behaves on this device.</p>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">General</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <SettingsSection
          title="Notify on completion"
          description="Send a desktop notification when an operation finishes."
          type="toggle"
          :model-value="settings.notifyOnCompletion"
          @update:model-value="settings.notifyOnCompletion = $event as boolean"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">Appearance</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <SettingsSection
          title="Theme"
          description="Follows your system appearance by default."
          type="select"
          :model-value="settings.theme"
          :options="['System', 'Light', 'Dark']"
          @update:model-value="settings.theme = $event as 'System' | 'Light' | 'Dark'"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">Output</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Default save location</div>
            <div class="text-xs text-zinc-500 mt-0.5 font-mono">{{ settings.defaultSaveLocation }}</div>
          </div>
          <button class="px-3 py-1.5 text-xs border border-zinc-200 rounded-md hover:bg-zinc-50">Change…</button>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Default output format</div>
            <div class="text-xs text-zinc-500 mt-0.5">Used when merging without an explicit format choice.</div>
          </div>
          <select
            v-model="settings.defaultOutputFormat"
            class="text-sm border border-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
          >
            <option>PDF (standard)</option>
            <option>PDF/A (archival)</option>
          </select>
        </div>
        <SettingsSection
          title="Open output after creation"
          description="Reveal the new file in Finder / Explorer when done."
          type="toggle"
          :model-value="settings.openOutputAfterCreation"
          @update:model-value="settings.openOutputAfterCreation = $event as boolean"
        />
        <SettingsSection
          title="Overwrite protection"
          description="Ask before overwriting existing files with the same name."
          type="toggle"
          :model-value="settings.overwriteProtection"
          @update:model-value="settings.overwriteProtection = $event as boolean"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">Danger Zone</h2>
      <div class="border border-red-200 rounded-lg divide-y divide-red-200">
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Clear history</div>
            <div class="text-xs text-zinc-500 mt-0.5">Permanently delete all operation history records.</div>
          </div>
          <button
            class="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-md hover:bg-red-50"
            @click="clearHistory"
          >
            Clear
          </button>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Reset to defaults</div>
            <div class="text-xs text-zinc-500 mt-0.5">Restore all settings to their original values.</div>
          </div>
          <button
            class="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-md hover:bg-red-50"
            @click="resetAll"
          >
            Reset
          </button>
        </div>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">About</h2>
      <div class="border border-zinc-200 rounded-lg p-4">
        <div class="flex items-start gap-4">
          <img src="../assets/logo/logo.png" alt="Trace" class="w-12 h-12 rounded-lg shrink-0" />
          <div class="flex-1">
            <div class="text-sm font-semibold text-zinc-900">Trace</div>
            <div class="text-xs text-zinc-500 font-mono mt-0.5">v0.1.0 · build 2026.06.02</div>
            <div class="text-xs text-zinc-500 mt-2 leading-relaxed">An open-source desktop PDF utility built on Electrobun. Files never leave your device.</div>
            <div class="flex gap-3 mt-3 text-xs">
              <a href="https://github.com/Cara-Instan/trace-dot" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">View on GitHub</a>
              <a href="https://github.com/Cara-Instan/trace-dot/issues" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Report an issue</a>
              <a href="https://github.com/Cara-Instan/trace-dot/blob/main/LICENSE" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">MIT license</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <ConfirmDialog
    :open="confirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    :variant="confirmVariant"
    confirm-label="Confirm"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />

  <Toast
    :message="toastMessage"
    :type="toastType"
    :show="toastShow"
    @dismiss="toastShow = false"
  />
</template>
