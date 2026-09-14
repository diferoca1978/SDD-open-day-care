export const rooms = ["Soles", "Lunas", "Estrellas"] as const;

export type Room = (typeof rooms)[number];
