// Copyright 2019-2023, University of Colorado Boulder

/**
 * A tandem for a dynamic element that stores the name of the archetype that defines its dynamic element's schema.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import optionize from '../../phet-core/js/optionize.js';
import TandemConstants from './TandemConstants.js';
class DynamicTandem extends Tandem {
  constructor(parentTandem, name, providedOptions) {
    assert && assert(parentTandem, 'DynamicTandem must have a parentTandem');
    const options = optionize()({
      isValidTandemName: name => Tandem.getRegexFromCharacterClass(TandemConstants.BASE_DYNAMIC_TANDEM_CHARACTER_CLASS).test(name)
    }, providedOptions);
    super(parentTandem, name, options);
  }
}
tandemNamespace.register('DynamicTandem', DynamicTandem);
export default DynamicTandem;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJ0YW5kZW1OYW1lc3BhY2UiLCJvcHRpb25pemUiLCJUYW5kZW1Db25zdGFudHMiLCJEeW5hbWljVGFuZGVtIiwiY29uc3RydWN0b3IiLCJwYXJlbnRUYW5kZW0iLCJuYW1lIiwicHJvdmlkZWRPcHRpb25zIiwiYXNzZXJ0Iiwib3B0aW9ucyIsImlzVmFsaWRUYW5kZW1OYW1lIiwiZ2V0UmVnZXhGcm9tQ2hhcmFjdGVyQ2xhc3MiLCJCQVNFX0RZTkFNSUNfVEFOREVNX0NIQVJBQ1RFUl9DTEFTUyIsInRlc3QiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkR5bmFtaWNUYW5kZW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSB0YW5kZW0gZm9yIGEgZHluYW1pYyBlbGVtZW50IHRoYXQgc3RvcmVzIHRoZSBuYW1lIG9mIHRoZSBhcmNoZXR5cGUgdGhhdCBkZWZpbmVzIGl0cyBkeW5hbWljIGVsZW1lbnQncyBzY2hlbWEuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgS2x1c2VuZG9yZiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IFRhbmRlbSwgeyBUYW5kZW1PcHRpb25zIH0gZnJvbSAnLi9UYW5kZW0uanMnO1xyXG5pbXBvcnQgdGFuZGVtTmFtZXNwYWNlIGZyb20gJy4vdGFuZGVtTmFtZXNwYWNlLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBUYW5kZW1Db25zdGFudHMgZnJvbSAnLi9UYW5kZW1Db25zdGFudHMuanMnO1xyXG5cclxudHlwZSBEeW5hbWljVGFuZGVtT3B0aW9ucyA9IFN0cmljdE9taXQ8VGFuZGVtT3B0aW9ucywgJ2lzVmFsaWRUYW5kZW1OYW1lJz47XHJcblxyXG5jbGFzcyBEeW5hbWljVGFuZGVtIGV4dGVuZHMgVGFuZGVtIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwYXJlbnRUYW5kZW06IFRhbmRlbSwgbmFtZTogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBEeW5hbWljVGFuZGVtT3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBhcmVudFRhbmRlbSwgJ0R5bmFtaWNUYW5kZW0gbXVzdCBoYXZlIGEgcGFyZW50VGFuZGVtJyApO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxEeW5hbWljVGFuZGVtT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgVGFuZGVtT3B0aW9ucz4oKSgge1xyXG4gICAgICBpc1ZhbGlkVGFuZGVtTmFtZTogKCBuYW1lOiBzdHJpbmcgKSA9PiBUYW5kZW0uZ2V0UmVnZXhGcm9tQ2hhcmFjdGVyQ2xhc3MoIFRhbmRlbUNvbnN0YW50cy5CQVNFX0RZTkFNSUNfVEFOREVNX0NIQVJBQ1RFUl9DTEFTUyApLnRlc3QoIG5hbWUgKVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcbiAgICBzdXBlciggcGFyZW50VGFuZGVtLCBuYW1lLCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG50YW5kZW1OYW1lc3BhY2UucmVnaXN0ZXIoICdEeW5hbWljVGFuZGVtJywgRHluYW1pY1RhbmRlbSApO1xyXG5leHBvcnQgZGVmYXVsdCBEeW5hbWljVGFuZGVtOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsT0FBT0EsTUFBTSxNQUF5QixhQUFhO0FBQ25ELE9BQU9DLGVBQWUsTUFBTSxzQkFBc0I7QUFDbEQsT0FBT0MsU0FBUyxNQUE0QixpQ0FBaUM7QUFDN0UsT0FBT0MsZUFBZSxNQUFNLHNCQUFzQjtBQUlsRCxNQUFNQyxhQUFhLFNBQVNKLE1BQU0sQ0FBQztFQUUxQkssV0FBV0EsQ0FBRUMsWUFBb0IsRUFBRUMsSUFBWSxFQUFFQyxlQUFzQyxFQUFHO0lBQy9GQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUgsWUFBWSxFQUFFLHdDQUF5QyxDQUFDO0lBQzFFLE1BQU1JLE9BQU8sR0FBR1IsU0FBUyxDQUF3RCxDQUFDLENBQUU7TUFDbEZTLGlCQUFpQixFQUFJSixJQUFZLElBQU1QLE1BQU0sQ0FBQ1ksMEJBQTBCLENBQUVULGVBQWUsQ0FBQ1UsbUNBQW9DLENBQUMsQ0FBQ0MsSUFBSSxDQUFFUCxJQUFLO0lBQzdJLENBQUMsRUFBRUMsZUFBZ0IsQ0FBQztJQUNwQixLQUFLLENBQUVGLFlBQVksRUFBRUMsSUFBSSxFQUFFRyxPQUFRLENBQUM7RUFDdEM7QUFDRjtBQUVBVCxlQUFlLENBQUNjLFFBQVEsQ0FBRSxlQUFlLEVBQUVYLGFBQWMsQ0FBQztBQUMxRCxlQUFlQSxhQUFhIiwiaWdub3JlTGlzdCI6W119