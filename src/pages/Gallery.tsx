import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Trash2, DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePhotos, type Photo } from '@/hooks/usePhotos';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Gallery = () => {
  const {
    photos,
    loading,
    loadingMore,
    hasMore,
    deletePhoto,
    loadMorePhotos
  } = usePhotos();
  const { toast } = useToast();
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePhotos();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, loadMorePhotos]);

  const downloadPhoto = (photo: Photo) => {
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
  };

  const downloadAllPhotos = async () => {
    if (photos.length === 0) return;
    
    setIsDownloadingAll(true);
    toast({
      title: "Preparing Downloads",
      description: "Your photos are being prepared for download. This may take a moment.",
    });

    try {
      // Dynamically import JSZip
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      const folder = zip.folder("twibbon_photos");

      // Process each photo sequentially to avoid browser limitations
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileName = `twibbon-photo-${photo.id}.jpg`;
        
        // Fetch the photo (with twibon if applicable)
        const blob = await fetchPhotoBlob(photo);
        
        if (blob) {
          folder?.file(fileName, blob);
        }

        // Update progress every 5 photos
        if (i % 5 === 0 || i === photos.length - 1) {
          toast({
            title: "Downloading...",
            description: `Processed ${i + 1} of ${photos.length} photos.`,
          });
        }
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });
      
      // Download the zip file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `twibon_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Complete!",
        description: `All ${photos.length} photos have been downloaded as a zip file.`,
      });
    } catch (error) {
      console.error("Error downloading all photos:", error);
      toast({
        title: "Error",
        description: "Failed to download all photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const fetchPhotoBlob = async (photo: { id: number; url: string }): Promise<Blob | null> => {
    try {
      const response = await fetch(photo.url);
      return await response.blob();
    } catch (error) {
      console.error(`Error processing photo ${photo.id}:`, error);
      return null;
    }
  };

  const handleDeleteClick = (photo: Photo) => {
    setPhotoToDelete(photo);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;

    try {
      await deletePhoto(photoToDelete);
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
    } finally {
      setIsDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center">
        <div className="text-white text-lg">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      <div className="container mx-auto px-4 py-6">
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the photo from your gallery.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
          <div className="flex items-center gap-4">
            <div className="text-white/80 text-sm">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
              {hasMore && '+'}
            </div>
            {photos.length > 0 && (
              <Button
                onClick={downloadAllPhotos}
                disabled={isDownloadingAll}
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isDownloadingAll ? (
                  "Downloading..."
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Download All
                  </>
                )}
              </Button>
            )}
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                  <div className="relative group">
                    <AspectRatio ratio={9 / 16}>
                      <img
                        src={photo.url}
                        alt={`Photo ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
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

                      <Button
                        onClick={() => handleDeleteClick(photo)}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading more indicator and intersection observer target */}
            <div ref={loadMoreRef} className="py-6 flex justify-center">
              {loadingMore ? (
                <div className="text-white">Loading more photos...</div>
              ) : hasMore ? (
                <Button
                  onClick={loadMorePhotos}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Load More
                </Button>
              ) : (
                <div className="text-white/60 text-sm">
                  You've reached the end of your gallery
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;