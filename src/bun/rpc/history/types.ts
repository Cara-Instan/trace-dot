import { RPCSchema } from "electrobun";

export type HistoryBunRPCType = RPCSchema<{
	requests: {
		historyList: {
			params: { limit?: number };
			response: {
				id: number;
				operation: string;
				input_files: string;
				output_files: string;
				created_at: string;
				metadata: string | null;
			}[];
		};
		historyAdd: {
			params: {
				operation: "split" | "merge";
				input_files: string[];
				output_files: string[];
				metadata?: Record<string, unknown>;
			};
			response: { id: number };
		};
		historyDelete: {
			params: { id: number };
			response: { success: boolean };
		};
		historyClear: {
			params: {};
			response: { deleted: number };
		};
		historyCount: {
			params: {};
			response: { total: number; merges: number; splits: number };
		};
	};
	messages: {};
}>;
