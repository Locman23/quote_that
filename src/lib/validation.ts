import { z } from 'zod';

export function uuidField(errorMessage: string) {
  return z.string().trim().uuid(errorMessage);
}

export function isValidUuid(value: string) {
  return uuidField('Invalid id.').safeParse(value).success;
}

export function parseUuid(value: string, errorMessage: string) {
  const result = uuidField(errorMessage).safeParse(value);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? errorMessage);
  }

  return result.data;
}