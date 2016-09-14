'use strict';

elFinder.prototype.commands.resourceinfo = function() {
  var fm = this.fm,
    umaResourcesHash = 'assets_uma_resources';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">'+
      '<img class="elfinder-clientinfo-logo" src="{logoUri}" />' +
      '<strong>Resource</strong>'+
      '<span class="elfinder-info-kind">{title}</span> {url}</div>{content}',
    content: '<table class="elfinder-info-tb" id="scopes-resource"><tbody>'+
      '<tr><td>Scopes</td><td><input type="text" id="scope-value" /><button id="add-scope">Add</button></td></tr>'+
      '<tr><td colspan="2"><ul class="list" id="scope-list">{scopes}</ul></td></tr>'+
      '<tr><td>Parents</td></tr>'+
      '<tr><td colspan="2"><ul class="list">{policies}</ul></td></tr>'+
      '<tr><td><button id="update">Update</button></td></tr>' +
      '</tbody></table>'
  };
  this.getstate = function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash && sel[0].phash === umaResourcesHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-umaresource-'+file.hash,
      reqs = [],
      resourceSet = {},
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.phash);
        }),
      opts = {
        title : 'Resource',
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
          // Stop propgation
          $(self).find("#scope-value").keydown(function(e) {
            e.stopImmediatePropagation();
          });
          // Add a scope
          $(self).find("#add-scope").on('click', function() {
            var scope = $(self).find("#scope-value").val();
            $(self).find("#scope-list").append(contructTiles([
              scope
            ]));
            refreshRemovableResource();
          });
          // Update the resource
          $(self).find("#update").on('click', function() {
            var scopeElts = $(self).find('.scope').children('label');
            var scopes = [];
            scopeElts.each(function() {
              scopes.push($(this).html());
            });

            var request = {
              _id: resourceSet._id,
              name: resourceSet.name,
              uri: resourceSet.uri,
              type: resourceSet.type,
              scopes: scopes,
              icon_uri: resourceSet.icon_uri,
              cmd: 'updateresource'
            };

            fm.notify({
              type: 'updateresource',
              msg: 'Update resource',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: request,
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
              dfrd.resolve();
              $(self).elfinderdialog('close');
            }).fail(function(e) {
              fm.trigger('error', {error : 'Resource cannot be updated'});
              fm.notify({
                type: 'updateresource',
                cnt: -1
              });
            }));
          });

          refreshRemovableResource();
        }
      },
      refreshRemovableResource = function() {
        $(dialog).find('.remove-scope').on('click', function(e) {
          e.preventDefault();
          $(e.currentTarget).parent().remove();
        });
      },
      contructTiles = function(data) {
        var content = "";
        if (data && data.length > 0) {
          data.forEach(d => {
            content += "<li class='elfinder-white-box scope'><label>"+d+"</label> (<a href='#' class='remove-scope'>Remove</a>)</li>";
          });
        } else {
          content = "no scope";
        }

        return content;
      },
      constructParents = function(data) {
        var content = "";
        if (data && data.length > 0) {
          data.forEach(d => {
            content += "<li class='elfinder-white-box'><label><a href='#elf_"+d.hash+"' target='_blank'>"+d.name+"</a></label>";
            if (d.hasAuthorizationPolicy) {
              content += " (contains authorization policy)"
            }

            content += "</li>";
          });
        }
        else {
          content = "no parent"
        }

        return content;
      },
      displayResource = function(data) {
        var scopes = "no scopes";
        if (data.scopes && data.scopes.length > 0) {
          scopes = contructTiles(data.scopes);
        }

        content = content.replace('{scopes}', scopes);
        var iconUri = data.icon_uri;
        if (!iconUri) {
          iconUri = 'img/unknown_resource.png';
        }

        view = view.replace('{logoUri}', iconUri);
        view = view.replace('{title}', data.name);
        view = view.replace('{content}', content);
        if (data.path) {
          view = view.replace('{url}', '(<a href="'+data.uri+'" target="_blank">'+data.path+'</a>)');
        } else {
          view = view.replace('{url}', '');
        }

        view = view.replace('{policies}', constructParents(data.parents));
        dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
        resourceSet = data;
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
      type: 'resourceinfo',
      msg: 'Get resource information',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'resourceinfo',
      resource_id: file.hash.replace(umaResourcesHash + '_','')
    }).done(function(data) {
      displayResource(data);
      fm.notify({
        type: 'resourceinfo',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'resource information cannot be retrieved'});
      fm.notify({
        type: 'resourceinfo',
        cnt: -1
      });
    }));
  }
}
