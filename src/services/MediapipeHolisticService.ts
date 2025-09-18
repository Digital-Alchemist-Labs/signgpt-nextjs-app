"use client";

import type * as holistic from "@mediapipe/holistic";

/**
 * MediaPipe Holistic Service - Exact port from original translate project
 * Handles loading and providing access to MediaPipe Holistic library
 */
export class MediapipeHolisticService {
  private importPromise: Promise<typeof holistic> | null = null;
  private holistic: typeof holistic | null = null;

  async load(): Promise<typeof holistic> {
    if (!this.importPromise) {
      this.importPromise = this.loadMediaPipe();
    }

    return this.importPromise;
  }

  private async loadMediaPipe(): Promise<typeof holistic> {
    try {
      // Dynamic import of MediaPipe Holistic
      const holisticModule = await import("@mediapipe/holistic");
      this.holistic = holisticModule.default || holisticModule;
      console.log("MediaPipe Holistic loaded successfully");
      return this.holistic;
    } catch (error) {
      console.error("Failed to load MediaPipe Holistic:", error);
      throw error;
    }
  }

  get Holistic() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.Holistic;
  }

  get POSE_LANDMARKS() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.POSE_LANDMARKS;
  }

  get POSE_CONNECTIONS() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.POSE_CONNECTIONS;
  }

  get HAND_CONNECTIONS() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.HAND_CONNECTIONS;
  }

  get FACEMESH_TESSELATION() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_TESSELATION;
  }

  get FACEMESH_RIGHT_EYE() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_RIGHT_EYE;
  }

  get FACEMESH_RIGHT_EYEBROW() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_RIGHT_EYEBROW;
  }

  get FACEMESH_LEFT_EYE() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_LEFT_EYE;
  }

  get FACEMESH_LEFT_EYEBROW() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_LEFT_EYEBROW;
  }

  get FACEMESH_FACE_OVAL() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_FACE_OVAL;
  }

  get FACEMESH_LIPS() {
    if (!this.holistic) {
      throw new Error("MediaPipe Holistic not loaded. Call load() first.");
    }
    return this.holistic.FACEMESH_LIPS;
  }
}
