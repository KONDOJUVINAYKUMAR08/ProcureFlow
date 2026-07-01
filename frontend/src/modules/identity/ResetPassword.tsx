import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/endpoints';
import { Hexagon, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
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
          <h1 className="text-2xl font-bold tracking-tight">New password</h1>
          <p className="text-neutral-500 text-sm mt-2">Enter your new password</p>
        </div>
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Resetting...' : 'Reset password'}
          </button>
          <Link to="/login" className="btn-ghost inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
