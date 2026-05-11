import { z } from 'zod';

export const quoteFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Quote text is required')
    .max(280, 'Quote text must be 280 characters or fewer'),
  quotedPersonName: z
    .string()
    .trim()
    .min(1, 'Who said it is required')
    .max(60, 'Name must be 60 characters or fewer'),
  context: z
    .string()
    .trim()
    .max(120, 'Context must be 120 characters or fewer')
    .optional(),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

function getFallbackMessage(action: 'create' | 'update' | 'delete') {
  switch (action) {
    case 'update':
      return 'Unable to update the quote right now.';
    case 'delete':
      return 'Unable to delete the quote right now.';
    case 'create':
    default:
      return 'Unable to create the quote right now.';
  }
}

export function getQuoteMutationErrorMessage(
  action: 'create' | 'update' | 'delete',
  error: unknown
) {
  const fallbackMessage = getFallbackMessage(action);

  if (error && typeof error === 'object' && 'message' in error) {
    const rawMessage = String(error.message);
    const message = rawMessage.toLowerCase();

    if (message.includes('signed in')) {
      return `You must be signed in to ${action} a quote.`;
    }

    if (message.includes('invalid') && message.includes('group')) {
      return 'The selected group is invalid.';
    }

    if (message.includes('access')) {
      return 'You no longer have access to this group.';
    }

    if (message.includes('edit quotes you created')) {
      return 'You can only edit quotes you created.';
    }

    if (message.includes('delete quotes you created')) {
      return 'You can only delete quotes you created.';
    }

    if (message.includes('selected quote is invalid')) {
      return 'The selected quote is invalid.';
    }

    return rawMessage || fallbackMessage;
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  return error.message || fallbackMessage;
}