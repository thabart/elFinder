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
        elt.find('.patch-resource').click(function() {
          var scopes = elt.find('.assigned-scopes .elfinder-white-box').children('label');
          var assignedScopes = [];
          scopes.each(function() {
            assignedScopes.push($(this).html());
          });

          fm.notify({
            type: 'updateresource',
            msg: 'Update the resource informations',
            cnt: 1,
            hideCnt: true
          });
          reqs.push(fm.request({
              data: {
                cmd: 'patchresource',
                target: file.hash,
                scopes: assignedScopes
              },
              preventDefault: true
            }).done(function(data) {
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
              dfrd.resolve(data);
            }).fail(function() {
              fm.trigger('error', {error : 'The information cannot be saved'});
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
            }));
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
        if (data.resource && data.resource.scopes) {
          assignedScopes = getRemovableScopes(data.resource.scopes);
        }

        var information = "";
        if (data.resource && data.resource.id) {
          information = "<div><span>reosurceId : "+data.resource.id+"</span></div>";
        }

        tableBody = tableBody.replace('{information}', information);
        tableBody = tableBody.replace('{addScopesForm}', addScopesForm);
        tableBody = tableBody.replace('{assignedScopes}', assignedScopes);

        // Display the buttons.
        if (!data.resource && !data.resource.id) {
          content = content.replace('{buttons}', "<button class='create-resource ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text patch-resource'>Create</span></button>");
        } else {
          content = content.replace('{buttons}', "<button class='update-resource ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text patch-resource'>Update</span></button>");
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
    reqs.push(fm.request({
      cmd: 'getresource',
      target: file.hash
    }).done(function(data) {
      displayResourceInformations(data);
      fm.notify({
        type: 'protectresource',
        cnt: -1
      });
    }).fail(function(e) {
      console.log(e);
      fm.trigger('error', {error : 'Information cannot be retrieved'});
      fm.notify({
        type: 'protectresource',
        cnt: -1
      });
    }));
  };
};
