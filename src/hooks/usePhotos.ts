import { useState, useEffect, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Photo {
  id: number;
  url: string;
  twibbon_id: number | null;
  created_at: string;
}

const PAGE_SIZE = 10;
const SELECT = "id, url, created_at, twibbon_id";

export const usePhotos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const { data, error } = await supabase
          .from("photos")
          .select(SELECT)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;
        const photos = (data ?? []).filter((p): p is Photo => p.url !== null);
        setPhotos(photos);
        setHasMore(photos.length >= PAGE_SIZE);
      } catch (err) {
        console.error("Error loading photos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`photos-gallery-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPhotos((prev) => [payload.new as Photo, ...prev]);
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: number }).id;
            setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Photo;
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

  const loadMorePhotos = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const from = (nextPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("photos")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        const more = data.filter((p): p is Photo => p.url !== null);
        setPhotos((prev) => [...prev, ...more]);
        setPage(nextPage);
        setHasMore(more.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more photos:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loading, loadingMore, hasMore]);

  const deletePhoto = async (photo: Photo) => {
    try {
      const fileName = photo.url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("photos").remove([fileName]);
      }

      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;
    } catch (err) {
      console.error("Error deleting photo:", err);
      throw err;
    }
  };

  return {
    photos,
    loading,
    loadingMore,
    hasMore,
    deletePhoto,
    loadMorePhotos,
  };
};
