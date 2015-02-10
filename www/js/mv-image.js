/* jshint browser:true, devel:true */
/* global $ */

(function() {

  'use strict';

  var NR_IMAGE_BUFFERS = 2;

  function MvImageLoader(imageUrl, msecsPeriod, appendDummyParam) {
    this.callback = null;
    this.period = msecsPeriod;
    this.url = imageUrl;
    this.appendDummyParam = appendDummyParam;
    this.working = false;
    this.timeoutID = 0;
    this.startTime = 0;

    if (NR_IMAGE_BUFFERS > 0) {
      this.images = {};
      this.imageIdx = 0;
    }
  }

  MvImageLoader.prototype.load = function (timeout) {
    if (timeout === undefined || timeout < 0)
      timeout = 0;

    var self = this;

    self.timeoutID = setTimeout(function () {
      self.timeoutID = 0;

      // Record the start time.
      self.startTime = +(new Date()); // new Date().getTime()

      var image;
      if (NR_IMAGE_BUFFERS > 0) {
        if (!self.images[self.imageIdx]) {
          self.images[self.imageIdx] = new Image();
          self.images[self.imageIdx].crossOrigin = 'anonymous';
        }
        image = self.images[self.imageIdx];
        self.imageIdx = (self.imageIdx + 1) % NR_IMAGE_BUFFERS;
      } else {
        image = new Image();
      }

      image.onload = function () {
        if (!self.working) {
          image.onload = null;
          image.onerror = null;
          image.onabort = null;
          image = null;
          return;
        }

        if (self.callback) { self.callback(0, this); }

        image.onload = null;
        image.onerror = null;
        image.onabort = null;
        image = null;

        if (self.period < 0)
          return;

        // Reload images.
        var elapsed = +(new Date()) - self.startTime;
        var timeout = self.period - elapsed;
        self.load(timeout);
      };
      image.onerror = function () {
        if (self.callback) { self.callback(2, null); }
        self.stop();

        image.onload = null;
        image.onerror = null;
        image.onabort = null;
        image = null;
      };
      image.onabort = function () {
        if (self.callback) { self.callback(1, null); }
        self.stop();

        image.onload = null;
        image.onerror = null;
        image.onabort = null;
        image = null;
      };

      // 'timestamp' is dummy parameter to avoid browser cache.
      // But, In Samsung Galaxy S3, adding this parameter causes image memory
      // allocation failure.
      if (self.appendDummyParam)
        image.src = self.url + '&timestamp=' + self.startTime;
      else
        image.src = self.url;
    }, timeout);
  };

  MvImageLoader.prototype.start = function () {
    if (this.working)
      return;
    this.working = true;

    this.load();
  };

  MvImageLoader.prototype.stop = function () {
    if (!this.working)
      return;
    this.working = false;

    if (this.timeoutID > 0) {
      clearTimeout(this.timeoutID);
      this.timeoutID = 0;
    }

    for (var i = 0; i < NR_IMAGE_BUFFERS; i++) {
      if (this.images[i]) {
        this.images[i].onload = null;
        this.images[i].onerror = null;
        this.images[i].onabort = null;
        delete this.images[i];
        this.images[i] = null;
      }
    }
  };

  function MvImageLive(_canvas, _device) {
    var self = this;

    var canvas = _canvas;
    var device = _device;
    var n_cameras = device.cameraTotal || 16;
    var n_columns = 1;
    var n_rows = 1;
    var period = 1000 / device.mjpegFrameRate;
    var selected_camera = 0;
    var started = false;
    var fill = false;
    var i;

    // Initialize camera list.
    var cameras = [];
    var viewCameras = [];
    for (i = 0; i < n_cameras; i++) {
      var camera = {
        id: i,
        name: 'Camera ' + (i + 1),
        viewID: i,
        image: null,
        loader: null,
        size: { width: 0, height: 0 },
        viewRect: { x: 0, y: 0, width: 0, height: 0 },
        rect: { x: 0, y: 0, width: 0, height: 0 }
      };
      cameras.push(camera);
      viewCameras.push(camera.id);
    }

    self.ondraw = null;
    self.onclear = null;
    self.ondrawselection = null;

    function updateViewRect(camera) {
      if (camera.size.width <= 0 || camera.size.height <= 0)
        return;

      var view_width = Math.floor(canvas.width / n_columns);
      var view_height = Math.floor(canvas.height / n_rows);
      camera.rect.x = view_width * Math.floor(camera.viewID % n_columns);
      camera.rect.y = view_height * Math.floor(camera.viewID / n_columns);

      camera.viewRect.x = camera.rect.x;
      camera.viewRect.y = camera.rect.y;
      camera.viewRect.width = view_width;
      camera.viewRect.height = view_height;

      if (fill) {
        camera.rect.width = view_width;
        camera.rect.height = view_height;
      } else {
        var image_width = camera.size.width;
        var image_height = camera.size.height;

        // Adjust image ratio for 4:3.
        if ((image_width == 320 ||
             image_width == 352 ||
             image_width == 640 ||
             image_width == 704 ||
             image_width == 720) &&
            (image_height == 240 ||
             image_height == 288 ||
             image_height == 480 ||
             image_height == 486 ||
             image_height == 576)) {
          image_height = Math.floor((image_width * 3) / 4);
        }

        // Calcluate image position.
        camera.rect.height = Math.floor((image_height * view_width) / image_width);
        if (camera.rect.height <= view_height)
          {
            camera.rect.width = view_width;
            camera.rect.y += Math.floor((view_height - camera.rect.height) / 2);
          }
        else
          {
            camera.rect.width = Math.floor((image_width * view_height) / image_height);
            camera.rect.height = view_height;
            camera.rect.x += Math.floor((view_width - camera.rect.width) / 2);
          }        
      }
    }

    // Draw camera image.
    function drawImage(camera) {
      var image = camera.image;
      if (!image || image.width === 0 || image.height === 0)
        return;

      if (camera.viewID < 0)
        return;

      if (camera.size.width != image.width ||
          camera.size.height != image.height) {
        camera.size.width = image.width;
        camera.size.height = image.height;
        updateViewRect(camera);
      }

      if (self.ondraw)
        self.ondraw(image, camera);
    }
    
    // Get current camera object
    this.getCameraImage = function (camera) {
      return cameras[camera].image;
    };

    this.start = function () {
      if (started)
        return;
      started = true;

      self.relayout();
    };

    function startLoader(camera) {
      if (!camera.loader) {
        var url = 'http://' +
                  device.address +
                  ':' + device.httpPort +
                  '/mjpeg.cgi?' +
                  $.param( {
                    snapshot: 'on',
                    user: device.user,
                    password: device.password,
                    channel: camera.id
                  }, true);
        var appendDummyParam = device.isPhoneGap ? false : true;
        camera.loader = new MvImageLoader(url, period, appendDummyParam);
        camera.loader.callback = function (error, image) {
          if (error > 0) {
            console.warn('error ' + error + ' url:' + url);
            return;
          }

          if (!started)
            return;

          delete camera.image;
          camera.image = null;
          camera.image = image;
          drawImage(camera);
        };
      }
      camera.loader.start();
    }

    function stopLoader(camera) {
      if (camera.loader) {
        camera.loader.callback = null;
        camera.loader.stop();
        camera.loader = null;
      }
      delete camera.image;
      camera.image = null;
    }

    this.stop = function () {
      if (!started)
        return;
      started = false;

      for (var i = 0; i < n_cameras; i++) {
        stopLoader(cameras[i]);
      }
    };

    this.redraw = function () {
      if (self.onclear)
        self.onclear();

      for (var i = 0; i < n_cameras; i++) {
        drawImage(cameras[i]);
      }

      if (self.ondrawselection) {
        var camera = cameras[selected_camera];
        if (camera)
          self.ondrawselection(camera);
      }
    };

    this.relayout = function (force) {
      var i;

      var n_views = n_columns * n_rows;
      var start = Math.floor(selected_camera / n_views) * n_views;
      var views = [];
      var changed = force ? true : false;

      for (i = 0; i < n_cameras; i++) {
        if (start <= i && i < (start + n_views)) {
          views.push(i);

          if (started) {
            startLoader(cameras[i]);
          } else {
            stopLoader(cameras[i]);
          }
          cameras[i].viewID = i - start;

          updateViewRect(cameras[i]);
        } else {
          stopLoader(cameras[i]);
        }
      }
      for (i = n_cameras; i < (start + n_views); i++) {
        views.push(-1);
      }

      // Check whether layout is changed
      if (!changed) {
        if (views.length !== viewCameras.length) {
          changed = true;
        } else {
          for (i = 0; i < n_views; i++) {
            if (views[i] !== viewCameras[i]) {
              changed = true;
              break;
            }
          }
        }
      }
      viewCameras = views;
      
      if (!changed) {
        if (self.ondrawselection) {
          var camera = cameras[selected_camera];
          if (camera)
            self.ondrawselection(camera);
        }
      } else {
        self.redraw();
      } 
    };

    this.setFill = function (fillMode) {
      if (fill == fillMode)
        return;
      fill = fillMode;
      self.relayout(true);
    };

    this.setMode = function (rows, columns) {
      if (n_columns == columns && n_rows == rows)
        return;
      n_rows = rows;
      n_columns = columns;
      self.relayout();

      if (this.onmodechange)
        this.onmodechange({ rows: n_rows, columns: n_columns});
    };

    this.getMode = function () {
      return { rows: n_rows, columns: n_columns };
    };
    
    this.getViewCameras = function () {
      return viewCameras;
    };

    this.selectCamera = function (camera) {
      if (selected_camera == camera)
        return;

      if (self.onclearselection)
        self.onclearselection(cameras[selected_camera]);

      selected_camera = camera;
      self.relayout();

      if (this.oncamerachange)
        this.oncamerachange(cameras[selected_camera]);
    };

    this.getCameraforPoint = function (x, y) {
      var view_width = Math.floor(canvas.width / n_columns);
      var view_height = Math.floor(canvas.height / n_rows);
      var view_id = Math.floor(y / view_height) * n_columns + Math.floor(x / view_width);
      return { viewID: view_id, cameraID: viewCameras[view_id] };
    };
  }

  window.createMvImageLive = function (canvas, host) {
    return new MvImageLive(canvas, host);
  };
}());
