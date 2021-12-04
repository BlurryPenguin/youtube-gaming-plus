// smashcastPlus.js
'use strict';

(function () {
	// Vars
	//var angular = window.angular;
	var VALID_STREAM_URL = /https:\/\/www.youtube.com\/watch?v=(.*?)/i;

	if (VALID_STREAM_URL.test(document.location.href)) console.log('[YouTube Gaming+] Created By: BlurryPenguin');
})();
