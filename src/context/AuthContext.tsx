import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  syncUserProfile, 
  setUserPlan, 
  UserProfileData, 
  PlanType,
  checkCanUserScan,
  incrementUserScanUsage,
  getUserScanHistory,
  UserScanHistoryItem
} from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'register';
  openAuthModal: (mode?: 'signin' | 'register') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  changePlan: (newPlan: PlanType) => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkScanAllowed: () => Promise<{ allowed: boolean; reason?: string; remainingScans: number; limit: number; plan: PlanType }>;
  recordScan: (scanInfo?: { url: string; domain: string; overallScore: number; securityScore: number }) => Promise<void>;
  history: UserScanHistoryItem[];
  loadHistory: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [history, setHistory] = useState<UserScanHistoryItem[]>([]);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        const p = await syncUserProfile(auth.currentUser);
        setProfile(p);
      } catch (err) {
        console.error('Failed to sync profile:', err);
      }
    } else {
      setProfile(null);
    }
  };

  const loadHistory = async () => {
    if (auth.currentUser) {
      const items = await getUserScanHistory(auth.currentUser.uid);
      setHistory(items);
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fireUser) => {
      setUser(fireUser);
      if (fireUser) {
        try {
          const prof = await syncUserProfile(fireUser);
          setProfile(prof);
          const hist = await getUserScanHistory(fireUser.uid);
          setHistory(hist);
        } catch (e) {
          console.error('Error on auth state changed sync:', e);
        }
      } else {
        setProfile(null);
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      const prof = await syncUserProfile(cred.user);
      setProfile(prof);
      closeAuthModal();
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      const prof = await syncUserProfile(cred.user);
      setProfile(prof);
      closeAuthModal();
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const prof = await syncUserProfile(cred.user);
      setProfile(prof);
      closeAuthModal();
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setHistory([]);
  };

  const changePlan = async (newPlan: PlanType) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    await setUserPlan(user.uid, newPlan);
    setProfile(prev => prev ? { ...prev, plan: newPlan } : null);
  };

  const checkScanAllowed = async () => {
    return checkCanUserScan(user ? user.uid : null);
  };

  const recordScan = async (scanInfo?: { url: string; domain: string; overallScore: number; securityScore: number }) => {
    await incrementUserScanUsage(user ? user.uid : null, scanInfo);
    if (user) {
      await refreshProfile();
      await loadHistory();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        changePlan,
        refreshProfile,
        checkScanAllowed,
        recordScan,
        history,
        loadHistory
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
