<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  message: string;
  type?: 'success' | 'error';
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

let timer: ReturnType<typeof setTimeout> | null = null;

watch(() => props.show, (val) => {
  if (timer) clearTimeout(timer);
  if (val) {
    timer = setTimeout(() => emit('dismiss'), 3000);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="show"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2"
        :class="type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-zinc-900 border-zinc-800 text-white'"
      >
        <svg v-if="type !== 'error'" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <svg v-else class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
