import { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';

type TableStatus = 'free' | 'occupied' | 'reserved' | 'to_clear';

interface Table {
  id: string;
  name: string;
  seats: number;
  x: number;
  y: number;
  status: TableStatus;
}

const STATUS_COLORS: Record<TableStatus, string> = {
  free: 'bg-emerald-600 border-emerald-500',
  occupied: 'bg-amber-600 border-amber-500',
  reserved: 'bg-blue-600 border-blue-500',
  to_clear: 'bg-slate-600 border-slate-500',
};

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Libre',
  occupied: 'Occupée',
  reserved: 'Réservée',
  to_clear: 'À débarrasser',
};

const INITIAL_TABLES: Table[] = [
  { id: '1', name: 'T1', seats: 2, x: 10, y: 10, status: 'free' },
  { id: '2', name: 'T2', seats: 2, x: 10, y: 30, status: 'occupied' },
  { id: '3', name: 'T3', seats: 4, x: 10, y: 50, status: 'free' },
  { id: '4', name: 'T4', seats: 4, x: 35, y: 15, status: 'reserved' },
  { id: '5', name: 'T5', seats: 6, x: 35, y: 45, status: 'to_clear' },
  { id: '6', name: 'T6', seats: 2, x: 60, y: 10, status: 'free' },
  { id: '7', name: 'T7', seats: 2, x: 60, y: 30, status: 'free' },
  { id: '8', name: 'T8', seats: 4, x: 60, y: 50, status: 'occupied' },
];

function nextTableName(tables: Table[]): string {
  const nums = tables
    .map((t) => {
      const m = t.name.match(/^T(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `T${max + 1}`;
}

export function FloorPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = tables.find((t) => t.id === selectedId);

  const cycleStatus = (id: string) => {
    const order: TableStatus[] = ['free', 'occupied', 'reserved', 'to_clear'];
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: order[(order.indexOf(t.status) + 1) % order.length] }
          : t
      )
    );
  };

  const addTable = () => {
    const name = nextTableName(tables);
    const newTable: Table = {
      id: `t-${Date.now()}`,
      name,
      seats: 2,
      x: 15 + (tables.length % 3) * 25,
      y: 15 + Math.floor(tables.length / 3) * 25,
      status: 'free',
    };
    setTables((prev) => [...prev, newTable]);
    setSelectedId(newTable.id);
  };

  const removeTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateTable = (id: string, updates: Partial<Pick<Table, 'name' | 'seats'>>) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Plan de salle</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addTable}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
          >
            <Plus size={18} />
            Ajouter une table
          </button>
          <div className="flex gap-2 flex-wrap">
            {(['free', 'occupied', 'reserved', 'to_clear'] as TableStatus[]).map((s) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${STATUS_COLORS[s]}`}
              >
                <span className="w-2 h-2 rounded-full bg-white/80" />
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-inner min-h-[500px] flex gap-6">
        <div
          className="flex-1 relative bg-slate-800/50 rounded-xl border border-slate-600"
          style={{ minHeight: 400 }}
        >
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
              onDoubleClick={() => cycleStatus(t.id)}
              className={`absolute w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-white text-xs font-medium transition-transform hover:scale-105 ${STATUS_COLORS[t.status]} ${selectedId === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              title={`${t.name} – ${STATUS_LABELS[t.status]} (double-clic : statut)`}
            >
              <span>{t.name}</span>
              <span className="opacity-80">{t.seats} p.</span>
            </button>
          ))}
        </div>

        <div className="w-72 shrink-0 space-y-4">
          {selected ? (
            <>
              <div className="card card-inner">
                <h3 className="font-semibold text-white mb-3">Table</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nom</label>
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(e) => updateTable(selected.id, { name: e.target.value || selected.name })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nombre de places</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateTable(selected.id, { seats: Math.max(1, selected.seats - 1) })}
                        className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-white font-medium">
                        {selected.seats}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateTable(selected.id, { seats: Math.min(20, selected.seats + 1) })}
                        className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">
                    Statut : {STATUS_LABELS[selected.status]}
                  </p>
                  <button
                    type="button"
                    onClick={() => cycleStatus(selected.id)}
                    className="w-full py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
                  >
                    Changer statut
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTable(selected.id)}
                    className="w-full py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Retirer la table
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-500 py-8">
              <MapPin size={32} />
              <p className="text-sm text-center">Cliquez sur une table pour modifier</p>
              <p className="text-xs text-center">Double-clic sur une table : changer le statut</p>
            </div>
          )}

          <div className="card card-inner">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              Tables ({tables.length})
            </h3>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {tables.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm flex justify-between items-center ${selectedId === t.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                  >
                    <span>{t.name}</span>
                    <span className="text-xs">{t.seats} p. · {STATUS_LABELS[t.status]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
