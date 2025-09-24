/**
 * SignRecognitionService - Handles sign language recognition and conversion to text
 * This service uses the OpenVINO model from SignGPT Client for actual sign recognition
 * and sends recognized words to LLM API for natural language processing
 */

import { EstimatedPose } from "./PoseService";
import { environment } from "@/config/environment";
import OpenVinoSignRecognitionService, {
  SignRecognitionResult as OpenVinoResult,
} from "./OpenVinoSignRecognitionService";

export interface SignRecognitionResult {
  text: string;
  confidence: number;
  timestamp: Date;
  recognizedWords?: string[]; // Individual words recognized
}

export interface SignRecognitionOptions {
  language?: string; // Target spoken language (e.g., 'en', 'ko')
  signLanguage?: string; // Source sign language (e.g., 'asl', 'ksl')
  minConfidence?: number; // Minimum confidence threshold (0-1)
}

export class SignRecognitionService {
  private readonly apiBaseUrl: string;
  private readonly defaultOptions: SignRecognitionOptions = {
    language: "ko", // Changed to Korean as the model recognizes Korean words
    signLanguage: "ksl", // Korean Sign Language
    minConfidence: 0.5,
  };

  // OpenVINO-based sign recognition service
  private openVinoService: OpenVinoSignRecognitionService;

  // Accumulated recognized words for LLM processing
  private recognizedWords: string[] = [];
  private lastRecognitionTime = 0;
  private readonly recognitionInterval = 1000; // Check every 1 second

  constructor(apiBaseUrl?: string) {
    // Use SignGPT API URL for LLM processing
    this.apiBaseUrl =
      apiBaseUrl ||
      environment.signGptClientUrl ||
      "https://emotional-candide-kyokyo-a75699ed.koyeb.app"; // Changed to 8000 as in original

    // Initialize OpenVINO service
    this.openVinoService = new OpenVinoSignRecognitionService();
  }

  /**
   * Add a pose to the recognition buffer
   */
  addPose(pose: EstimatedPose): void {
    // Add pose to OpenVINO service buffer
    this.openVinoService.addPose(pose);
  }

  /**
   * Process accumulated poses and attempt recognition
   */
  async processBuffer(
    options?: SignRecognitionOptions
  ): Promise<SignRecognitionResult | null> {
    const now = Date.now();

    // Don't process too frequently
    if (now - this.lastRecognitionTime < this.recognitionInterval) {
      return null;
    }

    if (!this.openVinoService.isReady()) {
      return null;
    }

    const bufferStatus = this.openVinoService.getBufferStatus();
    if (!bufferStatus.ready) {
      return null;
    }

    this.lastRecognitionTime = now;

    try {
      // Use OpenVINO model for sign recognition
      const openVinoResult = await this.openVinoService.recognizeSign();

      if (
        !openVinoResult ||
        openVinoResult.confidence < (options?.minConfidence || 0.5)
      ) {
        return null;
      }

      // Add recognized word to accumulation
      this.recognizedWords.push(openVinoResult.word);
      console.log(
        "Recognized word:",
        openVinoResult.word,
        "Confidence:",
        openVinoResult.confidence
      );

      // If we have enough words, process them with LLM
      if (this.recognizedWords.length >= 3) {
        const naturalText = await this.processWordsWithLLM(
          this.recognizedWords
        );

        if (naturalText) {
          const result: SignRecognitionResult = {
            text: naturalText,
            confidence: openVinoResult.confidence,
            timestamp: new Date(),
            recognizedWords: [...this.recognizedWords],
          };

          // Reset words buffer after processing
          this.recognizedWords = [];

          return result;
        }
      }

      // Return individual word result
      return {
        text: openVinoResult.word,
        confidence: openVinoResult.confidence,
        timestamp: openVinoResult.timestamp,
        recognizedWords: [openVinoResult.word],
      };
    } catch (error) {
      console.error("Sign recognition failed:", error);
      return null;
    }
  }

  /**
   * Recognize sign language from a single pose (for real-time feedback)
   */
  async recognizeFromPose(
    pose: EstimatedPose,
    options?: SignRecognitionOptions
  ): Promise<SignRecognitionResult | null> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      const poseData = this.preparePoseData([pose]);
      return await this.recognizeSignFromPoses(poseData, opts);
    } catch (error) {
      console.error("Single pose recognition failed:", error);
      return null;
    }
  }

  /**
   * Process recognized words with LLM to create natural language
   */
  private async processWordsWithLLM(words: string[]): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `다음 수어 단어들을 자연스러운 문장으로 만들어주세요: ${words.join(
            ", "
          )}`,
          context: "sign_language_processing",
        }),
      });

      if (!response.ok) {
        console.warn("LLM API not available, using word concatenation");
        return words.join(" ");
      }

      const data = await response.json();
      return data.content || words.join(" ");
    } catch (error) {
      console.warn("LLM processing failed, using word concatenation:", error);
      return words.join(" ");
    }
  }

  /**
   * Clear the pose buffer
   */
  clearBuffer(): void {
    this.openVinoService.clearBuffer();
    this.recognizedWords = [];
    this.lastRecognitionTime = 0;
  }

  /**
   * Get current recognition status
   */
  getRecognitionStatus(): {
    isReady: boolean;
    bufferStatus: { current: number; required: number; ready: boolean };
    recognizedWords: string[];
  } {
    return {
      isReady: this.openVinoService.isReady(),
      bufferStatus: this.openVinoService.getBufferStatus(),
      recognizedWords: [...this.recognizedWords],
    };
  }

  /**
   * Check if SignGPT Client API is available
   */
  async checkApiAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: "GET",
        timeout: 5000,
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default SignRecognitionService;
