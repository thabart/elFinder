'use strict';

elFinder.prototype.commands.authpolicy = function() {
  var fm = this.fm,
    authPolicyHash = 'assets_uma_authorization_policies';
  this.shortcuts = [{
    pattern     : 'f3'
  }];
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">' +
      '<img class="elfinder-clientinfo-logo" src="img/policy.png" />' +
      '<strong>Authorization policy (<a href="{editUrl}">Edit</a>)</strong></div>{content}',
    content : '<table class="elfinder-info-tb" style="table-layout:fixed;"><tbody>' +
      '<tr><td>Resource identifiers</td><td>{resources}</td></tr>' +
      '<tr><td>Number of rules</td><td>{rules}</td></tr>' +
      '</tbody></table>'
  };
  this.getstate = function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash && sel[0].phash === authPolicyHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-clientinfo-'+file.hash,
      view = this.tpl.main,
      content = this.tpl.content,
      options = this.options,
      reqs = [],
      dialog = fm.getUI().find('#'+id),
      opts = {
        title : 'Authorization policy',
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
        }
      },
      displayAuthPolicy = function(data) {
        var resources = data.resource_set_ids.join(',');
        var rules = "no rule";
        if (data.rules && data.rules.length > 0) {
          rules = data.rules.length;
        }

        content = content.replace('{resources}', resources);
        content = content.replace('{rules}', rules);
        view = view.replace('{editUrl}', options.editUrl.replace('{authpolicy_id}', data.id));
        view = view.replace('{content}', content);
        dialog = fm.dialog(view, opts);
        dialog.addClass('dialog-size');
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
      type: 'authpolicy',
      msg: 'Get authorization policy',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'authpolicy',
      target: file.hash.replace(authPolicyHash + '_','')
    }).done(function(data) {
      displayAuthPolicy(data);
      fm.notify({
        type: 'authpolicy',
        cnt: -1
      });
    }));
    // authpolicy
  }
};
