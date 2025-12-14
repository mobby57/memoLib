import { useState, useEffect } from 'react';
import { Users, Plus, Search, Building2, Mail, Trash2, Download, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Contacts() {
  const [contacts, setContacts] = useState({ custom: [], frequent: [], institutions: {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', organization: '', category: 'custom' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des contacts');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast.error('Nom et email requis');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('✅ Contact ajouté!');
        setShowAddModal(false);
        setNewContact({ name: '', email: '', organization: '', category: 'custom' });
        loadContacts();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (email) => {
    if (!confirm('Supprimer ce contact ?')) return;

    try {
      const response = await fetch(`/api/contacts/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Contact supprimé');
        loadContacts();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSearchInstitution = async () => {
    if (!searchQuery.trim()) {
      toast.error('Entrez un nom d\'institution');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/contacts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      const data = await response.json();
      if (data.success && data.results.length > 0) {
        toast.success(`${data.results.length} résultat(s) trouvé(s)!`);
        // Afficher les résultats dans une modale ou section
      } else {
        toast.error('Aucun résultat trouvé');
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const allContacts = [...contacts.custom, ...contacts.frequent];
  const filteredContacts = searchQuery
    ? allContacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👥 Répertoire de Contacts</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos destinataires et trouvez automatiquement les emails d'institutions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contacts sauvegardés</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.custom.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contacts fréquents</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.frequent.length}</p>
            </div>
            <Mail className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Institutions</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(contacts.institutions).length}</p>
            </div>
            <Building2 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
              placeholder="Rechercher un contact ou une institution..."
            />
          </div>
          <button
            onClick={handleSearchInstitution}
            disabled={loading}
            className="btn btn-secondary"
          >
            <Search className="w-5 h-5 mr-2" />
            Rechercher institution
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Mes contacts ({filteredContacts.length})</h2>
        
        {filteredContacts.length > 0 ? (
          <div className="space-y-2">
            {filteredContacts.map((contact, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      {contact.metadata?.organization && (
                        <p className="text-xs text-gray-500">{contact.metadata.organization}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {contact.email_count > 0 && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {contact.email_count} email{contact.email_count > 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteContact(contact.email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Aucun contact trouvé</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary mt-4"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter votre premier contact
            </button>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">Ajouter un contact</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="input"
                  placeholder="Nom du contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organisation</label>
                <input
                  type="text"
                  value={newContact.organization}
                  onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })}
                  className="input"
                  placeholder="Nom de l'organisation (optionnel)"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddContact}
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewContact({ name: '', email: '', organization: '', category: 'custom' });
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
