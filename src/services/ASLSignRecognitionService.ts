"use client";

export interface SignRecognitionResult {
  gloss: string;
  confidence: number;
  topK: Array<{ gloss: string; confidence: number }>;
}

/**
 * ASL Sign Recognition Service
 * Implements TGCN/CTRGCN-based sign classification with temporal buffering
 * Recognizes specific sign gestures and returns top-k results
 */
export class ASLSignRecognitionService {
  private buffer: Float32Array[] = [];
  private readonly windowSize: number;
  private readonly topK: number;
  private model: any = null;
  private isModelLoaded: boolean = false;
  private classes: Record<string, string> = {};
  private history: number[] = [];
  private readonly historySize: number = 10;

  constructor(windowSize: number = 32, topK: number = 3) {
    this.windowSize = windowSize;
    this.topK = topK;
  }

  /**
   * Load the TGCN/CTRGCN recognition model and class mappings
   */
  async loadModel(modelPath?: string, classesPath?: string): Promise<void> {
    try {
      console.log("Loading ASL sign recognition model...");

      // Load class mappings (in production, this would load from a JSON file)
      await this.loadClasses(classesPath);

      // Simulate model loading
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a mock model for demonstration
      this.model = {
        predict: (input: Float32Array[]) => {
          return this.mockTGCNPrediction(input);
        },
      };

      this.isModelLoaded = true;
      console.log("ASL sign recognition model loaded successfully");
    } catch (error) {
      console.error("Failed to load ASL sign recognition model:", error);
      throw error;
    }
  }

  /**
   * Load class mappings from glossary
   */
  private async loadClasses(classesPath?: string): Promise<void> {
    // Mock class mappings - in production, load from actual glossary
    this.classes = {
      "0": "HELLO",
      "1": "THANK_YOU",
      "2": "PLEASE",
      "3": "SORRY",
      "4": "YES",
      "5": "NO",
      "6": "GOOD",
      "7": "BAD",
      "8": "HELP",
      "9": "MORE",
      "10": "WATER",
      "11": "FOOD",
      "12": "HOME",
      "13": "WORK",
      "14": "FAMILY",
      "15": "FRIEND",
      "16": "LOVE",
      "17": "HAPPY",
      "18": "SAD",
      "19": "ANGRY",
    };
  }

  /**
   * Update the recognizer with new keypoints
   * @param keypoints Float32Array of shape (75, 3) - flattened keypoints
   * @returns Recognition result or null if not ready
   */
  update(keypoints: Float32Array): SignRecognitionResult | null {
    // Add keypoints to buffer
    this.buffer.push(new Float32Array(keypoints));

    // Maintain window size
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Need full window for prediction
    if (this.buffer.length < this.windowSize) {
      return null;
    }

    // Get prediction
    const prediction = this.predict();
    if (!prediction) return null;

    // Update history for temporal smoothing
    this.history.push(prediction.topClass);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    // Get most frequent class from history
    const classCounts = this.getClassCounts();
    const mostFrequentClass = this.getMostFrequentClass(classCounts);

    // Build top-k results using current prediction probabilities
    const topKResults = prediction.topK.map((item) => ({
      gloss:
        this.classes[item.classIndex.toString()] || `CLASS_${item.classIndex}`,
      confidence: item.probability,
    }));

    return {
      gloss:
        this.classes[mostFrequentClass.toString()] ||
        `CLASS_${mostFrequentClass}`,
      confidence: prediction.probabilities[mostFrequentClass] || 0,
      topK: topKResults,
    };
  }

  /**
   * Get prediction from the model
   */
  private predict(): {
    topClass: number;
    probabilities: number[];
    topK: Array<{ classIndex: number; probability: number }>;
  } | null {
    if (!this.isModelLoaded || !this.model) {
      return null;
    }

    try {
      return this.model.predict(this.buffer);
    } catch (error) {
      console.error("Error during sign recognition:", error);
      return null;
    }
  }

  /**
   * Mock TGCN prediction for demonstration
   * In production, this would be replaced with actual model inference
   */
  private mockTGCNPrediction(input: Float32Array[]): {
    topClass: number;
    probabilities: number[];
    topK: Array<{ classIndex: number; probability: number }>;
  } {
    const numClasses = Object.keys(this.classes).length;
    const probabilities = new Array(numClasses).fill(0);

    // Generate mock probabilities based on hand and body movement patterns
    const features = this.extractFeatures(input);

    // Simple heuristic mapping features to classes
    for (let i = 0; i < numClasses; i++) {
      // Use different combinations of features for different classes
      let score = 0;

      // Different signs have different characteristic movements
      switch (i % 4) {
        case 0: // Hand-dominant signs
          score = features.handMovement * 0.7 + features.handShape * 0.3;
          break;
        case 1: // Body-dominant signs
          score = features.bodyMovement * 0.6 + features.handMovement * 0.4;
          break;
        case 2: // Symmetric signs
          score = features.symmetry * 0.8 + features.handShape * 0.2;
          break;
        case 3: // Complex signs
          score =
            (features.handMovement +
              features.bodyMovement +
              features.handShape) /
            3;
          break;
      }

      // Add some randomness and normalize
      score += (Math.random() - 0.5) * 0.2;
      probabilities[i] = Math.max(0, Math.min(1, score));
    }

    // Apply softmax normalization
    const expProbs = probabilities.map((p) => Math.exp(p));
    const sumExp = expProbs.reduce((sum, p) => sum + p, 0);
    const normalizedProbs = expProbs.map((p) => p / sumExp);

    // Get top class
    const topClass = normalizedProbs.indexOf(Math.max(...normalizedProbs));

    // Get top-k results
    const indexedProbs = normalizedProbs.map((prob, index) => ({
      classIndex: index,
      probability: prob,
    }));
    indexedProbs.sort((a, b) => b.probability - a.probability);
    const topK = indexedProbs.slice(0, this.topK);

    return {
      topClass,
      probabilities: normalizedProbs,
      topK,
    };
  }

