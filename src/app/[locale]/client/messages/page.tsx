'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  read: boolean;
  attachments?: string[];
}

export default function MessagesClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && session.user.role !== 'CLIENT') {
      router.push('/dashboard');
    } else if (session?.user?.role === 'CLIENT') {
      fetchMessages();
    }
  }, [session, status, router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/client/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        
        // Marquer comme lus
        const unreadIds = data.messages
          .filter((m: Message) => !m.read && m.senderRole !== 'CLIENT')
          .map((m: Message) => m.id);
        
        if (unreadIds.length > 0) {
          await fetch('/api/client/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: unreadIds }),
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        setNewMessage('');
        await fetchMessages();
      } else {
        alert('Erreur lors de l\'envoi du message');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString('fr-FR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/client"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">[Back]</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Messagerie
                </h1>
                <p className="text-gray-600 mt-1">Communication avec votre avocat</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold">
                  {messages.filter(m => !m.read && m.senderRole !== 'CLIENT').length} non lu(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Zone de messages */}
      <main className="flex-1 max-w-5xl mx-auto px-8 py-8 w-full flex flex-col">
        <div className="flex-1 bg-white rounded-xl shadow-lg mb-4 overflow-hidden flex flex-col">
          {/* Messages scrollables */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block"></span>
                <p className="text-gray-500 text-lg">Aucun message pour le moment</p>
                <p className="text-gray-400 text-sm mt-2">
                  Commencez une conversation avec votre avocat
                </p>
              </div>
            ) : (
              Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  {/* Separateur de date */}
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-gray-200 px-4 py-2 rounded-full">
                      <p className="text-xs font-semibold text-gray-600">{date}</p>
                    </div>
                  </div>

                  {/* Messages du jour */}
                  {msgs.map((message) => {
                    const isFromClient = message.senderRole === 'CLIENT';
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromClient ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div
                          className={`max-w-md ${
                            isFromClient
                              ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl'
                              : 'bg-gray-100 text-gray-900 rounded-r-2xl rounded-tl-2xl'
                          } px-5 py-3 shadow-md`}
                        >
                          {!isFromClient && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                {message.senderName.charAt(0)}
                              </div>
                              <p className="font-semibold text-sm text-gray-700">
                                {message.senderName}
                              </p>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                Avocat
                              </span>
                            </div>
                          )}
                          
                          <p className={`${isFromClient ? 'text-white' : 'text-gray-800'} leading-relaxed`}>
                            {message.content}
                          </p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 p-2 rounded ${
                                    isFromClient ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span className="text-lg"></span>
                                  <span className="text-sm">{att}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p
                            className={`text-xs mt-2 ${
                              isFromClient ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de saisie */}
        <form onSubmit={handleSendMessage} className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="ecrivez votre message..."
                rows={3}
                disabled={sending}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Joindre un fichier"
              >
                <span className="text-2xl"></span>
              </button>
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '' : ''}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
             Votre avocat sera notifie par email de votre message
          </p>
        </form>
      </main>

      {/* Info */}
      <div className="max-w-5xl mx-auto px-8 pb-8 w-full">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start gap-3">
            <span className="text-2xl">?</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Informations importantes</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>- Les messages sont consultables par votre avocat et son equipe</li>
                <li>- evitez de partager des informations sensibles (mots de passe, codes PIN)</li>
                <li>- Pour les urgences, contactez directement votre cabinet par telephone</li>
                <li>- Les messages sont archives et peuvent servir de preuve</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
