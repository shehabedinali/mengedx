import type { ReactNode } from 'react';

interface Column { key: string; label: string; render?: (row: any) => ReactNode; }
interface Props {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export default function Table({ columns, data, loading, emptyMessage = 'No data found', onRowClick }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton rounded-xl h-20" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-200">
          <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/>
        </svg>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const dataCols   = columns.filter(c => c.key !== 'actions' && c.key !== 'Update');
  const actionCols = columns.filter(c => c.key === 'actions' || c.key === 'Update');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
      {data.map((row, i) => (
        <div
          key={row._id ?? i}
          onClick={() => onRowClick?.(row)}
          className={[
            'animate-card-in rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3',
            'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
            onRowClick ? 'cursor-pointer' : '',
          ].join(' ')}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* fields */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {dataCols.map(col => (
              <div key={col.key} className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{col.label}</span>
                <div className="text-sm font-medium text-gray-800 truncate">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </div>
              </div>
            ))}
          </div>

          {/* actions */}
          {actionCols.length > 0 && (
            <div
              className="flex items-center gap-2 pt-2.5 border-t border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              {actionCols.map(col => (
                <div key={col.key}>{col.render ? col.render(row) : null}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
