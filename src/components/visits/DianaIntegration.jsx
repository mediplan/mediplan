import React from 'react';
import PdfExamUpload from './PdfExamUpload';

/**
 * Integrazione Diana – Droga Test
 * Ora basata su upload PDF del referto prodotto dallo strumento.
 */
export default function DianaIntegration({ patient, onResult }) {
  return (
    <PdfExamUpload
      label="Droga Test (Diana)"
      color="text-primary"
      borderColor="border-primary/20"
      bgColor="bg-primary/5"
      onResult={onResult}
    />
  );
}