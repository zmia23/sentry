import PropTypes from 'prop-types';
import React from 'react';

import {callIfFunction} from 'app/utils/callIfFunction';
import DropdownMenu, {
  RenderProps as DropdownMenuRenderProps,
  GetMenuArgs,
  MenuProps,
  ActorProps,
} from 'app/components/dropdownMenu';

type GetInputProps = typeof HTMLInputElement & {};

type InputProps = {
  value: string;
  onChange?: Function;
  onKeyDown?: Function;
  onFocus?: Function;
  onBlur?: Function;
};

type RenderProps<Item> = DropdownMenuRenderProps & {
  getInputProps: Function;
  getItemProps: Function;
  inputValue: string;
  selectedItem: Item | null;
  highlightedIndex: number;
  actions: {
    open: Function;
    close: Function;
  };
};

type Props<Item> = {
  /**
   * Must be a function that returns a component
   */
  children: (props: RenderProps<Item>) => React.ReactNode;

  /**
   * Get a stringified version of the item
   */
  itemToString: (item: Item) => string;

  /**
   * Disabled
   */
  disabled: boolean;

  /**
   * Resets autocomplete input when menu closes
   */
  resetInputOnClose: boolean;

  /**
   * If input should be considered an "actor". If there is another parent actor, then this should be `false`.
   * e.g. You have a button that opens this <AutoComplete> in a dropdown.
   *
   */
  inputIsActor: boolean;

  /**
   * Closes menu when selecting an item
   */
  closeOnSelect: boolean;

  /**
   * Can select autocomplete item with "Enter" key
   */
  shouldSelectWithEnter: boolean;

  /**
   * Can select autocomplete item with "Tab" key
   */
  shouldSelectWithTab: boolean;

  /**
   * Currently, this does not act as a "controlled" prop, only for initial state of dropdown
   */
  isOpen?: boolean;
  defaultHighlightedIndex?: number;
  defaultInputValue?: string;

  onSelect?: Function;
  onOpen?: Function;
  onClose?: Function;
  onMenuOpen?: Function;
};

type State<Item> = {
  isOpen: boolean;
  highlightedIndex: number;
  inputValue: string;
  selectedItem: null | Item;
};

/**
 * Inspired by [Downshift](https://github.com/paypal/downshift)
 *
 * Implemented with a stripped-down, compatible API for our use case.
 * May be worthwhile to switch if we find we need more features
 *
 * Basic idea is that we call `children` with props necessary to render with any sort of component structure.
 * This component handles logic like when the dropdown menu should be displayed, as well as handling keyboard input, how
 * it is rendered should be left to the child.
 */
class AutoComplete<Item> extends React.Component<Props<Item>, State<Item>> {
  static propTypes = {
    /**
     * Must be a function that returns a component
     */
    children: PropTypes.func.isRequired,
    itemToString: PropTypes.func.isRequired,
    defaultHighlightedIndex: PropTypes.number,
    defaultInputValue: PropTypes.string,
    disabled: PropTypes.bool,
    /**
     * Resets autocomplete input when menu closes
     */
    resetInputOnClose: PropTypes.bool,
    /**
     * Currently, this does not act as a "controlled" prop, only for initial state of dropdown
     */
    isOpen: PropTypes.bool,
    /**
     * If input should be considered an "actor". If there is another parent actor, then this should be `false`.
     * e.g. You have a button that opens this <AutoComplete> in a dropdown.
     */
    inputIsActor: PropTypes.bool,

    /**
     * Can select autocomplete item with "Enter" key
     */
    shouldSelectWithEnter: PropTypes.bool,

    /**
     * Can select autocomplete item with "Tab" key
     */
    shouldSelectWithTab: PropTypes.bool,

    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onMenuOpen: PropTypes.func,
    closeOnSelect: PropTypes.bool,
  };

  static defaultProps = {
    itemToString: (i: any): string => i,
    inputIsActor: true,
    disabled: false,
    closeOnSelect: true,
    resetInputOnClose: false,
    shouldSelectWithEnter: true,
    shouldSelectWithTab: false,
  };

  state: State<Item> = {
    isOpen: !!this.props.isOpen,
    highlightedIndex: this.props.defaultHighlightedIndex || 0,
    inputValue: this.props.defaultInputValue || '',
    selectedItem: null,
  };

