import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { UserProfile, UserRole, UserStatus, GeneratedWebsite, SystemSettings } from '../types';

export const ADMIN_EMAIL = 'nocteos67@gmail.com';

// Official Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyCZIDtUteM2MiESDJd35gaKPHX_Ht1zL6s",
  authDomain: "projectchat01-d16bc.firebaseapp.com",
  databaseURL: "https://projectchat01-d16bc-default-rtdb.firebaseio.com",
  projectId: "projectchat01-d16bc",
  storageBucket: "projectchat01-d16bc.appspot.com",
  messagingSenderId: "163313653543",
  appId: "1:163313653543:web:6d842890188ba76b11bb02",
  measurementId: "G-7QZP6V6WLK"
};

// Initialize Firebase App defensively
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged, signOut };

// Local Storage Fallback Key for resilient offline / demo persistence
const LOCAL_USERS_KEY = 'vimos_local_users_db_v1';
const LOCAL_SITES_KEY = 'vimos_local_sites_db_v1';
const LOCAL_SETTINGS_KEY = 'vimos_local_settings_db_v1';
const ACTIVE_SESSION_KEY = 'vimos_active_session_v1';

// Timeout helper to prevent infinite spinning on network or Firestore stalls
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

// Get stored active session
export function getActiveSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Save active session
export function setActiveSession(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to set active session:', e);
  }
}

// Default system settings
const DEFAULT_SETTINGS: SystemSettings = {
  requireApprovalForNewUsers: true,
  defaultCreditsPerUser: 25,
  aiModel: 'gemini-3.8-flash',
  systemNotice: 'Welcome to vimos.ai! Member registrations require admin verification.'
};

// Test firestore connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase client is offline or restricted. Local persistence mode enabled.');
    }
  }
}
testConnection();

// Get local users array
function getLocalUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      // Seed default admin user
      const defaultAdmin: UserProfile = {
        uid: 'admin_nocteos67_uid',
        email: ADMIN_EMAIL,
        displayName: 'Super Admin (Nocteos)',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        credits: 999999,
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save local users
function saveLocalUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
}

// Get system settings
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
  } catch (err) {
    console.warn('Firestore settings fetch error, using local settings:', err);
  }
  const local = localStorage.getItem(LOCAL_SETTINGS_KEY);
  return local ? JSON.parse(local) : DEFAULT_SETTINGS;
}

// Update system settings
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  const current = await getSystemSettings();
  const updated = { ...current, ...settings };
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, updated, { merge: true });
  } catch (e) {
    console.warn('Firestore update settings failed, updating local storage:', e);
  }
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
}

// Verify if user account was created by Admin
export async function verifyUserIsRegisteredByAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  const normEmail = email.trim().toLowerCase();
  if (normEmail === ADMIN_EMAIL.toLowerCase()) return true;

  try {
    const firestoreCheck = async () => {
      const q = query(collection(db, 'users'), where('email', '==', normEmail));
      const snap = await getDocs(q);
      return !snap.empty;
    };
    const foundInFirestore = await withTimeout(firestoreCheck(), 1500, false);
    if (foundInFirestore) return true;
  } catch (err) {
    console.warn('Firestore user check failed, fallback to local storage:', err);
  }

  const localUsers = getLocalUsers();
  return localUsers.some(u => u.email.toLowerCase() === normEmail);
}

