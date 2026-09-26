import {
	ApiError,
	SESSION_KEY,
	clearAuthToken,
	getAuthHeaders,
	getAuthToken,
	setAuthToken,
} from "$lib/api/client";
import { beforeEach, describe, expect, it } from "vitest";

describe("auth functions", () => {
	beforeEach(() => {
		sessionStorage.clear();
		localStorage.clear();
	});

	it("returns null when no token is present", () => {
		expect(getAuthToken()).toBeNull();
		expect(getAuthHeaders()).toEqual({});
	});

	it("stores token in sessionStorage when remember=false", () => {
		const token = btoa("admin:password123");
		setAuthToken(token, false);

		expect(sessionStorage.getItem(SESSION_KEY)).toBe(token);
		expect(localStorage.getItem(SESSION_KEY)).toBeNull();
		expect(getAuthToken()).toBe(token);
		expect(getAuthHeaders()).toEqual({ Authorization: `Basic ${token}` });
	});

	it("stores token in localStorage when remember=true", () => {
		const token = btoa("admin:persistent");
		setAuthToken(token, true);

		expect(localStorage.getItem(SESSION_KEY)).toBe(token);
		expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
		expect(getAuthToken()).toBe(token);
		expect(getAuthHeaders()).toEqual({ Authorization: `Basic ${token}` });
	});

	it("prefers sessionStorage over localStorage when both exist", () => {
		const sessionToken = btoa("user:session");
		const localToken = btoa("user:local");

		sessionStorage.setItem(SESSION_KEY, sessionToken);
		localStorage.setItem(SESSION_KEY, localToken);

		expect(getAuthToken()).toBe(sessionToken);
	});

	it("clears token from both session and local storage", () => {
		sessionStorage.setItem(SESSION_KEY, "test-token");
		localStorage.setItem(SESSION_KEY, "test-token");

		clearAuthToken();

		expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
		expect(localStorage.getItem(SESSION_KEY)).toBeNull();
		expect(getAuthToken()).toBeNull();
		expect(getAuthHeaders()).toEqual({});
	});

	it("handles null/empty setAuthToken by clearing", () => {
		sessionStorage.setItem(SESSION_KEY, "test-token");
		setAuthToken(null);
		expect(getAuthToken()).toBeNull();
	});
});

describe("ApiError", () => {
	it("initializes with status, message, and optional data", () => {
		const err = new ApiError("Not found", 404, { detail: "missing bucket" });

		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("ApiError");
		expect(err.message).toBe("Not found");
		expect(err.status).toBe(404);
		expect(err.data).toEqual({ detail: "missing bucket" });
	});
});
