'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Moon, Sun, Github } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is installed and configured
import Logo from '../public/image.png';
import { useRouter } from 'next/navigation'; // For redirect after logout

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or system preference
    const isDarkMode =
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Check for auth token to determine login state
    const token = localStorage.getItem('token'); // Assuming token key is 'authToken'
    setIsLoggedIn(!!token);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Delete the token
    setIsLoggedIn(false);
    toast.success('Logout successful'); // Show toast
    router.push('/'); // Redirect to home after logout
  };

  if (!mounted) return null;

  return (
    <nav className="w-full sticky top-0 z-50
        bg-white/60 dark:bg-gray-950/40
        backdrop-blur-md
      border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo and Name */}
          <Link href="/" className="flex items-center gap-3 font-bold text-2xl">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              <Image src={Logo} alt="Logo" />
            </div>
            <span className="text-gray-900 dark:text-white">SyncSketch</span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#features"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Features
            </Link>
          </div>

          {/* Right Side - GitHub, Theme Toggle, Auth Buttons */}
          <div className="flex items-center gap-4">
            {/* GitHub Button */}
            <Link
              href="https://github.com/Rohs21"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Conditional Auth Buttons */}
            {!isLoggedIn ? (
              <>
                {/* Sign In Button */}
                <Link
                  href="/signin"
                  className="px-6 py-2.5 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium border border-gray-300 dark:border-gray-700"
                >
                  Sign in
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/signup"
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                {/* Dashboard Button (for logged in user) */}
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  Dashboard
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium border border-gray-300 dark:border-gray-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}