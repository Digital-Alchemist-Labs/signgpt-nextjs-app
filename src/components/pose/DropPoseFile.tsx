"use client";

import React, { useState, useCallback } from "react";
import { useTranslation } from "@/contexts/TranslationContext";

export interface DropPoseFileProps {
  className?: string;
}

/**
 * DropPoseFile - Exact port from original translate project
 * Allows users to drag and drop .pose files for sign language animation
 */
export const DropPoseFile: React.FC<DropPoseFileProps> = ({
  className = "",
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const { handlePoseFileUpload } = useTranslation();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsHovering(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handlePoseFileUpload(files[0]);
      }
    },
    [handlePoseFileUpload]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handlePoseFileUpload(files[0]);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handlePoseFileUpload]
  );

  return (
    <div
      className={`drop-pose-file ${className} ${isHovering ? "hovering" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
        ${
          isHovering
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }
      `}
      >
        <input
          type="file"
          accept=".pose"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Select .pose file"
        />

        <div className="space-y-4">
          <div
            className={`text-6xl ${
              isHovering ? "text-blue-500" : "text-gray-400"
            } transition-colors`}
          >
            🤟
          </div>

          <div>
            <h3
              className={`text-lg font-medium ${
                isHovering
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300"
              } transition-colors`}
            >
              {isHovering ? "Drop your pose file here" : "Upload Pose File"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Drag and drop a{" "}
              <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                .pose
              </code>{" "}
              file here, or click to select
            </p>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500">
            Supported format: .pose files from sign language datasets
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropPoseFile;
