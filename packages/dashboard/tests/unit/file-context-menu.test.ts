import { apiClient } from "$lib/api/client";
import type { R2Object } from "$lib/api/types";
import FileContextMenu from "$lib/components/files/FileContextMenu.svelte";
import { mount, tick, unmount } from "svelte";
import { toast } from "svelte-sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("svelte-sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("FileContextMenu Component", () => {
	let container: HTMLDivElement;

	const mockFile: R2Object = {
		key: "documents/report.pdf",
		name: "report.pdf",
		size: 2048,
		uploaded: "2026-09-26T12:00:00Z",
		httpMetadata: { contentType: "application/pdf" },
		customMetadata: {},
		etag: "etag-123",
	};

	const mockFolder: R2Object = {
		key: "documents/subfolder/",
		name: "subfolder",
		type: "folder",
		size: 0,
		uploaded: "2026-09-26T12:00:00Z",
		etag: "",
	};

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		vi.clearAllMocks();
	});

	afterEach(() => {
		document.body.removeChild(container);
		vi.restoreAllMocks();
	});

	it("initially does not render the menu dropdown", () => {
		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
			},
		});

		expect(container.querySelector('[role="menu"]')).toBeNull();
		unmount(comp);
	});

	it("opens menu and displays all file actions for a regular file", async () => {
		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const menu = container.querySelector('[role="menu"]');
		expect(menu).not.toBeNull();
		const menuText = menu?.textContent || "";
		expect(menuText).toContain("Preview");
		expect(menuText).toContain("Share Link");
		expect(menuText).toContain("Download");
		expect(menuText).toContain("Duplicate");
		expect(menuText).toContain("Delete");

		unmount(comp);
	});

	it("hides file-only actions when the target is a folder", async () => {
		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFolder,
				bucket: "test-bucket",
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const menu = container.querySelector('[role="menu"]');
		expect(menu).not.toBeNull();
		const menuText = menu?.textContent || "";
		expect(menuText).toContain("Delete");
		expect(menuText).not.toContain("Preview");
		expect(menuText).not.toContain("Share Link");
		expect(menuText).not.toContain("Download");
		expect(menuText).not.toContain("Duplicate");

		unmount(comp);
	});

	it("calls onpreview callback when clicking Preview", async () => {
		const onpreview = vi.fn();
		const onaction = vi.fn();

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
				onpreview,
				onaction,
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const previewBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Preview"),
		);
		previewBtn?.click();

		expect(onpreview).toHaveBeenCalledWith(mockFile);
		expect(onaction).toHaveBeenCalled();
		unmount(comp);
	});

	it("calls onshare callback when clicking Share Link", async () => {
		const onshare = vi.fn();
		const onaction = vi.fn();

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
				onshare,
				onaction,
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const shareBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Share Link"),
		);
		shareBtn?.click();

		expect(onshare).toHaveBeenCalledWith(mockFile);
		expect(onaction).toHaveBeenCalled();
		unmount(comp);
	});

	it("triggers download with generated anchor element", async () => {
		const onaction = vi.fn();
		const anchorClickSpy = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => {});

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
				onaction,
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const downloadBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Download"),
		);
		downloadBtn?.click();

		expect(anchorClickSpy).toHaveBeenCalled();
		expect(onaction).toHaveBeenCalled();

		anchorClickSpy.mockRestore();
		unmount(comp);
	});

	it("duplicates file with computed destination key and notifies user", async () => {
		const ondeleted = vi.fn();
		const copySpy = vi
			.spyOn(apiClient, "copyObject")
			.mockResolvedValue({} as any);

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
				ondeleted,
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const duplicateBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Duplicate"),
		);
		duplicateBtn?.click();

		await vi.waitFor(() => {
			expect(copySpy).toHaveBeenCalledWith(
				"test-bucket",
				"documents/report.pdf",
				"documents/report copy.pdf",
			);
			expect(toast.success).toHaveBeenCalledWith(
				"Duplicated to report copy.pdf",
			);
			expect(ondeleted).toHaveBeenCalledWith(mockFile);
		});

		unmount(comp);
	});

	it("deletes file when user confirms delete prompt", async () => {
		const ondeleted = vi.fn();
		vi.spyOn(window, "confirm").mockReturnValue(true);
		const deleteSpy = vi
			.spyOn(apiClient, "deleteObject")
			.mockResolvedValue({} as any);

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
				ondeleted,
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const deleteBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Delete"),
		);
		deleteBtn?.click();

		await vi.waitFor(() => {
			expect(deleteSpy).toHaveBeenCalledWith(
				"test-bucket",
				"documents/report.pdf",
			);
			expect(toast.success).toHaveBeenCalledWith("Deleted report.pdf");
			expect(ondeleted).toHaveBeenCalledWith(mockFile);
		});

		unmount(comp);
	});

	it("does not delete file when user cancels delete prompt", async () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		const deleteSpy = vi
			.spyOn(apiClient, "deleteObject")
			.mockResolvedValue({} as any);

		const comp = mount(FileContextMenu, {
			target: container,
			props: {
				file: mockFile,
				bucket: "test-bucket",
			},
		});

		const triggerBtn = container.querySelector(
			'button[aria-label="File options"]',
		) as HTMLButtonElement;
		triggerBtn.click();
		await tick();

		const deleteBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Delete"),
		);
		deleteBtn?.click();

		expect(deleteSpy).not.toHaveBeenCalled();
		unmount(comp);
	});
});
