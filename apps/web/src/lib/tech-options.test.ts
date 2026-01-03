import {
  PACKAGE_MANAGER_OPTIONS_PYTHON,
  PACKAGE_MANAGER_OPTIONS_NODE,
  PACKAGE_MANAGER_OPTIONS,
} from "./tech-options";

describe("package manager option lists", () => {
  test("python options contain pip, poetry and uv", () => {
    const values = PACKAGE_MANAGER_OPTIONS_PYTHON.map((o) => o.value);
    expect(values).toContain("pip");
    expect(values).toContain("poetry");
    expect(values).toContain("uv");
  });

  test("default PACKAGE_MANAGER_OPTIONS is node list", () => {
    expect(PACKAGE_MANAGER_OPTIONS).toBe(PACKAGE_MANAGER_OPTIONS_NODE);
  });
});
