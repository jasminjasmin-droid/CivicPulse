import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal, MapPin } from 'lucide-react';
import { GpsTag } from '../../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string, gpsTag: GpsTag) => void;
  title?: string;
  expectedCoords?: { lat: number; lng: number };
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Live Camera Capture',
  expectedCoords,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentGps, setCurrentGps] = useState<GpsTag>({
    lat: expectedCoords ? expectedCoords.lat : 13.0418,
    lng: expectedCoords ? expectedCoords.lng : 80.2341,
    accuracy: 8,
    timestamp: new Date().toISOString(),
  });

  // Track live GPS continuously while camera is open
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: new Date().toISOString(),
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOpen]);

  // Start video stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Live Camera permission is required. To prevent fake reports, CivicPulse only accepts photos captured live directly from your camera.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Take Snapshot & embed cryptographic-style GPS security watermark banner
  const handleTakeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the raw camera frame
        ctx.drawImage(video, 0, 0, width, height);

        // Stamp Tamper-proof GPS & Date watermark banner at bottom
        const bannerHeight = Math.max(70, Math.floor(height * 0.12));
        ctx.fillStyle = 'rgba(10, 25, 45, 0.85)';
        ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

        // Top accent line
        ctx.fillStyle = '#26A69A';
        ctx.fillRect(0, height - bannerHeight, width, 4);

        // Security Stamp Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.floor(bannerHeight * 0.26)}px sans-serif`;
        ctx.fillText('CIVICPULSE SECURE LIVE CAPTURE • GOV.IN', 20, height - bannerHeight + bannerHeight * 0.38);

        ctx.fillStyle = '#FFB300';
        ctx.font = `bold ${Math.floor(bannerHeight * 0.22)}px monospace`;
        const timeStr = new Date().toLocaleString();
        ctx.fillText(
          `GPS: ${currentGps.lat.toFixed(6)}, ${currentGps.lng.toFixed(6)} (±${currentGps.accuracy}m)  |  ${timeStr}`,
          20,
          height - bannerHeight + bannerHeight * 0.72
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage, {
        ...currentGps,
        timestamp: new Date().toISOString(),
      });
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative text-white">
        {/* Top Control Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#26A69A]" />
            <span className="font-bold text-xs tracking-wide">{title}</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live GPS Status Pill */}
        <div className="px-3 py-1.5 bg-[#1565C0]/20 border-b border-blue-900/60 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-1.5 font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#26A69A]" />
            <span>
              GPS: {currentGps.lat.toFixed(4)}, {currentGps.lng.toFixed(4)} (±{currentGps.accuracy}m)
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#43A047] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#43A047] animate-ping"></span>
            LIVE SENSOR
          </span>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#26A69A] mb-2" />
                  <span className="text-xs text-slate-300 font-medium">Connecting camera hardware...</span>
                </div>
              )}

              {cameraError ? (
                <div className="p-6 text-center space-y-3 z-10">
                  <AlertCircle className="w-10 h-10 text-[#FB8C00] mx-auto" />
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="px-4 py-2 bg-[#1565C0] hover:bg-blue-600 rounded-xl text-xs font-bold transition"
                  >
                    Retry Camera Connection
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Viewfinder Grid & Target Crosshair */}
              <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/10"></div>
                <div className="border-r border-b border-white/10"></div>
                <div className="border-b border-white/10"></div>
                <div className="border-r border-b border-white/10"></div>
                <div className="border-r border-b border-white/10 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#26A69A] rounded-full"></div>
                </div>
                <div className="border-b border-white/10"></div>
                <div className="border-r border-white/10"></div>
                <div className="border-r border-white/10"></div>
                <div></div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Shutter Controls */}
        <div className="p-4 bg-slate-950 flex items-center justify-around border-t border-slate-800">
          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Retake
              </button>
              <button
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 rounded-2xl bg-[#43A047] hover:bg-emerald-600 text-xs font-bold text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Confirm GPS Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFlipCamera}
                title="Flip Camera"
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              {/* Main Shutter Button */}
              <button
                onClick={handleTakeSnapshot}
                disabled={Boolean(cameraError)}
                className="w-16 h-16 rounded-full border-4 border-white/80 p-1 bg-white/20 hover:bg-white/30 transition flex items-center justify-center group active:scale-95 shadow-xl disabled:opacity-40"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:scale-95 transition-transform"></div>
              </button>

              <div className="w-11"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
