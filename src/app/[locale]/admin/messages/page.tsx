'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  contenu: string;
  lu: boolean;
  dateEnvoi: string;
  expediteur: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  destinataire: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface ClientConversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

export default function MessagesAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'ADMIN') {
      fetchConversations();
    }
  }, [session, status, router]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/messages');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          contenu: newMessage,
        }),
      });

      if (res.ok) {
        setNewMessage('');
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (clientId: string) => {
    try {
      await fetch('/api/admin/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      await fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const selectedConversation = conversations.find(c => c.clientId === selectedClient);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-2xl">[Back]</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Messagerie Clients
              </h1>
              <p className="text-gray-600 mt-1">
                {conversations.length} conversation(s) - {totalUnread} message(s) non lu(s)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Liste des conversations */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
              <h2 className="font-semibold text-lg">Clients ({conversations.length})</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <span className="text-4xl mb-2 block">[Chat]</span>
                  <p className="text-gray-500">Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.clientId}
                    onClick={() => {
                      setSelectedClient(conv.clientId);
                      markAsRead(conv.clientId);
                    }}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                      selectedClient === conv.clientId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.clientName.split(' ').map(n => n.charAt(0)).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{conv.clientName}</p>
                          <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conv.lastMessageDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">[Chat]</span>
                  <p className="text-lg">Selectionnez une conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header conversation */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                  <h2 className="font-semibold text-lg">{selectedConversation.clientName}</h2>
                  <p className="text-sm text-blue-100">{selectedConversation.messages.length} message(s)</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {selectedConversation.messages.map((message) => {
                    const isFromAdmin = message.expediteur.role === 'ADMIN';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isFromAdmin ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-lg p-4 shadow-md ${
                            isFromAdmin
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-white text-gray-900'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
                            <div className={`flex items-center gap-2 mt-2 text-xs ${
                              isFromAdmin ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>{message.expediteur.firstName}</span>
                              <span>-</span>
                              <span>{new Date(message.dateEnvoi).toLocaleString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="ecrivez votre message..."
                      rows={3}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {sending ? '...' : 'Envoyer ?'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Appuyez sur Entree pour envoyer, Maj+Entree pour nouvelle ligne</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
