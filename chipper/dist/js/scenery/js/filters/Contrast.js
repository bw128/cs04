// Copyright 2020-2024, University of Colorado Boulder

/**
 * Contrast filter
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import toSVGNumber from '../../../dot/js/toSVGNumber.js';
import { ColorMatrixFilter, scenery } from '../imports.js';
export default class Contrast extends ColorMatrixFilter {
  /**
   * @param amount - The amount of the effect, from 0 (gray), 1 (normal), or above for high-contrast
   */
  constructor(amount) {
    assert && assert(isFinite(amount), 'Contrast amount should be finite');
    assert && assert(amount >= 0, 'Contrast amount should be non-negative');
    super(amount, 0, 0, 0, -(0.5 * amount) + 0.5, 0, amount, 0, 0, -(0.5 * amount) + 0.5, 0, 0, amount, 0, -(0.5 * amount) + 0.5, 0, 0, 0, 1, 0);
    this.amount = amount;
  }

  /**
   * Returns the CSS-style filter substring specific to this single filter, e.g. `grayscale(1)`. This should be used for
   * both DOM elements (https://developer.mozilla.org/en-US/docs/Web/CSS/filter) and when supported, Canvas
   * (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter).
   */
  getCSSFilterString() {
    return `contrast(${toSVGNumber(this.amount)})`;
  }
  isDOMCompatible() {
    return true;
  }

  // Turns the content gray
  static GRAY = new Contrast(0);
}
scenery.register('Contrast', Contrast);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1NWR051bWJlciIsIkNvbG9yTWF0cml4RmlsdGVyIiwic2NlbmVyeSIsIkNvbnRyYXN0IiwiY29uc3RydWN0b3IiLCJhbW91bnQiLCJhc3NlcnQiLCJpc0Zpbml0ZSIsImdldENTU0ZpbHRlclN0cmluZyIsImlzRE9NQ29tcGF0aWJsZSIsIkdSQVkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbnRyYXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbnRyYXN0IGZpbHRlclxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHRvU1ZHTnVtYmVyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy90b1NWR051bWJlci5qcyc7XHJcbmltcG9ydCB7IENvbG9yTWF0cml4RmlsdGVyLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250cmFzdCBleHRlbmRzIENvbG9yTWF0cml4RmlsdGVyIHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBhbW91bnQ6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGFtb3VudCAtIFRoZSBhbW91bnQgb2YgdGhlIGVmZmVjdCwgZnJvbSAwIChncmF5KSwgMSAobm9ybWFsKSwgb3IgYWJvdmUgZm9yIGhpZ2gtY29udHJhc3RcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGFtb3VudDogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGFtb3VudCApLCAnQ29udHJhc3QgYW1vdW50IHNob3VsZCBiZSBmaW5pdGUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhbW91bnQgPj0gMCwgJ0NvbnRyYXN0IGFtb3VudCBzaG91bGQgYmUgbm9uLW5lZ2F0aXZlJyApO1xyXG5cclxuICAgIHN1cGVyKFxyXG4gICAgICBhbW91bnQsIDAsIDAsIDAsIC0oIDAuNSAqIGFtb3VudCApICsgMC41LFxyXG4gICAgICAwLCBhbW91bnQsIDAsIDAsIC0oIDAuNSAqIGFtb3VudCApICsgMC41LFxyXG4gICAgICAwLCAwLCBhbW91bnQsIDAsIC0oIDAuNSAqIGFtb3VudCApICsgMC41LFxyXG4gICAgICAwLCAwLCAwLCAxLCAwXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuYW1vdW50ID0gYW1vdW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ1NTLXN0eWxlIGZpbHRlciBzdWJzdHJpbmcgc3BlY2lmaWMgdG8gdGhpcyBzaW5nbGUgZmlsdGVyLCBlLmcuIGBncmF5c2NhbGUoMSlgLiBUaGlzIHNob3VsZCBiZSB1c2VkIGZvclxyXG4gICAqIGJvdGggRE9NIGVsZW1lbnRzIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvZmlsdGVyKSBhbmQgd2hlbiBzdXBwb3J0ZWQsIENhbnZhc1xyXG4gICAqIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEL2ZpbHRlcikuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldENTU0ZpbHRlclN0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBjb250cmFzdCgke3RvU1ZHTnVtYmVyKCB0aGlzLmFtb3VudCApfSlgO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGlzRE9NQ29tcGF0aWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gVHVybnMgdGhlIGNvbnRlbnQgZ3JheVxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgR1JBWSA9IG5ldyBDb250cmFzdCggMCApO1xyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQ29udHJhc3QnLCBDb250cmFzdCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sZ0NBQWdDO0FBQ3hELFNBQVNDLGlCQUFpQixFQUFFQyxPQUFPLFFBQVEsZUFBZTtBQUUxRCxlQUFlLE1BQU1DLFFBQVEsU0FBU0YsaUJBQWlCLENBQUM7RUFJdEQ7QUFDRjtBQUNBO0VBQ1NHLFdBQVdBLENBQUVDLE1BQWMsRUFBRztJQUNuQ0MsTUFBTSxJQUFJQSxNQUFNLENBQUVDLFFBQVEsQ0FBRUYsTUFBTyxDQUFDLEVBQUUsa0NBQW1DLENBQUM7SUFDMUVDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRCxNQUFNLElBQUksQ0FBQyxFQUFFLHdDQUF5QyxDQUFDO0lBRXpFLEtBQUssQ0FDSEEsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUcsR0FBRyxHQUFHQSxNQUFNLENBQUUsR0FBRyxHQUFHLEVBQ3hDLENBQUMsRUFBRUEsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRyxHQUFHLEdBQUdBLE1BQU0sQ0FBRSxHQUFHLEdBQUcsRUFDeEMsQ0FBQyxFQUFFLENBQUMsRUFBRUEsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFHLEdBQUcsR0FBR0EsTUFBTSxDQUFFLEdBQUcsR0FBRyxFQUN4QyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FDZCxDQUFDO0lBRUQsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU07RUFDdEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNrQkcsa0JBQWtCQSxDQUFBLEVBQVc7SUFDM0MsT0FBUSxZQUFXUixXQUFXLENBQUUsSUFBSSxDQUFDSyxNQUFPLENBQUUsR0FBRTtFQUNsRDtFQUVnQkksZUFBZUEsQ0FBQSxFQUFZO0lBQ3pDLE9BQU8sSUFBSTtFQUNiOztFQUVBO0VBQ0EsT0FBdUJDLElBQUksR0FBRyxJQUFJUCxRQUFRLENBQUUsQ0FBRSxDQUFDO0FBQ2pEO0FBRUFELE9BQU8sQ0FBQ1MsUUFBUSxDQUFFLFVBQVUsRUFBRVIsUUFBUyxDQUFDIiwiaWdub3JlTGlzdCI6W119