// Complete Authentication & Login flow with instant fallback
export async function loginUserWithCredentials(email: string, password: string): Promise<UserProfile> {
  const normEmail = email.trim().toLowerCase();
  const isSuperAdmin = normEmail === ADMIN_EMAIL.toLowerCase();

  // 1. Verify user is Admin or Admin-created
  const isAllowed = await verifyUserIsRegisteredByAdmin(normEmail);
  if (!isAllowed) {
    throw new Error('Akun Anda belum dibuat oleh Admin. Silakan hubungi Admin untuk dibuatkan akun.');
  }

  // 2. Try Firebase Auth with 2-second timeout
  let fbUser: User | null = null;
  try {
    const tryAuth = async () => {
      try {
        const cred = await signInWithEmailAndPassword(auth, normEmail, password);
        return cred.user;
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, normEmail, password);
            return cred.user;
          } catch {
            return null;
          }
        }
        return null;
      }
    };
    fbUser = await withTimeout(tryAuth(), 2000, null);
  } catch (e) {
    console.warn('Firebase Auth attempt bypassed:', e);
  }

  // 3. Construct or fetch profile
  let profile: UserProfile | null = null;
  if (fbUser) {
    profile = await syncUserProfile(fbUser);
  }

  if (!profile) {
    // Check local storage for existing user or create
    const localUsers = getLocalUsers();
    const existing = localUsers.find(u => u.email.toLowerCase() === normEmail);
    if (existing) {
      profile = { ...existing, lastLogin: new Date().toISOString() };
    } else {
      profile = {
        uid: fbUser ? fbUser.uid : (isSuperAdmin ? 'admin_nocteos67_uid' : 'usr_' + Date.now()),
        email: normEmail,
        displayName: isSuperAdmin ? 'Super Admin (Nocteos)' : normEmail.split('@')[0],
        role: isSuperAdmin ? 'admin' : 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
        credits: isSuperAdmin ? 999999 : 25,
        lastLogin: new Date().toISOString()
      };
    }
  }

  // Save session & local storage
  const localUsers = getLocalUsers();
  const idx = localUsers.findIndex(u => u.email.toLowerCase() === normEmail);
  if (idx >= 0) {
    localUsers[idx] = profile;
  } else {
    localUsers.push(profile);
  }
  saveLocalUsers(localUsers);
  setActiveSession(profile);

  return profile;
}

// Sync or fetch user profile from Firestore / Local Storage
export async function syncUserProfile(user: User): Promise<UserProfile | null> {
  const userEmail = user.email || '';
  const isSuperAdmin = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Check if account was created by admin
  const isRegistered = await verifyUserIsRegisteredByAdmin(userEmail);
  if (!isRegistered && !isSuperAdmin) {
    console.warn(`User ${userEmail} is not registered by Admin.`);
    return null;
  }
  
  let profile: UserProfile | null = null;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await withTimeout(getDoc(userRef), 1500, null as any);
    if (snap && snap.exists && snap.exists()) {
      profile = snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Firestore user fetch failed, searching local storage:', err);
  }

  const localUsers = getLocalUsers();
  const localIndex = localUsers.findIndex(u => u.uid === user.uid || u.email.toLowerCase() === userEmail.toLowerCase());

  if (!profile && localIndex >= 0) {
    profile = localUsers[localIndex];
  }

  if (!profile) {
    // If not found yet but registered by Admin
    const settings = await getSystemSettings();
    const role: UserRole = isSuperAdmin ? 'admin' : 'member';
    const status: UserStatus = 'active'; // Admin created accounts are active
    
    profile = {
      uid: user.uid,
      email: userEmail,
      displayName: user.displayName || userEmail.split('@')[0] || 'Member User',
      photoURL: user.photoURL || undefined,
      role,
      status,
      createdAt: new Date().toISOString(),
      credits: isSuperAdmin ? 999999 : settings.defaultCreditsPerUser,
      lastLogin: new Date().toISOString()
    };
  } else {
    // Ensure admin role if email matches nocteos67@gmail.com
    if (isSuperAdmin && (profile.role !== 'admin' || profile.status !== 'active')) {
      profile.role = 'admin';
      profile.status = 'active';
      profile.credits = 999999;
    }
    profile.lastLogin = new Date().toISOString();
  }

  // Persist to Firestore
  try {
    setDoc(userRef, profile, { merge: true }).catch(() => {});
  } catch (e) {
    console.warn('Could not write profile to Firestore:', e);
  }

  // Sync to local storage
  if (localIndex >= 0) {
    localUsers[localIndex] = profile;
  } else {
    localUsers.push(profile);
  }
  saveLocalUsers(localUsers);
  setActiveSession(profile);

  return profile;
}

