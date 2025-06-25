import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap,
  Check,
  Star,
  Users,
  BarChart3,
  ArrowRight,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

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

  React.useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <style>{`
        .logo-outer-ring {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: logo-spin 2.5s linear infinite;
        }
        @keyframes logo-spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Navigation */}
      <header className="fixed top-6 inset-x-0 flex justify-center z-50">
        <div
          className={`transition-all duration-[1500ms] ease-out backdrop-blur-md border rounded-full ${
            isScrolled
              ? "bg-white/40 dark:bg-gray-950/40 px-10 py-3 mx-4 border-gray-200/20 dark:border-gray-700/20 shadow-xl shadow-black/5 dark:shadow-white/5 w-fit"
              : "bg-transparent dark:bg-transparent px-16 py-4 mx-4 border-gray-200/10 dark:border-gray-700/10 shadow-none w-fit"
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-[1500ms] ease-out ${
              isScrolled ? "gap-8" : "gap-12"
            }`}
          >
            {/* Logo */}
            <div className={`font-medium transition-all duration-[1500ms] ease-out ${isScrolled ? "text-lg" : "text-xl"}`}>
              <div className="flex items-center space-x-2">
                <svg className={`text-orange-600 dark:text-orange-600 transition-all duration-[1500ms] ease-out ${isScrolled ? "h-6 w-6" : "h-8 w-8"}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer ring (animated) */}
                  <g className="logo-outer-ring">
                    <circle cx="12" cy="12" r="12" fill="currentColor" />
                  </g>
                  {/* Inner 'b' (static) */}
                  <path d="M17.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" fill="currentColor"/>
                </svg>
                <span className="cursor-default text-gray-900 dark:text-white transition-colors duration-[1500ms]">Reddit TLDR</span>
              </div>
            </div>

            {/* Navigation */}
            <nav
              className={`hidden md:flex transition-all duration-[1500ms] ease-out ${
                isScrolled ? "gap-6 text-base" : "gap-8 text-base"
              }`}
            >
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 dark:bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative group">
                How it Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 dark:bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 dark:bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 dark:bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </nav>

            {/* User Menu & Dark Mode Toggle */}
            <div className={`transition-all duration-[1500ms] ease-out ${isScrolled ? "scale-90" : "scale-100"}`}>
              <div className="flex items-center space-x-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-all duration-300 group ${isScrolled ? 'p-1.5' : 'p-2'}`}
                  aria-label="Toggle dark mode"
                >
                  <div className="relative">
                    <Sun className={`${isScrolled ? 'h-5 w-5' : 'h-4 w-4'} text-orange-500 transition-all duration-500 ease-out ${
                      isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                    }`} />
                    <Moon className={`absolute inset-0 ${isScrolled ? 'h-5 w-5' : 'h-4 w-4'} text-orange-400 transition-all duration-500 ease-out ${
                      isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                    }`} />
                  </div>
                </button>

                {/* Auth Buttons */}
                <Link 
                  to="/login" 
                  className={`text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-base`}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className={`bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 ${isScrolled ? 'px-5 py-2.5 text-base' : 'px-6 py-2 text-base'}`}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Indicator */}
        {isScrolled && (
          <div className="md:hidden absolute -bottom-2 left-1/2 transform -translate-x-1/2 transition-opacity duration-[1500ms]">
            <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 px-4 sm:px-6">
        {/* Decorative image at top right next to navigation */}
        <img
          src={isDark ? '/black_circle_360x360.png' : '/white_circle_360x360.png'}
          alt="Decorative Circle"
          className="pointer-events-none select-none absolute top-2 right-2 sm:top-6 sm:right-10 w-[100px] h-[100px] sm:w-[160px] sm:h-[160px] opacity-70 dark:opacity-30 z-20 brightness-125"
          aria-hidden="true"
        />
        <div className="container mx-auto px-6">
          {/* Content */}
          <div className="relative z-10 max-w-2xl lg:ml-[15%] mx-auto lg:mx-0 text-center lg:text-left">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                AI-Powered Insights from 
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"> Reddit Discussions</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Stop scrolling, smash the Reddit button 🔥 <br />and start analyzing
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>Start Analyzing</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link 
                  to="/demo" 
                  className="bg-white hover:bg-gray-50 text-orange-600 font-semibold px-8 py-4 rounded-lg transition-all duration-200"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>          {/* 3D Model */}
          <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-[10%] w-[500px] h-[500px] lg:w-[600px] lg:h-[600px] overflow-hidden">
            <div className="relative w-full h-full" style={{ transform: 'scale(1.1)' }}>              <iframe 
                src='https://my.spline.design/keyboard-jJ6PwzuJmsnLNAU8oA5nChzs/?embedMode=1&hideControls=true&hideUI=true&preload=1&hideSplinePromo=true&hideVersionInfo=true&hideBlur=true&disablePopup=true' 
                frameBorder='0' 
                width='100%'
                height='100%'
                title="3D Keyboard Model"
                style={{ 
                  pointerEvents: 'auto',
                  transform: 'scale(1.2)',
                  transformOrigin: 'center center',
                  position: 'relative',
                  zIndex: 1
                }}
                className="w-full h-full"
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50px',
                  background: 'linear-gradient(to top, rgba(255,255,255,0.8), transparent)',
                  zIndex: 2
                }}
              />
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hidden md:block absolute top-20 left-10 opacity-20 dark:opacity-10">
          <MessageSquare className="h-16 w-16 text-orange-500 animate-pulse" />
        </div>
        <div className="hidden md:block absolute bottom-20 right-10 opacity-20 dark:opacity-10">
          <Brain className="h-20 w-20 text-amber-500 animate-pulse" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Smarter Analysis
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to understand public opinion and sentiment from Reddit discussions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced sentiment analysis using Google's Gemini AI to understand nuanced opinions and emotions in discussions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Real-time Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant sentiment classification and key talking points from any Reddit topic or discussion thread.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comprehensive Reports</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed sentiment distribution, aggregated insights, and performance metrics for thorough analysis.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Time-Saving</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Analyze hundreds of comments in minutes instead of hours of manual reading and categorization.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your API keys and analysis data are kept secure with enterprise-grade encryption and privacy protection.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Optimized processing pipeline delivers results quickly, even for large-scale Reddit discussions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple, powerful, and effective in just three steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search & Configure</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter your search term, provide your Gemini API key, and select your preferred AI model for analysis.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our system fetches relevant Reddit posts and comments, then uses advanced AI to analyze sentiment and extract insights.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get Results</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive comprehensive sentiment analysis, key insights, and detailed breakdowns of public opinion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include full access to our AI-powered analysis tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
                <p className="text-gray-600 dark:text-gray-300">Perfect for trying out the platform</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">5 analyses per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Up to 10 posts per analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Basic sentiment analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Email support</span>
                </li>
              </ul>
              
              <Link 
                to="/signup" 
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block"
              >
                Get Started Free
              </Link>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-8 shadow-xl transform md:scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-bold text-white mb-2">$19</div>
                <p className="text-orange-100">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">100 analyses per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Up to 50 posts per analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Advanced AI models</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Export reports</span>
                </li>
              </ul>
              
              <Link 
                to="/signup" 
                className="w-full bg-white hover:bg-gray-100 text-orange-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block"
              >
                Start Pro Trial
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$99</div>
                <p className="text-gray-600 dark:text-gray-300">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Unlimited analyses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Up to 100 posts per analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">All AI models</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">24/7 support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">API access</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Custom integrations</span>
                </li>
              </ul>
              
              <Link 
                to="/contact" 
                className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about Reddit TLDR
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How accurate is the sentiment analysis?",
                answer: "Our AI-powered sentiment analysis uses Google's advanced Gemini models, achieving high accuracy rates. The system considers context, nuance, and Reddit-specific language patterns to provide reliable sentiment classification."
              },
              {
                question: "Do I need my own API key?",
                answer: "Yes, you'll need a Google Gemini API key to use our service. This ensures you have full control over your usage and costs. You can get a free API key from Google AI Studio."
              },
              {
                question: "What Reddit content can I analyze?",
                answer: "You can analyze any public Reddit posts and comments by searching for keywords, topics, or specific subreddits. Our system fetches the most relevant discussions and provides comprehensive analysis."
              },
              {
                question: "How long does analysis take?",
                answer: "Analysis time depends on the number of posts you're analyzing. Typically, it takes 2-5 minutes for 10 posts, including data retrieval and AI processing time."
              },
              {
                question: "Can I export my analysis results?",
                answer: "Yes, Pro and Enterprise plans include the ability to export your analysis results in various formats including PDF reports and CSV data for further analysis."
              },
              {
                question: "Is my data secure?",
                answer: "Absolutely. We use enterprise-grade encryption and security measures. Your API keys and analysis data are never stored permanently and are processed securely."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already using Reddit TLDR to understand public opinion and sentiment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/signup" 
              className="bg-white hover:bg-gray-100 text-orange-600 font-semibold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/demo" 
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-8 py-4 rounded-lg transition-all duration-200"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 sm:py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <svg className="h-8 w-8 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                <span className="text-xl font-bold">Reddit TLDR</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered insights from Reddit discussions. Understand public opinion in minutes, not hours.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400">&copy; 2024 Reddit TLDR. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;