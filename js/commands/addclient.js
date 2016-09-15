'use strict';

elFinder.prototype.commands.addclient = function() {
  var fm = this.fm,
    clientsHash = 'assets_openid_clients';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">' +
      '<strong style="display:inline-block; padding-right:2px;">Create a client</strong>'+
      '</div>{content}',
    content : '<table class="elfinder-info-tb"><tbody>' +
      '<tr><td>Redirect Uris</td><td><input type="text" name="redirect_uris" /></td></tr>' +
      '<tr><td><i>concatenated list <br/> of redirect uris<br/> separated by ","</i></td></tr>' +
      '<tr><td><button type="button" class="create-client">Add</button></td></tr>' +
      '</table>'
  },
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].hash === clientsHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-addclient-'+file.hash,
      view = this.tpl.main,
      content = this.tpl.content,
      reqs = [],
			dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.hash);
        }),
      dialog = fm.getUI().find('#'+id),
      opts = {
        title : 'Create client',
        width: 'auto',
        open: function() {
          var self = this;
          $(self).find('input[name="redirect_uris"]').focus();
          $(self).find('input[name="redirect_uris"]').keydown(function(e) {
            e.stopImmediatePropagation();
          });
          $(self).find('.create-client').on('click', function() {
            var redirectUris = $(self).find('input[name="redirect_uris"]')
              .val()
              .split(',');
            fm.notify({
              type: 'addclient',
              msg: 'Add clients',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: { cmd: 'mkclient',
                redirect_uris: redirectUris
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'addclient',
                cnt: -1
              });
              dfrd.resolve();
              $(self).elfinderdialog('close');
            }).fail(function() {
              fm.notify({
                type: 'addclient',
                cnt: -1
              });
              fm.trigger('error', {error : 'invalid redirect uris'});
            }));
          });
        },
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
      displayCreateModalWindow = function() {
        view = view.replace('{content}', content);
        dialog = fm.dialog(view, opts);
      };

    if (this.getstate([file.hash]) < 0) {
      return;
    }

    displayCreateModalWindow();
  }
};
