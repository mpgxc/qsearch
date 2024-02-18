export const hasObjectKeys = (payload: Record<string, any>): boolean =>
  !!Object.keys(payload ?? {}).length;
