
'use client';

import { useState, useEffect } from 'react';

interface FormattedCurrencyProps {
  value: number;
  currency: string; // e.g., "USD"
  placeholder?: string;
}

export function FormattedCurrency({ value, currency, placeholder = "0.00" }: FormattedCurrencyProps) {
  const [formattedValue, setFormattedValue] = useState<string>(placeholder);

  useEffect(() => {
    // Only attempt to format if value is a valid number
    if (typeof value === 'number' && !isNaN(value)) {
      try {
        setFormattedValue(value.toLocaleString(undefined, { style: 'currency', currency: currency }));
      } catch (error) {
        console.error("Error formatting currency:", error);
        // Fallback to a simple number string if toLocaleString fails (e.g., invalid currency code)
        setFormattedValue(value.toFixed(2)); 
      }
    } else {
      // If value is not a valid number, display the placeholder
      setFormattedValue(placeholder);
    }
  }, [value, currency, placeholder]);

  return <>{formattedValue}</>;
}
