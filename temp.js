import { e } from '../../chunks/index-7104e3da.js';
import { e as e$2 } from '../../chunks/background.injected-34a57e0e.js';
import { n, e as e$4 } from '../../chunks/get_stream_details-0c1ed43a.js';
import { d as dt, t } from '../../chunks/parse_token.util-2f99494c.js';
import { s } from '../../chunks/router.interface-3a81c163.js';
import { e as e$3 } from '../../chunks/fetch_youtube-2bfa45e2.js';
import { e as e$1 } from '../../chunks/style-inject.es-305e66b0.js';

function l(e) {
	if (!e) return 0;
	e = e.toLowerCase();
	const t = /\((.+)\)/.exec(e);
	if (!t) return 1;
	const n = t[1].split(/\s/),
		s = parseInt(n[0]);
	return isNaN(s) ? 0 : n[1].startsWith('year') ? 12 * parseInt(n[0]) : parseInt(n[0]);
}
function u(e, t) {
	const n = t;
	for (let t = 0; t < n.length; t++) if (n[t][0] > e) return n[t - 1][1];
	return n[n.length - 1][1];
}
function d(e, t, n, s) {
	const r = t(e.authorExternalChannelId);
	!(function (e, t) {
		(null == t ? void 0 : t.a) && (e.authorName = { simpleText: t.a });
	})(e, r),
		(function (e, t) {
			var n, s;
			e.authorBadges || (e.authorBadges = []);
			for (const r of e.authorBadges) {
				const e = r.liveChatAuthorBadgeRenderer;
				(null === (n = e.icon) || void 0 === n ? void 0 : n.iconType)
					? (e._mtvType = null === (s = e.icon) || void 0 === s ? void 0 : s.iconType.toLowerCase())
					: e.customThumbnail && (e._mtvType = 'member'),
					'moderator' === e._mtvType &&
						(delete e.icon,
						(e._mtvType = 'moderator'),
						(e.customThumbnail = { thumbnails: [{ url: t, width: 18, height: 18 }] }));
			}
		})(e, s),
		(function (e, t, n) {
			if ((null == n ? void 0 : n.b) && !(n.b <= 0))
				for (const s of e.authorBadges) {
					const e = s.liveChatAuthorBadgeRenderer;
					if ('member' !== e._mtvType) continue;
					const r = l(e.tooltip);
					if (0 === r) continue;
					const i = r + n.b,
						o = `Member (${i} months)`,
						a = u(i, t);
					(e.customThumbnail = a), delete e.icon, (e.tooltip = o), (e.accessibility.accessibilityData.label = o);
				}
		})(e, n, r);
}
const h = /[\s.,?!]/;
function m(e) {
	const t = [];
	let n = 0;
	for (let s = 0; s < e.length - 1; s++)
		h.test(e[s]) !== h.test(e[s + 1]) && (t.push(e.substring(n, s + 1)), (n = s + 1));
	return t.push(e.substring(n)), t;
}
function f(e) {
	let t$1;
	if (e.provider === t.Twitch) t$1 = `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/static/dark/1.0`;
	else if (e.provider === t.FFZ) t$1 = `https://cdn.frankerfacez.com/emote/${e.id}/1`;
	else {
		if (e.provider !== t.BTTV) return;
		t$1 = `https://cdn.betterttv.net/emote/${e.id}/1x`;
	}
	return {
		emojiId: 'mogultv-' + e.name + '-' + e.id,
		image: { thumbnails: [{ url: t$1 }], accessibility: { accessibilityData: { label: e.name } } },
		isCustomEmoji: !0,
		searchTerms: [e.name],
		shortcuts: [':' + e.name + ':', e.name],
	};
}
const g = [
	'#ff0000',
	'#009000',
	'#b22222',
	'#ff7f50',
	'#9acd32',
	'#ff4500',
	'#2e8b57',
	'#daa520',
	'#d2691e',
	'#5f9ea0',
	'#1e90ff',
	'#ff69b4',
	'#00ff7f',
	'#a244f9',
];
class p {
	constructor(e) {
		this.gatewayService = e;
	}
	addAliasesToMessage(e) {
		d(
			e,
			(e) => this.gatewayService.getUserInfo(e),
			this.gatewayService.badgeList,
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV/TiiIVBzuIOGRonSyIijpqFYpQIdQKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxc3NSdJES/5cUWsR4cNyPd/ced+8AoVFhmhUaAzTdNtPJhJjNrYrdrwgjBGAaMZlZxpwkpeA7vu4R4OtdnGf5n/tz9Kl5iwEBkXiWGaZNvEE8tWkbnPeJI6wkq8TnxKMmXZD4keuKx2+ciy4LPDNiZtLzxBFisdjBSgezkqkRTxJHVU2nfCHrscp5i7NWqbHWPfkLw3l9ZZnrNIeRxCKWIEGEghrKqMBGnFadFAtp2k/4+Idcv0QuhVxlMHIsoAoNsusH/4Pf3VqFiXEvKZwAul4c5yMGdO8CzbrjfB87TvMECD4DV3rbX20AM5+k19ta9Ajo3wYurtuasgdc7gCDT4Zsyq4UpCkUCsD7GX1TDhi4BXrXvN5a+zh9ADLUVeoGODgERoqUve7z7p7O3v490+rvB3pIcqqJKL5aAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5QwEARQDdqq2HwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAGkSURBVDjLpdSxS5tBGMfx7+V9JamLGbSQNNAQdBBJhZKWLPkHxKmQEgd9xUFwCRQKHe1cKHSztCCmLyQlkriULu2kSyBQkCCCg0bQCJrhTSUxoW+8DuLRNPqq8aa7hx8f7nk4TpDXDCQfAC+9rTKCt4KctgcEnZKJ/pcYoRmG+oewz21Wdlb4+PvzvxFLvwlJD5vEx+Lomg5A6ahE/nTt/5hXd0Le+98x9WRKnUtHJSYKkxzLalfW5djSaKILOZCHqvZQDLIwMO8MPdOf4h/wq3Or3epAAuIRP6M/MEYMZyjY1zm6SCBC8XlBId+j3wj7wuiui+lcO6PVszxNu4lH93RiFHBrbsK+MAAnjRNnKBVaxq25u+qRQETt7bZNavfL9a2lQstMj08jhHB8idmtLF8b2atvdBUipaTVbqk2K7UKme0MrytvVEa/DWJumhi7c8QfvKD8p0zR/tV1O0FOk7dBblougE+Pl+6FKGijukGtWesZUZBZT5NcT2KdWT0hl8O2AK9ZT8M6xAZjzO8v3PFLkmVBTpsFuQgi2Nu/Ji3QXv0FPBynaffELJkAAAAASUVORK5CYII=',
		);
	}
}
var w = { exports: {} },
	v =
		('undefined' != typeof crypto && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
		('undefined' != typeof msCrypto &&
			'function' == typeof window.msCrypto.getRandomValues &&
			msCrypto.getRandomValues.bind(msCrypto));
if (v) {
	var y = new Uint8Array(16);
	w.exports = function () {
		return v(y), y;
	};
} else {
	var b = new Array(16);
	w.exports = function () {
		for (var e, t = 0; t < 16; t++)
			0 == (3 & t) && (e = 4294967296 * Math.random()), (b[t] = (e >>> ((3 & t) << 3)) & 255);
		return b;
	};
}
for (var A = [], C = 0; C < 256; ++C) A[C] = (C + 256).toString(16).substr(1);
var I,
	M,
	k = function (e, t) {
		var n = t || 0,
			s = A;
		return [
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
			'-',
			s[e[n++]],
			s[e[n++]],
			'-',
			s[e[n++]],
			s[e[n++]],
			'-',
			s[e[n++]],
			s[e[n++]],
			'-',
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
			s[e[n++]],
		].join('');
	},
	R = w.exports,
	T = k,
	S = 0,
	x = 0;
var E = function (e, t, n) {
		var s = (t && n) || 0,
			r = t || [],
			i = (e = e || {}).node || I,
			o = void 0 !== e.clockseq ? e.clockseq : M;
		if (null == i || null == o) {
			var a = R();
			null == i && (i = I = [1 | a[0], a[1], a[2], a[3], a[4], a[5]]),
				null == o && (o = M = 16383 & ((a[6] << 8) | a[7]));
		}
		var c = void 0 !== e.msecs ? e.msecs : new Date().getTime(),
			l = void 0 !== e.nsecs ? e.nsecs : x + 1,
			u = c - S + (l - x) / 1e4;
		if (
			(u < 0 && void 0 === e.clockseq && (o = (o + 1) & 16383),
			(u < 0 || c > S) && void 0 === e.nsecs && (l = 0),
			l >= 1e4)
		)
			throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
		(S = c), (x = l), (M = o);
		var d = (1e4 * (268435455 & (c += 122192928e5)) + l) % 4294967296;
		(r[s++] = (d >>> 24) & 255), (r[s++] = (d >>> 16) & 255), (r[s++] = (d >>> 8) & 255), (r[s++] = 255 & d);
		var h = ((c / 4294967296) * 1e4) & 268435455;
		(r[s++] = (h >>> 8) & 255),
			(r[s++] = 255 & h),
			(r[s++] = ((h >>> 24) & 15) | 16),
			(r[s++] = (h >>> 16) & 255),
			(r[s++] = (o >>> 8) | 128),
			(r[s++] = 255 & o);
		for (var m = 0; m < 6; ++m) r[s + m] = i[m];
		return t || T(r);
	},
	B = w.exports,
	O = k;
var q = function (e, t, n) {
		var s = (t && n) || 0;
		'string' == typeof e && ((t = 'binary' === e ? new Array(16) : null), (e = null));
		var r = (e = e || {}).random || (e.rng || B)();
		if (((r[6] = (15 & r[6]) | 64), (r[8] = (63 & r[8]) | 128), t)) for (var i = 0; i < 16; ++i) t[s + i] = r[i];
		return t || O(r);
	},
	j = E,
	L = q,
	_ = L;
(_.v1 = j), (_.v4 = L);
var P = _;
const N = 100,
	U = -1,
	W = { '-32601': 'Method not found' };
(W[N] = 'Invalid origin'), (W[U] = 'Error');
class V {
	constructor({ postMessage: e, timeout: t = 3e3 } = {}) {
		(this.postMessage = e),
			(this.timeout = t),
			(this.pendingRequests = {}),
			(this.callbackFunctions = {}),
			(this.call = this.call.bind(this)),
			(this.resolve = this.resolve.bind(this)),
			(this.resolveRPCResponse = this.resolveRPCResponse.bind(this));
	}
	call(e, t, n = {}) {
		const { timeout: s = this.timeout } = n,
			r = (function () {
				let e = null,
					t = null;
				const n = new Promise((n, s) => ((e = n), (t = s), t));
				return (n.resolve = e), (n.reject = t), n;
			})(),
			i = [];
		for (const e of Array.from(t || []))
			if ('function' == typeof e) {
				const t = { _browserComms: !0, _browserCommsGunCallback: !0, callbackId: P.v4() };
				(this.callbackFunctions[t.callbackId] = e), i.push(t);
			} else i.push(e);
		const o = (function ({ method: e, params: t }) {
			if (null == t) throw new Error('Must provide params');
			for (const e of Array.from(t))
				if ('function' == typeof e) throw new Error('Functions are not allowed. Use RPCCallback instead.');
			return { _browserComms: !0, id: P.v4(), method: e, params: t };
		})({ method: e, params: i });
		this.pendingRequests[o.id] = { reject: r.reject, resolve: r.resolve, isAcknowledged: !1 };
		try {
			this.postMessage(JSON.stringify(o), '*');
		} catch (e) {
			return r.reject(e), r;
		}
		return (
			setTimeout(() => {
				if (!this.pendingRequests[o.id].isAcknowledged) return r.reject(new Error('Message Timeout'));
			}, s),
			r
		);
	}
	resolve(e) {
		switch (!1) {
			case !(!0 === e?.acknowledge):
				return this.resolveRPCRequestAcknowledgement(e);
			case !J(e):
				return this.resolveRPCResponse(e);
			case !(function (e) {
				return e?.callbackId && null != e.params;
			})(e):
				return this.resolveRPCCallbackResponse(e);
			default:
				throw new Error('Unknown response type');
		}
	}
	resolveRPCResponse(e) {
		const t = this.pendingRequests[e.id];
		if (null == t) throw new Error('Request not found');
		t.isAcknowledged = !0;
		const { result: n, error: s } = e;
		return s ? t.reject(s.data || new Error(s.message)) : null != n ? t.resolve(n) : t.resolve(null), null;
	}
	resolveRPCRequestAcknowledgement(e) {
		const t = this.pendingRequests[e.id];
		if (null == t) throw new Error('Request not found');
		return (t.isAcknowledged = !0), null;
	}
	resolveRPCCallbackResponse(e) {
		const t = this.callbackFunctions[e.callbackId];
		if (null == t) throw new Error('Callback not found');
		return t.apply(null, e.params), null;
	}
}
function F({ params: e, callbackId: t }) {
	return { _browserComms: !0, callbackId: t, params: e };
}
function D({ requestId: e, result: t = null, rPCError: n = null }) {
	return { _browserComms: !0, id: e, result: t, error: n };
}
function K({ code: e, data: t = null }) {
	return { _browserComms: !0, code: e, message: W[e], data: t };
}
function Q(e) {
	return e?._browserComms;
}
function J(e) {
	return e?.id && (void 0 !== e.result || void 0 !== e.error);
}
const Z = 1e4,
	G = 'undefined' != typeof window ? window : self;
class z {
	constructor(e = {}) {
		const { timeout: t, shouldConnectToServiceWorker: n, handshakeTimeout: s = Z, isParentValidFn: r = () => !0 } = e;
		(this.handshakeTimeout = s), (this.isParentValidFn = r), (this.isListening = !1);
		const i = globalThis?.window?._browserCommsIsInAppBrowser || -1 !== navigator.userAgent.indexOf('/InAppBrowser');
		(this.hasParent = ('undefined' != typeof window && window.self !== window.top) || i),
			(this.parent = globalThis?.window?.parent),
			(this.client = new V({
				timeout: t,
				postMessage: (e, t) => {
					if (i) {
						let t = (() => {
							try {
								return JSON.parse(localStorage['portal:queue']);
							} catch (e) {
								return null;
							}
						})();
						return (
							null == t && (t = []),
							t.push(e),
							(localStorage['portal:queue'] = JSON.stringify(t)),
							localStorage['portal:queue']
						);
					}
					return this.parent?.postMessage(e, t);
				},
			})),
			(this.ready = n
				? (function () {
						return new Promise((e, t) => {
							const n = setTimeout(e, 5e3);
							return navigator?.serviceWorker?.ready
								.catch(function () {
									return console.log('caught sw error'), null;
								})
								.then((t) => {
									const s = t?.active;
									return (
										s &&
											(this.sw = new V({
												timeout: this.timeout,
												postMessage: (e, t) => {
													const n = new MessageChannel();
													if (n)
														return (
															(n.port1.onmessage = (e) => this.onMessage(e, { isServiceWorker: !0 })),
															s.postMessage(e, [n.port2])
														);
												},
											})),
										clearTimeout(n),
										e()
									);
								});
						});
				  })()
				: Promise.resolve(!0)),
			(this.registeredMethods = { ping: () => Object.keys(this.registeredMethods) }),
			(this.parentsRegisteredMethods = []),
			(this.setParent = this.setParent.bind(this)),
			(this.setInAppBrowserWindow = this.setInAppBrowserWindow.bind(this)),
			(this.replyInAppBrowserWindow = this.replyInAppBrowserWindow.bind(this)),
			(this.onMessageInAppBrowserWindow = this.onMessageInAppBrowserWindow.bind(this)),
			(this.listen = this.listen.bind(this)),
			(this.close = this.close.bind(this)),
			(this.call = this.call.bind(this)),
			(this.onRequest = this.onRequest.bind(this)),
			(this.onMessage = this.onMessage.bind(this)),
			(this.on = this.on.bind(this));
	}
	setParent(e) {
		(this.parent = e), (this.hasParent = !0);
	}
	setInAppBrowserWindow(e, t) {
		this.iabWindow = e;
		const n = -1 !== navigator.userAgent.indexOf('iPhone') ? 'loadstop' : 'loadstart';
		return (
			this.iabWindow.addEventListener(n, () => {
				this.iabWindow.executeScript({ code: 'window._browserCommsIsInAppBrowser = true;' }),
					clearInterval(this.iabInterval),
					(this.iabInterval = setInterval(
						() =>
							this.iabWindow.executeScript({ code: "localStorage.getItem('portal:queue');" }, (e) => {
								try {
									return (
										(e = JSON.parse(e?.[0])) &&
											e.length &&
											this.iabWindow.executeScript({ code: "localStorage.setItem('portal:queue', '[]')" }),
										e.map((e) => t(e))
									);
								} catch (t) {
									return console.log(t, e);
								}
							}),
						100,
					));
			}),
			this.iabWindow.addEventListener('exit', () => clearInterval(this.iabInterval))
		);
	}
	replyInAppBrowserWindow(e) {
		const t = e.replace(/'/g, "'");
		return this.iabWindow.executeScript({
			code: `if(window._browserCommsOnMessage) window._browserCommsOnMessage('${t}')`,
		});
	}
	onMessageInAppBrowserWindow(e) {
		return this.onMessage({ data: e, source: { postMessage: (e) => this.call('browser.reply', { data: e }) } });
	}
	listen() {
		(this.isListening = !0),
			G.addEventListener('message', this.onMessage),
			'undefined' != typeof window &&
				null !== window &&
				(window._browserCommsOnMessage = (e) =>
					this.onMessage({
						debug: !0,
						data: (() => {
							try {
								return JSON.parse(e);
							} catch (t) {
								return console.log('error parsing', e), null;
							}
						})(),
					})),
			(this.clientValidation = this.client
				.call('ping', null, { timeout: this.handshakeTimeout })
				.then((e) => {
					this.hasParent && (this.parentsRegisteredMethods = this.parentsRegisteredMethods.concat(e));
				})
				.catch(() => null)),
			(this.swValidation = this.ready
				.then(() => this.sw?.call('ping', null, { timeout: this.handshakeTimeout }))
				.then((e) => {
					this.parentsRegisteredMethods = this.parentsRegisteredMethods.concat(e);
				}));
	}
	close() {
		return (this.isListening = !0), G.removeEventListener('message', this.onMessage);
	}
	async call(e, ...t) {
		if (!this.isListening) return new Promise((e, t) => t(new Error('Must call listen() before call()')));
		const n = (e, t) => {
			const n = this.registeredMethods[e];
			if (!n) throw new Error('Method not found');
			return n.apply(null, t);
		};
		if ((await this.ready, this.hasParent)) {
			let s = null;
			await this.clientValidation;
			if (!(-1 !== this.parentsRegisteredMethods.indexOf(e))) return n(e, t);
			{
				const r = await this.client.call(e, t);
				try {
					if ('ping' === e) {
						const s = n(e, t);
						return (r || []).concat(s);
					}
					return r;
				} catch (r) {
					try {
						if (((s = r), !this.sw)) return n(e, t);
						try {
							const s = await this.sw.call(e, t);
							if ('ping' === e) {
								const r = n(e, t);
								return (s || []).concat(r);
							}
							return s;
						} catch {
							return n(e, t);
						}
					} catch (e) {
						throw 'Method not found' === e.message && s ? s : e;
					}
				}
			}
		} else {
			if (!this.sw) return n(e, t);
			if ((await this.swValidation, -1 === this.parentsRegisteredMethods.indexOf(e))) return n(e, t);
			try {
				const s = await this.sw.call(e, t);
				if ('ping' === e) {
					const r = n(e, t);
					return (s || []).concat(r);
				}
				return s;
			} catch (s) {
				return n(e, t);
			}
		}
	}
	async onRequest(e, t) {
		const n = [];
		for (const s of Array.from(t.params || []))
			s?._browserCommsGunCallback
				? ((t) => {
						n.push((...n) => e(F({ params: n, callbackId: t.callbackId })));
				  })(s)
				: n.push(s);
		e(
			(function ({ requestId: e }) {
				return { _browserComms: !0, id: e, acknowledge: !0 };
			})({ requestId: t.id }),
		);
		try {
			const s = await this.call(t.method, ...Array.from(n));
			return e(D({ requestId: t.id, result: s }));
		} catch (n) {
			return e(D({ requestId: t.id, rPCError: K({ code: U, data: n }) }));
		}
	}
	onMessage(e, { isServiceWorker: t } = {}) {
		try {
			const s = 'string' == typeof e.data ? JSON.parse(e.data) : e.data;
			if (!Q(s)) return;
			const r = function (t) {
				return 'undefined' != typeof window && null !== window
					? e.source?.postMessage(JSON.stringify(t), '*')
					: e.ports[0].postMessage(JSON.stringify(t));
			};
			if (null != (n = s)?.id && null != n.method) return this.onRequest(r, s);
			if (Q(s)) {
				let n;
				if (this.isParentValidFn(e.origin)) return (n = t ? this.sw : this.client), n.resolve(s);
				if (J(s)) return (n = t ? this.sw : this.client), n.resolve(D({ requestId: s.id, rPCError: K({ code: N }) }));
				throw new Error('Invalid origin');
			}
			throw new Error('Unknown RPCEntity type');
		} catch (e) {}
		var n;
	}
	on(e, t) {
		this.registeredMethods[e] = t;
	}
}
class H {
	constructor() {
		(this.call = (e, t) => this.browserComms.call(e, t)),
			(this.listen = () => {
				this.browserComms.listen(),
					this.browserComms.on('context.getCredentials', this.getCredentials),
					this.browserComms.on('dom.setStyle', this.setStyle);
			}),
			(this.setStyle = ({ querySelector: e, style: t }) => {
				const n = document.querySelector(e);
				null == n || n.setAttribute('style', t);
			}),
			(this.getCredentials = () => this.credentials),
			(this.setCredentials = (e) => {
				this.credentials = e;
			}),
			(this.browserComms = new z()),
			(this.credentials = {});
	}
}
class X {
	constructor(e) {
		this.gatewayService = e;
	}
	addTwitchEmotesToMessage(e) {
		return (function (e, t) {
			const n = [];
			for (const s of e.runs)
				if ('string' == typeof s.text) {
					const { text: e } = s;
					let r = 0,
						i = 0;
					const o = m(e);
					let a = !1;
					for (const s of o) {
						const o = t('🌝' === s ? 'Kappa' : s);
						o && ((a = !0), r > 0 && n.push({ text: e.substring(i, r) }), n.push({ emoji: o }), (i = r + s.length)),
							(r += s.length);
					}
					a ? n.push({ text: e.substring(i, r) }) : n.push(s);
				} else if ('🌝' === s.emoji.emojiId) {
					const e = t('Kappa');
					e && n.push({ emoji: e });
				} else n.push(s);
			return (e.runs = n), e;
		})(e, (e) => this.gatewayService.getEmote(e));
	}
}
class Y extends e.exports.EventEmitter {
	constructor(e) {
		super(),
			(this.backgroundService = e),
			(this.badgeList = []),
			(this.emoteCache = new Map()),
			e.getLiveStorageValue('auth.token', dt).then((e) => (this.myUserInfo = e)),
			this.fetchUserInfo(),
			this.fetchEmotes(),
			this.fetchBadges(),
			setInterval(() => {
				this.fetchUserInfo(), this.fetchEmotes(), this.fetchBadges();
			}, 3e5);
	}
	async fetchBadges() {
		const e = await this.backgroundService.fetch('/gateway/badges');
		if (!s(e)) return;
		const t = e.body.sort((e, t) => e.months - t.months);
		(this.badgeList = t.map((e) => [e.months, { thumbnails: [{ url: e.url, width: 16, height: 16 }] }])),
			this.emit('badges', this.badgeList);
	}
	async fetchEmotes() {
		const e = await this.backgroundService.fetch('/gateway/emotes');
		if (s(e)) {
			this.emoteCache.clear();
			for (const t of e.body) {
				const e = f(t);
				e && this.emoteCache.set(t.name, e);
			}
			this.emit('emotes', this.emoteCache);
		}
	}
	async fetchUserInfo() {
		const e = await this.backgroundService.fetch('/gateway/users');
		s(e) && ((this.infoCache = new Map(e.body)), this.emit('users', this.infoCache));
	}
	getSerializedMetadata(e) {
		const t = e.links.find((t) => t.prv === e.prv),
			n = { a: null == t ? void 0 : t.name, b: e.meta.sub, c: e.meta.col };
		return Object.values(n).filter((e) => void 0 !== e).length > 0 ? n : void 0;
	}
	getUserInfo(e) {
		var t, n, s;
		if (
			(null === (n = null === (t = this.myUserInfo) || void 0 === t ? void 0 : t.value) || void 0 === n
				? void 0
				: n.sub) === e
		) {
			const e = this.getSerializedMetadata(this.myUserInfo.value);
			if (e) return e;
		}
		return null === (s = this.infoCache) || void 0 === s ? void 0 : s.get(e);
	}
	getEmote(e) {
		var t;
		return null === (t = this.emoteCache) || void 0 === t ? void 0 : t.get(e);
	}
}
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */ var $ = function (e, t) {
		if ('string' != typeof e) throw new TypeError('argument str must be a string');
		for (var n = {}, s = t || {}, r = e.split(te), i = s.decode || ee, o = 0; o < r.length; o++) {
			var a = r[o],
				c = a.indexOf('=');
			if (!(c < 0)) {
				var l = a.substr(0, c).trim(),
					u = a.substr(++c, a.length).trim();
				'"' == u[0] && (u = u.slice(1, -1)), null == n[l] && (n[l] = ne(u, i));
			}
		}
		return n;
	},
	ee = decodeURIComponent,
	te = /; */;
function ne(e, t) {
	try {
		return t(e);
	} catch (t) {
		return e;
	}
}
async function se(e, t, n) {
	if (!window.ytcfg) return;
	const s$1 = await e.fetch('/auth/token');
	if (!s(s$1) || !s$1.body) return;
	const r = { sourceType: 'google', token: s$1.body };
	t.setCredentials(r);
	const o = await e.fetch('/spore/fetch-extension-mappings', n);
	if (s(o)) {
		const e = o.body;
		e &&
			(null == e ? void 0 : e.length) > 0 &&
			e.forEach((e) => {
				re(e, { sourceType: 'youtube' });
			});
	}
}
function re(e, { sourceType: t, retries: n = 15 }) {
	if (!e) return;
	if (n < 0) return;
	const s = (function (e) {
		var t, n;
		if (e.iframeQuerySelector) {
			const s = document.querySelector(e.querySelector),
				r =
					null !== (t = null == s ? void 0 : s.contentDocument) && void 0 !== t
						? t
						: null === (n = null == s ? void 0 : s.contentWindow) || void 0 === n
						? void 0
						: n.document;
			if (!r) return;
			return r.querySelector(e.iframeQuerySelector);
		}
		return document.querySelector(e.querySelector);
	})(e);
	if (s) {
		const t = document.createElement('iframe');
		(t.src = e.iframeUrl),
			t.setAttribute('key', e.slug),
			(t.id = e.slug),
			'append' === e.domAction ? s.appendChild(t) : 'replace' === e.domAction && s.replaceWith(t);
	} else
		setTimeout(() => {
			re(e, { sourceType: t, retries: n - 1 });
		}, 250);
}
var ie;
async function oe(e, n) {
	await customElements.whenDefined(e);
	const s = customElements.get(e);
	if (!s) return void console.warn(`Polymer: ${e} not found`);
	const r = s.prototype[n.functionName];
	s.prototype[n.functionName] = function (...e) {
		if (n.ludwigOnly && !e$4()) return r.apply(this, e);
		if (n.type === ie.OverrideFunction)
			try {
				return n.function.apply(this, e);
			} catch (e) {
				console.error(JSON.stringify(n)), console.error(e);
			}
		if (n.type === ie.RunBefore)
			try {
				n.function.apply(this, e);
			} catch (e) {
				console.error(e);
			}
		let s = r.apply(this, e);
		if (n.type === ie.RunAfter)
			try {
				s = n.function.apply(this, [s]);
			} catch (e) {
				console.error(e);
			}
		return s;
	};
}
!(function (e) {
	(e[(e.OverrideFunction = 0)] = 'OverrideFunction'),
		(e[(e.RunBefore = 1)] = 'RunBefore'),
		(e[(e.RunAfter = 2)] = 'RunAfter');
})(ie || (ie = {}));
const ae = (e, t, { LudwigOnly: n }) => ({
		functionName: e,
		function: t,
		ludwigOnly: n || !1,
		type: ie.OverrideFunction,
	}),
	ce = (e, t, { LudwigOnly: n }) => ({ functionName: e, function: t, ludwigOnly: n || !1, type: ie.RunBefore });
function le(e, n, s) {
	oe(
		'yt-live-chat-item-list-renderer',
		ce(
			'handleAddChatItemAction_',
			function (t) {
				t.item.liveChatTextMessageRenderer &&
					(e.addTwitchEmotesToMessage(t.item.liveChatTextMessageRenderer.message),
					n.addAliasesToMessage(t.item.liveChatTextMessageRenderer));
			},
			{ LudwigOnly: true },
		),
	),
		oe(
			'yt-live-chat-text-input-field-renderer',
			((e, t, { LudwigOnly: n }) => ({ functionName: e, function: t, ludwigOnly: n || !1, type: ie.RunAfter }))(
				'calculateLiveChatRichMessageInput_',
				function (e) {
					var t;
					if (!(null == e ? void 0 : e.textSegments)) return e;
					for (const n of e.textSegments)
						if (null === (t = n.emojiId) || void 0 === t ? void 0 : t.startsWith('mogultv')) {
							const [, e] = n.emojiId.split('-');
							delete n.emojiId, (n.text = e);
						}
					return e;
				},
				{ LudwigOnly: true },
			),
		),
		s.on('emotes', (e) => {
			if (!e$4()) return;
			const n = document.querySelector('yt-live-chat-item-list-renderer');
			if (null == n ? void 0 : n.emojiManager) {
				if (n.emojiManager._mogulTvLoaded) return;
				(n.emojiManager._mogulTvLoaded = !0), n.emojiManager.load([...e.values()]);
			} else console.warn('Cannot find chat list');
		});
}
function ue(e) {
	return e
		? e._mtvType
			? e._mtvType
			: e.icon
			? e.icon.iconType.toLowerCase()
			: e.customThumbnail
			? 'member'
			: ''
		: '';
}
async function de(e) {
	oe(
		'yt-live-chat-author-badge-renderer',
		ae('computeType_', (e) => ue(e.liveChatAuthorBadgeRenderer), { LudwigOnly: true }),
	),
		oe(
			'yt-live-chat-author-chip',
			ae(
				'computeAuthorType_',
				function (t) {
					var n, s;
					const r = this.$['author-name'];
					if (r) {
						let t;
						const i = null === (n = this.parentElement) || void 0 === n ? void 0 : n.parentElement,
							o = null === (s = null == i ? void 0 : i.data) || void 0 === s ? void 0 : s.authorExternalChannelId;
						if (o) {
							const n = e.getUserInfo(o);
							(null == n ? void 0 : n.c) && (t = n.c);
						}
						t ||
							(t = (function (e) {
								const t = (function (e) {
									let t = 0;
									if (0 === e.length) return 0;
									for (let n = 0; n < e.length; n++) (t = (t << 5) - t + e.charCodeAt(n)), (t |= 0);
									return t;
								})(e);
								return g[((t % g.length) + g.length) % g.length];
							})(this.authorName.simpleText)),
							(r.style.color = t);
					}
					return (function (e) {
						if (!e) return '';
						for (const t of e) {
							if (!t.liveChatAuthorBadgeRenderer) continue;
							const e = ue(t.liveChatAuthorBadgeRenderer);
							if ('verified' !== e) return e;
						}
						return '';
					})(t);
				},
				{ LudwigOnly: true },
			),
		);
}
e$1(
	'\n/* Make the masthead transparent unless we are hovering it */\nbody[data-mogul-theater-mode] #masthead-container {\n  opacity: 0.1;\n  transition: opacity .2s ease;\n}\n\nbody[data-mogul-theater-mode] #masthead-container:hover {\n  opacity: 1;\n}\n\n\n@media screen and (min-width: 1014px) {\n  /* Make chat fill screen vertically */\n  body[data-mogul-theater-mode] #chat.ytd-watch-flexy {\n    height: calc(100vh - 56px) !important;\n    width: var(--ytd-watch-flexy-sidebar-width);\n    position: absolute;\n    top: 56px;\n    right: 0;\n  }\n\n  body[data-mogul-theater-mode] #player-theater-container.ytd-watch-flexy {\n    width: calc(100vw - var(--ytd-watch-flexy-sidebar-width) - var(--ytd-watch-flexy-scrollbar-width)) !important;\n    max-width: calc(100vw - var(--ytd-watch-flexy-sidebar-width) - var(--ytd-watch-flexy-scrollbar-width)) !important;\n    height: calc(100vh - 56px) !important;\n    max-height: calc(100vh - 56px) !important;\n  }\n}',
);
const he = null !== document.querySelector('yt-live-chat-app'),
	me = new e$2();
if (he) {
	const e = new Y(me),
		t = new X(e),
		n = new p(e);
	(fe = me),
		le(t, n, (ge = e)),
		(async function (e) {
			const t = await e.getLiveStorageValue('settings.chatBatching');
			oe(
				'yt-timed-continuation',
				ce(
					'dataChanged_',
					function () {
						t.value && (this.data.timeoutMs /= 3 * Math.random() + 2);
					},
					{ LudwigOnly: !0 },
				),
			),
				oe(
					'yt-live-chat-renderer',
					ce(
						'preprocessActions_',
						function (e) {
							const n = Object.getPrototypeOf(this.smoothedQueue_);
							for (const e in n)
								if (e.includes('emitSmoothedMessages')) {
									n[e] = function () {
										if (((this.nextUpdateId_ = null), this.messageQueue_.length)) {
											let s = 1e4;
											this.estimatedUpdateInterval_ &&
												(s = this.estimatedUpdateInterval_ - Date.now() + this.lastUpdateTime_);
											const r =
													this.messageQueue_.length < s / 80 ? 1 : Math.ceil(this.messageQueue_.length / (s / 80)),
												i = this.messageQueue_.splice(0, r);
											if ((this.callback && this.callback(i[0]), this.messageQueue_.length)) {
												let i = 1;
												t.value ||
													(1 === r
														? ((i = s / this.messageQueue_.length),
														  (i *= Math.random() + 0.5),
														  (i = Math.min(1e3, i)),
														  (i = Math.max(80, i)))
														: (i = 80)),
													(this.nextUpdateId_ = window.setTimeout(n[e].bind(this), i));
											}
										}
									};
									break;
								}
							return e;
						},
						{ LudwigOnly: !0 },
					),
				);
		})(fe),
		de(ge);
} else {
	!(async function (e) {
		async function n() {
			const n = document.querySelector('ytd-watch-flexy'),
				s = (null == n ? void 0 : n.hasAttribute('theater')) || !1,
				r = (null == n ? void 0 : n.hasAttribute('fullscreen')) || !1,
				i = await e.getStorage('settings.theaterMode'),
				o = e$4(!1);
			return s && !r && i && o;
		}
		let s = await n();
		setInterval(async () => {
			(await n())
				? (document.body.setAttribute('data-mogul-theater-mode', ''),
				  s || window.dispatchEvent(new Event('resize')),
				  (s = !0))
				: ((s = !1), document.body.removeAttribute('data-mogul-theater-mode'));
		}, 250);
	})(me),
		(async function (e) {
			if (!window.ytcfg) return;
			const t = {
				key: window.ytcfg.get('INNERTUBE_API_KEY'),
				authUser: window.ytcfg.get('SESSION_INDEX'),
				pageId: window.ytcfg.get('DELEGATED_SESSION_ID'),
				href: window.location.href,
				context: window.ytcfg.get('INNERTUBE_CONTEXT'),
			};
			(n = await e$3(Object.assign(Object.assign({}, t), { cookies: $(document.cookie) }))),
				(s = await e.fetch('/auth/@me')),
				(!n.success ||
					!s.meta.isSuccess ||
					n.data.id !== (null === (r = s.body) || void 0 === r ? void 0 : r.sub) ||
					!(null === (i = s.body) || void 0 === i ? void 0 : i.googleId)) &&
					(await e.fetch('/auth/login', t));
			var n, s, r, i;
		})(me);
	const e = new H();
	e.listen();
	const s = setInterval(() => {
		const t = n();
		(null == t ? void 0 : t.channelId) && (clearInterval(s), se(me, e, t.channelId));
	}, 1e3);
	setInterval(() => {
		const e = document.querySelector('ytd-live-chat-frame iframe');
		if (e && !e.src.includes('GXjZDwKFVBfMmTsC')) {
			const t = n();
			e.src += `#GXjZDwKFVBfMmTsC=${encodeURIComponent(JSON.stringify(t))}`;
		}
	}, 1e3);
}
var fe, ge;
