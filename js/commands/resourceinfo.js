'use strict';

elFinder.prototype.commands.resourceinfo = function() {
  var fm = this.fm,
    umaResourcesHash = 'assets_uma_resources';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">'+
      '<img class="elfinder-clientinfo-logo" src="{logoUri}" />' +
      '<strong>Resource (<a href="{editUrl}">Edit</a>)</strong>'+
      '<span class="elfinder-info-kind">{title}</span></div>{content}',
    content: '<table class="elfinder-info-tb"><tbody>'+
      '<tr><td>Scopes</td><td>{scopes}</td></tr>'+
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
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
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
        }
      },
      contructTiles = function(data) {
        var content = "";
        data.forEach(d => {
          content += "<div class='elfinder-white-box'><label>"+d+"</label></div>";
        });
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
        view = view.replace('{editUrl}', options.editUrl.replace('{resource_id}', 'id'));
        view = view.replace('{title}', data.name);
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
