import { useState } from 'react';
import { AuthProviders } from './lib/auth';
import { AuthGuard } from './components/auth/AuthGuard';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { TeamsTest } from './components/teams/TeamsTest';
import { GameManagement } from './components/games/GameManagement';
import { Button } from './components/ui/button';
import './index.css';

function App() {
  const currentPath = window.location.pathname;
  const [activeTab, setActiveTab] = useState<'teams' | 'games'>('teams');

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
                    <p className="text-sm text-gray-500 italic ml-2">
                      We don't walk within the chalk
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={activeTab === 'teams' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('teams')}
                    >
                      Teams
                    </Button>
                    <Button
                      variant={activeTab === 'games' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('games')}
                    >
                      Games
                    </Button>
                  </div>
                </div>
              </div>
            </header>
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                {activeTab === 'teams' ? (
                  <TeamsTest />
                ) : (
                  <GameManagement />
                )}
              </div>
            </main>
          </div>
        </AuthGuard>
      )}
    </AuthProviders>
  );
}

export default App;