import type { R2Object, ServerConfig } from "$lib/api/types";

/** Factory for a typical server config API response */
export function mockServerConfig(
	overrides: Partial<ServerConfig> = {},
): ServerConfig {
	return {
		version: overrides.version ?? "1.0.0",
		config: {
			readonly: false,
			showHiddenFiles: false,
			emailRouting: false,
			...overrides.config,
		},
		auth: overrides.auth ?? { type: "basic", username: "admin" },
		buckets: overrides.buckets ?? [
			{ name: "my-bucket", publicUrl: "https://cdn.example.com" },
			{ name: "other-bucket", publicUrl: null },
		],
	};
}

/** Factory for a list of mock R2 objects */
export function mockR2Object(overrides: Partial<R2Object> = {}): R2Object {
	return {
		key: overrides.key ?? "file.txt",
		size: overrides.size ?? 1024,
		uploaded: overrides.uploaded ?? "2026-01-15T10:30:00Z",
		httpMetadata: overrides.httpMetadata ?? { contentType: "text/plain" },
		customMetadata: overrides.customMetadata ?? {},
		name: overrides.name ?? overrides.key?.split("/").pop() ?? "file.txt",
		type: overrides.type ?? "file",
		...overrides,
	};
}

/** Factory for a file list API response */
export function mockListResponse(
	files: Partial<R2Object>[] = [],
	delimitedPrefixes: string[] = [],
	truncated = false,
) {
	return {
		objects: files.map((f) => mockR2Object(f)),
		delimitedPrefixes,
		truncated,
		cursor: truncated ? "next-cursor" : undefined,
	};
}
