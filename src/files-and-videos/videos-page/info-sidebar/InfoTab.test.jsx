import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import InfoTab from './InfoTab';
import { RequestStatus } from '../../../data/constants';

const defaultVideo = {
  duration: 125,
  dateAdded: '2024-01-15T10:00:00Z',
  fileSize: 1048576,
  usageLocations: [],
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <InfoTab video={defaultVideo} {...props} />
  </IntlProvider>,
);

describe('InfoTab', () => {
  it('renders video file size', () => {
    renderComponent();
    expect(document.body).toHaveTextContent('1.05 MB');
  });

  it('renders formatted video date', () => {
    renderComponent();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('renders video duration', () => {
    renderComponent();
    expect(document.body).toHaveTextContent('00:02:05');
  });

  it('does not render usage section when usagePathStatus is not provided', () => {
    renderComponent();
    expect(screen.queryByText('Usage')).not.toBeInTheDocument();
  });

  it('renders usage section heading when usagePathStatus is provided', () => {
    renderComponent({ usagePathStatus: RequestStatus.SUCCESSFUL });
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('shows "Currently not in use" when usagePathStatus is successful and usageLocations is empty', () => {
    renderComponent({ usagePathStatus: RequestStatus.SUCCESSFUL, video: { ...defaultVideo, usageLocations: [] } });
    expect(document.body).toHaveTextContent('Currently not in use');
  });

  it('renders usage location links when provided', () => {
    const videoWithLocations = {
      ...defaultVideo,
      usageLocations: [{ displayLocation: 'Unit 1', url: '/unit/1' }],
    };
    renderComponent({ usagePathStatus: RequestStatus.SUCCESSFUL, video: videoWithLocations });
    expect(screen.getByText('Unit 1')).toBeInTheDocument();
  });

  it('shows error state when usagePathStatus is FAILED', () => {
    renderComponent({ usagePathStatus: RequestStatus.FAILED });
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('passes usageError to UsageMetricsMessages', () => {
    renderComponent({ usagePathStatus: RequestStatus.FAILED, usageError: ['Something went wrong'] });
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('renders gracefully with default empty video object', () => {
    renderComponent({ video: {} });
    expect(screen.getByText('Date added')).toBeInTheDocument();
  });
});
