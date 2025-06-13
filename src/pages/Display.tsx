import { useEffect, useRef, useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';


const Display = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { allPhotos: photos, loading } = usePhotos();
    const [columnCount, setColumnCount] = useState(6); // Default column count


    // Handle responsive column count
    useEffect(() => {
        const updateColumnCount = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setColumnCount(2);
            } else if (width < 768) {
                setColumnCount(3);
            } else if (width < 1024) {
                setColumnCount(4);
            } else if (width < 1280) {
                setColumnCount(5);
            } else {
                setColumnCount(6);
            }
        };

        updateColumnCount();
        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, []);


    // Setup animations after photos load
    useEffect(() => {
        if (!containerRef.current || loading) return;

        const columns = Array.from(containerRef.current.children) as HTMLDivElement[];

        // Calculate animation duration based on number of items
        columns.forEach(col => {
            const itemCount = col.children.length;
            const durationPerItem = 3; // seconds per item (adjust as needed)
            const totalDuration = itemCount * durationPerItem;
            col.style.animationDuration = `${totalDuration}s`;
        });
    }, [photos, loading, columnCount]);

    // Distribute photos into columns based on current columnCount
    const columns = Array.from({ length: columnCount }, (_, colIndex) => (
        photos.filter((_, index) => index % columnCount === colIndex)
    ));

    if (loading && photos.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <div className="text-white text-lg">Loading photos...</div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-900 overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-screen flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-2 sm:px-3 md:px-4 lg:px-5 py-10 box-border"
            >
                {columns.map((columnPhotos, index) => (
                    <div
                        key={index}
                        className={`flex-1 flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5 ${index % 2 === 1 ? 'animate-[scroll-vertical-reverse_40s_linear_infinite]' :
                            'animate-[scroll-vertical_40s_linear_infinite]'
                            }`}
                    >
                        {columnPhotos.map((photo) => (
                            <div key={photo.id} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-gray-800 relative group">
                                <img
                                    src={photo.url}
                                    alt={`Photo ${photo.id}`}
                                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                    loading="lazy"
                                />
                                {/* Twibbon overlay if exists */}
                                {photo.twibbons && photo.twibbon_id && (
                                    <div className="absolute inset-0">
                                        <img
                                            src={photo.twibbons.url}
                                            alt={photo.twibbons.name}
                                            className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Duplicate items for seamless looping */}
                        {columnPhotos.map((photo) => (
                            <div key={`duplicate-${photo.id}`} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-gray-800 relative group">
                                <img
                                    src={photo.url}
                                    alt={`Photo ${photo.id}`}
                                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                    loading="lazy"
                                />
                                {photo.twibbons && photo.twibbon_id && (
                                    <div className="absolute inset-0">
                                        <img
                                            src={photo.twibbons.url}
                                            alt={photo.twibbons.name}
                                            className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* add overlay dark */}
            <div className="absolute inset-0 bg-black opacity-30"></div>


            <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
                <img
                    src="/public/logo-r17group-text-white.png" // change to your actual logo path
                    alt="Overlay Logo"
                    className="w-40 md:w-64 lg:w-72"
                />
            </div>

            {/* Add custom animation to Tailwind config */}
            <style jsx global>{`
        @keyframes scroll-vertical {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @keyframes scroll-vertical-reverse {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0);
          }
        }
        body {
          overflow: hidden;
          touch-action: none;
        }
      `}</style>
        </div>
    );
};

export default Display;