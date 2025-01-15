import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroup, fetchGroups, updateGroup } from '../../redux/actions/group-actions';
import { RBACStore } from '../../redux/store';
import { useNavigate, useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';

export const EditUserGroup: React.FunctionComponent = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const params = useParams();
  const groupId = params.groupId;
  const navigate = useNavigate();

  const group = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup);
  const allGroups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchGroups({ limit: 1000, offset: 0, orderBy: 'name', usesMetaInURL: true })),
          groupId ? dispatch(fetchGroup(groupId)) : Promise.resolve(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch, groupId]);

  const schema = {
    fields: [
      {
        name: 'name',
        label: intl.formatMessage(Messages.name),
        component: componentTypes.TEXT_FIELD,
        validate: [
          { type: validatorTypes.REQUIRED },
          (value: string) => {
            if (value === group?.name) {
              return undefined;
            }

            const isDuplicate = allGroups.some(
              (existingGroup) => existingGroup.name.toLowerCase() === value?.toLowerCase() && existingGroup.uuid !== groupId
            );

            return isDuplicate ? intl.formatMessage(Messages.groupNameTakenTitle) : undefined;
          },
        ],
        initialValue: group?.name,
      },
      {
        name: 'description',
        label: intl.formatMessage(Messages.description),
        component: componentTypes.TEXTAREA,
        initialValue: group?.description,
      },
      {
        name: 'users-and-service-accounts',
        component: 'users-and-service-accounts',
        initializeOnMount: true,
        groupId: groupId,
      },
    ],
  };

  const returnToPreviousPage = () => {
    navigate(-1);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (values.name !== group?.name || values.description !== group?.description) {
      dispatch(updateGroup({ uuid: groupId, name: values.name, description: values.description }));
      console.log(`Dispatched update group with name: ${values.name} and description: ${values.description}`);
    }
    console.log('submitted values:', values);
    if (values['users-and-service-accounts']) {
      const { users, serviceAccounts } = values['users-and-service-accounts'];
      if (users.updated.length > 0) {
        const addedUsers = users.updated.filter((user: string) => !users.initial.includes(user));
        const removedUsers = users.initial.filter((user: string) => !users.updated.includes(user));
        console.log(`Users added: ${addedUsers} and removed: ${removedUsers}`);
      }
      if (serviceAccounts.updated.length > 0) {
        const addedServiceAccounts = serviceAccounts.updated.filter((serviceAccount: string) => !serviceAccounts.initial.includes(serviceAccount));
        const removedServiceAccounts = serviceAccounts.initial.filter((serviceAccount: string) => !serviceAccounts.updated.includes(serviceAccount));
        console.log(`Service accounts added: ${addedServiceAccounts} and removed: ${removedServiceAccounts}`);
      }
      returnToPreviousPage();
    }
  };

  // const initialValues = useMemo(() => {
  //   const values = {
  //     name: group?.name,
  //     description: group?.description,
  //     'users-and-service-accounts': {
  //       serviceAccounts: {
  //         initial: group?.serviceAccounts?.data?.map((serviceAccount) => serviceAccount.uuid) || [],
  //         updated: [],
  //       },
  //       users: {
  //         initial: group?.members?.data?.map((user) => user.username) || [],
  //         updated: [],
  //       },
  //     },
  //   };
  //   console.log('initial values:', values);
  //   return values;
  // }, [group]);

  return (
    <React.Fragment>
      <ContentHeader title={intl.formatMessage(Messages.usersAndUserGroupsEditUserGroup)} subtitle={''} />
      <PageSection data-ouia-component-id="edit-user-group-form" className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <FormRenderer
            schema={schema}
            componentMapper={{
              ...componentMapper,
              'users-and-service-accounts': EditGroupUsersAndServiceAccounts,
            }}
            onSubmit={handleSubmit}
            onCancel={returnToPreviousPage}
            FormTemplate={FormTemplate}
            FormTemplateProps={{
              disableSubmit: ['pristine', 'invalid'],
            }}
            debug={(values) => {console.log('values:', values)}}
          />
        )}
      </PageSection>
    </React.Fragment>
  );
};

export default EditUserGroup;
