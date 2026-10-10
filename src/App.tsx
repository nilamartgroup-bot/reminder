/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';
import { AuthPage } from './pages/AuthPage';
import { IndexPage } from './index';
import { IndexReminderPage } from './reminder/indexreminder';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ActiveAlertModal } from './components/ActiveAlertModal';
import { AdminGatewayModal } from './components/AdminGatewayModal';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { PaywallModal } from './components/PaywallModal';
import { adminService, TrialPolicyConfig } from './utils/adminService';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'index' | 'indexremider' | 'admin'>('index');
  const [isAdminGatewayOpen, setIsAdminGatewayOpen] = useState(false);
  const [trialBlocked, setTrialBlocked] = useState(false);
  const [currentTrialPolicy, setCurrentTrialPolicy] = useState<TrialPolicyConfig>(() =>
    adminService.getTrialPolicy()
  );

  // Check trial expiration policy for current user
  useEffect(() => {
    if (isAuthenticated && user) {
      const policy = adminService.getTrialPolicy();
      setCurrentTrialPolicy(policy);
      const userStatus = adminService.getUserTrialStatus(user as any, policy);
      setTrialBlocked(userStatus.isBlocked);
    } else {
      setTrialBlocked(false);
    }
  }, [isAuthenticated, user, currentPage]);

  // Global URL hash and keyboard shortcut listener
  useEffect(() => {
    const checkHashAndQuery = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('admin') || search.includes('admin')) {
        if (adminService.hasActiveSession()) {
          setCurrentPage('admin');
        } else {
          setIsAdminGatewayOpen(true);
        }
      }
    };

    checkHashAndQuery();
    window.addEventListener('hashchange', checkHashAndQuery);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && e.shiftKey && (e.key === 'M' || e.key === 'm'))
      ) {
        e.preventDefault();
        setIsAdminGatewayOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHashAndQuery);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Admin Panel View: Strictly Non-Scrolling Viewport (Accessible at all times)
  if (currentPage === 'admin') {
    return (
      <div className="h-screen h-dvh max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <SuperAdminPanel
          onBackToApp={() => {
            if (window.location.hash.includes('admin')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            setCurrentPage('index');
          }}
          onLock={() => {
            adminService.logout();
            if (window.location.hash.includes('admin')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            setCurrentPage('index');
          }}
        />
        <ActiveAlertModal />
        <OfflineIndicator />
      </div>
    );
  }

  // If user is not yet logged into regular user account, still allow opening admin modal & admin panel!
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onAdminLogin={() => setCurrentPage('admin')} />
        <OfflineIndicator />
        <AdminGatewayModal
          isOpen={isAdminGatewayOpen}
          onClose={() => setIsAdminGatewayOpen(false)}
          onSuccess={() => {
            setIsAdminGatewayOpen(false);
            setCurrentPage('admin');
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Navbar
        activePage={currentPage}
        onNavigateHome={() => setCurrentPage('index')}
        onNavigateReminders={() => setCurrentPage('indexremider')}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 overflow-hidden flex flex-col ${currentPage === 'index' ? 'pt-0' : 'pt-2'}`}>
        {currentPage === 'index' ? (
          <IndexPage onOpenReminders={() => setCurrentPage('indexremider')} />
        ) : (
          <IndexReminderPage onBackToIndex={() => setCurrentPage('index')} />
        )}
      </main>

      {/* Secret Stealth Admin Gateway Dialog */}
      <AdminGatewayModal
        isOpen={isAdminGatewayOpen}
        onClose={() => setIsAdminGatewayOpen(false)}
        onSuccess={() => {
          setIsAdminGatewayOpen(false);
          setCurrentPage('admin');
        }}
      />

      {/* System Active Notification Chime Modal */}
      <ActiveAlertModal />

      {/* Paywall & Trial Period Expiration Paywall Modal */}
      {trialBlocked && user && (
        <PaywallModal
          userId={user.id}
          userName={user.fullName}
          policy={currentTrialPolicy}
          onPaymentSuccess={() => {
            const policy = adminService.getTrialPolicy();
            setCurrentTrialPolicy(policy);
            const userStatus = adminService.getUserTrialStatus(user as any, policy);
            setTrialBlocked(userStatus.isBlocked);
          }}
        />
      )}

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ReminderProvider>
          <AppContent />
        </ReminderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
