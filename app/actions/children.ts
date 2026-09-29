"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { allergyTagsFromInput } from "@/app/utils/child-view";
import { createClient } from "@/utils/supabase/server";

export type AddChildState = { error: string | null; savedAt: number | null };

const genericError = "No se pudo guardar el niño. Revisa los datos e inténtalo de nuevo.";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
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
    return false;
  }

  return value <= new Date().toISOString().slice(0, 10);
}

export async function addChild(
  _previousState: AddChildState,
  formData: FormData,
): Promise<AddChildState> {
  const fullName = getFormString(formData, "fullName").trim();
  const birthDate = getFormString(formData, "birthDate").trim();
  const roomId = getFormString(formData, "roomId").trim();
  const allergies = getFormString(formData, "allergies");
  const medicalNotes = getFormString(formData, "medicalNotes").trim();

  if (!fullName || !isValidBirthDate(birthDate) || !uuidPattern.test(roomId)) {
    return { error: genericError, savedAt: null };
  }

  try {
    const supabase = createClient(await cookies());
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) {
      return { error: genericError, savedAt: null };
    }

    const { error: insertError } = await supabase.from("children").insert({
      full_name: fullName,
      birth_date: birthDate,
      room_id: roomId,
      allergy_tags: allergyTagsFromInput(allergies),
      medical_notes: medicalNotes || null,
    });

    if (insertError) {
      return { error: genericError, savedAt: null };
    }
  } catch {
    return { error: genericError, savedAt: null };
  }

  revalidatePath("/kids");
  return { error: null, savedAt: Date.now() };
}
