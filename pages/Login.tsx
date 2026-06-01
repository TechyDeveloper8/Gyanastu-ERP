import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { LogIn, BookOpen, AlertCircle, Shield, Briefcase, GraduationCap, Users } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (requirePasswordChange) {
        if (newPassword !== confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const user = await authService.changePassword(userId, password, newPassword);
        login(user);
        navigate('/dashboard');
        return;
      }

      const result = await authService.login(email, password);
      if (result.requirePasswordChange) {
        setRequirePasswordChange(true);
        setUserId(result.userId);
        return;
      }
      login(result);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 animate-fade-in relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary transform -skew-y-6 origin-top-left z-0"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full z-0"></div>

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row">
        
        {/* Left Side - Brand & Info */}
        <div className="bg-primary p-10 md:w-1/2 text-white flex flex-col justify-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-block p-3 bg-white/10 rounded-xl mb-6 backdrop-blur-sm border border-white/20">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-heading font-bold mb-4">Gyanastu ERP</h2>
            <p className="text-blue-100 leading-relaxed mb-8">
              Welcome to the centralized Education Resource Planning system. Secure access for administration, franchises, faculty, and students.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-blue-200">
                <div className="p-2 bg-white/10 rounded-lg"><Shield className="w-4 h-4" /></div>
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-200">
                <div className="p-2 bg-white/10 rounded-lg"><Shield className="w-4 h-4" /></div>
                <span>Secure Authentication</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-10 md:w-1/2 flex flex-col justify-center bg-white">
          <div className="mb-8">
             <h3 className="text-2xl font-bold text-gray-800">{requirePasswordChange ? 'Change Password' : 'Sign In'}</h3>
             <p className="text-gray-500 text-sm">
               {requirePasswordChange ? 'Please set a new password to continue.' : 'Enter your credentials to access your dashboard.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            
            {!requirePasswordChange ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email or Username</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gyanastu.com or GYA2024..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs font-bold text-accent hover:underline">Forgot Password?</Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Must match password"
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? (requirePasswordChange ? 'Updating...' : 'Authenticating...') : <><LogIn className="w-4 h-4" /> {requirePasswordChange ? 'Update Password' : 'Access Dashboard'}</>}
            </button>
          </form>

          {/* Quick Login for Demo */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-[10px] text-center text-gray-400 mb-4 uppercase font-bold tracking-wider">Select Role to Login (Demo Mode)</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => fillCredentials('admin@gyanastu.com')} 
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
              >
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md group-hover:scale-110 transition-transform"><Shield className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Super Admin</div>
                  <div className="text-[10px] text-gray-400">HQ Control</div>
                </div>
              </button>

              <button 
                onClick={() => fillCredentials('franchise@gyanastu.com')} 
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md group-hover:scale-110 transition-transform"><Briefcase className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Franchise</div>
                  <div className="text-[10px] text-gray-400">Branch Manager</div>
                </div>
              </button>

              <button 
                onClick={() => fillCredentials('faculty@gyanastu.com')} 
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
              >
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md group-hover:scale-110 transition-transform"><Users className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Faculty</div>
                  <div className="text-[10px] text-gray-400">Teacher</div>
                </div>
              </button>

              <button 
                onClick={() => fillCredentials('student@gyanastu.com')} 
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
              >
                <div className="p-2 bg-green-100 text-green-600 rounded-md group-hover:scale-110 transition-transform"><GraduationCap className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Student</div>
                  <div className="text-[10px] text-gray-400">Learner</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;