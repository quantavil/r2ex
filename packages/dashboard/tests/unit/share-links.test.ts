import {
	ApiError,
	createShareLink,
	deleteShareLink,
	fetchSharedFile,
	listShares,
} from "$lib/components/share/api";
import {
	encodeKey,
	formatCountdown,
	formatRelativeTime,
} from "$lib/components/share/utils";
import { renderSVG } from "uqr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Share Links & Public Access", () => {
	describe("formatCountdown", () => {
		it("handles permanent shares with no expiration", () => {
			const result = formatCountdown(undefined);
			expect(result).toEqual({
				text: "Permanent",
				isExpired: false,
				isPermanent: true,
				urgent: false,
			});
		});

		it("handles expired timestamps", () => {
			const past = Date.now() - 5000;
			const result = formatCountdown(past);
			expect(result).toEqual({
				text: "Expired",
				isExpired: true,
				isPermanent: false,
				urgent: true,
			});
		});

		it("formats multiple days remaining (> 1 day)", () => {
			const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000 + 1000;
			const result = formatCountdown(threeDays);
			expect(result.text).toBe("Expires in 3 days");
			expect(result.isExpired).toBe(false);
			expect(result.isPermanent).toBe(false);
			expect(result.urgent).toBe(false);
		});

		it("formats exactly 1 day remaining", () => {
			const oneDay = Date.now() + 25 * 60 * 60 * 1000;
			const result = formatCountdown(oneDay);
			expect(result.text).toBe("Expires in 1 day");
			expect(result.urgent).toBe(false);
		});

		it("flags urgent countdown when remaining time is under 12 hours", () => {
			const sixHours = Date.now() + 6 * 60 * 60 * 1000 + 5000;
			const result = formatCountdown(sixHours);
			expect(result.text).toBe("Expires in 6 hours");
			expect(result.urgent).toBe(true);
		});

		it("formats 1 hour remaining", () => {
			const oneHour = Date.now() + 65 * 60 * 1000;
			const result = formatCountdown(oneHour);
			expect(result.text).toBe("Expires in 1 hour");
			expect(result.urgent).toBe(true);
		});

		it("formats minutes remaining", () => {
			const minutes = Date.now() + 15 * 60 * 1000;
			const result = formatCountdown(minutes);
			expect(result.text).toBe("Expires in 15 minutes");
			expect(result.urgent).toBe(true);
		});

		it("formats a few seconds remaining", () => {
			const seconds = Date.now() + 20 * 1000;
			const result = formatCountdown(seconds);
			expect(result.text).toBe("Expires in a few seconds");
			expect(result.urgent).toBe(true);
		});
	});

	describe("formatRelativeTime", () => {
		it("returns '--' for invalid or empty timestamps", () => {
			expect(formatRelativeTime(undefined)).toBe("--");
			expect(formatRelativeTime("invalid-date")).toBe("--");
		});

		it("formats seconds ago", () => {
			const tenSecAgo = Date.now() - 10 * 1000;
			expect(formatRelativeTime(tenSecAgo)).toBe("10s ago");
		});

		it("formats minutes ago", () => {
			const fiveMinAgo = Date.now() - 5 * 60 * 1000;
			expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
		});

		it("formats hours ago", () => {
			const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
			expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
		});

		it("formats days ago", () => {
			const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
			expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
		});
	});

	describe("QR Code Generation with uqr", () => {
		it("generates an SVG string for a share URL", () => {
			const shareUrl = "https://r2explorer.example.com/share/abc123xyz";
			const svg = renderSVG(shareUrl, {
				pixelSize: 6,
				whiteColor: "#ffffff",
				blackColor: "#09090b",
				border: 2,
			});

			expect(typeof svg).toBe("string");
			expect(svg).toContain("<svg");
			expect(svg).toContain("</svg>");
		});
	});

	describe("Share API Client", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("createShareLink posts to the correct endpoint and returns response data", async () => {
			const mockResult = {
				shareId: "sh_12345",
				shareUrl: "https://example.com/share/sh_12345",
				expiresAt: 1780000000,
			};

			const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				ok: true,
				json: async () => mockResult,
			} as Response);

			const res = await createShareLink("my-bucket", "folder/file.pdf", {
				expiresIn: 86400,
				password: "secretpassword",
				maxDownloads: 5,
			});

			expect(fetchSpy).toHaveBeenCalledWith(
				`/api/buckets/my-bucket/${encodeKey("folder/file.pdf")}/share`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						expiresIn: 86400,
						password: "secretpassword",
						maxDownloads: 5,
					}),
				},
			);
			expect(res).toEqual(mockResult);
		});

		it("listShares fetches active share list", async () => {
			const mockShares = [
				{
					shareId: "s1",
					shareUrl: "https://example.com/share/s1",
					key: "doc.pdf",
					currentDownloads: 2,
					createdBy: "user",
					createdAt: 1700000000,
					isExpired: false,
					hasPassword: false,
				},
			];

			vi.spyOn(globalThis, "fetch").mockResolvedValue({
				ok: true,
				json: async () => ({ shares: mockShares }),
			} as Response);

			const shares = await listShares("test-bucket");
			expect(shares).toEqual(mockShares);
		});

		it("deleteShareLink sends DELETE request", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

			const success = await deleteShareLink("test-bucket", "share-999");
			expect(fetchSpy).toHaveBeenCalledWith(
				"/api/buckets/test-bucket/share/share-999",
				{ method: "DELETE" },
			);
			expect(success).toBe(true);
		});

		it("fetchSharedFile handles password query param", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
				ok: true,
			} as Response);

			await fetchSharedFile("share-abc", "mypass");
			expect(fetchSpy).toHaveBeenCalledWith(
				"/share/share-abc?password=mypass",
				{
					method: "GET",
				},
			);
		});

		it("throws typed ApiError when API request fails", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue({
				ok: false,
				status: 403,
				json: async () => ({ message: "Unauthorized share deletion" }),
			} as Response);

			await expect(deleteShareLink("bucket", "share-123")).rejects.toThrow(
				ApiError,
			);
			await expect(deleteShareLink("bucket", "share-123")).rejects.toThrow(
				"Unauthorized share deletion",
			);
		});
	});
});
