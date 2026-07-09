'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

interface AdminSearchInputProps {
  placeholder: string;
}

export default function AdminSearchInput({ placeholder }: AdminSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      params.set('page', '1'); // Reset to first page
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative group w-full md:w-80">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-nordic/40 group-focus-within:text-primary text-xl">
          search
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2.5 border border-nordic/10 rounded-lg bg-white text-nordic shadow-soft placeholder-nordic/30 focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm outline-none w-full"
      />
      {isPending && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
