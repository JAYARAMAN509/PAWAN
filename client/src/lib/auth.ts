import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";

export interface AppUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    // const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user data from our backend
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    
    return { firebaseUser: data.user, appUser: data.user };
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in");
  }
}

// Create account with email and password
export async function createAccount(email: string, password: string, userData: { name: string; phone?: string; role: string }) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user in our backend
    const response = await apiRequest("POST", "/api/auth/register", {
      email,
      password,
      ...userData
    });
    const data = await response.json();
    
    return { firebaseUser: result.user, appUser: data.user };
  } catch (error: any) {
    throw new Error(error.message || "Failed to create account");
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out");
  }
}

// Google sign in
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in with Google");
  }
}

// Handle redirect result (call this on app load)
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // You might want to sync with your backend here
      return result.user;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || "Failed to handle redirect");
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || "Failed to send reset email");
  }
}

// Get current user
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
