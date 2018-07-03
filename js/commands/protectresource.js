'use strict';

elFinder.prototype.commands.protectresource = function() {
  var fm = this.fm,
    openidScopesHash = 'assets_openid_scopes';
  this.tpl = {
    main : '<div>{content}</div>',
    content: '<table class="elfinder-info-tb"><tbody>'+
      '<tr><td>{body}</td></tr>'+
      '<tr><td>{buttons}</td></tr>'+
      '</tr></tbody></table>'
  };
  this.getstate= function(sel) {
		var sel = this.files(sel);
    return !this._disabled && sel.length == 1 && sel[0].phash && !sel[0].locked  ? 0 : -1;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-protectresource-'+file.hash,
      reqs = [],
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      dfrd     = $.Deferred()
        .done(function(data) {          
          fm.exec('reload', file.hash);
          dialog.elfinderdialog('close');
      }),
      opts = {
        title : 'protectResourceTitle',
        width: 'auto',
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
          refreshEvtHandlers($(self));
        }
      },
      /**
      * Refresh the event handlers.
      */
      refreshEvtHandlers = function(elt) {
        elt.find('.add-scope').off('submit');
        elt.find('.scope-id').keydown(function(e) {
          e.stopImmediatePropagation();
        });
        elt.find('.add-scope').on('submit', function(e) {
          e.preventDefault();
          var scopeId = elt.find('.scope-id').val();          
          if (elt.find('.assigned-scopes').children().length === 0) {
              elt.find('.assigned-scopes').html('');
          }
          var child = getRemovableScopes([scopeId]);
          elt.find('.scope-id').val('');         
          elt.find('.assigned-scopes').append(child);
          refreshRemovableEvtHandlers(elt);
        });
        elt.find('.update-resource').click(function() { // Update the UMA resource.
          fm.notify({
            type: 'updateresource',
            msg: 'Update UMA resource',
            cnt: 1,
            hideCnt: true
          });
          $.get(fm.options.authUrl).then(function(configuration) {
            var scopes = elt.find('.assigned-scopes .elfinder-white-box').children('label');
            var assignedScopes = [];
            scopes.each(function() {
              assignedScopes.push($(this).html());
            });
            var request = { _id: file['resource_id'], name: file.hash, type: 'hierarchy', scopes: assignedScopes };
            $.ajax({
              method: 'PUT',
              url: configuration['resource_registration_endpoint'],
              contentType: 'application/json',
              data: JSON.stringify(request)
            }).then(function(r) {  
              dfrd.resolve();
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
            }).fail(function() {
              fm.trigger('error', {error : 'UMA resource cannot be updated'});
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
            });
          }).fail(function() {
            fm.trigger('error', {error : 'UMA resource cannot be updated'});
            fm.notify({
              type: 'updateresource',
              cnt: -1
            });
          });
        });
        elt.find('.create-resource').click(function() { // Create the UMA resource.
          fm.notify({
            type: 'createresource',
            msg: 'Create UMA resource',
            cnt: 1,
            hideCnt: true
          });
          $.get(fm.options.authUrl).then(function(configuration) {
            var scopes = elt.find('.assigned-scopes .elfinder-white-box').children('label');
            var assignedScopes = [];
            scopes.each(function() {
              assignedScopes.push($(this).html());
            });
            var request = { name: file.hash, type: 'hierarchy', scopes: assignedScopes };
            $.ajax({
              method: 'POST',
              url: configuration['resource_registration_endpoint'],
              contentType: 'application/json',
              data: JSON.stringify(request)
            }).then(function(authResult) { 
              reqs.push(fm.request({
                data: {
                  cmd: 'umaResource',
                  target: file.hash,
                  resource_id: authResult['_id']
                },
                preventDefault: true
              }).done(function(data) {
                dfrd.resolve(data);
                fm.notify({
                  type: 'createresource',
                  cnt: -1
                });
              }).fail(function() {
                fm.trigger('error', {error : 'UMA resource cannot be created'});
                fm.notify({
                  type: 'createresource',
                  cnt: -1
                });
              }));
            }).fail(function(e) {
              fm.trigger('error', {error : 'UMA resource cannot be created'});
              fm.notify({
                type: 'createresource',
                cnt: -1
              });
            });
          }).fail(function() {
            fm.trigger('error', {error : 'UMA resource cannot be created'});
            fm.notify({
              type: 'createresource',
              cnt: -1
            });
          });
        });
        refreshRemovableEvtHandlers(elt);
      },
      /**
      * Refresh removable elements.
      */
      refreshRemovableEvtHandlers = function(elt) {
        elt.find('.can-be-removed a').off('click');
        elt.find('.can-be-removed a').on('click', function(e) {
          e.preventDefault();
          var currentTarget = e.currentTarget;
          var canBeRemovedBox = $(currentTarget).closest('.can-be-removed');
          var defaultMessage = $(canBeRemovedBox).data('defaultmessage');
          if (canBeRemovedBox.parent().children().length === 1) {
            canBeRemovedBox.parent().html(defaultMessage);
          } else {
            canBeRemovedBox.remove();
          }
        });

      },
      /**
      * Get removable scopes
      * @param {scopes}
      */
      getRemovableScopes = function(scopes) {
          var content = "";
          scopes.forEach(scope => {
            content += "<div class='elfinder-white-box can-be-removed' style='display: block;' data-defaultmessage='noScopes'><label>"+scope+"</label><a href='#' data-type='"+scope+"' data-value='"+scope+"'>(Remove)</a></div>";
          });
          return content;
      },
      /**
      * Display resource informations.
      */
      displayResourceInformations = function(data) {        
        var tableBody = '{information}<fieldset><legend>resourceScopes</legend><div>{addScopesForm}</div><div class=\'assigned-scopes\' style=\'width: 300px; max-width: 300px;\'>{assignedScopes}</div></fieldset>';

        // Display the scopes.
        var addScopesForm = "<form class='add-scope'>"+
          "<input type='text' class='scope-id' style='margin:0 5px 0 5px;' />"+
          "<button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Add</span></button>"+
        "</form>";
        var assignedScopes = "";
        if (data.scopes) {
          assignedScopes = getRemovableScopes(data.scopes);
        }

        var information = "";
        if (data['_id']) {
          information = "<div><span>resourceId : "+ data['_id'] +"</span></div>";
        }

        tableBody = tableBody.replace('{information}', information);
        tableBody = tableBody.replace('{addScopesForm}', addScopesForm);
        tableBody = tableBody.replace('{assignedScopes}', assignedScopes);

        // Display the buttons.
        if (!data['_id']) {
          content = content.replace('{buttons}', "<button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text create-resource'>Create</span></button>");
        } else {
          content = content.replace('{buttons}', "<button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text update-resource'>Update</span></button>");
        }


        content = content.replace('{body}', tableBody);
        view = view.replace('{content}', content);
        dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
      };

    if (this.getstate([file.hash]) < 0) {
      return;
    }

    if (dialog.length) {
			dialog.elfinderdialog('toTop');
			return $.Deferred().resolve();
		}

    // display loading spinner
    fm.notify({
      type: 'protectresource',
      msg: 'Get ressource information',
      cnt: 1,
      hideCnt: true
    });

    if (file && file['resource_id']) {      
      $.get(this.fm.options.authUrl).then(function(configuration) {
        $.ajax({
          method: 'GET',
          url: configuration['resource_registration_endpoint'] + '/' + file['resource_id']
        }).then(function(data) {
          fm.notify({
            type: 'protectresource',
            cnt: -1
          });
          displayResourceInformations(data);
        }).fail(function(e) {
          fm.trigger('error', {error : 'Uma information cannot be retrieved'});
          fm.notify({
            type: 'protectresource',
            cnt: -1
          });
        });
      });
    } else {
      displayResourceInformations({});
      fm.notify({
        type: 'protectresource',
        cnt: -1
      });
    }
  };
};
