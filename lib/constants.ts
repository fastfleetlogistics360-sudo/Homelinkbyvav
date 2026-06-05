export const APP_NAME = "HomeLink by V-A.V";
export const TAGLINE = "Request a Home. Get Matched Fast.";
export const DEFAULT_ADMIN_EMAIL = "olasunkanmijoshua765@gmail.com";

export const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara"
];

export const PROPERTY_TYPES = [
  "Self contain",
  "Mini flat",
  "1 bedroom flat",
  "2 bedroom flat",
  "3 bedroom flat",
  "Duplex",
  "Shop or office"
];

export const RENT_DURATIONS = ["Monthly", "Quarterly", "6 months", "Yearly", "2 years"];

export const NIGERIA_STATE_CITIES: Record<string, string[]> = {
  Abia: ["Aba", "Umuahia", "Ohafia", "Arochukwu"],
  Adamawa: ["Yola", "Mubi", "Numan", "Jimeta"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jamaare"],
  Bayelsa: ["Yenagoa", "Brass", "Ogbia", "Nembe"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"],
  Borno: ["Maiduguri", "Biu", "Monguno", "Bama"],
  "Cross River": ["Calabar", "Ikom", "Ogoja", "Ugep"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke", "Ezzamgbo"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi"],
  Ekiti: ["Ado-Ekiti", "Ikere-Ekiti", "Iyin-Ekiti", "Oye-Ekiti"],
  Enugu: ["Enugu", "Nsukka", "Agbani", "Udi"],
  "FCT Abuja": ["Garki", "Wuse", "Maitama", "Gwarinpa", "Kubwa", "Lugbe"],
  Gombe: ["Gombe", "Billiri", "Kaltungo", "Dukku"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Mbaise"],
  Jigawa: ["Dutse", "Hadejia", "Gumel", "Kazaure"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Saminaka"],
  Kano: ["Kano", "Wudil", "Gwarzo", "Bichi"],
  Katsina: ["Katsina", "Daura", "Funtua", "Malumfashi"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"],
  Kogi: ["Lokoja", "Okene", "Kabba", "Anyigba"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran", "Lafiagi"],
  Lagos: ["Ikeja", "Lekki", "Ajah", "Yaba", "Surulere", "Ikorodu", "Epe", "Badagry"],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Karu"],
  Niger: ["Minna", "Bida", "Suleja", "Kontagora"],
  Ogun: ["Abeokuta", "Sango Ota", "Ijebu Ode", "Sagamu"],
  Ondo: ["Akure", "Ondo", "Owo", "Ikare-Akoko"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin"],
  Plateau: ["Jos", "Barkin Ladi", "Pankshin", "Shendam"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny", "Bori"],
  Sokoto: ["Sokoto", "Tambuwal", "Wurno", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum"],
  Yobe: ["Damaturu", "Potiskum", "Gashua", "Nguru"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka"]
};

export const REQUEST_ROUTING_FEE_NAIRA = Number(process.env.REQUEST_ROUTING_FEE_NAIRA ?? 1000);

export const AGENT_PLANS = {
  free: {
    id: "free",
    name: "Free Agent",
    price: 0,
    interval: "forever",
    weeklyLimit: 10,
    badge: "",
    highlight: "",
    rank: 1,
    features: [
      "Accept up to 10 apartment requests per week",
      "Weekly quota reset",
      "In-app request notifications",
      "Agent dashboard access",
      "Request history",
      "Basic analytics"
    ],
    restrictions: ["No email alerts", "No recommendation boosts", "No featured placement", "No premium badge"]
  },
  premium: {
    id: "premium",
    name: "Premium Agent",
    price: 2500,
    interval: "month",
    weeklyLimit: 50,
    badge: "⭐ Premium Agent",
    highlight: "Most Popular",
    rank: 2,
    features: [
      "Accept up to 50 apartment requests per week",
      "Email notifications",
      "Premium Agent badge",
      "Featured higher in search results",
      "Advanced analytics",
      "Lead filtering",
      "Performance statistics"
    ],
    restrictions: []
  },
  platinum: {
    id: "platinum",
    name: "Platinum Agent",
    price: 7500,
    interval: "month",
    weeklyLimit: -1,
    badge: "👑 Platinum Agent",
    highlight: "Best Exposure",
    rank: 3,
    features: [
      "Unlimited apartment request acceptance",
      "Email notifications",
      "Phone/SMS notification architecture placeholder",
      "Platinum Agent badge",
      "Priority ranking",
      "Recommended within the same state",
      "Homepage featured rotation",
      "Advanced analytics",
      "Early access to apartment requests",
      "Dedicated support section"
    ],
    restrictions: []
  }
} as const;

export type AgentPlanId = keyof typeof AGENT_PLANS;
