import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/config/environment";

// API Routes는 동적 렌더링이 필요함
export const dynamic = "force-dynamic";

// 헬스체크 API 프록시
export async function GET() {
  try {
    const serverConfig = getServerEnvironment();

    console.log(
      "🔍 Health check API called, checking:",
      serverConfig.apiBaseUrl
    );

    // 서버 상태 확인
    const healthUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, "")}/health`;
    console.log("🌐 Calling health URL:", healthUrl);
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = {
      status: response.ok ? "healthy" : "unhealthy",
      externalApiStatus: response.status,
      endpoint: `${serverConfig.apiBaseUrl}/health`,
      timestamp: new Date().toISOString(),
    };

    console.log("🔍 Health check result:", result);

    return NextResponse.json(result, {
      status: response.ok ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("❌ Health check API error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
