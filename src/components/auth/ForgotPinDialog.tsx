import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth, getDummyPassword, hashPin } from '@/contexts/AuthContext';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { motion, AnimatePresence } from 'framer-motion';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "default_service";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "default_template";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "default_key";

interface ForgotPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'EMAIL' | 'OTP' | 'NEW_PIN' | 'SUCCESS';

export function ForgotPinDialog({ isOpen, onClose }: ForgotPinDialogProps) {
  const { setIsVerifyingPin } = useAuth();
  const [step, setStep] = useState<Step>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 mins
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail('');
      setOtp('');
      setNewPin('');
      setConfirmPin('');
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendCooldown]);

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setIsVerifyingPin(true);
    try {
      const dummyPassword = getDummyPassword(email);
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, dummyPassword);
      } catch (err: any) {
        toast.error("No Attendify account exists with this email address, or it's a legacy account that requires manual reset.");
        return;
      }

      const uid = userCredential.user.uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error("Account data not found.");
        return;
      }

      const data = userSnap.data();
      
      if (data.resetLockedUntil && data.resetLockedUntil.toDate() > new Date()) {
        toast.error("Too many incorrect attempts. Please try again later.");
        return;
      }

      const generatedOtp = generateOTP();
      const otpHash = hashPin(generatedOtp);
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await updateDoc(userRef, {
        resetOtpHash: otpHash,
        resetOtpExpiry: expiry,
        resetOtpAttempts: 0,
      });

      // Sign out immediately so they aren't left logged into Firebase
      await signOut(auth);

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: email,
            otp: generatedOtp,
            to_name: data.name || "Student"
          },
          EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) {
        console.error("EmailJS error:", emailErr);
        toast.warning("Failed to send email. Ensure EmailJS credentials are correct in .env");
      }

      setCountdown(600);
      setResendCooldown(60);
      setStep('OTP');
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      await signOut(auth).catch(() => {});
      setIsVerifyingPin(false);
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setIsVerifyingPin(true);
    
    try {
      const dummyPassword = getDummyPassword(email);
      const userCredential = await signInWithEmailAndPassword(auth, email, dummyPassword);
      const uid = userCredential.user.uid;
      
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      if (!data || !data.resetOtpHash) {
        throw new Error("No reset request found.");
      }

      if (data.resetLockedUntil && data.resetLockedUntil.toDate() > new Date()) {
        throw new Error("Too many incorrect attempts. Please try again in 15 minutes.");
      }

      if (new Date() > data.resetOtpExpiry.toDate()) {
        throw new Error("This verification code has expired. Please request a new code.");
      }

      if (data.resetOtpHash !== hashPin(otp)) {
        const attempts = (data.resetOtpAttempts || 0) + 1;
        if (attempts >= 5) {
          const lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
          await updateDoc(userRef, { resetLockedUntil: lockTime });
          throw new Error("Too many incorrect attempts. Please try again in 15 minutes.");
        } else {
          await updateDoc(userRef, { resetOtpAttempts: attempts });
          throw new Error("Incorrect verification code.");
        }
      }

      await signOut(auth);
      setStep('NEW_PIN');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      await signOut(auth).catch(() => {});
      setIsVerifyingPin(false);
      setIsLoading(false);
    }
  };

  const handleCreateNewPin = async () => {
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error("PIN must contain exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    
    setIsLoading(true);
    setIsVerifyingPin(true);
    try {
      const dummyPassword = getDummyPassword(email);
      const userCredential = await signInWithEmailAndPassword(auth, email, dummyPassword);
      const uid = userCredential.user.uid;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      const newPinHashObj = hashPin(newPin);
      if (data && data.pinHash === newPinHashObj) {
        toast.error("New PIN cannot be the same as your old PIN.");
        return;
      }

      await updateDoc(userRef, {
        pinHash: newPinHashObj,
        resetOtpHash: null,
        resetOtpExpiry: null,
        resetOtpAttempts: 0
      });

      await signOut(auth);
      setStep('SUCCESS');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      await signOut(auth).catch(() => {});
      setIsVerifyingPin(false);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl">
        <AnimatePresence mode="wait">
          
          {step === 'EMAIL' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <DialogTitle className="text-2xl font-bold">Forgot your PIN?</DialogTitle>
                <DialogDescription>
                  Enter your registered Attendify email address and we'll send you a verification code to reset your PIN.
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12" disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendCode} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12" disabled={isLoading || !email}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'OTP' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 relative">
                <Button variant="ghost" size="icon" onClick={() => setStep('EMAIL')} className="absolute -left-2 -top-2 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <DialogTitle className="text-2xl font-bold">Enter Verification Code</DialogTitle>
                <DialogDescription>
                  We've sent a 6-digit code to <strong>{email}</strong>
                </DialogDescription>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} className="gap-2">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>

                <div className="text-sm text-center text-slate-500">
                  {countdown > 0 ? (
                    <p>Code expires in <span className="font-medium text-slate-900 dark:text-white">{formatTime(countdown)}</span></p>
                  ) : (
                    <p className="text-red-500 font-medium">Code expired</p>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <Button 
                    onClick={handleVerifyOTP} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12" 
                    disabled={isLoading || otp.length !== 6 || countdown === 0}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSendCode} 
                    className="w-full rounded-xl h-12" 
                    disabled={isLoading || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'NEW_PIN' && (
            <motion.div
              key="new_pin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <DialogTitle className="text-2xl font-bold">Create New PIN</DialogTitle>
                <DialogDescription>
                  Please enter a new 6-digit PIN for your account.
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 flex flex-col items-center">
                  <label className="text-sm font-medium w-full text-left">New PIN</label>
                  <InputOTP maxLength={6} value={newPin} onChange={setNewPin} className="gap-2">
                    <InputOTPGroup>
                      {[0, 1, 2].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl" />)}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      {[3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="space-y-2 flex flex-col items-center mt-4">
                  <label className="text-sm font-medium w-full text-left">Confirm New PIN</label>
                  <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin} className="gap-2">
                    <InputOTPGroup>
                      {[0, 1, 2].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl" />)}
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      {[3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  onClick={handleCreateNewPin} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 mt-6" 
                  disabled={isLoading || newPin.length !== 6 || confirmPin.length !== 6}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update PIN"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold">PIN Reset Successful</DialogTitle>
                <DialogDescription className="text-base">
                  Your Attendify PIN has been updated successfully.
                  <br />Please login using your new PIN.
                </DialogDescription>
              </div>
              <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12">
                Back to Login
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
