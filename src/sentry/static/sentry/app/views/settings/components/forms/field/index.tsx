import PropTypes from 'prop-types';
import React from 'react';

import ControlState from 'app/views/settings/components/forms/field/controlState';
import FieldControl from 'app/views/settings/components/forms/field/fieldControl';
import FieldDescription from 'app/views/settings/components/forms/field/fieldDescription';
import FieldErrorReason from 'app/views/settings/components/forms/field/fieldErrorReason';
import FieldHelp from 'app/views/settings/components/forms/field/fieldHelp';
import FieldLabel from 'app/views/settings/components/forms/field/fieldLabel';
import FieldRequiredBadge from 'app/views/settings/components/forms/field/fieldRequiredBadge';
import FieldWrapper from 'app/views/settings/components/forms/field/fieldWrapper';

const defaultProps = {
  alignRight: false,
  inline: true,
  disabled: false,
  required: false,
  visible: true,
};

// Type guard for render func.
function isRenderFunc(func: React.ReactNode | Function): func is ChildRenderFunction {
  return typeof func === 'function';
}

type DefaultProps = typeof defaultProps;

type FieldProps = {
  className?: string;

  /**
   * Aligns Control to the right
   */
  alignRight?: boolean;

  /**
   * Is "highlighted", i.e. after a search
   */
  highlighted?: boolean;

  /**
   * Show "required" indicator
   */
  required?: boolean;

  /**
   * Should field be visible
   */
  visible?: boolean | ((props: Props) => boolean);

  /**
   * Should field be disabled?
   */
  disabled?: boolean | ((props: Props) => boolean);

  /**
   * Reason why field is disabled (displays in tooltip)
   */
  disabledReason?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Hide ControlState component
   */
  flexibleControlStateSize?: boolean;

  /**
   * User-facing field name
   */
  label?: React.ReactNode;

  /**
   * Help or description of the field
   */
  help?: React.ReactNode | Function;

  /**
   * Should Control be inline with Label
   */
  inline?: boolean;

  /**
   * Should the field display in a stacked manner (no borders + reduced padding
   */
  stacked?: boolean;

  /**
   * The control's `id` property
   */
  id?: string;

  /**
   * Field is in saving state
   */
  isSaving?: boolean;

  /**
   * Field has finished saving state
   */
  isSaved?: boolean;

  /**
   * Class name for inner control
   */
  controlClassName?: string;

  /** Inline style */
  style?: React.CSSProperties;
};

type ChildRenderFunction = (props: FieldControl['props'] & FieldProps) => React.ReactNode;

type Props = FieldProps &
  Partial<DefaultProps> & {
    /**
     * The Control component
     */
    children: React.ReactNode | ChildRenderFunction;
  };

/**
 * A component to render a Field (i.e. label + help + form "control"),
 * generally inside of a Panel.
 *
 * This is unconnected to any Form state
 */
class Field extends React.Component<Props> {
  static propTypes: any = {
    alignRight: PropTypes.bool,
    highlighted: PropTypes.bool,
    required: PropTypes.bool,
    visible: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    disabledReason: PropTypes.string,
    error: PropTypes.string,
    flexibleControlStateSize: PropTypes.bool,
    label: PropTypes.node,
    help: PropTypes.oneOfType([PropTypes.node, PropTypes.element, PropTypes.func]),
    inline: PropTypes.bool,
    stacked: PropTypes.bool,
    id: PropTypes.string,
    isSaving: PropTypes.bool,
    isSaved: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    controlClassName: PropTypes.string,
    style: PropTypes.object,
  };

  static defaultProps: DefaultProps = defaultProps;

  render() {
    const {className, ...otherProps} = this.props;
    const {
      controlClassName,
      alignRight,
      inline,
      highlighted,
      required,
      visible,
      disabled,
      disabledReason,
      error,
      flexibleControlStateSize,
      help,
      id,
      isSaving,
      isSaved,
      label,
      stacked,
      children,
      style,
    } = otherProps;
    const isDisabled = typeof disabled === 'function' ? disabled(this.props) : disabled;
    const isVisible = typeof visible === 'function' ? visible(this.props) : visible;
    let Control;

    if (!isVisible) {
      return null;
    }

    const helpElement = typeof help === 'function' ? help(this.props) : help;

    const controlProps = {
      className: controlClassName,
      inline,
      alignRight,
      disabled: isDisabled,
      disabledReason,
      flexibleControlStateSize,
      help: helpElement,
      errorState: error ? <FieldErrorReason>{error}</FieldErrorReason> : null,
      controlState: (
        <ControlState error={!!error} isSaving={isSaving} isSaved={isSaved} />
      ),
    };

    // See comments in prop types
    if (isRenderFunc(children)) {
      Control = children({
        ...otherProps,
        ...controlProps,
      });
    } else {
      Control = <FieldControl {...controlProps}>{children}</FieldControl>;
    }

    return (
      <FieldWrapper
        className={className}
        inline={inline}
        stacked={stacked}
        highlighted={highlighted}
        hasControlState={!flexibleControlStateSize}
        style={style}
      >
        {(label || helpElement) && (
          <FieldDescription inline={inline} htmlFor={id}>
            {label && (
              <FieldLabel disabled={isDisabled}>
                {label} {required && <FieldRequiredBadge />}
              </FieldLabel>
            )}
            {helpElement && (
              <FieldHelp stacked={!!stacked} inline={!!inline}>
                {helpElement}
              </FieldHelp>
            )}
          </FieldDescription>
        )}

        {Control}
      </FieldWrapper>
    );
  }
}
export default Field;
