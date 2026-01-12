/**
 * Request separator parser
 * Splits multi-request files by ### separator (VSCode REST Client format)
 */

export interface RequestBlock {
  content: string;
  startLine: number;
  endLine: number;
  name?: string; // From # @name requestName
}

const SEPARATOR_REGEX = /^#{3,}\s*$/; // 3 or more # symbols
const NAME_REGEX = /^#\s*@name\s+(\w+)\s*$/; // # @name requestName
const COMMENT_REGEX = /^(#|\/\/)(.*)$/; // # or // comments

export function splitRequests(text: string): RequestBlock[] {
  const lines = text.split('\n');
  const blocks: RequestBlock[] = [];

  let currentBlock: string[] = [];
  let currentStartLine = 1;
  let currentName: string | undefined;
  let foundSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for separator
    if (SEPARATOR_REGEX.test(line.trim())) {
      foundSeparator = true;
      // Finalize current block if it has content (and it's not just file variables)
      if (currentBlock.length > 0) {
        const content = currentBlock.join('\n').trim();
        if (content && !isOnlyFileVariables(content)) {
          blocks.push({
            content,
            startLine: currentStartLine,
            endLine: lineNumber - 1,
            name: currentName
          });
        }
      }

      // Start new block
      currentBlock = [];
      currentStartLine = lineNumber + 1;
      currentName = undefined;
      continue;
    }

    // Check for request name comment
    const nameMatch = line.trim().match(NAME_REGEX);
    if (nameMatch) {
      currentName = nameMatch[1];
      currentBlock.push(line); // Keep the comment line
      continue;
    }

    // Add line to current block
    currentBlock.push(line);
  }

  // Finalize last block
  if (currentBlock.length > 0) {
    const content = currentBlock.join('\n').trim();
    if (content && !isOnlyFileVariables(content)) {
      blocks.push({
        content,
        startLine: currentStartLine,
        endLine: lines.length,
        name: currentName
      });
    }
  }

  // If no separators found, treat entire file as one request (unless it's only file variables)
  if (!foundSeparator && lines.length > 0) {
    const content = text.trim();
    if (content && !isOnlyFileVariables(content)) {
      blocks.push({
        content,
        startLine: 1,
        endLine: lines.length
      });
    }
  }

  return blocks;
}

/**
 * Check if content is only file variable definitions
 */
function isOnlyFileVariables(content: string): boolean {
  const lines = content.split('\n');
  const FILE_VAR_REGEX = /^@\w+\s*=\s*.+$/;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }
    // If we find a non-variable line, it's not only variables
    if (!FILE_VAR_REGEX.test(trimmed)) {
      return false;
    }
  }

  return true;
}

export function extractRequestName(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.trim().match(NAME_REGEX);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

export function removeComments(lines: string[]): string[] {
  return lines.filter(line => {
    const trimmed = line.trim();
    // Keep the line if it's not a comment
    // But keep @name comments as they're metadata
    if (trimmed.match(NAME_REGEX)) {
      return false; // Remove @name comments from actual request
    }
    if (trimmed.match(COMMENT_REGEX) && !trimmed.startsWith('@')) {
      return false; // Remove regular comments
    }
    return true;
  });
}

export function isComment(line: string): boolean {
  const trimmed = line.trim();
  return COMMENT_REGEX.test(trimmed);
}

export function isSeparator(line: string): boolean {
  return SEPARATOR_REGEX.test(line.trim());
}
