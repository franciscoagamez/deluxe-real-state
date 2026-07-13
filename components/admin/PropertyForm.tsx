'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PropertyMapWrapper from '@/components/PropertyMapWrapper';
import { useTranslation } from '@/i18n/I18nProvider';
import {
  createProperty,
  updateProperty,
  uploadPropertyImages,
  deletePropertyImage,
  type PropertyFormState,
} from '@/app/admin/properties/actions';
import type { Currency, ListingTypeEnum, PropertyRow, PropertyStatus, PropertyTypeEnum } from '@/types/property';

const PROPERTY_TYPES: PropertyTypeEnum[] = [
  'house',
  'apartment',
  'villa',
  'penthouse',
  'condo',
  'townhouse',
  'cabin',
  'farmhouse',
];

const AMENITY_OPTIONS: { key: string; value: string }[] = [
  { key: 'pool', value: 'pool' },
  { key: 'garden', value: 'garden' },
  { key: 'ac', value: 'ac' },
  { key: 'smartHome', value: 'smart_home' },
];

interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface StepperProps {
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

function Stepper({ label, icon, value, onChange, min = 0, step = 1 }: StepperProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-nordic dark:text-white flex items-center gap-2">
        <span className="material-icons text-gray-400 text-sm">{icon}</span> {label}
      </label>
      <div className="flex items-center border border-gray-200 dark:border-primary/20 rounded-md overflow-hidden bg-white dark:bg-background-dark shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-primary/10 text-gray-600 dark:text-gray-300 transition-colors border-r border-gray-100 dark:border-primary/10 cursor-pointer"
        >
          -
        </button>
        <span className="w-10 text-center text-nordic dark:text-white text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Number((value + step).toFixed(1)))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-primary/10 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-primary/10 cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  initialData?: PropertyRow;
}

export default function PropertyForm({ mode, propertyId, initialData }: PropertyFormProps) {
  const { t } = useTranslation();

  const boundAction =
    mode === 'edit' && propertyId ? updateProperty.bind(null, propertyId) : createProperty;
  const [state, formAction, isPending] = useActionState<PropertyFormState, FormData>(
    boundAction,
    {},
  );

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [price, setPrice] = useState(initialData ? String(initialData.price / 100) : '');
  const [currency, setCurrency] = useState<Currency>(initialData?.currency ?? 'usd');
  const [listingType, setListingType] = useState<ListingTypeEnum>(
    initialData?.listing_type ?? 'for_sale',
  );
  const [propertyType, setPropertyType] = useState<PropertyTypeEnum>(
    initialData?.property_type ?? 'house',
  );
  const [status, setStatus] = useState<PropertyStatus>(initialData?.status ?? 'active');
  const [tag, setTag] = useState(initialData?.tag ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : initialData?.image_url
        ? [initialData.image_url]
        : [],
  );
  const [imageAlt, setImageAlt] = useState(initialData?.image_alt ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [latitude, setLatitude] = useState(
    initialData?.latitude != null ? String(initialData.latitude) : '',
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude != null ? String(initialData.longitude) : '',
  );
  const [area, setArea] = useState(initialData ? String(initialData.area) : '');
  const [yearBuilt, setYearBuilt] = useState(
    initialData?.year_built != null ? String(initialData.year_built) : '',
  );
  const [beds, setBeds] = useState(initialData?.beds ?? 3);
  const [baths, setBaths] = useState(initialData?.baths ?? 2);
  const [parking, setParking] = useState(initialData?.parking ?? 1);
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities ?? []);
  const [featured, setFeatured] = useState(initialData?.is_featured ?? false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationBoxRef = useRef<HTMLDivElement>(null);

  const currencySymbol = currency === 'eur' ? '€' : '$';
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasCoordinates = latitude !== '' && longitude !== '' && !Number.isNaN(lat) && !Number.isNaN(lng);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    Array.from(fileList).forEach((file) => fd.append('files', file));
    const result = await uploadPropertyImages(fd);
    setUploading(false);
    if (!result.success || !result.urls) {
      setUploadError(result.error ?? t('admin.properties.form.errorUpload'));
      return;
    }
    setImages((prev) => [...prev, ...result.urls!]);
  }

  function handleRemoveImage(url: string, index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    void deletePropertyImage(url);
  }

  function handleSetMain(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  }

  function toggleAmenity(value: string) {
    setAmenities((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
  }

  // --- Address autocomplete (OpenStreetMap Nominatim) ---------------------
  function handleLocationChange(value: string) {
    setLocation(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchingAddress(false);
      return;
    }

    setSearchingAddress(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(query)}`,
        );
        const data: GeoSuggestion[] = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(Array.isArray(data) && data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchingAddress(false);
      }
    }, 400);
  }

  function selectSuggestion(s: GeoSuggestion) {
    setLocation(s.display_name);
    setLatitude(parseFloat(s.lat).toFixed(6));
    setLongitude(parseFloat(s.lon).toFixed(6));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleLocationKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Prevent Enter from submitting the form; pick the first suggestion instead.
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) selectSuggestion(suggestions[0]);
    }
  }

  // Close the suggestions dropdown when clicking outside the address field.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (locationBoxRef.current && !locationBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div className="font-display pb-24 md:pb-0">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-primary/10 pb-8">
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="flex">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <li>
                <Link href="/admin/properties" className="hover:text-mosque dark:hover:text-primary transition-colors">
                  {t('admin.properties.form.breadcrumbProperties')}
                </Link>
              </li>
              <li>
                <span className="material-icons text-xs text-gray-400">chevron_right</span>
              </li>
              <li aria-current="page" className="text-nordic dark:text-white">
                {mode === 'edit'
                  ? t('admin.properties.form.breadcrumbEdit')
                  : t('admin.properties.form.breadcrumbAdd')}
              </li>
            </ol>
          </nav>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-nordic dark:text-white tracking-tight mb-2">
              {mode === 'edit' ? t('admin.properties.form.titleEdit') : t('admin.properties.form.titleAdd')}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl">
              {mode === 'edit'
                ? t('admin.properties.form.subtitleEdit')
                : t('admin.properties.form.subtitleAdd')}
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <Link
            href="/admin/properties"
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-primary/30 bg-white dark:bg-[#152e2a] text-nordic dark:text-white hover:bg-gray-50 dark:hover:bg-primary/10 transition-colors font-medium text-sm"
          >
            {t('admin.properties.form.cancel')}
          </Link>
          <button
            type="submit"
            form="property-form"
            disabled={isPending}
            className="px-5 py-2.5 rounded-lg bg-mosque hover:bg-nordic dark:bg-primary dark:hover:bg-primary/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-icons text-sm">save</span>
            {isPending ? t('admin.properties.form.saving') : t('admin.properties.form.saveProperty')}
          </button>
        </div>
      </header>

      {state.error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form id="property-form" action={formAction} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {images.map((url) => (
          <input key={url} type="hidden" name="images" value={url} />
        ))}
        <input type="hidden" name="beds" value={beds} />
        <input type="hidden" name="baths" value={baths} />
        <input type="hidden" name="parking" value={parking} />

        <div className="xl:col-span-8 space-y-8">
          {/* Basic Information */}
          <section className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-primary/10 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-of-green/30 dark:border-primary/10 flex items-center gap-3 bg-gradient-to-r from-hint-of-green/10 dark:from-primary/5 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-of-green dark:bg-primary/20 flex items-center justify-center text-nordic dark:text-primary">
                <span className="material-icons text-lg">info</span>
              </div>
              <h2 className="text-xl font-bold text-nordic dark:text-white">
                {t('admin.properties.form.basicInformation')}
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="title">
                  {t('admin.properties.form.propertyTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('admin.properties.form.propertyTitlePlaceholder')}
                  className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="price">
                    {t('admin.properties.form.price')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="currency">
                    {t('admin.properties.form.currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all cursor-pointer"
                  >
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="listing_type">
                    {t('admin.properties.form.listingType')}
                  </label>
                  <select
                    id="listing_type"
                    name="listing_type"
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as ListingTypeEnum)}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all cursor-pointer"
                  >
                    <option value="for_sale">{t('admin.properties.forSale')}</option>
                    <option value="for_rent">{t('admin.properties.forRent')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="property_type">
                    {t('admin.properties.form.propertyType')}
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyTypeEnum)}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {t(`filters.propertyTypes.${pt}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="status">
                    {t('admin.properties.form.status')}
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all cursor-pointer"
                  >
                    <option value="active">{t('admin.properties.active')}</option>
                    <option value="pending">{t('admin.properties.pending')}</option>
                    <option value="sold">{t('admin.properties.sold')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="tag">
                    {t('admin.properties.form.tag')}
                  </label>
                  <input
                    id="tag"
                    name="tag"
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder={t('admin.properties.form.tagPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-primary/10 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-of-green/30 dark:border-primary/10 flex items-center gap-3 bg-gradient-to-r from-hint-of-green/10 dark:from-primary/5 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-of-green dark:bg-primary/20 flex items-center justify-center text-nordic dark:text-primary">
                <span className="material-icons text-lg">description</span>
              </div>
              <h2 className="text-xl font-bold text-nordic dark:text-white">
                {t('admin.properties.form.description')}
              </h2>
            </div>
            <div className="p-8">
              <div className="mb-3 flex gap-2 border-b border-gray-100 dark:border-primary/10 pb-2">
                {['format_bold', 'format_italic', 'format_list_bulleted'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    disabled
                    className="p-1.5 text-gray-300 dark:text-gray-600 rounded cursor-not-allowed"
                  >
                    <span className="material-icons text-lg">{icon}</span>
                  </button>
                ))}
              </div>
              <textarea
                id="description"
                name="description"
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('admin.properties.form.descriptionPlaceholder')}
                className="w-full px-4 py-3 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base leading-relaxed resize-y min-h-[200px]"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {t('admin.properties.form.charactersCount', { count: description.length })}
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-primary/10 overflow-hidden">
            <div className="px-8 py-6 border-b border-hint-of-green/30 dark:border-primary/10 flex justify-between items-center bg-gradient-to-r from-hint-of-green/10 dark:from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-hint-of-green dark:bg-primary/20 flex items-center justify-center text-nordic dark:text-primary">
                  <span className="material-icons text-lg">image</span>
                </div>
                <h2 className="text-xl font-bold text-nordic dark:text-white">{t('admin.properties.form.gallery')}</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-primary/10 px-2 py-1 rounded">
                {t('admin.properties.form.galleryFormats')}
              </span>
            </div>
            <div className="p-8">
              <div className="relative border-2 border-dashed border-gray-300 dark:border-primary/30 rounded-xl bg-gray-50/50 dark:bg-primary/5 p-10 text-center hover:bg-hint-of-green/10 dark:hover:bg-primary/10 hover:border-mosque/40 transition-colors cursor-pointer group">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-white dark:bg-background-dark rounded-full flex items-center justify-center shadow-sm text-mosque dark:text-primary group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-2xl">{uploading ? 'hourglass_top' : 'cloud_upload'}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-nordic dark:text-white">
                      {uploading ? t('admin.properties.form.uploading') : t('admin.properties.form.dropHint')}
                    </p>
                    <p className="text-xs text-gray-400">{t('admin.properties.form.maxFileSize')}</p>
                  </div>
                </div>
              </div>

              {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {images.map((url, index) => (
                  <div key={url} className="aspect-square rounded-lg overflow-hidden relative group shadow-sm bg-gray-100">
                    <Image
                      src={url}
                      alt={index === 0 ? imageAlt || title : `${title} ${index + 1}`}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url, index)}
                        className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMain(index)}
                          title={t('admin.properties.form.setAsMain')}
                          className="w-8 h-8 rounded-full bg-white text-nordic hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-icons text-sm">star</span>
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <span className="absolute top-2 left-2 bg-mosque dark:bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                        {t('admin.properties.form.mainBadge')}
                      </span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-primary/30 flex flex-col items-center justify-center text-gray-400 hover:text-mosque dark:hover:text-primary hover:border-mosque dark:hover:border-primary hover:bg-hint-of-green/20 dark:hover:bg-primary/10 transition-all group cursor-pointer"
                >
                  <span className="material-icons group-hover:scale-110 transition-transform">add</span>
                  <span className="text-xs mt-1 font-medium">{t('admin.properties.form.addMore')}</span>
                </button>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="image_alt">
                  {t('admin.properties.form.imageAlt')}
                </label>
                <input
                  id="image_alt"
                  name="image_alt"
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder={t('admin.properties.form.imageAltPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          {/* Location */}
          <section className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-primary/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-hint-of-green/30 dark:border-primary/10 flex items-center gap-3 bg-gradient-to-r from-hint-of-green/10 dark:from-primary/5 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-of-green dark:bg-primary/20 flex items-center justify-center text-nordic dark:text-primary">
                <span className="material-icons text-lg">place</span>
              </div>
              <h2 className="text-lg font-bold text-nordic dark:text-white">{t('admin.properties.form.location')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div ref={locationBoxRef}>
                <label className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5" htmlFor="location">
                  {t('admin.properties.form.address')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    autoComplete="off"
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onKeyDown={handleLocationKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder={t('admin.properties.form.addressPlaceholder')}
                    className="w-full px-4 py-2.5 pr-9 rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                  />
                  {searchingAddress && (
                    <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-mosque dark:text-primary text-lg animate-spin pointer-events-none">
                      progress_activity
                    </span>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 z-[1000] mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-primary/20 bg-white dark:bg-[#152e2a] shadow-lg text-sm">
                      {suggestions.map((s) => (
                        <li key={`${s.lat}-${s.lon}`}>
                          <button
                            type="button"
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-hint-of-green/30 dark:hover:bg-primary/10 border-b border-gray-100 dark:border-primary/10 last:border-b-0 text-nordic dark:text-gray-200 transition-colors cursor-pointer"
                          >
                            {s.display_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1" htmlFor="latitude">
                    {t('admin.properties.form.latitude')}
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="0.000000"
                    className="w-full px-3 py-2 rounded border border-gray-200 dark:border-primary/20 bg-gray-50 dark:bg-background-dark text-nordic dark:text-white focus:bg-white dark:focus:bg-background-dark focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium mb-1" htmlFor="longitude">
                    {t('admin.properties.form.longitude')}
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="0.000000"
                    className="w-full px-3 py-2 rounded border border-gray-200 dark:border-primary/20 bg-gray-50 dark:bg-background-dark text-nordic dark:text-white focus:bg-white dark:focus:bg-background-dark focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                  />
                </div>
              </div>
              {hasCoordinates ? (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-primary/20">
                  <PropertyMapWrapper latitude={lat} longitude={lng} title={title || 'Property'} location={location} />
                </div>
              ) : (
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-background-dark border border-gray-200 dark:border-primary/20 flex items-center justify-center">
                  <span className="text-xs text-gray-400 flex items-center gap-1 px-6 text-center">
                    <span className="material-icons text-sm text-mosque dark:text-primary">map</span>
                    {t('admin.properties.form.mapPlaceholder')}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Details */}
          <section className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-primary/10 overflow-hidden xl:sticky xl:top-24">
            <div className="px-6 py-4 border-b border-hint-of-green/30 dark:border-primary/10 flex items-center gap-3 bg-gradient-to-r from-hint-of-green/10 dark:from-primary/5 to-transparent">
              <div className="w-8 h-8 rounded-full bg-hint-of-green dark:bg-primary/20 flex items-center justify-center text-nordic dark:text-primary">
                <span className="material-icons text-lg">straighten</span>
              </div>
              <h2 className="text-lg font-bold text-nordic dark:text-white">{t('admin.properties.form.details')}</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block" htmlFor="area">
                    {t('admin.properties.form.area')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="area"
                    name="area"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="0"
                    className="w-full text-left px-3 py-2 rounded border border-gray-200 dark:border-primary/20 bg-gray-50 dark:bg-background-dark text-nordic dark:text-white focus:bg-white dark:focus:bg-background-dark focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block" htmlFor="year_built">
                    {t('admin.properties.form.yearBuilt')}
                  </label>
                  <input
                    id="year_built"
                    name="year_built"
                    type="number"
                    min="1800"
                    max="2100"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder="YYYY"
                    className="w-full text-left px-3 py-2 rounded border border-gray-200 dark:border-primary/20 bg-gray-50 dark:bg-background-dark text-nordic dark:text-white focus:bg-white dark:focus:bg-background-dark focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm"
                  />
                </div>
              </div>

              <hr className="border-gray-100 dark:border-primary/10" />

              <div className="space-y-4">
                <Stepper label={t('admin.properties.form.bedrooms')} icon="bed" value={beds} onChange={setBeds} />
                <Stepper
                  label={t('admin.properties.form.bathrooms')}
                  icon="shower"
                  value={baths}
                  onChange={setBaths}
                  step={0.5}
                />
                <Stepper
                  label={t('admin.properties.form.parking')}
                  icon="directions_car"
                  value={parking}
                  onChange={setParking}
                />
              </div>

              <hr className="border-gray-100 dark:border-primary/10" />

              <div>
                <h3 className="text-xs font-bold text-nordic dark:text-gray-300 mb-3 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('admin.properties.form.amenitiesTitle')}
                </h3>
                <div className="space-y-2">
                  {AMENITY_OPTIONS.map((am) => (
                    <label key={am.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="amenities"
                        value={am.value}
                        checked={amenities.includes(am.value)}
                        onChange={() => toggleAmenity(am.value)}
                        className="w-4 h-4 text-mosque dark:text-primary border-gray-300 dark:border-primary/40 rounded focus:ring-mosque dark:focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-nordic dark:group-hover:text-white transition-colors">
                        {t(`admin.properties.form.amenityOptions.${am.key}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-primary/10" />

              <label className="flex items-center justify-between cursor-pointer">
                <span>
                  <span className="text-sm font-medium text-nordic dark:text-white block">
                    {t('admin.properties.form.featured')}
                  </span>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    {t('admin.properties.form.featuredHint')}
                  </span>
                </span>
                <span className="relative inline-flex items-center shrink-0 ml-4">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-10 h-6 bg-gray-200 dark:bg-primary/20 rounded-full peer-checked:bg-mosque dark:peer-checked:bg-primary transition-colors"></span>
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                </span>
              </label>
            </div>
          </section>
        </div>
      </form>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#152e2a] border-t border-gray-200 dark:border-primary/10 shadow-xl md:hidden z-40 flex gap-3">
        <Link
          href="/admin/properties"
          className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-primary/30 bg-white dark:bg-transparent text-nordic dark:text-white font-medium text-center"
        >
          {t('admin.properties.form.cancel')}
        </Link>
        <button
          type="submit"
          form="property-form"
          disabled={isPending}
          className="flex-1 py-3 rounded-lg bg-mosque dark:bg-primary text-white font-medium flex justify-center items-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? t('admin.properties.form.saving') : t('admin.properties.form.saveProperty')}
        </button>
      </div>
    </div>
  );
}
