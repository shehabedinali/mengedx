type Status = 'planned' | 'boarding' | 'departed' | 'completed' | 'cancelled' | 'active' | 'inactive' | 'paid' | 'unpaid' | 'checked-in' | 'pending';

const map: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  boarding: 'bg-blue-100 text-blue-700',
  departed: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  'checked-in': 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function Badge({ status }: { status: string }) {
  const cls = map[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
