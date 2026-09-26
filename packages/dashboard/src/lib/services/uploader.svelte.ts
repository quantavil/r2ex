import { encodeKey, formatBytes, getAuthHeaders } from "$lib/api/client";
import type { MultipartPart, UploadTask } from "$lib/api/types";

const CHUNK_SIZE = 95 * 1024 * 1024; // 95MB

export class UploadManager {
	tasks = $state<UploadTask[]>([]);
	isUploading = $state<boolean>(false);
	aggregateProgress = $state<number>(0);
	uploadSpeed = $state<string>("");

	private isProcessing = false;
	private speedInterval: ReturnType<typeof setInterval> | null = null;
	private lastSpeedTime = 0;
	private lastSpeedBytes = 0;

	/**
	 * Upload files to a specific bucket and folder prefix.
	 * Files <= 95MB are uploaded directly via XMLHttpRequest.
	 * Files > 95MB are chunked and uploaded via multipart upload API.
	 */
	async uploadFiles(
		bucket: string,
		prefix: string,
		files: File[],
	): Promise<UploadTask[]> {
		if (!files || files.length === 0) {
			return [];
		}

		// Normalize target prefix
		let targetPrefix = prefix || "";
		if (targetPrefix === "/" || targetPrefix === "IA==") {
			targetPrefix = "";
		} else if (targetPrefix.length > 0 && !targetPrefix.endsWith("/")) {
			targetPrefix += "/";
		}

		// Create upload tasks
		const newTasks: UploadTask[] = files.map((file) => {
			const relativePath = file.webkitRelativePath || file.name;
			const key = `${targetPrefix}${relativePath}`;
			return {
				id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
				file,
				key,
				bucket,
				size: file.size,
				progress: 0,
				uploadedBytes: 0,
				status: "pending",
				isMultipart: file.size > CHUNK_SIZE,
			};
		});

		this.tasks = [...this.tasks, ...newTasks];
		this.recalculateAggregate();

		// Start processing queue
		await this.processQueue();

		return newTasks;
	}

	/**
	 * Cancel a specific upload task by ID
	 */
	cancelTask(taskId: string): void {
		const task = this.tasks.find((t) => t.id === taskId);
		if (task && (task.status === "uploading" || task.status === "pending")) {
			task.status = "aborted";
			if (task.xhr) {
				try {
					task.xhr.abort();
				} catch (e) {
					console.warn("Error aborting xhr:", e);
				}
				task.xhr = undefined;
			}
			if (task.abortController) {
				try {
					task.abortController.abort();
				} catch (e) {
					console.warn("Error aborting abortController:", e);
				}
				task.abortController = undefined;
			}
			this.recalculateAggregate();
			this.checkIfAllFinished();
		}
	}

	/**
	 * Cancel all pending and active upload tasks
	 */
	cancelAll(): void {
		for (const task of this.tasks) {
			if (task.status === "uploading" || task.status === "pending") {
				task.status = "aborted";
				if (task.xhr) {
					try {
						task.xhr.abort();
					} catch (e) {
						console.warn("Error aborting xhr:", e);
					}
					task.xhr = undefined;
				}
				if (task.abortController) {
					try {
						task.abortController.abort();
					} catch (e) {
						console.warn("Error aborting abortController:", e);
					}
					task.abortController = undefined;
				}
			}
		}
		this.isUploading = false;
		this.stopSpeedTracker();
		this.recalculateAggregate();
	}

	/**
	 * Remove completed or aborted tasks from the task list
	 */
	clearCompleted(): void {
		this.tasks = this.tasks.filter(
			(t) => t.status !== "completed" && t.status !== "aborted",
		);
		this.recalculateAggregate();
	}

	/**
	 * Remove a specific task
	 */
	removeTask(taskId: string): void {
		this.cancelTask(taskId);
		this.tasks = this.tasks.filter((t) => t.id !== taskId);
		this.recalculateAggregate();
	}

	/**
	 * Process pending tasks in queue
	 */
	private async processQueue(): Promise<void> {
		if (this.isProcessing) return;
		this.isProcessing = true;
		this.isUploading = true;
		this.startSpeedTracker();

		try {
			while (true) {
				const nextTask = this.tasks.find((t) => t.status === "pending");
				if (!nextTask) break;

				nextTask.status = "uploading";
				nextTask.abortController = new AbortController();

				try {
					if (nextTask.isMultipart) {
						await this.uploadMultipart(nextTask);
					} else {
						await this.uploadDirect(nextTask);
					}

					if ((nextTask.status as string) !== "aborted") {
						nextTask.status = "completed";
						nextTask.progress = 100;
						nextTask.uploadedBytes = nextTask.size;
					}
				} catch (error: any) {
					if ((nextTask.status as string) !== "aborted") {
						nextTask.status = "error";
						nextTask.error = error?.message || String(error);
					}
				} finally {
					nextTask.xhr = undefined;
					nextTask.abortController = undefined;
				}

				this.recalculateAggregate();
			}
		} finally {
			this.isProcessing = false;
			this.checkIfAllFinished();
		}
	}

