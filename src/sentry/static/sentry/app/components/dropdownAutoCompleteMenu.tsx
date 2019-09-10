import {AutoSizer, List} from 'react-virtualized';
import React from 'react';
import _ from 'lodash';
import styled from 'react-emotion';

import {t} from 'app/locale';
import AutoComplete from 'app/components/autoComplete';
import DropdownBubble from 'app/components/dropdownBubble';
import Input from 'app/views/settings/components/forms/controls/input';
import LoadingIndicator from 'app/components/loadingIndicator';
import space from 'app/styles/space';

type ItemObject = {
  value: any;
  searchKey: string;
  label: React.ReactNode; //| (args: any) => React.ReactNode;
  groupLabel?: boolean;
  index?: number;
};

type GroupedItem = ItemObject & {
  items: ItemObject[];

  // Should hide group label
  hideGroupLabel: boolean;
};

type Props = {
  children: (a: any) => React.ReactNode;

  // Flat item array or grouped item array
  items: ItemObject[] | GroupedItem[];

  className?: string;

  /**
   * If this is undefined, autocomplete filter will use this value instead of the
   * current value in the filter input element.
   *
   * This is useful if you need to strip characters out of the search
   */
  filterValue: string;

  /**
   * Used to control dropdown state (optional)
   */
  isOpen?: boolean;

  /**
   * Show loading indicator next to input
   */
  busy: boolean;

  /**
   * Hide's the input when there are no items. Avoid using this when querying
   * results in an async fashion.
   */
  emptyHidesInput: boolean;

  /**
   * When an item is selected (via clicking dropdown, or keyboard navigation)
   */
  onSelect: Function;
  /**
   * When AutoComplete input changes
   */
  onChange: Function;

  /**
   * Callback for when dropdown menu opens
   */
  onOpen: Function;

  /**
   * Callback for when dropdown menu closes
   */
  onClose: Function;

  /**
   * Message to display when there are no items initially
   */
  emptyMessage: React.ReactNode;

  /**
   * Message to display when there are no items that match the search
   */
  noResultsMessage: React.ReactNode;

  /**
   * Presentational properties
   */

  /**
   * Dropdown menu alignment.
   */
  alignMenu: 'left' | 'right';

  /**
   * Should menu visually lock to a direction (so we don't display a rounded corner)
   */
  blendCorner: boolean;

  /**
   * Hides the default filter input
   */
  hideInput: boolean;

  /**
   * Search input's placeholder text
   */
  searchPlaceholder: string;

  /**
   * Size for dropdown items
   */
  itemSize: 'zero' | 'small' | '';

  /**
   * Changes the menu style to have an arrow at the top
   */
  menuWithArrow: boolean;

  menuFooter: React.ReactNode | Function;
  menuHeader: React.ReactNode;
  /**
   * Props to pass to menu component
   */
  menuProps: object;

  /**
   * for passing simple styles to the root container
   */
  rootClassName: string;

  /**
   * Props to pass to input/filter component
   */
  inputProps: object;

  /**
   * renderProp for the end (right side) of the search input
   */
  inputActions: React.ReactNode | Function;

  css: object;
  style: object;
} & (
  | {
      /**
       * Max height of dropdown menu. Units are assumed as `px` if number, otherwise will assume string has units
       */
      maxHeight: number;

      /**
       * Supplying this height will force the dropdown menu to be a virtualized list.
       * This is very useful (and probably required) if you have a large list. e.g. Project selector with many projects.
       *
       * Currently, our implementation of the virtualized list requires a fixed height.
       */
      virtualizedHeight: number;

      /**
       * If you use grouping with virtualizedHeight, the labels will be that height unless specified here
       */
      virtualizedLabelHeight?: number;
    }
  | {
      maxHeight: number | string;
      virtualizedHeight?: false | null;
      virtualizedLabelHeight?: false | null;
    });

class DropdownAutoCompleteMenu extends React.Component<Props> {
  static defaultProps = {
    onSelect: () => {},
    maxHeight: 300,
    blendCorner: true,
    emptyMessage: t('No items'),
    searchPlaceholder: t('Filter search'),
  };

  filterItems = (items, inputValue) =>
    items.filter(item => {
      return (
        (item.searchKey || `${item.value} ${item.label}`)
          .toLowerCase()
          .indexOf(inputValue.toLowerCase()) > -1
      );
    });

  filterGroupedItems = (groups, inputValue) =>
    groups
      .map(group => {
        return {
          ...group,
          items: this.filterItems(group.items, inputValue),
        };
      })
      .filter(group => group.items.length > 0);

  autoCompleteFilter = (items, inputValue) => {
    let itemCount = 0;

    if (!items) {
      return [];
    }

    if (items[0] && items[0].items) {
      //if the first item has children, we assume it is a group
      return _.flatMap(this.filterGroupedItems(items, inputValue), item => {
        const groupItems = item.items.map(groupedItem => ({
          ...groupedItem,
          index: itemCount++,
        }));

        // Make sure we don't add the group label to list of items
        // if we try to hide it, otherwise it will render if the list
        // is using virtualized rows (because of fixed row heights)
        if (item.hideGroupLabel) {
          return groupItems;
        }

        return [{...item, groupLabel: true}, ...groupItems];
      });
    }

    return this.filterItems(items, inputValue).map((item, index) => ({...item, index}));
  };

