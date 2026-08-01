export const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  if (['true', '1'].includes(normalized)) {
    return true;
  }

  if (['false', '0'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
};

export const parseNumber = (value: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }

  return parsed;
};

export const parseUrl = (value: string): URL => {
  return new URL(value);
};
