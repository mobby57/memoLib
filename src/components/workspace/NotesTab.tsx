'use client';

import { StickyNote, Plus, Pin, Edit, Trash2, Save, X, Tag, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Note {
  id: string;
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  isPrivate: boolean;
  isPinned: boolean;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesTabProps {
  notes: Note[];
  workspaceId?: string;
  onRefresh: () => void;
}

export default function NotesTab({ notes, workspaceId, onRefresh }: NotesTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPrivate: false,
    isPinned: false,
    tags: '',
  });

  const handleCreate = async () => {
    if (!workspaceId) return;
    
    try {
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || undefined,
          content: formData.content,
          isPrivate: formData.isPrivate,
          isPinned: formData.isPinned,
          tags,
        }),
      });
      
      if (response.ok) {
        setIsCreating(false);
        setFormData({ title: '', content: '', isPrivate: false, isPinned: false, tags: '' });
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur creation note:', error);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content,
      isPrivate: note.isPrivate,
      isPinned: note.isPinned,
      tags: note.tags || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingNote || !workspaceId) return;
    
    try {
      const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/notes/${editingNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || undefined,
          content: formData.content,
          isPrivate: formData.isPrivate,
          isPinned: formData.isPinned,
          tags,
        }),
      });
      
      if (response.ok) {
        setEditingNote(null);
        setFormData({ title: '', content: '', isPrivate: false, isPinned: false, tags: '' });
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur mise a jour note:', error);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!workspaceId || !confirm('Supprimer cette note ?')) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur suppression note:', error);
    }
  };

  const togglePin = async (noteId: string, isPinned: boolean) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/lawyer/workspaces/${workspaceId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur toggle pin:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (filter === 'pinned') return note.isPinned;
    if (filter === 'private') return note.isPrivate;
    if (filter === 'team') return !note.isPrivate;
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const regularNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notes & Annotations</h3>
          <p className="text-sm text-gray-600 mt-1">{notes.length} note(s) au total</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle note</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-2">
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'pinned', label: 'epinglees' },
          { id: 'team', label: 'equipe' },
          { id: 'private', label: 'Privees' },
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

      {/* Formulaire creation/edition */}
      {(isCreating || editingNote) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingNote ? 'Modifier la note' : 'Nouvelle note'}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre (optionnel)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="ecrivez votre note ici..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Markdown supporte : **gras**, *italique*, - liste, # titre
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (separes par des virgules)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="strategie, urgent, important"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  <Pin className="w-4 h-4 mr-1" />
                  epingler en haut
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  <EyeOff className="w-4 h-4 mr-1" />
                  Note privee (visible uniquement par moi)
                </span>
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={editingNote ? handleUpdate : handleCreate}
                disabled={!formData.content.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingNote ? 'Enregistrer' : 'Creer'}</span>
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingNote(null);
                  setFormData({ title: '', content: '', isPrivate: false, isPinned: false, tags: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes epinglees */}
      {pinnedNotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Pin className="w-4 h-4 mr-2 text-indigo-600" />
            epinglees
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes regulieres */}
      {regularNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h4 className="font-semibold text-gray-900 mb-3">Autres notes</h4>
          )}
          <div className="grid grid-cols-2 gap-4">
            {regularNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </div>
      )}

      {filteredNotes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">Aucune note</p>
          <p className="text-sm text-gray-500 mt-2">Creez votre premiere note pour commencer</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Nouvelle note
          </button>
        </div>
      )}
    </div>
  );
}

// Composant NoteCard
function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}) {
  const tags = note.tags ? JSON.parse(note.tags) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {note.title && (
            <h5 className="font-semibold text-gray-900 mb-1">{note.title}</h5>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{note.authorName}</span>
            <span>-</span>
            <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(note.id, note.isPinned)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              note.isPinned ? 'text-indigo-600' : 'text-gray-400'
            }`}
            title={note.isPinned ? 'Desepingler' : 'epingler'}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-red-400"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu (markdown simple) */}
      <div className="text-sm text-gray-700 mb-3 line-clamp-4 whitespace-pre-wrap">
        {note.content}
      </div>

      {/* Footer avec badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 flex-wrap gap-1">
          {note.isPrivate && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
              <EyeOff className="w-3 h-3 mr-1" />
              Privee
            </span>
          )}
          {tags.map((tag: string, idx: number) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>

        {note.updatedAt !== note.createdAt && (
          <span className="text-xs text-gray-400">
            Modifiee {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    </div>
  );
}
