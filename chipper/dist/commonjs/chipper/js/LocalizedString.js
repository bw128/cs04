"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _TinyProperty = _interopRequireDefault(require("../../axon/js/TinyProperty.js"));
var _TinyOverrideProperty = _interopRequireDefault(require("../../axon/js/TinyOverrideProperty.js"));
var _localeOrderProperty = _interopRequireDefault(require("../../joist/js/i18n/localeOrderProperty.js"));
var _chipper = _interopRequireDefault(require("./chipper.js"));
var _getStringModule = require("./getStringModule.js");
var _arrayRemove = _interopRequireDefault(require("../../phet-core/js/arrayRemove.js"));
var _LocalizedStringProperty = _interopRequireDefault(require("./LocalizedStringProperty.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2022-2024, University of Colorado Boulder
/**
 * Sets up a system of Properties to handle translation fallback and phet-io support for a single translated string.
 *
 * @author Jonathan Olson <jonathan.olson>
 */
// constants
var FALLBACK_LOCALE = 'en';

// for readability/docs

// Where "string" is a phetioID
var LocalizedString = /*#__PURE__*/function () {
  function LocalizedString(public readonly stringKey, englishValue, tandem, metadata) {
    _classCallCheck(this, LocalizedString);
    // Public-facing IProperty<string>, used by string modules
    _defineProperty(this, "property", void 0);
    // Holds our non-Override Property at the root of everything
    _defineProperty(this, "englishProperty", void 0);
    // Uses lazy creation of locales
    _defineProperty(this, "localePropertyMap", new Map());
    _defineProperty(this, "localeOrderListener", void 0);
    // Store initial values, so we can handle state deltas
    _defineProperty(this, "initialValues", {});
    this.englishProperty = new _TinyProperty["default"](englishValue);
    this.initialValues[FALLBACK_LOCALE] = englishValue;
    this.localeOrderListener = this.onLocaleOrderChange.bind(this);
    _localeOrderProperty["default"].lazyLink(this.localeOrderListener);
    this.property = new _LocalizedStringProperty["default"](this, tandem, metadata);

    // Add to a global list to support PhET-iO serialization and internal testing
    _getStringModule.localizedStrings.push(this);
  }

  /**
   * Sets the initial value of a translated string (so that there will be no fallback for that locale/string combo)
   */
  return _createClass(LocalizedString, [{
    key: "setInitialValue",
    value: function setInitialValue(locale, value) {
      this.initialValues[locale] = value;
      this.getLocaleSpecificProperty(locale).value = value;
    }

    /**
     * Returns an object that shows the changes of strings from their initial values. This includes whether strings are
     * marked as "overridden"
     */
  }, {
    key: "getStateDelta",
    value: function getStateDelta() {
      var _this = this;
      var result = {};
      this.usedLocales.forEach(function (locale) {
        var rawString = _this.getRawStringValue(locale);
        if (rawString !== null && rawString !== _this.initialValues[locale]) {
          result[locale] = rawString;
        }
      });
      return result;
    }

    /**
     * Take a state from getStateDelta, and apply it.
     */
  }, {
    key: "setStateDelta",
    value: function setStateDelta(state) {
      var _this2 = this;
      // Create potential new locales (since locale-specific Properties are lazily created as needed
      Object.keys(state).forEach(function (locale) {
        return _this2.getLocaleSpecificProperty(locale);
      });
      this.usedLocales.forEach(function (locale) {
        var localeSpecificProperty = _this2.getLocaleSpecificProperty(locale);
        var initialValue = _this2.initialValues[locale] !== undefined ? _this2.initialValues[locale] : null;
        var stateValue = state[locale] !== undefined ? state[locale] : null;

        // If not specified in the state
        if (stateValue === null) {
          // If we have no initial value, we'll want to set it to fall back
          if (initialValue === null) {
            localeSpecificProperty.clearOverride();
          } else {
            localeSpecificProperty.value = initialValue;
          }
        } else {
          localeSpecificProperty.value = stateValue;
        }
      });
    }

    /**
     * Returns the specific translation for a locale (no fallbacks), or null if that string is not translated in the
     * exact locale
     */
  }, {
    key: "getRawStringValue",
    value: function getRawStringValue(locale) {
      var property = this.getLocaleSpecificProperty(locale);
      if (property instanceof _TinyOverrideProperty["default"]) {
        return property.isOverridden ? property.value : null;
      } else {
        // english
        return property.value;
      }
    }
  }, {
    key: "usedLocales",
    get: function get() {
      // NOTE: order matters, we want the fallback to be first so that in onLocaleOrderChange we don't run into infinite
      // loops.
      return [FALLBACK_LOCALE].concat(_toConsumableArray(this.localePropertyMap.keys()));
    }
  }, {
    key: "onLocaleOrderChange",
    value: function onLocaleOrderChange(localeOrder) {
      // Do this in reverse order to AVOID infinite loops.
      // For example, if localeOrder1=ar,es localeOrder2=es,ar) then we could run into the case temporarily where the
      // TinyOverrideProperty for ar has its target as es, and the TinyOverrideProperty for es has its target as ar.
      // This would then trigger an infinite loop if you try to read the value of either of them, as it would ping
      // back-and-forth.
      var locales = [].concat(_toConsumableArray(this.usedLocales), _toConsumableArray(localeOrder));
      for (var i = locales.length - 1; i >= 0; i--) {
        var locale = locales[i];
        var localeProperty = this.getLocaleSpecificProperty(locale);
        if (localeProperty instanceof _TinyOverrideProperty["default"]) {
          localeProperty.targetProperty = this.getLocaleSpecificProperty(LocalizedString.getFallbackLocale(locale));
        }
      }
    }

    /**
     * Returns the locale-specific Property for any locale (lazily creating it if necessary)
     */
  }, {
    key: "getLocaleSpecificProperty",
    value: function getLocaleSpecificProperty(locale) {
      if (locale === 'en') {
        return this.englishProperty;
      }

      // Lazy creation
      if (!this.localePropertyMap.has(locale)) {
        this.localePropertyMap.set(locale, new _TinyOverrideProperty["default"](this.getLocaleSpecificProperty(LocalizedString.getFallbackLocale(locale))));
      }
      return this.localePropertyMap.get(locale);
    }

    /**
     * What should be the next-most fallback locale for a given locale. Our global localeOrder is used, and otherwise it
     * defaults to our normal fallback mechanism.
     */
  }, {
    key: "dispose",
    value: function dispose() {
      _localeOrderProperty["default"].unlink(this.localeOrderListener);
      this.property.dispose();
      (0, _arrayRemove["default"])(_getStringModule.localizedStrings, this);
    }

    /**
     * Reset to the initial value for the specified locale, used for testing.
     */
  }, {
    key: "restoreInitialValue",
    value: function restoreInitialValue(locale) {
      assert && assert(typeof this.initialValues[locale] === 'string', 'initial value expected for', locale);
      this.property.value = this.initialValues[locale];
    }
  }], [{
    key: "getFallbackLocale",
    value: function getFallbackLocale(locale) {
      if (locale === 'en') {
        return 'en'; // can be its own fallback
      }
      var localeOrder = _localeOrderProperty["default"].value;
      var index = localeOrder.indexOf(locale);
      if (index >= 0) {
        assert && assert(localeOrder[localeOrder.length - 1] === 'en');
        assert && assert(index + 1 < localeOrder.length);
        return localeOrder[index + 1];
      } else {
        // doesn't exist in those
        if (locale.includes('_')) {
          return locale.slice(0, 2); // zh_CN => zh
        } else {
          return 'en';
        }
      }
    }
  }]);
}();
_chipper["default"].register('LocalizedString', LocalizedString);
var _default = exports["default"] = LocalizedString;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfVGlueVByb3BlcnR5IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfVGlueU92ZXJyaWRlUHJvcGVydHkiLCJfbG9jYWxlT3JkZXJQcm9wZXJ0eSIsIl9jaGlwcGVyIiwiX2dldFN0cmluZ01vZHVsZSIsIl9hcnJheVJlbW92ZSIsIl9Mb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJhcnIiLCJfYXJyYXlXaXRob3V0SG9sZXMiLCJfaXRlcmFibGVUb0FycmF5IiwiX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5IiwiX25vbkl0ZXJhYmxlU3ByZWFkIiwiVHlwZUVycm9yIiwibWluTGVuIiwiX2FycmF5TGlrZVRvQXJyYXkiLCJuIiwiT2JqZWN0IiwidG9TdHJpbmciLCJjYWxsIiwic2xpY2UiLCJuYW1lIiwiQXJyYXkiLCJmcm9tIiwidGVzdCIsIml0ZXIiLCJpc0FycmF5IiwibGVuIiwibGVuZ3RoIiwiaSIsImFycjIiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImRlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJkZWZpbmVQcm9wZXJ0eSIsIl90b1Byb3BlcnR5S2V5Iiwia2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX2RlZmluZVByb3BlcnR5IiwidmFsdWUiLCJ0IiwiX3RvUHJpbWl0aXZlIiwiciIsImUiLCJ0b1ByaW1pdGl2ZSIsIlN0cmluZyIsIk51bWJlciIsIkZBTExCQUNLX0xPQ0FMRSIsIkxvY2FsaXplZFN0cmluZyIsInN0cmluZ0tleSIsImVuZ2xpc2hWYWx1ZSIsInRhbmRlbSIsIm1ldGFkYXRhIiwiTWFwIiwiZW5nbGlzaFByb3BlcnR5IiwiVGlueVByb3BlcnR5IiwiaW5pdGlhbFZhbHVlcyIsImxvY2FsZU9yZGVyTGlzdGVuZXIiLCJvbkxvY2FsZU9yZGVyQ2hhbmdlIiwiYmluZCIsImxvY2FsZU9yZGVyUHJvcGVydHkiLCJsYXp5TGluayIsInByb3BlcnR5IiwiTG9jYWxpemVkU3RyaW5nUHJvcGVydHkiLCJsb2NhbGl6ZWRTdHJpbmdzIiwicHVzaCIsInNldEluaXRpYWxWYWx1ZSIsImxvY2FsZSIsImdldExvY2FsZVNwZWNpZmljUHJvcGVydHkiLCJnZXRTdGF0ZURlbHRhIiwiX3RoaXMiLCJyZXN1bHQiLCJ1c2VkTG9jYWxlcyIsImZvckVhY2giLCJyYXdTdHJpbmciLCJnZXRSYXdTdHJpbmdWYWx1ZSIsInNldFN0YXRlRGVsdGEiLCJzdGF0ZSIsIl90aGlzMiIsImtleXMiLCJsb2NhbGVTcGVjaWZpY1Byb3BlcnR5IiwiaW5pdGlhbFZhbHVlIiwidW5kZWZpbmVkIiwic3RhdGVWYWx1ZSIsImNsZWFyT3ZlcnJpZGUiLCJUaW55T3ZlcnJpZGVQcm9wZXJ0eSIsImlzT3ZlcnJpZGRlbiIsImdldCIsImNvbmNhdCIsImxvY2FsZVByb3BlcnR5TWFwIiwibG9jYWxlT3JkZXIiLCJsb2NhbGVzIiwibG9jYWxlUHJvcGVydHkiLCJ0YXJnZXRQcm9wZXJ0eSIsImdldEZhbGxiYWNrTG9jYWxlIiwiaGFzIiwic2V0IiwiZGlzcG9zZSIsInVubGluayIsImFycmF5UmVtb3ZlIiwicmVzdG9yZUluaXRpYWxWYWx1ZSIsImFzc2VydCIsImluZGV4IiwiaW5kZXhPZiIsImluY2x1ZGVzIiwiY2hpcHBlciIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiTG9jYWxpemVkU3RyaW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNldHMgdXAgYSBzeXN0ZW0gb2YgUHJvcGVydGllcyB0byBoYW5kbGUgdHJhbnNsYXRpb24gZmFsbGJhY2sgYW5kIHBoZXQtaW8gc3VwcG9ydCBmb3IgYSBzaW5nbGUgdHJhbnNsYXRlZCBzdHJpbmcuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uPlxyXG4gKi9cclxuXHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGlueU92ZXJyaWRlUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UaW55T3ZlcnJpZGVQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IExvY2FsZSB9IGZyb20gJy4uLy4uL2pvaXN0L2pzL2kxOG4vbG9jYWxlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgbG9jYWxlT3JkZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi9qb2lzdC9qcy9pMThuL2xvY2FsZU9yZGVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgY2hpcHBlciBmcm9tICcuL2NoaXBwZXIuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgbG9jYWxpemVkU3RyaW5ncyB9IGZyb20gJy4vZ2V0U3RyaW5nTW9kdWxlLmpzJztcclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb0lEIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbUNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBMb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eSBmcm9tICcuL0xvY2FsaXplZFN0cmluZ1Byb3BlcnR5LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBGQUxMQkFDS19MT0NBTEUgPSAnZW4nO1xyXG5cclxuLy8gZm9yIHJlYWRhYmlsaXR5L2RvY3NcclxudHlwZSBUcmFuc2xhdGlvblN0cmluZyA9IHN0cmluZztcclxuZXhwb3J0IHR5cGUgTG9jYWxpemVkU3RyaW5nU3RhdGVEZWx0YSA9IFBhcnRpYWw8UmVjb3JkPExvY2FsZSwgVHJhbnNsYXRpb25TdHJpbmc+PjtcclxuXHJcbi8vIFdoZXJlIFwic3RyaW5nXCIgaXMgYSBwaGV0aW9JRFxyXG5leHBvcnQgdHlwZSBTdHJpbmdzU3RhdGVTdGF0ZU9iamVjdCA9IHsgZGF0YTogUmVjb3JkPFBoZXRpb0lELCBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhPiB9O1xyXG5cclxuY2xhc3MgTG9jYWxpemVkU3RyaW5nIHtcclxuXHJcbiAgLy8gUHVibGljLWZhY2luZyBJUHJvcGVydHk8c3RyaW5nPiwgdXNlZCBieSBzdHJpbmcgbW9kdWxlc1xyXG4gIHB1YmxpYyByZWFkb25seSBwcm9wZXJ0eTogTG9jYWxpemVkU3RyaW5nUHJvcGVydHk7XHJcblxyXG4gIC8vIEhvbGRzIG91ciBub24tT3ZlcnJpZGUgUHJvcGVydHkgYXQgdGhlIHJvb3Qgb2YgZXZlcnl0aGluZ1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZW5nbGlzaFByb3BlcnR5OiBUaW55UHJvcGVydHk8VHJhbnNsYXRpb25TdHJpbmc+O1xyXG5cclxuICAvLyBVc2VzIGxhenkgY3JlYXRpb24gb2YgbG9jYWxlc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9jYWxlUHJvcGVydHlNYXAgPSBuZXcgTWFwPExvY2FsZSwgVGlueU92ZXJyaWRlUHJvcGVydHk8VHJhbnNsYXRpb25TdHJpbmc+PigpO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGxvY2FsZU9yZGVyTGlzdGVuZXI6ICggbG9jYWxlczogTG9jYWxlW10gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBTdG9yZSBpbml0aWFsIHZhbHVlcywgc28gd2UgY2FuIGhhbmRsZSBzdGF0ZSBkZWx0YXNcclxuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxWYWx1ZXM6IExvY2FsaXplZFN0cmluZ1N0YXRlRGVsdGEgPSB7fTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwdWJsaWMgcmVhZG9ubHkgc3RyaW5nS2V5OiBzdHJpbmcsIGVuZ2xpc2hWYWx1ZTogVHJhbnNsYXRpb25TdHJpbmcsIHRhbmRlbTogVGFuZGVtLCBtZXRhZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICkge1xyXG5cclxuICAgIHRoaXMuZW5nbGlzaFByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggZW5nbGlzaFZhbHVlICk7XHJcbiAgICB0aGlzLmluaXRpYWxWYWx1ZXNbIEZBTExCQUNLX0xPQ0FMRSBdID0gZW5nbGlzaFZhbHVlO1xyXG5cclxuICAgIHRoaXMubG9jYWxlT3JkZXJMaXN0ZW5lciA9IHRoaXMub25Mb2NhbGVPcmRlckNoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICBsb2NhbGVPcmRlclByb3BlcnR5LmxhenlMaW5rKCB0aGlzLmxvY2FsZU9yZGVyTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLnByb3BlcnR5ID0gbmV3IExvY2FsaXplZFN0cmluZ1Byb3BlcnR5KCB0aGlzLCB0YW5kZW0sIG1ldGFkYXRhICk7XHJcblxyXG4gICAgLy8gQWRkIHRvIGEgZ2xvYmFsIGxpc3QgdG8gc3VwcG9ydCBQaEVULWlPIHNlcmlhbGl6YXRpb24gYW5kIGludGVybmFsIHRlc3RpbmdcclxuICAgIGxvY2FsaXplZFN0cmluZ3MucHVzaCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaW5pdGlhbCB2YWx1ZSBvZiBhIHRyYW5zbGF0ZWQgc3RyaW5nIChzbyB0aGF0IHRoZXJlIHdpbGwgYmUgbm8gZmFsbGJhY2sgZm9yIHRoYXQgbG9jYWxlL3N0cmluZyBjb21ibylcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SW5pdGlhbFZhbHVlKCBsb2NhbGU6IExvY2FsZSwgdmFsdWU6IFRyYW5zbGF0aW9uU3RyaW5nICk6IHZvaWQge1xyXG4gICAgdGhpcy5pbml0aWFsVmFsdWVzWyBsb2NhbGUgXSA9IHZhbHVlO1xyXG4gICAgdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBsb2NhbGUgKS52YWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBzaG93cyB0aGUgY2hhbmdlcyBvZiBzdHJpbmdzIGZyb20gdGhlaXIgaW5pdGlhbCB2YWx1ZXMuIFRoaXMgaW5jbHVkZXMgd2hldGhlciBzdHJpbmdzIGFyZVxyXG4gICAqIG1hcmtlZCBhcyBcIm92ZXJyaWRkZW5cIlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGF0ZURlbHRhKCk6IExvY2FsaXplZFN0cmluZ1N0YXRlRGVsdGEge1xyXG4gICAgY29uc3QgcmVzdWx0OiBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhID0ge307XHJcblxyXG4gICAgdGhpcy51c2VkTG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICBjb25zdCByYXdTdHJpbmcgPSB0aGlzLmdldFJhd1N0cmluZ1ZhbHVlKCBsb2NhbGUgKTtcclxuICAgICAgaWYgKCByYXdTdHJpbmcgIT09IG51bGwgJiYgcmF3U3RyaW5nICE9PSB0aGlzLmluaXRpYWxWYWx1ZXNbIGxvY2FsZSBdICkge1xyXG4gICAgICAgIHJlc3VsdFsgbG9jYWxlIF0gPSByYXdTdHJpbmc7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZSBhIHN0YXRlIGZyb20gZ2V0U3RhdGVEZWx0YSwgYW5kIGFwcGx5IGl0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTdGF0ZURlbHRhKCBzdGF0ZTogTG9jYWxpemVkU3RyaW5nU3RhdGVEZWx0YSApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBDcmVhdGUgcG90ZW50aWFsIG5ldyBsb2NhbGVzIChzaW5jZSBsb2NhbGUtc3BlY2lmaWMgUHJvcGVydGllcyBhcmUgbGF6aWx5IGNyZWF0ZWQgYXMgbmVlZGVkXHJcbiAgICBPYmplY3Qua2V5cyggc3RhdGUgKS5mb3JFYWNoKCBsb2NhbGUgPT4gdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBsb2NhbGUgYXMgTG9jYWxlICkgKTtcclxuXHJcbiAgICB0aGlzLnVzZWRMb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICAgIGNvbnN0IGxvY2FsZVNwZWNpZmljUHJvcGVydHkgPSB0aGlzLmdldExvY2FsZVNwZWNpZmljUHJvcGVydHkoIGxvY2FsZSApO1xyXG4gICAgICBjb25zdCBpbml0aWFsVmFsdWU6IHN0cmluZyB8IG51bGwgPSB0aGlzLmluaXRpYWxWYWx1ZXNbIGxvY2FsZSBdICE9PSB1bmRlZmluZWQgPyB0aGlzLmluaXRpYWxWYWx1ZXNbIGxvY2FsZSBdISA6IG51bGw7XHJcbiAgICAgIGNvbnN0IHN0YXRlVmFsdWU6IHN0cmluZyB8IG51bGwgPSBzdGF0ZVsgbG9jYWxlIF0gIT09IHVuZGVmaW5lZCA/IHN0YXRlWyBsb2NhbGUgXSEgOiBudWxsO1xyXG5cclxuICAgICAgLy8gSWYgbm90IHNwZWNpZmllZCBpbiB0aGUgc3RhdGVcclxuICAgICAgaWYgKCBzdGF0ZVZhbHVlID09PSBudWxsICkge1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vIGluaXRpYWwgdmFsdWUsIHdlJ2xsIHdhbnQgdG8gc2V0IGl0IHRvIGZhbGwgYmFja1xyXG4gICAgICAgIGlmICggaW5pdGlhbFZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgICAgKCBsb2NhbGVTcGVjaWZpY1Byb3BlcnR5IGFzIFRpbnlPdmVycmlkZVByb3BlcnR5PHN0cmluZz4gKS5jbGVhck92ZXJyaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgbG9jYWxlU3BlY2lmaWNQcm9wZXJ0eS52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbG9jYWxlU3BlY2lmaWNQcm9wZXJ0eS52YWx1ZSA9IHN0YXRlVmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNwZWNpZmljIHRyYW5zbGF0aW9uIGZvciBhIGxvY2FsZSAobm8gZmFsbGJhY2tzKSwgb3IgbnVsbCBpZiB0aGF0IHN0cmluZyBpcyBub3QgdHJhbnNsYXRlZCBpbiB0aGVcclxuICAgKiBleGFjdCBsb2NhbGVcclxuICAgKi9cclxuICBwcml2YXRlIGdldFJhd1N0cmluZ1ZhbHVlKCBsb2NhbGU6IExvY2FsZSApOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGNvbnN0IHByb3BlcnR5ID0gdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBsb2NhbGUgKTtcclxuICAgIGlmICggcHJvcGVydHkgaW5zdGFuY2VvZiBUaW55T3ZlcnJpZGVQcm9wZXJ0eSApIHtcclxuICAgICAgcmV0dXJuIHByb3BlcnR5LmlzT3ZlcnJpZGRlbiA/IHByb3BlcnR5LnZhbHVlIDogbnVsbDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBlbmdsaXNoXHJcbiAgICAgIHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0IHVzZWRMb2NhbGVzKCk6IExvY2FsZVtdIHtcclxuICAgIC8vIE5PVEU6IG9yZGVyIG1hdHRlcnMsIHdlIHdhbnQgdGhlIGZhbGxiYWNrIHRvIGJlIGZpcnN0IHNvIHRoYXQgaW4gb25Mb2NhbGVPcmRlckNoYW5nZSB3ZSBkb24ndCBydW4gaW50byBpbmZpbml0ZVxyXG4gICAgLy8gbG9vcHMuXHJcbiAgICByZXR1cm4gWyBGQUxMQkFDS19MT0NBTEUsIC4uLnRoaXMubG9jYWxlUHJvcGVydHlNYXAua2V5cygpIF07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uTG9jYWxlT3JkZXJDaGFuZ2UoIGxvY2FsZU9yZGVyOiBMb2NhbGVbXSApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBEbyB0aGlzIGluIHJldmVyc2Ugb3JkZXIgdG8gQVZPSUQgaW5maW5pdGUgbG9vcHMuXHJcbiAgICAvLyBGb3IgZXhhbXBsZSwgaWYgbG9jYWxlT3JkZXIxPWFyLGVzIGxvY2FsZU9yZGVyMj1lcyxhcikgdGhlbiB3ZSBjb3VsZCBydW4gaW50byB0aGUgY2FzZSB0ZW1wb3JhcmlseSB3aGVyZSB0aGVcclxuICAgIC8vIFRpbnlPdmVycmlkZVByb3BlcnR5IGZvciBhciBoYXMgaXRzIHRhcmdldCBhcyBlcywgYW5kIHRoZSBUaW55T3ZlcnJpZGVQcm9wZXJ0eSBmb3IgZXMgaGFzIGl0cyB0YXJnZXQgYXMgYXIuXHJcbiAgICAvLyBUaGlzIHdvdWxkIHRoZW4gdHJpZ2dlciBhbiBpbmZpbml0ZSBsb29wIGlmIHlvdSB0cnkgdG8gcmVhZCB0aGUgdmFsdWUgb2YgZWl0aGVyIG9mIHRoZW0sIGFzIGl0IHdvdWxkIHBpbmdcclxuICAgIC8vIGJhY2stYW5kLWZvcnRoLlxyXG4gICAgY29uc3QgbG9jYWxlczogTG9jYWxlW10gPSBbXHJcbiAgICAgIC4uLnRoaXMudXNlZExvY2FsZXMsXHJcblxyXG4gICAgICAvLyBZZXMsIHRoaXMgZHVwbGljYXRlcyBzb21lLCBidXQgaXQgc2hvdWxkIGJlIGEgbm8tb3AgYW5kIHNhdmVzIGNvZGUgbGVuZ3RoXHJcbiAgICAgIC4uLmxvY2FsZU9yZGVyXHJcbiAgICBdO1xyXG4gICAgZm9yICggbGV0IGkgPSBsb2NhbGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBjb25zdCBsb2NhbGUgPSBsb2NhbGVzWyBpIF07XHJcbiAgICAgIGNvbnN0IGxvY2FsZVByb3BlcnR5ID0gdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBsb2NhbGUgKTtcclxuICAgICAgaWYgKCBsb2NhbGVQcm9wZXJ0eSBpbnN0YW5jZW9mIFRpbnlPdmVycmlkZVByb3BlcnR5ICkge1xyXG4gICAgICAgIGxvY2FsZVByb3BlcnR5LnRhcmdldFByb3BlcnR5ID0gdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBMb2NhbGl6ZWRTdHJpbmcuZ2V0RmFsbGJhY2tMb2NhbGUoIGxvY2FsZSApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvY2FsZS1zcGVjaWZpYyBQcm9wZXJ0eSBmb3IgYW55IGxvY2FsZSAobGF6aWx5IGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeSlcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxlU3BlY2lmaWNQcm9wZXJ0eSggbG9jYWxlOiBMb2NhbGUgKTogVFByb3BlcnR5PHN0cmluZz4ge1xyXG4gICAgaWYgKCBsb2NhbGUgPT09ICdlbicgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVuZ2xpc2hQcm9wZXJ0eTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBMYXp5IGNyZWF0aW9uXHJcbiAgICBpZiAoICF0aGlzLmxvY2FsZVByb3BlcnR5TWFwLmhhcyggbG9jYWxlICkgKSB7XHJcbiAgICAgIHRoaXMubG9jYWxlUHJvcGVydHlNYXAuc2V0KCBsb2NhbGUsIG5ldyBUaW55T3ZlcnJpZGVQcm9wZXJ0eSggdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBMb2NhbGl6ZWRTdHJpbmcuZ2V0RmFsbGJhY2tMb2NhbGUoIGxvY2FsZSApICkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmxvY2FsZVByb3BlcnR5TWFwLmdldCggbG9jYWxlICkhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hhdCBzaG91bGQgYmUgdGhlIG5leHQtbW9zdCBmYWxsYmFjayBsb2NhbGUgZm9yIGEgZ2l2ZW4gbG9jYWxlLiBPdXIgZ2xvYmFsIGxvY2FsZU9yZGVyIGlzIHVzZWQsIGFuZCBvdGhlcndpc2UgaXRcclxuICAgKiBkZWZhdWx0cyB0byBvdXIgbm9ybWFsIGZhbGxiYWNrIG1lY2hhbmlzbS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldEZhbGxiYWNrTG9jYWxlKCBsb2NhbGU6IExvY2FsZSApOiBMb2NhbGUge1xyXG4gICAgaWYgKCBsb2NhbGUgPT09ICdlbicgKSB7XHJcbiAgICAgIHJldHVybiAnZW4nOyAvLyBjYW4gYmUgaXRzIG93biBmYWxsYmFja1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxvY2FsZU9yZGVyID0gbG9jYWxlT3JkZXJQcm9wZXJ0eS52YWx1ZTtcclxuXHJcbiAgICBjb25zdCBpbmRleCA9IGxvY2FsZU9yZGVyLmluZGV4T2YoIGxvY2FsZSApO1xyXG4gICAgaWYgKCBpbmRleCA+PSAwICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsb2NhbGVPcmRlclsgbG9jYWxlT3JkZXIubGVuZ3RoIC0gMSBdID09PSAnZW4nICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ICsgMSA8IGxvY2FsZU9yZGVyLmxlbmd0aCApO1xyXG4gICAgICByZXR1cm4gbG9jYWxlT3JkZXJbIGluZGV4ICsgMSBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGRvZXNuJ3QgZXhpc3QgaW4gdGhvc2VcclxuICAgICAgaWYgKCBsb2NhbGUuaW5jbHVkZXMoICdfJyApICkge1xyXG4gICAgICAgIHJldHVybiBsb2NhbGUuc2xpY2UoIDAsIDIgKSBhcyBMb2NhbGU7IC8vIHpoX0NOID0+IHpoXHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuICdlbic7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgbG9jYWxlT3JkZXJQcm9wZXJ0eS51bmxpbmsoIHRoaXMubG9jYWxlT3JkZXJMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMucHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgYXJyYXlSZW1vdmUoIGxvY2FsaXplZFN0cmluZ3MsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0IHRvIHRoZSBpbml0aWFsIHZhbHVlIGZvciB0aGUgc3BlY2lmaWVkIGxvY2FsZSwgdXNlZCBmb3IgdGVzdGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgcmVzdG9yZUluaXRpYWxWYWx1ZSggbG9jYWxlOiBMb2NhbGUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5pbml0aWFsVmFsdWVzWyBsb2NhbGUgXSA9PT0gJ3N0cmluZycsICdpbml0aWFsIHZhbHVlIGV4cGVjdGVkIGZvcicsIGxvY2FsZSApO1xyXG4gICAgdGhpcy5wcm9wZXJ0eS52YWx1ZSA9IHRoaXMuaW5pdGlhbFZhbHVlc1sgbG9jYWxlIF0hO1xyXG4gIH1cclxufVxyXG5cclxuY2hpcHBlci5yZWdpc3RlciggJ0xvY2FsaXplZFN0cmluZycsIExvY2FsaXplZFN0cmluZyApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgTG9jYWxpemVkU3RyaW5nOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBUUEsSUFBQUEsYUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMscUJBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUVBLElBQUFFLG9CQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBRyxRQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBSSxnQkFBQSxHQUFBSixPQUFBO0FBQ0EsSUFBQUssWUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBRUEsSUFBQU0sd0JBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUFtRSxTQUFBRCx1QkFBQVEsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBQUEs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