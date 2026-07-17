import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { ForgotPinDialog } from '@/components/auth/ForgotPinDialog';

export default function Login() {
    const { loginWithEmail, signupWithEmail, user } = useAuth();
    const navigate = useNavigate();
    
    // Global State
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
    
    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // This is a 6 digit PIN

    // Redirect if already logged in
    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password.length !== 6) {
            toast.error("Please enter a 6-digit PIN");
            return;
        }

        setIsLoading(true);
        try {
            if (isSignUp) {
                if (!name.trim()) {
                    toast.error("Please enter your name");
                    setIsLoading(false);
                    return;
                }
                await signupWithEmail(email, password, name.trim());
                toast.success('Account created successfully');
            } else {
                await loginWithEmail(email, password);
                toast.success('Logged in successfully');
            }
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50/50 via-white to-blue-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden transition-colors duration-500">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-300/10 rounded-full blur-[100px] pointer-events-none" />

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
                            className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Attendify
                        </h1>
                        <p className="text-blue-600/80 dark:text-blue-400 font-medium">
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
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1 w-full">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email address</label>
                            <div className="relative group w-full">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 w-full flex flex-col items-center">
                            <div className="flex justify-between w-full">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    6-Digit PIN
                                </label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPinOpen(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium mr-1"
                                    >
                                        Forgot PIN?
                                    </button>
                                )}
                            </div>
                            <InputOTP maxLength={6} value={password} onChange={setPassword} className="gap-2">
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                    <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                    <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                    <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                    <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || password.length !== 6 || !email}
                            className="w-full relative flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 overflow-hidden mt-4"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isSignUp ? 'Sign up' : 'Sign in'}</span>}
                        </button>
                    </form>
                    
                    <div className="text-center mb-6">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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

            <ForgotPinDialog 
                isOpen={isForgotPinOpen} 
                onClose={() => setIsForgotPinOpen(false)} 
            />
        </div>
    );
}
