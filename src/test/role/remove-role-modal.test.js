import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import RemoveRoleModal from '../../smart-components/role/remove-role-modal';

import * as RoleHelper from '../../helpers/role/role-helper';
import * as RoleActions from '../../redux/actions/role-actions';

jest.mock('../../helpers/role/role-helper', () => {
  const actual = jest.requireActual('../../helpers/role/role-helper');
  return {
    __esModule: true,
    ...actual,
  };
});

jest.mock('../../redux/actions/role-actions', () => {
  const actual = jest.requireActual('../../redux/actions/role-actions');
  return {
    __esModule: true,
    ...actual,
  };
});

describe('<RemoveRoleModal />', () => {
  const ROLE_ID = 'foo';
  const initialProps = {
    routeMatch: '/role/:roleId',
    cancelRoute: '/cancel',
    afterSubmit: jest.fn(),
  };
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  const mockStore = configureStore(middlewares);

  const fetchRoleSpy = jest.spyOn(RoleHelper, 'fetchRole');
  const removeRoleSpy = jest.spyOn(RoleActions, 'removeRole');

  afterEach(() => {
    fetchRoleSpy.mockReset();
    removeRoleSpy.mockReset();
  });

  const ComponentWrapper = ({ store, children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/role/${ROLE_ID}`]}>
        <Routes>
          <Route path="/role/:roleId" element={children} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  it('should mount and call remove role action witouth fethichg data from API', () => {
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: ROLE_ID,
          display_name: 'role-name',
        },
      },
    });
    removeRoleSpy.mockImplementationOnce(() => ({ type: 'REMOVE_ROLE', payload: Promise.resolve() }));

    const wrapper = mount(
      <ComponentWrapper store={store}>
        <RemoveRoleModal {...initialProps} />
      </ComponentWrapper>
    );

    wrapper.find('input#remove-role-checkbox').simulate('change');
    wrapper.find('button#confirm-delete-portfolio').prop('onClick')();

    expect(removeRoleSpy).toHaveBeenCalledTimes(1);
    expect(removeRoleSpy).toHaveBeenCalledWith(ROLE_ID);
    expect(fetchRoleSpy).not.toHaveBeenCalled();
  });

  it('should mount and fetch data from API when not avaiable in redux store', async () => {
    expect.assertions(2);
    const store = mockStore({
      roleReducer: {
        selectedRole: {
          uuid: 'nonsense',
        },
      },
    });
    fetchRoleSpy.mockImplementation(() => Promise.resolve({ uuid: ROLE_ID, name: 'name' }));

    await act(async () => {
      mount(
        <ComponentWrapper store={store}>
          <RemoveRoleModal {...initialProps} />
        </ComponentWrapper>
      );
    });

    expect(fetchRoleSpy).toHaveBeenCalledTimes(1);
    expect(fetchRoleSpy).toHaveBeenCalledWith(ROLE_ID);
  });
});
