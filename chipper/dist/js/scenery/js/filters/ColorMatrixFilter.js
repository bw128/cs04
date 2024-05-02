// Copyright 2020-2024, University of Colorado Boulder

/**
 * A filter that can be represented by a single color matrix operation
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import toSVGNumber from '../../../dot/js/toSVGNumber.js';
import platform from '../../../phet-core/js/platform.js';
import { Filter, scenery, Utils } from '../imports.js';
const isImageDataSupported = Utils.supportsImageDataCanvasFilter();
const useFakeGamma = platform.chromium;
export default class ColorMatrixFilter extends Filter {
  /**
   * NOTE: It is possible but not generally recommended to create custom ColorMatrixFilter types. They should be
   * compatible with Canvas and SVG, HOWEVER any WebGL/DOM content cannot work with those custom filters, and any
   * combination of multiple SVG or Canvas elements will ALSO not work (since there is no CSS filter function that can
   * do arbitrary color matrix operations). This means that performance will likely be reduced UNLESS all content is
   * within a single SVG block.
   *
   * Please prefer the named subtypes where possible.
   *
   * The resulting color is the result of the matrix multiplication:
   *
   * [ m00 m01 m02 m03 m04 ]   [ r ]
   * [ m10 m11 m12 m13 m14 ]   [ g ]
   * [ m20 m21 m22 m23 m24 ] * [ b ]
   * [ m30 m31 m32 m33 m34 ]   [ a ]
   *                           [ 1 ]
   */
  constructor(m00, m01, m02, m03, m04, m10, m11, m12, m13, m14, m20, m21, m22, m23, m24, m30, m31, m32, m33, m34) {
    assert && assert(isFinite(m00), 'm00 should be a finite number');
    assert && assert(isFinite(m01), 'm01 should be a finite number');
    assert && assert(isFinite(m02), 'm02 should be a finite number');
    assert && assert(isFinite(m03), 'm03 should be a finite number');
    assert && assert(isFinite(m04), 'm04 should be a finite number');
    assert && assert(isFinite(m10), 'm10 should be a finite number');
    assert && assert(isFinite(m11), 'm11 should be a finite number');
    assert && assert(isFinite(m12), 'm12 should be a finite number');
    assert && assert(isFinite(m13), 'm13 should be a finite number');
    assert && assert(isFinite(m14), 'm14 should be a finite number');
    assert && assert(isFinite(m20), 'm20 should be a finite number');
    assert && assert(isFinite(m21), 'm21 should be a finite number');
    assert && assert(isFinite(m22), 'm22 should be a finite number');
    assert && assert(isFinite(m23), 'm23 should be a finite number');
    assert && assert(isFinite(m24), 'm24 should be a finite number');
    assert && assert(isFinite(m30), 'm30 should be a finite number');
    assert && assert(isFinite(m31), 'm31 should be a finite number');
    assert && assert(isFinite(m32), 'm32 should be a finite number');
    assert && assert(isFinite(m33), 'm33 should be a finite number');
    assert && assert(isFinite(m34), 'm34 should be a finite number');
    super();
    this.m00 = m00;
    this.m01 = m01;
    this.m02 = m02;
    this.m03 = m03;
    this.m04 = m04;
    this.m10 = m10;
    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    this.m20 = m20;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    this.m30 = m30;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
  }

  /**
   * Appends filter sub-elements into the SVG filter element provided. Should include an in=${inName} for all inputs,
   * and should either output using the resultName (or if not provided, the last element appended should be the output).
   * This effectively mutates the provided filter object, and will be successively called on all Filters to build an
   * SVG filter object.
   */
  applySVGFilter(svgFilter, inName, resultName) {
    Filter.applyColorMatrix(`${toSVGNumber(this.m00)} ${toSVGNumber(this.m01)} ${toSVGNumber(this.m02)} ${toSVGNumber(this.m03)} ${toSVGNumber(this.m04)} ` + `${toSVGNumber(this.m10)} ${toSVGNumber(this.m11)} ${toSVGNumber(this.m12)} ${toSVGNumber(this.m13)} ${toSVGNumber(this.m14)} ` + `${toSVGNumber(this.m20)} ${toSVGNumber(this.m21)} ${toSVGNumber(this.m22)} ${toSVGNumber(this.m23)} ${toSVGNumber(this.m24)} ` + `${toSVGNumber(this.m30)} ${toSVGNumber(this.m31)} ${toSVGNumber(this.m32)} ${toSVGNumber(this.m33)} ${toSVGNumber(this.m34)}`, svgFilter, inName, resultName);
  }

  /**
   * Given a specific canvas/context wrapper, this method should mutate its state so that the canvas now holds the
   * filtered content. Usually this would be by using getImageData/putImageData, however redrawing or other operations
   * are also possible.
   */
  applyCanvasFilter(wrapper) {
    const width = wrapper.canvas.width;
    const height = wrapper.canvas.height;
    const imageData = wrapper.context.getImageData(0, 0, width, height);
    const size = width * height;
    for (let i = 0; i < size; i++) {
      const index = i * 4;
      if (useFakeGamma) {
        // Gamma-corrected version, which seems to match SVG/DOM
        // Eek, this seems required for chromium Canvas to have a standard behavior?
        const gamma = 1.45;
        const r = Math.pow(imageData.data[index + 0] / 255, gamma);
        const g = Math.pow(imageData.data[index + 1] / 255, gamma);
        const b = Math.pow(imageData.data[index + 2] / 255, gamma);
        const a = Math.pow(imageData.data[index + 3] / 255, gamma);

        // Clamp/round should be done by the UInt8Array, we don't do it here for performance reasons.
        imageData.data[index + 0] = 255 * Math.pow(r * this.m00 + g * this.m01 + b * this.m02 + a * this.m03 + this.m04, 1 / gamma);
        imageData.data[index + 1] = 255 * Math.pow(r * this.m10 + g * this.m11 + b * this.m12 + a * this.m13 + this.m14, 1 / gamma);
        imageData.data[index + 2] = 255 * Math.pow(r * this.m20 + g * this.m21 + b * this.m22 + a * this.m23 + this.m24, 1 / gamma);
        imageData.data[index + 3] = 255 * Math.pow(r * this.m30 + g * this.m31 + b * this.m32 + a * this.m33 + this.m34, 1 / gamma);
      } else {
        const r = imageData.data[index + 0];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const a = imageData.data[index + 3];

        // Clamp/round should be done by the UInt8Array, we don't do it here for performance reasons.
        imageData.data[index + 0] = r * this.m00 + g * this.m01 + b * this.m02 + a * this.m03 + this.m04;
        imageData.data[index + 1] = r * this.m10 + g * this.m11 + b * this.m12 + a * this.m13 + this.m14;
        imageData.data[index + 2] = r * this.m20 + g * this.m21 + b * this.m22 + a * this.m23 + this.m24;
        imageData.data[index + 3] = r * this.m30 + g * this.m31 + b * this.m32 + a * this.m33 + this.m34;
      }
    }
    wrapper.context.putImageData(imageData, 0, 0);
  }
  isSVGCompatible() {
    return true;
  }
  isCanvasCompatible() {
    return super.isCanvasCompatible() || isImageDataSupported;
  }
  getCSSFilterString() {
    throw new Error('unimplemented');
  }
}
scenery.register('ColorMatrixFilter', ColorMatrixFilter);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1NWR051bWJlciIsInBsYXRmb3JtIiwiRmlsdGVyIiwic2NlbmVyeSIsIlV0aWxzIiwiaXNJbWFnZURhdGFTdXBwb3J0ZWQiLCJzdXBwb3J0c0ltYWdlRGF0YUNhbnZhc0ZpbHRlciIsInVzZUZha2VHYW1tYSIsImNocm9taXVtIiwiQ29sb3JNYXRyaXhGaWx0ZXIiLCJjb25zdHJ1Y3RvciIsIm0wMCIsIm0wMSIsIm0wMiIsIm0wMyIsIm0wNCIsIm0xMCIsIm0xMSIsIm0xMiIsIm0xMyIsIm0xNCIsIm0yMCIsIm0yMSIsIm0yMiIsIm0yMyIsIm0yNCIsIm0zMCIsIm0zMSIsIm0zMiIsIm0zMyIsIm0zNCIsImFzc2VydCIsImlzRmluaXRlIiwiYXBwbHlTVkdGaWx0ZXIiLCJzdmdGaWx0ZXIiLCJpbk5hbWUiLCJyZXN1bHROYW1lIiwiYXBwbHlDb2xvck1hdHJpeCIsImFwcGx5Q2FudmFzRmlsdGVyIiwid3JhcHBlciIsIndpZHRoIiwiY2FudmFzIiwiaGVpZ2h0IiwiaW1hZ2VEYXRhIiwiY29udGV4dCIsImdldEltYWdlRGF0YSIsInNpemUiLCJpIiwiaW5kZXgiLCJnYW1tYSIsInIiLCJNYXRoIiwicG93IiwiZGF0YSIsImciLCJiIiwiYSIsInB1dEltYWdlRGF0YSIsImlzU1ZHQ29tcGF0aWJsZSIsImlzQ2FudmFzQ29tcGF0aWJsZSIsImdldENTU0ZpbHRlclN0cmluZyIsIkVycm9yIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDb2xvck1hdHJpeEZpbHRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIGZpbHRlciB0aGF0IGNhbiBiZSByZXByZXNlbnRlZCBieSBhIHNpbmdsZSBjb2xvciBtYXRyaXggb3BlcmF0aW9uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgdG9TVkdOdW1iZXIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL3RvU1ZHTnVtYmVyLmpzJztcclxuaW1wb3J0IHBsYXRmb3JtIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9wbGF0Zm9ybS5qcyc7XHJcbmltcG9ydCB7IENhbnZhc0NvbnRleHRXcmFwcGVyLCBGaWx0ZXIsIHNjZW5lcnksIFV0aWxzIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5jb25zdCBpc0ltYWdlRGF0YVN1cHBvcnRlZCA9IFV0aWxzLnN1cHBvcnRzSW1hZ2VEYXRhQ2FudmFzRmlsdGVyKCk7XHJcbmNvbnN0IHVzZUZha2VHYW1tYSA9IHBsYXRmb3JtLmNocm9taXVtO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29sb3JNYXRyaXhGaWx0ZXIgZXh0ZW5kcyBGaWx0ZXIge1xyXG5cclxuICBwcml2YXRlIG0wMDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTAxOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMDI6IG51bWJlcjtcclxuICBwcml2YXRlIG0wMzogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTA0OiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMTA6IG51bWJlcjtcclxuICBwcml2YXRlIG0xMTogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTEyOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMTM6IG51bWJlcjtcclxuICBwcml2YXRlIG0xNDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTIwOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMjE6IG51bWJlcjtcclxuICBwcml2YXRlIG0yMjogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTIzOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMjQ6IG51bWJlcjtcclxuICBwcml2YXRlIG0zMDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTMxOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBtMzI6IG51bWJlcjtcclxuICBwcml2YXRlIG0zMzogbnVtYmVyO1xyXG4gIHByaXZhdGUgbTM0OiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIE5PVEU6IEl0IGlzIHBvc3NpYmxlIGJ1dCBub3QgZ2VuZXJhbGx5IHJlY29tbWVuZGVkIHRvIGNyZWF0ZSBjdXN0b20gQ29sb3JNYXRyaXhGaWx0ZXIgdHlwZXMuIFRoZXkgc2hvdWxkIGJlXHJcbiAgICogY29tcGF0aWJsZSB3aXRoIENhbnZhcyBhbmQgU1ZHLCBIT1dFVkVSIGFueSBXZWJHTC9ET00gY29udGVudCBjYW5ub3Qgd29yayB3aXRoIHRob3NlIGN1c3RvbSBmaWx0ZXJzLCBhbmQgYW55XHJcbiAgICogY29tYmluYXRpb24gb2YgbXVsdGlwbGUgU1ZHIG9yIENhbnZhcyBlbGVtZW50cyB3aWxsIEFMU08gbm90IHdvcmsgKHNpbmNlIHRoZXJlIGlzIG5vIENTUyBmaWx0ZXIgZnVuY3Rpb24gdGhhdCBjYW5cclxuICAgKiBkbyBhcmJpdHJhcnkgY29sb3IgbWF0cml4IG9wZXJhdGlvbnMpLiBUaGlzIG1lYW5zIHRoYXQgcGVyZm9ybWFuY2Ugd2lsbCBsaWtlbHkgYmUgcmVkdWNlZCBVTkxFU1MgYWxsIGNvbnRlbnQgaXNcclxuICAgKiB3aXRoaW4gYSBzaW5nbGUgU1ZHIGJsb2NrLlxyXG4gICAqXHJcbiAgICogUGxlYXNlIHByZWZlciB0aGUgbmFtZWQgc3VidHlwZXMgd2hlcmUgcG9zc2libGUuXHJcbiAgICpcclxuICAgKiBUaGUgcmVzdWx0aW5nIGNvbG9yIGlzIHRoZSByZXN1bHQgb2YgdGhlIG1hdHJpeCBtdWx0aXBsaWNhdGlvbjpcclxuICAgKlxyXG4gICAqIFsgbTAwIG0wMSBtMDIgbTAzIG0wNCBdICAgWyByIF1cclxuICAgKiBbIG0xMCBtMTEgbTEyIG0xMyBtMTQgXSAgIFsgZyBdXHJcbiAgICogWyBtMjAgbTIxIG0yMiBtMjMgbTI0IF0gKiBbIGIgXVxyXG4gICAqIFsgbTMwIG0zMSBtMzIgbTMzIG0zNCBdICAgWyBhIF1cclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIFsgMSBdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtMDA6IG51bWJlciwgbTAxOiBudW1iZXIsIG0wMjogbnVtYmVyLCBtMDM6IG51bWJlciwgbTA0OiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgIG0xMDogbnVtYmVyLCBtMTE6IG51bWJlciwgbTEyOiBudW1iZXIsIG0xMzogbnVtYmVyLCBtMTQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgbTIwOiBudW1iZXIsIG0yMTogbnVtYmVyLCBtMjI6IG51bWJlciwgbTIzOiBudW1iZXIsIG0yNDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICBtMzA6IG51bWJlciwgbTMxOiBudW1iZXIsIG0zMjogbnVtYmVyLCBtMzM6IG51bWJlciwgbTM0OiBudW1iZXIgKSB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0wMCApLCAnbTAwIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTAxICksICdtMDEgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMDIgKSwgJ20wMiBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0wMyApLCAnbTAzIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTA0ICksICdtMDQgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTEwICksICdtMTAgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMTEgKSwgJ20xMSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0xMiApLCAnbTEyIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTEzICksICdtMTMgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMTQgKSwgJ20xNCBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMjAgKSwgJ20yMCBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0yMSApLCAnbTIxIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTIyICksICdtMjIgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMjMgKSwgJ20yMyBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0yNCApLCAnbTI0IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0zMCApLCAnbTMwIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTMxICksICdtMzEgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtMzIgKSwgJ20zMiBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG0zMyApLCAnbTMzIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbTM0ICksICdtMzQgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMubTAwID0gbTAwO1xyXG4gICAgdGhpcy5tMDEgPSBtMDE7XHJcbiAgICB0aGlzLm0wMiA9IG0wMjtcclxuICAgIHRoaXMubTAzID0gbTAzO1xyXG4gICAgdGhpcy5tMDQgPSBtMDQ7XHJcbiAgICB0aGlzLm0xMCA9IG0xMDtcclxuICAgIHRoaXMubTExID0gbTExO1xyXG4gICAgdGhpcy5tMTIgPSBtMTI7XHJcbiAgICB0aGlzLm0xMyA9IG0xMztcclxuICAgIHRoaXMubTE0ID0gbTE0O1xyXG4gICAgdGhpcy5tMjAgPSBtMjA7XHJcbiAgICB0aGlzLm0yMSA9IG0yMTtcclxuICAgIHRoaXMubTIyID0gbTIyO1xyXG4gICAgdGhpcy5tMjMgPSBtMjM7XHJcbiAgICB0aGlzLm0yNCA9IG0yNDtcclxuICAgIHRoaXMubTMwID0gbTMwO1xyXG4gICAgdGhpcy5tMzEgPSBtMzE7XHJcbiAgICB0aGlzLm0zMiA9IG0zMjtcclxuICAgIHRoaXMubTMzID0gbTMzO1xyXG4gICAgdGhpcy5tMzQgPSBtMzQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBlbmRzIGZpbHRlciBzdWItZWxlbWVudHMgaW50byB0aGUgU1ZHIGZpbHRlciBlbGVtZW50IHByb3ZpZGVkLiBTaG91bGQgaW5jbHVkZSBhbiBpbj0ke2luTmFtZX0gZm9yIGFsbCBpbnB1dHMsXHJcbiAgICogYW5kIHNob3VsZCBlaXRoZXIgb3V0cHV0IHVzaW5nIHRoZSByZXN1bHROYW1lIChvciBpZiBub3QgcHJvdmlkZWQsIHRoZSBsYXN0IGVsZW1lbnQgYXBwZW5kZWQgc2hvdWxkIGJlIHRoZSBvdXRwdXQpLlxyXG4gICAqIFRoaXMgZWZmZWN0aXZlbHkgbXV0YXRlcyB0aGUgcHJvdmlkZWQgZmlsdGVyIG9iamVjdCwgYW5kIHdpbGwgYmUgc3VjY2Vzc2l2ZWx5IGNhbGxlZCBvbiBhbGwgRmlsdGVycyB0byBidWlsZCBhblxyXG4gICAqIFNWRyBmaWx0ZXIgb2JqZWN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcHBseVNWR0ZpbHRlciggc3ZnRmlsdGVyOiBTVkdGaWx0ZXJFbGVtZW50LCBpbk5hbWU6IHN0cmluZywgcmVzdWx0TmFtZT86IHN0cmluZyApOiB2b2lkIHtcclxuICAgIEZpbHRlci5hcHBseUNvbG9yTWF0cml4KFxyXG4gICAgICBgJHt0b1NWR051bWJlciggdGhpcy5tMDAgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMDEgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMDIgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMDMgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMDQgKX0gYCArXHJcbiAgICAgIGAke3RvU1ZHTnVtYmVyKCB0aGlzLm0xMCApfSAke3RvU1ZHTnVtYmVyKCB0aGlzLm0xMSApfSAke3RvU1ZHTnVtYmVyKCB0aGlzLm0xMiApfSAke3RvU1ZHTnVtYmVyKCB0aGlzLm0xMyApfSAke3RvU1ZHTnVtYmVyKCB0aGlzLm0xNCApfSBgICtcclxuICAgICAgYCR7dG9TVkdOdW1iZXIoIHRoaXMubTIwICl9ICR7dG9TVkdOdW1iZXIoIHRoaXMubTIxICl9ICR7dG9TVkdOdW1iZXIoIHRoaXMubTIyICl9ICR7dG9TVkdOdW1iZXIoIHRoaXMubTIzICl9ICR7dG9TVkdOdW1iZXIoIHRoaXMubTI0ICl9IGAgK1xyXG4gICAgICBgJHt0b1NWR051bWJlciggdGhpcy5tMzAgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMzEgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMzIgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMzMgKX0gJHt0b1NWR051bWJlciggdGhpcy5tMzQgKX1gLFxyXG4gICAgICBzdmdGaWx0ZXIsIGluTmFtZSwgcmVzdWx0TmFtZVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgc3BlY2lmaWMgY2FudmFzL2NvbnRleHQgd3JhcHBlciwgdGhpcyBtZXRob2Qgc2hvdWxkIG11dGF0ZSBpdHMgc3RhdGUgc28gdGhhdCB0aGUgY2FudmFzIG5vdyBob2xkcyB0aGVcclxuICAgKiBmaWx0ZXJlZCBjb250ZW50LiBVc3VhbGx5IHRoaXMgd291bGQgYmUgYnkgdXNpbmcgZ2V0SW1hZ2VEYXRhL3B1dEltYWdlRGF0YSwgaG93ZXZlciByZWRyYXdpbmcgb3Igb3RoZXIgb3BlcmF0aW9uc1xyXG4gICAqIGFyZSBhbHNvIHBvc3NpYmxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcHBseUNhbnZhc0ZpbHRlciggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIgKTogdm9pZCB7XHJcbiAgICBjb25zdCB3aWR0aCA9IHdyYXBwZXIuY2FudmFzLndpZHRoO1xyXG4gICAgY29uc3QgaGVpZ2h0ID0gd3JhcHBlci5jYW52YXMuaGVpZ2h0O1xyXG5cclxuICAgIGNvbnN0IGltYWdlRGF0YSA9IHdyYXBwZXIuY29udGV4dC5nZXRJbWFnZURhdGEoIDAsIDAsIHdpZHRoLCBoZWlnaHQgKTtcclxuXHJcbiAgICBjb25zdCBzaXplID0gd2lkdGggKiBoZWlnaHQ7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzaXplOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gaSAqIDQ7XHJcblxyXG4gICAgICBpZiAoIHVzZUZha2VHYW1tYSApIHtcclxuICAgICAgICAvLyBHYW1tYS1jb3JyZWN0ZWQgdmVyc2lvbiwgd2hpY2ggc2VlbXMgdG8gbWF0Y2ggU1ZHL0RPTVxyXG4gICAgICAgIC8vIEVlaywgdGhpcyBzZWVtcyByZXF1aXJlZCBmb3IgY2hyb21pdW0gQ2FudmFzIHRvIGhhdmUgYSBzdGFuZGFyZCBiZWhhdmlvcj9cclxuICAgICAgICBjb25zdCBnYW1tYSA9IDEuNDU7XHJcbiAgICAgICAgY29uc3QgciA9IE1hdGgucG93KCBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAwIF0gLyAyNTUsIGdhbW1hICk7XHJcbiAgICAgICAgY29uc3QgZyA9IE1hdGgucG93KCBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAxIF0gLyAyNTUsIGdhbW1hICk7XHJcbiAgICAgICAgY29uc3QgYiA9IE1hdGgucG93KCBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAyIF0gLyAyNTUsIGdhbW1hICk7XHJcbiAgICAgICAgY29uc3QgYSA9IE1hdGgucG93KCBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAzIF0gLyAyNTUsIGdhbW1hICk7XHJcblxyXG4gICAgICAgIC8vIENsYW1wL3JvdW5kIHNob3VsZCBiZSBkb25lIGJ5IHRoZSBVSW50OEFycmF5LCB3ZSBkb24ndCBkbyBpdCBoZXJlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zLlxyXG4gICAgICAgIGltYWdlRGF0YS5kYXRhWyBpbmRleCArIDAgXSA9IDI1NSAqIE1hdGgucG93KCByICogdGhpcy5tMDAgKyBnICogdGhpcy5tMDEgKyBiICogdGhpcy5tMDIgKyBhICogdGhpcy5tMDMgKyB0aGlzLm0wNCwgMSAvIGdhbW1hICk7XHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMSBdID0gMjU1ICogTWF0aC5wb3coIHIgKiB0aGlzLm0xMCArIGcgKiB0aGlzLm0xMSArIGIgKiB0aGlzLm0xMiArIGEgKiB0aGlzLm0xMyArIHRoaXMubTE0LCAxIC8gZ2FtbWEgKTtcclxuICAgICAgICBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAyIF0gPSAyNTUgKiBNYXRoLnBvdyggciAqIHRoaXMubTIwICsgZyAqIHRoaXMubTIxICsgYiAqIHRoaXMubTIyICsgYSAqIHRoaXMubTIzICsgdGhpcy5tMjQsIDEgLyBnYW1tYSApO1xyXG4gICAgICAgIGltYWdlRGF0YS5kYXRhWyBpbmRleCArIDMgXSA9IDI1NSAqIE1hdGgucG93KCByICogdGhpcy5tMzAgKyBnICogdGhpcy5tMzEgKyBiICogdGhpcy5tMzIgKyBhICogdGhpcy5tMzMgKyB0aGlzLm0zNCwgMSAvIGdhbW1hICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3QgciA9IGltYWdlRGF0YS5kYXRhWyBpbmRleCArIDAgXTtcclxuICAgICAgICBjb25zdCBnID0gaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMSBdO1xyXG4gICAgICAgIGNvbnN0IGIgPSBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAyIF07XHJcbiAgICAgICAgY29uc3QgYSA9IGltYWdlRGF0YS5kYXRhWyBpbmRleCArIDMgXTtcclxuXHJcbiAgICAgICAgLy8gQ2xhbXAvcm91bmQgc2hvdWxkIGJlIGRvbmUgYnkgdGhlIFVJbnQ4QXJyYXksIHdlIGRvbid0IGRvIGl0IGhlcmUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMuXHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMCBdID0gciAqIHRoaXMubTAwICsgZyAqIHRoaXMubTAxICsgYiAqIHRoaXMubTAyICsgYSAqIHRoaXMubTAzICsgdGhpcy5tMDQ7XHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMSBdID0gciAqIHRoaXMubTEwICsgZyAqIHRoaXMubTExICsgYiAqIHRoaXMubTEyICsgYSAqIHRoaXMubTEzICsgdGhpcy5tMTQ7XHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMiBdID0gciAqIHRoaXMubTIwICsgZyAqIHRoaXMubTIxICsgYiAqIHRoaXMubTIyICsgYSAqIHRoaXMubTIzICsgdGhpcy5tMjQ7XHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMyBdID0gciAqIHRoaXMubTMwICsgZyAqIHRoaXMubTMxICsgYiAqIHRoaXMubTMyICsgYSAqIHRoaXMubTMzICsgdGhpcy5tMzQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB3cmFwcGVyLmNvbnRleHQucHV0SW1hZ2VEYXRhKCBpbWFnZURhdGEsIDAsIDAgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBpc1NWR0NvbXBhdGlibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBpc0NhbnZhc0NvbXBhdGlibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gc3VwZXIuaXNDYW52YXNDb21wYXRpYmxlKCkgfHwgaXNJbWFnZURhdGFTdXBwb3J0ZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0Q1NTRmlsdGVyU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICd1bmltcGxlbWVudGVkJyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0NvbG9yTWF0cml4RmlsdGVyJywgQ29sb3JNYXRyaXhGaWx0ZXIgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLGdDQUFnQztBQUN4RCxPQUFPQyxRQUFRLE1BQU0sbUNBQW1DO0FBQ3hELFNBQStCQyxNQUFNLEVBQUVDLE9BQU8sRUFBRUMsS0FBSyxRQUFRLGVBQWU7QUFFNUUsTUFBTUMsb0JBQW9CLEdBQUdELEtBQUssQ0FBQ0UsNkJBQTZCLENBQUMsQ0FBQztBQUNsRSxNQUFNQyxZQUFZLEdBQUdOLFFBQVEsQ0FBQ08sUUFBUTtBQUV0QyxlQUFlLE1BQU1DLGlCQUFpQixTQUFTUCxNQUFNLENBQUM7RUF1QnBEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU1EsV0FBV0EsQ0FBRUMsR0FBVyxFQUFFQyxHQUFXLEVBQUVDLEdBQVcsRUFBRUMsR0FBVyxFQUFFQyxHQUFXLEVBQ3RFQyxHQUFXLEVBQUVDLEdBQVcsRUFBRUMsR0FBVyxFQUFFQyxHQUFXLEVBQUVDLEdBQVcsRUFDL0RDLEdBQVcsRUFBRUMsR0FBVyxF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QUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsRUFBRUMsS0FBTSxDQUFDO1FBQzlELE1BQU1LLENBQUMsR0FBR0gsSUFBSSxDQUFDQyxHQUFHLENBQUVULFNBQVMsQ0FBQ1UsSUFBSSxDQUFFTCxLQUFLLEdBQUcsQ0FBQyxDQUFFLEdBQUcsR0FBRyxFQUFFQyxLQUFNLENBQUM7UUFDOUQsTUFBTU0sQ0FBQyxHQUFHSixJQUFJLENBQUNDLEdBQUcsQ0FBRVQsU0FBUyxDQUFDVSxJQUFJLENBQUVMLEtBQUssR0FBRyxDQUFDLENBQUUsR0FBRyxHQUFHLEVBQUVDLEtBQU0sQ0FBQztRQUM5RCxNQUFNTyxDQUFDLEdBQUdMLElBQUksQ0FBQ0MsR0FBRyxDQUFFVCxTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsRUFBRUMsS0FBTSxDQUFDOztRQUU5RDtRQUNBTixTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsR0FBR0csSUFBSSxDQUFDQyxHQUFHLENBQUVGLENBQUMsR0FBRyxJQUFJLENBQUN2QyxHQUFHLEdBQUcyQyxDQUFDLEdBQUcsSUFBSSxDQUFDMUMsR0FBRyxHQUFHMkMsQ0FBQyxHQUFHLElBQUksQ0FBQzFDLEdBQUcsR0FBRzJDLENBQUMsR0FBRyxJQUFJLENBQUMxQyxHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHLEVBQUUsQ0FBQyxHQUFHa0MsS0FBTSxDQUFDO1FBQy9ITixTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsR0FBR0csSUFBSSxDQUFDQyxHQUFHLENBQUVGLENBQUMsR0FBRyxJQUFJLENBQUNsQyxHQUFHLEdBQUdzQyxDQUFDLEdBQUcsSUFBSSxDQUFDckMsR0FBRyxHQUFHc0MsQ0FBQyxHQUFHLElBQUksQ0FBQ3JDLEdBQUcsR0FBR3NDLENBQUMsR0FBRyxJQUFJLENBQUNyQyxHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHLEVBQUUsQ0FBQyxHQUFHNkIsS0FBTSxDQUFDO1FBQy9ITixTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsR0FBR0csSUFBSSxDQUFDQyxHQUFHLENBQUVGLENBQUMsR0FBRyxJQUFJLENBQUM3QixHQUFHLEdBQUdpQyxDQUFDLEdBQUcsSUFBSSxDQUFDaEMsR0FBRyxHQUFHaUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2hDLEdBQUcsR0FBR2lDLENBQUMsR0FBRyxJQUFJLENBQUNoQyxHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHLEVBQUUsQ0FBQyxHQUFHd0IsS0FBTSxDQUFDO1FBQy9ITixTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHLEdBQUcsR0FBR0csSUFBSSxDQUFDQyxHQUFHLENBQUVGLENBQUMsR0FBRyxJQUFJLENBQUN4QixHQUFHLEdBQUc0QixDQUFDLEdBQUcsSUFBSSxDQUFDM0IsR0FBRyxHQUFHNEIsQ0FBQyxHQUFHLElBQUksQ0FBQzNCLEdBQUcsR0FBRzRCLENBQUMsR0FBRyxJQUFJLENBQUMzQixHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHLEVBQUUsQ0FBQyxHQUFHbUIsS0FBTSxDQUFDO01BQ2pJLENBQUMsTUFDSTtRQUNILE1BQU1DLENBQUMsR0FBR1AsU0FBUyxDQUFDVSxJQUFJLENBQUVMLEtBQUssR0FBRyxDQUFDLENBQUU7UUFDckMsTUFBTU0sQ0FBQyxHQUFHWCxTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRTtRQUNyQyxNQUFNTyxDQUFDLEdBQUdaLFNBQVMsQ0FBQ1UsSUFBSSxDQUFFTCxLQUFLLEdBQUcsQ0FBQyxDQUFFO1FBQ3JDLE1BQU1RLENBQUMsR0FBR2IsU0FBUyxDQUFDVSxJQUFJLENBQUVMLEtBQUssR0FBRyxDQUFDLENBQUU7O1FBRXJDO1FBQ0FMLFNBQVMsQ0FBQ1UsSUFBSSxDQUFFTCxLQUFLLEdBQUcsQ0FBQyxDQUFFLEdBQUdFLENBQUMsR0FBRyxJQUFJLENBQUN2QyxHQUFHLEdBQUcyQyxDQUFDLEdBQUcsSUFBSSxDQUFDMUMsR0FBRyxHQUFHMkMsQ0FBQyxHQUFHLElBQUksQ0FBQzFDLEdBQUcsR0FBRzJDLENBQUMsR0FBRyxJQUFJLENBQUMxQyxHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHO1FBQ2xHNEIsU0FBUyxDQUFDVSxJQUFJLENBQUVMLEtBQUssR0FBRyxDQUFDLENBQUUsR0FBR0UsQ0FBQyxHQUFHLElBQUksQ0FBQ2xDLEdBQUcsR0FBR3NDLENBQUMsR0FBRyxJQUFJLENBQUNyQyxHQUFHLEdBQUdzQyxDQUFDLEdBQUcsSUFBSSxDQUFDckMsR0FBRyxHQUFHc0MsQ0FBQyxHQUFHLElBQUksQ0FBQ3JDLEdBQUcsR0FBRyxJQUFJLENBQUNDLEdBQUc7UUFDbEd1QixTQUFTLENBQUNVLElBQUksQ0FBRUwsS0FBSyxHQUFHLENBQUMsQ0FBRSxHQUFHRSxDQUFDLEdBQUcsSUFBSSxDQUFDN0IsR0FBRyxHQUFHaUMsQ0FBQyxHQUFHLElBQUksQ0FBQ2hDLEdBQUcsR0FBR2lDLENBQUMsR0FBRyxJQUFJLENBQUNoQyxHQUFHLEdBQUdpQyxDQUFDLEdBQUcsSUFBSSxDQUFDaEMsR0FBRyxHQUFHLElBQUksQ0FBQ0MsR0FBRztRQUNsR2tCLFNBQVMsQ0FBQ1UsSUFBSSxDQUFFTCxLQUFLLEdBQUcsQ0FBQyxDQUFFLEdBQUdFLENBQUMsR0FBRyxJQUFJLENBQUN4QixHQUFHLEdBQUc0QixDQUFDLEdBQUcsSUFBSSxDQUFDM0IsR0FBRyxHQUFHNEIsQ0FBQyxHQUFHLElBQUksQ0FBQzNCLEdBQUcsR0FBRzRCLENBQUMsR0FBRyxJQUFJLENBQUMzQixHQUFHLEdBQUcsSUFBSSxDQUFDQyxHQUFHO01BQ3BHO0lBQ0Y7SUFFQVMsT0FBTyxDQUFDSyxPQUFPLENBQUNhLFlBQVksQ0FBRWQsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7RUFDakQ7RUFFZ0JlLGVBQWVBLENBQUEsRUFBWTtJQUN6QyxPQUFPLElBQUk7RUFDYjtFQUVnQkMsa0JBQWtCQSxDQUFBLEVBQVk7SUFDNUMsT0FBTyxLQUFLLENBQUNBLGtCQUFrQixDQUFDLENBQUMsSUFBSXRELG9CQUFvQjtFQUMzRDtFQUVPdUQsa0JBQWtCQSxDQUFBLEVBQVc7SUFDbEMsTUFBTSxJQUFJQyxLQUFLLENBQUUsZUFBZ0IsQ0FBQztFQUNwQztBQUNGO0FBRUExRCxPQUFPLENBQUMyRCxRQUFRLENBQUUsbUJBQW1CLEVBQUVyRCxpQkFBa0IsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==