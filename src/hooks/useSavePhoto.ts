import { supabase } from "@/integrations/supabase/client";

export const useSavePhoto = () => {
  const savePhoto = async (blob: Blob, twibonId?: number) => {
    const fileName = `photo-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(fileName);

    const { data, error } = await supabase
      .from("photos")
      .insert([{ url: publicUrl, twibbon_id: twibonId ?? null }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { savePhoto };
};
