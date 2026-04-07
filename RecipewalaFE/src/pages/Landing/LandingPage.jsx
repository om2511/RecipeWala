import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChefHat, 
  Sparkles, 
  Users, 
  Clock, 
  Heart, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Zap,
  Shield,
  Smartphone,
  Globe,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react'

import logoImage from '../../assets/images/logo.png'

// Add these imports to your LandingPage.jsx
import MetaTags from '../../components/SEO/MetaTags'
import CTASection from '../../components/Landing/CTASection'

const LandingPage = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault()
        const targetId = e.target.getAttribute('href').substring(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    document.addEventListener('click', handleSmoothScroll)
    return () => document.removeEventListener('click', handleSmoothScroll)
  }, [])

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Recipe Generation",
      description: "Generate unlimited recipes with our advanced AI technology. Just tell us what you want to cook!",
      color: "bg-orange-500"
    },
    {
      icon: Clock,
      title: "Smart Meal Planning",
      description: "Plan your weekly meals effortlessly with our intelligent meal planning system.",
      color: "bg-blue-500"
    },
    {
      icon: Users,
      title: "Recipe Collections",
      description: "Organize your favorite recipes into collections and share them with friends and family.",
      color: "bg-green-500"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Cook with confidence using our mobile-optimized interface designed for the kitchen.",
      color: "bg-purple-500"
    }
  ]

  const stats = [
    { number: "50K+", label: "Recipes Generated", icon: ChefHat },
    { number: "15K+", label: "Happy Cooks", icon: Users },
    { number: "4.9/5", label: "User Rating", icon: Star },
    { number: "99.9%", label: "Uptime", icon: Shield }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Cook",
      avatar: "SJ",
      rating: 5,
      text: "RecipeWala has completely transformed my cooking! The AI suggestions are spot-on and I've discovered so many new dishes my family loves."
    },
    {
      name: "Marco Rodriguez",
      role: "Food Blogger",
      avatar: "MR", 
      rating: 5,
      text: "As a food blogger, I need constant inspiration. RecipeWala's AI generates unique recipes that my readers absolutely love!"
    },
    {
      name: "Emily Chen",
      role: "Busy Mom",
      avatar: "EC",
      rating: 5,
      text: "The meal planning feature is a lifesaver! I can plan our whole week in minutes and the shopping lists are automatically generated."
    }
  ]

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "5 AI recipe generations per month",
        "Basic recipe management",
        "Mobile app access",
        "Community support"
      ],
      popular: false,
      cta: "Get Started Free"
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      description: "For serious home cooks",
      features: [
        "Unlimited AI recipe generations",
        "Advanced meal planning",
        "Recipe collections & sharing",
        "Priority support",
        "Export to PDF",
        "Nutritional analysis"
      ],
      popular: true,
      cta: "Start Pro Trial"
    },
    {
      name: "Family",
      price: "$19.99", 
      period: "per month",
      description: "For the whole family",
      features: [
        "Everything in Pro",
        "Up to 6 family members",
        "Family meal planning",
        "Shopping list collaboration",
        "Kids-friendly recipes",
        "Dietary restrictions management"
      ],
      popular: false,
      cta: "Choose Family"
    }
  ]

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Navigation */}
      <Navbar 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogin={() => navigate('/login')}
        onSignUp={() => navigate('/register')}
      />

      {/* Hero Section */}
      <HeroSection onGetStarted={() => navigate('/register')} />

      {/* Stats Section */}
      <StatsSection stats={stats} />

      {/* Features Section */}
      <FeaturesSection features={features} />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <TestimonialsSection 
        testimonials={testimonials}
        activeTestimonial={activeTestimonial}
        setActiveTestimonial={setActiveTestimonial}
      />

      {/* Pricing */}
      <PricingSection 
        plans={pricingPlans}
        onSelectPlan={() => navigate('/register')}
      />

      {/* CTA Section */}
      <CTASection onGetStarted={() => navigate('/register')} />

      {/* About Us */}
      <AboutSection />

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <Footer onLogin={() => navigate('/login')} />
    </div>
  )
}

