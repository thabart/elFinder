'use strict';

elFinder.prototype.commands.permissions = function() {
  var fm = this.fm,
    spclass = 'elfinder-dialog-notify';
  this.tpl = {
    main       : '<div class="ui-helper-clearfix elfinder-info-title">{title}</div><table class="elfinder-info-tb">{content}</table>',
    content  : '<div>{clients}</div><div>{claims}</div>'
  };
  this.getstate = function(sel) {
    var f;
    if (!this._disabled && sel.length === 1) {
      f = fm.file(sel[0]);
    }

    return (f) ? 0 : -1;
  };
  this.exec = function(hashes) {
    var file   = this.files(hashes)[0],
      id = fm.namespace+'-permissions-'+file.hash,
      view = this.tpl.main,
      reqs = [],
      content = this.tpl.content,
      opts    = {
        title : 'Permissions',
				width : 'auto',
        close: function() {
          $(this).elfinderdialog('destroy');
          $.each(reqs, function(i, req) {
            var xhr = (req && req.xhr)? req.xhr : null;
            if (xhr && xhr.state() == 'pending') {
              xhr.quiet = true;
              xhr.abort();
            }
          });
        }
			},
      displayView = function(data) {
        var title = 'Manage <i>\'' + file.name + '\'</i> permissions ';
        var clientsView = '<div class=\'elfinder-permissions-clients\'><label>Allowed clients</label><div>{clients}</div></div>';
        var claimsView = '<label>Allowed claims</label><div>{claims}</div>';
        // Fill-in client information
        if (!data['clients'] || data['clients'].length === 0) {
          clientsView = clientsView.replace('{clients}', 'no client');
        } else {
          var clientContent = "";
          var index = 1;
          data['clients'].forEach(c => {
            if (data['assigned-clients'] && data['assigned-clients'].indexOf(c) > -1) {
              clientContent += "<div class='elfinder-permissions-clientile'><input type='checkbox' checked/>"+c+"</div>";
            } else {
              clientContent += "<div class='elfinder-permissions-clientile'><input type='checkbox'/>"+c+"</div>";
            }
            if (index === 4) {
              index = 0;
              clientContent += "</br>";
            }

            index++;
          });
          clientsView = clientsView.replace('{clients}', clientContent);
        }
        /*
        if (!data['assigned-claims'] || data['assigned-claims'].length === 0) {

        }*/
        content = content.replace('{clients}', clientsView);
        content = content.replace('{claims}', claimsView);
        view = view.replace('{content}', content);
        view = view.replace('{title}', title);
        var dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
      };

    // display loading spinner
    fm.notify({
      type: 'permissions',
      msg: 'Get permissions',
      cnt: 1,
      hideCnt: true
    });

    // retrieve permissions
    reqs.push(fm.request({
      data: { cmd: 'perms', target: file.hash },
      preventDefault: true
    }).done(function(data) {
      displayView(data);
      fm.notify({
        type: 'permissions',
        cnt: -1
      });
    }));
    //
    // var dialog = fm.getUI().find('#'+id);
    // console.log(dialog);
    //  dialog.elfinderdialog('toTop');
    // if (dialog.length) {
    //	return $.Deferred().resolve();
    // }
  }
}
