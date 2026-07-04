export function formatNumber(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('es-CO').format(n);
}

export function safeTrim(v) {
  return (v ?? '').toString().trim();
}

