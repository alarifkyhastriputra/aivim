import React, { useState, useEffect } from 'react';
import { UserProfile, GeneratedWebsite } from './types';
import { auth, onAuthStateChanged, syncUserProfile, signOut, getUserWebsites, getActiveSession, setActiveSession, isAdminEmail } from './lib/firebase';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { WizardMaster } from './components/Wizard/WizardMaster';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { MyProjectsModal } from './components/MyProjectsModal';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getActiveSession());
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // Websites & Selected Website
  const [websites, setWebsites] = useState<GeneratedWebsite[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<GeneratedWebsite | null>(null);

  useEffect(() => {
    if (userProfile) {
      loadUserWebsites(userProfile.email);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserProfile(firebaseUser);
        if (profile) {
          const effectiveProfile: UserProfile = {
            ...profile,
            role: isAdminEmail(profile.email) ? 'admin' : profile.role,
            status: isAdminEmail(profile.email) ? 'active' : profile.status,
          };
          setUserProfile(effectiveProfile);
          setActiveSession(effectiveProfile);
          setShowAuthModal(false);
          loadUserWebsites(effectiveProfile.email);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserWebsites = async (email: string) => {
    const sites = await getUserWebsites(email);
    setWebsites(sites);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setActiveSession(null);
    setUserProfile(null);
    setShowAuthModal(true);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-xs text-slate-400 font-mono">Loading vimos.ai...</div>
        </div>
      </div>
    );
  }

  // Initial view is Login / Register if user not authenticated
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          initialError={authError}
          onSuccess={(profile) => {
            const effectiveProfile: UserProfile = {
              ...profile,
              role: isAdminEmail(profile.email) ? 'admin' : profile.role,
              status: isAdminEmail(profile.email) ? 'active' : profile.status,
            };
            setUserProfile(effectiveProfile);
            setActiveSession(effectiveProfile);
            setShowAuthModal(false);
            setAuthError(null);
            loadUserWebsites(effectiveProfile.email);
          }}
        />
      </div>
    );
  }

  const isCurrentUserAdmin = userProfile.role === 'admin' || isAdminEmail(userProfile.email);
  const effectiveProfile: UserProfile = {
    ...userProfile,
    role: isCurrentUserAdmin ? 'admin' : userProfile.role,
    status: isCurrentUserAdmin ? 'active' : userProfile.status,
  };

  // Account pending approval view
  if (effectiveProfile.status === 'pending' && !isCurrentUserAdmin) {
    return (
      <PendingApprovalView
        user={effectiveProfile}
        onRefresh={(updated) => setUserProfile(updated)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <WizardMaster
        user={effectiveProfile}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenProjects={() => {
          loadUserWebsites(effectiveProfile.email);
          setShowProjectsModal(true);
        }}
        onLogout={handleLogout}
        loadedWebsite={selectedWebsite}
        websites={websites}
        onRefreshWebsites={() => loadUserWebsites(effectiveProfile.email)}
      />

      {/* Admin Dashboard Modal */}
      {isCurrentUserAdmin && (
        <AdminDashboardModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          currentUserProfile={effectiveProfile}
          websites={websites}
        />
      )}

      {/* My Projects Modal */}
      <MyProjectsModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        websites={websites}
        onSelectProject={(site) => {
          setSelectedWebsite(site);
          setShowProjectsModal(false);
        }}
        onRefresh={() => loadUserWebsites(effectiveProfile.email)}
      />
    </div>
  );
}
