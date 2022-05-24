const words = General.splitMessage(chatMessage.innerText);
console.log('-- New Message --');
console.log(words);
for (let i = 0; i < words.length - 1; i++) {
	const word = words[i];
	if (word.trim().length <= 0) continue;

	if (this.chatSettings.bttvEmotes) {
		for (const emote of this.bttv) {
			if (!word.toLowerCase().includes(emote.code.toLowerCase())) continue;
			console.log(i, 'includes', word, emote);

			const withImages = General.insertImages(word, emote, {
				src: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
				code: `${emote.code}`,
				id: `bttv-${emote.id}`,
			});
			console.log(withImages);
			words[i] = withImages;
			console.log(words[i]);
		}
	}

	console.log(i, 'ending', word);
}
console.log(words);
chatMessage.innerHTML = words.join(' ').trim();
console.log('----------');
return true;

const insertEmotes = (message) => {
	if (!exists(message)) return;
	if (!visualSettings.chat.bttvEmotes && !visualSettings.chat.bttvEmotes) return;
	let messageHTML = message.innerHTML;

	for (const html of messageHTML.split(' ')) {
		if (!isActive) continue;

		let hasReplacement = false;
		let newHTML = `${html}`;
		if (visualSettings.chat.bttvEmotes) {
			for (const emote of bttv.emotes) {
				if (html.toLowerCase() !== emote.code.toLowerCase()) continue;
				const regEx = new RegExp(emote.code, 'ig');
				const img = `<img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://cdn.betterttv.net/emote/${emote.id}/1x" alt="${emote.code}" shared-tooltip-text="${emote.code}" id="bttv-${emote.id}">`;
				newHTML = newHTML.replace(regEx, img);
				hasReplacement = true;
			}
		}
		if (visualSettings.chat.ffzEmotes) {
			for (const emote of ffz.emotes) {
				if (html !== emote.code) continue;
				const regEx = new RegExp(emote.code, 'ig');
				const img = `<img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="${emote.images['1x']}" alt="${emote.code}" shared-tooltip-text="${emote.code}" id="bttv-${emote.id}">`;
				newHTML = newHTML.replace(regEx, img);
				hasReplacement = true;
			}
		}
		if (hasReplacement) {
			const regEx = new RegExp(html, 'ig');
			messageHTML = messageHTML.replace(regEx, newHTML);
		}
	}
	message.innerHTML = messageHTML;
};
