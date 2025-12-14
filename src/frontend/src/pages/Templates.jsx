import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Copy, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { templateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templateAPI.getAll();
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des templates');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      const response = await templateAPI.save(formData);
      if (response.data.success) {
        toast.success('✅ Template sauvegardé!');
        setShowModal(false);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce template ?')) return;

    try {
      await templateAPI.delete(id);
      toast.success('Template supprimé');
      loadTemplates();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUseTemplate = (template) => {
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    navigate('/send');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      category: 'general'
    });
    setEditingTemplate(null);
  };

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: 'general', label: '📄 Général', color: 'bg-blue-500' },
    { value: 'business', label: '💼 Affaires', color: 'bg-purple-500' },
    { value: 'personal', label: '👤 Personnel', color: 'bg-green-500' },
    { value: 'marketing', label: '📢 Marketing', color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-primary-600" />
            Mes Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez vos modèles d'emails
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau template
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
            placeholder="Rechercher un template..."
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${
                    categories.find(c => c.value === template.category)?.color || 'bg-gray-500'
                  }`}>
                    {categories.find(c => c.value === template.category)?.label || '📄 Général'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
              {template.body}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => handleUseTemplate(template)}
                className="btn-primary flex-1 flex items-center justify-center text-sm"
              >
                <Copy className="w-4 h-4 mr-1" />
                Utiliser
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'Aucun template trouvé' : 'Aucun template créé'}
          </p>
          <p className="text-gray-400 mt-2">
            Créez votre premier template pour gagner du temps !
          </p>
        </div>
      )}

      {/* Modal Création/Edition */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du template *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Ex: Email de bienvenue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                      placeholder="Sujet de l'email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Corps du message *
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      rows={10}
                      className="input resize-none"
                      placeholder="Contenu de l'email..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="btn-primary flex-1 flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
