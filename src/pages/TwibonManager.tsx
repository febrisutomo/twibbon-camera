
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Twibon {
  id: number;
  name: string;
  url: string;
  created_at: string;
}

const TwibonManager = () => {
  const [twibbons, setTwibbons] = useState<Twibon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTwibon, setEditingTwibon] = useState<Twibon | null>(null);
  const [newTwibonName, setNewTwibonName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadTwibbons();

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up real-time subscription with unique channel name
    const channel = supabase
      .channel(`twibbons-manager-${Math.random().toString(36).substr(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'twibbons'
        },
        (payload) => {
          console.log('Twibon change detected:', payload);
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
      toast({
        title: "Error",
        description: "Failed to load twibbons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is PNG
      if (!file.type.includes('png')) {
        toast({
          title: "Error",
          description: "Only PNG files are allowed.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadTwibonImage = async (file: File) => {
    const fileName = `twibon-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('twibbons')
      .upload(fileName, file, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('twibbons')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const createTwibon = async () => {
    if (!newTwibonName.trim() || !selectedFile) {
      toast({
        title: "Error",
        description: "Please provide a name and select a PNG image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadTwibonImage(selectedFile);
      
      const { error } = await supabase
        .from('twibbons')
        .insert([{ name: newTwibonName, url: imageUrl }]);

      if (error) throw error;

      // Reset form and close sheet
      setNewTwibonName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsCreateSheetOpen(false);
      
      toast({
        title: "Success",
        description: "Twibon created successfully!",
      });
    } catch (error) {
      console.error('Error creating twibon:', error);
      toast({
        title: "Error",
        description: "Failed to create twibon.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateTwibon = async () => {
    if (!editingTwibon || !editingTwibon.name.trim()) return;

    setUploading(true);
    try {
      let updateData: any = { name: editingTwibon.name };
      
      if (selectedFile) {
        const imageUrl = await uploadTwibonImage(selectedFile);
        updateData.url = imageUrl;
      }

      const { error } = await supabase
        .from('twibbons')
        .update(updateData)
        .eq('id', editingTwibon.id);

      if (error) throw error;

      setEditingTwibon(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditSheetOpen(false);
      
      toast({
        title: "Success",
        description: "Twibon updated successfully!",
      });
    } catch (error) {
      console.error('Error updating twibon:', error);
      toast({
        title: "Error",
        description: "Failed to update twibon.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTwibon = async (twibon: Twibon) => {
    try {
      const link = document.createElement('a');
      link.href = twibon.url;
      link.download = `${twibon.name}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: "Twibon has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download twibon.",
        variant: "destructive",
      });
    }
  };

  const deleteTwibon = async (twibon: Twibon) => {
    try {
      // Delete from storage
      const fileName = twibon.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('twibbons')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('twibbons')
        .delete()
        .eq('id', twibon.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Twibon deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting twibon:', error);
      toast({
        title: "Error",
        description: "Failed to delete twibon.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center">
        <div className="text-white text-lg">Loading twibbons...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Manage Twibbons</h1>
          </div>
          
          {/* Create New Twibon Sheet */}
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create New Twibon</SheetTitle>
                <SheetDescription>
                  Upload a PNG image and give it a name to create a new twibon frame.
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="create-name">Name</Label>
                  <Input
                    id="create-name"
                    value={newTwibonName}
                    onChange={(e) => setNewTwibonName(e.target.value)}
                    placeholder="Enter twibon name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-image">Image (PNG only)</Label>
                  <Input
                    id="create-image"
                    type="file"
                    accept=".png,image/png"
                    onChange={handleFileSelect}
                  />
                </div>
                
                {/* Preview */}
                {previewUrl && (
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2 relative max-w-32 mx-auto">
                      <div className="aspect-[9/16]">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover rounded border"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={createTwibon}
                    disabled={uploading || !newTwibonName.trim() || !selectedFile}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Creating...' : 'Create Twibon'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Edit Twibon Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Twibon</SheetTitle>
              <SheetDescription>
                Update the twibon name or replace the image.
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingTwibon?.name || ''}
                  onChange={(e) => setEditingTwibon(editingTwibon ? { ...editingTwibon, name: e.target.value } : null)}
                  placeholder="Enter twibon name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-image">Image (PNG only)</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept=".png,image/png"
                  onChange={handleFileSelect}
                />
              </div>
              
              {/* Preview */}
              {previewUrl && (
                <div>
                  <Label>New Preview</Label>
                  <div className="mt-2 relative max-w-32 mx-auto">
                    <div className="aspect-[9/16]">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded border"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updateTwibon}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Updating...' : 'Update'}
                </Button>
                
                <Button
                  onClick={() => {
                    setEditingTwibon(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setIsEditSheetOpen(false);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Twibbons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {twibbons.map((twibon) => (
            <div key={twibon.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="aspect-[9/16] relative group">
                <img
                  src={twibon.url}
                  alt={twibon.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Button
                    onClick={() => downloadTwibon(twibon)}
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 text-white border-0 hover:bg-white/30"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingTwibon(twibon);
                      setIsEditSheetOpen(true);
                    }}
                    size="sm"
                    variant="secondary"
                    className="bg-blue-500/80 text-white border-0 hover:bg-blue-500"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteTwibon(twibon)}
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/80 text-white border-0 hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-1 truncate">{twibon.name}</h3>
                <p className="text-white/60 text-sm">{formatDate(twibon.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        {twibbons.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-white/60" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Twibbons Yet</h2>
            <p className="text-white/80">Create your first twibon to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwibonManager;