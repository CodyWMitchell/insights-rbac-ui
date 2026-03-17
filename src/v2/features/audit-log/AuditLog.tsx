import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { TableView, useTableState } from '../../../shared/components/table-view';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../shared/components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../shared/components/table-view/types';
import { type GetAuditlogsParams, useAuditLogsQuery } from '../../data/queries/audit';
import type { AuditLog as ApiAuditLog } from '../../data/queries/audit';
import type { GetAuditlogsActionEnum, GetAuditlogsResourceTypeEnum } from '../../data/api/audit';
import { AuditActionEnum, AuditResourceTypeEnum } from '../../data/api/audit';
import { getDateFormat } from '../../../shared/helpers/stringUtilities';
import messages from '../../../Messages';

export type { AuditLogEntry } from './AuditLogTable';

interface AuditLogRow {
  id: string;
  date: string;
  requester: string;
  description: string;
  resource: string;
  action: string;
}

const columns = ['date', 'requester', 'description', 'resource', 'action'] as const;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function mapApiEntry(entry: ApiAuditLog, index: number, offset: number): AuditLogRow {
  return {
    id: String(offset + index),
    date: entry.created ?? '',
    requester: entry.principal_username ?? '',
    description: entry.description ?? '',
    resource: capitalize(entry.resource_type ?? ''),
    action: capitalize(entry.action ?? ''),
  };
}

const AuditLog: React.FC = () => {
  const intl = useIntl();

  const resourceTypeOptions = useMemo(
    () => [
      { id: AuditResourceTypeEnum.Group, label: intl.formatMessage(messages.group) },
      { id: AuditResourceTypeEnum.Role, label: intl.formatMessage(messages.role) },
      { id: AuditResourceTypeEnum.User, label: intl.formatMessage(messages.userCapitalized) },
      { id: AuditResourceTypeEnum.Permission, label: intl.formatMessage(messages.permission) },
    ],
    [intl],
  );

  const actionOptions = useMemo(
    () => [
      { id: AuditActionEnum.Add, label: intl.formatMessage(messages.add) },
      { id: AuditActionEnum.Remove, label: intl.formatMessage(messages.remove) },
      { id: AuditActionEnum.Create, label: intl.formatMessage(messages.create) },
      { id: AuditActionEnum.Delete, label: intl.formatMessage(messages.delete) },
      { id: AuditActionEnum.Edit, label: intl.formatMessage(messages.edit) },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, AuditLogRow>({
    columns,
    getRowId: (row) => row.id,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50],
    initialFilters: { requester: '', resource_type: [] as string[], action: [] as string[] },
    syncWithUrl: true,
  });

  const requesterFilter = (tableState.filters.requester as string) || undefined;
  const resourceTypeArr = tableState.filters.resource_type as string[] | undefined;
  const actionArr = tableState.filters.action as string[] | undefined;
  const resourceTypeFilter = resourceTypeArr?.length ? resourceTypeArr : undefined;
  const actionFilter = actionArr?.length ? actionArr : undefined;

  const queryParams: GetAuditlogsParams = useMemo(
    () => ({
      limit: tableState.perPage,
      offset: (tableState.page - 1) * tableState.perPage,
      orderBy: '-created' as const,
      principalUsername: requesterFilter,
      resourceType: resourceTypeFilter as GetAuditlogsResourceTypeEnum[] | undefined,
      action: actionFilter as GetAuditlogsActionEnum[] | undefined,
    }),
    [tableState.perPage, tableState.page, requesterFilter, resourceTypeFilter, actionFilter],
  );

  const { data: auditData, isLoading, isError, error } = useAuditLogsQuery(queryParams);

  const offset = queryParams.offset ?? 0;
  const entries = useMemo(() => (auditData?.data ?? []).map((entry, i) => mapApiEntry(entry, i, offset)), [auditData, offset]);
  const totalCount = auditData?.meta?.count ?? 0;
  const errorMessage = isError ? (error instanceof Error ? error.message : 'Failed to load audit log') : null;

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'requester',
        label: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }),
        placeholder: intl.formatMessage(messages.auditLogFilterByRequester),
      },
      {
        type: 'select',
        id: 'resource_type',
        label: intl.formatMessage(messages.auditLogResourceLabel),
        options: resourceTypeOptions,
      },
      {
        type: 'select',
        id: 'action',
        label: intl.formatMessage(messages.auditLogActionLabel),
        options: actionOptions,
      },
    ],
    [intl, resourceTypeOptions, actionOptions],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      date: { label: intl.formatMessage({ id: 'auditLogColumnDate', defaultMessage: 'Date' }) },
      requester: { label: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }) },
      action: { label: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }) },
      resource: { label: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }) },
      description: { label: intl.formatMessage({ id: 'auditLogColumnDescription', defaultMessage: 'Description' }) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, AuditLogRow> = useMemo(
    () => ({
      date: (row) => (row.date ? <DateFormat date={row.date} type={getDateFormat(row.date)} /> : '—'),
      requester: (row) => row.requester || '—',
      action: (row) => row.action || '—',
      resource: (row) => row.resource || '—',
      description: (row) => row.description || '—',
    }),
    [],
  );

  const emptyStateNoData = useMemo(() => <DefaultEmptyStateNoData title={intl.formatMessage(messages.auditLogNoResults)} />, [intl]);
  const emptyStateNoResults = useMemo(
    () => <DefaultEmptyStateNoResults title={intl.formatMessage(messages.auditLogNoResults)} onClearFilters={tableState.clearAllFilters} />,
    [intl, tableState.clearAllFilters],
  );

  return (
    <>
      <PageHeader title={intl.formatMessage(messages.auditLog)} subtitle={intl.formatMessage(messages.auditLogSubtitle)} />
      <PageSection hasBodyWrapper={false}>
        <TableView<typeof columns, AuditLogRow>
          columns={columns}
          columnConfig={columnConfig}
          data={isLoading ? undefined : errorMessage ? [] : entries}
          totalCount={totalCount}
          getRowId={(row) => row.id}
          cellRenderers={cellRenderers}
          filterConfig={filterConfig}
          filters={tableState.filters}
          onFiltersChange={tableState.onFiltersChange}
          clearAllFilters={tableState.clearAllFilters}
          page={tableState.page}
          perPage={tableState.perPage}
          perPageOptions={tableState.perPageOptions}
          onPageChange={tableState.onPageChange}
          onPerPageChange={tableState.onPerPageChange}
          error={errorMessage ? new Error(errorMessage) : null}
          emptyStateNoData={emptyStateNoData}
          emptyStateNoResults={emptyStateNoResults}
          ariaLabel={intl.formatMessage({ id: 'auditLogTableAriaLabel', defaultMessage: 'Audit log entries' })}
          ouiaId="audit-log-table"
        />
      </PageSection>
    </>
  );
};

export default AuditLog;
