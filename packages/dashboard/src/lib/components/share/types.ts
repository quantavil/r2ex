export interface ShareItem {
	shareId: string;
	shareUrl: string;
	key: string;
	expiresAt?: number;
	maxDownloads?: number;
	currentDownloads: number;
	createdBy: string;
	createdAt: number;
	isExpired: boolean;
	hasPassword: boolean;
}

export interface CreateShareOptions {
	expiresIn?: number;
	password?: string;
	maxDownloads?: number;
}

export interface CreateShareResult {
	shareId: string;
	shareUrl: string;
	expiresAt?: number;
}

export type MediaType =
	| "image"
	| "video"
	| "audio"
	| "pdf"
	| "code"
	| "text"
	| "archive"
	| "unknown";

export interface FilePreviewData {
	key: string;
	name: string;
	size?: number;
	url?: string;
	contentType?: string;
	bucket?: string;
}
