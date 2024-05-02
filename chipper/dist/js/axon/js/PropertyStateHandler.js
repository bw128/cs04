// Copyright 2020-2023, University of Colorado Boulder

/**
 * Responsible for handling Property-specific logic associated with setting PhET-iO state. This file will defer Properties
 * from taking their final value, and notifying on that value until after state has been set on every Property. It is
 * also responsible for keeping track of order dependencies between different Properties, and making sure that undeferral
 * and notifications go out in the appropriate orders. See https://github.com/phetsims/axon/issues/276 for implementation details.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
class PropertyStateHandler {
  initialized = false;
  constructor() {
    // Properties support setDeferred(). We defer setting their values so all changes take effect
    // at once. This keeps track of finalization actions (embodied in a PhaseCallback) that must take place after all
    // Property values have changed. This keeps track of both types of PropertyStatePhase: undeferring and notification.
    this.phaseCallbackSets = new PhaseCallbackSets();

    // each pair has a Map optimized for looking up based on the "before phetioID" and the "after phetioID"
    // of the dependency. Having a data structure set up for both directions of look-up makes each operation O(1). See https://github.com/phetsims/axon/issues/316
    this.undeferBeforeUndeferMapPair = new OrderDependencyMapPair(PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER);
    this.undeferBeforeNotifyMapPair = new OrderDependencyMapPair(PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY);
    this.notifyBeforeUndeferMapPair = new OrderDependencyMapPair(PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER);
    this.notifyBeforeNotifyMapPair = new OrderDependencyMapPair(PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY);

    // keep a list of all map pairs for easier iteration
    this.mapPairs = [this.undeferBeforeUndeferMapPair, this.undeferBeforeNotifyMapPair, this.notifyBeforeUndeferMapPair, this.notifyBeforeNotifyMapPair];
  }
  initialize(phetioStateEngine) {
    assert && assert(!this.initialized, 'cannot initialize twice');
    phetioStateEngine.onBeforeApplyStateEmitter.addListener(phetioObject => {
      // withhold AXON/Property notifications until all values have been set to avoid inconsistent intermediate states,
      // see https://github.com/phetsims/phet-io-wrappers/issues/229
      // only do this if the PhetioObject is already not deferred
      if (phetioObject instanceof ReadOnlyProperty && !phetioObject.isDeferred) {
        phetioObject.setDeferred(true);
        const phetioID = phetioObject.tandem.phetioID;
        const listener = () => {
          const potentialListener = phetioObject.setDeferred(false);

          // Always add a PhaseCallback so that we can track the order dependency, even though setDeferred can return null.
          this.phaseCallbackSets.addNotifyPhaseCallback(new PhaseCallback(phetioID, PropertyStatePhase.NOTIFY, potentialListener || _.noop));
        };
        this.phaseCallbackSets.addUndeferPhaseCallback(new PhaseCallback(phetioID, PropertyStatePhase.UNDEFER, listener));
      }
    });
    phetioStateEngine.undeferEmitter.addListener(state => {
      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties(new Set(Object.keys(state)));
    });
    phetioStateEngine.isSettingStateProperty.lazyLink(isSettingState => {
      assert && !isSettingState && assert(this.phaseCallbackSets.size === 0, 'PhaseCallbacks should have all been applied');
    });
    this.initialized = true;
  }
  static validateInstrumentedProperty(property) {
    assert && Tandem.VALIDATION && assert(property instanceof ReadOnlyProperty && property.isPhetioInstrumented(), `must be an instrumented Property: ${property}`);
  }
  validatePropertyPhasePair(property, phase) {
    PropertyStateHandler.validateInstrumentedProperty(property);
  }

  /**
   * Get the MapPair associated with the proved PropertyStatePhases
   */
  getMapPairFromPhases(beforePhase, afterPhase) {
    const matchedPairs = this.mapPairs.filter(mapPair => beforePhase === mapPair.beforePhase && afterPhase === mapPair.afterPhase);
    assert && assert(matchedPairs.length === 1, 'one and only one map should match the provided phases');
    return matchedPairs[0];
  }

  /**
   * Register that one Property must have a "Phase" applied for PhET-iO state before another Property's Phase. A Phase
   * is an ending state in PhET-iO state set where Property values solidify, notifications for value changes are called.
   * The PhET-iO state engine will always undefer a Property before it notifies its listeners. This is for registering
   * two different Properties.
   *
   * @param beforeProperty - the Property that needs to be set before the second; must be instrumented for PhET-iO
   * @param beforePhase
   * @param afterProperty - must be instrumented for PhET-iO
   * @param afterPhase
   */
  registerPhetioOrderDependency(beforeProperty, beforePhase, afterProperty, afterPhase) {
    if (Tandem.PHET_IO_ENABLED) {
      this.validatePropertyPhasePair(beforeProperty, beforePhase);
      this.validatePropertyPhasePair(afterProperty, afterPhase);
      assert && beforeProperty === afterProperty && assert(beforePhase !== afterPhase, 'cannot set same Property to same phase');
      const mapPair = this.getMapPairFromPhases(beforePhase, afterPhase);
      mapPair.addOrderDependency(beforeProperty.tandem.phetioID, afterProperty.tandem.phetioID);
    }
  }

  /**
   * {Property} property - must be instrumented for PhET-iO
   * {boolean} - true if Property is in any order dependency
   */
  propertyInAnOrderDependency(property) {
    PropertyStateHandler.validateInstrumentedProperty(property);
    return _.some(this.mapPairs, mapPair => mapPair.usesPhetioID(property.tandem.phetioID));
  }

  /**
   * Unregisters all order dependencies for the given Property
   * {ReadOnlyProperty} property - must be instrumented for PhET-iO
   */
  unregisterOrderDependenciesForProperty(property) {
    if (Tandem.PHET_IO_ENABLED) {
      PropertyStateHandler.validateInstrumentedProperty(property);

      // Be graceful if given a Property that is not registered in an order dependency.
      if (this.propertyInAnOrderDependency(property)) {
        assert && assert(this.propertyInAnOrderDependency(property), 'Property must be registered in an order dependency to be unregistered');
        this.mapPairs.forEach(mapPair => mapPair.unregisterOrderDependenciesForProperty(property));
      }
    }
  }

  /**
   * Given registered Property Phase order dependencies, undefer all AXON/Property PhET-iO Elements to take their
   * correct values and have each notify their listeners.
   * {Set.<string>} phetioIDsInState - set of phetioIDs that were set in state
   */
  undeferAndNotifyProperties(phetioIDsInState) {
    assert && assert(this.initialized, 'must be initialized before getting called');

    // {Object.<string,boolean>} - true if a phetioID + phase pair has been applied, keys are the combination of
    // phetioIDs and phase, see PhaseCallback.getTerm()
    const completedPhases = {};

    // to support failing out instead of infinite loop
    let numberOfIterations = 0;

    // Normally we would like to undefer things before notify, but make sure this is done in accordance with the order dependencies.
    while (this.phaseCallbackSets.size > 0) {
      numberOfIterations++;

      // Error case logging
      if (numberOfIterations > 5000) {
        this.errorInUndeferAndNotifyStep(completedPhases);
      }

      // Try to undefer as much as possible before notifying
      this.attemptToApplyPhases(PropertyStatePhase.UNDEFER, completedPhases, phetioIDsInState);
      this.attemptToApplyPhases(PropertyStatePhase.NOTIFY, completedPhases, phetioIDsInState);
    }
  }
  errorInUndeferAndNotifyStep(completedPhases) {
    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs = [];
    this.phaseCallbackSets.forEach(phaseCallback => stillToDoIDPhasePairs.push(phaseCallback.getTerm()));
    const relevantOrderDependencies = [];
    this.mapPairs.forEach(mapPair => {
      const beforeMap = mapPair.beforeMap;
      for (const [beforePhetioID, afterPhetioIDs] of beforeMap) {
        afterPhetioIDs.forEach(afterPhetioID => {
          const beforeTerm = beforePhetioID + beforeMap.beforePhase;
          const afterTerm = afterPhetioID + beforeMap.afterPhase;
          if (stillToDoIDPhasePairs.includes(beforeTerm) || stillToDoIDPhasePairs.includes(afterTerm)) {
            relevantOrderDependencies.push({
              beforeTerm: beforeTerm,
              afterTerm: afterTerm
            });
          }
        });
      }
    });
    let string = '';
    console.log('still to be undeferred', this.phaseCallbackSets.undeferSet);
    console.log('still to be notified', this.phaseCallbackSets.notifySet);
    console.log('order dependencies that apply to the still todos', relevantOrderDependencies);
    relevantOrderDependencies.forEach(orderDependency => {
      string += `${orderDependency.beforeTerm}\t${orderDependency.afterTerm}\n`;
    });
    console.log('\n\nin graphable form:\n\n', string);
    const assertMessage = 'Impossible set state: from undeferAndNotifyProperties; ordering constraints cannot be satisfied';
    assert && assert(false, assertMessage);

    // We must exit here even if assertions are disabled so it wouldn't lock up the browser.
    if (!assert) {
      throw new Error(assertMessage);
    }
  }

  /**
   * Only for Testing!
   * Get the number of order dependencies registered in this class
   *
   */
  getNumberOfOrderDependencies() {
    let count = 0;
    this.mapPairs.forEach(mapPair => {
      mapPair.afterMap.forEach(valueSet => {
        count += valueSet.size;
      });
    });
    return count;
  }

  /**
   * Go through all phases still to be applied, and apply them if the order dependencies allow it. Only apply for the
   * particular phase provided. In general UNDEFER must occur before the same phetioID gets NOTIFY.
   *
   * @param phase - only apply PhaseCallbacks for this particular PropertyStatePhase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   */
  attemptToApplyPhases(phase, completedPhases, phetioIDsInState) {
    const phaseCallbackSet = this.phaseCallbackSets.getSetFromPhase(phase);
    for (const phaseCallbackToPotentiallyApply of phaseCallbackSet) {
      assert && assert(phaseCallbackToPotentiallyApply.phase === phase, 'phaseCallbackSet should only include callbacks for provided phase');

      // only try to check the order dependencies to see if this has to be after something that is incomplete.
      if (this.phetioIDCanApplyPhase(phaseCallbackToPotentiallyApply.phetioID, phase, completedPhases, phetioIDsInState)) {
        // Fire the listener;
        phaseCallbackToPotentiallyApply.listener();

        // Remove it from the main list so that it doesn't get called again.
        phaseCallbackSet.delete(phaseCallbackToPotentiallyApply);

        // Keep track of all completed PhaseCallbacks
        completedPhases[phaseCallbackToPotentiallyApply.getTerm()] = true;
      }
    }
  }

  /**
   * @param phetioID - think of this as the "afterPhetioID" since there may be some phases that need to be applied before it has this phase done.
   * @param phase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   * @param - if the provided phase can be applied given the dependency order dependencies of the state engine.
   */
  phetioIDCanApplyPhase(phetioID, phase, completedPhases, phetioIDsInState) {
    // Undefer must happen before notify
    if (phase === PropertyStatePhase.NOTIFY && !completedPhases[phetioID + PropertyStatePhase.UNDEFER]) {
      return false;
    }

    // Get a list of the maps for this phase being applies.
    const mapsToCheck = [];
    this.mapPairs.forEach(mapPair => {
      if (mapPair.afterPhase === phase) {
        // Use the "afterMap" because below looks up what needs to come before.
        mapsToCheck.push(mapPair.afterMap);
      }
    });

    // O(2)
    for (let i = 0; i < mapsToCheck.length; i++) {
      const mapToCheck = mapsToCheck[i];
      if (!mapToCheck.has(phetioID)) {
        return true;
      }
      const setOfThingsThatShouldComeFirst = mapToCheck.get(phetioID);
      assert && assert(setOfThingsThatShouldComeFirst, 'must have this set');

      // O(K) where K is the number of elements that should come before Property X
      for (const beforePhetioID of setOfThingsThatShouldComeFirst) {
        // check if the before phase for this order dependency has already been completed
        // Make sure that we only care about elements that were actually set during this state set
        if (!completedPhases[beforePhetioID + mapToCheck.beforePhase] && phetioIDsInState.has(beforePhetioID) && phetioIDsInState.has(phetioID)) {
          return false;
        }
      }
    }
    return true;
  }
}

