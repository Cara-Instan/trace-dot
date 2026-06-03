<script setup lang="ts">
import ToggleSwitch from './ToggleSwitch.vue';

defineProps<{
  title: string;
  description?: string;
  type?: 'toggle' | 'select' | 'text';
  modelValue?: boolean | string;
  options?: string[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean | string): void;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3">
    <div>
      <div class="text-sm font-medium text-zinc-900">{{ title }}</div>
      <div v-if="description" class="text-xs text-zinc-500 mt-0.5">{{ description }}</div>
    </div>
    <div v-if="type === 'toggle'">
      <ToggleSwitch
        :model-value="modelValue as boolean"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
    <div v-else-if="type === 'select' && options" class="flex border border-zinc-200 rounded-md overflow-hidden">
      <button
        v-for="(opt, idx) in options"
        :key="opt"
        class="px-3 py-1.5 text-xs"
        :class="modelValue === opt ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
      >
        {{ opt }}
      </button>
    </div>
    <div v-else-if="type === 'text'">
      <button class="px-3 py-1.5 text-xs border border-zinc-200 rounded-md hover:bg-zinc-50">Change…</button>
    </div>
  </div>
</template>