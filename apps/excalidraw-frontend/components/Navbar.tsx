'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Github, Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Logo from '../public/image.png';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    toast.success('Logout successful');
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <nav className="w-full sticky top-0 z-50 
      bg-white/70 backdrop-blur-md 
      border-b-4 border-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg border-2 border-black bg-[#ffe599] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all">
              <Image src={Logo} alt="Logo" width={24} height={24} />
            </div>
            <span className="text-black font-black text-2xl tracking-tighter">SyncSketch</span>
          </Link>

          {/* Navigation Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-black font-bold hover:underline decoration-2 underline-offset-4 transition-all">
              How it works
            </Link>
            <Link href="#features" className="text-black font-bold hover:underline decoration-2 underline-offset-4 transition-all">
              Features
            </Link>
            <Link 
              href="https://github.com/Rohs21" 
              target="_blank" 
              className="flex items-center gap-2 text-black font-bold hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all"
            >
              <Github className="w-5 h-5" />
              GitHub
            </Link>
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/signin"
                  className="hidden sm:block px-5 py-2 rounded-xl text-black font-bold hover:bg-black/5 transition-all"
                >
                  Sign in
                </Link>

                <Link
                  href="/signup"
                  className="px-6 py-2.5 rounded-xl bg-[#ffe599] border-2 border-black text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-[#ffe599] border-2 border-black text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="hidden sm:block px-5 py-2 rounded-xl text-red-600 font-bold border-2 border-transparent hover:border-red-600 transition-all"
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