'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calculator, Receipt, ChevronRight } from 'lucide-react';
import { TaxEngine, dummyHSCodes, HSCodeItem, CalculationResult } from '@/lib/taxCalculator';

export default function SmartCalculatorPage() {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHS, setSelectedHS] = useState<HSCodeItem | null>(null);
  
  const [rawTextInput, setRawTextInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Derived State (Search Filtering)
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
    
    // Debounce the parsing/calculating to prevent UI lag on every keystroke
    const timer = setTimeout(() => {
      const extracted = TaxEngine.parseText(rawTextInput, selectedHS);
      
      // Only show results if we actually found a base value
      if (extracted.baseValue > 0) {
        setResult(TaxEngine.calculate(extracted));
      } else {
        setResult(null);
      }
      setIsCalculating(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [rawTextInput, selectedHS]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Smart Customs Calculator</h1>
        <p className="text-slate-500">Search an HS Code and paste your import details to instantly calculate duties.</p>
      </div>

      {/* STEP 1: PROGRESSIVE DISCLOSURE - SEARCH OR SELECTED STATE */}
      {!selectedHS ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <Search className="text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search product name or HS Code..."
              className="w-full bg-transparent outline-none text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredCodes.map((item) => (
              <button
                key={item.code}
                onClick={() => setSelectedHS(item)}
                className="w-full text-left p-4 hover:bg-blue-50 transition-colors border-b border-slate-100 flex items-center justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{item.code}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* CONTEXT CARD (When HS Code is selected) */
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 relative">
          <button 
            onClick={() => { setSelectedHS(null); setRawTextInput(''); }}
            className="absolute top-4 right-4 text-xs font-semibold text-blue-600 hover:underline"
          >
            Change Code
          </button>
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-500 tracking-wider uppercase">Selected Classification</span>
            <h2 className="text-2xl font-bold text-slate-800">{selectedHS.code}</h2>
            <p className="text-slate-600">{selectedHS.description}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold border border-blue-200">Gen Duty: {selectedHS.baseDuty}%</span>
            <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold border border-blue-200">PAL: {selectedHS.palRate}%</span>
            <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold border border-blue-200">VAT: {selectedHS.vatRate}%</span>
          </div>
        </div>
      )}

      {/* STEP 2: SMART TEXT INPUT (Only visible if HS selected) */}
      {selectedHS && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-800">Smart Input</h3>
          </div>
          
          <textarea
            rows={4}
            className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none shadow-sm"
            placeholder="Paste raw text here. e.g. 'CIF Value is 50,000 LKR. Note: Duty is 10% instead of standard.'"
            value={rawTextInput}
            onChange={(e) => setRawTextInput(e.target.value)}
          />
          <p className="text-xs text-slate-400">
            The system will automatically extract values and override default tax rates if it finds them in your text.
          </p>
        </div>
      )}

      {/* STEP 3: RESULTS SLIDE-DOWN */}
      {isCalculating ? (
        <div className="text-center py-8 text-slate-400 animate-pulse">Calculating duties...</div>
      ) : result ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-800 p-4 text-white flex items-center gap-3">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">Estimated Tax Breakdown</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-slate-600">
              <span>CIF Base Value</span>
              <span className="font-medium">{result.cifValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>General Customs Duty</span>
              <span className="font-medium">{result.dutyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ports & Airports Levy (PAL)</span>
              <span className="font-medium">{result.palAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Value Added Tax (VAT)</span>
              <span className="font-medium">{result.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
            </div>
            
            <hr className="border-slate-200 border-dashed" />
            
            <div className="flex justify-between items-center text-red-500 font-semibold">
              <span>Total Payable Tax</span>
              <span>{result.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })} LKR</span>
            </div>
            
            <div className="bg-emerald-50 rounded-xl p-4 mt-4 border border-emerald-100 flex justify-between items-center">
              <span className="text-emerald-800 font-bold text-lg">Grand Total</span>
              <span className="text-emerald-700 font-bold text-2xl">
                {result.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm">LKR</span>
              </span>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}