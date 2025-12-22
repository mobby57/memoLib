import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Trash2, Search } from 'lucide-react';

/* eslint-disable no-alert, no-undef */

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '',
    prenom: '',
    email: '',
    entreprise: '',
    poste: ''
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    
    if (!newContact.nom || !newContact.email) {
      alert('Nom et email requis');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newContact)
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Contact ajouté!');
        setNewContact({ nom: '', prenom: '', email: '', entreprise: '', poste: '' });
        setShowAddForm(false);
        loadContacts();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('Erreur d\'ajout');
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        loadContacts();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">👥 Contacts</h1>
              <p className="text-blue-200">{contacts.length} contacts enregistrés</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter Contact
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Nouveau Contact</h2>
            <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                <input
                  type="text"
                  value={newContact.nom}
                  onChange={(e) => setNewContact({...newContact, nom: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Prénom</label>
                <input
                  type="text"
                  value={newContact.prenom}
                  onChange={(e) => setNewContact({...newContact, prenom: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Email *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Entreprise</label>
                <input
                  type="text"
                  value={newContact.entreprise}
                  onChange={(e) => setNewContact({...newContact, entreprise: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">Poste</label>
                <input
                  type="text"
                  value={newContact.poste}
                  onChange={(e) => setNewContact({...newContact, poste: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un contact..."
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg pl-12 pr-4 py-3"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {contact.prenom?.[0] || contact.nom?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {contact.prenom} {contact.nom}
                    </h3>
                    {contact.poste && (
                      <p className="text-sm text-gray-300">{contact.poste}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteContact(contact.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-200">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{contact.email}</span>
                </div>

                {contact.entreprise && (
                  <div className="text-sm text-gray-300">
                    🏢 {contact.entreprise}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun contact trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
