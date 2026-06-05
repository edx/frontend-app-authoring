import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Alert, Button, Card, Container, Spinner,
} from '@openedx/paragon';
import { Info, CheckCircle, Email } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';
import { unsubscribeFromReleaseNoteEmails } from '../data/api';
import messages from './messages';

const ReleaseNoteUnsubscribe = () => {
  const intl = useIntl();
  const location = useLocation();
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleUnsubscribe = () => {
    if (!token) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    unsubscribeFromReleaseNoteEmails(token)
      .then(() => {
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  };

  if (!token) {
    return (
      <Container size="sm" className="py-5">
        <Alert variant="danger" icon={Info}>
          {intl.formatMessage(messages.unsubscribeError)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="sm" className="d-flex align-items-center justify-content-center py-5">
      {status === 'idle' && (
        <Card className="text-center shadow-sm" style={{ maxWidth: '480px' }}>
          <Card.Section className="p-4">
            <Alert variant="warning" icon={Email} className="mb-3">
              {intl.formatMessage(messages.unsubscribeTitle)}
            </Alert>
            <p className="text-gray-700 mb-4">
              {intl.formatMessage(messages.unsubscribeConfirmation)}
            </p>
            <Button variant="primary" onClick={handleUnsubscribe} block>
              {intl.formatMessage(messages.unsubscribeButton)}
            </Button>
            <p className="x-small text-gray-500 mt-3 mb-0">
              {intl.formatMessage(messages.unsubscribeDisclaimer)}
            </p>
          </Card.Section>
        </Card>
      )}
      {status === 'loading' && (
        <Card className="text-center shadow-sm" style={{ maxWidth: '480px' }}>
          <Card.Section className="p-4">
            <Spinner animation="border" className="mb-3" screenReaderText={intl.formatMessage(messages.unsubscribeProcessing)} />
            <p className="text-gray-700 mb-0">{intl.formatMessage(messages.unsubscribeProcessing)}</p>
          </Card.Section>
        </Card>
      )}
      {status === 'success' && (
        <Alert variant="success" icon={CheckCircle}>
          <Alert.Heading>{intl.formatMessage(messages.unsubscribeSuccessTitle)}</Alert.Heading>
          <p className="mb-0">{intl.formatMessage(messages.unsubscribeSuccess)}</p>
        </Alert>
      )}
      {status === 'error' && (
        <Alert
          variant="danger"
          icon={Info}
          actions={[
            <Button key="unsubscribe-retry" type="button" variant="outline-primary" onClick={handleUnsubscribe}>
              {intl.formatMessage(messages.unsubscribeRetry)}
            </Button>,
          ]}
        >
          <Alert.Heading>{intl.formatMessage(messages.unsubscribeErrorTitle)}</Alert.Heading>
          <p className="mb-0">{intl.formatMessage(messages.unsubscribeError)}</p>
        </Alert>
      )}
    </Container>
  );
};

export default ReleaseNoteUnsubscribe;
