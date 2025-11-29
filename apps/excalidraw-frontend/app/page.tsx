import React, { FC, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Pencil, Share2, Users2, Sparkles, Github, Download, Zap, LineChart } from 'lucide-react';
import BannerSVG from '../public/banner.svg';
// --- Type Definitions ---

interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'cta';
  size?: 'sm' | 'lg';
  className?: string;
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// --- Mock Components for Single-File React Environment ---

// Simple Link Component
const Link: FC<LinkProps> = ({ href = '#', children, className = '', ...props }) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
);

// Simple Button Component
const Button: FC<ButtonProps> = ({ children, variant = 'primary', size = 'lg', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950';
  
  let sizeClasses: string = 'h-12 px-6 text-base';
  if (size === 'sm') sizeClasses = 'h-8 px-3 text-sm';
  
  let variantClasses: string = '';
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-gray-700 text-gray-50 hover:bg-gray-600 border border-gray-700 shadow-lg hover:shadow-indigo-500/10';
      break;
    case 'outline':
      variantClasses = 'border border-gray-700 text-gray-50 hover:bg-gray-800/50';
      break;
    case 'cta':
      // Rich accent color for main CTA
      variantClasses = 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/30';
      break;
    default:
      variantClasses = 'bg-gray-800 text-gray-50 hover:bg-gray-700 border border-gray-700';
  }

  return (
    <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Simple Card Component
const Card: FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`rounded-2xl p-6 bg-gray-900 border border-gray-800 shadow-xl ${className}`} {...props}>
    {children}
  </div>
);

// --- Main App Component ---

const App: FC = () => {
  // Define custom styles for the light theme
  const themeClasses: { [key: string]: string } = {
    background: 'bg-gradient-to-b from-blue-50 to-white', // Light background
    foreground: 'text-gray-900', // Main text color
    mutedForeground: 'text-gray-600', // Secondary text
    cardBackground: 'bg-white',
    primaryAccent: 'text-blue-600', // Accent color for text/icons
    primaryBg: 'bg-blue-600', // Main CTA background
    border: 'border-gray-200',
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} font-sans relative`}>

      {/* Hero Section */}
      <header className="relative py-24 sm:py-32 overflow-hidden fade-sides" style={{ backgroundImage: "url('../Banner.png')" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight ${themeClasses.foreground}`}>
              <span className="block">Step up your</span>
              <span className={`bg-indigo-200 px-4 py-2 rounded-lg inline-block`} style={{marginLeft: 'auto', marginRight: 'auto'}}>SyncSketch game</span>
            </h1>
            <p className={`mx-auto mt-8 max-w-3xl text-lg ${themeClasses.mutedForeground}`}>
              Save your drawings to the cloud. Collaborate seamlessly. Unlock additional features.
            </p>
            <p className={`mx-auto mt-4 max-w-3xl text-lg ${themeClasses.mutedForeground}`}>
              Support open-source development.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://github.com/Rohs21" className="flex items-center justify-center bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors">
                View on Github
              </Link>
            </div>

            {/* Arrow Image */}
            <div className="mt-16 flex justify-center">
              <img src="https://plus.excalidraw.com/images/pen-tip.svg" alt="Arrow" className="h-25 w-15" />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl font-bold text-center mb-16 ${themeClasses.foreground}`}>
            Designed for Speed and Professionalism
          </h2>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1: Real-time Collaboration */}
            <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Share2 className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Instant Collaboration</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Share a link and start co-editing immediately. No latency, no delays—just pure synchronization.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 2: Multiplayer Cursors */}
            <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Users2 className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Presence & Cursors</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Always know who is viewing or editing your canvas. Real-time cursors make teamwork transparent.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 3: Smart Drawing */}
            <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Sparkles className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Intelligent Shaping</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Draw imperfect shapes; SyncSketch snaps them into perfect squares, circles, and diagrams.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 4: Performance */}
             <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Zap className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Optimized Performance</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Handles thousands of elements with ease, maintaining high FPS even on massive canvases.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 5: Secure Export */}
            <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Download className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Secure Export</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Export your work securely in high-resolution PNG, SVG, or JSON formats for seamless integration.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 6: Privacy */}
            <Card className="hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                  <Users2 className={`h-6 w-6 ${themeClasses.primaryAccent}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${themeClasses.foreground}`}>Privacy First</h3>
                  <p className={`mt-2 ${themeClasses.mutedForeground}`}>
                    Your data and diagrams are private and encrypted. Built for enterprise and confidential work.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-10 sm:p-16 ${themeClasses.cardBackground} border border-gray-200 shadow-2xl`}>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${themeClasses.foreground}`}>
                Ready to elevate your team's collaboration?
              </h2>
              <p className={`mx-auto mt-4 text-lg ${themeClasses.mutedForeground}`}>
                Get started today. Sign in or sign up to save your creations and access advanced features.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="cta" size="lg" className="h-14 px-8 text-lg rounded-xl">
                  Sign Up for Free
                </Button>
                <Button variant="secondary" size="lg" className="h-14 px-8 text-lg rounded-xl">
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${themeClasses.border} mt-12`}>
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className={`text-sm ${themeClasses.mutedForeground}`}>
              © {new Date().getFullYear()} SyncSketch. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className={`${themeClasses.mutedForeground} hover:${themeClasses.primaryAccent} transition-colors`}>
                <Github className="h-6 w-6" />
              </Link>
              <Link href="#" className={`${themeClasses.mutedForeground} hover:${themeClasses.primaryAccent} transition-colors`}>
                <Users2 className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;