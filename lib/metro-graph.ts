export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  capacityPerHour: number;
  line: "red" | "green" | "purple" | "shared";
  baseDemand: number;
}

export interface Edge {
  from: string;
  to: string;
  lineType: "red" | "green" | "purple" | "shared";
}

export const STATIONS: Station[] = [
  // Red line only
  { id: "icherisheher", name: "Icherisheher", x: 85, y: 210, capacityPerHour: 8000, line: "red", baseDemand: 0.45 },
  { id: "sahil", name: "Sahil", x: 175, y: 210, capacityPerHour: 9500, line: "red", baseDemand: 0.55 },

  // Junction
  { id: "28-may", name: "28 May", x: 268, y: 210, capacityPerHour: 14000, line: "shared", baseDemand: 0.72 },

  // Shared trunk (28 May → H.Aslanov)
  { id: "ganjlik", name: "Ganjlik", x: 350, y: 210, capacityPerHour: 9000, line: "shared", baseDemand: 0.50 },
  { id: "nariman-narimanov", name: "N. Narimanov", x: 428, y: 210, capacityPerHour: 10000, line: "shared", baseDemand: 0.58 },
  { id: "ulduz", name: "Ulduz", x: 502, y: 210, capacityPerHour: 8500, line: "shared", baseDemand: 0.42 },
  { id: "koroglu", name: "Koroglu", x: 572, y: 210, capacityPerHour: 11000, line: "shared", baseDemand: 0.65 },
  { id: "qara-qarayev", name: "Qara Qarayev", x: 572, y: 263, capacityPerHour: 10500, line: "shared", baseDemand: 0.60 },
  { id: "neftchiler", name: "Neftchilar", x: 500, y: 263, capacityPerHour: 8000, line: "shared", baseDemand: 0.40 },
  { id: "xalqlar-dostlugu", name: "Kh. Dostlugu", x: 428, y: 263, capacityPerHour: 9000, line: "shared", baseDemand: 0.48 },
  { id: "ahmadli", name: "Ahmadli", x: 356, y: 263, capacityPerHour: 9500, line: "shared", baseDemand: 0.52 },
  { id: "hazi-aslanov", name: "H. Aslanov", x: 284, y: 263, capacityPerHour: 12000, line: "shared", baseDemand: 0.68 },

  // Red dead-end branch
  { id: "bakmil", name: "Bakmil", x: 428, y: 148, capacityPerHour: 5000, line: "red", baseDemand: 0.25 },

  // Green only branch (→ 28 May)
  { id: "nizami", name: "Nizami", x: 232, y: 162, capacityPerHour: 9000, line: "green", baseDemand: 0.50 },
  { id: "elmler-akademiyasi", name: "Elmlar Akademiyasi", x: 190, y: 122, capacityPerHour: 7500, line: "green", baseDemand: 0.38 },
  { id: "inshaatchilar", name: "Inshaatchilar", x: 148, y: 92, capacityPerHour: 7000, line: "green", baseDemand: 0.35 },
  { id: "20-yanvar", name: "20 Yanvar", x: 108, y: 72, capacityPerHour: 8000, line: "green", baseDemand: 0.40 },
  { id: "memar-ajami", name: "Memar Ajami", x: 68, y: 72, capacityPerHour: 10000, line: "green", baseDemand: 0.55 },
  { id: "darnagul", name: "Darnagul", x: 35, y: 72, capacityPerHour: 6000, line: "green", baseDemand: 0.30 },

  // Purple line
  { id: "8-noyabr", name: "8 Noyabr", x: 68, y: 38, capacityPerHour: 6500, line: "purple", baseDemand: 0.28 },
  { id: "avtovagzal", name: "Avtovagzal", x: 108, y: 38, capacityPerHour: 7000, line: "purple", baseDemand: 0.35 },
  { id: "xocasan", name: "Khojasan", x: 148, y: 38, capacityPerHour: 5500, line: "purple", baseDemand: 0.22 },
];

export const EDGES: Edge[] = [
  // Red line: Icherisheher → Sahil → 28 May
  { from: "icherisheher", to: "sahil", lineType: "red" },
  { from: "sahil", to: "28-may", lineType: "red" },

  // Green line: Darnagul → ... → 28 May
  { from: "darnagul", to: "memar-ajami", lineType: "green" },
  { from: "memar-ajami", to: "20-yanvar", lineType: "green" },
  { from: "20-yanvar", to: "inshaatchilar", lineType: "green" },
  { from: "inshaatchilar", to: "elmler-akademiyasi", lineType: "green" },
  { from: "elmler-akademiyasi", to: "nizami", lineType: "green" },
  { from: "nizami", to: "28-may", lineType: "green" },

  // Shared trunk: 28 May → H. Aslanov
  { from: "28-may", to: "ganjlik", lineType: "shared" },
  { from: "ganjlik", to: "nariman-narimanov", lineType: "shared" },
  { from: "nariman-narimanov", to: "ulduz", lineType: "shared" },
  { from: "ulduz", to: "koroglu", lineType: "shared" },
  { from: "koroglu", to: "qara-qarayev", lineType: "shared" },
  { from: "qara-qarayev", to: "neftchiler", lineType: "shared" },
  { from: "neftchiler", to: "xalqlar-dostlugu", lineType: "shared" },
  { from: "xalqlar-dostlugu", to: "ahmadli", lineType: "shared" },
  { from: "ahmadli", to: "hazi-aslanov", lineType: "shared" },

  // Red dead-end branch
  { from: "nariman-narimanov", to: "bakmil", lineType: "red" },

  // Purple line: connects via Memar Ajami
  { from: "memar-ajami", to: "8-noyabr", lineType: "purple" },
  { from: "8-noyabr", to: "avtovagzal", lineType: "purple" },
  { from: "avtovagzal", to: "xocasan", lineType: "purple" },
];

// Route definitions
export const ROUTES = {
  redFull: [
    "icherisheher", "sahil", "28-may", "ganjlik", "nariman-narimanov",
    "ulduz", "koroglu", "qara-qarayev", "neftchiler", "xalqlar-dostlugu",
    "ahmadli", "hazi-aslanov",
  ],
  greenFull: [
    "darnagul", "memar-ajami", "20-yanvar", "inshaatchilar",
    "elmler-akademiyasi", "nizami", "28-may", "ganjlik", "nariman-narimanov",
    "ulduz", "koroglu", "qara-qarayev", "neftchiler", "xalqlar-dostlugu",
    "ahmadli", "hazi-aslanov",
  ],
  bakmilShuttle: ["nariman-narimanov", "bakmil"],
  purpleShuttle: ["xocasan", "avtovagzal", "8-noyabr", "memar-ajami"],
};
