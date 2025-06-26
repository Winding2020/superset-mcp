const JINJA_REGEX = /({{[\s\S]*?}})|({%[\s\S]*?%})/g;

/**
 * Replaces Jinja template blocks with placeholders.
 * @param sql The SQL string with Jinja templates.
 * @returns An object with the protected SQL and an array of the original Jinja blocks.
 */
export function protectJinja(sql: string): { protectedSql: string; blocks: string[] } {
  const blocks: string[] = [];
  const protectedSql = sql.replace(JINJA_REGEX, (match) => {
    const placeholder = `/*__JINJA_BLOCK_${blocks.length}__*/`;
    blocks.push(match);
    return placeholder;
  });
  return { protectedSql, blocks };
}

/**
 * Restores Jinja template blocks from placeholders.
 * @param sql The SQL string with placeholders.
 * @param blocks The array of original Jinja blocks.
 * @returns The SQL string with Jinja templates restored.
 */
export function restoreJinja(sql: string, blocks: string[]): string {
  let restoredSql = sql;
  blocks.forEach((block, index) => {
    const placeholder = new RegExp(`\\/\\*__JINJA_BLOCK_${index}__\\*\\/`, 'g');
    restoredSql = restoredSql.replace(placeholder, block);
  });
  return restoredSql;
} 