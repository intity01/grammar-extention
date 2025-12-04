// Basic test to verify Jest setup
describe("Jest Setup", () => {
  it("should run tests successfully", () => {
    expect(true).toBe(true);
  });

  it("should have Chrome API mocked", () => {
    expect(chrome).toBeDefined();
    expect(chrome.runtime).toBeDefined();
    expect(chrome.storage).toBeDefined();
  });
});
