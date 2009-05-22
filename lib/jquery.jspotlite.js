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

        start: 0,
        delay: 3,
        hoverPause: true,
        autoRestart: true,
        itemEvent: "click",
        buttonNextHTML:  "<div>",
        buttonPauseHTML: "<div>",
        buttonPrevHTML:  "<div>",
        buttonEvent:  "click",
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
        this.items = $("li", this.list);

        // Start automated rotation.
        this.start();

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
                function() { self.options.autoRestart && self.restart(); }
            );
        }

        // Attach our event to our elements so they can be brought into the spotlite.
        $.each(this.items, function(i) {
            $(self.items[i]).bind(self.options.itemEvent, function() {
                self.select(i);
            });
        });

    };

    var $js = $.jspotlite;

    $js.fn = $js.prototype = {
        jspotlite: "0.1"
    };

    $js.fn.extend = $js.extend = $.extend;

    // Attach our prototype functions.
    $js.fn.extend({
        index: 0,
        attachButtons: function(context) {
            // A handy hash for passing around information about our buttons.
            this.buttonData = {
                prev: {
                    eFunc: function() { self.prev(); },
                    jsClass: "jspotlite-prev",
                    html: this.options.buttonPrevHTML
                },
                pause: {
                    eFunc: function() { self.paused ? self.restart() : self.pause(); },
                    jsClass: "jspotlite-pause",
                    html: this.options.buttonPauseHTML
                },
                next: {
                    eFunc: function() { self.next(); },
                    jsClass: "jspotlite-next",
                    html: this.options.buttonNextHTML
                }
            };

            $(context).addClass(this.className("jspotlite-control"));

            // Make sure we've got any buttons we need. 
            var self = this;
            $.each(this.buttonData, function(i, d) {
                d.button = $("." + d.jsClass, context);
                if (d.button.size() === 0 && d.html !== null) {
                    d.button = $(d.html);
                    d.button.appendTo(context);
                }

                // Ensure the button has all the class names it needs and make sure its visible.
                d.button.addClass(self.className(d.jsClass))
                    .show().css('display', 'block')
                    .bind(self.options.buttonEvent, d.eFunc);
            });
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
            if (section.size() === 0) {
                section = $("<div>");
                this.list.before(section);
            }
            // Ensure the section has all the class names it needs.
            return section.addClass(this.className(c));
        },
        select: function(idx) {
            e = this.items.get(idx);
            if (e) {
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
            this.select(this.options.start);
            this.delay();
        },
        stop: function() {
            clearTimeout(this.timer);
        },
        restart: function() {
            if (!this.paused) {
                this.delay();
            }
        },
        pause: function() {
            this.stop();
            this.paused = true;
        },
        next: function() {
            this.select(this.index + 1) || this.select(0);
            this.delay();
        },
        prev: function() {
            this.select(this.index - 1) || this.select(this.items.get().length - 1);
            this.delay();
        },
        delay: function(d) {
            var self = this;
            d |= this.options.delay;
            if (d) {
                clearTimeout(this.timer); // make sure there aren't stray timers.
                this.timer = setTimeout(function() { self.next(); }, d * 1000);
            }
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
            function remove() {
                $(this).remove();
            }
            if (typeof o.effect.name != 'undefined') {
                // Do this the UI way.
                var e = o.effect;

                $e1.effect(e.name, e.options, e.speed, remove);

                if (t == "object" && $e2 != Null) {
                    $e2.effect(e.name, e.options, e.speed, function() {
                        //
                    });
                }
            }
            /* Completly custom animation */
            else if (typeof o.animation.easing != 'undefined') {
                var a = o.animation;
                $e1.animate(a.hide, a.duration, a.easing, remove);

                if (t == "object" && $e2 !== null) {
                    $e2.css(a.hide).animate(a.show, a.duration, a.easing, function() {
                        //
                    });
                }
            }
            else if (typeof o.animate == 'function') {
                o.animate(o, $e1, $e2);
            }
            else if (t == "object" && $e2 !== null) {
                $e1.remove();
                $e2.show();
            }

            return true;
        }
    });

})(jQuery);
