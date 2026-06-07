<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();

defineEmits<{
  (e: 'done'): void;
}>();
</script>

<template>
  <div class="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
    <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
      <svg class="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
    <h2 class="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">{{ title }}</h2>
    <p class="text-sm text-zinc-500 mb-6">{{ description }}</p>
    <div class="bg-zinc-50 border border-zinc-200 rounded-lg px-5 py-4 mb-8 max-w-lg w-full mx-8">
      <slot />
    </div>
    <button
      @click="$emit('done')"
      class="px-6 py-2.5 text-sm font-medium bg-black text-white rounded-md hover:bg-zinc-800"
    >
      Done
    </button>
  </div>
</template>
