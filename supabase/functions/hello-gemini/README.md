# Hello Gemini Edge Function

A production-ready Supabase Edge Function that integrates with Google's Gemini
AI API to generate content based on user prompts.

## Features

- ✅ **Direct Gemini Integration**: Uses Google's Generative AI SDK (not
  LangChain)
- ✅ **Production Ready**: Comprehensive error handling and validation
- ✅ **TypeScript Support**: Full type safety with proper interfaces
- ✅ **CORS Enabled**: Supports cross-origin requests
- ✅ **Input Validation**: Sanitizes and validates user input
- ✅ **Timeout Protection**: 30-second timeout with abort controller
- ✅ **Proper HTTP Status Codes**: RESTful error responses
- ✅ **Security**: Environment variable protection for API keys
- ✅ **Logging**: Console logging for debugging and monitoring

## API Specification

### Request

**Method:** `POST`\
**Content-Type:** `application/json`

```json
{
  "prompt": "Your text prompt here"
}
```

### Response

**Success (200):**

```json
{
  "message": "Content generated successfully",
  "response": "Generated content from Gemini",
  "model": "gemini-1.5-flash",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error (4xx/5xx):**

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Codes

| Code                 | Status | Description                        |
| -------------------- | ------ | ---------------------------------- |
| `METHOD_NOT_ALLOWED` | 405    | Only POST requests are allowed     |
| `INVALID_JSON`       | 400    | Request body is not valid JSON     |
| `VALIDATION_ERROR`   | 400    | Input validation failed            |
| `MISSING_API_KEY`    | 500    | GEMINI_API_KEY not configured      |
| `INVALID_API_KEY`    | 401    | Gemini API key is invalid          |
| `QUOTA_EXCEEDED`     | 429    | Gemini API quota exceeded          |
| `SAFETY_FILTER`      | 400    | Content filtered by safety systems |
| `TIMEOUT_ERROR`      | 504    | Request timeout (30s limit)        |
| `EMPTY_RESPONSE`     | 500    | Gemini returned empty response     |
| `GEMINI_ERROR`       | 500    | General Gemini API error           |
| `INTERNAL_ERROR`     | 500    | Unexpected server error            |

## Input Validation

- **Required:** `prompt` field must be present
- **Type:** `prompt` must be a string
- **Length:** Maximum 10,000 characters
- **Content:** Control characters are removed for security

## Environment Variables

Set in Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage Examples

### cURL (Local Development)

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-gemini' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Explain quantum computing in simple terms"}'
```

### cURL (Production)

```bash
curl -i --location --request POST 'https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-gemini' \
  --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Write a haiku about programming"}'
```

### JavaScript/TypeScript

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://iefgdhwmgljjacafqomd.supabase.co",
  "your-anon-key",
);

const { data, error } = await supabase.functions.invoke("hello-gemini", {
  body: {
    prompt: "Tell me a joke about developers",
  },
});

if (error) {
  console.error("Error:", error);
} else {
  console.log("Generated:", data.response);
}
```

### Fetch API

```javascript
const response = await fetch(
  "https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/hello-gemini",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer your-anon-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Explain TypeScript benefits",
    }),
  },
);

const data = await response.json();
console.log(data.response);
```

## Development

### Local Testing

1. **Start Supabase:**
   ```bash
   supabase start
   ```

2. **Serve the function:**
   ```bash
   supabase functions serve hello-gemini
   ```

3. **Test the function:**
   ```bash
   # Run comprehensive tests
   deno test --allow-all --env-file=.env supabase/tests/hello-gemini-test.ts

   # Or use npm script
   pnpm edge:test:all:env
   ```

### Type Checking

```bash
# Check specific function
cd supabase/functions/hello-gemini && deno check index.ts

# Check all functions
pnpm edge:check
```

### Code Formatting

```bash
# Format code
pnpm edge:format

# Lint code
pnpm edge:lint
```

## Deployment

### Deploy with Environment Variables

```bash
# Set secrets and deploy (recommended)
pnpm edge:deploy:with-secrets

# Or deploy manually
pnpm edge:secrets:set
pnpm edge:deploy
```

### Deploy Specific Function

```bash
supabase functions deploy hello-gemini --project-ref iefgdhwmgljjacafqomd
```

## Monitoring

### View Logs

- **Dashboard:** Supabase Dashboard → Logs → Edge Functions
- **CLI:**
  ```bash
  supabase functions logs hello-gemini --project-ref iefgdhwmgljjacafqomd
  ```

### Performance Monitoring

The function includes comprehensive logging:

- Request processing time
- Input prompt length
- Generated response length
- Error details with timestamps

## Dependencies

- **Runtime:** Deno with Edge Runtime APIs
- **AI SDK:** `@google/generative-ai@^0.21.0`
- **Type Definitions:** `@supabase/functions-js@2.4.5`

## Security Considerations

1. **API Key Protection:** Never hardcode API keys in code
2. **Input Sanitization:** Control characters are stripped from input
3. **Rate Limiting:** Handled by Gemini API quotas
4. **CORS:** Configured for cross-origin access
5. **Timeout Protection:** 30-second request timeout
6. **Content Filtering:** Gemini's built-in safety systems

## Limitations

- **Execution Time:** 150 seconds (Supabase Edge Function limit)
- **Memory:** 512MB (Supabase Edge Function limit)
- **Payload:** 6MB max (Supabase Edge Function limit)
- **Input Length:** 10,000 characters (function-specific limit)
- **Timeout:** 30 seconds for Gemini API calls

## Troubleshooting

### Common Issues

1. **401 Error:** Check `GEMINI_API_KEY` in Supabase secrets
2. **429 Error:** Gemini API quota exceeded, wait or upgrade plan
3. **400 Safety Filter:** Content was filtered, try different prompt
4. **504 Timeout:** Gemini API took too long, try shorter/simpler prompt

### Debug Mode

Enable detailed logging by checking the function logs in Supabase Dashboard or
using the CLI.

## License

This function is part of the Zheon project and follows the same license terms.
