import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService } from './authService';
import { tokenStore } from './token';

const googleProvider = new GoogleAuthProvider();

// Configure Google provider to always show account selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const firebaseAuthService = {
  /**
   * Sign in with Google using Firebase
   * Returns the ID token to send to backend
   */
  async signInWithGoogle(): Promise<string> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get the ID token
      const idToken = await user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('Firebase Google Sign-In Error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Firebase Sign-Out Error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Complete Google login flow:
   * 1. Sign in with Firebase
   * 2. Get ID token
   * 3. Send to backend for verification and token generation
   */
  async completeGoogleLogin(): Promise<any> {
    try {
      // Step 1: Sign in with Firebase
      console.log('🔐 [FIREBASE] Signing in with Google...');
      const idToken = await this.signInWithGoogle();
      console.log('🔐 [FIREBASE] Got ID token, sending to backend...');

      // Step 2: Send ID token to backend
      const response = await authService.googleLogin(idToken);
      console.log('🔐 [FIREBASE] Backend response:', response);

      // Step 3: Store tokens (authService already does this, but ensure it's done)
      if (response.token) {
        console.log('🔐 [FIREBASE] Storing tokens...');
        tokenStore.setTokens(response.token.access_token, response.token.refresh_token);
      }

      console.log('🔐 [FIREBASE] Google login complete, returning user:', response);
      return response;
    } catch (error: any) {
      console.error('Google login flow error:', error);
      throw error;
    }
  },
};
