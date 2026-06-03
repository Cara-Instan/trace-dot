<script setup lang="ts">
defineProps<{
  name: string;
  size: string;
  pages: number;
}>();
</script>

<template>
  <div class="file-card border border-zinc-200 rounded-lg p-4 bg-white">
    <div class="flex items-start justify-between">
      <div class="w-9 h-11 rounded-sm bg-gradient-to-b from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center text-[10px] font-mono text-zinc-500">
        {{ pages }}p
      </div>
      <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500">pdf</span>
    </div>
    <div class="mt-3 text-sm font-medium truncate text-zinc-900">{{ name }}</div>
    <div class="text-xs text-zinc-500 mt-0.5 font-mono">{{ size }} · {{ pages }} pages</div>
  </div>
</template>