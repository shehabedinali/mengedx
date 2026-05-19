import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBuses, updateBus, deleteBus, assignDriverAsync, assignSeatMap, saveExceptions } from '@/store/slices/busSlice';
import { fetchSeatMaps } from '@/store/slices/seatMapSlice';
import { fetchDrivers } from '@/store/slices/driverSlice';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Input from '@/components/Input';

const BUS_TYPES    = ['AC', 'NON_AC', 'VIP', 'SLEEPER'];
const BUS_STATUSES = ['Active', 'Inactive', 'Maintenance', 'Retired'];

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const isExpired      = (d: string) => !!(d && new Date(d) < new Date());
const isExpiringSoon = (d: string) => { if (!d) return false; const diff = (new Date(d).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 30; };
const expiryClass    = (d: string) => isExpired(d) ? 'text-red-600 font-semibold' : isExpiringSoon(d) ? 'text-orange-500 font-semibold' : 'text-gray-800';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function ExpiryField({ label, date }: { label: string; date: string }) {
  return (
    <Field label={label}>
      <span className={expiryClass(date)}>
        {fmt(date)}
        {isExpired(date) && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Expired</span>}
        {!isExpired(date) && isExpiringSoon(date) && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Expiring soon</span>}
      </span>
    </Field>
  );
}

/* ── Layout theme per seat map ── */
const LAYOUT_THEMES: Record<string, { shell: string; front: string; aisle: string; leftIdle: string; rightIdle: string; accent: string; pill: string }> = {
  '2+2': {
    shell:    'border-indigo-200 bg-indigo-50/30',
    front:    'bg-indigo-50 border-indigo-200',
    aisle:    'border-indigo-100',
    leftIdle: 'from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-600 hover:border-indigo-500',
    rightIdle:'from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-600 hover:border-indigo-500',
    accent:   'text-indigo-400',
    pill:     'bg-indigo-50 text-indigo-600',
  },
  '1+2': {
    shell:    'border-emerald-200 bg-emerald-50/30',
    front:    'bg-emerald-50 border-emerald-200',
    aisle:    'border-emerald-100',
    leftIdle: 'from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 hover:border-emerald-500',
    rightIdle:'from-teal-50 to-teal-100 border-teal-300 text-teal-700 hover:border-teal-500',
    accent:   'text-emerald-400',
    pill:     'bg-emerald-50 text-emerald-700',
  },
  '2+1': {
    shell:    'border-violet-200 bg-violet-50/30',
    front:    'bg-violet-50 border-violet-200',
    aisle:    'border-violet-100',
    leftIdle: 'from-violet-50 to-violet-100 border-violet-300 text-violet-700 hover:border-violet-500',
    rightIdle:'from-purple-50 to-purple-100 border-purple-300 text-purple-700 hover:border-purple-500',
    accent:   'text-violet-400',
    pill:     'bg-violet-50 text-violet-700',
  },
  '3+2': {
    shell:    'border-amber-200 bg-amber-50/30',
    front:    'bg-amber-50 border-amber-200',
    aisle:    'border-amber-100',
    leftIdle: 'from-amber-50 to-amber-100 border-amber-300 text-amber-700 hover:border-amber-500',
    rightIdle:'from-orange-50 to-orange-100 border-orange-300 text-orange-700 hover:border-orange-500',
    accent:   'text-amber-400',
    pill:     'bg-amber-50 text-amber-700',
  },
};
const DEFAULT_THEME = LAYOUT_THEMES['2+2'];
function getTheme(layout?: string) { return LAYOUT_THEMES[layout ?? ''] ?? DEFAULT_THEME; }

type SeatState = 'Available' | 'Booked' | 'UnderMaintenance' | 'Blocked';

function getLayoutCode(layout: any) {
  if (typeof layout === 'string') return layout;
  if (!layout) return '';
  if (layout.leftCols != null && layout.rightCols != null) return `${layout.leftCols}+${layout.rightCols}`;
  if (layout.columns != null) return String(layout.columns);
  return '';
}

function getLayoutRows(layout: any, fallback = 11) {
  return Number(layout?.rows ?? fallback) || fallback;
}

function buildSeatLabelGrid(sections: any[], regularRows: number, seatsPerRow: number, lastRowSeats: number) {
  const labels = sections.flatMap((section) =>
    Array.from({ length: Number(section.numberofSeats ?? section.numberOfSeats ?? 0) }, (_, index) => `${section.identifier}${index + 1}`)
  );

  const grid: (string | null)[][] = Array.from({ length: regularRows }, () => Array.from({ length: seatsPerRow }, () => null));
  let slotIndex = 0;

  for (let column = 0; column < seatsPerRow; column += 1) {
    for (let row = 0; row < regularRows; row += 1) {
      grid[row][column] = labels[slotIndex] ?? null;
      slotIndex += 1;
    }
  }

  const lastRowLabels = Array.from({ length: lastRowSeats }, (_, index) => labels[slotIndex + index] ?? `L${index + 1}`);
  return { grid, lastRowLabels };
}

const SEAT_STATE_STYLES: Record<SeatState, string> = {
  Available:        '',   // handled per-type below
  Booked:           'bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-900 text-white shadow-md cursor-not-allowed opacity-80',
  UnderMaintenance: 'bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-orange-600 text-white shadow-md cursor-pointer',
  Blocked:          'bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-600 text-white shadow-md cursor-pointer',
};

const SEAT_STATE_LABEL: Record<SeatState, string> = {
  Available: '', Booked: 'sold', UnderMaintenance: 'maint', Blocked: 'block',
};

function SeatChip({ num, seatLabel, state, type, theme, onClick }: {
  num: number;
  seatLabel: string | null;
  state: SeatState;
  type: 'Window' | 'Aisle' | 'Middle';
  theme: typeof DEFAULT_THEME;
  onClick: () => void;
}) {
  const base = 'w-10 h-12 rounded-lg flex flex-col items-center justify-center font-bold select-none transition-all duration-200 relative';

  const idleByType =
    type === 'Window' ? `bg-gradient-to-br ${theme.leftIdle} hover:shadow-md hover:scale-105 cursor-pointer`
    : type === 'Middle' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-600 hover:border-purple-500 hover:shadow-md hover:scale-105 cursor-pointer'
    : `bg-gradient-to-br ${theme.rightIdle} hover:shadow-md hover:scale-105 cursor-pointer`;

  const cls = state === 'Available' ? idleByType : SEAT_STATE_STYLES[state];

  const labelColor =
    state === 'Available'
      ? (type === 'Window' ? theme.accent : type === 'Middle' ? 'text-purple-400' : theme.accent)
      : 'text-white/70';

  const statusLabel =
    state === 'Available' ? type.slice(0, 3)
    : SEAT_STATE_LABEL[state];

  return (
    <button
      type="button"
      onClick={state === 'Booked' ? undefined : onClick}
      disabled={state === 'Booked'}
      title={`Seat ${seatLabel ?? num} · ${type} · ${state}`}
      className={[base, cls].join(' ')}>
      <span className="text-[11px] font-bold leading-none tracking-wide">{seatLabel ?? num}</span>
      <span className={['text-[7px] font-semibold leading-none mt-1 uppercase tracking-wide', labelColor].join(' ')}>
        {statusLabel}
      </span>
      {/* state badge icon */}
      {state === 'Booked' && (
        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-2 h-2 text-white"><path d="M5 13l4 4L19 7"/></svg>
        </span>
      )}
      {state === 'UnderMaintenance' && (
        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-2 h-2 text-white"><path d="M12 9v4m0 3h.01"/></svg>
        </span>
      )}
      {state === 'Blocked' && (
        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-2 h-2 text-white"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </span>
      )}
    </button>
  );
}

/* ── Seat Exception Bottom Sheet ── */
function SeatExceptionSheet({ seat, currentState, seatType, onApply, onClose }: {
  seat: number;
  currentState: SeatState;
  seatType: 'Window' | 'Aisle' | 'Middle';
  onApply: (state: SeatState) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<SeatState>(currentState);

  const options: { state: SeatState; label: string; desc: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
    {
      state: 'Available',
      label: 'Available',
      desc: 'Seat is open for booking',
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-green-600">
          <path d="M5 13l4 4L19 7"/>
        </svg>
      ),
    },
    {
      state: 'UnderMaintenance',
      label: 'Under Maintenance',
      desc: 'Seat is temporarily out of service',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-orange-500">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
    },
    {
      state: 'Blocked',
      label: 'Blocked',
      desc: 'Seat is restricted from booking',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-red-500">
          <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/>
        </svg>
      ),
    },
  ];

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* dim */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* sheet */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Seat {seat} Exception</p>
              <p className="text-xs text-gray-400">{seatType} seat · current: <span className="font-semibold text-gray-600">{currentState}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* options */}
        <div className="px-5 py-4 flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Change seat state to</p>
          {options.map(opt => (
            <button
              key={opt.state}
              type="button"
              onClick={() => setPicked(opt.state)}
              className={[
                'flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all text-left',
                picked === opt.state ? `${opt.bg} ${opt.border}` : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50',
              ].join(' ')}>
              <div className={['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', picked === opt.state ? opt.bg : 'bg-gray-100'].join(' ')}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <p className={['text-sm font-bold', picked === opt.state ? opt.color : 'text-gray-800'].join(' ')}>{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
              </div>
              <div className={['w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                picked === opt.state ? `${opt.border} bg-white` : 'border-gray-200'].join(' ')}>
                {picked === opt.state && (
                  <div className={['w-2.5 h-2.5 rounded-full', opt.bg.replace('bg-', 'bg-').replace('-50', '-500')].join(' ')} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="px-5 pb-6 pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onApply(picked); onClose(); }}
            disabled={picked === currentState}
            className="flex-2 flex-1 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Apply Change
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dynamic Seat Map ── */
function SeatMap({ seatMapModel, bookedSeats, onSave, saving, saved }: {
  seatMapModel: any | null;
  bookedSeats: number[];
  onSave: (exceptions: Record<number, string>) => void;
  saving: boolean;
  saved: boolean;
}) {
  const layoutCode = getLayoutCode(seatMapModel?.layout);
  const theme = getTheme(layoutCode);
  const booked = new Set(bookedSeats);
  const [exceptions, setExceptions] = useState<Record<number, SeatState>>({});
  const [sheet, setSheet] = useState<{ num: number; type: 'Window' | 'Aisle' | 'Middle' } | null>(null);

  useEffect(() => { setExceptions({}); setSheet(null); }, [seatMapModel?._id]);

  const leftCount   = Number(seatMapModel?.layout?.leftCols ?? 2);
  const rightCount  = Number(seatMapModel?.layout?.rightCols ?? 2);
  const rows        = getLayoutRows(seatMapModel?.layout, seatMapModel?.rows ?? 11);
  const leftType    = seatMapModel?.map?.[0]?.type ?? 'Window';
  const rightType   = seatMapModel?.map?.[1]?.type ?? 'Aisle';
  const seatsPerRow = leftCount + rightCount;
  const totalSeats  = Number(seatMapModel?.numberOfSeats ?? rows * seatsPerRow);
  const regularRows = Math.max(rows - 1, 0);
  const lastRowSeats = Math.max(totalSeats - regularRows * seatsPerRow, 0);
  const sections = (seatMapModel?.map ?? []).filter((section: any) => section.identifier?.trim());
  const { grid, lastRowLabels } = buildSeatLabelGrid(sections, regularRows, seatsPerRow, lastRowSeats);
  const available   = totalSeats - bookedSeats.filter(s => s <= totalSeats).length
    - Object.values(exceptions).filter(s => s !== 'Available').length;

  const getSeatState = (n: number, _type: 'Window' | 'Aisle' | 'Middle'): SeatState => {
    if (booked.has(n)) return 'Booked';
    return exceptions[n] ?? 'Available';
  };

  const applyException = (num: number, state: SeatState) => {
    setExceptions(prev => ({ ...prev, [num]: state }));
  };

  const exceptionCounts = {
    UnderMaintenance: Object.values(exceptions).filter(s => s === 'UnderMaintenance').length,
    Blocked: Object.values(exceptions).filter(s => s === 'Blocked').length,
  };

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* no seat map warning */}
        {!seatMapModel && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-dashed border-amber-300 rounded-xl text-xs text-amber-600 font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            No seat map assigned — showing default 2+2 · 11 rows layout.
          </div>
        )}

        {/* seat map name header */}
        {seatMapModel && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${theme.shell}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${theme.pill}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{seatMapModel.code}</p>
                <p className="text-xs text-gray-400">{layoutCode || 'default'} layout · {rows} rows · {totalSeats} seats</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.pill}`}>{layoutCode || 'default'}</span>
          </div>
        )}

        {/* config pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            {rows} rows
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.pill} text-xs font-semibold`}>
            ← {leftCount} {leftType}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.pill} border border-gray-200 text-xs font-semibold`}>
            {rightCount} {rightType} →
          </span>
          <span className="ml-auto text-xs font-semibold text-gray-500">{available} / {totalSeats} available</span>
        </div>

        {/* exception summary badges + save */}
        {(exceptionCounts.UnderMaintenance > 0 || exceptionCounts.Blocked > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {exceptionCounts.UnderMaintenance > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                  <path d="M12 9v4m0 3h.01"/>
                </svg>
                {exceptionCounts.UnderMaintenance} Under Maintenance
              </span>
            )}
            {exceptionCounts.Blocked > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-xs font-semibold text-red-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                {exceptionCounts.Blocked} Blocked
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setExceptions({})}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium">
                Clear
              </button>
              <button
                onClick={() => onSave(exceptions)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {saving ? (
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                ) : saved ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                )}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* legend */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 inline-block" />Window</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 inline-block" />Aisle</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 inline-block" />Middle</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-gray-700 to-gray-900 inline-block" />Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-orange-400 to-orange-600 inline-block" />Maintenance</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-gradient-to-br from-red-400 to-red-600 inline-block" />Blocked</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-4 rounded bg-blue-100 border-2 border-blue-300 inline-block" />Driver</span>
        </div>

        {/* bus shell */}
        <div className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300 ${theme.shell}`}>
          {/* front */}
          <div className={`flex items-center justify-between px-5 py-3 border-b-2 border-dashed transition-colors duration-300 ${theme.front}`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <path d="M3 17l2-8h14l2 8H3z"/><path d="M5 17v2h2v-2M17 17v2h2v-2"/><path d="M3 17h18"/>
              </svg>
              Front
            </div>
            <div className="w-10 h-12 rounded-lg bg-blue-50 border-2 border-blue-300 flex flex-col items-center justify-center gap-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-500">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span className="text-[8px] text-blue-400 font-bold uppercase">Driver</span>
            </div>
          </div>

          {/* seat grid */}
          <div className="px-4 py-3 flex flex-col gap-2 overflow-y-auto max-h-[520px]">
            {Array.from({ length: regularRows }).map((_, rowIdx) => {
              const base      = rowIdx * seatsPerRow;
              const leftNums  = Array.from({ length: leftCount },  (_, i) => base + i + 1);
              const rightNums = Array.from({ length: rightCount }, (_, i) => base + leftCount + i + 1);
              return (
                <div key={rowIdx} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 w-5 text-right shrink-0 font-mono">{rowIdx + 1}</span>
                  <div className="flex gap-1.5">
                    {leftNums.map((n, colIdx) => (
                      <SeatChip key={n} num={n} seatLabel={grid[rowIdx]?.[colIdx] ?? null} state={getSeatState(n, leftType)} type={leftType} theme={theme}
                        onClick={() => setSheet({ num: n, type: leftType })} />
                    ))}
                  </div>
                  <div className={`flex-1 border-b border-dashed ${theme.aisle}`} />
                  <div className="flex gap-1.5">
                    {rightNums.map((n, colIdx) => (
                      <SeatChip key={n} num={n} seatLabel={grid[rowIdx]?.[leftCount + colIdx] ?? null} state={getSeatState(n, rightType)} type={rightType} theme={theme}
                        onClick={() => setSheet({ num: n, type: rightType })} />
                    ))}
                  </div>
                </div>
              );
            })}

            {lastRowSeats > 0 && (
              <div className="flex items-center gap-2 border-t border-dashed border-gray-200 pt-2 mt-1">
                <span className="text-[10px] text-gray-300 w-5 text-right shrink-0 font-mono">{rows}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: lastRowSeats }).map((_, index) => {
                    const seatNumber = regularRows * seatsPerRow + index + 1;
                    return (
                      <SeatChip
                        key={`last-${index}`}
                        num={seatNumber}
                        seatLabel={lastRowLabels[index] ?? `L${index + 1}`}
                        state={getSeatState(seatNumber, 'Middle')}
                        type="Middle"
                        theme={theme}
                        onClick={() => setSheet({ num: seatNumber, type: 'Middle' })}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* rear */}
          <div className={`px-5 py-3 border-t-2 border-dashed flex justify-center transition-colors duration-300 ${theme.front}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Rear</span>
          </div>
        </div>
      </div>

      {/* exception bottom sheet */}
      {sheet && (
        <SeatExceptionSheet
          seat={sheet.num}
          seatType={sheet.type}
          currentState={getSeatState(sheet.num, sheet.type)}
          onApply={(state) => applyException(sheet.num, state)}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

/* ── Assign Seat Map Panel ── */
function AssignSeatMap({ bus, seatMaps, onAssign, previewId, onPreview, saving, saved }: {
  bus: any;
  seatMaps: any[];
  onAssign: (seatMapId: string) => void;
  previewId: string | null;
  onPreview: (id: string) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const assignedId = bus.seatMap?._id ?? bus.seatMap;
  const displayId  = previewId ?? assignedId;
  const assigned   = seatMaps.find(sm => sm._id === displayId);
  const q = search.toLowerCase();
  
  // Calculate bus capacity
  const busCapacity = Number(bus.capacity) || 0;
  
  // Filter seat maps by search AND by matching capacity
  const filtered = seatMaps.filter(sm => {
    // Get seat map total seats (use the stored numberOfSeats field)
    const smTotal = sm.numberOfSeats || 0;
    
    // If search is empty, show all matching by capacity
    if (!q) {
      return smTotal === busCapacity;
    }
    
    // If search term provided, match by search OR by capacity
    const matchesSearch = 
      sm.code?.toLowerCase().includes(q) ||
      sm.layout?.toLowerCase?.().includes(q) ||
      String(sm.layout?.rows || sm.rows).includes(q);
    
    return matchesSearch || smTotal === busCapacity;
  });

  const theme = getTheme(getLayoutCode(assigned?.layout));
  const isDirty = previewId && previewId !== assignedId;

  return (
    <div className="relative">
      {/* trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={[
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left',
          open ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400 bg-white',
        ].join(' ')}
      >
        {assigned ? (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.pill}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{assigned.code}</p>
              <p className="text-xs text-gray-400">
                {getLayoutRows(assigned?.layout, assigned?.rows ?? 11)} rows · {assigned.numberOfSeats} seats
              </p>
            </div>
            {isDirty && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">unsaved</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">Select a seat map…</span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search by code, layout or rows…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* options */}
          <div className="flex flex-col max-h-56 overflow-y-auto p-1.5 gap-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-5">No seat maps match "{search}".</p>
            )}
            {filtered.map(sm => {
              const isAssigned = sm._id === assignedId;
              const isPreviewing = sm._id === displayId;
              const t = getTheme(getLayoutCode(sm.layout));
              return (
                <button key={sm._id}
                  onClick={() => { onPreview(sm._id); setOpen(false); }}
                  className={[
                    'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left',
                    isPreviewing ? 'bg-gray-900 text-white' : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPreviewing ? 'bg-white/10' : t.pill}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                        className={`w-4 h-4 ${isPreviewing ? 'text-white' : ''}`}>
                        <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isPreviewing ? 'text-white' : 'text-gray-800'}`}>{sm.code}</p>
                      <p className={`text-xs ${isPreviewing ? 'text-gray-300' : 'text-gray-400'}`}>
                        {getLayoutRows(sm.layout, sm.rows ?? 11)} rows · {sm.numberOfSeats} seats
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAssigned && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isPreviewing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                      }`}>assigned</span>
                    )}
                    {!isPreviewing && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300"><path d="M9 18l6-6-6-6"/></svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* close on outside click */}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      {/* assign button — only shown when preview differs from assigned */}
      {isDirty && (
        <button
          onClick={() => onAssign(previewId!)}
          disabled={saving}
          className="mt-2 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          ) : saved ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : `Assign "${assigned?.code}"`}
        </button>
      )}
    </div>
  );
}

/* ── Assign Driver Panel ── */
function AssignDriver({ bus, drivers, onAssign, saving }: {
  bus: any;
  drivers: any[];
  onAssign: (driverId: string | null) => void;
  saving: boolean;
}) {
  const [open, setOpen]             = useState(false);
  const [search, setSearch]         = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // driver can be a populated object or just an ID string
  const assignedDriver = bus.driver?._id ? bus.driver : drivers.find(d => d._id === bus.driver);
  const roster   = drivers.filter(d => d.status === 'Active' && d._id !== (assignedDriver?._id ?? bus.driver));
  const filtered = roster.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const selected = drivers.find(d => d._id === selectedId);

  const initials = (name: string) => name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  useEffect(() => { setSelectedId(null); setOpen(false); setSearch(''); }, [bus.driver]);

  return (
    <div className="flex flex-col gap-5">

      {/* currently assigned */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Currently Assigned Driver</p>
        {assignedDriver ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center">
                {initials(assignedDriver.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900 truncate">{assignedDriver.name}</p>
                <span className="shrink-0 text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Assigned</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{assignedDriver.licenseNumber} · {assignedDriver.phone}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{assignedDriver.totalTrips ?? 0} trips</span>
                {assignedDriver.address?.city && <span>· {assignedDriver.address.city}</span>}
                <span className={`font-semibold ${
                  assignedDriver.status === 'Active' ? 'text-green-600' : 'text-orange-500'
                }`}>· {assignedDriver.status}</span>
              </div>
            </div>
            <button
              onClick={() => onAssign(null)}
              disabled={saving}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-dashed border-amber-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-amber-500 shrink-0">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <p className="text-sm text-amber-700 font-medium">No driver assigned to this bus.</p>
          </div>
        )}
      </div>

      {/* picker */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {assignedDriver ? 'Change Driver' : 'Assign a Driver'}
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setOpen(o => !o); setSearch(''); setSelectedId(null); }}
            className={[
              'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all',
              open ? 'border-gray-900 bg-white' : 'border-gray-200 hover:border-gray-400 bg-white',
            ].join(' ')}
          >
            {selected ? (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials(selected.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.licenseNumber}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Choose a driver…</span>
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {open && (
            <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input autoFocus type="text" placeholder="Search by name or license…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
              </div>
              <div className="flex flex-col max-h-56 overflow-y-auto p-1.5 gap-0.5">
                {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-5">No active drivers found.</p>}
                {filtered.map(d => {
                  const isSel = selectedId === d._id;
                  return (
                    <button key={d._id} onClick={() => { setSelectedId(d._id); setOpen(false); }}
                      className={['flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left', isSel ? 'bg-gray-900' : 'hover:bg-gray-50'].join(' ')}>
                      <div className={['w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', isSel ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600'].join(' ')}>
                        {initials(d.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSel ? 'text-white' : 'text-gray-900'}`}>{d.name}</p>
                        <p className={`text-xs truncate ${isSel ? 'text-gray-300' : 'text-gray-400'}`}>{d.licenseNumber} · {d.totalTrips ?? 0} trips</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${isSel ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>Active</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
        </div>
      </div>

      {/* confirm assign */}
      {selected && !open && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-900 bg-gray-50">
            <div className="w-12 h-12 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {initials(selected.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selected.licenseNumber} · {selected.phone} · {selected.totalTrips ?? 0} trips</p>
            </div>
            <button onClick={() => setSelectedId(null)}
              className="shrink-0 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 text-gray-600">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <button onClick={() => onAssign(selectedId)} disabled={saving}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            ) : null}
            {saving ? 'Saving…' : `Assign ${selected.name}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function BusDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: buses, loading } = useAppSelector(s => s.buses);
  const { data: drivers }        = useAppSelector(s => s.drivers);
  const { data: seatMaps }       = useAppSelector((s: any) => s.seatMaps);


  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [driverWarning, setDriverWarning] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [tab, setTab]   = useState<'info' | 'seats' | 'driver'>('info');
  const [previewSeatMapId, setPreviewSeatMapId] = useState<string | null>(null);
  const [savingExc, setSavingExc] = useState(false);
  const [excSaved, setExcSaved]   = useState(false);
  const [driverSaving, setDriverSaving] = useState(false);
  const [seatMapSaving, setSeatMapSaving] = useState(false);
  const [seatMapSaved, setSeatMapSaved]   = useState(false);

  useEffect(() => {
    if (!buses.length)    dispatch(fetchBuses());
    if (!drivers.length)  dispatch(fetchDrivers());
    if (!seatMaps.length) dispatch(fetchSeatMaps());
  }, [dispatch, buses.length, drivers.length, seatMaps.length]);

  const bus = buses.find((b: any) => b._id === id);

  useEffect(() => {
    if (bus) {
      setForm({
        name: bus.name ?? '', plateNumber: bus.plateNumber ?? '', capacity: String(bus.capacity ?? ''),
        type: bus.type ?? 'AC', status: bus.status ?? 'Active',
        lastMaintenanceDate: bus.lastMaintenanceDate?.slice(0, 10) ?? '',
        insuranceExpiry: bus.insuranceExpiry?.slice(0, 10) ?? '',
        registrationExpiry: bus.registrationExpiry?.slice(0, 10) ?? '',
      });
      const currentSeatMapId = bus.seatMap?._id ?? bus.seatMap ?? null;
      setPreviewSeatMapId(currentSeatMapId);
    }
  }, [bus]);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateBus({ id: id!, data: form }));
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await dispatch(deleteBus(id!));
    navigate('/buses');
  };

  const handleAssign = async (driverId: string | null) => {
    setDriverSaving(true);
    await dispatch(assignDriverAsync({ busId: id!, driverId }));
    setDriverSaving(false);
  };

  const handleSaveExceptions = async (exceptions: Record<number, string>) => {
    setSavingExc(true); setExcSaved(false);
    await dispatch(saveExceptions({ busId: id!, exceptions }));
    setSavingExc(false); setExcSaved(true);
    setTimeout(() => setExcSaved(false), 3000);
  };

  const handleAssignSeatMap = async (seatMapId: string) => {
    setSeatMapSaving(true); setSeatMapSaved(false);
    await dispatch(assignSeatMap({ busId: id!, seatMapId }));
    setSeatMapSaving(false); setSeatMapSaved(true);
    setPreviewSeatMapId(seatMapId);
    setTimeout(() => setSeatMapSaved(false), 3000);
  };

  if (loading && !bus) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-gray-400 text-sm">Bus not found.</p>
        <Button variant="secondary" onClick={() => navigate('/buses')}>← Back to Buses</Button>
      </div>
    );
  }

  const bookedSeats = bus.bookedSeats ?? [];
  const occupancy   = bus.capacity ? Math.round((bookedSeats.length / bus.capacity) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/buses')} className="text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
          Buses
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{bus.name}</span>
      </div>

      {/* hero card */}
      <Card className="flex flex-col gap-0">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-500">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M7 18v2M17 18v2"/>
                <circle cx="7" cy="15" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{bus.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{bus.plateNumber} · <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{bus.type?.replace('_',' ')}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={bus.status ?? 'Inactive'} />
          </div>
        </div>

        {/* occupancy bar */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Seat occupancy</span>
            <span className="font-semibold text-gray-700">{bookedSeats.length} / {bus.capacity} booked ({occupancy}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        {/* action row */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <Button onClick={() => setEditOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </Button>
          {!confirmDelete ? (
            <Button variant="secondary" onClick={() => {
              const hasDriver = !!(bus.driver?._id ?? bus.driver);
              if (hasDriver) { setDriverWarning(true); } else { setConfirm(true); }
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 mr-1.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Delete <strong>{bus.name}</strong>?</p>
              <Button variant="danger" size="sm" onClick={handleDelete}>Yes, Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </Card>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['info', 'seats', 'driver'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black',
            ].join(' ')}
          >
            {t === 'seats' ? 'Seat Map' : t === 'driver' ? 'Assign Driver' : 'Info'}
          </button>
        ))}
      </div>

      {/* tab panels */}
      <Card className="animate-fade-in" key={tab}>
        {tab === 'info' && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            <Field label="Bus Type">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {bus.type?.replace('_', ' ') ?? '—'}
              </span>
            </Field>
            <Field label="Seating Capacity">
              <span className="text-2xl font-bold text-gray-900">{bus.capacity}</span>
              <span className="text-sm text-gray-400 ml-1">seats</span>
            </Field>
            <ExpiryField label="Insurance Expiry"    date={bus.insuranceExpiry} />
            <ExpiryField label="Registration Expiry" date={bus.registrationExpiry} />
            <Field label="Last Maintenance">{fmt(bus.lastMaintenanceDate)}</Field>
            <Field label="Assigned Driver">
              {drivers.find((d: any) => d._id === bus.driver)?.name ?? (
                <span className="text-gray-400 italic">None</span>
              )}
            </Field>
          </div>
        )}

        {tab === 'seats' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Assign Seat Map</p>
              <AssignSeatMap
                bus={bus}
                seatMaps={seatMaps}
                onAssign={handleAssignSeatMap}
                previewId={previewSeatMapId}
                onPreview={setPreviewSeatMapId}
                saving={seatMapSaving}
                saved={seatMapSaved}
              />
            </div>
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Seat Map Preview</p>
              <SeatMap
                seatMapModel={seatMaps.find((sm: any) => sm._id === (previewSeatMapId ?? bus.seatMap?._id ?? bus.seatMap)) ?? null}
                bookedSeats={bookedSeats}
                onSave={handleSaveExceptions}
                saving={savingExc}
                saved={excSaved}
              />
            </div>
          </div>
        )}

        {tab === 'driver' && (
          <AssignDriver bus={bus} drivers={drivers} onAssign={handleAssign} saving={driverSaving} />
        )}
      </Card>

      {/* Driver Warning Modal */}
      <Modal open={driverWarning} onClose={() => setDriverWarning(false)} title="Cannot Delete Bus">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-amber-600">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">This bus has an assigned driver</p>
              <p className="text-xs text-gray-500 mt-1">
                Remove the assigned driver before deleting this bus. Go to the <strong>Assign Driver</strong> tab and click Remove.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDriverWarning(false)}>Cancel</Button>
            <Button onClick={() => { setDriverWarning(false); setTab('driver'); }}>Go to Assign Driver</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Bus">
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bus Name *" value={form.name} onChange={e => set('name', e.target.value)} required />
              <Input label="Plate Number *" value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Capacity *" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Bus Type *</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.type} onChange={e => set('type', e.target.value)}>
                  {BUS_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                {BUS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Insurance Expiry" type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
              <Input label="Registration Expiry" type="date" value={form.registrationExpiry} onChange={e => set('registrationExpiry', e.target.value)} />
            </div>
            <Input label="Last Maintenance Date" type="date" value={form.lastMaintenanceDate} onChange={e => set('lastMaintenanceDate', e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
