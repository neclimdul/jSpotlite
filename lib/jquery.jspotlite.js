(function($) {
    $.fn.jspotlite = function(options) {
        return this.each(function() {
            new $js(this, options);
        });
    };
    gcount = 0;

    var defaults = {
        horizontal: false,
        // These animation controls are not yet implemented.
        animation: "normal",
        easing: "swing",
        start: 1,
        delay: 3,
        hoverPause: true,
        autoRestart: true,
        itemEvent: "click",
        buttonNextHTML:  "<div></div>",
        buttonPauseHTML: "<div></div>",
        buttonPrevHTML:  "<div></div>",
        buttonNextEvent:  "click",
        buttonPauseEvent: "click",
        buttonPrevEvent:  "click",
        buttonNextCallback:  null,
        buttonPauseCallback: null,
        buttonPrevCallback:  null
    };

    $.jspotlite = function (e, o) {
        // The ever useful self variable defies scope yet again.
        var self = this;

        // Build a full list of options.
        this.options    = $.extend({}, defaults, o || {});

        // Find our list and ensure our wrappers.
        if (e.nodeName == "UL" || e.nodeName == "OL") {
            this.list = $(e);
            this.container = this.list.parent();

            if (!this.container.hasClass("jspotlite-container")) {
                this.container = this.list.wrap("<div></div>").parent().addClass("jspotlite-container");
            }
        }
        else {
            this.container = $(e);
            this.list = $(e).find(">ul,>ol,div>ul,div>ol");
        }

        // Make sure these sections have all the class names they need.
        this.list.addClass(this.className("jspotlite-list"));
        this.container.addClass(this.className("jspotlite-container"));

        // Make sure we've got a wrapper sections created.
        this.controls = this.ensureSection("jspotlite-control");
        this.spotlite = this.ensureSection("jspotlite-spotlite");

        // A handy hash for passing around information about our buttons.
        this.buttonData = {
            prev: {
                event: this.options.buttonPrevEvent,
                eFunc: function() { self.prev(); },
                jsClass: "jspotlite-prev",
                html: this.options.buttonPrevHTML
            },
            pause: {
                event: this.options.buttonPauseEvent,
                eFunc: function() { self.paused ? self.start() : self.pause(); },
                jsClass: "jspotlite-pause",
                html: this.options.buttonPauseHTML
            },
            next: {
                event: this.options.buttonNextEvent,
                eFunc: function() { self.next(); },
                jsClass: "jspotlite-next",
                html: this.options.buttonNextHTML
            }
        }

        // Make sure we've got any buttons we need. 
        $.each(this.buttonData, function(i, d) { self.ensureButton(d); });

        if (this.options.hoverPause) {
            // If they show interest in the spotlite stop rotating for a moment.
            this.container.hover(
                function() { self.stop(); },
                function() { self.restart(); }
            );
        }

        // Update our list of items.
        this.refresh();

        // Attach our event to our elements so they can be brought into the spotlite.
        $.each(this.items, function(i) {
            $(self.items[i]).bind(self.options.itemEvent, function() {
                self.select(i);
            });
        });

        // Put the first item in the spotlight, and start the rotation.
        this.select(0);
        this.start();
    };

    var $js = $.jspotlite;

    $js.fn = $js.prototype = {
        jspotlite: "0.1"
    };

    $js.fn.extend = $js.extend = $.extend;

    $js.fn.extend({
        /**
         * Ensure that control buttons exist if needed.
         *
         * @param c
         * The class of the button. eg. jspotlite-prev
         * @param h
         * The html used that populates the button.
         * @return
         * The button jquery object.
         */
        ensureButton: function(d) {
            d.button = $("." + d.jsClass, this.container);
            if (d.button.size() == 0 && d.html != null) {
                d.button = $(d.html);
                d.button.appendTo(this.controls);
            }
            // Ensure the button has all the class names it needs and make sure its visible.
            d.button.addClass(this.className(d.jsClass)).show().css('display', 'block');
        },
        /**
         * Ensure that a wrapper sections exists.
         * 
         * @param c
         * The class of the section. eg. jspotlite-spotlite
         * @return
         * The sections jquery object.
         */
        ensureSection: function(c) {
            var section = $("." + c, this.container);
            if (section.size() == 0) {
                section = $("<div></div>");
                this.list.before(section);
            }
            // Ensure the section has all the class names it needs.
            return section.addClass(this.className(c));
        },
        /**
         * Refresh the item list.
         */
        refresh: function() {
            this.items = $("li", this.list);
            this.buttons();
        },
        /**
         * Bind events to buttons.
         *
         * TODO allow disabling of individual buttons.
         */
        buttons: function() {
            var self = this;
            $.each(this.buttonData, function(i, d) { self.button(d, true); });
        },
        /**
         * Callback function for binding the appropriate events to buttons.
         * @param d
         * Button data object. Contains references the jquery object for the button, and other options.
         * @param b
         * A boolean value that toggles binding or unbinding the button event.
         */
        button: function(d, b) {
            if (b) {
                d.button.bind(d.event, d.eFunc).removeClass(d.jsClass + "-disabled");
            }
            else {
                d.button.unbind(d.event, d.eFunc).addClass(d.jsClass + "-disabled");
            }
            d.button.attr('disabled', !Boolean(b));
        },
        select: function(idx) {
            if (e = this.items.get(idx)) {
                this.index = idx;
                // TODO add transition.
                this.items.removeClass("jspotlite-active");
                $(e).addClass("jspotlite-active");
                this.spotlite.html($(".feature", e).html());
                return true;
            }
            return false;
        },
        start: function() {
            if (this.options.delay) {
                this.running = true;
                this.delay(this.options.delay);
            }
        },
        stop: function() {
            this.running = false;
            clearTimeout(this.timer);
        },
        restart: function() {
            if (this.options.autoRestart && !this.paused) {
                this.start();
            }
        },
        pause: function() {
            this.stop();
            this.paused = true;
        },
        next: function() {
            if (!this.select(this.index + 1)) {
                this.select(0);
            }
            this.delay(this.options.delay);
        },
        prev: function() {
            if (!this.select(this.index - 1)) {
                this.select(0); // TODO some max?
            }
            this.delay(this.options.delay);
        },
        delay: function(d) {
            var self = this;
            clearTimeout(this.timer); // make sure there aren't stray timers.
            this.timer = setTimeout(function() { self.next(); }, d * 1000);
        },
        className: function(c) {
            return c + " " + c + (this.options.horizontal ? "-horizontal" : "-vertical");
        }
    });

    $js.extend({

    });
})(jQuery);
