'use strict';

elFinder.prototype.commands.rmresource = function() {
  var fm = this.fm,
    umaResourceHash = 'assets_uma_resources';
  this.getstate= function(sel) {
    var sel = this.files(sel);
		sel = sel || fm.selected();
		return !this._disabled && sel.length && $.map(sel, function(h) { return h && h.phash && h.phash === umaResourceHash ? h : null }).length == sel.length
			? 0 : -1;
  };
  this.exec = function(hashes) {
    var files = this.files(hashes);
    var text = 'Do-you want to remove the resource';
    if (files.length > 1) {
      text = 'Do-you want to remove the {'+files.length+'} resources ?';
    }

    var self = this,
      files = this.files(hashes),
      reqs = [],
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', files[0].phash);
        }),
      opts = {
        title: 'Delete',
        text : [text],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'rmresource',
              msg: 'Remove resource(s)',
              cnt: 1,
              hideCnt: true
            });
            var resourceIds = [];
            files.forEach(file => resourceIds.push(file.hash.replace(umaResourceHash + '_', '')));
            fm.request({
              data: {
                cmd: 'rmresource',
                resource_ids : resourceIds
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'rmresource',
                cnt: -1
              });
              dfrd.resolve();
            }).fail(function() {
              fm.notify({
                type: 'rmresource',
                cnt: -1
              });
              fm.trigger('error', {error : 'error occured while trying to delete the resource(s)'});
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
