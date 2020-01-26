import React from 'react'
import { default as ReactSelect } from 'react-select'
import InlineSvg from 'app/components/inlineSvg'
import Badge from 'app/components/badge';
import Box from 'app/components/Box'
import styled from '@emotion/styled'

import getThreadLabel, { Thread } from './getThreadLabel'

interface Props {
    className?: string
    threads: Array<Thread>
    event: any
}

const StyledInlineSvg = styled(InlineSvg)(({ theme }) => ({
    color: theme.orange
}))

const StyledBadge = styled(Badge)({
    marginRight: 5
})

const StyledFormatOptionLabelContainer = styled(Box)({
    minHeight: 28
})

const ThreadsSelector: React.FC<Props> = ({ className, threads, event }) => {
    const SingleValue = () => (
        <div>oi</div>
    );

    return (
        <ReactSelect
            defaultValue={threads[0]}
            className={className}
            styles={{
                control: provided => ({
                    ...provided,
                    width: '100%',
                    height: 28,
                    minHeight: 28,
                    border: '1px solid #c1b8ca',
                    borderColor: '#c1b8ca',
                    boxShadow: '0 2px 0 rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer',
                    ':hover': {
                        borderColor: '#c1b8ca'
                    }
                }),
                container: provided => ({
                    ...provided,
                    zIndex: 3,
                    position: 'relative',
                    display: 'inline-flex',
                    // TODO: define width in the theme ?
                    width: 420,
                    height: 30
                }),
                valueContainer: (base) => ({
                    ...base,
                    maxHeight: '100%'
                }),
                indicatorsContainer: provided => ({
                    ...provided,
                    maxHeight: '100%'
                }),
                dropdownIndicator: (provided, state) => ({
                    ...provided,
                    transition: 'all .2s ease',
                    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : ''
                }),
                singleValue: (provided, state) => {
                    let opacity = 1;
                    if (state.isDisabled) {
                        opacity = 0.5
                    }
                    return {
                        ...provided,
                        opacity,
                        transition: 'opacity 300ms',
                        width: 'calc(100% - 10px)',
                        color: '#443A4E'
                    };
                },
                option: (provided, state) => {
                    let background = '#ffffff';
                    let color = '#443A4E';
                    let opacity = 1;

                    if (state.isSelected) {
                        background = '#6c5fc7';
                        color = '#ffffff';
                    }
                    if (state.isDisabled) {
                        opacity = 0.5
                    }
                    return ({
                        ...provided,
                        cursor: !state.isDisabled ? 'pointer' : 'auto',
                        background,
                        color,
                        opacity,
                        transition: 'opacity 300ms',
                        userSelect: state.isDisabled ? 'none' : 'auto',
                        height: 'auto',
                        ':hover': {
                            fontWeight: !state.isDisabled && 600,
                            background: !state.isSelected && !state.isDisabled && '#f7f8f9'
                        }
                    })
                },
            }}
            formatOptionLabel={({ id, name, crashed }) => (
                <StyledFormatOptionLabelContainer alignItems='center' justifyContent='space-between'>
                    <Box alignItems='center'>
                        {id && (
                            <StyledBadge text={id} />
                        )}
                        <Box flexDirection='column'>
                            {name}
                            {crashed && (
                                <div>crashed with X</div>
                            )
                        </Box>
                    </Box>
                    {crashed && (
                        <StyledInlineSvg src="icon-siren" />
                    )}
                </StyledFormatOptionLabelContainer>
            )}
            options={
                threads.map(thread => {
                    const name = getThreadLabel(thread, event)
                    return ({
                        ...thread,
                        name,
                        value: thread.id,
                        isDisabled: name === 'unknown'
                    })
                })
            }
            components={{ SingleValue }}
            isClearable
            isSearchable
        />
    )
}

export default ThreadsSelector
