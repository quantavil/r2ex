import { describe, expect, it } from "vitest";
import * as Icons from "../../src/lib/icons";

describe("Custom SVG Icon System", () => {
	it("exports all required icon components", () => {
		const expectedIcons = [
			"Folder",
			"File",
			"Share",
			"Download",
			"Upload",
			"Trash",
			"Copy",
			"Lock",
			"Eye",
			"Search",
			"MoreVertical",
			"ChevronRight",
			"ChevronDown",
			"ChevronUp",
			"Check",
			"X",
			"Plus",
			"Sun",
			"Moon",
		];

		for (const name of expectedIcons) {
			expect((Icons as any)[name]).toBeDefined();
		}
	});
});
