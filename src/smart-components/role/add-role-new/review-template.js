import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, Spinner, Text, TextContent, Title } from '@patternfly/react-core';
import { AddRoleWizardContext } from './add-role-wizard';
import { asyncValidator } from './validators';
import './review.scss';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import WizardError from '../../common/wizard-error';

const ReviewTemplate = ({ formFields }) => {
  const { submitting, error, setWizardError } = useContext(AddRoleWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    asyncValidator(getState().values['role-name'])
      .then(() => setWizardError(false))
      .catch(() => setWizardError(true));
  }, []);

  if (typeof error === 'undefined' || submitting) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (error === true) {
    return (
      <WizardError
        context={AddRoleWizardContext}
        title="Role name already taken"
        text="Please return to Step 1: Create role and choose a unique role name for your custom role."
      />
    );
  }

  return (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="ins-c-rbac__gutter-sm">
        Review details
      </Title>
      <TextContent className="ins-c-rbac__gutter-md">
        <Text>Review and confirm the details for your role, or click Back to revise.</Text>
      </TextContent>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
