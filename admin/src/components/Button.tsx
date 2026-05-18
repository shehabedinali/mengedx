import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-black text-white hover:bg-neutral-700 active:bg-neutral-800',
    secondary: 'bg-white border border-gray-300 text-black hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
