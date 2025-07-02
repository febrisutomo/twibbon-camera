
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePhotos } from '@/hooks/usePhotos';
import { useTwibbons } from '@/hooks/useTwibbons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Images } from 'lucide-react';

const Index = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedTwibonId, setSelectedTwibonId] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { savePhoto } = usePhotos();
  const { twibbons } = useTwibbons();

  useEffect(() => {
    if (twibbons.length > 0) {
      setSelectedTwibonId(twibbons[0].id);
    }
  }, [twibbons]);

  const selectedTwibon = twibbons.find(t => t.id === selectedTwibonId);


  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera with facing mode:', facingMode);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCameraReady(false);
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('Camera stream obtained successfully');
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [facingMode, toast]);

  useEffect(() => {
    startCamera();

    return () => {
      console.log('Cleaning up camera stream');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas to 16:9 portrait aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 9 / 16;

    let sourceWidth, sourceHeight, sourceX, sourceY;

    if (videoAspect > targetAspect) {
      // Video is wider than target, crop horizontally
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // Video is taller than target, crop vertically
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspect;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas dimensions to maintain 16:9 portrait
    const canvasHeight = 1920; // HD height
    const canvasWidth = canvasHeight * targetAspect; // 1080
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // If using front camera, flip the canvas horizontally for the photo only
    if (facingMode === 'user') {
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
    }

    // Draw video frame (cropped to 16:9 portrait)
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);

    // Reset transformation for twibon overlay
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw twibon overlay if selected (never flip the twibon)
    if (selectedTwibon) {

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await savePhoto(blob, selectedTwibonId || undefined);

            toast({
              title: "Photo Captured!",
              description: "Your photo has been saved.",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to save photo. Please try again.",
              variant: "destructive",
            });
          }

          setTimeout(() => setIsCapturing(false), 200);
        }
      }, 'image/jpeg', 0.9);
    } else {
      // No twibon, just save the photo
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await savePhoto(blob);

            toast({
              title: "Photo Captured!",
              description: "Your photo has been saved.",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to save photo. Please try again.",
              variant: "destructive",
            });
          }

          setTimeout(() => setIsCapturing(false), 200);
        }
      }, 'image/jpeg', 0.9);
    }
  }, [selectedTwibon, selectedTwibonId, toast, isCameraReady, savePhoto, facingMode]);

  const switchCamera = () => {
    console.log('Switching camera');
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      <div className="relative container h-full px-4 py-4">

        {/* Camera Preview */}
        <div
          className={`relative mx-auto max-h-full bg-black rounded-xl overflow-hidden shadow-2xl transition-transform duration-200 aspect-[9/16] ${isCapturing ? 'scale-95' : 'scale-100'
            }`}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Loading indicator */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-lg">Loading camera...</div>
            </div>
          )}

          {/* Twibon Overlay - never flip the twibon */}
          {selectedTwibonId && selectedTwibon?.url && isCameraReady && (
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={selectedTwibon?.url}
                alt="Twibon frame"
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

        <canvas ref={canvasRef} className="hidden" />

        {/* Twibon Selector yang menindih dari bawah */}
        <div className="absolute bottom-0 left-0 right-0 z-10">


          <div className="flex items-center justify-between px-4 py-4">
            {/* Flip Button (Left) */}
            <a href="/gallery">
              <Button
                variant="secondary"
                className="bg-white/20 text-white border-0 hover:bg-white/30 rounded-full w-8 h-8 p-0 flex items-center justify-center"
              >
                <Images className="w-4 h-4" />
              </Button>
            </a>

            {/* Center Circle with Camera Icon - Capture Photo Button */}
            <Button
              onClick={capturePhoto}
              variant="secondary"
              className="bg-white rounded-full w-16 h-16 p-0 shadow-lg"
            />

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
    </div>
  );
};

export default Index;

