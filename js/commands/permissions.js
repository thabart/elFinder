'use strict';

elFinder.prototype.commands.permissions = function() {
  var fm = this.fm,
    spclass = 'elfinder-dialog-notify';
  this.shortcuts = [{
		pattern     : 'ctrl+p'
  }];
  this.tpl = {
    main     : '<div class="ui-helper-clearfix elfinder-info-title">{title}</div><table class="elfinder-info-tb">{content}</table>',
    content  : '<div class=\'elfinder-permissions-padding\'>{clients}</div><div class=\'elfinder-permissions-padding\'>{claims}</div><div class=\'elfinder-permissions-padding\'>{permissions}</div>'
  };
  this.getstate = function(sel) {
		var sel = this.files(sel);
    return !this._disabled && sel.length == 1 && sel[0].phash && !sel[0].locked  ? 0 : -1;
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
        },
        open: function() {
          $(this).find('#add-permission-'+file.hash).on('click', function() {
            // add the logic here to add permissions
          });
        }
			},
      constructRemovableTiles = function(data) {
          var content = "";
          var index = 1;
          data.forEach(d => {
            content += "<div class='elfinder-permissions-checkbox'>"+d+"<a href='#'>(Remove)</a></div>";
            if (index === 4) {
              index = 0;
              content += "</br>";
            }

            index++;
          });
          return content;
      },
      contructTiles = function(data, name, assignedName) {
        var content = "";
        var index = 1;
        data[name].forEach(d => {
          if (data[assignedName] && data[assignedName].indexOf(d) > -1) {
            content += "<div class='elfinder-permissions-checkbox'><input type='checkbox' checked/>"+d+"</div>";
          } else {
            content += "<div class='elfinder-permissions-checkbox'><input type='checkbox'/>"+d+"</div>";
          }
          if (index === 4) {
            index = 0;
            content += "</br>";
          }

          index++;
        });
        return content;
      },
      displayView = function(data) {
        var title = 'Manage <i>\'' + file.name + '\'</i> permissions ';
        var clientsView = '<label>Allowed clients</label><div>{clients}</div>';
        var claimsView = '<label>Allowed claims</label><div>{claims}</div>';
        var permissionsView = '<label>Permissions</label><div>{permissions}</div>';
        // Fill-in client information
        if (!data['clients'] || data['clients'].length === 0) {
          clientsView = clientsView.replace('{clients}', 'no client');
        }
        else {
          var clientContent = contructTiles(data, 'clients', 'assigned-clients');
          clientsView = clientsView.replace('{clients}', clientContent);
        }
        // Fill-in claims
        if (!data['claims'] || data['claims'].length === 0) {
          claimsView = claimsView.replace('{claims}', 'no claim');
        }
        else {
          var claimContent = "<div><select>{selectOptions}</select><input type='text' style='margin:0 5px 0 5px;' /><button type='button' id='add-permission-"+file.hash+"'>Add</button></div><div>{assignedPermissions}</div>";
          var selectOptions = "";
          var assignedPermissions = "";
          data['claims'].forEach(c => selectOptions += '<option>'+c+'</option>');
          if (!data['assigned-claims'] || data['assigned-claims'].length === 0) {
            assignedPermissions = "no assigned permissions";
          } else {
            assignedPermissions = constructRemovableTiles(data['assigned-claims']);
          }

          claimContent = claimContent.replace('{selectOptions}', selectOptions);
          claimContent = claimContent.replace('{assignedPermissions}', assignedPermissions);
          claimsView = claimsView.replace('{claims}', claimContent);
        }
        // Fill-in permissions
        if (!data['permissions'] || data['permissions'].length === 0) {
          permissionsView = permissionsView.replace('{permissions}', 'no permission');
        }
        else {
          var permissionContent = contructTiles(data, 'permissions', 'assigned-permissions');
          permissionsView = permissionsView.replace('{permissions}', permissionContent);
        }
        /*
        if (!data['assigned-claims'] || data['assigned-claims'].length === 0) {

        }*/
        content = content.replace('{clients}', clientsView);
        content = content.replace('{claims}', claimsView);
        content = content.replace('{permissions}', permissionsView);
        view = view.replace('{content}', content);
        view = view.replace('{title}', title);
        var dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
      },
      dialog = fm.getUI().find('#'+id);

    if (dialog.length) {
			dialog.elfinderdialog('toTop');
			return $.Deferred().resolve();
		}

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
