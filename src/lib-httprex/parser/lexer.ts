/**
 * Lexer for variable extraction
 * Extracts {{varName}} patterns and tracks their positions
 */

import { VariableReference } from '../types';

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;
const FILE_VARIABLE_REGEX = /^@(\w+)\s*=\s*(.+)$/;

export interface ExtractedVariables {
  variables: VariableReference[];
  text: string; // Original text with variables intact
}

export function extractVariables(text: string, startLine: number = 1): ExtractedVariables {
  const variables: VariableReference[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = startLine + i;

    // Reset regex state
    VARIABLE_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = VARIABLE_REGEX.exec(line)) !== null) {
      const varName = match[1].trim();
      const column = match.index;

      variables.push({
        name: varName,
        line: lineNumber,
        column
      });
    }
  }

  return { variables, text };
}

export interface FileVariable {
  name: string;
  value: string;
  line: number;
}

export function extractFileVariables(lines: string[]): FileVariable[] {
  const fileVariables: FileVariable[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for file variable definition: @varName = value
    const match = line.match(FILE_VARIABLE_REGEX);
    if (match) {
      fileVariables.push({
        name: match[1],
        value: match[2].trim(),
        line: i + 1
      });
    }
  }

  return fileVariables;
}

export function resolveVariables(
  text: string,
  variables: Record<string, string>
): string {
  // Replace all {{varName}} with actual values
  return text.replace(VARIABLE_REGEX, (match, varName) => {
    const trimmedName = varName.trim();
    return variables[trimmedName] !== undefined ? variables[trimmedName] : match;
  });
}

export function hasUnresolvedVariables(text: string): boolean {
  VARIABLE_REGEX.lastIndex = 0;
  return VARIABLE_REGEX.test(text);
}
