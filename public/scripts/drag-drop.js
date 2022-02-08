!(function (e) {
	if ("object" == typeof exports && "undefined" != typeof module)
		module.exports = e();
	else if ("function" == typeof define && define.amd) define([], e);
	else {
		("undefined" != typeof window
			? window
			: "undefined" != typeof global
			? global
			: "undefined" != typeof self
			? self
			: this
		).dragDrop = e();
	}
})(function () {
	return (function () {
		return function e(t, n, r) {
			function o(f, a) {
				if (!n[f]) {
					if (!t[f]) {
						var l = "function" == typeof require && require;
						if (!a && l) return l(f, !0);
						if (i) return i(f, !0);
						var s = new Error("Cannot find module '" + f + "'");
						throw ((s.code = "MODULE_NOT_FOUND"), s);
					}
					var u = (n[f] = { exports: {} });
					t[f][0].call(
						u.exports,
						function (e) {
							return o(t[f][1][e] || e);
						},
						u,
						u.exports,
						e,
						t,
						n,
						r
					);
				}
				return n[f].exports;
			}
			for (
				var i = "function" == typeof require && require, f = 0;
				f < r.length;
				f++
			)
				o(r[f]);
			return o;
		};
	})()(
		{
			1: [
				function (e, t, n) {
					(t.exports = function (e, t) {
						if ("string" == typeof e) {
							const t = e;
							if (!(e = window.document.querySelector(e)))
								throw new Error(`"${t}" does not match any HTML elements`);
						}
						if (!e) throw new Error(`"${e}" is not a valid HTML element`);
						"function" == typeof t && (t = { onDrop: t });
						e.addEventListener("dragenter", f, !1),
							e.addEventListener("dragover", a, !1),
							e.addEventListener("dragleave", l, !1),
							e.addEventListener("drop", s, !1);
						let n = !1,
							r = 0;
						return function () {
							u(),
								e.removeEventListener("dragenter", f, !1),
								e.removeEventListener("dragover", a, !1),
								e.removeEventListener("dragleave", l, !1),
								e.removeEventListener("drop", s, !1);
						};
						function i(e) {
							if (e.dataTransfer.items || e.dataTransfer.types) {
								const n = Array.from(e.dataTransfer.items),
									r = Array.from(e.dataTransfer.types);
								let o, i;
								if (n.length)
									(o = n.filter((e) => "file" === e.kind)),
										(i = n.filter((e) => "string" === e.kind));
								else {
									if (!r.length) return !1;
									(o = r.filter((e) => "Files" === e)),
										(i = r.filter((e) => e.startsWith("text/")));
								}
								return (
									!(0 === o.length && !t.onDropText) &&
									!(0 === i.length && !t.onDrop) &&
									(0 !== o.length || 0 !== i.length)
								);
							}
							return !1;
						}
						function f(o) {
							if ((o.stopPropagation(), o.preventDefault(), i(o)))
								return n
									? ((r += 1), !1)
									: ((n = !0),
									  t.onDragEnter && t.onDragEnter(o),
									  e.classList.add("drag"),
									  !1);
						}
						function a(e) {
							if ((e.stopPropagation(), e.preventDefault(), i(e)))
								return (
									t.onDragOver && t.onDragOver(e),
									(e.dataTransfer.dropEffect = "copy"),
									!1
								);
						}
						function l(e) {
							if ((e.stopPropagation(), e.preventDefault(), i(e)))
								return r > 0
									? ((r -= 1), !1)
									: ((n = !1), t.onDragLeave && t.onDragLeave(e), u(), !1);
						}
						function s(e) {
							e.stopPropagation(),
								e.preventDefault(),
								t.onDragLeave && t.onDragLeave(e),
								u(),
								(n = !1),
								(r = 0);
							const i = { x: e.clientX, y: e.clientY },
								f = e.dataTransfer.getData("text");
							return (
								f && t.onDropText && t.onDropText(f, i),
								t.onDrop &&
									e.dataTransfer.items &&
									o(e.dataTransfer.items, (n, r, o) => {
										if (n) return void console.error(n);
										if (0 === r.length) return;
										const f = e.dataTransfer.files;
										t.onDrop(r, i, f, o);
									}),
								!1
							);
						}
						function u() {
							e.classList.remove("drag");
						}
					}),
						(t.exports.processItems = o);
					const r = e("run-parallel");
					function o(e, t) {
						0 === (e = Array.from(e).filter((e) => "file" === e.kind)).length &&
							t(null, [], []),
							r(
								e.map((e) => (t) => {
									!(function (e, t) {
										let n = [];
										if (e.isFile)
											e.file(
												(n) => {
													(n.fullPath = e.fullPath),
														(n.isFile = !0),
														(n.isDirectory = !1),
														t(null, n);
												},
												(e) => {
													t(e);
												}
											);
										else if (e.isDirectory) {
											const o = e.createReader();
											!(function o(f) {
												f.readEntries((a) => {
													a.length > 0
														? ((n = n.concat(Array.from(a))), o(f))
														: r(
																n.map((e) => (t) => {
																	i(e, t);
																}),
																(n, r) => {
																	n
																		? t(n)
																		: (r.push({
																				fullPath: e.fullPath,
																				name: e.name,
																				isFile: !1,
																				isDirectory: !0,
																		  }),
																		  t(null, r));
																}
														  );
												});
											})(o);
										}
									})(e.webkitGetAsEntry(), t);
								}),
								(e, n) => {
									if (e) return void t(e);
									const r = n.flat(1 / 0),
										o = r.filter((e) => e.isFile),
										i = r.filter((e) => e.isDirectory);
									t(null, o, i);
								}
							);
					}
					function i(e, t) {
						let n = [];
						if (e.isFile) {
							e.file(
								(n) => {
									n.fullPath = e.fullPath;
									n.isFile = true;
									n.isDirectory = false;
									t(null, n);
								},
								(e) => {
									t(e);
								}
							);
						} else if (e.isDirectory) {
							const t = e.createReader();
							o(t);
						}
						function o(e) {
							e.readEntries((t) => {
								if (t.length > 0) {
									n = n.concat(Array.from(t));
									o(e);
								} else {
									f();
								}
							});
						}
						function f() {
							r(
								n.map((e) => {
									return (t) => {
										i(e, t);
									};
								}),
								(n, r) => {
									if (n) {
										t(n);
									} else {
										r.push({
											fullPath: e.fullPath,
											name: e.name,
											isFile: false,
											isDirectory: true,
										});
										t(null, r);
									}
								}
							);
						}
					}
				},
				{ "run-parallel": 3 },
			],
			2: [
				function (e, t, n) {
					(function (e) {
						let n;
						t.exports =
							"function" == typeof queueMicrotask
								? queueMicrotask.bind("undefined" != typeof window ? window : e)
								: (e) =>
										(n || (n = Promise.resolve())).then(e).catch((e) =>
											setTimeout(() => {
												throw e;
											}, 0)
										);
					}.call(
						this,
						"undefined" != typeof global
							? global
							: "undefined" != typeof self
							? self
							: "undefined" != typeof window
							? window
							: {}
					));
				},
				{},
			],
			3: [
				function (e, t, n) {
					t.exports = function (e, t) {
						let n,
							o,
							i,
							f = !0;
						Array.isArray(e)
							? ((n = []), (o = e.length))
							: ((i = Object.keys(e)), (n = {}), (o = i.length));
						function a(e) {
							function o() {
								t && t(e, n), (t = null);
							}
							f ? r(o) : o();
						}
						function l(e, t, r) {
							(n[e] = r), (0 == --o || t) && a(t);
						}
						o
							? i
								? i.forEach(function (t) {
										e[t](function (e, n) {
											l(t, e, n);
										});
								  })
								: e.forEach(function (e, t) {
										e(function (e, n) {
											l(t, e, n);
										});
								  })
							: a(null);
						f = !1;
					};
					const r = e("queue-microtask");
				},
				{ "queue-microtask": 2 },
			],
		},
		{},
		[1]
	)(1);
});
