<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();
defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<template>
  <button
    type="button"
    class="relative w-9 h-5 rounded-full transition-colors"
    :class="modelValue ? 'bg-zinc-900' : 'bg-zinc-200'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
      :class="modelValue ? 'right-0.5' : 'left-0.5'"
    ></span>
  </button>
</template>