/*!
 * jQuery Mobile Events
 * by Ben Major (www.ben-major.co.uk)
 *
 * Copyright 2011, Ben Major
 * Licensed under the MIT License:
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */

(function($) {

	var settings = {
		swipe_h_threshold : 50,
		swipe_v_threshold : 50,
		taphold_threshold : 1000,
		doubletap_int     : 200,
		touch_capable     : ('ontouchstart' in document.documentElement),
		startevent        : ('ontouchstart' in document.documentElement) ? 'touchstart' : 'mousedown',
		endevent		  : ('ontouchstart' in document.documentElement) ? 'touchend'   : 'mouseup'
	};
	
	// tap Event:
	$.fn.tap = function(handler) {
		return this.each(function() {
			
			var $this = $(this);
			var started = false;			
			
			$this.bind(settings.startevent, function(e) {
				e.preventDefault();
				started = true;
			});
			
			$this.bind(settings.endevent, function() {				
				if(started)
				{
					handler.call(this, event);
				}
			});
		});
	};
	
	// doubletap Event:
	$.fn.doubletap = function(handler) {
		return this.each(function() {
			
			var $this = $(this);
			var delay = settings.doubletap_int;
			var action;
			
			$this.bind(settings.endevent, function(event) {
				var now = new Date().getTime();
				var lastTouch = $this.data('lastTouch') || now + 1;
				var delta = now - lastTouch;
				clearTimeout(action);
				if(delta < settings.doubletap_int && delta > 0)
				{
					if(handler !== null)
					{
						handler.call(this, event);
					}
				}
				else
				{
					$this.data('lastTouch', now);
					action = setTimeout(function(evt){ clearTimeout(action); }, delay, [event]);
				}
				$this.data('lastTouch', now);
			});			
		});
	};
	
	// tapstart Event:
	$.fn.tapstart = function(handler) {
		return this.each(function() {
			
			var $this = $(this);
			
			$this.bind(settings.startevent, function(event) {
				handler.call(this, event);
			});
		});
	};
	
	// tapend Event:
	$.fn.tapend = function(handler) {
		return this.each(function() {
			
			var $this = $(this);
			$this.bind(settings.endevent, function(event) {
				handler.call(this, event);
			});
		});
	};
	
	// taphold Event:
	$.fn.taphold = function(handler) {
		return this.each(function() {
			
			var $this = $(this);
			var start_time = Date.now();
			var timer = null;
			var target = null;
			
			$this.bind(settings.startevent, function(event) {
				target = event.target;
				timer = setTimeout(function() {
					if(event.target == target)
					{
						handler.call(this, event);
					}
				}, settings.taphold_threshold);
			});
			
			$this.bind(settings.endevent, function(event) {
				clearTimeout(timer);
			});
		});
	};
	
	// swipe Event:
	// (also handles swipeup, swiperight, swipedown and swipeleft shortcuts)
	$.fn.swipe = function(upfn, rightfn, downfn, leftfn) {
		
		return this.each(function() {
			$this = $(this);
			
			// Private variables for each element
			var originalCoord = { x: 0, y: 0 };
			var finalCoord    = { x: 0, y: 0 };
			
			// If it's a mobile, we use touch events, otherwise, use mouse events:
			if(settings.touch_capable)
			{
				// Screen touched, store the original coordinate
				function touchStart(event)
				{
					originalCoord.x = event.targetTouches[0].pageX;
					originalCoord.y = event.targetTouches[0].pageY;
				}
				
				// Store coordinates as finger is swiping
				function touchMove(event)
				{
					event.preventDefault();
					finalCoord.x = event.targetTouches[0].pageX;
					finalCoord.y = event.targetTouches[0].pageY;
				}
				
				function touchEnd(event)
				{
					// swipeup:
					if(originalCoord.y > finalCoord.y && (originalCoord.y - finalCoord.y > settings.swipe_v_threshold))
					{
						if(upfn !== undefined)
						{
							upfn.call(this, event);
						}
					}
					
					// swiperight:
					if(originalCoord.x < finalCoord.x && (finalCoord.x - originalCoord.x > settings.swipe_h_threshold))
					{
						if(rightfn !== undefined)
						{
							rightfn.call(this, event);
						}
					}
					
					// swipedown:
					if(originalCoord.y < finalCoord.y && (finalCoord.y - originalCoord.y > settings.swipe_v_threshold))
					{
						if(downfn !== undefined)
						{
							downfn.call(this, event);
						}
					}
					
					// swipeleft:
					if(originalCoord.x > finalCoord.x && (originalCoord.x - finalCoord.x > settings.swipe_h_threshold))
					{
						if(leftfn !== undefined)
						{
							leftfn.call(this, event);
						}
					}
				}
				
				// Swipe was started
				function touchStart(event)
				{
					originalCoord.x = event.targetTouches[0].pageX;
					originalCoord.y = event.targetTouches[0].pageY;
					finalCoord.x = originalCoord.x;
					finalCoord.y = originalCoord.y;
				}
				
				// Swipe was canceled
				function touchCancel(event)
				{ 
					//console.log('Canceling swipe gesture...')
				}
				
				// Add gestures to all swipable areas
				this.addEventListener('touchstart', touchStart, false);
				this.addEventListener('touchmove', touchMove, false);
				this.addEventListener('touchend', touchEnd, false);
				this.addEventListener('touchcancel', touchCancel, false);
			}
			else
			{
				// Screen touched, store the original coordinate
				function touchStart(event)
				{
					originalCoord.x = event.pageX;
					originalCoord.y = event.pageY;
				}
				
				// Store coordinates as finger is swiping
				function touchMove(event)
				{
					event.preventDefault();
					finalCoord.x = event.pageX;
					finalCoord.y = event.pageY;
				}
				
				function touchEnd(event)
				{
					// swipeup:
					if(originalCoord.y > finalCoord.y && (originalCoord.y - finalCoord.y > settings.swipe_v_threshold))
					{
						if(upfn !== undefined)
						{
							upfn.call(this, event);
						}
					}
					
					// swiperight:
					if(originalCoord.x < finalCoord.x && (finalCoord.x - originalCoord.x > settings.swipe_h_threshold))
					{
						if(rightfn !== undefined)
						{
							rightfn.call(this, event);
						}
					}
					
					// swipedown:
					if(originalCoord.y < finalCoord.y && (finalCoord.y - originalCoord.y > settings.swipe_v_threshold))
					{
						if(downfn !== undefined)
						{
							downfn.call(this, event);
						}
					}
					
					// swipeleft:
					if(originalCoord.x > finalCoord.x && (originalCoord.x - finalCoord.x > settings.swipe_h_threshold))
					{
						if(leftfn !== undefined)
						{
							leftfn.call(this, event);
						}
					}
				}
				
				// Swipe was started
				function touchStart(event)
				{
					originalCoord.x = event.pageX;
					originalCoord.y = event.pageY;
					finalCoord.x 	= originalCoord.x;
					finalCoord.y 	= originalCoord.y;
				}
				
				// Add gestures to all swipable areas
				this.addEventListener('mousedown', touchStart, false);
				this.addEventListener('mousemove', touchMove, false);
				this.addEventListener('mouseup', touchEnd, false);
			}
		});
	};
	
	// swipeup Event:
	$.fn.swipeup = function(handler) {
		return this.swipe(handler, undefined, undefined, undefined);
	};
	
	// swiperight Event:
	$.fn.swiperight = function(handler) {
		return this.swipe(undefined, handler, undefined, undefined);
	};
	
	// swipedown Event:
	$.fn.swipedown = function(handler) {
		return this.swipe(undefined, undefined, handler, undefined);
	};
	
	// swipeleft Event:
	$.fn.swipeleft = function(handler) {
		return this.swipe(undefined, undefined, undefined, handler);
	};  
}) (jQuery);