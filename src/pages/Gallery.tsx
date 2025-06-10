
import { useState } from 'react';
import { ArrowLeft, Download, Trash2, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePhotos } from '@/hooks/usePhotos';
import { useTwibbons } from '@/hooks/useTwibbons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const Gallery = () => {
  const { photos, loading, deletePhoto, updatePhotoTwibon } = usePhotos();
  const { twibbons } = useTwibbons();
  const { toast } = useToast();
  const [editingPhoto, setEditingPhoto] = useState<any>(null);

  const downloadPhoto = async (photo: any) => {
    if (photo.twibbons) {
      // Create merged image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const photoImg = new Image();
      photoImg.crossOrigin = 'anonymous';
      
      photoImg.onload = () => {
        canvas.width = photoImg.width;
        canvas.height = photoImg.height;
        
        // Draw photo
        ctx.drawImage(photoImg, 0, 0);
        
        // Draw twibon overlay
        const twibonImg = new Image();
        twibonImg.crossOrigin = 'anonymous';
        twibonImg.onload = () => {
          ctx.drawImage(twibonImg, 0, 0, canvas.width, canvas.height);
          
          // Download merged image
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.download = `twibon-photo-${photo.id}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Downloaded!",
            description: "Photo with twibon has been saved to your device.",
          });
        };
        twibonImg.src = photo.twibbons.url;
      };
      photoImg.src = photo.url;
    } else {
      // Download original photo
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = `photo-${photo.id}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: "Photo has been saved to your device.",
      });
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    try {
      await deletePhoto(photo);
      toast({
        title: "Photo Deleted",
        description: "Photo has been removed from gallery.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTwibon = async (photoId: number, twibonId: number | null) => {
    try {
      await updatePhotoTwibon(photoId, twibonId);
      setEditingPhoto(null);
      toast({
        title: "Updated!",
        description: "Photo twibon has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update photo twibon.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-white text-lg">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Photo Gallery</h1>
          </div>
          <div className="text-white/80 text-sm">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <div className="text-white/60 text-4xl">📷</div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Photos Yet</h2>
            <p className="text-white/80 mb-6">Start taking photos with twibon frames!</p>
            <Link to="/">
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                Take Your First Photo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                <div className="relative group">
                  <AspectRatio ratio={9/16}>
                    <div className="relative w-full h-full">
                      <img
                        src={photo.url}
                        alt={`Photo ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Twibon overlay - only show if twibbons exists and twibbon_id is not null */}
                      {photo.twibbons && photo.twibbon_id && (
                        <div className="absolute inset-0">
                          <img
                            src={photo.twibbons.url}
                            alt={photo.twibbons.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </AspectRatio>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => downloadPhoto(photo)}
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 text-white border-0 hover:bg-white/30"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          onClick={() => setEditingPhoto(photo)}
                          size="sm"
                          variant="secondary"
                          className="bg-blue-500/80 text-white border-0 hover:bg-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Select Twibon</SheetTitle>
                          <SheetDescription>
                            Choose a twibon for this photo.
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {/* None option with X icon */}
                            <Button
                              onClick={() => handleUpdateTwibon(photo.id, null)}
                              variant={photo.twibbon_id === null ? "default" : "outline"}
                              className="h-auto p-4 flex flex-col gap-2"
                            >
                              <div className="w-12 h-20 aspect-[9/16] flex items-center justify-center border rounded">
                                <X className="w-6 h-6" />
                              </div>
                              <span className="text-xs">None</span>
                            </Button>
                            
                            {/* Twibon options */}
                            {twibbons.map((twibon) => (
                              <Button
                                key={twibon.id}
                                onClick={() => handleUpdateTwibon(photo.id, twibon.id)}
                                variant={photo.twibbon_id === twibon.id ? "default" : "outline"}
                                className="h-auto p-4 flex flex-col gap-2"
                              >
                                <img
                                  src={twibon.url}
                                  alt={twibon.name}
                                  className="w-12 h-20 aspect-[9/16] object-cover rounded"
                                />
                                <span className="text-xs">{twibon.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    
                    <Button
                      onClick={() => handleDeletePhoto(photo)}
                      size="sm"
                      variant="destructive"
                      className="bg-red-500/80 text-white border-0 hover:bg-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/80 text-sm">
                      {formatDate(photo.created_at)}
                    </p>
                    {photo.twibbons && photo.twibbon_id && (
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                        {photo.twibbons.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
