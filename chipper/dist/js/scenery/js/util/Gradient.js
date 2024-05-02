// Copyright 2013-2024, University of Colorado Boulder

/**
 * Abstract base type for LinearGradient and RadialGradient.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import cleanArray from '../../../phet-core/js/cleanArray.js';
import { Color, Paint, scenery } from '../imports.js';
import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
export default class Gradient extends Paint {
  // (scenery-internal)

  // lazily created

  // Whether we should force a check of whether stops have changed

  // Used to check to see if colors have changed since last time

  /**
   * TODO: add the ability to specify the color-stops inline. possibly [ [0,color1], [0.5,color2], [1,color3] ] https://github.com/phetsims/scenery/issues/1581
   */
  constructor() {
    super();
    assert && assert(this.constructor.name !== 'Gradient', 'Please create a LinearGradient or RadialGradient. Do not directly use the supertype Gradient.');
    this.stops = [];
    this.lastStopRatio = 0;
    this.canvasGradient = null;
    this.colorStopsDirty = false;
    this.lastColorStopValues = [];
  }

  /**
   * Adds a color stop to the gradient.
   *
   * Color stops should be added in order (monotonically increasing ratio values).
   *
   * NOTE: Color stops should only be added before using the gradient as a fill/stroke. Adding stops afterwards
   *       will result in undefined behavior.
   * TODO: Catch attempts to do the above. https://github.com/phetsims/scenery/issues/1581
   *
   * @param ratio - Monotonically increasing value in the range of 0 to 1
   * @param color
   * @returns - for chaining
   */
  addColorStop(ratio, color) {
    assert && assert(ratio >= 0 && ratio <= 1, 'Ratio needs to be between 0,1 inclusively');
    assert && assert(color === null || typeof color === 'string' || color instanceof Color || isTReadOnlyProperty(color) && (color.value === null || typeof color.value === 'string' || color.value instanceof Color), 'Color should match the addColorStop type specification');
    if (this.lastStopRatio > ratio) {
      // fail out, since browser quirks go crazy for this case
      throw new Error('Color stops not specified in the order of increasing ratios');
    } else {
      this.lastStopRatio = ratio;
    }
    this.stops.push({
      ratio: ratio,
      color: color
    });

    // Easiest to just push a value here, so that it is always the same length as the stops array.
    this.lastColorStopValues.push('');
    return this;
  }

  /**
   * Subtypes should return a fresh CanvasGradient type.
   */

  /**
   * Returns stops suitable for direct SVG use.
   */
  getSVGStops() {
    return this.stops;
  }

  /**
   * Forces a re-check of whether colors have changed, so that the Canvas gradient can be regenerated if
   * necessary.
   */
  invalidateCanvasGradient() {
    sceneryLog && sceneryLog.Paints && sceneryLog.Paints(`Invalidated Canvas Gradient for #${this.id}`);
    this.colorStopsDirty = true;
  }

  /**
   * Compares the current color values with the last-recorded values for the current Canvas gradient.
   *
   * This is needed since the values of color properties (or the color itself) may change.
   */
  haveCanvasColorStopsChanged() {
    if (this.lastColorStopValues === null) {
      return true;
    }
    for (let i = 0; i < this.stops.length; i++) {
      if (Gradient.colorToString(this.stops[i].color) !== this.lastColorStopValues[i]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns an object that can be passed to a Canvas context's fillStyle or strokeStyle.
   */
  getCanvasStyle() {
    // Check if we need to regenerate the Canvas gradient
    if (!this.canvasGradient || this.colorStopsDirty && this.haveCanvasColorStopsChanged()) {
      sceneryLog && sceneryLog.Paints && sceneryLog.Paints(`Regenerating Canvas Gradient for #${this.id}`);
      sceneryLog && sceneryLog.Paints && sceneryLog.push();
      this.colorStopsDirty = false;
      cleanArray(this.lastColorStopValues);
      this.canvasGradient = this.createCanvasGradient();
      for (let i = 0; i < this.stops.length; i++) {
        const stop = this.stops[i];
        const colorString = Gradient.colorToString(stop.color);
        this.canvasGradient.addColorStop(stop.ratio, colorString);

        // Save it so we can compare next time whether our generated gradient would have changed
        this.lastColorStopValues.push(colorString);
      }
      sceneryLog && sceneryLog.Paints && sceneryLog.pop();
    }
    return this.canvasGradient;
  }

  /**
   * Returns the current value of the generally-allowed color types for Gradient, as a string.
   */
  static colorToString(color) {
    // to {Color|string|null}
    if (isTReadOnlyProperty(color)) {
      color = color.value;
    }

    // to {Color|string}
    if (color === null) {
      color = 'transparent';
    }

    // to {string}
    if (color instanceof Color) {
      color = color.toCSS();
    }
    return color;
  }
}
Gradient.prototype.isGradient = true;
scenery.register('Gradient', Gradient);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjbGVhbkFycmF5IiwiQ29sb3IiLCJQYWludCIsInNjZW5lcnkiLCJpc1RSZWFkT25seVByb3BlcnR5IiwiR3JhZGllbnQiLCJjb25zdHJ1Y3RvciIsImFzc2VydCIsIm5hbWUiLCJzdG9wcyIsImxhc3RTdG9wUmF0aW8iLCJjYW52YXNHcmFkaWVudCIsImNvbG9yU3RvcHNEaXJ0eSIsImxhc3RDb2xvclN0b3BWYWx1ZXMiLCJhZGRDb2xvclN0b3AiLCJyYXRpbyIsImNvbG9yIiwidmFsdWUiLCJFcnJvciIsInB1c2giLCJnZXRTVkdTdG9wcyIsImludmFsaWRhdGVDYW52YXNHcmFkaWVudCIsInNjZW5lcnlMb2ciLCJQYWludHMiLCJpZCIsImhhdmVDYW52YXNDb2xvclN0b3BzQ2hhbmdlZCIsImkiLCJsZW5ndGgiLCJjb2xvclRvU3RyaW5nIiwiZ2V0Q2FudmFzU3R5bGUiLCJjcmVhdGVDYW52YXNHcmFkaWVudCIsInN0b3AiLCJjb2xvclN0cmluZyIsInBvcCIsInRvQ1NTIiwicHJvdG90eXBlIiwiaXNHcmFkaWVudCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiR3JhZGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQWJzdHJhY3QgYmFzZSB0eXBlIGZvciBMaW5lYXJHcmFkaWVudCBhbmQgUmFkaWFsR3JhZGllbnQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCB7IENvbG9yLCBQYWludCwgc2NlbmVyeSwgVENvbG9yIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB7IGlzVFJlYWRPbmx5UHJvcGVydHkgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIEdyYWRpZW50U3RvcCA9IHtcclxuICByYXRpbzogbnVtYmVyO1xyXG4gIGNvbG9yOiBUQ29sb3I7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBHcmFkaWVudCBleHRlbmRzIFBhaW50IHtcclxuXHJcbiAgcHVibGljIHN0b3BzOiBHcmFkaWVudFN0b3BbXTsgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHJpdmF0ZSBsYXN0U3RvcFJhdGlvOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBjYW52YXNHcmFkaWVudDogQ2FudmFzR3JhZGllbnQgfCBudWxsOyAvLyBsYXppbHkgY3JlYXRlZFxyXG5cclxuICAvLyBXaGV0aGVyIHdlIHNob3VsZCBmb3JjZSBhIGNoZWNrIG9mIHdoZXRoZXIgc3RvcHMgaGF2ZSBjaGFuZ2VkXHJcbiAgcHJpdmF0ZSBjb2xvclN0b3BzRGlydHk6IGJvb2xlYW47XHJcblxyXG4gIC8vIFVzZWQgdG8gY2hlY2sgdG8gc2VlIGlmIGNvbG9ycyBoYXZlIGNoYW5nZWQgc2luY2UgbGFzdCB0aW1lXHJcbiAgcHJpdmF0ZSBsYXN0Q29sb3JTdG9wVmFsdWVzOiBzdHJpbmdbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogYWRkIHRoZSBhYmlsaXR5IHRvIHNwZWNpZnkgdGhlIGNvbG9yLXN0b3BzIGlubGluZS4gcG9zc2libHkgWyBbMCxjb2xvcjFdLCBbMC41LGNvbG9yMl0sIFsxLGNvbG9yM10gXSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnR3JhZGllbnQnLFxyXG4gICAgICAnUGxlYXNlIGNyZWF0ZSBhIExpbmVhckdyYWRpZW50IG9yIFJhZGlhbEdyYWRpZW50LiBEbyBub3QgZGlyZWN0bHkgdXNlIHRoZSBzdXBlcnR5cGUgR3JhZGllbnQuJyApO1xyXG5cclxuICAgIHRoaXMuc3RvcHMgPSBbXTtcclxuICAgIHRoaXMubGFzdFN0b3BSYXRpbyA9IDA7XHJcbiAgICB0aGlzLmNhbnZhc0dyYWRpZW50ID0gbnVsbDtcclxuICAgIHRoaXMuY29sb3JTdG9wc0RpcnR5ID0gZmFsc2U7XHJcbiAgICB0aGlzLmxhc3RDb2xvclN0b3BWYWx1ZXMgPSBbXTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgY29sb3Igc3RvcCB0byB0aGUgZ3JhZGllbnQuXHJcbiAgICpcclxuICAgKiBDb2xvciBzdG9wcyBzaG91bGQgYmUgYWRkZWQgaW4gb3JkZXIgKG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyByYXRpbyB2YWx1ZXMpLlxyXG4gICAqXHJcbiAgICogTk9URTogQ29sb3Igc3RvcHMgc2hvdWxkIG9ubHkgYmUgYWRkZWQgYmVmb3JlIHVzaW5nIHRoZSBncmFkaWVudCBhcyBhIGZpbGwvc3Ryb2tlLiBBZGRpbmcgc3RvcHMgYWZ0ZXJ3YXJkc1xyXG4gICAqICAgICAgIHdpbGwgcmVzdWx0IGluIHVuZGVmaW5lZCBiZWhhdmlvci5cclxuICAgKiBUT0RPOiBDYXRjaCBhdHRlbXB0cyB0byBkbyB0aGUgYWJvdmUuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmF0aW8gLSBNb25vdG9uaWNhbGx5IGluY3JlYXNpbmcgdmFsdWUgaW4gdGhlIHJhbmdlIG9mIDAgdG8gMVxyXG4gICAqIEBwYXJhbSBjb2xvclxyXG4gICAqIEByZXR1cm5zIC0gZm9yIGNoYWluaW5nXHJcbiAgICovXHJcbiAgcHVibGljIGFkZENvbG9yU3RvcCggcmF0aW86IG51bWJlciwgY29sb3I6IFRDb2xvciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJhdGlvID49IDAgJiYgcmF0aW8gPD0gMSwgJ1JhdGlvIG5lZWRzIHRvIGJlIGJldHdlZW4gMCwxIGluY2x1c2l2ZWx5JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY29sb3IgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9yIGluc3RhbmNlb2YgQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggY29sb3IgKSAmJiAoIGNvbG9yLnZhbHVlID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29sb3IudmFsdWUgPT09ICdzdHJpbmcnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvci52YWx1ZSBpbnN0YW5jZW9mIENvbG9yICkgKSxcclxuICAgICAgJ0NvbG9yIHNob3VsZCBtYXRjaCB0aGUgYWRkQ29sb3JTdG9wIHR5cGUgc3BlY2lmaWNhdGlvbicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMubGFzdFN0b3BSYXRpbyA+IHJhdGlvICkge1xyXG4gICAgICAvLyBmYWlsIG91dCwgc2luY2UgYnJvd3NlciBxdWlya3MgZ28gY3JhenkgZm9yIHRoaXMgY2FzZVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdDb2xvciBzdG9wcyBub3Qgc3BlY2lmaWVkIGluIHRoZSBvcmRlciBvZiBpbmNyZWFzaW5nIHJhdGlvcycgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmxhc3RTdG9wUmF0aW8gPSByYXRpbztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0b3BzLnB1c2goIHtcclxuICAgICAgcmF0aW86IHJhdGlvLFxyXG4gICAgICBjb2xvcjogY29sb3JcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBFYXNpZXN0IHRvIGp1c3QgcHVzaCBhIHZhbHVlIGhlcmUsIHNvIHRoYXQgaXQgaXMgYWx3YXlzIHRoZSBzYW1lIGxlbmd0aCBhcyB0aGUgc3RvcHMgYXJyYXkuXHJcbiAgICB0aGlzLmxhc3RDb2xvclN0b3BWYWx1ZXMucHVzaCggJycgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1YnR5cGVzIHNob3VsZCByZXR1cm4gYSBmcmVzaCBDYW52YXNHcmFkaWVudCB0eXBlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhYnN0cmFjdCBjcmVhdGVDYW52YXNHcmFkaWVudCgpOiBDYW52YXNHcmFkaWVudDtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBzdG9wcyBzdWl0YWJsZSBmb3IgZGlyZWN0IFNWRyB1c2UuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNWR1N0b3BzKCk6IEdyYWRpZW50U3RvcFtdIHtcclxuICAgIHJldHVybiB0aGlzLnN0b3BzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yY2VzIGEgcmUtY2hlY2sgb2Ygd2hldGhlciBjb2xvcnMgaGF2ZSBjaGFuZ2VkLCBzbyB0aGF0IHRoZSBDYW52YXMgZ3JhZGllbnQgY2FuIGJlIHJlZ2VuZXJhdGVkIGlmXHJcbiAgICogbmVjZXNzYXJ5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlQ2FudmFzR3JhZGllbnQoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFpbnRzICYmIHNjZW5lcnlMb2cuUGFpbnRzKCBgSW52YWxpZGF0ZWQgQ2FudmFzIEdyYWRpZW50IGZvciAjJHt0aGlzLmlkfWAgKTtcclxuICAgIHRoaXMuY29sb3JTdG9wc0RpcnR5ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBhcmVzIHRoZSBjdXJyZW50IGNvbG9yIHZhbHVlcyB3aXRoIHRoZSBsYXN0LXJlY29yZGVkIHZhbHVlcyBmb3IgdGhlIGN1cnJlbnQgQ2FudmFzIGdyYWRpZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyBuZWVkZWQgc2luY2UgdGhlIHZhbHVlcyBvZiBjb2xvciBwcm9wZXJ0aWVzIChvciB0aGUgY29sb3IgaXRzZWxmKSBtYXkgY2hhbmdlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaGF2ZUNhbnZhc0NvbG9yU3RvcHNDaGFuZ2VkKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzLmxhc3RDb2xvclN0b3BWYWx1ZXMgPT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggR3JhZGllbnQuY29sb3JUb1N0cmluZyggdGhpcy5zdG9wc1sgaSBdLmNvbG9yICkgIT09IHRoaXMubGFzdENvbG9yU3RvcFZhbHVlc1sgaSBdICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgQ2FudmFzIGNvbnRleHQncyBmaWxsU3R5bGUgb3Igc3Ryb2tlU3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENhbnZhc1N0eWxlKCk6IENhbnZhc0dyYWRpZW50IHtcclxuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gcmVnZW5lcmF0ZSB0aGUgQ2FudmFzIGdyYWRpZW50XHJcbiAgICBpZiAoICF0aGlzLmNhbnZhc0dyYWRpZW50IHx8ICggdGhpcy5jb2xvclN0b3BzRGlydHkgJiYgdGhpcy5oYXZlQ2FudmFzQ29sb3JTdG9wc0NoYW5nZWQoKSApICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFpbnRzICYmIHNjZW5lcnlMb2cuUGFpbnRzKCBgUmVnZW5lcmF0aW5nIENhbnZhcyBHcmFkaWVudCBmb3IgIyR7dGhpcy5pZH1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYWludHMgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICB0aGlzLmNvbG9yU3RvcHNEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgY2xlYW5BcnJheSggdGhpcy5sYXN0Q29sb3JTdG9wVmFsdWVzICk7XHJcbiAgICAgIHRoaXMuY2FudmFzR3JhZGllbnQgPSB0aGlzLmNyZWF0ZUNhbnZhc0dyYWRpZW50KCk7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IHN0b3AgPSB0aGlzLnN0b3BzWyBpIF07XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbG9yU3RyaW5nID0gR3JhZGllbnQuY29sb3JUb1N0cmluZyggc3RvcC5jb2xvciApO1xyXG4gICAgICAgIHRoaXMuY2FudmFzR3JhZGllbnQuYWRkQ29sb3JTdG9wKCBzdG9wLnJhdGlvLCBjb2xvclN0cmluZyApO1xyXG5cclxuICAgICAgICAvLyBTYXZlIGl0IHNvIHdlIGNhbiBjb21wYXJlIG5leHQgdGltZSB3aGV0aGVyIG91ciBnZW5lcmF0ZWQgZ3JhZGllbnQgd291bGQgaGF2ZSBjaGFuZ2VkXHJcbiAgICAgICAgdGhpcy5sYXN0Q29sb3JTdG9wVmFsdWVzLnB1c2goIGNvbG9yU3RyaW5nICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYWludHMgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5jYW52YXNHcmFkaWVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIGdlbmVyYWxseS1hbGxvd2VkIGNvbG9yIHR5cGVzIGZvciBHcmFkaWVudCwgYXMgYSBzdHJpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjb2xvclRvU3RyaW5nKCBjb2xvcjogVENvbG9yICk6IHN0cmluZyB7XHJcbiAgICAvLyB0byB7Q29sb3J8c3RyaW5nfG51bGx9XHJcbiAgICBpZiAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGNvbG9yICkgKSB7XHJcbiAgICAgIGNvbG9yID0gY29sb3IudmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdG8ge0NvbG9yfHN0cmluZ31cclxuICAgIGlmICggY29sb3IgPT09IG51bGwgKSB7XHJcbiAgICAgIGNvbG9yID0gJ3RyYW5zcGFyZW50JztcclxuICAgIH1cclxuXHJcbiAgICAvLyB0byB7c3RyaW5nfVxyXG4gICAgaWYgKCBjb2xvciBpbnN0YW5jZW9mIENvbG9yICkge1xyXG4gICAgICBjb2xvciA9IGNvbG9yLnRvQ1NTKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNvbG9yO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGlzR3JhZGllbnQhOiBib29sZWFuO1xyXG59XHJcblxyXG5HcmFkaWVudC5wcm90b3R5cGUuaXNHcmFkaWVudCA9IHRydWU7XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnR3JhZGllbnQnLCBHcmFkaWVudCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxVQUFVLE1BQU0scUNBQXFDO0FBQzVELFNBQVNDLEtBQUssRUFBRUMsS0FBSyxFQUFFQyxPQUFPLFFBQWdCLGVBQWU7QUFDN0QsU0FBU0MsbUJBQW1CLFFBQVEsdUNBQXVDO0FBTzNFLGVBQWUsTUFBZUMsUUFBUSxTQUFTSCxLQUFLLENBQUM7RUFFckI7O0VBRWlCOztFQUUvQzs7RUFHQTs7RUFHQTtBQUNGO0FBQ0E7RUFDU0ks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