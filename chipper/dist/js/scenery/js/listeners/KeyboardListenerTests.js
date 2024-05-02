// Copyright 2022-2024, University of Colorado Boulder

/**
 * KeyboardListener tests.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import { Display, globalKeyStateTracker, KeyboardListener, KeyboardUtils, Node } from '../imports.js';
QUnit.module('KeyboardListener', {
  before() {
    // clear in case other tests didn't finish with a keyup event
    globalKeyStateTracker.clearState();
  }
});
const triggerKeydownEvent = (target, code, ctrlKey = false) => {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    code: code,
    bubbles: true,
    ctrlKey: ctrlKey
  }));
};
const triggerKeyupEvent = (target, code, ctrlKey = false) => {
  target.dispatchEvent(new KeyboardEvent('keyup', {
    code: code,
    bubbles: true,
    ctrlKey: ctrlKey
  }));
};
QUnit.test('KeyboardListener Tests', assert => {
  const rootNode = new Node({
    tagName: 'div'
  });
  const display = new Display(rootNode);
  display.initializeEvents();
  document.body.appendChild(display.domElement);

  //////////////////////////////////////////////////

  let callbackFired = false;
  const listener = new KeyboardListener({
    keys: ['enter'],
    fire: () => {
      assert.ok(!callbackFired, 'callback cannot be fired');
      callbackFired = true;
    }
  });

  // Test putting a key in keys that is not supported (error only thrown with assertions enabled)
  window.assert && assert.throws(() => {
    const bogusListener = new KeyboardListener({
      // @ts-expect-error - Typescript should catch bad keys too
      keys: ['badKey'],
      fire: () => {

        // just testing the typing, no work to do here
      }
    });
    bogusListener.dispose();
  }, Error, 'Constructor should catch providing bad keys at runtime');
  const a = new Node({
    tagName: 'div',
    focusable: true
  });
  rootNode.addChild(a);
  a.addInputListener(listener);
  const domElementA = a.pdomInstances[0].peer.primarySibling;
  assert.ok(domElementA, 'pdom element needed');

  // Hotkey uses the focused Trail to determine if it should fire, so we need to focus the element
  a.focus();
  triggerKeydownEvent(domElementA, KeyboardUtils.KEY_TAB);
  assert.ok(!callbackFired, 'should not fire on tab');
  triggerKeyupEvent(domElementA, KeyboardUtils.KEY_TAB);
  triggerKeydownEvent(domElementA, KeyboardUtils.KEY_ENTER);
  assert.ok(callbackFired, 'should fire on enter');
  triggerKeyupEvent(domElementA, KeyboardUtils.KEY_ENTER);

  //////////////////////////////////////////////////////
  // Test an overlap of keys in two keygroups. The callback should fire for only the keygroup where every key
  // is down and only every key is down.
  a.removeInputListener(listener);
  let pFired = false;
  let ctrlPFired = false;
  const listenerWithOverlappingKeys = new KeyboardListener({
    keys: ['p', 'ctrl+p'],
    fire: (event, keysPressed) => {
      if (keysPressed === 'p') {
        pFired = true;
      } else if (keysPressed === 'ctrl+p') {
        ctrlPFired = true;
      } else {
        assert.ok(false, 'never again');
      }
    }
  });
  a.addInputListener(listenerWithOverlappingKeys);

  // TODO: https://github.com/phetsims/scenery/issues/1570, This is a workaround for a problem with hotkeyManager
  //   where it doesn't update the availableHotkeys when new input listeners are added. We can manually update by
  //   triggering focus changes.
  a.blur();
  a.focus();
  triggerKeydownEvent(domElementA, KeyboardUtils.KEY_P, true);
  assert.ok(!pFired, 'p should not fire because control key is down');
  assert.ok(ctrlPFired, 'ctrl P should have fired');
  //////////////////////////////////////////////////////

  // test interrupt/cancel
  // TODO: This test fails but that is working as expected. interrupt/cancel are only relevant for the https://github.com/phetsims/scenery/issues/1581
  // listener for press and hold functionality. Interrupt/cancel cannot clear the keystate because the listener
  // does not own its KeyStateTracker, it is using the global one.
  // let pbFiredFromA = false;
  // let pbjFiredFromA = false;
  // const listenerToInterrupt = new KeyboardListener( {
  //   keys: [ 'p+b', 'p+b+j' ],
  // callback: ( event, listener ) => {
  //   const keysPressed = listener.keysPressed;
  //     if ( keysPressed === 'p+b' ) {
  //       pbFiredFromA = true;
  //       listenerToInterrupt.interrupt();
  //     }
  //     else if ( keysPressed === 'p+b+j' ) {
  //       pbjFiredFromA = true;
  //     }
  //   }
  // } );
  // a.addInputListener( listenerToInterrupt );
  //
  // domElementB.dispatchEvent( new KeyboardEvent( 'keydown', {
  //   code: KeyboardUtils.KEY_P,
  //   bubbles: true
  // } ) );
  // domElementB.dispatchEvent( new KeyboardEvent( 'keydown', {
  //   code: KeyboardUtils.KEY_B,
  //   bubbles: true
  // } ) );
  // domElementB.dispatchEvent( new KeyboardEvent( 'keydown', {
  //   code: KeyboardUtils.KEY_J,
  //   bubbles: true
  // } ) );
  //
  // assert.ok( pbFiredFromA, 'p+b receives the event and interrupts the listener' );
  // assert.ok( !pbjFiredFromA, 'interruption clears the keystate so p+b+j does not fire' );

  //////////////////////////////////////////////////////

  document.body.removeChild(display.domElement);
  display.dispose();
});

//
// QUnit.test( 'KeyboardListener Callback timing', assert => {
//   const rootNode = new Node( { tagName: 'div' } );
//   const display = new Display( rootNode );
//   display.initializeEvents();
//   document.body.appendChild( display.domElement );
//
//
//   //
//   // a -> callback timer
//   //
//   // wait
//   // b -> callback timer
//   //
//   // release before b
//   //
//   // ensure a fires
//
//
//   document.body.removeChild( display.domElement );
//   display.dispose();
// });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaXNwbGF5IiwiZ2xvYmFsS2V5U3RhdGVUcmFja2VyIiwiS2V5Ym9hcmRMaXN0ZW5lciIsIktleWJvYXJkVXRpbHMiLCJOb2RlIiwiUVVuaXQiLCJtb2R1bGUiLCJiZWZvcmUiLCJjbGVhclN0YXRlIiwidHJpZ2dlcktleWRvd25FdmVudCIsInRhcmdldCIsImNvZGUiLCJjdHJsS2V5IiwiZGlzcGF0Y2hFdmVudCIsIktleWJvYXJkRXZlbnQiLCJidWJibGVzIiwidHJpZ2dlcktleXVwRXZlbnQiLCJ0ZXN0IiwiYXNzZXJ0Iiwicm9vdE5vZGUiLCJ0YWdOYW1lIiwiZGlzcGxheSIsImluaXRpYWxpemVFdmVudHMiLCJkb2N1bWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImRvbUVsZW1lbnQiLCJjYWxsYmFja0ZpcmVkIiwibGlzdGVuZXIiLCJrZXlzIiwiZmlyZSIsIm9rIiwid2luZG93IiwidGhyb3dzIiwiYm9ndXNMaXN0ZW5lciIsImRpc3Bvc2UiLCJFcnJvciIsImEiLCJmb2N1c2FibGUiLCJhZGRDaGlsZCIsImFkZElucHV0TGlzdGVuZXIiLCJkb21FbGVtZW50QSIsInBkb21JbnN0YW5jZXMiLCJwZWVyIiwicHJpbWFyeVNpYmxpbmciLCJmb2N1cyIsIktFWV9UQUIiLCJLRVlfRU5URVIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwicEZpcmVkIiwiY3RybFBGaXJlZCIsImxpc3RlbmVyV2l0aE92ZXJsYXBwaW5nS2V5cyIsImV2ZW50Iiwia2V5c1ByZXNzZWQiLCJibHVyIiwiS0VZX1AiLCJyZW1vdmVDaGlsZCJdLCJzb3VyY2VzIjpbIktleWJvYXJkTGlzdGVuZXJUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBLZXlib2FyZExpc3RlbmVyIHRlc3RzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEFndXN0w61uIFZhbGxlam8gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgRGlzcGxheSwgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLCBLZXlib2FyZExpc3RlbmVyLCBLZXlib2FyZFV0aWxzLCBOb2RlIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdLZXlib2FyZExpc3RlbmVyJywge1xyXG4gIGJlZm9yZSgpIHtcclxuXHJcbiAgICAvLyBjbGVhciBpbiBjYXNlIG90aGVyIHRlc3RzIGRpZG4ndCBmaW5pc2ggd2l0aCBhIGtleXVwIGV2ZW50XHJcbiAgICBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIuY2xlYXJTdGF0ZSgpO1xyXG4gIH1cclxufSApO1xyXG5cclxuY29uc3QgdHJpZ2dlcktleWRvd25FdmVudCA9ICggdGFyZ2V0OiBIVE1MRWxlbWVudCwgY29kZTogc3RyaW5nLCBjdHJsS2V5ID0gZmFsc2UgKSA9PiB7XHJcbiAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQoIG5ldyBLZXlib2FyZEV2ZW50KCAna2V5ZG93bicsIHtcclxuICAgIGNvZGU6IGNvZGUsXHJcbiAgICBidWJibGVzOiB0cnVlLFxyXG4gICAgY3RybEtleTogY3RybEtleVxyXG4gIH0gKSApO1xyXG59O1xyXG5cclxuY29uc3QgdHJpZ2dlcktleXVwRXZlbnQgPSAoIHRhcmdldDogSFRNTEVsZW1lbnQsIGNvZGU6IHN0cmluZywgY3RybEtleSA9IGZhbHNlICkgPT4ge1xyXG4gIHRhcmdldC5kaXNwYXRjaEV2ZW50KCBuZXcgS2V5Ym9hcmRFdmVudCggJ2tleXVwJywge1xyXG4gICAgY29kZTogY29kZSxcclxuICAgIGJ1YmJsZXM6IHRydWUsXHJcbiAgICBjdHJsS2V5OiBjdHJsS2V5XHJcbiAgfSApICk7XHJcbn07XHJcblxyXG5RVW5pdC50ZXN0KCAnS2V5Ym9hcmRMaXN0ZW5lciBUZXN0cycsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IHJvb3ROb2RlID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicgfSApO1xyXG4gIGNvbnN0IGRpc3BsYXkgPSBuZXcgRGlzcGxheSggcm9vdE5vZGUgKTtcclxuICBkaXNwbGF5LmluaXRpYWxpemVFdmVudHMoKTtcclxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBkaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgbGV0IGNhbGxiYWNrRmlyZWQgPSBmYWxzZTtcclxuICBjb25zdCBsaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICBrZXlzOiBbICdlbnRlcicgXSxcclxuICAgIGZpcmU6ICgpID0+IHtcclxuICAgICAgYXNzZXJ0Lm9rKCAhY2FsbGJhY2tGaXJlZCwgJ2NhbGxiYWNrIGNhbm5vdCBiZSBmaXJlZCcgKTtcclxuICAgICAgY2FsbGJhY2tGaXJlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBUZXN0IHB1dHRpbmcgYSBrZXkgaW4ga2V5cyB0aGF0IGlzIG5vdCBzdXBwb3J0ZWQgKGVycm9yIG9ubHkgdGhyb3duIHdpdGggYXNzZXJ0aW9ucyBlbmFibGVkKVxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgY29uc3QgYm9ndXNMaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gVHlwZXNjcmlwdCBzaG91bGQgY2F0Y2ggYmFkIGtleXMgdG9vXHJcbiAgICAgIGtleXM6IFsgJ2JhZEtleScgXSxcclxuICAgICAgZmlyZTogKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBqdXN0IHRlc3RpbmcgdGhlIHR5cGluZywgbm8gd29yayB0byBkbyBoZXJlXHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIGJvZ3VzTGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gIH0sIEVycm9yLCAnQ29uc3RydWN0b3Igc2hvdWxkIGNhdGNoIHByb3ZpZGluZyBiYWQga2V5cyBhdCBydW50aW1lJyApO1xyXG5cclxuICBjb25zdCBhID0gbmV3IE5vZGUoIHsgdGFnTmFtZTogJ2RpdicsIGZvY3VzYWJsZTogdHJ1ZSB9ICk7XHJcbiAgcm9vdE5vZGUuYWRkQ2hpbGQoIGEgKTtcclxuICBhLmFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcblxyXG4gIGNvbnN0IGRvbUVsZW1lbnRBID0gYS5wZG9tSW5zdGFuY2VzWyAwIF0ucGVlciEucHJpbWFyeVNpYmxpbmchO1xyXG4gIGFzc2VydC5vayggZG9tRWxlbWVudEEsICdwZG9tIGVsZW1lbnQgbmVlZGVkJyApO1xyXG5cclxuICAvLyBIb3RrZXkgdXNlcyB0aGUgZm9jdXNlZCBUcmFpbCB0byBkZXRlcm1pbmUgaWYgaXQgc2hvdWxkIGZpcmUsIHNvIHdlIG5lZWQgdG8gZm9jdXMgdGhlIGVsZW1lbnRcclxuICBhLmZvY3VzKCk7XHJcblxyXG4gIHRyaWdnZXJLZXlkb3duRXZlbnQoIGRvbUVsZW1lbnRBLCBLZXlib2FyZFV0aWxzLktFWV9UQUIgKTtcclxuICBhc3NlcnQub2soICFjYWxsYmFja0ZpcmVkLCAnc2hvdWxkIG5vdCBmaXJlIG9uIHRhYicgKTtcclxuICB0cmlnZ2VyS2V5dXBFdmVudCggZG9tRWxlbWVudEEsIEtleWJvYXJkVXRpbHMuS0VZX1RBQiApO1xyXG5cclxuICB0cmlnZ2VyS2V5ZG93bkV2ZW50KCBkb21FbGVtZW50QSwgS2V5Ym9hcmRVdGlscy5LRVlfRU5URVIgKTtcclxuICBhc3NlcnQub2soIGNhbGxiYWNrRmlyZWQsICdzaG91bGQgZmlyZSBvbiBlbnRlcicgKTtcclxuICB0cmlnZ2VyS2V5dXBFdmVudCggZG9tRWxlbWVudEEsIEtleWJvYXJkVXRpbHMuS0VZX0VOVEVSICk7XHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIFRlc3QgYW4gb3ZlcmxhcCBvZiBrZXlzIGluIHR3byBrZXlncm91cHMuIFRoZSBjYWxsYmFjayBzaG91bGQgZmlyZSBmb3Igb25seSB0aGUga2V5Z3JvdXAgd2hlcmUgZXZlcnkga2V5XHJcbiAgLy8gaXMgZG93biBhbmQgb25seSBldmVyeSBrZXkgaXMgZG93bi5cclxuICBhLnJlbW92ZUlucHV0TGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcblxyXG4gIGxldCBwRmlyZWQgPSBmYWxzZTtcclxuICBsZXQgY3RybFBGaXJlZCA9IGZhbHNlO1xyXG4gIGNvbnN0IGxpc3RlbmVyV2l0aE92ZXJsYXBwaW5nS2V5cyA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICBrZXlzOiBbICdwJywgJ2N0cmwrcCcgXSxcclxuXHJcbiAgICBmaXJlOiAoIGV2ZW50LCBrZXlzUHJlc3NlZCApID0+IHtcclxuICAgICAgaWYgKCBrZXlzUHJlc3NlZCA9PT0gJ3AnICkge1xyXG4gICAgICAgIHBGaXJlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGtleXNQcmVzc2VkID09PSAnY3RybCtwJyApIHtcclxuICAgICAgICBjdHJsUEZpcmVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhc3NlcnQub2soIGZhbHNlLCAnbmV2ZXIgYWdhaW4nICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIGEuYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXJXaXRoT3ZlcmxhcHBpbmdLZXlzICk7XHJcblxyXG4gIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTcwLCBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgYSBwcm9ibGVtIHdpdGggaG90a2V5TWFuYWdlclxyXG4gIC8vICAgd2hlcmUgaXQgZG9lc24ndCB1cGRhdGUgdGhlIGF2YWlsYWJsZUhvdGtleXMgd2hlbiBuZXcgaW5wdXQgbGlzdGVuZXJzIGFyZSBhZGRlZC4gV2UgY2FuIG1hbnVhbGx5IHVwZGF0ZSBieVxyXG4gIC8vICAgdHJpZ2dlcmluZyBmb2N1cyBjaGFuZ2VzLlxyXG4gIGEuYmx1cigpO1xyXG4gIGEuZm9jdXMoKTtcclxuXHJcbiAgdHJpZ2dlcktleWRvd25FdmVudCggZG9tRWxlbWVudEEsIEtleWJvYXJkVXRpbHMuS0VZX1AsIHRydWUgKTtcclxuICBhc3NlcnQub2soICFwRmlyZWQsICdwIHNob3VsZCBub3QgZmlyZSBiZWNhdXNlIGNvbnRyb2wga2V5IGlzIGRvd24nICk7XHJcbiAgYXNzZXJ0Lm9rKCBjdHJsUEZpcmVkLCAnY3RybCBQIHNob3VsZCBoYXZlIGZpcmVkJyApO1xyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICAvLyB0ZXN0IGludGVycnVwdC9jYW5jZWxcclxuICAvLyBUT0RPOiBUaGlzIHRlc3QgZmFpbHMgYnV0IHRoYXQgaXMgd29ya2luZyBhcyBleHBlY3RlZC4gaW50ZXJydXB0L2NhbmNlbCBhcmUgb25seSByZWxldmFudCBmb3IgdGhlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgLy8gbGlzdGVuZXIgZm9yIHByZXNzIGFuZCBob2xkIGZ1bmN0aW9uYWxpdHkuIEludGVycnVwdC9jYW5jZWwgY2Fubm90IGNsZWFyIHRoZSBrZXlzdGF0ZSBiZWNhdXNlIHRoZSBsaXN0ZW5lclxyXG4gIC8vIGRvZXMgbm90IG93biBpdHMgS2V5U3RhdGVUcmFja2VyLCBpdCBpcyB1c2luZyB0aGUgZ2xvYmFsIG9uZS5cclxuICAvLyBsZXQgcGJGaXJlZEZyb21BID0gZmFsc2U7XHJcbiAgLy8gbGV0IHBiakZpcmVkRnJvbUEgPSBmYWxzZTtcclxuICAvLyBjb25zdCBsaXN0ZW5lclRvSW50ZXJydXB0ID0gbmV3IEtleWJvYXJkTGlzdGVuZXIoIHtcclxuICAvLyAgIGtleXM6IFsgJ3ArYicsICdwK2IraicgXSxcclxuICAvLyBjYWxsYmFjazogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7XHJcbiAgLy8gICBjb25zdCBrZXlzUHJlc3NlZCA9IGxpc3RlbmVyLmtleXNQcmVzc2VkO1xyXG4gIC8vICAgICBpZiAoIGtleXNQcmVzc2VkID09PSAncCtiJyApIHtcclxuICAvLyAgICAgICBwYkZpcmVkRnJvbUEgPSB0cnVlO1xyXG4gIC8vICAgICAgIGxpc3RlbmVyVG9JbnRlcnJ1cHQuaW50ZXJydXB0KCk7XHJcbiAgLy8gICAgIH1cclxuICAvLyAgICAgZWxzZSBpZiAoIGtleXNQcmVzc2VkID09PSAncCtiK2onICkge1xyXG4gIC8vICAgICAgIHBiakZpcmVkRnJvbUEgPSB0cnVlO1xyXG4gIC8vICAgICB9XHJcbiAgLy8gICB9XHJcbiAgLy8gfSApO1xyXG4gIC8vIGEuYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXJUb0ludGVycnVwdCApO1xyXG4gIC8vXHJcbiAgLy8gZG9tRWxlbWVudEIuZGlzcGF0Y2hFdmVudCggbmV3IEtleWJvYXJkRXZlbnQoICdrZXlkb3duJywge1xyXG4gIC8vICAgY29kZTogS2V5Ym9hcmRVdGlscy5LRVlfUCxcclxuICAvLyAgIGJ1YmJsZXM6IHRydWVcclxuICAvLyB9ICkgKTtcclxuICAvLyBkb21FbGVtZW50Qi5kaXNwYXRjaEV2ZW50KCBuZXcgS2V5Ym9hcmRFdmVudCggJ2tleWRvd24nLCB7XHJcbiAgLy8gICBjb2RlOiBLZXlib2FyZFV0aWxzLktFWV9CLFxyXG4gIC8vICAgYnViYmxlczogdHJ1ZVxyXG4gIC8vIH0gKSApO1xyXG4gIC8vIGRvbUVsZW1lbnRCLmRpc3BhdGNoRXZlbnQoIG5ldyBLZXlib2FyZEV2ZW50KCAna2V5ZG93bicsIHtcclxuICAvLyAgIGNvZGU6IEtleWJvYXJkVXRpbHMuS0VZX0osXHJcbiAgLy8gICBidWJibGVzOiB0cnVlXHJcbiAgLy8gfSApICk7XHJcbiAgLy9cclxuICAvLyBhc3NlcnQub2soIHBiRmlyZWRGcm9tQSwgJ3ArYiByZWNlaXZlcyB0aGUgZXZlbnQgYW5kIGludGVycnVwdHMgdGhlIGxpc3RlbmVyJyApO1xyXG4gIC8vIGFzc2VydC5vayggIXBiakZpcmVkRnJvbUEsICdpbnRlcnJ1cHRpb24gY2xlYXJzIHRoZSBrZXlzdGF0ZSBzbyBwK2IraiBkb2VzIG5vdCBmaXJlJyApO1xyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbiAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbn0gKTtcclxuXHJcbi8vXHJcbi8vIFFVbml0LnRlc3QoICdLZXlib2FyZExpc3RlbmVyIENhbGxiYWNrIHRpbWluZycsIGFzc2VydCA9PiB7XHJcbi8vICAgY29uc3Qgcm9vdE5vZGUgPSBuZXcgTm9kZSggeyB0YWdOYW1lOiAnZGl2JyB9ICk7XHJcbi8vICAgY29uc3QgZGlzcGxheSA9IG5ldyBEaXNwbGF5KCByb290Tm9kZSApO1xyXG4vLyAgIGRpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpO1xyXG4vLyAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGRpc3BsYXkuZG9tRWxlbWVudCApO1xyXG4vL1xyXG4vL1xyXG4vLyAgIC8vXHJcbi8vICAgLy8gYSAtPiBjYWxsYmFjayB0aW1lclxyXG4vLyAgIC8vXHJcbi8vICAgLy8gd2FpdFxyXG4vLyAgIC8vIGIgLT4gY2FsbGJhY2sgdGltZXJcclxuLy8gICAvL1xyXG4vLyAgIC8vIHJlbGVhc2UgYmVmb3JlIGJcclxuLy8gICAvL1xyXG4vLyAgIC8vIGVuc3VyZSBhIGZpcmVzXHJcbi8vXHJcbi8vXHJcbi8vICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCggZGlzcGxheS5kb21FbGVtZW50ICk7XHJcbi8vICAgZGlzcGxheS5kaXNwb3NlKCk7XHJcbi8vIH0pOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsT0FBTyxFQUFFQyxxQkFBcUIsRUFBRUMsZ0JBQWdCLEVBQUVDLGFBQWEsRUFBRUMsSUFBSSxRQUFRLGVBQWU7QUFFckdDLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLGtCQUFrQixFQUFFO0VBQ2hDQyxNQUFNQSxDQUFBLEVBQUc7SUFFUDtJQUNBTixxQkFBcUIsQ0FBQ08sVUFBVSxDQUFDLENBQUM7RUFDcEM7QUFDRixDQUFFLENBQUM7QUFFSCxNQUFNQyxtQkFBbUIsR0FBR0EsQ0FBRUMsTUFBbUIsRUFBRUMsSUFBWSxFQUFFQyxPQUFPLEdBQUcsS0FBSyxLQUFNO0VBQ3BGRixNQUFNLENBQUNHLGFBQWEsQ0FBRSxJQUFJQyxhQUFhLENBQUUsU0FBUyxFQUFFO0lBQ2xESCxJQUFJLEVBQUVBLElBQUk7SUFDVkksT0FBTyxFQUFFLElBQUk7SUFDYkgsT0FBTyxFQUFFQTtFQUNYLENBQUUsQ0FBRSxDQUFDO0FBQ1AsQ0FBQztBQUVELE1BQU1JLGlCQUFpQixHQUFHQSxDQUFFTixNQUFtQixFQUFFQyxJQUFZLEVBQUVDLE9BQU8sR0FBRyxLQUFLLEtBQU07RUFDbEZGLE1BQU0sQ0FBQ0csYUFBYSxDQUFFLElBQUlDLGFBQWEsQ0FBRSxPQUFPLEVBQUU7SUFDaERILElBQUksRUFBRUEsSUFBSTtJQUNWSSxPQUFPLEVBQUUsSUFBSTtJQUNiSCxPQUFPLEVBQUVBO0VBQ1gsQ0FBRSxDQUFFLENBQUM7QUFDUCxDQUFDO0FBRURQLEtBQUssQ0FBQ1ksSUFBSSxDQUFFLHdCQUF3QixFQUFFQyxNQUFNLElBQUk7RUFFOUMsTUFBTUMsUUFBUSxHQUFHLElBQUlmLElBQUksQ0FBRTtJQUFF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