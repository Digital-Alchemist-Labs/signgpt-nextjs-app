"use client";

import { MediapipeHolisticService } from "./MediapipeHolisticService";
import { environment } from "@/config/environment";

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const EMPTY_LANDMARK: PoseLandmark = { x: 0, y: 0, z: 0 };

export interface EstimatedPose {
  faceLandmarks: PoseLandmark[];
  poseLandmarks: PoseLandmark[];
  rightHandLandmarks: PoseLandmark[];
  leftHandLandmarks: PoseLandmark[];
  image: HTMLCanvasElement | HTMLImageElement;
}

export interface HolisticResults extends EstimatedPose {
  image: HTMLCanvasElement | HTMLImageElement;
}

// Constants for ignored body landmarks (from original project)
const IGNORED_BODY_LANDMARKS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22,
];

/**
 * PoseService - Exact port from original translate project
 * Handles MediaPipe Holistic pose estimation and drawing
 */
export class PoseService {
  private holistic = new MediapipeHolisticService();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: unknown = null;

  // loadPromise must be static, in case multiple PoseService instances are created
  private static loadPromise: Promise<void> | null = null;
  private isFirstFrame = true;
  private onResultsCallbacks: Array<(results: HolisticResults) => void> = [];

  onResults(callback: (results: HolisticResults) => void): void {
    this.onResultsCallbacks.push(callback);
  }

