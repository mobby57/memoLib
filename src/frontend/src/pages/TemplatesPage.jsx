import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Trash2, Edit, Search } from 'lucide-react';

/* eslint-disable no-alert, no-undef */

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'professionnel',
    sujet: '',
    contenu: ''
  });

  const categories = ['professionnel', 'administratif', 'commercial', 'support', 'urgent'];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();

    if (!formData.nom || !formData.sujet || !formData.contenu) {
      alert('Nom, sujet et contenu requis');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(editingTemplate ? '✅ Template modifié!' : '✅ Template ajouté!');
        resetForm();
        loadTemplates();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur de sauvegarde');
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Supprimer ce template ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const editTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      nom: template.nom,
      categorie: template.categorie || 'professionnel',
      sujet: template.sujet,
      contenu: template.contenu
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({ nom: '', categorie: 'professionnel', sujet: '', contenu: '' });
    setEditingTemplate(null);
    setShowAddForm(false);
  };

  const applyTemplate = (template) => {
    // Store template in localStorage and navigate to email generator
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    navigate('/email-generator');
  };

  const filteredTemplates = templates.filter(template =>
    template.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.sujet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      professionnel: 'from-blue-600 to-indigo-600',
      administratif: 'from-purple-600 to-pink-600',
      commercial: 'from-green-600 to-emerald-600',
      support: 'from-orange-600 to-red-600',
      urgent: 'from-red-600 to-rose-600'
    };
    return colors[category] || 'from-gray-600 to-slate-600';
  };

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
              <h1 className="text-3xl font-bold text-white">📝 Templates d'Emails</h1>
              <p className="text-blue-200">{templates.length} templates disponibles</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau Template
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingTemplate ? 'Modifier Template' : 'Nouveau Template'}
            </h2>
            <form onSubmit={saveTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                    placeholder="Ex: Réponse standard client"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Catégorie</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Sujet *</label>
                <input
                  type="text"
                  value={formData.sujet}
                  onChange={(e) => setFormData({...formData, sujet: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3"
                  placeholder="Sujet de l'email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Contenu *</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({...formData, contenu: e.target.value})}
                  className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg p-3 h-64 resize-none"
                  placeholder="Tapez votre template ici... Utilisez {nom}, {entreprise}, etc. pour les variables"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
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
              placeholder="Rechercher un template..."
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg pl-12 pr-4 py-3"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(template.categorie)} rounded-lg flex items-center justify-center`}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{template.nom}</h3>
                    <span className="text-xs text-gray-300">{template.categorie}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editTemplate(template)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Sujet:</p>
                <p className="text-sm text-gray-300">{template.sujet}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Aperçu:</p>
                <p className="text-sm text-gray-300 line-clamp-3">
                  {template.contenu}
                </p>
              </div>

              <button
                onClick={() => applyTemplate(template)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                Utiliser ce template
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun template trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
