'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 flex items-center justify-center border border-mosque/10 min-h-[250px]">
      <div className="flex flex-col items-center gap-2 text-nordic/40">
        <span className="material-icons animate-spin text-3xl">map</span>
        <span className="text-sm font-medium">Loading Map...</span>
      </div>
    </div>
  ),
});

interface PropertyMapWrapperProps {
  latitude: number;
  longitude: number;
  title: string;
  location: string;
  onChange?: (lat: number, lng: number) => void;
}

export default function PropertyMapWrapper(props: PropertyMapWrapperProps) {
  return <DynamicMap {...props} />;
}