// POJSO for a callback for a specific Phase in a Property's state set lifecycle. See undeferAndNotifyProperties()
class PhaseCallback {
  constructor(phetioID, phase, listener = _.noop) {
    this.phetioID = phetioID;
    this.phase = phase;
    this.listener = listener;
  }

  /**
   * {string} - unique term for the id/phase pair
   */
  getTerm() {
    return this.phetioID + this.phase;
  }
}
class OrderDependencyMapPair {
  constructor(beforePhase, afterPhase) {
    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.beforeMap = new Map();
    this.beforeMap.beforePhase = beforePhase;
    this.beforeMap.afterPhase = afterPhase;

    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.afterMap = new Map();
    this.afterMap.beforePhase = beforePhase;
    this.afterMap.afterPhase = afterPhase;
    this.beforeMap.otherMap = this.afterMap;
    this.afterMap.otherMap = this.beforeMap;
    this.beforePhase = beforePhase;
    this.afterPhase = afterPhase;
  }

  /**
   * Register an order dependency between two phetioIDs. This will add data to maps in "both direction". If accessing
   * with just the beforePhetioID, or with the afterPhetioID.
   */
  addOrderDependency(beforePhetioID, afterPhetioID) {
    if (!this.beforeMap.has(beforePhetioID)) {
      this.beforeMap.set(beforePhetioID, new Set());
    }
    this.beforeMap.get(beforePhetioID).add(afterPhetioID);
    if (!this.afterMap.has(afterPhetioID)) {
      this.afterMap.set(afterPhetioID, new Set());
    }
    this.afterMap.get(afterPhetioID).add(beforePhetioID);
  }

  /**
   * Unregister all order dependencies for the provided Property
   */
  unregisterOrderDependenciesForProperty(property) {
    const phetioIDToRemove = property.tandem.phetioID;
    [this.beforeMap, this.afterMap].forEach(map => {
      map.has(phetioIDToRemove) && map.get(phetioIDToRemove).forEach(phetioID => {
        const setOfAfterMapIDs = map.otherMap.get(phetioID);
        setOfAfterMapIDs && setOfAfterMapIDs.delete(phetioIDToRemove);

        // Clear out empty entries to avoid having lots of empty Sets sitting around
        setOfAfterMapIDs.size === 0 && map.otherMap.delete(phetioID);
      });
      map.delete(phetioIDToRemove);
    });

    // Look through every dependency and make sure the phetioID to remove has been completely removed.
    assertSlow && [this.beforeMap, this.afterMap].forEach(map => {
      map.forEach((valuePhetioIDs, key) => {
        assertSlow && assertSlow(key !== phetioIDToRemove, 'should not be a key');
        assertSlow && assertSlow(!valuePhetioIDs.has(phetioIDToRemove), 'should not be in a value list');
      });
    });
  }
  usesPhetioID(phetioID) {
    return this.beforeMap.has(phetioID) || this.afterMap.has(phetioID);
  }
}

