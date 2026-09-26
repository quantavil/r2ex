import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MediaType } from "./types";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number): string {
	if (
		bytes === undefined ||
		bytes === null ||
		Number.isNaN(bytes) ||
		bytes === 0
	) {
		return "0 B";
	}
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const val = Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2));
	return `${val} ${sizes[i]}`;
}

export function formatDate(timestamp?: number | string | Date): string {
	if (!timestamp) return "--";
	const d = new Date(timestamp);
	if (Number.isNaN(d.getTime())) return "--";
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatRelativeTime(timestamp?: number | string | Date): string {
	if (!timestamp) return "--";
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return "--";
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

	if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString();
}

export function formatCountdown(expiresAt?: number): {
	text: string;
	isExpired: boolean;
	isPermanent: boolean;
	urgent: boolean;
} {
	if (!expiresAt) {
		return {
			text: "Permanent",
			isExpired: false,
			isPermanent: true,
			urgent: false,
		};
	}
	const now = Date.now();
	const diffMs = expiresAt - now;
	if (diffMs <= 0) {
		return {
			text: "Expired",
			isExpired: true,
			isPermanent: false,
			urgent: true,
		};
	}
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHours = Math.floor(diffMin / 60);
	const diffDays = Math.floor(diffHours / 24);

	const urgent = diffHours < 12;

	if (diffDays > 1) {
		return {
			text: `Expires in ${diffDays} days`,
			isExpired: false,
			isPermanent: false,
			urgent,
		};
	}
	if (diffDays === 1) {
		return {
			text: "Expires in 1 day",
			isExpired: false,
			isPermanent: false,
			urgent,
		};
	}
	if (diffHours > 1) {
		return {
			text: `Expires in ${diffHours} hours`,
			isExpired: false,
			isPermanent: false,
			urgent,
		};
	}
	if (diffHours === 1) {
		return {
			text: "Expires in 1 hour",
			isExpired: false,
			isPermanent: false,
			urgent: true,
		};
	}
	if (diffMin > 1) {
		return {
			text: `Expires in ${diffMin} minutes`,
			isExpired: false,
			isPermanent: false,
			urgent: true,
		};
	}
	return {
		text: "Expires in a few seconds",
		isExpired: false,
		isPermanent: false,
		urgent: true,
	};
}

export function encodeKey(key: string): string {
	let cleaned = key;
	if (cleaned && cleaned !== "/" && cleaned.startsWith("/")) {
		cleaned = cleaned.slice(1);
	}
	return btoa(unescape(encodeURIComponent(cleaned)));
}

export function decodeKey(key: string): string {
	try {
		return decodeURIComponent(escape(atob(key)));
	} catch {
		return key;
	}
}

export function getFileExtension(filename: string): string {
	if (!filename) return "";
	const parts = filename.split(".");
	return parts.length > 1 ? parts.pop() || "" : "";
}

export function getMediaType(
	filename: string,
	contentType?: string,
): MediaType {
	if (contentType) {
		if (contentType.startsWith("image/")) return "image";
		if (contentType.startsWith("video/")) return "video";
		if (contentType.startsWith("audio/")) return "audio";
		if (contentType === "application/pdf") return "pdf";
		if (
			contentType.includes("json") ||
			contentType.includes("javascript") ||
			contentType.includes("typescript") ||
			contentType.includes("xml") ||
			contentType.includes("yaml") ||
			contentType.includes("html") ||
			contentType.includes("css")
		) {
			return "code";
		}
		if (contentType.startsWith("text/")) {
			return "text";
		}
		if (
			contentType.includes("zip") ||
			contentType.includes("tar") ||
			contentType.includes("gzip") ||
			contentType.includes("rar") ||
			contentType.includes("7z")
		) {
			return "archive";
		}
	}

	const ext = getFileExtension(filename).toLowerCase();
	const imageExts = [
		"png",
		"jpg",
		"jpeg",
		"gif",
		"webp",
		"svg",
		"avif",
		"bmp",
		"ico",
		"tiff",
	];
	if (imageExts.includes(ext)) return "image";

	const videoExts = ["mp4", "webm", "ogg", "mov", "m4v", "mkv", "avi"];
	if (videoExts.includes(ext)) return "video";

	const audioExts = ["mp3", "wav", "aac", "ogg", "flac", "m4a", "weba", "wma"];
	if (audioExts.includes(ext)) return "audio";

	if (ext === "pdf") return "pdf";

	const codeExts = [
		"js",
		"ts",
		"jsx",
		"tsx",
		"mjs",
		"cjs",
		"json",
		"html",
		"htm",
		"css",
		"scss",
		"sass",
		"less",
		"py",
		"rs",
		"go",
		"c",
		"cpp",
		"cc",
		"h",
		"hpp",
		"cs",
		"java",
		"kt",
		"kts",
		"php",
		"rb",
		"sh",
		"bash",
		"zsh",
		"yaml",
		"yml",
		"toml",
		"xml",
		"sql",
		"graphql",
		"gql",
		"svelte",
		"vue",
		"astro",
		"dockerfile",
		"makefile",
		"env",
		"ini",
		"conf",
	];
	if (codeExts.includes(ext)) return "code";

	const textExts = ["txt", "md", "markdown", "log", "csv", "tsv", "rtf"];
	if (textExts.includes(ext)) return "text";

	const archiveExts = [
		"zip",
		"tar",
		"gz",
		"tgz",
		"rar",
		"7z",
		"bz2",
		"xz",
		"iso",
	];
	if (archiveExts.includes(ext)) return "archive";

	return "unknown";
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const success = document.execCommand("copy");
		document.body.removeChild(textArea);
		return success;
	} catch (err) {
		console.error("Failed to copy to clipboard", err);
		return false;
	}
}
