import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePhotos, type Photo } from '@/hooks/usePhotos';
import { AspectRatio } from "@/components/ui/aspect-ratio";

const PublicGallery = () => {
  const {
    photos,
    loading,
    loadingMore,
    hasMore,
    loadMorePhotos
  } = usePhotos();
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Photo Gallery</h1>
          <div className="text-white/80 text-sm">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
            {hasMore && '+'}
          </div>
        </div>

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
                  <AspectRatio ratio={9 / 16}>
                    <img
                      src={photo.url}
                      alt={`Photo ${photo.id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </AspectRatio>
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-white/80 text-sm">{formatDate(photo.created_at)}</p>
                    <Button
                      onClick={() => downloadPhoto(photo)}
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 text-white border-0 hover:bg-white/30"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

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

export default PublicGallery;
