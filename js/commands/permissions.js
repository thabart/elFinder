'use strict';

elFinder.prototype.commands.permissions = function() {
  var fm = this.fm,
    spclass = 'elfinder-dialog-notify',
    clientsKey = 'openidclients',
    idProvidersKey = 'idproviders',
    permissionsKey = 'permissions',
    openIdClaimsKey = 'openidclaims',
    providerUrlKey = 'provider';
  this.shortcuts = [{
		pattern     : 'ctrl+p'
  }];
  this.tpl = {
    main     : '<div class="ui-helper-clearfix elfinder-info-title">{title}</div>{content}',
    content  : '<table style="padding-top:5px;">'+
      '<tr><td style="vertical-align:top; width:90px;"><b>authRulesLabel</b><div class="permission-menu">{items}</div></td><td style="vertical-align:top;"><div class="permission-details">{details}</div></td></tr>'+
      '<tr><td colspan="2"><button class=\'add-rule ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only\'><span class=\'ui-button-text\'>addRuleLabel</span></button><button class="remove-rule ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class=\'ui-button-text\'>Remove rule</span></button><button class="save ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class=\'ui-button-text\'>saveLabel</span></button></td></tr></table>',
    edit: '<div class="permission-rule"><div class=\'elfinder-permissions-padding\'>{idproviders}</div><div class=\'elfinder-permissions-padding\'>{clients}</div><div class=\'elfinder-permissions-padding\'>{claims}</div><div class=\'elfinder-permissions-padding\'>{permissions}</div></div>'
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
      dialog = fm.getUI().find('#'+id),
      content = this.tpl.content,
      edit = this.tpl.edit,
      reqs = [],
			incwd    = (fm.cwd().hash == file.hash),
      activeElement = {},
			dfrd     = $.Deferred()
        .done(function(data) {
          fm.exec('reload', file.hash);
          dialog.elfinderdialog('close');
        }),
      opts    = {
        title : 'permissionsTitle',
				width : 'auto',
        height: '450',
        destroyOnClose: true,
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
          refreshSelectedIdProvider({}, activeElement.detail);
          // 3. Refresh the list of claims.          
          refreshEvtHandlers(self);
          // 4. Remove the selected rule
          $(self).find('.remove-rule').on('click', function() {
            removeRule(self);
          });
          // 5. Add a new rule
          $(self).find('.add-rule').on('click', function() {
            var rule = getPermissionRule(activeElement.detail);
            addRule(self, rule);
          });
          // 6. Save the authorization rule
          $(self).find('.save').on('click', function() {
            var rules = [];
            $(self).find('.permission-rule').each(function(i) {
              if (i > 0) {
                rules.push(getPermissionRule($(this)));
              }
            });

            fm.notify({
              type: 'addpermissions',
              msg: 'Update the permissions',
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
        var selectedIdProvider = detail.find('.idproviders :selected').val();
        var clients = detail.find('.assigned-clients .elfinder-white-box').children('label');
        var permissions = detail.find('.assigned-permissions .elfinder-white-box').children('label');
        var claims = detail.find('.assigned-claims .elfinder-white-box').children('label');
        var id = detail.find('input[type=\'hidden\']').val();
        var assignedClientIds = [],
          assignedPermissions = [],
          assignedClaims = [];
        clients.each(function() {
          assignedClientIds.push($(this).html());
        });
        permissions.each(function() {
          assignedPermissions.push($(this).html());
        });
        claims.each(function() {
          var concatenatedClaim = $(this).html();
          assignedClaims.push({
            type: concatenatedClaim.slice(0, concatenatedClaim.indexOf(':')),
            value: concatenatedClaim.slice(concatenatedClaim.indexOf(':') + 1, concatenatedClaim.length)
          });
        });
        var result = {};
        result[permissionsKey] = assignedPermissions;
        result[openIdClaimsKey] = assignedClaims;
        result[clientsKey] = assignedClientIds;
        result[providerUrlKey] = selectedIdProvider;
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
            content += "<div class='elfinder-white-box can-be-removed' data-isclaim='true' data-defaultmessage='"+fm.i18n('noClaimLabel')+"'><label>"+claim.type+":"+claim.value+"</label><a href='#' data-type='"+claim.type+"' data-value='"+claim.value+"'>(Remove)</a></div>";
          });
          return content;
      },
      /**
      * Get removable clients
      * @param {clients}
      */
      getRemovableClients = function(clients) {        
          var content = "";
          clients.forEach(client => {
            content += "<div class='elfinder-white-box can-be-removed' data-defaultmessage='noClientLabel'><label>"+client+"</label><a href='#' data-type='"+client+"' data-value='"+client+"'>(Remove)</a></div>";
          });
          return content;
      },
      /**
      * Get removable scopes
      * @param {scopes}
      */
      getRemovableScopes = function(scopes) {
          var content = "";
          if (!scopes) {
            return content;
          }

          scopes.forEach(scope => {
            content += "<div class='elfinder-white-box can-be-removed' data-isscope='true' data-defaultmessage='noPermissionLabel'><label>"+scope+"</label><a href='#' data-type='"+scope+"' data-value='"+scope+"'>(Remove)</a></div>";
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
        menu.append('<div class="permission-menu-item"><a href="#" data-rule="new">authRuleLabel '+index+'</a></div>');
        // 2. Add content
        var content = getRuleView(permissionRule);
        content = $(content);
        details.append(content);
        // 3. Enable element
        var item = enableElement(elt, index).item;
        // 4. Set the focus
        setFocus(index, elt);
        // 5. Refresh the claims.
        // 6. Refresh the event handler
        refreshCurrentRuleEventHandlers(elt);
        refreshEvtHandlers(elt);
        refreshSelectedIdProvider(permissionRule, content);
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
        // refreshSelectedIdProvider({});
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
        activeElement.detail.find('.scope-name').off('click');
        activeElement.detail.find('.client-id').off('click');
        activeElement.detail.find('.select-permission').off('click');
        activeElement.detail.find('.add-claim').off('submit');
        activeElement.detail.find('.add-client').off('submit');
        activeElement.detail.find('.claim-value').keydown(function(e) {
          e.stopImmediatePropagation();
        });
        activeElement.detail.find('.scope-name').keydown(function(e) {
          e.stopImmediatePropagation();
        });
        activeElement.detail.find('.client-id').keydown(function(e) {
          e.stopImmediatePropagation();
        });
        activeElement.detail.find('.add-claim').on('submit', function(e) {
          e.preventDefault();
          var claimType = activeElement.detail.find('.openidClaims').val(),
            claimValue = activeElement.detail.find('.claim-value').val();
          if (!claimValue || !claimType) {
            return;
          }

          if (activeElement.detail.find('.assigned-claims').children().length === 0) {
              activeElement.detail.find('.assigned-claims').html('');
          }

          activeElement.detail.find('.openidClaims option:selected').remove();
          activeElement.detail.find('.claim-value').val('');
          var child = getRemovableClaims([{
            type: claimType,
            value: claimValue
          }]);
          activeElement.detail.find('.assigned-claims').append(child);
          refreshRemovableEvtHandlers(activeElement.detail);
        });
        activeElement.detail.find('.add-client').on('submit', function(e) {
          e.preventDefault();
          var clientId = activeElement.detail.find('.client-id').val();
          if (!clientId) {
            return;
          }

          if (activeElement.detail.find('.assigned-clients').children().length === 0) {
              activeElement.detail.find('.assigned-clients').html('');
          }
          var child = getRemovableClients([clientId]);
          activeElement.detail.find('.client-id').val('');         
          activeElement.detail.find('.assigned-clients').append(child);
          refreshRemovableEvtHandlers(activeElement.detail);
        });
        activeElement.detail.find('.select-permission').on('click', function() {
          var permission = activeElement.detail.find('.permissions').val();
          if (!permission) {
            return;
          }

          if (activeElement.detail.find('.assigned-permissions').children().length === 0) {
              activeElement.detail.find('.assigned-permissions').html('');
          }

          activeElement.detail.find('.permissions option:selected').remove();
          var child = getRemovableScopes([permission]);
          activeElement.detail.find('.assigned-permissions').append(child);         
          refreshRemovableEvtHandlers(activeElement.detail); 
        });
        activeElement.detail.find('.select-idprovider').on('click', function() {
          refreshSelectedIdProvider({}, activeElement.detail);
        });
        refreshRemovableEvtHandlers(activeElement.detail);
      },
      /**
      * Refresh the list of supported claims.
      */
      refreshSelectedIdProvider = function(permissionRule, elt) {
          var selectedIdProvider = elt.find('.idproviders :selected');
          var url = selectedIdProvider.val();
          $.get(url).then(function(r) {
            var claimsSupported = r['claims_supported'];                   
            var openidClaimsElt = elt.find('.openidClaims');
            openidClaimsElt.empty();
            var permClaims = permissionRule[openIdClaimsKey];
            claimsSupported.sort().forEach(function(claimSupported) {
              if (permClaims && permClaims.length > 0 && permClaims.filter(function(pc) { return pc.type === claimSupported; }).length > 0) {
                return;
              }

              openidClaimsElt.append("<option value='"+claimSupported+"'>"+claimSupported+"</option>");
            });

            var lstAssignedClaims = "";
            if (!permissionRule[openIdClaimsKey] || permissionRule[openIdClaimsKey].length === 0) {
              elt.find('.assigned-claims').html(fm.i18n('noClaim'));
            } else {
              elt.find('.assigned-claims').html(getRemovableClaims(permissionRule[openIdClaimsKey]));
            }

            refreshRemovableEvtHandlers(elt);
          }).fail(function() {

          });
      },
      /**
      * Refresh removable claims evt handlers
      */
      refreshRemovableEvtHandlers = function(elt) {
        elt.find('.can-be-removed a').off('click');
        elt.find('.can-be-removed a').on('click', function(e) {
          e.preventDefault();
          var currentTarget = e.currentTarget;
          var claimValue = $(currentTarget).data('value');
          var claimType = $(currentTarget).data('type');
          var canBeRemovedBox = $(currentTarget).closest('.can-be-removed');
          var defaultMessage = $(canBeRemovedBox).data('defaultmessage');
          var isClaim = $(canBeRemovedBox).data('isclaim');
          var isScope = $(canBeRemovedBox).data('isscope');
          if (canBeRemovedBox.parent().children().length === 1) {
            canBeRemovedBox.parent().html(defaultMessage);
          } else {
            canBeRemovedBox.remove();
          }

          if (isClaim) {
              var claimTypeElt = elt.find('.openidClaims');
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
              elt.find('.claim-value').val(claimValue);
             return; 
          }

          if (isScope) {
              var permissionElt = elt.find('.permissions');
              permissionElt.append("<option value='"+claimValue+"'>"+claimValue+"</option>");    
              var newOptions = permissionElt.find('option').clone();
              newOptions.sort(function(a, b) {
                  if (a.value > b.value) {
                    return 1;
                  }

                  if (a.value < b.value) {
                    return -1;
                  }

                  return 0;
              });

              permissionElt.empty();
              permissionElt.append(newOptions);   
          }
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
        var idProviderView = '<label>selectIdProviderLabel</label><div class=\'idproviders\'>{idproviders}</div>';
        var clientsView = '<fieldset><legend>allowedClientsLabel</legend><div>{clients}</div><div class=\'assigned-clients\'>{assignedClients}</div></fieldset>';
        var claimsView = '<fieldset><legend>allowedClaimsLabel</legend><div>{claims}</div><div class="assigned-claims"></div></fieldset>';
        var permissionsView = '<fieldset><legend>permissionsLabel</legend><div>{permissions}</div><div class=\'assigned-permissions\'>{assignedPermissions}</div></fieldset>';
        
        if (permissionRule.id) {
          clientsView += '<input type="hidden" name="id" value="'+permissionRule.id+'"/>';
        }

        // Display the identity providers.
        if (!information[idProvidersKey] || information[idProvidersKey] === 0) {
          idProviderView = idProviderView.replace('{idproviders}', 'noIdProvidersLabel');
        } else {
          var idProviderContent = "<select class='idproviders' style='margin:0 5px 0 5px;'>{selectOptions}</select><button class='select-idprovider ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>selectLabel</span></button>";      
          var selectIdProviders = "";    
          information[idProvidersKey].forEach(i => {
            if (permissionRule[providerUrlKey] && permissionRule[providerUrlKey] === i.url) {
              selectIdProviders += '<option value=\''+i.url+'\' selected>'+i.name+'</option>';
            } else {              
              selectIdProviders += '<option value=\''+i.url+'\'>'+i.name+'</option>';
            }
          });
          idProviderContent = idProviderContent.replace('{selectOptions}', selectIdProviders);
          idProviderView = idProviderView.replace('{idproviders}', idProviderContent);          
        }

        // Display the client identifiers.      
        var clientsContent = "<form class='add-client'><input type='text' class='client-id' style='margin:0 5px 0 5px;' /><button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>addLabel</span></button></form>";
        if (!permissionRule[clientsKey] || permissionRule[clientsKey].length === 0) {
          clientsView = clientsView.replace('{assignedClients}', 'noClientLabel');
        } else {
          var assignedClients = getRemovableClients(permissionRule[clientsKey]);
          clientsView = clientsView.replace('{assignedClients}', assignedClients);
        }

        clientsView = clientsView.replace('{clients}', clientsContent);
        // Display the claims.
        var lstClaims = "<form class='add-claim'><select class='openidClaims' style='margin:0 5px 0 5px;'></select><input type='text' class='claim-value' style='margin:0 5px 0 5px;' /><button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>addLabel</span></button></form>";
        claimsView = claimsView.replace('{claims}', lstClaims);

        // Display the permissions.
        if (!information[permissionsKey] || information[permissionsKey] === 0) {
          permissionsView = permissionsView.replace('{permissions}', '');
          permissionsView = permissionsView.replace('{assignedPermissions}', 'noPermissionLabel');
        } else {
          var scopesContent = "<select class='permissions' style='margin:0 5px 0 5px;'>{selectOptions}</select><button class='select-permission ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>addLabel</span></button>"; 
          var selectPermissions = "";
          information[permissionsKey].forEach(i => {
            if (!permissionRule[permissionsKey] || !permissionRule[permissionsKey].includes(i)) {
              selectPermissions += '<option value=\''+i+'\'>'+i+'</option>';
            }
          });

          var assignedPermissions = getRemovableScopes(permissionRule[permissionsKey]);
          if (assignedPermissions === "") {
            assignedPermissions = "noPermissionLabel";
          }

          scopesContent = scopesContent.replace('{selectOptions}', selectPermissions);
          permissionsView = permissionsView.replace('{assignedPermissions}', assignedPermissions);
          permissionsView = permissionsView.replace('{permissions}', scopesContent);
        }
        
        result = result.replace('{idproviders}', idProviderView);
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
        var title = 'managePermissionsTitle';
        var edit = getRuleView({});
        content = content.replace('{items}', '<div class="permission-menu-item"><a href="#" data-rule="new">newLabel</a></div>');
        content = content.replace('{details}', edit);
        view = view.replace('{content}', content);
        view = view.replace('{title}', title);
        dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
        dialog.addClass('dialog-size');
      };

    if (this.getstate([file.hash]) < 0) {
      return;
    }

    if (dialog.length) {
			dialog.elfinderdialog('toTop');
			return $.Deferred().resolve();
		}

    // display loading spinner
    if (!file['resource_id']) {
      fm.trigger('error', {error : 'theResourceMustBeFirstCreated'});
      return;
    }

    fm.notify({
      type: 'permissions',
      msg: 'Get permissions',
      cnt: 1,
      hideCnt: true
    });
    // authpolicy_ids
    $.get(fm.options.authUrl).then(function(configuration) {
      var request = { ids: file['authpolicy_ids'] };
      $.ajax({
        method: 'POST',
        url: configuration['policies_endpoint'] + '/.search',
        data: JSON.stringify(request),
        contentType: 'application/json',
      }).then(function(result) {
        console.log(result);
      }).fail(function() {
        fm.notify({
          type: 'permissions',
          cnt: -1
        });
      });
    }).fail(function() {
      fm.notify({
        type: 'permissions',
        cnt: -1
      });
    });
    /*
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
    }));
    */
  }
}
