import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbService } from '../db/db.service';
import { UserRole } from '../types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(private readonly db: DbService) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isPlaceholder = !url || url.includes('placeholder');

    if (!isPlaceholder && anonKey && serviceKey) {
      this.supabase = createClient(url, anonKey);
      this.supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      this.logger.warn('Supabase not configured — auth endpoints will return errors (dev mode)');
    }
  }

  private get client(): SupabaseClient {
    if (!this.supabase) throw new UnauthorizedException('Auth service not configured (dev mode)');
    return this.supabase;
  }

  private get adminClient(): SupabaseClient {
    if (!this.supabaseAdmin) throw new UnauthorizedException('Auth service not configured (dev mode)');
    return this.supabaseAdmin;
  }

  async senderSignup(email: string, password: string, fullName?: string) {
    const existing = await this.db.findOne('users', 'email', email);
    if (existing) {
      throw new ConflictException('Signup failed. Please try again.');
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      this.logger.error(`Sender signup failed: ${error?.message}`);
      throw new UnauthorizedException('Signup failed. Please try again.');
    }

    const supabaseUser = data.user;

    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

    if (!dbUser) {
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser.id,
        email,
        fullName: fullName || null,
        role: UserRole.SENDER,
        emailVerified: false,
      });
    }

    return {
      message: 'Account created! Please check your email inbox to confirm your account before signing in.',
      user: dbUser,
    };
  }

  async senderSignin(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      const isUnconfirmed = error?.message?.toLowerCase().includes('email not confirmed');
      this.logger.error(`Sender signin failed: ${error?.message}`);
      throw new UnauthorizedException(
        isUnconfirmed
          ? 'Email not confirmed. Please check your inbox (and spam folder) for the confirmation link.'
          : 'Invalid email or password'
      );
    }

    const supabaseUser = data.user;
    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser!.id);

    if (!dbUser) {
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser!.id,
        email: supabaseUser!.email || email,
        role: UserRole.SENDER,
        emailVerified: supabaseUser!.email_confirmed_at ? true : false,
      });
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: dbUser,
    };
  }

  async adminSignin(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const supabaseUser = data.user;
    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser!.id);

    if (!dbUser) {
      throw new UnauthorizedException('Admin account not found');
    }

    if (dbUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied. Admin only.');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: dbUser,
    };
  }

  async checkCourierPhone(phone: string) {
    const user = await this.db.findOne('users', 'phone', phone);
    return { exists: !!user, message: user ? undefined : 'No account found with this phone number' };
  }

  async courierRequestOtp(phone: string) {
    const user = await this.db.findOne('users', 'phone', phone);

    if (!user) {
      return { exists: false, message: 'No account found with this phone number' };
    }

    const { error } = await this.client.auth.signInWithOtp({
      phone,
    });

    if (error) {
      this.logger.error(`Courier OTP request failed: ${error.message}`);
      throw new UnauthorizedException('Failed to send OTP');
    }

    return { exists: true, message: 'OTP sent successfully' };
  }

  async courierVerifyOtp(phone: string, token: string) {
    const { data, error } = await this.client.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error || !data.session) {
      this.logger.error(`Courier OTP verification failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      throw new UnauthorizedException('User not found');
    }

    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

    if (!dbUser) {
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser.id,
        phone: supabaseUser.phone || phone,
        phoneVerified: true,
        role: UserRole.COURIER,
      });
    }

    const hasOnboardingSession = await this.db.findOne('onboarding_sessions', 'userId', dbUser.id);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: dbUser,
      needsOnboarding: !hasOnboardingSession,
    };
  }

  async googleCallback(accessToken: string) {
    this.logger.log('googleCallback called');

    if (!accessToken || accessToken.length < 10) {
      this.logger.error('googleCallback: accessToken too short or empty');
      throw new UnauthorizedException('Invalid access token');
    }

    const { data: { user: supabaseUser }, error } = await this.client.auth.getUser(accessToken);

    if (error || !supabaseUser) {
      this.logger.error(`Google callback getUser failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid access token');
    }

    this.logger.log(`googleCallback: Supabase user resolved: ${supabaseUser.id} email: ${supabaseUser.email}`);

    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

    if (!dbUser) {
      this.logger.log('googleCallback: Creating new local user');
      const email = supabaseUser.email || '';
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser.id,
        email,
        fullName: supabaseUser.user_metadata?.full_name || null,
        role: UserRole.SENDER,
        emailVerified: !!supabaseUser.email_confirmed_at,
        profilePhotoUrl: supabaseUser.user_metadata?.avatar_url || null,
      });
      this.logger.log(`googleCallback: Created user id=${dbUser.id}`);
    } else {
      // Update profile from Google in case avatar/name changed
      const googleName = supabaseUser.user_metadata?.full_name || null;
      const googleAvatar = supabaseUser.user_metadata?.avatar_url || null;
      const googleEmailVerified = !!supabaseUser.email_confirmed_at;
      if (
        dbUser.fullName !== googleName ||
        dbUser.profilePhotoUrl !== googleAvatar ||
        dbUser.emailVerified !== googleEmailVerified
      ) {
        await this.db.update('users', 'id', dbUser.id, {
          fullName: googleName,
          profilePhotoUrl: googleAvatar,
          emailVerified: googleEmailVerified,
        });
        this.logger.log(`googleCallback: Updated user id=${dbUser.id}`);
      }
      this.logger.log(`googleCallback: Found existing user id=${dbUser.id}`);
    }

    const profile = await this.db.findOneWithJoin('users', 'id', dbUser.id, [
      'courier_profile:couriers(*)',
      'sender_profile:sender_profiles(*)',
      'onboarding_session:onboarding_sessions(*)',
    ]);

    this.logger.log('googleCallback: Returning profile');
    return profile;
  }

  async googleAuth(idToken: string) {
    const { data, error } = await this.client.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error || !data.user) {
      this.logger.error(`Google auth failed: ${error?.message}`);
      throw new UnauthorizedException('Google authentication failed');
    }

    const supabaseUser = data.user;
    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

    if (!dbUser) {
      const email = supabaseUser.email || '';
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser.id,
        email,
        fullName: supabaseUser.user_metadata?.full_name || null,
        role: UserRole.SENDER,
        emailVerified: true,
        profilePhotoUrl: supabaseUser.user_metadata?.avatar_url || null,
      });
    } else {
      const googleName = supabaseUser.user_metadata?.full_name || null;
      const googleAvatar = supabaseUser.user_metadata?.avatar_url || null;
      if (dbUser.fullName !== googleName || dbUser.profilePhotoUrl !== googleAvatar) {
        await this.db.update('users', 'id', dbUser.id, {
          fullName: googleName,
          profilePhotoUrl: googleAvatar,
        });
      }
    }

    return {
      access_token: data.session?.access_token || null,
      refresh_token: data.session?.refresh_token || null,
      user: dbUser,
    };
  }

  async requestOtp(phone: string) {
    const { error } = await this.client.auth.signInWithOtp({
      phone,
    });

    if (error) {
      this.logger.error(`OTP request failed: ${error.message}`);
      throw new UnauthorizedException('Failed to send OTP');
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await this.client.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error || !data.session) {
      this.logger.error(`OTP verification failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      throw new UnauthorizedException('User not found');
    }

    let dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

    if (!dbUser) {
      dbUser = await this.db.create('users', {
        supabaseId: supabaseUser.id,
        phone: supabaseUser.phone || phone,
        role: UserRole.SENDER,
      });
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: dbUser,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async getProfile(userId: string) {
    return this.db.findOneWithJoin('users', 'id', userId, [
      'courier_profile:couriers(*)',
      'sender_profile:sender_profiles(*)',
      'onboarding_session:onboarding_sessions(*)',
    ]);
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.db.update('users', 'id', userId, { role });
  }

  async requestPasswordReset(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/sender/reset-password`,
    });

    if (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw new UnauthorizedException('Failed to send reset email');
    }

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      this.logger.error(`Password update failed: ${error.message}`);
      throw new UnauthorizedException('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }

  async resendEmailConfirmation(email: string) {
    const { error } = await this.client.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      this.logger.error(`Email confirmation resend failed: ${error.message}`);
      throw new UnauthorizedException('Failed to resend confirmation email');
    }

    return { message: 'Confirmation email sent' };
  }

  async getSessions(userId: string) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user || !user.supabaseId) return [];

    const { data, error } = await this.adminClient.auth.admin.listUsers();

    if (error) {
      this.logger.error(`Failed to list users: ${error.message}`);
      return [];
    }

    const supabaseUser = data.users.find(u => u.id === user.supabaseId);
    if (!supabaseUser) return [];

    return {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
      createdAt: supabaseUser.created_at,
      lastSignInAt: supabaseUser.last_sign_in_at,
      emailConfirmedAt: supabaseUser.email_confirmed_at,
      phoneConfirmedAt: supabaseUser.phone_confirmed_at,
    };
  }

  async revokeAllSessions(userId: string) {
    const user = await this.db.findOne('users', 'id', userId);
    if (!user || !user.supabaseId) {
      throw new UnauthorizedException('User not found');
    }

    const { error } = await this.adminClient.auth.admin.signOut(user.supabaseId);

    if (error) {
      this.logger.error(`Failed to revoke sessions: ${error.message}`);
      throw new UnauthorizedException('Failed to revoke sessions');
    }

    return { message: 'All sessions revoked' };
  }
}
