// settings.js
'use strict';

(function () {
	/* global chrome */

	var defaultGeneralSettings = {
		darkTheme: false,
		userName: '',
		nameColor: '208efc',
	};
	var defaultChatSettings = {
		Highlight: {
			tab: false,
			back: false,
			text: false,
			additional: '',
		},
		Notify: false,
		HideImages: false,
	};
	var generalAddonKey = 'YouTubeGamingPlus.generalSettings';
	var chatAddonKey = 'YouTubeGamingPlus.chatSettings';
	var switchOn = {
		className: 'fltR toggle-switch-settings toggle-switch ng-isolate-scope ng-valid ng-dirty ng-valid-parse switch-off',
		innerHTML: '<span class="knob"><div></div></span><span class="switch-right ng-binding">Off</span>',
	};
	var switchOff = {
		className: 'fltR toggle-switch-settings toggle-switch ng-isolate-scope ng-valid ng-dirty ng-valid-parse switch-on',
		innerHTML: '<span class="switch-left ng-binding">On</span><span class="knob"><div></div></span>',
	};

	var initialLoad = true;
	var _self = {};
	var lastLoad = {};
	var tmrHighlightNames = null;
	var elems = {
		general: {
			SaveBtn: document.getElementById('saveBtn'),
			SectionStatus: document.getElementById('sectionStatus'),
			Loading: document.getElementById('loading'),
			Loaded: document.getElementById('loaded'),
			Theme: document.getElementById('chkTheme'),
		},
		chat: {
			Section: document.getElementById('sectionChat'),
			Highlight: {
				example: document.getElementById('spanExampleHighlight'),
				tab: document.getElementById('chkTabHighlight'),
				back: document.getElementById('chkBackHighlight'),
				text: document.getElementById('chkTextHighlight'),
				additional: document.getElementById('txtHighlightNames'),
			},
			Notify: {
				li: document.getElementById('desktopNotification'),
				chk: document.getElementById('chkNotify'),
			},
			HideImages: document.getElementById('chkHideImages'),
		},
	};

	function RgbFromHex(hex) {
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

	function removeData(key, callback) {
		chrome.storage.sync.remove(key, function () {
			callback(true);
		});
	}

	// Set UI values
	function setUI() {
		if (_self.generalSettings === undefined) {
			toggleSwitch(elems.general.theme, switchOff);
		} else {
			if (_self.generalSettings.darkTheme) toggleSwitch(elems.general.Theme, switchOff);
			else toggleSwitch(elems.general.Theme, switchOn);
		}
		if (_self.chatSettings === undefined) {
			toggleSwitch(elems.chat.Highlight.tab, switchOff);
			toggleSwitch(elems.chat.Highlight.back, switchOff);
			toggleSwitch(elems.chat.Highlight.text, switchOff);
			toggleSwitch(elems.chat.Notify.chk, switchOff);
			toggleSwitch(elems.chat.HideImages, switchOff);
			elems.chat.Highlight.additional.value = '';
		} else {
			if (_self.chatSettings.Highlight.tab) toggleSwitch(elems.chat.Highlight.tab, switchOff);
			else toggleSwitch(elems.chat.Highlight.tab, switchOn);
			if (_self.chatSettings.Highlight.back) toggleSwitch(elems.chat.Highlight.back, switchOff);
			else toggleSwitch(elems.chat.Highlight.back, switchOn);
			if (_self.chatSettings.Highlight.text) toggleSwitch(elems.chat.Highlight.text, switchOff);
			else toggleSwitch(elems.chat.Highlight.text, switchOn);
			if (_self.chatSettings.Notify) toggleSwitch(elems.chat.Notify.chk, switchOff);
			else toggleSwitch(elems.chat.Notify.chk, switchOn);

			if (_self.chatSettings.Highlight.additional !== undefined)
				elems.chat.Highlight.additional.value = _self.chatSettings.Highlight.additional;
			else elems.chat.Highlight.additional.value = defaultChatSettings.Highlight.additional;

			if (_self.chatSettings.HideImages) toggleSwitch(elems.chat.HideImages, switchOff);
			else toggleSwitch(elems.chat.HideImages, switchOn);
		}
		setChatHighlights();
		if (initialLoad) {
			initialLoad = false;
			elems.general.Loading.style.display = 'none';
			elems.general.Loaded.style.display = 'block';
		}
	}

	function setChatHighlights() {
		var color = '208efc';
		if (_self.generalSettings !== undefined) {
			color = _self.generalSettings.nameColor;
		}
		if (elems.chat.Highlight.example !== undefined) {
			if (getSwitchValue(elems.chat.Highlight.tab)) {
				elems.chat.Highlight.example.className = 'chat-text';
				elems.chat.Highlight.example.style.borderLeft = 'medium solid #' + color;
				elems.chat.Highlight.example.style.borderColor = '#' + color;
			} else {
				elems.chat.Highlight.example.style.borderLeft = '';
				elems.chat.Highlight.example.style.borderColor = '';
			}
			if (getSwitchValue(elems.chat.Highlight.back)) {
				var hexNameColor = RgbFromHex('#' + color);
				elems.chat.Highlight.example.className = 'chat-text';
				elems.chat.Highlight.example.style.background =
					'rgba(' + hexNameColor.r + ',' + hexNameColor.g + ',' + hexNameColor.b + ',0.1)';
				elems.chat.Highlight.example.style.borderColor =
					'rgba(' + hexNameColor.r + ',' + hexNameColor.g + ',' + hexNameColor.b + ',0.1)';
			} else {
				elems.chat.Highlight.example.style.background = '';
				if (!_self.chatSettings.Highlight.tab) elems.chat.Highlight.example.style.borderColor = '';
			}
			if (getSwitchValue(elems.chat.Highlight.text)) {
				elems.chat.Highlight.example.className = 'chat-text';
				elems.chat.Highlight.example.style.color = '#' + color;
				elems.chat.Highlight.example.style.borderColor = '#' + color;
			} else {
				elems.chat.Highlight.example.style.color = '';
				if (!_self.chatSettings.Highlight.tab && !_self.chatSettings.Highlight.back)
					elems.chat.Highlight.example.style.borderColor = '';
			}
		}
	}

	function commaSeperate(text, removeExtras, removeLast) {
		if (removeExtras === undefined) removeExtras = false;
		if (removeLast === undefined) removeLast = false;
		text = text.replace(/ /g, ',');
		do {
			text = text.replace(',,', ',');
		} while (text.indexOf(',,') > 0);
		if (removeLast && text.substring(text.length - 1) === ',') text = text.substring(0, text.length - 1);
		if (removeExtras) return text.replace(/[.-\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ');
		else return text;
	}

	function setElems() {
		elems = {
			general: {
				SaveBtn: document.getElementById('saveBtn'),
				SectionStatus: document.getElementById('sectionStatus'),
				Loading: document.getElementById('loading'),
				Loaded: document.getElementById('loaded'),
				Theme: document.getElementById('chkTheme'),
			},
			chat: {
				Section: document.getElementById('sectionChat'),
				Highlight: {
					example: document.getElementById('spanExampleHighlight'),
					tab: document.getElementById('chkTabHighlight'),
					back: document.getElementById('chkBackHighlight'),
					text: document.getElementById('chkTextHighlight'),
					additional: document.getElementById('txtHighlightNames'),
				},
				Notify: {
					li: document.getElementById('desktopNotification'),
					chk: document.getElementById('chkNotify'),
				},
				HideImages: document.getElementById('chkHideImages'),
			},
		};
	}

	function toggleSwitch(elem, value) {
		if (value === undefined) value = switchOn;
		elem.innerHTML = value.innerHTML;
		elem.className = value.className;
	}

	function getSwitchValue(elem) {
		if (elem.className === switchOff.className) return true;
		else return false;
	}

	function enableSave() {
		elems.general.SaveBtn.style.display = 'block';
	}

	function disableSave() {
		elems.general.SaveBtn.style.display = 'none';
	}

	// Saves settings to chrome.storage
	function save() {
		var _new = {
			generalSettings: defaultGeneralSettings,
			chatSettings: defaultChatSettings,
		};
		// General Settings
		_new.generalSettings.userName = _self.generalSettings.userName;
		_new.generalSettings.nameColor = _self.generalSettings.nameColor;
		_new.generalSettings.darkTheme = getSwitchValue(elems.general.Theme);
		// Chat Settings
		_new.chatSettings.Highlight.tab = getSwitchValue(elems.chat.Highlight.tab);
		_new.chatSettings.Highlight.back = getSwitchValue(elems.chat.Highlight.back);
		_new.chatSettings.Highlight.text = getSwitchValue(elems.chat.Highlight.text);
		_new.chatSettings.Notify = getSwitchValue(elems.chat.Notify.chk);
		_new.chatSettings.HideImages = getSwitchValue(elems.chat.HideImages);
		if (_self.chatSettings) {
			if (_self.chatSettings.Highlight) {
				if (_self.chatSettings.Highlight.additional !== undefined)
					_new.chatSettings.Highlight.additional = commaSeperate(elems.chat.Highlight.additional.value, true, true);
				else _new.chatSettings.Highlight.additional = defaultChatSettings.Highlight.additional;
			}
		}

		saveData(generalAddonKey, _new.generalSettings, function (generalResponse) {
			var status = null;
			if (generalResponse) {
				// Save chat settings
				saveData(chatAddonKey, _new.chatSettings, function (chatResponse) {
					status = null;
					if (chatResponse) {
						_self = _new;
						lastLoad = _self;
						elems.chat.Highlight.additional.value = _self.chatSettings.Highlight.additional;
						status = document.getElementById('status');
						status.textContent = 'Settings saved.';
						elems.general.SectionStatus.style.display = 'block';
						setTimeout(function () {
							status.textContent = '';
							elems.general.SectionStatus.style.display = 'none';
						}, 1500);
						disableSave();
					} else {
						status = document.getElementById('status');
						status.textContent = 'Failed to save!';
						elems.general.SectionStatus.style.display = 'block';
						setTimeout(function () {
							status.textContent = '';
							elems.general.SectionStatus.style.display = 'none';
						}, 1500);
					}
				});
			} else {
				status = document.getElementById('status');
				status.textContent = 'Failed to save!';
				elems.general.SectionStatus.style.display = 'block';
				setTimeout(function () {
					status.textContent = '';
					elems.general.SectionStatus.style.display = 'none';
				}, 1500);
			}
		});
	}

	// Load Settings
	function loadGeneral() {
		loadData(generalAddonKey, defaultGeneralSettings, function (items) {
			var newSettings = defaultGeneralSettings;
			if (items !== null) {
				if (items.userName !== undefined && items.userName !== null) newSettings.userName = items.userName;
				if (items.nameColor !== undefined && items.nameColor !== null) newSettings.nameColor = items.nameColor;
				if (items.darkTheme !== undefined && items.darkTheme !== null) newSettings.darkTheme = items.darkTheme;
			}
			_self.generalSettings = newSettings;
			lastLoad.generalSettings = newSettings;
			// Load Chat Settings
			loadChatSettings();

			if (!('Notification' in window) || window.Notification.permission === 'denied') {
				elems.chat.Notify.li.style.display = 'none';
			} else {
				elems.chat.Notify.li.style.display = 'block';
			}
		});
	}

	function loadChatSettings() {
		loadData(chatAddonKey, defaultChatSettings, function (items) {
			var newSettings = defaultChatSettings;
			if (items !== null) {
				if (items.Highlight !== undefined && items.Highlight !== null) {
					if (items.Highlight.tab !== undefined && items.Highlight.tab !== null)
						newSettings.Highlight.tab = items.Highlight.tab;
					if (items.Highlight.back !== undefined && items.Highlight.back !== null)
						newSettings.Highlight.back = items.Highlight.back;
					if (items.Highlight.text !== undefined && items.Highlight.text !== null)
						newSettings.Highlight.text = items.Highlight.text;
					if (items.Highlight.additional !== undefined && items.Highlight.additional !== null)
						newSettings.Highlight.additional = items.Highlight.additional;
				}
				if (items.Notify !== undefined && items.Notify !== null) newSettings.Notify = items.Notify;
				if (items.HideImages !== undefined && items.HideImages !== null) newSettings.HideImages = items.HideImages;
			}
			_self.chatSettings = newSettings;
			lastLoad.chatSettings = newSettings;
			setUI();
		});
	}

	// Refresh settings/pageX
	function refresh() {
		if (lastLoad.generalSettings) _self.generalSettings = lastLoad.generalSettings;
		if (lastLoad.chatSettings) _self.chatSettings = lastLoad.chatSettings;
		setElems();
		setUI();
		disableSave();
	}

	document.addEventListener('DOMContentLoaded', function () {
		initialLoad = true;
		// Load elements
		setElems();
		// Load General Settings
		loadGeneral();
	});

	document.getElementById('refreshBtn').addEventListener('click', refresh);
	document.getElementById('saveBtn').addEventListener('click', save);

	// Settings changes
	document.getElementById('chkTabHighlight').addEventListener(
		'click',
		function () {
			if (_self.chatSettings && _self.chatSettings.Highlight) {
				if (elems.chat.Highlight.tab.className === switchOff.className)
					toggleSwitch(elems.chat.Highlight.tab, switchOn);
				else toggleSwitch(elems.chat.Highlight.tab, switchOff);
				setChatHighlights();
				enableSave();
			}
		},
		false,
	);

	document.getElementById('chkBackHighlight').addEventListener(
		'click',
		function () {
			if (_self.chatSettings && _self.chatSettings.Highlight) {
				if (elems.chat.Highlight.back.className === switchOff.className)
					toggleSwitch(elems.chat.Highlight.back, switchOn);
				else toggleSwitch(elems.chat.Highlight.back, switchOff);
				setChatHighlights();
				enableSave();
			}
		},
		false,
	);

	document.getElementById('chkTextHighlight').addEventListener(
		'click',
		function () {
			if (_self.chatSettings && _self.chatSettings.Highlight) {
				if (elems.chat.Highlight.text.className === switchOff.className)
					toggleSwitch(elems.chat.Highlight.text, switchOn);
				else toggleSwitch(elems.chat.Highlight.text, switchOff);
				setChatHighlights();
				enableSave();
			}
		},
		false,
	);

	document.getElementById('txtHighlightNames').addEventListener(
		'input',
		function (e) {
			if (_self.chatSettings && _self.chatSettings.Highlight) {
				// Clear timer if its currently running
				tmrHighlightNames = setTimeout(function () {
					e.target.value = commaSeperate(e.target.value, true);
				}, 500);
			}
			enableSave();
		},
		false,
	);

	document.getElementById('chkNotify').addEventListener(
		'click',
		function () {
			if (_self.chatSettings) {
				if (elems.chat.Notify.chk.className === switchOff.className) toggleSwitch(elems.chat.Notify.chk, switchOn);
				else toggleSwitch(elems.chat.Notify.chk, switchOff);
				enableSave();
			}
		},
		false,
	);

	document.getElementById('chkHideImages').addEventListener(
		'click',
		function () {
			if (_self.chatSettings) {
				if (elems.chat.HideImages.className === switchOff.className) toggleSwitch(elems.chat.HideImages, switchOn);
				else toggleSwitch(elems.chat.HideImages, switchOff);
				enableSave();
			}
		},
		false,
	);

	document.getElementById('chkTheme').addEventListener(
		'click',
		function () {
			if (_self.chatSettings) {
				if (elems.general.Theme.className === switchOff.className) toggleSwitch(elems.general.Theme, switchOn);
				else toggleSwitch(elems.general.Theme, switchOff);
				enableSave();
			}
		},
		false,
	);
})();
