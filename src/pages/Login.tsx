import React, { useState } from 'react';
import { useAuth, getAuthErrorMessage } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/Segmented';
import { TallyMark, Wordmark } from '@/components/layout/Wordmark';

type Mode = 'signin' | 'signup';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const isSignUp = mode === 'signup';

  if (user) {
    return <Navigate to="/" replace />;
  }

  const clearErrors = () => {
    setNameError('');
    setPasswordError('');
    setFormError('');
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    clearErrors();
  };

  const showError = (error: unknown) => {
    const message = getAuthErrorMessage(error);
    if (message) setFormError(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (isSignUp && !name.trim()) {
      setNameError('Enter your name.');
      return;
    }
    if (isSignUp && password.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password, name.trim());
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/');
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    clearErrors();
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
    clearErrors();
    if (!email) {
      setFormError('Enter your email above, then choose "Forgot password?".');
      return;
    }
    try {
      await resetPassword(email);
    } catch (error) {
      // Never reveal whether an account exists; only surface non-account errors
      const code = (error as { code?: string })?.code;
      if (code !== 'auth/user-not-found' && code !== 'auth/invalid-email') {
        showError(error);
        return;
      }
    }
    toast.success('If an account exists for that email, a reset link is on its way.');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel: laptops only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <Wordmark className="text-primary-foreground" />

        <div className="max-w-md">
          <h1 className="text-stat font-extrabold">Know exactly how many classes you can skip.</h1>
          <p className="mt-5 text-base leading-relaxed opacity-80">
            Mark each class, watch the tally grow, and see your safe-to-miss count update after every lecture.
          </p>
        </div>

        <TallyMark className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 opacity-10" />
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Wordmark className="mb-8 lg:hidden" />

          <h2 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? 'Start tracking attendance in a minute.' : 'Sign in to see where you stand.'}
          </p>

          <Segmented
            className="mt-6 w-full"
            label="Sign in or create an account"
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Create account' },
            ]}
          />

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Sam Rivera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  className="h-12"
                />
                {nameError && (
                  <p id="name-error" className="text-sm text-destructive">
                    {nameError}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                required
                placeholder="you@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="press -mr-2 min-h-11 rounded-md px-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(v => !v)}
                  className="press absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading || !email || !password}>
              {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={isLoading}>
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>
      </main>
    </div>
  );
}
