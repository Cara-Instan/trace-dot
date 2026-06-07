<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useElectroView, onMergeProgress, onMergeError } from '../composables/useRPC';
import FileCard from '../components/FileCard.vue';
import MergeConfigFooter from '../components/MergeConfigFooter.vue';
import HistoryTable from '../components/HistoryTable.vue';
import type { HistoryItem } from '../types/history';
import { formatFileSize } from '../utils/format';

const { electroview } = useElectroView();
const router = useRouter();

interface StagedFile {
  id: string;
  filename: string;
  filePath: string;
  pageCount: number;
  fileSize: number;
  pageRange: string;
}

const stagedFiles = ref<StagedFile[]>([]);
const outputFilename = ref('merged-output.pdf');
const savePath = ref('');
const isProcessing = ref(false);
const progress = ref<{ current: number; total: number } | null>(null);
const error = ref<string | null>(null);
const mergeResult = ref<{ outputPath: string; fileSize: number; pageCount: number } | null>(null);
const isDragging = ref(false);
let dragCounter = 0;
const recentHistory = ref<HistoryItem[]>([]);
let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

const totalPages = computed(() => stagedFiles.value.reduce((sum, f) => sum + f.pageCount, 0));
const totalSize = computed(() => formatFileSize(stagedFiles.value.reduce((sum, f) => sum + f.fileSize, 0)));
const canMerge = computed(() => stagedFiles.value.length > 0 && !!savePath.value && !isProcessing.value);

onMounted(async () => {
  try {
    const result = await electroview.rpc?.request('historyList', { limit: 20 });
    if (result) {
      recentHistory.value = (result as HistoryItem[]).filter((i) => i.operation === 'merge').slice(0, 5);
    }
  } catch {
    // RPC not ready or no history
  }
});

function parsePageRange(range: string): { start: number; end: number } | undefined {
  const match = range.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (match) {
    return { start: parseInt(match[1]), end: parseInt(match[2]) };
  }
  return undefined;
}

