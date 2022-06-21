// index.js

(function () {
	const VALID_URL = /https:\/\/www\.youtube\.com/i;
	// /live
	const VALID_STREAM_URL = /https:\/\/www\.youtube\.com\/watch\?v=/i;
	const VALID_LIVE_URL = /https:\/\/www\.youtube\.com\/*(.+)\/live/i;
	const settingsKey = 'youTubeGamingPlus.visualSettings';
	let loaded = false;
	let isActive = false;
	let isInFocus = false;
	let visualSettings = {
		chat: {
			nameColor: true,
			icon: true,
			showDeleted: false,
			simulatedDelay: false,
			separatedLines: true,
			bttvEmotes: true,
			ffzEmotes: true,
		},
		theatreMode: true,
		showReplayChat: true,
		qualityOptimization: false,
	};
	let channelTitle = '';
	let videoCategory = '';
	let videoViews = '';
	let qualityIndex = -1;
	let qualityButton = undefined;

	const isYoutube = () => Utils.canRun(VALID_URL, document.location.href);

	const isStreamPage = () =>
		Utils.canRun(VALID_STREAM_URL, document.location.href) || Utils.canRun(VALID_LIVE_URL, document.location.href);

	const hasChatFrame = () => {
		const ytLiveChat = document.querySelector('ytd-live-chat-frame');
		return Utils.exists(ytLiveChat) && !ytLiveChat.hasAttribute('hidden');
	};

	const commentsHidden = () => {
		const ytdComments = document.querySelector('ytd-watch-flexy #primary ytd-comments');
		return !Utils.exists(ytdComments) || ytdComments.hasAttribute('hidden');
	};

	const hasVideoCard = () => {
		const ytCardsButton = document.querySelector(
			'.html5-video-player > .ytp-chrome-top > .ytp-chrome-top-buttons > button.ytp-cards-button',
		);

		return Utils.exists(ytCardsButton) && ytCardsButton.style.display !== 'none';
	};

	const getChannelName = () => {
		const ytChannel = document.querySelector(
			'ytd-channel-name > #container > #text-container > yt-formatted-string > a',
		);
		if (Utils.exists(ytChannel)) return ytChannel.innerText;
		return '';
	};

	const getVideoTitleOverlay = (title = '') => {
		const t = document.createElement('template');
		t.innerHTML = `<div class="ytg-top-bar"><h1 class="title style-scope ytd-video-primary-info-renderer ytg-title">${title} <span class='style-scope ytd-video-view-count-renderer ytg-title-views'></span></h1></div>`;
		t.innerText = title;
		return t.content;
	};

	const isChannelDisabled = () => {
		const channelName = getChannelName().toLowerCase();
		const channel = supportedChannels.find((c) => c.youtube.name === channelName);
		return Utils.exists(channel) && !channel.youtube.enable;
	};

	const updateTitle = () => {
		const customTitle = document.querySelector('.ytg-title');
		if (!hasChatFrame()) {
			if (Utils.exists(customTitle)) customTitle.remove();
			return;
		}

		const channelInfo = document.querySelector('ytd-video-primary-info-renderer h1 > yt-formatted-string');
		const videoPlayer = document.querySelector('.html5-video-player .html5-video-container');

		channelTitle = channelInfo.innerText;

		if (Utils.exists(videoPlayer)) {
			if (Utils.exists(customTitle)) customTitle.innerText = `${channelTitle}`;
			else videoPlayer.insertBefore(getVideoTitleOverlay(channelTitle), videoPlayer.childNodes[0]);
		}
	};

	const updateViews = () => {
		if (!hasChatFrame()) return;

		const viewCount = document.querySelector('ytd-video-view-count-renderer > .view-count');
		if (Utils.exists(viewCount)) {
			const category = videoCategory === '' ? ' ' : ` ${videoCategory} `;
			const viewDisplay = document.querySelector('.ytg-title-views');
			videoViews = viewCount.innerText.split(' ')[0];
			if (Utils.exists(viewDisplay)) {
				if (videoViews === '') viewDisplay.innerText = `Streaming${category}`;
				else viewDisplay.innerText = `Streaming${category}for ${videoViews} viewers`;
			}
		}
	};

	const updateCategory = () => {
		if (!hasChatFrame()) return;

		const channelCategory = document.querySelector('ytd-rich-metadata-renderer #title');
		if (Utils.exists(channelCategory)) {
			videoCategory = channelCategory.innerText;
		} else {
			videoCategory = '';
		}
	};

	const resetVideoSize = () => {
		const videoStream = document.querySelector('video.video-stream.html5-main-video');
		if (Utils.exists(videoStream)) {
			videoStream.style.setProperty('width', `${videoStream.parentElement.scrollWidth}px`);
			videoStream.style.setProperty('height', `${videoStream.parentElement.scrollHeight}px`);
			videoStream.style.setProperty('left', '0px');
			videoStream.style.setProperty('top', '0px');
		}
	};

	const updateChatCollapsedAttribute = (target) => {
		if (!Utils.exists(target) || !Utils.exists(document.body)) return;
		if (target.hasAttribute('collapsed')) {
			if (!document.body.hasAttribute('ytg-hide-chat')) document.body.setAttribute('ytg-hide-chat', '');
			window.dispatchEvent(
				new CustomEvent('updateChatCollapsed', {
					detail: { collapsed: true },
					bubbles: true,
				}),
			);
		} else {
			if (document.body.hasAttribute('ytg-hide-chat')) document.body.removeAttribute('ytg-hide-chat');
			window.dispatchEvent(
				new CustomEvent('updateChatCollapsed', {
					detail: { collapsed: true },
					bubbles: true,
				}),
			);
		}
	};

	const channelTitleObserver = new MutationObserver((mutations, observer) => {
		updateTitle();
	});

	const channelInfoObserver = new MutationObserver((mutations, observer) => {
		updateViews();
	});

	const channelCategoryObserver = new MutationObserver((mutations, observer) => {
		updateCategory();
	});

	const chatCollapsedObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes') {
				const target = mutation.target;
				if (Utils.exists(target) && isActive) {
					updateChatCollapsedAttribute(mutation.target);
				}
			}
		}
	});

	const skipToLive = () => {
		setTimeout(() => {
			const ytPlayBtn = document.getElementsByClassName('ytp-play-button ytp-button')[0];
			if (Utils.exists(ytPlayBtn)) {
				if (ytPlayBtn.title.indexOf('Play') !== -1) {
					ytPlayBtn.click();
					return;
				}
			}

			// Check to make sure we are in live mode and not back a couple seconds from loading time
			const ytLiveBtn = document.getElementsByClassName('ytp-live-badge ytp-button')[0];
			if (Utils.exists(ytLiveBtn)) {
				if (!ytLiveBtn.hasAttribute('disabled')) {
					ytLiveBtn.click();
					return;
				}
			}
		}, 500);
	};

	const onVisibilityChange = () => {
		if (!isActive) return;
		isInFocus = document.visibilityState === 'visible' ? true : false;

		if (!visualSettings.qualityOptimization) return;

		if (document.visibilityState === 'visible' && qualityButton) {
			qualityButton.click();
			qualityIndex = -1;
			qualityButton = undefined;
			return;
		}

		const ytQualityBtn = document.querySelector(
			'#player-container .ytp-chrome-bottom button.ytp-button.ytp-settings-button',
		);
		if (Utils.exists(ytQualityBtn)) {
			ytQualityBtn.click();
			const qualityMenuBtn = Array.from(
				document.querySelectorAll('.ytp-settings-menu > .ytp-panel > .ytp-panel-menu > .ytp-menuitem'),
			).at(-1);
			if (Utils.exists(qualityMenuBtn)) {
				qualityMenuBtn.click();
				if (document.visibilityState === 'visible') {
					setTimeout(() => {
						const qualityMenuButtons = Array.from(
							document.querySelectorAll('.ytp-settings-menu > .ytp-panel > .ytp-panel-menu > .ytp-menuitem'),
						);
						const oldQty = qualityMenuButtons.at(qualityIndex);
						if (Utils.exists(oldQty)) oldQty.click();
						else ytQualityBtn.click();
					}, 500);
				} else {
					setTimeout(() => {
						const qualityMenuButtons = Array.from(
							document.querySelectorAll('.ytp-settings-menu > .ytp-panel > .ytp-panel-menu > .ytp-menuitem'),
						);
						for (let i = 0; i < qualityMenuButtons.length - 1; i++) {
							const qtyBtn = qualityMenuButtons.at(i);
							if (qtyBtn.ariaChecked || qtyBtn.ariaSelected) {
								qualityIndex = i;
								qualityButton = qtyBtn;
							}
						}
						const lowestQtyBtn = qualityMenuButtons.at(-2);
						if (Utils.exists(lowestQtyBtn)) lowestQtyBtn.click();
					}, 200);
				}
			}
		}
	};

	const setAttribute = () => {
		if (!isStreamPage()) return;
		if (loadObserver !== undefined) loadObserver.disconnect();
		if (Utils.exists(document.body) && !document.body.hasAttribute('ytg-plus')) {
			document.body.setAttribute('ytg-plus', '');
			console.log(`[YouTubeGaming+] Added: page attribute!`);
		}
	};

	const removeAttribute = () => {
		if (loadObserver !== undefined) loadObserver.disconnect();

		if (Utils.exists(document.body) && document.body.hasAttribute('ytg-plus')) {
			document.body.removeAttribute('ytg-plus');
			console.log(`[YouTubeGaming+] Removed: page attribute!`);
		}
	};

	const loadCSS = () => {
		const base = document.head || document.documentElement;
		if (!Utils.exists(base)) return;

		if (Utils.exists(base.querySelector(`link#ytg-plus`))) return;
		base.insertAdjacentHTML(
			'beforeend',
			'<link rel="stylesheet" type="text/css"  id="ytg-plus" href="' +
				chrome.runtime.getURL('styles/ytg-plus.css') +
				'">',
		);
		console.log(`[YouTubeGaming+] Loaded: styles!`);
	};

	const setup = () => {
		document.addEventListener('visibilitychange', onVisibilityChange);

		if (visualSettings.theatreMode) {
			setAttribute();
			const channelTitle = document.querySelector('ytd-video-primary-info-renderer h1 > yt-formatted-string');
			const channelInfo = document.querySelector('ytd-video-view-count-renderer > .view-count');
			const channelCategory = document.querySelector('ytd-rich-metadata-renderer #title');
			if (Utils.exists(channelTitle)) {
				updateTitle();
				channelTitleObserver.observe(channelTitle, {
					attributes: true,
					characterData: true,
					childList: true,
					subtree: true,
					attributeOldValue: true,
					characterDataOldValue: true,
				});
			}
			if (Utils.exists(channelInfo)) {
				updateViews();
				channelInfoObserver.observe(channelInfo, {
					attributes: true,
					characterData: true,
					childList: true,
					subtree: true,
					attributeOldValue: true,
					characterDataOldValue: true,
				});
			}
			if (Utils.exists(channelCategory)) {
				updateCategory();
				channelCategoryObserver.observe(channelCategory, {
					attributes: true,
					characterData: true,
					childList: true,
					subtree: true,
					attributeOldValue: true,
					characterDataOldValue: true,
				});
			}

			const ytLiveChat = document.querySelector('yt-live-chat-app');
			if (Utils.exists(ytLiveChat)) {
				updateChatCollapsedAttribute(ytLiveChat);
				chatCollapsedObserver.observe(ytLiveChat, { attributes: true });
			}
			resetVideoSize();
		}

		window.dispatchEvent(new Event('resize'));

		if (isChannelDisabled()) {
			isActive = false;
			clearObservers();
			removeAttribute();
		}
	};

	const load = () => {
		// Check if the page has youtube live chat to make sure we are watching a live stream or replay, not an uploaded video
		if (hasChatFrame() && !hasVideoCard() && isActive) {
			if (!loaded) {
				if (isChannelDisabled()) {
					isActive = false;
					clearObservers();
					removeAttribute();
					return false;
				}

				Storage.getSync(settingsKey, JSON.stringify(visualSettings))
					.then((items) => {
						loaded = true;
						visualSettings = { ...visualSettings, ...items };
					})
					.catch((error) => {
						console.error('Storage.getSync', settingsKey, error);
					})
					.finally(() => setup());
			} else setup();
			if (loadObserver !== undefined) loadObserver.disconnect();
			skipToLive();
			return true;
		} else return false;
	};

	const loadObserver = new MutationObserver((mutations) => {
		mutations.some(() => {
			// Check if the page has youtube live chat to make sure we are watching a live stream or replay, not an uploaded video
			if (hasChatFrame()) {
				loadObserver.disconnect();
				return load();
			}
		});
	});

	const clearObservers = () => {
		if (loadObserver !== undefined) loadObserver.disconnect();
		if (channelTitleObserver !== undefined) channelTitleObserver.disconnect();
		if (channelInfoObserver !== undefined) channelInfoObserver.disconnect();
		if (channelCategoryObserver !== undefined) channelCategoryObserver.disconnect();
		if (chatCollapsedObserver !== undefined) chatCollapsedObserver.disconnect();
	};

	const checkPage = () => {
		if (!isStreamPage()) {
			isActive = false;
			clearObservers();
			return;
		}

		isActive = true;
		isInFocus = document.visibilityState === 'visible' ? true : false;
		loadCSS();

		if (!load()) {
			loadObserver.observe(document.documentElement, {
				attributes: true,
				characterData: true,
				childList: true,
				subtree: true,
				attributeOldValue: true,
				characterDataOldValue: true,
			});
		}

		setTimeout(() => {
			if (!hasChatFrame()) {
				isActive = false;
				clearObservers();
				removeAttribute();
			}
		}, 3000);
	};

	const run = () => {
		if (isYoutube()) {
			isActive = false;
			clearObservers();

			loadCSS();
			setTimeout(() => {
				checkPage();
			}, 500);
		}
	};

	window.onload = run;
	window.addEventListener('yt-navigate-start', run, true);

	// Listeners
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (!isStreamPage()) return;

		if (request.type && request.type === 'youtubegaming+' && request.system) {
			if (request.system === 'background') {
				if (request.action && request.action === 'urlChange') {
					removeAttribute();
					run();
				} else if (request.action && request.action === 'initialLoad') {
					loaded = false;
					if (request.data.visualSettings) {
						visualSettings = { ...visualSettings, ...JSON.parse(JSON.stringify(request.data.visualSettings)) };
					}

					removeAttribute();
					run();
				} else if (request.action && request.action === 'extensionUpdate') {
					console.log(request.data);
					console.log(request.data.previousVersion);
					console.log(request.data.currentVersion);
				} else if (request.action && request.action === 'unknown') {
					console.log(request);
					console.log(request.data);
				}
			} else if (request.system === 'settings') {
				if (request.method && request.method === 'getSync') {
					const data = JSON.stringify(request.data) ?? JSON.stringify({});
					return Storage.getSync(request.key ?? '', data)
						.then((items) => {
							sendResponse({ success: true, data: items });
							return true;
						})
						.catch((error) => {
							console.error('request.getSync', request.key, error);
							sendResponse({ success: false, data });
							return true;
						});
				} else if (request.method && request.method === 'setSync') {
					const data = request.data ?? JSON.stringify({});
					return Storage.setSync(request.key ?? '', data)
						.then(() => {
							sendResponse({ success: true, data });
							return true;
						})
						.catch((error) => {
							console.error('request.setSync', request.key, error);
							sendResponse({ success: false, data });
							return true;
						});
				}
			}
		}
	});

	// Check for storage changes
	chrome.storage.onChanged.addListener((changes, namespace) => {
		for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
			if (key === settingsKey) {
				loaded = false;
				if (!isStreamPage()) return;
				console.log('chrome.storage.onChanged');
				console.log(oldValue);
				console.log(newValue);
				visualSettings = { ...visualSettings, ...newValue };

				removeAttribute();
				run();
			}
		}
	});
})();
