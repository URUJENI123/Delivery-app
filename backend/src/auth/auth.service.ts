import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DbService } from '../db/db.service';
import { UserRole } from '../types';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DbService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── helpers ────────────────────────────────────────────────────────────────

  private issueAccessToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.db.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  private async buildTokenPair(userId: string, role: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.issueAccessToken(userId, role),
      this.issueRefreshToken(userId),
    ]);
    return { access_token, refresh_token };
  }

  // ─── sender signup ───────────────────────────────────────────────────────────

  async senderSignup(email: string, password: string, fullName?: string) {
    const existing = await this.db.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.db.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName ?? null,
        role: 'SENDER',
        emailVerified: true,
      },
    });

    return {
      message: 'Account created successfully.',
      user: this.sanitize(user),
    };
  }

  // ─── sender signin ───────────────────────────────────────────────────────────

  async senderSignin(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const tokens = await this.buildTokenPair(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  // ─── admin signin ────────────────────────────────────────────────────────────

  async adminSignin(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== 'ADMIN') throw new ForbiddenException('Access denied. Admin only.');

    const tokens = await this.buildTokenPair(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  // ─── courier phone check ─────────────────────────────────────────────────────

  async checkCourierPhone(phone: string) {
    const user = await this.db.user.findUnique({ where: { phone } });
    return {
      exists: !!user,
      message: user ? undefined : 'No account found with this phone number',
    };
  }

  // ─── courier OTP ─────────────────────────────────────────────────────────────
  // OTP is now managed by NotificationsService (SMS provider).
  // We generate a numeric OTP, store a bcrypt hash, and send it.

  async courierRequestOtp(phone: string) {
    const user = await this.db.user.findUnique({ where: { phone } });
    if (!user) {
      return { exists: false, message: 'No account found with this phone number' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP in a dedicated refresh token record (prefixed so it's identifiable).
    // We deliberately do NOT touch passwordHash — couriers with passwords would lose them.
    await this.db.refreshToken.deleteMany({
      where: { userId: user.id, token: { startsWith: 'otp:' } },
    });
    await this.db.refreshToken.create({
      data: {
        token: `otp:${otpHash}`,
        userId: user.id,
        expiresAt: otpExpiresAt,
      },
    });

    // In production: send SMS via NotificationsService
    this.logger.log(`[OTP] ${phone} → ${otp}`);

    return { exists: true, message: 'OTP sent successfully' };
  }

  async courierVerifyOtp(phone: string, otp: string) {
    const user = await this.db.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('User not found');

    // Find the OTP token record
    const tokenRecord = await this.db.refreshToken.findFirst({
      where: {
        userId: user.id,
        token: { startsWith: 'otp:' },
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) throw new UnauthorizedException('OTP expired or not found');

    const storedHash = tokenRecord.token.replace('otp:', '');
    const valid = await bcrypt.compare(otp, storedHash);
    if (!valid) throw new UnauthorizedException('Invalid OTP');

    // Clean up OTP token
    await this.db.refreshToken.delete({ where: { id: tokenRecord.id } });

    // Mark phone verified
    await this.db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    const hasOnboarding = await this.db.onboardingSession.findUnique({
      where: { userId: user.id },
    });

    const tokens = await this.buildTokenPair(user.id, user.role);
    return { ...tokens, user: this.sanitize(user), needsOnboarding: !hasOnboarding };
  }

  // ─── generic OTP (backward compat) ──────────────────────────────────────────

  async requestOtp(phone: string) {
    return this.courierRequestOtp(phone);
  }

  async verifyOtp(phone: string, token: string) {
    return this.courierVerifyOtp(phone, token);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────
  // Google tokens are verified externally; we receive the decoded profile.

  async googleCallback(accessToken: string) {
    // Frontend should POST { email, fullName, googleId, avatarUrl } to POST /auth/google instead.
    throw new UnauthorizedException(
      'Google OAuth requires frontend to pass user profile. Use POST /auth/google instead.',
    );
  }

  async googleAuth(profile: {
    email: string;
    fullName?: string;
    googleId?: string;
    avatarUrl?: string;
  }) {
    let user = await this.db.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await this.db.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName ?? null,
          profilePhotoUrl: profile.avatarUrl ?? null,
          role: 'SENDER',
          emailVerified: true,
        },
      });
    } else {
      if (profile.fullName && user.fullName !== profile.fullName) {
        user = await this.db.user.update({
          where: { id: user.id },
          data: { fullName: profile.fullName, profilePhotoUrl: profile.avatarUrl ?? user.profilePhotoUrl },
        });
      }
    }

    const tokens = await this.buildTokenPair(user.id, user.role);
    return { ...tokens, user: this.sanitize(user) };
  }

  // ─── refresh token ────────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    const record = await this.db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) await this.db.refreshToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old, issue new
    await this.db.refreshToken.delete({ where: { id: record.id } });
    const tokens = await this.buildTokenPair(record.userId, record.user.role);
    return tokens;
  }

  // ─── profile ─────────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        courier: true,
        senderProfile: true,
        onboardingSession: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  // ─── role update ──────────────────────────────────────────────────────────────

  async updateRole(userId: string, role: UserRole) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.db.user.update({ where: { id: userId }, data: { role } });
  }

  // ─── password ─────────────────────────────────────────────────────────────────

  async requestPasswordReset(email: string) {
    // Stub: in production send an email with a signed reset link
    const user = await this.db.user.findUnique({ where: { email } });
    if (user) {
      this.logger.log(`[PASSWORD RESET] Reset link would be sent to ${email}`);
    }
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.db.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password updated successfully' };
  }

  async resendEmailConfirmation(email: string) {
    this.logger.log(`[EMAIL CONFIRM] Stub — would resend to ${email}`);
    return { message: 'Confirmation email sent' };
  }

  // ─── sessions ─────────────────────────────────────────────────────────────────

  async getSessions(userId: string) {
    const tokens = await this.db.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    return tokens;
  }

  async revokeAllSessions(userId: string) {
    await this.db.refreshToken.deleteMany({ where: { userId } });
    return { message: 'All sessions revoked' };
  }

  // ─── sanitize ─────────────────────────────────────────────────────────────────

  private sanitize(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
