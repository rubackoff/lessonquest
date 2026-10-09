import { describe, expect, it } from "vitest";
import { editTrainerInput, getTrainerAnswerStatus } from "./trainer-input";

describe("trainer answer entry", () => {
  it("accepts completed integer answers without Enter", () => {
    expect(getTrainerAnswerStatus("4", "42", "integer")).toBe("pending");
    expect(getTrainerAnswerStatus("42", "42", "integer")).toBe("correct");
    expect(getTrainerAnswerStatus("-", "-12", "integer")).toBe("pending");
    expect(getTrainerAnswerStatus("-1", "-12", "integer")).toBe("pending");
    expect(getTrainerAnswerStatus("-12", "-12", "integer")).toBe("correct");
  });

  it("lets a student correct an incomplete wrong answer", () => {
    expect(getTrainerAnswerStatus("7", "42", "integer")).toBe("pending");
    expect(editTrainerInput("7", "backspace", "integer")).toBe("");
    expect(getTrainerAnswerStatus("73", "42", "integer")).toBe("wrong");
  });

  it("handles leading zeros, explicit plus, negative zero and sign changes", () => {
    expect(getTrainerAnswerStatus("+042", "42", "integer")).toBe("correct");
    expect(getTrainerAnswerStatus("-0", "0", "integer")).toBe("correct");
    expect(editTrainerInput("12", "-", "integer")).toBe("-12");
    expect(editTrainerInput("-12", "+", "integer")).toBe("+12");
    expect(editTrainerInput("-12", "-", "integer")).toBe("12");
  });

  it("waits for a complete fraction denominator", () => {
    for (const input of ["", "1", "1/", "1/1"]) {
      expect(getTrainerAnswerStatus(input, "1/12", "fraction")).toBe("pending");
    }
    expect(getTrainerAnswerStatus("1/12", "1/12", "fraction")).toBe("correct");
    expect(getTrainerAnswerStatus("1/13", "1/12", "fraction")).toBe("wrong");
    expect(getTrainerAnswerStatus("01/012", "1/12", "fraction")).toBe("correct");
    expect(getTrainerAnswerStatus("2/24", "1/12", "fraction")).toBe("wrong");
    expect(getTrainerAnswerStatus("1/0", "1/5", "fraction")).toBe("wrong");
  });

  it("rejects extra fraction separators and separators in integer trainers", () => {
    expect(editTrainerInput("", "/", "fraction")).toBe("");
    expect(editTrainerInput("1", "/", "fraction")).toBe("1/");
    expect(editTrainerInput("1/2", "/", "fraction")).toBe("1/2");
    expect(editTrainerInput("1", "/", "integer")).toBe("1");
    expect(editTrainerInput("1", "a", "integer")).toBe("1");
  });

  it("checks choice answers as complete selections", () => {
    expect(getTrainerAnswerStatus("gone", "gone", "choice")).toBe("correct");
    expect(getTrainerAnswerStatus("going", "gone", "choice")).toBe("wrong");
  });
});
