<script setup lang="ts">
import { computed } from 'vue';
import type { HistoryItem } from '../types/history';
import { getRelativeTime } from '../utils/format';

const props = defineProps<{
  items: HistoryItem[];
  compact?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalCount?: number;
  pageSize?: number;
}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
}>();

function parseFilenames(json: string): string[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function getFirstOutput(item: HistoryItem): string {
  const files = parseFilenames(item.output_files);
  return files[0] ?? '—';
}

function getSourceCount(item: HistoryItem): number {
  return parseFilenames(item.input_files).length;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const totalPages = computed(() => {
  if (!props.totalCount || !props.pageSize) return 1;
  return Math.ceil(props.totalCount / props.pageSize);
});

</script>

<template>
  <div>
    <div class="border border-zinc-200 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 border-b border-zinc-200">
          <tr class="text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <th class="px-4 py-2.5 font-medium">Filename</th>
            <th class="px-4 py-2.5 font-medium">Operation</th>
            <th v-if="!compact" class="px-4 py-2.5 font-medium">Pages</th>
            <th class="px-4 py-2.5 font-medium">When</th>
            <th v-if="!compact" class="px-4 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200">
          <tr v-for="item in items" :key="item.id" class="hover:bg-zinc-50/50">
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-zinc-900 truncate max-w-[220px]">{{ getFirstOutput(item) }}</div>
              <div v-if="!compact" class="text-[10px] text-zinc-500 font-mono">
                {{ getSourceCount(item) }} source{{ getSourceCount(item) !== 1 ? 's' : '' }}
              </div>
            </td>
            <td class="px-4 py-3 text-zinc-600">{{ capitalize(item.operation) }}</td>
            <td v-if="!compact" class="px-4 py-3 text-zinc-600 font-mono text-xs">—</td>
            <td class="px-4 py-3 text-zinc-500 text-xs">{{ getRelativeTime(item.created_at) }}</td>
            <td v-if="!compact" class="px-4 py-3 text-right">
              <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Open</button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="compact ? 3 : 5" class="px-4 py-8 text-center text-sm text-zinc-400">No activity yet</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showPagination && totalPages > 1" class="flex items-center justify-between mt-4 text-xs text-zinc-500">
      <div>Page {{ currentPage }} of {{ totalPages }}</div>
      <div class="flex gap-1">
        <button
          class="px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40"
          :disabled="(currentPage ?? 1) <= 1"
          @click="emit('page-change', (currentPage ?? 1) - 1)"
        >
          Previous
        </button>
        <button
          class="px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40"
          :disabled="(currentPage ?? 1) >= totalPages"
          @click="emit('page-change', (currentPage ?? 1) + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
