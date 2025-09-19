"use client";

/**
 * ASL Signing Detector Service
 * Implements GRU-based binary classification with hysteresis
 * Detects signing vs non-signing states in real-time
 */
export class ASLSigningDetectorService {
  private buffer: Float32Array[] = [];
  private readonly windowSize: number;
  private readonly onThreshold: number;
  private readonly offThreshold: number;
  private isSigningState: boolean = false;
  private model: any = null; // Will be loaded dynamically
  private isModelLoaded: boolean = false;

  constructor(
    windowSize: number = 24,
    onThreshold: number = 0.6,
    offThreshold: number = 0.4
  ) {
    this.windowSize = windowSize;
    this.onThreshold = onThreshold;
    this.offThreshold = offThreshold;
  }

  /**
   * Load the GRU detector model
   * For now, this is a placeholder - in production, you would load an actual model
   */
  async loadModel(modelPath?: string): Promise<void> {
    try {
      // Placeholder for model loading
      // In production, this would load a TensorFlow.js or ONNX model
      console.log("Loading ASL signing detector model...");

      // Simulate model loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a mock model for demonstration
      this.model = {
        predict: (input: Float32Array[]) => {
          // Mock prediction - in reality this would be a trained GRU model
          // For now, we'll use a simple heuristic based on hand movement
          return this.mockGRUPrediction(input);
        },
      };

      this.isModelLoaded = true;
      console.log("ASL signing detector model loaded successfully");
    } catch (error) {
      console.error("Failed to load ASL signing detector model:", error);
      throw error;
    }
  }

  /**
   * Update the detector with new keypoints
   * @param keypoints Float32Array of shape (75, 3) - flattened keypoints
   * @returns Object containing signing state and probability
   */
  update(keypoints: Float32Array): { isSigning: boolean; probability: number } {
    // Add keypoints to buffer
    this.buffer.push(new Float32Array(keypoints));

    // Maintain window size
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Need full window for prediction
    if (this.buffer.length < this.windowSize) {
      return {
        isSigning: this.isSigningState,
        probability: 0.0,
      };
    }

    // Get prediction probability
    const probability = this.predict();

    // Apply hysteresis logic
    if (this.isSigningState) {
      // Currently signing - need to drop below off threshold to stop
      if (probability < this.offThreshold) {
        this.isSigningState = false;
      }
    } else {
      // Currently not signing - need to exceed on threshold to start
      if (probability > this.onThreshold) {
        this.isSigningState = true;
      }
    }

    return {
      isSigning: this.isSigningState,
      probability: probability,
    };
  }

  /**
   * Get prediction from the model
   * @returns Probability of signing (0-1)
   */
  private predict(): number {
    if (!this.isModelLoaded || !this.model) {
      // Fallback to simple heuristic if model not loaded
      return this.simpleHeuristic();
    }

    try {
      return this.model.predict(this.buffer);
    } catch (error) {
      console.error("Error during prediction:", error);
      return this.simpleHeuristic();
    }
  }

  /**
   * Mock GRU prediction for demonstration
   * In production, this would be replaced with actual model inference
   */
  private mockGRUPrediction(input: Float32Array[]): number {
    // Calculate hand movement velocity as a proxy for signing activity
    if (input.length < 2) return 0.0;

    const current = input[input.length - 1];
    const previous = input[input.length - 2];

    // Calculate movement in hand regions
    let totalMovement = 0;
    let validPoints = 0;

    // Check left hand (indices 33-53, each with 3 coordinates)
    for (let i = 33; i < 54; i++) {
      const baseIdx = i * 3;
      if (baseIdx + 2 < current.length && baseIdx + 2 < previous.length) {
        const dx = current[baseIdx] - previous[baseIdx];
        const dy = current[baseIdx + 1] - previous[baseIdx + 1];
        const movement = Math.sqrt(dx * dx + dy * dy);
        totalMovement += movement;
        validPoints++;
      }
    }

    // Check right hand (indices 54-74, each with 3 coordinates)
    for (let i = 54; i < 75; i++) {
      const baseIdx = i * 3;
      if (baseIdx + 2 < current.length && baseIdx + 2 < previous.length) {
        const dx = current[baseIdx] - previous[baseIdx];
        const dy = current[baseIdx + 1] - previous[baseIdx + 1];
        const movement = Math.sqrt(dx * dx + dy * dy);
        totalMovement += movement;
        validPoints++;
      }
    }

    const avgMovement = validPoints > 0 ? totalMovement / validPoints : 0;

    // Convert movement to probability (sigmoid-like function)
    const scaledMovement = avgMovement * 100; // Scale up for better sensitivity
    const probability = 1 / (1 + Math.exp(-scaledMovement + 2)); // Sigmoid with offset

    return Math.min(1.0, Math.max(0.0, probability));
  }

  /**
   * Simple heuristic fallback when model is not available
   */
  private simpleHeuristic(): number {
    if (this.buffer.length < 2) return 0.0;

    return this.mockGRUPrediction(this.buffer);
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.buffer = [];
    this.isSigningState = false;
  }

  /**
   * Update thresholds dynamically
   */
  updateThresholds(onThreshold: number, offThreshold: number): void {
    if (onThreshold > offThreshold) {
      this.onThreshold = onThreshold;
      this.offThreshold = offThreshold;
    } else {
      console.warn("On threshold must be greater than off threshold");
    }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): { onThreshold: number; offThreshold: number } {
    return {
      onThreshold: this.onThreshold,
      offThreshold: this.offThreshold,
    };
  }

  /**
   * Get current state
   */
  getState(): { isSigning: boolean; bufferSize: number; windowSize: number } {
    return {
      isSigning: this.isSigningState,
      bufferSize: this.buffer.length,
      windowSize: this.windowSize,
    };
  }
}
