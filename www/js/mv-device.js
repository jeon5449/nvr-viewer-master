/* jshint browser:true, devel:true */

(function() {

  'use strict';

  function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
  }

  function MvDevice() {

    var self = this;

    var devices = [];

    // Load initial device list from database.
    var db = localStorage.getItem('mvDevices');
    if (db)
      devices = JSON.parse(db);
    db = null;

    function notify(event, idx, device) {
      if (self.onchange)
        self.onchange(event, idx, device);
    }

    self.list = function () {
      return devices;
    };

    self.lookup = function (uuid) {
      var idx;
      for (idx = 0; idx < devices.length; idx++)
        if (devices[idx].uuid == uuid)
          return idx;
      return -1;
    };
    
    self.get = function (uuid) {
      var idx = this.lookup(uuid);
      if (idx < 0)
        return null;
      return devices[idx];
    };    

    self.append = function (device) {
      device.uuid = generateUUID();
      devices.push(device);
      notify('append', devices.length - 1, device);

      localStorage.setItem('mvDevices', JSON.stringify(devices));
    };

    self.remove = function (uuid) {
      var idx = this.lookup(uuid);
      if (idx < 0)
        return;
      notify('remove', idx, devices[idx]);
      devices.splice(idx, 1);

      localStorage.setItem('mvDevices', JSON.stringify(devices));
    };

    self.modify = function (device) {
      var idx = this.lookup(device.uuid);
      if (idx < 0)
        return;
      devices[idx] = device;
      notify('modify', idx, device);

      localStorage.setItem('mvDevices', JSON.stringify(devices));
    };

    self.getThumbnail = function (uuid) {
      var idx = this.lookup(uuid);
      if (idx < 0)
        return;
      var device = devices[idx];
      return device.thumbnail ? device.thumbnail : 'images/device-face.png';
    };

    self.setThumbnail = function (uuid, imageSrc) {
      var idx = this.lookup(uuid);
      if (idx < 0)
        return;
      var device = devices[idx];
      device.thumbnail = imageSrc;
      notify('modify', idx, device);

      localStorage.setItem('mvDevices', JSON.stringify(devices));
    };
  }

  window.mvDevice = new MvDevice();
}());
