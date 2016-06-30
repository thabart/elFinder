'use strict';

elFinder.prototype.commands.rmuser = function() {
    var fm = this.fm,
      resourceOwnersHash = 'assets_resourceowners';
    this.getstate= function(sel) {
      var sel = this.files(sel);
      sel = sel || fm.selected();
      return !this._disabled && sel.length && $.map(sel, function(h) { return h && h.phash && h.phash === resourceOwnersHash ? h : null }).length == sel.length
        ? 0 : -1;
    };
    this.exec = function(hashes) {
      var files = this.files(hashes);
      var text = 'Do-you want to remove the resource owner';
      if (files.length > 1) {
        text = 'Do-you want to remove the {'+files.length+'} resource owners ?';
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
                type: 'rmuser',
                msg: 'Remove resource owner (s)',
                cnt: 1,
                hideCnt: true
              });
              var resourceOwners = [];
              files.forEach(file => resourceOwners.push(file.hash.replace(resourceOwnersHash + '_', '')));
              fm.request({
                data: {
                  cmd: 'rmro',
                  ros : resourceOwners
                },
                preventDefault: true
              }).done(function() {
                fm.notify({
                  type: 'rmuser',
                  cnt: -1
                });
                dfrd.resolve();
              }).fail(function() {
                fm.notify({
                  type: 'rmuser',
                  cnt: -1
                });
                fm.trigger('error', {error : 'error occured while trying to delete the resource owner(s)'});
              });
            }
          },
          cancel: {
            label: 'btnCancel',
            callback: function() { }
          }
        }

      fm.confirm(opts);
    };
};
