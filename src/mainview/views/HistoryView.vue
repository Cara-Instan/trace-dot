<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import HistoryTable from '../components/HistoryTable.vue';
import { useElectroView } from '../composables/useRPC.js';
import type { HistoryItem } from '../types/history';

const { electroview } = useElectroView();

const searchQuery = ref('');
const activeFilter = ref('All');
const currentPage = ref(1);
const pageSize = 10;

const allItems = ref<HistoryItem[]>([]);
const operationCounts = ref<{ total: number; merges: number; splits: number }>({ total: 0, merges: 0, splits: 0 });

onMounted(async () => {
  try {
    const result = await electroview.rpc?.request('historyList', { limit: 1000 });
    if (result) allItems.value = result;
  } catch {
    // RPC not ready
  }
  try {
    const counts = await electroview.rpc?.request('historyCount', {});
    if (counts) operationCounts.value = counts;
  } catch {
    // RPC not ready
  }
});

const filters = ['All', 'Merges', 'Splits'];

const filteredItems = computed(() => {
  let items = allItems.value;

  if (activeFilter.value === 'Merges') {
    items = items.filter(i => i.operation === 'merge');
  } else if (activeFilter.value === 'Splits') {
    items = items.filter(i => i.operation === 'split');
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter(i => {
      try {
        const files: string[] = JSON.parse(i.input_files);
        const outputs: string[] = JSON.parse(i.output_files);
        return [...files, ...outputs].some(f => f.toLowerCase().includes(q));
      } catch {
        return false;
      }
    });
  }

  return items;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredItems.value.slice(start, start + pageSize);
});

const totalCount = computed(() => operationCounts.value.total);
const mergeCount = computed(() => operationCounts.value.merges);
const splitCount = computed(() => operationCounts.value.splits);

function handlePageChange(page: number) {
  currentPage.value = page;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-end justify-between mb-6">
      <div>
        <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Activity</div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">History</h1>
        <p class="text-sm text-zinc-500 mt-1">{{ totalCount }} operations · {{ mergeCount }} merges · {{ splitCount }} splits</p>
      </div>
      <button class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Clear history</button>
    </div>
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        <input type="text" v-model="searchQuery" placeholder="Search by filename…" class="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400" />
      </div>
      <div class="flex border border-zinc-200 rounded-md overflow-hidden">
        <button
          v-for="filter in filters"
          :key="filter"
          class="px-3 py-2 text-xs"
          :class="activeFilter === filter ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50'"
          @click="activeFilter = filter; currentPage = 1"
        >
          {{ filter }}
        </button>
      </div>
    </div>
    <div class="flex-1">
      <HistoryTable
        :items="paginatedItems"
        :show-pagination="true"
        :current-page="currentPage"
        :total-count="totalCount"
        :page-size="pageSize"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>