async function handleBrowse() {
  try {
    const results = await electroview.rpc?.request('mergeTriggerOpenFiles', {});
    if (!results) return;
    for (const result of results) {
      stagedFiles.value.push({
        id: crypto.randomUUID(),
        ...result,
        pageRange: `1-${result.pageCount}`,
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to open files';
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragCounter = 0;
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const pdfFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    error.value = 'Only PDF files are supported.';
    return;
  }

  try {
    const fileDataArray = await Promise.all(
      pdfFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const CHUNK_SIZE = 8192;
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
          binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
        }
        return { fileName: file.name, fileData: btoa(binary) };
      })
    );

    const results = await electroview.rpc?.request('mergeLoadMultipleFiles', fileDataArray);
    if (!results) return;

    for (const result of results) {
      stagedFiles.value.push({
        id: crypto.randomUUID(),
        ...result,
        pageRange: `1-${result.pageCount}`,
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dropped files';
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

function removeFile(id: string) {
  stagedFiles.value = stagedFiles.value.filter((f) => f.id !== id);
}

function clearAll() {
  stagedFiles.value = [];
  mergeResult.value = null;
  error.value = null;
}

function handleCancel() {
  clearAll();
  router.push('/');
}

function reorderFiles(fromIndex: number, toIndex: number) {
  const files = [...stagedFiles.value];
  const [moved] = files.splice(fromIndex, 1);
  files.splice(toIndex, 0, moved);
  stagedFiles.value = files;
}

function updatePageRange(id: string, value: string) {
  const file = stagedFiles.value.find((f) => f.id === id);
  if (file) {
    file.pageRange = value;
  }
}

async function handleChooseOutputDir() {
  try {
    const result = await electroview.rpc?.request('mergeTriggerOpenOutputDir', {});
    if (result) {
      savePath.value = result;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to choose output directory';
  }
}

async function handleMerge() {
  if (!canMerge.value) return;

  isProcessing.value = true;
  progress.value = null;
  error.value = null;
  mergeResult.value = null;

  try {
    const invalidFiles: string[] = [];
    const files = stagedFiles.value.map((f) => {
      const parsed = parsePageRange(f.pageRange);
      if (parsed) {
        return { filePath: f.filePath, pageRange: parsed };
      }
      if (f.pageRange.trim() !== '') {
        invalidFiles.push(f.filename);
        return { filePath: f.filePath, pageRange: { start: 1, end: f.pageCount } };
      }
      return { filePath: f.filePath };
    });

    if (invalidFiles.length > 0) {
      error.value = `Invalid page range for: ${invalidFiles.join(', ')}`;
      return;
    }

    const result = await electroview.rpc?.request('mergeExecute', {
      files,
      outputPath: savePath.value,
      outputFilename: outputFilename.value,
    });

    if (result) {
      mergeResult.value = result;
      if (redirectTimeout) clearTimeout(redirectTimeout);
      redirectTimeout = setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  } catch (err) {
    if (!error.value) {
      error.value = err instanceof Error ? err.message : 'Merge failed';
    }
  } finally {
    isProcessing.value = false;
    progress.value = null;
  }
}

const unsubProgress = onMergeProgress((current, total) => {
  progress.value = { current, total };
});

const unsubError = onMergeError((message) => {
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
  <div class="flex-1 flex flex-col overflow-hidden">
    <div
      class="flex-1 overflow-auto"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <template v-if="stagedFiles.length > 0">
        <div class="p-8">
          <div class="flex items-end justify-between mb-6">
            <div>
              <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Step 1 of 2</div>
              <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Staged files</h1>
              <p class="text-sm text-zinc-500 mt-1">{{ stagedFiles.length }} PDFs · {{ totalPages }} pages total · {{ totalSize }} combined</p>
            </div>
            <div class="flex items-center gap-3">
              <button @click="handleBrowse" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Add files</button>
              <button @click="clearAll" class="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2">Clear all</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FileCard
              v-for="file in stagedFiles"
              :key="file.id"
              :name="file.filename"
              :size="formatFileSize(file.fileSize)"
              :pages="file.pageCount"
              :removable="true"
              @remove="removeFile(file.id)"
            />
          </div>

          <template v-if="mergeResult">
            <div class="mt-6 border border-green-200 bg-green-50 rounded-md p-4">
              <div class="text-sm font-medium text-green-800 mb-2">Merge complete</div>
              <div class="text-xs font-mono text-green-700">
                {{ mergeResult.outputPath }} ({{ formatFileSize(mergeResult.fileSize) }}) — {{ mergeResult.pageCount }} pages
              </div>
            </div>
          </template>

          <template v-if="error">
            <div class="mt-4 border border-red-200 bg-red-50 rounded-md p-4">
              <div class="text-sm text-red-800">{{ error }}</div>
            </div>
          </template>
        </div>
      </template>

      <template v-else>
        <div class="p-8">
          <div class="text-center mb-8">
            <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Merge PDFs</div>
            <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Combine multiple PDFs into one</h1>
            <p class="text-sm text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
              Drop multiple PDFs to merge them in any order. You can set per-file page ranges before merging.
            </p>
          </div>

          <div
            class="flex flex-col items-center justify-center cursor-pointer"
            @click="handleBrowse"
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
                {{ isDragging ? 'Drop PDFs here' : 'Drag & drop multiple PDFs here' }}
              </div>
              <div class="text-xs text-zinc-500 mt-1">
                or <button class="text-zinc-900 underline underline-offset-2 hover:text-black">browse files</button>
              </div>
            </div>
          </div>

          <div v-if="recentHistory.length > 0" class="mt-10">
            <div class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">Recent merges</div>
            <HistoryTable :items="recentHistory" compact />
          </div>
        </div>
      </template>
    </div>

    <MergeConfigFooter
      v-if="stagedFiles.length > 0"
      :files="stagedFiles"
      :output-filename="outputFilename"
      :save-path="savePath"
      :is-processing="isProcessing"
      :progress="progress"
      :can-merge="canMerge"
      :file-count="stagedFiles.length"
      @update:output-filename="outputFilename = $event"
      @update:save-path="savePath = $event"
      @update:page-range="updatePageRange"
      @remove="removeFile"
      @reorder="reorderFiles"
      @pick-output-dir="handleChooseOutputDir"
      @merge="handleMerge"
      @cancel="handleCancel"
    />
  </div>
</template>
