import { useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../providers/supabase/supabase';
import { WhatsAppMessage } from './types';
import { Send, Phone, MoreVertical, Paperclip, User, X, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ChatWindowProps {
    contactId: number | null;
}

export function ChatWindow({ contactId }: ChatWindowProps) {
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');

    // Fetch Messages
    const { data: messages } = useQuery({
        // Versioned query key to force cache bust (fixes stale inbound/outbound status)
        queryKey: ['whatsapp_messages_v2', contactId],
        queryFn: async () => {
            if (!contactId) return [];

            const { data, error } = await supabase
                .from('whatsapp_messages')
                .select('*')
                .eq('contact_id', contactId)
                .order('created_at', { ascending: true }); // Oldest top, newest bottom

            if (error) throw error;

            // DEBUG: Log message directions
            console.log('📨 Messages loaded for contact', contactId);
            console.log('Total messages:', data?.length);
            console.log('Sample messages:', data?.slice(0, 5).map(m => ({
                id: m.id,
                direction: m.direction,
                sender: m.sender_phone,
                receiver: m.receiver_phone,
                content: m.content?.substring(0, 30)
            })));

            return data as WhatsAppMessage[];
        },
        enabled: !!contactId,
    });

    // Fetch Contact Details & Tags
    const { data: contactDetails } = useQuery({
        queryKey: ['contact_details', contactId],
        queryFn: async () => {
            if (!contactId) return null;
            const { data, error } = await supabase
                .from('contacts')
                .select('first_name, last_name, status, contracts(status), metadata, avatar')
                .eq('id', contactId)
                .single();

            if (error) return null;
            return data;
        },
        enabled: !!contactId
    });

    // Derived Tags
    const contractStatus = contactDetails?.contracts?.[0]?.status || 'No Contract';
    const clientStatus = contactDetails?.status || 'Unknown';
    const isGroup = contactDetails?.metadata?.['is_group'] === true;
    const participants = contactDetails?.metadata?.['participants'] as any[] || [];

    const getSenderName = (phone: string) => {
        if (!isGroup) return null;
        const p = participants.find((p: any) => p.id?.includes(phone.replace('+', '')));
        return p?.name || p?.id || phone;
    };

    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            // Force darker colors for better contrast on white background
            // by keeping values lower (e.g. 0-200 instead of 0-255)
            // Actually, WhatsApp uses a predefined palette, but hashing is easier.
            // Let's ensure standard hex.
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    };

    // Helper to delete draft
    const handleDeleteDraft = async (messageId: string) => {
        const { error } = await supabase.from('whatsapp_messages').delete().eq('id', messageId);
        if (error) {
            console.error("Failed to delete draft:", error);
        } else {
            // Invalidate to refresh UI
            queryClient.invalidateQueries({ queryKey: ['whatsapp_messages_v2', contactId] });
        }
    };

    // Sub to Realtime
    useEffect(() => {
        if (!contactId) return;

        const channel = supabase
            .channel(`chat:${contactId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: `contact_id=eq.${contactId}`,
                },
                (payload) => {
                    // Simple invalidation is more robust than manual cache patching
                    queryClient.invalidateQueries({ queryKey: ['whatsapp_messages_v2', contactId] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: `contact_id=eq.${contactId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['whatsapp_messages_v2', contactId] });
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [contactId, queryClient]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Helper for Timestamp Formatting
    const formatMessageTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) return timeStr;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        if (isYesterday) return `Yesterday ${timeStr}`;

        // Check if within last 6 days for Day Name
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            return `${date.toLocaleDateString([], { weekday: 'short' })} ${timeStr}`;
        }

        return `${date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })} ${timeStr}`;
    };

    if (!contactId) {
        return (
            <div className="w-2/3 h-full bg-[#f0f2f5] border-b-[6px] border-green-500 flex items-center justify-center flex-col text-center p-10">
                <div className="w-64 h-64 bg-gray-200 rounded-full mb-8 flex items-center justify-center">
                    {/* Placeholder illustration */}
                    <span className="text-4xl">👋</span>
                </div>
                <h1 className="text-3xl font-light text-gray-700 mb-4">Atomic CRM WhatsApp</h1>
                <p className="text-gray-500">Send and receive messages without keeping your phone online.</p>
            </div>
        );
    }

    return (
        <div className="w-2/3 flex flex-col h-full bg-[#efeae2]">
            {/* Header */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center px-4">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                        <User className="h-full w-full p-2 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-gray-800">
                                {contactDetails ? `${contactDetails.first_name} ${contactDetails.last_name}` : `Contact ${contactId}`}
                            </h2>
                            {/* Tags */}
                            <div className="flex gap-1 text-[10px] font-medium">
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                    Client: {clientStatus}
                                </span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded",
                                    contractStatus === 'Active' || contractStatus === 'Open' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                )}>
                                    Contract: {contractStatus}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">Online</span>
                    </div>
                </div>
                <div className="flex gap-4 text-gray-500">
                    <Phone className="cursor-pointer" />
                    <MoreVertical className="cursor-pointer" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" ref={scrollRef}>
                {/* Background Pattern could be added here via CSS */}
                {messages?.map((msg) => {
                    // ROBUST DIRECTION CHECK: 
                    // Use database direction OR check if sender is our number
                    const ownNumber = '+447701046898';
                    const isOutbound = msg.direction === 'outbound' || msg.sender_phone === ownNumber;

                    return (
                        <div
                            key={msg.id}
                            className="flex mb-1"
                        >
                            {msg.status === 'draft' ? (
                                <div className="max-w-[70%] bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm relative">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-medium text-amber-800">Draft</span>
                                        <button
                                            onClick={() => handleDeleteDraft(msg.id)}
                                            className="text-amber-400 hover:text-amber-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                                    <button
                                        onClick={() => setNewMessage(msg.content)}
                                        className="mt-2 text-xs text-amber-600 hover:text-amber-800 font-medium"
                                    >
                                        Edit Draft
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "max-w-[60%] rounded-lg p-2 px-3 shadow-sm text-sm relative",
                                        isOutbound
                                            ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none"
                                            : "bg-white text-gray-900 rounded-tl-none"
                                    )}
                                    style={{
                                        marginLeft: isOutbound ? 'auto' : '0',
                                        marginRight: isOutbound ? '0' : 'auto'
                                    }}
                                >
                                    {!isOutbound && isGroup && (
                                        <p
                                            className="text-[10px] font-bold mb-0.5"
                                            style={{ color: stringToColor(msg.sender_phone || '') }}
                                        >
                                            {getSenderName(msg.sender_phone)}
                                        </p>
                                    )}
                                    {(() => {
                                        const content = msg.content || '';
                                        if (content.startsWith('[Image]') && content.includes('http')) {
                                            const url = content.replace('[Image]', '').trim();
                                            return (
                                                <div className="mb-1">
                                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={url}
                                                            alt="Image"
                                                            className="rounded-lg max-h-60 object-cover hover:opacity-90"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </a>
                                                    {/* Fallback text if image fails or just as generic label? No. */}
                                                </div>
                                            );
                                        }
                                        if (content.startsWith('[Video]') && content.includes('http')) {
                                            const url = content.replace('[Video]', '').trim();
                                            return (
                                                <div className="mb-1">
                                                    <video controls className="max-h-60 rounded-lg max-w-full">
                                                        <source src={url} />
                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View Video</a>
                                                    </video>
                                                </div>
                                            );
                                        }
                                        if (content.startsWith('[Contact Card]')) {
                                            const parts = content.replace('[Contact Card]', '').trim();
                                            const urlMatch = parts.match(/https?:\/\/[^\s]+/);
                                            const url = urlMatch ? urlMatch[0] : '';
                                            const fileName = parts.replace(url, '').trim() || 'Contact Card';

                                            if (url) {
                                                return (
                                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-[250px] mb-1 hover:bg-gray-100 transition-colors">
                                                        <User className="text-blue-500 w-6 h-6 shrink-0" />
                                                        <div className="flex-1 overflow-hidden min-w-0">
                                                            <p className="text-sm font-medium truncate text-gray-800" title={fileName}>{fileName}</p>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-0.5">
                                                                Download Contact
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                        if (content.startsWith('[Document]')) {
                                            const parts = content.replace('[Document]', '').trim();
                                            const urlMatch = parts.match(/https?:\/\/[^\s]+/);
                                            const url = urlMatch ? urlMatch[0] : '';
                                            const fileName = parts.replace(url, '').trim() || 'Document';

                                            if (url) {
                                                return (
                                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-[250px] mb-1 hover:bg-gray-100 transition-colors">
                                                        <FileText className="text-red-500 w-6 h-6 shrink-0" />
                                                        <div className="flex-1 overflow-hidden min-w-0">
                                                            <p className="text-sm font-medium truncate text-gray-800" title={fileName}>{fileName}</p>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-0.5">
                                                                Download PDF
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                        return <p className="whitespace-pre-wrap">{msg.content}</p>;
                                    })()}
                                    <div className="flex justify-end items-center mt-1 space-x-1">
                                        <span className="text-[10px] text-gray-500">
                                            {formatMessageTime(msg.created_at)}
                                        </span>
                                        {isOutbound && (
                                            <span className={`text-[10px] ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {msg.status === 'sent' ? '✓' : '✓✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
                <Paperclip className="text-gray-500 cursor-pointer" />
                <input
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 p-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                    onClick={async () => {
                        if (!newMessage.trim() || !contactId) return;

                        const messageContent = newMessage;
                        setNewMessage('');

                        try {
                            const res = await fetch('/api/whatsapp/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ contact_id: contactId, content: messageContent })
                            });

                            if (!res.ok) {
                                const errorText = await res.text();
                                console.error('Failed to send:', res.status, res.statusText, errorText);
                                setNewMessage(messageContent);
                            } else {
                                console.log('Message sent successfully');
                            }
                        } catch (err) {
                            console.error('Send error:', err);
                            setNewMessage(messageContent);
                        }
                    }}
                    className="p-2 bg-green-500 rounded-full text-white hover:bg-green-600">
                    <Send className="h-5 w-5 pl-0.5" />
                </button>
            </div>
        </div >
    );
}
