"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2018, University of Colorado Boulder

/**
 * Represents a simulation release branch for deployment
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var buildLocal = require('./buildLocal');
var buildServerRequest = require('./buildServerRequest');
var ChipperVersion = require('./ChipperVersion');
var checkoutMain = require('./checkoutMain');
var checkoutTarget = require('./checkoutTarget');
var createDirectory = require('./createDirectory');
var execute = require('./execute');
var getActiveSims = require('./getActiveSims');
var getBranchDependencies = require('./getBranchDependencies');
var getBranches = require('./getBranches');
var getBuildArguments = require('./getBuildArguments');
var getDependencies = require('./getDependencies');
var getBranchMap = require('./getBranchMap');
var getBranchVersion = require('./getBranchVersion');
var getFileAtBranch = require('./getFileAtBranch');
var getRepoVersion = require('./getRepoVersion');
var gitCheckout = require('./gitCheckout');
var gitCheckoutDirectory = require('./gitCheckoutDirectory');
var gitCloneOrFetchDirectory = require('./gitCloneOrFetchDirectory');
var gitFirstDivergingCommit = require('./gitFirstDivergingCommit');
var gitIsAncestor = require('./gitIsAncestor');
var gitPull = require('./gitPull');
var gitPullDirectory = require('./gitPullDirectory');
var gitRevParse = require('./gitRevParse');
var gitTimestamp = require('./gitTimestamp');
var gruntCommand = require('./gruntCommand');
var loadJSON = require('./loadJSON');
var npmUpdateDirectory = require('./npmUpdateDirectory');
var puppeteerLoad = require('./puppeteerLoad');
var simMetadata = require('./simMetadata');
var simPhetioMetadata = require('./simPhetioMetadata');
var withServer = require('./withServer');
var assert = require('assert');
var fs = require('fs');
var winston = require('../../../../../../perennial-alias/node_modules/winston');
var _ = require('lodash');
module.exports = function () {
  var MAINTENANCE_DIRECTORY = '../release-branches';
  var ReleaseBranch = /*#__PURE__*/function () {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} branch
     * @param {Array.<string>} brands
     * @param {boolean} isReleased
     */
    function ReleaseBranch(repo, branch, brands, isReleased) {
      _classCallCheck(this, ReleaseBranch);
      assert(typeof repo === 'string');
      assert(typeof branch === 'string');
      assert(Array.isArray(brands));
      assert(typeof isReleased === 'boolean');

      // @public {string}
      this.repo = repo;
      this.branch = branch;

      // @public {Array.<string>}
      this.brands = brands;

      // @public {boolean}
      this.isReleased = isReleased;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    return _createClass(ReleaseBranch, [{
      key: "serialize",
      value: function serialize() {
        return {
          repo: this.repo,
          branch: this.branch,
          brands: this.brands,
          isReleased: this.isReleased
        };
      }

      /**
       * Takes a serialized form of the ReleaseBranch and returns an actual instance.
       * @public
       *
       * @param {Object}
       * @returns {ReleaseBranch}
       */
    }, {
      key: "equals",
      value:
      /**
       * Returns whether the two release branches contain identical information.
       * @public
       *
       * @param {ReleaseBranch} releaseBranch
       * @returns {boolean}
       */
      function equals(releaseBranch) {
        return this.repo === releaseBranch.repo && this.branch === releaseBranch.branch && this.brands.join(',') === releaseBranch.brands.join(',') && this.isReleased === releaseBranch.isReleased;
      }

      /**
       * Converts it to a (debuggable) string form.
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "toString",
      value: function toString() {
        return "".concat(this.repo, " ").concat(this.branch, " ").concat(this.brands.join(',')).concat(this.isReleased ? '' : ' (unpublished)');
      }

      /**
       * @public
       *
       * @param repo {string}
       * @param branch {string}
       * @returns {string}
       */
    }, {
      key: "getLocalPhetBuiltHTMLPath",
      value: (
      /**
       * Returns the path (relative to the repo) to the built phet-brand HTML file
       * @public
       *
       * @returns {Promise<string>}
       */
      function () {
        var _getLocalPhetBuiltHTMLPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.usesChipper2();
              case 2:
                usesChipper2 = _context.sent;
                return _context.abrupt("return", "build/".concat(usesChipper2 ? 'phet/' : '').concat(this.repo, "_en").concat(usesChipper2 ? '_phet' : '', ".html"));
              case 4:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function getLocalPhetBuiltHTMLPath() {
          return _getLocalPhetBuiltHTMLPath.apply(this, arguments);
        }
        return getLocalPhetBuiltHTMLPath;
      }()
      /**
       * Returns the path (relative to the repo) to the built phet-io-brand HTML file
       * @public
       *
       * @returns {Promise<string>}
       */
      )
    }, {
      key: "getLocalPhetIOBuiltHTMLPath",
      value: (function () {
        var _getLocalPhetIOBuiltHTMLPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.usesChipper2();
              case 2:
                usesChipper2 = _context2.sent;
                return _context2.abrupt("return", "build/".concat(usesChipper2 ? 'phet-io/' : '').concat(this.repo).concat(usesChipper2 ? '_all_phet-io' : '_en-phetio', ".html"));
              case 4:
              case "end":
                return _context2.stop();
            }
          }, _callee2, this);
        }));
        function getLocalPhetIOBuiltHTMLPath() {
          return _getLocalPhetIOBuiltHTMLPath.apply(this, arguments);
        }
        return getLocalPhetIOBuiltHTMLPath;
      }()
      /**
       * Returns the query parameter to use for activating phet-io standalone mode
       * @public
       *
       * @returns {Promise<string>}
       */
      )
    }, {
      key: "getPhetioStandaloneQueryParameter",
      value: (function () {
        var _getPhetioStandaloneQueryParameter = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
          return _regeneratorRuntime().wrap(function _callee3$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.usesOldPhetioStandalone();
              case 2:
                if (!_context3.sent) {
                  _context3.next = 6;
                  break;
                }
                _context3.t0 = 'phet-io.standalone';
                _context3.next = 7;
                break;
              case 6:
                _context3.t0 = 'phetioStandalone';
              case 7:
                return _context3.abrupt("return", _context3.t0);
              case 8:
              case "end":
                return _context3.stop();
            }
          }, _callee3, this);
        }));
        function getPhetioStandaloneQueryParameter() {
          return _getPhetioStandaloneQueryParameter.apply(this, arguments);
        }
        return getPhetioStandaloneQueryParameter;
      }()
      /**
       * @public
       *
       * @returns {ChipperVersion}
       */
      )
    }, {
      key: "getChipperVersion",
      value: function getChipperVersion() {
        var checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
        return ChipperVersion.getFromPackageJSON(JSON.parse(fs.readFileSync("".concat(checkoutDirectory, "/chipper/package.json"), 'utf8')));
      }

      /**
       * @public
       */
    }, {
      key: "updateCheckout",
      value: (function () {
        var _updateCheckout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
          var _this = this;
          var overrideDependencies,
            checkoutDirectory,
            dependenciesOnBranchTip,
            dependencyRepos,
            _args5 = arguments;
          return _regeneratorRuntime().wrap(function _callee5$(_context5) {
            while (1) switch (_context5.prev = _context5.next) {
              case 0:
                overrideDependencies = _args5.length > 0 && _args5[0] !== undefined ? _args5[0] : {};
                winston.info("updating checkout for ".concat(this.toString()));
                if (fs.existsSync(MAINTENANCE_DIRECTORY)) {
                  _context5.next = 6;
                  break;
                }
                winston.info("creating directory ".concat(MAINTENANCE_DIRECTORY));
                _context5.next = 6;
                return createDirectory(MAINTENANCE_DIRECTORY);
              case 6:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                if (fs.existsSync(checkoutDirectory)) {
                  _context5.next = 11;
                  break;
                }
                winston.info("creating directory ".concat(checkoutDirectory));
                _context5.next = 11;
                return createDirectory(checkoutDirectory);
              case 11:
                _context5.next = 13;
                return gitCloneOrFetchDirectory(this.repo, checkoutDirectory);
              case 13:
                _context5.next = 15;
                return gitCheckoutDirectory(this.branch, "".concat(checkoutDirectory, "/").concat(this.repo));
              case 15:
                _context5.next = 17;
                return gitPullDirectory("".concat(checkoutDirectory, "/").concat(this.repo));
              case 17:
                _context5.next = 19;
                return loadJSON("".concat(checkoutDirectory, "/").concat(this.repo, "/dependencies.json"));
              case 19:
                dependenciesOnBranchTip = _context5.sent;
                dependenciesOnBranchTip.babel = {
                  sha: buildLocal.babelBranch,
                  branch: buildLocal.babelBranch
                };
                dependencyRepos = _.uniq([].concat(_toConsumableArray(Object.keys(dependenciesOnBranchTip)), _toConsumableArray(Object.keys(overrideDependencies))).filter(function (repo) {
                  return repo !== 'comment';
                }));
                _context5.next = 24;
                return Promise.all(dependencyRepos.map( /*#__PURE__*/function () {
                  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(repo) {
                    var repoPwd, sha;
                    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                      while (1) switch (_context4.prev = _context4.next) {
                        case 0:
                          repoPwd = "".concat(checkoutDirectory, "/").concat(repo);
                          _context4.next = 3;
                          return gitCloneOrFetchDirectory(repo, checkoutDirectory);
                        case 3:
                          sha = overrideDependencies[repo] ? overrideDependencies[repo].sha : dependenciesOnBranchTip[repo].sha;
                          _context4.next = 6;
                          return gitCheckoutDirectory(sha, repoPwd);
                        case 6:
                          if (!(repo === 'babel')) {
                            _context4.next = 9;
                            break;
                          }
                          _context4.next = 9;
                          return gitPullDirectory(repoPwd);
                        case 9:
                          if (!(repo === 'chipper' || repo === 'perennial-alias' || repo === _this.repo)) {
                            _context4.next = 13;
                            break;
                          }
                          winston.info("npm ".concat(repo, " in ").concat(checkoutDirectory));
                          _context4.next = 13;
                          return npmUpdateDirectory(repoPwd);
                        case 13:
                        case "end":
                          return _context4.stop();
                      }
                    }, _callee4);
                  }));
                  return function (_x) {
                    return _ref.apply(this, arguments);
                  };
                }()));
              case 24:
                _context5.next = 26;
                return gitCloneOrFetchDirectory('perennial', checkoutDirectory);
              case 26:
              case "end":
                return _context5.stop();
            }
          }, _callee5, this);
        }));
        function updateCheckout() {
          return _updateCheckout.apply(this, arguments);
        }
        return updateCheckout;
      }()
      /**
       * @public
       *
       * @param {Object} [options] - optional parameters for getBuildArguments
       */
      )
    }, {
      key: "build",
      value: (function () {
        var _build = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(options) {
          var checkoutDirectory, repoDirectory, args;
          return _regeneratorRuntime().wrap(function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                repoDirectory = "".concat(checkoutDirectory, "/").concat(this.repo);
                args = getBuildArguments(this.getChipperVersion(), _.merge({
                  brands: this.brands,
                  allHTML: true,
                  debugHTML: true,
                  lint: false
                }, options));
                winston.info("building ".concat(checkoutDirectory, " with grunt ").concat(args.join(' ')));
                _context6.next = 6;
                return execute(gruntCommand, args, repoDirectory);
              case 6:
              case "end":
                return _context6.stop();
            }
          }, _callee6, this);
        }));
        function build(_x2) {
          return _build.apply(this, arguments);
        }
        return build;
      }()
      /**
       * @public
       */
      )
    }, {
      key: "transpile",
      value: (function () {
        var _transpile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
          var checkoutDirectory, repoDirectory;
          return _regeneratorRuntime().wrap(function _callee7$(_context7) {
            while (1) switch (_context7.prev = _context7.next) {
              case 0:
                checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
                repoDirectory = "".concat(checkoutDirectory, "/").concat(this.repo);
                winston.info("transpiling ".concat(checkoutDirectory));

                // We might not be able to run this command!
                _context7.next = 5;
                return execute(gruntCommand, ['output-js-project'], repoDirectory, {
                  errors: 'resolve'
                });
              case 5:
              case "end":
                return _context7.stop();
            }
          }, _callee7, this);
        }));
        function transpile() {
          return _transpile.apply(this, arguments);
        }
        return transpile;
      }()
      /**
       * @public
       *
       * @returns {Promise<string|null>} - Error string, or null if no error
       */
      )
    }, {
      key: "checkUnbuilt",
      value: (function () {
        var _checkUnbuilt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
          var _this2 = this;
          return _regeneratorRuntime().wrap(function _callee9$(_context9) {
            while (1) switch (_context9.prev = _context9.next) {
              case 0:
                _context9.prev = 0;
                _context9.next = 3;
                return withServer( /*#__PURE__*/function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(port) {
                    var url;
                    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
                      while (1) switch (_context8.prev = _context8.next) {
                        case 0:
                          url = "http://localhost:".concat(port, "/").concat(_this2.repo, "/").concat(_this2.repo, "_en.html?brand=phet&ea&fuzzMouse&fuzzTouch");
                          _context8.prev = 1;
                          _context8.next = 4;
                          return puppeteerLoad(url, {
                            waitAfterLoad: 20000
                          });
                        case 4:
                          return _context8.abrupt("return", _context8.sent);
                        case 7:
                          _context8.prev = 7;
                          _context8.t0 = _context8["catch"](1);
                          return _context8.abrupt("return", "Failure for ".concat(url, ": ").concat(_context8.t0));
                        case 10:
                        case "end":
                          return _context8.stop();
                      }
                    }, _callee8, null, [[1, 7]]);
                  }));
                  return function (_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }(), {
                  path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
                });
              case 3:
                return _context9.abrupt("return", _context9.sent);
              case 6:
                _context9.prev = 6;
                _context9.t0 = _context9["catch"](0);
                return _context9.abrupt("return", "[ERROR] Failure to check: ".concat(_context9.t0));
              case 9:
              case "end":
                return _context9.stop();
            }
          }, _callee9, this, [[0, 6]]);
        }));
        function checkUnbuilt() {
          return _checkUnbuilt.apply(this, arguments);
        }
        return checkUnbuilt;
      }()
      /**
       * @public
       *
       * @returns {Promise<string|null>} - Error string, or null if no error
       */
      )
    }, {
      key: "checkBuilt",
      value: (function () {
        var _checkBuilt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
          var _this3 = this;
          var usesChipper2;
          return _regeneratorRuntime().wrap(function _callee11$(_context11) {
            while (1) switch (_context11.prev = _context11.next) {
              case 0:
                _context11.prev = 0;
                _context11.next = 3;
                return this.usesChipper2();
              case 3:
                usesChipper2 = _context11.sent;
                _context11.next = 6;
                return withServer( /*#__PURE__*/function () {
                  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(port) {
                    var url;
                    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
                      while (1) switch (_context10.prev = _context10.next) {
                        case 0:
                          url = "http://localhost:".concat(port, "/").concat(_this3.repo, "/build/").concat(usesChipper2 ? 'phet/' : '').concat(_this3.repo, "_en").concat(usesChipper2 ? '_phet' : '', ".html?fuzzMouse&fuzzTouch");
                          _context10.prev = 1;
                          return _context10.abrupt("return", puppeteerLoad(url, {
                            waitAfterLoad: 20000
                          }));
                        case 5:
                          _context10.prev = 5;
                          _context10.t0 = _context10["catch"](1);
                          return _context10.abrupt("return", "Failure for ".concat(url, ": ").concat(_context10.t0));
                        case 8:
                        case "end":
                          return _context10.stop();
                      }
                    }, _callee10, null, [[1, 5]]);
                  }));
                  return function (_x4) {
                    return _ref3.apply(this, arguments);
                  };
                }(), {
                  path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
                });
              case 6:
                return _context11.abrupt("return", _context11.sent);
              case 9:
                _context11.prev = 9;
                _context11.t0 = _context11["catch"](0);
                return _context11.abrupt("return", "[ERROR] Failure to check: ".concat(_context11.t0));
              case 12:
              case "end":
                return _context11.stop();
            }
          }, _callee11, this, [[0, 9]]);
        }));
        function checkBuilt() {
          return _checkBuilt.apply(this, arguments);
        }
        return checkBuilt;
      }()
      /**
       * Checks this release branch out.
       * @public
       *
       * @param {boolean} includeNpmUpdate
       */
      )
    }, {
      key: "checkout",
      value: (function () {
        var _checkout = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(includeNpmUpdate) {
          return _regeneratorRuntime().wrap(function _callee12$(_context12) {
            while (1) switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return checkoutTarget(this.repo, this.branch, includeNpmUpdate);
              case 2:
              case "end":
                return _context12.stop();
            }
          }, _callee12, this);
        }));
        function checkout(_x5) {
          return _checkout.apply(this, arguments);
        }
        return checkout;
      }()
      /**
       * Whether this release branch includes the given SHA for the given repo dependency. Will be false if it doesn't
       * depend on this repository.
       * @public
       *
       * @param {string} repo
       * @param {string} sha
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "includesSHA",
      value: (function () {
        var _includesSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(repo, sha) {
          var result, dependencies, currentSHA;
          return _regeneratorRuntime().wrap(function _callee13$(_context13) {
            while (1) switch (_context13.prev = _context13.next) {
              case 0:
                result = false;
                _context13.next = 3;
                return gitCheckout(this.repo, this.branch);
              case 3:
                _context13.next = 5;
                return getDependencies(this.repo);
              case 5:
                dependencies = _context13.sent;
                if (!dependencies[repo]) {
                  _context13.next = 14;
                  break;
                }
                currentSHA = dependencies[repo].sha;
                _context13.t0 = sha === currentSHA;
                if (_context13.t0) {
                  _context13.next = 13;
                  break;
                }
                _context13.next = 12;
                return gitIsAncestor(repo, sha, currentSHA);
              case 12:
                _context13.t0 = _context13.sent;
              case 13:
                result = _context13.t0;
              case 14:
                _context13.next = 16;
                return gitCheckout(this.repo, 'main');
              case 16:
                return _context13.abrupt("return", result);
              case 17:
              case "end":
                return _context13.stop();
            }
          }, _callee13, this);
        }));
        function includesSHA(_x6, _x7) {
          return _includesSHA.apply(this, arguments);
        }
        return includesSHA;
      }()
      /**
       * Whether this release branch does NOT include the given SHA for the given repo dependency. Will be false if it doesn't
       * depend on this repository.
       * @public
       *
       * @param {string} repo
       * @param {string} sha
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "isMissingSHA",
      value: (function () {
        var _isMissingSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(repo, sha) {
          var result, dependencies, currentSHA;
          return _regeneratorRuntime().wrap(function _callee14$(_context14) {
            while (1) switch (_context14.prev = _context14.next) {
              case 0:
                result = false;
                _context14.next = 3;
                return gitCheckout(this.repo, this.branch);
              case 3:
                _context14.next = 5;
                return getDependencies(this.repo);
              case 5:
                dependencies = _context14.sent;
                if (!dependencies[repo]) {
                  _context14.next = 14;
                  break;
                }
                currentSHA = dependencies[repo].sha;
                _context14.t0 = sha !== currentSHA;
                if (!_context14.t0) {
                  _context14.next = 13;
                  break;
                }
                _context14.next = 12;
                return gitIsAncestor(repo, sha, currentSHA);
              case 12:
                _context14.t0 = !_context14.sent;
              case 13:
                result = _context14.t0;
              case 14:
                _context14.next = 16;
                return gitCheckout(this.repo, 'main');
              case 16:
                return _context14.abrupt("return", result);
              case 17:
              case "end":
                return _context14.stop();
            }
          }, _callee14, this);
        }));
        function isMissingSHA(_x8, _x9) {
          return _isMissingSHA.apply(this, arguments);
        }
        return isMissingSHA;
      }()
      /**
       * The SHA at which this release branch's main repository diverged from main.
       * @public
       *
       * @returns {Promise.<string>}
       */
      )
    }, {
      key: "getDivergingSHA",
      value: (function () {
        var _getDivergingSHA = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
          return _regeneratorRuntime().wrap(function _callee15$(_context15) {
            while (1) switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context15.next = 4;
                return gitPull(this.repo);
              case 4:
                _context15.next = 6;
                return gitCheckout(this.repo, 'main');
              case 6:
                return _context15.abrupt("return", gitFirstDivergingCommit(this.repo, this.branch, 'main'));
              case 7:
              case "end":
                return _context15.stop();
            }
          }, _callee15, this);
        }));
        function getDivergingSHA() {
          return _getDivergingSHA.apply(this, arguments);
        }
        return getDivergingSHA;
      }()
      /**
       * The timestamp at which this release branch's main repository diverged from main.
       * @public
       *
       * @returns {Promise.<number>}
       */
      )
    }, {
      key: "getDivergingTimestamp",
      value: (function () {
        var _getDivergingTimestamp = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
          return _regeneratorRuntime().wrap(function _callee16$(_context16) {
            while (1) switch (_context16.prev = _context16.next) {
              case 0:
                _context16.t0 = gitTimestamp;
                _context16.t1 = this.repo;
                _context16.next = 4;
                return this.getDivergingSHA();
              case 4:
                _context16.t2 = _context16.sent;
                return _context16.abrupt("return", (0, _context16.t0)(_context16.t1, _context16.t2));
              case 6:
              case "end":
                return _context16.stop();
            }
          }, _callee16, this);
        }));
        function getDivergingTimestamp() {
          return _getDivergingTimestamp.apply(this, arguments);
        }
        return getDivergingTimestamp;
      }()
      /**
       * Returns the dependencies.json for this release branch
       * @public
       *
       * @returns {Promise}
       */
      )
    }, {
      key: "getDependencies",
      value: (function () {
        var _getDependencies = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
          return _regeneratorRuntime().wrap(function _callee17$(_context17) {
            while (1) switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.abrupt("return", getBranchDependencies(this.repo, this.branch));
              case 1:
              case "end":
                return _context17.stop();
            }
          }, _callee17, this);
        }));
        function getDependencies() {
          return _getDependencies.apply(this, arguments);
        }
        return getDependencies;
      }()
      /**
       * Returns the SimVersion for this release branch
       * @public
       *
       * @returns {Promise<SimVersion>}
       */
      )
    }, {
      key: "getSimVersion",
      value: (function () {
        var _getSimVersion = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
          return _regeneratorRuntime().wrap(function _callee18$(_context18) {
            while (1) switch (_context18.prev = _context18.next) {
              case 0:
                return _context18.abrupt("return", getBranchVersion(this.repo, this.branch));
              case 1:
              case "end":
                return _context18.stop();
            }
          }, _callee18, this);
        }));
        function getSimVersion() {
          return _getSimVersion.apply(this, arguments);
        }
        return getSimVersion;
      }()
      /**
       * Returns a list of status messages of anything out-of-the-ordinary
       * @public
       *
       * @returns {Promise.<Array.<string>>}
       */
      )
    }, {
      key: "getStatus",
      value: (function () {
        var _getStatus = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
          var _this4 = this;
          var getBranchMapAsyncCallback,
            results,
            dependencies,
            dependencyNames,
            currentCommit,
            previousCommit,
            _iterator,
            _step,
            dependency,
            potentialReleaseBranch,
            branchMap,
            _args19 = arguments;
          return _regeneratorRuntime().wrap(function _callee19$(_context19) {
            while (1) switch (_context19.prev = _context19.next) {
              case 0:
                getBranchMapAsyncCallback = _args19.length > 0 && _args19[0] !== undefined ? _args19[0] : getBranchMap;
                results = [];
                _context19.next = 4;
                return this.getDependencies();
              case 4:
                dependencies = _context19.sent;
                dependencyNames = Object.keys(dependencies).filter(function (key) {
                  return key !== 'comment' && key !== _this4.repo && key !== 'phet-io-wrapper-sonification';
                }); // Check our own dependency
                if (!dependencies[this.repo]) {
                  _context19.next = 30;
                  break;
                }
                _context19.prev = 7;
                _context19.next = 10;
                return gitRevParse(this.repo, this.branch);
              case 10:
                currentCommit = _context19.sent;
                _context19.next = 13;
                return gitRevParse(this.repo, "".concat(currentCommit, "^"));
              case 13:
                previousCommit = _context19.sent;
                if (dependencies[this.repo].sha !== previousCommit) {
                  results.push('[INFO] Potential changes (dependency is not previous commit)');
                  results.push("[INFO] ".concat(currentCommit, " ").concat(previousCommit, " ").concat(dependencies[this.repo].sha));
                }
                _context19.next = 17;
                return this.getSimVersion();
              case 17:
                _context19.t1 = _context19.sent.testType;
                _context19.t0 = _context19.t1 === 'rc';
                if (!_context19.t0) {
                  _context19.next = 21;
                  break;
                }
                _context19.t0 = this.isReleased;
              case 21:
                if (!_context19.t0) {
                  _context19.next = 23;
                  break;
                }
                results.push('[INFO] Release candidate version detected (see if there is a QA issue)');
              case 23:
                _context19.next = 28;
                break;
              case 25:
                _context19.prev = 25;
                _context19.t2 = _context19["catch"](7);
                results.push("[ERROR] Failure to check current/previous commit: ".concat(_context19.t2.message));
              case 28:
                _context19.next = 31;
                break;
              case 30:
                results.push('[WARNING] Own repository not included in dependencies');
              case 31:
                _iterator = _createForOfIteratorHelper(dependencyNames);
                _context19.prev = 32;
                _iterator.s();
              case 34:
                if ((_step = _iterator.n()).done) {
                  _context19.next = 43;
                  break;
                }
                dependency = _step.value;
                potentialReleaseBranch = "".concat(this.repo, "-").concat(this.branch);
                _context19.next = 39;
                return getBranchMapAsyncCallback(dependency);
              case 39:
                branchMap = _context19.sent;
                if (Object.keys(branchMap).includes(potentialReleaseBranch)) {
                  if (dependencies[dependency].sha !== branchMap[potentialReleaseBranch]) {
                    results.push("[WARNING] Dependency mismatch for ".concat(dependency, " on branch ").concat(potentialReleaseBranch));
                  }
                }
              case 41:
                _context19.next = 34;
                break;
              case 43:
                _context19.next = 48;
                break;
              case 45:
                _context19.prev = 45;
                _context19.t3 = _context19["catch"](32);
                _iterator.e(_context19.t3);
              case 48:
                _context19.prev = 48;
                _iterator.f();
                return _context19.finish(48);
              case 51:
                return _context19.abrupt("return", results);
              case 52:
              case "end":
                return _context19.stop();
            }
          }, _callee19, this, [[7, 25], [32, 45, 48, 51]]);
        }));
        function getStatus() {
          return _getStatus.apply(this, arguments);
        }
        return getStatus;
      }()
      /**
       * Returns whether the sim is compatible with ES6 features
       * @public
       *
       * @returns {Promise<boolean>}
       */
      )
    }, {
      key: "usesES6",
      value: (function () {
        var _usesES = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee20$(_context20) {
            while (1) switch (_context20.prev = _context20.next) {
              case 0:
                _context20.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context20.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context20.sent;
                sha = dependencies.chipper.sha;
                _context20.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context20.abrupt("return", gitIsAncestor('chipper', '80b4ad62cd8f2057b844f18d3c00cf5c0c89ed8d', sha));
              case 9:
              case "end":
                return _context20.stop();
            }
          }, _callee20, this);
        }));
        function usesES6() {
          return _usesES.apply(this, arguments);
        }
        return usesES6;
      }()
      /**
       * Returns whether this sim uses initialize-globals based query parameters
       * @public
       *
       * If true:
       *   phet.chipper.queryParameters.WHATEVER
       *   AND it needs to be in the schema
       *
       * If false:
       *   phet.chipper.getQueryParameter( 'WHATEVER' )
       *   FLAGS should use !!phet.chipper.getQueryParameter( 'WHATEVER' )
       *
       * @returns {Promise<boolean>}
       */
      )
    }, {
      key: "usesInitializeGlobalsQueryParameters",
      value: (function () {
        var _usesInitializeGlobalsQueryParameters = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee21$(_context21) {
            while (1) switch (_context21.prev = _context21.next) {
              case 0:
                _context21.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context21.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context21.sent;
                sha = dependencies.chipper.sha;
                _context21.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context21.abrupt("return", gitIsAncestor('chipper', 'e454f88ff51d1e3fabdb3a076d7407a2a9e9133c', sha));
              case 9:
              case "end":
                return _context21.stop();
            }
          }, _callee21, this);
        }));
        function usesInitializeGlobalsQueryParameters() {
          return _usesInitializeGlobalsQueryParameters.apply(this, arguments);
        }
        return usesInitializeGlobalsQueryParameters;
      }()
      /**
       * Returns whether phet-io.standalone is the correct phet-io query parameter (otherwise it's the newer
       * phetioStandalone).
       * Looks for the presence of https://github.com/phetsims/chipper/commit/4814d6966c54f250b1c0f3909b71f2b9cfcc7665.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesOldPhetioStandalone",
      value: (function () {
        var _usesOldPhetioStandalone = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee22$(_context22) {
            while (1) switch (_context22.prev = _context22.next) {
              case 0:
                _context22.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context22.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context22.sent;
                sha = dependencies.chipper.sha;
                _context22.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                _context22.next = 10;
                return gitIsAncestor('chipper', '4814d6966c54f250b1c0f3909b71f2b9cfcc7665', sha);
              case 10:
                return _context22.abrupt("return", !_context22.sent);
              case 11:
              case "end":
                return _context22.stop();
            }
          }, _callee22, this);
        }));
        function usesOldPhetioStandalone() {
          return _usesOldPhetioStandalone.apply(this, arguments);
        }
        return usesOldPhetioStandalone;
      }()
      /**
       * Returns whether the relativeSimPath query parameter is used for wrappers (instead of launchLocalVersion).
       * Looks for the presence of https://github.com/phetsims/phet-io/commit/e3fc26079358d86074358a6db3ebaf1af9725632
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesRelativeSimPath",
      value: (function () {
        var _usesRelativeSimPath = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee23$(_context23) {
            while (1) switch (_context23.prev = _context23.next) {
              case 0:
                _context23.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context23.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context23.sent;
                if (dependencies['phet-io']) {
                  _context23.next = 7;
                  break;
                }
                return _context23.abrupt("return", true);
              case 7:
                sha = dependencies['phet-io'].sha;
                _context23.next = 10;
                return gitCheckout(this.repo, 'main');
              case 10:
                return _context23.abrupt("return", gitIsAncestor('phet-io', 'e3fc26079358d86074358a6db3ebaf1af9725632', sha));
              case 11:
              case "end":
                return _context23.stop();
            }
          }, _callee23, this);
        }));
        function usesRelativeSimPath() {
          return _usesRelativeSimPath.apply(this, arguments);
        }
        return usesRelativeSimPath;
      }()
      /**
       * Returns whether phet-io Studio is being used instead of deprecated instance proxies wrapper.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesPhetioStudio",
      value: (function () {
        var _usesPhetioStudio = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24() {
          var dependencies, sha;
          return _regeneratorRuntime().wrap(function _callee24$(_context24) {
            while (1) switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context24.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context24.sent;
                sha = dependencies.chipper.sha;
                _context24.next = 8;
                return gitCheckout(this.repo, 'main');
              case 8:
                return _context24.abrupt("return", gitIsAncestor('chipper', '7375f6a57b5874b6bbf97a54c9a908f19f88d38f', sha));
              case 9:
              case "end":
                return _context24.stop();
            }
          }, _callee24, this);
        }));
        function usesPhetioStudio() {
          return _usesPhetioStudio.apply(this, arguments);
        }
        return usesPhetioStudio;
      }()
      /**
       * Returns whether phet-io Studio top-level (index.html) is used instead of studio.html.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesPhetioStudioIndex",
      value: (function () {
        var _usesPhetioStudioIndex = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
          var dependencies, dependency, sha;
          return _regeneratorRuntime().wrap(function _callee25$(_context25) {
            while (1) switch (_context25.prev = _context25.next) {
              case 0:
                _context25.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context25.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context25.sent;
                dependency = dependencies['phet-io-wrappers'];
                if (dependency) {
                  _context25.next = 8;
                  break;
                }
                return _context25.abrupt("return", false);
              case 8:
                sha = dependency.sha;
                _context25.next = 11;
                return gitCheckout(this.repo, 'main');
              case 11:
                return _context25.abrupt("return", gitIsAncestor('phet-io-wrappers', '7ec1a04a70fb9707b381b8bcab3ad070815ef7fe', sha));
              case 12:
              case "end":
                return _context25.stop();
            }
          }, _callee25, this);
        }));
        function usesPhetioStudioIndex() {
          return _usesPhetioStudioIndex.apply(this, arguments);
        }
        return usesPhetioStudioIndex;
      }()
      /**
       * Returns whether an additional folder exists in the build directory of the sim based on the brand.
       * @public
       *
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "usesChipper2",
      value: (function () {
        var _usesChipper = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26() {
          var dependencies, chipperVersion, result;
          return _regeneratorRuntime().wrap(function _callee26$(_context26) {
            while (1) switch (_context26.prev = _context26.next) {
              case 0:
                _context26.next = 2;
                return gitCheckout(this.repo, this.branch);
              case 2:
                _context26.next = 4;
                return getDependencies(this.repo);
              case 4:
                dependencies = _context26.sent;
                _context26.next = 7;
                return gitCheckout('chipper', dependencies.chipper.sha);
              case 7:
                chipperVersion = ChipperVersion.getFromRepository();
                result = chipperVersion.major !== 0 || chipperVersion.minor !== 0;
                _context26.next = 11;
                return gitCheckout(this.repo, 'main');
              case 11:
                _context26.next = 13;
                return gitCheckout('chipper', 'main');
              case 13:
                return _context26.abrupt("return", result);
              case 14:
              case "end":
                return _context26.stop();
            }
          }, _callee26, this);
        }));
        function usesChipper2() {
          return _usesChipper.apply(this, arguments);
        }
        return usesChipper2;
      }()
      /**
       * Runs a predicate function with the contents of a specific file's contents in the release branch (with false if
       * it doesn't exist).
       * @public
       *
       * @param {string} file
       * @param {function(contents:string):boolean} predicate
       * @returns {Promise.<boolean>}
       */
      )
    }, {
      key: "withFile",
      value: (function () {
        var _withFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27(file, predicate) {
          var contents;
          return _regeneratorRuntime().wrap(function _callee27$(_context27) {
            while (1) switch (_context27.prev = _context27.next) {
              case 0:
                _context27.next = 2;
                return this.checkout(false);
              case 2:
                if (!fs.existsSync(file)) {
                  _context27.next = 5;
                  break;
                }
                contents = fs.readFileSync(file, 'utf-8');
                return _context27.abrupt("return", predicate(contents));
              case 5:
                return _context27.abrupt("return", false);
              case 6:
              case "end":
                return _context27.stop();
            }
          }, _callee27, this);
        }));
        function withFile(_x10, _x11) {
          return _withFile.apply(this, arguments);
        }
        return withFile;
      }()
      /**
       * Re-runs a production deploy for a specific branch.
       * @public
       */
      )
    }, {
      key: "redeployProduction",
      value: (function () {
        var _redeployProduction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {
          var locales,
            version,
            dependencies,
            _args28 = arguments;
          return _regeneratorRuntime().wrap(function _callee28$(_context28) {
            while (1) switch (_context28.prev = _context28.next) {
              case 0:
                locales = _args28.length > 0 && _args28[0] !== undefined ? _args28[0] : '*';
                if (!this.isReleased) {
                  _context28.next = 16;
                  break;
                }
                _context28.next = 4;
                return checkoutTarget(this.repo, this.branch, false);
              case 4:
                _context28.next = 6;
                return getRepoVersion(this.repo);
              case 6:
                version = _context28.sent;
                _context28.next = 9;
                return getDependencies(this.repo);
              case 9:
                dependencies = _context28.sent;
                _context28.next = 12;
                return checkoutMain(this.repo, false);
              case 12:
                _context28.next = 14;
                return buildServerRequest(this.repo, version, this.branch, dependencies, {
                  locales: locales,
                  brands: this.brands,
                  servers: ['production']
                });
              case 14:
                _context28.next = 17;
                break;
              case 16:
                throw new Error('Should not redeploy a non-released branch');
              case 17:
              case "end":
                return _context28.stop();
            }
          }, _callee28, this);
        }));
        function redeployProduction() {
          return _redeployProduction.apply(this, arguments);
        }
        return redeployProduction;
      }()
      /**
       * Gets a list of ReleaseBranches which would be potential candidates for a maintenance release. This includes:
       * - All published phet brand release branches (from metadata)
       * - All published phet-io brand release branches (from metadata)
       * - All unpublished local release branches
       *
       * @public
       * @returns {Promise.<ReleaseBranch[]>}
       * @rejects {ExecuteError}
       */
      )
    }], [{
      key: "deserialize",
      value: function deserialize(_ref4) {
        var repo = _ref4.repo,
          branch = _ref4.branch,
          brands = _ref4.brands,
          isReleased = _ref4.isReleased;
        return new ReleaseBranch(repo, branch, brands, isReleased);
      }
    }, {
      key: "getCheckoutDirectory",
      value: function getCheckoutDirectory(repo, branch) {
        return "".concat(MAINTENANCE_DIRECTORY, "/").concat(repo, "-").concat(branch);
      }

      /**
       * Returns the maintenance directory, for things that want to use it directly.
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "getMaintenanceDirectory",
      value: function getMaintenanceDirectory() {
        return MAINTENANCE_DIRECTORY;
      }
    }, {
      key: "getAllMaintenanceBranches",
      value: (function () {
        var _getAllMaintenanceBranches = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29() {
          var simMetadataResult, phetBranches, phetioBranches, unreleasedBranches, _iterator2, _step2, _loop, allReleaseBranches;
          return _regeneratorRuntime().wrap(function _callee29$(_context31) {
            while (1) switch (_context31.prev = _context31.next) {
              case 0:
                winston.debug('retrieving available sim branches');
                console.log('loading phet brand ReleaseBranches');
                _context31.next = 4;
                return simMetadata({
                  type: 'html'
                });
              case 4:
                simMetadataResult = _context31.sent;
                // Released phet branches
                phetBranches = simMetadataResult.projects.map(function (simData) {
                  var repo = simData.name.slice(simData.name.indexOf('/') + 1);
                  var branch = "".concat(simData.version.major, ".").concat(simData.version.minor);
                  return new ReleaseBranch(repo, branch, ['phet'], true);
                });
                console.log('loading phet-io brand ReleaseBranches');
                _context31.next = 9;
                return simPhetioMetadata({
                  active: true,
                  latest: true
                });
              case 9:
                phetioBranches = _context31.sent.filter(function (simData) {
                  return simData.active && simData.latest;
                }).map(function (simData) {
                  var branch = "".concat(simData.versionMajor, ".").concat(simData.versionMinor);
                  if (simData.versionSuffix.length) {
                    branch += "-".concat(simData.versionSuffix); // additional dash required
                  }
                  return new ReleaseBranch(simData.name, branch, ['phet-io'], true);
                });
                console.log('loading unreleased ReleaseBranches');
                unreleasedBranches = [];
                _iterator2 = _createForOfIteratorHelper(getActiveSims());
                _context31.prev = 13;
                _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                  var repo, branches, releasedBranches, _iterator3, _step3, _loop2;
                  return _regeneratorRuntime().wrap(function _loop$(_context30) {
                    while (1) switch (_context30.prev = _context30.next) {
                      case 0:
                        repo = _step2.value;
                        if (!JSON.parse(fs.readFileSync("../".concat(repo, "/package.json"), 'utf8')).phet.ignoreForAutomatedMaintenanceReleases) {
                          _context30.next = 3;
                          break;
                        }
                        return _context30.abrupt("return", 1);
                      case 3:
                        _context30.next = 5;
                        return getBranches(repo);
                      case 5:
                        branches = _context30.sent;
                        releasedBranches = phetBranches.concat(phetioBranches);
                        _iterator3 = _createForOfIteratorHelper(branches);
                        _context30.prev = 8;
                        _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2() {
                          var branch, match, major, minor, projectMetadata, productionVersion, packageObject, includesPhetio, brands;
                          return _regeneratorRuntime().wrap(function _loop2$(_context29) {
                            while (1) switch (_context29.prev = _context29.next) {
                              case 0:
                                branch = _step3.value;
                                if (!releasedBranches.filter(function (releaseBranch) {
                                  return releaseBranch.repo === repo && releaseBranch.branch === branch;
                                }).length) {
                                  _context29.next = 3;
                                  break;
                                }
                                return _context29.abrupt("return", 1);
                              case 3:
                                match = branch.match(/^(\d+)\.(\d+)$/);
                                if (!match) {
                                  _context29.next = 18;
                                  break;
                                }
                                major = Number(match[1]);
                                minor = Number(match[2]); // Assumption that there is no phet-io brand sim that isn't also released with phet brand
                                projectMetadata = simMetadataResult.projects.find(function (project) {
                                  return project.name === "html/".concat(repo);
                                }) || null;
                                productionVersion = projectMetadata ? projectMetadata.version : null;
                                if (!(!productionVersion || major > productionVersion.major || major === productionVersion.major && minor > productionVersion.minor)) {
                                  _context29.next = 18;
                                  break;
                                }
                                _context29.t0 = JSON;
                                _context29.next = 13;
                                return getFileAtBranch(repo, branch, 'package.json');
                              case 13:
                                _context29.t1 = _context29.sent;
                                packageObject = _context29.t0.parse.call(_context29.t0, _context29.t1);
                                includesPhetio = packageObject.phet && packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io');
                                brands = ['phet'].concat(_toConsumableArray(includesPhetio ? ['phet-io'] : []));
                                if (!packageObject.phet.ignoreForAutomatedMaintenanceReleases) {
                                  unreleasedBranches.push(new ReleaseBranch(repo, branch, brands, false));
                                }
                              case 18:
                              case "end":
                                return _context29.stop();
                            }
                          }, _loop2);
                        });
                        _iterator3.s();
                      case 11:
                        if ((_step3 = _iterator3.n()).done) {
                          _context30.next = 17;
                          break;
                        }
                        return _context30.delegateYield(_loop2(), "t0", 13);
                      case 13:
                        if (!_context30.t0) {
                          _context30.next = 15;
                          break;
                        }
                        return _context30.abrupt("continue", 15);
                      case 15:
                        _context30.next = 11;
                        break;
                      case 17:
                        _context30.next = 22;
                        break;
                      case 19:
                        _context30.prev = 19;
                        _context30.t1 = _context30["catch"](8);
                        _iterator3.e(_context30.t1);
                      case 22:
                        _context30.prev = 22;
                        _iterator3.f();
                        return _context30.finish(22);
                      case 25:
                      case "end":
                        return _context30.stop();
                    }
                  }, _loop, null, [[8, 19, 22, 25]]);
                });
                _iterator2.s();
              case 16:
                if ((_step2 = _iterator2.n()).done) {
                  _context31.next = 22;
                  break;
                }
                return _context31.delegateYield(_loop(), "t0", 18);
              case 18:
                if (!_context31.t0) {
                  _context31.next = 20;
                  break;
                }
                return _context31.abrupt("continue", 20);
              case 20:
                _context31.next = 16;
                break;
              case 22:
                _context31.next = 27;
                break;
              case 24:
                _context31.prev = 24;
                _context31.t1 = _context31["catch"](13);
                _iterator2.e(_context31.t1);
              case 27:
                _context31.prev = 27;
                _iterator2.f();
                return _context31.finish(27);
              case 30:
                allReleaseBranches = ReleaseBranch.combineLists([].concat(_toConsumableArray(phetBranches), _toConsumableArray(phetioBranches), unreleasedBranches)); // FAMB 2.3-phetio keeps ending up in the MR list when we don't want it to, see https://github.com/phetsims/phet-io/issues/1957.
                return _context31.abrupt("return", allReleaseBranches.filter(function (rb) {
                  return !(rb.repo === 'forces-and-motion-basics' && rb.branch === '2.3-phetio');
                }));
              case 32:
              case "end":
                return _context31.stop();
            }
          }, _callee29, null, [[13, 24, 27, 30]]);
        }));
        function getAllMaintenanceBranches() {
          return _getAllMaintenanceBranches.apply(this, arguments);
        }
        return getAllMaintenanceBranches;
      }()
      /**
       * Combines multiple matching ReleaseBranches into one where appropriate, and sorts. For example, two ReleaseBranches
       * of the same repo but for different brands are combined into a single ReleaseBranch with multiple brands.
       * @public
       *
       * @param {Array.<ReleaseBranch>} simBranches
       * @returns {Array.<ReleaseBranch>}
       */
      )
    }, {
      key: "combineLists",
      value: function combineLists(simBranches) {
        var resultBranches = [];
        var _iterator4 = _createForOfIteratorHelper(simBranches),
          _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var simBranch = _step4.value;
            var foundBranch = false;
            var _iterator5 = _createForOfIteratorHelper(resultBranches),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var resultBranch = _step5.value;
                if (simBranch.repo === resultBranch.repo && simBranch.branch === resultBranch.branch) {
                  foundBranch = true;
                  resultBranch.brands = [].concat(_toConsumableArray(resultBranch.brands), _toConsumableArray(simBranch.brands));
                  break;
                }
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            if (!foundBranch) {
              resultBranches.push(simBranch);
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
        resultBranches.sort(function (a, b) {
          if (a.repo !== b.repo) {
            return a.repo < b.repo ? -1 : 1;
          }
          if (a.branch !== b.branch) {
            return a.branch < b.branch ? -1 : 1;
          }
          return 0;
        });
        return resultBranches;
      }
    }]);
  }();
  return ReleaseBranch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVnZW5lcmF0b3JSdW50aW1lIiwiZSIsInQiLCJyIiwiT2JqZWN0IiwicHJvdG90eXBlIiwibiIsImhhc093blByb3BlcnR5IiwibyIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJpIiwiU3ltYm9sIiwiYSIsIml0ZXJhdG9yIiwiYyIsImFzeW5jSXRlcmF0b3IiLCJ1IiwidG9TdHJpbmdUYWciLCJkZWZpbmUiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ3cmFwIiwiR2VuZXJhdG9yIiwiY3JlYXRlIiwiQ29udGV4dCIsIm1ha2VJbnZva2VNZXRob2QiLCJ0cnlDYXRjaCIsInR5cGUiLCJhcmciLCJjYWxsIiwiaCIsImwiLCJmIiwicyIsInkiLCJHZW5lcmF0b3JGdW5jdGlvbiIsIkdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlIiwicCIsImQiLCJnZXRQcm90b3R5cGVPZiIsInYiLCJ2YWx1ZXMiLCJnIiwiZGVmaW5lSXRlcmF0b3JNZXRob2RzIiwiZm9yRWFjaCIsIl9pbnZva2UiLCJBc3luY0l0ZXJhdG9yIiwiaW52b2tlIiwiX3R5cGVvZiIsInJlc29sdmUiLCJfX2F3YWl0IiwidGhlbiIsImNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnIiwiRXJyb3IiLCJkb25lIiwibWV0aG9kIiwiZGVsZWdhdGUiLCJtYXliZUludm9rZURlbGVnYXRlIiwic2VudCIsIl9zZW50IiwiZGlzcGF0Y2hFeGNlcHRpb24iLCJhYnJ1cHQiLCJUeXBlRXJyb3IiLCJyZXN1bHROYW1lIiwibmV4dCIsIm5leHRMb2MiLCJwdXNoVHJ5RW50cnkiLCJ0cnlMb2MiLCJjYXRjaExvYyIsImZpbmFsbHlMb2MiLCJhZnRlckxvYyIsInRyeUVudHJpZXMiLCJwdXNoIiwicmVzZXRUcnlFbnRyeSIsImNvbXBsZXRpb24iLCJyZXNldCIsImlzTmFOIiwibGVuZ3RoIiwiZGlzcGxheU5hbWUiLCJpc0dlbmVyYXRvckZ1bmN0aW9uIiwiY29uc3RydWN0b3IiLCJuYW1lIiwibWFyayIsInNldFByb3RvdHlwZU9mIiwiX19wcm90b19fIiwiYXdyYXAiLCJhc3luYyIsIlByb21pc2UiLCJrZXlzIiwicmV2ZXJzZSIsInBvcCIsInByZXYiLCJjaGFyQXQiLCJzbGljZSIsInN0b3AiLCJydmFsIiwiaGFuZGxlIiwiY29tcGxldGUiLCJmaW5pc2giLCJfY2F0Y2giLCJkZWxlZ2F0ZVlpZWxkIiwiYXN5bmNHZW5lcmF0b3JTdGVwIiwiZ2VuIiwicmVqZWN0IiwiX25leHQiLCJfdGhyb3ciLCJrZXkiLCJpbmZvIiwiZXJyb3IiLCJfYXN5bmNUb0dlbmVyYXRvciIsImZuIiwic2VsZiIsImFyZ3MiLCJhcmd1bWVudHMiLCJhcHBseSIsImVyciIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiQ29uc3RydWN0b3IiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiZGVzY3JpcHRvciIsIl90b1Byb3BlcnR5S2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX3RvUHJpbWl0aXZlIiwidG9QcmltaXRpdmUiLCJTdHJpbmciLCJOdW1iZXIiLCJidWlsZExvY2FsIiwicmVxdWlyZSIsImJ1aWxkU2VydmVyUmVxdWVzdCIsIkNoaXBwZXJWZXJzaW9uIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJjcmVhdGVEaXJlY3RvcnkiLCJleGVjdXRlIiwiZ2V0QWN0aXZlU2ltcyIsImdldEJyYW5jaERlcGVuZGVuY2llcyIsImdldEJyYW5jaGVzIiwiZ2V0QnVpbGRBcmd1bWVudHMiLCJnZXREZXBlbmRlbmNpZXMiLCJnZXRCcmFuY2hNYXAiLCJnZXRCcmFuY2hWZXJzaW9uIiwiZ2V0RmlsZUF0QnJhbmNoIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRDaGVja291dCIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQiLCJnaXRJc0FuY2VzdG9yIiwiZ2l0UHVsbCIsImdpdFB1bGxEaXJlY3RvcnkiLCJnaXRSZXZQYXJzZSIsImdpdFRpbWVzdGFtcCIsImdydW50Q29tbWFuZCIsImxvYWRKU09OIiwibnBtVXBkYXRlRGlyZWN0b3J5IiwicHVwcGV0ZWVyTG9hZCIsInNpbU1ldGFkYXRhIiwic2ltUGhldGlvTWV0YWRhdGEiLCJ3aXRoU2VydmVyIiwiYXNzZXJ0IiwiZnMiLCJ3aW5zdG9uIiwiXyIsIm1vZHVsZSIsImV4cG9ydHMiLCJNQUlOVEVOQU5DRV9ESVJFQ1RPUlkiLCJSZWxlYXNlQnJhbmNoIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsImlzUmVsZWFzZWQiLCJBcnJheSIsImlzQXJyYXkiLCJzZXJpYWxpemUiLCJlcXVhbHMiLCJyZWxlYXNlQnJhbmNoIiwiam9pbiIsInRvU3RyaW5nIiwiY29uY2F0IiwiX2dldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgiLCJfY2FsbGVlIiwidXNlc0NoaXBwZXIyIiwiX2NhbGxlZSQiLCJfY29udGV4dCIsImdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgiLCJfZ2V0TG9jYWxQaGV0SU9CdWlsdEhUTUxQYXRoIiwiX2NhbGxlZTIiLCJfY2FsbGVlMiQiLCJfY29udGV4dDIiLCJnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgiLCJfZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwiX2NhbGxlZTMiLCJfY2FsbGVlMyQiLCJfY29udGV4dDMiLCJ1c2VzT2xkUGhldGlvU3RhbmRhbG9uZSIsInQwIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwiZ2V0Q2hpcHBlclZlcnNpb24iLCJjaGVja291dERpcmVjdG9yeSIsImdldENoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0RnJvbVBhY2thZ2VKU09OIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiX3VwZGF0ZUNoZWNrb3V0IiwiX2NhbGxlZTUiLCJfdGhpcyIsIm92ZXJyaWRlRGVwZW5kZW5jaWVzIiwiZGVwZW5kZW5jaWVzT25CcmFuY2hUaXAiLCJkZXBlbmRlbmN5UmVwb3MiLCJfYXJnczUiLCJfY2FsbGVlNSQiLCJfY29udGV4dDUiLCJleGlzdHNTeW5jIiwiYmFiZWwiLCJzaGEiLCJiYWJlbEJyYW5jaCIsInVuaXEiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJmaWx0ZXIiLCJhbGwiLCJtYXAiLCJfcmVmIiwiX2NhbGxlZTQiLCJyZXBvUHdkIiwiX2NhbGxlZTQkIiwiX2NvbnRleHQ0IiwiX3giLCJ1cGRhdGVDaGVja291dCIsIl9idWlsZCIsIl9jYWxsZWU2Iiwib3B0aW9ucyIsInJlcG9EaXJlY3RvcnkiLCJfY2FsbGVlNiQiLCJfY29udGV4dDYiLCJtZXJnZSIsImFsbEhUTUwiLCJkZWJ1Z0hUTUwiLCJsaW50IiwiYnVpbGQiLCJfeDIiLCJfdHJhbnNwaWxlIiwiX2NhbGxlZTciLCJfY2FsbGVlNyQiLCJfY29udGV4dDciLCJlcnJvcnMiLCJ0cmFuc3BpbGUiLCJfY2hlY2tVbmJ1aWx0IiwiX2NhbGxlZTkiLCJfdGhpczIiLCJfY2FsbGVlOSQiLCJfY29udGV4dDkiLCJfcmVmMiIsIl9jYWxsZWU4IiwicG9ydCIsInVybCIsIl9jYWxsZWU4JCIsIl9jb250ZXh0OCIsIndhaXRBZnRlckxvYWQiLCJfeDMiLCJwYXRoIiwiY2hlY2tVbmJ1aWx0IiwiX2NoZWNrQnVpbHQiLCJfY2FsbGVlMTEiLCJfdGhpczMiLCJfY2FsbGVlMTEkIiwiX2NvbnRleHQxMSIsIl9yZWYzIiwiX2NhbGxlZTEwIiwiX2NhbGxlZTEwJCIsIl9jb250ZXh0MTAiLCJfeDQiLCJjaGVja0J1aWx0IiwiX2NoZWNrb3V0IiwiX2NhbGxlZTEyIiwiaW5jbHVkZU5wbVVwZGF0ZSIsIl9jYWxsZWUxMiQiLCJfY29udGV4dDEyIiwiY2hlY2tvdXQiLCJfeDUiLCJfaW5jbHVkZXNTSEEiLCJfY2FsbGVlMTMiLCJyZXN1bHQiLCJkZXBlbmRlbmNpZXMiLCJjdXJyZW50U0hBIiwiX2NhbGxlZTEzJCIsIl9jb250ZXh0MTMiLCJpbmNsdWRlc1NIQSIsIl94NiIsIl94NyIsIl9pc01pc3NpbmdTSEEiLCJfY2FsbGVlMTQiLCJfY2FsbGVlMTQkIiwiX2NvbnRleHQxNCIsImlzTWlzc2luZ1NIQSIsIl94OCIsIl94OSIsIl9nZXREaXZlcmdpbmdTSEEiLCJfY2FsbGVlMTUiLCJfY2FsbGVlMTUkIiwiX2NvbnRleHQxNSIsImdldERpdmVyZ2luZ1NIQSIsIl9nZXREaXZlcmdpbmdUaW1lc3RhbXAiLCJfY2FsbGVlMTYiLCJfY2FsbGVlMTYkIiwiX2NvbnRleHQxNiIsInQxIiwidDIiLCJnZXREaXZlcmdpbmdUaW1lc3RhbXAiLCJfZ2V0RGVwZW5kZW5jaWVzIiwiX2NhbGxlZTE3IiwiX2NhbGxlZTE3JCIsIl9jb250ZXh0MTciLCJfZ2V0U2ltVmVyc2lvbiIsIl9jYWxsZWUxOCIsIl9jYWxsZWUxOCQiLCJfY29udGV4dDE4IiwiZ2V0U2ltVmVyc2lvbiIsIl9nZXRTdGF0dXMiLCJfY2FsbGVlMTkiLCJfdGhpczQiLCJnZXRCcmFuY2hNYXBBc3luY0NhbGxiYWNrIiwicmVzdWx0cyIsImRlcGVuZGVuY3lOYW1lcyIsImN1cnJlbnRDb21taXQiLCJwcmV2aW91c0NvbW1pdCIsIl9pdGVyYXRvciIsIl9zdGVwIiwiZGVwZW5kZW5jeSIsInBvdGVudGlhbFJlbGVhc2VCcmFuY2giLCJicmFuY2hNYXAiLCJfYXJnczE5IiwiX2NhbGxlZTE5JCIsIl9jb250ZXh0MTkiLCJ0ZXN0VHlwZSIsIm1lc3NhZ2UiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsImluY2x1ZGVzIiwidDMiLCJnZXRTdGF0dXMiLCJfdXNlc0VTIiwiX2NhbGxlZTIwIiwiX2NhbGxlZTIwJCIsIl9jb250ZXh0MjAiLCJjaGlwcGVyIiwidXNlc0VTNiIsIl91c2VzSW5pdGlhbGl6ZUdsb2JhbHNRdWVyeVBhcmFtZXRlcnMiLCJfY2FsbGVlMjEiLCJfY2FsbGVlMjEkIiwiX2NvbnRleHQyMSIsInVzZXNJbml0aWFsaXplR2xvYmFsc1F1ZXJ5UGFyYW1ldGVycyIsIl91c2VzT2xkUGhldGlvU3RhbmRhbG9uZSIsIl9jYWxsZWUyMiIsIl9jYWxsZWUyMiQiLCJfY29udGV4dDIyIiwiX3VzZXNSZWxhdGl2ZVNpbVBhdGgiLCJfY2FsbGVlMjMiLCJfY2FsbGVlMjMkIiwiX2NvbnRleHQyMyIsInVzZXNSZWxhdGl2ZVNpbVBhdGgiLCJfdXNlc1BoZXRpb1N0dWRpbyIsIl9jYWxsZWUyNCIsIl9jYWxsZWUyNCQiLCJfY29udGV4dDI0IiwidXNlc1BoZXRpb1N0dWRpbyIsIl91c2VzUGhldGlvU3R1ZGlvSW5kZXgiLCJfY2FsbGVlMjUiLCJfY2FsbGVlMjUkIiwiX2NvbnRleHQyNSIsInVzZXNQaGV0aW9TdHVkaW9JbmRleCIsIl91c2VzQ2hpcHBlciIsIl9jYWxsZWUyNiIsImNoaXBwZXJWZXJzaW9uIiwiX2NhbGxlZTI2JCIsIl9jb250ZXh0MjYiLCJnZXRGcm9tUmVwb3NpdG9yeSIsIm1ham9yIiwibWlub3IiLCJfd2l0aEZpbGUiLCJfY2FsbGVlMjciLCJmaWxlIiwicHJlZGljYXRlIiwiY29udGVudHMiLCJfY2FsbGVlMjckIiwiX2NvbnRleHQyNyIsIndpdGhGaWxlIiwiX3gxMCIsIl94MTEiLCJfcmVkZXBsb3lQcm9kdWN0aW9uIiwiX2NhbGxlZTI4IiwibG9jYWxlcyIsInZlcnNpb24iLCJfYXJnczI4IiwiX2NhbGxlZTI4JCIsIl9jb250ZXh0MjgiLCJzZXJ2ZXJzIiwicmVkZXBsb3lQcm9kdWN0aW9uIiwiZGVzZXJpYWxpemUiLCJfcmVmNCIsImdldE1haW50ZW5hbmNlRGlyZWN0b3J5IiwiX2dldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMiLCJfY2FsbGVlMjkiLCJzaW1NZXRhZGF0YVJlc3VsdCIsInBoZXRCcmFuY2hlcyIsInBoZXRpb0JyYW5jaGVzIiwidW5yZWxlYXNlZEJyYW5jaGVzIiwiX2l0ZXJhdG9yMiIsIl9zdGVwMiIsIl9sb29wIiwiYWxsUmVsZWFzZUJyYW5jaGVzIiwiX2NhbGxlZTI5JCIsIl9jb250ZXh0MzEiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJwcm9qZWN0cyIsInNpbURhdGEiLCJpbmRleE9mIiwiYWN0aXZlIiwibGF0ZXN0IiwidmVyc2lvbk1ham9yIiwidmVyc2lvbk1pbm9yIiwidmVyc2lvblN1ZmZpeCIsImJyYW5jaGVzIiwicmVsZWFzZWRCcmFuY2hlcyIsIl9pdGVyYXRvcjMiLCJfc3RlcDMiLCJfbG9vcDIiLCJfbG9vcCQiLCJfY29udGV4dDMwIiwicGhldCIsImlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMiLCJtYXRjaCIsInByb2plY3RNZXRhZGF0YSIsInByb2R1Y3Rpb25WZXJzaW9uIiwicGFja2FnZU9iamVjdCIsImluY2x1ZGVzUGhldGlvIiwiX2xvb3AyJCIsIl9jb250ZXh0MjkiLCJmaW5kIiwicHJvamVjdCIsInN1cHBvcnRlZEJyYW5kcyIsImNvbWJpbmVMaXN0cyIsInJiIiwiZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcyIsInNpbUJyYW5jaGVzIiwicmVzdWx0QnJhbmNoZXMiLCJfaXRlcmF0b3I0IiwiX3N0ZXA0Iiwic2ltQnJhbmNoIiwiZm91bmRCcmFuY2giLCJfaXRlcmF0b3I1IiwiX3N0ZXA1IiwicmVzdWx0QnJhbmNoIiwic29ydCIsImIiXSwic291cmNlcyI6WyJSZWxlYXNlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgc2ltdWxhdGlvbiByZWxlYXNlIGJyYW5jaCBmb3IgZGVwbG95bWVudFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYnVpbGRMb2NhbCA9IHJlcXVpcmUoICcuL2J1aWxkTG9jYWwnICk7XHJcbmNvbnN0IGJ1aWxkU2VydmVyUmVxdWVzdCA9IHJlcXVpcmUoICcuL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcclxuY29uc3QgQ2hpcHBlclZlcnNpb24gPSByZXF1aXJlKCAnLi9DaGlwcGVyVmVyc2lvbicgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBjcmVhdGVEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jcmVhdGVEaXJlY3RvcnknICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBnZXRBY3RpdmVTaW1zID0gcmVxdWlyZSggJy4vZ2V0QWN0aXZlU2ltcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoRGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoRGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRCcmFuY2hlcyA9IHJlcXVpcmUoICcuL2dldEJyYW5jaGVzJyApO1xyXG5jb25zdCBnZXRCdWlsZEFyZ3VtZW50cyA9IHJlcXVpcmUoICcuL2dldEJ1aWxkQXJndW1lbnRzJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdldEJyYW5jaE1hcCA9IHJlcXVpcmUoICcuL2dldEJyYW5jaE1hcCcgKTtcclxuY29uc3QgZ2V0QnJhbmNoVmVyc2lvbiA9IHJlcXVpcmUoICcuL2dldEJyYW5jaFZlcnNpb24nICk7XHJcbmNvbnN0IGdldEZpbGVBdEJyYW5jaCA9IHJlcXVpcmUoICcuL2dldEZpbGVBdEJyYW5jaCcgKTtcclxuY29uc3QgZ2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi9nZXRSZXBvVmVyc2lvbicgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXREaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRGaXJzdERpdmVyZ2luZ0NvbW1pdCA9IHJlcXVpcmUoICcuL2dpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0FuY2VzdG9yID0gcmVxdWlyZSggJy4vZ2l0SXNBbmNlc3RvcicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRQdWxsRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBnaXRUaW1lc3RhbXAgPSByZXF1aXJlKCAnLi9naXRUaW1lc3RhbXAnICk7XHJcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuL2dydW50Q29tbWFuZCcgKTtcclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcclxuY29uc3QgbnBtVXBkYXRlRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vbnBtVXBkYXRlRGlyZWN0b3J5JyApO1xyXG5jb25zdCBwdXBwZXRlZXJMb2FkID0gcmVxdWlyZSggJy4vcHVwcGV0ZWVyTG9hZCcgKTtcclxuY29uc3Qgc2ltTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1NZXRhZGF0YScgKTtcclxuY29uc3Qgc2ltUGhldGlvTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1QaGV0aW9NZXRhZGF0YScgKTtcclxuY29uc3Qgd2l0aFNlcnZlciA9IHJlcXVpcmUoICcuL3dpdGhTZXJ2ZXInICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjb25zdCBNQUlOVEVOQU5DRV9ESVJFQ1RPUlkgPSAnLi4vcmVsZWFzZS1icmFuY2hlcyc7XHJcblxyXG4gIGNsYXNzIFJlbGVhc2VCcmFuY2gge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYnJhbmRzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUmVsZWFzZWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBicmFuY2ggPT09ICdzdHJpbmcnICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggYnJhbmRzICkgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgaXNSZWxlYXNlZCA9PT0gJ2Jvb2xlYW4nICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlcG87XHJcbiAgICAgIHRoaXMuYnJhbmNoID0gYnJhbmNoO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPHN0cmluZz59XHJcbiAgICAgIHRoaXMuYnJhbmRzID0gYnJhbmRzO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn1cclxuICAgICAgdGhpcy5pc1JlbGVhc2VkID0gaXNSZWxlYXNlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBvOiB0aGlzLnJlcG8sXHJcbiAgICAgICAgYnJhbmNoOiB0aGlzLmJyYW5jaCxcclxuICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgIGlzUmVsZWFzZWQ6IHRoaXMuaXNSZWxlYXNlZFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFJlbGVhc2VCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fVxyXG4gICAgICogQHJldHVybnMge1JlbGVhc2VCcmFuY2h9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyByZXBvLCBicmFuY2gsIGJyYW5kcywgaXNSZWxlYXNlZCB9ICkge1xyXG4gICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHR3byByZWxlYXNlIGJyYW5jaGVzIGNvbnRhaW4gaWRlbnRpY2FsIGluZm9ybWF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVsZWFzZUJyYW5jaH0gcmVsZWFzZUJyYW5jaFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVxdWFscyggcmVsZWFzZUJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVwbyA9PT0gcmVsZWFzZUJyYW5jaC5yZXBvICYmXHJcbiAgICAgICAgICAgICB0aGlzLmJyYW5jaCA9PT0gcmVsZWFzZUJyYW5jaC5icmFuY2ggJiZcclxuICAgICAgICAgICAgIHRoaXMuYnJhbmRzLmpvaW4oICcsJyApID09PSByZWxlYXNlQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKSAmJlxyXG4gICAgICAgICAgICAgdGhpcy5pc1JlbGVhc2VkID09PSByZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBpdCB0byBhIChkZWJ1Z2dhYmxlKSBzdHJpbmcgZm9ybS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucmVwb30gJHt0aGlzLmJyYW5jaH0gJHt0aGlzLmJyYW5kcy5qb2luKCAnLCcgKX0ke3RoaXMuaXNSZWxlYXNlZCA/ICcnIDogJyAodW5wdWJsaXNoZWQpJ31gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZXBvIHtzdHJpbmd9XHJcbiAgICAgKiBAcGFyYW0gYnJhbmNoIHtzdHJpbmd9XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHJlcG8sIGJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIGAke01BSU5URU5BTkNFX0RJUkVDVE9SWX0vJHtyZXBvfS0ke2JyYW5jaH1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWFpbnRlbmFuY2UgZGlyZWN0b3J5LCBmb3IgdGhpbmdzIHRoYXQgd2FudCB0byB1c2UgaXQgZGlyZWN0bHkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldE1haW50ZW5hbmNlRGlyZWN0b3J5KCkge1xyXG4gICAgICByZXR1cm4gTUFJTlRFTkFOQ0VfRElSRUNUT1JZO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCAocmVsYXRpdmUgdG8gdGhlIHJlcG8pIHRvIHRoZSBidWlsdCBwaGV0LWJyYW5kIEhUTUwgZmlsZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sYDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHBhdGggKHJlbGF0aXZlIHRvIHRoZSByZXBvKSB0byB0aGUgYnVpbHQgcGhldC1pby1icmFuZCBIVE1MIGZpbGVcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQtaW8vJyA6ICcnfSR7dGhpcy5yZXBvfSR7dXNlc0NoaXBwZXIyID8gJ19hbGxfcGhldC1pbycgOiAnX2VuLXBoZXRpbyd9Lmh0bWxgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcXVlcnkgcGFyYW1ldGVyIHRvIHVzZSBmb3IgYWN0aXZhdGluZyBwaGV0LWlvIHN0YW5kYWxvbmUgbW9kZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpIHtcclxuICAgICAgcmV0dXJuICggYXdhaXQgdGhpcy51c2VzT2xkUGhldGlvU3RhbmRhbG9uZSgpICkgPyAncGhldC1pby5zdGFuZGFsb25lJyA6ICdwaGV0aW9TdGFuZGFsb25lJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Q2hpcHBlclZlcnNpb259XHJcbiAgICAgKi9cclxuICAgIGdldENoaXBwZXJWZXJzaW9uKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIHJldHVybiBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUGFja2FnZUpTT04oXHJcbiAgICAgICAgSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vY2hpcHBlci9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVwZGF0ZUNoZWNrb3V0KCBvdmVycmlkZURlcGVuZGVuY2llcyA9IHt9ICkge1xyXG4gICAgICB3aW5zdG9uLmluZm8oIGB1cGRhdGluZyBjaGVja291dCBmb3IgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRElSRUNUT1JZICkgKSB7XHJcbiAgICAgICAgd2luc3Rvbi5pbmZvKCBgY3JlYXRpbmcgZGlyZWN0b3J5ICR7TUFJTlRFTkFOQ0VfRElSRUNUT1JZfWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIE1BSU5URU5BTkNFX0RJUkVDVE9SWSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBjaGVja291dERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIHdpbnN0b24uaW5mbyggYGNyZWF0aW5nIGRpcmVjdG9yeSAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIGNoZWNrb3V0RGlyZWN0b3J5ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggdGhpcy5yZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggdGhpcy5icmFuY2gsIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llc09uQnJhbmNoVGlwID0gYXdhaXQgbG9hZEpTT04oIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb30vZGVwZW5kZW5jaWVzLmpzb25gICk7XHJcblxyXG4gICAgICBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcC5iYWJlbCA9IHsgc2hhOiBidWlsZExvY2FsLmJhYmVsQnJhbmNoLCBicmFuY2g6IGJ1aWxkTG9jYWwuYmFiZWxCcmFuY2ggfTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lSZXBvcyA9IF8udW5pcSggW1xyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcCApLFxyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBvdmVycmlkZURlcGVuZGVuY2llcyApXHJcbiAgICAgIF0uZmlsdGVyKCByZXBvID0+IHJlcG8gIT09ICdjb21tZW50JyApICk7XHJcblxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCggZGVwZW5kZW5jeVJlcG9zLm1hcCggYXN5bmMgcmVwbyA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwb1B3ZCA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3JlcG99YDtcclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCByZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG5cclxuICAgICAgICBjb25zdCBzaGEgPSBvdmVycmlkZURlcGVuZGVuY2llc1sgcmVwbyBdID8gb3ZlcnJpZGVEZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGEgOiBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcFsgcmVwbyBdLnNoYTtcclxuICAgICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggc2hhLCByZXBvUHdkICk7XHJcblxyXG4gICAgICAgIC8vIFB1bGwgYmFiZWwsIHNpbmNlIHdlIGRvbid0IGdpdmUgaXQgYSBzcGVjaWZpYyBTSEEgKGp1c3QgYSBicmFuY2gpLFxyXG4gICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zMjZcclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdiYWJlbCcgKSB7XHJcbiAgICAgICAgICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCByZXBvUHdkICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdjaGlwcGVyJyB8fCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyB8fCByZXBvID09PSB0aGlzLnJlcG8gKSB7XHJcbiAgICAgICAgICB3aW5zdG9uLmluZm8oIGBucG0gJHtyZXBvfSBpbiAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBucG1VcGRhdGVEaXJlY3RvcnkoIHJlcG9Qd2QgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgLy8gUGVyZW5uaWFsIGNhbiBiZSBhIG5pY2UgbWFudWFsIGFkZGl0aW9uIGluIGVhY2ggZGlyLCBpbiBjYXNlIHlvdSBuZWVkIHRvIGdvIGluIGFuZCBydW4gY29tbWFuZHMgdG8gdGhlc2VcclxuICAgICAgLy8gYnJhbmNoZXMgbWFudWFsbHkgKGxpa2UgYnVpbGQgb3IgY2hlY2tvdXQgb3IgdXBkYXRlKS4gTm8gbmVlZCB0byBucG0gaW5zdGFsbCwgeW91IGNhbiBkbyB0aGF0IHlvdXJzZWxmIGlmIG5lZWRlZC5cclxuICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCAncGVyZW5uaWFsJywgY2hlY2tvdXREaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgZ2V0QnVpbGRBcmd1bWVudHNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgYnVpbGQoIG9wdGlvbnMgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICBjb25zdCBhcmdzID0gZ2V0QnVpbGRBcmd1bWVudHMoIHRoaXMuZ2V0Q2hpcHBlclZlcnNpb24oKSwgXy5tZXJnZSgge1xyXG4gICAgICAgIGJyYW5kczogdGhpcy5icmFuZHMsXHJcbiAgICAgICAgYWxsSFRNTDogdHJ1ZSxcclxuICAgICAgICBkZWJ1Z0hUTUw6IHRydWUsXHJcbiAgICAgICAgbGludDogZmFsc2VcclxuICAgICAgfSwgb3B0aW9ucyApICk7XHJcblxyXG4gICAgICB3aW5zdG9uLmluZm8oIGBidWlsZGluZyAke2NoZWNrb3V0RGlyZWN0b3J5fSB3aXRoIGdydW50ICR7YXJncy5qb2luKCAnICcgKX1gICk7XHJcbiAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgYXJncywgcmVwb0RpcmVjdG9yeSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBhc3luYyB0cmFuc3BpbGUoKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICB3aW5zdG9uLmluZm8oIGB0cmFuc3BpbGluZyAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgIC8vIFdlIG1pZ2h0IG5vdCBiZSBhYmxlIHRvIHJ1biB0aGlzIGNvbW1hbmQhXHJcbiAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnb3V0cHV0LWpzLXByb2plY3QnIF0sIHJlcG9EaXJlY3RvcnksIHtcclxuICAgICAgICBlcnJvcnM6ICdyZXNvbHZlJ1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nfG51bGw+fSAtIEVycm9yIHN0cmluZywgb3IgbnVsbCBpZiBubyBlcnJvclxyXG4gICAgICovXHJcbiAgICBhc3luYyBjaGVja1VuYnVpbHQoKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHdpdGhTZXJ2ZXIoIGFzeW5jIHBvcnQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS8ke3RoaXMucmVwb30vJHt0aGlzLnJlcG99X2VuLmh0bWw/YnJhbmQ9cGhldCZlYSZmdXp6TW91c2UmZnV6elRvdWNoYDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwsIHtcclxuICAgICAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwMFxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBGYWlsdXJlIGZvciAke3VybH06ICR7ZX1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIHBhdGg6IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICByZXR1cm4gYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjazogJHtlfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmd8bnVsbD59IC0gRXJyb3Igc3RyaW5nLCBvciBudWxsIGlmIG5vIGVycm9yXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNoZWNrQnVpbHQoKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgdXNlc0NoaXBwZXIyID0gYXdhaXQgdGhpcy51c2VzQ2hpcHBlcjIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHdpdGhTZXJ2ZXIoIGFzeW5jIHBvcnQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS8ke3RoaXMucmVwb30vYnVpbGQvJHt1c2VzQ2hpcHBlcjIgPyAncGhldC8nIDogJyd9JHt0aGlzLnJlcG99X2VuJHt1c2VzQ2hpcHBlcjIgPyAnX3BoZXQnIDogJyd9Lmh0bWw/ZnV6ek1vdXNlJmZ1enpUb3VjaGA7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMDBcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGVycm9yICkge1xyXG4gICAgICAgICAgICByZXR1cm4gYEZhaWx1cmUgZm9yICR7dXJsfTogJHtlcnJvcn1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIHBhdGg6IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICByZXR1cm4gYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjazogJHtlfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB0aGlzIHJlbGVhc2UgYnJhbmNoIG91dC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVOcG1VcGRhdGVcclxuICAgICAqL1xyXG4gICAgYXN5bmMgY2hlY2tvdXQoIGluY2x1ZGVOcG1VcGRhdGUgKSB7XHJcbiAgICAgIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoLCBpbmNsdWRlTnBtVXBkYXRlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoaXMgcmVsZWFzZSBicmFuY2ggaW5jbHVkZXMgdGhlIGdpdmVuIFNIQSBmb3IgdGhlIGdpdmVuIHJlcG8gZGVwZW5kZW5jeS4gV2lsbCBiZSBmYWxzZSBpZiBpdCBkb2Vzbid0XHJcbiAgICAgKiBkZXBlbmQgb24gdGhpcyByZXBvc2l0b3J5LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGluY2x1ZGVzU0hBKCByZXBvLCBzaGEgKSB7XHJcbiAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHJlcG8gXSApIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gZGVwZW5kZW5jaWVzWyByZXBvIF0uc2hhO1xyXG4gICAgICAgIHJlc3VsdCA9IHNoYSA9PT0gY3VycmVudFNIQSB8fCBhd2FpdCBnaXRJc0FuY2VzdG9yKCByZXBvLCBzaGEsIGN1cnJlbnRTSEEgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIHJlbGVhc2UgYnJhbmNoIGRvZXMgTk9UIGluY2x1ZGUgdGhlIGdpdmVuIFNIQSBmb3IgdGhlIGdpdmVuIHJlcG8gZGVwZW5kZW5jeS4gV2lsbCBiZSBmYWxzZSBpZiBpdCBkb2Vzbid0XHJcbiAgICAgKiBkZXBlbmQgb24gdGhpcyByZXBvc2l0b3J5LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGlzTWlzc2luZ1NIQSggcmVwbywgc2hhICkge1xyXG4gICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG5cclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyByZXBvIF0gKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNIQSA9IGRlcGVuZGVuY2llc1sgcmVwbyBdLnNoYTtcclxuICAgICAgICByZXN1bHQgPSBzaGEgIT09IGN1cnJlbnRTSEEgJiYgISggYXdhaXQgZ2l0SXNBbmNlc3RvciggcmVwbywgc2hhLCBjdXJyZW50U0hBICkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIFNIQSBhdCB3aGljaCB0aGlzIHJlbGVhc2UgYnJhbmNoJ3MgbWFpbiByZXBvc2l0b3J5IGRpdmVyZ2VkIGZyb20gbWFpbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0RGl2ZXJnaW5nU0hBKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBhd2FpdCBnaXRQdWxsKCB0aGlzLnJlcG8gKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2gsICdtYWluJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHRpbWVzdGFtcCBhdCB3aGljaCB0aGlzIHJlbGVhc2UgYnJhbmNoJ3MgbWFpbiByZXBvc2l0b3J5IGRpdmVyZ2VkIGZyb20gbWFpbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48bnVtYmVyPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0RGl2ZXJnaW5nVGltZXN0YW1wKCkge1xyXG4gICAgICByZXR1cm4gZ2l0VGltZXN0YW1wKCB0aGlzLnJlcG8sIGF3YWl0IHRoaXMuZ2V0RGl2ZXJnaW5nU0hBKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGRlcGVuZGVuY2llcy5qc29uIGZvciB0aGlzIHJlbGVhc2UgYnJhbmNoXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERlcGVuZGVuY2llcygpIHtcclxuICAgICAgcmV0dXJuIGdldEJyYW5jaERlcGVuZGVuY2llcyggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgU2ltVmVyc2lvbiBmb3IgdGhpcyByZWxlYXNlIGJyYW5jaFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFNpbVZlcnNpb24+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTaW1WZXJzaW9uKCkge1xyXG4gICAgICByZXR1cm4gZ2V0QnJhbmNoVmVyc2lvbiggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2Ygc3RhdHVzIG1lc3NhZ2VzIG9mIGFueXRoaW5nIG91dC1vZi10aGUtb3JkaW5hcnlcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPHN0cmluZz4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRTdGF0dXMoIGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2sgPSBnZXRCcmFuY2hNYXAgKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IHRoaXMuZ2V0RGVwZW5kZW5jaWVzKCk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lOYW1lcyA9IE9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMgKS5maWx0ZXIoIGtleSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGtleSAhPT0gJ2NvbW1lbnQnICYmIGtleSAhPT0gdGhpcy5yZXBvICYmIGtleSAhPT0gJ3BoZXQtaW8td3JhcHBlci1zb25pZmljYXRpb24nO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBDaGVjayBvdXIgb3duIGRlcGVuZGVuY3lcclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdICkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBjdXJyZW50Q29tbWl0ID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgICAgIGNvbnN0IHByZXZpb3VzQ29tbWl0ID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHRoaXMucmVwbywgYCR7Y3VycmVudENvbW1pdH1eYCApO1xyXG4gICAgICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdLnNoYSAhPT0gcHJldmlvdXNDb21taXQgKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggJ1tJTkZPXSBQb3RlbnRpYWwgY2hhbmdlcyAoZGVwZW5kZW5jeSBpcyBub3QgcHJldmlvdXMgY29tbWl0KScgKTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW0lORk9dICR7Y3VycmVudENvbW1pdH0gJHtwcmV2aW91c0NvbW1pdH0gJHtkZXBlbmRlbmNpZXNbIHRoaXMucmVwbyBdLnNoYX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoICggYXdhaXQgdGhpcy5nZXRTaW1WZXJzaW9uKCkgKS50ZXN0VHlwZSA9PT0gJ3JjJyAmJiB0aGlzLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggJ1tJTkZPXSBSZWxlYXNlIGNhbmRpZGF0ZSB2ZXJzaW9uIGRldGVjdGVkIChzZWUgaWYgdGhlcmUgaXMgYSBRQSBpc3N1ZSknICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW0VSUk9SXSBGYWlsdXJlIHRvIGNoZWNrIGN1cnJlbnQvcHJldmlvdXMgY29tbWl0OiAke2UubWVzc2FnZX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaCggJ1tXQVJOSU5HXSBPd24gcmVwb3NpdG9yeSBub3QgaW5jbHVkZWQgaW4gZGVwZW5kZW5jaWVzJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBkZXBlbmRlbmN5IG9mIGRlcGVuZGVuY3lOYW1lcyApIHtcclxuICAgICAgICBjb25zdCBwb3RlbnRpYWxSZWxlYXNlQnJhbmNoID0gYCR7dGhpcy5yZXBvfS0ke3RoaXMuYnJhbmNofWA7XHJcbiAgICAgICAgY29uc3QgYnJhbmNoTWFwID0gYXdhaXQgZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayggZGVwZW5kZW5jeSApO1xyXG5cclxuICAgICAgICBpZiAoIE9iamVjdC5rZXlzKCBicmFuY2hNYXAgKS5pbmNsdWRlcyggcG90ZW50aWFsUmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgaWYgKCBkZXBlbmRlbmNpZXNbIGRlcGVuZGVuY3kgXS5zaGEgIT09IGJyYW5jaE1hcFsgcG90ZW50aWFsUmVsZWFzZUJyYW5jaCBdICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goIGBbV0FSTklOR10gRGVwZW5kZW5jeSBtaXNtYXRjaCBmb3IgJHtkZXBlbmRlbmN5fSBvbiBicmFuY2ggJHtwb3RlbnRpYWxSZWxlYXNlQnJhbmNofWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBzaW0gaXMgY29tcGF0aWJsZSB3aXRoIEVTNiBmZWF0dXJlc1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzRVM2KCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzgwYjRhZDYyY2Q4ZjIwNTdiODQ0ZjE4ZDNjMDBjZjVjMGM4OWVkOGQnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGlzIHNpbSB1c2VzIGluaXRpYWxpemUtZ2xvYmFscyBiYXNlZCBxdWVyeSBwYXJhbWV0ZXJzXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogSWYgdHJ1ZTpcclxuICAgICAqICAgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5XSEFURVZFUlxyXG4gICAgICogICBBTkQgaXQgbmVlZHMgdG8gYmUgaW4gdGhlIHNjaGVtYVxyXG4gICAgICpcclxuICAgICAqIElmIGZhbHNlOlxyXG4gICAgICogICBwaGV0LmNoaXBwZXIuZ2V0UXVlcnlQYXJhbWV0ZXIoICdXSEFURVZFUicgKVxyXG4gICAgICogICBGTEFHUyBzaG91bGQgdXNlICEhcGhldC5jaGlwcGVyLmdldFF1ZXJ5UGFyYW1ldGVyKCAnV0hBVEVWRVInIClcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc0luaXRpYWxpemVHbG9iYWxzUXVlcnlQYXJhbWV0ZXJzKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJ2U0NTRmODhmZjUxZDFlM2ZhYmRiM2EwNzZkNzQwN2EyYTllOTEzM2MnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvLnN0YW5kYWxvbmUgaXMgdGhlIGNvcnJlY3QgcGhldC1pbyBxdWVyeSBwYXJhbWV0ZXIgKG90aGVyd2lzZSBpdCdzIHRoZSBuZXdlclxyXG4gICAgICogcGhldGlvU3RhbmRhbG9uZSkuXHJcbiAgICAgKiBMb29rcyBmb3IgdGhlIHByZXNlbmNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2NvbW1pdC80ODE0ZDY5NjZjNTRmMjUwYjFjMGYzOTA5YjcxZjJiOWNmY2M3NjY1LlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc09sZFBoZXRpb1N0YW5kYWxvbmUoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcbiAgICAgIGNvbnN0IHNoYSA9IGRlcGVuZGVuY2llcy5jaGlwcGVyLnNoYTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gISggYXdhaXQgZ2l0SXNBbmNlc3RvciggJ2NoaXBwZXInLCAnNDgxNGQ2OTY2YzU0ZjI1MGIxYzBmMzkwOWI3MWYyYjljZmNjNzY2NScsIHNoYSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHJlbGF0aXZlU2ltUGF0aCBxdWVyeSBwYXJhbWV0ZXIgaXMgdXNlZCBmb3Igd3JhcHBlcnMgKGluc3RlYWQgb2YgbGF1bmNoTG9jYWxWZXJzaW9uKS5cclxuICAgICAqIExvb2tzIGZvciB0aGUgcHJlc2VuY2Ugb2YgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vY29tbWl0L2UzZmMyNjA3OTM1OGQ4NjA3NDM1OGE2ZGIzZWJhZjFhZjk3MjU2MzJcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNSZWxhdGl2ZVNpbVBhdGgoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBpZiAoICFkZXBlbmRlbmNpZXNbICdwaGV0LWlvJyBdICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBEb2Vzbid0IHJlYWxseSBtYXR0ZXIgbm93LCBkb2VzIGl0P1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXNbICdwaGV0LWlvJyBdLnNoYTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gZ2l0SXNBbmNlc3RvciggJ3BoZXQtaW8nLCAnZTNmYzI2MDc5MzU4ZDg2MDc0MzU4YTZkYjNlYmFmMWFmOTcyNTYzMicsIHNoYSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHBoZXQtaW8gU3R1ZGlvIGlzIGJlaW5nIHVzZWQgaW5zdGVhZCBvZiBkZXByZWNhdGVkIGluc3RhbmNlIHByb3hpZXMgd3JhcHBlci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNQaGV0aW9TdHVkaW8oKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzczNzVmNmE1N2I1ODc0YjZiYmY5N2E1NGM5YTkwOGYxOWY4OGQzOGYnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvIFN0dWRpbyB0b3AtbGV2ZWwgKGluZGV4Lmh0bWwpIGlzIHVzZWQgaW5zdGVhZCBvZiBzdHVkaW8uaHRtbC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNQaGV0aW9TdHVkaW9JbmRleCgpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBkZXBlbmRlbmNpZXNbICdwaGV0LWlvLXdyYXBwZXJzJyBdO1xyXG4gICAgICBpZiAoICFkZXBlbmRlbmN5ICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jeS5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdwaGV0LWlvLXdyYXBwZXJzJywgJzdlYzFhMDRhNzBmYjk3MDdiMzgxYjhiY2FiM2FkMDcwODE1ZWY3ZmUnLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBhbiBhZGRpdGlvbmFsIGZvbGRlciBleGlzdHMgaW4gdGhlIGJ1aWxkIGRpcmVjdG9yeSBvZiB0aGUgc2ltIGJhc2VkIG9uIHRoZSBicmFuZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNDaGlwcGVyMigpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoICdjaGlwcGVyJywgZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhICk7XHJcblxyXG4gICAgICBjb25zdCBjaGlwcGVyVmVyc2lvbiA9IENoaXBwZXJWZXJzaW9uLmdldEZyb21SZXBvc2l0b3J5KCk7XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBjaGlwcGVyVmVyc2lvbi5tYWpvciAhPT0gMCB8fCBjaGlwcGVyVmVyc2lvbi5taW5vciAhPT0gMDtcclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggJ2NoaXBwZXInLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSdW5zIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGNvbnRlbnRzIG9mIGEgc3BlY2lmaWMgZmlsZSdzIGNvbnRlbnRzIGluIHRoZSByZWxlYXNlIGJyYW5jaCAod2l0aCBmYWxzZSBpZlxyXG4gICAgICogaXQgZG9lc24ndCBleGlzdCkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oY29udGVudHM6c3RyaW5nKTpib29sZWFufSBwcmVkaWNhdGVcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgd2l0aEZpbGUoIGZpbGUsIHByZWRpY2F0ZSApIHtcclxuICAgICAgYXdhaXQgdGhpcy5jaGVja291dCggZmFsc2UgKTtcclxuXHJcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggZmlsZSApICkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBmaWxlLCAndXRmLTgnICk7XHJcbiAgICAgICAgcmV0dXJuIHByZWRpY2F0ZSggY29udGVudHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmUtcnVucyBhIHByb2R1Y3Rpb24gZGVwbG95IGZvciBhIHNwZWNpZmljIGJyYW5jaC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgcmVkZXBsb3lQcm9kdWN0aW9uKCBsb2NhbGVzID0gJyonICkge1xyXG4gICAgICBpZiAoIHRoaXMuaXNSZWxlYXNlZCApIHtcclxuICAgICAgICBhd2FpdCBjaGVja291dFRhcmdldCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCwgZmFsc2UgKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IGdldFJlcG9WZXJzaW9uKCB0aGlzLnJlcG8gKTtcclxuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgICBhd2FpdCBjaGVja291dE1haW4oIHRoaXMucmVwbywgZmFsc2UgKTtcclxuXHJcbiAgICAgICAgYXdhaXQgYnVpbGRTZXJ2ZXJSZXF1ZXN0KCB0aGlzLnJlcG8sIHZlcnNpb24sIHRoaXMuYnJhbmNoLCBkZXBlbmRlbmNpZXMsIHtcclxuICAgICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgICAgc2VydmVyczogWyAncHJvZHVjdGlvbicgXVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdTaG91bGQgbm90IHJlZGVwbG95IGEgbm9uLXJlbGVhc2VkIGJyYW5jaCcgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBhIGxpc3Qgb2YgUmVsZWFzZUJyYW5jaGVzIHdoaWNoIHdvdWxkIGJlIHBvdGVudGlhbCBjYW5kaWRhdGVzIGZvciBhIG1haW50ZW5hbmNlIHJlbGVhc2UuIFRoaXMgaW5jbHVkZXM6XHJcbiAgICAgKiAtIEFsbCBwdWJsaXNoZWQgcGhldCBicmFuZCByZWxlYXNlIGJyYW5jaGVzIChmcm9tIG1ldGFkYXRhKVxyXG4gICAgICogLSBBbGwgcHVibGlzaGVkIHBoZXQtaW8gYnJhbmQgcmVsZWFzZSBicmFuY2hlcyAoZnJvbSBtZXRhZGF0YSlcclxuICAgICAqIC0gQWxsIHVucHVibGlzaGVkIGxvY2FsIHJlbGVhc2UgYnJhbmNoZXNcclxuICAgICAqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48UmVsZWFzZUJyYW5jaFtdPn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzKCkge1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCAncmV0cmlldmluZyBhdmFpbGFibGUgc2ltIGJyYW5jaGVzJyApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdsb2FkaW5nIHBoZXQgYnJhbmQgUmVsZWFzZUJyYW5jaGVzJyApO1xyXG4gICAgICBjb25zdCBzaW1NZXRhZGF0YVJlc3VsdCA9IGF3YWl0IHNpbU1ldGFkYXRhKCB7XHJcbiAgICAgICAgdHlwZTogJ2h0bWwnXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIFJlbGVhc2VkIHBoZXQgYnJhbmNoZXNcclxuICAgICAgY29uc3QgcGhldEJyYW5jaGVzID0gc2ltTWV0YWRhdGFSZXN1bHQucHJvamVjdHMubWFwKCBzaW1EYXRhID0+IHtcclxuICAgICAgICBjb25zdCByZXBvID0gc2ltRGF0YS5uYW1lLnNsaWNlKCBzaW1EYXRhLm5hbWUuaW5kZXhPZiggJy8nICkgKyAxICk7XHJcbiAgICAgICAgY29uc3QgYnJhbmNoID0gYCR7c2ltRGF0YS52ZXJzaW9uLm1ham9yfS4ke3NpbURhdGEudmVyc2lvbi5taW5vcn1gO1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVsZWFzZUJyYW5jaCggcmVwbywgYnJhbmNoLCBbICdwaGV0JyBdLCB0cnVlICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyBwaGV0LWlvIGJyYW5kIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3QgcGhldGlvQnJhbmNoZXMgPSAoIGF3YWl0IHNpbVBoZXRpb01ldGFkYXRhKCB7XHJcbiAgICAgICAgYWN0aXZlOiB0cnVlLFxyXG4gICAgICAgIGxhdGVzdDogdHJ1ZVxyXG4gICAgICB9ICkgKS5maWx0ZXIoIHNpbURhdGEgPT4gc2ltRGF0YS5hY3RpdmUgJiYgc2ltRGF0YS5sYXRlc3QgKS5tYXAoIHNpbURhdGEgPT4ge1xyXG4gICAgICAgIGxldCBicmFuY2ggPSBgJHtzaW1EYXRhLnZlcnNpb25NYWpvcn0uJHtzaW1EYXRhLnZlcnNpb25NaW5vcn1gO1xyXG4gICAgICAgIGlmICggc2ltRGF0YS52ZXJzaW9uU3VmZml4Lmxlbmd0aCApIHtcclxuICAgICAgICAgIGJyYW5jaCArPSBgLSR7c2ltRGF0YS52ZXJzaW9uU3VmZml4fWA7IC8vIGFkZGl0aW9uYWwgZGFzaCByZXF1aXJlZFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHNpbURhdGEubmFtZSwgYnJhbmNoLCBbICdwaGV0LWlvJyBdLCB0cnVlICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyB1bnJlbGVhc2VkIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3QgdW5yZWxlYXNlZEJyYW5jaGVzID0gW107XHJcbiAgICAgIGZvciAoIGNvbnN0IHJlcG8gb2YgZ2V0QWN0aXZlU2ltcygpICkge1xyXG5cclxuICAgICAgICAvLyBFeGNsdWRlIGV4cGxpY2l0bHkgZXhjbHVkZWQgcmVwb3NcclxuICAgICAgICBpZiAoIEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCwgJ3V0ZjgnICkgKS5waGV0Lmlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMgKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGJyYW5jaGVzID0gYXdhaXQgZ2V0QnJhbmNoZXMoIHJlcG8gKTtcclxuICAgICAgICBjb25zdCByZWxlYXNlZEJyYW5jaGVzID0gcGhldEJyYW5jaGVzLmNvbmNhdCggcGhldGlvQnJhbmNoZXMgKTtcclxuXHJcbiAgICAgICAgZm9yICggY29uc3QgYnJhbmNoIG9mIGJyYW5jaGVzICkge1xyXG4gICAgICAgICAgLy8gV2UgYXJlbid0IHVucmVsZWFzZWQgaWYgd2UncmUgaW5jbHVkZWQgaW4gZWl0aGVyIHBoZXQgb3IgcGhldC1pbyBtZXRhZGF0YS5cclxuICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYmFsYW5jaW5nLWFjdC9pc3N1ZXMvMTE4XHJcbiAgICAgICAgICBpZiAoIHJlbGVhc2VkQnJhbmNoZXMuZmlsdGVyKCByZWxlYXNlQnJhbmNoID0+IHJlbGVhc2VCcmFuY2gucmVwbyA9PT0gcmVwbyAmJiByZWxlYXNlQnJhbmNoLmJyYW5jaCA9PT0gYnJhbmNoICkubGVuZ3RoICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGJyYW5jaC5tYXRjaCggL14oXFxkKylcXC4oXFxkKykkLyApO1xyXG5cclxuICAgICAgICAgIGlmICggbWF0Y2ggKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1ham9yID0gTnVtYmVyKCBtYXRjaFsgMSBdICk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1pbm9yID0gTnVtYmVyKCBtYXRjaFsgMiBdICk7XHJcblxyXG4gICAgICAgICAgICAvLyBBc3N1bXB0aW9uIHRoYXQgdGhlcmUgaXMgbm8gcGhldC1pbyBicmFuZCBzaW0gdGhhdCBpc24ndCBhbHNvIHJlbGVhc2VkIHdpdGggcGhldCBicmFuZFxyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0TWV0YWRhdGEgPSBzaW1NZXRhZGF0YVJlc3VsdC5wcm9qZWN0cy5maW5kKCBwcm9qZWN0ID0+IHByb2plY3QubmFtZSA9PT0gYGh0bWwvJHtyZXBvfWAgKSB8fCBudWxsO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9kdWN0aW9uVmVyc2lvbiA9IHByb2plY3RNZXRhZGF0YSA/IHByb2plY3RNZXRhZGF0YS52ZXJzaW9uIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICggIXByb2R1Y3Rpb25WZXJzaW9uIHx8XHJcbiAgICAgICAgICAgICAgICAgbWFqb3IgPiBwcm9kdWN0aW9uVmVyc2lvbi5tYWpvciB8fFxyXG4gICAgICAgICAgICAgICAgICggbWFqb3IgPT09IHByb2R1Y3Rpb25WZXJzaW9uLm1ham9yICYmIG1pbm9yID4gcHJvZHVjdGlvblZlcnNpb24ubWlub3IgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gRG8gYSBjaGVja291dCBzbyB3ZSBjYW4gZGV0ZXJtaW5lIHN1cHBvcnRlZCBicmFuZHNcclxuICAgICAgICAgICAgICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gSlNPTi5wYXJzZSggYXdhaXQgZ2V0RmlsZUF0QnJhbmNoKCByZXBvLCBicmFuY2gsICdwYWNrYWdlLmpzb24nICkgKTtcclxuICAgICAgICAgICAgICBjb25zdCBpbmNsdWRlc1BoZXRpbyA9IHBhY2thZ2VPYmplY3QucGhldCAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzICYmIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBicmFuZHMgPSBbXHJcbiAgICAgICAgICAgICAgICAncGhldCcsIC8vIEFzc3VtcHRpb24gdGhhdCB0aGVyZSBpcyBubyBwaGV0LWlvIGJyYW5kIHNpbSB0aGF0IGlzbid0IGFsc28gcmVsZWFzZWQgd2l0aCBwaGV0IGJyYW5kXHJcbiAgICAgICAgICAgICAgICAuLi4oIGluY2x1ZGVzUGhldGlvID8gWyAncGhldC1pbycgXSA6IFtdIClcclxuICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoICFwYWNrYWdlT2JqZWN0LnBoZXQuaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyApIHtcclxuICAgICAgICAgICAgICAgIHVucmVsZWFzZWRCcmFuY2hlcy5wdXNoKCBuZXcgUmVsZWFzZUJyYW5jaCggcmVwbywgYnJhbmNoLCBicmFuZHMsIGZhbHNlICkgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGFsbFJlbGVhc2VCcmFuY2hlcyA9IFJlbGVhc2VCcmFuY2guY29tYmluZUxpc3RzKCBbIC4uLnBoZXRCcmFuY2hlcywgLi4ucGhldGlvQnJhbmNoZXMsIC4uLnVucmVsZWFzZWRCcmFuY2hlcyBdICk7XHJcblxyXG4gICAgICAvLyBGQU1CIDIuMy1waGV0aW8ga2VlcHMgZW5kaW5nIHVwIGluIHRoZSBNUiBsaXN0IHdoZW4gd2UgZG9uJ3Qgd2FudCBpdCB0bywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xOTU3LlxyXG4gICAgICByZXR1cm4gYWxsUmVsZWFzZUJyYW5jaGVzLmZpbHRlciggcmIgPT4gISggcmIucmVwbyA9PT0gJ2ZvcmNlcy1hbmQtbW90aW9uLWJhc2ljcycgJiYgcmIuYnJhbmNoID09PSAnMi4zLXBoZXRpbycgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tYmluZXMgbXVsdGlwbGUgbWF0Y2hpbmcgUmVsZWFzZUJyYW5jaGVzIGludG8gb25lIHdoZXJlIGFwcHJvcHJpYXRlLCBhbmQgc29ydHMuIEZvciBleGFtcGxlLCB0d28gUmVsZWFzZUJyYW5jaGVzXHJcbiAgICAgKiBvZiB0aGUgc2FtZSByZXBvIGJ1dCBmb3IgZGlmZmVyZW50IGJyYW5kcyBhcmUgY29tYmluZWQgaW50byBhIHNpbmdsZSBSZWxlYXNlQnJhbmNoIHdpdGggbXVsdGlwbGUgYnJhbmRzLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBzaW1CcmFuY2hlc1xyXG4gICAgICogQHJldHVybnMge0FycmF5LjxSZWxlYXNlQnJhbmNoPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNvbWJpbmVMaXN0cyggc2ltQnJhbmNoZXMgKSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdEJyYW5jaGVzID0gW107XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBzaW1CcmFuY2ggb2Ygc2ltQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kQnJhbmNoID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICggY29uc3QgcmVzdWx0QnJhbmNoIG9mIHJlc3VsdEJyYW5jaGVzICkge1xyXG4gICAgICAgICAgaWYgKCBzaW1CcmFuY2gucmVwbyA9PT0gcmVzdWx0QnJhbmNoLnJlcG8gJiYgc2ltQnJhbmNoLmJyYW5jaCA9PT0gcmVzdWx0QnJhbmNoLmJyYW5jaCApIHtcclxuICAgICAgICAgICAgZm91bmRCcmFuY2ggPSB0cnVlO1xyXG4gICAgICAgICAgICByZXN1bHRCcmFuY2guYnJhbmRzID0gWyAuLi5yZXN1bHRCcmFuY2guYnJhbmRzLCAuLi5zaW1CcmFuY2guYnJhbmRzIF07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFmb3VuZEJyYW5jaCApIHtcclxuICAgICAgICAgIHJlc3VsdEJyYW5jaGVzLnB1c2goIHNpbUJyYW5jaCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmVzdWx0QnJhbmNoZXMuc29ydCggKCBhLCBiICkgPT4ge1xyXG4gICAgICAgIGlmICggYS5yZXBvICE9PSBiLnJlcG8gKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5yZXBvIDwgYi5yZXBvID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGEuYnJhbmNoICE9PSBiLmJyYW5jaCApIHtcclxuICAgICAgICAgIHJldHVybiBhLmJyYW5jaCA8IGIuYnJhbmNoID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdEJyYW5jaGVzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFJlbGVhc2VCcmFuY2g7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OzsrQ0FDQSxxSkFBQUEsbUJBQUEsWUFBQUEsb0JBQUEsV0FBQUMsQ0FBQSxTQUFBQyxDQUFBLEVBQUFELENBQUEsT0FBQUUsQ0FBQSxHQUFBQyxNQUFBLENBQUFDLFNBQUEsRUFBQUMsQ0FBQSxHQUFBSCxDQUFBLENBQUFJLGNBQUEsRUFBQUMsQ0FBQSxHQUFBSixNQUFBLENBQUFLLGNBQUEsY0FBQVAsQ0FBQSxFQUFBRCxDQUFBLEVBQUFFLENBQUEsSUFBQUQsQ0FBQSxDQUFBRCxDQUFBLElBQUFFLENBQUEsQ0FBQU8sS0FBQSxLQUFBQyxDQUFBLHdCQUFBQyxNQUFBLEdBQUFBLE1BQUEsT0FBQUMsQ0FBQSxHQUFBRixDQUFBLENBQUFHLFFBQUEsa0JBQUFDLENBQUEsR0FBQUosQ0FBQSxDQUFBSyxhQUFBLHVCQUFBQyxDQUFBLEdBQUFOLENBQUEsQ0FBQU8sV0FBQSw4QkFBQUMsT0FBQWpCLENBQUEsRUFBQUQsQ0FBQSxFQUFBRSxDQUFBLFdBQUFDLE1BQUEsQ0FBQUssY0FBQSxDQUFBUCxDQUFBLEVBQUFELENBQUEsSUFBQVMsS0FBQSxFQUFBUCxDQUFBLEVBQUFpQixVQUFBLE1BQUFDLFlBQUEsTUFBQUMsUUFBQSxTQUFBcEIsQ0FBQSxDQUFBRCxDQUFBLFdBQUFrQixNQUFBLG1CQUFBakIsQ0FB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