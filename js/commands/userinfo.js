'use strict';

elFinder.prototype.commands.userinfo = function() {
  var fm = this.fm,
    resourceOwnersHash = 'assets_resourceowners';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">'+
      '<img class="elfinder-clientinfo-logo" src="{picture}" />' +
      '<strong>Resource owner ( <a href="{editUrl}" target="_blank">Details</a> )</strong> '+
      '<span class="elfinder-info-kind">{title}</span></div>{content}',
    content: '<table class="elfinder-info-tb"><tbody>'+
      '<tr><td>Add role</td><td><input type="text" class="role" /><button class="add-role">Add</button></td></tr>'+
      '<tr><td>Roles</td><td style="width:300px;"><ul class="assigned-roles list">{roles}</ul></td></tr>'+
      '<tr><td><button class="update">Update</button></td></tr>' +
      '</tbody></table>'
  };
  this.getstate = function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].phash && sel[0].phash === resourceOwnersHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-userinfo-'+file.hash,
      resourceowner = {},
      reqs = [],
      options = this.options,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.phash);
        }),
      opts = {
        title : 'User information',
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
          $(self).find('.role').keydown(function(e) {
  					e.stopImmediatePropagation();
          });
          $(self).find(".add-role").on("click", function() {
            var role = $(self).find('.role').val();
            addRole(role, self);
          });
          $(self).find(".update").on("click", function() {
            var roles = $(self).find('.elfinder-white-box').children('label');
            var indexes = [];
            resourceowner.claims.forEach(function(c, index) {
              if (c.key === 'role') {
                indexes.push(index);
              }
            });

            var length = resourceowner.claims.length;
            for(var i = length - 1; i >= 0; i--)
            {
              if (indexes.indexOf(i) > -1 && resourceowner.claims[i].key === 'role')
              {
                resourceowner.claims.splice(i, 1);
              }
            }

            roles.each(function() {
              var val = $(this).html();
              resourceowner.claims.push({ key: 'role', value: val });
            });
            fm.notify({
              type: 'updateuser',
              msg: 'Update user information',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: {
                cmd: 'updatero',
                user: resourceowner
              },
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'updateuser',
                cnt: -1
              });
              dfrd.resolve();
              $(self).elfinderdialog('close');
            }).fail(function() {
              fm.trigger('error', {error : 'User cannot be updated'});
              fm.notify({
                type: 'updatero',
                cnt: -1
              });
            }));
          });
          refreshEventHandler(self);
        }
      },
      addRole = function(role, self) {
        var assignedRoles = $(self).find('.assigned-roles');
        if (assignedRoles.children().length === 0) {
          assignedRoles.html('');
        }

        var child = constructRemovableTiles([role]);
        assignedRoles.append(child);
        refreshEventHandler(self);
      },
      refreshEventHandler = function(self) {
        $(self).find('.can-be-removed').on('click', function(e) {
          e.preventDefault();
          var currentTarget = e.currentTarget;
          if ($(currentTarget).parent().children().length === 1) {
            $(currentTarget).parent().html('No roles');
          } else {
            $(currentTarget).remove();
          }
        });
      },
      constructRemovableTiles = function(data) {
          var content = "";
          data.forEach(d => {
            content += "<li class='elfinder-white-box can-be-removed'><label>"+d+"</label><a href='#'>(Remove)</a></li>";
          });
          return content;
      },
      displayUser = function(user) {
        var picture = user.picture;
        if (!picture) {
          picture = 'img/unknown.png';
        }

        if (!user.claims) {
          user.claims = [];
        }

        var rolesStr = 'No roles';
        if (user.claims.length > 0)
        {
          var roles = [];
          user.claims.forEach(function(record) {
            if (record.key === 'role')
            {
              roles.push(record.value);
            }
          });
          if (roles.length > 0)
          {
            rolesStr = constructRemovableTiles(roles);
          }
        }

        if (user.is_localaccount) {
          content = content.replace('{roles}', rolesStr);
        }
        else {
          content = '<table class="elfinder-info-tb"><tbody><tr><td>Not a local account</td></tr></tbody></table>';
        }

        view = view.replace('{picture}', picture);
        view = view.replace('{title}', user.login);
        view = view.replace('{content}', content);
        view = view.replace('{editUrl}', options.editUrl.replace('{user_id}', user.login));
        dialog = fm.dialog(view, opts);
        resourceowner = user;
        dialog.attr('id', id);
      };

    if (this.getstate([file.hash]) < 0) {
      return;
    }

    if (dialog.length) {
      dialog.elfinderdialog('toTop');
      return $.Deferred().resolve();
    }

    fm.notify({
      type: 'userinfo',
      msg: 'Get user information',
      cnt: 1,
      hideCnt: true
    });

    var id = file.hash.replace(resourceOwnersHash + '_', '');
    reqs.push(fm.request({
      cmd: 'ro',
      id: id
    }).done(function(data) {
      displayUser(data);
      fm.notify({
        type: 'userinfo',
        cnt: -1
      });
    }).fail(function() {
      fm.trigger('error', {error : 'User information cannot be retrieved'});
      fm.notify({
        type: 'userinfo',
        cnt: -1
      });
    }));
  };
};
