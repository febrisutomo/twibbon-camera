import { Button } from '@/components/ui/button';
import { useTwibbons } from '@/hooks/useTwibbons';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TwibonSelectorProps {
  selectedTwibon: number | null;
  onSelectTwibon: (twibonId: number | null) => void;
  takePicture: () => void;
}

const TwibonSelector = ({ selectedTwibon, onSelectTwibon, takePicture }: TwibonSelectorProps) => {
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

  const getSize = (index: number) => {
    const distance = Math.abs(index - selectedIndex);
    switch (distance) {
      case 0:
        return 80;
      case 1:
        return 64;
      case 2:
        return 52;
      default:
        return 44;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl py-4 overflow-visible relative">
      <div
        ref={containerRef}
        className="relative flex overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth px-4"
        style={{ overflowY: 'visible' }}
      >
        {/* Spacer kiri */}
        {selectedIndex === 0 && (
          <>
            <div className="flex-shrink-0 w-[80px]" />
            <div className="flex-shrink-0 w-[40px]" />
          </>
        )}
        {selectedIndex === 1 && <div className="flex-shrink-0 w-[60px]" />}

        {/* Twibon Items */}
        {twibonItems.map((twibon, index) => {
          const isSelected = selectedTwibon === twibon.id;
          const size = getSize(index);
          const border = isSelected ? 'border-4 border-purple-500' : 'border border-white/30';
          const zIndex = 10 - Math.abs(index - selectedIndex);
          const opacity = isSelected ? 1 : 0.4;

          return (
            <div
              key={twibon.id ?? 'none'}
              className="snap-center flex-shrink-0"
              data-selected={isSelected}
              style={{ width: size, zIndex }}
            >
              <div
                className="relative transition-all duration-300"
                style={{ width: size, height: size, opacity }}
              >
                <Button
                  onClick={() =>
                    isSelected ? takePicture() : onSelectTwibon(twibon.id)
                  }
                  variant="ghost"
                  size="icon"
                  className={`absolute inset-0 rounded-full w-full h-full bg-white/20 hover:bg-white/30 ${border}`}
                >
                  {twibon.id === null ? (
                    <X className="w-5 h-5 text-purple-600" />
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
            <div className="flex-shrink-0 w-[80px]" />
            <div className="flex-shrink-0 w-[40px]" />
          </>
        )}
        {selectedIndex === twibonItems.length - 2 && <div className="flex-shrink-0 w-[60px]" />}
      </div>

      {/* Selected Name */}
      <div className="text-center text-white mt-3 text-sm font-medium">
        {twibonItems[selectedIndex]?.name}
      </div>
    </div>
  );
};

export default TwibonSelector;
