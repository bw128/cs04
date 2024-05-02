// Copyright 2018-2024, University of Colorado Boulder

/**
 * PhET-iO Type for LinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import StringIO from './types/StringIO.js';
const LinkedElementIO = new IOType('LinkedElementIO', {
  isValidValue: () => true,
  documentation: 'A LinkedElement',
  toStateObject: linkedElement => {
    assert && Tandem.VALIDATION && assert(linkedElement.element.isPhetioInstrumented(), 'Linked elements must be instrumented');
    return {
      elementID: linkedElement.element.tandem.phetioID
    };
  },
  // Override the parent implementation as a no-op.  LinkedElement elementID appears in the state, but should not be set
  // back into a running simulation.
  applyState: _.noop,
  stateSchema: {
    elementID: StringIO
  }
});
tandemNamespace.register('LinkedElementIO', LinkedElementIO);
export default LinkedElementIO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJ0YW5kZW1OYW1lc3BhY2UiLCJJT1R5cGUiLCJTdHJpbmdJTyIsIkxpbmtlZEVsZW1lbnRJTyIsImlzVmFsaWRWYWx1ZSIsImRvY3VtZW50YXRpb24iLCJ0b1N0YXRlT2JqZWN0IiwibGlua2VkRWxlbWVudCIsImFzc2VydCIsIlZBTElEQVRJT04iLCJlbGVtZW50IiwiaXNQaGV0aW9JbnN0cnVtZW50ZWQiLCJlbGVtZW50SUQiLCJ0YW5kZW0iLCJwaGV0aW9JRCIsImFwcGx5U3RhdGUiLCJfIiwibm9vcCIsInN0YXRlU2NoZW1hIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMaW5rZWRFbGVtZW50SU8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUGhFVC1pTyBUeXBlIGZvciBMaW5rZWRFbGVtZW50XHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuL1RhbmRlbS5qcyc7XHJcbmltcG9ydCB0YW5kZW1OYW1lc3BhY2UgZnJvbSAnLi90YW5kZW1OYW1lc3BhY2UuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4vdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IFN0cmluZ0lPIGZyb20gJy4vdHlwZXMvU3RyaW5nSU8uanMnO1xyXG5cclxuZXhwb3J0IHR5cGUgTGlua2VkRWxlbWVudFN0YXRlID0ge1xyXG4gIGVsZW1lbnRJRDogc3RyaW5nO1xyXG59O1xyXG5cclxuY29uc3QgTGlua2VkRWxlbWVudElPID0gbmV3IElPVHlwZSggJ0xpbmtlZEVsZW1lbnRJTycsIHtcclxuICBpc1ZhbGlkVmFsdWU6ICgpID0+IHRydWUsXHJcbiAgZG9jdW1lbnRhdGlvbjogJ0EgTGlua2VkRWxlbWVudCcsXHJcbiAgdG9TdGF0ZU9iamVjdDogbGlua2VkRWxlbWVudCA9PiB7XHJcbiAgICBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0KCBsaW5rZWRFbGVtZW50LmVsZW1lbnQuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ0xpbmtlZCBlbGVtZW50cyBtdXN0IGJlIGluc3RydW1lbnRlZCcgKTtcclxuICAgIHJldHVybiB7IGVsZW1lbnRJRDogbGlua2VkRWxlbWVudC5lbGVtZW50LnRhbmRlbS5waGV0aW9JRCB9O1xyXG4gIH0sXHJcblxyXG4gIC8vIE92ZXJyaWRlIHRoZSBwYXJlbnQgaW1wbGVtZW50YXRpb24gYXMgYSBuby1vcC4gIExpbmtlZEVsZW1lbnQgZWxlbWVudElEIGFwcGVhcnMgaW4gdGhlIHN0YXRlLCBidXQgc2hvdWxkIG5vdCBiZSBzZXRcclxuICAvLyBiYWNrIGludG8gYSBydW5uaW5nIHNpbXVsYXRpb24uXHJcbiAgYXBwbHlTdGF0ZTogXy5ub29wLFxyXG4gIHN0YXRlU2NoZW1hOiB7XHJcbiAgICBlbGVtZW50SUQ6IFN0cmluZ0lPXHJcbiAgfVxyXG59ICk7XHJcblxyXG50YW5kZW1OYW1lc3BhY2UucmVnaXN0ZXIoICdMaW5rZWRFbGVtZW50SU8nLCBMaW5rZWRFbGVtZW50SU8gKTtcclxuZXhwb3J0IGRlZmF1bHQgTGlua2VkRWxlbWVudElPOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxNQUFNLE1BQU0sYUFBYTtBQUNoQyxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLE1BQU0sTUFBTSxtQkFBbUI7QUFDdEMsT0FBT0MsUUFBUSxNQUFNLHFCQUFxQjtBQU0xQyxNQUFNQyxlQUFlLEdBQUcsSUFBSUYsTUFBTSxDQUFFLGlCQUFpQixFQUFFO0VBQ3JERyxZQUFZLEVBQUVBLENBQUEsS0FBTSxJQUFJO0VBQ3hCQyxhQUFhLEVBQUUsaUJBQWlCO0VBQ2hDQyxhQUFhLEVBQUVDLGFBQWEsSUFBSTtJQUM5QkMsTUFBTSxJQUFJVCxNQUFNLENBQUNVLFVBQVUsSUFBSUQsTUFBTSxDQUFFRCxhQUFhLENBQUNHLE9BQU8sQ0FBQ0Msb0JBQW9CLENBQUMsQ0FBQyxFQUFFLHNDQUF1QyxDQUFDO0lBQzdILE9BQU87TUFBRUMsU0FBUyxFQUFFTCxhQUFhLENBQUNHLE9BQU8sQ0FBQ0csTUFBTSxDQUFDQztJQUFTLENBQUM7RUFDN0QsQ0FBQztFQUVEO0VBQ0E7RUFDQUMsVUFBVSxFQUFFQyxDQUFDLENBQUNDLElBQUk7RUFDbEJDLFdBQVcsRUFBRTtJQUNYTixTQUFTLEVBQUVWO0VBQ2I7QUFDRixDQUFFLENBQUM7QUFFSEYsZUFBZSxDQUFDbUIsUUFBUSxDQUFFLGlCQUFpQixFQUFFaEIsZUFBZ0IsQ0FBQztBQUM5RCxlQUFlQSxlQUFlIiwiaWdub3JlTGlzdCI6W119