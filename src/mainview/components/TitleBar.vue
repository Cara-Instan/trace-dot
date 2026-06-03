<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="h-10 bg-zinc-50 border-b border-zinc-200 flex items-center px-4 shrink-0">
    <div class="flex gap-1.5">
      <span class="w-3 h-3 rounded-full bg-zinc-300"></span>
      <span class="w-3 h-3 rounded-full bg-zinc-300"></span>
      <span class="w-3 h-3 rounded-full bg-zinc-300"></span>
    </div>
    <div class="text-xs text-zinc-500 ml-auto font-mono tracking-tight">Pinch · {{ title }}</div>
  </div>
</template>