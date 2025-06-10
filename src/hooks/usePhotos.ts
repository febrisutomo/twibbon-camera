
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: number;
  url: string;
  twibbon_id: number | null;
  created_at: string;
  twibbons?: {
    id: number;
    name: string;
    url: string;
  } | null;
}

export const usePhotos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  // Load photos from database
  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          twibbons (
            id,
            name,
            url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save photo to storage and database
  const savePhoto = async (blob: Blob, twibonId?: number) => {
    try {
      const fileName = `photo-${Date.now()}.jpg`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('photos')
        .insert([{ 
          url: publicUrl,
          twibbon_id: twibonId || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  };

  // Update photo's twibon
  const updatePhotoTwibon = async (photoId: number, twibonId: number | null) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ twibbon_id: twibonId })
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating photo twibon:', error);
      throw error;
    }
  };

  // Delete photo
  const deletePhoto = async (photo: Photo) => {
    try {
      // Extract filename from URL
      const fileName = photo.url.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage
          .from('photos')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadPhotos();

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up real-time subscription with unique channel name
    const channel = supabase
      .channel(`photos-updates-${Math.random().toString(36).substr(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos'
        },
        () => {
          loadPhotos();
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

  return {
    photos,
    loading,
    savePhoto,
    updatePhotoTwibon,
    deletePhoto,
    loadPhotos
  };
};
