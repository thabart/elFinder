"use strict";
elFinder.prototype.stores.openIdStore = function(fm) {
  var instance = null;

  var openIdStorage = function() {
    var self = this;
    var clients = [];
    var isClientsLoaded = false;
    var _fm = fm;
    self.getOpenIdClients = function() {
      if (!isClientsLoaded) {
        return self.refreshClients();
      }

      var dfd = jQuery.Deferred();
      dfd.resolve(clients)
      return dfd;
    };
    self.refreshClients = function() {
      var dfd = jQuery.Deferred();
      fm.request({
        data: { cmd: 'openidclients' },
        preventDefault: true
      }).done(function(cls) {
        clients = cls;
        isClientsLoaded = true;
        dfd.resolve(cls);
      }).fail(function() {
        dfd.reject();
      });
      return dfd;
    };
  };

  var createInstance = function() {
    instance = new openIdStorage();
  };

  return {
    getInstance: function() {
      if (instance === null) {
        createInstance();
      }

      return instance;
    }
  };
};
