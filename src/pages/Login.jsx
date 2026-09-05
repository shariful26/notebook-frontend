import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 402) {
        setError('Backend service disabled (402 Payment Required). Please check backend deployment.');
      } else if (!err.response) {
        setError('Network error: Unable to connect to the server.');
      } else {
        setError(err.response?.data?.error || 'Failed to login');
      }
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            margin: '0 auto 16px'
          }}>
            <LogIn color="white" size={32} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome Back</h2>
          <p>Login to your Smart Notebook</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', background: 'rgba(239, 68, 68, 0.1)', 
            borderLeft: '4px solid var(--danger)', color: 'var(--danger)',
            marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
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
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                style={{ paddingLeft: '40px', paddingRight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  padding: '0', lineHeight: '1'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }} />

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Sign In
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
