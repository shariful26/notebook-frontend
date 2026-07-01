import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data && res.data.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="flex-center" style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            margin: '0 auto 16px'
          }}>
            <KeyRound color="white" size={30} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Forgot Password?</h2>
          <p style={{ fontSize: '0.9rem' }}>
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px', background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid var(--danger)', color: 'var(--danger)',
            marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Success State */}
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="flex-center" style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid var(--success)',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={28} color="var(--success)" />
            </div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Check your inbox!</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>
              We sent a password reset link to <strong style={{ color: 'var(--primary)' }}>{email}</strong>.
              The link expires in 10 minutes.
            </p>
            {devResetUrl && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px dashed var(--primary)', marginBottom: '24px' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>[Dev Mode] Test Email Link:</p>
                <Link to={`/reset-password/${devResetUrl.substring(devResetUrl.lastIndexOf('/') + 1)}`} className="btn btn-primary" style={{ display: 'inline-block', fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none' }}>
                  Reset Password Now
                </Link>
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setError(''); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', padding: 0
                }}
              >
                try again
              </button>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
