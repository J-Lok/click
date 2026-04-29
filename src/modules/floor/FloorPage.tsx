import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { floorApi } from '@/api/floor';
import type { Floor, FloorTable, TableStatus } from '@/api/floor';

const TABLE_STATUS: TableStatus[] = ['free', 'occupied', 'reserved', 'to_clear'];

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

const TABLE_SIZE_PX = 56;
const SAVE_DEBOUNCE_MS = 1500;

const INITIAL_FLOORS: Floor[] = [
  {
    id: 'floor-1',
    name: 'Salle principale',
    tables: [
      { id: '1', name: 'T1', seats: 2, x: 10, y: 10, status: 'free' },
      { id: '2', name: 'T2', seats: 2, x: 10, y: 30, status: 'occupied' },
      { id: '3', name: 'T3', seats: 4, x: 10, y: 50, status: 'free' },
      { id: '4', name: 'T4', seats: 4, x: 35, y: 15, status: 'reserved' },
      { id: '5', name: 'T5', seats: 6, x: 35, y: 45, status: 'to_clear' },
      { id: '6', name: 'T6', seats: 2, x: 60, y: 10, status: 'free' },
      { id: '7', name: 'T7', seats: 2, x: 60, y: 30, status: 'free' },
      { id: '8', name: 'T8', seats: 4, x: 60, y: 50, status: 'occupied' },
    ],
  },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function nextTableName(tables: FloorTable[]): string {
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
  const [floors, setFloors] = useState<Floor[]>(INITIAL_FLOORS);
  const [activeFloorId, setActiveFloorId] = useState<string>(INITIAL_FLOORS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [floorNameDraft, setFloorNameDraft] = useState<string>(INITIAL_FLOORS[0].name);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [panelOpen, setPanelOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<null | {
    tableId: string;
    pointerId: number;
    offsetXPx: number;
    offsetYPx: number;
    startPointerXPx: number;
    startPointerYPx: number;
  }>(null);
  const suppressClickRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const activeFloor = floors.find((f) => f.id === activeFloorId) ?? floors[0];
  const tables = activeFloor?.tables ?? [];
  const selected = tables.find((t) => t.id === selectedId);

  // Load from API on mount; fall back to localStorage
  useEffect(() => {
    floorApi
      .get()
      .then((data) => {
        if (data.floors && data.floors.length > 0) {
          setFloors(data.floors);
          setActiveFloorId(data.floors[0].id);
          setFloorNameDraft(data.floors[0].name);
        }
      })
      .catch(() => {
        // Fall back to localStorage
        try {
          const raw = localStorage.getItem('floorPlan_v1');
          if (raw) {
            const parsed = JSON.parse(raw) as { floors?: Floor[]; activeFloorId?: string };
            if (parsed.floors?.length) {
              setFloors(parsed.floors);
              const aid = parsed.activeFloorId && parsed.floors.some((f) => f.id === parsed.activeFloorId)
                ? parsed.activeFloorId
                : parsed.floors[0].id;
              setActiveFloorId(aid);
              setFloorNameDraft(parsed.floors.find((f) => f.id === aid)?.name ?? '');
            }
          }
        } catch {
          // ignore
        }
      })
      .finally(() => {
        setIsLoading(false);
        isFirstRender.current = false;
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync floor name draft when active floor changes
  useEffect(() => {
    setFloorNameDraft(activeFloor?.name ?? '');
  }, [activeFloorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save: fires 1.5s after last change, skips initial hydration
  useEffect(() => {
    if (isLoading) return;

    // Mirror to localStorage immediately
    try {
      localStorage.setItem('floorPlan_v1', JSON.stringify({ floors, activeFloorId }));
    } catch {
      // ignore
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState('saving');

    saveTimerRef.current = setTimeout(() => {
      floorApi
        .save(floors)
        .then(() => {
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        })
        .catch(() => {
          setSaveState('error');
          setTimeout(() => setSaveState('idle'), 3000);
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [floors]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTablesOnActiveFloor = (updater: (prev: FloorTable[]) => FloorTable[]) => {
    setFloors((prevFloors) =>
      prevFloors.map((f) => (f.id === activeFloorId ? { ...f, tables: updater(f.tables) } : f))
    );
  };

  const cycleStatus = (id: string) => {
    updateTablesOnActiveFloor((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: TABLE_STATUS[(TABLE_STATUS.indexOf(t.status) + 1) % TABLE_STATUS.length] }
          : t
      )
    );
  };

  const addTable = () => {
    const newId = `t-${Date.now()}`;
    updateTablesOnActiveFloor((prev) => {
      const name = nextTableName(prev);
      const index = prev.length;
      return [
        ...prev,
        { id: newId, name, seats: 2, x: 15 + (index % 3) * 25, y: 15 + Math.floor(index / 3) * 25, status: 'free' },
      ];
    });
    setSelectedId(newId);
  };

  const removeTable = (id: string) => {
    updateTablesOnActiveFloor((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateTable = (id: string, updates: Partial<Pick<FloorTable, 'name' | 'seats'>>) => {
    updateTablesOnActiveFloor((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const addFloor = () => {
    const newFloorId = `floor-${Date.now()}`;
    const newFloorName = `Salle ${floors.length + 1}`;
    setFloors((prev) => [...prev, { id: newFloorId, name: newFloorName, tables: [] }]);
    setActiveFloorId(newFloorId);
    setSelectedId(null);
  };

  const renameActiveFloor = () => {
    const nextName = floorNameDraft.trim();
    if (!nextName) return;
    setFloors((prev) => prev.map((f) => (f.id === activeFloorId ? { ...f, name: nextName } : f)));
  };

  const deleteActiveFloor = () => {
    if (floors.length <= 1) return;
    const nextFloors = floors.filter((f) => f.id !== activeFloorId);
    setFloors(nextFloors);
    setActiveFloorId(nextFloors[0].id);
    setSelectedId(null);
    setFloorNameDraft(nextFloors[0].name);
  };

  const onTablePointerDown = (e: React.PointerEvent<HTMLButtonElement>, tableId: string) => {
    if (!dragEnabled || e.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const table = tables.find((t) => t.id === tableId);
    if (!rect || !table) return;
    setSelectedId(tableId);
    suppressClickRef.current = false;
    const pointerXPx = e.clientX - rect.left;
    const pointerYPx = e.clientY - rect.top;
    dragRef.current = {
      tableId,
      pointerId: e.pointerId,
      offsetXPx: pointerXPx - (table.x / 100) * rect.width,
      offsetYPx: pointerYPx - (table.y / 100) * rect.height,
      startPointerXPx: pointerXPx,
      startPointerYPx: pointerYPx,
    };
    setDraggingId(tableId);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    e.preventDefault();
  };

  const onTablePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragEnabled) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const pointerXPx = e.clientX - rect.left;
    const pointerYPx = e.clientY - rect.top;
    if (Math.hypot(pointerXPx - drag.startPointerXPx, pointerYPx - drag.startPointerYPx) > 4) {
      suppressClickRef.current = true;
    }
    const maxLeftPx = Math.max(0, rect.width - TABLE_SIZE_PX);
    const maxTopPx = Math.max(0, rect.height - TABLE_SIZE_PX);
    const leftPx = Math.max(0, Math.min(maxLeftPx, pointerXPx - drag.offsetXPx));
    const topPx = Math.max(0, Math.min(maxTopPx, pointerYPx - drag.offsetYPx));
    const x = Number(((leftPx / rect.width) * 100).toFixed(2));
    const y = Number(((topPx / rect.height) * 100).toFixed(2));
    updateTablesOnActiveFloor((prev) => prev.map((t) => (t.id === drag.tableId ? { ...t, x, y } : t)));
    e.preventDefault();
  };

  const onTablePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDraggingId(null);
    e.preventDefault();
  };

  const onTableClick = (tableId: string) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    setSelectedId(selectedId === tableId ? null : tableId);
  };

  const statusLegend = useMemo(
    () =>
      TABLE_STATUS.map((s) => (
        <span key={s} className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${STATUS_COLORS[s]}`}>
          <span className="w-2 h-2 rounded-full bg-white/80" />
          {STATUS_LABELS[s]}
        </span>
      )),
    []
  );

  const saveBadge = saveState === 'saving'
    ? <span className="text-xs text-slate-400 animate-pulse">Sauvegarde…</span>
    : saveState === 'saved'
    ? <span className="text-xs text-emerald-400">✓ Sauvegardé</span>
    : saveState === 'error'
    ? <span className="text-xs text-red-400">Erreur de sauvegarde</span>
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Chargement du plan de salle…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Plan de salle</h2>
          {saveBadge}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeFloorId}
            onChange={(e) => { setActiveFloorId(e.target.value); setSelectedId(null); }}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
            title="Choisir la salle"
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={addFloor}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
          >
            <Plus size={18} />
            Ajouter une salle
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDragEnabled((v) => !v)}
              className={`px-3 py-2 rounded-lg text-white text-sm font-medium ${
                dragEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title="Active/désactive le drag & drop"
            >
              {dragEnabled ? 'Déplacer : ON' : 'Déplacer : OFF'}
            </button>
            <input
              type="text"
              value={floorNameDraft}
              onChange={(e) => setFloorNameDraft(e.target.value)}
              className="w-40 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
              placeholder="Nom de la salle"
            />
            <button
              type="button"
              onClick={renameActiveFloor}
              className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium"
              title="Renommer la salle"
            >
              Renommer
            </button>
            <button
              type="button"
              onClick={deleteActiveFloor}
              disabled={floors.length <= 1}
              className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50"
              title="Supprimer la salle"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={addTable}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
          >
            <Plus size={18} />
            Ajouter une table
          </button>

          <div className="flex gap-2 flex-wrap">{statusLegend}</div>
        </div>
      </div>

      <div className="card card-inner min-h-[500px] flex gap-6">
        <div
          ref={containerRef}
          className="flex-1 relative bg-slate-800/50 rounded-xl border border-slate-600"
          style={{ minHeight: 400 }}
        >
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTableClick(t.id)}
              onDoubleClick={() => cycleStatus(t.id)}
              onPointerDown={(e) => onTablePointerDown(e, t.id)}
              onPointerMove={onTablePointerMove}
              onPointerUp={onTablePointerUp}
              onPointerCancel={onTablePointerUp}
              className={`absolute w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-white text-xs font-medium transition-transform hover:scale-105 touch-none ${
                draggingId === t.id ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab'
              } ${STATUS_COLORS[t.status]} ${
                selectedId === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
              }`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              title={`${t.name} – ${STATUS_LABELS[t.status]} (double-clic : statut)`}
            >
              <span>{t.name}</span>
              <span className="opacity-80">{t.seats} p.</span>
            </button>
          ))}
        </div>

        <div className={`shrink-0 transition-all duration-200 ${panelOpen ? 'w-72' : 'w-8'}`}>
          {/* Toggle button */}
          <div className={`flex ${panelOpen ? 'justify-end mb-2' : 'justify-center'}`}>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title={panelOpen ? 'Réduire le panneau' : 'Agrandir le panneau'}
            >
              {panelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {panelOpen && (
            <div className="space-y-4">
              {selected ? (
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
                        <span className="w-10 text-center text-white font-medium">{selected.seats}</span>
                        <button
                          type="button"
                          onClick={() => updateTable(selected.id, { seats: Math.min(20, selected.seats + 1) })}
                          className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">Statut : {STATUS_LABELS[selected.status]}</p>
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
              ) : (
                <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-500 py-8">
                  <MapPin size={32} />
                  <p className="text-sm text-center">Cliquez sur une table pour modifier</p>
                  <p className="text-xs text-center">Drag & drop : déplacer la table</p>
                  <p className="text-xs text-center">Double-clic : changer le statut</p>
                </div>
              )}

              <div className="card card-inner">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Tables ({tables.length})</h3>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {tables.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex justify-between items-center ${
                          selectedId === t.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'
                        }`}
                      >
                        <span>{t.name}</span>
                        <span className="text-xs">{t.seats} p. · {STATUS_LABELS[t.status]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
