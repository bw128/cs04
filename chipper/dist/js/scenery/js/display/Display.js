// Copyright 2013-2024, University of Colorado Boulder

/**
 * A persistent display of a specific Node and its descendants, which is updated at discrete points in time.
 *
 * Use display.getDOMElement or display.domElement to retrieve the Display's DOM representation.
 * Use display.updateDisplay() to trigger the visual update in the Display's DOM element.
 *
 * A standard way of using a Display with Scenery is to:
 * 1. Create a Node that will be the root
 * 2. Create a Display, referencing that node
 * 3. Make changes to the scene graph
 * 4. Call display.updateDisplay() to draw the scene graph into the Display
 * 5. Go to (3)
 *
 * Common ways to simplify the change/update loop would be to:
 * - Use Node-based events. Initialize it with Display.initializeEvents(), then
 *   add input listeners to parts of the scene graph (see Node.addInputListener).
 * - Execute code (and update the display afterwards) by using Display.updateOnRequestAnimationFrame.
 *
 * Internal documentation:
 *
 * Lifecycle information:
 *   Instance (create,dispose)
 *     - out of update:            Stateless stub is created synchronously when a Node's children are added where we
 *                                 have no relevant Instance.
 *     - start of update:          Creates first (root) instance if it doesn't exist (stateless stub).
 *     - synctree:                 Create descendant instances under stubs, fills in state, and marks removed subtree
 *                                 roots for disposal.
 *     - update instance disposal: Disposes root instances that were marked. This also disposes all descendant
 *                                 instances, and for every instance,
 *                                 it disposes the currently-attached drawables.
 *   Drawable (create,dispose)
 *     - synctree:                 Creates all drawables where necessary. If it replaces a self/group/shared drawable on
 *                                 the instance,
 *                                 that old drawable is marked for disposal.
 *     - update instance disposal: Any drawables attached to disposed instances are disposed themselves (see Instance
 *                                 lifecycle).
 *     - update drawable disposal: Any marked drawables that were replaced or removed from an instance (it didn't
 *                                 maintain a reference) are disposed.
 *
 *   add/remove drawables from blocks:
 *     - stitching changes pending "parents", marks for block update
 *     - backbones marked for disposal (e.g. instance is still there, just changed to not have a backbone) will mark
 *         drawables for block updates
 *     - add/remove drawables phase updates drawables that were marked
 *     - disposed backbone instances will only remove drawables if they weren't marked for removal previously (e.g. in
 *         case we are from a removed instance)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Emitter from '../../../axon/js/Emitter.js';
import stepTimer from '../../../axon/js/stepTimer.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
import Dimension2 from '../../../dot/js/Dimension2.js';
import { Matrix3Type } from '../../../dot/js/Matrix3.js';
import escapeHTML from '../../../phet-core/js/escapeHTML.js';
import optionize from '../../../phet-core/js/optionize.js';
import platform from '../../../phet-core/js/platform.js';
import AriaLiveAnnouncer from '../../../utterance-queue/js/AriaLiveAnnouncer.js';
import UtteranceQueue from '../../../utterance-queue/js/UtteranceQueue.js';
import { BackboneDrawable, Block, CanvasBlock, CanvasNodeBoundsOverlay, Color, DOMBlock, DOMDrawable, Features, FittedBlockBoundsOverlay, FocusManager, FullScreen, globalKeyStateTracker, HighlightOverlay, HitAreaOverlay, Input, Instance, KeyboardUtils, Node, PDOMInstance, PDOMSiblingStyle, PDOMTree, PDOMUtils, PointerAreaOverlay, PointerOverlay, Renderer, scenery, scenerySerialize, Trail, Utils, WebGLBlock } from '../imports.js';
import SafariWorkaroundOverlay from '../overlays/SafariWorkaroundOverlay.js';
const CUSTOM_CURSORS = {
  'scenery-grab-pointer': ['grab', '-moz-grab', '-webkit-grab', 'pointer'],
  'scenery-grabbing-pointer': ['grabbing', '-moz-grabbing', '-webkit-grabbing', 'pointer']
};
let globalIdCounter = 1;
export default class Display {
  // unique ID for the display instance, (scenery-internal), and useful for debugging with multiple displays.

  // The (integral, > 0) dimensions of the Display's DOM element (only updates the DOM element on updateDisplay())

  // data structure for managing aria-live alerts the this Display instance

  // Manages the various types of Focus that can go through the Display, as well as Properties
  // controlling which forms of focus should be displayed in the HighlightOverlay.

  // (phet-io,scenery) - Will be filled in with a phet.scenery.Input if event handling is enabled

  // (scenery-internal) Whether accessibility is enabled for this particular display.

  // (scenery-internal)

  // (scenery-internal) map from Node ID to Instance, for fast lookup

  // (scenery-internal) - We have a monotonically-increasing frame ID, generally for use with a pattern
  // where we can mark objects with this to note that they are either up-to-date or need refreshing due to this
  // particular frame (without having to clear that information after use). This is incremented every frame

  // (scenery-internal)

  // to be filled in later

  // will be filled with the root Instance

  // Used to check against new size to see what we need to change

  // At the end of Display.update, reduceReferences will be called on all of these. It's meant to
  // catch various objects that would usually have update() called, but if they are invisible or otherwise not updated
  // for performance, they may need to release references another way instead.
  // See https://github.com/phetsims/energy-forms-and-changes/issues/356

  // Block changes are handled by changing the "pending" block/backbone on drawables. We
  // want to change them all after the main stitch process has completed, so we can guarantee that a single drawable is
  // removed from its previous block before being added to a new one. This is taken care of in an updateDisplay pass
  // after syncTree / stitching.

  // Drawables have two implicit linked-lists, "current" and "old". syncTree modifies the
  // "current" linked-list information so it is up-to-date, but needs to use the "old" information also. We move
  // updating the "current" => "old" linked-list information until after syncTree and stitching is complete, and is
  // taken care of in an updateDisplay pass.

  // We store information on {ChangeInterval}s that records change interval
  // information, that may contain references. We don't want to leave those references dangling after we don't need
  // them, so they are recorded and cleaned in one of updateDisplay's phases.

  // Used for shortcut animation frame functions

  // Listeners that will be called for every event.

  // Whether mouse/touch/keyboard inputs are enabled (if input has been added). Simulation will still step.

  // Passed through to Input

  // Overlays currently being displayed.

  // @assertion-only - Whether we are running the paint phase of updateDisplay() for this Display.

  // @assertion-only

  // @assertion-only Whether disposal has started (but not finished)

  // If accessible

  // (scenery-internal, if accessible)

  // (if accessible)

  // If logging performance

  // (scenery-internal) When fired, forces an SVG refresh, to try to work around issues
  // like https://github.com/phetsims/scenery/issues/1507
  _refreshSVGEmitter = new Emitter();

  // If true, we will refresh the SVG elements on the next frame
  _refreshSVGPending = false;

  /**
   * Constructs a Display that will show the rootNode and its subtree in a visual state. Default options provided below
   *
   * @param rootNode - Displays this node and all of its descendants
   * @param [providedOptions]
   */
  constructor(rootNode, providedOptions) {
    assert && assert(rootNode, 'rootNode is a required parameter');

    //OHTWO TODO: hybrid batching (option to batch until an event like 'up' that might be needed for security issues) https://github.com/phetsims/scenery/issues/1581

    const options = optionize()({
      // {number} - Initial display width
      width: providedOptions && providedOptions.container && providedOptions.container.clientWidth || 640,
      // {number} - Initial display height
      height: providedOptions && providedOptions.container && providedOptions.container.clientHeight || 480,
      // {boolean} - Applies CSS styles to the root DOM element that make it amenable to interactive content
      allowCSSHacks: true,
      allowSafariRedrawWorkaround: false,
      // {boolean} - Usually anything displayed outside of our dom element is hidden with CSS overflow
      allowSceneOverflow: false,
      allowLayerFitting: false,
      forceSVGRefresh: false,
      // {string} - What cursor is used when no other cursor is specified
      defaultCursor: 'default',
      // {ColorDef} - Initial background color
      backgroundColor: null,
      // {boolean} - Whether WebGL will preserve the drawing buffer
      preserveDrawingBuffer: false,
      // {boolean} - Whether WebGL is enabled at all for drawables in this Display
      allowWebGL: true,
      // {boolean} - Enables accessibility features
      accessibility: true,
      // {boolean} - See declaration.
      supportsInteractiveHighlights: false,
      // {boolean} - Whether mouse/touch/keyboard inputs are enabled (if input has been added).
      interactive: true,
      // {boolean} - If true, input event listeners will be attached to the Display's DOM element instead of the window.
      // Normally, attaching listeners to the window is preferred (it will see mouse moves/ups outside of the browser
      // window, allowing correct button tracking), however there may be instances where a global listener is not
      // preferred.
      listenToOnlyElement: false,
      // {boolean} - Forwarded to Input: If true, most event types will be batched until otherwise triggered.
      batchDOMEvents: false,
      // {boolean} - If true, the input event location (based on the top-left of the browser tab's viewport, with no
      // scaling applied) will be used. Usually, this is not a safe assumption, so when false the location of the
      // display's DOM element will be used to get the correct event location. There is a slight performance hit to
      // doing so, thus this option is provided if the top-left location can be guaranteed.
      // NOTE: Rotation of the Display's DOM element (e.g. with a CSS transform) will result in an incorrect event
      //       mapping, as getBoundingClientRect() can't work with this. getBoxQuads() should fix this when browser
      //       support is available.
      assumeFullWindow: false,
      // {boolean} - Whether Scenery will try to aggressively re-create WebGL Canvas/context instead of waiting for
      // a context restored event. Sometimes context losses can occur without a restoration afterwards, but this can
      // jump-start the process.
      // See https://github.com/phetsims/scenery/issues/347.
      aggressiveContextRecreation: true,
      // {boolean|null} - Whether the `passive` flag should be set when adding and removing DOM event listeners.
      // See https://github.com/phetsims/scenery/issues/770 for more details.
      // If it is true or false, that is the value of the passive flag that will be used. If it is null, the default
      // behavior of the browser will be used.
      //
      // Safari doesn't support touch-action: none, so we NEED to not use passive events (which would not allow
      // preventDefault to do anything, so drags actually can scroll the sim).
      // Chrome also did the same "passive by default", but because we have `touch-action: none` in place, it doesn't
      // affect us, and we can potentially get performance improvements by allowing passive events.
      // See https://github.com/phetsims/scenery/issues/770 for more information.
      passiveEvents: platform.safari ? false : null,
      // {boolean} - Whether, if no WebGL antialiasing is detected, the backing scale can be increased so as to
      //             provide some antialiasing benefit. See https://github.com/phetsims/scenery/issues/859.
      allowBackingScaleAntialiasing: true
    }, providedOptions);
    this.id = globalIdCounter++;
    this._accessible = options.accessibility;
    this._preserveDrawingBuffer = options.preserveDrawingBuffer;
    this._allowWebGL = options.allowWebGL;
    this._allowCSSHacks = options.allowCSSHacks;
    this._allowSceneOverflow = options.allowSceneOverflow;
    this._defaultCursor = options.defaultCursor;
    this.sizeProperty = new TinyProperty(new Dimension2(options.width, options.height));
    this._currentSize = new Dimension2(-1, -1);
    this._rootNode = rootNode;
    this._rootNode.addRootedDisplay(this);
    this._rootBackbone = null; // to be filled in later
    this._domElement = options.container ? BackboneDrawable.repurposeBackboneContainer(options.container) : BackboneDrawable.createDivBackbone();
    this._sharedCanvasInstances = {};
    this._baseInstance = null; // will be filled with the root Instance
    this._frameId = 0;
    this._dirtyTransformRoots = [];
    this._dirtyTransformRootsWithoutPass = [];
    this._instanceRootsToDispose = [];
    this._reduceReferencesNeeded = [];
    this._drawablesToDispose = [];
    this._drawablesToChangeBlock = [];
    this._drawablesToUpdateLinks = [];
    this._changeIntervalsToDispose = [];
    this._lastCursor = null;
    this._currentBackgroundCSS = null;
    this._backgroundColor = null;
    this._requestAnimationFrameID = 0;
    this._input = null;
    this._inputListeners = [];
    this._interactive = options.interactive;
    this._listenToOnlyElement = options.listenToOnlyElement;
    this._batchDOMEvents = options.batchDOMEvents;
    this._assumeFullWindow = options.assumeFullWindow;
    this._passiveEvents = options.passiveEvents;
    this._aggressiveContextRecreation = options.aggressiveContextRecreation;
    this._allowBackingScaleAntialiasing = options.allowBackingScaleAntialiasing;
    this._allowLayerFitting = options.allowLayerFitting;
    this._forceSVGRefresh = options.forceSVGRefresh;
    this._overlays = [];
    this._pointerOverlay = null;
    this._pointerAreaOverlay = null;
    this._hitAreaOverlay = null;
    this._canvasAreaBoundsOverlay = null;
    this._fittedBlockBoundsOverlay = null;
    if (assert) {
      this._isPainting = false;
      this._isDisposing = false;
      this._isDisposed = false;
    }
    this.applyCSSHacks();
    this.setBackgroundColor(options.backgroundColor);
    const ariaLiveAnnouncer = new AriaLiveAnnouncer();
    this.descriptionUtteranceQueue = new UtteranceQueue(ariaLiveAnnouncer, {
      initialize: this._accessible,
      featureSpecificAnnouncingControlPropertyName: 'descriptionCanAnnounceProperty'
    });
    if (platform.safari && options.allowSafariRedrawWorkaround) {
      this.addOverlay(new SafariWorkaroundOverlay(this));
    }
    this.focusManager = new FocusManager();

    // Features that require the HighlightOverlay
    if (this._accessible || options.supportsInteractiveHighlights) {
      this._focusRootNode = new Node();
      this._focusOverlay = new HighlightOverlay(this, this._focusRootNode, {
        pdomFocusHighlightsVisibleProperty: this.focusManager.pdomFocusHighlightsVisibleProperty,
        interactiveHighlightsVisibleProperty: this.focusManager.interactiveHighlightsVisibleProperty,
        readingBlockHighlightsVisibleProperty: this.focusManager.readingBlockHighlightsVisibleProperty
      });
      this.addOverlay(this._focusOverlay);
    }
    if (this._accessible) {
      this._rootPDOMInstance = PDOMInstance.pool.create(null, this, new Trail());
      sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`Display root instance: ${this._rootPDOMInstance.toString()}`);
      PDOMTree.rebuildInstanceTree(this._rootPDOMInstance);

      // add the accessible DOM as a child of this DOM element
      assert && assert(this._rootPDOMInstance.peer, 'Peer should be created from createFromPool');
      this._domElement.appendChild(this._rootPDOMInstance.peer.primarySibling);
      const ariaLiveContainer = ariaLiveAnnouncer.ariaLiveContainer;

      // add aria-live elements to the display
      this._domElement.appendChild(ariaLiveContainer);

      // set `user-select: none` on the aria-live container to prevent iOS text selection issue, see
      // https://github.com/phetsims/scenery/issues/1006
      // @ts-expect-error
      ariaLiveContainer.style[Features.userSelect] = 'none';

      // Prevent focus from being lost in FullScreen mode, listener on the globalKeyStateTracker
      // because tab navigation may happen before focus is within the PDOM. See handleFullScreenNavigation
      // for more.
      this._boundHandleFullScreenNavigation = this.handleFullScreenNavigation.bind(this);
      globalKeyStateTracker.keydownEmitter.addListener(this._boundHandleFullScreenNavigation);
    }
  }
  getDOMElement() {
    return this._domElement;
  }
  get domElement() {
    return this.getDOMElement();
  }

  /**
   * Updates the display's DOM element with the current visual state of the attached root node and its descendants
   */
  updateDisplay() {
    // @ts-expect-error scenery namespace
    if (sceneryLog && scenery.isLoggingPerformance()) {
      this.perfSyncTreeCount = 0;
      this.perfStitchCount = 0;
      this.perfIntervalCount = 0;
      this.perfDrawableBlockChangeCount = 0;
      this.perfDrawableOldIntervalCount = 0;
      this.perfDrawableNewIntervalCount = 0;
    }
    if (assert) {
      Display.assertSubtreeDisposed(this._rootNode);
    }
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`updateDisplay frame ${this._frameId}`);
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    const firstRun = !!this._baseInstance;

    // check to see whether contents under pointers changed (and if so, send the enter/exit events) to
    // maintain consistent state
    if (this._input) {
      // TODO: Should this be handled elsewhere? https://github.com/phetsims/scenery/issues/1581
      this._input.validatePointers();
    }
    if (this._accessible) {
      // update positioning of focusable peer siblings so they are discoverable on mobile assistive devices
      this._rootPDOMInstance.peer.updateSubtreePositioning();
    }

    // validate bounds for everywhere that could trigger bounds listeners. we want to flush out any changes, so that we can call validateBounds()
    // from code below without triggering side effects (we assume that we are not reentrant).
    this._rootNode.validateWatchedBounds();
    if (assertSlow) {
      this._accessible && this._rootPDOMInstance.auditRoot();
    }
    if (assertSlow) {
      this._rootNode._picker.audit();
    }

    // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
    this._baseInstance = this._baseInstance || Instance.createFromPool(this, new Trail(this._rootNode), true, false);
    this._baseInstance.baseSyncTree();
    if (firstRun) {
      // @ts-expect-error TODO instance https://github.com/phetsims/scenery/issues/1581
      this.markTransformRootDirty(this._baseInstance, this._baseInstance.isTransformed); // marks the transform root as dirty (since it is)
    }

    // update our drawable's linked lists where necessary
    while (this._drawablesToUpdateLinks.length) {
      this._drawablesToUpdateLinks.pop().updateLinks();
    }

    // clean change-interval information from instances, so we don't leak memory/references
    while (this._changeIntervalsToDispose.length) {
      this._changeIntervalsToDispose.pop().dispose();
    }
    this._rootBackbone = this._rootBackbone || this._baseInstance.groupDrawable;
    assert && assert(this._rootBackbone, 'We are guaranteed a root backbone as the groupDrawable on the base instance');
    assert && assert(this._rootBackbone === this._baseInstance.groupDrawable, 'We don\'t want the base instance\'s groupDrawable to change');
    if (assertSlow) {
      this._rootBackbone.audit(true, false, true);
    } // allow pending blocks / dirty

    sceneryLog && sceneryLog.Display && sceneryLog.Display('drawable block change phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    while (this._drawablesToChangeBlock.length) {
      const changed = this._drawablesToChangeBlock.pop().updateBlock();
      // @ts-expect-error scenery namespace
      if (sceneryLog && scenery.isLoggingPerformance() && changed) {
        this.perfDrawableBlockChangeCount++;
      }
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._rootBackbone.audit(false, false, true);
    } // allow only dirty
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }

    // pre-repaint phase: update relative transform information for listeners (notification) and precomputation where desired
    this.updateDirtyTransformRoots();
    // pre-repaint phase update visibility information on instances
    this._baseInstance.updateVisibility(true, true, true, false);
    if (assertSlow) {
      this._baseInstance.auditVisibility(true);
    }
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, true);
    }
    sceneryLog && sceneryLog.Display && sceneryLog.Display('instance root disposal phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    // dispose all of our instances. disposing the root will cause all descendants to also be disposed.
    // will also dispose attached drawables (self/group/etc.)
    while (this._instanceRootsToDispose.length) {
      this._instanceRootsToDispose.pop().dispose();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._rootNode.auditInstanceSubtreeForDisplay(this);
    } // make sure trails are valid

    sceneryLog && sceneryLog.Display && sceneryLog.Display('drawable disposal phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    // dispose all of our other drawables.
    while (this._drawablesToDispose.length) {
      this._drawablesToDispose.pop().dispose();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }
    if (assert) {
      assert(!this._isPainting, 'Display was already updating paint, may have thrown an error on the last update');
      this._isPainting = true;
    }

    // repaint phase
    //OHTWO TODO: can anything be updated more efficiently by tracking at the Display level? Remember, we have recursive updates so things get updated in the right order! https://github.com/phetsims/scenery/issues/1581
    sceneryLog && sceneryLog.Display && sceneryLog.Display('repaint phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    this._rootBackbone.update();
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assert) {
      this._isPainting = false;
    }
    if (assertSlow) {
      this._rootBackbone.audit(false, false, false);
    } // allow nothing
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }
    this.updateCursor();
    this.updateBackgroundColor();
    this.updateSize();
    if (this._overlays.length) {
      let zIndex = this._rootBackbone.lastZIndex;
      for (let i = 0; i < this._overlays.length; i++) {
        // layer the overlays properly
        const overlay = this._overlays[i];
        overlay.domElement.style.zIndex = '' + zIndex++;
        overlay.update();
      }
    }

    // After our update and disposals, we want to eliminate any memory leaks from anything that wasn't updated.
    while (this._reduceReferencesNeeded.length) {
      this._reduceReferencesNeeded.pop().reduceReferences();
    }
    this._frameId++;

    // @ts-expect-error TODO scenery namespace https://github.com/phetsims/scenery/issues/1581
    if (sceneryLog && scenery.isLoggingPerformance()) {
      const syncTreeMessage = `syncTree count: ${this.perfSyncTreeCount}`;
      if (this.perfSyncTreeCount > 500) {
        sceneryLog.PerfCritical && sceneryLog.PerfCritical(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 100) {
        sceneryLog.PerfMajor && sceneryLog.PerfMajor(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 20) {
        sceneryLog.PerfMinor && sceneryLog.PerfMinor(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 0) {
        sceneryLog.PerfVerbose && sceneryLog.PerfVerbose(syncTreeMessage);
      }
      const drawableBlockCountMessage = `drawable block changes: ${this.perfDrawableBlockChangeCount} for` + ` -${this.perfDrawableOldIntervalCount} +${this.perfDrawableNewIntervalCount}`;
      if (this.perfDrawableBlockChangeCount > 200) {
        sceneryLog.PerfCritical && sceneryLog.PerfCritical(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 60) {
        sceneryLog.PerfMajor && sceneryLog.PerfMajor(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 10) {
        sceneryLog.PerfMinor && sceneryLog.PerfMinor(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 0) {
        sceneryLog.PerfVerbose && sceneryLog.PerfVerbose(drawableBlockCountMessage);
      }
    }
    PDOMTree.auditPDOMDisplays(this.rootNode);
    if (this._forceSVGRefresh || this._refreshSVGPending) {
      this._refreshSVGPending = false;
      this.refreshSVG();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
  }

  // Used for Studio Autoselect to determine the leafiest PhET-iO Element under the mouse
  getPhetioElementAt(point) {
    const node = this._rootNode.getPhetioMouseHit(point);
    if (node === 'phetioNotSelectable') {
      return null;
    }
    if (node) {
      assert && assert(node.isPhetioInstrumented(), 'a PhetioMouseHit should be instrumented');
    }
    return node;
  }
  updateSize() {
    let sizeDirty = false;
    //OHTWO TODO: if we aren't clipping or setting background colors, can we get away with having a 0x0 container div and using absolutely-positioned children? https://github.com/phetsims/scenery/issues/1581
    if (this.size.width !== this._currentSize.width) {
      sizeDirty = true;
      this._currentSize.width = this.size.width;
      this._domElement.style.width = `${this.size.width}px`;
    }
    if (this.size.height !== this._currentSize.height) {
      sizeDirty = true;
      this._currentSize.height = this.size.height;
      this._domElement.style.height = `${this.size.height}px`;
    }
    if (sizeDirty && !this._allowSceneOverflow) {
      // to prevent overflow, we add a CSS clip
      //TODO: 0px => 0? https://github.com/phetsims/scenery/issues/1581
      this._domElement.style.clip = `rect(0px,${this.size.width}px,${this.size.height}px,0px)`;
    }
  }

  /**
   * Whether WebGL is allowed to be used in drawables for this Display
   */
  isWebGLAllowed() {
    return this._allowWebGL;
  }
  get webglAllowed() {
    return this.isWebGLAllowed();
  }
  getRootNode() {
    return this._rootNode;
  }
  get rootNode() {
    return this.getRootNode();
  }
  getRootBackbone() {
    assert && assert(this._rootBackbone);
    return this._rootBackbone;
  }
  get rootBackbone() {
    return this.getRootBackbone();
  }

  /**
   * The dimensions of the Display's DOM element
   */
  getSize() {
    return this.sizeProperty.value;
  }
  get size() {
    return this.getSize();
  }
  getBounds() {
    return this.size.toBounds();
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Changes the size that the Display's DOM element will be after the next updateDisplay()
   */
  setSize(size) {
    assert && assert(size.width % 1 === 0, 'Display.width should be an integer');
    assert && assert(size.width > 0, 'Display.width should be greater than zero');
    assert && assert(size.height % 1 === 0, 'Display.height should be an integer');
    assert && assert(size.height > 0, 'Display.height should be greater than zero');
    this.sizeProperty.value = size;
  }

  /**
   * Changes the size that the Display's DOM element will be after the next updateDisplay()
   */
  setWidthHeight(width, height) {
    this.setSize(new Dimension2(width, height));
  }

  /**
   * The width of the Display's DOM element
   */
  getWidth() {
    return this.size.width;
  }
  get width() {
    return this.getWidth();
  }
  set width(value) {
    this.setWidth(value);
  }

  /**
   * Sets the width that the Display's DOM element will be after the next updateDisplay(). Should be an integral value.
   */
  setWidth(width) {
    if (this.getWidth() !== width) {
      this.setSize(new Dimension2(width, this.getHeight()));
    }
    return this;
  }

  /**
   * The height of the Display's DOM element
   */
  getHeight() {
    return this.size.height;
  }
  get height() {
    return this.getHeight();
  }
  set height(value) {
    this.setHeight(value);
  }

  /**
   * Sets the height that the Display's DOM element will be after the next updateDisplay(). Should be an integral value.
   */
  setHeight(height) {
    if (this.getHeight() !== height) {
      this.setSize(new Dimension2(this.getWidth(), height));
    }
    return this;
  }

  /**
   * Will be applied to the root DOM element on updateDisplay(), and no sooner.
   */
  setBackgroundColor(color) {
    assert && assert(color === null || typeof color === 'string' || color instanceof Color);
    this._backgroundColor = color;
    return this;
  }
  set backgroundColor(value) {
    this.setBackgroundColor(value);
  }
  get backgroundColor() {
    return this.getBackgroundColor();
  }
  getBackgroundColor() {
    return this._backgroundColor;
  }
  get interactive() {
    return this._interactive;
  }
  set interactive(value) {
    if (this._accessible && value !== this._interactive) {
      this._rootPDOMInstance.peer.recursiveDisable(!value);
    }
    this._interactive = value;
    if (!this._interactive && this._input) {
      this._input.interruptPointers();
      this._input.clearBatchedEvents();
      this._input.removeTemporaryPointers();
      this._rootNode.interruptSubtreeInput();
      this.interruptInput();
    }
  }

  /**
   * Adds an overlay to the Display. Each overlay should have a .domElement (the DOM element that will be used for
   * display) and an .update() method.
   */
  addOverlay(overlay) {
    this._overlays.push(overlay);
    this._domElement.appendChild(overlay.domElement);

    // ensure that the overlay is hidden from screen readers, all accessible content should be in the dom element
    // of the this._rootPDOMInstance
    overlay.domElement.setAttribute('aria-hidden', 'true');
  }

  /**
   * Removes an overlay from the display.
   */
  removeOverlay(overlay) {
    this._domElement.removeChild(overlay.domElement);
    this._overlays.splice(_.indexOf(this._overlays, overlay), 1);
  }

  /**
   * Get the root accessible DOM element which represents this display and provides semantics for assistive
   * technology. If this Display is not accessible, returns null.
   */
  getPDOMRootElement() {
    return this._accessible ? this._rootPDOMInstance.peer.primarySibling : null;
  }
  get pdomRootElement() {
    return this.getPDOMRootElement();
  }

  /**
   * Has this Display enabled accessibility features like PDOM creation and support.
   */
  isAccessible() {
    return this._accessible;
  }

  /**
   * Returns true if the element is in the PDOM. That is only possible if the display is accessible.
   */
  isElementUnderPDOM(element) {
    return this._accessible && this.pdomRootElement.contains(element);
  }

  /**
   * Implements a workaround that prevents DOM focus from leaving the Display in FullScreen mode. There is
   * a bug in some browsers where DOM focus can be permanently lost if tabbing out of the FullScreen element,
   * see https://github.com/phetsims/scenery/issues/883.
   */
  handleFullScreenNavigation(domEvent) {
    assert && assert(this.pdomRootElement, 'There must be a PDOM to support keyboard navigation');
    if (FullScreen.isFullScreen() && KeyboardUtils.isKeyEvent(domEvent, KeyboardUtils.KEY_TAB)) {
      const rootElement = this.pdomRootElement;
      const nextElement = domEvent.shiftKey ? PDOMUtils.getPreviousFocusable(rootElement || undefined) : PDOMUtils.getNextFocusable(rootElement || undefined);
      if (nextElement === domEvent.target) {
        domEvent.preventDefault();
      }
    }
  }

  /**
   * Returns the bitmask union of all renderers (canvas/svg/dom/webgl) that are used for display, excluding
   * BackboneDrawables (which would be DOM).
   */
  getUsedRenderersBitmask() {
    function renderersUnderBackbone(backbone) {
      let bitmask = 0;
      _.each(backbone.blocks, block => {
        if (block instanceof DOMBlock && block.domDrawable instanceof BackboneDrawable) {
          bitmask = bitmask | renderersUnderBackbone(block.domDrawable);
        } else {
          bitmask = bitmask | block.renderer;
        }
      });
      return bitmask;
    }

    // only return the renderer-specific portion (no other hints, etc)
    return renderersUnderBackbone(this._rootBackbone) & Renderer.bitmaskRendererArea;
  }

  /**
   * Called from Instances that will need a transform update (for listeners and precomputation). (scenery-internal)
   *
   * @param instance
   * @param passTransform - Whether we should pass the first transform root when validating transforms (should
   * be true if the instance is transformed)
   */
  markTransformRootDirty(instance, passTransform) {
    passTransform ? this._dirtyTransformRoots.push(instance) : this._dirtyTransformRootsWithoutPass.push(instance);
  }
  updateDirtyTransformRoots() {
    sceneryLog && sceneryLog.transformSystem && sceneryLog.transformSystem('updateDirtyTransformRoots');
    sceneryLog && sceneryLog.transformSystem && sceneryLog.push();
    while (this._dirtyTransformRoots.length) {
      this._dirtyTransformRoots.pop().relativeTransform.updateTransformListenersAndCompute(false, false, this._frameId, true);
    }
    while (this._dirtyTransformRootsWithoutPass.length) {
      this._dirtyTransformRootsWithoutPass.pop().relativeTransform.updateTransformListenersAndCompute(false, false, this._frameId, false);
    }
    sceneryLog && sceneryLog.transformSystem && sceneryLog.pop();
  }

  /**
   * (scenery-internal)
   */
  markDrawableChangedBlock(drawable) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markDrawableChangedBlock: ${drawable.toString()}`);
    this._drawablesToChangeBlock.push(drawable);
  }

  /**
   * Marks an item for later reduceReferences() calls at the end of Display.update().
   * (scenery-internal)
   */
  markForReducedReferences(item) {
    assert && assert(!!item.reduceReferences);
    this._reduceReferencesNeeded.push(item);
  }

  /**
   * (scenery-internal)
   */
  markInstanceRootForDisposal(instance) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markInstanceRootForDisposal: ${instance.toString()}`);
    this._instanceRootsToDispose.push(instance);
  }

  /**
   * (scenery-internal)
   */
  markDrawableForDisposal(drawable) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markDrawableForDisposal: ${drawable.toString()}`);
    this._drawablesToDispose.push(drawable);
  }

  /**
   * (scenery-internal)
   */
  markDrawableForLinksUpdate(drawable) {
    this._drawablesToUpdateLinks.push(drawable);
  }

  /**
   * Add a {ChangeInterval} for the "remove change interval info" phase (we don't want to leak memory/references)
   * (scenery-internal)
   */
  markChangeIntervalToDispose(changeInterval) {
    this._changeIntervalsToDispose.push(changeInterval);
  }
  updateBackgroundColor() {
    assert && assert(this._backgroundColor === null || typeof this._backgroundColor === 'string' || this._backgroundColor instanceof Color);
    const newBackgroundCSS = this._backgroundColor === null ? '' : this._backgroundColor.toCSS ? this._backgroundColor.toCSS() : this._backgroundColor;
    if (newBackgroundCSS !== this._currentBackgroundCSS) {
      this._currentBackgroundCSS = newBackgroundCSS;
      this._domElement.style.backgroundColor = newBackgroundCSS;
    }
  }

  /*---------------------------------------------------------------------------*
   * Cursors
   *----------------------------------------------------------------------------*/

  updateCursor() {
    if (this._input && this._input.mouse && this._input.mouse.point) {
      if (this._input.mouse.cursor) {
        sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`set on pointer: ${this._input.mouse.cursor}`);
        this.setSceneCursor(this._input.mouse.cursor);
        return;
      }

      //OHTWO TODO: For a display, just return an instance and we can avoid the garbage collection/mutation at the cost of the linked-list traversal instead of an array https://github.com/phetsims/scenery/issues/1581
      const mouseTrail = this._rootNode.trailUnderPointer(this._input.mouse);
      if (mouseTrail) {
        for (let i = mouseTrail.getCursorCheckIndex(); i >= 0; i--) {
          const node = mouseTrail.nodes[i];
          const cursor = node.getEffectiveCursor();
          if (cursor) {
            sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`${cursor} on ${node.constructor.name}#${node.id}`);
            this.setSceneCursor(cursor);
            return;
          }
        }
      }
      sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`--- for ${mouseTrail ? mouseTrail.toString() : '(no hit)'}`);
    }

    // fallback case
    this.setSceneCursor(this._defaultCursor);
  }

  /**
   * Sets the cursor to be displayed when over the Display.
   */
  setElementCursor(cursor) {
    this._domElement.style.cursor = cursor;

    // In some cases, Chrome doesn't seem to respect the cursor set on the Display's domElement. If we are using the
    // full window, we can apply the workaround of controlling the body's style.
    // See https://github.com/phetsims/scenery/issues/983
    if (this._assumeFullWindow) {
      document.body.style.cursor = cursor;
    }
  }
  setSceneCursor(cursor) {
    if (cursor !== this._lastCursor) {
      this._lastCursor = cursor;
      const customCursors = CUSTOM_CURSORS[cursor];
      if (customCursors) {
        // go backwards, so the most desired cursor sticks
        for (let i = customCursors.length - 1; i >= 0; i--) {
          this.setElementCursor(customCursors[i]);
        }
      } else {
        this.setElementCursor(cursor);
      }
    }
  }
  applyCSSHacks() {
    // to use CSS3 transforms for performance, hide anything outside our bounds by default
    if (!this._allowSceneOverflow) {
      this._domElement.style.overflow = 'hidden';
    }

    // forward all pointer events
    // @ts-expect-error legacy
    this._domElement.style.msTouchAction = 'none';

    // don't allow browser to switch between font smoothing methods for text (see https://github.com/phetsims/scenery/issues/431)
    Features.setStyle(this._domElement, Features.fontSmoothing, 'antialiased');
    if (this._allowCSSHacks) {
      // Prevents selection cursor issues in Safari, see https://github.com/phetsims/scenery/issues/476
      document.onselectstart = () => false;

      // prevent any default zooming behavior from a trackpad on IE11 and Edge, all should be handled by scenery - must
      // be on the body, doesn't prevent behavior if on the display div
      // @ts-expect-error legacy
      document.body.style.msContentZooming = 'none';

      // some css hacks (inspired from https://github.com/EightMedia/hammer.js/blob/master/hammer.js).
      // modified to only apply the proper prefixed version instead of spamming all of them, and doesn't use jQuery.
      Features.setStyle(this._domElement, Features.userDrag, 'none');
      Features.setStyle(this._domElement, Features.userSelect, 'none');
      Features.setStyle(this._domElement, Features.touchAction, 'none');
      Features.setStyle(this._domElement, Features.touchCallout, 'none');
      Features.setStyle(this._domElement, Features.tapHighlightColor, 'rgba(0,0,0,0)');
    }
  }
  canvasDataURL(callback) {
    this.canvasSnapshot(canvas => {
      callback(canvas.toDataURL());
    });
  }

  /**
   * Renders what it can into a Canvas (so far, Canvas and SVG layers work fine)
   */
  canvasSnapshot(callback) {
    const canvas = document.createElement('canvas');
    canvas.width = this.size.width;
    canvas.height = this.size.height;
    const context = canvas.getContext('2d');

    //OHTWO TODO: allow actual background color directly, not having to check the style here!!! https://github.com/phetsims/scenery/issues/1581
    this._rootNode.renderToCanvas(canvas, context, () => {
      callback(canvas, context.getImageData(0, 0, canvas.width, canvas.height));
    }, this.domElement.style.backgroundColor);
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setPointerDisplayVisible(visibility) {
    const hasOverlay = !!this._pointerOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._pointerOverlay);
        this._pointerOverlay.dispose();
        this._pointerOverlay = null;
      } else {
        this._pointerOverlay = new PointerOverlay(this, this._rootNode);
        this.addOverlay(this._pointerOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setPointerAreaDisplayVisible(visibility) {
    const hasOverlay = !!this._pointerAreaOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._pointerAreaOverlay);
        this._pointerAreaOverlay.dispose();
        this._pointerAreaOverlay = null;
      } else {
        this._pointerAreaOverlay = new PointerAreaOverlay(this, this._rootNode);
        this.addOverlay(this._pointerAreaOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setHitAreaDisplayVisible(visibility) {
    const hasOverlay = !!this._hitAreaOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._hitAreaOverlay);
        this._hitAreaOverlay.dispose();
        this._hitAreaOverlay = null;
      } else {
        this._hitAreaOverlay = new HitAreaOverlay(this, this._rootNode);
        this.addOverlay(this._hitAreaOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setCanvasNodeBoundsVisible(visibility) {
    const hasOverlay = !!this._canvasAreaBoundsOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._canvasAreaBoundsOverlay);
        this._canvasAreaBoundsOverlay.dispose();
        this._canvasAreaBoundsOverlay = null;
      } else {
        this._canvasAreaBoundsOverlay = new CanvasNodeBoundsOverlay(this, this._rootNode);
        this.addOverlay(this._canvasAreaBoundsOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setFittedBlockBoundsVisible(visibility) {
    const hasOverlay = !!this._fittedBlockBoundsOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._fittedBlockBoundsOverlay);
        this._fittedBlockBoundsOverlay.dispose();
        this._fittedBlockBoundsOverlay = null;
      } else {
        this._fittedBlockBoundsOverlay = new FittedBlockBoundsOverlay(this, this._rootNode);
        this.addOverlay(this._fittedBlockBoundsOverlay);
      }
    }
  }

  /**
   * Sets up the Display to resize to whatever the window inner dimensions will be.
   */
  resizeOnWindowResize() {
    const resizer = () => {
      this.setWidthHeight(window.innerWidth, window.innerHeight); // eslint-disable-line bad-sim-text
    };
    window.addEventListener('resize', resizer);
    resizer();
  }

  /**
   * Updates on every request animation frame. If stepCallback is passed in, it is called before updateDisplay() with
   * stepCallback( timeElapsedInSeconds )
   */
  updateOnRequestAnimationFrame(stepCallback) {
    // keep track of how much time elapsed over the last frame
    let lastTime = 0;
    let timeElapsedInSeconds = 0;
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    (function step() {
      // @ts-expect-error LEGACY --- it would know to update just the DOM element's location if it's the second argument
      self._requestAnimationFrameID = window.requestAnimationFrame(step, self._domElement);

      // calculate how much time has elapsed since we rendered the last frame
      const timeNow = Date.now();
      if (lastTime !== 0) {
        timeElapsedInSeconds = (timeNow - lastTime) / 1000.0;
      }
      lastTime = timeNow;

      // step the timer that drives any time dependent updates of the Display
      stepTimer.emit(timeElapsedInSeconds);
      stepCallback && stepCallback(timeElapsedInSeconds);
      self.updateDisplay();
    })();
  }
  cancelUpdateOnRequestAnimationFrame() {
    window.cancelAnimationFrame(this._requestAnimationFrameID);
  }

  /**
   * Initializes event handling, and connects the browser's input event handlers to notify this Display of events.
   *
   * NOTE: This can be reversed with detachEvents().
   */
  initializeEvents(options) {
    assert && assert(!this._input, 'Events cannot be attached twice to a display (for now)');

    // TODO: refactor here https://github.com/phetsims/scenery/issues/1581
    const input = new Input(this, !this._listenToOnlyElement, this._batchDOMEvents, this._assumeFullWindow, this._passiveEvents, options);
    this._input = input;
    input.connectListeners();
  }

  /**
   * Detach already-attached input event handling (from initializeEvents()).
   */
  detachEvents() {
    assert && assert(this._input, 'detachEvents() should be called only when events are attached');
    this._input.disconnectListeners();
    this._input = null;
  }

  /**
   * Adds an input listener.
   */
  addInputListener(listener) {
    assert && assert(!_.includes(this._inputListeners, listener), 'Input listener already registered on this Display');

    // don't allow listeners to be added multiple times
    if (!_.includes(this._inputListeners, listener)) {
      this._inputListeners.push(listener);
    }
    return this;
  }

  /**
   * Removes an input listener that was previously added with addInputListener.
   */
  removeInputListener(listener) {
    // ensure the listener is in our list
    assert && assert(_.includes(this._inputListeners, listener));
    this._inputListeners.splice(_.indexOf(this._inputListeners, listener), 1);
    return this;
  }

  /**
   * Returns whether this input listener is currently listening to this Display.
   *
   * More efficient than checking display.inputListeners, as that includes a defensive copy.
   */
  hasInputListener(listener) {
    for (let i = 0; i < this._inputListeners.length; i++) {
      if (this._inputListeners[i] === listener) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns a copy of all of our input listeners.
   */
  getInputListeners() {
    return this._inputListeners.slice(0); // defensive copy
  }
  get inputListeners() {
    return this.getInputListeners();
  }

  /**
   * Interrupts all input listeners that are attached to this Display.
   */
  interruptInput() {
    const listenersCopy = this.inputListeners;
    for (let i = 0; i < listenersCopy.length; i++) {
      const listener = listenersCopy[i];
      listener.interrupt && listener.interrupt();
    }
    return this;
  }

  /**
   * Interrupts all pointers associated with this Display, see https://github.com/phetsims/scenery/issues/1582.
   */
  interruptPointers() {
    this._input && this._input.interruptPointers();
    return this;
  }

  /**
   * Interrupts all pointers associated with this Display that are NOT currently having events executed.
   * see https://github.com/phetsims/scenery/issues/1582.
   *
   * If excludePointer is provided and is non-null, it's used as the "current" pointer that should be excluded from
   * interruption.
   */
  interruptOtherPointers(excludePointer = null) {
    this._input && this._input.interruptPointers(excludePointer || this._input.currentSceneryEvent?.pointer || null);
    return this;
  }
  static INTERRUPT_OTHER_POINTERS = event => {
    phet?.joist?.display?.interruptOtherPointers(event?.pointer);
  };

  /**
   * (scenery-internal)
   */
  ensureNotPainting() {
    assert && assert(!this._isPainting, 'This should not be run in the call tree of updateDisplay(). If you see this, it is likely that either the ' + 'last updateDisplay() had a thrown error and it is trying to be run again (in which case, investigate that ' + 'error), OR code was run/triggered from inside an updateDisplay() that has the potential to cause an infinite ' + 'loop, e.g. CanvasNode paintCanvas() call manipulating another Node, or a bounds listener that Scenery missed.');
  }

  /**
   * Triggers a loss of context for all WebGL blocks.
   *
   * NOTE: Should generally only be used for debugging.
   */
  loseWebGLContexts() {
    (function loseBackbone(backbone) {
      if (backbone.blocks) {
        backbone.blocks.forEach(block => {
          const gl = block.gl;
          if (gl) {
            Utils.loseContext(gl);
          }

          //TODO: pattern for this iteration https://github.com/phetsims/scenery/issues/1581
          for (let drawable = block.firstDrawable; drawable !== null; drawable = drawable.nextDrawable) {
            loseBackbone(drawable);
            if (drawable === block.lastDrawable) {
              break;
            }
          }
        });
      }
    })(this._rootBackbone);
  }

  /**
   * Makes this Display available for inspection.
   */
  inspect() {
    localStorage.scenerySnapshot = JSON.stringify(scenerySerialize(this));
  }

  /**
   * Returns an HTML fragment that includes a large amount of debugging information, including a view of the
   * instance tree and drawable tree.
   */
  getDebugHTML() {
    const headerStyle = 'font-weight: bold; font-size: 120%; margin-top: 5px;';
    let depth = 0;
    let result = '';
    result += `<div style="${headerStyle}">Display (${this.id}) Summary</div>`;
    result += `${this.size.toString()} frame:${this._frameId} input:${!!this._input} cursor:${this._lastCursor}<br/>`;
    function nodeCount(node) {
      let count = 1; // for us
      for (let i = 0; i < node.children.length; i++) {
        count += nodeCount(node.children[i]);
      }
      return count;
    }
    result += `Nodes: ${nodeCount(this._rootNode)}<br/>`;
    function instanceCount(instance) {
      let count = 1; // for us
      for (let i = 0; i < instance.children.length; i++) {
        count += instanceCount(instance.children[i]);
      }
      return count;
    }
    result += this._baseInstance ? `Instances: ${instanceCount(this._baseInstance)}<br/>` : '';
    function drawableCount(drawable) {
      let count = 1; // for us
      if (drawable.blocks) {
        // we're a backbone
        _.each(drawable.blocks, childDrawable => {
          count += drawableCount(childDrawable);
        });
      } else if (drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          count += drawableCount(childDrawable);
        }
        count += drawableCount(drawable.lastDrawable);
      }
      return count;
    }

    // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
    result += this._rootBackbone ? `Drawables: ${drawableCount(this._rootBackbone)}<br/>` : '';
    const drawableCountMap = {}; // {string} drawable constructor name => {number} count of seen
    // increment the count in our map
    function countRetainedDrawable(drawable) {
      const name = drawable.constructor.name;
      if (drawableCountMap[name]) {
        drawableCountMap[name]++;
      } else {
        drawableCountMap[name] = 1;
      }
    }
    function retainedDrawableCount(instance) {
      let count = 0;
      if (instance.selfDrawable) {
        countRetainedDrawable(instance.selfDrawable);
        count++;
      }
      if (instance.groupDrawable) {
        countRetainedDrawable(instance.groupDrawable);
        count++;
      }
      if (instance.sharedCacheDrawable) {
        // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
        countRetainedDrawable(instance.sharedCacheDrawable);
        count++;
      }
      for (let i = 0; i < instance.children.length; i++) {
        count += retainedDrawableCount(instance.children[i]);
      }
      return count;
    }
    result += this._baseInstance ? `Retained Drawables: ${retainedDrawableCount(this._baseInstance)}<br/>` : '';
    for (const drawableName in drawableCountMap) {
      result += `&nbsp;&nbsp;&nbsp;&nbsp;${drawableName}: ${drawableCountMap[drawableName]}<br/>`;
    }
    function blockSummary(block) {
      // ensure we are a block
      if (!block.firstDrawable || !block.lastDrawable) {
        return '';
      }

      // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
      const hasBackbone = block.domDrawable && block.domDrawable.blocks;
      let div = `<div style="margin-left: ${depth * 20}px">`;
      div += block.toString();
      if (!hasBackbone) {
        div += ` (${block.drawableCount} drawables)`;
      }
      div += '</div>';
      depth += 1;
      if (hasBackbone) {
        // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
        for (let k = 0; k < block.domDrawable.blocks.length; k++) {
          // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
          div += blockSummary(block.domDrawable.blocks[k]);
        }
      }
      depth -= 1;
      return div;
    }
    if (this._rootBackbone) {
      result += `<div style="${headerStyle}">Block Summary</div>`;
      for (let i = 0; i < this._rootBackbone.blocks.length; i++) {
        result += blockSummary(this._rootBackbone.blocks[i]);
      }
    }
    function instanceSummary(instance) {
      let iSummary = '';
      function addQualifier(text) {
        iSummary += ` <span style="color: #008">${text}</span>`;
      }
      const node = instance.node;
      iSummary += instance.id;
      iSummary += ` ${node.constructor.name ? node.constructor.name : '?'}`;
      iSummary += ` <span style="font-weight: ${node.isPainted() ? 'bold' : 'normal'}">${node.id}</span>`;
      iSummary += node.getDebugHTMLExtras();
      if (!node.visible) {
        addQualifier('invis');
      }
      if (!instance.visible) {
        addQualifier('I-invis');
      }
      if (!instance.relativeVisible) {
        addQualifier('I-rel-invis');
      }
      if (!instance.selfVisible) {
        addQualifier('I-self-invis');
      }
      if (!instance.fittability.ancestorsFittable) {
        addQualifier('nofit-ancestor');
      }
      if (!instance.fittability.selfFittable) {
        addQualifier('nofit-self');
      }
      if (node.pickable === true) {
        addQualifier('pickable');
      }
      if (node.pickable === false) {
        addQualifier('unpickable');
      }
      if (instance.trail.isPickable()) {
        addQualifier('<span style="color: #808">hits</span>');
      }
      if (node.getEffectiveCursor()) {
        addQualifier(`effectiveCursor:${node.getEffectiveCursor()}`);
      }
      if (node.clipArea) {
        addQualifier('clipArea');
      }
      if (node.mouseArea) {
        addQualifier('mouseArea');
      }
      if (node.touchArea) {
        addQualifier('touchArea');
      }
      if (node.getInputListeners().length) {
        addQualifier('inputListeners');
      }
      if (node.getRenderer()) {
        addQualifier(`renderer:${node.getRenderer()}`);
      }
      if (node.isLayerSplit()) {
        addQualifier('layerSplit');
      }
      if (node.opacity < 1) {
        addQualifier(`opacity:${node.opacity}`);
      }
      if (node.disabledOpacity < 1) {
        addQualifier(`disabledOpacity:${node.disabledOpacity}`);
      }
      if (node._boundsEventCount > 0) {
        addQualifier(`<span style="color: #800">boundsListen:${node._boundsEventCount}:${node._boundsEventSelfCount}</span>`);
      }
      let transformType = '';
      switch (node.transform.getMatrix().type) {
        case Matrix3Type.IDENTITY:
          transformType = '';
          break;
        case Matrix3Type.TRANSLATION_2D:
          transformType = 'translated';
          break;
        case Matrix3Type.SCALING:
          transformType = 'scale';
          break;
        case Matrix3Type.AFFINE:
          transformType = 'affine';
          break;
        case Matrix3Type.OTHER:
          transformType = 'other';
          break;
        default:
          throw new Error(`invalid matrix type: ${node.transform.getMatrix().type}`);
      }
      if (transformType) {
        iSummary += ` <span style="color: #88f" title="${node.transform.getMatrix().toString().replace('\n', '&#10;')}">${transformType}</span>`;
      }
      iSummary += ` <span style="color: #888">[Trail ${instance.trail.indices.join('.')}]</span>`;
      // iSummary += ` <span style="color: #c88">${str( instance.state )}</span>`;
      iSummary += ` <span style="color: #8c8">${node._rendererSummary.bitmask.toString(16)}${node._rendererBitmask !== Renderer.bitmaskNodeDefault ? ` (${node._rendererBitmask.toString(16)})` : ''}</span>`;
      return iSummary;
    }
    function drawableSummary(drawable) {
      let drawableString = drawable.toString();
      if (drawable.visible) {
        drawableString = `<strong>${drawableString}</strong>`;
      }
      if (drawable.dirty) {
        drawableString += drawable.dirty ? ' <span style="color: #c00;">[x]</span>' : '';
      }
      if (!drawable.fittable) {
        drawableString += drawable.dirty ? ' <span style="color: #0c0;">[no-fit]</span>' : '';
      }
      return drawableString;
    }
    function printInstanceSubtree(instance) {
      let div = `<div style="margin-left: ${depth * 20}px">`;
      function addDrawable(name, drawable) {
        div += ` <span style="color: #888">${name}:${drawableSummary(drawable)}</span>`;
      }
      div += instanceSummary(instance);
      instance.selfDrawable && addDrawable('self', instance.selfDrawable);
      instance.groupDrawable && addDrawable('group', instance.groupDrawable);
      // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
      instance.sharedCacheDrawable && addDrawable('sharedCache', instance.sharedCacheDrawable);
      div += '</div>';
      result += div;
      depth += 1;
      _.each(instance.children, childInstance => {
        printInstanceSubtree(childInstance);
      });
      depth -= 1;
    }
    if (this._baseInstance) {
      result += `<div style="${headerStyle}">Root Instance Tree</div>`;
      printInstanceSubtree(this._baseInstance);
    }
    _.each(this._sharedCanvasInstances, instance => {
      result += `<div style="${headerStyle}">Shared Canvas Instance Tree</div>`;
      printInstanceSubtree(instance);
    });
    function printDrawableSubtree(drawable) {
      let div = `<div style="margin-left: ${depth * 20}px">`;
      div += drawableSummary(drawable);
      if (drawable.instance) {
        div += ` <span style="color: #0a0;">(${drawable.instance.trail.toPathString()})</span>`;
        div += `&nbsp;&nbsp;&nbsp;${instanceSummary(drawable.instance)}`;
      } else if (drawable.backboneInstance) {
        div += ` <span style="color: #a00;">(${drawable.backboneInstance.trail.toPathString()})</span>`;
        div += `&nbsp;&nbsp;&nbsp;${instanceSummary(drawable.backboneInstance)}`;
      }
      div += '</div>';
      result += div;
      if (drawable.blocks) {
        // we're a backbone
        depth += 1;
        _.each(drawable.blocks, childDrawable => {
          printDrawableSubtree(childDrawable);
        });
        depth -= 1;
      } else if (drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        depth += 1;
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          printDrawableSubtree(childDrawable);
        }
        printDrawableSubtree(drawable.lastDrawable); // wasn't hit in our simplified (and safer) loop
        depth -= 1;
      }
    }
    if (this._rootBackbone) {
      result += '<div style="font-weight: bold;">Root Drawable Tree</div>';
      // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
      printDrawableSubtree(this._rootBackbone);
    }

    //OHTWO TODO: add shared cache drawable trees https://github.com/phetsims/scenery/issues/1581

    return result;
  }

  /**
   * Returns the getDebugHTML() information, but wrapped into a full HTML page included in a data URI.
   */
  getDebugURI() {
    return `data:text/html;charset=utf-8,${encodeURIComponent(`${'<!DOCTYPE html>' + '<html lang="en">' + '<head><title>Scenery Debug Snapshot</title></head>' + '<body style="font-size: 12px;">'}${this.getDebugHTML()}</body>` + '</html>')}`;
  }

  /**
   * Attempts to open a popup with the getDebugHTML() information.
   */
  popupDebug() {
    window.open(this.getDebugURI());
  }

  /**
   * Attempts to open an iframe popup with the getDebugHTML() information in the same window. This is similar to
   * popupDebug(), but should work in browsers that block popups, or prevent that type of data URI being opened.
   */
  iframeDebug() {
    const iframe = document.createElement('iframe');
    iframe.width = '' + window.innerWidth; // eslint-disable-line bad-sim-text
    iframe.height = '' + window.innerHeight; // eslint-disable-line bad-sim-text
    iframe.style.position = 'absolute';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.zIndex = '10000';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(this.getDebugHTML());
    iframe.contentWindow.document.close();
    iframe.contentWindow.document.body.style.background = 'white';
    const closeButton = document.createElement('button');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    closeButton.style.right = '0';
    closeButton.style.zIndex = '10001';
    document.body.appendChild(closeButton);
    closeButton.textContent = 'close';

    // A normal 'click' event listener doesn't seem to be working. This is less-than-ideal.
    ['pointerdown', 'click', 'touchdown'].forEach(eventType => {
      closeButton.addEventListener(eventType, () => {
        document.body.removeChild(iframe);
        document.body.removeChild(closeButton);
      }, true);
    });
  }
  getPDOMDebugHTML() {
    let result = '';
    const headerStyle = 'font-weight: bold; font-size: 120%; margin-top: 5px;';
    const indent = '&nbsp;&nbsp;&nbsp;&nbsp;';
    result += `<div style="${headerStyle}">Accessible Instances</div><br>`;
    recurse(this._rootPDOMInstance, '');
    function recurse(instance, indentation) {
      result += `${indentation + escapeHTML(`${instance.isRootInstance ? '' : instance.node.tagName} ${instance.toString()}`)}<br>`;
      instance.children.forEach(child => {
        recurse(child, indentation + indent);
      });
    }
    result += `<br><div style="${headerStyle}">Parallel DOM</div><br>`;
    let parallelDOM = this._rootPDOMInstance.peer.primarySibling.outerHTML;
    parallelDOM = parallelDOM.replace(/></g, '>\n<');
    const lines = parallelDOM.split('\n');
    let indentation = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isEndTag = line.startsWith('</');
      if (isEndTag) {
        indentation = indentation.slice(indent.length);
      }
      result += `${indentation + escapeHTML(line)}<br>`;
      if (!isEndTag) {
        indentation += indent;
      }
    }
    return result;
  }

  /**
   * Will attempt to call callback( {string} dataURI ) with the rasterization of the entire Display's DOM structure,
   * used for internal testing. Will call-back null if there was an error
   *
   * Only tested on recent Chrome and Firefox, not recommended for general use. Guaranteed not to work for IE <= 10.
   *
   * See https://github.com/phetsims/scenery/issues/394 for some details.
   */
  foreignObjectRasterization(callback) {
    // Scan our drawable tree for Canvases. We'll rasterize them here (to data URLs) so we can replace them later in
    // the HTML tree (with images) before putting that in the foreignObject. That way, we can actually display
    // things rendered in Canvas in our rasterization.
    const canvasUrlMap = {};
    let unknownIds = 0;
    function addCanvas(canvas) {
      if (!canvas.id) {
        canvas.id = `unknown-canvas-${unknownIds++}`;
      }
      canvasUrlMap[canvas.id] = canvas.toDataURL();
    }
    function scanForCanvases(drawable) {
      if (drawable instanceof BackboneDrawable) {
        // we're a backbone
        _.each(drawable.blocks, childDrawable => {
          scanForCanvases(childDrawable);
        });
      } else if (drawable instanceof Block && drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          scanForCanvases(childDrawable);
        }
        scanForCanvases(drawable.lastDrawable); // wasn't hit in our simplified (and safer) loop

        if ((drawable instanceof CanvasBlock || drawable instanceof WebGLBlock) && drawable.canvas && drawable.canvas instanceof window.HTMLCanvasElement) {
          addCanvas(drawable.canvas);
        }
      }
      if (DOMDrawable && drawable instanceof DOMDrawable) {
        if (drawable.domElement instanceof window.HTMLCanvasElement) {
          addCanvas(drawable.domElement);
        }
        Array.prototype.forEach.call(drawable.domElement.getElementsByTagName('canvas'), canvas => {
          addCanvas(canvas);
        });
      }
    }

    // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
    scanForCanvases(this._rootBackbone);

    // Create a new document, so that we can (1) serialize it to XHTML, and (2) manipulate it independently.
    // Inspired by http://cburgmer.github.io/rasterizeHTML.js/
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = this.domElement.outerHTML;
    doc.documentElement.setAttribute('xmlns', doc.documentElement.namespaceURI);

    // Hide the PDOM
    doc.documentElement.appendChild(document.createElement('style')).innerHTML = `.${PDOMSiblingStyle.ROOT_CLASS_NAME} { display:none; } `;

    // Replace each <canvas> with an <img> that has src=canvas.toDataURL() and the same style
    let displayCanvases = doc.documentElement.getElementsByTagName('canvas');
    displayCanvases = Array.prototype.slice.call(displayCanvases); // don't use a live HTMLCollection copy!
    for (let i = 0; i < displayCanvases.length; i++) {
      const displayCanvas = displayCanvases[i];
      const cssText = displayCanvas.style.cssText;
      const displayImg = doc.createElement('img');
      const src = canvasUrlMap[displayCanvas.id];
      assert && assert(src, 'Must have missed a toDataURL() on a Canvas');
      displayImg.src = src;
      displayImg.setAttribute('style', cssText);
      displayCanvas.parentNode.replaceChild(displayImg, displayCanvas);
    }
    const displayWidth = this.width;
    const displayHeight = this.height;
    const completeFunction = () => {
      Display.elementToSVGDataURL(doc.documentElement, displayWidth, displayHeight, callback);
    };

    // Convert each <image>'s xlink:href so that it's a data URL with the relevant data, e.g.
    // <image ... xlink:href="http://localhost:8080/scenery-phet/images/batteryDCell.png?bust=1476308407988"/>
    // gets replaced with a data URL.
    // See https://github.com/phetsims/scenery/issues/573
    let replacedImages = 0; // Count how many images get replaced. We'll decrement with each finished image.
    let hasReplacedImages = false; // Whether any images are replaced
    const displaySVGImages = Array.prototype.slice.call(doc.documentElement.getElementsByTagName('image'));
    for (let j = 0; j < displaySVGImages.length; j++) {
      const displaySVGImage = displaySVGImages[j];
      const currentHref = displaySVGImage.getAttribute('xlink:href');
      if (currentHref.slice(0, 5) !== 'data:') {
        replacedImages++;
        hasReplacedImages = true;
        (() => {
          // eslint-disable-line @typescript-eslint/no-loop-func
          // Closure variables need to be stored for each individual SVG image.
          const refImage = new window.Image();
          const svgImage = displaySVGImage;
          refImage.onload = () => {
            // Get a Canvas
            const refCanvas = document.createElement('canvas');
            refCanvas.width = refImage.width;
            refCanvas.height = refImage.height;
            const refContext = refCanvas.getContext('2d');

            // Draw the (now loaded) image into the Canvas
            refContext.drawImage(refImage, 0, 0);

            // Replace the <image>'s href with the Canvas' data.
            svgImage.setAttribute('xlink:href', refCanvas.toDataURL());

            // If it's the last replaced image, go to the next step
            if (--replacedImages === 0) {
              completeFunction();
            }
            assert && assert(replacedImages >= 0);
          };
          refImage.onerror = () => {
            // NOTE: not much we can do, leave this element alone.

            // If it's the last replaced image, go to the next step
            if (--replacedImages === 0) {
              completeFunction();
            }
            assert && assert(replacedImages >= 0);
          };

          // Kick off loading of the image.
          refImage.src = currentHref;
        })();
      }
    }

    // If no images are replaced, we need to call our callback through this route.
    if (!hasReplacedImages) {
      completeFunction();
    }
  }
  popupRasterization() {
    this.foreignObjectRasterization(url => {
      if (url) {
        window.open(url);
      }
    });
  }

  /**
   * Will return null if the string of indices isn't part of the PDOMInstance tree
   */
  getTrailFromPDOMIndicesString(indicesString) {
    // No PDOMInstance tree if the display isn't accessible
    if (!this._rootPDOMInstance) {
      return null;
    }
    let instance = this._rootPDOMInstance;
    const indexStrings = indicesString.split(PDOMUtils.PDOM_UNIQUE_ID_SEPARATOR);
    for (let i = 0; i < indexStrings.length; i++) {
      const digit = Number(indexStrings[i]);
      instance = instance.children[digit];
      if (!instance) {
        return null;
      }
    }
    return instance && instance.trail ? instance.trail : null;
  }

  /**
   * Forces SVG elements to have their visual contents refreshed, by changing state in a non-visually-apparent way.
   * It should trick browsers into re-rendering the SVG elements.
   *
   * See https://github.com/phetsims/scenery/issues/1507
   */
  refreshSVG() {
    this._refreshSVGEmitter.emit();
  }

  /**
   * Similar to refreshSVG (see docs above), but will do so on the next frame.
   */
  refreshSVGOnNextFrame() {
    this._refreshSVGPending = true;
  }

  /**
   * Releases references.
   *
   * TODO: this dispose function is not complete. https://github.com/phetsims/scenery/issues/1581
   */
  dispose() {
    if (assert) {
      assert(!this._isDisposing);
      assert(!this._isDisposed);
      this._isDisposing = true;
    }
    if (this._input) {
      this.detachEvents();
    }
    this._rootNode.removeRootedDisplay(this);
    if (this._accessible) {
      assert && assert(this._boundHandleFullScreenNavigation, '_boundHandleFullScreenNavigation was not added to the keyStateTracker');
      globalKeyStateTracker.keydownEmitter.removeListener(this._boundHandleFullScreenNavigation);
      this._rootPDOMInstance.dispose();
    }
    this._focusOverlay && this._focusOverlay.dispose();
    this.sizeProperty.dispose();

    // Will immediately dispose recursively, all Instances AND their attached drawables, which will include the
    // rootBackbone.
    this._baseInstance && this._baseInstance.dispose();
    this.descriptionUtteranceQueue.dispose();
    this.focusManager && this.focusManager.dispose();
    if (assert) {
      this._isDisposing = false;
      this._isDisposed = true;
    }
  }

  /**
   * Takes a given DOM element, and asynchronously renders it to a string that is a data URL representing an SVG
   * file.
   *
   * @param domElement
   * @param width - The width of the output SVG
   * @param height - The height of the output SVG
   * @param callback - Called as callback( url: {string} ), where the URL will be the encoded SVG file.
   */
  static elementToSVGDataURL(domElement, width, height, callback) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Serialize it to XHTML that can be used in foreignObject (HTML can't be)
    const xhtml = new window.XMLSerializer().serializeToString(domElement);

    // Create an SVG container with a foreignObject.
    const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` + '<foreignObject width="100%" height="100%">' + `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` + '</foreignObject>' + '</svg>';

    // Load an <img> with the SVG data URL, and when loaded draw it into our Canvas
    const img = new window.Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      callback(canvas.toDataURL()); // Endpoint here
    };
    img.onerror = () => {
      callback(null);
    };

    // We can't btoa() arbitrary unicode, so we need another solution,
    // see https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
    // @ts-expect-error - Exterior lib
    const uint8array = new window.TextEncoderLite('utf-8').encode(data);
    // @ts-expect-error - Exterior lib
    const base64 = window.fromByteArray(uint8array);

    // turn it to base64 and wrap it in the data URL format
    img.src = `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Returns true when NO nodes in the subtree are disposed.
   */
  static assertSubtreeDisposed(node) {
    assert && assert(!node.isDisposed, 'Disposed nodes should not be included in a scene graph to display.');
    if (assert) {
      for (let i = 0; i < node.children.length; i++) {
        Display.assertSubtreeDisposed(node.children[i]);
      }
    }
  }

  /**
   * Adds an input listener to be fired for ANY Display
   */
  static addInputListener(listener) {
    assert && assert(!_.includes(Display.inputListeners, listener), 'Input listener already registered');

    // don't allow listeners to be added multiple times
    if (!_.includes(Display.inputListeners, listener)) {
      Display.inputListeners.push(listener);
    }
  }

  /**
   * Removes an input listener that was previously added with Display.addInputListener.
   */
  static removeInputListener(listener) {
    // ensure the listener is in our list
    assert && assert(_.includes(Display.inputListeners, listener));
    Display.inputListeners.splice(_.indexOf(Display.inputListeners, listener), 1);
  }

  /**
   * Interrupts all input listeners that are attached to all Displays.
   */
  static interruptInput() {
    const listenersCopy = Display.inputListeners.slice(0);
    for (let i = 0; i < listenersCopy.length; i++) {
      const listener = listenersCopy[i];
      listener.interrupt && listener.interrupt();
    }
  }

  // Fires when we detect an input event that would be considered a "user gesture" by Chrome, so
  // that we can trigger browser actions that are only allowed as a result.
  // See https://github.com/phetsims/scenery/issues/802 and https://github.com/phetsims/vibe/issues/32 for more
  // information.

  // Listeners that will be called for every event on ANY Display, see
  // https://github.com/phetsims/scenery/issues/1149. Do not directly modify this!
}
scenery.register('Display', Display);
Display.userGestureEmitter = new Emitter();
Display.inputListeners = [];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbWl0dGVyIiwic3RlcFRpbWVyIiwiVGlueVByb3BlcnR5IiwiRGltZW5zaW9uMiIsIk1hdHJpeDNUeXBlIiwiZXNjYXBlSFRNTCIsIm9wdGlvbml6ZSIsInBsYXRmb3JtIiwiQXJpYUxpdmVBbm5vdW5jZXIiLCJVdHRlcmFuY2VRdWV1ZSIsIkJhY2tib25lRHJhd2FibGUiLCJCbG9jayIsIkNhbnZhc0Jsb2NrIiwiQ2FudmFzTm9kZUJvdW5kc092ZXJsYXkiLCJDb2xvciIsIkRPTUJsb2NrIiwiRE9NRHJhd2FibGUiLCJGZWF0dXJlcyIsIkZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSIsIkZvY3VzTWFuYWdlciIsIkZ1bGxTY3JlZW4iLCJnbG9iYWxLZXlTdGF0ZVRyYWNrZXIiLCJIaWdobGlnaHRPdmVybGF5IiwiSGl0QXJlYU92ZXJsYXkiLCJJbnB1dCIsIkluc3RhbmNlIiwiS2V5Ym9hcmRVdGlscyIsIk5vZGUiLCJQRE9NSW5zdGFuY2UiLCJQRE9NU2libGluZ1N0eWxlIiwiUERPTVRyZWUiLCJQRE9NVXRpbHMiLCJQb2ludGVyQXJlYU92ZXJsYXkiLCJQb2ludGVyT3ZlcmxheSIsIlJlbmRlcmVyIiwic2NlbmVyeSIsInNjZW5lcnlTZXJpYWxpemUiLCJUcmFpbCIsIlV0aWxzIiwiV2ViR0xCbG9jayIsIlNhZmFyaVdvcmthcm91bmRPdmVybGF5IiwiQ1VTVE9NX0NVUlNPUlMiLCJnbG9iYWxJZENvdW50ZXIiLCJEaXNwbGF5IiwiX3JlZnJlc2hTVkdFbWl0dGVyIiwiX3JlZnJlc2hTVkdQZW5kaW5nIiwiY29uc3RydWN0b3IiLCJyb290Tm9kZSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsIm9wdGlvbnMiLCJ3aWR0aCIsImNvbnRhaW5lciIsImNsaWVudFdpZHRoIiwiaGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiYWxsb3dDU1NIYWNrcyIsImFsbG93U2FmYXJpUmVkcmF3V29ya2Fyb3VuZCIsImFsbG93U2NlbmVPdmVyZmxvdyIsImFsbG93TGF5ZXJGaXR0aW5nIiwiZm9yY2VTVkdSZWZyZXNoIiwiZGVmYXVsdEN1cnNvciIsImJhY2tncm91bmRDb2xvciIsInByZXNlcnZlRHJhd2luZ0J1ZmZlciIsImFsbG93V2ViR0wiLCJhY2Nlc3NpYmlsaXR5Iiwic3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMiLCJpbnRlcmFjdGl2ZSIsImxpc3RlblRvT25seUVsZW1lbnQiLCJiYXRjaERPTUV2ZW50cyIsImFzc3VtZUZ1bGxXaW5kb3ciLCJhZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb24iLCJwYXNzaXZlRXZlbnRzIiwic2FmYXJpIiwiYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmciLCJpZCIsIl9hY2Nlc3NpYmxlIiwiX3ByZXNlcnZlRHJhd2luZ0J1ZmZlciIsIl9hbGxvd1dlYkdMIiwiX2FsbG93Q1NTSGFja3MiLCJfYWxsb3dTY2VuZU92ZXJmbG93IiwiX2RlZmF1bHRDdXJzb3IiLCJzaXplUHJvcGVydHkiLCJfY3VycmVudFNpemUiLCJfcm9vdE5vZGUiLCJhZGRSb290ZWREaXNwbGF5IiwiX3Jvb3RCYWNrYm9uZSIsIl9kb21FbGVtZW50IiwicmVwdXJwb3NlQmFja2JvbmVDb250YWluZXIiLCJjcmVhdGVEaXZCYWNrYm9uZSIsIl9zaGFyZWRDYW52YXNJbnN0YW5jZXMiLCJfYmFzZUluc3RhbmNlIiwiX2ZyYW1lSWQiLCJfZGlydHlUcmFuc2Zvcm1Sb290cyIsIl9kaXJ0eVRyYW5zZm9ybVJvb3RzV2l0aG91dFBhc3MiLCJfaW5zdGFuY2VSb290c1RvRGlzcG9zZSIsIl9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkIiwiX2RyYXdhYmxlc1RvRGlzcG9zZSIsIl9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrIiwiX2RyYXdhYmxlc1RvVXBkYXRlTGlua3MiLCJfY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlIiwiX2xhc3RDdXJzb3IiLCJfY3VycmVudEJhY2tncm91bmRDU1MiLCJfYmFja2dyb3VuZENvbG9yIiwiX3JlcXVlc3RBbmltYXRpb25GcmFtZUlEIiwiX2lucHV0IiwiX2lucHV0TGlzdGVuZXJzIiwiX2ludGVyYWN0aXZlIiwiX2xpc3RlblRvT25seUVsZW1lbnQiLCJfYmF0Y2hET01FdmVudHMiLCJfYXNzdW1lRnVsbFdpbmRvdyIsIl9wYXNzaXZlRXZlbnRzIiwiX2FnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbiIsIl9hbGxvd0JhY2tpbmdTY2FsZUFudGlhbGlhc2luZyIsIl9hbGxvd0xheWVyRml0dGluZyIsIl9mb3JjZVNWR1JlZnJlc2giLCJfb3ZlcmxheXMiLCJfcG9pbnRlck92ZXJsYXkiLCJfcG9pbnRlckFyZWFPdmVybGF5IiwiX2hpdEFyZWFPdmVybGF5IiwiX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5IiwiX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSIsIl9pc1BhaW50aW5nIiwiX2lzRGlzcG9zaW5nIiwiX2lzRGlzcG9zZWQiLCJhcHBseUNTU0hhY2tzIiwic2V0QmFja2dyb3VuZENvbG9yIiwiYXJpYUxpdmVBbm5vdW5jZXIiLCJkZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlIiwiaW5pdGlhbGl6ZSIsImZlYXR1cmVTcGVjaWZpY0Fubm91bmNpbmdDb250cm9sUHJvcGVydHlOYW1lIiwiYWRkT3ZlcmxheSIsImZvY3VzTWFuYWdlciIsIl9mb2N1c1Jvb3ROb2RlIiwiX2ZvY3VzT3ZlcmxheSIsInBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJyZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwiX3Jvb3RQRE9NSW5zdGFuY2UiLCJwb29sIiwiY3JlYXRlIiwic2NlbmVyeUxvZyIsInRvU3RyaW5nIiwicmVidWlsZEluc3RhbmNlVHJlZSIsInBlZXIiLCJhcHBlbmRDaGlsZCIsInByaW1hcnlTaWJsaW5nIiwiYXJpYUxpdmVDb250YWluZXIiLCJzdHlsZSIsInVzZXJTZWxlY3QiLCJfYm91bmRIYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvbiIsImhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uIiwiYmluZCIsImtleWRvd25FbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJnZXRET01FbGVtZW50IiwiZG9tRWxlbWVudCIsInVwZGF0ZURpc3BsYXkiLCJpc0xvZ2dpbmdQZXJmb3JtYW5jZSIsInBlcmZTeW5jVHJlZUNvdW50IiwicGVyZlN0aXRjaENvdW50IiwicGVyZkludGVydmFsQ291bnQiLCJwZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50IiwicGVyZkRyYXdhYmxlT2xkSW50ZXJ2YWxDb3VudCIsInBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnQiLCJhc3NlcnRTdWJ0cmVlRGlzcG9zZWQiLCJwdXNoIiwiZmlyc3RSdW4iLCJ2YWxpZGF0ZVBvaW50ZXJzIiwidXBkYXRlU3VidHJlZVBvc2l0aW9uaW5nIiwidmFsaWRhdGVXYXRjaGVkQm91bmRzIiwiYXNzZXJ0U2xvdyIsImF1ZGl0Um9vdCIsIl9waWNrZXIiLCJhdWRpdCIsImNyZWF0ZUZyb21Qb29sIiwiYmFzZVN5bmNUcmVlIiwibWFya1RyYW5zZm9ybVJvb3REaXJ0eSIsImlzVHJhbnNmb3JtZWQiLCJsZW5ndGgiLCJwb3AiLCJ1cGRhdGVMaW5rcyIsImRpc3Bvc2UiLCJncm91cERyYXdhYmxlIiwiY2hhbmdlZCIsInVwZGF0ZUJsb2NrIiwidXBkYXRlRGlydHlUcmFuc2Zvcm1Sb290cyIsInVwZGF0ZVZpc2liaWxpdHkiLCJhdWRpdFZpc2liaWxpdHkiLCJhdWRpdEluc3RhbmNlU3VidHJlZUZvckRpc3BsYXkiLCJ1cGRhdGUiLCJ1cGRhdGVDdXJzb3IiLCJ1cGRhdGVCYWNrZ3JvdW5kQ29sb3IiLCJ1cGRhdGVTaXplIiwiekluZGV4IiwibGFzdFpJbmRleCIsImkiLCJvdmVybGF5IiwicmVkdWNlUmVmZXJlbmNlcyIsInN5bmNUcmVlTWVzc2FnZSIsIlBlcmZDcml0aWNhbCIsIlBlcmZNYWpvciIsIlBlcmZNaW5vciIsIlBlcmZWZXJib3NlIiwiZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSIsImF1ZGl0UERPTURpc3BsYXlzIiwicmVmcmVzaFNWRyIsImdldFBoZXRpb0VsZW1lbnRBdCIsInBvaW50Iiwibm9kZSIsImdldFBoZXRpb01vdXNlSGl0IiwiaXNQaGV0aW9JbnN0cnVtZW50ZWQiLCJzaXplRGlydHkiLCJzaXplIiwiY2xpcCIsImlzV2ViR0xBbGxvd2VkIiwid2ViZ2xBbGxvd2VkIiwiZ2V0Um9vdE5vZGUiLCJnZXRSb290QmFja2JvbmUiLCJyb290QmFja2JvbmUiLCJnZXRTaXplIiwidmFsdWUiLCJnZXRCb3VuZHMiLCJ0b0JvdW5kcyIsImJvdW5kcyIsInNldFNpemUiLCJzZXRXaWR0aEhlaWdodCIsImdldFdpZHRoIiwic2V0V2lkdGgiLCJnZXRIZWlnaHQiLCJzZXRIZWlnaHQiLCJjb2xvciIsImdldEJhY2tncm91bmRDb2xvciIsInJlY3Vyc2l2ZURpc2FibGUiLCJpbnRlcnJ1cHRQb2ludGVycyIsImNsZWFyQmF0Y2hlZEV2ZW50cyIsInJlbW92ZVRlbXBvcmFyeVBvaW50ZXJzIiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwiaW50ZXJydXB0SW5wdXQiLCJzZXRBdHRyaWJ1dGUiLCJyZW1vdmVPdmVybGF5IiwicmVtb3ZlQ2hpbGQiLCJzcGxpY2UiLCJfIiwiaW5kZXhPZiIsImdldFBET01Sb290RWxlbWVudCIsInBkb21Sb290RWxlbWVudCIsImlzQWNjZXNzaWJsZSIsImlzRWxlbWVudFVuZGVyUERPTSIsImVsZW1lbnQiLCJjb250YWlucyIsImRvbUV2ZW50IiwiaXNGdWxsU2NyZWVuIiwiaXNLZXlFdmVudCIsIktFWV9UQUIiLCJyb290RWxlbWVudCIsIm5leHRFbGVtZW50Iiwic2hpZnRLZXkiLCJnZXRQcmV2aW91c0ZvY3VzYWJsZSIsInVuZGVmaW5lZCIsImdldE5leHRGb2N1c2FibGUiLCJ0YXJnZXQiLCJwcmV2ZW50RGVmYXVsdCIsImdldFVzZWRSZW5kZXJlcnNCaXRtYXNrIiwicmVuZGVyZXJzVW5kZXJCYWNrYm9uZSIsImJhY2tib25lIiwiYml0bWFzayIsImVhY2giLCJibG9ja3MiLCJibG9jayIsImRvbURyYXdhYmxlIiwicmVuZGVyZXIiLCJiaXRtYXNrUmVuZGVyZXJBcmVhIiwiaW5zdGFuY2UiLCJwYXNzVHJhbnNmb3JtIiwidHJhbnNmb3JtU3lzdGVtIiwicmVsYXRpdmVUcmFuc2Zvcm0iLCJ1cGRhdGVUcmFuc2Zvcm1MaXN0ZW5lcnNBbmRDb21wdXRlIiwibWFya0RyYXdhYmxlQ2hhbmdlZEJsb2NrIiwiZHJhd2FibGUiLCJtYXJrRm9yUmVkdWNlZFJlZmVyZW5jZXMiLCJpdGVtIiwibWFya0luc3RhbmNlUm9vdEZvckRpc3Bvc2FsIiwibWFya0RyYXdhYmxlRm9yRGlzcG9zYWwiLCJtYXJrRHJhd2FibGVGb3JMaW5rc1VwZGF0ZSIsIm1hcmtDaGFuZ2VJbnRlcnZhbFRvRGlzcG9zZSIsImNoYW5nZUludGVydmFsIiwibmV3QmFja2dyb3VuZENTUyIsInRvQ1NTIiwibW91c2UiLCJjdXJzb3IiLCJDdXJzb3IiLCJzZXRTY2VuZUN1cnNvciIsIm1vdXNlVHJhaWwiLCJ0cmFpbFVuZGVyUG9pbnRlciIsImdldEN1cnNvckNoZWNrSW5kZXgiLCJub2RlcyIsImdldEVmZmVjdGl2ZUN1cnNvciIsIm5hbWUiLCJzZXRFbGVtZW50Q3Vyc29yIiwiZG9jdW1lbnQiLCJib2R5IiwiY3VzdG9tQ3Vyc29ycyIsIm92ZXJmbG93IiwibXNUb3VjaEFjdGlvbiIsInNldFN0eWxlIiwiZm9udFNtb290aGluZyIsIm9uc2VsZWN0c3RhcnQiLCJtc0NvbnRlbnRab29taW5nIiwidXNlckRyYWciLCJ0b3VjaEFjdGlvbiIsInRvdWNoQ2FsbG91dCIsInRhcEhpZ2hsaWdodENvbG9yIiwiY2FudmFzRGF0YVVSTCIsImNhbGxiYWNrIiwiY2FudmFzU25hcHNob3QiLCJjYW52YXMiLCJ0b0RhdGFVUkwiLCJjcmVhdGVFbGVtZW50IiwiY29udGV4dCIsImdldENvbnRleHQiLCJyZW5kZXJUb0NhbnZhcyIsImdldEltYWdlRGF0YSIsInNldFBvaW50ZXJEaXNwbGF5VmlzaWJsZSIsInZpc2liaWxpdHkiLCJoYXNPdmVybGF5Iiwic2V0UG9pbnRlckFyZWFEaXNwbGF5VmlzaWJsZSIsInNldEhpdEFyZWFEaXNwbGF5VmlzaWJsZSIsInNldENhbnZhc05vZGVCb3VuZHNWaXNpYmxlIiwic2V0Rml0dGVkQmxvY2tCb3VuZHNWaXNpYmxlIiwicmVzaXplT25XaW5kb3dSZXNpemUiLCJyZXNpemVyIiwid2luZG93IiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiYWRkRXZlbnRMaXN0ZW5lciIsInVwZGF0ZU9uUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwic3RlcENhbGxiYWNrIiwibGFzdFRpbWUiLCJ0aW1lRWxhcHNlZEluU2Vjb25kcyIsInNlbGYiLCJzdGVwIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwidGltZU5vdyIsIkRhdGUiLCJub3ciLCJlbWl0IiwiY2FuY2VsVXBkYXRlT25SZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImluaXRpYWxpemVFdmVudHMiLCJpbnB1dCIsImNvbm5lY3RMaXN0ZW5lcnMiLCJkZXRhY2hFdmVudHMiLCJkaXNjb25uZWN0TGlzdGVuZXJzIiwiYWRkSW5wdXRMaXN0ZW5lciIsImxpc3RlbmVyIiwiaW5jbHVkZXMiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwiaGFzSW5wdXRMaXN0ZW5lciIsImdldElucHV0TGlzdGVuZXJzIiwic2xpY2UiLCJpbnB1dExpc3RlbmVycyIsImxpc3RlbmVyc0NvcHkiLCJpbnRlcnJ1cHQiLCJpbnRlcnJ1cHRPdGhlclBvaW50ZXJzIiwiZXhjbHVkZVBvaW50ZXIiLCJjdXJyZW50U2NlbmVyeUV2ZW50IiwicG9pbnRlciIsIklOVEVSUlVQVF9PVEhFUl9QT0lOVEVSUyIsImV2ZW50IiwicGhldCIsImpvaXN0IiwiZGlzcGxheSIsImVuc3VyZU5vdFBhaW50aW5nIiwibG9zZVdlYkdMQ29udGV4dHMiLCJsb3NlQmFja2JvbmUiLCJmb3JFYWNoIiwiZ2wiLCJsb3NlQ29udGV4dCIsImZpcnN0RHJhd2FibGUiLCJuZXh0RHJhd2FibGUiLCJsYXN0RHJhd2FibGUiLCJpbnNwZWN0IiwibG9jYWxTdG9yYWdlIiwic2NlbmVyeVNuYXBzaG90IiwiSlNPTiIsInN0cmluZ2lmeSIsImdldERlYnVnSFRNTCIsImhlYWRlclN0eWxlIiwiZGVwdGgiLCJyZXN1bHQiLCJub2RlQ291bnQiLCJjb3VudCIsImNoaWxkcmVuIiwiaW5zdGFuY2VDb3VudCIsImRyYXdhYmxlQ291bnQiLCJjaGlsZERyYXdhYmxlIiwiZHJhd2FibGVDb3VudE1hcCIsImNvdW50UmV0YWluZWREcmF3YWJsZSIsInJldGFpbmVkRHJhd2FibGVDb3VudCIsInNlbGZEcmF3YWJsZSIsInNoYXJlZENhY2hlRHJhd2FibGUiLCJkcmF3YWJsZU5hbWUiLCJibG9ja1N1bW1hcnkiLCJoYXNCYWNrYm9uZSIsImRpdiIsImsiLCJpbnN0YW5jZVN1bW1hcnkiLCJpU3VtbWFyeSIsImFkZFF1YWxpZmllciIsInRleHQiLCJpc1BhaW50ZWQiLCJnZXREZWJ1Z0hUTUxFeHRyYXMiLCJ2aXNpYmxlIiwicmVsYXRpdmVWaXNpYmxlIiwic2VsZlZpc2libGUiLCJmaXR0YWJpbGl0eSIsImFuY2VzdG9yc0ZpdHRhYmxlIiwic2VsZkZpdHRhYmxlIiwicGlja2FibGUiLCJ0cmFpbCIsImlzUGlja2FibGUiLCJjbGlwQXJlYSIsIm1vdXNlQXJlYSIsInRvdWNoQXJlYSIsImdldFJlbmRlcmVyIiwiaXNMYXllclNwbGl0Iiwib3BhY2l0eSIsImRpc2FibGVkT3BhY2l0eSIsIl9ib3VuZHNFdmVudENvdW50IiwiX2JvdW5kc0V2ZW50U2VsZkNvdW50IiwidHJhbnNmb3JtVHlwZSIsInRyYW5zZm9ybSIsImdldE1hdHJpeCIsInR5cGUiLCJJREVOVElUWSIsIlRSQU5TTEFUSU9OXzJEIiwiU0NBTElORyIsIkFGRklORSIsIk9USEVSIiwiRXJyb3IiLCJyZXBsYWNlIiwiaW5kaWNlcyIsImpvaW4iLCJfcmVuZGVyZXJTdW1tYXJ5IiwiX3JlbmRlcmVyQml0bWFzayIsImJpdG1hc2tOb2RlRGVmYXVsdCIsImRyYXdhYmxlU3VtbWFyeSIsImRyYXdhYmxlU3RyaW5nIiwiZGlydHkiLCJmaXR0YWJsZSIsInByaW50SW5zdGFuY2VTdWJ0cmVlIiwiYWRkRHJhd2FibGUiLCJjaGlsZEluc3RhbmNlIiwicHJpbnREcmF3YWJsZVN1YnRyZWUiLCJ0b1BhdGhTdHJpbmciLCJiYWNrYm9uZUluc3RhbmNlIiwiZ2V0RGVidWdVUkkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJwb3B1cERlYnVnIiwib3BlbiIsImlmcmFtZURlYnVnIiwiaWZyYW1lIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwiY29udGVudFdpbmRvdyIsIndyaXRlIiwiY2xvc2UiLCJiYWNrZ3JvdW5kIiwiY2xvc2VCdXR0b24iLCJyaWdodCIsInRleHRDb250ZW50IiwiZXZlbnRUeXBlIiwiZ2V0UERPTURlYnVnSFRNTCIsImluZGVudCIsInJlY3Vyc2UiLCJpbmRlbnRhdGlvbiIsImlzUm9vdEluc3RhbmNlIiwidGFnTmFtZSIsImNoaWxkIiwicGFyYWxsZWxET00iLCJvdXRlckhUTUwiLCJsaW5lcyIsInNwbGl0IiwibGluZSIsImlzRW5kVGFnIiwic3RhcnRzV2l0aCIsImZvcmVpZ25PYmplY3RSYXN0ZXJpemF0aW9uIiwiY2FudmFzVXJsTWFwIiwidW5rbm93bklkcyIsImFkZENhbnZhcyIsInNjYW5Gb3JDYW52YXNlcyIsIkhUTUxDYW52YXNFbGVtZW50IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJkb2MiLCJpbXBsZW1lbnRhdGlvbiIsImNyZWF0ZUhUTUxEb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsImlubmVySFRNTCIsIm5hbWVzcGFjZVVSSSIsIlJPT1RfQ0xBU1NfTkFNRSIsImRpc3BsYXlDYW52YXNlcyIsImRpc3BsYXlDYW52YXMiLCJjc3NUZXh0IiwiZGlzcGxheUltZyIsInNyYyIsInBhcmVudE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJkaXNwbGF5V2lkdGgiLCJkaXNwbGF5SGVpZ2h0IiwiY29tcGxldGVGdW5jdGlvbiIsImVsZW1lbnRUb1NWR0RhdGFVUkwiLCJyZXBsYWNlZEltYWdlcyIsImhhc1JlcGxhY2VkSW1hZ2VzIiwiZGlzcGxheVNWR0ltYWdlcyIsImoiLCJkaXNwbGF5U1ZHSW1hZ2UiLCJjdXJyZW50SHJlZiIsImdldEF0dHJpYnV0ZSIsInJlZkltYWdlIiwiSW1hZ2UiLCJzdmdJbWFnZSIsIm9ubG9hZCIsInJlZkNhbnZhcyIsInJlZkNvbnRleHQiLCJkcmF3SW1hZ2UiLCJvbmVycm9yIiwicG9wdXBSYXN0ZXJpemF0aW9uIiwidXJsIiwiZ2V0VHJhaWxGcm9tUERPTUluZGljZXNTdHJpbmciLCJpbmRpY2VzU3RyaW5nIiwiaW5kZXhTdHJpbmdzIiwiUERPTV9VTklRVUVfSURfU0VQQVJBVE9SIiwiZGlnaXQiLCJOdW1iZXIiLCJyZWZyZXNoU1ZHT25OZXh0RnJhbWUiLCJyZW1vdmVSb290ZWREaXNwbGF5IiwicmVtb3ZlTGlzdGVuZXIiLCJ4aHRtbCIsIlhNTFNlcmlhbGl6ZXIiLCJzZXJpYWxpemVUb1N0cmluZyIsImRhdGEiLCJpbWciLCJ1aW50OGFycmF5IiwiVGV4dEVuY29kZXJMaXRlIiwiZW5jb2RlIiwiYmFzZTY0IiwiZnJvbUJ5dGVBcnJheSIsImlzRGlzcG9zZWQiLCJyZWdpc3RlciIsInVzZXJHZXN0dXJlRW1pdHRlciJdLCJzb3VyY2VzIjpbIkRpc3BsYXkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBwZXJzaXN0ZW50IGRpc3BsYXkgb2YgYSBzcGVjaWZpYyBOb2RlIGFuZCBpdHMgZGVzY2VuZGFudHMsIHdoaWNoIGlzIHVwZGF0ZWQgYXQgZGlzY3JldGUgcG9pbnRzIGluIHRpbWUuXHJcbiAqXHJcbiAqIFVzZSBkaXNwbGF5LmdldERPTUVsZW1lbnQgb3IgZGlzcGxheS5kb21FbGVtZW50IHRvIHJldHJpZXZlIHRoZSBEaXNwbGF5J3MgRE9NIHJlcHJlc2VudGF0aW9uLlxyXG4gKiBVc2UgZGlzcGxheS51cGRhdGVEaXNwbGF5KCkgdG8gdHJpZ2dlciB0aGUgdmlzdWFsIHVwZGF0ZSBpbiB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50LlxyXG4gKlxyXG4gKiBBIHN0YW5kYXJkIHdheSBvZiB1c2luZyBhIERpc3BsYXkgd2l0aCBTY2VuZXJ5IGlzIHRvOlxyXG4gKiAxLiBDcmVhdGUgYSBOb2RlIHRoYXQgd2lsbCBiZSB0aGUgcm9vdFxyXG4gKiAyLiBDcmVhdGUgYSBEaXNwbGF5LCByZWZlcmVuY2luZyB0aGF0IG5vZGVcclxuICogMy4gTWFrZSBjaGFuZ2VzIHRvIHRoZSBzY2VuZSBncmFwaFxyXG4gKiA0LiBDYWxsIGRpc3BsYXkudXBkYXRlRGlzcGxheSgpIHRvIGRyYXcgdGhlIHNjZW5lIGdyYXBoIGludG8gdGhlIERpc3BsYXlcclxuICogNS4gR28gdG8gKDMpXHJcbiAqXHJcbiAqIENvbW1vbiB3YXlzIHRvIHNpbXBsaWZ5IHRoZSBjaGFuZ2UvdXBkYXRlIGxvb3Agd291bGQgYmUgdG86XHJcbiAqIC0gVXNlIE5vZGUtYmFzZWQgZXZlbnRzLiBJbml0aWFsaXplIGl0IHdpdGggRGlzcGxheS5pbml0aWFsaXplRXZlbnRzKCksIHRoZW5cclxuICogICBhZGQgaW5wdXQgbGlzdGVuZXJzIHRvIHBhcnRzIG9mIHRoZSBzY2VuZSBncmFwaCAoc2VlIE5vZGUuYWRkSW5wdXRMaXN0ZW5lcikuXHJcbiAqIC0gRXhlY3V0ZSBjb2RlIChhbmQgdXBkYXRlIHRoZSBkaXNwbGF5IGFmdGVyd2FyZHMpIGJ5IHVzaW5nIERpc3BsYXkudXBkYXRlT25SZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXHJcbiAqXHJcbiAqIEludGVybmFsIGRvY3VtZW50YXRpb246XHJcbiAqXHJcbiAqIExpZmVjeWNsZSBpbmZvcm1hdGlvbjpcclxuICogICBJbnN0YW5jZSAoY3JlYXRlLGRpc3Bvc2UpXHJcbiAqICAgICAtIG91dCBvZiB1cGRhdGU6ICAgICAgICAgICAgU3RhdGVsZXNzIHN0dWIgaXMgY3JlYXRlZCBzeW5jaHJvbm91c2x5IHdoZW4gYSBOb2RlJ3MgY2hpbGRyZW4gYXJlIGFkZGVkIHdoZXJlIHdlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGF2ZSBubyByZWxldmFudCBJbnN0YW5jZS5cclxuICogICAgIC0gc3RhcnQgb2YgdXBkYXRlOiAgICAgICAgICBDcmVhdGVzIGZpcnN0IChyb290KSBpbnN0YW5jZSBpZiBpdCBkb2Vzbid0IGV4aXN0IChzdGF0ZWxlc3Mgc3R1YikuXHJcbiAqICAgICAtIHN5bmN0cmVlOiAgICAgICAgICAgICAgICAgQ3JlYXRlIGRlc2NlbmRhbnQgaW5zdGFuY2VzIHVuZGVyIHN0dWJzLCBmaWxscyBpbiBzdGF0ZSwgYW5kIG1hcmtzIHJlbW92ZWQgc3VidHJlZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RzIGZvciBkaXNwb3NhbC5cclxuICogICAgIC0gdXBkYXRlIGluc3RhbmNlIGRpc3Bvc2FsOiBEaXNwb3NlcyByb290IGluc3RhbmNlcyB0aGF0IHdlcmUgbWFya2VkLiBUaGlzIGFsc28gZGlzcG9zZXMgYWxsIGRlc2NlbmRhbnRcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZXMsIGFuZCBmb3IgZXZlcnkgaW5zdGFuY2UsXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXQgZGlzcG9zZXMgdGhlIGN1cnJlbnRseS1hdHRhY2hlZCBkcmF3YWJsZXMuXHJcbiAqICAgRHJhd2FibGUgKGNyZWF0ZSxkaXNwb3NlKVxyXG4gKiAgICAgLSBzeW5jdHJlZTogICAgICAgICAgICAgICAgIENyZWF0ZXMgYWxsIGRyYXdhYmxlcyB3aGVyZSBuZWNlc3NhcnkuIElmIGl0IHJlcGxhY2VzIGEgc2VsZi9ncm91cC9zaGFyZWQgZHJhd2FibGUgb25cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgaW5zdGFuY2UsXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdCBvbGQgZHJhd2FibGUgaXMgbWFya2VkIGZvciBkaXNwb3NhbC5cclxuICogICAgIC0gdXBkYXRlIGluc3RhbmNlIGRpc3Bvc2FsOiBBbnkgZHJhd2FibGVzIGF0dGFjaGVkIHRvIGRpc3Bvc2VkIGluc3RhbmNlcyBhcmUgZGlzcG9zZWQgdGhlbXNlbHZlcyAoc2VlIEluc3RhbmNlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlmZWN5Y2xlKS5cclxuICogICAgIC0gdXBkYXRlIGRyYXdhYmxlIGRpc3Bvc2FsOiBBbnkgbWFya2VkIGRyYXdhYmxlcyB0aGF0IHdlcmUgcmVwbGFjZWQgb3IgcmVtb3ZlZCBmcm9tIGFuIGluc3RhbmNlIChpdCBkaWRuJ3RcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWludGFpbiBhIHJlZmVyZW5jZSkgYXJlIGRpc3Bvc2VkLlxyXG4gKlxyXG4gKiAgIGFkZC9yZW1vdmUgZHJhd2FibGVzIGZyb20gYmxvY2tzOlxyXG4gKiAgICAgLSBzdGl0Y2hpbmcgY2hhbmdlcyBwZW5kaW5nIFwicGFyZW50c1wiLCBtYXJrcyBmb3IgYmxvY2sgdXBkYXRlXHJcbiAqICAgICAtIGJhY2tib25lcyBtYXJrZWQgZm9yIGRpc3Bvc2FsIChlLmcuIGluc3RhbmNlIGlzIHN0aWxsIHRoZXJlLCBqdXN0IGNoYW5nZWQgdG8gbm90IGhhdmUgYSBiYWNrYm9uZSkgd2lsbCBtYXJrXHJcbiAqICAgICAgICAgZHJhd2FibGVzIGZvciBibG9jayB1cGRhdGVzXHJcbiAqICAgICAtIGFkZC9yZW1vdmUgZHJhd2FibGVzIHBoYXNlIHVwZGF0ZXMgZHJhd2FibGVzIHRoYXQgd2VyZSBtYXJrZWRcclxuICogICAgIC0gZGlzcG9zZWQgYmFja2JvbmUgaW5zdGFuY2VzIHdpbGwgb25seSByZW1vdmUgZHJhd2FibGVzIGlmIHRoZXkgd2VyZW4ndCBtYXJrZWQgZm9yIHJlbW92YWwgcHJldmlvdXNseSAoZS5nLiBpblxyXG4gKiAgICAgICAgIGNhc2Ugd2UgYXJlIGZyb20gYSByZW1vdmVkIGluc3RhbmNlKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBEaW1lbnNpb24yIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9EaW1lbnNpb24yLmpzJztcclxuaW1wb3J0IHsgTWF0cml4M1R5cGUgfSBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IGVzY2FwZUhUTUwgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2VzY2FwZUhUTUwuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBBcmlhTGl2ZUFubm91bmNlciBmcm9tICcuLi8uLi8uLi91dHRlcmFuY2UtcXVldWUvanMvQXJpYUxpdmVBbm5vdW5jZXIuanMnO1xyXG5pbXBvcnQgVXR0ZXJhbmNlUXVldWUgZnJvbSAnLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1V0dGVyYW5jZVF1ZXVlLmpzJztcclxuaW1wb3J0IHsgQmFja2JvbmVEcmF3YWJsZSwgQmxvY2ssIENhbnZhc0Jsb2NrLCBDYW52YXNOb2RlQm91bmRzT3ZlcmxheSwgQ2hhbmdlSW50ZXJ2YWwsIENvbG9yLCBET01CbG9jaywgRE9NRHJhd2FibGUsIERyYXdhYmxlLCBGZWF0dXJlcywgRml0dGVkQmxvY2tCb3VuZHNPdmVybGF5LCBGb2N1c01hbmFnZXIsIEZ1bGxTY3JlZW4sIGdsb2JhbEtleVN0YXRlVHJhY2tlciwgSGlnaGxpZ2h0T3ZlcmxheSwgSGl0QXJlYU92ZXJsYXksIElucHV0LCBJbnB1dE9wdGlvbnMsIEluc3RhbmNlLCBLZXlib2FyZFV0aWxzLCBOb2RlLCBQRE9NSW5zdGFuY2UsIFBET01TaWJsaW5nU3R5bGUsIFBET01UcmVlLCBQRE9NVXRpbHMsIFBvaW50ZXIsIFBvaW50ZXJBcmVhT3ZlcmxheSwgUG9pbnRlck92ZXJsYXksIFJlbmRlcmVyLCBzY2VuZXJ5LCBTY2VuZXJ5RXZlbnQsIHNjZW5lcnlTZXJpYWxpemUsIFNlbGZEcmF3YWJsZSwgVElucHV0TGlzdGVuZXIsIFRPdmVybGF5LCBUcmFpbCwgVXRpbHMsIFdlYkdMQmxvY2sgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgU2FmYXJpV29ya2Fyb3VuZE92ZXJsYXkgZnJvbSAnLi4vb3ZlcmxheXMvU2FmYXJpV29ya2Fyb3VuZE92ZXJsYXkuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICAvLyBJbml0aWFsIChvciBvdmVycmlkZSkgZGlzcGxheSB3aWR0aFxyXG4gIHdpZHRoPzogbnVtYmVyO1xyXG5cclxuICAvLyBJbml0aWFsIChvciBvdmVycmlkZSkgZGlzcGxheSBoZWlnaHRcclxuICBoZWlnaHQ/OiBudW1iZXI7XHJcblxyXG4gIC8vIEFwcGxpZXMgQ1NTIHN0eWxlcyB0byB0aGUgcm9vdCBET00gZWxlbWVudCB0aGF0IG1ha2UgaXQgYW1lbmFibGUgdG8gaW50ZXJhY3RpdmUgY29udGVudFxyXG4gIGFsbG93Q1NTSGFja3M/OiBib29sZWFuO1xyXG5cclxuICAvLyBXaGV0aGVyIHdlIGFsbG93IHRoZSBkaXNwbGF5IHRvIHB1dCBhIHJlY3RhbmdsZSBpbiBmcm9udCBvZiBldmVyeXRoaW5nIHRoYXQgc3VidGx5IHNoaWZ0cyBldmVyeSBmcmFtZSwgaW4gb3JkZXIgdG9cclxuICAvLyBmb3JjZSByZXBhaW50cyBmb3IgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2dlb21ldHJpYy1vcHRpY3MtYmFzaWNzL2lzc3Vlcy8zMS5cclxuICBhbGxvd1NhZmFyaVJlZHJhd1dvcmthcm91bmQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBVc3VhbGx5IGFueXRoaW5nIGRpc3BsYXllZCBvdXRzaWRlIG91ciBkb20gZWxlbWVudCBpcyBoaWRkZW4gd2l0aCBDU1Mgb3ZlcmZsb3cuXHJcbiAgYWxsb3dTY2VuZU92ZXJmbG93PzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgZmFsc2UsIHRoaXMgd2lsbCBkaXNhYmxlIGxheWVyIGZpdHRpbmcgKGxpa2UgcHV0dGluZyBwcmV2ZW50Rml0OiB0cnVlIG9uIE5vZGVzLCBidXQgZm9yIHRoZSBlbnRpcmUgRGlzcGxheSkuXHJcbiAgLy8gTGF5ZXIgZml0dGluZyBoYXMgY2F1c2VkIHNvbWUgdW5zaWdodGx5IGppdHRlcmluZyAoaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEyODkpLCBzbyB0aGlzXHJcbiAgLy8gYWxsb3dzIGl0IHRvIGJlIHR1cm5lZCBvbiBpbiBhIGNhc2UtYnktY2FzZSBtYW5uZXIuXHJcbiAgYWxsb3dMYXllckZpdHRpbmc/OiBib29sZWFuO1xyXG5cclxuICAvLyBXaGF0IGN1cnNvciBpcyB1c2VkIHdoZW4gbm8gb3RoZXIgY3Vyc29yIGlzIHNwZWNpZmllZFxyXG4gIGRlZmF1bHRDdXJzb3I/OiBzdHJpbmc7XHJcblxyXG4gIC8vIEZvcmNlcyBTVkcgZWxlbWVudHMgdG8gYmUgcmVmcmVzaGVkIGV2ZXJ5IGZyYW1lLCB3aGljaCBjYW4gZm9yY2UgcmVwYWludGluZyBhbmQgZGV0ZWN0IChvciBwb3RlbnRpYWxseSBpbiBzb21lXHJcbiAgLy8gY2FzZXMgd29yayBhcm91bmQpIFNWRyByZW5kZXJpbmcgYnJvd3NlciBidWdzLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1MDdcclxuICBmb3JjZVNWR1JlZnJlc2g/OiBib29sZWFuO1xyXG5cclxuICAvLyBJbml0aWFsIGJhY2tncm91bmQgY29sb3JcclxuICBiYWNrZ3JvdW5kQ29sb3I/OiBDb2xvciB8IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgV2ViR0wgd2lsbCBwcmVzZXJ2ZSB0aGUgZHJhd2luZyBidWZmZXJcclxuICAvLyBXQVJOSU5HITogVGhpcyBjYW4gc2lnbmlmaWNhbnRseSByZWR1Y2UgcGVyZm9ybWFuY2UgaWYgc2V0IHRvIHRydWUuXHJcbiAgcHJlc2VydmVEcmF3aW5nQnVmZmVyPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciBXZWJHTCBpcyBlbmFibGVkIGF0IGFsbCBmb3IgZHJhd2FibGVzIGluIHRoaXMgRGlzcGxheVxyXG4gIC8vIE1ha2VzIGl0IHBvc3NpYmxlIHRvIGRpc2FibGUgV2ViR0wgZm9yIGVhc2Ugb2YgdGVzdGluZyBvbiBub24tV2ViR0wgcGxhdGZvcm1zLCBzZWUgIzI4OVxyXG4gIGFsbG93V2ViR0w/OiBib29sZWFuO1xyXG5cclxuICAvLyBFbmFibGVzIGFjY2Vzc2liaWxpdHkgZmVhdHVyZXNcclxuICBhY2Nlc3NpYmlsaXR5PzogYm9vbGVhbjtcclxuXHJcbiAgLy8ge2Jvb2xlYW59IC0gRW5hYmxlcyBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGluIHRoZSBIaWdobGlnaHRPdmVybGF5LiBUaGVzZSBhcmUgaGlnaGxpZ2h0cyB0aGF0IHN1cnJvdW5kXHJcbiAgLy8gaW50ZXJhY3RpdmUgY29tcG9uZW50cyB3aGVuIHVzaW5nIG1vdXNlIG9yIHRvdWNoIHdoaWNoIGltcHJvdmVzIGxvdyB2aXNpb24gYWNjZXNzLlxyXG4gIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciBtb3VzZS90b3VjaC9rZXlib2FyZCBpbnB1dHMgYXJlIGVuYWJsZWQgKGlmIGlucHV0IGhhcyBiZWVuIGFkZGVkKS5cclxuICBpbnRlcmFjdGl2ZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIHRydWUsIGlucHV0IGV2ZW50IGxpc3RlbmVycyB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnQgaW5zdGVhZCBvZiB0aGUgd2luZG93LlxyXG4gIC8vIE5vcm1hbGx5LCBhdHRhY2hpbmcgbGlzdGVuZXJzIHRvIHRoZSB3aW5kb3cgaXMgcHJlZmVycmVkIChpdCB3aWxsIHNlZSBtb3VzZSBtb3Zlcy91cHMgb3V0c2lkZSBvZiB0aGUgYnJvd3NlclxyXG4gIC8vIHdpbmRvdywgYWxsb3dpbmcgY29ycmVjdCBidXR0b24gdHJhY2tpbmcpLCBob3dldmVyIHRoZXJlIG1heSBiZSBpbnN0YW5jZXMgd2hlcmUgYSBnbG9iYWwgbGlzdGVuZXIgaXMgbm90XHJcbiAgLy8gcHJlZmVycmVkLlxyXG4gIGxpc3RlblRvT25seUVsZW1lbnQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBGb3J3YXJkZWQgdG8gSW5wdXQ6IElmIHRydWUsIG1vc3QgZXZlbnQgdHlwZXMgd2lsbCBiZSBiYXRjaGVkIHVudGlsIG90aGVyd2lzZSB0cmlnZ2VyZWQuXHJcbiAgYmF0Y2hET01FdmVudHM/OiBib29sZWFuO1xyXG5cclxuICAvLyBJZiB0cnVlLCB0aGUgaW5wdXQgZXZlbnQgbG9jYXRpb24gKGJhc2VkIG9uIHRoZSB0b3AtbGVmdCBvZiB0aGUgYnJvd3NlciB0YWIncyB2aWV3cG9ydCwgd2l0aCBub1xyXG4gIC8vIHNjYWxpbmcgYXBwbGllZCkgd2lsbCBiZSB1c2VkLiBVc3VhbGx5LCB0aGlzIGlzIG5vdCBhIHNhZmUgYXNzdW1wdGlvbiwgc28gd2hlbiBmYWxzZSB0aGUgbG9jYXRpb24gb2YgdGhlXHJcbiAgLy8gZGlzcGxheSdzIERPTSBlbGVtZW50IHdpbGwgYmUgdXNlZCB0byBnZXQgdGhlIGNvcnJlY3QgZXZlbnQgbG9jYXRpb24uIFRoZXJlIGlzIGEgc2xpZ2h0IHBlcmZvcm1hbmNlIGhpdCB0b1xyXG4gIC8vIGRvaW5nIHNvLCB0aHVzIHRoaXMgb3B0aW9uIGlzIHByb3ZpZGVkIGlmIHRoZSB0b3AtbGVmdCBsb2NhdGlvbiBjYW4gYmUgZ3VhcmFudGVlZC5cclxuICAvLyBOT1RFOiBSb3RhdGlvbiBvZiB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IChlLmcuIHdpdGggYSBDU1MgdHJhbnNmb3JtKSB3aWxsIHJlc3VsdCBpbiBhbiBpbmNvcnJlY3QgZXZlbnRcclxuICAvLyAgICAgICBtYXBwaW5nLCBhcyBnZXRCb3VuZGluZ0NsaWVudFJlY3QoKSBjYW4ndCB3b3JrIHdpdGggdGhpcy4gZ2V0Qm94UXVhZHMoKSBzaG91bGQgZml4IHRoaXMgd2hlbiBicm93c2VyXHJcbiAgLy8gICAgICAgc3VwcG9ydCBpcyBhdmFpbGFibGUuXHJcbiAgYXNzdW1lRnVsbFdpbmRvdz86IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgU2NlbmVyeSB3aWxsIHRyeSB0byBhZ2dyZXNzaXZlbHkgcmUtY3JlYXRlIFdlYkdMIENhbnZhcy9jb250ZXh0IGluc3RlYWQgb2Ygd2FpdGluZyBmb3JcclxuICAvLyBhIGNvbnRleHQgcmVzdG9yZWQgZXZlbnQuIFNvbWV0aW1lcyBjb250ZXh0IGxvc3NlcyBjYW4gb2NjdXIgd2l0aG91dCBhIHJlc3RvcmF0aW9uIGFmdGVyd2FyZHMsIGJ1dCB0aGlzIGNhblxyXG4gIC8vIGp1bXAtc3RhcnQgdGhlIHByb2Nlc3MuXHJcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8zNDcuXHJcbiAgYWdncmVzc2l2ZUNvbnRleHRSZWNyZWF0aW9uPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgYHBhc3NpdmVgIGZsYWcgc2hvdWxkIGJlIHNldCB3aGVuIGFkZGluZyBhbmQgcmVtb3ZpbmcgRE9NIGV2ZW50IGxpc3RlbmVycy5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzc3MCBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gIC8vIElmIGl0IGlzIHRydWUgb3IgZmFsc2UsIHRoYXQgaXMgdGhlIHZhbHVlIG9mIHRoZSBwYXNzaXZlIGZsYWcgdGhhdCB3aWxsIGJlIHVzZWQuIElmIGl0IGlzIG51bGwsIHRoZSBkZWZhdWx0XHJcbiAgLy8gYmVoYXZpb3Igb2YgdGhlIGJyb3dzZXIgd2lsbCBiZSB1c2VkLlxyXG4gIC8vXHJcbiAgLy8gU2FmYXJpIGRvZXNuJ3Qgc3VwcG9ydCB0b3VjaC1hY3Rpb246IG5vbmUsIHNvIHdlIE5FRUQgdG8gbm90IHVzZSBwYXNzaXZlIGV2ZW50cyAod2hpY2ggd291bGQgbm90IGFsbG93XHJcbiAgLy8gcHJldmVudERlZmF1bHQgdG8gZG8gYW55dGhpbmcsIHNvIGRyYWdzIGFjdHVhbGx5IGNhbiBzY3JvbGwgdGhlIHNpbSkuXHJcbiAgLy8gQ2hyb21lIGFsc28gZGlkIHRoZSBzYW1lIFwicGFzc2l2ZSBieSBkZWZhdWx0XCIsIGJ1dCBiZWNhdXNlIHdlIGhhdmUgYHRvdWNoLWFjdGlvbjogbm9uZWAgaW4gcGxhY2UsIGl0IGRvZXNuJ3RcclxuICAvLyBhZmZlY3QgdXMsIGFuZCB3ZSBjYW4gcG90ZW50aWFsbHkgZ2V0IHBlcmZvcm1hbmNlIGltcHJvdmVtZW50cyBieSBhbGxvd2luZyBwYXNzaXZlIGV2ZW50cy5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzc3MCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICBwYXNzaXZlRXZlbnRzPzogYm9vbGVhbiB8IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIsIGlmIG5vIFdlYkdMIGFudGlhbGlhc2luZyBpcyBkZXRlY3RlZCwgdGhlIGJhY2tpbmcgc2NhbGUgY2FuIGJlIGluY3JlYXNlZCB0byBwcm92aWRlIHNvbWVcclxuICAvLyBhbnRpYWxpYXNpbmcgYmVuZWZpdC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NTkuXHJcbiAgYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmc/OiBib29sZWFuO1xyXG5cclxuICAvLyBBbiBIVE1MRWxlbWVudCB1c2VkIHRvIGNvbnRhaW4gdGhlIGNvbnRlbnRzIG9mIHRoZSBEaXNwbGF5XHJcbiAgY29udGFpbmVyPzogSFRNTEVsZW1lbnQ7XHJcbn07XHJcblxyXG50eXBlIFBhcmVudE9wdGlvbnMgPSBQaWNrPFBoZXRpb09iamVjdE9wdGlvbnMsICd0YW5kZW0nPjtcclxuZXhwb3J0IHR5cGUgRGlzcGxheU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBhcmVudE9wdGlvbnM7XHJcblxyXG5jb25zdCBDVVNUT01fQ1VSU09SUyA9IHtcclxuICAnc2NlbmVyeS1ncmFiLXBvaW50ZXInOiBbICdncmFiJywgJy1tb3otZ3JhYicsICctd2Via2l0LWdyYWInLCAncG9pbnRlcicgXSxcclxuICAnc2NlbmVyeS1ncmFiYmluZy1wb2ludGVyJzogWyAnZ3JhYmJpbmcnLCAnLW1vei1ncmFiYmluZycsICctd2Via2l0LWdyYWJiaW5nJywgJ3BvaW50ZXInIF1cclxufSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XHJcblxyXG5sZXQgZ2xvYmFsSWRDb3VudGVyID0gMTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3BsYXkge1xyXG5cclxuICAvLyB1bmlxdWUgSUQgZm9yIHRoZSBkaXNwbGF5IGluc3RhbmNlLCAoc2NlbmVyeS1pbnRlcm5hbCksIGFuZCB1c2VmdWwgZm9yIGRlYnVnZ2luZyB3aXRoIG11bHRpcGxlIGRpc3BsYXlzLlxyXG4gIHB1YmxpYyByZWFkb25seSBpZDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgKGludGVncmFsLCA+IDApIGRpbWVuc2lvbnMgb2YgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCAob25seSB1cGRhdGVzIHRoZSBET00gZWxlbWVudCBvbiB1cGRhdGVEaXNwbGF5KCkpXHJcbiAgcHVibGljIHJlYWRvbmx5IHNpemVQcm9wZXJ0eTogVFByb3BlcnR5PERpbWVuc2lvbjI+O1xyXG5cclxuICAvLyBkYXRhIHN0cnVjdHVyZSBmb3IgbWFuYWdpbmcgYXJpYS1saXZlIGFsZXJ0cyB0aGUgdGhpcyBEaXNwbGF5IGluc3RhbmNlXHJcbiAgcHVibGljIGRlc2NyaXB0aW9uVXR0ZXJhbmNlUXVldWU6IFV0dGVyYW5jZVF1ZXVlO1xyXG5cclxuICAvLyBNYW5hZ2VzIHRoZSB2YXJpb3VzIHR5cGVzIG9mIEZvY3VzIHRoYXQgY2FuIGdvIHRocm91Z2ggdGhlIERpc3BsYXksIGFzIHdlbGwgYXMgUHJvcGVydGllc1xyXG4gIC8vIGNvbnRyb2xsaW5nIHdoaWNoIGZvcm1zIG9mIGZvY3VzIHNob3VsZCBiZSBkaXNwbGF5ZWQgaW4gdGhlIEhpZ2hsaWdodE92ZXJsYXkuXHJcbiAgcHVibGljIGZvY3VzTWFuYWdlcjogRm9jdXNNYW5hZ2VyO1xyXG5cclxuICAvLyAocGhldC1pbyxzY2VuZXJ5KSAtIFdpbGwgYmUgZmlsbGVkIGluIHdpdGggYSBwaGV0LnNjZW5lcnkuSW5wdXQgaWYgZXZlbnQgaGFuZGxpbmcgaXMgZW5hYmxlZFxyXG4gIHB1YmxpYyBfaW5wdXQ6IElucHV0IHwgbnVsbDtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFdoZXRoZXIgYWNjZXNzaWJpbGl0eSBpcyBlbmFibGVkIGZvciB0aGlzIHBhcnRpY3VsYXIgZGlzcGxheS5cclxuICBwdWJsaWMgcmVhZG9ubHkgX2FjY2Vzc2libGU6IGJvb2xlYW47XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyByZWFkb25seSBfcHJlc2VydmVEcmF3aW5nQnVmZmVyOiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgbWFwIGZyb20gTm9kZSBJRCB0byBJbnN0YW5jZSwgZm9yIGZhc3QgbG9va3VwXHJcbiAgcHVibGljIF9zaGFyZWRDYW52YXNJbnN0YW5jZXM6IFJlY29yZDxudW1iZXIsIEluc3RhbmNlPjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIC0gV2UgaGF2ZSBhIG1vbm90b25pY2FsbHktaW5jcmVhc2luZyBmcmFtZSBJRCwgZ2VuZXJhbGx5IGZvciB1c2Ugd2l0aCBhIHBhdHRlcm5cclxuICAvLyB3aGVyZSB3ZSBjYW4gbWFyayBvYmplY3RzIHdpdGggdGhpcyB0byBub3RlIHRoYXQgdGhleSBhcmUgZWl0aGVyIHVwLXRvLWRhdGUgb3IgbmVlZCByZWZyZXNoaW5nIGR1ZSB0byB0aGlzXHJcbiAgLy8gcGFydGljdWxhciBmcmFtZSAod2l0aG91dCBoYXZpbmcgdG8gY2xlYXIgdGhhdCBpbmZvcm1hdGlvbiBhZnRlciB1c2UpLiBUaGlzIGlzIGluY3JlbWVudGVkIGV2ZXJ5IGZyYW1lXHJcbiAgcHVibGljIF9mcmFtZUlkOiBudW1iZXI7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYWdncmVzc2l2ZUNvbnRleHRSZWNyZWF0aW9uOiBib29sZWFuO1xyXG4gIHB1YmxpYyBfYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmc6IGJvb2xlYW47XHJcbiAgcHVibGljIF9hbGxvd0xheWVyRml0dGluZzogYm9vbGVhbjtcclxuICBwdWJsaWMgX2ZvcmNlU1ZHUmVmcmVzaDogYm9vbGVhbjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfYWxsb3dXZWJHTDogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9hbGxvd0NTU0hhY2tzOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2FsbG93U2NlbmVPdmVyZmxvdzogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9kZWZhdWx0Q3Vyc29yOiBzdHJpbmc7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Jvb3ROb2RlOiBOb2RlO1xyXG4gIHByaXZhdGUgX3Jvb3RCYWNrYm9uZTogQmFja2JvbmVEcmF3YWJsZSB8IG51bGw7IC8vIHRvIGJlIGZpbGxlZCBpbiBsYXRlclxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RvbUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gIHByaXZhdGUgX2Jhc2VJbnN0YW5jZTogSW5zdGFuY2UgfCBudWxsOyAvLyB3aWxsIGJlIGZpbGxlZCB3aXRoIHRoZSByb290IEluc3RhbmNlXHJcblxyXG4gIC8vIFVzZWQgdG8gY2hlY2sgYWdhaW5zdCBuZXcgc2l6ZSB0byBzZWUgd2hhdCB3ZSBuZWVkIHRvIGNoYW5nZVxyXG4gIHByaXZhdGUgX2N1cnJlbnRTaXplOiBEaW1lbnNpb24yO1xyXG5cclxuICBwcml2YXRlIF9kaXJ0eVRyYW5zZm9ybVJvb3RzOiBJbnN0YW5jZVtdO1xyXG4gIHByaXZhdGUgX2RpcnR5VHJhbnNmb3JtUm9vdHNXaXRob3V0UGFzczogSW5zdGFuY2VbXTtcclxuICBwcml2YXRlIF9pbnN0YW5jZVJvb3RzVG9EaXNwb3NlOiBJbnN0YW5jZVtdO1xyXG5cclxuICAvLyBBdCB0aGUgZW5kIG9mIERpc3BsYXkudXBkYXRlLCByZWR1Y2VSZWZlcmVuY2VzIHdpbGwgYmUgY2FsbGVkIG9uIGFsbCBvZiB0aGVzZS4gSXQncyBtZWFudCB0b1xyXG4gIC8vIGNhdGNoIHZhcmlvdXMgb2JqZWN0cyB0aGF0IHdvdWxkIHVzdWFsbHkgaGF2ZSB1cGRhdGUoKSBjYWxsZWQsIGJ1dCBpZiB0aGV5IGFyZSBpbnZpc2libGUgb3Igb3RoZXJ3aXNlIG5vdCB1cGRhdGVkXHJcbiAgLy8gZm9yIHBlcmZvcm1hbmNlLCB0aGV5IG1heSBuZWVkIHRvIHJlbGVhc2UgcmVmZXJlbmNlcyBhbm90aGVyIHdheSBpbnN0ZWFkLlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzL2lzc3Vlcy8zNTZcclxuICBwcml2YXRlIF9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkOiB7IHJlZHVjZVJlZmVyZW5jZXM6ICgpID0+IHZvaWQgfVtdO1xyXG5cclxuICBwcml2YXRlIF9kcmF3YWJsZXNUb0Rpc3Bvc2U6IERyYXdhYmxlW107XHJcblxyXG4gIC8vIEJsb2NrIGNoYW5nZXMgYXJlIGhhbmRsZWQgYnkgY2hhbmdpbmcgdGhlIFwicGVuZGluZ1wiIGJsb2NrL2JhY2tib25lIG9uIGRyYXdhYmxlcy4gV2VcclxuICAvLyB3YW50IHRvIGNoYW5nZSB0aGVtIGFsbCBhZnRlciB0aGUgbWFpbiBzdGl0Y2ggcHJvY2VzcyBoYXMgY29tcGxldGVkLCBzbyB3ZSBjYW4gZ3VhcmFudGVlIHRoYXQgYSBzaW5nbGUgZHJhd2FibGUgaXNcclxuICAvLyByZW1vdmVkIGZyb20gaXRzIHByZXZpb3VzIGJsb2NrIGJlZm9yZSBiZWluZyBhZGRlZCB0byBhIG5ldyBvbmUuIFRoaXMgaXMgdGFrZW4gY2FyZSBvZiBpbiBhbiB1cGRhdGVEaXNwbGF5IHBhc3NcclxuICAvLyBhZnRlciBzeW5jVHJlZSAvIHN0aXRjaGluZy5cclxuICBwcml2YXRlIF9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrOiBEcmF3YWJsZVtdO1xyXG5cclxuICAvLyBEcmF3YWJsZXMgaGF2ZSB0d28gaW1wbGljaXQgbGlua2VkLWxpc3RzLCBcImN1cnJlbnRcIiBhbmQgXCJvbGRcIi4gc3luY1RyZWUgbW9kaWZpZXMgdGhlXHJcbiAgLy8gXCJjdXJyZW50XCIgbGlua2VkLWxpc3QgaW5mb3JtYXRpb24gc28gaXQgaXMgdXAtdG8tZGF0ZSwgYnV0IG5lZWRzIHRvIHVzZSB0aGUgXCJvbGRcIiBpbmZvcm1hdGlvbiBhbHNvLiBXZSBtb3ZlXHJcbiAgLy8gdXBkYXRpbmcgdGhlIFwiY3VycmVudFwiID0+IFwib2xkXCIgbGlua2VkLWxpc3QgaW5mb3JtYXRpb24gdW50aWwgYWZ0ZXIgc3luY1RyZWUgYW5kIHN0aXRjaGluZyBpcyBjb21wbGV0ZSwgYW5kIGlzXHJcbiAgLy8gdGFrZW4gY2FyZSBvZiBpbiBhbiB1cGRhdGVEaXNwbGF5IHBhc3MuXHJcbiAgcHJpdmF0ZSBfZHJhd2FibGVzVG9VcGRhdGVMaW5rczogRHJhd2FibGVbXTtcclxuXHJcbiAgLy8gV2Ugc3RvcmUgaW5mb3JtYXRpb24gb24ge0NoYW5nZUludGVydmFsfXMgdGhhdCByZWNvcmRzIGNoYW5nZSBpbnRlcnZhbFxyXG4gIC8vIGluZm9ybWF0aW9uLCB0aGF0IG1heSBjb250YWluIHJlZmVyZW5jZXMuIFdlIGRvbid0IHdhbnQgdG8gbGVhdmUgdGhvc2UgcmVmZXJlbmNlcyBkYW5nbGluZyBhZnRlciB3ZSBkb24ndCBuZWVkXHJcbiAgLy8gdGhlbSwgc28gdGhleSBhcmUgcmVjb3JkZWQgYW5kIGNsZWFuZWQgaW4gb25lIG9mIHVwZGF0ZURpc3BsYXkncyBwaGFzZXMuXHJcbiAgcHJpdmF0ZSBfY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlOiBDaGFuZ2VJbnRlcnZhbFtdO1xyXG5cclxuICBwcml2YXRlIF9sYXN0Q3Vyc29yOiBzdHJpbmcgfCBudWxsO1xyXG4gIHByaXZhdGUgX2N1cnJlbnRCYWNrZ3JvdW5kQ1NTOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICBwcml2YXRlIF9iYWNrZ3JvdW5kQ29sb3I6IENvbG9yIHwgc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLy8gVXNlZCBmb3Igc2hvcnRjdXQgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uc1xyXG4gIHByaXZhdGUgX3JlcXVlc3RBbmltYXRpb25GcmFtZUlEOiBudW1iZXI7XHJcblxyXG4gIC8vIExpc3RlbmVycyB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBldmVudC5cclxuICBwcml2YXRlIF9pbnB1dExpc3RlbmVyczogVElucHV0TGlzdGVuZXJbXTtcclxuXHJcbiAgLy8gV2hldGhlciBtb3VzZS90b3VjaC9rZXlib2FyZCBpbnB1dHMgYXJlIGVuYWJsZWQgKGlmIGlucHV0IGhhcyBiZWVuIGFkZGVkKS4gU2ltdWxhdGlvbiB3aWxsIHN0aWxsIHN0ZXAuXHJcbiAgcHJpdmF0ZSBfaW50ZXJhY3RpdmU6IGJvb2xlYW47XHJcblxyXG4gIC8vIFBhc3NlZCB0aHJvdWdoIHRvIElucHV0XHJcbiAgcHJpdmF0ZSBfbGlzdGVuVG9Pbmx5RWxlbWVudDogYm9vbGVhbjtcclxuICBwcml2YXRlIF9iYXRjaERPTUV2ZW50czogYm9vbGVhbjtcclxuICBwcml2YXRlIF9hc3N1bWVGdWxsV2luZG93OiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3Bhc3NpdmVFdmVudHM6IGJvb2xlYW4gfCBudWxsO1xyXG5cclxuICAvLyBPdmVybGF5cyBjdXJyZW50bHkgYmVpbmcgZGlzcGxheWVkLlxyXG4gIHByaXZhdGUgX292ZXJsYXlzOiBUT3ZlcmxheVtdO1xyXG5cclxuICBwcml2YXRlIF9wb2ludGVyT3ZlcmxheTogUG9pbnRlck92ZXJsYXkgfCBudWxsO1xyXG4gIHByaXZhdGUgX3BvaW50ZXJBcmVhT3ZlcmxheTogUG9pbnRlckFyZWFPdmVybGF5IHwgbnVsbDtcclxuICBwcml2YXRlIF9oaXRBcmVhT3ZlcmxheTogSGl0QXJlYU92ZXJsYXkgfCBudWxsO1xyXG4gIHByaXZhdGUgX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5OiBDYW52YXNOb2RlQm91bmRzT3ZlcmxheSB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfZml0dGVkQmxvY2tCb3VuZHNPdmVybGF5OiBGaXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkgfCBudWxsO1xyXG5cclxuICAvLyBAYXNzZXJ0aW9uLW9ubHkgLSBXaGV0aGVyIHdlIGFyZSBydW5uaW5nIHRoZSBwYWludCBwaGFzZSBvZiB1cGRhdGVEaXNwbGF5KCkgZm9yIHRoaXMgRGlzcGxheS5cclxuICBwcml2YXRlIF9pc1BhaW50aW5nPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gQGFzc2VydGlvbi1vbmx5XHJcbiAgcHVibGljIF9pc0Rpc3Bvc2luZz86IGJvb2xlYW47XHJcblxyXG4gIC8vIEBhc3NlcnRpb24tb25seSBXaGV0aGVyIGRpc3Bvc2FsIGhhcyBzdGFydGVkIChidXQgbm90IGZpbmlzaGVkKVxyXG4gIHB1YmxpYyBfaXNEaXNwb3NlZD86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIGFjY2Vzc2libGVcclxuICBwcml2YXRlIF9mb2N1c1Jvb3ROb2RlPzogTm9kZTtcclxuICBwcml2YXRlIF9mb2N1c092ZXJsYXk/OiBIaWdobGlnaHRPdmVybGF5O1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCwgaWYgYWNjZXNzaWJsZSlcclxuICBwdWJsaWMgX3Jvb3RQRE9NSW5zdGFuY2U/OiBQRE9NSW5zdGFuY2U7XHJcblxyXG4gIC8vIChpZiBhY2Nlc3NpYmxlKVxyXG4gIHByaXZhdGUgX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24/OiAoIGRvbUV2ZW50OiBLZXlib2FyZEV2ZW50ICkgPT4gdm9pZDtcclxuXHJcbiAgLy8gSWYgbG9nZ2luZyBwZXJmb3JtYW5jZVxyXG4gIHByaXZhdGUgcGVyZlN5bmNUcmVlQ291bnQ/OiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBwZXJmU3RpdGNoQ291bnQ/OiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBwZXJmSW50ZXJ2YWxDb3VudD86IG51bWJlcjtcclxuICBwcml2YXRlIHBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQ/OiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBwZXJmRHJhd2FibGVPbGRJbnRlcnZhbENvdW50PzogbnVtYmVyO1xyXG4gIHByaXZhdGUgcGVyZkRyYXdhYmxlTmV3SW50ZXJ2YWxDb3VudD86IG51bWJlcjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFdoZW4gZmlyZWQsIGZvcmNlcyBhbiBTVkcgcmVmcmVzaCwgdG8gdHJ5IHRvIHdvcmsgYXJvdW5kIGlzc3Vlc1xyXG4gIC8vIGxpa2UgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1MDdcclxuICBwdWJsaWMgcmVhZG9ubHkgX3JlZnJlc2hTVkdFbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2Ugd2lsbCByZWZyZXNoIHRoZSBTVkcgZWxlbWVudHMgb24gdGhlIG5leHQgZnJhbWVcclxuICBwcml2YXRlIF9yZWZyZXNoU1ZHUGVuZGluZyA9IGZhbHNlO1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3RzIGEgRGlzcGxheSB0aGF0IHdpbGwgc2hvdyB0aGUgcm9vdE5vZGUgYW5kIGl0cyBzdWJ0cmVlIGluIGEgdmlzdWFsIHN0YXRlLiBEZWZhdWx0IG9wdGlvbnMgcHJvdmlkZWQgYmVsb3dcclxuICAgKlxyXG4gICAqIEBwYXJhbSByb290Tm9kZSAtIERpc3BsYXlzIHRoaXMgbm9kZSBhbmQgYWxsIG9mIGl0cyBkZXNjZW5kYW50c1xyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggcm9vdE5vZGU6IE5vZGUsIHByb3ZpZGVkT3B0aW9ucz86IERpc3BsYXlPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcm9vdE5vZGUsICdyb290Tm9kZSBpcyBhIHJlcXVpcmVkIHBhcmFtZXRlcicgKTtcclxuXHJcbiAgICAvL09IVFdPIFRPRE86IGh5YnJpZCBiYXRjaGluZyAob3B0aW9uIHRvIGJhdGNoIHVudGlsIGFuIGV2ZW50IGxpa2UgJ3VwJyB0aGF0IG1pZ2h0IGJlIG5lZWRlZCBmb3Igc2VjdXJpdHkgaXNzdWVzKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8RGlzcGxheU9wdGlvbnMsIFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdjb250YWluZXInPiwgUGFyZW50T3B0aW9ucz4oKSgge1xyXG4gICAgICAvLyB7bnVtYmVyfSAtIEluaXRpYWwgZGlzcGxheSB3aWR0aFxyXG4gICAgICB3aWR0aDogKCBwcm92aWRlZE9wdGlvbnMgJiYgcHJvdmlkZWRPcHRpb25zLmNvbnRhaW5lciAmJiBwcm92aWRlZE9wdGlvbnMuY29udGFpbmVyLmNsaWVudFdpZHRoICkgfHwgNjQwLFxyXG5cclxuICAgICAgLy8ge251bWJlcn0gLSBJbml0aWFsIGRpc3BsYXkgaGVpZ2h0XHJcbiAgICAgIGhlaWdodDogKCBwcm92aWRlZE9wdGlvbnMgJiYgcHJvdmlkZWRPcHRpb25zLmNvbnRhaW5lciAmJiBwcm92aWRlZE9wdGlvbnMuY29udGFpbmVyLmNsaWVudEhlaWdodCApIHx8IDQ4MCxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIEFwcGxpZXMgQ1NTIHN0eWxlcyB0byB0aGUgcm9vdCBET00gZWxlbWVudCB0aGF0IG1ha2UgaXQgYW1lbmFibGUgdG8gaW50ZXJhY3RpdmUgY29udGVudFxyXG4gICAgICBhbGxvd0NTU0hhY2tzOiB0cnVlLFxyXG5cclxuICAgICAgYWxsb3dTYWZhcmlSZWRyYXdXb3JrYXJvdW5kOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIFVzdWFsbHkgYW55dGhpbmcgZGlzcGxheWVkIG91dHNpZGUgb2Ygb3VyIGRvbSBlbGVtZW50IGlzIGhpZGRlbiB3aXRoIENTUyBvdmVyZmxvd1xyXG4gICAgICBhbGxvd1NjZW5lT3ZlcmZsb3c6IGZhbHNlLFxyXG5cclxuICAgICAgYWxsb3dMYXllckZpdHRpbmc6IGZhbHNlLFxyXG5cclxuICAgICAgZm9yY2VTVkdSZWZyZXNoOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHtzdHJpbmd9IC0gV2hhdCBjdXJzb3IgaXMgdXNlZCB3aGVuIG5vIG90aGVyIGN1cnNvciBpcyBzcGVjaWZpZWRcclxuICAgICAgZGVmYXVsdEN1cnNvcjogJ2RlZmF1bHQnLFxyXG5cclxuICAgICAgLy8ge0NvbG9yRGVmfSAtIEluaXRpYWwgYmFja2dyb3VuZCBjb2xvclxyXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IG51bGwsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBXaGV0aGVyIFdlYkdMIHdpbGwgcHJlc2VydmUgdGhlIGRyYXdpbmcgYnVmZmVyXHJcbiAgICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBXaGV0aGVyIFdlYkdMIGlzIGVuYWJsZWQgYXQgYWxsIGZvciBkcmF3YWJsZXMgaW4gdGhpcyBEaXNwbGF5XHJcbiAgICAgIGFsbG93V2ViR0w6IHRydWUsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBFbmFibGVzIGFjY2Vzc2liaWxpdHkgZmVhdHVyZXNcclxuICAgICAgYWNjZXNzaWJpbGl0eTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIFNlZSBkZWNsYXJhdGlvbi5cclxuICAgICAgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHM6IGZhbHNlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gV2hldGhlciBtb3VzZS90b3VjaC9rZXlib2FyZCBpbnB1dHMgYXJlIGVuYWJsZWQgKGlmIGlucHV0IGhhcyBiZWVuIGFkZGVkKS5cclxuICAgICAgaW50ZXJhY3RpdmU6IHRydWUsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCBpbnB1dCBldmVudCBsaXN0ZW5lcnMgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IGluc3RlYWQgb2YgdGhlIHdpbmRvdy5cclxuICAgICAgLy8gTm9ybWFsbHksIGF0dGFjaGluZyBsaXN0ZW5lcnMgdG8gdGhlIHdpbmRvdyBpcyBwcmVmZXJyZWQgKGl0IHdpbGwgc2VlIG1vdXNlIG1vdmVzL3VwcyBvdXRzaWRlIG9mIHRoZSBicm93c2VyXHJcbiAgICAgIC8vIHdpbmRvdywgYWxsb3dpbmcgY29ycmVjdCBidXR0b24gdHJhY2tpbmcpLCBob3dldmVyIHRoZXJlIG1heSBiZSBpbnN0YW5jZXMgd2hlcmUgYSBnbG9iYWwgbGlzdGVuZXIgaXMgbm90XHJcbiAgICAgIC8vIHByZWZlcnJlZC5cclxuICAgICAgbGlzdGVuVG9Pbmx5RWxlbWVudDogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBGb3J3YXJkZWQgdG8gSW5wdXQ6IElmIHRydWUsIG1vc3QgZXZlbnQgdHlwZXMgd2lsbCBiZSBiYXRjaGVkIHVudGlsIG90aGVyd2lzZSB0cmlnZ2VyZWQuXHJcbiAgICAgIGJhdGNoRE9NRXZlbnRzOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIElmIHRydWUsIHRoZSBpbnB1dCBldmVudCBsb2NhdGlvbiAoYmFzZWQgb24gdGhlIHRvcC1sZWZ0IG9mIHRoZSBicm93c2VyIHRhYidzIHZpZXdwb3J0LCB3aXRoIG5vXHJcbiAgICAgIC8vIHNjYWxpbmcgYXBwbGllZCkgd2lsbCBiZSB1c2VkLiBVc3VhbGx5LCB0aGlzIGlzIG5vdCBhIHNhZmUgYXNzdW1wdGlvbiwgc28gd2hlbiBmYWxzZSB0aGUgbG9jYXRpb24gb2YgdGhlXHJcbiAgICAgIC8vIGRpc3BsYXkncyBET00gZWxlbWVudCB3aWxsIGJlIHVzZWQgdG8gZ2V0IHRoZSBjb3JyZWN0IGV2ZW50IGxvY2F0aW9uLiBUaGVyZSBpcyBhIHNsaWdodCBwZXJmb3JtYW5jZSBoaXQgdG9cclxuICAgICAgLy8gZG9pbmcgc28sIHRodXMgdGhpcyBvcHRpb24gaXMgcHJvdmlkZWQgaWYgdGhlIHRvcC1sZWZ0IGxvY2F0aW9uIGNhbiBiZSBndWFyYW50ZWVkLlxyXG4gICAgICAvLyBOT1RFOiBSb3RhdGlvbiBvZiB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IChlLmcuIHdpdGggYSBDU1MgdHJhbnNmb3JtKSB3aWxsIHJlc3VsdCBpbiBhbiBpbmNvcnJlY3QgZXZlbnRcclxuICAgICAgLy8gICAgICAgbWFwcGluZywgYXMgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgY2FuJ3Qgd29yayB3aXRoIHRoaXMuIGdldEJveFF1YWRzKCkgc2hvdWxkIGZpeCB0aGlzIHdoZW4gYnJvd3NlclxyXG4gICAgICAvLyAgICAgICBzdXBwb3J0IGlzIGF2YWlsYWJsZS5cclxuICAgICAgYXNzdW1lRnVsbFdpbmRvdzogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBXaGV0aGVyIFNjZW5lcnkgd2lsbCB0cnkgdG8gYWdncmVzc2l2ZWx5IHJlLWNyZWF0ZSBXZWJHTCBDYW52YXMvY29udGV4dCBpbnN0ZWFkIG9mIHdhaXRpbmcgZm9yXHJcbiAgICAgIC8vIGEgY29udGV4dCByZXN0b3JlZCBldmVudC4gU29tZXRpbWVzIGNvbnRleHQgbG9zc2VzIGNhbiBvY2N1ciB3aXRob3V0IGEgcmVzdG9yYXRpb24gYWZ0ZXJ3YXJkcywgYnV0IHRoaXMgY2FuXHJcbiAgICAgIC8vIGp1bXAtc3RhcnQgdGhlIHByb2Nlc3MuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMzQ3LlxyXG4gICAgICBhZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb246IHRydWUsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbnxudWxsfSAtIFdoZXRoZXIgdGhlIGBwYXNzaXZlYCBmbGFnIHNob3VsZCBiZSBzZXQgd2hlbiBhZGRpbmcgYW5kIHJlbW92aW5nIERPTSBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNzcwIGZvciBtb3JlIGRldGFpbHMuXHJcbiAgICAgIC8vIElmIGl0IGlzIHRydWUgb3IgZmFsc2UsIHRoYXQgaXMgdGhlIHZhbHVlIG9mIHRoZSBwYXNzaXZlIGZsYWcgdGhhdCB3aWxsIGJlIHVzZWQuIElmIGl0IGlzIG51bGwsIHRoZSBkZWZhdWx0XHJcbiAgICAgIC8vIGJlaGF2aW9yIG9mIHRoZSBicm93c2VyIHdpbGwgYmUgdXNlZC5cclxuICAgICAgLy9cclxuICAgICAgLy8gU2FmYXJpIGRvZXNuJ3Qgc3VwcG9ydCB0b3VjaC1hY3Rpb246IG5vbmUsIHNvIHdlIE5FRUQgdG8gbm90IHVzZSBwYXNzaXZlIGV2ZW50cyAod2hpY2ggd291bGQgbm90IGFsbG93XHJcbiAgICAgIC8vIHByZXZlbnREZWZhdWx0IHRvIGRvIGFueXRoaW5nLCBzbyBkcmFncyBhY3R1YWxseSBjYW4gc2Nyb2xsIHRoZSBzaW0pLlxyXG4gICAgICAvLyBDaHJvbWUgYWxzbyBkaWQgdGhlIHNhbWUgXCJwYXNzaXZlIGJ5IGRlZmF1bHRcIiwgYnV0IGJlY2F1c2Ugd2UgaGF2ZSBgdG91Y2gtYWN0aW9uOiBub25lYCBpbiBwbGFjZSwgaXQgZG9lc24ndFxyXG4gICAgICAvLyBhZmZlY3QgdXMsIGFuZCB3ZSBjYW4gcG90ZW50aWFsbHkgZ2V0IHBlcmZvcm1hbmNlIGltcHJvdmVtZW50cyBieSBhbGxvd2luZyBwYXNzaXZlIGV2ZW50cy5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy83NzAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAgIHBhc3NpdmVFdmVudHM6IHBsYXRmb3JtLnNhZmFyaSA/IGZhbHNlIDogbnVsbCxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIFdoZXRoZXIsIGlmIG5vIFdlYkdMIGFudGlhbGlhc2luZyBpcyBkZXRlY3RlZCwgdGhlIGJhY2tpbmcgc2NhbGUgY2FuIGJlIGluY3JlYXNlZCBzbyBhcyB0b1xyXG4gICAgICAvLyAgICAgICAgICAgICBwcm92aWRlIHNvbWUgYW50aWFsaWFzaW5nIGJlbmVmaXQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODU5LlxyXG4gICAgICBhbGxvd0JhY2tpbmdTY2FsZUFudGlhbGlhc2luZzogdHJ1ZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5pZCA9IGdsb2JhbElkQ291bnRlcisrO1xyXG5cclxuICAgIHRoaXMuX2FjY2Vzc2libGUgPSBvcHRpb25zLmFjY2Vzc2liaWxpdHk7XHJcbiAgICB0aGlzLl9wcmVzZXJ2ZURyYXdpbmdCdWZmZXIgPSBvcHRpb25zLnByZXNlcnZlRHJhd2luZ0J1ZmZlcjtcclxuICAgIHRoaXMuX2FsbG93V2ViR0wgPSBvcHRpb25zLmFsbG93V2ViR0w7XHJcbiAgICB0aGlzLl9hbGxvd0NTU0hhY2tzID0gb3B0aW9ucy5hbGxvd0NTU0hhY2tzO1xyXG4gICAgdGhpcy5fYWxsb3dTY2VuZU92ZXJmbG93ID0gb3B0aW9ucy5hbGxvd1NjZW5lT3ZlcmZsb3c7XHJcblxyXG4gICAgdGhpcy5fZGVmYXVsdEN1cnNvciA9IG9wdGlvbnMuZGVmYXVsdEN1cnNvcjtcclxuXHJcbiAgICB0aGlzLnNpemVQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHkoIG5ldyBEaW1lbnNpb24yKCBvcHRpb25zLndpZHRoLCBvcHRpb25zLmhlaWdodCApICk7XHJcblxyXG4gICAgdGhpcy5fY3VycmVudFNpemUgPSBuZXcgRGltZW5zaW9uMiggLTEsIC0xICk7XHJcbiAgICB0aGlzLl9yb290Tm9kZSA9IHJvb3ROb2RlO1xyXG4gICAgdGhpcy5fcm9vdE5vZGUuYWRkUm9vdGVkRGlzcGxheSggdGhpcyApO1xyXG4gICAgdGhpcy5fcm9vdEJhY2tib25lID0gbnVsbDsgLy8gdG8gYmUgZmlsbGVkIGluIGxhdGVyXHJcbiAgICB0aGlzLl9kb21FbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXIgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgIEJhY2tib25lRHJhd2FibGUucmVwdXJwb3NlQmFja2JvbmVDb250YWluZXIoIG9wdGlvbnMuY29udGFpbmVyICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgIEJhY2tib25lRHJhd2FibGUuY3JlYXRlRGl2QmFja2JvbmUoKTtcclxuXHJcbiAgICB0aGlzLl9zaGFyZWRDYW52YXNJbnN0YW5jZXMgPSB7fTtcclxuICAgIHRoaXMuX2Jhc2VJbnN0YW5jZSA9IG51bGw7IC8vIHdpbGwgYmUgZmlsbGVkIHdpdGggdGhlIHJvb3QgSW5zdGFuY2VcclxuICAgIHRoaXMuX2ZyYW1lSWQgPSAwO1xyXG4gICAgdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290cyA9IFtdO1xyXG4gICAgdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290c1dpdGhvdXRQYXNzID0gW107XHJcbiAgICB0aGlzLl9pbnN0YW5jZVJvb3RzVG9EaXNwb3NlID0gW107XHJcbiAgICB0aGlzLl9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkID0gW107XHJcbiAgICB0aGlzLl9kcmF3YWJsZXNUb0Rpc3Bvc2UgPSBbXTtcclxuICAgIHRoaXMuX2RyYXdhYmxlc1RvQ2hhbmdlQmxvY2sgPSBbXTtcclxuICAgIHRoaXMuX2RyYXdhYmxlc1RvVXBkYXRlTGlua3MgPSBbXTtcclxuICAgIHRoaXMuX2NoYW5nZUludGVydmFsc1RvRGlzcG9zZSA9IFtdO1xyXG4gICAgdGhpcy5fbGFzdEN1cnNvciA9IG51bGw7XHJcbiAgICB0aGlzLl9jdXJyZW50QmFja2dyb3VuZENTUyA9IG51bGw7XHJcbiAgICB0aGlzLl9iYWNrZ3JvdW5kQ29sb3IgPSBudWxsO1xyXG4gICAgdGhpcy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSAwO1xyXG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xyXG4gICAgdGhpcy5faW5wdXRMaXN0ZW5lcnMgPSBbXTtcclxuICAgIHRoaXMuX2ludGVyYWN0aXZlID0gb3B0aW9ucy5pbnRlcmFjdGl2ZTtcclxuICAgIHRoaXMuX2xpc3RlblRvT25seUVsZW1lbnQgPSBvcHRpb25zLmxpc3RlblRvT25seUVsZW1lbnQ7XHJcbiAgICB0aGlzLl9iYXRjaERPTUV2ZW50cyA9IG9wdGlvbnMuYmF0Y2hET01FdmVudHM7XHJcbiAgICB0aGlzLl9hc3N1bWVGdWxsV2luZG93ID0gb3B0aW9ucy5hc3N1bWVGdWxsV2luZG93O1xyXG4gICAgdGhpcy5fcGFzc2l2ZUV2ZW50cyA9IG9wdGlvbnMucGFzc2l2ZUV2ZW50cztcclxuICAgIHRoaXMuX2FnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbiA9IG9wdGlvbnMuYWdncmVzc2l2ZUNvbnRleHRSZWNyZWF0aW9uO1xyXG4gICAgdGhpcy5fYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmcgPSBvcHRpb25zLmFsbG93QmFja2luZ1NjYWxlQW50aWFsaWFzaW5nO1xyXG4gICAgdGhpcy5fYWxsb3dMYXllckZpdHRpbmcgPSBvcHRpb25zLmFsbG93TGF5ZXJGaXR0aW5nO1xyXG4gICAgdGhpcy5fZm9yY2VTVkdSZWZyZXNoID0gb3B0aW9ucy5mb3JjZVNWR1JlZnJlc2g7XHJcbiAgICB0aGlzLl9vdmVybGF5cyA9IFtdO1xyXG4gICAgdGhpcy5fcG9pbnRlck92ZXJsYXkgPSBudWxsO1xyXG4gICAgdGhpcy5fcG9pbnRlckFyZWFPdmVybGF5ID0gbnVsbDtcclxuICAgIHRoaXMuX2hpdEFyZWFPdmVybGF5ID0gbnVsbDtcclxuICAgIHRoaXMuX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5ID0gbnVsbDtcclxuICAgIHRoaXMuX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSA9IG51bGw7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIHRoaXMuX2lzUGFpbnRpbmcgPSBmYWxzZTtcclxuICAgICAgdGhpcy5faXNEaXNwb3NpbmcgPSBmYWxzZTtcclxuICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYXBwbHlDU1NIYWNrcygpO1xyXG5cclxuICAgIHRoaXMuc2V0QmFja2dyb3VuZENvbG9yKCBvcHRpb25zLmJhY2tncm91bmRDb2xvciApO1xyXG5cclxuICAgIGNvbnN0IGFyaWFMaXZlQW5ub3VuY2VyID0gbmV3IEFyaWFMaXZlQW5ub3VuY2VyKCk7XHJcbiAgICB0aGlzLmRlc2NyaXB0aW9uVXR0ZXJhbmNlUXVldWUgPSBuZXcgVXR0ZXJhbmNlUXVldWUoIGFyaWFMaXZlQW5ub3VuY2VyLCB7XHJcbiAgICAgIGluaXRpYWxpemU6IHRoaXMuX2FjY2Vzc2libGUsXHJcbiAgICAgIGZlYXR1cmVTcGVjaWZpY0Fubm91bmNpbmdDb250cm9sUHJvcGVydHlOYW1lOiAnZGVzY3JpcHRpb25DYW5Bbm5vdW5jZVByb3BlcnR5J1xyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggcGxhdGZvcm0uc2FmYXJpICYmIG9wdGlvbnMuYWxsb3dTYWZhcmlSZWRyYXdXb3JrYXJvdW5kICkge1xyXG4gICAgICB0aGlzLmFkZE92ZXJsYXkoIG5ldyBTYWZhcmlXb3JrYXJvdW5kT3ZlcmxheSggdGhpcyApICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5mb2N1c01hbmFnZXIgPSBuZXcgRm9jdXNNYW5hZ2VyKCk7XHJcblxyXG4gICAgLy8gRmVhdHVyZXMgdGhhdCByZXF1aXJlIHRoZSBIaWdobGlnaHRPdmVybGF5XHJcbiAgICBpZiAoIHRoaXMuX2FjY2Vzc2libGUgfHwgb3B0aW9ucy5zdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cyApIHtcclxuICAgICAgdGhpcy5fZm9jdXNSb290Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgICAgIHRoaXMuX2ZvY3VzT3ZlcmxheSA9IG5ldyBIaWdobGlnaHRPdmVybGF5KCB0aGlzLCB0aGlzLl9mb2N1c1Jvb3ROb2RlLCB7XHJcbiAgICAgICAgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogdGhpcy5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSxcclxuICAgICAgICBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHk6IHRoaXMuZm9jdXNNYW5hZ2VyLmludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSxcclxuICAgICAgICByZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5OiB0aGlzLmZvY3VzTWFuYWdlci5yZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5XHJcbiAgICAgIH0gKTtcclxuICAgICAgdGhpcy5hZGRPdmVybGF5KCB0aGlzLl9mb2N1c092ZXJsYXkgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX2FjY2Vzc2libGUgKSB7XHJcbiAgICAgIHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UgPSBQRE9NSW5zdGFuY2UucG9vbC5jcmVhdGUoIG51bGwsIHRoaXMsIG5ldyBUcmFpbCgpICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UoXHJcbiAgICAgICAgYERpc3BsYXkgcm9vdCBpbnN0YW5jZTogJHt0aGlzLl9yb290UERPTUluc3RhbmNlLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICBQRE9NVHJlZS5yZWJ1aWxkSW5zdGFuY2VUcmVlKCB0aGlzLl9yb290UERPTUluc3RhbmNlICk7XHJcblxyXG4gICAgICAvLyBhZGQgdGhlIGFjY2Vzc2libGUgRE9NIGFzIGEgY2hpbGQgb2YgdGhpcyBET00gZWxlbWVudFxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9yb290UERPTUluc3RhbmNlLnBlZXIsICdQZWVyIHNob3VsZCBiZSBjcmVhdGVkIGZyb20gY3JlYXRlRnJvbVBvb2wnICk7XHJcbiAgICAgIHRoaXMuX2RvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UucGVlciEucHJpbWFyeVNpYmxpbmchICk7XHJcblxyXG4gICAgICBjb25zdCBhcmlhTGl2ZUNvbnRhaW5lciA9IGFyaWFMaXZlQW5ub3VuY2VyLmFyaWFMaXZlQ29udGFpbmVyO1xyXG5cclxuICAgICAgLy8gYWRkIGFyaWEtbGl2ZSBlbGVtZW50cyB0byB0aGUgZGlzcGxheVxyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LmFwcGVuZENoaWxkKCBhcmlhTGl2ZUNvbnRhaW5lciApO1xyXG5cclxuICAgICAgLy8gc2V0IGB1c2VyLXNlbGVjdDogbm9uZWAgb24gdGhlIGFyaWEtbGl2ZSBjb250YWluZXIgdG8gcHJldmVudCBpT1MgdGV4dCBzZWxlY3Rpb24gaXNzdWUsIHNlZVxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTAwNlxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIGFyaWFMaXZlQ29udGFpbmVyLnN0eWxlWyBGZWF0dXJlcy51c2VyU2VsZWN0IF0gPSAnbm9uZSc7XHJcblxyXG4gICAgICAvLyBQcmV2ZW50IGZvY3VzIGZyb20gYmVpbmcgbG9zdCBpbiBGdWxsU2NyZWVuIG1vZGUsIGxpc3RlbmVyIG9uIHRoZSBnbG9iYWxLZXlTdGF0ZVRyYWNrZXJcclxuICAgICAgLy8gYmVjYXVzZSB0YWIgbmF2aWdhdGlvbiBtYXkgaGFwcGVuIGJlZm9yZSBmb2N1cyBpcyB3aXRoaW4gdGhlIFBET00uIFNlZSBoYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvblxyXG4gICAgICAvLyBmb3IgbW9yZS5cclxuICAgICAgdGhpcy5fYm91bmRIYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvbiA9IHRoaXMuaGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24uYmluZCggdGhpcyApO1xyXG4gICAgICBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIua2V5ZG93bkVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRET01FbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcclxuICAgIHJldHVybiB0aGlzLl9kb21FbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBkb21FbGVtZW50KCk6IEhUTUxFbGVtZW50IHsgcmV0dXJuIHRoaXMuZ2V0RE9NRWxlbWVudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgdGhlIGRpc3BsYXkncyBET00gZWxlbWVudCB3aXRoIHRoZSBjdXJyZW50IHZpc3VhbCBzdGF0ZSBvZiB0aGUgYXR0YWNoZWQgcm9vdCBub2RlIGFuZCBpdHMgZGVzY2VuZGFudHNcclxuICAgKi9cclxuICBwdWJsaWMgdXBkYXRlRGlzcGxheSgpOiB2b2lkIHtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3Igc2NlbmVyeSBuYW1lc3BhY2VcclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgKSB7XHJcbiAgICAgIHRoaXMucGVyZlN5bmNUcmVlQ291bnQgPSAwO1xyXG4gICAgICB0aGlzLnBlcmZTdGl0Y2hDb3VudCA9IDA7XHJcbiAgICAgIHRoaXMucGVyZkludGVydmFsQ291bnQgPSAwO1xyXG4gICAgICB0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQgPSAwO1xyXG4gICAgICB0aGlzLnBlcmZEcmF3YWJsZU9sZEludGVydmFsQ291bnQgPSAwO1xyXG4gICAgICB0aGlzLnBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnQgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBEaXNwbGF5LmFzc2VydFN1YnRyZWVEaXNwb3NlZCggdGhpcy5fcm9vdE5vZGUgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoIGB1cGRhdGVEaXNwbGF5IGZyYW1lICR7dGhpcy5fZnJhbWVJZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBjb25zdCBmaXJzdFJ1biA9ICEhdGhpcy5fYmFzZUluc3RhbmNlO1xyXG5cclxuICAgIC8vIGNoZWNrIHRvIHNlZSB3aGV0aGVyIGNvbnRlbnRzIHVuZGVyIHBvaW50ZXJzIGNoYW5nZWQgKGFuZCBpZiBzbywgc2VuZCB0aGUgZW50ZXIvZXhpdCBldmVudHMpIHRvXHJcbiAgICAvLyBtYWludGFpbiBjb25zaXN0ZW50IHN0YXRlXHJcbiAgICBpZiAoIHRoaXMuX2lucHV0ICkge1xyXG4gICAgICAvLyBUT0RPOiBTaG91bGQgdGhpcyBiZSBoYW5kbGVkIGVsc2V3aGVyZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgdGhpcy5faW5wdXQudmFsaWRhdGVQb2ludGVycygpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5fYWNjZXNzaWJsZSApIHtcclxuXHJcbiAgICAgIC8vIHVwZGF0ZSBwb3NpdGlvbmluZyBvZiBmb2N1c2FibGUgcGVlciBzaWJsaW5ncyBzbyB0aGV5IGFyZSBkaXNjb3ZlcmFibGUgb24gbW9iaWxlIGFzc2lzdGl2ZSBkZXZpY2VzXHJcbiAgICAgIHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UhLnBlZXIhLnVwZGF0ZVN1YnRyZWVQb3NpdGlvbmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHZhbGlkYXRlIGJvdW5kcyBmb3IgZXZlcnl3aGVyZSB0aGF0IGNvdWxkIHRyaWdnZXIgYm91bmRzIGxpc3RlbmVycy4gd2Ugd2FudCB0byBmbHVzaCBvdXQgYW55IGNoYW5nZXMsIHNvIHRoYXQgd2UgY2FuIGNhbGwgdmFsaWRhdGVCb3VuZHMoKVxyXG4gICAgLy8gZnJvbSBjb2RlIGJlbG93IHdpdGhvdXQgdHJpZ2dlcmluZyBzaWRlIGVmZmVjdHMgKHdlIGFzc3VtZSB0aGF0IHdlIGFyZSBub3QgcmVlbnRyYW50KS5cclxuICAgIHRoaXMuX3Jvb3ROb2RlLnZhbGlkYXRlV2F0Y2hlZEJvdW5kcygpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fYWNjZXNzaWJsZSAmJiB0aGlzLl9yb290UERPTUluc3RhbmNlIS5hdWRpdFJvb3QoKTsgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcm9vdE5vZGUuX3BpY2tlci5hdWRpdCgpOyB9XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIEluc3RhbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLl9iYXNlSW5zdGFuY2UgPSB0aGlzLl9iYXNlSW5zdGFuY2UgfHwgSW5zdGFuY2UuY3JlYXRlRnJvbVBvb2woIHRoaXMsIG5ldyBUcmFpbCggdGhpcy5fcm9vdE5vZGUgKSwgdHJ1ZSwgZmFsc2UgKTtcclxuICAgIHRoaXMuX2Jhc2VJbnN0YW5jZSEuYmFzZVN5bmNUcmVlKCk7XHJcbiAgICBpZiAoIGZpcnN0UnVuICkge1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gaW5zdGFuY2UgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgdGhpcy5tYXJrVHJhbnNmb3JtUm9vdERpcnR5KCB0aGlzLl9iYXNlSW5zdGFuY2UhLCB0aGlzLl9iYXNlSW5zdGFuY2UhLmlzVHJhbnNmb3JtZWQgKTsgLy8gbWFya3MgdGhlIHRyYW5zZm9ybSByb290IGFzIGRpcnR5IChzaW5jZSBpdCBpcylcclxuICAgIH1cclxuXHJcbiAgICAvLyB1cGRhdGUgb3VyIGRyYXdhYmxlJ3MgbGlua2VkIGxpc3RzIHdoZXJlIG5lY2Vzc2FyeVxyXG4gICAgd2hpbGUgKCB0aGlzLl9kcmF3YWJsZXNUb1VwZGF0ZUxpbmtzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5fZHJhd2FibGVzVG9VcGRhdGVMaW5rcy5wb3AoKSEudXBkYXRlTGlua3MoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjbGVhbiBjaGFuZ2UtaW50ZXJ2YWwgaW5mb3JtYXRpb24gZnJvbSBpbnN0YW5jZXMsIHNvIHdlIGRvbid0IGxlYWsgbWVtb3J5L3JlZmVyZW5jZXNcclxuICAgIHdoaWxlICggdGhpcy5fY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5fY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlLnBvcCgpIS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fcm9vdEJhY2tib25lID0gdGhpcy5fcm9vdEJhY2tib25lIHx8IHRoaXMuX2Jhc2VJbnN0YW5jZSEuZ3JvdXBEcmF3YWJsZTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3Jvb3RCYWNrYm9uZSwgJ1dlIGFyZSBndWFyYW50ZWVkIGEgcm9vdCBiYWNrYm9uZSBhcyB0aGUgZ3JvdXBEcmF3YWJsZSBvbiB0aGUgYmFzZSBpbnN0YW5jZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3Jvb3RCYWNrYm9uZSA9PT0gdGhpcy5fYmFzZUluc3RhbmNlIS5ncm91cERyYXdhYmxlLCAnV2UgZG9uXFwndCB3YW50IHRoZSBiYXNlIGluc3RhbmNlXFwncyBncm91cERyYXdhYmxlIHRvIGNoYW5nZScgKTtcclxuXHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9yb290QmFja2JvbmUhLmF1ZGl0KCB0cnVlLCBmYWxzZSwgdHJ1ZSApOyB9IC8vIGFsbG93IHBlbmRpbmcgYmxvY2tzIC8gZGlydHlcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoICdkcmF3YWJsZSBibG9jayBjaGFuZ2UgcGhhc2UnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHdoaWxlICggdGhpcy5fZHJhd2FibGVzVG9DaGFuZ2VCbG9jay5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLl9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrLnBvcCgpIS51cGRhdGVCbG9jaygpO1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHNjZW5lcnkgbmFtZXNwYWNlXHJcbiAgICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgJiYgY2hhbmdlZCApIHtcclxuICAgICAgICB0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQhKys7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9yb290QmFja2JvbmUhLmF1ZGl0KCBmYWxzZSwgZmFsc2UsIHRydWUgKTsgfSAvLyBhbGxvdyBvbmx5IGRpcnR5XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX2Jhc2VJbnN0YW5jZSEuYXVkaXQoIHRoaXMuX2ZyYW1lSWQsIGZhbHNlICk7IH1cclxuXHJcbiAgICAvLyBwcmUtcmVwYWludCBwaGFzZTogdXBkYXRlIHJlbGF0aXZlIHRyYW5zZm9ybSBpbmZvcm1hdGlvbiBmb3IgbGlzdGVuZXJzIChub3RpZmljYXRpb24pIGFuZCBwcmVjb21wdXRhdGlvbiB3aGVyZSBkZXNpcmVkXHJcbiAgICB0aGlzLnVwZGF0ZURpcnR5VHJhbnNmb3JtUm9vdHMoKTtcclxuICAgIC8vIHByZS1yZXBhaW50IHBoYXNlIHVwZGF0ZSB2aXNpYmlsaXR5IGluZm9ybWF0aW9uIG9uIGluc3RhbmNlc1xyXG4gICAgdGhpcy5fYmFzZUluc3RhbmNlIS51cGRhdGVWaXNpYmlsaXR5KCB0cnVlLCB0cnVlLCB0cnVlLCBmYWxzZSApO1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9iYXNlSW5zdGFuY2UhLmF1ZGl0VmlzaWJpbGl0eSggdHJ1ZSApOyB9XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9iYXNlSW5zdGFuY2UhLmF1ZGl0KCB0aGlzLl9mcmFtZUlkLCB0cnVlICk7IH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoICdpbnN0YW5jZSByb290IGRpc3Bvc2FsIHBoYXNlJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICAvLyBkaXNwb3NlIGFsbCBvZiBvdXIgaW5zdGFuY2VzLiBkaXNwb3NpbmcgdGhlIHJvb3Qgd2lsbCBjYXVzZSBhbGwgZGVzY2VuZGFudHMgdG8gYWxzbyBiZSBkaXNwb3NlZC5cclxuICAgIC8vIHdpbGwgYWxzbyBkaXNwb3NlIGF0dGFjaGVkIGRyYXdhYmxlcyAoc2VsZi9ncm91cC9ldGMuKVxyXG4gICAgd2hpbGUgKCB0aGlzLl9pbnN0YW5jZVJvb3RzVG9EaXNwb3NlLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5faW5zdGFuY2VSb290c1RvRGlzcG9zZS5wb3AoKSEuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3Jvb3ROb2RlLmF1ZGl0SW5zdGFuY2VTdWJ0cmVlRm9yRGlzcGxheSggdGhpcyApOyB9IC8vIG1ha2Ugc3VyZSB0cmFpbHMgYXJlIHZhbGlkXHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCAnZHJhd2FibGUgZGlzcG9zYWwgcGhhc2UnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIC8vIGRpc3Bvc2UgYWxsIG9mIG91ciBvdGhlciBkcmF3YWJsZXMuXHJcbiAgICB3aGlsZSAoIHRoaXMuX2RyYXdhYmxlc1RvRGlzcG9zZS5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX2RyYXdhYmxlc1RvRGlzcG9zZS5wb3AoKSEuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX2Jhc2VJbnN0YW5jZSEuYXVkaXQoIHRoaXMuX2ZyYW1lSWQsIGZhbHNlICk7IH1cclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgYXNzZXJ0KCAhdGhpcy5faXNQYWludGluZywgJ0Rpc3BsYXkgd2FzIGFscmVhZHkgdXBkYXRpbmcgcGFpbnQsIG1heSBoYXZlIHRocm93biBhbiBlcnJvciBvbiB0aGUgbGFzdCB1cGRhdGUnICk7XHJcbiAgICAgIHRoaXMuX2lzUGFpbnRpbmcgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlcGFpbnQgcGhhc2VcclxuICAgIC8vT0hUV08gVE9ETzogY2FuIGFueXRoaW5nIGJlIHVwZGF0ZWQgbW9yZSBlZmZpY2llbnRseSBieSB0cmFja2luZyBhdCB0aGUgRGlzcGxheSBsZXZlbD8gUmVtZW1iZXIsIHdlIGhhdmUgcmVjdXJzaXZlIHVwZGF0ZXMgc28gdGhpbmdzIGdldCB1cGRhdGVkIGluIHRoZSByaWdodCBvcmRlciEgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cuRGlzcGxheSggJ3JlcGFpbnQgcGhhc2UnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMuX3Jvb3RCYWNrYm9uZSEudXBkYXRlKCk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICB0aGlzLl9pc1BhaW50aW5nID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9yb290QmFja2JvbmUhLmF1ZGl0KCBmYWxzZSwgZmFsc2UsIGZhbHNlICk7IH0gLy8gYWxsb3cgbm90aGluZ1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9iYXNlSW5zdGFuY2UhLmF1ZGl0KCB0aGlzLl9mcmFtZUlkLCBmYWxzZSApOyB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcclxuICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZENvbG9yKCk7XHJcblxyXG4gICAgdGhpcy51cGRhdGVTaXplKCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9vdmVybGF5cy5sZW5ndGggKSB7XHJcbiAgICAgIGxldCB6SW5kZXggPSB0aGlzLl9yb290QmFja2JvbmUhLmxhc3RaSW5kZXghO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9vdmVybGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAvLyBsYXllciB0aGUgb3ZlcmxheXMgcHJvcGVybHlcclxuICAgICAgICBjb25zdCBvdmVybGF5ID0gdGhpcy5fb3ZlcmxheXNbIGkgXTtcclxuICAgICAgICBvdmVybGF5LmRvbUVsZW1lbnQuc3R5bGUuekluZGV4ID0gJycgKyAoIHpJbmRleCsrICk7XHJcblxyXG4gICAgICAgIG92ZXJsYXkudXBkYXRlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZnRlciBvdXIgdXBkYXRlIGFuZCBkaXNwb3NhbHMsIHdlIHdhbnQgdG8gZWxpbWluYXRlIGFueSBtZW1vcnkgbGVha3MgZnJvbSBhbnl0aGluZyB0aGF0IHdhc24ndCB1cGRhdGVkLlxyXG4gICAgd2hpbGUgKCB0aGlzLl9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5fcmVkdWNlUmVmZXJlbmNlc05lZWRlZC5wb3AoKSEucmVkdWNlUmVmZXJlbmNlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ZyYW1lSWQrKztcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gc2NlbmVyeSBuYW1lc3BhY2UgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgKSB7XHJcbiAgICAgIGNvbnN0IHN5bmNUcmVlTWVzc2FnZSA9IGBzeW5jVHJlZSBjb3VudDogJHt0aGlzLnBlcmZTeW5jVHJlZUNvdW50fWA7XHJcbiAgICAgIGlmICggdGhpcy5wZXJmU3luY1RyZWVDb3VudCEgPiA1MDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmQ3JpdGljYWwgJiYgc2NlbmVyeUxvZy5QZXJmQ3JpdGljYWwoIHN5bmNUcmVlTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnBlcmZTeW5jVHJlZUNvdW50ISA+IDEwMCApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nLlBlcmZNYWpvciAmJiBzY2VuZXJ5TG9nLlBlcmZNYWpvciggc3luY1RyZWVNZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMucGVyZlN5bmNUcmVlQ291bnQhID4gMjAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWlub3IgJiYgc2NlbmVyeUxvZy5QZXJmTWlub3IoIHN5bmNUcmVlTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnBlcmZTeW5jVHJlZUNvdW50ISA+IDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmVmVyYm9zZSAmJiBzY2VuZXJ5TG9nLlBlcmZWZXJib3NlKCBzeW5jVHJlZU1lc3NhZ2UgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSA9IGBkcmF3YWJsZSBibG9jayBjaGFuZ2VzOiAke3RoaXMucGVyZkRyYXdhYmxlQmxvY2tDaGFuZ2VDb3VudH0gZm9yYCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgIC0ke3RoaXMucGVyZkRyYXdhYmxlT2xkSW50ZXJ2YWxDb3VudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSArJHt0aGlzLnBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnR9YDtcclxuICAgICAgaWYgKCB0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQhID4gMjAwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZkNyaXRpY2FsICYmIHNjZW5lcnlMb2cuUGVyZkNyaXRpY2FsKCBkcmF3YWJsZUJsb2NrQ291bnRNZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMucGVyZkRyYXdhYmxlQmxvY2tDaGFuZ2VDb3VudCEgPiA2MCApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nLlBlcmZNYWpvciAmJiBzY2VuZXJ5TG9nLlBlcmZNYWpvciggZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQhID4gMTAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWlub3IgJiYgc2NlbmVyeUxvZy5QZXJmTWlub3IoIGRyYXdhYmxlQmxvY2tDb3VudE1lc3NhZ2UgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5wZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50ISA+IDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmVmVyYm9zZSAmJiBzY2VuZXJ5TG9nLlBlcmZWZXJib3NlKCBkcmF3YWJsZUJsb2NrQ291bnRNZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBQRE9NVHJlZS5hdWRpdFBET01EaXNwbGF5cyggdGhpcy5yb290Tm9kZSApO1xyXG5cclxuICAgIGlmICggdGhpcy5fZm9yY2VTVkdSZWZyZXNoIHx8IHRoaXMuX3JlZnJlc2hTVkdQZW5kaW5nICkge1xyXG4gICAgICB0aGlzLl9yZWZyZXNoU1ZHUGVuZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgdGhpcy5yZWZyZXNoU1ZHKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8vIFVzZWQgZm9yIFN0dWRpbyBBdXRvc2VsZWN0IHRvIGRldGVybWluZSB0aGUgbGVhZmllc3QgUGhFVC1pTyBFbGVtZW50IHVuZGVyIHRoZSBtb3VzZVxyXG4gIHB1YmxpYyBnZXRQaGV0aW9FbGVtZW50QXQoIHBvaW50OiBWZWN0b3IyICk6IFBoZXRpb09iamVjdCB8IG51bGwge1xyXG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX3Jvb3ROb2RlLmdldFBoZXRpb01vdXNlSGl0KCBwb2ludCApO1xyXG5cclxuICAgIGlmICggbm9kZSA9PT0gJ3BoZXRpb05vdFNlbGVjdGFibGUnICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIG5vZGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ2EgUGhldGlvTW91c2VIaXQgc2hvdWxkIGJlIGluc3RydW1lbnRlZCcgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVTaXplKCk6IHZvaWQge1xyXG4gICAgbGV0IHNpemVEaXJ0eSA9IGZhbHNlO1xyXG4gICAgLy9PSFRXTyBUT0RPOiBpZiB3ZSBhcmVuJ3QgY2xpcHBpbmcgb3Igc2V0dGluZyBiYWNrZ3JvdW5kIGNvbG9ycywgY2FuIHdlIGdldCBhd2F5IHdpdGggaGF2aW5nIGEgMHgwIGNvbnRhaW5lciBkaXYgYW5kIHVzaW5nIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGlmICggdGhpcy5zaXplLndpZHRoICE9PSB0aGlzLl9jdXJyZW50U2l6ZS53aWR0aCApIHtcclxuICAgICAgc2l6ZURpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5fY3VycmVudFNpemUud2lkdGggPSB0aGlzLnNpemUud2lkdGg7XHJcbiAgICAgIHRoaXMuX2RvbUVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt0aGlzLnNpemUud2lkdGh9cHhgO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0aGlzLnNpemUuaGVpZ2h0ICE9PSB0aGlzLl9jdXJyZW50U2l6ZS5oZWlnaHQgKSB7XHJcbiAgICAgIHNpemVEaXJ0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRTaXplLmhlaWdodCA9IHRoaXMuc2l6ZS5oZWlnaHQ7XHJcbiAgICAgIHRoaXMuX2RvbUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gYCR7dGhpcy5zaXplLmhlaWdodH1weGA7XHJcbiAgICB9XHJcbiAgICBpZiAoIHNpemVEaXJ0eSAmJiAhdGhpcy5fYWxsb3dTY2VuZU92ZXJmbG93ICkge1xyXG4gICAgICAvLyB0byBwcmV2ZW50IG92ZXJmbG93LCB3ZSBhZGQgYSBDU1MgY2xpcFxyXG4gICAgICAvL1RPRE86IDBweCA9PiAwPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLmNsaXAgPSBgcmVjdCgwcHgsJHt0aGlzLnNpemUud2lkdGh9cHgsJHt0aGlzLnNpemUuaGVpZ2h0fXB4LDBweClgO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciBXZWJHTCBpcyBhbGxvd2VkIHRvIGJlIHVzZWQgaW4gZHJhd2FibGVzIGZvciB0aGlzIERpc3BsYXlcclxuICAgKi9cclxuICBwdWJsaWMgaXNXZWJHTEFsbG93ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fYWxsb3dXZWJHTDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgd2ViZ2xBbGxvd2VkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pc1dlYkdMQWxsb3dlZCgpOyB9XHJcblxyXG4gIHB1YmxpYyBnZXRSb290Tm9kZSgpOiBOb2RlIHtcclxuICAgIHJldHVybiB0aGlzLl9yb290Tm9kZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcm9vdE5vZGUoKTogTm9kZSB7IHJldHVybiB0aGlzLmdldFJvb3ROb2RlKCk7IH1cclxuXHJcbiAgcHVibGljIGdldFJvb3RCYWNrYm9uZSgpOiBCYWNrYm9uZURyYXdhYmxlIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3Jvb3RCYWNrYm9uZSApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3Jvb3RCYWNrYm9uZSE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJvb3RCYWNrYm9uZSgpOiBCYWNrYm9uZURyYXdhYmxlIHsgcmV0dXJuIHRoaXMuZ2V0Um9vdEJhY2tib25lKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGRpbWVuc2lvbnMgb2YgdGhlIERpc3BsYXkncyBET00gZWxlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaXplKCk6IERpbWVuc2lvbjIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2l6ZVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBzaXplKCk6IERpbWVuc2lvbjIgeyByZXR1cm4gdGhpcy5nZXRTaXplKCk7IH1cclxuXHJcbiAgcHVibGljIGdldEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNpemUudG9Cb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYm91bmRzKCk6IEJvdW5kczIgeyByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoZSBzaXplIHRoYXQgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCB3aWxsIGJlIGFmdGVyIHRoZSBuZXh0IHVwZGF0ZURpc3BsYXkoKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTaXplKCBzaXplOiBEaW1lbnNpb24yICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2l6ZS53aWR0aCAlIDEgPT09IDAsICdEaXNwbGF5LndpZHRoIHNob3VsZCBiZSBhbiBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2l6ZS53aWR0aCA+IDAsICdEaXNwbGF5LndpZHRoIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gemVybycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNpemUuaGVpZ2h0ICUgMSA9PT0gMCwgJ0Rpc3BsYXkuaGVpZ2h0IHNob3VsZCBiZSBhbiBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2l6ZS5oZWlnaHQgPiAwLCAnRGlzcGxheS5oZWlnaHQgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvJyApO1xyXG5cclxuICAgIHRoaXMuc2l6ZVByb3BlcnR5LnZhbHVlID0gc2l6ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoYW5nZXMgdGhlIHNpemUgdGhhdCB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IHdpbGwgYmUgYWZ0ZXIgdGhlIG5leHQgdXBkYXRlRGlzcGxheSgpXHJcbiAgICovXHJcbiAgcHVibGljIHNldFdpZHRoSGVpZ2h0KCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIHRoaXMuc2V0U2l6ZSggbmV3IERpbWVuc2lvbjIoIHdpZHRoLCBoZWlnaHQgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIHdpZHRoIG9mIHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0V2lkdGgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLnNpemUud2lkdGg7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHdpZHRoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFdpZHRoKCk7IH1cclxuXHJcbiAgcHVibGljIHNldCB3aWR0aCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRXaWR0aCggdmFsdWUgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB3aWR0aCB0aGF0IHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnQgd2lsbCBiZSBhZnRlciB0aGUgbmV4dCB1cGRhdGVEaXNwbGF5KCkuIFNob3VsZCBiZSBhbiBpbnRlZ3JhbCB2YWx1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0V2lkdGgoIHdpZHRoOiBudW1iZXIgKTogdGhpcyB7XHJcblxyXG4gICAgaWYgKCB0aGlzLmdldFdpZHRoKCkgIT09IHdpZHRoICkge1xyXG4gICAgICB0aGlzLnNldFNpemUoIG5ldyBEaW1lbnNpb24yKCB3aWR0aCwgdGhpcy5nZXRIZWlnaHQoKSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SGVpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5zaXplLmhlaWdodDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaGVpZ2h0KCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldEhlaWdodCgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgaGVpZ2h0KCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldEhlaWdodCggdmFsdWUgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBoZWlnaHQgdGhhdCB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IHdpbGwgYmUgYWZ0ZXIgdGhlIG5leHQgdXBkYXRlRGlzcGxheSgpLiBTaG91bGQgYmUgYW4gaW50ZWdyYWwgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEhlaWdodCggaGVpZ2h0OiBudW1iZXIgKTogdGhpcyB7XHJcblxyXG4gICAgaWYgKCB0aGlzLmdldEhlaWdodCgpICE9PSBoZWlnaHQgKSB7XHJcbiAgICAgIHRoaXMuc2V0U2l6ZSggbmV3IERpbWVuc2lvbjIoIHRoaXMuZ2V0V2lkdGgoKSwgaGVpZ2h0ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpbGwgYmUgYXBwbGllZCB0byB0aGUgcm9vdCBET00gZWxlbWVudCBvbiB1cGRhdGVEaXNwbGF5KCksIGFuZCBubyBzb29uZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEJhY2tncm91bmRDb2xvciggY29sb3I6IENvbG9yIHwgc3RyaW5nIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbG9yID09PSBudWxsIHx8IHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycgfHwgY29sb3IgaW5zdGFuY2VvZiBDb2xvciApO1xyXG5cclxuICAgIHRoaXMuX2JhY2tncm91bmRDb2xvciA9IGNvbG9yO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBiYWNrZ3JvdW5kQ29sb3IoIHZhbHVlOiBDb2xvciB8IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0QmFja2dyb3VuZENvbG9yKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYmFja2dyb3VuZENvbG9yKCk6IENvbG9yIHwgc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldEJhY2tncm91bmRDb2xvcigpOyB9XHJcblxyXG4gIHB1YmxpYyBnZXRCYWNrZ3JvdW5kQ29sb3IoKTogQ29sb3IgfCBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9iYWNrZ3JvdW5kQ29sb3I7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGludGVyYWN0aXZlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faW50ZXJhY3RpdmU7IH1cclxuXHJcbiAgcHVibGljIHNldCBpbnRlcmFjdGl2ZSggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICBpZiAoIHRoaXMuX2FjY2Vzc2libGUgJiYgdmFsdWUgIT09IHRoaXMuX2ludGVyYWN0aXZlICkge1xyXG4gICAgICB0aGlzLl9yb290UERPTUluc3RhbmNlIS5wZWVyIS5yZWN1cnNpdmVEaXNhYmxlKCAhdmFsdWUgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9pbnRlcmFjdGl2ZSA9IHZhbHVlO1xyXG4gICAgaWYgKCAhdGhpcy5faW50ZXJhY3RpdmUgJiYgdGhpcy5faW5wdXQgKSB7XHJcbiAgICAgIHRoaXMuX2lucHV0LmludGVycnVwdFBvaW50ZXJzKCk7XHJcbiAgICAgIHRoaXMuX2lucHV0LmNsZWFyQmF0Y2hlZEV2ZW50cygpO1xyXG4gICAgICB0aGlzLl9pbnB1dC5yZW1vdmVUZW1wb3JhcnlQb2ludGVycygpO1xyXG4gICAgICB0aGlzLl9yb290Tm9kZS5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgICAgdGhpcy5pbnRlcnJ1cHRJbnB1dCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBvdmVybGF5IHRvIHRoZSBEaXNwbGF5LiBFYWNoIG92ZXJsYXkgc2hvdWxkIGhhdmUgYSAuZG9tRWxlbWVudCAodGhlIERPTSBlbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGZvclxyXG4gICAqIGRpc3BsYXkpIGFuZCBhbiAudXBkYXRlKCkgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRPdmVybGF5KCBvdmVybGF5OiBUT3ZlcmxheSApOiB2b2lkIHtcclxuICAgIHRoaXMuX292ZXJsYXlzLnB1c2goIG92ZXJsYXkgKTtcclxuICAgIHRoaXMuX2RvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoIG92ZXJsYXkuZG9tRWxlbWVudCApO1xyXG5cclxuICAgIC8vIGVuc3VyZSB0aGF0IHRoZSBvdmVybGF5IGlzIGhpZGRlbiBmcm9tIHNjcmVlbiByZWFkZXJzLCBhbGwgYWNjZXNzaWJsZSBjb250ZW50IHNob3VsZCBiZSBpbiB0aGUgZG9tIGVsZW1lbnRcclxuICAgIC8vIG9mIHRoZSB0aGlzLl9yb290UERPTUluc3RhbmNlXHJcbiAgICBvdmVybGF5LmRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAndHJ1ZScgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYW4gb3ZlcmxheSBmcm9tIHRoZSBkaXNwbGF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVPdmVybGF5KCBvdmVybGF5OiBUT3ZlcmxheSApOiB2b2lkIHtcclxuICAgIHRoaXMuX2RvbUVsZW1lbnQucmVtb3ZlQ2hpbGQoIG92ZXJsYXkuZG9tRWxlbWVudCApO1xyXG4gICAgdGhpcy5fb3ZlcmxheXMuc3BsaWNlKCBfLmluZGV4T2YoIHRoaXMuX292ZXJsYXlzLCBvdmVybGF5ICksIDEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgcm9vdCBhY2Nlc3NpYmxlIERPTSBlbGVtZW50IHdoaWNoIHJlcHJlc2VudHMgdGhpcyBkaXNwbGF5IGFuZCBwcm92aWRlcyBzZW1hbnRpY3MgZm9yIGFzc2lzdGl2ZVxyXG4gICAqIHRlY2hub2xvZ3kuIElmIHRoaXMgRGlzcGxheSBpcyBub3QgYWNjZXNzaWJsZSwgcmV0dXJucyBudWxsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQRE9NUm9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9hY2Nlc3NpYmxlID8gdGhpcy5fcm9vdFBET01JbnN0YW5jZSEucGVlciEucHJpbWFyeVNpYmxpbmcgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBwZG9tUm9vdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0UERPTVJvb3RFbGVtZW50KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFzIHRoaXMgRGlzcGxheSBlbmFibGVkIGFjY2Vzc2liaWxpdHkgZmVhdHVyZXMgbGlrZSBQRE9NIGNyZWF0aW9uIGFuZCBzdXBwb3J0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0FjY2Vzc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fYWNjZXNzaWJsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBpcyBpbiB0aGUgUERPTS4gVGhhdCBpcyBvbmx5IHBvc3NpYmxlIGlmIHRoZSBkaXNwbGF5IGlzIGFjY2Vzc2libGUuXHJcbiAgICovXHJcbiAgcHVibGljIGlzRWxlbWVudFVuZGVyUERPTSggZWxlbWVudDogRWxlbWVudCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9hY2Nlc3NpYmxlICYmIHRoaXMucGRvbVJvb3RFbGVtZW50IS5jb250YWlucyggZWxlbWVudCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW1wbGVtZW50cyBhIHdvcmthcm91bmQgdGhhdCBwcmV2ZW50cyBET00gZm9jdXMgZnJvbSBsZWF2aW5nIHRoZSBEaXNwbGF5IGluIEZ1bGxTY3JlZW4gbW9kZS4gVGhlcmUgaXNcclxuICAgKiBhIGJ1ZyBpbiBzb21lIGJyb3dzZXJzIHdoZXJlIERPTSBmb2N1cyBjYW4gYmUgcGVybWFuZW50bHkgbG9zdCBpZiB0YWJiaW5nIG91dCBvZiB0aGUgRnVsbFNjcmVlbiBlbGVtZW50LFxyXG4gICAqIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODgzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24oIGRvbUV2ZW50OiBLZXlib2FyZEV2ZW50ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wZG9tUm9vdEVsZW1lbnQsICdUaGVyZSBtdXN0IGJlIGEgUERPTSB0byBzdXBwb3J0IGtleWJvYXJkIG5hdmlnYXRpb24nICk7XHJcblxyXG4gICAgaWYgKCBGdWxsU2NyZWVuLmlzRnVsbFNjcmVlbigpICYmIEtleWJvYXJkVXRpbHMuaXNLZXlFdmVudCggZG9tRXZlbnQsIEtleWJvYXJkVXRpbHMuS0VZX1RBQiApICkge1xyXG4gICAgICBjb25zdCByb290RWxlbWVudCA9IHRoaXMucGRvbVJvb3RFbGVtZW50O1xyXG4gICAgICBjb25zdCBuZXh0RWxlbWVudCA9IGRvbUV2ZW50LnNoaWZ0S2V5ID8gUERPTVV0aWxzLmdldFByZXZpb3VzRm9jdXNhYmxlKCByb290RWxlbWVudCB8fCB1bmRlZmluZWQgKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgUERPTVV0aWxzLmdldE5leHRGb2N1c2FibGUoIHJvb3RFbGVtZW50IHx8IHVuZGVmaW5lZCApO1xyXG4gICAgICBpZiAoIG5leHRFbGVtZW50ID09PSBkb21FdmVudC50YXJnZXQgKSB7XHJcbiAgICAgICAgZG9tRXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYml0bWFzayB1bmlvbiBvZiBhbGwgcmVuZGVyZXJzIChjYW52YXMvc3ZnL2RvbS93ZWJnbCkgdGhhdCBhcmUgdXNlZCBmb3IgZGlzcGxheSwgZXhjbHVkaW5nXHJcbiAgICogQmFja2JvbmVEcmF3YWJsZXMgKHdoaWNoIHdvdWxkIGJlIERPTSkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVzZWRSZW5kZXJlcnNCaXRtYXNrKCk6IG51bWJlciB7XHJcbiAgICBmdW5jdGlvbiByZW5kZXJlcnNVbmRlckJhY2tib25lKCBiYWNrYm9uZTogQmFja2JvbmVEcmF3YWJsZSApOiBudW1iZXIge1xyXG4gICAgICBsZXQgYml0bWFzayA9IDA7XHJcbiAgICAgIF8uZWFjaCggYmFja2JvbmUuYmxvY2tzLCBibG9jayA9PiB7XHJcbiAgICAgICAgaWYgKCBibG9jayBpbnN0YW5jZW9mIERPTUJsb2NrICYmIGJsb2NrLmRvbURyYXdhYmxlIGluc3RhbmNlb2YgQmFja2JvbmVEcmF3YWJsZSApIHtcclxuICAgICAgICAgIGJpdG1hc2sgPSBiaXRtYXNrIHwgcmVuZGVyZXJzVW5kZXJCYWNrYm9uZSggYmxvY2suZG9tRHJhd2FibGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBiaXRtYXNrID0gYml0bWFzayB8IGJsb2NrLnJlbmRlcmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICByZXR1cm4gYml0bWFzaztcclxuICAgIH1cclxuXHJcbiAgICAvLyBvbmx5IHJldHVybiB0aGUgcmVuZGVyZXItc3BlY2lmaWMgcG9ydGlvbiAobm8gb3RoZXIgaGludHMsIGV0YylcclxuICAgIHJldHVybiByZW5kZXJlcnNVbmRlckJhY2tib25lKCB0aGlzLl9yb290QmFja2JvbmUhICkgJiBSZW5kZXJlci5iaXRtYXNrUmVuZGVyZXJBcmVhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZyb20gSW5zdGFuY2VzIHRoYXQgd2lsbCBuZWVkIGEgdHJhbnNmb3JtIHVwZGF0ZSAoZm9yIGxpc3RlbmVycyBhbmQgcHJlY29tcHV0YXRpb24pLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSBwYXNzVHJhbnNmb3JtIC0gV2hldGhlciB3ZSBzaG91bGQgcGFzcyB0aGUgZmlyc3QgdHJhbnNmb3JtIHJvb3Qgd2hlbiB2YWxpZGF0aW5nIHRyYW5zZm9ybXMgKHNob3VsZFxyXG4gICAqIGJlIHRydWUgaWYgdGhlIGluc3RhbmNlIGlzIHRyYW5zZm9ybWVkKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYXJrVHJhbnNmb3JtUm9vdERpcnR5KCBpbnN0YW5jZTogSW5zdGFuY2UsIHBhc3NUcmFuc2Zvcm06IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBwYXNzVHJhbnNmb3JtID8gdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290cy5wdXNoKCBpbnN0YW5jZSApIDogdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290c1dpdGhvdXRQYXNzLnB1c2goIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZURpcnR5VHJhbnNmb3JtUm9vdHMoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cudHJhbnNmb3JtU3lzdGVtICYmIHNjZW5lcnlMb2cudHJhbnNmb3JtU3lzdGVtKCAndXBkYXRlRGlydHlUcmFuc2Zvcm1Sb290cycgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy50cmFuc2Zvcm1TeXN0ZW0gJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB3aGlsZSAoIHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHMubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLl9kaXJ0eVRyYW5zZm9ybVJvb3RzLnBvcCgpIS5yZWxhdGl2ZVRyYW5zZm9ybS51cGRhdGVUcmFuc2Zvcm1MaXN0ZW5lcnNBbmRDb21wdXRlKCBmYWxzZSwgZmFsc2UsIHRoaXMuX2ZyYW1lSWQsIHRydWUgKTtcclxuICAgIH1cclxuICAgIHdoaWxlICggdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290c1dpdGhvdXRQYXNzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290c1dpdGhvdXRQYXNzLnBvcCgpIS5yZWxhdGl2ZVRyYW5zZm9ybS51cGRhdGVUcmFuc2Zvcm1MaXN0ZW5lcnNBbmRDb21wdXRlKCBmYWxzZSwgZmFsc2UsIHRoaXMuX2ZyYW1lSWQsIGZhbHNlICk7XHJcbiAgICB9XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cudHJhbnNmb3JtU3lzdGVtICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0RyYXdhYmxlQ2hhbmdlZEJsb2NrKCBkcmF3YWJsZTogRHJhd2FibGUgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoIGBtYXJrRHJhd2FibGVDaGFuZ2VkQmxvY2s6ICR7ZHJhd2FibGUudG9TdHJpbmcoKX1gICk7XHJcbiAgICB0aGlzLl9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrLnB1c2goIGRyYXdhYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXJrcyBhbiBpdGVtIGZvciBsYXRlciByZWR1Y2VSZWZlcmVuY2VzKCkgY2FsbHMgYXQgdGhlIGVuZCBvZiBEaXNwbGF5LnVwZGF0ZSgpLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYXJrRm9yUmVkdWNlZFJlZmVyZW5jZXMoIGl0ZW06IHsgcmVkdWNlUmVmZXJlbmNlczogKCkgPT4gdm9pZCB9ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISFpdGVtLnJlZHVjZVJlZmVyZW5jZXMgKTtcclxuXHJcbiAgICB0aGlzLl9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkLnB1c2goIGl0ZW0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYXJrSW5zdGFuY2VSb290Rm9yRGlzcG9zYWwoIGluc3RhbmNlOiBJbnN0YW5jZSApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cuRGlzcGxheSggYG1hcmtJbnN0YW5jZVJvb3RGb3JEaXNwb3NhbDogJHtpbnN0YW5jZS50b1N0cmluZygpfWAgKTtcclxuICAgIHRoaXMuX2luc3RhbmNlUm9vdHNUb0Rpc3Bvc2UucHVzaCggaW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYXJrRHJhd2FibGVGb3JEaXNwb3NhbCggZHJhd2FibGU6IERyYXdhYmxlICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCBgbWFya0RyYXdhYmxlRm9yRGlzcG9zYWw6ICR7ZHJhd2FibGUudG9TdHJpbmcoKX1gICk7XHJcbiAgICB0aGlzLl9kcmF3YWJsZXNUb0Rpc3Bvc2UucHVzaCggZHJhd2FibGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtYXJrRHJhd2FibGVGb3JMaW5rc1VwZGF0ZSggZHJhd2FibGU6IERyYXdhYmxlICk6IHZvaWQge1xyXG4gICAgdGhpcy5fZHJhd2FibGVzVG9VcGRhdGVMaW5rcy5wdXNoKCBkcmF3YWJsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEge0NoYW5nZUludGVydmFsfSBmb3IgdGhlIFwicmVtb3ZlIGNoYW5nZSBpbnRlcnZhbCBpbmZvXCIgcGhhc2UgKHdlIGRvbid0IHdhbnQgdG8gbGVhayBtZW1vcnkvcmVmZXJlbmNlcylcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0NoYW5nZUludGVydmFsVG9EaXNwb3NlKCBjaGFuZ2VJbnRlcnZhbDogQ2hhbmdlSW50ZXJ2YWwgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9jaGFuZ2VJbnRlcnZhbHNUb0Rpc3Bvc2UucHVzaCggY2hhbmdlSW50ZXJ2YWwgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlQmFja2dyb3VuZENvbG9yKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fYmFja2dyb3VuZENvbG9yID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcy5fYmFja2dyb3VuZENvbG9yID09PSAnc3RyaW5nJyB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmFja2dyb3VuZENvbG9yIGluc3RhbmNlb2YgQ29sb3IgKTtcclxuXHJcbiAgICBjb25zdCBuZXdCYWNrZ3JvdW5kQ1NTID0gdGhpcy5fYmFja2dyb3VuZENvbG9yID09PSBudWxsID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCAoIHRoaXMuX2JhY2tncm91bmRDb2xvciBhcyBDb2xvciApLnRvQ1NTID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggdGhpcy5fYmFja2dyb3VuZENvbG9yIGFzIENvbG9yICkudG9DU1MoKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9iYWNrZ3JvdW5kQ29sb3IgYXMgc3RyaW5nICk7XHJcbiAgICBpZiAoIG5ld0JhY2tncm91bmRDU1MgIT09IHRoaXMuX2N1cnJlbnRCYWNrZ3JvdW5kQ1NTICkge1xyXG4gICAgICB0aGlzLl9jdXJyZW50QmFja2dyb3VuZENTUyA9IG5ld0JhY2tncm91bmRDU1M7XHJcblxyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IG5ld0JhY2tncm91bmRDU1M7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBDdXJzb3JzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVDdXJzb3IoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuX2lucHV0ICYmIHRoaXMuX2lucHV0Lm1vdXNlICYmIHRoaXMuX2lucHV0Lm1vdXNlLnBvaW50ICkge1xyXG4gICAgICBpZiAoIHRoaXMuX2lucHV0Lm1vdXNlLmN1cnNvciApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ3Vyc29yICYmIHNjZW5lcnlMb2cuQ3Vyc29yKCBgc2V0IG9uIHBvaW50ZXI6ICR7dGhpcy5faW5wdXQubW91c2UuY3Vyc29yfWAgKTtcclxuICAgICAgICB0aGlzLnNldFNjZW5lQ3Vyc29yKCB0aGlzLl9pbnB1dC5tb3VzZS5jdXJzb3IgKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vT0hUV08gVE9ETzogRm9yIGEgZGlzcGxheSwganVzdCByZXR1cm4gYW4gaW5zdGFuY2UgYW5kIHdlIGNhbiBhdm9pZCB0aGUgZ2FyYmFnZSBjb2xsZWN0aW9uL211dGF0aW9uIGF0IHRoZSBjb3N0IG9mIHRoZSBsaW5rZWQtbGlzdCB0cmF2ZXJzYWwgaW5zdGVhZCBvZiBhbiBhcnJheSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBjb25zdCBtb3VzZVRyYWlsID0gdGhpcy5fcm9vdE5vZGUudHJhaWxVbmRlclBvaW50ZXIoIHRoaXMuX2lucHV0Lm1vdXNlICk7XHJcblxyXG4gICAgICBpZiAoIG1vdXNlVHJhaWwgKSB7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSBtb3VzZVRyYWlsLmdldEN1cnNvckNoZWNrSW5kZXgoKTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgICBjb25zdCBub2RlID0gbW91c2VUcmFpbC5ub2Rlc1sgaSBdO1xyXG4gICAgICAgICAgY29uc3QgY3Vyc29yID0gbm9kZS5nZXRFZmZlY3RpdmVDdXJzb3IoKTtcclxuXHJcbiAgICAgICAgICBpZiAoIGN1cnNvciApIHtcclxuICAgICAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkN1cnNvciAmJiBzY2VuZXJ5TG9nLkN1cnNvciggYCR7Y3Vyc29yfSBvbiAke25vZGUuY29uc3RydWN0b3IubmFtZX0jJHtub2RlLmlkfWAgKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRTY2VuZUN1cnNvciggY3Vyc29yICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DdXJzb3IgJiYgc2NlbmVyeUxvZy5DdXJzb3IoIGAtLS0gZm9yICR7bW91c2VUcmFpbCA/IG1vdXNlVHJhaWwudG9TdHJpbmcoKSA6ICcobm8gaGl0KSd9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZhbGxiYWNrIGNhc2VcclxuICAgIHRoaXMuc2V0U2NlbmVDdXJzb3IoIHRoaXMuX2RlZmF1bHRDdXJzb3IgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGN1cnNvciB0byBiZSBkaXNwbGF5ZWQgd2hlbiBvdmVyIHRoZSBEaXNwbGF5LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgc2V0RWxlbWVudEN1cnNvciggY3Vyc29yOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLmN1cnNvciA9IGN1cnNvcjtcclxuXHJcbiAgICAvLyBJbiBzb21lIGNhc2VzLCBDaHJvbWUgZG9lc24ndCBzZWVtIHRvIHJlc3BlY3QgdGhlIGN1cnNvciBzZXQgb24gdGhlIERpc3BsYXkncyBkb21FbGVtZW50LiBJZiB3ZSBhcmUgdXNpbmcgdGhlXHJcbiAgICAvLyBmdWxsIHdpbmRvdywgd2UgY2FuIGFwcGx5IHRoZSB3b3JrYXJvdW5kIG9mIGNvbnRyb2xsaW5nIHRoZSBib2R5J3Mgc3R5bGUuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzk4M1xyXG4gICAgaWYgKCB0aGlzLl9hc3N1bWVGdWxsV2luZG93ICkge1xyXG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IGN1cnNvcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2V0U2NlbmVDdXJzb3IoIGN1cnNvcjogc3RyaW5nICk6IHZvaWQge1xyXG4gICAgaWYgKCBjdXJzb3IgIT09IHRoaXMuX2xhc3RDdXJzb3IgKSB7XHJcbiAgICAgIHRoaXMuX2xhc3RDdXJzb3IgPSBjdXJzb3I7XHJcbiAgICAgIGNvbnN0IGN1c3RvbUN1cnNvcnMgPSBDVVNUT01fQ1VSU09SU1sgY3Vyc29yIF07XHJcbiAgICAgIGlmICggY3VzdG9tQ3Vyc29ycyApIHtcclxuICAgICAgICAvLyBnbyBiYWNrd2FyZHMsIHNvIHRoZSBtb3N0IGRlc2lyZWQgY3Vyc29yIHN0aWNrc1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gY3VzdG9tQ3Vyc29ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgICAgIHRoaXMuc2V0RWxlbWVudEN1cnNvciggY3VzdG9tQ3Vyc29yc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0RWxlbWVudEN1cnNvciggY3Vyc29yICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXBwbHlDU1NIYWNrcygpOiB2b2lkIHtcclxuICAgIC8vIHRvIHVzZSBDU1MzIHRyYW5zZm9ybXMgZm9yIHBlcmZvcm1hbmNlLCBoaWRlIGFueXRoaW5nIG91dHNpZGUgb3VyIGJvdW5kcyBieSBkZWZhdWx0XHJcbiAgICBpZiAoICF0aGlzLl9hbGxvd1NjZW5lT3ZlcmZsb3cgKSB7XHJcbiAgICAgIHRoaXMuX2RvbUVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuICAgIH1cclxuXHJcbiAgICAvLyBmb3J3YXJkIGFsbCBwb2ludGVyIGV2ZW50c1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBsZWdhY3lcclxuICAgIHRoaXMuX2RvbUVsZW1lbnQuc3R5bGUubXNUb3VjaEFjdGlvbiA9ICdub25lJztcclxuXHJcbiAgICAvLyBkb24ndCBhbGxvdyBicm93c2VyIHRvIHN3aXRjaCBiZXR3ZWVuIGZvbnQgc21vb3RoaW5nIG1ldGhvZHMgZm9yIHRleHQgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNDMxKVxyXG4gICAgRmVhdHVyZXMuc2V0U3R5bGUoIHRoaXMuX2RvbUVsZW1lbnQsIEZlYXR1cmVzLmZvbnRTbW9vdGhpbmcsICdhbnRpYWxpYXNlZCcgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2FsbG93Q1NTSGFja3MgKSB7XHJcbiAgICAgIC8vIFByZXZlbnRzIHNlbGVjdGlvbiBjdXJzb3IgaXNzdWVzIGluIFNhZmFyaSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy80NzZcclxuICAgICAgZG9jdW1lbnQub25zZWxlY3RzdGFydCA9ICgpID0+IGZhbHNlO1xyXG5cclxuICAgICAgLy8gcHJldmVudCBhbnkgZGVmYXVsdCB6b29taW5nIGJlaGF2aW9yIGZyb20gYSB0cmFja3BhZCBvbiBJRTExIGFuZCBFZGdlLCBhbGwgc2hvdWxkIGJlIGhhbmRsZWQgYnkgc2NlbmVyeSAtIG11c3RcclxuICAgICAgLy8gYmUgb24gdGhlIGJvZHksIGRvZXNuJ3QgcHJldmVudCBiZWhhdmlvciBpZiBvbiB0aGUgZGlzcGxheSBkaXZcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBsZWdhY3lcclxuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5tc0NvbnRlbnRab29taW5nID0gJ25vbmUnO1xyXG5cclxuICAgICAgLy8gc29tZSBjc3MgaGFja3MgKGluc3BpcmVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL0VpZ2h0TWVkaWEvaGFtbWVyLmpzL2Jsb2IvbWFzdGVyL2hhbW1lci5qcykuXHJcbiAgICAgIC8vIG1vZGlmaWVkIHRvIG9ubHkgYXBwbHkgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uIGluc3RlYWQgb2Ygc3BhbW1pbmcgYWxsIG9mIHRoZW0sIGFuZCBkb2Vzbid0IHVzZSBqUXVlcnkuXHJcbiAgICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy51c2VyRHJhZywgJ25vbmUnICk7XHJcbiAgICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy51c2VyU2VsZWN0LCAnbm9uZScgKTtcclxuICAgICAgRmVhdHVyZXMuc2V0U3R5bGUoIHRoaXMuX2RvbUVsZW1lbnQsIEZlYXR1cmVzLnRvdWNoQWN0aW9uLCAnbm9uZScgKTtcclxuICAgICAgRmVhdHVyZXMuc2V0U3R5bGUoIHRoaXMuX2RvbUVsZW1lbnQsIEZlYXR1cmVzLnRvdWNoQ2FsbG91dCwgJ25vbmUnICk7XHJcbiAgICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy50YXBIaWdobGlnaHRDb2xvciwgJ3JnYmEoMCwwLDAsMCknICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2FudmFzRGF0YVVSTCggY2FsbGJhY2s6ICggc3RyOiBzdHJpbmcgKSA9PiB2b2lkICk6IHZvaWQge1xyXG4gICAgdGhpcy5jYW52YXNTbmFwc2hvdCggKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50ICkgPT4ge1xyXG4gICAgICBjYWxsYmFjayggY2FudmFzLnRvRGF0YVVSTCgpICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXJzIHdoYXQgaXQgY2FuIGludG8gYSBDYW52YXMgKHNvIGZhciwgQ2FudmFzIGFuZCBTVkcgbGF5ZXJzIHdvcmsgZmluZSlcclxuICAgKi9cclxuICBwdWJsaWMgY2FudmFzU25hcHNob3QoIGNhbGxiYWNrOiAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIGltYWdlRGF0YTogSW1hZ2VEYXRhICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICBjYW52YXMud2lkdGggPSB0aGlzLnNpemUud2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5zaXplLmhlaWdodDtcclxuXHJcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoICcyZCcgKSE7XHJcblxyXG4gICAgLy9PSFRXTyBUT0RPOiBhbGxvdyBhY3R1YWwgYmFja2dyb3VuZCBjb2xvciBkaXJlY3RseSwgbm90IGhhdmluZyB0byBjaGVjayB0aGUgc3R5bGUgaGVyZSEhISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5fcm9vdE5vZGUucmVuZGVyVG9DYW52YXMoIGNhbnZhcywgY29udGV4dCwgKCkgPT4ge1xyXG4gICAgICBjYWxsYmFjayggY2FudmFzLCBjb250ZXh0LmdldEltYWdlRGF0YSggMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0ICkgKTtcclxuICAgIH0sIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IHJlZHVjZSBjb2RlIGR1cGxpY2F0aW9uIGZvciBoYW5kbGluZyBvdmVybGF5cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQb2ludGVyRGlzcGxheVZpc2libGUoIHZpc2liaWxpdHk6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBjb25zdCBoYXNPdmVybGF5ID0gISF0aGlzLl9wb2ludGVyT3ZlcmxheTtcclxuXHJcbiAgICBpZiAoIHZpc2liaWxpdHkgIT09IGhhc092ZXJsYXkgKSB7XHJcbiAgICAgIGlmICggIXZpc2liaWxpdHkgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPdmVybGF5KCB0aGlzLl9wb2ludGVyT3ZlcmxheSEgKTtcclxuICAgICAgICB0aGlzLl9wb2ludGVyT3ZlcmxheSEuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMuX3BvaW50ZXJPdmVybGF5ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9wb2ludGVyT3ZlcmxheSA9IG5ldyBQb2ludGVyT3ZlcmxheSggdGhpcywgdGhpcy5fcm9vdE5vZGUgKTtcclxuICAgICAgICB0aGlzLmFkZE92ZXJsYXkoIHRoaXMuX3BvaW50ZXJPdmVybGF5ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IHJlZHVjZSBjb2RlIGR1cGxpY2F0aW9uIGZvciBoYW5kbGluZyBvdmVybGF5cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQb2ludGVyQXJlYURpc3BsYXlWaXNpYmxlKCB2aXNpYmlsaXR5OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGFzT3ZlcmxheSA9ICEhdGhpcy5fcG9pbnRlckFyZWFPdmVybGF5O1xyXG5cclxuICAgIGlmICggdmlzaWJpbGl0eSAhPT0gaGFzT3ZlcmxheSApIHtcclxuICAgICAgaWYgKCAhdmlzaWJpbGl0eSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU92ZXJsYXkoIHRoaXMuX3BvaW50ZXJBcmVhT3ZlcmxheSEgKTtcclxuICAgICAgICB0aGlzLl9wb2ludGVyQXJlYU92ZXJsYXkhLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9wb2ludGVyQXJlYU92ZXJsYXkgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3BvaW50ZXJBcmVhT3ZlcmxheSA9IG5ldyBQb2ludGVyQXJlYU92ZXJsYXkoIHRoaXMsIHRoaXMuX3Jvb3ROb2RlICk7XHJcbiAgICAgICAgdGhpcy5hZGRPdmVybGF5KCB0aGlzLl9wb2ludGVyQXJlYU92ZXJsYXkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogcmVkdWNlIGNvZGUgZHVwbGljYXRpb24gZm9yIGhhbmRsaW5nIG92ZXJsYXlzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIHNldEhpdEFyZWFEaXNwbGF5VmlzaWJsZSggdmlzaWJpbGl0eTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGNvbnN0IGhhc092ZXJsYXkgPSAhIXRoaXMuX2hpdEFyZWFPdmVybGF5O1xyXG5cclxuICAgIGlmICggdmlzaWJpbGl0eSAhPT0gaGFzT3ZlcmxheSApIHtcclxuICAgICAgaWYgKCAhdmlzaWJpbGl0eSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU92ZXJsYXkoIHRoaXMuX2hpdEFyZWFPdmVybGF5ISApO1xyXG4gICAgICAgIHRoaXMuX2hpdEFyZWFPdmVybGF5IS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5faGl0QXJlYU92ZXJsYXkgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX2hpdEFyZWFPdmVybGF5ID0gbmV3IEhpdEFyZWFPdmVybGF5KCB0aGlzLCB0aGlzLl9yb290Tm9kZSApO1xyXG4gICAgICAgIHRoaXMuYWRkT3ZlcmxheSggdGhpcy5faGl0QXJlYU92ZXJsYXkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogcmVkdWNlIGNvZGUgZHVwbGljYXRpb24gZm9yIGhhbmRsaW5nIG92ZXJsYXlzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIHNldENhbnZhc05vZGVCb3VuZHNWaXNpYmxlKCB2aXNpYmlsaXR5OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGFzT3ZlcmxheSA9ICEhdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXk7XHJcblxyXG4gICAgaWYgKCB2aXNpYmlsaXR5ICE9PSBoYXNPdmVybGF5ICkge1xyXG4gICAgICBpZiAoICF2aXNpYmlsaXR5ICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlT3ZlcmxheSggdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXkhICk7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXkhLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9jYW52YXNBcmVhQm91bmRzT3ZlcmxheSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXkgPSBuZXcgQ2FudmFzTm9kZUJvdW5kc092ZXJsYXkoIHRoaXMsIHRoaXMuX3Jvb3ROb2RlICk7XHJcbiAgICAgICAgdGhpcy5hZGRPdmVybGF5KCB0aGlzLl9jYW52YXNBcmVhQm91bmRzT3ZlcmxheSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUT0RPOiByZWR1Y2UgY29kZSBkdXBsaWNhdGlvbiBmb3IgaGFuZGxpbmcgb3ZlcmxheXMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rml0dGVkQmxvY2tCb3VuZHNWaXNpYmxlKCB2aXNpYmlsaXR5OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGFzT3ZlcmxheSA9ICEhdGhpcy5fZml0dGVkQmxvY2tCb3VuZHNPdmVybGF5O1xyXG5cclxuICAgIGlmICggdmlzaWJpbGl0eSAhPT0gaGFzT3ZlcmxheSApIHtcclxuICAgICAgaWYgKCAhdmlzaWJpbGl0eSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU92ZXJsYXkoIHRoaXMuX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSEgKTtcclxuICAgICAgICB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkhLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSA9IG5ldyBGaXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkoIHRoaXMsIHRoaXMuX3Jvb3ROb2RlICk7XHJcbiAgICAgICAgdGhpcy5hZGRPdmVybGF5KCB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB1cCB0aGUgRGlzcGxheSB0byByZXNpemUgdG8gd2hhdGV2ZXIgdGhlIHdpbmRvdyBpbm5lciBkaW1lbnNpb25zIHdpbGwgYmUuXHJcbiAgICovXHJcbiAgcHVibGljIHJlc2l6ZU9uV2luZG93UmVzaXplKCk6IHZvaWQge1xyXG4gICAgY29uc3QgcmVzaXplciA9ICgpID0+IHtcclxuICAgICAgdGhpcy5zZXRXaWR0aEhlaWdodCggd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgfTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgcmVzaXplciApO1xyXG4gICAgcmVzaXplcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyBvbiBldmVyeSByZXF1ZXN0IGFuaW1hdGlvbiBmcmFtZS4gSWYgc3RlcENhbGxiYWNrIGlzIHBhc3NlZCBpbiwgaXQgaXMgY2FsbGVkIGJlZm9yZSB1cGRhdGVEaXNwbGF5KCkgd2l0aFxyXG4gICAqIHN0ZXBDYWxsYmFjayggdGltZUVsYXBzZWRJblNlY29uZHMgKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVPblJlcXVlc3RBbmltYXRpb25GcmFtZSggc3RlcENhbGxiYWNrPzogKCBkdDogbnVtYmVyICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIC8vIGtlZXAgdHJhY2sgb2YgaG93IG11Y2ggdGltZSBlbGFwc2VkIG92ZXIgdGhlIGxhc3QgZnJhbWVcclxuICAgIGxldCBsYXN0VGltZSA9IDA7XHJcbiAgICBsZXQgdGltZUVsYXBzZWRJblNlY29uZHMgPSAwO1xyXG5cclxuICAgIGNvbnN0IHNlbGYgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXHJcbiAgICAoIGZ1bmN0aW9uIHN0ZXAoKSB7XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgTEVHQUNZIC0tLSBpdCB3b3VsZCBrbm93IHRvIHVwZGF0ZSBqdXN0IHRoZSBET00gZWxlbWVudCdzIGxvY2F0aW9uIGlmIGl0J3MgdGhlIHNlY29uZCBhcmd1bWVudFxyXG4gICAgICBzZWxmLl9yZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIHN0ZXAsIHNlbGYuX2RvbUVsZW1lbnQgKTtcclxuXHJcbiAgICAgIC8vIGNhbGN1bGF0ZSBob3cgbXVjaCB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHdlIHJlbmRlcmVkIHRoZSBsYXN0IGZyYW1lXHJcbiAgICAgIGNvbnN0IHRpbWVOb3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICBpZiAoIGxhc3RUaW1lICE9PSAwICkge1xyXG4gICAgICAgIHRpbWVFbGFwc2VkSW5TZWNvbmRzID0gKCB0aW1lTm93IC0gbGFzdFRpbWUgKSAvIDEwMDAuMDtcclxuICAgICAgfVxyXG4gICAgICBsYXN0VGltZSA9IHRpbWVOb3c7XHJcblxyXG4gICAgICAvLyBzdGVwIHRoZSB0aW1lciB0aGF0IGRyaXZlcyBhbnkgdGltZSBkZXBlbmRlbnQgdXBkYXRlcyBvZiB0aGUgRGlzcGxheVxyXG4gICAgICBzdGVwVGltZXIuZW1pdCggdGltZUVsYXBzZWRJblNlY29uZHMgKTtcclxuXHJcbiAgICAgIHN0ZXBDYWxsYmFjayAmJiBzdGVwQ2FsbGJhY2soIHRpbWVFbGFwc2VkSW5TZWNvbmRzICk7XHJcbiAgICAgIHNlbGYudXBkYXRlRGlzcGxheSgpO1xyXG4gICAgfSApKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2FuY2VsVXBkYXRlT25SZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKTogdm9pZCB7XHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoIHRoaXMuX3JlcXVlc3RBbmltYXRpb25GcmFtZUlEICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudCBoYW5kbGluZywgYW5kIGNvbm5lY3RzIHRoZSBicm93c2VyJ3MgaW5wdXQgZXZlbnQgaGFuZGxlcnMgdG8gbm90aWZ5IHRoaXMgRGlzcGxheSBvZiBldmVudHMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGNhbiBiZSByZXZlcnNlZCB3aXRoIGRldGFjaEV2ZW50cygpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbml0aWFsaXplRXZlbnRzKCBvcHRpb25zPzogSW5wdXRPcHRpb25zICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX2lucHV0LCAnRXZlbnRzIGNhbm5vdCBiZSBhdHRhY2hlZCB0d2ljZSB0byBhIGRpc3BsYXkgKGZvciBub3cpJyApO1xyXG5cclxuICAgIC8vIFRPRE86IHJlZmFjdG9yIGhlcmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGNvbnN0IGlucHV0ID0gbmV3IElucHV0KCB0aGlzLCAhdGhpcy5fbGlzdGVuVG9Pbmx5RWxlbWVudCwgdGhpcy5fYmF0Y2hET01FdmVudHMsIHRoaXMuX2Fzc3VtZUZ1bGxXaW5kb3csIHRoaXMuX3Bhc3NpdmVFdmVudHMsIG9wdGlvbnMgKTtcclxuICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XHJcblxyXG4gICAgaW5wdXQuY29ubmVjdExpc3RlbmVycygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0YWNoIGFscmVhZHktYXR0YWNoZWQgaW5wdXQgZXZlbnQgaGFuZGxpbmcgKGZyb20gaW5pdGlhbGl6ZUV2ZW50cygpKS5cclxuICAgKi9cclxuICBwdWJsaWMgZGV0YWNoRXZlbnRzKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5faW5wdXQsICdkZXRhY2hFdmVudHMoKSBzaG91bGQgYmUgY2FsbGVkIG9ubHkgd2hlbiBldmVudHMgYXJlIGF0dGFjaGVkJyApO1xyXG5cclxuICAgIHRoaXMuX2lucHV0IS5kaXNjb25uZWN0TGlzdGVuZXJzKCk7XHJcbiAgICB0aGlzLl9pbnB1dCA9IG51bGw7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBpbnB1dCBsaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIHRoaXMuX2lucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApLCAnSW5wdXQgbGlzdGVuZXIgYWxyZWFkeSByZWdpc3RlcmVkIG9uIHRoaXMgRGlzcGxheScgKTtcclxuXHJcbiAgICAvLyBkb24ndCBhbGxvdyBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQgbXVsdGlwbGUgdGltZXNcclxuICAgIGlmICggIV8uaW5jbHVkZXMoIHRoaXMuX2lucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApICkge1xyXG4gICAgICB0aGlzLl9pbnB1dExpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFuIGlucHV0IGxpc3RlbmVyIHRoYXQgd2FzIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBhZGRJbnB1dExpc3RlbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogdGhpcyB7XHJcbiAgICAvLyBlbnN1cmUgdGhlIGxpc3RlbmVyIGlzIGluIG91ciBsaXN0XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCB0aGlzLl9pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSApO1xyXG5cclxuICAgIHRoaXMuX2lucHV0TGlzdGVuZXJzLnNwbGljZSggXy5pbmRleE9mKCB0aGlzLl9pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSwgMSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgaW5wdXQgbGlzdGVuZXIgaXMgY3VycmVudGx5IGxpc3RlbmluZyB0byB0aGlzIERpc3BsYXkuXHJcbiAgICpcclxuICAgKiBNb3JlIGVmZmljaWVudCB0aGFuIGNoZWNraW5nIGRpc3BsYXkuaW5wdXRMaXN0ZW5lcnMsIGFzIHRoYXQgaW5jbHVkZXMgYSBkZWZlbnNpdmUgY29weS5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IGJvb2xlYW4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5faW5wdXRMaXN0ZW5lcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggdGhpcy5faW5wdXRMaXN0ZW5lcnNbIGkgXSA9PT0gbGlzdGVuZXIgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIGFsbCBvZiBvdXIgaW5wdXQgbGlzdGVuZXJzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRJbnB1dExpc3RlbmVycygpOiBUSW5wdXRMaXN0ZW5lcltdIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnB1dExpc3RlbmVycy5zbGljZSggMCApOyAvLyBkZWZlbnNpdmUgY29weVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpbnB1dExpc3RlbmVycygpOiBUSW5wdXRMaXN0ZW5lcltdIHsgcmV0dXJuIHRoaXMuZ2V0SW5wdXRMaXN0ZW5lcnMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnJ1cHRzIGFsbCBpbnB1dCBsaXN0ZW5lcnMgdGhhdCBhcmUgYXR0YWNoZWQgdG8gdGhpcyBEaXNwbGF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRJbnB1dCgpOiB0aGlzIHtcclxuICAgIGNvbnN0IGxpc3RlbmVyc0NvcHkgPSB0aGlzLmlucHV0TGlzdGVuZXJzO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RlbmVyc0NvcHkubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gbGlzdGVuZXJzQ29weVsgaSBdO1xyXG5cclxuICAgICAgbGlzdGVuZXIuaW50ZXJydXB0ICYmIGxpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgcG9pbnRlcnMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgRGlzcGxheSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRQb2ludGVycygpOiB0aGlzIHtcclxuICAgIHRoaXMuX2lucHV0ICYmIHRoaXMuX2lucHV0LmludGVycnVwdFBvaW50ZXJzKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnJ1cHRzIGFsbCBwb2ludGVycyBhc3NvY2lhdGVkIHdpdGggdGhpcyBEaXNwbGF5IHRoYXQgYXJlIE5PVCBjdXJyZW50bHkgaGF2aW5nIGV2ZW50cyBleGVjdXRlZC5cclxuICAgKiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODIuXHJcbiAgICpcclxuICAgKiBJZiBleGNsdWRlUG9pbnRlciBpcyBwcm92aWRlZCBhbmQgaXMgbm9uLW51bGwsIGl0J3MgdXNlZCBhcyB0aGUgXCJjdXJyZW50XCIgcG9pbnRlciB0aGF0IHNob3VsZCBiZSBleGNsdWRlZCBmcm9tXHJcbiAgICogaW50ZXJydXB0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRPdGhlclBvaW50ZXJzKCBleGNsdWRlUG9pbnRlcjogUG9pbnRlciB8IG51bGwgPSBudWxsICk6IHRoaXMge1xyXG4gICAgdGhpcy5faW5wdXQgJiYgdGhpcy5faW5wdXQuaW50ZXJydXB0UG9pbnRlcnMoXHJcbiAgICAgICggZXhjbHVkZVBvaW50ZXIgfHwgdGhpcy5faW5wdXQuY3VycmVudFNjZW5lcnlFdmVudD8ucG9pbnRlciApIHx8IG51bGxcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IElOVEVSUlVQVF9PVEhFUl9QT0lOVEVSUyA9ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkID0+IHtcclxuICAgIHBoZXQ/LmpvaXN0Py5kaXNwbGF5Py5pbnRlcnJ1cHRPdGhlclBvaW50ZXJzKCBldmVudD8ucG9pbnRlciApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBlbnN1cmVOb3RQYWludGluZygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLl9pc1BhaW50aW5nLFxyXG4gICAgICAnVGhpcyBzaG91bGQgbm90IGJlIHJ1biBpbiB0aGUgY2FsbCB0cmVlIG9mIHVwZGF0ZURpc3BsYXkoKS4gSWYgeW91IHNlZSB0aGlzLCBpdCBpcyBsaWtlbHkgdGhhdCBlaXRoZXIgdGhlICcgK1xyXG4gICAgICAnbGFzdCB1cGRhdGVEaXNwbGF5KCkgaGFkIGEgdGhyb3duIGVycm9yIGFuZCBpdCBpcyB0cnlpbmcgdG8gYmUgcnVuIGFnYWluIChpbiB3aGljaCBjYXNlLCBpbnZlc3RpZ2F0ZSB0aGF0ICcgK1xyXG4gICAgICAnZXJyb3IpLCBPUiBjb2RlIHdhcyBydW4vdHJpZ2dlcmVkIGZyb20gaW5zaWRlIGFuIHVwZGF0ZURpc3BsYXkoKSB0aGF0IGhhcyB0aGUgcG90ZW50aWFsIHRvIGNhdXNlIGFuIGluZmluaXRlICcgK1xyXG4gICAgICAnbG9vcCwgZS5nLiBDYW52YXNOb2RlIHBhaW50Q2FudmFzKCkgY2FsbCBtYW5pcHVsYXRpbmcgYW5vdGhlciBOb2RlLCBvciBhIGJvdW5kcyBsaXN0ZW5lciB0aGF0IFNjZW5lcnkgbWlzc2VkLicgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9zcyBvZiBjb250ZXh0IGZvciBhbGwgV2ViR0wgYmxvY2tzLlxyXG4gICAqXHJcbiAgICogTk9URTogU2hvdWxkIGdlbmVyYWxseSBvbmx5IGJlIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgKi9cclxuICBwdWJsaWMgbG9zZVdlYkdMQ29udGV4dHMoKTogdm9pZCB7XHJcbiAgICAoIGZ1bmN0aW9uIGxvc2VCYWNrYm9uZSggYmFja2JvbmU6IEJhY2tib25lRHJhd2FibGUgKSB7XHJcbiAgICAgIGlmICggYmFja2JvbmUuYmxvY2tzICkge1xyXG4gICAgICAgIGJhY2tib25lLmJsb2Nrcy5mb3JFYWNoKCAoIGJsb2NrOiBCbG9jayApID0+IHtcclxuICAgICAgICAgIGNvbnN0IGdsID0gKCBibG9jayBhcyB1bmtub3duIGFzIFdlYkdMQmxvY2sgKS5nbDtcclxuICAgICAgICAgIGlmICggZ2wgKSB7XHJcbiAgICAgICAgICAgIFV0aWxzLmxvc2VDb250ZXh0KCBnbCApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vVE9ETzogcGF0dGVybiBmb3IgdGhpcyBpdGVyYXRpb24gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICAgIGZvciAoIGxldCBkcmF3YWJsZSA9IGJsb2NrLmZpcnN0RHJhd2FibGU7IGRyYXdhYmxlICE9PSBudWxsOyBkcmF3YWJsZSA9IGRyYXdhYmxlLm5leHREcmF3YWJsZSApIHtcclxuICAgICAgICAgICAgbG9zZUJhY2tib25lKCBkcmF3YWJsZSApO1xyXG4gICAgICAgICAgICBpZiAoIGRyYXdhYmxlID09PSBibG9jay5sYXN0RHJhd2FibGUgKSB7IGJyZWFrOyB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICkoIHRoaXMuX3Jvb3RCYWNrYm9uZSEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2VzIHRoaXMgRGlzcGxheSBhdmFpbGFibGUgZm9yIGluc3BlY3Rpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGluc3BlY3QoKTogdm9pZCB7XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2NlbmVyeVNuYXBzaG90ID0gSlNPTi5zdHJpbmdpZnkoIHNjZW5lcnlTZXJpYWxpemUoIHRoaXMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBIVE1MIGZyYWdtZW50IHRoYXQgaW5jbHVkZXMgYSBsYXJnZSBhbW91bnQgb2YgZGVidWdnaW5nIGluZm9ybWF0aW9uLCBpbmNsdWRpbmcgYSB2aWV3IG9mIHRoZVxyXG4gICAqIGluc3RhbmNlIHRyZWUgYW5kIGRyYXdhYmxlIHRyZWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERlYnVnSFRNTCgpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSAnZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMTIwJTsgbWFyZ2luLXRvcDogNXB4Oyc7XHJcblxyXG4gICAgbGV0IGRlcHRoID0gMDtcclxuXHJcbiAgICBsZXQgcmVzdWx0ID0gJyc7XHJcblxyXG4gICAgcmVzdWx0ICs9IGA8ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5EaXNwbGF5ICgke3RoaXMuaWR9KSBTdW1tYXJ5PC9kaXY+YDtcclxuICAgIHJlc3VsdCArPSBgJHt0aGlzLnNpemUudG9TdHJpbmcoKX0gZnJhbWU6JHt0aGlzLl9mcmFtZUlkfSBpbnB1dDokeyEhdGhpcy5faW5wdXR9IGN1cnNvcjoke3RoaXMuX2xhc3RDdXJzb3J9PGJyLz5gO1xyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVDb3VudCggbm9kZTogTm9kZSApOiBudW1iZXIge1xyXG4gICAgICBsZXQgY291bnQgPSAxOyAvLyBmb3IgdXNcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb3VudCArPSBub2RlQ291bnQoIG5vZGUuY2hpbGRyZW5bIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgKz0gYE5vZGVzOiAke25vZGVDb3VudCggdGhpcy5fcm9vdE5vZGUgKX08YnIvPmA7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5zdGFuY2VDb3VudCggaW5zdGFuY2U6IEluc3RhbmNlICk6IG51bWJlciB7XHJcbiAgICAgIGxldCBjb3VudCA9IDE7IC8vIGZvciB1c1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBpbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb3VudCArPSBpbnN0YW5jZUNvdW50KCBpbnN0YW5jZS5jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGNvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdCArPSB0aGlzLl9iYXNlSW5zdGFuY2UgPyAoIGBJbnN0YW5jZXM6ICR7aW5zdGFuY2VDb3VudCggdGhpcy5fYmFzZUluc3RhbmNlICl9PGJyLz5gICkgOiAnJztcclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3YWJsZUNvdW50KCBkcmF3YWJsZTogRHJhd2FibGUgKTogbnVtYmVyIHtcclxuICAgICAgbGV0IGNvdW50ID0gMTsgLy8gZm9yIHVzXHJcbiAgICAgIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5ibG9ja3MgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBiYWNrYm9uZVxyXG4gICAgICAgIF8uZWFjaCggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5ibG9ja3MsIGNoaWxkRHJhd2FibGUgPT4ge1xyXG4gICAgICAgICAgY291bnQgKz0gZHJhd2FibGVDb3VudCggY2hpbGREcmF3YWJsZSApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJsb2NrICkuZmlyc3REcmF3YWJsZSAmJiAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5sYXN0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBibG9ja1xyXG4gICAgICAgIGZvciAoIGxldCBjaGlsZERyYXdhYmxlID0gKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJsb2NrICkuZmlyc3REcmF3YWJsZTsgY2hpbGREcmF3YWJsZSAhPT0gKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJsb2NrICkubGFzdERyYXdhYmxlOyBjaGlsZERyYXdhYmxlID0gY2hpbGREcmF3YWJsZS5uZXh0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgICBjb3VudCArPSBkcmF3YWJsZUNvdW50KCBjaGlsZERyYXdhYmxlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvdW50ICs9IGRyYXdhYmxlQ291bnQoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmxhc3REcmF3YWJsZSEgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gY291bnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIEJhY2tib25lRHJhd2FibGUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHJlc3VsdCArPSB0aGlzLl9yb290QmFja2JvbmUgPyAoIGBEcmF3YWJsZXM6ICR7ZHJhd2FibGVDb3VudCggdGhpcy5fcm9vdEJhY2tib25lICl9PGJyLz5gICkgOiAnJztcclxuXHJcbiAgICBjb25zdCBkcmF3YWJsZUNvdW50TWFwOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307IC8vIHtzdHJpbmd9IGRyYXdhYmxlIGNvbnN0cnVjdG9yIG5hbWUgPT4ge251bWJlcn0gY291bnQgb2Ygc2VlblxyXG4gICAgLy8gaW5jcmVtZW50IHRoZSBjb3VudCBpbiBvdXIgbWFwXHJcbiAgICBmdW5jdGlvbiBjb3VudFJldGFpbmVkRHJhd2FibGUoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB2b2lkIHtcclxuICAgICAgY29uc3QgbmFtZSA9IGRyYXdhYmxlLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICAgIGlmICggZHJhd2FibGVDb3VudE1hcFsgbmFtZSBdICkge1xyXG4gICAgICAgIGRyYXdhYmxlQ291bnRNYXBbIG5hbWUgXSsrO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGRyYXdhYmxlQ291bnRNYXBbIG5hbWUgXSA9IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZXRhaW5lZERyYXdhYmxlQ291bnQoIGluc3RhbmNlOiBJbnN0YW5jZSApOiBudW1iZXIge1xyXG4gICAgICBsZXQgY291bnQgPSAwO1xyXG4gICAgICBpZiAoIGluc3RhbmNlLnNlbGZEcmF3YWJsZSApIHtcclxuICAgICAgICBjb3VudFJldGFpbmVkRHJhd2FibGUoIGluc3RhbmNlLnNlbGZEcmF3YWJsZSApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBpbnN0YW5jZS5ncm91cERyYXdhYmxlICkge1xyXG4gICAgICAgIGNvdW50UmV0YWluZWREcmF3YWJsZSggaW5zdGFuY2UuZ3JvdXBEcmF3YWJsZSApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBpbnN0YW5jZS5zaGFyZWRDYWNoZURyYXdhYmxlICkge1xyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBJbnN0YW5jZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIGNvdW50UmV0YWluZWREcmF3YWJsZSggaW5zdGFuY2Uuc2hhcmVkQ2FjaGVEcmF3YWJsZSApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY291bnQgKz0gcmV0YWluZWREcmF3YWJsZUNvdW50KCBpbnN0YW5jZS5jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGNvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdCArPSB0aGlzLl9iYXNlSW5zdGFuY2UgPyAoIGBSZXRhaW5lZCBEcmF3YWJsZXM6ICR7cmV0YWluZWREcmF3YWJsZUNvdW50KCB0aGlzLl9iYXNlSW5zdGFuY2UgKX08YnIvPmAgKSA6ICcnO1xyXG4gICAgZm9yICggY29uc3QgZHJhd2FibGVOYW1lIGluIGRyYXdhYmxlQ291bnRNYXAgKSB7XHJcbiAgICAgIHJlc3VsdCArPSBgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7JHtkcmF3YWJsZU5hbWV9OiAke2RyYXdhYmxlQ291bnRNYXBbIGRyYXdhYmxlTmFtZSBdfTxici8+YDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBibG9ja1N1bW1hcnkoIGJsb2NrOiBCbG9jayApOiBzdHJpbmcge1xyXG4gICAgICAvLyBlbnN1cmUgd2UgYXJlIGEgYmxvY2tcclxuICAgICAgaWYgKCAhYmxvY2suZmlyc3REcmF3YWJsZSB8fCAhYmxvY2subGFzdERyYXdhYmxlICkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIGRpc3BsYXkgc3R1ZmYgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgY29uc3QgaGFzQmFja2JvbmUgPSBibG9jay5kb21EcmF3YWJsZSAmJiBibG9jay5kb21EcmF3YWJsZS5ibG9ja3M7XHJcblxyXG4gICAgICBsZXQgZGl2ID0gYDxkaXYgc3R5bGU9XCJtYXJnaW4tbGVmdDogJHtkZXB0aCAqIDIwfXB4XCI+YDtcclxuXHJcbiAgICAgIGRpdiArPSBibG9jay50b1N0cmluZygpO1xyXG4gICAgICBpZiAoICFoYXNCYWNrYm9uZSApIHtcclxuICAgICAgICBkaXYgKz0gYCAoJHtibG9jay5kcmF3YWJsZUNvdW50fSBkcmF3YWJsZXMpYDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGl2ICs9ICc8L2Rpdj4nO1xyXG5cclxuICAgICAgZGVwdGggKz0gMTtcclxuICAgICAgaWYgKCBoYXNCYWNrYm9uZSApIHtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gZGlzcGxheSBzdHVmZiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIGZvciAoIGxldCBrID0gMDsgayA8IGJsb2NrLmRvbURyYXdhYmxlLmJsb2Nrcy5sZW5ndGg7IGsrKyApIHtcclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBkaXNwbGF5IHN0dWZmIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgICAgICBkaXYgKz0gYmxvY2tTdW1tYXJ5KCBibG9jay5kb21EcmF3YWJsZS5ibG9ja3NbIGsgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBkZXB0aCAtPSAxO1xyXG5cclxuICAgICAgcmV0dXJuIGRpdjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX3Jvb3RCYWNrYm9uZSApIHtcclxuICAgICAgcmVzdWx0ICs9IGA8ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5CbG9jayBTdW1tYXJ5PC9kaXY+YDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcm9vdEJhY2tib25lLmJsb2Nrcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICByZXN1bHQgKz0gYmxvY2tTdW1tYXJ5KCB0aGlzLl9yb290QmFja2JvbmUuYmxvY2tzWyBpIF0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGluc3RhbmNlU3VtbWFyeSggaW5zdGFuY2U6IEluc3RhbmNlICk6IHN0cmluZyB7XHJcbiAgICAgIGxldCBpU3VtbWFyeSA9ICcnO1xyXG5cclxuICAgICAgZnVuY3Rpb24gYWRkUXVhbGlmaWVyKCB0ZXh0OiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICAgICAgaVN1bW1hcnkgKz0gYCA8c3BhbiBzdHlsZT1cImNvbG9yOiAjMDA4XCI+JHt0ZXh0fTwvc3Bhbj5gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBub2RlID0gaW5zdGFuY2Uubm9kZSE7XHJcblxyXG4gICAgICBpU3VtbWFyeSArPSBpbnN0YW5jZS5pZDtcclxuICAgICAgaVN1bW1hcnkgKz0gYCAke25vZGUuY29uc3RydWN0b3IubmFtZSA/IG5vZGUuY29uc3RydWN0b3IubmFtZSA6ICc/J31gO1xyXG4gICAgICBpU3VtbWFyeSArPSBgIDxzcGFuIHN0eWxlPVwiZm9udC13ZWlnaHQ6ICR7bm9kZS5pc1BhaW50ZWQoKSA/ICdib2xkJyA6ICdub3JtYWwnfVwiPiR7bm9kZS5pZH08L3NwYW4+YDtcclxuICAgICAgaVN1bW1hcnkgKz0gbm9kZS5nZXREZWJ1Z0hUTUxFeHRyYXMoKTtcclxuXHJcbiAgICAgIGlmICggIW5vZGUudmlzaWJsZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdpbnZpcycgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpbnN0YW5jZS52aXNpYmxlICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ0ktaW52aXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhaW5zdGFuY2UucmVsYXRpdmVWaXNpYmxlICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ0ktcmVsLWludmlzJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggIWluc3RhbmNlLnNlbGZWaXNpYmxlICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ0ktc2VsZi1pbnZpcycgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpbnN0YW5jZS5maXR0YWJpbGl0eS5hbmNlc3RvcnNGaXR0YWJsZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdub2ZpdC1hbmNlc3RvcicgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpbnN0YW5jZS5maXR0YWJpbGl0eS5zZWxmRml0dGFibGUgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnbm9maXQtc2VsZicgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUucGlja2FibGUgPT09IHRydWUgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAncGlja2FibGUnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLnBpY2thYmxlID09PSBmYWxzZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICd1bnBpY2thYmxlJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggaW5zdGFuY2UudHJhaWwhLmlzUGlja2FibGUoKSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICc8c3BhbiBzdHlsZT1cImNvbG9yOiAjODA4XCI+aGl0czwvc3Bhbj4nICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLmdldEVmZmVjdGl2ZUN1cnNvcigpICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggYGVmZmVjdGl2ZUN1cnNvcjoke25vZGUuZ2V0RWZmZWN0aXZlQ3Vyc29yKCl9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5jbGlwQXJlYSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdjbGlwQXJlYScgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUubW91c2VBcmVhICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ21vdXNlQXJlYScgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUudG91Y2hBcmVhICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ3RvdWNoQXJlYScgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUuZ2V0SW5wdXRMaXN0ZW5lcnMoKS5sZW5ndGggKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnaW5wdXRMaXN0ZW5lcnMnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLmdldFJlbmRlcmVyKCkgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCBgcmVuZGVyZXI6JHtub2RlLmdldFJlbmRlcmVyKCl9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5pc0xheWVyU3BsaXQoKSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdsYXllclNwbGl0JyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5vcGFjaXR5IDwgMSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoIGBvcGFjaXR5OiR7bm9kZS5vcGFjaXR5fWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUuZGlzYWJsZWRPcGFjaXR5IDwgMSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoIGBkaXNhYmxlZE9wYWNpdHk6JHtub2RlLmRpc2FibGVkT3BhY2l0eX1gICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggbm9kZS5fYm91bmRzRXZlbnRDb3VudCA+IDAgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCBgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzgwMFwiPmJvdW5kc0xpc3Rlbjoke25vZGUuX2JvdW5kc0V2ZW50Q291bnR9OiR7bm9kZS5fYm91bmRzRXZlbnRTZWxmQ291bnR9PC9zcGFuPmAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IHRyYW5zZm9ybVR5cGUgPSAnJztcclxuICAgICAgc3dpdGNoKCBub2RlLnRyYW5zZm9ybS5nZXRNYXRyaXgoKS50eXBlICkge1xyXG4gICAgICAgIGNhc2UgTWF0cml4M1R5cGUuSURFTlRJVFk6XHJcbiAgICAgICAgICB0cmFuc2Zvcm1UeXBlID0gJyc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE1hdHJpeDNUeXBlLlRSQU5TTEFUSU9OXzJEOlxyXG4gICAgICAgICAgdHJhbnNmb3JtVHlwZSA9ICd0cmFuc2xhdGVkJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWF0cml4M1R5cGUuU0NBTElORzpcclxuICAgICAgICAgIHRyYW5zZm9ybVR5cGUgPSAnc2NhbGUnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBNYXRyaXgzVHlwZS5BRkZJTkU6XHJcbiAgICAgICAgICB0cmFuc2Zvcm1UeXBlID0gJ2FmZmluZSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE1hdHJpeDNUeXBlLk9USEVSOlxyXG4gICAgICAgICAgdHJhbnNmb3JtVHlwZSA9ICdvdGhlcic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgaW52YWxpZCBtYXRyaXggdHlwZTogJHtub2RlLnRyYW5zZm9ybS5nZXRNYXRyaXgoKS50eXBlfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRyYW5zZm9ybVR5cGUgKSB7XHJcbiAgICAgICAgaVN1bW1hcnkgKz0gYCA8c3BhbiBzdHlsZT1cImNvbG9yOiAjODhmXCIgdGl0bGU9XCIke25vZGUudHJhbnNmb3JtLmdldE1hdHJpeCgpLnRvU3RyaW5nKCkucmVwbGFjZSggJ1xcbicsICcmIzEwOycgKX1cIj4ke3RyYW5zZm9ybVR5cGV9PC9zcGFuPmA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlTdW1tYXJ5ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzg4OFwiPltUcmFpbCAke2luc3RhbmNlLnRyYWlsIS5pbmRpY2VzLmpvaW4oICcuJyApfV08L3NwYW4+YDtcclxuICAgICAgLy8gaVN1bW1hcnkgKz0gYCA8c3BhbiBzdHlsZT1cImNvbG9yOiAjYzg4XCI+JHtzdHIoIGluc3RhbmNlLnN0YXRlICl9PC9zcGFuPmA7XHJcbiAgICAgIGlTdW1tYXJ5ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzhjOFwiPiR7bm9kZS5fcmVuZGVyZXJTdW1tYXJ5LmJpdG1hc2sudG9TdHJpbmcoIDE2ICl9JHtub2RlLl9yZW5kZXJlckJpdG1hc2sgIT09IFJlbmRlcmVyLmJpdG1hc2tOb2RlRGVmYXVsdCA/IGAgKCR7bm9kZS5fcmVuZGVyZXJCaXRtYXNrLnRvU3RyaW5nKCAxNiApfSlgIDogJyd9PC9zcGFuPmA7XHJcblxyXG4gICAgICByZXR1cm4gaVN1bW1hcnk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd2FibGVTdW1tYXJ5KCBkcmF3YWJsZTogRHJhd2FibGUgKTogc3RyaW5nIHtcclxuICAgICAgbGV0IGRyYXdhYmxlU3RyaW5nID0gZHJhd2FibGUudG9TdHJpbmcoKTtcclxuICAgICAgaWYgKCBkcmF3YWJsZS52aXNpYmxlICkge1xyXG4gICAgICAgIGRyYXdhYmxlU3RyaW5nID0gYDxzdHJvbmc+JHtkcmF3YWJsZVN0cmluZ308L3N0cm9uZz5gO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggZHJhd2FibGUuZGlydHkgKSB7XHJcbiAgICAgICAgZHJhd2FibGVTdHJpbmcgKz0gKCBkcmF3YWJsZS5kaXJ0eSA/ICcgPHNwYW4gc3R5bGU9XCJjb2xvcjogI2MwMDtcIj5beF08L3NwYW4+JyA6ICcnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhZHJhd2FibGUuZml0dGFibGUgKSB7XHJcbiAgICAgICAgZHJhd2FibGVTdHJpbmcgKz0gKCBkcmF3YWJsZS5kaXJ0eSA/ICcgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzBjMDtcIj5bbm8tZml0XTwvc3Bhbj4nIDogJycgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZHJhd2FibGVTdHJpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcHJpbnRJbnN0YW5jZVN1YnRyZWUoIGluc3RhbmNlOiBJbnN0YW5jZSApOiB2b2lkIHtcclxuICAgICAgbGV0IGRpdiA9IGA8ZGl2IHN0eWxlPVwibWFyZ2luLWxlZnQ6ICR7ZGVwdGggKiAyMH1weFwiPmA7XHJcblxyXG4gICAgICBmdW5jdGlvbiBhZGREcmF3YWJsZSggbmFtZTogc3RyaW5nLCBkcmF3YWJsZTogRHJhd2FibGUgKTogdm9pZCB7XHJcbiAgICAgICAgZGl2ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzg4OFwiPiR7bmFtZX06JHtkcmF3YWJsZVN1bW1hcnkoIGRyYXdhYmxlICl9PC9zcGFuPmA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRpdiArPSBpbnN0YW5jZVN1bW1hcnkoIGluc3RhbmNlICk7XHJcblxyXG4gICAgICBpbnN0YW5jZS5zZWxmRHJhd2FibGUgJiYgYWRkRHJhd2FibGUoICdzZWxmJywgaW5zdGFuY2Uuc2VsZkRyYXdhYmxlICk7XHJcbiAgICAgIGluc3RhbmNlLmdyb3VwRHJhd2FibGUgJiYgYWRkRHJhd2FibGUoICdncm91cCcsIGluc3RhbmNlLmdyb3VwRHJhd2FibGUgKTtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIEluc3RhbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGluc3RhbmNlLnNoYXJlZENhY2hlRHJhd2FibGUgJiYgYWRkRHJhd2FibGUoICdzaGFyZWRDYWNoZScsIGluc3RhbmNlLnNoYXJlZENhY2hlRHJhd2FibGUgKTtcclxuXHJcbiAgICAgIGRpdiArPSAnPC9kaXY+JztcclxuICAgICAgcmVzdWx0ICs9IGRpdjtcclxuXHJcbiAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgIF8uZWFjaCggaW5zdGFuY2UuY2hpbGRyZW4sIGNoaWxkSW5zdGFuY2UgPT4ge1xyXG4gICAgICAgIHByaW50SW5zdGFuY2VTdWJ0cmVlKCBjaGlsZEluc3RhbmNlICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgZGVwdGggLT0gMTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX2Jhc2VJbnN0YW5jZSApIHtcclxuICAgICAgcmVzdWx0ICs9IGA8ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5Sb290IEluc3RhbmNlIFRyZWU8L2Rpdj5gO1xyXG4gICAgICBwcmludEluc3RhbmNlU3VidHJlZSggdGhpcy5fYmFzZUluc3RhbmNlICk7XHJcbiAgICB9XHJcblxyXG4gICAgXy5lYWNoKCB0aGlzLl9zaGFyZWRDYW52YXNJbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcclxuICAgICAgcmVzdWx0ICs9IGA8ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5TaGFyZWQgQ2FudmFzIEluc3RhbmNlIFRyZWU8L2Rpdj5gO1xyXG4gICAgICBwcmludEluc3RhbmNlU3VidHJlZSggaW5zdGFuY2UgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBmdW5jdGlvbiBwcmludERyYXdhYmxlU3VidHJlZSggZHJhd2FibGU6IERyYXdhYmxlICk6IHZvaWQge1xyXG4gICAgICBsZXQgZGl2ID0gYDxkaXYgc3R5bGU9XCJtYXJnaW4tbGVmdDogJHtkZXB0aCAqIDIwfXB4XCI+YDtcclxuXHJcbiAgICAgIGRpdiArPSBkcmF3YWJsZVN1bW1hcnkoIGRyYXdhYmxlICk7XHJcbiAgICAgIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIFNlbGZEcmF3YWJsZSApLmluc3RhbmNlICkge1xyXG4gICAgICAgIGRpdiArPSBgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICMwYTA7XCI+KCR7KCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIFNlbGZEcmF3YWJsZSApLmluc3RhbmNlLnRyYWlsLnRvUGF0aFN0cmluZygpfSk8L3NwYW4+YDtcclxuICAgICAgICBkaXYgKz0gYCZuYnNwOyZuYnNwOyZuYnNwOyR7aW5zdGFuY2VTdW1tYXJ5KCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgU2VsZkRyYXdhYmxlICkuaW5zdGFuY2UgKX1gO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmFja2JvbmVEcmF3YWJsZSApLmJhY2tib25lSW5zdGFuY2UgKSB7XHJcbiAgICAgICAgZGl2ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogI2EwMDtcIj4oJHsoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmFja2JvbmVEcmF3YWJsZSApLmJhY2tib25lSW5zdGFuY2UudHJhaWwudG9QYXRoU3RyaW5nKCl9KTwvc3Bhbj5gO1xyXG4gICAgICAgIGRpdiArPSBgJm5ic3A7Jm5ic3A7Jm5ic3A7JHtpbnN0YW5jZVN1bW1hcnkoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCYWNrYm9uZURyYXdhYmxlICkuYmFja2JvbmVJbnN0YW5jZSApfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRpdiArPSAnPC9kaXY+JztcclxuICAgICAgcmVzdWx0ICs9IGRpdjtcclxuXHJcbiAgICAgIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5ibG9ja3MgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBiYWNrYm9uZVxyXG4gICAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgICAgXy5lYWNoKCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmFja2JvbmVEcmF3YWJsZSApLmJsb2NrcywgY2hpbGREcmF3YWJsZSA9PiB7XHJcbiAgICAgICAgICBwcmludERyYXdhYmxlU3VidHJlZSggY2hpbGREcmF3YWJsZSApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBkZXB0aCAtPSAxO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5maXJzdERyYXdhYmxlICYmICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmxhc3REcmF3YWJsZSApIHtcclxuICAgICAgICAvLyB3ZSdyZSBhIGJsb2NrXHJcbiAgICAgICAgZGVwdGggKz0gMTtcclxuICAgICAgICBmb3IgKCBsZXQgY2hpbGREcmF3YWJsZSA9ICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmZpcnN0RHJhd2FibGU7IGNoaWxkRHJhd2FibGUgIT09ICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmxhc3REcmF3YWJsZTsgY2hpbGREcmF3YWJsZSA9IGNoaWxkRHJhd2FibGUubmV4dERyYXdhYmxlICkge1xyXG4gICAgICAgICAgcHJpbnREcmF3YWJsZVN1YnRyZWUoIGNoaWxkRHJhd2FibGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpbnREcmF3YWJsZVN1YnRyZWUoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmxhc3REcmF3YWJsZSEgKTsgLy8gd2Fzbid0IGhpdCBpbiBvdXIgc2ltcGxpZmllZCAoYW5kIHNhZmVyKSBsb29wXHJcbiAgICAgICAgZGVwdGggLT0gMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5fcm9vdEJhY2tib25lICkge1xyXG4gICAgICByZXN1bHQgKz0gJzxkaXYgc3R5bGU9XCJmb250LXdlaWdodDogYm9sZDtcIj5Sb290IERyYXdhYmxlIFRyZWU8L2Rpdj4nO1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gQmFja2JvbmVEcmF3YWJsZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBwcmludERyYXdhYmxlU3VidHJlZSggdGhpcy5fcm9vdEJhY2tib25lICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9PSFRXTyBUT0RPOiBhZGQgc2hhcmVkIGNhY2hlIGRyYXdhYmxlIHRyZWVzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGdldERlYnVnSFRNTCgpIGluZm9ybWF0aW9uLCBidXQgd3JhcHBlZCBpbnRvIGEgZnVsbCBIVE1MIHBhZ2UgaW5jbHVkZWQgaW4gYSBkYXRhIFVSSS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RGVidWdVUkkoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgZGF0YTp0ZXh0L2h0bWw7Y2hhcnNldD11dGYtOCwke2VuY29kZVVSSUNvbXBvbmVudChcclxuICAgICAgYCR7JzwhRE9DVFlQRSBodG1sPicgK1xyXG4gICAgICAnPGh0bWwgbGFuZz1cImVuXCI+JyArXHJcbiAgICAgICc8aGVhZD48dGl0bGU+U2NlbmVyeSBEZWJ1ZyBTbmFwc2hvdDwvdGl0bGU+PC9oZWFkPicgK1xyXG4gICAgICAnPGJvZHkgc3R5bGU9XCJmb250LXNpemU6IDEycHg7XCI+J30ke3RoaXMuZ2V0RGVidWdIVE1MKCl9PC9ib2R5PmAgK1xyXG4gICAgICAnPC9odG1sPidcclxuICAgICl9YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF0dGVtcHRzIHRvIG9wZW4gYSBwb3B1cCB3aXRoIHRoZSBnZXREZWJ1Z0hUTUwoKSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgcG9wdXBEZWJ1ZygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5vcGVuKCB0aGlzLmdldERlYnVnVVJJKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF0dGVtcHRzIHRvIG9wZW4gYW4gaWZyYW1lIHBvcHVwIHdpdGggdGhlIGdldERlYnVnSFRNTCgpIGluZm9ybWF0aW9uIGluIHRoZSBzYW1lIHdpbmRvdy4gVGhpcyBpcyBzaW1pbGFyIHRvXHJcbiAgICogcG9wdXBEZWJ1ZygpLCBidXQgc2hvdWxkIHdvcmsgaW4gYnJvd3NlcnMgdGhhdCBibG9jayBwb3B1cHMsIG9yIHByZXZlbnQgdGhhdCB0eXBlIG9mIGRhdGEgVVJJIGJlaW5nIG9wZW5lZC5cclxuICAgKi9cclxuICBwdWJsaWMgaWZyYW1lRGVidWcoKTogdm9pZCB7XHJcbiAgICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaWZyYW1lJyApO1xyXG4gICAgaWZyYW1lLndpZHRoID0gJycgKyB3aW5kb3cuaW5uZXJXaWR0aDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgIGlmcmFtZS5oZWlnaHQgPSAnJyArIHdpbmRvdy5pbm5lckhlaWdodDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgIGlmcmFtZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICBpZnJhbWUuc3R5bGUubGVmdCA9ICcwJztcclxuICAgIGlmcmFtZS5zdHlsZS50b3AgPSAnMCc7XHJcbiAgICBpZnJhbWUuc3R5bGUuekluZGV4ID0gJzEwMDAwJztcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGlmcmFtZSApO1xyXG5cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93IS5kb2N1bWVudC5vcGVuKCk7XHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdyEuZG9jdW1lbnQud3JpdGUoIHRoaXMuZ2V0RGVidWdIVE1MKCkgKTtcclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93IS5kb2N1bWVudC5jbG9zZSgpO1xyXG5cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93IS5kb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmQgPSAnd2hpdGUnO1xyXG5cclxuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2J1dHRvbicgKTtcclxuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnRvcCA9ICcwJztcclxuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnJpZ2h0ID0gJzAnO1xyXG4gICAgY2xvc2VCdXR0b24uc3R5bGUuekluZGV4ID0gJzEwMDAxJztcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIGNsb3NlQnV0dG9uICk7XHJcblxyXG4gICAgY2xvc2VCdXR0b24udGV4dENvbnRlbnQgPSAnY2xvc2UnO1xyXG5cclxuICAgIC8vIEEgbm9ybWFsICdjbGljaycgZXZlbnQgbGlzdGVuZXIgZG9lc24ndCBzZWVtIHRvIGJlIHdvcmtpbmcuIFRoaXMgaXMgbGVzcy10aGFuLWlkZWFsLlxyXG4gICAgWyAncG9pbnRlcmRvd24nLCAnY2xpY2snLCAndG91Y2hkb3duJyBdLmZvckVhY2goIGV2ZW50VHlwZSA9PiB7XHJcbiAgICAgIGNsb3NlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50VHlwZSwgKCkgPT4ge1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoIGlmcmFtZSApO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoIGNsb3NlQnV0dG9uICk7XHJcbiAgICAgIH0sIHRydWUgKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRQRE9NRGVidWdIVE1MKCk6IHN0cmluZyB7XHJcbiAgICBsZXQgcmVzdWx0ID0gJyc7XHJcblxyXG4gICAgY29uc3QgaGVhZGVyU3R5bGUgPSAnZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMTIwJTsgbWFyZ2luLXRvcDogNXB4Oyc7XHJcbiAgICBjb25zdCBpbmRlbnQgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7JztcclxuXHJcbiAgICByZXN1bHQgKz0gYDxkaXYgc3R5bGU9XCIke2hlYWRlclN0eWxlfVwiPkFjY2Vzc2libGUgSW5zdGFuY2VzPC9kaXY+PGJyPmA7XHJcblxyXG4gICAgcmVjdXJzZSggdGhpcy5fcm9vdFBET01JbnN0YW5jZSEsICcnICk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVjdXJzZSggaW5zdGFuY2U6IFBET01JbnN0YW5jZSwgaW5kZW50YXRpb246IHN0cmluZyApOiB2b2lkIHtcclxuICAgICAgcmVzdWx0ICs9IGAke2luZGVudGF0aW9uICsgZXNjYXBlSFRNTCggYCR7aW5zdGFuY2UuaXNSb290SW5zdGFuY2UgPyAnJyA6IGluc3RhbmNlLm5vZGUhLnRhZ05hbWV9ICR7aW5zdGFuY2UudG9TdHJpbmcoKX1gICl9PGJyPmA7XHJcbiAgICAgIGluc3RhbmNlLmNoaWxkcmVuLmZvckVhY2goICggY2hpbGQ6IFBET01JbnN0YW5jZSApID0+IHtcclxuICAgICAgICByZWN1cnNlKCBjaGlsZCwgaW5kZW50YXRpb24gKyBpbmRlbnQgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdCArPSBgPGJyPjxkaXYgc3R5bGU9XCIke2hlYWRlclN0eWxlfVwiPlBhcmFsbGVsIERPTTwvZGl2Pjxicj5gO1xyXG5cclxuICAgIGxldCBwYXJhbGxlbERPTSA9IHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UhLnBlZXIhLnByaW1hcnlTaWJsaW5nIS5vdXRlckhUTUw7XHJcbiAgICBwYXJhbGxlbERPTSA9IHBhcmFsbGVsRE9NLnJlcGxhY2UoIC8+PC9nLCAnPlxcbjwnICk7XHJcbiAgICBjb25zdCBsaW5lcyA9IHBhcmFsbGVsRE9NLnNwbGl0KCAnXFxuJyApO1xyXG5cclxuICAgIGxldCBpbmRlbnRhdGlvbiA9ICcnO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxpbmUgPSBsaW5lc1sgaSBdO1xyXG4gICAgICBjb25zdCBpc0VuZFRhZyA9IGxpbmUuc3RhcnRzV2l0aCggJzwvJyApO1xyXG5cclxuICAgICAgaWYgKCBpc0VuZFRhZyApIHtcclxuICAgICAgICBpbmRlbnRhdGlvbiA9IGluZGVudGF0aW9uLnNsaWNlKCBpbmRlbnQubGVuZ3RoICk7XHJcbiAgICAgIH1cclxuICAgICAgcmVzdWx0ICs9IGAke2luZGVudGF0aW9uICsgZXNjYXBlSFRNTCggbGluZSApfTxicj5gO1xyXG4gICAgICBpZiAoICFpc0VuZFRhZyApIHtcclxuICAgICAgICBpbmRlbnRhdGlvbiArPSBpbmRlbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaWxsIGF0dGVtcHQgdG8gY2FsbCBjYWxsYmFjaygge3N0cmluZ30gZGF0YVVSSSApIHdpdGggdGhlIHJhc3Rlcml6YXRpb24gb2YgdGhlIGVudGlyZSBEaXNwbGF5J3MgRE9NIHN0cnVjdHVyZSxcclxuICAgKiB1c2VkIGZvciBpbnRlcm5hbCB0ZXN0aW5nLiBXaWxsIGNhbGwtYmFjayBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvclxyXG4gICAqXHJcbiAgICogT25seSB0ZXN0ZWQgb24gcmVjZW50IENocm9tZSBhbmQgRmlyZWZveCwgbm90IHJlY29tbWVuZGVkIGZvciBnZW5lcmFsIHVzZS4gR3VhcmFudGVlZCBub3QgdG8gd29yayBmb3IgSUUgPD0gMTAuXHJcbiAgICpcclxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzM5NCBmb3Igc29tZSBkZXRhaWxzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb3JlaWduT2JqZWN0UmFzdGVyaXphdGlvbiggY2FsbGJhY2s6ICggdXJsOiBzdHJpbmcgfCBudWxsICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIC8vIFNjYW4gb3VyIGRyYXdhYmxlIHRyZWUgZm9yIENhbnZhc2VzLiBXZSdsbCByYXN0ZXJpemUgdGhlbSBoZXJlICh0byBkYXRhIFVSTHMpIHNvIHdlIGNhbiByZXBsYWNlIHRoZW0gbGF0ZXIgaW5cclxuICAgIC8vIHRoZSBIVE1MIHRyZWUgKHdpdGggaW1hZ2VzKSBiZWZvcmUgcHV0dGluZyB0aGF0IGluIHRoZSBmb3JlaWduT2JqZWN0LiBUaGF0IHdheSwgd2UgY2FuIGFjdHVhbGx5IGRpc3BsYXlcclxuICAgIC8vIHRoaW5ncyByZW5kZXJlZCBpbiBDYW52YXMgaW4gb3VyIHJhc3Rlcml6YXRpb24uXHJcbiAgICBjb25zdCBjYW52YXNVcmxNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuXHJcbiAgICBsZXQgdW5rbm93bklkcyA9IDA7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQ2FudmFzKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50ICk6IHZvaWQge1xyXG4gICAgICBpZiAoICFjYW52YXMuaWQgKSB7XHJcbiAgICAgICAgY2FudmFzLmlkID0gYHVua25vd24tY2FudmFzLSR7dW5rbm93bklkcysrfWA7XHJcbiAgICAgIH1cclxuICAgICAgY2FudmFzVXJsTWFwWyBjYW52YXMuaWQgXSA9IGNhbnZhcy50b0RhdGFVUkwoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzY2FuRm9yQ2FudmFzZXMoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB2b2lkIHtcclxuICAgICAgaWYgKCBkcmF3YWJsZSBpbnN0YW5jZW9mIEJhY2tib25lRHJhd2FibGUgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBiYWNrYm9uZVxyXG4gICAgICAgIF8uZWFjaCggZHJhd2FibGUuYmxvY2tzLCBjaGlsZERyYXdhYmxlID0+IHtcclxuICAgICAgICAgIHNjYW5Gb3JDYW52YXNlcyggY2hpbGREcmF3YWJsZSApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggZHJhd2FibGUgaW5zdGFuY2VvZiBCbG9jayAmJiBkcmF3YWJsZS5maXJzdERyYXdhYmxlICYmIGRyYXdhYmxlLmxhc3REcmF3YWJsZSApIHtcclxuICAgICAgICAvLyB3ZSdyZSBhIGJsb2NrXHJcbiAgICAgICAgZm9yICggbGV0IGNoaWxkRHJhd2FibGUgPSBkcmF3YWJsZS5maXJzdERyYXdhYmxlOyBjaGlsZERyYXdhYmxlICE9PSBkcmF3YWJsZS5sYXN0RHJhd2FibGU7IGNoaWxkRHJhd2FibGUgPSBjaGlsZERyYXdhYmxlLm5leHREcmF3YWJsZSApIHtcclxuICAgICAgICAgIHNjYW5Gb3JDYW52YXNlcyggY2hpbGREcmF3YWJsZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzY2FuRm9yQ2FudmFzZXMoIGRyYXdhYmxlLmxhc3REcmF3YWJsZSApOyAvLyB3YXNuJ3QgaGl0IGluIG91ciBzaW1wbGlmaWVkIChhbmQgc2FmZXIpIGxvb3BcclxuXHJcbiAgICAgICAgaWYgKCAoIGRyYXdhYmxlIGluc3RhbmNlb2YgQ2FudmFzQmxvY2sgfHwgZHJhd2FibGUgaW5zdGFuY2VvZiBXZWJHTEJsb2NrICkgJiYgZHJhd2FibGUuY2FudmFzICYmIGRyYXdhYmxlLmNhbnZhcyBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudCApIHtcclxuICAgICAgICAgIGFkZENhbnZhcyggZHJhd2FibGUuY2FudmFzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIERPTURyYXdhYmxlICYmIGRyYXdhYmxlIGluc3RhbmNlb2YgRE9NRHJhd2FibGUgKSB7XHJcbiAgICAgICAgaWYgKCBkcmF3YWJsZS5kb21FbGVtZW50IGluc3RhbmNlb2Ygd2luZG93LkhUTUxDYW52YXNFbGVtZW50ICkge1xyXG4gICAgICAgICAgYWRkQ2FudmFzKCBkcmF3YWJsZS5kb21FbGVtZW50ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoIGRyYXdhYmxlLmRvbUVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdjYW52YXMnICksIGNhbnZhcyA9PiB7XHJcbiAgICAgICAgICBhZGRDYW52YXMoIGNhbnZhcyApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBCYWNrYm9uZURyYXdhYmxlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBzY2FuRm9yQ2FudmFzZXMoIHRoaXMuX3Jvb3RCYWNrYm9uZSEgKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgZG9jdW1lbnQsIHNvIHRoYXQgd2UgY2FuICgxKSBzZXJpYWxpemUgaXQgdG8gWEhUTUwsIGFuZCAoMikgbWFuaXB1bGF0ZSBpdCBpbmRlcGVuZGVudGx5LlxyXG4gICAgLy8gSW5zcGlyZWQgYnkgaHR0cDovL2NidXJnbWVyLmdpdGh1Yi5pby9yYXN0ZXJpemVIVE1MLmpzL1xyXG4gICAgY29uc3QgZG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCAnJyApO1xyXG4gICAgZG9jLmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmRvbUVsZW1lbnQub3V0ZXJIVE1MO1xyXG4gICAgZG9jLmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoICd4bWxucycsIGRvYy5kb2N1bWVudEVsZW1lbnQubmFtZXNwYWNlVVJJISApO1xyXG5cclxuICAgIC8vIEhpZGUgdGhlIFBET01cclxuICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzdHlsZScgKSApLmlubmVySFRNTCA9IGAuJHtQRE9NU2libGluZ1N0eWxlLlJPT1RfQ0xBU1NfTkFNRX0geyBkaXNwbGF5Om5vbmU7IH0gYDtcclxuXHJcbiAgICAvLyBSZXBsYWNlIGVhY2ggPGNhbnZhcz4gd2l0aCBhbiA8aW1nPiB0aGF0IGhhcyBzcmM9Y2FudmFzLnRvRGF0YVVSTCgpIGFuZCB0aGUgc2FtZSBzdHlsZVxyXG4gICAgbGV0IGRpc3BsYXlDYW52YXNlczogSFRNTEVsZW1lbnRbXSB8IEhUTUxDb2xsZWN0aW9uID0gZG9jLmRvY3VtZW50RWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSggJ2NhbnZhcycgKTtcclxuICAgIGRpc3BsYXlDYW52YXNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBkaXNwbGF5Q2FudmFzZXMgKTsgLy8gZG9uJ3QgdXNlIGEgbGl2ZSBIVE1MQ29sbGVjdGlvbiBjb3B5IVxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgZGlzcGxheUNhbnZhc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBkaXNwbGF5Q2FudmFzID0gZGlzcGxheUNhbnZhc2VzWyBpIF07XHJcblxyXG4gICAgICBjb25zdCBjc3NUZXh0ID0gZGlzcGxheUNhbnZhcy5zdHlsZS5jc3NUZXh0O1xyXG5cclxuICAgICAgY29uc3QgZGlzcGxheUltZyA9IGRvYy5jcmVhdGVFbGVtZW50KCAnaW1nJyApO1xyXG4gICAgICBjb25zdCBzcmMgPSBjYW52YXNVcmxNYXBbIGRpc3BsYXlDYW52YXMuaWQgXTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc3JjLCAnTXVzdCBoYXZlIG1pc3NlZCBhIHRvRGF0YVVSTCgpIG9uIGEgQ2FudmFzJyApO1xyXG5cclxuICAgICAgZGlzcGxheUltZy5zcmMgPSBzcmM7XHJcbiAgICAgIGRpc3BsYXlJbWcuc2V0QXR0cmlidXRlKCAnc3R5bGUnLCBjc3NUZXh0ICk7XHJcblxyXG4gICAgICBkaXNwbGF5Q2FudmFzLnBhcmVudE5vZGUhLnJlcGxhY2VDaGlsZCggZGlzcGxheUltZywgZGlzcGxheUNhbnZhcyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRpc3BsYXlXaWR0aCA9IHRoaXMud2lkdGg7XHJcbiAgICBjb25zdCBkaXNwbGF5SGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XHJcbiAgICBjb25zdCBjb21wbGV0ZUZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgICBEaXNwbGF5LmVsZW1lbnRUb1NWR0RhdGFVUkwoIGRvYy5kb2N1bWVudEVsZW1lbnQsIGRpc3BsYXlXaWR0aCwgZGlzcGxheUhlaWdodCwgY2FsbGJhY2sgKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ29udmVydCBlYWNoIDxpbWFnZT4ncyB4bGluazpocmVmIHNvIHRoYXQgaXQncyBhIGRhdGEgVVJMIHdpdGggdGhlIHJlbGV2YW50IGRhdGEsIGUuZy5cclxuICAgIC8vIDxpbWFnZSAuLi4geGxpbms6aHJlZj1cImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9zY2VuZXJ5LXBoZXQvaW1hZ2VzL2JhdHRlcnlEQ2VsbC5wbmc/YnVzdD0xNDc2MzA4NDA3OTg4XCIvPlxyXG4gICAgLy8gZ2V0cyByZXBsYWNlZCB3aXRoIGEgZGF0YSBVUkwuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzU3M1xyXG4gICAgbGV0IHJlcGxhY2VkSW1hZ2VzID0gMDsgLy8gQ291bnQgaG93IG1hbnkgaW1hZ2VzIGdldCByZXBsYWNlZC4gV2UnbGwgZGVjcmVtZW50IHdpdGggZWFjaCBmaW5pc2hlZCBpbWFnZS5cclxuICAgIGxldCBoYXNSZXBsYWNlZEltYWdlcyA9IGZhbHNlOyAvLyBXaGV0aGVyIGFueSBpbWFnZXMgYXJlIHJlcGxhY2VkXHJcbiAgICBjb25zdCBkaXNwbGF5U1ZHSW1hZ2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGRvYy5kb2N1bWVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdpbWFnZScgKSApO1xyXG4gICAgZm9yICggbGV0IGogPSAwOyBqIDwgZGlzcGxheVNWR0ltYWdlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgY29uc3QgZGlzcGxheVNWR0ltYWdlID0gZGlzcGxheVNWR0ltYWdlc1sgaiBdO1xyXG4gICAgICBjb25zdCBjdXJyZW50SHJlZiA9IGRpc3BsYXlTVkdJbWFnZS5nZXRBdHRyaWJ1dGUoICd4bGluazpocmVmJyApO1xyXG4gICAgICBpZiAoIGN1cnJlbnRIcmVmLnNsaWNlKCAwLCA1ICkgIT09ICdkYXRhOicgKSB7XHJcbiAgICAgICAgcmVwbGFjZWRJbWFnZXMrKztcclxuICAgICAgICBoYXNSZXBsYWNlZEltYWdlcyA9IHRydWU7XHJcblxyXG4gICAgICAgICggKCkgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1sb29wLWZ1bmNcclxuICAgICAgICAgIC8vIENsb3N1cmUgdmFyaWFibGVzIG5lZWQgdG8gYmUgc3RvcmVkIGZvciBlYWNoIGluZGl2aWR1YWwgU1ZHIGltYWdlLlxyXG4gICAgICAgICAgY29uc3QgcmVmSW1hZ2UgPSBuZXcgd2luZG93LkltYWdlKCk7XHJcbiAgICAgICAgICBjb25zdCBzdmdJbWFnZSA9IGRpc3BsYXlTVkdJbWFnZTtcclxuXHJcbiAgICAgICAgICByZWZJbWFnZS5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhIENhbnZhc1xyXG4gICAgICAgICAgICBjb25zdCByZWZDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgICAgICAgICByZWZDYW52YXMud2lkdGggPSByZWZJbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgcmVmQ2FudmFzLmhlaWdodCA9IHJlZkltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgY29uc3QgcmVmQ29udGV4dCA9IHJlZkNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG5cclxuICAgICAgICAgICAgLy8gRHJhdyB0aGUgKG5vdyBsb2FkZWQpIGltYWdlIGludG8gdGhlIENhbnZhc1xyXG4gICAgICAgICAgICByZWZDb250ZXh0LmRyYXdJbWFnZSggcmVmSW1hZ2UsIDAsIDAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIDxpbWFnZT4ncyBocmVmIHdpdGggdGhlIENhbnZhcycgZGF0YS5cclxuICAgICAgICAgICAgc3ZnSW1hZ2Uuc2V0QXR0cmlidXRlKCAneGxpbms6aHJlZicsIHJlZkNhbnZhcy50b0RhdGFVUkwoKSApO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgaXQncyB0aGUgbGFzdCByZXBsYWNlZCBpbWFnZSwgZ28gdG8gdGhlIG5leHQgc3RlcFxyXG4gICAgICAgICAgICBpZiAoIC0tcmVwbGFjZWRJbWFnZXMgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgY29tcGxldGVGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXBsYWNlZEltYWdlcyA+PSAwICk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmVmSW1hZ2Uub25lcnJvciA9ICgpID0+IHtcclxuICAgICAgICAgICAgLy8gTk9URTogbm90IG11Y2ggd2UgY2FuIGRvLCBsZWF2ZSB0aGlzIGVsZW1lbnQgYWxvbmUuXHJcblxyXG4gICAgICAgICAgICAvLyBJZiBpdCdzIHRoZSBsYXN0IHJlcGxhY2VkIGltYWdlLCBnbyB0byB0aGUgbmV4dCBzdGVwXHJcbiAgICAgICAgICAgIGlmICggLS1yZXBsYWNlZEltYWdlcyA9PT0gMCApIHtcclxuICAgICAgICAgICAgICBjb21wbGV0ZUZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlcGxhY2VkSW1hZ2VzID49IDAgKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgLy8gS2ljayBvZmYgbG9hZGluZyBvZiB0aGUgaW1hZ2UuXHJcbiAgICAgICAgICByZWZJbWFnZS5zcmMgPSBjdXJyZW50SHJlZjtcclxuICAgICAgICB9ICkoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIG5vIGltYWdlcyBhcmUgcmVwbGFjZWQsIHdlIG5lZWQgdG8gY2FsbCBvdXIgY2FsbGJhY2sgdGhyb3VnaCB0aGlzIHJvdXRlLlxyXG4gICAgaWYgKCAhaGFzUmVwbGFjZWRJbWFnZXMgKSB7XHJcbiAgICAgIGNvbXBsZXRlRnVuY3Rpb24oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBwb3B1cFJhc3Rlcml6YXRpb24oKTogdm9pZCB7XHJcbiAgICB0aGlzLmZvcmVpZ25PYmplY3RSYXN0ZXJpemF0aW9uKCB1cmwgPT4ge1xyXG4gICAgICBpZiAoIHVybCApIHtcclxuICAgICAgICB3aW5kb3cub3BlbiggdXJsICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHN0cmluZyBvZiBpbmRpY2VzIGlzbid0IHBhcnQgb2YgdGhlIFBET01JbnN0YW5jZSB0cmVlXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYWlsRnJvbVBET01JbmRpY2VzU3RyaW5nKCBpbmRpY2VzU3RyaW5nOiBzdHJpbmcgKTogVHJhaWwgfCBudWxsIHtcclxuXHJcbiAgICAvLyBObyBQRE9NSW5zdGFuY2UgdHJlZSBpZiB0aGUgZGlzcGxheSBpc24ndCBhY2Nlc3NpYmxlXHJcbiAgICBpZiAoICF0aGlzLl9yb290UERPTUluc3RhbmNlICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW5zdGFuY2UgPSB0aGlzLl9yb290UERPTUluc3RhbmNlO1xyXG4gICAgY29uc3QgaW5kZXhTdHJpbmdzID0gaW5kaWNlc1N0cmluZy5zcGxpdCggUERPTVV0aWxzLlBET01fVU5JUVVFX0lEX1NFUEFSQVRPUiApO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5kZXhTdHJpbmdzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBkaWdpdCA9IE51bWJlciggaW5kZXhTdHJpbmdzWyBpIF0gKTtcclxuICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZS5jaGlsZHJlblsgZGlnaXQgXTtcclxuICAgICAgaWYgKCAhaW5zdGFuY2UgKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKCBpbnN0YW5jZSAmJiBpbnN0YW5jZS50cmFpbCApID8gaW5zdGFuY2UudHJhaWwgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yY2VzIFNWRyBlbGVtZW50cyB0byBoYXZlIHRoZWlyIHZpc3VhbCBjb250ZW50cyByZWZyZXNoZWQsIGJ5IGNoYW5naW5nIHN0YXRlIGluIGEgbm9uLXZpc3VhbGx5LWFwcGFyZW50IHdheS5cclxuICAgKiBJdCBzaG91bGQgdHJpY2sgYnJvd3NlcnMgaW50byByZS1yZW5kZXJpbmcgdGhlIFNWRyBlbGVtZW50cy5cclxuICAgKlxyXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTUwN1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZWZyZXNoU1ZHKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fcmVmcmVzaFNWR0VtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2ltaWxhciB0byByZWZyZXNoU1ZHIChzZWUgZG9jcyBhYm92ZSksIGJ1dCB3aWxsIGRvIHNvIG9uIHRoZSBuZXh0IGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZWZyZXNoU1ZHT25OZXh0RnJhbWUoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9yZWZyZXNoU1ZHUGVuZGluZyA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzLlxyXG4gICAqXHJcbiAgICogVE9ETzogdGhpcyBkaXNwb3NlIGZ1bmN0aW9uIGlzIG5vdCBjb21wbGV0ZS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBhc3NlcnQoICF0aGlzLl9pc0Rpc3Bvc2luZyApO1xyXG4gICAgICBhc3NlcnQoICF0aGlzLl9pc0Rpc3Bvc2VkICk7XHJcblxyXG4gICAgICB0aGlzLl9pc0Rpc3Bvc2luZyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9pbnB1dCApIHtcclxuICAgICAgdGhpcy5kZXRhY2hFdmVudHMoKTtcclxuICAgIH1cclxuICAgIHRoaXMuX3Jvb3ROb2RlLnJlbW92ZVJvb3RlZERpc3BsYXkoIHRoaXMgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2FjY2Vzc2libGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24sICdfYm91bmRIYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvbiB3YXMgbm90IGFkZGVkIHRvIHRoZSBrZXlTdGF0ZVRyYWNrZXInICk7XHJcbiAgICAgIGdsb2JhbEtleVN0YXRlVHJhY2tlci5rZXlkb3duRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5fYm91bmRIYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvbiEgKTtcclxuICAgICAgdGhpcy5fcm9vdFBET01JbnN0YW5jZSEuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ZvY3VzT3ZlcmxheSAmJiB0aGlzLl9mb2N1c092ZXJsYXkuZGlzcG9zZSgpO1xyXG5cclxuICAgIHRoaXMuc2l6ZVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAvLyBXaWxsIGltbWVkaWF0ZWx5IGRpc3Bvc2UgcmVjdXJzaXZlbHksIGFsbCBJbnN0YW5jZXMgQU5EIHRoZWlyIGF0dGFjaGVkIGRyYXdhYmxlcywgd2hpY2ggd2lsbCBpbmNsdWRlIHRoZVxyXG4gICAgLy8gcm9vdEJhY2tib25lLlxyXG4gICAgdGhpcy5fYmFzZUluc3RhbmNlICYmIHRoaXMuX2Jhc2VJbnN0YW5jZS5kaXNwb3NlKCk7XHJcblxyXG4gICAgdGhpcy5kZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlLmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLmZvY3VzTWFuYWdlciAmJiB0aGlzLmZvY3VzTWFuYWdlci5kaXNwb3NlKCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIHRoaXMuX2lzRGlzcG9zaW5nID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgYSBnaXZlbiBET00gZWxlbWVudCwgYW5kIGFzeW5jaHJvbm91c2x5IHJlbmRlcnMgaXQgdG8gYSBzdHJpbmcgdGhhdCBpcyBhIGRhdGEgVVJMIHJlcHJlc2VudGluZyBhbiBTVkdcclxuICAgKiBmaWxlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRvbUVsZW1lbnRcclxuICAgKiBAcGFyYW0gd2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIG91dHB1dCBTVkdcclxuICAgKiBAcGFyYW0gaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgb3V0cHV0IFNWR1xyXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIENhbGxlZCBhcyBjYWxsYmFjayggdXJsOiB7c3RyaW5nfSApLCB3aGVyZSB0aGUgVVJMIHdpbGwgYmUgdGhlIGVuY29kZWQgU1ZHIGZpbGUuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBlbGVtZW50VG9TVkdEYXRhVVJMKCBkb21FbGVtZW50OiBIVE1MRWxlbWVudCwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGNhbGxiYWNrOiAoIHVybDogc3RyaW5nIHwgbnVsbCApID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgIC8vIFNlcmlhbGl6ZSBpdCB0byBYSFRNTCB0aGF0IGNhbiBiZSB1c2VkIGluIGZvcmVpZ25PYmplY3QgKEhUTUwgY2FuJ3QgYmUpXHJcbiAgICBjb25zdCB4aHRtbCA9IG5ldyB3aW5kb3cuWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKCBkb21FbGVtZW50ICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIFNWRyBjb250YWluZXIgd2l0aCBhIGZvcmVpZ25PYmplY3QuXHJcbiAgICBjb25zdCBkYXRhID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIj5gICtcclxuICAgICAgICAgICAgICAgICAnPGZvcmVpZ25PYmplY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiPicgK1xyXG4gICAgICAgICAgICAgICAgIGA8ZGl2IHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiPiR7XHJcbiAgICAgICAgICAgICAgICAgICB4aHRtbFxyXG4gICAgICAgICAgICAgICAgIH08L2Rpdj5gICtcclxuICAgICAgICAgICAgICAgICAnPC9mb3JlaWduT2JqZWN0PicgK1xyXG4gICAgICAgICAgICAgICAgICc8L3N2Zz4nO1xyXG5cclxuICAgIC8vIExvYWQgYW4gPGltZz4gd2l0aCB0aGUgU1ZHIGRhdGEgVVJMLCBhbmQgd2hlbiBsb2FkZWQgZHJhdyBpdCBpbnRvIG91ciBDYW52YXNcclxuICAgIGNvbnN0IGltZyA9IG5ldyB3aW5kb3cuSW1hZ2UoKTtcclxuICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGNvbnRleHQuZHJhd0ltYWdlKCBpbWcsIDAsIDAgKTtcclxuICAgICAgY2FsbGJhY2soIGNhbnZhcy50b0RhdGFVUkwoKSApOyAvLyBFbmRwb2ludCBoZXJlXHJcbiAgICB9O1xyXG4gICAgaW1nLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgIGNhbGxiYWNrKCBudWxsICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFdlIGNhbid0IGJ0b2EoKSBhcmJpdHJhcnkgdW5pY29kZSwgc28gd2UgbmVlZCBhbm90aGVyIHNvbHV0aW9uLFxyXG4gICAgLy8gc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3dCYXNlNjQvQmFzZTY0X2VuY29kaW5nX2FuZF9kZWNvZGluZyNUaGVfLjIyVW5pY29kZV9Qcm9ibGVtLjIyXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gRXh0ZXJpb3IgbGliXHJcbiAgICBjb25zdCB1aW50OGFycmF5ID0gbmV3IHdpbmRvdy5UZXh0RW5jb2RlckxpdGUoICd1dGYtOCcgKS5lbmNvZGUoIGRhdGEgKTtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBFeHRlcmlvciBsaWJcclxuICAgIGNvbnN0IGJhc2U2NCA9IHdpbmRvdy5mcm9tQnl0ZUFycmF5KCB1aW50OGFycmF5ICk7XHJcblxyXG4gICAgLy8gdHVybiBpdCB0byBiYXNlNjQgYW5kIHdyYXAgaXQgaW4gdGhlIGRhdGEgVVJMIGZvcm1hdFxyXG4gICAgaW1nLnNyYyA9IGBkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCR7YmFzZTY0fWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgd2hlbiBOTyBub2RlcyBpbiB0aGUgc3VidHJlZSBhcmUgZGlzcG9zZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgYXNzZXJ0U3VidHJlZURpc3Bvc2VkKCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW5vZGUuaXNEaXNwb3NlZCwgJ0Rpc3Bvc2VkIG5vZGVzIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgaW4gYSBzY2VuZSBncmFwaCB0byBkaXNwbGF5LicgKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBEaXNwbGF5LmFzc2VydFN1YnRyZWVEaXNwb3NlZCggbm9kZS5jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gaW5wdXQgbGlzdGVuZXIgdG8gYmUgZmlyZWQgZm9yIEFOWSBEaXNwbGF5XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhZGRJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhXy5pbmNsdWRlcyggRGlzcGxheS5pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSwgJ0lucHV0IGxpc3RlbmVyIGFscmVhZHkgcmVnaXN0ZXJlZCcgKTtcclxuXHJcbiAgICAvLyBkb24ndCBhbGxvdyBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQgbXVsdGlwbGUgdGltZXNcclxuICAgIGlmICggIV8uaW5jbHVkZXMoIERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICkgKSB7XHJcbiAgICAgIERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYW4gaW5wdXQgbGlzdGVuZXIgdGhhdCB3YXMgcHJldmlvdXNseSBhZGRlZCB3aXRoIERpc3BsYXkuYWRkSW5wdXRMaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlbW92ZUlucHV0TGlzdGVuZXIoIGxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lciApOiB2b2lkIHtcclxuICAgIC8vIGVuc3VyZSB0aGUgbGlzdGVuZXIgaXMgaW4gb3VyIGxpc3RcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaW5jbHVkZXMoIERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICkgKTtcclxuXHJcbiAgICBEaXNwbGF5LmlucHV0TGlzdGVuZXJzLnNwbGljZSggXy5pbmRleE9mKCBEaXNwbGF5LmlucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnJ1cHRzIGFsbCBpbnB1dCBsaXN0ZW5lcnMgdGhhdCBhcmUgYXR0YWNoZWQgdG8gYWxsIERpc3BsYXlzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaW50ZXJydXB0SW5wdXQoKTogdm9pZCB7XHJcbiAgICBjb25zdCBsaXN0ZW5lcnNDb3B5ID0gRGlzcGxheS5pbnB1dExpc3RlbmVycy5zbGljZSggMCApO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RlbmVyc0NvcHkubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gbGlzdGVuZXJzQ29weVsgaSBdO1xyXG5cclxuICAgICAgbGlzdGVuZXIuaW50ZXJydXB0ICYmIGxpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gRmlyZXMgd2hlbiB3ZSBkZXRlY3QgYW4gaW5wdXQgZXZlbnQgdGhhdCB3b3VsZCBiZSBjb25zaWRlcmVkIGEgXCJ1c2VyIGdlc3R1cmVcIiBieSBDaHJvbWUsIHNvXHJcbiAgLy8gdGhhdCB3ZSBjYW4gdHJpZ2dlciBicm93c2VyIGFjdGlvbnMgdGhhdCBhcmUgb25seSBhbGxvd2VkIGFzIGEgcmVzdWx0LlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODAyIGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdmliZS9pc3N1ZXMvMzIgZm9yIG1vcmVcclxuICAvLyBpbmZvcm1hdGlvbi5cclxuICBwdWJsaWMgc3RhdGljIHVzZXJHZXN0dXJlRW1pdHRlcjogVEVtaXR0ZXI7XHJcblxyXG4gIC8vIExpc3RlbmVycyB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBldmVudCBvbiBBTlkgRGlzcGxheSwgc2VlXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExNDkuIERvIG5vdCBkaXJlY3RseSBtb2RpZnkgdGhpcyFcclxuICBwdWJsaWMgc3RhdGljIGlucHV0TGlzdGVuZXJzOiBUSW5wdXRMaXN0ZW5lcltdO1xyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnRGlzcGxheScsIERpc3BsYXkgKTtcclxuXHJcbkRpc3BsYXkudXNlckdlc3R1cmVFbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuRGlzcGxheS5pbnB1dExpc3RlbmVycyA9IFtdOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDZCQUE2QjtBQUdqRCxPQUFPQyxTQUFTLE1BQU0sK0JBQStCO0FBQ3JELE9BQU9DLFlBQVksTUFBTSxrQ0FBa0M7QUFFM0QsT0FBT0MsVUFBVSxNQUFNLCtCQUErQjtBQUN0RCxTQUFTQyxXQUFXLFFBQVEsNEJBQTRCO0FBRXhELE9BQU9DLFVBQVUsTUFBTSxxQ0FBcUM7QUFDNUQsT0FBT0MsU0FBUyxNQUFNLG9DQUFvQztBQUMxRCxPQUFPQyxRQUFRLE1BQU0sbUNBQW1DO0FBRXhELE9BQU9DLGlCQUFpQixNQUFNLGtEQUFrRDtBQUNoRixPQUFPQyxjQUFjLE1BQU0sK0NBQStDO0FBQzFFLFNBQVNDLGdCQUFnQixFQUFFQyxLQUFLLEVBQUVDLFdBQVcsRUFBRUMsdUJBQXVCLEVBQWtCQyxLQUFLLEVBQUVDLFFBQVEsRUFBRUMsV0FBVyxFQUFZQyxRQUFRLEVBQUVDLHdCQUF3QixFQUFFQyxZQUFZLEVBQUVDLFVBQVUsRUFBRUMscUJBQXFC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