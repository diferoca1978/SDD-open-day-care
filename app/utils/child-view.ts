export type RoomOption = { id: string; name: string };

export type ChildRow = {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergy_tags: string[];
};

export type ViewChild = {
  id: string;
  roomId: string;
  roomName: string;
  fullName: string;
  ageLabel: string;
  birthDateLabel: string;
  entryLabel: string;
  avatarColor: string;
  avatarTextColor: string;
  allergyLabels: string[];
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const monthLabels = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const avatarPalette = [
  { backgroundColor: "#A9D9E8", textColor: "#1F7A93" },
  { backgroundColor: "#F4B8CC", textColor: "#C44A7A" },
  { backgroundColor: "#B9DEC4", textColor: "#3E8B62" },
  { backgroundColor: "#F4DC8E", textColor: "#9A7B1E" },
  { backgroundColor: "#C9B6E8", textColor: "#7B5FC0" },
];

const allergyTagsByInput: Record<string, string> = {
  mani: "peanut",
  lactosa: "lactose",
  gluten: "gluten",
  huevo: "egg",
  soya: "soy",
  trigo: "wheat",
};

const allergyLabelsByTag: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  soy: "SOYA",
  wheat: "TRIGO",
};

function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1]
  ) {
    return null;
  }

  return { year, month, day };
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatDate(value: string) {
  const date = parseCalendarDate(value);
  if (!date) {
    return value;
  }

  const day = String(date.day).padStart(2, "0");
  return `${day} ${monthLabels[date.month - 1]} ${date.year}`;
}

function formatMonthYear(value: string) {
  const date = parseCalendarDate(value);
  if (!date) {
    return value;
  }

  return `${monthLabels[date.month - 1]} ${date.year}`;
}

function getAgeLabel(birthDateValue: string) {
  const birthDate = parseCalendarDate(birthDateValue);
  if (!birthDate) {
    return "";
  }

  const today = new Date();
  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDay = today.getUTCDate();

  let totalMonths =
    (todayYear - birthDate.year) * 12 + todayMonth - birthDate.month;
  if (todayDay < birthDate.day) {
    totalMonths -= 1;
  }
  totalMonths = Math.max(totalMonths, 0);

  const years = Math.floor(totalMonths / 12);
  if (years > 0) {
    return `${years} ${years === 1 ? "año" : "años"}`;
  }

  return `${totalMonths} ${totalMonths === 1 ? "mes" : "meses"}`;
}

function normalizeAllergyTag(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function hashId(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function allergyTagsFromInput(input: string): string[] {
  const tags = input
    .split(",")
    .map(normalizeAllergyTag)
    .filter(Boolean)
    .map((tag) => allergyTagsByInput[tag] ?? tag);

  return [...new Set(tags)];
}

export function buildViewChild(row: ChildRow, roomName: string): ViewChild {
  const avatar = avatarPalette[hashId(row.id) % avatarPalette.length];

  return {
    id: row.id,
    roomId: row.room_id,
    roomName,
    fullName: row.full_name,
    ageLabel: getAgeLabel(row.birth_date),
    birthDateLabel: formatDate(row.birth_date),
    entryLabel: formatMonthYear(row.enrolled_at),
    avatarColor: avatar.backgroundColor,
    avatarTextColor: avatar.textColor,
    allergyLabels: row.allergy_tags.map((tag) => {
      const normalizedTag = normalizeAllergyTag(tag);
      return allergyLabelsByTag[normalizedTag] ?? normalizedTag.toUpperCase();
    }),
  };
}
