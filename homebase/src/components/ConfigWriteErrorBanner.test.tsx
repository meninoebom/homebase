import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { ConfigWriteErrorBanner } from "./ConfigWriteErrorBanner";

describe("ConfigWriteErrorBanner", () => {
  it("warns that the change is shown but not saved, and points to reconnecting", () => {
    render(<ConfigWriteErrorBanner />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn.t be saved/i);
    expect(alert).toHaveTextContent(/not written to disk/i);
    expect(alert).toHaveTextContent(/Your folder/);
  });
});
