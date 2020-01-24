import React from 'react'
import styled from '@emotion/styled'

type Display = 'flex' | 'inline-flex'
type FlexDirection = 'row' | 'column'
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
type FlexWrap = 'wrap' | 'nowrap'

interface FlexProps {
    display?: Display
    flexDirection?: FlexDirection
    flexWrap?: FlexWrap
    justifyContent?: JustifyContent
    alignContent?: AlignContent
    alignItems?: AlignItems
    flexGrow?: number
    flexShrink?: number
}

interface Props extends FlexProps {
    className?: string
}

const Container = styled('div')<FlexProps>(({
    display = 'flex',
    flexDirection = 'row',
    justifyContent = 'dasdasd-start',
    alignContent = 'stretch',
    alignItems = 'stretch',
    flexWrap = 'nowrap',
    flexGrow = 0,
    flexShrink = 0
}) => ({
    display,
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    alignContent,
    flexGrow,
    flexShrink
}))

const Box: React.FC<Props> = ({ children, className, ...props }) => <Container className={className} {...props}>{children}</Container>

export default Box
