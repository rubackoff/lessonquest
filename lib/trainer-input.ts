import type { Trainer } from "./trainers";

type InputType = Trainer["inputType"];

export function editTrainerInput(input: string, key: string, inputType: InputType) {
  if (key === "backspace") return input.slice(0, -1);
  if (key === "+" || key === "-") {
    return input.startsWith(key) ? input.slice(1) : key + input.replace(/^[+-]/, "");
  }
  if (key === "/") {
    return inputType === "fraction" && /^[+-]?\d+$/.test(input) ? `${input}/` : input;
  }
  return /^\d$/.test(key) ? input + key : input;
}

export function getTrainerAnswerStatus(input: string, answer: string, inputType: InputType) {
  if (inputType === "choice") return input === answer ? "correct" : "wrong";
  if (inputType === "fraction") {
    const match = input.match(/^([+-]?\d+)\/(\d+)$/);
    if (!match) return "pending";
    const [numerator, denominator] = match.slice(1).map(Number);
    if (`${numerator}/${denominator}` === answer) return "correct";
    return String(denominator).length >= answer.split("/")[1].length ? "wrong" : "pending";
  }
  if (!/^[+-]?\d+$/.test(input)) return "pending";
  const value = Number(input);
  if (String(value) === answer) return "correct";
  return String(Math.abs(value)).length >= answer.replace(/^-/, "").length ? "wrong" : "pending";
}
