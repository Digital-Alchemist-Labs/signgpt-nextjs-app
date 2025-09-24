import { NextRequest, NextResponse } from "next/server";
import { getServerEnvironment } from "@/config/environment";

// API Routes는 동적 렌더링이 필요함
export const dynamic = "force-dynamic";

// 채팅 API 프록시
export async function POST(request: NextRequest) {
  try {
    const serverConfig = getServerEnvironment();
    const body = await request.json();

    console.log("🤖 Chat API proxy called with body:", body);

    // 서버에서 실제 SignGPT API로 요청 프록시
    const apiUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, "")}/chat`;
    console.log("🌐 Calling external API:", apiUrl);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🌐 External API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ External API error:", errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Chat API proxy response:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Chat API proxy error:", error);
    return NextResponse.json(
      {
        error: "Chat request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// API 상태 확인
export async function GET() {
  try {
    const serverConfig = getServerEnvironment();

    // 서버 상태 확인
    const healthUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, "")}/health`;
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      status: response.ok ? "healthy" : "unhealthy",
      endpoint: `${serverConfig.apiBaseUrl}/chat`,
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
