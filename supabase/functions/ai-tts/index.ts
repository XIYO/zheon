import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { experimental_generateSpeech as generateSpeech } from "npm:ai@4";
import { elevenlabs } from "npm:@ai-sdk/elevenlabs@1";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  text: string;
  summaryId: string;
  section: "summary" | "insights";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "로그인이 필요합니다" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log("[AI-TTS] Request received");
    const { text, summaryId, section }: RequestBody = await req.json();
    console.log("[AI-TTS] Parsed:", {
      textLength: text?.length,
      summaryId,
      section,
    });

    if (!text || !summaryId || !section) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (text.length > 5000) {
      console.error(`[AI-TTS] Text too long: ${text.length} characters`);
      return new Response(
        JSON.stringify({ error: "Text exceeds maximum length of 5000 characters" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("[AI-TTS] Attempting to acquire work...");
    const { data: workAcquired, error: rpcError } = await supabase.rpc(
      "update_processing_status",
      {
        p_summary_id: summaryId,
        p_section: section,
      }
    );

    if (rpcError) {
      console.error("[AI-TTS] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ error: "Failed to acquire work", details: rpcError }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!workAcquired) {
      console.log("[AI-TTS] Work already being processed by another request");
      return new Response(null, {
        status: 202,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    console.log("[AI-TTS] Work acquired, starting TTS generation...");

    try {
      console.log("[AI-TTS] Calling ElevenLabs via Vercel AI SDK...");

      const { audio } = await generateSpeech({
        model: elevenlabs("eleven_flash_v2_5"),
        text: text,
        voice: "Rachel",
        apiKey: ELEVENLABS_API_KEY,
      });

      const audioBuffer = await audio.arrayBuffer();
      const audioData = new Uint8Array(audioBuffer);

      const fileName = `${summaryId}_${section}_${Date.now()}.mp3`;
      console.log(`[AI-TTS] Uploading to storage: ${fileName}`);

      const { error: uploadError } = await supabase.storage
        .from("tts-audio")
        .upload(fileName, audioData, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("[AI-TTS] Upload error:", uploadError);
        throw uploadError;
      }

      const audioUrlColumn = `${section}_audio_url` as
        | "summary_audio_url"
        | "insights_audio_url";
      const statusColumn = `${section}_audio_status` as
        | "summary_audio_status"
        | "insights_audio_status";

      const { error: dbUpdateError } = await supabase
        .from("summary")
        .update({
          [audioUrlColumn]: fileName,
          [statusColumn]: "completed",
        })
        .eq("id", summaryId);

      if (dbUpdateError) {
        console.error("[AI-TTS] DB update error:", dbUpdateError);
        throw dbUpdateError;
      }

      console.log("[AI-TTS] ✅ Successfully completed");

      return new Response(null, {
        status: 202,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (processingError) {
      console.error("[AI-TTS] Processing error:", processingError);

      const statusColumn = `${section}_audio_status` as
        | "summary_audio_status"
        | "insights_audio_status";

      await supabase
        .from("summary")
        .update({ [statusColumn]: "failed" })
        .eq("id", summaryId);

      throw processingError;
    }
  } catch (error) {
    console.error("[AI-TTS] Request error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
