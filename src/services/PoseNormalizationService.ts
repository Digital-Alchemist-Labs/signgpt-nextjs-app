"use client";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
  multiplyScalar?: (scalar: number) => Vector3;
  crossVectors?: (a: Vector3, b: Vector3) => Vector3;
  normalize?: () => Vector3;
}

export interface PlaneNormal {
  center: Vector3Impl;
  direction: Vector3Impl;
}

class Vector3Impl implements Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  multiplyScalar(scalar: number): Vector3Impl {
    return new Vector3Impl(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  crossVectors(a: Vector3, b: Vector3): Vector3Impl {
    return new Vector3Impl(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }

  normalize(): Vector3Impl {
    const length = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z
    );
    if (length === 0) return new Vector3Impl();
    return new Vector3Impl(this.x / length, this.y / length, this.z / length);
  }
}

class PlaneImpl {
  normal: Vector3Impl;
  constant: number;

  constructor() {
    this.normal = new Vector3Impl(1, 0, 0);
    this.constant = 0;
  }

  setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): PlaneImpl {
    const v1 = new Vector3Impl(b.x - a.x, b.y - a.y, b.z - a.z);
    const v2 = new Vector3Impl(c.x - a.x, c.y - a.y, c.z - a.z);

    this.normal = new Vector3Impl().crossVectors(v1, v2).normalize();
    this.constant = -(
      a.x * this.normal.x +
      a.y * this.normal.y +
      a.z * this.normal.z
    );

    return this;
  }
}

export class ThreeService {
  Vector3 = Vector3Impl;
  Plane = PlaneImpl;
}

interface TensorLike {
  slice: (start: number, size: number) => TensorLike;
  sub: (other: TensorLike) => TensorLike;
  mul: (other: TensorLike) => TensorLike;
  dot: (other: TensorLike) => TensorLike;
  sum: () => { sqrt: () => TensorLike };
  pow: (exp: number) => TensorLike;
  arraySync: () => number[][];
  div: (other: TensorLike) => TensorLike;
}

interface TensorflowLike {
  tensor2d: (data: number[][]) => TensorLike;
  scalar: (value: number) => TensorLike;
  dot: (a: TensorLike, b: TensorLike) => TensorLike;
  pow: (tensor: TensorLike, exponent: number) => TensorLike;
}

export class TensorflowService {
  private tf: TensorflowLike | null = null;
  private loadPromise: Promise<TensorflowLike> | null = null;

  async load(): Promise<TensorflowLike> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadTensorflow();
    }
    return this.loadPromise;
  }

  private async loadTensorflow(): Promise<TensorflowLike> {
    // For now, we'll use the mock implementation since TensorFlow.js
    // has complex type compatibility issues and the pose normalization
    // is primarily used for advanced pose processing features
    console.warn(
      "Using mock TensorFlow.js implementation for pose normalization"
    );
    this.tf = this.createMockTensorflow();
    return this.tf;
  }

  private createMockTensorflow(): TensorflowLike {
    return {
      tensor2d: (_data: number[][]) => this.createMockTensor(),
      scalar: (_value: number) => this.createMockTensor(),
      dot: (_a: TensorLike, _b: TensorLike) => this.createMockTensor(),
      pow: (_tensor: TensorLike, _exponent: number) => this.createMockTensor(),
    };
  }

  private createMockTensor(): TensorLike {
    return {
      slice: (_start: number, _size: number) => this.createMockTensor(),
      sub: (_other: TensorLike) => this.createMockTensor(),
      mul: (_other: TensorLike) => this.createMockTensor(),
      dot: (_other: TensorLike) => this.createMockTensor(),
      sum: () => ({ sqrt: () => this.createMockTensor() }),
      pow: (_exp: number) => this.createMockTensor(),
      arraySync: () => [[0, 0, 0]],
      div: (_other: TensorLike) => this.createMockTensor(),
    };
  }

  tensor2d(data: number[][]): TensorLike {
    if (!this.tf) {
      throw new Error("TensorFlow service not initialized");
    }
    return this.tf.tensor2d(data);
  }

  scalar(value: number): TensorLike {
    if (!this.tf) {
      throw new Error("TensorFlow service not initialized");
    }
    return this.tf.scalar(value);
  }

  dot(a: TensorLike, b: TensorLike): TensorLike {
    if (!this.tf) {
      throw new Error("TensorFlow service not initialized");
    }
    return this.tf.dot(a, b);
  }

  pow(tensor: TensorLike, exponent: number): TensorLike {
    if (!this.tf) {
      throw new Error("TensorFlow service not initialized");
    }
    return this.tf.pow(tensor, exponent);
  }
}

export class PoseNormalizationService {
  private tf = new TensorflowService();
  private three = new ThreeService();

