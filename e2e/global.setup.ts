import { test as setup, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';
import { AUTH_USER, AUTH_STAFF } from './auth-paths';

const API_URL = process.env.API_URL ?? 'http://localhost:8080';

async function saveAuthState(
  username: string,
  password: string,
  statePath: string
): Promise<void> {
  const ctx = await playwrightRequest.newContext({ baseURL: API_URL });

  const res = await ctx.post('/api/auth', {
    data: { username, password }
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `Login failed for "${username}" (${res.status()}): ${body}`
    );
  }

  const state = await ctx.storageState();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  await ctx.dispose();
}

setup('authenticate as regular user', async () => {
  const username = process.env.TEST_USER ?? 'testuser';
  const password = process.env.TEST_USER_PASSWORD ?? 'testpass';
  await saveAuthState(username, password, AUTH_USER);
});

setup('authenticate as staff user', async () => {
  const username = process.env.TEST_STAFF_USER ?? 'staffuser';
  const password = process.env.TEST_STAFF_PASSWORD ?? 'staffpass';
  await saveAuthState(username, password, AUTH_STAFF);
});
