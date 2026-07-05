'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';

interface MortgageCalculatorProps {
  propertyPrice: number;
}

export default function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);

  // Calculations
  const principal = propertyPrice * (1 - downPaymentPercent / 100);
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;

  const monthlyPayment = monthlyRate === 0
    ? (principal / numberOfPayments)
    : ((principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
       (Math.pow(1 + monthlyRate, numberOfPayments) - 1));

  const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
  const loanAmount = propertyPrice - downPaymentAmount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-mosque/5 overflow-hidden transition-all duration-300">
      {/* Summary Row */}
      <div className="bg-mosque/5 p-6 border-b border-mosque/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-full text-mosque shadow-sm shrink-0">
            <span className="material-icons">calculate</span>
          </div>
          <div>
            <h3 className="font-semibold text-nordic">{t('property.estimatedPayment')}</h3>
            <p className="text-sm text-nordic/60">
              {t('property.startingFrom')}{' '}
              <strong className="text-mosque">
                ${Math.round(monthlyPayment).toLocaleString()}{t('property.perMonth')}
              </strong>{' '}
              {t('property.withDown', { down: downPaymentPercent })}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="whitespace-nowrap px-4 py-2 bg-white border border-nordic/10 rounded-lg text-sm font-semibold hover:border-mosque transition-colors text-nordic flex items-center gap-2 cursor-pointer shadow-xs"
        >
          {isOpen ? t('property.hideCalculator') : t('property.calculateMortgage')}
          <span className="material-icons text-sm">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Expanded Calculator Form */}
      {isOpen && (
        <div className="p-6 space-y-6 bg-slate-50/50 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Controls */}
            <div className="space-y-4">
              {/* Down Payment slider */}
              <div>
                <div className="flex justify-between text-sm font-medium text-nordic mb-1">
                  <span>{t('property.downPayment')} ({downPaymentPercent}%)</span>
                  <span>${Math.round(downPaymentAmount).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-mosque cursor-pointer"
                />
              </div>

              {/* Interest Rate slider */}
              <div>
                <div className="flex justify-between text-sm font-medium text-nordic mb-1">
                  <span>{t('property.interestRate')}</span>
                  <span>{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-mosque cursor-pointer"
                />
              </div>

              {/* Loan Term Select */}
              <div>
                <label className="block text-sm font-medium text-nordic mb-1">
                  {t('property.loanTerm')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 20, 30].map((years) => (
                    <button
                      key={years}
                      type="button"
                      onClick={() => setLoanTerm(years)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all border ${
                        loanTerm === years
                          ? 'bg-mosque border-mosque text-white'
                          : 'bg-white border-nordic/15 text-nordic/80 hover:border-mosque'
                      }`}
                    >
                      {years} {t('property.years')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculations Display */}
            <div className="bg-white p-5 rounded-lg border border-nordic/5 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-nordic/60">{t('property.propertyPrice')}:</span>
                  <span className="font-semibold text-nordic">${propertyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-nordic/60">{t('property.downPaymentAmount')}:</span>
                  <span className="font-semibold text-nordic">${Math.round(downPaymentAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-nordic/60">{t('property.loanAmount')}:</span>
                  <span className="font-semibold text-nordic">${Math.round(loanAmount).toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-100 my-2"></div>
              </div>
              <div className="pt-4">
                <span className="text-xs uppercase tracking-wider text-nordic/50 block mb-1">{t('property.estimatedPayment')}</span>
                <span className="text-3xl font-bold text-mosque">
                  ${Math.round(monthlyPayment).toLocaleString()}
                  <span className="text-sm font-normal text-nordic/60">{t('property.perMonth')}</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
