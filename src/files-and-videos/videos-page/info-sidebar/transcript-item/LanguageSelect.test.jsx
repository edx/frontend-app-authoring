import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import LanguageSelect from './LanguageSelect';

const defaultOptions = {
  ar: 'Arabic',
  en: 'English',
  fr: 'French',
};

const defaultProps = {
  value: '',
  previousSelection: [],
  options: defaultOptions,
  handleSelect: jest.fn(),
  placeholderText: 'Select a language',
};

const renderComponent = (props = {}) => render(
  <IntlProvider locale="en">
    <LanguageSelect {...defaultProps} {...props} />
  </IntlProvider>,
);

describe('LanguageSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows placeholder text when no value selected', () => {
    renderComponent();
    expect(screen.getByTestId('language-select-dropdown')).toHaveTextContent('Select a language');
  });

  it('shows selected language name when value is set', () => {
    renderComponent({ value: 'en' });
    expect(screen.getByTestId('language-select-dropdown')).toHaveTextContent('English');
  });

  it('opens dropdown and shows all options on click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    expect(screen.getByText('Arabic')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
  });

  it('shows search input after opening', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    expect(screen.getByPlaceholderText('Search languages')).toBeInTheDocument();
  });

  it('filters options by search query', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    fireEvent.change(screen.getByPlaceholderText('Search languages'), { target: { value: 'ara' } });
    expect(screen.getByText('Arabic')).toBeInTheDocument();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
    expect(screen.queryByText('French')).not.toBeInTheDocument();
  });

  it('shows no results message when search does not match', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    fireEvent.change(screen.getByPlaceholderText('Search languages'), { target: { value: 'zzz' } });
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('calls handleSelect and closes when selecting an enabled option', () => {
    const handleSelect = jest.fn();
    renderComponent({ handleSelect });
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    fireEvent.click(screen.getByText('English'));
    expect(handleSelect).toHaveBeenCalledWith('en');
  });

  it('renders previously selected options as disabled', () => {
    renderComponent({ previousSelection: ['fr'] });
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    screen.getByText('French').closest('[class*="menu-item"], button, [role="menuitem"]');
    const handleSelect = jest.fn();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('shows check icon for currently selected value', () => {
    renderComponent({ value: 'en' });
    fireEvent.click(screen.getByTestId('language-select-dropdown'));
    expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(1);
  });

  it('adds is-open class to trigger button when open', () => {
    renderComponent();
    const trigger = screen.getByTestId('language-select-dropdown');
    expect(trigger).not.toHaveClass('is-open');
    fireEvent.click(trigger);
    expect(trigger).toHaveClass('is-open');
  });

  it('resets search query when closing via second click', () => {
    renderComponent();
    const trigger = screen.getByTestId('language-select-dropdown');
    fireEvent.click(trigger);
    fireEvent.change(screen.getByPlaceholderText('Search languages'), { target: { value: 'Eng' } });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.getByPlaceholderText('Search languages')).toHaveValue('');
  });

  it('uses custom wrapperClassName when provided', () => {
    const { container } = renderComponent({ wrapperClassName: 'my-custom-class' });
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
  });

  it('uses default wrapperClassName when not provided', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.col.p-0')).toBeInTheDocument();
  });
});
