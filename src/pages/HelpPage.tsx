import { useState } from 'react';
import { Mail, Phone, MessageCircle, Clock, MapPin, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../lib/toast';

export function HelpPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "How do I track my order?",
      answer: "You can track your order by visiting the 'Track Order' page and entering your order number. You'll receive real-time updates on your order status, including when it's been shipped, out for delivery, and delivered."
    },
    {
      id: 2,
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for most items. Products must be unworn, unwashed, and in original packaging with tags attached. To initiate a return, visit the 'Returns & Refunds' page or contact our customer support."
    },
    {
      id: 3,
      question: "How long does delivery take?",
      answer: "Standard delivery takes 3-5 business days for most locations. Express delivery is available for select areas and takes 1-2 business days. Delivery times may vary during peak seasons or holidays."
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, UPI payments, net banking, and cash on delivery for select locations."
    },
    {
      id: 5,
      question: "How do I become a delivery partner?",
      answer: "To become a delivery partner, visit our 'Become a Delivery Partner' page and complete the registration process. You'll need to provide your personal details, KYC documents, vehicle information, and bank details. After approval, you can start accepting orders."
    },
    {
      id: 6,
      question: "Can I cancel my order after placing it?",
      answer: "Orders can be cancelled within 1 hour of placement if they haven't been processed yet. Once an order is shipped, it cannot be cancelled but can be returned according to our return policy."
    },
    {
      id: 7,
      question: "How do I contact customer support?",
      answer: "You can reach our customer support team via email at replybymahirandfriends@gmail.com, phone at +91 6397684456, or through the contact form on this page. Our support team is available Monday-Saturday, 9AM-8PM IST."
    },
    {
      id: 8,
      question: "Do you offer international shipping?",
      answer: "Currently, we only ship within India. We're working on expanding our shipping capabilities to international locations in the future."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        showToast('Message sent successfully!', 'success');
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      showToast('Error sending message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Help Center</h1>
        <p className="text-neutral-600 dark:text-neutral-400">We're here to help you with any questions or concerns.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-6">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageCircle size={20} className="text-brand-600" /> Contact Us
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-neutral-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Email</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">replybymahirandfriends@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-neutral-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Phone</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">+91 6397684456</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-neutral-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Address</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Aligarh, Uttar Pradesh, India - 202001</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-neutral-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Working Hours</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Mon-Sat: 9AM - 8PM IST</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Send us a Message</h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-green-600" />
              </div>
              <p className="text-green-600 font-medium">Message sent successfully!</p>
              <p className="text-sm text-neutral-500 mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input w-full"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input w-full min-h-[120px]"
                  placeholder="Describe your issue..."
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Quick Links</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/track-order" className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 dark:text-brand-300 font-bold">📦</span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Track Order</p>
              <p className="text-xs text-neutral-500">Check your order status</p>
            </div>
          </a>
          <a href="/returns" className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 dark:text-brand-300 font-bold">↩️</span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Returns & Refunds</p>
              <p className="text-xs text-neutral-500">Return policy info</p>
            </div>
          </a>
          <a href="/shipping" className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 dark:text-brand-300 font-bold">🚚</span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Shipping Info</p>
              <p className="text-xs text-neutral-500">Delivery details</p>
            </div>
          </a>
          <a href="/size-guide" className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 dark:text-brand-300 font-bold">📏</span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Size Guide</p>
              <p className="text-xs text-neutral-500">Find your perfect fit</p>
            </div>
          </a>
          <a href="/faq" className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center">
              <span className="text-brand-600 dark:text-brand-300 font-bold">❓</span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">FAQs</p>
              <p className="text-xs text-neutral-500">Common questions</p>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <span className="font-medium text-neutral-900 dark:text-white">{faq.question}</span>
                {expandedFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedFaq === faq.id && (
                <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
