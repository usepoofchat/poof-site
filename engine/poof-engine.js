//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region packages/core/src/errors.ts
/** Error with a stable machine-readable `code`; UI maps codes to copy, never `message`. */
var PoofError = class extends Error {
	code;
	constructor(code, message) {
		super(message ?? code);
		this.name = "PoofError";
		this.code = code;
	}
};
//#endregion
//#region packages/core/src/encoding.ts
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
/** Copy any byte source into a fresh ArrayBuffer-backed Uint8Array. */
function bytes(source) {
	return source instanceof ArrayBuffer ? new Uint8Array(source).slice() : new Uint8Array(source);
}
function utf8(text) {
	return bytes(encoder.encode(text));
}
function fromUtf8(data) {
	return decoder.decode(data);
}
function concat(...parts) {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}
/** Constant-time-ish equality for equal-length byte strings. */
function equalBytes(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
function binary(data) {
	let s = "";
	const chunk = 32768;
	for (let i = 0; i < data.length; i += chunk) s += String.fromCharCode(...data.subarray(i, i + chunk));
	return s;
}
/** Standard base64 (with padding). Used where the wire format says "base64". */
function toBase64(data) {
	return btoa(binary(data));
}
function fromBase64(text) {
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 !== 0) throw new Error("invalid base64");
	const raw = atob(text);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}
/** base64url without padding. Used for ids and the URL-fragment key. */
function toBase64Url(data) {
	return toBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(text) {
	if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error("invalid base64url");
	return fromBase64(text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - text.length % 4) % 4));
}
function randomBytes(length) {
	return crypto.getRandomValues(new Uint8Array(length));
}
/** Big-endian uint64 → 8 bytes. */
function u64be(value) {
	const out = /* @__PURE__ */ new Uint8Array(8);
	new DataView(out.buffer).setBigUint64(0, value, false);
	return out;
}
function readU64be(data, offset = 0) {
	return new DataView(data.buffer, data.byteOffset + offset, 8).getBigUint64(0, false);
}
/** Big-endian uint16 length prefix + data, for unambiguous transcript hashing. */
function lengthPrefixed(data) {
	if (data.length > 65535) throw new Error("field too long");
	const prefix = /* @__PURE__ */ new Uint8Array(2);
	new DataView(prefix.buffer).setUint16(0, data.length, false);
	return concat(prefix, data);
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
var propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
var CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js
var _a$1;
var _zodDesc = {
	value: void 0,
	enumerable: false
};
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
var _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
var _issuesDesc = {
	value: void 0,
	enumerable: false
};
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
var $ZodError = $constructor("$ZodError", initializer$1);
$constructor("$ZodError", initializer$1, void 0, { Parent: Error });
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
var _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
var validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
var _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
var uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url$1 = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
var date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var number$1 = /^-?\d+(?:\.\d+)?$/;
var boolean$1 = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/checks.js
var $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
var _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
var $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/versions.js
var version = {
	major: 4,
	minor: 6,
	patch: 5
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js
var $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
var $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
var $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
var $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
var $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
var asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
var $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
var $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
var $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
var $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
var $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
var $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
var $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
var $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
var $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
var $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$2 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
var $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
var $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
function discriminatorMap(def) {
	const map = /* @__PURE__ */ new Map();
	for (const option of def.options) {
		const values = option._zod.propValues?.[def.discriminator];
		if (!values || values.size === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
		for (const value of values) if (map.has(value)) {
			if (value !== void 0) throw new Error(`Duplicate discriminator value "${String(value)}"`);
			map.set(value, null);
		} else map.set(value, option);
	}
	return map;
}
var $ZodDiscriminatedUnion = /*@__PURE__*/ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
	def.inclusive = false;
	$ZodUnion.init(inst, def);
	const _super = inst._zod.parse;
	defineLazyInternal(inst, "propValues", (zod) => {
		const propValues = {};
		let undefinedCount = 0;
		for (const option of zod.def.options) {
			const pv = option._zod.propValues;
			if (!pv || Object.keys(pv).length === 0) throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
			if (pv[zod.def.discriminator]?.has(void 0)) undefinedCount++;
			for (const [k, v] of Object.entries(pv)) {
				if (!Object.prototype.hasOwnProperty.call(propValues, k)) assignProp(propValues, k, /* @__PURE__ */ new Set());
				for (const val of v) propValues[k].add(val);
			}
		}
		if (!zod.def.unionFallback && undefinedCount > 1) propValues[zod.def.discriminator]?.delete(void 0);
		return propValues;
	});
	def.options.forEach((option, i) => {
		const propShape = rawShape(option._zod.def);
		if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) throw new Error(`Invalid discriminated union option at index "${i}"`);
	});
	const disc = cached(() => discriminatorMap(def));
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isObject(input)) {
			payload.issues.push({
				code: "invalid_type",
				expected: "object",
				input,
				inst
			});
			return payload;
		}
		const value = input?.[def.discriminator];
		const opt = disc.value.get(value);
		if (opt && (value !== void 0 || ctx.direction !== "backward")) return opt._zod.run(payload, ctx);
		if (def.unionFallback || ctx.direction === "backward") return _super(payload, ctx);
		payload.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: def.discriminator,
			options: Array.from(disc.value.keys()).filter((value) => disc.value.get(value) !== null),
			input,
			path: [def.discriminator],
			inst
		});
		return payload;
	};
});
var $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
var $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
var $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
var $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
var $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
var $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
var $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
var $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
var recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
var handoff;
var open = [];
var memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/locales/en.js
var error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
var FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
var UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
var narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
var narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
var contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
var formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
var exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url$1]]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
var numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
var neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
var enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	if (def.values.length === 0) {
		json.not = {};
		return;
	}
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof val === "bigint") {
		if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
		vals.push(Number(val));
	} else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
var customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
var unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
var intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
var nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
var initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
var ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/parse.js
var parse$1 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
//#endregion
//#region node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
var ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse$1(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
var _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
var ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
var ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
var ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
var ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
var ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
var ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
var ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
var ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
var ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
var ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
var ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
var ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
var ZodDiscriminatedUnion = /*@__PURE__*/ $constructor("ZodDiscriminatedUnion", (inst, def) => {
	ZodUnion.init(inst, def);
	$ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
	return new ZodDiscriminatedUnion({
		type: "union",
		options,
		discriminator,
		...normalizeParams(params)
	});
}
var ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
var ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
var ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
var ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
var ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
var ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
var ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
var ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
var ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
var ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
var ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
var ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
var ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
//#endregion
//#region packages/protocol/src/jitless.ts
/**
* zod 4 compiles object parsers with `new Function` when it can, and probes for that on first use.
* Our CSP has no 'unsafe-eval', so the probe fails anyway, but browsers still report it as a
* policy violation. Turn the feature off before any schema runs: no probe, no eval, same results.
*/
config({ jitless: true });
//#endregion
//#region packages/protocol/src/constants.ts
var HANDSHAKE_BLOB_MAX_BYTES = 2048;
var TIERS = [
	"free",
	"60m",
	"24h"
];
/**
* Hard ceiling for `limits.fileMaxBytes`, whatever the server says. A receiver allocates the whole
* file up front, so this bounds the memory a modified server + peer can make a browser reserve.
* The Worker clamps FILE_MAX_BYTES to it, and clients reject room info above it.
*/
var FILE_MAX_BYTES_CEILING = 67108864;
/**
* File chunk payload. A chunk frame is 11 (header) + 20 (fileId + index) + 16 KiB + 16 (GCM tag)
* bytes, far below the 64 KiB per-message limit every browser accepts on a DataChannel. 2 MB = 128 chunks per recipient.
*/
var FILE_CHUNK_BYTES = 16384;
/** Application heartbeat: literal strings so the DO can auto-answer without waking up. */
var WS_PING = "ping";
/** Chat. */
var CHAT_MAX_CHARS = 5e3;
/** WebSocket close codes (application range 4000-4999). */
var CloseCode = {
	ProtocolError: 4e3,
	RoomExpired: 4001,
	RoomDestroyed: 4002,
	RoomFull: 4003,
	RoomNotFound: 4004,
	RateLimited: 4005,
	/** Same peerId connected again: the older socket is replaced (zombie-socket recovery). */
	Replaced: 4006,
	ForbiddenOrigin: 4007
};
/** Close codes after which reconnecting is pointless. */
var TERMINAL_CLOSE_CODES = /* @__PURE__ */ new Set([
	CloseCode.ProtocolError,
	CloseCode.RoomExpired,
	CloseCode.RoomDestroyed,
	CloseCode.RoomFull,
	CloseCode.RoomNotFound,
	CloseCode.Replaced,
	CloseCode.ForbiddenOrigin
]);
//#endregion
//#region packages/protocol/src/ids.ts
var base64url = (len) => new RegExp(`^[A-Za-z0-9_-]{${len}}$`);
var roomIdSchema = string().regex(base64url(22), "invalid room id");
var peerIdSchema = string().regex(base64url(22), "invalid peer id");
string().regex(base64url(43), "invalid handshake id");
/** One file transfer: 16 random bytes, base64url. Also the chat item id on every screen. */
var fileIdSchema = string().regex(base64url(22), "invalid file id");
var roomKeySchema = string().regex(base64url(43), "invalid room key");
/** base64url(32 random bytes), kept by the creator's browser. */
var ownerSecretSchema = string().regex(base64url(43), "invalid owner secret");
/** base64url(SHA-256(owner secret bytes)), stored by the server. */
var ownerHashSchema = string().regex(base64url(43), "invalid owner hash");
//#endregion
//#region packages/protocol/src/ai.ts
/**
* The uncensored AI model in Super Quant-Rooms.
*
* The model runs in a hardware enclave (Intel TDX) at the AI provider. The asking browser encrypts
* the conversation to the enclave's attested key; the API only forwards ciphertext, holds the
* provider key and keeps a per-room budget. Nobody outside the enclave sees the text.
*/
/** The model every AI request uses (the API forces it). */
var AI_MODEL = "e2ee-gemma-4-26b-a4b-uncensored-p";
/** Longest answer the others accept over the mesh, in characters. */
var AI_MAX_CHARS = 8e3;
/** Biggest AI request body the API forwards. */
var AI_MAX_BODY_BYTES = 524288;
/** A message that starts with this asks the AI (group rooms). */
var AI_MENTION = /^\s*@ai\b[\s,:]*/i;
var hex = (min, max) => string().min(min).max(max).regex(/^[0-9a-f]+$/i, "expected hex");
/** base64url(SHA-256(aiToken)): what the room keeps to check members' AI calls. */
var aiHashSchema = string().regex(/^[A-Za-z0-9_-]{43}$/, "invalid ai hash");
/** base64url of 32 bytes, derived from the room key (see core/ai). */
var aiTokenSchema = string().regex(/^[A-Za-z0-9_-]{43}$/, "invalid ai token");
object({
	ownerSecret: ownerSecretSchema,
	aiHash: aiHashSchema
});
object({
	roomId: roomIdSchema,
	aiToken: aiTokenSchema,
	/** 32 random bytes, hex. */
	nonce: hex(64, 64)
});
/** An uncompressed secp256k1 public key, hex (04 ‖ x ‖ y). */
var secp256k1PubSchema = hex(130, 130).regex(/^04/, "expected an uncompressed key");
/** Encrypted content: ephemeral key (65) ‖ IV (12) ‖ ciphertext ‖ tag (16), hex. */
var aiCiphertextSchema = hex(186, 2 * AI_MAX_BODY_BYTES);
object({
	roomId: roomIdSchema,
	aiToken: aiTokenSchema,
	clientPubKey: secp256k1PubSchema,
	modelPubKey: string().regex(/^(04)?[0-9a-f]{128}$/i, "invalid model key"),
	messages: array(object({
		role: _enum(["system", "user"]),
		content: aiCiphertextSchema
	}).strict()).min(1).max(4)
});
/** The attestation fields the browser checks. Extra fields pass through untouched. */
var aiAttestationSchema = object({
	verified: boolean().optional(),
	nonce: string().optional(),
	model: string().optional(),
	intel_quote: string().optional(),
	signing_key: string().optional(),
	signing_public_key: string().optional(),
	signing_address: string().optional(),
	tee_provider: string().optional()
});
/** Peer → peer (FrameType.Ai): an AI answer, sent by whoever asked, once it's complete. */
var aiPlaintextSchema = object({
	id: string().min(1).max(64),
	/** The id of the question it answers (that person's text message). */
	askId: string().min(1).max(64),
	/** Who asked: the sender's own peerId. Receivers check it matches the link it came on. */
	askedBy: peerIdSchema,
	text: string().min(1).max(AI_MAX_CHARS),
	ts: number().int()
});
//#endregion
//#region packages/protocol/src/pay.ts
/**
* Super Quant-Rooms are paid in USD stablecoins sent to Poof's address. The prices and lifetimes
* are the ones on https://usepoof.chat (room/index.html, `PRICE` and `AI_PRICE`): the site is the
* source of truth, and `pnpm check:prices` compares the two.
*
* Amounts are integers in micro-dollars (6 decimals), the unit every accepted token uses.
*/
/** The Super lifetimes, in seconds: the "60m" and "24h" tiers. */
var SUPER_LIFETIMES = [3600, 86400];
/** Fewest people: two, or just you with the AI model. */
var minPeople = (ai) => ai ? 1 : 2;
/** Canonical text form, used as the pass key id and in messages: "3600-4", "86400-10-ai". */
function variantId(v) {
	return `${v.lifetime}-${v.people}${v.ai ? "-ai" : ""}`;
}
function isValidVariant(v) {
	return SUPER_LIFETIMES.includes(v.lifetime) && Number.isInteger(v.people) && v.people >= minPeople(v.ai) && v.people <= 10 && (!v.ai || true);
}
/** Every variant that can be bought now. */
function purchasableVariants() {
	const out = [];
	for (const lifetime of SUPER_LIFETIMES) for (const ai of [false, true]) for (let people = minPeople(ai); people <= 10; people++) out.push({
		lifetime,
		people,
		ai
	});
	return out;
}
var variantSchema = object({
	lifetime: union([literal(SUPER_LIFETIMES[0]), literal(SUPER_LIFETIMES[1])]),
	people: number().int(),
	ai: boolean()
}).refine(isValidVariant, "not a variant that can be bought");
/** room/index.html: PRICE = {3600: {base: 0.49, extra: 0.049}, 86400: {base: 1.49, extra: 0.009}} */
var PRICE_MICROS = {
	3600: {
		base: 49e4,
		extraPerson: 49e3
	},
	86400: {
		base: 149e4,
		extraPerson: 9e3
	}
};
/** room/index.html: AI_PRICE = {3600: 2, 86400: 5} */
var AI_PRICE_MICROS = {
	3600: 2e6,
	86400: 5e6
};
/** Same formula as the site: base + (people - 2) × extra + AI. */
function priceMicros(v) {
	const p = PRICE_MICROS[v.lifetime];
	return p.base + Math.max(0, v.people - 2) * p.extraPerson + (v.ai ? AI_PRICE_MICROS[v.lifetime] : 0);
}
/** "$0.588", "$1.49": the site's format (three decimals, one trailing zero dropped). */
function formatUsd(micros) {
	let s = (micros / 1e6).toFixed(3);
	if (s.endsWith("0")) s = s.slice(0, -1);
	return `$${s}`;
}
var CHAINS = [
	"ethereum",
	"base",
	"robinhood"
];
/** USD stablecoins (6 decimals) and ETH, the chains' own coin (18 decimals). */
var TOKENS = [
	"USDC",
	"USDG",
	"ETH"
];
/** "0.000217 ETH": wei shown with up to 6 decimals, rounded up. */
function formatEth(wei) {
	const step = 10n ** 12n;
	const units = (wei + step - 1n) / step;
	const whole = units / 1000000n;
	const frac = (units % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
	return `${whole}${frac ? `.${frac}` : ""} ETH`;
}
var B64URL = /^[A-Za-z0-9_-]+$/;
var hexHash = string().regex(/^0x[0-9a-fA-F]{64}$/);
var hexAddress = string().regex(/^0x[0-9a-fA-F]{40}$/);
var hexSignature = string().regex(/^0x[0-9a-fA-F]+$/).max(2e4);
var b64url = (max) => string().min(1).max(max).regex(B64URL);
/**
* The text the paying wallet signs (EIP-191 personal_sign). It ties this redemption to the address
* the payment came from, so a transaction hash seen on-chain can't be redeemed by someone else.
*/
function redeemMessage(r) {
	return [
		"Poof: unlock a Super Quant-Room",
		`Chain: ${r.chain}`,
		`Transaction: ${r.txHash.toLowerCase()}`,
		`Quant-room: ${variantId(r.variant)}`,
		`Pass: ${r.blindedHash}`
	].join("\n");
}
object({
	chain: _enum(CHAINS),
	token: _enum(TOKENS),
	txHash: hexHash,
	variant: variantSchema,
	keyId: b64url(64),
	/** The blinded pass message (RFC 9474 Blind), base64url. */
	blindedMsg: b64url(400),
	/** personal_sign of `redeemMessage(...)` by the address the payment came from. */
	payer: hexAddress,
	signature: hexSignature,
	/** ETH only: the quote the payment was made against (from /api/pay/quote). */
	quote: string().min(1).max(1e3).optional()
});
/** GET /api/pay/quote?chain=…&variant=…: what to send in ETH right now, signed by Poof. */
var quoteResponseSchema = object({
	chain: _enum(CHAINS),
	variant: string(),
	usdMicros: number().int().positive(),
	/** USD per ETH, 8 decimals (Chainlink), as a decimal string. */
	ethUsd: string().regex(/^\d+$/),
	/** The amount to send, in wei, as a decimal string. */
	wei: string().regex(/^\d+$/),
	/** Unix ms: the payment must be mined before this. */
	expiresAt: number().int(),
	/** Opaque, signed by Poof: send it back with the redemption. */
	quote: string().min(1).max(1e3)
});
var redeemResponseSchema = discriminatedUnion("status", [object({
	status: literal("pending"),
	confirmations: number().int().nonnegative(),
	needed: number().int()
}), object({
	status: literal("ok"),
	blindSignature: b64url(400)
})]);
/** GET /api/pay/config: where to pay, what, and the pass key for every variant. */
var payKeySchema = object({
	variant: string(),
	keyId: b64url(64),
	spki: b64url(1200)
});
var payConfigSchema = object({
	treasury: hexAddress,
	chains: array(object({
		name: _enum(CHAINS),
		label: string(),
		chainId: number().int(),
		confirmations: number().int(),
		explorer: string(),
		tokens: array(object({
			symbol: _enum(TOKENS),
			/** null for ETH (the chain's own coin). */
			address: hexAddress.nullable(),
			decimals: number().int()
		}))
	})),
	keys: array(payKeySchema)
});
/** A finished pass: what the browser keeps until it is spent. */
var passSchema = object({
	variant: variantSchema,
	keyId: b64url(64),
	/** The pass message (prepared per RFC 9474), base64url. */
	msg: b64url(200),
	signature: b64url(400)
});
//#endregion
//#region packages/protocol/src/http.ts
var planSchema = _enum(["free", "super"]);
var tierSchema = _enum(TIERS);
var limitsSchema = object({
	fileTransfer: boolean(),
	fileMaxBytes: number().int().nonnegative().max(FILE_MAX_BYTES_CEILING)
});
var errorBodySchema = object({ error: object({
	code: _enum([
		"rate_limited",
		"room_not_found",
		"handshake_exists",
		"handshake_not_found",
		"invalid_request",
		"invalid_handshake",
		"forbidden_origin",
		"unsupported_media_type",
		"payload_too_large",
		"method_not_allowed",
		"not_found",
		"internal_error",
		"pay_unavailable",
		"chain_unavailable",
		"payment_invalid",
		"payment_underpaid",
		"payment_used",
		"key_changed",
		"pass_invalid",
		"pass_used",
		"not_owner",
		"ai_not_enabled",
		"ai_not_ready",
		"ai_forbidden",
		"ai_budget_exhausted",
		"ai_unavailable"
	]),
	message: string()
}) });
object({
	ownerHash: ownerHashSchema,
	pass: passSchema.optional()
});
var createRoomResponseSchema = object({
	roomId: roomIdSchema,
	expiresAt: number().int(),
	serverNow: number().int(),
	plan: planSchema,
	tier: tierSchema,
	maxPeers: number().int().positive().max(10),
	limits: limitsSchema,
	/** The room includes the AI model. Absent from older servers: no AI. */
	ai: boolean().default(false)
});
object({
	ownerSecret: ownerSecretSchema,
	pass: passSchema,
	/** The room's AI token hash. Used when the pass includes the AI model. */
	aiHash: aiHashSchema.optional()
});
/** GET /api/rooms/:id */
var roomInfoSchema = createRoomResponseSchema.extend({ peers: number().int().nonnegative().max(10) });
object({ blob: string().min(1).max(HANDSHAKE_BLOB_MAX_BYTES).regex(/^[A-Za-z0-9+/_-]+={0,2}$/, "blob must be base64") });
var putHandshakeResponseSchema = object({ expiresAt: number().int() });
/** POST /api/handshakes/:id/take */
var takeHandshakeResponseSchema = object({ blob: string().max(HANDSHAKE_BLOB_MAX_BYTES) });
object({
	ok: literal(true),
	version: string(),
	commit: string()
});
//#endregion
//#region packages/protocol/src/ws.ts
var v$1 = literal(1);
/** WebRTC signaling payload. Opaque to the server beyond this shape/size check. */
var signalPayloadSchema = discriminatedUnion("kind", [
	object({
		kind: literal("offer"),
		sdp: string().max(12e3)
	}),
	object({
		kind: literal("answer"),
		sdp: string().max(12e3)
	}),
	object({
		kind: literal("candidate"),
		candidate: object({
			candidate: string().max(2048),
			sdpMid: string().max(256).nullable().optional(),
			sdpMLineIndex: number().int().nonnegative().nullable().optional(),
			usernameFragment: string().max(256).nullable().optional()
		})
	})
]);
var iceUrl = string().max(512);
var iceServerSchema = object({
	urls: union([iceUrl, array(iceUrl).max(16)]),
	username: string().max(512).optional(),
	credential: string().max(512).optional()
});
discriminatedUnion("t", [
	object({
		v: v$1,
		t: literal("signal"),
		to: peerIdSchema.optional(),
		payload: signalPayloadSchema
	}),
	object({
		v: v$1,
		t: literal("destroy"),
		ownerSecret: ownerSecretSchema
	}),
	object({
		v: v$1,
		t: literal("leave")
	})
]);
var peerRoleSchema = _enum(["initiator", "responder"]);
var serverMessageSchema = discriminatedUnion("t", [
	object({
		v: v$1,
		t: literal("welcome"),
		roomId: roomIdSchema,
		peerId: peerIdSchema,
		plan: planSchema,
		tier: tierSchema,
		expiresAt: number().int(),
		/** Server clock at send time, so clients can correct skew in their countdown. */
		serverNow: number().int(),
		maxPeers: number().int().positive().max(10),
		/** Peers in the room, including this one. */
		peers: number().int().positive().max(10),
		/** The other members already present (a hint for the UI; links come with `paired`). */
		members: array(peerIdSchema).max(10),
		limits: limitsSchema,
		ai: boolean().default(false)
	}),
	object({
		v: v$1,
		t: literal("paired"),
		role: peerRoleSchema,
		peerId: peerIdSchema,
		iceServers: array(iceServerSchema).max(8)
	}),
	object({
		v: v$1,
		t: literal("signal"),
		from: peerIdSchema,
		payload: signalPayloadSchema
	}),
	object({
		v: v$1,
		t: literal("peer.left"),
		peerId: peerIdSchema,
		reason: _enum(["closed", "leave"])
	}),
	object({
		v: v$1,
		t: literal("replaced")
	}),
	object({
		v: v$1,
		t: literal("room.expired")
	}),
	object({
		v: v$1,
		t: literal("room.destroyed"),
		by: peerIdSchema
	}),
	object({
		v: v$1,
		t: literal("room.upgraded"),
		plan: planSchema,
		tier: tierSchema,
		expiresAt: number().int(),
		serverNow: number().int(),
		maxPeers: number().int().positive().max(10),
		limits: limitsSchema,
		ai: boolean().default(false),
		/**
		* Fresh relay credentials that last until the new end of the room. Links that go through the
		* relay restart ICE with them, since the old ones expire at the old end.
		*/
		iceServers: array(iceServerSchema).max(8)
	}),
	object({
		v: v$1,
		t: literal("rejected"),
		code: number().int().min(4e3).max(4999),
		reason: string().max(64)
	}),
	object({
		v: v$1,
		t: literal("error"),
		code: _enum([
			"protocol_error",
			"signal_too_large",
			"signal_rate_exceeded",
			"not_paired",
			"not_owner"
		]),
		message: string()
	})
]);
//#endregion
//#region packages/protocol/src/datachannel.ts
/**
* DataChannel protocol (peer ↔ peer). Never seen by the server.
*
* Phase 1 (key exchange) uses plain JSON *text* messages on the ctl channel.
* Phase 2 (everything else) uses binary AEAD frames, see FRAME / FrameType below.
*/
var v = literal(1);
var b64 = string().min(1).max(4096);
var pqMessageSchema = discriminatedUnion("t", [
	object({
		v,
		t: literal("pq.hello"),
		pk: b64
	}),
	object({
		v,
		t: literal("pq.reply"),
		ct: b64,
		confirm: b64
	}),
	object({
		v,
		t: literal("pq.confirm"),
		confirm: b64
	})
]);
/** Frame header: version(1) channel(1) type(1) seq(8). AAD = these 11 bytes. */
var FRAME = {
	VERSION: 1,
	HEADER_BYTES: 11,
	TAG_BYTES: 16,
	NONCE_BYTES: 12
};
var Channel = {
	/** Chat + control. */
	Ctl: 1,
	/** File transfer. */
	Files: 2
};
var FrameType = {
	Chat: 1,
	Ctl: 2,
	/** An AI answer (see ai.ts), sent by whoever asked. */
	Ai: 3,
	FileMeta: 16,
	FileChunk: 17,
	FileEnd: 18,
	FileAbort: 19,
	FileAck: 20
};
/** DataChannel labels. */
var CHANNEL_LABEL = {
	Ctl: "poof-ctl",
	Files: "poof-files"
};
var chatPlaintextSchema = object({
	id: string().min(1).max(64),
	text: string().min(1).max(CHAT_MAX_CHARS),
	ts: number().int()
});
var ctlPlaintextSchema = discriminatedUnion("kind", [
	object({
		kind: literal("connection_type"),
		value: _enum(["direct", "relay"])
	}),
	object({ kind: literal("bye") }),
	object({
		kind: literal("hello"),
		nickname: string().max(128).nullable()
	}),
	object({
		kind: literal("members"),
		peerIds: array(peerIdSchema).max(10)
	}),
	object({
		kind: literal("typing"),
		on: boolean()
	}),
	object({
		kind: literal("ai"),
		askId: string().min(1).max(64),
		state: _enum(["thinking", "failed"])
	})
]);
var sha256b64 = string().regex(/^[A-Za-z0-9_-]{43}$/, "invalid sha256");
/** Sender → receiver: start of a transfer. Encrypted like every frame; the receiver re-checks it all. */
var fileMetaSchema = object({
	fileId: fileIdSchema,
	name: string().max(1024),
	size: number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
	mime: string().max(255),
	chunks: number().int().nonnegative(),
	/** base64url(SHA-256(whole file)), checked by the receiver before it accepts the file. */
	sha256: sha256b64
});
/** Sender → receiver: every chunk has been sent. */
var fileEndSchema = object({ fileId: fileIdSchema });
var fileAbortSchema = object({
	fileId: fileIdSchema,
	reason: _enum([
		"cancelled",
		"not_allowed",
		"too_large",
		"busy",
		"invalid"
	])
});
/** Receiver → sender: the whole file arrived; `ok` is false when its hash didn't match. */
var fileAckSchema = object({
	fileId: fileIdSchema,
	ok: boolean()
});
//#endregion
//#region packages/core/src/text.ts
/**
* Normalise chat text on both send and receive: NFKC, CRLF → LF, strip control characters EXCEPT
* newline and tab (multi-line messages are a feature), trim, cap length by code points.
*/
function normalizeChatText(value, maxChars = CHAT_MAX_CHARS) {
	const text = (value ?? "").normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "").trim();
	const points = Array.from(text);
	return points.length > maxChars ? points.slice(0, maxChars).join("") : text;
}
/** An AI answer: the same cleanup as chat text, with the AI's longer cap. */
function normalizeAiText(value) {
	return normalizeChatText(value, AI_MAX_CHARS);
}
/** Defensive file name cleanup for received files: no paths, no control chars, ≤ 255 characters. */
function sanitizeFileName(value) {
	const cleaned = (value ?? "").normalize("NFKC").replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/[\\/:*?"<>|]/g, "_").trim();
	return Array.from(cleaned).slice(0, 255).join("").trim().replace(/^\.+$/, "") || "download";
}
/**
* Types a received file may keep, so the UI can preview it inline. Everything else becomes
* application/octet-stream (download only). Never HTML, SVG or anything else a browser would run:
* a blob: URL has our origin, so opening such a file would be script on our page.
*/
var PREVIEW_MIME = /* @__PURE__ */ new Set([
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp"
]);
function sanitizeMime(value) {
	const mime = (value ?? "").trim().toLowerCase();
	return PREVIEW_MIME.has(mime) ? mime : "application/octet-stream";
}
/**
* Display name cleanup, on send and on receipt: NFKC, no control characters or line breaks,
* whitespace collapsed, ≤ 32 code points. Empty → null (no nickname).
*/
function normalizeNickname(value) {
	const text = (value ?? "").normalize("NFKC").replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/\s+/g, " ").trim();
	return Array.from(text).slice(0, 32).join("").trim() || null;
}
//#endregion
//#region packages/core/src/crypto/keys.ts
/** 32 random bytes. Lives only in the URL fragment and in memory. */
function generateRoomKey() {
	return randomBytes(32);
}
/** base64url, no padding: 43 chars. */
function encodeRoomKey(key) {
	return toBase64Url(key);
}
function decodeRoomKey(encoded) {
	if (!roomKeySchema.safeParse(encoded).success) throw new PoofError("invalid_link", "Room key must be 43 base64url characters.");
	return fromBase64Url(encoded);
}
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
	if (le) return {
		h: Number(n & U32_MASK64),
		l: Number(n >> _32n & U32_MASK64)
	};
	return {
		h: Number(n >> _32n & U32_MASK64) | 0,
		l: Number(n & U32_MASK64) | 0
	};
}
function split(lst, le = false) {
	const len = lst.length;
	let Ah = new Uint32Array(len);
	let Al = new Uint32Array(len);
	for (let i = 0; i < len; i++) {
		const { h, l } = fromBig(lst[i], le);
		[Ah[i], Al[i]] = [h, l];
	}
	return [Ah, Al];
}
var fromNumH = (n) => n / 2 ** 32 | 0;
var fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE) {
	const h = fromNumH(n);
	const l = fromNumL(n);
	view.setUint32(byteOffset, isLE ? l : h, isLE);
	view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/utils.js
/**
* Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
* @param a - value to test
* @returns `true` when the value is a Uint8Array-compatible view.
* @example
* Check whether a value is a Uint8Array-compatible view.
* ```ts
* isBytes(new Uint8Array([1, 2, 3]));
* ```
*/
function isBytes$1(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle$1 = (title) => title ? `"${title}" ` : "";
/**
* Asserts something is a non-negative integer.
* @param n - number to validate
* @param title - label included in thrown errors
* @returns The validated number.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a non-negative integer option.
* ```ts
* anumber(32, 'length');
* ```
*/
function anumber$1(n, title = "") {
	if (typeof n !== "number") throw new TypeError(atitle$1(title) + "expected number, got " + typeof n);
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(atitle$1(title) + "expected integer >= 0, got " + n);
	return n;
}
/**
* Asserts something is a boolean.
* @param value - value to validate
* @param title - label included in thrown errors
* @returns The validated boolean.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a boolean option.
* ```ts
* abool(true, 'enableXOF');
* ```
*/
function abool$1(value, title = "") {
	if (typeof value !== "boolean") throw new TypeError(atitle$1(title) + "expected boolean, got type=" + typeof value);
	return value;
}
/**
* Asserts something is Uint8Array.
* @param value - value to validate
* @param length - optional exact length constraint
* @param title - label included in thrown errors
* @returns The validated byte array.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate that a value is a byte array.
* ```ts
* abytes(new Uint8Array([1, 2, 3]));
* ```
*/
function abytes$1(value, length, title = "") {
	if (isBytes$1(value) && (length === void 0 || value.length === length)) return value;
	if (length !== void 0) anumber$1(length, "length");
	const bytes = isBytes$1(value);
	const ofLen = length !== void 0 ? ` of length ${length}` : "";
	const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
	const message = atitle$1(title) + "expected Uint8Array" + ofLen + ", got " + got;
	if (!bytes) throw new TypeError(message);
	throw new RangeError(message);
}
/**
* Asserts something is a wrapped hash constructor.
* @param h - hash constructor to validate
* @throws On wrong argument types or invalid hash wrapper shape. {@link TypeError}
* @throws On invalid hash metadata ranges or values. {@link RangeError}
* @throws If the hash metadata allows empty outputs or block sizes. {@link Error}
* @example
* Validate a callable hash wrapper.
* ```ts
* import { ahash } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* ahash(sha256);
* ```
*/
function ahash(h) {
	if (typeof h !== "function" || typeof h.create !== "function") throw new TypeError("expected hash wrapped by utils.createHasher");
	anumber$1(h.outputLen);
	anumber$1(h.blockLen);
	if (h.outputLen < 1 || h.blockLen < 1) throw new Error("hash blockLen / outputLen must be >= 1");
}
var aobject$1 = (value, label) => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
var aopts = (value, label) => {
	aobject$1(value, label);
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) throw new TypeError(`"${label}" expected plain object`);
	if (Object.hasOwn(value, "__proto__")) throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
* Asserts a hash instance has not been destroyed or finished.
* @param instance - hash instance to validate
* @param checkFinished - whether to reject finalized instances
* @throws If the hash instance has already been destroyed or finalized. {@link Error}
* @example
* Validate that a hash instance is still usable.
* ```ts
* import { aexists } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aexists(hash);
* ```
*/
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("hash was destroyed");
	if (checkFinished && instance.finished) throw new Error("digest() was already called");
}
/**
* Asserts output is a sufficiently-sized byte array.
* @param out - destination buffer
* @param instance - hash instance providing output length
* Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a caller-provided digest buffer.
* ```ts
* import { aoutput } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hash = sha256.create();
* aoutput(new Uint8Array(hash.outputLen), hash);
* ```
*/
function aoutput(out, instance) {
	abytes$1(out, void 0, "output");
	const min = instance.outputLen;
	if (!(out.length >= min)) throw new RangeError("\"output\" expected length >= " + min);
}
/**
* Casts a typed array view to Uint32Array.
* `arr.byteOffset` must already be 4-byte aligned or the platform
* Uint32Array constructor will throw.
* @param arr - source typed array
* @returns Uint32Array view over the same buffer.
* @example
* Reinterpret a byte array as 32-bit words.
* ```ts
* u32(new Uint8Array(8));
* ```
*/
function u32(arr) {
	return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
* Zeroizes typed arrays in place. Warning: JS provides no guarantees.
* @param arrays - arrays to overwrite with zeros
* @example
* Zeroize sensitive buffers in place.
* ```ts
* clean(new Uint8Array([1, 2, 3]));
* ```
*/
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/**
* Creates a DataView for byte-level manipulation.
* @param arr - source typed array
* @returns DataView over the same buffer region.
* @example
* Create a DataView over an existing buffer.
* ```ts
* createView(new Uint8Array(4));
* ```
*/
function createView(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
* Rotate-right operation for uint32 values.
* @param word - source word
* @param shift - shift amount in bits
* @returns Rotated word.
* @example
* Rotate a 32-bit word to the right.
* ```ts
* rotr(0x12345678, 8);
* ```
*/
function rotr(word, shift) {
	return word << 32 - shift | word >>> shift;
}
/** Whether the current platform is little-endian. */
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
/**
* Byte-swap operation for uint32 values.
* @param word - source word
* @returns Word with reversed byte order.
* @example
* Reverse the byte order of a 32-bit word.
* ```ts
* byteSwap(0x11223344);
* ```
*/
function byteSwap(word) {
	return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
/**
* Byte-swaps every word of a Uint32Array in place.
* @param arr - array to mutate
* @returns The same array after mutation; callers pass live state arrays here.
* @example
* Reverse the byte order of every word in place.
* ```ts
* byteSwap32(new Uint32Array([0x11223344]));
* ```
*/
function byteSwap32(arr) {
	for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
	return arr;
}
/**
* Conditionally byte-swaps a Uint32Array on big-endian platforms.
* @param u - array to normalize for host endianness
* @returns Original or byte-swapped array depending on platform endianness.
*   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
* @example
* Normalize a word array for host endianness.
* ```ts
* swap32IfBE(new Uint32Array([0x11223344]));
* ```
*/
var swap32IfBE = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Convert byte array to hex string.
* Uses the built-in function when available and assumes it matches the tested
* fallback semantics.
* @param bytes - bytes to encode
* @returns Lowercase hexadecimal string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Convert bytes to lowercase hexadecimal.
* ```ts
* bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
* ```
*/
function bytesToHex$1(bytes) {
	abytes$1(bytes);
	if (hasHexBuiltin) return bytes.toHex();
	let hex = "";
	for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
	return hex;
}
function asciiToBase16(ch) {
	return ch >= 48 && ch <= 57 ? ch - 48 : ch >= 65 && ch <= 70 ? ch - 55 : ch >= 97 && ch <= 102 ? ch - 87 : void 0;
}
/**
* Convert hex string to byte array. Uses built-in function, when available.
* @param hex - hexadecimal string to decode
* @returns Decoded bytes.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Decode lowercase hexadecimal into bytes.
* ```ts
* hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
* ```
*/
function hexToBytes$1(hex) {
	if (typeof hex !== "string") throw new TypeError("hex string expected, got " + typeof hex);
	if (hasHexBuiltin) try {
		return Uint8Array.fromHex(hex);
	} catch (error) {
		if (error instanceof SyntaxError) throw new RangeError(error.message);
		throw error;
	}
	const hl = hex.length;
	const al = hl / 2;
	if (hl % 2) throw new RangeError("hex string expected, got unpadded hex of length " + hl);
	const array = new Uint8Array(al);
	for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
		const n1 = asciiToBase16(hex.charCodeAt(hi));
		const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
		if (n1 === void 0 || n2 === void 0) {
			const char = hex[hi] + hex[hi + 1];
			throw new RangeError("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
		}
		array[ai] = n1 * 16 + n2;
	}
	return array;
}
/**
* Copies several Uint8Arrays into one.
* @param arrays - arrays to concatenate
* @returns Concatenated byte array.
* @throws On wrong argument types. {@link TypeError}
* @example
* Concatenate multiple byte arrays.
* ```ts
* concatBytes(new Uint8Array([1]), new Uint8Array([2]));
* ```
*/
function concatBytes$1(...arrays) {
	let sum = 0;
	for (let i = 0; i < arrays.length; i++) {
		const a = arrays[i];
		abytes$1(a);
		sum += a.length;
	}
	const res = new Uint8Array(sum);
	for (let i = 0, pad = 0; i < arrays.length; i++) {
		const a = arrays[i];
		res.set(a, pad);
		pad += a.length;
	}
	return res;
}
/**
* Merges default options and passed options.
* @param defaults - base option object
* @param opts - user overrides
* @param title - label included in thrown override errors
* @returns Fresh merged option object with a null prototype.
* @throws On wrong argument types. {@link TypeError}
* @example
* Merge user overrides onto default options.
* ```ts
* checkOpts({ dkLen: 32 }, { asyncTick: 10 });
* ```
*/
function checkOpts(defaults, opts, title = "opts") {
	aopts(defaults, "defaults");
	if (opts !== void 0) aopts(opts, title);
	return Object.assign(Object.create(null), defaults, opts);
}
/**
* Creates a callable hash function from a stateful class constructor.
* @param hashCons - hash constructor or factory
* @param info - optional metadata such as DER OID
* @returns Frozen callable hash wrapper with `.create()`.
*   Wrapper construction eagerly calls `hashCons(undefined)` once to read
*   `outputLen` / `blockLen`, so constructor side effects happen at module
*   init time.
* @throws On wrong argument types. {@link TypeError}
* @example
* Wrap a stateful hash constructor into a callable helper.
* ```ts
* import { createHasher } from '@noble/hashes/utils.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const wrapped = createHasher(sha256.create, { oid: sha256.oid });
* wrapped(new Uint8Array([1]));
* ```
*/
function createHasher(hashCons, info = {}) {
	if (typeof hashCons !== "function") throw new TypeError("\"hashCons\" expected function, got type=" + typeof hashCons);
	info = checkOpts({}, info, "info");
	const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
	const tmp = hashCons(void 0);
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.canXOF = tmp.canXOF;
	hashC.create = (opts) => hashCons(opts);
	Object.assign(hashC, info);
	return Object.freeze(hashC);
}
/**
* Cryptographically secure PRNG backed by `crypto.getRandomValues`.
* @param bytesLength - number of random bytes to generate
* @returns Random bytes.
* The platform `getRandomValues()` implementation still defines any
* single-call length cap, and this helper rejects oversize requests
* with a stable library `RangeError` instead of host-specific errors.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
* @example
* Generate a fresh random key or nonce.
* ```ts
* const key = randomBytes(16);
* ```
*/
function randomBytes$3(bytesLength = 32) {
	anumber$1(bytesLength, "bytesLength");
	const cr = typeof globalThis === "object" ? globalThis.crypto : null;
	if (typeof cr?.getRandomValues !== "function") throw new Error("crypto.getRandomValues must be defined");
	if (bytesLength > 65536) throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
	return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
* Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
* @param suffix - final OID byte for the selected hash.
*   The helper accepts any byte even though only the documented NIST hash
*   suffixes are meaningful downstream.
* @returns Object containing the DER-encoded OID.
* @example
* Build OID metadata for a NIST hash.
* ```ts
* oidNist(0x01);
* ```
*/
var oidNist = (suffix) => ({ oid: Uint8Array.from([
	6,
	9,
	96,
	134,
	72,
	1,
	101,
	3,
	4,
	2,
	suffix
]) });
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/sha3.js
/**
* SHA3 (keccak) hash function, based on a new "Sponge function" design.
* Different from older hashes, the internal state is bigger than output size.
*
* Check out
* {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf | FIPS-202},
* {@link https://keccak.team/keccak.html | Website}, and
* {@link https://crypto.stackexchange.com/q/15727 | the differences between
* SHA-3 and Keccak}.
*
* Check out `sha3-addons` module for cSHAKE, k12, and others.
* @module
*/
var _0n$5 = BigInt(0);
var _1n$4 = BigInt(1);
var _2n$3 = BigInt(2);
var _7n$1 = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n$4, x = 1, y = 0; round < 24; round++) {
	[x, y] = [y, (2 * x + 3 * y) % 5];
	SHA3_PI.push(2 * (5 * y + x));
	SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
	let t = _0n$5;
	for (let j = 0; j < 7; j++) {
		R = (R << _1n$4 ^ (R >> _7n$1) * _0x71n) % _256n;
		if (R & _2n$3) t ^= _1n$4 << (_1n$4 << BigInt(j)) - _1n$4;
	}
	_SHA3_IOTA.push(t);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
var B = /* @__PURE__ */ new Uint32Array(10);
/**
* `keccakf1600` internal permutation, additionally allows adjusting the round count.
* @param s - 5x5 Keccak state encoded as 25 lanes split into 50 uint32 words
*   in this file's local little-endian lane-word order
* @param rounds - number of rounds to execute
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If `rounds` is outside the supported `1..24` range. {@link Error}
* @example
* Permute a Keccak state with the default 24 rounds.
* ```ts
* keccakP(new Uint32Array(50));
* ```
*/
function keccakP(s, rounds = 24) {
	if (!(s instanceof Uint32Array)) throw new TypeError("\"s\" expected Uint32Array(50), got type=" + typeof s);
	if (s.length !== 50) throw new RangeError("\"s\" expected Uint32Array(50), got length=" + s.length);
	anumber$1(rounds, "rounds");
	if (rounds < 1 || rounds > 24) throw new Error("\"rounds\" expected integer 1..24");
	for (let round = 24 - rounds; round < 24; round++) {
		for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
		for (let x = 0; x < 10; x += 2) {
			const idx1 = (x + 8) % 10;
			const idx0 = (x + 2) % 10;
			const B0 = B[idx0];
			const B1 = B[idx0 + 1];
			const Th = rotlH(B0, B1, 1) ^ B[idx1];
			const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
			for (let y = 0; y < 50; y += 10) {
				s[x + y] ^= Th;
				s[x + y + 1] ^= Tl;
			}
		}
		let curH = s[2];
		let curL = s[3];
		for (let t = 0; t < 24; t++) {
			const shift = SHA3_ROTL[t];
			const Th = rotlH(curH, curL, shift);
			const Tl = rotlL(curH, curL, shift);
			const PI = SHA3_PI[t];
			curH = s[PI];
			curL = s[PI + 1];
			s[PI] = Th;
			s[PI + 1] = Tl;
		}
		for (let y = 0; y < 50; y += 10) {
			const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
			s[y] ^= ~s[y + 2] & s[y + 4];
			s[y + 1] ^= ~s[y + 3] & s[y + 5];
			s[y + 2] ^= ~s[y + 4] & s[y + 6];
			s[y + 3] ^= ~s[y + 5] & s[y + 7];
			s[y + 4] ^= ~s[y + 6] & s[y + 8];
			s[y + 5] ^= ~s[y + 7] & s[y + 9];
			s[y + 6] ^= ~s[y + 8] & b0;
			s[y + 7] ^= ~s[y + 9] & b1;
			s[y + 8] ^= ~b0 & b2;
			s[y + 9] ^= ~b1 & b3;
		}
		s[0] ^= SHA3_IOTA_H[round];
		s[1] ^= SHA3_IOTA_L[round];
	}
	clean(B);
}
/**
* Keccak sponge function.
* @param blockLen - absorb/squeeze rate in bytes
* @param suffix - domain separation suffix byte
* @param outputLen - default digest length in bytes. This base sponge only
*   requires a non-negative integer; wrappers that need positive output
*   lengths must enforce that themselves.
* @param enableXOF - whether XOF output is allowed
* @param rounds - number of Keccak-f rounds
* @example
* Build a sponge state, absorb bytes, then finalize a digest.
* ```ts
* const hash = new Keccak(136, 0x06, 32);
* hash.update(new Uint8Array([1, 2, 3]));
* hash.digest();
* ```
*/
var Keccak = class Keccak {
	state;
	pos = 0;
	posOut = 0;
	finished = false;
	state32;
	destroyed = false;
	blockLen;
	suffix;
	outputLen;
	canXOF;
	enableXOF = false;
	rounds;
	constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
		anumber$1(blockLen, "blockLen");
		anumber$1(suffix, "suffix");
		anumber$1(rounds, "rounds");
		abool$1(enableXOF, "enableXOF");
		this.blockLen = blockLen;
		this.suffix = suffix;
		this.outputLen = outputLen;
		this.enableXOF = enableXOF;
		this.canXOF = enableXOF;
		this.rounds = rounds;
		anumber$1(outputLen, "outputLen");
		if (!(0 < blockLen && blockLen < 200)) throw new Error("\"blockLen\" must be 1..199");
		this.state = /* @__PURE__ */ new Uint8Array(200);
		this.state32 = u32(this.state);
	}
	clone() {
		return this._cloneInto();
	}
	keccak() {
		swap32IfBE(this.state32);
		keccakP(this.state32, this.rounds);
		swap32IfBE(this.state32);
		this.posOut = 0;
		this.pos = 0;
	}
	update(data) {
		aexists(this);
		abytes$1(data);
		const { blockLen, state, state32 } = this;
		const len = data.length;
		const canUseU32 = blockLen % 4 === 0 && data.byteOffset % 4 === 0;
		const blockLen32 = blockLen / 4;
		const data32 = canUseU32 && len >= blockLen ? u32(data) : void 0;
		for (let pos = 0; pos < len;) {
			if (data32 !== void 0 && this.pos === 0 && pos % 4 === 0 && len - pos >= blockLen) {
				for (let i = 0, o = pos / 4; i < blockLen32; i++) state32[i] ^= data32[o + i];
				pos += blockLen;
				this.pos = blockLen;
				this.keccak();
				continue;
			}
			const take = Math.min(blockLen - this.pos, len - pos);
			for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
			if (this.pos === blockLen) this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = true;
		const { state, suffix, pos, blockLen } = this;
		state[pos] ^= suffix;
		if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
		state[blockLen - 1] ^= 128;
		this.keccak();
	}
	writeInto(out) {
		aexists(this, false);
		abytes$1(out);
		this.finish();
		const bufferOut = this.state;
		const { blockLen } = this;
		for (let pos = 0, len = out.length; pos < len;) {
			if (this.posOut >= blockLen) this.keccak();
			const take = Math.min(blockLen - this.posOut, len - pos);
			out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
			this.posOut += take;
			pos += take;
		}
		return out;
	}
	xofInto(out) {
		if (!this.enableXOF) throw new Error("XOF is not enabled");
		return this.writeInto(out);
	}
	xof(bytes) {
		anumber$1(bytes);
		return this.xofInto(new Uint8Array(bytes));
	}
	digestInto(out) {
		aoutput(out, this);
		if (this.finished) throw new Error("digest() was already called");
		this.writeInto(out.length === this.outputLen ? out : out.subarray(0, this.outputLen));
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.outputLen);
		this.digestInto(out);
		return out;
	}
	destroy() {
		this.destroyed = true;
		clean(this.state);
	}
	_cloneInto(to) {
		const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
		to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
		to.blockLen = blockLen;
		to.state32.set(this.state32);
		to.pos = this.pos;
		to.posOut = this.posOut;
		to.finished = this.finished;
		to.rounds = rounds;
		to.suffix = suffix;
		to.outputLen = outputLen;
		to.enableXOF = enableXOF;
		to.canXOF = this.canXOF;
		to.destroyed = this.destroyed;
		return to;
	}
};
var genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
/**
* SHA3-256 hash function. Different from keccak-256.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with SHA3-256.
* ```ts
* sha3_256(new Uint8Array([97, 98, 99]));
* ```
*/
var sha3_256 = /* @__PURE__ */ genKeccak(6, 136, 32, /* @__PURE__ */ oidNist(8));
/**
* SHA3-512 hash function.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with SHA3-512.
* ```ts
* sha3_512(new Uint8Array([97, 98, 99]));
* ```
*/
var sha3_512 = /* @__PURE__ */ genKeccak(6, 72, 64, /* @__PURE__ */ oidNist(10));
/**
* Keccak-256 hash function. Different from SHA3-256.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with Keccak-256.
* ```ts
* keccak_256(new Uint8Array([97, 98, 99]));
* ```
*/
var keccak_256 = /* @__PURE__ */ genKeccak(1, 136, 32);
var genShake = (suffix, blockLen, outputLen, info = {}) => createHasher((opts = {}) => {
	opts = checkOpts({}, opts);
	return new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true);
}, info);
/**
* SHAKE128 XOF with 128-bit security and a 16-byte default output.
* @param msg - message bytes to hash
* @param opts - Optional output-length override. See {@link ShakeOpts}.
* @returns Digest bytes.
* @example
* Hash a message with SHAKE128.
* ```ts
* shake128(new Uint8Array([97, 98, 99]), { dkLen: 32 });
* ```
*/
var shake128 = /* @__PURE__ */ genShake(31, 168, 16, /* @__PURE__ */ oidNist(11));
/**
* SHAKE256 XOF with 256-bit security and a 32-byte default output.
* @param msg - message bytes to hash
* @param opts - Optional output-length override. See {@link ShakeOpts}.
* @returns Digest bytes.
* @example
* Hash a message with SHAKE256.
* ```ts
* shake256(new Uint8Array([97, 98, 99]), { dkLen: 64 });
* ```
*/
var shake256 = /* @__PURE__ */ genShake(31, 136, 32, /* @__PURE__ */ oidNist(12));
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/utils.js
/**
* Hex, bytes and number utilities.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/**
* Validates that a value is an array, optionally validating each element.
* @param item - Value to validate.
* @param title - Label included in thrown errors.
* @param inner - Optional per-element validator, called with the element and its label.
* @returns The validated array.
* @example
* Validate an array of points before batch processing.
*
* ```ts
* aarray([1n, 2n], 'scalars');
* ```
*/
function aarray$1(item, title, inner = () => {}) {
	if (!Array.isArray(item)) throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
	for (let i = 0; i < item.length; i++) inner(item[i], `${title}[${i}]`);
	return item;
}
/**
* Validates that a value is a byte array.
* @param value - Value to validate.
* @param length - Optional exact byte length.
* @param title - Optional field name.
* @returns Original byte array.
* @example
* Reject non-byte input before passing data into curve code.
*
* ```ts
* abytes(new Uint8Array(1));
* ```
*/
var abytes = (value, length, title) => abytes$1(value, length, title);
/**
* Validates that a value is a non-negative safe integer.
* @param n - Value to validate.
* @param title - Optional field name.
* @returns The validated number.
* @example
* Validate a numeric length before allocating buffers.
*
* ```ts
* anumber(1);
* ```
*/
var anumber = anumber$1;
/**
* Asserts something is a string.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated string.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a label string.
*
* ```ts
* astring('example', 'label');
* ```
*/
function astring(value, title = "") {
	if (typeof value !== "string") {
		const prefix = title && `"${title}" `;
		throw new TypeError(prefix + "expected string, got type=" + typeof value);
	}
	return value;
}
/**
* Asserts something is a plain object-ish value, not null or array.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated object.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate an options object before checking fields.
*
* ```ts
* aobject({ flag: true });
* ```
*/
function aobject(value, title = "object") {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(title === "object" ? "expected valid options object" : `"${title}" expected object, got type=${typeof value}`);
	return value;
}
/**
* Asserts something is a function.
* @param value - Value to validate.
* @param title - Label included in thrown errors.
* @returns The validated function.
* @throws On wrong argument types. {@link TypeError}
* @example
* Validate a required method before calling it.
*
* ```ts
* afunction(() => true, 'predicate');
* ```
*/
function afunction(value, title) {
	if (typeof value !== "function") throw new TypeError(`"${title}" is invalid: expected function, got ${typeof value}`);
	return value;
}
/**
* Encodes bytes as lowercase hex.
* @param bytes - Bytes to encode.
* @returns Lowercase hex string.
* @example
* Serialize bytes as hex for logging or fixtures.
*
* ```ts
* bytesToHex(Uint8Array.of(1, 2, 3));
* ```
*/
var bytesToHex = bytesToHex$1;
/**
* Concatenates byte arrays.
* @param arrays - Byte arrays to join.
* @returns Concatenated bytes.
* @example
* Join domain-separated chunks into one buffer.
*
* ```ts
* concatBytes(Uint8Array.of(1), Uint8Array.of(2));
* ```
*/
var concatBytes = (...arrays) => concatBytes$1(...arrays);
/**
* Decodes lowercase or uppercase hex into bytes.
* @param hex - Hex string to decode.
* @returns Decoded bytes.
* @example
* Parse fixture hex into bytes before hashing.
*
* ```ts
* hexToBytes('0102');
* ```
*/
var hexToBytes = (hex) => hexToBytes$1(hex);
/**
* Checks whether a value is a Uint8Array.
* @param a - Value to inspect.
* @returns `true` when `a` is a Uint8Array.
* @example
* Branch on byte input before decoding it.
*
* ```ts
* isBytes(new Uint8Array(1));
* ```
*/
var isBytes = isBytes$1;
/**
* Reads random bytes from the platform CSPRNG.
* @param bytesLength - Number of random bytes to read.
* @returns Fresh random bytes.
* @example
* Generate a random seed for a keypair.
*
* ```ts
* randomBytes(2);
* ```
*/
var randomBytes$2 = (bytesLength) => randomBytes$3(bytesLength);
var _0n$4 = /* @__PURE__ */ BigInt(0);
var _1n$3 = /* @__PURE__ */ BigInt(1);
var atitle = (title) => title ? `"${title}" ` : "";
/**
* Validates that a flag is boolean.
* @param value - Value to validate.
* @param title - Optional field name.
* @returns Original value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Reject non-boolean option flags early.
*
* ```ts
* abool(true);
* ```
*/
function abool(value, title = "") {
	if (typeof value !== "boolean") throw new TypeError(atitle(title) + "expected boolean, got type=" + typeof value);
	return value;
}
/**
* Validates that a value is a non-negative bigint or safe integer.
* @param n - Value to validate.
* @returns The same validated value.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate one integer-like value before serializing it.
*
* ```ts
* abignumber(1n);
* ```
*/
function abignumber(n) {
	if (typeof n === "bigint") {
		if (!isPosBig(n)) throw new RangeError("positive bigint expected, got " + n);
	} else anumber(n);
	return n;
}
/**
* Validates that a value is a safe integer.
* @param value - Integer to validate.
* @param title - Optional field name.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Validate a window size before scalar arithmetic uses it.
*
* ```ts
* asafenumber(1);
* ```
*/
function asafenumber(value, title = "") {
	if (typeof value !== "number") {
		const prefix = title && `"${title}" `;
		throw new TypeError(prefix + "expected number, got type=" + typeof value);
	}
	if (!Number.isSafeInteger(value)) {
		const prefix = title && `"${title}" `;
		throw new RangeError(prefix + "expected safe integer, got " + value);
	}
}
/**
* Encodes a bigint into even-length big-endian hex.
* The historical "unpadded" name only means "no fixed-width field padding"; odd-length hex still
* gets one leading zero nibble so the result always represents whole bytes.
* @param num - Number to encode.
* @returns Big-endian hex string.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Encode a scalar into hex without a `0x` prefix.
*
* ```ts
* numberToHexUnpadded(255n);
* ```
*/
function numberToHexUnpadded(num) {
	const hex = abignumber(num).toString(16);
	return hex.length & 1 ? "0" + hex : hex;
}
/**
* Parses a big-endian hex string into bigint.
* Accepts odd-length hex through the native `BigInt('0x' + hex)` parser and currently surfaces the
* same native `SyntaxError` for malformed hex instead of wrapping it in a library-specific error.
* @param hex - Hex string without `0x`.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Parse a scalar from fixture hex.
*
* ```ts
* hexToNumber('ff');
* ```
*/
function hexToNumber(hex) {
	if (typeof hex !== "string") throw new TypeError("hex string expected, got " + typeof hex);
	return hex === "" ? _0n$4 : BigInt("0x" + hex);
}
/**
* Parses big-endian bytes into bigint.
* @param bytes - Bytes in big-endian order.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Read a scalar encoded in network byte order.
*
* ```ts
* bytesToNumberBE(Uint8Array.of(1, 0));
* ```
*/
function bytesToNumberBE(bytes) {
	return hexToNumber(bytesToHex$1(bytes));
}
/**
* Parses little-endian bytes into bigint.
* @param bytes - Bytes in little-endian order.
* @returns Parsed bigint value.
* @throws On wrong argument types. {@link TypeError}
* @example
* Read a scalar encoded in little-endian form.
*
* ```ts
* bytesToNumberLE(Uint8Array.of(1, 0));
* ```
*/
function bytesToNumberLE(bytes) {
	return hexToNumber(bytesToHex$1(copyBytes$1(abytes$1(bytes)).reverse()));
}
/**
* Encodes a bigint into fixed-length big-endian bytes.
* @param n - Number to encode.
* @param len - Output length in bytes. Must be greater than zero.
* @returns Big-endian byte array.
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If a documented runtime validation or state check fails. {@link Error}
* @example
* Serialize a scalar into a 32-byte field element.
*
* ```ts
* numberToBytesBE(255n, 2);
* ```
*/
function numberToBytesBE(n, len) {
	anumber$1(len);
	if (len === 0) throw new Error("zero output length is invalid");
	n = abignumber(n);
	const expectedLen = len * 2;
	const hex = n.toString(16);
	if (hex.length > expectedLen) throw new RangeError("number is too large");
	return hexToBytes$1(hex.padStart(expectedLen, "0"));
}
/**
* Encodes a bigint into fixed-length little-endian bytes.
* @param n - Number to encode.
* @param len - Output length in bytes.
* @returns Little-endian byte array.
* @throws On wrong argument ranges or values. {@link RangeError}
* @throws If a documented runtime validation or state check fails. {@link Error}
* @example
* Serialize a scalar for little-endian protocols.
*
* ```ts
* numberToBytesLE(255n, 2);
* ```
*/
function numberToBytesLE(n, len) {
	return numberToBytesBE(n, len).reverse();
}
/**
* Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
* and Buffer#slice creates mutable copy. Never use Buffers!
* @param bytes - Bytes to copy.
* @returns Detached copy.
* @example
* Make an isolated copy before mutating serialized bytes.
*
* ```ts
* copyBytes(Uint8Array.of(1, 2, 3));
* ```
*/
function copyBytes$1(bytes) {
	return Uint8Array.from(abytes(bytes));
}
/**
* Checks whether n is non-negative bigint. Historical name.
* @param n - candidate value
* @returns `true` when the value is bigint and 0 or larger
* @example
* Check a candidate scalar before range validation.
*
* ```ts
* isPosBig(2n);
* ```
*/
function isPosBig(n) {
	return typeof n === "bigint" && _0n$4 <= n;
}
/**
* Checks whether a bigint lies inside a half-open range.
* @param n - Candidate value.
* @param min - Inclusive lower bound.
* @param max - Exclusive upper bound.
* @returns `true` when the value is inside the range.
* @example
* Check whether a candidate scalar fits the field order.
*
* ```ts
* inRange(2n, 1n, 3n);
* ```
*/
function inRange(n, min, max) {
	return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
* Asserts `min <= n < max`. NOTE: upper bound is exclusive.
* @param title - Value label for error messages.
* @param n - Candidate value.
* @param min - Inclusive lower bound.
* @param max - Exclusive upper bound.
* Wrong-type inputs are not separated from out-of-range values here: they still flow through the
* shared `RangeError` path because this is only a throwing wrapper around `inRange(...)`.
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Assert that a bigint stays within one half-open range.
*
* ```ts
* aInRange('x', 2n, 1n, 256n);
* ```
*/
function aInRange(title, n, min, max) {
	if (!inRange(n, min, max)) throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
/**
* Calculates amount of bits in a bigint.
* Same as `n.toString(2).length`
* TODO: merge with nLength in modular
* @param n - Value to inspect.
* @returns Bit length.
* @throws If the value is negative. {@link Error}
* @example
* Measure the bit length of a scalar before serialization.
*
* ```ts
* bitLen(8n);
* ```
*/
function bitLen(n) {
	if (n < _0n$4) throw new Error("expected non-negative bigint, got " + n);
	return n === _0n$4 ? 0 : n.toString(2).length;
}
/**
* Calculate mask for N bits. Not using ** operator with bigints because of old engines.
* Same as BigInt(`0b${Array(i).fill('1').join('')}`)
* @param n - Number of bits. Negative widths are currently passed through to raw bigint shift
*   semantics and therefore produce `-1n`.
* @returns Bitmask value.
* @example
* Calculate mask for N bits.
*
* ```ts
* bitMask(4);
* ```
*/
var bitMask = (n) => {
	asafenumber(n, "n");
	return (_1n$3 << BigInt(n)) - _1n$3;
};
/**
* Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
* @param hashLen - Hash output size in bytes. Callers are expected to pass a positive length; `0`
*   is not rejected here and would make the internal generate loop non-progressing.
* @param qByteLen - Requested output size in bytes. Callers are expected to pass a positive length.
* @param hmacFn - HMAC implementation.
* @returns Function that will call DRBG until the predicate returns anything
*   other than `undefined`.
* @throws On wrong argument types. {@link TypeError}
* @example
* Build a deterministic nonce generator for RFC6979-style signing.
*
* ```ts
* import { createHmacDrbg } from '@noble/curves/utils.js';
* import { hmac } from '@noble/hashes/hmac.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const hmacFn = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);
* const drbg = createHmacDrbg(32, 32, hmacFn);
* const seed = new Uint8Array(32);
* drbg(seed, (bytes) => bytes);
* ```
*/
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
	anumber$1(hashLen, "hashLen");
	anumber$1(qByteLen, "qByteLen");
	if (typeof hmacFn !== "function") throw new TypeError("hmacFn must be a function");
	const u8n = (len) => new Uint8Array(len);
	const NULL = Uint8Array.of();
	const byte0 = Uint8Array.of(0);
	const byte1 = Uint8Array.of(1);
	const _maxDrbgIters = 1e3;
	let v = u8n(hashLen);
	let k = u8n(hashLen);
	let i = 0;
	const reset = () => {
		v.fill(1);
		k.fill(0);
		i = 0;
	};
	const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
	const reseed = (seed = NULL) => {
		k = h(byte0, seed);
		v = h();
		if (seed.length === 0) return;
		k = h(byte1, seed);
		v = h();
	};
	const gen = () => {
		if (i++ >= _maxDrbgIters) throw new Error("drbg: tried max amount of iterations");
		let len = 0;
		const out = [];
		while (len < qByteLen) {
			v = h();
			const sl = v.slice();
			out.push(sl);
			len += v.length;
		}
		return concatBytes(...out);
	};
	const genUntil = (seed, pred) => {
		reset();
		reseed(seed);
		let res = void 0;
		while ((res = pred(gen())) === void 0) reseed();
		reset();
		return res;
	};
	return genUntil;
}
/**
* Validates declared required and optional field types on a plain object.
* Extra keys are intentionally ignored because many callers validate only the subset they use from
* richer option bags or runtime objects.
* This walks field schemas and formats detailed errors, so avoid it on hot paths; use direct
* one-line guards such as `aobject()`, `afunction()`, `abool()`, or `asafenumber()` instead.
* @param object - Object to validate.
* @param fields - Required field types.
* @param optFields - Optional field types.
* @param title - Object label included in thrown errors.
* @throws On wrong argument types. {@link TypeError}
* @example
* Check user options before building a curve helper.
*
* ```ts
* validateObject({ flag: true }, { flag: 'boolean' });
* ```
*/
function validateObject(object, fields = {}, optFields = {}, title = "object") {
	aobject(object, title);
	aobject(fields, "fields");
	aobject(optFields, "optFields");
	function checkField(fieldName, expectedType, isOpt) {
		const label = title === "object" ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
		const val = object[fieldName];
		if (!Object.hasOwn(object, fieldName) && (isOpt ? val !== void 0 : expectedType !== "function")) throw new TypeError(`${label} is invalid: expected own property`);
		if (isOpt && val === void 0) return;
		const current = typeof val;
		if (current !== expectedType || val === null) throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
	}
	const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
	iter(fields, false);
	iter(optFields, true);
}
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/modular.js
/**
* Utils for modular division and fields.
* Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
* There is no division: it is replaced by modular multiplicative inverse.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$3 = /* @__PURE__ */ BigInt(0);
var _1n$2 = /* @__PURE__ */ BigInt(1);
var _2n$2 = /* @__PURE__ */ BigInt(2);
var _3n$1 = /* @__PURE__ */ BigInt(3);
var _4n$2 = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _15n = /* @__PURE__ */ BigInt(15);
var _16n = /* @__PURE__ */ BigInt(16);
var POW_WINDOWED_MIN = /* @__PURE__ */ BigInt("0x10000000000000000");
/**
* @param a - Dividend value.
* @param b - Positive modulus.
* @returns Reduced value in `[0, b)` only when `b` is positive.
* @throws If the modulus is not positive. {@link Error}
* @example
* Normalize a bigint into one field residue.
*
* ```ts
* mod(-1n, 5n);
* ```
*/
function mod(a, b) {
	if (b <= _0n$3) throw new Error("mod: expected positive modulus, got " + b);
	const result = a % b;
	return result >= _0n$3 ? result : b + result;
}
/**
* Efficiently raise num to a power with modular reduction.
* Unsafe in some contexts: uses ladder, so can expose bigint bits.
* Low-level helper: callers that need canonical residues must pass a valid `num` for the chosen
* modulus instead of relying on the `power===0/1` fast paths to normalize it.
* @param num - Base value.
* @param power - Exponent value.
* @param modulo - Reduction modulus.
* @returns Modular exponentiation result.
* @throws If the modulus or exponent is invalid. {@link Error}
* @example
* Raise one bigint to a modular power.
*
* ```ts
* pow(2n, 6n, 11n) // 64n % 11n == 9n
* ```
*/
function pow(num, power, modulo) {
	if (modulo <= _1n$2) throw new Error("pow: expected modulus > 1, got " + modulo);
	if (typeof power !== "bigint") throw new TypeError("invalid exponent: expected bigint, got " + typeof power);
	if (power < _0n$3) throw new Error("invalid exponent, negatives unsupported");
	if (power === _0n$3) return _1n$2;
	if (power === _1n$2) return num;
	let d = num % modulo;
	if (d < _0n$3) d += modulo;
	if (power < POW_WINDOWED_MIN) {
		let p = _1n$2;
		while (power > _0n$3) {
			if (power & _1n$2) p = p * d % modulo;
			d = d * d % modulo;
			power >>= _1n$2;
		}
		return p;
	}
	const digits = [];
	while (power > _0n$3) {
		digits.push(Number(power & _15n));
		power >>= _4n$2;
	}
	const table = new Array(16);
	table[0] = _1n$2;
	table[1] = d;
	for (let i = 2; i < 16; i++) table[i] = table[i - 1] * d % modulo;
	let p = table[digits[digits.length - 1]];
	for (let w = digits.length - 2; w >= 0; w--) {
		p = p * p % modulo;
		p = p * p % modulo;
		p = p * p % modulo;
		p = p * p % modulo;
		const digit = digits[w];
		if (digit !== 0) p = p * table[digit] % modulo;
	}
	return p;
}
/**
* Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)`.
* Low-level helper: callers that need canonical residues must pass a valid `x` for the chosen
* modulus; the `power===0` fast path intentionally returns the input unchanged.
* @param x - Base value.
* @param power - Number of squarings.
* @param modulo - Reduction modulus.
* @returns Repeated-squaring result.
* @throws If the exponent is negative. {@link Error}
* @example
* Apply repeated squaring inside one field.
*
* ```ts
* pow2(3n, 2n, 11n);
* ```
*/
function pow2(x, power, modulo) {
	if (modulo <= _1n$2) throw new Error("pow2: expected modulus > 1, got " + modulo);
	if (power < _0n$3) throw new Error("pow2: expected non-negative exponent, got " + power);
	let res = x;
	while (power-- > _0n$3) {
		res *= res;
		res %= modulo;
	}
	return res;
}
/**
* Inverses number over modulo.
* Implemented using the {@link https://brilliant.org/wiki/extended-euclidean-algorithm/ | extended Euclidean algorithm}.
* @param number - Value to invert.
* @param modulo - Modulus greater than 1.
* @returns Multiplicative inverse.
* @throws If the modulus is invalid or the inverse does not exist. {@link Error}
* @example
* Compute one modular inverse with the extended Euclidean algorithm.
*
* ```ts
* invert(3n, 11n);
* ```
*/
function invert(number, modulo) {
	if (number === _0n$3) throw new Error("invert: expected non-zero number");
	if (modulo <= _1n$2) throw new Error("invert: expected modulus > 1, got " + modulo);
	let a = mod(number, modulo);
	let b = modulo;
	let x = _0n$3, u = _1n$2;
	while (a !== _0n$3) {
		const q = b / a;
		const r = b - a * q;
		const m = x - u * q;
		b = a, a = r, x = u, u = m;
	}
	if (b !== _1n$2) throw new Error("invert: does not exist");
	return mod(x, modulo);
}
/**
* Inverses number over modulo using Fermat's little theorem: `a^(p-2) ≡ a⁻¹ (mod p)`.
*
* Unlike {@link invert} (extended Euclidean), the exponent `p-2` is a public constant, so the
* underlying square-and-multiply has the same control flow for every secret `a`: there is no
* data-dependent branching or loop count that could leak `a` through timing (e.g. Minerva-style
* ECDSA nonce-inversion attacks). This is only "algorithmically" constant-time — JS bigint
* multiplication/reduction is still value-dependent — and it is roughly 4x slower than
* {@link invert}.
*
* REQUIRES a prime modulus; Fermat's theorem does not hold otherwise. The result is verified to be
* a real inverse, so a non-prime modulus (or a non-invertible input) fails closed with an error
* instead of returning a wrong value.
* @param a - Value to invert.
* @param prime - Prime modulus.
* @returns Multiplicative inverse in `[1, prime)`.
* @throws If the modulus is below 2, the input reduces to zero, or the inverse does not exist.
*   {@link Error}
* @example
* Compute one modular inverse without secret-dependent branching.
*
* ```ts
* invertCt(3n, 11n); // 4n, since 3 * 4 = 12 ≡ 1 (mod 11)
* ```
*/
function invertCt(a, prime) {
	if (prime <= _1n$2) throw new Error("invertCt: expected prime modulus > 1, got " + prime);
	const an = mod(a, prime);
	if (an === _0n$3) throw new Error("invertCt: expected non-zero number");
	const inverse = pow(an, prime - _2n$2, prime);
	if (mod(an * inverse, prime) !== _1n$2) throw new Error("invertCt: does not exist");
	return inverse;
}
function assertIsSquare(Fp, root, n) {
	const F = Fp;
	if (!F.eql(F.sqr(root), n)) throw new Error("Cannot find square root");
}
function aoddModulus(order, fnName) {
	if ((order & _1n$2) === _0n$3) throw new Error(fnName + ": expected odd modulus, got " + order);
}
function sqrt3mod4(Fp, n) {
	const F = Fp;
	const p1div4 = (F.ORDER + _1n$2) / _4n$2;
	const root = F.pow(n, p1div4);
	assertIsSquare(F, root, n);
	return root;
}
function sqrt5mod8(Fp, n) {
	const F = Fp;
	const p5div8 = (F.ORDER - _5n) / _8n;
	const n2 = F.mul(n, _2n$2);
	const v = F.pow(n2, p5div8);
	const nv = F.mul(n, v);
	const i = F.mul(F.mul(nv, _2n$2), v);
	const root = F.mul(nv, F.sub(i, F.ONE));
	assertIsSquare(F, root, n);
	return root;
}
function sqrt9mod16(P) {
	const Fp_ = Field(P);
	const tn = tonelliShanks(P);
	const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
	const c2 = tn(Fp_, c1);
	const c3 = tn(Fp_, Fp_.neg(c1));
	const c4 = (P + _7n) / _16n;
	return ((Fp, n) => {
		const F = Fp;
		let tv1 = F.pow(n, c4);
		let tv2 = F.mul(tv1, c1);
		const tv3 = F.mul(tv1, c2);
		const tv4 = F.mul(tv1, c3);
		const e1 = F.eql(F.sqr(tv2), n);
		const e2 = F.eql(F.sqr(tv3), n);
		tv1 = F.cmov(tv1, tv2, e1);
		tv2 = F.cmov(tv4, tv3, e2);
		const e3 = F.eql(F.sqr(tv2), n);
		const root = F.cmov(tv1, tv2, e3);
		assertIsSquare(F, root, n);
		return root;
	});
}
/**
* Tonelli-Shanks square root search algorithm.
* This implementation is variable-time: it searches data-dependently for the first non-residue `Z`
* and for the smallest `i` in the main loop, unlike RFC 9380 Appendix I.4's constant-time shape.
* 1. {@link https://eprint.iacr.org/2012/685.pdf | eprint 2012/685}, page 12
* 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
* @param P - field order
* @returns function that takes field Fp (created from P) and number n
* @throws If the field is too small, non-prime, or the square root does not exist. {@link Error}
* @example
* Construct a square-root helper for primes that need Tonelli-Shanks.
*
* ```ts
* import { Field, tonelliShanks } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const sqrt = tonelliShanks(17n)(Fp, 4n);
* ```
*/
function tonelliShanks(P) {
	if (P < _3n$1) throw new Error("sqrt is not defined for small field");
	aoddModulus(P, "tonelliShanks");
	let Q = P - _1n$2;
	let S = 0;
	while (Q % _2n$2 === _0n$3) {
		Q /= _2n$2;
		S++;
	}
	let Z = _2n$2;
	const _Fp = Field(P);
	while (FpLegendre(_Fp, Z) === 1) if (Z++ > 1e3) throw new Error("Cannot find square root: probably non-prime P");
	if (S === 1) return sqrt3mod4;
	let cc = _Fp.pow(Z, Q);
	const Q1div2 = (Q + _1n$2) / _2n$2;
	return function tonelliSlow(Fp, n) {
		const F = Fp;
		if (F.is0(n)) return n;
		if (FpLegendre(F, n) !== 1) throw new Error("Cannot find square root");
		let M = S;
		let c = F.mul(F.ONE, cc);
		let t = F.pow(n, Q);
		let R = F.pow(n, Q1div2);
		while (!F.eql(t, F.ONE)) {
			if (F.is0(t)) throw new Error("Cannot find square root: probably non-prime P");
			let i = 1;
			let t_tmp = F.sqr(t);
			while (!F.eql(t_tmp, F.ONE)) {
				i++;
				t_tmp = F.sqr(t_tmp);
				if (i === M) throw new Error("Cannot find square root");
			}
			const exponent = _1n$2 << BigInt(M - i - 1);
			const b = F.pow(c, exponent);
			M = i;
			c = F.sqr(b);
			t = F.mul(t, c);
			R = F.mul(R, b);
		}
		return R;
	};
}
/**
* Square root for a finite field. Will try optimized versions first:
*
* 1. P ≡ 3 (mod 4)
* 2. P ≡ 5 (mod 8)
* 3. P ≡ 9 (mod 16)
* 4. Tonelli-Shanks algorithm
*
* Different algorithms can give different roots, it is up to user to decide which one they want.
* For example there is FpSqrtOdd/FpSqrtEven to choose a root by oddness
* (used for hash-to-curve).
* @param P - Field order.
* @returns Square-root helper. The generic fallback inherits Tonelli-Shanks' variable-time
*   behavior and this selector assumes prime-field-style integer moduli.
* @throws If the field is unsupported or the square root does not exist. {@link Error}
* @example
* Choose the square-root helper appropriate for one field modulus.
*
* ```ts
* import { Field, FpSqrt } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const sqrt = FpSqrt(17n)(Fp, 4n);
* ```
*/
function FpSqrt(P) {
	aoddModulus(P, "Fp.sqrt");
	if (P % _4n$2 === _3n$1) return sqrt3mod4;
	if (P % _8n === _5n) return sqrt5mod8;
	if (P % _16n === _9n) return sqrt9mod16(P);
	return tonelliShanks(P);
}
var FIELD_FIELDS = [
	"create",
	"isValid",
	"is0",
	"neg",
	"inv",
	"sqrt",
	"sqr",
	"eql",
	"add",
	"sub",
	"mul",
	"pow",
	"div",
	"addN",
	"subN",
	"mulN",
	"sqrN"
];
/**
* @param field - Field implementation.
* @returns Validated field. This only checks the arithmetic subset needed by generic helpers; it
*   does not guarantee full runtime-method coverage for serialization, batching, `cmov`, or
*   field-specific extras beyond positive `BYTES` / `BITS`.
* @throws If the field shape or numeric metadata are invalid. {@link Error}
* @example
* Check that a field implementation exposes the operations curve code expects.
*
* ```ts
* import { Field, validateField } from '@noble/curves/abstract/modular.js';
* const Fp = validateField(Field(17n));
* ```
*/
function validateField(field) {
	aobject(field, "field");
	if (typeof field.ORDER !== "bigint") throw new TypeError("param \"ORDER\" is invalid: expected bigint, got " + typeof field.ORDER);
	asafenumber(field.BYTES, "BYTES");
	asafenumber(field.BITS, "BITS");
	for (const name of FIELD_FIELDS) afunction(field[name], "field." + name);
	if (field.BYTES < 1 || field.BITS < 1) throw new Error("invalid field: expected BYTES/BITS > 0");
	if (field.ORDER <= _1n$2) throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
	return field;
}
function FpInvertBatch(Fp, nums, passZero = false) {
	validateField(Fp);
	aarray$1(nums, "nums");
	abool(passZero, "passZero");
	const F = Fp;
	const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
	const multipliedAcc = nums.reduce((acc, num, i) => {
		if (F.is0(num)) return acc;
		inverted[i] = acc;
		return F.mul(acc, num);
	}, F.ONE);
	const invertedAcc = F.inv(multipliedAcc);
	nums.reduceRight((acc, num, i) => {
		if (F.is0(num)) return acc;
		inverted[i] = F.mul(acc, inverted[i]);
		return F.mul(acc, num);
	}, invertedAcc);
	return inverted;
}
/**
* Legendre symbol.
* Legendre constant is used to calculate Legendre symbol (a | p)
* which denotes the value of a^((p-1)/2) (mod p).
*
* * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
* * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
* * (a | p) ≡ 0    if a ≡ 0 (mod p)
* @param Fp - Field implementation.
* @param n - Value to inspect.
* @returns Legendre symbol.
* @throws If the powered value does not match a valid Legendre symbol. {@link Error}
* @example
* Compute the Legendre symbol of one field element.
*
* ```ts
* import { Field, FpLegendre } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const symbol = FpLegendre(Fp, 4n);
* ```
*/
function FpLegendre(Fp, n) {
	validateField(Fp);
	const F = Fp;
	aoddModulus(F.ORDER, "FpLegendre");
	const p1mod2 = (F.ORDER - _1n$2) / _2n$2;
	const powered = F.pow(n, p1mod2);
	const yes = F.eql(powered, F.ONE);
	const zero = F.eql(powered, F.ZERO);
	const no = F.eql(powered, F.neg(F.ONE));
	if (!yes && !zero && !no) throw new Error("invalid Legendre symbol result");
	return yes ? 1 : zero ? 0 : -1;
}
/**
* @param n - Curve order. Callers are expected to pass a positive order.
* @param nBitLength - Optional cached bit length. Callers are expected to pass a positive cached
*   value when overriding the derived bit length.
* @returns Byte and bit lengths.
* @throws If the order or cached bit length is invalid. {@link Error}
* @example
* Measure the encoding sizes needed for one modulus.
*
* ```ts
* nLength(255n);
* ```
*/
function nLength(n, nBitLength) {
	if (nBitLength !== void 0) anumber(nBitLength);
	if (n <= _0n$3) throw new Error("invalid n length: expected positive n, got " + n);
	if (nBitLength !== void 0 && nBitLength < 1) throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
	const bits = bitLen(n);
	if (nBitLength !== void 0 && nBitLength < bits) throw new Error(`invalid n length: expected nBitLength (${nBitLength}) >= bitLen(n) (${bits})`);
	const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
	return {
		nBitLength: _nBitLength,
		nByteLength: Math.ceil(_nBitLength / 8)
	};
}
var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
	ORDER;
	BITS;
	BYTES;
	isLE;
	ZERO = _0n$3;
	ONE = _1n$2;
	_lengths;
	_mod;
	constructor(ORDER, opts = {}) {
		if (ORDER <= _1n$2) throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
		let _nbitLength = void 0;
		this.isLE = false;
		if (opts != null && typeof opts === "object") {
			if (typeof opts.BITS === "number") _nbitLength = opts.BITS;
			if (typeof opts.sqrt === "function") Object.defineProperty(this, "sqrt", {
				value: opts.sqrt,
				enumerable: true
			});
			if (typeof opts.isLE === "boolean") this.isLE = opts.isLE;
			if (opts.allowedLengths) this._lengths = Object.freeze(opts.allowedLengths.slice());
			if (typeof opts.modFromBytes === "boolean") this._mod = opts.modFromBytes;
		}
		const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
		if (nByteLength > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
		this.ORDER = ORDER;
		this.BITS = nBitLength;
		this.BYTES = nByteLength;
		Object.freeze(this);
	}
	create(num) {
		return mod(num, this.ORDER);
	}
	isValid(num) {
		if (typeof num !== "bigint") throw new TypeError("invalid field element: expected bigint, got " + typeof num);
		return _0n$3 <= num && num < this.ORDER;
	}
	is0(num) {
		return num === _0n$3;
	}
	isValidNot0(num) {
		return !this.is0(num) && this.isValid(num);
	}
	isOdd(num) {
		return (num & _1n$2) === _1n$2;
	}
	neg(num) {
		return mod(-num, this.ORDER);
	}
	eql(lhs, rhs) {
		return lhs === rhs;
	}
	sqr(num) {
		return mod(num * num, this.ORDER);
	}
	add(lhs, rhs) {
		return mod(lhs + rhs, this.ORDER);
	}
	sub(lhs, rhs) {
		return mod(lhs - rhs, this.ORDER);
	}
	mul(lhs, rhs) {
		return mod(lhs * rhs, this.ORDER);
	}
	pow(num, power) {
		return pow(num, power, this.ORDER);
	}
	div(lhs, rhs) {
		return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
	}
	sqrN(num) {
		return num * num;
	}
	addN(lhs, rhs) {
		return lhs + rhs;
	}
	subN(lhs, rhs) {
		return lhs - rhs;
	}
	mulN(lhs, rhs) {
		return lhs * rhs;
	}
	inv(num) {
		return invert(num, this.ORDER);
	}
	sqrt(num) {
		let sqrt = FIELD_SQRT.get(this);
		if (!sqrt) FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
		return sqrt(this, num);
	}
	toBytes(num) {
		return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
	}
	fromBytes(bytes, skipValidation = false) {
		abytes(bytes);
		const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
		if (allowedLengths) {
			if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
			const padded = new Uint8Array(BYTES);
			padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
			bytes = padded;
		}
		if (bytes.length !== BYTES) throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
		let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
		if (modFromBytes) scalar = mod(scalar, ORDER);
		if (!skipValidation) {
			if (!this.isValid(scalar)) throw new Error("invalid field element: outside of range 0..ORDER");
		}
		return scalar;
	}
	invertBatch(lst) {
		return FpInvertBatch(this, lst, true);
	}
	cmov(a, b, condition) {
		abool(condition, "condition");
		return condition ? b : a;
	}
};
/**
* Creates a finite field. Major performance optimizations:
* * 1. Denormalized operations like mulN instead of mul.
* * 2. Identical object shape: never add or remove keys.
* * 3. Frozen stable object shape; the lazy sqrt cache lives in a module-level `WeakMap`.
* Fragile: always run a benchmark on a change.
* Security note: operations and low-level serializers like `toBytes` don't check `isValid` for
* all elements for performance and protocol-flexibility reasons; callers are responsible for
* supplying valid elements when they need canonical field behavior.
* This is low-level code, please make sure you know what you're doing.
*
* Note about field properties:
* * CHARACTERISTIC p = prime number, number of elements in main subgroup.
* * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
*
* @param ORDER - field order, probably prime, or could be composite
* @param opts - Field options such as bit length or endianness. See {@link FieldOpts}.
* @returns Frozen field instance with a stable object shape. This wrapper forwards `opts` straight
*   into `_Field`, so it inherits `_Field`'s assumptions about cached sizes and `allowedLengths`.
* @example
* Construct one prime field with optional overrides.
*
* ```ts
* Field(11n);
* ```
*/
function Field(ORDER, opts = {}) {
	Object.freeze(_Field.prototype);
	return new _Field(ORDER, opts);
}
/**
* Returns total number of bytes consumed by the field element.
* For example, 32 bytes for usual 256-bit weierstrass curve.
* @param fieldOrder - number of field elements, usually CURVE.n. Callers are expected to pass an
*   order greater than 1.
* @returns byte length of field
* @throws If the field order is not a bigint. {@link Error}
* @example
* Read the fixed-width byte length of one field.
*
* ```ts
* getFieldBytesLength(255n);
* ```
*/
function getFieldBytesLength(fieldOrder) {
	if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
	if (fieldOrder <= _1n$2) throw new Error("field order must be greater than 1");
	const bitLength = bitLen(fieldOrder - _1n$2);
	return Math.ceil(bitLength / 8);
}
/**
* Returns minimal amount of bytes that can be safely reduced
* by field order.
* Should be 2^-128 for 128-bit curve such as P256.
* This is the reduction / modulo-bias lower bound; higher-level helpers may still impose a larger
* absolute floor for policy reasons.
* @param fieldOrder - number of field elements greater than 1, usually CURVE.n.
* @returns byte length of target hash
* @throws If the field order is invalid. {@link Error}
* @example
* Compute the minimum hash length needed for field reduction.
*
* ```ts
* getMinHashLength(255n);
* ```
*/
function getMinHashLength(fieldOrder) {
	const length = getFieldBytesLength(fieldOrder);
	return length + Math.ceil(length / 2);
}
/**
* "Constant-time" private key generation utility.
* Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
* and convert them into private scalar, with the modulo bias being negligible.
* Needs at least 48 bytes of input for 32-byte private key. The implementation also keeps a hard
* 16-byte minimum even when `getMinHashLength(...)` is smaller, so toy-small inputs do not look
* accidentally acceptable for real scalar derivation.
* See {@link https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/ | Kudelski's modulo-bias guide},
* {@link https://csrc.nist.gov/publications/detail/fips/186/5/final | FIPS 186-5 appendix A.2}, and
* {@link https://www.rfc-editor.org/rfc/rfc9380#section-5 | RFC 9380 section 5}. Unlike RFC 9380
* `hash_to_field`, this helper intentionally maps into the non-zero private-scalar range `1..n-1`.
* @param key - Uniform input bytes.
* @param fieldOrder - Size of subgroup.
* @param isLE - interpret hash bytes as LE num
* @returns valid private scalar
* @throws If the hash length or field order is invalid for scalar reduction. {@link Error}
* @example
* Map hash output into a private scalar range.
*
* ```ts
* mapHashToField(new Uint8Array(48).fill(1), 255n);
* ```
*/
function mapHashToField(key, fieldOrder, isLE = false) {
	abytes(key);
	const len = key.length;
	const fieldLen = getFieldBytesLength(fieldOrder);
	const minLen = Math.max(getMinHashLength(fieldOrder), 16);
	if (len < minLen || len > 1024) throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
	const reduced = mod(isLE ? bytesToNumberLE(key) : bytesToNumberBE(key), fieldOrder - _1n$2) + _1n$2;
	return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/fft.js
/**
* Experimental implementation of NTT / FFT (Fast Fourier Transform) over finite fields.
* API may change at any time. The code has not been audited. Feature requests are welcome.
* @module
*/
function checkU32(n, title = "n") {
	if (typeof n !== "number") throw new TypeError(`wrong u32 integer "${title}": expected number, got type=${typeof n}`);
	if (!Number.isSafeInteger(n) || n < 0 || n > 4294967295) throw new RangeError(`wrong u32 integer "${title}": expected 0..4294967295, got ${n}`);
	return n;
}
/**
* Checks if integer is in form of `1 << X`.
* @param x - Integer to inspect.
* @returns `true` when the value is a power of two.
* @example
* Validate that an FFT size is a power of two.
*
* ```ts
* isPowerOfTwo(8);
* ```
*/
function isPowerOfTwo(x) {
	checkU32(x, "x");
	return (x & x - 1) === 0 && x !== 0;
}
/**
* @param n - Value to reverse.
* @param bits - Number of bits to use.
* @returns Bit-reversed integer.
* @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
* @example
* Reverse the low `bits` bits of one index.
*
* ```ts
* reverseBits(3, 3);
* ```
*/
function reverseBits(n, bits) {
	checkU32(n);
	if (typeof bits !== "number") throw new TypeError("\"bits\" expected number, got type=" + typeof bits);
	if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32) throw new Error(`expected integer 0 <= bits <= 32, got ${bits}`);
	let reversed = 0;
	for (let i = 0; i < bits; i++, n >>>= 1) reversed = reversed << 1 | n & 1;
	return reversed >>> 0;
}
/**
* Similar to `bitLen(x)-1` but much faster for small integers, like indices.
* @param n - Input value.
* @returns Base-2 logarithm. For `n = 0`, the current implementation returns `-1`.
* @example
* Compute the radix-2 stage count for one transform size.
*
* ```ts
* log2(8);
* ```
*/
function log2(n) {
	checkU32(n);
	return 31 - Math.clz32(n);
}
/**
* Moves lowest bit to highest position, which at first step splits
* array on even and odd indices, then it applied again to each part,
* which is core of fft
* @param values - Mutable coefficient array.
* @returns Mutated input array.
* @throws If the array length is not a positive power of two. {@link Error}
* @example
* Reorder coefficients into bit-reversed order in place.
*
* ```ts
* const values = Uint8Array.from([0, 1, 2, 3]);
* bitReversalInplace(values);
* ```
*/
function bitReversalInplace(values) {
	if (!values || typeof values !== "object" || typeof values.length !== "number") throw new TypeError("\"values\" expected array-like, got type=" + typeof values);
	const n = values.length;
	if (!isPowerOfTwo(n)) throw new Error("expected positive power-of-two length, got " + n);
	const bits = log2(n);
	for (let i = 0; i < n; i++) {
		const j = reverseBits(i, bits);
		if (i < j) {
			const tmp = values[i];
			values[i] = values[j];
			values[j] = tmp;
		}
	}
	return values;
}
/**
* Constructs different flavors of FFT. radix2 implementation of low level mutating API. Flavors:
*
* - DIT (Decimation-in-Time): Bottom-Up (leaves to root), Cooley-Tukey
* - DIF (Decimation-in-Frequency): Top-Down (root to leaves), Gentleman-Sande
*
* DIT takes brp input, returns natural output.
* DIF takes natural input, returns brp output.
*
* The output is actually identical. Time / frequence distinction is not meaningful
* for Polynomial multiplication in fields.
* Which means if protocol supports/needs brp output/inputs, then we can skip this step.
*
* Cyclic NTT: Rq = Zq[x]/(x^n-1). butterfly_DIT+loop_DIT OR butterfly_DIF+loop_DIT, roots are omega
* Negacyclic NTT: Rq = Zq[x]/(x^n+1). butterfly_DIT+loop_DIF, at least for mlkem / mldsa
*
* `invertButterflies` indexes roots by a per-butterfly-group counter (`grp`): forward
* (`dit: false`) reads `roots[grp]` with grp = 1..; inverse (`dit: true`) reads `roots[N - grp]`
* with grp restarting at 1. With `skipStages: 0` one table serves both directions (ωᴺ = 1 makes
* the reversed walk self-inverse). With `skipStages > 0` the inverse walk starts at `N - 1`
* instead of continuing where the skipped stages would have left off, so the caller must supply
* a table shaped for that (ML-KEM: `ζ^BitRev7(i)` over all N=256 indices, whose aliased upper
* half is exactly the FIPS 203 inverse walk).
* @param F - Field operations.
* @param coreOpts - FFT configuration. See {@link FFTCoreOpts}:
*   - `N`: Transform size. Must be a power of two.
*   - `roots`: Stage roots for the selected transform size.
*   - `dit`: Whether to run the DIT variant instead of DIF.
*   - `invertButterflies` (optional): Whether to invert butterfly placement.
*   - `skipStages` (optional): Number of initial stages to skip.
*   - `brp` (optional): Whether to apply bit-reversal permutation at the boundary.
* @returns Low-level FFT loop.
* @throws If the FFT options or cached roots are invalid for the requested size. {@link Error}
* @example
* Constructs different flavors of FFT.
*
* ```ts
* import { FFTCore, rootsOfUnity } from '@noble/curves/abstract/fft.js';
* import { Field } from '@noble/curves/abstract/modular.js';
* const Fp = Field(17n);
* const roots = rootsOfUnity(Fp).roots(2);
* const loop = FFTCore(Fp, { N: 4, roots, dit: true });
* const values = loop([1n, 2n, 3n, 4n]);
* ```
*/
var FFTCore = (F, coreOpts) => {
	validateObject(coreOpts, {
		N: "number",
		roots: "object",
		dit: "boolean"
	}, {
		invertButterflies: "boolean",
		skipStages: "number",
		brp: "boolean"
	}, "coreOpts");
	const { N, roots, dit, invertButterflies = false, skipStages = 0, brp = true } = coreOpts;
	checkU32(N, "coreOpts.N");
	const bits = log2(N);
	if (!isPowerOfTwo(N)) throw new Error("FFT: Polynomial size should be power of two");
	checkU32(skipStages, "coreOpts.skipStages");
	const maxSkipStages = bits === 0 ? 0 : bits - 1;
	if (skipStages > maxSkipStages) throw new Error(`FFT: wrong skipStages: expected 0 <= skipStages <= ${maxSkipStages}`);
	if (roots.length !== N) throw new Error(`FFT: wrong roots length: expected ${N}, got ${roots.length}`);
	const isDit = dit !== invertButterflies;
	return (values) => {
		if (values.length !== N) throw new Error("FFT: wrong Polynomial length");
		if (dit && brp) bitReversalInplace(values);
		for (let i = 0, g = 1; i < bits - skipStages; i++) {
			const s = dit ? i + 1 + skipStages : bits - i;
			const m = 1 << s;
			const m2 = m >> 1;
			const stride = N >> s;
			for (let k = 0; k < N; k += m) for (let j = 0, grp = g++; j < m2; j++) {
				const rootPos = invertButterflies ? dit ? N - grp : grp : j * stride;
				const i0 = k + j;
				const i1 = k + j + m2;
				const omega = roots[rootPos];
				const b = values[i1];
				const a = values[i0];
				if (isDit) {
					const t = F.mul(b, omega);
					values[i0] = F.add(a, t);
					values[i1] = F.sub(a, t);
				} else if (invertButterflies) {
					values[i0] = F.add(b, a);
					values[i1] = F.mul(F.sub(b, a), omega);
				} else {
					values[i0] = F.add(a, b);
					values[i1] = F.mul(F.sub(a, b), omega);
				}
			}
		}
		if (!dit && brp) bitReversalInplace(values);
		return values;
	};
};
//#endregion
//#region node_modules/.pnpm/@noble+post-quantum@0.7.1/node_modules/@noble/post-quantum/utils.js
/**
* Utilities for hex, bytearray and number handling.
* @module
*/
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/**
* Asserts that a value is a byte array and optionally checks its length.
* Returns the original reference unchanged on success, and currently also accepts Node `Buffer`
* values through the upstream validator.
* This helper throws on malformed input, so APIs that must return `false` need to guard lengths
* before decoding or before calling it.
* @example
* Validate that a value is a byte array with the expected length.
* ```ts
* abytes(new Uint8Array([1]), 1);
* ```
*/
var abytesDoc = abytes$1;
/**
* Returns cryptographically secure random bytes.
* Requires `globalThis.crypto.getRandomValues` and throws if that API is unavailable.
* `bytesLength` is validated by the upstream helper as a non-negative integer before allocation,
* so negative and fractional values both throw instead of truncating through JS `ToIndex`.
* @param bytesLength - Number of random bytes to generate.
* @returns Fresh random bytes.
* @example
* Generate a fresh random seed.
* ```ts
* const seed = randomBytes(4);
* ```
*/
var randomBytes$1 = randomBytes$3;
function aarray(item, title, inner = () => {}) {
	if (!Array.isArray(item)) throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
	for (let i = 0; i < item.length; i++) inner(item[i], `${title}[${i}]`);
	return item;
}
/**
* Compares two byte arrays in a length-constant way for equal lengths.
* Inputs are validated as byte arrays; unequal lengths return `false` immediately.
* @param a - First byte array.
* @param b - Second byte array.
* @returns Whether both arrays contain the same bytes.
* @example
* Compare two byte arrays for equality.
* ```ts
* equalBytes(new Uint8Array([1]), new Uint8Array([1]));
* ```
*/
function equalBytes$1(a, b) {
	a = abytes$1(a);
	b = abytes$1(b);
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
/**
* Copies bytes into a fresh `Uint8Array`.
* Returns a detached plain `Uint8Array` after validating that the input is real bytes.
* @param bytes - Source bytes.
* @returns Copy of the input bytes.
* @example
* Copy bytes into a fresh array.
* ```ts
* copyBytes(new Uint8Array([1, 2]));
* ```
*/
function copyBytes(bytes) {
	return new Uint8Array(abytes$1(bytes));
}
/**
* Builds a fixed-layout coder from byte lengths and nested coders.
* Raw-length fields decode as zero-copy `subarray(...)` views, and nested coders may preserve that
* aliasing too. Nested coder `encode(...)` results are treated as owned scratch: `splitCoder`
* copies them into the output and then zeroizes them with `fill(0)`. If a nested encoder forwards
* caller-owned bytes, it must do so only after detaching them into a disposable copy.
* @param label - Label used in validation errors.
* @param lengths - Field lengths or nested coders.
* @returns Composite fixed-length coder.
* @example
* Build a fixed-layout coder from byte lengths and nested coders.
* ```ts
* splitCoder('demo', 1, 2).encode([new Uint8Array([1]), new Uint8Array([2, 3])]);
* ```
*/
function splitCoder(label, ...lengths) {
	const getLength = (c) => typeof c === "number" ? c : c.bytesLen;
	const bytesLen = lengths.reduce((sum, a) => sum + getLength(a), 0);
	return {
		bytesLen,
		encode: (bufs) => {
			const res = new Uint8Array(bytesLen);
			for (let i = 0, pos = 0; i < lengths.length; i++) {
				const c = lengths[i];
				const l = getLength(c);
				const b = typeof c === "number" ? bufs[i] : c.encode(bufs[i]);
				abytes$1(b, l, label);
				res.set(b, pos);
				if (typeof c !== "number") b.fill(0);
				pos += l;
			}
			return res;
		},
		decode: (buf) => {
			abytes$1(buf, bytesLen, label);
			const res = [];
			for (const c of lengths) {
				const l = getLength(c);
				const b = buf.subarray(0, l);
				res.push(typeof c === "number" ? b : c.decode(b));
				buf = buf.subarray(l);
			}
			return res;
		}
	};
}
/**
* Builds a fixed-length vector coder from another fixed-length coder.
* Element decoding receives `subarray(...)` views, so aliasing depends on the element coder.
* Element coder `encode(...)` results are treated as owned scratch: `vecCoder` copies them into
* the output and then zeroizes them with `fill(0)`. If an element encoder forwards caller-owned
* bytes, it must do so only after detaching them into a disposable copy. `vecCoder` also trusts
* the `BytesCoderLen` contract: each encoded element must already be exactly `c.bytesLen` bytes.
* @param c - Element coder.
* @param vecLen - Number of elements in the vector.
* @returns Fixed-length vector coder.
* @example
* Build a fixed-length vector coder from another fixed-length coder.
* ```ts
* vecCoder(
*   { bytesLen: 1, encode: (n: number) => Uint8Array.of(n), decode: (b: Uint8Array) => b[0] || 0 },
*   2
* ).encode([1, 2]);
* ```
*/
function vecCoder(c, vecLen) {
	const coder = c;
	const bytesLen = vecLen * coder.bytesLen;
	return {
		bytesLen,
		encode: (u) => {
			const uArr = aarray(u, "u");
			if (uArr.length !== vecLen) throw new RangeError(`vecCoder.encode: wrong length=${uArr.length}. Expected: ${vecLen}`);
			const res = new Uint8Array(bytesLen);
			for (let i = 0, pos = 0; i < uArr.length; i++) {
				const b = coder.encode(uArr[i]);
				res.set(b, pos);
				b.fill(0);
				pos += b.length;
			}
			return res;
		},
		decode: (a) => {
			abytes$1(a, bytesLen);
			const r = [];
			for (let i = 0; i < a.length; i += coder.bytesLen) r.push(coder.decode(a.subarray(i, i + coder.bytesLen)));
			return r;
		}
	};
}
/**
* Overwrites supported typed-array inputs with zeroes in place.
* Accepts direct typed arrays and one-level arrays of them.
* @param list - Typed arrays or one-level lists of typed arrays to clear.
* @example
* Overwrite typed arrays with zeroes.
* ```ts
* const buf = Uint8Array.of(1, 2, 3);
* cleanBytes(buf);
* ```
*/
function cleanBytes(...list) {
	for (const t of list) if (Array.isArray(t)) for (const b of t) b.fill(0);
	else t.fill(0);
}
/**
* Creates a 32-bit mask with the lowest `bits` bits set.
* @param bits - Number of low bits to keep.
* @returns Bit mask with `bits` ones.
* @throws On wrong argument types. {@link TypeError}
* @throws On wrong argument ranges or values. {@link RangeError}
* @example
* Create a low-bit mask for packed-field operations.
* ```ts
* const mask = getMask(4);
* ```
*/
function getMask(bits) {
	anumber$1(bits, "bits");
	if (bits > 32) throw new RangeError("\"bits\" expected <= 32, got " + bits);
	return bits === 32 ? 4294967295 : ~(-1 << bits) >>> 0;
}
//#endregion
//#region node_modules/.pnpm/@noble+post-quantum@0.7.1/node_modules/@noble/post-quantum/_crystals.js
/**
* Internal methods for lattice-based ML-KEM and ML-DSA.
* @module
*/
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/**
* Creates shared modular arithmetic, NTT, and packing helpers for CRYSTALS schemes.
* @param opts - Polynomial and transform parameters. See {@link CrystalOpts}.
* @returns CRYSTALS arithmetic and encoding helpers.
* @example
* Create shared modular arithmetic and NTT helpers for a CRYSTALS parameter set.
* ```ts
* const crystals = genCrystals({
*   newPoly: (n) => new Uint16Array(n),
*   N: 256,
*   Q: 3329,
*   F: 3303,
*   ROOT_OF_UNITY: 17,
*   brvBits: 7,
*   isKyber: true,
* });
* const reduced = crystals.mod(-1);
* ```
*/
var genCrystals = (opts) => {
	const { newPoly, N, Q, F, ROOT_OF_UNITY, brvBits, isKyber } = opts;
	const mod = (a, modulo = Q) => {
		const result = a % modulo | 0;
		return (result >= 0 ? result | 0 : modulo + result | 0) | 0;
	};
	const smod = (a, modulo = Q) => {
		const r = mod(a, modulo) | 0;
		return (r > modulo >> 1 ? r - modulo | 0 : r) | 0;
	};
	function getZettas() {
		const out = newPoly(N);
		for (let i = 0; i < N; i++) {
			const b = reverseBits(i, brvBits);
			const p = BigInt(ROOT_OF_UNITY) ** BigInt(b) % BigInt(Q);
			out[i] = Number(p) | 0;
		}
		return out;
	}
	const nttZetas = getZettas();
	const inv = (_a) => {
		throw new Error("not implemented");
	};
	const field = isKyber ? {
		add: (a, b) => {
			const r = a + b | 0;
			return r >= Q ? r - Q | 0 : r;
		},
		sub: (a, b) => {
			const r = a - b | 0;
			return r < 0 ? r + Q | 0 : r;
		},
		mul: (a, b) => mod((a | 0) * (b | 0)) | 0,
		inv
	} : {
		add: (a, b) => mod((a | 0) + (b | 0)) | 0,
		sub: (a, b) => mod((a | 0) - (b | 0)) | 0,
		mul: (a, b) => mod((a | 0) * (b | 0)) | 0,
		inv
	};
	const nttOpts = {
		N,
		roots: nttZetas,
		invertButterflies: true,
		skipStages: isKyber ? 1 : 0,
		brp: false
	};
	const dif = FFTCore(field, {
		dit: false,
		...nttOpts
	});
	const dit = FFTCore(field, {
		dit: true,
		...nttOpts
	});
	const NTT = {
		encode: (r) => {
			return dif(r);
		},
		decode: (r) => {
			dit(r);
			for (let i = 0; i < r.length; i++) r[i] = mod(F * r[i]);
			return r;
		}
	};
	const bitsCoder = (d, c) => {
		for (let i = 0, bufLen = 0; i < N; i++) {
			bufLen += d;
			if (bufLen > 32) getMask(bufLen);
			bufLen %= 8;
		}
		const mask = getMask(d);
		const bytesLen = d * (N / 8);
		return {
			bytesLen,
			encode: (poly_) => {
				const poly = poly_;
				const r = new Uint8Array(bytesLen);
				for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < poly.length; i++) {
					buf |= (c.encode(poly[i]) & mask) << bufLen;
					bufLen += d;
					for (; bufLen >= 8; bufLen -= 8, buf >>= 8) r[pos++] = buf & 255;
				}
				return r;
			},
			decode: (bytes) => {
				const r = newPoly(N);
				for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < bytes.length; i++) {
					buf |= bytes[i] << bufLen;
					bufLen += 8;
					for (; bufLen >= d; bufLen -= d, buf >>= d) r[pos++] = c.decode(buf & mask);
				}
				return r;
			}
		};
	};
	return {
		mod,
		smod,
		nttZetas,
		NTT: {
			encode: (r) => NTT.encode(r),
			decode: (r) => NTT.decode(r)
		},
		bitsCoder
	};
};
var createXofShake = (shake) => (seed, blockLen) => {
	if (!blockLen) blockLen = shake.blockLen;
	const _seed = new Uint8Array(seed.length + 2);
	_seed.set(seed);
	const seedLen = seed.length;
	const buf = new Uint8Array(blockLen);
	let h = shake.create({});
	let calls = 0;
	let xofs = 0;
	return {
		stats: () => ({
			calls,
			xofs
		}),
		get: (x, y) => {
			_seed[seedLen + 0] = x;
			_seed[seedLen + 1] = y;
			h.destroy();
			h = shake.create({}).update(_seed);
			calls++;
			return () => {
				xofs++;
				return h.xofInto(buf);
			};
		},
		clean: () => {
			h.destroy();
			cleanBytes(buf, _seed);
		}
	};
};
/**
* SHAKE128-based extendable-output reader factory used by ML-KEM.
* `get(x, y)` selects one coordinate pair at a time; calling it again invalidates previously
* returned readers, and each squeeze reuses one mutable internal output buffer.
* @param seed - Seed bytes for the reader.
* @param blockLen - Optional output block length.
* @returns Stateful XOF reader.
* @example
* Build the ML-KEM SHAKE128 matrix expander and read one block.
* ```ts
* import { randomBytes } from '@noble/post-quantum/utils.js';
* import { XOF128 } from '@noble/post-quantum/_crystals.js';
* const reader = XOF128(randomBytes(32));
* const block = reader.get(0, 0)();
* ```
*/
var XOF128 = /* @__PURE__ */ createXofShake(shake128);
//#endregion
//#region node_modules/.pnpm/@noble+post-quantum@0.7.1/node_modules/@noble/post-quantum/ml-kem.js
/**
* ML-KEM: Module Lattice-based Key Encapsulation Mechanism from
* [FIPS-203](https://csrc.nist.gov/pubs/fips/203/ipd). A.k.a. CRYSTALS-Kyber.
*
* Key encapsulation is similar to DH / ECDH (think X25519), with important differences:
* * Unlike in ECDH, we can't verify if it was "Bob" who've sent the shared secret
* * Unlike ECDH, it is probabalistic and relies on quality of randomness (CSPRNG).
* * Decapsulation never throws an error, even when shared secret was
*   encrypted by a different public key. It will just return a different shared secret.
*
* There are some concerns with regards to security: see
* [djb blog](https://blog.cr.yp.to/20231003-countcorrectly.html) and
* [mailing list](https://groups.google.com/a/list.nist.gov/g/pqc-forum/c/W2VOzy0wz_E).
*
* Has similar internals to ML-DSA, but their keys and params are different.
*
* Check out [official site](https://www.pq-crystals.org/kyber/resources.shtml),
* [repo](https://github.com/pq-crystals/kyber),
* [spec](https://datatracker.ietf.org/doc/draft-cfrg-schwabe-kyber/).
* @module
*/
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/** Key encapsulation mechanism interface */
var N = 256;
var Q = 3329;
var crystals = /* @__PURE__ */ genCrystals({
	N,
	Q,
	F: 3303,
	ROOT_OF_UNITY: 17,
	newPoly: (n) => new Uint16Array(n),
	brvBits: 7,
	isKyber: true
});
/** Internal params of ML-KEM versions */
/** Built-in ML-KEM parameter presets keyed by the public export names
* `ml_kem512` / `ml_kem768` / `ml_kem1024`.
* `RBGstrength` is Table 2's required randomness-source strength in bits,
* not a generic security label.
*/
var PARAMS = /* @__PURE__ */ (() => Object.freeze({
	512: Object.freeze({
		N,
		Q,
		K: 2,
		ETA1: 3,
		ETA2: 2,
		du: 10,
		dv: 4,
		RBGstrength: 128
	}),
	768: Object.freeze({
		N,
		Q,
		K: 3,
		ETA1: 2,
		ETA2: 2,
		du: 10,
		dv: 4,
		RBGstrength: 192
	}),
	1024: Object.freeze({
		N,
		Q,
		K: 4,
		ETA1: 2,
		ETA2: 2,
		du: 11,
		dv: 5,
		RBGstrength: 256
	})
}))();
var compress = (d) => {
	if (d >= 12) return {
		encode: (i) => i,
		decode: (i) => i >= Q ? i - Q : i
	};
	const a = 2 ** (d - 1);
	return {
		encode: (i) => ((i << d) + Q / 2) / Q,
		decode: (i) => i * Q + a >>> d
	};
};
var byteCoder = (d) => crystals.bitsCoder(d, d === 12 ? {
	encode: (i) => i,
	decode: (i) => i >= Q ? i - Q : i
} : {
	encode: (i) => i,
	decode: (i) => i
});
var polyCoder = (d) => d === 12 ? byteCoder(12) : crystals.bitsCoder(d, compress(d));
function polyAdd(a_, b_) {
	const a = a_;
	const b = b_;
	for (let i = 0; i < N; i++) {
		const r = a[i] + b[i];
		a[i] = r >= Q ? r - Q : r;
	}
}
function polySub(a_, b_) {
	const a = a_;
	const b = b_;
	for (let i = 0; i < N; i++) {
		const r = a[i] - b[i];
		a[i] = r < 0 ? r + Q : r;
	}
}
function BaseCaseMultiply(a0, a1, b0, b1, zeta) {
	return {
		c0: crystals.mod(crystals.mod(a1 * b1) * zeta + a0 * b0),
		c1: crystals.mod(a0 * b1 + a1 * b0)
	};
}
function MultiplyNTTs(f_, g_) {
	const f = f_;
	const g = g_;
	for (let i = 0; i < N / 2; i++) {
		let z = crystals.nttZetas[64 + (i >> 1)];
		if (i & 1) z = -z;
		const { c0, c1 } = BaseCaseMultiply(f[2 * i + 0], f[2 * i + 1], g[2 * i + 0], g[2 * i + 1], z);
		f[2 * i + 0] = c0;
		f[2 * i + 1] = c1;
	}
	return f;
}
function SampleNTT(xof_) {
	const xof = xof_;
	const r = new Uint16Array(N);
	for (let j = 0; j < N;) {
		const b = xof();
		if (b.length % 3) throw new Error("SampleNTT: unaligned block");
		for (let i = 0; j < N && i + 3 <= b.length; i += 3) {
			const d1 = (b[i + 0] >> 0 | b[i + 1] << 8) & 4095;
			const d2 = (b[i + 1] >> 4 | b[i + 2] << 4) & 4095;
			if (d1 < Q) r[j++] = d1;
			if (j < N && d2 < Q) r[j++] = d2;
		}
	}
	return r;
}
var sampleCBDBytes = (buf, eta) => {
	const r = new Uint16Array(N);
	const b32 = u32(buf);
	swap32IfBE(b32);
	let len = 0;
	for (let i = 0, p = 0, bb = 0, t0 = 0; i < b32.length; i++) {
		let b = b32[i];
		for (let j = 0; j < 32; j++) {
			bb += b & 1;
			b >>= 1;
			len += 1;
			if (len === eta) {
				t0 = bb;
				bb = 0;
			} else if (len === 2 * eta) {
				r[p++] = crystals.mod(t0 - bb);
				bb = 0;
				len = 0;
			}
		}
	}
	swap32IfBE(b32);
	if (len) throw new Error(`sampleCBD: leftover bits: ${len}`);
	return r;
};
function sampleCBD(PRF_, seed, nonce, eta) {
	return sampleCBDBytes(PRF_(eta * N / 4, seed, nonce), eta);
}
var genKPKE = (opts_) => {
	const { K, PRF, XOF, HASH512, ETA1, ETA2, du, dv } = opts_;
	const poly1 = polyCoder(1);
	const polyV = polyCoder(dv);
	const polyU = polyCoder(du);
	const publicCoder = splitCoder("publicKey", vecCoder(polyCoder(12), K), 32);
	const secretCoder = vecCoder(polyCoder(12), K);
	const cipherCoder = splitCoder("ciphertext", vecCoder(polyU, K), polyV);
	const seedCoder = splitCoder("seed", 32, 32);
	const encryptCore = (tHat, getA, msg, seed) => {
		const rHat = [];
		for (let i = 0; i < K; i++) rHat.push(crystals.NTT.encode(sampleCBD(PRF, seed, i, ETA1)));
		const tmp2 = new Uint16Array(N);
		const u = [];
		for (let i = 0; i < K; i++) {
			const e1 = sampleCBD(PRF, seed, K + i, ETA2);
			const tmp = new Uint16Array(N);
			for (let j = 0; j < K; j++) polyAdd(tmp, MultiplyNTTs(getA(i, j), rHat[j]));
			polyAdd(e1, crystals.NTT.decode(tmp));
			u.push(e1);
			polyAdd(tmp2, MultiplyNTTs(tHat[i], rHat[i]));
			cleanBytes(tmp);
		}
		const e2 = sampleCBD(PRF, seed, 2 * K, ETA2);
		polyAdd(e2, crystals.NTT.decode(tmp2));
		const v = poly1.decode(msg);
		polyAdd(v, e2);
		cleanBytes(tHat, rHat, tmp2, e2);
		return cipherCoder.encode([u, v]);
	};
	return {
		secretCoder,
		lengths: {
			secretKey: secretCoder.bytesLen,
			publicKey: publicCoder.bytesLen,
			cipherText: cipherCoder.bytesLen
		},
		keygen: (seed) => {
			abytesDoc(seed, 32, "seed");
			const seedDst = /* @__PURE__ */ new Uint8Array(33);
			seedDst.set(seed);
			seedDst[32] = K;
			const seedHash = HASH512(seedDst);
			const [rho, sigma] = seedCoder.decode(seedHash);
			const sHat = [];
			const tHat = [];
			for (let i = 0; i < K; i++) sHat.push(crystals.NTT.encode(sampleCBD(PRF, sigma, i, ETA1)));
			const x = XOF(rho);
			for (let i = 0; i < K; i++) {
				const e = crystals.NTT.encode(sampleCBD(PRF, sigma, K + i, ETA1));
				for (let j = 0; j < K; j++) polyAdd(e, MultiplyNTTs(SampleNTT(x.get(j, i)), sHat[j]));
				tHat.push(e);
			}
			x.clean();
			const res = {
				publicKey: publicCoder.encode([tHat, rho]),
				secretKey: secretCoder.encode(sHat)
			};
			cleanBytes(rho, sigma, sHat, tHat, seedDst, seedHash);
			return res;
		},
		encrypt: (publicKey, msg, seed) => {
			const [tHat, rho] = publicCoder.decode(publicKey);
			const x = XOF(rho);
			const res = encryptCore(tHat, (i, j) => SampleNTT(x.get(i, j)), msg, seed);
			x.clean();
			return res;
		},
		prepare: (publicKey) => {
			const [tHat, rho] = publicCoder.decode(publicKey);
			const x = XOF(rho);
			const A = [];
			for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) A.push(SampleNTT(x.get(i, j)));
			x.clean();
			return {
				encrypt: (msg, seed) => encryptCore(tHat.map((p) => p.slice()), (i, j) => A[i * K + j].slice(), msg, seed),
				clean: () => cleanBytes(tHat, A)
			};
		},
		decrypt: (cipherText, privateKey) => {
			const [u, v] = cipherCoder.decode(cipherText);
			const sk = secretCoder.decode(privateKey);
			const tmp = new Uint16Array(N);
			for (let i = 0; i < K; i++) polyAdd(tmp, MultiplyNTTs(sk[i], crystals.NTT.encode(u[i])));
			polySub(v, crystals.NTT.decode(tmp));
			const res = poly1.encode(v);
			cleanBytes(tmp, sk, u, v);
			return res;
		}
	};
};
/**
* Public ML-KEM wrapper over the internal K-PKE subroutine.
* `keygen(seed)` and `encapsulate(publicKey, msg)` are deterministic/test-oriented hooks that map
* more directly to Algorithms 16-17 than to the pure no-input / random-internal Algorithms 19-20.
* `encapsulate`'s optional `msg` is the 32-byte message randomness `m` of Algorithm 17, the
* pre-image the shared secret is derived from, NOT a plaintext to encrypt: ML-KEM is a key
* encapsulation mechanism, not a cipher. Omit it to draw fresh randomness; pass it only to
* reproduce a known-answer vector, and only as 32 uniformly random bytes, since a low-entropy or
* reused value makes the shared secret predictable. The same holds for `keygen`'s optional `seed`.
* decapsulate() tries to follow the Algorithms 18/21 implicit-reject structure as closely as
* practical here by re-encrypting, comparing ciphertexts, returning `Khat` on match or `Kbar` on
* mismatch, and zeroizing the non-returned shared-secret candidate; JS/JIT still provides no
* constant-time guarantees for that path.
*/
function createKyber(opts) {
	const rawOpts = opts;
	const KPKE = genKPKE(rawOpts);
	const { HASH256, HASH512, KDF } = rawOpts;
	const { secretCoder: KPKESecretCoder, lengths } = KPKE;
	const secretCoder = splitCoder("secretKey", lengths.secretKey, lengths.publicKey, 32, 32);
	const msgLen = 32;
	const seedLen = 64;
	const validateModulus = (publicKey, fn) => {
		const eke = publicKey.subarray(0, 384 * rawOpts.K);
		const ek = KPKESecretCoder.encode(KPKESecretCoder.decode(copyBytes(eke)));
		const ok = equalBytes$1(ek, eke);
		cleanBytes(ek);
		if (!ok) throw new Error(`ML-KEM.${fn}: wrong publicKey modulus`);
	};
	const kemLengths = Object.freeze({
		...lengths,
		seed: 64,
		msg: msgLen,
		msgRand: msgLen,
		secretKey: secretCoder.bytesLen
	});
	return Object.freeze({
		info: Object.freeze({ type: "ml-kem" }),
		lengths: kemLengths,
		keygen: (seed) => {
			const ownSeed = seed === void 0;
			const s = ownSeed ? randomBytes$1(seedLen) : seed;
			let sk;
			let publicKeyHash;
			try {
				abytesDoc(s, seedLen, "seed");
				const keys = KPKE.keygen(s.subarray(0, 32));
				const publicKey = keys.publicKey;
				sk = keys.secretKey;
				publicKeyHash = HASH256(publicKey);
				return {
					publicKey,
					secretKey: secretCoder.encode([
						sk,
						publicKey,
						publicKeyHash,
						s.subarray(32)
					])
				};
			} finally {
				if (sk !== void 0) cleanBytes(sk);
				if (publicKeyHash !== void 0) cleanBytes(publicKeyHash);
				if (ownSeed) cleanBytes(s);
			}
		},
		getPublicKey: (secretKey) => {
			const [_sk, publicKey, _publicKeyHash, _z] = secretCoder.decode(secretKey);
			return Uint8Array.from(publicKey);
		},
		encapsulate: (publicKey, msg) => {
			const ownMsg = msg === void 0;
			const m = ownMsg ? randomBytes$1(msgLen) : msg;
			let kr;
			try {
				abytesDoc(publicKey, lengths.publicKey, "publicKey");
				abytesDoc(m, msgLen, "message");
				validateModulus(publicKey, "encapsulate");
				kr = HASH512.create().update(m).update(HASH256(publicKey)).digest();
				return {
					cipherText: KPKE.encrypt(publicKey, m, kr.subarray(32, 64)),
					sharedSecret: kr.subarray(0, 32)
				};
			} finally {
				if (kr !== void 0) cleanBytes(kr.subarray(32));
				if (ownMsg) cleanBytes(m);
			}
		},
		decapsulate: (cipherText, secretKey) => {
			abytesDoc(secretKey, secretCoder.bytesLen, "secretKey");
			abytesDoc(cipherText, lengths.cipherText, "cipherText");
			const k768 = secretCoder.bytesLen - 96;
			const start = k768 + 32;
			if (!equalBytes$1(HASH256(secretKey.subarray(k768 / 2, start)), secretKey.subarray(start, start + 32))) throw new Error("invalid secretKey: hash check failed");
			const [sk, publicKey, publicKeyHash, z] = secretCoder.decode(secretKey);
			const msg = KPKE.decrypt(cipherText, sk);
			const kr = HASH512.create().update(msg).update(publicKeyHash).digest();
			const Khat = kr.subarray(0, 32);
			const cipherText2 = KPKE.encrypt(publicKey, msg, kr.subarray(32, 64));
			const isValid = equalBytes$1(cipherText, cipherText2);
			const Kbar = KDF.create({ dkLen: 32 }).update(z).update(cipherText).digest();
			cleanBytes(msg, cipherText2, kr.subarray(32), !isValid ? Khat : Kbar);
			return isValid ? Khat : Kbar;
		},
		/**
		* Experimental prototype: pre-expand a public key so repeated encapsulate/decapsulate
		* against the same key skip re-validation, H(ek), t̂ decoding and the K² SampleNTT
		* XOF expansions of Â. Only public data is cached; see {@link KEMPrepared}.
		*/
		prepare: (publicKey) => {
			abytesDoc(publicKey, lengths.publicKey, "publicKey");
			validateModulus(publicKey, "prepare");
			const ek = copyBytes(publicKey);
			const publicKeyHash = HASH256(ek);
			const cached = KPKE.prepare(ek);
			return Object.freeze({
				publicKey: ek,
				encapsulate: (msg) => {
					const ownMsg = msg === void 0;
					const m = ownMsg ? randomBytes$1(msgLen) : msg;
					let kr;
					try {
						abytesDoc(m, msgLen, "message");
						kr = HASH512.create().update(m).update(publicKeyHash).digest();
						return {
							cipherText: cached.encrypt(m, kr.subarray(32, 64)),
							sharedSecret: kr.subarray(0, 32)
						};
					} finally {
						if (kr !== void 0) cleanBytes(kr.subarray(32));
						if (ownMsg) cleanBytes(m);
					}
				},
				decapsulate: (cipherText, secretKey) => {
					abytesDoc(secretKey, secretCoder.bytesLen, "secretKey");
					abytesDoc(cipherText, lengths.cipherText, "cipherText");
					const [sk, ekEmbedded, storedHash, z] = secretCoder.decode(secretKey);
					if (!equalBytes$1(ekEmbedded, ek) || !equalBytes$1(storedHash, publicKeyHash)) throw new Error("ML-KEM.decapsulate: secretKey does not match prepared publicKey");
					const msg = KPKE.decrypt(cipherText, sk);
					const kr = HASH512.create().update(msg).update(publicKeyHash).digest();
					const Khat = kr.subarray(0, 32);
					const cipherText2 = cached.encrypt(msg, kr.subarray(32, 64));
					const isValid = equalBytes$1(cipherText, cipherText2);
					const Kbar = KDF.create({ dkLen: 32 }).update(z).update(cipherText).digest();
					cleanBytes(msg, cipherText2, kr.subarray(32), !isValid ? Khat : Kbar);
					return isValid ? Khat : Kbar;
				},
				clean: cached.clean
			});
		}
	});
}
function shakePRF(dkLen, key, nonce) {
	return shake256.create({ dkLen }).update(key).update(new Uint8Array([nonce])).digest();
}
var opts = /* @__PURE__ */ (() => ({
	HASH256: sha3_256,
	HASH512: sha3_512,
	KDF: shake256,
	XOF: XOF128,
	PRF: shakePRF
}))();
var mk = (params) => createKyber({
	...opts,
	...params
});
/**
* ML-KEM-768: Table 2 row `k=3, η1=2, η2=2, du=10, dv=4`; Table 3 sizes `1184/2400/1088/32`.
* The ASD lifecycle note here is external policy guidance, not a FIPS 203 requirement.
*/
var ml_kem768 = /* @__PURE__ */ (() => mk(PARAMS[768]))();
//#endregion
//#region packages/core/src/crypto/primitives.ts
var subtle = crypto.subtle;
async function sha256$1(data) {
	return new Uint8Array(await subtle.digest("SHA-256", bytesOf(data)));
}
/** HKDF-SHA-256. `salt` may be empty (treated as a zero-filled salt per RFC 5869). */
async function hkdf(ikm, salt, info, length = 32) {
	const key = await subtle.importKey("raw", bytesOf(ikm), "HKDF", false, ["deriveBits"]);
	const bits = await subtle.deriveBits({
		name: "HKDF",
		hash: "SHA-256",
		salt: bytesOf(salt),
		info: bytesOf(info)
	}, key, length * 8);
	return new Uint8Array(bits);
}
async function hmacSha256(key, data) {
	const k = await subtle.importKey("raw", bytesOf(key), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	return new Uint8Array(await subtle.sign("HMAC", k, bytesOf(data)));
}
/** Verifies via WebCrypto, which compares in constant time. */
async function verifyHmacSha256(key, data, mac) {
	const k = await subtle.importKey("raw", bytesOf(key), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["verify"]);
	return subtle.verify("HMAC", k, bytesOf(mac), bytesOf(data));
}
function importAesKey(raw) {
	return subtle.importKey("raw", bytesOf(raw), {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
}
/** Narrow a Uint8Array to the ArrayBuffer-backed type WebCrypto wants (copies only if needed). */
function bytesOf(data) {
	return data.buffer instanceof ArrayBuffer ? data : new Uint8Array(data);
}
//#endregion
//#region packages/core/src/crypto/handshake.ts
/**
* Hybrid key exchange run over the DataChannel before any chat:
*
*   I → R  pq.hello   { pk }                     ML-KEM-768 public key (1184 B)
*   R → I  pq.reply   { ct, confirm }            ciphertext (1088 B) + responder MAC
*   I → R  pq.confirm { confirm }                initiator MAC
*
* The master key mixes the URL-fragment key `K_C` and the ML-KEM shared secret `SQ`:
*
*   T = SHA-256("poof/v1/transcript" ‖ len‖roomId ‖ len‖initiatorId ‖ len‖responderId ‖ len‖pk ‖ len‖ct)
*   K = HKDF-SHA256(ikm = K_C ‖ SQ, salt = "poof/v1/salt", info = "poof/v1/master" ‖ T)
*
* Concatenating both secrets into the IKM is the standard hybrid combiner: K stays secret as long
* as EITHER K_C or SQ does. From K we derive independent keys: one per direction, a confirmation
* key and a safety-code key.
*
* What this does and does not give:
*  - Someone WITHOUT K_C (e.g. the signaling server, a network attacker) cannot derive K.
*  - Someone WITH K_C (anyone who holds the link) can run two independent handshakes, one per
*    leg, and every check passes on each leg. Transcript binding does not stop that; only the
*    out-of-band safety code (`sas`, which differs between the two legs) does.
*/
var LABELS = {
	transcript: "poof/v1/transcript",
	salt: "poof/v1/salt",
	master: "poof/v1/master",
	confirm: "poof/v1/confirm",
	i2r: "poof/v1/key/initiator-to-responder",
	r2i: "poof/v1/key/responder-to-initiator",
	sas: "poof/v1/sas",
	initiatorMac: "poof/v1/mac/initiator",
	responderMac: "poof/v1/mac/responder"
};
var EMPTY = /* @__PURE__ */ new Uint8Array(0);
async function transcript(roomId, pair, pk, ct) {
	return sha256$1(concat(utf8(LABELS.transcript), lengthPrefixed(utf8(roomId)), lengthPrefixed(utf8(pair.initiator)), lengthPrefixed(utf8(pair.responder)), lengthPrefixed(pk), lengthPrefixed(ct)));
}
async function derive(roomKey, sq, transcriptHash) {
	const master = await hkdf(concat(roomKey, sq), utf8(LABELS.salt), concat(utf8(LABELS.master), transcriptHash));
	const [confirmKey, i2r, r2i, sas] = await Promise.all([
		hkdf(master, EMPTY, utf8(LABELS.confirm)),
		hkdf(master, EMPTY, utf8(LABELS.i2r)),
		hkdf(master, EMPTY, utf8(LABELS.r2i)),
		hkdf(master, EMPTY, utf8(LABELS.sas))
	]);
	const [i2rKey, r2iKey] = await Promise.all([importAesKey(i2r), importAesKey(r2i)]);
	master.fill(0);
	i2r.fill(0);
	r2i.fill(0);
	return {
		keysForInitiator: {
			sendKey: i2rKey,
			recvKey: r2iKey,
			sas
		},
		keysForResponder: {
			sendKey: r2iKey,
			recvKey: i2rKey,
			sas
		},
		confirmKey,
		transcriptHash
	};
}
var macInput = (label, t) => concat(utf8(label), t);
function decodeField(value, expectedLength, what) {
	let data;
	try {
		data = fromBase64(value);
	} catch {
		throw new PoofError("pq_failed", `${what} is not valid base64`);
	}
	if (data.length !== expectedLength) throw new PoofError("pq_failed", `${what} has the wrong length`);
	return data;
}
var MAC_BYTES = 32;
var InitiatorHandshake = class {
	roomId;
	roomKey;
	pair;
	secretKey = null;
	publicKey = null;
	constructor(roomId, roomKey, pair) {
		this.roomId = roomId;
		this.roomKey = roomKey;
		this.pair = pair;
	}
	/** Step 1: generate the ML-KEM keypair, return the `pq.hello` to send. */
	start() {
		const { publicKey, secretKey } = ml_kem768.keygen();
		this.publicKey = bytes(publicKey);
		this.secretKey = bytes(secretKey);
		return {
			v: 1,
			t: "pq.hello",
			pk: toBase64(this.publicKey)
		};
	}
	/** Step 3: verify the responder's MAC, return our `pq.confirm` and the session keys. */
	async handleReply(msg) {
		const { secretKey, publicKey } = this;
		if (!secretKey || !publicKey) throw new PoofError("pq_failed", "Handshake not started");
		this.secretKey = null;
		const ct = decodeField(msg.ct, ml_kem768.lengths.cipherText ?? 1088, "ciphertext");
		const responderMac = decodeField(msg.confirm, MAC_BYTES, "confirmation");
		let sq;
		try {
			sq = bytes(ml_kem768.decapsulate(ct, secretKey));
		} catch {
			throw new PoofError("pq_failed", "Decapsulation failed");
		} finally {
			secretKey.fill(0);
		}
		const t = await transcript(this.roomId, this.pair, publicKey, ct);
		const d = await derive(this.roomKey, sq, t);
		sq.fill(0);
		if (!await verifyHmacSha256(d.confirmKey, macInput(LABELS.responderMac, t), responderMac)) throw new PoofError("pq_failed", "Responder confirmation did not verify");
		const mac = await hmacSha256(d.confirmKey, macInput(LABELS.initiatorMac, t));
		d.confirmKey.fill(0);
		return {
			confirm: {
				v: 1,
				t: "pq.confirm",
				confirm: toBase64(mac)
			},
			keys: d.keysForInitiator
		};
	}
	/** Drop secrets if the handshake is abandoned. */
	dispose() {
		this.secretKey?.fill(0);
		this.secretKey = null;
	}
};
var ResponderHandshake = class {
	roomId;
	roomKey;
	pair;
	pending = null;
	constructor(roomId, roomKey, pair) {
		this.roomId = roomId;
		this.roomKey = roomKey;
		this.pair = pair;
	}
	/** Step 2: encapsulate to the initiator's public key, return the `pq.reply` to send. */
	async handleHello(msg) {
		if (this.pending) throw new PoofError("pq_failed", "Unexpected second pq.hello");
		const pk = decodeField(msg.pk, ml_kem768.lengths.publicKey ?? 1184, "public key");
		let ct;
		let sq;
		try {
			const out = ml_kem768.encapsulate(pk);
			ct = bytes(out.cipherText);
			sq = bytes(out.sharedSecret);
		} catch {
			throw new PoofError("pq_failed", "Encapsulation failed");
		}
		const t = await transcript(this.roomId, this.pair, pk, ct);
		const d = await derive(this.roomKey, sq, t);
		sq.fill(0);
		const mac = await hmacSha256(d.confirmKey, macInput(LABELS.responderMac, t));
		this.pending = {
			confirmKey: d.confirmKey,
			transcriptHash: t,
			keys: d.keysForResponder
		};
		return {
			v: 1,
			t: "pq.reply",
			ct: toBase64(ct),
			confirm: toBase64(mac)
		};
	}
	/** Step 4: verify the initiator's MAC; on success the keys are ready. */
	async handleConfirm(msg) {
		const pending = this.pending;
		if (!pending) throw new PoofError("pq_failed", "Unexpected pq.confirm");
		this.pending = null;
		const mac = decodeField(msg.confirm, MAC_BYTES, "confirmation");
		const ok = await verifyHmacSha256(pending.confirmKey, macInput(LABELS.initiatorMac, pending.transcriptHash), mac);
		pending.confirmKey.fill(0);
		if (!ok) throw new PoofError("pq_failed", "Initiator confirmation did not verify");
		return pending.keys;
	}
	dispose() {
		this.pending?.confirmKey.fill(0);
		this.pending = null;
	}
};
//#endregion
//#region packages/core/src/crypto/frames.ts
/**
* Binary AEAD frames for everything sent after the key exchange.
*
*   offset size  field
*   0      1     version (0x01)
*   1      1     channel (0x01 ctl, 0x02 files)
*   2      1     type
*   3      8     seq (uint64 BE, per channel per direction, starts at 0, strictly +1)
*   11     …     AES-256-GCM(key = directional key, nonce = channel ‖ 000 ‖ seq, aad = bytes[0..11])
*
* Separate keys per direction + per-direction counters mean a frame can't be reflected back at its
* sender, nonces never repeat, and a dropped/replayed/reordered frame is detected. DataChannels are
* ordered and reliable, so any seq mismatch means tampering and terminates the session.
*/
var VALID_CHANNELS = new Set(Object.values(Channel));
var VALID_TYPES = new Set(Object.values(FrameType));
/** Which frame types may travel on which channel. */
var TYPES_BY_CHANNEL = {
	[Channel.Ctl]: /* @__PURE__ */ new Set([
		FrameType.Chat,
		FrameType.Ctl,
		FrameType.Ai
	]),
	[Channel.Files]: /* @__PURE__ */ new Set([
		FrameType.FileMeta,
		FrameType.FileChunk,
		FrameType.FileEnd,
		FrameType.FileAbort,
		FrameType.FileAck
	])
};
function header(channel, type, seq) {
	return concat(new Uint8Array([
		FRAME.VERSION,
		channel,
		type
	]), u64be(seq));
}
function nonce(channel, seq) {
	return concat(new Uint8Array([
		channel,
		0,
		0,
		0
	]), u64be(seq));
}
var FrameCodec = class {
	keys;
	sendSeq = /* @__PURE__ */ new Map();
	recvSeq = /* @__PURE__ */ new Map();
	/** Serialises sealing so frames hit the wire in the order they were requested. */
	sendChain = Promise.resolve();
	constructor(keys) {
		this.keys = keys;
	}
	/**
	* Encrypt a frame. Calls are serialised: awaiting `seal()` results in call order and sending each
	* immediately preserves the sequence the receiver expects.
	*/
	seal(channel, type, plaintext) {
		const run = async () => {
			const seq = this.sendSeq.get(channel) ?? 0n;
			this.sendSeq.set(channel, seq + 1n);
			const head = header(channel, type, seq);
			const ciphertext = await crypto.subtle.encrypt({
				name: "AES-GCM",
				iv: nonce(channel, seq),
				additionalData: head,
				tagLength: 128
			}, this.keys.sendKey, plaintext);
			return concat(head, new Uint8Array(ciphertext));
		};
		const result = this.sendChain.then(run, run);
		this.sendChain = result.catch(() => void 0);
		return result;
	}
	/**
	* Decrypt and authenticate a frame. The sequence check happens synchronously, before any await, so
	* concurrent calls can't race the counter; callers should still feed frames in arrival order.
	*/
	async open(data) {
		if (data.length < FRAME.HEADER_BYTES + FRAME.TAG_BYTES) throw new PoofError("frame_invalid", "Frame too short");
		const [version, channel, type] = [
			data[0],
			data[1],
			data[2]
		];
		if (version !== FRAME.VERSION) throw new PoofError("frame_invalid", "Unsupported frame version");
		if (!VALID_CHANNELS.has(channel) || !VALID_TYPES.has(type)) throw new PoofError("frame_invalid", "Unknown channel or type");
		if (!TYPES_BY_CHANNEL[channel]?.has(type)) throw new PoofError("frame_invalid", "Type not allowed on this channel");
		const seq = readU64be(data, 3);
		const expected = this.recvSeq.get(channel) ?? 0n;
		if (seq !== expected) throw new PoofError("frame_out_of_order", `Expected seq ${expected}, got ${seq}`);
		this.recvSeq.set(channel, expected + 1n);
		try {
			const plaintext = await crypto.subtle.decrypt({
				name: "AES-GCM",
				iv: nonce(channel, seq),
				additionalData: data.slice(0, FRAME.HEADER_BYTES),
				tagLength: 128
			}, this.keys.recvKey, data.slice(FRAME.HEADER_BYTES));
			return {
				channel,
				type,
				plaintext: new Uint8Array(plaintext)
			};
		} catch {
			throw new PoofError("decrypt_failed", "Frame failed authentication");
		}
	}
};
//#endregion
//#region packages/core/src/signaling.ts
/** Real browser WebSocket behind the structural interface. The one cast lives here, at the boundary. */
var browserSocketFactory = (url) => new WebSocket(url);
var WS_OPEN = 1;
var DEFAULT_BACKOFF_MS = [
	500,
	1e3,
	2e3,
	4e3,
	5e3
];
/**
* Signaling WebSocket with the two behaviours the room protocol needs:
*  - an application heartbeat: a literal "ping" every interval; if nothing arrives back within the
*    timeout the socket is treated as dead (mobile browsers can lose a socket without a close
*    event) and replaced. The Durable Object answers "pong" without waking up, so this is free.
*  - reconnection with backoff using the SAME peerId (it's in the URL), which the server treats as
*    "replace my old socket", so a returning client never pairs with its own zombie.
*/
var SignalingClient = class {
	opts;
	socket = null;
	attempt = 0;
	closedByUs = false;
	reconnectTimer = null;
	pingTimer = null;
	pongTimer = null;
	constructor(opts) {
		this.opts = opts;
	}
	connect() {
		if (this.closedByUs) return;
		this.opts.onStatus?.(this.attempt === 0 ? "connecting" : "reconnecting");
		const socket = this.opts.createSocket(this.opts.url);
		this.socket = socket;
		socket.onopen = () => {
			if (socket !== this.socket) return;
			this.attempt = 0;
			this.opts.onStatus?.("open");
			this.startHeartbeat(socket);
		};
		socket.onmessage = (event) => {
			if (socket !== this.socket) return;
			this.onData(event.data);
		};
		socket.onclose = (event) => {
			if (socket !== this.socket) return;
			this.handleDown(socket, event.code, event.reason);
		};
		socket.onerror = () => {};
	}
	/** Returns false if the socket isn't open (the message is NOT queued). */
	send(msg) {
		const socket = this.socket;
		if (!socket || socket.readyState !== 1) return false;
		try {
			socket.send(JSON.stringify(msg));
			return true;
		} catch {
			return false;
		}
	}
	get isOpen() {
		return this.socket?.readyState === 1;
	}
	close() {
		this.closedByUs = true;
		this.stopHeartbeat();
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
		const socket = this.socket;
		this.socket = null;
		if (socket) {
			socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
			try {
				socket.close(1e3, "client_closed");
			} catch {}
		}
		this.opts.onStatus?.("closed");
	}
	onData(data) {
		this.clearPongTimer();
		if (typeof data !== "string" || data === "pong") return;
		let json;
		try {
			json = JSON.parse(data);
		} catch {
			return;
		}
		const parsed = serverMessageSchema.safeParse(json);
		if (!parsed.success || parsed.data.v !== 1) return;
		this.opts.onMessage(parsed.data);
	}
	startHeartbeat(socket) {
		this.stopHeartbeat();
		const interval = this.opts.pingIntervalMs ?? 2e4;
		const timeout = this.opts.pongTimeoutMs ?? 8e3;
		this.pingTimer = setInterval(() => {
			if (socket !== this.socket) return;
			try {
				socket.send(WS_PING);
			} catch {
				this.handleDown(socket, 4999, "send_failed");
				return;
			}
			this.clearPongTimer();
			this.pongTimer = setTimeout(() => {
				if (socket === this.socket) this.handleDown(socket, 4998, "pong_timeout");
			}, timeout);
		}, interval);
	}
	stopHeartbeat() {
		if (this.pingTimer) clearInterval(this.pingTimer);
		this.pingTimer = null;
		this.clearPongTimer();
	}
	clearPongTimer() {
		if (this.pongTimer) clearTimeout(this.pongTimer);
		this.pongTimer = null;
	}
	/** The socket closed (or was declared dead). Reconnect unless the server said not to. */
	handleDown(socket, code, reason) {
		if (this.closedByUs || socket !== this.socket) return;
		this.stopHeartbeat();
		this.socket = null;
		socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
		try {
			socket.close(1e3, "replaced_by_client");
		} catch {}
		if (TERMINAL_CLOSE_CODES.has(code)) {
			this.closedByUs = true;
			this.opts.onStatus?.("closed");
			this.opts.onTerminalClose(code, reason);
			return;
		}
		const backoff = this.opts.backoffMs ?? DEFAULT_BACKOFF_MS;
		const delay = backoff[Math.min(this.attempt, backoff.length - 1)] ?? 1e3;
		this.attempt += 1;
		this.opts.onStatus?.("reconnecting");
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, delay);
	}
};
//#endregion
//#region packages/core/src/peer.ts
/** Real RTCPeerConnection behind the structural interface. The one cast lives here, at the boundary. */
var browserRtcFactory = (config) => new RTCPeerConnection(config);
function describe(report) {
	const type = report?.candidateType;
	return typeof type === "string" ? type : void 0;
}
/** One WebRTC connection with two ordered, reliable DataChannels: control/chat and files. */
var PeerLink = class {
	opts;
	pc;
	channels = {
		ctl: null,
		files: null
	};
	pendingCandidates = [];
	candidateTypes = /* @__PURE__ */ new Set();
	drainWaiters = {
		ctl: /* @__PURE__ */ new Set(),
		files: /* @__PURE__ */ new Set()
	};
	closed = false;
	failed = false;
	constructor(opts) {
		this.opts = opts;
		const pc = opts.createPeerConnection({ iceServers: opts.iceServers });
		this.pc = pc;
		pc.onicecandidate = (event) => {
			if (this.closed) return;
			const c = event.candidate;
			if (!c) {
				this.opts.callbacks.onIceGatheringComplete(this.candidateTypes);
				return;
			}
			const match = / typ (\w+)/.exec(c.candidate);
			if (match?.[1]) this.candidateTypes.add(match[1]);
			this.opts.callbacks.onSignal({
				kind: "candidate",
				candidate: {
					candidate: c.candidate,
					sdpMid: c.sdpMid,
					sdpMLineIndex: c.sdpMLineIndex,
					usernameFragment: c.usernameFragment
				}
			});
		};
		pc.onconnectionstatechange = () => {
			if (pc.connectionState === "failed" || pc.connectionState === "closed") this.fail();
		};
		pc.ondatachannel = (event) => {
			if (event.channel.label === CHANNEL_LABEL.Ctl) this.attach("ctl", event.channel);
			else if (event.channel.label === CHANNEL_LABEL.Files) this.attach("files", event.channel);
		};
	}
	/** Initiator: create both channels and the offer. Responder: nothing to do until an offer arrives. */
	async start() {
		if (this.opts.role !== "initiator") return;
		this.attach("ctl", this.pc.createDataChannel(CHANNEL_LABEL.Ctl, { ordered: true }));
		this.attach("files", this.pc.createDataChannel(CHANNEL_LABEL.Files, { ordered: true }));
		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);
		if (this.closed) return;
		this.opts.callbacks.onSignal({
			kind: "offer",
			sdp: offer.sdp ?? ""
		});
	}
	/** Feed a signal relayed from the other peer. Candidates that arrive early are queued. */
	async handleSignal(payload) {
		if (this.closed) return;
		try {
			if (payload.kind === "offer") {
				if (this.opts.role !== "responder") return;
				await this.pc.setRemoteDescription({
					type: "offer",
					sdp: payload.sdp
				});
				await this.flushCandidates();
				const answer = await this.pc.createAnswer();
				await this.pc.setLocalDescription(answer);
				if (this.closed) return;
				this.opts.callbacks.onSignal({
					kind: "answer",
					sdp: answer.sdp ?? ""
				});
			} else if (payload.kind === "answer") {
				if (this.opts.role !== "initiator") return;
				await this.pc.setRemoteDescription({
					type: "answer",
					sdp: payload.sdp
				});
				await this.flushCandidates();
			} else if (this.pc.remoteDescription) await this.addCandidate(payload.candidate);
			else this.pendingCandidates.push(payload.candidate);
		} catch {
			this.fail();
		}
	}
	channelOpen(name) {
		return this.channels[name]?.readyState === "open";
	}
	/** Throws if the channel isn't open. */
	send(name, data) {
		const channel = this.channels[name];
		if (!channel || channel.readyState !== "open") throw new Error(`channel ${name} is not open`);
		channel.send(data);
	}
	/** Remaining bytes queued on a channel, for backpressure. */
	buffered(name) {
		return this.channels[name]?.bufferedAmount ?? 0;
	}
	/** Resolves once a channel's send buffer is at or below `lowWater`; rejects if the link ends first. */
	whenDrained(name, lowWater) {
		const channel = this.channels[name];
		if (this.closed || this.failed || !channel) return Promise.reject(/* @__PURE__ */ new Error(`channel ${name} is not open`));
		if (channel.bufferedAmount <= lowWater) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const waiters = this.drainWaiters[name];
			waiters.add({
				resolve,
				reject
			});
			channel.bufferedAmountLowThreshold = lowWater;
			channel.onbufferedamountlow = () => {
				channel.onbufferedamountlow = null;
				for (const waiter of waiters) waiter.resolve();
				waiters.clear();
			};
		});
	}
	/**
	* Inspect the selected ICE candidate pair. "relay" if either side goes through TURN. Unknown
	* (no pair, or stats unavailable) is reported as "relay": the conservative answer.
	*/
	async detectConnectionType() {
		try {
			const stats = await this.pc.getStats();
			let pairId;
			stats.forEach((report) => {
				if (report.type === "transport" && typeof report.selectedCandidatePairId === "string") pairId = report.selectedCandidatePairId;
			});
			if (!pairId) stats.forEach((report) => {
				if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated === true) pairId = String(report.id);
			});
			const pair = pairId ? stats.get(pairId) : void 0;
			if (!pair) return "relay";
			const local = describe(stats.get(String(pair.localCandidateId)));
			const remote = describe(stats.get(String(pair.remoteCandidateId)));
			return local === "relay" || remote === "relay" ? "relay" : "direct";
		} catch {
			return "relay";
		}
	}
	/**
	* Swap in new ICE servers (the relay credentials of an upgraded room) and, on the initiator,
	* restart ICE so a relayed path is rebuilt with them before the old ones expire.
	*/
	async refreshIceServers(iceServers, restart) {
		if (this.closed) return;
		try {
			this.pc.setConfiguration?.({ iceServers });
			if (restart) await this.restartIce();
		} catch {}
	}
	/** Restart ICE (initiator re-offers with iceRestart). */
	async restartIce() {
		if (this.closed || this.opts.role !== "initiator") return;
		const offer = await this.pc.createOffer({ iceRestart: true });
		await this.pc.setLocalDescription(offer);
		this.opts.callbacks.onSignal({
			kind: "offer",
			sdp: offer.sdp ?? ""
		});
	}
	close() {
		if (this.closed) return;
		this.closed = true;
		this.rejectDrainWaiters();
		for (const channel of Object.values(this.channels)) {
			if (!channel) continue;
			channel.onopen = channel.onclose = channel.onerror = channel.onmessage = null;
			channel.onbufferedamountlow = null;
			try {
				channel.close();
			} catch {}
		}
		this.pc.onicecandidate = this.pc.onconnectionstatechange = this.pc.ondatachannel = null;
		try {
			this.pc.close();
		} catch {}
	}
	attach(name, channel) {
		this.channels[name] = channel;
		channel.binaryType = "arraybuffer";
		channel.onopen = () => {
			if (!this.closed) this.opts.callbacks.onChannelOpen(name);
		};
		channel.onclose = () => this.fail();
		channel.onmessage = (event) => {
			if (this.closed) return;
			const { data } = event;
			if (typeof data === "string") this.opts.callbacks.onMessage(name, data);
			else if (data instanceof ArrayBuffer) this.opts.callbacks.onMessage(name, new Uint8Array(data));
			else if (ArrayBuffer.isView(data)) this.opts.callbacks.onMessage(name, new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
		};
		if (channel.readyState === "open") queueMicrotask(() => channel.onopen?.());
	}
	async flushCandidates() {
		const queued = this.pendingCandidates;
		this.pendingCandidates = [];
		for (const candidate of queued) await this.addCandidate(candidate);
	}
	async addCandidate(candidate) {
		try {
			await this.pc.addIceCandidate(candidate);
		} catch {}
	}
	fail() {
		if (this.closed || this.failed) return;
		this.failed = true;
		this.rejectDrainWaiters();
		this.opts.callbacks.onFailed();
	}
	rejectDrainWaiters() {
		for (const waiters of Object.values(this.drainWaiters)) {
			for (const waiter of waiters) waiter.reject(/* @__PURE__ */ new Error("link closed"));
			waiters.clear();
		}
	}
};
//#endregion
//#region __vite-browser-external
var require___vite_browser_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {};
}));
//#endregion
//#region node_modules/.pnpm/@cloudflare+blindrsa-ts@0.4.6/node_modules/@cloudflare/blindrsa-ts/lib/src/sjcl/index.js
/** @fileOverview Javascript cryptography implementation.
*
* Crush to remove comments, shorten variable names and
* generally reduce transmission size.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* The Stanford Javascript Crypto Library, top-level namespace.
* @namespace
*/
var sjcl = {
	/**
	* Symmetric ciphers.
	* @namespace
	*/
	cipher: {},
	/**
	* Hash functions.  Right now only SHA256 is implemented.
	* @namespace
	*/
	hash: {},
	/**
	* Key exchange functions.  Right now only SRP is implemented.
	* @namespace
	*/
	keyexchange: {},
	/**
	* Cipher modes of operation.
	* @namespace
	*/
	mode: {},
	/**
	* Miscellaneous.  HMAC and PBKDF2.
	* @namespace
	*/
	misc: {},
	/**
	* Bit array encoders and decoders.
	* @namespace
	*
	* @description
	* The members of this namespace are functions which translate between
	* SJCL's bitArrays and other objects (usually strings).  Because it
	* isn't always clear which direction is encoding and which is decoding,
	* the method names are "fromBits" and "toBits".
	*/
	codec: {},
	/**
	* Exceptions.
	* @namespace
	*/
	exception: {
		/**
		* Ciphertext is corrupt.
		* @constructor
		*/
		corrupt: function(message) {
			this.toString = function() {
				return "CORRUPT: " + this.message;
			};
			this.message = message;
		},
		/**
		* Invalid parameter.
		* @constructor
		*/
		invalid: function(message) {
			this.toString = function() {
				return "INVALID: " + this.message;
			};
			this.message = message;
		},
		/**
		* Bug or missing feature in SJCL.
		* @constructor
		*/
		bug: function(message) {
			this.toString = function() {
				return "BUG: " + this.message;
			};
			this.message = message;
		},
		/**
		* Something isn't ready.
		* @constructor
		*/
		notReady: function(message) {
			this.toString = function() {
				return "NOT READY: " + this.message;
			};
			this.message = message;
		}
	}
};
/** @fileOverview Low-level AES implementation.
*
* This file contains a low-level implementation of AES, optimized for
* size and for efficiency on several browsers.  It is based on
* OpenSSL's aes_core.c, a public-domain implementation by Vincent
* Rijmen, Antoon Bosselaers and Paulo Barreto.
*
* An older version of this implementation is available in the public
* domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
* Stanford University 2008-2010 and BSD-licensed for liability
* reasons.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Schedule out an AES key for both encryption and decryption.  This
* is a low-level class.  Use a cipher mode to do bulk encryption.
*
* @constructor
* @param {Array} key The key as an array of 4, 6 or 8 words.
*/
sjcl.cipher.aes = function(key) {
	if (!this._tables[0][0][0]) this._precompute();
	var i, j, tmp, encKey, decKey, sbox = this._tables[0][4], decTable = this._tables[1], keyLen = key.length, rcon = 1;
	if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) throw new sjcl.exception.invalid("invalid aes key size");
	this._key = [encKey = key.slice(0), decKey = []];
	for (i = keyLen; i < 4 * keyLen + 28; i++) {
		tmp = encKey[i - 1];
		if (i % keyLen === 0 || keyLen === 8 && i % keyLen === 4) {
			tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];
			if (i % keyLen === 0) {
				tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
				rcon = rcon << 1 ^ (rcon >> 7) * 283;
			}
		}
		encKey[i] = encKey[i - keyLen] ^ tmp;
	}
	for (j = 0; i; j++, i--) {
		tmp = encKey[j & 3 ? i : i - 4];
		if (i <= 4 || j < 4) decKey[j] = tmp;
		else decKey[j] = decTable[0][sbox[tmp >>> 24]] ^ decTable[1][sbox[tmp >> 16 & 255]] ^ decTable[2][sbox[tmp >> 8 & 255]] ^ decTable[3][sbox[tmp & 255]];
	}
};
sjcl.cipher.aes.prototype = {
	/**
	* Encrypt an array of 4 big-endian words.
	* @param {Array} data The plaintext.
	* @return {Array} The ciphertext.
	*/
	encrypt: function(data) {
		return this._crypt(data, 0);
	},
	/**
	* Decrypt an array of 4 big-endian words.
	* @param {Array} data The ciphertext.
	* @return {Array} The plaintext.
	*/
	decrypt: function(data) {
		return this._crypt(data, 1);
	},
	/**
	* The expanded S-box and inverse S-box tables.  These will be computed
	* on the client so that we don't have to send them down the wire.
	*
	* There are two tables, _tables[0] is for encryption and
	* _tables[1] is for decryption.
	*
	* The first 4 sub-tables are the expanded S-box with MixColumns.  The
	* last (_tables[01][4]) is the S-box itself.
	*
	* @private
	*/
	_tables: [[
		[],
		[],
		[],
		[],
		[]
	], [
		[],
		[],
		[],
		[],
		[]
	]],
	/**
	* Expand the S-box tables.
	*
	* @private
	*/
	_precompute: function() {
		var encTable = this._tables[0], decTable = this._tables[1], sbox = encTable[4], sboxInv = decTable[4], i, x, xInv, d = [], th = [], x2, x4, x8, s, tEnc, tDec;
		for (i = 0; i < 256; i++) th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
		for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
			s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
			s = s >> 8 ^ s & 255 ^ 99;
			sbox[x] = s;
			sboxInv[s] = x;
			x8 = d[x4 = d[x2 = d[x]]];
			tDec = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
			tEnc = d[s] * 257 ^ s * 16843008;
			for (i = 0; i < 4; i++) {
				encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
				decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
			}
		}
		for (i = 0; i < 5; i++) {
			encTable[i] = encTable[i].slice(0);
			decTable[i] = decTable[i].slice(0);
		}
	},
	/**
	* Encryption and decryption core.
	* @param {Array} input Four words to be encrypted or decrypted.
	* @param dir The direction, 0 for encrypt and 1 for decrypt.
	* @return {Array} The four encrypted or decrypted words.
	* @private
	*/
	_crypt: function(input, dir) {
		if (input.length !== 4) throw new sjcl.exception.invalid("invalid aes block size");
		var key = this._key[dir], a = input[0] ^ key[0], b = input[dir ? 3 : 1] ^ key[1], c = input[2] ^ key[2], d = input[dir ? 1 : 3] ^ key[3], a2, b2, c2, nInnerRounds = key.length / 4 - 2, i, kIndex = 4, out = [
			0,
			0,
			0,
			0
		], table = this._tables[dir], t0 = table[0], t1 = table[1], t2 = table[2], t3 = table[3], sbox = table[4];
		for (i = 0; i < nInnerRounds; i++) {
			a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
			b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
			c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
			d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
			kIndex += 4;
			a = a2;
			b = b2;
			c = c2;
		}
		for (i = 0; i < 4; i++) {
			out[dir ? 3 & -i : i] = sbox[a >>> 24] << 24 ^ sbox[b >> 16 & 255] << 16 ^ sbox[c >> 8 & 255] << 8 ^ sbox[d & 255] ^ key[kIndex++];
			a2 = a;
			a = b;
			b = c;
			c = d;
			d = a2;
		}
		return out;
	}
};
/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Arrays of bits, encoded as arrays of Numbers.
* @namespace
* @description
* <p>
* These objects are the currency accepted by SJCL's crypto functions.
* </p>
*
* <p>
* Most of our crypto primitives operate on arrays of 4-byte words internally,
* but many of them can take arguments that are not a multiple of 4 bytes.
* This library encodes arrays of bits (whose size need not be a multiple of 8
* bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
* array of words, 32 bits at a time.  Since the words are double-precision
* floating point numbers, they fit some extra data.  We use this (in a private,
* possibly-changing manner) to encode the number of bits actually  present
* in the last word of the array.
* </p>
*
* <p>
* Because bitwise ops clear this out-of-band data, these arrays can be passed
* to ciphers like AES which want arrays of words.
* </p>
*/
sjcl.bitArray = {
	/**
	* Array slices in units of bits.
	* @param {bitArray} a The array to slice.
	* @param {Number} bstart The offset to the start of the slice, in bits.
	* @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
	* slice until the end of the array.
	* @return {bitArray} The requested slice.
	*/
	bitSlice: function(a, bstart, bend) {
		a = sjcl.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
		return bend === void 0 ? a : sjcl.bitArray.clamp(a, bend - bstart);
	},
	/**
	* Extract a number packed into a bit array.
	* @param {bitArray} a The array to slice.
	* @param {Number} bstart The offset to the start of the slice, in bits.
	* @param {Number} blength The length of the number to extract.
	* @return {Number} The requested slice.
	*/
	extract: function(a, bstart, blength) {
		var x, sh = Math.floor(-bstart - blength & 31);
		if ((bstart + blength - 1 ^ bstart) & -32) x = a[bstart / 32 | 0] << 32 - sh ^ a[bstart / 32 + 1 | 0] >>> sh;
		else x = a[bstart / 32 | 0] >>> sh;
		return x & (1 << blength) - 1;
	},
	/**
	* Concatenate two bit arrays.
	* @param {bitArray} a1 The first array.
	* @param {bitArray} a2 The second array.
	* @return {bitArray} The concatenation of a1 and a2.
	*/
	concat: function(a1, a2) {
		if (a1.length === 0 || a2.length === 0) return a1.concat(a2);
		var last = a1[a1.length - 1], shift = sjcl.bitArray.getPartial(last);
		if (shift === 32) return a1.concat(a2);
		else return sjcl.bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
	},
	/**
	* Find the length of an array of bits.
	* @param {bitArray} a The array.
	* @return {Number} The length of a, in bits.
	*/
	bitLength: function(a) {
		var l = a.length, x;
		if (l === 0) return 0;
		x = a[l - 1];
		return (l - 1) * 32 + sjcl.bitArray.getPartial(x);
	},
	/**
	* Truncate an array.
	* @param {bitArray} a The array.
	* @param {Number} len The length to truncate to, in bits.
	* @return {bitArray} A new array, truncated to len bits.
	*/
	clamp: function(a, len) {
		if (a.length * 32 < len) return a;
		a = a.slice(0, Math.ceil(len / 32));
		var l = a.length;
		len = len & 31;
		if (l > 0 && len) a[l - 1] = sjcl.bitArray.partial(len, a[l - 1] & 2147483648 >> len - 1, 1);
		return a;
	},
	/**
	* Make a partial word for a bit array.
	* @param {Number} len The number of bits in the word.
	* @param {Number} x The bits.
	* @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
	* @return {Number} The partial word.
	*/
	partial: function(len, x, _end) {
		if (len === 32) return x;
		return (_end ? x | 0 : x << 32 - len) + len * 1099511627776;
	},
	/**
	* Get the number of bits used by a partial word.
	* @param {Number} x The partial word.
	* @return {Number} The number of bits used by the partial word.
	*/
	getPartial: function(x) {
		return Math.round(x / 1099511627776) || 32;
	},
	/**
	* Compare two arrays for equality in a predictable amount of time.
	* @param {bitArray} a The first array.
	* @param {bitArray} b The second array.
	* @return {boolean} true if a == b; false otherwise.
	*/
	equal: function(a, b) {
		if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) return false;
		var x = 0, i = 0;
		for (; i < a.length; i++) x |= a[i] ^ b[i];
		return x === 0;
	},
	/** Shift an array right.
	* @param {bitArray} a The array to shift.
	* @param {Number} shift The number of bits to shift.
	* @param {Number} [carry=0] A byte to carry in
	* @param {bitArray} [out=[]] An array to prepend to the output.
	* @private
	*/
	_shiftRight: function(a, shift, carry, out) {
		var i, last2 = 0, shift2;
		if (out === void 0) out = [];
		for (; shift >= 32; shift -= 32) {
			out.push(carry);
			carry = 0;
		}
		if (shift === 0) return out.concat(a);
		for (i = 0; i < a.length; i++) {
			out.push(carry | a[i] >>> shift);
			carry = a[i] << 32 - shift;
		}
		last2 = a.length ? a[a.length - 1] : 0;
		shift2 = sjcl.bitArray.getPartial(last2);
		out.push(sjcl.bitArray.partial(shift + shift2 & 31, shift + shift2 > 32 ? carry : out.pop(), 1));
		return out;
	},
	/** xor a block of 4 words together.
	* @private
	*/
	_xor4: function(x, y) {
		return [
			x[0] ^ y[0],
			x[1] ^ y[1],
			x[2] ^ y[2],
			x[3] ^ y[3]
		];
	},
	/** byteswap a word array inplace.
	* (does not handle partial words)
	* @param {sjcl.bitArray} a word array
	* @return {sjcl.bitArray} byteswapped array
	*/
	byteswapM: function(a) {
		var i, v, m = 65280;
		for (i = 0; i < a.length; ++i) {
			v = a[i];
			a[i] = v >>> 24 | v >>> 8 & m | (v & m) << 8 | v << 24;
		}
		return a;
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* UTF-8 strings
* @namespace
*/
sjcl.codec.utf8String = {
	/** Convert from a bitArray to a UTF-8 string. */
	fromBits: function(arr) {
		var out = "", bl = sjcl.bitArray.bitLength(arr), i = 0, tmp;
		for (; i < bl / 8; i++) {
			if ((i & 3) === 0) tmp = arr[i / 4];
			out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
			tmp <<= 8;
		}
		return decodeURIComponent(escape(out));
	},
	/** Convert from a UTF-8 string to a bitArray. */
	toBits: function(str) {
		str = unescape(encodeURIComponent(str));
		var out = [], i, tmp = 0;
		for (i = 0; i < str.length; i++) {
			tmp = tmp << 8 | str.charCodeAt(i);
			if ((i & 3) === 3) {
				out.push(tmp);
				tmp = 0;
			}
		}
		if (i & 3) out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
		return out;
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Hexadecimal
* @namespace
*/
sjcl.codec.hex = {
	/** Convert from a bitArray to a hex string. */
	fromBits: function(arr) {
		var out = "", i = 0;
		for (; i < arr.length; i++) out += ((arr[i] | 0) + 0xf00000000000).toString(16).substr(4);
		return out.substr(0, sjcl.bitArray.bitLength(arr) / 4);
	},
	/** Convert from a hex string to a bitArray. */
	toBits: function(str) {
		var i, out = [], len;
		str = str.replace(/\s|0x/g, "");
		len = str.length;
		str = str + "00000000";
		for (i = 0; i < str.length; i += 8) out.push(parseInt(str.substr(i, 8), 16) ^ 0);
		return sjcl.bitArray.clamp(out, len * 4);
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Base64 encoding/decoding
* @namespace
*/
sjcl.codec.base64 = {
	/** The base64 alphabet.
	* @private
	*/
	_chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	/** Convert from a bitArray to a base64 string. */
	fromBits: function(arr, _noEquals, _url) {
		var out = "", i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, bl = sjcl.bitArray.bitLength(arr);
		if (_url) c = c.substr(0, 62) + "-_";
		for (i = 0; out.length * 6 < bl;) {
			out += c.charAt((ta ^ arr[i] >>> bits) >>> 26);
			if (bits < 6) {
				ta = arr[i] << 6 - bits;
				bits += 26;
				i++;
			} else {
				ta <<= 6;
				bits -= 6;
			}
		}
		while (out.length & 3 && !_noEquals) out += "=";
		return out;
	},
	/** Convert from a base64 string to a bitArray */
	toBits: function(str, _url) {
		str = str.replace(/\s|=/g, "");
		var out = [], i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, x;
		if (_url) c = c.substr(0, 62) + "-_";
		for (i = 0; i < str.length; i++) {
			x = c.indexOf(str.charAt(i));
			if (x < 0) throw new sjcl.exception.invalid("this isn't base64!");
			if (bits > 26) {
				bits -= 26;
				out.push(ta ^ x >>> bits);
				ta = x << 32 - bits;
			} else {
				bits += 6;
				ta ^= x << 32 - bits;
			}
		}
		if (bits & 56) out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
		return out;
	}
};
sjcl.codec.base64url = {
	fromBits: function(arr) {
		return sjcl.codec.base64.fromBits(arr, 1, 1);
	},
	toBits: function(str) {
		return sjcl.codec.base64.toBits(str, 1);
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Arrays of bytes
* @namespace
*/
sjcl.codec.bytes = {
	/** Convert from a bitArray to an array of bytes. */
	fromBits: function(arr) {
		var out = [], bl = sjcl.bitArray.bitLength(arr), i = 0, tmp;
		for (; i < bl / 8; i++) {
			if ((i & 3) === 0) tmp = arr[i / 4];
			out.push(tmp >>> 24);
			tmp <<= 8;
		}
		return out;
	},
	/** Convert from an array of bytes to a bitArray. */
	toBits: function(bytes) {
		var out = [], i, tmp = 0;
		for (i = 0; i < bytes.length; i++) {
			tmp = tmp << 8 | bytes[i];
			if ((i & 3) === 3) {
				out.push(tmp);
				tmp = 0;
			}
		}
		if (i & 3) out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
		return out;
	}
};
/** @fileOverview Javascript SHA-256 implementation.
*
* An older version of this implementation is available in the public
* domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
* Stanford University 2008-2010 and BSD-licensed for liability
* reasons.
*
* Special thanks to Aldo Cortesi for pointing out several bugs in
* this code.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Context for a SHA-256 operation in progress.
* @constructor
*/
sjcl.hash.sha256 = function(hash) {
	if (!this._key[0]) this._precompute();
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else this.reset();
};
/**
* Hash a string or an array of words.
* @static
* @param {bitArray|String} data the data to hash.
* @return {bitArray} The hash value, an array of 16 big-endian words.
*/
sjcl.hash.sha256.hash = function(data) {
	return new sjcl.hash.sha256().update(data).finalize();
};
sjcl.hash.sha256.prototype = {
	/**
	* The hash's block size, in bits.
	* @constant
	*/
	blockSize: 512,
	/**
	* Reset the hash state.
	* @return this
	*/
	reset: function() {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},
	/**
	* Input several words to the hash.
	* @param {bitArray|String} data the data to hash.
	* @return this
	*/
	update: function(data) {
		if (typeof data === "string") data = sjcl.codec.utf8String.toBits(data);
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		if (typeof Uint32Array !== "undefined") {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
				this._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
		} else for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) this._block(b.splice(0, 16));
		return this;
	},
	/**
	* Complete hashing and output the hash value.
	* @return {bitArray} The hash value, an array of 8 big-endian words.
	*/
	finalize: function() {
		var i, b = this._buffer, h = this._h;
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
		for (i = b.length + 2; i & 15; i++) b.push(0);
		b.push(Math.floor(this._length / 4294967296));
		b.push(this._length | 0);
		while (b.length) this._block(b.splice(0, 16));
		this.reset();
		return h;
	},
	/**
	* The SHA-256 initialization vector, to be precomputed.
	* @private
	*/
	_init: [],
	/**
	* The SHA-256 hash key, to be precomputed.
	* @private
	*/
	_key: [],
	/**
	* Function to precompute _init and _key.
	* @private
	*/
	_precompute: function() {
		var i = 0, prime = 2, factor, isPrime;
		function frac(x) {
			return (x - Math.floor(x)) * 4294967296 | 0;
		}
		for (; i < 64; prime++) {
			isPrime = true;
			for (factor = 2; factor * factor <= prime; factor++) if (prime % factor === 0) {
				isPrime = false;
				break;
			}
			if (isPrime) {
				if (i < 8) this._init[i] = frac(Math.pow(prime, 1 / 2));
				this._key[i] = frac(Math.pow(prime, 1 / 3));
				i++;
			}
		}
	},
	/**
	* Perform one cycle of SHA-256.
	* @param {Uint32Array|bitArray} w one block of words.
	* @private
	*/
	_block: function(w) {
		var i, tmp, a, b, h = this._h, k = this._key, h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];
		for (i = 0; i < 64; i++) {
			if (i < 16) tmp = w[i];
			else {
				a = w[i + 1 & 15];
				b = w[i + 14 & 15];
				tmp = w[i & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i & 15] + w[i + 9 & 15] | 0;
			}
			tmp = tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + k[i];
			h7 = h6;
			h6 = h5;
			h5 = h4;
			h4 = h3 + tmp | 0;
			h3 = h2;
			h2 = h1;
			h1 = h0;
			h0 = tmp + (h1 & h2 ^ h3 & (h1 ^ h2)) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10) | 0;
		}
		h[0] = h[0] + h0 | 0;
		h[1] = h[1] + h1 | 0;
		h[2] = h[2] + h2 | 0;
		h[3] = h[3] + h3 | 0;
		h[4] = h[4] + h4 | 0;
		h[5] = h[5] + h5 | 0;
		h[6] = h[6] + h6 | 0;
		h[7] = h[7] + h7 | 0;
	}
};
/** @fileOverview CCM mode implementation.
*
* Special thanks to Roy Nicholson for pointing out a bug in our
* implementation.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* CTR mode with CBC MAC.
* @namespace
*/
sjcl.mode.ccm = {
	/** The name of the mode.
	* @constant
	*/
	name: "ccm",
	_progressListeners: [],
	listenProgress: function(cb) {
		sjcl.mode.ccm._progressListeners.push(cb);
	},
	unListenProgress: function(cb) {
		var index = sjcl.mode.ccm._progressListeners.indexOf(cb);
		if (index > -1) sjcl.mode.ccm._progressListeners.splice(index, 1);
	},
	_callProgressListener: function(val) {
		var p = sjcl.mode.ccm._progressListeners.slice(), i = 0;
		for (; i < p.length; i += 1) p[i](val);
	},
	/** Encrypt in CCM mode.
	* @static
	* @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
	* @param {bitArray} plaintext The plaintext data.
	* @param {bitArray} iv The initialization value.
	* @param {bitArray} [adata=[]] The authenticated data.
	* @param {Number} [tlen=64] the desired tag length, in bits.
	* @return {bitArray} The encrypted data, an array of bytes.
	*/
	encrypt: function(prf, plaintext, iv, adata, tlen) {
		var L, out = plaintext.slice(0), tag, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(out) / 8;
		tlen = tlen || 64;
		adata = adata || [];
		if (ivl < 7) throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
		for (L = 2; L < 4 && ol >>> 8 * L; L++);
		if (L < 15 - ivl) L = 15 - ivl;
		iv = w.clamp(iv, 8 * (15 - L));
		tag = sjcl.mode.ccm._computeTag(prf, plaintext, iv, adata, tlen, L);
		out = sjcl.mode.ccm._ctrMode(prf, out, iv, tag, tlen, L);
		return w.concat(out.data, out.tag);
	},
	/** Decrypt in CCM mode.
	* @static
	* @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
	* @param {bitArray} ciphertext The ciphertext data.
	* @param {bitArray} iv The initialization value.
	* @param {bitArray} [adata=[]] adata The authenticated data.
	* @param {Number} [tlen=64] tlen the desired tag length, in bits.
	* @return {bitArray} The decrypted data.
	*/
	decrypt: function(prf, ciphertext, iv, adata, tlen) {
		tlen = tlen || 64;
		adata = adata || [];
		var L, w = sjcl.bitArray, ivl = w.bitLength(iv) / 8, ol = w.bitLength(ciphertext), out = w.clamp(ciphertext, ol - tlen), tag = w.bitSlice(ciphertext, ol - tlen), tag2;
		ol = (ol - tlen) / 8;
		if (ivl < 7) throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
		for (L = 2; L < 4 && ol >>> 8 * L; L++);
		if (L < 15 - ivl) L = 15 - ivl;
		iv = w.clamp(iv, 8 * (15 - L));
		out = sjcl.mode.ccm._ctrMode(prf, out, iv, tag, tlen, L);
		tag2 = sjcl.mode.ccm._computeTag(prf, out.data, iv, adata, tlen, L);
		if (!w.equal(out.tag, tag2)) throw new sjcl.exception.corrupt("ccm: tag doesn't match");
		return out.data;
	},
	_macAdditionalData: function(prf, adata, iv, tlen, ol, L) {
		var mac, tmp, i, macData = [], w = sjcl.bitArray, xor = w._xor4;
		mac = [w.partial(8, (adata.length ? 64 : 0) | tlen - 2 << 2 | L - 1)];
		mac = w.concat(mac, iv);
		mac[3] |= ol;
		mac = prf.encrypt(mac);
		if (adata.length) {
			tmp = w.bitLength(adata) / 8;
			if (tmp <= 65279) macData = [w.partial(16, tmp)];
			else if (tmp <= 4294967295) macData = w.concat([w.partial(16, 65534)], [tmp]);
			macData = w.concat(macData, adata);
			for (i = 0; i < macData.length; i += 4) mac = prf.encrypt(xor(mac, macData.slice(i, i + 4).concat([
				0,
				0,
				0
			])));
		}
		return mac;
	},
	_computeTag: function(prf, plaintext, iv, adata, tlen, L) {
		var mac, i, w = sjcl.bitArray, xor = w._xor4;
		tlen /= 8;
		if (tlen % 2 || tlen < 4 || tlen > 16) throw new sjcl.exception.invalid("ccm: invalid tag length");
		if (adata.length > 4294967295 || plaintext.length > 4294967295) throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data");
		mac = sjcl.mode.ccm._macAdditionalData(prf, adata, iv, tlen, w.bitLength(plaintext) / 8, L);
		for (i = 0; i < plaintext.length; i += 4) mac = prf.encrypt(xor(mac, plaintext.slice(i, i + 4).concat([
			0,
			0,
			0
		])));
		return w.clamp(mac, tlen * 8);
	},
	/** CCM CTR mode.
	* Encrypt or decrypt data and tag with the prf in CCM-style CTR mode.
	* May mutate its arguments.
	* @param {Object} prf The PRF.
	* @param {bitArray} data The data to be encrypted or decrypted.
	* @param {bitArray} iv The initialization vector.
	* @param {bitArray} tag The authentication tag.
	* @param {Number} tlen The length of th etag, in bits.
	* @param {Number} L The CCM L value.
	* @return {Object} An object with data and tag, the en/decryption of data and tag values.
	* @private
	*/
	_ctrMode: function(prf, data, iv, tag, tlen, L) {
		var enc, i, w = sjcl.bitArray, xor = w._xor4, ctr, l = data.length, bl = w.bitLength(data), n = l / 50, p = n;
		ctr = w.concat([w.partial(8, L - 1)], iv).concat([
			0,
			0,
			0
		]).slice(0, 4);
		tag = w.bitSlice(xor(tag, prf.encrypt(ctr)), 0, tlen);
		if (!l) return {
			tag,
			data: []
		};
		for (i = 0; i < l; i += 4) {
			if (i > n) {
				sjcl.mode.ccm._callProgressListener(i / l);
				n += p;
			}
			ctr[3]++;
			enc = prf.encrypt(ctr);
			data[i] ^= enc[0];
			data[i + 1] ^= enc[1];
			data[i + 2] ^= enc[2];
			data[i + 3] ^= enc[3];
		}
		return {
			tag,
			data: w.clamp(data, bl)
		};
	}
};
/** @fileOverview HMAC implementation.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/** HMAC with the specified hash function.
* @constructor
* @param {bitArray} key the key for HMAC.
* @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
*/
sjcl.misc.hmac = function(key, Hash) {
	this._hash = Hash = Hash || sjcl.hash.sha256;
	var exKey = [[], []], i, bs = Hash.prototype.blockSize / 32;
	this._baseHash = [new Hash(), new Hash()];
	if (key.length > bs) key = Hash.hash(key);
	for (i = 0; i < bs; i++) {
		exKey[0][i] = key[i] ^ 909522486;
		exKey[1][i] = key[i] ^ 1549556828;
	}
	this._baseHash[0].update(exKey[0]);
	this._baseHash[1].update(exKey[1]);
	this._resultHash = new Hash(this._baseHash[0]);
};
/** HMAC with the specified hash function.  Also called encrypt since it's a prf.
* @param {bitArray|String} data The data to mac.
*/
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function(data) {
	if (!this._updated) {
		this.update(data);
		return this.digest(data);
	} else throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
};
sjcl.misc.hmac.prototype.reset = function() {
	this._resultHash = new this._hash(this._baseHash[0]);
	this._updated = false;
};
sjcl.misc.hmac.prototype.update = function(data) {
	this._updated = true;
	this._resultHash.update(data);
};
sjcl.misc.hmac.prototype.digest = function() {
	var w = this._resultHash.finalize(), result = new this._hash(this._baseHash[1]).update(w).finalize();
	this.reset();
	return result;
};
/** @fileOverview Password-based key-derivation function, version 2.0.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/** Password-Based Key-Derivation Function, version 2.0.
*
* Generate keys from passwords using PBKDF2-HMAC-SHA256.
*
* This is the method specified by RSA's PKCS #5 standard.
*
* @param {bitArray|String} password  The password.
* @param {bitArray|String} salt The salt.  Should have lots of entropy.
* @param {Number} [count=1000] The number of iterations.  Higher numbers make the function slower but more secure.
* @param {Number} [length] The length of the derived key.  Defaults to the
output size of the hash function.
* @param {Object} [Prff=sjcl.misc.hmac] The pseudorandom function family.
* @return {bitArray} the derived key.
*/
sjcl.misc.pbkdf2 = function(password, salt, count, length, Prff) {
	count = count || 1e4;
	if (length < 0 || count < 0) throw new sjcl.exception.invalid("invalid params to pbkdf2");
	if (typeof password === "string") password = sjcl.codec.utf8String.toBits(password);
	if (typeof salt === "string") salt = sjcl.codec.utf8String.toBits(salt);
	Prff = Prff || sjcl.misc.hmac;
	var prf = new Prff(password), u, ui, i, j, k, out = [], b = sjcl.bitArray;
	for (k = 1; 32 * out.length < (length || 1); k++) {
		u = ui = prf.encrypt(b.concat(salt, [k]));
		for (i = 1; i < count; i++) {
			ui = prf.encrypt(ui);
			for (j = 0; j < ui.length; j++) u[j] ^= ui[j];
		}
		out = out.concat(u);
	}
	if (length) out = b.clamp(out, length);
	return out;
};
/** @fileOverview Random number generator.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
* @author Michael Brooks
* @author Steve Thomas
*/
/**
* @class Random number generator
* @description
* <b>Use sjcl.random as a singleton for this class!</b>
* <p>
* This random number generator is a derivative of Ferguson and Schneier's
* generator Fortuna.  It collects entropy from various events into several
* pools, implemented by streaming SHA-256 instances.  It differs from
* ordinary Fortuna in a few ways, though.
* </p>
*
* <p>
* Most importantly, it has an entropy estimator.  This is present because
* there is a strong conflict here between making the generator available
* as soon as possible, and making sure that it doesn't "run on empty".
* In Fortuna, there is a saved state file, and the system is likely to have
* time to warm up.
* </p>
*
* <p>
* Second, because users are unlikely to stay on the page for very long,
* and to speed startup time, the number of pools increases logarithmically:
* a new pool is created when the previous one is actually used for a reseed.
* This gives the same asymptotic guarantees as Fortuna, but gives more
* entropy to early reseeds.
* </p>
*
* <p>
* The entire mechanism here feels pretty klunky.  Furthermore, there are
* several improvements that should be made, including support for
* dedicated cryptographic functions that may be present in some browsers;
* state files in local storage; cookies containing randomness; etc.  So
* look for improvements in future versions.
* </p>
* @constructor
*/
sjcl.prng = function(defaultParanoia) {
	this._pools = [new sjcl.hash.sha256()];
	this._poolEntropy = [0];
	this._reseedCount = 0;
	this._robins = {};
	this._eventId = 0;
	this._collectorIds = {};
	this._collectorIdNext = 0;
	this._strength = 0;
	this._poolStrength = 0;
	this._nextReseed = 0;
	this._key = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	];
	this._counter = [
		0,
		0,
		0,
		0
	];
	this._cipher = void 0;
	this._defaultParanoia = defaultParanoia;
	this._collectorsStarted = false;
	this._callbacks = {
		progress: {},
		seeded: {}
	};
	this._callbackI = 0;
	this._NOT_READY = 0;
	this._READY = 1;
	this._REQUIRES_RESEED = 2;
	this._MAX_WORDS_PER_BURST = 65536;
	this._PARANOIA_LEVELS = [
		0,
		48,
		64,
		96,
		128,
		192,
		256,
		384,
		512,
		768,
		1024
	];
	this._MILLISECONDS_PER_RESEED = 3e4;
	this._BITS_PER_RESEED = 80;
};
sjcl.prng.prototype = {
	/** Generate several random words, and return them in an array.
	* A word consists of 32 bits (4 bytes)
	* @param {Number} nwords The number of words to generate.
	*/
	randomWords: function(nwords, paranoia) {
		var out = [], i, readiness = this.isReady(paranoia), g;
		if (readiness === this._NOT_READY) throw new sjcl.exception.notReady("generator isn't seeded");
		else if (readiness & this._REQUIRES_RESEED) this._reseedFromPools(!(readiness & this._READY));
		for (i = 0; i < nwords; i += 4) {
			if ((i + 1) % this._MAX_WORDS_PER_BURST === 0) this._gate();
			g = this._gen4words();
			out.push(g[0], g[1], g[2], g[3]);
		}
		this._gate();
		return out.slice(0, nwords);
	},
	setDefaultParanoia: function(paranoia, allowZeroParanoia) {
		if (paranoia === 0 && allowZeroParanoia !== "Setting paranoia=0 will ruin your security; use it only for testing") throw new sjcl.exception.invalid("Setting paranoia=0 will ruin your security; use it only for testing");
		this._defaultParanoia = paranoia;
	},
	/**
	* Add entropy to the pools.
	* @param data The entropic value.  Should be a 32-bit integer, array of 32-bit integers, or string
	* @param {Number} estimatedEntropy The estimated entropy of data, in bits
	* @param {String} source The source of the entropy, eg "mouse"
	*/
	addEntropy: function(data, estimatedEntropy, source) {
		source = source || "user";
		var id, i, tmp, t = (/* @__PURE__ */ new Date()).valueOf(), robin = this._robins[source], oldReady = this.isReady(), err = 0, objName;
		id = this._collectorIds[source];
		if (id === void 0) id = this._collectorIds[source] = this._collectorIdNext++;
		if (robin === void 0) robin = this._robins[source] = 0;
		this._robins[source] = (this._robins[source] + 1) % this._pools.length;
		switch (typeof data) {
			case "number":
				if (estimatedEntropy === void 0) estimatedEntropy = 1;
				this._pools[robin].update([
					id,
					this._eventId++,
					1,
					estimatedEntropy,
					t,
					1,
					data | 0
				]);
				break;
			case "object":
				objName = Object.prototype.toString.call(data);
				if (objName === "[object Uint32Array]") {
					tmp = [];
					for (i = 0; i < data.length; i++) tmp.push(data[i]);
					data = tmp;
				} else {
					if (objName !== "[object Array]") err = 1;
					for (i = 0; i < data.length && !err; i++) if (typeof data[i] !== "number") err = 1;
				}
				if (!err) {
					if (estimatedEntropy === void 0) {
						estimatedEntropy = 0;
						for (i = 0; i < data.length; i++) {
							tmp = data[i];
							while (tmp > 0) {
								estimatedEntropy++;
								tmp = tmp >>> 1;
							}
						}
					}
					this._pools[robin].update([
						id,
						this._eventId++,
						2,
						estimatedEntropy,
						t,
						data.length
					].concat(data));
				}
				break;
			case "string":
				if (estimatedEntropy === void 0) estimatedEntropy = data.length;
				this._pools[robin].update([
					id,
					this._eventId++,
					3,
					estimatedEntropy,
					t,
					data.length
				]);
				this._pools[robin].update(data);
				break;
			default: err = 1;
		}
		if (err) throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string");
		this._poolEntropy[robin] += estimatedEntropy;
		this._poolStrength += estimatedEntropy;
		if (oldReady === this._NOT_READY) {
			if (this.isReady() !== this._NOT_READY) this._fireEvent("seeded", Math.max(this._strength, this._poolStrength));
			this._fireEvent("progress", this.getProgress());
		}
	},
	/** Is the generator ready? */
	isReady: function(paranoia) {
		var entropyRequired = this._PARANOIA_LEVELS[paranoia !== void 0 ? paranoia : this._defaultParanoia];
		if (this._strength && this._strength >= entropyRequired) return this._poolEntropy[0] > this._BITS_PER_RESEED && (/* @__PURE__ */ new Date()).valueOf() > this._nextReseed ? this._REQUIRES_RESEED | this._READY : this._READY;
		else return this._poolStrength >= entropyRequired ? this._REQUIRES_RESEED | this._NOT_READY : this._NOT_READY;
	},
	/** Get the generator's progress toward readiness, as a fraction */
	getProgress: function(paranoia) {
		var entropyRequired = this._PARANOIA_LEVELS[paranoia ? paranoia : this._defaultParanoia];
		if (this._strength >= entropyRequired) return 1;
		else return this._poolStrength > entropyRequired ? 1 : this._poolStrength / entropyRequired;
	},
	/** start the built-in entropy collectors */
	startCollectors: function() {
		if (this._collectorsStarted) return;
		this._eventListener = {
			loadTimeCollector: this._bind(this._loadTimeCollector),
			mouseCollector: this._bind(this._mouseCollector),
			keyboardCollector: this._bind(this._keyboardCollector),
			accelerometerCollector: this._bind(this._accelerometerCollector),
			touchCollector: this._bind(this._touchCollector)
		};
		if (window.addEventListener) {
			window.addEventListener("load", this._eventListener.loadTimeCollector, false);
			window.addEventListener("mousemove", this._eventListener.mouseCollector, false);
			window.addEventListener("keypress", this._eventListener.keyboardCollector, false);
			window.addEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
			window.addEventListener("touchmove", this._eventListener.touchCollector, false);
		} else if (document.attachEvent) {
			document.attachEvent("onload", this._eventListener.loadTimeCollector);
			document.attachEvent("onmousemove", this._eventListener.mouseCollector);
			document.attachEvent("keypress", this._eventListener.keyboardCollector);
		} else throw new sjcl.exception.bug("can't attach event");
		this._collectorsStarted = true;
	},
	/** stop the built-in entropy collectors */
	stopCollectors: function() {
		if (!this._collectorsStarted) return;
		if (window.removeEventListener) {
			window.removeEventListener("load", this._eventListener.loadTimeCollector, false);
			window.removeEventListener("mousemove", this._eventListener.mouseCollector, false);
			window.removeEventListener("keypress", this._eventListener.keyboardCollector, false);
			window.removeEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
			window.removeEventListener("touchmove", this._eventListener.touchCollector, false);
		} else if (document.detachEvent) {
			document.detachEvent("onload", this._eventListener.loadTimeCollector);
			document.detachEvent("onmousemove", this._eventListener.mouseCollector);
			document.detachEvent("keypress", this._eventListener.keyboardCollector);
		}
		this._collectorsStarted = false;
	},
	/** add an event listener for progress or seeded-ness. */
	addEventListener: function(name, callback) {
		this._callbacks[name][this._callbackI++] = callback;
	},
	/** remove an event listener for progress or seeded-ness */
	removeEventListener: function(name, cb) {
		var i, j, cbs = this._callbacks[name], jsTemp = [];
		for (j in cbs) if (cbs.hasOwnProperty(j) && cbs[j] === cb) jsTemp.push(j);
		for (i = 0; i < jsTemp.length; i++) {
			j = jsTemp[i];
			delete cbs[j];
		}
	},
	_bind: function(func) {
		var that = this;
		return function() {
			func.apply(that, arguments);
		};
	},
	/** Generate 4 random words, no reseed, no gate.
	* @private
	*/
	_gen4words: function() {
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) break;
		}
		return this._cipher.encrypt(this._counter);
	},
	_gate: function() {
		this._key = this._gen4words().concat(this._gen4words());
		this._cipher = new sjcl.cipher.aes(this._key);
	},
	/** Reseed the generator with the given words
	* @private
	*/
	_reseed: function(seedWords) {
		this._key = sjcl.hash.sha256.hash(this._key.concat(seedWords));
		this._cipher = new sjcl.cipher.aes(this._key);
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) break;
		}
	},
	/** reseed the data from the entropy pools
	* @param full If set, use all the entropy pools in the reseed.
	*/
	_reseedFromPools: function(full) {
		var reseedData = [], strength = 0, i;
		this._nextReseed = reseedData[0] = (/* @__PURE__ */ new Date()).valueOf() + this._MILLISECONDS_PER_RESEED;
		for (i = 0; i < 16; i++) reseedData.push(Math.random() * 4294967296 | 0);
		for (i = 0; i < this._pools.length; i++) {
			reseedData = reseedData.concat(this._pools[i].finalize());
			strength += this._poolEntropy[i];
			this._poolEntropy[i] = 0;
			if (!full && this._reseedCount & 1 << i) break;
		}
		if (this._reseedCount >= 1 << this._pools.length) {
			this._pools.push(new sjcl.hash.sha256());
			this._poolEntropy.push(0);
		}
		this._poolStrength -= strength;
		if (strength > this._strength) this._strength = strength;
		this._reseedCount++;
		this._reseed(reseedData);
	},
	_keyboardCollector: function() {
		this._addCurrentTimeToEntropy(1);
	},
	_mouseCollector: function(ev) {
		var x, y;
		try {
			x = ev.x || ev.clientX || ev.offsetX || 0;
			y = ev.y || ev.clientY || ev.offsetY || 0;
		} catch (err) {
			x = 0;
			y = 0;
		}
		if (x != 0 && y != 0) this.addEntropy([x, y], 2, "mouse");
		this._addCurrentTimeToEntropy(0);
	},
	_touchCollector: function(ev) {
		var touch = ev.touches[0] || ev.changedTouches[0];
		var x = touch.pageX || touch.clientX, y = touch.pageY || touch.clientY;
		this.addEntropy([x, y], 1, "touch");
		this._addCurrentTimeToEntropy(0);
	},
	_loadTimeCollector: function() {
		this._addCurrentTimeToEntropy(2);
	},
	_addCurrentTimeToEntropy: function(estimatedEntropy) {
		if (typeof window !== "undefined" && window.performance && typeof window.performance.now === "function") this.addEntropy(window.performance.now(), estimatedEntropy, "loadtime");
		else this.addEntropy((/* @__PURE__ */ new Date()).valueOf(), estimatedEntropy, "loadtime");
	},
	_accelerometerCollector: function(ev) {
		var ac = ev.accelerationIncludingGravity.x || ev.accelerationIncludingGravity.y || ev.accelerationIncludingGravity.z;
		if (window.orientation) {
			var or = window.orientation;
			if (typeof or === "number") this.addEntropy(or, 1, "accelerometer");
		}
		if (ac) this.addEntropy(ac, 2, "accelerometer");
		this._addCurrentTimeToEntropy(0);
	},
	_fireEvent: function(name, arg) {
		var j, cbs = sjcl.random._callbacks[name], cbsTemp = [];
		for (j in cbs) if (cbs.hasOwnProperty(j)) cbsTemp.push(cbs[j]);
		for (j = 0; j < cbsTemp.length; j++) cbsTemp[j](arg);
	}
};
/** an instance for the prng.
* @see sjcl.prng
*/
sjcl.random = new sjcl.prng(6);
(function() {
	function getCryptoModule() {
		try {
			return require___vite_browser_external();
		} catch (e) {
			return null;
		}
	}
	try {
		var buf, crypt, ab;
		if (typeof module !== "undefined" && module.exports && (crypt = getCryptoModule()) && crypt.randomBytes) {
			buf = crypt.randomBytes(128);
			buf = new Uint32Array(new Uint8Array(buf).buffer);
			sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes");
		} else if (typeof window !== "undefined" && typeof Uint32Array !== "undefined") {
			ab = /* @__PURE__ */ new Uint32Array(32);
			if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(ab);
			else if (window.msCrypto && window.msCrypto.getRandomValues) window.msCrypto.getRandomValues(ab);
			else return;
			sjcl.random.addEntropy(ab, 1024, "crypto.getRandomValues");
		}
	} catch (e) {
		if (typeof window !== "undefined" && window.console) {
			console.log("There was an error collecting entropy from the browser:");
			console.log(e);
		}
	}
})();
/** @fileOverview Convenience functions centered around JSON encapsulation.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* JSON encapsulation
* @namespace
*/
sjcl.json = {
	/** Default values for encryption */
	defaults: {
		v: 1,
		iter: 1e4,
		ks: 128,
		ts: 64,
		mode: "ccm",
		adata: "",
		cipher: "aes"
	},
	/** Simple encryption function.
	* @param {String|bitArray} password The password or key.
	* @param {String} plaintext The data to encrypt.
	* @param {Object} [params] The parameters including tag, iv and salt.
	* @param {Object} [rp] A returned version with filled-in parameters.
	* @return {Object} The cipher raw data.
	* @throws {sjcl.exception.invalid} if a parameter is invalid.
	*/
	_encrypt: function(password, plaintext, params, rp) {
		params = params || {};
		rp = rp || {};
		var j = sjcl.json, p = j._add({ iv: sjcl.random.randomWords(4, 0) }, j.defaults), tmp, prp, adata;
		j._add(p, params);
		adata = p.adata;
		if (typeof p.salt === "string") p.salt = sjcl.codec.base64.toBits(p.salt);
		if (typeof p.iv === "string") p.iv = sjcl.codec.base64.toBits(p.iv);
		if (!sjcl.mode[p.mode] || !sjcl.cipher[p.cipher] || typeof password === "string" && p.iter <= 100 || p.ts !== 64 && p.ts !== 96 && p.ts !== 128 || p.ks !== 128 && p.ks !== 192 && p.ks !== 256 || p.iv.length < 2 || p.iv.length > 4) throw new sjcl.exception.invalid("json encrypt: invalid parameters");
		if (typeof password === "string") {
			tmp = sjcl.misc.cachedPbkdf2(password, p);
			password = tmp.key.slice(0, p.ks / 32);
			p.salt = tmp.salt;
		} else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.publicKey) {
			tmp = password.kem();
			p.kemtag = tmp.tag;
			password = tmp.key.slice(0, p.ks / 32);
		}
		if (typeof plaintext === "string") plaintext = sjcl.codec.utf8String.toBits(plaintext);
		if (typeof adata === "string") p.adata = adata = sjcl.codec.utf8String.toBits(adata);
		prp = new sjcl.cipher[p.cipher](password);
		j._add(rp, p);
		rp.key = password;
		if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && plaintext instanceof ArrayBuffer) p.ct = sjcl.arrayBuffer.ccm.encrypt(prp, plaintext, p.iv, adata, p.ts);
		else p.ct = sjcl.mode[p.mode].encrypt(prp, plaintext, p.iv, adata, p.ts);
		return p;
	},
	/** Simple encryption function.
	* @param {String|bitArray} password The password or key.
	* @param {String} plaintext The data to encrypt.
	* @param {Object} [params] The parameters including tag, iv and salt.
	* @param {Object} [rp] A returned version with filled-in parameters.
	* @return {String} The ciphertext serialized data.
	* @throws {sjcl.exception.invalid} if a parameter is invalid.
	*/
	encrypt: function(password, plaintext, params, rp) {
		var j = sjcl.json, p = j._encrypt.apply(j, arguments);
		return j.encode(p);
	},
	/** Simple decryption function.
	* @param {String|bitArray} password The password or key.
	* @param {Object} ciphertext The cipher raw data to decrypt.
	* @param {Object} [params] Additional non-default parameters.
	* @param {Object} [rp] A returned object with filled parameters.
	* @return {String} The plaintext.
	* @throws {sjcl.exception.invalid} if a parameter is invalid.
	* @throws {sjcl.exception.corrupt} if the ciphertext is corrupt.
	*/
	_decrypt: function(password, ciphertext, params, rp) {
		params = params || {};
		rp = rp || {};
		var j = sjcl.json, p = j._add(j._add(j._add({}, j.defaults), ciphertext), params, true), ct, tmp, prp, adata = p.adata;
		if (typeof p.salt === "string") p.salt = sjcl.codec.base64.toBits(p.salt);
		if (typeof p.iv === "string") p.iv = sjcl.codec.base64.toBits(p.iv);
		if (!sjcl.mode[p.mode] || !sjcl.cipher[p.cipher] || typeof password === "string" && p.iter <= 100 || p.ts !== 64 && p.ts !== 96 && p.ts !== 128 || p.ks !== 128 && p.ks !== 192 && p.ks !== 256 || !p.iv || p.iv.length < 2 || p.iv.length > 4) throw new sjcl.exception.invalid("json decrypt: invalid parameters");
		if (typeof password === "string") {
			tmp = sjcl.misc.cachedPbkdf2(password, p);
			password = tmp.key.slice(0, p.ks / 32);
			p.salt = tmp.salt;
		} else if (sjcl.ecc && password instanceof sjcl.ecc.elGamal.secretKey) password = password.unkem(sjcl.codec.base64.toBits(p.kemtag)).slice(0, p.ks / 32);
		if (typeof adata === "string") adata = sjcl.codec.utf8String.toBits(adata);
		prp = new sjcl.cipher[p.cipher](password);
		if (p.mode === "ccm" && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && p.ct instanceof ArrayBuffer) ct = sjcl.arrayBuffer.ccm.decrypt(prp, p.ct, p.iv, p.tag, adata, p.ts);
		else ct = sjcl.mode[p.mode].decrypt(prp, p.ct, p.iv, adata, p.ts);
		j._add(rp, p);
		rp.key = password;
		if (params.raw === 1) return ct;
		else return sjcl.codec.utf8String.fromBits(ct);
	},
	/** Simple decryption function.
	* @param {String|bitArray} password The password or key.
	* @param {String} ciphertext The ciphertext to decrypt.
	* @param {Object} [params] Additional non-default parameters.
	* @param {Object} [rp] A returned object with filled parameters.
	* @return {String} The plaintext.
	* @throws {sjcl.exception.invalid} if a parameter is invalid.
	* @throws {sjcl.exception.corrupt} if the ciphertext is corrupt.
	*/
	decrypt: function(password, ciphertext, params, rp) {
		var j = sjcl.json;
		return j._decrypt(password, j.decode(ciphertext), params, rp);
	},
	/** Encode a flat structure into a JSON string.
	* @param {Object} obj The structure to encode.
	* @return {String} A JSON string.
	* @throws {sjcl.exception.invalid} if obj has a non-alphanumeric property.
	* @throws {sjcl.exception.bug} if a parameter has an unsupported type.
	*/
	encode: function(obj) {
		var i, out = "{", comma = "";
		for (i in obj) if (obj.hasOwnProperty(i)) {
			if (!i.match(/^[a-z0-9]+$/i)) throw new sjcl.exception.invalid("json encode: invalid property name");
			out += comma + "\"" + i + "\":";
			comma = ",";
			switch (typeof obj[i]) {
				case "number":
				case "boolean":
					out += obj[i];
					break;
				case "string":
					out += "\"" + escape(obj[i]) + "\"";
					break;
				case "object":
					out += "\"" + sjcl.codec.base64.fromBits(obj[i], 0) + "\"";
					break;
				default: throw new sjcl.exception.bug("json encode: unsupported type");
			}
		}
		return out + "}";
	},
	/** Decode a simple (flat) JSON string into a structure.  The ciphertext,
	* adata, salt and iv will be base64-decoded.
	* @param {String} str The string.
	* @return {Object} The decoded structure.
	* @throws {sjcl.exception.invalid} if str isn't (simple) JSON.
	*/
	decode: function(str) {
		str = str.replace(/\s/g, "");
		if (!str.match(/^\{.*\}$/)) throw new sjcl.exception.invalid("json decode: this isn't json!");
		var a = str.replace(/^\{|\}$/g, "").split(/,/), out = {}, i = 0, m;
		for (; i < a.length; i++) {
			if (!(m = a[i].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))) throw new sjcl.exception.invalid("json decode: this isn't json!");
			if (m[3] != null) out[m[2]] = parseInt(m[3], 10);
			else if (m[4] != null) out[m[2]] = m[2].match(/^(ct|adata|salt|iv)$/) ? sjcl.codec.base64.toBits(m[4]) : unescape(m[4]);
			else if (m[5] != null) out[m[2]] = m[5] === "true";
		}
		return out;
	},
	/** Insert all elements of src into target, modifying and returning target.
	* @param {Object} target The object to be modified.
	* @param {Object} src The object to pull data from.
	* @param {boolean} [requireSame=false] If true, throw an exception if any field of target differs from corresponding field of src.
	* @return {Object} target.
	* @private
	*/
	_add: function(target, src, requireSame) {
		if (target === void 0) target = {};
		if (src === void 0) return target;
		var i;
		for (i in src) if (src.hasOwnProperty(i)) {
			if (requireSame && target[i] !== void 0 && target[i] !== src[i]) throw new sjcl.exception.invalid("required parameter overridden");
			target[i] = src[i];
		}
		return target;
	},
	/** Remove all elements of minus from plus.  Does not modify plus.
	* @private
	*/
	_subtract: function(plus, minus) {
		var out = {}, i;
		for (i in plus) if (plus.hasOwnProperty(i) && plus[i] !== minus[i]) out[i] = plus[i];
		return out;
	},
	/** Return only the specified elements of src.
	* @private
	*/
	_filter: function(src, filter) {
		var out = {}, i = 0;
		for (; i < filter.length; i++) if (src[filter[i]] !== void 0) out[filter[i]] = src[filter[i]];
		return out;
	}
};
/** Simple encryption function; convenient shorthand for sjcl.json.encrypt.
* @param {String|bitArray} password The password or key.
* @param {String} plaintext The data to encrypt.
* @param {Object} [params] The parameters including tag, iv and salt.
* @param {Object} [rp] A returned version with filled-in parameters.
* @return {String} The ciphertext.
*/
sjcl.encrypt = sjcl.json.encrypt;
/** Simple decryption function; convenient shorthand for sjcl.json.decrypt.
* @param {String|bitArray} password The password or key.
* @param {String} ciphertext The ciphertext to decrypt.
* @param {Object} [params] Additional non-default parameters.
* @param {Object} [rp] A returned object with filled parameters.
* @return {String} The plaintext.
*/
sjcl.decrypt = sjcl.json.decrypt;
/** The cache for cachedPbkdf2.
* @private
*/
sjcl.misc._pbkdf2Cache = {};
/** Cached PBKDF2 key derivation.
* @param {String} password The password.
* @param {Object} [obj] The derivation params (iteration count and optional salt).
* @return {Object} The derived data in key, the salt in salt.
*/
sjcl.misc.cachedPbkdf2 = function(password, obj) {
	var cache = sjcl.misc._pbkdf2Cache, c, cp, salt, iter;
	obj = obj || {};
	iter = obj.iter || 1e3;
	cp = cache[password] = cache[password] || {};
	c = cp[iter] = cp[iter] || { firstSalt: obj.salt && obj.salt.length ? obj.salt.slice(0) : sjcl.random.randomWords(2, 0) };
	salt = obj.salt === void 0 ? c.firstSalt : obj.salt;
	c[salt] = c[salt] || sjcl.misc.pbkdf2(password, salt, obj.iter);
	return {
		key: c[salt].slice(0),
		salt: salt.slice(0)
	};
};
/**
* Constructs a new bignum from another bignum, a number or a hex string.
* @constructor
*/
sjcl.bn = function(it) {
	this.initWith(it);
};
sjcl.bn.prototype = {
	radix: 24,
	maxMul: 8,
	_class: sjcl.bn,
	copy: function() {
		return new this._class(this);
	},
	/**
	* Initializes this with it, either as a bn, a number, or a hex string.
	*/
	initWith: function(it) {
		var i = 0, k;
		switch (typeof it) {
			case "object":
				this.limbs = it.limbs.slice(0);
				break;
			case "number":
				this.limbs = [it];
				this.normalize();
				break;
			case "string":
				it = it.replace(/^0x/, "");
				this.limbs = [];
				k = this.radix / 4;
				for (i = 0; i < it.length; i += k) this.limbs.push(parseInt(it.substring(Math.max(it.length - i - k, 0), it.length - i), 16));
				break;
			default: this.limbs = [0];
		}
		return this;
	},
	/**
	* Returns true if "this" and "that" are equal.  Calls fullReduce().
	* Equality test is in constant time.
	*/
	equals: function(that) {
		if (typeof that === "number") that = new this._class(that);
		var difference = 0, i;
		this.fullReduce();
		that.fullReduce();
		for (i = 0; i < this.limbs.length || i < that.limbs.length; i++) difference |= this.getLimb(i) ^ that.getLimb(i);
		return difference === 0;
	},
	/**
	* Get the i'th limb of this, zero if i is too large.
	*/
	getLimb: function(i) {
		return i >= this.limbs.length ? 0 : this.limbs[i];
	},
	/**
	* Constant time comparison function.
	* Returns 1 if this >= that, or zero otherwise.
	*/
	greaterEquals: function(that) {
		if (typeof that === "number") that = new this._class(that);
		var less = 0, greater = 0, i = Math.max(this.limbs.length, that.limbs.length) - 1, a, b;
		for (; i >= 0; i--) {
			a = this.getLimb(i);
			b = that.getLimb(i);
			greater |= b - a & ~less;
			less |= a - b & ~greater;
		}
		return (greater | ~less) >>> 31;
	},
	/**
	* Convert to a hex string.
	*/
	toString: function() {
		this.fullReduce();
		var out = "", i, s, l = this.limbs;
		for (i = 0; i < this.limbs.length; i++) {
			s = l[i].toString(16);
			while (i < this.limbs.length - 1 && s.length < 6) s = "0" + s;
			out = s + out;
		}
		return "0x" + out;
	},
	/** this += that.  Does not normalize. */
	addM: function(that) {
		if (typeof that !== "object") that = new this._class(that);
		var i, l = this.limbs, ll = that.limbs;
		for (i = l.length; i < ll.length; i++) l[i] = 0;
		for (i = 0; i < ll.length; i++) l[i] += ll[i];
		return this;
	},
	/** this *= 2.  Requires normalized; ends up normalized. */
	doubleM: function() {
		var i, carry = 0, tmp, r = this.radix, m = this.radixMask, l = this.limbs;
		for (i = 0; i < l.length; i++) {
			tmp = l[i];
			tmp = tmp + tmp + carry;
			l[i] = tmp & m;
			carry = tmp >> r;
		}
		if (carry) l.push(carry);
		return this;
	},
	/** this /= 2, rounded down.  Requires normalized; ends up normalized. */
	halveM: function() {
		var i, carry = 0, tmp, r = this.radix, l = this.limbs;
		for (i = l.length - 1; i >= 0; i--) {
			tmp = l[i];
			l[i] = tmp + carry >> 1;
			carry = (tmp & 1) << r;
		}
		if (!l[l.length - 1]) l.pop();
		return this;
	},
	/** this -= that.  Does not normalize. */
	subM: function(that) {
		if (typeof that !== "object") that = new this._class(that);
		var i, l = this.limbs, ll = that.limbs;
		for (i = l.length; i < ll.length; i++) l[i] = 0;
		for (i = 0; i < ll.length; i++) l[i] -= ll[i];
		return this;
	},
	mod: function(that) {
		var neg = !this.greaterEquals(new sjcl.bn(0));
		that = new sjcl.bn(that).normalize();
		var out = new sjcl.bn(this).normalize(), ci = 0;
		if (neg) out = new sjcl.bn(0).subM(out).normalize();
		for (; out.greaterEquals(that); ci++) that.doubleM();
		if (neg) out = that.sub(out).normalize();
		for (; ci > 0; ci--) {
			that.halveM();
			if (out.greaterEquals(that)) out.subM(that).normalize();
		}
		return out.trim();
	},
	/** return inverse mod prime p.  p must be odd. Binary extended Euclidean algorithm mod p. */
	inverseMod: function(p) {
		var a = new sjcl.bn(1), b = new sjcl.bn(0), x = new sjcl.bn(this), y = new sjcl.bn(p), tmp, i, nz = 1;
		if (!(p.limbs[0] & 1)) throw new sjcl.exception.invalid("inverseMod: p must be odd");
		do {
			if (x.limbs[0] & 1) {
				if (!x.greaterEquals(y)) {
					tmp = x;
					x = y;
					y = tmp;
					tmp = a;
					a = b;
					b = tmp;
				}
				x.subM(y);
				x.normalize();
				if (!a.greaterEquals(b)) a.addM(p);
				a.subM(b);
			}
			x.halveM();
			if (a.limbs[0] & 1) a.addM(p);
			a.normalize();
			a.halveM();
			for (i = nz = 0; i < x.limbs.length; i++) nz |= x.limbs[i];
		} while (nz);
		if (!y.equals(1)) throw new sjcl.exception.invalid("inverseMod: p and x must be relatively prime");
		return b;
	},
	/** this + that.  Does not normalize. */
	add: function(that) {
		return this.copy().addM(that);
	},
	/** this - that.  Does not normalize. */
	sub: function(that) {
		return this.copy().subM(that);
	},
	/** this * that.  Normalizes and reduces. */
	mul: function(that) {
		if (typeof that === "number") that = new this._class(that);
		else that.normalize();
		this.normalize();
		var i, j, a = this.limbs, b = that.limbs, al = a.length, bl = b.length, out = new this._class(), c = out.limbs, ai, ii = this.maxMul;
		for (i = 0; i < this.limbs.length + that.limbs.length + 1; i++) c[i] = 0;
		for (i = 0; i < al; i++) {
			ai = a[i];
			for (j = 0; j < bl; j++) c[i + j] += ai * b[j];
			if (!--ii) {
				ii = this.maxMul;
				out.cnormalize();
			}
		}
		return out.cnormalize().reduce();
	},
	/** this ^ 2.  Normalizes and reduces. */
	square: function() {
		return this.mul(this);
	},
	/** this ^ n.  Uses square-and-multiply.  Normalizes and reduces. */
	power: function(l) {
		l = new sjcl.bn(l).normalize().trim().limbs;
		var i, j, out = new this._class(1), pow = this;
		for (i = 0; i < l.length; i++) for (j = 0; j < this.radix; j++) {
			if (l[i] & 1 << j) out = out.mul(pow);
			if (i == l.length - 1 && l[i] >> j + 1 == 0) break;
			pow = pow.square();
		}
		return out;
	},
	/** this * that mod N */
	mulmod: function(that, N) {
		return this.mod(N).mul(that.mod(N)).mod(N);
	},
	/** this ^ x mod N */
	powermod: function(x, N) {
		x = new sjcl.bn(x);
		N = new sjcl.bn(N);
		if ((N.limbs[0] & 1) == 1) {
			var montOut = this.montpowermod(x, N);
			if (montOut != false) return montOut;
		}
		var i, j, l = x.normalize().trim().limbs, out = new this._class(1), pow = this;
		for (i = 0; i < l.length; i++) for (j = 0; j < this.radix; j++) {
			if (l[i] & 1 << j) out = out.mulmod(pow, N);
			if (i == l.length - 1 && l[i] >> j + 1 == 0) break;
			pow = pow.mulmod(pow, N);
		}
		return out;
	},
	/** this ^ x mod N with Montomery reduction */
	montpowermod: function(x, N) {
		x = new sjcl.bn(x).normalize().trim();
		N = new sjcl.bn(N);
		var i, j, radix = this.radix, out = new this._class(1), pow = this.copy();
		var R, s, wind, bitsize = x.bitLength();
		R = new sjcl.bn({ limbs: N.copy().normalize().trim().limbs.map(function() {
			return 0;
		}) });
		for (s = this.radix; s > 0; s--) if ((N.limbs[N.limbs.length - 1] >> s & 1) == 1) {
			R.limbs[R.limbs.length - 1] = 1 << s;
			break;
		}
		if (bitsize == 0) return this;
		else if (bitsize < 18) wind = 1;
		else if (bitsize < 48) wind = 3;
		else if (bitsize < 144) wind = 4;
		else if (bitsize < 768) wind = 5;
		else wind = 6;
		var RR = R.copy(), NN = N.copy(), RP = new sjcl.bn(1), NP = new sjcl.bn(0), RT = R.copy();
		while (RT.greaterEquals(1)) {
			RT.halveM();
			if ((RP.limbs[0] & 1) == 0) {
				RP.halveM();
				NP.halveM();
			} else {
				RP.addM(NN);
				RP.halveM();
				NP.halveM();
				NP.addM(RR);
			}
		}
		RP = RP.normalize();
		NP = NP.normalize();
		RR.doubleM();
		var R2 = RR.mulmod(RR, N);
		if (!RR.mul(RP).sub(N.mul(NP)).equals(1)) return false;
		var montIn = function(c) {
			return montMul(c, R2);
		}, montMul = function(a, b) {
			var k, ab, right, abBar, mask = (1 << s + 1) - 1;
			ab = a.mul(b);
			right = ab.mul(NP);
			right.limbs = right.limbs.slice(0, R.limbs.length);
			if (right.limbs.length == R.limbs.length) right.limbs[R.limbs.length - 1] &= mask;
			right = right.mul(N);
			abBar = ab.add(right).normalize().trim();
			abBar.limbs = abBar.limbs.slice(R.limbs.length - 1);
			for (k = 0; k < abBar.limbs.length; k++) {
				if (k > 0) abBar.limbs[k - 1] |= (abBar.limbs[k] & mask) << radix - s - 1;
				abBar.limbs[k] = abBar.limbs[k] >> s + 1;
			}
			if (abBar.greaterEquals(N)) abBar.subM(N);
			return abBar;
		}, montOut = function(c) {
			return montMul(c, 1);
		};
		pow = montIn(pow);
		out = montIn(out);
		var h, precomp = {}, cap = (1 << wind - 1) - 1;
		precomp[1] = pow.copy();
		precomp[2] = montMul(pow, pow);
		for (h = 1; h <= cap; h++) precomp[2 * h + 1] = montMul(precomp[2 * h - 1], precomp[2]);
		var getBit = function(exp, i) {
			var off = i % exp.radix;
			return (exp.limbs[Math.floor(i / exp.radix)] & 1 << off) >> off;
		};
		for (i = x.bitLength() - 1; i >= 0;) if (getBit(x, i) == 0) {
			out = montMul(out, out);
			i = i - 1;
		} else {
			var l = i - wind + 1;
			while (getBit(x, l) == 0) l++;
			var indx = 0;
			for (j = l; j <= i; j++) {
				indx += getBit(x, j) << j - l;
				out = montMul(out, out);
			}
			out = montMul(out, precomp[indx]);
			i = l - 1;
		}
		return montOut(out);
	},
	trim: function() {
		var l = this.limbs, p;
		do
			p = l.pop();
		while (l.length && p === 0);
		l.push(p);
		return this;
	},
	/** Reduce mod a modulus.  Stubbed for subclassing. */
	reduce: function() {
		return this;
	},
	/** Reduce and normalize. */
	fullReduce: function() {
		return this.normalize();
	},
	/** Propagate carries. */
	normalize: function() {
		var carry = 0, i, pv = this.placeVal, ipv = this.ipv, l, m, limbs = this.limbs, ll = limbs.length, mask = this.radixMask;
		for (i = 0; i < ll || carry !== 0 && carry !== -1; i++) {
			l = (limbs[i] || 0) + carry;
			m = limbs[i] = l & mask;
			carry = (l - m) * ipv;
		}
		if (carry === -1) limbs[i - 1] -= pv;
		this.trim();
		return this;
	},
	/** Constant-time normalize. Does not allocate additional space. */
	cnormalize: function() {
		var carry = 0, i, ipv = this.ipv, l, m, limbs = this.limbs, ll = limbs.length, mask = this.radixMask;
		for (i = 0; i < ll - 1; i++) {
			l = limbs[i] + carry;
			m = limbs[i] = l & mask;
			carry = (l - m) * ipv;
		}
		limbs[i] += carry;
		return this;
	},
	/** Serialize to a bit array */
	toBits: function(len) {
		this.fullReduce();
		len = len || this.exponent || this.bitLength();
		var i = Math.floor((len - 1) / 24), w = sjcl.bitArray, e = (len + 7 & -8) % this.radix || this.radix, out = [w.partial(e, this.getLimb(i))];
		for (i--; i >= 0; i--) {
			out = w.concat(out, [w.partial(Math.min(this.radix, len), this.getLimb(i))]);
			len -= this.radix;
		}
		return out;
	},
	/** Return the length in bits, rounded up to the nearest byte. */
	bitLength: function() {
		this.fullReduce();
		var out = this.radix * (this.limbs.length - 1), b = this.limbs[this.limbs.length - 1];
		for (; b; b >>>= 1) out++;
		return out + 7 & -8;
	}
};
/** @memberOf sjcl.bn
* @this { sjcl.bn }
*/
sjcl.bn.fromBits = function(bits) {
	var out = new this(), words = [], w = sjcl.bitArray, t = this.prototype, l = Math.min(this.bitLength || 4294967296, w.bitLength(bits)), e = l % t.radix || t.radix;
	words[0] = w.extract(bits, 0, e);
	for (; e < l; e += t.radix) words.unshift(w.extract(bits, e, t.radix));
	out.limbs = words;
	return out;
};
sjcl.bn.prototype.ipv = 1 / (sjcl.bn.prototype.placeVal = Math.pow(2, sjcl.bn.prototype.radix));
sjcl.bn.prototype.radixMask = (1 << sjcl.bn.prototype.radix) - 1;
/**
* Creates a new subclass of bn, based on reduction modulo a pseudo-Mersenne prime,
* i.e. a prime of the form 2^e + sum(a * 2^b),where the sum is negative and sparse.
*/
sjcl.bn.pseudoMersennePrime = function(exponent, coeff) {
	/** @constructor
	* @private
	*/
	function p(it) {
		this.initWith(it);
	}
	var ppr = p.prototype = new sjcl.bn(), i, tmp, mo = ppr.modOffset = Math.ceil(tmp = exponent / ppr.radix);
	ppr.exponent = exponent;
	ppr.offset = [];
	ppr.factor = [];
	ppr.minOffset = mo;
	ppr.fullMask = 0;
	ppr.fullOffset = [];
	ppr.fullFactor = [];
	ppr.modulus = p.modulus = new sjcl.bn(Math.pow(2, exponent));
	ppr.fullMask = 0 | -Math.pow(2, exponent % ppr.radix);
	for (i = 0; i < coeff.length; i++) {
		ppr.offset[i] = Math.floor(coeff[i][0] / ppr.radix - tmp);
		ppr.fullOffset[i] = Math.floor(coeff[i][0] / ppr.radix) - mo + 1;
		ppr.factor[i] = coeff[i][1] * Math.pow(1 / 2, exponent - coeff[i][0] + ppr.offset[i] * ppr.radix);
		ppr.fullFactor[i] = coeff[i][1] * Math.pow(1 / 2, exponent - coeff[i][0] + ppr.fullOffset[i] * ppr.radix);
		ppr.modulus.addM(new sjcl.bn(Math.pow(2, coeff[i][0]) * coeff[i][1]));
		ppr.minOffset = Math.min(ppr.minOffset, -ppr.offset[i]);
	}
	ppr._class = p;
	ppr.modulus.cnormalize();
	/** Approximate reduction mod p.  May leave a number which is negative or slightly larger than p.
	* @memberof sjcl.bn
	* @this { sjcl.bn }
	*/
	ppr.reduce = function() {
		var i, k, l, mo = this.modOffset, limbs = this.limbs, off = this.offset, ol = this.offset.length, fac = this.factor, ll;
		i = this.minOffset;
		while (limbs.length > mo) {
			l = limbs.pop();
			ll = limbs.length;
			for (k = 0; k < ol; k++) limbs[ll + off[k]] -= fac[k] * l;
			i--;
			if (!i) {
				limbs.push(0);
				this.cnormalize();
				i = this.minOffset;
			}
		}
		this.cnormalize();
		return this;
	};
	/** @memberof sjcl.bn
	* @this { sjcl.bn }
	*/
	ppr._strongReduce = ppr.fullMask === -1 ? ppr.reduce : function() {
		var limbs = this.limbs, i = limbs.length - 1, k, l;
		this.reduce();
		if (i === this.modOffset - 1) {
			l = limbs[i] & this.fullMask;
			limbs[i] -= l;
			for (k = 0; k < this.fullOffset.length; k++) limbs[i + this.fullOffset[k]] -= this.fullFactor[k] * l;
			this.normalize();
		}
	};
	/** mostly constant-time, very expensive full reduction.
	* @memberof sjcl.bn
	* @this { sjcl.bn }
	*/
	ppr.fullReduce = function() {
		var greater, i;
		this._strongReduce();
		this.addM(this.modulus);
		this.addM(this.modulus);
		this.normalize();
		this._strongReduce();
		for (i = this.limbs.length; i < this.modOffset; i++) this.limbs[i] = 0;
		greater = this.greaterEquals(this.modulus);
		for (i = 0; i < this.limbs.length; i++) this.limbs[i] -= this.modulus.limbs[i] * greater;
		this.cnormalize();
		return this;
	};
	/** @memberof sjcl.bn
	* @this { sjcl.bn }
	*/
	ppr.inverse = function() {
		return this.power(this.modulus.sub(2));
	};
	p.fromBits = sjcl.bn.fromBits;
	return p;
};
var sbp = sjcl.bn.pseudoMersennePrime;
sjcl.bn.prime = {
	p127: sbp(127, [[0, -1]]),
	p25519: sbp(255, [[0, -19]]),
	p192k: sbp(192, [
		[32, -1],
		[12, -1],
		[8, -1],
		[7, -1],
		[6, -1],
		[3, -1],
		[0, -1]
	]),
	p224k: sbp(224, [
		[32, -1],
		[12, -1],
		[11, -1],
		[9, -1],
		[7, -1],
		[4, -1],
		[1, -1],
		[0, -1]
	]),
	p256k: sbp(256, [
		[32, -1],
		[9, -1],
		[8, -1],
		[7, -1],
		[6, -1],
		[4, -1],
		[0, -1]
	]),
	p192: sbp(192, [[0, -1], [64, -1]]),
	p224: sbp(224, [[0, 1], [96, -1]]),
	p256: sbp(256, [
		[0, -1],
		[96, 1],
		[192, 1],
		[224, -1]
	]),
	p384: sbp(384, [
		[0, -1],
		[32, 1],
		[96, -1],
		[128, -1]
	]),
	p521: sbp(521, [[0, -1]])
};
sjcl.bn.random = function(modulus, paranoia) {
	if (typeof modulus !== "object") modulus = new sjcl.bn(modulus);
	var words, i, l = modulus.limbs.length, m = modulus.limbs[l - 1] + 1, out = new sjcl.bn();
	while (true) {
		do {
			words = sjcl.random.randomWords(l, paranoia);
			if (words[l - 1] < 0) words[l - 1] += 4294967296;
		} while (Math.floor(words[l - 1] / m) === Math.floor(4294967296 / m));
		words[l - 1] %= m;
		for (i = 0; i < l - 1; i++) words[i] &= modulus.radixMask;
		out.limbs = words;
		if (!out.greaterEquals(modulus)) return out;
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Marco Munizaga
*/
if (typeof ArrayBuffer === "undefined") (function(globals) {
	"use strict";
	globals.ArrayBuffer = function() {};
	globals.DataView = function() {};
})(void 0);
/**
* ArrayBuffer
* @namespace
*/
sjcl.codec.arrayBuffer = {
	/** Convert from a bitArray to an ArrayBuffer.
	* Will default to 8byte padding if padding is undefined*/
	fromBits: function(arr, padding, padding_count) {
		var out, i, ol, tmp, smallest;
		padding = padding == void 0 ? true : padding;
		padding_count = padding_count || 8;
		if (arr.length === 0) return /* @__PURE__ */ new ArrayBuffer(0);
		ol = sjcl.bitArray.bitLength(arr) / 8;
		if (sjcl.bitArray.bitLength(arr) % 8 !== 0) throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly");
		if (padding && ol % padding_count !== 0) ol += padding_count - ol % padding_count;
		tmp = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(arr.length * 4));
		for (i = 0; i < arr.length; i++) tmp.setUint32(i * 4, arr[i] << 32);
		out = new DataView(new ArrayBuffer(ol));
		if (out.byteLength === tmp.byteLength) return tmp.buffer;
		smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength;
		for (i = 0; i < smallest; i++) out.setUint8(i, tmp.getUint8(i));
		return out.buffer;
	},
	/** Convert from an ArrayBuffer to a bitArray. */
	toBits: function(buffer) {
		var i, out = [], len, inView, tmp;
		if (buffer.byteLength === 0) return [];
		inView = new DataView(buffer);
		len = inView.byteLength - inView.byteLength % 4;
		for (var i = 0; i < len; i += 4) out.push(inView.getUint32(i));
		if (inView.byteLength % 4 != 0) {
			tmp = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(4));
			for (var i = 0, l = inView.byteLength % 4; i < l; i++) tmp.setUint8(i + 4 - l, inView.getUint8(len + i));
			out.push(sjcl.bitArray.partial(inView.byteLength % 4 * 8, tmp.getUint32(0)));
		}
		return out;
	},
	/** Prints a hex output of the buffer contents, akin to hexdump **/
	hexDumpBuffer: function(buffer) {
		var stringBufferView = new DataView(buffer);
		var string = "";
		var pad = function(n, width) {
			n = n + "";
			return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
		};
		for (var i = 0; i < stringBufferView.byteLength; i += 2) {
			if (i % 16 == 0) string += "\n" + i.toString(16) + "	";
			string += pad(stringBufferView.getUint16(i).toString(16), 4) + " ";
		}
		console.log(string.toUpperCase());
	}
};
//#endregion
//#region node_modules/.pnpm/@cloudflare+blindrsa-ts@0.4.6/node_modules/@cloudflare/blindrsa-ts/lib/src/util.js
function assertNever(name, x) {
	throw new Error(`unexpected ${name} identifier: ${x}`);
}
function getHashParams(hash) {
	switch (hash) {
		case "SHA-1": return {
			name: hash,
			hLen: 20
		};
		case "SHA-256": return {
			name: hash,
			hLen: 32
		};
		case "SHA-384": return {
			name: hash,
			hLen: 48
		};
		case "SHA-512": return {
			name: hash,
			hLen: 64
		};
		default: assertNever("Hash", hash);
	}
}
function os2ip(bytes) {
	return sjcl.bn.fromBits(sjcl.codec.bytes.toBits(Array.from(bytes)));
}
function i2osp(num, byteLength) {
	if (Math.ceil(num.bitLength() / 8) > byteLength) throw new Error(`number does not fit in ${byteLength} bytes`);
	const bytes = new Uint8Array(byteLength);
	const unpadded = new Uint8Array(sjcl.codec.bytes.fromBits(num.toBits(void 0)));
	bytes.set(unpadded, byteLength - unpadded.length);
	return bytes;
}
function joinAll(a) {
	let size = 0;
	for (const ai of a) size += ai.length;
	const ret = new Uint8Array(new ArrayBuffer(size));
	let offset = 0;
	for (const ai of a) {
		ret.set(ai, offset);
		offset += ai.length;
	}
	return ret;
}
function xor(a, b) {
	if (a.length !== b.length || a.length === 0) throw new Error(`arrays of different length: ${a.length} - ${b.length}`);
	const ai = a[Symbol.iterator]();
	const bi = b[Symbol.iterator]();
	return new Uint8Array(a.length).map(() => ai.next().value ^ bi.next().value);
}
function incCounter(c) {
	c[3]++;
	if (c[3] != 0) return;
	c[2]++;
	if (c[2] != 0) return;
	c[1]++;
	if (c[1] != 0) return;
	c[0]++;
}
async function mgf1(h, seed, mLen) {
	const n = Math.ceil(mLen / h.hLen);
	if (n > Math.pow(2, 32)) throw new Error("mask too long");
	let T = /* @__PURE__ */ new Uint8Array();
	const counter = /* @__PURE__ */ new Uint8Array(4);
	for (let i = 0; i < n; i++) {
		const hash = new Uint8Array(await crypto.subtle.digest(h.name, joinAll([seed, counter]).slice().buffer));
		T = joinAll([T, hash]);
		incCounter(counter);
	}
	return T.subarray(0, mLen);
}
async function emsa_pss_encode(msg, emBits, opts, mgf = mgf1) {
	const { hash, sLen } = opts;
	const hashParams = getHashParams(hash);
	const { hLen } = hashParams;
	const emLen = Math.ceil(emBits / 8);
	const mHash = new Uint8Array(await crypto.subtle.digest(hash, msg.slice().buffer));
	if (emLen < hLen + sLen + 2) throw new Error("encoding error");
	const salt = crypto.getRandomValues(new Uint8Array(sLen));
	const mPrime = joinAll([
		/* @__PURE__ */ new Uint8Array(8),
		mHash,
		salt
	]);
	const h = new Uint8Array(await crypto.subtle.digest(hash, mPrime.slice().buffer));
	const maskedDB = xor(joinAll([
		new Uint8Array(emLen - sLen - hLen - 2),
		Uint8Array.of(1),
		salt
	]), await mgf(hashParams, h, emLen - hLen - 1));
	maskedDB[0] &= 255 >> 8 * emLen - emBits;
	return joinAll([
		maskedDB,
		h,
		Uint8Array.of(188)
	]);
}
function rsavp1(pkS, s) {
	if (!s.greaterEquals(new sjcl.bn(0)) || s.greaterEquals(pkS.n)) throw new Error("signature representative out of range");
	return s.powermod(pkS.e, pkS.n);
}
function rsasp1(skS, m) {
	if (!m.greaterEquals(new sjcl.bn(0)) || m.greaterEquals(skS.n)) throw new Error("signature representative out of range");
	return m.powermod(skS.d, skS.n);
}
function is_coprime(x, n) {
	try {
		x.inverseMod(n);
	} catch {
		return false;
	}
	return true;
}
function random_integer_uniform(n, kLen) {
	const MAX_NUM_TRIES = 128;
	for (let i = 0; i < MAX_NUM_TRIES; i++) {
		const r = os2ip(crypto.getRandomValues(new Uint8Array(kLen)));
		if (!(r.greaterEquals(n) || r.equals(0))) return r;
	}
	throw new Error("reached maximum tries for random integer generation");
}
var NATIVE_SUPPORT_NAME = "RSA-RAW";
async function rsaRawBlingSign(privateKey, blindMsg) {
	if (privateKey.algorithm.name !== "RSA-RAW") privateKey = await crypto.subtle.importKey("pkcs8", await crypto.subtle.exportKey("pkcs8", privateKey), {
		...privateKey.algorithm,
		name: NATIVE_SUPPORT_NAME
	}, privateKey.extractable, privateKey.usages);
	const signature = await crypto.subtle.sign({ name: privateKey.algorithm.name }, privateKey, blindMsg.slice().buffer);
	return new Uint8Array(signature);
}
//#endregion
//#region node_modules/.pnpm/@cloudflare+blindrsa-ts@0.4.6/node_modules/@cloudflare/blindrsa-ts/lib/src/blindrsa.js
var PrepareType;
(function(PrepareType) {
	PrepareType[PrepareType["Deterministic"] = 0] = "Deterministic";
	PrepareType[PrepareType["Randomized"] = 32] = "Randomized";
})(PrepareType || (PrepareType = {}));
var BlindRSA = class BlindRSA {
	params;
	static NAME = "RSA-PSS";
	constructor(params) {
		this.params = params;
		switch (params.prepareType) {
			case PrepareType.Deterministic:
			case PrepareType.Randomized: return;
			default: assertNever("PrepareType", params.prepareType);
		}
	}
	toString() {
		return `RSABSSA-${this.params.hash.replace("-", "")}-${"PSS" + (this.params.saltLength === 0 ? "ZERO" : "")}-${PrepareType[this.params.prepareType]}`;
	}
	prepare(msg) {
		const msg_prefix_len = this.params.prepareType;
		return joinAll([crypto.getRandomValues(new Uint8Array(msg_prefix_len)), msg]);
	}
	async extractKeyParams(key, type) {
		if (key.type !== type || key.algorithm.name !== BlindRSA.NAME) throw new Error(`key is not ${BlindRSA.NAME}`);
		if (!key.extractable) throw new Error("key is not extractable");
		const { modulusLength: modulusLengthBits, hash: hashFn } = key.algorithm;
		const modulusLengthBytes = Math.ceil(modulusLengthBits / 8);
		const hash = hashFn.name;
		if (hash.toLowerCase() !== this.params.hash.toLowerCase()) throw new Error(`hash is not ${this.params.hash}`);
		return {
			jwkKey: await crypto.subtle.exportKey("jwk", key),
			modulusLengthBits,
			modulusLengthBytes,
			hash
		};
	}
	async blind(publicKey, msg) {
		const { jwkKey, modulusLengthBits: modulusLength, modulusLengthBytes: kLen, hash } = await this.extractKeyParams(publicKey, "public");
		if (!jwkKey.n || !jwkKey.e) throw new Error("key has invalid parameters");
		const n = sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.n));
		const pk = {
			e: sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.e)),
			n
		};
		const opts = {
			sLen: this.params.saltLength,
			hash
		};
		const m = os2ip(await emsa_pss_encode(msg, modulusLength - 1, opts));
		if (!is_coprime(m, n)) throw new Error("invalid input");
		const r = random_integer_uniform(n, kLen);
		let inv;
		try {
			inv = i2osp(r.inverseMod(n), kLen);
		} catch (e) {
			throw new Error(`blinding error: ${e.toString()}`);
		}
		const x = rsavp1(pk, r);
		return {
			blindedMsg: i2osp(m.mulmod(x, n), kLen),
			inv
		};
	}
	async blindSign(privateKey, blindMsg) {
		if (this.params.supportsRSARAW) return rsaRawBlingSign(privateKey, blindMsg);
		const { jwkKey, modulusLengthBytes: kLen } = await this.extractKeyParams(privateKey, "private");
		if (!jwkKey.n || !jwkKey.d || !jwkKey.e) throw new Error("key has invalid parameters");
		const n = sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.n));
		const d = sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.d));
		const e = sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.e));
		const sk = {
			n,
			d
		};
		const pk = {
			n,
			e
		};
		const m = os2ip(blindMsg);
		const s = rsasp1(sk, m);
		const mp = rsavp1(pk, s);
		if (!m.equals(mp)) throw new Error("signing failure");
		return i2osp(s, kLen);
	}
	async finalize(publicKey, msg, blindSig, inv) {
		const { jwkKey, modulusLengthBytes: kLen } = await this.extractKeyParams(publicKey, "public");
		if (!jwkKey.n) throw new Error("key has invalid parameters");
		const n = sjcl.bn.fromBits(sjcl.codec.base64url.toBits(jwkKey.n));
		if (inv.length != kLen) throw new Error("unexpected input size");
		const rInv = os2ip(inv);
		if (blindSig.length != kLen) throw new Error("unexpected input size");
		const sig = i2osp(os2ip(blindSig).mulmod(rInv, n), kLen);
		const algorithm = {
			name: BlindRSA.NAME,
			saltLength: this.params.saltLength
		};
		if (!await crypto.subtle.verify(algorithm, publicKey, sig.slice().buffer, msg.slice().buffer)) throw new Error("invalid signature");
		return sig;
	}
	static generateKey(algorithm) {
		return crypto.subtle.generateKey({
			...algorithm,
			name: BlindRSA.NAME
		}, true, ["sign", "verify"]);
	}
	generateKey(algorithm) {
		return BlindRSA.generateKey({
			...algorithm,
			hash: this.params.hash
		});
	}
	verify(publicKey, signature, message) {
		return crypto.subtle.verify({
			name: BlindRSA.NAME,
			saltLength: this.params.saltLength
		}, publicKey, signature.slice().buffer, message.slice().buffer);
	}
};
//#endregion
//#region node_modules/.pnpm/@cloudflare+blindrsa-ts@0.4.6/node_modules/@cloudflare/blindrsa-ts/lib/src/index.js
var Params = {
	RSABSSA_SHA384_PSS_Randomized: {
		name: "RSABSSA-SHA384-PSS-Randomized",
		hash: "SHA-384",
		saltLength: 48,
		prepareType: PrepareType.Randomized
	},
	RSABSSA_SHA384_PSS_Deterministic: {
		name: "RSABSSA-SHA384-PSS-Deterministic",
		hash: "SHA-384",
		saltLength: 48,
		prepareType: PrepareType.Deterministic
	},
	RSABSSA_SHA384_PSSZERO_Randomized: {
		name: "RSABSSA-SHA384-PSSZERO-Randomized",
		hash: "SHA-384",
		saltLength: 0,
		prepareType: PrepareType.Randomized
	},
	RSABSSA_SHA384_PSSZERO_Deterministic: {
		name: "RSABSSA-SHA384-PSSZERO-Deterministic",
		hash: "SHA-384",
		saltLength: 0,
		prepareType: PrepareType.Deterministic
	},
	RSAPBSSA_SHA384_PSS_Randomized: {
		name: "RSAPBSSA-SHA384-PSS-Randomized",
		hash: "SHA-384",
		saltLength: 48,
		prepareType: PrepareType.Randomized
	},
	RSAPBSSA_SHA384_PSS_Deterministic: {
		name: "RSAPBSSA-SHA384-PSS-Deterministic",
		hash: "SHA-384",
		saltLength: 48,
		prepareType: PrepareType.Deterministic
	},
	RSAPBSSA_SHA384_PSSZERO_Randomized: {
		name: "RSAPBSSA-SHA384-PSSZERO-Randomized",
		hash: "SHA-384",
		saltLength: 0,
		prepareType: PrepareType.Randomized
	},
	RSAPBSSA_SHA384_PSSZERO_Deterministic: {
		name: "RSAPBSSA-SHA384-PSSZERO-Deterministic",
		hash: "SHA-384",
		saltLength: 0,
		prepareType: PrepareType.Deterministic
	}
};
var RSABSSA = { SHA384: {
	generateKey: (algorithm) => BlindRSA.generateKey({
		...algorithm,
		hash: "SHA-384"
	}),
	PSS: {
		Randomized: (params = { supportsRSARAW: false }) => new BlindRSA({
			...Params.RSABSSA_SHA384_PSS_Randomized,
			...params
		}),
		Deterministic: (params = { supportsRSARAW: false }) => new BlindRSA({
			...Params.RSABSSA_SHA384_PSS_Deterministic,
			...params
		})
	},
	PSSZero: {
		Randomized: (params = { supportsRSARAW: false }) => new BlindRSA({
			...Params.RSABSSA_SHA384_PSSZERO_Randomized,
			...params
		}),
		Deterministic: (params = { supportsRSARAW: false }) => new BlindRSA({
			...Params.RSABSSA_SHA384_PSSZERO_Deterministic,
			...params
		})
	}
} };
//#endregion
//#region packages/core/src/pass.ts
/**
* One-time passes for Super Quant-Rooms (RFC 9474 blind RSA, RSABSSA-SHA384-PSS-Randomized).
*
*   browser                                   Poof
*   msg = prepare(32 random bytes)
*   blinded, inv = blind(key_variant, msg) ─► checks the payment, signs `blinded` without seeing msg
*   sig = finalize(blinded sig, inv)       ◄─ blind signature
*   … later: create the room with (msg, sig) ─► checks sig with key_variant, burns msg
*
* Poof never sees `msg` before it is spent, so it can't tell which payment a room came from.
* There is one key per variant (lifetime × people), so a pass is worth exactly what was paid.
*/
var suite = () => RSABSSA.SHA384.PSS.Randomized();
/** base64url(SHA-256(spki)): a key's id is its fingerprint, so it can't be relabelled. */
async function passKeyId(spki) {
	return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", spki)));
}
async function importPublicKey(spki) {
	return crypto.subtle.importKey("spki", fromBase64Url(spki), {
		name: "RSA-PSS",
		hash: "SHA-384"
	}, true, ["verify"]);
}
/** Pick the key for `variant` from the published list and blind a fresh pass message for it. */
async function startPass(keys, variant) {
	const key = keys.find((k) => k.variant === variantId(variant));
	if (!key) throw new PoofError("pay_unavailable", "This quant-room can't be bought right now.");
	if (await passKeyId(fromBase64Url(key.spki)) !== key.keyId) throw new PoofError("pay_unavailable", "The pass key doesn't match its id.");
	const publicKey = await importPublicKey(key.spki);
	const msg = suite().prepare(randomBytes(32));
	const { blindedMsg, inv } = await suite().blind(publicKey, msg);
	return {
		variant,
		keyId: key.keyId,
		spki: key.spki,
		msg: toBase64Url(msg),
		inv: toBase64Url(inv),
		blindedMsg: toBase64Url(blindedMsg)
	};
}
/** Hex SHA-256 of the blinded message: what the paying wallet signs, so the redemption is bound to it. */
async function blindedHash(pending) {
	const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", fromBase64Url(pending.blindedMsg)));
	return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}
/** Unblind the server's signature into a pass. Throws if the signature isn't valid for the key. */
async function finishPass(pending, blindSignature) {
	const publicKey = await importPublicKey(pending.spki);
	let signature;
	try {
		signature = bytes(await suite().finalize(publicKey, fromBase64Url(pending.msg), fromBase64Url(blindSignature), fromBase64Url(pending.inv)));
	} catch {
		throw new PoofError("pay_failed", "The pass signature didn't check out.");
	}
	return {
		variant: pending.variant,
		keyId: pending.keyId,
		msg: pending.msg,
		signature: toBase64Url(signature)
	};
}
//#endregion
//#region packages/core/src/pay.ts
/**
* Paying for a Super Quant-Room, from the browser:
*
*   1. fetchPayConfig → where to pay, in what, and the pass keys
*   2. startPass (pass.ts) → a blinded pass for the chosen variant; keep it until it's spent
*   3. the wallet sends `transferData(...)` to the token contract (the price, to `config.treasury`)
*   4. the wallet signs `paymentMessage(...)` (personal_sign)
*   5. redeemPayment until it says "ok" (it says "pending" while the transfer confirms) → a Pass
*   6. createRoom({ pass }) or session.upgrade(pass)
*/
async function fetchPayConfig(opts) {
	let res;
	try {
		res = await opts.fetch(`${opts.origin}/api/pay/config`);
	} catch {
		throw new PoofError("connection_failed", "Could not reach the server.");
	}
	if (res.status === 503) throw new PoofError("pay_unavailable", "Super Quant-Rooms can't be bought right now.");
	if (!res.ok) throw new PoofError("connection_failed", `Server error ${res.status}.`);
	const parsed = payConfigSchema.safeParse(await res.json().catch(() => null));
	if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
	return parsed.data;
}
/** ERC-20 `transfer(to, amount)` calldata: what the wallet sends to the token contract. */
function transferData(to, micros) {
	if (!/^0x[0-9a-fA-F]{40}$/.test(to) || !Number.isSafeInteger(micros) || micros <= 0) throw new PoofError("pay_failed", "Not a valid payment.");
	const pad = (hex) => hex.padStart(64, "0");
	return `0xa9059cbb${pad(to.slice(2).toLowerCase())}${pad(micros.toString(16))}`;
}
/**
* ETH only: what to send right now for `variant` on `chain`, at the market price. The payment must
* be mined before `expiresAt`; send `quote` back with the redemption.
*/
async function fetchEthQuote(opts) {
	let res;
	try {
		res = await opts.fetch(`${opts.origin}/api/pay/quote?chain=${opts.chain}&variant=${variantId(opts.variant)}`);
	} catch {
		throw new PoofError("connection_failed", "Could not reach the server.");
	}
	if (!res.ok) throw serverError(res.status, await res.json().catch(() => null));
	const parsed = quoteResponseSchema.safeParse(await res.json().catch(() => null));
	if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
	return parsed.data;
}
/** The text the paying wallet signs: it ties this transaction to this blinded pass. */
async function paymentMessage(chain, txHash, pending) {
	return redeemMessage({
		chain,
		txHash,
		variant: pending.variant,
		blindedHash: await blindedHash(pending)
	});
}
/** Ask Poof to check the payment and sign the pass. Call again while it says "pending". */
async function redeemPayment(opts) {
	let res;
	try {
		res = await opts.fetch(`${opts.origin}/api/pay/redeem`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chain: opts.chain,
				token: opts.token,
				txHash: opts.txHash,
				variant: opts.pending.variant,
				keyId: opts.pending.keyId,
				blindedMsg: opts.pending.blindedMsg,
				payer: opts.payer,
				signature: opts.signature,
				...opts.quote ? { quote: opts.quote } : {}
			})
		});
	} catch {
		throw new PoofError("connection_failed", "Could not reach the server.");
	}
	const body = await res.json().catch(() => null);
	if (res.ok || res.status === 202) {
		const parsed = redeemResponseSchema.safeParse(body);
		if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
		if (parsed.data.status === "pending") return parsed.data;
		return {
			status: "ok",
			pass: await finishPass(opts.pending, parsed.data.blindSignature)
		};
	}
	throw serverError(res.status, body);
}
/** A PoofError for a failed API call, with the server's own message where it gave one. */
function serverError(status, body) {
	const err = errorBodySchema.safeParse(body);
	const message = err.success ? err.data.error.message : `Server error ${status}.`;
	if (status === 429) return new PoofError("rate_limited", message);
	if (!err.success) return new PoofError("connection_failed", message);
	switch (err.data.error.code) {
		case "pay_unavailable":
		case "key_changed": return new PoofError("pay_unavailable", message);
		case "chain_unavailable": return new PoofError("connection_failed", message);
		case "payment_invalid":
		case "payment_underpaid":
		case "payment_used": return new PoofError("pay_failed", message);
		case "pass_invalid":
		case "pass_used": return new PoofError("pass_invalid", message);
		case "not_owner": return new PoofError("not_owner", message);
		case "room_not_found": return new PoofError("room_not_found", message);
		default: return new PoofError("connection_failed", message);
	}
}
//#endregion
//#region packages/core/src/api.ts
/**
* Create a room and generate its key. The key is generated AFTER the server responds, entirely in
* the browser, and only ever placed in the URL fragment.
*/
async function createRoom(opts) {
	const secret = randomBytes(32);
	const ownerHash = toBase64Url(await sha256$1(secret));
	let res;
	try {
		res = await opts.fetch(`${opts.origin ?? ""}/api/rooms`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(opts.pass ? {
				ownerHash,
				pass: opts.pass
			} : { ownerHash })
		});
	} catch {
		throw new PoofError("connection_failed", "Could not reach the server.");
	}
	if (res.status === 429) throw new PoofError("rate_limited", "Too many rooms created. Try again soon.");
	if (!res.ok) throw serverError(res.status, await res.json().catch(() => null));
	const parsed = createRoomResponseSchema.safeParse(await res.json().catch(() => null));
	if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
	const key = generateRoomKey();
	return {
		roomId: parsed.data.roomId,
		key,
		path: roomPath(parsed.data.roomId, key),
		ownerSecret: toBase64Url(secret),
		info: parsed.data
	};
}
/** Where invite links open on the web app. Everything room-specific stays in the fragment. */
var INVITE_PATH = "/join/";
/** The invite part of a link: `<22-char room id>.<43-char key>`, all base64url. */
function inviteFragment(roomId, key) {
	return `${roomId}.${encodeRoomKey(key)}`;
}
function roomPath(roomId, key) {
	return `${INVITE_PATH}#${inviteFragment(roomId, key)}`;
}
/**
* Full shareable URL for a room on the web app at `appOrigin`: `<appOrigin>/join/#<id>.<key>`. The
* room id and the key are both after `#`, so neither reaches any server, not even in access logs.
*/
function inviteUrl(appOrigin, roomId, key) {
	return `${appOrigin.replace(/\/+$/, "")}${roomPath(roomId, key)}`;
}
/**
* Read the room id and key from an invite fragment (`<id>.<key>`, with or without a leading "#").
* Throws PoofError("invalid_link") for anything else.
*/
function parseInviteFragment(fragment) {
	const match = /^#?([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]+)$/.exec(fragment);
	if (!match?.[1] || !match[2]) throw new PoofError("invalid_link", "Not a room link.");
	return {
		roomId: match[1],
		key: decodeRoomKey(match[2])
	};
}
/**
* Read the room id and key from a location. Throws PoofError("invalid_link") for anything that isn't
* exactly `/join/#<22-char id>.<43-char key>` (the trailing slash is optional).
*/
function parseRoomLocation(pathname, hash) {
	if (!/^\/join\/?$/.test(pathname)) throw new PoofError("invalid_link", "Not a room link.");
	return parseInviteFragment(hash);
}
//#endregion
//#region packages/core/src/files.ts
/** How long the sender waits for the receiver's verdict after the last chunk. */
var DEFAULT_FILE_ACK_TIMEOUT_MS = 3e4;
var FILE_ID_BYTES = 16;
var CHUNK_PREFIX_BYTES = 20;
function chunkCount(size) {
	return Math.ceil(size / FILE_CHUNK_BYTES);
}
/** `fileId(16) ‖ index(4, big-endian) ‖ data` */
function encodeChunk(fileId, index, data) {
	const head = new Uint8Array(CHUNK_PREFIX_BYTES);
	head.set(fileId.subarray(0, FILE_ID_BYTES));
	new DataView(head.buffer).setUint32(FILE_ID_BYTES, index);
	return concat(head, data);
}
function decodeChunk(plaintext) {
	if (plaintext.length < CHUNK_PREFIX_BYTES) return null;
	const view = new DataView(plaintext.buffer, plaintext.byteOffset, plaintext.byteLength);
	return {
		fileId: toBase64Url(plaintext.subarray(0, FILE_ID_BYTES)),
		index: view.getUint32(FILE_ID_BYTES),
		data: plaintext.subarray(CHUNK_PREFIX_BYTES)
	};
}
/** base64url(SHA-256(bytes)), the form `file.meta` carries. */
async function hashFile(bytes) {
	return toBase64Url(await sha256$1(bytes));
}
var FileLane = class {
	wire;
	hooks;
	ackTimeoutMs;
	outgoing = null;
	incoming = null;
	queue = Promise.resolve();
	queued = /* @__PURE__ */ new Set();
	cancelledEarly = /* @__PURE__ */ new Set();
	closed = false;
	constructor(wire, hooks, ackTimeoutMs = DEFAULT_FILE_ACK_TIMEOUT_MS) {
		this.wire = wire;
		this.hooks = hooks;
		this.ackTimeoutMs = ackTimeoutMs;
	}
	/** Send a file to this member. Never rejects: the result says whether they verified it. */
	send(file, onProgress) {
		this.queued.add(file.fileId);
		const result = this.queue.then(() => this.run(file, onProgress));
		this.queue = result;
		return result;
	}
	/** Stop a transfer in either direction (or a queued one) and tell the other side. */
	cancel(fileId) {
		if (this.outgoing?.fileId === fileId) {
			this.outgoing.finish({
				ok: false,
				reason: "cancelled"
			});
			this.abort(fileId, "cancelled");
		} else if (this.incoming?.fileId === fileId) this.failIncoming("cancelled");
		else if (this.queued.has(fileId)) this.cancelledEarly.add(fileId);
	}
	/** Handle a decrypted frame from the files channel. Frames arrive one at a time, in order. */
	async handle(type, plaintext) {
		if (this.closed) return;
		switch (type) {
			case FrameType.FileMeta: return this.onMeta(parse(fileMetaSchema, plaintext));
			case FrameType.FileChunk: return this.onChunk(plaintext);
			case FrameType.FileEnd: return this.onEnd(parse(fileEndSchema, plaintext));
			case FrameType.FileAbort: return this.onAbort(parse(fileAbortSchema, plaintext));
			case FrameType.FileAck: return this.onAck(parse(fileAckSchema, plaintext));
		}
	}
	/** The link is gone: everything in flight fails with `connection_lost`. */
	close() {
		if (this.closed) return;
		this.closed = true;
		this.outgoing?.finish({
			ok: false,
			reason: "connection_lost"
		});
		const incoming = this.incoming;
		this.incoming = null;
		if (incoming) this.hooks.incomingFailed(incoming.fileId, "connection_lost");
	}
	run(file, onProgress) {
		this.queued.delete(file.fileId);
		if (this.cancelledEarly.delete(file.fileId)) return Promise.resolve({
			ok: false,
			reason: "cancelled"
		});
		if (this.closed) return Promise.resolve({
			ok: false,
			reason: "connection_lost"
		});
		let resolve;
		const result = new Promise((r) => resolve = r);
		const out = {
			fileId: file.fileId,
			done: false,
			ackTimer: null,
			finish: (r) => {
				if (out.done) return;
				out.done = true;
				if (out.ackTimer) clearTimeout(out.ackTimer);
				if (this.outgoing === out) this.outgoing = null;
				resolve(r);
			}
		};
		this.outgoing = out;
		this.pump(file, out, onProgress);
		return result;
	}
	async pump(file, out, onProgress) {
		const { bytes, fileId } = file;
		const size = bytes.length;
		const chunks = chunkCount(size);
		try {
			const meta = {
				fileId,
				name: file.name,
				size,
				mime: file.mime,
				chunks,
				sha256: file.sha256
			};
			await this.wire.send(FrameType.FileMeta, json(meta));
			const id = fromBase64Url(fileId);
			for (let index = 0; index < chunks && !out.done; index++) {
				await this.wire.ready();
				if (out.done) return;
				const start = index * FILE_CHUNK_BYTES;
				const end = Math.min(size, start + FILE_CHUNK_BYTES);
				await this.wire.send(FrameType.FileChunk, encodeChunk(id, index, bytes.subarray(start, end)));
				if (!out.done) onProgress(end, false);
			}
			if (out.done) return;
			await this.wire.send(FrameType.FileEnd, json({ fileId }));
			if (out.done) return;
			onProgress(size, true);
			out.ackTimer = setTimeout(() => out.finish({
				ok: false,
				reason: "timeout"
			}), this.ackTimeoutMs);
		} catch {
			out.finish({
				ok: false,
				reason: "connection_lost"
			});
		}
	}
	abort(fileId, reason) {
		this.wire.send(FrameType.FileAbort, json({
			fileId,
			reason
		})).catch(() => {});
	}
	onMeta(meta) {
		if (!meta) return;
		const limits = this.hooks.limits();
		if (!limits.fileTransfer) return this.abort(meta.fileId, "not_allowed");
		if (this.incoming) {
			if (this.incoming.fileId === meta.fileId) this.failIncoming("invalid");
			else this.abort(meta.fileId, "busy");
			return;
		}
		if (meta.size > limits.fileMaxBytes) return this.abort(meta.fileId, "too_large");
		if (meta.chunks !== chunkCount(meta.size)) return this.abort(meta.fileId, "invalid");
		const info = {
			fileId: meta.fileId,
			name: sanitizeFileName(meta.name),
			size: meta.size,
			mime: sanitizeMime(meta.mime)
		};
		if (!this.hooks.incomingStart(info)) return this.abort(meta.fileId, "invalid");
		this.incoming = {
			fileId: meta.fileId,
			size: meta.size,
			chunks: meta.chunks,
			sha256: meta.sha256,
			buffer: new Uint8Array(meta.size),
			next: 0,
			received: 0
		};
	}
	onChunk(plaintext) {
		const chunk = decodeChunk(plaintext);
		const incoming = this.incoming;
		if (!chunk || !incoming || chunk.fileId !== incoming.fileId) return;
		const last = incoming.chunks - 1;
		const expectedLength = chunk.index === last ? incoming.size - last * FILE_CHUNK_BYTES : FILE_CHUNK_BYTES;
		if (chunk.index !== incoming.next || chunk.index > last || chunk.data.length !== expectedLength) return this.failIncoming("invalid");
		incoming.buffer.set(chunk.data, chunk.index * FILE_CHUNK_BYTES);
		incoming.next += 1;
		incoming.received += chunk.data.length;
		this.hooks.incomingProgress(incoming.fileId, incoming.received);
	}
	async onEnd(end) {
		const incoming = this.incoming;
		if (!end || !incoming || end.fileId !== incoming.fileId) return;
		if (incoming.next !== incoming.chunks) return this.failIncoming("invalid");
		const ok = await hashFile(incoming.buffer) === incoming.sha256;
		if (this.incoming !== incoming) return;
		this.incoming = null;
		this.wire.send(FrameType.FileAck, json({
			fileId: incoming.fileId,
			ok
		})).catch(() => {});
		if (ok) this.hooks.incomingDone(incoming.fileId, incoming.buffer);
		else this.hooks.incomingFailed(incoming.fileId, "hash_mismatch");
	}
	onAbort(abort) {
		if (!abort) return;
		if (this.outgoing?.fileId === abort.fileId) this.outgoing.finish({
			ok: false,
			reason: abort.reason
		});
		if (this.incoming?.fileId === abort.fileId) {
			this.incoming = null;
			this.hooks.incomingFailed(abort.fileId, abort.reason);
		}
	}
	onAck(ack) {
		if (!ack || this.outgoing?.fileId !== ack.fileId) return;
		this.outgoing.finish(ack.ok ? { ok: true } : {
			ok: false,
			reason: "hash_mismatch"
		});
	}
	/** Drop the file being received, tell the sender why, and report it. */
	failIncoming(reason) {
		const incoming = this.incoming;
		if (!incoming) return;
		this.incoming = null;
		this.abort(incoming.fileId, reason);
		this.hooks.incomingFailed(incoming.fileId, reason);
	}
};
function json(value) {
	return utf8(JSON.stringify(value));
}
function parse(schema, plaintext) {
	try {
		const parsed = schema.safeParse(JSON.parse(fromUtf8(plaintext)));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}
//#endregion
//#region packages/core/src/member.ts
/**
* Backpressure for file chunks: stop queueing above HIGH, resume at LOW. Per member, so a group
* fan-out buffers at most ~9 × 256 KiB and chat on the other channel isn't stuck behind a file.
*/
var FILES_HIGH_WATER = 262144;
var FILES_LOW_WATER = 65536;
/**
* Everything this browser shares with ONE other member: the WebRTC link, the hybrid key exchange
* and the encrypted frame codec. A 2-person room has one; a group room has one per other member
* (full mesh, pairwise keys).
*/
var MemberLink = class {
	opts;
	hooks;
	state = "negotiating";
	connectionType = null;
	nickname = null;
	/** Group rooms: the members this peer says it has a confirmed link with. */
	reportedMembers = null;
	/** The encrypted channel was up at some point (for "joined"/"left" lines). */
	everConnected = false;
	peerId;
	role;
	/** File transfers with this member, both directions. */
	files;
	link;
	handshake = null;
	codec = null;
	pqTimer = null;
	connectionTypePromise = null;
	/** Serialises inbound DataChannel messages so async decrypt/handshake steps never interleave. */
	inbound = Promise.resolve();
	reportedFailure = false;
	constructor(opts, hooks) {
		this.opts = opts;
		this.hooks = hooks;
		this.peerId = opts.peerId;
		this.role = opts.role;
		this.link = new PeerLink({
			role: opts.role,
			iceServers: opts.iceServers,
			createPeerConnection: opts.createPeerConnection,
			callbacks: {
				onSignal: (payload) => {
					if (this.live) hooks.signal(payload);
				},
				onChannelOpen: (name) => {
					if (name === "ctl") this.onCtlOpen();
				},
				onMessage: (name, data) => this.enqueue(name, data),
				onIceGatheringComplete: (types) => {
					if (this.live) hooks.log("ice.candidates", "info", { types: [...types].sort() });
				},
				onFailed: () => this.report({ kind: "link" })
			}
		});
		this.files = new FileLane({
			send: (type, plaintext) => this.sendOn("files", type, plaintext),
			ready: () => this.filesReady()
		}, hooks.files, opts.fileAckTimeoutMs);
	}
	get live() {
		return this.state !== "failed" && this.state !== "closed";
	}
	start() {
		this.link.start().catch(() => this.report({ kind: "link" }));
	}
	handleSignal(payload) {
		if (this.live) this.link.handleSignal(payload);
	}
	/** New ICE servers for this link; a relayed link restarts ICE with them (initiator side). */
	refreshIceServers(iceServers) {
		return this.link.refreshIceServers(iceServers, this.connectionType === "relay");
	}
	/** Encrypt and send one frame on the ctl channel. Throws PoofError("not_connected"). */
	send(type, plaintext) {
		return this.sendOn("ctl", type, plaintext);
	}
	async sendOn(name, type, plaintext) {
		const codec = this.codec;
		if (this.state !== "connected" || !codec) throw new PoofError("not_connected");
		const frame = await codec.seal(CHANNEL_ID[name], type, plaintext);
		if (this.state !== "connected") throw new PoofError("not_connected");
		try {
			this.link.send(name, frame);
		} catch {
			throw new PoofError("not_connected", "Connection closed.");
		}
	}
	async filesReady() {
		if (!this.live) throw new PoofError("not_connected");
		if (this.link.buffered("files") <= FILES_HIGH_WATER) return;
		try {
			await this.link.whenDrained("files", FILES_LOW_WATER);
		} catch {
			throw new PoofError("not_connected", "Connection closed.");
		}
	}
	/** Best effort: control messages never throw. */
	async sendCtl(payload) {
		try {
			await this.send(FrameType.Ctl, utf8(JSON.stringify(payload)));
		} catch {}
	}
	/** Stop for good. `failed` keeps the member visible as broken; `closed` means gone. */
	close(final = "closed") {
		if (!this.live) return;
		this.state = final;
		this.clearPqTimer();
		this.files.close();
		this.link.close();
		this.handshake?.dispose();
		this.handshake = null;
		this.codec = null;
	}
	onCtlOpen() {
		if (this.state !== "negotiating") return;
		this.hooks.log("dc.open", "ok");
		this.state = "upgrading";
		this.hooks.changed();
		this.pqTimer = setTimeout(() => {
			this.pqTimer = null;
			if (this.state === "upgrading") this.report({
				kind: "pq",
				timeout: true
			});
		}, this.opts.pqTimeoutMs);
		this.connectionTypePromise = this.link.detectConnectionType().then((type) => {
			if (this.live) {
				this.connectionType = type;
				this.hooks.log(type === "relay" ? "path.relay" : "path.direct", type === "relay" ? "warn" : "ok");
				this.hooks.changed();
			}
			return type;
		});
		this.hooks.log("pq.start", "info");
		const pair = this.role === "initiator" ? {
			initiator: this.opts.selfId,
			responder: this.peerId
		} : {
			initiator: this.peerId,
			responder: this.opts.selfId
		};
		if (this.role === "initiator") {
			const hs = new InitiatorHandshake(this.opts.roomId, this.opts.roomKey, pair);
			this.handshake = hs;
			this.sendPq(hs.start());
		} else this.handshake = new ResponderHandshake(this.opts.roomId, this.opts.roomKey, pair);
	}
	sendPq(msg) {
		this.link.send("ctl", JSON.stringify(msg));
	}
	async handlePq(msg) {
		const hs = this.handshake;
		if (this.state !== "upgrading" || !hs) return;
		if (hs instanceof InitiatorHandshake) {
			if (msg.t !== "pq.reply") throw new PoofError("pq_failed", "Unexpected handshake message");
			this.hooks.log("pq.exchange", "info");
			const { confirm, keys } = await hs.handleReply(msg);
			this.sendPq(confirm);
			this.hooks.log("pq.verify", "ok");
			await this.completeUpgrade(keys);
		} else if (msg.t === "pq.hello") {
			this.sendPq(await hs.handleHello(msg));
			this.hooks.log("pq.exchange", "info");
		} else if (msg.t === "pq.confirm") {
			const keys = await hs.handleConfirm(msg);
			this.hooks.log("pq.verify", "ok");
			await this.completeUpgrade(keys);
		} else throw new PoofError("pq_failed", "Unexpected handshake message");
	}
	async completeUpgrade(keys) {
		this.clearPqTimer();
		this.handshake?.dispose();
		this.handshake = null;
		this.codec = new FrameCodec(keys);
		this.state = "connected";
		this.everConnected = true;
		this.hooks.changed();
		this.hooks.log("pq.done", "ok");
		const type = await this.connectionTypePromise ?? "relay";
		await this.sendCtl({
			kind: "connection_type",
			value: type
		});
		if (this.state === "connected") this.hooks.connected();
	}
	clearPqTimer() {
		if (this.pqTimer) clearTimeout(this.pqTimer);
		this.pqTimer = null;
	}
	enqueue(channel, data) {
		this.inbound = this.inbound.then(() => this.handleInbound(channel, data)).catch((error) => this.onInboundError(error));
	}
	async handleInbound(channel, data) {
		if (!this.live) return;
		if (channel === "files") {
			const codec = this.codec;
			if (typeof data === "string" || !codec) return;
			const frame = await codec.open(data);
			if (frame.channel !== Channel.Files) throw new PoofError("frame_invalid", "Frame on the wrong channel");
			if (this.live) await this.files.handle(frame.type, frame.plaintext);
			return;
		}
		if (typeof data === "string") {
			const parsed = pqMessageSchema.safeParse(safeJson(data));
			if (!parsed.success) throw new PoofError("pq_failed", "Malformed handshake message");
			await this.handlePq(parsed.data);
			return;
		}
		const codec = this.codec;
		if (!codec) return;
		const frame = await codec.open(data);
		if (frame.channel !== Channel.Ctl) throw new PoofError("frame_invalid", "Frame on the wrong channel");
		if (!this.live) return;
		if (frame.type === FrameType.Chat) {
			const chat = chatPlaintextSchema.safeParse(safeJson(fromUtf8(frame.plaintext)));
			if (chat.success) this.hooks.chat(chat.data);
		} else if (frame.type === FrameType.Ai) {
			const ai = aiPlaintextSchema.safeParse(safeJson(fromUtf8(frame.plaintext)));
			if (ai.success) this.hooks.ai(ai.data);
		} else if (frame.type === FrameType.Ctl) {
			const ctl = ctlPlaintextSchema.safeParse(safeJson(fromUtf8(frame.plaintext)));
			if (!ctl.success) return;
			if (ctl.data.kind === "connection_type") {
				if (ctl.data.value === "relay" && this.connectionType !== "relay") {
					this.connectionType = "relay";
					this.hooks.log("path.relay", "warn");
					this.hooks.changed();
				}
			} else this.hooks.ctl(ctl.data);
		}
	}
	onInboundError(error) {
		if (error instanceof PoofError) {
			if (error.code === "pq_failed") return this.report({
				kind: "pq",
				timeout: false
			});
			if (error.code === "frame_invalid" || error.code === "frame_out_of_order" || error.code === "decrypt_failed") return this.report({
				kind: "frame",
				code: error.code
			});
		}
		this.report({ kind: "other" });
	}
	report(failure) {
		if (!this.live || this.reportedFailure) return;
		this.reportedFailure = true;
		this.hooks.failed(failure);
	}
};
var CHANNEL_ID = {
	ctl: Channel.Ctl,
	files: Channel.Files
};
function safeJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/_md.js
/**
* Internal Merkle-Damgard hash utils.
* @module
*/
/**
* Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
* Returns bits from `b` when `a` is set, otherwise from `c`.
* The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
* set the same bit.
* @param a - selector word
* @param b - word chosen when selector bit is set
* @param c - word chosen when selector bit is clear
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit choice primitive.
* ```ts
* Chi(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Chi(a, b, c) {
	return a & b ^ ~a & c;
}
/**
* Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
* Returns bits shared by at least two inputs.
* @param a - first input word
* @param b - second input word
* @param c - third input word
* @returns Mixed 32-bit word.
* @example
* Combine three words with the shared 32-bit majority primitive.
* ```ts
* Maj(0xffffffff, 0x12345678, 0x87654321);
* ```
*/
function Maj(a, b, c) {
	return a & b ^ a & c ^ b & c;
}
/**
* Merkle-Damgard hash construction base class.
* Could be used to create MD5, RIPEMD, SHA1, SHA2.
* Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
* strings with partial-byte tails.
* @param blockLen - internal block size in bytes
* @param outputLen - digest size in bytes
* @param padOffset - trailing length field size in bytes
* @param isLE - whether length and state words are encoded in little-endian
* @example
* Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
* ```ts
* import { _SHA1 } from '@noble/hashes/legacy.js';
* const hash = new _SHA1();
* hash.update(new Uint8Array([97, 98, 99]));
* hash.digest();
* ```
*/
var HashMD = class {
	blockLen;
	outputLen;
	canXOF = false;
	padOffset;
	isLE;
	buffer;
	view;
	finished = false;
	length = 0;
	pos = 0;
	destroyed = false;
	constructor(blockLen, outputLen, padOffset, isLE) {
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView(this.buffer);
	}
	update(data) {
		aexists(this);
		abytes$1(data);
		const { view, buffer, blockLen } = this;
		const len = data.length;
		let processed = false;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				processed = true;
				continue;
			}
			buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
				processed = true;
			}
		}
		this.length += data.length;
		if (processed) this.roundClean();
		return this;
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		buffer.fill(0, pos);
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			buffer.fill(0);
		}
		setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
		this.process(view, 0);
		this.roundClean();
		const oview = out === buffer ? view : createView(out);
		const len = this.outputLen;
		const outLen = len / 4;
		const state = this.get();
		if (len % 4 || outLen > state.length) throw new Error("invalid outputLen");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneIntoMeta(to) {
		const { buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (pos) to.buffer.set(buffer);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
};
/**
* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
*/
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
* square roots of the first eight prime numbers. Exported as a shared table; callers must treat
* it as read-only because constructors copy words from it by index. */
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/sha2.js
/**
* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
* Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
* {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
* @module
*/
/**
* SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
* of the cube roots of the first 64 primes (2..311).
*/
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
var SHA2_32B = class extends HashMD {
	A = 0;
	B = 0;
	C = 0;
	D = 0;
	E = 0;
	F = 0;
	G = 0;
	H = 0;
	constructor(outputLen, IV) {
		super(64, outputLen, 8, false);
		this.A = IV[0] | 0;
		this.B = IV[1] | 0;
		this.C = IV[2] | 0;
		this.D = IV[3] | 0;
		this.E = IV[4] | 0;
		this.F = IV[5] | 0;
		this.G = IV[6] | 0;
		this.H = IV[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	_cloneInto(to) {
		(to ||= new this.constructor()).set(...this.get());
		return this._cloneIntoMeta(to);
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		clean(SHA256_W);
	}
	destroy() {
		this.destroyed = true;
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		clean(this.buffer);
	}
};
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
var _SHA256 = class extends SHA2_32B {
	constructor() {
		super(32, SHA256_IV);
	}
};
/**
* SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
*
* - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
* - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
* - Each sha256 hash is executing 2^18 bit operations.
* - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
* @param msg - message bytes to hash
* @param opts - Reserved hash options.
* @returns Digest bytes.
* @example
* Hash a message with SHA2-256.
* ```ts
* sha256(new Uint8Array([97, 98, 99]));
* ```
*/
var sha256 = /* @__PURE__ */ createHasher(() => new _SHA256(), /* @__PURE__ */ oidNist(1));
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/curve.js
/**
* Methods for elliptic curve multiplication by scalars.
* Contains wNAF-based ScalarMultiplier, pippenger.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$2 = /* @__PURE__ */ BigInt(0);
var _1n$1 = /* @__PURE__ */ BigInt(1);
var _4n$1 = /* @__PURE__ */ BigInt(4);
var BLIND_BYTES = 16;
var BLIND_BITS = 128;
var FW_WINDOW = 5;
var TABLE_BYTES_MAX = /* @__PURE__ */ (() => 2 ** 31)();
/**
* Validates the static surface of a point constructor.
* This is only a cheap sanity check for the constructor hooks and fields consumed by generic
* factories; it does not certify `BASE`/`ZERO` semantics or prove the curve implementation itself.
* @param Point - Runtime point constructor.
* @throws On missing constructor hooks or malformed field metadata. {@link TypeError}
* @example
* Check that one point constructor exposes the static hooks generic helpers need.
*
* ```ts
* import { ed25519 } from '@noble/curves/ed25519.js';
* import { validatePointCons } from '@noble/curves/abstract/curve.js';
* validatePointCons(ed25519.Point);
* ```
*/
function validatePointCons(Point) {
	const pc = Point;
	if (typeof pc !== "function") throw new TypeError("\"Point\" expected constructor, got type=" + typeof Point);
	afunction(pc.fromAffine, "Point.fromAffine");
	afunction(pc.fromBytes, "Point.fromBytes");
	afunction(pc.fromHex, "Point.fromHex");
	aobject(pc.BASE, "Point.BASE");
	aobject(pc.ZERO, "Point.ZERO");
	validateField(pc.Fp);
	validateField(pc.Fn);
}
/**
* Takes a bunch of Projective Points but executes only one
* inversion on all of them. Inversion is very slow operation,
* so this improves performance massively.
* Optimization: converts a list of projective points to a list of identical points with Z=1.
* Input points are left unchanged; the normalized points are returned as fresh instances.
* @param c - Point constructor.
* @param points - Projective points.
* @returns Fresh projective points reconstructed from normalized affine coordinates.
* @example
* Batch-normalize projective points with a single shared inversion.
*
* ```ts
* import { normalizeZ } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const points = normalizeZ(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()]);
* ```
*/
function normalizeZ(c, points) {
	validatePointCons(c);
	validateMSMPoints(points, c);
	const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
	return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits, min = 1) {
	if (!Number.isSafeInteger(W) || W < min || W > bits) throw new Error("invalid window size, expected [" + min + ".." + bits + "], got W=" + W);
}
function validateTableBytes(numPoints, fpBytes) {
	const bytes = numPoints * (4 * fpBytes + 128);
	if (bytes > TABLE_BYTES_MAX) throw new Error("invalid window size: table would need ~" + Math.ceil(bytes / 2 ** 20) + " MiB, max " + TABLE_BYTES_MAX / 2 ** 20 + " MiB");
}
/**
* Probes an RNG once, at construction time: returns `undefined` when it is unavailable —
* throws or returns malformed bytes — so callers can downgrade to their unblinded /
* deterministic constant-time fallback. Blinding is defense-in-depth (DPA/template
* hardening), not a correctness or key-secrecy requirement, so availability-based
* downgrade is acceptable.
*
* The downgrade decision is deliberately static. After a successful probe the RNG becomes
* part of the trusted contract: later misbehavior must fail closed in per-call validation
* (throw), never downgrade — a dynamic fallback would let a tampered RNG silently strip
* blinding on demand. A probe can only ever classify broken environments, not adversarial
* RNGs: a stateful RNG can always behave while probed and misbehave later.
* @param randomBytes - RNG to probe, or `undefined` when the environment provides none.
* @param length - Byte length requested from the probe call.
* @returns The RNG when the probe produced `length` valid bytes; `undefined` otherwise.
* @example
* Probe an RNG once before enabling scalar blinding.
*
* ```ts
* import { probeRandomBytes } from '@noble/curves/abstract/curve.js';
* import { randomBytes } from '@noble/hashes/utils.js';
* const rng = probeRandomBytes(randomBytes, 16);
* ```
*/
function probeRandomBytes(randomBytes, length) {
	if (randomBytes === void 0) return void 0;
	afunction(randomBytes, "randomBytes");
	try {
		const probe = randomBytes(length);
		if (!isBytes(probe) || probe.length !== length) return void 0;
	} catch {
		return;
	}
	return randomBytes;
}
function validateMSMPoints(points, c) {
	aarray$1(points, "points");
	points.forEach((p, i) => {
		if (!(p instanceof c)) throw new Error("invalid point at index " + i);
	});
}
function validateMSMScalars(scalars, field, maxScalar) {
	if (!Array.isArray(scalars)) throw new Error("array of scalars expected");
	scalars.forEach((s, i) => {
		if (!(maxScalar === void 0 ? field.isValid(s) : isPosBig(s) && s < maxScalar)) throw new Error("invalid scalar at index " + i);
	});
}
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getWindowSize(P) {
	return pointWindowSizes.get(P) || 1;
}
/** Table of odd multiples [1P, 3P, ..., (2⋅size−1)P]; width-W wNAF uses size = 2^(W−2). */
function oddMultiples(p, size) {
	const dbl = p.double();
	const t = [p];
	for (let j = 1; j < size; j++) t.push(t[j - 1].add(dbl));
	return t;
}
/**
* Width-W wNAF signed-digit recoding (W >= 2), LSB-first: digits are 0 or odd with
* |digit| < 2^(W−1); nonzero density ~1/(W+1) (a nonzero digit is followed by W−1 zeros).
*/
function wnafDigits(n, W) {
	const size = 2 ** W;
	const half = size / 2;
	const mask = BigInt(size - 1);
	const d = [];
	while (n > _0n$2) {
		let w = 0;
		if (n & _1n$1) {
			w = Number(n & mask);
			if (w >= half) w -= size;
			n -= BigInt(w);
		}
		d.push(w);
		n >>= _1n$1;
	}
	return d;
}
/**
* Fixed-position signed-window recoding for precomputed wNAF: `n = Σ digits[w]⋅2^(w⋅W)` with
* digits in `[−2^(W−1)+1, 2^(W−1)]`. Digit count is fixed by `windows` (callers reserve one
* extra window for the final carry), so recoding length does not depend on the scalar.
*/
function signedWindowDigits(n, W, windows) {
	const size = 2 ** W;
	const half = size / 2;
	const mask = BigInt(size - 1);
	const shiftBy = BigInt(W);
	const d = [];
	for (let w = 0; w < windows; w++) {
		let v = Number(n & mask);
		n >>= shiftBy;
		if (v > half) {
			v -= size;
			n += _1n$1;
		}
		d.push(v);
	}
	if (n !== _0n$2) throw new Error("invalid wnaf");
	return d;
}
/**
* Shared vartime walk over per-scalar wNAF digit streams: one doubling of a single shared
* accumulator per bit position of the longest recoding, one signed table addition per
* nonzero digit. `tables[i]` must hold the odd multiples of the i-th point.
*/
function wnafWalk(zero, tables, digits) {
	let max = 0;
	for (const d of digits) max = Math.max(max, d.length);
	let acc = zero;
	for (let bit = max - 1; bit >= 0; bit--) {
		if (bit !== max - 1) acc = acc.double();
		for (let i = 0; i < digits.length; i++) {
			const w = digits[i][bit];
			if (w) {
				const item = tables[i][Math.abs(w) - 1 >> 1];
				acc = acc.add(w < 0 ? item.negate() : item);
			}
		}
	}
	return acc;
}
/**
* Elliptic curve multiplication of Point by scalar.
* Routes between cached-table, fixed-window, and one-shot wNAF paths; entry points validate
* their own scalars (`mulCT`/`mulCTBlinded`: `1 <= s < Fn.ORDER`; `mulUnsafe`: up to the
* `Fn.ORDER^4` DoS cap via {@link mulAddUnsafe}).
* Table generation is expensive and happens on first call of `multiply()`
* (or eagerly via `precompute(W, false)`). By default, `BASE` point is precomputed.
*
* Cached algorithm is signed fixed-window wNAF:
* - table stores, for every window w, the multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P` — all doublings
*   are baked in, so a multiplication is exactly one table addition per window
* - window count is fixed (`ceil(bits/W) + 1`), so the point-operation count is scalar-independent
*   (basis of the constant-time path)
* - for a 256-bit curve and W=6: 44⋅32 = 1408 table points, 44 additions per multiply
* - secret scalars are additionally blinded (see {@link ScalarMultiplier.mulCTBlinded}), which
*   widens tables by 128 bits
* @param Point - Point constructor.
* @param randomBytes - RNG used for scalar blinding; required by the blinded secret path.
* @example
* Elliptic curve multiplication of Point by scalar.
*
* ```ts
* import { ScalarMultiplier } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const mul = new ScalarMultiplier(p256.Point);
* ```
*/
var ScalarMultiplier = class {
	Point;
	BASE;
	ZERO;
	randomBytes;
	wnafPrecomputes = /* @__PURE__ */ new WeakMap();
	baseCanBeBlinded;
	bits;
	constructor(Point, randomBytes) {
		validatePointCons(Point);
		this.randomBytes = probeRandomBytes(randomBytes, BLIND_BYTES);
		this.Point = Point;
		this.BASE = Point.BASE;
		this.ZERO = Point.ZERO;
		this.bits = Point.Fn.BITS;
	}
	/**
	* Creates a signed fixed-window wNAF precomputation table: for every window w, the
	* multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P`, flattened. All doublings are baked into the table,
	* so cached multiplication is additions-only. `windows = ceil(bits/W) + 1`: the extra
	* window absorbs the final carry of signed-digit recoding.
	* For a 256-bit curve and W=6, the table is 44⋅32 = 1408 points.
	* @param point - Point instance
	* @param W - window size
	* @param bits - scalar bitlength the table must cover
	*/
	buildWnafTable(point, W, bits) {
		const windows = Math.ceil(bits / W) + 1;
		const half = 2 ** (W - 1);
		const comp = [];
		let base = point;
		for (let w = 0; w < windows; w++) {
			let acc = base;
			for (let i = 0; i < half; i++) {
				comp.push(acc);
				acc = acc.add(base);
			}
			base = comp[comp.length - 1].double();
		}
		return {
			W,
			bits,
			windows,
			comp
		};
	}
	/**
	* Implements ec multiplication using precomputed signed fixed-window wNAF tables.
	* Constant-time: fixed window count with one table addition per window — zero digits feed
	* the fake accumulator — and no doublings; the lookup scans the whole window slice.
	* Scalar bounds are validated by the public entry points ({@link ScalarMultiplier.mulCT},
	* {@link ScalarMultiplier.mulCTBlinded}, {@link ScalarMultiplier.mulUnsafe});
	* signedWindowDigits throws if `n` exceeds the table.
	* @returns real and fake (for const-time) points
	*/
	wnafCachedCT(precomputes, n) {
		const { W, windows, comp } = precomputes;
		const half = 2 ** (W - 1);
		const digits = signedWindowDigits(n, W, windows);
		let p = this.ZERO;
		let f = this.BASE;
		for (let w = 0; w < windows; w++) {
			const digit = digits[w];
			const start = w * half;
			const idx = Math.abs(digit) - 1;
			let sel = comp[start];
			for (let i = 1; i < half; i++) sel = i === idx ? comp[start + i] : sel;
			const neg = sel.negate();
			if (digit === 0) f = f.add(comp[start]);
			else p = p.add(digit < 0 ? neg : sel);
		}
		return {
			p,
			f
		};
	}
	getWnafPrecomputes(W, point, bits, transform) {
		let entries = this.wnafPrecomputes.get(point);
		let comp = entries?.find((entry) => entry.W === W && entry.bits === bits);
		if (!comp) {
			comp = this.buildWnafTable(point, W, bits);
			if (typeof transform === "function") comp = {
				...comp,
				comp: transform(comp.comp)
			};
			if (!entries) {
				entries = [];
				this.wnafPrecomputes.set(point, entries);
			}
			entries.push(comp);
		}
		return comp;
	}
	assertPoint(point) {
		if (!(point instanceof this.Point)) throw new TypeError("\"point\" expected Point instance, got type=" + typeof point);
	}
	validateMulInput(point, scalar) {
		this.assertPoint(point);
		if (!inRange(scalar, _1n$1, this.Point.Fn.ORDER)) throw new Error("invalid scalar");
	}
	runCT(point, n, bits, transform) {
		const W = getWindowSize(point);
		if (W === 1) return this.fixedWindowCT(point, n, bits);
		return this.wnafCachedCT(this.getWnafPrecomputes(W, point, bits, transform), n);
	}
	mulCT(point, scalar, transform) {
		this.validateMulInput(point, scalar);
		return this.runCT(point, scalar, this.bits, transform);
	}
	mulCTBlinded(point, scalar, transform) {
		this.validateMulInput(point, scalar);
		if (this.randomBytes === void 0) throw new Error("randomBytes is required for scalar blinding");
		const bits = this.Point.Fn.BITS + BLIND_BITS;
		const blind = this.randomBytes(BLIND_BYTES);
		if (!isBytes(blind) || blind.length !== BLIND_BYTES) throw new Error("randomBytes returned invalid byte array");
		blind[0] = blind[0] & 63 | 128;
		const n = scalar + bytesToNumberBE(blind) * this.Point.Fn.ORDER;
		return this.runCT(point, n, bits, transform);
	}
	/**
	* Constant-time multiplication `n*point` for an un-precomputed point, via a small fixed window.
	* A cached wNAF table only pays off when reused; a flat 2^FW_WINDOW table (`size-1` adds) is
	* far cheaper to build for a single use. The point-operation sequence is independent of `n`:
	* build the table, then per window exactly FW_WINDOW doublings, a data-oblivious scan over
	* every table entry, and one addition (adds the identity when the window digit is 0 — never
	* skipped).
	*
	* `n` must be `< 2^bits`. Assumes complete addition (adding the identity costs the same as any
	* add), which holds for the Weierstrass/Edwards point types used here. The table is left in
	* projective form (no normalizeZ): normalizing this small a table costs more than the
	* mixed-add savings it would buy for a single multiply.
	* @returns real point `p`; `f` duplicates it only to match {@link wnafCachedCT}'s return shape
	* (this path needs no fake accumulator — its op-count is already scalar-independent).
	*/
	fixedWindowCT(point, n, bits) {
		const W = FW_WINDOW;
		const size = 32;
		const mask = bitMask(W);
		const table = new Array(size);
		table[0] = this.ZERO;
		for (let i = 1; i < size; i++) table[i] = table[i - 1].add(point);
		const windows = Math.ceil(bits / W);
		let acc = this.ZERO;
		for (let window = windows - 1; window >= 0; window--) {
			if (window !== windows - 1) for (let d = 0; d < W; d++) acc = acc.double();
			const digit = Number(n >> BigInt(window * W) & mask);
			let sel = table[0];
			for (let i = 1; i < size; i++) sel = i === digit ? table[i] : sel;
			acc = acc.add(sel);
		}
		return {
			p: acc,
			f: acc
		};
	}
	shouldBlind(point, cofactor) {
		if (this.randomBytes === void 0) return false;
		if (cofactor === _1n$1) return true;
		if (point !== this.BASE) return false;
		if (this.baseCanBeBlinded === void 0) this.baseCanBeBlinded = this.mulUnsafe(this.BASE, this.Point.Fn.ORDER).is0();
		return this.baseCanBeBlinded;
	}
	mulSecret(point, scalar, cofactor, transform) {
		return this.shouldBlind(point, cofactor) ? this.mulCTBlinded(point, scalar, transform) : this.mulCT(point, scalar, transform);
	}
	mulUnsafe(point, scalar, transform) {
		this.assertPoint(point);
		if (!isPosBig(scalar)) throw new Error("invalid scalar");
		const W = getWindowSize(point);
		if (W === 1 || scalar >= this.Point.Fn.ORDER) return mulAddUnsafe(this.Point, [point], [scalar], true);
		const precomputes = this.getWnafPrecomputes(W, point, this.bits, transform);
		return this.wnafCachedCT(precomputes, scalar).p;
	}
	setWindowSize(point, W) {
		this.assertPoint(point);
		validateW(W, this.bits);
		validateTableBytes((Math.ceil((this.bits + BLIND_BITS) / W) + 1) * 2 ** (W - 1), this.Point.Fp.BYTES);
		pointWindowSizes.set(point, W);
		this.wnafPrecomputes.delete(point);
	}
	hasWindowSize(point) {
		return getWindowSize(point) !== 1;
	}
};
/**
* Combined multi-scalar multiplication `Σ scalars[i]⋅points[i]` via interleaved width-4 wNAF
* (Strauss–Shamir). Every input gets its own table of odd multiples `[1P, 3P, 5P, 7P]` and
* signed-digit recoding, but all walks share one doubling chain, so total cost is
* `~bits` doublings + `L⋅bits/5` additions instead of `L⋅bits` doublings for separate
* multiplications. Intended for the 2-4 point shapes of signature verification
* (`R = u1⋅G + u2⋅P`); use {@link pippenger} for larger batches.
*
* Not constant-time: only for public inputs. Scalars must satisfy `0 <= s < Fn.ORDER`;
* fold negative signs into the points before calling.
* @param c - Point constructor.
* @param points - Array of curve points.
* @param scalars - Array of non-negative scalars, same length as points.
* @param allowOversized - Replace the `s < Fn.ORDER` scalar check with a `Fn.ORDER^4` DoS cap.
*   Off by default. For scalars that must NOT be reduced mod ORDER: torsion checks
*   (`Fn.ORDER⋅P ≟ O`) and cofactor-clearing multiples. Walk length grows with `bitLen(s)`.
* @returns Combined multiplication result; identity for empty input.
* @throws If the point set or scalar set is invalid. {@link Error}
* @example
* Combined multi-scalar multiplication via Strauss–Shamir.
*
* ```ts
* import { mulAddUnsafe } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const G = p256.Point.BASE;
* const R = mulAddUnsafe(p256.Point, [G, G.double()], [2n, 3n]); // 2⋅G + 3⋅(2⋅G)
* ```
*/
function mulAddUnsafe(c, points, scalars, allowOversized = false) {
	validatePointCons(c);
	validateMSMPoints(points, c);
	abool(allowOversized, "allowOversized");
	validateMSMScalars(scalars, c.Fn, allowOversized ? c.Fn.ORDER ** _4n$1 : void 0);
	if (points.length !== scalars.length) throw new Error("arrays of points and scalars must have equal length");
	const tables = points.map((p) => oddMultiples(p, 4));
	const digits = scalars.map((n) => wnafDigits(n, 4));
	return wnafWalk(c.ZERO, tables, digits);
}
function createField(order, field, isLE) {
	if (field) {
		if (field.ORDER !== order) throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
		validateField(field);
		return field;
	} else return Field(order, { isLE });
}
/**
* Validates basic CURVE shape and field membership, then creates fields.
* This does not prove that the generator is on-curve, that subgroup/order data are consistent, or
* that the curve equation itself is otherwise sane.
* @param type - Curve family.
* @param CURVE - Curve parameters.
* @param curveOpts - Optional field overrides. See {@link FpFn}:
*   - `Fp` (optional): Optional base-field override.
*   - `Fn` (optional): Optional scalar-field override.
* @param FpFnLE - Whether field encoding is little-endian.
* @returns Frozen curve parameters and fields.
* @throws If the curve parameters or field overrides are invalid. {@link Error}
* @example
* Build curve fields from raw constants before constructing a curve instance.
*
* ```ts
* const curve = createCurveFields('weierstrass', {
*   p: 17n,
*   n: 19n,
*   h: 1n,
*   a: 2n,
*   b: 2n,
*   Gx: 5n,
*   Gy: 1n,
* });
* ```
*/
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
	if (type !== "weierstrass" && type !== "edwards") throw new Error("expected curve type \"weierstrass\" or \"edwards\"");
	if (FpFnLE === void 0) FpFnLE = type === "edwards";
	if (!CURVE || typeof CURVE !== "object") throw new Error(`expected valid ${type} CURVE object`);
	validateObject(curveOpts);
	for (const p of [
		"p",
		"n",
		"h"
	]) {
		const val = CURVE[p];
		if (!(isPosBig(val) && val !== _0n$2)) throw new Error(`CURVE.${p} must be positive bigint`);
	}
	const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
	const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
	const params = [
		"Gx",
		"Gy",
		"a",
		type === "weierstrass" ? "b" : "d"
	];
	for (const p of params) if (!Fp.isValid(CURVE[p])) throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
	CURVE = Object.freeze(Object.assign({}, CURVE));
	return {
		CURVE,
		Fp,
		Fn
	};
}
/**
* @param randomSecretKey - Secret-key generator.
* @param getPublicKey - Public-key derivation helper.
* @returns Keypair generator.
* @example
* Build a `keygen()` helper from existing secret-key and public-key primitives.
*
* ```ts
* import { createKeygen } from '@noble/curves/abstract/curve.js';
* import { p256 } from '@noble/curves/nist.js';
* const keygen = createKeygen(p256.utils.randomSecretKey, p256.getPublicKey);
* const pair = keygen();
* ```
*/
function createKeygen(randomSecretKey, getPublicKey) {
	return function keygen(seed) {
		const secretKey = randomSecretKey(seed);
		return {
			secretKey,
			publicKey: getPublicKey(secretKey)
		};
	};
}
//#endregion
//#region node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/hmac.js
/**
* HMAC: RFC2104 message authentication code.
* @module
*/
/**
* Internal class for HMAC.
* Accepts any byte key, although RFC 2104 §3 recommends keys at least
* `HashLen` bytes long.
*/
var _HMAC = class {
	oHash;
	iHash;
	blockLen;
	outputLen;
	canXOF = false;
	finished = false;
	destroyed = false;
	constructor(hash, key) {
		ahash(hash);
		abytes$1(key, void 0, "key");
		this.iHash = hash.create();
		if (typeof this.iHash.update !== "function") throw new Error("expected Hash instance");
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const pad = new Uint8Array(blockLen);
		pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
		for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
		this.iHash.update(pad);
		this.oHash = hash.create();
		for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
		this.oHash.update(pad);
		clean(pad);
	}
	update(buf) {
		aexists(this);
		this.iHash.update(buf);
		return this;
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const buf = out.subarray(0, this.outputLen);
		this.iHash.digestInto(buf);
		this.oHash.update(buf);
		this.oHash.digestInto(buf);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to ||= Object.create(Object.getPrototypeOf(this), {});
		const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.canXOF = canXOF;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
};
var hmac = /* @__PURE__ */ (() => {
	const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
	hmac_.create = (hash, key) => new _HMAC(hash, key);
	return hmac_;
})();
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/der.js
/**
* ASN.1 DER (Distinguished Encoding Rules) helpers for ECDSA signatures.
* Only implements the tiny subset needed for `SEQUENCE(INTEGER r, INTEGER s)`.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$1 = /* @__PURE__ */ BigInt(0);
/**
* @param m - Error message.
* @example
* Throw a DER-specific error when signature parsing encounters invalid bytes.
*
* ```ts
* new DERErr('bad der');
* ```
*/
var DERErr = class extends Error {
	constructor(m = "") {
		super(m);
	}
};
var _DER = {
	Err: DERErr,
	_tlv: {
		encode: (tag, data) => {
			const { Err: E } = _DER;
			asafenumber(tag, "tag");
			if (tag < 0 || tag > 255) throw new E("tlv.encode: wrong tag");
			astring(data, "data");
			if (data.length & 1) throw new E("tlv.encode: unpadded data");
			const dataLen = data.length / 2;
			const len = numberToHexUnpadded(dataLen);
			if (len.length / 2 & 128) throw new E("tlv.encode: long form length too big");
			const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
			return numberToHexUnpadded(tag) + lenLen + len + data;
		},
		decode(tag, data) {
			const { Err: E } = _DER;
			data = abytes(data, void 0, "DER data");
			let pos = 0;
			if (tag < 0 || tag > 255) throw new E("tlv.decode: wrong tag");
			if (data.length < 2 || data[pos++] !== tag) throw new E("tlv.decode: wrong tlv");
			const first = data[pos++];
			const isLong = !!(first & 128);
			let length = 0;
			if (!isLong) length = first;
			else {
				const lenLen = first & 127;
				if (!lenLen) throw new E("tlv.decode(long): indefinite length not supported");
				if (lenLen > 4) throw new E("tlv.decode(long): byte length is too big");
				const lengthBytes = data.subarray(pos, pos + lenLen);
				if (lengthBytes.length !== lenLen) throw new E("tlv.decode: length bytes not complete");
				if (lengthBytes[0] === 0) throw new E("tlv.decode(long): zero leftmost byte");
				for (const b of lengthBytes) length = length << 8 | b;
				pos += lenLen;
				if (length < 128) throw new E("tlv.decode(long): not minimal encoding");
			}
			const v = data.subarray(pos, pos + length);
			if (v.length !== length) throw new E("tlv.decode: wrong value length");
			return {
				v,
				l: data.subarray(pos + length)
			};
		}
	},
	_int: {
		encode(num) {
			const { Err: E } = _DER;
			abignumber(num);
			if (num < _0n$1) throw new E("integer: negative integers are not allowed");
			let hex = numberToHexUnpadded(num);
			if (Number.parseInt(hex[0], 16) & 8) hex = "00" + hex;
			if (hex.length & 1) throw new E("unexpected DER parsing assertion: unpadded hex");
			return hex;
		},
		decode(data) {
			const { Err: E } = _DER;
			if (data.length < 1) throw new E("invalid signature integer: empty");
			if (data[0] & 128) throw new E("invalid signature integer: negative");
			if (data.length > 1 && data[0] === 0 && !(data[1] & 128)) throw new E("invalid signature integer: unnecessary leading zero");
			return bytesToNumberBE(data);
		}
	},
	toSig(bytes, maxScalarBytes) {
		const { Err: E, _int: int, _tlv: tlv } = _DER;
		if (maxScalarBytes !== void 0) {
			asafenumber(maxScalarBytes, "maxScalarBytes");
			if (maxScalarBytes < 1) throw new E("invalid signature: maxScalarBytes must be positive");
		}
		const data = abytes(bytes, void 0, "signature");
		const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
		if (seqLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
		const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
		if (sLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		if (maxScalarBytes !== void 0 && (rBytes.length > maxScalarBytes || sBytes.length > maxScalarBytes)) throw new E("invalid signature: integer too large");
		return {
			r: int.decode(rBytes),
			s: int.decode(sBytes)
		};
	},
	hexFromSig(sig) {
		const { _tlv: tlv, _int: int } = _DER;
		validateObject(sig, {
			r: "bigint",
			s: "bigint"
		}, {}, "sig");
		const seq = tlv.encode(2, int.encode(sig.r)) + tlv.encode(2, int.encode(sig.s));
		return tlv.encode(48, seq);
	}
};
/**
* ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
*
*     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
*
* Docs: {@link https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/ | Let's Encrypt ASN.1 guide} and
* {@link https://luca.ntop.org/Teaching/Appunti/asn1.html | Luca Deri's ASN.1 notes}.
* @example
* ASN.1 DER encoding utilities.
*
* ```ts
* const der = DER.hexFromSig({ r: 1n, s: 2n });
* ```
*/
var DER = /* @__PURE__ */ (() => {
	Object.freeze(_DER._tlv);
	Object.freeze(_DER._int);
	return Object.freeze(_DER);
})();
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/weierstrass.js
/**
* Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
*
* ### Design rationale for types
*
* * Interaction between classes from different curves should fail:
*   `k256.Point.BASE.add(p256.Point.BASE)`
* * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
* * Different calls of `curve()` would return different classes -
*   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
*   it won't affect others
*
* TypeScript can't infer types for classes created inside a function. Classes is one instance
* of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
* unique type for every function call.
*
* We can use generic types via some param, like curve opts, but that would:
*     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
*     which is hard to debug.
*     2. Params can be generic and we can't enforce them to be constant value:
*     if somebody creates curve from non-constant params,
*     it would be allowed to interact with other curves with non-constant params
*
* @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n$1) / den;
/** Splits scalar for GLV endomorphism. */
function _splitEndoScalar(k, basis, n) {
	aInRange("scalar", k, _0n, n);
	const [[a1, b1], [a2, b2]] = basis;
	const c1 = divNearest(b2 * k, n);
	const c2 = divNearest(-b1 * k, n);
	let k1 = k - c1 * a1 - c2 * a2;
	let k2 = -c1 * b1 - c2 * b2;
	const k1neg = k1 < _0n;
	const k2neg = k2 < _0n;
	if (k1neg) k1 = -k1;
	if (k2neg) k2 = -k2;
	const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n;
	if (k1 < _0n || k1 >= MAX_NUM || k2 < _0n || k2 >= MAX_NUM) throw new Error("splitScalar (endomorphism): failed for k");
	return {
		k1neg,
		k1,
		k2neg,
		k2
	};
}
function validateSigFormat(format) {
	if (![
		"compact",
		"recovered",
		"der"
	].includes(format)) throw new Error("Signature format must be \"compact\", \"recovered\", or \"der\"");
	return format;
}
function validateSigOpts(opts, def) {
	validateObject(opts);
	const optsn = {};
	for (let optName of Object.keys(def)) optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
	abool(optsn.lowS, "lowS");
	abool(optsn.prehash, "prehash");
	if (optsn.format !== void 0) validateSigFormat(optsn.format);
	return optsn;
}
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
var _2n$1 = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
/**
* Creates weierstrass Point constructor, based on specified curve options.
*
* See {@link WeierstrassOpts}.
* @param params - Curve parameters. See {@link WeierstrassOpts}.
* @param extraOpts - Optional helpers and overrides. See {@link WeierstrassExtraOpts}.
* @returns Weierstrass point constructor.
* @throws If the curve parameters, overrides, or point codecs are invalid. {@link Error}
*
* @example
* Construct a point type from explicit Weierstrass curve parameters.
*
* ```js
* const opts = {
*   p: 0xfffffffffffffffffffffffffffffffeffffac73n,
*   n: 0x100000000000000000001b8fa16dfab9aca16b6b3n,
*   h: 1n,
*   a: 0n,
*   b: 7n,
*   Gx: 0x3b4c382ce37aa192a4019e763036f4f5dd4d7ebbn,
*   Gy: 0x938cf935318fdced6bc28286531733c3f03c4feen,
* };
* const secp160k1_Point = weierstrass(opts);
* ```
*/
function weierstrass(params, extraOpts = {}) {
	const validated = createCurveFields("weierstrass", params, extraOpts);
	const Fp = validated.Fp;
	const Fn = validated.Fn;
	let CURVE = validated.CURVE;
	const { h: cofactor, n: CURVE_ORDER } = CURVE;
	validateObject(extraOpts, {}, {
		allowInfinityPoint: "boolean",
		clearCofactor: "function",
		isTorsionFree: "function",
		fromBytes: "function",
		toBytes: "function",
		endo: "object",
		randomBytes: "function"
	});
	const { endo: endoOpts, allowInfinityPoint, clearCofactor, isTorsionFree, fromBytes, toBytes } = extraOpts;
	const randomBytes = extraOpts.randomBytes === void 0 ? randomBytes$2 : extraOpts.randomBytes;
	if (endoOpts) {
		if (!Fp.is0(CURVE.a) || typeof endoOpts.beta !== "bigint" || !Array.isArray(endoOpts.basises)) throw new Error("invalid endo: expected \"beta\": bigint and \"basises\": array");
	}
	const endo = endoOpts ? {
		beta: endoOpts.beta,
		basises: endoOpts.basises.map((basis) => [...basis])
	} : void 0;
	const lengths = getWLengths(Fp, Fn);
	function assertCompressionIsSupported() {
		if (!Fp.isOdd) throw new Error("compression is not supported: Field does not have .isOdd()");
	}
	function pointToBytes(_c, point, isCompressed) {
		if (point.is0()) {
			if (!allowInfinityPoint) throw new Error("bad point: ZERO");
			return Uint8Array.of(0);
		}
		const { x, y } = point.toAffine();
		const bx = Fp.toBytes(x);
		abool(isCompressed, "isCompressed");
		if (isCompressed) {
			assertCompressionIsSupported();
			return concatBytes(pprefix(!Fp.isOdd(y)), bx);
		} else return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
	}
	function pointFromBytes(bytes) {
		abytes(bytes, void 0, "Point");
		const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
		const length = bytes.length;
		const head = bytes[0];
		const tail = bytes.subarray(1);
		if (allowInfinityPoint && length === 1 && head === 0) return {
			x: Fp.ZERO,
			y: Fp.ZERO
		};
		if (length === comp && (head === 2 || head === 3)) {
			const x = Fp.fromBytes(tail);
			if (!Fp.isValid(x)) throw new Error("bad point: is not on curve, wrong x");
			const y2 = weierstrassEquation(x);
			let y;
			try {
				y = Fp.sqrt(y2);
			} catch (sqrtError) {
				const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
				throw new Error("bad point: is not on curve, sqrt error" + err);
			}
			assertCompressionIsSupported();
			const evenY = Fp.isOdd(y);
			if ((head & 1) === 1 !== evenY) y = Fp.neg(y);
			return {
				x,
				y
			};
		} else if (length === uncomp && head === 4) {
			const L = Fp.BYTES;
			const x = Fp.fromBytes(tail.subarray(0, L));
			const y = Fp.fromBytes(tail.subarray(L, L * 2));
			if (!isValidXY(x, y)) throw new Error("bad point: is not on curve");
			return {
				x,
				y
			};
		} else throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
	}
	const encodePoint = toBytes === void 0 ? pointToBytes : toBytes;
	const decodePoint = fromBytes === void 0 ? pointFromBytes : fromBytes;
	const b3 = Fp.mul(CURVE.b, _3n);
	const mulA = Fp.is0(CURVE.a) ? (_) => Fp.ZERO : (x) => Fp.mul(CURVE.a, x);
	function weierstrassEquation(x) {
		const x2 = Fp.sqr(x);
		const x3 = Fp.mul(x2, x);
		return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
	}
	/** Checks whether equation holds for given x, y: y² == x³ + ax + b */
	function isValidXY(x, y) {
		const left = Fp.sqr(y);
		const right = weierstrassEquation(x);
		return Fp.eql(left, right);
	}
	if (!isValidXY(CURVE.Gx, CURVE.Gy)) throw new Error("bad curve params: generator point");
	const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n), _4n);
	const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
	if (Fp.is0(Fp.add(_4a3, _27b2))) throw new Error("bad curve params: a or b");
	/** Asserts coordinate is valid: 0 <= n < Fp.ORDER. */
	function acoord(title, n, banZero = false) {
		if (!Fp.isValid(n) || banZero && Fp.is0(n)) throw new Error(`bad point coordinate ${title}`);
		return typeof n === "object" && n !== null ? Fp.create(n) : n;
	}
	function aprjpoint(other) {
		if (!(other instanceof Point)) throw new Error("Weierstrass Point expected");
	}
	function splitEndoScalarN(k) {
		if (!endo || !endo.basises) throw new Error("no endo");
		return _splitEndoScalar(k, endo.basises, Fn.ORDER);
	}
	/**
	* Appends a (point, scalar) pair to the inputs of a vartime wNAF walk
	* ({@link mulAddUnsafe}). With GLV endomorphism the scalar is split into two half-width
	* pairs against P and ψ(P) = (β⋅x, y), halving the walk's shared doubling chain;
	* split signs fold into the points.
	*/
	function pushWnafPair(points, scalars, p, k) {
		if (!Fn.isValid(k)) throw new RangeError("invalid scalar: out of range");
		if (endo) {
			const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(k);
			const psi = new Point(Fp.mul(p.X, endo.beta), p.Y, p.Z);
			points.push(k1neg ? p.negate() : p, k2neg ? psi.negate() : psi);
			scalars.push(k1, k2);
		} else {
			points.push(p);
			scalars.push(k);
		}
	}
	const validityCache = /* @__PURE__ */ new WeakSet();
	/**
	* Projective Point works in 3d / projective (homogeneous) coordinates:(X, Y, Z) ∋ (x=X/Z, y=Y/Z).
	* Default Point works in 2d / affine coordinates: (x, y).
	* We're doing calculations in projective, because its operations don't require costly inversion.
	*/
	class Point {
		static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
		static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
		static Fp = Fp;
		static Fn = Fn;
		X;
		Y;
		Z;
		/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
		constructor(X, Y, Z) {
			this.X = acoord("x", X);
			this.Y = acoord("y", Y, true);
			this.Z = acoord("z", Z);
			Object.freeze(this);
		}
		static CURVE() {
			return CURVE;
		}
		/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
		static fromAffine(p) {
			const { x, y } = p || {};
			if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
			if (p instanceof Point) throw new Error("projective point not allowed");
			if (Fp.is0(x) && Fp.is0(y)) return Point.ZERO;
			return new Point(x, y, Fp.ONE);
		}
		static fromBytes(bytes) {
			const P = Point.fromAffine(decodePoint(abytes(bytes, void 0, "point")));
			P.assertValidity();
			return P;
		}
		static fromHex(hex) {
			return Point.fromBytes(hexToBytes(hex));
		}
		get x() {
			return this.toAffine().x;
		}
		get y() {
			return this.toAffine().y;
		}
		/**
		* @param isLazy - true will defer table computation until the first multiplication
		*/
		precompute(windowSize = 6, isLazy = true) {
			wnaf.setWindowSize(this, windowSize);
			if (!isLazy) this.multiply(_3n);
			return this;
		}
		/** A point on curve is valid if it conforms to equation. */
		assertValidity() {
			const p = this;
			if (p.is0()) {
				if (allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z)) return;
				throw new Error("bad point: ZERO");
			}
			if (validityCache.has(p)) return;
			const { x, y } = p.toAffine();
			if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not field elements");
			if (!isValidXY(x, y)) throw new Error("bad point: equation left != right");
			if (!p.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
			validityCache.add(p);
		}
		hasEvenY() {
			const { y } = this.toAffine();
			if (!Fp.isOdd) throw new Error("Field doesn't support isOdd");
			return !Fp.isOdd(y);
		}
		/** Compare one point to another. */
		equals(other) {
			aprjpoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
			const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
			return U1 && U2;
		}
		/** Flips point to one corresponding to (x, -y) in Affine coordinates. */
		negate() {
			return new Point(this.X, Fp.neg(this.Y), this.Z);
		}
		double() {
			const { X: X1, Y: Y1, Z: Z1 } = this;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			let t0 = Fp.mul(X1, X1);
			let t1 = Fp.mul(Y1, Y1);
			let t2 = Fp.mul(Z1, Z1);
			let t3 = Fp.mul(X1, Y1);
			t3 = Fp.add(t3, t3);
			Z3 = Fp.mul(X1, Z1);
			Z3 = Fp.add(Z3, Z3);
			X3 = mulA(Z3);
			Y3 = Fp.mul(b3, t2);
			Y3 = Fp.add(X3, Y3);
			X3 = Fp.sub(t1, Y3);
			Y3 = Fp.add(t1, Y3);
			Y3 = Fp.mul(X3, Y3);
			X3 = Fp.mul(t3, X3);
			Z3 = Fp.mul(b3, Z3);
			t2 = mulA(t2);
			t3 = Fp.sub(t0, t2);
			t3 = mulA(t3);
			t3 = Fp.add(t3, Z3);
			Z3 = Fp.add(t0, t0);
			t0 = Fp.add(Z3, t0);
			t0 = Fp.add(t0, t2);
			t0 = Fp.mul(t0, t3);
			Y3 = Fp.add(Y3, t0);
			t2 = Fp.mul(Y1, Z1);
			t2 = Fp.add(t2, t2);
			t0 = Fp.mul(t2, t3);
			X3 = Fp.sub(X3, t0);
			Z3 = Fp.mul(t2, t1);
			Z3 = Fp.add(Z3, Z3);
			Z3 = Fp.add(Z3, Z3);
			return new Point(X3, Y3, Z3);
		}
		add(other) {
			aprjpoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			let t0 = Fp.mul(X1, X2);
			let t1 = Fp.mul(Y1, Y2);
			let t2 = Fp.mul(Z1, Z2);
			let t3 = Fp.add(X1, Y1);
			let t4 = Fp.add(X2, Y2);
			t3 = Fp.mul(t3, t4);
			t4 = Fp.add(t0, t1);
			t3 = Fp.sub(t3, t4);
			t4 = Fp.add(X1, Z1);
			let t5 = Fp.add(X2, Z2);
			t4 = Fp.mul(t4, t5);
			t5 = Fp.add(t0, t2);
			t4 = Fp.sub(t4, t5);
			t5 = Fp.add(Y1, Z1);
			X3 = Fp.add(Y2, Z2);
			t5 = Fp.mul(t5, X3);
			X3 = Fp.add(t1, t2);
			t5 = Fp.sub(t5, X3);
			Z3 = mulA(t4);
			X3 = Fp.mul(b3, t2);
			Z3 = Fp.add(X3, Z3);
			X3 = Fp.sub(t1, Z3);
			Z3 = Fp.add(t1, Z3);
			Y3 = Fp.mul(X3, Z3);
			t1 = Fp.add(t0, t0);
			t1 = Fp.add(t1, t0);
			t2 = mulA(t2);
			t4 = Fp.mul(b3, t4);
			t1 = Fp.add(t1, t2);
			t2 = Fp.sub(t0, t2);
			t2 = mulA(t2);
			t4 = Fp.add(t4, t2);
			t0 = Fp.mul(t1, t4);
			Y3 = Fp.add(Y3, t0);
			t0 = Fp.mul(t5, t4);
			X3 = Fp.mul(t3, X3);
			X3 = Fp.sub(X3, t0);
			t0 = Fp.mul(t3, t1);
			Z3 = Fp.mul(t5, Z3);
			Z3 = Fp.add(Z3, t0);
			return new Point(X3, Y3, Z3);
		}
		subtract(other) {
			aprjpoint(other);
			return this.add(other.negate());
		}
		is0() {
			return this.equals(Point.ZERO);
		}
		/**
		* Constant time multiplication.
		* Uses precomputed tables (signed fixed-window wNAF) when available.
		* Uses scalar blinding and avoids endomorphism splitting in the secret-scalar path.
		* @param scalar - by which the point would be multiplied
		* @returns New point
		*/
		multiply(scalar) {
			if (!Fn.isValidNot0(scalar)) throw new RangeError("invalid scalar: out of range");
			const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
			return normalize([p, f])[0];
		}
		/**
		* Non-constant-time multiplication. Uses width-4 wNAF with GLV endomorphism splitting
		* when available (two half-width scalars sharing one halved doubling chain).
		* It's faster, but should only be used when you don't care about
		* an exposed secret key e.g. sig verification, which works over *public* keys.
		*/
		multiplyUnsafe(scalar) {
			const p = this;
			const sc = scalar;
			if (!Fn.isValid(sc)) throw new RangeError("invalid scalar: out of range");
			if (sc === _0n || p.is0()) return Point.ZERO;
			if (sc === _1n) return p;
			if (wnaf.hasWindowSize(this)) return wnaf.mulUnsafe(p, sc, normalize);
			const points = [];
			const scalars = [];
			pushWnafPair(points, scalars, p, sc);
			return mulAddUnsafe(Point, points, scalars);
		}
		/**
		* Non-constant-time double-scalar multiplication `a⋅this + b⋅other` (Strauss–Shamir).
		* Both walks share one doubling chain via {@link mulAddUnsafe}, and GLV endomorphism
		* (when available) halves the chain again by splitting each scalar into two half-width
		* parts. Used by ECDSA verification and public-key recovery for `R = u1⋅G + u2⋅P`.
		* Only for public scalars.
		*/
		mulAddUnsafe(a, other, b) {
			aprjpoint(other);
			const points = [];
			const scalars = [];
			pushWnafPair(points, scalars, this, a);
			pushWnafPair(points, scalars, other, b);
			return mulAddUnsafe(Point, points, scalars);
		}
		/**
		* Converts Projective point to affine (x, y) coordinates.
		* (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
		* @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
		*/
		toAffine(invertedZ) {
			const p = this;
			let iz = invertedZ;
			if (iz != null && !Fp.isValid(iz)) throw new RangeError("\"invertedZ\" expected valid field element");
			const { X, Y, Z } = p;
			if (Fp.eql(Z, Fp.ONE)) return {
				x: X,
				y: Y
			};
			const is0 = p.is0();
			if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(Z);
			const x = Fp.mul(X, iz);
			const y = Fp.mul(Y, iz);
			const zz = Fp.mul(Z, iz);
			if (is0) return {
				x: Fp.ZERO,
				y: Fp.ZERO
			};
			if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
			return {
				x,
				y
			};
		}
		/**
		* Checks whether Point is free of torsion elements (is in prime subgroup).
		* Always torsion-free for cofactor=1 curves.
		*/
		isTorsionFree() {
			if (cofactor === _1n) return true;
			if (isTorsionFree) return isTorsionFree(Point, this);
			return wnaf.mulUnsafe(this, CURVE_ORDER).is0();
		}
		clearCofactor() {
			if (cofactor === _1n) return this;
			if (clearCofactor) return clearCofactor(Point, this);
			return this.multiplyUnsafe(cofactor);
		}
		isSmallOrder() {
			if (cofactor === _1n) return this.is0();
			return this.clearCofactor().is0();
		}
		toBytes(isCompressed = true) {
			abool(isCompressed, "isCompressed");
			this.assertValidity();
			return encodePoint(Point, this, isCompressed);
		}
		toHex(isCompressed = true) {
			return bytesToHex(this.toBytes(isCompressed));
		}
		toString() {
			return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
		}
	}
	const normalize = (points) => normalizeZ(Point, points);
	const wnaf = new ScalarMultiplier(Point, randomBytes);
	if (wnaf.bits >= 6) Point.BASE.precompute(6);
	Object.freeze(Point.prototype);
	Object.freeze(Point);
	return Point;
}
function pprefix(hasEvenY) {
	return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
	return {
		secretKey: Fn.BYTES,
		publicKey: 1 + Fp.BYTES,
		publicKeyUncompressed: 1 + 2 * Fp.BYTES,
		publicKeyHasPrefix: true,
		signature: 2 * Fn.BYTES
	};
}
/**
* Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
* This helper ensures no signature functionality is present. Less code, smaller bundle size.
* @param Point - Weierstrass point constructor.
* @param ecdhOpts - Optional randomness helpers:
*   - `randomBytes` (optional): Optional RNG override.
* @returns ECDH helper namespace.
* @example
* Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
*
* ```ts
* import { ecdh } from '@noble/curves/abstract/weierstrass.js';
* import { p256 } from '@noble/curves/nist.js';
* const dh = ecdh(p256.Point);
* const alice = dh.keygen();
* const shared = dh.getSharedSecret(alice.secretKey, alice.publicKey);
* ```
*/
function ecdh(Point, ecdhOpts = {}) {
	validatePointCons(Point);
	const { Fn } = Point;
	const randomBytes_ = ecdhOpts.randomBytes === void 0 ? randomBytes$2 : ecdhOpts.randomBytes;
	const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: Math.max(getMinHashLength(Fn.ORDER), 16) });
	function isValidSecretKey(secretKey) {
		try {
			const num = Fn.fromBytes(secretKey);
			return Fn.isValidNot0(num);
		} catch (error) {
			return false;
		}
	}
	function isValidPublicKey(publicKey, isCompressed) {
		const { publicKey: comp, publicKeyUncompressed } = lengths;
		try {
			const l = publicKey.length;
			if (isCompressed === true && l !== comp) return false;
			if (isCompressed === false && l !== publicKeyUncompressed) return false;
			return !Point.fromBytes(publicKey).is0();
		} catch (error) {
			return false;
		}
	}
	/**
	* Produces cryptographically secure secret key from random of size
	* (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
	*/
	function randomSecretKey(seed) {
		seed = seed === void 0 ? randomBytes_(lengths.seed) : seed;
		return mapHashToField(abytes(seed, lengths.seed, "seed"), Fn.ORDER);
	}
	/**
	* Computes public key for a secret key. Checks for validity of the secret key.
	* @param isCompressed - whether to return compact (default), or full key
	* @returns Public key, full when isCompressed=false; short when isCompressed=true
	*/
	function getPublicKey(secretKey, isCompressed = true) {
		return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
	}
	/**
	* Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
	*/
	function isProbPub(item) {
		const { secretKey, publicKey, publicKeyUncompressed } = lengths;
		const allowedLengths = Fn._lengths;
		if (!isBytes(item)) return void 0;
		const l = abytes(item, void 0, "key").length;
		const isPub = l === publicKey || l === publicKeyUncompressed;
		const isSec = l === secretKey || !!allowedLengths?.includes(l);
		if (isPub && isSec) return void 0;
		return isPub;
	}
	/**
	* ECDH (Elliptic Curve Diffie Hellman).
	* Computes encoded shared point from secret key A and public key B.
	* Checks: 1) secret key validity 2) shared key is on-curve.
	* Does NOT hash the result or expose the SEC 1 x-coordinate-only `z`.
	* Returns the encoded shared point on purpose: callers that need `x_P`
	* can derive it from the encoded point, but `x_P` alone cannot recover the
	* point/parity back.
	* This helper only exposes the fully validated public-key path, not cofactor DH.
	* @param isCompressed - whether to return compact (default), or full key
	* @returns shared point encoding
	*/
	function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
		if (isProbPub(secretKeyA) === true) throw new Error("first arg must be private key");
		if (isProbPub(publicKeyB) === false) throw new Error("second arg must be public key");
		const s = Fn.fromBytes(secretKeyA);
		const b = Point.fromBytes(publicKeyB);
		if (b.is0()) throw new Error("invalid public key: point at infinity");
		return b.multiply(s).toBytes(isCompressed);
	}
	const utils = {
		isValidSecretKey,
		isValidPublicKey,
		randomSecretKey
	};
	const keygen = createKeygen(randomSecretKey, getPublicKey);
	Object.freeze(utils);
	Object.freeze(lengths);
	return Object.freeze({
		getPublicKey,
		getSharedSecret,
		keygen,
		Point,
		utils,
		lengths
	});
}
/**
* Creates ECDSA signing interface for given elliptic curve `Point` and `hash` function.
*
* @param Point - created using {@link weierstrass} function
* @param hash - used for 1) message prehash-ing 2) k generation in `sign`, using hmac_drbg(hash)
* @param ecdsaOpts - rarely needed, see {@link ECDSAOpts}:
*   - `lowS`: Default low-S policy.
*   - `hmac`: HMAC implementation used by RFC6979 DRBG.
*   - `randomBytes`: Optional RNG override.
*   - `bits2int`: Optional hash-to-int conversion override.
*   - `bits2int_modN`: Optional hash-to-int-mod-n conversion override.
*
* @returns ECDSA helper namespace.
* @example
* Create an ECDSA signer/verifier bundle for one curve implementation.
*
* ```ts
* import { ecdsa } from '@noble/curves/abstract/weierstrass.js';
* import { p256 } from '@noble/curves/nist.js';
* import { sha256 } from '@noble/hashes/sha2.js';
* const p256ecdsa = ecdsa(p256.Point, sha256);
* const { secretKey, publicKey } = p256ecdsa.keygen();
* const msg = new TextEncoder().encode('hello noble');
* const sig = p256ecdsa.sign(msg, secretKey);
* const isValid = p256ecdsa.verify(sig, msg, publicKey);
* ```
*/
function ecdsa(Point, hash, ecdsaOpts = {}) {
	validatePointCons(Point);
	const hash_ = hash;
	ahash(hash_);
	validateObject(ecdsaOpts, {}, {
		hmac: "function",
		lowS: "boolean",
		randomBytes: "function",
		bits2int: "function",
		bits2int_modN: "function"
	});
	const opts = Object.assign({}, ecdsaOpts);
	const randomBytes = opts.randomBytes === void 0 ? randomBytes$2 : opts.randomBytes;
	const hmac$1 = opts.hmac === void 0 ? (key, msg) => hmac(hash_, key, msg) : opts.hmac;
	const { Fp, Fn } = Point;
	const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
	const blindLength = getMinHashLength(CURVE_ORDER);
	const csprng = probeRandomBytes(randomBytes, blindLength);
	const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, opts);
	const defaultSigOpts = {
		prehash: true,
		lowS: typeof opts.lowS === "boolean" ? opts.lowS : true,
		format: "compact",
		extraEntropy: false
	};
	const hasLargeRecoveryLifts = CURVE_ORDER * _2n$1 + _1n < Fp.ORDER;
	function isBiggerThanHalfOrder(number) {
		return number > CURVE_ORDER >> _1n;
	}
	function validateRS(title, num) {
		if (!Fn.isValidNot0(num)) throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
		return num;
	}
	function assertFieldSignIsSupported() {
		if (!Fp.isOdd) throw new Error("Field doesn't support isOdd");
	}
	function getRecoveryBit(x, y, r) {
		assertFieldSignIsSupported();
		return (x === r ? 0 : 2) | Number(Fp.isOdd(y));
	}
	function assertRecoverableCurve() {
		if (hasLargeRecoveryLifts) throw new Error("\"recovered\" sig type is not supported for cofactor >2 curves");
	}
	function validateSigLength(bytes, format) {
		validateSigFormat(format);
		const size = lengths.signature;
		return abytes(bytes, format === "compact" ? size : format === "recovered" ? size + 1 : void 0);
	}
	/**
	* ECDSA signature with its (r, s) properties. Supports compact, recovered & DER representations.
	*/
	class Signature {
		r;
		s;
		recovery;
		constructor(r, s, recovery) {
			this.r = validateRS("r", r);
			this.s = validateRS("s", s);
			if (recovery != null) {
				assertRecoverableCurve();
				if (![
					0,
					1,
					2,
					3
				].includes(recovery)) throw new Error("invalid recovery id");
				this.recovery = recovery;
			}
			Object.freeze(this);
		}
		static fromBytes(bytes, format = defaultSigOpts.format) {
			validateSigLength(bytes, format);
			let recid;
			if (format === "der") {
				if (bytes.length > 2 * Fn.BYTES + 16) throw new DER.Err("invalid signature: DER signature too long");
				const { r, s } = DER.toSig(abytes(bytes), Fn.BYTES + 1);
				return new Signature(r, s);
			}
			if (format === "recovered") {
				recid = bytes[0];
				format = "compact";
				bytes = bytes.subarray(1);
			}
			const L = lengths.signature / 2;
			const r = bytes.subarray(0, L);
			const s = bytes.subarray(L, L * 2);
			return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
		}
		static fromHex(hex, format) {
			return this.fromBytes(hexToBytes(hex), format);
		}
		assertRecovery() {
			const { recovery } = this;
			if (recovery == null) throw new Error("invalid recovery id: must be present");
			return recovery;
		}
		addRecoveryBit(recovery) {
			return new Signature(this.r, this.s, recovery);
		}
		recoverPublicKey(messageHash) {
			const { r, s } = this;
			const recovery = this.assertRecovery();
			const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
			if (!Fp.isValid(radj)) throw new Error("invalid recovery id: sig.r+curve.n != R.x");
			const x = Fp.toBytes(radj);
			const R = Point.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
			const ir = Fn.inv(radj);
			const h = bits2int_modN(abytes(messageHash, void 0, "msgHash"));
			const u1 = Fn.create(-h * ir);
			const u2 = Fn.create(s * ir);
			const Q = Point.BASE.mulAddUnsafe(u1, R, u2);
			if (Q.is0()) throw new Error("invalid recovery: point at infinify");
			Q.assertValidity();
			return Q;
		}
		hasHighS() {
			return isBiggerThanHalfOrder(this.s);
		}
		toBytes(format = defaultSigOpts.format) {
			validateSigFormat(format);
			if (format === "der") return hexToBytes(DER.hexFromSig(this));
			const { r, s } = this;
			const rb = Fn.toBytes(r);
			const sb = Fn.toBytes(s);
			if (format === "recovered") {
				assertRecoverableCurve();
				return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
			}
			return concatBytes(rb, sb);
		}
		toHex(format) {
			return bytesToHex(this.toBytes(format));
		}
	}
	Object.freeze(Signature.prototype);
	Object.freeze(Signature);
	const bits2int = opts.bits2int === void 0 ? function bits2int_def(bytes) {
		if (bytes.length > 8192) throw new Error("input is too large");
		const num = bytesToNumberBE(bytes);
		const delta = bytes.length * 8 - fnBits;
		return delta > 0 ? num >> BigInt(delta) : num;
	} : opts.bits2int;
	const bits2int_modN = opts.bits2int_modN === void 0 ? function bits2int_modN_def(bytes) {
		return Fn.create(bits2int(bytes));
	} : opts.bits2int_modN;
	const ORDER_MASK = bitMask(fnBits);
	/** Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`. */
	function int2octets(num) {
		aInRange("num < 2^" + fnBits, num, _0n, ORDER_MASK);
		return Fn.toBytes(num);
	}
	function validateMsgAndHash(message, prehash) {
		abytes(message, void 0, "message");
		return prehash ? abytes(hash_(message), void 0, "prehashed message") : message;
	}
	/**
	* Steps A, D of RFC6979 3.2.
	* Creates RFC6979 seed; converts msg/privKey to numbers.
	* Used only in sign, not in verify.
	*
	* Warning: we cannot assume here that message has same amount of bytes as curve order,
	* this will be invalid at least for P521. Also it can be bigger for P224 + SHA256.
	*/
	function prepSig(message, secretKey, opts) {
		const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
		message = validateMsgAndHash(message, prehash);
		const h1int = bits2int_modN(message);
		const d = Fn.fromBytes(secretKey);
		if (!Fn.isValidNot0(d)) throw new Error("invalid private key");
		const seedArgs = [int2octets(d), int2octets(h1int)];
		if (extraEntropy != null && extraEntropy !== false) {
			const e = extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy;
			seedArgs.push(abytes(e, void 0, "extraEntropy"));
		}
		const seed = concatBytes(...seedArgs);
		const m = h1int;
		function k2sig(kBytes) {
			const k = bits2int(kBytes);
			if (!Fn.isValidNot0(k)) return;
			const q = Point.BASE.multiply(k).toAffine();
			const r = Fn.create(q.x);
			if (r === _0n) return;
			let s;
			if (csprng !== void 0) {
				const b = bytesToNumberBE(mapHashToField(csprng(blindLength), CURVE_ORDER));
				const ibk = Fn.inv(Fn.mul(b, k));
				const bm = Fn.mul(b, m);
				const bd = Fn.mul(b, d);
				s = Fn.create(ibk * Fn.create(bm + bd * r));
			} else {
				const ik = invertCt(k, CURVE_ORDER);
				s = Fn.create(ik * Fn.create(m + r * d));
			}
			if (s === _0n) return;
			let recovery = getRecoveryBit(q.x, q.y, r);
			let normS = s;
			if (lowS && isBiggerThanHalfOrder(s)) {
				normS = Fn.neg(s);
				recovery ^= 1;
			}
			return new Signature(r, normS, hasLargeRecoveryLifts ? void 0 : recovery);
		}
		return {
			seed,
			k2sig
		};
	}
	/**
	* Signs a message or message hash with a secret key.
	* With the default `prehash: true`, raw message bytes are hashed internally;
	* only `{ prehash: false }` expects a caller-supplied digest.
	*
	* ```
	* sign(m, d) where
	*   k = rfc6979_hmac_drbg(m, d)
	*   (x, y) = G × k
	*   r = x mod n
	*   s = (m + dr) / k mod n
	* ```
	*/
	function sign(message, secretKey, opts = {}) {
		const { seed, k2sig } = prepSig(message, secretKey, opts);
		return createHmacDrbg(hash_.outputLen, Fn.BYTES, hmac$1)(seed, k2sig).toBytes(opts.format);
	}
	/**
	* Verifies a signature against message and public key.
	* Rejects lowS signatures by default: see {@link ECDSAVerifyOpts}.
	* Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
	*
	* ```
	* verify(r, s, h, P) where
	*   u1 = hs^-1 mod n
	*   u2 = rs^-1 mod n
	*   R = u1⋅G + u2⋅P
	*   mod(R.x, n) == r
	* ```
	*/
	function verify(signature, message, publicKey, opts = {}) {
		const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
		publicKey = abytes(publicKey, void 0, "publicKey");
		message = validateMsgAndHash(message, prehash);
		if (!isBytes(signature)) {
			const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
			throw new Error("verify expects Uint8Array signature" + end);
		}
		validateSigLength(signature, format);
		try {
			const sig = Signature.fromBytes(signature, format);
			const P = Point.fromBytes(publicKey);
			if (P.is0()) return false;
			if (lowS && sig.hasHighS()) return false;
			const { r, s } = sig;
			const h = bits2int_modN(message);
			const is = Fn.inv(s);
			const u1 = Fn.create(h * is);
			const u2 = Fn.create(r * is);
			const R = Point.BASE.mulAddUnsafe(u1, P, u2);
			if (R.is0()) return false;
			const q = R.toAffine();
			if (Fn.create(q.x) !== r) return false;
			if (format === "recovered" && sig.recovery !== getRecoveryBit(q.x, q.y, r)) return false;
			return true;
		} catch (e) {
			return false;
		}
	}
	function recoverPublicKey(signature, message, opts = {}) {
		const { prehash } = validateSigOpts(opts, defaultSigOpts);
		message = validateMsgAndHash(message, prehash);
		return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
	}
	return Object.freeze({
		keygen,
		getPublicKey,
		getSharedSecret,
		utils,
		lengths,
		Point,
		sign,
		verify,
		recoverPublicKey,
		Signature,
		hash: hash_
	});
}
//#endregion
//#region node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/secp256k1.js
/**
* SECG secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
*
* Belongs to Koblitz curves: it has efficiently-computable GLV endomorphism ψ,
* check out {@link EndomorphismOpts}. Seems to be rigid (not backdoored).
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1_CURVE = {
	p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
	n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
	h: BigInt(1),
	a: BigInt(0),
	b: BigInt(7),
	Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
	Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
	beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
	basises: [[BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")], [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]]
};
var _2n = /* @__PURE__ */ BigInt(2);
/**
* √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
* (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
*/
function sqrtMod(y) {
	const P = secp256k1_CURVE.p;
	const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
	const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
	const b2 = y * y * y % P;
	const b3 = b2 * b2 * y % P;
	const b11 = pow2(pow2(pow2(b3, _3n, P) * b3 % P, _3n, P) * b3 % P, _2n, P) * b2 % P;
	const b22 = pow2(b11, _11n, P) * b11 % P;
	const b44 = pow2(b22, _22n, P) * b22 % P;
	const b88 = pow2(b44, _44n, P) * b44 % P;
	const root = pow2(pow2(pow2(pow2(pow2(pow2(b88, _88n, P) * b88 % P, _44n, P) * b44 % P, _3n, P) * b3 % P, _23n, P) * b22 % P, _6n, P) * b2 % P, _2n, P);
	if (!Fpk1.eql(Fpk1.sqr(root), y)) throw new Error("Cannot find square root");
	return root;
}
var Fpk1 = /* @__PURE__ */ Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
/**
* secp256k1 curve: ECDSA and ECDH methods.
*
* Uses sha256 to hash messages. To use a different hash,
* pass `{ prehash: false }` to sign / verify.
*
* @example
* Generate one secp256k1 keypair, sign a message, and verify it.
*
* ```js
* import { secp256k1 } from '@noble/curves/secp256k1.js';
* const { secretKey, publicKey } = secp256k1.keygen();
* // const publicKey = secp256k1.getPublicKey(secretKey);
* const msg = new TextEncoder().encode('hello noble');
* const sig = secp256k1.sign(msg, secretKey);
* const isValid = secp256k1.verify(sig, msg, publicKey);
* // const sigKeccak = secp256k1.sign(keccak256(msg), secretKey, { prehash: false });
* ```
*/
var secp256k1 = /* @__PURE__ */ ecdsa(/* @__PURE__ */ weierstrass(secp256k1_CURVE, {
	Fp: Fpk1,
	endo: secp256k1_ENDO
}), sha256);
//#endregion
//#region packages/core/src/ai/venice.ts
var HKDF_INFO = utf8("ecdsa_encryption");
var AI_TOKEN_INFO = utf8("poof/v1/ai-token");
var PUB_LEN = 65;
var IV_LEN = 12;
/** Smallest encrypted payload: key ‖ IV ‖ tag, in hex. */
var MIN_CIPHER_HEX = 186;
var QUOTE_MIN_LEN = 632;
var TEE_TYPE_TDX = 129;
var TD_ATTRIBUTES = 168;
var REPORT_DATA = 568;
/** Zero-fill secret bytes once they're no longer needed. */
function wipe(bytes) {
	bytes.fill(0);
}
/** A fresh session key pair (one per AI request). */
function generateAiSessionKeys() {
	const privateKey = secp256k1.utils.randomSecretKey();
	return {
		privateKey,
		publicKeyHex: toHex(secp256k1.getPublicKey(privateKey, false))
	};
}
/** 32 random bytes to bind an attestation to this request, and their hex. */
function newAttestationNonce() {
	const nonce = randomBytes(32);
	return {
		bytes: nonce,
		hex: toHex(nonce)
	};
}
/**
* Checks the enclave's attestation and returns the model's public key (130 hex chars, "04…").
*
* It checks that the TDX quote is a non-debug TD whose REPORTDATA binds the model's signing key
* (its Ethereum address) and our fresh nonce. It does NOT verify Intel's signature chain over the
* quote (DCAP: PCK certificate → Intel root); until that is added, the quote's authenticity rests
* on the provider's `verified` flag.
*/
async function verifyAttestation(att, nonce, expectedModel) {
	if (nonce.length !== 32) attestationFailed("the nonce must be 32 bytes");
	if (att.verified !== true) attestationFailed("the provider did not verify the enclave");
	if (att.nonce?.toLowerCase() !== toHex(nonce)) attestationFailed("the attestation is for another nonce");
	if (att.model !== expectedModel) attestationFailed("the attestation is for another model");
	const modelKey = normaliseModelKey(att.signing_key ?? att.signing_public_key);
	if (!modelKey) return attestationFailed("the attestation has no valid signing key");
	const quote = decodeQuote(att.intel_quote);
	if (!quote || quote.length < QUOTE_MIN_LEN) return attestationFailed("the TDX quote is missing or too short");
	const view = new DataView(quote.buffer, quote.byteOffset, quote.byteLength);
	if (view.getUint32(4, true) !== TEE_TYPE_TDX) attestationFailed("the quote is not from a TDX enclave");
	if ((view.getUint8(TD_ATTRIBUTES) & 1) !== 0) attestationFailed("the enclave runs in debug mode");
	const reportData = quote.subarray(REPORT_DATA, 632);
	if (!equalBytes(reportData.subarray(0, 20), ethAddress(fromHex(modelKey)))) attestationFailed("the quote does not bind the signing key");
	const boundNonce = reportData.subarray(32, 64);
	const rawMatch = equalBytes(boundNonce, nonce);
	const hashMatch = equalBytes(boundNonce, await sha256$1(nonce));
	if (!rawMatch && !hashMatch) attestationFailed("the quote does not bind our nonce");
	return modelKey;
}
function attestationFailed(reason) {
	throw new PoofError("ai_attestation_failed", reason);
}
/** Encrypt one message to the model: hex(ephemeral pub ‖ IV ‖ AES-GCM ciphertext+tag). */
async function encryptForModel(plaintext, modelPubKeyHex) {
	const modelKey = normaliseModelKey(modelPubKeyHex);
	if (!modelKey) throw new PoofError("ai_attestation_failed", "invalid model key");
	const ephemeral = secp256k1.utils.randomSecretKey();
	try {
		const ephemeralPub = secp256k1.getPublicKey(ephemeral, false);
		const key = await deriveKey(ephemeral, fromHex(modelKey));
		const iv = randomBytes(IV_LEN);
		const ct = await crypto.subtle.encrypt({
			name: "AES-GCM",
			iv
		}, key, utf8(plaintext));
		return toHex(concat(ephemeralPub, iv, new Uint8Array(ct)));
	} finally {
		wipe(ephemeral);
	}
}
/**
* Decrypt one streamed piece of the answer. Empty or whitespace-only content passes through;
* anything else must be ciphertext to our session key, or it is refused (fail closed).
*/
async function decryptAiChunk(content, keys) {
	if (content.trim() === "") return content;
	if (content.length < MIN_CIPHER_HEX || !isHex(content)) throw new PoofError("ai_failed", "the AI sent an unencrypted answer");
	const data = fromHex(content);
	if (data[0] !== 4) throw new PoofError("ai_failed", "the AI sent an unencrypted answer");
	try {
		const key = await deriveKey(keys.privateKey, data.subarray(0, PUB_LEN));
		const iv = data.slice(PUB_LEN, 77);
		const pt = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv
		}, key, data.slice(77));
		return fromUtf8(new Uint8Array(pt));
	} catch {
		throw new PoofError("ai_failed", "the AI answer could not be decrypted");
	}
}
/**
* Parse the SSE body and yield decrypted text pieces in order. Ends at `data: [DONE]` (or a
* finish chunk followed by end of stream); a stream that just stops is reported as `ai_failed`.
*/
async function* readAiStream(body, keys) {
	const reader = body.getReader();
	const decoder = new TextDecoder("utf-8");
	let buffer = "";
	let finished = false;
	let done = false;
	try {
		while (!done) {
			let chunk;
			try {
				chunk = await reader.read();
			} catch {
				throw new PoofError("ai_failed", "the AI answer broke off");
			}
			if (chunk.done) {
				buffer += decoder.decode();
				done = true;
			} else buffer += decoder.decode(chunk.value, { stream: true });
			const lines = buffer.split("\n");
			buffer = done ? "" : lines.pop();
			for (const raw of lines) {
				const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
				if (!line.startsWith("data:")) continue;
				const data = line.slice(line.startsWith("data: ") ? 6 : 5).trim();
				if (data === "[DONE]") return;
				const event = parseEvent(data);
				if (event.finished) finished = true;
				if (event.content !== void 0) {
					const text = await decryptAiChunk(event.content, keys);
					if (text !== "") yield text;
				}
			}
		}
		if (!finished) throw new PoofError("ai_failed", "the AI answer broke off");
	} finally {
		await reader.cancel().catch(() => void 0);
		reader.releaseLock();
	}
}
/**
* The room's AI token: HKDF-SHA-256(roomKey, info "poof/v1/ai-token"), base64url (43 chars), and
* its hash base64url(SHA-256(token bytes)), the same form as ownerSecret/ownerHash.
*/
async function deriveAiToken(roomKey) {
	const raw = await hkdf(roomKey, /* @__PURE__ */ new Uint8Array(0), AI_TOKEN_INFO, 32);
	try {
		return {
			token: toBase64Url(raw),
			hash: toBase64Url(await sha256$1(raw))
		};
	} finally {
		wipe(raw);
	}
}
function parseEvent(data) {
	let event;
	try {
		event = JSON.parse(data);
	} catch {
		throw new PoofError("ai_failed", "the AI sent an unreadable event");
	}
	if (typeof event !== "object" || event === null) throw new PoofError("ai_failed", "the AI sent an unreadable event");
	if ("error" in event && event.error !== void 0 && event.error !== null) throw new PoofError("ai_unavailable", "the AI returned an error");
	const choice = "choices" in event && Array.isArray(event.choices) ? event.choices[0] : void 0;
	if (typeof choice !== "object" || choice === null) return { finished: false };
	const finished = "finish_reason" in choice && choice.finish_reason !== null && choice.finish_reason !== void 0;
	const delta = "delta" in choice ? choice.delta : void 0;
	if (typeof delta !== "object" || delta === null || !("content" in delta)) return { finished };
	const content = delta.content;
	if (content === null || content === void 0) return { finished };
	if (typeof content !== "string") throw new PoofError("ai_failed", "the AI sent an unreadable event");
	return {
		content,
		finished
	};
}
/** AES-256-GCM key from x(ECDH(secret, public)) via HKDF-SHA-256 ("ecdsa_encryption"). */
async function deriveKey(secret, publicKey) {
	const point = secp256k1.getSharedSecret(secret, publicKey, false);
	const shared = point.slice(1, 33);
	wipe(point);
	try {
		const raw = await hkdf(shared, /* @__PURE__ */ new Uint8Array(0), HKDF_INFO, 32);
		try {
			return await importAesKey(raw);
		} finally {
			wipe(raw);
		}
	} finally {
		wipe(shared);
	}
}
/** "04"-prefixed lowercase hex of a valid uncompressed secp256k1 key, or undefined. */
function normaliseModelKey(key) {
	if (typeof key !== "string") return void 0;
	let hex = key.toLowerCase();
	if (hex.startsWith("0x")) hex = hex.slice(2);
	if (hex.length === 128) hex = `04${hex}`;
	if (hex.length !== 130 || !hex.startsWith("04") || !isHex(hex)) return void 0;
	return secp256k1.utils.isValidPublicKey(fromHex(hex), false) ? hex : void 0;
}
/** Ethereum address: the last 20 bytes of keccak256(x ‖ y). */
function ethAddress(uncompressed) {
	return keccak_256(uncompressed.subarray(1)).subarray(12);
}
/** The quote as hex, or base64 (standard or url-safe, padding optional). */
function decodeQuote(quote) {
	if (typeof quote !== "string" || quote === "") return void 0;
	const text = quote.trim();
	if (isHex(text)) return fromHex(text);
	if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(text)) return void 0;
	const std = text.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
	try {
		return fromBase64(std + "=".repeat((4 - std.length % 4) % 4));
	} catch {
		return;
	}
}
function isHex(text) {
	return text.length % 2 === 0 && /^[0-9a-f]*$/i.test(text);
}
function toHex(data) {
	let out = "";
	for (const b of data) out += b.toString(16).padStart(2, "0");
	return out;
}
/** Callers check `isHex` first. */
function fromHex(hex) {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
	return out;
}
//#endregion
//#region packages/core/src/ai/client.ts
/** An API error body → the engine's error. AI codes first: the budget one comes with a 429. */
function aiError(status, body) {
	const err = errorBodySchema.safeParse(body);
	const message = err.success ? err.data.error.message : `Server error ${status}.`;
	switch (err.success ? err.data.error.code : null) {
		case "ai_not_enabled": return new PoofError("ai_not_enabled", message);
		case "ai_not_ready": return new PoofError("ai_not_ready", message);
		case "ai_budget_exhausted": return new PoofError("ai_budget_exhausted", message);
		case "room_not_found": return new PoofError("room_not_found", message);
		case "not_owner": return new PoofError("not_owner", message);
		case "rate_limited": return new PoofError("rate_limited", message);
		default: return status === 429 ? new PoofError("rate_limited", message) : new PoofError("ai_unavailable", message);
	}
}
/**
* Talks to the AI model through the API, end-to-end encrypted to its enclave:
* 1. fetch the enclave's attestation (with a fresh nonce) and check it binds the model key;
* 2. encrypt the prompt to that key and stream the encrypted answer back, decrypting as it comes.
* The API only ever relays ciphertext. One enclave session (key pair + model key) is reused until
* an answer fails to decrypt, then it's dropped and the next question attests again.
*/
var AiClient = class {
	deps;
	token = null;
	enclave = null;
	constructor(deps) {
		this.deps = deps;
	}
	/** The room's AI token and its hash (derived from the room key, never sent anywhere but the API). */
	aiToken() {
		this.token ??= deriveAiToken(this.deps.roomKey);
		return this.token;
	}
	/** Creator only: register the room's AI token hash, so members can use the AI. */
	async register(ownerSecret) {
		const { hash } = await this.aiToken();
		const res = await this.post(`/api/rooms/${this.deps.roomId}/ai`, {
			ownerSecret,
			aiHash: hash
		});
		if (!res.ok) throw aiError(res.status, await res.json().catch(() => null));
	}
	/**
	* Ask the model. Yields the answer in pieces as it arrives. Rejects with PoofError: `ai_*`,
	* `rate_limited`, `room_not_found`, `connection_failed`.
	*/
	async *ask(prompt, signal) {
		const { token } = await this.aiToken();
		const enclave = await this.attested();
		const [system, user] = await Promise.all([encryptForModel(prompt.system, enclave.modelPubKey), encryptForModel(prompt.user, enclave.modelPubKey)]);
		const res = await this.post("/api/ai/chat", {
			roomId: this.deps.roomId,
			aiToken: token,
			clientPubKey: enclave.keys.publicKeyHex,
			modelPubKey: enclave.modelPubKey,
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: user
			}]
		}, signal);
		if (!res.ok || !res.body) throw aiError(res.status, await res.json().catch(() => null));
		try {
			yield* readAiStream(res.body, enclave.keys);
		} catch (error) {
			if (error instanceof PoofError && error.code === "ai_failed") this.forget();
			throw error;
		}
	}
	/** Drop the enclave session and wipe its private key. */
	forget() {
		const old = this.enclave;
		this.enclave = null;
		old?.then((e) => wipe(e.keys.privateKey)).catch(() => void 0);
	}
	attested() {
		if (!this.enclave) {
			const attempt = this.attest();
			this.enclave = attempt;
			attempt.catch(() => {
				if (this.enclave === attempt) this.enclave = null;
			});
		}
		return this.enclave;
	}
	async attest() {
		const { token } = await this.aiToken();
		const nonce = newAttestationNonce();
		const res = await this.post("/api/ai/attestation", {
			roomId: this.deps.roomId,
			aiToken: token,
			nonce: nonce.hex
		});
		if (!res.ok) throw aiError(res.status, await res.json().catch(() => null));
		const parsed = aiAttestationSchema.safeParse(await res.json().catch(() => null));
		if (!parsed.success) throw new PoofError("ai_attestation_failed", "Unreadable attestation.");
		const modelPubKey = await verifyAttestation(parsed.data, nonce.bytes, AI_MODEL);
		return {
			keys: generateAiSessionKeys(),
			modelPubKey
		};
	}
	async post(path, body, signal) {
		try {
			return await this.deps.fetch(`${this.deps.origin}${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
				...signal ? { signal } : {}
			});
		} catch {
			if (signal?.aborted) throw new PoofError("ai_failed", "Stopped.");
			throw new PoofError("connection_failed", "Could not reach the server.");
		}
	}
};
//#endregion
//#region packages/core/src/ai/prompt.ts
/**
* The system prompt: how the chat looks, nothing else. It adds no rules of its own; what
* "uncensored" means is the model's. Public, like all the engine code.
*/
var AI_SYSTEM_PROMPT = [
	"You are the AI in a private, temporary group chat.",
	"Messages from people are prefixed with their name, like \"Ana: ...\", and your own earlier answers with \"AI: ...\".",
	"Answer the latest message, which is addressed to you.",
	"Reply in the language it was written in.",
	"Be direct and concise unless asked for detail.",
	"You have no memory beyond this conversation and no access to the internet."
].join(" ");
/**
* The most conversation sent with one question, in UTF-8 bytes. It keeps the request well inside
* the model's context and the API's body cap (the ciphertext travels as hex, twice the size).
*/
var AI_CONTEXT_MAX_BYTES = 12e4;
/** True if this message asks the AI (it starts with @ai). */
function mentionsAi(text) {
	return AI_MENTION.test(text);
}
/** The question without its leading "@ai". */
function stripMention(text) {
	return text.replace(AI_MENTION, "").trim();
}
/**
* The prompt for one question: the system prompt, then as much of the recent conversation as fits
* (oldest lines dropped first), then the question. Everything goes in one encrypted user message:
* the provider would see earlier answers sent as assistant turns, which aren't encrypted.
*/
function buildAiPrompt(history, question) {
	const last = `${question.speaker}: ${question.text}`;
	let budget = AI_CONTEXT_MAX_BYTES - utf8(last).length;
	const lines = [];
	for (let i = history.length - 1; i >= 0 && budget > 0; i--) {
		const turn = history[i];
		const line = `${turn.speaker}: ${turn.text}`;
		const size = utf8(line).length + 1;
		if (size > budget) break;
		budget -= size;
		lines.unshift(line);
	}
	return {
		system: AI_SYSTEM_PROMPT,
		user: lines.length > 0 ? `The conversation so far:\n${lines.join("\n")}\n\nThe latest message, to you:\n${last}` : last
	};
}
//#endregion
//#region node_modules/.pnpm/@scure+bip39@2.4.0/node_modules/@scure/bip39/wordlists/english.js
/** English BIP39 wordlist. */
var wordlist = /* @__PURE__ */ Object.freeze(`abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n"));
//#endregion
//#region packages/core/src/phrase.ts
/**
* 4-word phrase invite.
*
*   phrase = 4 words from the BIP-39 English list (2048 words → 44 bits), joined by "-"
*   seed   = PBKDF2-SHA256(phrase, salt = "poof/v1/handshake", 200,000 iterations, 32 bytes)
*   id     = base64url(HKDF(seed, "id"))      → the mailbox address (43 chars)
*   key    = HKDF(seed, "key")                → AES-256-GCM
*   blob   = base64(nonce(12) ‖ AES-GCM(key, nonce, room URL with #key))
*
* The mailbox id comes from the same slow derivation as the key, so the server can't recover the
* phrase with a fast hash. Brute force costs 2^44 × 200k PBKDF2 iterations,
* which is out of reach within a room's lifetime for a 10-minute room. Longer-lived rooms need a stronger invite.
*/
var PHRASE_WORDS = 4;
var PHRASE_KDF_ITERATIONS = 2e5;
var LABELS$1 = {
	salt: "poof/v1/handshake",
	id: "poof/v1/handshake/id",
	key: "poof/v1/handshake/key"
};
var NONCE_BYTES = 12;
var WORDS = new Set(wordlist);
/** Four random words. 2048 = 2^11, so taking 11 bits per word is unbiased. */
function generatePhrase() {
	const random = randomBytes(8);
	const words = [];
	for (let i = 0; i < 4; i++) {
		const index = (random[i * 2] << 8 | random[i * 2 + 1]) & 2047;
		words.push(wordlist[index]);
	}
	return words.join("-");
}
/**
* Canonical form of what someone typed: lowercase words joined by "-". Accepts spaces, dashes,
* dots, commas or underscores between words ("Amber otter quiet lantern" works). Null if it isn't
* exactly four words from the list.
*/
function normalizePhrase(input) {
	const words = input.normalize("NFKC").trim().toLowerCase().split(/[\s\-_.,]+/).filter(Boolean);
	if (words.length !== 4 || !words.every((w) => WORDS.has(w))) return null;
	return words.join("-");
}
async function derivePhraseKeys(phrase) {
	const subtle = crypto.subtle;
	const base = await subtle.importKey("raw", utf8(phrase), "PBKDF2", false, ["deriveBits"]);
	const seed = new Uint8Array(await subtle.deriveBits({
		name: "PBKDF2",
		hash: "SHA-256",
		salt: utf8(LABELS$1.salt),
		iterations: PHRASE_KDF_ITERATIONS
	}, base, 256));
	const empty = /* @__PURE__ */ new Uint8Array(0);
	const [id, rawKey] = await Promise.all([hkdf(seed, empty, utf8(LABELS$1.id)), hkdf(seed, empty, utf8(LABELS$1.key))]);
	const key = await subtle.importKey("raw", rawKey, {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
	return {
		id: toBase64Url(id),
		key
	};
}
async function sealInvite(key, url) {
	const nonce = randomBytes(NONCE_BYTES);
	return toBase64(concat(nonce, new Uint8Array(await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv: nonce
	}, key, utf8(url)))));
}
/** Throws PoofError("decrypt_failed") if the blob wasn't sealed with this key or was altered. */
async function openInvite(key, blob) {
	let data;
	try {
		data = fromBase64(blob);
	} catch {
		throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	}
	if (data.length <= NONCE_BYTES) throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	try {
		const plain = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv: data.subarray(0, NONCE_BYTES)
		}, key, data.subarray(NONCE_BYTES));
		return fromUtf8(new Uint8Array(plain));
	} catch {
		throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	}
}
/**
* Put the room's invite URL behind a fresh phrase. Returns the phrase and the mailbox expiry in the
* SERVER's clock (the session converts it). Retries with a new phrase if the id is taken.
*/
async function createPhraseInvite(opts) {
	for (let attempt = 0; attempt < 3; attempt++) {
		const code = generatePhrase();
		const { id, key } = await derivePhraseKeys(code);
		const blob = await sealInvite(key, opts.inviteUrl);
		let res;
		try {
			res = await opts.fetch(`${opts.origin}/api/handshakes/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ blob })
			});
		} catch {
			throw new PoofError("connection_failed", "Could not reach the server.");
		}
		if (res.status === 409) continue;
		if (res.status === 429) throw new PoofError("rate_limited", "Too many codes. Try again soon.");
		if (!res.ok) throw new PoofError("connection_failed", `Server error ${res.status}.`);
		const parsed = putHandshakeResponseSchema.safeParse(await res.json().catch(() => null));
		if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
		return {
			code,
			serverExpiresAt: parsed.data.expiresAt
		};
	}
	throw new PoofError("connection_failed", "Could not create a code. Try again.");
}
/**
* "Join a quant-room": turn a phrase into the room path to navigate to (`/join/#<id>.<key>`).
* The mailbox is one-time: a code works once. The decrypted URL must point at the web app's origin
* and be a well-formed room link, so a malicious blob can't redirect the person elsewhere.
*/
async function joinByPhrase(opts) {
	const phrase = normalizePhrase(opts.code);
	if (!phrase) throw new PoofError("invalid_code", "Enter the four words you were given.");
	const { id, key } = await derivePhraseKeys(phrase);
	let res;
	try {
		res = await opts.fetch(`${opts.origin}/api/handshakes/${id}/take`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{}"
		});
	} catch {
		throw new PoofError("connection_failed", "Could not reach the server.");
	}
	if (res.status === 404) throw new PoofError("not_found_or_expired", "That code was already used or has expired.");
	if (res.status === 429) throw new PoofError("rate_limited", "Too many attempts. Try again soon.");
	if (!res.ok) throw new PoofError("connection_failed", `Server error ${res.status}.`);
	const parsed = takeHandshakeResponseSchema.safeParse(await res.json().catch(() => null));
	if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
	const url = await openInvite(key, parsed.data.blob);
	let target;
	try {
		target = new URL(url);
	} catch {
		throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	}
	if (target.origin !== new URL(opts.appOrigin ?? opts.origin).origin || target.search !== "") throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	let room;
	try {
		room = parseRoomLocation(target.pathname, target.hash);
	} catch {
		throw new PoofError("decrypt_failed", "That code doesn't open a room.");
	}
	return roomPath(room.roomId, room.key);
}
//#endregion
//#region packages/core/src/session.ts
var DEFAULT_PQ_TIMEOUT_MS = 1e4;
var DEFAULT_LINK_LOSS_GRACE_MS = 1500;
var DEFAULT_JOIN_TIMEOUT_MS = 15e3;
var DEFAULT_MEMBERS_GRACE_MS = 1e4;
/** After the deadline passes, wait this long for the server's room.expired before asking it. */
var EXPIRY_GRACE_MS = 3e3;
/** A typing hint shows for at most this long without a refresh (covers a lost "off"). */
var TYPING_TTL_MS = 6e3;
/** While someone keeps typing, "on" is sent again at most this often (keeps their indicator alive). */
var TYPING_RESEND_MS = 2500;
var EXPIRY_RETRY_MS = 1e4;
/** Someone else's "the AI is thinking" hint shows for at most this long without the answer. */
var AI_PENDING_TTL_MS = 12e4;
var TERMINAL = /* @__PURE__ */ new Set([
	"terminated",
	"expired",
	"error"
]);
/** Statuses derived from the links (everything between "welcomed" and an ending). */
var LIVE = /* @__PURE__ */ new Set([
	"waiting",
	"connecting",
	"connected",
	"sealed"
]);
var browserObjectUrls = {
	create: (blob) => URL.createObjectURL(blob),
	revoke: (url) => URL.revokeObjectURL(url)
};
var EMPTY_LIMITS = {
	fileTransfer: false,
	fileMaxBytes: 0
};
/** "Peer 3FA2": the first two bytes of the peerId in hex. Stable, short, not secret. */
function memberLabel(peerId) {
	let hex;
	try {
		hex = Array.from(fromBase64Url(peerId).subarray(0, 2), (b) => b.toString(16).padStart(2, "0")).join("");
	} catch {
		hex = peerId.slice(0, 4);
	}
	return `Peer ${hex.toUpperCase()}`;
}
/**
* The headless room engine. One instance per room page. It owns the signaling socket and one
* `MemberLink` per other person (WebRTC + hybrid key exchange + encrypted frames), and exposes a
* single immutable `SessionState` plus a handful of commands. No DOM, no React.
*
* Two sets of rules:
* - **2-person rooms** (`maxPeers === 2`, free): one link; when the other person leaves or the link
*   breaks, the session ends and the conversation is wiped.
* - **Group rooms** (`maxPeers > 2`, super): one link per member (mesh, pairwise keys); people come
*   and go, the room goes on until it expires or the creator destroys it.
*/
var RoomSession = class {
	deps;
	state;
	listeners = /* @__PURE__ */ new Set();
	peerId;
	now;
	signaling = null;
	links = /* @__PURE__ */ new Map();
	lossTimers = /* @__PURE__ */ new Map();
	typingTimers = /* @__PURE__ */ new Map();
	typingOn = false;
	typingSentAt = 0;
	joinTimer = null;
	expiryTimer = null;
	phraseTimer = null;
	mismatchTimer = null;
	clockOffsetMs = 0;
	started = false;
	/** Files I'm sending → the links they go to (for cancel). */
	outgoingFiles = /* @__PURE__ */ new Map();
	/** blob: URLs of received files, revoked when the conversation is wiped. */
	objectUrls = /* @__PURE__ */ new Set();
	/** The AI model (rooms that include it). */
	ai;
	/** The creator's registration of the room's AI token, once it has succeeded or is running. */
	aiRegistration = null;
	/** My AI questions still streaming, so leaving the room can stop them. */
	aiStreams = /* @__PURE__ */ new Set();
	/** Other people's "the AI is thinking" hints → their expiry timers. */
	aiPendingTimers = /* @__PURE__ */ new Map();
	constructor(deps) {
		this.deps = deps;
		this.now = deps.now ?? Date.now;
		this.peerId = deps.peerId ?? toBase64Url(randomBytes(16));
		this.ai = new AiClient({
			fetch: deps.fetch,
			origin: deps.origin,
			roomId: deps.roomId,
			roomKey: deps.roomKey
		});
		this.state = {
			status: "loading",
			error: null,
			endReason: null,
			roomId: deps.roomId,
			inviteUrl: inviteUrl(deps.appOrigin ?? deps.origin, deps.roomId, deps.roomKey),
			isOwner: deps.ownerSecret !== void 0,
			role: null,
			peerPresent: false,
			connectionType: null,
			maxPeers: 2,
			members: [],
			membersMismatch: false,
			nickname: null,
			plan: "free",
			tier: "free",
			expiresAt: null,
			limits: EMPTY_LIMITS,
			ai: false,
			aiPending: [],
			messages: [],
			log: [],
			phrase: null,
			typing: []
		};
	}
	/** Group rules apply when the room can hold more than two people. */
	get isGroup() {
		return this.state.maxPeers > 2;
	}
	getState() {
		return this.state;
	}
	/** For React's useSyncExternalStore. Returns the unsubscribe function. */
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	/** Load the room and join it. Safe to call once; later calls are ignored. */
	async start() {
		if (this.started || this.state.status !== "loading") return;
		this.started = true;
		this.log("key.loaded", "ok");
		let info;
		try {
			info = await this.fetchRoom();
		} catch (error) {
			if (error instanceof PoofError) this.fail(error.code, error.message);
			else this.fail("connection_failed", "Could not load the room.");
			return;
		}
		if (TERMINAL.has(this.state.status)) return;
		this.applyRoomMeta(info);
		this.connectSignaling();
		this.scheduleExpiryCheck();
	}
	/**
	* Encrypt and send a chat message to everyone connected (one encryption per member). Resolves
	* with the message id once at least one member got it.
	*
	* In a room with the AI model, a message that starts with "@ai" (or any message, in a room for
	* one) also asks the AI. That works with nobody else connected; the answer streams into an `ai`
	* item and then goes to everyone connected.
	*/
	async sendMessage(text) {
		const clean = normalizeChatText(text);
		const asksAi = this.state.ai && clean !== "" && (this.state.maxPeers === 1 || mentionsAi(clean));
		const targets = this.connectedLinks();
		if (asksAi ? !LIVE.has(this.state.status) : this.state.status !== "sealed" || targets.length === 0) throw new PoofError("not_connected", "Not connected to the other person.");
		if (!clean) throw new PoofError("invalid_message", "Message is empty.");
		if (asksAi && this.state.maxPeers > 1 && !stripMention(clean)) throw new PoofError("invalid_message", "Ask the AI something after @ai.");
		const id = crypto.randomUUID();
		const ts = this.now();
		if (targets.length > 0) {
			const plaintext = utf8(JSON.stringify({
				id,
				text: clean,
				ts
			}));
			const delivered = (await Promise.allSettled(targets.map((link) => link.send(FrameType.Chat, plaintext)))).some((r) => r.status === "fulfilled");
			if (asksAi ? TERMINAL.has(this.state.status) : this.state.status !== "sealed" || !delivered) throw new PoofError("not_connected", "Connection closed.");
		}
		this.addMessage({
			kind: "text",
			id,
			mine: true,
			from: null,
			text: clean,
			ts,
			status: "sent"
		});
		this.typingOn = false;
		if (asksAi) this.askAi(id);
		return id;
	}
	/**
	* Send a file to everyone connected, each over their own encrypted link (super rooms only).
	* Resolves with the fileId (= the chat item id) once the transfer has started; progress, the
	* hash check and failures then show on that item. Rejects with PoofError: `not_connected`,
	* `not_available` (files are off in this room) or `file_too_large`.
	*/
	async sendFile(file) {
		this.assertCanSendFile(file.size);
		const bytes = new Uint8Array(await file.arrayBuffer());
		this.assertCanSendFile(bytes.length);
		const sha256 = await hashFile(bytes);
		this.assertCanSendFile(bytes.length);
		const recipients = this.connectedLinks();
		const out = {
			fileId: toBase64Url(randomBytes(16)),
			name: sanitizeFileName(file.name),
			mime: sanitizeMime(file.type),
			bytes,
			sha256
		};
		this.addMessage({
			kind: "file",
			id: out.fileId,
			mine: true,
			from: null,
			name: out.name,
			size: bytes.length,
			mime: out.mime,
			ts: this.now(),
			status: "sending",
			progress: 0,
			recipients: recipients.length,
			delivered: 0
		});
		this.fanOut(out, recipients);
		return out.fileId;
	}
	/** Cancel a file I'm sending (to everyone still receiving it) or one I'm receiving. */
	abortTransfer(fileId) {
		const item = this.fileItem(fileId);
		if (!item) return;
		if (item.mine) for (const link of this.outgoingFiles.get(fileId) ?? []) link.files.cancel(fileId);
		else if (item.status === "receiving" && item.from) this.links.get(item.from)?.files.cancel(fileId);
	}
	/**
	* Set (or clear, with null/empty) your display name. It's normalised, shown to others as
	* "Ana · Peer 3FA2", and sent only over the encrypted links. Returns the normalised value.
	*/
	/**
	* Tell the others you're typing (true) or stopped (false). Call it as often as you like (e.g. on
	* every keystroke): "on" goes out at most every few seconds, "off" only after an "on".
	*/
	setTyping(on) {
		if (this.state.status !== "sealed") return;
		const now = this.now();
		if (on) {
			if (this.typingOn && now - this.typingSentAt < TYPING_RESEND_MS) return;
			this.typingOn = true;
			this.typingSentAt = now;
		} else {
			if (!this.typingOn) return;
			this.typingOn = false;
		}
		for (const link of this.connectedLinks()) link.sendCtl({
			kind: "typing",
			on
		});
	}
	setNickname(name) {
		const nickname = normalizeNickname(name);
		if (TERMINAL.has(this.state.status) || nickname === this.state.nickname) return this.state.nickname;
		this.setState({ nickname });
		for (const link of this.connectedLinks()) link.sendCtl({
			kind: "hello",
			nickname
		});
		return nickname;
	}
	/**
	* "Share via code": put this room's invite link behind a fresh 4-word phrase (one-time, 3 min).
	* Sets `state.phrase` until it expires; a new call replaces it. Works while the room is alive.
	*/
	async createPhrase() {
		if (TERMINAL.has(this.state.status) || this.state.expiresAt === null) throw new PoofError("not_connected", "The room isn't ready.");
		const { code, serverExpiresAt } = await createPhraseInvite({
			fetch: this.deps.fetch,
			origin: this.deps.origin,
			inviteUrl: this.state.inviteUrl
		});
		if (TERMINAL.has(this.state.status)) throw new PoofError("not_connected", "The room has ended.");
		const expiresAt = Math.min(serverExpiresAt - this.clockOffsetMs, this.state.expiresAt ?? Infinity);
		const phrase = {
			code,
			expiresAt
		};
		this.setState({ phrase });
		if (this.phraseTimer) clearTimeout(this.phraseTimer);
		this.phraseTimer = setTimeout(() => {
			this.phraseTimer = null;
			if (this.state.phrase === phrase) this.setState({ phrase: null });
		}, Math.max(0, expiresAt - this.now()));
		return phrase;
	}
	/** End the room for everyone. Only the creator can; others get PoofError("not_owner"). */
	destroy() {
		const { ownerSecret } = this.deps;
		if (ownerSecret === void 0) return Promise.reject(new PoofError("not_owner", "Only the person who created the room can destroy it."));
		if (!TERMINAL.has(this.state.status)) {
			this.signaling?.send({
				v: 1,
				t: "destroy",
				ownerSecret
			});
			this.terminate("destroyed_by_me");
		}
		return Promise.resolve();
	}
	/**
	* Creator only: turn this room into the pass's Super Quant-Room (more time, more people, files).
	* Everyone in the room is told by the server (`room.upgraded`); this resolves once it's done.
	*/
	async upgrade(pass) {
		const { ownerSecret } = this.deps;
		if (ownerSecret === void 0) throw new PoofError("not_owner", "Only the person who created the room can upgrade it.");
		if (TERMINAL.has(this.state.status)) throw new PoofError("room_not_found", "The room has ended.");
		let res;
		try {
			res = await this.deps.fetch(`${this.deps.origin}/api/rooms/${this.deps.roomId}/upgrade`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ownerSecret,
					pass,
					aiHash: (await this.ai.aiToken()).hash
				})
			});
		} catch {
			throw new PoofError("connection_failed", "Could not reach the server.");
		}
		if (!res.ok) throw serverError(res.status, await res.json().catch(() => null));
		const info = roomInfoSchema.safeParse(await res.json().catch(() => null));
		if (info.success && !TERMINAL.has(this.state.status)) {
			this.applyRoomMeta(info.data);
			this.scheduleExpiryCheck();
		}
	}
	/** Leave this room (the others are told). Call on unmount. */
	async leave() {
		if (TERMINAL.has(this.state.status)) {
			this.releaseFiles();
			return;
		}
		await Promise.all(this.connectedLinks().map((link) => link.sendCtl({ kind: "bye" })));
		this.signaling?.send({
			v: 1,
			t: "leave"
		});
		this.terminate("left_by_me");
	}
	async fetchRoom() {
		let res;
		try {
			res = await this.deps.fetch(`${this.deps.origin}/api/rooms/${this.deps.roomId}`);
		} catch {
			throw new PoofError("connection_failed", "Could not reach the server.");
		}
		if (res.status === 404) throw new PoofError("room_not_found", "This room doesn't exist or has expired.");
		if (res.status === 429) throw new PoofError("rate_limited", "Too many requests. Try again soon.");
		if (!res.ok) throw new PoofError("connection_failed", `Server error ${res.status}.`);
		const parsed = roomInfoSchema.safeParse(await res.json().catch(() => null));
		if (!parsed.success) throw new PoofError("connection_failed", "Unexpected server response.");
		return parsed.data;
	}
	/** Adopt the server's view of the room. `expiresAt` is converted to the local clock. */
	applyRoomMeta(meta) {
		this.clockOffsetMs = meta.serverNow - this.now();
		this.setState({
			plan: meta.plan,
			tier: meta.tier,
			limits: meta.limits,
			expiresAt: meta.expiresAt - this.clockOffsetMs,
			...meta.maxPeers !== void 0 ? { maxPeers: meta.maxPeers } : {},
			...meta.ai !== void 0 ? { ai: meta.ai } : {}
		});
		if (meta.ai) this.registerAi();
	}
	/**
	* The creator registers the room's AI token hash (derived from the key, which the server never
	* gets) so that everyone with the link can use the AI. Idempotent on the server; retried on the
	* next room update if it failed.
	*/
	registerAi() {
		const { ownerSecret } = this.deps;
		if (ownerSecret === void 0 || this.aiRegistration) return;
		const attempt = this.ai.register(ownerSecret);
		this.aiRegistration = attempt;
		attempt.catch(() => {
			if (this.aiRegistration === attempt) this.aiRegistration = null;
		});
	}
	connectSignaling() {
		const url = new URL(this.deps.origin);
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		url.pathname = `/ws/rooms/${this.deps.roomId}`;
		url.search = `?peerId=${this.peerId}`;
		this.signaling = new SignalingClient({
			url: url.toString(),
			createSocket: this.deps.createSocket,
			onMessage: (msg) => this.onServerMessage(msg),
			onStatus: (status) => {
				if (status === "reconnecting") this.log("signaling.reconnecting", "warn");
			},
			onTerminalClose: (code) => this.onTerminalClose(code),
			...this.deps.signaling
		});
		this.joinTimer = setTimeout(() => {
			this.joinTimer = null;
			if (this.state.status === "loading") this.fail("connection_failed", "Could not join the room. Check your connection.");
		}, this.deps.joinTimeoutMs ?? DEFAULT_JOIN_TIMEOUT_MS);
		this.signaling.connect();
	}
	onServerMessage(msg) {
		if (TERMINAL.has(this.state.status)) return;
		switch (msg.t) {
			case "welcome":
				this.applyRoomMeta(msg);
				this.clearJoinTimer();
				if (this.state.status === "loading") {
					this.setState({
						status: "waiting",
						peerPresent: msg.peers >= 2
					});
					this.log("signaling.connected", "ok");
					this.log("room.waiting", "ok");
				}
				return;
			case "paired":
				this.onPaired(msg.peerId, msg.role, msg.iceServers);
				return;
			case "signal":
				this.links.get(msg.from)?.handleSignal(msg.payload);
				return;
			case "peer.left":
				this.onPeerLeft(msg.peerId);
				return;
			case "replaced":
				this.terminate("replaced");
				return;
			case "room.expired":
				this.expire();
				return;
			case "room.destroyed":
				this.log("room.destroyed", "warn");
				this.terminate(msg.by === this.peerId ? "destroyed_by_me" : "destroyed_by_peer");
				return;
			case "room.upgraded":
				this.applyRoomMeta(msg);
				this.scheduleExpiryCheck();
				for (const link of this.links.values()) link.refreshIceServers(msg.iceServers);
				return;
			case "rejected":
				this.onTerminalClose(msg.code);
				return;
			case "error": return;
		}
	}
	onTerminalClose(code) {
		if (TERMINAL.has(this.state.status)) return;
		switch (code) {
			case CloseCode.RoomExpired:
				this.expire();
				return;
			case CloseCode.RoomDestroyed:
				this.terminate("destroyed_by_peer");
				return;
			case CloseCode.RoomFull:
				this.fail("room_full", "This room is full.");
				return;
			case CloseCode.RoomNotFound:
				this.fail("room_not_found", "This room doesn't exist or has expired.");
				return;
			case CloseCode.Replaced:
				this.terminate("replaced");
				return;
			default: this.fail("connection_failed", "Lost connection to the server.");
		}
	}
	onPaired(peerId, role, iceServers) {
		if (peerId === this.peerId) return;
		if (this.isGroup && !this.links.has(peerId) && this.links.size >= this.state.maxPeers - 1) return;
		const existing = this.isGroup ? this.links.get(peerId) : [...this.links.values()][0];
		if (existing && (existing.state === "upgrading" || existing.state === "connected")) return;
		if (this.isGroup) this.dropLink(peerId);
		else for (const id of [...this.links.keys()]) this.dropLink(id);
		this.log("peer.joined", "info", this.withPeer(peerId, { role }));
		this.log("ice.gathering", "info", this.withPeer(peerId));
		const link = new MemberLink({
			roomId: this.deps.roomId,
			roomKey: this.deps.roomKey,
			selfId: this.peerId,
			peerId,
			role,
			iceServers,
			createPeerConnection: this.deps.createPeerConnection,
			pqTimeoutMs: this.deps.pqTimeoutMs ?? DEFAULT_PQ_TIMEOUT_MS,
			...this.deps.fileAckTimeoutMs !== void 0 ? { fileAckTimeoutMs: this.deps.fileAckTimeoutMs } : {}
		}, {
			signal: (payload) => {
				this.signaling?.send({
					v: 1,
					t: "signal",
					to: peerId,
					payload
				});
			},
			log: (code, level, data) => {
				if (this.links.get(peerId) === link) this.log(code, level, this.withPeer(peerId, data));
			},
			changed: () => {
				if (this.links.get(peerId) === link) this.refresh();
			},
			connected: () => this.onLinkConnected(link),
			chat: (message) => this.onChat(link, message),
			ai: (message) => this.onAi(link, message),
			ctl: (message) => this.onCtl(link, message),
			failed: (failure) => this.onLinkFailed(link, failure),
			files: {
				limits: () => this.state.limits,
				incomingStart: (info) => this.onIncomingFile(link, info),
				incomingProgress: (fileId, received) => {
					const item = this.fileItem(fileId);
					if (item?.status === "receiving") this.updateFile(fileId, { progress: received / Math.max(1, item.size) });
				},
				incomingDone: (fileId, bytes) => this.onIncomingDone(fileId, bytes),
				incomingFailed: (fileId, reason) => {
					if (this.fileItem(fileId)?.status === "receiving") this.updateFile(fileId, {
						status: "failed",
						error: reason
					});
				}
			}
		});
		this.links.set(peerId, link);
		this.refresh({
			peerPresent: true,
			...this.isGroup ? {} : { role }
		});
		link.start();
	}
	onLinkConnected(link) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return;
		if (this.state.nickname !== null) link.sendCtl({
			kind: "hello",
			nickname: this.state.nickname
		});
		if (!this.isGroup) return;
		this.addMessage({
			kind: "system",
			id: crypto.randomUUID(),
			ts: this.now(),
			event: "joined",
			peerId: link.peerId
		});
		this.announceMembers();
	}
	onPeerLeft(peerId) {
		if (!this.isGroup) {
			this.log("peer.left", "warn");
			const { status } = this.state;
			if (status === "connecting") {
				for (const id of [...this.links.keys()]) this.dropLink(id);
				this.setState({
					status: "waiting",
					role: null,
					peerPresent: false,
					members: [],
					connectionType: null
				});
				return;
			}
			if (status === "connected" || status === "sealed") this.terminate("peer_left");
			else this.setState({ peerPresent: false });
			return;
		}
		const link = this.links.get(peerId);
		if (!link) return;
		this.log("peer.left", "warn", this.withPeer(peerId));
		if (link.everConnected) this.addMessage({
			kind: "system",
			id: crypto.randomUUID(),
			ts: this.now(),
			event: "left",
			peerId
		});
		this.dropLink(peerId);
		this.refresh({ peerPresent: this.links.size > 0 });
		this.announceMembers();
	}
	onLinkFailed(link, failure) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return;
		const peer = link.peerId;
		if (!this.isGroup) switch (failure.kind) {
			case "link":
				this.log("conn.failed", "error");
				if (this.state.status === "sealed") this.afterGrace(peer, () => this.terminate("connection_lost"));
				else this.fail("connection_failed", "Could not establish a connection. A firewall may be blocking it.");
				return;
			case "pq":
				this.fail("pq_failed", failure.timeout ? "The secure handshake timed out." : "The secure handshake failed.");
				return;
			case "frame":
				this.log("conn.failed", "error", { reason: failure.code });
				this.terminate("connection_lost");
				return;
			case "other":
				this.fail("connection_failed", "Something went wrong with the connection.");
				return;
		}
		this.log("conn.failed", "error", this.withPeer(peer, failure.kind === "frame" ? { reason: failure.code } : {}));
		const markFailed = () => {
			if (this.links.get(peer) !== link) return;
			link.close("failed");
			this.refresh();
			this.announceMembers();
		};
		if (failure.kind === "link" && link.state === "connected") this.afterGrace(peer, markFailed);
		else markFailed();
	}
	/** Run `fn` after the link-loss grace period unless the member is dropped first. */
	afterGrace(peerId, fn) {
		if (this.lossTimers.has(peerId)) return;
		this.lossTimers.set(peerId, setTimeout(() => {
			this.lossTimers.delete(peerId);
			if (!TERMINAL.has(this.state.status)) fn();
		}, this.deps.linkLossGraceMs ?? DEFAULT_LINK_LOSS_GRACE_MS));
	}
	dropLink(peerId) {
		this.markTyping(peerId, false);
		for (const p of this.state.aiPending) if (p.askedBy === peerId) this.markAiPending(peerId, p.askId, false);
		this.links.get(peerId)?.close();
		this.links.delete(peerId);
		const timer = this.lossTimers.get(peerId);
		if (timer) clearTimeout(timer);
		this.lossTimers.delete(peerId);
	}
	connectedLinks() {
		return [...this.links.values()].filter((link) => link.state === "connected");
	}
	onChat(link, chat) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return;
		const text = normalizeChatText(chat.text);
		if (!text) return;
		this.markTyping(link.peerId, false);
		this.addMessage({
			kind: "text",
			id: chat.id,
			mine: false,
			from: link.peerId,
			text,
			ts: this.now(),
			status: "received"
		});
	}
	onCtl(link, ctl) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return;
		switch (ctl.kind) {
			case "bye":
				if (this.isGroup) this.onPeerLeft(link.peerId);
				else this.terminate("peer_left");
				return;
			case "hello":
				link.nickname = normalizeNickname(ctl.nickname);
				this.refresh();
				return;
			case "members":
				link.reportedMembers = ctl.peerIds;
				this.checkMembers();
				return;
			case "typing":
				this.markTyping(link.peerId, ctl.on);
				return;
			case "ai":
				this.markAiPending(link.peerId, ctl.askId, ctl.state === "thinking");
				return;
			case "connection_type": return;
		}
	}
	/** Someone started or stopped typing. "on" expires by itself, so a lost "off" can't stick. */
	markTyping(peerId, on) {
		const timer = this.typingTimers.get(peerId);
		if (timer) clearTimeout(timer);
		this.typingTimers.delete(peerId);
		if (TERMINAL.has(this.state.status)) return;
		const has = this.state.typing.includes(peerId);
		if (on) {
			this.typingTimers.set(peerId, setTimeout(() => this.markTyping(peerId, false), TYPING_TTL_MS));
			if (!has) this.setState({ typing: [...this.state.typing, peerId] });
		} else if (has) this.setState({ typing: this.state.typing.filter((id) => id !== peerId) });
	}
	/**
	* Ask the AI about my message `askId`: tell the others it's thinking, stream the answer into an
	* `ai` item, then send the finished answer to everyone connected.
	*/
	async askAi(askId) {
		const item = {
			kind: "ai",
			id: crypto.randomUUID(),
			askId,
			askedBy: null,
			text: "",
			ts: this.now(),
			status: "streaming"
		};
		const prompt = this.aiPrompt(askId);
		this.addMessage(item);
		this.setState({ aiPending: [...this.state.aiPending, {
			askId,
			askedBy: null
		}] });
		for (const link of this.connectedLinks()) link.sendCtl({
			kind: "ai",
			askId,
			state: "thinking"
		});
		const abort = new AbortController();
		this.aiStreams.add(abort);
		let text = "";
		try {
			if (this.state.isOwner) await this.aiRegistration?.catch(() => void 0);
			for await (const piece of this.ai.ask(prompt, abort.signal)) {
				if (TERMINAL.has(this.state.status)) return;
				text += piece;
				this.updateAi(item.id, { text: normalizeAiText(text) });
			}
			const answer = normalizeAiText(text);
			if (!answer) throw new PoofError("ai_failed", "The AI gave no answer.");
			if (TERMINAL.has(this.state.status)) return;
			this.updateAi(item.id, {
				text: answer,
				status: "done"
			});
			const frame = {
				id: item.id,
				askId,
				askedBy: this.peerId,
				text: answer,
				ts: item.ts
			};
			const plaintext = utf8(JSON.stringify(frame));
			for (const link of this.connectedLinks()) link.send(FrameType.Ai, plaintext).catch(() => void 0);
		} catch (error) {
			if (TERMINAL.has(this.state.status)) return;
			const code = error instanceof PoofError ? error.code : "ai_failed";
			this.updateAi(item.id, {
				text: normalizeAiText(text),
				status: "failed",
				error: code
			});
			for (const link of this.connectedLinks()) link.sendCtl({
				kind: "ai",
				askId,
				state: "failed"
			});
		} finally {
			this.aiStreams.delete(abort);
			if (!TERMINAL.has(this.state.status)) this.setState({ aiPending: this.state.aiPending.filter((p) => p.askId !== askId) });
		}
	}
	/** The question `askId` with the conversation before it, as the AI sees it. */
	aiPrompt(askId) {
		const history = [];
		let question = null;
		for (const m of this.state.messages) if (m.kind === "text") {
			const turn = {
				speaker: this.speaker(m.from),
				text: stripMention(m.text) || m.text
			};
			if (m.id === askId) question = turn;
			else if (!question) history.push(turn);
		} else if (m.kind === "ai" && m.status === "done" && !question) history.push({
			speaker: "AI",
			text: m.text
		});
		return buildAiPrompt(history, question ?? {
			speaker: this.speaker(null),
			text: ""
		});
	}
	/** How the AI sees a person: their nickname, else their short label. Null = me. */
	speaker(peerId) {
		if (peerId === null) return this.state.nickname ?? memberLabel(this.peerId);
		return this.links.get(peerId)?.nickname ?? memberLabel(peerId);
	}
	onAi(link, msg) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return;
		if (msg.askedBy !== link.peerId) return;
		if (this.state.messages.some((m) => m.id === msg.id)) return;
		const text = normalizeAiText(msg.text);
		if (!text) return;
		this.markAiPending(link.peerId, msg.askId, false);
		this.addMessage({
			kind: "ai",
			id: msg.id,
			askId: msg.askId,
			askedBy: link.peerId,
			text,
			ts: this.now(),
			status: "done"
		});
	}
	/** Someone else's question is (or is no longer) being answered. "on" expires by itself. */
	markAiPending(peerId, askId, on) {
		const key = `${peerId}/${askId}`;
		const timer = this.aiPendingTimers.get(key);
		if (timer) clearTimeout(timer);
		this.aiPendingTimers.delete(key);
		if (TERMINAL.has(this.state.status)) return;
		const has = this.state.aiPending.some((p) => p.askedBy === peerId && p.askId === askId);
		if (on) {
			this.aiPendingTimers.set(key, setTimeout(() => this.markAiPending(peerId, askId, false), AI_PENDING_TTL_MS));
			if (!has) this.setState({ aiPending: [...this.state.aiPending, {
				askId,
				askedBy: peerId
			}] });
		} else if (has) this.setState({ aiPending: this.state.aiPending.filter((p) => !(p.askedBy === peerId && p.askId === askId)) });
	}
	updateAi(id, patch) {
		this.setState({ messages: this.state.messages.map((m) => m.id === id && m.kind === "ai" ? {
			...m,
			...patch
		} : m) });
	}
	/** Tell everyone connected which members we have a confirmed link with. */
	announceMembers() {
		if (!this.isGroup || TERMINAL.has(this.state.status)) return;
		const peerIds = this.connectedLinks().map((link) => link.peerId);
		for (const link of this.connectedLinks()) link.sendCtl({
			kind: "members",
			peerIds
		});
		this.checkMembers();
	}
	membersDisagree() {
		const mine = new Set(this.connectedLinks().map((link) => link.peerId));
		for (const link of this.connectedLinks()) {
			if (!link.reportedMembers) continue;
			const expected = /* @__PURE__ */ new Set([...mine, this.peerId]);
			expected.delete(link.peerId);
			const theirs = new Set(link.reportedMembers);
			if (theirs.size !== expected.size || [...theirs].some((id) => !expected.has(id))) return true;
		}
		return false;
	}
	/** People joining or leaving disagree briefly; only a lasting difference is worth a warning. */
	checkMembers() {
		if (!this.isGroup || TERMINAL.has(this.state.status)) return;
		if (!this.membersDisagree()) {
			if (this.mismatchTimer) clearTimeout(this.mismatchTimer);
			this.mismatchTimer = null;
			if (this.state.membersMismatch) this.setState({ membersMismatch: false });
			return;
		}
		if (this.mismatchTimer || this.state.membersMismatch) return;
		this.mismatchTimer = setTimeout(() => {
			this.mismatchTimer = null;
			if (!TERMINAL.has(this.state.status) && this.membersDisagree()) this.setState({ membersMismatch: true });
		}, this.deps.membersGraceMs ?? DEFAULT_MEMBERS_GRACE_MS);
	}
	/**
	* Safety net for the server's room.expired event (a dead socket can't deliver it): shortly after
	* the deadline, ask the server. Only a server answer ends the session, never the local clock.
	*/
	scheduleExpiryCheck() {
		if (this.expiryTimer) clearTimeout(this.expiryTimer);
		const { expiresAt } = this.state;
		if (expiresAt === null || TERMINAL.has(this.state.status)) return;
		const delay = Math.max(1e3, expiresAt - this.now() + EXPIRY_GRACE_MS);
		this.expiryTimer = setTimeout(() => void this.checkExpiry(), delay);
	}
	async checkExpiry() {
		this.expiryTimer = null;
		if (TERMINAL.has(this.state.status)) return;
		try {
			const info = await this.fetchRoom();
			if (TERMINAL.has(this.state.status)) return;
			this.applyRoomMeta(info);
			this.scheduleExpiryCheck();
		} catch (error) {
			if (error instanceof PoofError && error.code === "room_not_found") this.expire();
			else this.expiryTimer = setTimeout(() => void this.checkExpiry(), EXPIRY_RETRY_MS);
		}
	}
	assertCanSendFile(size) {
		if (this.state.status !== "sealed" || this.connectedLinks().length === 0) throw new PoofError("not_connected", "Not connected to anyone.");
		const { limits } = this.state;
		if (!limits.fileTransfer) throw new PoofError("not_available", "Files can be sent in super rooms only.");
		if (size > limits.fileMaxBytes) throw new PoofError("file_too_large", "The file is too large.");
	}
	/** Send one file to each recipient (in parallel, each with its own backpressure) and track it on the item. */
	async fanOut(out, links) {
		const size = out.bytes.length;
		const lanes = links.map(() => ({
			sent: 0,
			allSent: false,
			result: null
		}));
		const update = () => {
			const failures = lanes.flatMap((l) => l.result && !l.result.ok ? [l.result.reason] : []);
			const delivered = lanes.filter((l) => l.result?.ok).length;
			const finished = lanes.every((l) => l.result);
			const sentBytes = lanes.reduce((sum, l) => sum + (l.result || l.allSent ? size : l.sent), 0);
			const status = finished ? delivered > 0 ? "delivered" : "failed" : lanes.every((l) => l.result || l.allSent) ? "sent" : "sending";
			const total = size * lanes.length;
			this.updateFile(out.fileId, {
				status,
				delivered,
				progress: total > 0 ? sentBytes / total : status === "sending" ? 0 : 1,
				...status === "failed" ? { error: failures[0] ?? "connection_lost" } : {}
			});
		};
		this.outgoingFiles.set(out.fileId, links);
		await Promise.all(links.map(async (link, i) => {
			const lane = lanes[i];
			lane.result = await link.files.send(out, (sent, allSent) => {
				lane.sent = sent;
				lane.allSent = allSent;
				update();
			});
			update();
		}));
		this.outgoingFiles.delete(out.fileId);
	}
	onIncomingFile(link, info) {
		if (TERMINAL.has(this.state.status) || this.links.get(link.peerId) !== link) return false;
		if (this.state.messages.some((m) => m.id === info.fileId)) return false;
		this.addMessage({
			kind: "file",
			id: info.fileId,
			mine: false,
			from: link.peerId,
			name: info.name,
			size: info.size,
			mime: info.mime,
			ts: this.now(),
			status: "receiving",
			progress: 0,
			recipients: 0,
			delivered: 0
		});
		return true;
	}
	onIncomingDone(fileId, bytes) {
		const item = this.fileItem(fileId);
		if (TERMINAL.has(this.state.status) || item?.status !== "receiving") return;
		const url = (this.deps.objectUrls ?? browserObjectUrls).create(new Blob([bytes], { type: item.mime }));
		this.objectUrls.add(url);
		this.updateFile(fileId, {
			status: "received",
			progress: 1,
			url
		});
	}
	fileItem(fileId) {
		const item = this.state.messages.find((m) => m.id === fileId);
		return item?.kind === "file" ? item : void 0;
	}
	/** Patch a file item. Progress is kept to whole percents, so a 2 MB file is ~100 updates, not 128 × recipients. */
	updateFile(fileId, patch) {
		const item = this.fileItem(fileId);
		if (!item) return;
		const next = {
			...item,
			...patch,
			...patch.progress !== void 0 ? { progress: Math.min(1, Math.floor(patch.progress * 100) / 100) } : {}
		};
		if (next.status === item.status && next.progress === item.progress && next.delivered === item.delivered && next.url === item.url && next.error === item.error) return;
		this.setState({ messages: this.state.messages.map((m) => m === item ? next : m) });
	}
	releaseFiles() {
		const urls = this.deps.objectUrls ?? browserObjectUrls;
		for (const url of this.objectUrls) urls.revoke(url);
		this.objectUrls.clear();
	}
	/** Close everything and scrub secrets. */
	shutdown() {
		this.clearJoinTimer();
		if (this.expiryTimer) clearTimeout(this.expiryTimer);
		this.expiryTimer = null;
		if (this.phraseTimer) clearTimeout(this.phraseTimer);
		this.phraseTimer = null;
		if (this.mismatchTimer) clearTimeout(this.mismatchTimer);
		this.mismatchTimer = null;
		for (const timer of this.typingTimers.values()) clearTimeout(timer);
		this.typingTimers.clear();
		for (const timer of this.aiPendingTimers.values()) clearTimeout(timer);
		this.aiPendingTimers.clear();
		for (const abort of this.aiStreams) abort.abort();
		this.aiStreams.clear();
		this.ai.forget();
		this.typingOn = false;
		for (const id of [...this.links.keys()]) this.dropLink(id);
		this.outgoingFiles.clear();
		this.signaling?.close();
		this.signaling = null;
	}
	/** The conversation is over: wipe it from memory and from the state. */
	terminate(reason) {
		if (TERMINAL.has(this.state.status)) return;
		this.shutdown();
		this.releaseFiles();
		this.setState({
			status: "terminated",
			endReason: reason,
			peerPresent: false,
			members: [],
			membersMismatch: false,
			messages: [],
			phrase: null,
			typing: [],
			aiPending: []
		});
	}
	/**
	* The room's time is up (server-confirmed). The P2P links are closed (files in flight fail); the
	* transcript, received files included, stays readable until you leave.
	*/
	expire() {
		if (TERMINAL.has(this.state.status)) return;
		this.log("room.expired", "warn");
		this.shutdown();
		this.setState({
			status: "expired",
			peerPresent: false,
			members: [],
			phrase: null,
			typing: [],
			aiPending: []
		});
	}
	fail(code, message) {
		if (TERMINAL.has(this.state.status)) return;
		this.shutdown();
		this.releaseFiles();
		const error = {
			code,
			message
		};
		this.setState({
			status: "error",
			error,
			peerPresent: false,
			members: [],
			messages: [],
			phrase: null,
			typing: [],
			aiPending: []
		});
	}
	clearJoinTimer() {
		if (this.joinTimer) clearTimeout(this.joinTimer);
		this.joinTimer = null;
	}
	/** Recompute everything derived from the links (status, members, connection type). */
	refresh(patch = {}) {
		if (TERMINAL.has(this.state.status)) return;
		const links = [...this.links.values()];
		const members = links.map((link) => ({
			peerId: link.peerId,
			label: memberLabel(link.peerId),
			nickname: link.nickname,
			state: link.state === "connected" ? "sealed" : link.live ? "joining" : "failed",
			connectionType: link.connectionType
		}));
		let { status } = this.state;
		if (LIVE.has(status)) {
			const has = (s) => links.some((link) => link.state === s);
			status = has("connected") ? "sealed" : has("upgrading") ? "connected" : has("negotiating") ? "connecting" : "waiting";
		}
		const types = links.filter((link) => link.live).map((link) => link.connectionType);
		const connectionType = types.includes("relay") ? "relay" : types.includes("direct") ? "direct" : null;
		this.setState({
			status,
			members,
			connectionType,
			...patch
		});
	}
	/** In group rooms, log lines say which member they're about. */
	withPeer(peerId, data) {
		if (!this.isGroup) return data && Object.keys(data).length > 0 ? data : void 0;
		return {
			...data,
			peer: memberLabel(peerId)
		};
	}
	addMessage(item) {
		this.setState({ messages: [...this.state.messages, item] });
	}
	log(code, level, data) {
		const entry = {
			ts: this.now(),
			code,
			level,
			...data ? { data } : {}
		};
		this.setState({ log: [...this.state.log, entry].slice(-200) });
	}
	setState(patch) {
		this.state = {
			...this.state,
			...patch
		};
		for (const listener of [...this.listeners]) listener(this.state);
	}
};
//#endregion
//#region packages/core/src/support.ts
/** Order matters: Messenger's UA also says FBAN, so it's checked before Facebook. */
var IN_APP = [
	["instagram", /\bInstagram\b/i],
	["messenger", /\bMessengerForiOS\b|\bFBAN\/Messenger|\bOrca-Android\b|\bMessengerLite/i],
	["facebook", /\bFBAN\/|\bFBAV\/|\bFB_IAB\/|\bFBIOS\b|\bFBSS\//],
	["whatsapp", /\bWhatsApp\b/i],
	["telegram", /\bTelegram(?:-Android)?\b/i],
	["tiktok", /\bmusical_ly\b|\bBytedanceWebview\b|\bTikTok\b|\bByteLocale\b/i],
	["snapchat", /\bSnapchat\b/i],
	["line", /\bLine\/\d/],
	["wechat", /\bMicroMessenger\b/i],
	["linkedin", /\bLinkedInApp\b/i],
	["x", /\bTwitter(?:Android)?\b/]
];
function detectPlatform(userAgent, maxTouchPoints = 0, platform = "") {
	if (/\bAndroid\b/i.test(userAgent)) return "android";
	if (/\b(iPhone|iPad|iPod)\b/.test(userAgent)) return "ios";
	if (/\bMacintosh\b/.test(userAgent) && (maxTouchPoints > 1 || platform === "iPad")) return "ios";
	return "other";
}
function detectInAppBrowser(userAgent, platform = detectPlatform(userAgent)) {
	for (const [name, pattern] of IN_APP) if (pattern.test(userAgent)) return name;
	if (platform === "android" && /;\s*wv\)/.test(userAgent)) return "webview";
	if (platform === "ios" && /\bAppleWebKit\b/.test(userAgent) && !/\bSafari\//.test(userAgent)) return "webview";
	return null;
}
function isFunction(value) {
	return typeof value === "function";
}
function detectBrowserSupport(env = globalThis) {
	const missing = [];
	if (env.isSecureContext === false) missing.push("secure_context");
	if (!env.crypto?.subtle || !isFunction(env.crypto.getRandomValues)) missing.push("webcrypto");
	const pc = env.RTCPeerConnection;
	if (!isFunction(pc) || !isFunction(pc?.prototype?.createDataChannel)) missing.push("webrtc");
	if (!isFunction(env.WebSocket)) missing.push("websocket");
	if (!isFunction(env.TextEncoder) || !isFunction(env.TextDecoder) || !isFunction(env.BigInt)) missing.push("javascript");
	const nav = env.navigator ?? {};
	const userAgent = nav.userAgent ?? "";
	const platform = detectPlatform(userAgent, nav.maxTouchPoints, nav.platform);
	return {
		ok: missing.length === 0,
		missing,
		inApp: detectInAppBrowser(userAgent, platform),
		platform
	};
}
//#endregion
export { AI_CONTEXT_MAX_BYTES, AI_SYSTEM_PROMPT, AiClient, DEFAULT_FILE_ACK_TIMEOUT_MS, FileLane, FrameCodec, INVITE_PATH, InitiatorHandshake, LABELS, MemberLink, PHRASE_KDF_ITERATIONS, PHRASE_WORDS, PeerLink, PoofError, ResponderHandshake, RoomSession, SignalingClient, WS_OPEN, blindedHash, browserRtcFactory, browserSocketFactory, buildAiPrompt, bytes, chunkCount, concat, createPhraseInvite, createRoom, decodeChunk, decodeRoomKey, decryptAiChunk, deriveAiToken, derivePhraseKeys, detectBrowserSupport, detectInAppBrowser, detectPlatform, encodeChunk, encodeRoomKey, encryptForModel, equalBytes, fetchEthQuote, fetchPayConfig, finishPass, formatEth, formatUsd, fromBase64, fromBase64Url, fromUtf8, generateAiSessionKeys, generatePhrase, generateRoomKey, hashFile, inviteFragment, inviteUrl, isValidVariant, joinByPhrase, lengthPrefixed, memberLabel, mentionsAi, newAttestationNonce, normalizeAiText, normalizeChatText, normalizeNickname, normalizePhrase, openInvite, parseInviteFragment, parseRoomLocation, passKeyId, paymentMessage, priceMicros, purchasableVariants, randomBytes, readAiStream, readU64be, redeemPayment, roomPath, sanitizeFileName, sanitizeMime, sealInvite, serverError, startPass, stripMention, toBase64, toBase64Url, transferData, u64be, utf8, variantId, verifyAttestation, wipe };
