import React from 'react';
import { AuthProviders } from './lib/auth';
import { AuthGuard } from './components/auth/AuthGuard';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { TeamsTest } from './components/teams/TeamsTest';
import './index.css';

function App() {
  const currentPath = window.location.pathname;

  return (
    <AuthProviders>
      {currentPath === '/sign-in' ? (
        <SignInPage />
      ) : currentPath === '/sign-up' ? (
        <SignUpPage />
      ) : (
        <AuthGuard>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      ⚾ Chalk Line
                    </h1>
                    <p className="text-sm text-gray-500 italic">
                      We don't walk within the chalk
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Ready for development!</span>
                  </div>
                </div>
              </div>
            </header>
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🎉 Authentication Setup Complete!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Convex database is deployed with privacy-compliant schema.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto mb-6">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Next: Team Management Implementation
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Ready to start Phase 3.2: Writing Tests (TDD approach)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <TeamsTest />
                </div>
              </div>
            </main>
          </div>
        </AuthGuard>
      )}
    </AuthProviders>
  );
}

export default App;