export type ParentStatus = "active" | "pending";

export type ParentLink = {
  name: string;
  role: string;
  status: ParentStatus;
  avatarColor: string;
};

export type Kid = {
  id: string;
  name: string;
  ageLabel: string;
  birthDateLabel: string;
  room: string;
  entryLabel: string;
  avatarColor: string;
  avatarTextColor: string;
  allergyChips?: string[];
  allergyNotes?: string;
  parents: ParentLink[];
};

export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    ageLabel: "3 años",
    birthDateLabel: "12 mar 2022",
    room: "Soles",
    entryLabel: "feb 2025",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    allergyChips: ["MANÍ"],
    allergyNotes: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      { name: "Lucía Fernández", role: "Mamá", status: "active", avatarColor: "#C9B6E8" },
      { name: "Diego Fernández", role: "Papá", status: "pending", avatarColor: "#A9C7E8" },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    ageLabel: "2 años",
    birthDateLabel: "05 jul 2023",
    room: "Soles",
    entryLabel: "mar 2025",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    parents: [{ name: "Carolina Méndez", role: "Mamá", status: "active", avatarColor: "#CCD8F4" }],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    ageLabel: "3 años",
    birthDateLabel: "28 ene 2022",
    room: "Soles",
    entryLabel: "feb 2025",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    parents: [
      { name: "Ana Ruiz", role: "Mamá", status: "active", avatarColor: "#F4A8A0" },
      { name: "Javier Ruiz", role: "Papá", status: "active", avatarColor: "#A9C7E8" },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    ageLabel: "2 años",
    birthDateLabel: "19 sep 2023",
    room: "Soles",
    entryLabel: "ago 2025",
    avatarColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    ageLabel: "3 años",
    birthDateLabel: "03 abr 2022",
    room: "Soles",
    entryLabel: "mar 2025",
    avatarColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
    allergyChips: ["LACTOSA"],
    allergyNotes: "Alergia a la lactosa. Su leche y derivados se sustituyen por bebida vegetal.",
    parents: [{ name: "Marta Díaz", role: "Mamá", status: "active", avatarColor: "#F4B8CC" }],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    ageLabel: "2 años",
    birthDateLabel: "22 nov 2023",
    room: "Soles",
    entryLabel: "abr 2025",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    parents: [{ name: "Paula Castro", role: "Mamá", status: "active", avatarColor: "#B9DEC4" }],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    ageLabel: "3 años",
    birthDateLabel: "16 jun 2022",
    room: "Soles",
    entryLabel: "sep 2025",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    parents: [{ name: "Hernán Romero", role: "Papá", status: "active", avatarColor: "#F4DC8E" }],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    ageLabel: "2 años",
    birthDateLabel: "08 feb 2023",
    room: "Soles",
    entryLabel: "ene 2025",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    parents: [{ name: "Renata Vega", role: "Mamá", status: "active", avatarColor: "#C9B6E8" }],
  },
];
