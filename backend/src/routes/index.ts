import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";
import { rateLimit } from "../middleware/rate-limit";
import * as auth from "../controllers/authController";
import * as categories from "../controllers/categoryController";
import * as providers from "../controllers/providerController";
import * as meProvider from "../controllers/meProviderController";
import * as client from "../controllers/clientController";
import * as admin from "../controllers/adminController";

const router = Router();

// Strict limiter for credential endpoints (brute-force / abuse defense):
// 10 requests / 15 min per IP. Looser limiter for the public search route:
// 60 requests / min per IP. Both are per-instance/best-effort on serverless.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, label: "auth" });
const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, label: "search" });

// --- Auth ------------------------------------------------------------------
router.post("/auth/register", authLimiter, auth.register);
router.post("/auth/login", authLimiter, auth.login);
router.post("/auth/refresh", authLimiter, auth.refresh);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);

// --- Categories (public) ---------------------------------------------------
router.get("/categories", categories.listCategories);

// --- Provider self (PROVIDER) ---------------------------------------------
// NOTE: declared before the public "/providers/:slug" routes so the literal
// "/me/provider/*" paths are never shadowed.
router.get("/me/provider", requireAuth, requireRole("PROVIDER"), meProvider.getMyProvider);
router.put("/me/provider", requireAuth, requireRole("PROVIDER"), meProvider.upsertMyProvider);
router.post("/me/provider/submit", requireAuth, requireRole("PROVIDER"), meProvider.submitMyProvider);
router.post(
  "/me/provider/photo",
  requireAuth,
  requireRole("PROVIDER"),
  uploadSingle,
  meProvider.uploadProviderPhoto,
);
router.get("/me/provider/stats", requireAuth, requireRole("PROVIDER"), meProvider.getMyProviderStats);

// --- Client favorites + reviews (CLIENT) -----------------------------------
router.get("/me/favorites", requireAuth, requireRole("CLIENT"), client.listFavorites);
router.post("/me/favorites/:providerId", requireAuth, requireRole("CLIENT"), client.addFavorite);
router.delete("/me/favorites/:providerId", requireAuth, requireRole("CLIENT"), client.removeFavorite);

// --- Admin (ADMIN) ---------------------------------------------------------
const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));
adminRouter.get("/stats", admin.adminStats);
adminRouter.get("/providers", admin.adminListProviders);
adminRouter.get("/queue", admin.adminQueue);
adminRouter.post("/providers/:id/approve", admin.adminApprove);
adminRouter.post("/providers/:id/reject", admin.adminReject);
adminRouter.patch("/providers/:id", admin.adminPatchProvider);
adminRouter.get("/categories", admin.adminListCategories);
adminRouter.post("/categories", admin.adminCreateCategory);
adminRouter.put("/categories/:id", admin.adminUpdateCategory);
adminRouter.delete("/categories/:id", admin.adminDeleteCategory);
adminRouter.get("/audit", admin.adminAudit);
router.use("/admin", adminRouter);

// --- Providers (public) ----------------------------------------------------
router.get("/providers", searchLimiter, providers.searchProviders);
router.get("/providers/:slug/reviews", providers.getProviderReviews);
router.get("/providers/:slug", providers.getProvider);
// Client posts a review for a provider (by slug).
router.post(
  "/providers/:slug/reviews",
  requireAuth,
  requireRole("CLIENT"),
  client.createReview,
);

export default router;
