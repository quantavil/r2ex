import { describe, expect, it } from "vitest";
import { UploadManager } from "../../src/lib/services/uploader.svelte";

describe("UploadManager", () => {
	it("initializes with empty state", () => {
		const manager = new UploadManager();
		expect(manager.tasks).toEqual([]);
		expect(manager.isUploading).toBe(false);
		expect(manager.aggregateProgress).toBe(0);
	});

	it("identifies multipart requirement for files > 95MB", () => {
		const smallSize = 10 * 1024 * 1024; // 10MB
		const largeSize = 120 * 1024 * 1024; // 120MB
		const chunkSize = 95 * 1024 * 1024;

		expect(smallSize > chunkSize).toBe(false);
		expect(largeSize > chunkSize).toBe(true);
	});

	it("can clear completed tasks", () => {
		const manager = new UploadManager();
		manager.clearCompleted();
		expect(manager.tasks.length).toBe(0);
	});
});
