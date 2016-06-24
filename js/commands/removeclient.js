'use strict';

elFinder.prototype.commands.removeclient = function() {
  var fm = this.fm,
    clientsHash = 'assets_openid_clients';
  this.getstate= function(sel) {
    var sel = this.files(sel);
		sel = sel || fm.selected();
		return !this._disabled && sel.length && $.map(sel, function(h) { return h && h.phash && h.phash === clientsHash ? h : null }).length == sel.length
			? 0 : -1;
  };
  this.exec = function(hashes) {
    var files = this.files(hashes);
    var text = 'Do-you want to remove the client';
    if (files.length > 1) {
      text = 'Do-you want to remove the {'+files.length+'} clients ?';
    }

    var self = this,
      reqs = [],
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', files[0].phash);
        }),
      opts = {
        title: 'Remove',
        text : [ text ],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'removeclient',
              msg: 'Remove client(s)',
              cnt: 1,
              hideCnt: true
            });
            var clientIds = [];
            files.forEach(file => clientIds.push(file.hash.replace(clientsHash + '_', '')));
            fm.request({
              data: {
                cmd: 'rmclient',
                client_ids : clientIds
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
              fm.trigger('error', {error : 'error occured while trying to delete the client(s)'});
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
