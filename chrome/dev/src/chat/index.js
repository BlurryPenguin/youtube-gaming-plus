// index.js

(function () {
	const VALID_URL = /https:\/\/www\.youtube\.com/i;
	const VALID_CHAT_URL = /https:\/\/www\.youtube\.com\/live_chat\?continuation=/i;
	const settingsKey = visualSettingsKey;
	const emotes = new Emotes();
	const messageQueue = new Set();
	let loaded = false;
	let isActive = false;
	let isInFocus = false;
	let setChatLive = true;
	let chatTmr = undefined;
	let saveChattersTmr = undefined;
	let visualSettings = { ...defaultVisualSettings };
	let messageQueueTmr = undefined;
	let messageQueuePaused = false;
	let chatElements = { ...defaultChatElements };
	let chatUsers = [];
	let lastChattersCount = 0;
	let messageObservers = [];
	let messageObserverTimers = [];
	let channelName = '';
	let chatAlt = false;

	const isYoutube = () => {
		return Utils.canRun(VALID_URL, document.location.href);
	};

	const isLiveChat = () => {
		return Utils.canRun(VALID_CHAT_URL, document.location.href);
	};

	const isChatFrame = () => {
		if (!Utils.exists(window.parent) || !Utils.exists(window.parent.window)) return false;
		const _win = window.parent.window;

		const ytChatApp = document.querySelector('yt-live-chat-app');
		const ytLiveChat = _win.document.querySelector('ytd-live-chat-frame');
		return Utils.exists(ytChatApp) || Utils.exists(ytLiveChat);
	};

	const commentsHidden = () => {
		const ytdComments = document.querySelector('ytd-watch-flexy #primary ytd-comments');
		return !Utils.exists(ytdComments) || ytdComments.hasAttribute('hidden');
	};

	const getChannelName = () => {
		if (!isChatFrame()) return '';

		const ytChannel = document.querySelector(
			'ytd-channel-name > #container > #text-container > yt-formatted-string > a',
		);
		if (Utils.exists(ytChannel)) return ytChannel.innerText;
		return '';
	};

	const isChannelDisabled = () => {
		const channelName = getChannelName().toLowerCase();
		const channel = supportedChannels.find((c) => c.youtube.name === channelName);
		return Utils.exists(channel) && !channel.youtube.enable;
	};

	const saveChatUsers = () => {
		if (saveChattersTmr !== undefined) return;

		saveChattersTmr = setInterval(() => {
			const chattersCount = chatUsers.length;
			let updatedUsers = [...chatUsers];

			if (lastChattersCount === chattersCount) return;

			Storage.getLocalBytesInUse(chatUsersKey)
				.then((bytesinUse) => {
					const percentageIUse = ((bytesinUse / 4000000) * 100).toFixed(2);
					if (percentageIUse >= 98) {
						const toRemove = Math.round((10 / 100) * updatedUsers.length);
						updatedUsers.sort((a, b) => a.ts - b.ts).splice(0, toRemove);
						console.info(`filtered out ${chattersCount - updatedUsers.length} inactive chatUsers!`);
						alert(`filtered out ${chattersCount - updatedUsers.length} inactive chatUsers!`);
					}
				})
				.catch((error) => console.error('saveChatUsers getLocalBytesInUse', error))
				.finally(() => {
					const chattersCount = updatedUsers.length;
					Storage.setLocal(chatUsersKey, updatedUsers)
						.then(() => (lastChattersCount = chattersCount))
						.catch((error) => console.error('saveChatUsers setLocal', chatUsersKey, error));
				});
		}, 10000);
	};

	const processMessage = (chatMessage = null, hide = false) => {
		if (!Utils.exists(chatMessage) || !isActive) return chatMessage;
		if (hide) chatMessage.setAttribute('ytg-hidden', '');

		const tagName = chatMessage.tagName;
		const isDeleted = chatMessage.hasAttribute('is-deleted');
		const messageContent = chatMessage.querySelector('#content');
		const isAlert =
			tagName === 'YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER' ||
			tagName === 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER' ||
			tagName === 'YT-LIVE-CHAT-VIEWER-ENGAGEMENT-MESSAGE-RENDERER' ||
			tagName === 'YTD-SPONSORSHIPS-LIVE-CHAT-GIFT-REDEMPTION-ANNOUNCEMENT-RENDERER' ||
			chatMessage.hasAttribute('show-only-header');
		/*
		const isMemberAlert = Utils.exists(chatMessage.querySelector('yt-live-chat-membership-item-renderer'));
		const isGiftedAlert = Utils.exists(
			chatMessage.querySelector('ytd-sponsorships-live-chat-gift-redemption-announcement-renderer'),
		);
		*/

		if ((tagName !== 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER' && !isAlert) || chatMessage.hasAttribute('ytg-checked')) {
			chatMessage.removeAttribute('ytg-hidden');
			chatMessage.setAttribute('ytg-checked', '');
			return chatMessage;
		}

		if (visualSettings.chat.separatedLines) {
			if (chatAlt) chatMessage.setAttribute('ytg-chat-alt', '');
			chatAlt = !chatAlt;
		}

		if (visualSettings.chat.showDeleted && !isAlert) {
			if (isDeleted) {
				chatMessage.removeAttribute('is-deleted');
				chatMessage.setAttribute('ytg-deleted', '');
			}

			const messageAttributes = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					if (mutation.type === 'attributes') {
						const target = mutation.target;
						if (Utils.exists(target) && target.hasAttribute('is-deleted')) {
							if (isActive) {
								chatMessage.removeAttribute('is-deleted');
								chatMessage.setAttribute('ytg-deleted', '');
							}
							if (messageAttributes) {
								const index = messageObservers.indexOf(messageAttributes);
								if (index > -1) messageObservers.splice(index, 1);
								messageAttributes.disconnect();
							}
						}
					}
				}
			});
			messageAttributes.observe(chatMessage, { attributes: true });
			messageObservers.push(messageAttributes);
			const messageTmr = setTimeout(() => {
				if (messageAttributes !== undefined) {
					const index = messageObservers.indexOf(messageAttributes);
					if (index > -1) messageObservers.splice(index, 1);
					messageAttributes.disconnect();
				}
				if (messageTmr !== undefined) {
					const index = messageObserverTimers.indexOf(messageTmr);
					if (index > -1) messageObserverTimers.splice(index, 1);
					clearTimeout(messageTmr);
				}
			}, 60000);
			messageObserverTimers.push(messageTmr);
		}

		if (Utils.exists(messageContent)) {
			const authorName = messageContent.querySelector('yt-live-chat-author-chip > #author-name');
			const message = messageContent.querySelector('#message');
			const timeStamp = Math.round(new Date().getTime() / 1000);

			if (visualSettings.chat.nameColor && Utils.exists(authorName) && !isAlert) {
				const userName = authorName.innerText.trim().toLowerCase();
				const chatUser = chatUsers.find((x) => x.name === userName);
				let nameColor = Utils.generatePastelColor();

				if (chatUser == undefined) chatUsers.push({ color: nameColor, name: userName, ts: timeStamp });
				else {
					nameColor = chatUser.color;
					chatUser.ts = timeStamp;
				}

				authorName.style.setProperty('color', nameColor, 'important');
			}

			if (visualSettings.chat.bttvEmotes || visualSettings.chat.ffzEmotes) emotes.insertTo(message);
		}

		chatMessage.setAttribute('ytg-checked', '');
		return chatMessage;
	};

	const messageDelayPop = (delay = 950) => {
		clearTimeout(messageQueueTmr);

		const min = messageQueue.size * 100;
		const rand = Utils.randomInt(min < 750 ? 750 : min, 2000);
		const count = rand < 2000 ? rand : 2000;

		if (Utils.exists(chatElements.target) && isInFocus && messageQueue.size > 0) {
			messageQueuePaused = true;
			const queue = new Set([...messageQueue]);
			messageQueue.clear();
			messageQueuePaused = false;
			let msgDelay = Math.round(count / (queue.size > 0 ? queue.size : 1) - 100);
			for (let messageNode of queue.values()) {
				if (!isActive) break;
				if (!Utils.exists(messageNode)) continue;

				if (isFinite(msgDelay) && queue.size < 3) {
					setTimeout(() => {
						if (isActive) messageNode.removeAttribute('ytg-hidden');
					}, msgDelay);
				} else messageNode.removeAttribute('ytg-hidden');
			}
		}

		messageDelay(delay);
	};

	const messageDelay = (delay = 950) => {
		clearTimeout(messageQueueTmr);
		if (!visualSettings.chat.simulatedDelay) return;

		messageQueueTmr = setTimeout(() => messageDelayPop(delay), delay);
	};

	const resetChatOververs = (resubscribe = true, checkCollapsed = false) => {
		clearInterval(chatTmr);
		clearTimeout(messageQueueTmr);
		messageQueue.clear();
		if (chatObserver !== undefined) chatObserver.disconnect();
		if (chatModeObserver !== undefined) chatModeObserver.disconnect();
		if (chatParticipantsObserver) chatParticipantsObserver.disconnect();
		if (chatInputFieldObserver !== undefined) chatInputFieldObserver.disconnect();
		if (chatShowMoreObserver !== undefined) chatShowMoreObserver.disconnect();
		if (emotes.emojiPickerObserver) emotes.emojiPickerObserver.disconnect();
		if (messageObservers.length > 0) {
			messageObservers.every((observer) => {
				if (!isActive) return false;
				if (observer === undefined) observer.disconnect();
				return true;
			});
			messageObservers.length = 0;
		}
		if (messageObserverTimers.length > 0) {
			messageObserverTimers.every((timer) => {
				if (!isActive) return false;
				if (timer === undefined) clearTimeout(timer);
				return true;
			});
			messageObserverTimers.length = 0;
		}
		if (resubscribe) subscribeToChat(checkCollapsed);
	};

	const pageFlexObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes') {
				if (mutation.attributeName == 'is-two-columns_') {
					const target = mutation.target;
					if (Utils.exists(target) && isActive) {
						resetChatOververs(true);
					}
				} else if (mutation.attributeName == 'style') {
					resetVideoSize();
				}
			}
		}
	});

	const chatObserver = new MutationObserver((mutations, observer) => {
		const messageMutations = mutations
			.filter((mutation) => mutation.target.id === 'items')
			.filter((itemDOM) => itemDOM.addedNodes.length > 0);

		for (const messageMutation of messageMutations) {
			if (messageMutation === undefined || messageMutation.addedNodes.length === 0) continue;
			for (const messageNode of messageMutation.addedNodes) {
				if (!Utils.exists(messageNode) || !isActive) continue;

				if (visualSettings.chat.simulatedDelay && !messageQueuePaused) {
					messageQueue.add(processMessage(messageNode, true));
					if (messageQueue.size >= 15) messageDelayPop();
				} else processMessage(messageNode);
			}
		}
	});

	const chatModeObserver = new MutationObserver((mutationsList, observer) => {
		resetChatOververs(true);
	});

	const chatShowMoreObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes') {
				const target = mutation.target;
				if (Utils.exists(target) && isActive) {
					resetChatOververs(true);
				}
			}
		}
	});

	const chatParticipantsObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes') {
				const target = mutation.target;
				if (Utils.exists(target) && isActive) {
					resetChatOververs(true);
				}
			}
		}
	});

	const chatInputFieldObserver = new MutationObserver((mutations) => {
		const mutation = mutations.find((m) => Utils.exists(m));
		if (!Utils.exists(mutation)) return;

		const target = mutation.target;
		if (Utils.exists(target) && Utils.exists(chatElements.innerBody) && isActive) {
			emotes.injectSuggestions(chatElements, target.textContent);
		}
	});

	const subscribeToChat = (checkCollapsed = false) => {
		clearInterval(chatTmr);
		clearTimeout(messageQueueTmr);

		chatTmr = setInterval(() => {
			if (!isActive) return;

			chatElements.app = document.querySelector('yt-live-chat-app');
			if (Utils.exists(chatElements.app)) {
				/*
				const ytChatFrame = chatElements.app.querySelector('iframe');
				if (Utils.exists(ytChatFrame) && ytChatFrame.src === 'about:blank') {
					chatElements.app.setAttribute('ytg-hidden', '');
				} else chatElements.app.removeAttribute('ytg-hidden');
        */

				window.parent.window.addEventListener('updateChatCollapsed', (listener) => {
					const collapsed = listener.detail.collapsed;
					console.log('window.parent updateChatCollapsed', listener, collapsed);
					updateChatCollapsedAttribute(collapsed);
				});

				window.addEventListener('updateChatCollapsed', (listener) => {
					const collapsed = listener.detail.collapsed;
					console.log('window updateChatCollapsed', listener, collapsed);
					updateChatCollapsedAttribute(collapsed);
				});

				chatElements.innerBody = chatElements.app.closest('body');

				if (checkCollapsed && visualSettings.showReplayChat) {
					if (chatElements.app.hasAttribute('collapsed')) {
						const showHideButton = chatElements.app.querySelector(
							'#show-hide-button > ytd-toggle-button-renderer > a.yt-simple-endpoint',
						);
						if (Utils.exists(showHideButton)) showHideButton.click();
					}
				}

				if (Utils.exists(chatElements.innerBody)) {
					chatElements.target = chatElements.innerBody.querySelector('#items.yt-live-chat-item-list-renderer');
					if (Utils.exists(chatElements.target)) {
						/**/
						window.addEventListener('yt-live-chat-item-list-renderer', (listener) => {
							console.log('yt-live-chat-item-list-renderer', listener);
						});
						window.addEventListener('handleAddChatItemAction_', (listener) => {
							console.log('handleAddChatItemAction_', listener);
						});

						chatElements.target.addEventListener('handleAddChatItemAction_', (listener) => {
							console.log('handleAddChatItemAction_', listener);
						});

						window.addEventListener('yt-live-chat-text-input-field-renderer', (listener) => {
							console.log('yt-live-chat-text-input-field-renderer', listener);
						});
						window.addEventListener('calculateLiveChatRichMessageInput_', (listener) => {
							console.log('calculateLiveChatRichMessageInput_', listener);
						});

						window.addEventListener('yt-live-chat-renderer', (listener) => {
							console.log('yt-live-chat-renderer', listener);
						});
						window.addEventListener('preprocessActions_', (listener) => {
							console.log('preprocessActions_', listener);
						});

						const onEmotes = () => {
							const itemListRenderer = document.querySelector('yt-live-chat-item-list-renderer');
							if (null != itemListRenderer) {
								if ('emojiManager' in itemListRenderer) {
									if (itemListRenderer.emojiManager._ytg) return;
									itemListRenderer.emojiManager._ytg = true;
									itemListRenderer.emojiManager.load([...e.values()]);
								} else console.warn('Cannot find emojiManager');
							} else console.warn('Cannot find chat list');
						};

						window.addEventListener('emotes', (listener) => {
							console.log('window.on(emotes)', listener);
							onEmotes();
							/*
							try {
								emotes.create();
							} catch (e) {
								console.error(e);
							}
              */
						});

						window.parent.window.addEventListener('emotes', (listener) => {
							console.log('window.parent.window.on(emotes)', listener);
							onEmotes();
							/*
							try {
								emotes.create();
							} catch (e) {
								console.error(e);
							}
              */
						});

						/*
						setTimeout(() => {
							//window.dispatchEvent(new Event('chat.getEmojiManager'));
							window.dispatchEvent(new Event('emotes'));
							window.parent.window.dispatchEvent(new Event('emotes'));
						}, 2000);
            */

						const ytParticipants = chatElements.innerBody.querySelector('yt-live-chat-participant-list-renderer');
						setChatAttribute();
						clearInterval(chatTmr);
						clearTimeout(messageQueueTmr);
						messageQueue.clear();

						chatElements.dropdown = chatElements.innerBody.querySelector(
							'.yt-live-chat-header-renderer > yt-dropdown-menu > tp-yt-paper-menu-button > tp-yt-iron-dropdown tp-yt-paper-listbox',
						);
						if (Utils.exists(chatElements.dropdown)) {
							if (setChatLive) {
								chatElements.modes = chatElements.dropdown.querySelectorAll('a');
								if (Utils.exists(chatElements.modes) && chatElements.modes.length >= 2) {
									if (
										chatElements.modes[1].getAttribute('aria-selected') !== true ||
										chatElements.modes[1].getAttribute('aria-selected') !== 'true'
									) {
										chatElements.modes[1].click();
									}
								}
								setChatLive = false;
							}

							chatModeObserver.observe(chatElements.dropdown, {
								attributes: true,
								characterData: true,
								childList: true,
								subtree: true,
								attributeOldValue: true,
								characterDataOldValue: true,
							});
						}

						if (Utils.exists(ytParticipants)) {
							chatParticipantsObserver.observe(ytParticipants, { attributes: true });
						}
						if (!Utils.exists(ytParticipants) || ytParticipants.hasAttribute('disable-upgrade')) {
							const previousMessages = chatElements.target.children;
							const messageArray = [...previousMessages];
							messageArray.every((messageNode) => {
								if (!isActive) return false;
								if (Utils.exists(messageNode)) processMessage(messageNode);
								return true;
							});

							chatObserver.observe(chatElements.target, {
								childList: true,
								subtree: true,
							});

							const chatShowMore = chatElements.target.querySelector('#show-more.yt-live-chat-item-list-renderer');
							if (Utils.exists(chatShowMore)) chatShowMoreObserver.observe(chatShowMore, { attributes: true });
							else if (chatShowMoreObserver !== undefined) chatShowMoreObserver.disconnect();

							if (visualSettings.chat.simulatedDelay) messageDelay();
							saveChatUsers();

							chatElements.textInputFieldRenderer = chatElements.innerBody.querySelector(
								'yt-live-chat-text-input-field-renderer',
							);
							chatElements.inputRenderer = chatElements.innerBody.querySelector(
								'yt-live-chat-message-input-renderer yt-live-chat-text-input-field-renderer',
							);
							if (Utils.exists(chatElements.inputRenderer)) {
								chatElements.inputField = chatElements.inputRenderer.querySelector('#input');
								if (Utils.exists(chatElements.inputRenderer)) {
									chatElements.ironDropdown = chatElements.inputRenderer.querySelector('tp-yt-iron-dropdown');
									if (Utils.exists(chatElements.ironDropdown)) {
										chatElements.dropdownContent = chatElements.ironDropdown.querySelector(
											'.dropdown-content.yt-live-chat-text-input-field-renderer',
										);
									}
								}

								if (Utils.exists(chatElements.inputField)) {
									chatInputFieldObserver.observe(chatElements.inputField, {
										characterData: true,
										subtree: true,
									});
								} else if (chatInputFieldObserver !== undefined) chatInputFieldObserver.disconnect();
							}
						}

						if (visualSettings.chat.bttvEmotes || visualSettings.chat.ffzEmotes) {
							const emojiPicker = chatElements.innerBody.querySelector(
								'yt-emoji-picker-renderer.yt-live-chat-message-input-renderer',
							);
							if (Utils.exists(emojiPicker)) {
								emotes.emojiPickerObserver.observe(emojiPicker, { attributes: true });
							}
						}
					}
				}
			}
		}, 500);
	};

	const updateChatCollapsedAttribute = (collapsed) => {
		if (!Utils.exists(document.body)) return;
		if (collapsed) {
			if (!document.body.hasAttribute('ytg-hide-chat')) document.body.setAttribute('ytg-hide-chat', '');
		} else {
			if (document.body.hasAttribute('ytg-hide-chat')) document.body.removeAttribute('ytg-hide-chat');
		}
	};

	const setupChatObservers = () => {
		if (chatUsers.length === 0)
			Storage.getLocal(chatUsersKey, chatUsers)
				.then((chatItems) => {
					const chatters = [...chatItems];
					const names = chatters.length > 0 ? new Set(chatters.map((d) => d.name)) : new Set();
					chatUsers = [...chatters, ...chatUsers.filter((d) => !names.has(d.name))];
					lastChattersCount = chatUsers.length;
				})
				.catch((error) => {
					console.error('Storage.getLocal', chatUsersKey, error);
				})
				.finally(() => resetChatOververs(true, true));
		else resetChatOververs(true, true);
	};

	const onVisibilityChange = () => {
		if (!isActive) return;
		isInFocus = document.visibilityState === 'visible' ? true : false;
	};

	const setChatAttribute = () => {
		if (!Utils.exists(chatElements.innerBody)) return;

		if (!chatElements.innerBody.hasAttribute('ytg-plus')) chatElements.innerBody.setAttribute('ytg-plus', '');

		if (!visualSettings.chat.icon && !chatElements.innerBody.hasAttribute('ytg-no-avatar'))
			chatElements.innerBody.setAttribute('ytg-no-avatar', '');
	};

	const removeChatAttribute = () => {
		chatElements.app = document.querySelector('yt-live-chat-app');

		if (!Utils.exists(chatElements.app)) return;

		if (!Utils.exists(chatElements.innerBody)) chatElements.innerBody = chatElements.app.closest('body');

		if (!Utils.exists(chatElements.innerBody)) return;

		if (chatElements.innerBody.hasAttribute('ytg-plus')) chatElements.innerBody.removeAttribute('ytg-plus');

		if (chatElements.innerBody.hasAttribute('ytg-no-avatar')) chatElements.innerBody.removeAttribute('ytg-no-avatar');
	};

	const setAttribute = () => {
		if (loadObserver !== undefined) loadObserver.disconnect();
		if (Utils.exists(document.body) && !document.body.hasAttribute('ytg-plus')) {
			document.body.setAttribute('ytg-plus', '');
			console.log(`[YouTubeGaming+] Added: chat page attribute!`);
		}
	};

	const removeAttribute = () => {
		removeChatAttribute();
		if (loadObserver !== undefined) loadObserver.disconnect();

		if (Utils.exists(document.body) && document.body.hasAttribute('ytg-plus')) {
			document.body.removeAttribute('ytg-plus');
			console.log(`[YouTubeGaming+] Removed: chat page attribute!`);
		}
	};

	const loadCSS = () => {
		const base = document.head || document.documentElement;
		if (!Utils.exists(base)) return;

		if (Utils.exists(base.querySelector(`link#ytg-plus-chat`))) return;
		base.insertAdjacentHTML(
			'beforeend',
			'<link rel="stylesheet" type="text/css"  id="ytg-plus-chat" href="' +
				chrome.runtime.getURL('styles/ytg-plus-chat.css') +
				'" />',
		);
		console.log(`[YouTubeGaming+] Loaded: chat styles!`);
	};

	const loadJS = () => {
		/*
		const base = document.head || document.documentElement;
		if (!Utils.exists(base)) return;

		if (Utils.exists(base.querySelector(`script#ytg-plus-chat-js`))) return;
		base.insertAdjacentHTML(
			'beforeend',
			'<script type="text/javascript"  id="ytg-plus-chat-js" src="' +
				chrome.runtime.getURL('src/chat/emotesInjected.js') +
				'" />',
		);
    */

		chrome.runtime.sendMessage(
			{ type: 'youtubegaming+', system: 'general', action: 'executeScript', files: ['src/chat/emotesInjected.js'] },
			(response) => {
				console.log(response);
				console.log(`[YouTubeGaming+] Loaded: chat scripts!`);
			},
		);
	};

	const setup = () => {
		setChatLive = true;
		chatElements = {
			target: document.createElement('div'),
			innerBody: undefined,
			dropdown: undefined,
			modes: undefined,
			inputRenderer: undefined,
			inputField: undefined,
			ironDropdown: undefined,
			dropdownContent: undefined,
		};
		emotes.chatSettings = visualSettings.chat;
		emotes.load(channelName, chatElements);

		console.log('-- yt-live-chat-item-list-renderer --');
		console.log(document.querySelector('yt-live-chat-item-list-renderer'));

		document.addEventListener('visibilitychange', onVisibilityChange);

		const pageFlex = document.querySelector('ytd-page-manager > ytd-watch-flexy');
		if (Utils.exists(pageFlex)) {
			pageFlexObserver.observe(pageFlex, { attributes: true });
		}

		window.addEventListener('yt-live-chat-select-suggestion', (listener) => {
			console.log('yt-live-chat-select-suggestion');
			console.log(listener);
		});

		if (visualSettings.theatreMode) {
			setAttribute();
		}

		if (!visualSettings.chat.icon) {
			if (Utils.exists(document.body) && !document.body.hasAttribute('ytg-no-avatar'))
				document.body.setAttribute('ytg-no-avatar', '');
		}
		resetChatOververs(true);
		setupChatObservers();
		window.dispatchEvent(new Event('resize'));

		if (isChannelDisabled()) {
			isActive = false;
			clearObservers();
			clearTimers();
			removeAttribute();
		} else {
			loadJS();
		}
	};

	const load = () => {
		// Check if the page has youtube live chat to make sure we are watching a live stream or replay, not an uploaded video
		console.log('chat load', isLiveChat(), isActive);
		if (isActive) {
			if (!loaded) {
				if (isChannelDisabled()) {
					isActive = false;
					clearObservers();
					clearTimers();
					removeAttribute();
					return false;
				}

				Storage.getSync(settingsKey, JSON.stringify(visualSettings))
					.then((items) => {
						loaded = true;
						visualSettings = { ...visualSettings, ...items };
						emotes.chatSettings = visualSettings.chat;
					})
					.catch((error) => {
						console.error('Storage.getSync', settingsKey, error);
					})
					.finally(() => {
						window.addEventListener('chat.emotes.getSettings', () => {
							console.log('chat.emotes.getSettings');
							window.dispatchEvent(
								new CustomEvent('chat.emotes.settings', {
									detail: { chat: visualSettings.chat },
									bubbles: true,
								}),
							);
						});

						window.addEventListener('chat.emotes.emojiManager', (event) => {
							console.log('chat.emotes.emojiManager', event.detail);
						});
						window.dispatchEvent(new Event('chat.emotes.getEmojiManager'));

						setup();
					});
			} else setup();
			if (loadObserver !== undefined) loadObserver.disconnect();
			return true;
		} else return false;
	};

	const loadObserver = new MutationObserver((mutations) => {
		mutations.some(() => {
			if (isLiveChat()) {
				loadObserver.disconnect();
				return load();
			}
		});
	});

	const clearObservers = () => {
		if (loadObserver !== undefined) loadObserver.disconnect();
		if (pageFlexObserver !== undefined) pageFlexObserver.disconnect();
		resetChatOververs(false);
	};

	const clearTimers = () => {
		clearInterval(chatTmr);
		clearInterval(saveChattersTmr);
		clearTimeout(messageQueueTmr);
		messageQueue.clear();
	};

	const checkPage = () => {
		console.log('chat checkPage', isLiveChat());
		if (!isLiveChat()) {
			isActive = false;
			clearObservers();
			clearTimers();
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
	};

	const run = () => {
		if (isYoutube()) {
			isActive = false;
			messageQueue.clear();
			clearTimers();
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
		if (!isLiveChat()) return;

		if (request.type && request.type === 'youtubegaming+' && request.system) {
			if (request.system === 'background') {
				if (request.action && request.action === 'urlChange') {
					removeAttribute();
					run();
				} else if (request.action && request.action === 'initialLoad') {
					loaded = false;
					if (request.data.visualSettings) {
						visualSettings = { ...visualSettings, ...JSON.parse(JSON.stringify(request.data.visualSettings)) };
						emotes.chatSettings = visualSettings.chat;
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
				if (request.action && request.action === 'getSync') {
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
				} else if (request.action && request.action === 'setSync') {
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
				if (!isLiveChat()) return;
				console.log('chrome.storage.onChanged');
				console.log(oldValue);
				console.log(newValue);
				visualSettings = { ...visualSettings, ...newValue };
				emotes.chatSettings = visualSettings.chat;

				removeAttribute();
				run();
			}
		}
	});
})();
