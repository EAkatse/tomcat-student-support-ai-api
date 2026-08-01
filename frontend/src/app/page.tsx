'use client';

import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatWorkspace from '@/components/ChatWorkspace';
import FAQSection from '@/components/FAQSection';
import AuthModal from '@/components/AuthModal';
import Toast from '@/components/Toast';
import { FAQProvider } from '@/contexts/FAQContext';

function HomeContent() {
  const { isAuthenticated } = useAuth();
  const { activeTab, switchTab } = useChat();
  const { theme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className='bg-slate-50 dark:bg-slate-900 app-height text-slate-800 dark:text-slate-100 font-sans flex overflow-hidden transition-colors duration-300'>
      {isAuthenticated ? (
        <>
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          <div className='grow flex flex-col h-full overflow-hidden w-full min-w-0'>
            <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
            <main className='grow max-w-5xl w-full mx-auto px-2.5 sm:px-4 overflow-hidden flex flex-col relative'>
              <section
                id='content-query'
                className={`grow flex flex-col h-full overflow-hidden ${
                  activeTab === 'query' ? '' : 'hidden'
                }`}
              >
                <ChatWorkspace />
              </section>
              <section
                id='content-faq'
                className={`grow overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6 ${
                  activeTab === 'faq' ? '' : 'hidden'
                }`}
              >
                <FAQSection />
              </section>
            </main>
          </div>
          <Toast />
        </>
      ) : (
        <AuthModal />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <FAQProvider>
            <HomeContent />
          </FAQProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