	/**
	 * Direct single-part upload for files <= 95MB using XMLHttpRequest
	 */
	private uploadDirect(task: UploadTask): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (task.status === "aborted") {
				return resolve();
			}

			const keyEncoded = encodeKey(task.key);
			const httpMetadataEncoded = encodeKey(
				JSON.stringify({
					contentType: task.file.type || "application/octet-stream",
				}),
			);
			const url = `/api/buckets/${encodeURIComponent(task.bucket)}/upload?key=${keyEncoded}&httpMetadata=${httpMetadataEncoded}`;

			const xhr = new XMLHttpRequest();
			task.xhr = xhr;

			if (task.abortController) {
				task.abortController.signal.addEventListener("abort", () => {
					try {
						xhr.abort();
					} catch {}
				});
			}

			xhr.open("POST", url);

			// Add authorization headers
			const authHeaders = getAuthHeaders();
			for (const [headerName, headerVal] of Object.entries(authHeaders)) {
				xhr.setRequestHeader(headerName, headerVal);
			}

			// Track progress
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable && task.status !== "aborted") {
					task.uploadedBytes = event.loaded;
					task.progress = Math.min(
						100,
						Math.round((event.loaded / event.total) * 100),
					);
					this.recalculateAggregate();
				}
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					task.uploadedBytes = task.size;
					task.progress = 100;
					resolve();
				} else {
					reject(
						new Error(
							`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`,
						),
					);
				}
			};

			xhr.onerror = () => {
				reject(new Error("Network error during upload"));
			};

			xhr.onabort = () => {
				task.status = "aborted";
				resolve();
			};

			xhr.send(task.file);
		});
	}

	/**
	 * Multipart upload for files > 95MB
	 */
	private async uploadMultipart(task: UploadTask): Promise<void> {
		if (task.status === "aborted") return;

		// 1. POST /api/buckets/${bucket}/multipart/create?key=... -> get uploadId
		const keyEncoded = encodeKey(task.key);
		const httpMetadataEncoded = encodeKey(
			JSON.stringify({
				contentType: task.file.type || "application/octet-stream",
			}),
		);
		const createUrl = `/api/buckets/${encodeURIComponent(task.bucket)}/multipart/create?key=${keyEncoded}&httpMetadata=${httpMetadataEncoded}`;

		const createRes = await fetch(createUrl, {
			method: "POST",
			headers: {
				...getAuthHeaders(),
			},
			signal: task.abortController?.signal,
		});

		if (!createRes.ok) {
			const errText = await createRes.text().catch(() => createRes.statusText);
			throw new Error(`Failed to create multipart upload: ${errText}`);
		}

		const createData = (await createRes.json()) as { uploadId: string };
		const uploadId = createData.uploadId;

		if (!uploadId) {
			throw new Error("No uploadId returned from multipart create");
		}

		// 2. Slice file into 95MB chunks and upload parts
		let partNumber = 1;
		const parts: MultipartPart[] = [];
		let uploadedBeforeCurrentPart = 0;

		for (let start = 0; start < task.file.size; start += CHUNK_SIZE) {
			if ((task.status as string) === "aborted") {
				return;
			}

			const end = Math.min(start + CHUNK_SIZE, task.file.size);
			const chunk = task.file.slice(start, end);

			const partResult = await this.uploadPartChunk(
				task,
				uploadId,
				partNumber,
				chunk,
				(partLoaded) => {
					task.uploadedBytes = uploadedBeforeCurrentPart + partLoaded;
					task.progress = Math.min(
						100,
						Math.round((task.uploadedBytes / task.size) * 100),
					);
					this.recalculateAggregate();
				},
			);

			if ((task.status as string) === "aborted") {
				return;
			}

			parts.push(partResult);
			uploadedBeforeCurrentPart += chunk.size;
			task.uploadedBytes = uploadedBeforeCurrentPart;
			task.progress = Math.min(
				100,
				Math.round((task.uploadedBytes / task.size) * 100),
			);
			this.recalculateAggregate();

			partNumber += 1;
		}

		if ((task.status as string) === "aborted") {
			return;
		}

		// 3. POST /api/buckets/${bucket}/multipart/complete
		const completeUrl = `/api/buckets/${encodeURIComponent(task.bucket)}/multipart/complete`;
		const completeRes = await fetch(completeUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify({
				key: keyEncoded,
				uploadId,
				parts,
			}),
			signal: task.abortController?.signal,
		});

		if (!completeRes.ok) {
			const errText = await completeRes
				.text()
				.catch(() => completeRes.statusText);
			throw new Error(`Failed to complete multipart upload: ${errText}`);
		}
	}

	/**
	 * Upload an individual part chunk using XMLHttpRequest for progress tracking
	 */
	private uploadPartChunk(
		task: UploadTask,
		uploadId: string,
		partNumber: number,
		chunk: Blob,
		onProgress: (loaded: number) => void,
	): Promise<MultipartPart> {
		return new Promise<MultipartPart>((resolve, reject) => {
			if (task.status === "aborted") {
				return reject(new Error("Upload aborted"));
			}

			const keyEncoded = encodeKey(task.key);
			const url = `/api/buckets/${encodeURIComponent(task.bucket)}/multipart/upload?key=${keyEncoded}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`;

			const xhr = new XMLHttpRequest();
			task.xhr = xhr;

			if (task.abortController) {
				task.abortController.signal.addEventListener("abort", () => {
					try {
						xhr.abort();
					} catch {}
				});
			}

			xhr.open("POST", url);

			const authHeaders = getAuthHeaders();
			for (const [hName, hVal] of Object.entries(authHeaders)) {
				xhr.setRequestHeader(hName, hVal);
			}
			xhr.setRequestHeader("Content-Type", "application/octet-stream");

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable && task.status !== "aborted") {
					onProgress(event.loaded);
				}
			};

			xhr.onload = () => {
				task.xhr = undefined;
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const data = JSON.parse(xhr.responseText);
						resolve({
							partNumber: data.partNumber ?? partNumber,
							etag: data.etag ?? xhr.getResponseHeader("etag") ?? "",
						});
					} catch {
						resolve({
							partNumber,
							etag: xhr.getResponseHeader("etag") || "",
						});
					}
				} else {
					reject(
						new Error(
							`Failed uploading part ${partNumber} (${xhr.status}): ${xhr.responseText || xhr.statusText}`,
						),
					);
				}
			};

			xhr.onerror = () => {
				task.xhr = undefined;
				reject(new Error(`Network error uploading part ${partNumber}`));
			};

			xhr.onabort = () => {
				task.xhr = undefined;
				task.status = "aborted";
				reject(new Error("Upload aborted"));
			};

			xhr.send(chunk);
		});
	}

	private recalculateAggregate(): void {
		const totalBytes = this.tasks.reduce((sum, t) => sum + t.size, 0);
		if (totalBytes === 0) {
			this.aggregateProgress = 0;
			return;
		}

		const loadedBytes = this.tasks.reduce((sum, t) => {
			if (t.status === "completed") return sum + t.size;
			return sum + (t.uploadedBytes ?? (t.progress / 100) * t.size);
		}, 0);

		this.aggregateProgress = Math.min(
			100,
			Math.round((loadedBytes / totalBytes) * 100),
		);
	}

	private calculateTotalUploadedBytes(): number {
		return this.tasks.reduce((sum, t) => {
			if (t.status === "completed") return sum + t.size;
			return sum + (t.uploadedBytes ?? (t.progress / 100) * t.size);
		}, 0);
	}

	private startSpeedTracker(): void {
		this.stopSpeedTracker();
		this.lastSpeedTime = performance.now();
		this.lastSpeedBytes = this.calculateTotalUploadedBytes();

		this.speedInterval = setInterval(() => {
			const now = performance.now();
			const durationSec = (now - this.lastSpeedTime) / 1000;
			if (durationSec <= 0) return;

			const currentBytes = this.calculateTotalUploadedBytes();
			const bytesUploaded = Math.max(0, currentBytes - this.lastSpeedBytes);
			const bytesPerSec = bytesUploaded / durationSec;

			if (this.isUploading && bytesPerSec > 0) {
				this.uploadSpeed = `${formatBytes(bytesPerSec)}/s`;
			} else if (!this.isUploading) {
				this.uploadSpeed = "";
			}

			this.lastSpeedTime = now;
			this.lastSpeedBytes = currentBytes;
		}, 1000);
	}

	private stopSpeedTracker(): void {
		if (this.speedInterval) {
			clearInterval(this.speedInterval);
			this.speedInterval = null;
		}
		this.uploadSpeed = "";
	}

	private checkIfAllFinished(): void {
		const active = this.tasks.some(
			(t) => t.status === "uploading" || t.status === "pending",
		);
		if (!active) {
			this.isUploading = false;
			this.stopSpeedTracker();
		}
	}
}

export const uploadManager = new UploadManager();
