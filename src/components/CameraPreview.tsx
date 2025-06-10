
import { forwardRef } from 'react';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedTwibonId: number | null;
  selectedTwibonUrl: string;
  isCapturing: boolean;
  isCameraReady: boolean;
  facingMode: 'user' | 'environment';
}

const CameraPreview = forwardRef<HTMLDivElement, CameraPreviewProps>(
  ({ videoRef, selectedTwibonId, selectedTwibonUrl, isCapturing, isCameraReady, facingMode }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative bg-black rounded-xl overflow-hidden shadow-2xl transition-transform duration-200 aspect-[9/16] ${
          isCapturing ? 'scale-95' : 'scale-100'
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraReady ? 'opacity-100' : 'opacity-0'
          } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Loading indicator */}
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-lg">Loading camera...</div>
          </div>
        )}
        
        {/* Twibon Overlay - never flip the twibon */}
        {selectedTwibonId && selectedTwibonUrl && isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={selectedTwibonUrl}
              alt="Twibon frame"
              data-twibon={selectedTwibonId}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Capture Flash Effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-pulse opacity-50" />
        )}
        
        {/* Camera Guidelines */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 border-2 border-white/30 rounded-full" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

CameraPreview.displayName = 'CameraPreview';

export default CameraPreview;
