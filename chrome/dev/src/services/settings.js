// settings.js

const statusTmr = undefined;
let _settings = { visual: defaultVisualSettings };
let lastLoad = { visual: defaultVisualSettings };
let elements = {
	general: {
		RefreshBtn: document.getElementById('refreshBtn'),
		SaveBtn: document.getElementById('saveBtn'),
		SectionStatus: document.getElementById('sectionStatus'),
		Loading: document.getElementById('loading'),
		Loaded: document.getElementById('loaded'),
	},
	visual: {
		Section: document.getElementById('sectionVisual'),
		TheatreMode: document.getElementById('chkTheatreMode'),
		ShowReplayChat: document.getElementById('chkShowReplayChat'),
		QualityOptimization: document.getElementById('chkQualityOptimization'),
		chat: {
			Section: document.getElementById('sectionChat'),
			NameColor: document.getElementById('chkNameColor'),
			UserIcon: document.getElementById('chkUserIcon'),
			ShowDeleted: document.getElementById('chkShowDeleted'),
			SimulatedDelay: document.getElementById('chkSimulatedDelay'),
			SeparatedLines: document.getElementById('chkSeparatedLines'),
			BTTVEmotes: document.getElementById('chkBTTVEmotes'),
			FFZEmotes: document.getElementById('chkFFZEmotes'),
		},
	},
};

const toggleSwitch = (elem, checked = true) => {
	if (checked === undefined) checked = true;
	if (checked) elem.setAttribute('checked', '');
	else elem.removeAttribute('checked');
};

const getSwitchValue = (elem) => {
	if (elem.hasAttribute('checked')) return true;
	else return false;
};

const enableSave = () => {
	elements.general.SaveBtn.style.display = 'block';
};

const disableSave = () => {
	elements.general.SaveBtn.style.display = 'none';
};

const refresh = () => {
	disableSave();
	elements.general.Loading.style.display = 'block';
	elements.general.Loaded.style.display = 'none';

	_settings = { ...lastLoad };
	setUI().finally(() => {
		elements.general.Loading.style.display = 'none';
		elements.general.Loaded.style.display = 'block';
	});
};

// Set UI values
const setUI = () => {
	return new Promise((resolve) => {
		const visualSettings = _settings.visual;
		if (visualSettings.theatreMode) toggleSwitch(elements.visual.TheatreMode, true);
		else toggleSwitch(elements.visual.TheatreMode, false);

		if (visualSettings.showReplayChat) toggleSwitch(elements.visual.ShowReplayChat, true);
		else toggleSwitch(elements.visual.ShowReplayChat, false);

		if (visualSettings.qualityOptimization) toggleSwitch(elements.visual.QualityOptimization, true);
		else toggleSwitch(elements.visual.QualityOptimization, false);

		if (visualSettings.chat.nameColor) toggleSwitch(elements.visual.chat.NameColor, true);
		else toggleSwitch(elements.visual.chat.NameColor, false);

		if (visualSettings.chat.icon) toggleSwitch(elements.visual.chat.UserIcon, true);
		else toggleSwitch(elements.visual.chat.UserIcon, false);

		if (visualSettings.chat.showDeleted) toggleSwitch(elements.visual.chat.ShowDeleted, true);
		else toggleSwitch(elements.visual.chat.ShowDeleted, false);

		if (visualSettings.chat.simulatedDelay) toggleSwitch(elements.visual.chat.SimulatedDelay, true);
		else toggleSwitch(elements.visual.chat.SimulatedDelay, false);

		if (visualSettings.chat.separatedLines) toggleSwitch(elements.visual.chat.SeparatedLines, true);
		else toggleSwitch(elements.visual.chat.SeparatedLines, false);

		if (visualSettings.chat.bttvEmotes) toggleSwitch(elements.visual.chat.BTTVEmotes, true);
		else toggleSwitch(elements.visual.chat.BTTVEmotes, false);

		if (visualSettings.chat.ffzEmotes) toggleSwitch(elements.visual.chat.FFZEmotes, true);
		else toggleSwitch(elements.visual.chat.FFZEmotes, false);

		resolve();
	});
};

// Saves settings to chrome.storage
const save = () => {
	let _new = { ..._settings };
	// Visual Settings
	_new.visual.theatreMode = getSwitchValue(elements.visual.TheatreMode);
	_new.visual.showReplayChat = getSwitchValue(elements.visual.ShowReplayChat);
	_new.visual.qualityOptimization = getSwitchValue(elements.visual.QualityOptimization);
	_new.visual.chat.nameColor = getSwitchValue(elements.visual.chat.NameColor);
	_new.visual.chat.icon = getSwitchValue(elements.visual.chat.UserIcon);
	_new.visual.chat.showDeleted = getSwitchValue(elements.visual.chat.ShowDeleted);
	_new.visual.chat.simulatedDelay = getSwitchValue(elements.visual.chat.SimulatedDelay);
	_new.visual.chat.separatedLines = getSwitchValue(elements.visual.chat.SeparatedLines);
	_new.visual.chat.bttvEmotes = getSwitchValue(elements.visual.chat.BTTVEmotes);
	_new.visual.chat.ffzEmotes = getSwitchValue(elements.visual.chat.FFZEmotes);

	Utils.sendMessage({ system: 'settings', action: 'setSync', key: visualSettingsKey, data: _new['visual'] })
		.then(() => {
			const status = document.getElementById('status');
			status.textContent = 'Status: Saved!';
			elements.general.SectionStatus.style.display = 'block';

			return _new;
		})
		.catch(async (error) => {
			try {
				await Storage.setSync(visualSettingsKey, _new.visual);
				const status = document.getElementById('status');
				elements.general.SectionStatus.style.display = 'block';
				status.textContent = 'Status: Saved!';
				return _new;
			} catch {
				console.error('save sendMessage', error);
				const status_1 = document.getElementById('status');
				status_1.textContent = 'Status: Failed to save!';
				elements.general.SectionStatus.style.display = 'block';
				return _new;
			}
		})
		.finally(() => {
			_settings = { ..._new };
			lastLoad = { ..._new };

			setTimeout(() => {
				const status = document.getElementById('status');
				status.textContent = 'Status: waiting...';
				elements.general.SectionStatus.style.display = 'none';
			}, 1500);
			disableSave();
		});
};

