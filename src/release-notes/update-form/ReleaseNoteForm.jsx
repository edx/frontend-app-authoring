import React from 'react';
import PropTypes from 'prop-types';
import {
  ActionRow,
  Button,
  Form,
  ModalDialog,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Formik } from 'formik';
import * as Yup from 'yup';
import classNames from 'classnames';
import moment from 'moment';
import { useSelector } from 'react-redux';
import TinyMceWidget, { prepareEditorRef } from '../../editors/sharedComponents/TinyMceWidget';
import messages from '../messages';
import unsavedMessages from './unsaved-modal-messages';
import { TIME_FORMAT } from '../../constants';
import { convertToDateFromString } from '../../utils';

const ReleaseNoteForm = ({
  initialValues,
  close,
  onSubmit,
}) => {
  const [showUnsavedModal, setShowUnsavedModal] = React.useState(false);
  const intl = useIntl();
  const { editorRef, refReady, setEditorRef } = prepareEditorRef();
  const { courseId } = useSelector((state) => state.courseDetail);
  const tzName = React.useMemo(() => {
    try {
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      const parts = new Intl.DateTimeFormat(undefined, { timeZone, timeZoneName: 'short' }).formatToParts(new Date());
      const longName = (parts.find(p => p.type === 'timeZoneName') || {}).value;
      if (longName && !/^GMT[+-]/i.test(longName)) {
        return longName;
      }
      if (timeZone) {
        const human = timeZone.split('/').pop().replace(/_/g, ' ');
        return `${human} Time`;
      }
      return '';
    } catch (e) {
      return '';
    }
  }, []);
  const publishTimeText = React.useMemo(() => {
    const base = intl.formatMessage(messages.publishTimeLabel).replace(/\s*\(.*\)\s*$/, '');
    return tzName ? `${base} (${tzName})` : base;
  }, [intl, tzName]);

  const validationSchema = Yup.object().shape({
    id: Yup.number(),
    title: Yup.string().required(intl.formatMessage(messages.errorTitleRequired)),
    description: Yup.string().required(intl.formatMessage(messages.errorDescriptionRequired)),
    publishDate: Yup.date().required(intl.formatMessage(messages.errorPublishDateRequired)),
    publishTime: Yup.string()
      .required(intl.formatMessage(messages.errorPublishTimeRequired))
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/, intl.formatMessage(messages.errorPublishTimeRequired)),
  });

  const handleCancel = (e) => {
    e.preventDefault();
    setShowUnsavedModal(true);
  };

  const handleLeaveEditor = () => {
    setShowUnsavedModal(false);
    close();
  };

  return (
    <div className={classNames('release-note-form')}>
      <Formik
        initialValues={{
          id: initialValues.id,
          title: initialValues.title || '',
          description: initialValues.description || '',
          publishDate: initialValues.published_at ? moment(convertToDateFromString(initialValues.published_at)).format('YYYY-MM-DD') : '',
          publishTime: initialValues.published_at ? moment(initialValues.published_at).format(TIME_FORMAT) : '',
        }}
        validationSchema={validationSchema}
        validateOnMount
        validateOnBlur
        onSubmit={(values) => {
          const [hh, mm] = (values.publishTime || '').split(':');
          const composed = values.publishDate
            ? moment(values.publishDate).set({
              hour: Number(hh) || 0, minute: Number(mm) || 0, second: 0, millisecond: 0,
            }).toDate()
            : '';
          onSubmit({
            id: initialValues.id,
            title: values.title,
            description: values.description,
            published_at: composed,
          });
        }}
      >
        {({
          values, handleSubmit, setFieldValue, errors, touched,
        }) => (
          <>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-4 datepicker-field datepicker-custom">
                  <Form.Control.Feedback className="datepicker-float-labels mb-2">
                    {intl.formatMessage(messages.publishDateLabel)}
                  </Form.Control.Feedback>
                  <div className="position-relative">
                    <Form.Control
                      type="date"
                      name="publishDate"
                      value={values.publishDate || ''}
                      className="datepicker-custom-control notes-label p-0"
                      aria-label={intl.formatMessage(messages.publishDateLabel)}
                      onChange={(e) => setFieldValue('publishDate', e.target.value)}
                      isInvalid={touched.publishDate && !!errors.publishDate}
                    />
                    {touched.publishDate && errors.publishDate && (
                      <p className="invalid-feedback d-block">
                        {errors.publishDate}
                      </p>
                    )}
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-4 datepicker-field datepicker-custom">
                  <Form.Control.Feedback className="datepicker-float-labels mb-2">
                    {publishTimeText}
                  </Form.Control.Feedback>
                  <div className="position-relative">
                    <Form.Control
                      type="time"
                      name="publishTime"
                      value={values.publishTime || ''}
                      className="datepicker-custom-control notes-label p-0"
                      aria-label={intl.formatMessage(messages.publishTimeLabel)}
                      step="60"
                      onChange={(e) => setFieldValue('publishTime', e.target.value)}
                      isInvalid={touched.publishTime && !!errors.publishTime}
                    />
                    {touched.publishTime && errors.publishTime && (
                      <p className="invalid-feedback d-block">
                        {errors.publishTime}
                      </p>
                    )}
                  </div>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Control.Feedback className="mb-2">
                {intl.formatMessage(messages.titleLabel)}
              </Form.Control.Feedback>
              <Form.Control
                name="title"
                className="notes-label"
                value={values.title}
                aria-label={intl.formatMessage(messages.titleLabel)}
                onChange={(e) => setFieldValue('title', e.target.value)}
                isInvalid={touched.title && !!errors.title}
              />
              {touched.title && errors.title && (
                <p className="invalid-feedback d-block">
                  {errors.title}
                </p>
              )}
            </Form.Group>

            <Form.Group className="m-0 mb-3">
              {refReady && (
                <TinyMceWidget
                  editorRef={editorRef}
                  editorType="text"
                  textValue={values.description}
                  initialValue={initialValues.description || ''}
                  minHeight={200}
                  editorContentHtml={initialValues.description || ''}
                  setEditorRef={setEditorRef}
                  onChange={(value) => setFieldValue('description', value)}
                  initializeEditor={() => ({})}
                  learningContextId={courseId}
                  images={{}}
                  enableImageUpload={false}
                  showImageButton
                />
              )}
              {touched.description && errors.description && (
                <p className="invalid-feedback d-block">
                  {errors.description}
                </p>
              )}
            </Form.Group>

            <ActionRow>
              <Button variant="tertiary" type="button" onClick={handleCancel}>
                {intl.formatMessage(messages.cancelButton)}
              </Button>
              <Button variant="primary" onClick={handleSubmit} type="submit">
                {intl.formatMessage(messages.saveButton)}
              </Button>
            </ActionRow>

            {showUnsavedModal && (
            <ModalDialog isOpen size="md" onClose={() => setShowUnsavedModal(false)}>
              <ModalDialog.Header>
                <ModalDialog.Title>
                  {intl.formatMessage(unsavedMessages.unsavedModalTitle)}
                </ModalDialog.Title>
              </ModalDialog.Header>
              <ModalDialog.Body>
                <p>{intl.formatMessage(unsavedMessages.unsavedModalDescription)}</p>
              </ModalDialog.Body>
              <ModalDialog.Footer>
                <Button variant="tertiary" onClick={() => setShowUnsavedModal(false)}>
                  {intl.formatMessage(unsavedMessages.keepEditingButton)}
                </Button>
                <Button variant="danger" onClick={handleLeaveEditor}>
                  {intl.formatMessage(unsavedMessages.leaveEditorButton)}
                </Button>
              </ModalDialog.Footer>
            </ModalDialog>
            )}
          </>
        )}
      </Formik>
    </div>
  );
};

ReleaseNoteForm.propTypes = {
  initialValues: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    published_at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }).isRequired,
  close: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ReleaseNoteForm;
