# µTip

__µTip__ is a small JavaScript utility for displaying simple, elegant tooltips. Does the world need yet another tooltip utility? Probably not, but µTip was created with the purpose of satisfying the following criterion:

* jQuery (or Zepto) optional - Familiar jQuery syntax if you're using it, but not a requirement
* Progressively enhanced for CSS3 - Works in older versions of Internet Explorer, but takes advantage of CSS3 features if available
* Single .js file - no stylesheets and no images
* Optional customization - simple for basic scenarios, but plenty of customization if you need it. Better yet, simply provide a base background color and µTip will find complementing colors for the background gradient, border, and text.
* Small - µTip weighs in at around __2kb__ minified and gzipped

Sound good? Check out the demos, then try it out for yourself.

## Usage

For the most basic of scenarios, the following is sufficient:

_Plain JavaScript:_

	new uTip(document.getElementById('myLink'), { text: 'Hello world!' });

_jQuery:_

	$('#myLink').uTip({ text: 'Hello world!' });

For more advanced usage, refer to the demos.

## Demos

[http://aduth.github.com/uTip/](http://aduth.github.com/uTip/)

## License

Copyright (c) 2012 Andrew Duthie

Released under the MIT License (see LICENSE.txt)