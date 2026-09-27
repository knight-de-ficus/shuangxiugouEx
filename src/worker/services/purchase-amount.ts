import { ApiError } from "./errors";

export const MIN_PURCHASE_AMOUNT_CENTS = 100;
export const MAX_PURCHASE_AMOUNT_CENTS = 100_000_000;

export function purchaseAmountCents(value: unknown, storedPayload = false): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < MIN_PURCHASE_AMOUNT_CENTS ||
    value > MAX_PURCHASE_AMOUNT_CENTS
  ) {
    throw new ApiError(
      storedPayload ? 409 : 400,
      storedPayload ? "conflict" : "bad_request",
      storedPayload
        ? "Stored purchase amount is invalid."
        : "消费金额必须在 1 元到 1,000,000 元之间，且最多保留两位小数。",
    );
  }
  return value;
}
