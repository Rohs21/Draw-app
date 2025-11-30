"use client";
import React, { useState, useEffect } from 'react';
import { PenTool, ArrowRight, Share2, Users, Layers } from 'lucide-react';

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

export function AuthPage({ isSignin = true }) {
  const [currentSlide, setCurrentSlide] = useState(0);

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

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Shapes */}
      <div className="absolute top-20 left-10 w-6 h-6 border-4 border-slate-300 rotate-45 opacity-40" />
      <div className="absolute top-32 left-20 w-8 h-8 border-4 border-slate-200 rotate-12 opacity-30" />
      <div className="absolute top-1/3 left-8 w-10 h-10 bg-slate-100 rounded-full opacity-50" />
      <div className="absolute bottom-20 left-16 w-12 h-12 border-4 border-slate-200 rounded-lg opacity-35 rotate-45" />
      <div className="absolute top-1/4 right-20 w-8 h-8 border-4 border-slate-300 opacity-40" />
      <div className="absolute bottom-32 right-10 w-10 h-10 bg-slate-100 rounded-full opacity-45" />
      <div className="absolute top-1/2 right-32 w-6 h-6 border-4 border-slate-200 rotate-45 opacity-30" />
      <div className="absolute top-10 right-1/4 w-5 h-5 bg-slate-50 rounded-full opacity-60" />
      <div className="absolute bottom-40 right-1/3 w-7 h-7 border-4 border-slate-200 opacity-35" />

      {/* Top Logo */}
      <div className="absolute top-8 left-0 w-full flex justify-center items-center gap-2 z-20 pointer-events-none">
        <PenTool className="w-6 h-6 text-slate-800" />
        <span className="text-4xl font-black text-slate-800 tracking-tight">SyncSketch</span>
      </div>

      {/* Main Card Container */}
      <div className="mt-8 bg-slate-50 w-full max-w-6xl h-auto md:h-[550px] rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-200 z-10">
        
        {/* LEFT SIDE: Feature Carousel */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12 relative overflow-hidden border-r border-slate-200">
          {/* Carousel Content */}
          <div className="z-10 flex flex-col items-center text-center">
            {/* Icon */}
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

          {/* Carousel Dots */}
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
        <div className="w-full md:w-1/2 bg-slate-50 p-8 md:p-12 flex flex-col justify-center relative">
          
          <div className="max-w-sm mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {isSignin ? "Hi there!" : "Join Us!"}
              </h1>
              <p className="text-slate-600 text-sm">
                {isSignin ? "Welcome back to your digital workspace." : "Create an account to start drawing."}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name Field (Signup only) */}
              {!isSignin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-800 placeholder-slate-400"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-800 placeholder-slate-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  placeholder="Enter your password"
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
                className="w-full group bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-3 px-4 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6" 
              >
                <span>{isSignin ? "Sign in" : "Sign up"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Divider */}
              <div className="relative flex py-3 items-center mt-2">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink-0 mx-3 text-slate-400 text-xs">or</span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>

              {/* Toggle Signin/Signup */}
              <div className="text-center text-sm">
                <p className="text-slate-600">
                  {isSignin ? "Don't have an account? " : "Already have an account? "}
                  <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors cursor-pointer">
                    {isSignin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}