import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";
const PROMPT =
  "Transform this photo into a fun, friendly cartoon caricature portrait. Keep the same people, poses, and clothes. Clean lines, vibrant colors. No extra people, no text, no watermark.";

type GeminiPart = {
  text?: string;
  inline_data?: { data?: string; mime_type?: string };
  inlineData?: { data?: string; mimeType?: string };
};

function stripDataUrl(input: string): string {
  const trimmed = input.trim();
  const comma = trimmed.indexOf(",");
  if (trimmed.startsWith("data:") && comma >= 0) return trimmed.slice(comma + 1);
  return trimmed.replace(/\s/g, "");
}

function imageFromParts(parts: GeminiPart[] | undefined): {
  data: string;
  mimeType: string;
} | null {
  if (!parts) return null;
  for (const part of parts) {
    const snake = part.inline_data;
    if (snake?.data) {
      return { data: snake.data, mimeType: snake.mime_type || "image/jpeg" };
    }
    const camel = part.inlineData;
    if (camel?.data) {
      return { data: camel.data, mimeType: camel.mimeType || "image/jpeg" };
    }
  }
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method-not-allowed" }, 405);
  }

  try {
    const body = (await req.json()) as { imageBase64?: unknown };
    const raw = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const imageBase64 = stripDataUrl(raw);
    if (!imageBase64) {
      return json({ error: "missing-image" }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return json({ error: "missing-gemini-key" }, 500);
    }

    const modelName = Deno.env.get("GEMINI_IMAGE_MODEL") || DEFAULT_MODEL;
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error", geminiRes.status, errText);
      return json({ error: "gemini-failed" }, 502);
    }

    const data = await geminiRes.json();
    const image = imageFromParts(data?.candidates?.[0]?.content?.parts as GeminiPart[]);
    if (!image) {
      console.error("Gemini returned no image", JSON.stringify(data).slice(0, 500));
      return json({ error: "no-image" }, 502);
    }

    return json({
      caricatureBase64: image.data,
      mimeType: image.mimeType,
    });
  } catch (error) {
    console.error(error);
    return json({ error: "caricature-failed" }, 500);
  }
});
