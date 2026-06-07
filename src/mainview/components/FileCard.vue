<script setup lang="ts">
defineProps<{
  name: string;
  size: string;
  pages: number;
  removable?: boolean;
}>();

defineEmits<{
  (e: 'remove'): void;
}>();
</script>

<template>
  <div class="file-card border border-zinc-200 rounded-lg p-4 bg-white relative">
    <div class="flex items-start justify-between">
      <div class="w-9 h-11 rounded-sm bg-gradient-to-b from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center text-[10px] font-mono text-zinc-500">
        {{ pages }}p
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500">pdf</span>
        <button
          v-if="removable"
          @click="$emit('remove')"
          class="text-zinc-400 hover:text-zinc-700 p-0.5 -m-0.5"
          aria-label="Remove"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="mt-3 text-sm font-medium truncate text-zinc-900">{{ name }}</div>
    <div class="text-xs text-zinc-500 mt-0.5 font-mono">{{ size }} · {{ pages }} pages</div>
  </div>
</template>