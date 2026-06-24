import { test as setup, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

const API_URL = process.env.API_URL ?? 'http://localhost:8080';

// POST /api/auth authenticates by email (LoginBody = { email, password }),
// not username — so the login fixtures use *_EMAIL env vars. The username
// vars remain for specs that assert on the displayed username.
async function saveAuthState(
  email: string,
  password: string,
  statePath: string
): Promise<void> {
  const ctx = await playwrightRequest.newContext({ baseURL: API_URL });

  const res = await ctx.post('/api/auth', {
    data: { email, password }
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed for "${email}" (${res.status()}): ${body}`);
  }

  const state = await ctx.storageState();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  await ctx.dispose();
}

setup('authenticate as regular user', async () => {
  const email = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
  const password = process.env.TEST_USER_PASSWORD ?? 'testpass';
  await saveAuthState(email, password, AUTH_USER);
});

setup('authenticate as staff user', async () => {
  const email = process.env.TEST_STAFF_EMAIL ?? 'staffuser@example.com';
  const password = process.env.TEST_STAFF_PASSWORD ?? 'staffpass';
  await saveAuthState(email, password, AUTH_STAFF);
});
