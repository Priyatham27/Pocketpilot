/**
 * Converts a camelCase JS object to a snake_case DB object.
 */
export const mapToSnake = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(mapToSnake);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const snake: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      let value = obj[key];

      // Convert createdAt/updatedAt numbers to ISO strings for DB
      if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'number') {
        value = new Date(value).toISOString();
      }

      // Do not recursively map JSONB fields
      if (['expenses', 'contributions', 'tags', 'notifiedIds', 'shownQuoteIndexes'].includes(key)) {
        snake[snakeKey] = value;
      } else {
        snake[snakeKey] = mapToSnake(value);
      }
    }
  }
  return snake;
};

/**
 * Converts a snake_case DB object to a camelCase JS object.
 */
export const mapToCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(mapToCamel);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const camel: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      let value = obj[key];

      // Convert created_at/updated_at ISO strings back to numeric timestamps for JS
      if ((key === 'created_at' || key === 'updated_at') && typeof value === 'string') {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) {
          value = parsed;
        }
      }

      // Do not recursively map JSONB fields
      if (['expenses', 'contributions', 'tags', 'notified_ids', 'shown_quote_indexes'].includes(key)) {
        camel[camelKey] = value;
      } else {
        camel[camelKey] = mapToCamel(value);
      }
    }
  }
  return camel;
};
