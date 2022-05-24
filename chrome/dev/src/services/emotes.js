// emotes.js

class Emotes {
	bttv = []; // BTTV emotes
	ffz = []; // FFZ emotes
	emojis = []; // All emotes
	emoteCache = new Map();
	chatSettings = { ...defaultVisualSettings.chat };
	chatElements = { ...defaultChatElements };
	excludesWords = ['name'];

	constructor(props = { settings: defaultVisualSettings.chat }) {
		this.chatSettings = { ...props.settings };
		this.emoteCache.clear();
	}

	get chatSettings() {
		return this.chatSettings;
	}

	set chatSettings(value = defaultVisualSettings.chat) {
		this.chatSettings = value;
	}

	get bttv() {
		return this.bttv;
	}

	get ffz() {
		return this.ffz;
	}

	build = async () => {
		const emotes = [];

		if (this.chatSettings.bttvEmotes) {
			for (const emote of this.bttv) {
				if (emote.id && emote.code)
					emotes.push({
						provider: 'bttv',
						id: emote.id,
						code: emote.code,
						src: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
					});
			}
		}

		if (this.chatSettings.ffzEmotes) {
			for (const emote of this.ffz) {
				if (emote.id && emote.code && emote.images)
					emotes.push({
						provider: 'ffz',
						id: emote.id,
						code: emote.code,
						src: `${emote.images['1x']}`,
					});
			}
		}

		this.emojis = emotes;
		return emotes;
	};

	emoteData = (emote) => {
		let emoteUrl = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
		if (emote.provider === 'twitch') emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/static/dark/1.0`;
		else if (emote.provider === 'ffz') emoteUrl = `https://cdn.frankerfacez.com/emote/${emote.id}/1`;
		const name = emote.code.replace(/:/g, '');

		return {
			emojiId: 'ytg-' + name + '-' + emote.id,
			image: { thumbnails: [{ url: emoteUrl }], accessibility: { accessibilityData: { label: name } } },
			isCustomEmoji: true,
			searchTerms: [name],
			shortcuts: [':' + name + ':', name],
		};
	};

	create = async (chatElements = { ...defaultChatElements }) => {
		if (this.emojis.length <= 0 || this.emoteCache.size > 0) return false;

		this.emoteCache.clear();
		for (const emoji of this.emojis) {
			const e = this.emoteData(emoji);
			this.emoteCache.set(emoji.code, this.emoteData(emoji));
		}
		console.log(this.emoteCache.keys());

		if (Utils.invalidElement(chatElements.app)) chatElements.app = document.querySelector('yt-live-chat-app');
		if (!Utils.invalidElement(chatElements.app) && Utils.invalidElement(chatElements.innerBody))
			chatElements.innerBody = chatElements.app.closest('body');

		const target = document
			.querySelector('#chatframe')
			.contentDocument.querySelector('yt-live-chat-item-list-renderer');
		const emojiManager = document
			.querySelector('#chatframe')
			?.contentDocument?.querySelector('yt-live-chat-item-list-renderer')?.emojiManager;

		console.log('\n-------------------------');
		console.log(target);
		console.log(emojiManager);
		console.log('-------------------------\n');

		if (null == target ? {} : emojiManager) {
			console.log(emojiManager._ytg);
			if (emojiManager._ytg) return false;
			emojiManager._ytg = !0;
			n.emojiManager.load([...this.emoteCache.values()]);
			console.log(target);
			console.log(emojiManager);
			console.log(target['emojiManager']);
		} else console.warn('Cannot find chat list');

		console.log('emotes.create 2', target, emojiManager);

		if (!Utils.exists(emojiManager)) return false;

		console.log(emojiManager.emojis);
		return true;
	};

	getEmote = async (code = '') => this.emojis.find((e) => new RegExp(`[\s+]?${e.code}[\s+]?`, 'ig').test(code));

	getFromCode = (code = '') => this.emojis.filter((e) => e.code.toLowerCase().startsWith(code.toLowerCase()));

	injectBTTVPicker = async (element = defaultElement) => {
		if (Utils.invalidElement(element)) return false;

		const emojiCategories = element.querySelector(
			'yt-emoji-picker-renderer.yt-live-chat-message-input-renderer > #categories-wrapper > #categories',
		);

		if (!Utils.exists(emojiCategories)) return false;
		if (Utils.exists(emojiCategories.querySelector('#bttvEmojis'))) return false;

		const category = `<yt-emoji-picker-category-renderer class="style-scope yt-emoji-picker-renderer" aria-live="polite" role="listbox" tabindex="0" aria-label="BTTV" id="bttvEmojis" aria-activedescendant="aria-bttvEmojis"><yt-formatted-string id="title" class="style-scope yt-emoji-picker-category-renderer">BTTV</yt-formatted-string><div id="emoji" role="listbox" tabindex="0" class="style-scope yt-emoji-picker-category-renderer imgList" aria-label=""><dom-repeat id="repeat" class="style-scope yt-emoji-picker-category-renderer"><template is="dom-repeat"></template></dom-repeat></div></yt-emoji-picker-category-renderer>`;
		emojiCategories.children[0].insertAdjacentHTML('afterend', category);

		const bttvEmojis = emojiCategories.querySelector('#bttvEmojis');
		if (Utils.exists(bttvEmojis)) {
			bttvEmojis.setAttribute('aria-activedescendant', 'aria-bttvEmojis');
			bttvEmojis.setAttribute('aria-label', 'BTTV');
			bttvEmojis.querySelector('yt-formatted-string').innerText = 'BTTV';
			const imgList = bttvEmojis.querySelector('#emoji[role="listbox"]');
			const validEmojis = this.emojis.filter((e) => e.provider === 'bttv');
			if (Utils.exists(imgList)) {
				let images = '';
				for (const emoji of validEmojis) {
					images += `<img height="24" role="option" width="24" class="style-scope yt-emoji-picker-category-renderer bttvEmoji" src="https://cdn.betterttv.net/emote/${emoji.id}/1x" loading="eager" aria-selected="false" aria-label="${emoji.code}" label="${emoji.code}" alt="${emoji.code}" id="bttv-${emoji.id}" />`;
				}
				imgList.insertAdjacentHTML('afterbegin', images);
				const elements = imgList.getElementsByClassName('bttvEmoji');
				if (elements.length > 0) {
					let baseSearchPlaceholder = 'Search emoji';

					const onClick = (evt) => {
						const e = evt || window.event;
						const code = evt.currentTarget.getAttribute('label');
						const emoji = validEmojis.find((e) => e.code === code);
						if (emoji) {
							const inputContainer = evt.currentTarget.closest('yt-live-chat-message-input-renderer > #container');
							if (Utils.exists(inputContainer)) {
								const chatInput = inputContainer.querySelector(
									'yt-live-chat-message-input-renderer #input-container > yt-live-chat-text-input-field-renderer',
								);
								if (Utils.exists(chatInput)) {
									const chatInput = inputContainer.querySelector(
										'yt-live-chat-message-input-renderer #input-container > yt-live-chat-text-input-field-renderer',
									);
									if (Utils.exists(chatInput)) {
										let input = chatInput.querySelector('#input');
										if (Utils.exists(input)) {
											//input.innerText += ` ${code} `;
											chatInput.setAttribute('has-text', '');
											chatInput.dispatchEvent(new Event('character-count-changed'));
											//*
											chatInput?.insertEmoji({
												isCustomEmoji: true,
												shortcuts: [`:${emoji.code}`],
												emojiId: emoji.code,
											});
											chatInput?.focusAtEnd();
											//*/
										}
									}
								}
							}
						}
						e.preventDefault();
					};
					const onMouseOver = (evt) => {
						const code = evt.currentTarget.getAttribute('label');
						const emoji = validEmojis.find((e) => e.code === code);
						if (emoji) {
							const searchPanel = evt.currentTarget.closest('yt-emoji-picker-renderer').querySelector('#search-panel');
							if (Utils.exists(searchPanel)) {
								let input = searchPanel.querySelector('input');
								if (Utils.exists(input)) {
									baseSearchPlaceholder = `${input.placeholder}`;
									input.placeholder = `${code}`;
								}
							}
						}
					};
					const onMouseOut = (evt) => {
						const searchPanel = evt.currentTarget.closest('yt-emoji-picker-renderer').querySelector('#search-panel');
						if (Utils.exists(searchPanel)) {
							let input = searchPanel.querySelector('input');
							if (Utils.exists(input)) {
								input.placeholder = baseSearchPlaceholder;
							}
						}
					};

					for (const elem of elements) {
						elem.addEventListener('click', onClick, false);
						elem.addEventListener('mouseover', onMouseOver, false);
						elem.addEventListener('mouseout', onMouseOut, false);
					}
				}
			}
		}

		return true;
	};

	injectFFZPicker = async (element = defaultElement) => {
		if (Utils.invalidElement(element)) return false;

		const emojiCategories = element.querySelector(
			'yt-emoji-picker-renderer.yt-live-chat-message-input-renderer > #categories-wrapper > #categories',
		);

		if (!Utils.exists(emojiCategories)) return false;
		if (Utils.exists(emojiCategories.querySelector('#ffzEmojis'))) return false;

		const category = `<yt-emoji-picker-category-renderer class="style-scope yt-emoji-picker-renderer" aria-live="polite" role="listbox" tabindex="0" aria-label="FFZ" id="ffzEmojis" aria-activedescendant="aria-ffzEmojis"><yt-formatted-string id="title" class="style-scope yt-emoji-picker-category-renderer">FFZ</yt-formatted-string><div id="emoji" role="listbox" tabindex="0" class="style-scope yt-emoji-picker-category-renderer imgList" aria-label=""><dom-repeat id="repeat" class="style-scope yt-emoji-picker-category-renderer"><template is="dom-repeat"></template></dom-repeat></div></yt-emoji-picker-category-renderer>`;
		emojiCategories.children[0].insertAdjacentHTML('afterend', category);

		const ffzEmojis = emojiCategories.querySelector('#ffzEmojis');
		if (Utils.exists(ffzEmojis)) {
			ffzEmojis.setAttribute('aria-activedescendant', 'aria-ffzEmojis');
			ffzEmojis.setAttribute('aria-label', 'FFZ');
			ffzEmojis.querySelector('yt-formatted-string').innerText = 'FFZ';
			const imgList = ffzEmojis.querySelector('#emoji[role="listbox"]');
			const validEmojis = this.emojis.filter((e) => e.provider === 'ffz');
			if (Utils.exists(imgList)) {
				let images = '';
				for (const emoji of validEmojis) {
					images += `<img height="24" role="option" width="24" class="style-scope yt-emoji-picker-category-renderer ffzEmoji" src="https://cdn.betterttv.net/frankerfacez_emote/${emoji.id}/1" loading="eager" aria-selected="false" aria-label="${emoji.code}" label="${emoji.code}" alt="${emoji.code}" id="ffx-${emoji.id}" />`;
				}
				imgList.insertAdjacentHTML('afterbegin', images);
				const elements = imgList.getElementsByClassName('ffzEmoji');
				if (elements.length > 0) {
					let baseSearchPlaceholder = 'Search emoji';
					const onClick = (evt) => {
						const e = evt || window.event;
						const code = evt.currentTarget.getAttribute('label');
						const emoji = validEmojis.find((e) => e.code === code);
						if (emoji) {
							const inputContainer = evt.currentTarget.closest('yt-live-chat-message-input-renderer > #container');
							if (Utils.exists(inputContainer)) {
								const chatInput = inputContainer.querySelector(
									'yt-live-chat-message-input-renderer #input-container > yt-live-chat-text-input-field-renderer',
								);
								if (Utils.exists(chatInput)) {
									let input = chatInput.querySelector('#input');
									if (Utils.exists(input)) {
										//input.innerText += ` ${code} `;
										chatInput.setAttribute('has-text', '');
										chatInput.dispatchEvent(new Event('character-count-changed'));
										//*
										chatInput?.insertEmoji({
											isCustomEmoji: true,
											shortcuts: [`:${emoji.code}`],
											emojiId: emoji.code,
										});
										chatInput?.focusAtEnd();
										//*/
									}
								}
							}
						}
						e.preventDefault();
					};
					const onMouseOver = (evt) => {
						const code = evt.currentTarget.getAttribute('label');
						const emoji = validEmojis.find((e) => e.code === code);
						if (emoji) {
							const searchPanel = evt.currentTarget.closest('yt-emoji-picker-renderer').querySelector('#search-panel');
							if (Utils.exists(searchPanel)) {
								let input = searchPanel.querySelector('input');
								if (Utils.exists(input)) {
									baseSearchPlaceholder = `${input.placeholder}`;
									input.placeholder = `${code}`;
								}
							}
						}
					};
					const onMouseOut = (evt) => {
						const searchPanel = evt.currentTarget.closest('yt-emoji-picker-renderer').querySelector('#search-panel');
						if (Utils.exists(searchPanel)) {
							let input = searchPanel.querySelector('input');
							if (Utils.exists(input)) {
								input.placeholder = baseSearchPlaceholder;
							}
						}
					};

					for (const elem of elements) {
						elem.addEventListener('click', onClick, false);
						elem.addEventListener('mouseover', onMouseOver, false);
						elem.addEventListener('mouseout', onMouseOut, false);
					}
				}
			}
		}

		return true;
	};

	injectSuggestion = (
		chatElements = { ...defaultChatElements },
		emoji = { provider: '', id: '', code: '', src: '' },
		text = ':',
	) => {
		const _id = `emoji-suggest-${emoji.provider}-${emoji.id}`;
		const element = chatElements.dropdownContent;

		if (Utils.invalidElement(element)) return;
		if (Utils.exists(element.querySelector(`#${_id}`))) return;

		const inputFieldSuggestion = document.createElement('ytg-live-chat-text-input-field-suggestion');
		const paperItem = document.createElement('tp-yt-paper-item');
		const suggestionImg = document.createElement('img');
		const emojiData = {
			emoji: true,
			image: emoji.src,
			alt: emoji.code,
			text: `:${emoji.code}:`,
			author: emoji.provider,
			authorType: emoji.provider,
			textToReplaceWhenSelected: text.startsWith(':') ? text : `:${text}`,
			textToInsertWhenSelected: emoji.code,
		};

		inputFieldSuggestion.classList.add('style-scope', 'yt-live-chat-text-input-field-renderer');
		Utils.setAttributes(inputFieldSuggestion, { id: _id, ytg: '' });
		Utils.setDataAttributes(inputFieldSuggestion, { ...emojiData });

		paperItem.classList.add('style-scope', 'yt-live-chat-text-input-field-suggestion');
		paperItem.innerText = `:${emoji.code}:`;
		paperItem.addEventListener('mouseover', () => {
			inputFieldSuggestion.setAttribute('active', '');
		});
		paperItem.addEventListener('mouseout', () => {
			inputFieldSuggestion.removeAttribute('active');
		});
		Utils.setAttributes(paperItem, { role: 'option', tabindex: '0', 'aria-disabled': 'false' });
		paperItem.addEventListener('click', () => {
			inputFieldSuggestion.removeAttribute('active');

			const chatInput =
				chatElements.textInputFieldRenderer ??
				inputContainer.querySelector(
					'yt-live-chat-message-input-renderer #input-container > yt-live-chat-text-input-field-renderer',
				);
			if (Utils.exists(chatInput)) {
				const data = Utils.getDataAttributes(inputFieldSuggestion);
				chatInput.setAttribute('has-text', '');
				chatInput.dispatchEvent(new Event('character-count-changed'));
				/*
				chatInput?.insertEmoji({
					isCustomEmoji: true,
					shortcuts: [`:${emoji.code}`],
					emojiId: emoji.code,
				});
				chatInput?.focusAtEnd();
				*/
			}
		});

		suggestionImg.classList.add('style-scope', 'yt-live-chat-text-input-field-suggestion');
		Utils.setAttributes(suggestionImg, {
			src: emoji.src,
			alt: emoji.code,
		});

		paperItem.prepend(suggestionImg);
		inputFieldSuggestion.appendChild(paperItem);
		element.appendChild(inputFieldSuggestion);
	};

	injectSuggestions = (chatElements = { ...defaultChatElements }, text = '') => {
		const clearDropdownContents = (code = undefined) => {
			if (Utils.exists(chatElements.dropdownContent)) {
				for (const child of chatElements.dropdownContent.children) {
					if (!Utils.exists(child)) continue;
					child.removeAttribute('active');
					child.querySelector('tp-yt-paper-item').removeAttribute('active');

					if (
						child.tagName === 'YTG-LIVE-CHAT-TEXT-INPUT-FIELD-SUGGESTION' ||
						(code && !child.innerText.toLowerCase().startsWith(`:${code}`.toLowerCase()))
					)
						chatElements.dropdownContent.removeChild(child);
				}
			}
			return true;
		};

		console.log('emotes.injectSuggestions', text);
		if (text.includes(':')) {
			const code = text.trim().split(':').pop().split(' ')[0];
			console.log('code', code);
			if (code.length < 2) return;
			const foundEmotes = this.getFromCode(code);
			console.log('foundEmotes', foundEmotes);
			if (foundEmotes.length > 0) {
				if (Utils.exists(chatElements.dropdownContent)) {
					clearDropdownContents(code);

					for (const emoji of foundEmotes) {
						this.injectSuggestion(chatElements, emoji, code);
					}

					let lastSuggestion = Array.from(chatElements.dropdownContent.children).at(-1);
					if (Utils.exists(lastSuggestion)) {
						lastSuggestion.setAttribute('active', '');
						lastSuggestion.querySelector('tp-yt-paper-item').setAttribute('active', '');
					}
					/*
					const textInputFieldRenderer =
						chatElements.textInputFieldRenderer ?? document.querySelector('yt-live-chat-text-input-field-renderer');

					console.log(textInputFieldRenderer?.suggestions);
					console.log(textInputFieldRenderer?.suggestions?.length);
					console.log(Array.from(chatElements.dropdownContent.children).length);

					textInputFieldRenderer?.changeSuggestionIndex_(textInputFieldRenderer?.suggestions.length - 1 ?? 0);
					*/

					chatElements.dropdownContent.scrollTop = chatElements.dropdownContent.scrollHeight;
					chatElements.ironDropdown.style.setProperty('display', '');
				}
			} else clearDropdownContents(code);
		} else {
			if (chatElements.ironDropdown.style.display !== 'none') {
				clearDropdownContents();
				chatElements.ironDropdown.style.setProperty('display', 'none');
			}
		}
	};

