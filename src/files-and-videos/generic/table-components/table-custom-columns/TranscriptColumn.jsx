import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Hyperlink, Icon } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';
import { TRANSCRIPT_FAILURE_STATUSES } from '../../../videos-page/data/constants';

const TranscriptColumn = ({ row, onClick }) => {
  const { transcripts, transcriptionStatus } = row.original;
  const numOfTranscripts = transcripts?.length;

  return (
    <div className="row m-0 align-items-center">
      {TRANSCRIPT_FAILURE_STATUSES.includes(transcriptionStatus) && (
        <Icon src={Info} size="sm" className="mr-2 text-danger-500" />
      )}
      {numOfTranscripts > 0 && (() => {
        const label = (
          <FormattedMessage
            id="course-authoring.videos-page.table.transcriptColumn.available"
            description="Number of transcripts available, links to info modal"
            defaultMessage="({count}) available"
            values={{ count: numOfTranscripts }}
          />
        );
        return onClick ? (
          <Hyperlink destination="#" onClick={(e) => { e.preventDefault(); onClick(row.original); }}>
            {label}
          </Hyperlink>
        ) : label;
      })()}
    </div>
  );
};

TranscriptColumn.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      transcripts: PropTypes.arrayOf(PropTypes.string),
      transcriptionStatus: PropTypes.string,
    }).isRequired,
  }).isRequired,
  onClick: PropTypes.func,
};

TranscriptColumn.defaultProps = {
  onClick: undefined,
};

export default TranscriptColumn;
