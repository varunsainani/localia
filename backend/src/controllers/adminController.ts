import { Prisma } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import prisma from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { logAudit } from "../lib/audit";
import { providerCard, publicCategory, publicAudit, categoryName } from "../lib/serialize";

const includeCategories = { categories: { include: { category: true } } } as const;

// GET /admin/stats — directory-wide overview.
export const adminStats = asyncHandler(async (req, res) => {
  const [totalProviders, pending, approved, rejected, clients, byCategoryRows, recent, topRated] =
    await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { status: "PENDING" } }),
      prisma.provider.count({ where: { status: "APPROVED" } }),
      prisma.provider.count({ where: { status: "REJECTED" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.providerCategory.groupBy({
        by: ["categoryId"],
        where: { provider: { status: "APPROVED" } },
        _count: { categoryId: true },
      }),
      prisma.provider.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: includeCategories,
      }),
      prisma.provider.findMany({
        where: { status: "APPROVED", reviewCount: { gt: 0 } },
        orderBy: [{ ratingAvg: "desc" }, { reviewCount: "desc" }],
        take: 6,
        include: includeCategories,
      }),
    ]);

  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const countById = new Map(byCategoryRows.map((r) => [r.categoryId, r._count.categoryId]));
  const byCategory = cats.map((c) => ({
    slug: c.slug,
    name: categoryName(c, req.locale),
    count: countById.get(c.id) ?? 0,
  }));

  res.json({
    totalProviders,
    pending,
    approved,
    rejected,
    clients,
    byCategory,
    recent: recent.map((p) => providerCard(p, req.locale)),
    topRated: topRated.map((p) => providerCard(p, req.locale)),
  });
});

const listQuery = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /admin/providers — filter by status + search, paginated.
export const adminListProviders = asyncHandler(async (req, res) => {
  const { status, q, page, pageSize } = listQuery.parse(req.query);

  const where: Prisma.ProviderWhereInput = {};
  if (status) where.status = status;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { businessName: { contains: term, mode: "insensitive" } },
      { headline: { contains: term, mode: "insensitive" } },
      { city: { contains: term, mode: "insensitive" } },
      { user: { email: { contains: term, mode: "insensitive" } } },
    ];
  }

  const [total, providers] = await Promise.all([
    prisma.provider.count({ where }),
    prisma.provider.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: includeCategories,
    }),
  ]);

  res.json({
    items: providers.map((p) => providerCard(p, req.locale)),
    total,
    page,
    pageSize,
  });
});

// GET /admin/queue — pending providers awaiting review.
export const adminQueue = asyncHandler(async (req, res) => {
  const providers = await prisma.provider.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: includeCategories,
  });
  res.json({ items: providers.map((p) => providerCard(p, req.locale)), total: providers.length });
});

async function findProviderOr404(id: string) {
  const provider = await prisma.provider.findUnique({ where: { id }, include: includeCategories });
  if (!provider) throw new HttpError(404, "errors.provider.notFound", { code: "NOT_FOUND" });
  return provider;
}

// POST /admin/providers/:id/approve
export const adminApprove = asyncHandler(async (req, res) => {
  await findProviderOr404(req.params.id);
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: { status: "APPROVED", rejectionReason: null },
    include: includeCategories,
  });
  await logAudit({ actorId: req.userId, action: "admin.provider.approved", targetId: provider.id });
  res.json({ provider: providerCard(provider, req.locale) });
});

const rejectSchema = z.object({
  reason: z.string().min(1, "validation.common.required").max(500),
});

// POST /admin/providers/:id/reject
export const adminReject = asyncHandler(async (req, res) => {
  await findProviderOr404(req.params.id);
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "errors.admin.reasonRequired", { code: "REASON_REQUIRED" });
  }
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason },
    include: includeCategories,
  });
  await logAudit({
    actorId: req.userId,
    action: "admin.provider.rejected",
    targetId: provider.id,
    meta: { reason: parsed.data.reason },
  });
  res.json({ provider: providerCard(provider, req.locale) });
});

const patchSchema = z.object({
  featured: z.boolean().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
});

// PATCH /admin/providers/:id — feature toggle and/or status change.
export const adminPatchProvider = asyncHandler(async (req, res) => {
  await findProviderOr404(req.params.id);
  const { featured, status } = patchSchema.parse(req.body);

  const data: Prisma.ProviderUpdateInput = {};
  if (featured !== undefined) data.featured = featured;
  if (status !== undefined) {
    data.status = status;
    if (status === "APPROVED") data.rejectionReason = null;
  }

  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data,
    include: includeCategories,
  });
  await logAudit({
    actorId: req.userId,
    action: "admin.provider.patched",
    targetId: provider.id,
    meta: { featured, status },
  });
  res.json({ provider: providerCard(provider, req.locale) });
});

// --- Categories CRUD -------------------------------------------------------

const categorySchema = z.object({
  slug: z
    .string()
    .min(1, "validation.category.slugRequired")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "validation.category.slugRequired"),
  nameEn: z.string().min(1, "validation.category.nameRequired").max(80),
  nameEs: z.string().min(1, "validation.category.nameRequired").max(80),
  namePt: z.string().min(1, "validation.category.nameRequired").max(80),
  icon: z.string().min(1).max(60).default("briefcase"),
  sortOrder: z.coerce.number().int().default(0),
});

// GET /admin/categories — raw i18n names + provider counts for the admin editor.
export const adminListCategories = asyncHandler(async (req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { providers: true } } },
  });
  res.json({
    categories: cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      sortOrder: c.sortOrder,
      nameEn: c.nameEn,
      nameEs: c.nameEs,
      namePt: c.namePt,
      providerCount: c._count.providers,
    })),
  });
});

// POST /admin/categories
export const adminCreateCategory = asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  if (await prisma.category.findUnique({ where: { slug: data.slug } })) {
    throw new HttpError(409, "errors.category.slugTaken", { code: "SLUG_TAKEN" });
  }
  const category = await prisma.category.create({ data });
  await logAudit({
    actorId: req.userId,
    action: "admin.category.created",
    targetId: category.id,
    meta: { slug: data.slug },
  });
  res.status(201).json({ category: publicCategory(category, req.locale) });
});

// PUT /admin/categories/:id
export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "errors.category.notFound", { code: "NOT_FOUND" });

  const data = categorySchema.parse(req.body);
  if (data.slug !== existing.slug) {
    const clash = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (clash) throw new HttpError(409, "errors.category.slugTaken", { code: "SLUG_TAKEN" });
  }
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  await logAudit({ actorId: req.userId, action: "admin.category.updated", targetId: category.id });
  res.json({ category: publicCategory(category, req.locale) });
});

// DELETE /admin/categories/:id — blocked while providers reference it.
export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "errors.category.notFound", { code: "NOT_FOUND" });

  const inUse = await prisma.providerCategory.count({ where: { categoryId: req.params.id } });
  if (inUse > 0) throw new HttpError(409, "errors.category.inUse", { code: "CATEGORY_IN_USE" });

  await prisma.category.delete({ where: { id: req.params.id } });
  await logAudit({
    actorId: req.userId,
    action: "admin.category.deleted",
    targetId: req.params.id,
    meta: { slug: existing.slug },
  });
  res.json({ ok: true });
});

// --- Audit log -------------------------------------------------------------

const auditQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// GET /admin/audit — paginated, newest first, with actor info.
export const adminAudit = asyncHandler(async (req, res) => {
  const { page, pageSize } = auditQuery.parse(req.query);
  const [total, entries] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);
  res.json({ items: entries.map(publicAudit), total, page, pageSize });
});
