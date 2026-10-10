import type { Car } from "@/lib/cars";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-US");

export const formatPrice = (usdAmount: number) => usd.format(usdAmount);

export const formatMiles = (miles: number) => `${integer.format(miles)} mi`;

export const formatKilometres = (miles: number) => `${integer.format(Math.round(miles * 1.609344))} km`;

/** "1991 Eunos Roadster" when a market name exists, else "1991 Honda NSX". */
export const carTitle = (car: Car) =>
  car.marketName ? `${car.year} ${car.marketName}` : `${car.year} ${car.make} ${car.model}`;

/** "Mazda MX-5 · NA6CE" for market-named cars, else the chassis code alone. */
export const carSubtitle = (car: Car) =>
  car.marketName ? `${car.make} ${car.model} · ${car.chassis}` : car.chassis;

/** The name a frame carries: the market name when there is one ("Eunos Roadster"), else make and model. */
export const carName = (car: Car) => car.marketName ?? `${car.make} ${car.model}`;

/** "1991 · Mazda MX-5 · NA6CE"; the chassis is left out when the model already says it (XJ220). */
export const carLine = (car: Car) =>
  [car.year, car.marketName || !car.model.includes(car.chassis) ? carSubtitle(car) : null].filter(Boolean).join(" · ");

/** A frame link's accessible name, like "1991 Eunos Roadster (Mazda MX-5, NA6CE), $14,500". */
export const carLabel = (car: Car) =>
  car.marketName
    ? `${car.year} ${carName(car)} (${car.make} ${car.model}, ${car.chassis}), ${formatPrice(car.priceUsd)}`
    : car.model.includes(car.chassis)
      ? `${car.year} ${carName(car)}, ${formatPrice(car.priceUsd)}`
      : `${car.year} ${carName(car)} (${car.chassis}), ${formatPrice(car.priceUsd)}`;

/** The enquiry sidebar's pre-filled message (docs/overhaul.md step 5's example): "I'm interested in the
 * 1976 Porsche 911 Turbo (930)." */
export const enquiryMessage = (car: Car) =>
  car.model.includes(car.chassis)
    ? `I'm interested in the ${car.year} ${carName(car)}.`
    : `I'm interested in the ${car.year} ${carName(car)} (${car.chassis}).`;
