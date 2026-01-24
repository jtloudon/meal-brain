'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Send, Copy, Check } from 'lucide-react';

// Helper to get keyboard height from visual viewport
const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const height = Math.max(0, windowHeight - viewportHeight);
      setKeyboardHeight(height);

      // Keyboard is open if there's significant height difference
      const keyboardIsOpen = height > 50;
      setIsKeyboardOpen(keyboardIsOpen);

      // Lock/unlock scroll when keyboard opens/closes (per pwa-floating-action-bar.md)
      if (keyboardIsOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      // Cleanup: unlock scroll on unmount
      document.body.style.overflow = '';
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};

interface ApprovalAction {
  id: string;
  toolName: string;
  toolInput: any;
  preview: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  approvalActions?: ApprovalAction[]; // Changed to array
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { keyboardHeight, isKeyboardOpen } = useKeyboardHeight();

  // Only render on client-side and get portal root
  useEffect(() => {
    setMounted(true);
    setPortalRoot(document.body);

    // Clear old localStorage data
    localStorage.removeItem('ai-chat-history');

    // Check if user has switched accounts - if so, clear chat history
    const checkAndLoadHistory = async () => {
      try {
        // Get current user ID
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const prefs = await response.json();
          const currentUserId = prefs.user_id;

          // Get stored user ID from sessionStorage
          const storedUserId = sessionStorage.getItem('ai-chat-user-id');

          if (storedUserId && storedUserId !== currentUserId) {
            // User switched accounts - clear chat history
            console.log('[AI Chat] User switched accounts, clearing history');
            sessionStorage.removeItem('ai-chat-history');
            sessionStorage.setItem('ai-chat-user-id', currentUserId);
            return;
          }

          // Store current user ID if not stored
          if (!storedUserId) {
            sessionStorage.setItem('ai-chat-user-id', currentUserId);
          }

          // Load chat history from sessionStorage (clears when tab closes)
          const savedMessages = sessionStorage.getItem('ai-chat-history');
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            // Convert timestamp strings back to Date objects
            const messagesWithDates = parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(messagesWithDates);
            // Scroll to bottom after loading
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    checkAndLoadHistory();
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (mounted && messages.length > 0) {
      sessionStorage.setItem('ai-chat-history', JSON.stringify(messages));
    }
  }, [messages, mounted]);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
      }, 100);
    }
  }, [messages, isOpen]);

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

        // Match recipe title with markdown bold (**title**), quotes ("title"), or plain text
        const escapedTitle = recipe.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\*\\*${escapedTitle}\\*\\*|"${escapedTitle}"|\\b${escapedTitle}\\b`, 'gi');

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

  const handleNewChat = () => {
    // Clear chat history from sessionStorage
    sessionStorage.removeItem('ai-chat-history');
    // Clear messages state
    setMessages([]);
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBatchApproval = async (messageId: string, approved: boolean) => {
    // Find the message with approval actions
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !message.approvalActions) return;

    // Remove approval buttons immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, approvalActions: undefined }
          : msg
      )
    );

    if (!approved) {
      // User cancelled - just add a message
      const cancelMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Okay, I won\'t do that.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cancelMessage]);
      return;
    }

    setIsLoading(true);

    try {
      // Execute all approved actions
      const results = [];
      for (const action of message.approvalActions) {
        const response = await fetch('/api/chat/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            approval_id: action.id,
            approved: true,
            tool_name: action.toolName,
            tool_input: action.toolInput,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to execute ${action.preview}`);
        }

        const data = await response.json();
        results.push(data.message || 'Done!');

        // If a recipe was created, add it to recipes state for linkification
        if (action.toolName === 'recipe_create' && data.data?.recipe_id) {
          setRecipes((prev) => [
            ...prev,
            { id: data.data.recipe_id, title: action.toolInput.title },
          ]);
        }
      }

      const resultMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Success! Completed ${results.length} action${results.length > 1 ? 's' : ''}:\n\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultMessage]);

      // Refresh the page data to update calendar dots and other UI
      router.refresh();
    } catch (error) {
      console.error('Approval error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong executing those actions.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
        approvalActions: data.approval_required ? data.approval_actions : undefined,
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
      <style dangerouslySetInnerHTML={{
        __html: `
          .ai-chat-messages::-webkit-scrollbar {
            width: 10px;
          }
          .ai-chat-messages::-webkit-scrollbar-track {
            background: #f9fafb;
            border-radius: 10px;
          }
          .ai-chat-messages::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
          }
          .ai-chat-messages::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          @keyframes bounce-dot {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }
        `
      }} />
      {/* Backdrop - with blur effect */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
        }}
      />

      {/* Floating Chat Panel (rounded, inset from edges) - 50% height */}
      <div
        className="flex flex-col"
        style={{
          position: 'fixed',
          left: '12px',
          right: '12px',
          bottom: `${keyboardHeight + 20}px`,
          height: '50vh',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          zIndex: 1000000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="relative flex-shrink-0" style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#aiGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="50%" stopColor="#FF4B9E" />
                <stop offset="100%" stopColor="#9B59B6" />
              </linearGradient>
            </defs>
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
            <line x1="6" y1="17" x2="18" y2="17" />
          </svg>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Sous Chef</span>
          <div style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <button
              onClick={handleNewChat}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px 8px',
                cursor: 'pointer',
                color: 'var(--theme-primary)',
                fontSize: '13px',
                fontWeight: '500',
              }}
              aria-label="New chat"
            >
              New Chat
            </button>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                color: '#9ca3af',
              }}
              aria-label="Close chat"
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 ai-chat-messages"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#d1d5db #f9fafb',
            paddingBottom: '100px', // Extra space so messages aren't hidden behind fixed input
          }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center text-gray-500" style={{ paddingTop: '40px' }}>
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#aiGradientEmpty)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4"
              >
                <defs>
                  <linearGradient id="aiGradientEmpty" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="50%" stopColor="#FF4B9E" />
                    <stop offset="100%" stopColor="#9B59B6" />
                  </linearGradient>
                </defs>
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
              <p className="text-sm">Hi! I'm your AI sous chef.</p>
              <p className="text-sm mt-2">Ask me anything about your meals,<br />recipes, or grocery lists.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    backgroundColor: message.role === 'user' ? 'var(--theme-primary)' : '#f3f4f6',
                    color: message.role === 'user' ? '#ffffff' : '#111827',
                    boxShadow: 'none',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: message.role === 'user' ? 'rgba(255,255,255,0.5)' : '#d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Copy style={{ width: '14px', height: '14px' }} />
                    )}
                  </button>
                  <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0, paddingRight: '20px' }}>
                    {message.role === 'assistant' && recipes.length > 0
                      ? linkifyRecipes(message.content).map((part, i) =>
                          part.recipeId ? (
                            <span
                              key={i}
                              onClick={() => handleRecipeClick(part.recipeId!)}
                              className="font-bold underline cursor-pointer"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              {part.text.replace(/^\*\*|\*\*$|^"|"$/g, '')}
                            </span>
                          ) : (
                            <span key={i}>{part.text}</span>
                          )
                        )
                      : message.content}
                  </p>

                  {/* Batch Approval UI */}
                  {message.approvalActions && message.approvalActions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      {/* List of actions */}
                      <div style={{
                        backgroundColor: '#fef3c7',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '6px', color: '#92400e' }}>
                          {message.approvalActions.length} action{message.approvalActions.length > 1 ? 's' : ''} to approve:
                        </div>
                        {message.approvalActions.map((action, idx) => (
                          <div key={action.id} style={{ color: '#78350f' }}>
                            {idx + 1}. {action.preview}
                          </div>
                        ))}
                      </div>

                      {/* Approval buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleBatchApproval(message.id, true)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: 'var(--theme-primary)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          Yes, add all ✓
                        </button>
                        <button
                          onClick={() => handleBatchApproval(message.id, false)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#6b7280',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          No, thanks
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
              <div style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '16px',
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce-dot 1s infinite', animationDelay: '0ms' }} />
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce-dot 1s infinite', animationDelay: '150ms' }} />
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce-dot 1s infinite', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Fixed above keyboard, snaps instantly (no transition) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            zIndex: 1000001,
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sous Chef"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              style={{
                width: '100%',
                padding: '12px 50px 12px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '16px',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '4px',
                border: 'none',
                background: 'transparent',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                color: !input.trim() || isLoading ? '#d1d5db' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Send message"
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.color = 'var(--theme-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (input.trim() && !isLoading) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </form>
      </div>
    </>
  );

  return createPortal(portalContent, portalRoot);
}
