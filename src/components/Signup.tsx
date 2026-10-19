import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, XCircle, X, ArrowRight } from 'lucide-react';
import StudyXLogo from './StudyXLogo';

interface SignupProps {
  onSuccess: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

export default function Signup({ onSuccess, onNavigateToLogin }: SignupProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Validation
  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return false;
    }
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Try a different username/email.');
      }

      setSuccess('Account created successfully!');
      
      setTimeout(() => {
        onSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signup-screen" className="relative flex flex-col items-center justify-center min-h-[85vh] px-4">
      {/* Background Ambience elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 ambient-glow-yellow" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/5 filter blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] minimal-card p-8 md:p-10 relative z-10"
      >
        {/* Header and Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <StudyXLogo className="mb-4 scale-110" />
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">Create Account</h2>
          <p className="text-xs text-zinc-500 mt-1.5 max-w-[280px]">
            Join the premium community of StudyX, set focus streaks, and keep dashboards synced.
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono block">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <User size={15} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yashu"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Mail size={15} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yash@domain.com"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono block">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={isLoading}
                className="w-full pl-11 pr-11 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono block">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                disabled={isLoading}
                className="w-full pl-11 pr-11 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/15 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:scale-100 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register & Access</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Navigation bottom */}
        <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-center gap-1 text-xs">
          <span className="text-zinc-500">Already a partner?</span>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-yellow-500 hover:text-yellow-400 font-semibold transition"
          >
            Log in to desk
          </button>
        </div>
      </motion.div>

      {/* Floating alert toasts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-950/80 border border-red-800/60 backdrop-blur-md text-red-200 px-4 py-3.5 rounded-xl shadow-2xl max-w-sm"
          >
            <XCircle size={16} className="text-red-400 shrink-0" />
            <span className="text-xs font-medium leading-relaxed">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-auto p-0.5 transition">
              <X size={14} />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-950/80 border border-green-800/60 backdrop-blur-md text-green-200 px-4 py-3.5 rounded-xl shadow-2xl max-w-sm"
          >
            <CheckCircle size={16} className="text-green-400 shrink-0" />
            <span className="text-xs font-medium leading-relaxed">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-200 ml-auto p-0.5 transition">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
