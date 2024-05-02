// Copyright 2017-2024, University of Colorado Boulder

/**
 * Base type that provides PhET-iO features. An instrumented PhetioObject is referred to on the wrapper side/design side
 * as a "PhET-iO Element".  Note that sims may have hundreds or thousands of PhetioObjects, so performance and memory
 * considerations are important.  For this reason, initializePhetioObject is only called in PhET-iO brand, which means
 * many of the getters such as `phetioState` and `phetioDocumentation` will not work in other brands. We have opted
 * to have these getters throw assertion errors in other brands to help identify problems if these are called
 * unexpectedly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import animationFrameTimer from '../../axon/js/animationFrameTimer.js';
import validate from '../../axon/js/validate.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import EventType from './EventType.js';
import LinkedElementIO from './LinkedElementIO.js';
import phetioAPIValidation from './phetioAPIValidation.js';
import Tandem from './Tandem.js';
import TandemConstants from './TandemConstants.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import Disposable from '../../axon/js/Disposable.js';
import DescriptionRegistry from './DescriptionRegistry.js';

// constants
const PHET_IO_ENABLED = Tandem.PHET_IO_ENABLED;
const IO_TYPE_VALIDATOR = {
  valueType: IOType,
  validationMessage: 'phetioType must be an IOType'
};
const BOOLEAN_VALIDATOR = {
  valueType: 'boolean'
};

// use "<br>" instead of newlines
const PHET_IO_DOCUMENTATION_VALIDATOR = {
  valueType: 'string',
  isValidValue: doc => !doc.includes('\n'),
  validationMessage: 'phetioDocumentation must be provided in the right format'
};
const PHET_IO_EVENT_TYPE_VALIDATOR = {
  valueType: EventType,
  validationMessage: 'invalid phetioEventType'
};
const OBJECT_VALIDATOR = {
  valueType: [Object, null]
};
const objectToPhetioID = phetioObject => phetioObject.tandem.phetioID;
// When an event is suppressed from the data stream, we keep track of it with this token.
const SKIPPING_MESSAGE = -1;
const ENABLE_DESCRIPTION_REGISTRY = !!window.phet?.chipper?.queryParameters?.supportsDescriptionPlugin;
const DEFAULTS = {
  // Subtypes can use `Tandem.REQUIRED` to require a named tandem passed in
  tandem: Tandem.OPTIONAL,
  // Defines description-specific tandems that do NOT affect the phet-io system.
  descriptionTandem: Tandem.OPTIONAL,
  // Defines API methods, events and serialization
  phetioType: IOType.ObjectIO,
  // Useful notes about an instrumented PhetioObject, shown in the PhET-iO Studio Wrapper. It's an html
  // string, so "<br>" tags are required instead of "\n" characters for proper rendering in Studio
  phetioDocumentation: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDocumentation,
  // When true, includes the PhetioObject in the PhET-iO state (not automatically recursive, must be specified for
  // children explicitly)
  phetioState: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioState,
  // This option controls how PhET-iO wrappers can interface with this PhetioObject. Predominately this occurs via
  // public methods defined on this PhetioObject's phetioType, in which some method are not executable when this flag
  // is true. See `ObjectIO.methods` for further documentation, especially regarding `invocableForReadOnlyElements`.
  // NOTE: PhetioObjects with {phetioState: true} AND {phetioReadOnly: true} are restored during via setState.
  phetioReadOnly: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioReadOnly,
  // Category of event type, can be overridden in phetioStartEvent options.  Cannot be supplied through TandemConstants because
  // that would create an import loop
  phetioEventType: EventType.MODEL,
  // High frequency events such as mouse moves can be omitted from data stream, see ?phetioEmitHighFrequencyEvents
  // and PhetioClient.launchSimulation option
  // @deprecated - see https://github.com/phetsims/phet-io/issues/1629#issuecomment-608002410
  phetioHighFrequency: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioHighFrequency,
  // When true, emits events for data streams for playback, see handlePlaybackEvent.js
  phetioPlayback: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioPlayback,
  // When true, this is categorized as an important "featured" element in Studio.
  phetioFeatured: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioFeatured,
  // indicates that an object may or may not have been created. Applies recursively automatically
  // and should only be set manually on the root dynamic element. Dynamic archetypes will have this overwritten to
  // false even if explicitly provided as true, as archetypes cannot be dynamic.
  phetioDynamicElement: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDynamicElement,
  // Marking phetioDesigned: true opts-in to API change detection tooling that can be used to catch inadvertent
  // changes to a designed API.  A phetioDesigned:true PhetioObject (or any of its tandem descendants) will throw
  // assertion errors on CT (or when running with ?phetioCompareAPI) when the following are true:
  // (a) its package.json lists compareDesignedAPIChanges:true in the "phet-io" section
  // (b) the simulation is listed in perennial/data/phet-io-api-stable
  // (c) any of its metadata values deviate from the reference API
  phetioDesigned: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDesigned,
  // delivered with each event, if specified. phetioPlayback is appended here, if true.
  // Note: unlike other options, this option can be mutated downstream, and hence should be created newly for each instance.
  phetioEventMetadata: null,
  // null means no constraint on tandem name.
  tandemNameSuffix: null
};

// If you run into a type error here, feel free to add any type that is supported by the browsers "structured cloning algorithm" https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

assert && assert(EventType.phetioType.toStateObject(DEFAULTS.phetioEventType) === TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioEventType, 'phetioEventType must have the same default as the default metadata values.');

// Options for creating a PhetioObject

// A type that is used for the structural typing when gathering metadata. We just need a "PhetioObject-like" entity
// to pull the API metadata from. Thus, this is the "input" to logic that would pull the metadata keys into an object
// for the PhetioAPI.
// eslint-disable-next-line phet-io-object-options-should-not-pick-from-phet-io-object

class PhetioObject extends Disposable {
  // assigned in initializePhetioObject - see docs at DEFAULTS declaration

  // track whether the object has been initialized.  This is necessary because initialization can happen in the
  // constructor or in a subsequent call to initializePhetioObject (to support scenery Node)

  // See documentation in DEFAULTS

  // Public only for PhetioObjectMetadataInput

  static DEFAULT_OPTIONS = DEFAULTS;
  constructor(options) {
    super();
    this.tandem = DEFAULTS.tandem;
    this.phetioID = this.tandem.phetioID;
    this.phetioObjectInitialized = false;
    if (options) {
      this.initializePhetioObject({}, options);
    }
  }

  /**
   * Like SCENERY/Node, PhetioObject can be configured during construction or later with a mutate call.
   * Noop if provided options keys don't intersect with any key in DEFAULTS; baseOptions are ignored for this calculation.
   */
  initializePhetioObject(baseOptions, providedOptions) {
    assert && assert(!baseOptions.hasOwnProperty('isDisposable'), 'baseOptions should not contain isDisposable');
    this.initializeDisposable(providedOptions);
    assert && assert(providedOptions, 'initializePhetioObject must be called with providedOptions');

    // call before we exit early to support logging unsupplied Tandems.
    providedOptions.tandem && Tandem.onMissingTandem(providedOptions.tandem);

    // Make sure that required tandems are supplied
    if (assert && Tandem.VALIDATION && providedOptions.tandem && providedOptions.tandem.required) {
      assert(providedOptions.tandem.supplied, 'required tandems must be supplied');
    }
    if (ENABLE_DESCRIPTION_REGISTRY && providedOptions.tandem && providedOptions.tandem.supplied) {
      DescriptionRegistry.add(providedOptions.tandem, this);
    }

    // The presence of `tandem` indicates if this PhetioObject can be initialized. If not yet initialized, perhaps
    // it will be initialized later on, as in Node.mutate().
    if (!(PHET_IO_ENABLED && providedOptions.tandem && providedOptions.tandem.supplied)) {
      // In this case, the PhetioObject is not initialized, but still set tandem to maintain a consistent API for
      // creating the Tandem tree.
      if (providedOptions.tandem) {
        this.tandem = providedOptions.tandem;
        this.phetioID = this.tandem.phetioID;
      }
      return;
    }
    assert && assert(!this.phetioObjectInitialized, 'cannot initialize twice');

    // Guard validation on assert to avoid calling a large number of no-ops when assertions are disabled, see https://github.com/phetsims/tandem/issues/200
    assert && validate(providedOptions.tandem, {
      valueType: Tandem
    });
    const defaults = combineOptions({}, DEFAULTS, baseOptions);
    let options = optionize()(defaults, providedOptions);

    // validate options before assigning to properties
    assert && validate(options.phetioType, IO_TYPE_VALIDATOR);
    assert && validate(options.phetioState, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioState must be a boolean'
    }));
    assert && validate(options.phetioReadOnly, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioReadOnly must be a boolean'
    }));
    assert && validate(options.phetioEventType, PHET_IO_EVENT_TYPE_VALIDATOR);
    assert && validate(options.phetioDocumentation, PHET_IO_DOCUMENTATION_VALIDATOR);
    assert && validate(options.phetioHighFrequency, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioHighFrequency must be a boolean'
    }));
    assert && validate(options.phetioPlayback, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioPlayback must be a boolean'
    }));
    assert && validate(options.phetioFeatured, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioFeatured must be a boolean'
    }));
    assert && validate(options.phetioEventMetadata, merge({}, OBJECT_VALIDATOR, {
      validationMessage: 'object literal expected'
    }));
    assert && validate(options.phetioDynamicElement, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioDynamicElement must be a boolean'
    }));
    assert && validate(options.phetioDesigned, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioDesigned must be a boolean'
    }));
    assert && assert(this.linkedElements !== null, 'this means addLinkedElement was called before instrumentation of this PhetioObject');

    // optional - Indicates that an object is a archetype for a dynamic class. Settable only by
    // PhetioEngine and by classes that create dynamic elements when creating their archetype (like PhetioGroup) through
    // PhetioObject.markDynamicElementArchetype().
    // if true, items will be excluded from phetioState. This applies recursively automatically.
    this.phetioIsArchetype = false;

    // (phetioEngine)
    // Store the full baseline for usage in validation or for usage in studio.  Do this before applying overrides. The
    // baseline is created when a sim is run with assertions to assist in phetioAPIValidation.  However, even when
    // assertions are disabled, some wrappers such as studio need to generate the baseline anyway.
    // not all metadata are passed through via options, so store baseline for these additional properties
    this.phetioBaselineMetadata = phetioAPIValidation.enabled || phet.preloads.phetio.queryParameters.phetioEmitAPIBaseline ? this.getMetadata(merge({
      phetioIsArchetype: this.phetioIsArchetype,
      phetioArchetypePhetioID: this.phetioArchetypePhetioID
    }, options)) : null;

    // Dynamic elements should compare to their "archetypal" counterparts.  For example, this means that a Particle
    // in a PhetioGroup will take its overrides from the PhetioGroup archetype.
    const archetypalPhetioID = options.tandem.getArchetypalPhetioID();

    // Overrides are only defined for simulations, not for unit tests.  See https://github.com/phetsims/phet-io/issues/1461
    // Patch in the desired values from overrides, if any.
    if (window.phet.preloads.phetio.phetioElementsOverrides) {
      const overrides = window.phet.preloads.phetio.phetioElementsOverrides[archetypalPhetioID];
      if (overrides) {
        // No need to make a new object, since this "options" variable was created in the previous merge call above.
        options = optionize()(options, overrides);
      }
    }

    // (read-only) see docs at DEFAULTS declaration
    this.tandem = options.tandem;
    this.phetioID = this.tandem.phetioID;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioType = options.phetioType;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioState = options.phetioState;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioReadOnly = options.phetioReadOnly;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioDocumentation = options.phetioDocumentation;

    // see docs at DEFAULTS declaration
    this._phetioEventType = options.phetioEventType;

    // see docs at DEFAULTS declaration
    this._phetioHighFrequency = options.phetioHighFrequency;

    // see docs at DEFAULTS declaration
    this._phetioPlayback = options.phetioPlayback;

    // (PhetioEngine) see docs at DEFAULTS declaration - in order to recursively pass this value to
    // children, the setPhetioDynamicElement() function must be used instead of setting this attribute directly
    this._phetioDynamicElement = options.phetioDynamicElement;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioFeatured = options.phetioFeatured;
    this._phetioEventMetadata = options.phetioEventMetadata;
    this._phetioDesigned = options.phetioDesigned;

    // for phetioDynamicElements, the corresponding phetioID for the element in the archetype subtree
    this.phetioArchetypePhetioID = null;

    //keep track of LinkedElements for disposal. Null out to support asserting on
    // edge error cases, see this.addLinkedElement()
    this.linkedElements = [];

    // (phet-io) set to true when this PhetioObject has been sent over to the parent.
    this.phetioNotifiedObjectCreated = false;

    // tracks the indices of started messages so that dataStream can check that ends match starts.
    this.phetioMessageStack = [];

    // Make sure playback shows in the phetioEventMetadata
    if (this._phetioPlayback) {
      this._phetioEventMetadata = this._phetioEventMetadata || {};
      assert && assert(!this._phetioEventMetadata.hasOwnProperty('playback'), 'phetioEventMetadata.playback should not already exist');
      this._phetioEventMetadata.playback = true;
    }

    // Alert that this PhetioObject is ready for cross-frame communication (thus becoming a "PhET-iO Element" on the wrapper side.
    this.tandem.addPhetioObject(this);
    this.phetioObjectInitialized = true;
    if (assert && Tandem.VALIDATION && this.isPhetioInstrumented() && options.tandemNameSuffix) {
      const suffixArray = Array.isArray(options.tandemNameSuffix) ? options.tandemNameSuffix : [options.tandemNameSuffix];
      const matches = suffixArray.filter(suffix => {
        return this.tandem.name.endsWith(suffix) || this.tandem.name.endsWith(PhetioObject.swapCaseOfFirstCharacter(suffix));
      });
      assert && assert(matches.length > 0, 'Incorrect Tandem suffix, expected = ' + suffixArray.join(', ') + '. actual = ' + this.tandem.phetioID);
    }
  }
  static swapCaseOfFirstCharacter(string) {
    const firstChar = string[0];
    const newFirstChar = firstChar === firstChar.toLowerCase() ? firstChar.toUpperCase() : firstChar.toLowerCase();
    return newFirstChar + string.substring(1);
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioType() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioType only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioType;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioState() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioState only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioState;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioReadOnly() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioReadOnly only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioReadOnly;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDocumentation() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDocumentation only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDocumentation;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioEventType() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioEventType only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioEventType;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioHighFrequency() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioHighFrequency only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioHighFrequency;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioPlayback() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioPlayback only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioPlayback;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDynamicElement() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDynamicElement only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDynamicElement;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioFeatured() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioFeatured only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioFeatured;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioEventMetadata() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioEventMetadata only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioEventMetadata;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDesigned() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDesigned only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDesigned;
  }

  /**
   * Start an event for the nested PhET-iO data stream.
   *
   * @param event - the name of the event
   * @param [providedOptions]
   */
  phetioStartEvent(event, providedOptions) {
    if (PHET_IO_ENABLED && this.isPhetioInstrumented()) {
      // only one or the other can be provided
      assert && assertMutuallyExclusiveOptions(providedOptions, ['data'], ['getData']);
      const options = optionize()({
        data: null,
        // function that, when called gets the data.
        getData: null
      }, providedOptions);
      assert && assert(this.phetioObjectInitialized, 'phetioObject should be initialized');
      assert && options.data && assert(typeof options.data === 'object');
      assert && options.getData && assert(typeof options.getData === 'function');
      assert && assert(arguments.length === 1 || arguments.length === 2, 'Prevent usage of incorrect signature');

      // TODO: don't drop PhET-iO events if they are created before we have a dataStream global. https://github.com/phetsims/phet-io/issues/1875
      if (!_.hasIn(window, 'phet.phetio.dataStream')) {
        // If you hit this, then it is likely related to https://github.com/phetsims/scenery/issues/1124 and we would like to know about it!
        // assert && assert( false, 'trying to create an event before the data stream exists' );

        this.phetioMessageStack.push(SKIPPING_MESSAGE);
        return;
      }

      // Opt out of certain events if queryParameter override is provided. Even for a low frequency data stream, high
      // frequency events can still be emitted when they have a low frequency ancestor.
      const skipHighFrequencyEvent = this.phetioHighFrequency && _.hasIn(window, 'phet.preloads.phetio.queryParameters') && !window.phet.preloads.phetio.queryParameters.phetioEmitHighFrequencyEvents && !phet.phetio.dataStream.isEmittingLowFrequencyEvent();

      // TODO: If there is no dataStream global defined, then we should handle this differently as to not drop the event that is triggered, see https://github.com/phetsims/phet-io/issues/1846
      const skipFromUndefinedDatastream = !assert && !_.hasIn(window, 'phet.phetio.dataStream');
      if (skipHighFrequencyEvent || this.phetioEventType === EventType.OPT_OUT || skipFromUndefinedDatastream) {
        this.phetioMessageStack.push(SKIPPING_MESSAGE);
        return;
      }

      // Only get the args if we are actually going to send the event.
      const data = options.getData ? options.getData() : options.data;
      this.phetioMessageStack.push(phet.phetio.dataStream.start(this.phetioEventType, this.tandem.phetioID, this.phetioType, event, data, this.phetioEventMetadata, this.phetioHighFrequency));

      // To support PhET-iO playback, any potential playback events downstream of this playback event must be marked as
      // non playback events. This is to prevent the PhET-iO playback engine from repeating those events. See
      // https://github.com/phetsims/phet-io/issues/1693
      this.phetioPlayback && phet.phetio.dataStream.pushNonPlaybackable();
    }
  }

  /**
   * End an event on the nested PhET-iO data stream. It this object was disposed or dataStream.start was not called,
   * this is a no-op.
   */
  phetioEndEvent() {
    if (PHET_IO_ENABLED && this.isPhetioInstrumented()) {
      assert && assert(this.phetioMessageStack.length > 0, 'Must have messages to pop');
      const topMessageIndex = this.phetioMessageStack.pop();

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if (topMessageIndex === SKIPPING_MESSAGE) {
        return;
      }
      this.phetioPlayback && phet.phetio.dataStream.popNonPlaybackable();
      phet.phetio.dataStream.end(topMessageIndex);
    }
  }

  /**
   * Set any instrumented descendants of this PhetioObject to the same value as this.phetioDynamicElement.
   */
  propagateDynamicFlagsToDescendants() {
    assert && assert(Tandem.PHET_IO_ENABLED, 'phet-io should be enabled');
    assert && assert(phet.phetio && phet.phetio.phetioEngine, 'Dynamic elements cannot be created statically before phetioEngine exists.');
    const phetioEngine = phet.phetio.phetioEngine;

    // in the same order as bufferedPhetioObjects
    const unlaunchedPhetioIDs = !Tandem.launched ? Tandem.bufferedPhetioObjects.map(objectToPhetioID) : [];
    this.tandem.iterateDescendants(tandem => {
      const phetioID = tandem.phetioID;
      if (phetioEngine.hasPhetioObject(phetioID) || !Tandem.launched && unlaunchedPhetioIDs.includes(phetioID)) {
        assert && assert(this.isPhetioInstrumented());
        const phetioObject = phetioEngine.hasPhetioObject(phetioID) ? phetioEngine.getPhetioElement(phetioID) : Tandem.bufferedPhetioObjects[unlaunchedPhetioIDs.indexOf(phetioID)];
        assert && assert(phetioObject, 'should have a phetioObject here');

        // Order matters here! The phetioIsArchetype needs to be first to ensure that the setPhetioDynamicElement
        // setter can opt out for archetypes.
        phetioObject.phetioIsArchetype = this.phetioIsArchetype;
        phetioObject.setPhetioDynamicElement(this.phetioDynamicElement);
        if (phetioObject.phetioBaselineMetadata) {
          phetioObject.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
        }
      }
    });
  }

  /**
   * Used in PhetioEngine
   */
  setPhetioDynamicElement(phetioDynamicElement) {
    assert && assert(!this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.');
    assert && assert(this.isPhetioInstrumented());

    // All archetypes are static (non-dynamic)
    this._phetioDynamicElement = this.phetioIsArchetype ? false : phetioDynamicElement;

    // For dynamic elements, indicate the corresponding archetype element so that clients like Studio can leverage
    // the archetype metadata. Static elements don't have archetypes.
    this.phetioArchetypePhetioID = phetioDynamicElement ? this.tandem.getArchetypalPhetioID() : null;

    // Keep the baseline metadata in sync.
    if (this.phetioBaselineMetadata) {
      this.phetioBaselineMetadata.phetioDynamicElement = this.phetioDynamicElement;
    }
  }

  /**
   * Mark this PhetioObject as an archetype for dynamic elements.
   */
  markDynamicElementArchetype() {
    assert && assert(!this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.');
    this.phetioIsArchetype = true;
    this.setPhetioDynamicElement(false); // because archetypes aren't dynamic elements

    if (this.phetioBaselineMetadata) {
      this.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
    }

    // recompute for children also, but only if phet-io is enabled
    Tandem.PHET_IO_ENABLED && this.propagateDynamicFlagsToDescendants();
  }

  /**
   * A PhetioObject will only be instrumented if the tandem that was passed in was "supplied". See Tandem.supplied
   * for more info.
   */
  isPhetioInstrumented() {
    return this.tandem && this.tandem.supplied;
  }

  /**
   * When an instrumented PhetioObject is linked with another instrumented PhetioObject, this creates a one-way
   * association which is rendered in Studio as a "symbolic" link or hyperlink. Many common code UI elements use this
   * automatically. To keep client sites simple, this has a graceful opt-out mechanism which makes this function a
   * no-op if either this PhetioObject or the target PhetioObject is not instrumented.
   *
   * You can specify the tandem one of three ways:
   * 1. Without specifying tandemName or tandem, it will pluck the tandem.name from the target element
   * 2. If tandemName is specified in the options, it will use that tandem name and nest the tandem under this PhetioObject's tandem
   * 3. If tandem is specified in the options (not recommended), it will use that tandem and nest it anywhere that tandem exists.
   *    Use this option with caution since it allows you to nest the tandem anywhere in the tree.
   *
   * @param element - the target element. Must be instrumented for a LinkedElement to be created-- otherwise gracefully opts out
   * @param [providedOptions]
   */
  addLinkedElement(element, providedOptions) {
    if (!this.isPhetioInstrumented()) {
      // set this to null so that you can't addLinkedElement on an uninitialized PhetioObject and then instrument
      // it afterward.
      this.linkedElements = null;
      return;
    }

    // In some cases, UI components need to be wired up to a private (internal) Property which should neither be
    // instrumented nor linked.
    if (PHET_IO_ENABLED && element.isPhetioInstrumented()) {
      const options = optionize()({
        // The linkage is only featured if the parent and the element are both also featured
        phetioFeatured: this.phetioFeatured && element.phetioFeatured
      }, providedOptions);
      assert && assert(Array.isArray(this.linkedElements), 'linkedElements should be an array');
      let tandem = null;
      if (providedOptions && providedOptions.tandem) {
        tandem = providedOptions.tandem;
      } else if (providedOptions && providedOptions.tandemName) {
        tandem = this.tandem.createTandem(providedOptions.tandemName);
      } else if (!providedOptions && element.tandem) {
        tandem = this.tandem.createTandem(element.tandem.name);
      }
      if (tandem) {
        options.tandem = tandem;
      }
      this.linkedElements.push(new LinkedElement(element, options));
    }
  }

  /**
   * Remove all linked elements linking to the provided PhetioObject. This will dispose all removed LinkedElements. This
   * will be graceful, and doesn't assume or assert that the provided PhetioObject has LinkedElement(s), it will just
   * remove them if they are there.
   */
  removeLinkedElements(potentiallyLinkedElement) {
    if (this.isPhetioInstrumented() && this.linkedElements) {
      assert && assert(potentiallyLinkedElement.isPhetioInstrumented());
      const toRemove = this.linkedElements.filter(linkedElement => linkedElement.element === potentiallyLinkedElement);
      toRemove.forEach(linkedElement => {
        linkedElement.dispose();
        arrayRemove(this.linkedElements, linkedElement);
      });
    }
  }

  /**
   * Performs cleanup after the sim's construction has finished.
   */
  onSimulationConstructionCompleted() {
    // deletes the phetioBaselineMetadata, as it's no longer needed since validation is complete.
    this.phetioBaselineMetadata = null;
  }

  /**
   * Overrideable so that subclasses can return a different PhetioObject for studio autoselect. This method is called
   * when there is a scene graph hit. Return the corresponding target that matches the PhET-iO filters.  Note this means
   * that if PhET-iO Studio is looking for a featured item and this is not featured, it will return 'phetioNotSelectable'.
   * Something is 'phetioNotSelectable' if it is not instrumented or if it does not match the "featured" filtering.
   *
   * The `fromLinking` flag allows a cutoff to prevent recursive linking chains in 'linked' mode. Given these linked elements:
   * cardNode -> card -> cardValueProperty
   * We don't want 'linked' mode to map from cardNode all the way to cardValueProperty (at least automatically), see https://github.com/phetsims/tandem/issues/300
   */
  getPhetioMouseHitTarget(fromLinking = false) {
    assert && assert(phet.tandem.phetioElementSelectionProperty.value !== 'none', 'getPhetioMouseHitTarget should not be called when phetioElementSelectionProperty is none');

    // Don't get a linked element for a linked element (recursive link element searching)
    if (!fromLinking && phet.tandem.phetioElementSelectionProperty.value === 'linked') {
      const linkedElement = this.getCorrespondingLinkedElement();
      if (linkedElement !== 'noCorrespondingLinkedElement') {
        return linkedElement.getPhetioMouseHitTarget(true);
      } else if (this.tandem.parentTandem) {
        // Look for a sibling linkedElement if there are no child linkages, see https://github.com/phetsims/studio/issues/246#issuecomment-1018733408

        const parent = phet.phetio.phetioEngine.phetioElementMap[this.tandem.parentTandem.phetioID];
        if (parent) {
          const linkedParentElement = parent.getCorrespondingLinkedElement();
          if (linkedParentElement !== 'noCorrespondingLinkedElement') {
            return linkedParentElement.getPhetioMouseHitTarget(true);
          }
        }
      }

      // Otherwise fall back to the view element, don't return here
    }
    if (phet.tandem.phetioElementSelectionProperty.value === 'string') {
      return 'phetioNotSelectable';
    }
    return this.getPhetioMouseHitTargetSelf();
  }

  /**
   * Determine if this instance should be selectable
   */
  getPhetioMouseHitTargetSelf() {
    return this.isPhetioMouseHitSelectable() ? this : 'phetioNotSelectable';
  }

  /**
   * Factored out function returning if this instance is phetio selectable
   */
  isPhetioMouseHitSelectable() {
    // We are not selectable if we are unfeatured and we are only displaying featured elements.
    // To prevent a circular dependency. We need to have a Property (which is a PhetioObject) in order to use it.
    // This should remain a hard failure if we have not loaded this display Property by the time we want a mouse-hit target.
    const featuredFilterCorrect = phet.tandem.phetioElementsDisplayProperty.value !== 'featured' || this.isDisplayedInFeaturedTree();
    return this.isPhetioInstrumented() && featuredFilterCorrect;
  }

  /**
   * This function determines not only if this PhetioObject is phetioFeatured, but if any descendant of this
   * PhetioObject is phetioFeatured, this will influence if this instance is displayed while showing phetioFeatured,
   * since featured children will cause the parent to be displayed as well.
   */
  isDisplayedInFeaturedTree() {
    if (this.isPhetioInstrumented() && this.phetioFeatured) {
      return true;
    }
    let displayed = false;
    this.tandem.iterateDescendants(descendantTandem => {
      const parent = phet.phetio.phetioEngine.phetioElementMap[descendantTandem.phetioID];
      if (parent && parent.isPhetioInstrumented() && parent.phetioFeatured) {
        displayed = true;
      }
    });
    return displayed;
  }

  /**
   * Acquire the linkedElement that most closely relates to this PhetioObject, given some heuristics. First, if there is
   * only a single LinkedElement child, use that. Otherwise, select hard coded names that are likely to be most important.
   */
  getCorrespondingLinkedElement() {
    const children = Object.keys(this.tandem.children);
    const linkedChildren = [];
    children.forEach(childName => {
      const childPhetioID = phetio.PhetioIDUtils.append(this.tandem.phetioID, childName);

      // Note that if it doesn't find a phetioID, that may be a synthetic node with children but not itself instrumented.
      const phetioObject = phet.phetio.phetioEngine.phetioElementMap[childPhetioID];
      if (phetioObject instanceof LinkedElement) {
        linkedChildren.push(phetioObject);
      }
    });
    const linkedTandemNames = linkedChildren.map(linkedElement => {
      return phetio.PhetioIDUtils.getComponentName(linkedElement.phetioID);
    });
    let linkedChild = null;
    if (linkedChildren.length === 1) {
      linkedChild = linkedChildren[0];
    } else if (linkedTandemNames.includes('property')) {
      // Prioritize a linked child named "property"
      linkedChild = linkedChildren[linkedTandemNames.indexOf('property')];
    } else if (linkedTandemNames.includes('valueProperty')) {
      // Next prioritize "valueProperty", a common name for the controlling Property of a view component
      linkedChild = linkedChildren[linkedTandemNames.indexOf('valueProperty')];
    } else {
      // Either there are no linked children, or too many to know which one to select.
      return 'noCorrespondingLinkedElement';
    }
    assert && assert(linkedChild, 'phetioElement is needed');
    return linkedChild.element;
  }

  /**
   * Remove this phetioObject from PhET-iO. After disposal, this object is no longer interoperable. Also release any
   * other references created during its lifetime.
   *
   * In order to support the structured data stream, PhetioObjects must end the messages in the correct
   * sequence, without being interrupted by dispose() calls.  Therefore, we do not clear out any of the state
   * related to the endEvent.  Note this means it is acceptable (and expected) for endEvent() to be called on
   * disposed PhetioObjects.
   */
  dispose() {
    // The phetioEvent stack should resolve by the next frame, so that's when we check it.
    if (assert && Tandem.PHET_IO_ENABLED && this.tandem.supplied) {
      const descendants = [];
      this.tandem.iterateDescendants(tandem => {
        if (phet.phetio.phetioEngine.hasPhetioObject(tandem.phetioID)) {
          descendants.push(phet.phetio.phetioEngine.getPhetioElement(tandem.phetioID));
        }
      });
      animationFrameTimer.runOnNextTick(() => {
        // Uninstrumented PhetioObjects don't have a phetioMessageStack attribute.
        assert && assert(!this.hasOwnProperty('phetioMessageStack') || this.phetioMessageStack.length === 0, 'phetioMessageStack should be clear');
        descendants.forEach(descendant => {
          assert && assert(descendant.isDisposed, `All descendants must be disposed by the next frame: ${descendant.tandem.phetioID}`);
        });
      });
    }
    if (ENABLE_DESCRIPTION_REGISTRY && this.tandem && this.tandem.supplied) {
      DescriptionRegistry.remove(this);
    }

    // Detach from listeners and dispose the corresponding tandem. This must happen in PhET-iO brand and PhET brand
    // because in PhET brand, PhetioDynamicElementContainer dynamic elements would memory leak tandems (parent tandems
    // would retain references to their children).
    this.tandem.removePhetioObject(this);

    // Dispose LinkedElements
    if (this.linkedElements) {
      this.linkedElements.forEach(linkedElement => linkedElement.dispose());
      this.linkedElements.length = 0;
    }
    super.dispose();
  }

  /**
   * JSONifiable metadata that describes the nature of the PhetioObject.  We must be able to read this
   * for baseline (before object fully constructed we use object) and after fully constructed
   * which includes overrides.
   * @param [object] - used to get metadata keys, can be a PhetioObject, or an options object
   *                          (see usage initializePhetioObject). If not provided, will instead use the value of "this"
   * @returns - metadata plucked from the passed in parameter
   */
  getMetadata(object) {
    object = object || this;
    const metadata = {
      phetioTypeName: object.phetioType.typeName,
      phetioDocumentation: object.phetioDocumentation,
      phetioState: object.phetioState,
      phetioReadOnly: object.phetioReadOnly,
      phetioEventType: EventType.phetioType.toStateObject(object.phetioEventType),
      phetioHighFrequency: object.phetioHighFrequency,
      phetioPlayback: object.phetioPlayback,
      phetioDynamicElement: object.phetioDynamicElement,
      phetioIsArchetype: object.phetioIsArchetype,
      phetioFeatured: object.phetioFeatured,
      phetioDesigned: object.phetioDesigned
    };
    if (object.phetioArchetypePhetioID) {
      metadata.phetioArchetypePhetioID = object.phetioArchetypePhetioID;
    }
    return metadata;
  }

  // Public facing documentation, no need to include metadata that may we don't want clients knowing about
  static METADATA_DOCUMENTATION = 'Get metadata about the PhET-iO Element. This includes the following keys:<ul>' + '<li><strong>phetioTypeName:</strong> The name of the PhET-iO Type\n</li>' + '<li><strong>phetioDocumentation:</strong> default - null. Useful notes about a PhET-iO Element, shown in the PhET-iO Studio Wrapper</li>' + '<li><strong>phetioState:</strong> default - true. When true, includes the PhET-iO Element in the PhET-iO state\n</li>' + '<li><strong>phetioReadOnly:</strong> default - false. When true, you can only get values from the PhET-iO Element; no setting allowed.\n</li>' + '<li><strong>phetioEventType:</strong> default - MODEL. The category of event that this element emits to the PhET-iO Data Stream.\n</li>' + '<li><strong>phetioDynamicElement:</strong> default - false. If this element is a "dynamic element" that can be created and destroyed throughout the lifetime of the sim (as opposed to existing forever).\n</li>' + '<li><strong>phetioIsArchetype:</strong> default - false. If this element is an archetype for a dynamic element.\n</li>' + '<li><strong>phetioFeatured:</strong> default - false. If this is a featured PhET-iO Element.\n</li>' + '<li><strong>phetioArchetypePhetioID:</strong> default - \'\'. If an applicable dynamic element, this is the phetioID of its archetype.\n</li></ul>';
  static create(options) {
    return new PhetioObject(options);
  }
}

// See documentation for addLinkedElement() to describe how to instrument LinkedElements. No other metadata is needed
// for LinkedElements, and should instead be provided to the coreElement. If you find a case where you want to pass
// another option through, please discuss with your friendly, neighborhood PhET-iO developer.

/**
 * Internal class to avoid cyclic dependencies.
 */
class LinkedElement extends PhetioObject {
  constructor(coreElement, providedOptions) {
    assert && assert(!!coreElement, 'coreElement should be defined');
    const options = optionize()({
      phetioType: LinkedElementIO,
      phetioState: true,
      // By default, LinkedElements are as featured as their coreElements are.
      phetioFeatured: coreElement.phetioFeatured
    }, providedOptions);

    // References cannot be changed by PhET-iO
    assert && assert(!options.hasOwnProperty('phetioReadOnly'), 'phetioReadOnly set by LinkedElement');
    options.phetioReadOnly = true;
    super(options);
    this.element = coreElement;
  }
}
tandemNamespace.register('PhetioObject', PhetioObject);
export { PhetioObject as default, LinkedElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhbmltYXRpb25GcmFtZVRpbWVyIiwidmFsaWRhdGUiLCJhcnJheVJlbW92ZSIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIm1lcmdlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJFdmVudFR5cGUiLCJMaW5rZWRFbGVtZW50SU8iLCJwaGV0aW9BUElWYWxpZGF0aW9uIiwiVGFuZGVtIiwiVGFuZGVtQ29uc3RhbnRzIiwidGFuZGVtTmFtZXNwYWNlIiwiSU9UeXBlIiwiRGlzcG9zYWJsZSIsIkRlc2NyaXB0aW9uUmVnaXN0cnkiLCJQSEVUX0lPX0VOQUJMRUQiLCJJT19UWVBFX1ZBTElEQVRPUiIsInZhbHVlVHlwZSIsInZhbGlkYXRpb25NZXNzYWdlIiwiQk9PTEVBTl9WQUxJREFUT1IiLCJQSEVUX0lPX0RPQ1VNRU5UQVRJT05fVkFMSURBVE9SIiwiaXNWYWxpZFZhbHVlIiwiZG9jIiwiaW5jbHVkZXMiLCJQSEVUX0lPX0VWRU5UX1RZUEVfVkFMSURBVE9SIiwiT0JKRUNUX1ZBTElEQVRPUiIsIk9iamVjdCIsIm9iamVjdFRvUGhldGlvSUQiLCJwaGV0aW9PYmplY3QiLCJ0YW5kZW0iLCJwaGV0aW9JRCIsIlNLSVBQSU5HX01FU1NBR0UiLCJFTkFCTEVfREVTQ1JJUFRJT05fUkVHSVNUUlkiLCJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsInN1cHBvcnRzRGVzY3JpcHRpb25QbHVnaW4iLCJERUZBVUxUUyIsIk9QVElPTkFMIiwiZGVzY3JpcHRpb25UYW5kZW0iLCJwaGV0aW9UeXBlIiwiT2JqZWN0SU8iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiUEhFVF9JT19PQkpFQ1RfTUVUQURBVEFfREVGQVVMVFMiLCJwaGV0aW9TdGF0ZSIsInBoZXRpb1JlYWRPbmx5IiwicGhldGlvRXZlbnRUeXBlIiwiTU9ERUwiLCJwaGV0aW9IaWdoRnJlcXVlbmN5IiwicGhldGlvUGxheWJhY2siLCJwaGV0aW9GZWF0dXJlZCIsInBoZXRpb0R5bmFtaWNFbGVtZW50IiwicGhldGlvRGVzaWduZWQiLCJwaGV0aW9FdmVudE1ldGFkYXRhIiwidGFuZGVtTmFtZVN1ZmZpeCIsImFzc2VydCIsInRvU3RhdGVPYmplY3QiLCJQaGV0aW9PYmplY3QiLCJERUZBVUxUX09QVElPTlMiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJwaGV0aW9PYmplY3RJbml0aWFsaXplZCIsImluaXRpYWxpemVQaGV0aW9PYmplY3QiLCJiYXNlT3B0aW9ucyIsInByb3ZpZGVkT3B0aW9ucyIsImhhc093blByb3BlcnR5IiwiaW5pdGlhbGl6ZURpc3Bvc2FibGUiLCJvbk1pc3NpbmdUYW5kZW0iLCJWQUxJREFUSU9OIiwicmVxdWlyZWQiLCJzdXBwbGllZCIsImFkZCIsImRlZmF1bHRzIiwibGlua2VkRWxlbWVudHMiLCJwaGV0aW9Jc0FyY2hldHlwZSIsInBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEiLCJlbmFibGVkIiwicHJlbG9hZHMiLCJwaGV0aW8iLCJwaGV0aW9FbWl0QVBJQmFzZWxpbmUiLCJnZXRNZXRhZGF0YSIsInBoZXRpb0FyY2hldHlwZVBoZXRpb0lEIiwiYXJjaGV0eXBhbFBoZXRpb0lEIiwiZ2V0QXJjaGV0eXBhbFBoZXRpb0lEIiwicGhldGlvRWxlbWVudHNPdmVycmlkZXMiLCJvdmVycmlkZXMiLCJfcGhldGlvVHlwZSIsIl9waGV0aW9TdGF0ZSIsIl9waGV0aW9SZWFkT25seSIsIl9waGV0aW9Eb2N1bWVudGF0aW9uIiwiX3BoZXRpb0V2ZW50VHlwZSIsIl9waGV0aW9IaWdoRnJlcXVlbmN5IiwiX3BoZXRpb1BsYXliYWNrIiwiX3BoZXRpb0R5bmFtaWNFbGVtZW50IiwiX3BoZXRpb0ZlYXR1cmVkIiwiX3BoZXRpb0V2ZW50TWV0YWRhdGEiLCJfcGhldGlvRGVzaWduZWQiLCJwaGV0aW9Ob3RpZmllZE9iamVjdENyZWF0ZWQiLCJwaGV0aW9NZXNzYWdlU3RhY2siLCJwbGF5YmFjayIsImFkZFBoZXRpb09iamVjdCIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwic3VmZml4QXJyYXkiLCJBcnJheSIsImlzQXJyYXkiLCJtYXRjaGVzIiwiZmlsdGVyIiwic3VmZml4IiwibmFtZSIsImVuZHNXaXRoIiwic3dhcENhc2VPZkZpcnN0Q2hhcmFjdGVyIiwibGVuZ3RoIiwiam9pbiIsInN0cmluZyIsImZpcnN0Q2hhciIsIm5ld0ZpcnN0Q2hhciIsInRvTG93ZXJDYXNlIiwidG9VcHBlckNhc2UiLCJzdWJzdHJpbmciLCJwaGV0aW9TdGFydEV2ZW50IiwiZXZlbnQiLCJkYXRhIiwiZ2V0RGF0YSIsImFyZ3VtZW50cyIsIl8iLCJoYXNJbiIsInB1c2giLCJza2lwSGlnaEZyZXF1ZW5jeUV2ZW50IiwicGhldGlvRW1pdEhpZ2hGcmVxdWVuY3lFdmVudHMiLCJkYXRhU3RyZWFtIiwiaXNFbWl0dGluZ0xvd0ZyZXF1ZW5jeUV2ZW50Iiwic2tpcEZyb21VbmRlZmluZWREYXRhc3RyZWFtIiwiT1BUX09VVCIsInN0YXJ0IiwicHVzaE5vblBsYXliYWNrYWJsZSIsInBoZXRpb0VuZEV2ZW50IiwidG9wTWVzc2FnZUluZGV4IiwicG9wIiwicG9wTm9uUGxheWJhY2thYmxlIiwiZW5kIiwicHJvcGFnYXRlRHluYW1pY0ZsYWdzVG9EZXNjZW5kYW50cyIsInBoZXRpb0VuZ2luZSIsInVubGF1bmNoZWRQaGV0aW9JRHMiLCJsYXVuY2hlZCIsImJ1ZmZlcmVkUGhldGlvT2JqZWN0cyIsIm1hcCIsIml0ZXJhdGVEZXNjZW5kYW50cyIsImhhc1BoZXRpb09iamVjdCIsImdldFBoZXRpb0VsZW1lbnQiLCJpbmRleE9mIiwic2V0UGhldGlvRHluYW1pY0VsZW1lbnQiLCJtYXJrRHluYW1pY0VsZW1lbnRBcmNoZXR5cGUiLCJhZGRMaW5rZWRFbGVtZW50IiwiZWxlbWVudCIsInRhbmRlbU5hbWUiLCJjcmVhdGVUYW5kZW0iLCJMaW5rZWRFbGVtZW50IiwicmVtb3ZlTGlua2VkRWxlbWVudHMiLCJwb3RlbnRpYWxseUxpbmtlZEVsZW1lbnQiLCJ0b1JlbW92ZSIsImxpbmtlZEVsZW1lbnQiLCJmb3JFYWNoIiwiZGlzcG9zZSIsIm9uU2ltdWxhdGlvbkNvbnN0cnVjdGlvbkNvbXBsZXRlZCIsImdldFBoZXRpb01vdXNlSGl0VGFyZ2V0IiwiZnJvbUxpbmtpbmciLCJwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkiLCJ2YWx1ZSIsImdldENvcnJlc3BvbmRpbmdMaW5rZWRFbGVtZW50IiwicGFyZW50VGFuZGVtIiwicGFyZW50IiwicGhldGlvRWxlbWVudE1hcCIsImxpbmtlZFBhcmVudEVsZW1lbnQiLCJnZXRQaGV0aW9Nb3VzZUhpdFRhcmdldFNlbGYiLCJpc1BoZXRpb01vdXNlSGl0U2VsZWN0YWJsZSIsImZlYXR1cmVkRmlsdGVyQ29ycmVjdCIsInBoZXRpb0VsZW1lbnRzRGlzcGxheVByb3BlcnR5IiwiaXNEaXNwbGF5ZWRJbkZlYXR1cmVkVHJlZSIsImRpc3BsYXllZCIsImRlc2NlbmRhbnRUYW5kZW0iLCJjaGlsZHJlbiIsImtleXMiLCJsaW5rZWRDaGlsZHJlbiIsImNoaWxkTmFtZSIsImNoaWxkUGhldGlvSUQiLCJQaGV0aW9JRFV0aWxzIiwiYXBwZW5kIiwibGlua2VkVGFuZGVtTmFtZXMiLCJnZXRDb21wb25lbnROYW1lIiwibGlua2VkQ2hpbGQiLCJkZXNjZW5kYW50cyIsInJ1bk9uTmV4dFRpY2siLCJkZXNjZW5kYW50IiwiaXNEaXNwb3NlZCIsInJlbW92ZSIsInJlbW92ZVBoZXRpb09iamVjdCIsIm9iamVjdCIsIm1ldGFkYXRhIiwicGhldGlvVHlwZU5hbWUiLCJ0eXBlTmFtZSIsIk1FVEFEQVRBX0RPQ1VNRU5UQVRJT04iLCJjcmVhdGUiLCJjb3JlRWxlbWVudCIsInJlZ2lzdGVyIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIlBoZXRpb09iamVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBCYXNlIHR5cGUgdGhhdCBwcm92aWRlcyBQaEVULWlPIGZlYXR1cmVzLiBBbiBpbnN0cnVtZW50ZWQgUGhldGlvT2JqZWN0IGlzIHJlZmVycmVkIHRvIG9uIHRoZSB3cmFwcGVyIHNpZGUvZGVzaWduIHNpZGVcclxuICogYXMgYSBcIlBoRVQtaU8gRWxlbWVudFwiLiAgTm90ZSB0aGF0IHNpbXMgbWF5IGhhdmUgaHVuZHJlZHMgb3IgdGhvdXNhbmRzIG9mIFBoZXRpb09iamVjdHMsIHNvIHBlcmZvcm1hbmNlIGFuZCBtZW1vcnlcclxuICogY29uc2lkZXJhdGlvbnMgYXJlIGltcG9ydGFudC4gIEZvciB0aGlzIHJlYXNvbiwgaW5pdGlhbGl6ZVBoZXRpb09iamVjdCBpcyBvbmx5IGNhbGxlZCBpbiBQaEVULWlPIGJyYW5kLCB3aGljaCBtZWFuc1xyXG4gKiBtYW55IG9mIHRoZSBnZXR0ZXJzIHN1Y2ggYXMgYHBoZXRpb1N0YXRlYCBhbmQgYHBoZXRpb0RvY3VtZW50YXRpb25gIHdpbGwgbm90IHdvcmsgaW4gb3RoZXIgYnJhbmRzLiBXZSBoYXZlIG9wdGVkXHJcbiAqIHRvIGhhdmUgdGhlc2UgZ2V0dGVycyB0aHJvdyBhc3NlcnRpb24gZXJyb3JzIGluIG90aGVyIGJyYW5kcyB0byBoZWxwIGlkZW50aWZ5IHByb2JsZW1zIGlmIHRoZXNlIGFyZSBjYWxsZWRcclxuICogdW5leHBlY3RlZGx5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGFuaW1hdGlvbkZyYW1lVGltZXIgZnJvbSAnLi4vLi4vYXhvbi9qcy9hbmltYXRpb25GcmFtZVRpbWVyLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgdmFsaWRhdGUgZnJvbSAnLi4vLi4vYXhvbi9qcy92YWxpZGF0ZS5qcyc7XHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgT3B0aW9uaXplRGVmYXVsdHMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IEV2ZW50VHlwZSBmcm9tICcuL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBMaW5rZWRFbGVtZW50SU8gZnJvbSAnLi9MaW5rZWRFbGVtZW50SU8uanMnO1xyXG5pbXBvcnQgcGhldGlvQVBJVmFsaWRhdGlvbiBmcm9tICcuL3BoZXRpb0FQSVZhbGlkYXRpb24uanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4vVGFuZGVtLmpzJztcclxuaW1wb3J0IFRhbmRlbUNvbnN0YW50cywgeyBQaGV0aW9FbGVtZW50TWV0YWRhdGEsIFBoZXRpb0lEIH0gZnJvbSAnLi9UYW5kZW1Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgdGFuZGVtTmFtZXNwYWNlIGZyb20gJy4vdGFuZGVtTmFtZXNwYWNlLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgRGlzcG9zYWJsZSwgeyBEaXNwb3NhYmxlT3B0aW9ucyB9IGZyb20gJy4uLy4uL2F4b24vanMvRGlzcG9zYWJsZS5qcyc7XHJcbmltcG9ydCBEZXNjcmlwdGlvblJlZ2lzdHJ5IGZyb20gJy4vRGVzY3JpcHRpb25SZWdpc3RyeS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgUEhFVF9JT19FTkFCTEVEID0gVGFuZGVtLlBIRVRfSU9fRU5BQkxFRDtcclxuY29uc3QgSU9fVFlQRV9WQUxJREFUT1IgPSB7IHZhbHVlVHlwZTogSU9UeXBlLCB2YWxpZGF0aW9uTWVzc2FnZTogJ3BoZXRpb1R5cGUgbXVzdCBiZSBhbiBJT1R5cGUnIH07XHJcbmNvbnN0IEJPT0xFQU5fVkFMSURBVE9SID0geyB2YWx1ZVR5cGU6ICdib29sZWFuJyB9O1xyXG5cclxuLy8gdXNlIFwiPGJyPlwiIGluc3RlYWQgb2YgbmV3bGluZXNcclxuY29uc3QgUEhFVF9JT19ET0NVTUVOVEFUSU9OX1ZBTElEQVRPUiA9IHtcclxuICB2YWx1ZVR5cGU6ICdzdHJpbmcnLFxyXG4gIGlzVmFsaWRWYWx1ZTogKCBkb2M6IHN0cmluZyApID0+ICFkb2MuaW5jbHVkZXMoICdcXG4nICksXHJcbiAgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9Eb2N1bWVudGF0aW9uIG11c3QgYmUgcHJvdmlkZWQgaW4gdGhlIHJpZ2h0IGZvcm1hdCdcclxufTtcclxuY29uc3QgUEhFVF9JT19FVkVOVF9UWVBFX1ZBTElEQVRPUiA9IHtcclxuICB2YWx1ZVR5cGU6IEV2ZW50VHlwZSxcclxuICB2YWxpZGF0aW9uTWVzc2FnZTogJ2ludmFsaWQgcGhldGlvRXZlbnRUeXBlJ1xyXG59O1xyXG5jb25zdCBPQkpFQ1RfVkFMSURBVE9SID0geyB2YWx1ZVR5cGU6IFsgT2JqZWN0LCBudWxsIF0gfTtcclxuXHJcbmNvbnN0IG9iamVjdFRvUGhldGlvSUQgPSAoIHBoZXRpb09iamVjdDogUGhldGlvT2JqZWN0ICkgPT4gcGhldGlvT2JqZWN0LnRhbmRlbS5waGV0aW9JRDtcclxuXHJcbnR5cGUgU3RhcnRFdmVudE9wdGlvbnMgPSB7XHJcbiAgZGF0YT86IFJlY29yZDxzdHJpbmcsIEludGVudGlvbmFsQW55PiB8IG51bGw7XHJcbiAgZ2V0RGF0YT86ICggKCkgPT4gUmVjb3JkPHN0cmluZywgSW50ZW50aW9uYWxBbnk+ICkgfCBudWxsO1xyXG59O1xyXG5cclxuLy8gV2hlbiBhbiBldmVudCBpcyBzdXBwcmVzc2VkIGZyb20gdGhlIGRhdGEgc3RyZWFtLCB3ZSBrZWVwIHRyYWNrIG9mIGl0IHdpdGggdGhpcyB0b2tlbi5cclxuY29uc3QgU0tJUFBJTkdfTUVTU0FHRSA9IC0xO1xyXG5cclxuY29uc3QgRU5BQkxFX0RFU0NSSVBUSU9OX1JFR0lTVFJZID0gISF3aW5kb3cucGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5zdXBwb3J0c0Rlc2NyaXB0aW9uUGx1Z2luO1xyXG5cclxuY29uc3QgREVGQVVMVFM6IE9wdGlvbml6ZURlZmF1bHRzPFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdwaGV0aW9EeW5hbWljRWxlbWVudE5hbWUnPj4gPSB7XHJcblxyXG4gIC8vIFN1YnR5cGVzIGNhbiB1c2UgYFRhbmRlbS5SRVFVSVJFRGAgdG8gcmVxdWlyZSBhIG5hbWVkIHRhbmRlbSBwYXNzZWQgaW5cclxuICB0YW5kZW06IFRhbmRlbS5PUFRJT05BTCxcclxuXHJcbiAgLy8gRGVmaW5lcyBkZXNjcmlwdGlvbi1zcGVjaWZpYyB0YW5kZW1zIHRoYXQgZG8gTk9UIGFmZmVjdCB0aGUgcGhldC1pbyBzeXN0ZW0uXHJcbiAgZGVzY3JpcHRpb25UYW5kZW06IFRhbmRlbS5PUFRJT05BTCxcclxuXHJcbiAgLy8gRGVmaW5lcyBBUEkgbWV0aG9kcywgZXZlbnRzIGFuZCBzZXJpYWxpemF0aW9uXHJcbiAgcGhldGlvVHlwZTogSU9UeXBlLk9iamVjdElPLFxyXG5cclxuICAvLyBVc2VmdWwgbm90ZXMgYWJvdXQgYW4gaW5zdHJ1bWVudGVkIFBoZXRpb09iamVjdCwgc2hvd24gaW4gdGhlIFBoRVQtaU8gU3R1ZGlvIFdyYXBwZXIuIEl0J3MgYW4gaHRtbFxyXG4gIC8vIHN0cmluZywgc28gXCI8YnI+XCIgdGFncyBhcmUgcmVxdWlyZWQgaW5zdGVhZCBvZiBcIlxcblwiIGNoYXJhY3RlcnMgZm9yIHByb3BlciByZW5kZXJpbmcgaW4gU3R1ZGlvXHJcbiAgcGhldGlvRG9jdW1lbnRhdGlvbjogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb0RvY3VtZW50YXRpb24sXHJcblxyXG4gIC8vIFdoZW4gdHJ1ZSwgaW5jbHVkZXMgdGhlIFBoZXRpb09iamVjdCBpbiB0aGUgUGhFVC1pTyBzdGF0ZSAobm90IGF1dG9tYXRpY2FsbHkgcmVjdXJzaXZlLCBtdXN0IGJlIHNwZWNpZmllZCBmb3JcclxuICAvLyBjaGlsZHJlbiBleHBsaWNpdGx5KVxyXG4gIHBoZXRpb1N0YXRlOiBUYW5kZW1Db25zdGFudHMuUEhFVF9JT19PQkpFQ1RfTUVUQURBVEFfREVGQVVMVFMucGhldGlvU3RhdGUsXHJcblxyXG4gIC8vIFRoaXMgb3B0aW9uIGNvbnRyb2xzIGhvdyBQaEVULWlPIHdyYXBwZXJzIGNhbiBpbnRlcmZhY2Ugd2l0aCB0aGlzIFBoZXRpb09iamVjdC4gUHJlZG9taW5hdGVseSB0aGlzIG9jY3VycyB2aWFcclxuICAvLyBwdWJsaWMgbWV0aG9kcyBkZWZpbmVkIG9uIHRoaXMgUGhldGlvT2JqZWN0J3MgcGhldGlvVHlwZSwgaW4gd2hpY2ggc29tZSBtZXRob2QgYXJlIG5vdCBleGVjdXRhYmxlIHdoZW4gdGhpcyBmbGFnXHJcbiAgLy8gaXMgdHJ1ZS4gU2VlIGBPYmplY3RJTy5tZXRob2RzYCBmb3IgZnVydGhlciBkb2N1bWVudGF0aW9uLCBlc3BlY2lhbGx5IHJlZ2FyZGluZyBgaW52b2NhYmxlRm9yUmVhZE9ubHlFbGVtZW50c2AuXHJcbiAgLy8gTk9URTogUGhldGlvT2JqZWN0cyB3aXRoIHtwaGV0aW9TdGF0ZTogdHJ1ZX0gQU5EIHtwaGV0aW9SZWFkT25seTogdHJ1ZX0gYXJlIHJlc3RvcmVkIGR1cmluZyB2aWEgc2V0U3RhdGUuXHJcbiAgcGhldGlvUmVhZE9ubHk6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9SZWFkT25seSxcclxuXHJcbiAgLy8gQ2F0ZWdvcnkgb2YgZXZlbnQgdHlwZSwgY2FuIGJlIG92ZXJyaWRkZW4gaW4gcGhldGlvU3RhcnRFdmVudCBvcHRpb25zLiAgQ2Fubm90IGJlIHN1cHBsaWVkIHRocm91Z2ggVGFuZGVtQ29uc3RhbnRzIGJlY2F1c2VcclxuICAvLyB0aGF0IHdvdWxkIGNyZWF0ZSBhbiBpbXBvcnQgbG9vcFxyXG4gIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLk1PREVMLFxyXG5cclxuICAvLyBIaWdoIGZyZXF1ZW5jeSBldmVudHMgc3VjaCBhcyBtb3VzZSBtb3ZlcyBjYW4gYmUgb21pdHRlZCBmcm9tIGRhdGEgc3RyZWFtLCBzZWUgP3BoZXRpb0VtaXRIaWdoRnJlcXVlbmN5RXZlbnRzXHJcbiAgLy8gYW5kIFBoZXRpb0NsaWVudC5sYXVuY2hTaW11bGF0aW9uIG9wdGlvblxyXG4gIC8vIEBkZXByZWNhdGVkIC0gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNjI5I2lzc3VlY29tbWVudC02MDgwMDI0MTBcclxuICBwaGV0aW9IaWdoRnJlcXVlbmN5OiBUYW5kZW1Db25zdGFudHMuUEhFVF9JT19PQkpFQ1RfTUVUQURBVEFfREVGQVVMVFMucGhldGlvSGlnaEZyZXF1ZW5jeSxcclxuXHJcbiAgLy8gV2hlbiB0cnVlLCBlbWl0cyBldmVudHMgZm9yIGRhdGEgc3RyZWFtcyBmb3IgcGxheWJhY2ssIHNlZSBoYW5kbGVQbGF5YmFja0V2ZW50LmpzXHJcbiAgcGhldGlvUGxheWJhY2s6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9QbGF5YmFjayxcclxuXHJcbiAgLy8gV2hlbiB0cnVlLCB0aGlzIGlzIGNhdGVnb3JpemVkIGFzIGFuIGltcG9ydGFudCBcImZlYXR1cmVkXCIgZWxlbWVudCBpbiBTdHVkaW8uXHJcbiAgcGhldGlvRmVhdHVyZWQ6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9GZWF0dXJlZCxcclxuXHJcbiAgLy8gaW5kaWNhdGVzIHRoYXQgYW4gb2JqZWN0IG1heSBvciBtYXkgbm90IGhhdmUgYmVlbiBjcmVhdGVkLiBBcHBsaWVzIHJlY3Vyc2l2ZWx5IGF1dG9tYXRpY2FsbHlcclxuICAvLyBhbmQgc2hvdWxkIG9ubHkgYmUgc2V0IG1hbnVhbGx5IG9uIHRoZSByb290IGR5bmFtaWMgZWxlbWVudC4gRHluYW1pYyBhcmNoZXR5cGVzIHdpbGwgaGF2ZSB0aGlzIG92ZXJ3cml0dGVuIHRvXHJcbiAgLy8gZmFsc2UgZXZlbiBpZiBleHBsaWNpdGx5IHByb3ZpZGVkIGFzIHRydWUsIGFzIGFyY2hldHlwZXMgY2Fubm90IGJlIGR5bmFtaWMuXHJcbiAgcGhldGlvRHluYW1pY0VsZW1lbnQ6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9EeW5hbWljRWxlbWVudCxcclxuXHJcbiAgLy8gTWFya2luZyBwaGV0aW9EZXNpZ25lZDogdHJ1ZSBvcHRzLWluIHRvIEFQSSBjaGFuZ2UgZGV0ZWN0aW9uIHRvb2xpbmcgdGhhdCBjYW4gYmUgdXNlZCB0byBjYXRjaCBpbmFkdmVydGVudFxyXG4gIC8vIGNoYW5nZXMgdG8gYSBkZXNpZ25lZCBBUEkuICBBIHBoZXRpb0Rlc2lnbmVkOnRydWUgUGhldGlvT2JqZWN0IChvciBhbnkgb2YgaXRzIHRhbmRlbSBkZXNjZW5kYW50cykgd2lsbCB0aHJvd1xyXG4gIC8vIGFzc2VydGlvbiBlcnJvcnMgb24gQ1QgKG9yIHdoZW4gcnVubmluZyB3aXRoID9waGV0aW9Db21wYXJlQVBJKSB3aGVuIHRoZSBmb2xsb3dpbmcgYXJlIHRydWU6XHJcbiAgLy8gKGEpIGl0cyBwYWNrYWdlLmpzb24gbGlzdHMgY29tcGFyZURlc2lnbmVkQVBJQ2hhbmdlczp0cnVlIGluIHRoZSBcInBoZXQtaW9cIiBzZWN0aW9uXHJcbiAgLy8gKGIpIHRoZSBzaW11bGF0aW9uIGlzIGxpc3RlZCBpbiBwZXJlbm5pYWwvZGF0YS9waGV0LWlvLWFwaS1zdGFibGVcclxuICAvLyAoYykgYW55IG9mIGl0cyBtZXRhZGF0YSB2YWx1ZXMgZGV2aWF0ZSBmcm9tIHRoZSByZWZlcmVuY2UgQVBJXHJcbiAgcGhldGlvRGVzaWduZWQ6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9EZXNpZ25lZCxcclxuXHJcbiAgLy8gZGVsaXZlcmVkIHdpdGggZWFjaCBldmVudCwgaWYgc3BlY2lmaWVkLiBwaGV0aW9QbGF5YmFjayBpcyBhcHBlbmRlZCBoZXJlLCBpZiB0cnVlLlxyXG4gIC8vIE5vdGU6IHVubGlrZSBvdGhlciBvcHRpb25zLCB0aGlzIG9wdGlvbiBjYW4gYmUgbXV0YXRlZCBkb3duc3RyZWFtLCBhbmQgaGVuY2Ugc2hvdWxkIGJlIGNyZWF0ZWQgbmV3bHkgZm9yIGVhY2ggaW5zdGFuY2UuXHJcbiAgcGhldGlvRXZlbnRNZXRhZGF0YTogbnVsbCxcclxuXHJcbiAgLy8gbnVsbCBtZWFucyBubyBjb25zdHJhaW50IG9uIHRhbmRlbSBuYW1lLlxyXG4gIHRhbmRlbU5hbWVTdWZmaXg6IG51bGxcclxufTtcclxuXHJcbi8vIElmIHlvdSBydW4gaW50byBhIHR5cGUgZXJyb3IgaGVyZSwgZmVlbCBmcmVlIHRvIGFkZCBhbnkgdHlwZSB0aGF0IGlzIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlcnMgXCJzdHJ1Y3R1cmVkIGNsb25pbmcgYWxnb3JpdGhtXCIgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYl9Xb3JrZXJzX0FQSS9TdHJ1Y3R1cmVkX2Nsb25lX2FsZ29yaXRobVxyXG50eXBlIEV2ZW50TWV0YWRhdGEgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyIHwgQXJyYXk8c3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlcj4+O1xyXG5cclxuYXNzZXJ0ICYmIGFzc2VydCggRXZlbnRUeXBlLnBoZXRpb1R5cGUudG9TdGF0ZU9iamVjdCggREVGQVVMVFMucGhldGlvRXZlbnRUeXBlICkgPT09IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9FdmVudFR5cGUsXHJcbiAgJ3BoZXRpb0V2ZW50VHlwZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVmYXVsdCBhcyB0aGUgZGVmYXVsdCBtZXRhZGF0YSB2YWx1ZXMuJyApO1xyXG5cclxuLy8gT3B0aW9ucyBmb3IgY3JlYXRpbmcgYSBQaGV0aW9PYmplY3RcclxudHlwZSBTZWxmT3B0aW9ucyA9IFN0cmljdE9taXQ8UGFydGlhbDxQaGV0aW9FbGVtZW50TWV0YWRhdGE+LCAncGhldGlvVHlwZU5hbWUnIHwgJ3BoZXRpb0FyY2hldHlwZVBoZXRpb0lEJyB8XHJcbiAgJ3BoZXRpb0lzQXJjaGV0eXBlJyB8ICdwaGV0aW9FdmVudFR5cGUnPiAmIHtcclxuXHJcbiAgLy8gVGhpcyBpcyB0aGUgb25seSBwbGFjZSBpbiB0aGUgcHJvamVjdCB3aGVyZSB0aGlzIGlzIGFsbG93ZWRcclxuICB0YW5kZW0/OiBUYW5kZW07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgZGVzY3JpcHRpb25UYW5kZW0/OiBUYW5kZW07XHJcbiAgcGhldGlvVHlwZT86IElPVHlwZTtcclxuICBwaGV0aW9FdmVudFR5cGU/OiBFdmVudFR5cGU7XHJcbiAgcGhldGlvRXZlbnRNZXRhZGF0YT86IEV2ZW50TWV0YWRhdGEgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgZWxlbWVudCdzIHRhbmRlbSBuYW1lIG11c3QgaGF2ZSBhIHNwZWNpZmllZCBzdWZmaXguIFRoaXMgaXMgdG8gZW5mb3JjZSBuYW1pbmcgY29udmVudGlvbnMgZm9yIFBoRVQtaU8uXHJcbiAgLy8gSWYgc3RyaW5nW10gaXMgcHJvdmlkZWQsIHRoZSB0YW5kZW0gbmFtZSBtdXN0IGhhdmUgYSBzdWZmaXggdGhhdCBtYXRjaGVzIG9uZSBvZiB0aGUgc3RyaW5ncyBpbiB0aGUgYXJyYXkuXHJcbiAgLy8gbnVsbCBtZWFucyB0aGF0IHRoZXJlIGlzIG5vIGNvbnN0cmFpbnQgb24gdGFuZGVtIG5hbWUuIFRoZSBmaXJzdCBjaGFyYWN0ZXIgaXMgbm90IGNhc2Utc2Vuc2l0aXZlLCB0byBzdXBwb3J0XHJcbiAgLy8gdXNlcyBsaWtlICd0aGVybW9tZXRlck5vZGUnIHZlcnN1cyAndXBwZXJUaGVybW9tZXRlck5vZGUnLlxyXG4gIHRhbmRlbU5hbWVTdWZmaXg/OiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGw7XHJcbn07XHJcbmV4cG9ydCB0eXBlIFBoZXRpb09iamVjdE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIERpc3Bvc2FibGVPcHRpb25zO1xyXG5cclxudHlwZSBQaGV0aW9PYmplY3RNZXRhZGF0YUtleXMgPSBrZXlvZiAoIFN0cmljdE9taXQ8UGhldGlvRWxlbWVudE1ldGFkYXRhLCAncGhldGlvVHlwZU5hbWUnIHwgJ3BoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSc+ICkgfCAncGhldGlvVHlwZSc7XHJcblxyXG4vLyBBIHR5cGUgdGhhdCBpcyB1c2VkIGZvciB0aGUgc3RydWN0dXJhbCB0eXBpbmcgd2hlbiBnYXRoZXJpbmcgbWV0YWRhdGEuIFdlIGp1c3QgbmVlZCBhIFwiUGhldGlvT2JqZWN0LWxpa2VcIiBlbnRpdHlcclxuLy8gdG8gcHVsbCB0aGUgQVBJIG1ldGFkYXRhIGZyb20uIFRodXMsIHRoaXMgaXMgdGhlIFwiaW5wdXRcIiB0byBsb2dpYyB0aGF0IHdvdWxkIHB1bGwgdGhlIG1ldGFkYXRhIGtleXMgaW50byBhbiBvYmplY3RcclxuLy8gZm9yIHRoZSBQaGV0aW9BUEkuXHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwaGV0LWlvLW9iamVjdC1vcHRpb25zLXNob3VsZC1ub3QtcGljay1mcm9tLXBoZXQtaW8tb2JqZWN0XHJcbmV4cG9ydCB0eXBlIFBoZXRpb09iamVjdE1ldGFkYXRhSW5wdXQgPSBQaWNrPFBoZXRpb09iamVjdCwgUGhldGlvT2JqZWN0TWV0YWRhdGFLZXlzPjtcclxuXHJcbmNsYXNzIFBoZXRpb09iamVjdCBleHRlbmRzIERpc3Bvc2FibGUge1xyXG5cclxuICAvLyBhc3NpZ25lZCBpbiBpbml0aWFsaXplUGhldGlvT2JqZWN0IC0gc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICBwdWJsaWMgdGFuZGVtOiBUYW5kZW07XHJcblxyXG4gIC8vIHRyYWNrIHdoZXRoZXIgdGhlIG9iamVjdCBoYXMgYmVlbiBpbml0aWFsaXplZC4gIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgaW5pdGlhbGl6YXRpb24gY2FuIGhhcHBlbiBpbiB0aGVcclxuICAvLyBjb25zdHJ1Y3RvciBvciBpbiBhIHN1YnNlcXVlbnQgY2FsbCB0byBpbml0aWFsaXplUGhldGlvT2JqZWN0ICh0byBzdXBwb3J0IHNjZW5lcnkgTm9kZSlcclxuICBwcml2YXRlIHBoZXRpb09iamVjdEluaXRpYWxpemVkOiBib29sZWFuO1xyXG5cclxuICAvLyBTZWUgZG9jdW1lbnRhdGlvbiBpbiBERUZBVUxUU1xyXG4gIHB1YmxpYyBwaGV0aW9Jc0FyY2hldHlwZSE6IGJvb2xlYW47XHJcbiAgcHVibGljIHBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEhOiBQaGV0aW9FbGVtZW50TWV0YWRhdGEgfCBudWxsO1xyXG4gIHByaXZhdGUgX3BoZXRpb1R5cGUhOiBJT1R5cGU7XHJcbiAgcHJpdmF0ZSBfcGhldGlvU3RhdGUhOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3BoZXRpb1JlYWRPbmx5ITogYm9vbGVhbjtcclxuICBwcml2YXRlIF9waGV0aW9Eb2N1bWVudGF0aW9uITogc3RyaW5nO1xyXG4gIHByaXZhdGUgX3BoZXRpb0V2ZW50VHlwZSE6IEV2ZW50VHlwZTtcclxuICBwcml2YXRlIF9waGV0aW9IaWdoRnJlcXVlbmN5ITogYm9vbGVhbjtcclxuICBwcml2YXRlIF9waGV0aW9QbGF5YmFjayE6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfcGhldGlvRHluYW1pY0VsZW1lbnQhOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3BoZXRpb0ZlYXR1cmVkITogYm9vbGVhbjtcclxuICBwcml2YXRlIF9waGV0aW9FdmVudE1ldGFkYXRhITogRXZlbnRNZXRhZGF0YSB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfcGhldGlvRGVzaWduZWQhOiBib29sZWFuO1xyXG5cclxuICAvLyBQdWJsaWMgb25seSBmb3IgUGhldGlvT2JqZWN0TWV0YWRhdGFJbnB1dFxyXG4gIHB1YmxpYyBwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCE6IHN0cmluZyB8IG51bGw7XHJcbiAgcHJpdmF0ZSBsaW5rZWRFbGVtZW50cyE6IExpbmtlZEVsZW1lbnRbXSB8IG51bGw7XHJcbiAgcHVibGljIHBoZXRpb05vdGlmaWVkT2JqZWN0Q3JlYXRlZCE6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBwaGV0aW9NZXNzYWdlU3RhY2shOiBudW1iZXJbXTtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfT1BUSU9OUyA9IERFRkFVTFRTO1xyXG4gIHB1YmxpYyBwaGV0aW9JRDogUGhldGlvSUQ7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggb3B0aW9ucz86IFBoZXRpb09iamVjdE9wdGlvbnMgKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMudGFuZGVtID0gREVGQVVMVFMudGFuZGVtO1xyXG4gICAgdGhpcy5waGV0aW9JRCA9IHRoaXMudGFuZGVtLnBoZXRpb0lEO1xyXG4gICAgdGhpcy5waGV0aW9PYmplY3RJbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICggb3B0aW9ucyApIHtcclxuICAgICAgdGhpcy5pbml0aWFsaXplUGhldGlvT2JqZWN0KCB7fSwgb3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBTQ0VORVJZL05vZGUsIFBoZXRpb09iamVjdCBjYW4gYmUgY29uZmlndXJlZCBkdXJpbmcgY29uc3RydWN0aW9uIG9yIGxhdGVyIHdpdGggYSBtdXRhdGUgY2FsbC5cclxuICAgKiBOb29wIGlmIHByb3ZpZGVkIG9wdGlvbnMga2V5cyBkb24ndCBpbnRlcnNlY3Qgd2l0aCBhbnkga2V5IGluIERFRkFVTFRTOyBiYXNlT3B0aW9ucyBhcmUgaWdub3JlZCBmb3IgdGhpcyBjYWxjdWxhdGlvbi5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgaW5pdGlhbGl6ZVBoZXRpb09iamVjdCggYmFzZU9wdGlvbnM6IFBhcnRpYWw8UGhldGlvT2JqZWN0T3B0aW9ucz4sIHByb3ZpZGVkT3B0aW9uczogUGhldGlvT2JqZWN0T3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhYmFzZU9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdpc0Rpc3Bvc2FibGUnICksICdiYXNlT3B0aW9ucyBzaG91bGQgbm90IGNvbnRhaW4gaXNEaXNwb3NhYmxlJyApO1xyXG4gICAgdGhpcy5pbml0aWFsaXplRGlzcG9zYWJsZSggcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLCAnaW5pdGlhbGl6ZVBoZXRpb09iamVjdCBtdXN0IGJlIGNhbGxlZCB3aXRoIHByb3ZpZGVkT3B0aW9ucycgKTtcclxuXHJcbiAgICAvLyBjYWxsIGJlZm9yZSB3ZSBleGl0IGVhcmx5IHRvIHN1cHBvcnQgbG9nZ2luZyB1bnN1cHBsaWVkIFRhbmRlbXMuXHJcbiAgICBwcm92aWRlZE9wdGlvbnMudGFuZGVtICYmIFRhbmRlbS5vbk1pc3NpbmdUYW5kZW0oIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0gKTtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCByZXF1aXJlZCB0YW5kZW1zIGFyZSBzdXBwbGllZFxyXG4gICAgaWYgKCBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgcHJvdmlkZWRPcHRpb25zLnRhbmRlbSAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtLnJlcXVpcmVkICkge1xyXG4gICAgICBhc3NlcnQoIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0uc3VwcGxpZWQsICdyZXF1aXJlZCB0YW5kZW1zIG11c3QgYmUgc3VwcGxpZWQnICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBFTkFCTEVfREVTQ1JJUFRJT05fUkVHSVNUUlkgJiYgcHJvdmlkZWRPcHRpb25zLnRhbmRlbSAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtLnN1cHBsaWVkICkge1xyXG4gICAgICBEZXNjcmlwdGlvblJlZ2lzdHJ5LmFkZCggcHJvdmlkZWRPcHRpb25zLnRhbmRlbSwgdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSBwcmVzZW5jZSBvZiBgdGFuZGVtYCBpbmRpY2F0ZXMgaWYgdGhpcyBQaGV0aW9PYmplY3QgY2FuIGJlIGluaXRpYWxpemVkLiBJZiBub3QgeWV0IGluaXRpYWxpemVkLCBwZXJoYXBzXHJcbiAgICAvLyBpdCB3aWxsIGJlIGluaXRpYWxpemVkIGxhdGVyIG9uLCBhcyBpbiBOb2RlLm11dGF0ZSgpLlxyXG4gICAgaWYgKCAhKCBQSEVUX0lPX0VOQUJMRUQgJiYgcHJvdmlkZWRPcHRpb25zLnRhbmRlbSAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtLnN1cHBsaWVkICkgKSB7XHJcblxyXG4gICAgICAvLyBJbiB0aGlzIGNhc2UsIHRoZSBQaGV0aW9PYmplY3QgaXMgbm90IGluaXRpYWxpemVkLCBidXQgc3RpbGwgc2V0IHRhbmRlbSB0byBtYWludGFpbiBhIGNvbnNpc3RlbnQgQVBJIGZvclxyXG4gICAgICAvLyBjcmVhdGluZyB0aGUgVGFuZGVtIHRyZWUuXHJcbiAgICAgIGlmICggcHJvdmlkZWRPcHRpb25zLnRhbmRlbSApIHtcclxuICAgICAgICB0aGlzLnRhbmRlbSA9IHByb3ZpZGVkT3B0aW9ucy50YW5kZW07XHJcbiAgICAgICAgdGhpcy5waGV0aW9JRCA9IHRoaXMudGFuZGVtLnBoZXRpb0lEO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5waGV0aW9PYmplY3RJbml0aWFsaXplZCwgJ2Nhbm5vdCBpbml0aWFsaXplIHR3aWNlJyApO1xyXG5cclxuICAgIC8vIEd1YXJkIHZhbGlkYXRpb24gb24gYXNzZXJ0IHRvIGF2b2lkIGNhbGxpbmcgYSBsYXJnZSBudW1iZXIgb2Ygbm8tb3BzIHdoZW4gYXNzZXJ0aW9ucyBhcmUgZGlzYWJsZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy8yMDBcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggcHJvdmlkZWRPcHRpb25zLnRhbmRlbSwgeyB2YWx1ZVR5cGU6IFRhbmRlbSB9ICk7XHJcblxyXG4gICAgY29uc3QgZGVmYXVsdHMgPSBjb21iaW5lT3B0aW9uczxPcHRpb25pemVEZWZhdWx0czxQaGV0aW9PYmplY3RPcHRpb25zPj4oIHt9LCBERUZBVUxUUywgYmFzZU9wdGlvbnMgKTtcclxuXHJcbiAgICBsZXQgb3B0aW9ucyA9IG9wdGlvbml6ZTxQaGV0aW9PYmplY3RPcHRpb25zPigpKCBkZWZhdWx0cywgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgb3B0aW9ucyBiZWZvcmUgYXNzaWduaW5nIHRvIHByb3BlcnRpZXNcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggb3B0aW9ucy5waGV0aW9UeXBlLCBJT19UWVBFX1ZBTElEQVRPUiApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb1N0YXRlLCBtZXJnZSgge30sIEJPT0xFQU5fVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvU3RhdGUgbXVzdCBiZSBhIGJvb2xlYW4nIH0gKSApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb1JlYWRPbmx5LCBtZXJnZSgge30sIEJPT0xFQU5fVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvUmVhZE9ubHkgbXVzdCBiZSBhIGJvb2xlYW4nIH0gKSApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb0V2ZW50VHlwZSwgUEhFVF9JT19FVkVOVF9UWVBFX1ZBTElEQVRPUiApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb0RvY3VtZW50YXRpb24sIFBIRVRfSU9fRE9DVU1FTlRBVElPTl9WQUxJREFUT1IgKTtcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggb3B0aW9ucy5waGV0aW9IaWdoRnJlcXVlbmN5LCBtZXJnZSgge30sIEJPT0xFQU5fVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvSGlnaEZyZXF1ZW5jeSBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvUGxheWJhY2ssIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9QbGF5YmFjayBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRmVhdHVyZWQsIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9GZWF0dXJlZCBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRXZlbnRNZXRhZGF0YSwgbWVyZ2UoIHt9LCBPQkpFQ1RfVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAnb2JqZWN0IGxpdGVyYWwgZXhwZWN0ZWQnIH0gKSApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb0R5bmFtaWNFbGVtZW50LCBtZXJnZSgge30sIEJPT0xFQU5fVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvRHluYW1pY0VsZW1lbnQgbXVzdCBiZSBhIGJvb2xlYW4nIH0gKSApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb0Rlc2lnbmVkLCBtZXJnZSgge30sIEJPT0xFQU5fVkFMSURBVE9SLCB7IHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvRGVzaWduZWQgbXVzdCBiZSBhIGJvb2xlYW4nIH0gKSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubGlua2VkRWxlbWVudHMgIT09IG51bGwsICd0aGlzIG1lYW5zIGFkZExpbmtlZEVsZW1lbnQgd2FzIGNhbGxlZCBiZWZvcmUgaW5zdHJ1bWVudGF0aW9uIG9mIHRoaXMgUGhldGlvT2JqZWN0JyApO1xyXG5cclxuICAgIC8vIG9wdGlvbmFsIC0gSW5kaWNhdGVzIHRoYXQgYW4gb2JqZWN0IGlzIGEgYXJjaGV0eXBlIGZvciBhIGR5bmFtaWMgY2xhc3MuIFNldHRhYmxlIG9ubHkgYnlcclxuICAgIC8vIFBoZXRpb0VuZ2luZSBhbmQgYnkgY2xhc3NlcyB0aGF0IGNyZWF0ZSBkeW5hbWljIGVsZW1lbnRzIHdoZW4gY3JlYXRpbmcgdGhlaXIgYXJjaGV0eXBlIChsaWtlIFBoZXRpb0dyb3VwKSB0aHJvdWdoXHJcbiAgICAvLyBQaGV0aW9PYmplY3QubWFya0R5bmFtaWNFbGVtZW50QXJjaGV0eXBlKCkuXHJcbiAgICAvLyBpZiB0cnVlLCBpdGVtcyB3aWxsIGJlIGV4Y2x1ZGVkIGZyb20gcGhldGlvU3RhdGUuIFRoaXMgYXBwbGllcyByZWN1cnNpdmVseSBhdXRvbWF0aWNhbGx5LlxyXG4gICAgdGhpcy5waGV0aW9Jc0FyY2hldHlwZSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIChwaGV0aW9FbmdpbmUpXHJcbiAgICAvLyBTdG9yZSB0aGUgZnVsbCBiYXNlbGluZSBmb3IgdXNhZ2UgaW4gdmFsaWRhdGlvbiBvciBmb3IgdXNhZ2UgaW4gc3R1ZGlvLiAgRG8gdGhpcyBiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzLiBUaGVcclxuICAgIC8vIGJhc2VsaW5lIGlzIGNyZWF0ZWQgd2hlbiBhIHNpbSBpcyBydW4gd2l0aCBhc3NlcnRpb25zIHRvIGFzc2lzdCBpbiBwaGV0aW9BUElWYWxpZGF0aW9uLiAgSG93ZXZlciwgZXZlbiB3aGVuXHJcbiAgICAvLyBhc3NlcnRpb25zIGFyZSBkaXNhYmxlZCwgc29tZSB3cmFwcGVycyBzdWNoIGFzIHN0dWRpbyBuZWVkIHRvIGdlbmVyYXRlIHRoZSBiYXNlbGluZSBhbnl3YXkuXHJcbiAgICAvLyBub3QgYWxsIG1ldGFkYXRhIGFyZSBwYXNzZWQgdGhyb3VnaCB2aWEgb3B0aW9ucywgc28gc3RvcmUgYmFzZWxpbmUgZm9yIHRoZXNlIGFkZGl0aW9uYWwgcHJvcGVydGllc1xyXG4gICAgdGhpcy5waGV0aW9CYXNlbGluZU1ldGFkYXRhID0gKCBwaGV0aW9BUElWYWxpZGF0aW9uLmVuYWJsZWQgfHwgcGhldC5wcmVsb2Fkcy5waGV0aW8ucXVlcnlQYXJhbWV0ZXJzLnBoZXRpb0VtaXRBUElCYXNlbGluZSApID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0TWV0YWRhdGEoIG1lcmdlKCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBoZXRpb0lzQXJjaGV0eXBlOiB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRDogdGhpcy5waGV0aW9BcmNoZXR5cGVQaGV0aW9JRFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgb3B0aW9ucyApICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuXHJcbiAgICAvLyBEeW5hbWljIGVsZW1lbnRzIHNob3VsZCBjb21wYXJlIHRvIHRoZWlyIFwiYXJjaGV0eXBhbFwiIGNvdW50ZXJwYXJ0cy4gIEZvciBleGFtcGxlLCB0aGlzIG1lYW5zIHRoYXQgYSBQYXJ0aWNsZVxyXG4gICAgLy8gaW4gYSBQaGV0aW9Hcm91cCB3aWxsIHRha2UgaXRzIG92ZXJyaWRlcyBmcm9tIHRoZSBQaGV0aW9Hcm91cCBhcmNoZXR5cGUuXHJcbiAgICBjb25zdCBhcmNoZXR5cGFsUGhldGlvSUQgPSBvcHRpb25zLnRhbmRlbS5nZXRBcmNoZXR5cGFsUGhldGlvSUQoKTtcclxuXHJcbiAgICAvLyBPdmVycmlkZXMgYXJlIG9ubHkgZGVmaW5lZCBmb3Igc2ltdWxhdGlvbnMsIG5vdCBmb3IgdW5pdCB0ZXN0cy4gIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTQ2MVxyXG4gICAgLy8gUGF0Y2ggaW4gdGhlIGRlc2lyZWQgdmFsdWVzIGZyb20gb3ZlcnJpZGVzLCBpZiBhbnkuXHJcbiAgICBpZiAoIHdpbmRvdy5waGV0LnByZWxvYWRzLnBoZXRpby5waGV0aW9FbGVtZW50c092ZXJyaWRlcyApIHtcclxuICAgICAgY29uc3Qgb3ZlcnJpZGVzID0gd2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnBoZXRpb0VsZW1lbnRzT3ZlcnJpZGVzWyBhcmNoZXR5cGFsUGhldGlvSUQgXTtcclxuICAgICAgaWYgKCBvdmVycmlkZXMgKSB7XHJcblxyXG4gICAgICAgIC8vIE5vIG5lZWQgdG8gbWFrZSBhIG5ldyBvYmplY3QsIHNpbmNlIHRoaXMgXCJvcHRpb25zXCIgdmFyaWFibGUgd2FzIGNyZWF0ZWQgaW4gdGhlIHByZXZpb3VzIG1lcmdlIGNhbGwgYWJvdmUuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbml6ZTxQaGV0aW9PYmplY3RPcHRpb25zPigpKCBvcHRpb25zLCBvdmVycmlkZXMgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIChyZWFkLW9ubHkpIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLnRhbmRlbSA9IG9wdGlvbnMudGFuZGVtITtcclxuICAgIHRoaXMucGhldGlvSUQgPSB0aGlzLnRhbmRlbS5waGV0aW9JRDtcclxuXHJcbiAgICAvLyAocmVhZC1vbmx5KSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gICAgdGhpcy5fcGhldGlvVHlwZSA9IG9wdGlvbnMucGhldGlvVHlwZTtcclxuXHJcbiAgICAvLyAocmVhZC1vbmx5KSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gICAgdGhpcy5fcGhldGlvU3RhdGUgPSBvcHRpb25zLnBoZXRpb1N0YXRlO1xyXG5cclxuICAgIC8vIChyZWFkLW9ubHkpIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLl9waGV0aW9SZWFkT25seSA9IG9wdGlvbnMucGhldGlvUmVhZE9ubHk7XHJcblxyXG4gICAgLy8gKHJlYWQtb25seSkgc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb0RvY3VtZW50YXRpb24gPSBvcHRpb25zLnBoZXRpb0RvY3VtZW50YXRpb247XHJcblxyXG4gICAgLy8gc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb0V2ZW50VHlwZSA9IG9wdGlvbnMucGhldGlvRXZlbnRUeXBlO1xyXG5cclxuICAgIC8vIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLl9waGV0aW9IaWdoRnJlcXVlbmN5ID0gb3B0aW9ucy5waGV0aW9IaWdoRnJlcXVlbmN5O1xyXG5cclxuICAgIC8vIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLl9waGV0aW9QbGF5YmFjayA9IG9wdGlvbnMucGhldGlvUGxheWJhY2s7XHJcblxyXG4gICAgLy8gKFBoZXRpb0VuZ2luZSkgc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb24gLSBpbiBvcmRlciB0byByZWN1cnNpdmVseSBwYXNzIHRoaXMgdmFsdWUgdG9cclxuICAgIC8vIGNoaWxkcmVuLCB0aGUgc2V0UGhldGlvRHluYW1pY0VsZW1lbnQoKSBmdW5jdGlvbiBtdXN0IGJlIHVzZWQgaW5zdGVhZCBvZiBzZXR0aW5nIHRoaXMgYXR0cmlidXRlIGRpcmVjdGx5XHJcbiAgICB0aGlzLl9waGV0aW9EeW5hbWljRWxlbWVudCA9IG9wdGlvbnMucGhldGlvRHluYW1pY0VsZW1lbnQ7XHJcblxyXG4gICAgLy8gKHJlYWQtb25seSkgc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb0ZlYXR1cmVkID0gb3B0aW9ucy5waGV0aW9GZWF0dXJlZDtcclxuXHJcbiAgICB0aGlzLl9waGV0aW9FdmVudE1ldGFkYXRhID0gb3B0aW9ucy5waGV0aW9FdmVudE1ldGFkYXRhO1xyXG5cclxuICAgIHRoaXMuX3BoZXRpb0Rlc2lnbmVkID0gb3B0aW9ucy5waGV0aW9EZXNpZ25lZDtcclxuXHJcbiAgICAvLyBmb3IgcGhldGlvRHluYW1pY0VsZW1lbnRzLCB0aGUgY29ycmVzcG9uZGluZyBwaGV0aW9JRCBmb3IgdGhlIGVsZW1lbnQgaW4gdGhlIGFyY2hldHlwZSBzdWJ0cmVlXHJcbiAgICB0aGlzLnBoZXRpb0FyY2hldHlwZVBoZXRpb0lEID0gbnVsbDtcclxuXHJcbiAgICAvL2tlZXAgdHJhY2sgb2YgTGlua2VkRWxlbWVudHMgZm9yIGRpc3Bvc2FsLiBOdWxsIG91dCB0byBzdXBwb3J0IGFzc2VydGluZyBvblxyXG4gICAgLy8gZWRnZSBlcnJvciBjYXNlcywgc2VlIHRoaXMuYWRkTGlua2VkRWxlbWVudCgpXHJcbiAgICB0aGlzLmxpbmtlZEVsZW1lbnRzID0gW107XHJcblxyXG4gICAgLy8gKHBoZXQtaW8pIHNldCB0byB0cnVlIHdoZW4gdGhpcyBQaGV0aW9PYmplY3QgaGFzIGJlZW4gc2VudCBvdmVyIHRvIHRoZSBwYXJlbnQuXHJcbiAgICB0aGlzLnBoZXRpb05vdGlmaWVkT2JqZWN0Q3JlYXRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIHRyYWNrcyB0aGUgaW5kaWNlcyBvZiBzdGFydGVkIG1lc3NhZ2VzIHNvIHRoYXQgZGF0YVN0cmVhbSBjYW4gY2hlY2sgdGhhdCBlbmRzIG1hdGNoIHN0YXJ0cy5cclxuICAgIHRoaXMucGhldGlvTWVzc2FnZVN0YWNrID0gW107XHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHBsYXliYWNrIHNob3dzIGluIHRoZSBwaGV0aW9FdmVudE1ldGFkYXRhXHJcbiAgICBpZiAoIHRoaXMuX3BoZXRpb1BsYXliYWNrICkge1xyXG4gICAgICB0aGlzLl9waGV0aW9FdmVudE1ldGFkYXRhID0gdGhpcy5fcGhldGlvRXZlbnRNZXRhZGF0YSB8fCB7fTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX3BoZXRpb0V2ZW50TWV0YWRhdGEuaGFzT3duUHJvcGVydHkoICdwbGF5YmFjaycgKSwgJ3BoZXRpb0V2ZW50TWV0YWRhdGEucGxheWJhY2sgc2hvdWxkIG5vdCBhbHJlYWR5IGV4aXN0JyApO1xyXG4gICAgICB0aGlzLl9waGV0aW9FdmVudE1ldGFkYXRhLnBsYXliYWNrID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbGVydCB0aGF0IHRoaXMgUGhldGlvT2JqZWN0IGlzIHJlYWR5IGZvciBjcm9zcy1mcmFtZSBjb21tdW5pY2F0aW9uICh0aHVzIGJlY29taW5nIGEgXCJQaEVULWlPIEVsZW1lbnRcIiBvbiB0aGUgd3JhcHBlciBzaWRlLlxyXG4gICAgdGhpcy50YW5kZW0uYWRkUGhldGlvT2JqZWN0KCB0aGlzICk7XHJcbiAgICB0aGlzLnBoZXRpb09iamVjdEluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCAmJiBUYW5kZW0uVkFMSURBVElPTiAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgJiYgb3B0aW9ucy50YW5kZW1OYW1lU3VmZml4ICkge1xyXG5cclxuICAgICAgY29uc3Qgc3VmZml4QXJyYXkgPSBBcnJheS5pc0FycmF5KCBvcHRpb25zLnRhbmRlbU5hbWVTdWZmaXggKSA/IG9wdGlvbnMudGFuZGVtTmFtZVN1ZmZpeCA6IFsgb3B0aW9ucy50YW5kZW1OYW1lU3VmZml4IF07XHJcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBzdWZmaXhBcnJheS5maWx0ZXIoIHN1ZmZpeCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGFuZGVtLm5hbWUuZW5kc1dpdGgoIHN1ZmZpeCApIHx8XHJcbiAgICAgICAgICAgICAgIHRoaXMudGFuZGVtLm5hbWUuZW5kc1dpdGgoIFBoZXRpb09iamVjdC5zd2FwQ2FzZU9mRmlyc3RDaGFyYWN0ZXIoIHN1ZmZpeCApICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbWF0Y2hlcy5sZW5ndGggPiAwLCAnSW5jb3JyZWN0IFRhbmRlbSBzdWZmaXgsIGV4cGVjdGVkID0gJyArIHN1ZmZpeEFycmF5LmpvaW4oICcsICcgKSArICcuIGFjdHVhbCA9ICcgKyB0aGlzLnRhbmRlbS5waGV0aW9JRCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBzd2FwQ2FzZU9mRmlyc3RDaGFyYWN0ZXIoIHN0cmluZzogc3RyaW5nICk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBmaXJzdENoYXIgPSBzdHJpbmdbIDAgXTtcclxuICAgIGNvbnN0IG5ld0ZpcnN0Q2hhciA9IGZpcnN0Q2hhciA9PT0gZmlyc3RDaGFyLnRvTG93ZXJDYXNlKCkgPyBmaXJzdENoYXIudG9VcHBlckNhc2UoKSA6IGZpcnN0Q2hhci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgcmV0dXJuIG5ld0ZpcnN0Q2hhciArIHN0cmluZy5zdWJzdHJpbmcoIDEgKTtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvVHlwZSgpOiBJT1R5cGUge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb1R5cGUgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9UeXBlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9TdGF0ZSgpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9TdGF0ZSBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb1N0YXRlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9SZWFkT25seSgpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9SZWFkT25seSBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb1JlYWRPbmx5O1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9Eb2N1bWVudGF0aW9uKCk6IHN0cmluZyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRG9jdW1lbnRhdGlvbiBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb0RvY3VtZW50YXRpb247XHJcbiAgfVxyXG5cclxuICAvLyB0aHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGluIGJyYW5kcyBvdGhlciB0aGFuIFBoRVQtaU9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb0V2ZW50VHlwZSgpOiBFdmVudFR5cGUge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb0V2ZW50VHlwZSBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb0V2ZW50VHlwZTtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvSGlnaEZyZXF1ZW5jeSgpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9IaWdoRnJlcXVlbmN5IG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvSGlnaEZyZXF1ZW5jeTtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvUGxheWJhY2soKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvUGxheWJhY2sgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9QbGF5YmFjaztcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRHluYW1pY0VsZW1lbnQoKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRHluYW1pY0VsZW1lbnQgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9EeW5hbWljRWxlbWVudDtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRmVhdHVyZWQoKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRmVhdHVyZWQgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9GZWF0dXJlZDtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRXZlbnRNZXRhZGF0YSgpOiBFdmVudE1ldGFkYXRhIHwgbnVsbCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRXZlbnRNZXRhZGF0YSBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb0V2ZW50TWV0YWRhdGE7XHJcbiAgfVxyXG5cclxuICAvLyB0aHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGluIGJyYW5kcyBvdGhlciB0aGFuIFBoRVQtaU9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb0Rlc2lnbmVkKCk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb0Rlc2lnbmVkIG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvRGVzaWduZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGFydCBhbiBldmVudCBmb3IgdGhlIG5lc3RlZCBQaEVULWlPIGRhdGEgc3RyZWFtLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGV2ZW50IC0gdGhlIG5hbWUgb2YgdGhlIGV2ZW50XHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIHBoZXRpb1N0YXJ0RXZlbnQoIGV2ZW50OiBzdHJpbmcsIHByb3ZpZGVkT3B0aW9ucz86IFN0YXJ0RXZlbnRPcHRpb25zICk6IHZvaWQge1xyXG4gICAgaWYgKCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgLy8gb25seSBvbmUgb3IgdGhlIG90aGVyIGNhbiBiZSBwcm92aWRlZFxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBwcm92aWRlZE9wdGlvbnMsIFsgJ2RhdGEnIF0sIFsgJ2dldERhdGEnIF0gKTtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTdGFydEV2ZW50T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgICBkYXRhOiBudWxsLFxyXG5cclxuICAgICAgICAvLyBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCBnZXRzIHRoZSBkYXRhLlxyXG4gICAgICAgIGdldERhdGE6IG51bGxcclxuICAgICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBoZXRpb09iamVjdEluaXRpYWxpemVkLCAncGhldGlvT2JqZWN0IHNob3VsZCBiZSBpbml0aWFsaXplZCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIG9wdGlvbnMuZGF0YSAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLmRhdGEgPT09ICdvYmplY3QnICk7XHJcbiAgICAgIGFzc2VydCAmJiBvcHRpb25zLmdldERhdGEgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5nZXREYXRhID09PSAnZnVuY3Rpb24nICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMiwgJ1ByZXZlbnQgdXNhZ2Ugb2YgaW5jb3JyZWN0IHNpZ25hdHVyZScgKTtcclxuXHJcbiAgICAgIC8vIFRPRE86IGRvbid0IGRyb3AgUGhFVC1pTyBldmVudHMgaWYgdGhleSBhcmUgY3JlYXRlZCBiZWZvcmUgd2UgaGF2ZSBhIGRhdGFTdHJlYW0gZ2xvYmFsLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg3NVxyXG4gICAgICBpZiAoICFfLmhhc0luKCB3aW5kb3csICdwaGV0LnBoZXRpby5kYXRhU3RyZWFtJyApICkge1xyXG5cclxuICAgICAgICAvLyBJZiB5b3UgaGl0IHRoaXMsIHRoZW4gaXQgaXMgbGlrZWx5IHJlbGF0ZWQgdG8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExMjQgYW5kIHdlIHdvdWxkIGxpa2UgdG8ga25vdyBhYm91dCBpdCFcclxuICAgICAgICAvLyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ3RyeWluZyB0byBjcmVhdGUgYW4gZXZlbnQgYmVmb3JlIHRoZSBkYXRhIHN0cmVhbSBleGlzdHMnICk7XHJcblxyXG4gICAgICAgIHRoaXMucGhldGlvTWVzc2FnZVN0YWNrLnB1c2goIFNLSVBQSU5HX01FU1NBR0UgKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE9wdCBvdXQgb2YgY2VydGFpbiBldmVudHMgaWYgcXVlcnlQYXJhbWV0ZXIgb3ZlcnJpZGUgaXMgcHJvdmlkZWQuIEV2ZW4gZm9yIGEgbG93IGZyZXF1ZW5jeSBkYXRhIHN0cmVhbSwgaGlnaFxyXG4gICAgICAvLyBmcmVxdWVuY3kgZXZlbnRzIGNhbiBzdGlsbCBiZSBlbWl0dGVkIHdoZW4gdGhleSBoYXZlIGEgbG93IGZyZXF1ZW5jeSBhbmNlc3Rvci5cclxuICAgICAgY29uc3Qgc2tpcEhpZ2hGcmVxdWVuY3lFdmVudCA9IHRoaXMucGhldGlvSGlnaEZyZXF1ZW5jeSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5oYXNJbiggd2luZG93LCAncGhldC5wcmVsb2Fkcy5waGV0aW8ucXVlcnlQYXJhbWV0ZXJzJyApICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhd2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnF1ZXJ5UGFyYW1ldGVycy5waGV0aW9FbWl0SGlnaEZyZXF1ZW5jeUV2ZW50cyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXBoZXQucGhldGlvLmRhdGFTdHJlYW0uaXNFbWl0dGluZ0xvd0ZyZXF1ZW5jeUV2ZW50KCk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBJZiB0aGVyZSBpcyBubyBkYXRhU3RyZWFtIGdsb2JhbCBkZWZpbmVkLCB0aGVuIHdlIHNob3VsZCBoYW5kbGUgdGhpcyBkaWZmZXJlbnRseSBhcyB0byBub3QgZHJvcCB0aGUgZXZlbnQgdGhhdCBpcyB0cmlnZ2VyZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg0NlxyXG4gICAgICBjb25zdCBza2lwRnJvbVVuZGVmaW5lZERhdGFzdHJlYW0gPSAhYXNzZXJ0ICYmICFfLmhhc0luKCB3aW5kb3csICdwaGV0LnBoZXRpby5kYXRhU3RyZWFtJyApO1xyXG5cclxuICAgICAgaWYgKCBza2lwSGlnaEZyZXF1ZW5jeUV2ZW50IHx8IHRoaXMucGhldGlvRXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1BUX09VVCB8fCBza2lwRnJvbVVuZGVmaW5lZERhdGFzdHJlYW0gKSB7XHJcbiAgICAgICAgdGhpcy5waGV0aW9NZXNzYWdlU3RhY2sucHVzaCggU0tJUFBJTkdfTUVTU0FHRSApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gT25seSBnZXQgdGhlIGFyZ3MgaWYgd2UgYXJlIGFjdHVhbGx5IGdvaW5nIHRvIHNlbmQgdGhlIGV2ZW50LlxyXG4gICAgICBjb25zdCBkYXRhID0gb3B0aW9ucy5nZXREYXRhID8gb3B0aW9ucy5nZXREYXRhKCkgOiBvcHRpb25zLmRhdGE7XHJcblxyXG4gICAgICB0aGlzLnBoZXRpb01lc3NhZ2VTdGFjay5wdXNoKFxyXG4gICAgICAgIHBoZXQucGhldGlvLmRhdGFTdHJlYW0uc3RhcnQoIHRoaXMucGhldGlvRXZlbnRUeXBlLCB0aGlzLnRhbmRlbS5waGV0aW9JRCwgdGhpcy5waGV0aW9UeXBlLCBldmVudCwgZGF0YSwgdGhpcy5waGV0aW9FdmVudE1ldGFkYXRhLCB0aGlzLnBoZXRpb0hpZ2hGcmVxdWVuY3kgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gVG8gc3VwcG9ydCBQaEVULWlPIHBsYXliYWNrLCBhbnkgcG90ZW50aWFsIHBsYXliYWNrIGV2ZW50cyBkb3duc3RyZWFtIG9mIHRoaXMgcGxheWJhY2sgZXZlbnQgbXVzdCBiZSBtYXJrZWQgYXNcclxuICAgICAgLy8gbm9uIHBsYXliYWNrIGV2ZW50cy4gVGhpcyBpcyB0byBwcmV2ZW50IHRoZSBQaEVULWlPIHBsYXliYWNrIGVuZ2luZSBmcm9tIHJlcGVhdGluZyB0aG9zZSBldmVudHMuIFNlZVxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTY5M1xyXG4gICAgICB0aGlzLnBoZXRpb1BsYXliYWNrICYmIHBoZXQucGhldGlvLmRhdGFTdHJlYW0ucHVzaE5vblBsYXliYWNrYWJsZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW5kIGFuIGV2ZW50IG9uIHRoZSBuZXN0ZWQgUGhFVC1pTyBkYXRhIHN0cmVhbS4gSXQgdGhpcyBvYmplY3Qgd2FzIGRpc3Bvc2VkIG9yIGRhdGFTdHJlYW0uc3RhcnQgd2FzIG5vdCBjYWxsZWQsXHJcbiAgICogdGhpcyBpcyBhIG5vLW9wLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwaGV0aW9FbmRFdmVudCgpOiB2b2lkIHtcclxuICAgIGlmICggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGhldGlvTWVzc2FnZVN0YWNrLmxlbmd0aCA+IDAsICdNdXN0IGhhdmUgbWVzc2FnZXMgdG8gcG9wJyApO1xyXG4gICAgICBjb25zdCB0b3BNZXNzYWdlSW5kZXggPSB0aGlzLnBoZXRpb01lc3NhZ2VTdGFjay5wb3AoKTtcclxuXHJcbiAgICAgIC8vIFRoZSBtZXNzYWdlIHdhcyBzdGFydGVkIGFzIGEgaGlnaCBmcmVxdWVuY3kgZXZlbnQgdG8gYmUgc2tpcHBlZCwgc28gdGhlIGVuZCBpcyBhIG5vLW9wXHJcbiAgICAgIGlmICggdG9wTWVzc2FnZUluZGV4ID09PSBTS0lQUElOR19NRVNTQUdFICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnBoZXRpb1BsYXliYWNrICYmIHBoZXQucGhldGlvLmRhdGFTdHJlYW0ucG9wTm9uUGxheWJhY2thYmxlKCk7XHJcbiAgICAgIHBoZXQucGhldGlvLmRhdGFTdHJlYW0uZW5kKCB0b3BNZXNzYWdlSW5kZXggKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBhbnkgaW5zdHJ1bWVudGVkIGRlc2NlbmRhbnRzIG9mIHRoaXMgUGhldGlvT2JqZWN0IHRvIHRoZSBzYW1lIHZhbHVlIGFzIHRoaXMucGhldGlvRHluYW1pY0VsZW1lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHByb3BhZ2F0ZUR5bmFtaWNGbGFnc1RvRGVzY2VuZGFudHMoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBUYW5kZW0uUEhFVF9JT19FTkFCTEVELCAncGhldC1pbyBzaG91bGQgYmUgZW5hYmxlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoZXQucGhldGlvICYmIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZSwgJ0R5bmFtaWMgZWxlbWVudHMgY2Fubm90IGJlIGNyZWF0ZWQgc3RhdGljYWxseSBiZWZvcmUgcGhldGlvRW5naW5lIGV4aXN0cy4nICk7XHJcbiAgICBjb25zdCBwaGV0aW9FbmdpbmUgPSBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmU7XHJcblxyXG4gICAgLy8gaW4gdGhlIHNhbWUgb3JkZXIgYXMgYnVmZmVyZWRQaGV0aW9PYmplY3RzXHJcbiAgICBjb25zdCB1bmxhdW5jaGVkUGhldGlvSURzID0gIVRhbmRlbS5sYXVuY2hlZCA/IFRhbmRlbS5idWZmZXJlZFBoZXRpb09iamVjdHMubWFwKCBvYmplY3RUb1BoZXRpb0lEICkgOiBbXTtcclxuXHJcbiAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIHRhbmRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0lEID0gdGFuZGVtLnBoZXRpb0lEO1xyXG5cclxuICAgICAgaWYgKCBwaGV0aW9FbmdpbmUuaGFzUGhldGlvT2JqZWN0KCBwaGV0aW9JRCApIHx8ICggIVRhbmRlbS5sYXVuY2hlZCAmJiB1bmxhdW5jaGVkUGhldGlvSURzLmluY2x1ZGVzKCBwaGV0aW9JRCApICkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICk7XHJcbiAgICAgICAgY29uc3QgcGhldGlvT2JqZWN0ID0gcGhldGlvRW5naW5lLmhhc1BoZXRpb09iamVjdCggcGhldGlvSUQgKSA/IHBoZXRpb0VuZ2luZS5nZXRQaGV0aW9FbGVtZW50KCBwaGV0aW9JRCApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYW5kZW0uYnVmZmVyZWRQaGV0aW9PYmplY3RzWyB1bmxhdW5jaGVkUGhldGlvSURzLmluZGV4T2YoIHBoZXRpb0lEICkgXTtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGhldGlvT2JqZWN0LCAnc2hvdWxkIGhhdmUgYSBwaGV0aW9PYmplY3QgaGVyZScgKTtcclxuXHJcbiAgICAgICAgLy8gT3JkZXIgbWF0dGVycyBoZXJlISBUaGUgcGhldGlvSXNBcmNoZXR5cGUgbmVlZHMgdG8gYmUgZmlyc3QgdG8gZW5zdXJlIHRoYXQgdGhlIHNldFBoZXRpb0R5bmFtaWNFbGVtZW50XHJcbiAgICAgICAgLy8gc2V0dGVyIGNhbiBvcHQgb3V0IGZvciBhcmNoZXR5cGVzLlxyXG4gICAgICAgIHBoZXRpb09iamVjdC5waGV0aW9Jc0FyY2hldHlwZSA9IHRoaXMucGhldGlvSXNBcmNoZXR5cGU7XHJcbiAgICAgICAgcGhldGlvT2JqZWN0LnNldFBoZXRpb0R5bmFtaWNFbGVtZW50KCB0aGlzLnBoZXRpb0R5bmFtaWNFbGVtZW50ICk7XHJcblxyXG4gICAgICAgIGlmICggcGhldGlvT2JqZWN0LnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEgKSB7XHJcbiAgICAgICAgICBwaGV0aW9PYmplY3QucGhldGlvQmFzZWxpbmVNZXRhZGF0YS5waGV0aW9Jc0FyY2hldHlwZSA9IHRoaXMucGhldGlvSXNBcmNoZXR5cGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIGluIFBoZXRpb0VuZ2luZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaGV0aW9EeW5hbWljRWxlbWVudCggcGhldGlvRHluYW1pY0VsZW1lbnQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5waGV0aW9Ob3RpZmllZE9iamVjdENyZWF0ZWQsICdzaG91bGQgbm90IGNoYW5nZSBkeW5hbWljIGVsZW1lbnQgZmxhZ3MgYWZ0ZXIgbm90aWZ5aW5nIHRoaXMgUGhldGlvT2JqZWN0XFwncyBjcmVhdGlvbi4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKTtcclxuXHJcbiAgICAvLyBBbGwgYXJjaGV0eXBlcyBhcmUgc3RhdGljIChub24tZHluYW1pYylcclxuICAgIHRoaXMuX3BoZXRpb0R5bmFtaWNFbGVtZW50ID0gdGhpcy5waGV0aW9Jc0FyY2hldHlwZSA/IGZhbHNlIDogcGhldGlvRHluYW1pY0VsZW1lbnQ7XHJcblxyXG4gICAgLy8gRm9yIGR5bmFtaWMgZWxlbWVudHMsIGluZGljYXRlIHRoZSBjb3JyZXNwb25kaW5nIGFyY2hldHlwZSBlbGVtZW50IHNvIHRoYXQgY2xpZW50cyBsaWtlIFN0dWRpbyBjYW4gbGV2ZXJhZ2VcclxuICAgIC8vIHRoZSBhcmNoZXR5cGUgbWV0YWRhdGEuIFN0YXRpYyBlbGVtZW50cyBkb24ndCBoYXZlIGFyY2hldHlwZXMuXHJcbiAgICB0aGlzLnBoZXRpb0FyY2hldHlwZVBoZXRpb0lEID0gcGhldGlvRHluYW1pY0VsZW1lbnQgPyB0aGlzLnRhbmRlbS5nZXRBcmNoZXR5cGFsUGhldGlvSUQoKSA6IG51bGw7XHJcblxyXG4gICAgLy8gS2VlcCB0aGUgYmFzZWxpbmUgbWV0YWRhdGEgaW4gc3luYy5cclxuICAgIGlmICggdGhpcy5waGV0aW9CYXNlbGluZU1ldGFkYXRhICkge1xyXG4gICAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEucGhldGlvRHluYW1pY0VsZW1lbnQgPSB0aGlzLnBoZXRpb0R5bmFtaWNFbGVtZW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFyayB0aGlzIFBoZXRpb09iamVjdCBhcyBhbiBhcmNoZXR5cGUgZm9yIGR5bmFtaWMgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIG1hcmtEeW5hbWljRWxlbWVudEFyY2hldHlwZSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnBoZXRpb05vdGlmaWVkT2JqZWN0Q3JlYXRlZCwgJ3Nob3VsZCBub3QgY2hhbmdlIGR5bmFtaWMgZWxlbWVudCBmbGFncyBhZnRlciBub3RpZnlpbmcgdGhpcyBQaGV0aW9PYmplY3RcXCdzIGNyZWF0aW9uLicgKTtcclxuXHJcbiAgICB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlID0gdHJ1ZTtcclxuICAgIHRoaXMuc2V0UGhldGlvRHluYW1pY0VsZW1lbnQoIGZhbHNlICk7IC8vIGJlY2F1c2UgYXJjaGV0eXBlcyBhcmVuJ3QgZHluYW1pYyBlbGVtZW50c1xyXG5cclxuICAgIGlmICggdGhpcy5waGV0aW9CYXNlbGluZU1ldGFkYXRhICkge1xyXG4gICAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEucGhldGlvSXNBcmNoZXR5cGUgPSB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlY29tcHV0ZSBmb3IgY2hpbGRyZW4gYWxzbywgYnV0IG9ubHkgaWYgcGhldC1pbyBpcyBlbmFibGVkXHJcbiAgICBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHRoaXMucHJvcGFnYXRlRHluYW1pY0ZsYWdzVG9EZXNjZW5kYW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBQaGV0aW9PYmplY3Qgd2lsbCBvbmx5IGJlIGluc3RydW1lbnRlZCBpZiB0aGUgdGFuZGVtIHRoYXQgd2FzIHBhc3NlZCBpbiB3YXMgXCJzdXBwbGllZFwiLiBTZWUgVGFuZGVtLnN1cHBsaWVkXHJcbiAgICogZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgaXNQaGV0aW9JbnN0cnVtZW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy50YW5kZW0gJiYgdGhpcy50YW5kZW0uc3VwcGxpZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIGFuIGluc3RydW1lbnRlZCBQaGV0aW9PYmplY3QgaXMgbGlua2VkIHdpdGggYW5vdGhlciBpbnN0cnVtZW50ZWQgUGhldGlvT2JqZWN0LCB0aGlzIGNyZWF0ZXMgYSBvbmUtd2F5XHJcbiAgICogYXNzb2NpYXRpb24gd2hpY2ggaXMgcmVuZGVyZWQgaW4gU3R1ZGlvIGFzIGEgXCJzeW1ib2xpY1wiIGxpbmsgb3IgaHlwZXJsaW5rLiBNYW55IGNvbW1vbiBjb2RlIFVJIGVsZW1lbnRzIHVzZSB0aGlzXHJcbiAgICogYXV0b21hdGljYWxseS4gVG8ga2VlcCBjbGllbnQgc2l0ZXMgc2ltcGxlLCB0aGlzIGhhcyBhIGdyYWNlZnVsIG9wdC1vdXQgbWVjaGFuaXNtIHdoaWNoIG1ha2VzIHRoaXMgZnVuY3Rpb24gYVxyXG4gICAqIG5vLW9wIGlmIGVpdGhlciB0aGlzIFBoZXRpb09iamVjdCBvciB0aGUgdGFyZ2V0IFBoZXRpb09iamVjdCBpcyBub3QgaW5zdHJ1bWVudGVkLlxyXG4gICAqXHJcbiAgICogWW91IGNhbiBzcGVjaWZ5IHRoZSB0YW5kZW0gb25lIG9mIHRocmVlIHdheXM6XHJcbiAgICogMS4gV2l0aG91dCBzcGVjaWZ5aW5nIHRhbmRlbU5hbWUgb3IgdGFuZGVtLCBpdCB3aWxsIHBsdWNrIHRoZSB0YW5kZW0ubmFtZSBmcm9tIHRoZSB0YXJnZXQgZWxlbWVudFxyXG4gICAqIDIuIElmIHRhbmRlbU5hbWUgaXMgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zLCBpdCB3aWxsIHVzZSB0aGF0IHRhbmRlbSBuYW1lIGFuZCBuZXN0IHRoZSB0YW5kZW0gdW5kZXIgdGhpcyBQaGV0aW9PYmplY3QncyB0YW5kZW1cclxuICAgKiAzLiBJZiB0YW5kZW0gaXMgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zIChub3QgcmVjb21tZW5kZWQpLCBpdCB3aWxsIHVzZSB0aGF0IHRhbmRlbSBhbmQgbmVzdCBpdCBhbnl3aGVyZSB0aGF0IHRhbmRlbSBleGlzdHMuXHJcbiAgICogICAgVXNlIHRoaXMgb3B0aW9uIHdpdGggY2F1dGlvbiBzaW5jZSBpdCBhbGxvd3MgeW91IHRvIG5lc3QgdGhlIHRhbmRlbSBhbnl3aGVyZSBpbiB0aGUgdHJlZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gdGhlIHRhcmdldCBlbGVtZW50LiBNdXN0IGJlIGluc3RydW1lbnRlZCBmb3IgYSBMaW5rZWRFbGVtZW50IHRvIGJlIGNyZWF0ZWQtLSBvdGhlcndpc2UgZ3JhY2VmdWxseSBvcHRzIG91dFxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRMaW5rZWRFbGVtZW50KCBlbGVtZW50OiBQaGV0aW9PYmplY3QsIHByb3ZpZGVkT3B0aW9ucz86IExpbmtlZEVsZW1lbnRPcHRpb25zICk6IHZvaWQge1xyXG4gICAgaWYgKCAhdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgLy8gc2V0IHRoaXMgdG8gbnVsbCBzbyB0aGF0IHlvdSBjYW4ndCBhZGRMaW5rZWRFbGVtZW50IG9uIGFuIHVuaW5pdGlhbGl6ZWQgUGhldGlvT2JqZWN0IGFuZCB0aGVuIGluc3RydW1lbnRcclxuICAgICAgLy8gaXQgYWZ0ZXJ3YXJkLlxyXG4gICAgICB0aGlzLmxpbmtlZEVsZW1lbnRzID0gbnVsbDtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluIHNvbWUgY2FzZXMsIFVJIGNvbXBvbmVudHMgbmVlZCB0byBiZSB3aXJlZCB1cCB0byBhIHByaXZhdGUgKGludGVybmFsKSBQcm9wZXJ0eSB3aGljaCBzaG91bGQgbmVpdGhlciBiZVxyXG4gICAgLy8gaW5zdHJ1bWVudGVkIG5vciBsaW5rZWQuXHJcbiAgICBpZiAoIFBIRVRfSU9fRU5BQkxFRCAmJiBlbGVtZW50LmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKSB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TGlua2VkRWxlbWVudE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIGxpbmthZ2UgaXMgb25seSBmZWF0dXJlZCBpZiB0aGUgcGFyZW50IGFuZCB0aGUgZWxlbWVudCBhcmUgYm90aCBhbHNvIGZlYXR1cmVkXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IHRoaXMucGhldGlvRmVhdHVyZWQgJiYgZWxlbWVudC5waGV0aW9GZWF0dXJlZFxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggdGhpcy5saW5rZWRFbGVtZW50cyApLCAnbGlua2VkRWxlbWVudHMgc2hvdWxkIGJlIGFuIGFycmF5JyApO1xyXG5cclxuICAgICAgbGV0IHRhbmRlbTogVGFuZGVtIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgIGlmICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0gKSB7XHJcbiAgICAgICAgdGFuZGVtID0gcHJvdmlkZWRPcHRpb25zLnRhbmRlbTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW1OYW1lICkge1xyXG4gICAgICAgIHRhbmRlbSA9IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggcHJvdmlkZWRPcHRpb25zLnRhbmRlbU5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggIXByb3ZpZGVkT3B0aW9ucyAmJiBlbGVtZW50LnRhbmRlbSApIHtcclxuICAgICAgICB0YW5kZW0gPSB0aGlzLnRhbmRlbS5jcmVhdGVUYW5kZW0oIGVsZW1lbnQudGFuZGVtLm5hbWUgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0YW5kZW0gKSB7XHJcbiAgICAgICAgb3B0aW9ucy50YW5kZW0gPSB0YW5kZW07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMubGlua2VkRWxlbWVudHMhLnB1c2goIG5ldyBMaW5rZWRFbGVtZW50KCBlbGVtZW50LCBvcHRpb25zICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhbGwgbGlua2VkIGVsZW1lbnRzIGxpbmtpbmcgdG8gdGhlIHByb3ZpZGVkIFBoZXRpb09iamVjdC4gVGhpcyB3aWxsIGRpc3Bvc2UgYWxsIHJlbW92ZWQgTGlua2VkRWxlbWVudHMuIFRoaXNcclxuICAgKiB3aWxsIGJlIGdyYWNlZnVsLCBhbmQgZG9lc24ndCBhc3N1bWUgb3IgYXNzZXJ0IHRoYXQgdGhlIHByb3ZpZGVkIFBoZXRpb09iamVjdCBoYXMgTGlua2VkRWxlbWVudChzKSwgaXQgd2lsbCBqdXN0XHJcbiAgICogcmVtb3ZlIHRoZW0gaWYgdGhleSBhcmUgdGhlcmUuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUxpbmtlZEVsZW1lbnRzKCBwb3RlbnRpYWxseUxpbmtlZEVsZW1lbnQ6IFBoZXRpb09iamVjdCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIHRoaXMubGlua2VkRWxlbWVudHMgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHBvdGVudGlhbGx5TGlua2VkRWxlbWVudC5pc1BoZXRpb0luc3RydW1lbnRlZCgpICk7XHJcblxyXG4gICAgICBjb25zdCB0b1JlbW92ZSA9IHRoaXMubGlua2VkRWxlbWVudHMuZmlsdGVyKCBsaW5rZWRFbGVtZW50ID0+IGxpbmtlZEVsZW1lbnQuZWxlbWVudCA9PT0gcG90ZW50aWFsbHlMaW5rZWRFbGVtZW50ICk7XHJcbiAgICAgIHRvUmVtb3ZlLmZvckVhY2goIGxpbmtlZEVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGxpbmtlZEVsZW1lbnQuZGlzcG9zZSgpO1xyXG4gICAgICAgIGFycmF5UmVtb3ZlKCB0aGlzLmxpbmtlZEVsZW1lbnRzISwgbGlua2VkRWxlbWVudCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQZXJmb3JtcyBjbGVhbnVwIGFmdGVyIHRoZSBzaW0ncyBjb25zdHJ1Y3Rpb24gaGFzIGZpbmlzaGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvblNpbXVsYXRpb25Db25zdHJ1Y3Rpb25Db21wbGV0ZWQoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gZGVsZXRlcyB0aGUgcGhldGlvQmFzZWxpbmVNZXRhZGF0YSwgYXMgaXQncyBubyBsb25nZXIgbmVlZGVkIHNpbmNlIHZhbGlkYXRpb24gaXMgY29tcGxldGUuXHJcbiAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGVhYmxlIHNvIHRoYXQgc3ViY2xhc3NlcyBjYW4gcmV0dXJuIGEgZGlmZmVyZW50IFBoZXRpb09iamVjdCBmb3Igc3R1ZGlvIGF1dG9zZWxlY3QuIFRoaXMgbWV0aG9kIGlzIGNhbGxlZFxyXG4gICAqIHdoZW4gdGhlcmUgaXMgYSBzY2VuZSBncmFwaCBoaXQuIFJldHVybiB0aGUgY29ycmVzcG9uZGluZyB0YXJnZXQgdGhhdCBtYXRjaGVzIHRoZSBQaEVULWlPIGZpbHRlcnMuICBOb3RlIHRoaXMgbWVhbnNcclxuICAgKiB0aGF0IGlmIFBoRVQtaU8gU3R1ZGlvIGlzIGxvb2tpbmcgZm9yIGEgZmVhdHVyZWQgaXRlbSBhbmQgdGhpcyBpcyBub3QgZmVhdHVyZWQsIGl0IHdpbGwgcmV0dXJuICdwaGV0aW9Ob3RTZWxlY3RhYmxlJy5cclxuICAgKiBTb21ldGhpbmcgaXMgJ3BoZXRpb05vdFNlbGVjdGFibGUnIGlmIGl0IGlzIG5vdCBpbnN0cnVtZW50ZWQgb3IgaWYgaXQgZG9lcyBub3QgbWF0Y2ggdGhlIFwiZmVhdHVyZWRcIiBmaWx0ZXJpbmcuXHJcbiAgICpcclxuICAgKiBUaGUgYGZyb21MaW5raW5nYCBmbGFnIGFsbG93cyBhIGN1dG9mZiB0byBwcmV2ZW50IHJlY3Vyc2l2ZSBsaW5raW5nIGNoYWlucyBpbiAnbGlua2VkJyBtb2RlLiBHaXZlbiB0aGVzZSBsaW5rZWQgZWxlbWVudHM6XHJcbiAgICogY2FyZE5vZGUgLT4gY2FyZCAtPiBjYXJkVmFsdWVQcm9wZXJ0eVxyXG4gICAqIFdlIGRvbid0IHdhbnQgJ2xpbmtlZCcgbW9kZSB0byBtYXAgZnJvbSBjYXJkTm9kZSBhbGwgdGhlIHdheSB0byBjYXJkVmFsdWVQcm9wZXJ0eSAoYXQgbGVhc3QgYXV0b21hdGljYWxseSksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy8zMDBcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nID0gZmFsc2UgKTogUGhldGlvT2JqZWN0IHwgJ3BoZXRpb05vdFNlbGVjdGFibGUnIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoZXQudGFuZGVtLnBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eS52YWx1ZSAhPT0gJ25vbmUnLCAnZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQgc2hvdWxkIG5vdCBiZSBjYWxsZWQgd2hlbiBwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkgaXMgbm9uZScgKTtcclxuXHJcbiAgICAvLyBEb24ndCBnZXQgYSBsaW5rZWQgZWxlbWVudCBmb3IgYSBsaW5rZWQgZWxlbWVudCAocmVjdXJzaXZlIGxpbmsgZWxlbWVudCBzZWFyY2hpbmcpXHJcbiAgICBpZiAoICFmcm9tTGlua2luZyAmJiBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdsaW5rZWQnICkge1xyXG4gICAgICBjb25zdCBsaW5rZWRFbGVtZW50ID0gdGhpcy5nZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpO1xyXG4gICAgICBpZiAoIGxpbmtlZEVsZW1lbnQgIT09ICdub0NvcnJlc3BvbmRpbmdMaW5rZWRFbGVtZW50JyApIHtcclxuICAgICAgICByZXR1cm4gbGlua2VkRWxlbWVudC5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCggdHJ1ZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnRhbmRlbS5wYXJlbnRUYW5kZW0gKSB7XHJcbiAgICAgICAgLy8gTG9vayBmb3IgYSBzaWJsaW5nIGxpbmtlZEVsZW1lbnQgaWYgdGhlcmUgYXJlIG5vIGNoaWxkIGxpbmthZ2VzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N0dWRpby9pc3N1ZXMvMjQ2I2lzc3VlY29tbWVudC0xMDE4NzMzNDA4XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmVudDogUGhldGlvT2JqZWN0IHwgdW5kZWZpbmVkID0gcGhldC5waGV0aW8ucGhldGlvRW5naW5lLnBoZXRpb0VsZW1lbnRNYXBbIHRoaXMudGFuZGVtLnBhcmVudFRhbmRlbS5waGV0aW9JRCBdO1xyXG4gICAgICAgIGlmICggcGFyZW50ICkge1xyXG4gICAgICAgICAgY29uc3QgbGlua2VkUGFyZW50RWxlbWVudCA9IHBhcmVudC5nZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpO1xyXG4gICAgICAgICAgaWYgKCBsaW5rZWRQYXJlbnRFbGVtZW50ICE9PSAnbm9Db3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCcgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsaW5rZWRQYXJlbnRFbGVtZW50LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCB0cnVlICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSB2aWV3IGVsZW1lbnQsIGRvbid0IHJldHVybiBoZXJlXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICByZXR1cm4gJ3BoZXRpb05vdFNlbGVjdGFibGUnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0U2VsZigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIGlmIHRoaXMgaW5zdGFuY2Ugc2hvdWxkIGJlIHNlbGVjdGFibGVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXRTZWxmKCk6IFBoZXRpb09iamVjdCB8ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1BoZXRpb01vdXNlSGl0U2VsZWN0YWJsZSgpID8gdGhpcyA6ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZhY3RvcmVkIG91dCBmdW5jdGlvbiByZXR1cm5pbmcgaWYgdGhpcyBpbnN0YW5jZSBpcyBwaGV0aW8gc2VsZWN0YWJsZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgaXNQaGV0aW9Nb3VzZUhpdFNlbGVjdGFibGUoKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gV2UgYXJlIG5vdCBzZWxlY3RhYmxlIGlmIHdlIGFyZSB1bmZlYXR1cmVkIGFuZCB3ZSBhcmUgb25seSBkaXNwbGF5aW5nIGZlYXR1cmVkIGVsZW1lbnRzLlxyXG4gICAgLy8gVG8gcHJldmVudCBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuIFdlIG5lZWQgdG8gaGF2ZSBhIFByb3BlcnR5ICh3aGljaCBpcyBhIFBoZXRpb09iamVjdCkgaW4gb3JkZXIgdG8gdXNlIGl0LlxyXG4gICAgLy8gVGhpcyBzaG91bGQgcmVtYWluIGEgaGFyZCBmYWlsdXJlIGlmIHdlIGhhdmUgbm90IGxvYWRlZCB0aGlzIGRpc3BsYXkgUHJvcGVydHkgYnkgdGhlIHRpbWUgd2Ugd2FudCBhIG1vdXNlLWhpdCB0YXJnZXQuXHJcbiAgICBjb25zdCBmZWF0dXJlZEZpbHRlckNvcnJlY3QgPSBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50c0Rpc3BsYXlQcm9wZXJ0eS52YWx1ZSAhPT0gJ2ZlYXR1cmVkJyB8fCB0aGlzLmlzRGlzcGxheWVkSW5GZWF0dXJlZFRyZWUoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIGZlYXR1cmVkRmlsdGVyQ29ycmVjdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBub3Qgb25seSBpZiB0aGlzIFBoZXRpb09iamVjdCBpcyBwaGV0aW9GZWF0dXJlZCwgYnV0IGlmIGFueSBkZXNjZW5kYW50IG9mIHRoaXNcclxuICAgKiBQaGV0aW9PYmplY3QgaXMgcGhldGlvRmVhdHVyZWQsIHRoaXMgd2lsbCBpbmZsdWVuY2UgaWYgdGhpcyBpbnN0YW5jZSBpcyBkaXNwbGF5ZWQgd2hpbGUgc2hvd2luZyBwaGV0aW9GZWF0dXJlZCxcclxuICAgKiBzaW5jZSBmZWF0dXJlZCBjaGlsZHJlbiB3aWxsIGNhdXNlIHRoZSBwYXJlbnQgdG8gYmUgZGlzcGxheWVkIGFzIHdlbGwuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpc0Rpc3BsYXllZEluRmVhdHVyZWRUcmVlKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgJiYgdGhpcy5waGV0aW9GZWF0dXJlZCApIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBsZXQgZGlzcGxheWVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIGRlc2NlbmRhbnRUYW5kZW0gPT4ge1xyXG4gICAgICBjb25zdCBwYXJlbnQ6IFBoZXRpb09iamVjdCB8IHVuZGVmaW5lZCA9IHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9FbGVtZW50TWFwWyBkZXNjZW5kYW50VGFuZGVtLnBoZXRpb0lEIF07XHJcbiAgICAgIGlmICggcGFyZW50ICYmIHBhcmVudC5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIHBhcmVudC5waGV0aW9GZWF0dXJlZCApIHtcclxuICAgICAgICBkaXNwbGF5ZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICByZXR1cm4gZGlzcGxheWVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWNxdWlyZSB0aGUgbGlua2VkRWxlbWVudCB0aGF0IG1vc3QgY2xvc2VseSByZWxhdGVzIHRvIHRoaXMgUGhldGlvT2JqZWN0LCBnaXZlbiBzb21lIGhldXJpc3RpY3MuIEZpcnN0LCBpZiB0aGVyZSBpc1xyXG4gICAqIG9ubHkgYSBzaW5nbGUgTGlua2VkRWxlbWVudCBjaGlsZCwgdXNlIHRoYXQuIE90aGVyd2lzZSwgc2VsZWN0IGhhcmQgY29kZWQgbmFtZXMgdGhhdCBhcmUgbGlrZWx5IHRvIGJlIG1vc3QgaW1wb3J0YW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpOiBQaGV0aW9PYmplY3QgfCAnbm9Db3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCcge1xyXG4gICAgY29uc3QgY2hpbGRyZW4gPSBPYmplY3Qua2V5cyggdGhpcy50YW5kZW0uY2hpbGRyZW4gKTtcclxuICAgIGNvbnN0IGxpbmtlZENoaWxkcmVuOiBMaW5rZWRFbGVtZW50W10gPSBbXTtcclxuICAgIGNoaWxkcmVuLmZvckVhY2goIGNoaWxkTmFtZSA9PiB7XHJcbiAgICAgIGNvbnN0IGNoaWxkUGhldGlvSUQgPSBwaGV0aW8uUGhldGlvSURVdGlscy5hcHBlbmQoIHRoaXMudGFuZGVtLnBoZXRpb0lELCBjaGlsZE5hbWUgKTtcclxuXHJcbiAgICAgIC8vIE5vdGUgdGhhdCBpZiBpdCBkb2Vzbid0IGZpbmQgYSBwaGV0aW9JRCwgdGhhdCBtYXkgYmUgYSBzeW50aGV0aWMgbm9kZSB3aXRoIGNoaWxkcmVuIGJ1dCBub3QgaXRzZWxmIGluc3RydW1lbnRlZC5cclxuICAgICAgY29uc3QgcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgfCB1bmRlZmluZWQgPSBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmUucGhldGlvRWxlbWVudE1hcFsgY2hpbGRQaGV0aW9JRCBdO1xyXG4gICAgICBpZiAoIHBoZXRpb09iamVjdCBpbnN0YW5jZW9mIExpbmtlZEVsZW1lbnQgKSB7XHJcbiAgICAgICAgbGlua2VkQ2hpbGRyZW4ucHVzaCggcGhldGlvT2JqZWN0ICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIGNvbnN0IGxpbmtlZFRhbmRlbU5hbWVzID0gbGlua2VkQ2hpbGRyZW4ubWFwKCAoIGxpbmtlZEVsZW1lbnQ6IExpbmtlZEVsZW1lbnQgKTogc3RyaW5nID0+IHtcclxuICAgICAgcmV0dXJuIHBoZXRpby5QaGV0aW9JRFV0aWxzLmdldENvbXBvbmVudE5hbWUoIGxpbmtlZEVsZW1lbnQucGhldGlvSUQgKTtcclxuICAgIH0gKTtcclxuICAgIGxldCBsaW5rZWRDaGlsZDogTGlua2VkRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBsaW5rZWRDaGlsZHJlbi5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgIGxpbmtlZENoaWxkID0gbGlua2VkQ2hpbGRyZW5bIDAgXTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBsaW5rZWRUYW5kZW1OYW1lcy5pbmNsdWRlcyggJ3Byb3BlcnR5JyApICkge1xyXG5cclxuICAgICAgLy8gUHJpb3JpdGl6ZSBhIGxpbmtlZCBjaGlsZCBuYW1lZCBcInByb3BlcnR5XCJcclxuICAgICAgbGlua2VkQ2hpbGQgPSBsaW5rZWRDaGlsZHJlblsgbGlua2VkVGFuZGVtTmFtZXMuaW5kZXhPZiggJ3Byb3BlcnR5JyApIF07XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGlua2VkVGFuZGVtTmFtZXMuaW5jbHVkZXMoICd2YWx1ZVByb3BlcnR5JyApICkge1xyXG5cclxuICAgICAgLy8gTmV4dCBwcmlvcml0aXplIFwidmFsdWVQcm9wZXJ0eVwiLCBhIGNvbW1vbiBuYW1lIGZvciB0aGUgY29udHJvbGxpbmcgUHJvcGVydHkgb2YgYSB2aWV3IGNvbXBvbmVudFxyXG4gICAgICBsaW5rZWRDaGlsZCA9IGxpbmtlZENoaWxkcmVuWyBsaW5rZWRUYW5kZW1OYW1lcy5pbmRleE9mKCAndmFsdWVQcm9wZXJ0eScgKSBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBFaXRoZXIgdGhlcmUgYXJlIG5vIGxpbmtlZCBjaGlsZHJlbiwgb3IgdG9vIG1hbnkgdG8ga25vdyB3aGljaCBvbmUgdG8gc2VsZWN0LlxyXG4gICAgICByZXR1cm4gJ25vQ29ycmVzcG9uZGluZ0xpbmtlZEVsZW1lbnQnO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpbmtlZENoaWxkLCAncGhldGlvRWxlbWVudCBpcyBuZWVkZWQnICk7XHJcbiAgICByZXR1cm4gbGlua2VkQ2hpbGQuZWxlbWVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSB0aGlzIHBoZXRpb09iamVjdCBmcm9tIFBoRVQtaU8uIEFmdGVyIGRpc3Bvc2FsLCB0aGlzIG9iamVjdCBpcyBubyBsb25nZXIgaW50ZXJvcGVyYWJsZS4gQWxzbyByZWxlYXNlIGFueVxyXG4gICAqIG90aGVyIHJlZmVyZW5jZXMgY3JlYXRlZCBkdXJpbmcgaXRzIGxpZmV0aW1lLlxyXG4gICAqXHJcbiAgICogSW4gb3JkZXIgdG8gc3VwcG9ydCB0aGUgc3RydWN0dXJlZCBkYXRhIHN0cmVhbSwgUGhldGlvT2JqZWN0cyBtdXN0IGVuZCB0aGUgbWVzc2FnZXMgaW4gdGhlIGNvcnJlY3RcclxuICAgKiBzZXF1ZW5jZSwgd2l0aG91dCBiZWluZyBpbnRlcnJ1cHRlZCBieSBkaXNwb3NlKCkgY2FsbHMuICBUaGVyZWZvcmUsIHdlIGRvIG5vdCBjbGVhciBvdXQgYW55IG9mIHRoZSBzdGF0ZVxyXG4gICAqIHJlbGF0ZWQgdG8gdGhlIGVuZEV2ZW50LiAgTm90ZSB0aGlzIG1lYW5zIGl0IGlzIGFjY2VwdGFibGUgKGFuZCBleHBlY3RlZCkgZm9yIGVuZEV2ZW50KCkgdG8gYmUgY2FsbGVkIG9uXHJcbiAgICogZGlzcG9zZWQgUGhldGlvT2JqZWN0cy5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUaGUgcGhldGlvRXZlbnQgc3RhY2sgc2hvdWxkIHJlc29sdmUgYnkgdGhlIG5leHQgZnJhbWUsIHNvIHRoYXQncyB3aGVuIHdlIGNoZWNrIGl0LlxyXG4gICAgaWYgKCBhc3NlcnQgJiYgVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLnRhbmRlbS5zdXBwbGllZCApIHtcclxuXHJcbiAgICAgIGNvbnN0IGRlc2NlbmRhbnRzOiBQaGV0aW9PYmplY3RbXSA9IFtdO1xyXG4gICAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIHRhbmRlbSA9PiB7XHJcbiAgICAgICAgaWYgKCBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmUuaGFzUGhldGlvT2JqZWN0KCB0YW5kZW0ucGhldGlvSUQgKSApIHtcclxuICAgICAgICAgIGRlc2NlbmRhbnRzLnB1c2goIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5nZXRQaGV0aW9FbGVtZW50KCB0YW5kZW0ucGhldGlvSUQgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgYW5pbWF0aW9uRnJhbWVUaW1lci5ydW5Pbk5leHRUaWNrKCAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFVuaW5zdHJ1bWVudGVkIFBoZXRpb09iamVjdHMgZG9uJ3QgaGF2ZSBhIHBoZXRpb01lc3NhZ2VTdGFjayBhdHRyaWJ1dGUuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaGFzT3duUHJvcGVydHkoICdwaGV0aW9NZXNzYWdlU3RhY2snICkgfHwgdGhpcy5waGV0aW9NZXNzYWdlU3RhY2subGVuZ3RoID09PSAwLFxyXG4gICAgICAgICAgJ3BoZXRpb01lc3NhZ2VTdGFjayBzaG91bGQgYmUgY2xlYXInICk7XHJcblxyXG4gICAgICAgIGRlc2NlbmRhbnRzLmZvckVhY2goIGRlc2NlbmRhbnQgPT4ge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZGVzY2VuZGFudC5pc0Rpc3Bvc2VkLCBgQWxsIGRlc2NlbmRhbnRzIG11c3QgYmUgZGlzcG9zZWQgYnkgdGhlIG5leHQgZnJhbWU6ICR7ZGVzY2VuZGFudC50YW5kZW0ucGhldGlvSUR9YCApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggRU5BQkxFX0RFU0NSSVBUSU9OX1JFR0lTVFJZICYmIHRoaXMudGFuZGVtICYmIHRoaXMudGFuZGVtLnN1cHBsaWVkICkge1xyXG4gICAgICBEZXNjcmlwdGlvblJlZ2lzdHJ5LnJlbW92ZSggdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGFjaCBmcm9tIGxpc3RlbmVycyBhbmQgZGlzcG9zZSB0aGUgY29ycmVzcG9uZGluZyB0YW5kZW0uIFRoaXMgbXVzdCBoYXBwZW4gaW4gUGhFVC1pTyBicmFuZCBhbmQgUGhFVCBicmFuZFxyXG4gICAgLy8gYmVjYXVzZSBpbiBQaEVUIGJyYW5kLCBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lciBkeW5hbWljIGVsZW1lbnRzIHdvdWxkIG1lbW9yeSBsZWFrIHRhbmRlbXMgKHBhcmVudCB0YW5kZW1zXHJcbiAgICAvLyB3b3VsZCByZXRhaW4gcmVmZXJlbmNlcyB0byB0aGVpciBjaGlsZHJlbikuXHJcbiAgICB0aGlzLnRhbmRlbS5yZW1vdmVQaGV0aW9PYmplY3QoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBEaXNwb3NlIExpbmtlZEVsZW1lbnRzXHJcbiAgICBpZiAoIHRoaXMubGlua2VkRWxlbWVudHMgKSB7XHJcbiAgICAgIHRoaXMubGlua2VkRWxlbWVudHMuZm9yRWFjaCggbGlua2VkRWxlbWVudCA9PiBsaW5rZWRFbGVtZW50LmRpc3Bvc2UoKSApO1xyXG4gICAgICB0aGlzLmxpbmtlZEVsZW1lbnRzLmxlbmd0aCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSlNPTmlmaWFibGUgbWV0YWRhdGEgdGhhdCBkZXNjcmliZXMgdGhlIG5hdHVyZSBvZiB0aGUgUGhldGlvT2JqZWN0LiAgV2UgbXVzdCBiZSBhYmxlIHRvIHJlYWQgdGhpc1xyXG4gICAqIGZvciBiYXNlbGluZSAoYmVmb3JlIG9iamVjdCBmdWxseSBjb25zdHJ1Y3RlZCB3ZSB1c2Ugb2JqZWN0KSBhbmQgYWZ0ZXIgZnVsbHkgY29uc3RydWN0ZWRcclxuICAgKiB3aGljaCBpbmNsdWRlcyBvdmVycmlkZXMuXHJcbiAgICogQHBhcmFtIFtvYmplY3RdIC0gdXNlZCB0byBnZXQgbWV0YWRhdGEga2V5cywgY2FuIGJlIGEgUGhldGlvT2JqZWN0LCBvciBhbiBvcHRpb25zIG9iamVjdFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAoc2VlIHVzYWdlIGluaXRpYWxpemVQaGV0aW9PYmplY3QpLiBJZiBub3QgcHJvdmlkZWQsIHdpbGwgaW5zdGVhZCB1c2UgdGhlIHZhbHVlIG9mIFwidGhpc1wiXHJcbiAgICogQHJldHVybnMgLSBtZXRhZGF0YSBwbHVja2VkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWV0YWRhdGEoIG9iamVjdD86IFBoZXRpb09iamVjdE1ldGFkYXRhSW5wdXQgKTogUGhldGlvRWxlbWVudE1ldGFkYXRhIHtcclxuICAgIG9iamVjdCA9IG9iamVjdCB8fCB0aGlzO1xyXG4gICAgY29uc3QgbWV0YWRhdGE6IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSA9IHtcclxuICAgICAgcGhldGlvVHlwZU5hbWU6IG9iamVjdC5waGV0aW9UeXBlLnR5cGVOYW1lLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiBvYmplY3QucGhldGlvRG9jdW1lbnRhdGlvbixcclxuICAgICAgcGhldGlvU3RhdGU6IG9iamVjdC5waGV0aW9TdGF0ZSxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9iamVjdC5waGV0aW9SZWFkT25seSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUucGhldGlvVHlwZS50b1N0YXRlT2JqZWN0KCBvYmplY3QucGhldGlvRXZlbnRUeXBlICksXHJcbiAgICAgIHBoZXRpb0hpZ2hGcmVxdWVuY3k6IG9iamVjdC5waGV0aW9IaWdoRnJlcXVlbmN5LFxyXG4gICAgICBwaGV0aW9QbGF5YmFjazogb2JqZWN0LnBoZXRpb1BsYXliYWNrLFxyXG4gICAgICBwaGV0aW9EeW5hbWljRWxlbWVudDogb2JqZWN0LnBoZXRpb0R5bmFtaWNFbGVtZW50LFxyXG4gICAgICBwaGV0aW9Jc0FyY2hldHlwZTogb2JqZWN0LnBoZXRpb0lzQXJjaGV0eXBlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogb2JqZWN0LnBoZXRpb0ZlYXR1cmVkLFxyXG4gICAgICBwaGV0aW9EZXNpZ25lZDogb2JqZWN0LnBoZXRpb0Rlc2lnbmVkXHJcbiAgICB9O1xyXG4gICAgaWYgKCBvYmplY3QucGhldGlvQXJjaGV0eXBlUGhldGlvSUQgKSB7XHJcblxyXG4gICAgICBtZXRhZGF0YS5waGV0aW9BcmNoZXR5cGVQaGV0aW9JRCA9IG9iamVjdC5waGV0aW9BcmNoZXR5cGVQaGV0aW9JRDtcclxuICAgIH1cclxuICAgIHJldHVybiBtZXRhZGF0YTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYyBmYWNpbmcgZG9jdW1lbnRhdGlvbiwgbm8gbmVlZCB0byBpbmNsdWRlIG1ldGFkYXRhIHRoYXQgbWF5IHdlIGRvbid0IHdhbnQgY2xpZW50cyBrbm93aW5nIGFib3V0XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBNRVRBREFUQV9ET0NVTUVOVEFUSU9OID0gJ0dldCBtZXRhZGF0YSBhYm91dCB0aGUgUGhFVC1pTyBFbGVtZW50LiBUaGlzIGluY2x1ZGVzIHRoZSBmb2xsb3dpbmcga2V5czo8dWw+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb1R5cGVOYW1lOjwvc3Ryb25nPiBUaGUgbmFtZSBvZiB0aGUgUGhFVC1pTyBUeXBlXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvRG9jdW1lbnRhdGlvbjo8L3N0cm9uZz4gZGVmYXVsdCAtIG51bGwuIFVzZWZ1bCBub3RlcyBhYm91dCBhIFBoRVQtaU8gRWxlbWVudCwgc2hvd24gaW4gdGhlIFBoRVQtaU8gU3R1ZGlvIFdyYXBwZXI8L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5waGV0aW9TdGF0ZTo8L3N0cm9uZz4gZGVmYXVsdCAtIHRydWUuIFdoZW4gdHJ1ZSwgaW5jbHVkZXMgdGhlIFBoRVQtaU8gRWxlbWVudCBpbiB0aGUgUGhFVC1pTyBzdGF0ZVxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb1JlYWRPbmx5Ojwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIFdoZW4gdHJ1ZSwgeW91IGNhbiBvbmx5IGdldCB2YWx1ZXMgZnJvbSB0aGUgUGhFVC1pTyBFbGVtZW50OyBubyBzZXR0aW5nIGFsbG93ZWQuXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvRXZlbnRUeXBlOjwvc3Ryb25nPiBkZWZhdWx0IC0gTU9ERUwuIFRoZSBjYXRlZ29yeSBvZiBldmVudCB0aGF0IHRoaXMgZWxlbWVudCBlbWl0cyB0byB0aGUgUGhFVC1pTyBEYXRhIFN0cmVhbS5cXG48L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5waGV0aW9EeW5hbWljRWxlbWVudDo8L3N0cm9uZz4gZGVmYXVsdCAtIGZhbHNlLiBJZiB0aGlzIGVsZW1lbnQgaXMgYSBcImR5bmFtaWMgZWxlbWVudFwiIHRoYXQgY2FuIGJlIGNyZWF0ZWQgYW5kIGRlc3Ryb3llZCB0aHJvdWdob3V0IHRoZSBsaWZldGltZSBvZiB0aGUgc2ltIChhcyBvcHBvc2VkIHRvIGV4aXN0aW5nIGZvcmV2ZXIpLlxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb0lzQXJjaGV0eXBlOjwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIElmIHRoaXMgZWxlbWVudCBpcyBhbiBhcmNoZXR5cGUgZm9yIGEgZHluYW1pYyBlbGVtZW50LlxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb0ZlYXR1cmVkOjwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIElmIHRoaXMgaXMgYSBmZWF0dXJlZCBQaEVULWlPIEVsZW1lbnQuXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvQXJjaGV0eXBlUGhldGlvSUQ6PC9zdHJvbmc+IGRlZmF1bHQgLSBcXCdcXCcuIElmIGFuIGFwcGxpY2FibGUgZHluYW1pYyBlbGVtZW50LCB0aGlzIGlzIHRoZSBwaGV0aW9JRCBvZiBpdHMgYXJjaGV0eXBlLlxcbjwvbGk+PC91bD4nO1xyXG5cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGUoIG9wdGlvbnM/OiBQaGV0aW9PYmplY3RPcHRpb25zICk6IFBoZXRpb09iamVjdCB7XHJcbiAgICByZXR1cm4gbmV3IFBoZXRpb09iamVjdCggb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gU2VlIGRvY3VtZW50YXRpb24gZm9yIGFkZExpbmtlZEVsZW1lbnQoKSB0byBkZXNjcmliZSBob3cgdG8gaW5zdHJ1bWVudCBMaW5rZWRFbGVtZW50cy4gTm8gb3RoZXIgbWV0YWRhdGEgaXMgbmVlZGVkXHJcbi8vIGZvciBMaW5rZWRFbGVtZW50cywgYW5kIHNob3VsZCBpbnN0ZWFkIGJlIHByb3ZpZGVkIHRvIHRoZSBjb3JlRWxlbWVudC4gSWYgeW91IGZpbmQgYSBjYXNlIHdoZXJlIHlvdSB3YW50IHRvIHBhc3NcclxuLy8gYW5vdGhlciBvcHRpb24gdGhyb3VnaCwgcGxlYXNlIGRpc2N1c3Mgd2l0aCB5b3VyIGZyaWVuZGx5LCBuZWlnaGJvcmhvb2QgUGhFVC1pTyBkZXZlbG9wZXIuXHJcbnR5cGUgTGlua2VkRWxlbWVudE9wdGlvbnMgPSAoIHsgdGFuZGVtTmFtZT86IHN0cmluZzsgdGFuZGVtPzogbmV2ZXIgfSB8IHsgdGFuZGVtTmFtZT86IG5ldmVyOyB0YW5kZW0/OiBUYW5kZW0gfSApO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGNsYXNzIHRvIGF2b2lkIGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAqL1xyXG5jbGFzcyBMaW5rZWRFbGVtZW50IGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuICBwdWJsaWMgcmVhZG9ubHkgZWxlbWVudDogUGhldGlvT2JqZWN0O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvcmVFbGVtZW50OiBQaGV0aW9PYmplY3QsIHByb3ZpZGVkT3B0aW9ucz86IExpbmtlZEVsZW1lbnRPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISFjb3JlRWxlbWVudCwgJ2NvcmVFbGVtZW50IHNob3VsZCBiZSBkZWZpbmVkJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TGlua2VkRWxlbWVudE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuICAgICAgcGhldGlvVHlwZTogTGlua2VkRWxlbWVudElPLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIExpbmtlZEVsZW1lbnRzIGFyZSBhcyBmZWF0dXJlZCBhcyB0aGVpciBjb3JlRWxlbWVudHMgYXJlLlxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogY29yZUVsZW1lbnQucGhldGlvRmVhdHVyZWRcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFJlZmVyZW5jZXMgY2Fubm90IGJlIGNoYW5nZWQgYnkgUGhFVC1pT1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwaGV0aW9SZWFkT25seScgKSwgJ3BoZXRpb1JlYWRPbmx5IHNldCBieSBMaW5rZWRFbGVtZW50JyApO1xyXG4gICAgb3B0aW9ucy5waGV0aW9SZWFkT25seSA9IHRydWU7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmVsZW1lbnQgPSBjb3JlRWxlbWVudDtcclxuICB9XHJcbn1cclxuXHJcbnRhbmRlbU5hbWVzcGFjZS5yZWdpc3RlciggJ1BoZXRpb09iamVjdCcsIFBoZXRpb09iamVjdCApO1xyXG5leHBvcnQgeyBQaGV0aW9PYmplY3QgYXMgZGVmYXVsdCwgTGlua2VkRWxlbWVudCB9OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxtQkFBbUIsTUFBTSxzQ0FBc0M7QUFFdEUsT0FBT0MsUUFBUSxNQUFNLDJCQUEyQjtBQUNoRCxPQUFPQyxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLDhCQUE4QixNQUFNLHNEQUFzRDtBQUNqRyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUE2QyxpQ0FBaUM7QUFDaEgsT0FBT0MsU0FBUyxNQUFNLGdCQUFnQjtBQUN0QyxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLG1CQUFtQixNQUFNLDBCQUEwQjtBQUMxRCxPQUFPQyxNQUFNLE1BQU0sYUFBYTtBQUNoQyxPQUFPQyxlQUFlLE1BQTJDLHNCQUFzQjtBQUN2RixPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLE1BQU0sTUFBTSxtQkFBbUI7QUFFdEMsT0FBT0MsVUFBVSxNQUE2Qiw2QkFBNkI7QUFDM0UsT0FBT0MsbUJBQW1C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