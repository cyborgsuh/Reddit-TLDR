import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Brain, 
  Settings, 
  LogOut,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100); // Increased threshold for smoother trigger
    };

    // Add throttling to reduce jitter
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app', icon: MessageSquare, label: 'TLDR' },
    { path: '/mentions', icon: MessageSquare, label: 'Mentions' },
    { path: '/insights', icon: Brain, label: 'AI Insights' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <header className="fixed top-3 sm:top-6 inset-x-0 flex justify-center z-50 px-4">
      <div
        className={`transition-all duration-[1500ms] ease-out backdrop-blur-md border rounded-full ${
          isScrolled
            ? "bg-white/40 dark:bg-gray-950/40 px-4 sm:px-10 py-2 sm:py-3 border-gray-200/20 dark:border-gray-700/20 shadow-xl shadow-black/5 dark:shadow-white/5 w-full max-w-4xl"
            : "bg-transparent dark:bg-transparent px-6 sm:px-16 py-3 sm:py-4 border-gray-200/10 dark:border-gray-700/10 shadow-none w-full max-w-5xl"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-[1500ms] ease-out ${
            isScrolled ? "gap-2 sm:gap-8" : "gap-4 sm:gap-12"
          }`}
        >
          {/* Logo */}
          <div className={`font-medium transition-all duration-[1500ms] ease-out ${isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
            <div className="flex items-center space-x-2">
              <svg className={`text-orange-600 dark:text-orange-600 transition-all duration-[1500ms] ease-out ${isScrolled ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-8 sm:w-8"}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              <span className="cursor-default text-gray-900 dark:text-white transition-colors duration-[1500ms] hidden sm:inline">Reddit TLDR</span>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`hidden md:flex transition-all duration-[1500ms] ease-out ${
              isScrolled ? "gap-4 lg:gap-6 text-sm lg:text-base" : "gap-6 lg:gap-8 text-sm lg:text-base"
            }`}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 relative group ${
                    isActive
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 dark:bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-600 dark:bg-orange-400"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu & Dark Mode Toggle */}
          <div className={`transition-all duration-[1500ms] ease-out ${isScrolled ? "scale-90" : "scale-100"} flex-shrink-0`}>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`rounded-full bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-all duration-300 group ${isScrolled ? 'p-1.5' : 'p-1.5 sm:p-2'}`}
                aria-label="Toggle dark mode"
              >
                <div className="relative">
                  <Sun className={`${isScrolled ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4'} text-orange-500 transition-all duration-500 ease-out ${
                    isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                  }`} />
                  <Moon className={`absolute inset-0 ${isScrolled ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4'} text-orange-400 transition-all duration-500 ease-out ${
                    isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                  }`} />
                </div>
              </button>

              {/* User Profile Icon */}
              <div className={`flex items-center justify-center bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full transition-all duration-[1500ms] ease-out ${isScrolled ? 'p-1.5 sm:p-2' : 'p-1.5 sm:p-2'}`}>
                <User className={`text-gray-600 dark:text-gray-300 transition-all duration-[1500ms] ease-out ${isScrolled ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4'}`} />
              </div>
            
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className={`flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all duration-[1500ms] ease-out transform hover:scale-105 px-1.5 sm:px-2 py-1.5 sm:py-2`}
              >
                <LogOut className={`transition-all duration-[1500ms] ease-out ${isScrolled ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Indicator */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isActive
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;