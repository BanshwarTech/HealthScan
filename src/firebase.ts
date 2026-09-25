import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test Firestore connection on boot as recommended by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
testConnection();

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanConfig {
  name: string;
  badge: string;
  dailyScanLimit: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free Starter',
    badge: 'FREE',
    dailyScanLimit: 5,
    features: [
      '5 Scans per Day',
      'Standard SSL/TLS & HTTP Headers Audit',
      'Basic SEO & Crawler Checks',
      'Community Support'
    ]
  },
  pro: {
    name: 'Pro Engineer',
    badge: 'PRO',
    dailyScanLimit: 50,
    features: [
      '50 Scans per Day',
      'Deep DNS, SPF & DMARC Spoofing Audits',
      'Full Broken Link Crawler & TTFB Profiling',
      'Priority PDF & Raw JSON Export',
      'Interactive Copy-Paste Code Fixes'
    ]
  },
  enterprise: {
    name: 'Enterprise Scale',
    badge: 'ENTERPRISE',
    dailyScanLimit: Infinity,
    features: [
      'Unlimited Scans',
      'Continuous Uptime & SSL Expiration Monitoring',
      'Webhook Alerting (Slack & Discord)',
      'White-Label Audit Reports',
      'Dedicated 24/7 Security Support'
    ]
  }
};

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: PlanType;
  dailyScansUsed: number;
  lastScanDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface UserScanHistoryItem {
  id: string;
  url: string;
  domain: string;
  overallScore: number;
  securityScore: number;
  timestamp: string;
}

const getTodayString = () => new Date().toISOString().slice(0, 10);

// Get or create user profile in Firestore
export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const today = getTodayString();

  if (snap.exists()) {
    const data = snap.data() as UserProfileData;
    // Reset daily scans if day has changed
    if (data.lastScanDate !== today) {
      await updateDoc(userRef, {
        dailyScansUsed: 0,
        lastScanDate: today
      });
      return { ...data, dailyScansUsed: 0, lastScanDate: today };
    }
    return data;
  }

  // New user initial profile
  const initialProfile: UserProfileData = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Member',
    photoURL: user.photoURL || undefined,
    plan: 'free',
    dailyScansUsed: 0,
    lastScanDate: today,
    createdAt: new Date().toISOString()
  };

  await setDoc(userRef, initialProfile);
  return initialProfile;
}

// Update user plan
export async function setUserPlan(userId: string, newPlan: PlanType): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    plan: newPlan
  });
}

// Check if user is allowed to perform a scan based on plan limits
export async function checkCanUserScan(userId: string | null): Promise<{
  allowed: boolean;
  reason?: string;
  remainingScans: number;
  limit: number;
  plan: PlanType;
}> {
  if (!userId) {
    // Unauthenticated guest user gets 3 scans max stored in localStorage
    const guestKey = `guest_scans_${getTodayString()}`;
    const used = parseInt(localStorage.getItem(guestKey) || '0', 10);
    const guestLimit = 3;
    if (used >= guestLimit) {
      return {
        allowed: false,
        reason: 'You have reached the guest limit of 3 scans today. Please create a free account to get 5 scans/day or upgrade to Pro!',
        remainingScans: 0,
        limit: guestLimit,
        plan: 'free'
      };
    }
    return {
      allowed: true,
      remainingScans: guestLimit - used,
      limit: guestLimit,
      plan: 'free'
    };
  }

  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return { allowed: true, remainingScans: 5, limit: 5, plan: 'free' };
  }

  const data = snap.data() as UserProfileData;
  const today = getTodayString();
  const scansUsed = data.lastScanDate === today ? (data.dailyScansUsed || 0) : 0;
  const planConfig = PLAN_LIMITS[data.plan || 'free'];

  if (scansUsed >= planConfig.dailyScanLimit) {
    return {
      allowed: false,
      reason: `You have reached your daily quota of ${planConfig.dailyScanLimit} scans on the ${planConfig.name} plan. Upgrade your plan to scan more!`,
      remainingScans: 0,
      limit: planConfig.dailyScanLimit,
      plan: data.plan
    };
  }

  return {
    allowed: true,
    remainingScans: planConfig.dailyScanLimit === Infinity ? 9999 : (planConfig.dailyScanLimit - scansUsed),
    limit: planConfig.dailyScanLimit,
    plan: data.plan
  };
}

// Increment scan count after execution
export async function incrementUserScanUsage(userId: string | null, scanInfo?: {
  url: string;
  domain: string;
  overallScore: number;
  securityScore: number;
}): Promise<void> {
  const today = getTodayString();

  if (!userId) {
    const guestKey = `guest_scans_${today}`;
    const used = parseInt(localStorage.getItem(guestKey) || '0', 10);
    localStorage.setItem(guestKey, (used + 1).toString());
    return;
  }

  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data() as UserProfileData;
    const currentUsed = data.lastScanDate === today ? (data.dailyScansUsed || 0) : 0;
    await updateDoc(userRef, {
      dailyScansUsed: currentUsed + 1,
      lastScanDate: today
    });

    if (scanInfo) {
      try {
        const historyCol = collection(db, 'users', userId, 'scans');
        await addDoc(historyCol, {
          ...scanInfo,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Failed to save scan to user history:', e);
      }
    }
  }
}

// Fetch scan history for user
export async function getUserScanHistory(userId: string): Promise<UserScanHistoryItem[]> {
  try {
    const historyCol = collection(db, 'users', userId, 'scans');
    const q = query(historyCol, orderBy('timestamp', 'desc'), limit(15));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<UserScanHistoryItem, 'id'>)
    }));
  } catch (err) {
    console.warn('Error fetching scan history:', err);
    return [];
  }
}
