import React from 'react';
import PropTypes from 'prop-types';
import { Stack } from '@openedx/paragon';
import { FormattedDate, FormattedMessage } from '@edx/frontend-platform/i18n';
import { getFileSizeToClosestByte } from '../../../utils';
import { getFormattedDuration } from '../data/utils';
import UsageMetricsMessages from '../../generic/UsageMetricsMessage';
import genericMessages from '../../generic/messages';
import messages from './messages';

const InfoTab = ({ video, usagePathStatus, usageError }) => {
  const fileSize = getFileSizeToClosestByte(video?.fileSize);
  const duration = getFormattedDuration(video?.duration);

  return (
    <Stack className="mt-3">
      <div className="font-weight-bold">
        <FormattedMessage {...messages.dateAddedTitle} />
      </div>
      <FormattedDate
        value={video?.dateAdded}
        year="numeric"
        month="short"
        day="2-digit"
        hour="numeric"
        minute="numeric"
      />
      <div className="font-weight-bold mt-3">
        <FormattedMessage {...messages.fileSizeTitle} />
      </div>
      {fileSize}
      <div className="font-weight-bold mt-3">
        <FormattedMessage {...messages.videoLengthTitle} />
      </div>
      {duration}
      {usagePathStatus && (
        <>
          <Stack className="font-weight-bold mt-3">
            <FormattedMessage {...genericMessages.usageTitle} />
          </Stack>
          <UsageMetricsMessages
            usageLocations={video?.usageLocations}
            usagePathStatus={usagePathStatus}
            error={usageError || []}
          />
        </>
      )}
    </Stack>
  );
};

InfoTab.propTypes = {
  video: PropTypes.shape({
    duration: PropTypes.number.isRequired,
    dateAdded: PropTypes.string.isRequired,
    fileSize: PropTypes.number.isRequired,
    usageLocations: PropTypes.arrayOf(PropTypes.shape({})),
  }),
  usagePathStatus: PropTypes.string,
  usageError: PropTypes.arrayOf(PropTypes.string),
};

InfoTab.defaultProps = {
  video: {},
  usagePathStatus: undefined,
  usageError: undefined,
};

export default InfoTab;
