import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Plus,
    Trash2,
    Send,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    User,
    Brain,
    Loader2,
    Menu,
    X,
    ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: number;
    conversation_id: string;
    role: 'user' | 'model';
    content: string;
    created_at: string;
}

const API_URL = 'http://localhost:8000';

export const ChatPage: React.FC = () => {
    const { token, user } = useAuth();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');

    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [copiedId, setCopiedId] = useState<number | string | null>(null);

    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Refs
    const messageEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Quick action suggestions
    const suggestions = [
        { title: "Explain recursion", desc: "Explain it in programming with a simple analogy.", prompt: "Explain recursion in programming using a simple real-world analogy." },
        { title: "CSS Grid vs Flexbox", desc: "When should I use flexbox vs CSS grid layouts?", prompt: "Give me a quick guide comparing when to use CSS Flexbox versus CSS Grid with code examples." },
        { title: "React useEffect Guide", desc: "Best practices for cleanup and dependencies.", prompt: "Provide a quick cheat sheet for React useEffect best practices, detailing cleanups and dependency arrays." },
    ];

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const res = await fetch(`${API_URL}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error("Failed to load chats:", err);
        } finally {
            setIsLoadingList(false);
        }
    };

    // Fetch message history for selected chat
    const fetchMessageHistory = async (convId: string) => {
        setIsLoadingHistory(true);
        setMessages([]);
        try {
            const res = await fetch(`${API_URL}/chat/conversations/${convId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to load message history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load chats on load
    useEffect(() => {
        if (token) {
            fetchConversations();
        }
    }, [token]);

    // Load chat messages when active conversation changes
    useEffect(() => {
        if (activeConvId && token) {
            fetchMessageHistory(activeConvId);
        } else {
            setMessages([]);
        }
    }, [activeConvId, token]);

    // Scroll to bottom when messages list or stream content changes
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, streamedText, isStreaming]);

    // Auto-resize input textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
    }, [inputValue]);

    // Create new conversation
    const handleNewConversation = async () => {
        try {
            const res = await fetch(`${API_URL}/chat/conversations`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(prev => [data, ...prev]);
                setActiveConvId(data.id);
                setMobileSidebarOpen(false);
            }
        } catch (err) {
            console.error("Failed to create conversation:", err);
        }
    };

    // Delete conversation
    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this chat?")) return;
        try {
            const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== id));
                if (activeConvId === id) {
                    setActiveConvId(null);
                }
            }
        } catch (err) {
            console.error("Failed to delete conversation:", err);
        }
    };

    // Handle stream reader from backend response body
    const processStreamReader = async (response: Response) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        setStreamedText('');
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || ''; // Leave incomplete line in buffer

                for (const part of parts) {
                    const line = part.trim();
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                setStreamedText(prev => prev + data.text);
                            } else if (data.error) {
                                console.error("Stream Error:", data.error);
                                setStreamedText(prev => prev + `\n\n*[${data.error}]*`);
                            }
                        } catch (jsonErr) {
                            console.error("JSON parsing error on chunk:", line, jsonErr);
                        }
                    }
                }
            }
        } catch (streamErr) {
            console.error("Error reading stream:", streamErr);
        } finally {
            setIsStreaming(false);
            // Reload history to bring local messages from DB
            if (activeConvId) {
                fetchMessageHistory(activeConvId);
                fetchConversations(); // Update sidebars with modified title
            }
        }
    };

    // Submit message
    const handleSendMessage = async (textToSend?: string) => {
        const content = textToSend || inputValue;
        if (!content.trim() || isStreaming) return;

        let currentConvId = activeConvId;

        // Create a conversation if none exists
        if (!currentConvId) {
            try {
                const res = await fetch(`${API_URL}/chat/conversations`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setConversations(prev => [data, ...prev]);
                    currentConvId = data.id;
                    setActiveConvId(data.id);
                } else {
                    return;
                }
            } catch (err) {
                console.error("Failed to auto-create conversation:", err);
                return;
            }
        }

        // Set local optimistic message
        const tempUserMsg: Message = {
            id: Date.now(),
            conversation_id: currentConvId,
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setInputValue('');
        setIsStreaming(true);

        try {
            const response = await fetch(`${API_URL}/chat/conversations/${currentConvId}/message/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: content })
            });

            if (!response.ok) {
                throw new Error("Failed to send message to stream");
            }

            await processStreamReader(response);

        } catch (err) {
            console.error(err);
            setIsStreaming(false);
        }
    };

    // Regenerate last AI response
    const handleRegenerate = async () => {
        if (!activeConvId || isStreaming) return;
        setIsStreaming(true);
        setStreamedText('');

        try {
            const response = await fetch(`${API_URL}/chat/conversations/${activeConvId}/regenerate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to start response regeneration");
            }

            // Optimistically remove last assistant message from display
            setMessages(prev => {
                const copy = [...prev];
                if (copy.length > 0 && copy[copy.length - 1].role === 'model') {
                    copy.pop();
                }
                return copy;
            });

            await processStreamReader(response);

        } catch (err) {
            console.error(err);
            setIsStreaming(false);
            // Restore message state by reloading history
            fetchMessageHistory(activeConvId);
        }
    };

    // Copy response content to clipboard
    const handleCopyText = (content: string, id: number | string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Textarea input enter key submission
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="relative flex w-full overflow-hidden border border-slate-200/40 dark:border-white/5 rounded-2xl glass-effect h-full">

            {/* Mobile Drawer Trigger Bar */}
            <div className="absolute top-2.5 left-2.5 z-20 lg:hidden">
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-100/90 dark:hover:bg-zinc-800"
                >
                    {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* 1. Chat History Sidebar */}
            <aside className={`absolute inset-y-0 left-0 z-10 flex flex-col w-64 border-r border-slate-200/50 dark:border-white/5 bg-slate-50/90 dark:bg-zinc-950/70 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        Conversations
                    </span>
                    <button
                        onClick={handleNewConversation}
                        className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 border border-slate-200/50 dark:border-white/10 text-brand-500 hover:text-brand-600 transition-colors cursor-pointer"
                        title="New Conversation"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Conversation List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingList ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center p-6 text-xs text-slate-400 dark:text-zinc-500">
                            No chats yet. Start a new one!
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = activeConvId === conv.id;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConvId(conv.id);
                                        setMobileSidebarOpen(false);
                                    }}
                                    className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${isActive
                                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/35 border border-transparent'
                                        }`}
                                >
                                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                                    <span className="truncate pr-6 select-none flex-1 font-sans">{conv.title}</span>

                                    {/* Delete button (hidden by default, visible on hover) */}
                                    <button
                                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                                        title="Delete Chat"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* 2. Main Chat Panel */}
            <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">

                {/* Messages Feed Viewport */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    <AnimatePresence mode="popLayout">

                        {/* Case: Welcome screen on empty chat */}
                        {!activeConvId || (messages.length === 0 && !isStreaming) ? (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="flex flex-col items-center justify-center min-h-full max-w-xl mx-auto text-center px-4"
                            >
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 mb-5">
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                </div>
                                <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-650 dark:from-white dark:via-brand-400 dark:to-indigo-350 bg-clip-text text-transparent">
                                    SecondMind AI Chat
                                </h2>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                                    Ask questions, compose text, or brainstorm ideas. Backed by Gemini 1.5 Flash.
                                </p>

                                {/* Suggestions Grid */}
                                <div className="grid grid-cols-1 gap-3 w-full mt-8">
                                    {suggestions.map((s) => (
                                        <GlassCard
                                            key={s.title}
                                            hoverEffect
                                            className="p-4 cursor-pointer text-left flex justify-between items-center group border-slate-200/40 dark:border-white/5"
                                            onClick={() => handleSendMessage(s.prompt)}
                                        >
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                                                    {s.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal">
                                                    {s.desc}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                        </GlassCard>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (

                            /* Message Bubbles list */
                            <div className="space-y-6 max-w-3xl mx-auto w-full pb-8">
                                {isLoadingHistory && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                                    </div>
                                )}

                                {messages.map((msg) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {/* Left Avatar for Model */}
                                            {!isUser && (
                                                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-semibold text-brand-500 shadow-sm">
                                                    <Brain className="w-4.5 h-4.5" />
                                                </div>
                                            )}

                                            {/* Message Content Container */}
                                            <div className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm border shadow-sm ${isUser
                                                ? 'bg-brand-500/10 text-slate-800 dark:text-zinc-100 border-brand-500/20'
                                                : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/40 dark:border-white/5'
                                                }`}>

                                                {/* Markdown / Plain Text renderer */}
                                                {isUser ? (
                                                    <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>
                                                ) : (
                                                    <div className="markdown-body">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                code({ node, inline, className, children, ...props }) {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    return !inline && match ? (
                                                                        <SyntaxHighlighter
                                                                            style={oneDark}
                                                                            language={match[1]}
                                                                            PreTag="div"
                                                                            className="rounded-lg my-2 text-xs border border-slate-200/10"
                                                                            {...props}
                                                                        >
                                                                            {String(children).replace(/\n$/, '')}
                                                                        </SyntaxHighlighter>
                                                                    ) : (
                                                                        <code className="bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs text-brand-500 dark:text-brand-400 font-mono" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                }
                                                            }}
                                                            className="prose dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed text-slate-800 dark:text-zinc-200"
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* Hover Utility toolbar */}
                                                <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur border border-slate-200/40 dark:border-white/5`}>
                                                    <button
                                                        onClick={() => handleCopyText(msg.content, msg.id)}
                                                        className="p-1 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                                                        title="Copy Response"
                                                    >
                                                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Right Avatar for User */}
                                            {isUser && (
                                                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-zinc-800 flex items-center justify-center font-display font-semibold text-slate-700 dark:text-zinc-300 border border-slate-300/20 dark:border-zinc-700/30">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {/* Simulated Stream Block (optimistic update) */}
                                {isStreaming && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4 justify-start"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                                            <Brain className="w-4.5 h-4.5 animate-pulse" />
                                        </div>

                                        <div className="relative max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm bg-white/40 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 shadow-sm text-slate-800 dark:text-zinc-200">
                                            {streamedText ? (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code({ node, inline, className, children, ...props }) {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            return !inline && match ? (
                                                                <SyntaxHighlighter
                                                                    style={oneDark}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    className="rounded-lg my-2 text-xs border border-slate-200/10"
                                                                    {...props}
                                                                >
                                                                    {String(children).replace(/\n$/, '')}
                                                                </SyntaxHighlighter>
                                                            ) : (
                                                                <code className="bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs text-brand-500 dark:text-brand-400 font-mono" {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        }
                                                    }}
                                                    className="prose dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed"
                                                >
                                                    {streamedText}
                                                </ReactMarkdown>
                                            ) : (
                                                <div className="flex items-center gap-2 py-1 text-slate-400 dark:text-zinc-500">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                                                    <span>Gemini is thinking...</span>
                                                </div>
                                            )}

                                            {/* Blinking cursor at the end of streaming text */}
                                            {streamedText && (
                                                <span className="inline-block w-1.5 h-3.5 ml-1 bg-brand-500 animate-pulse rounded-sm" />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                    <div ref={messageEndRef} />
                </div>

                {/* 3. Input Text Bar Form */}
                <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-zinc-950/20">
                    <div className="max-w-3xl mx-auto relative">

                        {/* Input Wrapper Card */}
                        <div className="flex items-end gap-2 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/5 focus-within:border-brand-500/50 dark:focus-within:border-brand-400/50 shadow-sm transition-all relative">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={activeConvId ? "Message Gemini..." : "Start a new chat..."}
                                rows={1}
                                disabled={isStreaming}
                                className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-slate-800 dark:text-zinc-100 resize-none py-2 px-3 focus:outline-none min-h-[38px] max-h-[180px] leading-relaxed disabled:opacity-50"
                            />

                            {/* Actions side pane inside textbox */}
                            <div className="flex items-center gap-1.5 pb-1 pr-1">
                                {/* Regeneration trigger (only if chat has model messages) */}
                                {activeConvId && messages.length > 0 && messages.some(m => m.role === 'model') && (
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isStreaming}
                                        className="p-2 rounded-xl text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-30 cursor-pointer"
                                        title="Regenerate Last Response"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Submit button */}
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isStreaming}
                                    className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-zinc-800/80 disabled:text-slate-400 dark:disabled:text-zinc-600 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all cursor-pointer"
                                    title="Send Message"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Sub-label Model metadata indicator */}
                        <div className="flex items-center justify-between px-3 mt-1.5 text-[9px] text-slate-400 dark:text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Gemini 1.5 Flash API</span>
                            </div>
                            <span>Press Enter to send, Shift+Enter for new line</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};
