import React, { useState } from 'react';
import { Shield, Mail, Phone, Lock, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { ROLE_DEFINITIONS } from '../data/mockData';

export const AuthScreen: React.FC = () => {
  const { loginUser } = useApp();
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [emailAuthMethod, setEmailAuthMethod] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('citizen@civicpulse.gov.in');
  const [password, setPassword] = useState('••••••••');
  const [phone, setPhone] = useState('+91 98765 43210');
  
  // Phone OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  // Email OTP
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState(['', '', '', '', '', '']);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role>('citizen');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Email countdown timer
  React.useEffect(() => {
    let timer: any;
    if (emailCountdown > 0) {
      timer = setInterval(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailCountdown]);

  const handleSendEmailOtp = () => {
    setEmailOtpSent(true);
    setEmailCountdown(60);
    setEmailOtpCode(['', '', '', '', '', '']);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'email' && emailAuthMethod === 'otp') {
      if (!emailOtpSent) {
        handleSendEmailOtp();
        return;
      }
      setEmailVerified(true);
      setTimeout(() => {
        loginUser(email, selectedRole);
      }, 400);
      return;
    }

    loginUser(authMode === 'email' ? email : phone, selectedRole);
  };

  const handleGoogleLogin = () => {
    loginUser('google-user@civicpulse.gov.in', selectedRole);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleEmailOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...emailOtpCode];
    newOtp[index] = val;
    setEmailOtpCode(newOtp);
    if (val && index < 5) {
      const nextInput = document.getElementById(`email-otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-4 py-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-md w-full mx-auto">
        {/* Gov Top Crest */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/30 mb-3 ring-4 ring-blue-100 dark:ring-blue-950">
            <Shield className="w-8 h-8 fill-white/20" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Civic<span className="text-blue-600 dark:text-blue-400">Pulse</span> Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Citizen & Government Unified Login
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md">
          {/* Auth Tab Switcher */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/60 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                authMode === 'email'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email Verification
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('phone')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                authMode === 'phone'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
          </div>

          {/* Quick Role Selection for Demonstration */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Select Login Role / Authority
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(ROLE_DEFINITIONS).map((k) => {
                const r = ROLE_DEFINITIONS[k as Role];
                return (
                  <option key={k} value={k}>
                    {r.title}
                  </option>
                );
              })}
            </select>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {authMode === 'email' ? (
              <>
                {/* Method selector: Email OTP (Recommended) vs Password */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Authentication
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEmailAuthMethod('otp')}
                      className={`font-bold transition ${
                        emailAuthMethod === 'otp'
                          ? 'text-blue-600 dark:text-blue-400 underline underline-offset-2'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Email Code (OTP)
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setEmailAuthMethod('password')}
                      className={`font-bold transition ${
                        emailAuthMethod === 'password'
                          ? 'text-blue-600 dark:text-blue-400 underline underline-offset-2'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Password
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Official / Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailOtpSent(false);
                      }}
                      placeholder="name@civicpulse.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {emailAuthMethod === 'otp' ? (
                  <>
                    {!emailOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send 6-Digit Email Verification Code</span>
                      </button>
                    ) : (
                      <div className="space-y-3 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        {/* Simulation Dispatch Alert */}
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                          <span>
                            📩 Code dispatched to <strong>{email}</strong>
                          </span>
                          <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950">
                            DEMO: 8 3 1 9 4 5
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Enter 6-Digit Verification Code
                          </label>
                          <div className="flex justify-between gap-1.5">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                              <input
                                key={idx}
                                id={`email-otp-input-${idx}`}
                                type="text"
                                maxLength={1}
                                value={emailOtpCode[idx]}
                                onChange={(e) => handleEmailOtpChange(idx, e.target.value)}
                                className="w-10 h-11 text-center font-bold text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Resend Countdown */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span>Didn't receive email code?</span>
                          {emailCountdown > 0 ? (
                            <span className="font-semibold text-slate-400">Resend in {emailCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Resend Verification Code
                            </button>
                          )}
                        </div>

                        {emailVerified && (
                          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>✓ Email Address Verified! Signing in...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={() => setOtpSent(true)}
                    className="w-full py-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 transition"
                  >
                    Send 6-Digit Verification OTP
                  </button>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Enter 6-Digit OTP sent to your phone (Demo Code: 4 2 9 0 1 8)
                    </label>
                    <div className="flex justify-between gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={otpCode[idx]}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-10 h-11 text-center font-bold text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>
                {authMode === 'email' && emailAuthMethod === 'otp'
                  ? emailOtpSent
                    ? `Verify Email & Sign In as ${ROLE_DEFINITIONS[selectedRole].shortTitle}`
                    : `Proceed with Email Verification`
                  : `Sign In as ${ROLE_DEFINITIONS[selectedRole].shortTitle}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-800 px-2">
              Or continue with
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reset Password</h3>
            </div>
            {forgotSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Password reset link sent to your registered email!
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Enter your registered official email to receive a recovery token.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.gov.in"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setForgotSuccess(true)}
                    className="px-4 py-1.5 rounded-xl text-xs bg-blue-600 text-white font-bold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
