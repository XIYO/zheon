// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { corsError, corsResponse, corsValidation } from "../_shared/cors.ts";

// Request/Response TypeScript interfaces
interface GeminiRequest {
  prompt: string;
}

interface GeminiResponse {
  message: string;
  response: string;
  model: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
}

// Input validation and sanitization
function validateAndSanitizeInput(body: unknown): {
  isValid: boolean;
  prompt?: string;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Request body must be a JSON object" };
  }

  const { prompt } = body as Record<string, unknown>;

  if (!prompt) {
    return { isValid: false, error: "Missing required field: prompt" };
  }

  if (typeof prompt !== "string") {
    return { isValid: false, error: "Prompt must be a string" };
  }

  if (prompt.trim().length === 0) {
    return { isValid: false, error: "Prompt cannot be empty" };
  }

  if (prompt.length > 10000) {
    return { isValid: false, error: "Prompt too long (max 10,000 characters)" };
  }

  // Basic sanitization - remove potential harmful content
  const sanitizedPrompt = prompt
    .trim()
    // deno-lint-ignore no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .slice(0, 10000); // Ensure max length

  return { isValid: true, prompt: sanitizedPrompt };
}

console.log("Gemini Edge Function initialized successfully");

Deno.serve(async (req: Request): Promise<Response> => {
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return corsError("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    // Validate and sanitize input
    const validation = validateAndSanitizeInput(body);
    if (!validation.isValid) {
      console.error("Input validation failed:", validation.error);
      return corsError(
        validation.error || "Validation failed",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { prompt } = validation as { prompt: string };

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY environment variable not set");
      return corsError("Gemini API key not configured", "MISSING_API_KEY", 500);
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log(
      `Processing Gemini request with prompt length: ${prompt.length}`,
    );

    // Generate content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let result;
    try {
      result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
    } catch (genError: unknown) {
      clearTimeout(timeoutId);

      // Type guard for Error objects
      const isError = genError instanceof Error;
      const errorName = isError ? genError.name : String(genError);
      const errorMessage = isError ? genError.message : String(genError);

      if (errorName === "AbortError") {
        console.error("Gemini API timeout");
        return corsError(
          "Request timeout - Gemini API took too long to respond",
          "TIMEOUT_ERROR",
          504,
        );
      }

      // Handle specific Gemini API errors
      let responseMessage = "Failed to generate content";
      let statusCode = 500;
      let errorCode = "GEMINI_ERROR";

      if (errorMessage) {
        if (errorMessage.includes("API_KEY_INVALID")) {
          responseMessage = "Invalid Gemini API key";
          statusCode = 401;
          errorCode = "INVALID_API_KEY";
        } else if (errorMessage.includes("QUOTA_EXCEEDED")) {
          responseMessage = "Gemini API quota exceeded";
          statusCode = 429;
          errorCode = "QUOTA_EXCEEDED";
        } else if (errorMessage.includes("SAFETY")) {
          responseMessage = "Content filtered by Gemini safety systems";
          statusCode = 400;
          errorCode = "SAFETY_FILTER";
        } else {
          responseMessage = errorMessage;
        }
      }

      console.error("Gemini API error:", genError);
      return corsError(responseMessage, errorCode, statusCode);
    }

    // Extract response text
    const responseText = result.response.text();

    if (!responseText) {
      console.error("Empty response from Gemini API");
      return corsError("Empty response from Gemini API", "EMPTY_RESPONSE", 500);
    }

    console.log(
      `Successfully generated response with length: ${responseText.length}`,
    );

    // Prepare successful response
    const response: GeminiResponse = {
      message: "Content generated successfully",
      response: responseText,
      model: "gemini-1.5-flash",
      timestamp: new Date().toISOString(),
    };

    return corsResponse(response);
  } catch (error) {
    console.error("Unexpected error in hello-gemini function:", error);
    return corsError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

/* Usage Examples:

  Local Development:
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-gemini' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"Explain quantum computing in simple terms"}'

  Production:
  curl -i --location --request POST 'https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-gemini' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"Write a haiku about programming"}'

  JavaScript/TypeScript client:
  const { data, error } = await supabase.functions.invoke('hello-gemini', {
    body: {
      prompt: 'Tell me a joke about developers'
    }
  })

*/
