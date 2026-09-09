/**
 * Dialling code → country.
 *
 * `default_destination_country.billing_country` holds a dialling code, not a
 * name — 91, 44, 971. It is the only per-account country signal MySQL carries,
 * and it is better than the currency the lens used to lean on: currency is
 * where an account is billed, country is where it is. They disagree often
 * enough to matter (there are GBP accounts on +968 and +383).
 *
 * Only the codes present in the data are listed, plus the handful a sales team
 * would expect to see. An unknown code is returned as-is rather than guessed
 * at, so a code nobody has mapped shows up as a code and gets noticed.
 */

export type Country = { name: string; flag: string; currency?: string };

const CODES: Record<string, Country> = {
  "91": { name: "India", flag: "🇮🇳", currency: "INR" },
  "1": { name: "United States", flag: "🇺🇸", currency: "USD" },
  "44": { name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  "971": { name: "UAE", flag: "🇦🇪", currency: "AED" },
  "65": { name: "Singapore", flag: "🇸🇬", currency: "SGD" },
  "48": { name: "Poland", flag: "🇵🇱" },
  "383": { name: "Kosovo", flag: "🇽🇰" },
  "33": { name: "France", flag: "🇫🇷", currency: "EUR" },
  "968": { name: "Oman", flag: "🇴🇲" },
  "213": { name: "Algeria", flag: "🇩🇿" },
  "61": { name: "Australia", flag: "🇦🇺" },
  "977": { name: "Nepal", flag: "🇳🇵" },
  "49": { name: "Germany", flag: "🇩🇪", currency: "EUR" },
  "355": { name: "Albania", flag: "🇦🇱" },
  "974": { name: "Qatar", flag: "🇶🇦" },
  "93": { name: "Afghanistan", flag: "🇦🇫" },
  "880": { name: "Bangladesh", flag: "🇧🇩" },
  "86": { name: "China", flag: "🇨🇳" },
  "34": { name: "Spain", flag: "🇪🇸", currency: "EUR" },
  "975": { name: "Bhutan", flag: "🇧🇹" },
  "268": { name: "Eswatini", flag: "🇸🇿" },
  "358": { name: "Finland", flag: "🇫🇮", currency: "EUR" },
  "62": { name: "Indonesia", flag: "🇮🇩" },
  "60": { name: "Malaysia", flag: "🇲🇾" },
  "972": { name: "Israel", flag: "🇮🇱" },
  "966": { name: "Saudi Arabia", flag: "🇸🇦" },
  "7": { name: "Russia", flag: "🇷🇺" },
  "45": { name: "Denmark", flag: "🇩🇰" },
  "98": { name: "Iran", flag: "🇮🇷" },
  "963": { name: "Syria", flag: "🇸🇾" },
  "376": { name: "Andorra", flag: "🇦🇩" },
  "973": { name: "Bahrain", flag: "🇧🇭" },
  "852": { name: "Hong Kong", flag: "🇭🇰" },
  "52": { name: "Mexico", flag: "🇲🇽" },
  "47": { name: "Norway", flag: "🇳🇴" },
  "43": { name: "Austria", flag: "🇦🇹", currency: "EUR" },
  "351": { name: "Portugal", flag: "🇵🇹", currency: "EUR" },
  "245": { name: "Guinea-Bissau", flag: "🇬🇼" },
  "234": { name: "Nigeria", flag: "🇳🇬" },
  "964": { name: "Iraq", flag: "🇮🇶" },
  "853": { name: "Macau", flag: "🇲🇴" },
  "689": { name: "French Polynesia", flag: "🇵🇫" },
  "680": { name: "Palau", flag: "🇵🇼" },
  "679": { name: "Fiji", flag: "🇫🇯" },
  "64": { name: "New Zealand", flag: "🇳🇿" },
  "63": { name: "Philippines", flag: "🇵🇭" },
  "598": { name: "Uruguay", flag: "🇺🇾" },
  "591": { name: "Bolivia", flag: "🇧🇴" },
  "55": { name: "Brazil", flag: "🇧🇷" },
  "54": { name: "Argentina", flag: "🇦🇷" },
  "509": { name: "Haiti", flag: "🇭🇹" },
  "39": { name: "Italy", flag: "🇮🇹", currency: "EUR" },
  "385": { name: "Croatia", flag: "🇭🇷", currency: "EUR" },
  "36": { name: "Hungary", flag: "🇭🇺" },
  "354": { name: "Iceland", flag: "🇮🇸" },
  "352": { name: "Luxembourg", flag: "🇱🇺", currency: "EUR" },
  "350": { name: "Gibraltar", flag: "🇬🇮" },
  "32": { name: "Belgium", flag: "🇧🇪", currency: "EUR" },
  "269": { name: "Comoros", flag: "🇰🇲" },
  "256": { name: "Uganda", flag: "🇺🇬" },
  "244": { name: "Angola", flag: "🇦🇴" },
  "235": { name: "Chad", flag: "🇹🇩" },
  "233": { name: "Ghana", flag: "🇬🇭" },
  "22": { name: "West Africa", flag: "🌍" },
};

/** Currency → country, for the accounts that carry no dialling code. */
const BY_CURRENCY: Record<string, string> = {
  INR: "91", USD: "1", GBP: "44", AED: "971", SGD: "65", EUR: "33",
};

/**
 * The country for one account. `code` wins; currency is the fallback; when
 * neither says anything the answer is null, which the board shows as Unknown
 * rather than quietly filing under India.
 */
export function countryOf(code?: string | null, currency?: string | null): Country | null {
  const c = (code ?? "").trim();
  if (c && CODES[c]) return CODES[c];
  if (c) return { name: "+" + c, flag: "🏳" };
  const cur = (currency ?? "").trim().toUpperCase();
  const viaCur = cur && BY_CURRENCY[cur];
  return viaCur ? CODES[viaCur] : null;
}
