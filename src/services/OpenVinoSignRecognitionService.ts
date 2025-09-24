/**
 * OpenVINO Sign Recognition Service
 * 기존 SignGPT Client의 OpenVINO 모델을 사용한 수어 인식 서비스
 */

import { EstimatedPose } from "./PoseService";

export interface HandKeypoints {
  left: number[];
  right: number[];
}

export interface SignRecognitionResult {
  word: string;
  confidence: number;
  timestamp: Date;
}

export class OpenVinoSignRecognitionService {
  private model: unknown = null;
  private isLoaded = false;
  private handsKeypointsBuffer: HandKeypoints[] = [];
  private readonly maxBufferSize = 60; // 60 frames as in original
  private readonly minFramesRequired = 60;

  // Korean words from original model
  private readonly koreanWords = [
    "",
    "안녕하세요",
    "서울",
    "부산",
    "거리",
    "무엇",
    "너",
  ];

  constructor() {
    this.loadModel();
  }

  private async loadModel() {
    try {
      // Try to load OpenVINO.js if available
      // Note: This would require installing openvino-node or using ONNX.js as alternative
      console.log("Loading OpenVINO model for sign recognition...");

      // For now, we'll use a mock implementation
      // In production, you would load the actual OpenVINO model here
      this.model = {
        predict: (input: Float32Array) => {
          // Mock prediction - returns random probabilities
          const numClasses = this.koreanWords.length;
          const output = new Float32Array(numClasses);
          for (let i = 0; i < numClasses; i++) {
            output[i] = Math.random();
          }
          return output;
        },
      };

      this.isLoaded = true;
      console.log("OpenVINO model loaded successfully (mock)");
    } catch (error) {
      console.error("Failed to load OpenVINO model:", error);
      this.isLoaded = false;
    }
  }

  /**
   * Extract hand keypoints from MediaPipe pose estimation
   */
  private extractHandKeypoints(pose: EstimatedPose): HandKeypoints | null {
    const leftHand: number[] = [];
    const rightHand: number[] = [];

    // Extract left hand landmarks (21 points x 2 coordinates = 42 values)
    if (pose.leftHandLandmarks && pose.leftHandLandmarks.length >= 21) {
      for (let i = 0; i < 21; i++) {
        leftHand.push(pose.leftHandLandmarks[i].x);
        leftHand.push(pose.leftHandLandmarks[i].y);
      }
    } else {
      // Fill with zeros if no landmarks
      for (let i = 0; i < 42; i++) {
        leftHand.push(0);
      }
    }

    // Extract right hand landmarks
    if (pose.rightHandLandmarks && pose.rightHandLandmarks.length >= 21) {
      for (let i = 0; i < 21; i++) {
        rightHand.push(pose.rightHandLandmarks[i].x);
        rightHand.push(pose.rightHandLandmarks[i].y);
      }
    } else {
      // Fill with zeros if no landmarks
      for (let i = 0; i < 42; i++) {
        rightHand.push(0);
      }
    }

    return { left: leftHand, right: rightHand };
  }

  /**
   * Add pose data to the recognition buffer
   */
  addPose(pose: EstimatedPose): void {
    if (!this.isLoaded) return;

    const keypoints = this.extractHandKeypoints(pose);
    if (!keypoints) return;

    // Combine left and right hand keypoints (84 total values)
    const combinedKeypoints = [...keypoints.left, ...keypoints.right];
    this.handsKeypointsBuffer.push({
      left: keypoints.left,
      right: keypoints.right,
    });

    // Keep buffer size manageable
    if (this.handsKeypointsBuffer.length > this.maxBufferSize) {
      this.handsKeypointsBuffer.shift();
    }
  }

  /**
   * Recognize sign from accumulated keypoints
   */
  async recognizeSign(): Promise<SignRecognitionResult | null> {
    if (
      !this.isLoaded ||
      this.handsKeypointsBuffer.length < this.minFramesRequired
    ) {
      return null;
    }

    try {
      // Prepare input data as in original implementation
      const framesLen = this.handsKeypointsBuffer.length;

      // Sample 60 frames evenly distributed
      const ids = Array.from({ length: 60 }, (_, i) =>
        Math.round((i / 59) * (framesLen - 1))
      );

      // Create input tensor: [1, 60, 42, 2]
      const inputData = new Float32Array(1 * 60 * 42 * 2);
      let idx = 0;

      for (let frameIdx = 0; frameIdx < 60; frameIdx++) {
        const frame = this.handsKeypointsBuffer[ids[frameIdx]];
        const combinedKeypoints = [...frame.left, ...frame.right];

        // Reshape to [42, 2] format
        for (let i = 0; i < 42; i++) {
          inputData[idx++] = combinedKeypoints[i * 2]; // x coordinate
          inputData[idx++] = combinedKeypoints[i * 2 + 1]; // y coordinate
        }
      }

      // Run model inference
      const output = (this.model as {predict: (data: unknown) => number[]}).predict(inputData);

      // Apply softmax
      const expOutput = output.map((x: number) =>
        Math.exp(x - Math.max(...output))
      );
      const sumExp = expOutput.reduce((a: number, b: number) => a + b, 0);
      const softmaxOutput = expOutput.map((x: number) => x / sumExp);

      // Get prediction
      const labelIndex = softmaxOutput.indexOf(Math.max(...softmaxOutput));
      const confidence = softmaxOutput[labelIndex];
      const word = this.koreanWords[labelIndex];

      // Clear buffer after recognition
      this.handsKeypointsBuffer = [];

      if (confidence > 0.5 && word) {
        // Confidence threshold
        return {
          word,
          confidence,
          timestamp: new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error("Sign recognition failed:", error);
      return null;
    }
  }

  /**
   * Clear the keypoints buffer
   */
  clearBuffer(): void {
    this.handsKeypointsBuffer = [];
  }

  /**
   * Get current buffer status
   */
  getBufferStatus(): { current: number; required: number; ready: boolean } {
    return {
      current: this.handsKeypointsBuffer.length,
      required: this.minFramesRequired,
      ready: this.handsKeypointsBuffer.length >= this.minFramesRequired,
    };
  }

  /**
   * Check if the service is ready for recognition
   */
  isReady(): boolean {
    return this.isLoaded;
  }
}

export default OpenVinoSignRecognitionService;

