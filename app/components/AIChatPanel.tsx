'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [recipes, setRecipes] = useState<Array<{ id: string; title: string }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Only render on client-side and get portal root
  useEffect(() => {
    setMounted(true);
    setPortalRoot(document.body);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens and fetch recipes for linkification
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();

      // Fetch recipes to enable linkification
      fetch('/api/recipes')
        .then(res => res.json())
        .then(data => {
          if (data.recipes) {
            setRecipes(data.recipes.map((r: any) => ({ id: r.id, title: r.title })));
          }
        })
        .catch(err => console.error('Failed to fetch recipes for linkification:', err));
    }
  }, [isOpen]);

  // Helper function to linkify recipe titles in message text
  const linkifyRecipes = (text: string) => {
    if (recipes.length === 0) return [{ text }];

    // Prepare recipe titles (remove "Example: " prefix and create variations)
    const recipeVariants = recipes.flatMap(recipe => {
      const titles = [recipe.title];
      // Add version without "Example: " prefix
      if (recipe.title.startsWith('Example: ')) {
        titles.push(recipe.title.replace('Example: ', ''));
      }
      return titles.map(title => ({ id: recipe.id, title }));
    });

    // Sort by title length (longest first) to match longer titles first
    const sortedRecipes = recipeVariants.sort((a, b) => b.title.length - a.title.length);

    let parts: Array<{ text: string; recipeId?: string }> = [{ text }];

    for (const recipe of sortedRecipes) {
      const newParts: Array<{ text: string; recipeId?: string }> = [];

      for (const part of parts) {
        if (part.recipeId) {
          // Already linked, keep as is
          newParts.push(part);
          continue;
        }

        // Match recipe title with optional markdown bold (**title**)
        const escapedTitle = recipe.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\*\\*${escapedTitle}\\*\\*|\\b${escapedTitle}\\b`, 'gi');

        const matches = [...part.text.matchAll(regex)];
        if (matches.length === 0) {
          newParts.push(part);
          continue;
        }

        let lastIndex = 0;
        for (const match of matches) {
          if (match.index !== undefined) {
            // Add text before match
            if (match.index > lastIndex) {
              newParts.push({ text: part.text.slice(lastIndex, match.index) });
            }
            // Add linked recipe (preserve original formatting including **)
            newParts.push({ text: match[0], recipeId: recipe.id });
            lastIndex = match.index + match[0].length;
          }
        }
        // Add remaining text
        if (lastIndex < part.text.length) {
          newParts.push({ text: part.text.slice(lastIndex) });
        }
      }

      parts = newParts;
    }

    return parts;
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
    onClose();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Expand panel after first message
    if (!isExpanded) {
      setIsExpanded(true);
    }

    try {
      // Build conversation history for API
      const conversationMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      conversationMessages.push({
        role: 'user',
        content: userMessage.content,
      });

      // Call chat API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error && error.name === 'AbortError'
          ? "Request timed out after 30 seconds. Please try a simpler question."
          : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!mounted || !isOpen || !portalRoot) {
    console.log('AIChatPanel not rendering:', { mounted, isOpen, portalRoot: !!portalRoot });
    return null;
  }

  console.log('AIChatPanel rendering portal to:', portalRoot);

  const portalContent = (
    <>
      {/* Backdrop - only show when expanded */}
      {isExpanded && (
        <div
          className="bg-black bg-opacity-50"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999999,
          }}
        />
      )}

      {/* Chat Panel */}
      <div className="bg-white shadow-2xl flex flex-col"
        style={{
          position: 'fixed',
          left: isExpanded ? 0 : '50%',
          right: isExpanded ? 0 : 'auto',
          bottom: isExpanded ? 0 : '100px',
          height: isExpanded ? '70vh' : 'auto',
          maxHeight: isExpanded ? '600px' : 'none',
          width: isExpanded ? 'auto' : '320px',
          transform: isExpanded ? 'none' : 'translateX(-50%)',
          borderRadius: isExpanded ? '24px 24px 0 0' : '16px',
          zIndex: 1000000,
          backgroundColor: 'white',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header - only show when expanded */}
        {isExpanded && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {/* Chef's hat icon */}
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 38h24v-8H8v8zm4-16c0-5.52 4.48-10 10-10s10 4.48 10 10v4H12v-4z" fill="#f97316"/>
                <circle cx="12" cy="12" r="4" fill="#f97316"/>
                <circle cx="28" cy="12" r="4" fill="#f97316"/>
                <circle cx="20" cy="8" r="5" fill="#f97316"/>
              </svg>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Sous Chef</h2>
                <p className="text-xs text-gray-500">Here to help with meal planning</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Collapsed greeting - only show when NOT expanded */}
        {!isExpanded && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Chef's hat icon - small */}
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 38h24v-8H8v8zm4-16c0-5.52 4.48-10 10-10s10 4.48 10 10v4H12v-4z" fill="#f97316"/>
                  <circle cx="12" cy="12" r="4" fill="#f97316"/>
                  <circle cx="28" cy="12" r="4" fill="#f97316"/>
                  <circle cx="20" cy="8" r="5" fill="#f97316"/>
                </svg>
                <p className="text-sm text-gray-700 font-medium">Hi I'm your Sous Chef. How can I help?</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Messages - only show when expanded */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 opacity-50">
                <path d="M8 38h24v-8H8v8zm4-16c0-5.52 4.48-10 10-10s10 4.48 10 10v4H12v-4z" fill="#f97316"/>
                <circle cx="12" cy="12" r="4" fill="#f97316"/>
                <circle cx="28" cy="12" r="4" fill="#f97316"/>
                <circle cx="20" cy="8" r="5" fill="#f97316"/>
              </svg>
              <p className="text-sm">Hi! I'm your AI sous chef.</p>
              <p className="text-sm mt-2">Ask me anything about your meals,<br />recipes, or grocery lists.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.role === 'assistant' && recipes.length > 0
                      ? linkifyRecipes(message.content).map((part, i) =>
                          part.recipeId ? (
                            <span
                              key={i}
                              onClick={() => handleRecipeClick(part.recipeId!)}
                              className="font-semibold underline cursor-pointer hover:text-orange-600"
                            >
                              {part.text}
                            </span>
                          ) : (
                            <span key={i}>{part.text}</span>
                          )
                        )
                      : message.content}
                  </p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className={`px-6 py-4 bg-white ${isExpanded ? 'border-t border-gray-200 rounded-b-3xl' : ''}`}>
          <div className="flex items-end gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about meals, recipes, or groceries..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(portalContent, portalRoot);
}
