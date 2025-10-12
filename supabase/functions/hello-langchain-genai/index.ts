// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js@2.4.5/edge-runtime.d.ts";

// Import LangChain components
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai@^0.1.0";
import {
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core@0.3.66/messages";
import { ChatPromptTemplate } from "npm:@langchain/core@0.3.66/prompts";
import { corsError, corsResponse, corsValidation } from "../_shared/cors.ts";

console.log("Hello from LangChain GenAI Functions!");

// Define interfaces for type safety
interface RequestBody {
  prompt: string;
}

interface ResponseBody {
  message: string;
  response: string;
  model: string;
  framework: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const validation = corsValidation(req, ["POST"]);
  if (validation) return validation;

  try {
    // Validate environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return corsError(
        "API key configuration error - GEMINI_API_KEY environment variable is required",
        "MISSING_API_KEY",
        500,
      );
    }

    // Parse and validate request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return corsError("Invalid JSON in request body", "INVALID_JSON", 400);
    }

    // Validate prompt parameter
    const { prompt } = requestBody;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return corsError(
        "Invalid prompt parameter - Prompt must be a non-empty string",
        "INVALID_PROMPT",
        400,
      );
    }

    // Sanitize input (remove potentially harmful content)
    const sanitizedPrompt = prompt.trim().substring(0, 4000); // Limit length

    console.log(`Processing prompt: ${sanitizedPrompt.substring(0, 100)}...`);

    // Initialize LangChain ChatGoogleGenerativeAI
    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiApiKey,
      model: "gemini-1.5-flash", // Using latest flash model for speed
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    // Create a prompt template for better prompt engineering
    const promptTemplate = ChatPromptTemplate.fromMessages([
      new SystemMessage(
        "You are a helpful AI assistant. Provide clear, accurate, and concise responses.",
      ),
      new HumanMessage("{input}"),
    ]);

    // Format the prompt
    const formattedPrompt = await promptTemplate.format({
      input: sanitizedPrompt,
    });

    console.log("Calling Gemini API through LangChain...");

    // Make the API call with error handling
    let response: string;
    try {
      const result = await model.invoke(formattedPrompt);
      response = result.content as string;

      if (!response) {
        throw new Error("Empty response from Gemini API");
      }
    } catch (error) {
      console.error("Gemini API error:", error);

      // Check for specific API errors
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      if (errorMessage.includes("API_KEY_INVALID")) {
        return corsError(
          "Invalid API key - The provided Gemini API key is invalid",
          "INVALID_API_KEY",
          401,
        );
      }

      if (errorMessage.includes("QUOTA_EXCEEDED")) {
        return corsError(
          "API quota exceeded - Gemini API quota has been exceeded",
          "QUOTA_EXCEEDED",
          429,
        );
      }

      // Generic API error
      return corsError("Failed to generate response", "GEMINI_API_ERROR", 500);
    }

    console.log("Successfully generated response from Gemini API");

    // Prepare successful response
    const responseData: ResponseBody = {
      message: "Successfully processed prompt with LangChain and Gemini",
      response: response,
      model: "gemini-1.5-flash",
      framework: "langchain",
      timestamp: new Date().toISOString(),
    };

    return corsResponse(responseData);
  } catch (error) {
    console.error("Unexpected error:", error);
    return corsError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

/* To invoke locally:

  1. Set up environment variables in Dashboard -> Settings -> Edge Functions -> Secrets:
     - GEMINI_API_KEY: Your Google AI Studio API key

  2. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)

  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-langchain-genai' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"What is artificial intelligence?"}'

  Example successful response:
  {
    "message": "Successfully processed prompt with LangChain and Gemini",
    "response": "Artificial intelligence (AI) is a branch of computer science...",
    "model": "gemini-1.5-flash",
    "framework": "langchain",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }

  For production deployment:

  1. Deploy the function:
     supabase functions deploy hello-langchain-genai --project-ref iefgdhwmgljjacafqomd

  2. Set environment variables:
     supabase secrets set GEMINI_API_KEY=your_api_key_here --project-ref iefgdhwmgljjacafqomd

  3. Test production endpoint:
     curl -i --location --request POST 'https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-langchain-genai' \
       --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
       --header 'Content-Type: application/json' \
       --data '{"prompt":"Hello from production!"}'

*/
