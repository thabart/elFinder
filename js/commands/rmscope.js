'use strict';

elFinder.prototype.commands.rmpolicy = function() {
  var fm = this.fm,
    scopesHash = 'assets_openid_scopes';
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash === scopesHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var self = this,
      file = this.files(hashes)[0],
      reqs = [],
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.phash);
        }),
      opts = {
        title: 'Scope',
        text : ['Do-you want to remove the scope ?'],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'rmscope',
              msg: 'Remove resource',
              cnt: 1,
              hideCnt: true
            });
            var scope = file.hash.replace(scopesHash + '_', '');
            fm.request({
              data: {
                cmd: 'rmscope',
                scope : scope
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
              fm.trigger('error', {error : 'error occured while trying to delete the resource'});
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
