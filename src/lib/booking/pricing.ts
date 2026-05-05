type CalculateRoomPriceInput = {
  base_price_eur: number;
  included_guests: number;
  extra_guest_price_eur: number;
  guests_count: number;
  nights: number;
};

export function calculateRoomPrice({
  base_price_eur,
  included_guests,
  extra_guest_price_eur,
  guests_count,
  nights,
}: CalculateRoomPriceInput) {
  const extraGuests = Math.max(guests_count - included_guests, 0);
  const nightlyPrice = base_price_eur + extraGuests * extra_guest_price_eur;

  return nightlyPrice * nights;
}
