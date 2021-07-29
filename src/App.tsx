/* eslint-disable @typescript-eslint/no-use-before-define */
import 'prosemirror-view/style/prosemirror.css'
import './styles.css'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from 'y-prosemirror'
import { schema } from 'prosemirror-schema-basic'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, Command, toggleMark } from 'prosemirror-commands'
import { MarkType } from 'prosemirror-model'
import { useProseMirror, ProseMirror } from 'use-prosemirror'
import { EditorState, Transaction } from 'prosemirror-state'

const toggleBold = toggleMarkCommand(schema.marks.strong)
const toggleItalic = toggleMarkCommand(schema.marks.em)

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('wss://demos.yjs.dev', 'cindy-room', ydoc)
const type = ydoc.getXmlFragment('prosemirror')

provider.on('status', (event: any) => {
  console.log(event.status) // logs "connected" or "disconnected"
})

const opts: Parameters<typeof useProseMirror>[0] = {
  schema,
  plugins: [
    ySyncPlugin(type),
    yCursorPlugin(provider.awareness),
    yUndoPlugin(),
    keymap({
      ...baseKeymap,
      "Mod-z": undo,
      "Mod-y": redo,
      "Mod-Shift-z": redo,
      "Mod-b": toggleBold,
      "Mod-i": toggleItalic
    })
  ]
}

export default function App() {
  const [state, setState] = useProseMirror(opts);
  return (
    <div className="App">
      <div className="ProseMirrorContainer" spellCheck="false">
        <ProseMirror
          className="ProseMirror"
          state={state}
          onChange={setState}
        />
      </div>
    </div>
  )
}

function toggleMarkCommand(mark: MarkType): Command {
  return (
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined
  ) => toggleMark(mark)(state, dispatch)
}