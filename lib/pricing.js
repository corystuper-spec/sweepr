export const PRICING = {
  base: 89,
  perSqftOver1000: 0.05,
  perBedOver2: 12,
  perBathOver1: 16,
  takeRate: 0.25,
};

export const ADDONS = [
  { id: 'deep_clean',        label: 'Deep Clean',         price: 60 },
  { id: 'inside_fridge',     label: 'Inside Fridge',      price: 25 },
  { id: 'inside_oven',       label: 'Inside Oven',        price: 25 },
  { id: 'interior_windows',  label: 'Interior Windows',   price: 40 },
  { id: 'laundry_fold',      label: 'Laundry & Fold',     price: 20 },
];

export const RECURRENCE = {
  once:     { label: 'One-time',    discount: 0 },
  weekly:   { label: 'Weekly',      discount: 0.15 },
  biweekly: { label: 'Bi-weekly',   discount: 0.10 },
  monthly:  { label: 'Monthly',     discount: 0.05 },
};

/** Compute the standard clean price from property dimensions. */
export function standardPrice(property) {
  const { sqft = 1000, beds = 2, baths = 1 } = property;
  let price = PRICING.base;
  if (sqft > 1000) price += (sqft - 1000) * PRICING.perSqftOver1000;
  if (beds > 2)    price += (beds - 2)    * PRICING.perBedOver2;
  if (baths > 1)   price += (baths - 1)   * PRICING.perBathOver1;
  return Math.round(price * 100) / 100;
}

/** Sum of selected add-on prices. */
export function addonsTotal(pickedIds = []) {
  return ADDONS.filter(a => pickedIds.includes(a.id))
               .reduce((sum, a) => sum + a.price, 0);
}

/**
 * Full quote calculation — always run server-side.
 * @param {{ property, pickedAddonIds, recurrence }} params
 * @returns {{ base_price, addons, addons_total, recurrence, total_price, cleaner_payout, platform_fee }}
 */
export function quote({ property, pickedAddonIds = [], recurrence = 'once' }) {
  const base_price   = standardPrice(property);
  const addons_total = addonsTotal(pickedAddonIds);
  const subtotal     = base_price + addons_total;
  const discount     = RECURRENCE[recurrence]?.discount ?? 0;
  const total_price  = Math.round(subtotal * (1 - discount) * 100) / 100;
  const platform_fee = Math.round(total_price * PRICING.takeRate * 100) / 100;
  const cleaner_payout = Math.round((total_price - platform_fee) * 100) / 100;

  const addons = ADDONS.filter(a => pickedAddonIds.includes(a.id))
                       .map(({ id, label, price }) => ({ id, label, price }));

  return {
    base_price,
    addons,
    addons_total,
    recurrence,
    total_price,
    cleaner_payout,
    platform_fee,
  };
}
