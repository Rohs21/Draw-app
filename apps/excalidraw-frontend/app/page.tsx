import type React from "react"
import type { FC, HTMLAttributes, ButtonHTMLAttributes } from "react"
import {
  Share2,
  Users2,
  Sparkles,
  Github,
  Download,
  Zap,
  Shield,
  PenTool,
  Layers,
  MousePointer2,
  Star,
  ArrowRight,
  Play,
  Check,
  MonitorSmartphone,
  Palette,
} from "lucide-react"

// --- Type Definitions ---
interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string
  className?: string
  children: React.ReactNode
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "outline" | "cta"
  size?: "sm" | "lg"
  className?: string
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

// --- Mock Components for Single-File React Environment ---
const Link: FC<LinkProps> = ({ href = "#", children, className = "", ...props }) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
)

const Button: FC<ButtonProps> = ({ children, variant = "primary", size = "lg", className = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950"

  let sizeClasses = "h-12 px-6 text-base"
  if (size === "sm") sizeClasses = "h-8 px-3 text-sm"

  let variantClasses = ""
  switch (variant) {
    case "secondary":
      variantClasses =
        "bg-gray-700 text-gray-50 hover:bg-gray-600 border border-gray-700 shadow-lg hover:shadow-indigo-500/10"
      break
    case "outline":
      variantClasses = "border border-gray-300 text-gray-700 hover:bg-gray-100"
      break
    case "cta":
      variantClasses = "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30"
      break
    default:
      variantClasses = "bg-gray-800 text-gray-50 hover:bg-gray-700 border border-gray-700"
  }
  return (
    <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}

const Card: FC<CardProps> = ({ children, className = "", ...props }) => (
  <div className={`rounded-2xl p-6 ${className}`} {...props}>
    {children}
  </div>
)

// --- Main App Component ---
const App: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans relative">
      {/* Hero Section - UNCHANGED */}
      <header
        className="relative py-24 sm:py-32 overflow-hidden fade-sides"
        style={{ backgroundImage: "url('../Banner.png')" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-lg md:text-7xl font-bold tracking-tight text-gray-900">
              <span className="block">Step up your</span>
              <span
                className="bg-indigo-200 px-4 py-2 mt-5 rounded-lg inline-block font-extrabold"
                style={{ marginLeft: "auto", marginRight: "auto" }}
              >
                SyncSketch game
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg text-gray-600">
              Save your drawings to the cloud. Collaborate seamlessly. Unlock additional features.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">Support open-source development.</p>

            {/* CTA Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center justify-center bg-[#ffe599] border border-black text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Start Drawing
              </Link>
              <Link
                href=""
                className="flex items-center justify-center bg-[#ffe599] border border-black text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Live Demo
              </Link>
            </div>
            {/* Arrow Image */}
            <div className="mt-10 flex justify-center">
              <img src="https://plus.excalidraw.com/images/pen-tip.svg" alt="Arrow" className="h-22 w-12" />
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-10 left-10 w-48 h-48 text-blue-100 opacity-60" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
          </svg>
          <svg className="absolute bottom-20 right-20 w-32 h-32 text-amber-200 opacity-50" viewBox="0 0 100 100">
            <polygon
              points="50,10 90,90 10,90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-5xl">
            {/* Browser-style canvas mockup */}
            <div className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-2xl shadow-blue-500/10 overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-gray-500 max-w-md mx-auto text-center">
                    www.syncsketch.com
                  </div>
                </div>
              </div>

              {/* Canvas area with dot pattern */}
              <div
                className="relative h-[350px] md:h-[450px] bg-[#fafafa]"
                style={{
                  backgroundImage: "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {/* Floating sketchy elements */}
                <div className="absolute top-10 left-10 p-4 bg-blue-100 rounded-xl border-2 border-blue-300 shadow-lg transform -rotate-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Wireframe</span>
                  </div>
                </div>

                <div className="absolute top-16 right-12 p-3 bg-amber-100 rounded-lg border-2 border-amber-300 shadow-lg transform rotate-3">
                  <span className="text-amber-800 font-medium">Ideas</span>
                </div>

                <div className="absolute bottom-20 left-20 w-28 h-20 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Drop here</span>
                </div>

                {/* Floating user cursors */}
                <div className="absolute top-28 left-1/2 flex items-center gap-1">
                  <MousePointer2 className="w-4 h-4 text-purple-500 transform -rotate-12" />
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">Sarah</span>
                </div>

                <div className="absolute bottom-32 right-28 flex items-center gap-1">
                  <MousePointer2 className="w-4 h-4 text-green-500 transform -rotate-12" />
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Alex</span>
                </div>

                {/* Center element */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-44 h-28 border-2 border-gray-800 rounded-xl bg-white shadow-lg flex items-center justify-center">
                    <span className="text-gray-700 font-semibold">Main Concept</span>
                  </div>
                </div>

                {/* Tool palette */}
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white rounded-2xl shadow-xl border border-gray-200 px-4 py-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <PenTool className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 bg-blue-100 rounded-lg">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Palette className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <div className="flex gap-1">
                    {["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"].map((color) => (
                      <div
                        key={color}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stats */}
            <div className="absolute -left-4 top-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-xs text-gray-500">Live editors</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">60fps</p>
                  <p className="text-xs text-gray-500">Smooth canvas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with hand-drawn underline */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
              Powerful Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to{" "}
              <span className="relative inline-block">
                <span className="relative z-10">create</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path
                    d="M0 8 Q 25 2, 50 8 T 100 8"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              Built for designers, developers, and teams who value speed, simplicity, and seamless collaboration.
            </p>
          </div>

          {/* Bento grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Large card - Real-time Collaboration */}
            <Card className="md:col-span-2 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-2 border-gray-100 hover:border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <div className="flex flex-col md:flex-row gap-6 items-start p-2">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Share2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-time Collaboration</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Share a single link and watch your team come together. See everyone's cursors, changes sync
                    instantly, and ideas flow freely.
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex -space-x-2">
                      {["A", "B", "C", "D"].map((letter, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">+12 collaborating now</span>
                  </div>
                </div>
                <div className="hidden md:block w-40 h-40 relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-2xl transform rotate-3" />
                  <div className="absolute inset-0 bg-white rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                    <Users2 className="w-14 h-14 text-blue-300" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Smart Shapes */}
            <Card className="group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 border-2 border-gray-100 hover:border-amber-200 bg-gradient-to-br from-white to-amber-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Shapes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sketch rough shapes and watch them transform into perfect geometry automatically.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg" />
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="w-10 h-10 border-2 border-amber-400 rounded-lg bg-amber-50" />
              </div>
            </Card>

            {/* Performance */}
            <Card className="group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 border-2 border-gray-100 hover:border-green-200 bg-gradient-to-br from-white to-green-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 border border-green-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Blazing Fast</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Handle thousands of elements with ease. 60fps rendering even on massive canvases.
              </p>
              <div className="mt-4 flex items-end gap-1">
                {[40, 60, 55, 60, 58, 60, 60].map((h, i) => (
                  <div
                    key={i}
                    className="w-4 bg-green-400 rounded-t group-hover:bg-green-500 transition-colors"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </Card>

            {/* Export */}
            <Card className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 border-2 border-gray-100 hover:border-purple-200 bg-gradient-to-br from-white to-purple-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Export</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Export to PNG, SVG, or JSON. Perfect for presentations, docs, or development.
              </p>
              <div className="mt-4 flex gap-2">
                {["PNG", "SVG", "JSON"].map((format) => (
                  <span key={format} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {format}
                  </span>
                ))}
              </div>
            </Card>

            {/* Cross Platform */}
            <Card className="group hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 border-2 border-gray-100 hover:border-pink-200 bg-gradient-to-br from-white to-pink-50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 border border-pink-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                <MonitorSmartphone className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cross Platform</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Works beautifully on desktop, tablet, and mobile. Your canvas travels with you.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-8 border-2 border-pink-300 rounded bg-pink-50" />
                <div className="w-6 h-10 border-2 border-pink-300 rounded bg-pink-50" />
                <div className="w-8 h-6 border-2 border-pink-300 rounded bg-pink-50" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Loved by creative teams</h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-gray-600">Trusted by 50,000+ teams worldwide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Product Designer",
                quote: "SyncSketch has become my go-to for quick wireframes. The collaboration is seamless.",
              },
              {
                name: "Marcus Johnson",
                role: "Engineering Lead",
                quote: "We use it for architecture diagrams. The simplicity is refreshing compared to complex tools.",
              },
              {
                name: "Emily Park",
                role: "Startup Founder",
                quote: "Perfect for remote workshops. Our clients love participating in real-time sessions.",
              },
            ].map((t, i) => (
              <Card
                key={i}
                className="bg-white border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl"
              >
                <p className="text-gray-700 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 md:p-16 overflow-hidden">
              {/* Decorative blurs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl" />

              <div className="relative z-10 text-center">
                <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-medium rounded-full mb-6 border border-white/20">
                  Free to start
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to create something amazing?</h2>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
                  Start with our generous free tier. Upgrade when you need advanced features and team collaboration.
                </p>

                {/* Feature checklist */}
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  {["Unlimited canvases", "Real-time sync", "Export to PNG/SVG", "Up to 3 collaborators"].map(
                    (feature) => (
                      <div key={feature} className="flex items-center gap-2 text-white/90">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ),
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    variant="cta"
                    size="lg"
                    className="h-14 px-8 text-lg rounded-xl bg-white text-blue-700 hover:bg-blue-50 shadow-xl font-semibold"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-lg rounded-xl border-white/30 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
