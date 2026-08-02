import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../db/prisma.service';
import { UserRole } from '../types';
import { NotificationsService } from '../notifications/notifications.service';

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '30', 10);

/** In-memory OTP store. Replace with Redis for multi-instance deployments. */
const otpStore = new Map<string, { hash: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Token helpers ─────────────────────────────────────────────────────────

  private signAccessToken(userId: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, role },
      { secret: process.env.JWT_SECRET, expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
    return token;
  }

  // ─── Sender signup / signin ─────────────────────────────────────────────────

  async senderSignup(email: string, password: string, fullName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || null,
        role: UserRole.SENDER,
        emailVerified: false,
      },
    });

    return {
      message: 'Account created successfully. You can now sign in.',
      user: this.sanitizeUser(user),
    };
  }

  async senderSignin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Admin signin ───────────────────────────────────────────────────────────

  async adminSignin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== UserRole.ADMIN) throw new ForbiddenException('Access denied. Admin only.');

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Courier phone OTP ──────────────────────────────────────────────────────

  async checkCourierPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return { exists: !!user, message: user ? undefined : 'No account found with this phone number' };
  }

  async courierRequestOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) return { exists: false, message: 'No account found with this phone number' };

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    otpStore.set(phone, { hash: otpHash, expiresAt });

    try {
      await this.notifications.sendOtp(phone, otp);
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${phone}: ${(err as Error).message}`);
      throw new BadRequestException('Failed to send OTP');
    }

    return { exists: true, message: 'OTP sent successfully' };
  }

  async courierVerifyOtp(phone: string, token: string) {
    const entry = otpStore.get(phone);
    if (!entry || entry.expiresAt < new Date()) {
      otpStore.delete(phone);
      throw new UnauthorizedException('OTP expired or not found. Request a new one.');
    }

    const valid = await bcrypt.compare(token, entry.hash);
    if (!valid) throw new UnauthorizedException('Invalid OTP');

    otpStore.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, phoneVerified: true, role: UserRole.COURIER },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    const hasOnboarding = await this.prisma.onboardingSession.findUnique({ where: { userId: user.id } });

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
      needsOnboarding: !hasOnboarding,
    };
  }

  async requestOtp(phone: string) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    otpStore.set(phone, { hash: otpHash, expiresAt });

    try {
      await this.notifications.sendOtp(phone, otp);
    } catch {
      throw new BadRequestException('Failed to send OTP');
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, token: string) {
    const entry = otpStore.get(phone);
    if (!entry || entry.expiresAt < new Date()) {
      otpStore.delete(phone);
      throw new UnauthorizedException('OTP expired or not found');
    }

    const valid = await bcrypt.compare(token, entry.hash);
    if (!valid) throw new UnauthorizedException('Invalid OTP');
    otpStore.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, phoneVerified: true, role: UserRole.SENDER },
      });
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Google OAuth (exchange id_token for session) ──────────────────────────
  // The frontend uses Supabase JS SDK's Google OAuth flow which issues a Supabase
  // access token. We replace that: the frontend should use Google Identity Services
  // to get an id_token and POST it here. We verify it via Google's tokeninfo endpoint.

  async googleAuth(idToken: string) {
    // Verify id_token with Google
    const googleUser = await this.verifyGoogleIdToken(idToken);

    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.name || null,
          profilePhotoUrl: googleUser.picture || null,
          role: UserRole.SENDER,
          emailVerified: true,
        },
      });
    } else {
      const updates: any = {};
      if (googleUser.name && user.fullName !== googleUser.name) updates.fullName = googleUser.name;
      if (googleUser.picture && user.profilePhotoUrl !== googleUser.picture) updates.profilePhotoUrl = googleUser.picture;
      if (!user.emailVerified) updates.emailVerified = true;
      if (Object.keys(updates).length) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: updates });
      }
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /** Verify Google ID token via tokeninfo endpoint */
  private async verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string; picture?: string }> {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) throw new UnauthorizedException('Google authentication failed');
    const data = await response.json() as any;
    if (!data.email) throw new UnauthorizedException('Invalid Google token');
    return { email: data.email, name: data.name, picture: data.picture };
  }

  /** Legacy googleCallback — now just a thin wrapper */
  async googleCallback(accessToken: string) {
    // accessToken here is the Supabase-issued token from the frontend OAuth callback.
    // Since we migrated away from Supabase, this endpoint now expects a Google ID token.
    return this.googleAuth(accessToken);
  }

  // ─── Refresh token ──────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!record || record.expiresAt < new Date()) {
      if (record) await this.prisma.refreshToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');

    // Rotate: delete old, create new
    await this.prisma.refreshToken.delete({ where: { id: record.id } });
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.role),
      this.createRefreshToken(user.id),
    ]);

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  // ─── Password reset ─────────────────────────────────────────────────────────

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Intentionally vague — don't leak whether email exists
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    otpStore.set(`reset:${email}`, { hash: resetHash, expiresAt });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/sender/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    this.logger.log(`Password reset URL for ${email}: ${resetUrl}`);
    // TODO: send via email provider (Resend / SendGrid)

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Password updated successfully' };
  }

  async resendEmailConfirmation(email: string) {
    // Stub — implement with your email provider
    this.logger.log(`Resend email confirmation for: ${email}`);
    return { message: 'Confirmation email sent' };
  }

  // ─── Profile / sessions ─────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        courierProfile: true,
        senderProfile: true,
        onboardingSession: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async getSessions(userId: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return tokens;
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'All sessions revoked' };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
