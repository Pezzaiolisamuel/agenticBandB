import { randomInt } from "node:crypto";

function formatBookingDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function formatRandomSuffix() {
  return randomInt(36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
}

export function generateBookingCode(date = new Date()) {
  return `BNB-${formatBookingDate(date)}-${formatRandomSuffix()}`;
}
