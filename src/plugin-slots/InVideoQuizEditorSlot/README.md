# InVideoQuizEditorSlot

### Slot ID: `org.openedx.frontend.authoring.in_video_quiz_editor.v1`

### Slot ID Aliases
* `in_video_quiz_editor_slot`

### Plugin Props:

* `onClose` - Function. Closes the editor.
* `returnFunction` - Function. Optional override for where to navigate after a successful save.
* `blockFinished` - Boolean. Whether the XBlock fetch request has completed.
* `blockId` - String. The XBlock usage id being edited.
* `blockValue` - Object. The raw XBlock field data.
* `selectedVideo` - String. Id of the currently selected video component in the unit.
* `videos` - Array. Video components available in the current unit.
* `problems` - Array. Problem components available in the current unit.
* `quizItems` - Array. The in-progress list of `{ problemId, time, jumpBack }` entries being edited.
* `unitContentLoaded` - Boolean. Whether the unit's video/problem components have finished loading.
* `isDirty` - Boolean. Whether there are unsaved changes.
* `saveError` - String or null. The current save-validation error message, if any.
* `setSelectedVideo` - Function. Redux action: sets the selected video by id.
* `addQuizItem` - Function. Redux action: appends a new empty `{ problemId, time, jumpBack }` row.
* `removeQuizItem` - Function. Redux action: removes a row by `{ index }`.
* `updateProblemId` - Function. Redux action: sets a row's `problemId` by `{ index, problemId }`.
* `updateTime` - Function. Redux action: sets a row's `time` by `{ index, time }`.
* `updateJumpBack` - Function. Redux action: sets a row's `jumpBack` by `{ index, jumpBack }`.
* `onSave` - Function. Validates `quizItems` and, if valid, saves via the `saveInVideoQuizSettings` thunk and navigates away.
* `getContent` - Function. Returns the `{ selectedVideo, quizItems }` payload to persist to the XBlock.

## Description

The slot is positioned in the InVideoQuiz XBlock editor, opened from a Unit page when adding or editing an
"In-Video Quiz" component. It is suitable for replacing the entire editor UI (video selection, quiz item list,
timestamp validation, and the save/close chrome).

By default, the slot contains the existing In-Video Quiz editor: a video dropdown, a list of
problem/time/jump-back rows with inline validation, and an "Add problem" button.

Moving this editor behind a slot allows it (like the Games editor) to be maintained entirely in an external
plugin package (e.g. `@edx/frontend-plugin-in-video-quiz`) instead of inside this MFE's fork, reducing merge
conflicts on upstream syncs.

## Example

The following example configuration fully replaces the default editor with a plugin-provided one.

```js
import { DIRECT_PLUGIN, PLUGIN_OPERATIONS } from '@openedx/frontend-plugin-framework';
import { InVideoQuizEditor } from '@edx/frontend-plugin-in-video-quiz';

const config = {
  pluginSlots: {
    'org.openedx.frontend.authoring.in_video_quiz_editor.v1': {
      keepDefault: false,
      plugins: [
        {
          op: PLUGIN_OPERATIONS.Insert,
          widget: {
            id: 'in_video_quiz_editor_widget',
            priority: 1,
            type: DIRECT_PLUGIN,
            RenderWidget: InVideoQuizEditor,
          },
        },
      ],
    },
  },
};

export default config;
```
