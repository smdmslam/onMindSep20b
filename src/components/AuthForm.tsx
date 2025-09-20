import React, { useState } from 'react';
import { signIn, signUp, signInWithGoogle } from '../lib/supabase';
import { toast } from 'react-hot-toast';

type AuthFormProps = {
  onSuccess: () => void;
};

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password);
        toast.success('Account created! You can now sign in.');
        setIsSignUp(false);
        setFormData({ email: '', password: '' });
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Welcome back!');
        onSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('invalid_credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('email_taken')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('weak_password')) {
          toast.error('Password is too weak. Please use at least 6 characters.');
        } else {
          toast.error('Authentication failed. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('Starting Google sign-in process...');
      await signInWithGoogle();
      // The page will redirect to Google auth, so we don't need to call onSuccess here
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google sign in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-white/60 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white/60 mb-1">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
            placeholder={isSignUp ? 'Choose a secure password' : 'Enter your password'}
            minLength={6}
            required
          />
          {isSignUp && (
            <p className="mt-1 text-xs text-white/40">
              Password must be at least 6 characters long
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative px-4 bg-[#1a1a1a]/50 text-sm text-white/40">
              or
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a]/80 border border-white/10 text-white rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-[#2d9edb] border-t-transparent rounded-full"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="opacity-80">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-white/80">Sign in with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormData({ email: '', password: '' });
            }}
            className="text-white/60 hover:text-white text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="text-sm text-white/40 mt-6">
          Version 30Mb video
        </p>
      </form>
    </div>
  );
}