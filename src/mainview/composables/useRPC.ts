import { MainRPCTypes } from "@/shared/types";
import { Electroview } from "electrobun/view";

const rpc = Electroview.defineRPC<MainRPCTypes>({
    maxRequestTime: 10000, // 10 seconds
    handlers: {
        requests:{},
        messages: {
            onLogTest: (message) => {
                console.log("Received onLogTest message from bun!", message);
            }
        },
    },
});

const electroview = new Electroview({ rpc });

export function useElectroView() {
  return { electroview };
}

