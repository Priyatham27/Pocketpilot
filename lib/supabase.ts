/**
 * @deprecated
 * This file is kept for backward compatibility.
 * New code should import directly from:
 *   - '@/lib/supabase/client' (for client components)
 *   - '@/lib/supabase/server'  (for server components / route handlers)
 *   - '@/lib/supabase/utils'   (for mapToSnake / mapToCamel)
 */

import { createClient } from './supabase/client';
export { mapToSnake, mapToCamel } from './supabase/utils';

export const supabase = createClient();
