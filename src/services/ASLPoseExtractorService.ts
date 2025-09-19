"use client";

import {
  PoseService,
  type EstimatedPose,
  type PoseLandmark,
  EMPTY_LANDMARK,
} from "./PoseService";

/**
 * ASL Pose Extractor Service
 * Adapts the existing PoseService to match the ASL realtime format
 * Returns 75 keypoints (33 body + 21 left hand + 21 right hand) with normalization
 */
export class ASLPoseExtractorService extends PoseService {
  /**
   * Extract pose keypoints in ASL realtime format
   * @param pose Estimated pose from MediaPipe
   * @returns Float32Array of shape (75, 3) representing normalized keypoints
   */
  extractASLKeypoints(pose: EstimatedPose): Float32Array {
    const keypoints: number[] = [];

    // Body landmarks (33 points)
    const bodyLandmarks =
      pose.poseLandmarks || new Array(33).fill(EMPTY_LANDMARK);
    for (let i = 0; i < 33; i++) {
      const landmark = bodyLandmarks[i] || EMPTY_LANDMARK;
      keypoints.push(landmark.x, landmark.y, landmark.z);
    }

    // Left hand landmarks (21 points)
    const leftHandLandmarks =
      pose.leftHandLandmarks || new Array(21).fill(EMPTY_LANDMARK);
    for (let i = 0; i < 21; i++) {
      const landmark = leftHandLandmarks[i] || EMPTY_LANDMARK;
      keypoints.push(landmark.x, landmark.y, landmark.z);
    }

    // Right hand landmarks (21 points)
    const rightHandLandmarks =
      pose.rightHandLandmarks || new Array(21).fill(EMPTY_LANDMARK);
    for (let i = 0; i < 21; i++) {
      const landmark = rightHandLandmarks[i] || EMPTY_LANDMARK;
      keypoints.push(landmark.x, landmark.y, landmark.z);
    }

    // Convert to Float32Array and reshape to (75, 3)
    const keypointsArray = new Float32Array(keypoints);

    // Apply normalization similar to ASL realtime
    return this.normalizeKeypoints(keypointsArray);
  }

  /**
   * Normalize keypoints using shoulder-centered approach from ASL realtime
   * @param keypoints Raw keypoints as Float32Array
   * @returns Normalized keypoints
   */
  private normalizeKeypoints(keypoints: Float32Array): Float32Array {
    const normalized = new Float32Array(keypoints);

    // Get shoulder landmarks (indices 11 and 12 in MediaPipe pose)
    const leftShoulderIdx = 11 * 3; // 11th landmark * 3 coordinates
    const rightShoulderIdx = 12 * 3; // 12th landmark * 3 coordinates

    const leftShoulder = {
      x: normalized[leftShoulderIdx],
      y: normalized[leftShoulderIdx + 1],
      z: normalized[leftShoulderIdx + 2],
    };

    const rightShoulder = {
      x: normalized[rightShoulderIdx],
      y: normalized[rightShoulderIdx + 1],
      z: normalized[rightShoulderIdx + 2],
    };

    // Calculate shoulder center
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2.0,
      y: (leftShoulder.y + rightShoulder.y) / 2.0,
      z: (leftShoulder.z + rightShoulder.z) / 2.0,
    };

    // Apply translation to center on shoulders (only x and y, keep z as is)
    for (let i = 0; i < 75; i++) {
      const baseIdx = i * 3;
      normalized[baseIdx] -= shoulderCenter.x; // x coordinate
      normalized[baseIdx + 1] -= shoulderCenter.y; // y coordinate
      // z coordinate remains unchanged for now
    }

    return normalized;
  }

  /**
   * Convert Float32Array back to 2D array format for easier processing
   * @param keypoints Flat Float32Array of keypoints
   * @returns 2D array of shape (75, 3)
   */
  keypointsTo2D(keypoints: Float32Array): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < 75; i++) {
      const baseIdx = i * 3;
      result.push([
        keypoints[baseIdx],
        keypoints[baseIdx + 1],
        keypoints[baseIdx + 2],
      ]);
    }
    return result;
  }

  /**
   * Convert 2D array back to Float32Array
   * @param keypoints2D 2D array of shape (75, 3)
   * @returns Flat Float32Array
   */
  keypoints2DToFlat(keypoints2D: number[][]): Float32Array {
    const flat: number[] = [];
    for (const point of keypoints2D) {
      flat.push(point[0], point[1], point[2]);
    }
    return new Float32Array(flat);
  }
}
