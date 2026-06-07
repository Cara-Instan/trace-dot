<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useElectroView, onSplitProgress, onSplitError } from '../composables/useRPC';
import HistoryTable from '../components/HistoryTable.vue';
import SuccessOverlay from '../components/SuccessOverlay.vue';
import type { HistoryItem } from '../types/history';

const { electroview } = useElectroView();
const router = useRouter();

const sourceFile = ref<{ filename: string; filePath: string; pageCount: number; fileSize: number } | null>(null);
const selectedPages = ref<number[]>([]);
const splitMode = ref<'selected' | 'range' | 'every'>('selected');
const pageRange = ref('');
const everyN = ref(5);
const filenamePattern = ref('{name}-{n}.pdf');
const outputPath = ref('');
const isProcessing = ref(false);
const progress = ref<{ current: number; total: number } | null>(null);
const error = ref<string | null>(null);
const splitResult = ref<Array<{ name: string; path: string; size: number; pages: number[] }> | null>(null);
const isDragging = ref(false);
let dragCounter = 0;
const recentHistory = ref<HistoryItem[]>([]);
let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

const displayedPages = computed(() => {
  if (!sourceFile.value) return [];
  return Array.from({ length: sourceFile.value.pageCount }, (_, i) => i + 1);
});

const selectedPageSet = computed(() => new Set(selectedPages.value));

const selectedCount = computed(() => selectedPages.value.length);

function parseRanges(text: string): Array<{ start: number; end: number }> {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const parts = s.split('-').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { start: parts[0], end: parts[1] };
      }
      if (parts.length === 1 && !isNaN(parts[0])) {
        return { start: parts[0], end: parts[0] };
      }
      return null;
    })
    .filter((r): r is { start: number; end: number } => r !== null);
}

const estimatedFileCount = computed(() => {
  if (!sourceFile.value) return 0;
  switch (splitMode.value) {
    case 'selected':
      return selectedCount.value > 0 ? 1 : 0;
    case 'range':
      return parseRanges(pageRange.value).length;
    case 'every': {
      const n = everyN.value;
      return n > 0 ? Math.ceil(sourceFile.value.pageCount / n) : 0;
    }
  }
});

const splitButtonLabel = computed(() => {
  if (isProcessing.value) {
    if (progress.value) return `Splitting ${progress.value.current}/${progress.value.total}...`;
    return 'Splitting...';
  }
  const count = estimatedFileCount.value;
  if (count === 0) return 'Split';
  return `Split into ${count} file${count === 1 ? '' : 's'}`;
});

function applySourceFile(result: { filename: string; filePath: string; pageCount: number; fileSize: number }) {
  sourceFile.value = result;
  selectedPages.value = [];
  splitResult.value = null;
  error.value = null;
  pageRange.value = `1-${result.pageCount}`;
}

async function handleBrowse() {
  try {
    const result = await electroview.rpc?.request('splitTriggerOpenFile', {});
    if (!result) return;
    applySourceFile(result);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to open file';
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragCounter = 0;
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    error.value = 'Only PDF files are supported.';
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    const base64 = btoa(binary);
    const result = await electroview.rpc?.request('splitLoadFileData', { fileName: file.name, fileData: base64 });
    if (!result) return;
    applySourceFile(result);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dropped file';
  }
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  dragCounter++;
  isDragging.value = true;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDragging.value = false;
  }
}

function togglePage(page: number) {
  const idx = selectedPages.value.indexOf(page);
  if (idx === -1) {
    selectedPages.value = [...selectedPages.value, page];
  } else {
    selectedPages.value = selectedPages.value.filter((p) => p !== page);
  }
}

function selectAll() {
  if (!sourceFile.value) return;
  selectedPages.value = Array.from({ length: sourceFile.value.pageCount }, (_, i) => i + 1);
}

function selectOdd() {
  if (!sourceFile.value) return;
  selectedPages.value = displayedPages.value.filter((p) => p % 2 === 1);
}

function selectEven() {
  if (!sourceFile.value) return;
  selectedPages.value = displayedPages.value.filter((p) => p % 2 === 0);
}

