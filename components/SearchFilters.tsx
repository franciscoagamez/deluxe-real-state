'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AMENITIES_LIST = [
  { name: 'Swimming Pool', icon: 'pool' },
  { name: 'Gym', icon: 'fitness_center' },
  { name: 'Parking', icon: 'local_parking' },
  { name: 'Air Conditioning', icon: 'ac_unit' },
  { name: 'High-speed Wifi', icon: 'wifi' },
  { name: 'Patio / Terrace', icon: 'deck' },
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search input state
  const [searchInput, setSearchInput] = useState(searchParams.get('location') || '');

  // Modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Temporary filter states (only applied when "Show X Homes" is clicked)
  const [tempLocation, setTempLocation] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState(1200000);
  const [tempMaxPrice, setTempMaxPrice] = useState(4500000);
  const [tempPropertyType, setTempPropertyType] = useState('Any Type');
  const [tempBeds, setTempBeds] = useState('any');
  const [tempBaths, setTempBaths] = useState('any');
  const [tempAmenities, setTempAmenities] = useState<string[]>([]);

  // Live count state
  const [matchCount, setMatchCount] = useState(0);

  // Active quick category (propertyType)
  const activeCategory = searchParams.get('propertyType') || 'all';

  // Format price helper
  const formatPriceLabel = (min: number, max: number) => {
    const format = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1).replace('.0', '')}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(1).replace('.0', '')}k`;
      return `$${val}`;
    };
    return `${format(min)} – ${format(max)}`;
  };

  // Sync temporary state with URL when opening the modal
  const openModal = () => {
    const isRent = searchParams.get('listingType') === 'rent';
    const minLimit = isRent ? 1000 : 100000;
    const maxLimit = isRent ? 15000 : 10000000;

    setTempLocation(searchParams.get('location') || '');
    setTempMinPrice(Number(searchParams.get('minPrice')) || minLimit);
    setTempMaxPrice(Number(searchParams.get('maxPrice')) || maxLimit);
    setTempPropertyType(searchParams.get('propertyType') || 'Any Type');
    // Normalize: strip legacy '+' suffix from URL params
    const urlBeds = searchParams.get('beds') || 'any';
    setTempBeds(urlBeds !== 'any' ? String(parseInt(urlBeds, 10) || 1) : 'any');
    const urlBaths = searchParams.get('baths') || 'any';
    setTempBaths(urlBaths !== 'any' ? String(parseInt(urlBaths, 10) || 1) : 'any');
    const urlAmenities = searchParams.get('amenities');
    setTempAmenities(urlAmenities ? urlAmenities.split(',') : []);
    setIsModalOpen(true);
  };

  // Real-time Supabase count fetcher
  useEffect(() => {
    if (!isModalOpen) return;

    const fetchCount = async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from('properties')
          .select('id', { count: 'exact', head: true });

        if (tempLocation) {
          query = query.ilike('location', `%${tempLocation}%`);
        }
        
        // Convert prices to cents
        query = query.gte('price', tempMinPrice * 100);
        query = query.lte('price', tempMaxPrice * 100);

        if (tempPropertyType && tempPropertyType !== 'Any Type' && tempPropertyType !== 'any') {
          query = query.eq('property_type', tempPropertyType.toLowerCase());
        }

        if (tempBeds && tempBeds !== 'any') {
          const bedsNum = parseInt(tempBeds, 10);
          if (!isNaN(bedsNum)) {
            query = query.eq('beds', bedsNum);
          }
        }

        if (tempBaths && tempBaths !== 'any') {
          const bathsNum = parseInt(tempBaths, 10);
          if (!isNaN(bathsNum)) {
            // Match exact integer value: e.g. baths=2 matches 2.0 and 2.5
            query = query.gte('baths', bathsNum).lt('baths', bathsNum + 1);
          }
        }

        if (tempAmenities.length > 0) {
          for (const am of tempAmenities) {
            let term = am.toLowerCase();
            if (term === 'swimming pool') term = 'pool';
            else if (term === 'gym') term = 'gym';
            else if (term === 'parking') term = 'parking';
            else if (term === 'air conditioning') term = 'conditioning';
            else if (term === 'high-speed wifi') term = 'wifi';
            else if (term === 'patio / terrace') term = 'patio';

            query = query.ilike('description', `%${term}%`);
          }
        }

        // Apply current active listingType parameter from URL if present
        const currentListingType = searchParams.get('listingType');
        if (currentListingType && currentListingType !== 'all') {
          query = query.eq('listing_type', currentListingType === 'rent' ? 'for_rent' : 'for_sale');
        }

        const { count, error } = await query;
        if (!error) {
          setMatchCount(count ?? 0);
        }
      } catch (err) {
        console.error('Error fetching count:', err);
      }
    };

    // Debounce the call to avoid hitting DB limit while dragging slider
    const timer = setTimeout(() => {
      fetchCount();
    }, 150);

    return () => clearTimeout(timer);
  }, [isModalOpen, tempLocation, tempMinPrice, tempMaxPrice, tempPropertyType, tempBeds, tempBaths, tempAmenities, searchParams]);

  // Handle Quick Category Selection
  const handleSelectCategory = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // reset page
    if (type === 'all') {
      params.delete('propertyType');
    } else {
      params.set('propertyType', type.toLowerCase());
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle Quick Search Submission
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (searchInput) {
      params.set('location', searchInput);
    } else {
      params.delete('location');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Toggle Amenity Selection
  const handleToggleAmenity = (name: string) => {
    setTempAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  // Clear All Filters
  const handleClearFilters = () => {
    const isRent = searchParams.get('listingType') === 'rent';
    const minLimit = isRent ? 1000 : 100000;
    const maxLimit = isRent ? 15000 : 10000000;

    setTempLocation('');
    setTempMinPrice(minLimit);
    setTempMaxPrice(maxLimit);
    setTempPropertyType('Any Type');
    setTempBeds('any');
    setTempBaths('any');
    setTempAmenities([]);
  };

  // Apply All Filters
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (tempLocation) {
      params.set('location', tempLocation);
      setSearchInput(tempLocation);
    } else {
      params.delete('location');
      setSearchInput('');
    }

    params.set('minPrice', tempMinPrice.toString());
    params.set('maxPrice', tempMaxPrice.toString());

    if (tempPropertyType && tempPropertyType !== 'Any Type' && tempPropertyType !== 'any') {
      params.set('propertyType', tempPropertyType.toLowerCase());
    } else {
      params.delete('propertyType');
    }

    if (tempBeds && tempBeds !== 'any') {
      params.set('beds', String(parseInt(tempBeds, 10)));
    } else {
      params.delete('beds');
    }

    if (tempBaths && tempBaths !== 'any') {
      params.set('baths', String(parseInt(tempBaths, 10)));
    } else {
      params.delete('baths');
    }

    if (tempAmenities.length > 0) {
      params.set('amenities', tempAmenities.join(','));
    } else {
      params.delete('amenities');
    }

    setIsModalOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Dynamic price limits based on listingType
  const currentListingType = searchParams.get('listingType') || 'all';
  const isRent = currentListingType === 'rent';
  const minLimit = isRent ? 1000 : 100000;
  const maxLimit = isRent ? 15000 : 10000000;
  const priceStep = isRent ? 250 : 50000;

  // Calculation for price range slider track percentages
  const minPercent = ((tempMinPrice - minLimit) / (maxLimit - minLimit)) * 100;
  const maxPercent = ((tempMaxPrice - minLimit) / (maxLimit - minLimit)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Quick Search Bar */}
      <form onSubmit={handleQuickSearch} className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-icons text-nordic-muted text-2xl group-focus-within:text-mosque transition-colors font-material-icons">
            search
          </span>
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="block w-full pl-12 pr-28 py-4 rounded-xl border-none bg-white text-nordic shadow-soft placeholder-nordic-muted/60 focus:ring-2 focus:ring-mosque focus:bg-white transition-all text-lg"
          placeholder="Search by city, neighborhood, or address..."
        />
        <button
          type="submit"
          className="absolute inset-y-2 right-2 px-6 bg-mosque hover:bg-mosque/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-mosque/20 cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Quick Categories & Filter Button */}
      <div className="flex items-center justify-between gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-soft border border-nordic/5 max-w-2xl mx-auto">
        <div className="flex-1 overflow-hidden flex items-center">
          {/* Scrollable Categories List */}
          <div className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto hide-scroll w-full py-1 px-4">
            <button
              onClick={() => handleSelectCategory('all')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-nordic text-white shadow-lg shadow-nordic/10 hover:-translate-y-0.5'
                  : 'bg-white border border-nordic/5 text-nordic-muted hover:text-nordic hover:border-mosque/50 hover:bg-mosque/5'
              }`}
            >
              All
            </button>
            {['House', 'Apartment', 'Villa', 'Penthouse'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  activeCategory === cat.toLowerCase()
                    ? 'bg-nordic text-white shadow-lg shadow-nordic/10 hover:-translate-y-0.5'
                    : 'bg-white border border-nordic/5 text-nordic-muted hover:text-nordic hover:border-mosque/50 hover:bg-mosque/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="w-px h-6 bg-nordic/10 mx-1 shrink-0"></div>
        <button
          onClick={openModal}
          className="whitespace-nowrap flex items-center gap-1 px-4 py-2 rounded-full text-nordic hover:text-mosque font-medium text-sm hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        >
          <span className="material-icons text-base font-material-icons">tune</span>
          Filters
        </button>
      </div>

      {/* Filter Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          {/* Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Modal Container */}
          <main className="relative z-20 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <header className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-30">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white font-display">Filters</h1>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <span className="material-icons">close</span>
              </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              {/* Section 1: Location */}
              <section>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Location</label>
                <div className="relative group">
                  <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">location_on</span>
                  <input
                    value={tempLocation}
                    onChange={(e) => setTempLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background-light dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm focus:outline-none"
                    placeholder="City, neighborhood, or address"
                    type="text"
                  />
                </div>
              </section>

              {/* Section 2: Price Range */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range</label>
                  <span className="text-sm font-medium text-primary">{formatPriceLabel(tempMinPrice, tempMaxPrice)}</span>
                </div>
                
                {/* Working Dual Range Slider */}
                <div className="relative h-12 flex items-center mb-6 px-2">
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full pointer-events-none">
                    <div
                      className="absolute h-full bg-primary rounded-full"
                      style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                      }}
                    ></div>
                  </div>
                  
                  {/* Min price slider — pointer-events only on thumb */}
                  <input
                    type="range"
                    min={minLimit}
                    max={maxLimit}
                    step={priceStep}
                    value={tempMinPrice}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), tempMaxPrice - priceStep);
                      setTempMinPrice(val);
                    }}
                    className="dual-range-input absolute left-0 right-0 w-full h-1 appearance-none bg-transparent outline-none pointer-events-none z-20"
                  />
                  {/* Max price slider — pointer-events only on thumb */}
                  <input
                    type="range"
                    min={minLimit}
                    max={maxLimit}
                    step={priceStep}
                    value={tempMaxPrice}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), tempMinPrice + priceStep);
                      setTempMaxPrice(val);
                    }}
                    className="dual-range-input absolute left-0 right-0 w-full h-1 appearance-none bg-transparent outline-none pointer-events-none z-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background-light dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-primary/30 transition-colors">
                    <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Min Price</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">$</span>
                      <input
                        className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm focus:outline-none"
                        type="number"
                        value={tempMinPrice}
                        onChange={(e) => {
                          const val = Math.max(minLimit, Math.min(Number(e.target.value), tempMaxPrice - priceStep));
                          setTempMinPrice(val);
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-background-light dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-primary/30 transition-colors">
                    <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Max Price</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">$</span>
                      <input
                        className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm focus:outline-none"
                        type="number"
                        value={tempMaxPrice}
                        onChange={(e) => {
                          const val = Math.max(tempMinPrice + priceStep, Math.min(maxLimit, Number(e.target.value)));
                          setTempMaxPrice(val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Property Details */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Property Type */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property Type</label>
                  <div className="relative">
                    <select
                      value={tempPropertyType}
                      onChange={(e) => setTempPropertyType(e.target.value)}
                      className="w-full bg-background-light dark:bg-gray-800 border-0 rounded-lg py-3 pl-4 pr-10 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary cursor-pointer focus:outline-none"
                    >
                      <option>Any Type</option>
                      <option>House</option>
                      <option>Apartment</option>
                      <option>Condo</option>
                      <option>Townhouse</option>
                      <option>Villa</option>
                      <option>Penthouse</option>
                      <option>Cabin</option>
                      <option>Farmhouse</option>
                    </select>
                    <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Rooms */}
                <div className="space-y-4">
                  {/* Beds */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bedrooms</span>
                    <div className="flex items-center space-x-3 bg-background-light dark:bg-gray-800 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBeds === 'any') return;
                          if (tempBeds === '1') setTempBeds('any');
                          else {
                            const val = parseInt(tempBeds) - 1;
                            setTempBeds(`${val}`);
                          }
                        }}
                        disabled={tempBeds === 'any'}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <span className="material-icons text-base">remove</span>
                      </button>
                      <span className="text-sm font-semibold w-8 text-center text-gray-900 dark:text-white">
                        {tempBeds === 'any' ? 'Any' : tempBeds}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBeds === 'any') setTempBeds('1');
                          else {
                            const val = Math.min(10, parseInt(tempBeds) + 1);
                            setTempBeds(`${val}`);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-icons text-base">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Baths */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bathrooms</span>
                    <div className="flex items-center space-x-3 bg-background-light dark:bg-gray-800 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBaths === 'any') return;
                          if (tempBaths === '1') setTempBaths('any');
                          else {
                            const val = parseInt(tempBaths) - 1;
                            setTempBaths(`${val}`);
                          }
                        }}
                        disabled={tempBaths === 'any'}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <span className="material-icons text-base">remove</span>
                      </button>
                      <span className="text-sm font-semibold w-8 text-center text-gray-900 dark:text-white">
                        {tempBaths === 'any' ? 'Any' : tempBaths}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBaths === 'any') setTempBaths('1');
                          else {
                            const val = Math.min(10, parseInt(tempBaths) + 1);
                            setTempBaths(`${val}`);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-icons text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Amenities */}
              <section>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Amenities &amp; Features</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES_LIST.map((am) => {
                    const isChecked = tempAmenities.includes(am.name);
                    return (
                      <label key={am.name} className="cursor-pointer group relative select-none">
                        <input
                          checked={isChecked}
                          onChange={() => handleToggleAmenity(am.name)}
                          className="sr-only"
                          type="checkbox"
                        />
                        <div
                          className={`h-full px-4 py-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all font-medium ${
                            isChecked
                              ? 'border-primary bg-primary/10 text-primary dark:text-primary-light'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className={`material-icons text-lg ${isChecked ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`}>
                            {am.icon}
                          </span>
                          {am.name}
                        </div>
                        {isChecked && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors underline decoration-gray-300 underline-offset-4 cursor-pointer"
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-primary/30 transition-all hover:shadow-primary/40 flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                Show {matchCount} Homes
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </footer>
          </main>
        </div>
      )}
    </div>
  );
}
