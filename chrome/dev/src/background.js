// background.js

(function () {
	const chatUsersKey = 'youTubeGamingPlus.chatters';

	async function getCurrentTab() {
		let queryOptions = { active: true, currentWindow: true };
		let [tab] = await chrome.tabs.query(queryOptions);
		return tab;
	}

	const reloadExtension = (id) => {
		chrome.management.setEnabled(id, false, function () {
			chrome.management.setEnabled(id, true);
		});
	};

	// Listeners
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
		if (changeInfo && changeInfo.url) {
			chrome.tabs.sendMessage(tabId, {
				type: 'youtubegaming+',
				system: 'background',
				action: 'urlChange',
				tab,
			});
		}
		if (changeInfo && changeInfo.status === 'complete') {
			chrome.tabs.sendMessage(tabId, {
				type: 'youtubegaming+',
				system: 'background',
				action: 'tabChange',
				tab,
			});
		}
	});

	chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
		let data = request;
		data.success = true;
		sendResponse(data);
		return true;
	});

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		console.log(request);
		console.log(sender);
		if (request.type && request.type === 'youtubegaming+' && request.system) {
			if (request.system === 'general') {
				if (request.action && request.action === 'executeScript') {
					const tabId = getTabId();
					chrome.scripting.executeScript({
						target: { tabId: tabId },
						files: ['src/chat/emotesInjected.js'],
					});
					sendResponse(tabId);
					return true;
				} else if (request.action && request.action === 'getCurrentTab') {
					getCurrentTab()
						.then((tab) => {
							sendResponse(tab);
						})
						.finall(() => {
							return true;
						});
				}
			}
		}
	});

	const syncLocal = (cb) => {
		chrome.storage.local.get(chatUsersKey, (response) => {
			const chatUsers = response[chatUsersKey] ?? [];
			chrome.storage.local.set({ [chatUsersKey]: chatUsers }, () => cb(chatUsers));
		});
	};

	chrome.runtime.onUpdateAvailable.addListener((details) => {
		console.log('onUpdateAvailable');
		syncLocal((chatUsers) => {
			chrome.runtime.reload();
			chrome.storage.local.set({ [chatUsersKey]: chatUsers }, () => cb(chatUsers));
		});
	});

	chrome.runtime.onInstalled.addListener((details) => {
		const currentVersion = chrome.runtime.getManifest().version;
		const previousVersion = details.previousVersion;
		const reason = details.reason;

		switch (reason) {
			case 'update':
				syncLocal(() => {
					chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
						chrome.tabs.sendMessage(tabs[0].id, {
							type: 'youtubegaming+',
							system: 'background',
							action: 'extensionUpdate',
							details: details,
							currentVersion: currentVersion,
							previousVersion: previousVersion,
						});
					});
				});
				break;
			case 'chrome_update':
			case 'shared_module_update':
			default:
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, {
						type: 'youtubegaming+',
						system: 'background',
						action: 'unknown',
						details: details,
						currentVersion: currentVersion,
						previousVersion: previousVersion,
					});
				});
				break;
		}
	});

	chrome.action.onClicked.addListener(function (tab) {
		chrome.tabs.create({
			url: chrome.runtime.getURL('/src/popup/settings.html'),
		});
	});
})();
