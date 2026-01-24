
import { ConfigPanel } from './components/ConfigPanel';
import { ChatArea } from './components/ChatArea';
import { SharedSessionView } from './components/SharedSessionView';


import { Sidebar } from './components/Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './components/ui/Button';
import { cn } from './lib/utils';
import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';

import { SupabaseManager } from './components/SupabaseManager';

function App() {
  const { activeSessionId, switchSession, isSidebarOpen, setIsSidebarOpen } = useAppStore();
  const [isSharedView, setIsSharedView] = useState(false);

  // Sync Hash -> State (Initial Load & Change Listener)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove #

      // Check for share route: /share/...
      if (hash.startsWith('/share/')) {
        setIsSharedView(true);
        return;
      } else {
        setIsSharedView(false);
      }

      if (hash && !hash.startsWith('/')) {
        switchSession(hash);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // Empty dep array to run only setup listeners

  // Sync State -> Hash
  useEffect(() => {
    if (activeSessionId && !isSharedView) {
      window.location.hash = activeSessionId;
    }
  }, [activeSessionId, isSharedView]);

  if (isSharedView) {
    return <SharedSessionView />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300 flex">
      <SupabaseManager />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 relative",
        isSidebarOpen ? "lg:ml-72" : ""
      )}>
        <ConfigPanel />

        <header className="w-full p-6 flex items-center justify-between border-b bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              StepPong
            </h1>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col items-center">
          <div className="flex-1 w-full flex flex-col">
            <ChatArea />
          </div>
        </main>
      </div>

    </div>
  );
}

export default App;
