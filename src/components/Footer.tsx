import React from 'react';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white py-12 mt-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center space-y-8">
          
          {/* Social Links */}
          <div className="flex items-center space-x-8">
            
            {/* LinkedIn */}
            <a
              href="https://ae.linkedin.com/in/mustafa-al-mitamy-504342205?trk=public_post_feed-actor-name"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3 rounded-full bg-gray-800 hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
              aria-label="Connect on LinkedIn"
            >
              <Linkedin className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                LinkedIn
              </div>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/mustafa-almitamy"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
              aria-label="Visit GitHub Profile"
            >
              <Github className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                GitHub
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:malmitamy@gmail.com"
              className="group relative p-3 rounded-full bg-gray-800 hover:bg-orange-600 transition-all duration-300 transform hover:scale-110"
              aria-label="Send Email"
            >
              <Mail className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                Email
              </div>
            </a>
          </div>

          {/* Divider */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>

          {/* Copyright and Credits */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>by</span>
              <a 
                href="https://ae.linkedin.com/in/mustafa-al-mitamy-504342205"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200"
              >
                Mustafa Al-Mitamy
              </a>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} Reddit TLDR. All rights reserved.</p>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Powered by Google Gemini AI • Built with React & Tailwind CSS</p>
              <p>
                Data sourced from Reddit • 
                <a 
                  href="https://www.reddit.com/wiki/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 ml-1 transition-colors duration-200"
                >
                  Reddit API Terms
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;