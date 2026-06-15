import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../providers/supabase/supabase';
import { WhatsAppContact } from './types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Search, User } from 'lucide-react';

interface ChatSidebarProps {
    onSelectContact: (contactId: number) => void;
    activeContactId: number | null;
}

export function ChatSidebar({ onSelectContact, activeContactId }: ChatSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data: contacts, isLoading } = useQuery({
        queryKey: ['whatsapp_contacts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('whatsapp_messages')
                .select('contact_id, content, created_at, contacts(first_name, last_name, phone_1_number, avatar, metadata)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const uniqueContacts = new Map<number, WhatsAppContact>();

            data?.forEach((msg: any) => {
                if (msg.contact_id && !uniqueContacts.has(msg.contact_id)) {
                    let name = msg.sender_phone;
                    let avatarUrl = undefined;

                    if (msg.contacts) {
                        const { first_name, last_name, avatar, metadata } = msg.contacts;
                        if (metadata?.is_group && first_name) {
                            name = first_name;
                        } else {
                            name = `${first_name || ''} ${last_name || ''}`.trim();
                        }
                        if (avatar?.url) {
                            avatarUrl = avatar.url;
                        }
                    }

                    uniqueContacts.set(msg.contact_id, {
                        contact_id: msg.contact_id,
                        name: name || msg.sender_phone,
                        phone_number: msg.contacts?.phone_1_number || msg.sender_phone,
                        last_message: msg.content,
                        last_message_at: msg.created_at,
                        unread_count: 0,
                        avatar_url: avatarUrl
                    });
                }
            });

            return Array.from(uniqueContacts.values());
        }
    });

    // Realtime subscription to refresh sidebar when new messages arrive
    useEffect(() => {
        const channel = supabase
            .channel('sidebar_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                },
                () => {
                    // Invalidate the contacts query to refresh the sidebar
                    queryClient.invalidateQueries({ queryKey: ['whatsapp_contacts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    // Helper for Timestamp Formatting (Same as ChatWindow)
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

        if (isYesterday) return `Yesterday`; // Sidebar: Just "Yesterday" is cleaner than "Yesterday 10:30 PM" for sidebar? 
        // Actually user said "as they are on Whataspp UI". 
        // WhatsApp main list shows "Yesterday" (no time). 
        // If older than yesterday, it shows date (e.g. 24/01/2026).
        // Or day name (Friday).

        // Let's refine for Sidebar specifically (often shorter).
        // If I make it "Yesterday 10:30 PM" it might overflow.
        // I'll stick to full format for consistency with ChatWindow unless I decide otherwise.
        // User request: "as they are on Whataspp UI".
        // WhatsApp List Logic:
        // Today: HH:MM
        // Yesterday: "Yesterday"
        // < 7 days: Day Name (Friday)
        // > 7 days: Date (12/05/2024)

        // My ChatWindow logic included TIME in all cases.
        // In the SIDEBAR, typically you show LESS info.
        // I will implement "WhatsApp Style" for Sidebar (No time if not today).

        if (isYesterday) return 'Yesterday';

        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'long' });
        }

        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const filteredContacts = contacts?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone_number.includes(searchTerm)
    );

    return (
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col h-full">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">Chats</h2>
            </div>

            <div className="p-2 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading && <div className="p-4 text-center text-gray-500">Loading...</div>}
                {filteredContacts?.map((contact: any) => (
                    <div
                        key={contact.contact_id}
                        onClick={() => onSelectContact(contact.contact_id)}
                        className={cn(
                            "flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100",
                            activeContactId === contact.contact_id && "bg-gray-100"
                        )}
                    >
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={contact.avatar_url} />
                            <AvatarFallback>
                                <User className="h-6 w-6 text-gray-400" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <p className="font-semibold text-sm text-gray-900 truncate">{contact.name}</p>
                                <span className="text-xs text-gray-500">
                                    {formatMessageTime(contact.last_message_at)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{contact.last_message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
