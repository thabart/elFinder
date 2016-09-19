'use strict';

elFinder.prototype.commands.mkscope = function() {
  var fm = this.fm,
    scopesHash = 'assets_openid_scopes';
  this.tpl = {
    main : '<div class="ui-helper-clearfix elfinder-info-title">' +
      '</div>{content}',
    content : '<table class="elfinder-info-tb"><tbody>' +
      '<tr><td>Name</td><td><input type="text" name="name" /></td></tr>' +
      '<tr><td>Type</td><td><select name="type" id="choose-type"><option value="0">Resource</option><option value="1">Resource owner</option></select></td></tr>' +
      '<tr class="claims" style="display:none;"><td>Claim types</td><td><input type="text" id="claim-type"/><button type="button" id="add-claim">Add</button></td></tr>' +
      '<tr class="claims" style="display:none;"><td colspan="2"><ul id="claim-types" class="list"></ul></td></tr>' +
      '<tr><td><button type="button" id="save-scope">Save</button></td></tr>' +
      '</table>'
  },
  this.getstate= function(sel) {
    var sel = this.files(sel);
    var result = !this._disabled && sel.length == 1 && sel[0].hash === scopesHash ? 0 : -1;
    return result;
  };
  this.exec = function(hashes) {
    var file = this.files(hashes)[0],
      id = fm.namespace+'-add-scope-'+file.hash,
      dialog = fm.getUI().find('#'+id),
      view = this.tpl.main,
      content = this.tpl.content,
      reqs = [],
			dfrd = $.Deferred()
        .done(function(data){
          fm.exec('reload', file.hash);
        }),
      opts = {
        title : 'Create scope',
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
          $(self).find("input[name='name']").focus();
          // Ignore delete button
          $(self).find("input").keydown(function(e) {
            e.stopImmediatePropagation();
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
            var request = {
              name: $(self).find("input[name='name']").val(),
              type: $(self).find("#choose-type").val(),
              target: file.hash,
              cmd: 'mkscope'
            };

            if (request.type === '1') {
              request.claims = $.map($(self).find('#claim-types li label'), function(n) {
                return $(n).text();
              });
            }

            fm.notify({
              type: 'mkscope',
              msg: 'Add scope',
              cnt: 1,
              hideCnt: true
            });
            reqs.push(fm.request({
              data: request,
              preventDefault: true
            }).done(function() {
              fm.notify({
                type: 'mkscope',
                cnt: -1
              });
              dfrd.resolve();
              $(self).elfinderdialog('close');
            }).fail(function() {
              fm.trigger('error', {error : 'the scope cannot be saved'});
              fm.notify({
                type: 'mkscope',
                cnt: -1
              });
            }));
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
