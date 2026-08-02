'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Package, MapPin, CheckCircle, Shield, Navigation, Phone, Truck,
  ArrowRight, Star, Menu, X, Download, Smartphone, Users, Clock,
  TrendingUp, Zap, Award, ChevronRight, Eye, MessageSquare, Mail, Sun, Moon
} from 'lucide-react';

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = Math.ceil(end / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#testimonials', label: 'Testimonials' },
];

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const APP_STORE_URL = 'https://apps.apple.com/app/delivery';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.delivery.app';

function handleMobileAppCta(setShowModal: (v: boolean) => void) {
  if (isMobile()) {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    window.open(isIOS ? APP_STORE_URL : PLAY_STORE_URL, '_blank');
  } else {
    setShowModal(true);
  }
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [inHero, setInHero] = useState(true);
  const [dark, setDark] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
    return () => {
      const s = localStorage.getItem('theme');
      if (s === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    const s = localStorage.getItem('theme');
    if (s !== 'dark') document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight;
        setInHero(y < heroBottom - 100);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center cursor-pointer z-10">
              <img src="/logo.png" alt="Delivery" className="w-28 md:w-36 h-auto" />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href}
                  className="text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors duration-200 cursor-pointer"
                >{l.label}</a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !dark;
                  setDark(next);
                  document.documentElement.classList.toggle('dark', next);
                  localStorage.setItem('theme', next ? 'dark' : 'light');
                }}
                className="h-11 w-11 flex items-center justify-center text-gray-500 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors duration-200 cursor-pointer"
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/auth/signin"
                className="h-11 px-5 text-sm font-semibold text-gray-950 hover:text-red-600 transition-colors duration-200 cursor-pointer flex items-center"
              >Sign in</Link>
              <button
                onClick={() => handleMobileAppCta(setShowMobileModal)}
                className="h-11 px-5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-800 transition-colors duration-200 cursor-pointer flex items-center gap-2"
              >Get started <ArrowRight size={14} /></button>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -mr-2 cursor-pointer z-10 text-gray-950"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-gray-950/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile nav — slide from left */}
        <div
          className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 md:hidden animate-slide-in-left flex flex-col ${
            mobileOpen ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="flex items-center px-6 h-20 border-b border-gray-200">
            <img src="/logo.png" alt="Delivery" className="w-28 md:w-36 h-auto" />
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block py-3 px-3 text-sm font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >{l.label}</a>
            ))}
            <hr className="my-4 border-gray-200" />
            <Link href="/auth/signin" onClick={() => setMobileOpen(false)}
                className="block py-3 px-3 text-sm font-semibold text-gray-950 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >Sign in</Link>
            <button
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.classList.toggle('dark', next);
                localStorage.setItem('theme', next ? 'dark' : 'light');
              }}
              className="flex items-center gap-3 w-full py-3 px-3 text-sm font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </nav>
          <div className="px-4 py-6 border-t border-gray-200">
            <button
              onClick={() => { setMobileOpen(false); handleMobileAppCta(setShowMobileModal); }}
              className="flex items-center justify-center w-full h-12 bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer"
            >Get started <ArrowRight size={14} className="ml-2" /></button>
          </div>
        </div>
      </header>

      {/* HERO — Red background with animated decorations */}
      <section ref={heroRef} className="min-h-screen flex items-center px-6 md:px-12 lg:px-20 pt-24 relative overflow-hidden bg-red-600">
        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large floating circles */}
          <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-white animate-float-slow" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[20%] right-[15%] w-48 h-48 rounded-full bg-white animate-float-med" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[40%] left-[30%] w-32 h-32 rounded-full bg-white animate-float-fast" style={{ animationDelay: '6s' }} />
          <div className="absolute top-[60%] right-[25%] w-40 h-40 rounded-full bg-white animate-float-slow" style={{ animationDelay: '9s' }} />
          <div className="absolute top-[75%] left-[10%] w-20 h-20 rounded-full bg-white animate-float-med" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[5%] right-[35%] w-16 h-16 rounded-full bg-white animate-float-fast" style={{ animationDelay: '5s' }} />
          <div className="absolute top-[50%] left-[55%] w-12 h-12 rounded-full bg-white animate-float-slow" style={{ animationDelay: '7s' }} />
          <div className="absolute top-[30%] left-[70%] w-8 h-8 rounded-full bg-white animate-float-med" style={{ animationDelay: '4s' }} />

          {/* Dot grid pattern overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
            <defs>
              <pattern id="dot-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />
          </svg>

          {/* Diagonal accent lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1000 800" preserveAspectRatio="none">
            <line x1="100" y1="0" x2="300" y2="800" stroke="white" strokeWidth="1" />
            <line x1="400" y1="0" x2="550" y2="800" stroke="white" strokeWidth="1" />
            <line x1="700" y1="0" x2="800" y2="800" stroke="white" strokeWidth="1" />
            <line x1="0" y1="200" x2="1000" y2="250" stroke="white" strokeWidth="1" />
            <line x1="0" y1="500" x2="1000" y2="450" stroke="white" strokeWidth="1" />
          </svg>

          {/* Radial gradient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white opacity-[0.03]" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          <div>
            <FadeInSection>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                <MapPin size={14} />
                Trusted in Kigali, Rwanda
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tighter mb-6">
                Every delivery
                <br />
                <span className="text-white/90">accounted for.</span>
              </h1>
              <p className="font-body text-lg md:text-xl text-white/80 leading-relaxed max-w-lg mb-8">
                Connect with verified motorcycle couriers. Track in real-time. OTP-secured handover at every step.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleMobileAppCta(setShowMobileModal)}
                  className="inline-flex items-center gap-2 h-14 px-8 bg-white text-red-600 rounded-xl font-display font-bold text-base hover:bg-gray-150 transition-colors duration-200 cursor-pointer"
                >
                  Send a package <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => handleMobileAppCta(setShowMobileModal)}
                  className="inline-flex items-center gap-2 h-14 px-8 bg-transparent text-white border-2 border-white/30 rounded-xl font-display font-bold text-base hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                >
                  Become a courier
                </button>
              </div>
              <div className="flex flex-wrap gap-6 mt-10">
                {[
                  { icon: CheckCircle, label: 'OTP handover' },
                  { icon: Navigation, label: 'Live tracking' },
                  { icon: Shield, label: 'Verified riders' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 text-sm font-semibold text-white/70">
                    <Icon size={18} className="text-white" />
                    {label}
                  </span>
                ))}
              </div>

              {/* App Store buttons */}
              <div className="flex flex-wrap gap-3 mt-10">
                <button className="inline-flex items-center gap-3 h-12 px-5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
                  <Download size={18} />
                  <div className="text-left">
                    <p className="text-[10px] font-normal opacity-70">Download on</p>
                    <p className="text-sm font-bold -mt-0.5">App Store</p>
                  </div>
                </button>
                <button className="inline-flex items-center gap-3 h-12 px-5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
                  <Smartphone size={18} />
                  <div className="text-left">
                    <p className="text-[10px] font-normal opacity-70">Get it on</p>
                    <p className="text-sm font-bold -mt-0.5">Play Store</p>
                  </div>
                </button>
              </div>
            </FadeInSection>
          </div>

          {/* Phone mockup */}
          <FadeInSection delay={200}>
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-[320px] h-[660px] bg-gray-950 rounded-[3rem] border-4 border-gray-800 p-3 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-6 bg-gray-950 rounded-b-2xl z-10" />
                <div className="w-full h-full bg-gray-150 rounded-[2.25rem] overflow-hidden relative">
                  <div className="absolute inset-0 opacity-[0.06]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`pv${i}`} className="absolute bg-gray-950" style={{ left: `${i * 20}%`, width: 1, height: '100%' }} />
                    ))}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={`ph${i}`} className="absolute bg-gray-950" style={{ top: `${i * 8.5}%`, height: 1, width: '100%' }} />
                    ))}
                  </div>

                  <div className="absolute top-0 left-0 right-0 px-6 pt-2 flex justify-between text-[10px] font-bold text-gray-500 z-10">
                    <span>9:41</span>
                    <span className="flex gap-1">
                      <span className="w-3.5 h-2 border border-gray-400 rounded-sm mt-0.5" />
                      <span className="text-xs">...</span>
                    </span>
                  </div>

                  <div className="absolute top-8 left-0 right-0 p-4 pt-6">
                    <div className="bg-white/95 rounded-xl border border-gray-200 p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-950">Delivery · #DEL-2841</span>
                        <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">In Transit</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Kacyiru</span>
                        <ChevronRight size={10} />
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        <span>Nyarugenge</span>
                      </div>
                    </div>

                    <div className="relative h-40 mb-3">
                      <div className="absolute top-6 left-1/2 -translate-x-1/2">
                        <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                          <Truck size={16} className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full animate-ping opacity-75" />
                      </div>
                      <div className="absolute bottom-0 left-[15%] w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      <div className="absolute bottom-2 right-[20%] w-3 h-3 bg-red-600 rounded-full border-2 border-white" />
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 25 85 Q 40 40, 50 25 Q 55 35, 80 80"
                          stroke="#892020" strokeWidth="1.5" fill="none" strokeDasharray="3 3" opacity="0.4" />
                      </svg>
                    </div>

                    <div className="bg-white/95 rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-950">Courier arriving</p>
                          <p className="text-[10px] text-gray-500">ETA: 8 minutes · Jean P.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
                    {[Package, MapPin, Eye, MessageSquare, Users].map((Icon, i) => (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}>
                        <Icon size={16} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-8 bottom-20 bg-white rounded-xl border border-gray-200 p-3 animate-bounce-subtle shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['#892020', '#2563EB', '#059669'].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-950">200+ riders</span>
                </div>
              </div>
              <div className="absolute -right-4 top-32 bg-white rounded-xl border border-gray-200 p-3 animate-bounce-subtle shadow-lg" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="text-xs font-bold text-gray-950">4.9 ★</span>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* TRUST BAR — real data only */}
      <FadeInSection>
        <section className="border-y border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
            <p className="text-center text-xs font-bold text-gray-400 tracking-widest uppercase mb-8">Trusted across Kigali</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Package, label: 'Real-time tracking' },
                { icon: Shield, label: 'OTP-secured handover' },
                { icon: Users, label: 'Verified couriers' },
                { icon: Zap, label: 'Instant matching' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <Icon size={18} className="text-red-600" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* HOW IT WORKS */}
      <FadeInSection>
        <section id="how-it-works" className="py-24 md:py-32 px-6 md:px-12 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-16">
              <p className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4">Simple process</p>
              <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-gray-950">
                Three steps to deliver
              </h2>
              <p className="text-gray-500 text-lg mt-4 max-w-lg">
                From pickup to drop-off, every step is tracked and verified.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { number: '01', icon: Package, title: 'Request a pickup', desc: 'Enter pickup and drop-off locations, describe your package, and set a schedule. Instant price estimate.' },
                { number: '02', icon: Navigation, title: 'Track in real-time', desc: 'Watch your courier approach on the live map. SMS updates at every milestone.' },
                { number: '03', icon: CheckCircle, title: 'Confirm with OTP', desc: 'Sender and recipient each verify with a unique code. Proof of delivery, every time.' },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="group relative p-8 md:p-10 bg-white rounded-2xl border border-gray-200 hover:border-red-600/30 transition-all duration-300 cursor-pointer">
                    <span className="font-display text-8xl font-black text-gray-150 select-none absolute -top-4 -left-2 leading-none group-hover:text-red-600/10 transition-colors duration-300">
                      {step.number}
                    </span>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon size={26} className="text-red-600" />
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-3 text-gray-950">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight size={20} className="text-red-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* FEATURES */}
      <FadeInSection>
        <section id="features" className="py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4">Platform features</p>
              <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-gray-950">
                Everything you need
              </h2>
              <p className="text-gray-500 text-lg mt-4">
                Built for accountability, designed for speed.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Navigation, title: 'Live GPS Tracking', desc: 'See your courier moving on the map from pickup to drop-off in real time.' },
                { icon: Shield, title: 'Chain of Custody', desc: 'Every handover verified with a unique OTP. Full audit trail for every package.' },
                { icon: Phone, title: 'SMS Notifications', desc: 'Sender and recipient get automatic SMS updates at every status change.' },
                { icon: Zap, title: 'Instant Matching', desc: 'Available couriers are notified within seconds. Average match time: under 2 minutes.' },
                { icon: TrendingUp, title: 'Fair Pricing', desc: 'Transparent pricing based on distance and package type. No hidden fees.' },
                { icon: Award, title: 'Verified Couriers', desc: 'Every rider passes ID, vehicle, and background checks before their first job.' },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="p-8 bg-white rounded-2xl border border-gray-200 hover:border-red-600/20 transition-all duration-200 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={22} className="text-red-600" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2 text-gray-950">{feat.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* STEPS VISUAL */}
      <FadeInSection>
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div>
                <p className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4">End-to-end visibility</p>
                <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-gray-950 mb-6">
                  From request to <span className="text-red-600">proof of delivery</span>
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">
                  Every delivery follows a secure, trackable chain of custody. 
                  Sender, courier, and recipient all get real-time visibility.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: Package, title: 'Package picked up', sub: 'Courier scans and confirms pickup with sender OTP' },
                    { icon: Truck, title: 'In transit to recipient', sub: 'Live map tracking with estimated arrival time' },
                    { icon: CheckCircle, title: 'Delivered & confirmed', sub: 'Recipient verifies with OTP. Digital proof generated.' },
                  ].map(({ icon: Icon, title, sub }, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-red-600" />
                        </div>
                        {i < 2 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                      </div>
                      <div className="pb-6">
                        <p className="font-bold text-gray-950">{title}</p>
                        <p className="text-sm text-gray-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-3xl border border-gray-200 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex -space-x-2">
                    {['#892020', '#059669', '#2563EB'].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-950">Active delivery</p>
                    <p className="text-xs text-gray-500">Kacyiru → Nyarugenge · 8 min</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Requested', time: '10:30 AM', done: true },
                    { label: 'Courier assigned', time: '10:32 AM', done: true },
                    { label: 'Picked up', time: '10:45 AM', done: true },
                    { label: 'In transit', time: '10:47 AM', active: true },
                    { label: 'Arrived at drop-off', time: '~10:55 AM' },
                    { label: 'Delivered', time: '' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.done ? 'bg-success' : s.active ? 'bg-red-100 border-2 border-red-600' : 'bg-gray-200'
                      }`}>
                        {s.done && <CheckCircle size={14} className="text-white" />}
                        {s.active && <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${s.done ? 'text-gray-950' : s.active ? 'text-red-600' : 'text-gray-400'}`}>{s.label}</p>
                      </div>
                      <p className={`text-xs ${s.done || s.active ? 'text-gray-500' : 'text-gray-400'}`}>{s.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* PLATFORM OVERVIEW */}
      <FadeInSection>
        <section id="testimonials" className="py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-gray-950 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4">Platform</p>
              <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter mb-6">
                Built for Kigali
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
                OTP-secured chain of custody, live GPS tracking, and instant courier matching — every step designed for accountability.
              </p>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* FINAL CTA */}
      <FadeInSection>
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-red-600 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-display text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
              Ready to ship?
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto">
              Join thousands of Kigali residents who trust Delivery for their packages.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleMobileAppCta(setShowMobileModal)}
                className="inline-flex items-center gap-2 h-14 px-8 bg-white text-red-600 rounded-xl font-display font-bold text-base hover:bg-gray-150 transition-colors duration-200 cursor-pointer"
              >
                Send a package <ArrowRight size={18} />
              </button>
                <button
                  onClick={() => handleMobileAppCta(setShowMobileModal)}
                  className="inline-flex items-center gap-2 h-14 px-8 bg-transparent text-white border-2 border-white/30 rounded-xl font-display font-bold text-base hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                >
                  Become a courier
                </button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-white/60">
              <span className="flex items-center gap-2"><CheckCircle size={16} /> No hidden fees</span>
              <span className="flex items-center gap-2"><Shield size={16} /> Insured deliveries</span>
              <span className="flex items-center gap-2"><Phone size={16} /> 24/7 support</span>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* FOOTER */}
      <footer className="py-16 px-6 md:px-12 lg:px-20 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="Delivery" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                Kigali&apos;s trusted motorcycle delivery platform. Every package tracked, every handover verified.
              </p>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={14} className="text-red-600" />
                  Kigali, Rwanda
                </div>
              </div>
            </div>
            <div>
              <p className="font-bold text-sm mb-4">Platform</p>
              <div className="space-y-3 text-sm text-gray-400">
                <button onClick={() => handleMobileAppCta(setShowMobileModal)} className="block hover:text-white transition-colors cursor-pointer">Send a package</button>
                <button onClick={() => handleMobileAppCta(setShowMobileModal)} className="block hover:text-white transition-colors cursor-pointer">Track delivery</button>
                <button onClick={() => handleMobileAppCta(setShowMobileModal)} className="block hover:text-white transition-colors cursor-pointer">Become a courier</button>
              </div>
            </div>
            <div>
              <p className="font-bold text-sm mb-4">Company</p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="#" className="block hover:text-white transition-colors cursor-pointer">About</Link>
                <Link href="#" className="block hover:text-white transition-colors cursor-pointer">Privacy</Link>
                <Link href="#" className="block hover:text-white transition-colors cursor-pointer">Terms</Link>
                <Link href="#" className="block hover:text-white transition-colors cursor-pointer">Support</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">&copy; 2026 Delivery. Kigali, Rwanda.</p>
            <div className="flex gap-6 text-xs text-gray-500">
              <Link href="#" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors cursor-pointer">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile app prompt modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowMobileModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowMobileModal(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={20} />
            </button>
            <Smartphone size={48} className="mx-auto text-red-600 mb-4" />
            <h3 className="font-display text-2xl font-bold text-gray-950 mb-2">Mobile App</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Feel free to proceed with our mobile app. Download it from the App Store or Google Play Store for the best experience.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 h-12 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                <Download size={18} />
                Download on App Store
              </a>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 h-12 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                <Smartphone size={18} />
                Get it on Play Store
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
