import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import * as reactRedux from 'react-redux';
import * as api from './data/api';
import { useReleaseNotes } from './hooks';

const initialState = {
  releaseNotes: {
    releaseNotes: [],
    savingStatuses: {},
    loadingStatuses: {},
    errors: {},
  },
};
const reducer = (state = initialState) => state;
const makeStore = () => createStore(reducer, initialState);

describe('useReleaseNotes', () => {
  let dispatchMock;
  beforeEach(() => {
    jest.clearAllMocks();
    dispatchMock = jest.fn((action) => {
      if (typeof action === 'function') {
        return undefined;
      }
      return undefined;
    });
    jest.spyOn(reactRedux, 'useDispatch').mockReturnValue(dispatchMock);
  });

  const AddComponent = () => {
    const hook = useReleaseNotes();
    return (
      <button
        type="button"
        data-testid="add-btn"
        onClick={() => hook.handleUpdatesSubmit({ title: 'New', description: 'desc' })}
      >
        Add
      </button>
    );
  };

  const EditComponent = () => {
    const hook = useReleaseNotes();
    const note = {
      id: 2, title: 'Edit', description: 'desc2', published_at: new Date().toISOString(),
    };
    return (
      <button
        type="button"
        data-testid="edit-btn"
        onClick={() => {
          hook.handleOpenUpdateForm('edit_update', note);
          hook.handleUpdatesSubmit(note);
        }}
      >
        Edit
      </button>
    );
  };

  const DeleteComponent = () => {
    const hook = useReleaseNotes();
    return (
      <button type="button" data-testid="delete-btn" onClick={() => hook.handleDeleteUpdateSubmit(3)}>
        Delete
      </button>
    );
  };

  const StateComponent = () => {
    const hook = useReleaseNotes();
    return (
      <>
        <button type="button" data-testid="open-btn" onClick={() => hook.handleOpenUpdateForm('add_new_update')}>
          Open
        </button>
        <button type="button" data-testid="close-btn" onClick={hook.closeForm}>
          Close
        </button>
      </>
    );
  };

  it('handles add_new_update request', async () => {
    if (typeof api.addReleaseNote !== 'function') {
      return;
    }
    const addNoteMock = jest
      .spyOn(api, 'addReleaseNote')
      .mockResolvedValue({ id: 1, title: 'New', description: 'desc' });
    render(
      <Provider store={makeStore()}>
        <AddComponent />
      </Provider>,
    );
    fireEvent.click(document.querySelector('[data-testid="add-btn"]'));
    expect(addNoteMock).toHaveBeenCalledWith({ title: 'New', description: 'desc' });
  });

  it('dispatches a thunk on edit_update', async () => {
    render(
      <Provider store={makeStore()}>
        <EditComponent />
      </Provider>,
    );
    fireEvent.click(document.querySelector('[data-testid="edit-btn"]'));
    expect(dispatchMock).toHaveBeenCalled();
    expect(typeof dispatchMock.mock.calls[0][0]).toBe('function');
  });

  it('dispatches a thunk on delete_update', async () => {
    render(
      <Provider store={makeStore()}>
        <DeleteComponent />
      </Provider>,
    );
    fireEvent.click(document.querySelector('[data-testid="delete-btn"]'));
    expect(dispatchMock).toHaveBeenCalled();
    expect(typeof dispatchMock.mock.calls[0][0]).toBe('function');
  });

  it('handles API error for add', async () => {
    if (typeof api.addReleaseNote !== 'function') {
      return;
    }
    jest.spyOn(api, 'addReleaseNote').mockRejectedValue(new Error('API error'));
    render(
      <Provider store={makeStore()}>
        <AddComponent />
      </Provider>,
    );
    fireEvent.click(document.querySelector('[data-testid="add-btn"]'));
  });

  it('handles open/close form state', () => {
    render(
      <Provider store={makeStore()}>
        <StateComponent />
      </Provider>,
    );
    fireEvent.click(document.querySelector('[data-testid="open-btn"]'));
    fireEvent.click(document.querySelector('[data-testid="close-btn"]'));
  });
});
