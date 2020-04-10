# Insert extension for MediumEditor

Vanilla ES2015 (transpiled with Babel) extension for MediumEditor. Extend your favorite editor with images and embeded videos and social media.

No dependencies! Jiiihaaa :tada:

## Usage

```html
<link href="dist/css/medium-editor-insert.css" rel="stylesheet">

<script src="dist/js/medium-editor-insert.js"></script>

<script>
    var editor = new MediumEditor('.editable', {
        extensions: {
            'insert': new MediumEditorInsert()
        }
    });
</script>
```

## Development

- `npm run build`: Builds everything
- `npm run css`: Builds CSS
- `npm run watch`: Watches for changes in JS and SASS
- `npm test`: Runs ESLint and Karma

## Rebuild

using node@10.19.0
npm install rimraf
npm install node-sass
npm install webpack
npm install babel-loader
npm install babel-core
npm install add-module-exports
npm install babel-plugin-add-module-exports
npm install babel-preset-es2015
