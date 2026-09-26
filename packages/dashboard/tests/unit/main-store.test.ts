import * as client from "$lib/api/client";
import { appState } from "$lib/components/state.svelte";
import { mainStore } from "$lib/stores/main.svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockServerConfig } from "../helpers";

describe("mainStore", () => {
	beforeEach(() => {
		mainStore.reset();
		vi.clearAllMocks();
	});

	it("has correct initial state", () => {
		expect(mainStore.apiReadonly).toBe(true);
		expect(mainStore.buckets).toEqual([]);
		expect(mainStore.config).toEqual({});
		expect(mainStore.version).toBe("");
		expect(mainStore.showHiddenFiles).toBe(false);
		expect(mainStore.currentBucket).toBe("");
		expect(mainStore.currentFolder).toBe("");
	});

	describe("loadServerConfigs", () => {
		it("populates store from API response", async () => {
			const config = mockServerConfig({
				version: "2.0.0",
				config: { readonly: false, showHiddenFiles: true },
				buckets: [{ name: "photos" }, { name: "backups" }],
			});

			vi.spyOn(client, "getServerConfig").mockResolvedValue(config);

			const result = await mainStore.loadServerConfigs();

			expect(result).toEqual(config);
			expect(mainStore.version).toBe("2.0.0");
			expect(mainStore.apiReadonly).toBe(false);
			expect(mainStore.showHiddenFiles).toBe(true);
			expect(mainStore.buckets.length).toBe(2);
			expect(mainStore.currentBucket).toBe("photos");
		});

		it("respects readonly mode from server", async () => {
			const config = mockServerConfig({
				config: { readonly: true },
			});
			vi.spyOn(client, "getServerConfig").mockResolvedValue(config);

			await mainStore.loadServerConfigs();
			expect(mainStore.apiReadonly).toBe(true);
		});

		it("handles API error when loading server configs", async () => {
			const err = new Error("Network error");
			vi.spyOn(client, "getServerConfig").mockRejectedValue(err);

			await expect(mainStore.loadServerConfigs()).rejects.toThrow(
				"Network error",
			);
		});
	});

	describe("navigation and state actions", () => {
		it("setBucket updates bucket and clears currentFolder", () => {
			mainStore.setFolder("sub/folder/");
			mainStore.setBucket("my-bucket");

			expect(mainStore.currentBucket).toBe("my-bucket");
			expect(mainStore.currentFolder).toBe("");
		});

		it("setFolder updates folder prefix", () => {
			mainStore.setFolder("photos/2026/");
			expect(mainStore.currentFolder).toBe("photos/2026/");
		});

		it("toggleHiddenFiles toggles visibility", () => {
			expect(mainStore.showHiddenFiles).toBe(false);
			mainStore.toggleHiddenFiles();
			expect(mainStore.showHiddenFiles).toBe(true);
			mainStore.toggleHiddenFiles();
			expect(mainStore.showHiddenFiles).toBe(false);
		});
	});
});

describe("appState", () => {
	it("has correct initial state", () => {
		expect(appState.viewMode).toBe("table");
		expect(appState.sidebarOpen).toBe(true);
		expect(appState.mobileMenuOpen).toBe(false);
		expect(appState.activeNav).toBe("files");
	});

	it("toggles viewMode between table and grid", () => {
		expect(appState.viewMode).toBe("table");
		appState.toggleViewMode();
		expect(appState.viewMode).toBe("grid");
		appState.toggleViewMode();
		expect(appState.viewMode).toBe("table");
	});

	it("toggles sidebar", () => {
		expect(appState.sidebarOpen).toBe(true);
		appState.toggleSidebar();
		expect(appState.sidebarOpen).toBe(false);
		appState.toggleSidebar();
		expect(appState.sidebarOpen).toBe(true);
	});

	it("toggles mobile menu and sets explicit state", () => {
		expect(appState.mobileMenuOpen).toBe(false);
		appState.toggleMobileMenu();
		expect(appState.mobileMenuOpen).toBe(true);
		appState.setMobileMenu(false);
		expect(appState.mobileMenuOpen).toBe(false);
	});

	it("updates active navigation tab", () => {
		appState.setActiveNav("shares");
		expect(appState.activeNav).toBe("shares");
		appState.setActiveNav("storage");
		expect(appState.activeNav).toBe("storage");
		appState.setActiveNav("files");
		expect(appState.activeNav).toBe("files");
	});
});
