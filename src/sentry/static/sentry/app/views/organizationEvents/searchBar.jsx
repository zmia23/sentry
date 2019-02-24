import {debounce, flatten, memoize} from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled, {css, cx} from 'react-emotion';

import {NEGATION_OPERATOR, SEARCH_WILDCARD} from 'app/constants';
import {addErrorMessage} from 'app/actionCreators/indicator';
import {defined} from 'app/utils';
import {fetchOrganizationTags, fetchTagValues} from 'app/actionCreators/tags';
import {t} from 'app/locale';
import Button from 'app/components/button';
import DropdownAutoCompleteMenu from 'app/components/dropdownAutoCompleteMenu';
import SentryTypes from 'app/sentryTypes';
import withApi from 'app/utils/withApi';

const tagToObjectReducer = (acc, name) => {
  acc[name] = {
    key: name,
    name,
  };
  return acc;
};

const SEARCH_SPECIAL_CHARS_REGEXP = new RegExp(
  `^${NEGATION_OPERATOR}|\\${SEARCH_WILDCARD}`,
  'g'
);

const TERM_SEPARATOR = ':';

class FieldKeyInput extends React.Component {
  static defaultProps = {
    placeholder: t('Search for events, users, tags, and everything else.'),
  };

  constructor(props) {
    super(props);
    this.state = {
      busy: true,
      isOpen: false,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      this.updateAutoCompleteMenu();
    }
  }

  /**
   * Returns array of possible key values that substring match `query`
   *
   * e.g. ['is:', 'assigned:', 'url:', 'release:']
   */
  getKeys = query => {
    const {supportedKeys} = this.props;

    // Return all if query is empty
    let tagKeys = Object.keys(supportedKeys).map(key => `${key}:`);

    if (query) {
      tagKeys = tagKeys.filter(key => key.indexOf(query) > -1);
    }

    // If the environment feature is active and excludeEnvironment = true
    // then remove the environment key
    if (this.props.excludeEnvironment) {
      tagKeys = tagKeys.filter(key => key !== 'environment:');
    }

    return tagKeys.map(category => ({
      value: category,
      label: category,
    }));
  };

  getCursorPosition = () => {
    if (!this.searchInput) {
      return -1;
    }
    return this.searchInput.selectionStart;
  };

  updateAutoCompleteMenu = () => {
    // In category... show categories
    this.setState({
      busy: false,
      searchItems: this.getKeys(''),
    });
  };

  handleKeyDown = e => {
    if (e.key === 'Backspace' && this.props.value === '') {
      this.props.onBackspace();
    }
  };

  handleQueryChange = e => {
    this.props.onQueryChange(e.target.value);
  };

  handleInputFocus = open => {
    this.updateAutoCompleteMenu();
    // open();
  };

  handleDropdownClose = () => {
    this.setState({
      isOpen: false,
    });
  };

  handleDropdownOpen = () => {
    this.setState({
      isOpen: true,
    });
    this.updateAutoCompleteMenu();
  };

  handleDropdownSelect = ({value}) => {
    this.props.onSelect(value);
    this.setState(
      {
        searchItems: [],
      },
      () => {
        // this.focus();
        this.updateAutoCompleteMenu();
      }
    );
  };

  render() {
    return (
      <div style={{position: 'relative'}}>
        <div style={{opacity: 0, padding: '0 8px', whiteSpace: 'nowrap'}}>
          {this.props.value || 'Placeholder text'}
        </div>
        <DropdownAutoCompleteMenu
          shouldSelectWithTab={true}
          defaultHighlightedIndex={-1}
          busy={this.state.busy}
          items={this.state.searchItems}
          alignMenu="left"
          hideInput
          rootClassName={css`
            flex: 1;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: -1px;
          `}
          blendCorner={true}
          isOpen={this.state.isOpen}
          onSelect={this.handleDropdownSelect}
          onOpen={this.handleDropdownOpen}
          onClose={this.handleDropdownClose}
          value={this.props.value}
        >
          {renderProps => {
            const inputProps = renderProps.getInputProps({
              type: 'text',
              tabIndex: 1,
              placeholder: this.props.placeholder,
              name: 'query',
              autoComplete: 'off',
              onActorMount: this.props.onGetRef,
              onFocus: () => this.handleInputFocus(renderProps.actions.open),
              onBlur: this.props.onBlur,
              onKeyDown: this.handleKeyDown,
              onChange: this.handleQueryChange,
              disabled: this.props.disabled,
            });
            return (
              <Input
                {...renderProps.getActorProps({isStyled: true, ...inputProps})}
                value={this.props.value}
              />
            );
          }}
        </DropdownAutoCompleteMenu>
      </div>
    );
  }
}

class FieldValueInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      busy: true,
      isOpen: false,
      query: '',
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      this.updateAutoCompleteMenu();
    }
  }

  getValues = debounce((tag, query, callback) => {
    // Strip double quotes if there are any
    query = query.replace(/"/g, '').trim();

    this.setState({
      busy: true,
    });

    this.props.onGetTagValues(tag, query).then(
      values => {
        this.setState({
          busy: false,
          searchItems: values.map(value => {
            // Wrap in quotes if there is a space
            const quotedText = value.indexOf(' ') > -1 ? `"${value}"` : value;
            return {
              value: quotedText,
              label: quotedText,
            };
          }),
        });
      },
      () => {
        this.setState({busy: false});
      }
    );
  }, 300);

  updateAutoCompleteMenu = () => {
    // parse tag name and fetch values
    let {supportedKeys} = this.props;
    let tagName = this.props.termKey;
    let tag = supportedKeys[tagName];

    if (!tag) return undefined;

    // Ignore the environment tag if the feature is active and excludeEnvironment = true
    if (this.props.excludeEnvironment && tagName === 'environment') {
      return undefined;
    }
    let query = '';

    return this.getValues(tag, query, values => {
      console.log('values', values);
    });
  };

  handleKeyUp = e => {
    if (e.key === 'Backspace' && this.props.value === '') {
      // this.props.onEditPreviousTerm();
    }
  };

  handleQueryChange = e => {
    const {value} = e.target;

    if (value[value.length - 1] === TERM_SEPARATOR) {
      this.props.onSelect(value);
      return;
    }

    this.props.onQueryChange(e.target.value);
  };

  handleInputFocus = open => {
    this.updateAutoCompleteMenu();
    this.props.onFocus();
    // open();
  };

  handleKeyDown = e => {
    if (e.key === 'Backspace' && this.props.value === '') {
      this.props.onBackspace(e);
    }
  };

  handleDropdownClose = () => {
    this.setState({
      isOpen: false,
    });
  };

  handleDropdownOpen = () => {
    this.setState({
      isOpen: true,
    });
    this.updateAutoCompleteMenu();
  };

  handleDropdownSelect = ({value}) => {
    this.props.onSelect(value);
    this.setState(
      {
        searchItems: [],
      },
      () => {
        this.updateAutoCompleteMenu();
      }
    );
  };

  render() {
    return (
      <DropdownAutoCompleteMenu
        shouldSelectWithTab={true}
        busy={this.state.busy}
        items={this.state.searchItems}
        alignMenu="left"
        hideInput
        rootClassName={css`
          flex: 1;
          margin-top: -1px;
          margin-bottom: -1px;
        `}
        blendCorner={true}
        isOpen={this.state.isOpen}
        defaultHighlightedIndex={-1}
        onSelect={this.handleDropdownSelect}
        onOpen={this.handleDropdownOpen}
        onClose={this.handleDropdownClose}
        value={this.props.value}
      >
        {renderProps => {
          const inputProps = renderProps.getInputProps({
            type: 'text',
            tabIndex: 2,
            placeholder: this.props.placeholder,
            name: 'query',
            autoComplete: 'off',
            onActorMount: this.props.onGetRef,
            onFocus: () => this.handleInputFocus(renderProps.actions.open),
            onBlur: () => {
              console.log('renderProps value blur');
              this.props.onBlur();
            },
            onKeyUp: this.handleKeyUp,
            onKeyDown: this.handleKeyDown,
            onChange: this.handleQueryChange,
            disabled: this.props.disabled,
          });
          return (
            <Input
              {...renderProps.getActorProps({isStyled: true, ...inputProps})}
              value={this.props.value}
            />
          );
        }}
      </DropdownAutoCompleteMenu>
    );
  }
}

