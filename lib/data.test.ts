import { describe, expect, it } from "vitest";
import { plainTextToHtml } from "./data";

describe("plainTextToHtml", () => {
  it("converts newlines to paragraphs and escapes html", () => {
    const input = "Hello\nWorld <script>";
    const output = plainTextToHtml(input);
    expect(output).toBe("<p>Hello</p><p>World &lt;script&gt;</p>");
  });

  it("preserves blank lines as empty paragraphs", () => {
    const input = "First\n\nSecond";
    const output = plainTextToHtml(input);
    expect(output).toBe("<p>First</p><p><br></p><p>Second</p>");
  });
});
