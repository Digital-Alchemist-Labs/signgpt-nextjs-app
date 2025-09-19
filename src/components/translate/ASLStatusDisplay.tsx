"use client";

import { type ASLRealtimeResult } from "@/services/ASLRealtimeService";

interface ASLStatusDisplayProps {
  result: ASLRealtimeResult;
  showProgressBar?: boolean;
  showTopK?: boolean;
  language?: "ko" | "en";
}

export default function ASLStatusDisplay({
  result,
  showProgressBar = true,
  showTopK = true,
  language = "en",
}: ASLStatusDisplayProps) {
  const renderProgressBar = (
    label: string,
    probability: number,
    color: string = "bg-blue-500"
  ) => {
    const percentage = Math.round(probability * 100);
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-300 mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`${color} h-3 rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStatusBadge = () => {
    const isSigningColor = result.isSigning ? "bg-green-600" : "bg-blue-600";
    const statusText = result.isSigning ? "SIGNING" : "LISTENING";

    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white ${isSigningColor} shadow-lg`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            result.isSigning ? "bg-green-300 animate-pulse" : "bg-blue-300"
          }`}
        />
        {statusText}
      </div>
    );
  };

  const renderRecognitionResult = () => {
    if (!result.meaning || !result.recognitionResult) {
      return null;
    }

    const confidence = result.recognitionResult.confidence * 100;

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Recognition Result
          </h3>
          <span className="text-sm text-gray-400">
            {confidence.toFixed(1)}% confidence
          </span>
        </div>

        <div className="text-2xl font-bold text-white mb-4">
          {result.meaning}
        </div>

        {showTopK &&
          result.recognitionResult.topK &&
          result.recognitionResult.topK.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Top Predictions:
              </h4>
              {result.recognitionResult.topK.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-gray-300">
                    {index + 1}. {item.gloss}
                  </span>
                  <span className="text-sm text-gray-400">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  };

  const renderPerformanceStats = () => {
    return (
      <div className="flex justify-between items-center text-sm text-gray-400 bg-gray-800 rounded px-3 py-2">
        <span>FPS: {result.fps?.toFixed(1) || "0.0"}</span>
        <span>•</span>
        <span>
          Probability: {(result.signingProbability * 100).toFixed(1)}%
        </span>
        <span>•</span>
        <span>Status: {result.isSigning ? "Active" : "Idle"}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex justify-center">{renderStatusBadge()}</div>

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          {renderProgressBar(
            "Signing Detection",
            result.signingProbability,
            result.isSigning ? "bg-green-500" : "bg-blue-500"
          )}
        </div>
      )}

      {/* Recognition Results */}
      {result.isSigning && renderRecognitionResult()}

      {/* Performance Stats */}
      {renderPerformanceStats()}
    </div>
  );
}
