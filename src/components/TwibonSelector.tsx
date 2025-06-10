import { Button } from '@/components/ui/button';
import { useTwibbons } from '@/hooks/useTwibbons';
import { RefreshCcw, Images } from 'lucide-react';
import { useEffect, useRef, useState} from 'react';
import { Link } from 'react-router-dom';

interface TwibonSelectorProps {
  selectedTwibon: number | null;
  onSelectTwibon: (twibonId: number | null) => void;
  onSelectActiveTwibon: () => void;
  switchCamera: () => void;
  isCameraReady: boolean;
}

const TwibonSelector = ({
  selectedTwibon,
  onSelectTwibon,
  onSelectActiveTwibon,
  switchCamera,
  isCameraReady
}: TwibonSelectorProps) => {
  const { twibbons, loading } = useTwibbons();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const twibonItems = [{ id: null, name: 'No Frame' }, ...twibbons];
  const selectedIndex = twibonItems.findIndex((t) => t.id === selectedTwibon);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);



  useEffect(() => {
    if (containerRef.current && selectedIndex !== -1) {
      const itemWidth = containerRef.current.offsetWidth / 5; // Assuming 5 visible items
      const scrollPosition = selectedIndex * itemWidth - containerWidth / 2 + itemWidth / 2;

      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [selectedIndex, containerWidth]);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl py-4">
        <div className="text-white/60 text-center">Loading frames...</div>
      </div>
    );
  }

  const getScale = (index: number) => {
    const distance = Math.abs(index - selectedIndex);
    const maxScale = 1;
    const minScale = 0.5;
    const scale = maxScale - distance * 0.2;
    return Math.max(scale, minScale);
  };

  return (
    <div className="relative">
      {/* Scrollable slider container */}
      <div className="py-4 overflow-visible relative">
        <style>{`
          .scroll-hidden::-webkit-scrollbar {
            display: none;
          }
          .scroll-hidden {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>

        {/* Ring indicator for active item */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-purple-500" />
        </div>

        <div
          ref={containerRef}
          className="scroll-hidden relative flex overflow-x-auto gap-2 snap-x snap-mandatory scroll-smooth px-2"
          style={{ overflowY: 'visible' }}
        >
          {/* Left padding to help center first items */}
          <div className="flex-shrink-0" style={{ width: `calc(50% - 2.5rem)` }} />

          {/* Twibon Items */}
          {twibonItems.map((twibon, index) => {
            const isSelected = selectedTwibon === twibon.id;
            const scale = getScale(index);

            const handleClick = () => {
              if (isSelected) {
                onSelectActiveTwibon();
              } else {
                onSelectTwibon(twibon.id);
              }
            };

            return (
              <div
                key={twibon.id ?? 'none'}
                className="snap-center flex-shrink-0 w-16 sm:w-20" // Fixed width for items
                data-selected={isSelected}
              >
                <div
                  className="w-full aspect-square relative transition-transform duration-300"
                  style={{
                    transform: `scale(${scale})`,
                  }}
                >
                  <Button
                    onClick={handleClick}
                    variant="ghost"
                    size="icon"
                    className="absolute inset-0 rounded-full w-full h-full bg-white/20 hover:bg-white/30"
                  >
                    {twibon.id === null ? (
                      <div className="w-full h-full bg-white rounded-full" />
                    ) : (
                      <img
                        src={twibon.url}
                        alt={twibon.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Right padding to help center last items */}
          <div className="flex-shrink-0" style={{ width: `calc(50% - 2.5rem)` }} />
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mt-3">
          {/* Flip Button (Left) */}
          <Link to="/gallery">
            <Button
              variant="secondary"
              className="bg-white/20 text-white border-0 hover:bg-white/30 rounded-full w-8 h-8 p-0 flex items-center justify-center"
            >
              <Images className="w-4 h-4" />
            </Button>
          </Link>

          {/* Label (Full Width) */}
          <div className="flex-1 mx-2">
            <div className="bg-black/30 text-white text-sm font-medium px-4 py-2 rounded-full text-center truncate max-w-[calc(100%-64px)] mx-auto">
              {twibonItems[selectedIndex]?.name}
            </div>
          </div>

          {/* Camera Switch Button (Right) */}
          <Button
            onClick={switchCamera}
            variant="secondary"
            className="bg-white/20 text-white border-0 hover:bg-white/30 rounded-full w-8 h-8 p-0 flex items-center justify-center"
            disabled={!isCameraReady}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TwibonSelector;