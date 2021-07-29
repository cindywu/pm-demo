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
const provider = new WebsocketProvider('ws://pm-demo.vercel.app', 'cindy-room', ydoc)
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
      <div className="Menu">
        <Button
          className="bold"
          isActive={isBold(state)}
          onClick={() => toggleBold(state, (tr) => setState(state.apply(tr)))}
        >
          B
        </Button>
        <Button
          className="italic"
          isActive={isItalic(state)}
          onClick={() => toggleItalic(state, (tr) => setState(state.apply(tr)))}
        >
          I
        </Button>
      </div>
      <div className="ProseMirrorContainer">
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

function isBold(state: EditorState): boolean {
  return isMarkActive(state, schema.marks.strong)
}

function isItalic(state: EditorState): boolean {
  return isMarkActive(state, schema.marks.em)
}

// https://github.com/ProseMirror/prosemirror-example-setup/blob/afbc42a68803a57af3f29dd93c3c522c30ea3ed6/src/menu.js#L57-L61
function isMarkActive(state: EditorState, mark: MarkType): boolean {
  const { from, $from, to, empty } = state.selection;
  return empty
    ? !!mark.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, mark)
}

function Button(props: {
  children: React.ReactNode
  isActive: boolean
  className: string
  onClick: () => void
}) {
  return (
    <button
      className={props.className}
      style={{
        backgroundColor: props.isActive ? "#efeeef" : "#fff",
        color: props.isActive ? "blue" : "black"
      }}
      onMouseDown={handleMouseDown}
    >
      {props.children}
    </button>
  )

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault() // Prevent editor losing focus
    props.onClick()
  }
}
