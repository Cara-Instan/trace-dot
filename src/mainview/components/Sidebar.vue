<script setup lang="ts">
import { useRoute } from 'vue-router';
import NavItem from './NavItem.vue';

const route = useRoute();

const pdfSuiteNav = [
  { name: 'Home', path: '/', icon: 'home' },
  { name: 'Merge', path: '/merge', icon: 'merge' },
  { name: 'Split', path: '/split', icon: 'split' },
];

const workspaceNav = [
  { name: 'History', path: '/history', icon: 'history' },
  { name: 'Settings', path: '/settings', icon: 'settings' },
];

const getIcon = (icon: string) => {
  const icons: Record<string, string> = {
    home: 'M3 11l9-8 9 8M5 10v10h14V10',
    merge: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    split: 'M12 3v18M3 8l9 5 9-5',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
    settings: 'M12 3a9 9 0 1 0 0 18 1.7 1.7 0 0 0 0-3.6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  };
  return icons[icon] || '';
};

const isActive = (path: string) => route.path === path;
</script>

<template>
  <aside class="w-56 border-r border-zinc-200 bg-white p-3 shrink-0 flex flex-col">
    <div class="flex items-center gap-2 px-2 py-1.5 mb-4">
      <img src="../assets/logo/logo.png" alt="Trace" class="w-6 h-6 rounded-md" />
      <span class="text-sm font-semibold tracking-tight">Trace</span>
    </div>
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 px-2">PDF Suite</div>
    <nav class="space-y-0.5">
      <NavItem
        v-for="item in pdfSuiteNav"
        :key="item.path"
        :name="item.name"
        :path="item.path"
        :icon="getIcon(item.icon)"
        :active="isActive(item.path)"
      />
    </nav>
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 mt-6 px-2">Workspace</div>
    <nav class="space-y-0.5">
      <NavItem
        v-for="item in workspaceNav"
        :key="item.path"
        :name="item.name"
        :path="item.path"
        :icon="getIcon(item.icon)"
        :active="isActive(item.path)"
      />
    </nav>
    <div class="mt-auto px-2 py-2 text-[10px] font-mono text-zinc-400">v0.1.0 · on-device</div>
  </aside>
</template>