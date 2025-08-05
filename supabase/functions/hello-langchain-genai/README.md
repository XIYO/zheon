# Hello LangChain GenAI Edge Function

A production-ready Supabase Edge Function that integrates Google's Gemini AI
through LangChain for natural language processing.

## Features

- 🤖 **LangChain Integration**: Uses `@langchain/google-genai` for structured AI
  interactions
- 🚀 **Gemini 1.5 Flash**: Latest Google AI model for fast, high-quality
  responses
- 🛡️ **Production Ready**: Comprehensive error handling, input validation, and
  CORS support
- 📝 **TypeScript**: Fully typed with proper interfaces and error handling
- 🎯 **Prompt Engineering**: Uses LangChain's ChatPromptTemplate for better
  responses
- 🔒 **Security**: Input sanitization and rate limiting considerations

## API Specification

### Endpoint

```
POST /functions/v1/hello-langchain-genai
```

### Request Body

```typescript
{
  "prompt": string  // Required: The prompt to send to Gemini AI (max 4000 chars)
}
```

### Response (Success)

```typescript
{
  "message": "Successfully processed prompt with LangChain and Gemini",
  "response": string,        // AI-generated response
  "model": "gemini-1.5-flash",
  "framework": "langchain",
  "timestamp": string        // ISO timestamp
}
```

### Response (Error)

```typescript
{
  "error": string,          // Error description
  "details"?: any,          // Additional error details
  "timestamp": string       // ISO timestamp
}
```

## Environment Variables

Set these in Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
GEMINI_API_KEY=your_google_ai_studio_api_key
```

## Usage Examples

### cURL

```bash
# Local development
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-langchain-genai' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"What is artificial intelligence?"}'

# Production
curl -i --location --request POST 'https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-langchain-genai' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Explain TypeScript in one sentence"}'
```

### JavaScript/TypeScript

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase.functions.invoke(
  "hello-langchain-genai",
  {
    body: {
      prompt: "What are the benefits of using LangChain with Gemini?",
    },
  },
);

if (error) {
  console.error("Error:", error);
} else {
  console.log("AI Response:", data.response);
  console.log("Model:", data.model);
  console.log("Framework:", data.framework);
}
```

### Python

```python
import requests
import json

url = "https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-langchain-genai"
headers = {
    "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
    "Content-Type": "application/json"
}
data = {
    "prompt": "Write a haiku about programming"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(f"Response: {result['response']}")
print(f"Model: {result['model']}")
```

## Error Handling

The function provides detailed error responses for common scenarios:

| Status | Error                        | Description               |
| ------ | ---------------------------- | ------------------------- |
| 400    | Invalid prompt parameter     | Empty or missing prompt   |
| 400    | Invalid JSON in request body | Malformed JSON            |
| 401    | Invalid API key              | GEMINI_API_KEY is invalid |
| 405    | Method not allowed           | Non-POST request          |
| 429    | API quota exceeded           | Gemini API rate limit     |
| 500    | Internal server error        | Unexpected errors         |

## Development

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve hello-langchain-genai

# Run tests
pnpm edge:test:all:env
# or
deno test --allow-all --env-file=.env supabase/tests/hello-langchain-genai-test.ts
```

### Type Checking

```bash
# Check TypeScript types
pnpm edge:check

# Format code
pnpm edge:format

# Lint code
pnpm edge:lint
```

### Deployment

```bash
# Deploy with secrets
pnpm edge:deploy:with-secrets

# Or deploy function only
pnpm edge:deploy hello-langchain-genai
```

## LangChain Features

This function demonstrates several LangChain capabilities:

1. **ChatGoogleGenerativeAI**: Structured interface to Gemini API
2. **ChatPromptTemplate**: Consistent prompt formatting with system/human
   messages
3. **Message Types**: SystemMessage and HumanMessage for conversation structure
4. **Error Handling**: LangChain-specific error handling and retries
5. **Configuration**: Model parameters like temperature and maxOutputTokens

## Security Considerations

- Input sanitization (4000 character limit)
- Environment variable validation
- CORS headers for cross-origin requests
- Proper error messages without exposing internals
- Rate limiting through API key quotas

## Performance

- Uses Gemini 1.5 Flash for optimal speed/quality balance
- Input length limited to 4000 characters
- Output limited to 1000 tokens
- Includes request/response logging for monitoring

## Testing

Comprehensive test suite covers:

- ✅ Successful prompt processing
- ✅ Input validation (empty/missing prompts)
- ✅ HTTP method validation
- ✅ CORS headers
- ✅ Error handling (invalid JSON, API errors)
- ✅ Edge cases (long prompts, special characters)
- ✅ LangChain framework verification

Run tests with:
`deno test --allow-all --env-file=.env supabase/tests/hello-langchain-genai-test.ts`
