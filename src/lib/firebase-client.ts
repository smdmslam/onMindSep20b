import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';

// Types (matching your existing Supabase types)
export type Entry = {
  id: string;
  user_id: DocumentReference;
  title: string;
  content: string;
  explanation: string | null;
  url?: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  is_pinned: boolean;
  is_flashcard: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

// Helper function to convert Firebase user to your AuthUser type
function convertFirebaseUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || undefined,
    picture: user.photoURL || undefined
  };
}

// Authentication functions
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { data: { user: convertFirebaseUser(userCredential.user) }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: convertFirebaseUser(userCredential.user) }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // The redirect will happen, so we don't return anything here
    // The result will be handled by getRedirectResult in the auth state listener
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Entry management functions
export async function getEntries(userId?: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser && !userId) {
      return { data: [], error: null };
    }
    
    // Use the current user's UID directly (since all entries are now mapped to Google Auth)
    const targetUserId = userId || currentUser?.uid;
    if (!targetUserId) {
      return { data: [], error: null };
    }
    
    const userRef = doc(db, 'users', targetUserId);
    const q = query(
      collection(db, 'entries'),
      where('user_id', '==', userRef),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entry[];
    
    return { data: entries, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createEntry(entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Use the current user's UID directly (since all entries are now mapped to Google Auth)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { data: null, error: new Error('User not authenticated') };
    }
    
    const userRef = doc(db, 'users', currentUser.uid);
    
    const entryData = {
      ...entry,
      user_id: userRef,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'entries'), entryData);
    const newEntry = { id: docRef.id, ...entryData };
    
    return { data: newEntry, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateEntry(id: string, updates: Partial<Entry>) {
  try {
    const entryRef = doc(db, 'entries', id);
    const updateData = {
      ...updates,
      updated_at: Timestamp.now()
    };
    
    await updateDoc(entryRef, updateData);
    return { data: { id, ...updates }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteEntry(id: string) {
  try {
    await deleteDoc(doc(db, 'entries', id));
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Search and filter functions
export async function searchEntries(userId: string, searchTerm: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const q = query(
      collection(db, 'entries'),
      where('user_id', '==', userRef),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const allEntries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entry[];
    
    // Client-side filtering for search (Firestore has limited text search)
    const filteredEntries = allEntries.filter(entry => 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { data: filteredEntries, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEntriesByCategory(userId: string, category: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const q = query(
      collection(db, 'entries'),
      where('user_id', '==', userRef),
      where('category', '==', category),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entry[];
    
    return { data: entries, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getFavorites(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const q = query(
      collection(db, 'entries'),
      where('user_id', '==', userRef),
      where('is_favorite', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entry[];
    
    return { data: entries, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getPinnedEntries(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const q = query(
      collection(db, 'entries'),
      where('user_id', '==', userRef),
      where('is_pinned', '==', true),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entry[];
    
    return { data: entries, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Handle redirect result
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User signed in via redirect
      return { data: { user: convertFirebaseUser(result.user) }, error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Auth state listener
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback('SIGNED_IN', { user: convertFirebaseUser(user) });
    } else {
      callback('SIGNED_OUT', null);
    }
  });
}

// Export auth and db for direct access if needed
export { auth, db };
