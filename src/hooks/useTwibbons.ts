
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Twibon {
  id: number;
  name: string;
  url: string;
  created_at: string;
}

export const useTwibbons = () => {
  const [twibbons, setTwibbons] = useState<Twibon[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const loadTwibbons = async () => {
    try {
      const { data, error } = await supabase
        .from('twibbons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTwibbons(data || []);
    } catch (error) {
      console.error('Error loading twibbons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwibbons();

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up real-time subscription with unique channel name
    const channel = supabase
      .channel(`twibbons-updates-${Math.random().toString(36).substr(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'twibbons'
        },
        () => {
          loadTwibbons();
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
    twibbons,
    loading,
    loadTwibbons
  };
};
