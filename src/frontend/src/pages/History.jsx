import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function History() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await emailAPI.getHistory();
      setEmails(response.data.emails || []);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.subject?.toLowerCase().includes(search.toLowerCase()) ||
      email.recipient?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || email.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Clock className="w-8 h-8 mr-3 text-primary-600" />
            Historique des emails
          </h1>
          <p className="text-gray-600">
            Consultez l'historique de vos emails envoyés
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par objet ou destinataire..."
                className="input pl-10"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'sent', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' && 'Tous'}
                  {status === 'sent' && 'Envoyés'}
                  {status === 'failed' && 'Échoués'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="space-y-3">
          {filteredEmails.length > 0 ? (
            filteredEmails.map((email, index) => (
              <motion.div
                key={email.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`mt-1 p-2 rounded-lg ${
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
                      <h3 className="font-semibold text-gray-800 truncate">
                        {email.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        À: {email.recipient}
                      </p>
                      {email.body && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {email.body}
                        </p>
                      )}
                      {email.error_message && (
                        <p className="text-sm text-red-600 mt-2">
                          Erreur: {email.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <span className={`badge ${
                      email.status === 'sent' ? 'badge-success' : 'badge-error'
                    }`}>
                      {email.status === 'sent' ? 'Envoyé' : 'Échoué'}
                    </span>
                    {email.created_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDate(email.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucun email trouvé</p>
              <p className="text-gray-500 text-sm">
                {search || filter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par envoyer votre premier email!'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {emails.length > 0 && (
          <div className="card mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-800">{emails.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {emails.filter((e) => e.status === 'sent').length}
                </p>
                <p className="text-sm text-gray-600">Envoyés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">
                  {emails.filter((e) => e.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-600">Échoués</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
