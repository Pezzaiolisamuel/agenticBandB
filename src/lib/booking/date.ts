const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

export function parseIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = toUtcDateParts(date);

  if (parts.year !== year || parts.month !== month - 1 || parts.day !== day) {
    return null;
  }

  return date;
}

export function calculateNights(checkIn: Date, checkOut: Date) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MILLISECONDS_PER_DAY);
}

export function validateBookingDateRange(checkIn: Date, checkOut: Date) {
  if (checkOut.getTime() <= checkIn.getTime()) {
    throw new Error("check_out must be later than check_in.");
  }
}

export function datesOverlap(
  existingCheckIn: Date,
  existingCheckOut: Date,
  requestedCheckIn: Date,
  requestedCheckOut: Date,
) {
  return (
    existingCheckIn.getTime() < requestedCheckOut.getTime() &&
    existingCheckOut.getTime() > requestedCheckIn.getTime()
  );
}
