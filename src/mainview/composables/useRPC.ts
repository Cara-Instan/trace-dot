import { MainRPCTypes } from "@/shared/types";
import { Electroview } from "electrobun/view";

type SplitProgressListener = (current: number, total: number) => void;
type SplitErrorListener = (message: string) => void;

let splitProgressListeners: SplitProgressListener[] = [];
let splitErrorListeners: SplitErrorListener[] = [];

export function onSplitProgress(listener: SplitProgressListener) {
  splitProgressListeners.push(listener);
  return () => {
    splitProgressListeners = splitProgressListeners.filter((l) => l !== listener);
  };
}

export function onSplitError(listener: SplitErrorListener) {
  splitErrorListeners.push(listener);
  return () => {
    splitErrorListeners = splitErrorListeners.filter((l) => l !== listener);
  };
}

const rpc = Electroview.defineRPC<MainRPCTypes>({
    maxRequestTime: 60000,
    handlers: {
        requests:{},
        messages: {
            onSplitProgress: (msg) => {
                splitProgressListeners.forEach((l) => l(msg.current, msg.total));
            },
            onSplitError: (msg) => {
                splitErrorListeners.forEach((l) => l(msg.message));
            },
        },
    },
});

const electroview = new Electroview({ rpc });

export function useElectroView() {
  return { electroview };
}
