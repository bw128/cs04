"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2020-2023, University of Colorado Boulder

/**
 * Output deprecation warnings to console.warn when ?deprecationWarnings is specified
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// contains all messages printed for deprecation warnings so that we do not print the same message multiple times
var deprecatedMessages = {};
var deprecationWarning = function deprecationWarning(message) {
  var showDeprecationWarnings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.phet && window.phet.chipper && window.phet.chipper.queryParameters && phet.chipper.queryParameters.deprecationWarnings;
  if (showDeprecationWarnings && !deprecatedMessages.hasOwnProperty(message)) {
    deprecatedMessages[message] = true;
    console.warn("Deprecation warning: ".concat(message));
  }
};
_phetCore["default"].register('deprecationWarning', deprecationWarning);
var _default = exports["default"] = deprecationWarning;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZXByZWNhdGVkTWVzc2FnZXMiLCJkZXByZWNhdGlvbldhcm5pbmciLCJtZXNzYWdlIiwic2hvd0RlcHJlY2F0aW9uV2FybmluZ3MiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImRlcHJlY2F0aW9uV2FybmluZ3MiLCJoYXNPd25Qcm9wZXJ0eSIsImNvbnNvbGUiLCJ3YXJuIiwiY29uY2F0IiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImRlcHJlY2F0aW9uV2FybmluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBPdXRwdXQgZGVwcmVjYXRpb24gd2FybmluZ3MgdG8gY29uc29sZS53YXJuIHdoZW4gP2RlcHJlY2F0aW9uV2FybmluZ3MgaXMgc3BlY2lmaWVkXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuLy8gY29udGFpbnMgYWxsIG1lc3NhZ2VzIHByaW50ZWQgZm9yIGRlcHJlY2F0aW9uIHdhcm5pbmdzIHNvIHRoYXQgd2UgZG8gbm90IHByaW50IHRoZSBzYW1lIG1lc3NhZ2UgbXVsdGlwbGUgdGltZXNcclxuY29uc3QgZGVwcmVjYXRlZE1lc3NhZ2VzOiBSZWNvcmQ8c3RyaW5nLCB0cnVlPiA9IHt9O1xyXG5cclxuY29uc3QgZGVwcmVjYXRpb25XYXJuaW5nID0gKCBtZXNzYWdlOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0RlcHJlY2F0aW9uV2FybmluZ3M6IGJvb2xlYW4gPSB3aW5kb3cucGhldCAmJiB3aW5kb3cucGhldC5jaGlwcGVyICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cucGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5kZXByZWNhdGlvbldhcm5pbmdzICk6IHZvaWQgPT4ge1xyXG4gIGlmICggc2hvd0RlcHJlY2F0aW9uV2FybmluZ3MgJiYgIWRlcHJlY2F0ZWRNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eSggbWVzc2FnZSApICkge1xyXG4gICAgZGVwcmVjYXRlZE1lc3NhZ2VzWyBtZXNzYWdlIF0gPSB0cnVlO1xyXG4gICAgY29uc29sZS53YXJuKCBgRGVwcmVjYXRpb24gd2FybmluZzogJHttZXNzYWdlfWAgKTtcclxuICB9XHJcbn07XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2RlcHJlY2F0aW9uV2FybmluZycsIGRlcHJlY2F0aW9uV2FybmluZyApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVwcmVjYXRpb25XYXJuaW5nOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBUUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFSckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQTtBQUNBLElBQU1FLGtCQUF3QyxHQUFHLENBQUMsQ0FBQztBQUVuRCxJQUFNQyxrQkFBa0IsR0FBRyxTQUFyQkEsa0JBQWtCQSxDQUFLQyxPQUFlLEVBR2dGO0VBQUEsSUFGL0ZDLHVCQUFnQyxHQUFBQyxTQUFBLENBQUFDLE1BQUEsUUFBQUQsU0FBQSxRQUFBRSxTQUFBLEdBQUFGLFNBQUEsTUFBR0csTUFBTSxDQUFDQyxJQUFJLElBQUlELE1BQU0sQ0FBQ0MsSUFBSSxDQUFDQyxPQUFPLElBQ2xDRixNQUFNLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxlQUFlLElBQ25DRixJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsZUFBZSxDQUFDQyxtQkFBbUI7RUFDOUcsSUFBS1IsdUJBQXVCLElBQUksQ0FBQ0gsa0JBQWtCLENBQUNZLGNBQWMsQ0FBRVYsT0FBUSxDQUFDLEVBQUc7SUFDOUVGLGtCQUFrQixDQUFFRSxPQUFPLENBQUUsR0FBRyxJQUFJO0lBQ3BDVyxPQUFPLENBQUNDLElBQUkseUJBQUFDLE1BQUEsQ0FBMEJiLE9BQU8sQ0FBRyxDQUFDO0VBQ25EO0FBQ0YsQ0FBQztBQUVEYyxvQkFBUSxDQUFDQyxRQUFRLENBQUUsb0JBQW9CLEVBQUVoQixrQkFBbUIsQ0FBQztBQUFDLElBQUFpQixRQUFBLEdBQUFDLE9BQUEsY0FFL0NsQixrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=