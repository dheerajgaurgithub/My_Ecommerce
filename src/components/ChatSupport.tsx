import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2, User, Bot } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

interface ChatMessage {
  _id?: string;
  sender: 'user' | 'agent' | 'bot';
  message: string;
  timestamp: Date;
  senderName?: string;
}

export function ChatSupport() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      message: inputMessage,
      timestamp: new Date(),
      senderName: user?.name || 'You'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/chat/send', {
        message: userMessage.message
      });

      if (response.success) {
        // Add agent response
        const agentMessage: ChatMessage = {
          _id: response.messageId,
          sender: response.sender === 'bot' ? 'bot' : 'agent',
          message: response.message,
          timestamp: new Date(),
          senderName: response.senderName || 'Support Agent'
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback to bot response
      setTimeout(() => {
        const botMessage: ChatMessage = {
          sender: 'bot',
          message: getBotResponse(userMessage.message),
          timestamp: new Date(),
          senderName: 'Mahir & Friends Bot'
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order') || lowerMessage.includes('delivery')) {
      return 'You can track your order status in the "Track Order" section. If you need specific help with your order, please provide your order number.';
    } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return 'Our return policy allows returns within 30 days of delivery. You can initiate a return from your account under "Order History".';
    } else if (lowerMessage.includes('payment')) {
      return 'We accept all major credit cards, UPI, net banking, and cash on delivery. For payment issues, please contact our support team.';
    } else if (lowerMessage.includes('size') || lowerMessage.includes('fit')) {
      return 'You can find our detailed size guide in the "Size Guide" section. If you need specific measurements, please let us know which product you\'re interested in.';
    } else if (lowerMessage.includes('stock') || lowerMessage.includes('available')) {
      return 'Product availability is shown on each product page. If a product is out of stock, you can sign up for restock notifications.';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! Welcome to Mahir & Friends support. How can I help you today?';
    } else if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    } else {
      return 'Thank you for your message. Our support team will get back to you shortly. For immediate assistance, you can also call us at +91-XXXXXXXXXX or email support@mahirandfriends.com';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        className="fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 z-50"
        title="Chat with us"
      >
        <div className="relative">
          <MessageSquare size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl z-50 transition-all ${
      isMinimized ? 'w-80' : 'w-96 h-[500px]'
    }`}>
      {/* Header */}
      <div className="bg-brand-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Customer Support</h3>
            <p className="text-xs text-white/80">Typically replies in minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded"
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[380px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot size={32} className="text-brand-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Welcome to Support</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  How can we help you today? Ask about orders, returns, payments, or anything else.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'bot' ? 'bg-brand-100 dark:bg-brand-900' : 'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    {msg.sender === 'bot' ? (
                      <Bot size={16} className="text-brand-600" />
                    ) : (
                      <User size={16} className="text-purple-600" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-neutral-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-brand-600" />
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
