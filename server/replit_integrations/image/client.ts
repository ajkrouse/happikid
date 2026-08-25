import OpenAI from "openai";
import { Buffer } from "node:buffer";
import { scrubTextForAI } from "../../services/aiPrivacy";

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Generate an image and return as Buffer.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024",
  options?: { aiDataConsent?: boolean },
): Promise<Buffer> {
  if (!options?.aiDataConsent) {
    throw new Error("External AI image generation requires explicit user consent.");
  }
  const scrubbedPrompt = scrubTextForAI(prompt, 1000);
  if (scrubbedPrompt.hadSensitiveContent || !scrubbedPrompt.text) {
    throw new Error("Image prompt contains personal or sensitive details and was not sent to the external AI service.");
  }
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: scrubbedPrompt.text,
    size,
  });
  const base64 = response.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function editImages(
  _imageFiles: string[],
  _prompt: string,
  _outputPath?: string,
): Promise<Buffer> {
  throw new Error("External AI image editing is disabled until HappiKid has a dedicated consent flow that can verify images contain no children, families, documents, or personal data.");
}

