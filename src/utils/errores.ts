// Helper para extraer información tipada de errores desconocidos (catch).
export function obtenerMensajeError(error: unknown, fallback = 'Error interno'): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error;
  return fallback;
}

export function obtenerCodigoError(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}
