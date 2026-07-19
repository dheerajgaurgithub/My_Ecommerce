import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-neutral-900 dark:bg-black text-neutral-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-8">
        <div>
          <h4 className="font-serif text-lg font-semibold text-white mb-4">MAHIR & FRIENDS</h4>
          <p className="text-sm text-neutral-400 mb-4">Everything You Need, Delivered Today. Premium fashion for the modern individual.</p>
          <div className="flex gap-3 mb-4">
            <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-600 flex items-center justify-center transition-colors"><Instagram size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-600 flex items-center justify-center transition-colors"><Facebook size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-600 flex items-center justify-center transition-colors"><Twitter size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-600 flex items-center justify-center transition-colors"><Youtube size={16} /></a>
          </div>
          <Link to="/founder" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">Meet the Founder</Link>
        </div>
        <div>
          <h4 className="font-medium text-white mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop?category=men" className="hover:text-white transition-colors">Men</Link></li>
            <li><Link to="/shop?category=women" className="hover:text-white transition-colors">Women</Link></li>
            <li><Link to="/shop?category=kids" className="hover:text-white transition-colors">Kids</Link></li>
            <li><Link to="/shop?category=footwear" className="hover:text-white transition-colors">Footwear</Link></li>
            <li><Link to="/shop?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-white mb-4">Help</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link to="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
            <li><Link to="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
            <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-white mb-4">Partner With Us</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://deliverypartnermahirandfriends.vercel.app/register" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Become a Delivery Partner</a></li>
            <li><a href="https://deliverypartnermahirandfriends.vercel.app/login" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Delivery Partner Login</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 flex-shrink-0" /> Aligarh, Uttar Pradesh, India - 202001</li>
            <li className="flex items-center gap-2"><Phone size={16} /> +91 6397684456</li>
            <li className="flex items-center gap-2"><Mail size={16} /> replybymahirandfriends@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-400">&copy; 2026 MAHIR & FRIENDS. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-neutral-400">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
