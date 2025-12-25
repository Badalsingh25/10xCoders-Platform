import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'

  // Login/Signup States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP States
  const [step, setStep] = useState('details'); // 'details', 'otp' (for signup) | 'email', 'otp', 'reset' (for forgot)
  const [otp, setOtp] = useState(''); // The generated OTP
  const [otpInput, setOtpInput] = useState(''); // User entered OTP

  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const updatePasswordStrength = (value) => {
    if (!value) {
      setPasswordStrength('');
      return;
    }
    if (value.length < 6) {
      setPasswordStrength('Weak');
    } else if (value.length < 10) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Strong');
    }
  };

  const generateOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(newOtp);
    console.log(`%c[DEV] Generated OTP: ${newOtp}`, 'color: green; font-weight: bold; font-size: 14px;');
    alert(`(Dev Mode) Your OTP is: ${newOtp}`); // Easy for user testing
    return newOtp;
  };

  const handleSignupDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }

    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      // Send OTP via Backend
      await axios.post(`${backendUrl}/api/users/send-otp`, { email, type: 'signup' });

      setStep('otp');
      setSuccess('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupFinal = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Ensure loading state is true
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      // Step 1: Verify OTP
      await axios.post(`${backendUrl}/api/users/verify-otp`, { email, otp: otpInput });

      // Step 2: Register User (OTP is verified and checked by backend or flow)
      // Note: Backend registerUser might not check OTP if verifying first deletes it.
      await axios.post(`${backendUrl}/api/users/register`, { name, email, password });

      setSuccess('Account created successfully! Please login.');
      setTimeout(() => {
        setView('login');
        setStep('details');
        setOtpInput('');
        setPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification or Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      const res = await axios.post(`${backendUrl}/api/users/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async (e) => { // Send OTP
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      await axios.post(`${backendUrl}/api/users/send-otp`, { email, type: 'forgot' });
      setStep('otp');
      setSuccess('OTP sent to your email.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e) => { // Verify OTP
    e.preventDefault();
    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      await axios.post(`${backendUrl}/api/users/verify-otp`, { email, otp: otpInput });
      // If successful, move to next step. We keep OTP in state/input to send with reset call if needed
      // Actually backend reset-password commonly checks OTP again, or we can use a temp token.
      // For simplicity here, we'll verify it and then pass it again to reset.
      setStep('reset');
      setSuccess('OTP Verified. Set new password.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep3 = async (e) => { // Reset Password
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 chars.');
      return;
    }

    setLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

    try {
      await axios.post(`${backendUrl}/api/users/reset-password`, { email, otp: otpInput, newPassword: password });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setView('login');
        setStep('details');
        setPassword('');
        setOtpInput('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header Tabs */}
          {view !== 'forgot' && (
            <div className="flex">
              <button
                className={`w-1/2 py-4 text-center font-medium text-lg transition-colors duration-300 ${view === 'login' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                onClick={() => { setView('login'); setStep('details'); setError(''); setSuccess(''); }}
              >
                Login
              </button>
              <button
                className={`w-1/2 py-4 text-center font-medium text-lg transition-colors duration-300 ${view === 'signup' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                onClick={() => { setView('signup'); setStep('details'); setError(''); setSuccess(''); }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Form Content */}
          <div className="p-8">
            {view === 'forgot' && (
              <button onClick={() => { setView('login'); setStep('details'); setError(''); }} className="flex items-center text-sm text-gray-500 hover:text-purple-600 mb-4">
                <ArrowLeft size={16} className="mr-1" /> Back to Login
              </button>
            )}

            <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">
              {view === 'login' && 'Welcome Back'}
              {view === 'signup' && (step === 'details' ? 'Create Account' : 'Verify Email')}
              {view === 'forgot' && 'Reset Password'}
            </h2>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* LOGIN FORM */}
            {view === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="your@email.com" />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400"><Eye size={18} /></button>
                  </div>
                </div>
                <div className="flex justify-end mb-6">
                  <button type="button" onClick={() => { setView('forgot'); setStep('email'); setError(''); }} className="text-sm text-purple-600 hover:text-purple-800 font-medium">Forgot password?</button>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md transition-all">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {view === 'signup' && step === 'details' && (
              <form onSubmit={handleSignupDetailsSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="your@email.com" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); updatePasswordStrength(e.target.value); }} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400"><Eye size={18} /></button>
                  </div>
                  {passwordStrength && <p className="text-xs text-gray-500 mt-1">Strength: {passwordStrength}</p>}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400"><Eye size={18} /></button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md transition-all">
                  {loading ? 'Sending OTP...' : 'Generate OTP'}
                </button>
              </form>
            )}

            {/* SIGNUP OTP FORM */}
            {view === 'signup' && step === 'otp' && (
              <form onSubmit={handleSignupFinal}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP sent to {email}</label>
                  <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-center tracking-widest text-xl" placeholder="••••••" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep('details')} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg">Back</button>
                  <button type="submit" disabled={loading} className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md transition-all">
                    {loading ? 'Creating Account...' : 'Verify & Sign Up'}
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORMS */}
            {view === 'forgot' && step === 'email' && (
              <form onSubmit={handleForgotStep1}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter your email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}
            {view === 'forgot' && step === 'otp' && (
              <form onSubmit={handleForgotStep2}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-center tracking-widest" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}
            {view === 'forgot' && step === 'reset' && (
              <form onSubmit={handleForgotStep3}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400"><Eye size={18} /></button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg shadow-md">{loading ? 'Resetting...' : 'Reset Password'}</button>
              </form>
            )}

            {/* Social Login Options (Only on initial Login/Signup view) */}
            {(view === 'login' || (view === 'signup' && step === 'details')) && (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 bg-gradient-to-r hover:from-red-50 hover:to-white transition-all" onClick={() => window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/google`}>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    <span className="text-gray-700 font-medium">Google</span>
                  </button>
                  <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all" onClick={() => window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/github`}>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    <span className="text-gray-700 font-medium">GitHub</span>
                  </button>
                  <button type="button" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all" onClick={() => window.location.href = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/linkedin`}>
                    <svg className="w-5 h-5 mr-2 text-blue-700" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    <span className="text-gray-700 font-medium">LinkedIn</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}