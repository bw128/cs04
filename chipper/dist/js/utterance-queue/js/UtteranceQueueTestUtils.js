// Copyright 2023-2024, University of Colorado Boulder

/**
 * A set of utility functions that are useful for all utterance-queue tests.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import stepTimer from '../../axon/js/stepTimer.js';

// Arbitrary value to let the
const TIMING_BUFFER = 300;
class UtteranceQueueTestUtils {
  /**
   * Helper es6 promise timeout function.
   * @param ms
   */
  static timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)); // eslint-disable-line bad-sim-text
  }

  /**
   * Workarounds that need to be done before each test to let the Utterance Queue finish an timed operation before
   * the next test. This is not needed when running manually, but I believe will fix problems when running on
   * CT/Puppeteer where resource availablility, running headless, or other factors may cause differences.
   */
  static async beforeEachTimingWorkarounds() {
    // Give plenty of time for the Announcer to be ready to speak again. For some reason this needs to be a really
    // large number to get tests to pass consistently. I am starting to have a hunch that QUnit tries to run
    // async tests in parallel...
    await UtteranceQueueTestUtils.timeout(TIMING_BUFFER * 3);

    // From debugging, I am not convinced that setInterval is called consistently while we wait for timeouts. Stepping
    // the timer here improves consistency and gets certain tests passing. Specifically, I want to make sure that
    // timing variables related to waiting for voicingManager to be readyToAnnounce have enough time to reset
    stepTimer.emit(TIMING_BUFFER * 3);
  }
}

