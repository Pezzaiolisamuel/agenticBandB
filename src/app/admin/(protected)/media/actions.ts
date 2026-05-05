"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ROOM_IMAGES_BUCKET = "room-images";

function redirectWithMessage(message: string, type: "error" | "success") {
  redirect(`/admin/media?${type}=${encodeURIComponent(message)}`);
}

function readRequiredString(formData: FormData, fieldName: string) {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (!value) {
    throw new Error(`Campo mancante: ${fieldName}.`);
  }

  return value;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

async function getNextSortOrder(roomId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_images")
    .select("sort_order")
    .eq("room_id", roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.sort_order ?? -1) + 1;
}

export async function uploadRoomImage(formData: FormData) {
  try {
    await requireAdminUser();

    const roomId = readRequiredString(formData, "roomId");
    const altIt = readRequiredString(formData, "alt_it");
    const altEn = readRequiredString(formData, "alt_en");
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Seleziona un file immagine da caricare.");
    }

    const supabase = createSupabaseAdminClient();
    const nextSortOrder = await getNextSortOrder(roomId);
    const filePath = `${roomId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(ROOM_IMAGES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(ROOM_IMAGES_BUCKET).getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("room_images").insert({
      room_id: roomId,
      storage_path: publicUrl,
      alt_it: altIt,
      alt_en: altEn,
      sort_order: nextSortOrder,
    });

    if (insertError) {
      throw insertError;
    }

    revalidatePath("/admin/media");
    revalidatePath("/en/rooms");
    revalidatePath("/it/rooms");
    redirectWithMessage("Immagine caricata e assegnata alla camera selezionata.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile caricare l'immagine della camera.";
    redirectWithMessage(message, "error");
  }
}

export async function updateRoomImageMetadata(formData: FormData) {
  try {
    await requireAdminUser();

    const imageId = readRequiredString(formData, "imageId");
    const altIt = readRequiredString(formData, "alt_it");
    const altEn = readRequiredString(formData, "alt_en");

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("room_images")
      .update({
        alt_it: altIt,
        alt_en: altEn,
      })
      .eq("id", imageId);

    if (error) {
      throw error;
    }

    revalidatePath("/admin/media");
    revalidatePath("/en/rooms");
    revalidatePath("/it/rooms");
    redirectWithMessage("Metadati immagine aggiornati.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile aggiornare i metadati dell'immagine.";
    redirectWithMessage(message, "error");
  }
}

export async function deleteRoomImageMetadata(formData: FormData) {
  try {
    await requireAdminUser();

    const imageId = readRequiredString(formData, "imageId");
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("room_images").delete().eq("id", imageId);

    if (error) {
      throw error;
    }

    revalidatePath("/admin/media");
    revalidatePath("/en/rooms");
    revalidatePath("/it/rooms");
    redirectWithMessage("Metadati immagine eliminati.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile eliminare i metadati dell'immagine.";
    redirectWithMessage(message, "error");
  }
}
