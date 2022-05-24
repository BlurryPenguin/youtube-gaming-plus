// storage.js

class Storage {
	static removeLocal = async (key = '') => {
		try {
			await chrome.storage.local.remove(key);
			return true;
		} catch {
			throw new Error(false);
		}
	};

	static removeSync = async (key = '') => {
		try {
			await chrome.storage.sync.remove(key);
			return true;
		} catch {
			throw new Error(false);
		}
	};

	static getLocalBytesInUse = async (key = '') => {
		try {
			const bytesinUse = await chrome.storage.local.getBytesInUse(key);
			return Promise.resolve(bytesinUse);
		} catch {
			throw new Error(false);
		}
	};

	static getSyncBytesInUse = async (key = '') => {
		try {
			const bytesinUse = await chrome.storage.sync.getBytesInUse(key);
			return Promise.resolve(bytesinUse);
		} catch {
			throw new Error(false);
		}
	};

	static getLocal = async (key = '', defaults = null) => {
		try {
			const response = await chrome.storage.local.get(key);
			return Promise.resolve(response[key] ?? defaults);
		} catch {
			throw new Error(defaults);
		}
	};

	static getSync = async (key = '', defaults = null) => {
		try {
			const response = await chrome.storage.sync.get(key);
			return Promise.resolve(response[key] ?? defaults);
		} catch {
			throw new Error(defaults);
		}
	};

	static setLocal = async (key = '', data = null) => {
		try {
			await this.removeLocal(key);
			await chrome.storage.local.set({ [key]: data });
			return Promise.resolve(true);
		} catch {
			throw new Error(data);
		}
	};

	static setSync = async (key = '', data = null) => {
		try {
			await this.removeSync(key);
			await chrome.storage.sync.set({ [key]: data });
			return Promise.resolve(true);
		} catch {
			throw new Error(data);
		}
	};
}
