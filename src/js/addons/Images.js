export const getToolbarButton = (MediumEditor) => {

  const ToolbarButton = MediumEditor.extensions.button.extend({
    init: function() {
      this.button = this.document.createElement('button');
      this.button.classList.add('medium-editor-action');
      this.button.innerHTML = `<b>${this.label}</b>`;

      this.on(this.button, 'click', this.handleClick.bind(this));
    },

    getButton: function() {
      return this.button;
    },

    handleClick: function() {
      console.log(`${this.name} clicked!`);
    }
  });

  return ToolbarButton
}

export const getToolbar = (MediumEditor) => {

    const MediumEditorToolbar = MediumEditor.extensions.toolbar;

  class Toolbar extends MediumEditorToolbar {

    constructor(options) {
      super(options);

      this.name = `${options.type}Toolbar`;

      options.buttons.forEach((buttonOptions) => {
        const ToolbarButton = getToolbarButton(MediumEditor)
        const button = new ToolbarButton(Object.assign({}, {
          window: this.plugin.window,
          document: this.plugin.document,
          base: this.plugin.base
        }, buttonOptions));

        button.init();
        this.plugin.base.extensions.push(button);
      });

      this.window = options.plugin.window;
      this.document = options.plugin.document;
      this.base = options.plugin.base;

      this.init();
    }

    getElementsByClassName (parents, className) {
      const results = [];

      Array.prototype.forEach.call(parents, (editor) => {
        const elements = editor.getElementsByClassName(className);

        Array.prototype.forEach.call(elements, (element) => {
          results.push(element);
        });
      });

      return results;
    }

    createToolbar() {
      const toolbar = this.document.createElement('div');

      toolbar.id = `medium-editor-insert-${this.type}-toolbar-${this.getEditorId()}`;
      toolbar.className = 'medium-editor-toolbar';

      if (this.static) {
        toolbar.className += ' static-toolbar';
      } else if (this.relativeContainer) {
        toolbar.className += ' medium-editor-relative-toolbar';
      } else {
        toolbar.className += ' medium-editor-stalker-toolbar';
      }

      toolbar.appendChild(this.createToolbarButtons());

      // Add any forms that extensions may have
      this.forEachExtension((extension) => {
        if (extension.hasForm) {
          toolbar.appendChild(extension.getForm());
        }
      });

      this.attachEventHandlers();

      return toolbar;
    }

    createToolbarButtons() {
      const ul = this.document.createElement('ul');
      let li,
          btn,
          buttons,
          extension,
          buttonName,
          buttonOpts;

      ul.id = `medium-editor-insert-${this.type}-toolbar-actions${this.getEditorId()}`;
      ul.className = 'medium-editor-toolbar-actions';
      ul.style.display = 'block';

      this.buttons.forEach((button) => {
        if (typeof button === 'string') {
          buttonName = button;
          buttonOpts = null;
        } else {
          buttonName = button.name;
          buttonOpts = button;
        }

        // If the button already exists as an extension, it'll be returned
        // othwerise it'll create the default built-in button
        extension = this.base.addBuiltInExtension(buttonName, buttonOpts);

        if (extension && typeof extension.getButton === 'function') {
          btn = extension.getButton(this.base);
          li = this.document.createElement('li');
          if (MediumEditor.util.isElement(btn)) {
            li.appendChild(btn);
          } else {
            li.innerHTML = btn;
          }
          ul.appendChild(li);
        }
      }, this);

      buttons = ul.querySelectorAll('button');
      if (buttons.length > 0) {
        buttons[0].classList.add(this.firstButtonClass);
        buttons[buttons.length - 1].classList.add(this.lastButtonClass);
      }

      return ul;
    }

    checkState() {
      let activeElements;

      if (this.base.preventSelectionUpdates) {
        return;
      }

      // Wait for elements to be selected
      setTimeout(() => {
        activeElements = this.getElementsByClassName(this.getEditorElements(), this.activeClassName);

        // Hide toolbar when no elements are selected
        if (activeElements.length === 0) {
          return this.hideToolbar();
        }

        // Now we know there's a focused editable with a selection
        this.showAndUpdateToolbar();
      }, 10);
    }

    setToolbarPosition() {
      const container = this.getElementsByClassName(this.getEditorElements(), this.activeClassName)[0];
      let anchorPreview;

      // If there isn't a valid selection, bail
      if (!container) {
        return this;
      }

      this.showToolbar();
      this.positionStaticToolbar(container);

      anchorPreview = this.base.getExtensionByName('anchor-preview');

      if (anchorPreview && typeof anchorPreview.hidePreview === 'function') {
        anchorPreview.hidePreview();
      }
    }
  }

  return Toolbar
}

