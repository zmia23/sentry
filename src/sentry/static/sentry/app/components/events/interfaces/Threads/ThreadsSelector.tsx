import React from 'react'
import { default as ReactSelect } from 'react-select'
import InlineSvg from 'app/components/inlineSvg'
import Box from 'app/components/Box'

// const options = [
//     { value: 'chocolate', label: 'Chocolate' },
//     { value: 'strawberry', label: 'Strawberry' },
//     { value: 'vanilla', label: 'Vanilla' }
// ]

interface Props {
    className?: string
    threads: Array<Thread>
}

interface Thread {
    name?: string
    id?: string
    crashed: boolean
    current: boolean
}

const ThreadsSelector: React.FC<Props> = ({ className, threads }) => {
    return (
        <ReactSelect
            defaultValue={threads[0]}
            className={className}
            styles={{
                container: provided => ({
                    ...provided,
                    zIndex: 3,
                    position: 'relative',
                    display: 'inline-flex',
                    // TODO: define width in the theme ?
                    width: 420,
                }),
                control: provided => ({
                    ...provided,
                    width: '100%'
                }),
                dropdownIndicator: (provided, state) => ({
                    ...provided,
                    transition: 'all .2s ease',
                    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : ''
                }),
                option: provided => ({
                    ...provided,
                    // backgroundColor: 'transparent'
                }),
            }}
            formatOptionLabel={({ name, id, crashed }) => (
                <Box alignContent='center' justifyContent='space-between'>
                    <Box>
                        {id && (
                            <span>
                                {`#${id}`}
                            </span >
                        )}
                        {name}
                    </Box>
                    {crashed && (
                        <InlineSvg src="icon-siren" />
                    )}
                </Box>
            )}
            options={threads}
            isClearable
            isSearchable
        />
    )
}

export default ThreadsSelector

// function getThreadTitle(thread, event, simplified) {
//     const stacktrace = findThreadStacktrace(thread, event, false);
//     const bits = ['Thread'];
//     if (defined(thread.name)) {
//       bits.push(` "${thread.name}"`);
//     }
//     if (defined(thread.id)) {
//       bits.push(' #' + thread.id);
//     }

//     if (!simplified) {
//       if (stacktrace) {
//         const frame = findRelevantFrame(stacktrace);
//         bits.push(' — ');
//         bits.push(
//           <em key="location">
//             {frame.filename
//               ? trimFilename(frame.filename)
//               : frame.package
//                 ? trimPackage(frame.package)
//                 : frame.module
//                   ? frame.module
//                   : '<unknown>'}
//           </em>
//         );
//       }

//       if (thread.crashed) {
//         const exc = findThreadException(thread, event);
//         bits.push(' — ');
//         bits.push(
//           <small key="crashed">
//             {exc ? `(crashed with ${exc.values[0].type})` : '(crashed)'}
//           </small>
//         );
//       }
//     }

//     return bits;
//   }

// const threadSelector = (
//     <div className="pull-left btn-group">
//       <DropdownLink
//         btnGroup
//         caret
//         className="btn btn-default btn-sm"
//         title={getThreadTitle(activeThread, this.props.event, true)}
//       >
//         {threads.map((thread, idx) => {
//           return (
//             <MenuItem key={idx} noAnchor>
//               <a onClick={this.onSelectNewThread.bind(this, thread)}>
//                 {getThreadTitle(thread, this.props.event, false)}
//               </a>
//             </MenuItem>
//           );
//         })}
//       </DropdownLink>
//     </div>
//   );