  getHeight = items => {
    const {maxHeight, virtualizedHeight, virtualizedLabelHeight} = this.props;

    if (typeof virtualizedHeight === 'number' && typeof maxHeight === 'number') {
      const minHeight = virtualizedLabelHeight
        ? items.reduce(
            (a, r) => a + (r.groupLabel ? virtualizedLabelHeight : virtualizedHeight),
            0
          )
        : items.length * virtualizedHeight;
      return Math.min(minHeight, maxHeight);
    }

    console.error('`virtualizedHeight` and `height` must be a number'); // eslint-disable-line no-console
    return 0;
  };

  renderList = ({items, ...otherProps}) => {
    const {virtualizedHeight, virtualizedLabelHeight} = this.props;

    // If `virtualizedHeight` is defined, use a virtualized list
    if (typeof virtualizedHeight !== 'undefined') {
      return (
        <AutoSizer disableHeight>
          {({width}) => (
            <List
              width={width}
              style={{outline: 'none'}}
              height={this.getHeight(items)}
              rowCount={items.length}
              rowHeight={({index}): number => {
                return items[index].groupLabel && virtualizedLabelHeight
                  ? (virtualizedLabelHeight as number)
                  : (virtualizedHeight as number);
              }}
              rowRenderer={({key, index, style}) => {
                const item = items[index];
                return this.renderRow({
                  item,
                  style,
                  key,
                  ...otherProps,
                });
              }}
            />
          )}
        </AutoSizer>
      );
    }

    return items.map(item => {
      const {index} = item;
      const key = `${item.value}-${index}`;

      return this.renderRow({item, key, ...otherProps});
    });
  };

  renderRow = ({
    item,
    style,
    key,
    itemSize,
    highlightedIndex,
    inputValue,
    getItemProps,
  }: {
    item: ItemObject;
    key?: string;
    itemSize?: number;
    highlightedIndex?: number;
    inputValue?: string;
    getItemProps?: Function;
    style?: React.CSSProperties;
  }) => {
    const {index} = item;

    return item.groupLabel ? (
      <LabelWithBorder style={style} key={index}>
        {item.label && <GroupLabel>{item.label}</GroupLabel>}
      </LabelWithBorder>
    ) : (
      <AutoCompleteItem
        size={itemSize}
        key={key}
        index={index}
        highlightedIndex={highlightedIndex}
        {...getItemProps({item, index, style})}
      >
        {typeof item.label === 'function' ? item.label({inputValue}) : item.label}
      </AutoCompleteItem>
    );
  };

  render() {
    const {
      onSelect,
      onChange,
      onOpen,
      onClose,
      children,
      items,
      menuProps,
      inputProps,
      alignMenu,
      blendCorner,
      maxHeight,
      emptyMessage,
      noResultsMessage,
      style,
      rootClassName,
      className,
      menuHeader,
      menuFooter,
      inputActions,
      menuWithArrow,
      searchPlaceholder,
      itemSize,
      busy,
      hideInput,
      filterValue,
      emptyHidesInput,
      ...props
    } = this.props;

    return (
      <AutoComplete
        resetInputOnClose
        itemToString={() => ''}
        onSelect={onSelect}
        inputIsActor={false}
        onOpen={onOpen}
        onClose={onClose}
        {...props}
      >
        {({
          getActorProps,
          getRootProps,
          getInputProps,
          getMenuProps,
          getItemProps,
          inputValue,
          selectedItem,
          highlightedIndex,
          isOpen,
          actions,
        }) => {
          // This is the value to use to filter (default to value in filter input)
          const filterValueOrInput =
            typeof filterValue !== 'undefined' ? filterValue : inputValue;
          // Only filter results if menu is open and there are items
          const autoCompleteResults =
            (isOpen &&
              items &&
              this.autoCompleteFilter(items, filterValueOrInput || '')) ||
            [];

          // Can't search if there are no items
          const hasItems = items && !!items.length;
          // Items are loading if null
          const itemsLoading = items === null;
          // Has filtered results
          const hasResults = !!autoCompleteResults.length;
          // No items to display
          const showNoItems = !busy && !filterValueOrInput && !hasItems;
          // Results mean there was an attempt to search
          const showNoResultsMessage = !busy && filterValueOrInput && !hasResults;

          // Hide the input when we have no items to filter, only if
          // emptyHidesInput is set to true.
          const showInput = !hideInput && (hasItems || !emptyHidesInput);

          // When virtualization is turned on, we need to pass in the number of
          // selecteable items for arrow-key limits
          const itemCount =
            this.props.virtualizedHeight &&
            autoCompleteResults.filter(i => !i.groupLabel).length;

          const renderedFooter =
            typeof menuFooter === 'function' ? menuFooter({actions}) : menuFooter;

          const renderedInputActions =
            typeof inputActions === 'function' ? inputActions() : inputActions;

          return (
            <AutoCompleteRoot {...getRootProps()} className={rootClassName}>
              {children({
                getInputProps,
                getActorProps,
                actions,
                isOpen,
                selectedItem,
              })}

              {isOpen && (
                <BubbleWithMinWidth
                  className={className}
                  {...getMenuProps({
                    ...menuProps,
                    style,
                    isStyled: true,
                    css: this.props.css,
                    itemCount,
                    blendCorner,
                    alignMenu,
                    menuWithArrow,
                  })}
                >
                  {itemsLoading && <LoadingIndicator mini />}
                  {showInput && (
                    <StyledInputWrapper>
                      <StyledInput
                        autoFocus
                        placeholder={searchPlaceholder}
                        {...getInputProps({...inputProps, onChange})}
                      />
                      <InputLoadingWrapper>
                        {busy && <LoadingIndicator size={16} mini />}
                      </InputLoadingWrapper>
                      {renderedInputActions}
                    </StyledInputWrapper>
                  )}
                  <div>
                    {menuHeader && <LabelWithPadding>{menuHeader}</LabelWithPadding>}

                    <StyledItemList
                      data-test-id="autocomplete-list"
                      maxHeight={maxHeight}
                    >
                      {showNoItems && <EmptyMessage>{emptyMessage}</EmptyMessage>}
                      {showNoResultsMessage && (
                        <EmptyMessage>
                          {noResultsMessage || `${emptyMessage} ${t('found')}`}
                        </EmptyMessage>
                      )}
                      {busy && (
                        <BusyMessage>
                          <EmptyMessage>{t('Searching...')}</EmptyMessage>
                        </BusyMessage>
                      )}
                      {!busy &&
                        this.renderList({
                          items: autoCompleteResults,
                          itemSize,
                          highlightedIndex,
                          inputValue,
                          getItemProps,
                        })}
                    </StyledItemList>

                    {renderedFooter && (
                      <LabelWithPadding>{renderedFooter}</LabelWithPadding>
                    )}
                  </div>
                </BubbleWithMinWidth>
              )}
            </AutoCompleteRoot>
          );
        }}
      </AutoComplete>
    );
  }
}

