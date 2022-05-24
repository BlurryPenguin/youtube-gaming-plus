console.table(
	[document, window]
		.concat([...document.querySelectorAll('*')])
		.map((el) => {
			let evs = getEventListeners(el);
			// evs = (evs.click ? { click: evs.click } : []);
			return {
				el: el,
				types: Object.keys(evs).join(', '),
				listeners: evs,
			};
		})
		.filter((item) => item.types),
);

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

getMethods(document.querySelector('yt-live-chat-text-input-field-renderer'));
getEventListeners(document.querySelector('yt-live-chat-text-input-field-renderer'));