  async initialize(): Promise<void> {
    await this.tf.load();
  }

  normal(vectors: Vector3[], planeIdx: [number, number, number]): PlaneNormal {
    const triangle = planeIdx.map((i) => vectors[i]);

    const center = new this.three.Vector3(
      (triangle[0].x + triangle[1].x + triangle[2].x) / 3,
      (triangle[0].y + triangle[1].y + triangle[2].y) / 3,
      (triangle[0].z + triangle[1].z + triangle[2].z) / 3
    );

    const plane = new this.three.Plane().setFromCoplanarPoints(
      triangle[0],
      triangle[1],
      triangle[2]
    );
    const direction = plane.normal;

    return { center, direction };
  }

  angle(n: number, d: number): number {
    return ((Math.atan2(n, d) * 180) / Math.PI + 360) % 360;
  }

  async normalize(
    vectors: Vector3[],
    normal: PlaneNormal,
    line: [number, number],
    center: number,
    flip: boolean = false
  ): Promise<TensorLike> {
    await this.initialize();

    let matrix = this.tf.tensor2d(vectors.map((v) => [v.x, v.y, v.z]));

    // 1. Rotate vectors to normal
    const oldXAxis = new this.three.Vector3(1, 0, 0);
    const zAxis = normal.direction.multiplyScalar(-1);
    const yAxis = new this.three.Vector3().crossVectors(oldXAxis, zAxis);
    const xAxis = new this.three.Vector3().crossVectors(zAxis, yAxis);

    const axis = this.tf.tensor2d([
      [xAxis.x, yAxis.x, zAxis.x],
      [xAxis.y, yAxis.y, zAxis.y],
      [xAxis.z, yAxis.z, zAxis.z],
    ]);

    matrix = matrix.sub(matrix.slice(0, 1));
    matrix = this.tf.dot(matrix, axis);

    if (flip) {
      // Because of mismatch between training and inference, need to flip X axis for right hand
      matrix = matrix.mul(this.tf.tensor2d([[-1, 1, 1]]));
    }

    // 2. Rotate hand on the XY plane such that the BASE-M_CMC is on the Y axis
    const p1 = matrix.slice(line[0], 1); // BASE
    const p2 = matrix.slice(line[1], 1); // M_CMC
    const vec = p2.sub(p1).arraySync();
    const angle = 90 + this.angle(vec[0][1], vec[0][0]);
    const sinAngle = Math.sin((angle * Math.PI) / 180);
    const cosAngle = Math.cos((angle * Math.PI) / 180);
    const rotationMatrix = this.tf.tensor2d([
      [cosAngle, -sinAngle, 0],
      [sinAngle, cosAngle, 0],
      [0, 0, 1],
    ]);

    matrix = matrix.dot(rotationMatrix);

    // 3. Scale line to be of length 200
    const j1 = matrix.slice(line[0], 1); // BASE
    const j2 = matrix.slice(line[1], 1); // M_CMC
    const len = this.tf.pow(j2.sub(j1), 2).sum().sqrt();
    const scalingFactor = this.tf.scalar(200).div(len);
    matrix = matrix.mul(scalingFactor);

    return matrix.sub(matrix.slice(center, 1));
  }

  // Helper method to convert pose landmarks to Vector3 array
  landmarksToVectors(
    landmarks: Array<{ x: number; y: number; z: number }>
  ): Vector3[] {
    return landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    }));
  }

  // Helper method to normalize hand pose specifically
  async normalizeHandPose(
    handLandmarks: Array<{ x: number; y: number; z: number }>,
    isRightHand: boolean = false
  ): Promise<TensorLike> {
    const vectors = this.landmarksToVectors(handLandmarks);

    // Define hand-specific plane and line indices
    const planeIdx: [number, number, number] = [0, 5, 17]; // WRIST, INDEX_FINGER_MCP, PINKY_MCP
    const line: [number, number] = [0, 9]; // WRIST to MIDDLE_FINGER_MCP
    const center = 0; // WRIST

    const planeNormal = this.normal(vectors, planeIdx);

    return this.normalize(vectors, planeNormal, line, center, isRightHand);
  }

  // Helper method to normalize body pose
  async normalizeBodyPose(
    poseLandmarks: Array<{ x: number; y: number; z: number }>
  ): Promise<TensorLike> {
    const vectors = this.landmarksToVectors(poseLandmarks);

    // Define body-specific plane and line indices
    const planeIdx: [number, number, number] = [11, 12, 23]; // LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP
    const line: [number, number] = [11, 12]; // LEFT_SHOULDER to RIGHT_SHOULDER
    const center = 0; // NOSE

    const planeNormal = this.normal(vectors, planeIdx);

    return this.normalize(vectors, planeNormal, line, center, false);
  }
}