  async load(): Promise<void> {
    if (!PoseService.loadPromise) {
      PoseService.loadPromise = this._load();
    }

    // Holistic loading may fail for various reasons.
    // If that fails, show an error for further investigation.
    try {
      await PoseService.loadPromise;
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Pose estimation model loading failed: ${errorMessage}`);
    }
  }

  private async _load(): Promise<void> {
    if (this.model) {
      return;
    }

    try {
      // Load the MediaPipe Holistic module
      const holisticModule = await this.holistic.load();
      console.log("MediaPipe module loaded:", holisticModule);

      // Create the Holistic instance with proper configuration
      this.model = new this.holistic.Holistic({
        locateFile: (file: string) => {
          // Use the MediaPipe CDN or local files
          const basePath = `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/`;
          console.log(`Loading MediaPipe file: ${basePath}${file}`);
          return `${basePath}${file}`;
        },
      });

      console.log("MediaPipe Holistic model created successfully");
    } catch (error) {
      console.error("Failed to create MediaPipe Holistic model:", error);
      throw error;
    }

    (
      this.model as { setOptions: (options: Record<string, unknown>) => void }
    ).setOptions({
      upperBodyOnly: false,
      modelComplexity: 1,
    });

    await (this.model as { initialize: () => Promise<void> }).initialize();

    // Send an empty frame, to force the mediapipe computation graph to load
    const frame = document.createElement("canvas");
    frame.width = 256;
    frame.height = 256;
    await (
      this.model as {
        send: (data: {
          image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
        }) => Promise<void>;
      }
    ).send({ image: frame });
    frame.remove();

    // Track following results
    (
      this.model as {
        onResults: (callback: (results: HolisticResults) => void) => void;
      }
    ).onResults((results: HolisticResults) => {
      for (const callback of this.onResultsCallbacks) {
        callback(results);
      }
    });
  }

  async predict(video: HTMLVideoElement | HTMLImageElement): Promise<void> {
    await this.load();

    // const frameType = this.isFirstFrame ? "first-frame" : "frame"; // Unused for now
    // Note: Original project had Google Analytics tracing here
    this.isFirstFrame = false;
    return (
      this.model as {
        send: (data: {
          image: HTMLVideoElement | HTMLImageElement;
        }) => Promise<void>;
      }
    ).send({ image: video });
  }

  drawBody(landmarks: PoseLandmark[], ctx: CanvasRenderingContext2D): void {
    const filteredLandmarks = Array.from(landmarks);
    for (const l of IGNORED_BODY_LANDMARKS) {
      delete filteredLandmarks[l];
    }

    // Use MediaPipe drawing utils approach
    this.drawConnectors(
      ctx,
      filteredLandmarks,
      this.holistic.POSE_CONNECTIONS,
      "#00FF00"
    );
    this.drawLandmarks(ctx, filteredLandmarks, "#00FF00", "#FF0000");
  }

  drawHand(
    landmarks: PoseLandmark[],
    ctx: CanvasRenderingContext2D,
    lineColor: string,
    dotColor: string,
    dotFillColor: string
  ): void {
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.HAND_CONNECTIONS,
      lineColor
    );
    this.drawLandmarks(ctx, landmarks, dotColor, dotFillColor, 2);
  }

  drawFace(landmarks: PoseLandmark[], ctx: CanvasRenderingContext2D): void {
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_TESSELATION,
      "#C0C0C070",
      1
    );
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_RIGHT_EYE,
      "#FF3030"
    );
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_RIGHT_EYEBROW,
      "#FF3030"
    );
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_LEFT_EYE,
      "#30FF30"
    );
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_LEFT_EYEBROW,
      "#30FF30"
    );
    this.drawConnectors(
      ctx,
      landmarks,
      this.holistic.FACEMESH_FACE_OVAL,
      "#E0E0E0"
    );
    this.drawConnectors(ctx, landmarks, this.holistic.FACEMESH_LIPS, "#E0E0E0");
  }

  private drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    connections: number[][],
    color: string,
    lineWidth: number = 2
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const connection of connections) {
      const from = landmarks[connection[0]];
      const to = landmarks[connection[1]];

      if (from && to) {
        if (
          from.visibility &&
          to.visibility &&
          (from.visibility < 0.1 || to.visibility < 0.1)
        ) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(from.x * ctx.canvas.width, from.y * ctx.canvas.height);
        ctx.lineTo(to.x * ctx.canvas.width, to.y * ctx.canvas.height);
        ctx.stroke();
      }
    }
  }

  private drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    color: string,
    fillColor: string,
    lineWidth: number = 1
  ): void {
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;

    for (const landmark of landmarks) {
      if (landmark && landmark.x !== undefined && landmark.y !== undefined) {
        const x = landmark.x * ctx.canvas.width;
        const y = landmark.y * ctx.canvas.height;
        // Use z-depth for radius calculation like MediaPipe drawing utils
        const radius = landmark.z
          ? Math.max(1, 10 - Math.abs(landmark.z * 10))
          : 3;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  private drawConnect(
    connectors: PoseLandmark[][],
    ctx: CanvasRenderingContext2D
  ): void {
    for (const connector of connectors) {
      const from = connector[0];
      const to = connector[1];
      if (from && to) {
        if (
          from.visibility &&
          to.visibility &&
          (from.visibility < 0.1 || to.visibility < 0.1)
        ) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(from.x * ctx.canvas.width, from.y * ctx.canvas.height);
        ctx.lineTo(to.x * ctx.canvas.width, to.y * ctx.canvas.height);
        ctx.stroke();
      }
    }
  }

  drawElbowHandsConnection(
    pose: EstimatedPose,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.lineWidth = 5;

    if (pose.rightHandLandmarks && pose.poseLandmarks) {
      ctx.strokeStyle = "#00FF00";
      this.drawConnect(
        [
          [
            pose.poseLandmarks[this.holistic.POSE_LANDMARKS?.RIGHT_ELBOW || 14],
            pose.rightHandLandmarks[0],
          ],
        ],
        ctx
      );
    }

    if (pose.leftHandLandmarks && pose.poseLandmarks) {
      ctx.strokeStyle = "#FF0000";
      this.drawConnect(
        [
          [
            pose.poseLandmarks[this.holistic.POSE_LANDMARKS?.LEFT_ELBOW || 13],
            pose.leftHandLandmarks[0],
          ],
        ],
        ctx
      );
    }
  }

  draw(pose: EstimatedPose, ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (pose.poseLandmarks) {
      this.drawBody(pose.poseLandmarks, ctx);
      this.drawElbowHandsConnection(pose, ctx);
    }

    if (pose.leftHandLandmarks) {
      this.drawHand(
        pose.leftHandLandmarks,
        ctx,
        "#CC0000",
        "#FF0000",
        "#00FF00"
      );
    }

    if (pose.rightHandLandmarks) {
      this.drawHand(
        pose.rightHandLandmarks,
        ctx,
        "#00CC00",
        "#00FF00",
        "#FF0000"
      );
    }

    if (pose.faceLandmarks) {
      this.drawFace(pose.faceLandmarks, ctx);
    }

    ctx.restore();
  }

  normalizeHolistic(
    pose: EstimatedPose,
    components: string[],
    normalized: boolean = true
  ): PoseLandmark[] {
    // This calculation takes up to 0.05ms for 543 landmarks
    const vectors: Record<string, PoseLandmark[]> = {
      poseLandmarks: pose.poseLandmarks || new Array(33).fill(EMPTY_LANDMARK),
      faceLandmarks: pose.faceLandmarks || new Array(468).fill(EMPTY_LANDMARK),
      leftHandLandmarks:
        pose.leftHandLandmarks || new Array(21).fill(EMPTY_LANDMARK),
      rightHandLandmarks:
        pose.rightHandLandmarks || new Array(21).fill(EMPTY_LANDMARK),
    };

    let landmarks = components.reduce(
      (acc, component) => acc.concat(vectors[component]),
      [] as PoseLandmark[]
    );

    // Scale by image dimensions
    if (pose.image) {
      const imageWidth = pose.image.width;
      const imageHeight = pose.image.height;

      landmarks = landmarks.map((l) => ({
        x: l.x * imageWidth,
        y: l.y * imageHeight,
        z: l.z * imageWidth,
      }));

      if (normalized && pose.poseLandmarks) {
        const p1 = landmarks[this.holistic.POSE_LANDMARKS?.LEFT_SHOULDER || 11];
        const p2 =
          landmarks[this.holistic.POSE_LANDMARKS?.RIGHT_SHOULDER || 12];
        const scale = Math.sqrt(
          (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 + (p2.z - p1.z) ** 2
        );

        const dx = (p1.x + p2.x) / 2;
        const dy = (p1.y + p2.y) / 2;
        const dz = (p1.z + p2.z) / 2;

        // Normalize all non-zero landmarks
        landmarks = landmarks.map((l) => ({
          x: l.x === 0 ? 0 : (l.x - dx) / scale,
          y: l.y === 0 ? 0 : (l.y - dy) / scale,
          z: l.z === 0 ? 0 : (l.z - dz) / scale,
        }));
      }
    }

    return landmarks;
  }
}
