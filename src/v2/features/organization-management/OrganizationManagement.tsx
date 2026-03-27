import React, { useMemo, useState } from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import useIdentity from '../../../shared/hooks/useIdentity';
import messages from '../../../Messages';
import { useIntl } from 'react-intl';
import { useOrgGroups } from '../../data/queries/groupAssignments';
import { BaseGroupAssignmentsTable } from '../workspaces/workspace-detail/components';

const PLACEHOLDER = '--';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const { accountNumber, organizationId, organizationName, isLoading } = useOrganizationData();
  const { orgAdmin } = useIdentity();
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);

  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useOrgGroups(organizationId!, {
    enabled: !isLoading && !!organizationId,
  });

  const tenantResourceId = organizationId ? `redhat/${organizationId}` : '';

  const currentWorkspace = useMemo(
    () =>
      organizationId
        ? { id: tenantResourceId, name: organizationName || intl.formatMessage(messages.organizationWideAccessTitle), type: 'tenant' as const }
        : undefined,
    [organizationId, tenantResourceId, organizationName, intl],
  );

  return (
    <>
      <PageHeader
        title={intl.formatMessage(messages.organizationWideAccessTitle)}
        subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
      >
        <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.organizationNameLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading organization name" width="120px" /> : organizationName || PLACEHOLDER}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.accountNumberLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading account number" width="80px" /> : accountNumber || PLACEHOLDER}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>{intl.formatMessage(messages.organizationIdLabel)} </strong>
              {isLoading ? <Skeleton screenreaderText="Loading organization ID" width="80px" /> : organizationId || PLACEHOLDER}
            </p>
          </FlexItem>
        </Flex>
      </PageHeader>
      <PageSection>
        <BaseGroupAssignmentsTable
          groups={roleBindings}
          isLoading={roleBindingsIsLoading}
          workspaceName={organizationName || intl.formatMessage(messages.organizationWideAccessTitle)}
          currentWorkspace={currentWorkspace}
          canGrantAccess={orgAdmin}
          ouiaId="organization-role-assignments-table"
          syncWithUrl={false}
          isGrantAccessWizardOpen={isGrantAccessOpen}
          onGrantAccessWizardToggle={setIsGrantAccessOpen}
        />
      </PageSection>
    </>
  );
};

export default OrganizationManagement;
