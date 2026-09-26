import type {
	CreateShareLinkOptions,
	CreateShareLinkResponse,
	CreateUploadResponse,
	ListObjectsResponse,
	MultipartPart,
	R2Object,
	ServerConfig,
	ShareMetadata,
} from "./types";

export const SESSION_KEY = "r2_explorer_session_token";

export class ApiError extends Error {
	status: number;
	data?: unknown;

	constructor(message: string, status: number, data?: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	return (
		sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
	);
}

export function setAuthToken(token: string | null, remember = false): void {
	if (typeof window === "undefined") return;
	if (!token) {
		sessionStorage.removeItem(SESSION_KEY);
		localStorage.removeItem(SESSION_KEY);
		return;
	}

	if (remember) {
		localStorage.setItem(SESSION_KEY, token);
	} else {
		sessionStorage.setItem(SESSION_KEY, token);
	}
}

export function clearAuthToken(): void {
	setAuthToken(null);
}

export function getAuthHeaders(): Record<string, string> {
	const token = getAuthToken();
	if (token) {
		return { Authorization: `Basic ${token}` };
	}
	return {};
}

/**
 * Base64 encode an object key matching btoa(unescape(encodeURIComponent(key)))
 */
export function encodeKey(key: string): string {
	if (key && key !== "/" && key.startsWith("/")) {
		key = key.slice(1);
	}
	return btoa(unescape(encodeURIComponent(key)));
}

/**
 * Base64 decode an encoded object key
 */
export function decodeKey(hash: string): string {
	return decodeURIComponent(escape(atob(hash)));
}

/**
 * Format bytes into human-readable string (e.g., "1.5 MB", "500 B")
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
	const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
	const unitIndex = Math.min(i, sizes.length - 1);
	const val = Number.parseFloat((bytes / k ** unitIndex).toFixed(dm));
	return `${val} ${sizes[unitIndex]}`;
}

export const bytesToSize = (bytes: number): string => {
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	if (bytes === 0) return "0 Byte";
	const i = Number.parseInt(
		Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)).toString(),
	);
	return `${Math.round(bytes / 1024 ** i)} ${sizes[i]}`;
};

/**
 * Retry an asynchronous operation with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxAttempts = 3,
	initialDelay = 1000,
	maxDelay = 10000,
	backoffFactor = 2,
): Promise<T> {
	let lastError: unknown = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt === maxAttempts) {
				throw lastError;
			}

			const delay = Math.min(
				initialDelay * backoffFactor ** (attempt - 1),
				maxDelay,
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError || new Error("Unexpected error in retryWithBackoff");
}

async function handleResponse<T>(
	res: Response,
	fallbackMessage: string,
): Promise<T> {
	if (!res.ok) {
		let errorMsg = "";
		let data: unknown;
		try {
			const text = await res.text();
			try {
				data = JSON.parse(text);
				errorMsg = (data as any)?.message || (data as any)?.error || text;
			} catch {
				errorMsg = text;
			}
		} catch {
			errorMsg = res.statusText;
		}
		throw new ApiError(errorMsg || fallbackMessage, res.status, data);
	}

	const contentType = res.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		return res.json() as Promise<T>;
	}
	return res.text() as unknown as T;
}

/**
 * Get server info and configuration
 * GET /api/server/config
 */
export async function getServerConfig(): Promise<ServerConfig> {
	const res = await fetch("/api/server/config", {
		headers: {
			...getAuthHeaders(),
		},
	});
	return handleResponse<ServerConfig>(res, "Failed to fetch server config");
}

/**
 * List objects in an R2 bucket
 * GET /api/buckets/${bucket}?include=customMetadata&include=httpMetadata
 */
export async function listObjects(
	bucket: string,
	prefix?: string,
	delimiter = "/",
	cursor?: string,
): Promise<ListObjectsResponse> {
	const searchParams = new URLSearchParams();
	searchParams.append("include", "customMetadata");
	searchParams.append("include", "httpMetadata");

	if (delimiter !== undefined && delimiter !== null) {
		searchParams.set("delimiter", delimiter);
	}
	if (prefix && prefix !== "/") {
		searchParams.set("prefix", encodeKey(prefix));
	}
	if (cursor) {
		searchParams.set("cursor", cursor);
	}

	const url = `/api/buckets/${encodeURIComponent(bucket)}?${searchParams.toString()}`;
	const res = await fetch(url, {
		headers: {
			...getAuthHeaders(),
		},
	});
	return handleResponse<ListObjectsResponse>(
		res,
		`Failed to list objects in bucket ${bucket}`,
	);
}

/**
 * Create a folder (0-byte object with trailing slash)
 * POST /api/buckets/${bucket}/folder with body { key: encodeKey(key) }
 */
export async function createFolder(bucket: string, key: string): Promise<any> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/folder`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify({ key: encodeKey(key) }),
	});
	return handleResponse<any>(res, `Failed to create folder ${key}`);
}

/**
 * Delete an object from an R2 bucket
 * POST /api/buckets/${bucket}/delete with body { key: encodeKey(key) }
 */
export async function deleteObject(
	bucket: string,
	key: string,
): Promise<{ success: boolean }> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/delete`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify({ key: encodeKey(key) }),
	});
	return handleResponse<{ success: boolean }>(
		res,
		`Failed to delete object ${key}`,
	);
}

