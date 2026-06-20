import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { CORS_ORIGIN } from "./lib/env";
import { locale } from "./middleware/locale";
import { errorHandler } from "./middleware/error";
import routes from "./routes";

export function createApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(helmet());
  app.use(
    cors({
      // Reflect the configured origin (single value or "*").
      origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: false,
    }),
  );
  // Resolve locale before the body parser so a malformed/oversized body still
  // produces a localized 400/413 (the parser error fires before later middleware).
  app.use(locale);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", routes);

  // Unmatched API paths -> localized 404.
  app.use("/api", (req, res) => {
    res.status(404).json({ error: { message: req.t("errors.common.notFound"), code: "NOT_FOUND" } });
  });

  app.use(errorHandler);
  return app;
}

export default createApp;
