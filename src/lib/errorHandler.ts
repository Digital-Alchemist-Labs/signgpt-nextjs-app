/**
 * Global error handler for AbortError and other common errors
 */

// Global AbortError handler
export const handleAbortError = (error: Error | unknown): boolean => {
  if (error instanceof Error) {
    // Check for AbortError
    if (error.name === "AbortError" || error.message.includes("aborted")) {
      console.warn("Request was aborted:", error.message);
      return true; // Error was handled
    }

    // Check for other common fetch errors
    if (error.message.includes("fetch")) {
      console.warn("Fetch error occurred:", error.message);
      return true;
    }
  }

  return false; // Error was not handled
};

// Enhanced fetch wrapper with AbortError handling
export const safeFetch = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (handleAbortError(error)) {
      // Return a mock response for aborted requests
      return new Response(JSON.stringify({ error: "Request aborted" }), {
        status: 408,
        statusText: "Request Timeout",
        headers: { "Content-Type": "application/json" },
      });
    }

    throw error;
  }
};

// Setup global error handlers
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      if (handleAbortError(event.reason)) {
        event.preventDefault();
      }
    });

    // Handle global errors
    window.addEventListener("error", (event) => {
      if (handleAbortError(event.error)) {
        event.preventDefault();
      }
    });
  }
};
