import { useState, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface DisplayPhoto {
  id: number;
  url: string;
  created_at: string;
}

export const useDisplayPhotos = () => {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, url, created_at")
        .order("created_at", { ascending: false });

      if (!error) setPhotos((data ?? []).filter((p): p is DisplayPhoto => p.url !== null));
      setLoading(false);
    };

    load();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`display-photos-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPhotos((prev) => [payload.new as DisplayPhoto, ...prev]);
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: number }).id;
            setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DisplayPhoto;
            setPhotos((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { photos, loading };
};
