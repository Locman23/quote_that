import { supabase } from './supabase';
import { parseUuid } from './validation';
import type { QuoteRecord } from '../types';

type QuoteMutationValues = {
  content: string;
  quotedPersonName: string;
  context?: string;
};

const QUOTE_SELECT = 'id, group_id, created_by, quoted_person_name, content, context, created_at, updated_at';

async function ensureGroupMembership(groupId: string, userId: string) {
  const verifiedGroupId = parseUuid(groupId, 'The selected group is invalid.');

  const { data, error } = await supabase
    .from('group_members')
    .select('group:groups(id)')
    .eq('group_id', verifiedGroupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const group = Array.isArray(data?.group) ? data.group[0] : data?.group;

  if (!group) {
    throw new Error('You no longer have access to this group.');
  }

  return verifiedGroupId;
}

export async function listQuotesForGroup(groupId: string) {
  const verifiedGroupId = parseUuid(groupId, 'The selected group is invalid.');
  const { data, error } = await supabase
    .from('quotes')
    .select(QUOTE_SELECT)
    .eq('group_id', verifiedGroupId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as QuoteRecord[];
}

export async function createQuote({
  groupId,
  userId,
  values,
}: {
  groupId: string;
  userId: string;
  values: QuoteMutationValues;
}) {
  const verifiedGroupId = await ensureGroupMembership(groupId, userId);
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      group_id: verifiedGroupId,
      created_by: userId,
      quoted_person_name: values.quotedPersonName.trim(),
      content: values.content.trim(),
      context: values.context?.trim() || null,
    })
    .select(QUOTE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as QuoteRecord;
}

export async function updateOwnQuote({
  groupId,
  quoteId,
  userId,
  values,
}: {
  groupId: string;
  quoteId: string;
  userId: string;
  values: QuoteMutationValues;
}) {
  const verifiedGroupId = await ensureGroupMembership(groupId, userId);
  const verifiedQuoteId = parseUuid(quoteId, 'The selected quote is invalid.');
  const { data, error } = await supabase
    .from('quotes')
    .update({
      quoted_person_name: values.quotedPersonName.trim(),
      content: values.content.trim(),
      context: values.context?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', verifiedQuoteId)
    .eq('group_id', verifiedGroupId)
    .eq('created_by', userId)
    .select(QUOTE_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('You can only edit quotes you created.');
  }

  return data as QuoteRecord;
}

export async function deleteOwnQuote({
  groupId,
  quoteId,
  userId,
}: {
  groupId: string;
  quoteId: string;
  userId: string;
}) {
  const verifiedGroupId = await ensureGroupMembership(groupId, userId);
  const verifiedQuoteId = parseUuid(quoteId, 'The selected quote is invalid.');
  const { data, error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', verifiedQuoteId)
    .eq('group_id', verifiedGroupId)
    .eq('created_by', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('You can only delete quotes you created.');
  }
}