// POJSO to keep track of PhaseCallbacks while providing O(1) lookup time because it is built on Set
class PhaseCallbackSets {
  undeferSet = new Set();
  notifySet = new Set();
  get size() {
    return this.undeferSet.size + this.notifySet.size;
  }
  forEach(callback) {
    this.undeferSet.forEach(callback);
    this.notifySet.forEach(callback);
  }
  addUndeferPhaseCallback(phaseCallback) {
    this.undeferSet.add(phaseCallback);
  }
  addNotifyPhaseCallback(phaseCallback) {
    this.notifySet.add(phaseCallback);
  }
  getSetFromPhase(phase) {
    return phase === PropertyStatePhase.NOTIFY ? this.notifySet : this.undeferSet;
  }
}
axon.register('PropertyStateHandler', PropertyStateHandler);
export default PropertyStateHandler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJheG9uIiwiUHJvcGVydHlTdGF0ZVBoYXNlIiwiUmVhZE9ubHlQcm9wZXJ0eSIsIlByb3BlcnR5U3RhdGVIYW5kbGVyIiwiaW5pdGlhbGl6ZWQiLCJjb25zdHJ1Y3RvciIsInBoYXNlQ2FsbGJhY2tTZXRzIiwiUGhhc2VDYWxsYmFja1NldHMiLCJ1bmRlZmVyQmVmb3JlVW5kZWZlck1hcFBhaXIiLCJPcmRlckRlcGVuZGVuY3lNYXBQYWlyIiwiVU5ERUZFUiIsInVuZGVmZXJCZWZvcmVOb3RpZnlNYXBQYWlyIiwiTk9USUZZIiwibm90aWZ5QmVmb3JlVW5kZWZlck1hcFBhaXIiLCJub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyIiwibWFwUGFpcnMiLCJpbml0aWFsaXplIiwicGhldGlvU3RhdGVFbmdpbmUiLCJhc3NlcnQiLCJvbkJlZm9yZUFwcGx5U3RhdGVFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJwaGV0aW9PYmplY3QiLCJpc0RlZmVycmVkIiwic2V0RGVmZXJyZWQiLCJwaGV0aW9JRCIsInRhbmRlbSIsImxpc3RlbmVyIiwicG90ZW50aWFsTGlzdGVuZXIiLCJhZGROb3RpZnlQaGFzZUNhbGxiYWNrIiwiUGhhc2VDYWxsYmFjayIsIl8iLCJub29wIiwiYWRkVW5kZWZlclBoYXNlQ2FsbGJhY2siLCJ1bmRlZmVyRW1pdHRlciIsInN0YXRlIiwidW5kZWZlckFuZE5vdGlmeVByb3BlcnRpZXMiLCJTZXQiLCJPYmplY3QiLCJrZXlzIiwiaXNTZXR0aW5nU3RhdGVQcm9wZXJ0eSIsImxhenlMaW5rIiwiaXNTZXR0aW5nU3RhdGUiLCJzaXplIiwidmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSIsInByb3BlcnR5IiwiVkFMSURBVElPTiIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwidmFsaWRhdGVQcm9wZXJ0eVBoYXNlUGFpciIsInBoYXNlIiwiZ2V0TWFwUGFpckZyb21QaGFzZXMiLCJiZWZvcmVQaGFzZSIsImFmdGVyUGhhc2UiLCJtYXRjaGVkUGFpcnMiLCJmaWx0ZXIiLCJtYXBQYWlyIiwibGVuZ3RoIiwicmVnaXN0ZXJQaGV0aW9PcmRlckRlcGVuZGVuY3kiLCJiZWZvcmVQcm9wZXJ0eSIsImFmdGVyUHJvcGVydHkiLCJQSEVUX0lPX0VOQUJMRUQiLCJhZGRPcmRlckRlcGVuZGVuY3kiLCJwcm9wZXJ0eUluQW5PcmRlckRlcGVuZGVuY3kiLCJzb21lIiwidXNlc1BoZXRpb0lEIiwidW5yZWdpc3Rlck9yZGVyRGVwZW5kZW5jaWVzRm9yUHJvcGVydHkiLCJmb3JFYWNoIiwicGhldGlvSURzSW5TdGF0ZSIsImNvbXBsZXRlZFBoYXNlcyIsIm51bWJlck9mSXRlcmF0aW9ucyIsImVycm9ySW5VbmRlZmVyQW5kTm90aWZ5U3RlcCIsImF0dGVtcHRUb0FwcGx5UGhhc2VzIiwic3RpbGxUb0RvSURQaGFzZVBhaXJzIiwicGhhc2VDYWxsYmFjayIsInB1c2giLCJnZXRUZXJtIiwicmVsZXZhbnRPcmRlckRlcGVuZGVuY2llcyIsImJlZm9yZU1hcCIsImJlZm9yZVBoZXRpb0lEIiwiYWZ0ZXJQaGV0aW9JRHMiLCJhZnRlclBoZXRpb0lEIiwiYmVmb3JlVGVybSIsImFmdGVyVGVybSIsImluY2x1ZGVzIiwic3RyaW5nIiwiY29uc29sZSIsImxvZyIsInVuZGVmZXJTZXQiLCJub3RpZnlTZXQiLCJvcmRlckRlcGVuZGVuY3kiLCJhc3NlcnRNZXNzYWdlIiwiRXJyb3IiLCJnZXROdW1iZXJPZk9yZGVyRGVwZW5kZW5jaWVzIiwiY291bnQiLCJhZnRlck1hcCIsInZhbHVlU2V0IiwicGhhc2VDYWxsYmFja1NldCIsImdldFNldEZyb21QaGFzZSIsInBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkiLCJwaGV0aW9JRENhbkFwcGx5UGhhc2UiLCJkZWxldGUiLCJtYXBzVG9DaGVjayIsImkiLCJtYXBUb0NoZWNrIiwiaGFzIiwic2V0T2ZUaGluZ3NUaGF0U2hvdWxkQ29tZUZpcnN0IiwiZ2V0IiwiTWFwIiwib3RoZXJNYXAiLCJzZXQiLCJhZGQiLCJwaGV0aW9JRFRvUmVtb3ZlIiwibWFwIiwic2V0T2ZBZnRlck1hcElEcyIsImFzc2VydFNsb3ciLCJ2YWx1ZVBoZXRpb0lEcyIsImtleSIsImNhbGxiYWNrIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQcm9wZXJ0eVN0YXRlSGFuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXNwb25zaWJsZSBmb3IgaGFuZGxpbmcgUHJvcGVydHktc3BlY2lmaWMgbG9naWMgYXNzb2NpYXRlZCB3aXRoIHNldHRpbmcgUGhFVC1pTyBzdGF0ZS4gVGhpcyBmaWxlIHdpbGwgZGVmZXIgUHJvcGVydGllc1xyXG4gKiBmcm9tIHRha2luZyB0aGVpciBmaW5hbCB2YWx1ZSwgYW5kIG5vdGlmeWluZyBvbiB0aGF0IHZhbHVlIHVudGlsIGFmdGVyIHN0YXRlIGhhcyBiZWVuIHNldCBvbiBldmVyeSBQcm9wZXJ0eS4gSXQgaXNcclxuICogYWxzbyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyB0cmFjayBvZiBvcmRlciBkZXBlbmRlbmNpZXMgYmV0d2VlbiBkaWZmZXJlbnQgUHJvcGVydGllcywgYW5kIG1ha2luZyBzdXJlIHRoYXQgdW5kZWZlcnJhbFxyXG4gKiBhbmQgbm90aWZpY2F0aW9ucyBnbyBvdXQgaW4gdGhlIGFwcHJvcHJpYXRlIG9yZGVycy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8yNzYgZm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IFByb3BlcnR5U3RhdGVQaGFzZSBmcm9tICcuL1Byb3BlcnR5U3RhdGVQaGFzZS5qcyc7XHJcbmltcG9ydCBSZWFkT25seVByb3BlcnR5IGZyb20gJy4vUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb0lEIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbUNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB7IFRQaGV0aW9TdGF0ZUVuZ2luZSB9IGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UUGhldGlvU3RhdGVFbmdpbmUuanMnO1xyXG5cclxudHlwZSBQaGFzZU1hcCA9IHtcclxuICBiZWZvcmVQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlO1xyXG4gIGFmdGVyUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZTtcclxuICBvdGhlck1hcDogUGhhc2VNYXA7XHJcbn0gJiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj47XHJcblxyXG50eXBlIE9yZGVyRGVwZW5kZW5jeSA9IHtcclxuICBiZWZvcmVUZXJtOiBzdHJpbmc7XHJcbiAgYWZ0ZXJUZXJtOiBzdHJpbmc7XHJcbn07XHJcblxyXG5jbGFzcyBQcm9wZXJ0eVN0YXRlSGFuZGxlciB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwaGFzZUNhbGxiYWNrU2V0czogUGhhc2VDYWxsYmFja1NldHM7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB1bmRlZmVyQmVmb3JlVW5kZWZlck1hcFBhaXI6IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB1bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpcjogT3JkZXJEZXBlbmRlbmN5TWFwUGFpcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG5vdGlmeUJlZm9yZVVuZGVmZXJNYXBQYWlyOiBPcmRlckRlcGVuZGVuY3lNYXBQYWlyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbm90aWZ5QmVmb3JlTm90aWZ5TWFwUGFpcjogT3JkZXJEZXBlbmRlbmN5TWFwUGFpcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1hcFBhaXJzOiBPcmRlckRlcGVuZGVuY3lNYXBQYWlyW107XHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgLy8gUHJvcGVydGllcyBzdXBwb3J0IHNldERlZmVycmVkKCkuIFdlIGRlZmVyIHNldHRpbmcgdGhlaXIgdmFsdWVzIHNvIGFsbCBjaGFuZ2VzIHRha2UgZWZmZWN0XHJcbiAgICAvLyBhdCBvbmNlLiBUaGlzIGtlZXBzIHRyYWNrIG9mIGZpbmFsaXphdGlvbiBhY3Rpb25zIChlbWJvZGllZCBpbiBhIFBoYXNlQ2FsbGJhY2spIHRoYXQgbXVzdCB0YWtlIHBsYWNlIGFmdGVyIGFsbFxyXG4gICAgLy8gUHJvcGVydHkgdmFsdWVzIGhhdmUgY2hhbmdlZC4gVGhpcyBrZWVwcyB0cmFjayBvZiBib3RoIHR5cGVzIG9mIFByb3BlcnR5U3RhdGVQaGFzZTogdW5kZWZlcnJpbmcgYW5kIG5vdGlmaWNhdGlvbi5cclxuICAgIHRoaXMucGhhc2VDYWxsYmFja1NldHMgPSBuZXcgUGhhc2VDYWxsYmFja1NldHMoKTtcclxuXHJcbiAgICAvLyBlYWNoIHBhaXIgaGFzIGEgTWFwIG9wdGltaXplZCBmb3IgbG9va2luZyB1cCBiYXNlZCBvbiB0aGUgXCJiZWZvcmUgcGhldGlvSURcIiBhbmQgdGhlIFwiYWZ0ZXIgcGhldGlvSURcIlxyXG4gICAgLy8gb2YgdGhlIGRlcGVuZGVuY3kuIEhhdmluZyBhIGRhdGEgc3RydWN0dXJlIHNldCB1cCBmb3IgYm90aCBkaXJlY3Rpb25zIG9mIGxvb2stdXAgbWFrZXMgZWFjaCBvcGVyYXRpb24gTygxKS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8zMTZcclxuICAgIHRoaXMudW5kZWZlckJlZm9yZVVuZGVmZXJNYXBQYWlyID0gbmV3IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIoIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSLCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiApO1xyXG4gICAgdGhpcy51bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpciA9IG5ldyBPcmRlckRlcGVuZGVuY3lNYXBQYWlyKCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiwgUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSApO1xyXG4gICAgdGhpcy5ub3RpZnlCZWZvcmVVbmRlZmVyTWFwUGFpciA9IG5ldyBPcmRlckRlcGVuZGVuY3lNYXBQYWlyKCBQcm9wZXJ0eVN0YXRlUGhhc2UuTk9USUZZLCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiApO1xyXG4gICAgdGhpcy5ub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyID0gbmV3IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIoIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlksIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlkgKTtcclxuXHJcbiAgICAvLyBrZWVwIGEgbGlzdCBvZiBhbGwgbWFwIHBhaXJzIGZvciBlYXNpZXIgaXRlcmF0aW9uXHJcbiAgICB0aGlzLm1hcFBhaXJzID0gW1xyXG4gICAgICB0aGlzLnVuZGVmZXJCZWZvcmVVbmRlZmVyTWFwUGFpcixcclxuICAgICAgdGhpcy51bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpcixcclxuICAgICAgdGhpcy5ub3RpZnlCZWZvcmVVbmRlZmVyTWFwUGFpcixcclxuICAgICAgdGhpcy5ub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGluaXRpYWxpemUoIHBoZXRpb1N0YXRlRW5naW5lOiBUUGhldGlvU3RhdGVFbmdpbmUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pbml0aWFsaXplZCwgJ2Nhbm5vdCBpbml0aWFsaXplIHR3aWNlJyApO1xyXG5cclxuICAgIHBoZXRpb1N0YXRlRW5naW5lLm9uQmVmb3JlQXBwbHlTdGF0ZUVtaXR0ZXIuYWRkTGlzdGVuZXIoIHBoZXRpb09iamVjdCA9PiB7XHJcblxyXG4gICAgICAvLyB3aXRoaG9sZCBBWE9OL1Byb3BlcnR5IG5vdGlmaWNhdGlvbnMgdW50aWwgYWxsIHZhbHVlcyBoYXZlIGJlZW4gc2V0IHRvIGF2b2lkIGluY29uc2lzdGVudCBpbnRlcm1lZGlhdGUgc3RhdGVzLFxyXG4gICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8td3JhcHBlcnMvaXNzdWVzLzIyOVxyXG4gICAgICAvLyBvbmx5IGRvIHRoaXMgaWYgdGhlIFBoZXRpb09iamVjdCBpcyBhbHJlYWR5IG5vdCBkZWZlcnJlZFxyXG4gICAgICBpZiAoIHBoZXRpb09iamVjdCBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgJiYgIXBoZXRpb09iamVjdC5pc0RlZmVycmVkICkge1xyXG4gICAgICAgIHBoZXRpb09iamVjdC5zZXREZWZlcnJlZCggdHJ1ZSApO1xyXG4gICAgICAgIGNvbnN0IHBoZXRpb0lEID0gcGhldGlvT2JqZWN0LnRhbmRlbS5waGV0aW9JRDtcclxuXHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBwb3RlbnRpYWxMaXN0ZW5lciA9IHBoZXRpb09iamVjdC5zZXREZWZlcnJlZCggZmFsc2UgKTtcclxuXHJcbiAgICAgICAgICAvLyBBbHdheXMgYWRkIGEgUGhhc2VDYWxsYmFjayBzbyB0aGF0IHdlIGNhbiB0cmFjayB0aGUgb3JkZXIgZGVwZW5kZW5jeSwgZXZlbiB0aG91Z2ggc2V0RGVmZXJyZWQgY2FuIHJldHVybiBudWxsLlxyXG4gICAgICAgICAgdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5hZGROb3RpZnlQaGFzZUNhbGxiYWNrKCBuZXcgUGhhc2VDYWxsYmFjayggcGhldGlvSUQsIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlksIHBvdGVudGlhbExpc3RlbmVyIHx8IF8ubm9vcCApICk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnBoYXNlQ2FsbGJhY2tTZXRzLmFkZFVuZGVmZXJQaGFzZUNhbGxiYWNrKCBuZXcgUGhhc2VDYWxsYmFjayggcGhldGlvSUQsIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSLCBsaXN0ZW5lciApICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBwaGV0aW9TdGF0ZUVuZ2luZS51bmRlZmVyRW1pdHRlci5hZGRMaXN0ZW5lciggc3RhdGUgPT4ge1xyXG5cclxuICAgICAgLy8gUHJvcGVydGllcyBzZXQgdG8gZmluYWwgdmFsdWVzIGFuZCBub3RpZnkgb2YgYW55IHZhbHVlIGNoYW5nZXMuXHJcbiAgICAgIHRoaXMudW5kZWZlckFuZE5vdGlmeVByb3BlcnRpZXMoIG5ldyBTZXQoIE9iamVjdC5rZXlzKCBzdGF0ZSApICkgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBwaGV0aW9TdGF0ZUVuZ2luZS5pc1NldHRpbmdTdGF0ZVByb3BlcnR5LmxhenlMaW5rKCBpc1NldHRpbmdTdGF0ZSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiAhaXNTZXR0aW5nU3RhdGUgJiYgYXNzZXJ0KCB0aGlzLnBoYXNlQ2FsbGJhY2tTZXRzLnNpemUgPT09IDAsICdQaGFzZUNhbGxiYWNrcyBzaG91bGQgaGF2ZSBhbGwgYmVlbiBhcHBsaWVkJyApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSggcHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8dW5rbm93bj4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0KCBwcm9wZXJ0eSBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgJiYgcHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgYG11c3QgYmUgYW4gaW5zdHJ1bWVudGVkIFByb3BlcnR5OiAke3Byb3BlcnR5fWAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdmFsaWRhdGVQcm9wZXJ0eVBoYXNlUGFpciggcHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8dW5rbm93bj4sIHBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UgKTogdm9pZCB7XHJcbiAgICBQcm9wZXJ0eVN0YXRlSGFuZGxlci52YWxpZGF0ZUluc3RydW1lbnRlZFByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBNYXBQYWlyIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvdmVkIFByb3BlcnR5U3RhdGVQaGFzZXNcclxuICAgKi9cclxuICBwcml2YXRlIGdldE1hcFBhaXJGcm9tUGhhc2VzKCBiZWZvcmVQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlLCBhZnRlclBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UgKTogT3JkZXJEZXBlbmRlbmN5TWFwUGFpciB7XHJcbiAgICBjb25zdCBtYXRjaGVkUGFpcnMgPSB0aGlzLm1hcFBhaXJzLmZpbHRlciggbWFwUGFpciA9PiBiZWZvcmVQaGFzZSA9PT0gbWFwUGFpci5iZWZvcmVQaGFzZSAmJiBhZnRlclBoYXNlID09PSBtYXBQYWlyLmFmdGVyUGhhc2UgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1hdGNoZWRQYWlycy5sZW5ndGggPT09IDEsICdvbmUgYW5kIG9ubHkgb25lIG1hcCBzaG91bGQgbWF0Y2ggdGhlIHByb3ZpZGVkIHBoYXNlcycgKTtcclxuICAgIHJldHVybiBtYXRjaGVkUGFpcnNbIDAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIHRoYXQgb25lIFByb3BlcnR5IG11c3QgaGF2ZSBhIFwiUGhhc2VcIiBhcHBsaWVkIGZvciBQaEVULWlPIHN0YXRlIGJlZm9yZSBhbm90aGVyIFByb3BlcnR5J3MgUGhhc2UuIEEgUGhhc2VcclxuICAgKiBpcyBhbiBlbmRpbmcgc3RhdGUgaW4gUGhFVC1pTyBzdGF0ZSBzZXQgd2hlcmUgUHJvcGVydHkgdmFsdWVzIHNvbGlkaWZ5LCBub3RpZmljYXRpb25zIGZvciB2YWx1ZSBjaGFuZ2VzIGFyZSBjYWxsZWQuXHJcbiAgICogVGhlIFBoRVQtaU8gc3RhdGUgZW5naW5lIHdpbGwgYWx3YXlzIHVuZGVmZXIgYSBQcm9wZXJ0eSBiZWZvcmUgaXQgbm90aWZpZXMgaXRzIGxpc3RlbmVycy4gVGhpcyBpcyBmb3IgcmVnaXN0ZXJpbmdcclxuICAgKiB0d28gZGlmZmVyZW50IFByb3BlcnRpZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYmVmb3JlUHJvcGVydHkgLSB0aGUgUHJvcGVydHkgdGhhdCBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIHRoZSBzZWNvbmQ7IG11c3QgYmUgaW5zdHJ1bWVudGVkIGZvciBQaEVULWlPXHJcbiAgICogQHBhcmFtIGJlZm9yZVBoYXNlXHJcbiAgICogQHBhcmFtIGFmdGVyUHJvcGVydHkgLSBtdXN0IGJlIGluc3RydW1lbnRlZCBmb3IgUGhFVC1pT1xyXG4gICAqIEBwYXJhbSBhZnRlclBoYXNlXHJcbiAgICovXHJcbiAgcHVibGljIHJlZ2lzdGVyUGhldGlvT3JkZXJEZXBlbmRlbmN5KCBiZWZvcmVQcm9wZXJ0eTogUmVhZE9ubHlQcm9wZXJ0eTxJbnRlbnRpb25hbEFueT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZWZvcmVQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlLCBhZnRlclByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PEludGVudGlvbmFsQW55PixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSApOiB2b2lkIHtcclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCApIHtcclxuXHJcbiAgICAgIHRoaXMudmFsaWRhdGVQcm9wZXJ0eVBoYXNlUGFpciggYmVmb3JlUHJvcGVydHksIGJlZm9yZVBoYXNlICk7XHJcbiAgICAgIHRoaXMudmFsaWRhdGVQcm9wZXJ0eVBoYXNlUGFpciggYWZ0ZXJQcm9wZXJ0eSwgYWZ0ZXJQaGFzZSApO1xyXG4gICAgICBhc3NlcnQgJiYgYmVmb3JlUHJvcGVydHkgPT09IGFmdGVyUHJvcGVydHkgJiYgYXNzZXJ0KCBiZWZvcmVQaGFzZSAhPT0gYWZ0ZXJQaGFzZSwgJ2Nhbm5vdCBzZXQgc2FtZSBQcm9wZXJ0eSB0byBzYW1lIHBoYXNlJyApO1xyXG5cclxuICAgICAgY29uc3QgbWFwUGFpciA9IHRoaXMuZ2V0TWFwUGFpckZyb21QaGFzZXMoIGJlZm9yZVBoYXNlLCBhZnRlclBoYXNlICk7XHJcblxyXG4gICAgICBtYXBQYWlyLmFkZE9yZGVyRGVwZW5kZW5jeSggYmVmb3JlUHJvcGVydHkudGFuZGVtLnBoZXRpb0lELCBhZnRlclByb3BlcnR5LnRhbmRlbS5waGV0aW9JRCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICoge1Byb3BlcnR5fSBwcm9wZXJ0eSAtIG11c3QgYmUgaW5zdHJ1bWVudGVkIGZvciBQaEVULWlPXHJcbiAgICoge2Jvb2xlYW59IC0gdHJ1ZSBpZiBQcm9wZXJ0eSBpcyBpbiBhbnkgb3JkZXIgZGVwZW5kZW5jeVxyXG4gICAqL1xyXG4gIHByaXZhdGUgcHJvcGVydHlJbkFuT3JkZXJEZXBlbmRlbmN5KCBwcm9wZXJ0eTogUmVhZE9ubHlQcm9wZXJ0eTx1bmtub3duPiApOiBib29sZWFuIHtcclxuICAgIFByb3BlcnR5U3RhdGVIYW5kbGVyLnZhbGlkYXRlSW5zdHJ1bWVudGVkUHJvcGVydHkoIHByb3BlcnR5ICk7XHJcbiAgICByZXR1cm4gXy5zb21lKCB0aGlzLm1hcFBhaXJzLCBtYXBQYWlyID0+IG1hcFBhaXIudXNlc1BoZXRpb0lEKCBwcm9wZXJ0eS50YW5kZW0ucGhldGlvSUQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVW5yZWdpc3RlcnMgYWxsIG9yZGVyIGRlcGVuZGVuY2llcyBmb3IgdGhlIGdpdmVuIFByb3BlcnR5XHJcbiAgICoge1JlYWRPbmx5UHJvcGVydHl9IHByb3BlcnR5IC0gbXVzdCBiZSBpbnN0cnVtZW50ZWQgZm9yIFBoRVQtaU9cclxuICAgKi9cclxuICBwdWJsaWMgdW5yZWdpc3Rlck9yZGVyRGVwZW5kZW5jaWVzRm9yUHJvcGVydHkoIHByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PEludGVudGlvbmFsQW55PiApOiB2b2lkIHtcclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCApIHtcclxuICAgICAgUHJvcGVydHlTdGF0ZUhhbmRsZXIudmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuXHJcbiAgICAgIC8vIEJlIGdyYWNlZnVsIGlmIGdpdmVuIGEgUHJvcGVydHkgdGhhdCBpcyBub3QgcmVnaXN0ZXJlZCBpbiBhbiBvcmRlciBkZXBlbmRlbmN5LlxyXG4gICAgICBpZiAoIHRoaXMucHJvcGVydHlJbkFuT3JkZXJEZXBlbmRlbmN5KCBwcm9wZXJ0eSApICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucHJvcGVydHlJbkFuT3JkZXJEZXBlbmRlbmN5KCBwcm9wZXJ0eSApLCAnUHJvcGVydHkgbXVzdCBiZSByZWdpc3RlcmVkIGluIGFuIG9yZGVyIGRlcGVuZGVuY3kgdG8gYmUgdW5yZWdpc3RlcmVkJyApO1xyXG5cclxuICAgICAgICB0aGlzLm1hcFBhaXJzLmZvckVhY2goIG1hcFBhaXIgPT4gbWFwUGFpci51bnJlZ2lzdGVyT3JkZXJEZXBlbmRlbmNpZXNGb3JQcm9wZXJ0eSggcHJvcGVydHkgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiByZWdpc3RlcmVkIFByb3BlcnR5IFBoYXNlIG9yZGVyIGRlcGVuZGVuY2llcywgdW5kZWZlciBhbGwgQVhPTi9Qcm9wZXJ0eSBQaEVULWlPIEVsZW1lbnRzIHRvIHRha2UgdGhlaXJcclxuICAgKiBjb3JyZWN0IHZhbHVlcyBhbmQgaGF2ZSBlYWNoIG5vdGlmeSB0aGVpciBsaXN0ZW5lcnMuXHJcbiAgICoge1NldC48c3RyaW5nPn0gcGhldGlvSURzSW5TdGF0ZSAtIHNldCBvZiBwaGV0aW9JRHMgdGhhdCB3ZXJlIHNldCBpbiBzdGF0ZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgdW5kZWZlckFuZE5vdGlmeVByb3BlcnRpZXMoIHBoZXRpb0lEc0luU3RhdGU6IFNldDxzdHJpbmc+ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pbml0aWFsaXplZCwgJ211c3QgYmUgaW5pdGlhbGl6ZWQgYmVmb3JlIGdldHRpbmcgY2FsbGVkJyApO1xyXG5cclxuICAgIC8vIHtPYmplY3QuPHN0cmluZyxib29sZWFuPn0gLSB0cnVlIGlmIGEgcGhldGlvSUQgKyBwaGFzZSBwYWlyIGhhcyBiZWVuIGFwcGxpZWQsIGtleXMgYXJlIHRoZSBjb21iaW5hdGlvbiBvZlxyXG4gICAgLy8gcGhldGlvSURzIGFuZCBwaGFzZSwgc2VlIFBoYXNlQ2FsbGJhY2suZ2V0VGVybSgpXHJcbiAgICBjb25zdCBjb21wbGV0ZWRQaGFzZXMgPSB7fTtcclxuXHJcbiAgICAvLyB0byBzdXBwb3J0IGZhaWxpbmcgb3V0IGluc3RlYWQgb2YgaW5maW5pdGUgbG9vcFxyXG4gICAgbGV0IG51bWJlck9mSXRlcmF0aW9ucyA9IDA7XHJcblxyXG4gICAgLy8gTm9ybWFsbHkgd2Ugd291bGQgbGlrZSB0byB1bmRlZmVyIHRoaW5ncyBiZWZvcmUgbm90aWZ5LCBidXQgbWFrZSBzdXJlIHRoaXMgaXMgZG9uZSBpbiBhY2NvcmRhbmNlIHdpdGggdGhlIG9yZGVyIGRlcGVuZGVuY2llcy5cclxuICAgIHdoaWxlICggdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5zaXplID4gMCApIHtcclxuICAgICAgbnVtYmVyT2ZJdGVyYXRpb25zKys7XHJcblxyXG4gICAgICAvLyBFcnJvciBjYXNlIGxvZ2dpbmdcclxuICAgICAgaWYgKCBudW1iZXJPZkl0ZXJhdGlvbnMgPiA1MDAwICkge1xyXG4gICAgICAgIHRoaXMuZXJyb3JJblVuZGVmZXJBbmROb3RpZnlTdGVwKCBjb21wbGV0ZWRQaGFzZXMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVHJ5IHRvIHVuZGVmZXIgYXMgbXVjaCBhcyBwb3NzaWJsZSBiZWZvcmUgbm90aWZ5aW5nXHJcbiAgICAgIHRoaXMuYXR0ZW1wdFRvQXBwbHlQaGFzZXMoIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSLCBjb21wbGV0ZWRQaGFzZXMsIHBoZXRpb0lEc0luU3RhdGUgKTtcclxuICAgICAgdGhpcy5hdHRlbXB0VG9BcHBseVBoYXNlcyggUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSwgY29tcGxldGVkUGhhc2VzLCBwaGV0aW9JRHNJblN0YXRlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgcHJpdmF0ZSBlcnJvckluVW5kZWZlckFuZE5vdGlmeVN0ZXAoIGNvbXBsZXRlZFBoYXNlczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gKTogdm9pZCB7XHJcblxyXG4gICAgLy8gY29tYmluZSBwaGV0aW9JRCBhbmQgUGhhc2UgaW50byBhIHNpbmdsZSBzdHJpbmcgdG8ga2VlcCB0aGlzIHByb2Nlc3Mgc3BlY2lmaWMuXHJcbiAgICBjb25zdCBzdGlsbFRvRG9JRFBoYXNlUGFpcnM6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuICAgIHRoaXMucGhhc2VDYWxsYmFja1NldHMuZm9yRWFjaCggcGhhc2VDYWxsYmFjayA9PiBzdGlsbFRvRG9JRFBoYXNlUGFpcnMucHVzaCggcGhhc2VDYWxsYmFjay5nZXRUZXJtKCkgKSApO1xyXG5cclxuICAgIGNvbnN0IHJlbGV2YW50T3JkZXJEZXBlbmRlbmNpZXM6IEFycmF5PE9yZGVyRGVwZW5kZW5jeT4gPSBbXTtcclxuXHJcbiAgICB0aGlzLm1hcFBhaXJzLmZvckVhY2goIG1hcFBhaXIgPT4ge1xyXG4gICAgICBjb25zdCBiZWZvcmVNYXAgPSBtYXBQYWlyLmJlZm9yZU1hcDtcclxuICAgICAgZm9yICggY29uc3QgWyBiZWZvcmVQaGV0aW9JRCwgYWZ0ZXJQaGV0aW9JRHMgXSBvZiBiZWZvcmVNYXAgKSB7XHJcbiAgICAgICAgYWZ0ZXJQaGV0aW9JRHMuZm9yRWFjaCggYWZ0ZXJQaGV0aW9JRCA9PiB7XHJcbiAgICAgICAgICBjb25zdCBiZWZvcmVUZXJtID0gYmVmb3JlUGhldGlvSUQgKyBiZWZvcmVNYXAuYmVmb3JlUGhhc2U7XHJcbiAgICAgICAgICBjb25zdCBhZnRlclRlcm0gPSBhZnRlclBoZXRpb0lEICsgYmVmb3JlTWFwLmFmdGVyUGhhc2U7XHJcbiAgICAgICAgICBpZiAoIHN0aWxsVG9Eb0lEUGhhc2VQYWlycy5pbmNsdWRlcyggYmVmb3JlVGVybSApIHx8IHN0aWxsVG9Eb0lEUGhhc2VQYWlycy5pbmNsdWRlcyggYWZ0ZXJUZXJtICkgKSB7XHJcbiAgICAgICAgICAgIHJlbGV2YW50T3JkZXJEZXBlbmRlbmNpZXMucHVzaCgge1xyXG4gICAgICAgICAgICAgIGJlZm9yZVRlcm06IGJlZm9yZVRlcm0sXHJcbiAgICAgICAgICAgICAgYWZ0ZXJUZXJtOiBhZnRlclRlcm1cclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGxldCBzdHJpbmcgPSAnJztcclxuICAgIGNvbnNvbGUubG9nKCAnc3RpbGwgdG8gYmUgdW5kZWZlcnJlZCcsIHRoaXMucGhhc2VDYWxsYmFja1NldHMudW5kZWZlclNldCApO1xyXG4gICAgY29uc29sZS5sb2coICdzdGlsbCB0byBiZSBub3RpZmllZCcsIHRoaXMucGhhc2VDYWxsYmFja1NldHMubm90aWZ5U2V0ICk7XHJcbiAgICBjb25zb2xlLmxvZyggJ29yZGVyIGRlcGVuZGVuY2llcyB0aGF0IGFwcGx5IHRvIHRoZSBzdGlsbCB0b2RvcycsIHJlbGV2YW50T3JkZXJEZXBlbmRlbmNpZXMgKTtcclxuICAgIHJlbGV2YW50T3JkZXJEZXBlbmRlbmNpZXMuZm9yRWFjaCggb3JkZXJEZXBlbmRlbmN5ID0+IHtcclxuICAgICAgc3RyaW5nICs9IGAke29yZGVyRGVwZW5kZW5jeS5iZWZvcmVUZXJtfVxcdCR7b3JkZXJEZXBlbmRlbmN5LmFmdGVyVGVybX1cXG5gO1xyXG4gICAgfSApO1xyXG4gICAgY29uc29sZS5sb2coICdcXG5cXG5pbiBncmFwaGFibGUgZm9ybTpcXG5cXG4nLCBzdHJpbmcgKTtcclxuXHJcbiAgICBjb25zdCBhc3NlcnRNZXNzYWdlID0gJ0ltcG9zc2libGUgc2V0IHN0YXRlOiBmcm9tIHVuZGVmZXJBbmROb3RpZnlQcm9wZXJ0aWVzOyBvcmRlcmluZyBjb25zdHJhaW50cyBjYW5ub3QgYmUgc2F0aXNmaWVkJztcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCBhc3NlcnRNZXNzYWdlICk7XHJcblxyXG4gICAgLy8gV2UgbXVzdCBleGl0IGhlcmUgZXZlbiBpZiBhc3NlcnRpb25zIGFyZSBkaXNhYmxlZCBzbyBpdCB3b3VsZG4ndCBsb2NrIHVwIHRoZSBicm93c2VyLlxyXG4gICAgaWYgKCAhYXNzZXJ0ICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGFzc2VydE1lc3NhZ2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9ubHkgZm9yIFRlc3RpbmchXHJcbiAgICogR2V0IHRoZSBudW1iZXIgb2Ygb3JkZXIgZGVwZW5kZW5jaWVzIHJlZ2lzdGVyZWQgaW4gdGhpcyBjbGFzc1xyXG4gICAqXHJcbiAgICovXHJcbiAgcHVibGljIGdldE51bWJlck9mT3JkZXJEZXBlbmRlbmNpZXMoKTogbnVtYmVyIHtcclxuICAgIGxldCBjb3VudCA9IDA7XHJcbiAgICB0aGlzLm1hcFBhaXJzLmZvckVhY2goIG1hcFBhaXIgPT4ge1xyXG4gICAgICBtYXBQYWlyLmFmdGVyTWFwLmZvckVhY2goIHZhbHVlU2V0ID0+IHsgY291bnQgKz0gdmFsdWVTZXQuc2l6ZTsgfSApO1xyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIGNvdW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR28gdGhyb3VnaCBhbGwgcGhhc2VzIHN0aWxsIHRvIGJlIGFwcGxpZWQsIGFuZCBhcHBseSB0aGVtIGlmIHRoZSBvcmRlciBkZXBlbmRlbmNpZXMgYWxsb3cgaXQuIE9ubHkgYXBwbHkgZm9yIHRoZVxyXG4gICAqIHBhcnRpY3VsYXIgcGhhc2UgcHJvdmlkZWQuIEluIGdlbmVyYWwgVU5ERUZFUiBtdXN0IG9jY3VyIGJlZm9yZSB0aGUgc2FtZSBwaGV0aW9JRCBnZXRzIE5PVElGWS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwaGFzZSAtIG9ubHkgYXBwbHkgUGhhc2VDYWxsYmFja3MgZm9yIHRoaXMgcGFydGljdWxhciBQcm9wZXJ0eVN0YXRlUGhhc2VcclxuICAgKiBAcGFyYW0gY29tcGxldGVkUGhhc2VzIC0gbWFwIHRoYXQga2VlcHMgdHJhY2sgb2YgY29tcGxldGVkIHBoYXNlc1xyXG4gICAqIEBwYXJhbSBwaGV0aW9JRHNJblN0YXRlIC0gc2V0IG9mIHBoZXRpb0lEcyB0aGF0IHdlcmUgc2V0IGluIHN0YXRlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhdHRlbXB0VG9BcHBseVBoYXNlcyggcGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSwgY29tcGxldGVkUGhhc2VzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiwgcGhldGlvSURzSW5TdGF0ZTogU2V0PHN0cmluZz4gKTogdm9pZCB7XHJcblxyXG4gICAgY29uc3QgcGhhc2VDYWxsYmFja1NldCA9IHRoaXMucGhhc2VDYWxsYmFja1NldHMuZ2V0U2V0RnJvbVBoYXNlKCBwaGFzZSApO1xyXG5cclxuICAgIGZvciAoIGNvbnN0IHBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkgb2YgcGhhc2VDYWxsYmFja1NldCApIHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkucGhhc2UgPT09IHBoYXNlLCAncGhhc2VDYWxsYmFja1NldCBzaG91bGQgb25seSBpbmNsdWRlIGNhbGxiYWNrcyBmb3IgcHJvdmlkZWQgcGhhc2UnICk7XHJcblxyXG4gICAgICAvLyBvbmx5IHRyeSB0byBjaGVjayB0aGUgb3JkZXIgZGVwZW5kZW5jaWVzIHRvIHNlZSBpZiB0aGlzIGhhcyB0byBiZSBhZnRlciBzb21ldGhpbmcgdGhhdCBpcyBpbmNvbXBsZXRlLlxyXG4gICAgICBpZiAoIHRoaXMucGhldGlvSURDYW5BcHBseVBoYXNlKCBwaGFzZUNhbGxiYWNrVG9Qb3RlbnRpYWxseUFwcGx5LnBoZXRpb0lELCBwaGFzZSwgY29tcGxldGVkUGhhc2VzLCBwaGV0aW9JRHNJblN0YXRlICkgKSB7XHJcblxyXG4gICAgICAgIC8vIEZpcmUgdGhlIGxpc3RlbmVyO1xyXG4gICAgICAgIHBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkubGlzdGVuZXIoKTtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIG1haW4gbGlzdCBzbyB0aGF0IGl0IGRvZXNuJ3QgZ2V0IGNhbGxlZCBhZ2Fpbi5cclxuICAgICAgICBwaGFzZUNhbGxiYWNrU2V0LmRlbGV0ZSggcGhhc2VDYWxsYmFja1RvUG90ZW50aWFsbHlBcHBseSApO1xyXG5cclxuICAgICAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wbGV0ZWQgUGhhc2VDYWxsYmFja3NcclxuICAgICAgICBjb21wbGV0ZWRQaGFzZXNbIHBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkuZ2V0VGVybSgpIF0gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gcGhldGlvSUQgLSB0aGluayBvZiB0aGlzIGFzIHRoZSBcImFmdGVyUGhldGlvSURcIiBzaW5jZSB0aGVyZSBtYXkgYmUgc29tZSBwaGFzZXMgdGhhdCBuZWVkIHRvIGJlIGFwcGxpZWQgYmVmb3JlIGl0IGhhcyB0aGlzIHBoYXNlIGRvbmUuXHJcbiAgICogQHBhcmFtIHBoYXNlXHJcbiAgICogQHBhcmFtIGNvbXBsZXRlZFBoYXNlcyAtIG1hcCB0aGF0IGtlZXBzIHRyYWNrIG9mIGNvbXBsZXRlZCBwaGFzZXNcclxuICAgKiBAcGFyYW0gcGhldGlvSURzSW5TdGF0ZSAtIHNldCBvZiBwaGV0aW9JRHMgdGhhdCB3ZXJlIHNldCBpbiBzdGF0ZVxyXG4gICAqIEBwYXJhbSAtIGlmIHRoZSBwcm92aWRlZCBwaGFzZSBjYW4gYmUgYXBwbGllZCBnaXZlbiB0aGUgZGVwZW5kZW5jeSBvcmRlciBkZXBlbmRlbmNpZXMgb2YgdGhlIHN0YXRlIGVuZ2luZS5cclxuICAgKi9cclxuICBwcml2YXRlIHBoZXRpb0lEQ2FuQXBwbHlQaGFzZSggcGhldGlvSUQ6IFBoZXRpb0lELCBwaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlLCBjb21wbGV0ZWRQaGFzZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+LCBwaGV0aW9JRHNJblN0YXRlOiBTZXQ8c3RyaW5nPiApOiBib29sZWFuIHtcclxuXHJcbiAgICAvLyBVbmRlZmVyIG11c3QgaGFwcGVuIGJlZm9yZSBub3RpZnlcclxuICAgIGlmICggcGhhc2UgPT09IFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlkgJiYgIWNvbXBsZXRlZFBoYXNlc1sgcGhldGlvSUQgKyBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiBdICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IGEgbGlzdCBvZiB0aGUgbWFwcyBmb3IgdGhpcyBwaGFzZSBiZWluZyBhcHBsaWVzLlxyXG4gICAgY29uc3QgbWFwc1RvQ2hlY2s6IEFycmF5PFBoYXNlTWFwPiA9IFtdO1xyXG4gICAgdGhpcy5tYXBQYWlycy5mb3JFYWNoKCBtYXBQYWlyID0+IHtcclxuICAgICAgaWYgKCBtYXBQYWlyLmFmdGVyUGhhc2UgPT09IHBoYXNlICkge1xyXG5cclxuICAgICAgICAvLyBVc2UgdGhlIFwiYWZ0ZXJNYXBcIiBiZWNhdXNlIGJlbG93IGxvb2tzIHVwIHdoYXQgbmVlZHMgdG8gY29tZSBiZWZvcmUuXHJcbiAgICAgICAgbWFwc1RvQ2hlY2sucHVzaCggbWFwUGFpci5hZnRlck1hcCApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTygyKVxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbWFwc1RvQ2hlY2subGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IG1hcFRvQ2hlY2sgPSBtYXBzVG9DaGVja1sgaSBdO1xyXG4gICAgICBpZiAoICFtYXBUb0NoZWNrLmhhcyggcGhldGlvSUQgKSApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzZXRPZlRoaW5nc1RoYXRTaG91bGRDb21lRmlyc3QgPSBtYXBUb0NoZWNrLmdldCggcGhldGlvSUQgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc2V0T2ZUaGluZ3NUaGF0U2hvdWxkQ29tZUZpcnN0LCAnbXVzdCBoYXZlIHRoaXMgc2V0JyApO1xyXG5cclxuICAgICAgLy8gTyhLKSB3aGVyZSBLIGlzIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBzaG91bGQgY29tZSBiZWZvcmUgUHJvcGVydHkgWFxyXG4gICAgICBmb3IgKCBjb25zdCBiZWZvcmVQaGV0aW9JRCBvZiBzZXRPZlRoaW5nc1RoYXRTaG91bGRDb21lRmlyc3QhICkge1xyXG5cclxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgYmVmb3JlIHBoYXNlIGZvciB0aGlzIG9yZGVyIGRlcGVuZGVuY3kgaGFzIGFscmVhZHkgYmVlbiBjb21wbGV0ZWRcclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSBvbmx5IGNhcmUgYWJvdXQgZWxlbWVudHMgdGhhdCB3ZXJlIGFjdHVhbGx5IHNldCBkdXJpbmcgdGhpcyBzdGF0ZSBzZXRcclxuICAgICAgICBpZiAoICFjb21wbGV0ZWRQaGFzZXNbIGJlZm9yZVBoZXRpb0lEICsgbWFwVG9DaGVjay5iZWZvcmVQaGFzZSBdICYmXHJcbiAgICAgICAgICAgICBwaGV0aW9JRHNJblN0YXRlLmhhcyggYmVmb3JlUGhldGlvSUQgKSAmJiBwaGV0aW9JRHNJblN0YXRlLmhhcyggcGhldGlvSUQgKSApIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLy8gUE9KU08gZm9yIGEgY2FsbGJhY2sgZm9yIGEgc3BlY2lmaWMgUGhhc2UgaW4gYSBQcm9wZXJ0eSdzIHN0YXRlIHNldCBsaWZlY3ljbGUuIFNlZSB1bmRlZmVyQW5kTm90aWZ5UHJvcGVydGllcygpXHJcbmNsYXNzIFBoYXNlQ2FsbGJhY2sge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHB1YmxpYyByZWFkb25seSBwaGV0aW9JRDogUGhldGlvSUQsXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSxcclxuICAgIHB1YmxpYyByZWFkb25seSBsaXN0ZW5lcjogKCAoKSA9PiB2b2lkICkgPSBfLm5vb3AgKSB7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiB7c3RyaW5nfSAtIHVuaXF1ZSB0ZXJtIGZvciB0aGUgaWQvcGhhc2UgcGFpclxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUZXJtKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5waGV0aW9JRCArIHRoaXMucGhhc2U7XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBPcmRlckRlcGVuZGVuY3lNYXBQYWlyIHtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IGJlZm9yZU1hcDogUGhhc2VNYXA7XHJcbiAgcHVibGljIHJlYWRvbmx5IGFmdGVyTWFwOiBQaGFzZU1hcDtcclxuICBwdWJsaWMgcmVhZG9ubHkgYmVmb3JlUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZTtcclxuICBwdWJsaWMgcmVhZG9ubHkgYWZ0ZXJQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGJlZm9yZVBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UsIGFmdGVyUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSApIHtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yLCBpdCBpcyBlYXNpZXN0IHRvIGZ1ZGdlIGhlcmUgc2luY2Ugd2UgYXJlIGFkZGluZyB0aGUgUGhhc2VNYXAgcHJvcGVydGllcyBqdXN0IGJlbG93IGhlcmUuXHJcbiAgICB0aGlzLmJlZm9yZU1hcCA9IG5ldyBNYXAoKTtcclxuICAgIHRoaXMuYmVmb3JlTWFwLmJlZm9yZVBoYXNlID0gYmVmb3JlUGhhc2U7XHJcbiAgICB0aGlzLmJlZm9yZU1hcC5hZnRlclBoYXNlID0gYWZ0ZXJQaGFzZTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yLCBpdCBpcyBlYXNpZXN0IHRvIGZ1ZGdlIGhlcmUgc2luY2Ugd2UgYXJlIGFkZGluZyB0aGUgUGhhc2VNYXAgcHJvcGVydGllcyBqdXN0IGJlbG93IGhlcmUuXHJcbiAgICB0aGlzLmFmdGVyTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5hZnRlck1hcC5iZWZvcmVQaGFzZSA9IGJlZm9yZVBoYXNlO1xyXG4gICAgdGhpcy5hZnRlck1hcC5hZnRlclBoYXNlID0gYWZ0ZXJQaGFzZTtcclxuXHJcbiAgICB0aGlzLmJlZm9yZU1hcC5vdGhlck1hcCA9IHRoaXMuYWZ0ZXJNYXA7XHJcbiAgICB0aGlzLmFmdGVyTWFwLm90aGVyTWFwID0gdGhpcy5iZWZvcmVNYXA7XHJcblxyXG4gICAgdGhpcy5iZWZvcmVQaGFzZSA9IGJlZm9yZVBoYXNlO1xyXG4gICAgdGhpcy5hZnRlclBoYXNlID0gYWZ0ZXJQaGFzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGFuIG9yZGVyIGRlcGVuZGVuY3kgYmV0d2VlbiB0d28gcGhldGlvSURzLiBUaGlzIHdpbGwgYWRkIGRhdGEgdG8gbWFwcyBpbiBcImJvdGggZGlyZWN0aW9uXCIuIElmIGFjY2Vzc2luZ1xyXG4gICAqIHdpdGgganVzdCB0aGUgYmVmb3JlUGhldGlvSUQsIG9yIHdpdGggdGhlIGFmdGVyUGhldGlvSUQuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZE9yZGVyRGVwZW5kZW5jeSggYmVmb3JlUGhldGlvSUQ6IFBoZXRpb0lELCBhZnRlclBoZXRpb0lEOiBQaGV0aW9JRCApOiB2b2lkIHtcclxuICAgIGlmICggIXRoaXMuYmVmb3JlTWFwLmhhcyggYmVmb3JlUGhldGlvSUQgKSApIHtcclxuICAgICAgdGhpcy5iZWZvcmVNYXAuc2V0KCBiZWZvcmVQaGV0aW9JRCwgbmV3IFNldDxzdHJpbmc+KCkgKTtcclxuICAgIH1cclxuICAgIHRoaXMuYmVmb3JlTWFwLmdldCggYmVmb3JlUGhldGlvSUQgKSEuYWRkKCBhZnRlclBoZXRpb0lEICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5hZnRlck1hcC5oYXMoIGFmdGVyUGhldGlvSUQgKSApIHtcclxuICAgICAgdGhpcy5hZnRlck1hcC5zZXQoIGFmdGVyUGhldGlvSUQsIG5ldyBTZXQoKSApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hZnRlck1hcC5nZXQoIGFmdGVyUGhldGlvSUQgKSEuYWRkKCBiZWZvcmVQaGV0aW9JRCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVW5yZWdpc3RlciBhbGwgb3JkZXIgZGVwZW5kZW5jaWVzIGZvciB0aGUgcHJvdmlkZWQgUHJvcGVydHlcclxuICAgKi9cclxuICBwdWJsaWMgdW5yZWdpc3Rlck9yZGVyRGVwZW5kZW5jaWVzRm9yUHJvcGVydHkoIHByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PHVua25vd24+ICk6IHZvaWQge1xyXG4gICAgY29uc3QgcGhldGlvSURUb1JlbW92ZSA9IHByb3BlcnR5LnRhbmRlbS5waGV0aW9JRDtcclxuXHJcbiAgICBbIHRoaXMuYmVmb3JlTWFwLCB0aGlzLmFmdGVyTWFwIF0uZm9yRWFjaCggbWFwID0+IHtcclxuICAgICAgbWFwLmhhcyggcGhldGlvSURUb1JlbW92ZSApICYmIG1hcC5nZXQoIHBoZXRpb0lEVG9SZW1vdmUgKSEuZm9yRWFjaCggcGhldGlvSUQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNldE9mQWZ0ZXJNYXBJRHMgPSBtYXAub3RoZXJNYXAuZ2V0KCBwaGV0aW9JRCApO1xyXG4gICAgICAgIHNldE9mQWZ0ZXJNYXBJRHMgJiYgc2V0T2ZBZnRlck1hcElEcy5kZWxldGUoIHBoZXRpb0lEVG9SZW1vdmUgKTtcclxuXHJcbiAgICAgICAgLy8gQ2xlYXIgb3V0IGVtcHR5IGVudHJpZXMgdG8gYXZvaWQgaGF2aW5nIGxvdHMgb2YgZW1wdHkgU2V0cyBzaXR0aW5nIGFyb3VuZFxyXG4gICAgICAgIHNldE9mQWZ0ZXJNYXBJRHMhLnNpemUgPT09IDAgJiYgbWFwLm90aGVyTWFwLmRlbGV0ZSggcGhldGlvSUQgKTtcclxuICAgICAgfSApO1xyXG4gICAgICBtYXAuZGVsZXRlKCBwaGV0aW9JRFRvUmVtb3ZlICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTG9vayB0aHJvdWdoIGV2ZXJ5IGRlcGVuZGVuY3kgYW5kIG1ha2Ugc3VyZSB0aGUgcGhldGlvSUQgdG8gcmVtb3ZlIGhhcyBiZWVuIGNvbXBsZXRlbHkgcmVtb3ZlZC5cclxuICAgIGFzc2VydFNsb3cgJiYgWyB0aGlzLmJlZm9yZU1hcCwgdGhpcy5hZnRlck1hcCBdLmZvckVhY2goIG1hcCA9PiB7XHJcbiAgICAgIG1hcC5mb3JFYWNoKCAoIHZhbHVlUGhldGlvSURzLCBrZXkgKSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyAmJiBhc3NlcnRTbG93KCBrZXkgIT09IHBoZXRpb0lEVG9SZW1vdmUsICdzaG91bGQgbm90IGJlIGEga2V5JyApO1xyXG4gICAgICAgIGFzc2VydFNsb3cgJiYgYXNzZXJ0U2xvdyggIXZhbHVlUGhldGlvSURzLmhhcyggcGhldGlvSURUb1JlbW92ZSApLCAnc2hvdWxkIG5vdCBiZSBpbiBhIHZhbHVlIGxpc3QnICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB1c2VzUGhldGlvSUQoIHBoZXRpb0lEOiBQaGV0aW9JRCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmJlZm9yZU1hcC5oYXMoIHBoZXRpb0lEICkgfHwgdGhpcy5hZnRlck1hcC5oYXMoIHBoZXRpb0lEICk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBQT0pTTyB0byBrZWVwIHRyYWNrIG9mIFBoYXNlQ2FsbGJhY2tzIHdoaWxlIHByb3ZpZGluZyBPKDEpIGxvb2t1cCB0aW1lIGJlY2F1c2UgaXQgaXMgYnVpbHQgb24gU2V0XHJcbmNsYXNzIFBoYXNlQ2FsbGJhY2tTZXRzIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgdW5kZWZlclNldCA9IG5ldyBTZXQ8UGhhc2VDYWxsYmFjaz4oKTtcclxuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZ5U2V0ID0gbmV3IFNldDxQaGFzZUNhbGxiYWNrPigpO1xyXG5cclxuICBwdWJsaWMgZ2V0IHNpemUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnVuZGVmZXJTZXQuc2l6ZSArIHRoaXMubm90aWZ5U2V0LnNpemU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZm9yRWFjaCggY2FsbGJhY2s6ICggcGhhc2VDYWxsYmFjazogUGhhc2VDYWxsYmFjayApID0+IG51bWJlciApOiB2b2lkIHtcclxuICAgIHRoaXMudW5kZWZlclNldC5mb3JFYWNoKCBjYWxsYmFjayApO1xyXG4gICAgdGhpcy5ub3RpZnlTZXQuZm9yRWFjaCggY2FsbGJhY2sgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRVbmRlZmVyUGhhc2VDYWxsYmFjayggcGhhc2VDYWxsYmFjazogUGhhc2VDYWxsYmFjayApOiB2b2lkIHtcclxuICAgIHRoaXMudW5kZWZlclNldC5hZGQoIHBoYXNlQ2FsbGJhY2sgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGROb3RpZnlQaGFzZUNhbGxiYWNrKCBwaGFzZUNhbGxiYWNrOiBQaGFzZUNhbGxiYWNrICk6IHZvaWQge1xyXG4gICAgdGhpcy5ub3RpZnlTZXQuYWRkKCBwaGFzZUNhbGxiYWNrICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0U2V0RnJvbVBoYXNlKCBwaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlICk6IFNldDxQaGFzZUNhbGxiYWNrPiB7XHJcbiAgICByZXR1cm4gcGhhc2UgPT09IFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlkgPyB0aGlzLm5vdGlmeVNldCA6IHRoaXMudW5kZWZlclNldDtcclxuICB9XHJcbn1cclxuXHJcbmF4b24ucmVnaXN0ZXIoICdQcm9wZXJ0eVN0YXRlSGFuZGxlcicsIFByb3BlcnR5U3RhdGVIYW5kbGVyICk7XHJcbmV4cG9ydCBkZWZhdWx0IFByb3BlcnR5U3RhdGVIYW5kbGVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxNQUFNLE1BQU0sMkJBQTJCO0FBRTlDLE9BQU9DLElBQUksTUFBTSxXQUFXO0FBQzVCLE9BQU9DLGtCQUFrQixNQUFNLHlCQUF5QjtBQUN4RCxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFlcEQsTUFBTUMsb0JBQW9CLENBQUM7RUFPakJDLFdBQVcsR0FBRyxLQUFLO0VBRXBCQyxXQUFXQSxDQUFBLEVBQUc7SUFFbkI7SUFDQTtJQUNBO0lBQ0EsSUFBSSxDQUFDQyxpQkFBaUIsR0FBRyxJQUFJQyxpQkFBaUIsQ0FBQyxDQUFDOztJQUVoRDtJQUNBO0lBQ0EsSUFBSSxDQUFDQywyQkFBMkIsR0FBRyxJQUFJQyxzQkFBc0IsQ0FBRVIsa0JBQWtCLENBQUNTLE9BQU8sRUFBRVQsa0JB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