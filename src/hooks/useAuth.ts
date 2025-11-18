import { db } from '@/lib/instant';

/**
 * Custom hook for InstantDB authentication
 */
export function useAuth() {
  const { user, isLoading, error } = db.useAuth();

  const signIn = async (email: string, password: string) => {
    try {
      await db.auth.signInWithEmailAndPassword({
        email,
        password,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await db.auth.signUpWithEmailAndPassword({
        email,
        password,
      });
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await db.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
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

