import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  return {
    user: user ? {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.fullName || user.firstName || 'Coach',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    } : null,
    isLoaded,
    isSignedIn: !!isSignedIn,
    signOut,
  };
}

export type AuthUser = ReturnType<typeof useAuth>['user'];