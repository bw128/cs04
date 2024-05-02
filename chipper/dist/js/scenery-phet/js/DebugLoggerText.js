// Copyright 2019-2023, University of Colorado Boulder

/**
 * DebugLoggerText is a node that can be added as a child to the view and can show debug log messages.
 * This is most often used when a console is not available, such as when debugging on iPads or other tablets.
 *
 * Typically, an instance of this is created and made global for use on a given screen.  Example:
 *   phet.debugLoggerNode = new DebugLoggerText();
 *   this.addChild( phet.debugLoggerNode );
 *
 * ...and then logging is accomplished by calling the logger like this:
 *   phet.debugLoggerNode.log( 'my insightful message' );
 *
 * Tip from MK - start by putting the above line in assert.js
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import Vector2 from '../../dot/js/Vector2.js';
import merge from '../../phet-core/js/merge.js';
import { Color, RichText } from '../../scenery/js/imports.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';

// constants
const DEFAULT_NUM_MESSAGES = 4;
const DEFAULT_POSITION = new Vector2(20, 20);
const DEFAULT_FONT = new PhetFont(20);
const DEFAULT_TEXT_COLOR = Color.red;
class DebugLoggerText extends RichText {
  /**
   * @param {Object} [options]
   * @constructor
   */
  constructor(options) {
    options = merge({
      left: DEFAULT_POSITION.x,
      top: DEFAULT_POSITION.y,
      numMessagesToDisplay: DEFAULT_NUM_MESSAGES,
      font: DEFAULT_FONT,
      fill: DEFAULT_TEXT_COLOR
    }, options);
    super('', options);
    this.numMessagesToDisplay = options.numMessagesToDisplay;
    this.messages = [];
  }

  /**
   * log a message
   * @param {string} message
   * @public
   */
  log(message) {
    if (this.messages.length >= this.numMessagesToDisplay) {
      // remove the oldest message
      this.messages.pop();
    }

    // add the newest message
    this.messages.unshift(message);

    // munge the messages together and set the value of the text
    this.string = _.reduce(this.messages, (memo, compositeMessage) => {
      return `${memo}<br>${compositeMessage}`;
    });
  }
}
sceneryPhet.register('DebugLoggerText', DebugLoggerText);
export default DebugLoggerText;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwibWVyZ2UiLCJDb2xvciIsIlJpY2hUZXh0IiwiUGhldEZvbnQiLCJzY2VuZXJ5UGhldCIsIkRFRkFVTFRfTlVNX01FU1NBR0VTIiwiREVGQVVMVF9QT1NJVElPTiIsIkRFRkFVTFRfRk9OVCIsIkRFRkFVTFRfVEVYVF9DT0xPUiIsInJlZCIsIkRlYnVnTG9nZ2VyVGV4dCIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsImxlZnQiLCJ4IiwidG9wIiwieSIsIm51bU1lc3NhZ2VzVG9EaXNwbGF5IiwiZm9udCIsImZpbGwiLCJtZXNzYWdlcyIsImxvZyIsIm1lc3NhZ2UiLCJsZW5ndGgiLCJwb3AiLCJ1bnNoaWZ0Iiwic3RyaW5nIiwiXyIsInJlZHVjZSIsIm1lbW8iLCJjb21wb3NpdGVNZXNzYWdlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJEZWJ1Z0xvZ2dlclRleHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRGVidWdMb2dnZXJUZXh0IGlzIGEgbm9kZSB0aGF0IGNhbiBiZSBhZGRlZCBhcyBhIGNoaWxkIHRvIHRoZSB2aWV3IGFuZCBjYW4gc2hvdyBkZWJ1ZyBsb2cgbWVzc2FnZXMuXHJcbiAqIFRoaXMgaXMgbW9zdCBvZnRlbiB1c2VkIHdoZW4gYSBjb25zb2xlIGlzIG5vdCBhdmFpbGFibGUsIHN1Y2ggYXMgd2hlbiBkZWJ1Z2dpbmcgb24gaVBhZHMgb3Igb3RoZXIgdGFibGV0cy5cclxuICpcclxuICogVHlwaWNhbGx5LCBhbiBpbnN0YW5jZSBvZiB0aGlzIGlzIGNyZWF0ZWQgYW5kIG1hZGUgZ2xvYmFsIGZvciB1c2Ugb24gYSBnaXZlbiBzY3JlZW4uICBFeGFtcGxlOlxyXG4gKiAgIHBoZXQuZGVidWdMb2dnZXJOb2RlID0gbmV3IERlYnVnTG9nZ2VyVGV4dCgpO1xyXG4gKiAgIHRoaXMuYWRkQ2hpbGQoIHBoZXQuZGVidWdMb2dnZXJOb2RlICk7XHJcbiAqXHJcbiAqIC4uLmFuZCB0aGVuIGxvZ2dpbmcgaXMgYWNjb21wbGlzaGVkIGJ5IGNhbGxpbmcgdGhlIGxvZ2dlciBsaWtlIHRoaXM6XHJcbiAqICAgcGhldC5kZWJ1Z0xvZ2dlck5vZGUubG9nKCAnbXkgaW5zaWdodGZ1bCBtZXNzYWdlJyApO1xyXG4gKlxyXG4gKiBUaXAgZnJvbSBNSyAtIHN0YXJ0IGJ5IHB1dHRpbmcgdGhlIGFib3ZlIGxpbmUgaW4gYXNzZXJ0LmpzXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY28gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHsgQ29sb3IsIFJpY2hUZXh0IH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4vUGhldEZvbnQuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgREVGQVVMVF9OVU1fTUVTU0FHRVMgPSA0O1xyXG5jb25zdCBERUZBVUxUX1BPU0lUSU9OID0gbmV3IFZlY3RvcjIoIDIwLCAyMCApO1xyXG5jb25zdCBERUZBVUxUX0ZPTlQgPSBuZXcgUGhldEZvbnQoIDIwICk7XHJcbmNvbnN0IERFRkFVTFRfVEVYVF9DT0xPUiA9IENvbG9yLnJlZDtcclxuXHJcbmNsYXNzIERlYnVnTG9nZ2VyVGV4dCBleHRlbmRzIFJpY2hUZXh0IHtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAqIEBjb25zdHJ1Y3RvclxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBvcHRpb25zICkge1xyXG5cclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge1xyXG4gICAgICBsZWZ0OiBERUZBVUxUX1BPU0lUSU9OLngsXHJcbiAgICAgIHRvcDogREVGQVVMVF9QT1NJVElPTi55LFxyXG4gICAgICBudW1NZXNzYWdlc1RvRGlzcGxheTogREVGQVVMVF9OVU1fTUVTU0FHRVMsXHJcbiAgICAgIGZvbnQ6IERFRkFVTFRfRk9OVCxcclxuICAgICAgZmlsbDogREVGQVVMVF9URVhUX0NPTE9SXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoICcnLCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5udW1NZXNzYWdlc1RvRGlzcGxheSA9IG9wdGlvbnMubnVtTWVzc2FnZXNUb0Rpc3BsYXk7XHJcbiAgICB0aGlzLm1lc3NhZ2VzID0gW107XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBsb2cgYSBtZXNzYWdlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgbG9nKCBtZXNzYWdlICkge1xyXG5cclxuICAgIGlmICggdGhpcy5tZXNzYWdlcy5sZW5ndGggPj0gdGhpcy5udW1NZXNzYWdlc1RvRGlzcGxheSApIHtcclxuXHJcbiAgICAgIC8vIHJlbW92ZSB0aGUgb2xkZXN0IG1lc3NhZ2VcclxuICAgICAgdGhpcy5tZXNzYWdlcy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgdGhlIG5ld2VzdCBtZXNzYWdlXHJcbiAgICB0aGlzLm1lc3NhZ2VzLnVuc2hpZnQoIG1lc3NhZ2UgKTtcclxuXHJcbiAgICAvLyBtdW5nZSB0aGUgbWVzc2FnZXMgdG9nZXRoZXIgYW5kIHNldCB0aGUgdmFsdWUgb2YgdGhlIHRleHRcclxuICAgIHRoaXMuc3RyaW5nID0gXy5yZWR1Y2UoIHRoaXMubWVzc2FnZXMsICggbWVtbywgY29tcG9zaXRlTWVzc2FnZSApID0+IHtcclxuICAgICAgcmV0dXJuIGAke21lbW99PGJyPiR7Y29tcG9zaXRlTWVzc2FnZX1gO1xyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdEZWJ1Z0xvZ2dlclRleHQnLCBEZWJ1Z0xvZ2dlclRleHQgKTtcclxuZXhwb3J0IGRlZmF1bHQgRGVidWdMb2dnZXJUZXh0OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSx5QkFBeUI7QUFDN0MsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxTQUFTQyxLQUFLLEVBQUVDLFFBQVEsUUFBUSw2QkFBNkI7QUFDN0QsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjs7QUFFMUM7QUFDQSxNQUFNQyxvQkFBb0IsR0FBRyxDQUFDO0FBQzlCLE1BQU1DLGdCQUFnQixHQUFHLElBQUlQLE9BQU8sQ0FBRSxFQUFFLEVBQUUsRUFBRyxDQUFDO0FBQzlDLE1BQU1RLFlBQVksR0FBRyxJQUFJSixRQUFRLENBQUUsRUFBRyxDQUFDO0FBQ3ZDLE1BQU1LLGtCQUFrQixHQUFHUCxLQUFLLENBQUNRLEdBQUc7QUFFcEMsTUFBTUMsZUFBZSxTQUFTUixRQUFRLENBQUM7RUFFckM7QUFDRjtBQUNBO0FBQ0E7RUFDRVMsV0FBV0EsQ0FBRUMsT0FBTyxFQUFHO0lBRXJCQSxPQUFPLEdBQUdaLEtBQUssQ0FBRTtNQUNmYSxJQUFJLEVBQUVQLGdCQUFnQixDQUFDUSxDQUFDO01BQ3hCQyxHQUFHLEVBQUVULGdCQUFnQixDQUFDVSxDQUFDO01BQ3ZCQyxvQkFBb0IsRUFBRVosb0JBQW9CO01BQzFDYSxJQUFJLEVBQUVYLFlBQVk7TUFDbEJZLElBQUksRUFBRVg7SUFDUixDQUFDLEVBQUVJLE9BQVEsQ0FBQztJQUVaLEtBQUssQ0FBRSxFQUFFLEVBQUVBLE9BQVEsQ0FBQztJQUVwQixJQUFJLENBQUNLLG9CQUFvQixHQUFHTCxPQUFPLENBQUNLLG9CQUFvQjtJQUN4RCxJQUFJLENBQUNHLFFBQVEsR0FBRyxFQUFFO0VBQ3BCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsR0FBR0EsQ0FBRUMsT0FBTyxFQUFHO0lBRWIsSUFBSyxJQUFJLENBQUNGLFFBQVEsQ0FBQ0csTUFBTSxJQUFJLElBQUksQ0FBQ04sb0JBQW9CLEVBQUc7TUFFdkQ7TUFDQSxJQUFJLENBQUNHLFFBQVEsQ0FBQ0ksR0FBRyxDQUFDLENBQUM7SUFDckI7O0lBRUE7SUFDQSxJQUFJLENBQUNKLFFBQVEsQ0FBQ0ssT0FBTyxDQUFFSCxPQUFRLENBQUM7O0lBRWhDO0lBQ0EsSUFBSSxDQUFDSSxNQUFNLEdBQUdDLENBQUMsQ0FBQ0MsTUFBTSxDQUFFLElBQUksQ0FBQ1IsUUFBUSxFQUFFLENBQUVTLElBQUksRUFBRUMsZ0JBQWdCLEtBQU07TUFDbkUsT0FBUSxHQUFFRCxJQUFLLE9BQU1DLGdCQUFpQixFQUFDO0lBQ3pDLENBQUUsQ0FBQztFQUNMO0FBQ0Y7QUFFQTFCLFdBQVcsQ0FBQzJCLFFBQVEsQ0FBRSxpQkFBaUIsRUFBRXJCLGVBQWdCLENBQUM7QUFDMUQsZUFBZUEsZUFBZSIsImlnbm9yZUxpc3QiOltdfQ==