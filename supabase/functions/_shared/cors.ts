/**
 * CORS Utility - Shared CORS Headers and Response Helpers
 *
 * Unified CORS handling for Edge Functions with validation pattern:
 * - corsValidation(): Handles preflight and method validation
 * - corsResponse(): Success responses with CORS headers
 * - corsError(): Error responses with CORS headers
 */

export interface CorsConfig {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
}

/**
 * Default CORS configuration for all Edge Functions
 */
export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: ["*"],
  allowedMethods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
  ],
};

/**
 * Generate CORS headers from configuration
 */
export function generateCorsHeaders(
  config: CorsConfig = DEFAULT_CORS_CONFIG,
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": config.allowedOrigins?.join(", ") || "*",
    "Access-Control-Allow-Headers": config.allowedHeaders?.join(", ") ||
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": config.allowedMethods?.join(", ") ||
      "POST, GET, OPTIONS",
  };
}

/**
 * Create a JSON response with CORS headers
 */
export function corsResponse(
  data: unknown,
  status: number = 200,
  config: CorsConfig = DEFAULT_CORS_CONFIG,
): Response {
  const corsHeaders = generateCorsHeaders(config);

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}


/**
 * Create an error response with CORS headers
 */
export function corsError(
  error: string,
  code: string,
  status: number = 400,
  config: CorsConfig = DEFAULT_CORS_CONFIG,
): Response {
  return corsResponse(
    {
      error,
      code,
      timestamp: new Date().toISOString(),
    },
    status,
    config,
  );
}


/**
 * CORS validator - returns Response if request should be handled immediately, null to continue processing
 * 
 * This is the primary CORS validation function that:
 * 1. Handles OPTIONS preflight requests immediately
 * 2. Validates HTTP methods against allowed list
 * 3. Returns Response to terminate request chain or null to continue
 * 
 * Usage pattern:
 * ```typescript
 * const corsResponse = corsValidation(req);
 * if (corsResponse) return corsResponse; // Terminate chain
 * // Continue processing...
 * ```
 */
export function corsValidation(
  req: Request,
  allowedMethods: string[] = ["POST"],
  config: CorsConfig = DEFAULT_CORS_CONFIG,
): Response | null {
  // Handle CORS preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: generateCorsHeaders(config),
    });
  }

  // Validate allowed methods
  if (!allowedMethods.includes(req.method)) {
    return corsError(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405,
      config,
    );
  }

  return null;
}