  componentWillReceiveProps(nextProps: Props<Item>, nextState: State<Item>) {
    // If we do NOT want to close on select, then we should not reset highlight state
    // when we select an item (when we select an item, `this.state.selectedItem` changes)
    if (!nextProps.closeOnSelect && this.state.selectedItem !== nextState.selectedItem) {
      return;
    }

    this.resetHighlightState();
  }

  componentWillUpdate() {
    this.items.clear();
  }

  items = new Map();

  itemCount: number = 0;

  isControlled = () => typeof this.props.isOpen !== 'undefined';

  /**
   * Timeout for closing menu
   */
  blurTimer: number | null = null;

  getOpenState = () => {
    const {isOpen} = this.props;

    return this.isControlled() ? !!isOpen : this.state.isOpen;
  };

  /**
   * Resets `this.items` and `this.state.highlightedIndex`.
   * Should be called whenever `inputValue` changes.
   */
  resetHighlightState = () => {
    // reset items and expect `getInputProps` in child to give us a list of new items
    this.setState({
      highlightedIndex: this.props.defaultHighlightedIndex || 0,
    });
  };

  handleInputChange = (
    {onChange}: {onChange?: Function} = {},
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // We force `isOpen: true` here because:
    // 1) it's possible to have menu closed but input with focus (i.e. hitting "Esc")
    // 2) you select an item, input still has focus, and then change input
    this.openMenu();
    this.setState({
      inputValue: value,
    });

    callIfFunction(onChange, e);
  };

  handleInputFocus = (
    {onFocus} = {onFocus: Function},
    e: React.FormEvent<HTMLFormElement>
  ) => {
    this.openMenu();

    callIfFunction(onFocus, e);
  };

  /**
   *
   * We need this delay because we want to close the menu when input
   * is blurred (i.e. clicking or via keyboard). However we have to handle the
   * case when we want to click on the dropdown and causes focus.
   *
   * Clicks outside should close the dropdown immediately via <DropdownMenu />,
   * however blur via keyboard will have a 200ms delay
   */
  handleInputBlur = (
    {onBlur}: {onBlur?: Function} = {},
    e: React.FormEvent<HTMLInputElement>
  ) => {
    this.blurTimer = window.setTimeout(() => {
      this.closeMenu();
      callIfFunction(onBlur, e);
    }, 200);
  };

  // Dropdown detected click outside, we should close
  handleClickOutside = async () => {
    // Otherwise, it's possible that this gets fired multiple times
    // e.g. click outside triggers closeMenu and at the same time input gets blurred, so
    // a timer is set to close the menu
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }

    // Wait until the current macrotask completes, in the case that the click
    // happened on a hovercard or some other element rendered outside of the
    // autocomplete, but controlled by the existance of the autocomplete, we
    // need to ensure any click handlers are run.
    await new Promise(resolve => setTimeout(resolve));

