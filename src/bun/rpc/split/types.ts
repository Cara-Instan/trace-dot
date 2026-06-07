import { RPCSchema } from "electrobun";

export type SplitBunRPCType = RPCSchema<{
  requests: {
    splitLoadFileData: {
      params: { fileName: string; fileData: string };
      response: {
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      } | null;
    };
    splitTriggerOpenFile: {
      params: {};
      response: {
        filename: string;
        filePath: string;
        pageCount: number;
        fileSize: number;
      } | null;
    };
    splitTriggerOpenOutputDir: {
      params: {};
      response: string | null;
    };
    splitExecute: {
      params: {
        filePath: string;
        mode: "selected" | "range" | "every";
        pages?: number[];
        ranges?: Array<{ start: number; end: number }>;
        interval?: number;
        filenamePattern: string;
        outputPath: string;
      };
      response: {
        outputFiles: Array<{
          name: string;
          path: string;
          size: number;
          pages: number[];
        }>;
      };
    };
  };
  messages: {};
}>;
