import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle, XCircle, X, ArrowRight, User } from 'lucide-react';
import StudyXLogo from './StudyXLogo';

interface LoginProps {
  onSuccess: (token: string, user: any) => void;
  onNavigateToSignup: () => void;
}

export default function Login({ onSuccess, onNavigateToSignup }: LoginProps) {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Validation
  const validateForm = () => {
    if (!identifier.trim()) {
      setError('Email or Username is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      // If contains @, assume it's an email, otherwise assume username
      const isEmail = identifier.includes('@');
      const payload: any = { password };
      if (isEmail) {
        payload.email = identifier.trim();
      } else {
        payload.username = identifier.trim();
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email/username or password');
      }

      setSuccess('Logged in successfully!');
      if (rememberMe) {
        localStorage.setItem('studyx_remember_me', 'true');
      } else {
        localStorage.removeItem('studyx_remember_me');
      }

      setTimeout(() => {
        onSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-screen" className="relative flex flex-col items-center justify-center min-h-[85vh] px-4">
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
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">Welcome Back</h2>
          <p className="text-xs text-zinc-500 mt-1.5 max-w-[280px]">
            Log in to access your study desk, sync custom metrics, and connect with your team.
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono block">
              Email or Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Mail size={15} />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="yash@domain.com or yashu"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-mono">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[10px] text-yellow-500/85 hover:text-yellow-400 font-medium transition"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-11 pr-11 py-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 focus:border-yellow-500/80 transition duration-250 disabled:opacity-50"
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

          {/* Remember me details */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-yellow-500 focus:ring-yellow-500/40 focus:ring-offset-0 focus:outline-none transition"
              />
              <span className="text-[11px] text-zinc-500 font-medium">Keep me logged in</span>
            </label>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/15 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Entering Dashboard...</span>
              </>
            ) : (
              <>
                <span>Acknowledge & Access</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Navigation bottom */}
        <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-center gap-1 text-xs">
          <span className="text-zinc-500">New study partner?</span>
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="text-yellow-500 hover:text-yellow-400 font-semibold transition"
          >
            Create desk account
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

      {/* Forgot Password Placeholder Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-[380px] bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl shadow-2xl text-center relative"
            >
              <button
                onClick={() => setShowForgotPassword(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition"
              >
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={20} className="text-yellow-500" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Password Recovery</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Password recovery flows are currently simulated. Please contact the system administrator or create a new partner account to continue.
              </p>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs py-2.5 rounded-xl hover:bg-zinc-850 active:scale-95 transition font-semibold"
              >
                Understood, Return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
