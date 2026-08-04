import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as userRepo    from '../repositories/user.repository';
import * as authRepo    from '../repositories/auth.repository';
import * as courierRepo from '../repositories/courier.repository';
import { signAccessToken } from '../lib/jwt';
import { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from '../lib/errors';
import { UserRole } from '../types';

const BCRYPT_ROUNDS          = 10;
const REFRESH_TOKEN_TTL_DAYS = 30;

// ─── helpers ─────────────────────────────────────────────────────────────────

function sanitize<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken(userId, role);
  const rawRefresh  = crypto.randomBytes(40).toString('hex');
  const expiresAt   = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  await authRepo.createToken({ token: rawRefresh, userId, expiresAt });
  return { accessToken, refreshToken: rawRefresh };
}

// ─── sender ──────────────────────────────────────────────────────────────────

export async function senderSignup(email: string, password: string, fullName?: string) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError('Email already registered');
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await userRepo.create({
    email, passwordHash, fullName,
    role: UserRole.SENDER, emailVerified: true,
  });
  const tokens = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(user) };
}

export async function senderSignin(email: string, password: string) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid email or password');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is deactivated');
  const tokens = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(user) };
}

// ─── admin ───────────────────────────────────────────────────────────────────

export async function adminSignin(email: string, password: string) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');
  if (user.role !== UserRole.ADMIN) throw new ForbiddenError('Access denied');
  const tokens = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(user) };
}

// ─── courier signup / signin (email + password) ───────────────────────────────
// Matches the mobile 3-step registration flow:
//   Step 1 — fullName, email, phone, password  → POST /auth/courier/signup
//   Step 2 — credentials (plate, ID, MoMo…)   → PUT  /couriers/onboarding/step
//   Step 3 — documents + terms                 → PUT  /couriers/onboarding/step
//                                              → POST /couriers/onboarding/submit

export async function courierSignup(
  email: string,
  password: string,
  fullName: string,
  phone: string,
) {
  const byEmail = await userRepo.findByEmail(email);
  if (byEmail) throw new ConflictError('Email already registered');

  const byPhone = await userRepo.findByPhone(phone);
  if (byPhone) throw new ConflictError('Phone number already registered');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await userRepo.create({
    email,
    phone,
    passwordHash,
    fullName,
    role: UserRole.COURIER,
    emailVerified: false,
    phoneVerified: false,
  });

  // Seed the onboarding session with step-1 data so the mobile can continue
  // from step 2 without calling /onboarding/start separately.
  await courierRepo.createOnboarding(user.id, {
    user:        { connect: { id: user.id } },
    fullName,
    phone,
    email,
    currentStep: 1,
    totalSteps:  3,
  } as any);

  const tokens = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(user) };
}

export async function courierSignin(email: string, password: string) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid email or password');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is deactivated');
  if (user.role !== UserRole.COURIER) throw new ForbiddenError('Not a courier account');

  // Tell the client where the courier is in the flow so the mobile can
  // resume at the right screen.
  const onboarding = await courierRepo.findOnboardingByUser(user.id);
  const courier    = await courierRepo.findByUserId(user.id);
  const tokens     = await issueTokens(user.id, user.role);

  return {
    ...tokens,
    user: sanitize(user),
    // needsOnboarding: true  → go to the onboarding step they left off at
    // pendingApproval: true  → submitted but not yet approved
    // approved: true         → admin approved, go to dashboard
    needsOnboarding: !onboarding?.isSubmitted,
    pendingApproval: !!onboarding?.isSubmitted && !courier?.isApprovedByAdmin,
    approved:        !!courier?.isApprovedByAdmin,
    onboardingStep:  onboarding?.currentStep ?? 1,
  };
}

// ─── courier OTP (kept for backward compatibility) ────────────────────────────

export async function checkCourierPhone(phone: string) {
  const user = await userRepo.findByPhone(phone);
  return { exists: !!user };
}

export async function courierRequestOtp(phone: string) {
  let user = await userRepo.findByPhone(phone);
  if (!user) {
    user = await userRepo.create({
      phone, role: UserRole.COURIER,
      emailVerified: false, phoneVerified: false,
    });
  }
  await authRepo.deleteOtpTokens(user.id);
  const otp       = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash   = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await authRepo.createToken({ token: `otp:${otpHash}`, userId: user.id, expiresAt });
  console.log(`[OTP] ${phone} → ${otp}`);
  return { exists: true, message: 'OTP sent successfully' };
}

export async function courierVerifyOtp(phone: string, otp: string) {
  const user = await userRepo.findByPhone(phone);
  if (!user) throw new UnauthorizedError('Phone number not found');
  const otpTokens = await authRepo.findOtpTokens(user.id);
  if (otpTokens.length === 0) throw new UnauthorizedError('OTP expired or not requested');
  let matchedId = '';
  for (const record of otpTokens) {
    const hash = record.token.slice(4);
    if (await bcrypt.compare(otp, hash)) { matchedId = record.id; break; }
  }
  if (!matchedId) throw new UnauthorizedError('Invalid OTP');
  await authRepo.deleteToken(matchedId);
  await userRepo.update(user.id, { phoneVerified: true });
  const updated = await userRepo.findById(user.id);
  const tokens  = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(updated!), needsOnboarding: !updated?.courier };
}

// ─── google ───────────────────────────────────────────────────────────────────

export async function googleAuth(profile: {
  email: string; fullName?: string; googleId?: string; avatarUrl?: string;
}) {
  let user = await userRepo.findByEmail(profile.email);
  if (!user) {
    user = await userRepo.create({
      email: profile.email, fullName: profile.fullName,
      profilePhotoUrl: profile.avatarUrl, role: UserRole.SENDER, emailVerified: true,
    });
  } else {
    user = await userRepo.update(user.id, {
      fullName:       profile.fullName  ?? undefined,
      profilePhotoUrl: profile.avatarUrl ?? undefined,
    });
  }
  const tokens = await issueTokens(user.id, user.role);
  return { ...tokens, user: sanitize(user) };
}

// ─── refresh ──────────────────────────────────────────────────────────────────

export async function refreshToken(token: string) {
  const record = await authRepo.findToken(token);
  if (!record || record.expiresAt < new Date()) {
    if (record) await authRepo.deleteToken(record.id);
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  await authRepo.deleteToken(record.id);
  const tokens = await issueTokens(record.userId, record.user.role);
  return { ...tokens, user: sanitize(record.user) };
}

// ─── profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return sanitize(user);
}

export async function updateRole(userId: string, role: UserRole) {
  const user = await userRepo.update(userId, { role });
  return sanitize(user);
}

// ─── password ────────────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string) {
  console.log(`[PasswordReset] Requested for: ${email}`);
  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function updatePassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepo.update(userId, { passwordHash });
  return { message: 'Password updated successfully' };
}

// ─── sessions ────────────────────────────────────────────────────────────────

export async function getSessions(userId: string) {
  return authRepo.findActiveSessions(userId);
}

export async function revokeAllSessions(userId: string) {
  await authRepo.deleteManyByUser(userId);
  return { message: 'All sessions revoked' };
}
