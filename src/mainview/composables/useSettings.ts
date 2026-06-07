import { reactive, watch } from 'vue';

const STORAGE_KEY = 'trace-settings';

interface Settings {
  notifyOnCompletion: boolean;
  theme: 'System' | 'Light' | 'Dark';
  defaultSaveLocation: string;
  defaultOutputFormat: 'PDF (standard)' | 'PDF/A (archival)';
  openOutputAfterCreation: boolean;
  overwriteProtection: boolean;
}

const defaults: Settings = {
  notifyOnCompletion: false,
  theme: 'System',
  defaultSaveLocation: '~/Documents/Trace',
  defaultOutputFormat: 'PDF (standard)',
  openOutputAfterCreation: true,
  overwriteProtection: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...defaults, ...parsed };
    }
  } catch {
    // corrupted storage — fall back to defaults
  }
  return { ...defaults };
}

const settings = reactive<Settings>(loadSettings());

watch(settings, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });

export function useSettings() {
  function resetToDefaults() {
    Object.assign(settings, { ...defaults });
  }

  return { settings, resetToDefaults };
}