/**
 * Rename/move an object
 * POST /api/buckets/${bucket}/move with { oldKey: encodeKey(oldKey), newKey: encodeKey(newKey) }
 */
export async function renameObject(
	bucket: string,
	oldKey: string,
	newKey: string,
): Promise<any> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/move`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify({
			oldKey: encodeKey(oldKey),
			newKey: encodeKey(newKey),
		}),
	});
	return handleResponse<any>(
		res,
		`Failed to rename object ${oldKey} to ${newKey}`,
	);
}

/**
 * Copy an object within or across buckets
 * POST /api/buckets/${bucket}/copy with { sourceKey: encodeKey(sourceKey), destinationKey: encodeKey(destinationKey) }
 */
export async function copyObject(
	bucket: string,
	sourceKey: string,
	destinationKey: string,
): Promise<any> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/copy`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify({
			sourceKey: encodeKey(sourceKey),
			destinationKey: encodeKey(destinationKey),
		}),
	});
	return handleResponse<any>(
		res,
		`Failed to copy object ${sourceKey} to ${destinationKey}`,
	);
}

/**
 * Create a public shareable link for a file
 * POST /api/buckets/${bucket}/${encodeKey(key)}/share
 */
export async function createShareLink(
	bucket: string,
	key: string,
	options: CreateShareLinkOptions = {},
): Promise<CreateShareLinkResponse> {
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/${encodeKey(key)}/share`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify(options),
		},
	);
	return handleResponse<CreateShareLinkResponse>(
		res,
		`Failed to create share link for ${key}`,
	);
}

/**
 * List all active share links in a bucket
 * GET /api/buckets/${bucket}/shares
 */
export async function listShares(
	bucket: string,
): Promise<{ shares: ShareMetadata[] }> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/shares`, {
		headers: {
			...getAuthHeaders(),
		},
	});
	return handleResponse<{ shares: ShareMetadata[] }>(
		res,
		`Failed to list shares for bucket ${bucket}`,
	);
}

/**
 * Delete/revoke a share link
 * DELETE /api/buckets/${bucket}/share/${shareId}
 */
export async function deleteShareLink(
	bucket: string,
	shareId: string,
): Promise<{ success: boolean }> {
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/share/${encodeURIComponent(shareId)}`,
		{
			method: "DELETE",
			headers: {
				...getAuthHeaders(),
			},
		},
	);
	return handleResponse<{ success: boolean }>(
		res,
		`Failed to delete share link ${shareId}`,
	);
}

/**
 * Fetch head metadata for an object
 * GET /api/buckets/${bucket}/${encodeKey(key)}/head
 */
export async function headObject(
	bucket: string,
	key: string,
): Promise<R2Object> {
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/${encodeKey(key)}/head`,
		{
			headers: {
				...getAuthHeaders(),
			},
		},
	);
	return handleResponse<R2Object>(res, `Failed to head object ${key}`);
}

/**
 * Create multipart upload
 * POST /api/buckets/${bucket}/multipart/create?key=...
 */
export async function multipartCreate(
	bucket: string,
	key: string,
	contentType?: string,
): Promise<CreateUploadResponse> {
	const params = new URLSearchParams();
	params.set("key", encodeKey(key));
	if (contentType) {
		params.set("httpMetadata", encodeKey(JSON.stringify({ contentType })));
	}

	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/multipart/create?${params.toString()}`,
		{
			method: "POST",
			headers: {
				...getAuthHeaders(),
			},
		},
	);
	return handleResponse<CreateUploadResponse>(
		res,
		`Failed to create multipart upload for ${key}`,
	);
}

/**
 * Complete multipart upload
 * POST /api/buckets/${bucket}/multipart/complete
 */
export async function multipartComplete(
	bucket: string,
	key: string,
	uploadId: string,
	parts: MultipartPart[],
): Promise<{ success: boolean; str?: unknown }> {
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/multipart/complete`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify({
				key: encodeKey(key),
				uploadId,
				parts,
			}),
		},
	);
	return handleResponse<{ success: boolean; str?: unknown }>(
		res,
		`Failed to complete multipart upload for ${key}`,
	);
}

export const apiClient = {
	getServerConfig,
	listObjects,
	createFolder,
	deleteObject,
	renameObject,
	copyObject,
	createShareLink,
	listShares,
	deleteShareLink,
	headObject,
	multipartCreate,
	multipartComplete,
	retryWithBackoff,
	encodeKey,
	decodeKey,
	formatBytes,
	bytesToSize,
	getAuthToken,
	setAuthToken,
	clearAuthToken,
	getAuthHeaders,
};