  /**
   * Extract features from keypoint sequence for mock prediction
   */
  private extractFeatures(input: Float32Array[]): {
    handMovement: number;
    bodyMovement: number;
    handShape: number;
    symmetry: number;
  } {
    if (input.length < 2) {
      return { handMovement: 0, bodyMovement: 0, handShape: 0, symmetry: 0 };
    }

    const current = input[input.length - 1];
    const previous = input[input.length - 2];

    let handMovement = 0;
    let bodyMovement = 0;
    let handShape = 0;
    let symmetry = 0;

    // Calculate hand movement (indices 33-74 for both hands)
    for (let i = 33; i < 75; i++) {
      const baseIdx = i * 3;
      if (baseIdx + 2 < current.length) {
        const dx = current[baseIdx] - previous[baseIdx];
        const dy = current[baseIdx + 1] - previous[baseIdx + 1];
        handMovement += Math.sqrt(dx * dx + dy * dy);
      }
    }
    handMovement /= 42; // Normalize by number of hand points

    // Calculate body movement (indices 0-32 for body)
    for (let i = 0; i < 33; i++) {
      const baseIdx = i * 3;
      if (baseIdx + 2 < current.length) {
        const dx = current[baseIdx] - previous[baseIdx];
        const dy = current[baseIdx + 1] - previous[baseIdx + 1];
        bodyMovement += Math.sqrt(dx * dx + dy * dy);
      }
    }
    bodyMovement /= 33; // Normalize by number of body points

    // Calculate hand shape (simplified - based on finger spread)
    // Left hand wrist to fingertips distance
    const leftWristIdx = 33 * 3; // First left hand point
    const leftFingerTipIdx = 53 * 3; // Last left hand point
    if (leftFingerTipIdx + 2 < current.length) {
      const dx = current[leftFingerTipIdx] - current[leftWristIdx];
      const dy = current[leftFingerTipIdx + 1] - current[leftWristIdx + 1];
      handShape += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate symmetry (difference between left and right hand positions)
    const leftHandCenter = this.getHandCenter(current, 33, 54);
    const rightHandCenter = this.getHandCenter(current, 54, 75);
    if (leftHandCenter && rightHandCenter) {
      const dx = Math.abs(leftHandCenter.x - -rightHandCenter.x); // Mirror right hand
      const dy = Math.abs(leftHandCenter.y - rightHandCenter.y);
      symmetry = 1 / (1 + Math.sqrt(dx * dx + dy * dy)); // Inverse distance
    }

    return {
      handMovement: Math.min(1, handMovement * 10),
      bodyMovement: Math.min(1, bodyMovement * 10),
      handShape: Math.min(1, handShape * 2),
      symmetry,
    };
  }

  /**
   * Get center point of hand region
   */
  private getHandCenter(
    keypoints: Float32Array,
    startIdx: number,
    endIdx: number
  ): { x: number; y: number } | null {
    let sumX = 0,
      sumY = 0,
      count = 0;

    for (let i = startIdx; i < endIdx; i++) {
      const baseIdx = i * 3;
      if (baseIdx + 1 < keypoints.length) {
        sumX += keypoints[baseIdx];
        sumY += keypoints[baseIdx + 1];
        count++;
      }
    }

    return count > 0 ? { x: sumX / count, y: sumY / count } : null;
  }

  /**
   * Get class counts from history
   */
  private getClassCounts(): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const classIdx of this.history) {
      counts[classIdx] = (counts[classIdx] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get most frequent class from counts
   */
  private getMostFrequentClass(counts: Record<number, number>): number {
    let maxCount = 0;
    let mostFrequent = 0;

    for (const [classIdx, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = parseInt(classIdx);
      }
    }

    return mostFrequent;
  }

  /**
   * Reset the recognizer state
   */
  reset(): void {
    this.buffer = [];
    this.history = [];
  }

  /**
   * Get current state
   */
  getState(): {
    bufferSize: number;
    windowSize: number;
    historySize: number;
    isModelLoaded: boolean;
  } {
    return {
      bufferSize: this.buffer.length,
      windowSize: this.windowSize,
      historySize: this.history.length,
      isModelLoaded: this.isModelLoaded,
    };
  }
}
