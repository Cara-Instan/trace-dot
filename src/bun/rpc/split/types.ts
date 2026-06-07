import { RPCSchema } from "electrobun";

export type SplitBunRPCType = RPCSchema<{
  requests: {
    splitTriggerOpenFile: {
      params: {};
      response: { filename: string; fileId: number };
    };
  };
  messages: {
    // triggerSubmitSplit: {
    //   fileId: number;
    //   splitFormation: string;
    //   outputPath: string;
    // };
  };
}>;

export type SplitWebviewRPCType = RPCSchema<{
  requests: {};
  messages: {};
}>;
