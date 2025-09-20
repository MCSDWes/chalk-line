import { SignIn } from "@clerk/clerk-react";

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Baseball Scorekeeper
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your teams and players
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <SignIn 
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl="/teams"
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                card: "shadow-none",
              }
            }}
          />
        </div>
        
        <div className="text-center text-xs text-gray-500">
          <p>🔒 Privacy protected: Only first names and last initials stored</p>
        </div>
      </div>
    </div>
  );
}