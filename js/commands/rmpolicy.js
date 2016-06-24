'use strict';

elFinder.prototype.commands.rmpolicy = function() {
  var fm = this.fm,
    authPoliciesHash = 'assets_uma_authorization_policies';
  this.getstate= function(sel) {
    var sel = this.files(sel);
		sel = sel || fm.selected();
		return !this._disabled && sel.length && $.map(sel, function(h) { return h && h.phash && h.phash === authPoliciesHash ? h : null }).length == sel.length
			? 0 : -1;
  };
  this.exec = function(hashes) {
    var files = this.files(hashes);
    var text = 'Do-you want to remove the authorization policy';
    if (files.length > 1) {
      text = 'Do-you want to remove the {'+files.length+'} authorization policies ?';
    }

    var self = this,
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
              type: 'rmpolicy',
              msg: 'Remove authorization policy(ies)',
              cnt: 1,
              hideCnt: true
            });
            var authPolicyIds = [];
            files.forEach(file => authPolicyIds.push(file.hash.replace(authPoliciesHash + '_', '')));
            fm.request({
              data: {
                cmd: 'rmpolicy',
                policy_ids : authPolicyIds
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
              fm.trigger('error', {error : 'error occured while trying to delete the authorization policy(ies)'});
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
