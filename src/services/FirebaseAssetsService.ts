"use client";

import { environment, getFirebaseStorageUrl } from "@/config/environment";

export interface AssetState {
  name?: string;
  label?: string;
  path: string;
  exists: boolean;
  size?: number;
  progress?: number; // Download progress in percentage
  modified?: Date;
  children?: AssetState[];
}

type ProgressCallback = (receivedLength: number, totalLength: number) => void;

interface FileMetadata {
  size: number;
  updatedAt: string;
}

interface FirebaseStorageModule {
  getDownloadURL: (path: string) => Promise<{ downloadUrl: string }>;
  getMetadata: (path: string) => Promise<FileMetadata>;
  listFiles: (options: {
    path: string;
  }) => Promise<{ items: Array<{ name: string }> }>;
}

export class FirebaseAssetsService {
  static readonly BUCKET_URL = environment.firebaseStorageBucketUrl;
  static readonly BUCKET = environment.firebaseStorageBucket;

  private firebaseStorage: FirebaseStorageModule | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadFirebaseStorage();
    return this.initPromise;
  }

  private async loadFirebaseStorage(): Promise<void> {
    try {
      // Try to dynamically import Firebase Storage
      // In a real implementation, you would install and import firebase
      console.warn("Firebase Storage not available, using mock implementation");
      this.firebaseStorage = this.createMockFirebaseStorage();
    } catch (error) {
      console.warn("Firebase Storage not available:", error);
      this.firebaseStorage = this.createMockFirebaseStorage();
    }
  }

  private createMockFirebaseStorage(): FirebaseStorageModule {
    return {
      getDownloadURL: async (path: string) => {
        // Return the direct Firebase Storage URL
        return { downloadUrl: this.buildRemotePath(path) };
      },
      getMetadata: async (): Promise<FileMetadata> => {
        return {
          size: 1024, // Mock size
          updatedAt: new Date().toISOString(),
        };
      },
      listFiles: async () => {
        // Mock implementation - in reality this would list actual files
        return { items: [] };
      },
    };
  }

  stat(path: string): AssetState {
    if (path.endsWith("/")) {
      const files = this.getLocalStorageDirectory(path);
      if (!files) {
        return { path, exists: false, children: [] };
      }
      const filesStat = files.map((f) => this.stat(path + f));
      return {
        path,
        exists: filesStat.every((f) => f.exists),
        size: filesStat.reduce((acc, f) => acc + (f.size || 0), 0),
        children: filesStat,
      };
    }

    const fileStatStr = localStorage.getItem(path);
    if (!fileStatStr) {
      return { path, exists: false };
    }

    try {
      const fileStat = JSON.parse(fileStatStr);
      return {
        path,
        exists: true,
        size: fileStat.size,
        modified: new Date(fileStat.updatedAt),
      };
    } catch {
      return { path, exists: false };
    }
  }

  async deleteCache(path: string): Promise<void> {
    if (path.endsWith("/")) {
      const files = this.getLocalStorageDirectory(path);
      if (files) {
        await Promise.all(files.map((f) => this.deleteCache(path + f)));
      }
    } else {
      await this.deleteFile(path);
    }

    localStorage.removeItem(path);
  }

  getLocalStorageDirectory(path: string): string[] | null {
    const filesStr = localStorage.getItem(path);
    if (!filesStr) {
      return null;
    }
    return filesStr.split(",");
  }

  async download(
    path: string,
    progressCallback?: ProgressCallback
  ): Promise<string | Map<string, string>> {
    if (path.endsWith("/")) {
      return this.getDirectory(path, progressCallback);
    }
    return this.getFileUri(path, progressCallback);
  }

  async getDirectory(
    path: string,
    progressCallback?: ProgressCallback
  ): Promise<Map<string, string>> {
    if (!path.endsWith("/")) {
      throw new Error("Directory path must end with /");
    }

    let files = this.getLocalStorageDirectory(path);
    if (!files) {
      // Directory is not cached
      files = Array.from(await this.listDirectory(path));
      localStorage.setItem(path, files.join(","));
    }

    // Build a combined progress callback for all files
    let totalLength = 0;
    const received = new Array(files.length).fill(0);
    const progressSet = new Set<number>();
    const fileProgressCallback = (
      i: number,
      fileReceivedLength: number,
      fileTotalLength: number
    ) => {
      if (!progressSet.has(i)) {
        progressSet.add(i);
        totalLength += fileTotalLength;
      }
      received[i] = fileReceivedLength;
      if (progressCallback) {
        const receivedLength = received.reduce((acc, r) => acc + r, 0);
        progressCallback(receivedLength, totalLength);
      }
    };

    const localFiles = await Promise.all(
      files.map((f, i) => {
        return this.getFileUri(path + f, (n, d) =>
          fileProgressCallback(i, n, d)
        );
      })
    );

    const map = new Map<string, string>();
    files.forEach((f, i) => map.set(f, localFiles[i]));
    return map;
  }

  async getFileUri(
    path: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    const download = async () => {
      return this.getRemoteFileAsBlob(path, progressCallback);
    };

    const downloadDone = async () => {
      // Save metadata, so we can check for updates later
      const metadata = await this.statRemoteFile(path);
      localStorage.setItem(path, JSON.stringify(metadata));
    };

    // For web implementation, we'll use browser storage APIs when available
    try {
      return await this.browserStorageFileUri(path, download, downloadDone);
    } catch {
      console.log("Browser storage not supported, using direct URL");
    }

    // Check if the remote file exists before returning URL
    try {
      const remoteUrl = this.buildRemotePath(path);

      // Quick HEAD request to check if file exists
      const response = await fetch(remoteUrl, { method: "HEAD" });
      if (!response.ok) {
        console.warn(`Firebase asset not found: ${path} (${response.status})`);
        // Return a placeholder or null instead of a 404 URL
        throw new Error(`Asset not found: ${path}`);
      }

      return remoteUrl;
    } catch (error) {
      console.warn(`Failed to access Firebase asset: ${path}`, error);
      // Instead of returning a 404 URL, throw an error
      throw new Error(`Firebase asset unavailable: ${path}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.deleteBrowserStorageFile(path);
    } catch (e) {
      console.log("Could not delete browser storage file:", e);
    }
  }

  async deleteBrowserStorageFile(path: string): Promise<void> {
    if (!("storage" in navigator) || !("getDirectory" in navigator.storage)) {
      return;
    }

    try {
      const [directory, fileName] = await this.browserStorageDirectory(path);
      await directory.removeEntry(fileName);
    } catch (e) {
      console.log("Could not delete file:", e);
    }
  }

  async browserStorageDirectory(
    path: string
  ): Promise<[FileSystemDirectoryHandle, string]> {
    if (!("storage" in navigator) || !("getDirectory" in navigator.storage)) {
      throw new Error("Browser storage not supported");
    }

    let directory = await navigator.storage.getDirectory();
    const route = path.split("/");
    const fileName = route.pop();

    if (!fileName) {
      throw new Error("Invalid file path");
    }

    for (const dir of route) {
      directory = await directory.getDirectoryHandle(dir, { create: true });
    }

    return [directory, fileName];
  }

  async browserStorageFileUri(
    path: string,
    download: () => Promise<Blob>,
    downloadDone: () => Promise<void>
  ): Promise<string> {
    const [directory, fileName] = await this.browserStorageDirectory(path);

    const downloadAndWrite = async () => {
      const fileHandle = await directory.getFileHandle(fileName, {
        create: true,
      });

      if (!("createWritable" in fileHandle)) {
        await directory.removeEntry(fileName);
        throw new Error("Web storage not supported");
      }

      // Write file
      const wtr = await fileHandle.createWritable();
      try {
        const blob = await download();
        await wtr.write(blob);
      } finally {
        await wtr.close();
      }

      await downloadDone();
    };

    const getFile = async () => {
      // File stat does not exist
      const statStr = localStorage.getItem(path);
      if (!statStr) {
        return null;
      }
      const stat = JSON.parse(statStr);

      // File does not exist
      let fileHandle;
      try {
        fileHandle = await directory.getFileHandle(fileName);
      } catch {
        console.log("File handle does not exist in browser storage");
        return null;
      }

      const file = await fileHandle.getFile();
      if (Number(stat.size) !== file.size && file.size !== 0) {
        console.error("File size mismatch", stat, file);
        return null;
      }

      return file;
    };

    let file = await getFile();
    if (!file) {
      await downloadAndWrite();
      file = await getFile();
    }

    if (file) {
      return URL.createObjectURL(file);
    }

    throw new Error("Could not create file URL");
  }

  buildRemotePath(path: string): string {
    return getFirebaseStorageUrl(path);
  }

  async listDirectory(path: string): Promise<string[]> {
    await this.init();
    if (!this.firebaseStorage) {
      throw new Error("Firebase Storage not initialized");
    }

    const { items } = await this.firebaseStorage.listFiles({
      path: `${FirebaseAssetsService.BUCKET}/${path}`,
    });
    return items.map((i) => i.name);
  }

  async statRemoteFile(path: string) {
    await this.init();
    if (!this.firebaseStorage) {
      throw new Error("Firebase Storage not initialized");
    }

    return this.firebaseStorage.getMetadata(
      `${FirebaseAssetsService.BUCKET}/${path}`
    );
  }

  async getRemoteFileAsBlob(
    path: string,
    progressCallback?: ProgressCallback
  ): Promise<Blob> {
    const response = await fetch(this.buildRemotePath(path));

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get("Content-Length")) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      if (progressCallback) {
        progressCallback(receivedLength, contentLength);
      }
    }

    return new Blob(chunks as BlobPart[]);
  }

  // Helper method to check if a pose file exists
  async poseExists(poseUrl: string): Promise<boolean> {
    try {
      // Extract path from pose URL
      const url = new URL(poseUrl);
      const pathMatch = url.searchParams.get("text");
      if (!pathMatch) return false;

      // Check if the pose file exists in Firebase Storage
      const response = await fetch(poseUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Helper method to get pose data from URL
  async getPoseData(poseUrl: string): Promise<Record<string, unknown> | Blob> {
    try {
      const response = await fetch(poseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch pose data: ${response.statusText}`);
      }

      // The response might be JSON pose data or a binary file
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return response.json();
      } else {
        return response.blob();
      }
    } catch (error) {
      console.error("Failed to get pose data:", error);
      throw error;
    }
  }
}
