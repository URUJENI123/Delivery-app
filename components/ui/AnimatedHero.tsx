export function AnimatedHero({ title, subtitle, fullBleed }: { title: string; subtitle?: string; fullBleed?: boolean }) {
  return (
    <section className={`
      relative h-[25vh] min-h-[200px] flex items-center px-6 md:px-12 lg:px-20
      overflow-hidden bg-red-600 rounded-b-2xl mb-8
      ${fullBleed ? '-mx-4 md:-mx-6 -mt-[72px] md:-mt-20' : ''}
    `}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-48 h-48 rounded-full bg-white animate-float-slow opacity-[0.06]" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[20%] right-[15%] w-36 h-36 rounded-full bg-white animate-float-med opacity-[0.05]" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[30%] w-24 h-24 rounded-full bg-white animate-float-fast opacity-[0.04]" style={{ animationDelay: '6s' }} />
        <div className="absolute top-[60%] right-[25%] w-28 h-28 rounded-full bg-white animate-float-slow opacity-[0.06]" style={{ animationDelay: '9s' }} />
        <div className="absolute top-[75%] left-[10%] w-16 h-16 rounded-full bg-white animate-float-med opacity-[0.05]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[5%] right-[35%] w-12 h-12 rounded-full bg-white animate-float-fast opacity-[0.04]" style={{ animationDelay: '5s' }} />
        <div className="absolute top-[50%] left-[55%] w-10 h-10 rounded-full bg-white animate-float-slow opacity-[0.06]" style={{ animationDelay: '7s' }} />

        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="hero-dot-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dot-grid)" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1000 800" preserveAspectRatio="none">
          <line x1="100" y1="0" x2="300" y2="800" stroke="white" strokeWidth="1" />
          <line x1="400" y1="0" x2="550" y2="800" stroke="white" strokeWidth="1" />
          <line x1="700" y1="0" x2="800" y2="800" stroke="white" strokeWidth="1" />
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-base md:text-lg text-white/80 mt-1 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
