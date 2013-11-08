/*
uTip
Copyright (C) 2013 Andrew Duthie
Released under the MIT License
*/


(function() {
  var __slice = [].slice;

  (function($, window, document) {
    var defaults, plugin, uTip, util;
    util = {
      extend: ($ != null ? $.extend : void 0) || function() {
        var key, source, sources, target, val, _i, _len;
        target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (_i = 0, _len = sources.length; _i < _len; _i++) {
          source = sources[_i];
          for (key in source) {
            val = source[key];
            target[key] = val;
          }
        }
        return target;
      },
      on: function(element, evt, fn) {
        if (element.addEventListener) {
          return element.addEventListener(evt, fn, false);
        } else if (element.attachEvent) {
          return element.attachEvent("on" + evt, fn);
        }
      },
      perceivedBrightness: function(hex) {
        var i, sum, val, _i, _len, _ref;
        sum = 0;
        _ref = this.hexBits(hex);
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          val = _ref[i];
          val = parseInt(val, 16);
          sum += (function() {
            switch (i) {
              case 0:
                return val * 299;
              case 1:
                return val * 587;
              default:
                return val * 114;
            }
          })();
        }
        return sum / 255000;
      },
      brightenColor: function(hex, amount) {
        var bit, newAmt;
        return "#" + ((function() {
          var _i, _len, _ref, _results;
          _ref = this.hexBits(hex);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            bit = _ref[_i];
            newAmt = parseInt(bit, 16) + Math.floor(255 * amount);
            _results.push(util.rgbValToHexVal(newAmt));
          }
          return _results;
        }).call(this)).join("");
      },
      mixColor: function(sourceHex, mixHex, amount) {
        var bit, i, mixBits, newAmt;
        mixBits = this.hexBits(mixHex);
        return "#" + ((function() {
          var _i, _len, _ref, _results;
          _ref = this.hexBits(sourceHex);
          _results = [];
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            bit = _ref[i];
            newAmt = Math.floor((parseInt(bit, 16) + Math.floor(parseInt(mixBits[i], 16) * amount)) / 2);
            _results.push(util.rgbValToHexVal(newAmt));
          }
          return _results;
        }).call(this)).join("");
      },
      rgbValToHexVal: function(rgbVal) {
        if (rgbVal > 255) {
          return "ff";
        } else if (rgbVal < 0) {
          return "00";
        } else {
          return ("0" + rgbVal.toString(16)).slice(-2);
        }
      },
      hexBits: function(hex) {
        hex = util.extendHex(hex.replace("#", ""));
        return hex.match(/([a-f0-9]){2}/gi);
      },
      extendHex: function(hex) {
        var bitChar;
        if (hex.length === 3) {
          hex = ((function() {
            var _i, _len, _ref, _results;
            _ref = hex.split("");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              bitChar = _ref[_i];
              _results.push("" + bitChar + bitChar);
            }
            return _results;
          })()).join("");
        }
        return hex;
      },
      prependStyle: function(css) {
        var head, style;
        head = document.getElementsByTagName("head")[0];
        style = document.createElement("style");
        style.type = "text/css";
        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }
        return head.insertBefore(style, head.firstChild);
      },
      elementPosition: function(el) {
        var posLeft, posTop;
        posLeft = posTop = 0;
        while (true) {
          posLeft += el.offsetLeft;
          posTop += el.offsetTop;
          el = el.offsetParent;
          if (!el) {
            break;
          }
        }
        return {
          left: posLeft,
          top: posTop
        };
      }
    };
    defaults = {
      backgroundColor: "#eee",
      borderBrighten: -0.2,
      gradientBrighten: 0.05,
      textColor: void 0,
      textShadow: true,
      darkThreshold: 0.5,
      maxWidth: "300px",
      padding: "8px",
      transitionTime: "0.2s",
      transitionDelay: "0s",
      toggleOnHover: true,
      text: function() {
        return "";
      }
    };
    uTip = (function() {
      uTip.init = false;

      uTip.guid = 0;

      function uTip(elements, options) {
        var text;
        this.options = options;
        if ((elements.nodeType != null) && elements.nodeType === 1) {
          this.elements = [elements];
        } else if (NodeList && elements instanceof NodeList) {
          this.elements = [].slice.call(elements);
        } else if ($ && elements instanceof $) {
          this.elements = elements.toArray();
        } else if (elements instanceof Array) {
          this.elements = elements;
        } else {
          this.elements = [];
        }
        this.settings = util.extend({}, defaults, options);
        if (typeof this.options.text === "string") {
          text = this.options.text;
          this.settings.text = function() {
            return text;
          };
        }
        if (!this.constructor.init) {
          util.prependStyle(".uTip{\nposition:absolute;\nvisibility:hidden;\nopacity:0;\nz-index:1000;\nborder-radius:4px;\nbox-shadow:0 1px 3px rgba(0,0,0,0.15),inset 1px 1px 0 rgba(255,255,255,0.5);\n}\n.uTip:before,\n.uTip:after{\ncontent:'';\nposition:absolute;\nbottom:-7px;\nleft:50%;\nmargin-left:-8px;\nborder:8px solid transparent;\nborder-bottom:0;\n}\n.uTip:before{\nbottom:-8px;\n}");
          this.constructor.init = true;
        }
        this.createTip();
        if (this.settings.toggleOnHover) {
          this.bindHover();
        }
        this.bindEvents();
      }

      uTip.prototype.createTip = function() {
        var colors, frag, isDark, tip;
        isDark = util.perceivedBrightness(this.settings.backgroundColor) < this.settings.darkThreshold;
        colors = {
          gradientTarget: util.brightenColor(this.settings.backgroundColor, this.settings.gradientBrighten),
          border: util.brightenColor(this.settings.backgroundColor, this.settings.borderBrighten),
          text: this.settings.textColor || util.brightenColor(util.mixColor((isDark ? "#fff" : "#000"), this.settings.backgroundColor, 1), (isDark ? 1 : -0.25) * 0.25),
          shadow: !this.settings.textShadow ? "rgba(0,0,0,0)" : isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"
        };
        frag = document.createDocumentFragment();
        tip = document.createElement("div");
        tip.className = "uTip";
        tip.id = "uTip" + (++this.constructor.guid);
        frag.appendChild(tip);
        this.tip = frag.firstChild;
        document.body.appendChild(this.tip);
        return util.prependStyle("#uTip" + this.constructor.guid + "{\npadding:" + this.settings.padding + ";\nmax-width:" + this.settings.maxWidth + ";\nbackground:" + colors.gradientTarget + ";\nbackground:-webkit-linear-gradient(" + this.settings.backgroundColor + "," + colors.gradientTarget + ");\nbackground:-moz-linear-gradient(" + this.settings.backgroundColor + "," + colors.gradientTarget + ");\nbackground:linear-gradient(" + this.settings.backgroundColor + "," + colors.gradientTarget + ");\nfilter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#" + (util.extendHex(this.settings.backgroundColor.replace('#', ''))) + "',endColorstr='#" + (util.extendHex(colors.gradientTarget.replace('#', ''))) + "',GradientType=0);\nborder:1px solid " + colors.border + ";\ncolor:" + colors.text + ";\ntext-shadow:1px 1px " + colors.shadow + ";\n-webkit-transition:visibility 0s linear " + this.settings.transitionTime + ",opacity " + this.settings.transitionTime + " linear;\n-moz-transition:visibility 0s linear " + this.settings.transitionTime + ",opacity " + this.settings.transitionTime + " linear;\ntransition:visibility 0s linear " + this.settings.transitionTime + ",opacity " + this.settings.transitionTime + " linear\n}\n#uTip" + this.constructor.guid + ".on{\nvisibility:visible;\nopacity:1;\n-webkit-transition-delay:" + this.settings.transitionDelay + ";\n-moz-transition-delay:" + this.settings.transitionDelay + ";\ntransition-delay:" + this.settings.transitionDelay + ";\n}\n#uTip" + this.constructor.guid + ":after{\nborder-top:8px solid " + colors.gradientTarget + ";\n}\n#uTip" + this.constructor.guid + ":before{\nborder-top:8px solid " + colors.border + ";\n}");
      };

      uTip.prototype.bindHover = function() {
        var element, _i, _len, _ref,
          _this = this;
        _ref = this.elements;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          element = _ref[_i];
          util.on(element, "mouseover", function(e) {
            var target;
            target = e.target || e.srcElement;
            return _this.showTip(target);
          });
          util.on(element, "mouseout", function() {
            return _this.hideTip();
          });
        }
        return true;
      };

      uTip.prototype.bindEvents = function() {
        var element, _i, _len, _ref, _results,
          _this = this;
        _ref = this.elements;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          element = _ref[_i];
          util.on(element, "showtooltip", function() {
            return _this.showTip(element);
          });
          _results.push(util.on(element, "hidetooltip", function() {
            return _this.hideTip();
          }));
        }
        return _results;
      };

      uTip.prototype.showTip = function(context) {
        var left, position, top;
        this.tip.className += " on";
        this.tip.innerHTML = this.settings.text(context);
        position = util.elementPosition(context);
        left = position.left + context.offsetWidth / 2 - this.tip.offsetWidth / 2;
        if (left < 0) {
          left = 0;
        }
        top = position.top - this.tip.offsetHeight - 8;
        if (top < 0) {
          top = 0;
        }
        this.tip.style.left = "" + left + "px";
        return this.tip.style.top = "" + top + "px";
      };

      uTip.prototype.hideTip = function() {
        return this.tip.className = this.tip.className.replace(/\s+on/, "");
      };

      return uTip;

    })();
    if (window.uTip == null) {
      window.uTip = uTip;
    }
    if ($ != null) {
      plugin = "uTip";
      return $.fn[plugin] = function(options) {
        return this.each(function() {
          if (!$(this).data("plugin_" + plugin)) {
            return $(this).data("plugin_" + plugin, new uTip(this, options));
          }
        });
      };
    }
  })(window.jQuery || window.Zepto, window, window.document);

}).call(this);
