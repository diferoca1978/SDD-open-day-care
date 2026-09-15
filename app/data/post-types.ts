export type PostType = {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
};

export const postTypes: PostType[] = [
  { id: "food", label: "Comida", bgColor: "#9A7B1E", textColor: "#FFFFFF" },
  { id: "nap", label: "Siesta", bgColor: "#E7DCF6", textColor: "#7B5FC0" },
  { id: "activity", label: "Actividad", bgColor: "#2E89A6", textColor: "#FFFFFF" },
  { id: "achievement", label: "Logro", bgColor: "#CFEBD8", textColor: "#3E9B6C" },
  { id: "mood", label: "Ánimo", bgColor: "#F9D2DE", textColor: "#C56486" },
  { id: "photo", label: "Foto", bgColor: "#FBD8CC", textColor: "#D9684A" },
  { id: "announcement", label: "Anuncio", bgColor: "#CCD8F4", textColor: "#4E72C8" },
];
