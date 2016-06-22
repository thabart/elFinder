'use strict';

elFinder.prototype.commands.accessinfo = function() {
  var fm = this.fm,
    openidScopesHash = 'assets_openid_scopes';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">Access to a protected resource</div><div>{content}</div>',
    content: '<table class="elfinder-info-tb"><tbody><tr>'+
      '<td>C# (.NET45, .NET46 & .NET CORE) :</td>'+
      '<td>Install and use the visual studio extension. <br/>Pass the resource url <i>"{url}"</i> as parameter</td>'+
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
        title : 'Access info',
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
      displayAccessInfo = function(data) {
        content = content.replace('{url}', data.url)
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
      type: 'accessinfo',
      msg: 'Get access information',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'access',
      target: file.hash
    }).done(function(data) {
      displayAccessInfo(data);
      fm.notify({
        type: 'accessinfo',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'access information cannot be retrieved'});
      fm.notify({
        type: 'accessinfo',
        cnt: -1
      });
    }));
  };
};
