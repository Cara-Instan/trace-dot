<script setup lang="ts">
import { useRoute } from 'vue-router';
import TitleBar from './TitleBar.vue';
import Sidebar from './Sidebar.vue';

const route = useRoute();

const viewTitles: Record<string, string> = {
  '/': 'Home',
  '/merge': 'Merge',
  '/split': 'Split',
  '/history': 'History',
  '/settings': 'Settings',
};

const currentTitle = viewTitles[route.path] || 'Home';
</script>

<template>
  <div class="w-full max-w-6xl h-[720px] bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col">
    <TitleBar :title="currentTitle" />
    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>