import { callMainWindow } from "../../index";
import { Utils } from "electrobun";
import { mergePdf } from "../../pdf/index";
import { addHistory } from "../../db/history";
import { buildFileResult } from "../utils";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

let currentTempDir: string | null = null;

async function loadFileToTemp(fileName: string, fileData: string) {
  const safeName = fileName
    .replace(/[/\\]/g, "_")
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i, "_$1");
  const bytes = Buffer.from(fileData, "base64");

  if (!currentTempDir) {
    currentTempDir = mkdtempSync(join(tmpdir(), "trace-merge-"));
  }

  const filePath = join(currentTempDir, safeName);
  writeFileSync(filePath, bytes);
  return filePath;
}

export function createMergeRPCService() {
  return {
    mergeLoadMultipleFiles: async (params: Array<{ fileName: string; fileData: string }>) => {
      try {
        const results = [];
        for (const file of params) {
          const filePath = await loadFileToTemp(file.fileName, file.fileData);
          results.push(await buildFileResult(filePath, file.fileName));
        }
        return results;
      } catch (err) {
        console.error("[mergeLoadMultipleFiles] Error:", err);
        throw err;
      }
    },

    mergeTriggerOpenFiles: async () => {
      try {
        const files = await Utils.openFileDialog({
          allowedFileTypes: ".pdf",
          allowsMultipleSelection: true,
          canChooseDirectory: false,
          canChooseFiles: true,
          startingFolder: import.meta.dir,
        });

        if (!files || files.length === 0) {
          return null;
        }

        const results = [];
        for (const filePath of files) {
          results.push(await buildFileResult(filePath));
        }
        return results;
      } catch (err) {
        console.error("[mergeTriggerOpenFiles] Error:", err);
        throw err;
      }
    },

    mergeTriggerOpenOutputDir: async () => {
      try {
        const result = await Utils.openFileDialog({
          allowsMultipleSelection: false,
          canChooseDirectory: true,
          canChooseFiles: false,
          startingFolder: import.meta.dir,
        });

        if (!result || result.length === 0) {
          return null;
        }

        return result[0];
      } catch (err) {
        console.error("[mergeTriggerOpenOutputDir] Error:", err);
        throw err;
      }
    },

    mergeExecute: async (params: {
      files: Array<{
        filePath: string;
        pageRange?: { start: number; end: number };
      }>;
      outputPath: string;
      outputFilename: string;
    }) => {
      const mainWindow = callMainWindow();
      const sendProgress = (current: number, total: number) => {
        mainWindow.webview.rpc?.send("onMergeProgress", { current, total });
      };
      const sendError = (message: string) => {
        mainWindow.webview.rpc?.send("onMergeError", { message });
      };

      try {
        const safeFilename = params.outputFilename
          .replace(/[/\\]/g, "_")
          .replace(/\.\./g, "_");
        const outputPath = join(params.outputPath, safeFilename);

        const result = await mergePdf(
          params.files,
          outputPath,
          sendProgress,
        );

        try {
          addHistory(
            "merge",
            params.files.map((f) => f.filePath),
            [result.outputPath],
            { pageCount: result.pageCount },
          );
        } catch (e) {
          console.error("[mergeExecute] history write failed:", e);
        }

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error during merge";
        sendError(message);
        throw err;
      } finally {
        if (currentTempDir) {
          try {
            rmSync(currentTempDir, { recursive: true });
          } catch {}
          currentTempDir = null;
        }
      }
    },
  };
}
