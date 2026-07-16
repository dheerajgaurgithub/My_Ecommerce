import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Orders & Payments',
    question: 'How do I place an order?',
    answer: 'Browse our products, select your size and color, add to cart, and proceed to checkout. You can pay via credit/debit card, UPI, net banking, or cash on delivery (COD).'
  },
  {
    category: 'Orders & Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards, UPI, net banking, wallets (Paytm, PhonePe, GPay), and cash on delivery for orders below ₹10,000.'
  },
  {
    category: 'Orders & Payments',
    question: 'Is COD available?',
    answer: 'Yes, COD is available for orders below ₹10,000. For orders above ₹10,000, pre-payment is required.'
  },
  {
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer: 'Metro cities: 2-3 business days. Tier 2 cities: 3-5 business days. Other areas: 5-7 business days. Delivery times may vary during peak seasons.'
  },
  {
    category: 'Shipping & Delivery',
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free shipping on all orders above ₹999. For orders below ₹999, a nominal shipping charge of ₹49 applies.'
  },
  {
    category: 'Shipping & Delivery',
    question: 'Can I track my order?',
    answer: 'Absolutely! You can track your order using the tracking link sent via SMS and email, or visit our Track Order page and enter your order number.'
  },
  {
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy. Items must be unworn, unwashed, and in original condition with tags attached. Returns are free for defective products.'
  },
  {
    category: 'Returns & Refunds',
    question: 'How do I initiate a return?',
    answer: 'Go to your Orders section, select the order you want to return, click "Return Item", choose the reason, and schedule a pickup. Our courier will collect the item from your address.'
  },
  {
    category: 'Returns & Refunds',
    question: 'How long does refund take?',
    answer: 'Refunds are processed within 5-7 business days after we receive and inspect your return. The amount is credited to your original payment method.'
  },
  {
    category: 'Product & Sizing',
    question: 'How do I find my size?',
    answer: "Check our Size Guide page for detailed measurements. If you're between sizes, we recommend ordering the larger size for comfort."
  },
  {
    category: 'Product & Sizing',
    question: 'Are the products authentic?',
    answer: 'Yes, all our products are 100% authentic and sourced directly from brands or authorized distributors. We guarantee quality and authenticity.'
  },
  {
    category: 'Product & Sizing',
    question: 'What if the product is defective?',
    answer: 'If you receive a defective product, contact us within 48 hours of delivery. We will arrange a free replacement or full refund, including shipping costs.'
  },
  {
    category: 'Account & Security',
    question: 'Do I need to create an account to shop?',
    answer: "No, you can shop as a guest. However, creating an account allows you to track orders, save addresses, view order history, and get exclusive offers."
  },
  {
    category: 'Account & Security',
    question: 'Is my payment information secure?',
    answer: 'Absolutely! We use industry-standard SSL encryption and secure payment gateways. We never store your card details on our servers.'
  },
  {
    category: 'Account & Security',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send you a password reset link. Follow the instructions to create a new password.'
  }
];

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];
  const filteredFAQs = selectedCategory === 'All' ? faqs : faqs.filter(f => f.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Find answers to common questions about shopping with us</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredFAQs.map((faq, index) => (
          <div key={index} className="card overflow-hidden">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={20} className="text-brand-600 flex-shrink-0" />
                <span className="font-medium text-neutral-900 dark:text-white">{faq.question}</span>
              </div>
              {openIndex === index ? <ChevronUp size={20} className="text-neutral-500" /> : <ChevronDown size={20} className="text-neutral-500" />}
            </button>
            {openIndex === index && (
              <div className="px-5 pb-5 pt-0 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-neutral-600 dark:text-neutral-400 pl-8">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 card p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
        <h2 className="font-semibold text-xl text-brand-900 dark:text-brand-100 mb-4 flex items-center gap-2">
          <HelpCircle size={24} /> Still have questions?
        </h2>
        <p className="text-brand-800 dark:text-brand-200 mb-4">
          Can't find the answer you're looking for? Our customer support team is here to help.
        </p>
        <a href="/help" className="btn-primary inline-flex items-center gap-2">
          Contact Support
        </a>
      </div>
    </div>
  );
}
