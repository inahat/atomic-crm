import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';

export function WhatsAppLayout() {
    const [activeContactId, setActiveContactId] = useState<number | null>(null);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100 border rounded-lg shadow-sm m-4">
            <ChatSidebar
                onSelectContact={setActiveContactId}
                activeContactId={activeContactId}
            />
            <ChatWindow
                contactId={activeContactId}
            />
        </div>
    );
}
