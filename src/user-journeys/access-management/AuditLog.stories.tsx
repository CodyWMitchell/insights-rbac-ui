/**
 * Audit Log Journey
 *
 * Features tested:
 * - Audit log table with columns: Date, Requester, Description, Resource, Action
 * - Data loads from API and renders correctly
 * - Page header with title and subtitle
 * - Navigation to audit log via sidebar
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { auditHandlers, auditLogsForPagination, v2DefaultHandlers } from './_shared';
import { clearAndType, waitForContentReady } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';

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
| Filtering | ✅ Implemented | V1 |
| Pagination | ✅ Implemented | V1 |
| Page header with title and subtitle | ✅ Implemented | — |
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
 * Tests pagination controls on the audit log page: next page updates visible rows.
 */
export const Pagination: Story = {
  parameters: {
    msw: {
      handlers: [
        ...auditHandlers(auditLogsForPagination),
        ...v2DefaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          return !path.includes('auditlogs');
        }),
      ],
    },
    docs: {
      description: {
        story: `
Tests pagination controls on the Audit Log page.

**Expected behavior:**
1. Verify audit log page loaded (25 entries, 20 per page)
2. Verify first page shows "Audit entry 11:" (row on page 1)
3. Click next page
4. Verify second page shows "Audit entry 21:" and page-1 content is no longer visible
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
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();
    });

    await step('Verify pagination: first page then next page', async () => {
      await waitFor(() => {
        expect(canvas.getByText(/Audit entry 11:/)).toBeInTheDocument();
      });
      expect(canvasElement.textContent).toMatch(/25/);

      const nextButtons = canvas.getAllByRole('button', { name: /next/i });
      expect(nextButtons.length).toBeGreaterThan(0);
      await userEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(canvas.getByText(/Audit entry 21:/)).toBeInTheDocument();
      });
      expect(canvas.queryByText(/Audit entry 11:/)).not.toBeInTheDocument();
    });
  },
};

/**
 * Filtering
 *
 * Tests that the audit log table filters correctly by Requester (text),
 * Resource (checkbox), and Action (checkbox), and that Clear all filters restores data.
 */
export const FilterByRequesterResourceAndAction: Story = {
  name: 'Filtering',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering on the Audit Log page.

**Expected behavior:**
1. Filter by Requester "adumble" → only adumble rows (e.g. "Created role Custom Auditor"); bbunny row not visible
2. Add Resource "Group" → only Group rows (e.g. "Deleted group Legacy Access")
3. Add Action "Create" → no results (no entry is adumble + Group + Create); empty state with "Clear all filters"
4. Click "Clear all filters" → table shows data again
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

    await step('Verify audit log page loaded', async () => {
      await expect(canvas.findByRole('heading', { name: /audit log/i })).resolves.toBeInTheDocument();
      await waitFor(
        () => {
          expect(canvas.getByText(/Removed role Cost Management Viewer from group Finance/i)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Filter by Requester "adumble"', async () => {
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by requester/i) as HTMLInputElement, 'adumble');

      await waitFor(() => {
        expect(canvas.getByText(/Created role Custom Auditor/i)).toBeInTheDocument();
        expect(canvas.queryByText(/Removed role Cost Management Viewer from group Finance/i)).not.toBeInTheDocument();
      });
    });

    await step('Add Resource filter "Group"', async () => {
      const filterContainer = canvasElement.querySelector('[data-ouia-component-id="DataViewFilters"]');
      expect(filterContainer).toBeTruthy();
      const filterCanvas = within(filterContainer as HTMLElement);
      const filterButtons = filterCanvas.getAllByRole('button');
      expect(filterButtons.length).toBeGreaterThanOrEqual(2);
      await user.click(filterButtons[0]);

      const resourceOption = await within(document.body).findByRole('menuitem', { name: /^Resource$/i });
      await user.click(resourceOption);

      const filterButtonsAfter = filterCanvas.getAllByRole('button');
      await user.click(filterButtonsAfter[1]);

      const groupMenuItem = await within(document.body).findByRole('menuitem', { name: /^Group$/i });
      const groupCheckbox = within(groupMenuItem).getByRole('checkbox');
      await user.click(groupCheckbox);

      await waitFor(() => {
        expect(canvas.getByText(/Deleted group Legacy Access/i)).toBeInTheDocument();
        expect(canvas.getByText(/Added user ginger-spice to group Platform Users/i)).toBeInTheDocument();
        expect(canvas.queryByText(/Created role Custom Auditor/i)).not.toBeInTheDocument();
      });
    });

    await step('Add Action filter "Create" → no results', async () => {
      const filterContainer = canvasElement.querySelector('[data-ouia-component-id="DataViewFilters"]');
      const filterCanvas = within(filterContainer as HTMLElement);
      const filterButtons = filterCanvas.getAllByRole('button');
      await user.click(filterButtons[0]);

      const actionOption = await within(document.body).findByRole('menuitem', { name: /^Action$/i });
      await user.click(actionOption);

      const filterButtonsAfter = filterCanvas.getAllByRole('button');
      await user.click(filterButtonsAfter[1]);

      const createMenuItem = await within(document.body).findByRole('menuitem', { name: /^Create$/i });
      const createCheckbox = within(createMenuItem).getByRole('checkbox');
      await user.click(createCheckbox);

      await waitFor(() => {
        expect(canvas.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
        expect(canvas.queryByText(/Deleted group Legacy Access/i)).not.toBeInTheDocument();
        expect(canvas.queryByText(/Added user ginger-spice to group Platform Users/i)).not.toBeInTheDocument();
        expect(canvas.getByText(/No audit log entries found/i)).toBeInTheDocument();
      });
    });

    await step('Clear all filters and verify data restored', async () => {
      await user.click(canvas.getByRole('button', { name: /clear all filters/i }));

      await waitFor(() => {
        expect(canvas.getByText(/Created role Custom Auditor/i)).toBeInTheDocument();
        expect(canvas.getByText(/Removed role Cost Management Viewer from group Finance/i)).toBeInTheDocument();
      });
    });
  },
};
