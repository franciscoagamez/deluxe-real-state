'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n/locales';

const USFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" className="w-4 h-3 rounded-xs shadow-xs object-cover shrink-0" aria-hidden="true">
    <rect width="7410" height="3900" fill="#b22234" />
    <path d="M0,300H7410M0,900H7410M0,1500H7410M0,2100H7410M0,2700H7410M0,3300H7410" stroke="#fff" strokeWidth="300" />
    <rect width="2964" height="2100" fill="#3c3b6e" />
    <g fill="#fff">
      <circle cx="494" cy="350" r="80" />
      <circle cx="988" cy="350" r="80" />
      <circle cx="1482" cy="350" r="80" />
      <circle cx="1976" cy="350" r="80" />
      <circle cx="2470" cy="350" r="80" />
      <circle cx="741" cy="700" r="80" />
      <circle cx="1235" cy="700" r="80" />
      <circle cx="1729" cy="700" r="80" />
      <circle cx="2223" cy="700" r="80" />
      <circle cx="494" cy="1050" r="80" />
      <circle cx="988" cy="1050" r="80" />
      <circle cx="1482" cy="1050" r="80" />
      <circle cx="1976" cy="1050" r="80" />
      <circle cx="2470" cy="1050" r="80" />
      <circle cx="741" cy="1400" r="80" />
      <circle cx="1235" cy="1400" r="80" />
      <circle cx="1729" cy="1400" r="80" />
      <circle cx="2223" cy="1400" r="80" />
      <circle cx="494" cy="1750" r="80" />
      <circle cx="988" cy="1750" r="80" />
      <circle cx="1482" cy="1750" r="80" />
      <circle cx="1976" cy="1750" r="80" />
      <circle cx="2470" cy="1750" r="80" />
    </g>
  </svg>
);

const ESFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" className="w-4 h-3 rounded-xs shadow-xs object-cover shrink-0" aria-hidden="true">
    <rect width="750" height="500" fill="#c11b17" />
    <rect y="125" width="750" height="250" fill="#fcd116" />
    <rect x="150" y="200" width="50" height="60" rx="6" fill="#c11b17" />
    <circle cx="175" cy="175" r="10" fill="#fcd116" />
  </svg>
);

const FRFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="w-4 h-3 rounded-xs shadow-xs object-cover shrink-0" aria-hidden="true">
    <rect width="1" height="2" fill="#002395" />
    <rect x="1" width="1" height="2" fill="#fff" />
    <rect x="2" width="1" height="2" fill="#ed2939" />
  </svg>
);

export default function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as Locale, label: 'English', flag: <USFlag /> },
    { code: 'es' as Locale, label: 'Español', flag: <ESFlag /> },
    { code: 'fr' as Locale, label: 'Français', flag: <FRFlag /> },
  ];

  const activeLang = languages.find((lang) => lang.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-nordic/70 hover:text-nordic hover:bg-nordic/5 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {activeLang.flag}
        <span className="text-[11px] font-bold">{activeLang.code}</span>
        <span className="material-icons text-[14px] text-nordic/40 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-38 rounded-xl bg-white shadow-lg border border-nordic/5 py-1.5 z-50 origin-top-right focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors hover:bg-nordic/5 cursor-pointer ${lang.code === locale ? 'text-mosque font-bold bg-mosque/5' : 'text-nordic/80'
                }`}
            >
              <div className="flex items-center gap-2">
                {lang.flag}
                <span>{lang.label}</span>
              </div>
              {lang.code === locale ? (
                <span className="material-icons text-[14px] text-mosque">check</span>
              ) : (
                <span className="text-[10px] font-bold text-nordic/30 uppercase tracking-wider">{lang.code}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
