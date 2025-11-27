import { db } from '@/lib/instant';

/**
 * Custom hook for InstantDB authentication
 */
export function useAuth() {
  const { user, isLoading, error } = db.useAuth();

  const signIn = async (_email: string, _password: string) => {
    console.warn("InstantDB authentication is not configured. Supply NEXT_PUBLIC_INSTANT_APP_ID to enable auth.");
  };

  const signUp = async (_email: string, _password: string) => {
    console.warn("InstantDB sign-up is disabled in this environment.");
  };

  const signOut = async () => {
    console.warn("InstantDB sign-out is disabled in this environment.");
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}

