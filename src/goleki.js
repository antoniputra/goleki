/* global window, document, define, jQuery, setInterval, clearInterval */
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Goleki = window.Goleki || {};

    Goleki = (function() {

    	function Goleki(element, options) {
    		var self = this;
			
			// property
			self.element = element;
			self.$element = $(element);
    		self.$elementData = self.$element.data() || {};
			self.defaults = $.fn.goleki.options;
	        
	        self.options = $.extend({}, self.defaults, options);
	        self.options.templates = $.extend({}, self.defaults.templates, options.templates);

	        self.items = undefined;
	        self.itemsObj;

	        // blacklist : ctrl, tab, home, end, page-up/down, and arrow.
	        self.blacklistASCI = [38, 39, 40, 37, 17, 36, 35, 34, 33];

	        self.timer;

	        // console.log(self.options);

    		self.init();
    	}

    	return Goleki;

    }());

    Goleki.prototype.init = function() {
    	var self = this;

    	self.setupElement();
    	self.cycle();
    }

    Goleki.prototype.cycle = function() {
    	var self = this;

    	self.$element.on('keyup', function(e) {
			var input = this;

    		// when input value is empty, and user press backspace.
    		// we will remove all latest items. and clear result container
    		if (input.value.length < 1 && e.which == 8) {
    			self.items = undefined;
    			self.toggleContainerAutocomplete('none');
    			self.$autocompleteContent.html('');
    			self.hideLoading();
    			return;
    		};

    		// disable for not printable character except backspace.
    		if (e.which < 0x20 && e.which != 8) {
    			return;
    		}

			// disable when user press arrow
			if($.inArray(e.which, self.blacklistASCI) !== -1)
			{
				return ;
			}

			self.showLoading();

	    	clearTimeout(self.timer);
			self.timer = setTimeout(function() {

				if (input.value.length < 1) {

					self.$autocompleteContent.html('');
					return ;
				}

				// search local source
				if (typeof self.options.source === 'object') {
					self.fetchLocal(self.options.source, input.value, function(results) {
						self.setItems(results);
		    			self.renderDisplay();
					});
				}

				// search remote source
				else {
					var request = self.fetch(input.value);

		    		request.done(function(results) {
		    			self.setItems(results);
		    			self.renderDisplay();
		    		});

		    		request.fail(function() {
		    			self.fail();
		    		});
				}

			}, self.options.typeTimeout || 800)
		});

		self.$element.on('focus', function(e) {
			if (typeof self.items !== 'undefined') {
				self.toggleContainerAutocomplete('block');
			}
		});

		self.$element.on('focusout', function(e) {
			setTimeout(function() {
				return self.toggleContainerAutocomplete('none');
			}, 200);
		});
    }

    Goleki.prototype.setItems = function(results) {
    	var self = this,
    		itemTemplate = self.options.templates.item,
    		items = self.options.jsonData ? results[self.options.jsonData] : results,
    		li = $('<li></li>');

		self.itemsObj = items;

		// if no data, we'll make "items" property undefined
		if (items.length < 1) {
			self.items = undefined;
		};

		// render each element of item
    	self.items = $.map(items, function(obj, i) {

    		// if user using function
    		if (typeof itemTemplate === 'function') {
    			var item = $(itemTemplate(obj));
    		}

    		// if user using jquery object
    		// comingsoon
    		else if(itemTemplate instanceof jQuery) {
    			var item = $(itemTemplate);
    		}

    		// using default
    		else {
    			var item = $(itemTemplate).text(obj);
    		}

    		item.addClass('goleki-item').attr('data-goleki-key', i);
    		li.append(item);
    		return li[0];
    	});

    }

    Goleki.prototype.renderDisplay = function() {
    	var self = this;

    	self.hideLoading();
    	self.$containerAutocomplete.css('display', 'block');

    	if($.isEmptyObject(self.items)) {
    		self.empty();
    	} else {
    		self.$autocompleteContent.html(self.items);
    	}
    }

    Goleki.prototype.fetch = function(keyword, page) {
    	var self = this,
    		params;

		params = self.options.sourceParams || {
			q: keyword,
			page: page || 1
		};

    	return $.ajax({
    		url: self.options.source,
    		data: params,
    		dataType: 'json',
    		method: "GET",
    		cache: true
    	});
    }

    Goleki.prototype.fetchLocal = function(strs, q, callback) {
		var matches, substrRegex;

		// an array that will be populated with substring matches
		matches = [];

		// regex used to determine if a string contains the substring `q`
		substrRegex = new RegExp(q, 'i');

		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		$.each(strs, function(i, str) {
			if (substrRegex.test(str)) {
				matches.push(str);
			}
		});

		return callback(matches);
    }

    Goleki.prototype.setupElement = function() {
    	var self = this,
    		$container = self.getContainer();

		self.$element.attr('autocomplete', 'off');

		// if user use "loading" property as object. we will hidden first.
		if (typeof self.options.templates.loading === 'object') {
			self.options.templates.loading.css({'display': 'none'});
		}

		$container.insertBefore(self.$element)
    		.append(self.$element);

		$container.on('click', '.goleki-item', function(e) {
			var $this = $(this),
				obj = self.itemsObj[$this.data('goleki-key')];

			if (typeof self.options.onSelectItem === 'function') {
				return self.options.onSelectItem(e, self, self.$element, obj);
			} else {
				return self.$element.val(
					$this.data('result') || $.trim($this.text())
				);
			}

			// example of trigger
			// return $this.trigger('goleki:select', [e, obj]);
		});

    	self.getContainerAutocomplete()
    		.insertAfter(self.$element)
    		.append(self.getAutocompleteContent());
    }

    Goleki.prototype.getContainer = function() {
    	var self = this,
    		el;

    	if(self.options.templates.container)
    	{
    		el = $(self.options.templates.container);
    	} else {
	    	el = $('<div></div>', {
	    		css: {'position': 'relative'}
	    	});
    	}

    	self.$container = el;
    	return self.$container;
    }

    Goleki.prototype.getContainerAutocomplete = function() {
    	var self = this,
    		el;

    	if(self.options.templates.containerAutocomplete)
    	{
    		el = $(self.options.templates.containerAutocomplete);
    	} else {
    		el = $('<div></div>', {
    			css: {
	    			"background": "#fff",
	    			"border": "1px solid #bbb"
    			}
    		});
    	}

    	self.$containerAutocomplete = el.css({
			"position": "absolute",
			"top": self.$element.outerHeight(),
			"width": '100%',
			"display": 'none',
			"z-index": '999',
			"overflow-y": 'auto',
			"max-height": '260px'
		});

		return self.$containerAutocomplete;
    }

    Goleki.prototype.getAutocompleteContent = function() {
    	var self = this,
    		el;

		if(self.options.templates.autocompleteContent)
    	{
    		el = $(self.options.templates.autocompleteContent);
    	}

    	self.$autocompleteContent = el;
    	// self.$autocompleteContentItem = $('<li></li>');
    	return self.$autocompleteContent;
    }

    Goleki.prototype.toggleContainerAutocomplete = function(forceValue) {
    	var self = this,
    		container = self.$containerAutocomplete;
    	
    	if (typeof forceValue !== 'undefined') {
    		container.css('display', forceValue);
    	} else if (container.css('display') == 'block') {
    		container.css('display', 'none');
    	} else {
    		container.css('display', 'block');
    	}
    }

    Goleki.prototype.showLoading = function() {
    	var self = this,
    		theLoading = self.options.templates.loading;

    	if (typeof theLoading === 'object') {
    		theLoading.css({'display': 'block'});
    	} else {
    		self.toggleContainerAutocomplete('block');
    		self.$autocompleteContent.html('<li><a>'+ self.options.templates.loading +'</a></li>');
    	}
    }

    Goleki.prototype.hideLoading = function() {
    	var self = this,
    		theLoading = self.options.templates.loading;

    	if (typeof theLoading === 'object') {
    		theLoading.css({'display': 'none'})
    	} else {
    		self.$autocompleteContent.html('');
    	}
    }

    Goleki.prototype.empty = function() {
    	var self = this,
    		theEmpty = self.options.templates.empty;

    	if (typeof theEmpty === 'function') {
    		var el = theEmpty(self.$element);
    	} else {
    		var el = '<a>'+ theEmpty +'</a>';
    	}
		return self.$autocompleteContent.html('<li>'+ el +'</li>');
    }

    Goleki.prototype.fail = function() {
    	var self = this,
    		theFail = self.options.templates.fail;

    	if (typeof theFail === 'function') {
    		var el = theFail(self.$element);
    	} else {
    		var el = '<a>'+ theFail +'</a>';
    	}
    	return self.$autocompleteContent.html('<li>'+ el +'</li>');
    }




    $.fn.goleki = function() {

        var self = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = self.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                self[i].goleki = new Goleki(self[i], opt);
            else
                ret = self[i].goleki[opt].apply(self[i].goleki, args);
            if (typeof ret != 'undefined') return ret;
        }
        return self;
    };

    // default options
    $.fn.goleki.options = {
    	source: null,
    	sourceParams: null,
    	jsonData: false,
    	typeTimeout: 800,

    	// event
    	onSelectItem: null,

    	// templates
    	templates: {
	    	container: null,
	    	containerAutocomplete: null,
	    	autocompleteContent: '<ul class="nav"></ul>',
	    	item: '<a></a>',
	    	loading: 'loading...',
	    	empty: 'There is no data',
	    	fail: 'whoops something went wrong when request api.'
    	}
    }

}));