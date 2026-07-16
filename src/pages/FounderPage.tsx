import { Code, Heart, Mail, Linkedin, Github, Twitter, MapPin, Calendar, Award } from 'lucide-react';

export function FounderPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="card p-8 md:p-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-12">
          <div className="flex-shrink-0">
            <img
              src="/founder.jpeg"
              alt="Dheeraj Gaur - MAHIR"
              className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover shadow-xl border-4 border-brand-200 dark:border-brand-800"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Dheeraj Gaur
            </h1>
            <p className="text-xl text-brand-600 dark:text-brand-400 font-medium mb-4">
              "MAHIR"
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
              <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium">
                Founder
              </span>
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                Developer
              </span>
              <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                Visionary
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
              The creative mind behind <strong className="text-neutral-900 dark:text-white">Mahir & Friends</strong>. 
              Passionate about building exceptional digital experiences and bringing fashion to the fingertips of millions.
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
            <Heart size={24} className="text-brand-600" /> About
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Dheeraj Gaur, fondly known as <strong className="text-brand-600">MAHIR</strong>, is the founder and lead developer of Mahir & Friends. 
              With a deep passion for technology and fashion, he envisioned a platform that would make quality fashion accessible to everyone across India.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Starting from humble beginnings in Aligarh, Uttar Pradesh, Dheeraj built this e-commerce platform from scratch, 
              handling everything from backend development to frontend design. His dedication to creating a seamless shopping experience 
              has been the driving force behind the company's success.
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              When he's not coding or strategizing the next big feature, you can find him exploring new technologies, 
              mentoring aspiring developers, or spending time with family and friends.
            </p>
          </div>
        </div>

        {/* Skills & Expertise */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
            <Code size={24} className="text-brand-600" /> Skills & Expertise
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Frontend Development</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">React</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">TypeScript</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Tailwind CSS</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Next.js</span>
              </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Backend Development</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Node.js</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Express</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">MongoDB</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">REST APIs</span>
              </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">E-commerce</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Payment Integration</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Inventory Management</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Order Processing</span>
              </div>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Other Skills</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">UI/UX Design</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Database Design</span>
                <span className="px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">Cloud Deployment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
            <Award size={24} className="text-brand-600" /> Quick Facts
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <MapPin size={20} className="text-brand-600" />
              <div>
                <p className="text-sm text-neutral-500">Location</p>
                <p className="font-medium text-neutral-900 dark:text-white">Aligarh, UP, India</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Calendar size={20} className="text-brand-600" />
              <div>
                <p className="text-sm text-neutral-500">Founded</p>
                <p className="font-medium text-neutral-900 dark:text-white">2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Code size={20} className="text-brand-600" />
              <div>
                <p className="text-sm text-neutral-500">Projects</p>
                <p className="font-medium text-neutral-900 dark:text-white">Mahir & Friends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-brand-100 mb-4">Get in Touch</h2>
          <p className="text-brand-800 dark:text-brand-200 mb-6">
            Interested in collaborating or have a question? Feel free to reach out!
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:dheeraj@mahirandfriends.com" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Mail size={18} /> Email
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Linkedin size={18} /> LinkedIn
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Github size={18} /> GitHub
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Twitter size={18} /> Twitter
            </a>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-12 text-center">
          <blockquote className="text-2xl font-serif italic text-neutral-600 dark:text-neutral-400">
            "Fashion is not just about clothes, it's about expressing who you are. 
            I built Mahir & Friends to help everyone find their unique style."
          </blockquote>
          <p className="mt-4 text-brand-600 font-medium">— Dheeraj Gaur (MAHIR)</p>
        </div>
      </div>
    </div>
  );
}
