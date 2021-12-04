// theme-manager.js
'use strict';

(function () {
	// Vars
	var VALID_URL = /https:\/\/www.youtube.com\/watch?v=(.*?)/i;
	var API_URL = /https:\/\/www.youtube.com\/api/i;
	//var VALID_URL = /https:\/\/(.*?).youtube.com\/watch?v=(.*?)/i;
	//var API_URL = /https:\/\/(.*?).youtube.com\/api/i;
	var generalAddonKey = 'YouTubeGamingPlus.generalSettings';
	var loaded = false;

	function canRun(url) {
		if (VALID_URL.test(url)) {
			if (!API_URL.test(url)) {
				return true;
			}
		}
		return false;
	}

	function loadTheme() {
		if (loaded) return;

		chrome.storage.sync.get(generalAddonKey, function (items) {
			if (items && items[generalAddonKey] && items[generalAddonKey].darkTheme) setDarkTheme();
			loaded = true;
		});
	}

	function setDarkTheme() {
		var baseCSS = document.createElement('link');
		baseCSS.href = chrome.extension.getURL('styles/base.css');
		baseCSS.type = 'text/css';
		baseCSS.rel = 'stylesheet';
		document.getElementsByTagName('head')[0].appendChild(baseCSS);

		var channelCSS = document.createElement('link');
		channelCSS.href = chrome.extension.getURL('styles/channel.css');
		channelCSS.type = 'text/css';
		channelCSS.rel = 'stylesheet';
		document.getElementsByTagName('head')[0].appendChild(channelCSS);
	}

	if (canRun(document.location.href)) {
		loadTheme();
	}

	// Listeners
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		if (request.type && request.type === 'youtubegaming+' && request.system && request.system === 'theatreMode') {
			if (request.action && request.action === 'tab_change') {
				if (canRun(document.location.href)) loadTheme();
			} else if (request.action && request.action === 'loadThemeSettings' && request.data) {
				if (canRun(document.location.href)) loadTheme();
			}
		}
	});

	// Check for storage changes
	chrome.storage.onChanged.addListener(function (changes, namespace) {
		for (var key in changes) {
			if (key === generalAddonKey) {
				if (canRun(document.location.href)) loadTheme();
			}
		}
	});
})();
