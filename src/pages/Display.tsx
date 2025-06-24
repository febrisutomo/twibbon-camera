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
            const durationPerItem = 2; // seconds per item (adjust as needed)
            const totalDuration = itemCount * durationPerItem;
            col.style.animationDuration = `${totalDuration}s`;
            
            // Reset animation to create seamless loop
            col.style.animation = 'none';
            void col.offsetHeight; // Trigger reflow
            col.style.animation = '';
        });
    }, [photos, loading, columnCount]);

    // Distribute photos into columns based on current columnCount
    const columns = Array.from({ length: columnCount }, (_, colIndex) => (
        photos.filter((_, index) => index % columnCount === colIndex)
    ));

    // Duplicate photos in each column to create seamless loop
    const duplicatedColumns = columns.map(columnPhotos => [...columnPhotos, ...columnPhotos]);

    if (loading && photos.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <div className="text-white text-lg">Loading photos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-start overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-screen flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-2 sm:px-3 md:px-4 lg:px-5 py-10 box-border"
            >
                {duplicatedColumns.map((columnPhotos, index) => (
                    <div
                        key={index}
                        className={`flex-1 flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-5 ${
                            index % 2 === 0 
                                ? 'animate-[scroll-up_40s_linear_infinite]' 
                                : 'animate-[scroll-down_40s_linear_infinite]'
                        }`}
                    >
                        {columnPhotos.map((photo, photoIndex) => (
                            <div key={`${photo.id}-${photoIndex}`} className="aspect-[9/16] w-full rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-gray-800 relative group">
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
                    </div>
                ))}
            </div>

            {/* add overlay dark */}
            <div className="absolute inset-0 bg-black opacity-30"></div>

            <div className="pointer-events-none fixed top-0 left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
                <div className="rounded-br-[40px] rounded-bl-[40px] bg-black p-2 lg:p-4">
                    <img
                        src="/logo-r17group-text-white.png"
                        alt="Overlay Logo"
                        className="w-[240px] md:w-[296px] lg:w-[360px]"
                    />
                </div>
            </div>

            {/* add qr code on bottom right */}
            <div className="fixed bottom-4 right-4 z-10 p-2 bg-white">
                <img
                    src="/qr-download.png"
                    alt="QR Code"
                    className="w-16 h-16"
                />
            </div>
        </div>
    );
};

export default Display;