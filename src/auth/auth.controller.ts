import { Controller, Post, Get, Body, UseGuards, Patch, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SenderSignupDto } from './dto/sender-signup.dto';
import { SenderSigninDto } from './dto/sender-signin.dto';
import { AdminSigninDto } from './dto/admin-signin.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { RequestPasswordResetDto, UpdatePasswordDto, ResendConfirmationDto } from './dto/password-reset.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { User, UserRole } from '../types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sender/signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async senderSignup(@Body() dto: SenderSignupDto) {
    return this.authService.senderSignup(dto.email, dto.password, dto.fullName);
  }

  @Post('sender/signin')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async senderSignin(@Body() dto: SenderSigninDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.senderSignin(dto.email, dto.password);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('courier/check-phone')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async checkCourierPhone(@Body() dto: RequestOtpDto) {
    return this.authService.checkCourierPhone(dto.phone);
  }

  @Post('courier/request-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async courierRequestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.courierRequestOtp(dto.phone);
  }

  @Post('courier/verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async courierVerifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.courierVerifyOtp(dto.phone, dto.token);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('admin/signin')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async adminSignin(@Body() dto: AdminSigninDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.adminSignin(dto.email, dto.password);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleAuth(@Body() dto: GoogleAuthDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleAuth(dto.idToken);
    if (result.access_token && result.refresh_token) {
      this.setAuthCookies(res, result.access_token, result.refresh_token);
    }
    return result;
  }

  @Post('google/callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleCallback(@Body() dto: GoogleCallbackDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleCallback(dto.accessToken);
    if (dto.refreshToken) {
      this.setAuthCookies(res, dto.accessToken, dto.refreshToken);
    } else {
      res.cookie('access_token', dto.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
        path: '/',
      });
    }
    return result;
  }

  @Post('request-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyOtp(dto.phone, dto.token);
    if (result.access_token && result.refresh_token) {
      this.setAuthCookies(res, result.access_token, result.refresh_token);
    }
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(dto.refresh_token);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('password/reset')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/update')
  @UseGuards(SupabaseAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(dto.newPassword);
  }

  @Post('email/resend-confirmation')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendEmailConfirmation(@Body() dto: ResendConfirmationDto) {
    return this.authService.resendEmailConfirmation(dto.email);
  }

  @Get('sessions')
  @UseGuards(SupabaseAuthGuard)
  async getSessions(@CurrentUser() user: User) {
    return this.authService.getSessions(user.id);
  }

  @Post('sessions/revoke-all')
  @UseGuards(SupabaseAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async revokeAllSessions(@CurrentUser() user: User) {
    return this.authService.revokeAllSessions(user.id);
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Patch('role')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(@CurrentUser() user: User, @Body('userId') targetUserId: string, @Body('role') role: UserRole) {
    return this.authService.updateRole(targetUserId || user.id, role);
  }
}
