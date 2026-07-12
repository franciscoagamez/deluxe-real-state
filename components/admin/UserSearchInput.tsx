'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface UserSearchInputProps {
  initialValue: string;
}

export default function UserSearchInput({ initialValue }: UserSearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);

  if (initialValue !== prevInitialValue) {
    setValue(initialValue);
    setPrevInitialValue(initialValue);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // reset page to 1 on search
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full md:w-80">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons text-nordic/40 group-focus-within:text-primary text-xl">
          search
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-white dark:bg-gray-800 text-nordic dark:text-white shadow-soft placeholder-nordic/30 focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm outline-none"
        placeholder="Search by name, email..."
      />
    </form>
  );
}
