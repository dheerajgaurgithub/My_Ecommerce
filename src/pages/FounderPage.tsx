import { Code, Heart, Mail, Linkedin, Github, Twitter, MapPin, Calendar, Quote, Sparkles, Award, Zap, Globe } from 'lucide-react';

const palette = {
  ink: '#1C1420',
  panel: '#241A2C',
  panelSoft: '#2C2036',
  gold: '#C9A227',
  goldLight: '#E7C873',
  cream: '#F2EAE0',
  creamMuted: '#C9BFC0',
  hair: 'rgba(201,162,39,0.35)',
};

const skillGroups = [
  { label: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'] },
  { label: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'REST APIs'] },
  { label: 'Commerce', items: ['Payment Integration', 'Inventory Management', 'Order Processing'] },
  { label: 'Craft', items: ['UI/UX Design', 'Database Design', 'Cloud Deployment'] },
];

const facts = [
  { icon: MapPin, label: 'Location', value: 'Aligarh, UP, India' },
  { icon: Calendar, label: 'Founded', value: '2026' },
  { icon: Code, label: 'Project', value: 'Mahir & Friends' },
];

const socials = [
  { icon: Mail, label: 'Email', href: 'mailto:replybymahirandfriends@gmail.com' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
];

const AVATAR = '/founder.jpeg';
const SIGNATURE = '/signature.png';

export default function FounderPage() {
  return (
    <div style={{ backgroundColor: palette.ink, color: palette.cream }} className="min-h-screen">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-5" style={{ background: `radial-gradient(circle, ${palette.gold} 0%, transparent 70%)` }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-5" style={{ background: `radial-gradient(circle, ${palette.goldLight} 0%, transparent 70%)` }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-3" style={{ background: `radial-gradient(circle, ${palette.gold} 0%, transparent 70%)` }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16 relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-12 md:mb-14" style={{ borderBottom: `1px solid ${palette.hair}` }}>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] mb-2 sm:mb-0" style={{ color: palette.goldLight }}>
            Mahir &amp; Friends
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em]" style={{ color: palette.creamMuted }}>
            Founder Profile
          </span>
        </div>

        {/* Hero Section */}
        <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-12 items-start mb-16">
          <div className="relative mx-auto md:mx-0">
            <div className="relative">
              <img
                src={AVATAR}
                alt="Dheeraj Gaur - MAHIR"
                className="w-48 h-48 sm:w-56 sm:h-56 md:w-[280px] md:h-[280px] object-cover rounded-lg"
                style={{ border: `2px solid ${palette.gold}`, boxShadow: `0 0 40px rgba(201,162,39,0.2)` }}
              />
              <div
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 rotate-[10deg] px-4 py-2 shadow-xl flex items-center gap-2"
                style={{ backgroundColor: palette.gold, color: palette.ink }}
              >
                <Sparkles size={14} strokeWidth={2.5} />
                <span className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest font-bold">Mahir</span>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: Award, label: 'Founder' },
                { icon: Zap, label: 'Developer' },
                { icon: Globe, label: 'Visionary' }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center p-2 rounded" style={{ backgroundColor: palette.panelSoft }}>
                  <Icon size={16} style={{ color: palette.gold }} className="mx-auto mb-1" />
                  <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: palette.creamMuted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center md:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.25em] mb-3" style={{ color: palette.gold }}>
              Founder &amp; Lead Developer
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.95] mb-3" style={{ color: palette.cream }}>
              Dheeraj Gaur
            </h1>
            <p className="font-serif italic text-xl md:text-2xl mb-6" style={{ color: palette.goldLight }}>
              known as &ldquo;Mahir&rdquo;
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {['Full-Stack Developer', 'E-commerce Expert', 'Tech Visionary'].map((tag) => (
                <span key={tag} className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-full" style={{ border: `1px dashed ${palette.hair}`, color: palette.creamMuted, backgroundColor: palette.panelSoft }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mb-16 relative px-6 md:px-12 py-8 rounded-2xl" style={{ backgroundColor: palette.panelSoft, border: `1px solid ${palette.hair}` }}>
          <Quote size={48} style={{ color: palette.gold, opacity: 0.3 }} className="mb-4" />
          <blockquote className="font-serif italic text-2xl md:text-3xl leading-snug mb-4" style={{ color: palette.cream }}>
            Fashion is not just about clothes, it&rsquo;s about expressing who you are.
            I built Mahir &amp; Friends to help everyone find their unique style.
          </blockquote>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: palette.gold }}>
            — Dheeraj Gaur (Mahir)
          </p>
        </div>

        {/* About Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Heart size={20} style={{ color: palette.gold }} />
            <h2 className="font-mono text-sm uppercase tracking-[0.3em]" style={{ color: palette.goldLight }}>About</h2>
            <div className="flex-1 h-px" style={{ backgroundColor: palette.hair }} />
          </div>
          <div className="space-y-6 font-sans text-[15px] sm:text-[16px] leading-relaxed" style={{ color: palette.creamMuted }}>
            <p>
              <span className="float-left font-serif text-5xl sm:text-6xl leading-[0.8] mr-3 mt-1" style={{ color: palette.gold }}>D</span>
              heeraj Gaur, fondly known as <strong style={{ color: palette.cream }}>MAHIR</strong>, is the founder and lead developer of Mahir &amp; Friends. With a deep passion for technology and fashion, he envisioned a platform that would make quality fashion accessible to everyone across India.
            </p>
            <p>
              Starting from humble beginnings in Aligarh, Uttar Pradesh, Dheeraj built this e-commerce platform from scratch, handling everything from backend development to frontend design. His dedication to creating a seamless shopping experience has been the driving force behind the company&rsquo;s success.
            </p>
            <p>
              When he&rsquo;s not coding or strategizing the next big feature, you can find him exploring new technologies, mentoring aspiring developers, or spending time with family and friends.
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Code size={20} style={{ color: palette.gold }} />
            <h2 className="font-mono text-sm uppercase tracking-[0.3em]" style={{ color: palette.goldLight }}>Skills &amp; Expertise</h2>
            <div className="flex-1 h-px" style={{ backgroundColor: palette.hair }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {skillGroups.map((group) => (
              <div key={group.label} className="p-5 rounded-xl" style={{ border: `1px dashed ${palette.hair}`, backgroundColor: palette.panel }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: palette.gold }}>{group.label}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {group.items.map((item, i) => (
                    <span key={item} className="font-sans text-sm" style={{ color: palette.cream }}>
                      {item}
                      {i < group.items.length - 1 && <span style={{ color: palette.hair }} className="ml-3">/</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spec Sheet */}
        <section className="mb-16">
          <div className="p-6 font-mono text-xs rounded-xl" style={{ border: `1px solid ${palette.hair}`, backgroundColor: palette.panelSoft }}>
            <p className="uppercase tracking-[0.3em] mb-4" style={{ color: palette.gold }}>Spec Sheet</p>
            <div className="space-y-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderTop: `1px dashed ${palette.hair}` }}>
                  <span className="flex items-center gap-2 uppercase tracking-widest" style={{ color: palette.creamMuted }}>
                    <Icon size={13} />
                    {label}
                  </span>
                  <span style={{ color: palette.cream }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signature Section */}
        <section className="mb-16 p-8 rounded-2xl text-center" style={{ border: `2px solid ${palette.gold}`, backgroundColor: palette.panel }}>
          <div className="mb-6">
            <img 
              src={SIGNATURE} 
              alt="Dheeraj Gaur Signature" 
              className="h-16 md:h-20 mx-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="font-serif text-xl md:text-2xl mb-4" style={{ color: palette.cream }}>
            "Building the future of fashion, one line of code at a time."
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: palette.goldLight }}>
            Dheeraj Gaur · Founder & Lead Developer
          </p>
        </section>

        {/* Contact Section */}
        <section className="p-8 rounded-2xl text-center" style={{ border: `1px solid ${palette.gold}`, backgroundColor: palette.panel }}>
          <h2 className="font-serif text-2xl md:text-3xl mb-2" style={{ color: palette.cream }}>Get in Touch</h2>
          <p className="font-sans text-sm mb-6" style={{ color: palette.creamMuted }}>
            Interested in collaborating or have a question? Reach out below.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {socials.map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} className="flex items-center gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-widest transition-all hover:scale-105 rounded-lg" style={{ border: `1px solid ${palette.hair}`, color: palette.cream, backgroundColor: palette.panelSoft }}>
                <Icon size={16} style={{ color: palette.gold }} />
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-14 pt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em]" style={{ borderTop: `1px solid ${palette.hair}`, color: palette.creamMuted }}>
          Est. 2026 · Aligarh, Uttar Pradesh, India
        </div>
      </div>
    </div>
  );
}