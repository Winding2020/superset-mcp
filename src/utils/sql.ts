const JINJA_REGEX = /({{[\s\S]*?}})|({%[\s\S]*?%})|({#[\s\S]*?#})/g;
const JINJA_PLACEHOLDER_REGEX = /\/\*__JINJA_BLOCK_(\d+)__\*\//g;

/**
 * Replaces Jinja template blocks with placeholders.
 * @param sql The SQL string with Jinja templates.
 * @param blocks An array to which the extracted Jinja blocks will be appended.
 * @returns The SQL string with placeholders.
 */
export function protectJinja(sql: string, blocks: string[]): string {
  if (!sql) return '';
  return sql.replace(JINJA_REGEX, (match) => {
    const placeholder = `/*__JINJA_BLOCK_${blocks.length}__*/`;
    blocks.push(match);
    return placeholder;
  });
}

/**
 * Restores Jinja template blocks from placeholders.
 * @param sql The SQL string with placeholders.
 * @param blocks The array of original Jinja blocks.
 * @returns The SQL string with Jinja templates restored.
 */
export function restoreJinja(sql: string, blocks: string[]): string {
  if (!sql) return '';
  return sql.replace(JINJA_PLACEHOLDER_REGEX, (match, blockIndex) => {
    const index = parseInt(blockIndex, 10);
    // Return original placeholder if index is out of bounds, though this shouldn't happen in normal operation.
    return blocks[index] ?? match;
  });
} 