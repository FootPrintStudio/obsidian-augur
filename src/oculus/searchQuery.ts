export function parseMediaTitleQueries(value: string): string[] | null {
	const queries = value.split(",").map((query) => query.trim());
	if (queries.length === 0 || queries.some((query) => !query)) return null;
	return queries;
}
