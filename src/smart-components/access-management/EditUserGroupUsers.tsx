import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination } from '@patternfly/react-core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataView, DataViewState, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../redux/store';
import { fetchUsers } from '../../redux/actions/user-actions';
import { mappedProps } from '../../helpers/shared/helpers';
import { BulkSelect, BulkSelectValue, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';
import { FormattedMessage, useIntl } from 'react-intl';
import Messages from '../../Messages';
import { SearchIcon } from '@patternfly/react-icons';

const EmptyTable: React.FunctionComponent<{ titleText: string }> = ({ titleText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <FormattedMessage
          {...Messages['usersEmptyStateSubtitle']}
          values={{
            br: <br />,
          }}
        />
      </EmptyStateBody>
    </EmptyState>
  );
};

interface EditGroupUsersTableProps {
  onChange: (userDiff: TableState) => void;
  groupId: string;
  initialUserIds: string[];
}

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const EditGroupUsersTable: React.FunctionComponent<EditGroupUsersTableProps> = ({ onChange, groupId, initialUserIds }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const intl = useIntl();

  const columns = useMemo(
    () => [
      intl.formatMessage(Messages.orgAdmin),
      intl.formatMessage(Messages.username),
      intl.formatMessage(Messages.email),
      intl.formatMessage(Messages.firstName),
      intl.formatMessage(Messages.lastName),
      intl.formatMessage(Messages.status),
    ],
    [intl]
  );

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { selected, onSelect, isSelected } = selection;

  useEffect(() => {
    onSelect(false);
    const initialSelectedUsers = initialUserIds.map((id) => ({ id }));
    onSelect(true, initialSelectedUsers);
  }, [initialUserIds]);

  const { users, groupUsers, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    users: state.userReducer?.users?.data || [],
    groupUsers: state.groupReducer?.selectedGroup?.members?.data || [],
    totalCount: state.userReducer?.users?.meta?.count,
    isLoading: state.userReducer?.isUserDataLoading,
  }));

  const rows = useMemo(
    () =>
      users.map((user) => ({
        id: user.username,
        row: [
          user.is_org_admin ? intl.formatMessage(Messages.yes) : intl.formatMessage(Messages.no),
          user.username,
          user.email,
          user.first_name,
          user.last_name,
          user.is_active ? intl.formatMessage(Messages.active) : intl.formatMessage(Messages.inactive),
        ],
      })),
    [users, groupId]
  );

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchUsers({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(users.length === 0 ? DataViewState.empty : undefined);
    }
  }, [users.length, isLoading]);

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  useEffect(() => {
    onChange({ initial: initialUserIds, updated: selection.selected.map((user) => user.id) });
  }, [selection.selected, initialUserIds]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  return (
    <DataView selection={{ ...selection }} activeState={activeState}>
      <DataViewToolbar
        pagination={
          <Pagination
            perPageOptions={PER_PAGE_OPTIONS}
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
          />
        }
        bulkSelect={
          <BulkSelect
            isDataPaginated
            pageCount={users.length}
            selectedCount={selected.length}
            totalCount={totalCount}
            pageSelected={pageSelected}
            pagePartiallySelected={pagePartiallySelected}
            onSelect={handleBulkSelect}
          />
        }
      />
      <DataViewTable
        variant="compact"
        columns={columns}
        rows={rows}
        headStates={{
          loading: <SkeletonTableHead columns={columns} />,
        }}
        bodyStates={{
          loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
          empty: <EmptyTable titleText={intl.formatMessage(Messages.usersEmptyStateTitle)} />,
        }}
      />
    </DataView>
  );
};

export default EditGroupUsersTable;