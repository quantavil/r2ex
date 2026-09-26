import Breadcrumbs from "$lib/components/layout/Breadcrumbs.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import Topbar from "$lib/components/layout/Topbar.svelte";
import { appState } from "$lib/components/state.svelte";
import * as modeWatcher from "mode-watcher";
import { mount, tick, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("mode-watcher", () => ({
	toggleMode: vi.fn(),
	mode: {
		subscribe: (fn: (val: string) => void) => {
			fn("dark");
			return () => {};
		},
	},
}));

describe("Layout and Navigation Components", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		appState.reset();
		vi.clearAllMocks();
	});

	afterEach(() => {
		document.body.removeChild(container);
		vi.restoreAllMocks();
	});

	describe("Breadcrumbs Component", () => {
		it("renders root bucket when path is empty", () => {
			const comp = mount(Breadcrumbs, {
				target: container,
				props: {
					bucket: "my-bucket",
					path: "",
				},
			});

			expect(container.textContent).toContain("my-bucket");
			expect(
				container.querySelectorAll("span[aria-hidden='true']"),
			).toHaveLength(0);
			unmount(comp);
		});

		it("renders breadcrumb path segments with separators", () => {
			const comp = mount(Breadcrumbs, {
				target: container,
				props: {
					bucket: "my-bucket",
					path: "photos/2026/vacation",
				},
			});

			expect(container.textContent).toContain("my-bucket");
			expect(container.textContent).toContain("photos");
			expect(container.textContent).toContain("2026");
			expect(container.textContent).toContain("vacation");

			const activePage = container.querySelector('[aria-current="page"]');
			expect(activePage?.textContent?.trim()).toBe("vacation");

			unmount(comp);
		});

		it("invokes navigation callback when clicking an ancestor segment", () => {
			const onNavigate = vi.fn();
			const comp = mount(Breadcrumbs, {
				target: container,
				props: {
					bucket: "my-bucket",
					path: "photos/2026/vacation",
					onNavigate,
				},
			});

			const buttons = Array.from(container.querySelectorAll("button"));
			const photosBtn = buttons.find((b) => b.textContent?.trim() === "photos");
			photosBtn?.click();

			expect(onNavigate).toHaveBeenCalledWith("photos");
			expect(appState.currentPath).toBe("photos");

			unmount(comp);
		});

		it("navigates to root when clicking the bucket pill", () => {
			const onNavigate = vi.fn();
			const comp = mount(Breadcrumbs, {
				target: container,
				props: {
					bucket: "my-bucket",
					path: "photos/2026",
					onNavigate,
				},
			});

			const buttons = Array.from(container.querySelectorAll("button"));
			const rootBtn = buttons.find((b) => b.textContent?.includes("my-bucket"));
			rootBtn?.click();

			expect(onNavigate).toHaveBeenCalledWith("");
			expect(appState.currentPath).toBe("");

			unmount(comp);
		});
	});

	describe("Topbar Component", () => {
		it("binds search input and invokes onSearch callback", async () => {
			const onSearch = vi.fn();
			const comp = mount(Topbar, {
				target: container,
				props: { onSearch },
			});

			const input = container.querySelector(
				"input[type='text']",
			) as HTMLInputElement;
			input.value = "invoice";
			input.dispatchEvent(new Event("input", { bubbles: true }));
			await tick();

			expect(appState.searchQuery).toBe("invoice");
			expect(onSearch).toHaveBeenCalledWith("invoice");

			unmount(comp);
		});

		it("clears search query when clicking clear button", async () => {
			const onSearch = vi.fn();
			appState.searchQuery = "invoice";

			const comp = mount(Topbar, {
				target: container,
				props: { onSearch },
			});

			const clearBtn = container.querySelector(
				'button[aria-label="Clear search query"]',
			) as HTMLButtonElement;
			expect(clearBtn).not.toBeNull();
			clearBtn.click();
			await tick();

			expect(appState.searchQuery).toBe("");
			expect(onSearch).toHaveBeenCalledWith("");

			unmount(comp);
		});

		it("toggles viewMode between table and grid", async () => {
			const comp = mount(Topbar, {
				target: container,
			});

			const gridBtn = container.querySelector(
				'button[aria-label="Grid view"]',
			) as HTMLButtonElement;
			gridBtn.click();
			await tick();
			expect(appState.viewMode).toBe("grid");

			const tableBtn = container.querySelector(
				'button[aria-label="Table view"]',
			) as HTMLButtonElement;
			tableBtn.click();
			await tick();
			expect(appState.viewMode).toBe("table");

			unmount(comp);
		});

		it("disables New Folder and Upload buttons when in read-only mode", () => {
			appState.apiReadonly = true;

			const comp = mount(Topbar, {
				target: container,
			});

			const buttons = Array.from(container.querySelectorAll("button"));
			const newFolderBtn = buttons.find((b) =>
				b.textContent?.includes("New Folder"),
			);
			const uploadBtn = buttons.find((b) => b.textContent?.includes("Upload"));

			expect(newFolderBtn?.hasAttribute("disabled")).toBe(true);
			expect(uploadBtn?.hasAttribute("disabled")).toBe(true);

			unmount(comp);
		});

		it("triggers onNewFolder and onUpload when clicked in write mode", () => {
			appState.apiReadonly = false;
			const onNewFolder = vi.fn();
			const onUpload = vi.fn();

			const comp = mount(Topbar, {
				target: container,
				props: { onNewFolder, onUpload },
			});

			const buttons = Array.from(container.querySelectorAll("button"));
			const newFolderBtn = buttons.find((b) =>
				b.textContent?.includes("New Folder"),
			);
			const uploadBtn = buttons.find((b) => b.textContent?.includes("Upload"));

			newFolderBtn?.click();
			expect(onNewFolder).toHaveBeenCalled();

			uploadBtn?.click();
			expect(onUpload).toHaveBeenCalled();

			unmount(comp);
		});
	});

	describe("Sidebar Component", () => {
		it("renders read-only mode banner when apiReadonly is true", () => {
			appState.apiReadonly = true;

			const comp = mount(Sidebar, {
				target: container,
			});

			expect(container.textContent).toContain("Read-Only Mode");
			unmount(comp);
		});

		it("hides read-only mode banner when apiReadonly is false", () => {
			appState.apiReadonly = false;

			const comp = mount(Sidebar, {
				target: container,
			});

			expect(container.textContent).not.toContain("Read-Only Mode");
			unmount(comp);
		});

		it("switches active navigation when navigation buttons are clicked", async () => {
			const comp = mount(Sidebar, {
				target: container,
			});

			const buttons = Array.from(container.querySelectorAll("button"));
			const sharesBtn = buttons.find((b) =>
				b.textContent?.includes("Shared Links"),
			);
			sharesBtn?.click();
			await tick();
			expect(appState.activeNav).toBe("shares");

			const storageBtn = buttons.find((b) =>
				b.textContent?.includes("Storage Info"),
			);
			storageBtn?.click();
			await tick();
			expect(appState.activeNav).toBe("storage");

			const filesBtn = buttons.find((b) =>
				b.textContent?.includes("All Files"),
			);
			filesBtn?.click();
			await tick();
			expect(appState.activeNav).toBe("files");

			unmount(comp);
		});

		it("toggles sidebar collapse state", async () => {
			const comp = mount(Sidebar, {
				target: container,
			});

			expect(appState.sidebarOpen).toBe(true);

			const collapseBtn = container.querySelector(
				'button[aria-label="Collapse sidebar"]',
			) as HTMLButtonElement;
			collapseBtn.click();
			await tick();

			expect(appState.sidebarOpen).toBe(false);

			unmount(comp);
		});

		it("invokes toggleMode when clicking the theme toggle button", () => {
			const comp = mount(Sidebar, {
				target: container,
			});

			const themeBtn = container.querySelector(
				'button[aria-label="Toggle theme"]',
			) as HTMLButtonElement;
			themeBtn.click();

			expect(modeWatcher.toggleMode).toHaveBeenCalled();
			unmount(comp);
		});
	});
});
