import { SignUp } from "@clerk/clerk-react";

export function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join Baseball Scorekeeper
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start managing teams
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <SignUp 
            routing="hash"
            signInUrl="/sign-in"
            afterSignUpUrl="/teams"
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                card: "shadow-none",
              }
            }}
          />
        </div>
        
        <div className="text-center text-xs text-gray-500">
          <p>🔒 Privacy First: We only store player first names and last initials</p>
          <p className="mt-1">✅ COPPA compliant for youth sports</p>
        </div>
      </div>
    </div>
  );
}