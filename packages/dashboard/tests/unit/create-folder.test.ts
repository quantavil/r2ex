import { apiClient } from "$lib/api/client";
import CreateFolderDialog from "$lib/components/files/CreateFolderDialog.svelte";
import { mainStore } from "$lib/stores/main.svelte";
import { mount, unmount } from "svelte";
import { toast } from "svelte-sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("svelte-sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("CreateFolderDialog", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		mainStore.reset();
		vi.clearAllMocks();
	});

	it("does not render modal contents when open is false", () => {
		const comp = mount(CreateFolderDialog, {
			target: container,
			props: { open: false },
		});

		expect(container.querySelector("form")).toBeNull();
		unmount(comp);
	});

	it("renders modal form when open is true", () => {
		const comp = mount(CreateFolderDialog, {
			target: container,
			props: { open: true },
		});

		expect(container.querySelector("form")).not.toBeNull();
		expect(container.querySelector("input#folder-name-input")).not.toBeNull();
		unmount(comp);
	});

	it("validates empty folder name without calling API", async () => {
		mainStore.setBucket("test-bucket");
		const comp = mount(CreateFolderDialog, {
			target: container,
			props: { open: true },
		});

		const createFolderSpy = vi
			.spyOn(apiClient, "createFolder")
			.mockResolvedValue({} as any);

		const form = container.querySelector("form");
		form?.dispatchEvent(new Event("submit", { cancelable: true }));

		expect(toast.error).toHaveBeenCalledWith("Folder name cannot be empty");
		expect(createFolderSpy).not.toHaveBeenCalled();
		unmount(comp);
	});

	it("requires a selected bucket", async () => {
		mainStore.currentBucket = "";
		const comp = mount(CreateFolderDialog, {
			target: container,
			props: { open: true },
		});

		const input = container.querySelector(
			"input#folder-name-input",
		) as HTMLInputElement;
		input.value = "NewFolder";
		input.dispatchEvent(new Event("input"));

		const createFolderSpy = vi
			.spyOn(apiClient, "createFolder")
			.mockResolvedValue({} as any);
		const form = container.querySelector("form");
		form?.dispatchEvent(new Event("submit", { cancelable: true }));

		expect(toast.error).toHaveBeenCalledWith("No bucket selected");
		expect(createFolderSpy).not.toHaveBeenCalled();
		unmount(comp);
	});

	it("calls apiClient.createFolder with correct sanitized targetKey", async () => {
		mainStore.setBucket("my-bucket");
		mainStore.setFolder("projects/");

		const oncreated = vi.fn();
		const createFolderSpy = vi
			.spyOn(apiClient, "createFolder")
			.mockResolvedValue({} as any);

		const comp = mount(CreateFolderDialog, {
			target: container,
			props: { open: true, oncreated },
		});

		const input = container.querySelector(
			"input#folder-name-input",
		) as HTMLInputElement;
		input.value = "  /sub-project//  ";
		input.dispatchEvent(new Event("input"));

		const form = container.querySelector("form");
		form?.dispatchEvent(new Event("submit", { cancelable: true }));

		await vi.waitFor(() => {
			expect(createFolderSpy).toHaveBeenCalledWith(
				"my-bucket",
				"projects/sub-project/",
			);
			expect(toast.success).toHaveBeenCalledWith(
				'Folder "sub-project" created',
			);
			expect(oncreated).toHaveBeenCalled();
		});
		unmount(comp);
	});
});
