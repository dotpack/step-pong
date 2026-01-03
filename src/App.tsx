
import { ConfigPanel } from './components/ConfigPanel';
import { ChatArea } from './components/ChatArea';

import { ControlPanel } from './components/ControlPanel';
import { Sidebar } from './components/Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './components/ui/Button';
import { cn } from './lib/utils';
import { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { DebugPanel } from './components/DebugPanel';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { activeSessionId, switchSession } = useAppStore();

  // Sync Hash -> State (Initial Load & Change Listener)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove #
      if (hash) {
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
    if (activeSessionId) {
      window.location.hash = activeSessionId;
    } else {
      // Optional: clear hash if no session, or keep last?
      // window.location.hash = ''; 
    }
  }, [activeSessionId]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 transition-colors duration-300 flex dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 relative",
        isSidebarOpen ? "lg:ml-72" : ""
      )}>
        <ConfigPanel />

        <header className="w-full p-6 flex items-center justify-between border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30 dark:bg-zinc-900/50">
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

          <ControlPanel />
        </main>
      </div>
      <DebugPanel />
    </div>
  );
}

export default App;
