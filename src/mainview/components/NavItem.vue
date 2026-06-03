<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  name: string;
  path: string;
  icon: string;
  active: boolean;
}>();
</script>

<template>
  <RouterLink
    :to="path"
    class="nav-item flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm"
    :class="active ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <path :d="icon" />
    </svg>
    {{ name }}
  </RouterLink>
</template>