import { delay } from 'msw';
import { resetRegistry } from '../../../utilities/store';

/**
 * Helper function to reset story state and clean up notifications
 * Call this at the start of every play function for test isolation
 */
export async function resetStoryState(): Promise<void> {
  // Set up window.insights.chrome for components that access it directly
  if (typeof window !== 'undefined') {
    (window as any).insights = {
      chrome: {
        auth: {
          getToken: () => Promise.resolve('mock-token-12345'),
          getUser: () =>
            Promise.resolve({
              identity: {
                user: {
                  username: 'test-user',
                  email: 'test@redhat.com',
                  first_name: 'Test',
                  last_name: 'User',
                  is_org_admin: true,
                },
                internal: {
                  account_id: 'mock-account-123',
                  org_id: 'mock-org-456',
                },
              },
            }),
        },
        isProd: () => false,
      },
    };
  }

  // Reset Redux store to fresh state
  resetRegistry();

  // Reset MSW state for test isolation
  const response = await fetch('/api/test/reset-state', { method: 'POST' });
  await response.json(); // Ensure the request completes fully

  // Clear any lingering notifications from previous runs
  const existingNotifications = document.querySelectorAll('.pf-v5-c-alert');
  existingNotifications.forEach((notification) => notification.remove());

  // Give React time to process any state updates and re-renders
  // This ensures components refetch fresh data after the reset
  await delay(500);
}
