// supabase-auth.guard.ts — re-exports JwtAuthGuard under the old name so that
// all controllers that import SupabaseAuthGuard continue to work without changes.
export { JwtAuthGuard as SupabaseAuthGuard } from './jwt-auth.guard';
