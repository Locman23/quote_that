import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const fileContents = readFileSync(filePath, 'utf8');
  const variables = {};

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    const value = rawValue.replace(/^['"]|['"]$/g, '');
    variables[key] = value;
  }

  return variables;
}

function getEnv(name, env) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function unwrapJoin(target) {
  return Array.isArray(target) ? target[0] : target;
}

async function signOutQuietly(client) {
  try {
    await client.auth.signOut();
  } catch {
    // Ignore cleanup failures.
  }
}

function createSupabaseClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function signInTestUser(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  assert.ifError(error);
  assert.ok(data.user?.id, 'Signed in successfully but no user id was returned.');
  return data.user;
}

async function verifyProfile(client, userId, email) {
  const { data, error } = await client
    .from('profiles')
    .select('id, username, email')
    .eq('id', userId)
    .single();

  assert.ifError(error);
  assert.equal(data.email?.toLowerCase(), email.toLowerCase(), 'Profile email does not match the test account.');
}

async function createGroup(client, groupName) {
  const { data, error } = await client.rpc('create_group_with_admin_membership', {
    group_name: groupName,
  });

  assert.ifError(error);
  assert.ok(data?.[0]?.id, 'Group RPC completed but no group id was returned.');
  return data[0];
}

async function verifyMembership(client, groupId, userId) {
  const { data, error } = await client
    .from('group_members')
    .select('role, group:groups(id, name, join_code)')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  assert.ifError(error);
  const group = unwrapJoin(data?.group);
  assert.ok(group?.id, 'The signed-in user is not a member of the target group.');
  return { membership: data, group };
}

const env = {
  ...parseDotEnvFile(path.join(projectRoot, '.env')),
  ...process.env,
};

const supabaseUrl = getEnv('EXPO_PUBLIC_SUPABASE_URL', env);
const supabaseAnonKey = getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', env);
const memberEmail = getEnv('SUPABASE_E2E_EMAIL', env);
const memberPassword = getEnv('SUPABASE_E2E_PASSWORD', env);
const nonMemberEmail = env.SUPABASE_E2E_NON_MEMBER_EMAIL?.trim() || '';
const nonMemberPassword = env.SUPABASE_E2E_NON_MEMBER_PASSWORD?.trim() || '';
const shouldRunNonMemberTest = Boolean(nonMemberEmail && nonMemberPassword);
const testRunId = Date.now();
const startedAt = new Date().toISOString();

const memberClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
const nonMemberClient = shouldRunNonMemberTest
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : null;

let memberUser;
let nonMemberUser = null;
let targetGroupId = env.SUPABASE_E2E_GROUP_ID?.trim() || null;
let createdTargetGroupName = null;
let restrictedGroupId = null;

before(async () => {
  memberUser = await signInTestUser(memberClient, memberEmail, memberPassword);
  await verifyProfile(memberClient, memberUser.id, memberEmail);

  if (!targetGroupId) {
    createdTargetGroupName = `E2E Test ${testRunId}`;
    const createdGroup = await createGroup(memberClient, createdTargetGroupName);
    targetGroupId = createdGroup.id;
  }

  await verifyMembership(memberClient, targetGroupId, memberUser.id);

  if (nonMemberClient) {
    nonMemberUser = await signInTestUser(nonMemberClient, nonMemberEmail, nonMemberPassword);
    await verifyProfile(nonMemberClient, nonMemberUser.id, nonMemberEmail);

    if (env.SUPABASE_E2E_GROUP_ID?.trim()) {
      const restrictedGroup = await createGroup(memberClient, `E2E Restricted ${testRunId}`);
      restrictedGroupId = restrictedGroup.id;
    } else {
      restrictedGroupId = targetGroupId;
    }
  }
});

after(async () => {
  await signOutQuietly(memberClient);

  if (nonMemberClient) {
    await signOutQuietly(nonMemberClient);
  }
});

