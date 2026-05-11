import { useEffect, useRef, useState } from 'react';
import { useDisplayPhotos } from '@/hooks/useDisplayPhotos';
import Splide from '@splidejs/splide';
import '@splidejs/splide/css';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';

const Display = () => {
    const { photos, loading } = useDisplayPhotos();
    const [columnCount, setColumnCount] = useState(6);
    const splideRefs = useRef<(Splide | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive column count with debounced resize
    useEffect(() => {
        const getColumnCount = (width: number) => {
            if (width < 640) return 2;
            if (width < 768) return 3;
            if (width < 1024) return 4;
            if (width < 1280) return 5;
            return 6;
        };

        setColumnCount(getColumnCount(window.innerWidth));

        let timeoutId: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setColumnCount(getColumnCount(window.innerWidth));
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    // Initialize Splide sliders
    useEffect(() => {
        if (loading || !containerRef.current || photos.length === 0) return;

        const initializeSliders = () => {
            splideRefs.current.forEach(splide => splide?.destroy());
            splideRefs.current = [];

            const columns = containerRef.current?.querySelectorAll<HTMLElement>('.splide-column');
            if (!columns) return;

            const scrollSpeed = 0.5;

            columns.forEach((column, index) => {
                const isEven = index % 2 === 0;
                const splide = new Splide(column, {
                    direction: 'ttb',
                    type: 'loop',
                    drag: false,
                    arrows: false,
                    pagination: false,
                    height: 'auto',
                    autoWidth: false,
                    autoHeight: true,
                    gap: '1rem',
                    wheel: false,
                    autoScroll: {
                        speed: isEven ? scrollSpeed : -scrollSpeed,
                        pauseOnHover: false,
                        pauseOnFocus: false,
                    },
                });

                splide.mount({ AutoScroll });
                splideRefs.current.push(splide);
            });
        };

        const timeoutId = setTimeout(initializeSliders, 100);
        return () => {
            clearTimeout(timeoutId);
            splideRefs.current.forEach(splide => splide?.destroy());
        };
    }, [photos, loading, columnCount]);

    // Distribute photos into columns
    const columns = Array.from({ length: columnCount }, (_, colIndex) =>
        photos.filter((_, i) => i % columnCount === colIndex)
    );

    if (loading && photos.length === 0) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <div className="text-white text-lg">Loading photos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex justify-center items-start overflow-hidden relative">
            <div ref={containerRef} className="w-full h-screen flex gap-3 md:gap-4 lg:gap-5 px-3 md:px-4 lg:px-5 box-border">
                {columns.map((columnPhotos, index) => (
                    <div key={index} className="flex-1 h-full overflow-hidden">
                        <div className="splide splide-column h-full">
                            <div className="splide__track h-full">
                                <ul className="splide__list">
                                    {columnPhotos.map((photo) => (
                                        <li key={`photo-${photo.id}`} className="splide__slide">
                                            <div className="aspect-[9/16] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gray-800">
                                                <img
                                                    src={photo.url}
                                                    alt={`Photo ${photo.id}`}
                                                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pointer-events-none fixed top-0 left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
                <div className="rounded-br-[24px] rounded-bl-[24px] md:rounded-br-[32px] md:rounded-bl-[32px] lg:rounded-br-[42px] lg:rounded-bl-[42px] bg-black p-2 lg:p-4">
                    <img
                        src="/logo-r17group-text-white.png"
                        alt="Overlay Logo"
                        className="w-[240px] md:w-[296px] lg:w-[320px] xl:w-[360px]"
                    />
                </div>
            </div>

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
