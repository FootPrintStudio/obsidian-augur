const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov"]);

function urlExtension(url: string): string | null {
	try {
		const pathname = new URL(url).pathname;
		const base = pathname.split("/").pop() ?? "";
		const dot = base.lastIndexOf(".");
		if (dot <= 0) return null;
		return base.slice(dot + 1).toLowerCase();
	} catch {
		return null;
	}
}

function hostedPlatform(url: string): string | null {
	try {
		const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
		if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
		if (host.endsWith("vimeo.com")) return "Vimeo";
		if (host.endsWith("bilibili.com") || host.endsWith("bilibili.tv")) return "Bilibili";
		if (host.endsWith("coursera.org")) return "Coursera";
		return null;
	} catch {
		return null;
	}
}

export function describeUrlMediaEntry(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) {
		return "Image URL, direct video (.mp4/.webm/.mov), or hosted link (YouTube, Vimeo, Bilibili, Coursera).";
	}
	const hosted = hostedPlatform(trimmed);
	if (hosted) return `Hosted video (${hosted}) — requires Media Extended on desktop.`;
	const ext = urlExtension(trimmed);
	if (ext && VIDEO_EXT.has(ext)) return "Direct video URL — plays in Media Extended or the lightbox.";
	if (ext && IMAGE_EXT.has(ext)) return "Remote image URL.";
	return "Unrecognized URL — add a file extension or enable Content-Type validation in Oculus settings.";
}
