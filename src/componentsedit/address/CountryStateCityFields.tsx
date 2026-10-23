import { useMemo } from "react";
import { City, Country, State } from "country-state-city";

export const DEFAULT_COUNTRY_ISO = "QA";
export const DEFAULT_COUNTRY_NAME =
  Country.getCountryByCode(DEFAULT_COUNTRY_ISO)?.name || "Qatar";
const GCC_COUNTRY_ISO_CODES = new Set(["BH", "KW", "OM", "QA", "SA", "AE"]);

function normalizeKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

type CountryStateCityFieldsProps = {
  countryLabel: string;
  stateLabel: string;
  cityLabel: string;
  countryValue: string;
  stateValue: string;
  cityValue: string;
  onCountryChange: (next: string) => void;
  onStateChange: (next: string) => void;
  onCityChange: (next: string) => void;
  requiredCountry?: boolean;
  disabled?: boolean;
};

export default function CountryStateCityFields({
  countryLabel,
  stateLabel,
  cityLabel,
  countryValue,
  stateValue,
  cityValue,
  onCountryChange,
  onStateChange,
  onCityChange,
  requiredCountry = false,
  disabled = false,
}: CountryStateCityFieldsProps) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const gccCountries = useMemo(
    () => countries.filter((country) => GCC_COUNTRY_ISO_CODES.has(country.isoCode)),
    [countries],
  );

  const selectedCountry = useMemo(() => {
    const key = normalizeKey(countryValue);
    return (
      gccCountries.find(
        (country) =>
          normalizeKey(country.isoCode) === key || normalizeKey(country.name) === key,
      ) ?? null
    );
  }, [gccCountries, countryValue]);

  const states = useMemo(() => {
    if (!selectedCountry?.isoCode) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode);
  }, [selectedCountry?.isoCode]);

  const selectedState = useMemo(() => {
    const key = normalizeKey(stateValue);
    return (
      states.find(
        (state) =>
          normalizeKey(state.isoCode) === key || normalizeKey(state.name) === key,
      ) ?? null
    );
  }, [stateValue, states]);

  const cities = useMemo(() => {
    if (!selectedCountry?.isoCode || !selectedState?.isoCode) return [];
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
  }, [selectedCountry?.isoCode, selectedState?.isoCode]);

  const selectedCity = useMemo(() => {
    const key = normalizeKey(cityValue);
    return cities.find((city) => normalizeKey(city.name) === key) ?? null;
  }, [cities, cityValue]);

  return (
    <>
      <label className="flex flex-col gap-1 min-w-0">
        <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
          {countryLabel}
          {requiredCountry ? " *" : ""}
        </span>
        <select
          value={selectedCountry?.name ?? ""}
          onChange={(e) => {
            const country = gccCountries.find((c) => c.name === e.target.value);
            onCountryChange(country?.name ?? "");
            onStateChange("");
            onCityChange("");
          }}
          disabled={disabled}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm leading-5 outline-none focus:border-[#CB262E] disabled:cursor-not-allowed disabled:bg-black/[0.03]"
        >
          <option value="">{countryLabel}</option>
          {gccCountries.map((country) => (
            <option key={country.isoCode} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
          {stateLabel}
        </span>
        <select
          value={selectedState?.name ?? ""}
          onChange={(e) => {
            const state = states.find((s) => s.name === e.target.value);
            onStateChange(state?.name ?? "");
            onCityChange("");
          }}
          disabled={disabled || !selectedCountry || states.length === 0}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm leading-5 outline-none focus:border-[#CB262E] disabled:cursor-not-allowed disabled:bg-black/[0.03]"
        >
          <option value="">{stateLabel}</option>
          {states.map((state) => (
            <option key={`${state.countryCode}-${state.isoCode}`} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="font-sans font-medium text-xs leading-[18px] text-black/60">
          {cityLabel}
        </span>
        <select
          value={selectedCity?.name ?? ""}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled || !selectedState || cities.length === 0}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm leading-5 outline-none focus:border-[#CB262E] disabled:cursor-not-allowed disabled:bg-black/[0.03]"
        >
          <option value="">{cityLabel}</option>
          {cities.map((city) => (
            <option
              key={`${selectedCountry?.isoCode}-${selectedState?.isoCode}-${city.name}`}
              value={city.name}
            >
              {city.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
