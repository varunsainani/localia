import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { logAudit } from "../lib/audit";
import { ownerProvider } from "../lib/serialize";
import { uniqueProviderSlug } from "../lib/slug";
import { uploadImage, uploadsConfigured } from "../lib/upload";

const includeCategories = { categories: { include: { category: true } } } as const;

const upsertSchema = z.object({
  businessName: z.string().min(1, "validation.provider.businessNameRequired").max(120),
  headline: z.string().min(1, "validation.provider.headlineRequired").max(160),
  about: z.string().min(1, "validation.provider.aboutRequired").max(4000),
  services: z.array(z.string().min(1).max(80)).max(20).default([]),
  categorySlugs: z.array(z.string().min(1)).min(1, "validation.provider.categoriesRequired"),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v ? v.replace(/[^\d]/g, "") : v)),
  addressLine: z.string().max(200).optional().nullable(),
  city: z.string().min(1, "validation.provider.cityRequired").max(120),
  region: z.string().max(120).optional().nullable(),
  country: z.string().max(80).default(""),
  lat: z.coerce.number().min(-90, "validation.provider.latRange").max(90, "validation.provider.latRange"),
  lng: z.coerce
    .number()
    .min(-180, "validation.provider.lngRange")
    .max(180, "validation.provider.lngRange"),
  availability: z.enum(["AVAILABLE", "BUSY", "BY_APPOINTMENT"], {
    errorMap: () => ({ message: "validation.provider.invalidAvailability" }),
  }),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  photos: z.array(z.string().url()).max(12).optional(),
});

// Material fields whose change requires re-review (resets status to PENDING).
// Non-material (avatar/cover/photos/phone/whatsapp/address) edits do not.
const MATERIAL_FIELDS = [
  "businessName",
  "headline",
  "about",
  "services",
  "city",
  "region",
  "country",
  "lat",
  "lng",
] as const;

// GET /me/provider
export const getMyProvider = asyncHandler(async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.userId! },
    include: includeCategories,
  });
  res.json({ provider: provider ? ownerProvider(provider, req.locale) : null });
});

// PUT /me/provider — create or update. Resets status to PENDING on first save
// or whenever a material field changes; pure cosmetic edits keep the status.
export const upsertMyProvider = asyncHandler(async (req, res) => {
  const data = upsertSchema.parse(req.body);

  // Resolve category slugs -> ids and validate them.
  const categories = await prisma.category.findMany({
    where: { slug: { in: data.categorySlugs } },
    select: { id: true, slug: true },
  });
  if (categories.length !== new Set(data.categorySlugs).size) {
    throw new HttpError(422, "errors.provider.invalidCategories", { code: "INVALID_CATEGORIES" });
  }
  const categoryIds = categories.map((c) => c.id);

  const existing = await prisma.provider.findUnique({ where: { userId: req.userId! } });

  const scalar = {
    businessName: data.businessName,
    headline: data.headline,
    about: data.about,
    services: data.services,
    phone: data.phone ?? null,
    whatsapp: data.whatsapp ?? null,
    addressLine: data.addressLine ?? null,
    city: data.city,
    region: data.region ?? null,
    country: data.country,
    lat: data.lat,
    lng: data.lng,
    availability: data.availability,
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    ...(data.photos != null ? { photos: data.photos } : {}),
  };

  let provider;
  if (!existing) {
    const slug = await uniqueProviderSlug(data.businessName);
    provider = await prisma.provider.create({
      data: {
        userId: req.userId!,
        slug,
        ...scalar,
        photos: data.photos ?? [],
        status: "PENDING",
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      },
      include: includeCategories,
    });
    await logAudit({
      actorId: req.userId,
      action: "provider.created",
      targetId: provider.id,
      meta: { slug },
    });
  } else {
    // Did any material field change?
    const materialChanged = MATERIAL_FIELDS.some((f) => {
      const next = (scalar as Record<string, unknown>)[f];
      const prev = (existing as Record<string, unknown>)[f];
      return JSON.stringify(next) !== JSON.stringify(prev);
    });
    // Also treat category changes as material.
    const prevCatIds = await prisma.providerCategory.findMany({
      where: { providerId: existing.id },
      select: { categoryId: true },
    });
    const catChanged =
      new Set(prevCatIds.map((c) => c.categoryId)).size !== categoryIds.length ||
      categoryIds.some((id) => !prevCatIds.find((c) => c.categoryId === id));

    const resetReview = materialChanged || catChanged;

    provider = await prisma.provider.update({
      where: { id: existing.id },
      data: {
        ...scalar,
        ...(resetReview ? { status: "PENDING", rejectionReason: null } : {}),
        categories: {
          deleteMany: {},
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: includeCategories,
    });
    await logAudit({
      actorId: req.userId,
      action: "provider.updated",
      targetId: provider.id,
      meta: { resetReview },
    });
  }

  res.json({ provider: ownerProvider(provider, req.locale) });
});

// POST /me/provider/submit — explicitly (re)submit for review.
export const submitMyProvider = asyncHandler(async (req, res) => {
  const existing = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  if (!existing) throw new HttpError(404, "errors.provider.profileRequired", { code: "NO_PROFILE" });

  const provider = await prisma.provider.update({
    where: { id: existing.id },
    data: { status: "PENDING", rejectionReason: null },
    include: includeCategories,
  });
  await logAudit({ actorId: req.userId, action: "provider.submitted", targetId: provider.id });
  res.json({ provider: ownerProvider(provider, req.locale) });
});

// POST /me/provider/photo — multipart upload via Vercel Blob.
export const uploadProviderPhoto = asyncHandler(async (req, res) => {
  if (!uploadsConfigured()) {
    throw new HttpError(503, "errors.upload.notConfigured", { code: "UPLOADS_NOT_CONFIGURED" });
  }
  const file = req.file;
  if (!file) throw new HttpError(400, "errors.upload.noFile", { code: "NO_FILE" });
  if (!file.mimetype.startsWith("image/")) {
    throw new HttpError(400, "errors.upload.invalidType", { code: "INVALID_TYPE" });
  }
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_") || "photo";
  const url = await uploadImage(`providers/${req.userId}/${safeName}`, file.buffer, file.mimetype);
  res.json({ url });
});

// GET /me/provider/stats
export const getMyProviderStats = asyncHandler(async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.userId! },
    select: { views: true, ratingAvg: true, reviewCount: true, status: true },
  });
  if (!provider) throw new HttpError(404, "errors.provider.profileRequired", { code: "NO_PROFILE" });
  res.json({
    views: provider.views,
    ratingAvg: Math.round(provider.ratingAvg * 10) / 10,
    reviewCount: provider.reviewCount,
    status: provider.status,
  });
});
