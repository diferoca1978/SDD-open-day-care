export type PostKind = "achievement" | "activity" | "announcement";

export type FeedPost = {
  id: string;
  kind: PostKind;
  childName?: string;
  time: string;
  audience: string;
  body: string;
  photoCaption?: string;
  hearts: number;
  comments: number;
};

export const currentUser = {
  name: "Caro Giménez",
  role: "Maestra",
  room: "Soles",
  initial: "C",
};

export const room = {
  name: "Sala Soles",
  childrenCount: 12,
};

export const posts: FeedPost[] = [
  {
    id: "mateo-achievement",
    kind: "achievement",
    childName: "Mateo",
    time: "14:20",
    audience: "familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    hearts: 3,
    comments: 1,
  },
  {
    id: "mateo-activity",
    kind: "activity",
    childName: "Mateo",
    time: "09:40",
    audience: "familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoCaption: "pintando con témperas",
    hearts: 5,
    comments: 2,
  },
  {
    id: "park-announcement",
    kind: "announcement",
    time: "07:50",
    audience: "toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    hearts: 8,
    comments: 0,
  },
];
