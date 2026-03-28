// --- TYPES ---
export interface ExtractedData {
  baseValue: number;
  dutyRate: number;
  palRate: number;
  vatRate: number;
}

export interface CalculationResult {
  cifValue: number;
  dutyAmount: number;
  palAmount: number;
  vatAmount: number;
  totalTax: number;
  grandTotal: number;
}

export interface HSCodeItem {
  code: string;
  description: string;
  baseDuty: number;
  palRate: number;
  vatRate: number;
}

// --- MOCK DATABASE ---
export const dummyHSCodes: HSCodeItem[] = [
  { code: "8517.12.00", description: "Smartphones and mobile devices", baseDuty: 15.0, palRate: 10.0, vatRate: 18.0 },
  { code: "8471.30.10", description: "Laptops and portable computers", baseDuty: 0.0, palRate: 5.0, vatRate: 18.0 },
  { code: "8703.22.10", description: "Motor vehicles (1000cc - 1500cc)", baseDuty: 30.0, palRate: 10.0, vatRate: 18.0 },
];

// --- LOGIC ENGINE ---
export class TaxEngine {
  /**
   * Parses natural text to extract customs values.
   * If a value isn't found in the text, it falls back to the selected HS Code defaults.
   */
  static parseText(text: string, defaultRates?: HSCodeItem): ExtractedData {
    const lowerText = text.toLowerCase();

    const valueRegex = /(?:cif|value|amount)?\s*[:$]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:usd|lkr|eur)?/i;
    const dutyRegex = /(?:duty|customs)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i;
    const palRegex = /(?:pal|levy)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i;
    const vatRegex = /(?:vat|tax)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i;

    const extract = (regex: RegExp, fallback: number): number => {
      const match = lowerText.match(regex);
      if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
      return fallback;
    };

    return {
      baseValue: extract(valueRegex, 0),
      dutyRate: extract(dutyRegex, defaultRates?.baseDuty || 0),
      palRate: extract(palRegex, defaultRates?.palRate || 0),
      vatRate: extract(vatRegex, defaultRates?.vatRate || 0),
    };
  }

  /**
   * Applies Sri Lankan cascading tax logic.
   */
  static calculate(data: ExtractedData): CalculationResult {
    const cif = data.baseValue;
    const duty = cif * (data.dutyRate / 100);
    const pal = cif * (data.palRate / 100);
    
    // VAT Base usually includes CIF + Duty + PAL + CESS
    const vatBase = cif + duty + pal;
    const vat = vatBase * (data.vatRate / 100);

    const totalTax = duty + pal + vat;

    return {
      cifValue: cif,
      dutyAmount: duty,
      palAmount: pal,
      vatAmount: vat,
      totalTax: totalTax,
      grandTotal: cif + totalTax,
    };
  }
}