export default class Images {

  constructor(plugin, options, MediumEditor) {
    this.MediumEditor = MediumEditor
    this.options = {
      label: '<span class="fa fa-camera"></span>',
      preview: true,
      uploadUrl: 'upload.php',
      deleteUrl: 'delete.php',
      deleteMethod: 'DELETE',
      deleteData: {}
    };

    Object.assign(this.options, options);

    this._plugin = plugin;
    this._editor = this._plugin.base;
    this.elementClassName = 'medium-editor-insert-images';
    this.activeClassName = 'medium-editor-insert-image-active';
    this.label = this.options.label;

    this.initToolbar();
    this.events();
  }

  getElementsByClassName (parents, className) {
    const results = [];

    Array.prototype.forEach.call(parents, (editor) => {
      const elements = editor.getElementsByClassName(className);

      Array.prototype.forEach.call(elements, (element) => {
        results.push(element);
      });
    });

    return results;
  }

  generateRandomString (length = 15) {
    return Math.random().toString(36).substr(2, length);
  }

  getClosestWithClassName (el, className) {
    return this.MediumEditor.util.traverseUp(el, (element) => {
      return element.classList.contains(className);
    });
  }

  getElementsByTagName (parents, tagName) {
    const results = [];

    Array.prototype.forEach.call(parents, (editor) => {
      const elements = editor.getElementsByTagName(tagName);

      Array.prototype.forEach.call(elements, (element) => {
        results.push(element);
      });
    });

    return results;
  }

  events() {
    this._plugin.on(document, 'click', this.unselectImage.bind(this));
    this._plugin.on(document, 'keydown', this.removeImage.bind(this));

    this._plugin.getEditorElements().forEach((editor) => {
      this._plugin.on(editor, 'click', this.selectImage.bind(this));
    });
  }

  handleClick() {
    this._input = document.createElement('input');
    this._input.type = 'file';
    this._input.multiple = true;

    this._plugin.on(this._input, 'change', this.uploadFiles.bind(this));

    this._input.click();
  }

  initToolbar() {
    const Toolbar = getToolbar(this.MediumEditor)

    this.toolbar = new Toolbar({
      plugin: this._plugin,
      type: 'images',
      activeClassName: this.activeClassName,
      buttons: [
        {
          name: 'align-left',
          action: 'left',
          label: 'Left'
        },
        {
          name: 'align-center',
          action: 'center',
          label: 'Center'
        },
        {
          name: 'align-right',
          action: 'right',
          label: 'Right'
        }
      ]
    });

    this._editor.extensions.push(this.toolbar);
  }

  uploadFiles() {
    const paragraph = this._plugin.getCore().selectedElement;

    // Replace paragraph with div, because figure is a block element
    // and can't be nested inside paragraphs
    if (paragraph.nodeName.toLowerCase() === 'p') {
      const div = document.createElement('div');

      paragraph.parentNode.insertBefore(div, paragraph);
      this._plugin.getCore().selectElement(div);
      paragraph.remove();
    }

    Array.prototype.forEach.call(this._input.files, (file) => {
      // Generate uid for this image, so we can identify it later
      // and we can replace preview image with uploaded one
      const uid = this.generateRandomString();

      if (this.options.preview) {
	this.preview(file, uid);
      }

      this.upload(file, uid);
    });

    this._plugin.getCore().hideButtons();
  }

  preview(file, uid) {
    const reader = new FileReader();

    reader.onload = (e) => {
      this.insertImage(e.target.result, uid);
    };

    reader.readAsDataURL(file);
  }

  upload(file, uid) {
    const xhr = new XMLHttpRequest(),
	  data = new FormData();

    xhr.open("POST", this.options.uploadUrl, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const image = this._plugin.getCore().selectedElement.querySelector(`[data-uid="${uid}"]`);

        if (image) {
          this.replaceImage(image, xhr.responseText);
        } else {
          this.insertImage(xhr.responseText);
        }
      }
    };

