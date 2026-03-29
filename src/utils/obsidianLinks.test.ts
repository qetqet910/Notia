import { describe, expect, it } from "vitest";
import {
	convertObsidianLinksToMarkdown,
	parseObsidianLinks,
} from "@/utils/obsidianLinks";

describe("obsidianLinks", () => {
	it("parses basic [[Title]] links", () => {
		const content = "Go to [[Project Plan]] now";
		const links = parseObsidianLinks(content);

		expect(links).toHaveLength(1);
		expect(links[0]).toMatchObject({
			target: "Project Plan",
			alias: undefined,
			start: 6,
			end: 22,
		});
	});

	it("converts alias [[Title|Alias]] links", () => {
		const content = "Open [[Daily Note|Today]]";
		const converted = convertObsidianLinksToMarkdown(content);

		expect(converted).toBe("Open [Today](#notia-wiki:Daily%20Note)");
	});

	it("supports Korean titles", () => {
		const content = "참고: [[회의록|오늘 회의]]";
		const converted = convertObsidianLinksToMarkdown(content);

		expect(converted).toBe(
			"참고: [오늘 회의](#notia-wiki:%ED%9A%8C%EC%9D%98%EB%A1%9D)",
		);
	});

	it("does not convert links inside fenced code blocks", () => {
		const content = [
			"Before [[Outside]]",
			"```ts",
			'const x = "[[Inside]]";',
			"```",
			"After [[Outside Two|Alias Two]]",
		].join("\n");

		const converted = convertObsidianLinksToMarkdown(content);

		expect(converted).toContain("Before [Outside](#notia-wiki:Outside)");
		expect(converted).toContain('const x = "[[Inside]]";');
		expect(converted).toContain("After [Alias Two](#notia-wiki:Outside%20Two)");
	});
});
