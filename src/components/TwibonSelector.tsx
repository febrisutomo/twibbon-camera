import { Button } from '@/components/ui/button';
import { useTwibbons } from '@/hooks/useTwibbons';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TwibonSelectorProps {
  selectedTwibon: number | null;
  onSelectTwibon: (twibonId: number | null) => void;
  takePicture: () => void;
}

const TwibonSelector = ({
  selectedTwibon,
  onSelectTwibon,
  takePicture,
}: TwibonSelectorProps) => {
  const { twibbons, loading } = useTwibbons();
  const containerRef = useRef<HTMLDivElement>(null);

  const twibonItems = [{ id: null, name: 'No Frame' }, ...twibbons];
  const selectedIndex = twibonItems.findIndex((t) => t.id === selectedTwibon);

  useEffect(() => {
    if (containerRef.current) {
      const selected = containerRef.current.querySelector<HTMLDivElement>(
        '[data-selected="true"]'
      );
      if (selected) {
        selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedTwibon]);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl py-4">
        <div className="text-white/60">Loading frames...</div>
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
    <div className="bg-white/10 backdrop-blur-sm rounded-xl py-4 overflow-visible relative">
      <div
        ref={containerRef}
        className="relative flex overflow-x-auto gap-2 snap-x snap-mandatory scroll-smooth px-2"
        style={{ overflowY: 'visible' }}
      >
        {/* Spacer kiri */}
        {selectedIndex === 0 && (
          <>
            <div className="flex-shrink-0 w-[40%]" />
            <div className="flex-shrink-0 w-[20%]" />
          </>
        )}
        {selectedIndex === 1 && <div className="flex-shrink-0 w-[30%]" />}

        {/* Twibon Items */}
        {twibonItems.map((twibon, index) => {
          const isSelected = selectedTwibon === twibon.id;
          const scale = getScale(index);
          const opacity = isSelected ? 1 : 0.3 + scale * 0.7;
          const zIndex = 10 - Math.abs(index - selectedIndex);
          const border = isSelected ? 'border-4 border-purple-500' : '';

          const handleClick = () => {
            if (isSelected) {
              takePicture();
            } else {
              onSelectTwibon(twibon.id);
            }
          };

          return (
            <div
              key={twibon.id ?? 'none'}
              className="snap-center flex-shrink-0 w-[20%]"
              data-selected={isSelected}
              style={{ zIndex }}
            >
              <div
                className="w-full aspect-square relative transition-transform duration-300"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                }}
              >
                <Button
                  onClick={handleClick}
                  variant="ghost"
                  size="icon"
                  className={`absolute inset-0 rounded-full w-full h-full bg-white/20 hover:bg-white/30 ${border}`}
                >
                  {twibon.id === null ? (
                    <X className="w-6 h-6 text-purple-600" />
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

        {/* Spacer kanan */}
        {selectedIndex === twibonItems.length - 1 && (
          <>
            <div className="flex-shrink-0 w-[40%]" />
            <div className="flex-shrink-0 w-[20%]" />
          </>
        )}
        {selectedIndex === twibonItems.length - 2 && <div className="flex-shrink-0 w-[30%]" />}
      </div>

      {/* Selected Name */}
      <div className="text-center text-white mt-3 text-sm font-medium">
        {twibonItems[selectedIndex]?.name}
      </div>
    </div>
  );
};

export default TwibonSelector;
