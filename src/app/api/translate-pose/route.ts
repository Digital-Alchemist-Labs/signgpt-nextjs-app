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

// Helper function to add CORS headers (generic to preserve response type)
function addCorsHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

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
      const errorResponse = NextResponse.json(
        { error: "Missing required parameters: text, spokenLanguage, signedLanguage" },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
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
        "Accept": "application/pose, application/x-pose, application/octet-stream, application/json, */*",
        "User-Agent": "SignGPT-NextJS/1.0",
        "Origin": "https://sign.mt",
        "Referer": "https://sign.mt/",
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      console.error("Sign.MT API error:", response.status, response.statusText);
      const errorResponse = NextResponse.json(
        { 
          error: `Sign.MT API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
      return addCorsHeaders(errorResponse);
    }

    const contentType = response.headers.get("content-type");
    console.log("Response content-type:", contentType);

    // Handle different response types
    if (contentType?.includes("application/json")) {
      // JSON response - might contain pose data or URL
      const data = await response.json();
      const jsonResponse = NextResponse.json(data);
      return addCorsHeaders(jsonResponse);
    } else if (
      contentType?.includes("application/octet-stream") || 
      contentType?.includes("application/x-pose") ||
      contentType?.includes("application/pose") ||  // Sign.MT uses this!
      !contentType  // Sometimes no content-type is set for binary
    ) {
      // Binary pose data - convert to base64 for JSON transport
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      
      console.log("Pose data received:", {
        contentType,
        size: arrayBuffer.byteLength,
        base64Length: base64.length,
      });
      
      const jsonResponse = NextResponse.json({
        pose: base64,
        contentType: contentType || "application/pose",
      });
      return addCorsHeaders(jsonResponse);
    } else {
      // Try to handle as binary anyway (some APIs don't set proper content-type)
      try {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          console.log("Treating unexpected content-type as binary:", {
            contentType,
            size: arrayBuffer.byteLength,
          });
          
          const jsonResponse = NextResponse.json({
            pose: base64,
            contentType: contentType || "application/pose",
          });
          return addCorsHeaders(jsonResponse);
        }
      } catch {
        // Not binary, try text
      }
      
      // Last resort: try to get as text
      const text = await response.text();
      console.warn("Unexpected content type:", contentType, "Response:", text.substring(0, 200));
      
      const errorResponse = NextResponse.json({
        error: `Unexpected content type: ${contentType}`,
        rawResponse: text.substring(0, 500),
      }, { status: 500 });
      return addCorsHeaders(errorResponse);
    }
  } catch (error) {
    console.error("Translate pose proxy error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorResponse = NextResponse.json(
      { 
        error: "Failed to translate to pose",
        details: errorMessage,
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

// GET method for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get("text");
  const spoken = searchParams.get("spoken") || "en";
  const signed = searchParams.get("signed") || "ase";

  if (!text) {
    const errorResponse = NextResponse.json(
      { error: "Missing required parameter: text" },
      { status: 400 }
    );
    return addCorsHeaders(errorResponse);
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

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