// Navbar Component
const Navbar = ({ mobileMenuOpen, setMobileMenuOpen, onLogin, onSignUp }) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoImage} className="h-12 w-12 sm:h-16 sm:w-16" alt="Logo" />
            <span className="truncate text-xl font-bold text-gray-900 sm:text-2xl">RecipeWala</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={onLogin}
              className="text-gray-700 hover:text-orange-500 transition-colors font-medium"
            >
              Login
            </button>
            <button
              onClick={onSignUp}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Sign Up Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-gray-700 hover:text-orange-500 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  onLogin()
                  setMobileMenuOpen(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-500"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onSignUp()
                  setMobileMenuOpen(false)
                }}
                className="block w-full rounded-lg bg-orange-500 px-6 py-2 text-center font-medium text-white transition-colors hover:bg-orange-600"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// Hero Section Component
const HeroSection = ({ onGetStarted }) => {
  return (
    <section id="home" className="bg-gradient-to-br from-orange-50 to-yellow-50 pb-16 pt-24 sm:pb-20 sm:pt-[6.5rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Cook Amazing Meals with
              <span className="text-orange-500 block">AI-Powered Recipes</span>
            </h1>
            <p className="mb-8 text-base leading-relaxed text-gray-600 sm:text-lg lg:text-xl">
              Generate unlimited personalized recipes, plan your meals, and organize your cooking journey with our intelligent recipe assistant.
            </p>
            
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 sm:px-8 sm:text-lg"
              >
                <span>Start Cooking Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-orange-500 px-6 py-4 text-base font-semibold text-orange-500 transition-colors hover:bg-orange-500 hover:text-white sm:px-8 sm:text-lg">
                <Play className="h-5 w-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image/Demo */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="rounded-2xl bg-white p-5 shadow-2xl transition-transform duration-300 sm:p-8 lg:rotate-3 lg:hover:rotate-0">
              <div className="mb-6 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 p-5 text-white sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  <span className="font-semibold">AI Recipe Generator</span>
                </div>
                <p className="text-orange-100">What would you like to cook today?</p>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Paneer Tikka Masala</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>35 mins</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>8 servings</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>4.8</span>
                    </span>
                  </div>
                </div>
                
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Masala Khichdi</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>20 mins</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>7 servings</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>4.7</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute md:-left-4 -top-6 -left-2 rounded-full bg-orange-500 p-1 text-white animate-bounce">
              <img src={logoImage} className="h-10 w-10 sm:h-12 sm:w-12" alt="Logo" />
            </div>
            <div className="absolute -bottom-2 -right-2 rounded-full bg-red-500 p-2 text-white animate-pulse sm:-bottom-4 sm:-right-4 sm:p-3">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Stats Section Component
const StatsSection = ({ stats }) => {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 sm:h-16 sm:w-16">
                <stat.icon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{stat.number}</div>
              <div className="text-sm text-gray-600 sm:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Features Section Component
const FeaturesSection = ({ features }) => {
  return (
    <section id="features" className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Powerful Features for Modern Cooking
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600 sm:text-lg lg:text-xl">
            Everything you need to transform your cooking experience with cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl sm:p-8">
              <div className={`${feature.color} mb-6 flex h-12 w-12 items-center justify-center rounded-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section Component
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Tell Us What You Want",
      description: "Describe your ideal dish, dietary preferences, or ingredients you have on hand",
      icon: Sparkles
    },
    {
      number: "02", 
      title: "AI Creates Your Recipe",
      description: "Our advanced AI generates a personalized recipe with detailed instructions",
      icon: Zap
    },
    {
      number: "03",
      title: "Cook & Enjoy",
      description: "Follow the step-by-step instructions and enjoy your delicious creation",
      icon: ChefHat
    }
  ]

  return (
    <section id="how-it-works" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            How RecipeWala Works
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg lg:text-xl">
            Get personalized recipes in three simple steps
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                {step.number}
              </div>
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6">
                <step.icon className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
              
              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-orange-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Testimonials Section Component  
const TestimonialsSection = ({ testimonials, activeTestimonial, setActiveTestimonial }) => {
  return (
    <section className="bg-gradient-to-r from-orange-500 to-yellow-500 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            What Our Users Say
          </h2>
          <p className="mx-auto max-w-2xl text-base text-orange-100 sm:text-lg lg:text-xl">
            Join thousands of happy cooks who've transformed their kitchens
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8 md:p-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
                ))}
              </div>
              
              <blockquote className="mb-8 text-lg leading-relaxed text-gray-700 md:text-2xl">
                "{testimonials[activeTestimonial].text}"
              </blockquote>
              
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</div>
                  <div className="text-gray-600">{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Navigation */}
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeTestimonial ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing Section Component
const PricingSection = ({ plans, onSelectPlan }) => {
  return (
    <section id="pricing" className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Choose Your Cooking Journey
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg lg:text-xl">
            Start free and upgrade when you're ready for more features
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`relative rounded-2xl bg-white p-6 shadow-lg sm:p-8 ${
              plan.popular ? 'ring-2 ring-orange-500 lg:scale-105' : ''
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">{plan.name}</h3>
                <p className="mb-6 text-sm text-gray-600 sm:text-base">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900 sm:text-4xl">{plan.price}</span>
                  <span className="text-sm text-gray-600 sm:text-base">/{plan.period}</span>
                </div>

                <ul className="mb-8 space-y-3 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm text-gray-700 sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onSelectPlan}
                  className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// About Section Component
const AboutSection = () => {
  return (
    <section id="about" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="mb-6 text-3xl text-center md:text-start font-bold text-gray-900 md:text-4xl">
              About RecipeWala
            </h2>
            <p className="mb-6 text-center md:text-left leading-relaxed text-gray-600 sm:text-lg">
              We believe cooking should be joyful, creative, and accessible to everyone. That's why we created RecipeWala - the world's first AI-powered recipe platform that understands your taste preferences and dietary needs.
            </p>
            <p className="mb-8 text-center md:text-left leading-relaxed text-gray-600 sm:text-lg">
              Founded by food enthusiasts and tech experts, we're on a mission to revolutionize home cooking by making it easier, more personalized, and more fun than ever before.
            </p>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Growing Fast</div>
                <div className="text-sm text-gray-600">50k+ recipes generated</div>
              </div>
              <div className="text-center">
                <Award className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Award Winning</div>
                <div className="text-sm text-gray-600">Best Cooking App 2024</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-500 p-6 text-white sm:p-8">
              <h3 className="mb-4 text-2xl font-bold">Our Mission</h3>
              <p className="text-orange-100 leading-relaxed">
                To empower every home cook with the tools, knowledge, and inspiration they need to create amazing meals and bring families together around the dinner table.
              </p>
              
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg bg-white/20 p-4 text-center">
                  <Globe className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm">Global Reach</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm">Community First</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Contact Section Component
const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', formData)
    // Reset form
    setFormData({ name: '', email: '', message: '' })
    alert('Thank you for your message! We\'ll get back to you soon.')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Get In Touch
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg lg:text-xl">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Contact Form */}
          <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-orange-500" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-gray-600">hello@recipewala.com</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-orange-500" />
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <div className="text-gray-600">+1 (555) 123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-orange-500" />
                  <div>
                    <div className="font-medium text-gray-900">Office</div>
                    <div className="text-gray-600">123 Recipe Street, Food City, FC 12345</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Follow Us</h3>
              
              <div className="flex flex-wrap gap-4">
                <a href="#" className="rounded-lg bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="rounded-lg bg-blue-400 p-3 text-white transition-colors hover:bg-blue-500">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="rounded-lg bg-pink-600 p-3 text-white transition-colors hover:bg-pink-700">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="rounded-lg bg-red-600 p-3 text-white transition-colors hover:bg-red-700">
                  <Youtube className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer Component
const Footer = ({ onLogin }) => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Recipe Generator', href: '#' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Contact', href: '#contact' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' }
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'API Docs', href: '#' },
      { name: 'Status', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' }
    ]
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <img src={logoImage} className="h-12 w-12 sm:h-16 sm:w-16" alt="Logo" />
              <span className="text-xl font-bold sm:text-2xl">RecipeWala</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Transform your cooking journey with AI-powered recipes, smart meal planning, and personalized culinary experiences.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-orange-500 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center text-sm text-gray-400 md:text-left">
              © 2025 RecipeWala. All rights reserved. Made with ❤️ for food lovers.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onLogin}
                className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
              >
                Sign In
              </button>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingPage