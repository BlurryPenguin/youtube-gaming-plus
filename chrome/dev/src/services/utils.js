// general.js

const visualSettingsKey = 'youTubeGamingPlus.visualSettings';
const chatUsersKey = 'youTubeGamingPlus.chatters';
const defaultVisualSettings = {
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

const defaultChatElements = {
	target: document.createElement('div'),
	app: undefined,
	innerBody: undefined,
	dropdown: undefined,
	modes: undefined,
	inputRenderer: undefined,
	textInputFieldRenderer: undefined,
	inputField: undefined,
	ironDropdown: undefined,
	dropdownContent: undefined,
};

const supportedChannels = [
	{ youtube: { name: 'blurrypenguin', enable: true }, twitch: { name: 'blurrypenguin', id: 134609363 } },
	{ youtube: { name: 'valkyrae', enable: true }, twitch: { name: 'valkyrae', id: 79615025 } },
	{ youtube: { name: 'courage', enable: true }, twitch: { name: 'couragejd', id: 106125347 } },
	{ youtube: { name: 'timthetatman', enable: true }, twitch: { name: 'timthetatman', id: 36769016 } },
	{ youtube: { name: 'drlupo', enable: true }, twitch: { name: 'drlupo', id: 29829912 } },
	{ youtube: { name: 'ludwig', enable: false }, twitch: { name: 'ludwig', id: 40934651 } },
];

const defaultEmoji = {
	emojiId: 'ytg-0674b390-c5e2-464a-bc48-8ff6c70a03d6',
	image: {
		accessibility: {
			accessibilityData: {
				label: 'yt',
			},
		},
		thumbnails: [
			{
				height: 24,
				url: '',
				width: 24,
			},
			{
				height: 48,
				url: '',
				width: 48,
			},
		],
	},
	isCustomEmoji: true,
	searchTerms: [''],
	shortcuts: ['::'],
};

const defaultElement = document.createElement('empty');

class Chrome {
	static getProto = (base) => {
		return base.constructor.prototype || Object.getPrototypeOf(base);
	};

	static getMethods = (obj) => {
		let properties = new Set();
		let currentObj = obj;
		do {
			Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item));
		} while ((currentObj = Object.getPrototypeOf(currentObj)));
		return [...properties.keys()].filter((item) => typeof obj[item] === 'function');
	};

	static getProps = (obj) => {
		let p = [];
		for (; obj != null; obj = Object.getPrototypeOf(obj)) {
			const op = Object.getOwnPropertyNames(obj);
			for (let i = 0; i < op.length; i++) if (p.indexOf(op[i]) == -1) p.push(op[i]);
		}
		return p;
	};

	static getFunctions = (base) => {
		const obj = base.constructor.prototype;
		return Object.getOwnPropertyNames(obj).filter((key) => typeof String.prototype[key] == 'function');
	};
}

class Utils {
	static isNumber = (value) => typeof value === 'number' && isFinite(value);

	static isBoolean = (value) => typeof val === 'boolean';

	static canRun = (valid, url) => {
		if (valid.test(url)) return true;
		return false;
	};

	static uuid = () => crypto.randomUUID();

	static uuid4 = () =>
		([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
			(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
		);

	static exists = (element) => element !== undefined && element !== null;

	static invalidElement = (element) => !this.exists(element) || element.tagName === '' || element.tagName === 'empty';

	static generatePastelColor = () => {
		let R = Math.floor(Math.random() * 127 + 127);
		let G = Math.floor(Math.random() * 127 + 127);
		let B = Math.floor(Math.random() * 127 + 127);

		let rgb = (R << 16) + (G << 8) + B;
		return `#${rgb.toString(16)}`;
	};

	static getDocument = (element) => element.contentDocument || element.contentWindow.document;

	static zt =
		window.ShadyDOM && window.ShadyDOM.noPatch && window.ShadyDOM.wrap
			? window.ShadyDOM.wrap
			: window.ShadyDOM
			? function (a) {
					return ShadyDOM.patch(a);
			  }
			: function (a) {
					return a;
			  };

	static fire = (e, f, g) => {
		g = g || {};
		f = null === f || void 0 === f ? {} : f;
		const evt = new Event(e, {
			bubbles: void 0 === g.bubbles ? !0 : g.bubbles,
			cancelable: !!g.cancelable,
			composed: void 0 === g.composed ? !0 : g.composed,
		});
		evt.detail = f;
		//this.zt(g.node || window).dispatchEvent(e);
		window.dispatchEvent(evt);
		return evt;
	};

	static getMethods = (obj) => {
		let properties = new Set();
		let currentObj = obj;
		do {
			Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item));
		} while ((currentObj = Object.getPrototypeOf(currentObj)));
		return [...properties.keys()].filter((item) => typeof obj[item] === 'function');
	};

	static randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

	static splitMessage = (message) => {
		const pattern = /\s*(<[^>]*>)|[\s.,?!\/]/gim;
		return message.split(pattern).filter(Boolean);
	};

	static emoteToImage = ({ provider, src, code, id }) =>
		`<img class="emoji ${provider} yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="${src}" alt="${code}" title="${code}" shared-tooltip-text="${code}" id="emoji-${provider}-${id}" />`;

	static insertImages = (str, emote) =>
		Object.entries({ [emote.code]: emote }).reduce(
			(result, [key, { provider, src, code, id }]) =>
				result.replace(
					// [`[\s+]?${key}[\s+]?`
					new RegExp(`[\s+]?${code}[\s+]?`),
					`<img class="emoji ${provider} yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="${src}" alt="${code}" title="${code}" shared-tooltip-text="${code}" id="emoji-${provider}-${id}" />`,
				),
			str,
		);

	static fetchJSON = async (url, options = { node: 'cors' }) => {
		const handleStatusErrors = (response) => {
			if (!response.ok) {
				throw Error(response.statusText);
			}
			return response;
		};

		try {
			/* no-cors, *cors, same-origin */
			const response = await fetch(url, options);
			const response_2 = await handleStatusErrors(response);
			return response_2.json();
		} catch (e) {
			throw Error(e);
		}
	};

	static camelCaseToDashed = (str) => str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

	static dashToCamelCase = (str) => str.split('-').reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1));

	static dataToKey = (str) => {
		const key = this.dashToCamelCase(str).replace('data-', '');
		return key.charAt(0).toLowerCase() + key.slice(1);
	};

	static setAttributes = (el, attrs) => Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));

	static setDataAttributes = (el, attrs = {}) =>
		Object.keys(attrs).forEach((key) => el.setAttribute(`data-${this.camelCaseToDashed(key)}`, attrs[key]));

	static getDataAttributes = (el) => {
		let data = {};
		const dataset = el.dataset;

		for (const k in dataset) {
			let value = dataset[k];
			if (this.isBoolean(value)) data[k] = Boolean(value);
			else if (this.isNumber(value)) data[k] = Number(value);
			else data[k] = value;
		}

		return data;
	};

	static sendMessage = async (message) => {
		return new Promise((resolve, reject) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.tabs.sendMessage(
					tabs[0].id,
					{ type: 'youtubegaming+', system: 'ytg+', tabId: tabs[0]['id'], ...message },
					(response) => {
						if (chrome.runtime.lastError)
							return reject({ success: false, data: message, error: chrome.runtime.lastError.message });

						return resolve(response);
					},
				);
			});
		});
	};

	static A = {
		OverrideFunction: 0,
		RunBefore: 1,
		RunAfter: 2,
	};

	static C = (e, t, { locked: n }) => ({ functionName: e, function: t, locked: n || !1, type: this.A.RunBefore });

	static I = async (t, n) => {
		console.log(customElements);
		await customElements.whenDefined(t);
		const i = customElements.get(t);
		console.log(i);
		if (!i) return void console.warn(`Polymer: ${t} not found`);
		const o = i.prototype[n.functionName];
		i.prototype[n.functionName] = function (...t) {
			//if (n.locked && !t$1()) return o.apply(this, t);
			o.apply(this, t);
			if (n.type === Utils.A.OverrideFunction)
				try {
					return n.function.apply(this, t);
				} catch (t) {
					console.error(JSON.stringify(n)), console.error(t);
				}
			if (n.type === Utils.A.RunBefore)
				try {
					n.function.apply(this, t);
				} catch (t) {
					console.error(t);
				}
			let i = o.apply(this, t);
			if (n.type === Utils.A.RunAfter)
				try {
					i = n.function.apply(this, [i]);
				} catch (t) {
					console.error(t);
				}
			return i;
		};
		console.log(i);
	};
}
