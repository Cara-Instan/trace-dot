import { addHistory, listHistory, deleteHistory, clearHistory, getOperationCounts } from "../../db/history";

export function createHistoryRPCService() {
	return {
		historyList: (params: { limit?: number }) => {
			const limit = Math.max(1, Math.min(Math.floor(params.limit ?? 50), 10000));
			return listHistory(limit);
		},
		historyAdd: (params: {
			operation: "split" | "merge";
			input_files: string[];
			output_files: string[];
			metadata?: Record<string, unknown>;
		}) => {
			const id = addHistory(
				params.operation,
				params.input_files,
				params.output_files,
				params.metadata,
			);
			return { id };
		},
		historyDelete: (params: { id: number }) => {
			const success = deleteHistory(params.id);
			return { success };
		},
		historyClear: () => {
			const deleted = clearHistory();
			return { deleted };
		},
		historyCount: () => {
			return getOperationCounts();
		},
	};
}
