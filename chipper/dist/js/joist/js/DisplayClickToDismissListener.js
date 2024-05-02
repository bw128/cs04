// Copyright 2021-2024, University of Colorado Boulder

/**
 * A listener that can be added to a Display to (typically) dismiss a UI component after we receive a press.
 * Provide a listener to be called when the Pointer is released. It will be called unless this there is
 * listener cancel/interruption.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import joist from './joist.js';
import dotRandom from '../../dot/js/dotRandom.js';
class DisplayClickToDismissListener {
  /**
   * @param listener - The listener to be called when the Pointer goes up, likely to dismiss something.
   */
  constructor(listener) {
    // The active Pointer for this listener, after a down event a subsequent up event on this Pointer will trigger
    // the behavior of `listener`.
    this.pointer = null;

    // A listener added to the Pointer on a down event which will do the work of `listener` when the pointer is
    // released. If this Pointer listener is interrupted we will never call the `listener`.
    this.pointerListener = {
      up: event => {
        listener(event);
        this.dismissPointer(this.pointer);
      },
      interrupt: () => {
        this.dismissPointer(this.pointer);
      },
      cancel: () => {
        this.dismissPointer(this.pointer);
      }
    };
  }

  /**
   * Part of the scenery Input API.
   */
  down(event) {
    // When fuzz testing we want to exercise the component that is going to be dismissed so this should keep it up
    // long enough to hopefully receive some fuzzing.
    if (phet.chipper.isFuzzEnabled() && dotRandom.nextDouble() < 0.99) {
      return;
    }
    this.observePointer(event.pointer);
  }

  /**
   * Attach a listener to the Pointer that will watch when it goes up.
   */
  observePointer(pointer) {
    // only observe one Pointer (for multitouch) and don't try to add a listener if the Pointer is already attached
    if (this.pointer === null && !pointer.isAttached()) {
      this.pointer = pointer;
      this.pointer.addInputListener(this.pointerListener, true);
    }
  }

  /**
   * Remove the attached listener from the Pointer and clear it (if we are observing currently observing a Pointer).
   */
  dismissPointer(pointer) {
    if (this.pointer !== null) {
      assert && assert(this.pointerListener, 'There should be a pointerListener to remove.');
      this.pointer.removeInputListener(this.pointerListener);
      this.pointer = null;
    }
  }
  dispose() {
    this.dismissPointer(this.pointer);
  }
}
joist.register('DisplayClickToDismissListener', DisplayClickToDismissListener);
export default DisplayClickToDismissListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJqb2lzdCIsImRvdFJhbmRvbSIsIkRpc3BsYXlDbGlja1RvRGlzbWlzc0xpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJsaXN0ZW5lciIsInBvaW50ZXIiLCJwb2ludGVyTGlzdGVuZXIiLCJ1cCIsImV2ZW50IiwiZGlzbWlzc1BvaW50ZXIiLCJpbnRlcnJ1cHQiLCJjYW5jZWwiLCJkb3duIiwicGhldCIsImNoaXBwZXIiLCJpc0Z1enpFbmFibGVkIiwibmV4dERvdWJsZSIsIm9ic2VydmVQb2ludGVyIiwiaXNBdHRhY2hlZCIsImFkZElucHV0TGlzdGVuZXIiLCJhc3NlcnQiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRGlzcGxheUNsaWNrVG9EaXNtaXNzTGlzdGVuZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBsaXN0ZW5lciB0aGF0IGNhbiBiZSBhZGRlZCB0byBhIERpc3BsYXkgdG8gKHR5cGljYWxseSkgZGlzbWlzcyBhIFVJIGNvbXBvbmVudCBhZnRlciB3ZSByZWNlaXZlIGEgcHJlc3MuXHJcbiAqIFByb3ZpZGUgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgUG9pbnRlciBpcyByZWxlYXNlZC4gSXQgd2lsbCBiZSBjYWxsZWQgdW5sZXNzIHRoaXMgdGhlcmUgaXNcclxuICogbGlzdGVuZXIgY2FuY2VsL2ludGVycnVwdGlvbi5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGpvaXN0IGZyb20gJy4vam9pc3QuanMnO1xyXG5pbXBvcnQgeyBQb2ludGVyLCBTY2VuZXJ5RXZlbnQsIFNjZW5lcnlMaXN0ZW5lckZ1bmN0aW9uLCBUSW5wdXRMaXN0ZW5lciB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcblxyXG5jbGFzcyBEaXNwbGF5Q2xpY2tUb0Rpc21pc3NMaXN0ZW5lciB7XHJcbiAgcHJpdmF0ZSBwb2ludGVyOiBudWxsIHwgUG9pbnRlcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBvaW50ZXJMaXN0ZW5lcjogVElucHV0TGlzdGVuZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBsaXN0ZW5lciAtIFRoZSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgUG9pbnRlciBnb2VzIHVwLCBsaWtlbHkgdG8gZGlzbWlzcyBzb21ldGhpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBsaXN0ZW5lcjogU2NlbmVyeUxpc3RlbmVyRnVuY3Rpb24gKSB7XHJcblxyXG4gICAgLy8gVGhlIGFjdGl2ZSBQb2ludGVyIGZvciB0aGlzIGxpc3RlbmVyLCBhZnRlciBhIGRvd24gZXZlbnQgYSBzdWJzZXF1ZW50IHVwIGV2ZW50IG9uIHRoaXMgUG9pbnRlciB3aWxsIHRyaWdnZXJcclxuICAgIC8vIHRoZSBiZWhhdmlvciBvZiBgbGlzdGVuZXJgLlxyXG4gICAgdGhpcy5wb2ludGVyID0gbnVsbDtcclxuXHJcbiAgICAvLyBBIGxpc3RlbmVyIGFkZGVkIHRvIHRoZSBQb2ludGVyIG9uIGEgZG93biBldmVudCB3aGljaCB3aWxsIGRvIHRoZSB3b3JrIG9mIGBsaXN0ZW5lcmAgd2hlbiB0aGUgcG9pbnRlciBpc1xyXG4gICAgLy8gcmVsZWFzZWQuIElmIHRoaXMgUG9pbnRlciBsaXN0ZW5lciBpcyBpbnRlcnJ1cHRlZCB3ZSB3aWxsIG5ldmVyIGNhbGwgdGhlIGBsaXN0ZW5lcmAuXHJcbiAgICB0aGlzLnBvaW50ZXJMaXN0ZW5lciA9IHtcclxuICAgICAgdXA6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHtcclxuICAgICAgICBsaXN0ZW5lciggZXZlbnQgKTtcclxuICAgICAgICB0aGlzLmRpc21pc3NQb2ludGVyKCB0aGlzLnBvaW50ZXIgKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGludGVycnVwdDogKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzbWlzc1BvaW50ZXIoIHRoaXMucG9pbnRlciApO1xyXG4gICAgICB9LFxyXG4gICAgICBjYW5jZWw6ICgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc21pc3NQb2ludGVyKCB0aGlzLnBvaW50ZXIgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnQgb2YgdGhlIHNjZW5lcnkgSW5wdXQgQVBJLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkb3duKCBldmVudDogU2NlbmVyeUV2ZW50ICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFdoZW4gZnV6eiB0ZXN0aW5nIHdlIHdhbnQgdG8gZXhlcmNpc2UgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGdvaW5nIHRvIGJlIGRpc21pc3NlZCBzbyB0aGlzIHNob3VsZCBrZWVwIGl0IHVwXHJcbiAgICAvLyBsb25nIGVub3VnaCB0byBob3BlZnVsbHkgcmVjZWl2ZSBzb21lIGZ1enppbmcuXHJcbiAgICBpZiAoIHBoZXQuY2hpcHBlci5pc0Z1enpFbmFibGVkKCkgJiYgZG90UmFuZG9tLm5leHREb3VibGUoKSA8IDAuOTkgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9ic2VydmVQb2ludGVyKCBldmVudC5wb2ludGVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRhY2ggYSBsaXN0ZW5lciB0byB0aGUgUG9pbnRlciB0aGF0IHdpbGwgd2F0Y2ggd2hlbiBpdCBnb2VzIHVwLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb2JzZXJ2ZVBvaW50ZXIoIHBvaW50ZXI6IFBvaW50ZXIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gb25seSBvYnNlcnZlIG9uZSBQb2ludGVyIChmb3IgbXVsdGl0b3VjaCkgYW5kIGRvbid0IHRyeSB0byBhZGQgYSBsaXN0ZW5lciBpZiB0aGUgUG9pbnRlciBpcyBhbHJlYWR5IGF0dGFjaGVkXHJcbiAgICBpZiAoIHRoaXMucG9pbnRlciA9PT0gbnVsbCAmJiAhcG9pbnRlci5pc0F0dGFjaGVkKCkgKSB7XHJcbiAgICAgIHRoaXMucG9pbnRlciA9IHBvaW50ZXI7XHJcbiAgICAgIHRoaXMucG9pbnRlci5hZGRJbnB1dExpc3RlbmVyKCB0aGlzLnBvaW50ZXJMaXN0ZW5lciwgdHJ1ZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIHRoZSBhdHRhY2hlZCBsaXN0ZW5lciBmcm9tIHRoZSBQb2ludGVyIGFuZCBjbGVhciBpdCAoaWYgd2UgYXJlIG9ic2VydmluZyBjdXJyZW50bHkgb2JzZXJ2aW5nIGEgUG9pbnRlcikuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkaXNtaXNzUG9pbnRlciggcG9pbnRlcjogUG9pbnRlciB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMucG9pbnRlciAhPT0gbnVsbCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wb2ludGVyTGlzdGVuZXIsICdUaGVyZSBzaG91bGQgYmUgYSBwb2ludGVyTGlzdGVuZXIgdG8gcmVtb3ZlLicgKTtcclxuICAgICAgdGhpcy5wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMucG9pbnRlckxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMucG9pbnRlciA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzbWlzc1BvaW50ZXIoIHRoaXMucG9pbnRlciApO1xyXG4gIH1cclxufVxyXG5cclxuam9pc3QucmVnaXN0ZXIoICdEaXNwbGF5Q2xpY2tUb0Rpc21pc3NMaXN0ZW5lcicsIERpc3BsYXlDbGlja1RvRGlzbWlzc0xpc3RlbmVyICk7XHJcbmV4cG9ydCBkZWZhdWx0IERpc3BsYXlDbGlja1RvRGlzbWlzc0xpc3RlbmVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsS0FBSyxNQUFNLFlBQVk7QUFFOUIsT0FBT0MsU0FBUyxNQUFNLDJCQUEyQjtBQUVqRCxNQUFNQyw2QkFBNkIsQ0FBQztFQUlsQztBQUNGO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBRUMsUUFBaUMsRUFBRztJQUV0RDtJQUNBO0lBQ0EsSUFBSSxDQUFDQyxPQUFPLEdBQUcsSUFBSTs7SUFFbkI7SUFDQTtJQUNBLElBQUksQ0FBQ0MsZUFBZSxHQUFHO01BQ3JCQyxFQUFFLEVBQUlDLEtBQW1CLElBQU07UUFDN0JKLFFBQVEsQ0FBRUksS0FBTSxDQUFDO1FBQ2pCLElBQUksQ0FBQ0MsY0FBYyxDQUFFLElBQUksQ0FBQ0osT0FBUSxDQUFDO01BQ3JDLENBQUM7TUFFREssU0FBUyxFQUFFQSxDQUFBLEtBQU07UUFDZixJQUFJLENBQUNELGNBQWMsQ0FBRSxJQUFJLENBQUNKLE9BQVEsQ0FBQztNQUNyQyxDQUFDO01BQ0RNLE1BQU0sRUFBRUEsQ0FBQSxLQUFNO1FBQ1osSUFBSSxDQUFDRixjQUFjLENBQUUsSUFBSSxDQUFDSixPQUFRLENBQUM7TUFDckM7SUFDRixDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0VBQ1NPLElBQUlBLENBQUVKLEtBQW1CLEVBQVM7SUFFdkM7SUFDQTtJQUNBLElBQUtLLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxhQUFhLENBQUMsQ0FBQyxJQUFJZCxTQUFTLENBQUNlLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFHO01BQ25FO0lBQ0Y7SUFFQSxJQUFJLENBQUNDLGNBQWMsQ0FBRVQsS0FBSyxDQUFDSCxPQUFRLENBQUM7RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0VBQ1VZLGNBQWNBLENBQUVaLE9BQWdCLEVBQVM7SUFFL0M7SUFDQSxJQUFLLElBQUksQ0FBQ0EsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDQSxPQUFPLENBQUNhLFVBQVUsQ0FBQyxDQUFDLEVBQUc7TUFDcEQsSUFBSSxDQUFDYixPQUFPLEdBQUdBLE9BQU87TUFDdEIsSUFBSSxDQUFDQSxPQUFPLENBQUNjLGdCQUFnQixDQUFFLElBQUksQ0FBQ2IsZUFBZSxFQUFFLElBQUssQ0FBQztJQUM3RDtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNVRyxjQUFjQSxDQUFFSixPQUF1QixFQUFTO0lBQ3RELElBQUssSUFBSSxDQUFDQSxPQUFPLEtBQUssSUFBSSxFQUFHO01BQzNCZSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNkLGVBQWUsRUFBRSw4Q0FBK0MsQ0FBQztNQUN4RixJQUFJLENBQUNELE9BQU8sQ0FBQ2dCLG1CQUFtQixDQUFFLElBQUksQ0FBQ2YsZUFBZ0IsQ0FBQztNQUN4RCxJQUFJLENBQUNELE9BQU8sR0FBRyxJQUFJO0lBQ3JCO0VBQ0Y7RUFFT2lCLE9BQU9BLENBQUEsRUFBUztJQUNyQixJQUFJLENBQUNiLGNBQWMsQ0FBRSxJQUFJLENBQUNKLE9BQVEsQ0FBQztFQUNyQztBQUNGO0FBRUFMLEtBQUssQ0FBQ3VCLFFBQVEsQ0FBRSwrQkFBK0IsRUFBRXJCLDZCQUE4QixDQUFDO0FBQ2hGLGVBQWVBLDZCQUE2QiIsImlnbm9yZUxpc3QiOltdfQ==