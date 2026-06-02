import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogIn, LogOut, ChevronDown, Award, Globe, BookOpen } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileDropdownOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'About', path: '/about' },
    { name: 'Franchise', path: '/franchise' },
    { name: 'Contact', path: '/contact' },
    { name: 'Verify Certificate', path: '/verify' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-secondary">
      {/* Main Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg shadow-sm transition-colors duration-300 flex items-center justify-center" style={{ backgroundColor: '#001f61' }}>
                <img src="/logo2.webp" alt="Gyanastu Logo" className="w-9 h-9 md:w-12 md:h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary tracking-tight">Gyanastu</h1>
                <p className="text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase hidden sm:block">Institute of Accounts Technician</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`font-medium text-sm uppercase tracking-wide transition-colors duration-200 ${location.pathname === link.path ? 'text-accent font-bold' : 'text-gray-700 hover:text-primary'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons / Profile */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 text-primary font-medium focus:outline-none"
                  >
                    <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                    <span>{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 animate-fade-in">
                      <Link
                        to={getDashboardPath()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-accent transition-colors duration-300 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ERP Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-primary focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {
          isMobileMenuOpen && (
            <div className="lg:hidden bg-white border-t border-gray-100 animate-slide-up">
              <nav className="flex flex-col px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`font-medium py-2 border-b border-gray-50 ${location.pathname === link.path ? 'text-accent' : 'text-gray-700'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardPath()}
                      className="font-medium py-2 text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="font-medium py-2 text-left text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="font-medium py-2 text-primary flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" /> ERP Login
                  </Link>
                )}
              </nav>
            </div>
          )
        }
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg shadow-sm flex items-center justify-center" style={{ backgroundColor: '#001f61' }}>
                  <img src="/logo2.webp" alt="Gyanastu Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-2xl font-heading font-bold text-white">Gyanastu</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-400">
                Empowering the future through technology education. We provide industry-standard courses and certification to help you succeed.
              </p>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                <div className="w-8 h-8 bg-gray-700 rounded-full hover:bg-accent transition-colors cursor-pointer flex items-center justify-center">fb <link rel="stylesheet" href="https://www.facebook.com/yourgyanastu/" /></div>
                <div className="w-8 h-8 bg-gray-700 rounded-full hover:bg-accent transition-colors cursor-pointer flex items-center justify-center">in <link rel="stylesheet" href="https://www.instagram.com/gyanastu_official/" /></div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-heading font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/courses" className="hover:text-accent transition-colors">All Courses</Link></li>
                <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
                <li><Link to="/franchise" className="hover:text-accent transition-colors">Franchise</Link></li>
                <li><Link to="/verify" className="hover:text-accent transition-colors">Verify Certificate</Link></li>
              </ul>
            </div>

            {/* Courses */}
            <div>
              <h3 className="text-white font-heading font-bold text-lg mb-4">Popular Courses</h3>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-accent transition-colors cursor-pointer">Web Development</li>
                <li className="hover:text-accent transition-colors cursor-pointer">Data Science</li>
                <li className="hover:text-accent transition-colors cursor-pointer">Digital Marketing</li>
                <li className="hover:text-accent transition-colors cursor-pointer">Graphic Design</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-heading font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span>📍</span>
                  <span>R.N Agrawal Road, Chuniharitola, Bhagalpur, Bihar, 812002</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>📞</span>
                  <span>+91 8292022633</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>✉️</span>
                  <span>[EMAIL_ADDRESS]</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} Gyanastu Institute. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      {/* WhatsApp Floating Button */}
      <a
        href="https://api.whatsapp.com/send/?phone=918292022633&text=Hello%2C+I+would+like+to+enquire+about+Class+11+%26+12+Commerce+coaching+at+Shiksha+School%2C+Bhagalpur.&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:bg-[#128C7E] transition-all duration-300 hover:scale-110 flex items-center justify-center animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
};

export default Layout;