	addToMessage = async (message) => {
		const words = Utils.splitMessage(message);
		const pattern = /[&\/\\#,+()$~%.'":*?<>{}]/gim;

		for (let word of words) {
			word = word.replace(pattern, '');
			const emote = await this.getEmote(word);
			if (emote && !excludesWords.includes(word.toLowerCase()))
				message = message.replace(new RegExp(`(?!")${word}(?!")`), Utils.emoteToImage(emote));
		}

		return message;
	};

	insertTo = async (element = defaultElement) => {
		if (Utils.invalidElement(element)) return element;

		element.innerHTML = await this.addToMessage(element.innerHTML);

		return element;
	};

	clean = (emotes) => {
		return emotes.filter((emote) => !excludesWords.includes(emote.code.toLowerCase()));
	};

	mergeFFZ = (emotes, channel) => {
		this.ffz = this.ffz.concat(
			emotes.map((n) => {
				if (!('restrictions' in n)) {
					n.restrictions = {
						channels: [],
						games: [],
					};
				}
				if (n.restrictions.channels.indexOf(channel) == -1) {
					n.restrictions.channels.push(channel);
				}
				return n;
			}),
		);
	};

	mergeBTTV = (data, channel) => {
		this.bttv = this.bttv.concat(
			data.channelEmotes.map((n) => {
				if (!('restrictions' in n)) {
					n.restrictions = {
						channels: [],
						games: [],
					};
				}
				if (n.restrictions.channels.indexOf(channel) == -1) {
					n.restrictions.channels.push(channel);
				}
				return n;
			}),
			data.sharedEmotes.map((n) => {
				if (!('restrictions' in n)) {
					n.restrictions = {
						channels: [],
						games: [],
					};
				}
				if (n.restrictions.channels.indexOf(channel) == -1) {
					n.restrictions.channels.push(channel);
				}
				return n;
			}),
		);
	};

	loadFFZ = async (channelName = '') => {
		if (!this.chatSettings.ffzEmotes) {
			this.ffz = [];
			return false;
		}

		console.info('[YouTubeGaming+] Loading FFZ Emotes...');

		try {
			const channel = supportedChannels.find((c) => c.youtube.name === channelName.toLowerCase());
			if (channel !== undefined) {
				const tData = await Utils.fetchJSON(
					'https://api.betterttv.net/3/cached/frankerfacez/users/twitch/' + channel.twitch.id,
				);

				this.mergeFFZ(tData, channel.twitch.id);
			}
		} catch (error) {
			console.log('FFZ Twitch Request failed', error);
		}

		try {
			const data = await Utils.fetchJSON('https://api.betterttv.net/3/cached/frankerfacez/emotes/global');

			this.ffz = this.ffz.concat(
				data.map((n) => {
					n.global = true;
					return n;
				}),
			);
		} catch (error) {
			console.log('FFZ Request failed', error);
		}

		this.ffz = this.clean(this.ffz);

		console.info('[YouTubeGaming+] FFZ Emotes Loaded!', this.ffz.length);
		return true;
	};

	loadBTTV = async (channelName = '') => {
		if (!this.chatSettings.bttvEmotes) {
			this.bttv = [];
			return false;
		}

		console.info('[YouTubeGaming+] Loading BTTV Emotes...');

		try {
			const channel = supportedChannels.find((c) => c.youtube.name === channelName.toLowerCase());
			if (channel !== undefined) {
				const tData = await Utils.fetchJSON('https://api.betterttv.net/3/cached/users/twitch/' + channel.twitch.id);

				this.mergeBTTV(tData, channel.twitch.id);
			}
		} catch (error) {
			console.log('BTTV Twitch Request failed', error);
		}

		try {
			const data = await Utils.fetchJSON('https://api.betterttv.net/3/cached/emotes/global');

			this.bttv = this.bttv.concat(
				data.map((n) => {
					n.global = true;
					return n;
				}),
			);
		} catch (error) {
			console.log('BTTV Request failed', error);
		}

		this.bttv = this.clean(this.bttv);

		console.info('[YouTubeGaming+] BTTV Emotes Loaded!', this.bttv.length);
		return true;
	};

	load = async (channelName = '', chatElements = { ...defaultChatElements }) => {
		this.chatElements = chatElements;

		try {
			if (this.bttv.length === 0) await this.loadBTTV(channelName);
		} catch {}

		try {
			if (this.ffz.length === 0) await this.loadFFZ(channelName);
		} catch {}

		try {
			await this.build();
		} catch {}

		return true;
	};

	emojiPickerObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			const target = mutation.target;
			if (Utils.exists(target) && target.hasAttribute('selected')) {
				if (this.chatSettings.ffzEmotes) this.injectFFZPicker(target);
				if (this.chatSettings.bttvEmotes) this.injectBTTVPicker(target);
				this.emojiPickerObserver.disconnect();
			}
		}
	});
}
