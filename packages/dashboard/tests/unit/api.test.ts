import { describe, expect, it, vi } from "vitest";
import {
	bytesToSize,
	decodeKey,
	encodeKey,
	formatBytes,
	retryWithBackoff,
} from "../../src/lib/api/client";

describe("encodeKey / decodeKey", () => {
	it("round-trips a standard key", () => {
		const key = "photos/vacation.jpg";
		expect(decodeKey(encodeKey(key))).toBe(key);
	});

	it("strips leading slash before encoding", () => {
		const result = decodeKey(encodeKey("/leading-slash.txt"));
		expect(result).toBe("leading-slash.txt");
	});

	it("does not strip slash from bare /", () => {
		const encoded = encodeKey("/");
		expect(decodeKey(encoded)).toBe("/");
	});

	it("handles unicode characters safely", () => {
		const key = "docs/résumé-日本語.pdf";
		expect(decodeKey(encodeKey(key))).toBe(key);
	});

	it("handles empty string", () => {
		expect(decodeKey(encodeKey(""))).toBe("");
	});
});

describe("bytesToSize & formatBytes", () => {
	it("formats 0 bytes correctly", () => {
		expect(bytesToSize(0)).toBe("0 Byte");
		expect(formatBytes(0)).toBe("0 B");
	});

	it("formats small byte values", () => {
		expect(bytesToSize(500)).toBe("500 Bytes");
		expect(formatBytes(500)).toBe("500 B");
	});

	it("converts KB, MB, and GB", () => {
		expect(bytesToSize(1024)).toBe("1 KB");
		expect(bytesToSize(1024 * 1024)).toBe("1 MB");
		expect(bytesToSize(1024 * 1024 * 1024)).toBe("1 GB");

		expect(formatBytes(1024)).toBe("1 KB");
		expect(formatBytes(1024 * 1024)).toBe("1 MB");
		expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
	});
});

describe("retryWithBackoff", () => {
	it("returns result on first success", async () => {
		const op = vi.fn().mockResolvedValue("success");
		const result = await retryWithBackoff(op);
		expect(result).toBe("success");
		expect(op).toHaveBeenCalledTimes(1);
	});

	it("retries on failure and succeeds on subsequent attempt", async () => {
		const op = vi
			.fn()
			.mockRejectedValueOnce(new Error("network error"))
			.mockResolvedValue("recovered");

		const result = await retryWithBackoff(op, 3, 10, 50, 2);
		expect(result).toBe("recovered");
		expect(op).toHaveBeenCalledTimes(2);
	});

	it("throws error after exhausting maxAttempts", async () => {
		const op = vi.fn().mockRejectedValue(new Error("persistent failure"));

		await expect(retryWithBackoff(op, 3, 10, 50, 2)).rejects.toThrow(
			"persistent failure",
		);
		expect(op).toHaveBeenCalledTimes(3);
	});
});
