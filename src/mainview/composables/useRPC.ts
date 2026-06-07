import { MainRPCTypes } from "@/shared/types";
import { Electroview } from "electrobun/view";

type SplitProgressListener = (current: number, total: number) => void;
type SplitErrorListener = (message: string) => void;
type MergeProgressListener = (current: number, total: number) => void;
type MergeErrorListener = (message: string) => void;

let splitProgressListeners: SplitProgressListener[] = [];
let splitErrorListeners: SplitErrorListener[] = [];
let mergeProgressListeners: MergeProgressListener[] = [];
let mergeErrorListeners: MergeErrorListener[] = [];

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

export function onMergeProgress(listener: MergeProgressListener) {
  mergeProgressListeners.push(listener);
  return () => {
    mergeProgressListeners = mergeProgressListeners.filter((l) => l !== listener);
  };
}

export function onMergeError(listener: MergeErrorListener) {
  mergeErrorListeners.push(listener);
  return () => {
    mergeErrorListeners = mergeErrorListeners.filter((l) => l !== listener);
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
            onMergeProgress: (msg) => {
                mergeProgressListeners.forEach((l) => l(msg.current, msg.total));
            },
            onMergeError: (msg) => {
                mergeErrorListeners.forEach((l) => l(msg.message));
            },
        },
    },
});

const electroview = new Electroview({ rpc });

export function useElectroView() {
  return { electroview };
}
