import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Clock, CheckCircle, XCircle, Search, Calendar } from 'lucide-react';

export default function EmailHistoryPage() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/history?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => 
    email.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📜 Historique des Emails
            </h1>
            <p className="text-gray-600 mt-1">
              {emails.length} email{emails.length > 1 ? 's' : ''} envoyé{emails.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par destinataire, sujet ou contenu..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Liste des emails */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Chargement de l'historique...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'Aucun résultat' : 'Aucun email envoyé'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Essayez une autre recherche' 
                : 'Les emails envoyés apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmails.map((email, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      email.status === 'sent' 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {email.status === 'sent' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          À: {email.to}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          email.status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {email.status === 'sent' ? 'Envoyé' : 'Échec'}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {email.subject}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {email.body}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(email.timestamp)}</span>
                  </div>
                </div>

                {email.messageId && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-mono">
                      ID: {email.messageId}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination info */}
        {filteredEmails.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Affichage de {filteredEmails.length} email{filteredEmails.length > 1 ? 's' : ''}
            {searchTerm && ` (filtrés sur ${emails.length})`}
          </div>
        )}
      </div>
    </div>
  );
}
