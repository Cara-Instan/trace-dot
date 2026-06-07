export interface HistoryItem {
	id: number;
	operation: string;
	input_files: string;
	output_files: string;
	created_at: string;
	metadata: string | null;
}
