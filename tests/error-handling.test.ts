import { describe, it, expect } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

// Exact replica of the global error handler in server/index.ts
function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
}

function buildTestApp() {
  const app = express();
  // Body size limit mirrors production
  app.use(express.json({ limit: "1mb" }));

  // Route that throws a raw unhandled Error
  app.get("/api/test/throw", (_req, _res, next) => {
    next(new Error("Unexpected internal failure"));
  });

  // Route that sets err.status = 400 (e.g. Zod/business logic error)
  app.get("/api/test/bad-request", (_req, _res, next) => {
    const err: any = new Error("providerId is required");
    err.status = 400;
    next(err);
  });

  // Route that accepts a POST body — used to test malformed JSON
  app.post("/api/test/echo", (req, res) => {
    res.json(req.body);
  });

  // Healthy route — proves the server is still up after errors
  app.get("/api/test/health", (_req, res) => res.json({ ok: true }));

  // Global error handler must be registered last
  app.use(globalErrorHandler);

  return app;
}

describe("Global Error Handler", () => {
  const app = buildTestApp();

  it("catches unhandled route errors and returns 500", async () => {
    const res = await request(app).get("/api/test/throw");
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ message: "Unexpected internal failure" });
  });

  it("honours err.status for client errors (400)", async () => {
    const res = await request(app).get("/api/test/bad-request");
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: "providerId is required" });
  });

  it("does not expose stack traces in the response body", async () => {
    const res = await request(app).get("/api/test/throw");
    expect(res.body).not.toHaveProperty("stack");
    expect(res.body).not.toHaveProperty("trace");
  });

  it("server keeps responding after an error — subsequent request succeeds", async () => {
    // Trigger an error
    await request(app).get("/api/test/throw");
    // Server should still be healthy
    const res = await request(app).get("/api/test/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });

  it("returns 400 for malformed JSON body", async () => {
    const res = await request(app)
      .post("/api/test/echo")
      .set("Content-Type", "application/json")
      .send('{ "unclosed": "bracket"'); // intentionally broken JSON
    expect(res.status).toBe(400);
  });

  it("returns 400 for a completely invalid JSON body", async () => {
    const res = await request(app)
      .post("/api/test/echo")
      .set("Content-Type", "application/json")
      .send("this is not json at all");
    expect(res.status).toBe(400);
  });
});