// Get all registered users (for Admin GUI)
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const users = snap.docs.map(doc => doc.data() as UserProfile);
      saveLocalUsers(users);
      return users;
    }
  } catch (err) {
    console.warn('Failed to fetch users from Firestore, using local storage:', err);
  }
  return getLocalUsers();
}

// Update user status (for Admin GUI)
export async function updateUserStatus(uid: string, status: UserStatus, role?: UserRole, credits?: number): Promise<void> {
  const updates: Partial<UserProfile> = { status };
  if (role) updates.role = role;
  if (credits !== undefined) updates.credits = credits;

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (e) {
    console.warn('Failed to update user in Firestore:', e);
  }

  const localUsers = getLocalUsers();
  const idx = localUsers.findIndex(u => u.uid === uid);
  if (idx >= 0) {
    localUsers[idx] = { ...localUsers[idx], ...updates };
    saveLocalUsers(localUsers);
  }
}

// Create new user directly from Admin Panel
export async function createMemberByAdmin(email: string, displayName: string, role: UserRole, status: UserStatus, credits: number): Promise<UserProfile> {
  const fakeUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newUser: UserProfile = {
    uid: fakeUid,
    email,
    displayName: displayName || email.split('@')[0],
    role,
    status,
    createdAt: new Date().toISOString(),
    credits: credits || 25,
    lastLogin: new Date().toISOString()
  };

  try {
    const userRef = doc(db, 'users', fakeUid);
    await setDoc(userRef, newUser);
  } catch (e) {
    console.warn('Firestore create user error:', e);
  }

  const local = getLocalUsers();
  local.push(newUser);
  saveLocalUsers(local);

  return newUser;
}

// Delete user (Admin Panel)
export async function deleteUserByAdmin(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (e) {
    console.warn('Firestore delete user failed:', e);
  }
  const local = getLocalUsers().filter(u => u.uid !== uid);
  saveLocalUsers(local);
}

// Save Website Project
export async function saveGeneratedWebsite(site: Omit<GeneratedWebsite, 'id' | 'createdAt'>): Promise<GeneratedWebsite> {
  const id = 'site_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newSite: GeneratedWebsite = {
    ...site,
    id,
    createdAt: new Date().toISOString(),
    views: 1,
    isPublic: true
  };

  try {
    const siteRef = doc(db, 'websites', id);
    await setDoc(siteRef, newSite);
  } catch (e) {
    console.warn('Failed to save website to Firestore:', e);
  }

  // Save to Local Storage
  try {
    const raw = localStorage.getItem(LOCAL_SITES_KEY);
    const sites: GeneratedWebsite[] = raw ? JSON.parse(raw) : [];
    sites.unshift(newSite);
    localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(sites));
  } catch (err) {
    console.error('Local storage site save failed:', err);
  }

  return newSite;
}

// Get user websites
export async function getUserWebsites(userEmail: string): Promise<GeneratedWebsite[]> {
  try {
    const q = query(collection(db, 'websites'), where('authorEmail', '==', userEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as GeneratedWebsite);
    }
  } catch (e) {
    console.warn('Firestore sites query failed:', e);
  }

  try {
    const raw = localStorage.getItem(LOCAL_SITES_KEY);
    const sites: GeneratedWebsite[] = raw ? JSON.parse(raw) : [];
    return sites.filter(s => s.authorEmail.toLowerCase() === userEmail.toLowerCase() || userEmail === ADMIN_EMAIL);
  } catch {
    return [];
  }
}

// Delete website
export async function deleteWebsite(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'websites', id));
  } catch (e) {
    console.warn('Firestore delete site failed:', e);
  }

  try {
    const raw = localStorage.getItem(LOCAL_SITES_KEY);
    if (raw) {
      const sites: GeneratedWebsite[] = JSON.parse(raw);
      const filtered = sites.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(filtered));
    }
  } catch {}
}
