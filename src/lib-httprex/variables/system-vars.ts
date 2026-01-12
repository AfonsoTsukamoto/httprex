/**
 * System variables
 * Provides built-in variable values like $timestamp, $guid, $randomInt
 */

export interface SystemVariables {
  $guid: string;
  $timestamp: string;
  $randomInt: string;
  $datetime: string;
  [key: string]: string;
}

export function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function generateRandomInt(min: number = 0, max: number = 1000): string {
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function generateDatetime(format: 'iso8601' | 'rfc1123' = 'iso8601', offset: number = 0): string {
  const date = new Date(Date.now() + offset);

  if (format === 'iso8601') {
    return date.toISOString();
  } else {
    // RFC 1123 format
    return date.toUTCString();
  }
}

export function getSystemVariables(): SystemVariables {
  return {
    $guid: generateGuid(),
    $timestamp: generateTimestamp(),
    $randomInt: generateRandomInt(),
    $datetime: generateDatetime()
  };
}

export function resolveSystemVariable(varName: string): string | null {
  // Handle parameterized system variables
  if (varName.startsWith('$randomInt')) {
    // Format: $randomInt min max
    const match = varName.match(/\$randomInt\s+(\d+)\s+(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return generateRandomInt(min, max);
    }
    return generateRandomInt();
  }

  if (varName.startsWith('$datetime')) {
    // Format: $datetime rfc1123|iso8601 offset
    const match = varName.match(/\$datetime\s+(rfc1123|iso8601)(?:\s+(-?\d+))?/);
    if (match) {
      const format = match[1] as 'iso8601' | 'rfc1123';
      const offset = match[2] ? parseInt(match[2], 10) : 0;
      return generateDatetime(format, offset);
    }
    return generateDatetime();
  }

  // Simple system variables
  switch (varName) {
    case '$guid':
      return generateGuid();
    case '$timestamp':
      return generateTimestamp();
    case '$randomInt':
      return generateRandomInt();
    case '$datetime':
      return generateDatetime();
    default:
      return null;
  }
}

export function isSystemVariable(varName: string): boolean {
  return varName.startsWith('$');
}
