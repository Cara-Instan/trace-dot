import { RPCSchema } from "electrobun";
import { SplitBunRPCType } from "../bun/rpc/split/types";
import { HistoryBunRPCType } from "../bun/rpc/history/types";

export type MainRPCTypes = {
  // functions that execute in the main process
  bun: {
    requests: SplitBunRPCType["requests"] & HistoryBunRPCType["requests"];
    messages: SplitBunRPCType["messages"] & HistoryBunRPCType["messages"];
  };
  // functions that execute in the browser context
  webview: RPCSchema<{
    requests: {};
    messages: {
      onSplitProgress: { current: number; total: number };
      onSplitError: { message: string };
    }
  }>;
};
