import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/endpoints';
import { Hexagon, ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-6">
            <Hexagon size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-neutral-500 text-sm mt-2">
            {isSubmitted ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm text-neutral-400 mb-6">We've sent a reset link to <span className="text-white">{email}</span></p>
            <Link to="/login" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@company.com"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
            <Link to="/login" className="btn-ghost inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