// Load Settings
const loadSettings = () => {
	elements.general.Loading.style.display = 'block';
	elements.general.Loaded.style.display = 'none';

	let newVisualSettings = { ...defaultVisualSettings };
	Utils.sendMessage({ system: 'settings', action: 'getSync', key: visualSettingsKey, data: defaultVisualSettings })
		.then((response) => {
			const loadedData = response !== undefined && response.data ? response.data : {};
			newVisualSettings = { ...defaultVisualSettings, ...loadedData };
			return newVisualSettings;
		})
		.catch(async () => {
			const response = await Storage.getSync(visualSettingsKey, JSON.stringify(defaultVisualSettings));
			newVisualSettings = { ...defaultVisualSettings, ...response };
			return newVisualSettings;
		})
		.finally(() => {
			_settings.visual = { ...newVisualSettings };
			lastLoad.visual = { ...newVisualSettings };

			setUI().finally(() => {
				elements.general.Loading.style.display = 'none';
				elements.general.Loaded.style.display = 'block';
			});
		});
};

const setElements = () => {
	elements = {
		general: {
			RefreshBtn: document.getElementById('refreshBtn'),
			SaveBtn: document.getElementById('saveBtn'),
			SectionStatus: document.getElementById('sectionStatus'),
			Loading: document.getElementById('loading'),
			Loaded: document.getElementById('loaded'),
		},
		visual: {
			Section: document.getElementById('sectionVisual'),
			TheatreMode: document.getElementById('chkTheatreMode'),
			ShowReplayChat: document.getElementById('chkShowReplayChat'),
			QualityOptimization: document.getElementById('chkQualityOptimization'),
			chat: {
				Section: document.getElementById('sectionChat'),
				NameColor: document.getElementById('chkNameColor'),
				UserIcon: document.getElementById('chkUserIcon'),
				ShowDeleted: document.getElementById('chkShowDeleted'),
				SimulatedDelay: document.getElementById('chkSimulatedDelay'),
				SeparatedLines: document.getElementById('chkSeparatedLines'),
				BTTVEmotes: document.getElementById('chkBTTVEmotes'),
				FFZEmotes: document.getElementById('chkFFZEmotes'),
			},
		},
	};
	elements.general.RefreshBtn.addEventListener('click', refresh);
	elements.general.SaveBtn.addEventListener('click', save);

	// Settings change listeners
	elements.visual.TheatreMode.addEventListener(
		'click',
		() => {
			if (elements.visual.TheatreMode.checked) toggleSwitch(elements.visual.TheatreMode, true);
			else toggleSwitch(elements.visual.TheatreMode, false);

			enableSave();
		},
		false,
	);
	elements.visual.ShowReplayChat.addEventListener(
		'click',
		() => {
			if (elements.visual.ShowReplayChat.checked) toggleSwitch(elements.visual.ShowReplayChat, true);
			else toggleSwitch(elements.visual.ShowReplayChat, false);

			enableSave();
		},
		false,
	);
	elements.visual.QualityOptimization.addEventListener(
		'click',
		() => {
			if (elements.visual.QualityOptimization.checked) toggleSwitch(elements.visual.QualityOptimization, true);
			else toggleSwitch(elements.visual.QualityOptimization, false);

			enableSave();
		},
		false,
	);

	elements.visual.chat.NameColor.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.NameColor.checked) toggleSwitch(elements.visual.chat.NameColor, true);
			else toggleSwitch(elements.visual.chat.NameColor, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.UserIcon.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.UserIcon.checked) toggleSwitch(elements.visual.chat.UserIcon, true);
			else toggleSwitch(elements.visual.chat.UserIcon, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.ShowDeleted.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.ShowDeleted.checked) toggleSwitch(elements.visual.chat.ShowDeleted, true);
			else toggleSwitch(elements.visual.chat.ShowDeleted, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.SimulatedDelay.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.SimulatedDelay.checked) toggleSwitch(elements.visual.chat.SimulatedDelay, true);
			else toggleSwitch(elements.visual.chat.SimulatedDelay, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.SeparatedLines.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.SeparatedLines.checked) toggleSwitch(elements.visual.chat.SeparatedLines, true);
			else toggleSwitch(elements.visual.chat.SeparatedLines, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.BTTVEmotes.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.BTTVEmotes.checked) toggleSwitch(elements.visual.chat.BTTVEmotes, true);
			else toggleSwitch(elements.visual.chat.BTTVEmotes, false);

			enableSave();
		},
		false,
	);
	elements.visual.chat.FFZEmotes.addEventListener(
		'click',
		() => {
			if (elements.visual.chat.FFZEmotes.checked) toggleSwitch(elements.visual.chat.FFZEmotes, true);
			else toggleSwitch(elements.visual.chat.FFZEmotes, false);

			enableSave();
		},
		false,
	);

	loadSettings();
};

window.onload = () => {
	if (document.getElementsByClassName('ytg-plus-settings-root').length > 0) setElements();
};
