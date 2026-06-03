<script setup lang="ts">
import { ref } from 'vue';
import SettingsSection from '../components/SettingsSection.vue';

const settings = ref({
  openAtLogin: true,
  showInMenuBar: true,
  notifyOnCompletion: false,
  theme: 'System',
  windowVibrancy: false,
  openOutputAfterCreation: true,
});
</script>

<template>
  <div class="max-w-3xl">
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Preferences</div>
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
    <p class="text-sm text-zinc-500 mt-1">Configure how Pinch behaves on this device.</p>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">General</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <SettingsSection
          title="Open at login"
          description="Launch Pinch in the menu bar / system tray when you sign in."
          type="toggle"
          :model-value="settings.openAtLogin"
          @update:model-value="settings.openAtLogin = $event"
        />
        <SettingsSection
          title="Show in menu bar"
          description="Quick access from the macOS menu bar / Windows tray."
          type="toggle"
          :model-value="settings.showInMenuBar"
          @update:model-value="settings.showInMenuBar = $event"
        />
        <SettingsSection
          title="Notify on completion"
          description="Send a desktop notification when an operation finishes."
          type="toggle"
          :model-value="settings.notifyOnCompletion"
          @update:model-value="settings.notifyOnCompletion = $event"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">Appearance</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Theme</div>
            <div class="text-xs text-zinc-500 mt-0.5">Follows your system appearance by default.</div>
          </div>
          <div class="flex border border-zinc-200 rounded-md overflow-hidden">
            <button
              v-for="theme in ['System', 'Light', 'Dark']"
              :key="theme"
              class="px-3 py-1.5 text-xs"
              :class="settings.theme === theme ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
              @click="settings.theme = theme"
            >
              {{ theme }}
            </button>
          </div>
        </div>
        <SettingsSection
          title="Window vibrancy"
          description="macOS only · lets the desktop show through the chrome."
          type="toggle"
          :model-value="settings.windowVibrancy"
          @update:model-value="settings.windowVibrancy = $event"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">Output</h2>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Default save location</div>
            <div class="text-xs text-zinc-500 mt-0.5 font-mono">~/Documents/Pinch</div>
          </div>
          <button class="px-3 py-1.5 text-xs border border-zinc-200 rounded-md hover:bg-zinc-50">Change…</button>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <div>
            <div class="text-sm font-medium text-zinc-900">Default output format</div>
            <div class="text-xs text-zinc-500 mt-0.5">Used when merging without an explicit format choice.</div>
          </div>
          <select class="text-sm border border-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400">
            <option>PDF (standard)</option>
            <option>PDF/A (archival)</option>
          </select>
        </div>
        <SettingsSection
          title="Open output after creation"
          description="Reveal the new file in Finder / Explorer when done."
          type="toggle"
          :model-value="settings.openOutputAfterCreation"
          @update:model-value="settings.openOutputAfterCreation = $event"
        />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-sm font-semibold text-zinc-900 mb-3">About</h2>
      <div class="border border-zinc-200 rounded-lg p-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-black text-white text-lg font-bold flex items-center justify-center shrink-0">P</div>
          <div class="flex-1">
            <div class="text-sm font-semibold text-zinc-900">Pinch</div>
            <div class="text-xs text-zinc-500 font-mono mt-0.5">v0.1.0 · build 2026.06.02</div>
            <div class="text-xs text-zinc-500 mt-2 leading-relaxed">An open-source desktop PDF utility built on Electrobun. Files never leave your device.</div>
            <div class="flex gap-3 mt-3 text-xs">
              <a href="#" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">View on GitHub</a>
              <a href="#" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Report an issue</a>
              <a href="#" class="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">MIT license</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>