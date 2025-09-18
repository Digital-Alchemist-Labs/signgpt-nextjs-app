"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  PoseService,
  EstimatedPose,
  HolisticResults,
} from "@/services/PoseService";
import { PoseNormalizationService } from "@/services/PoseNormalizationService";

export interface PoseState {
  isLoaded: boolean;
  isProcessing: boolean;
  currentPose: EstimatedPose | null;
  error: string | null;
}

export interface PoseContextType {
  state: PoseState;
  poseService: PoseService;
  normalizationService: PoseNormalizationService;
  loadModel: () => Promise<void>;
  processPoseFromVideo: (video: HTMLVideoElement) => Promise<void>;
  processPoseFromImage: (image: HTMLImageElement) => Promise<void>;
  drawPoseOnCanvas: (canvas: HTMLCanvasElement, pose?: EstimatedPose) => void;
  clearPose: () => void;
  normalizePose: (
    pose: EstimatedPose,
    components: string[]
  ) => Promise<Array<{ x: number; y: number; z: number }>>;
}

const defaultState: PoseState = {
  isLoaded: false,
  isProcessing: false,
  currentPose: null,
  error: null,
};

const PoseContext = createContext<PoseContextType | undefined>(undefined);

export const usePose = () => {
  const context = useContext(PoseContext);
  if (context === undefined) {
    throw new Error("usePose must be used within a PoseProvider");
  }
  return context;
};

export const PoseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PoseState>(defaultState);
  const poseServiceRef = useRef(new PoseService());
  const normalizationServiceRef = useRef(new PoseNormalizationService());

  const poseService = poseServiceRef.current;
  const normalizationService = normalizationServiceRef.current;

  const loadModel = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoaded: false, error: null }));

      // Set up results callback
      poseService.onResults((results: HolisticResults) => {
        // Create a copy of the canvas to avoid MediaPipe issues
        const canvas = document.createElement("canvas");
        canvas.width = results.image.width;
        canvas.height = results.image.height;
        const ctx = canvas.getContext("2d");
        if (ctx && results.image) {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }

        const pose: EstimatedPose = {
          faceLandmarks: results.faceLandmarks,
          poseLandmarks: results.poseLandmarks,
          leftHandLandmarks: results.leftHandLandmarks,
          rightHandLandmarks: results.rightHandLandmarks,
          image: canvas,
        };

        setState((prev) => ({
          ...prev,
          currentPose: pose,
          isProcessing: false,
        }));
      });

      await poseService.load();
      await normalizationService.initialize();

      setState((prev) => ({ ...prev, isLoaded: true, error: null }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load pose model";
      setState((prev) => ({ ...prev, isLoaded: false, error: errorMessage }));
      throw error;
    }
  }, [poseService, normalizationService]);

  const processPoseFromVideo = useCallback(
    async (video: HTMLVideoElement) => {
      if (!state.isLoaded) {
        await loadModel();
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true, error: null }));
        await poseService.predict(video);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process pose from video";
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [state.isLoaded, loadModel, poseService]
  );

  const processPoseFromImage = useCallback(
    async (image: HTMLImageElement) => {
      if (!state.isLoaded) {
        await loadModel();
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true, error: null }));
        await poseService.predict(image);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process pose from image";
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [state.isLoaded, loadModel, poseService]
  );

  const drawPoseOnCanvas = useCallback(
    (canvas: HTMLCanvasElement, pose?: EstimatedPose) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const poseToRender = pose || state.currentPose;
      if (poseToRender) {
        poseService.draw(poseToRender, ctx);
      }
    },
    [state.currentPose, poseService]
  );

  const clearPose = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPose: null,
      isProcessing: false,
      error: null,
    }));
  }, []);

  const normalizePose = useCallback(
    async (pose: EstimatedPose, components: string[]) => {
      try {
        return poseService.normalizeHolistic(pose, components, true);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to normalize pose";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [poseService]
  );

  const value: PoseContextType = {
    state,
    poseService,
    normalizationService,
    loadModel,
    processPoseFromVideo,
    processPoseFromImage,
    drawPoseOnCanvas,
    clearPose,
    normalizePose,
  };

  return <PoseContext.Provider value={value}>{children}</PoseContext.Provider>;
};