    data.append("file", file);
    xhr.send(data);
  }

  insertImage(url, uid) {
    const el = this._plugin.getCore().selectedElement,
          figure = document.createElement('figure'),
          img = document.createElement('img');
    let domImage;

    img.alt = '';

    if (uid) {
      img.setAttribute('data-uid', uid);
    }

    // If we're dealing with a preview image,
    // we don't have to preload it before displaying
    if (url.match(/^data:/)) {
      img.src = url;
      figure.appendChild(img);
      el.appendChild(figure);
    } else {
      domImage = new Image();
      domImage.onload = () => {
        img.src = domImage.src;
        figure.appendChild(img);
        el.appendChild(figure);
      };
      domImage.src = url;
    }

    el.classList.add(this.elementClassName);

    // Return domImage so we can test this function easily
    return domImage;
  }

  replaceImage(image, url) {
    const domImage = new Image();

    domImage.onload = () => {
      image.src = domImage.src;
      image.removeAttribute('data-uid');
    };

    domImage.src = url;

    // Return domImage so we can test this function easily
    return domImage;
  }

  selectImage(e) {
    const el = e.target;

    if (el.nodeName.toLowerCase() === 'img' && this.getClosestWithClassName(el, this.elementClassName)) {
      el.classList.add(this.activeClassName);

      this._editor.selectElement(el);
    }
  }

  unselectImage(e) {
    const el = e.target;
    let clickedImage, images;

    // Unselect all selected images. If an image is clicked, unselect all except this one.
    if (el.nodeName.toLowerCase() === 'img' && el.classList.contains(this.activeClassName)) {
      clickedImage = el;
    }

    images = this.getElementsByClassName(this._plugin.getEditorElements(), this.activeClassName);
    Array.prototype.forEach.call(images, (image) => {
      if (image !== clickedImage) {
        image.classList.remove(this.activeClassName);
      }
    });
  }

  removeImage(e) {
    if ([this.MediumEditor.util.keyCode.BACKSPACE, this.MediumEditor.util.keyCode.DELETE].indexOf(e.which) > -1) {
      const images = this.getElementsByClassName(this._plugin.getEditorElements(), this.activeClassName),
            selection = window.getSelection();
      let selectedHtml;

      // Remove image even if it's not selected, but backspace/del is pressed in text
      if (selection && selection.rangeCount) {
        const range = this.MediumEditor.selection.getSelectionRange(document),
              focusedElement = this.MediumEditor.selection.getSelectedParentElement(range),
              caretPosition = this.MediumEditor.selection.getCaretOffsets(focusedElement).left;
        let sibling;

        // Is backspace pressed and caret is at the beginning of a paragraph, get previous element
        if (e.which === this.MediumEditor.util.keyCode.BACKSPACE && caretPosition === 0) {
          sibling = focusedElement.previousElementSibling;
          // Is del pressed and caret is at the end of a paragraph, get next element
        } else if (e.which === this.MediumEditor.util.keyCode.DELETE && caretPosition === focusedElement.innerText.length) {
          sibling = focusedElement.nextElementSibling;
        }

        if (sibling && sibling.classList.contains('medium-editor-insert-images')) {
          const newImages = sibling.getElementsByTagName('img');
          Array.prototype.forEach.call(newImages, (image) => {
            images.push(image);
          });
        }

        // If text is selected, find images in the selection
        selectedHtml = this.MediumEditor.selection.getSelectionHtml(document);
        if (selectedHtml) {
          const temp = document.createElement('div');
          let wrappers, newImages;
          temp.innerHTML = selectedHtml;

          wrappers = temp.getElementsByClassName('medium-editor-insert-images');
          newImages = this.getElementsByTagName(wrappers, 'img');

          Array.prototype.forEach.call(newImages, (image) => {
            images.push(image);
          });
        }
      }

      if (images.length) {
                if (!selectedHtml) {
                    e.preventDefault();
                }

                images.forEach((image) => {
                    const wrapper = this.getClosestWithClassName(image, 'medium-editor-insert-images');
                    this.deleteFile(image.src);

                    image.parentNode.remove();

                    // If wrapper has no images anymore, remove it
                    if (wrapper.childElementCount === 0) {
                        const next = wrapper.nextElementSibling,
                            prev = wrapper.previousElementSibling;

                        wrapper.remove();

                        // If there is no selection, move cursor at the beginning of next paragraph (if delete is pressed),
                        // or nove it at the end of previous paragraph (if backspace is pressed)
                        if (!selectedHtml) {
                            if (next || prev) {
                                if ((next && e.which === this.MediumEditor.util.keyCode.DELETE) || !prev) {
                                    this.MediumEditor.selection.moveCursor(document, next, 0);
                                } else {
                                    this.MediumEditor.selection.moveCursor(document, prev.lastChild, prev.lastChild.textContent.length);
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    deleteFile(image) {
        if (this.options.deleteUrl) {
            const xhr = new XMLHttpRequest(),
                data = Object.assign({}, {
                    file: image
                }, this.options.deleteData);

            xhr.open(this.options.deleteMethod, this.options.deleteUrl, true);
            xhr.send(data);
        }
    }

}