const NewTermInput = styled(
  class NewTermInput extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        isEditingKey: true,
      };
    }

    static defaultProps = {
      placeholder: t('Search for events, users, tags, and everything else.'),
    };

    componentDidUpdate(prevProps, prevState) {
      console.log('cdu', prevState.isEditingKey, this.state.isEditingKey);
      if (
        this.props.term.key &&
        ((!prevProps.isEditingValue && this.props.isEditingValue) ||
          (prevState.isEditingKey && !this.state.isEditingKey && this.valueRef))
      ) {
        this.valueRef.focus();
      } else if (
        (!this.props.term.key &&
          !this.props.term.value &&
          (prevProps.term.key !== this.props.term.key ||
            prevProps.term.value !== this.props.term.value)) ||
        (!prevState.isEditingKey && this.state.isEditingKey)
      ) {
        console.log('keyRef focus');
        this.keyRef.focus();
      }
    }

    handleKeyQueryChange = value => {
      this.props.onTermChange({key: value, value: this.props.term.value});
    };

    handleKeyFocus = () => {};

    handleValueBackspace = e => {
      console.log('handle value backspace');
      this.setState({isEditingKey: true});
    };

    handleKeyBackspace = e => {
      console.log('handle key backspace');
      this.setState({isEditingKey: false});
      this.props.onEditPreviousTerm(e);
    };

    handleValueFocus = () => {
      console.log('handle value focus');
      this.setState({isEditingKey: false});
    };

    handleValueBlur = () => {
      console.log('value blur');
      this.handleSelectValue(this.props.term.value);
      // this.props.onValueBlur();
    };

    handleValueQueryChange = value => {
      this.props.onTermChange({key: this.props.term.key, value});
    };

    handleSelectKey = value => {
      this.setState({
        isEditingKey: false,
      });
      this.props.onTermChange({key: value, value: this.props.term.value});
    };

    handleSelectValue = value => {
      if (!value || !this.props.term.key) {
        return;
      }
      this.props.onTermCompleted({
        key: this.props.term.key,
        value,
      });
      this.setState({
        isEditingKey: true,
      });
    };

    render() {
      const {
        term,
        placeholder,
        supportedCategories,
        onGetTagValues,
        ...props
      } = this.props;
      return (
        <div {...props}>
          <FieldKeyInput
            value={term.key}
            supportedKeys={supportedCategories}
            placeholder={placeholder}
            active={this.state.isEditingKey}
            onSelect={this.handleSelectKey}
            onGetRef={ref => (this.keyRef = ref)}
            onQueryChange={this.handleKeyQueryChange}
            onBackspace={this.handleKeyBackspace}
            onFocus={this.handleKeyFocus}
          />
          <FieldValueInput
            value={term.value}
            termKey={(term.key && term.key.slice(0, -1)) || ''}
            active={!this.state.isEditingKey}
            supportedKeys={supportedCategories}
            onGetRef={ref => (this.valueRef = ref)}
            onGetTagValues={onGetTagValues}
            onQueryChange={this.handleValueQueryChange}
            onBackspace={this.handleValueBackspace}
            onSelect={this.handleSelectValue}
            onFocus={this.handleValueFocus}
            onBlur={this.handleValueBlur}
          />
        </div>
      );
    }
  }
)`
  display: flex;
`;

const Term = styled(
  class Term extends React.Component {
    render() {
      const {term, onTermRemove, ...props} = this.props;
      return (
        <div {...props}>
          <span style={{marginRight: 4}}>
            {term.key}
            {term.value}
          </span>

          <span className="icon-circle-cross" onClick={onTermRemove} />
        </div>
      );
    }
  }
)`
  display: flex;
  align-items: center;
  background-color: ${p => p.theme.darkWhite};
  border: 1px solid ${p => p.theme.borderLight};
  padding: 0 6px;
  margin-right: 4px;
  border-radius: 8px;
`;

class SmartSearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      term: {},
      terms: [],
      isEditingValue: false,
    };
  }

  parseTerms = query => {
    return query.split(' ');
  };

  handleClearSearch = () => {
    this.setState(state => ({
      terms: [],
      term: {key: '', value: ''},
      isEditingValue: false,
    }));
  };

  handleTermCompleted = term => {
    console.log('handle term completed', term);
    this.setState(state => ({
      terms: [...state.terms, term],
      term: {key: '', value: ''},
      isEditingValue: false,
    }));
  };

  handleTermRemove = index => {
    this.setState(state => {
      const terms = [...state.terms];
      terms.splice(index, 1);
      return {
        terms,
      };
    });
  };

  handleEditPreviousTerm = () => {
    const term = this.state.terms.pop();
    console.log('edit prev', term);
    this.setState({
      term,
      isEditingValue: true,
    });
  };

  handleTermChange = term => {
    this.setState({term});
  };

  render() {
    let {className, dropdownClassName, disabled, supportedCategories} = this.props;
    const hasTerms = !!this.state.terms.length;

    return (
      <div
        className={cx(
          {
            disabled,
          },
          className
        )}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            console.log('submit');
            this.props.onSearch(
              this.state.terms.map(({key, value}) => `${key}${value}`).join(' ')
            );
          }}
        >
          <SearchBarContainer>
            <span className="icon-search" />
            <TermsAndEditor>
              <CompletedTerms>
                {this.state.terms.map((term, i) => (
                  <Term
                    term={term}
                    onGetTagValues={this.props.onGetTagValues}
                    supportedCategories={supportedCategories}
                    onTermCompleted={this.handleTermCompleted}
                    onTermRemove={() => this.handleTermRemove(i)}
                  />
                ))}
              </CompletedTerms>
              <NewTermInput
                term={this.state.term}
                onTermChange={this.handleTermChange}
                onGetTagValues={this.props.onGetTagValues}
                supportedCategories={supportedCategories}
                onTermCompleted={this.handleTermCompleted}
                onEditPreviousTerm={this.handleEditPreviousTerm}
                isEditingValue={this.state.isEditingValue}
              />
            </TermsAndEditor>
            <div>
              <Button
                borderless
                disabled={!hasTerms}
                onClick={this.handleClearSearch}
                icon="icon-circle-close"
              />
              <Button
                borderless
                icon="icon-return-key"
                type="submit"
                disabled={!hasTerms}
              />
            </div>
          </SearchBarContainer>
        </form>
      </div>
    );
  }
}

class SearchBar extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object,
    organization: SentryTypes.Organization,
  };

  constructor() {
    super();

    this.state = {
      tags: {},
    };
  }

  componentDidMount() {
    const {api, organization} = this.props;
    fetchOrganizationTags(api, organization.slug).then(
      results => {
        this.setState({
          tags: this.getAllTags(results.map(({key}) => key)),
        });
      },
      () => addErrorMessage(t('There was a problem fetching tags'))
    );
  }

  /**
   * Returns array of tag values that substring match `query`; invokes `callback`
   * with data when ready
   */
  getEventFieldValues = memoize(
    (tag, query) => {
      const {api, organization} = this.props;

      return fetchTagValues(api, organization.slug, tag.key, query).then(
        results =>
          flatten(results.filter(({name}) => defined(name)).map(({name}) => name)),
        () => {
          throw new Error('Unable to fetch event field values');
        }
      );
    },
    ({key}, query) => `${key}-${query}`
  );

  getAllTags = (orgTags = []) => orgTags.sort().reduce(tagToObjectReducer, {});

  /**
   * Prepare query string (e.g. strip special characters like negation operator)
   */
  prepareQuery = query => {
    return query.replace(SEARCH_SPECIAL_CHARS_REGEXP, '');
  };

  render() {
    return (
      <SmartSearchBar
        key={this.props.query}
        {...this.props}
        onGetTagValues={this.getEventFieldValues}
        prepareQuery={this.prepareQuery}
        supportedCategories={this.state.tags}
        excludeEnvironment
        dropdownClassName={css`
          max-height: 300px;
          overflow-y: auto;
        `}
      />
    );
  }
}

export default withApi(SearchBar);

const CompletedTerms = styled('div')`
  display: flex;
`;

const Input = styled('input')`
  flex: 1;
  border: none;

  height: auto;
  padding: 8px;
  position: relative;

  display: block;
  width: 100%;
  line-height: 1.42857143;
  background-color: transparent;
  background-image: none;
  box-shadow: none;
  -webkit-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
  -o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
  transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;

  &:focus {
    box-shadow: none;
  }
`;

const SearchBarContainer = styled('div')`
  border: 1px solid #c9c0d1;
  border-radius: ${p => p.theme.borderRadius};
  box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;

  font-size: 14px;
  color: #493e54;

  .icon-search {
    color: #89779a;
    padding: 0 8px;
  }
`;

const TermsAndEditor = styled('div')`
  display: flex;
  flex: 1;
`;
