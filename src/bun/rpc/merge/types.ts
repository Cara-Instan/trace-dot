import { RPCSchema } from "electrobun";

export type MergeBunRPCType = RPCSchema<{
  requests: {
    mergeLoadMultipleFiles: {
      params: Array<{ fileName: string; fileData: string }>;
      response: Array<{
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      }>;
    };
    mergeTriggerOpenFiles: {
      params: {};
      response: Array<{
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      }> | null;
    };
    mergeTriggerOpenOutputDir: {
      params: {};
      response: string | null;
    };
    mergeExecute: {
      params: {
        files: Array<{
          filePath: string;
          pageRange?: { start: number; end: number };
        }>;
        outputPath: string;
        outputFilename: string;
      };
      response: {
        outputPath: string;
        fileSize: number;
        pageCount: number;
      };
    };
  };
  messages: {};
}>;
