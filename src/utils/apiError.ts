import type { components } from '../types/api';

type MsgResponse = components['schemas']['MsgResponse'];
type ValidationError = components['schemas']['ValidationError'];

export function getMsgError(err: unknown): string | undefined {
  return (err as { data?: MsgResponse })?.data?.msg;
}

export function getFieldErrors(
  err: unknown
): Record<string, string[]> | undefined {
  return (err as { data?: ValidationError })?.data?.errors;
}
