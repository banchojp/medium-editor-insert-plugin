# Insert extension for MediumEditor modified for use with Vue2

Vanilla ES2015 (transpiled with Babel) extension for MediumEditor. Extend your favorite editor with images and embeded videos and social media.

No dependencies! Jiiihaaa :tada:

## Usage

```html
import 'medium-editor-insert-plugin-for-vue2/dist/css/medium-editor-insert.css'

<script>
  data () {
    const MediumEditorInsert = require('medium-editor-insert-plugin-for-vue2/dist/js/medium-editor-insert.js').get(
      editor.MediumEditor
    )
    return {
      content: '',
      options: {
...
        extensions: {
          insert: new MediumEditorInsert()
        }
```
