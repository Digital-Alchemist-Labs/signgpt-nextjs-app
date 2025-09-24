"use client";

import React from "react";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface RecognitionResult {
  recognized_word: string;
  confidence: number;
  timestamp: number;
}

interface ResultDisplayProps {
  result: RecognitionResult | null;
  isProcessing: boolean;
  frameCount: number;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  isProcessing,
  frameCount,
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
        <h3 className="text-xl font-semibold mb-2">
          Recognizing Sign Language...
        </h3>
        <p className="text-blue-200">Please wait a moment</p>
        <div className="mt-4 text-sm text-blue-300">
          Processed frames: {frameCount}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <Clock className="w-12 h-12 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Waiting</h3>
        <p className="text-blue-200 text-center">
          Record sign language gestures
          <br />
          then press the recognition button
        </p>
        {frameCount > 0 && (
          <div className="mt-4 text-sm text-blue-300">
            Collected frames: {frameCount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 인식 결과 */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">
            Recognition Complete
          </h3>
        </div>

        {result.recognized_word ? (
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {result.recognized_word}
            </div>
            <div className="text-blue-200">Recognized Sign</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 mb-2">
              Recognition Failed
            </div>
            <div className="text-red-300">
              Could not recognize sign language
            </div>
          </div>
        )}
      </div>

      {/* 신뢰도 정보 */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-white font-medium mb-3">Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Confidence</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${getConfidenceColor(
                  result.confidence
                )}`}
              >
                {(result.confidence * 100).toFixed(1)}%
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  result.confidence >= 0.8
                    ? "bg-green-500/20 text-green-400"
                    : result.confidence >= 0.6
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {getConfidenceLabel(result.confidence)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-200">Recognition Time</span>
            <span className="text-white font-mono text-sm">
              {formatTimestamp(result.timestamp)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-200">Processed Frames</span>
            <span className="text-white">{frameCount}</span>
          </div>
        </div>
      </div>

      {/* 신뢰도 바 */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-200 text-sm">Confidence Level</span>
          <span className="text-white text-sm">
            {(result.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              result.confidence >= 0.8
                ? "bg-green-400"
                : result.confidence >= 0.6
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
            style={{ width: `${result.confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 인식 팁 */}
      {result.confidence < 0.6 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <h4 className="text-orange-300 font-medium mb-1">
                Recognition Tips
              </h4>
              <ul className="text-orange-200 text-sm space-y-1">
                <li>• Make sure both hands are clearly visible on screen</li>
                <li>• Try in a well-lit environment</li>
                <li>• Perform gestures slowly and clearly</li>
                <li>• Maintain appropriate distance from camera</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
