import PropTypes from 'prop-types';
import {
  Icon, Toast,
} from '@openedx/paragon';
import {
  Settings as IconSettings,
  ErrorOutline as IconError,
  CheckCircle as IconSuccess,
} from '@openedx/paragon/icons';
import classNames from 'classnames';

const VARIANT_ICONS = {
  default: IconSettings,
  error: IconError,
  success: IconSuccess,
};

const ProcessingNotification = ({
  isShow, title, action, close, variant,
}) => {
  const iconSrc = VARIANT_ICONS[variant] || VARIANT_ICONS.default;
  return (
    <Toast
      className={classNames(
        `processing-notification processing-notification--${variant}`,
        { 'processing-notification-hide-close-button': !close },
      )}
      show={isShow}
      aria-hidden={isShow}
      action={action && { ...action }}
      onClose={close || (() => {})}
    >
      <span className="d-flex align-items-center">
        <Icon
          className={classNames('processing-notification-icon mb-0 mr-2', {
            'processing-notification-icon--spin': variant === 'default',
          })}
          src={iconSrc}
        />
        <span className="font-weight-bold h4 mb-0 text-white">{title}</span>
      </span>
    </Toast>
  );
};

ProcessingNotification.defaultProps = {
  close: null,
  variant: 'default',
};

ProcessingNotification.propTypes = {
  isShow: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  }),
  close: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'error', 'success']),
};

export default ProcessingNotification;
