// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for Checkbox
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import { Font, Text, VBox } from '../../../../scenery/js/imports.js';
import Checkbox from '../../Checkbox.js';
export default function demoCheckbox(layoutBounds) {
  const property = new BooleanProperty(true);
  const enabledProperty = new BooleanProperty(true, {
    phetioFeatured: true
  });
  const checkbox = new Checkbox(property, new Text('My Awesome Checkbox', {
    font: new Font({
      size: 30
    })
  }), {
    enabledProperty: enabledProperty
  });
  const enabledCheckbox = new Checkbox(enabledProperty, new Text('enabled', {
    font: new Font({
      size: 20
    })
  }));
  return new VBox({
    children: [checkbox, enabledCheckbox],
    spacing: 30,
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJGb250IiwiVGV4dCIsIlZCb3giLCJDaGVja2JveCIsImRlbW9DaGVja2JveCIsImxheW91dEJvdW5kcyIsInByb3BlcnR5IiwiZW5hYmxlZFByb3BlcnR5IiwicGhldGlvRmVhdHVyZWQiLCJjaGVja2JveCIsImZvbnQiLCJzaXplIiwiZW5hYmxlZENoZWNrYm94IiwiY2hpbGRyZW4iLCJzcGFjaW5nIiwiY2VudGVyIl0sInNvdXJjZXMiOlsiZGVtb0NoZWNrYm94LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW8gZm9yIENoZWNrYm94XHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IHsgRm9udCwgTm9kZSwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBDaGVja2JveCBmcm9tICcuLi8uLi9DaGVja2JveC5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZW1vQ2hlY2tib3goIGxheW91dEJvdW5kczogQm91bmRzMiApOiBOb2RlIHtcclxuXHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICk7XHJcbiAgY29uc3QgZW5hYmxlZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwgeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9ICk7XHJcblxyXG4gIGNvbnN0IGNoZWNrYm94ID0gbmV3IENoZWNrYm94KCBwcm9wZXJ0eSwgbmV3IFRleHQoICdNeSBBd2Vzb21lIENoZWNrYm94Jywge1xyXG4gICAgZm9udDogbmV3IEZvbnQoIHsgc2l6ZTogMzAgfSApXHJcbiAgfSApLCB7XHJcbiAgICBlbmFibGVkUHJvcGVydHk6IGVuYWJsZWRQcm9wZXJ0eVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZW5hYmxlZENoZWNrYm94ID0gbmV3IENoZWNrYm94KCBlbmFibGVkUHJvcGVydHksIG5ldyBUZXh0KCAnZW5hYmxlZCcsIHtcclxuICAgIGZvbnQ6IG5ldyBGb250KCB7IHNpemU6IDIwIH0gKVxyXG4gIH0gKSApO1xyXG5cclxuICByZXR1cm4gbmV3IFZCb3goIHtcclxuICAgIGNoaWxkcmVuOiBbIGNoZWNrYm94LCBlbmFibGVkQ2hlY2tib3ggXSxcclxuICAgIHNwYWNpbmc6IDMwLFxyXG4gICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgfSApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSx3Q0FBd0M7QUFFcEUsU0FBU0MsSUFBSSxFQUFRQyxJQUFJLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDMUUsT0FBT0MsUUFBUSxNQUFNLG1CQUFtQjtBQUV4QyxlQUFlLFNBQVNDLFlBQVlBLENBQUVDLFlBQXFCLEVBQVM7RUFFbEUsTUFBTUMsUUFBUSxHQUFHLElBQUlQLGVBQWUsQ0FBRSxJQUFLLENBQUM7RUFDNUMsTUFBTVEsZUFBZSxHQUFHLElBQUlSLGVBQWUsQ0FBRSxJQUFJLEVBQUU7SUFBRVMsY0FBYyxFQUFFO0VBQUssQ0FBRSxDQUFDO0VBRTdFLE1BQU1DLFFBQVEsR0FBRyxJQUFJTixRQUFRLENBQUVHLFFBQVEsRUFBRSxJQUFJTCxJQUFJLENBQUUscUJBQXFCLEVBQUU7SUFDeEVTLElBQUksRUFBRSxJQUFJVixJQUFJLENBQUU7TUFBRVcsSUFBSSxFQUFFO0lBQUcsQ0FBRTtFQUMvQixDQUFFLENBQUMsRUFBRTtJQUNISixlQUFlLEVBQUVBO0VBQ25CLENBQUUsQ0FBQztFQUVILE1BQU1LLGVBQWUsR0FBRyxJQUFJVCxRQUFRLENBQUVJLGVBQWUsRUFBRSxJQUFJTixJQUFJLENBQUUsU0FBUyxFQUFFO0lBQzFFUyxJQUFJLEVBQUUsSUFBSVYsSUFBSSxDQUFFO01BQUVXLElBQUksRUFBRTtJQUFHLENBQUU7RUFDL0IsQ0FBRSxDQUFFLENBQUM7RUFFTCxPQUFPLElBQUlULElBQUksQ0FBRTtJQUNmVyxRQUFRLEVBQUUsQ0FBRUosUUFBUSxFQUFFRyxlQUFlLENBQUU7SUFDdkNFLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLE1BQU0sRUFBRVYsWUFBWSxDQUFDVTtFQUN2QixDQUFFLENBQUM7QUFDTCIsImlnbm9yZUxpc3QiOltdfQ==