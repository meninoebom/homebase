import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees after every test so components don't leak between tests.
afterEach(() => {
  cleanup();
});
