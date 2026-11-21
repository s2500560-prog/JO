import React, { useState } from 'react';
import { FormError } from '../components/FormError';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

const UserSilhouetteIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="w-4 h-4 text-white"
  >
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z" />
  </svg>
);

const PadlockIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="w-4 h-4 text-white"
  >
    <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7zm3 8.73V18h-2v-2.27a1.75 1.75 0 1 1 2 0z" />
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const switchMode = (nextMode: 'login' | 'register' | 'forgot') => {
    setErrorMessage(null);
    if (nextMode !== 'login') {
      setStatusNotice(null);
    }
    setConfirmPassword('');
    setPassword('');
    setMode(nextMode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);

    if (mode === 'forgot') {
      if (password && confirmPassword && password !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
      const targetUser = username.trim() || 'manager';
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      setStatusNotice(`Password reset saved for ${targetUser}. Sign in below.`);
      return;
    }

    if (mode === 'register') {
      const trimmedUser = username.trim() || 'manager';
      if (password && confirmPassword && password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      onLogin(trimmedUser);
      return;
    }

    const resolvedUser = username.trim() || 'manager';
    onLogin(resolvedUser);
  };

  const headingText =
    mode === 'login'
      ? 'MEMBER LOGIN'
      : mode === 'register'
        ? 'REGISTER'
        : 'RESET PASSWORD';

  const submitLabel =
    mode === 'login'
      ? 'LOGIN'
      : mode === 'register'
        ? 'CREATE ACCOUNT'
        : 'UPDATE PASSWORD';

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Full-Screen Blurred Mesh Gradient (#4E747B teal, #7B9076 sage green, #C6BC7E warm yellow) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#5D7C77]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: [
              'radial-gradient(circle at 15% 25%, #4E747B 0%, transparent 58%)',
              'radial-gradient(circle at 22% 84%, #4E747B 0%, transparent 54%)',
              'radial-gradient(circle at 52% 42%, #7B9076 0%, transparent 62%)',
              'radial-gradient(circle at 86% 24%, #C6BC7E 0%, transparent 50%)',
              'radial-gradient(circle at 82% 76%, #C6BC7E 0%, transparent 58%)',
            ].join(', '),
          }}
        />
        <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full bg-[#4E747B]/85 blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#7B9076]/75 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-[34rem] h-[34rem] rounded-full bg-[#C6BC7E]/85 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      {/* Centered Logo + Card + Attached Register Tab */}
      <div className="relative z-10 w-full max-w-[380px] mx-auto flex flex-col items-center drop-shadow-[0_18px_35px_rgba(0,0,0,0.16)]">
        <div className="mb-5 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white overflow-hidden shadow-lg flex items-center justify-center shrink-0">
          <img
            src="./assets/aistudio/image_ad50d4bb.png"
            alt="Saw2Sale logo"
            className="w-full h-full object-cover scale-[1.24]"
          />
        </div>

        {/* Main Login Card */}
        <div className="login-card-surface w-full bg-white/80 backdrop-blur-md rounded-xl p-8 sm:p-9">
          <h1 className="text-base sm:text-lg uppercase tracking-widest text-gray-700 font-medium text-center mb-6">
            {headingText}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Username Split Icon Box */}
            <div className="flex w-full h-11 rounded-[2px] overflow-hidden">
              <div className="w-11 h-11 bg-[#757882] flex items-center justify-center shrink-0">
                <UserSilhouetteIcon />
              </div>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                aria-label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="login-split-input flex-1 min-w-0 h-11 bg-[#4A4D57] px-3.5 text-sm text-white placeholder:text-gray-300 border-0 focus:outline-none"
              />
            </div>

            {/* Password Split Icon Box */}
            <div className="flex w-full h-11 rounded-[2px] overflow-hidden">
              <div className="w-11 h-11 bg-[#757882] flex items-center justify-center shrink-0">
                <PadlockIcon />
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-label={mode === 'forgot' ? 'New Password' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'forgot' ? 'New Password' : 'Password'}
                className="login-split-input flex-1 min-w-0 h-11 bg-[#4A4D57] px-3.5 text-sm text-white placeholder:text-gray-300 border-0 focus:outline-none"
              />
            </div>

            {(mode === 'register' || mode === 'forgot') && (
              <div className="flex w-full h-11 rounded-[2px] overflow-hidden">
                <div className="w-11 h-11 bg-[#757882] flex items-center justify-center shrink-0">
                  <PadlockIcon />
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="login-split-input flex-1 min-w-0 h-11 bg-[#4A4D57] px-3.5 text-sm text-white placeholder:text-gray-300 border-0 focus:outline-none"
                />
              </div>
            )}

            <FormError message={errorMessage} className="justify-center" />

            {statusNotice && (
              <p
                role="status"
                className="p-2.5 rounded-lg bg-[#1F6B43]/10 border border-[#1F6B43]/25 text-xs font-medium text-[#1F6B43] text-center"
              >
                {statusNotice}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-11 rounded-[2px] bg-[#B8B6B4] hover:bg-[#A6A4A2] active:bg-[#999794] text-gray-800 text-xs sm:text-sm font-medium uppercase tracking-widest transition-colors cursor-pointer"
              >
                {submitLabel}
              </button>
            </div>

            {mode === 'login' && (
              <p className="text-xs sm:text-sm text-gray-500 mt-4 text-center">
                Forgot Password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="underline hover:text-gray-700 cursor-pointer"
                >
                  Click Here
                </button>
              </p>
            )}
          </form>
        </div>

        {/* Attached Bottom REGISTER Tab (flush, width matched exactly to inner LOGIN button) */}
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="w-[calc(100%-4rem)] sm:w-[calc(100%-4.5rem)] bg-white/45 backdrop-blur-sm hover:bg-white/60 rounded-b-xl py-3 text-center text-xs font-medium uppercase tracking-widest text-gray-700 transition-colors cursor-pointer"
        >
          {mode === 'login' ? 'REGISTER' : 'BACK TO LOGIN'}
        </button>
      </div>
    </div>
  );
};

