import React from 'react';
import { MOVIE_INFO } from '../data/constants';

interface CreditLineProps {
  className?: string;
}

export const CreditLine: React.FC<CreditLineProps> = ({ className = '' }) => {
  return (
    <div
      className={`text-[13px] text-purple-200/60 leading-snug px-3 py-1.5 text-center font-normal ${className}`}
      data-testid="clip-credit-line"
    >
      {MOVIE_INFO.creditLine}
    </div>
  );
};
