// Copyright 2022, University of Colorado Boulder

/**
 * Creates a demo for ComboBoxDisplay that exercises layout functionality.
 * See https://github.com/phetsims/scenery-phet/issues/482
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import StringProperty from '../../../../axon/js/StringProperty.js';
import Range from '../../../../dot/js/Range.js';
import { HBox, Node, Text, VBox } from '../../../../scenery/js/imports.js';
import VSlider from '../../../../sun/js/VSlider.js';
import ComboBoxDisplay from '../../ComboBoxDisplay.js';
import PhetFont from '../../PhetFont.js';
export default function demoComboBoxDisplay(layoutBounds) {
  const numberOfDogsProperty = new NumberProperty(0); // value to be displayed for dogs
  const numberOfCatsProperty = new DerivedProperty([numberOfDogsProperty], () => numberOfDogsProperty.value * 2);
  const choiceProperty = new StringProperty('dogs'); // selected choice in the combo box
  const displayRange = new Range(0, 1000);
  const sliderRange = new Range(0, 1000); // larger than display range, to verify that display scales

  // items in the ComboBoxDisplay
  const items = [{
    choice: 'dogs',
    numberProperty: numberOfDogsProperty,
    range: displayRange,
    units: 'dogs'
  }, {
    choice: 'cats',
    numberProperty: numberOfCatsProperty,
    range: displayRange,
    units: 'cats'
  }];

  // parent for the ComboBoxDisplay's popup list
  const listParent = new Node();

  // ComboBoxDisplay
  const display = new ComboBoxDisplay(choiceProperty, items, listParent, {
    xMargin: 10,
    yMargin: 8,
    highlightFill: 'rgb( 255, 200, 200 )',
    // pink
    numberDisplayOptions: {
      textOptions: {
        font: new PhetFont(20)
      }
    }
  });

  // Slider
  const slider = new VSlider(numberOfDogsProperty, sliderRange);

  // Slider to left of display
  const hBox = new HBox({
    spacing: 25,
    children: [slider, display]
  });
  return new Node({
    children: [new VBox({
      children: [new Text('There are twice as many cats as dogs in the world.'), hBox],
      spacing: 20,
      center: layoutBounds.center
    }), listParent]
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJOdW1iZXJQcm9wZXJ0eSIsIlN0cmluZ1Byb3BlcnR5IiwiUmFuZ2UiLCJIQm94IiwiTm9kZSIsIlRleHQiLCJWQm94IiwiVlNsaWRlciIsIkNvbWJvQm94RGlzcGxheSIsIlBoZXRGb250IiwiZGVtb0NvbWJvQm94RGlzcGxheSIsImxheW91dEJvdW5kcyIsIm51bWJlck9mRG9nc1Byb3BlcnR5IiwibnVtYmVyT2ZDYXRzUHJvcGVydHkiLCJ2YWx1ZSIsImNob2ljZVByb3BlcnR5IiwiZGlzcGxheVJhbmdlIiwic2xpZGVyUmFuZ2UiLCJpdGVtcyIsImNob2ljZSIsIm51bWJlclByb3BlcnR5IiwicmFuZ2UiLCJ1bml0cyIsImxpc3RQYXJlbnQiLCJkaXNwbGF5IiwieE1hcmdpbiIsInlNYXJnaW4iLCJoaWdobGlnaHRGaWxsIiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJ0ZXh0T3B0aW9ucyIsImZvbnQiLCJzbGlkZXIiLCJoQm94Iiwic3BhY2luZyIsImNoaWxkcmVuIiwiY2VudGVyIl0sInNvdXJjZXMiOlsiZGVtb0NvbWJvQm94RGlzcGxheS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGRlbW8gZm9yIENvbWJvQm94RGlzcGxheSB0aGF0IGV4ZXJjaXNlcyBsYXlvdXQgZnVuY3Rpb25hbGl0eS5cclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzQ4MlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBTdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1N0cmluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IHsgSEJveCwgTm9kZSwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBWU2xpZGVyIGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9WU2xpZGVyLmpzJztcclxuaW1wb3J0IENvbWJvQm94RGlzcGxheSBmcm9tICcuLi8uLi9Db21ib0JveERpc3BsYXkuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi4vLi4vUGhldEZvbnQuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGVtb0NvbWJvQm94RGlzcGxheSggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICk6IE5vZGUge1xyXG5cclxuICBjb25zdCBudW1iZXJPZkRvZ3NQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCApOyAvLyB2YWx1ZSB0byBiZSBkaXNwbGF5ZWQgZm9yIGRvZ3NcclxuICBjb25zdCBudW1iZXJPZkNhdHNQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgbnVtYmVyT2ZEb2dzUHJvcGVydHkgXSwgKCkgPT4gbnVtYmVyT2ZEb2dzUHJvcGVydHkudmFsdWUgKiAyICk7XHJcbiAgY29uc3QgY2hvaWNlUHJvcGVydHkgPSBuZXcgU3RyaW5nUHJvcGVydHkoICdkb2dzJyApOyAgLy8gc2VsZWN0ZWQgY2hvaWNlIGluIHRoZSBjb21ibyBib3hcclxuICBjb25zdCBkaXNwbGF5UmFuZ2UgPSBuZXcgUmFuZ2UoIDAsIDEwMDAgKTtcclxuICBjb25zdCBzbGlkZXJSYW5nZSA9IG5ldyBSYW5nZSggMCwgMTAwMCApOyAvLyBsYXJnZXIgdGhhbiBkaXNwbGF5IHJhbmdlLCB0byB2ZXJpZnkgdGhhdCBkaXNwbGF5IHNjYWxlc1xyXG5cclxuICAvLyBpdGVtcyBpbiB0aGUgQ29tYm9Cb3hEaXNwbGF5XHJcbiAgY29uc3QgaXRlbXMgPSBbXHJcbiAgICB7IGNob2ljZTogJ2RvZ3MnLCBudW1iZXJQcm9wZXJ0eTogbnVtYmVyT2ZEb2dzUHJvcGVydHksIHJhbmdlOiBkaXNwbGF5UmFuZ2UsIHVuaXRzOiAnZG9ncycgfSxcclxuICAgIHsgY2hvaWNlOiAnY2F0cycsIG51bWJlclByb3BlcnR5OiBudW1iZXJPZkNhdHNQcm9wZXJ0eSwgcmFuZ2U6IGRpc3BsYXlSYW5nZSwgdW5pdHM6ICdjYXRzJyB9XHJcbiAgXTtcclxuXHJcbiAgLy8gcGFyZW50IGZvciB0aGUgQ29tYm9Cb3hEaXNwbGF5J3MgcG9wdXAgbGlzdFxyXG4gIGNvbnN0IGxpc3RQYXJlbnQgPSBuZXcgTm9kZSgpO1xyXG5cclxuICAvLyBDb21ib0JveERpc3BsYXlcclxuICBjb25zdCBkaXNwbGF5ID0gbmV3IENvbWJvQm94RGlzcGxheTxzdHJpbmc+KCBjaG9pY2VQcm9wZXJ0eSwgaXRlbXMsIGxpc3RQYXJlbnQsIHtcclxuICAgIHhNYXJnaW46IDEwLFxyXG4gICAgeU1hcmdpbjogOCxcclxuICAgIGhpZ2hsaWdodEZpbGw6ICdyZ2IoIDI1NSwgMjAwLCAyMDAgKScsIC8vIHBpbmtcclxuICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcbiAgICAgIHRleHRPcHRpb25zOiB7XHJcbiAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAyMCApXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIFNsaWRlclxyXG4gIGNvbnN0IHNsaWRlciA9IG5ldyBWU2xpZGVyKCBudW1iZXJPZkRvZ3NQcm9wZXJ0eSwgc2xpZGVyUmFuZ2UgKTtcclxuXHJcbiAgLy8gU2xpZGVyIHRvIGxlZnQgb2YgZGlzcGxheVxyXG4gIGNvbnN0IGhCb3ggPSBuZXcgSEJveCgge1xyXG4gICAgc3BhY2luZzogMjUsXHJcbiAgICBjaGlsZHJlbjogWyBzbGlkZXIsIGRpc3BsYXkgXVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICBjaGlsZHJlbjogWyBuZXcgVkJveCgge1xyXG4gICAgICBjaGlsZHJlbjogWyBuZXcgVGV4dCggJ1RoZXJlIGFyZSB0d2ljZSBhcyBtYW55IGNhdHMgYXMgZG9ncyBpbiB0aGUgd29ybGQuJyApLCBoQm94IF0sXHJcbiAgICAgIHNwYWNpbmc6IDIwLFxyXG4gICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICAgIH0gKSwgbGlzdFBhcmVudCBdXHJcbiAgfSApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHdDQUF3QztBQUNwRSxPQUFPQyxjQUFjLE1BQU0sdUNBQXVDO0FBQ2xFLE9BQU9DLGNBQWMsTUFBTSx1Q0FBdUM7QUFFbEUsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxTQUFTQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsbUNBQW1DO0FBQzFFLE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsZUFBZSxNQUFNLDBCQUEwQjtBQUN0RCxPQUFPQyxRQUFRLE1BQU0sbUJBQW1CO0FBRXhDLGVBQWUsU0FBU0MsbUJBQW1CQSxDQUFFQyxZQUFxQixFQUFTO0VBRXpFLE1BQU1DLG9CQUFvQixHQUFHLElBQUlaLGNBQWMsQ0FBRSxDQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3RELE1BQU1hLG9CQUFvQixHQUFHLElBQUlkLGVBQWUsQ0FBRSxDQUFFYSxvQkFBb0IsQ0FBRSxFQUFFLE1BQU1BLG9CQUFvQixDQUFDRSxLQUFLLEdBQUcsQ0FBRSxDQUFDO0VBQ2xILE1BQU1DLGNBQWMsR0FBRyxJQUFJZCxjQUFjLENBQUUsTUFBTyxDQUFDLENBQUMsQ0FBRTtFQUN0RCxNQUFNZSxZQUFZLEdBQUcsSUFBSWQsS0FBSyxDQUFFLENBQUMsRUFBRSxJQUFLLENBQUM7RUFDekMsTUFBTWUsV0FBVyxHQUFHLElBQUlmLEtBQUssQ0FBRSxDQUFDLEVBQUUsSUFBSyxDQUFDLENBQUMsQ0FBQzs7RUFFMUM7RUFDQSxNQUFNZ0IsS0FBSyxHQUFHLENBQ1o7SUFBRUMsTUFBTSxFQUFFLE1BQU07SUFBRUMsY0FBYyxFQUFFUixvQkFBb0I7SUFBRVMsS0FBSyxFQUFFTCxZQUFZO0lBQUVNLEtBQUssRUFBRTtFQUFPLENBQUMsRUFDNUY7SUFBRUgsTUFBTSxFQUFFLE1BQU07SUFBRUMsY0FBYyxFQUFFUCxvQkFBb0I7SUFBRVEsS0FBSyxFQUFFTCxZQUFZO0lBQUVNLEtBQUssRUFBRTtFQUFPLENBQUMsQ0FDN0Y7O0VBRUQ7RUFDQSxNQUFNQyxVQUFVLEdBQUcsSUFBSW5CLElBQUksQ0FBQyxDQUFDOztFQUU3QjtFQUNBLE1BQU1vQixPQUFPLEdBQUcsSUFBSWhCLGVBQWUsQ0FBVU8sY0FBYyxFQUFFRyxLQUFLLEVBQUVLLFVBQVUsRUFBRTtJQUM5RUUsT0FBTyxFQUFFLEVBQUU7SUFDWEMsT0FBTyxFQUFFLENBQUM7SUFDVkMsYUFBYSxFQUFFLHNCQUFzQjtJQUFFO0lBQ3ZDQyxvQkFBb0IsRUFBRTtNQUNwQkMsV0FBVyxFQUFFO1FBQ1hDLElBQUksRUFBRSxJQUFJckIsUUFBUSxDQUFFLEVBQUc7TUFDekI7SUFDRjtFQUNGLENBQUUsQ0FBQzs7RUFFSDtFQUNBLE1BQU1zQixNQUFNLEdBQUcsSUFBSXhCLE9BQU8sQ0FBRUssb0JBQW9CLEVBQUVLLFdBQVksQ0FBQzs7RUFFL0Q7RUFDQSxNQUFNZSxJQUFJLEdBQUcsSUFBSTdCLElBQUksQ0FBRTtJQUNyQjhCLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFFBQVEsRUFBRSxDQUFFSCxNQUFNLEVBQUVQLE9BQU87RUFDN0IsQ0FBRSxDQUFDO0VBRUgsT0FBTyxJQUFJcEIsSUFBSSxDQUFFO0lBQ2Y4QixRQUFRLEVBQUUsQ0FBRSxJQUFJNUIsSUFBSSxDQUFFO01BQ3BCNEIsUUFBUSxFQUFFLENBQUUsSUFBSTdCLElBQUksQ0FBRSxvREFBcUQsQ0FBQyxFQUFFMkIsSUFBSSxDQUFFO01BQ3BGQyxPQUFPLEVBQUUsRUFBRTtNQUNYRSxNQUFNLEVBQUV4QixZQUFZLENBQUN3QjtJQUN2QixDQUFFLENBQUMsRUFBRVosVUFBVTtFQUNqQixDQUFFLENBQUM7QUFDTCIsImlnbm9yZUxpc3QiOltdfQ==