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

const operationCountStmt = db.prepare(
	`SELECT operation, COUNT(*) as count FROM history GROUP BY operation`,
);

export function getOperationCounts(): { total: number; merges: number; splits: number } {
	const rows = operationCountStmt.all() as { operation: string; count: number }[];
	let merges = 0;
	let splits = 0;
	for (const row of rows) {
		if (row.operation === "merge") merges = row.count;
		if (row.operation === "split") splits = row.count;
	}
	return { total: merges + splits, merges, splits };
}
