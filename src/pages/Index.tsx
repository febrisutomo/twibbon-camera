
import { useState, useRef, useCallback, useEffect } from 'react';
import TwibonSelector from '@/components/TwibonSelector';
import CameraPreview from '@/components/CameraPreview';
import { useToast } from '@/hooks/use-toast';
import { usePhotos } from '@/hooks/usePhotos';
import { useTwibbons } from '@/hooks/useTwibbons';

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
      const twibonImg = new Image();
      twibonImg.crossOrigin = 'anonymous';
      twibonImg.onload = () => {
        ctx.drawImage(twibonImg, 0, 0, canvas.width, canvas.height);

        // Convert to blob and save
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
      };
      twibonImg.src = selectedTwibon.url;
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
    <div className="h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container h-full mx-auto px-4 py-4 max-w-md">

        <div className="relative h-full">
          {/* Camera Preview */}
          {/* Camera Preview dengan margin bottom untuk memberi ruang selector */}
          <div className="relative">
            <CameraPreview
              videoRef={videoRef}
              selectedTwibonId={selectedTwibonId}
              selectedTwibonUrl={selectedTwibon?.url || ''}
              isCapturing={isCapturing}
              isCameraReady={isCameraReady}
              facingMode={facingMode}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Twibon Selector yang menindih dari bawah */}


          <div className="absolute bottom-0 left-0 right-0 z-10">
            <TwibonSelector
              selectedTwibon={selectedTwibonId}
              onSelectTwibon={setSelectedTwibonId}
              onSelectActiveTwibon={capturePhoto}
              switchCamera={switchCamera}
              isCameraReady={isCameraReady}
            />
          </div>
        </div>



      </div>
    </div>
  );
};

export default Index;
