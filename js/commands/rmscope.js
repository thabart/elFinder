'use strict';

elFinder.prototype.commands.rmscope = function() {
  var fm = this.fm,
    scopesHash = 'assets_openid_scopes';
  this.getstate= function(sel) {
    var sel = this.files(sel);
		sel = sel || fm.selected();
		return !this._disabled && sel.length && $.map(sel, function(h) { return h && h.phash && h.phash === scopesHash ? h : null }).length == sel.length
			? 0 : -1;
  };
  this.exec = function(hashes) {
    var files = this.files(hashes);
    var text = 'Do-you want to remove the scope';
    if (files.length > 1) {
      text = 'Do-you want to remove the {'+files.length+'} scopes ?';
    }

    var self = this,
      file = this.files(hashes)[0],
      reqs = [],
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', files[0].phash);
        }),
      opts = {
        title: 'Remove',
        text : [text],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'rmscope',
              msg: 'Remove resource(s)',
              cnt: 1,
              hideCnt: true
            });
            var scopes = [];
            files.forEach(file => scopes.push(file.hash.replace(scopesHash + '_', '')));
            fm.request({
              data: {
                cmd: 'rmscope',
                scopes : scopes
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'rmscope',
                cnt: -1
              });
              dfrd.resolve();
            }).fail(function() {
              fm.notify({
                type: 'rmscope',
                cnt: -1
              });
              fm.trigger('error', {error : 'error occured while trying to delete the scope(s)'});
            });
          }
        },
        cancel: {
          label: 'btnCancel',
          callback: function() { }
        }
      }
    fm.confirm(opts);
  }
};
