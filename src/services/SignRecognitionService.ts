"use client";

import * as ort from "onnxruntime-web";
import { EstimatedPose } from "@/services/PoseService";

export interface TopPredictionItem {
  label: string;
  probability: number;
}

export interface RecognitionResult {
  gloss: string | null;
  confidence: number;
  top: TopPredictionItem[];
}

/**
 * Real-time ASL recognizer compatible with the external `asl-realtime` TGCN model.
 * - Expects a sliding window of T frames of keypoints with shape (T, 75, 3)
 * - Model input: (1, 3, T, 75)
 */
export class SignRecognitionService {
  private session: ort.InferenceSession | null = null;
  private idxToGloss: Record<number, string> = {};
  private readonly buffer: Float32Array[] = [];
  private readonly history: number[] = [];
  private maxHistory = 10;

  private T: number;
  private topK: number;
  private isLoading = false;

  constructor(T: number = 32, topK: number = 3) {
    this.T = T;
    this.topK = topK;
  }

  get loaded(): boolean {
    return !!this.session;
  }

  async load(options?: {
    onnxPath?: string;
    classesPath?: string;
  }): Promise<void> {
    if (this.isLoading || this.session) return;
    this.isLoading = true;

    const onnxPath = options?.onnxPath ?? "/models/tgcn.onnx";
    const classesPath = options?.classesPath ?? "/models/classes.json";

    // Load classes mapping
    const classesResp = await fetch(classesPath);
    if (!classesResp.ok) {
      this.isLoading = false;
      throw new Error(`Failed to load classes.json at ${classesPath}`);
    }
    const classesJson: Record<string, string> = await classesResp.json();
    this.idxToGloss = Object.fromEntries(
      Object.entries(classesJson).map(([k, v]) => [parseInt(k, 10), v])
    );

    // Create ONNX session
    try {
      this.session = await ort.InferenceSession.create(onnxPath, {
        executionProviders: ["wasm"],
      });
    } catch (e) {
      this.isLoading = false;
      throw new Error(
        `Failed to load ONNX model at ${onnxPath}. Place tgcn.onnx under public/models/.`
      );
    }

    this.isLoading = false;
  }

  /** Convert MediaPipe holistic results to (75,3) Float32Array as in Python PoseExtractor. */
  poseToKeypoints(pose: EstimatedPose): Float32Array {
    const body = pose.poseLandmarks ?? [];
    const left = pose.leftHandLandmarks ?? [];
    const right = pose.rightHandLandmarks ?? [];

    const pad = (
      arr: Array<{ x: number; y: number; z: number }>,
      n: number
    ) => {
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const lm = (arr[i] as any) || { x: 0, y: 0, z: 0 };
        out.push(lm.x || 0, lm.y || 0, lm.z || 0);
      }
      return out;
    };

    // Assemble 33 body + 21 left + 21 right = 75 landmarks
    const body75 = pad(body as any, 33)
      .concat(pad(left as any, 21))
      .concat(pad(right as any, 21));

    // Center XY by mid-shoulder as in Python
    const shoulderLeftIdx = 11; // mediapipe index
    const shoulderRightIdx = 12;
    const sx =
      ((body[shoulderLeftIdx]?.x ?? 0) + (body[shoulderRightIdx]?.x ?? 0)) / 2;
    const sy =
      ((body[shoulderLeftIdx]?.y ?? 0) + (body[shoulderRightIdx]?.y ?? 0)) / 2;

    for (let j = 0; j < 75; j++) {
      const xIdx = j * 3;
      const yIdx = xIdx + 1;
      // z unchanged per original extractor
      body75[xIdx] = body75[xIdx] - sx;
      body75[yIdx] = body75[yIdx] - sy;
    }

    return new Float32Array(body75);
  }

  /**
   * Update sliding window with one frame (75,3) and run inference when window is full.
   */
  async update(kp_t: Float32Array): Promise<RecognitionResult> {
    if (!this.session) {
      return { gloss: null, confidence: 0, top: [] };
    }

    // Push frame into buffer
    this.buffer.push(kp_t);
    if (this.buffer.length > this.T) this.buffer.shift();

    if (this.buffer.length < this.T) {
      return { gloss: null, confidence: 0, top: [] };
    }

    // Prepare input: (1,3,T,75)
    const input = new Float32Array(1 * 3 * this.T * 75);
    // buffer is oldest->newest; align time axis accordingly
    for (let t = 0; t < this.T; t++) {
      const frame = this.buffer[t]; // (75*3)
      for (let j = 0; j < 75; j++) {
        const x = frame[j * 3 + 0];
        const y = frame[j * 3 + 1];
        const z = frame[j * 3 + 2];
        // index helper: (c, t, j)
        const base = t * 75;
        input[0 * (3 * this.T * 75) + 0 * (this.T * 75) + base + j] = x; // c=0
        input[0 * (3 * this.T * 75) + 1 * (this.T * 75) + base + j] = y; // c=1
        input[0 * (3 * this.T * 75) + 2 * (this.T * 75) + base + j] = z; // c=2
      }
    }

    const feeds: Record<string, ort.Tensor> = {
      x: new ort.Tensor("float32", input, [1, 3, this.T, 75]),
    };

    const output = await this.session.run(feeds);
    // Expected output name: "logits"
    const logitsTensor = output[Object.keys(output)[0]] as ort.Tensor;
    const logits = logitsTensor.data as Float32Array | number[];

    // Softmax
    let max = -Infinity;
    for (let i = 0; i < logits.length; i++)
      max = Math.max(max, logits[i] as number);
    const exps = new Float32Array(logits.length);
    let sum = 0;
    for (let i = 0; i < logits.length; i++) {
      const v = Math.exp((logits[i] as number) - max);
      exps[i] = v;
      sum += v;
    }
    for (let i = 0; i < exps.length; i++) exps[i] = exps[i] / (sum || 1);

    // Top-1
    let topIdx = 0;
    for (let i = 1; i < exps.length; i++)
      if (exps[i] > exps[topIdx]) topIdx = i;
    const gloss = this.idxToGloss[topIdx] ?? String(topIdx);
    const confidence = exps[topIdx];

    // History-based smoothing: count last indices
    this.history.push(topIdx);
    if (this.history.length > this.maxHistory) this.history.shift();
    const counts = new Map<number, number>();
    for (const idx of this.history) counts.set(idx, (counts.get(idx) ?? 0) + 1);
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top: TopPredictionItem[] = sorted.slice(0, this.topK).map(([i]) => ({
      label: this.idxToGloss[i] ?? String(i),
      probability: exps[i] ?? 0,
    }));

    return { gloss, confidence, top };
  }

  async updateFromPose(pose: EstimatedPose): Promise<RecognitionResult> {
    const kp = this.poseToKeypoints(pose);
    return this.update(kp);
  }
}
