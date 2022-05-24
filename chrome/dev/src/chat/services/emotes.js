// chat/emotes.js

/*

class ChatEmotes {
	chatSettings = defaultVisualSettings.chat;

	constructor(settings = defaultVisualSettings.chat) {
		this.chatSettings = settings;
	}
}

(function () {
	const _win = window.parent.window;
	let chatEmotes = undefined;
	let isLoaded = false;
	let _loadTimer = undefined;

	console.log('chat/emotes: load');
	console.log(window.location.href);
	console.log(_win.location.href);

	const load = () => {
		clearTimeout(_loadTimer);
		if (!isLoaded) {
			setTimeout(() => {
				_win.dispatchEvent(new Event('chat.emotes.getSettings'));
				load();
			}, 500);
		}
	};

	const getEmojiManager = () => {
		console.log('getEmojiManager');
		const n = document.querySelector('yt-live-chat-item-list-renderer');
		console.log(n);
		if (null != n) {
			if ('emojiManager' in n) {
				console.log('emojiManager', n.emojiManager);
			} else console.warn('Cannot find emojiManager');
		} else console.warn('Cannot find chat list');
		/\*
		const chatItemList = window.document.querySelector('yt-live-chat-item-list-renderer');
		let emojiManager = undefined;
		if (Utils.exists(chatItemList)) emojiManager = chatItemList.emojiManager ?? {};

		console.log(window.document);
		console.log(window.document.querySelector('yt-live-chat-item-list-renderer'));
		console.log(window.document.querySelector('yt-live-chat-item-list-renderer')?.emojiManager);
		console.log('getEmojiManager', emojiManager);

		_win.dispatchEvent(
			new CustomEvent('chat.emotes.emojiManager', {
				detail: { emojiManager },
				bubbles: true,
			}),
		);
		*\/
	};

	_win.addEventListener('chat.emotes.settings', (event) => {
		const chatSettings = event.detail.chat ?? defaultVisualSettings.chat;

		console.log('chat.emotes.settings', chatSettings);
		if (chatEmotes === undefined) chatEmotes = new ChatEmotes(chatSettings);
		else chatEmotes.chatSettings = chatSettings;

		isLoaded = true;
		clearTimeout(_loadTimer);

		getEmojiManager();
	});

	_win.addEventListener('chat.emotes.getEmojiManager', () => {
		console.log('chat.emotes.getEmojiManager');
		getEmojiManager();
	});

	// Start load timeout
	load();
})();

*/
