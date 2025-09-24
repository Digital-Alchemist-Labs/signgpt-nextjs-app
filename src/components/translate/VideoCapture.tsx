"use client";

import { useRef, useEffect, useState } from "react";
// import { useTranslation } from "react-i18next"; // Unused for now
// import { useSettings } from "@/contexts/SettingsContext"; // Unused for now
import { useTranslation as useTranslationState } from "@/contexts/TranslationContext";
import { Camera, CameraOff, Play, Square } from "lucide-react"; // Pause unused for now

export default function VideoCapture() {
  // const { t } = useTranslation(); // Unused for now
  // const { settings } = useSettings(); // Unused for now
  const { state } = useTranslationState(); // setPose, setIsSigning, setSigningProbability unused for now
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStreaming && videoRef.current) {
      startVideoStream();
    }
    return () => {
      stopVideoStream();
    };
  }, [isStreaming]);

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Safely play video with error handling
        try {
          // Check if video element is still in DOM before playing
          if (videoRef.current && document.contains(videoRef.current)) {
            await videoRef.current.play();
          }
        } catch (playError) {
          // Ignore AbortError when component is unmounting
          if ((playError as Error).name !== "AbortError") {
            console.error("Video play failed:", playError);
          }
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());

      // Safely clean up video element
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Reset video element
    }
  };

  const handleStartCapture = () => {
    setIsStreaming(true);
    setError(null);
  };

  const handleStopCapture = () => {
    setIsStreaming(false);
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement recording logic
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Implement stop recording logic
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          data-sign-text="video"
          data-sign-category="media"
          data-sign-description="Live video capture for sign language input"
          aria-label="Video capture area"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: "none" }}
        />

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p>Camera not active</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
            <div className="text-center text-red-500">
              <CameraOff className="h-12 w-12 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        {!isStreaming ? (
          <button
            onClick={handleStartCapture}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            data-sign-text="start camera"
            data-sign-category="button"
            data-sign-description="Start video camera for sign language input"
            aria-label="Start camera"
          >
            <Camera className="h-5 w-5" />
            <span>Start Camera</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleStopCapture}
              className="flex items-center space-x-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              data-sign-text="stop camera"
              data-sign-category="button"
              data-sign-description="Stop video camera"
              aria-label="Stop camera"
            >
              <CameraOff className="h-5 w-5" />
              <span>Stop Camera</span>
            </button>

            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                data-sign-text="record"
                data-sign-category="button"
                data-sign-description="Start recording sign language video"
                aria-label="Start recording"
              >
                <Play className="h-5 w-5" />
                <span>Record</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                data-sign-text="stop recording"
                data-sign-category="button"
                data-sign-description="Stop recording sign language video"
                aria-label="Stop recording"
              >
                <Square className="h-5 w-5" />
                <span>Stop</span>
              </button>
            )}
          </>
        )}
      </div>

      {state.isSigning && (
        <div className="text-center text-green-600 font-medium">
          Detected signing ({(state.signingProbability * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
}
