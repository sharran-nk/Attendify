import React, { useState } from 'react';
import { useAuth, getAuthErrorMessage } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
    const { loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword, user } = useAuth();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Redirect if already logged in
    if (user) {
        return <Navigate to="/" replace />;
    }

    const showError = (error: unknown) => {
        const message = getAuthErrorMessage(error);
        if (message) toast.error(message);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSignUp && !name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (isSignUp && password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);
        try {
            if (isSignUp) {
                await signupWithEmail(email, password, name.trim());
                toast.success('Account created successfully');
            } else {
                await loginWithEmail(email, password);
                toast.success('Logged in successfully');
            }
            navigate('/');
        } catch (error) {
            showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (error) {
            showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Enter your email above first, then tap 'Forgot password?'");
            return;
        }
        try {
            await resetPassword(email);
        } catch (error) {
            // Don't reveal whether the account exists; only surface non-account errors
            const code = (error as { code?: string })?.code;
            if (code !== 'auth/user-not-found' && code !== 'auth/invalid-email') {
                showError(error);
                return;
            }
        }
        toast.success("If an account exists for that email, a reset link is on its way.");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 via-white to-rose-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden transition-colors duration-500">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-rose-300/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] border border-white/50 dark:border-slate-800/50 p-8 sm:p-10">
                    
                    {/* Header Section */}
                    <div className="text-center space-y-3 mb-8">
                        <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30"
                        >
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Attendify
                        </h1>
                        <p className="text-rose-600/80 dark:text-rose-400 font-medium">
                            Track your attendance seamlessly
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 mb-6 flex flex-col items-center w-full">
                        <AnimatePresence mode="popLayout">
                            {isSignUp && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-1 w-full overflow-hidden"
                                >
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                                    <div className="relative group w-full">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1 w-full">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email address</label>
                            <div className="relative group w-full">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 w-full">
                            <div className="flex justify-between w-full">
                                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    Password
                                </label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors font-medium mr-1"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative group w-full">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-11 py-3 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || !password || !email}
                            className="w-full relative flex items-center justify-center gap-2 bg-brand hover:brightness-110 text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-rose-500/20 overflow-hidden mt-4"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isSignUp ? 'Sign up' : 'Sign in'}</span>}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 mb-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-xl py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
                            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
                            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                        </svg>
                        Continue with Google
                    </button>
                    
                    <div className="text-center mb-6">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4" />
                        Secure login powered by Firebase
                    </p>
                </div>
            </motion.div>

        </div>
    );
}
