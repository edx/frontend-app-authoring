import React from 'react';
import { StudioFooterSlot } from '@edx/frontend-component-footer';
import { Add as AddIcon } from '@openedx/paragon/icons';
import {
  Button,
  Layout,
  Container,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import Header from '../header';
import SubHeader from '../generic/sub-header/SubHeader';
import messages from './messages';

const ReleaseNotes = () => {
  const intl = useIntl();

  return (
    <>
      <Header isHiddenMainMenu />
      <Container size="xl" className="px-4 pt-4">
        <Layout>
          <Layout.Element>
            <article>
              <SubHeader
                title={intl.formatMessage(messages.headingTitle)}
                subtitle=""
                instruction=""
                headerActions={(
                  <Button
                    variant="primary"
                    iconBefore={AddIcon}
                    size="sm"
                    // onClick={() => {}}
                  >
                    {intl.formatMessage(messages.newPostButton)}
                  </Button>
                )}
              />
            </article>
          </Layout.Element>
        </Layout>
      </Container>
      <StudioFooterSlot />
    </>
  );
};

export default ReleaseNotes;
