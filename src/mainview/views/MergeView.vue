<script setup lang="ts">
import { ref } from 'vue';
import FileCard from '../components/FileCard.vue';
import MergeConfigFooter from '../components/MergeConfigFooter.vue';

const stagedFiles = ref([
  { name: 'handbook-2026.pdf', size: '2.4 MB', pages: 12 },
  { name: 'q4-financial-report.pdf', size: '1.8 MB', pages: 30 },
]);

const totalPages = 42;
const totalSize = '4.2 MB';
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 overflow-auto">
      <div class="flex items-end justify-between mb-6">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Step 1 of 2</div>
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Staged files</h1>
          <p class="text-sm text-zinc-500 mt-1">{{ stagedFiles.length }} PDFs · {{ totalPages }} pages total · {{ totalSize }} combined</p>
        </div>
        <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Clear all</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <FileCard
          v-for="file in stagedFiles"
          :key="file.name"
          :name="file.name"
          :size="file.size"
          :pages="file.pages"
        />
      </div>
    </div>
    <MergeConfigFooter v-if="stagedFiles.length > 0" />
  </div>
</template>