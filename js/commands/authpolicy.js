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
      '<strong>Authorization policy</strong></div>{content}',
    content : '<table class="elfinder-info-tb" style="table-layout:fixed;" id="authorization-policy"><tbody>' +
      '<tr><td>Resources</td><td></td></tr>' +
      '<tr><td colspan="2"><ul class="list">{resources}</ul></td></tr>' +
      '<tr><td>Rules</td></tr>' +
      '<tr><td colspan="2"><ul class="list">{rules}</ul></td></tr>' +
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
      constructResources = function(data) {
        var content = "";
        if (data && data.length > 0) {
          data.forEach(d => {
            content += "<li class='elfinder-white-box'><label><a href='"+options.resourceUrl.replace('{hash}', 'elf_'+d.hash)+"' target='_blank'>"+d.name+"</a></label></li>";
          });
        }
        else {
          content = "no resource"
        }

        return content;
      },
      constructRules = function(rules) {
        var content = "";
        if (rules && rules.length > 0) {
          rules.forEach(rule => {
            var clients = rule.clients && rule.clients.length > 0 ? rule.clients.join(',') : "no client";
            var claims = rule.claims && rule.claims.length > 0 ? $.map(rule.claims, function(c) {
              return c.type + ":"+c.value
            }).join(','): "no claim";
            var permissions = rule.scopes && rule.scopes.length > 0 ? rule.scopes.join(',') : "no permission";
            content += "<li class='elfinder-white-box'><table><tbody>"+
            "<tr><td>Clients</td><td>"+clients+"</td></tr>"+
            "<tr><td>Claims</td><td>"+claims+"</td></tr>"+
            "<tr><td>Permissions</td><td>"+permissions+"</td></tr>"+
            "</tbody></table></li>";
          });
        }
        else {
          content = "no rule"
        }

        return content;
      },
      displayAuthPolicy = function(data) {
        content = content.replace('{resources}', constructResources(data.resources));
        content = content.replace('{rules}', constructRules(data.rules));
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
