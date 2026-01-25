'use client';

import { Mail, Star, Archive, Check, X, AlertTriangle, Calendar, Paperclip } from 'lucide-react';
import { useState } from 'react';

interface Email {
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  receivedDate: string;
  direction: 'inbound' | 'outbound';
  category?: string;
  priority: string;
  hasAttachments: boolean;
  attachments?: any;
  aiProcessed: boolean;
  aiClassified?: string;
  aiConfidence?: number;
  aiSummary?: string;
  aiActionNeeded?: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  needsResponse: boolean;
}

interface EmailsTabProps {
  emails: Email[];
  onRefresh: () => void;
}

export default function EmailsTab({ emails, workspaceId, onRefresh }: EmailsTabProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const handleMarkRead = async (emailId: string) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/emails`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, action: 'mark_read' }),
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur marquer lu:', error);
    }
  };

  const handleStar = async (emailId: string, isCurrentlyStarred: boolean) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/emails`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailId, 
          action: isCurrentlyStarred ? 'unstar' : 'star' 
        }),
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
    }
  };

  const handleArchive = async (emailId: string) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/emails`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, action: 'archive' }),
      });
      if (response.ok) {
        onRefresh();
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Erreur archiver:', error);
    }
  };
  const handleEmailAction = async (emailId: string, action: string) => {
    try {
      await fetch(`/api/lawyer/workspaces/${emailId.split('-')[0]}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, action }),
      });
      onRefresh();
    } catch (error) {
      console.error('Erreur action email:', error);
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread' && email.isRead) return false;
    if (filter === 'starred' && !email.isStarred) return false;
    if (filter === 'needsResponse' && !email.needsResponse) return false;
    if (filter === 'urgent' && email.priority !== 'critical' && email.priority !== 'high') return false;
    
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        email.from.toLowerCase().includes(searchLower) ||
        email.subject.toLowerCase().includes(searchLower) ||
        email.bodyText?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const priorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-400px)]">
      {/* Liste Emails */}
      <div className="col-span-1 space-y-4">
        {/* Filtres */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'unread', label: 'Non lus' },
            { id: 'starred', label: 'Favoris' },
            { id: 'urgent', label: 'Urgents' },
            { id: 'needsResponse', label: 'a repondre' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-500px)]">
          {filteredEmails.map(email => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedEmail?.id === email.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              } ${!email.isRead ? 'bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  {!email.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                  <span className="font-medium text-gray-900 truncate text-sm">
                    {email.direction === 'inbound' ? email.from : `a: ${email.to}`}
                  </span>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {email.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  {email.hasAttachments && <Paperclip className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              <p className="font-medium text-gray-900 mb-1 text-sm line-clamp-1">{email.subject}</p>
              
              {email.aiSummary && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  [emoji] {email.aiSummary}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(email.priority)}`}>
                    {email.priority}
                  </span>
                  {email.needsResponse && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      a repondre
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(email.receivedDate).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {filteredEmails.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun email trouve</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Email */}
      <div className="col-span-2 border border-gray-200 rounded-lg bg-white overflow-hidden">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            {/* Header Email */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">De:</span> {selectedEmail.from}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">a:</span> {selectedEmail.to}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(selectedEmail.receivedDate).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEmailAction(selectedEmail.id, selectedEmail.isStarred ? 'unstar' : 'star')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedEmail.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Star className={`w-5 h-5 ${selectedEmail.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                  <button
                    onClick={() => handleEmailAction(selectedEmail.id, selectedEmail.isArchived ? 'unarchive' : 'archive')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedEmail.isArchived ? 'Desarchiver' : 'Archiver'}
                  >
                    <Archive className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleEmailAction(selectedEmail.id, selectedEmail.isRead ? 'mark_unread' : 'mark_read')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={selectedEmail.isRead ? 'Marquer non lu' : 'Marquer lu'}
                  >
                    {selectedEmail.isRead ? (
                      <X className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* IA Insights */}
              {selectedEmail.aiProcessed && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">IA</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Analyse IA</h4>
                      {selectedEmail.aiSummary && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Resume:</span> {selectedEmail.aiSummary}
                        </p>
                      )}
                      {selectedEmail.aiClassified && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Classification:</span>{' '}
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {selectedEmail.aiClassified}
                          </span>
                          {selectedEmail.aiConfidence && (
                            <span className="ml-2 text-xs text-gray-600">
                              (confiance: {Math.round(selectedEmail.aiConfidence * 100)}%)
                            </span>
                          )}
                        </p>
                      )}
                      {selectedEmail.aiActionNeeded && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Action suggeree:</span> {selectedEmail.aiActionNeeded}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Corps Email */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">
                  {selectedEmail.bodyText || 'Pas de contenu texte'}
                </pre>
              </div>

              {/* Pieces jointes */}
              {selectedEmail.hasAttachments && selectedEmail.attachments && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Pieces jointes
                  </h4>
                  <div className="space-y-2">
                    {JSON.parse(selectedEmail.attachments).map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Paperclip className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{att.filename}</p>
                            <p className="text-xs text-gray-500">
                              {(att.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                          Telecharger
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Repondre
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Transferer
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Generer reponse IA
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Selectionnez un email pour afficher son contenu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
