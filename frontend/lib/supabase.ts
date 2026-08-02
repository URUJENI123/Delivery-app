/**
 * DEV STUB ΓÇö Supabase is not connected in dev mode.
 * All auth methods are no-ops or return empty data.
 * Replace this with the real client when integrating Supabase.
 */

const noop = async () => ({});
const noopData = async () => ({ data: {}, error: null });

export const supabase = {
  auth: {
    signOut: noop,
    getUser: noopData,
    getSession: noopData,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: noopData,
    signInWithPassword: noopData,
    signUp: noopData,
    refreshSession: noopData,
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
} as any;
