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
      '<tr><td>Open id scope</td><td><input type="checkbox" id="is-openid" {isOpenIdScope} readonly/></td></tr>'+
      '<tr><td>Displayed in the consent screen</td><td><input type="checkbox" id="is-displayed-in-consent" {isDisplayInConsent} readonly/></td></tr>'+
      '<tr><td>Exposed in the contrat</td><td><input type="checkbox" id="is-exposed" {isExposed} readonly/></td></tr>'+
      '<tr><td>Type</td><td><select name="type" id="choose-type"><option value="0">Resource</option><option value="1">Resource owner</option></select></td></tr>' +
      '<tr class="claims" style="display:none;"><td>Claim types</td><td><input type="text" id="claim-type"/><button type="button" id="add-claim">Add</button></td></tr>' +
      '<tr class="claims" style="display:none;"><td colspan="2"><ul id="claim-types" class="list">{claims}</ul></td></tr>' +
      '<tr><td colspan="2"><button type="button" id="save-scope">Save</button></td></tr>' +
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
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.phash);
        }),
      scope = {},
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
          var self = this;
          // Select type
          $(self).find("#choose-type").val(scope.type);
          if (scope.type === 1) {
            $(self).find('.claims').show();
          }

          // Refresh event handlers
          $(self).find('#claim-types a').on('click', function(e) {
            e.preventDefault();
            $(this).parent().remove();
          });
          // Display claims or not
          $(self).find('#choose-type').on('change', function() {
            var valueSelected = this.value;
            if (valueSelected == 0) {
              $(self).find('.claims').hide();
            } else {
              $(self).find('.claims').show();
            }
          });
          // Add claim types
          $(self).find('#add-claim').on('click', function() {
            var claimType = $(self).find('#claim-type').val();
            $(self).find('#claim-types').append("<li class='elfinder-white-box'><label>"+claimType+"</label><a href='#'>(Remove)</a></li>");
            $(self).find('#claim-types a').on('click', function(e) {
              e.preventDefault();
              $(this).parent().remove();
            });
          });
          // Save scope
          $(self).find("#save-scope").on('click', function() {
            scope.target = file.hash;
            scope.cmd = 'updatescope';
            scope.type = $(self).find("#choose-type").val();
            scope.is_displayed_in_consent = $(self).find('#is-displayed-in-consent').is(':checked');;
            scope.is_exposed = $(self).find('#is-exposed').is(':checked');
            scope.is_openid_scope = $(self).find('#is-openid').is(':checked');
            scope.claims = [];
            if (scope.type === '1') {
              scope.claims = $.map($(self).find('#claim-types li label'), function(n) {
                return $(n).text();
              });
            }


            fm.notify({
              type: 'updatescope',
              msg: 'Update scope',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: scope,
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'updatescope',
                cnt: -1
              });
              dfrd.resolve();
              $(self).elfinderdialog('close');
            }).fail(function() {
              fm.trigger('error', {error : 'the scope cannot be updated'});
              fm.notify({
                type: 'updatescope',
                cnt: -1
              });
            }));
          });
        }
      },
      contructTiles = function(data) {
        var content = "";
        if (data) {
          data.forEach(d => {
            content += "<div class='elfinder-white-box'><label>"+d+"</label></div>";
          });
        }
        return content;
      },
      /**
      * Construct removable tiles
      */
      constructRemovableTile = function(data) {
        var content = "";
        if (data) {
          data.forEach(d => {
            content += "<li class='elfinder-white-box'><label>"+d+"</label><a href='#'>(Remove)</a></li>";
          });
        }
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
        view = view.replace('{claims}', constructRemovableTile(data.claims));
        dialog = fm.dialog(view, opts);
        dialog.attr('id', id);
        scope = data;
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
