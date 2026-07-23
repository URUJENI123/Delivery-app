import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbService } from '../../db/db.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly db: DbService,
    private readonly reflector: Reflector,
  ) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (url && key && !url.includes('placeholder')) {
      this.supabase = createClient(url, key);
    } else {
      this.logger.warn('Supabase not configured — auth guard running in dev bypass mode');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    // Dev bypass: if no Supabase configured, inject a mock admin user
    if (!this.supabase) {
      request.user = {
        id: 'dev-admin-id',
        supabaseId: 'dev-supabase-id',
        email: 'admin@delivery.rw',
        fullName: 'Admin (Dev)',
        role: 'ADMIN',
        isActive: true,
      };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('No authorization token');
    }

    try {
      const {
        data: { user: supabaseUser },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !supabaseUser) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const dbUser = await this.db.findOne('users', 'supabaseId', supabaseUser.id);

      if (!dbUser) {
        throw new UnauthorizedException('User not found in database');
      }

      if (!dbUser.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      request.user = dbUser;
      return true;
    } catch (error) {
      this.logger.error(`Auth error: ${(error as Error).message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      if (scheme === 'Bearer' && token) return token;
    }
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }
    return null;
  }
}
