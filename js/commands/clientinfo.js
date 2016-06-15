'use strict';

elFinder.prototype.commands.clientinfo = function() {
  var fm = this.fm,
    clientsHash = 'assets_openid_clients';
  this.shortcuts = [{
		pattern     : 'f9'
  }];
  this.getstate = function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash && sel[0].phash === clientsHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-clientinfo-'+file.hash,
      reqs = [],
      dialog = fm.getUI().find('#'+id),
      opts = {
        title : 'Client Information',
        width: 'auto',
        close: function() {
        },
        open: function() {
        }
      },
      displayClientInfo = function(data) {
        dialog = fm.dialog("", opts);
      };

    if (this.getstate([file.hash]) < 0) {
      return;
    }

    if (dialog.length) {
			dialog.elfinderdialog('toTop');
      return;
		}

    // display loading spinner
    fm.notify({
      type: 'clientinformation',
      msg: 'Get client information',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'clientinfo',
      target: file.hash.replace(clientsHash + '_','')
    }).done(function(data) {
      displayClientInfo(data);
      fm.notify({
        type: 'clientinformation',
        cnt: -1
      });
    }));
  }
}
