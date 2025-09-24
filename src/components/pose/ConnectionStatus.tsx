"use client";

import React from "react";
import { Wifi, WifiOff, Server, AlertTriangle } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${
          isConnected
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}
      >
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <Server className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          ></div>
          <span className="text-sm font-medium">
            {isConnected ? "Server Connected" : "Server Disconnected"}
          </span>
        </div>

        {!isConnected && <AlertTriangle className="w-4 h-4" />}
      </div>
    </div>
  );
};

export default ConnectionStatus;
