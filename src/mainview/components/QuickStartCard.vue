<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}>();
</script>

<template>
  <RouterLink
    :to="href"
    class="group block border border-zinc-200 rounded-lg p-4 hover:border-zinc-400 transition-colors"
  >
    <div class="flex items-center justify-between">
      <div class="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path :d="icon" />
        </svg>
      </div>
      <svg class="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </div>
    <div class="mt-3 text-sm font-medium text-zinc-900">{{ title }}</div>
    <div class="text-xs text-zinc-500 mt-0.5">{{ subtitle }}</div>
  </RouterLink>
</template>