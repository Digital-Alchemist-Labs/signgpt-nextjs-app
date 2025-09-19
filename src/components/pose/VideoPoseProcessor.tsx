"use client";

import React, { useRef, useCallback, useState } from "react";
import { usePose } from "@/contexts/PoseContext";
import { PoseViewer } from "./PoseViewer";
import { EstimatedPose } from "@/services/PoseService";

export interface VideoPoseProcessorProps {
  className?: string;
  showPoseViewer?: boolean;
  onPoseDetected?: (pose: EstimatedPose) => void;
  autoStart?: boolean;
}

export const VideoPoseProcessor: React.FC<VideoPoseProcessorProps> = ({
  className = "",
  showPoseViewer = true,
  onPoseDetected,
  autoStart = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { state, loadModel, processPoseFromVideo, clearPose } = usePose();

  const startCamera = useCallback(async () => {
    try {
      if (!state.isLoaded) {
        await loadModel();
      }

      const tryGetStream = async (): Promise<MediaStream> => {
        const attempts: MediaStreamConstraints[] = [
          { video: { facingMode: "user" }, audio: false },
          { video: true, audio: false },
          {
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          },
          { video: { width: 320, height: 240 }, audio: false },
        ];
        let lastError: unknown;
        for (const constraints of attempts) {
          try {
            // eslint-disable-next-line no-await-in-loop
            return await navigator.mediaDevices.getUserMedia(constraints);
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError;
      };

      const mediaStream = await tryGetStream();

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start camera:", error);
      const err = error as { name?: string; message?: string };
      let hint = "Failed to access camera.";
      switch (err?.name) {
        case "NotAllowedError":
        case "SecurityError":
          hint =
            "Camera access is blocked. Check browser site settings for this page and macOS System Settings > Privacy & Security > Camera.";
          break;
        case "NotFoundError":
          hint =
            "No camera found. Ensure a camera is connected and not in use by another app.";
          break;
        case "NotReadableError":
          hint =
            "Camera is busy. Close other apps (Zoom/Meet/Teams) using the camera and try again.";
          break;
        default:
          hint = err?.message || hint;
      }
      alert(hint);
    }
  }, [state.isLoaded, loadModel]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRecording(false);
    clearPose();
  }, [stream, clearPose]);

  const processCurrentFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) return;

    try {
      await processPoseFromVideo(video);

      if (onPoseDetected && state.currentPose) {
        onPoseDetected(state.currentPose);
      }
    } catch (error) {
      console.error("Failed to process pose:", error);
    }
  }, [processPoseFromVideo, onPoseDetected, state.currentPose]);

  const startPoseDetection = useCallback(() => {
    if (!isRecording) return;

    const interval = setInterval(processCurrentFrame, 100); // Process every 100ms

    return () => clearInterval(interval);
  }, [isRecording, processCurrentFrame]);

  const loadVideoFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);

    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("video/")) {
        loadVideoFile(file);
      }
    },
    [loadVideoFile]
  );

  const handleVideoLoadedData = useCallback(() => {
    if (videoRef.current) {
      processCurrentFrame();
    }
  }, [processCurrentFrame]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current && !isRecording) {
      processCurrentFrame();
    }
  }, [processCurrentFrame, isRecording]);

  React.useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isRecording) {
      cleanup = startPoseDetection();
    }

    return cleanup;
  }, [isRecording, startPoseDetection]);

  // Auto-start camera on mount when requested
  React.useEffect(() => {
    let stopped = false;
    const open = async () => {
      if (autoStart && !isRecording) {
        try {
          await startCamera();
        } catch (e) {
          console.error("Auto-start camera failed:", e);
        }
      }
    };
    void open();
    return () => {
      if (!stopped && isRecording) {
        stopCamera();
        stopped = true;
      }
    };
  }, [autoStart, isRecording, startCamera, stopCamera]);

  return (
    <div className={`video-pose-processor ${className}`}>
      <div className="controls mb-4 flex gap-2 flex-wrap">
        <button
          onClick={isRecording ? stopCamera : startCamera}
          className={`px-4 py-2 rounded ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          disabled={state.isProcessing}
        >
          {isRecording ? "Stop Camera" : "Start Camera"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={state.isProcessing}
        >
          Load Video File
        </button>

        <button
          onClick={processCurrentFrame}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={state.isProcessing || !videoRef.current}
        >
          Process Frame
        </button>

        <button
          onClick={clearPose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Pose
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="video-container mb-4">
        <video
          ref={videoRef}
          className="w-full max-w-md border rounded"
          controls={!isRecording}
          muted
          playsInline
          onLoadedData={handleVideoLoadedData}
          onTimeUpdate={handleVideoTimeUpdate}
        />
      </div>

      {showPoseViewer && (
        <div className="pose-viewer-container">
          <h3 className="text-lg font-semibold mb-2">Pose Estimation</h3>
          <PoseViewer className="w-full h-96" showControls={true} loop={true} />
        </div>
      )}

      {state.error && (
        <div className="error-message mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {state.error}
        </div>
      )}

      <div className="status mt-2 text-sm text-gray-600">
        Status: {state.isLoaded ? "Model Loaded" : "Model Not Loaded"} |
        {state.isProcessing ? " Processing..." : " Ready"} |
        {state.currentPose ? " Pose Detected" : " No Pose"}
      </div>
    </div>
  );
};

export default VideoPoseProcessor;
