import { getServerConfig } from "$lib/api/client";
import type { BucketInfo, ServerConfig } from "$lib/api/types";

export class MainStore {
	apiReadonly = $state<boolean>(true);
	config = $state<any>({});
	auth = $state<any>({});
	version = $state<string>("");
	showHiddenFiles = $state<boolean>(false);
	buckets = $state<BucketInfo[]>([]);
	currentBucket = $state<string>("");
	currentFolder = $state<string>("");

	get serverUrl(): string {
		if (typeof window !== "undefined") {
			return window.location.origin;
		}
		return "";
	}

	async loadServerConfigs(): Promise<ServerConfig> {
		try {
			const data = await getServerConfig();

			this.apiReadonly = data.config?.readonly ?? true;
			this.config = data.config ?? {};
			this.auth = data.auth ?? {};
			this.version = data.version ?? "";
			this.showHiddenFiles = data.config?.showHiddenFiles ?? false;
			this.buckets = data.buckets ?? [];

			if (!this.currentBucket && this.buckets.length > 0) {
				this.currentBucket = this.buckets[0].name;
			}

			return data;
		} catch (error) {
			console.error("Failed to load server configs:", error);
			throw error;
		}
	}

	setBucket(name: string): void {
		this.currentBucket = name;
		this.currentFolder = "";
	}

	setFolder(prefix: string): void {
		this.currentFolder = prefix;
	}

	toggleHiddenFiles(): void {
		this.showHiddenFiles = !this.showHiddenFiles;
	}

	reset(): void {
		this.apiReadonly = true;
		this.config = {};
		this.auth = {};
		this.version = "";
		this.showHiddenFiles = false;
		this.buckets = [];
		this.currentBucket = "";
		this.currentFolder = "";
	}
}

export const mainStore = new MainStore();
