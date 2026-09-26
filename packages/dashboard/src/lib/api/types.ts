export interface R2HttpMetadata {
	contentType?: string;
	contentLanguage?: string;
	contentDisposition?: string;
	contentEncoding?: string;
	cacheControl?: string;
	cacheExpiry?: Date | string;
}

export interface R2Object {
	key: string;
	version?: string;
	size: number;
	etag?: string;
	httpEtag?: string;
	uploaded: string | Date;
	httpMetadata?: R2HttpMetadata;
	customMetadata?: Record<string, string>;
	range?: unknown;
	checksums?: Record<string, unknown>;
	// Mapped UI properties
	name?: string;
	hash?: string;
	nameHash?: string;
	type?: "file" | "folder";
	icon?: string;
	color?: string;
	lastModified?: string;
	timestamp?: number;
}

export interface ShareMetadata {
	shareId?: string;
	shareUrl?: string;
	bucket: string;
	key: string;
	expiresAt?: number;
	passwordHash?: string;
	maxDownloads?: number;
	currentDownloads: number;
	createdBy: string;
	createdAt: number;
	isExpired?: boolean;
	hasPassword?: boolean;
}

export interface BucketInfo {
	name: string;
	publicUrl?: string | null;
}

export interface AuthInfo {
	type: string;
	username: string;
}

export interface ServerConfig {
	version: string;
	config: {
		readonly?: boolean;
		cors?: boolean;
		cfAccessTeamName?: string;
		dashboardUrl?: string;
		showHiddenFiles?: boolean;
		emailRouting?:
			| {
					targetBucket: string;
			  }
			| false;
		[key: string]: unknown;
	};
	auth?: AuthInfo;
	buckets: BucketInfo[];
}

export interface UploadTask {
	id: string;
	file: File;
	key: string;
	bucket: string;
	size: number;
	progress: number; // 0 to 100
	uploadedBytes?: number;
	status: "pending" | "uploading" | "completed" | "error" | "aborted";
	error?: string;
	isMultipart?: boolean;
	abortController?: AbortController;
	xhr?: XMLHttpRequest;
}

export type UploadProgressCallback = (progress: {
	loaded: number;
	total: number;
	percent: number;
}) => void;

export interface CreateShareLinkOptions {
	expiresIn?: number;
	password?: string;
	maxDownloads?: number;
}

export interface CreateShareLinkResponse {
	shareId: string;
	shareUrl: string;
	expiresAt?: number;
}

export interface ListObjectsResponse {
	objects: R2Object[];
	delimitedPrefixes: string[];
	truncated: boolean;
	cursor?: string;
}

export interface MultipartPart {
	partNumber: number;
	etag: string;
}

export interface CreateUploadResponse {
	uploadId: string;
	key: string;
}
