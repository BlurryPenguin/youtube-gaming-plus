// mutations.js

class Mutations {
	mutations = [];

	add(id, target, callback, options = {}, observe = true) {
		const mutation = this.mutations.find((m) => m.id === id);
		const mO = new MutationObserver((mutationsList, observer) => callback(mutationsList, observer));
		if (mutation) {
			mutation.target = target;
			mutation.callback = callback;
			mutation.options = options;
			mutation.o.disconnect();
			mutation.o = mO;
			return mO;
		}

		this.mutations.push({ id: id, target, o: mO, callback, options });
		if (observe) mO.observe(target, options);
		return mO;
	}

	observe(id) {
		const mutation = this.mutations.find((m) => m.id === id);
		if (mutation) mutation.o.observe(mutation.target, mutation.options);
	}

	disconnect(id) {
		const mutation = this.mutations.find((m) => m.id === id);
		if (mutation) mutation.o.disconnect();
	}

	flush() {
		for (const mutation of this.mutations) {
			if (mutation) mutation.o.disconnect();
		}
		this.mutations = [];
	}
}
