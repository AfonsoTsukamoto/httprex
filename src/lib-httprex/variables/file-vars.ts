/**
 * File variables
 * Re-exports file variable extraction from lexer
 * @varName = value syntax
 */

export { extractFileVariables, type FileVariable } from '../parser/lexer';

export function parseFileVariables(lines: string[]): Record<string, string> {
  const { extractFileVariables } = require('../parser/lexer');
  const fileVars = extractFileVariables(lines);
  const result: Record<string, string> = {};

  fileVars.forEach((v: any) => {
    result[v.name] = v.value;
  });

  return result;
}
