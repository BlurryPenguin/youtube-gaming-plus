// index.js

(function () {
	const VALID_URL = /https:\/\/www\.youtube\.com/i;
	const VALID_STREAM_URL = /https:\/\/www\.youtube\.com\/watch\?v=/i;
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
	let channelTitle = '';
	let videoCategory = '';
	let videoViews = '';
	let chatAlt = false;
	let qualityIndex = -1;
	let qualityButton = undefined;

	const isYoutube = () => {
		return Utils.canRun(VALID_URL, document.location.href);
	};

	const isStreamPage = () => {
		return Utils.canRun(VALID_STREAM_URL, document.location.href);
	};

	const isChatFrame = () => {
		return Utils.canRun(VALID_CHAT_URL, document.location.href);
	};

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
		return null;
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

	const saveChatUsers = () => {
		if (saveChattersTmr !== undefined) return;
		if (!hasChatFrame()) {
			clearObservers();
			clearTimers();
			return;
		}
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

					if (!hasChatFrame() || !isActive) {
						clearObservers();
						clearTimers();
						return;
					}
				});
		}, 10000);
	};

	const processMessage = (chatMessage = null, hide = false) => {
		if (!Utils.exists(chatMessage) || !isActive) return chatMessage;
		if (hide) chatMessage.setAttribute('ytg-hidden', '');

		const isDeleted = chatMessage.hasAttribute('is-deleted');
		const messageContent = chatMessage.querySelector('#content');
		const messageCard = chatMessage.querySelector('#card');
		const isMessageCard = () => Utils.exists(messageCard) || chatMessage.hasAttribute('show-only-header');

		if (
			chatMessage.tagName === 'YT-LIVE-CHAT-VIEWER-ENGAGEMENT-MESSAGE-RENDERER' ||
			chatMessage.hasAttribute('ytg-checked')
		)
			return chatMessage;

		if (visualSettings.chat.separatedLines) {
			if (!isMessageCard()) {
				if (chatAlt) chatMessage.setAttribute('ytg-chat-alt', '');
				chatAlt = !chatAlt;
			}
		}

		if (visualSettings.chat.showDeleted) {
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

			if (visualSettings.chat.nameColor && Utils.exists(authorName) && !isMessageCard()) {
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

	const messageDelay = (delay = 750) => {
		clearTimeout(messageQueueTmr);
		if (!visualSettings.chat.simulatedDelay) return;

		messageQueueTmr = setTimeout(() => {
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

			messageDelay(count);
		}, delay);
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

	const resetVideoSize = () => {
		const videoStream = document.querySelector('video.video-stream.html5-main-video');
		if (Utils.exists(videoStream)) {
			videoStream.style.setProperty('width', `${videoStream.parentElement.scrollWidth}px`);
			videoStream.style.setProperty('height', `${videoStream.parentElement.scrollHeight}px`);
			videoStream.style.setProperty('left', '0px');
			videoStream.style.setProperty('top', '0px');
		}
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

	const channelTitleObserver = new MutationObserver((mutations, observer) => {
		updateTitle();
	});

	const channelInfoObserver = new MutationObserver((mutations, observer) => {
		updateViews();
	});

	const channelCategoryObserver = new MutationObserver((mutations, observer) => {
		updateCategory();
	});

	const chatObserver = new MutationObserver((mutations, observer) => {
		const messageMutations = mutations
			.filter((mutation) => mutation.target.id === 'items')
			.filter((itemDOM) => itemDOM.addedNodes.length > 0);

		for (const messageMutation of messageMutations) {
			if (messageMutation === undefined || messageMutation.addedNodes.length === 0) continue;
			for (const messageNode of messageMutation.addedNodes) {
				if (!Utils.exists(messageNode) || !isActive) continue;

				if (visualSettings.chat.simulatedDelay && !messageQueuePaused)
					messageQueue.add(processMessage(messageNode, true));
				else processMessage(messageNode);
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

	const chatCollapsedObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes') {
				const target = mutation.target;
				if (Utils.exists(target) && isActive) {
					updateChatCollapsedAttribute(mutation.target);
					setTimeout(() => resetChatOververs(true), 500);
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
		if (Utils.exists(target) && Utils.exists(chatElements.innerDoc) && isActive) {
			emotes.injectSuggestions(chatElements, target.textContent);
		}
	});

	const subscribeToChat = (checkCollapsed = false) => {
		clearInterval(chatTmr);
		clearTimeout(messageQueueTmr);

		chatTmr = setInterval(() => {
			if (!hasChatFrame() || !isActive) return;

			const ytLiveChat = document.querySelector('ytd-live-chat-frame');
			if (Utils.exists(ytLiveChat)) {
				const ytChatFrame = ytLiveChat.querySelector('iframe');
				if (Utils.exists(ytChatFrame) && ytChatFrame.src === 'about:blank') {
					ytLiveChat.setAttribute('ytg-hidden', '');
				} else ytLiveChat.removeAttribute('ytg-hidden');

				updateChatCollapsedAttribute(ytLiveChat);
				chatCollapsedObserver.observe(ytLiveChat, { attributes: true });

				chatElements.innerDoc =
					ytLiveChat.querySelector('#chatframe').contentDocument ||
					ytLiveChat.querySelector('#chatframe').contentWindow.document;

				if (checkCollapsed && visualSettings.showReplayChat) {
					if (ytLiveChat.hasAttribute('collapsed')) {
						const showHideButton = ytLiveChat.querySelector(
							'#show-hide-button > ytd-toggle-button-renderer > a.yt-simple-endpoint',
						);
						if (Utils.exists(showHideButton)) showHideButton.click();
					}
				}

				if (Utils.exists(chatElements.innerDoc)) {
					chatElements.target = chatElements.innerDoc.querySelector('yt-live-chat-item-list-renderer');
					// 'yt-chat-item-list-renderer
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

						window.addEventListener('emotes', (listener) => {
							console.log('window.on(emotes)', listener);

							try {
								emotes.create();
							} catch (e) {
								console.error(e);
							}
						});

						const ytParticipants = chatElements.innerDoc.querySelector('yt-live-chat-participant-list-renderer');
						setChatAttribute();
						clearInterval(chatTmr);
						clearTimeout(messageQueueTmr);
						messageQueue.clear();

						chatElements.dropdown = chatElements.innerDoc.querySelector(
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
							const previousMessages = chatElements.target.querySelector('#item-offset.yt-live-chat-item-list-renderer')
								.children[0].children;
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

							chatElements.textInputFieldRenderer = chatElements.innerDoc.querySelector(
								'yt-live-chat-text-input-field-renderer',
							);
							chatElements.inputRenderer = chatElements.innerDoc.querySelector(
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
							const emojiPicker = chatElements.innerDoc.querySelector(
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

	const updateChatCollapsedAttribute = (target) => {
		if (!Utils.exists(target) || !Utils.exists(document.body)) return;
		if (target.hasAttribute('collapsed')) {
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

	const setChatAttribute = () => {
		if (!Utils.exists(chatElements.innerDoc)) return;
		if (!Utils.exists(chatElements.innerDoc.body)) return;

		if (!chatElements.innerDoc.body.hasAttribute('ytg-plus')) chatElements.innerDoc.body.setAttribute('ytg-plus', '');

		if (!visualSettings.chat.icon && !chatElements.innerDoc.body.hasAttribute('ytg-no-avatar'))
			chatElements.innerDoc.body.setAttribute('ytg-no-avatar', '');

		setChatScript();
	};

	const setChatScript = () => {
		return;
		if (!Utils.exists(chatElements.innerDoc)) return;

		const base = chatElements.innerDoc.body || chatElements.innerDoc.querySelector('body');

		if (Utils.exists(base.querySelector('script#ytg-plus-chatJs'))) return;

		base.insertAdjacentHTML(
			'beforeend',
			'<script rel="javascript" type="text/javascript"  id="ytg-plus-chatJs" href="' +
				chrome.runtime.getURL('src/chat/chat.js') +
				'"/>',
		);

		window.dispatchEvent(new Event('chat.emotes.getSettings'));
	};

	const removeChatAttribute = () => {
		const ytLiveChat = document.querySelector('ytd-live-chat-frame');

		if (ytLiveChat === undefined || ytLiveChat === null) return;

		if (!Utils.exists(chatElements.innerDoc))
			chatElements.innerDoc =
				ytLiveChat.querySelector('#chatframe').contentDocument ||
				ytLiveChat.querySelector('#chatframe').contentWindow.document;

		if (!Utils.exists(chatElements.innerDoc)) return;
		if (!Utils.exists(chatElements.innerDoc.body)) return;

		if (chatElements.innerDoc.body.hasAttribute('ytg-plus')) chatElements.innerDoc.body.removeAttribute('ytg-plus');

		if (chatElements.innerDoc.body.hasAttribute('ytg-no-avatar'))
			chatElements.innerDoc.body.removeAttribute('ytg-no-avatar');

		removeChatScript();
	};

	const removeChatScript = () => {
		if (!Utils.exists(chatElements.innerDoc)) return;

		const base = chatElements.innerDoc.body || chatElements.innerDoc.querySelector('body');
		const script = base.querySelector('script#ytg-plus-chatJs');

		if (Utils.exists(script)) base.removeChild(script);
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
		removeChatAttribute();
		if (loadObserver !== undefined) loadObserver.disconnect();

		if (Utils.exists(document.body) && document.body.hasAttribute('ytg-plus')) {
			document.body.removeAttribute('ytg-plus');
			console.log(`[YouTubeGaming+] Removed: page attribute!`);
		}
	};

	const loadCSS = () => {
		const base = document.head || document.documentElement;
		const iFrameDetection = window === window.parent || window.opener ? false : true;
		if (!Utils.exists(base)) return;

		if (!iFrameDetection) {
			if (Utils.exists(base.querySelector(`link#ytg-plus`))) return;
			base.insertAdjacentHTML(
				'beforeend',
				'<link rel="stylesheet" type="text/css"  id="ytg-plus" href="' +
					chrome.runtime.getURL('styles/ytg-plus.css') +
					'">',
			);
			console.log(`[YouTubeGaming+] Loaded: styles!`);
		} else {
			if (Utils.exists(base.querySelector(`link#ytg-plus-chat`))) return;
			base.insertAdjacentHTML(
				'beforeend',
				'<link rel="stylesheet" type="text/css"  id="ytg-plus-chat" href="' +
					chrome.runtime.getURL('styles/ytg-plus-chat.css') +
					'">',
			);
		}
	};

	const loadChatScript = (from = 'unknown') => {
		console.log('loadChatScript', from);

		const iFrame = document.querySelector('ytd-live-chat-frame iframe');
		if (!Utils.exists(iFrame)) return;
		const doc = iFrame.contentDocument || iFrame.contentWindow.document;
		if (!Utils.exists(doc)) return;

		const base = doc.body || doc.querySelector('body');

		const s = document.createElement('script');
		s.src = chrome.runtime.getURL('../src/chat/chat.js');
		s.onload = () => true;
		base.insertAdjacentHTML(
			'beforeend',
			'<script rel="javascript" type="text/css"  id="ytg-plus-chat-js" href="' +
				chrome.runtime.getURL('chat/chat.js') +
				'"/>',
		);
	};

	const setup = () => {
		setChatLive = true;
		chatElements = {
			target: document.createElement('div'),
			innerDoc: undefined,
			dropdown: undefined,
			modes: undefined,
			inputRenderer: undefined,
			inputField: undefined,
			ironDropdown: undefined,
			dropdownContent: undefined,
		};
		emotes.chatSettings = visualSettings.chat;
		emotes.load(channelName, chatElements);

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
			resetVideoSize();
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
		}
		//loadChatScript(isStreamPage() ? 'stream' : 'chat');
	};

	const load = () => {
		// Check if the page has youtube live chat to make sure we are watching a live stream or replay, not an uploaded video
		if (hasChatFrame() && !hasVideoCard() && isActive) {
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

						setup();
					});
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
		if (pageFlexObserver !== undefined) pageFlexObserver.disconnect();
		if (channelTitleObserver !== undefined) channelTitleObserver.disconnect();
		if (channelInfoObserver !== undefined) channelInfoObserver.disconnect();
		if (channelCategoryObserver !== undefined) channelCategoryObserver.disconnect();
		resetChatOververs(false);
	};

	const clearTimers = () => {
		clearInterval(chatTmr);
		clearInterval(saveChattersTmr);
		clearTimeout(messageQueueTmr);
		messageQueue.clear();
	};

	const checkPage = () => {
		if (!isStreamPage()) {
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

		setTimeout(() => {
			if (!hasChatFrame()) {
				isActive = false;
				clearObservers();
				clearTimers();
				removeAttribute();
			}
		}, 3000);
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
				emotes.chatSettings = visualSettings.chat;

				removeAttribute();
				run();
			}
		}
	});
})();
