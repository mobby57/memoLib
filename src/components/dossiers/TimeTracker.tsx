'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Clock, Plus, Trash2 } from 'lucide-react';

interface TimeEntry {
  id: string;
  description: string;
  duration: number; // minutes
  date: string;
  category: string;
  isBillable: boolean;
  montant?: number;
  Dossier?: { numero: string; objet: string };
}

interface Props {
  dossierId?: string;
  clientId?: string;
  tarifHoraire?: number; // €/h par défaut
  onEntryCreated?: () => void;
}

const CATEGORIES = [
  { value: 'travail', label: '📝 Travail sur dossier' },
  { value: 'audience', label: '⚖️ Audience' },
  { value: 'rdv', label: '🤝 Rendez-vous' },
  { value: 'deplacement', label: '🚗 Déplacement' },
  { value: 'recherche', label: '🔍 Recherche' },
  { value: 'telephone', label: '📞 Téléphone' },
  { value: 'correspondance', label: '✉️ Correspondance' },
  { value: 'admin', label: '📋 Administratif' },
];

export function TimeTracker({ dossierId, clientId, tarifHoraire = 150, onEntryCreated }: Props) {
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerCategory, setTimerCategory] = useState('travail');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Manual entry state
  const [showManual, setShowManual] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategory, setManualCategory] = useState('travail');
  const [isBillable, setIsBillable] = useState(true);

  // Entries list
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState({ totalHours: 0, totalMontant: 0, unbilledMontant: 0 });
  const [loading, setLoading] = useState(false);

  // Load entries
  useEffect(() => {
    loadEntries();
  }, [dossierId]);

  const loadEntries = async () => {
    const params = new URLSearchParams();
    if (dossierId) params.set('dossierId', dossierId);
    if (clientId) params.set('clientId', clientId);

    try {
      const res = await fetch(`/api/time-entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setStats(data.stats || { totalHours: 0, totalMontant: 0, unbilledMontant: 0 });
      }
    } catch { /* silent */ }
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const startTimer = () => {
    setIsRunning(true);
    startTimeRef.current = new Date();
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = async () => {
    setIsRunning(false);
    if (elapsedSeconds < 60) {
      setElapsedSeconds(0);
      return; // Minimum 1 minute
    }

    const duration = Math.ceil(elapsedSeconds / 60);
    await saveEntry({
      description: timerDescription || 'Travail sur dossier',
      duration,
      category: timerCategory,
      startTime: startTimeRef.current?.toISOString(),
      endTime: new Date().toISOString(),
    });

    setElapsedSeconds(0);
    setTimerDescription('');
    startTimeRef.current = null;
  };

  const saveEntry = async (entryData: {
    description: string;
    duration: number;
    category: string;
    startTime?: string;
    endTime?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryData,
          dossierId,
          clientId,
          tarifHoraire,
          isBillable,
          date: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        await loadEntries();
        onEntryCreated?.();
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const saveManualEntry = async () => {
    const duration = parseInt(manualDuration);
    if (!duration || duration < 1 || !manualDescription) return;

    await saveEntry({ description: manualDescription, duration, category: manualCategory });
    setManualDuration('');
    setManualDescription('');
    setShowManual(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Supprimer cette entrée de temps ?')) return;
    await fetch(`/api/time-entries?id=${id}`, { method: 'DELETE' });
    await loadEntries();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
  };

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Suivi du temps
        </h3>
        <div className="text-sm text-gray-500">
          {stats.totalHours}h total • {stats.unbilledMontant.toFixed(0)}€ non facturé
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <div className={`text-2xl font-mono font-bold ${isRunning ? 'text-blue-600' : 'text-gray-700'}`}>
          {formatTime(elapsedSeconds)}
        </div>

        <div className="flex gap-1">
          {!isRunning ? (
            <button onClick={startTimer} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600" title="Démarrer">
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={pauseTimer} className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600" title="Pause">
              <Pause className="w-4 h-4" />
            </button>
          )}
          {elapsedSeconds > 0 && (
            <button onClick={stopTimer} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600" title="Arrêter et sauvegarder">
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>

        <input
          type="text"
          value={timerDescription}
          onChange={e => setTimerDescription(e.target.value)}
          placeholder="Description du travail..."
          className="flex-1 px-3 py-1.5 text-sm border rounded-md"
        />

        <select value={timerCategory} onChange={e => setTimerCategory(e.target.value)} className="text-sm border rounded-md px-2 py-1.5">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Manual entry toggle */}
      <button
        onClick={() => setShowManual(!showManual)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Saisie manuelle
      </button>

      {showManual && (
        <div className="flex items-end gap-2 bg-blue-50 rounded-lg p-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Description</label>
            <input type="text" value={manualDescription} onChange={e => setManualDescription(e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="Ex: Rédaction conclusions" />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-500">Minutes</label>
            <input type="number" value={manualDuration} onChange={e => setManualDuration(e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="30" min="1" />
          </div>
          <select value={manualCategory} onChange={e => setManualCategory(e.target.value)} className="text-sm border rounded px-2 py-1.5">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={isBillable} onChange={e => setIsBillable(e.target.checked)} />
            Facturable
          </label>
          <button onClick={saveManualEntry} disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
            Ajouter
          </button>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {entries.slice(0, 10).map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50 group">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-gray-400 text-xs">{new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                <span className="truncate text-gray-700">{entry.description}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-medium">{formatDuration(entry.duration)}</span>
                {entry.montant && <span className="text-green-600 text-xs">{entry.montant.toFixed(0)}€</span>}
                {!entry.isBillable && <span className="text-gray-400 text-xs">NF</span>}
                <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !loading && (
        <p className="text-sm text-gray-400 text-center py-2">Aucun temps enregistré</p>
      )}
    </div>
  );
}
