/**
 * AMA MEDIA VAULT
 * Powered by Ask Morpheus Alliance
 * UPLOAD ONCE. WEBSITE READY.
 */

import React, { useState, useEffect } from 'react';
import { Navbar, AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { SplashHero } from './components/SplashHero';
import { ClientUploadPortal } from './components/ClientUploadPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientProfile, MediaFile, VaultSettings } from './types/vault';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredClients,
  saveStoredClients,
  getStoredMediaFiles,
  saveStoredMediaFiles,
} from './services/vaultStorage';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
} from './services/firebaseAuth';
import { User } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [settings, setSettings] = useState<VaultSettings>(getStoredSettings);
  const [clients, setClients] = useState<ClientProfile[]>(getStoredClients);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(getStoredMediaFiles);
  const [selectedClient, setSelectedClient] = useState<ClientProfile>(() => {
    const list = getStoredClients();
    return list[0] || {
      id: 'client-jeannie',
      name: 'Jeannie',
      slug: 'jeannie',
      status: 'active',
      createdAt: new Date().toISOString(),
      totalUploads: 0,
      websiteReadyCount: 0,
    };
  });

  // Auth State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Check URL query param for private client link: e.g. ?client=jeannie
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientSlug = params.get('client');
    if (clientSlug) {
      const match = clients.find(
        (c) => c.slug.toLowerCase() === clientSlug.toLowerCase()
      );
      if (match) {
        setSelectedClient(match);
        setCurrentView('client');
      }
    }
  }, [clients]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync state to storage
  const handleUpdateSettings = (newSettings: VaultSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleAddClient = (
    newClientData: Omit<ClientProfile, 'id' | 'createdAt' | 'totalUploads' | 'websiteReadyCount'>
  ) => {
    const newClient: ClientProfile = {
      ...newClientData,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalUploads: 0,
      websiteReadyCount: 0,
    };
    const updated = [...clients, newClient];
    setClients(updated);
    saveStoredClients(updated);
  };

  const handleUpdateClient = (updatedClient: ClientProfile) => {
    const updated = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    setClients(updated);
    saveStoredClients(updated);
    if (selectedClient.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter((c) => c.id !== clientId);
    setClients(updated);
    saveStoredClients(updated);
    if (selectedClient.id === clientId && updated.length > 0) {
      setSelectedClient(updated[0]);
    }
  };

  const handleFilesProcessed = (newFiles: MediaFile[]) => {
    setMediaFiles((prev) => {
      const updated = [...newFiles, ...prev];
      saveStoredMediaFiles(updated);
      return updated;
    });

    // Update client stats
    setClients((prev) => {
      const updated = prev.map((c) => {
        if (c.id === selectedClient.id) {
          const newTotal = c.totalUploads + newFiles.length;
          const newReady =
            c.websiteReadyCount + newFiles.filter((f) => f.status === 'complete').length;
          return { ...c, totalUploads: newTotal, websiteReadyCount: newReady };
        }
        return c;
      });
      saveStoredClients(updated);
      return updated;
    });
  };

  const handleDeleteFiles = (fileIds: string[]) => {
    setMediaFiles((prev) => {
      const updated = prev.filter((f) => !fileIds.includes(f.id));
      saveStoredMediaFiles(updated);
      return updated;
    });
  };

  const handleMoveFiles = (
    fileIds: string[],
    targetFolder: 'Website JPG' | 'Original Uploads' | 'Archive'
  ) => {
    setMediaFiles((prev) => {
      const updated = prev.map((f) =>
        fileIds.includes(f.id) ? { ...f, driveFolder: targetFolder } : f
      );
      saveStoredMediaFiles(updated);
      return updated;
    });
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch {
      // Handled inside googleSignIn
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col relative selection:bg-red-500/20 selection:text-red-200">
      {/* Ambient background styling */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-red-600/[0.04] via-blue-600/[0.02] to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-red-600/[0.02] blur-3xl" />
      </div>

      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onSwitchView={setCurrentView}
        accessToken={accessToken}
        currentUserEmail={currentUser?.email}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isSigningIn={isSigningIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {currentView === 'splash' && (
          <SplashHero
            clients={clients}
            selectedClient={selectedClient}
            onEnterClient={(client) => {
              if (client) setSelectedClient(client);
              setCurrentView('client');
            }}
            onEnterAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'client' && (
          <ClientUploadPortal
            client={selectedClient}
            clients={clients}
            onSelectClient={setSelectedClient}
            settings={settings}
            accessToken={accessToken}
            onFilesProcessed={handleFilesProcessed}
            onSwitchToAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            clients={clients}
            mediaFiles={mediaFiles}
            settings={settings}
            accessToken={accessToken}
            currentUserEmail={currentUser?.email}
            onUpdateSettings={handleUpdateSettings}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onDeleteFiles={handleDeleteFiles}
            onMoveFiles={handleMoveFiles}
            onOpenClientUpload={(client) => {
              setSelectedClient(client);
              setCurrentView('client');
            }}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            isSigningIn={isSigningIn}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
