'use strict';

elFinder.prototype.commands.permissions = function() {
  var fm = this.fm,
    spclass = 'elfinder-dialog-notify',
    clientsKey = 'openidclients';
  this.shortcuts = [{
		pattern     : 'ctrl+p'
  }];
  this.tpl = {
    main     : '<div class="ui-helper-clearfix elfinder-info-title">{title}</div>{content}',
    content  : '<table style="padding-top:5px;">'+
      '<tr><td style="vertical-align:top; width:90px;"><b>Rules</b><div class="permission-menu">{items}</div></td><td style="vertical-align:top;"><div class="permission-details">{details}</div></td></tr>'+
      '<tr><td colspan="2"><button class=\'add-rule\' >Add rule</button><button class="remove-rule">Remove rule</button><button class="save">Save</button></td></tr></table>',
    edit: '<div class="permission-rule"><div class=\'elfinder-permissions-padding\'>{clients}</div><div class=\'elfinder-permissions-padding\'>{claims}</div><div class=\'elfinder-permissions-padding\'>{permissions}</div></div>'
  };
  this.getstate = function(sel) {
		var sel = this.files(sel);
    return !this._disabled && sel.length == 1 && sel[0].phash && !sel[0].locked  ? 0 : -1;
  };
  this.exec = function(hashes) {
    var file   = this.files(hashes)[0],
      information = null,
      id = fm.namespace+'-permissions-'+file.hash,
      view = this.tpl.main,
      content = this.tpl.content,
      edit = this.tpl.edit,
      reqs = [],
			incwd    = (fm.cwd().hash == file.hash),
      activeElement = {},
			dfrd     = $.Deferred()
        .done(function(data){
          fm.exec('reload', data.added[0].hash);
        }),
      opts    = {
        title : 'Permissions',
				width : 'auto',
        height: '450',
        close: function() {
          fm.unlockfiles({files : [file.hash]})
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
          fm.lockfiles({files : [file.hash]});
          // 0. Add the other tabs
          if(information.authrules) {
            information.authrules.forEach(function(rule) {
              addRule(self, rule);
            });
          }
          // 1 Enable the "new" element
          setFocus(0, self);
          // 2. Refresh menu items event handlers
          refreshEvtHandlers(self);
          // 3. Remove the selected rule
          $(self).find('.remove-rule').on('click', function() {
            removeRule(self);
          });
          // 4. Add a new rule
          $(self).find('.add-rule').on('click', function() {
            var rule = getPermissionRule(activeElement.detail);
            addRule(self, rule);
          });
          // 5. Save the authorization rule
          $(self).find('.save').on('click', function() {
            var rules = [];
            $(self).find('.permission-rule').each(function(i) {
              if (i > 0) {
                rules.push(getPermissionRule($(this)));
              }
            });

            fm.notify({
              type: 'addpermissions',
              msg: 'Add permissions',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: {
                cmd: 'mkperm',
                target: file.hash,
                rules: rules
              },
              preventDefault: true
            }).done(function(data) {
              fm.notify({
                type: 'addpermissions',
                cnt: -1
              });
              dfrd.resolve(data);
              $(self).elfinderdialog('close');
            }).fail(function() {
              fm.trigger('error', {error : 'the permission cannot be saved'});
              fm.notify({
                type: 'addpermissions',
                cnt: -1
              });
            }));
          });
        }
			},
      /**
      * Get permission rules
      * @param {details}
      */
      getPermissionRule = function(detail) {
        var getSelectedValues = function(checkboxes) {
          var result = [];
          checkboxes.each(function() {
            result.push($(this).next().html());
          });

          return result;
        };
        var getSelectedClients = function(checkboxes) {
          var result = [];
          checkboxes.each(function() {
            result.push($(this).data('id'));
          });

          return result;
        };
        var clients = detail.find('.allowed-clients input[type=\'checkbox\']:checked');
        var permissions = detail.find('.assigned-permissions input[type=\'checkbox\']:checked');
        var claims = detail.find('.assigned-claims .elfinder-white-box').children('label');
        var id = detail.find('input[type=\'hidden\']').val();
        var assignedClientIds = getSelectedClients(clients),
          assignedPermissions = getSelectedValues(permissions),
          assignedClaims = [];
        claims.each(function() {
          var concatenatedClaim = $(this).html();
          assignedClaims.push({
            type: concatenatedClaim.slice(0, concatenatedClaim.indexOf(':')),
            value: concatenatedClaim.slice(concatenatedClaim.indexOf(':') + 1, concatenatedClaim.length)
          });
        });
        var result = {
          scopes: assignedPermissions,
          claims: assignedClaims
        };
        result[clientsKey] = assignedClientIds;
        if (id) {
          result.id = id;
        }

        return result;
      },
      /**
      * Get removable claims
      * @param {data}
      */
      getRemovableClaims = function(claims) {
          var content = "";
          claims.forEach(claim => {
            content += "<div class='elfinder-white-box can-be-removed'><label>"+claim.type+":"+claim.value+"</label><a href='#' data-type='"+claim.type+"' data-value='"+claim.value+"'>(Remove)</a></div>";
          });
          return content;
      },
      /**
      * Construct tiles
      * @param {data}
      * @param {name}
      * @param {assigned}
      *
      */
      contructTiles = function(data, name, assigned) {
        var content = "";
        data[name].forEach(d => {
          if (assigned && assigned.indexOf(d) > -1) {
            content += "<div class='elfinder-white-box'><input type='checkbox' checked/><label>"+d+"</label></div>";
          } else {
            content += "<div class='elfinder-white-box'><input type='checkbox'/><label>"+d+"</label></div>";
          }
        });
        return content;
      },
      /**
      * Remove current permission rule
      * @param {elt}
      */
      removeRule = function(elt) {
        activeElement.item.remove();
        activeElement.detail.remove();
        setFocus(0, elt);
      },
      /**
      * Add permission rule
      * @param {elt}
      * @param {permissionRule}
      */
      addRule = function(elt, permissionRule) {
        var menu = $(elt).find('.permission-menu');
        var details = $(elt).find('.permission-details');
        var index = menu.children().length;
        // 1. Add menu item
        menu.append('<div class="permission-menu-item"><a href="#" data-rule="new">Rule '+index+'</a></div>');
        // 2. Add content
        var content = getRuleView(permissionRule);
        details.append(content);
        // 3. Enable element
        var item = enableElement(elt, index).item;
        // 4. Set the focus
        setFocus(index, elt);
        // 5. Refresh the event handler
        refreshCurrentRuleEventHandlers(elt);
        refreshEvtHandlers(elt);
      },
      /**
      * Set focus to the element
      * @param {index}
      * @param {elt}
      */
      setFocus = function(index, elt) {
        // 1. Enable the element
        var detail = enableElement(elt, index).detail;
        // 2. Hide the button "add rule" & if needed reset the fields
        if (index > 0) {
          $(elt).find('.add-rule').hide();
          $(elt).find('.remove-rule').show();
        } else {
          $(elt).find('.add-rule').show();
          $(elt).find('.remove-rule').hide();
          resetDetails(index, elt);
        }
      },
      /**
      * Reset details
      * @param {index}
      * @param {elt}
      */
      resetDetails = function(index, elt) {
        activeElement.detail.replaceWith(getRuleView({}));
        enableElement(elt, index);
        refreshCurrentRuleEventHandlers();
      },
      /**
      * Refresh menu item event handlers
      * @param {elt}
      */
      refreshEvtHandlers = function(elt) {
        $(elt).find('.permission-menu .permission-menu-item').on('click', function() {
            var index = $(this).index();
            setFocus(index, elt);
        });
      },
      /**
      * Refresh evt handlers of current rule
      */
      refreshCurrentRuleEventHandlers = function() {
        activeElement.detail.find('.claim-value').off('click');
        activeElement.detail.find('.add-claim').off('click');
        activeElement.detail.find('.claim-value').keydown(function(e) {
          e.stopImmediatePropagation();
        });
        activeElement.detail.find('.add-claim').on('click', function() {
          var claimType = activeElement.detail.find('.claim-type').val(),
            claimValue = activeElement.detail.find('.claim-value').val();
          if (activeElement.detail.find('.assigned-claims').children().length === 0) {
              activeElement.detail.find('.assigned-claims').html('');
          }

          activeElement.detail.find('.claim-type option:selected').remove();
          activeElement.detail.find('.claim-value').val('');
          var child = getRemovableClaims([{
            type: claimType,
            value: claimValue
          }]);
          activeElement.detail.find('.assigned-claims').append(child);
          refreshRemovableClaimsEvtHandlers();
        });
        refreshRemovableClaimsEvtHandlers();
      },
      /**
      * Refresh removable claims evt handlers
      */
      refreshRemovableClaimsEvtHandlers = function() {
        activeElement.detail.find('.can-be-removed a').off('click');
        activeElement.detail.find('.can-be-removed a').on('click', function(e) {
          e.preventDefault();
          var currentTarget = e.currentTarget;
          var claimValue = $(currentTarget).data('value');
          var claimType = $(currentTarget).data('type');
          var canBeRemovedBox = $(currentTarget).closest('.can-be-removed');
          if (canBeRemovedBox.parent().children().length === 1) {
            canBeRemovedBox.parent().html('no assigned claims');
          } else {
            canBeRemovedBox.remove();
          }

          var claimTypeElt = activeElement.detail.find('.claim-type');
          claimTypeElt.append("<option value='"+claimType+"'>"+claimType+"</option>");
          var newOptions = claimTypeElt.find('option').clone();
          newOptions.sort(function(a, b) {
              if (a.value > b.value) {
                return 1;
              }

              if (a.value < b.value) {
                return -1;
              }

              return 0;
          });

          claimTypeElt.empty();
          claimTypeElt.append(newOptions);
          claimTypeElt.val(claimType);
          activeElement.detail.find('.claim-value').val(claimValue);
        });
      },
      /**
      * Enable an element at the specified index
      * @param {elt}
      * @param {index}
      * @return return the element
      */
      enableElement = function(elt, index) {
        // 1. Remove all active classes
        $(elt).find('.permission-details .permission-rule').removeClass('permission-active');
        $(elt).find('.permission-menu .permission-menu-item').removeClass('permission-item-active');
        // 2. Enable element
        var result = {
          detail : $($(elt).find('.permission-details .permission-rule').get(index)),
          item: $($(elt).find('.permission-menu .permission-menu-item').get(index))
        };
        result.detail.addClass('permission-active');
        result.item.addClass('permission-item-active');
        activeElement = result;
        return result;
      },
      /**
      * Get authorization rule view
      * @param {permissionRule}
      */
      getRuleView = function(permissionRule) {
        var result = edit;
        var clientsView = '<label>Allowed clients</label><div class=\'allowed-clients\'>{clients}</div>';
        var claimsView = '<label>Allowed claims</label><div>{claims}</div><div class="assigned-claims">{assignedClaims}</div>';
        var permissionsView = '<label>Permissions</label><div class=\'assigned-permissions\'>{permissions}</div>';
        if (permissionRule.id) {
          clientsView += '<input type="hidden" name="id" value="'+permissionRule.id+'"/>';
        }

        // Fill-in client information
        if (!information[clientsKey] || information[clientsKey].length === 0) {
          clientsView = clientsView.replace('{clients}', 'no client');
        }
        else {
          var clientContent = "";
          information[clientsKey].forEach(d => {
            if (permissionRule[clientsKey] && permissionRule[clientsKey].indexOf(d.client_id) > -1) {
              clientContent += "<div class='elfinder-white-box'><input type='checkbox' data-id='"+d.client_id+"' checked/><label>"+d.client_name+"</label></div>";
            } else {
              clientContent += "<div class='elfinder-white-box'><input type='checkbox' data-id='"+d.client_id+"'/><label>"+d.client_name+"</label></div>";
            }
          });
          clientsView = clientsView.replace('{clients}', clientContent);
        }

        // Fill-in claims
        var lstClaims = "";
        if (!information['openidclaims'] || information['openidclaims'].length === 0) {
          lstClaims = 'no claim';
        }
        else {
          var claimContent = "<select class='claim-type'>{selectOptions}</select><input type='text' class='claim-value' style='margin:0 5px 0 5px;' /><button type='button' class='add-claim'>Add</button>";
          var selectOptions = "";
          information['openidclaims'].sort().forEach(c => {
            var permClaims = permissionRule['claims'];
            if (permClaims && permClaims.length > 0 && permClaims.filter(function(pc) { return pc.type === c; }).length > 0) {
              return;
            }

            selectOptions += '<option value=\''+c+'\'>'+c+'</option>';
          });
          claimContent = claimContent.replace('{selectOptions}', selectOptions);
          lstClaims = claimContent;
        }

        claimsView = claimsView.replace('{claims}', lstClaims);
        // Fill-in assigned claims
        var lstAssignedClaims = "";
        if (!permissionRule['claims'] || permissionRule['claims'].length === 0) {
          lstAssignedClaims = "no assigned claims";
        } else {
          lstAssignedClaims = getRemovableClaims(permissionRule.claims);
        }
        claimsView = claimsView.replace('{assignedClaims}', lstAssignedClaims);
        // Fill-in permissions
        if (!information['permissions'] || information['permissions'].length === 0) {
          permissionsView = permissionsView.replace('{permissions}', 'no permission');
        }
        else {
          var permissionContent = contructTiles(information, 'permissions', permissionRule['scopes']);
          permissionsView = permissionsView.replace('{permissions}', permissionContent);
        }

        result = result.replace('{clients}', clientsView);
        result = result.replace('{claims}', claimsView);
        result = result.replace('{permissions}', permissionsView);
        return result;
      },
      /**
      * Display the view
      * @param {data}
      */
      displayView = function(data) {
        information = data;
        var title = 'Manage <i>\'' + file.name + '\'</i> permissions';
        var edit = getRuleView({});
        content = content.replace('{items}', '<div class="permission-menu-item"><a href="#" data-rule="new">New</a></div>');
        content = content.replace('{details}', edit);
        view = view.replace('{content}', content);
        view = view.replace('{title}', title);
        var dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
        dialog.addClass('dialog-size');
      },
      dialog = fm.getUI().find('#'+id);

    if (this.getstate([file.hash]) < 0) {
      return;
    }

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

    reqs.push(fm.request({
      data: { cmd: 'perms', target: file.hash },
      preventDefault: true
    }).done(function(data) {
      displayView(data);
      fm.notify({
        type: 'permissions',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'the permission cannot be retrieved'});
      fm.notify({
        type: 'permissions',
        cnt: -1
      });
    }));
  }
}
