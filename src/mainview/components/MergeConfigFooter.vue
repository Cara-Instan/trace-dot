<script setup lang="ts">
import { ref } from 'vue';
import { formatFileSize } from '../utils/format';

interface StagedFile {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  pageRange: string;
}

defineProps<{
  files: StagedFile[];
  outputFilename: string;
  savePath: string;
  isProcessing: boolean;
  progress: { current: number; total: number } | null;
  canMerge: boolean;
  fileCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:outputFilename', value: string): void;
  (e: 'update:savePath', value: string): void;
  (e: 'update:pageRange', id: string, value: string): void;
  (e: 'remove', id: string): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
  (e: 'pickOutputDir'): void;
  (e: 'merge'): void;
  (e: 'cancel'): void;
}>();

const dragIndex = ref<number | null>(null);

function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(_index: number, e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function onDrop(index: number) {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    emit('reorder', dragIndex.value, index);
  }
  dragIndex.value = null;
}
</script>

<template>
  <div class="shrink-0 border-t border-zinc-200 bg-white/80 backdrop-blur-md">
    <div class="px-8 py-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Step 2 of 2</div>
          <h2 class="text-base font-semibold tracking-tight text-zinc-900">Configure merge</h2>
        </div>
        <div class="text-xs text-zinc-500 font-mono">drag to reorder</div>
      </div>
      <div class="border border-zinc-200 rounded-lg divide-y divide-zinc-200 mb-4 bg-white">
        <div
          v-for="(file, index) in files"
          :key="file.id"
          class="flex items-center gap-3 px-3 py-2.5"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover="onDragOver(index, $event)"
          @drop="onDrop(index)"
          :class="{ 'bg-zinc-50': dragIndex === index }"
        >
          <svg class="grip w-4 h-4 text-zinc-400 cursor-grab" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.25"/><circle cx="15" cy="6" r="1.25"/><circle cx="9" cy="12" r="1.25"/><circle cx="15" cy="12" r="1.25"/><circle cx="9" cy="18" r="1.25"/><circle cx="15" cy="18" r="1.25"/>
          </svg>
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate text-zinc-900">{{ file.filename }}</div>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>pages</span>
            <input
              type="text"
              :value="file.pageRange"
              @input="emit('update:pageRange', file.id, ($event.target as HTMLInputElement).value)"
              class="w-16 px-2 py-1 text-xs font-mono border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
            />
          </div>
          <span class="text-xs text-zinc-500 font-mono w-14 text-right">{{ formatFileSize(file.fileSize) }}</span>
          <button
            @click="emit('remove', file.id)"
            class="text-zinc-400 hover:text-zinc-700 p-1"
            aria-label="Remove"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label class="block text-xs text-zinc-600 mb-1.5">Output filename</label>
          <input
            type="text"
            :value="outputFilename"
            @input="emit('update:outputFilename', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
          />
        </div>
        <div>
          <label class="block text-xs text-zinc-600 mb-1.5">Save to</label>
          <div class="flex">
            <input
              type="text"
              :value="savePath"
              @input="emit('update:savePath', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-l-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
            />
            <button
              @click="emit('pickOutputDir')"
              class="px-3 py-2 text-xs border border-l-0 border-zinc-200 rounded-r-md hover:bg-zinc-50"
            >Pick…</button>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2">
        <button
          @click="emit('cancel')"
          class="px-4 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50"
        >Cancel</button>
        <button
          @click="emit('merge')"
          :disabled="!canMerge || isProcessing"
          class="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <template v-if="isProcessing">
            <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Merging… {{ progress ? `${progress.current}/${progress.total}` : '' }}
          </template>
          <template v-else>
            Merge {{ fileCount }} files
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
