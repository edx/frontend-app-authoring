import React, { useMemo } from 'react';
import { StudioFooterSlot } from '@edx/frontend-component-footer';
import {
  Add as AddIcon, EditOutline, DeleteOutline, AccessTime as ClockIcon,
} from '@openedx/paragon/icons';
import {
  Button,
  Layout,
  Container,
  Icon,
  IconButtonWithTooltip,
  OverlayTrigger,
  Tooltip,
  ModalDialog,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import moment from 'moment';
import Header from '../header';
import SubHeader from '../generic/sub-header/SubHeader';
import messages from './messages';
import { useReleaseNotes } from './hooks';
import DeleteModal from './delete-modal/DeleteModal';
import ReleaseNoteForm from './update-form/ReleaseNoteForm';
import ReleaseNotesSidebar from './sidebar/ReleaseNotesSidebar';
import { REQUEST_TYPES } from '../course-updates/constants';

const ReleaseNotes = () => {
  const intl = useIntl();
  const {
    requestType,
    notes,
    notesInitialValues,
    isFormOpen,
    isDeleteModalOpen,
    closeForm,
    closeDeleteModal,
    handleUpdatesSubmit,
    handleOpenUpdateForm,
    handleDeleteUpdateSubmit,
    handleOpenDeleteForm,
  } = useReleaseNotes();

  const groups = useMemo(() => {
    const map = new Map();
    (notes || []).forEach((n) => {
      const key = n.published_at ? moment(n.published_at).format('YYYY-MM-DD') : 'unscheduled';
      if (!map.has(key)) { map.set(key, []); }
      map.get(key).push(n);
    });
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === 'unscheduled') { return 1; }
      if (b === 'unscheduled') { return -1; }
      return moment(b).valueOf() - moment(a).valueOf();
    });
    return keys.map((k) => ({
      key: k,
      label: k === 'unscheduled' ? intl.formatMessage({ id: 'release-notes.unscheduled.label', defaultMessage: 'Unscheduled' }) : moment(k).format('MMMM D, YYYY'),
      items: map.get(k),
    }));
  }, [notes, intl]);

  return (
    <>
      <Header isHiddenMainMenu />
      <Container size="xl" className="release-notes-page px-4 pt-4">
        <SubHeader
          title={intl.formatMessage(messages.headingTitle)}
          subtitle=""
          instruction=""
          headerActions={(
            <Button
              variant="primary"
              iconBefore={AddIcon}
              size="sm"
              onClick={() => handleOpenUpdateForm(REQUEST_TYPES.add_new_update)}
            >
              {intl.formatMessage(messages.newPostButton)}
            </Button>
          )}
        />

        <Layout
          lg={[{ span: 9 }, { span: 3 }]}
          md={[{ span: 9 }, { span: 3 }]}
          xs={[{ span: 12 }, { span: 12 }]}
        >
          <Layout.Element>
            <article>
              <section className="release-notes-list p-4.5">
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <div key={g.key} className="mb-4">
                      {g.items.map((post) => (
                        <div id={`note-${post.id}`} key={post.id} className="release-note-item mb-4 pb-4">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h3 className="mb-4 pb-4">{moment(post.published_at).format('MMMM D, YYYY')}</h3>
                              {post.published_at && moment(post.published_at).isAfter(moment()) && (
                              <OverlayTrigger
                                placement="top"
                                overlay={(
                                  <Tooltip id={`scheduled-tooltip-${post.id}`}>
                                    {intl.formatMessage(messages.scheduledTooltip, {
                                      date: moment(post.published_at).format('MMMM D, YYYY h:mm A z'),
                                    })}
                                  </Tooltip>
                                )}
                              >
                                <div className="d-inline-flex align-items-center text-muted small mr-2" role="button" tabIndex={0}>
                                  <Icon
                                    className="mr-1 p-0 justify-content-start scheduled-icon"
                                    src={ClockIcon}
                                    alt={intl.formatMessage(messages.scheduledTooltip, {
                                      date: moment(post.published_at).format('MMMM D, YYYY h:mm A z'),
                                    })}
                                  />
                                  <span>{intl.formatMessage(messages.scheduledLabel)}</span>
                                </div>
                              </OverlayTrigger>
                              )}
                              <div className="d-flex align-items-center mb-1 justify-content-between">
                                <h6 className="m-0">{post.title}</h6>
                                <div className="ml-3 d-flex">
                                  <IconButtonWithTooltip
                                    tooltipContent={intl.formatMessage(messages.editButton)}
                                    src={EditOutline}
                                    iconAs={Icon}
                                    onClick={() => handleOpenUpdateForm(REQUEST_TYPES.edit_update, post)}
                                    data-testid="release-note-edit-button"
                                    disabled={isFormOpen}
                                  />
                                  <IconButtonWithTooltip
                                    tooltipContent={intl.formatMessage(messages.deleteButton)}
                                    src={DeleteOutline}
                                    iconAs={Icon}
                                    onClick={() => handleOpenDeleteForm(post)}
                                    data-testid="release-note-delete-button"
                                    disabled={isFormOpen}
                                  />
                                </div>
                              </div>
                              {/* eslint-disable-next-line react/no-danger */}
                              <div className="post-description" dangerouslySetInnerHTML={{ __html: post.description }} />
                              {post.created_by && (
                              <div className="mt-3">
                                <small>
                                  {intl.formatMessage({ id: 'release-notes.questions.contact', defaultMessage: 'Questions? Contact {email}' }, {
                                    email: post.created_by,
                                  })}
                                </small>
                              </div>
                              )}
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="text-center">
                    <span className="small mr-2">{intl.formatMessage(messages.noReleaseNotes)}</span>
                  </div>
                )}
              </section>
            </article>
          </Layout.Element>
          <Layout.Element>
            <ReleaseNotesSidebar notes={notes} />
          </Layout.Element>
        </Layout>
      </Container>
      {isFormOpen && (
      <ModalDialog
        isOpen={isFormOpen}
        onClose={closeForm}
        size="xl"
        isBlocking
      >
        <ModalDialog.Header>
          <ModalDialog.Title>
            {requestType === REQUEST_TYPES.add_new_update
              ? intl.formatMessage(messages.newPostButton)
              : intl.formatMessage(messages.editButton)}
          </ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          <ReleaseNoteForm
            initialValues={notesInitialValues}
            close={closeForm}
            onSubmit={handleUpdatesSubmit}
          />
        </ModalDialog.Body>
      </ModalDialog>
      )}
      <DeleteModal isOpen={isDeleteModalOpen} close={closeDeleteModal} onDeleteSubmit={handleDeleteUpdateSubmit} />
      <StudioFooterSlot />
    </>
  );
};

export default ReleaseNotes;
