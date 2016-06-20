'use strict';

elFinder.prototype.commands.rmpolicy = function() {
  var fm = this.fm,
    authPoliciesHash = 'assets_uma_authorization_policies';
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash === authPoliciesHash ? 0 : -1;
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
        title: 'Authorization policy',
        text : ['Do-you want to remove the authorization policy ?'],
        accept: {
          label: 'btnYes',
          callback: function() {
            fm.notify({
              type: 'rmpolicy',
              msg: 'Remove authorization policy',
              cnt: 1,
              hideCnt: true
            });
            var authPolicyId = file.hash.replace(authPoliciesHash + '_', '');
            fm.request({
              data: {
                cmd: 'rmpolicy',
                policy_id : authPolicyId
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'rmpolicy',
                cnt: -1
              });
              dfrd.resolve();
            }).fail(function() {
              fm.notify({
                type: 'rmpolicy',
                cnt: -1
              });
              fm.trigger('error', {error : 'error occured while trying to delete the authorization policy'});
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
