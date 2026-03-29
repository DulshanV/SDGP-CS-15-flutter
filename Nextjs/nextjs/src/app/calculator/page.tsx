'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Calculator, Receipt, ChevronRight, ArrowLeft, Info, RefreshCw } from 'lucide-react';
import { TaxEngine, dummyHSCodes, HSCodeItem, CalculationResult } from '@/lib/taxCalculator';

export default function SmartCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHS, setSelectedHS] = useState<HSCodeItem | null>(null);
  
  const [rawTextInput, setRawTextInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Auto-select HS Code from URL
  useEffect(() => {
    const urlHsCode = searchParams.get('hscode');
    if (urlHsCode) {
      const foundItem = dummyHSCodes.find((item) => item.code === urlHsCode);
      if (foundItem) setSelectedHS(foundItem);
    }
  }, [searchParams]);

  // Search Filtering
  const filteredCodes = useMemo(() => {
    if (!searchQuery) return dummyHSCodes;
    const lowerQuery = searchQuery.toLowerCase();
    return dummyHSCodes.filter(
      (c) => c.code.includes(lowerQuery) || c.description.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  // Debounced Smart Calculator Effect
  useEffect(() => {
    if (!selectedHS || !rawTextInput.trim()) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      const extracted = TaxEngine.parseText(rawTextInput, selectedHS);
      if (extracted.baseValue > 0) {
        setResult(TaxEngine.calculate(extracted));
      } else {
        setResult(null);
      }
      setIsCalculating(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [rawTextInput, selectedHS]);

  const handleReset = () => {
    setSelectedHS(null);
    setRawTextInput('');
    setResult(null);
    // Remove the query param from URL without refreshing the page
    router.replace('/calculator', undefined); 
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. PROFESSIONAL GLOBAL HEADER */}
      <div className="sticky top-0 z-20 shadow-md" style={{ background: 'linear-gradient(135deg,#133665,#3A9EEA)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="text-white/80 hover:text-white transition-transform hover:-translate-x-1"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1">Duty & Tax Calculator</h1>
          {selectedHS && (
            <button onClick={handleReset} className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 mt-2">
        
        {/* STEP 1: PROGRESSIVE DISCLOSURE - SEARCH OR SELECTED STATE */}
        {!selectedHS ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <Search className="text-[#133665] w-5 h-5" />
              <input
                type="text"
                placeholder="Search product name or HS Code..."
                className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredCodes.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setSelectedHS(item)}
                  className="w-full text-left p-5 hover:bg-blue-50/50 transition-colors border-b border-slate-100 flex items-center justify-between group"
                >
                  <div>
                    <h3 className="font-bold text-[#0B3EA8] font-mono text-[15px]">{item.code}</h3>
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#3A9EEA] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* CONTEXT CARD (When HS Code is selected) */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-black text-[#3A9EEA] tracking-widest uppercase">Target Classification</span>
                <h2 className="text-2xl font-black text-[#0B3EA8] font-mono mt-1">{selectedHS.code}</h2>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed mb-6">{selectedHS.description}</p>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                General Duty: <span className="text-[#0B3EA8]">{selectedHS.baseDuty}%</span>
              </span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                PAL: <span className="text-[#0B3EA8]">{selectedHS.palRate}%</span>
              </span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                VAT: <span className="text-[#0B3EA8]">{selectedHS.vatRate}%</span>
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: SMART TEXT INPUT */}
        {selectedHS && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#133665]" />
              <h3 className="font-bold text-slate-800">Smart Input Parser</h3>
            </div>
            <div className="p-4">
              <textarea
                rows={4}
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-[#3A9EEA] focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400"
                placeholder="Paste raw invoice text or notes here...&#10;e.g., 'CIF Value is 150,000 LKR. Note: Duty is 10% instead of standard.'"
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
              />
              <div className="flex items-start gap-2 mt-3 text-slate-500">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  The system automatically extracts the CIF value and applies the rates above. If you type a specific tax override (e.g., "0% VAT"), it will supersede the default classification rate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS SLIDE-DOWN */}
        {isCalculating ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-[#0B3EA8] animate-spin" />
          </div>
        ) : result ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#133665] p-5 text-white flex items-center gap-3">
              <Receipt className="w-5 h-5 text-blue-200" />
              <h3 className="font-bold text-lg tracking-wide">Official Tax Breakdown</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center text-slate-600 py-1">
                <span>Declared CIF Base Value</span>
                <span className="font-medium text-slate-800">{result.cifValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 py-1">
                <span>General Customs Duty</span>
                <span className="font-medium text-slate-800">{result.dutyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 py-1">
                <span>Ports & Airports Levy (PAL)</span>
                <span className="font-medium text-slate-800">{result.palAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 py-1">
                <span>Value Added Tax (VAT)</span>
                <span className="font-medium text-slate-800">{result.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
              </div>
              
              <div className="pt-4 pb-2">
                <div className="h-px w-full border-t-2 border-dashed border-slate-200"></div>
              </div>
              
              <div className="flex justify-between items-center text-[#d93025] font-bold text-lg">
                <span>Total Payable Tax</span>
                <span>{result.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 mt-6 border border-emerald-100 flex justify-between items-center shadow-sm">
                <span className="text-emerald-900 font-bold text-lg">Grand Total</span>
                <div className="text-right">
                  <span className="text-emerald-700 font-black text-2xl">
                    {result.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-800 text-sm font-bold ml-1">LKR</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}