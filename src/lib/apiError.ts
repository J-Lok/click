import { AxiosError } from 'axios';

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((e: { msg?: string }) => e.msg ?? '').join(', ');
  }
  return err instanceof Error ? err.message : 'Une erreur est survenue';
}
