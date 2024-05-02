"use strict";

// Copyright 2017-2024, University of Colorado Boulder

/**
 * Handles transpilation of code using Babel
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
var babel = require('@babel/core'); // eslint-disable-line require-statement-match

/**
 * Transpile some code to be compatible with the browsers specified below
 * @public
 *
 * @param {string} jsInput
 * @param {boolean} [forIE=false] - whether the jsInput should be transpiled for Internet Explorer
 * @returns {string} - The transpiled code
 */
module.exports = function (jsInput) {
  var forIE = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  // This list specifies the target browsers for Babel. Its format is described at https://browsersl.ist.
  // Note that this is related to System Requirements advertised on the PhET website, so should be modified with care.
  // Never remove advertised platforms from this list without a broader discussion. And note that PhET will sometimes
  // provide unofficial support for older platforms, so version numbers may be lower than what is advertised on the
  // PhET website. For more history, see https://github.com/phetsims/chipper/issues/1323.
  var browsers = ['defaults', 'safari >= 13', 'iOS >= 13'];
  if (forIE) {
    browsers.push('IE 11');
  }

  // See options available at https://babeljs.io/docs/usage/api/
  return babel.transform(jsInput, {
    // Avoids a warning that this gets disabled for >500kb of source. true/false doesn't affect the later minified size, and
    // the 'true' option was faster by a hair.
    compact: true,
    // Use chipper's copy of babel-preset-env, so we don't have to have 30MB extra per sim checked out.
    // This strategy is also used in Transpiler.js
    presets: [['../chipper/node_modules/@babel/preset-env', {
      // Parse as "script" type, so "this" will refer to "window" instead of being transpiled to `void 0` aka undefined
      // see https://github.com/phetsims/chipper/issues/723#issuecomment-443966550
      modules: false,
      targets: {
        browsers: browsers
      }
    }]]
  }).code;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYWJlbCIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwianNJbnB1dCIsImZvcklFIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiYnJvd3NlcnMiLCJwdXNoIiwidHJhbnNmb3JtIiwiY29tcGFjdCIsInByZXNldHMiLCJtb2R1bGVzIiwidGFyZ2V0cyIsImNvZGUiXSwic291cmNlcyI6WyJ0cmFuc3BpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSGFuZGxlcyB0cmFuc3BpbGF0aW9uIG9mIGNvZGUgdXNpbmcgQmFiZWxcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuLy8gbW9kdWxlc1xyXG5jb25zdCBiYWJlbCA9IHJlcXVpcmUoICdAYmFiZWwvY29yZScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5cclxuLyoqXHJcbiAqIFRyYW5zcGlsZSBzb21lIGNvZGUgdG8gYmUgY29tcGF0aWJsZSB3aXRoIHRoZSBicm93c2VycyBzcGVjaWZpZWQgYmVsb3dcclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ganNJbnB1dFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JJRT1mYWxzZV0gLSB3aGV0aGVyIHRoZSBqc0lucHV0IHNob3VsZCBiZSB0cmFuc3BpbGVkIGZvciBJbnRlcm5ldCBFeHBsb3JlclxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIFRoZSB0cmFuc3BpbGVkIGNvZGVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGpzSW5wdXQsIGZvcklFID0gZmFsc2UgKSB7XHJcblxyXG4gIC8vIFRoaXMgbGlzdCBzcGVjaWZpZXMgdGhlIHRhcmdldCBicm93c2VycyBmb3IgQmFiZWwuIEl0cyBmb3JtYXQgaXMgZGVzY3JpYmVkIGF0IGh0dHBzOi8vYnJvd3NlcnNsLmlzdC5cclxuICAvLyBOb3RlIHRoYXQgdGhpcyBpcyByZWxhdGVkIHRvIFN5c3RlbSBSZXF1aXJlbWVudHMgYWR2ZXJ0aXNlZCBvbiB0aGUgUGhFVCB3ZWJzaXRlLCBzbyBzaG91bGQgYmUgbW9kaWZpZWQgd2l0aCBjYXJlLlxyXG4gIC8vIE5ldmVyIHJlbW92ZSBhZHZlcnRpc2VkIHBsYXRmb3JtcyBmcm9tIHRoaXMgbGlzdCB3aXRob3V0IGEgYnJvYWRlciBkaXNjdXNzaW9uLiBBbmQgbm90ZSB0aGF0IFBoRVQgd2lsbCBzb21ldGltZXNcclxuICAvLyBwcm92aWRlIHVub2ZmaWNpYWwgc3VwcG9ydCBmb3Igb2xkZXIgcGxhdGZvcm1zLCBzbyB2ZXJzaW9uIG51bWJlcnMgbWF5IGJlIGxvd2VyIHRoYW4gd2hhdCBpcyBhZHZlcnRpc2VkIG9uIHRoZVxyXG4gIC8vIFBoRVQgd2Vic2l0ZS4gRm9yIG1vcmUgaGlzdG9yeSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMzIzLlxyXG4gIGNvbnN0IGJyb3dzZXJzID0gW1xyXG4gICAgJ2RlZmF1bHRzJyxcclxuICAgICdzYWZhcmkgPj0gMTMnLFxyXG4gICAgJ2lPUyA+PSAxMydcclxuICBdO1xyXG4gIGlmICggZm9ySUUgKSB7XHJcbiAgICBicm93c2Vycy5wdXNoKCAnSUUgMTEnICk7XHJcbiAgfVxyXG5cclxuICAvLyBTZWUgb3B0aW9ucyBhdmFpbGFibGUgYXQgaHR0cHM6Ly9iYWJlbGpzLmlvL2RvY3MvdXNhZ2UvYXBpL1xyXG4gIHJldHVybiBiYWJlbC50cmFuc2Zvcm0oIGpzSW5wdXQsIHtcclxuXHJcbiAgICAvLyBBdm9pZHMgYSB3YXJuaW5nIHRoYXQgdGhpcyBnZXRzIGRpc2FibGVkIGZvciA+NTAwa2Igb2Ygc291cmNlLiB0cnVlL2ZhbHNlIGRvZXNuJ3QgYWZmZWN0IHRoZSBsYXRlciBtaW5pZmllZCBzaXplLCBhbmRcclxuICAgIC8vIHRoZSAndHJ1ZScgb3B0aW9uIHdhcyBmYXN0ZXIgYnkgYSBoYWlyLlxyXG4gICAgY29tcGFjdDogdHJ1ZSxcclxuXHJcbiAgICAvLyBVc2UgY2hpcHBlcidzIGNvcHkgb2YgYmFiZWwtcHJlc2V0LWVudiwgc28gd2UgZG9uJ3QgaGF2ZSB0byBoYXZlIDMwTUIgZXh0cmEgcGVyIHNpbSBjaGVja2VkIG91dC5cclxuICAgIC8vIFRoaXMgc3RyYXRlZ3kgaXMgYWxzbyB1c2VkIGluIFRyYW5zcGlsZXIuanNcclxuICAgIHByZXNldHM6IFsgWyAnLi4vY2hpcHBlci9ub2RlX21vZHVsZXMvQGJhYmVsL3ByZXNldC1lbnYnLCB7XHJcblxyXG4gICAgICAvLyBQYXJzZSBhcyBcInNjcmlwdFwiIHR5cGUsIHNvIFwidGhpc1wiIHdpbGwgcmVmZXIgdG8gXCJ3aW5kb3dcIiBpbnN0ZWFkIG9mIGJlaW5nIHRyYW5zcGlsZWQgdG8gYHZvaWQgMGAgYWthIHVuZGVmaW5lZFxyXG4gICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzcyMyNpc3N1ZWNvbW1lbnQtNDQzOTY2NTUwXHJcbiAgICAgIG1vZHVsZXM6IGZhbHNlLFxyXG4gICAgICB0YXJnZXRzOiB7XHJcbiAgICAgICAgYnJvd3NlcnM6IGJyb3dzZXJzXHJcbiAgICAgIH1cclxuICAgIH0gXSBdXHJcbiAgfSApLmNvZGU7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0E7QUFDQSxJQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBRSxhQUFjLENBQUMsQ0FBQyxDQUFDOztBQUV4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLE9BQU8sRUFBa0I7RUFBQSxJQUFoQkMsS0FBSyxHQUFBQyxTQUFBLENBQUFDLE1BQUEsUUFBQUQsU0FBQSxRQUFBRSxTQUFBLEdBQUFGLFNBQUEsTUFBRyxLQUFLO0VBRS9DO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFNRyxRQUFRLEdBQUcsQ0FDZixVQUFVLEVBQ1YsY0FBYyxFQUNkLFdBQVcsQ0FDWjtFQUNELElBQUtKLEtBQUssRUFBRztJQUNYSSxRQUFRLENBQUNDLElBQUksQ0FBRSxPQUFRLENBQUM7RUFDMUI7O0VBRUE7RUFDQSxPQUFPVixLQUFLLENBQUNXLFNBQVMsQ0FBRVAsT0FBTyxFQUFFO0lBRS9CO0lBQ0E7SUFDQVEsT0FBTyxFQUFFLElBQUk7SUFFYjtJQUNBO0lBQ0FDLE9BQU8sRUFBRSxDQUFFLENBQUUsMkNBQTJDLEVBQUU7TUFFeEQ7TUFDQTtNQUNBQyxPQUFPLEVBQUUsS0FBSztNQUNkQyxPQUFPLEVBQUU7UUFDUE4sUUFBUSxFQUFFQTtNQUNaO0lBQ0YsQ0FBQyxDQUFFO0VBQ0wsQ0FBRSxDQUFDLENBQUNPLElBQUk7QUFDVixDQUFDIiwiaWdub3JlTGlzdCI6W119