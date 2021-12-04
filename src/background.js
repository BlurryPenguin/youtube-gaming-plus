// background.js

function saveDataGroup(dataJson, callback) {
	chrome.storage.sync.set(dataJson, function () {
		callback(dataJson);
	});
}

function saveData(key, data, callback, asString) {
	var defaultJson = {};
	if (asString !== undefined && asString === true) defaultJson[key] = JSON.stringify(data);
	else defaultJson[key] = data;
	saveDataGroup(defaultJson, function (items) {
		if (items === null) callback(false);
		else callback(true);
	});
}

function loadDataGroup(keys, callback) {
	chrome.storage.sync.get(keys, callback);
}

function loadData(key, defaults, callback) {
	loadDataGroup(key, function (items) {
		if (items === null) callback(defaults);
		else {
			if (items[key] !== undefined && items[key] !== null) callback(items[key]);
			else callback(defaults);
		}
	});
}

function sendMessage(data) {
	chrome.tabs.query(
		{
			active: true,
			currentWindow: true,
		},
		function (tabs) {
			const activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, data);
		},
	);
}

// Inject our Angular app, taking care
// not to interfere with page's Angular (if any)
var needsAngular = true;

function injectAngular(tabId) {
	if (needsAngular) {
		needsAngular = false;
		// Prevent immediate automatic bootstrapping
		chrome.tabs.executeScript(
			tabId,
			{
				code: 'window.name = "NG_DEFER_BOOTSTRAP!" + window.name;',
			},
			function () {
				// Inject AngularJS
				chrome.tabs.executeScript(
					tabId,
					{
						file: 'utils/angular-1.4.5.min.js',
					},
					function () {
						// Inject our app's script
						chrome.tabs.executeScript(tabId, {
							file: 'chatAddons.js',
						});
					},
				);
			},
		);
	}
}

// Listeners
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo && changeInfo.status === 'complete') {
		chrome.tabs.sendMessage(tabId, {
			type: 'youtubegaming+',
			system: 'background',
			action: 'tab_change',
		});
	}
	//injectAngular(tab.id);
});

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	var data = request;
	data.success = true;
	sendResponse(data);
});

chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.tabs.create({
		url: chrome.extension.getURL('../settings.html'),
	});
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.type && message.type === 'youtubegaming+' && message.system && message.system === 'background') {
		if (message.action && message.action === 'loadData' && message.data) {
			loadData(message.data, function (response) {
				sendResponse(response);
				sendMessage({
					type: 'youtubegaming+',
					system: 'background',
					action: 'loadData',
					data: response,
				});
			});
		} else if (message.action && message.action === 'saveData' && message.data) {
			saveData(message.data, function (response) {
				sendResponse(response);
				sendMessage({
					type: 'youtubegaming+',
					system: 'background',
					action: 'saveData',
					data: response,
				});
			});
		} else if (message.action && message.action === 'loadTheme') {
			sendMessage({
				type: 'youtubegaming+',
				system: 'background',
				action: 'loadTheme',
			});
		}
	}
});

var port = chrome.runtime.connect();
port.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.type && message.type === 'youtubegaming+' && message.system && message.system === 'background') {
		if (message.action && message.action === 'loadData' && message.data) {
			loadData(message.data, function (response) {
				sendResponse(response);
				sendMessage({
					type: 'youtubegaming+',
					system: 'background',
					action: 'loadData',
					data: response,
				});
			});
		} else if (message.action && message.action === 'saveData' && message.data) {
			saveData(message.data, function (response) {
				sendResponse(response);
				sendMessage({
					type: 'youtubegaming+',
					system: 'background',
					action: 'saveData',
					data: response,
				});
			});
		} else if (message.action && message.action === 'loadTheme') {
			sendMessage({
				type: 'youtubegaming+',
				system: 'background',
				action: 'loadTheme',
			});
		}
	}
});

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason === 'install') {
		chrome.tabs.create({
			url: chrome.extension.getURL('settings.html'),
		});
	}
});

var plugin = document.createElement('embed');
plugin.setAttribute('type', 'application/x-npapifileioforchrome');
plugin.setAttribute('height', '0');
plugin.setAttribute('width', '0');
document.documentElement.appendChild(plugin);