test('member can create, read, update, and delete a quote in the target group', async () => {
  const initialContent = `Supabase E2E quote ${testRunId}`;
  const updatedContent = `${initialContent} updated`;
  const initialContext = `created at ${startedAt}`;

  const { data: createdQuote, error: createQuoteError } = await memberClient
    .from('quotes')
    .insert({
      group_id: targetGroupId,
      created_by: memberUser.id,
      quoted_person_name: 'E2E Tester',
      content: initialContent,
      context: initialContext,
    })
    .select('id, group_id, created_by, quoted_person_name, content, context, created_at, updated_at')
    .single();

  assert.ifError(createQuoteError);
  assert.equal(createdQuote.group_id, targetGroupId, 'Created quote group id does not match the target group.');
  assert.equal(createdQuote.created_by, memberUser.id, 'Created quote owner does not match the signed-in user.');

  const { data: quoteFeed, error: quoteFeedError } = await memberClient
    .from('quotes')
    .select('id, content')
    .eq('group_id', targetGroupId)
    .order('created_at', { ascending: false });

  assert.ifError(quoteFeedError);
  assert.ok(
    Array.isArray(quoteFeed) && quoteFeed.some((quote) => quote.id === createdQuote.id),
    'The newly created quote was not returned in the group feed.'
  );

  const { data: updatedQuote, error: updateQuoteError } = await memberClient
    .from('quotes')
    .update({
      content: updatedContent,
      context: 'updated by E2E test',
      updated_at: new Date().toISOString(),
    })
    .eq('id', createdQuote.id)
    .eq('created_by', memberUser.id)
    .select('id, content, context')
    .single();

  assert.ifError(updateQuoteError);
  assert.equal(updatedQuote.content, updatedContent, 'The quote update did not persist the new content.');

  const { data: deletedQuote, error: deleteQuoteError } = await memberClient
    .from('quotes')
    .delete()
    .eq('id', createdQuote.id)
    .eq('created_by', memberUser.id)
    .select('id')
    .single();

  assert.ifError(deleteQuoteError);
  assert.equal(deletedQuote.id, createdQuote.id, 'Quote delete did not return the deleted quote id.');

  const { data: deletedCheck, error: deletedCheckError } = await memberClient
    .from('quotes')
    .select('id')
    .eq('id', createdQuote.id)
    .maybeSingle();

  assert.ifError(deletedCheckError);
  assert.equal(deletedCheck, null, 'The deleted quote is still queryable.');
});

test(
  'non-member cannot insert quote into a group they do not belong to',
  { skip: shouldRunNonMemberTest ? false : 'Set SUPABASE_E2E_NON_MEMBER_EMAIL and SUPABASE_E2E_NON_MEMBER_PASSWORD to run this test.' },
  async () => {
    const { data: membership, error: membershipError } = await nonMemberClient
      .from('group_members')
      .select('id')
      .eq('group_id', restrictedGroupId)
      .eq('user_id', nonMemberUser.id)
      .maybeSingle();

    assert.ifError(membershipError);
    assert.equal(membership, null, 'The non-member test account already belongs to the restricted group.');

    const forbiddenContent = `Forbidden quote ${testRunId}`;
    const { data: insertedQuote, error: insertError } = await nonMemberClient
      .from('quotes')
      .insert({
        group_id: restrictedGroupId,
        created_by: nonMemberUser.id,
        quoted_person_name: 'Blocked User',
        content: forbiddenContent,
        context: 'This write should be denied by RLS.',
      })
      .select('id')
      .maybeSingle();

    assert.ok(insertError, 'The non-member quote insert unexpectedly succeeded.');
    assert.equal(insertedQuote, null, 'The non-member quote insert unexpectedly returned a row.');

    const { data: forbiddenQuoteCheck, error: forbiddenQuoteCheckError } = await memberClient
      .from('quotes')
      .select('id')
      .eq('group_id', restrictedGroupId)
      .eq('content', forbiddenContent);

    assert.ifError(forbiddenQuoteCheckError);
    assert.equal(forbiddenQuoteCheck.length, 0, 'A forbidden quote was persisted even though the insert failed.');
  }
);

if (createdTargetGroupName) {
  test('reports the temporary target group created for this run', () => {
    assert.ok(targetGroupId, 'Expected a target group id for the created temporary group.');
    console.log(`Temporary target group left in Supabase: ${createdTargetGroupName} (${targetGroupId})`);
  });
}