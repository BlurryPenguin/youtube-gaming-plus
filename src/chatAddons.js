// chatAddons.js
'use strict';

(function () {
	// Vars
	//var angular = window.angular;
	var canLoad = true;
	var VALID_STREAM_URL = /https:\/\/www.youtube.com\/watch?v=(.*?)/i;
	var VALID_STUDIO_URL = /https:\/\/www.youtube.com\/studio\/(.*?)\/live/i;
	var API_URL = /https:\/\/www.youtube.com\/api/i;
	var generalAddonKey = 'YouTubeGamingPlus.generalSettings';
	var chatAddonKey = 'YouTubeGamingPlus.chatSettings';
	var chatManager = null;
	var chatEmbed = false;
	var isChannel = false;

	function validURL(url) {
		isChannel = false;
		if (VALID_STUDIO_URL.test(url)) {
			isChannel = true;
			return true;
		} else if (API_URL.test(url)) return false;
		else if (VALID_STREAM_URL.test(url)) {
			// Check if the player has youtube live controls to make sure we are watching a live stream, not VOD
			if (document.getElementsByClassName('ytp-time-display notranslate ytp-live').length > 0) return true;
			else return false;
		} else return false;
	}

	if (validURL(document.location.href)) canLoad = true;
	else canLoad = false;

	function ChatManager(window, document) {
		this.window = window;
		this.document = document;
		this.chatAddonSettings = {};
		this.generalSettings = {};
		this.defaultGeneralSettings = {
			darkTheme: false,
			userName: '',
			nameColor: '208efc',
		};
		this.defaultChatSettings = {
			Highlight: {
				tab: false,
				back: false,
				text: false,
				additional: '',
			},
			Notify: false,
			HideImages: false,
		};
		this.url = document.location.href;
		this.customHightlight = true;
		this.hideImages = false;
		this.lastMessageIndex = 0;
		this.lastMessages = [];
		this.session = {};
		this.userName = '';
		this.nameColor = '';
		this.chatPosition = 'right';
		this.hexNameColor = {
			r: 148,
			g: 187,
			b: 34,
		};
		this.highlightType = 'none'; // none, text, left, left-back
		this.lstTriggers = [];
		this.chatInput = null;
		this.nameSelectType = 2; // 0 = no selecting, 1 = text must be at the start of the name, 2 = text must be anywhere in the name
		this.elements = {
			chat: null,
			leftColumn: null,
			tseScrollbar: null,
			chatResizer: null,
		};
		this.Notification = window.Notification;
		this.sessionTries = 0;
		this.lastSave = ((+new Date() / 1e3) | 0) - 5;
		this.lastSession = ((+new Date() / 1e3) | 0) - 5;
		this.startTime = ((+new Date() / 1e3) | 0) + 5;
	}

	ChatManager.prototype.load = function (data) {
		var _self = this;
		this.url = this.document.location.href;

		if (validURL(this.url)) canLoad = true;
		else canLoad = false;

		if (data === undefined || data === null) {
			// Load general settings
			chrome.storage.sync.get(generalAddonKey, function (items) {
				if (items === null) _self.generalSettings = _self.defaultGeneralSettings;
				else {
					if (items[generalAddonKey] !== undefined && items[generalAddonKey] !== null)
						_self.generalSettings = items[generalAddonKey];
					else _self.generalSettings = _self.defaultGeneralSettings;
				}
				if (_self.generalSettings.darkTheme) _self.darkTheme = _self.generalSettings.darkTheme;
				if (_self.generalSettings.userName && _self.generalSettings.userName !== '')
					_self.userName = _self.generalSettings.userName;
				if (_self.generalSettings.nameColor && _self.generalSettings.nameColor !== '') {
					_self.nameColor = _self.generalSettings.nameColor;
					_self.hexNameColor = hexToRgb('#' + _self.generalSettings.nameColor);
				}
			});
			// Load name chat addon settings
			chrome.storage.sync.get(chatAddonKey, function (items) {
				if (items === null) _self.load(_self.defaultChatSettings);
				else {
					if (items[chatAddonKey] !== undefined && items[chatAddonKey] !== null) _self.load(items[chatAddonKey]);
					else _self.load(_self.defaultChatSettings);
				}
			});
		} else {
			this.chatAddonSettings = data;
			this.lstTriggers = [];
			if (this.chatAddonSettings.Highlight !== undefined) {
				if (this.chatAddonSettings.Highlight.tab !== undefined && this.chatAddonSettings.Highlight.tab)
					this.customHightlight = true;
				if (this.chatAddonSettings.Highlight.back !== undefined && this.chatAddonSettings.Highlight.back)
					this.customHightlight = true;
				if (this.chatAddonSettings.Highlight.text !== undefined && this.chatAddonSettings.Highlight.text)
					this.customHightlight = true;
				if (this.userName !== undefined && this.userName !== '') {
					this.lstTriggers.push(this.userName.toLowerCase());
					this.lstTriggers.push('@' + this.userName.toLowerCase());
				}
				if (this.chatAddonSettings.Highlight.additional !== undefined) {
					this.chatAddonSettings.Highlight.additional.split(',').forEach(function (element) {
						if (element !== undefined && element !== null && element !== '' && element !== ',') {
							var name = element.toLowerCase();
							if (_self.lstTriggers.indexOf(name) < 0) _self.lstTriggers.push(name);
						}
					}, this);
				}
			}
			if (this.chatAddonSettings.HideImages !== undefined) {
				if (this.chatAddonSettings.HideImages === true) {
					this.hideImages = true;
				}
			}
			this.startTime = ((+new Date() / 1e3) | 0) + 5;

			_self.loadSession();
			_self.chatChecks();
		}
	};

	ChatManager.prototype.save = function () {
		var curTime = (+new Date() / 1e3) | 0;
		if (curTime - this.lastSave >= 5) {
			this.lastSave = curTime;
			// Save general settings
			if (this.userName !== '') this.generalSettings.userName = this.userName.toString();
			if (this.nameColor !== '') this.generalSettings.nameColor = this.nameColor.toString();
			if (this.generalSettings !== undefined && this.generalSettings !== null) {
				var generalJson = {};
				generalJson[generalAddonKey] = this.generalSettings;
				chrome.storage.sync.set(generalJson);
			}
			// Save chat settings
			if (this.chatAddonSettings !== null && this.chatAddonSettings.Highlight !== undefined) {
				var chatJson = {};
				chatJson[chatAddonKey] = this.chatAddonSettings;
				chrome.storage.sync.set(chatJson);
			}
		}
	};

	ChatManager.prototype.loadSession = function () {
		var curTime = (+new Date() / 1e3) | 0;
		if (curTime - this.lastSession >= 2) {
			var _self = this;
			this.lastSession = curTime;
			var ls = window.localStorage;
			var scSession = ls.getItem('ls/smashcast.session');
			if (scSession !== undefined && scSession !== null) {
				this.session = JSON.parse(scSession);
				if (this.session.user_name) {
					this.userName = this.session.user_name.toString();
				}
				var color = ls.getItem('ls/chat.chatOptions.nameColor').replace(/^"(.*)"$/, '$1');
				if (color !== undefined && color !== null) {
					this.nameColor = color.toString();
					this.hexNameColor = hexToRgb('#' + color.toString());
				}
				if (this.generalSettings.userName !== this.userName || this.generalSettings.nameColor !== this.nameColor) {
					this.save();
				}
				this.sessionTries = 0;
			} else {
				// Try every two second until session is found or 10 tries has happend
				if (this.sessionTries < 10) {
					setTimeout(function () {
						_self.sessionTries++;
						_self.loadSession();
					}, 2000);
				}
			}
		}
	};

	// yt-live-chat-renderer
	// yt-live-chat-item-list-renderer

	// yt-live-chat-item-list-renderer
	ChatManager.prototype.chatChecks = function () {
		var _self = this;
		if (canLoad && isChannel) {
			this.chatRenderer = this.document.getElementsByClassName('yt-live-chat-renderer')[0];
			if (this.chatRenderer !== undefined && this.chatRenderer !== null) {
				if (this.chatRenderer.hasListener === undefined) {
					this.chatRenderer.hasListener = true;
					this.chatRenderer.addEventListener(
						'DOMNodeInserted',
						function () {
							var child = this.lastChild;
							var chatMessage = child.getElementsByClassName('yt-live-chat-text-message-renderer')[0];
							var chatText = chatMessage.getElementsById('message')[0];
							if (chatText !== undefined && chatText !== null) {
								var message = chatText.innerHTML;

								if (_self.customHightlight) {
									_self.checkHighlights(_self, message, chatText, chatMessage);
								}

								if (_self.hideImages) {
									_self.checkImages(_self, message, chatMessage);
								}
							}

							var chatConnected = child.getElementsByClassName('chat-status-message')[0];
							if (chatConnected !== undefined && chatConnected !== null) {
								this.startTime = ((+new Date() / 1e3) | 0) + 5;
							}
						},
						false,
					);
				}
			} else {
				return;
			}
		}
	};

	ChatManager.prototype.checkHighlights = function (_self, message, chatText, child) {
		var foundName = false;
		if (message.indexOf('<span class="citation"') < 0) {
			foundName = message.split(' ').some(function (elem) {
				messageTriggerCheck(
					elem.replace(/[.-\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' '),
					_self.lstTriggers,
				);
			});
		} else {
			foundName = true;
		}

		if (foundName) {
			var nameColor = _self.nameColor.replace(/^"(.*)"$/, '$1');
			var hexNameColor = hexToRgb('#' + nameColor);
			if (_self.chatAddonSettings.Highlight.tab !== undefined && _self.chatAddonSettings.Highlight.tab) {
				child.style.borderLeft = 'medium solid #' + nameColor;
				child.style.borderColor = '#' + nameColor;
				child.className = 'citation';
			}
			if (_self.chatAddonSettings.Highlight.back !== undefined && _self.chatAddonSettings.Highlight.back) {
				if (_self.hexNameColor === null) _self.hexNameColor = hexToRgb('#' + nameColor);
				child.style.background =
					'rgba(' + _self.hexNameColor.r + ',' + _self.hexNameColor.g + ',' + _self.hexNameColor.b + ',0.1)';
				chatText.style.borderColor =
					'rgba(' + _self.hexNameColor.r + ',' + _self.hexNameColor.g + ',' + _self.hexNameColor.b + ',0.1)';
			}
			if (_self.chatAddonSettings.Highlight.text !== undefined && _self.chatAddonSettings.Highlight.text) {
				chatText.style.color = '#' + nameColor;
				chatText.style.borderColor = '#' + nameColor;
			}

			if (_self.chatAddonSettings.Notify !== undefined && _self.chatAddonSettings.Notify) {
				var userName = 'youtube.com';
				if (
					child.getElementsByClassName('chat-messages.compact .name')[0] !== undefined &&
					child.getElementsByClassName('chat-messages.compact .name')[0] !== null
				)
					userName = child.getElementsByClassName('name')[0].innerText;

				var date = new Date();
				var timestamp = (+new Date() / 1e3) | 0;
				if (_self.startTime < timestamp) {
					_self.buildNotification(
						userName,
						pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()),
						chatText.innerText,
					);
				}
			}
		}
	};

	ChatManager.prototype.checkImages = function (_self, message, child) {
		if (message.indexOf('<image src=') < 0 && message.indexOf('class="image"') < 0) {
			if (_self.textHasImage(message)) {
				child.style.display = 'none';
			}
		} else {
			child.style.display = 'none';
		}
	};

	ChatManager.prototype.textHasImage = function (text) {
		if (
			/chatimages.youtube.com/i.test(text) ||
			/media.riffsy.com/i.test(text) ||
			/giphy.com/i.test(text) ||
			/imgur.com/i.test(text) ||
			text.match(/\.(jpg|jpeg|png|gif|gifv)$/)
		) {
			return true;
		}
		return false;
	};

	ChatManager.prototype.buildNotification = function (userName, timestamp, message) {
		var _self = this;
		if (!('Notification' in window)) {
			return;
		} else if (_self.Notification.permission === 'granted') {
			_self.spawnNotification(userName, timestamp, message);
		} else if (_self.Notification.permission !== 'denied') {
			_self.Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					_self.spawnNotification(userName, timestamp, message);
				}
			});
		}
	};

	ChatManager.prototype.spawnNotification = function (userName, timestamp, message) {
		if (userName && timestamp && message) {
			if (message.length > 45) message = message.substring(0, 45) + '...';
			var options = {
				icon: chrome.runtime.getURL('img/smashcast+-icon-180x180.png'),
				title: 'Mentioned by ' + userName,
				body: message,
			};
			var notification = new this.Notification('Mentioned by ' + userName, options);
			setTimeout(
				function () {
					if (notification) notification.close();
				},
				5000,
				false,
			);
		}
	};

	function pad(n) {
		return n < 10 ? '0' + n : n;
	}

	function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
			  }
			: {
					r: 148,
					g: 187,
					b: 34,
			  };
	}

	function messageTriggerCheck(message, triggers) {
		message = message.toLowerCase();
		var foundTrigger = false;
		for (var i = 0; i < triggers.length; i++) {
			if (message === triggers[i].toLowerCase()) {
				foundTrigger = true;
				break;
			}
		}
		return foundTrigger;
	}

	function beginChatAddons() {
		if (validURL(document.location.href)) canLoad = true;
		else canLoad = false;

		if (canLoad === true) {
			if (chatManager === null) {
				chatManager = new ChatManager(window, document);
				chatManager.load();
			} else chatManager.load();
		}
	}

	// Listeners
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		if (request.type && request.type === 'smashcast+' && request.system && request.system === 'background') {
			if (request.action && request.action === 'tab_change') {
				beginChatAddons();
			}
		}
	});

	// Check for storage changes
	chrome.storage.onChanged.addListener(function (changes, namespace) {
		for (var key in changes) {
			if (chatManager !== undefined && chatManager !== null) {
				if (key === chatManager.chatAddonKey || key === chatManager.generalAddonKey) {
					beginChatAddons();
				}
			}
		}
	});
})();
