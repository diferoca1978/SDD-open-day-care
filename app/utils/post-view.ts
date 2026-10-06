export type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type UserRole = "staff" | "admin" | "parent";

export type PostRow = {
  id: string;
  daycare_id: string;
  author_id: string;
  type: PostType;
  body: string;
  created_at: string;
};

export type PostAuthorRow = {
  id: string;
  full_name: string;
  role: UserRole;
};

export type PostChildRecipientRow = {
  child_id: string;
  child: {
    full_name: string;
  };
};

export type PostRoomRecipientRow = {
  room_id: string;
  room: {
    name: string;
  };
};

export type PostMediaRow = {
  id: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  position: number;
};

export type RealPostRow = {
  post: PostRow;
  author: PostAuthorRow;
  childRecipients: PostChildRecipientRow[];
  roomRecipients: PostRoomRecipientRow[];
  media: PostMediaRow[];
};

export type RealFeedMedia = {
  id: string;
  url: string;
  mimeType: string;
  byteSize: number;
  position: number;
};

export type RealFeedPost = {
  id: string;
  kind: PostType;
  body: string;
  createdAt: string;
  time: string;
  audience: string;
  authorName: string;
  authorRole: string;
  media: RealFeedMedia[];
};

const roleLabels: Record<UserRole, string> = {
  staff: "Maestra",
  admin: "Administración",
  parent: "Familia",
};

export function translateUserRole(role: UserRole): string {
  return roleLabels[role];
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAudience(
  childRecipients: PostChildRecipientRow[],
  roomRecipients: PostRoomRecipientRow[],
): string {
  if (roomRecipients.length > 0) {
    const roomNames = roomRecipients.map(({ room }) => room?.name).filter((name): name is string => Boolean(name));
    if (roomNames.length === 0) {
      return "toda la sala";
    }
    return roomNames.length === 1
      ? `toda la sala ${roomNames[0]}`
      : `todas las salas (${roomNames.join(", ")})`;
  }

  const childNames = childRecipients.map(({ child }) => child.full_name.split(" ")[0]);
  if (childNames.length === 1) {
    return `familia de ${childNames[0]}`;
  }

  return `familias de ${childNames.join(", ")}`;
}

export function buildRealFeedPost(
  row: RealPostRow,
  signedUrls: Record<string, string> = {},
): RealFeedPost {
  return {
    id: row.post.id,
    kind: row.post.type,
    body: row.post.body,
    createdAt: row.post.created_at,
    time: formatTime(row.post.created_at),
    audience: formatAudience(row.childRecipients, row.roomRecipients),
    authorName: row.author.full_name,
    authorRole: translateUserRole(row.author.role),
    media: [...row.media]
      .sort((left, right) => left.position - right.position)
      .map((media) => ({
        id: media.id,
        url: signedUrls[media.storage_path] ?? "",
        mimeType: media.mime_type,
        byteSize: media.byte_size,
        position: media.position,
      })),
  };
}

export function buildRealFeedPosts(
  rows: RealPostRow[],
  signedUrls: Record<string, string> = {},
): RealFeedPost[] {
  return rows
    .map((row) => buildRealFeedPost(row, signedUrls))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
