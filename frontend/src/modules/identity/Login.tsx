import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Hexagon, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      {/* Gradient orbs on login page too */}
      <div className="orb-backdrop" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 glass-card">
            <Hexagon size={28} style={{ color: 'var(--fg)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
            Welcome back
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--fg-muted)' }}>
            Sign in to your ProcureFlow account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--fg-faint)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--fg-muted)' }}>
              <input type="checkbox" className="rounded" style={{ borderColor: 'var(--glass-border)' }} />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--fg-muted)' }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign in <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="text-center text-sm" style={{ color: 'var(--fg-faint)' }}>
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
