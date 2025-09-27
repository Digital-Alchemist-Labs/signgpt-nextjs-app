import { NextRequest, NextResponse } from "next/server";

// API Routes는 동적 렌더링이 필요함
export const dynamic = "force-dynamic";

// 채팅 API 프록시
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🤖 Chat API proxy called with body:", body);

    // Provide a fallback response for now
    const fallbackResponse = {
      response: "안녕하세요! SignGPT입니다. 현재 개발 모드에서 실행 중입니다.",
      signLanguageVideo: null,
      isOffline: false,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(fallbackResponse);
  } catch (error) {
    console.warn("⚠️ Chat API error:", error);

    // Provide a fallback response when error occurs
    const fallbackResponse = {
      response: "죄송합니다. 일시적인 오류가 발생했습니다.",
      signLanguageVideo: null,
      isOffline: true,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(fallbackResponse);
  }
}

// API 상태 확인
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/chat",
    timestamp: new Date().toISOString(),
  });
}
