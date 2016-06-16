'use strict';

elFinder.prototype.commands.authpolicy = function() {
  var fm = this.fm,
    authPolicyHash = 'assets_uma_authorization_policies';
  this.shortcuts = [{
    pattern     : 'f3'
  }];
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">' +
      '<strong>Authorization policy (<a href="{editUrl}">Edit</a>)</strong></div>{content}',
    content : '<table class="elfinder-info-tb" style="table-layout:fixed;"><tbody>' +
      '<tr><td>Resource identifiers</td><td>{resources}</td></tr>' +
      '<tr><td>Clients</td><td>{clients}</td></tr>' +
      '<tr><td>Claims</td><td>{claims}</td></tr>' +
      '<tr><td>Permissions</td><td>{permissions}</td></tr>' +
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
        var setValue = function(defaultValue, arr) {
          if (arr && arr.length > 0) {
            return arr.join(',');
          }

          return defaultValue;
        };
        var constructClaimTiles = function(claims) {
          if (!claims || claims.length === 0) {
            return 'no claim';
          }
          var html = '';
          claims.forEach(c => {
            html += "<div class='elfinder-white-box'>"+c.type+":"+c.value+"</div>";
          });
          return html;
        };
        var clients = setValue('no client', data.allowed_clients),
          claims = constructClaimTiles(data.claims),
          resources = data.resource_set_ids.join(','),
          permissions = setValue('no permission', data.scopes);

        content = content.replace('{resources}', resources);
        content = content.replace('{clients}', clients);
        content = content.replace('{claims}', claims);
        content = content.replace('{permissions}', permissions);
        view = view.replace('{editUrl}', '#')
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
