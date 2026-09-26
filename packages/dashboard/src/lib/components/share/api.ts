import type { CreateShareOptions, CreateShareResult, ShareItem } from "./types";
import { encodeKey } from "./utils";

export class ApiError extends Error {
	status: number;
	data: any;

	constructor(message: string, status: number, data?: any) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		let errorMessage = `Request failed with status ${res.status}`;
		let errorData: any = null;
		try {
			errorData = await res.json();
			if (errorData?.message) {
				errorMessage = errorData.message;
			}
		} catch {
			try {
				const text = await res.text();
				if (text) errorMessage = text;
			} catch {}
		}
		throw new ApiError(errorMessage, res.status, errorData);
	}
	return res.json() as Promise<T>;
}

export async function createShareLink(
	bucket: string,
	key: string,
	options: CreateShareOptions,
): Promise<CreateShareResult> {
	const encodedKey = encodeKey(key);
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/${encodedKey}/share`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(options),
		},
	);

	return handleResponse<CreateShareResult>(res);
}

export async function listShares(bucket: string): Promise<ShareItem[]> {
	const res = await fetch(`/api/buckets/${encodeURIComponent(bucket)}/shares`, {
		method: "GET",
	});

	const data = await handleResponse<{ shares: ShareItem[] }>(res);
	return data.shares || [];
}

export async function deleteShareLink(
	bucket: string,
	shareId: string,
): Promise<boolean> {
	const res = await fetch(
		`/api/buckets/${encodeURIComponent(bucket)}/share/${encodeURIComponent(shareId)}`,
		{
			method: "DELETE",
		},
	);

	const data = await handleResponse<{ success: boolean }>(res);
	return !!data.success;
}

export async function fetchSharedFile(
	shareId: string,
	password?: string,
): Promise<Response> {
	let url = `/share/${encodeURIComponent(shareId)}`;
	if (password) {
		url += `?password=${encodeURIComponent(password)}`;
	}

	const res = await fetch(url, {
		method: "GET",
	});

	return res;
}
