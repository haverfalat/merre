import type { ReactNode } from 'react';

export interface DateTimeInputProps {
  date: string;
  time: string;
  minimum: string;
  maximum: string;
  dateLabel?: string;
  afterDate?: ReactNode;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
}
