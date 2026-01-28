/**
 * @file: FieldHint.tsx
 * @description: Field hint icon with tooltip.
 * @dependencies: none
 * @created: 2026-01-27
 */

import { useState } from 'react';
import './FieldHint.css';

export interface FieldHintProps {
  text: string;
}

export function FieldHint({ text }: FieldHintProps) {
  return (
    <div className="field-hint-container">
      <button
        type="button"
        className="field-hint-icon"
        aria-label="Подсказка"
        tabIndex={-1}
      >
        <span className="field-hint-letter">i</span>
      </button>
      <div className="field-hint-tooltip">
        {text}
      </div>
    </div>
  );
}
