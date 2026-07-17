import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import CryptoJS from 'crypto-js';

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
    pinHash?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    setIsVerifyingPin: (val: boolean) => void;
    loginWithEmail: (email: string, pin: string) => Promise<void>;
    signupWithEmail: (email: string, pin: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DUMMY_SALT = "Attendify_Campus_Secure_2026";
export const getDummyPassword = (email: string) => {
    return CryptoJS.SHA256(email.toLowerCase().trim() + DUMMY_SALT).toString().substring(0, 20) + "!A1a";
};

export const hashPin = (pin: string) => {
    return CryptoJS.SHA256(pin.trim()).toString();
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifyingPin, setIsVerifyingPin] = useState(false); // Prevents premature auth state updates during PIN verification

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (isVerifyingPin) return; // Block state updates while checking PIN internally

            if (firebaseUser) {
                const userData: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    picture: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
                };

                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        userData.pinHash = data.pinHash;
                    } else {
                        await setDoc(userRef, userData, { merge: true });
                    }
                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching/creating user document", error);
                    setUser(userData); // Fallback
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [isVerifyingPin]);

    const loginWithEmail = async (email: string, pin: string) => {
        setIsVerifyingPin(true);
        try {
            // First, try logging in with the dummy password (new/migrated users)
            const dummyPassword = getDummyPassword(email);
            try {
                const credential = await signInWithEmailAndPassword(auth, email, dummyPassword);
                
                // Fetch user document to check PIN hash
                const userRef = doc(db, 'users', credential.user.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                
                if (userData && userData.pinHash === hashPin(pin)) {
                    // PIN is correct
                    setIsVerifyingPin(false); // allow onAuthStateChanged to pick it up
                    return;
                } else {
                    // PIN is wrong
                    await signOut(auth);
                    throw new Error("auth/wrong-password");
                }
            } catch (err: any) {
                if (err.message === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                    // It might be a legacy user whose password is the PIN itself.
                    try {
                        const credential = await signInWithEmailAndPassword(auth, email, pin);
                        // If we are here, legacy login succeeded! Let's migrate them to the new system.
                        const newPinHash = hashPin(pin);
                        const userRef = doc(db, 'users', credential.user.uid);
                        
                        await updatePassword(credential.user, dummyPassword);
                        await setDoc(userRef, { pinHash: newPinHash }, { merge: true });
                        
                        setIsVerifyingPin(false);
                        return;
                    } catch (legacyErr: any) {
                        throw new Error("Invalid email or PIN.");
                    }
                }
                throw err;
            }
        } finally {
            // If it failed completely, reset the flag so they are logged out.
            setIsVerifyingPin(false);
            // Trigger auth state change evaluation again in case it was left hanging
            if (!auth.currentUser) {
                setUser(null);
            }
        }
    };

    const signupWithEmail = async (email: string, pin: string, name: string) => {
        setIsVerifyingPin(true);
        try {
            const dummyPassword = getDummyPassword(email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, dummyPassword);
            
            await updateProfile(userCredential.user, {
                displayName: name
            });

            const newPinHash = hashPin(pin);
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, { pinHash: newPinHash }, { merge: true });

            setUser({
                id: userCredential.user.uid,
                name: name,
                email: email,
                picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${userCredential.user.uid}`,
                pinHash: newPinHash
            });
        } catch (error) {
            console.error('Email signup failed:', error);
            throw error;
        } finally {
            setIsVerifyingPin(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setIsVerifyingPin, loginWithEmail, signupWithEmail, logout }}>
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
