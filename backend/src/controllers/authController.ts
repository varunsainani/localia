import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { asyncHandler } from "../lib/async-handler";
import { logAudit } from "../lib/audit";
import { publicUser } from "../lib/serialize";
import { signAccessToken, generateRefreshToken, sha256 } from "../lib/tokens";

// Register accepts CLIENT or PROVIDER only — never ADMIN.
const registerSchema = z.object({
  name: z.string().min(2, "validation.register.nameTooShort"),
  email: z.string().email(),
  password: z.string().min(8, "validation.register.passwordTooShort"),
  role: z.enum(["CLIENT", "PROVIDER"], {
    errorMap: () => ({ message: "validation.register.invalidRole" }),
  }),
  locale: z.string().min(2).max(5).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "validation.login.passwordRequired"),
});

async function issueSession(user: { id: string }) {
  const accessToken = signAccessToken(user);
  const { raw, hash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt } });
  return { accessToken, refreshToken: raw };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, locale } = registerSchema.parse(req.body);
  const normalized = email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalized } })) {
    throw new HttpError(409, "errors.auth.emailTaken", { code: "EMAIL_TAKEN" });
  }
  const user = await prisma.user.create({
    data: {
      name,
      email: normalized,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      locale: locale ?? req.locale,
    },
  });
  await logAudit({ actorId: user.id, action: "auth.register", meta: { role } });
  const session = await issueSession(user);
  res.status(201).json({ user: publicUser(user), ...session });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "errors.auth.invalidCredentials", { code: "INVALID_CREDENTIALS" });
  }
  await logAudit({ actorId: user.id, action: "auth.login" });
  const session = await issueSession(user);
  res.json({ user: publicUser(user), ...session });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken;
  if (typeof token !== "string" || !token) {
    throw new HttpError(400, "errors.auth.refreshRequired", { code: "REFRESH_REQUIRED" });
  }
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new HttpError(401, "errors.auth.invalidRefresh", { code: "INVALID_REFRESH" });
  }
  // Reuse of an already-revoked token signals possible theft: revoke the user's
  // whole refresh-token family as a breach response, then reject.
  if (stored.revoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revoked: false },
      data: { revoked: true },
    });
    await logAudit({ actorId: stored.userId, action: "auth.refresh.reuse_detected" });
    throw new HttpError(401, "errors.auth.invalidRefresh", { code: "INVALID_REFRESH" });
  }
  // Rotation: revoke the presented token and issue a fresh pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const session = await issueSession(stored.user);
  res.json(session);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.body?.refreshToken;
  if (typeof token === "string" && token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(token) },
      data: { revoked: true },
    });
  }
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new HttpError(404, "errors.common.userNotFound");
  res.json({ user: publicUser(user) });
});
