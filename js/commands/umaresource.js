'use strict';

elFinder.prototype.commands.umaresource = function() {
  var fm = this.fm,
    openidScopesHash = 'assets_openid_scopes';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">UMA resource</div><div>{content}</div>',
    content: '<table class="elfinder-info-tb"><tbody><tr>'+
      '<td>{body}</td>'+
      '<td>{buttons}</td>'+
      '</tr></tbody></table>'
  };
  this.getstate= function(sel) {
		var sel = this.files(sel);
    return !this._disabled && sel.length == 1 && sel[0].phash && !sel[0].locked  ? 0 : -1;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-accessinfo-'+file.hash,
      reqs = [],
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      opts = {
        title : 'UMA resource',
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
      displayUmaResource = function(data) {
        var scopesContent = "<form class='add-scope'><input type='text' class='scope-id' style='margin:0 5px 0 5px;' /><button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Add</span></button></form>";        
        if(data.status === "not_found") {
          content = content.replace('{buttons}', "<button class='create-resource ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Create</span></button>");
        } else {
          content = content.replace('{buttons}', "<button class='update-resource ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Update</span></button>");
        }

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
      type: 'umaresource',
      msg: 'Get UMA resource information',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'umaresource',
      target: file.hash
    }).done(function(data) {
      displayUmaResource(data);
      fm.notify({
        type: 'umaresource',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'uma resource information cannot be retrieved'});
      fm.notify({
        type: 'umaresource',
        cnt: -1
      });
    }));
  };
};
