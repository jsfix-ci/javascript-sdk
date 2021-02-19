import { authenticate, fetchHealthCheck, fetchUserDetails } from '../src/oauth2-api';

describe('Users', () => {
  it('Can get health', async () => {
    const health = await fetchHealthCheck();

    expect(health).toBe(true);
  });

  it('Authenticate', async () => {
    const tokens = await authenticate('pieter.frederix@fibricheck.com', 'EdenHazardQ1010!');
    console.log('tokens', tokens);
    expect(tokens.access_token);
  });

  it('Get User', async () => {
    const user = await fetchUserDetails();
    console.log('user', user);
    expect(user.id);
  });
});
