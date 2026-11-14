'use client';

import { useEffect } from 'react';

// El layout raíz no se vuelve a renderizar al cambiar de idioma en el cliente.
export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
