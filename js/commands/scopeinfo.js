'use strict';

elFinder.prototype.commands.scopeinfo = function() {
  var fm = this.fm,
    openidScopesHash = 'assets_openid_scopes';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">'+
      '<img class="elfinder-clientinfo-logo" src="img/scope.png" />' +
      '<strong>Scope</strong>'+
      '<span class="elfinder-info-kind">{title}</span></div>{content}',
    content: '<table class="elfinder-info-tb"><tbody>'+
      '<tr><td>Open id scope</td><td><input type="checkbox" {isOpenIdScope} readonly/></td></tr>'+
      '<tr><td>Displayed in the consent screen</td><td><input type="checkbox" {isDisplayInConsent} readonly/></td></tr>'+
      '<tr><td>Exposed in the contrat</td><td><input type="checkbox" {isExposed} readonly/></td></tr>'+
      '</tbody></table>'
  };
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash === openidScopesHash ? 0 : -1;
    return result;
  };

  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-scopeinfo-'+file.hash,
      reqs = [],
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      opts = {
        title : 'Scope',
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
      displayScope = function(data) {
        var check = function(b, name) {
          if (b) {
            content = content.replace(name, 'checked');
          } else {
            content = content.replace(name, '');
          }
        };

        check(data.is_openid_scope, '{isOpenIdScope}');
        check(data.is_displayed_in_consent, '{isDisplayInConsent}');
        check(data.is_exposed, '{isExposed}');
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
      type: 'scopeinfo',
      msg: 'Get scope',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'scope',
      name: file.name
    }).done(function(data) {
      displayScope(data);
      fm.notify({
        type: 'scopeinfo',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'scope cannot be retrieved'});
      fm.notify({
        type: 'scopeinfo',
        cnt: -1
      });
    }));
  };
};
