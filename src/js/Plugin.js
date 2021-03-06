import Core from './Core';

export const get = (MediumEditor) => {

  const MediumEditorInsert = MediumEditor.Extension.extend({
    name: 'insert',

    addons: {
      images: true,
      embeds: true
    },

    _initializedAddons: {},

    init: function() {
      MediumEditor.Extension.prototype.init.apply(this, arguments);

      this.core = new Core(this, MediumEditor);
    },

    destroy: function() {
      this.core.removeButtons();
    },

    getCore: function() {
      return this.core;
    },

    getAddons: function () {
      return this._initializedAddons;
    },

    getAddon: function(name) {
      return this._initializedAddons[name];
    }
  });

  return MediumEditorInsert
}
