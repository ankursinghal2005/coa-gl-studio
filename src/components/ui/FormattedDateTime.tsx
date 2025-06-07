
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface FormattedDateTimeProps {
  date?: Date;
  formatString: string;
  placeholder?: string;
}

export function FormattedDateTime({ date, formatString, placeholder = "-" }: FormattedDateTimeProps) {
  const [formattedDate, setFormattedDate] = useState<string>(placeholder);

  useEffect(() => {
    if (date) {
      // Ensure date is a valid Date object before formatting
      try {
        const validDate = new Date(date);
        if (!isNaN(validDate.getTime())) {
          setFormattedDate(format(validDate, formatString));
        } else {
          setFormattedDate(placeholder); // Fallback if date is invalid after construction
        }
      } catch (error) {
        console.error("Error formatting date:", error);
        setFormattedDate(placeholder); // Fallback on error
      }
    } else {
      setFormattedDate(placeholder);
    }
  }, [date, formatString, placeholder]);

  return <>{formattedDate}</>;
}
