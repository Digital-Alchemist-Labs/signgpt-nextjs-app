"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SignRecognitionService,
  RecognitionResult,
} from "@/services/SignRecognitionService";
import { EstimatedPose } from "@/services/PoseService";

export interface SignRecognitionState {
  loaded: boolean;
  loading: boolean;
  lastResult: RecognitionResult | null;
  error: string | null;
}

interface SignRecognitionContextType {
  state: SignRecognitionState;
  service: SignRecognitionService;
  load: (opts?: { onnxPath?: string; classesPath?: string }) => Promise<void>;
  updateFromPose: (pose: EstimatedPose) => Promise<RecognitionResult>;
  reset: () => void;
}

const defaultState: SignRecognitionState = {
  loaded: false,
  loading: false,
  lastResult: null,
  error: null,
};

const SignRecognitionContext = createContext<
  SignRecognitionContextType | undefined
>(undefined);

export function useSignRecognition() {
  const ctx = useContext(SignRecognitionContext);
  if (!ctx)
    throw new Error(
      "useSignRecognition must be used within a SignRecognitionProvider"
    );
  return ctx;
}

export const SignRecognitionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<SignRecognitionState>(defaultState);
  const serviceRef = useRef(new SignRecognitionService(32, 3));
  const service = serviceRef.current;

  const load = useCallback(
    async (opts?: { onnxPath?: string; classesPath?: string }) => {
      if (state.loaded || state.loading) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        await service.load(opts);
        setState((s) => ({ ...s, loading: false, loaded: true }));
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Failed to load sign recognition model";
        setState((s) => ({ ...s, loading: false, loaded: false, error: msg }));
      }
    },
    [service, state.loaded, state.loading]
  );

  const updateFromPose = useCallback(
    async (pose: EstimatedPose) => {
      if (!service.loaded) await load();
      try {
        const result = await service.updateFromPose(pose);
        setState((s) => ({ ...s, lastResult: result }));
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign recognition failed";
        setState((s) => ({ ...s, error: msg }));
        throw e;
      }
    },
    [service, load]
  );

  const reset = useCallback(() => setState(defaultState), []);

  const value = useMemo<SignRecognitionContextType>(
    () => ({ state, service, load, updateFromPose, reset }),
    [state, service, load, updateFromPose, reset]
  );

  return (
    <SignRecognitionContext.Provider value={value}>
      {children}
    </SignRecognitionContext.Provider>
  );
};
