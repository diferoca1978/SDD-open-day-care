"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export type CreatePostState = {
  error: string | null;
  postId: string | null;
  savedAt: number | null;
};

const initialState: CreatePostState = { error: null, postId: null, savedAt: null };
const bucketName = "post-media";
const maxFiles = 5;
const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const postTypes = new Set(["food", "nap", "activity", "achievement", "mood", "photo", "announcement"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getStrings(formData: FormData, name: string): string[] {
  return [...new Set(
    formData
      .getAll(name)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  )];
}

function getFiles(formData: FormData): File[] {
  return formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getExtension(mimeType: string): string {
  return mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function compensate(
  postId: string | null,
  storagePaths: string[],
): Promise<void> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return;
  }

  if (storagePaths.length > 0) {
    await adminClient.storage.from(bucketName).remove(storagePaths);
  }
  if (postId) {
    await adminClient.from("posts").delete().eq("id", postId);
  }
}

export async function createPost(
  _previousState: CreatePostState = initialState,
  formData: FormData,
): Promise<CreatePostState> {
  void _previousState;
  const type = getString(formData, "type");
  const body = getString(formData, "body");
  const childIds = getStrings(formData, "childIds");
  const allRooms = getString(formData, "audience") === "rooms";
  const files = getFiles(formData);

  if (!postTypes.has(type)) {
    return { error: "Selecciona un tipo de publicación.", postId: null, savedAt: null };
  }
  if (!body) {
    return { error: "Escribe una descripción.", postId: null, savedAt: null };
  }
  if ((!allRooms && childIds.length === 0) || (allRooms && childIds.length > 0)) {
    return { error: "Selecciona uno o más destinatarios.", postId: null, savedAt: null };
  }
  if (childIds.some((childId) => !uuidPattern.test(childId))) {
    return { error: "La audiencia seleccionada no es válida.", postId: null, savedAt: null };
  }
  if (files.length > maxFiles) {
    return { error: "Puedes adjuntar hasta cinco imágenes.", postId: null, savedAt: null };
  }
  if (files.some((file) => !allowedMimeTypes.has(file.type))) {
    return { error: "Solo se permiten imágenes JPG, PNG o WebP.", postId: null, savedAt: null };
  }
  if (files.some((file) => file.size > maxFileSize)) {
    return { error: "Cada imagen debe pesar como máximo 5 MB.", postId: null, savedAt: null };
  }

  let postId: string | null = null;
  const uploadedPaths: string[] = [];

  try {
    const supabase = createClient(await cookies());
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (authError || !userId) {
      return { error: "Inicia sesión para publicar.", postId: null, savedAt: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("daycare_id, role")
      .eq("id", userId)
      .single();

    if (profileError || !profile || (profile.role !== "staff" && profile.role !== "admin")) {
      return { error: "No tienes permisos para publicar.", postId: null, savedAt: null };
    }

    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("id")
      .eq("daycare_id", profile.daycare_id);
    if (roomsError) {
      return { error: "No se pudo validar la audiencia.", postId: null, savedAt: null };
    }

    let audienceChildIds: string[] = [];
    let audienceRoomIds: string[] = [];
    if (allRooms) {
      audienceRoomIds = (rooms ?? []).map((room) => room.id);
      if (audienceRoomIds.length === 0) {
        return { error: "No hay salas disponibles para esta publicación.", postId: null, savedAt: null };
      }
    } else {
      const { data: children, error: childrenError } = await supabase
        .from("children")
        .select("id, room_id")
        .in("id", childIds);
      const roomIds = new Set((rooms ?? []).map((room) => room.id));
      audienceChildIds = (children ?? [])
        .filter((child) => roomIds.has(child.room_id))
        .map((child) => child.id);
      if (childrenError || audienceChildIds.length !== childIds.length) {
        return { error: "La audiencia seleccionada no pertenece a tu guardería.", postId: null, savedAt: null };
      }
    }

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        daycare_id: profile.daycare_id,
        author_id: userId,
        type,
        body,
      })
      .select("id")
      .single();
    if (postError || !post) {
      return { error: "No se pudo crear la publicación.", postId: null, savedAt: null };
    }
    postId = post.id;

    if (audienceChildIds.length > 0) {
      const { error } = await supabase.from("post_children").insert(
        audienceChildIds.map((childId) => ({ post_id: postId, child_id: childId })),
      );
      if (error) {
        await compensate(postId, uploadedPaths);
        return { error: "No se pudo guardar la audiencia.", postId: null, savedAt: null };
      }
    } else {
      const { error } = await supabase.from("post_rooms").insert(
        audienceRoomIds.map((roomId) => ({ post_id: postId, room_id: roomId })),
      );
      if (error) {
        await compensate(postId, uploadedPaths);
        return { error: "No se pudo guardar la audiencia.", postId: null, savedAt: null };
      }
    }

    for (const [position, file] of files.entries()) {
      const mediaId = crypto.randomUUID();
      const storagePath = `posts/${postId}/${mediaId}.${getExtension(file.type)}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        await compensate(postId, uploadedPaths);
        return { error: "No se pudieron subir las imágenes.", postId: null, savedAt: null };
      }
      uploadedPaths.push(storagePath);

      const { error: mediaError } = await supabase.from("post_media").insert({
        id: mediaId,
        post_id: postId,
        storage_path: storagePath,
        mime_type: file.type,
        byte_size: file.size,
        position,
      });
      if (mediaError) {
        await compensate(postId, uploadedPaths);
        return { error: "No se pudo guardar una imagen.", postId: null, savedAt: null };
      }
    }

    revalidatePath("/");
    return { error: null, postId, savedAt: Date.now() };
  } catch {
    await compensate(postId, uploadedPaths);
    return { error: "No se pudo guardar la publicación.", postId: null, savedAt: null };
  }
}
