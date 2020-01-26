import { trimPackage } from 'app/components/events/interfaces/frame';

import { findThreadStacktrace, findRelevantFrame } from './Threads'

export interface Thread {
    name?: string
    id?: string
    crashed: boolean
    current: boolean
    stacktrace?: Stacktrace
}

// TODO -> define correct types
interface Stacktrace {
    frames: Array<Frame>
    hasSystemFrames: boolean
    framesOmitted: any
    registers: any
}

interface Frame {
    function: string
    errors: any
    colNo: any
    vars: any
    package: any
    absPath: string
    inApp: boolean
    lineNo: number
    module: any
    filename: string
    platform: null
    instructionAddr: string
    context: any
    symbolAddr: any
    trust: any
    symbol: any
    rawFunction: any
}

function trimFilename(filename: string) {
    const pieces = filename.split(/\//g);
    console.log('pieces', pieces)
    return pieces[pieces.length - 1].split(".")[0].toLowerCase();
}

// TODO -> define event interface
function getThreadLabel(thread: Thread, event: any): string {
    const stacktrace = findThreadStacktrace(thread, event, false);

    if (!stacktrace) return 'unknown'

    const relevantFrame: Frame = findRelevantFrame(stacktrace);

    if (relevantFrame.filename) {
        return trimFilename(relevantFrame.filename)
    }

    if (relevantFrame.package) {
        return trimPackage(relevantFrame.package)
    }

    if (relevantFrame.module) {
        return relevantFrame.module
    }

    return 'unknown'
}

export default getThreadLabel
