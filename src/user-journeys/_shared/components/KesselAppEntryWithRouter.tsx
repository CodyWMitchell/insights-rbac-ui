import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppEntry from '../../../AppEntry';
import MyUserAccess from '../../../features/myUserAccess/MyUserAccess';
import WorkspaceDetail from '../../../features/workspaces/workspace-detail/WorkspaceDetail';
import { FakeAddressBar } from './FakeAddressBar';
import { KesselNavigation } from './KesselNavigation';
import { Masthead, MastheadMain, Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core';

interface KesselAppEntryWithRouterProps {
  initialRoute?: string;
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
}

/**
 * Wrapper component for Kessel (Workspaces) journey tests
 * Uses KesselNavigation instead of LeftNavigation to include Workspaces link
 */
export const KesselAppEntryWithRouter: React.FC<KesselAppEntryWithRouterProps> = ({ initialRoute = '/iam/user-access/groups' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Page
        header={
          <Masthead>
            <MastheadMain>
              <FakeAddressBar />
            </MastheadMain>
          </Masthead>
        }
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <KesselNavigation />
            </PageSidebarBody>
          </PageSidebar>
        }
      >
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route
              path="/iam/my-user-access"
              element={
                <div style={{ padding: 0, margin: 0 }}>
                  <MyUserAccess />
                </div>
              }
            />
            {/* Explicit workspace detail route for M3+ */}
            <Route path="/iam/user-access/workspaces/detail/:workspaceId" element={<WorkspaceDetail />} />
            <Route path="/iam/user-access/*" element={<AppEntry />} />
            <Route path="/iam/access-management/*" element={<AppEntry />} />
          </Routes>
        </Suspense>
      </Page>
    </MemoryRouter>
  );
};

/**
 * Helper to create dynamic environment parameters from story args
 */
export const createDynamicEnvironment = (args: KesselAppEntryWithRouterProps) => {
  return {
    chrome: {
      environment: 'prod',
      getUserPermissions: () => {
        const { orgAdmin = false, userAccessAdministrator = false } = args;
        let permissions;
        if (orgAdmin) {
          permissions = [
            { permission: 'rbac:*:*', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
            { permission: 'inventory:groups:write', resourceDefinitions: [] },
            { permission: 'inventory:groups:*', resourceDefinitions: [] },
          ];
        } else if (userAccessAdministrator) {
          permissions = [
            { permission: 'rbac:group:*', resourceDefinitions: [] },
            { permission: 'rbac:principal:*', resourceDefinitions: [] },
            { permission: 'rbac:role:read', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
          ];
        } else {
          permissions = [
            { permission: 'rbac:group:read', resourceDefinitions: [] },
            { permission: 'rbac:role:read', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
          ];
        }
        return Promise.resolve(permissions);
      },
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
              user: {
                username: 'test-user',
                email: 'test@redhat.com',
                first_name: 'Test',
                last_name: 'User',
                is_org_admin: args.orgAdmin || false,
              },
            },
            entitlements: {
              ansible: { is_entitled: true },
              cost_management: { is_entitled: true },
              insights: { is_entitled: true },
              openshift: { is_entitled: true },
              rhel: { is_entitled: true },
              smart_management: { is_entitled: false },
            },
          }),
        getToken: () => Promise.resolve('mock-token-12345'),
      },
      isBeta: () => false,
      getEnvironment: () => 'prod',
      getBundle: () => 'iam',
      getApp: () => 'user-access',
    },
    featureFlags: {
      'platform.rbac.workspaces': args['platform.rbac.workspaces'] ?? false,
      'platform.rbac.workspaces-list': args['platform.rbac.workspaces-list'] ?? false,
      'platform.rbac.workspace-hierarchy': args['platform.rbac.workspace-hierarchy'] ?? false,
      'platform.rbac.workspaces-role-bindings': args['platform.rbac.workspaces-role-bindings'] ?? false,
      'platform.rbac.workspaces-role-bindings-write': args['platform.rbac.workspaces-role-bindings-write'] ?? false,
      'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'] ?? false,
      'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'] ?? false,
      'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] ?? false,
      'platform.rbac.common.userstable': args['platform.rbac.common.userstable'] ?? false,
      'platform.rbac.itless': false,
    },
  };
};
