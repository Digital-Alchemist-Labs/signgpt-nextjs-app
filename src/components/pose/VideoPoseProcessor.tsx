"use client";

import React, { useRef, useCallback, useState } from "react";
import { usePose } from "@/contexts/PoseContext";
import { PoseViewer } from "./PoseViewer";
import { EstimatedPose } from "@/services/PoseService";

export interface VideoPoseProcessorProps {
  className?: string;
  showPoseViewer?: boolean;
  onPoseDetected?: (pose: EstimatedPose) => void;
}

export const VideoPoseProcessor: React.FC<VideoPoseProcessorProps> = ({
  className = "",
  showPoseViewer = true,
  onPoseDetected,
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

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

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

      setStream(mediaStream);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  }, [state.isLoaded, loadModel]);

  const stopCamera = useCallback(() => {
    // Stop media stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    // Safely clean up video element
    if (videoRef.current) {
      // Pause video before removing source to prevent AbortError
      videoRef.current.pause();

      // Wait for pause to complete before cleaning up
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.load(); // Reset video element
        }
      }, 10);
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

  // Cleanup effect for pose detection
  React.useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isRecording) {
      cleanup = startPoseDetection();
    }

    return cleanup;
  }, [isRecording, startPoseDetection]);

  // Cleanup effect for component unmount
  React.useEffect(() => {
    return () => {
      // Clean up when component unmounts
      stopCamera();
    };
  }, [stopCamera]);

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
          data-sign-text={isRecording ? "stop camera" : "start camera"}
          data-sign-category="button"
          data-sign-description="Toggle video camera for pose processing"
          aria-label={isRecording ? "Stop camera" : "Start camera"}
        >
          {isRecording ? "Stop Camera" : "Start Camera"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={state.isProcessing}
          data-sign-text="load video"
          data-sign-category="button"
          data-sign-description="Load video file for pose processing"
          aria-label="Load video file"
        >
          Load Video File
        </button>

        <button
          onClick={processCurrentFrame}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={state.isProcessing || !videoRef.current}
          data-sign-text="process frame"
          data-sign-category="button"
          data-sign-description="Process current video frame for pose detection"
          aria-label="Process frame"
        >
          Process Frame
        </button>

        <button
          onClick={clearPose}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          data-sign-text="clear"
          data-sign-category="button"
          data-sign-description="Clear pose detection results"
          aria-label="Clear pose"
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
        data-sign-text="video file input"
        data-sign-category="input"
        data-sign-description="Hidden file input for video upload"
        aria-label="Video file input"
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
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Pose Estimation
          </h3>
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
