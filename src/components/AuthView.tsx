import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthForm } from './AuthForm';

type AuthViewProps = {
  onSuccess: () => void;
};

export function AuthView({ onSuccess }: AuthViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d1b69] to-[#1a1a1a] text-white py-12">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2d9edb] mb-4">
            On Mind
          </h1>
          <p className="text-white/60">
            Your personal knowledge base<br />
            and YouTube companion
          </p>
        </div>
        <AuthForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}