    this.closeMenu();
  };

  handleInputKeyDown = (
    {onKeyDown}: {onKeyDown?: Function} = {},
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const hasHighlightedItem =
      this.items.size && this.items.has(this.state.highlightedIndex);
    const canSelectWithEnter = this.props.shouldSelectWithEnter && e.key === 'Enter';
    const canSelectWithTab = this.props.shouldSelectWithTab && e.key === 'Tab';

    if (hasHighlightedItem && (canSelectWithEnter || canSelectWithTab)) {
      this.handleSelect(this.items.get(this.state.highlightedIndex), e);
      e.preventDefault();
    }

    if (e.key === 'ArrowUp') {
      this.moveHighlightedIndex(-1);
      e.preventDefault();
    }

    if (e.key === 'ArrowDown') {
      this.moveHighlightedIndex(1);
      e.preventDefault();
    }

    if (e.key === 'Escape') {
      this.closeMenu();
    }

    callIfFunction(onKeyDown, e);
  };

  handleItemClick = (
    {onClick, item, index}: {item: Item; index: number; onClick: Function},
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    this.setState({highlightedIndex: index});
    this.handleSelect(item, e);
    callIfFunction(onClick, item, e);
  };

  /**
   * Handler for when a click occurs in the menu
   *
   * The menu needs to remain open when this happens, so need to cancel the [delayed] closing of the menu due to a blur event.
   */
  handleMenuMouseDown = () => {
    // Cancel close menu from input blur (mouseDown event can occur before input blur :()
    setTimeout(() => this.blurTimer && clearTimeout(this.blurTimer));
  };

  /**
   * When an item is selected via clicking or using the keyboard (e.g. pressing "Enter")
   */
  handleSelect = (
    item: Item,
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ): void => {
    const {onSelect, itemToString, closeOnSelect} = this.props;

    callIfFunction(onSelect, item, this.state, e);

    const newState: Partial<State<Item>> = {
      selectedItem: item,
    };

    if (closeOnSelect) {
      this.closeMenu();
      newState.inputValue = itemToString(item);
    }

    this.setState(newState as State<Item>);
  };

  moveHighlightedIndex = (step: number) => {
    let newIndex = this.state.highlightedIndex + step;

    // when this component is in virtualized mode, only a subset of items will be passed
    // down, making the array length inaccurate. instead we manually pass the length as itemCount
    const listSize = this.itemCount || this.items.size;

    // Make sure new index is within bounds
    newIndex = Math.max(0, Math.min(newIndex, listSize - 1));

    this.setState({
      highlightedIndex: newIndex,
    });
  };

  /**
   * Open dropdown menu
   *
   * This is exposed to render function
   */
  openMenu = (): void => {
    const {onOpen, disabled} = this.props;

    callIfFunction(onOpen);

    if (disabled || this.isControlled()) {
      return;
    }

    this.resetHighlightState();
    this.setState({
      isOpen: true,
    });
  };

  /**
   * Close dropdown menu
   *
   * This is exposed to render function
   */
  closeMenu = (): void => {
    const {onClose, resetInputOnClose} = this.props;

    callIfFunction(onClose);

    if (this.isControlled()) {
      return;
    }

    this.setState(state => {
      return {
        isOpen: false,
        inputValue: resetInputOnClose ? '' : state.inputValue,
      };
    });
  };

  /**
   * This is used to connect an input component to `<AutoComplete>`
   */
  getInputProps = (inputProps: GetInputProps): InputProps => ({
    ...inputProps,
    value: this.state.inputValue,
    onChange: this.handleInputChange.bind(this, inputProps),
    onKeyDown: this.handleInputKeyDown.bind(this, inputProps),
    onFocus: this.handleInputFocus.bind(this, inputProps),
    onBlur: this.handleInputBlur.bind(this, inputProps),
  });

  getItemProps = ({
    item,
    index,
    ...props
  }: {item: Item; index: number} & {[key: string]: any}) => {
    if (!item) {
      // eslint-disable-next-line no-console
      console.warn('getItemProps requires an object with an `item` key');
    }

    const newIndex = index || this.items.size;
    this.items.set(newIndex, item);

    return {
      ...props,
      onClick: this.handleItemClick.bind(this, {item, index: newIndex, ...props}),
    };
  };

  getMenuProps = menuProps => {
    this.itemCount = menuProps.itemCount;

    return {
      ...menuProps,
      onMouseDown: this.handleMenuMouseDown.bind(this, menuProps),
    };
  };

  render() {
    const {children, onMenuOpen} = this.props;
    const isOpen = this.getOpenState();

    return (
      <DropdownMenu
        isOpen={isOpen}
        onClickOutside={this.handleClickOutside}
        onOpen={onMenuOpen}
      >
        {dropdownMenuProps =>
          children({
            ...dropdownMenuProps,
            getMenuProps: (props: GetMenuArgs & {itemCount?: number}): MenuProps =>
              dropdownMenuProps.getMenuProps(this.getMenuProps(props)),
            getInputProps: (
              props: GetInputProps
            ): InputProps | ActorProps<InputProps> => {
              const inputProps = this.getInputProps(props);

              if (!this.props.inputIsActor) {
                return inputProps;
              }

              return dropdownMenuProps.getActorProps(inputProps) as ActorProps<
                InputProps
              >;
            },
            getItemProps: this.getItemProps,
            inputValue: this.state.inputValue,
            selectedItem: this.state.selectedItem,
            highlightedIndex: this.state.highlightedIndex,
            actions: {
              open: this.openMenu,
              close: this.closeMenu,
            },
          })
        }
      </DropdownMenu>
    );
  }
}

export default AutoComplete;
