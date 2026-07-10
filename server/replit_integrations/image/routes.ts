import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../../replitAuth";
import { aiLimiter } from "../../middleware/rateLimiter";
import { openai } from "./client";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(["1024x1024", "512x512", "256x256"]).optional().default("1024x1024"),
});

export function registerImageRoutes(app: Express): void {
  // Requires authentication and strict AI rate limiting
  app.post("/api/generate-image", isAuthenticated, aiLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = generateImageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      const { prompt, size } = parsed.data;

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size,
      });

      const imageData = response.data?.[0];
      res.json({
        url: imageData?.url,
        b64_json: imageData?.b64_json,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}
