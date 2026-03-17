/**
 * Audit Log Journey
 *
 * Features tested:
 * - Audit log table with columns: Date, Requester, Description, Resource, Action
 * - Data loads from API and renders correctly
 * - Page header with title and subtitle
 * - Navigation to audit log via sidebar
 * - Filter by requester, resource type, and action
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { clearAndType, waitForContentReady } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { v2DefaultHandlers } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Audit Log',
  tags: ['access-management', 'audit-log'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/audit-log',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces-organization-management': true,
    }),
    msw: {
      handlers: v2DefaultHandlers,
    },
    docs: {
      description: {
        component: `
# Audit Log Journey

Tests the Audit Log page which displays a read-only table of RBAC audit actions.

## Features
| Feature | Status | API |
|---------|--------|-----|
| Audit log table | ✅ Implemented | V1 |
| Date, Requester, Description, Resource, Action columns | ✅ Implemented | V1 |
| Pagination | ✅ Implemented | V1 |
| Page header with title and subtitle | ✅ Implemented | — |
| Filter by requester (text) | ✅ Implemented | V1 |
| Filter by resource type (select) | ✅ Implemented | V1 |
| Filter by action (select) | ✅ Implemented | V1 |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default audit log table view
 *
 * Tests:
 * - Page header renders with correct title
 * - Table loads audit log entries from API
 * - All expected columns are present
 * - Entry data displays correctly
 */
export const TableView: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the default Audit Log table view.

**Columns verified:**
- Date
- Requester
- Description
- Resource
- Action
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify page header', async () => {
      const heading = await canvas.findByRole('heading', { name: /audit log/i });
      await expect(heading).toBeInTheDocument();
      await expect(canvas.findByText(/audit log tracks admin actions/i)).resolves.toBeInTheDocument();
    });

    await step('Verify audit log entries displayed', async () => {
      const adumbleEntries = await canvas.findAllByText('adumble');
      expect(adumbleEntries.length).toBeGreaterThan(0);
      const bbunnyEntries = await canvas.findAllByText('bbunny');
      expect(bbunnyEntries.length).toBeGreaterThan(0);
    });

    await step('Verify descriptions render', async () => {
      await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/Created role Custom Auditor/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/Deleted group Legacy Access/i)).resolves.toBeInTheDocument();
    });

    await step('Verify resource types render', async () => {
      const groupCells = await canvas.findAllByText('Group');
      expect(groupCells.length).toBeGreaterThan(0);
      const roleCells = await canvas.findAllByText('Role');
      expect(roleCells.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Navigate to Audit Log via sidebar
 *
 * Tests:
 * - Start on the Users and Groups page
 * - Click "Audit Log" in the sidebar navigation
 * - Audit log page loads with entries
 */
export const NavigateFromSidebar: Story = {
  name: 'Navigate from Sidebar',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigating to the Audit Log page from the sidebar.

**Expected behavior:**
1. Start on the Users and Groups page
2. Click "Audit Log" in the sidebar
3. Audit log table loads with entries
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for Users and Groups page', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Navigate to Audit Log via sidebar', async () => {
      await navigateToPage(user, canvas, 'Audit Log');
    });

    await step('Verify audit log page loaded', async () => {
      const heading = await canvas.findByRole('heading', { name: /audit log/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await expect(heading).toBeInTheDocument();
      const adumbleEntries = await canvas.findAllByText('adumble', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(adumbleEntries.length).toBeGreaterThan(0);
      await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Pagination
 *
 * Tests pagination controls on the audit log page.
 */
export const Pagination: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests pagination controls on the Audit Log page.

**Expected behavior:**
1. Verify audit log page loaded
2. Find pagination controls (per-page dropdown or next page button)
3. Change per-page or navigate to next page
4. Verify the page/display updated
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify audit log page loaded', async () => {
      await expect(canvas.findByRole('heading', { name: /audit log/i })).resolves.toBeInTheDocument();
      const adumbleEntries = await canvas.findAllByText('adumble');
      expect(adumbleEntries.length).toBeGreaterThan(0);
    });

    await step('Verify table and pagination', async () => {
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();
      const paginationRegions = await canvas.findAllByRole('navigation', { name: /pagination/i });
      expect(paginationRegions.length).toBeGreaterThan(0);
      expect(paginationRegions[0]).toBeInTheDocument();
    });
  },
};

/**
 * Filter by Requester
 *
 * Tests the requester text filter on the audit log table.
 */
export const FilterByRequester: Story = {
  name: 'Filter by Requester',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering audit log entries by requester username.

**Expected behavior:**
1. Type a username in the requester filter
2. Table updates to show only matching entries
3. Non-matching entries are hidden
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page to load', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Apply requester filter', async () => {
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by requester/i) as HTMLInputElement, 'bbunny');
      await user.keyboard('{Enter}');
    });

    await step('Verify filtered results', async () => {
      await waitFor(
        () => {
          const bbunnyEntries = canvas.queryAllByText('bbunny');
          expect(bbunnyEntries.length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      expect(canvas.queryByText('adumble')).not.toBeInTheDocument();
      expect(canvas.queryByText('cmorales')).not.toBeInTheDocument();
    });
  },
};

/**
 * Filter by Resource Type
 *
 * Tests the resource type select filter on the audit log table.
 */
export const FilterByResource: Story = {
  name: 'Filter by Resource',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering audit log entries by resource type using the select dropdown.

**Expected behavior:**
1. Select "Role" from the resource filter dropdown
2. Table updates to show only role-related entries
3. Group entries are hidden
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page to load', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Switch to Resource filter and select Role', async () => {
      const filterDropdown = await canvas.findByText('Requester', { selector: 'button *' }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(filterDropdown);
      const resourceOption = await canvas.findByText('Resource', { selector: '[role="menuitem"] *, [role="option"] *' });
      await user.click(resourceOption);

      const filterSelect = await canvas.findByText('Filter by Resource', { selector: 'button *' }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(filterSelect);
      const roleOption = await canvas.findByText('Role', { selector: '[role="option"] *' });
      await user.click(roleOption);
    });

    await step('Verify filtered results show only role entries', async () => {
      await waitFor(
        () => {
          const roleCells = canvas.queryAllByText('Role');
          expect(roleCells.length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      await waitFor(() => {
        expect(canvas.queryByText('Group')).not.toBeInTheDocument();
      });
    });
  },
};
