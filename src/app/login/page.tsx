'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/nodes';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(from);
    } else {
      setError('Identifiant ou mot de passe incorrect.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8 border border-white/10"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(0,240,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/ovhcloud-logo.png"
            alt="OVHcloud"
            width={140}
            height={35}
            className="h-8 w-auto"
            style={{ filter: 'brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.25))' }}
          />
        </div>

        <h1 className="text-white/80 text-sm font-bold uppercase tracking-widest text-center mb-6">
          Accès interne
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
          />

          {error && (
            <p className="text-red-400/80 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-black transition-all duration-200 disabled:opacity-50"
            style={{ background: loading ? '#00F0FF80' : '#00F0FF' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
