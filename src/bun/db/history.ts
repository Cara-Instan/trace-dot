import db from "./index";

export interface HistoryRecord {
	id: number;
	operation: "split" | "merge";
	input_files: string;
	output_files: string;
	created_at: string;
	metadata: string | null;
}

const insertStmt = db.prepare(
	`INSERT INTO history (operation, input_files, output_files, metadata) VALUES (?, ?, ?, ?)`,
);

const listStmt = db.prepare(
	`SELECT * FROM history ORDER BY created_at DESC LIMIT ?`,
);

const getByIdStmt = db.prepare(
	`SELECT * FROM history WHERE id = ?`,
);

const deleteByIdStmt = db.prepare(
	`DELETE FROM history WHERE id = ?`,
);

const clearAllStmt = db.prepare(
	`DELETE FROM history`,
);

const countStmt = db.prepare(
	`SELECT COUNT(*) as count FROM history`,
);

export function addHistory(
	operation: "split" | "merge",
	inputFiles: string[],
	outputFiles: string[],
	metadata?: Record<string, unknown>,
): number {
	const result = insertStmt.run(
		operation,
		JSON.stringify(inputFiles),
		JSON.stringify(outputFiles),
		metadata ? JSON.stringify(metadata) : null,
	);
	return Number(result.lastInsertRowid);
}

export function listHistory(limit = 50): HistoryRecord[] {
	return listStmt.all(limit) as HistoryRecord[];
}

export function getHistory(id: number): HistoryRecord | null {
	return (getByIdStmt.get(id) as HistoryRecord) ?? null;
}

export function deleteHistory(id: number): boolean {
	const result = deleteByIdStmt.run(id);
	return result.changes > 0;
}

export function clearHistory(): number {
	const result = clearAllStmt.run();
	return result.changes;
}

export function getHistoryCount(): number {
	const row = countStmt.get() as { count: number };
	return row.count;
}
