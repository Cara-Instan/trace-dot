import { callMainWindow } from "../../index";
import { Utils } from "electrobun";
import { splitPdf, type SplitConfig } from "../../pdf/index";
import { addHistory } from "../../db/history";
import { buildFileResult } from "../utils";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

let currentTempDir: string | null = null;

export function createSplitRPCService() {
  return {
    splitLoadFileData: async (params: { fileName: string; fileData: string }) => {
      try {
        const safeName = params.fileName
          .replace(/[/\\]/g, "_")
          .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i, "_$1");
        const bytes = Buffer.from(params.fileData, "base64");
        const tempDir = mkdtempSync(join(tmpdir(), "trace-split-"));
        const filePath = join(tempDir, safeName);
        writeFileSync(filePath, bytes);
        currentTempDir = tempDir;

        return await buildFileResult(filePath, params.fileName);
      } catch (err) {
        console.error("[splitLoadFileData] Error:", err);
        throw err;
      }
    },

    splitTriggerOpenFile: async () => {
      try {
        const file = await Utils.openFileDialog({
          allowedFileTypes: ".pdf",
          allowsMultipleSelection: false,
          canChooseDirectory: false,
          canChooseFiles: true,
          startingFolder: import.meta.dir,
        });

        if (!file || file.length === 0) {
          return null;
        }

        return await buildFileResult(file[0]);
      } catch (err) {
        console.error("[splitTriggerOpenFile] Error:", err);
        throw err;
      }
    },

    splitTriggerOpenOutputDir: async () => {
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
        console.error("[splitTriggerOpenOutputDir] Error:", err);
        throw err;
      }
    },

    splitExecute: async (params: {
      filePath: string;
      mode: "selected" | "range" | "every";
      pages?: number[];
      ranges?: Array<{ start: number; end: number }>;
      interval?: number;
      filenamePattern: string;
      outputPath: string;
    }) => {
      const mainWindow = callMainWindow();
      const sendProgress = (current: number, total: number) => {
        mainWindow.webview.rpc?.send("onSplitProgress", { current, total });
      };
      const sendError = (message: string) => {
        mainWindow.webview.rpc?.send("onSplitError", { message });
      };

      try {
        let config: SplitConfig;

        switch (params.mode) {
          case "selected":
            if (!params.pages || params.pages.length === 0) {
              throw new Error("No pages selected for split");
            }
            config = { mode: "selected", pages: params.pages };
            break;
          case "range":
            if (!params.ranges || params.ranges.length === 0) {
              throw new Error("No ranges specified for split");
            }
            config = { mode: "range", ranges: params.ranges };
            break;
          case "every":
            if (!params.interval || params.interval < 1) {
              throw new Error("Invalid interval for split");
            }
            config = { mode: "every", interval: params.interval };
            break;
          default:
            throw new Error("Unknown split mode: " + params.mode);
        }

        const outputFiles = await splitPdf(
          params.filePath,
          config,
          params.filenamePattern,
          params.outputPath,
          sendProgress,
        );

        try {
          addHistory(
            "split",
            [params.filePath],
            outputFiles.map((f) => f.path),
            { mode: params.mode, pageCount: outputFiles.reduce((sum, f) => sum + f.pages.length, 0) },
          );
        } catch (e) {
          console.error("[splitExecute] history write failed:", e);
        }

        return { outputFiles };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error during split";
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
