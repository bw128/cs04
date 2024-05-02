// Copyright 2020-2024, University of Colorado Boulder

/**
 * Demonstration of various spinners.
 * Demos are selected from a combo box, and are instantiated on demand.
 * Use the 'component' query parameter to set the initial selection of the combo box.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../../../phet-core/js/optionize.js';
import DemosScreenView from '../../../../sun/js/demo/DemosScreenView.js';
import sceneryPhet from '../../sceneryPhet.js';
import demoFineCoarseSpinner from './demoFineCoarseSpinner.js';
export default class SpinnersScreenView extends DemosScreenView {
  constructor(providedOptions) {
    const options = optionize()({
      // nothing for now
    }, providedOptions);

    // To add a demo, add an entry here of type DemoItemData.
    const demos = [{
      label: 'FineCoarseSpinner',
      createNode: demoFineCoarseSpinner
    }];
    super(demos, options);
  }
}
sceneryPhet.register('SpinnersScreenView', SpinnersScreenView);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJEZW1vc1NjcmVlblZpZXciLCJzY2VuZXJ5UGhldCIsImRlbW9GaW5lQ29hcnNlU3Bpbm5lciIsIlNwaW5uZXJzU2NyZWVuVmlldyIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImRlbW9zIiwibGFiZWwiLCJjcmVhdGVOb2RlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTcGlubmVyc1NjcmVlblZpZXcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRGVtb25zdHJhdGlvbiBvZiB2YXJpb3VzIHNwaW5uZXJzLlxyXG4gKiBEZW1vcyBhcmUgc2VsZWN0ZWQgZnJvbSBhIGNvbWJvIGJveCwgYW5kIGFyZSBpbnN0YW50aWF0ZWQgb24gZGVtYW5kLlxyXG4gKiBVc2UgdGhlICdjb21wb25lbnQnIHF1ZXJ5IHBhcmFtZXRlciB0byBzZXQgdGhlIGluaXRpYWwgc2VsZWN0aW9uIG9mIHRoZSBjb21ibyBib3guXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBEZW1vc1NjcmVlblZpZXcsIHsgRGVtb3NTY3JlZW5WaWV3T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9kZW1vL0RlbW9zU2NyZWVuVmlldy5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuLi8uLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBkZW1vRmluZUNvYXJzZVNwaW5uZXIgZnJvbSAnLi9kZW1vRmluZUNvYXJzZVNwaW5uZXIuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcbnR5cGUgU3Bpbm5lcnNTY3JlZW5WaWV3T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja1JlcXVpcmVkPERlbW9zU2NyZWVuVmlld09wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNwaW5uZXJzU2NyZWVuVmlldyBleHRlbmRzIERlbW9zU2NyZWVuVmlldyB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zOiBTcGlubmVyc1NjcmVlblZpZXdPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U3Bpbm5lcnNTY3JlZW5WaWV3T3B0aW9ucywgU2VsZk9wdGlvbnMsIERlbW9zU2NyZWVuVmlld09wdGlvbnM+KCkoIHtcclxuICAgICAgLy8gbm90aGluZyBmb3Igbm93XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBUbyBhZGQgYSBkZW1vLCBhZGQgYW4gZW50cnkgaGVyZSBvZiB0eXBlIERlbW9JdGVtRGF0YS5cclxuICAgIGNvbnN0IGRlbW9zID0gW1xyXG4gICAgICB7IGxhYmVsOiAnRmluZUNvYXJzZVNwaW5uZXInLCBjcmVhdGVOb2RlOiBkZW1vRmluZUNvYXJzZVNwaW5uZXIgfVxyXG4gICAgXTtcclxuXHJcbiAgICBzdXBlciggZGVtb3MsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnU3Bpbm5lcnNTY3JlZW5WaWV3JywgU3Bpbm5lcnNTY3JlZW5WaWV3ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBNEIsdUNBQXVDO0FBRW5GLE9BQU9DLGVBQWUsTUFBa0MsNENBQTRDO0FBQ3BHLE9BQU9DLFdBQVcsTUFBTSxzQkFBc0I7QUFDOUMsT0FBT0MscUJBQXFCLE1BQU0sNEJBQTRCO0FBSzlELGVBQWUsTUFBTUMsa0JBQWtCLFNBQVNILGVBQWUsQ0FBQztFQUV2REksV0FBV0EsQ0FBRUMsZUFBMEMsRUFBRztJQUUvRCxNQUFNQyxPQUFPLEdBQUdQLFNBQVMsQ0FBaUUsQ0FBQyxDQUFFO01BQzNGO0lBQUEsQ0FDRCxFQUFFTSxlQUFnQixDQUFDOztJQUVwQjtJQUNBLE1BQU1FLEtBQUssR0FBRyxDQUNaO01BQUVDLEtBQUssRUFBRSxtQkFBbUI7TUFBRUMsVUFBVSxFQUFFUDtJQUFzQixDQUFDLENBQ2xFO0lBRUQsS0FBSyxDQUFFSyxLQUFLLEVBQUVELE9BQVEsQ0FBQztFQUN6QjtBQUNGO0FBRUFMLFdBQVcsQ0FBQ1MsUUFBUSxDQUFFLG9CQUFvQixFQUFFUCxrQkFBbUIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==