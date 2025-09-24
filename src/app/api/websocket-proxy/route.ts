import { NextRequest, NextResponse } from "next/server";
import { getServerEnvironment } from "@/config/environment";

// WebSocket 프록시 정보를 제공하는 API 엔드포인트
export async function GET() {
  try {
    const serverConfig = getServerEnvironment();

    // 클라이언트에게 WebSocket 연결 정보 제공
    // 실제 내부 URL 대신 프록시된 URL이나 공개 URL만 제공
    return NextResponse.json({
      webSocketUrl:
        process.env.NODE_ENV === "development"
          ? serverConfig.webSocketUrl // 개발 환경에서만 직접 연결 허용
          : "/api/websocket", // 프로덕션에서는 프록시를 통해 연결
      isConnected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get WebSocket proxy info:", error);
    return NextResponse.json(
      { error: "Failed to get WebSocket configuration" },
      { status: 500 }
    );
  }
}