// This is a test utility file and does not need to be in the namespace.
// eslint-disable-next-line default-export-class-should-register-namespace
export default UtteranceQueueTestUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdGVwVGltZXIiLCJUSU1JTkdfQlVGRkVSIiwiVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHMiLCJ0aW1lb3V0IiwibXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJiZWZvcmVFYWNoVGltaW5nV29ya2Fyb3VuZHMiLCJlbWl0Il0sInNvdXJjZXMiOlsiVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzZXQgb2YgdXRpbGl0eSBmdW5jdGlvbnMgdGhhdCBhcmUgdXNlZnVsIGZvciBhbGwgdXR0ZXJhbmNlLXF1ZXVlIHRlc3RzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgc3RlcFRpbWVyIGZyb20gJy4uLy4uL2F4b24vanMvc3RlcFRpbWVyLmpzJztcclxuXHJcbi8vIEFyYml0cmFyeSB2YWx1ZSB0byBsZXQgdGhlXHJcbmNvbnN0IFRJTUlOR19CVUZGRVIgPSAzMDA7XHJcblxyXG5jbGFzcyBVdHRlcmFuY2VRdWV1ZVRlc3RVdGlscyB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBlczYgcHJvbWlzZSB0aW1lb3V0IGZ1bmN0aW9uLlxyXG4gICAqIEBwYXJhbSBtc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgdGltZW91dCggbXM6IG51bWJlciApOiBQcm9taXNlPHVua25vd24+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSggcmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCByZXNvbHZlLCBtcyApICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXb3JrYXJvdW5kcyB0aGF0IG5lZWQgdG8gYmUgZG9uZSBiZWZvcmUgZWFjaCB0ZXN0IHRvIGxldCB0aGUgVXR0ZXJhbmNlIFF1ZXVlIGZpbmlzaCBhbiB0aW1lZCBvcGVyYXRpb24gYmVmb3JlXHJcbiAgICogdGhlIG5leHQgdGVzdC4gVGhpcyBpcyBub3QgbmVlZGVkIHdoZW4gcnVubmluZyBtYW51YWxseSwgYnV0IEkgYmVsaWV2ZSB3aWxsIGZpeCBwcm9ibGVtcyB3aGVuIHJ1bm5pbmcgb25cclxuICAgKiBDVC9QdXBwZXRlZXIgd2hlcmUgcmVzb3VyY2UgYXZhaWxhYmxpbGl0eSwgcnVubmluZyBoZWFkbGVzcywgb3Igb3RoZXIgZmFjdG9ycyBtYXkgY2F1c2UgZGlmZmVyZW5jZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhc3luYyBiZWZvcmVFYWNoVGltaW5nV29ya2Fyb3VuZHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgLy8gR2l2ZSBwbGVudHkgb2YgdGltZSBmb3IgdGhlIEFubm91bmNlciB0byBiZSByZWFkeSB0byBzcGVhayBhZ2Fpbi4gRm9yIHNvbWUgcmVhc29uIHRoaXMgbmVlZHMgdG8gYmUgYSByZWFsbHlcclxuICAgIC8vIGxhcmdlIG51bWJlciB0byBnZXQgdGVzdHMgdG8gcGFzcyBjb25zaXN0ZW50bHkuIEkgYW0gc3RhcnRpbmcgdG8gaGF2ZSBhIGh1bmNoIHRoYXQgUVVuaXQgdHJpZXMgdG8gcnVuXHJcbiAgICAvLyBhc3luYyB0ZXN0cyBpbiBwYXJhbGxlbC4uLlxyXG4gICAgYXdhaXQgVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHMudGltZW91dCggVElNSU5HX0JVRkZFUiAqIDMgKTtcclxuXHJcbiAgICAvLyBGcm9tIGRlYnVnZ2luZywgSSBhbSBub3QgY29udmluY2VkIHRoYXQgc2V0SW50ZXJ2YWwgaXMgY2FsbGVkIGNvbnNpc3RlbnRseSB3aGlsZSB3ZSB3YWl0IGZvciB0aW1lb3V0cy4gU3RlcHBpbmdcclxuICAgIC8vIHRoZSB0aW1lciBoZXJlIGltcHJvdmVzIGNvbnNpc3RlbmN5IGFuZCBnZXRzIGNlcnRhaW4gdGVzdHMgcGFzc2luZy4gU3BlY2lmaWNhbGx5LCBJIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXRcclxuICAgIC8vIHRpbWluZyB2YXJpYWJsZXMgcmVsYXRlZCB0byB3YWl0aW5nIGZvciB2b2ljaW5nTWFuYWdlciB0byBiZSByZWFkeVRvQW5ub3VuY2UgaGF2ZSBlbm91Z2ggdGltZSB0byByZXNldFxyXG4gICAgc3RlcFRpbWVyLmVtaXQoIFRJTUlOR19CVUZGRVIgKiAzICk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBUaGlzIGlzIGEgdGVzdCB1dGlsaXR5IGZpbGUgYW5kIGRvZXMgbm90IG5lZWQgdG8gYmUgaW4gdGhlIG5hbWVzcGFjZS5cclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGRlZmF1bHQtZXhwb3J0LWNsYXNzLXNob3VsZC1yZWdpc3Rlci1uYW1lc3BhY2VcclxuZXhwb3J0IGRlZmF1bHQgVXR0ZXJhbmNlUXVldWVUZXN0VXRpbHM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBTSw0QkFBNEI7O0FBRWxEO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLEdBQUc7QUFFekIsTUFBTUMsdUJBQXVCLENBQUM7RUFFNUI7QUFDRjtBQUNBO0FBQ0E7RUFDRSxPQUFjQyxPQUFPQSxDQUFFQyxFQUFVLEVBQXFCO0lBQ3BELE9BQU8sSUFBSUMsT0FBTyxDQUFFQyxPQUFPLElBQUlDLFVBQVUsQ0FBRUQsT0FBTyxFQUFFRixFQUFHLENBQUUsQ0FBQyxDQUFDLENBQUM7RUFDOUQ7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLGFBQW9CSSwyQkFBMkJBLENBQUEsRUFBa0I7SUFFL0Q7SUFDQTtJQUNBO0lBQ0EsTUFBTU4sdUJBQXVCLENBQUNDLE9BQU8sQ0FBRUYsYUFBYSxHQUFHLENBQUUsQ0FBQzs7SUFFMUQ7SUFDQTtJQUNBO0lBQ0FELFNBQVMsQ0FBQ1MsSUFBSSxDQUFFUixhQUFhLEdBQUcsQ0FBRSxDQUFDO0VBQ3JDO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBLGVBQWVDLHVCQUF1QiIsImlnbm9yZUxpc3QiOltdfQ==