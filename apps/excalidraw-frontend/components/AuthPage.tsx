"use client";
import React, { useState, useEffect } from 'react';
import { PenTool, ArrowRight, Share2, Users, Layers } from 'lucide-react';
import Logo from '../public/image.png';
import Image from 'next/image';
import { api } from '../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SLIDES = [
  {
    id: 1,
    title: "Integrative Sharing Options",
    description: "Collaborate in real-time with your team using our advanced sharing protocols.",
    icon: Share2,
  },
  {
    id: 2,
    title: "Infinite Canvas",
    description: "Never run out of space. Our canvas grows with your ideas automatically.",
    icon: Layers,
  },
  {
    id: 3,
    title: "Real-time Collaboration",
    description: "See changes as they happen. Work together seamlessly from anywhere.",
    icon: Users,
  },
  {
    id: 4,
    title: "Hand-drawn Feel",
    description: "Bring the human touch back to your digital diagrams.",
    icon: PenTool,
  },
];

export function AuthPage({ isSignin = true }: { isSignin?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSignup(name: string, email: string, password: string) {
    await api.post("/signup", {
      name,
      username: email,
      password
    });
    toast.success("Signup successful!");
    // Delay for cookie sync + push + refresh to revalidate server data
    setTimeout(() => {
      router.push("/signin");
      router.refresh(); // Forces server re-fetch with new cookie
    }, 100);
  }

  async function handleSignin(email: string, password: string) {
    const res = await api.post("/signin", {
      username: email,
      password
    });
    if(res.data.token){
      localStorage.setItem('token', res.data.token); // Store the token
      console.log("Token stored:", res.data.token);
    }
    toast.success("Signin successful!");
    // Delay for cookie sync + push + refresh to revalidate server data
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh(); // Forces server re-fetch with new cookie
    }, 100);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const CurrentIcon = SLIDES[currentSlide].icon;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const onSubmitSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await handleSignup(name, email, password);
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await handleSignin(email, password);
      resetForm();
    } catch (err: any) {
      // Generic error for security (don't distinguish email vs password)
      setError("Email or password is wrong.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Shapes (unchanged) */}
      <div className="absolute top-20 left-10 w-6 h-6 border-4 border-slate-300 rotate-45 opacity-40" />
      <div className="absolute top-32 left-20 w-8 h-8 border-4 border-slate-200 rotate-12 opacity-30" />
      <div className="absolute top-1/3 left-8 w-10 h-10 bg-slate-100 rounded-full opacity-50" />
      <div className="absolute bottom-20 left-16 w-12 h-12 border-4 border-slate-200 rounded-lg opacity-35 rotate-45" />
      <div className="absolute top-1/4 right-20 w-8 h-8 border-4 border-slate-300 opacity-40" />
      <div className="absolute bottom-32 right-10 w-10 h-10 bg-slate-100 rounded-full opacity-45" />
      <div className="absolute top-1/2 right-32 w-6 h-6 border-4 border-slate-200 rotate-45 opacity-30" />
      <div className="absolute top-10 right-1/4 w-5 h-5 bg-slate-50 rounded-full opacity-60" />
      <div className="absolute bottom-40 right-1/3 w-7 h-7 border-4 border-slate-200 opacity-35" />

      {/* Top Logo (unchanged) */}
      <div className="absolute top-8 left-0 w-full flex justify-center items-center gap-2 z-20 pointer-events-none">
        <Image src={Logo} alt="Logo" className='h-10 w-10' />
        <span className="text-4xl font-black text-slate-800 tracking-tight">SyncSketch</span>
      </div>

      {/* Main Card Container */}
      <div className="mt-8 bg-slate-50 w-full max-w-6xl h-auto md:h-[550px] rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-200 z-10">
        
        {/* LEFT SIDE: Feature Carousel (unchanged) */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12 relative overflow-hidden border-r border-slate-200">
          <div className="z-10 flex flex-col items-center text-center">
            <div className="mb-8">
              <CurrentIcon className="w-24 h-24 text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 min-h-[40px]">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-slate-600 max-w-sm leading-relaxed text-sm">
              {SLIDES[currentSlide].description}
            </p>
          </div>
          <div className="flex gap-2 mt-12 z-10">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? "w-8 bg-yellow-400" 
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Authentication Form */}
        <form className="w-full md:w-1/2" onSubmit={isSignin ? onSubmitSignin : onSubmitSignup}>
          <div className="w-full bg-slate-50 p-8 md:p-12 flex flex-col justify-center relative">
            <div className="max-w-sm mx-auto w-full">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {isSignin ? "Hi there!" : "Join Us!"}
                </h1>
                <p className="text-slate-600 text-sm">
                  {isSignin ? "Welcome back to your digital workspace." : "Create an account to start drawing."}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-1 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name Field (Signup only) */}
                {!isSignin && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input 
                      id="name"
                      onChange={(e) => setName(e.target.value)}
                      type="text" 
                      placeholder="Enter your full name"
                      value={name}
                      required={!isSignin}
                      className="w-full px-6 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-800 placeholder-slate-400"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input 
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-800 placeholder-slate-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input 
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Forgot Password Link */}
                {isSignin && (
                  <div className="flex justify-end pt-1">
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl py-2 px-4 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6" 
                >
                  <span>{isSubmitting ? "Processing..." : (isSignin ? "Sign in" : "Sign up")}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink-0 mx-3 text-slate-400 text-xs">or</span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                {/* Toggle Signin/Signup */}
                <div className="text-center text-sm -mt-10">
                  <p className="text-slate-600">
                    {isSignin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors cursor-pointer">
                      <Link href={isSignin ? "/signup" : "/signin"}>
                        {isSignin ? "Sign up" : "Sign in"}
                      </Link>
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}