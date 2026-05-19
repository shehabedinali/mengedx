import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSeatMaps, createSeatMap, updateSeatMap, deleteSeatMap } from '@/store/slices/seatMapSlice';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

type Section = { identifier: string; numberofSeats: number; spaceAt: number };

const emptySection = (): Section => ({ identifier: '', numberofSeats: 1, spaceAt: 0 });

const emptyForm = () => ({
  code: '',
  rows: 10,
  numberofLastRowSeats: 5,
  leftCols: 2,
  rightCols: 2,
  map: [],
});

const totalSeats = (leftCols: number, rightCols: number, rows: number, lastRow: number) =>
  (leftCols + rightCols) * (rows - 1) + lastRow;

// ─── Bus Row Grid ─────────────────────────────────────────────────────────────
// Seats fill row by row (left→right across all columns, then next row).
// spaceAt inserts a blank cell after every N seats of that identifier.
// Last row spans full width with no aisle.
function BusGrid({ map, rows, lastRowSeats, compact = false, leftCols = 2, rightCols = 2 }: {
  map: Section[]; rows: number; lastRowSeats: number;
  compact?: boolean; leftCols?: number; rightCols?: number;
}) {
  const valid = map.filter(s => s.identifier.trim() && s.numberofSeats > 0);
  if (valid.length === 0) return null;

  const totalCols   = leftCols + rightCols;
  const regularRows = Math.max(1, rows - 1);
  const showRows    = compact ? Math.min(regularRows, 3) : regularRows;
  const sz    = compact ? 'w-6 h-6 text-[7px]' : 'w-8 h-8 text-[8px]';
  const numSz = compact ? 'w-4 text-[8px]'      : 'w-5 text-[9px]';

  // Build flat seat labels only (no gap slots — gaps are visual only)
  const slots: string[] = [];
  valid.forEach(s => {
    for (let i = 1; i <= s.numberofSeats; i++) slots.push(`${s.identifier}${i}`);
  });

  // Place slots into grid[row][col], wrapping at totalCols
  const grid: (string | null)[][] = Array.from({ length: regularRows }, () =>
    Array(totalCols).fill(null)
  );
  let slotIdx = 0;
  for (let row = 0; row < regularRows && slotIdx < slots.length; row++) {
    for (let col = 0; col < totalCols && slotIdx < slots.length; col++) {
      grid[row][col] = slots[slotIdx++];
    }
  }

  // For each seat label, determine if a walkway should appear AFTER it
  // walkway appears after every spaceAt-th seat of its identifier
  const walkwayAfter = new Set<string>();
  valid.forEach(s => {
    if (s.spaceAt <= 0) return;
    for (let i = s.spaceAt; i <= s.numberofSeats; i += s.spaceAt)
      walkwayAfter.add(`${s.identifier}${i}`);
  });

  // For a given cell in the grid, should there be a walkway after it?
  // Yes if the seat label is in walkwayAfter AND the next cell is in the same row
  const hasWalkwayAfter = (rowIdx: number, colIdx: number) => {
    const label = grid[rowIdx]?.[colIdx];
    return label ? walkwayAfter.has(label) : false;
  };

  const seatBox = (label: string | null, dark = false, key?: string) => (
    <div
      key={key}
      className={`${sz} rounded-md flex items-center justify-center shrink-0 font-mono border ${
        label
          ? dark
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-gray-100 border-gray-200 text-gray-500'
          : 'bg-transparent border-transparent'
      }`}
    >
      {label ?? ''}
    </div>
  );

  const aisle = (
    <div className={`shrink-0 flex items-center justify-center ${compact ? 'px-1' : 'px-2'}`}>
      <div className={`border-l-2 border-dashed border-gray-200 ${compact ? 'h-5' : 'h-7'}`} />
    </div>
  );

  const renderRow = (rowIdx: number) => (
    <div key={rowIdx} className="flex items-center">
      <span className={`shrink-0 font-mono text-gray-300 text-right mr-1 ${numSz}`}>{rowIdx + 1}</span>
      <div className="flex items-center gap-0.5">
        {grid[rowIdx].slice(0, leftCols).map((cell, ci) => (
          <>
            {seatBox(cell, false, `l-${rowIdx}-${ci}`)}
            {hasWalkwayAfter(rowIdx, ci) && ci < leftCols - 1 && (
              <div key={`lw-${rowIdx}-${ci}`} className={`shrink-0 border-l-2 border-dashed border-yellow-300 ${compact ? 'h-5' : 'h-7'}`} />
            )}
          </>
        ))}
      </div>
      {aisle}
      <div className="flex items-center gap-0.5">
        {grid[rowIdx].slice(leftCols).map((cell, ci) => (
          <>
            {seatBox(cell, false, `r-${rowIdx}-${ci}`)}
            {hasWalkwayAfter(rowIdx, leftCols + ci) && ci < rightCols - 1 && (
              <div key={`rw-${rowIdx}-${ci}`} className={`shrink-0 border-l-2 border-dashed border-yellow-300 ${compact ? 'h-5' : 'h-7'}`} />
            )}
          </>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {/* column header */}
      <div className="flex items-center">
        <span className={`shrink-0 mr-1 ${numSz}`} />
        <div className="flex gap-0.5">
          {Array.from({ length: leftCols }, (_, i) => (
            <div key={i} className={`${compact ? 'w-6' : 'w-8'} flex items-center justify-center`}>
              <span className={`font-bold text-gray-300 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>C{i + 1}</span>
            </div>
          ))}
        </div>
        {aisle}
        <div className="flex gap-0.5">
          {Array.from({ length: rightCols }, (_, i) => (
            <div key={i} className={`${compact ? 'w-6' : 'w-8'} flex items-center justify-center`}>
              <span className={`font-bold text-gray-300 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>C{leftCols + i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {Array.from({ length: showRows }, (_, i) => renderRow(i))}

      {compact && regularRows > 3 && (
        <div className={`text-gray-300 pl-5 ${numSz}`}>⋮ {regularRows - 3} more rows</div>
      )}

      {/* last row — full width, no aisle */}
      <div className="flex items-center border-t border-dashed border-gray-200 pt-1 mt-0.5">
        <span className={`shrink-0 font-mono font-bold text-gray-400 text-right mr-1 ${numSz}`}>{rows}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(lastRowSeats, compact ? 8 : 16) }, (_, i) =>
            seatBox(`L${i + 1}`, true, `last-${i}`)
          )}
          {lastRowSeats > (compact ? 8 : 16) && (
            <span className="text-[9px] text-gray-400 self-center ml-1">+{lastRowSeats - (compact ? 8 : 16)}</span>
          )}
        </div>
      </div>

      {!compact && (
        <p className="text-[10px] font-bold text-gray-600 pt-1">
          {totalSeats(leftCols, rightCols, rows, lastRowSeats)} total seats
        </p>
      )}
    </div>
  );
}

// ─── Seat Map Card ────────────────────────────────────────────────────────────
function SeatMapCard({ sm, onEdit, onDelete }: { sm: any; onEdit: () => void; onDelete: () => void }) {
  const sections = (sm.map ?? []).filter((s: any) => s.identifier?.trim());
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-400 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900 font-mono">{sm.code}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {sm.layout?.rows ?? '?'} rows · {sections.length} identifier{sections.length !== 1 ? 's' : ''} · {sm.numberOfSeats ?? 0} seats
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">
          {sm.layout?.columns ?? sections.length} cols
        </span>
      </div>

      <BusGrid
        map={sections}
        rows={sm.layout?.rows ?? 5}
        lastRowSeats={sm.numberofLastRowSeats ?? 0}
        leftCols={sm.layout?.leftCols ?? 2}
        rightCols={sm.layout?.rightCols ?? 2}
        compact
      />

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          {sm.createdAt ? new Date(sm.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </p>
        <div className="flex gap-1">
          <button onClick={onEdit}   className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors">Edit</button>
          <button onClick={onDelete} className="text-xs font-semibold text-red-400 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SeatMaps() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((s: any) => s.seatMaps);

  const [open,      setOpen]      = useState(false);
  const [editing,   setEditing]   = useState<any>(null);
  const [form,      setForm]      = useState<any>(emptyForm());
  const [search,    setSearch]    = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);



  useEffect(() => { dispatch(fetchSeatMaps()); }, [dispatch]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // map entry helpers
  const addSection    = () => set('map', [...form.map, emptySection()]);
  const removeSection = (i: number) => set('map', form.map.filter((_: any, idx: number) => idx !== i));
  const updateSection = (i: number, field: keyof Section, val: any) =>
    set('map', form.map.map((s: Section, idx: number) =>
      idx === i
        ? { ...s, [field]: field === 'identifier' ? val.toUpperCase().slice(0, 3) : Math.max(0, Math.min(50, Number(val))) }
        : s
    ));

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (sm: any) => {
    setEditing(sm);
    setForm({
      code: sm.code ?? '',
      rows: sm.layout?.rows ?? 10,
      numberofLastRowSeats: sm.numberofLastRowSeats ?? 5,
      leftCols: sm.layout?.leftCols ?? 2,
      rightCols: sm.layout?.rightCols ?? 2,
      map: sm.map?.length ? sm.map.map((s: any) => ({ identifier: s.identifier, numberofSeats: s.numberofSeats ?? 1, spaceAt: s.spaceAt ?? 0 })) : [],
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMap = form.map.filter((s: Section) => s.identifier.trim());
    const payload = {
      code:                 form.code,
      layout: { rows: Number(form.rows), columns: Number(form.leftCols) + Number(form.rightCols), leftCols: Number(form.leftCols), rightCols: Number(form.rightCols) },
      numberofLastRowSeats: Number(form.numberofLastRowSeats),
      numberOfSeats: totalSeats(Number(form.leftCols), Number(form.rightCols), Number(form.rows), Number(form.numberofLastRowSeats)),
      map:                  validMap,
    };
    if (editing) await dispatch(updateSeatMap({ id: editing._id, data: payload }));
    else         await dispatch(createSeatMap(payload));
    setOpen(false);
  };

  const filtered = data.filter((s: any) => {
    const q = search.toLowerCase();
    return s.code?.toLowerCase().includes(q);
  });

  const validMap  = form.map.filter((s: Section) => s.identifier.trim());
  const required  = totalSeats(Number(form.leftCols), Number(form.rightCols), Number(form.rows), Number(form.numberofLastRowSeats));
  const actual    = validMap.reduce((sum: number, s: Section) => sum + s.numberofSeats, 0) + Number(form.numberofLastRowSeats);
  const seatsOk   = actual === required;

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} seat map{data.length !== 1 ? 's' : ''}</p>
        <Button onClick={openAdd}>+ Create Seat Map</Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Maps', value: data.length },
          { label: 'Avg Seats',  value: data.length ? Math.round(data.reduce((a: number, s: any) => a + (s.numberOfSeats ?? 0), 0) / data.length) : 0 },
          { label: 'Max Seats',  value: data.length ? Math.max(...data.map((s: any) => s.numberOfSeats ?? 0)) : 0 },
          { label: 'Min Seats',  value: data.length ? Math.min(...data.map((s: any) => s.numberOfSeats ?? 0)) : 0 },
        ].map(s => (
          <Card key={s.label} className="flex flex-col gap-1 py-4 px-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search by code…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white" />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <p className="text-sm text-gray-400">No seat maps found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((sm: any) => (
            <SeatMapCard key={sm._id} sm={sm} onEdit={() => openEdit(sm)} onDelete={() => setConfirmId(sm._id)} />
          ))}
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
            <p className="text-sm font-bold text-gray-900">Delete this seat map?</p>
            <p className="text-xs text-gray-400">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={async () => { await dispatch(deleteSeatMap(confirmId)); setConfirmId(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit Seat Map' : 'Create Seat Map'}
        subtitle="Define identifiers and how many seats each one covers">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Map Code *</label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. STD-45" required
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>

          {/* layout columns */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-600">Left Side Columns</label>
              <input type="number" min={1} max={10} value={form.leftCols}
                onChange={e => set('leftCols', Math.max(1, Number(e.target.value)))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-600">Right Side Columns</label>
              <input type="number" min={1} max={10} value={form.rightCols}
                onChange={e => set('rightCols', Math.max(1, Number(e.target.value)))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
          </div>

          {/* rows + last row */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-600">Number of Rows *</label>
              <input type="number" min={2} max={50} value={form.rows} onChange={e => set('rows', Number(e.target.value))} required
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              <p className="text-[10px] text-gray-400">Includes the last row</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-gray-600">Last Row Seats *</label>
              <input type="number" min={1} max={20} value={form.numberofLastRowSeats} onChange={e => set('numberofLastRowSeats', Number(e.target.value))} required
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
          </div>

          {/* dynamic identifier entries */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Seat Identifiers *</label>
              <button type="button" onClick={addSection}
                className="text-xs font-semibold text-gray-900 hover:text-gray-600 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                + Add
              </button>
            </div>

            <p className="text-[10px] text-gray-400">
              Each identifier + number generates that many seats per row. <span className="font-semibold text-gray-600">A + 4</span> → A1, A2, A3, A4 per row.
            </p>

            <div className="flex flex-col gap-2">
              {form.map.map((s: Section, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">

                  {/* identifier */}
                  <div className="flex flex-col gap-1 items-center shrink-0">
                    <label className="text-[9px] font-semibold text-gray-400 uppercase">ID</label>
                    <input
                      value={s.identifier}
                      onChange={e => updateSection(i, 'identifier', e.target.value)}
                      maxLength={3}
                      placeholder="A"
                      required
                      className="w-14 h-10 border-2 border-gray-900 rounded-xl text-center text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-gray-900 bg-gray-900 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <span className="text-gray-300 font-bold text-lg shrink-0">×</span>

                  {/* seat count */}
                  <div className="flex flex-col gap-1 items-center shrink-0">
                    <label className="text-[9px] font-semibold text-gray-400 uppercase">Seats</label>
                    <input
                      type="number" min={1} max={50}
                      value={s.numberofSeats}
                      onChange={e => updateSection(i, 'numberofSeats', e.target.value)}
                      className="w-16 h-10 border-2 border-gray-200 rounded-xl text-center text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* generated labels preview */}
                  <div className="flex-1 flex flex-wrap gap-1 min-w-0">
                    {s.identifier.trim() && Array.from({ length: Math.min(s.numberofSeats, 5) }, (_, j) => (
                      <span key={j} className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                        s.spaceAt > 0 && (j + 1) % s.spaceAt === 0
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}>
                        {s.identifier}{j + 1}
                      </span>
                    ))}
                    {s.identifier.trim() && s.numberofSeats > 5 && (
                      <span className="text-[10px] text-gray-400 self-center">…{s.identifier}{s.numberofSeats}</span>
                    )}
                  </div>

                  {/* remove */}
                  {form.map.length > 1 && (
                    <button type="button" onClick={() => removeSection(i)}
                      className="shrink-0 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-red-400">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* live preview */}
          {validMap.length > 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col items-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Preview</p>
              <BusGrid map={validMap} rows={form.rows} lastRowSeats={form.numberofLastRowSeats} leftCols={form.leftCols} rightCols={form.rightCols} />
            </div>
          )}

          {/* summary bar */}
          {validMap.length > 0 && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs ${
              seatsOk ? 'bg-gray-900 text-white' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
                {seatsOk
                  ? <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>
                  : <><circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/></>
                }
              </svg>
              <span>
                <span className="font-bold">{actual} / {required} seats</span>
                {seatsOk
                  ? <>{' '}— ({form.leftCols} + {form.rightCols}) × {form.rows - 1} rows + {form.numberofLastRowSeats} last row</>
                  : <>{' '}— {required - actual > 0 ? `need ${required - actual} more` : `remove ${actual - required}`} to match layout</>
                }
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={validMap.length === 0 || !seatsOk}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 active:scale-[0.98] transition-all">
              {editing ? 'Save Changes' : 'Create Seat Map'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
