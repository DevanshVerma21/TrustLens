import React, { useState, useRef, useEffect } from 'react';
import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import authService from '../services/authService.js';

// ── Password strength meter ───────────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak',      color: '#ef4444', pct: 20 };
  if (score === 2) return { score, label: 'Fair',      color: '#f97316', pct: 40 };
  if (score === 3) return { score, label: 'Good',      color: '#eab308', pct: 60 };
  if (score === 4) return { score, label: 'Strong',    color: '#22c55e', pct: 80 };
  return              { score, label: 'Very Strong', color: '#10b981', pct: 100 };
}

// ── Field component ───────────────────────────────────────────────────────────
function AuthField({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, error, rightSlot }) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon className="auth-input-icon" size={16} />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`auth-input ${error ? 'auth-input-error' : ''}`}
          autoComplete={id}
        />
        {rightSlot}
      </div>
      {error && (
        <p className="auth-field-error">
          <AlertCircle size={12} className="inline mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const AuthPage = ({ onAuthSuccess }) => {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const emailRef = useRef(null);
  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    if (globalError)   setGlobalError('');
  };

  // ── Client-side validation ──────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!form.email)           errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';

    if (!form.password)        errs.password = 'Password is required';
    else if (mode === 'register') {
      if (form.password.length < 8)       errs.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(form.password)) errs.password = 'Include at least one uppercase letter';
      else if (!/[0-9]/.test(form.password)) errs.password = 'Include at least one number';
    }
    return errs;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError('');

    try {
      let result;
      if (mode === 'login') {
        result = await authService.login(form.email, form.password);
      } else {
        result = await authService.register(form.email, form.password, form.name);
      }
      onAuthSuccess(result.user);
    } catch (err) {
      let msg = 'Something went wrong. Please try again.';

      if (err.response) {
        // Server replied with a non-2xx status
        const d = err.response.data;
        if (d?.message) {
          msg = d.message;
        } else if (d?.details?.[0]?.message) {
          msg = d.details[0].message;
        } else if (err.response.status === 409) {
          msg = 'An account with this email already exists.';
        } else if (err.response.status === 429) {
          msg = 'Too many attempts. Please wait a few minutes and try again.';
        } else if (err.response.status === 422) {
          msg = d?.details?.[0]?.message || 'Validation error — check your inputs.';
        }
      } else if (err.request) {
        // Request sent but no response received — server down / network issue
        msg = 'Cannot reach the server. Make sure the backend is running on port 5000.';
      }

      setGlobalError(msg);

    } finally {
      setLoading(false);
    }
  };

  const strength = mode === 'register' ? getPasswordStrength(form.password) : null;
  const isLogin  = mode === 'login';

  return (
    <div className="auth-root">
      {/* Background effects */}
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">
            <Shield size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="auth-brand">TrustLens</h1>
            <p className="auth-brand-sub">Explainable AI · Digital Banking</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            id="auth-tab-login"
            type="button"
            className={`auth-tab ${isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('login'); setErrors({}); setGlobalError(''); }}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            id="auth-tab-register"
            type="button"
            className={`auth-tab ${!isLogin ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('register'); setErrors({}); setGlobalError(''); }}
          >
            <UserPlus size={15} />
            Create Account
          </button>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="auth-heading">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-subheading">
            {isLogin
              ? 'Sign in to access your fraud monitoring dashboard'
              : 'Get started with AI-powered transaction protection'}
          </p>
        </div>

        {/* Global error */}
        {globalError && (
          <div id="auth-error-banner" className="auth-error-banner">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <AuthField
              id="name"
              label="Full Name (optional)"
              value={form.name}
              onChange={setField('name')}
              placeholder="Jane Smith"
              icon={User}
              error={errors.name}
            />
          )}

          <AuthField
            id="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={setField('email')}
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email}
          />

          <AuthField
            id="password"
            label="Password"
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={setField('password')}
            placeholder={isLogin ? '••••••••' : 'Min 8 chars, 1 uppercase, 1 number'}
            icon={Lock}
            error={errors.password}
            rightSlot={
              <button
                type="button"
                id="auth-toggle-pwd"
                onClick={() => setShowPwd((s) => !s)}
                className="auth-show-pwd-btn"
                tabIndex={-1}
                title={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Password strength meter */}
          {!isLogin && form.password && (
            <div className="auth-strength-wrap">
              <div className="auth-strength-bar-bg">
                <div
                  className="auth-strength-bar-fill"
                  style={{ width: `${strength.pct}%`, background: strength.color }}
                />
              </div>
              <span className="auth-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isLogin ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <p className="auth-footer-note">
          {isLogin
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => { setMode(isLogin ? 'register' : 'login'); setErrors({}); setGlobalError(''); }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </p>


      </div>
    </div>
  );
};

export default AuthPage;