const AutoCompleteRoot = styled(({isOpen: _isOpen, ...props}) => <div {...props} />)`
  position: relative;
  display: inline-block;
`;

const InputLoadingWrapper = styled('div')`
  display: flex;
  background: #fff;
  align-items: center;
  flex-shrink: 0;
  width: 30px;
`;

const StyledInputWrapper = styled('div')`
  display: flex;
  border-bottom: 1px solid ${p => p.theme.borderLight};
  border-radius: ${p => `${p.theme.borderRadius} ${p.theme.borderRadius} 0 0`};
  align-items: center;
`;

const StyledInput = styled(Input)`
  flex: 1;
  border: 1px solid transparent;

  &,
  &:focus,
  &:active,
  &:hover {
    border: 0;
    box-shadow: none;
    font-size: 13px;
    padding: ${space(1)};
    font-weight: normal;
    color: ${p => p.gray2};
  }
`;

const getItemPaddingForSize = size => {
  if (size === 'small') {
    return `${space(0.5)} ${space(1)}`;
  }
  if (size === 'zero') {
    return '0';
  }

  return space(1);
};

const AutoCompleteItem = styled('div')`
  /* needed for virtualized lists that do not fill parent height */
  /* e.g. breadcrumbs (org height > project, but want same fixed height for both) */
  display: flex;
  flex-direction: column;
  justify-content: center;

  font-size: 0.9em;
  background-color: ${p =>
    p.index === p.highlightedIndex ? p.theme.offWhite : 'transparent'};
  padding: ${p => getItemPaddingForSize(p.size)};
  cursor: pointer;
  border-bottom: 1px solid ${p => p.theme.borderLight};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${p => p.theme.offWhite};
  }
`;

const LabelWithBorder = styled('div')`
  background-color: ${p => p.theme.offWhite};
  border-bottom: 1px solid ${p => p.theme.borderLight};
  border-width: 1px 0;
  color: ${p => p.theme.gray3};
  font-size: ${p => p.theme.fontSizeMedium};

  &:first-child {
    border-top: none;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const LabelWithPadding = styled(LabelWithBorder)`
  padding: ${space(0.25)} ${space(1)};
`;

const GroupLabel = styled('div')`
  padding: ${space(0.25)} ${space(1)};
`;

const StyledItemList = styled('div')<{maxHeight: number | string}>`
  max-height: ${p =>
    typeof p.maxHeight === 'number' ? `${p.maxHeight}px` : p.maxHeight};
  overflow-y: auto;
`;

const BusyMessage = styled('div')`
  display: flex;
  justify-content: center;
  padding: ${space(1)};
`;

const EmptyMessage = styled('div')`
  color: ${p => p.theme.gray1};
  padding: ${space(2)};
  text-align: center;
  text-transform: none;
`;

const BubbleWithMinWidth = styled(DropdownBubble)`
  min-width: 250px;
`;

export default DropdownAutoCompleteMenu;

export {AutoCompleteRoot};
