<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="$emit('cancel')" />
        <div class="relative bg-white rounded-lg shadow-xl border border-zinc-200 w-full max-w-sm mx-4 p-5">
          <h3 class="text-sm font-semibold text-zinc-900">{{ title }}</h3>
          <p class="text-sm text-zinc-500 mt-1.5 leading-relaxed">{{ description }}</p>
          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-3.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200 hover:bg-zinc-50"
              @click="$emit('cancel')"
            >
              {{ cancelLabel ?? 'Cancel' }}
            </button>
            <button
              class="px-3.5 py-1.5 text-xs font-medium rounded-md"
              :class="variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'"
              @click="$emit('confirm')"
            >
              {{ confirmLabel ?? 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
