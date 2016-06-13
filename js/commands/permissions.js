'use strict';

elFinder.prototype.commands.permissions = function() {
  var fm = this.fm,
    spclass = 'elfinder-dialog-notify';
  this.shortcuts = [{
		pattern     : 'ctrl+p'
  }];
  this.tpl = {
    main     : '<div class="ui-helper-clearfix elfinder-info-title">{title}</div><table class="elfinder-info-tb">{content}</table>',
    content  : '<div class=\'elfinder-permissions-padding\'>{clients}</div><div class=\'elfinder-permissions-padding\'>{claims}</div><div class=\'elfinder-permissions-padding\'>{permissions}</div><button class=\'save-permission\'>Save</button>'
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
          var self = this;
          $(self).find('#claim-value-'+file.hash).keydown(function(e) {
  					e.stopImmediatePropagation();
          });
          $(self).find('.save-permission').on('click', function() {
            var getSelectedValues = function(checkboxes) {
              var result = [];
              checkboxes.each(function() {
                result.push($(this).next().html());
              });

              return result;
            };
            var clients = $(self).find('.allowed-clients input[type=\'checkbox\']:checked');
            var permissions = $(self).find('.assigned-permissions input[type=\'checkbox\']:checked');
            var claims = $(self).find('.assigned-claims .elfinder-permissions-checkbox').children('label');
            var assignedClientIds = getSelectedValues(clients),
              assignedPermissions = getSelectedValues(permissions),
              assignedClaims = [];

            claims.each(function() {
              var concatenatedClaim = $(this).html();
              assignedClaims.push({
                type: concatenatedClaim.slice(0, concatenatedClaim.indexOf(':')),
                value: concatenatedClaim.slice(concatenatedClaim.indexOf(':') + 1, concatenatedClaim.length)
              });
            });
            // Ex
            reqs.push(fm.request({
              data: { cmd: 'mkperm',
                target: file.hash,
                clients: assignedClientIds,
                permissions: assignedPermissions,
                claims: assignedClaims
              },
              preventDefault: true
            }).done(function(data) {

            }));
          });
          $(self).find('#add-permission-'+file.hash).on('click', function() {
            var claimType = $('#claim-type-'+file.hash).val(),
              claimValue = $('#claim-value-'+file.hash).val();
            addClaim({
              type: claimType,
              value: claimValue
            });
          });
          refreshEventHandler();
        }
			},
      constructRemovableTiles = function(data) {
          var content = "";
          data.forEach(d => {
            content += "<div class='elfinder-permissions-checkbox can-be-removed'><label>"+d.type+":"+d.value+"</label><a href='#'>(Remove)</a></div>";
          });
          return content;
      },
      contructTiles = function(data, name, assignedName) {
        var content = "";
        var index = 1;
        data[name].forEach(d => {
          if (data[assignedName] && data[assignedName].indexOf(d) > -1) {
            content += "<div class='elfinder-permissions-checkbox'><input type='checkbox' checked/><label>"+d+"</label></div>";
          } else {
            content += "<div class='elfinder-permissions-checkbox'><input type='checkbox'/><label>"+d+"</label></div>";
          }
          if (index === 4) {
            index = 0;
            content += "</br>";
          }

          index++;
        });
        return content;
      },
      addClaim = function(claim) {
        if ($("#assigned-claims-"+file.hash).children().length === 0) {
          $("#assigned-claims-"+file.hash).html('');
        }

        var child = constructRemovableTiles([claim]);
        $("#assigned-claims-"+file.hash).append(child);
        refreshEventHandler();
      },
      refreshEventHandler = function() {
        $('.can-be-removed').on('click', function(e) {
          e.preventDefault();
          var currentTarget = e.currentTarget;
          if ($(currentTarget).parent().children().length === 1) {
            $(currentTarget).parent().html('no assigned claims');
          } else {
            $(currentTarget).remove();
          }
        });
      },
      displayView = function(data) {
        var title = 'Manage <i>\'' + file.name + '\'</i> permissions ';
        var clientsView = '<label>Allowed clients</label><div class=\'allowed-clients\'>{clients}</div>';
        var claimsView = '<label>Allowed claims</label><div>{claims}</div><div id="assigned-claims-'+file.hash+'" class=\'assigned-claims\'>{assignedClaims}</div>';
        var permissionsView = '<label>Permissions</label><div class=\'assigned-permissions\'>{permissions}</div>';
        // Fill-in client information
        if (!data['clients'] || data['clients'].length === 0) {
          clientsView = clientsView.replace('{clients}', 'no client');
        }
        else {
          var clientContent = contructTiles(data, 'clients', 'assigned-clients');
          clientsView = clientsView.replace('{clients}', clientContent);
        }
        // Fill-in claims
        var lstClaims = "";
        if (!data['claims'] || data['claims'].length === 0) {
          lstClaims = 'no claim';
        }
        else {
          var claimContent = "<select id='claim-type-"+file.hash+"'>{selectOptions}</select><input type='text' style='margin:0 5px 0 5px;' id='claim-value-"+file.hash+"' /><button type='button' id='add-permission-"+file.hash+"'>Add</button>";
          var selectOptions = "";
          data['claims'].forEach(c => selectOptions += '<option value=\''+c+'\'>'+c+'</option>');
          claimContent = claimContent.replace('{selectOptions}', selectOptions);
          lstClaims = claimContent;
        }
        claimsView = claimsView.replace('{claims}', lstClaims);
        // Fill-in assigned claims
        var lstAssignedClaims = "";
        if (!data['assigned-claims'] || data['assigned-claims'].length === 0) {
          lstAssignedClaims = "no assigned claims";
        } else {
          lstAssignedClaims = constructRemovableTiles(data['assigned-claims']);
        }
        claimsView = claimsView.replace('{assignedClaims}', lstAssignedClaims);
        // Fill-in permissions
        if (!data['permissions'] || data['permissions'].length === 0) {
          permissionsView = permissionsView.replace('{permissions}', 'no permission');
        }
        else {
          var permissionContent = contructTiles(data, 'permissions', 'assigned-permissions');
          permissionsView = permissionsView.replace('{permissions}', permissionContent);
        }
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
