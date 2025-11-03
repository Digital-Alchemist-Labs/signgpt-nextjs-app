/**
 * API Route: Sign.MT Pose Translation Proxy
 * CORS 문제를 해결하기 위한 프록시 엔드포인트
 * Spoken text를 Sign Language Pose로 변환
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Sign.MT Cloud Function URL
const SIGN_MT_CLOUD_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SIGN_MT_CLOUD_FUNCTION_URL ||
  "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose";

interface TranslatePoseRequest {
  text: string;
  spokenLanguage: string; // e.g., 'en', 'ko'
  signedLanguage: string; // e.g., 'ase', 'ksl'
}

interface TranslatePoseResponse {
  pose?: unknown; // Pose data in sign.mt format
  poseUrl?: string; // URL to pose file if stored in Firebase
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TranslatePoseResponse>> {
  try {
    const body: TranslatePoseRequest = await request.json();
    const { text, spokenLanguage, signedLanguage } = body;

    if (!text || !spokenLanguage || !signedLanguage) {
      return NextResponse.json(
        { error: "Missing required parameters: text, spokenLanguage, signedLanguage" },
        { status: 400 }
      );
    }

    console.log("Translating to pose:", { text, spokenLanguage, signedLanguage });

    // Build Sign.MT Cloud Function URL with query parameters
    const url = new URL(SIGN_MT_CLOUD_FUNCTION_URL);
    url.searchParams.set("text", text);
    url.searchParams.set("spoken", spokenLanguage);
    url.searchParams.set("signed", signedLanguage);

    console.log("Fetching from Sign.MT:", url.toString());

    // Fetch from Sign.MT Cloud Function
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/octet-stream, application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      console.error("Sign.MT API error:", response.status, response.statusText);
      return NextResponse.json(
        { 
          error: `Sign.MT API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    console.log("Response content-type:", contentType);

    // Handle different response types
    if (contentType?.includes("application/json")) {
      // JSON response - might contain pose data or URL
      const data = await response.json();
      return NextResponse.json(data);
    } else if (contentType?.includes("application/octet-stream") || 
               contentType?.includes("application/x-pose")) {
      // Binary pose data - convert to base64 for JSON transport
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      
      return NextResponse.json({
        pose: base64,
        contentType: "application/x-pose",
      });
    } else {
      // Try to get as text
      const text = await response.text();
      console.warn("Unexpected content type:", contentType, "Response:", text.substring(0, 200));
      
      return NextResponse.json({
        error: `Unexpected content type: ${contentType}`,
        rawResponse: text.substring(0, 500),
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Translate pose proxy error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to translate to pose",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET method for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get("text");
  const spoken = searchParams.get("spoken") || "en";
  const signed = searchParams.get("signed") || "ase";

  if (!text) {
    return NextResponse.json(
      { error: "Missing required parameter: text" },
      { status: 400 }
    );
  }

  // Forward to POST handler
  const mockRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({
      text,
      spokenLanguage: spoken,
      signedLanguage: signed,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return POST(mockRequest);
}

