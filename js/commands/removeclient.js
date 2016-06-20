'use strict';

elFinder.prototype.commands.removeclient = function() {
  var fm = this.fm,
    clientsHash = 'assets_openid_clients';
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash === clientsHash ? 0 : -1;
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
        title: 'Client',
        text : ['Do-you want to remove the client ?'],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'removeclient',
              msg: 'Remove client',
              cnt: 1,
              hideCnt: true
            });
            var clientId = file.hash.replace(clientsHash + '_', '');
            fm.request({
              data: {
                cmd: 'rmclient',
                client_id : clientId
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'removeclient',
                cnt: -1
              });
              dfrd.resolve();
            }).fail(function() {
              fm.notify({
                type: 'removeclient',
                cnt: -1
              });
              fm.trigger('error', {error : 'error occured while trying to delete the client'});
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
