###
uTip
Copyright (C) 2012 Andrew Duthie
Released under the MIT License
###
do ($ = window.jQuery || window.Zepto, window, document = window.document) ->

    # Utility Helpers
    util =
        extend: $?.extend || (target, sources...) ->
            for source in sources
                for key, val of source
                    target[key] = val
            target

        on: (element, evt, fn) ->
            # Cross-browser event binding
            if element.addEventListener
                element.addEventListener(evt, fn, false)
            else if element.attachEvent
                element.attachEvent("on#{evt}", fn)

        perceivedBrightness: (hex) ->
            # Weighted brightness credit W3C: http://www.w3.org/TR/AERT#color-contrast
            sum = 0
            for val, i in @hexBits(hex)
                val = parseInt(val, 16)
                sum += switch i
                    when 0 then val * 299
                    when 1 then val * 587
                    else val * 114
            sum / 255000

        brightenColor: (hex, amount) ->
            # Return new hex brightened by amount multiplier
            "#" + (for bit in @hexBits(hex)
                newAmt = parseInt(bit, 16) + Math.floor(255 * amount)
                util.rgbValToHexVal(newAmt)
            ).join("")

        mixColor: (sourceHex, mixHex, amount) ->
            # Return new hex from combination of source and amount contribution of mix
            mixBits = @hexBits(mixHex)
            "#" + (for bit, i in @hexBits(sourceHex)
                newAmt = Math.floor((parseInt(bit, 16) + Math.floor(parseInt(mixBits[i], 16) * amount)) / 2)
                util.rgbValToHexVal(newAmt)
            ).join("")

        rgbValToHexVal: (rgbVal) ->
            # Return valid hex bit (2 chars) from RGB value
            if rgbVal > 255
                "ff"
            else if rgbVal < 0
                "00"
            else ("0" + rgbVal.toString(16)).slice(-2)

        hexBits: (hex) ->
            # Return hex RGB bits as array
            hex = util.extendHex(hex.replace("#", ""))
            hex.match(/([a-f0-9]){2}/gi)

        extendHex: (hex) ->
            if hex.length is 3
                hex = (for bitChar in hex.split("")
                    "#{bitChar}#{bitChar}"
                ).join("")
            hex

        prependStyle: (css) ->
            # Add new style tag to beginning of <head>
            # Credit: http://stackoverflow.com/a/524721
            head = document.getElementsByTagName("head")[0]
            style = document.createElement("style")
            style.type = "text/css"

            if style.styleSheet
                style.styleSheet.cssText = css
            else
                style.appendChild(document.createTextNode(css))

            head.insertBefore(style, head.firstChild)

    # Defaults
    defaults =
        backgroundColor: "#eee"
        borderBrighten: -0.2
        gradientBrighten: 0.05
        textColor: undefined
        textShadow: true
        darkThreshold: 0.5
        maxWidth: "300px"
        padding: "8px"
        transitionTime: "0.2s"
        transitionDelay: "0s"
        text: -> ""

    # Tip class definition
    class uTip
        # Track initialization to add base style to <head>
        @init: false

        # GUID iterates for unique tooltips
        @guid: 0

        constructor: (elements, @options) ->
            # Bind elements as array
            if elements.nodeType? and elements.nodeType is 1
                @elements = [ elements ]
            else if NodeList and elements instanceof NodeList
                @elements = [].slice.call(elements)
            else if $ and elements instanceof $
                @elements = elements.toArray()
            else if elements instanceof Array
                @elements = elements
            else
                @elements = []

            # Override defaults with options
            @settings = util.extend({}, defaults, options)
            if typeof @options.text is "string"
                text = @options.text
                @settings.text = -> text

            # Global uTip init if not already doneY
            if not @constructor.init
                util.prependStyle("""
.uTip{
position:absolute;
visibility:hidden;
opacity:0;
z-index:1000;
border-radius:4px;
box-shadow:0 1px 3px rgba(0,0,0,0.15),inset 1px 1px 0 rgba(255,255,255,0.5)
}
.uTip:before,
.uTip:after{
content:'';
position:absolute;
z-index:1000;
bottom:-7px;
left:50%;
margin-left:-8px;
border:8px solid transparent;
border-bottom:0
}
.uTip:before{
bottom:-8px
}""")
                @constructor.init = true

            @createTip()
            @bindEvents()

        createTip: ->
            # Generate colors from set base background color
            isDark = util.perceivedBrightness(@settings.backgroundColor) < @settings.darkThreshold
            colors =
                gradientTarget: util.brightenColor(@settings.backgroundColor, @settings.gradientBrighten)
                border: util.brightenColor(@settings.backgroundColor, @settings.borderBrighten)
                text: @settings.textColor or util.brightenColor(util.mixColor((if isDark then "#fff" else "#000"), @settings.backgroundColor, 1), (if isDark then 1 else -0.25) * 0.25)
                shadow: if not @settings.textShadow then "rgba(0,0,0,0)" else if isDark then "rgba(0,0,0,0.5)" else "rgba(255,255,255,0.5)"

            frag = document.createElement("div")
            frag.innerHTML = "<div class=\"uTip\" id=\"uTip#{++@constructor.guid}\"></div>"
            util.prependStyle("""
#uTip#{@constructor.guid}{
padding:#{@settings.padding};
max-width:#{@settings.maxWidth};
background:#{colors.gradientTarget};
background:-webkit-linear-gradient(#{@settings.backgroundColor},#{colors.gradientTarget});
background:-moz-linear-gradient(#{@settings.backgroundColor},#{colors.gradientTarget});
background:linear-gradient(#{@settings.backgroundColor},#{colors.gradientTarget});
filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='##{util.extendHex(@settings.backgroundColor.replace('#',''))}',endColorstr='##{util.extendHex(colors.gradientTarget.replace('#',''))}',GradientType=0);
border:1px solid #{colors.border};
color:#{colors.text};
text-shadow:1px 1px #{colors.shadow};
-webkit-transition:visibility 0s linear #{@settings.transitionTime},opacity #{@settings.transitionTime} linear;
-moz-transition:visibility 0s linear #{@settings.transitionTime},opacity #{@settings.transitionTime} linear;
transition:visibility 0s linear #{@settings.transitionTime},opacity #{@settings.transitionTime} linear
}
#uTip#{@constructor.guid}.on{
visibility:visible;
opacity:1;
-webkit-transition-delay:#{@settings.transitionDelay};
-moz-transition-delay:#{@settings.transitionDelay};
transition-delay:#{@settings.transitionDelay}
}
#uTip#{@constructor.guid}:after{
border-top:8px solid #{colors.gradientTarget}
}
#uTip#{@constructor.guid}:before{
border-top:8px solid #{colors.border}
}""")

            @tip = frag.firstChild
            document.body.appendChild(@tip);

        bindEvents: ->
            for element in @elements
                util.on(element, "mouseover", (e) =>
                    target = e.target or e.srcElement

                    @tip.className += " on"
                    @tip.innerHTML = @settings.text(e)

                    left = target.offsetLeft + target.offsetWidth / 2 - @tip.offsetWidth / 2
                    left = 0 if left < 0
                    top = target.offsetTop - @tip.offsetHeight - 8
                    top = 0 if top < 0

                    @tip.style.left = "#{left}px"
                    @tip.style.top = "#{top}px"
                )
                util.on(element, "mouseout", => @tip.className = @tip.className.replace(/\s+on/, ""))
            true

    # Add uTip class to global
    window.uTip ?= uTip

    # Configure jQuery plugin
    if $?
        plugin = "uTip"
        $.fn[plugin] = (options) ->
            @.each ->
                if not $(@).data("plugin_#{plugin}")
                    # Create uTip instance only if one is not already assigned
                    $(@).data("plugin_#{plugin}", new uTip(@, options))