// Copyright 2024, University of Colorado Boulder

/**
 * Represents a single hotkey (keyboard shortcut) that can be either:
 *
 * 1. Added to globalHotkeyRegistry (to be available regardless of keyboard focus)
 * 2. Added to a node's inputListeners (to be available only when that node is part of the focused trail)
 *
 * For example:
 *
 *    globalHotkeyRegistry.add( new Hotkey( {
 *      key: 'y',
 *      fire: () => console.log( 'fire: y' )
 *    } ) );
 *
 *    myNode.addInputListener( {
 *      hotkeys: [
 *        new Hotkey( {
 *          key: 'x',
 *          fire: () => console.log( 'fire: x' )
 *        } )
 *      ]
 *    } );
 *
 * Also supports modifier keys that must be pressed in addition to the Key. See options for a description of how
 * they behave.
 *
 * Hotkeys are managed by hotkeyManager, which determines which hotkeys are active based on the globalHotkeyRegistry
 * and what Node has focus. See that class for information about how hotkeys work.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { EnglishStringToCodeMap, hotkeyManager, scenery } from '../imports.js';
import optionize from '../../../phet-core/js/optionize.js';
import EnabledComponent from '../../../axon/js/EnabledComponent.js';
import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import CallbackTimer from '../../../axon/js/CallbackTimer.js';
export default class Hotkey extends EnabledComponent {
  // Straight from options

  // All keys that are part of this hotkey (key + modifierKeys)

  // A Property that tracks whether the hotkey is currently pressed.
  // Will be true if it meets the following conditions:
  //
  // 1. Main `key` pressed
  // 2. All modifier keys in the hotkey's `modifierKeys` are pressed
  // 3. All modifier keys not in the hotkey's `modifierKeys` (but in the other enabled hotkeys) are not pressed
  isPressedProperty = new BooleanProperty(false);

  // (read-only for client code)
  // Whether the last release (value during isPressedProperty => false) was due to an interruption (e.g. focus changed).
  // If false, the hotkey was released due to the key being released.
  interrupted = false;

  // Internal timer for when fireOnHold:true and fireOnHoldTiming:custom.

  constructor(providedOptions) {
    assert && assert(providedOptions.fireOnHoldTiming === 'custom' || providedOptions.fireOnHoldCustomDelay === undefined && providedOptions.fireOnHoldCustomInterval === undefined, 'Cannot specify fireOnHoldCustomDelay / fireOnHoldCustomInterval if fireOnHoldTiming is not custom');
    const options = optionize()({
      modifierKeys: [],
      ignoredModifierKeys: [],
      fire: _.noop,
      press: _.noop,
      release: _.noop,
      fireOnDown: true,
      fireOnHold: false,
      fireOnHoldTiming: 'browser',
      fireOnHoldCustomDelay: 400,
      fireOnHoldCustomInterval: 100,
      allowOverlap: false,
      override: false
    }, providedOptions);
    super(options);

    // Store public things
    this.key = options.key;
    this.modifierKeys = options.modifierKeys;
    this.ignoredModifierKeys = options.ignoredModifierKeys;
    this.fire = options.fire;
    this.press = options.press;
    this.release = options.release;
    this.fireOnDown = options.fireOnDown;
    this.fireOnHold = options.fireOnHold;
    this.fireOnHoldTiming = options.fireOnHoldTiming;
    this.allowOverlap = options.allowOverlap;
    this.override = options.override;
    this.keys = _.uniq([this.key, ...this.modifierKeys]);

    // Make sure that every key has an entry in the EnglishStringToCodeMap
    for (const key of this.keys) {
      assert && assert(EnglishStringToCodeMap[key], `No codes for this key exists, do you need to add it to EnglishStringToCodeMap?: ${key}`);
    }

    // Create a timer to handle the optional fire-on-hold feature.
    if (this.fireOnHold && this.fireOnHoldTiming === 'custom') {
      this.fireOnHoldTimer = new CallbackTimer({
        callback: this.fire.bind(this, null),
        // Pass null for fire-on-hold events
        delay: options.fireOnHoldCustomDelay,
        interval: options.fireOnHoldCustomInterval
      });
      this.disposeEmitter.addListener(() => this.fireOnHoldTimer.dispose());
      this.isPressedProperty.link(isPressed => {
        // We need to reset the timer, so we stop it (even if we are starting it in just a bit again)
        this.fireOnHoldTimer.stop(false);
        if (isPressed) {
          this.fireOnHoldTimer.start();
        }
      });
    }
  }

  /**
   * On "press" of a Hotkey. All keys are pressed while the Hotkey is active. May also fire depending on
   * events. See hotkeyManager.
   *
   * (scenery-internal)
   */
  onPress(event, shouldFire) {
    // clear the flag on every press (set before notifying the isPressedProperty)
    this.interrupted = false;
    this.isPressedProperty.value = true;

    // press after setting up state
    this.press(event);
    if (shouldFire) {
      this.fire(event);
    }
  }

  /**
   * On "release" of a Hotkey. All keys are released while the Hotkey is inactive. May also fire depending on
   * events. See hotkeyManager.
   */
  onRelease(event, interrupted, shouldFire) {
    this.interrupted = interrupted;
    this.isPressedProperty.value = false;
    this.release(event);
    if (shouldFire) {
      this.fire(event);
    }
  }

  /**
   * Manually interrupt this hotkey, releasing it and setting a flag so that it will not fire until the next time
   * keys are pressed.
   */
  interrupt() {
    if (this.isPressedProperty.value) {
      hotkeyManager.interruptHotkey(this);
    }
  }
  getHotkeyString() {
    return [...this.modifierKeys, this.key].join('+');
  }
  dispose() {
    this.isPressedProperty.dispose();
    super.dispose();
  }
}
scenery.register('Hotkey', Hotkey);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbmdsaXNoU3RyaW5nVG9Db2RlTWFwIiwiaG90a2V5TWFuYWdlciIsInNjZW5lcnkiLCJvcHRpb25pemUiLCJFbmFibGVkQ29tcG9uZW50IiwiQm9vbGVhblByb3BlcnR5IiwiQ2FsbGJhY2tUaW1lciIsIkhvdGtleSIsImlzUHJlc3NlZFByb3BlcnR5IiwiaW50ZXJydXB0ZWQiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImZpcmVPbkhvbGRUaW1pbmciLCJmaXJlT25Ib2xkQ3VzdG9tRGVsYXkiLCJ1bmRlZmluZWQiLCJmaXJlT25Ib2xkQ3VzdG9tSW50ZXJ2YWwiLCJvcHRpb25zIiwibW9kaWZpZXJLZXlzIiwiaWdub3JlZE1vZGlmaWVyS2V5cyIsImZpcmUiLCJfIiwibm9vcCIsInByZXNzIiwicmVsZWFzZSIsImZpcmVPbkRvd24iLCJmaXJlT25Ib2xkIiwiYWxsb3dPdmVybGFwIiwib3ZlcnJpZGUiLCJrZXkiLCJrZXlzIiwidW5pcSIsImZpcmVPbkhvbGRUaW1lciIsImNhbGxiYWNrIiwiYmluZCIsImRlbGF5IiwiaW50ZXJ2YWwiLCJkaXNwb3NlRW1pdHRlciIsImFkZExpc3RlbmVyIiwiZGlzcG9zZSIsImxpbmsiLCJpc1ByZXNzZWQiLCJzdG9wIiwic3RhcnQiLCJvblByZXNzIiwiZXZlbnQiLCJzaG91bGRGaXJlIiwidmFsdWUiLCJvblJlbGVhc2UiLCJpbnRlcnJ1cHQiLCJpbnRlcnJ1cHRIb3RrZXkiLCJnZXRIb3RrZXlTdHJpbmciLCJqb2luIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJIb3RrZXkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBzaW5nbGUgaG90a2V5IChrZXlib2FyZCBzaG9ydGN1dCkgdGhhdCBjYW4gYmUgZWl0aGVyOlxyXG4gKlxyXG4gKiAxLiBBZGRlZCB0byBnbG9iYWxIb3RrZXlSZWdpc3RyeSAodG8gYmUgYXZhaWxhYmxlIHJlZ2FyZGxlc3Mgb2Yga2V5Ym9hcmQgZm9jdXMpXHJcbiAqIDIuIEFkZGVkIHRvIGEgbm9kZSdzIGlucHV0TGlzdGVuZXJzICh0byBiZSBhdmFpbGFibGUgb25seSB3aGVuIHRoYXQgbm9kZSBpcyBwYXJ0IG9mIHRoZSBmb2N1c2VkIHRyYWlsKVxyXG4gKlxyXG4gKiBGb3IgZXhhbXBsZTpcclxuICpcclxuICogICAgZ2xvYmFsSG90a2V5UmVnaXN0cnkuYWRkKCBuZXcgSG90a2V5KCB7XHJcbiAqICAgICAga2V5OiAneScsXHJcbiAqICAgICAgZmlyZTogKCkgPT4gY29uc29sZS5sb2coICdmaXJlOiB5JyApXHJcbiAqICAgIH0gKSApO1xyXG4gKlxyXG4gKiAgICBteU5vZGUuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gKiAgICAgIGhvdGtleXM6IFtcclxuICogICAgICAgIG5ldyBIb3RrZXkoIHtcclxuICogICAgICAgICAga2V5OiAneCcsXHJcbiAqICAgICAgICAgIGZpcmU6ICgpID0+IGNvbnNvbGUubG9nKCAnZmlyZTogeCcgKVxyXG4gKiAgICAgICAgfSApXHJcbiAqICAgICAgXVxyXG4gKiAgICB9ICk7XHJcbiAqXHJcbiAqIEFsc28gc3VwcG9ydHMgbW9kaWZpZXIga2V5cyB0aGF0IG11c3QgYmUgcHJlc3NlZCBpbiBhZGRpdGlvbiB0byB0aGUgS2V5LiBTZWUgb3B0aW9ucyBmb3IgYSBkZXNjcmlwdGlvbiBvZiBob3dcclxuICogdGhleSBiZWhhdmUuXHJcbiAqXHJcbiAqIEhvdGtleXMgYXJlIG1hbmFnZWQgYnkgaG90a2V5TWFuYWdlciwgd2hpY2ggZGV0ZXJtaW5lcyB3aGljaCBob3RrZXlzIGFyZSBhY3RpdmUgYmFzZWQgb24gdGhlIGdsb2JhbEhvdGtleVJlZ2lzdHJ5XHJcbiAqIGFuZCB3aGF0IE5vZGUgaGFzIGZvY3VzLiBTZWUgdGhhdCBjbGFzcyBmb3IgaW5mb3JtYXRpb24gYWJvdXQgaG93IGhvdGtleXMgd29yay5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgeyBFbmdsaXNoS2V5LCBFbmdsaXNoU3RyaW5nVG9Db2RlTWFwLCBob3RrZXlNYW5hZ2VyLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBFbmFibGVkQ29tcG9uZW50LCB7IEVuYWJsZWRDb21wb25lbnRPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbmFibGVkQ29tcG9uZW50LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQ2FsbGJhY2tUaW1lciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0NhbGxiYWNrVGltZXIuanMnO1xyXG5cclxuZXhwb3J0IHR5cGUgSG90a2V5RmlyZU9uSG9sZFRpbWluZyA9ICdicm93c2VyJyB8ICdjdXN0b20nO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICAvLyBUaGUga2V5IHRoYXQgc2hvdWxkIGJlIHByZXNzZWQgdG8gdHJpZ2dlciB0aGUgaG90a2V5IChpbiBmaXJlT25Eb3duOnRydWUgbW9kZSkgb3IgcmVsZWFzZWQgdG8gdHJpZ2dlciB0aGUgaG90a2V5XHJcbiAgLy8gKGluIGZpcmVPbkRvd246ZmFsc2UgbW9kZSkuXHJcbiAga2V5OiBFbmdsaXNoS2V5O1xyXG5cclxuICAvLyBBIHNldCBvZiBtb2RpZmllciBrZXlzIHRoYXQ6XHJcbiAgLy9cclxuICAvLyAxLiBOZWVkIHRvIGJlIHByZXNzZWQgYmVmb3JlIHRoZSBtYWluIGtleSBiZWZvcmUgdGhpcyBob3RrZXkgaXMgY29uc2lkZXJlZCBwcmVzc2VkLlxyXG4gIC8vIDIuIE11c3QgTk9UIGJlIHByZXNzZWQgZm9yIG90aGVyIGhvdGtleXMgdG8gYmUgYWN0aXZhdGVkIHdoZW4gdGhpcyBob3RrZXkgaXMgcHJlc2VudC5cclxuICAvL1xyXG4gIC8vIEEgSG90a2V5IHdpbGwgYWxzbyBub3QgYWN0aXZhdGUgaWYgdGhlIHN0YW5kYXJkIG1vZGlmaWVyIGtleXMgKGN0cmwvYWx0L21ldGEvc2hpZnQpIGFyZSBwcmVzc2VkLCB1bmxlc3MgdGhleVxyXG4gIC8vIGFyZSBleHBsaWNpdGx5IGluY2x1ZGVkIGluIHRoZSBtb2RpZmllcktleXMgYXJyYXkuXHJcbiAgLy9cclxuICAvLyBOT1RFOiBUaGlzIGlzIGEgZ2VuZXJhbGl6YXRpb24gb2YgdGhlIG5vcm1hbCBjb25jZXB0IG9mIFwibW9kaWZpZXIga2V5XCJcclxuICAvLyAoaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTW9kaWZpZXJfa2V5KS4gSXQgaXMgYSBQaEVULXNwZWNpZmljIGNvbmNlcHQgdGhhdCBhbGxvd3Mgb3RoZXIgbm9uLXN0YW5kYXJkXHJcbiAgLy8gbW9kaWZpZXIga2V5cyB0byBiZSB1c2VkIGFzIG1vZGlmaWVycy4gVGhlIHN0YW5kYXJkIG1vZGlmaWVyIGtleXMgKGN0cmwvYWx0L21ldGEvc2hpZnQpIGFyZSBhdXRvbWF0aWNhbGx5IGhhbmRsZWRcclxuICAvLyBieSB0aGUgaG90a2V5IHN5c3RlbSwgYnV0IHRoaXMgY2FuIGV4cGFuZCB0aGUgc2V0IG9mIG1vZGlmaWVyIGtleXMgdGhhdCBjYW4gYmUgdXNlZC4gV2hlbiBhIG1vZGlmaWVyIGtleSBpcyBhZGRlZCxcclxuICAvLyBwcmVzc2luZyBpdCB3aWxsIHByZXZlbnQgYW55IG90aGVyIEhvdGtleXMgZnJvbSBiZWNvbWluZyBhY3RpdmUuIFRoaXMgaXMgaG93IHRoZSB0eXBpY2FsIG1vZGlmaWVyIGtleXMgYmVoYXZlIGFuZFxyXG4gIC8vIHNvIHRoYXQgaXMga2VwdCBjb25zaXN0ZW50IGZvciBQaEVULXNwZWNpZmljIG1vZGlmaWVyIGtleXMuXHJcbiAgLy9cclxuICAvLyBOb3RlIHRoYXQgdGhlIHJlbGVhc2Ugb2YgYSBtb2RpZmllciBrZXkgbWF5IFwiYWN0aXZhdGVcIiB0aGUgaG90a2V5IGZvciBcImZpcmUtb24taG9sZFwiLCBidXQgbm90IGZvciBcImZpcmUtb24tZG93blwiLlxyXG4gIG1vZGlmaWVyS2V5cz86IEVuZ2xpc2hLZXlbXTtcclxuXHJcbiAgLy8gQSBzZXQgb2YgbW9kaWZpZXIga2V5cyB0aGF0IGNhbiBiZSBkb3duIGFuZCB0aGUgaG90a2V5IHdpbGwgc3RpbGwgZmlyZS4gRXNzZW50aWFsbHkgaWdub3JpbmcgdGhlIG1vZGlmaWVyXHJcbiAgLy8ga2V5IGJlaGF2aW9yIGZvciB0aGlzIGtleS5cclxuICBpZ25vcmVkTW9kaWZpZXJLZXlzPzogRW5nbGlzaEtleVtdO1xyXG5cclxuICAvLyBDYWxsZWQgYXMgZmlyZSgpIHdoZW4gdGhlIGhvdGtleSBpcyBmaXJlZCAoc2VlIGZpcmVPbkRvd24vZmlyZU9uSG9sZCBmb3Igd2hlbiB0aGF0IGhhcHBlbnMpLlxyXG4gIC8vIFRoZSBldmVudCB3aWxsIGJlIG51bGwgaWYgdGhlIGhvdGtleSB3YXMgZmlyZWQgZHVlIHRvIGZpcmUtb24taG9sZC5cclxuICBmaXJlPzogKCBldmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBDYWxsZWQgYXMgcHJlc3MoKSB3aGVuIHRoZSBob3RrZXkgaXMgcHJlc3NlZC4gTm90ZSB0aGF0IHRoZSBIb3RrZXkgbWF5IGJlIHByZXNzZWQgYmVmb3JlIGZpcmluZyBkZXBlbmRpbmdcclxuICAvLyBvbiBmaXJlT25Eb3duLiBBbmQgcHJlc3MgaXMgbm90IGNhbGxlZCB3aXRoIGZpcmUtb24taG9sZC4gVGhlIGV2ZW50IG1heSBiZSBudWxsIGlmIHRoZXJlIGlzIGEgcHJlc3MgZHVlIHRvXHJcbiAgLy8gdGhlIGhvdGtleSBiZWNvbWluZyBhY3RpdmUgZHVlIHRvIGNoYW5nZSBpbiBzdGF0ZSB3aXRob3V0IGEga2V5IHByZXNzLlxyXG4gIHByZXNzPzogKCBldmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBDYWxsZWQgYXMgcmVsZWFzZSgpIHdoZW4gdGhlIEhvdGtleSBpcyByZWxlYXNlZC4gTm90ZSB0aGF0IHRoZSBIb3RrZXkgbWF5IHJlbGVhc2Ugd2l0aG91dCBjYWxsaW5nIGZpcmUoKSBkZXBlbmRpbmdcclxuICAvLyBvbiBmaXJlT25Eb3duLiBFdmVudCBtYXkgYmUgbnVsbCBpbiBjYXNlcyBvZiBpbnRlcnJ1cHQgb3IgaWYgdGhlIGhvdGtleSBpcyByZWxlYXNlZCBkdWUgdG8gY2hhbmdlIGluIHN0YXRlIHdpdGhvdXRcclxuICAvLyBhIGtleSByZWxlYXNlLlxyXG4gIHJlbGVhc2U/OiAoIGV2ZW50OiBLZXlib2FyZEV2ZW50IHwgbnVsbCApID0+IHZvaWQ7XHJcblxyXG4gIC8vIElmIHRydWUsIHRoZSBob3RrZXkgd2lsbCBmaXJlIHdoZW4gdGhlIGhvdGtleSBpcyBpbml0aWFsbHkgcHJlc3NlZC5cclxuICAvLyBJZiBmYWxzZSwgdGhlIGhvdGtleSB3aWxsIGZpcmUgd2hlbiB0aGUgaG90a2V5IGlzIGZpbmFsbHkgcmVsZWFzZWQuXHJcbiAgZmlyZU9uRG93bj86IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIGZpcmUtb24taG9sZCBmZWF0dXJlIGlzIGVuYWJsZWRcclxuICBmaXJlT25Ib2xkPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciB3ZSBzaG91bGQgbGlzdGVuIHRvIHRoZSBicm93c2VyJ3MgZmlyZS1vbi1ob2xkIHRpbWluZywgb3IgdXNlIG91ciBvd24uXHJcbiAgZmlyZU9uSG9sZFRpbWluZz86IEhvdGtleUZpcmVPbkhvbGRUaW1pbmc7XHJcblxyXG4gIC8vIFN0YXJ0IHRvIGZpcmUgY29udGludW91c2x5IGFmdGVyIHByZXNzaW5nIGZvciB0aGlzIGxvbmcgKG1pbGxpc2Vjb25kcylcclxuICBmaXJlT25Ib2xkQ3VzdG9tRGVsYXk/OiBudW1iZXI7XHJcblxyXG4gIC8vIEZpcmUgY29udGludW91c2x5IGF0IHRoaXMgaW50ZXJ2YWwgKG1pbGxpc2Vjb25kcylcclxuICBmaXJlT25Ib2xkQ3VzdG9tSW50ZXJ2YWw/OiBudW1iZXI7XHJcblxyXG4gIC8vIEZvciBlYWNoIG1haW4gYGtleWAsIHRoZSBob3RrZXkgc3lzdGVtIHdpbGwgb25seSBhbGxvdyBvbmUgaG90a2V5IHdpdGggYWxsb3dPdmVybGFwOmZhbHNlIHRvIGJlIGFjdGl2ZSBhdCBhbnkgdGltZS5cclxuICAvLyBUaGlzIGlzIHByb3ZpZGVkIHRvIGFsbG93IG11bHRpcGxlIGhvdGtleXMgd2l0aCB0aGUgc2FtZSBrZXlzIHRvIGZpcmUuIERlZmF1bHQgaXMgZmFsc2UuXHJcbiAgYWxsb3dPdmVybGFwPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgYW55IG92ZXJsYXBwaW5nIGhvdGtleXMgKGVpdGhlciBhZGRlZCB0byBhbiBhbmNlc3RvcidzIGlucHV0TGlzdGVuZXIgb3IgbGF0ZXIgaW4gdGhlIGxvY2FsL2dsb2JhbCBvcmRlcilcclxuICAvLyB3aWxsIGJlIGlnbm9yZWQuXHJcbiAgb3ZlcnJpZGU/OiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgSG90a2V5T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgRW5hYmxlZENvbXBvbmVudE9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIb3RrZXkgZXh0ZW5kcyBFbmFibGVkQ29tcG9uZW50IHtcclxuXHJcbiAgLy8gU3RyYWlnaHQgZnJvbSBvcHRpb25zXHJcbiAgcHVibGljIHJlYWRvbmx5IGtleTogRW5nbGlzaEtleTtcclxuICBwdWJsaWMgcmVhZG9ubHkgbW9kaWZpZXJLZXlzOiBFbmdsaXNoS2V5W107XHJcbiAgcHVibGljIHJlYWRvbmx5IGlnbm9yZWRNb2RpZmllcktleXM6IEVuZ2xpc2hLZXlbXTtcclxuICBwdWJsaWMgcmVhZG9ubHkgZmlyZTogKCBldmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG4gIHB1YmxpYyByZWFkb25seSBwcmVzczogKCBldmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG4gIHB1YmxpYyByZWFkb25seSByZWxlYXNlOiAoIGV2ZW50OiBLZXlib2FyZEV2ZW50IHwgbnVsbCApID0+IHZvaWQ7XHJcbiAgcHVibGljIHJlYWRvbmx5IGZpcmVPbkRvd246IGJvb2xlYW47XHJcbiAgcHVibGljIHJlYWRvbmx5IGZpcmVPbkhvbGQ6IGJvb2xlYW47XHJcbiAgcHVibGljIHJlYWRvbmx5IGZpcmVPbkhvbGRUaW1pbmc6IEhvdGtleUZpcmVPbkhvbGRUaW1pbmc7XHJcbiAgcHVibGljIHJlYWRvbmx5IGFsbG93T3ZlcmxhcDogYm9vbGVhbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgb3ZlcnJpZGU6IGJvb2xlYW47XHJcblxyXG4gIC8vIEFsbCBrZXlzIHRoYXQgYXJlIHBhcnQgb2YgdGhpcyBob3RrZXkgKGtleSArIG1vZGlmaWVyS2V5cylcclxuICBwdWJsaWMgcmVhZG9ubHkga2V5czogRW5nbGlzaEtleVtdO1xyXG5cclxuICAvLyBBIFByb3BlcnR5IHRoYXQgdHJhY2tzIHdoZXRoZXIgdGhlIGhvdGtleSBpcyBjdXJyZW50bHkgcHJlc3NlZC5cclxuICAvLyBXaWxsIGJlIHRydWUgaWYgaXQgbWVldHMgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gIC8vXHJcbiAgLy8gMS4gTWFpbiBga2V5YCBwcmVzc2VkXHJcbiAgLy8gMi4gQWxsIG1vZGlmaWVyIGtleXMgaW4gdGhlIGhvdGtleSdzIGBtb2RpZmllcktleXNgIGFyZSBwcmVzc2VkXHJcbiAgLy8gMy4gQWxsIG1vZGlmaWVyIGtleXMgbm90IGluIHRoZSBob3RrZXkncyBgbW9kaWZpZXJLZXlzYCAoYnV0IGluIHRoZSBvdGhlciBlbmFibGVkIGhvdGtleXMpIGFyZSBub3QgcHJlc3NlZFxyXG4gIHB1YmxpYyByZWFkb25seSBpc1ByZXNzZWRQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuXHJcbiAgLy8gKHJlYWQtb25seSBmb3IgY2xpZW50IGNvZGUpXHJcbiAgLy8gV2hldGhlciB0aGUgbGFzdCByZWxlYXNlICh2YWx1ZSBkdXJpbmcgaXNQcmVzc2VkUHJvcGVydHkgPT4gZmFsc2UpIHdhcyBkdWUgdG8gYW4gaW50ZXJydXB0aW9uIChlLmcuIGZvY3VzIGNoYW5nZWQpLlxyXG4gIC8vIElmIGZhbHNlLCB0aGUgaG90a2V5IHdhcyByZWxlYXNlZCBkdWUgdG8gdGhlIGtleSBiZWluZyByZWxlYXNlZC5cclxuICBwdWJsaWMgaW50ZXJydXB0ZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gSW50ZXJuYWwgdGltZXIgZm9yIHdoZW4gZmlyZU9uSG9sZDp0cnVlIGFuZCBmaXJlT25Ib2xkVGltaW5nOmN1c3RvbS5cclxuICBwcml2YXRlIGZpcmVPbkhvbGRUaW1lcj86IENhbGxiYWNrVGltZXI7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByb3ZpZGVkT3B0aW9uczogSG90a2V5T3B0aW9uc1xyXG4gICkge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb3ZpZGVkT3B0aW9ucy5maXJlT25Ib2xkVGltaW5nID09PSAnY3VzdG9tJyB8fCAoIHByb3ZpZGVkT3B0aW9ucy5maXJlT25Ib2xkQ3VzdG9tRGVsYXkgPT09IHVuZGVmaW5lZCAmJiBwcm92aWRlZE9wdGlvbnMuZmlyZU9uSG9sZEN1c3RvbUludGVydmFsID09PSB1bmRlZmluZWQgKSxcclxuICAgICAgJ0Nhbm5vdCBzcGVjaWZ5IGZpcmVPbkhvbGRDdXN0b21EZWxheSAvIGZpcmVPbkhvbGRDdXN0b21JbnRlcnZhbCBpZiBmaXJlT25Ib2xkVGltaW5nIGlzIG5vdCBjdXN0b20nICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxIb3RrZXlPcHRpb25zLCBTZWxmT3B0aW9ucywgRW5hYmxlZENvbXBvbmVudE9wdGlvbnM+KCkoIHtcclxuICAgICAgbW9kaWZpZXJLZXlzOiBbXSxcclxuICAgICAgaWdub3JlZE1vZGlmaWVyS2V5czogW10sXHJcbiAgICAgIGZpcmU6IF8ubm9vcCxcclxuICAgICAgcHJlc3M6IF8ubm9vcCxcclxuICAgICAgcmVsZWFzZTogXy5ub29wLFxyXG4gICAgICBmaXJlT25Eb3duOiB0cnVlLFxyXG4gICAgICBmaXJlT25Ib2xkOiBmYWxzZSxcclxuICAgICAgZmlyZU9uSG9sZFRpbWluZzogJ2Jyb3dzZXInLFxyXG4gICAgICBmaXJlT25Ib2xkQ3VzdG9tRGVsYXk6IDQwMCxcclxuICAgICAgZmlyZU9uSG9sZEN1c3RvbUludGVydmFsOiAxMDAsXHJcbiAgICAgIGFsbG93T3ZlcmxhcDogZmFsc2UsXHJcbiAgICAgIG92ZXJyaWRlOiBmYWxzZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBTdG9yZSBwdWJsaWMgdGhpbmdzXHJcbiAgICB0aGlzLmtleSA9IG9wdGlvbnMua2V5O1xyXG4gICAgdGhpcy5tb2RpZmllcktleXMgPSBvcHRpb25zLm1vZGlmaWVyS2V5cztcclxuICAgIHRoaXMuaWdub3JlZE1vZGlmaWVyS2V5cyA9IG9wdGlvbnMuaWdub3JlZE1vZGlmaWVyS2V5cztcclxuICAgIHRoaXMuZmlyZSA9IG9wdGlvbnMuZmlyZTtcclxuICAgIHRoaXMucHJlc3MgPSBvcHRpb25zLnByZXNzO1xyXG4gICAgdGhpcy5yZWxlYXNlID0gb3B0aW9ucy5yZWxlYXNlO1xyXG4gICAgdGhpcy5maXJlT25Eb3duID0gb3B0aW9ucy5maXJlT25Eb3duO1xyXG4gICAgdGhpcy5maXJlT25Ib2xkID0gb3B0aW9ucy5maXJlT25Ib2xkO1xyXG4gICAgdGhpcy5maXJlT25Ib2xkVGltaW5nID0gb3B0aW9ucy5maXJlT25Ib2xkVGltaW5nO1xyXG4gICAgdGhpcy5hbGxvd092ZXJsYXAgPSBvcHRpb25zLmFsbG93T3ZlcmxhcDtcclxuICAgIHRoaXMub3ZlcnJpZGUgPSBvcHRpb25zLm92ZXJyaWRlO1xyXG5cclxuICAgIHRoaXMua2V5cyA9IF8udW5pcSggWyB0aGlzLmtleSwgLi4udGhpcy5tb2RpZmllcktleXMgXSApO1xyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGV2ZXJ5IGtleSBoYXMgYW4gZW50cnkgaW4gdGhlIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXBcclxuICAgIGZvciAoIGNvbnN0IGtleSBvZiB0aGlzLmtleXMgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXBbIGtleSBdLCBgTm8gY29kZXMgZm9yIHRoaXMga2V5IGV4aXN0cywgZG8geW91IG5lZWQgdG8gYWRkIGl0IHRvIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXA/OiAke2tleX1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgdGltZXIgdG8gaGFuZGxlIHRoZSBvcHRpb25hbCBmaXJlLW9uLWhvbGQgZmVhdHVyZS5cclxuICAgIGlmICggdGhpcy5maXJlT25Ib2xkICYmIHRoaXMuZmlyZU9uSG9sZFRpbWluZyA9PT0gJ2N1c3RvbScgKSB7XHJcbiAgICAgIHRoaXMuZmlyZU9uSG9sZFRpbWVyID0gbmV3IENhbGxiYWNrVGltZXIoIHtcclxuICAgICAgICBjYWxsYmFjazogdGhpcy5maXJlLmJpbmQoIHRoaXMsIG51bGwgKSwgLy8gUGFzcyBudWxsIGZvciBmaXJlLW9uLWhvbGQgZXZlbnRzXHJcbiAgICAgICAgZGVsYXk6IG9wdGlvbnMuZmlyZU9uSG9sZEN1c3RvbURlbGF5LFxyXG4gICAgICAgIGludGVydmFsOiBvcHRpb25zLmZpcmVPbkhvbGRDdXN0b21JbnRlcnZhbFxyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHRoaXMuZmlyZU9uSG9sZFRpbWVyIS5kaXNwb3NlKCkgKTtcclxuXHJcbiAgICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkubGluayggaXNQcmVzc2VkID0+IHtcclxuICAgICAgICAvLyBXZSBuZWVkIHRvIHJlc2V0IHRoZSB0aW1lciwgc28gd2Ugc3RvcCBpdCAoZXZlbiBpZiB3ZSBhcmUgc3RhcnRpbmcgaXQgaW4ganVzdCBhIGJpdCBhZ2FpbilcclxuICAgICAgICB0aGlzLmZpcmVPbkhvbGRUaW1lciEuc3RvcCggZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBpc1ByZXNzZWQgKSB7XHJcbiAgICAgICAgICB0aGlzLmZpcmVPbkhvbGRUaW1lciEuc3RhcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9uIFwicHJlc3NcIiBvZiBhIEhvdGtleS4gQWxsIGtleXMgYXJlIHByZXNzZWQgd2hpbGUgdGhlIEhvdGtleSBpcyBhY3RpdmUuIE1heSBhbHNvIGZpcmUgZGVwZW5kaW5nIG9uXHJcbiAgICogZXZlbnRzLiBTZWUgaG90a2V5TWFuYWdlci5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvblByZXNzKCBldmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwsIHNob3VsZEZpcmU6IGJvb2xlYW4gKTogdm9pZCB7XHJcblxyXG4gICAgLy8gY2xlYXIgdGhlIGZsYWcgb24gZXZlcnkgcHJlc3MgKHNldCBiZWZvcmUgbm90aWZ5aW5nIHRoZSBpc1ByZXNzZWRQcm9wZXJ0eSlcclxuICAgIHRoaXMuaW50ZXJydXB0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBwcmVzcyBhZnRlciBzZXR0aW5nIHVwIHN0YXRlXHJcbiAgICB0aGlzLnByZXNzKCBldmVudCApO1xyXG5cclxuICAgIGlmICggc2hvdWxkRmlyZSApIHtcclxuICAgICAgdGhpcy5maXJlKCBldmVudCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT24gXCJyZWxlYXNlXCIgb2YgYSBIb3RrZXkuIEFsbCBrZXlzIGFyZSByZWxlYXNlZCB3aGlsZSB0aGUgSG90a2V5IGlzIGluYWN0aXZlLiBNYXkgYWxzbyBmaXJlIGRlcGVuZGluZyBvblxyXG4gICAqIGV2ZW50cy4gU2VlIGhvdGtleU1hbmFnZXIuXHJcbiAgICovXHJcbiAgcHVibGljIG9uUmVsZWFzZSggZXZlbnQ6IEtleWJvYXJkRXZlbnQgfCBudWxsLCBpbnRlcnJ1cHRlZDogYm9vbGVhbiwgc2hvdWxkRmlyZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHRoaXMuaW50ZXJydXB0ZWQgPSBpbnRlcnJ1cHRlZDtcclxuXHJcbiAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5yZWxlYXNlKCBldmVudCApO1xyXG5cclxuICAgIGlmICggc2hvdWxkRmlyZSApIHtcclxuICAgICAgdGhpcy5maXJlKCBldmVudCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFudWFsbHkgaW50ZXJydXB0IHRoaXMgaG90a2V5LCByZWxlYXNpbmcgaXQgYW5kIHNldHRpbmcgYSBmbGFnIHNvIHRoYXQgaXQgd2lsbCBub3QgZmlyZSB1bnRpbCB0aGUgbmV4dCB0aW1lXHJcbiAgICoga2V5cyBhcmUgcHJlc3NlZC5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0KCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICBob3RrZXlNYW5hZ2VyLmludGVycnVwdEhvdGtleSggdGhpcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEhvdGtleVN0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgLi4udGhpcy5tb2RpZmllcktleXMsXHJcbiAgICAgIHRoaXMua2V5XHJcbiAgICBdLmpvaW4oICcrJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcbnNjZW5lcnkucmVnaXN0ZXIoICdIb3RrZXknLCBIb3RrZXkgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQXFCQSxzQkFBc0IsRUFBRUMsYUFBYSxFQUFFQyxPQUFPLFFBQVEsZUFBZTtBQUMxRixPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBQzFELE9BQU9DLGdCQUFnQixNQUFtQyxzQ0FBc0M7QUFFaEcsT0FBT0MsZUFBZSxNQUFNLHFDQUFxQztBQUNqRSxPQUFPQyxhQUFhLE1BQU0sbUNBQW1DO0FBd0U3RCxlQUFlLE1BQU1DLE1BQU0sU0FBU0gsZ0JBQWdCLENBQUM7RUFFbkQ7O0VBYUE7O0VBR0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ2dCSSxpQkFBaUIsR0FBdUIsSUFBSUgsZUFBZSxDQUFFLEtBQU0sQ0FBQzs7RUFFcEY7RUFDQTtFQUNBO0VBQ09JLFdBQVcsR0FBRyxLQUFLOztFQUUxQjs7RUFHT0MsV0FBV0Es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