/**
 * Unit tests for Input Monitor component
 */

import { InputMonitor, InputElement } from "../../src/lib/inputMonitor";

describe("InputMonitor", () => {
  let inputMonitor: InputMonitor;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    inputMonitor = new InputMonitor(
      {
        onTextChange: mockCallback,
      },
      100, // Shorter debounce for testing
    );
  });

  afterEach(() => {
    inputMonitor.dispose();
  });

  describe("observeField", () => {
    it("should observe a textarea element", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(textarea);
    });

    it("should observe an input element", () => {
      const input = document.createElement("input");
      input.type = "text";
      document.body.appendChild(input);

      inputMonitor.observeField(input);

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(input);
    });

    it("should observe a contenteditable element", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      document.body.appendChild(div);

      inputMonitor.observeField(div);

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(div);
    });

    it("should not observe the same element twice", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      inputMonitor.observeField(textarea); // Second call should be ignored

      document.body.removeChild(textarea);
    });
  });

  describe("unobserveField", () => {
    it("should stop observing a field", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      inputMonitor.unobserveField(textarea);

      document.body.removeChild(textarea);
    });

    it("should clear active field when unobserving", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      textarea.focus();

      inputMonitor.unobserveField(textarea);

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(textarea);
    });
  });

  describe("extractText", () => {
    it("should extract text from textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Hello World";

      const text = inputMonitor.extractText(textarea);

      expect(text).toBe("Hello World");
    });

    it("should extract text from input", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = "Test input";

      const text = inputMonitor.extractText(input);

      expect(text).toBe("Test input");
    });

    it("should extract text from contenteditable", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      div.textContent = "Editable content";

      const text = inputMonitor.extractText(div);

      expect(text).toBe("Editable content");
    });

    it("should return empty string for empty elements", () => {
      const textarea = document.createElement("textarea");

      const text = inputMonitor.extractText(textarea);

      expect(text).toBe("");
    });
  });

  describe("setText", () => {
    it("should set text in textarea", () => {
      const textarea = document.createElement("textarea");

      inputMonitor.setText(textarea, "New text");

      expect(textarea.value).toBe("New text");
    });

    it("should set text in input", () => {
      const input = document.createElement("input");
      input.type = "text";

      inputMonitor.setText(input, "New input");

      expect(input.value).toBe("New input");
    });

    it("should set text in contenteditable", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";

      inputMonitor.setText(div, "New content");

      expect(div.textContent).toBe("New content");
    });

    it("should set cursor position in textarea", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.setText(textarea, "Hello World", 5);

      expect(textarea.selectionStart).toBe(5);
      expect(textarea.selectionEnd).toBe(5);

      document.body.removeChild(textarea);
    });
  });

  describe("active field tracking", () => {
    it("should track active field on focus", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      textarea.focus();

      expect(inputMonitor.getActiveField()).toBe(textarea);

      document.body.removeChild(textarea);
    });

    it("should clear active field on blur", () => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      textarea.focus();
      textarea.blur();

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(textarea);
    });

    it("should only track one active field at a time", () => {
      const textarea1 = document.createElement("textarea");
      const textarea2 = document.createElement("textarea");
      document.body.appendChild(textarea1);
      document.body.appendChild(textarea2);

      inputMonitor.observeField(textarea1);
      inputMonitor.observeField(textarea2);

      textarea1.focus();
      expect(inputMonitor.getActiveField()).toBe(textarea1);

      textarea2.focus();
      expect(inputMonitor.getActiveField()).toBe(textarea2);

      document.body.removeChild(textarea1);
      document.body.removeChild(textarea2);
    });
  });

  describe("debouncing", () => {
    it("should debounce input events", (done) => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      textarea.focus();

      // Simulate rapid typing
      textarea.value = "H";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      textarea.value = "He";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      textarea.value = "Hel";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      textarea.value = "Hell";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      textarea.value = "Hello";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      // Callback should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled();

      // Wait for debounce delay
      setTimeout(() => {
        // Callback should be called only once with final value
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith("Hello", textarea);

        document.body.removeChild(textarea);
        done();
      }, 150);
    });

    it("should only trigger callback for active field", (done) => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      // Don't focus the textarea

      textarea.value = "Test";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      setTimeout(() => {
        // Callback should not be called because field is not active
        expect(mockCallback).not.toHaveBeenCalled();

        document.body.removeChild(textarea);
        done();
      }, 150);
    });
  });

  describe("re-analysis on modification", () => {
    it("should trigger callback when text is modified", (done) => {
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      inputMonitor.observeField(textarea);
      textarea.focus();

      textarea.value = "Initial text";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledWith("Initial text", textarea);

        // Modify text again
        mockCallback.mockClear();
        textarea.value = "Modified text";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        setTimeout(() => {
          expect(mockCallback).toHaveBeenCalledWith("Modified text", textarea);

          document.body.removeChild(textarea);
          done();
        }, 150);
      }, 150);
    });
  });

  describe("dispose", () => {
    it("should clean up all observers", () => {
      const textarea1 = document.createElement("textarea");
      const textarea2 = document.createElement("textarea");
      document.body.appendChild(textarea1);
      document.body.appendChild(textarea2);

      inputMonitor.observeField(textarea1);
      inputMonitor.observeField(textarea2);
      textarea1.focus();

      inputMonitor.dispose();

      expect(inputMonitor.getActiveField()).toBeNull();

      document.body.removeChild(textarea1);
      document.body.removeChild(textarea2);
    });
  });
});
