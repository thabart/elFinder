'use strict';

elFinder.prototype.commands.clientinfo = function() {
  var fm = this.fm,
    clientsHash = 'assets_openid_clients';
  this.shortcuts = [{
		pattern     : 'f4'
  }];
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">'+
      '<img class="elfinder-clientinfo-logo" src="{logoUri}" />' +
      '<strong>Client information (<a href="{editUrl}" target="_blank">Edit</a>)</strong>'+
      '<span class="elfinder-info-kind">{title}</span></div>{content}',
    content: '<table class="elfinder-info-tb"><tbody>'+
      '<tr><td>Identifier</td><td>{clientId}</td></tr>'+
      '<tr><td>Secret</td><td>{clientSecret}</td></tr>'+
      '<tr><td>Callback URIs</td><td>{callbackUrls}</td></tr>'+
      '</tbody></table>'
  };
  this.getstate = function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash && sel[0].phash === clientsHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-clientinfo-'+file.hash,
      reqs = [],
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      opts = {
        title : 'Client Information',
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
      displayClientInfo = function(data) {
        var callbackUrls = "no callback urls";
        if (data.redirect_uris && data.redirect_uris.length > 0) {
          callbackUrls = data.redirect_uris.join(',');
        }

		var secret = "<no shared secret>";
		if (data.secrets && data.secrets.length > 0) {
			data.secrets.forEach(function(s) {
				if (s.type == "SharedSecret") {
					secret = s.value;
				}
			});
		}
		
        content = content.replace('{clientId}', data.client_id);
        content = content.replace('{clientSecret}', secret);
        content = content.replace('{callbackUrls}', callbackUrls);
        view = view.replace('{title}', file.name);
        view = view.replace('{editUrl}', options.editUrl.replace('{client_id}', data.client_id));
        var logoUri = data.logo_uri;
        if (!logoUri) {
          logoUri = 'img/unknown.png';
        }
        view = view.replace('{logoUri}', logoUri);
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
      type: 'clientinformation',
      msg: 'Get client information',
      cnt: 1,
      hideCnt: true
    });

    reqs.push(fm.request({
      cmd: 'clientinfo',
      target: file.hash.replace(clientsHash + '_','')
    }).done(function(data) {
      displayClientInfo(data);
      fm.notify({
        type: 'clientinformation',
        cnt: -1
      });
    }));
  }
}
