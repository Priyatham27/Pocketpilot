import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials missing. Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      // Do not recursively map JSONB fields like expenses, contributions, tags
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
      // Do not recursively map JSONB fields like expenses, contributions, tags
      if (['expenses', 'contributions', 'tags', 'notified_ids', 'shown_quote_indexes'].includes(key)) {
        camel[camelKey] = value;
      } else {
        camel[camelKey] = mapToCamel(value);
      }
    }
  }
  return camel;
};
