'use strict';

elFinder.prototype.commands.rmpolicy = function() {
  var fm = this.fm,
    umaResourceHash = 'assets_uma_resources';
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash === umaResourceHash ? 0 : -1;
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
        title: 'Resource',
        text : ['Do-you want to remove the resource ?'],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'rmresource',
              msg: 'Remove resource',
              cnt: 1,
              hideCnt: true
            });
            var resourceId = file.hash.replace(umaResourceHash + '_', '');
            fm.request({
              data: {
                cmd: 'rmresource',
                resource_id : resourceId
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
