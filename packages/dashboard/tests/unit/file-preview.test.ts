import CodeViewer from "$lib/components/preview/CodeViewer.svelte";
import MediaViewer from "$lib/components/preview/MediaViewer.svelte";
import PreviewModal from "$lib/components/preview/PreviewModal.svelte";
import {
	formatBytes,
	getFileExtension,
	getMediaType,
} from "$lib/components/share/utils";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("File Preview & Media Type Detection", () => {
	describe("getMediaType", () => {
		it("detects image types by extension", () => {
			expect(getMediaType("photo.png")).toBe("image");
			expect(getMediaType("photo.jpg")).toBe("image");
			expect(getMediaType("photo.jpeg")).toBe("image");
			expect(getMediaType("photo.webp")).toBe("image");
			expect(getMediaType("photo.svg")).toBe("image");
			expect(getMediaType("photo.gif")).toBe("image");
			expect(getMediaType("photo.avif")).toBe("image");
		});

		it("detects audio types by extension", () => {
			expect(getMediaType("song.mp3")).toBe("audio");
			expect(getMediaType("audio.wav")).toBe("audio");
			expect(getMediaType("music.flac")).toBe("audio");
		});

		it("detects video types by extension", () => {
			expect(getMediaType("video.mp4")).toBe("video");
			expect(getMediaType("video.webm")).toBe("video");
			expect(getMediaType("clip.mov")).toBe("video");
		});

		it("detects PDF files", () => {
			expect(getMediaType("document.pdf")).toBe("pdf");
		});

		it("detects code and data formats by extension", () => {
			expect(getMediaType("script.js")).toBe("code");
			expect(getMediaType("module.ts")).toBe("code");
			expect(getMediaType("app.svelte")).toBe("code");
			expect(getMediaType("styles.css")).toBe("code");
			expect(getMediaType("index.html")).toBe("code");
			expect(getMediaType("config.json")).toBe("code");
			expect(getMediaType("settings.yaml")).toBe("code");
			expect(getMediaType("schema.sql")).toBe("code");
		});

		it("detects text, markdown, and csv formats", () => {
			expect(getMediaType("notes.txt")).toBe("text");
			expect(getMediaType("output.log")).toBe("text");
			expect(getMediaType("README.md")).toBe("text");
			expect(getMediaType("guide.markdown")).toBe("text");
			expect(getMediaType("data.csv")).toBe("text");
			expect(getMediaType("sheet.tsv")).toBe("text");
		});

		it("detects archives and compressed packages", () => {
			expect(getMediaType("archive.zip")).toBe("archive");
			expect(getMediaType("bundle.tar")).toBe("archive");
			expect(getMediaType("file.gz")).toBe("archive");
			expect(getMediaType("package.7z")).toBe("archive");
		});

		it("handles case-insensitivity correctly", () => {
			expect(getMediaType("PHOTO.PNG")).toBe("image");
			expect(getMediaType("DATA.CSV")).toBe("text");
			expect(getMediaType("DOC.PDF")).toBe("pdf");
			expect(getMediaType("README.MD")).toBe("text");
		});

		it("respects MIME content-type when supplied", () => {
			expect(getMediaType("unknown_file", "image/png")).toBe("image");
			expect(getMediaType("unknown_file", "video/mp4")).toBe("video");
			expect(getMediaType("unknown_file", "audio/mpeg")).toBe("audio");
			expect(getMediaType("unknown_file", "application/pdf")).toBe("pdf");
			expect(getMediaType("unknown_file", "application/json")).toBe("code");
			expect(getMediaType("unknown_file", "text/plain")).toBe("text");
			expect(getMediaType("unknown_file", "application/zip")).toBe("archive");
		});

		it("falls back to unknown for unrecognized extensions", () => {
			expect(getMediaType("binary.xyz123")).toBe("unknown");
			expect(getMediaType("firmware.bin")).toBe("unknown");
		});
	});

	describe("getFileExtension", () => {
		it("extracts file extensions correctly", () => {
			expect(getFileExtension("photo.jpg")).toBe("jpg");
			expect(getFileExtension("archive.tar.gz")).toBe("gz");
			expect(getFileExtension("no-extension")).toBe("");
			expect(getFileExtension("")).toBe("");
		});
	});

	describe("formatBytes", () => {
		it("formats 0 bytes and falsy values", () => {
			expect(formatBytes(0)).toBe("0 B");
			expect(formatBytes(undefined)).toBe("0 B");
			expect(formatBytes(null as any)).toBe("0 B");
			expect(formatBytes(Number.NaN)).toBe("0 B");
		});

		it("formats bytes, kilobytes, megabytes, and gigabytes", () => {
			expect(formatBytes(512)).toBe("512 B");
			expect(formatBytes(1024)).toBe("1 KB");
			expect(formatBytes(1048576)).toBe("1 MB");
			expect(formatBytes(1073741824)).toBe("1 GB");
		});
	});

	describe("PreviewModal Component", () => {
		let container: HTMLDivElement;

		beforeEach(() => {
			container = document.createElement("div");
			document.body.appendChild(container);
		});

		afterEach(() => {
			document.body.removeChild(container);
		});

		it("does not render dialog modal when open is false", () => {
			const comp = mount(PreviewModal, {
				target: container,
				props: {
					open: false,
					bucket: "test-bucket",
					fileKey: "photos/sample.png",
					fileName: "sample.png",
				},
			});

			expect(container.querySelector('[role="dialog"]')).toBeNull();
			unmount(comp);
		});
	});

	describe("MediaViewer Component", () => {
		let container: HTMLDivElement;

		beforeEach(() => {
			container = document.createElement("div");
			document.body.appendChild(container);
		});

		afterEach(() => {
			document.body.removeChild(container);
		});

		it("renders image with zoom buttons and handles zoom", () => {
			const comp = mount(MediaViewer, {
				target: container,
				props: {
					src: "blob:http://localhost/sample.png",
					type: "image",
					fileName: "sample.png",
				},
			});

			const img = container.querySelector("img");
			expect(img).not.toBeNull();
			expect(img?.getAttribute("src")).toBe("blob:http://localhost/sample.png");
			expect(img?.getAttribute("alt")).toBe("sample.png");

			// Verify zoom controls are rendered
			const zoomInBtn = container.querySelector('button[title="Zoom in"]');
			expect(zoomInBtn).not.toBeNull();
			zoomInBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

			unmount(comp);
		});

		it("renders video element for video type", () => {
			const comp = mount(MediaViewer, {
				target: container,
				props: {
					src: "blob:http://localhost/clip.mp4",
					type: "video",
					fileName: "clip.mp4",
				},
			});

			const video = container.querySelector("video");
			expect(video).not.toBeNull();
			expect(video?.getAttribute("src")).toBe("blob:http://localhost/clip.mp4");
			unmount(comp);
		});

		it("renders audio element for audio type", () => {
			const comp = mount(MediaViewer, {
				target: container,
				props: {
					src: "blob:http://localhost/song.mp3",
					type: "audio",
					fileName: "song.mp3",
				},
			});

			const audio = container.querySelector("audio");
			expect(audio).not.toBeNull();
			expect(audio?.getAttribute("src")).toBe("blob:http://localhost/song.mp3");
			unmount(comp);
		});

		it("renders iframe for PDF type", () => {
			const comp = mount(MediaViewer, {
				target: container,
				props: {
					src: "blob:http://localhost/doc.pdf",
					type: "pdf",
					fileName: "doc.pdf",
				},
			});

			const iframe = container.querySelector("iframe");
			expect(iframe).not.toBeNull();
			expect(iframe?.getAttribute("src")).toBe("blob:http://localhost/doc.pdf");
			unmount(comp);
		});
	});

	describe("CodeViewer Component", () => {
		let container: HTMLDivElement;

		beforeEach(() => {
			container = document.createElement("div");
			document.body.appendChild(container);
		});

		afterEach(() => {
			document.body.removeChild(container);
		});

		it("renders code lines, filename, and line count", () => {
			const source = "const a = 1;\nconst b = 2;\nconsole.log(a + b);";
			const comp = mount(CodeViewer, {
				target: container,
				props: {
					content: source,
					fileName: "test.ts",
					language: "typescript",
				},
			});

			expect(container.textContent).toContain("test.ts");
			expect(container.textContent).toContain("3 lines");
			expect(container.textContent).toContain("console.log(a + b);");

			unmount(comp);
		});
	});
});