function selectNone() {
  selectedPages.value = [];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

onMounted(async () => {
  try {
    const result = await electroview.rpc?.request('historyList', { limit: 20 });
    if (result) {
      recentHistory.value = (result as HistoryItem[]).filter((i) => i.operation === 'split').slice(0, 5);
    }
  } catch {
    // RPC not ready or no history
  }
});

// TODO: Add a default output path setting in the Settings page so users don't
// have to pick the directory every time. Persist the choice in the DB and
// pre-populate `outputPath` from it when SplitView mounts.

async function handleChooseOutputDir() {
  try {
    const result = await electroview.rpc?.request('splitTriggerOpenOutputDir', {});
    if (result) {
      outputPath.value = result;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to choose output directory';
  }
}

function handleCancel() {
  sourceFile.value = null;
  router.push('/');
}

async function handleSplit() {
  if (!sourceFile.value || !outputPath.value) return;

  isProcessing.value = true;
  progress.value = null;
  error.value = null;
  splitResult.value = null;

  try {
    const params: {
      filePath: string;
      mode: 'selected' | 'range' | 'every';
      filenamePattern: string;
      outputPath: string;
      pages?: number[];
      ranges?: Array<{ start: number; end: number }>;
      interval?: number;
    } = {
      filePath: sourceFile.value.filePath,
      mode: splitMode.value,
      filenamePattern: filenamePattern.value,
      outputPath: outputPath.value,
    };

    if (splitMode.value === 'selected') {
      params.pages = selectedPages.value;
    } else if (splitMode.value === 'range') {
      params.ranges = parseRanges(pageRange.value);
    } else if (splitMode.value === 'every') {
      params.interval = everyN.value;
    }

    const result = await electroview.rpc?.request('splitExecute', params);
    if (result) {
      splitResult.value = result.outputFiles;
      if (redirectTimeout) clearTimeout(redirectTimeout);
      redirectTimeout = setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  } catch (err) {
    if (!error.value) {
      error.value = err instanceof Error ? err.message : 'Split failed';
    }
  } finally {
    isProcessing.value = false;
    progress.value = null;
  }
}

const unsubProgress = onSplitProgress((current, total) => {
  progress.value = { current, total };
});

const unsubError = onSplitError((message) => {
  error.value = message;
  isProcessing.value = false;
});

onUnmounted(() => {
  unsubProgress();
  unsubError();
  if (redirectTimeout) clearTimeout(redirectTimeout);
});
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden relative">
    <div class="flex-1 overflow-auto p-8">
      <template v-if="sourceFile">
        <div class="flex items-end justify-between mb-6">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Source file</div>
            <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ sourceFile.filename }}</h1>
            <p class="text-sm text-zinc-500 mt-1 font-mono">{{ formatFileSize(sourceFile.fileSize) }} · {{ sourceFile.pageCount }} pages</p>
          </div>
          <button @click="handleBrowse" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Replace file</button>
        </div>

        <div class="flex items-center gap-2 mb-4">
          <span class="text-xs text-zinc-500">Select pages to extract:</span>
          <button @click="selectAll" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">All</button>
          <span class="text-xs text-zinc-300">·</span>
          <button @click="selectOdd" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Odd</button>
          <span class="text-xs text-zinc-300">·</span>
          <button @click="selectEven" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Even</button>
          <span class="text-xs text-zinc-300">·</span>
          <button @click="selectNone" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">None</button>
        </div>

        <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          <div
            v-for="i in displayedPages"
            :key="i"
            @click="togglePage(i)"
            class="aspect-[3/4] rounded-sm flex flex-col items-center justify-center text-xs font-mono relative cursor-pointer transition-colors"
            :class="selectedPageSet.has(i)
              ? 'border-2 border-zinc-900 bg-white text-zinc-900'
              : 'border border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300'"
          >
            <span>{{ String(i).padStart(2, '0') }}</span>
          </div>
        </div>

        <p class="mt-3 text-xs text-zinc-500 font-mono">
          {{ sourceFile.pageCount }} pages total · {{ selectedCount }} selected
        </p>
      </template>

      <template v-else>
        <div class="text-center mb-8">
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Split PDF</div>
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Extract pages from any PDF</h1>
          <p class="text-sm text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
            Drop a single PDF to split it by page selection, ranges, or fixed intervals.
          </p>
        </div>

        <div
          class="flex flex-col items-center justify-center cursor-pointer"
          @click="handleBrowse"
          @dragenter="handleDragEnter"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div
            class="w-full max-w-md rounded-lg border-2 border-dashed p-16 text-center transition-colors"
            :class="isDragging
              ? 'border-zinc-900 bg-zinc-100'
              : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50'"
          >
            <div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
              </svg>
            </div>
            <div class="text-sm font-medium text-zinc-900">
              {{ isDragging ? 'Drop PDF here' : 'Drag & drop a PDF here' }}
            </div>
            <div class="text-xs text-zinc-500 mt-1">
              or <button class="text-zinc-900 underline underline-offset-2 hover:text-black">browse files</button>
            </div>
          </div>
        </div>

        <div v-if="recentHistory.length > 0" class="mt-10">
          <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Recent splits</div>
          <HistoryTable :items="recentHistory" compact />
        </div>
      </template>

      <template v-if="error">
        <div class="mt-4 border border-red-200 bg-red-50 rounded-md p-4">
          <div class="text-sm text-red-800">{{ error }}</div>
        </div>
      </template>
    </div>

    <div v-if="sourceFile" class="shrink-0 border-t border-zinc-200 bg-white/80 backdrop-blur-md">
      <div class="px-8 py-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Split settings</div>
            <h2 class="text-base font-semibold tracking-tight text-zinc-900">Configure output</h2>
          </div>
          <div class="text-xs text-zinc-500 font-mono">
            {{ estimatedFileCount }} file{{ estimatedFileCount === 1 ? '' : 's' }} will be created
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-xs text-zinc-600 mb-2">Split mode</label>
          <div class="grid grid-cols-3 gap-2">
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="selected" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">Selected pages</div>
                <div class="text-[10px] text-zinc-500">{{ selectedCount }} pages → 1 file</div>
              </div>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="range" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">By range</div>
                <div class="text-[10px] text-zinc-500">e.g. 1–5, 6–10</div>
              </div>
            </label>
            <label class="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
              <input type="radio" v-model="splitMode" value="every" class="text-black focus:ring-black" />
              <div>
                <div class="text-sm font-medium">Every N pages</div>
                <div class="text-[10px] text-zinc-500">Split into equal chunks</div>
              </div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <div v-if="splitMode === 'range'">
            <label class="block text-xs text-zinc-600 mb-1.5">Page ranges (comma-separated)</label>
            <input
              type="text"
              v-model="pageRange"
              class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
              placeholder="1-5, 6-10, 11-15"
            />
          </div>
          <div v-if="splitMode === 'every'">
            <label class="block text-xs text-zinc-600 mb-1.5">Pages per chunk</label>
            <input
              type="number"
              v-model.number="everyN"
              min="1"
              class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
            />
          </div>
          <div>
            <label class="block text-xs text-zinc-600 mb-1.5">Filename pattern</label>
            <input
              type="text"
              v-model="filenamePattern"
              class="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
            />
            <p class="text-[10px] text-zinc-400 mt-1 font-mono">Use {name} for original name, {n} for number</p>
          </div>
          <div>
            <label class="block text-xs text-zinc-600 mb-1.5">Output folder <span class="text-red-500">*</span></label>
            <div class="flex gap-2">
              <div
                class="flex-1 min-w-0 px-3 py-2 text-sm border rounded-md font-mono truncate"
                :class="outputPath
                  ? 'border-zinc-200 text-zinc-900'
                  : 'border-red-300 text-zinc-400'"
              >
                {{ outputPath || 'No folder selected' }}
              </div>
              <button
                @click="handleChooseOutputDir"
                type="button"
                class="shrink-0 px-3 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-700"
              >
                Choose…
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button @click="handleCancel" class="px-4 py-2 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50">Cancel</button>
          <button
            @click="handleSplit"
            :disabled="isProcessing || estimatedFileCount === 0 || !outputPath"
            class="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ splitButtonLabel }}
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div v-if="progress" class="mt-3">
          <div class="w-full bg-zinc-100 rounded-full h-1.5">
            <div
              class="bg-black h-1.5 rounded-full transition-all duration-300"
              :style="{ width: `${(progress.current / progress.total) * 100}%` }"
            ></div>
          </div>
          <p class="text-[10px] text-zinc-500 font-mono mt-1">Processing file {{ progress.current }} of {{ progress.total }}</p>
        </div>
      </div>
    </div>

    <SuccessOverlay
      v-if="splitResult"
      title="Split Complete"
      :description="`${splitResult.length} file${splitResult.length === 1 ? '' : 's'} created`"
      @done="router.push('/')"
    >
      <div class="text-xs font-mono text-zinc-500 mb-1">Output files</div>
      <div v-for="file in splitResult" :key="file.name" class="text-sm font-mono text-zinc-900 break-all">
        {{ file.name }}
        <span class="text-xs font-mono text-zinc-400 ml-2">{{ formatFileSize(file.size) }} · pages {{ file.pages[0] }}–{{ file.pages[file.pages.length - 1] }}</span>
      </div>
    </SuccessOverlay>
  </div>
</template>
