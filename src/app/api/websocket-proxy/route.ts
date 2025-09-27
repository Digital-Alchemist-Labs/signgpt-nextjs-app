import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/config/environment";

// API Routes는 동적 렌더링이 필요함
export const dynamic = "force-dynamic";

// WebSocket 프록시 정보를 제공하는 API 엔드포인트
export async function GET() {
  try {
    console.log("🔧 WebSocket proxy API called");
    const serverConfig = getServerEnvironment();

    const response = {
      webSocketUrl: serverConfig.webSocketUrl,
      isConnected: true,
      timestamp: new Date().toISOString(),
    };

    console.log("🔧 WebSocket proxy response:", response);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.warn("⚠️ WebSocket server configuration not available:", error);
    return NextResponse.json(
      {
        error: "WebSocket server not available",
        webSocketUrl: null,
        isConnected: false,
        message:
          "WebSocket functionality is currently unavailable. Chat will work in basic mode.",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503, // Service Unavailable instead of 500
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
