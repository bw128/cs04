"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _inheritance = _interopRequireDefault(require("./inheritance.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2020-2023, University of Colorado Boulder

/**
 * Throws an assertion error if specified object doesn't have all provided properties. This will also work for anything
 * defined on class prototypes (like Node.prototype.setOpacity)
 *
 * @example
 * assertHasProperties( { tree:1, flower:2 }, [ 'tree' ] ) => no error
 * assertHasProperties( { flower:2 }, [ 'tree' ] ) => error
 * assertHasProperties( { tree:1, flower:2 }, [ 'tree', 'flower' ] ) => no error
 * assertHasProperties( { tree:1 }, [ 'tree', 'flower' ] ) => error
 * assertHasProperties( new phet.scenery.Node(), [ 'getOpacity','opacity', '_opacity' ] ) => no error
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

var assertHasProperties = function assertHasProperties(object, properties) {
  if (assert && object) {
    properties.forEach(function (property) {
      assert && assert(Object.getOwnPropertyDescriptor(object, property) ||
      // support fields directly on the object

      // test up the class hierarchy for if the property is defined on a prototype.
      _.some((0, _inheritance["default"])(object.constructor).map(function (type) {
        return Object.getOwnPropertyDescriptor(type.prototype, property);
      })), "property not defined: ".concat(property));
    });
  }
};
_phetCore["default"].register('assertHasProperties', assertHasProperties);
var _default = exports["default"] = assertHasProperties;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW5oZXJpdGFuY2UiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9waGV0Q29yZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJhc3NlcnRIYXNQcm9wZXJ0aWVzIiwib2JqZWN0IiwicHJvcGVydGllcyIsImFzc2VydCIsImZvckVhY2giLCJwcm9wZXJ0eSIsIk9iamVjdCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsIl8iLCJzb21lIiwiaW5oZXJpdGFuY2UiLCJjb25zdHJ1Y3RvciIsIm1hcCIsInR5cGUiLCJwcm90b3R5cGUiLCJjb25jYXQiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiYXNzZXJ0SGFzUHJvcGVydGllcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGlmIHNwZWNpZmllZCBvYmplY3QgZG9lc24ndCBoYXZlIGFsbCBwcm92aWRlZCBwcm9wZXJ0aWVzLiBUaGlzIHdpbGwgYWxzbyB3b3JrIGZvciBhbnl0aGluZ1xyXG4gKiBkZWZpbmVkIG9uIGNsYXNzIHByb3RvdHlwZXMgKGxpa2UgTm9kZS5wcm90b3R5cGUuc2V0T3BhY2l0eSlcclxuICpcclxuICogQGV4YW1wbGVcclxuICogYXNzZXJ0SGFzUHJvcGVydGllcyggeyB0cmVlOjEsIGZsb3dlcjoyIH0sIFsgJ3RyZWUnIF0gKSA9PiBubyBlcnJvclxyXG4gKiBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGZsb3dlcjoyIH0sIFsgJ3RyZWUnIF0gKSA9PiBlcnJvclxyXG4gKiBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IHRyZWU6MSwgZmxvd2VyOjIgfSwgWyAndHJlZScsICdmbG93ZXInIF0gKSA9PiBubyBlcnJvclxyXG4gKiBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IHRyZWU6MSB9LCBbICd0cmVlJywgJ2Zsb3dlcicgXSApID0+IGVycm9yXHJcbiAqIGFzc2VydEhhc1Byb3BlcnRpZXMoIG5ldyBwaGV0LnNjZW5lcnkuTm9kZSgpLCBbICdnZXRPcGFjaXR5Jywnb3BhY2l0eScsICdfb3BhY2l0eScgXSApID0+IG5vIGVycm9yXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgaW5oZXJpdGFuY2UgZnJvbSAnLi9pbmhlcml0YW5jZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IHBoZXRDb3JlIGZyb20gJy4vcGhldENvcmUuanMnO1xyXG5cclxuY29uc3QgYXNzZXJ0SGFzUHJvcGVydGllcyA9ICggb2JqZWN0OiBJbnRlbnRpb25hbEFueSwgcHJvcGVydGllczogc3RyaW5nW10gKTogdm9pZCA9PiB7XHJcbiAgaWYgKCBhc3NlcnQgJiYgb2JqZWN0ICkge1xyXG5cclxuXHJcbiAgICBwcm9wZXJ0aWVzLmZvckVhY2goIHByb3BlcnR5ID0+IHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoIG9iamVjdCwgcHJvcGVydHkgKSB8fCAvLyBzdXBwb3J0IGZpZWxkcyBkaXJlY3RseSBvbiB0aGUgb2JqZWN0XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXN0IHVwIHRoZSBjbGFzcyBoaWVyYXJjaHkgZm9yIGlmIHRoZSBwcm9wZXJ0eSBpcyBkZWZpbmVkIG9uIGEgcHJvdG90eXBlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfLnNvbWUoIGluaGVyaXRhbmNlKCBvYmplY3QuY29uc3RydWN0b3IgKS5tYXAoIHR5cGUgPT4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciggdHlwZS5wcm90b3R5cGUsIHByb3BlcnR5ICkgKSApLFxyXG4gICAgICAgIGBwcm9wZXJ0eSBub3QgZGVmaW5lZDogJHtwcm9wZXJ0eX1gICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59O1xyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdhc3NlcnRIYXNQcm9wZXJ0aWVzJywgYXNzZXJ0SGFzUHJvcGVydGllcyApO1xyXG5leHBvcnQgZGVmYXVsdCBhc3NlcnRIYXNQcm9wZXJ0aWVzOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBZ0JBLElBQUFBLFlBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUVBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUFxQyxTQUFBRCx1QkFBQUcsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBbEJyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFNQSxJQUFNRSxtQkFBbUIsR0FBRyxTQUF0QkEsbUJBQW1CQSxDQUFLQyxNQUFzQixFQUFFQyxVQUFvQixFQUFZO0VBQ3BGLElBQUtDLE1BQU0sSUFBSUYsTUFBTSxFQUFHO0lBR3RCQyxVQUFVLENBQUNFLE9BQU8sQ0FBRSxVQUFBQyxRQUFRLEVBQUk7TUFFOUJGLE1BQU0sSUFBSUEsTUFBTSxDQUFFRyxNQUFNLENBQUNDLHdCQUF3QixDQUFFTixNQUFNLEVBQUVJLFFBQVMsQ0FBQztNQUFJOztNQUV2RDtNQUNBRyxDQUFDLENBQUNDLElBQUksQ0FBRSxJQUFBQyx1QkFBVyxFQUFFVCxNQUFNLENBQUNVLFdBQVksQ0FBQyxDQUFDQyxHQUFHLENBQUUsVUFBQUMsSUFBSTtRQUFBLE9BQUlQLE1BQU0sQ0FBQ0Msd0JBQXdCLENBQUVNLElBQUksQ0FBQ0MsU0FBUyxFQUFFVCxRQUFTLENBQUM7TUFBQSxDQUFDLENBQUUsQ0FBQywyQkFBQVUsTUFBQSxDQUM3R1YsUUFBUSxDQUFHLENBQUM7SUFDekMsQ0FBRSxDQUFDO0VBQ0w7QUFDRixDQUFDO0FBRURXLG9CQUFRLENBQUNDLFFBQVEsQ0FBRSxxQkFBcUIsRUFBRWpCLG1CQUFvQixDQUFDO0FBQUMsSUFBQWtCLFFBQUEsR0FBQUMsT0FBQSxjQUNqRG5CLG1CQUFtQiIsImlnbm9yZUxpc3QiOltdfQ==