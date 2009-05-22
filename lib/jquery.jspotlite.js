(function($) {
    $.fn.jspotlite = function(options) {
        return this.each(function() {
            new $js(this, options);
        });
    };

    var defaults = {
        horizontal: false,

        spotlite: {
            effect: {},
            animation: {}
        },

        start: 1,
        delay: 3,
        hoverPause: true,
        autoRestart: true,
        itemEvent: "click",
        buttonNextHTML:  "<div>",
        buttonPauseHTML: "<div>",
        buttonPrevHTML:  "<div>",
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
        this.options = $.extend(true, this.options, defaults, o || {});

        // Find our list and ensure our wrappers.
        if (e.nodeName == "UL" || e.nodeName == "OL") {
            this.list = $(e);
            this.container = this.list.parent();

            if (!this.container.hasClass("jspotlite-container")) {
                this.container = this.list.wrap("<div>").parent().addClass("jspotlite-container");
            }
        }
        else {
            this.container = $(e);
            this.list = $(e).find(">ul,>ol,div>ul,div>ol");
        }

        // Make sure we've got a wrapper sections created.
        this.spotlite = this.ensureSection("jspotlite-spotlite");

        // Update our list of items.
        this.refresh();

        // Put the first item in the spotlight, and start the rotation.
        this.select(0);

        // Make sure these sections have all the class names they need.
        this.list.addClass(this.className("jspotlite-list"));
        this.container.addClass(this.className("jspotlite-container"));

        // Attach behaviors to any buttons
        $('.jspotlite-control', this.container).each(function() {
            self.attachButtons(this);
        });

        if (this.options.hoverPause) {
            // If they show interest in the spotlite stop rotating for a moment.
            this.container.hover(
                function() { self.stop(); },
                function() { self.restart(); }
            );
        }

        // Attach our event to our elements so they can be brought into the spotlite.
        $.each(this.items, function(i) {
            $(self.items[i]).bind(self.options.itemEvent, function() {
                self.select(i);
            });
        });

        // Start automated rotation.
        this.start();
    };

    var $js = $.jspotlite;

    $js.fn = $js.prototype = {
        jspotlite: "0.1"
    };

    $js.fn.extend = $js.extend = $.extend;

    // Attach our prototype functions.
    $js.fn.extend({
        attachButtons: function(context) {
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
            $(context).addClass(this.className("jspotlite-control"));

            // Make sure we've got any buttons we need. 
            var self = this;
            $.each(this.buttonData, function(i, d) {
                d.button = $("." + d.jsClass, context);
                if (d.button.size() == 0 && d.html != null) {
                    d.button = $(d.html);
                    d.button.appendTo(context);
                }

                // Ensure the button has all the class names it needs and make sure its visible.
                d.button.addClass(self.className(d.jsClass))
                    .show().css('display', 'block');
            });
            this.buttons();
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
                section = $("<div>");
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
        effect: function(e, effect) {
            //
        },
        select: function(idx) {
            if (e = this.items.get(idx)) {
                this.index = idx;
                var self = this;

                // TODO add transition.
                this.items.removeClass("jspotlite-active");
                $(e).addClass("jspotlite-active");

                $js.animate(this.options.spotlite,
                    $('.jspotlite-spotlite-content', this.spotlite),
                    $('<div>').html($(".feature", e).html())
                        .addClass('jspotlite-spotlite-content')
                        // This css is convenient but should probably be in style sheet.
                        .appendTo($(this.spotlite))
                );
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
        /**
         * Animate between two elements...
         */
        animate: function(o, $e1, $e2) {
            var t = typeof $e2;
            if (typeof o.effect.name != 'undefined') {
                // Do this the UI way.
                var e = o.effect;

                $e1.effect(e.name, e.options, e.speed, function() {
                    $(this).remove();
                });

                if (t == "object" && $e2 != Null) {
                    $e2.effect(e.name, e.options, e.speed, function() {
                        //
                    });
                }
            }
            /* Completly custom animation */
            else if (typeof o.animation.easing != 'undefined') {
                var a = o.animation;
                $e1.animate(a.hide, a.duration, a.easing, function() {
                    $(this).remove();
                });

                if (t == "object" && $e2 != null) {
                    $e2.css(a.hide).animate(a.show, a.duration, a.easing, function() {
                        //
                    });
                }
            }
            else if (typeof o.animate == 'function') {
                o.animate(o, $e1, $e2);
            }
            else if (t == "object" && $e2 != null) {
                $e1.remove();
                $e2.show();
            }

            return true;
        }
    });

})(jQuery);
