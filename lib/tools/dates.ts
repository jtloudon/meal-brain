import { z } from 'zod';

/**
 * Tool context for date operations.
 */
export interface ToolContext {
  userId: string;
  householdId: string;
}

/**
 * Tool result types.
 */
export type ToolResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        type: 'VALIDATION_ERROR' | 'PARSE_ERROR';
        field?: string;
        message: string;
      };
    };

/**
 * Zod schema for parsing natural language dates.
 */
export const ParseDateSchema = z.object({
  date_expression: z.string().describe('Natural language date like "Monday", "tomorrow", "next week", "Jan 15"'),
  reference_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format - must be YYYY-MM-DD').optional(),
});

export type ParseDateInput = z.infer<typeof ParseDateSchema>;

/**
 * Parses natural language dates into ISO date strings (YYYY-MM-DD).
 * Handles relative dates like "tomorrow", day names like "Monday", and absolute dates.
 *
 * @param input - Date expression to parse
 * @param context - User context (not used for dates, but kept for consistency)
 * @returns ISO date string (YYYY-MM-DD)
 */
export async function parseDate(
  input: ParseDateInput,
  context: ToolContext
): Promise<ToolResult<{ date: string; day_of_week: string; interpretation: string }>> {
  try {
    // Validate input
    const validated = ParseDateSchema.parse(input);

    // Use reference date if provided, otherwise use today
    // Parse ISO date strings as local time (not UTC) by appending T00:00:00
    const today = validated.reference_date
      ? new Date(validated.reference_date + 'T00:00:00')
      : new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const expression = validated.date_expression.toLowerCase().trim();
    let targetDate: Date;
    let interpretation: string;

    // Handle relative dates
    if (expression === 'today') {
      targetDate = new Date(today);
      interpretation = 'today';
    } else if (expression === 'tomorrow') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
      interpretation = 'tomorrow';
    } else if (expression === 'yesterday') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
      interpretation = 'yesterday';
    }
    // Handle day of week names
    else if (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(expression)) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDayIndex = dayNames.indexOf(expression);
      const todayDayIndex = today.getDay();

      // Calculate days until next occurrence of this day
      let daysUntil = targetDayIndex - todayDayIndex;
      if (daysUntil <= 0) {
        daysUntil += 7; // Next week
      }

      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      interpretation = daysUntil === 1 ? 'tomorrow' : `next ${expression}`;
    }
    // Handle "this week" / "next week"
    else if (expression === 'this week') {
      // Return the start of this week (Sunday)
      const daysSinceSunday = today.getDay();
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysSinceSunday);
      interpretation = 'start of this week (Sunday)';
    } else if (expression === 'next week') {
      // Return the start of next week (Sunday)
      const daysSinceSunday = today.getDay();
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (7 - daysSinceSunday));
      interpretation = 'start of next week (Sunday)';
    }
    // Handle "this [day]" / "next [day]"
    else if (expression.startsWith('this ') || expression.startsWith('next ')) {
      const parts = expression.split(' ');
      const modifier = parts[0]; // 'this' or 'next'
      const dayName = parts[1];

      if (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(dayName)) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDayIndex = dayNames.indexOf(dayName);
        const todayDayIndex = today.getDay();

        let daysUntil = targetDayIndex - todayDayIndex;

        if (modifier === 'this') {
          // "this monday" means the upcoming monday in this week (0-6 days away)
          if (daysUntil < 0) {
            daysUntil += 7;
          }
        } else {
          // "next monday" means the monday after this week (7-13 days away)
          if (daysUntil <= 0) {
            daysUntil += 7;
          }
          daysUntil += 7;
        }

        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntil);
        interpretation = `${modifier} ${dayName}`;
      } else {
        return {
          success: false,
          error: {
            type: 'PARSE_ERROR',
            message: `Could not parse "${expression}". Unknown day name: ${dayName}`,
          },
        };
      }
    }
    // Try to parse as absolute date (e.g., "2026-01-15", "Jan 15", "1/15")
    else {
      try {
        // Try ISO format first
        if (/^\d{4}-\d{2}-\d{2}$/.test(expression)) {
          targetDate = new Date(expression);
        }
        // Try parsing as a date string (e.g., "Jan 15", "January 15")
        else {
          targetDate = new Date(expression);
          // If year is not specified, assume current year
          if (targetDate.getFullYear() === 2001 || targetDate.getFullYear() === 1970) {
            targetDate.setFullYear(today.getFullYear());
          }
        }

        // Validate the parsed date
        if (isNaN(targetDate.getTime())) {
          throw new Error('Invalid date');
        }

        interpretation = 'absolute date';
      } catch {
        return {
          success: false,
          error: {
            type: 'PARSE_ERROR',
            message: `Could not parse "${expression}". Try formats like: "Monday", "tomorrow", "Jan 15", or "2026-01-15"`,
          },
        };
      }
    }

    // Format result
    const isoDate = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      success: true,
      data: {
        date: isoDate,
        day_of_week: dayOfWeek,
        interpretation,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          field: firstError.path.join('.'),
          message: firstError.message,
        },
      };
    }

    return {
      success: false,
      error: {
        type: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Dates tools namespace.
 */
export const dates = {
  parse_date: {
    execute: parseDate,
    schema: ParseDateSchema,
  },
};
