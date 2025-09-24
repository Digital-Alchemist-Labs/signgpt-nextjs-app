import { NextRequest, NextResponse } from "next/server";
import { getServerEnvironment } from "@/config/environment";

// API Routes는 동적 렌더링이 필요함
export const dynamic = "force-dynamic";

// 수어 인식 API 프록시
export async function POST(request: NextRequest) {
  try {
    const serverConfig = getServerEnvironment();
    const body = await request.json();

    // 서버에서 실제 SignGPT API로 요청 프록시
    const response = await fetch(
      `${serverConfig.signGptClientUrl}/api/recognize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sign recognition API proxy error:", error);
    return NextResponse.json(
      { error: "Sign recognition request failed" },
      { status: 500 }
    );
  }
}

// API 상태 확인
export async function GET() {
  try {
    const serverConfig = getServerEnvironment();

    // 서버 상태 확인
    const response = await fetch(`${serverConfig.signGptClientUrl}/health`, {
      method: "GET",
      timeout: 5000,
    });

    return NextResponse.json({
      status: response.ok ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
