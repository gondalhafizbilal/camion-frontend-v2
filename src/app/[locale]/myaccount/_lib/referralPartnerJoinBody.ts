import type { PartnerJoinFormFields } from "../_components/PartnerJoinFormPanel";

const COUNTRY_TO_NATIONALITY: Record<string, string> = {
  Qatar: "Qatari",
  "Saudi Arabia": "Saudi",
  UAE: "Emirati",
  "United Arab Emirates": "Emirati",
  Kuwait: "Kuwaiti",
  Bahrain: "Bahraini",
  Oman: "Omani",
};

/** Body for `v1/referral/affiliates/affiliate` and `.../influencer`. */
export function buildReferralPartnerJoinBody(fields: PartnerJoinFormFields) {
  const gender =
    fields.gender === "male"
      ? "Male"
      : fields.gender === "female"
        ? "Female"
        : fields.gender;
  return {
    fullName: fields.fullName.trim(),
    gender,
    nationality: COUNTRY_TO_NATIONALITY[fields.nationality] ?? fields.nationality,
    bio: fields.bio.trim(),
  };
}
