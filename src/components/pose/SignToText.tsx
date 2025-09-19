"use client";

import React, { useCallback } from "react";
import { usePose } from "@/contexts/PoseContext";
import { useSignRecognition } from "@/contexts/SignRecognitionContext";
import VideoPoseProcessor from "@/components/pose/VideoPoseProcessor";
import { EstimatedPose } from "@/services/PoseService";

interface SignToTextProps {
  className?: string;
  onRecognized?: (text: string, confidence: number) => void;
}

export const SignToText: React.FC<SignToTextProps> = ({
  className = "",
  onRecognized,
}) => {
  const { state: poseState } = usePose();
  const { state: recState, load, updateFromPose } = useSignRecognition();

  const handlePoseDetected = useCallback(
    async (pose: EstimatedPose) => {
      if (!recState.loaded && !recState.loading) {
        await load();
      }
      const res = await updateFromPose(pose);
      if (res.gloss && onRecognized) onRecognized(res.gloss, res.confidence);
    },
    [recState.loaded, recState.loading, load, updateFromPose, onRecognized]
  );

  return (
    <div className={`sign-to-text flex flex-col gap-4 ${className}`}>
      <div className="rounded border p-3">
        <VideoPoseProcessor
          showPoseViewer={true}
          onPoseDetected={handlePoseDetected}
          autoStart={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded border">
          <div className="font-semibold mb-1">Recognizer Status</div>
          <div>
            Loaded:{" "}
            {recState.loaded ? "Yes" : recState.loading ? "Loading..." : "No"}
          </div>
          {recState.error && (
            <div className="text-red-600">Error: {recState.error}</div>
          )}
        </div>
        <div className="p-3 rounded border">
          <div className="font-semibold mb-1">Latest Prediction</div>
          <div>Gloss: {recState.lastResult?.gloss ?? "-"}</div>
          <div>
            Confidence:{" "}
            {recState.lastResult
              ? recState.lastResult.confidence.toFixed(3)
              : "-"}
          </div>
          {recState.lastResult?.top?.length ? (
            <ul className="mt-1 list-disc list-inside">
              {recState.lastResult.top.map((t) => (
                <li key={t.label}>
                  {t.label} ({t.probability.toFixed(2)})
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Pose Loaded: {poseState.isLoaded ? "Yes" : "No"} | Processing:{" "}
        {poseState.isProcessing ? "Yes" : "No"}
      </div>
    </div>
  );
};

export default SignToText;
