import React, { useState, useEffect } from 'react';
import { LogIn, Utensils, Mail, Lock, User as UserIcon, AlertCircle, Loader2, Sparkles, ChevronRight, ArrowLeft, CheckCircle, Trash2, Clock } from 'lucide-react';
import { signInWithGoogle, signUpWithEmail, loginWithEmail, resetPassword } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface SavedAccount {
  email: string;
  name?: string;
  photoURL?: string;
  lastUsed: number;
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('saved_accounts');
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved accounts", e);
      }
    }

    const lastEmail = localStorage.getItem('remembered_email');
    if (lastEmail) {
      setEmail(lastEmail);
    }
  }, []);

  const saveAccount = (user: any) => {
    const newAccount: SavedAccount = {
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
      lastUsed: Date.now()
    };

    const updated = [newAccount, ...savedAccounts.filter(a => a.email !== user.email)].slice(0, 5);
    setSavedAccounts(updated);
    localStorage.setItem('saved_accounts', JSON.stringify(updated));

    if (rememberMe) {
      localStorage.setItem('remembered_email', user.email);
    } else {
      localStorage.removeItem('remembered_email');
    }
  };

  const removeSavedAccount = (e: React.MouseEvent, emailToRemove: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.email !== emailToRemove);
    setSavedAccounts(updated);
    localStorage.setItem('saved_accounts', JSON.stringify(updated));
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      saveAccount(user);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox.");
      } else if (isSignUp) {
        if (!name) throw new Error("Please enter your name.");
        const user = await signUpWithEmail(email, password, name);
        saveAccount(user);
        setSuccess("Account created successfully! Redirecting...");
      } else {
        const user = await loginWithEmail(email, password);
        saveAccount(user);
        setSuccess("Logged in successfully! Redirecting...");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-xl rounded-[40px] shadow-2xl p-8 md:p-12 border border-white/50 dark:border-stone-700/50 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex bg-primary p-5 rounded-3xl text-white shadow-xl shadow-primary/20 mb-6"
          >
            <Utensils size={48} />
          </motion.div>
          <h1 className="text-4xl font-display tracking-tight text-stone-900 dark:text-white mb-2">De Choice</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">
            {isForgotPassword ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back to Uyo's best"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {savedAccounts.length > 0 && !isSignUp && !isForgotPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <h3 className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-4 text-center">Recent Logins</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {savedAccounts.map((account) => (
                  <div
                    key={account.email}
                    className="group relative flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => setEmail(account.email)}
                  >
                    <div className="relative">
                      {account.photoURL ? (
                        <img src={account.photoURL} alt={account.name} className="w-14 h-14 rounded-2xl border-2 border-white dark:border-stone-700 shadow-lg group-hover:border-primary transition-all" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-400 group-hover:text-primary transition-all border-2 border-white dark:border-stone-700 shadow-lg group-hover:border-primary">
                          <UserIcon size={24} />
                        </div>
                      )}
                      <button
                        onClick={(e) => removeSavedAccount(e, account.email)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 max-w-[60px] truncate">{account.name || account.email.split('@')[0]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-xs font-bold"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-xs font-bold"
            >
              <CheckCircle size={18} />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          {isSignUp && !isForgotPassword && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm text-stone-900 dark:text-white"
                required
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm text-stone-900 dark:text-white"
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm text-stone-900 dark:text-white"
                required
              />
            </div>
          )}

          {!isForgotPassword && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${rememberMe ? 'bg-primary' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${rememberMe ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-xs font-bold text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs font-bold text-stone-400 hover:text-primary transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                {isForgotPassword ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-4 text-right">
            <button
              onClick={() => setIsForgotPassword(true)}
              className="text-xs font-bold text-stone-400 hover:text-primary transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-100 dark:border-stone-700"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className="bg-white dark:bg-stone-800 px-4 text-stone-300 dark:text-stone-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-primary/50 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-sm group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
          Google
        </button>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsForgotPassword(false);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-stone-500 dark:text-stone-400 font-medium flex items-center justify-center gap-2 mx-auto hover:text-primary transition-colors"
          >
            {isForgotPassword ? (
              <><ArrowLeft size={16} /> Back to Login</>
            ) : (
              <>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <span className="text-primary font-bold">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
