import type { TabAlign, TabPosition } from "../types";

export function formatVTabsTemplate(settings: {
	defaultPosition: TabPosition;
	defaultAlign: TabAlign;
	defaultTabTitle1: string;
	defaultTabTitle2: string;
}): string {
	return [
		`POSITION: ${settings.defaultPosition}`,
		`ALIGN: ${settings.defaultAlign}`,
		"",
		`TAB: ${settings.defaultTabTitle1}`,
		"Content here.",
		"",
		`TAB: ${settings.defaultTabTitle2}`,
		"Content here.",
	].join("\n");
}

export function formatVTabsBlock(source: string, fenceLength = 4): string {
	const fence = "`".repeat(fenceLength);
	return `${fence}v-tabs\n${source}\n${fence}`;
}
