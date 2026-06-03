<script setup lang="ts">
import DropZone from '../components/DropZone.vue';
import QuickStartCard from '../components/QuickStartCard.vue';

const mergeIcon = 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z';
const splitIcon = 'M12 3v18M3 8l9 5 9-5';
</script>

<template>
  <div class="max-w-2xl">
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Welcome back</div>
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Drop PDFs to start.</h1>
    <p class="text-sm text-zinc-500 mt-1.5 leading-relaxed">Pinch works entirely on-device. Your files never leave your machine — merge, split, and reorganize without an upload.</p>
  </div>
  <DropZone class="mt-6" />
  <div class="mt-10">
    <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Quick start</div>
    <div class="grid grid-cols-2 gap-3">
      <QuickStartCard title="Merge PDFs" subtitle="Combine multiple files in any order, with per-file page ranges." :icon="mergeIcon" href="/merge" />
      <QuickStartCard title="Split a PDF" subtitle="Extract page ranges, every-N pages, or split into single-page files." :icon="splitIcon" href="/split" />
    </div>
  </div>
</template>