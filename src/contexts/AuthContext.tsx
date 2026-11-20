import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateProfile,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (fu: FirebaseUser, nameOverride?: string): User => ({
    id: fu.uid,
    name: nameOverride || fu.displayName || fu.email?.split('@')[0] || 'User',
    email: fu.email || '',
    picture: fu.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${fu.uid}`,
});

/** Maps Firebase error codes to messages that are safe and readable to show users. */
export const getAuthErrorMessage = (error: unknown): string => {
    const code = (error as { code?: string })?.code;
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Try signing in.';
        case 'auth/weak-password':
            return 'Password must be at least 8 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection and try again.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return '';
        default:
            return 'Authentication failed. Please try again.';
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            const userData = toUser(firebaseUser);
            // Set immediately so data listeners can start without waiting on the network
            setUser(userData);
            setIsLoading(false);

            // Create the profile document on first login (background, non-blocking)
            (async () => {
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const snap = await getDoc(userRef);
                    if (!snap.exists()) {
                        await setDoc(userRef, userData, { merge: true });
                    }
                } catch (error) {
                    console.error('Error fetching/creating user document', error);
                }
            })();
        });

        return () => unsubscribe();
    }, []);

    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
    };

    const signupWithEmail = async (email: string, password: string, name: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name });
        setUser(toUser(cred.user, name));
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            // Popups are unreliable in some mobile / installed-PWA contexts
            if ((error as { code?: string })?.code === 'auth/popup-blocked') {
                await signInWithRedirect(auth, provider);
                return;
            }
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email.trim());
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, isLoading, loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
