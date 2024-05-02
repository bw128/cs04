// Copyright 2012-2024, University of Colorado Boulder

/**
 * A Node for the Scenery scene graph. Supports general directed acyclic graphics (DAGs).
 * Handles multiple layers with assorted types (Canvas 2D, SVG, DOM, WebGL, etc.).
 *
 * ## General description of Nodes
 *
 * In Scenery, the visual output is determined by a group of connected Nodes (generally known as a scene graph).
 * Each Node has a list of 'child' Nodes. When a Node is visually displayed, its child Nodes (children) will also be
 * displayed, along with their children, etc. There is typically one 'root' Node that is passed to the Scenery Display
 * whose descendants (Nodes that can be traced from the root by child relationships) will be displayed.
 *
 * For instance, say there are Nodes named A, B, C, D and E, who have the relationships:
 * - B is a child of A (thus A is a parent of B)
 * - C is a child of A (thus A is a parent of C)
 * - D is a child of C (thus C is a parent of D)
 * - E is a child of C (thus C is a parent of E)
 * where A would be the root Node. This can be visually represented as a scene graph, where a line connects a parent
 * Node to a child Node (where the parent is usually always at the top of the line, and the child is at the bottom):
 * For example:
 *
 *   A
 *  / \
 * B   C
 *    / \
 *   D   E
 *
 * Additionally, in this case:
 * - D is a 'descendant' of A (due to the C being a child of A, and D being a child of C)
 * - A is an 'ancestor' of D (due to the reverse)
 * - C's 'subtree' is C, D and E, which consists of C itself and all of its descendants.
 *
 * Note that Scenery allows some more complicated forms, where Nodes can have multiple parents, e.g.:
 *
 *   A
 *  / \
 * B   C
 *  \ /
 *   D
 *
 * In this case, D has two parents (B and C). Scenery disallows any Node from being its own ancestor or descendant,
 * so that loops are not possible. When a Node has two or more parents, it means that the Node's subtree will typically
 * be displayed twice on the screen. In the above case, D would appear both at B's position and C's position. Each
 * place a Node would be displayed is known as an 'instance'.
 *
 * Each Node has a 'transform' associated with it, which determines how its subtree (that Node and all of its
 * descendants) will be positioned. Transforms can contain:
 * - Translation, which moves the position the subtree is displayed
 * - Scale, which makes the displayed subtree larger or smaller
 * - Rotation, which displays the subtree at an angle
 * - or any combination of the above that uses an affine matrix (more advanced transforms with shear and combinations
 *   are possible).
 *
 * Say we have the following scene graph:
 *
 *   A
 *   |
 *   B
 *   |
 *   C
 *
 * where there are the following transforms:
 * - A has a 'translation' that moves the content 100 pixels to the right
 * - B has a 'scale' that doubles the size of the content
 * - C has a 'rotation' that rotates 180-degrees around the origin
 *
 * If C displays a square that fills the area with 0 <= x <= 10 and 0 <= y <= 10, we can determine the position on
 * the display by applying transforms starting at C and moving towards the root Node (in this case, A):
 * 1. We apply C's rotation to our square, so the filled area will now be -10 <= x <= 0 and -10 <= y <= 0
 * 2. We apply B's scale to our square, so now we have -20 <= x <= 0 and -20 <= y <= 0
 * 3. We apply A's translation to our square, moving it to 80 <= x <= 100 and -20 <= y <= 0
 *
 * Nodes also have a large number of properties that will affect how their entire subtree is rendered, such as
 * visibility, opacity, etc.
 *
 * ## Creating Nodes
 *
 * Generally, there are two types of Nodes:
 * - Nodes that don't display anything, but serve as a container for other Nodes (e.g. Node itself, HBox, VBox)
 * - Nodes that display content, but ALSO serve as a container (e.g. Circle, Image, Text)
 *
 * When a Node is created with the default Node constructor, e.g.:
 *   var node = new Node();
 * then that Node will not display anything by itself.
 *
 * Generally subtypes of Node are used for displaying things, such as Circle, e.g.:
 *   var circle = new Circle( 20 ); // radius of 20
 *
 * Almost all Nodes (with the exception of leaf-only Nodes like Spacer) can contain children.
 *
 * ## Connecting Nodes, and rendering order
 *
 * To make a 'childNode' become a 'parentNode', the typical way is to call addChild():
 *   parentNode.addChild( childNode );
 *
 * To remove this connection, you can call:
 *   parentNode.removeChild( childNode );
 *
 * Adding a child Node with addChild() puts it at the end of parentNode's list of child Nodes. This is important,
 * because the order of children affects what Nodes are drawn on the 'top' or 'bottom' visually. Nodes that are at the
 * end of the list of children are generally drawn on top.
 *
 * This is generally easiest to represent by notating scene graphs with children in order from left to right, thus:
 *
 *   A
 *  / \
 * B   C
 *    / \
 *   D   E
 *
 * would indicate that A's children are [B,C], so C's subtree is drawn ON TOP of B. The same is true of C's children
 * [D,E], so E is drawn on top of D. If a Node itself has content, it is drawn below that of its children (so C itself
 * would be below D and E).
 *
 * This means that for every scene graph, Nodes instances can be ordered from bottom to top. For the above example, the
 * order is:
 * 1. A (on the very bottom visually, may get covered up by other Nodes)
 * 2. B
 * 3. C
 * 4. D
 * 5. E (on the very top visually, may be covering other Nodes)
 *
 * ## Trails
 *
 * For examples where there are multiple parents for some Nodes (also referred to as DAG in some code, as it represents
 * a Directed Acyclic Graph), we need more information about the rendering order (as otherwise Nodes could appear
 * multiple places in the visual bottom-to-top order.
 *
 * A Trail is basically a list of Nodes, where every Node in the list is a child of its previous element, and a parent
 * of its next element. Thus for the scene graph:
 *
 *   A
 *  / \
 * B   C
 *  \ / \
 *   D   E
 *    \ /
 *     F
 *
 * there are actually three instances of F being displayed, with three trails:
 * - [A,B,D,F]
 * - [A,C,D,F]
 * - [A,C,E,F]
 * Note that the trails are essentially listing Nodes used in walking from the root (A) to the relevant Node (F) using
 * connections between parents and children.
 *
 * The trails above are in order from bottom to top (visually), due to the order of children. Thus since A's children
 * are [B,C] in that order, F with the trail [A,B,D,F] is displayed below [A,C,D,F], because C is after B.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import EnabledProperty from '../../../axon/js/EnabledProperty.js';
import Property from '../../../axon/js/Property.js';
import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
import TinyStaticProperty from '../../../axon/js/TinyStaticProperty.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Shape } from '../../../kite/js/imports.js';
import arrayDifference from '../../../phet-core/js/arrayDifference.js';
import deprecationWarning from '../../../phet-core/js/deprecationWarning.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import Tandem from '../../../tandem/js/Tandem.js';
import BooleanIO from '../../../tandem/js/types/BooleanIO.js';
import IOType from '../../../tandem/js/types/IOType.js';
import { ACCESSIBILITY_OPTION_KEYS, CanvasContextWrapper, Features, Filter, Image, isHeightSizable, isWidthSizable, Mouse, ParallelDOM, Picker, Renderer, RendererSummary, scenery, serializeConnectedNodes, Trail } from '../imports.js';
import optionize, { combineOptions, optionize3 } from '../../../phet-core/js/optionize.js';
import Utils from '../../../dot/js/Utils.js';
let globalIdCounter = 1;
const scratchBounds2 = Bounds2.NOTHING.copy(); // mutable {Bounds2} used temporarily in methods
const scratchBounds2Extra = Bounds2.NOTHING.copy(); // mutable {Bounds2} used temporarily in methods
const scratchMatrix3 = new Matrix3();
const ENABLED_PROPERTY_TANDEM_NAME = EnabledProperty.TANDEM_NAME;
const VISIBLE_PROPERTY_TANDEM_NAME = 'visibleProperty';
const INPUT_ENABLED_PROPERTY_TANDEM_NAME = 'inputEnabledProperty';
const PHET_IO_STATE_DEFAULT = false;

// Store the number of parents from the single Node instance that has the most parents in the whole runtime.
let maxParentCount = 0;

// Store the number of children from the single Node instance that has the most children in the whole runtime.
let maxChildCount = 0;
export const REQUIRES_BOUNDS_OPTION_KEYS = ['leftTop',
// {Vector2} - The upper-left corner of this Node's bounds, see setLeftTop() for more documentation
'centerTop',
// {Vector2} - The top-center of this Node's bounds, see setCenterTop() for more documentation
'rightTop',
// {Vector2} - The upper-right corner of this Node's bounds, see setRightTop() for more documentation
'leftCenter',
// {Vector2} - The left-center of this Node's bounds, see setLeftCenter() for more documentation
'center',
// {Vector2} - The center of this Node's bounds, see setCenter() for more documentation
'rightCenter',
// {Vector2} - The center-right of this Node's bounds, see setRightCenter() for more documentation
'leftBottom',
// {Vector2} - The bottom-left of this Node's bounds, see setLeftBottom() for more documentation
'centerBottom',
// {Vector2} - The middle center of this Node's bounds, see setCenterBottom() for more documentation
'rightBottom',
// {Vector2} - The bottom right of this Node's bounds, see setRightBottom() for more documentation
'left',
// {number} - The left side of this Node's bounds, see setLeft() for more documentation
'right',
// {number} - The right side of this Node's bounds, see setRight() for more documentation
'top',
// {number} - The top side of this Node's bounds, see setTop() for more documentation
'bottom',
// {number} - The bottom side of this Node's bounds, see setBottom() for more documentation
'centerX',
// {number} - The x-center of this Node's bounds, see setCenterX() for more documentation
'centerY' // {number} - The y-center of this Node's bounds, see setCenterY() for more documentation
];

// Node options, in the order they are executed in the constructor/mutate()
const NODE_OPTION_KEYS = ['children',
// List of children to add (in order), see setChildren for more documentation
'cursor',
// CSS cursor to display when over this Node, see setCursor() for more documentation

'phetioVisiblePropertyInstrumented',
// When true, create an instrumented visibleProperty when this Node is instrumented, see setPhetioVisiblePropertyInstrumented() for more documentation
'visibleProperty',
// Sets forwarding of the visibleProperty, see setVisibleProperty() for more documentation
'visible',
// Whether the Node is visible, see setVisible() for more documentation

'pickableProperty',
// Sets forwarding of the pickableProperty, see setPickableProperty() for more documentation
'pickable',
// Whether the Node is pickable, see setPickable() for more documentation

'phetioEnabledPropertyInstrumented',
// When true, create an instrumented enabledProperty when this Node is instrumented, see setPhetioEnabledPropertyInstrumented() for more documentation
'enabledProperty',
// Sets forwarding of the enabledProperty, see setEnabledProperty() for more documentation
'enabled',
// Whether the Node is enabled, see setEnabled() for more documentation

'phetioInputEnabledPropertyInstrumented',
// When true, create an instrumented inputEnabledProperty when this Node is instrumented, see setPhetioInputEnabledPropertyInstrumented() for more documentation
'inputEnabledProperty',
// Sets forwarding of the inputEnabledProperty, see setInputEnabledProperty() for more documentation
'inputEnabled',
// {boolean} Whether input events can reach into this subtree, see setInputEnabled() for more documentation
'inputListeners',
// The input listeners attached to the Node, see setInputListeners() for more documentation
'opacity',
// Opacity of this Node's subtree, see setOpacity() for more documentation
'disabledOpacity',
// A multiplier to the opacity of this Node's subtree when the node is disabled, see setDisabledOpacity() for more documentation
'filters',
// Non-opacity filters, see setFilters() for more documentation
'matrix',
// Transformation matrix of the Node, see setMatrix() for more documentation
'translation',
// x/y translation of the Node, see setTranslation() for more documentation
'x',
// x translation of the Node, see setX() for more documentation
'y',
// y translation of the Node, see setY() for more documentation
'rotation',
// rotation (in radians) of the Node, see setRotation() for more documentation
'scale',
// scale of the Node, see scale() for more documentation
'excludeInvisibleChildrenFromBounds',
// Controls bounds depending on child visibility, see setExcludeInvisibleChildrenFromBounds() for more documentation
'layoutOptions',
// Provided to layout containers for options, see setLayoutOptions() for more documentation
'localBounds',
// bounds of subtree in local coordinate frame, see setLocalBounds() for more documentation
'maxWidth',
// Constrains width of this Node, see setMaxWidth() for more documentation
'maxHeight',
// Constrains height of this Node, see setMaxHeight() for more documentation
'renderer',
// The preferred renderer for this subtree, see setRenderer() for more documentation
'layerSplit',
// Forces this subtree into a layer of its own, see setLayerSplit() for more documentation
'usesOpacity',
// Hint that opacity will be changed, see setUsesOpacity() for more documentation
'cssTransform',
// Hint that can trigger using CSS transforms, see setCssTransform() for more documentation
'excludeInvisible',
// If this is invisible, exclude from DOM, see setExcludeInvisible() for more documentation
'webglScale',
// Hint to adjust WebGL scaling quality for this subtree, see setWebglScale() for more documentation
'preventFit',
// Prevents layers from fitting this subtree, see setPreventFit() for more documentation
'mouseArea',
// Changes the area the mouse can interact with, see setMouseArea() for more documentation
'touchArea',
// Changes the area touches can interact with, see setTouchArea() for more documentation
'clipArea',
// Makes things outside of a shape invisible, see setClipArea() for more documentation
'transformBounds',
// Flag that makes bounds tighter, see setTransformBounds() for more documentation
...REQUIRES_BOUNDS_OPTION_KEYS];
const DEFAULT_OPTIONS = {
  phetioVisiblePropertyInstrumented: true,
  visible: true,
  opacity: 1,
  disabledOpacity: 1,
  pickable: null,
  enabled: true,
  phetioEnabledPropertyInstrumented: false,
  inputEnabled: true,
  phetioInputEnabledPropertyInstrumented: false,
  clipArea: null,
  mouseArea: null,
  touchArea: null,
  cursor: null,
  transformBounds: false,
  maxWidth: null,
  maxHeight: null,
  renderer: null,
  usesOpacity: false,
  layerSplit: false,
  cssTransform: false,
  excludeInvisible: false,
  webglScale: null,
  preventFit: false
};
const DEFAULT_INTERNAL_RENDERER = DEFAULT_OPTIONS.renderer === null ? 0 : Renderer.fromName(DEFAULT_OPTIONS.renderer);

// Isolated so that we can delay options that are based on bounds of the Node to after construction.
// See https://github.com/phetsims/scenery/issues/1332

// All translation options (includes those based on bounds and those that are not)

// All transform options (includes translation options)

// All base Node options

class Node extends ParallelDOM {
  // NOTE: All member properties with names starting with '_' are assumed to be private/protected!

  // Assigns a unique ID to this Node (allows trails to get a unique list of IDs)

  // All of the Instances tracking this Node

  // All displays where this Node is the root. (scenery-internal)

  // Drawable states that need to be updated on mutations. Generally added by SVG and
  // DOM elements that need to closely track state (possibly by Canvas to maintain dirty state).
  // (scenery-internal)

  // Whether this Node (and its children) will be visible when the scene is updated.
  // Visible Nodes by default will not be pickable either.
  // NOTE: This is fired synchronously when the visibility of the Node is toggled

  // Opacity, in the range from 0 (fully transparent) to 1 (fully opaque).
  // NOTE: This is fired synchronously when the opacity of the Node is toggled

  // Disabled opacity, in the range from 0 (fully transparent) to 1 (fully opaque).
  // Combined with the normal opacity ONLY when the node is disabled.
  // NOTE: This is fired synchronously when the opacity of the Node is toggled

  // See setPickable() and setPickableProperty()
  // NOTE: This is fired synchronously when the pickability of the Node is toggled

  // See setEnabled() and setEnabledProperty()

  // Whether input event listeners on this Node or descendants on a trail will have
  // input listeners. triggered. Note that this does NOT effect picking, and only prevents some listeners from being
  // fired.

  // This Node and all children will be clipped by this shape (in addition to any
  // other clipping shapes). The shape should be in the local coordinate frame.
  // NOTE: This is fired synchronously when the clipArea of the Node is toggled

  // Whether this Node and its subtree can announce content with Voicing and SpeechSynthesis. Though
  // related to Voicing it exists in Node because it is useful to set voicingVisible on a subtree where the
  // root does not compose Voicing. This is not ideal but the entirety of Voicing cannot be composed into every
  // Node because it would produce incorrect behaviors and have a massive memory footprint. See setVoicingVisible()
  // and Voicing.ts for more information about Voicing.

  // Areas for hit intersection. If set on a Node, no descendants can handle events.
  // (scenery-internal)
  // for mouse position in the local coordinate frame
  // for touch and pen position in the local coordinate frame

  // The CSS cursor to be displayed over this Node. null should be the default (inherit) value.

  // Ordered array of child Nodes.
  // (scenery-internal)

  // Unordered array of parent Nodes.
  // (scenery-internal)

  // Whether we will do more accurate (and tight) bounds computations for rotations and shears.

  // Set up the transform reference. we add a listener so that the transform itself can be modified directly
  // by reference, triggering the event notifications for Scenery The reference to the Transform3 will never change.
  // (scenery-internal)

  // Maximum dimensions for the Node's local bounds before a corrective scaling factor is applied to maintain size.
  // The maximum dimensions are always compared to local bounds, and applied "before" the Node's transform.
  // Whenever the local bounds or maximum dimensions of this Node change and it has at least one maximum dimension
  // (width or height), an ideal scale is computed (either the smallest scale for our local bounds to fit the
  // dimension constraints, OR 1, whichever is lower). Then the Node's transform will be scaled (prepended) with
  // a scale adjustment of ( idealScale / alreadyAppliedScaleFactor ).
  // In the simple case where the Node isn't otherwise transformed, this will apply and update the Node's scale so that
  // the Node matches the maximum dimensions, while never scaling over 1. Note that manually applying transforms to
  // the Node is fine, but may make the Node's width greater than the maximum width.
  // NOTE: If a dimension constraint is null, no resizing will occur due to it. If both maxWidth and maxHeight are null,
  // no scale adjustment will be applied.
  //
  // Also note that setting maxWidth/maxHeight is like adding a local bounds listener (will trigger validation of
  // bounds during the updateDisplay step). NOTE: this means updates to the transform (on a local bounds change) will
  // happen when bounds are validated (validateBounds()), which does not happen synchronously on a child's size
  // change. It does happen at least once in updateDisplay() before rendering, and calling validateBounds() can force
  // a re-check and transform.

  // Scale applied due to the maximum dimension constraints.

  // For user input handling (mouse/touch). (scenery-internal)

  // [mutable] Bounds for this Node and its children in the "parent" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the bounds of the Node
  // is changed.

  // [mutable] Bounds for this Node and its children in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the localBounds of
  // the Node is changed.

  // [mutable] Bounds just for children of this Node (and sub-trees), in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the childBounds of the
  // Node is changed.

  // [mutable] Bounds just for this Node, in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This event can be fired synchronously, and happens with the self-bounds of a Node is changed. This is NOT
  // like the other bounds Properties, which usually fire asynchronously

  // Whether our localBounds have been set (with the ES5 setter/setLocalBounds()) to a custom
  // overridden value. If true, then localBounds itself will not be updated, but will instead always be the
  // overridden value.
  // (scenery-internal)

  // [mutable] Whether invisible children will be excluded from this Node's bounds

  // Options that can be provided to layout managers to adjust positioning for this node.

  // Whether bounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether localBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether selfBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether childBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // (scenery-internal)

  // If assertions are enabled
  // If assertions are enabled
  // If assertions are enabled
  // If assertions are enabled

  // (scenery-internal) Performance hint: What type of renderer should be forced for this Node. Uses the internal
  // bitmask structure declared in Renderer.

  // (scenery-internal) Performance hint: Whether it is anticipated that opacity will be switched on. If so, having this
  // set to true will make switching back-and-forth between opacity:1 and other opacities much faster.

  // (scenery-internal) Performance hint: Whether layers should be split before and after this Node.

  // (scenery-internal) Performance hint: Whether this Node and its subtree should handle transforms by using a CSS
  // transform of a div.

  // (scenery-internal) Performance hint: Whether SVG (or other) content should be excluded from the DOM tree when
  // invisible (instead of just being hidden)

  // (scenery-internal) Performance hint: If non-null, a multiplier to the detected pixel-to-pixel scaling of the
  // WebGL Canvas

  // (scenery-internal) Performance hint: If true, Scenery will not fit any blocks that contain drawables attached to
  // Nodes underneath this Node's subtree. This will typically prevent Scenery from triggering bounds computation for
  // this sub-tree, and movement of this Node or its descendants will never trigger the refitting of a block.

  // This is fired only once for any single operation that may change the children of a Node.
  // For example, if a Node's children are [ a, b ] and setChildren( [ a, x, y, z ] ) is called on it, the
  // childrenChanged event will only be fired once after the entire operation of changing the children is completed.
  childrenChangedEmitter = new TinyEmitter();

  // For every single added child Node, emits with {Node} Node, {number} indexOfChild
  childInsertedEmitter = new TinyEmitter();

  // For every single removed child Node, emits with {Node} Node, {number} indexOfChild
  childRemovedEmitter = new TinyEmitter();

  // Provides a given range that may be affected by the reordering
  childrenReorderedEmitter = new TinyEmitter();

  // Fired whenever a parent is added
  parentAddedEmitter = new TinyEmitter();

  // Fired whenever a parent is removed
  parentRemovedEmitter = new TinyEmitter();

  // Fired synchronously when the transform (transformation matrix) of a Node is changed. Any
  // change to a Node's translation/rotation/scale/etc. will trigger this event.
  transformEmitter = new TinyEmitter();

  // Should be emitted when we need to check full metadata updates directly on Instances,
  // to see if we need to change drawable types, etc.
  instanceRefreshEmitter = new TinyEmitter();

  // Emitted to when we need to potentially recompute our renderer summary (bitmask flags, or
  // things that could affect descendants)
  rendererSummaryRefreshEmitter = new TinyEmitter();

  // Emitted to when we change filters (either opacity or generalized filters)
  filterChangeEmitter = new TinyEmitter();

  // Fired when an instance is changed (added/removed). CAREFUL!! This is potentially a very dangerous thing to listen
  // to. Instances are updated in an asynchronous batch during `updateDisplay()`, and it is very important that display
  // updates do not cause changes the scene graph. Thus, this emitter should NEVER trigger a Node's state to change.
  // Currently, all usages of this cause into updates to the audio view, or updates to a separate display (used as an
  // overlay). Please proceed with caution. Most likely you prefer to use the synchronous support of DisplayedTrailsProperty,
  // see https://github.com/phetsims/scenery/issues/1615 and https://github.com/phetsims/scenery/issues/1620 for details.
  changedInstanceEmitter = new TinyEmitter();

  // Fired whenever this node is added as a root to a Display OR when it is removed as a root from a Display (i.e.
  // the Display is disposed).
  rootedDisplayChangedEmitter = new TinyEmitter();

  // Fired when layoutOptions changes
  layoutOptionsChangedEmitter = new TinyEmitter();

  // A bitmask which specifies which renderers this Node (and only this Node, not its subtree) supports.
  // (scenery-internal)

  // A bitmask-like summary of what renderers and options are supported by this Node and all of its descendants
  // (scenery-internal)

  // So we can traverse only the subtrees that require bounds validation for events firing.
  // This is a sum of the number of events requiring bounds validation on this Node, plus the number of children whose
  // count is non-zero.
  // NOTE: this means that if A has a child B, and B has a boundsEventCount of 5, it only contributes 1 to A's count.
  // This allows us to have changes localized (increasing B's count won't change A or any of A's ancestors), and
  // guarantees that we will know whether a subtree has bounds listeners. Also important: decreasing B's
  // boundsEventCount down to 0 will allow A to decrease its count by 1, without having to check its other children
  // (if we were just using a boolean value, this operation would require A to check if any OTHER children besides
  // B had bounds listeners)
  // (scenery-internal)

  // This signals that we can validateBounds() on this subtree and we don't have to traverse further
  // (scenery-internal)

  // Subcomponent dedicated to hit testing
  // (scenery-internal)

  // There are certain specific cases (in this case due to a11y) where we need
  // to know that a Node is getting removed from its parent BUT that process has not completed yet. It would be ideal
  // to not need this.
  // (scenery-internal)

  // {Object} - A mapping of all of options that require Bounds to be applied properly. Most often these should be set through `mutate` in the end of the construcor instead of being passed through `super()`
  static REQUIRES_BOUNDS_OPTION_KEYS = REQUIRES_BOUNDS_OPTION_KEYS;

  // Used by sceneryDeserialize
  // (scenery-internal)

  // Tracks any layout constraint, so that we can avoid having multiple layout constraints on the same node
  // (and avoid the infinite loops that can happen if that is triggered).
  // (scenery-internal)
  _activeParentLayoutConstraint = null;

  // This is an array of property (setter) names for Node.mutate(), which are also used when creating
  // Nodes with parameter objects.
  //
  // E.g. new phet.scenery.Node( { x: 5, rotation: 20 } ) will create a Path, and apply setters in the order below
  // (node.x = 5; node.rotation = 20)
  //
  // Some special cases exist (for function names). new phet.scenery.Node( { scale: 2 } ) will actually call
  // node.scale( 2 ).
  //
  // The order below is important! Don't change this without knowing the implications.
  //
  // NOTE: Translation-based mutators come before rotation/scale, since typically we think of their operations
  //       occurring "after" the rotation / scaling
  // NOTE: left/right/top/bottom/centerX/centerY are at the end, since they rely potentially on rotation / scaling
  //       changes of bounds that may happen beforehand
  // (scenery-internal)

  // List of all dirty flags that should be available on drawables created from this Node (or
  // subtype). Given a flag (e.g. radius), it indicates the existence of a function
  // drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
  // (scenery-internal)
  //
  // Should be overridden by subtypes.

  /**
   * Creates a Node with options.
   *
   * NOTE: Directly created Nodes (not of any subtype, but created with "new Node( ... )") are generally used as
   *       containers, which can hold other Nodes, subtypes of Node that can display things.
   *
   * Node and its subtypes generally have the last constructor parameter reserved for the 'options' object. This is a
   * key-value map that specifies relevant options that are used by Node and subtypes.
   *
   * For example, one of Node's options is bottom, and one of Circle's options is radius. When a circle is created:
   *   var circle = new Circle( {
   *     radius: 10,
   *     bottom: 200
   *   } );
   * This will create a Circle, set its radius (by executing circle.radius = 10, which uses circle.setRadius()), and
   * then will align the bottom of the circle along y=200 (by executing circle.bottom = 200, which uses
   * node.setBottom()).
   *
   * The options are executed in the order specified by each types _mutatorKeys property.
   *
   * The options object is currently not checked to see whether there are property (key) names that are not used, so it
   * is currently legal to do "new Node( { fork_kitchen_spoon: 5 } )".
   *
   * Usually, an option (e.g. 'visible'), when used in a constructor or mutate() call, will directly use the ES5 setter
   * for that property (e.g. node.visible = ...), which generally forwards to a non-ES5 setter function
   * (e.g. node.setVisible( ... )) that is responsible for the behavior. Documentation is generally on these methods
   * (e.g. setVisible), although some methods may be dynamically created to avoid verbosity (like node.leftTop).
   *
   * Sometimes, options invoke a function instead (e.g. 'scale') because the verb and noun are identical. In this case,
   * instead of setting the setter (node.scale = ..., which would override the function), it will instead call
   * the method directly (e.g. node.scale( ... )).
   */
  constructor(options) {
    super();
    this._id = globalIdCounter++;
    this._instances = [];
    this._rootedDisplays = [];
    this._drawables = [];
    this._visibleProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.visible, DEFAULT_OPTIONS.phetioVisiblePropertyInstrumented, this.onVisiblePropertyChange.bind(this));
    this.opacityProperty = new TinyProperty(DEFAULT_OPTIONS.opacity, this.onOpacityPropertyChange.bind(this));
    this.disabledOpacityProperty = new TinyProperty(DEFAULT_OPTIONS.disabledOpacity, this.onDisabledOpacityPropertyChange.bind(this));
    this._pickableProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.pickable, false, this.onPickablePropertyChange.bind(this));
    this._enabledProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.enabled, DEFAULT_OPTIONS.phetioEnabledPropertyInstrumented, this.onEnabledPropertyChange.bind(this));
    this._inputEnabledProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.inputEnabled, DEFAULT_OPTIONS.phetioInputEnabledPropertyInstrumented);
    this.clipAreaProperty = new TinyProperty(DEFAULT_OPTIONS.clipArea);
    this.voicingVisibleProperty = new TinyProperty(true);
    this._mouseArea = DEFAULT_OPTIONS.mouseArea;
    this._touchArea = DEFAULT_OPTIONS.touchArea;
    this._cursor = DEFAULT_OPTIONS.cursor;
    this._children = [];
    this._parents = [];
    this._transformBounds = DEFAULT_OPTIONS.transformBounds;
    this._transform = new Transform3();
    this._transformListener = this.onTransformChange.bind(this);
    this._transform.changeEmitter.addListener(this._transformListener);
    this._maxWidth = DEFAULT_OPTIONS.maxWidth;
    this._maxHeight = DEFAULT_OPTIONS.maxHeight;
    this._appliedScaleFactor = 1;
    this._inputListeners = [];
    this._renderer = DEFAULT_INTERNAL_RENDERER;
    this._usesOpacity = DEFAULT_OPTIONS.usesOpacity;
    this._layerSplit = DEFAULT_OPTIONS.layerSplit;
    this._cssTransform = DEFAULT_OPTIONS.cssTransform;
    this._excludeInvisible = DEFAULT_OPTIONS.excludeInvisible;
    this._webglScale = DEFAULT_OPTIONS.webglScale;
    this._preventFit = DEFAULT_OPTIONS.preventFit;
    this.inputEnabledProperty.lazyLink(this.pdomBoundInputEnabledListener);

    // Add listener count change notifications into these Properties, since we need to know when their number of listeners
    // changes dynamically.
    const boundsListenersAddedOrRemovedListener = this.onBoundsListenersAddedOrRemoved.bind(this);
    const boundsInvalidationListener = this.validateBounds.bind(this);
    const selfBoundsInvalidationListener = this.validateSelfBounds.bind(this);
    this.boundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.boundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.localBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.localBoundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.childBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.childBoundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.selfBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), selfBoundsInvalidationListener);
    this._localBoundsOverridden = false;
    this._excludeInvisibleChildrenFromBounds = false;
    this._layoutOptions = null;
    this._boundsDirty = true;
    this._localBoundsDirty = true;
    this._selfBoundsDirty = true;
    this._childBoundsDirty = true;
    if (assert) {
      // for assertions later to ensure that we are using the same Bounds2 copies as before
      this._originalBounds = this.boundsProperty._value;
      this._originalLocalBounds = this.localBoundsProperty._value;
      this._originalSelfBounds = this.selfBoundsProperty._value;
      this._originalChildBounds = this.childBoundsProperty._value;
    }
    this._filters = [];
    this._rendererBitmask = Renderer.bitmaskNodeDefault;
    this._rendererSummary = new RendererSummary(this);
    this._boundsEventCount = 0;
    this._boundsEventSelfCount = 0;
    this._picker = new Picker(this);
    this._isGettingRemovedFromParent = false;
    if (options) {
      this.mutate(options);
    }
  }

  /**
   * Inserts a child Node at a specific index.
   *
   * node.insertChild( 0, childNode ) will insert the child into the beginning of the children array (on the bottom
   * visually).
   *
   * node.insertChild( node.children.length, childNode ) is equivalent to node.addChild( childNode ), and appends it
   * to the end (top visually) of the children array. It is recommended to use node.addChild when possible.
   *
   * NOTE: overridden by Leaf for some subtypes
   *
   * @param index - Index where the inserted child Node will be after this operation.
   * @param node - The new child to insert.
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  insertChild(index, node, isComposite) {
    assert && assert(node !== null && node !== undefined, 'insertChild cannot insert a null/undefined child');
    assert && assert(!_.includes(this._children, node), 'Parent already contains child');
    assert && assert(node !== this, 'Cannot add self as a child');
    assert && assert(node._parents !== null, 'Tried to insert a disposed child node?');
    assert && assert(!node.isDisposed, 'Tried to insert a disposed Node');

    // needs to be early to prevent re-entrant children modifications
    this._picker.onInsertChild(node);
    this.changeBoundsEventCount(node._boundsEventCount > 0 ? 1 : 0);
    this._rendererSummary.summaryChange(RendererSummary.bitmaskAll, node._rendererSummary.bitmask);
    node._parents.push(this);
    if (assert && window.phet?.chipper?.queryParameters && isFinite(phet.chipper.queryParameters.parentLimit)) {
      const parentCount = node._parents.length;
      if (maxParentCount < parentCount) {
        maxParentCount = parentCount;
        console.log(`Max Node parents: ${maxParentCount}`);
        assert(maxParentCount <= phet.chipper.queryParameters.parentLimit, `parent count of ${maxParentCount} above ?parentLimit=${phet.chipper.queryParameters.parentLimit}`);
      }
    }
    this._children.splice(index, 0, node);
    if (assert && window.phet?.chipper?.queryParameters && isFinite(phet.chipper.queryParameters.childLimit)) {
      const childCount = this._children.length;
      if (maxChildCount < childCount) {
        maxChildCount = childCount;
        console.log(`Max Node children: ${maxChildCount}`);
        assert(maxChildCount <= phet.chipper.queryParameters.childLimit, `child count of ${maxChildCount} above ?childLimit=${phet.chipper.queryParameters.childLimit}`);
      }
    }

    // If this added subtree contains PDOM content, we need to notify any relevant displays
    if (!node._rendererSummary.hasNoPDOM()) {
      this.onPDOMAddChild(node);
    }
    node.invalidateBounds();

    // like calling this.invalidateBounds(), but we already marked all ancestors with dirty child bounds
    this._boundsDirty = true;
    this.childInsertedEmitter.emit(node, index);
    node.parentAddedEmitter.emit(this);
    !isComposite && this.childrenChangedEmitter.emit();
    if (assertSlow) {
      this._picker.audit();
    }
    return this; // allow chaining
  }

  /**
   * Appends a child Node to our list of children.
   *
   * The new child Node will be displayed in front (on top) of all of this node's other children.
   *
   * @param node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  addChild(node, isComposite) {
    this.insertChild(this._children.length, node, isComposite);
    return this; // allow chaining
  }

  /**
   * Removes a child Node from our list of children, see http://phetsims.github.io/scenery/doc/#node-removeChild
   * Will fail an assertion if the Node is not currently one of our children
   *
   * @param node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChild(node, isComposite) {
    assert && assert(node && node instanceof Node, 'Need to call node.removeChild() with a Node.');
    assert && assert(this.hasChild(node), 'Attempted to removeChild with a node that was not a child.');
    const indexOfChild = _.indexOf(this._children, node);
    this.removeChildWithIndex(node, indexOfChild, isComposite);
    return this; // allow chaining
  }

  /**
   * Removes a child Node at a specific index (node.children[ index ]) from our list of children.
   * Will fail if the index is out of bounds.
   *
   * @param index
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChildAt(index, isComposite) {
    assert && assert(index >= 0);
    assert && assert(index < this._children.length);
    const node = this._children[index];
    this.removeChildWithIndex(node, index, isComposite);
    return this; // allow chaining
  }

  /**
   * Internal method for removing a Node (always has the Node and index).
   *
   * NOTE: overridden by Leaf for some subtypes
   *
   * @param node - The child node to remove from this Node (it's parent)
   * @param indexOfChild - Should satisfy this.children[ indexOfChild ] === node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChildWithIndex(node, indexOfChild, isComposite) {
    assert && assert(node && node instanceof Node, 'Need to call node.removeChildWithIndex() with a Node.');
    assert && assert(this.hasChild(node), 'Attempted to removeChild with a node that was not a child.');
    assert && assert(this._children[indexOfChild] === node, 'Incorrect index for removeChildWithIndex');
    assert && assert(node._parents !== null, 'Tried to remove a disposed child node?');
    const indexOfParent = _.indexOf(node._parents, this);
    node._isGettingRemovedFromParent = true;

    // If this added subtree contains PDOM content, we need to notify any relevant displays
    // NOTE: Potentially removes bounds listeners here!
    if (!node._rendererSummary.hasNoPDOM()) {
      this.onPDOMRemoveChild(node);
    }

    // needs to be early to prevent re-entrant children modifications
    this._picker.onRemoveChild(node);
    this.changeBoundsEventCount(node._boundsEventCount > 0 ? -1 : 0);
    this._rendererSummary.summaryChange(node._rendererSummary.bitmask, RendererSummary.bitmaskAll);
    node._parents.splice(indexOfParent, 1);
    this._children.splice(indexOfChild, 1);
    node._isGettingRemovedFromParent = false; // It is "complete"

    this.invalidateBounds();
    this._childBoundsDirty = true; // force recomputation of child bounds after removing a child

    this.childRemovedEmitter.emit(node, indexOfChild);
    node.parentRemovedEmitter.emit(this);
    !isComposite && this.childrenChangedEmitter.emit();
    if (assertSlow) {
      this._picker.audit();
    }
  }

  /**
   * If a child is not at the given index, it is moved to the given index. This reorders the children of this Node so
   * that `this.children[ index ] === node`.
   *
   * @param node - The child Node to move in the order
   * @param index - The desired index (into the children array) of the child.
   */
  moveChildToIndex(node, index) {
    assert && assert(this.hasChild(node), 'Attempted to moveChildToIndex with a node that was not a child.');
    assert && assert(index % 1 === 0 && index >= 0 && index < this._children.length, `Invalid index: ${index}`);
    const currentIndex = this.indexOfChild(node);
    if (this._children[index] !== node) {
      // Apply the actual children change
      this._children.splice(currentIndex, 1);
      this._children.splice(index, 0, node);
      if (!this._rendererSummary.hasNoPDOM()) {
        this.onPDOMReorderedChildren();
      }
      this.childrenReorderedEmitter.emit(Math.min(currentIndex, index), Math.max(currentIndex, index));
      this.childrenChangedEmitter.emit();
    }
    return this;
  }

  /**
   * Removes all children from this Node.
   */
  removeAllChildren() {
    this.setChildren([]);
    return this; // allow chaining
  }

  /**
   * Sets the children of the Node to be equivalent to the passed-in array of Nodes.
   *
   * NOTE: Meant to be overridden in some cases
   */
  setChildren(children) {
    // The implementation is split into basically three stages:
    // 1. Remove current children that are not in the new children array.
    // 2. Reorder children that exist both before/after the change.
    // 3. Insert in new children

    const beforeOnly = []; // Will hold all nodes that will be removed.
    const afterOnly = []; // Will hold all nodes that will be "new" children (added)
    const inBoth = []; // Child nodes that "stay". Will be ordered for the "after" case.
    let i;

    // Compute what things were added, removed, or stay.
    arrayDifference(children, this._children, afterOnly, beforeOnly, inBoth);

    // Remove any nodes that are not in the new children.
    for (i = beforeOnly.length - 1; i >= 0; i--) {
      this.removeChild(beforeOnly[i], true);
    }
    assert && assert(this._children.length === inBoth.length, 'Removing children should not have triggered other children changes');

    // Handle the main reordering (of nodes that "stay")
    let minChangeIndex = -1; // What is the smallest index where this._children[ index ] !== inBoth[ index ]
    let maxChangeIndex = -1; // What is the largest index where this._children[ index ] !== inBoth[ index ]
    for (i = 0; i < inBoth.length; i++) {
      const desired = inBoth[i];
      if (this._children[i] !== desired) {
        this._children[i] = desired;
        if (minChangeIndex === -1) {
          minChangeIndex = i;
        }
        maxChangeIndex = i;
      }
    }
    // If our minChangeIndex is still -1, then none of those nodes that "stay" were reordered. It's important to check
    // for this case, so that `node.children = node.children` is effectively a no-op performance-wise.
    const hasReorderingChange = minChangeIndex !== -1;

    // Immediate consequences/updates from reordering
    if (hasReorderingChange) {
      if (!this._rendererSummary.hasNoPDOM()) {
        this.onPDOMReorderedChildren();
      }
      this.childrenReorderedEmitter.emit(minChangeIndex, maxChangeIndex);
    }

    // Add in "new" children.
    // Scan through the "ending" children indices, adding in things that were in the "afterOnly" part. This scan is
    // done through the children array instead of the afterOnly array (as determining the index in children would
    // then be quadratic in time, which would be unacceptable here). At this point, a forward scan should be
    // sufficient to insert in-place, and should move the least amount of nodes in the array.
    if (afterOnly.length) {
      let afterIndex = 0;
      let after = afterOnly[afterIndex];
      for (i = 0; i < children.length; i++) {
        if (children[i] === after) {
          this.insertChild(i, after, true);
          after = afterOnly[++afterIndex];
        }
      }
    }

    // If we had any changes, send the generic "changed" event.
    if (beforeOnly.length !== 0 || afterOnly.length !== 0 || hasReorderingChange) {
      this.childrenChangedEmitter.emit();
    }

    // Sanity checks to make sure our resulting children array is correct.
    if (assert) {
      for (let j = 0; j < this._children.length; j++) {
        assert(children[j] === this._children[j], 'Incorrect child after setChildren, possibly a reentrancy issue');
      }
    }

    // allow chaining
    return this;
  }

  /**
   * See setChildren() for more information
   */
  set children(value) {
    this.setChildren(value);
  }

  /**
   * See getChildren() for more information
   */
  get children() {
    return this.getChildren();
  }

  /**
   * Returns a defensive copy of the array of direct children of this node, ordered by what is in front (nodes at
   * the end of the array are in front of nodes at the start).
   *
   * Making changes to the returned result will not affect this node's children.
   */
  getChildren() {
    return this._children.slice(0); // create a defensive copy
  }

  /**
   * Returns a count of children, without needing to make a defensive copy.
   */
  getChildrenCount() {
    return this._children.length;
  }

  /**
   * Returns a defensive copy of our parents. This is an array of parent nodes that is returned in no particular
   * order (as order is not important here).
   *
   * NOTE: Modifying the returned array will not in any way modify this node's parents.
   */
  getParents() {
    return this._parents.slice(0); // create a defensive copy
  }

  /**
   * See getParents() for more information
   */
  get parents() {
    return this.getParents();
  }

  /**
   * Returns a single parent if it exists, otherwise null (no parents), or an assertion failure (multiple parents).
   */
  getParent() {
    assert && assert(this._parents.length <= 1, 'Cannot call getParent on a node with multiple parents');
    return this._parents.length ? this._parents[0] : null;
  }

  /**
   * See getParent() for more information
   */
  get parent() {
    return this.getParent();
  }

  /**
   * Gets the child at a specific index into the children array.
   */
  getChildAt(index) {
    return this._children[index];
  }

  /**
   * Finds the index of a parent Node in the parents array.
   *
   * @param parent - Should be a parent of this node.
   * @returns - An index such that this.parents[ index ] === parent
   */
  indexOfParent(parent) {
    return _.indexOf(this._parents, parent);
  }

  /**
   * Finds the index of a child Node in the children array.
   *
   * @param child - Should be a child of this node.
   * @returns - An index such that this.children[ index ] === child
   */
  indexOfChild(child) {
    return _.indexOf(this._children, child);
  }

  /**
   * Moves this Node to the front (end) of all of its parents children array.
   */
  moveToFront() {
    _.each(this.parents, parent => parent.moveChildToFront(this));
    return this; // allow chaining
  }

  /**
   * Moves one of our children to the front (end) of our children array.
   *
   * @param child - Our child to move to the front.
   */
  moveChildToFront(child) {
    return this.moveChildToIndex(child, this._children.length - 1);
  }

  /**
   * Move this node one index forward in each of its parents.  If the Node is already at the front, this is a no-op.
   */
  moveForward() {
    this.parents.forEach(parent => parent.moveChildForward(this));
    return this; // chaining
  }

  /**
   * Moves the specified child forward by one index.  If the child is already at the front, this is a no-op.
   */
  moveChildForward(child) {
    const index = this.indexOfChild(child);
    if (index < this.getChildrenCount() - 1) {
      this.moveChildToIndex(child, index + 1);
    }
    return this; // chaining
  }

  /**
   * Move this node one index backward in each of its parents.  If the Node is already at the back, this is a no-op.
   */
  moveBackward() {
    this.parents.forEach(parent => parent.moveChildBackward(this));
    return this; // chaining
  }

  /**
   * Moves the specified child forward by one index.  If the child is already at the back, this is a no-op.
   */
  moveChildBackward(child) {
    const index = this.indexOfChild(child);
    if (index > 0) {
      this.moveChildToIndex(child, index - 1);
    }
    return this; // chaining
  }

  /**
   * Moves this Node to the back (front) of all of its parents children array.
   */
  moveToBack() {
    _.each(this.parents, parent => parent.moveChildToBack(this));
    return this; // allow chaining
  }

  /**
   * Moves one of our children to the back (front) of our children array.
   *
   * @param child - Our child to move to the back.
   */
  moveChildToBack(child) {
    return this.moveChildToIndex(child, 0);
  }

  /**
   * Replace a child in this node's children array with another node. If the old child had DOM focus and
   * the new child is focusable, the new child will receive focus after it is added.
   */
  replaceChild(oldChild, newChild) {
    assert && assert(this.hasChild(oldChild), 'Attempted to replace a node that was not a child.');

    // information that needs to be restored
    const index = this.indexOfChild(oldChild);
    const oldChildFocused = oldChild.focused;
    this.removeChild(oldChild, true);
    this.insertChild(index, newChild, true);
    this.childrenChangedEmitter.emit();
    if (oldChildFocused && newChild.focusable) {
      newChild.focus();
    }
    return this; // allow chaining
  }

  /**
   * Removes this Node from all of its parents.
   */
  detach() {
    _.each(this._parents.slice(0), parent => parent.removeChild(this));
    return this; // allow chaining
  }

  /**
   * Update our event count, usually by 1 or -1. See documentation on _boundsEventCount in constructor.
   *
   * @param n - How to increment/decrement the bounds event listener count
   */
  changeBoundsEventCount(n) {
    if (n !== 0) {
      const zeroBefore = this._boundsEventCount === 0;
      this._boundsEventCount += n;
      assert && assert(this._boundsEventCount >= 0, 'subtree bounds event count should be guaranteed to be >= 0');
      const zeroAfter = this._boundsEventCount === 0;
      if (zeroBefore !== zeroAfter) {
        // parents will only have their count
        const parentDelta = zeroBefore ? 1 : -1;
        const len = this._parents.length;
        for (let i = 0; i < len; i++) {
          this._parents[i].changeBoundsEventCount(parentDelta);
        }
      }
    }
  }

  /**
   * Ensures that the cached selfBounds of this Node is accurate. Returns true if any sort of dirty flag was set
   * before this was called.
   *
   * @returns - Was the self-bounds potentially updated?
   */
  validateSelfBounds() {
    // validate bounds of ourself if necessary
    if (this._selfBoundsDirty) {
      const oldSelfBounds = scratchBounds2.set(this.selfBoundsProperty._value);

      // Rely on an overloadable method to accomplish computing our self bounds. This should update
      // this.selfBounds itself, returning whether it was actually changed. If it didn't change, we don't want to
      // send a 'selfBounds' event.
      const didSelfBoundsChange = this.updateSelfBounds();
      this._selfBoundsDirty = false;
      if (didSelfBoundsChange) {
        this.selfBoundsProperty.notifyListeners(oldSelfBounds);
      }
      return true;
    }
    return false;
  }

  /**
   * Ensures that cached bounds stored on this Node (and all children) are accurate. Returns true if any sort of dirty
   * flag was set before this was called.
   *
   * @returns - Was something potentially updated?
   */
  validateBounds() {
    sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`validateBounds #${this._id}`);
    sceneryLog && sceneryLog.bounds && sceneryLog.push();
    let i;
    const notificationThreshold = 1e-13;
    let wasDirtyBefore = this.validateSelfBounds();

    // We're going to directly mutate these instances
    const ourChildBounds = this.childBoundsProperty._value;
    const ourLocalBounds = this.localBoundsProperty._value;
    const ourSelfBounds = this.selfBoundsProperty._value;
    const ourBounds = this.boundsProperty._value;

    // validate bounds of children if necessary
    if (this._childBoundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('childBounds dirty');

      // have each child validate their own bounds
      i = this._children.length;
      while (i--) {
        const child = this._children[i];

        // Reentrancy might cause the child to be removed
        if (child) {
          child.validateBounds();
        }
      }

      // and recompute our childBounds
      const oldChildBounds = scratchBounds2.set(ourChildBounds); // store old value in a temporary Bounds2
      ourChildBounds.set(Bounds2.NOTHING); // initialize to a value that can be unioned with includeBounds()

      i = this._children.length;
      while (i--) {
        const child = this._children[i];

        // Reentrancy might cause the child to be removed
        if (child && !this._excludeInvisibleChildrenFromBounds || child.isVisible()) {
          ourChildBounds.includeBounds(child.bounds);
        }
      }

      // run this before firing the event
      this._childBoundsDirty = false;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`childBounds: ${ourChildBounds}`);
      if (!ourChildBounds.equals(oldChildBounds)) {
        // notifies only on an actual change
        if (!ourChildBounds.equalsEpsilon(oldChildBounds, notificationThreshold)) {
          this.childBoundsProperty.notifyListeners(oldChildBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }
    if (this._localBoundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('localBounds dirty');
      this._localBoundsDirty = false; // we only need this to set local bounds as dirty

      const oldLocalBounds = scratchBounds2.set(ourLocalBounds); // store old value in a temporary Bounds2

      // Only adjust the local bounds if it is not overridden
      if (!this._localBoundsOverridden) {
        // local bounds are a union between our self bounds and child bounds
        ourLocalBounds.set(ourSelfBounds).includeBounds(ourChildBounds);

        // apply clipping to the bounds if we have a clip area (all done in the local coordinate frame)
        const clipArea = this.clipArea;
        if (clipArea) {
          ourLocalBounds.constrainBounds(clipArea.bounds);
        }
      }
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`localBounds: ${ourLocalBounds}`);

      // NOTE: we need to update max dimensions still even if we are setting overridden localBounds
      // adjust our transform to match maximum bounds if necessary on a local bounds change
      if (this._maxWidth !== null || this._maxHeight !== null) {
        // needs to run before notifications below, otherwise reentrancy that hits this codepath will have its
        // updateMaxDimension overridden by the eventual original function call, with the now-incorrect local bounds.
        // See https://github.com/phetsims/joist/issues/725
        this.updateMaxDimension(ourLocalBounds);
      }
      if (!ourLocalBounds.equals(oldLocalBounds)) {
        // sanity check, see https://github.com/phetsims/scenery/issues/1071, we're running this before the localBounds
        // listeners are notified, to support limited re-entrance.
        this._boundsDirty = true;
        if (!ourLocalBounds.equalsEpsilon(oldLocalBounds, notificationThreshold)) {
          this.localBoundsProperty.notifyListeners(oldLocalBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }

    // TODO: layout here? https://github.com/phetsims/scenery/issues/1581

    if (this._boundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('bounds dirty');

      // run this before firing the event
      this._boundsDirty = false;
      const oldBounds = scratchBounds2.set(ourBounds); // store old value in a temporary Bounds2

      // no need to do the more expensive bounds transformation if we are still axis-aligned
      if (this._transformBounds && !this._transform.getMatrix().isAxisAligned()) {
        // mutates the matrix and bounds during recursion

        const matrix = scratchMatrix3.set(this.getMatrix()); // calls below mutate this matrix
        ourBounds.set(Bounds2.NOTHING);
        // Include each painted self individually, transformed with the exact transform matrix.
        // This is expensive, as we have to do 2 matrix transforms for every descendant.
        this._includeTransformedSubtreeBounds(matrix, ourBounds); // self and children

        const clipArea = this.clipArea;
        if (clipArea) {
          ourBounds.constrainBounds(clipArea.getBoundsWithTransform(matrix));
        }
      } else {
        // converts local to parent bounds. mutable methods used to minimize number of created bounds instances
        // (we create one so we don't change references to the old one)
        ourBounds.set(ourLocalBounds);
        this.transformBoundsFromLocalToParent(ourBounds);
      }
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`bounds: ${ourBounds}`);
      if (!ourBounds.equals(oldBounds)) {
        // if we have a bounds change, we need to invalidate our parents so they can be recomputed
        i = this._parents.length;
        while (i--) {
          this._parents[i].invalidateBounds();
        }

        // TODO: consider changing to parameter object (that may be a problem for the GC overhead) https://github.com/phetsims/scenery/issues/1581
        if (!ourBounds.equalsEpsilon(oldBounds, notificationThreshold)) {
          this.boundsProperty.notifyListeners(oldBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }

    // if there were side-effects, run the validation again until we are clean
    if (this._childBoundsDirty || this._boundsDirty) {
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('revalidation');

      // TODO: if there are side-effects in listeners, this could overflow the stack. we should report an error https://github.com/phetsims/scenery/issues/1581
      // instead of locking up
      this.validateBounds(); // RE-ENTRANT CALL HERE, it will validateBounds()
    }
    if (assert) {
      assert(this._originalBounds === this.boundsProperty._value, 'Reference for bounds changed!');
      assert(this._originalLocalBounds === this.localBoundsProperty._value, 'Reference for localBounds changed!');
      assert(this._originalSelfBounds === this.selfBoundsProperty._value, 'Reference for selfBounds changed!');
      assert(this._originalChildBounds === this.childBoundsProperty._value, 'Reference for childBounds changed!');
    }

    // double-check that all of our bounds handling has been accurate
    if (assertSlow) {
      // new scope for safety
      (() => {
        const epsilon = 0.000001;
        const childBounds = Bounds2.NOTHING.copy();
        _.each(this._children, child => {
          if (!this._excludeInvisibleChildrenFromBounds || child.isVisible()) {
            childBounds.includeBounds(child.boundsProperty._value);
          }
        });
        let localBounds = this.selfBoundsProperty._value.union(childBounds);
        const clipArea = this.clipArea;
        if (clipArea) {
          localBounds = localBounds.intersection(clipArea.bounds);
        }
        const fullBounds = this.localToParentBounds(localBounds);
        assertSlow && assertSlow(this.childBoundsProperty._value.equalsEpsilon(childBounds, epsilon), `Child bounds mismatch after validateBounds: ${this.childBoundsProperty._value.toString()}, expected: ${childBounds.toString()}`);
        assertSlow && assertSlow(this._localBoundsOverridden || this._transformBounds || this.boundsProperty._value.equalsEpsilon(fullBounds, epsilon), `Bounds mismatch after validateBounds: ${this.boundsProperty._value.toString()}, expected: ${fullBounds.toString()}. This could have happened if a bounds instance owned by a Node` + ' was directly mutated (e.g. bounds.erode())');
      })();
    }
    sceneryLog && sceneryLog.bounds && sceneryLog.pop();
    return wasDirtyBefore; // whether any dirty flags were set
  }

  /**
   * Recursion for accurate transformed bounds handling. Mutates bounds with the added bounds.
   * Mutates the matrix (parameter), but mutates it back to the starting point (within floating-point error).
   */
  _includeTransformedSubtreeBounds(matrix, bounds) {
    if (!this.selfBounds.isEmpty()) {
      bounds.includeBounds(this.getTransformedSelfBounds(matrix));
    }
    const numChildren = this._children.length;
    for (let i = 0; i < numChildren; i++) {
      const child = this._children[i];
      matrix.multiplyMatrix(child._transform.getMatrix());
      child._includeTransformedSubtreeBounds(matrix, bounds);
      matrix.multiplyMatrix(child._transform.getInverse());
    }
    return bounds;
  }

  /**
   * Traverses this subtree and validates bounds only for subtrees that have bounds listeners (trying to exclude as
   * much as possible for performance). This is done so that we can do the minimum bounds validation to prevent any
   * bounds listeners from being triggered in further validateBounds() calls without other Node changes being done.
   * This is required for Display's atomic (non-reentrant) updateDisplay(), so that we don't accidentally trigger
   * bounds listeners while computing bounds during updateDisplay(). (scenery-internal)
   *
   * NOTE: this should pass by (ignore) any overridden localBounds, to trigger listeners below.
   */
  validateWatchedBounds() {
    // Since a bounds listener on one of the roots could invalidate bounds on the other, we need to keep running this
    // until they are all clean. Otherwise, side-effects could occur from bounds validations
    // TODO: consider a way to prevent infinite loops here that occur due to bounds listeners triggering cycles https://github.com/phetsims/scenery/issues/1581
    while (this.watchedBoundsScan()) {
      // do nothing
    }
  }

  /**
   * Recursive function for validateWatchedBounds. Returned whether any validateBounds() returned true (means we have
   * to traverse again) - scenery-internal
   *
   * @returns - Whether there could have been any changes.
   */
  watchedBoundsScan() {
    if (this._boundsEventSelfCount !== 0) {
      // we are a root that should be validated. return whether we updated anything
      return this.validateBounds();
    } else if (this._boundsEventCount > 0 && this._childBoundsDirty) {
      // descendants have watched bounds, traverse!
      let changed = false;
      const numChildren = this._children.length;
      for (let i = 0; i < numChildren; i++) {
        changed = this._children[i].watchedBoundsScan() || changed;
      }
      return changed;
    } else {
      // if _boundsEventCount is zero, no bounds are watched below us (don't traverse), and it wasn't changed
      return false;
    }
  }

  /**
   * Marks the bounds of this Node as invalid, so they are recomputed before being accessed again.
   */
  invalidateBounds() {
    // TODO: sometimes we won't need to invalidate local bounds! it's not too much of a hassle though? https://github.com/phetsims/scenery/issues/1581
    this._boundsDirty = true;
    this._localBoundsDirty = true;

    // and set flags for all ancestors
    let i = this._parents.length;
    while (i--) {
      this._parents[i].invalidateChildBounds();
    }
  }

  /**
   * Recursively tag all ancestors with _childBoundsDirty (scenery-internal)
   */
  invalidateChildBounds() {
    // don't bother updating if we've already been tagged
    if (!this._childBoundsDirty) {
      this._childBoundsDirty = true;
      this._localBoundsDirty = true;
      let i = this._parents.length;
      while (i--) {
        this._parents[i].invalidateChildBounds();
      }
    }
  }

  /**
   * Should be called to notify that our selfBounds needs to change to this new value.
   */
  invalidateSelf(newSelfBounds) {
    assert && assert(newSelfBounds === undefined || newSelfBounds instanceof Bounds2, 'invalidateSelf\'s newSelfBounds, if provided, needs to be Bounds2');
    const ourSelfBounds = this.selfBoundsProperty._value;

    // If no self bounds are provided, rely on the bounds validation to trigger computation (using updateSelfBounds()).
    if (!newSelfBounds) {
      this._selfBoundsDirty = true;
      this.invalidateBounds();
      this._picker.onSelfBoundsDirty();
    }
    // Otherwise, set the self bounds directly
    else {
      assert && assert(newSelfBounds.isEmpty() || newSelfBounds.isFinite(), 'Bounds must be empty or finite in invalidateSelf');

      // Don't recompute the self bounds
      this._selfBoundsDirty = false;

      // if these bounds are different than current self bounds
      if (!ourSelfBounds.equals(newSelfBounds)) {
        const oldSelfBounds = scratchBounds2.set(ourSelfBounds);

        // set repaint flags
        this.invalidateBounds();
        this._picker.onSelfBoundsDirty();

        // record the new bounds
        ourSelfBounds.set(newSelfBounds);

        // fire the event immediately
        this.selfBoundsProperty.notifyListeners(oldSelfBounds);
      }
    }
    if (assertSlow) {
      this._picker.audit();
    }
  }

  /**
   * Meant to be overridden by Node sub-types to compute self bounds (if invalidateSelf() with no arguments was called).
   *
   * @returns - Whether the self bounds changed.
   */
  updateSelfBounds() {
    // The Node implementation (un-overridden) will never change the self bounds (always NOTHING).
    assert && assert(this.selfBoundsProperty._value.equals(Bounds2.NOTHING));
    return false;
  }

  /**
   * Returns whether a Node is a child of this node.
   *
   * @returns - Whether potentialChild is actually our child.
   */
  hasChild(potentialChild) {
    assert && assert(potentialChild && potentialChild instanceof Node, 'hasChild needs to be called with a Node');
    const isOurChild = _.includes(this._children, potentialChild);
    assert && assert(isOurChild === _.includes(potentialChild._parents, this), 'child-parent reference should match parent-child reference');
    return isOurChild;
  }

  /**
   * Returns a Shape that represents the area covered by containsPointSelf.
   */
  getSelfShape() {
    const selfBounds = this.selfBounds;
    if (selfBounds.isEmpty()) {
      return new Shape();
    } else {
      return Shape.bounds(this.selfBounds);
    }
  }

  /**
   * Returns our selfBounds (the bounds for this Node's content in the local coordinates, excluding anything from our
   * children and descendants).
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getSelfBounds() {
    return this.selfBoundsProperty.value;
  }

  /**
   * See getSelfBounds() for more information
   */
  get selfBounds() {
    return this.getSelfBounds();
  }

  /**
   * Returns a bounding box that should contain all self content in the local coordinate frame (our normal self bounds
   * aren't guaranteed this for Text, etc.)
   *
   * Override this to provide different behavior.
   */
  getSafeSelfBounds() {
    return this.selfBoundsProperty.value;
  }

  /**
   * See getSafeSelfBounds() for more information
   */
  get safeSelfBounds() {
    return this.getSafeSelfBounds();
  }

  /**
   * Returns the bounding box that should contain all content of our children in our local coordinate frame. Does not
   * include our "self" bounds.
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getChildBounds() {
    return this.childBoundsProperty.value;
  }

  /**
   * See getChildBounds() for more information
   */
  get childBounds() {
    return this.getChildBounds();
  }

  /**
   * Returns the bounding box that should contain all content of our children AND our self in our local coordinate
   * frame.
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getLocalBounds() {
    return this.localBoundsProperty.value;
  }

  /**
   * See getLocalBounds() for more information
   */
  get localBounds() {
    return this.getLocalBounds();
  }

  /**
   * See setLocalBounds() for more information
   */
  set localBounds(value) {
    this.setLocalBounds(value);
  }
  get localBoundsOverridden() {
    return this._localBoundsOverridden;
  }

  /**
   * Allows overriding the value of localBounds (and thus changing things like 'bounds' that depend on localBounds).
   * If it's set to a non-null value, that value will always be used for localBounds until this function is called
   * again. To revert to having Scenery compute the localBounds, set this to null.  The bounds should not be reduced
   * smaller than the visible bounds on the screen.
   */
  setLocalBounds(localBounds) {
    assert && assert(localBounds === null || localBounds instanceof Bounds2, 'localBounds override should be set to either null or a Bounds2');
    assert && assert(localBounds === null || !isNaN(localBounds.minX), 'minX for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.minY), 'minY for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.maxX), 'maxX for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.maxY), 'maxY for localBounds should not be NaN');
    const ourLocalBounds = this.localBoundsProperty._value;
    const oldLocalBounds = ourLocalBounds.copy();
    if (localBounds === null) {
      // we can just ignore this if we weren't actually overriding local bounds before
      if (this._localBoundsOverridden) {
        this._localBoundsOverridden = false;
        this.localBoundsProperty.notifyListeners(oldLocalBounds);
        this.invalidateBounds();
      }
    } else {
      // just an instance check for now. consider equals() in the future depending on cost
      const changed = !localBounds.equals(ourLocalBounds) || !this._localBoundsOverridden;
      if (changed) {
        ourLocalBounds.set(localBounds);
      }
      if (!this._localBoundsOverridden) {
        this._localBoundsOverridden = true; // NOTE: has to be done before invalidating bounds, since this disables localBounds computation
      }
      if (changed) {
        this.localBoundsProperty.notifyListeners(oldLocalBounds);
        this.invalidateBounds();
      }
    }
    return this; // allow chaining
  }

  /**
   * Meant to be overridden in sub-types that have more accurate bounds determination for when we are transformed.
   * Usually rotation is significant here, so that transformed bounds for non-rectangular shapes will be different.
   */
  getTransformedSelfBounds(matrix) {
    // assume that we take up the entire rectangular bounds by default
    return this.selfBounds.transformed(matrix);
  }

  /**
   * Meant to be overridden in sub-types that have more accurate bounds determination for when we are transformed.
   * Usually rotation is significant here, so that transformed bounds for non-rectangular shapes will be different.
   *
   * This should include the "full" bounds that guarantee everything rendered should be inside (e.g. Text, where the
   * normal bounds may not be sufficient).
   */
  getTransformedSafeSelfBounds(matrix) {
    return this.safeSelfBounds.transformed(matrix);
  }

  /**
   * Returns the visual "safe" bounds that are taken up by this Node and its subtree. Notably, this is essentially the
   * combined effects of the "visible" bounds (i.e. invisible nodes do not contribute to bounds), and "safe" bounds
   * (e.g. Text, where we need a larger bounds area to guarantee there is nothing outside). It also tries to "fit"
   * transformed bounds more tightly, where it will handle rotated Path bounds in an improved way.
   *
   * NOTE: This method is not optimized, and may create garbage and not be the fastest.
   *
   * @param [matrix] - If provided, will return the bounds assuming the content is transformed with the
   *                             given matrix.
   */
  getSafeTransformedVisibleBounds(matrix) {
    const localMatrix = (matrix || Matrix3.IDENTITY).timesMatrix(this.matrix);
    const bounds = Bounds2.NOTHING.copy();
    if (this.visibleProperty.value) {
      if (!this.selfBounds.isEmpty()) {
        bounds.includeBounds(this.getTransformedSafeSelfBounds(localMatrix));
      }
      if (this._children.length) {
        for (let i = 0; i < this._children.length; i++) {
          bounds.includeBounds(this._children[i].getSafeTransformedVisibleBounds(localMatrix));
        }
      }
    }
    return bounds;
  }

  /**
   * See getSafeTransformedVisibleBounds() for more information -- This is called without any initial parameter
   */
  get safeTransformedVisibleBounds() {
    return this.getSafeTransformedVisibleBounds();
  }

  /**
   * Sets the flag that determines whether we will require more accurate (and expensive) bounds computation for this
   * node's transform.
   *
   * If set to false (default), Scenery will get the bounds of content, and then if rotated will determine the on-axis
   * bounds that completely cover the rotated bounds (potentially larger than actual content).
   * If set to true, Scenery will try to get the bounds of the actual rotated/transformed content.
   *
   * A good example of when this is necessary is if there are a bunch of nested children that each have pi/4 rotations.
   *
   * @param transformBounds - Whether accurate transform bounds should be used.
   */
  setTransformBounds(transformBounds) {
    if (this._transformBounds !== transformBounds) {
      this._transformBounds = transformBounds;
      this.invalidateBounds();
    }
    return this; // allow chaining
  }

  /**
   * See setTransformBounds() for more information
   */
  set transformBounds(value) {
    this.setTransformBounds(value);
  }

  /**
   * See getTransformBounds() for more information
   */
  get transformBounds() {
    return this.getTransformBounds();
  }

  /**
   * Returns whether accurate transformation bounds are used in bounds computation (see setTransformBounds).
   */
  getTransformBounds() {
    return this._transformBounds;
  }

  /**
   * Returns the bounding box of this Node and all of its sub-trees (in the "parent" coordinate frame).
   *
   * NOTE: Do NOT mutate the returned value!
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getBounds() {
    return this.boundsProperty.value;
  }

  /**
   * See getBounds() for more information
   */
  get bounds() {
    return this.getBounds();
  }

  /**
   * Like getLocalBounds() in the "local" coordinate frame, but includes only visible nodes.
   */
  getVisibleLocalBounds() {
    // defensive copy, since we use mutable modifications below
    const bounds = this.selfBounds.copy();
    let i = this._children.length;
    while (i--) {
      bounds.includeBounds(this._children[i].getVisibleBounds());
    }

    // apply clipping to the bounds if we have a clip area (all done in the local coordinate frame)
    const clipArea = this.clipArea;
    if (clipArea) {
      bounds.constrainBounds(clipArea.bounds);
    }
    assert && assert(bounds.isFinite() || bounds.isEmpty(), 'Visible bounds should not be infinite');
    return bounds;
  }

  /**
   * See getVisibleLocalBounds() for more information
   */
  get visibleLocalBounds() {
    return this.getVisibleLocalBounds();
  }

  /**
   * Like getBounds() in the "parent" coordinate frame, but includes only visible nodes
   */
  getVisibleBounds() {
    if (this.isVisible()) {
      return this.getVisibleLocalBounds().transform(this.getMatrix());
    } else {
      return Bounds2.NOTHING;
    }
  }

  /**
   * See getVisibleBounds() for more information
   */
  get visibleBounds() {
    return this.getVisibleBounds();
  }

  /**
   * Tests whether the given point is "contained" in this node's subtree (optionally using mouse/touch areas), and if
   * so returns the Trail (rooted at this node) to the top-most (in stacking order) Node that contains the given
   * point.
   *
   * NOTE: This is optimized for the current input system (rather than what gets visually displayed on the screen), so
   * pickability (Node's pickable property, visibility, and the presence of input listeners) all may affect the
   * returned value.
   *
   * For example, hit-testing a simple shape (with no pickability) will return null:
   * > new phet.scenery.Circle( 20 ).hitTest( phet.dot.v2( 0, 0 ) ); // null
   *
   * If the same shape is made to be pickable, it will return a trail:
   * > new phet.scenery.Circle( 20, { pickable: true } ).hitTest( phet.dot.v2( 0, 0 ) );
   * > // returns a Trail with the circle as the only node.
   *
   * It will return the result that is visually stacked on top, so e.g.:
   * > new phet.scenery.Node( {
   * >   pickable: true,
   * >   children: [
   * >     new phet.scenery.Circle( 20 ),
   * >     new phet.scenery.Circle( 15 )
   * >   ]
   * > } ).hitTest( phet.dot.v2( 0, 0 ) ); // returns the "top-most" circle (the one with radius:15).
   *
   * This is used by Scenery's internal input system by calling hitTest on a Display's rootNode with the
   * global-coordinate point.
   *
   * @param point - The point (in the parent coordinate frame) to check against this node's subtree.
   * @param [isMouse] - Whether mouseAreas should be used.
   * @param [isTouch] - Whether touchAreas should be used.
   * @returns - Returns null if the point is not contained in the subtree.
   */
  hitTest(point, isMouse, isTouch) {
    assert && assert(point.isFinite(), 'The point should be a finite Vector2');
    assert && assert(isMouse === undefined || typeof isMouse === 'boolean', 'If isMouse is provided, it should be a boolean');
    assert && assert(isTouch === undefined || typeof isTouch === 'boolean', 'If isTouch is provided, it should be a boolean');
    return this._picker.hitTest(point, !!isMouse, !!isTouch);
  }

  /**
   * Hit-tests what is under the pointer, and returns a {Trail} to that Node (or null if there is no matching node).
   *
   * See hitTest() for more details about what will be returned.
   */
  trailUnderPointer(pointer) {
    return pointer.point === null ? null : this.hitTest(pointer.point, pointer instanceof Mouse, pointer.isTouchLike());
  }

  /**
   * Returns whether a point (in parent coordinates) is contained in this node's sub-tree.
   *
   * See hitTest() for more details about what will be returned.
   *
   * @returns - Whether the point is contained.
   */
  containsPoint(point) {
    return this.hitTest(point) !== null;
  }

  /**
   * Override this for computation of whether a point is inside our self content (defaults to selfBounds check).
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    // if self bounds are not null default to checking self bounds
    return this.selfBounds.containsPoint(point);
  }

  /**
   * Returns whether this node's selfBounds is intersected by the specified bounds.
   *
   * @param bounds - Bounds to test, assumed to be in the local coordinate frame.
   */
  intersectsBoundsSelf(bounds) {
    // if self bounds are not null, child should override this
    return this.selfBounds.intersectsBounds(bounds);
  }

  /**
   * Determine if the Node is a candidate for phet-io autoselect.
   * 1. Invisible things cannot be autoselected
   * 2. Transform the point in the local coordinate frame, so we can test it with the clipArea/children
   * 3. If our point is outside the local-coordinate clipping area, there should be no hit.
   * 4. Note that non-pickable nodes can still be autoselected
   */
  isPhetioMouseHittable(point) {
    // unpickable things cannot be autoselected unless there are descendants that could be potential mouse hits.
    // It is important to opt out of these subtrees to make sure that they don't falsely "suck up" a mouse hit that
    // would otherwise go to a target behind the unpickable Node.
    if (this.pickable === false && !this.isAnyDescendantAPhetioMouseHitTarget()) {
      return false;
    }
    return this.visible && (this.clipArea === null || this.clipArea.containsPoint(this._transform.getInverse().timesVector2(point)));
  }

  /**
   * If you need to know if any Node in a subtree could possibly be a phetio mouse hit target.
   * SR and MK ran performance on this function in CCK:DC and CAV in 6/2023 and there was no noticeable problem.
   */
  isAnyDescendantAPhetioMouseHitTarget() {
    return this.getPhetioMouseHitTarget() !== 'phetioNotSelectable' || _.some(this.children, child => child.isAnyDescendantAPhetioMouseHitTarget());
  }

  /**
   * Used in Studio Autoselect.  Returns a PhET-iO Element (a PhetioObject) if possible, or null if no hit.
   * "phetioNotSelectable" is an intermediate state used to note when a "hit" has occurred, but the hit was on a Node
   * that didn't have a fit target (see PhetioObject.getPhetioMouseHitTarget())
   * A few notes on the implementation:
   * 1. Prefer the leaf most Node that is at the highest z-index in rendering order
   * 2. Pickable:false Nodes don't prune out subtrees if descendents could still be mouse hit targets
   *    (see PhetioObject.getPhetioMouseHitTarget()).
   * 3. First the algorithm finds a Node that is a "hit", and then it tries to find the most fit "target" for that hit.
   *    a. Itself, see  PhetioObject.getPhetioMouseHitTarget()
   *    b. A class defined substitute, Text.getPhetioMouseHitTarget()
   *    c. A sibling that is rendered behind the hit
   *    d. The most recent descendant that is a usable target.
   *
   * Adapted originally from Picker.recursiveHitTest, with specific tweaks needed for PhET-iO instrumentation, display
   * and filtering.
   * @returns - null if no hit occurred
   *          - A PhetioObject if a hit occurred on a Node with a selectable target
   *          - 'phetioNotSelectable' if a hit occurred, but no suitable target was found from that hit (see
   *             PhetioObject.getPhetioMouseHitTarget())
   */
  getPhetioMouseHit(point) {
    if (!this.isPhetioMouseHittable(point)) {
      return null;
    }

    // Transform the point in the local coordinate frame, so we can test it with the clipArea/children
    const localPoint = this._transform.getInverse().timesVector2(point);

    // If any child was hit but returned 'phetioNotSelectable', then that will trigger the "find the best target" portion
    // of the algorithm, moving on from the "find the hit Node" part.
    let childHitWithoutTarget = null;

    // Check children before our "self", since the children are rendered on top.
    // Manual iteration here so we can return directly, and so we can iterate backwards (last node is rendered in front).
    for (let i = this._children.length - 1; i >= 0; i--) {
      // Not necessarily a child of this Node (see getPhetioMouseHitTarget())
      const childTargetHit = this._children[i].getPhetioMouseHit(localPoint);
      if (childTargetHit instanceof PhetioObject) {
        return childTargetHit;
      } else if (childTargetHit === 'phetioNotSelectable') {
        childHitWithoutTarget = true;
      }
      // No hit, so keep iterating to next child
    }
    if (childHitWithoutTarget) {
      return this.getPhetioMouseHitTarget();
    }

    // Tests for mouse hit areas before testing containsPointSelf. If there is a mouseArea, then don't ever check selfBounds.
    if (this._mouseArea) {
      return this._mouseArea.containsPoint(localPoint) ? this.getPhetioMouseHitTarget() : null;
    }

    // Didn't hit our children, so check ourselves as a last resort. Check our selfBounds first, so we can potentially
    // avoid hit-testing the actual object (which may be more expensive).
    if (this.selfBounds.containsPoint(localPoint) && this.containsPointSelf(localPoint)) {
      return this.getPhetioMouseHitTarget();
    }

    // No hit
    return null;
  }

  /**
   * Whether this Node itself is painted (displays something itself). Meant to be overridden.
   */
  isPainted() {
    // Normal nodes don't render anything
    return false;
  }

  /**
   * Whether this Node's selfBounds are considered to be valid (always containing the displayed self content
   * of this node). Meant to be overridden in subtypes when this can change (e.g. Text).
   *
   * If this value would potentially change, please trigger the event 'selfBoundsValid'.
   */
  areSelfBoundsValid() {
    return true;
  }

  /**
   * Returns whether this Node has any parents at all.
   */
  hasParent() {
    return this._parents.length !== 0;
  }

  /**
   * Returns whether this Node has any children at all.
   */
  hasChildren() {
    return this._children.length > 0;
  }

  /**
   * Returns whether a child should be included for layout (if this Node is a layout container).
   */
  isChildIncludedInLayout(child) {
    return child.bounds.isValid() && (!this._excludeInvisibleChildrenFromBounds || child.visible);
  }

  /**
   * Calls the callback on nodes recursively in a depth-first manner.
   */
  walkDepthFirst(callback) {
    callback(this);
    const length = this._children.length;
    for (let i = 0; i < length; i++) {
      this._children[i].walkDepthFirst(callback);
    }
  }

  /**
   * Adds an input listener.
   *
   * See Input.js documentation for information about how event listeners are used.
   *
   * Additionally, the following fields are supported on a listener:
   *
   * - interrupt {function()}: When a pointer is interrupted, it will attempt to call this method on the input listener
   * - cursor {string|null}: If node.cursor is null, any non-null cursor of an input listener will effectively
   *                         "override" it. NOTE: this can be implemented as an es5 getter, if the cursor can change
   */
  addInputListener(listener) {
    assert && assert(!_.includes(this._inputListeners, listener), 'Input listener already registered on this Node');
    assert && assert(listener !== null, 'Input listener cannot be null');
    assert && assert(listener !== undefined, 'Input listener cannot be undefined');

    // don't allow listeners to be added multiple times
    if (!_.includes(this._inputListeners, listener)) {
      this._inputListeners.push(listener);
      this._picker.onAddInputListener();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * Removes an input listener that was previously added with addInputListener.
   */
  removeInputListener(listener) {
    const index = _.indexOf(this._inputListeners, listener);

    // ensure the listener is in our list (ignore assertion for disposal, see https://github.com/phetsims/sun/issues/394)
    assert && assert(this.isDisposed || index >= 0, 'Could not find input listener to remove');
    if (index >= 0) {
      this._inputListeners.splice(index, 1);
      this._picker.onRemoveInputListener();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * Returns whether this input listener is currently listening to this node.
   *
   * More efficient than checking node.inputListeners, as that includes a defensive copy.
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
   * Interrupts all input listeners that are attached to this node.
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
   * Interrupts all input listeners that are attached to either this node, or a descendant node.
   */
  interruptSubtreeInput() {
    this.interruptInput();
    const children = this._children.slice();
    for (let i = 0; i < children.length; i++) {
      children[i].interruptSubtreeInput();
    }
    return this;
  }

  /**
   * Changes the transform of this Node by adding a transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is centered at (0,0) and scaled by 2:
   * translate( 100, 0 ) would cause the center of the Node (in the parent coordinate frame) to be at (200,0).
   * translate( 100, 0, true ) would cause the center of the Node (in the parent coordinate frame) to be at (100,0).
   *
   * Allowed call signatures:
   * translate( x {number}, y {number} )
   * translate( x {number}, y {number}, prependInstead {boolean} )
   * translate( vector {Vector2} )
   * translate( vector {Vector2}, prependInstead {boolean} )
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @param [prependInstead] - Whether the transform should be prepended (defaults to false)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  translate(x, y, prependInstead) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x === 'number') {
      // translate( x, y, prependInstead )
      assert && assert(isFinite(x), 'x should be a finite number');
      assert && assert(typeof y === 'number' && isFinite(y), 'y should be a finite number');
      if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) {
        return;
      } // bail out if both are zero
      if (prependInstead) {
        this.prependTranslation(x, y);
      } else {
        this.appendMatrix(scratchMatrix3.setToTranslation(x, y));
      }
    } else {
      // translate( vector, prependInstead )
      const vector = x;
      assert && assert(vector.isFinite(), 'translation should be a finite Vector2 if not finite numbers');
      if (!vector.x && !vector.y) {
        return;
      } // bail out if both are zero
      this.translate(vector.x, vector.y, y); // forward to full version
    }
  }

  /**
   * Scales the node's transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is translated to (100,0):
   * scale( 2 ) will leave the Node translated at (100,0), but it will be twice as big around its origin at that location.
   * scale( 2, true ) will shift the Node to (200,0).
   *
   * Allowed call signatures:
   * (s invocation): scale( s {number|Vector2}, [prependInstead] {boolean} )
   * (x,y invocation): scale( x {number}, y {number}, [prependInstead] {boolean} )
   *
   * @param x - (s invocation): {number} scales both dimensions equally, or {Vector2} scales independently
   *          - (x,y invocation): {number} scale for the x-dimension
   * @param [y] - (s invocation): {boolean} prependInstead - Whether the transform should be prepended (defaults to false)
   *            - (x,y invocation): {number} y - scale for the y-dimension
   * @param [prependInstead] - (x,y invocation) Whether the transform should be prepended (defaults to false)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  scale(x, y, prependInstead) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x === 'number') {
      assert && assert(isFinite(x), 'scales should be finite');
      if (y === undefined || typeof y === 'boolean') {
        // scale( scale, [prependInstead] )
        this.scale(x, x, y);
      } else {
        // scale( x, y, [prependInstead] )
        assert && assert(isFinite(y), 'scales should be finite numbers');
        assert && assert(prependInstead === undefined || typeof prependInstead === 'boolean', 'If provided, prependInstead should be boolean');
        if (x === 1 && y === 1) {
          return;
        } // bail out if we are scaling by 1 (identity)
        if (prependInstead) {
          this.prependMatrix(Matrix3.scaling(x, y));
        } else {
          this.appendMatrix(Matrix3.scaling(x, y));
        }
      }
    } else {
      // scale( vector, [prependInstead] )
      const vector = x;
      assert && assert(vector.isFinite(), 'scale should be a finite Vector2 if not a finite number');
      this.scale(vector.x, vector.y, y); // forward to full version
    }
  }

  /**
   * Rotates the node's transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is translated to (100,0):
   * rotate( Math.PI ) will rotate the Node around (100,0)
   * rotate( Math.PI, true ) will rotate the Node around the origin, moving it to (-100,0)
   *
   * @param angle - The angle (in radians) to rotate by
   * @param [prependInstead] - Whether the transform should be prepended (defaults to false)
   */
  rotate(angle, prependInstead) {
    assert && assert(isFinite(angle), 'angle should be a finite number');
    assert && assert(prependInstead === undefined || typeof prependInstead === 'boolean');
    if (angle % (2 * Math.PI) === 0) {
      return;
    } // bail out if our angle is effectively 0
    if (prependInstead) {
      this.prependMatrix(Matrix3.rotation2(angle));
    } else {
      this.appendMatrix(Matrix3.rotation2(angle));
    }
  }

  /**
   * Rotates the node's transform around a specific point (in the parent coordinate frame) by prepending the transform.
   *
   * TODO: determine whether this should use the appendMatrix method https://github.com/phetsims/scenery/issues/1581
   *
   * @param point - In the parent coordinate frame
   * @param angle - In radians
   */
  rotateAround(point, angle) {
    assert && assert(point.isFinite(), 'point should be a finite Vector2');
    assert && assert(isFinite(angle), 'angle should be a finite number');
    let matrix = Matrix3.translation(-point.x, -point.y);
    matrix = Matrix3.rotation2(angle).timesMatrix(matrix);
    matrix = Matrix3.translation(point.x, point.y).timesMatrix(matrix);
    this.prependMatrix(matrix);
    return this;
  }

  /**
   * Shifts the x coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  setX(x) {
    assert && assert(isFinite(x), 'x should be a finite number');
    this.translate(x - this.getX(), 0, true);
    return this;
  }

  /**
   * See setX() for more information
   */
  set x(value) {
    this.setX(value);
  }

  /**
   * See getX() for more information
   */
  get x() {
    return this.getX();
  }

  /**
   * Returns the x coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  getX() {
    return this._transform.getMatrix().m02();
  }

  /**
   * Shifts the y coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  setY(y) {
    assert && assert(isFinite(y), 'y should be a finite number');
    this.translate(0, y - this.getY(), true);
    return this;
  }

  /**
   * See setY() for more information
   */
  set y(value) {
    this.setY(value);
  }

  /**
   * See getY() for more information
   */
  get y() {
    return this.getY();
  }

  /**
   * Returns the y coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  getY() {
    return this._transform.getMatrix().m12();
  }

  /**
   * Typically without rotations or negative parameters, this sets the scale for each axis. In its more general form,
   * it modifies the node's transform so that:
   * - Transforming (1,0) with our transform will result in a vector with magnitude abs( x-scale-magnitude )
   * - Transforming (0,1) with our transform will result in a vector with magnitude abs( y-scale-magnitude )
   * - If parameters are negative, it will flip orientation in that direct.
   *
   * Allowed call signatures:
   * setScaleMagnitude( s )
   * setScaleMagnitude( sx, sy )
   * setScaleMagnitude( vector )
   *
   * @param a - Scale for both axes, or scale for x-axis if using the 2-parameter call
   * @param [b] - Scale for the Y axis (only for the 2-parameter call)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setScaleMagnitude(a, b) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    const currentScale = this.getScaleVector();
    if (typeof a === 'number') {
      if (b === undefined) {
        // to map setScaleMagnitude( scale ) => setScaleMagnitude( scale, scale )
        b = a;
      }
      assert && assert(isFinite(a), 'setScaleMagnitude parameters should be finite numbers');
      assert && assert(isFinite(b), 'setScaleMagnitude parameters should be finite numbers');
      // setScaleMagnitude( x, y )
      this.appendMatrix(Matrix3.scaling(a / currentScale.x, b / currentScale.y));
    } else {
      // setScaleMagnitude( vector ), where we set the x-scale to vector.x and y-scale to vector.y
      assert && assert(a.isFinite(), 'first parameter should be a finite Vector2');
      this.appendMatrix(Matrix3.scaling(a.x / currentScale.x, a.y / currentScale.y));
    }
    return this;
  }

  /**
   * Returns a vector with an entry for each axis, e.g. (5,2) for an affine matrix with rows ((5,0,0),(0,2,0),(0,0,1)).
   *
   * It is equivalent to:
   * ( T(1,0).magnitude(), T(0,1).magnitude() ) where T() transforms points with our transform.
   */
  getScaleVector() {
    return this._transform.getMatrix().getScaleVector();
  }

  /**
   * Rotates this node's transform so that a unit (1,0) vector would be rotated by this node's transform by the
   * specified amount.
   *
   * @param rotation - In radians
   */
  setRotation(rotation) {
    assert && assert(isFinite(rotation), 'rotation should be a finite number');
    this.appendMatrix(scratchMatrix3.setToRotationZ(rotation - this.getRotation()));
    return this;
  }

  /**
   * See setRotation() for more information
   */
  set rotation(value) {
    this.setRotation(value);
  }

  /**
   * See getRotation() for more information
   */
  get rotation() {
    return this.getRotation();
  }

  /**
   * Returns the rotation (in radians) that would be applied to a unit (1,0) vector when transformed with this Node's
   * transform.
   */
  getRotation() {
    return this._transform.getMatrix().getRotation();
  }

  /**
   * Modifies the translation of this Node's transform so that the node's local-coordinate origin will be transformed
   * to the passed-in x/y.
   *
   * Allowed call signatures:
   * setTranslation( x, y )
   * setTranslation( vector )
   *
   * @param a - X translation - or Vector with x/y translation in components
   * @param [b] - Y translation
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setTranslation(a, b) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    const m = this._transform.getMatrix();
    const tx = m.m02();
    const ty = m.m12();
    let dx;
    let dy;
    if (typeof a === 'number') {
      assert && assert(isFinite(a), 'Parameters to setTranslation should be finite numbers');
      assert && assert(b !== undefined && isFinite(b), 'Parameters to setTranslation should be finite numbers');
      dx = a - tx;
      dy = b - ty;
    } else {
      assert && assert(a.isFinite(), 'Should be a finite Vector2');
      dx = a.x - tx;
      dy = a.y - ty;
    }
    this.translate(dx, dy, true);
    return this;
  }

  /**
   * See setTranslation() for more information - this should only be used with Vector2
   */
  set translation(value) {
    this.setTranslation(value);
  }

  /**
   * See getTranslation() for more information
   */
  get translation() {
    return this.getTranslation();
  }

  /**
   * Returns a vector of where this Node's local-coordinate origin will be transformed by it's own transform.
   */
  getTranslation() {
    const matrix = this._transform.getMatrix();
    return new Vector2(matrix.m02(), matrix.m12());
  }

  /**
   * Appends a transformation matrix to this Node's transform. Appending means this transform is conceptually applied
   * first before the rest of the Node's current transform (i.e. applied in the local coordinate frame).
   */
  appendMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.append(matrix);
  }

  /**
   * Prepends a transformation matrix to this Node's transform. Prepending means this transform is conceptually applied
   * after the rest of the Node's current transform (i.e. applied in the parent coordinate frame).
   */
  prependMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.prepend(matrix);
  }

  /**
   * Prepends an (x,y) translation to our Node's transform in an efficient manner without allocating a matrix.
   * see https://github.com/phetsims/scenery/issues/119
   */
  prependTranslation(x, y) {
    assert && assert(isFinite(x), 'x should be a finite number');
    assert && assert(isFinite(y), 'y should be a finite number');
    if (!x && !y) {
      return;
    } // bail out if both are zero

    this._transform.prependTranslation(x, y);
  }

  /**
   * Changes this Node's transform to match the passed-in transformation matrix.
   */
  setMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.setMatrix(matrix);
  }

  /**
   * See setMatrix() for more information
   */
  set matrix(value) {
    this.setMatrix(value);
  }

  /**
   * See getMatrix() for more information
   */
  get matrix() {
    return this.getMatrix();
  }

  /**
   * Returns a Matrix3 representing our Node's transform.
   *
   * NOTE: Do not mutate the returned matrix.
   */
  getMatrix() {
    return this._transform.getMatrix();
  }

  /**
   * Returns a reference to our Node's transform
   */
  getTransform() {
    // for now, return an actual copy. we can consider listening to changes in the future
    return this._transform;
  }

  /**
   * See getTransform() for more information
   */
  get transform() {
    return this.getTransform();
  }

  /**
   * Resets our Node's transform to an identity transform (i.e. no transform is applied).
   */
  resetTransform() {
    this.setMatrix(Matrix3.IDENTITY);
  }

  /**
   * Callback function that should be called when our transform is changed.
   */
  onTransformChange() {
    // TODO: why is local bounds invalidation needed here? https://github.com/phetsims/scenery/issues/1581
    this.invalidateBounds();
    this._picker.onTransformChange();
    if (assertSlow) {
      this._picker.audit();
    }
    this.transformEmitter.emit();
  }

  /**
   * Called when our summary bitmask changes (scenery-internal)
   */
  onSummaryChange(oldBitmask, newBitmask) {
    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onSummaryChange(oldBitmask, newBitmask);
  }

  /**
   * Updates our node's scale and applied scale factor if we need to change our scale to fit within the maximum
   * dimensions (maxWidth and maxHeight). See documentation in constructor for detailed behavior.
   */
  updateMaxDimension(localBounds) {
    assert && this.auditMaxDimensions();
    const currentScale = this._appliedScaleFactor;
    let idealScale = 1;
    if (this._maxWidth !== null) {
      const width = localBounds.width;
      if (width > this._maxWidth) {
        idealScale = Math.min(idealScale, this._maxWidth / width);
      }
    }
    if (this._maxHeight !== null) {
      const height = localBounds.height;
      if (height > this._maxHeight) {
        idealScale = Math.min(idealScale, this._maxHeight / height);
      }
    }
    const scaleAdjustment = idealScale / currentScale;
    if (scaleAdjustment !== 1) {
      // Set this first, for supporting re-entrancy if our content changes based on the scale
      this._appliedScaleFactor = idealScale;
      this.scale(scaleAdjustment);
    }
  }

  /**
   * Scenery-internal method for verifying maximum dimensions are NOT smaller than preferred dimensions
   * NOTE: This has to be public due to mixins not able to access protected/private methods
   */
  auditMaxDimensions() {
    assert && assert(this._maxWidth === null || !isWidthSizable(this) || this.preferredWidth === null || this._maxWidth >= this.preferredWidth - 1e-7, 'If maxWidth and preferredWidth are both non-null, maxWidth should NOT be smaller than the preferredWidth. If that happens, it would trigger an infinite loop');
    assert && assert(this._maxHeight === null || !isHeightSizable(this) || this.preferredHeight === null || this._maxHeight >= this.preferredHeight - 1e-7, 'If maxHeight and preferredHeight are both non-null, maxHeight should NOT be smaller than the preferredHeight. If that happens, it would trigger an infinite loop');
  }

  /**
   * Increments/decrements bounds "listener" count based on the values of maxWidth/maxHeight before and after.
   * null is like no listener, non-null is like having a listener, so we increment for null => non-null, and
   * decrement for non-null => null.
   */
  onMaxDimensionChange(beforeMaxLength, afterMaxLength) {
    if (beforeMaxLength === null && afterMaxLength !== null) {
      this.changeBoundsEventCount(1);
      this._boundsEventSelfCount++;
    } else if (beforeMaxLength !== null && afterMaxLength === null) {
      this.changeBoundsEventCount(-1);
      this._boundsEventSelfCount--;
    }
  }

  /**
   * Sets the maximum width of the Node (see constructor for documentation on how maximum dimensions work).
   */
  setMaxWidth(maxWidth) {
    assert && assert(maxWidth === null || typeof maxWidth === 'number' && maxWidth > 0, 'maxWidth should be null (no constraint) or a positive number');
    if (this._maxWidth !== maxWidth) {
      // update synthetic bounds listener count (to ensure our bounds are validated at the start of updateDisplay)
      this.onMaxDimensionChange(this._maxWidth, maxWidth);
      this._maxWidth = maxWidth;
      this.updateMaxDimension(this.localBoundsProperty.value);
    }
  }

  /**
   * See setMaxWidth() for more information
   */
  set maxWidth(value) {
    this.setMaxWidth(value);
  }

  /**
   * See getMaxWidth() for more information
   */
  get maxWidth() {
    return this.getMaxWidth();
  }

  /**
   * Returns the maximum width (if any) of the Node.
   */
  getMaxWidth() {
    return this._maxWidth;
  }

  /**
   * Sets the maximum height of the Node (see constructor for documentation on how maximum dimensions work).
   */
  setMaxHeight(maxHeight) {
    assert && assert(maxHeight === null || typeof maxHeight === 'number' && maxHeight > 0, 'maxHeight should be null (no constraint) or a positive number');
    if (this._maxHeight !== maxHeight) {
      // update synthetic bounds listener count (to ensure our bounds are validated at the start of updateDisplay)
      this.onMaxDimensionChange(this._maxHeight, maxHeight);
      this._maxHeight = maxHeight;
      this.updateMaxDimension(this.localBoundsProperty.value);
    }
  }

  /**
   * See setMaxHeight() for more information
   */
  set maxHeight(value) {
    this.setMaxHeight(value);
  }

  /**
   * See getMaxHeight() for more information
   */
  get maxHeight() {
    return this.getMaxHeight();
  }

  /**
   * Returns the maximum height (if any) of the Node.
   */
  getMaxHeight() {
    return this._maxHeight;
  }

  /**
   * Shifts this Node horizontally so that its left bound (in the parent coordinate frame) is equal to the passed-in
   * 'left' X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param left - After this operation, node.left should approximately equal this value.
   */
  setLeft(left) {
    const currentLeft = this.getLeft();
    if (isFinite(currentLeft)) {
      this.translate(left - currentLeft, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setLeft() for more information
   */
  set left(value) {
    this.setLeft(value);
  }

  /**
   * See getLeft() for more information
   */
  get left() {
    return this.getLeft();
  }

  /**
   * Returns the X value of the left side of the bounding box of this Node (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLeft() {
    return this.getBounds().minX;
  }

  /**
   * Shifts this Node horizontally so that its right bound (in the parent coordinate frame) is equal to the passed-in
   * 'right' X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param right - After this operation, node.right should approximately equal this value.
   */
  setRight(right) {
    const currentRight = this.getRight();
    if (isFinite(currentRight)) {
      this.translate(right - currentRight, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setRight() for more information
   */
  set right(value) {
    this.setRight(value);
  }

  /**
   * See getRight() for more information
   */
  get right() {
    return this.getRight();
  }

  /**
   * Returns the X value of the right side of the bounding box of this Node (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getRight() {
    return this.getBounds().maxX;
  }

  /**
   * Shifts this Node horizontally so that its horizontal center (in the parent coordinate frame) is equal to the
   * passed-in center X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param x - After this operation, node.centerX should approximately equal this value.
   */
  setCenterX(x) {
    const currentCenterX = this.getCenterX();
    if (isFinite(currentCenterX)) {
      this.translate(x - currentCenterX, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setCenterX() for more information
   */
  set centerX(value) {
    this.setCenterX(value);
  }

  /**
   * See getCenterX() for more information
   */
  get centerX() {
    return this.getCenterX();
  }

  /**
   * Returns the X value of this node's horizontal center (in the parent coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getCenterX() {
    return this.getBounds().getCenterX();
  }

  /**
   * Shifts this Node vertically so that its vertical center (in the parent coordinate frame) is equal to the
   * passed-in center Y value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param y - After this operation, node.centerY should approximately equal this value.
   */
  setCenterY(y) {
    const currentCenterY = this.getCenterY();
    if (isFinite(currentCenterY)) {
      this.translate(0, y - currentCenterY, true);
    }
    return this; // allow chaining
  }

  /**
   * See setCenterY() for more information
   */
  set centerY(value) {
    this.setCenterY(value);
  }

  /**
   * See getCenterX() for more information
   */
  get centerY() {
    return this.getCenterY();
  }

  /**
   * Returns the Y value of this node's vertical center (in the parent coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getCenterY() {
    return this.getBounds().getCenterY();
  }

  /**
   * Shifts this Node vertically so that its top (in the parent coordinate frame) is equal to the passed-in Y value.
   *
   * NOTE: top is the lowest Y value in our bounds.
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param top - After this operation, node.top should approximately equal this value.
   */
  setTop(top) {
    const currentTop = this.getTop();
    if (isFinite(currentTop)) {
      this.translate(0, top - currentTop, true);
    }
    return this; // allow chaining
  }

  /**
   * See setTop() for more information
   */
  set top(value) {
    this.setTop(value);
  }

  /**
   * See getTop() for more information
   */
  get top() {
    return this.getTop();
  }

  /**
   * Returns the lowest Y value of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getTop() {
    return this.getBounds().minY;
  }

  /**
   * Shifts this Node vertically so that its bottom (in the parent coordinate frame) is equal to the passed-in Y value.
   *
   * NOTE: bottom is the highest Y value in our bounds.
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param bottom - After this operation, node.bottom should approximately equal this value.
   */
  setBottom(bottom) {
    const currentBottom = this.getBottom();
    if (isFinite(currentBottom)) {
      this.translate(0, bottom - currentBottom, true);
    }
    return this; // allow chaining
  }

  /**
   * See setBottom() for more information
   */
  set bottom(value) {
    this.setBottom(value);
  }

  /**
   * See getBottom() for more information
   */
  get bottom() {
    return this.getBottom();
  }

  /**
   * Returns the highest Y value of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getBottom() {
    return this.getBounds().maxY;
  }

  /*
   * Convenience locations
   *
   * Upper is in terms of the visual layout in Scenery and other programs, so the minY is the "upper", and minY is the "lower"
   *
   *             left (x)     centerX        right
   *          ---------------------------------------
   * top  (y) | leftTop     centerTop     rightTop
   * centerY  | leftCenter  center        rightCenter
   * bottom   | leftBottom  centerBottom  rightBottom
   *
   * NOTE: This requires computation of this node's subtree bounds, which may incur some performance loss.
   */

  /**
   * Sets the position of the upper-left corner of this node's bounds to the specified point.
   */
  setLeftTop(leftTop) {
    assert && assert(leftTop.isFinite(), 'leftTop should be a finite Vector2');
    const currentLeftTop = this.getLeftTop();
    if (currentLeftTop.isFinite()) {
      this.translate(leftTop.minus(currentLeftTop), true);
    }
    return this;
  }

  /**
   * See setLeftTop() for more information
   */
  set leftTop(value) {
    this.setLeftTop(value);
  }

  /**
   * See getLeftTop() for more information
   */
  get leftTop() {
    return this.getLeftTop();
  }

  /**
   * Returns the upper-left corner of this node's bounds.
   */
  getLeftTop() {
    return this.getBounds().getLeftTop();
  }

  /**
   * Sets the position of the center-top location of this node's bounds to the specified point.
   */
  setCenterTop(centerTop) {
    assert && assert(centerTop.isFinite(), 'centerTop should be a finite Vector2');
    const currentCenterTop = this.getCenterTop();
    if (currentCenterTop.isFinite()) {
      this.translate(centerTop.minus(currentCenterTop), true);
    }
    return this;
  }

  /**
   * See setCenterTop() for more information
   */
  set centerTop(value) {
    this.setCenterTop(value);
  }

  /**
   * See getCenterTop() for more information
   */
  get centerTop() {
    return this.getCenterTop();
  }

  /**
   * Returns the center-top location of this node's bounds.
   */
  getCenterTop() {
    return this.getBounds().getCenterTop();
  }

  /**
   * Sets the position of the upper-right corner of this node's bounds to the specified point.
   */
  setRightTop(rightTop) {
    assert && assert(rightTop.isFinite(), 'rightTop should be a finite Vector2');
    const currentRightTop = this.getRightTop();
    if (currentRightTop.isFinite()) {
      this.translate(rightTop.minus(currentRightTop), true);
    }
    return this;
  }

  /**
   * See setRightTop() for more information
   */
  set rightTop(value) {
    this.setRightTop(value);
  }

  /**
   * See getRightTop() for more information
   */
  get rightTop() {
    return this.getRightTop();
  }

  /**
   * Returns the upper-right corner of this node's bounds.
   */
  getRightTop() {
    return this.getBounds().getRightTop();
  }

  /**
   * Sets the position of the center-left of this node's bounds to the specified point.
   */
  setLeftCenter(leftCenter) {
    assert && assert(leftCenter.isFinite(), 'leftCenter should be a finite Vector2');
    const currentLeftCenter = this.getLeftCenter();
    if (currentLeftCenter.isFinite()) {
      this.translate(leftCenter.minus(currentLeftCenter), true);
    }
    return this;
  }

  /**
   * See setLeftCenter() for more information
   */
  set leftCenter(value) {
    this.setLeftCenter(value);
  }

  /**
   * See getLeftCenter() for more information
   */
  get leftCenter() {
    return this.getLeftCenter();
  }

  /**
   * Returns the center-left corner of this node's bounds.
   */
  getLeftCenter() {
    return this.getBounds().getLeftCenter();
  }

  /**
   * Sets the center of this node's bounds to the specified point.
   */
  setCenter(center) {
    assert && assert(center.isFinite(), 'center should be a finite Vector2');
    const currentCenter = this.getCenter();
    if (currentCenter.isFinite()) {
      this.translate(center.minus(currentCenter), true);
    }
    return this;
  }

  /**
   * See setCenter() for more information
   */
  set center(value) {
    this.setCenter(value);
  }

  /**
   * See getCenter() for more information
   */
  get center() {
    return this.getCenter();
  }

  /**
   * Returns the center of this node's bounds.
   */
  getCenter() {
    return this.getBounds().getCenter();
  }

  /**
   * Sets the position of the center-right of this node's bounds to the specified point.
   */
  setRightCenter(rightCenter) {
    assert && assert(rightCenter.isFinite(), 'rightCenter should be a finite Vector2');
    const currentRightCenter = this.getRightCenter();
    if (currentRightCenter.isFinite()) {
      this.translate(rightCenter.minus(currentRightCenter), true);
    }
    return this;
  }

  /**
   * See setRightCenter() for more information
   */
  set rightCenter(value) {
    this.setRightCenter(value);
  }

  /**
   * See getRightCenter() for more information
   */
  get rightCenter() {
    return this.getRightCenter();
  }

  /**
   * Returns the center-right of this node's bounds.
   */
  getRightCenter() {
    return this.getBounds().getRightCenter();
  }

  /**
   * Sets the position of the lower-left corner of this node's bounds to the specified point.
   */
  setLeftBottom(leftBottom) {
    assert && assert(leftBottom.isFinite(), 'leftBottom should be a finite Vector2');
    const currentLeftBottom = this.getLeftBottom();
    if (currentLeftBottom.isFinite()) {
      this.translate(leftBottom.minus(currentLeftBottom), true);
    }
    return this;
  }

  /**
   * See setLeftBottom() for more information
   */
  set leftBottom(value) {
    this.setLeftBottom(value);
  }

  /**
   * See getLeftBottom() for more information
   */
  get leftBottom() {
    return this.getLeftBottom();
  }

  /**
   * Returns the lower-left corner of this node's bounds.
   */
  getLeftBottom() {
    return this.getBounds().getLeftBottom();
  }

  /**
   * Sets the position of the center-bottom of this node's bounds to the specified point.
   */
  setCenterBottom(centerBottom) {
    assert && assert(centerBottom.isFinite(), 'centerBottom should be a finite Vector2');
    const currentCenterBottom = this.getCenterBottom();
    if (currentCenterBottom.isFinite()) {
      this.translate(centerBottom.minus(currentCenterBottom), true);
    }
    return this;
  }

  /**
   * See setCenterBottom() for more information
   */
  set centerBottom(value) {
    this.setCenterBottom(value);
  }

  /**
   * See getCenterBottom() for more information
   */
  get centerBottom() {
    return this.getCenterBottom();
  }

  /**
   * Returns the center-bottom of this node's bounds.
   */
  getCenterBottom() {
    return this.getBounds().getCenterBottom();
  }

  /**
   * Sets the position of the lower-right corner of this node's bounds to the specified point.
   */
  setRightBottom(rightBottom) {
    assert && assert(rightBottom.isFinite(), 'rightBottom should be a finite Vector2');
    const currentRightBottom = this.getRightBottom();
    if (currentRightBottom.isFinite()) {
      this.translate(rightBottom.minus(currentRightBottom), true);
    }
    return this;
  }

  /**
   * See setRightBottom() for more information
   */
  set rightBottom(value) {
    this.setRightBottom(value);
  }

  /**
   * See getRightBottom() for more information
   */
  get rightBottom() {
    return this.getRightBottom();
  }

  /**
   * Returns the lower-right corner of this node's bounds.
   */
  getRightBottom() {
    return this.getBounds().getRightBottom();
  }

  /**
   * Returns the width of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getWidth() {
    return this.getBounds().getWidth();
  }

  /**
   * See getWidth() for more information
   */
  get width() {
    return this.getWidth();
  }

  /**
   * Returns the height of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getHeight() {
    return this.getBounds().getHeight();
  }

  /**
   * See getHeight() for more information
   */
  get height() {
    return this.getHeight();
  }

  /**
   * Returns the width of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalWidth() {
    return this.getLocalBounds().getWidth();
  }

  /**
   * See getLocalWidth() for more information
   */
  get localWidth() {
    return this.getLocalWidth();
  }

  /**
   * Returns the height of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalHeight() {
    return this.getLocalBounds().getHeight();
  }

  /**
   * See getLocalHeight() for more information
   */
  get localHeight() {
    return this.getLocalHeight();
  }

  /**
   * Returns the X value of the left side of the bounding box of this Node (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalLeft() {
    return this.getLocalBounds().minX;
  }

  /**
   * See getLeft() for more information
   */
  get localLeft() {
    return this.getLocalLeft();
  }

  /**
   * Returns the X value of the right side of the bounding box of this Node (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalRight() {
    return this.getLocalBounds().maxX;
  }

  /**
   * See getRight() for more information
   */
  get localRight() {
    return this.getLocalRight();
  }

  /**
   * Returns the X value of this node's horizontal center (in the local coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalCenterX() {
    return this.getLocalBounds().getCenterX();
  }

  /**
   * See getCenterX() for more information
   */
  get localCenterX() {
    return this.getLocalCenterX();
  }

  /**
   * Returns the Y value of this node's vertical center (in the local coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalCenterY() {
    return this.getLocalBounds().getCenterY();
  }

  /**
   * See getCenterX() for more information
   */
  get localCenterY() {
    return this.getLocalCenterY();
  }

  /**
   * Returns the lowest Y value of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalTop() {
    return this.getLocalBounds().minY;
  }

  /**
   * See getTop() for more information
   */
  get localTop() {
    return this.getLocalTop();
  }

  /**
   * Returns the highest Y value of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalBottom() {
    return this.getLocalBounds().maxY;
  }

  /**
   * See getLocalBottom() for more information
   */
  get localBottom() {
    return this.getLocalBottom();
  }

  /**
   * Returns the upper-left corner of this node's localBounds.
   */
  getLocalLeftTop() {
    return this.getLocalBounds().getLeftTop();
  }

  /**
   * See getLocalLeftTop() for more information
   */
  get localLeftTop() {
    return this.getLocalLeftTop();
  }

  /**
   * Returns the center-top location of this node's localBounds.
   */
  getLocalCenterTop() {
    return this.getLocalBounds().getCenterTop();
  }

  /**
   * See getLocalCenterTop() for more information
   */
  get localCenterTop() {
    return this.getLocalCenterTop();
  }

  /**
   * Returns the upper-right corner of this node's localBounds.
   */
  getLocalRightTop() {
    return this.getLocalBounds().getRightTop();
  }

  /**
   * See getLocalRightTop() for more information
   */
  get localRightTop() {
    return this.getLocalRightTop();
  }

  /**
   * Returns the center-left corner of this node's localBounds.
   */
  getLocalLeftCenter() {
    return this.getLocalBounds().getLeftCenter();
  }

  /**
   * See getLocalLeftCenter() for more information
   */
  get localLeftCenter() {
    return this.getLocalLeftCenter();
  }

  /**
   * Returns the center of this node's localBounds.
   */
  getLocalCenter() {
    return this.getLocalBounds().getCenter();
  }

  /**
   * See getLocalCenter() for more information
   */
  get localCenter() {
    return this.getLocalCenter();
  }

  /**
   * Returns the center-right of this node's localBounds.
   */
  getLocalRightCenter() {
    return this.getLocalBounds().getRightCenter();
  }

  /**
   * See getLocalRightCenter() for more information
   */
  get localRightCenter() {
    return this.getLocalRightCenter();
  }

  /**
   * Returns the lower-left corner of this node's localBounds.
   */
  getLocalLeftBottom() {
    return this.getLocalBounds().getLeftBottom();
  }

  /**
   * See getLocalLeftBottom() for more information
   */
  get localLeftBottom() {
    return this.getLocalLeftBottom();
  }

  /**
   * Returns the center-bottom of this node's localBounds.
   */
  getLocalCenterBottom() {
    return this.getLocalBounds().getCenterBottom();
  }

  /**
   * See getLocalCenterBottom() for more information
   */
  get localCenterBottom() {
    return this.getLocalCenterBottom();
  }

  /**
   * Returns the lower-right corner of this node's localBounds.
   */
  getLocalRightBottom() {
    return this.getLocalBounds().getRightBottom();
  }

  /**
   * See getLocalRightBottom() for more information
   */
  get localRightBottom() {
    return this.getLocalRightBottom();
  }

  /**
   * Returns the unique integral ID for this node.
   */
  getId() {
    return this._id;
  }

  /**
   * See getId() for more information
   */
  get id() {
    return this.getId();
  }

  /**
   * Called when our visibility Property changes values.
   */
  onVisiblePropertyChange(visible) {
    // changing visibility can affect pickability pruning, which affects mouse/touch bounds
    this._picker.onVisibilityChange();
    if (assertSlow) {
      this._picker.audit();
    }

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onVisibilityChange(visible);
    for (let i = 0; i < this._parents.length; i++) {
      const parent = this._parents[i];
      if (parent._excludeInvisibleChildrenFromBounds) {
        parent.invalidateChildBounds();
      }
    }
  }

  /**
   * Sets what Property our visibleProperty is backed by, so that changes to this provided Property will change this
   * Node's visibility, and vice versa. This does not change this._visibleProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented visibleProperty (if one is not passed in as
   * an option). Once a Node's visibleProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented visibleProperty to this node, pass phetioVisiblePropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setVisibleProperty(newTarget) {
    return this._visibleProperty.setTargetProperty(newTarget, this, VISIBLE_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setVisibleProperty() for more information
   */
  set visibleProperty(property) {
    this.setVisibleProperty(property);
  }

  /**
   * See getVisibleProperty() for more information
   */
  get visibleProperty() {
    return this.getVisibleProperty();
  }

  /**
   * Get this Node's visibleProperty. Note! This is not the reciprocal of setVisibleProperty. Node.prototype._visibleProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the visibleProperty provided by
   * setVisibleProperty(), but the underlying reference does not change. This means the following:
   *     * const myNode = new Node();
   * const visibleProperty = new Property( false );
   * myNode.setVisibleProperty( visibleProperty )
   * => myNode.getVisibleProperty() !== visibleProperty (!!!!!!)
   *
   * Please use this with caution. See setVisibleProperty() for more information.
   */
  getVisibleProperty() {
    return this._visibleProperty;
  }

  /**
   * Sets whether this Node is visible.  DO NOT override this as a way of adding additional behavior when a Node's
   * visibility changes, add a listener to this.visibleProperty instead.
   */
  setVisible(visible) {
    this.visibleProperty.set(visible);
    return this;
  }

  /**
   * See setVisible() for more information
   */
  set visible(value) {
    this.setVisible(value);
  }

  /**
   * See isVisible() for more information
   */
  get visible() {
    return this.isVisible();
  }

  /**
   * Returns whether this Node is visible.
   */
  isVisible() {
    return this.visibleProperty.value;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented visibleProperty internal to Node.
   */
  setPhetioVisiblePropertyInstrumented(phetioVisiblePropertyInstrumented) {
    return this._visibleProperty.setTargetPropertyInstrumented(phetioVisiblePropertyInstrumented, this);
  }

  /**
   * See setPhetioVisiblePropertyInstrumented() for more information
   */
  set phetioVisiblePropertyInstrumented(value) {
    this.setPhetioVisiblePropertyInstrumented(value);
  }

  /**
   * See getPhetioVisiblePropertyInstrumented() for more information
   */
  get phetioVisiblePropertyInstrumented() {
    return this.getPhetioVisiblePropertyInstrumented();
  }
  getPhetioVisiblePropertyInstrumented() {
    return this._visibleProperty.getTargetPropertyInstrumented();
  }

  /**
   * Swap the visibility of this node with another node. The Node that is made visible will receive keyboard focus
   * if it is focusable and the previously visible Node had focus.
   */
  swapVisibility(otherNode) {
    assert && assert(this.visible !== otherNode.visible);
    const visibleNode = this.visible ? this : otherNode;
    const invisibleNode = this.visible ? otherNode : this;

    // if the visible node has focus we will restore focus on the invisible Node once it is visible
    const visibleNodeFocused = visibleNode.focused;
    visibleNode.visible = false;
    invisibleNode.visible = true;
    if (visibleNodeFocused && invisibleNode.focusable) {
      invisibleNode.focus();
    }
    return this; // allow chaining
  }

  /**
   * Sets the opacity of this Node (and its sub-tree), where 0 is fully transparent, and 1 is fully opaque.  Values
   * outside of that range throw an Error.
   * @throws Error if opacity out of range
   */
  setOpacity(opacity) {
    assert && assert(isFinite(opacity), 'opacity should be a finite number');
    if (opacity < 0 || opacity > 1) {
      throw new Error(`opacity out of range: ${opacity}`);
    }
    this.opacityProperty.value = opacity;
  }

  /**
   * See setOpacity() for more information
   */
  set opacity(value) {
    this.setOpacity(value);
  }

  /**
   * See getOpacity() for more information
   */
  get opacity() {
    return this.getOpacity();
  }

  /**
   * Returns the opacity of this node.
   */
  getOpacity() {
    return this.opacityProperty.value;
  }

  /**
   * Sets the disabledOpacity of this Node (and its sub-tree), where 0 is fully transparent, and 1 is fully opaque.
   * Values outside of that range throw an Error.
   * @throws Error if disabledOpacity out of range
   */
  setDisabledOpacity(disabledOpacity) {
    assert && assert(isFinite(disabledOpacity), 'disabledOpacity should be a finite number');
    if (disabledOpacity < 0 || disabledOpacity > 1) {
      throw new Error(`disabledOpacity out of range: ${disabledOpacity}`);
    }
    this.disabledOpacityProperty.value = disabledOpacity;
    return this;
  }

  /**
   * See setDisabledOpacity() for more information
   */
  set disabledOpacity(value) {
    this.setDisabledOpacity(value);
  }

  /**
   * See getDisabledOpacity() for more information
   */
  get disabledOpacity() {
    return this.getDisabledOpacity();
  }

  /**
   * Returns the disabledOpacity of this node.
   */
  getDisabledOpacity() {
    return this.disabledOpacityProperty.value;
  }

  /**
   * Returns the opacity actually applied to the node.
   */
  getEffectiveOpacity() {
    return this.opacityProperty.value * (this.enabledProperty.value ? 1 : this.disabledOpacityProperty.value);
  }

  /**
   * See getDisabledOpacity() for more information
   */
  get effectiveOpacity() {
    return this.getEffectiveOpacity();
  }

  /**
   * Called when our opacity or other filter changes values
   */
  onOpacityPropertyChange() {
    this.filterChangeEmitter.emit();
  }

  /**
   * Called when our opacity or other filter changes values
   */
  onDisabledOpacityPropertyChange() {
    if (!this._enabledProperty.value) {
      this.filterChangeEmitter.emit();
    }
  }

  /**
   * Sets the non-opacity filters for this Node.
   *
   * The default is an empty array (no filters). It should be an array of Filter objects, which will be effectively
   * applied in-order on this Node (and its subtree), and will be applied BEFORE opacity/clipping.
   *
   * NOTE: Some filters may decrease performance (and this may be platform-specific). Please read documentation for each
   * filter before using.
   *
   * Typical filter types to use are:
   * - Brightness
   * - Contrast
   * - DropShadow (EXPERIMENTAL)
   * - GaussianBlur (EXPERIMENTAL)
   * - Grayscale (Grayscale.FULL for the full effect)
   * - HueRotate
   * - Invert (Invert.FULL for the full effect)
   * - Saturate
   * - Sepia (Sepia.FULL for the full effect)
   *
   * Filter.js has more information in general on filters.
   */
  setFilters(filters) {
    assert && assert(Array.isArray(filters), 'filters should be an array');
    assert && assert(_.every(filters, filter => filter instanceof Filter), 'filters should consist of Filter objects only');

    // We re-use the same array internally, so we don't reference a potentially-mutable array from outside.
    this._filters.length = 0;
    this._filters.push(...filters);
    this.invalidateHint();
    this.filterChangeEmitter.emit();
  }

  /**
   * See setFilters() for more information
   */
  set filters(value) {
    this.setFilters(value);
  }

  /**
   * See getFilters() for more information
   */
  get filters() {
    return this.getFilters();
  }

  /**
   * Returns the non-opacity filters for this Node.
   */
  getFilters() {
    return this._filters.slice();
  }

  /**
   * Sets what Property our pickableProperty is backed by, so that changes to this provided Property will change this
   * Node's pickability, and vice versa. This does not change this._pickableProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * PhET-iO Instrumented Nodes do not by default create their own instrumented pickableProperty, even though Node.visibleProperty does.
   */
  setPickableProperty(newTarget) {
    return this._pickableProperty.setTargetProperty(newTarget, this, null);
  }

  /**
   * See setPickableProperty() for more information
   */
  set pickableProperty(property) {
    this.setPickableProperty(property);
  }

  /**
   * See getPickableProperty() for more information
   */
  get pickableProperty() {
    return this.getPickableProperty();
  }

  /**
   * Get this Node's pickableProperty. Note! This is not the reciprocal of setPickableProperty. Node.prototype._pickableProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the pickableProperty provided by
   * setPickableProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const pickableProperty = new Property( false );
   * myNode.setPickableProperty( pickableProperty )
   * => myNode.getPickableProperty() !== pickableProperty (!!!!!!)
   *
   * Please use this with caution. See setPickableProperty() for more information.
   */
  getPickableProperty() {
    return this._pickableProperty;
  }

  /**
   * Sets whether this Node (and its subtree) will allow hit-testing (and thus user interaction), controlling what
   * Trail is returned from node.trailUnderPoint().
   *
   * Pickable can take one of three values:
   * - null: (default) pass-through behavior. Hit-testing will prune this subtree if there are no
   *         ancestors/descendants with either pickable: true set or with any input listeners.
   * - false: Hit-testing is pruned, nothing in this node or its subtree will respond to events or be picked.
   * - true: Hit-testing will not be pruned in this subtree, except for pickable: false cases.
   *
   * Hit testing is accomplished mainly with node.trailUnderPointer() and node.trailUnderPoint(), following the
   * above rules. Nodes that are not pickable (pruned) will not have input events targeted to them.
   *
   * The following rules (applied in the given order) determine whether a Node (really, a Trail) will receive input events:
   * 1. If the node or one of its ancestors has pickable: false OR is invisible, the Node *will not* receive events
   *    or hit testing.
   * 2. If the Node or one of its ancestors or descendants is pickable: true OR has an input listener attached, it
   *    *will* receive events or hit testing.
   * 3. Otherwise, it *will not* receive events or hit testing.
   *
   * This is useful for semi-transparent overlays or other visual elements that should be displayed but should not
   * prevent objects below from being manipulated by user input, and the default null value is used to increase
   * performance by ignoring areas that don't need user input.
   *
   * NOTE: If you want something to be picked "mouse is over it", but block input events even if there are listeners,
   *       then pickable:false is not appropriate, and inputEnabled:false is preferred.
   *
   * For a visual example of how pickability interacts with input listeners and visibility, see the notes at the
   * bottom of http://phetsims.github.io/scenery/doc/implementation-notes, or scenery/assets/pickability.svg.
   */
  setPickable(pickable) {
    assert && assert(pickable === null || typeof pickable === 'boolean');
    this._pickableProperty.set(pickable);
    return this;
  }

  /**
   * See setPickable() for more information
   */
  set pickable(value) {
    this.setPickable(value);
  }

  /**
   * See isPickable() for more information
   */
  get pickable() {
    return this.isPickable();
  }

  /**
   * Returns the pickability of this node.
   */
  isPickable() {
    return this._pickableProperty.value;
  }

  /**
   * Called when our pickableProperty changes values.
   */
  onPickablePropertyChange(pickable, oldPickable) {
    this._picker.onPickableChange(oldPickable, pickable);
    if (assertSlow) {
      this._picker.audit();
    }
    // TODO: invalidate the cursor somehow? #150
  }

  /**
   * Sets what Property our enabledProperty is backed by, so that changes to this provided Property will change this
   * Node's enabled, and vice versa. This does not change this._enabledProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented enabledProperty (if one is not passed in as
   * an option). Once a Node's enabledProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented enabledProperty to this node, pass phetioEnabledPropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setEnabledProperty(newTarget) {
    return this._enabledProperty.setTargetProperty(newTarget, this, ENABLED_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setEnabledProperty() for more information
   */
  set enabledProperty(property) {
    this.setEnabledProperty(property);
  }

  /**
   * See getEnabledProperty() for more information
   */
  get enabledProperty() {
    return this.getEnabledProperty();
  }

  /**
   * Get this Node's enabledProperty. Note! This is not the reciprocal of setEnabledProperty. Node.prototype._enabledProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the enabledProperty provided by
   * setEnabledProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const enabledProperty = new Property( false );
   * myNode.setEnabledProperty( enabledProperty )
   * => myNode.getEnabledProperty() !== enabledProperty (!!!!!!)
   *
   * Please use this with caution. See setEnabledProperty() for more information.
   */
  getEnabledProperty() {
    return this._enabledProperty;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented enabledProperty internal to Node. This is different
   * from visible because enabled by default doesn't not create this forwarded Property.
   */
  setPhetioEnabledPropertyInstrumented(phetioEnabledPropertyInstrumented) {
    return this._enabledProperty.setTargetPropertyInstrumented(phetioEnabledPropertyInstrumented, this);
  }

  /**
   * See setPhetioEnabledPropertyInstrumented() for more information
   */
  set phetioEnabledPropertyInstrumented(value) {
    this.setPhetioEnabledPropertyInstrumented(value);
  }

  /**
   * See getPhetioEnabledPropertyInstrumented() for more information
   */
  get phetioEnabledPropertyInstrumented() {
    return this.getPhetioEnabledPropertyInstrumented();
  }
  getPhetioEnabledPropertyInstrumented() {
    return this._enabledProperty.getTargetPropertyInstrumented();
  }

  /**
   * Sets whether this Node is enabled
   */
  setEnabled(enabled) {
    assert && assert(enabled === null || typeof enabled === 'boolean');
    this._enabledProperty.set(enabled);
    return this;
  }

  /**
   * See setEnabled() for more information
   */
  set enabled(value) {
    this.setEnabled(value);
  }

  /**
   * See isEnabled() for more information
   */
  get enabled() {
    return this.isEnabled();
  }

  /**
   * Returns the enabled of this node.
   */
  isEnabled() {
    return this._enabledProperty.value;
  }

  /**
   * Called when enabledProperty changes values.
   * - override this to change the behavior of enabled
   */
  onEnabledPropertyChange(enabled) {
    !enabled && this.interruptSubtreeInput();
    this.inputEnabled = enabled;
    if (this.disabledOpacityProperty.value !== 1) {
      this.filterChangeEmitter.emit();
    }
  }

  /**
   * Sets what Property our inputEnabledProperty is backed by, so that changes to this provided Property will change this whether this
   * Node's input is enabled, and vice versa. This does not change this._inputEnabledProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented inputEnabledProperty (if one is not passed in as
   * an option). Once a Node's inputEnabledProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented inputEnabledProperty to this node, pass phetioInputEnabledPropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setInputEnabledProperty(newTarget) {
    return this._inputEnabledProperty.setTargetProperty(newTarget, this, INPUT_ENABLED_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setInputEnabledProperty() for more information
   */
  set inputEnabledProperty(property) {
    this.setInputEnabledProperty(property);
  }

  /**
   * See getInputEnabledProperty() for more information
   */
  get inputEnabledProperty() {
    return this.getInputEnabledProperty();
  }

  /**
   * Get this Node's inputEnabledProperty. Note! This is not the reciprocal of setInputEnabledProperty. Node.prototype._inputEnabledProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the inputEnabledProperty provided by
   * setInputEnabledProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const inputEnabledProperty = new Property( false );
   * myNode.setInputEnabledProperty( inputEnabledProperty )
   * => myNode.getInputEnabledProperty() !== inputEnabledProperty (!!!!!!)
   *
   * Please use this with caution. See setInputEnabledProperty() for more information.
   */
  getInputEnabledProperty() {
    return this._inputEnabledProperty;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented inputEnabledProperty internal to Node. This is different
   * from visible because inputEnabled by default doesn't not create this forwarded Property.
   */
  setPhetioInputEnabledPropertyInstrumented(phetioInputEnabledPropertyInstrumented) {
    return this._inputEnabledProperty.setTargetPropertyInstrumented(phetioInputEnabledPropertyInstrumented, this);
  }

  /**
   * See setPhetioInputEnabledPropertyInstrumented() for more information
   */
  set phetioInputEnabledPropertyInstrumented(value) {
    this.setPhetioInputEnabledPropertyInstrumented(value);
  }

  /**
   * See getPhetioInputEnabledPropertyInstrumented() for more information
   */
  get phetioInputEnabledPropertyInstrumented() {
    return this.getPhetioInputEnabledPropertyInstrumented();
  }
  getPhetioInputEnabledPropertyInstrumented() {
    return this._inputEnabledProperty.getTargetPropertyInstrumented();
  }

  /**
   * Sets whether input is enabled for this Node and its subtree. If false, input event listeners will not be fired
   * on this Node or its descendants in the picked Trail. This does NOT effect picking (what Trail/nodes are under
   * a pointer), but only effects what listeners are fired.
   *
   * Additionally, this will affect cursor behavior. If inputEnabled=false, descendants of this Node will not be
   * checked when determining what cursor will be shown. Instead, if a pointer (e.g. mouse) is over a descendant,
   * this Node's cursor will be checked first, then ancestors will be checked as normal.
   */
  setInputEnabled(inputEnabled) {
    this.inputEnabledProperty.value = inputEnabled;
  }

  /**
   * See setInputEnabled() for more information
   */
  set inputEnabled(value) {
    this.setInputEnabled(value);
  }

  /**
   * See isInputEnabled() for more information
   */
  get inputEnabled() {
    return this.isInputEnabled();
  }

  /**
   * Returns whether input is enabled for this Node and its subtree. See setInputEnabled for more documentation.
   */
  isInputEnabled() {
    return this.inputEnabledProperty.value;
  }

  /**
   * Sets all of the input listeners attached to this Node.
   *
   * This is equivalent to removing all current input listeners with removeInputListener() and adding all new
   * listeners (in order) with addInputListener().
   */
  setInputListeners(inputListeners) {
    assert && assert(Array.isArray(inputListeners));

    // Remove all old input listeners
    while (this._inputListeners.length) {
      this.removeInputListener(this._inputListeners[0]);
    }

    // Add in all new input listeners
    for (let i = 0; i < inputListeners.length; i++) {
      this.addInputListener(inputListeners[i]);
    }
    return this;
  }

  /**
   * See setInputListeners() for more information
   */
  set inputListeners(value) {
    this.setInputListeners(value);
  }

  /**
   * See getInputListeners() for more information
   */
  get inputListeners() {
    return this.getInputListeners();
  }

  /**
   * Returns a copy of all of our input listeners.
   */
  getInputListeners() {
    return this._inputListeners.slice(0); // defensive copy
  }

  /**
   * Sets the CSS cursor string that should be used when the mouse is over this node. null is the default, and
   * indicates that ancestor nodes (or the browser default) should be used.
   *
   * @param cursor - A CSS cursor string, like 'pointer', or 'none' - Examples are:
   * auto default none inherit help pointer progress wait crosshair text vertical-text alias copy move no-drop not-allowed
   * e-resize n-resize w-resize s-resize nw-resize ne-resize se-resize sw-resize ew-resize ns-resize nesw-resize nwse-resize
   * context-menu cell col-resize row-resize all-scroll url( ... ) --> does it support data URLs?
   */
  setCursor(cursor) {
    // TODO: consider a mapping of types to set reasonable defaults https://github.com/phetsims/scenery/issues/1581

    // allow the 'auto' cursor type to let the ancestors or scene pick the cursor type
    this._cursor = cursor === 'auto' ? null : cursor;
  }

  /**
   * See setCursor() for more information
   */
  set cursor(value) {
    this.setCursor(value);
  }

  /**
   * See getCursor() for more information
   */
  get cursor() {
    return this.getCursor();
  }

  /**
   * Returns the CSS cursor string for this node, or null if there is no cursor specified.
   */
  getCursor() {
    return this._cursor;
  }

  /**
   * Returns the CSS cursor that could be applied either by this Node itself, or from any of its input listeners'
   * preferences. (scenery-internal)
   */
  getEffectiveCursor() {
    if (this._cursor) {
      return this._cursor;
    }
    for (let i = 0; i < this._inputListeners.length; i++) {
      const inputListener = this._inputListeners[i];
      if (inputListener.cursor) {
        return inputListener.cursor;
      }
    }
    return null;
  }

  /**
   * Sets the hit-tested mouse area for this Node (see constructor for more advanced documentation). Use null for the
   * default behavior.
   */
  setMouseArea(area) {
    assert && assert(area === null || area instanceof Shape || area instanceof Bounds2, 'mouseArea needs to be a phet.kite.Shape, phet.dot.Bounds2, or null');
    if (this._mouseArea !== area) {
      this._mouseArea = area; // TODO: could change what is under the mouse, invalidate! https://github.com/phetsims/scenery/issues/1581

      this._picker.onMouseAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * See setMouseArea() for more information
   */
  set mouseArea(value) {
    this.setMouseArea(value);
  }

  /**
   * See getMouseArea() for more information
   */
  get mouseArea() {
    return this.getMouseArea();
  }

  /**
   * Returns the hit-tested mouse area for this node.
   */
  getMouseArea() {
    return this._mouseArea;
  }

  /**
   * Sets the hit-tested touch area for this Node (see constructor for more advanced documentation). Use null for the
   * default behavior.
   */
  setTouchArea(area) {
    assert && assert(area === null || area instanceof Shape || area instanceof Bounds2, 'touchArea needs to be a phet.kite.Shape, phet.dot.Bounds2, or null');
    if (this._touchArea !== area) {
      this._touchArea = area; // TODO: could change what is under the touch, invalidate! https://github.com/phetsims/scenery/issues/1581

      this._picker.onTouchAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * See setTouchArea() for more information
   */
  set touchArea(value) {
    this.setTouchArea(value);
  }

  /**
   * See getTouchArea() for more information
   */
  get touchArea() {
    return this.getTouchArea();
  }

  /**
   * Returns the hit-tested touch area for this node.
   */
  getTouchArea() {
    return this._touchArea;
  }

  /**
   * Sets a clipped shape where only content in our local coordinate frame that is inside the clip area will be shown
   * (anything outside is fully transparent).
   */
  setClipArea(shape) {
    assert && assert(shape === null || shape instanceof Shape, 'clipArea needs to be a phet.kite.Shape, or null');
    if (this.clipArea !== shape) {
      this.clipAreaProperty.value = shape;
      this.invalidateBounds();
      this._picker.onClipAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
  }

  /**
   * See setClipArea() for more information
   */
  set clipArea(value) {
    this.setClipArea(value);
  }

  /**
   * See getClipArea() for more information
   */
  get clipArea() {
    return this.getClipArea();
  }

  /**
   * Returns the clipped area for this node.
   */
  getClipArea() {
    return this.clipAreaProperty.value;
  }

  /**
   * Returns whether this Node has a clip area.
   */
  hasClipArea() {
    return this.clipArea !== null;
  }

  /**
   * Sets what self renderers (and other bitmask flags) are supported by this node.
   */
  setRendererBitmask(bitmask) {
    assert && assert(isFinite(bitmask));
    if (bitmask !== this._rendererBitmask) {
      this._rendererBitmask = bitmask;
      this._rendererSummary.selfChange();
      this.instanceRefreshEmitter.emit();
    }
  }

  /**
   * Meant to be overridden, so that it can be called to ensure that the renderer bitmask will be up-to-date.
   */
  invalidateSupportedRenderers() {
    // see docs
  }

  /*---------------------------------------------------------------------------*
   * Hints
   *----------------------------------------------------------------------------*/

  /**
   * When ANY hint changes, we refresh everything currently (for safety, this may be possible to make more specific
   * in the future, but hint changes are not particularly common performance bottleneck).
   */
  invalidateHint() {
    this.rendererSummaryRefreshEmitter.emit();
    this.instanceRefreshEmitter.emit();
  }

  /**
   * Sets a preferred renderer for this Node and its sub-tree. Scenery will attempt to use this renderer under here
   * unless it isn't supported, OR another preferred renderer is set as a closer ancestor. Acceptable values are:
   * - null (default, no preference)
   * - 'canvas'
   * - 'svg'
   * - 'dom'
   * - 'webgl'
   */
  setRenderer(renderer) {
    assert && assert(renderer === null || renderer === 'canvas' || renderer === 'svg' || renderer === 'dom' || renderer === 'webgl', 'Renderer input should be null, or one of: "canvas", "svg", "dom" or "webgl".');
    let newRenderer = 0;
    if (renderer === 'canvas') {
      newRenderer = Renderer.bitmaskCanvas;
    } else if (renderer === 'svg') {
      newRenderer = Renderer.bitmaskSVG;
    } else if (renderer === 'dom') {
      newRenderer = Renderer.bitmaskDOM;
    } else if (renderer === 'webgl') {
      newRenderer = Renderer.bitmaskWebGL;
    }
    assert && assert(renderer === null === (newRenderer === 0), 'We should only end up with no actual renderer if renderer is null');
    if (this._renderer !== newRenderer) {
      this._renderer = newRenderer;
      this.invalidateHint();
    }
  }

  /**
   * See setRenderer() for more information
   */
  set renderer(value) {
    this.setRenderer(value);
  }

  /**
   * See getRenderer() for more information
   */
  get renderer() {
    return this.getRenderer();
  }

  /**
   * Returns the preferred renderer (if any) of this node, as a string.
   */
  getRenderer() {
    if (this._renderer === 0) {
      return null;
    } else if (this._renderer === Renderer.bitmaskCanvas) {
      return 'canvas';
    } else if (this._renderer === Renderer.bitmaskSVG) {
      return 'svg';
    } else if (this._renderer === Renderer.bitmaskDOM) {
      return 'dom';
    } else if (this._renderer === Renderer.bitmaskWebGL) {
      return 'webgl';
    }
    assert && assert(false, 'Seems to be an invalid renderer?');
    return null;
  }

  /**
   * Sets whether or not Scenery will try to put this Node (and its descendants) into a separate SVG/Canvas/WebGL/etc.
   * layer, different from other siblings or other nodes. Can be used for performance purposes.
   */
  setLayerSplit(split) {
    if (split !== this._layerSplit) {
      this._layerSplit = split;
      this.invalidateHint();
    }
  }

  /**
   * See setLayerSplit() for more information
   */
  set layerSplit(value) {
    this.setLayerSplit(value);
  }

  /**
   * See isLayerSplit() for more information
   */
  get layerSplit() {
    return this.isLayerSplit();
  }

  /**
   * Returns whether the layerSplit performance flag is set.
   */
  isLayerSplit() {
    return this._layerSplit;
  }

  /**
   * Sets whether or not Scenery will take into account that this Node plans to use opacity. Can have performance
   * gains if there need to be multiple layers for this node's descendants.
   */
  setUsesOpacity(usesOpacity) {
    if (usesOpacity !== this._usesOpacity) {
      this._usesOpacity = usesOpacity;
      this.invalidateHint();
    }
  }

  /**
   * See setUsesOpacity() for more information
   */
  set usesOpacity(value) {
    this.setUsesOpacity(value);
  }

  /**
   * See getUsesOpacity() for more information
   */
  get usesOpacity() {
    return this.getUsesOpacity();
  }

  /**
   * Returns whether the usesOpacity performance flag is set.
   */
  getUsesOpacity() {
    return this._usesOpacity;
  }

  /**
   * Sets a flag for whether whether the contents of this Node and its children should be displayed in a separate
   * DOM element that is transformed with CSS transforms. It can have potential speedups, since the browser may not
   * have to re-rasterize contents when it is animated.
   */
  setCSSTransform(cssTransform) {
    if (cssTransform !== this._cssTransform) {
      this._cssTransform = cssTransform;
      this.invalidateHint();
    }
  }

  /**
   * See setCSSTransform() for more information
   */
  set cssTransform(value) {
    this.setCSSTransform(value);
  }

  /**
   * See isCSSTransformed() for more information
   */
  get cssTransform() {
    return this.isCSSTransformed();
  }

  /**
   * Returns whether the cssTransform performance flag is set.
   */
  isCSSTransformed() {
    return this._cssTransform;
  }

  /**
   * Sets a performance flag for whether layers/DOM elements should be excluded (or included) when things are
   * invisible. The default is false, and invisible content is in the DOM, but hidden.
   */
  setExcludeInvisible(excludeInvisible) {
    if (excludeInvisible !== this._excludeInvisible) {
      this._excludeInvisible = excludeInvisible;
      this.invalidateHint();
    }
  }

  /**
   * See setExcludeInvisible() for more information
   */
  set excludeInvisible(value) {
    this.setExcludeInvisible(value);
  }

  /**
   * See isExcludeInvisible() for more information
   */
  get excludeInvisible() {
    return this.isExcludeInvisible();
  }

  /**
   * Returns whether the excludeInvisible performance flag is set.
   */
  isExcludeInvisible() {
    return this._excludeInvisible;
  }

  /**
   * If this is set to true, child nodes that are invisible will NOT contribute to the bounds of this node.
   *
   * The default is for child nodes bounds' to be included in this node's bounds, but that would in general be a
   * problem for layout containers or other situations, see https://github.com/phetsims/joist/issues/608.
   */
  setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds) {
    if (excludeInvisibleChildrenFromBounds !== this._excludeInvisibleChildrenFromBounds) {
      this._excludeInvisibleChildrenFromBounds = excludeInvisibleChildrenFromBounds;
      this.invalidateBounds();
    }
  }

  /**
   * See setExcludeInvisibleChildrenFromBounds() for more information
   */
  set excludeInvisibleChildrenFromBounds(value) {
    this.setExcludeInvisibleChildrenFromBounds(value);
  }

  /**
   * See isExcludeInvisibleChildrenFromBounds() for more information
   */
  get excludeInvisibleChildrenFromBounds() {
    return this.isExcludeInvisibleChildrenFromBounds();
  }

  /**
   * Returns whether the excludeInvisibleChildrenFromBounds flag is set, see
   * setExcludeInvisibleChildrenFromBounds() for documentation.
   */
  isExcludeInvisibleChildrenFromBounds() {
    return this._excludeInvisibleChildrenFromBounds;
  }

  /**
   * Sets options that are provided to layout managers in order to customize positioning of this node.
   */
  setLayoutOptions(layoutOptions) {
    assert && assert(layoutOptions === null || typeof layoutOptions === 'object' && Object.getPrototypeOf(layoutOptions) === Object.prototype, 'layoutOptions should be null or an plain options-style object');
    if (layoutOptions !== this._layoutOptions) {
      this._layoutOptions = layoutOptions;
      this.layoutOptionsChangedEmitter.emit();
    }
  }
  set layoutOptions(value) {
    this.setLayoutOptions(value);
  }
  get layoutOptions() {
    return this.getLayoutOptions();
  }
  getLayoutOptions() {
    return this._layoutOptions;
  }
  mutateLayoutOptions(layoutOptions) {
    this.layoutOptions = optionize3()({}, this.layoutOptions || {}, layoutOptions);
  }

  // Defaults indicating that we don't mix in WidthSizable/HeightSizable
  get widthSizable() {
    return false;
  }
  get heightSizable() {
    return false;
  }
  get extendsWidthSizable() {
    return false;
  }
  get extendsHeightSizable() {
    return false;
  }
  get extendsSizable() {
    return false;
  }

  /**
   * Sets the preventFit performance flag.
   */
  setPreventFit(preventFit) {
    if (preventFit !== this._preventFit) {
      this._preventFit = preventFit;
      this.invalidateHint();
    }
  }

  /**
   * See setPreventFit() for more information
   */
  set preventFit(value) {
    this.setPreventFit(value);
  }

  /**
   * See isPreventFit() for more information
   */
  get preventFit() {
    return this.isPreventFit();
  }

  /**
   * Returns whether the preventFit performance flag is set.
   */
  isPreventFit() {
    return this._preventFit;
  }

  /**
   * Sets whether there is a custom WebGL scale applied to the Canvas, and if so what scale.
   */
  setWebGLScale(webglScale) {
    assert && assert(webglScale === null || typeof webglScale === 'number' && isFinite(webglScale));
    if (webglScale !== this._webglScale) {
      this._webglScale = webglScale;
      this.invalidateHint();
    }
  }

  /**
   * See setWebGLScale() for more information
   */
  set webglScale(value) {
    this.setWebGLScale(value);
  }

  /**
   * See getWebGLScale() for more information
   */
  get webglScale() {
    return this.getWebGLScale();
  }

  /**
   * Returns the value of the webglScale performance flag.
   */
  getWebGLScale() {
    return this._webglScale;
  }

  /*---------------------------------------------------------------------------*
   * Trail operations
   *----------------------------------------------------------------------------*/

  /**
   * Returns the one Trail that starts from a node with no parents (or if the predicate is present, a Node that
   * satisfies it), and ends at this node. If more than one Trail would satisfy these conditions, an assertion is
   * thrown (please use getTrails() for those cases).
   *
   * @param [predicate] - If supplied, we will only return trails rooted at a Node that satisfies predicate( node ) == true
   */
  getUniqueTrail(predicate) {
    // Without a predicate, we'll be able to bail out the instant we hit a Node with 2+ parents, and it makes the
    // logic easier.
    if (!predicate) {
      const trail = new Trail();

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let node = this; // eslint-disable-line consistent-this

      while (node) {
        assert && assert(node._parents.length <= 1, `getUniqueTrail found a Node with ${node._parents.length} parents.`);
        trail.addAncestor(node);
        node = node._parents[0]; // should be undefined if there aren't any parents
      }
      return trail;
    }
    // With a predicate, we need to explore multiple parents (since the predicate may filter out all but one)
    else {
      const trails = this.getTrails(predicate);
      assert && assert(trails.length === 1, `getUniqueTrail found ${trails.length} matching trails for the predicate`);
      return trails[0];
    }
  }

  /**
   * Returns a Trail rooted at rootNode and ends at this node. Throws an assertion if the number of trails that match
   * this condition isn't exactly 1.
   */
  getUniqueTrailTo(rootNode) {
    return this.getUniqueTrail(node => rootNode === node);
  }

  /**
   * Returns an array of all Trails that start from nodes with no parent (or if a predicate is present, those that
   * satisfy the predicate), and ends at this node.
   *
   * @param [predicate] - If supplied, we will only return Trails rooted at nodes that satisfy predicate( node ) == true.
   */
  getTrails(predicate) {
    predicate = predicate || Node.defaultTrailPredicate;
    const trails = [];
    const trail = new Trail(this);
    Trail.appendAncestorTrailsWithPredicate(trails, trail, predicate);
    return trails;
  }

  /**
   * Returns an array of all Trails rooted at rootNode and end at this node.
   */
  getTrailsTo(rootNode) {
    return this.getTrails(node => node === rootNode);
  }

  /**
   * Returns an array of all Trails rooted at this Node and end with nodes with no children (or if a predicate is
   * present, those that satisfy the predicate).
   *
   * @param [predicate] - If supplied, we will only return Trails ending at nodes that satisfy predicate( node ) == true.
   */
  getLeafTrails(predicate) {
    predicate = predicate || Node.defaultLeafTrailPredicate;
    const trails = [];
    const trail = new Trail(this);
    Trail.appendDescendantTrailsWithPredicate(trails, trail, predicate);
    return trails;
  }

  /**
   * Returns an array of all Trails rooted at this Node and end with leafNode.
   */
  getLeafTrailsTo(leafNode) {
    return this.getLeafTrails(node => node === leafNode);
  }

  /**
   * Returns a Trail rooted at this node and ending at a Node that has no children (or if a predicate is provided, a
   * Node that satisfies the predicate). If more than one trail matches this description, an assertion will be fired.
   *
   * @param [predicate] - If supplied, we will return a Trail that ends with a Node that satisfies predicate( node ) == true
   */
  getUniqueLeafTrail(predicate) {
    const trails = this.getLeafTrails(predicate);
    assert && assert(trails.length === 1, `getUniqueLeafTrail found ${trails.length} matching trails for the predicate`);
    return trails[0];
  }

  /**
   * Returns a Trail rooted at this Node and ending at leafNode. If more than one trail matches this description,
   * an assertion will be fired.
   */
  getUniqueLeafTrailTo(leafNode) {
    return this.getUniqueLeafTrail(node => node === leafNode);
  }

  /**
   * Returns all nodes in the connected component, returned in an arbitrary order, including nodes that are ancestors
   * of this node.
   */
  getConnectedNodes() {
    const result = [];
    let fresh = this._children.concat(this._parents).concat(this);
    while (fresh.length) {
      const node = fresh.pop();
      if (!_.includes(result, node)) {
        result.push(node);
        fresh = fresh.concat(node._children, node._parents);
      }
    }
    return result;
  }

  /**
   * Returns all nodes in the subtree with this Node as its root, returned in an arbitrary order. Like
   * getConnectedNodes, but doesn't include parents.
   */
  getSubtreeNodes() {
    const result = [];
    let fresh = this._children.concat(this);
    while (fresh.length) {
      const node = fresh.pop();
      if (!_.includes(result, node)) {
        result.push(node);
        fresh = fresh.concat(node._children);
      }
    }
    return result;
  }

  /**
   * Returns all nodes that are connected to this node, sorted in topological order.
   */
  getTopologicallySortedNodes() {
    // see http://en.wikipedia.org/wiki/Topological_sorting
    const edges = {};
    const s = [];
    const l = [];
    let n;
    _.each(this.getConnectedNodes(), node => {
      edges[node.id] = {};
      _.each(node._children, m => {
        edges[node.id][m.id] = true;
      });
      if (!node.parents.length) {
        s.push(node);
      }
    });
    function handleChild(m) {
      delete edges[n.id][m.id];
      if (_.every(edges, children => !children[m.id])) {
        // there are no more edges to m
        s.push(m);
      }
    }
    while (s.length) {
      n = s.pop();
      l.push(n);
      _.each(n._children, handleChild);
    }

    // ensure that there are no edges left, since then it would contain a circular reference
    assert && assert(_.every(edges, children => _.every(children, final => false)), 'circular reference check');
    return l;
  }

  /**
   * Returns whether this.addChild( child ) will not cause circular references.
   */
  canAddChild(child) {
    if (this === child || _.includes(this._children, child)) {
      return false;
    }

    // see http://en.wikipedia.org/wiki/Topological_sorting
    // TODO: remove duplication with above handling? https://github.com/phetsims/scenery/issues/1581
    const edges = {};
    const s = [];
    const l = [];
    let n;
    _.each(this.getConnectedNodes().concat(child.getConnectedNodes()), node => {
      edges[node.id] = {};
      _.each(node._children, m => {
        edges[node.id][m.id] = true;
      });
      if (!node.parents.length && node !== child) {
        s.push(node);
      }
    });
    edges[this.id][child.id] = true; // add in our 'new' edge
    function handleChild(m) {
      delete edges[n.id][m.id];
      if (_.every(edges, children => !children[m.id])) {
        // there are no more edges to m
        s.push(m);
      }
    }
    while (s.length) {
      n = s.pop();
      l.push(n);
      _.each(n._children, handleChild);

      // handle our new edge
      if (n === this) {
        handleChild(child);
      }
    }

    // ensure that there are no edges left, since then it would contain a circular reference
    return _.every(edges, children => _.every(children, final => false));
  }

  /**
   * To be overridden in paintable Node types. Should hook into the drawable's prototype (presumably).
   *
   * Draws the current Node's self representation, assuming the wrapper's Canvas context is already in the local
   * coordinate frame of this node.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  canvasPaintSelf(wrapper, matrix) {
    // See subclass for implementation
  }

  /**
   * Renders this Node only (its self) into the Canvas wrapper, in its local coordinate frame.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  renderToCanvasSelf(wrapper, matrix) {
    if (this.isPainted() && this._rendererBitmask & Renderer.bitmaskCanvas) {
      this.canvasPaintSelf(wrapper, matrix);
    }
  }

  /**
   * Renders this Node and its descendants into the Canvas wrapper.
   *
   * @param wrapper
   * @param [matrix] - Optional transform to be applied
   */
  renderToCanvasSubtree(wrapper, matrix) {
    matrix = matrix || Matrix3.identity();
    wrapper.resetStyles();
    this.renderToCanvasSelf(wrapper, matrix);
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];

      // Ignore invalid (empty) bounds, since this would show nothing (and we couldn't compute fitted bounds for it).
      if (child.isVisible() && child.bounds.isValid()) {
        // For anything filter-like, we'll need to create a Canvas, render our child's content into that Canvas,
        // and then (applying the filter) render that into the Canvas provided.
        const requiresScratchCanvas = child.effectiveOpacity !== 1 || child.clipArea || child._filters.length;
        wrapper.context.save();
        matrix.multiplyMatrix(child._transform.getMatrix());
        matrix.canvasSetTransform(wrapper.context);
        if (requiresScratchCanvas) {
          // We'll attempt to fit the Canvas to the content to minimize memory use, see
          // https://github.com/phetsims/function-builder/issues/148

          // We're going to ignore content outside our wrapper context's canvas.
          // Added padding and round-out for cases where Canvas bounds might not be fully accurate
          // The matrix already includes the child's transform (so we use localBounds).
          // We won't go outside our parent canvas' bounds, since this would be a waste of memory (wouldn't be written)
          // The round-out will make sure we have pixel alignment, so that we won't get blurs or aliasing/blitting
          // effects when copying things over.
          const childCanvasBounds = child.localBounds.transformed(matrix).dilate(4).roundOut().constrainBounds(scratchBounds2Extra.setMinMax(0, 0, wrapper.canvas.width, wrapper.canvas.height));
          if (childCanvasBounds.width > 0 && childCanvasBounds.height > 0) {
            const canvas = document.createElement('canvas');

            // We'll set our Canvas to the fitted width, and will handle the offsets below.
            canvas.width = childCanvasBounds.width;
            canvas.height = childCanvasBounds.height;
            const context = canvas.getContext('2d');
            const childWrapper = new CanvasContextWrapper(canvas, context);

            // After our ancestor transform is applied, we'll need to apply another offset for fitted Canvas. We'll
            // need to pass this to descendants AND apply it to the sub-context.
            const subMatrix = matrix.copy().prependTranslation(-childCanvasBounds.minX, -childCanvasBounds.minY);
            subMatrix.canvasSetTransform(context);
            child.renderToCanvasSubtree(childWrapper, subMatrix);
            wrapper.context.save();
            if (child.clipArea) {
              wrapper.context.beginPath();
              child.clipArea.writeToContext(wrapper.context);
              wrapper.context.clip();
            }
            wrapper.context.setTransform(1, 0, 0, 1, 0, 0); // identity
            wrapper.context.globalAlpha = child.effectiveOpacity;
            let setFilter = false;
            if (child._filters.length) {
              // Filters shouldn't be too often, so less concerned about the GC here (and this is so much easier to read).
              // Performance bottleneck for not using this fallback style, so we're allowing it for Chrome even though
              // the visual differences may be present, see https://github.com/phetsims/scenery/issues/1139
              if (Features.canvasFilter && _.every(child._filters, filter => filter.isDOMCompatible())) {
                wrapper.context.filter = child._filters.map(filter => filter.getCSSFilterString()).join(' ');
                setFilter = true;
              } else {
                child._filters.forEach(filter => filter.applyCanvasFilter(childWrapper));
              }
            }

            // The inverse transform is applied to handle fitting
            wrapper.context.drawImage(canvas, childCanvasBounds.minX, childCanvasBounds.minY);
            wrapper.context.restore();
            if (setFilter) {
              wrapper.context.filter = 'none';
            }
          }
        } else {
          child.renderToCanvasSubtree(wrapper, matrix);
        }
        matrix.multiplyMatrix(child._transform.getInverse());
        wrapper.context.restore();
      }
    }
  }

  /**
   * @deprecated
   * Render this Node to the Canvas (clearing it first)
   */
  renderToCanvas(canvas, context, callback, backgroundColor) {
    assert && deprecationWarning('Node.renderToCanvas() is deprecated, please use Node.rasterized() instead');

    // should basically reset everything (and clear the Canvas)
    canvas.width = canvas.width; // eslint-disable-line no-self-assign

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const wrapper = new CanvasContextWrapper(canvas, context);
    this.renderToCanvasSubtree(wrapper, Matrix3.identity());
    callback && callback(); // this was originally asynchronous, so we had a callback
  }

  /**
   * Renders this Node to an HTMLCanvasElement. If toCanvas( callback ) is used, the canvas will contain the node's
   * entire bounds (if no x/y/width/height is provided)
   *
   * @param callback - callback( canvas, x, y, width, height ) is called, where x,y are computed if not specified.
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toCanvas(callback, x, y, width, height) {
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    const padding = 2; // padding used if x and y are not set

    // for now, we add an unpleasant hack around Text and safe bounds in general. We don't want to add another Bounds2 object per Node for now.
    const bounds = this.getBounds().union(this.localToParentBounds(this.getSafeSelfBounds()));
    assert && assert(!bounds.isEmpty() || x !== undefined && y !== undefined && width !== undefined && height !== undefined, 'Should not call toCanvas on a Node with empty bounds, unless all dimensions are provided');
    x = x !== undefined ? x : Math.ceil(padding - bounds.minX);
    y = y !== undefined ? y : Math.ceil(padding - bounds.minY);
    width = width !== undefined ? width : Math.ceil(bounds.getWidth() + 2 * padding);
    height = height !== undefined ? height : Math.ceil(bounds.getHeight() + 2 * padding);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    // shift our rendering over by the desired amount
    context.translate(x, y);

    // for API compatibility, we apply our own transform here
    this._transform.getMatrix().canvasAppendTransform(context);
    const wrapper = new CanvasContextWrapper(canvas, context);
    this.renderToCanvasSubtree(wrapper, Matrix3.translation(x, y).timesMatrix(this._transform.getMatrix()));
    callback(canvas, x, y, width, height); // we used to be asynchronous
  }

  /**
   * Renders this Node to a Canvas, then calls the callback with the data URI from it.
   *
   * @param callback - callback( dataURI {string}, x, y, width, height ) is called, where x,y are computed if not specified.
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURL(callback, x, y, width, height) {
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toCanvas((canvas, x, y, width, height) => {
      // this x and y shadow the outside parameters, and will be different if the outside parameters are undefined
      callback(canvas.toDataURL(), x, y, width, height);
    }, x, y, width, height);
  }

  /**
   * Calls the callback with an HTMLImageElement that contains this Node's subtree's visual form.
   * Will always be asynchronous.
   * @deprecated - Use node.rasterized() for creating a rasterized copy, or generally it's best to get the data
   *               URL instead directly.
   *
   * @param callback - callback( image {HTMLImageElement}, x, y ) is called
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toImage(callback, x, y, width, height) {
    assert && deprecationWarning('Node.toImage() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toDataURL((url, x, y) => {
      // this x and y shadow the outside parameters, and will be different if the outside parameters are undefined
      const img = document.createElement('img');
      img.onload = () => {
        callback(img, x, y);
        try {
          // @ts-expect-error - I believe we need to delete this
          delete img.onload;
        } catch (e) {
          // do nothing
        } // fails on Safari 5.1
      };
      img.src = url;
    }, x, y, width, height);
  }

  /**
   * Calls the callback with an Image Node that contains this Node's subtree's visual form. This is always
   * asynchronous, but the resulting image Node can be used with any back-end (Canvas/WebGL/SVG/etc.)
   * @deprecated - Use node.rasterized() instead (should avoid the asynchronous-ness)
   *
   * @param callback - callback( imageNode {Image} ) is called
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toImageNodeAsynchronous(callback, x, y, width, height) {
    assert && deprecationWarning('Node.toImageNodeAsyncrhonous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toImage((image, x, y) => {
      callback(new Node({
        // eslint-disable-line no-html-constructors
        children: [new Image(image, {
          x: -x,
          y: -y
        })]
      }));
    }, x, y, width, height);
  }

  /**
   * Creates a Node containing an Image Node that contains this Node's subtree's visual form. This is always
   * synchronous, but the resulting image Node can ONLY used with Canvas/WebGL (NOT SVG).
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent if useCanvas:true is provided.
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toCanvasNodeSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toCanvasNodeSynchronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    let result = null;
    this.toCanvas((canvas, x, y) => {
      result = new Node({
        // eslint-disable-line no-html-constructors
        children: [new Image(canvas, {
          x: -x,
          y: -y
        })]
      });
    }, x, y, width, height);
    assert && assert(result, 'toCanvasNodeSynchronous requires that the node can be rendered only using Canvas');
    return result;
  }

  /**
   * Returns an Image that renders this Node. This is always synchronous, and sets initialWidth/initialHeight so that
   * we have the bounds immediately.  Use this method if you need to reduce the number of parent Nodes.
   *
   * NOTE: the resultant Image should be positioned using its bounds rather than (x,y).  To create a Node that can be
   * positioned like any other node, please use toDataURLNodeSynchronous.
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent if wrap:false is provided.
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURLImageSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toDataURLImageSychronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    let result = null;
    this.toDataURL((dataURL, x, y, width, height) => {
      result = new Image(dataURL, {
        x: -x,
        y: -y,
        initialWidth: width,
        initialHeight: height
      });
    }, x, y, width, height);
    assert && assert(result, 'toDataURL failed to return a result synchronously');
    return result;
  }

  /**
   * Returns a Node that contains this Node's subtree's visual form. This is always synchronous, and sets
   * initialWidth/initialHeight so that we have the bounds immediately.  An extra wrapper Node is provided
   * so that transforms can be done independently.  Use this method if you need to be able to transform the node
   * the same way as if it had not been rasterized.
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURLNodeSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toDataURLNodeSynchronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    return new Node({
      // eslint-disable-line no-html-constructors
      children: [this.toDataURLImageSynchronous(x, y, width, height)]
    });
  }

  /**
   * Returns a Node (backed by a scenery Image) that is a rasterized version of this node.
   *
   * @param [options] - See below options. This is also passed directly to the created Image object.
   */
  rasterized(providedOptions) {
    const options = optionize()({
      resolution: 1,
      sourceBounds: null,
      useTargetBounds: true,
      wrap: true,
      useCanvas: false,
      imageOptions: {}
    }, providedOptions);
    const resolution = options.resolution;
    const sourceBounds = options.sourceBounds;
    if (assert) {
      assert(typeof resolution === 'number' && resolution > 0, 'resolution should be a positive number');
      assert(sourceBounds === null || sourceBounds instanceof Bounds2, 'sourceBounds should be null or a Bounds2');
      if (sourceBounds) {
        assert(sourceBounds.isValid(), 'sourceBounds should be valid (finite non-negative)');
        assert(Number.isInteger(sourceBounds.width), 'sourceBounds.width should be an integer');
        assert(Number.isInteger(sourceBounds.height), 'sourceBounds.height should be an integer');
      }
    }

    // We'll need to wrap it in a container Node temporarily (while rasterizing) for the scale
    const wrapperNode = new Node({
      // eslint-disable-line no-html-constructors
      scale: resolution,
      children: [this]
    });
    let transformedBounds = sourceBounds || this.getSafeTransformedVisibleBounds().dilated(2).roundedOut();

    // Unfortunately if we provide a resolution AND bounds, we can't use the source bounds directly.
    if (resolution !== 1) {
      transformedBounds = new Bounds2(resolution * transformedBounds.minX, resolution * transformedBounds.minY, resolution * transformedBounds.maxX, resolution * transformedBounds.maxY);
      // Compensate for non-integral transformedBounds after our resolution transform
      if (transformedBounds.width % 1 !== 0) {
        transformedBounds.maxX += 1 - transformedBounds.width % 1;
      }
      if (transformedBounds.height % 1 !== 0) {
        transformedBounds.maxY += 1 - transformedBounds.height % 1;
      }
    }
    let image = null;

    // NOTE: This callback is executed SYNCHRONOUSLY
    function callback(canvas, x, y, width, height) {
      const imageSource = options.useCanvas ? canvas : canvas.toDataURL();
      image = new Image(imageSource, combineOptions({}, options.imageOptions, {
        x: -x,
        y: -y,
        initialWidth: width,
        initialHeight: height
      }));

      // We need to prepend the scale due to order of operations
      image.scale(1 / resolution, 1 / resolution, true);
    }

    // NOTE: Rounding necessary due to floating point arithmetic in the width/height computation of the bounds
    wrapperNode.toCanvas(callback, -transformedBounds.minX, -transformedBounds.minY, Utils.roundSymmetric(transformedBounds.width), Utils.roundSymmetric(transformedBounds.height));
    assert && assert(image, 'The toCanvas should have executed synchronously');
    wrapperNode.dispose();

    // For our useTargetBounds option, we do NOT want to include any "safe" bounds, and instead want to stay true to
    // the original bounds. We do filter out invisible subtrees to set the bounds.
    let finalParentBounds = this.getVisibleBounds();
    if (sourceBounds) {
      // If we provide sourceBounds, don't have resulting bounds that go outside.
      finalParentBounds = sourceBounds.intersection(finalParentBounds);
    }
    if (options.useTargetBounds) {
      image.imageBounds = image.parentToLocalBounds(finalParentBounds);
    }
    if (options.wrap) {
      const wrappedNode = new Node({
        children: [image]
      }); // eslint-disable-line no-html-constructors
      if (options.useTargetBounds) {
        wrappedNode.localBounds = finalParentBounds;
      }
      return wrappedNode;
    } else {
      if (options.useTargetBounds) {
        image.localBounds = image.parentToLocalBounds(finalParentBounds);
      }
      return image;
    }
  }

  /**
   * Creates a DOM drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support DOM self drawables. There is no need to implement this for subtypes that
   * do not allow the DOM renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createDOMDrawable(renderer, instance) {
    throw new Error('createDOMDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates an SVG drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support SVG self drawables. There is no need to implement this for subtypes that
   * do not allow the SVG renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    throw new Error('createSVGDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates a Canvas drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support Canvas self drawables. There is no need to implement this for subtypes that
   * do not allow the Canvas renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    throw new Error('createCanvasDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates a WebGL drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support WebGL self drawables. There is no need to implement this for subtypes that
   * do not allow the WebGL renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createWebGLDrawable(renderer, instance) {
    throw new Error('createWebGLDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /*---------------------------------------------------------------------------*
   * Instance handling
   *----------------------------------------------------------------------------*/

  /**
   * Returns a reference to the instances array. (scenery-internal)
   */
  getInstances() {
    return this._instances;
  }

  /**
   * See getInstances() for more information (scenery-internal)
   */
  get instances() {
    return this.getInstances();
  }

  /**
   * Adds an Instance reference to our array. (scenery-internal)
   */
  addInstance(instance) {
    this._instances.push(instance);
    this.changedInstanceEmitter.emit(instance, true);
  }

  /**
   * Removes an Instance reference from our array. (scenery-internal)
   */
  removeInstance(instance) {
    const index = _.indexOf(this._instances, instance);
    assert && assert(index !== -1, 'Cannot remove a Instance from a Node if it was not there');
    this._instances.splice(index, 1);
    this.changedInstanceEmitter.emit(instance, false);
  }

  /**
   * Returns whether this Node was visually rendered/displayed by any Display in the last updateDisplay() call. Note
   * that something can be independently displayed visually, and in the PDOM; this method only checks visually.
   *
   * @param [display] - if provided, only check if was visible on this particular Display
   */
  wasVisuallyDisplayed(display) {
    for (let i = 0; i < this._instances.length; i++) {
      const instance = this._instances[i];

      // If no display is provided, any instance visibility is enough to be visually displayed
      if (instance.visible && (!display || instance.display === display)) {
        return true;
      }
    }
    return false;
  }

  /*---------------------------------------------------------------------------*
   * Display handling
   *----------------------------------------------------------------------------*/

  /**
   * Returns a reference to the display array. (scenery-internal)
   */
  getRootedDisplays() {
    return this._rootedDisplays;
  }

  /**
   * See getRootedDisplays() for more information (scenery-internal)
   */
  get rootedDisplays() {
    return this.getRootedDisplays();
  }

  /**
   * Adds an display reference to our array. (scenery-internal)
   */
  addRootedDisplay(display) {
    this._rootedDisplays.push(display);

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onAddedRootedDisplay(display);
    this.rootedDisplayChangedEmitter.emit(display);
  }

  /**
   * Removes a Display reference from our array. (scenery-internal)
   */
  removeRootedDisplay(display) {
    const index = _.indexOf(this._rootedDisplays, display);
    assert && assert(index !== -1, 'Cannot remove a Display from a Node if it was not there');
    this._rootedDisplays.splice(index, 1);

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onRemovedRootedDisplay(display);
    this.rootedDisplayChangedEmitter.emit(display);
  }
  getRecursiveConnectedDisplays(displays) {
    if (this.rootedDisplays.length) {
      displays.push(...this.rootedDisplays);
    }
    for (let i = 0; i < this._parents.length; i++) {
      displays.push(...this._parents[i].getRecursiveConnectedDisplays(displays));
    }

    // do not allow duplicate Displays to get collected infinitely
    return _.uniq(displays);
  }

  /**
   * Get a list of the displays that are connected to this Node. Gathered by looking up the scene graph ancestors and
   * collected all rooted Displays along the way.
   */
  getConnectedDisplays() {
    return _.uniq(this.getRecursiveConnectedDisplays([]));
  }

  /*---------------------------------------------------------------------------*
   * Coordinate transform methods
   *----------------------------------------------------------------------------*/

  /**
   * Returns a point transformed from our local coordinate frame into our parent coordinate frame. Applies our node's
   * transform to it.
   */
  localToParentPoint(point) {
    return this._transform.transformPosition2(point);
  }

  /**
   * Returns bounds transformed from our local coordinate frame into our parent coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   */
  localToParentBounds(bounds) {
    return this._transform.transformBounds2(bounds);
  }

  /**
   * Returns a point transformed from our parent coordinate frame into our local coordinate frame. Applies the inverse
   * of our node's transform to it.
   */
  parentToLocalPoint(point) {
    return this._transform.inversePosition2(point);
  }

  /**
   * Returns bounds transformed from our parent coordinate frame into our local coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   */
  parentToLocalBounds(bounds) {
    return this._transform.inverseBounds2(bounds);
  }

  /**
   * A mutable-optimized form of localToParentBounds() that will modify the provided bounds, transforming it from our
   * local coordinate frame to our parent coordinate frame.
   * @returns - The same bounds object.
   */
  transformBoundsFromLocalToParent(bounds) {
    return bounds.transform(this._transform.getMatrix());
  }

  /**
   * A mutable-optimized form of parentToLocalBounds() that will modify the provided bounds, transforming it from our
   * parent coordinate frame to our local coordinate frame.
   * @returns - The same bounds object.
   */
  transformBoundsFromParentToLocal(bounds) {
    return bounds.transform(this._transform.getInverse());
  }

  /**
   * Returns a new matrix (fresh copy) that would transform points from our local coordinate frame to the global
   * coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getLocalToGlobalMatrix() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this

    // we need to apply the transformations in the reverse order, so we temporarily store them
    const matrices = [];

    // concatenation like this has been faster than getting a unique trail, getting its transform, and applying it
    while (node) {
      matrices.push(node._transform.getMatrix());
      assert && assert(node._parents[1] === undefined, 'getLocalToGlobalMatrix unable to work for DAG');
      node = node._parents[0];
    }
    const matrix = Matrix3.identity(); // will be modified in place

    // iterate from the back forwards (from the root Node to here)
    for (let i = matrices.length - 1; i >= 0; i--) {
      matrix.multiplyMatrix(matrices[i]);
    }

    // NOTE: always return a fresh copy, getGlobalToLocalMatrix depends on it to minimize instance usage!
    return matrix;
  }

  /**
   * Returns a Transform3 that would transform things from our local coordinate frame to the global coordinate frame.
   * Equivalent to getUniqueTrail().getTransform(), but faster.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getUniqueTransform() {
    return new Transform3(this.getLocalToGlobalMatrix());
  }

  /**
   * Returns a new matrix (fresh copy) that would transform points from the global coordinate frame to our local
   * coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getGlobalToLocalMatrix() {
    return this.getLocalToGlobalMatrix().invert();
  }

  /**
   * Transforms a point from our local coordinate frame to the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  localToGlobalPoint(point) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this
    const resultPoint = point.copy();
    while (node) {
      // in-place multiplication
      node._transform.getMatrix().multiplyVector2(resultPoint);
      assert && assert(node._parents[1] === undefined, 'localToGlobalPoint unable to work for DAG');
      node = node._parents[0];
    }
    return resultPoint;
  }

  /**
   * Transforms a point from the global coordinate frame to our local coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToLocalPoint(point) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this
    // TODO: performance: test whether it is faster to get a total transform and then invert (won't compute individual inverses) https://github.com/phetsims/scenery/issues/1581

    // we need to apply the transformations in the reverse order, so we temporarily store them
    const transforms = [];
    while (node) {
      transforms.push(node._transform);
      assert && assert(node._parents[1] === undefined, 'globalToLocalPoint unable to work for DAG');
      node = node._parents[0];
    }

    // iterate from the back forwards (from the root Node to here)
    const resultPoint = point.copy();
    for (let i = transforms.length - 1; i >= 0; i--) {
      // in-place multiplication
      transforms[i].getInverse().multiplyVector2(resultPoint);
    }
    return resultPoint;
  }

  /**
   * Transforms bounds from our local coordinate frame to the global coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  localToGlobalBounds(bounds) {
    // apply the bounds transform only once, so we can minimize the expansion encountered from multiple rotations
    // it also seems to be a bit faster this way
    return bounds.transformed(this.getLocalToGlobalMatrix());
  }

  /**
   * Transforms bounds from the global coordinate frame to our local coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToLocalBounds(bounds) {
    // apply the bounds transform only once, so we can minimize the expansion encountered from multiple rotations
    return bounds.transformed(this.getGlobalToLocalMatrix());
  }

  /**
   * Transforms a point from our parent coordinate frame to the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  parentToGlobalPoint(point) {
    assert && assert(this.parents.length <= 1, 'parentToGlobalPoint unable to work for DAG');
    return this.parents.length ? this.parents[0].localToGlobalPoint(point) : point;
  }

  /**
   * Transforms bounds from our parent coordinate frame to the global coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  parentToGlobalBounds(bounds) {
    assert && assert(this.parents.length <= 1, 'parentToGlobalBounds unable to work for DAG');
    return this.parents.length ? this.parents[0].localToGlobalBounds(bounds) : bounds;
  }

  /**
   * Transforms a point from the global coordinate frame to our parent coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToParentPoint(point) {
    assert && assert(this.parents.length <= 1, 'globalToParentPoint unable to work for DAG');
    return this.parents.length ? this.parents[0].globalToLocalPoint(point) : point;
  }

  /**
   * Transforms bounds from the global coordinate frame to our parent coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToParentBounds(bounds) {
    assert && assert(this.parents.length <= 1, 'globalToParentBounds unable to work for DAG');
    return this.parents.length ? this.parents[0].globalToLocalBounds(bounds) : bounds;
  }

  /**
   * Returns a bounding box for this Node (and its sub-tree) in the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   *
   * NOTE: This requires computation of this node's subtree bounds, which may incur some performance loss.
   */
  getGlobalBounds() {
    assert && assert(this.parents.length <= 1, 'globalBounds unable to work for DAG');
    return this.parentToGlobalBounds(this.getBounds());
  }

  /**
   * See getGlobalBounds() for more information
   */
  get globalBounds() {
    return this.getGlobalBounds();
  }

  /**
   * Returns the bounds of any other Node in our local coordinate frame.
   *
   * NOTE: If this node or the passed in Node have multiple instances (e.g. this or one ancestor has two parents), it will fail
   * with an assertion.
   *
   * TODO: Possible to be well-defined and have multiple instances of each. https://github.com/phetsims/scenery/issues/1581
   */
  boundsOf(node) {
    return this.globalToLocalBounds(node.getGlobalBounds());
  }

  /**
   * Returns the bounds of this Node in another node's local coordinate frame.
   *
   * NOTE: If this node or the passed in Node have multiple instances (e.g. this or one ancestor has two parents), it will fail
   * with an assertion.
   *
   * TODO: Possible to be well-defined and have multiple instances of each. https://github.com/phetsims/scenery/issues/1581
   */
  boundsTo(node) {
    return node.globalToLocalBounds(this.getGlobalBounds());
  }

  /*---------------------------------------------------------------------------*
   * Drawable handling
   *----------------------------------------------------------------------------*/

  /**
   * Adds the drawable to our list of drawables to notify of visual changes. (scenery-internal)
   */
  attachDrawable(drawable) {
    this._drawables.push(drawable);
    return this; // allow chaining
  }

  /**
   * Removes the drawable from our list of drawables to notify of visual changes. (scenery-internal)
   */
  detachDrawable(drawable) {
    const index = _.indexOf(this._drawables, drawable);
    assert && assert(index >= 0, 'Invalid operation: trying to detach a non-referenced drawable');
    this._drawables.splice(index, 1); // TODO: replace with a remove() function https://github.com/phetsims/scenery/issues/1581
    return this;
  }

  /**
   * Scans the options object for key names that correspond to ES5 setters or other setter functions, and calls those
   * with the values.
   *
   * For example:
   *
   * node.mutate( { top: 0, left: 5 } );
   *
   * will be equivalent to:
   *
   * node.left = 5;
   * node.top = 0;
   *
   * In particular, note that the order is different. Mutators will be applied in the order of _mutatorKeys, which can
   * be added to by subtypes.
   *
   * Additionally, some keys are actually direct function names, like 'scale'. mutate( { scale: 2 } ) will call
   * node.scale( 2 ) instead of activating an ES5 setter directly.
   */
  mutate(options) {
    if (!options) {
      return this;
    }
    assert && assert(Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');

    // @ts-expect-error
    assert && assert(_.filter(['translation', 'x', 'left', 'right', 'centerX', 'centerTop', 'rightTop', 'leftCenter', 'center', 'rightCenter', 'leftBottom', 'centerBottom', 'rightBottom'], key => options[key] !== undefined).length <= 1, `More than one mutation on this Node set the x component, check ${Object.keys(options).join(',')}`);

    // @ts-expect-error
    assert && assert(_.filter(['translation', 'y', 'top', 'bottom', 'centerY', 'centerTop', 'rightTop', 'leftCenter', 'center', 'rightCenter', 'leftBottom', 'centerBottom', 'rightBottom'], key => options[key] !== undefined).length <= 1, `More than one mutation on this Node set the y component, check ${Object.keys(options).join(',')}`);
    if (assert && options.hasOwnProperty('enabled') && options.hasOwnProperty('enabledProperty')) {
      assert && assert(options.enabledProperty.value === options.enabled, 'If both enabled and enabledProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('inputEnabled') && options.hasOwnProperty('inputEnabledProperty')) {
      assert && assert(options.inputEnabledProperty.value === options.inputEnabled, 'If both inputEnabled and inputEnabledProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('visible') && options.hasOwnProperty('visibleProperty')) {
      assert && assert(options.visibleProperty.value === options.visible, 'If both visible and visibleProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('pdomVisible') && options.hasOwnProperty('pdomVisibleProperty')) {
      assert && assert(options.pdomVisibleProperty.value === options.pdomVisible, 'If both pdomVisible and pdomVisibleProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('pickable') && options.hasOwnProperty('pickableProperty')) {
      assert && assert(options.pickableProperty.value === options.pickable, 'If both pickable and pickableProperty are provided, then values should match');
    }
    const mutatorKeys = this._mutatorKeys;
    for (let i = 0; i < mutatorKeys.length; i++) {
      const key = mutatorKeys[i];

      // See https://github.com/phetsims/scenery/issues/580 for more about passing undefined.
      // @ts-expect-error
      assert && assert(!options.hasOwnProperty(key) || options[key] !== undefined, `Undefined not allowed for Node key: ${key}`);

      // @ts-expect-error - Hmm, better way to check this?
      if (options[key] !== undefined) {
        const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, key);

        // if the key refers to a function that is not ES5 writable, it will execute that function with the single argument
        if (descriptor && typeof descriptor.value === 'function') {
          // @ts-expect-error
          this[key](options[key]);
        } else {
          // @ts-expect-error
          this[key] = options[key];
        }
      }
    }
    this.initializePhetioObject(DEFAULT_PHET_IO_OBJECT_BASE_OPTIONS, options);
    return this; // allow chaining
  }
  initializePhetioObject(baseOptions, config) {
    // Track this, so we only override our visibleProperty once.
    const wasInstrumented = this.isPhetioInstrumented();
    super.initializePhetioObject(baseOptions, config);
    if (Tandem.PHET_IO_ENABLED && !wasInstrumented && this.isPhetioInstrumented()) {
      // For each supported TinyForwardingProperty, if a Property was already specified in the options (in the
      // constructor or mutate), then it will be set as this.targetProperty there. Here we only create the default
      // instrumented one if another hasn't already been specified.

      this._visibleProperty.initializePhetio(this, VISIBLE_PROPERTY_TANDEM_NAME, () => new BooleanProperty(this.visible, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        tandem: this.tandem.createTandem(VISIBLE_PROPERTY_TANDEM_NAME),
        phetioDocumentation: 'Controls whether the Node will be visible (and interactive).'
      }, config.visiblePropertyOptions)));
      this._enabledProperty.initializePhetio(this, ENABLED_PROPERTY_TANDEM_NAME, () => new EnabledProperty(this.enabled, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        phetioDocumentation: 'Sets whether the node is enabled. This will set whether input is enabled for this Node and ' + 'most often children as well. It will also control and toggle the "disabled look" of the node.',
        tandem: this.tandem.createTandem(ENABLED_PROPERTY_TANDEM_NAME)
      }, config.enabledPropertyOptions)));
      this._inputEnabledProperty.initializePhetio(this, INPUT_ENABLED_PROPERTY_TANDEM_NAME, () => new Property(this.inputEnabled, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        tandem: this.tandem.createTandem(INPUT_ENABLED_PROPERTY_TANDEM_NAME),
        phetioValueType: BooleanIO,
        phetioFeatured: true,
        // Since this property is opt-in, we typically only opt-in when it should be featured
        phetioDocumentation: 'Sets whether the element will have input enabled, and hence be interactive.'
      }, config.inputEnabledPropertyOptions)));
    }
  }

  /**
   * Set the visibility of this Node with respect to the Voicing feature. Totally separate from graphical display.
   * When visible, this Node and all of its ancestors will be able to speak with Voicing. When voicingVisible
   * is false, all Voicing under this Node will be muted. `voicingVisible` properties exist in Node.ts because
   * it is useful to set `voicingVisible` on a root that is composed with Voicing.ts. We cannot put all of the
   * Voicing.ts implementation in Node because that would have a massive memory impact. See Voicing.ts for more
   * information.
   */
  setVoicingVisible(visible) {
    if (this.voicingVisibleProperty.value !== visible) {
      this.voicingVisibleProperty.value = visible;
    }
  }
  set voicingVisible(visible) {
    this.setVoicingVisible(visible);
  }
  get voicingVisible() {
    return this.isVoicingVisible();
  }

  /**
   * Returns whether this Node is voicingVisible. When true Utterances for this Node can be announced with the
   * Voicing feature, see Voicing.ts for more information.
   */
  isVoicingVisible() {
    return this.voicingVisibleProperty.value;
  }

  /**
   * Override for extra information in the debugging output (from Display.getDebugHTML()). (scenery-internal)
   */
  getDebugHTMLExtras() {
    return '';
  }

  /**
   * Makes this Node's subtree available for inspection.
   */
  inspect() {
    localStorage.scenerySnapshot = JSON.stringify({
      type: 'Subtree',
      rootNodeId: this.id,
      nodes: serializeConnectedNodes(this)
    });
  }

  /**
   * Returns a debugging string that is an attempted serialization of this node's sub-tree.
   */
  toString() {
    return `${this.constructor.name}#${this.id}`;
  }

  /**
   * Performs checks to see if the internal state of Instance references is correct at a certain point in/after the
   * Display's updateDisplay(). (scenery-internal)
   */
  auditInstanceSubtreeForDisplay(display) {
    if (assertSlow) {
      const numInstances = this._instances.length;
      for (let i = 0; i < numInstances; i++) {
        const instance = this._instances[i];
        if (instance.display === display) {
          assertSlow(instance.trail.isValid(), `Invalid trail on Instance: ${instance.toString()} with trail ${instance.trail.toString()}`);
        }
      }

      // audit all of the children
      this.children.forEach(child => {
        child.auditInstanceSubtreeForDisplay(display);
      });
    }
  }

  /**
   * When we add or remove any number of bounds listeners, we want to increment/decrement internal information.
   *
   * @param deltaQuantity - If positive, the number of listeners being added, otherwise the number removed
   */
  onBoundsListenersAddedOrRemoved(deltaQuantity) {
    this.changeBoundsEventCount(deltaQuantity);
    this._boundsEventSelfCount += deltaQuantity;
  }

  /**
   * Disposes the node, releasing all references that it maintained.
   */
  dispose() {
    // remove all PDOM input listeners
    this.disposeParallelDOM();

    // When disposing, remove all children and parents. See https://github.com/phetsims/scenery/issues/629
    this.removeAllChildren();
    this.detach();

    // In opposite order of creation
    this._inputEnabledProperty.dispose();
    this._enabledProperty.dispose();
    this._pickableProperty.dispose();
    this._visibleProperty.dispose();

    // Tear-down in the reverse order Node was created
    super.dispose();
  }

  /**
   * Disposes this Node and all other descendant nodes.
   *
   * NOTE: Use with caution, as you should not re-use any Node touched by this. Not compatible with most DAG
   *       techniques.
   */
  disposeSubtree() {
    if (!this.isDisposed) {
      // makes a copy before disposing
      const children = this.children;
      this.dispose();
      for (let i = 0; i < children.length; i++) {
        children[i].disposeSubtree();
      }
    }
  }

  /**
   * A default for getTrails() searches, returns whether the Node has no parents.
   */
  static defaultTrailPredicate(node) {
    return node._parents.length === 0;
  }

  /**
   * A default for getLeafTrails() searches, returns whether the Node has no parents.
   */
  static defaultLeafTrailPredicate(node) {
    return node._children.length === 0;
  }
  // A mapping of all of the default options provided to Node
  static DEFAULT_NODE_OPTIONS = DEFAULT_OPTIONS;
}
Node.prototype._mutatorKeys = ACCESSIBILITY_OPTION_KEYS.concat(NODE_OPTION_KEYS);

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this Node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 *
 * Should be overridden by subtypes.
 */
Node.prototype.drawableMarkFlags = [];
scenery.register('Node', Node);

// {IOType}
Node.NodeIO = new IOType('NodeIO', {
  valueType: Node,
  documentation: 'The base type for graphical and potentially interactive objects.',
  metadataDefaults: {
    phetioState: PHET_IO_STATE_DEFAULT
  }
});
const DEFAULT_PHET_IO_OBJECT_BASE_OPTIONS = {
  phetioType: Node.NodeIO,
  phetioState: PHET_IO_STATE_DEFAULT
};

// A base class for a node in the Scenery scene graph. Supports general directed acyclic graphics (DAGs).
// Handles multiple layers with assorted types (Canvas 2D, SVG, DOM, WebGL, etc.).
// Note: We use interface extension, so we can't export Node at its declaration location
export default Node;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJFbmFibGVkUHJvcGVydHkiLCJQcm9wZXJ0eSIsIlRpbnlFbWl0dGVyIiwiVGlueUZvcndhcmRpbmdQcm9wZXJ0eSIsIlRpbnlQcm9wZXJ0eSIsIlRpbnlTdGF0aWNQcm9wZXJ0eSIsIkJvdW5kczIiLCJNYXRyaXgzIiwiVHJhbnNmb3JtMyIsIlZlY3RvcjIiLCJTaGFwZSIsImFycmF5RGlmZmVyZW5jZSIsImRlcHJlY2F0aW9uV2FybmluZyIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsIkJvb2xlYW5JTyIsIklPVHlwZSIsIkFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVMiLCJDYW52YXNDb250ZXh0V3JhcHBlciIsIkZlYXR1cmVzIiwiRmlsdGVyIiwiSW1hZ2UiLCJpc0hlaWdodFNpemFibGUiLCJpc1dpZHRoU2l6YWJsZSIsIk1vdXNlIiwiUGFyYWxsZWxET00iLCJQaWNrZXIiLCJSZW5kZXJlciIsIlJlbmRlcmVyU3VtbWFyeSIsInNjZW5lcnkiLCJzZXJpYWxpemVDb25uZWN0ZWROb2RlcyIsIlRyYWlsIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJvcHRpb25pemUzIiwiVXRpbHMiLCJnbG9iYWxJZENvdW50ZXIiLCJzY3JhdGNoQm91bmRzMiIsIk5PVEhJTkciLCJjb3B5Iiwic2NyYXRjaEJvdW5kczJFeHRyYSIsInNjcmF0Y2hNYXRyaXgzIiwiRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSIsIlRBTkRFTV9OQU1FIiwiVklTSUJMRV9QUk9QRVJUWV9UQU5ERU1fTkFNRSIsIklOUFVUX0VOQUJMRURfUFJPUEVSVFlfVEFOREVNX05BTUUiLCJQSEVUX0lPX1NUQVRFX0RFRkFVTFQiLCJtYXhQYXJlbnRDb3VudCIsIm1heENoaWxkQ291bnQiLCJSRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMiLCJOT0RFX09QVElPTl9LRVlTIiwiREVGQVVMVF9PUFRJT05TIiwicGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkIiwidmlzaWJsZSIsIm9wYWNpdHkiLCJkaXNhYmxlZE9wYWNpdHkiLCJwaWNrYWJsZSIsImVuYWJsZWQiLCJwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJpbnB1dEVuYWJsZWQiLCJwaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImNsaXBBcmVhIiwibW91c2VBcmVhIiwidG91Y2hBcmVhIiwiY3Vyc29yIiwidHJhbnNmb3JtQm91bmRzIiwibWF4V2lkdGgiLCJtYXhIZWlnaHQiLCJyZW5kZXJlciIsInVzZXNPcGFjaXR5IiwibGF5ZXJTcGxpdCIsImNzc1RyYW5zZm9ybSIsImV4Y2x1ZGVJbnZpc2libGUiLCJ3ZWJnbFNjYWxlIiwicHJldmVudEZpdCIsIkRFRkFVTFRfSU5URVJOQUxfUkVOREVSRVIiLCJmcm9tTmFtZSIsIk5vZGUiLCJjaGlsZHJlbkNoYW5nZWRFbWl0dGVyIiwiY2hpbGRJbnNlcnRlZEVtaXR0ZXIiLCJjaGlsZFJlbW92ZWRFbWl0dGVyIiwiY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyIiwicGFyZW50QWRkZWRFbWl0dGVyIiwicGFyZW50UmVtb3ZlZEVtaXR0ZXIiLCJ0cmFuc2Zvcm1FbWl0dGVyIiwiaW5zdGFuY2VSZWZyZXNoRW1pdHRlciIsInJlbmRlcmVyU3VtbWFyeVJlZnJlc2hFbWl0dGVyIiwiZmlsdGVyQ2hhbmdlRW1pdHRlciIsImNoYW5nZWRJbnN0YW5jZUVtaXR0ZXIiLCJyb290ZWREaXNwbGF5Q2hhbmdlZEVtaXR0ZXIiLCJsYXlvdXRPcHRpb25zQ2hhbmdlZEVtaXR0ZXIiLCJfYWN0aXZlUGFyZW50TGF5b3V0Q29uc3RyYWludCIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsIl9pZCIsIl9pbnN0YW5jZXMiLCJfcm9vdGVkRGlzcGxheXMiLCJfZHJhd2FibGVzIiwiX3Zpc2libGVQcm9wZXJ0eSIsIm9uVmlzaWJsZVByb3BlcnR5Q2hhbmdlIiwiYmluZCIsIm9wYWNpdHlQcm9wZXJ0eSIsIm9uT3BhY2l0eVByb3BlcnR5Q2hhbmdlIiwiZGlzYWJsZWRPcGFjaXR5UHJvcGVydHkiLCJvbkRpc2FibGVkT3BhY2l0eVByb3BlcnR5Q2hhbmdlIiwiX3BpY2thYmxlUHJvcGVydHkiLCJvblBpY2thYmxlUHJvcGVydHlDaGFuZ2UiLCJfZW5hYmxlZFByb3BlcnR5Iiwib25FbmFibGVkUHJvcGVydHlDaGFuZ2UiLCJfaW5wdXRFbmFibGVkUHJvcGVydHkiLCJjbGlwQXJlYVByb3BlcnR5Iiwidm9pY2luZ1Zpc2libGVQcm9wZXJ0eSIsIl9tb3VzZUFyZWEiLCJfdG91Y2hBcmVhIiwiX2N1cnNvciIsIl9jaGlsZHJlbiIsIl9wYXJlbnRzIiwiX3RyYW5zZm9ybUJvdW5kcyIsIl90cmFuc2Zvcm0iLCJfdHJhbnNmb3JtTGlzdGVuZXIiLCJvblRyYW5zZm9ybUNoYW5nZSIsImNoYW5nZUVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsIl9tYXhXaWR0aCIsIl9tYXhIZWlnaHQiLCJfYXBwbGllZFNjYWxlRmFjdG9yIiwiX2lucHV0TGlzdGVuZXJzIiwiX3JlbmRlcmVyIiwiX3VzZXNPcGFjaXR5IiwiX2xheWVyU3BsaXQiLCJfY3NzVHJhbnNmb3JtIiwiX2V4Y2x1ZGVJbnZpc2libGUiLCJfd2ViZ2xTY2FsZSIsIl9wcmV2ZW50Rml0IiwiaW5wdXRFbmFibGVkUHJvcGVydHkiLCJsYXp5TGluayIsInBkb21Cb3VuZElucHV0RW5hYmxlZExpc3RlbmVyIiwiYm91bmRzTGlzdGVuZXJzQWRkZWRPclJlbW92ZWRMaXN0ZW5lciIsIm9uQm91bmRzTGlzdGVuZXJzQWRkZWRPclJlbW92ZWQiLCJib3VuZHNJbnZhbGlkYXRpb25MaXN0ZW5lciIsInZhbGlkYXRlQm91bmRzIiwic2VsZkJvdW5kc0ludmFsaWRhdGlvbkxpc3RlbmVyIiwidmFsaWRhdGVTZWxmQm91bmRzIiwiYm91bmRzUHJvcGVydHkiLCJjaGFuZ2VDb3VudCIsImxvY2FsQm91bmRzUHJvcGVydHkiLCJjaGlsZEJvdW5kc1Byb3BlcnR5Iiwic2VsZkJvdW5kc1Byb3BlcnR5IiwiX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiIsIl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwiX2xheW91dE9wdGlvbnMiLCJfYm91bmRzRGlydHkiLCJfbG9jYWxCb3VuZHNEaXJ0eSIsIl9zZWxmQm91bmRzRGlydHkiLCJfY2hpbGRCb3VuZHNEaXJ0eSIsImFzc2VydCIsIl9vcmlnaW5hbEJvdW5kcyIsIl92YWx1ZSIsIl9vcmlnaW5hbExvY2FsQm91bmRzIiwiX29yaWdpbmFsU2VsZkJvdW5kcyIsIl9vcmlnaW5hbENoaWxkQm91bmRzIiwiX2ZpbHRlcnMiLCJfcmVuZGVyZXJCaXRtYXNrIiwiYml0bWFza05vZGVEZWZhdWx0IiwiX3JlbmRlcmVyU3VtbWFyeSIsIl9ib3VuZHNFdmVudENvdW50IiwiX2JvdW5kc0V2ZW50U2VsZkNvdW50IiwiX3BpY2tlciIsIl9pc0dldHRpbmdSZW1vdmVkRnJvbVBhcmVudCIsIm11dGF0ZSIsImluc2VydENoaWxkIiwiaW5kZXgiLCJub2RlIiwiaXNDb21wb3NpdGUiLCJ1bmRlZmluZWQiLCJfIiwiaW5jbHVkZXMiLCJpc0Rpc3Bvc2VkIiwib25JbnNlcnRDaGlsZCIsImNoYW5nZUJvdW5kc0V2ZW50Q291bnQiLCJzdW1tYXJ5Q2hhbmdlIiwiYml0bWFza0FsbCIsImJpdG1hc2siLCJwdXNoIiwid2luZG93IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJpc0Zpbml0ZSIsInBhcmVudExpbWl0IiwicGFyZW50Q291bnQiLCJsZW5ndGgiLCJjb25zb2xlIiwibG9nIiwic3BsaWNlIiwiY2hpbGRMaW1pdCIsImNoaWxkQ291bnQiLCJoYXNOb1BET00iLCJvblBET01BZGRDaGlsZCIsImludmFsaWRhdGVCb3VuZHMiLCJlbWl0IiwiYXNzZXJ0U2xvdyIsImF1ZGl0IiwiYWRkQ2hpbGQiLCJyZW1vdmVDaGlsZCIsImhhc0NoaWxkIiwiaW5kZXhPZkNoaWxkIiwiaW5kZXhPZiIsInJlbW92ZUNoaWxkV2l0aEluZGV4IiwicmVtb3ZlQ2hpbGRBdCIsImluZGV4T2ZQYXJlbnQiLCJvblBET01SZW1vdmVDaGlsZCIsIm9uUmVtb3ZlQ2hpbGQiLCJtb3ZlQ2hpbGRUb0luZGV4IiwiY3VycmVudEluZGV4Iiwib25QRE9NUmVvcmRlcmVkQ2hpbGRyZW4iLCJNYXRoIiwibWluIiwibWF4IiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJzZXRDaGlsZHJlbiIsImNoaWxkcmVuIiwiYmVmb3JlT25seSIsImFmdGVyT25seSIsImluQm90aCIsImkiLCJtaW5DaGFuZ2VJbmRleCIsIm1heENoYW5nZUluZGV4IiwiZGVzaXJlZCIsImhhc1Jlb3JkZXJpbmdDaGFuZ2UiLCJhZnRlckluZGV4IiwiYWZ0ZXIiLCJqIiwidmFsdWUiLCJnZXRDaGlsZHJlbiIsInNsaWNlIiwiZ2V0Q2hpbGRyZW5Db3VudCIsImdldFBhcmVudHMiLCJwYXJlbnRzIiwiZ2V0UGFyZW50IiwicGFyZW50IiwiZ2V0Q2hpbGRBdCIsImNoaWxkIiwibW92ZVRvRnJvbnQiLCJlYWNoIiwibW92ZUNoaWxkVG9Gcm9udCIsIm1vdmVGb3J3YXJkIiwiZm9yRWFjaCIsIm1vdmVDaGlsZEZvcndhcmQiLCJtb3ZlQmFja3dhcmQiLCJtb3ZlQ2hpbGRCYWNrd2FyZCIsIm1vdmVUb0JhY2siLCJtb3ZlQ2hpbGRUb0JhY2siLCJyZXBsYWNlQ2hpbGQiLCJvbGRDaGlsZCIsIm5ld0NoaWxkIiwib2xkQ2hpbGRGb2N1c2VkIiwiZm9jdXNlZCIsImZvY3VzYWJsZSIsImZvY3VzIiwiZGV0YWNoIiwibiIsInplcm9CZWZvcmUiLCJ6ZXJvQWZ0ZXIiLCJwYXJlbnREZWx0YSIsImxlbiIsIm9sZFNlbGZCb3VuZHMiLCJzZXQiLCJkaWRTZWxmQm91bmRzQ2hhbmdlIiwidXBkYXRlU2VsZkJvdW5kcyIsIm5vdGlmeUxpc3RlbmVycyIsInNjZW5lcnlMb2ciLCJib3VuZHMiLCJub3RpZmljYXRpb25UaHJlc2hvbGQiLCJ3YXNEaXJ0eUJlZm9yZSIsIm91ckNoaWxkQm91bmRzIiwib3VyTG9jYWxCb3VuZHMiLCJvdXJTZWxmQm91bmRzIiwib3VyQm91bmRzIiwib2xkQ2hpbGRCb3VuZHMiLCJpc1Zpc2libGUiLCJpbmNsdWRlQm91bmRzIiwiZXF1YWxzIiwiZXF1YWxzRXBzaWxvbiIsIm9sZExvY2FsQm91bmRzIiwiY29uc3RyYWluQm91bmRzIiwidXBkYXRlTWF4RGltZW5zaW9uIiwib2xkQm91bmRzIiwiZ2V0TWF0cml4IiwiaXNBeGlzQWxpZ25lZCIsIm1hdHJpeCIsIl9pbmNsdWRlVHJhbnNmb3JtZWRTdWJ0cmVlQm91bmRzIiwiZ2V0Qm91bmRzV2l0aFRyYW5zZm9ybSIsInRyYW5zZm9ybUJvdW5kc0Zyb21Mb2NhbFRvUGFyZW50IiwiZXBzaWxvbiIsImNoaWxkQm91bmRzIiwibG9jYWxCb3VuZHMiLCJ1bmlvbiIsImludGVyc2VjdGlvbiIsImZ1bGxCb3VuZHMiLCJsb2NhbFRvUGFyZW50Qm91bmRzIiwidG9TdHJpbmciLCJwb3AiLCJzZWxmQm91bmRzIiwiaXNFbXB0eSIsImdldFRyYW5zZm9ybWVkU2VsZkJvdW5kcyIsIm51bUNoaWxkcmVuIiwibXVsdGlwbHlNYXRyaXgiLCJnZXRJbnZlcnNlIiwidmFsaWRhdGVXYXRjaGVkQm91bmRzIiwid2F0Y2hlZEJvdW5kc1NjYW4iLCJjaGFuZ2VkIiwiaW52YWxpZGF0ZUNoaWxkQm91bmRzIiwiaW52YWxpZGF0ZVNlbGYiLCJuZXdTZWxmQm91bmRzIiwib25TZWxmQm91bmRzRGlydHkiLCJwb3RlbnRpYWxDaGlsZCIsImlzT3VyQ2hpbGQiLCJnZXRTZWxmU2hhcGUiLCJnZXRTZWxmQm91bmRzIiwiZ2V0U2FmZVNlbGZCb3VuZHMiLCJzYWZlU2VsZkJvdW5kcyIsImdldENoaWxkQm91bmRzIiwiZ2V0TG9jYWxCb3VuZHMiLCJzZXRMb2NhbEJvdW5kcyIsImxvY2FsQm91bmRzT3ZlcnJpZGRlbiIsImlzTmFOIiwibWluWCIsIm1pblkiLCJtYXhYIiwibWF4WSIsInRyYW5zZm9ybWVkIiwiZ2V0VHJhbnNmb3JtZWRTYWZlU2VsZkJvdW5kcyIsImdldFNhZmVUcmFuc2Zvcm1lZFZpc2libGVCb3VuZHMiLCJsb2NhbE1hdHJpeCIsIklERU5USVRZIiwidGltZXNNYXRyaXgiLCJ2aXNpYmxlUHJvcGVydHkiLCJzYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzIiwic2V0VHJhbnNmb3JtQm91bmRzIiwiZ2V0VHJhbnNmb3JtQm91bmRzIiwiZ2V0Qm91bmRzIiwiZ2V0VmlzaWJsZUxvY2FsQm91bmRzIiwiZ2V0VmlzaWJsZUJvdW5kcyIsInZpc2libGVMb2NhbEJvdW5kcyIsInRyYW5zZm9ybSIsInZpc2libGVCb3VuZHMiLCJoaXRUZXN0IiwicG9pbnQiLCJpc01vdXNlIiwiaXNUb3VjaCIsInRyYWlsVW5kZXJQb2ludGVyIiwicG9pbnRlciIsImlzVG91Y2hMaWtlIiwiY29udGFpbnNQb2ludCIsImNvbnRhaW5zUG9pbnRTZWxmIiwiaW50ZXJzZWN0c0JvdW5kc1NlbGYiLCJpbnRlcnNlY3RzQm91bmRzIiwiaXNQaGV0aW9Nb3VzZUhpdHRhYmxlIiwiaXNBbnlEZXNjZW5kYW50QVBoZXRpb01vdXNlSGl0VGFyZ2V0IiwidGltZXNWZWN0b3IyIiwiZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQiLCJzb21lIiwiZ2V0UGhldGlvTW91c2VIaXQiLCJsb2NhbFBvaW50IiwiY2hpbGRIaXRXaXRob3V0VGFyZ2V0IiwiY2hpbGRUYXJnZXRIaXQiLCJpc1BhaW50ZWQiLCJhcmVTZWxmQm91bmRzVmFsaWQiLCJoYXNQYXJlbnQiLCJoYXNDaGlsZHJlbiIsImlzQ2hpbGRJbmNsdWRlZEluTGF5b3V0IiwiaXNWYWxpZCIsIndhbGtEZXB0aEZpcnN0IiwiY2FsbGJhY2siLCJhZGRJbnB1dExpc3RlbmVyIiwibGlzdGVuZXIiLCJvbkFkZElucHV0TGlzdGVuZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwib25SZW1vdmVJbnB1dExpc3RlbmVyIiwiaGFzSW5wdXRMaXN0ZW5lciIsImludGVycnVwdElucHV0IiwibGlzdGVuZXJzQ29weSIsImlucHV0TGlzdGVuZXJzIiwiaW50ZXJydXB0IiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwidHJhbnNsYXRlIiwieCIsInkiLCJwcmVwZW5kSW5zdGVhZCIsImFicyIsInByZXBlbmRUcmFuc2xhdGlvbiIsImFwcGVuZE1hdHJpeCIsInNldFRvVHJhbnNsYXRpb24iLCJ2ZWN0b3IiLCJzY2FsZSIsInByZXBlbmRNYXRyaXgiLCJzY2FsaW5nIiwicm90YXRlIiwiYW5nbGUiLCJQSSIsInJvdGF0aW9uMiIsInJvdGF0ZUFyb3VuZCIsInRyYW5zbGF0aW9uIiwic2V0WCIsImdldFgiLCJtMDIiLCJzZXRZIiwiZ2V0WSIsIm0xMiIsInNldFNjYWxlTWFnbml0dWRlIiwiYSIsImIiLCJjdXJyZW50U2NhbGUiLCJnZXRTY2FsZVZlY3RvciIsInNldFJvdGF0aW9uIiwicm90YXRpb24iLCJzZXRUb1JvdGF0aW9uWiIsImdldFJvdGF0aW9uIiwic2V0VHJhbnNsYXRpb24iLCJtIiwidHgiLCJ0eSIsImR4IiwiZHkiLCJnZXRUcmFuc2xhdGlvbiIsImdldERldGVybWluYW50IiwiYXBwZW5kIiwicHJlcGVuZCIsInNldE1hdHJpeCIsImdldFRyYW5zZm9ybSIsInJlc2V0VHJhbnNmb3JtIiwib25TdW1tYXJ5Q2hhbmdlIiwib2xkQml0bWFzayIsIm5ld0JpdG1hc2siLCJfcGRvbURpc3BsYXlzSW5mbyIsImF1ZGl0TWF4RGltZW5zaW9ucyIsImlkZWFsU2NhbGUiLCJ3aWR0aCIsImhlaWdodCIsInNjYWxlQWRqdXN0bWVudCIsInByZWZlcnJlZFdpZHRoIiwicHJlZmVycmVkSGVpZ2h0Iiwib25NYXhEaW1lbnNpb25DaGFuZ2UiLCJiZWZvcmVNYXhMZW5ndGgiLCJhZnRlck1heExlbmd0aCIsInNldE1heFdpZHRoIiwiZ2V0TWF4V2lkdGgiLCJzZXRNYXhIZWlnaHQiLCJnZXRNYXhIZWlnaHQiLCJzZXRMZWZ0IiwibGVmdCIsImN1cnJlbnRMZWZ0IiwiZ2V0TGVmdCIsInNldFJpZ2h0IiwicmlnaHQiLCJjdXJyZW50UmlnaHQiLCJnZXRSaWdodCIsInNldENlbnRlclgiLCJjdXJyZW50Q2VudGVyWCIsImdldENlbnRlclgiLCJjZW50ZXJYIiwic2V0Q2VudGVyWSIsImN1cnJlbnRDZW50ZXJZIiwiZ2V0Q2VudGVyWSIsImNlbnRlclkiLCJzZXRUb3AiLCJ0b3AiLCJjdXJyZW50VG9wIiwiZ2V0VG9wIiwic2V0Qm90dG9tIiwiYm90dG9tIiwiY3VycmVudEJvdHRvbSIsImdldEJvdHRvbSIsInNldExlZnRUb3AiLCJsZWZ0VG9wIiwiY3VycmVudExlZnRUb3AiLCJnZXRMZWZ0VG9wIiwibWludXMiLCJzZXRDZW50ZXJUb3AiLCJjZW50ZXJUb3AiLCJjdXJyZW50Q2VudGVyVG9wIiwiZ2V0Q2VudGVyVG9wIiwic2V0UmlnaHRUb3AiLCJyaWdodFRvcCIsImN1cnJlbnRSaWdodFRvcCIsImdldFJpZ2h0VG9wIiwic2V0TGVmdENlbnRlciIsImxlZnRDZW50ZXIiLCJjdXJyZW50TGVmdENlbnRlciIsImdldExlZnRDZW50ZXIiLCJzZXRDZW50ZXIiLCJjZW50ZXIiLCJjdXJyZW50Q2VudGVyIiwiZ2V0Q2VudGVyIiwic2V0UmlnaHRDZW50ZXIiLCJyaWdodENlbnRlciIsImN1cnJlbnRSaWdodENlbnRlciIsImdldFJpZ2h0Q2VudGVyIiwic2V0TGVmdEJvdHRvbSIsImxlZnRCb3R0b20iLCJjdXJyZW50TGVmdEJvdHRvbSIsImdldExlZnRCb3R0b20iLCJzZXRDZW50ZXJCb3R0b20iLCJjZW50ZXJCb3R0b20iLCJjdXJyZW50Q2VudGVyQm90dG9tIiwiZ2V0Q2VudGVyQm90dG9tIiwic2V0UmlnaHRCb3R0b20iLCJyaWdodEJvdHRvbSIsImN1cnJlbnRSaWdodEJvdHRvbSIsImdldFJpZ2h0Qm90dG9tIiwiZ2V0V2lkdGgiLCJnZXRIZWlnaHQiLCJnZXRMb2NhbFdpZHRoIiwibG9jYWxXaWR0aCIsImdldExvY2FsSGVpZ2h0IiwibG9jYWxIZWlnaHQiLCJnZXRMb2NhbExlZnQiLCJsb2NhbExlZnQiLCJnZXRMb2NhbFJpZ2h0IiwibG9jYWxSaWdodCIsImdldExvY2FsQ2VudGVyWCIsImxvY2FsQ2VudGVyWCIsImdldExvY2FsQ2VudGVyWSIsImxvY2FsQ2VudGVyWSIsImdldExvY2FsVG9wIiwibG9jYWxUb3AiLCJnZXRMb2NhbEJvdHRvbSIsImxvY2FsQm90dG9tIiwiZ2V0TG9jYWxMZWZ0VG9wIiwibG9jYWxMZWZ0VG9wIiwiZ2V0TG9jYWxDZW50ZXJUb3AiLCJsb2NhbENlbnRlclRvcCIsImdldExvY2FsUmlnaHRUb3AiLCJsb2NhbFJpZ2h0VG9wIiwiZ2V0TG9jYWxMZWZ0Q2VudGVyIiwibG9jYWxMZWZ0Q2VudGVyIiwiZ2V0TG9jYWxDZW50ZXIiLCJsb2NhbENlbnRlciIsImdldExvY2FsUmlnaHRDZW50ZXIiLCJsb2NhbFJpZ2h0Q2VudGVyIiwiZ2V0TG9jYWxMZWZ0Qm90dG9tIiwibG9jYWxMZWZ0Qm90dG9tIiwiZ2V0TG9jYWxDZW50ZXJCb3R0b20iLCJsb2NhbENlbnRlckJvdHRvbSIsImdldExvY2FsUmlnaHRCb3R0b20iLCJsb2NhbFJpZ2h0Qm90dG9tIiwiZ2V0SWQiLCJpZCIsIm9uVmlzaWJpbGl0eUNoYW5nZSIsInNldFZpc2libGVQcm9wZXJ0eSIsIm5ld1RhcmdldCIsInNldFRhcmdldFByb3BlcnR5IiwicHJvcGVydHkiLCJnZXRWaXNpYmxlUHJvcGVydHkiLCJzZXRWaXNpYmxlIiwic2V0UGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkIiwic2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQiLCJnZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJnZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInN3YXBWaXNpYmlsaXR5Iiwib3RoZXJOb2RlIiwidmlzaWJsZU5vZGUiLCJpbnZpc2libGVOb2RlIiwidmlzaWJsZU5vZGVGb2N1c2VkIiwic2V0T3BhY2l0eSIsIkVycm9yIiwiZ2V0T3BhY2l0eSIsInNldERpc2FibGVkT3BhY2l0eSIsImdldERpc2FibGVkT3BhY2l0eSIsImdldEVmZmVjdGl2ZU9wYWNpdHkiLCJlbmFibGVkUHJvcGVydHkiLCJlZmZlY3RpdmVPcGFjaXR5Iiwic2V0RmlsdGVycyIsImZpbHRlcnMiLCJBcnJheSIsImlzQXJyYXkiLCJldmVyeSIsImZpbHRlciIsImludmFsaWRhdGVIaW50IiwiZ2V0RmlsdGVycyIsInNldFBpY2thYmxlUHJvcGVydHkiLCJwaWNrYWJsZVByb3BlcnR5IiwiZ2V0UGlja2FibGVQcm9wZXJ0eSIsInNldFBpY2thYmxlIiwiaXNQaWNrYWJsZSIsIm9sZFBpY2thYmxlIiwib25QaWNrYWJsZUNoYW5nZSIsInNldEVuYWJsZWRQcm9wZXJ0eSIsImdldEVuYWJsZWRQcm9wZXJ0eSIsInNldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImdldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInNldEVuYWJsZWQiLCJpc0VuYWJsZWQiLCJzZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSIsImdldElucHV0RW5hYmxlZFByb3BlcnR5Iiwic2V0UGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJnZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInNldElucHV0RW5hYmxlZCIsImlzSW5wdXRFbmFibGVkIiwic2V0SW5wdXRMaXN0ZW5lcnMiLCJnZXRJbnB1dExpc3RlbmVycyIsInNldEN1cnNvciIsImdldEN1cnNvciIsImdldEVmZmVjdGl2ZUN1cnNvciIsImlucHV0TGlzdGVuZXIiLCJzZXRNb3VzZUFyZWEiLCJhcmVhIiwib25Nb3VzZUFyZWFDaGFuZ2UiLCJnZXRNb3VzZUFyZWEiLCJzZXRUb3VjaEFyZWEiLCJvblRvdWNoQXJlYUNoYW5nZSIsImdldFRvdWNoQXJlYSIsInNldENsaXBBcmVhIiwic2hhcGUiLCJvbkNsaXBBcmVhQ2hhbmdlIiwiZ2V0Q2xpcEFyZWEiLCJoYXNDbGlwQXJlYSIsInNldFJlbmRlcmVyQml0bWFzayIsInNlbGZDaGFuZ2UiLCJpbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzIiwic2V0UmVuZGVyZXIiLCJuZXdSZW5kZXJlciIsImJpdG1hc2tDYW52YXMiLCJiaXRtYXNrU1ZHIiwiYml0bWFza0RPTSIsImJpdG1hc2tXZWJHTCIsImdldFJlbmRlcmVyIiwic2V0TGF5ZXJTcGxpdCIsInNwbGl0IiwiaXNMYXllclNwbGl0Iiwic2V0VXNlc09wYWNpdHkiLCJnZXRVc2VzT3BhY2l0eSIsInNldENTU1RyYW5zZm9ybSIsImlzQ1NTVHJhbnNmb3JtZWQiLCJzZXRFeGNsdWRlSW52aXNpYmxlIiwiaXNFeGNsdWRlSW52aXNpYmxlIiwic2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsImV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMiLCJpc0V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMiLCJzZXRMYXlvdXRPcHRpb25zIiwibGF5b3V0T3B0aW9ucyIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwiZ2V0TGF5b3V0T3B0aW9ucyIsIm11dGF0ZUxheW91dE9wdGlvbnMiLCJ3aWR0aFNpemFibGUiLCJoZWlnaHRTaXphYmxlIiwiZXh0ZW5kc1dpZHRoU2l6YWJsZSIsImV4dGVuZHNIZWlnaHRTaXphYmxlIiwiZXh0ZW5kc1NpemFibGUiLCJzZXRQcmV2ZW50Rml0IiwiaXNQcmV2ZW50Rml0Iiwic2V0V2ViR0xTY2FsZSIsImdldFdlYkdMU2NhbGUiLCJnZXRVbmlxdWVUcmFpbCIsInByZWRpY2F0ZSIsInRyYWlsIiwiYWRkQW5jZXN0b3IiLCJ0cmFpbHMiLCJnZXRUcmFpbHMiLCJnZXRVbmlxdWVUcmFpbFRvIiwicm9vdE5vZGUiLCJkZWZhdWx0VHJhaWxQcmVkaWNhdGUiLCJhcHBlbmRBbmNlc3RvclRyYWlsc1dpdGhQcmVkaWNhdGUiLCJnZXRUcmFpbHNUbyIsImdldExlYWZUcmFpbHMiLCJkZWZhdWx0TGVhZlRyYWlsUHJlZGljYXRlIiwiYXBwZW5kRGVzY2VuZGFudFRyYWlsc1dpdGhQcmVkaWNhdGUiLCJnZXRMZWFmVHJhaWxzVG8iLCJsZWFmTm9kZSIsImdldFVuaXF1ZUxlYWZUcmFpbCIsImdldFVuaXF1ZUxlYWZUcmFpbFRvIiwiZ2V0Q29ubmVjdGVkTm9kZXMiLCJyZXN1bHQiLCJmcmVzaCIsImNvbmNhdCIsImdldFN1YnRyZWVOb2RlcyIsImdldFRvcG9sb2dpY2FsbHlTb3J0ZWROb2RlcyIsImVkZ2VzIiwicyIsImwiLCJoYW5kbGVDaGlsZCIsImZpbmFsIiwiY2FuQWRkQ2hpbGQiLCJjYW52YXNQYWludFNlbGYiLCJ3cmFwcGVyIiwicmVuZGVyVG9DYW52YXNTZWxmIiwicmVuZGVyVG9DYW52YXNTdWJ0cmVlIiwiaWRlbnRpdHkiLCJyZXNldFN0eWxlcyIsInJlcXVpcmVzU2NyYXRjaENhbnZhcyIsImNvbnRleHQiLCJzYXZlIiwiY2FudmFzU2V0VHJhbnNmb3JtIiwiY2hpbGRDYW52YXNCb3VuZHMiLCJkaWxhdGUiLCJyb3VuZE91dCIsInNldE1pbk1heCIsImNhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImdldENvbnRleHQiLCJjaGlsZFdyYXBwZXIiLCJzdWJNYXRyaXgiLCJiZWdpblBhdGgiLCJ3cml0ZVRvQ29udGV4dCIsImNsaXAiLCJzZXRUcmFuc2Zvcm0iLCJnbG9iYWxBbHBoYSIsInNldEZpbHRlciIsImNhbnZhc0ZpbHRlciIsImlzRE9NQ29tcGF0aWJsZSIsIm1hcCIsImdldENTU0ZpbHRlclN0cmluZyIsImpvaW4iLCJhcHBseUNhbnZhc0ZpbHRlciIsImRyYXdJbWFnZSIsInJlc3RvcmUiLCJyZW5kZXJUb0NhbnZhcyIsImJhY2tncm91bmRDb2xvciIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwidG9DYW52YXMiLCJwYWRkaW5nIiwiY2VpbCIsImNhbnZhc0FwcGVuZFRyYW5zZm9ybSIsInRvRGF0YVVSTCIsInRvSW1hZ2UiLCJ1cmwiLCJpbWciLCJvbmxvYWQiLCJlIiwic3JjIiwidG9JbWFnZU5vZGVBc3luY2hyb25vdXMiLCJpbWFnZSIsInRvQ2FudmFzTm9kZVN5bmNocm9ub3VzIiwidG9EYXRhVVJMSW1hZ2VTeW5jaHJvbm91cyIsImRhdGFVUkwiLCJpbml0aWFsV2lkdGgiLCJpbml0aWFsSGVpZ2h0IiwidG9EYXRhVVJMTm9kZVN5bmNocm9ub3VzIiwicmFzdGVyaXplZCIsInByb3ZpZGVkT3B0aW9ucyIsInJlc29sdXRpb24iLCJzb3VyY2VCb3VuZHMiLCJ1c2VUYXJnZXRCb3VuZHMiLCJ3cmFwIiwidXNlQ2FudmFzIiwiaW1hZ2VPcHRpb25zIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwid3JhcHBlck5vZGUiLCJ0cmFuc2Zvcm1lZEJvdW5kcyIsImRpbGF0ZWQiLCJyb3VuZGVkT3V0IiwiaW1hZ2VTb3VyY2UiLCJyb3VuZFN5bW1ldHJpYyIsImRpc3Bvc2UiLCJmaW5hbFBhcmVudEJvdW5kcyIsImltYWdlQm91bmRzIiwicGFyZW50VG9Mb2NhbEJvdW5kcyIsIndyYXBwZWROb2RlIiwiY3JlYXRlRE9NRHJhd2FibGUiLCJpbnN0YW5jZSIsImNyZWF0ZVNWR0RyYXdhYmxlIiwiY3JlYXRlQ2FudmFzRHJhd2FibGUiLCJjcmVhdGVXZWJHTERyYXdhYmxlIiwiZ2V0SW5zdGFuY2VzIiwiaW5zdGFuY2VzIiwiYWRkSW5zdGFuY2UiLCJyZW1vdmVJbnN0YW5jZSIsIndhc1Zpc3VhbGx5RGlzcGxheWVkIiwiZGlzcGxheSIsImdldFJvb3RlZERpc3BsYXlzIiwicm9vdGVkRGlzcGxheXMiLCJhZGRSb290ZWREaXNwbGF5Iiwib25BZGRlZFJvb3RlZERpc3BsYXkiLCJyZW1vdmVSb290ZWREaXNwbGF5Iiwib25SZW1vdmVkUm9vdGVkRGlzcGxheSIsImdldFJlY3Vyc2l2ZUNvbm5lY3RlZERpc3BsYXlzIiwiZGlzcGxheXMiLCJ1bmlxIiwiZ2V0Q29ubmVjdGVkRGlzcGxheXMiLCJsb2NhbFRvUGFyZW50UG9pbnQiLCJ0cmFuc2Zvcm1Qb3NpdGlvbjIiLCJ0cmFuc2Zvcm1Cb3VuZHMyIiwicGFyZW50VG9Mb2NhbFBvaW50IiwiaW52ZXJzZVBvc2l0aW9uMiIsImludmVyc2VCb3VuZHMyIiwidHJhbnNmb3JtQm91bmRzRnJvbVBhcmVudFRvTG9jYWwiLCJnZXRMb2NhbFRvR2xvYmFsTWF0cml4IiwibWF0cmljZXMiLCJnZXRVbmlxdWVUcmFuc2Zvcm0iLCJnZXRHbG9iYWxUb0xvY2FsTWF0cml4IiwiaW52ZXJ0IiwibG9jYWxUb0dsb2JhbFBvaW50IiwicmVzdWx0UG9pbnQiLCJtdWx0aXBseVZlY3RvcjIiLCJnbG9iYWxUb0xvY2FsUG9pbnQiLCJ0cmFuc2Zvcm1zIiwibG9jYWxUb0dsb2JhbEJvdW5kcyIsImdsb2JhbFRvTG9jYWxCb3VuZHMiLCJwYXJlbnRUb0dsb2JhbFBvaW50IiwicGFyZW50VG9HbG9iYWxCb3VuZHMiLCJnbG9iYWxUb1BhcmVudFBvaW50IiwiZ2xvYmFsVG9QYXJlbnRCb3VuZHMiLCJnZXRHbG9iYWxCb3VuZHMiLCJnbG9iYWxCb3VuZHMiLCJib3VuZHNPZiIsImJvdW5kc1RvIiwiYXR0YWNoRHJhd2FibGUiLCJkcmF3YWJsZSIsImRldGFjaERyYXdhYmxlIiwia2V5Iiwia2V5cyIsImhhc093blByb3BlcnR5IiwicGRvbVZpc2libGVQcm9wZXJ0eSIsInBkb21WaXNpYmxlIiwibXV0YXRvcktleXMiLCJfbXV0YXRvcktleXMiLCJkZXNjcmlwdG9yIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiaW5pdGlhbGl6ZVBoZXRpb09iamVjdCIsIkRFRkFVTFRfUEhFVF9JT19PQkpFQ1RfQkFTRV9PUFRJT05TIiwiYmFzZU9wdGlvbnMiLCJjb25maWciLCJ3YXNJbnN0cnVtZW50ZWQiLCJpc1BoZXRpb0luc3RydW1lbnRlZCIsIlBIRVRfSU9fRU5BQkxFRCIsImluaXRpYWxpemVQaGV0aW8iLCJwaGV0aW9SZWFkT25seSIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJ2aXNpYmxlUHJvcGVydHlPcHRpb25zIiwiZW5hYmxlZFByb3BlcnR5T3B0aW9ucyIsInBoZXRpb1ZhbHVlVHlwZSIsInBoZXRpb0ZlYXR1cmVkIiwiaW5wdXRFbmFibGVkUHJvcGVydHlPcHRpb25zIiwic2V0Vm9pY2luZ1Zpc2libGUiLCJ2b2ljaW5nVmlzaWJsZSIsImlzVm9pY2luZ1Zpc2libGUiLCJnZXREZWJ1Z0hUTUxFeHRyYXMiLCJpbnNwZWN0IiwibG9jYWxTdG9yYWdlIiwic2NlbmVyeVNuYXBzaG90IiwiSlNPTiIsInN0cmluZ2lmeSIsInR5cGUiLCJyb290Tm9kZUlkIiwibm9kZXMiLCJuYW1lIiwiYXVkaXRJbnN0YW5jZVN1YnRyZWVGb3JEaXNwbGF5IiwibnVtSW5zdGFuY2VzIiwiZGVsdGFRdWFudGl0eSIsImRpc3Bvc2VQYXJhbGxlbERPTSIsImRpc3Bvc2VTdWJ0cmVlIiwiREVGQVVMVF9OT0RFX09QVElPTlMiLCJkcmF3YWJsZU1hcmtGbGFncyIsInJlZ2lzdGVyIiwiTm9kZUlPIiwidmFsdWVUeXBlIiwiZG9jdW1lbnRhdGlvbiIsIm1ldGFkYXRhRGVmYXVsdHMiLCJwaGV0aW9TdGF0ZSIsInBoZXRpb1R5cGUiXSwic291cmNlcyI6WyJOb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgTm9kZSBmb3IgdGhlIFNjZW5lcnkgc2NlbmUgZ3JhcGguIFN1cHBvcnRzIGdlbmVyYWwgZGlyZWN0ZWQgYWN5Y2xpYyBncmFwaGljcyAoREFHcykuXHJcbiAqIEhhbmRsZXMgbXVsdGlwbGUgbGF5ZXJzIHdpdGggYXNzb3J0ZWQgdHlwZXMgKENhbnZhcyAyRCwgU1ZHLCBET00sIFdlYkdMLCBldGMuKS5cclxuICpcclxuICogIyMgR2VuZXJhbCBkZXNjcmlwdGlvbiBvZiBOb2Rlc1xyXG4gKlxyXG4gKiBJbiBTY2VuZXJ5LCB0aGUgdmlzdWFsIG91dHB1dCBpcyBkZXRlcm1pbmVkIGJ5IGEgZ3JvdXAgb2YgY29ubmVjdGVkIE5vZGVzIChnZW5lcmFsbHkga25vd24gYXMgYSBzY2VuZSBncmFwaCkuXHJcbiAqIEVhY2ggTm9kZSBoYXMgYSBsaXN0IG9mICdjaGlsZCcgTm9kZXMuIFdoZW4gYSBOb2RlIGlzIHZpc3VhbGx5IGRpc3BsYXllZCwgaXRzIGNoaWxkIE5vZGVzIChjaGlsZHJlbikgd2lsbCBhbHNvIGJlXHJcbiAqIGRpc3BsYXllZCwgYWxvbmcgd2l0aCB0aGVpciBjaGlsZHJlbiwgZXRjLiBUaGVyZSBpcyB0eXBpY2FsbHkgb25lICdyb290JyBOb2RlIHRoYXQgaXMgcGFzc2VkIHRvIHRoZSBTY2VuZXJ5IERpc3BsYXlcclxuICogd2hvc2UgZGVzY2VuZGFudHMgKE5vZGVzIHRoYXQgY2FuIGJlIHRyYWNlZCBmcm9tIHRoZSByb290IGJ5IGNoaWxkIHJlbGF0aW9uc2hpcHMpIHdpbGwgYmUgZGlzcGxheWVkLlxyXG4gKlxyXG4gKiBGb3IgaW5zdGFuY2UsIHNheSB0aGVyZSBhcmUgTm9kZXMgbmFtZWQgQSwgQiwgQywgRCBhbmQgRSwgd2hvIGhhdmUgdGhlIHJlbGF0aW9uc2hpcHM6XHJcbiAqIC0gQiBpcyBhIGNoaWxkIG9mIEEgKHRodXMgQSBpcyBhIHBhcmVudCBvZiBCKVxyXG4gKiAtIEMgaXMgYSBjaGlsZCBvZiBBICh0aHVzIEEgaXMgYSBwYXJlbnQgb2YgQylcclxuICogLSBEIGlzIGEgY2hpbGQgb2YgQyAodGh1cyBDIGlzIGEgcGFyZW50IG9mIEQpXHJcbiAqIC0gRSBpcyBhIGNoaWxkIG9mIEMgKHRodXMgQyBpcyBhIHBhcmVudCBvZiBFKVxyXG4gKiB3aGVyZSBBIHdvdWxkIGJlIHRoZSByb290IE5vZGUuIFRoaXMgY2FuIGJlIHZpc3VhbGx5IHJlcHJlc2VudGVkIGFzIGEgc2NlbmUgZ3JhcGgsIHdoZXJlIGEgbGluZSBjb25uZWN0cyBhIHBhcmVudFxyXG4gKiBOb2RlIHRvIGEgY2hpbGQgTm9kZSAod2hlcmUgdGhlIHBhcmVudCBpcyB1c3VhbGx5IGFsd2F5cyBhdCB0aGUgdG9wIG9mIHRoZSBsaW5lLCBhbmQgdGhlIGNoaWxkIGlzIGF0IHRoZSBib3R0b20pOlxyXG4gKiBGb3IgZXhhbXBsZTpcclxuICpcclxuICogICBBXHJcbiAqICAvIFxcXHJcbiAqIEIgICBDXHJcbiAqICAgIC8gXFxcclxuICogICBEICAgRVxyXG4gKlxyXG4gKiBBZGRpdGlvbmFsbHksIGluIHRoaXMgY2FzZTpcclxuICogLSBEIGlzIGEgJ2Rlc2NlbmRhbnQnIG9mIEEgKGR1ZSB0byB0aGUgQyBiZWluZyBhIGNoaWxkIG9mIEEsIGFuZCBEIGJlaW5nIGEgY2hpbGQgb2YgQylcclxuICogLSBBIGlzIGFuICdhbmNlc3Rvcicgb2YgRCAoZHVlIHRvIHRoZSByZXZlcnNlKVxyXG4gKiAtIEMncyAnc3VidHJlZScgaXMgQywgRCBhbmQgRSwgd2hpY2ggY29uc2lzdHMgb2YgQyBpdHNlbGYgYW5kIGFsbCBvZiBpdHMgZGVzY2VuZGFudHMuXHJcbiAqXHJcbiAqIE5vdGUgdGhhdCBTY2VuZXJ5IGFsbG93cyBzb21lIG1vcmUgY29tcGxpY2F0ZWQgZm9ybXMsIHdoZXJlIE5vZGVzIGNhbiBoYXZlIG11bHRpcGxlIHBhcmVudHMsIGUuZy46XHJcbiAqXHJcbiAqICAgQVxyXG4gKiAgLyBcXFxyXG4gKiBCICAgQ1xyXG4gKiAgXFwgL1xyXG4gKiAgIERcclxuICpcclxuICogSW4gdGhpcyBjYXNlLCBEIGhhcyB0d28gcGFyZW50cyAoQiBhbmQgQykuIFNjZW5lcnkgZGlzYWxsb3dzIGFueSBOb2RlIGZyb20gYmVpbmcgaXRzIG93biBhbmNlc3RvciBvciBkZXNjZW5kYW50LFxyXG4gKiBzbyB0aGF0IGxvb3BzIGFyZSBub3QgcG9zc2libGUuIFdoZW4gYSBOb2RlIGhhcyB0d28gb3IgbW9yZSBwYXJlbnRzLCBpdCBtZWFucyB0aGF0IHRoZSBOb2RlJ3Mgc3VidHJlZSB3aWxsIHR5cGljYWxseVxyXG4gKiBiZSBkaXNwbGF5ZWQgdHdpY2Ugb24gdGhlIHNjcmVlbi4gSW4gdGhlIGFib3ZlIGNhc2UsIEQgd291bGQgYXBwZWFyIGJvdGggYXQgQidzIHBvc2l0aW9uIGFuZCBDJ3MgcG9zaXRpb24uIEVhY2hcclxuICogcGxhY2UgYSBOb2RlIHdvdWxkIGJlIGRpc3BsYXllZCBpcyBrbm93biBhcyBhbiAnaW5zdGFuY2UnLlxyXG4gKlxyXG4gKiBFYWNoIE5vZGUgaGFzIGEgJ3RyYW5zZm9ybScgYXNzb2NpYXRlZCB3aXRoIGl0LCB3aGljaCBkZXRlcm1pbmVzIGhvdyBpdHMgc3VidHJlZSAodGhhdCBOb2RlIGFuZCBhbGwgb2YgaXRzXHJcbiAqIGRlc2NlbmRhbnRzKSB3aWxsIGJlIHBvc2l0aW9uZWQuIFRyYW5zZm9ybXMgY2FuIGNvbnRhaW46XHJcbiAqIC0gVHJhbnNsYXRpb24sIHdoaWNoIG1vdmVzIHRoZSBwb3NpdGlvbiB0aGUgc3VidHJlZSBpcyBkaXNwbGF5ZWRcclxuICogLSBTY2FsZSwgd2hpY2ggbWFrZXMgdGhlIGRpc3BsYXllZCBzdWJ0cmVlIGxhcmdlciBvciBzbWFsbGVyXHJcbiAqIC0gUm90YXRpb24sIHdoaWNoIGRpc3BsYXlzIHRoZSBzdWJ0cmVlIGF0IGFuIGFuZ2xlXHJcbiAqIC0gb3IgYW55IGNvbWJpbmF0aW9uIG9mIHRoZSBhYm92ZSB0aGF0IHVzZXMgYW4gYWZmaW5lIG1hdHJpeCAobW9yZSBhZHZhbmNlZCB0cmFuc2Zvcm1zIHdpdGggc2hlYXIgYW5kIGNvbWJpbmF0aW9uc1xyXG4gKiAgIGFyZSBwb3NzaWJsZSkuXHJcbiAqXHJcbiAqIFNheSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgc2NlbmUgZ3JhcGg6XHJcbiAqXHJcbiAqICAgQVxyXG4gKiAgIHxcclxuICogICBCXHJcbiAqICAgfFxyXG4gKiAgIENcclxuICpcclxuICogd2hlcmUgdGhlcmUgYXJlIHRoZSBmb2xsb3dpbmcgdHJhbnNmb3JtczpcclxuICogLSBBIGhhcyBhICd0cmFuc2xhdGlvbicgdGhhdCBtb3ZlcyB0aGUgY29udGVudCAxMDAgcGl4ZWxzIHRvIHRoZSByaWdodFxyXG4gKiAtIEIgaGFzIGEgJ3NjYWxlJyB0aGF0IGRvdWJsZXMgdGhlIHNpemUgb2YgdGhlIGNvbnRlbnRcclxuICogLSBDIGhhcyBhICdyb3RhdGlvbicgdGhhdCByb3RhdGVzIDE4MC1kZWdyZWVzIGFyb3VuZCB0aGUgb3JpZ2luXHJcbiAqXHJcbiAqIElmIEMgZGlzcGxheXMgYSBzcXVhcmUgdGhhdCBmaWxscyB0aGUgYXJlYSB3aXRoIDAgPD0geCA8PSAxMCBhbmQgMCA8PSB5IDw9IDEwLCB3ZSBjYW4gZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiBvblxyXG4gKiB0aGUgZGlzcGxheSBieSBhcHBseWluZyB0cmFuc2Zvcm1zIHN0YXJ0aW5nIGF0IEMgYW5kIG1vdmluZyB0b3dhcmRzIHRoZSByb290IE5vZGUgKGluIHRoaXMgY2FzZSwgQSk6XHJcbiAqIDEuIFdlIGFwcGx5IEMncyByb3RhdGlvbiB0byBvdXIgc3F1YXJlLCBzbyB0aGUgZmlsbGVkIGFyZWEgd2lsbCBub3cgYmUgLTEwIDw9IHggPD0gMCBhbmQgLTEwIDw9IHkgPD0gMFxyXG4gKiAyLiBXZSBhcHBseSBCJ3Mgc2NhbGUgdG8gb3VyIHNxdWFyZSwgc28gbm93IHdlIGhhdmUgLTIwIDw9IHggPD0gMCBhbmQgLTIwIDw9IHkgPD0gMFxyXG4gKiAzLiBXZSBhcHBseSBBJ3MgdHJhbnNsYXRpb24gdG8gb3VyIHNxdWFyZSwgbW92aW5nIGl0IHRvIDgwIDw9IHggPD0gMTAwIGFuZCAtMjAgPD0geSA8PSAwXHJcbiAqXHJcbiAqIE5vZGVzIGFsc28gaGF2ZSBhIGxhcmdlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBhZmZlY3QgaG93IHRoZWlyIGVudGlyZSBzdWJ0cmVlIGlzIHJlbmRlcmVkLCBzdWNoIGFzXHJcbiAqIHZpc2liaWxpdHksIG9wYWNpdHksIGV0Yy5cclxuICpcclxuICogIyMgQ3JlYXRpbmcgTm9kZXNcclxuICpcclxuICogR2VuZXJhbGx5LCB0aGVyZSBhcmUgdHdvIHR5cGVzIG9mIE5vZGVzOlxyXG4gKiAtIE5vZGVzIHRoYXQgZG9uJ3QgZGlzcGxheSBhbnl0aGluZywgYnV0IHNlcnZlIGFzIGEgY29udGFpbmVyIGZvciBvdGhlciBOb2RlcyAoZS5nLiBOb2RlIGl0c2VsZiwgSEJveCwgVkJveClcclxuICogLSBOb2RlcyB0aGF0IGRpc3BsYXkgY29udGVudCwgYnV0IEFMU08gc2VydmUgYXMgYSBjb250YWluZXIgKGUuZy4gQ2lyY2xlLCBJbWFnZSwgVGV4dClcclxuICpcclxuICogV2hlbiBhIE5vZGUgaXMgY3JlYXRlZCB3aXRoIHRoZSBkZWZhdWx0IE5vZGUgY29uc3RydWN0b3IsIGUuZy46XHJcbiAqICAgdmFyIG5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gKiB0aGVuIHRoYXQgTm9kZSB3aWxsIG5vdCBkaXNwbGF5IGFueXRoaW5nIGJ5IGl0c2VsZi5cclxuICpcclxuICogR2VuZXJhbGx5IHN1YnR5cGVzIG9mIE5vZGUgYXJlIHVzZWQgZm9yIGRpc3BsYXlpbmcgdGhpbmdzLCBzdWNoIGFzIENpcmNsZSwgZS5nLjpcclxuICogICB2YXIgY2lyY2xlID0gbmV3IENpcmNsZSggMjAgKTsgLy8gcmFkaXVzIG9mIDIwXHJcbiAqXHJcbiAqIEFsbW9zdCBhbGwgTm9kZXMgKHdpdGggdGhlIGV4Y2VwdGlvbiBvZiBsZWFmLW9ubHkgTm9kZXMgbGlrZSBTcGFjZXIpIGNhbiBjb250YWluIGNoaWxkcmVuLlxyXG4gKlxyXG4gKiAjIyBDb25uZWN0aW5nIE5vZGVzLCBhbmQgcmVuZGVyaW5nIG9yZGVyXHJcbiAqXHJcbiAqIFRvIG1ha2UgYSAnY2hpbGROb2RlJyBiZWNvbWUgYSAncGFyZW50Tm9kZScsIHRoZSB0eXBpY2FsIHdheSBpcyB0byBjYWxsIGFkZENoaWxkKCk6XHJcbiAqICAgcGFyZW50Tm9kZS5hZGRDaGlsZCggY2hpbGROb2RlICk7XHJcbiAqXHJcbiAqIFRvIHJlbW92ZSB0aGlzIGNvbm5lY3Rpb24sIHlvdSBjYW4gY2FsbDpcclxuICogICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKCBjaGlsZE5vZGUgKTtcclxuICpcclxuICogQWRkaW5nIGEgY2hpbGQgTm9kZSB3aXRoIGFkZENoaWxkKCkgcHV0cyBpdCBhdCB0aGUgZW5kIG9mIHBhcmVudE5vZGUncyBsaXN0IG9mIGNoaWxkIE5vZGVzLiBUaGlzIGlzIGltcG9ydGFudCxcclxuICogYmVjYXVzZSB0aGUgb3JkZXIgb2YgY2hpbGRyZW4gYWZmZWN0cyB3aGF0IE5vZGVzIGFyZSBkcmF3biBvbiB0aGUgJ3RvcCcgb3IgJ2JvdHRvbScgdmlzdWFsbHkuIE5vZGVzIHRoYXQgYXJlIGF0IHRoZVxyXG4gKiBlbmQgb2YgdGhlIGxpc3Qgb2YgY2hpbGRyZW4gYXJlIGdlbmVyYWxseSBkcmF3biBvbiB0b3AuXHJcbiAqXHJcbiAqIFRoaXMgaXMgZ2VuZXJhbGx5IGVhc2llc3QgdG8gcmVwcmVzZW50IGJ5IG5vdGF0aW5nIHNjZW5lIGdyYXBocyB3aXRoIGNoaWxkcmVuIGluIG9yZGVyIGZyb20gbGVmdCB0byByaWdodCwgdGh1czpcclxuICpcclxuICogICBBXHJcbiAqICAvIFxcXHJcbiAqIEIgICBDXHJcbiAqICAgIC8gXFxcclxuICogICBEICAgRVxyXG4gKlxyXG4gKiB3b3VsZCBpbmRpY2F0ZSB0aGF0IEEncyBjaGlsZHJlbiBhcmUgW0IsQ10sIHNvIEMncyBzdWJ0cmVlIGlzIGRyYXduIE9OIFRPUCBvZiBCLiBUaGUgc2FtZSBpcyB0cnVlIG9mIEMncyBjaGlsZHJlblxyXG4gKiBbRCxFXSwgc28gRSBpcyBkcmF3biBvbiB0b3Agb2YgRC4gSWYgYSBOb2RlIGl0c2VsZiBoYXMgY29udGVudCwgaXQgaXMgZHJhd24gYmVsb3cgdGhhdCBvZiBpdHMgY2hpbGRyZW4gKHNvIEMgaXRzZWxmXHJcbiAqIHdvdWxkIGJlIGJlbG93IEQgYW5kIEUpLlxyXG4gKlxyXG4gKiBUaGlzIG1lYW5zIHRoYXQgZm9yIGV2ZXJ5IHNjZW5lIGdyYXBoLCBOb2RlcyBpbnN0YW5jZXMgY2FuIGJlIG9yZGVyZWQgZnJvbSBib3R0b20gdG8gdG9wLiBGb3IgdGhlIGFib3ZlIGV4YW1wbGUsIHRoZVxyXG4gKiBvcmRlciBpczpcclxuICogMS4gQSAob24gdGhlIHZlcnkgYm90dG9tIHZpc3VhbGx5LCBtYXkgZ2V0IGNvdmVyZWQgdXAgYnkgb3RoZXIgTm9kZXMpXHJcbiAqIDIuIEJcclxuICogMy4gQ1xyXG4gKiA0LiBEXHJcbiAqIDUuIEUgKG9uIHRoZSB2ZXJ5IHRvcCB2aXN1YWxseSwgbWF5IGJlIGNvdmVyaW5nIG90aGVyIE5vZGVzKVxyXG4gKlxyXG4gKiAjIyBUcmFpbHNcclxuICpcclxuICogRm9yIGV4YW1wbGVzIHdoZXJlIHRoZXJlIGFyZSBtdWx0aXBsZSBwYXJlbnRzIGZvciBzb21lIE5vZGVzIChhbHNvIHJlZmVycmVkIHRvIGFzIERBRyBpbiBzb21lIGNvZGUsIGFzIGl0IHJlcHJlc2VudHNcclxuICogYSBEaXJlY3RlZCBBY3ljbGljIEdyYXBoKSwgd2UgbmVlZCBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSByZW5kZXJpbmcgb3JkZXIgKGFzIG90aGVyd2lzZSBOb2RlcyBjb3VsZCBhcHBlYXJcclxuICogbXVsdGlwbGUgcGxhY2VzIGluIHRoZSB2aXN1YWwgYm90dG9tLXRvLXRvcCBvcmRlci5cclxuICpcclxuICogQSBUcmFpbCBpcyBiYXNpY2FsbHkgYSBsaXN0IG9mIE5vZGVzLCB3aGVyZSBldmVyeSBOb2RlIGluIHRoZSBsaXN0IGlzIGEgY2hpbGQgb2YgaXRzIHByZXZpb3VzIGVsZW1lbnQsIGFuZCBhIHBhcmVudFxyXG4gKiBvZiBpdHMgbmV4dCBlbGVtZW50LiBUaHVzIGZvciB0aGUgc2NlbmUgZ3JhcGg6XHJcbiAqXHJcbiAqICAgQVxyXG4gKiAgLyBcXFxyXG4gKiBCICAgQ1xyXG4gKiAgXFwgLyBcXFxyXG4gKiAgIEQgICBFXHJcbiAqICAgIFxcIC9cclxuICogICAgIEZcclxuICpcclxuICogdGhlcmUgYXJlIGFjdHVhbGx5IHRocmVlIGluc3RhbmNlcyBvZiBGIGJlaW5nIGRpc3BsYXllZCwgd2l0aCB0aHJlZSB0cmFpbHM6XHJcbiAqIC0gW0EsQixELEZdXHJcbiAqIC0gW0EsQyxELEZdXHJcbiAqIC0gW0EsQyxFLEZdXHJcbiAqIE5vdGUgdGhhdCB0aGUgdHJhaWxzIGFyZSBlc3NlbnRpYWxseSBsaXN0aW5nIE5vZGVzIHVzZWQgaW4gd2Fsa2luZyBmcm9tIHRoZSByb290IChBKSB0byB0aGUgcmVsZXZhbnQgTm9kZSAoRikgdXNpbmdcclxuICogY29ubmVjdGlvbnMgYmV0d2VlbiBwYXJlbnRzIGFuZCBjaGlsZHJlbi5cclxuICpcclxuICogVGhlIHRyYWlscyBhYm92ZSBhcmUgaW4gb3JkZXIgZnJvbSBib3R0b20gdG8gdG9wICh2aXN1YWxseSksIGR1ZSB0byB0aGUgb3JkZXIgb2YgY2hpbGRyZW4uIFRodXMgc2luY2UgQSdzIGNoaWxkcmVuXHJcbiAqIGFyZSBbQixDXSBpbiB0aGF0IG9yZGVyLCBGIHdpdGggdGhlIHRyYWlsIFtBLEIsRCxGXSBpcyBkaXNwbGF5ZWQgYmVsb3cgW0EsQyxELEZdLCBiZWNhdXNlIEMgaXMgYWZ0ZXIgQi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHksIHsgQm9vbGVhblByb3BlcnR5T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IEVuYWJsZWRQcm9wZXJ0eSwgeyBFbmFibGVkUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbmFibGVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHksIHsgUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55RW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlFbWl0dGVyLmpzJztcclxuaW1wb3J0IFRpbnlGb3J3YXJkaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55Rm9yd2FyZGluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55U3RhdGljUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55U3RhdGljUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFRyYW5zZm9ybTMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1RyYW5zZm9ybTMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IGFycmF5RGlmZmVyZW5jZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlEaWZmZXJlbmNlLmpzJztcclxuaW1wb3J0IGRlcHJlY2F0aW9uV2FybmluZyBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvZGVwcmVjYXRpb25XYXJuaW5nLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBCb29sZWFuSU8gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0Jvb2xlYW5JTy5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBBQ0NFU1NJQklMSVRZX09QVElPTl9LRVlTLCBDYW52YXNDb250ZXh0V3JhcHBlciwgQ2FudmFzU2VsZkRyYXdhYmxlLCBEaXNwbGF5LCBET01TZWxmRHJhd2FibGUsIERyYXdhYmxlLCBGZWF0dXJlcywgRmlsdGVyLCBJbWFnZSwgSW1hZ2VPcHRpb25zLCBJbnN0YW5jZSwgaXNIZWlnaHRTaXphYmxlLCBpc1dpZHRoU2l6YWJsZSwgTGF5b3V0Q29uc3RyYWludCwgTW91c2UsIFBhcmFsbGVsRE9NLCBQYXJhbGxlbERPTU9wdGlvbnMsIFBpY2tlciwgUG9pbnRlciwgUmVuZGVyZXIsIFJlbmRlcmVyU3VtbWFyeSwgc2NlbmVyeSwgc2VyaWFsaXplQ29ubmVjdGVkTm9kZXMsIFNWR1NlbGZEcmF3YWJsZSwgVElucHV0TGlzdGVuZXIsIFRMYXlvdXRPcHRpb25zLCBUcmFpbCwgV2ViR0xTZWxmRHJhd2FibGUgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgb3B0aW9uaXplMyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5cclxubGV0IGdsb2JhbElkQ291bnRlciA9IDE7XHJcblxyXG5jb25zdCBzY3JhdGNoQm91bmRzMiA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7IC8vIG11dGFibGUge0JvdW5kczJ9IHVzZWQgdGVtcG9yYXJpbHkgaW4gbWV0aG9kc1xyXG5jb25zdCBzY3JhdGNoQm91bmRzMkV4dHJhID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTsgLy8gbXV0YWJsZSB7Qm91bmRzMn0gdXNlZCB0ZW1wb3JhcmlseSBpbiBtZXRob2RzXHJcbmNvbnN0IHNjcmF0Y2hNYXRyaXgzID0gbmV3IE1hdHJpeDMoKTtcclxuXHJcbmNvbnN0IEVOQUJMRURfUFJPUEVSVFlfVEFOREVNX05BTUUgPSBFbmFibGVkUHJvcGVydHkuVEFOREVNX05BTUU7XHJcbmNvbnN0IFZJU0lCTEVfUFJPUEVSVFlfVEFOREVNX05BTUUgPSAndmlzaWJsZVByb3BlcnR5JztcclxuY29uc3QgSU5QVVRfRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSA9ICdpbnB1dEVuYWJsZWRQcm9wZXJ0eSc7XHJcblxyXG5jb25zdCBQSEVUX0lPX1NUQVRFX0RFRkFVTFQgPSBmYWxzZTtcclxuXHJcbi8vIFN0b3JlIHRoZSBudW1iZXIgb2YgcGFyZW50cyBmcm9tIHRoZSBzaW5nbGUgTm9kZSBpbnN0YW5jZSB0aGF0IGhhcyB0aGUgbW9zdCBwYXJlbnRzIGluIHRoZSB3aG9sZSBydW50aW1lLlxyXG5sZXQgbWF4UGFyZW50Q291bnQgPSAwO1xyXG5cclxuLy8gU3RvcmUgdGhlIG51bWJlciBvZiBjaGlsZHJlbiBmcm9tIHRoZSBzaW5nbGUgTm9kZSBpbnN0YW5jZSB0aGF0IGhhcyB0aGUgbW9zdCBjaGlsZHJlbiBpbiB0aGUgd2hvbGUgcnVudGltZS5cclxubGV0IG1heENoaWxkQ291bnQgPSAwO1xyXG5cclxuZXhwb3J0IGNvbnN0IFJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUyA9IFtcclxuICAnbGVmdFRvcCcsIC8vIHtWZWN0b3IyfSAtIFRoZSB1cHBlci1sZWZ0IGNvcm5lciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRMZWZ0VG9wKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdjZW50ZXJUb3AnLCAvLyB7VmVjdG9yMn0gLSBUaGUgdG9wLWNlbnRlciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRDZW50ZXJUb3AoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3JpZ2h0VG9wJywgLy8ge1ZlY3RvcjJ9IC0gVGhlIHVwcGVyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRSaWdodFRvcCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbGVmdENlbnRlcicsIC8vIHtWZWN0b3IyfSAtIFRoZSBsZWZ0LWNlbnRlciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRMZWZ0Q2VudGVyKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdjZW50ZXInLCAvLyB7VmVjdG9yMn0gLSBUaGUgY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldENlbnRlcigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncmlnaHRDZW50ZXInLCAvLyB7VmVjdG9yMn0gLSBUaGUgY2VudGVyLXJpZ2h0IG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldFJpZ2h0Q2VudGVyKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdsZWZ0Qm90dG9tJywgLy8ge1ZlY3RvcjJ9IC0gVGhlIGJvdHRvbS1sZWZ0IG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldExlZnRCb3R0b20oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NlbnRlckJvdHRvbScsIC8vIHtWZWN0b3IyfSAtIFRoZSBtaWRkbGUgY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldENlbnRlckJvdHRvbSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncmlnaHRCb3R0b20nLCAvLyB7VmVjdG9yMn0gLSBUaGUgYm90dG9tIHJpZ2h0IG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldFJpZ2h0Qm90dG9tKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdsZWZ0JywgLy8ge251bWJlcn0gLSBUaGUgbGVmdCBzaWRlIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldExlZnQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3JpZ2h0JywgLy8ge251bWJlcn0gLSBUaGUgcmlnaHQgc2lkZSBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRSaWdodCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAndG9wJywgLy8ge251bWJlcn0gLSBUaGUgdG9wIHNpZGUgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0VG9wKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdib3R0b20nLCAvLyB7bnVtYmVyfSAtIFRoZSBib3R0b20gc2lkZSBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRCb3R0b20oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NlbnRlclgnLCAvLyB7bnVtYmVyfSAtIFRoZSB4LWNlbnRlciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRDZW50ZXJYKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdjZW50ZXJZJyAvLyB7bnVtYmVyfSAtIFRoZSB5LWNlbnRlciBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRDZW50ZXJZKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5dO1xyXG5cclxuLy8gTm9kZSBvcHRpb25zLCBpbiB0aGUgb3JkZXIgdGhleSBhcmUgZXhlY3V0ZWQgaW4gdGhlIGNvbnN0cnVjdG9yL211dGF0ZSgpXHJcbmNvbnN0IE5PREVfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ2NoaWxkcmVuJywgLy8gTGlzdCBvZiBjaGlsZHJlbiB0byBhZGQgKGluIG9yZGVyKSwgc2VlIHNldENoaWxkcmVuIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnY3Vyc29yJywgLy8gQ1NTIGN1cnNvciB0byBkaXNwbGF5IHdoZW4gb3ZlciB0aGlzIE5vZGUsIHNlZSBzZXRDdXJzb3IoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcblxyXG4gICdwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQnLCAvLyBXaGVuIHRydWUsIGNyZWF0ZSBhbiBpbnN0cnVtZW50ZWQgdmlzaWJsZVByb3BlcnR5IHdoZW4gdGhpcyBOb2RlIGlzIGluc3RydW1lbnRlZCwgc2VlIHNldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAndmlzaWJsZVByb3BlcnR5JywgLy8gU2V0cyBmb3J3YXJkaW5nIG9mIHRoZSB2aXNpYmxlUHJvcGVydHksIHNlZSBzZXRWaXNpYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3Zpc2libGUnLCAvLyBXaGV0aGVyIHRoZSBOb2RlIGlzIHZpc2libGUsIHNlZSBzZXRWaXNpYmxlKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5cclxuICAncGlja2FibGVQcm9wZXJ0eScsIC8vIFNldHMgZm9yd2FyZGluZyBvZiB0aGUgcGlja2FibGVQcm9wZXJ0eSwgc2VlIHNldFBpY2thYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3BpY2thYmxlJywgLy8gV2hldGhlciB0aGUgTm9kZSBpcyBwaWNrYWJsZSwgc2VlIHNldFBpY2thYmxlKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5cclxuICAncGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkJywgLy8gV2hlbiB0cnVlLCBjcmVhdGUgYW4gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eSB3aGVuIHRoaXMgTm9kZSBpcyBpbnN0cnVtZW50ZWQsIHNlZSBzZXRQaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2VuYWJsZWRQcm9wZXJ0eScsIC8vIFNldHMgZm9yd2FyZGluZyBvZiB0aGUgZW5hYmxlZFByb3BlcnR5LCBzZWUgc2V0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdlbmFibGVkJywgLy8gV2hldGhlciB0aGUgTm9kZSBpcyBlbmFibGVkLCBzZWUgc2V0RW5hYmxlZCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuXHJcbiAgJ3BoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkJywgLy8gV2hlbiB0cnVlLCBjcmVhdGUgYW4gaW5zdHJ1bWVudGVkIGlucHV0RW5hYmxlZFByb3BlcnR5IHdoZW4gdGhpcyBOb2RlIGlzIGluc3RydW1lbnRlZCwgc2VlIHNldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdpbnB1dEVuYWJsZWRQcm9wZXJ0eScsIC8vIFNldHMgZm9yd2FyZGluZyBvZiB0aGUgaW5wdXRFbmFibGVkUHJvcGVydHksIHNlZSBzZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnaW5wdXRFbmFibGVkJywgLy8ge2Jvb2xlYW59IFdoZXRoZXIgaW5wdXQgZXZlbnRzIGNhbiByZWFjaCBpbnRvIHRoaXMgc3VidHJlZSwgc2VlIHNldElucHV0RW5hYmxlZCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnaW5wdXRMaXN0ZW5lcnMnLCAvLyBUaGUgaW5wdXQgbGlzdGVuZXJzIGF0dGFjaGVkIHRvIHRoZSBOb2RlLCBzZWUgc2V0SW5wdXRMaXN0ZW5lcnMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ29wYWNpdHknLCAvLyBPcGFjaXR5IG9mIHRoaXMgTm9kZSdzIHN1YnRyZWUsIHNlZSBzZXRPcGFjaXR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdkaXNhYmxlZE9wYWNpdHknLCAvLyBBIG11bHRpcGxpZXIgdG8gdGhlIG9wYWNpdHkgb2YgdGhpcyBOb2RlJ3Mgc3VidHJlZSB3aGVuIHRoZSBub2RlIGlzIGRpc2FibGVkLCBzZWUgc2V0RGlzYWJsZWRPcGFjaXR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmaWx0ZXJzJywgLy8gTm9uLW9wYWNpdHkgZmlsdGVycywgc2VlIHNldEZpbHRlcnMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ21hdHJpeCcsIC8vIFRyYW5zZm9ybWF0aW9uIG1hdHJpeCBvZiB0aGUgTm9kZSwgc2VlIHNldE1hdHJpeCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAndHJhbnNsYXRpb24nLCAvLyB4L3kgdHJhbnNsYXRpb24gb2YgdGhlIE5vZGUsIHNlZSBzZXRUcmFuc2xhdGlvbigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAneCcsIC8vIHggdHJhbnNsYXRpb24gb2YgdGhlIE5vZGUsIHNlZSBzZXRYKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd5JywgLy8geSB0cmFuc2xhdGlvbiBvZiB0aGUgTm9kZSwgc2VlIHNldFkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3JvdGF0aW9uJywgLy8gcm90YXRpb24gKGluIHJhZGlhbnMpIG9mIHRoZSBOb2RlLCBzZWUgc2V0Um90YXRpb24oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3NjYWxlJywgLy8gc2NhbGUgb2YgdGhlIE5vZGUsIHNlZSBzY2FsZSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcycsIC8vIENvbnRyb2xzIGJvdW5kcyBkZXBlbmRpbmcgb24gY2hpbGQgdmlzaWJpbGl0eSwgc2VlIHNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2xheW91dE9wdGlvbnMnLCAvLyBQcm92aWRlZCB0byBsYXlvdXQgY29udGFpbmVycyBmb3Igb3B0aW9ucywgc2VlIHNldExheW91dE9wdGlvbnMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2xvY2FsQm91bmRzJywgLy8gYm91bmRzIG9mIHN1YnRyZWUgaW4gbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSwgc2VlIHNldExvY2FsQm91bmRzKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdtYXhXaWR0aCcsIC8vIENvbnN0cmFpbnMgd2lkdGggb2YgdGhpcyBOb2RlLCBzZWUgc2V0TWF4V2lkdGgoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ21heEhlaWdodCcsIC8vIENvbnN0cmFpbnMgaGVpZ2h0IG9mIHRoaXMgTm9kZSwgc2VlIHNldE1heEhlaWdodCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncmVuZGVyZXInLCAvLyBUaGUgcHJlZmVycmVkIHJlbmRlcmVyIGZvciB0aGlzIHN1YnRyZWUsIHNlZSBzZXRSZW5kZXJlcigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbGF5ZXJTcGxpdCcsIC8vIEZvcmNlcyB0aGlzIHN1YnRyZWUgaW50byBhIGxheWVyIG9mIGl0cyBvd24sIHNlZSBzZXRMYXllclNwbGl0KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd1c2VzT3BhY2l0eScsIC8vIEhpbnQgdGhhdCBvcGFjaXR5IHdpbGwgYmUgY2hhbmdlZCwgc2VlIHNldFVzZXNPcGFjaXR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdjc3NUcmFuc2Zvcm0nLCAvLyBIaW50IHRoYXQgY2FuIHRyaWdnZXIgdXNpbmcgQ1NTIHRyYW5zZm9ybXMsIHNlZSBzZXRDc3NUcmFuc2Zvcm0oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2V4Y2x1ZGVJbnZpc2libGUnLCAvLyBJZiB0aGlzIGlzIGludmlzaWJsZSwgZXhjbHVkZSBmcm9tIERPTSwgc2VlIHNldEV4Y2x1ZGVJbnZpc2libGUoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3dlYmdsU2NhbGUnLCAvLyBIaW50IHRvIGFkanVzdCBXZWJHTCBzY2FsaW5nIHF1YWxpdHkgZm9yIHRoaXMgc3VidHJlZSwgc2VlIHNldFdlYmdsU2NhbGUoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3ByZXZlbnRGaXQnLCAvLyBQcmV2ZW50cyBsYXllcnMgZnJvbSBmaXR0aW5nIHRoaXMgc3VidHJlZSwgc2VlIHNldFByZXZlbnRGaXQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ21vdXNlQXJlYScsIC8vIENoYW5nZXMgdGhlIGFyZWEgdGhlIG1vdXNlIGNhbiBpbnRlcmFjdCB3aXRoLCBzZWUgc2V0TW91c2VBcmVhKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd0b3VjaEFyZWEnLCAvLyBDaGFuZ2VzIHRoZSBhcmVhIHRvdWNoZXMgY2FuIGludGVyYWN0IHdpdGgsIHNlZSBzZXRUb3VjaEFyZWEoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NsaXBBcmVhJywgLy8gTWFrZXMgdGhpbmdzIG91dHNpZGUgb2YgYSBzaGFwZSBpbnZpc2libGUsIHNlZSBzZXRDbGlwQXJlYSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAndHJhbnNmb3JtQm91bmRzJywgLy8gRmxhZyB0aGF0IG1ha2VzIGJvdW5kcyB0aWdodGVyLCBzZWUgc2V0VHJhbnNmb3JtQm91bmRzKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gIC4uLlJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZU1xyXG5dO1xyXG5cclxuY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSxcclxuICB2aXNpYmxlOiB0cnVlLFxyXG4gIG9wYWNpdHk6IDEsXHJcbiAgZGlzYWJsZWRPcGFjaXR5OiAxLFxyXG4gIHBpY2thYmxlOiBudWxsLFxyXG4gIGVuYWJsZWQ6IHRydWUsXHJcbiAgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZSxcclxuICBpbnB1dEVuYWJsZWQ6IHRydWUsXHJcbiAgcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGZhbHNlLFxyXG4gIGNsaXBBcmVhOiBudWxsLFxyXG4gIG1vdXNlQXJlYTogbnVsbCxcclxuICB0b3VjaEFyZWE6IG51bGwsXHJcbiAgY3Vyc29yOiBudWxsLFxyXG4gIHRyYW5zZm9ybUJvdW5kczogZmFsc2UsXHJcbiAgbWF4V2lkdGg6IG51bGwsXHJcbiAgbWF4SGVpZ2h0OiBudWxsLFxyXG4gIHJlbmRlcmVyOiBudWxsLFxyXG4gIHVzZXNPcGFjaXR5OiBmYWxzZSxcclxuICBsYXllclNwbGl0OiBmYWxzZSxcclxuICBjc3NUcmFuc2Zvcm06IGZhbHNlLFxyXG4gIGV4Y2x1ZGVJbnZpc2libGU6IGZhbHNlLFxyXG4gIHdlYmdsU2NhbGU6IG51bGwsXHJcbiAgcHJldmVudEZpdDogZmFsc2VcclxufTtcclxuXHJcbmNvbnN0IERFRkFVTFRfSU5URVJOQUxfUkVOREVSRVIgPSBERUZBVUxUX09QVElPTlMucmVuZGVyZXIgPT09IG51bGwgPyAwIDogUmVuZGVyZXIuZnJvbU5hbWUoIERFRkFVTFRfT1BUSU9OUy5yZW5kZXJlciApO1xyXG5cclxuZXhwb3J0IHR5cGUgUmVuZGVyZXJUeXBlID0gJ3N2ZycgfCAnY2FudmFzJyB8ICd3ZWJnbCcgfCAnZG9tJyB8IG51bGw7XHJcblxyXG4vLyBJc29sYXRlZCBzbyB0aGF0IHdlIGNhbiBkZWxheSBvcHRpb25zIHRoYXQgYXJlIGJhc2VkIG9uIGJvdW5kcyBvZiB0aGUgTm9kZSB0byBhZnRlciBjb25zdHJ1Y3Rpb24uXHJcbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTMzMlxyXG5leHBvcnQgdHlwZSBOb2RlQm91bmRzQmFzZWRUcmFuc2xhdGlvbk9wdGlvbnMgPSB7XHJcbiAgbGVmdFRvcD86IFZlY3RvcjI7XHJcbiAgY2VudGVyVG9wPzogVmVjdG9yMjtcclxuICByaWdodFRvcD86IFZlY3RvcjI7XHJcbiAgbGVmdENlbnRlcj86IFZlY3RvcjI7XHJcbiAgY2VudGVyPzogVmVjdG9yMjtcclxuICByaWdodENlbnRlcj86IFZlY3RvcjI7XHJcbiAgbGVmdEJvdHRvbT86IFZlY3RvcjI7XHJcbiAgY2VudGVyQm90dG9tPzogVmVjdG9yMjtcclxuICByaWdodEJvdHRvbT86IFZlY3RvcjI7XHJcbiAgbGVmdD86IG51bWJlcjtcclxuICByaWdodD86IG51bWJlcjtcclxuICB0b3A/OiBudW1iZXI7XHJcbiAgYm90dG9tPzogbnVtYmVyO1xyXG4gIGNlbnRlclg/OiBudW1iZXI7XHJcbiAgY2VudGVyWT86IG51bWJlcjtcclxufTtcclxuXHJcbi8vIEFsbCB0cmFuc2xhdGlvbiBvcHRpb25zIChpbmNsdWRlcyB0aG9zZSBiYXNlZCBvbiBib3VuZHMgYW5kIHRob3NlIHRoYXQgYXJlIG5vdClcclxuZXhwb3J0IHR5cGUgTm9kZVRyYW5zbGF0aW9uT3B0aW9ucyA9IHtcclxuICB0cmFuc2xhdGlvbj86IFZlY3RvcjI7XHJcbiAgeD86IG51bWJlcjtcclxuICB5PzogbnVtYmVyO1xyXG59ICYgTm9kZUJvdW5kc0Jhc2VkVHJhbnNsYXRpb25PcHRpb25zO1xyXG5cclxuLy8gQWxsIHRyYW5zZm9ybSBvcHRpb25zIChpbmNsdWRlcyB0cmFuc2xhdGlvbiBvcHRpb25zKVxyXG5leHBvcnQgdHlwZSBOb2RlVHJhbnNmb3JtT3B0aW9ucyA9IHtcclxuICBtYXRyaXg/OiBNYXRyaXgzO1xyXG4gIHJvdGF0aW9uPzogbnVtYmVyO1xyXG4gIHNjYWxlPzogbnVtYmVyIHwgVmVjdG9yMjtcclxufSAmIE5vZGVUcmFuc2xhdGlvbk9wdGlvbnM7XHJcblxyXG4vLyBBbGwgYmFzZSBOb2RlIG9wdGlvbnNcclxuZXhwb3J0IHR5cGUgTm9kZU9wdGlvbnMgPSB7XHJcbiAgY2hpbGRyZW4/OiBOb2RlW107XHJcbiAgY3Vyc29yPzogc3RyaW5nIHwgbnVsbDtcclxuICBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQ/OiBib29sZWFuO1xyXG4gIHZpc2libGVQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbDtcclxuICB2aXNpYmxlPzogYm9vbGVhbjtcclxuICBwaWNrYWJsZVByb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbiB8IG51bGw+IHwgbnVsbDtcclxuICBwaWNrYWJsZT86IGJvb2xlYW4gfCBudWxsO1xyXG4gIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZD86IGJvb2xlYW47XHJcbiAgZW5hYmxlZFByb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsO1xyXG4gIGVuYWJsZWQ/OiBib29sZWFuO1xyXG4gIHBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkPzogYm9vbGVhbjtcclxuICBpbnB1dEVuYWJsZWRQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbDtcclxuICBpbnB1dEVuYWJsZWQ/OiBib29sZWFuO1xyXG4gIGlucHV0TGlzdGVuZXJzPzogVElucHV0TGlzdGVuZXJbXTtcclxuICBvcGFjaXR5PzogbnVtYmVyO1xyXG4gIGRpc2FibGVkT3BhY2l0eT86IG51bWJlcjtcclxuICBmaWx0ZXJzPzogRmlsdGVyW107XHJcbiAgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcz86IGJvb2xlYW47XHJcbiAgbGF5b3V0T3B0aW9ucz86IFRMYXlvdXRPcHRpb25zIHwgbnVsbDtcclxuICBsb2NhbEJvdW5kcz86IEJvdW5kczIgfCBudWxsO1xyXG4gIG1heFdpZHRoPzogbnVtYmVyIHwgbnVsbDtcclxuICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBudWxsO1xyXG4gIHJlbmRlcmVyPzogUmVuZGVyZXJUeXBlO1xyXG4gIGxheWVyU3BsaXQ/OiBib29sZWFuO1xyXG4gIHVzZXNPcGFjaXR5PzogYm9vbGVhbjtcclxuICBjc3NUcmFuc2Zvcm0/OiBib29sZWFuO1xyXG4gIGV4Y2x1ZGVJbnZpc2libGU/OiBib29sZWFuO1xyXG4gIHdlYmdsU2NhbGU/OiBudW1iZXIgfCBudWxsO1xyXG4gIHByZXZlbnRGaXQ/OiBib29sZWFuO1xyXG4gIG1vdXNlQXJlYT86IFNoYXBlIHwgQm91bmRzMiB8IG51bGw7XHJcbiAgdG91Y2hBcmVhPzogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbDtcclxuICBjbGlwQXJlYT86IFNoYXBlIHwgbnVsbDtcclxuICB0cmFuc2Zvcm1Cb3VuZHM/OiBib29sZWFuO1xyXG5cclxuICAvLyBUaGlzIG9wdGlvbiBpcyB1c2VkIHRvIGNyZWF0ZSB0aGUgaW5zdHJ1bWVudGVkLCBkZWZhdWx0IFBoRVQtaU8gdmlzaWJsZVByb3BlcnR5LiBUaGVzZSBvcHRpb25zIHNob3VsZCBub3RcclxuICAvLyBiZSBwcm92aWRlZCBpZiBhIGB2aXNpYmxlUHJvcGVydHlgIHdhcyBwcm92aWRlZCB0byB0aGlzIE5vZGUsIHRob3VnaCBpZiB0aGV5IGFyZSwgdGhleSB3aWxsIGp1c3QgYmUgaWdub3JlZC5cclxuICAvLyBUaGlzIGdyYWNlIGlzIHRvIHN1cHBvcnQgZGVmYXVsdCBvcHRpb25zIGFjcm9zcyB0aGUgY29tcG9uZW50IGhpZXJhcmNoeSBtZWxkaW5nIHdpdGggdXNhZ2VzIHByb3ZpZGluZyBhIHZpc2libGVQcm9wZXJ0eS5cclxuICAvLyBUaGlzIG9wdGlvbiBpcyBhIGJpdCBidXJpZWQgYmVjYXVzZSBpdCBjYW4gb25seSBiZSB1c2VkIHdoZW4gdGhlIE5vZGUgaXMgYmVpbmcgaW5zdHJ1bWVudGVkLCB3aGljaCBpcyB3aGVuXHJcbiAgLy8gdGhlIGRlZmF1bHQsIGluc3RydW1lbnRlZCB2aXNpYmxlUHJvcGVydHkgaXMgY29uZGl0aW9uYWxseSBjcmVhdGVkLiBXZSBkb24ndCB3YW50IHRvIHN0b3JlIHRoZXNlIG9uIHRoZSBOb2RlLFxyXG4gIC8vIGFuZCB0aHVzIHRoZXkgYXJlbid0IHN1cHBvcnQgdGhyb3VnaCBgbXV0YXRlKClgLlxyXG4gIHZpc2libGVQcm9wZXJ0eU9wdGlvbnM/OiBQcm9wZXJ0eU9wdGlvbnM8Ym9vbGVhbj47XHJcbiAgZW5hYmxlZFByb3BlcnR5T3B0aW9ucz86IFByb3BlcnR5T3B0aW9uczxib29sZWFuPjtcclxuICBpbnB1dEVuYWJsZWRQcm9wZXJ0eU9wdGlvbnM/OiBQcm9wZXJ0eU9wdGlvbnM8Ym9vbGVhbj47XHJcbn0gJiBQYXJhbGxlbERPTU9wdGlvbnMgJiBOb2RlVHJhbnNmb3JtT3B0aW9ucztcclxuXHJcbnR5cGUgUmFzdGVyaXplZE9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHtudW1iZXJ9IC0gQ29udHJvbHMgdGhlIHJlc29sdXRpb24gb2YgdGhlIGltYWdlIHJlbGF0aXZlIHRvIHRoZSBsb2NhbCB2aWV3IHVuaXRzLiBGb3IgZXhhbXBsZSwgaWYgb3VyIE5vZGUgaXNcclxuICAvLyB+MTAwIHZpZXcgdW5pdHMgYWNyb3NzIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkgYnV0IHlvdSB3YW50IHRoZSBpbWFnZSB0byBhY3R1YWxseSBoYXZlIGEgfjIwMC1waXhlbFxyXG4gIC8vIHJlc29sdXRpb24sIHByb3ZpZGUgcmVzb2x1dGlvbjoyLlxyXG4gIC8vIERlZmF1bHRzIHRvIDEuMFxyXG4gIHJlc29sdXRpb24/OiBudW1iZXI7XHJcblxyXG4gIC8vIHtCb3VuZHMyfG51bGx9IC0gSWYgcHJvdmlkZWQsIGl0IHdpbGwgY29udHJvbCB0aGUgeC95L3dpZHRoL2hlaWdodCBvZiB0aGUgdG9DYW52YXMgY2FsbC4gU2VlIHRvQ2FudmFzIGZvclxyXG4gIC8vIGRldGFpbHMgb24gaG93IHRoaXMgY29udHJvbHMgdGhlIHJhc3Rlcml6YXRpb24uIFRoaXMgaXMgaW4gdGhlIFwicGFyZW50XCIgY29vcmRpbmF0ZSBmcmFtZSwgc2ltaWxhciB0b1xyXG4gIC8vIG5vZGUuYm91bmRzLlxyXG4gIC8vIERlZmF1bHRzIHRvIG51bGxcclxuICBzb3VyY2VCb3VuZHM/OiBCb3VuZHMyIHwgbnVsbDtcclxuXHJcbiAgLy8ge2Jvb2xlYW59IC0gSWYgdHJ1ZSwgdGhlIGxvY2FsQm91bmRzIG9mIHRoZSByZXN1bHQgd2lsbCBiZSBzZXQgaW4gYSB3YXkgc3VjaCB0aGF0IGl0IHdpbGwgcHJlY2lzZWx5IG1hdGNoXHJcbiAgLy8gdGhlIHZpc2libGUgYm91bmRzIG9mIHRoZSBvcmlnaW5hbCBOb2RlICh0aGlzKS4gTm90ZSB0aGF0IGFudGlhbGlhc2VkIGNvbnRlbnQgKHdpdGggYSBtdWNoIGxvd2VyIHJlc29sdXRpb24pXHJcbiAgLy8gbWF5IHNvbWV3aGF0IHNwaWxsIG91dHNpZGUgdGhlc2UgYm91bmRzIGlmIHRoaXMgaXMgc2V0IHRvIHRydWUuIFVzdWFsbHkgdGhpcyBpcyBmaW5lIGFuZCBzaG91bGQgYmUgdGhlXHJcbiAgLy8gcmVjb21tZW5kZWQgb3B0aW9uLiBJZiBzb3VyY2VCb3VuZHMgYXJlIHByb3ZpZGVkLCB0aGV5IHdpbGwgcmVzdHJpY3QgdGhlIHVzZWQgYm91bmRzIChzbyBpdCB3aWxsIGp1c3RcclxuICAvLyByZXByZXNlbnQgdGhlIGJvdW5kcyBvZiB0aGUgc2xpY2VkIHBhcnQgb2YgdGhlIGltYWdlKS5cclxuICAvLyBEZWZhdWx0cyB0byB0cnVlXHJcbiAgdXNlVGFyZ2V0Qm91bmRzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8ge2Jvb2xlYW59IC0gSWYgdHJ1ZSwgdGhlIGNyZWF0ZWQgSW1hZ2UgTm9kZSBnZXRzIHdyYXBwZWQgaW4gYW4gZXh0cmEgTm9kZSBzbyB0aGF0IGl0IGNhbiBiZSB0cmFuc2Zvcm1lZFxyXG4gIC8vIGluZGVwZW5kZW50bHkuIElmIHRoZXJlIGlzIG5vIG5lZWQgdG8gdHJhbnNmb3JtIHRoZSByZXN1bHRpbmcgbm9kZSwgd3JhcDpmYWxzZSBjYW4gYmUgcGFzc2VkIHNvIHRoYXQgbm8gZXh0cmFcclxuICAvLyBOb2RlIGlzIGNyZWF0ZWQuXHJcbiAgLy8gRGVmYXVsdHMgdG8gdHJ1ZVxyXG4gIHdyYXA/OiBib29sZWFuO1xyXG5cclxuICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCBpdCB3aWxsIGRpcmVjdGx5IHVzZSB0aGUgPGNhbnZhcz4gZWxlbWVudCAob25seSB3b3JrcyB3aXRoIGNhbnZhcy93ZWJnbCByZW5kZXJlcnMpXHJcbiAgLy8gaW5zdGVhZCBvZiBjb252ZXJ0aW5nIHRoaXMgaW50byBhIGZvcm0gdGhhdCBjYW4gYmUgdXNlZCB3aXRoIGFueSByZW5kZXJlci4gTWF5IGhhdmUgc2xpZ2h0bHkgYmV0dGVyXHJcbiAgLy8gcGVyZm9ybWFuY2UgaWYgc3ZnL2RvbSByZW5kZXJlcnMgZG8gbm90IG5lZWQgdG8gYmUgdXNlZC5cclxuICAvLyBEZWZhdWx0cyB0byBmYWxzZVxyXG4gIHVzZUNhbnZhcz86IGJvb2xlYW47XHJcblxyXG4gIC8vIFRvIGJlIHBhc3NlZCB0byB0aGUgSW1hZ2Ugbm9kZSBjcmVhdGVkIGZyb20gdGhlIHJhc3Rlcml6YXRpb24uIFNlZSBiZWxvdyBmb3Igb3B0aW9ucyB0aGF0IHdpbGwgb3ZlcnJpZGVcclxuICAvLyB3aGF0IGlzIHBhc3NlZCBpbi5cclxuICAvLyBEZWZhdWx0cyB0byB0aGUgZW1wdHkgb2JqZWN0XHJcbiAgaW1hZ2VPcHRpb25zPzogSW1hZ2VPcHRpb25zO1xyXG59O1xyXG5cclxuY2xhc3MgTm9kZSBleHRlbmRzIFBhcmFsbGVsRE9NIHtcclxuICAvLyBOT1RFOiBBbGwgbWVtYmVyIHByb3BlcnRpZXMgd2l0aCBuYW1lcyBzdGFydGluZyB3aXRoICdfJyBhcmUgYXNzdW1lZCB0byBiZSBwcml2YXRlL3Byb3RlY3RlZCFcclxuXHJcbiAgLy8gQXNzaWducyBhIHVuaXF1ZSBJRCB0byB0aGlzIE5vZGUgKGFsbG93cyB0cmFpbHMgdG8gZ2V0IGEgdW5pcXVlIGxpc3Qgb2YgSURzKVxyXG4gIHB1YmxpYyBfaWQ6IG51bWJlcjtcclxuXHJcbiAgLy8gQWxsIG9mIHRoZSBJbnN0YW5jZXMgdHJhY2tpbmcgdGhpcyBOb2RlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfaW5zdGFuY2VzOiBJbnN0YW5jZVtdO1xyXG5cclxuICAvLyBBbGwgZGlzcGxheXMgd2hlcmUgdGhpcyBOb2RlIGlzIHRoZSByb290LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgcmVhZG9ubHkgX3Jvb3RlZERpc3BsYXlzOiBEaXNwbGF5W107XHJcblxyXG4gIC8vIERyYXdhYmxlIHN0YXRlcyB0aGF0IG5lZWQgdG8gYmUgdXBkYXRlZCBvbiBtdXRhdGlvbnMuIEdlbmVyYWxseSBhZGRlZCBieSBTVkcgYW5kXHJcbiAgLy8gRE9NIGVsZW1lbnRzIHRoYXQgbmVlZCB0byBjbG9zZWx5IHRyYWNrIHN0YXRlIChwb3NzaWJseSBieSBDYW52YXMgdG8gbWFpbnRhaW4gZGlydHkgc3RhdGUpLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyByZWFkb25seSBfZHJhd2FibGVzOiBEcmF3YWJsZVtdO1xyXG5cclxuICAvLyBXaGV0aGVyIHRoaXMgTm9kZSAoYW5kIGl0cyBjaGlsZHJlbikgd2lsbCBiZSB2aXNpYmxlIHdoZW4gdGhlIHNjZW5lIGlzIHVwZGF0ZWQuXHJcbiAgLy8gVmlzaWJsZSBOb2RlcyBieSBkZWZhdWx0IHdpbGwgbm90IGJlIHBpY2thYmxlIGVpdGhlci5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkIHN5bmNocm9ub3VzbHkgd2hlbiB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgTm9kZSBpcyB0b2dnbGVkXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfdmlzaWJsZVByb3BlcnR5OiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBPcGFjaXR5LCBpbiB0aGUgcmFuZ2UgZnJvbSAwIChmdWxseSB0cmFuc3BhcmVudCkgdG8gMSAoZnVsbHkgb3BhcXVlKS5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkIHN5bmNocm9ub3VzbHkgd2hlbiB0aGUgb3BhY2l0eSBvZiB0aGUgTm9kZSBpcyB0b2dnbGVkXHJcbiAgcHVibGljIHJlYWRvbmx5IG9wYWNpdHlQcm9wZXJ0eTogVGlueVByb3BlcnR5PG51bWJlcj47XHJcblxyXG4gIC8vIERpc2FibGVkIG9wYWNpdHksIGluIHRoZSByYW5nZSBmcm9tIDAgKGZ1bGx5IHRyYW5zcGFyZW50KSB0byAxIChmdWxseSBvcGFxdWUpLlxyXG4gIC8vIENvbWJpbmVkIHdpdGggdGhlIG5vcm1hbCBvcGFjaXR5IE9OTFkgd2hlbiB0aGUgbm9kZSBpcyBkaXNhYmxlZC5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkIHN5bmNocm9ub3VzbHkgd2hlbiB0aGUgb3BhY2l0eSBvZiB0aGUgTm9kZSBpcyB0b2dnbGVkXHJcbiAgcHVibGljIHJlYWRvbmx5IGRpc2FibGVkT3BhY2l0eVByb3BlcnR5OiBUaW55UHJvcGVydHk8bnVtYmVyPjtcclxuXHJcbiAgLy8gU2VlIHNldFBpY2thYmxlKCkgYW5kIHNldFBpY2thYmxlUHJvcGVydHkoKVxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgc3luY2hyb25vdXNseSB3aGVuIHRoZSBwaWNrYWJpbGl0eSBvZiB0aGUgTm9kZSBpcyB0b2dnbGVkXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfcGlja2FibGVQcm9wZXJ0eTogVGlueUZvcndhcmRpbmdQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD47XHJcblxyXG4gIC8vIFNlZSBzZXRFbmFibGVkKCkgYW5kIHNldEVuYWJsZWRQcm9wZXJ0eSgpXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfZW5hYmxlZFByb3BlcnR5OiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBXaGV0aGVyIGlucHV0IGV2ZW50IGxpc3RlbmVycyBvbiB0aGlzIE5vZGUgb3IgZGVzY2VuZGFudHMgb24gYSB0cmFpbCB3aWxsIGhhdmVcclxuICAvLyBpbnB1dCBsaXN0ZW5lcnMuIHRyaWdnZXJlZC4gTm90ZSB0aGF0IHRoaXMgZG9lcyBOT1QgZWZmZWN0IHBpY2tpbmcsIGFuZCBvbmx5IHByZXZlbnRzIHNvbWUgbGlzdGVuZXJzIGZyb20gYmVpbmdcclxuICAvLyBmaXJlZC5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9pbnB1dEVuYWJsZWRQcm9wZXJ0eTogVGlueUZvcndhcmRpbmdQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gVGhpcyBOb2RlIGFuZCBhbGwgY2hpbGRyZW4gd2lsbCBiZSBjbGlwcGVkIGJ5IHRoaXMgc2hhcGUgKGluIGFkZGl0aW9uIHRvIGFueVxyXG4gIC8vIG90aGVyIGNsaXBwaW5nIHNoYXBlcykuIFRoZSBzaGFwZSBzaG91bGQgYmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgLy8gTk9URTogVGhpcyBpcyBmaXJlZCBzeW5jaHJvbm91c2x5IHdoZW4gdGhlIGNsaXBBcmVhIG9mIHRoZSBOb2RlIGlzIHRvZ2dsZWRcclxuICBwdWJsaWMgcmVhZG9ubHkgY2xpcEFyZWFQcm9wZXJ0eTogVGlueVByb3BlcnR5PFNoYXBlIHwgbnVsbD47XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhpcyBOb2RlIGFuZCBpdHMgc3VidHJlZSBjYW4gYW5ub3VuY2UgY29udGVudCB3aXRoIFZvaWNpbmcgYW5kIFNwZWVjaFN5bnRoZXNpcy4gVGhvdWdoXHJcbiAgLy8gcmVsYXRlZCB0byBWb2ljaW5nIGl0IGV4aXN0cyBpbiBOb2RlIGJlY2F1c2UgaXQgaXMgdXNlZnVsIHRvIHNldCB2b2ljaW5nVmlzaWJsZSBvbiBhIHN1YnRyZWUgd2hlcmUgdGhlXHJcbiAgLy8gcm9vdCBkb2VzIG5vdCBjb21wb3NlIFZvaWNpbmcuIFRoaXMgaXMgbm90IGlkZWFsIGJ1dCB0aGUgZW50aXJldHkgb2YgVm9pY2luZyBjYW5ub3QgYmUgY29tcG9zZWQgaW50byBldmVyeVxyXG4gIC8vIE5vZGUgYmVjYXVzZSBpdCB3b3VsZCBwcm9kdWNlIGluY29ycmVjdCBiZWhhdmlvcnMgYW5kIGhhdmUgYSBtYXNzaXZlIG1lbW9yeSBmb290cHJpbnQuIFNlZSBzZXRWb2ljaW5nVmlzaWJsZSgpXHJcbiAgLy8gYW5kIFZvaWNpbmcudHMgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgVm9pY2luZy5cclxuICBwdWJsaWMgcmVhZG9ubHkgdm9pY2luZ1Zpc2libGVQcm9wZXJ0eTogVGlueVByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBBcmVhcyBmb3IgaGl0IGludGVyc2VjdGlvbi4gSWYgc2V0IG9uIGEgTm9kZSwgbm8gZGVzY2VuZGFudHMgY2FuIGhhbmRsZSBldmVudHMuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9tb3VzZUFyZWE6IFNoYXBlIHwgQm91bmRzMiB8IG51bGw7IC8vIGZvciBtb3VzZSBwb3NpdGlvbiBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gIHB1YmxpYyBfdG91Y2hBcmVhOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsOyAvLyBmb3IgdG91Y2ggYW5kIHBlbiBwb3NpdGlvbiBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG5cclxuICAvLyBUaGUgQ1NTIGN1cnNvciB0byBiZSBkaXNwbGF5ZWQgb3ZlciB0aGlzIE5vZGUuIG51bGwgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IChpbmhlcml0KSB2YWx1ZS5cclxuICBwcml2YXRlIF9jdXJzb3I6IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIE9yZGVyZWQgYXJyYXkgb2YgY2hpbGQgTm9kZXMuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9jaGlsZHJlbjogTm9kZVtdO1xyXG5cclxuICAvLyBVbm9yZGVyZWQgYXJyYXkgb2YgcGFyZW50IE5vZGVzLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfcGFyZW50czogTm9kZVtdO1xyXG5cclxuICAvLyBXaGV0aGVyIHdlIHdpbGwgZG8gbW9yZSBhY2N1cmF0ZSAoYW5kIHRpZ2h0KSBib3VuZHMgY29tcHV0YXRpb25zIGZvciByb3RhdGlvbnMgYW5kIHNoZWFycy5cclxuICBwcml2YXRlIF90cmFuc2Zvcm1Cb3VuZHM6IGJvb2xlYW47XHJcblxyXG4gIC8vIFNldCB1cCB0aGUgdHJhbnNmb3JtIHJlZmVyZW5jZS4gd2UgYWRkIGEgbGlzdGVuZXIgc28gdGhhdCB0aGUgdHJhbnNmb3JtIGl0c2VsZiBjYW4gYmUgbW9kaWZpZWQgZGlyZWN0bHlcclxuICAvLyBieSByZWZlcmVuY2UsIHRyaWdnZXJpbmcgdGhlIGV2ZW50IG5vdGlmaWNhdGlvbnMgZm9yIFNjZW5lcnkgVGhlIHJlZmVyZW5jZSB0byB0aGUgVHJhbnNmb3JtMyB3aWxsIG5ldmVyIGNoYW5nZS5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3RyYW5zZm9ybTogVHJhbnNmb3JtMztcclxuICBwdWJsaWMgX3RyYW5zZm9ybUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvLyBNYXhpbXVtIGRpbWVuc2lvbnMgZm9yIHRoZSBOb2RlJ3MgbG9jYWwgYm91bmRzIGJlZm9yZSBhIGNvcnJlY3RpdmUgc2NhbGluZyBmYWN0b3IgaXMgYXBwbGllZCB0byBtYWludGFpbiBzaXplLlxyXG4gIC8vIFRoZSBtYXhpbXVtIGRpbWVuc2lvbnMgYXJlIGFsd2F5cyBjb21wYXJlZCB0byBsb2NhbCBib3VuZHMsIGFuZCBhcHBsaWVkIFwiYmVmb3JlXCIgdGhlIE5vZGUncyB0cmFuc2Zvcm0uXHJcbiAgLy8gV2hlbmV2ZXIgdGhlIGxvY2FsIGJvdW5kcyBvciBtYXhpbXVtIGRpbWVuc2lvbnMgb2YgdGhpcyBOb2RlIGNoYW5nZSBhbmQgaXQgaGFzIGF0IGxlYXN0IG9uZSBtYXhpbXVtIGRpbWVuc2lvblxyXG4gIC8vICh3aWR0aCBvciBoZWlnaHQpLCBhbiBpZGVhbCBzY2FsZSBpcyBjb21wdXRlZCAoZWl0aGVyIHRoZSBzbWFsbGVzdCBzY2FsZSBmb3Igb3VyIGxvY2FsIGJvdW5kcyB0byBmaXQgdGhlXHJcbiAgLy8gZGltZW5zaW9uIGNvbnN0cmFpbnRzLCBPUiAxLCB3aGljaGV2ZXIgaXMgbG93ZXIpLiBUaGVuIHRoZSBOb2RlJ3MgdHJhbnNmb3JtIHdpbGwgYmUgc2NhbGVkIChwcmVwZW5kZWQpIHdpdGhcclxuICAvLyBhIHNjYWxlIGFkanVzdG1lbnQgb2YgKCBpZGVhbFNjYWxlIC8gYWxyZWFkeUFwcGxpZWRTY2FsZUZhY3RvciApLlxyXG4gIC8vIEluIHRoZSBzaW1wbGUgY2FzZSB3aGVyZSB0aGUgTm9kZSBpc24ndCBvdGhlcndpc2UgdHJhbnNmb3JtZWQsIHRoaXMgd2lsbCBhcHBseSBhbmQgdXBkYXRlIHRoZSBOb2RlJ3Mgc2NhbGUgc28gdGhhdFxyXG4gIC8vIHRoZSBOb2RlIG1hdGNoZXMgdGhlIG1heGltdW0gZGltZW5zaW9ucywgd2hpbGUgbmV2ZXIgc2NhbGluZyBvdmVyIDEuIE5vdGUgdGhhdCBtYW51YWxseSBhcHBseWluZyB0cmFuc2Zvcm1zIHRvXHJcbiAgLy8gdGhlIE5vZGUgaXMgZmluZSwgYnV0IG1heSBtYWtlIHRoZSBOb2RlJ3Mgd2lkdGggZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtIHdpZHRoLlxyXG4gIC8vIE5PVEU6IElmIGEgZGltZW5zaW9uIGNvbnN0cmFpbnQgaXMgbnVsbCwgbm8gcmVzaXppbmcgd2lsbCBvY2N1ciBkdWUgdG8gaXQuIElmIGJvdGggbWF4V2lkdGggYW5kIG1heEhlaWdodCBhcmUgbnVsbCxcclxuICAvLyBubyBzY2FsZSBhZGp1c3RtZW50IHdpbGwgYmUgYXBwbGllZC5cclxuICAvL1xyXG4gIC8vIEFsc28gbm90ZSB0aGF0IHNldHRpbmcgbWF4V2lkdGgvbWF4SGVpZ2h0IGlzIGxpa2UgYWRkaW5nIGEgbG9jYWwgYm91bmRzIGxpc3RlbmVyICh3aWxsIHRyaWdnZXIgdmFsaWRhdGlvbiBvZlxyXG4gIC8vIGJvdW5kcyBkdXJpbmcgdGhlIHVwZGF0ZURpc3BsYXkgc3RlcCkuIE5PVEU6IHRoaXMgbWVhbnMgdXBkYXRlcyB0byB0aGUgdHJhbnNmb3JtIChvbiBhIGxvY2FsIGJvdW5kcyBjaGFuZ2UpIHdpbGxcclxuICAvLyBoYXBwZW4gd2hlbiBib3VuZHMgYXJlIHZhbGlkYXRlZCAodmFsaWRhdGVCb3VuZHMoKSksIHdoaWNoIGRvZXMgbm90IGhhcHBlbiBzeW5jaHJvbm91c2x5IG9uIGEgY2hpbGQncyBzaXplXHJcbiAgLy8gY2hhbmdlLiBJdCBkb2VzIGhhcHBlbiBhdCBsZWFzdCBvbmNlIGluIHVwZGF0ZURpc3BsYXkoKSBiZWZvcmUgcmVuZGVyaW5nLCBhbmQgY2FsbGluZyB2YWxpZGF0ZUJvdW5kcygpIGNhbiBmb3JjZVxyXG4gIC8vIGEgcmUtY2hlY2sgYW5kIHRyYW5zZm9ybS5cclxuICBwcml2YXRlIF9tYXhXaWR0aDogbnVtYmVyIHwgbnVsbDtcclxuICBwcml2YXRlIF9tYXhIZWlnaHQ6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8vIFNjYWxlIGFwcGxpZWQgZHVlIHRvIHRoZSBtYXhpbXVtIGRpbWVuc2lvbiBjb25zdHJhaW50cy5cclxuICBwcml2YXRlIF9hcHBsaWVkU2NhbGVGYWN0b3I6IG51bWJlcjtcclxuXHJcbiAgLy8gRm9yIHVzZXIgaW5wdXQgaGFuZGxpbmcgKG1vdXNlL3RvdWNoKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9pbnB1dExpc3RlbmVyczogVElucHV0TGlzdGVuZXJbXTtcclxuXHJcbiAgLy8gW211dGFibGVdIEJvdW5kcyBmb3IgdGhpcyBOb2RlIGFuZCBpdHMgY2hpbGRyZW4gaW4gdGhlIFwicGFyZW50XCIgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAvLyBOT1RFOiBUaGUgcmVmZXJlbmNlIGhlcmUgd2lsbCBub3QgY2hhbmdlLCB3ZSB3aWxsIGp1c3Qgbm90aWZ5IHVzaW5nIHRoZSBlcXVpdmFsZW50IHN0YXRpYyBub3RpZmljYXRpb24gbWV0aG9kLlxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgKiphc3luY2hyb25vdXNseSoqICh1c3VhbGx5IGFzIHBhcnQgb2YgYSBEaXNwbGF5LnVwZGF0ZURpc3BsYXkoKSkgd2hlbiB0aGUgYm91bmRzIG9mIHRoZSBOb2RlXHJcbiAgLy8gaXMgY2hhbmdlZC5cclxuICBwdWJsaWMgcmVhZG9ubHkgYm91bmRzUHJvcGVydHk6IFRpbnlTdGF0aWNQcm9wZXJ0eTxCb3VuZHMyPjtcclxuXHJcbiAgLy8gW211dGFibGVdIEJvdW5kcyBmb3IgdGhpcyBOb2RlIGFuZCBpdHMgY2hpbGRyZW4gaW4gdGhlIFwibG9jYWxcIiBjb29yZGluYXRlIGZyYW1lLlxyXG4gIC8vIE5PVEU6IFRoZSByZWZlcmVuY2UgaGVyZSB3aWxsIG5vdCBjaGFuZ2UsIHdlIHdpbGwganVzdCBub3RpZnkgdXNpbmcgdGhlIGVxdWl2YWxlbnQgc3RhdGljIG5vdGlmaWNhdGlvbiBtZXRob2QuXHJcbiAgLy8gTk9URTogVGhpcyBpcyBmaXJlZCAqKmFzeW5jaHJvbm91c2x5KiogKHVzdWFsbHkgYXMgcGFydCBvZiBhIERpc3BsYXkudXBkYXRlRGlzcGxheSgpKSB3aGVuIHRoZSBsb2NhbEJvdW5kcyBvZlxyXG4gIC8vIHRoZSBOb2RlIGlzIGNoYW5nZWQuXHJcbiAgcHVibGljIHJlYWRvbmx5IGxvY2FsQm91bmRzUHJvcGVydHk6IFRpbnlTdGF0aWNQcm9wZXJ0eTxCb3VuZHMyPjtcclxuXHJcbiAgLy8gW211dGFibGVdIEJvdW5kcyBqdXN0IGZvciBjaGlsZHJlbiBvZiB0aGlzIE5vZGUgKGFuZCBzdWItdHJlZXMpLCBpbiB0aGUgXCJsb2NhbFwiIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgLy8gTk9URTogVGhlIHJlZmVyZW5jZSBoZXJlIHdpbGwgbm90IGNoYW5nZSwgd2Ugd2lsbCBqdXN0IG5vdGlmeSB1c2luZyB0aGUgZXF1aXZhbGVudCBzdGF0aWMgbm90aWZpY2F0aW9uIG1ldGhvZC5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkICoqYXN5bmNocm9ub3VzbHkqKiAodXN1YWxseSBhcyBwYXJ0IG9mIGEgRGlzcGxheS51cGRhdGVEaXNwbGF5KCkpIHdoZW4gdGhlIGNoaWxkQm91bmRzIG9mIHRoZVxyXG4gIC8vIE5vZGUgaXMgY2hhbmdlZC5cclxuICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRCb3VuZHNQcm9wZXJ0eTogVGlueVN0YXRpY1Byb3BlcnR5PEJvdW5kczI+O1xyXG5cclxuICAvLyBbbXV0YWJsZV0gQm91bmRzIGp1c3QgZm9yIHRoaXMgTm9kZSwgaW4gdGhlIFwibG9jYWxcIiBjb29yZGluYXRlIGZyYW1lLlxyXG4gIC8vIE5PVEU6IFRoZSByZWZlcmVuY2UgaGVyZSB3aWxsIG5vdCBjaGFuZ2UsIHdlIHdpbGwganVzdCBub3RpZnkgdXNpbmcgdGhlIGVxdWl2YWxlbnQgc3RhdGljIG5vdGlmaWNhdGlvbiBtZXRob2QuXHJcbiAgLy8gTk9URTogVGhpcyBldmVudCBjYW4gYmUgZmlyZWQgc3luY2hyb25vdXNseSwgYW5kIGhhcHBlbnMgd2l0aCB0aGUgc2VsZi1ib3VuZHMgb2YgYSBOb2RlIGlzIGNoYW5nZWQuIFRoaXMgaXMgTk9UXHJcbiAgLy8gbGlrZSB0aGUgb3RoZXIgYm91bmRzIFByb3BlcnRpZXMsIHdoaWNoIHVzdWFsbHkgZmlyZSBhc3luY2hyb25vdXNseVxyXG4gIHB1YmxpYyByZWFkb25seSBzZWxmQm91bmRzUHJvcGVydHk6IFRpbnlTdGF0aWNQcm9wZXJ0eTxCb3VuZHMyPjtcclxuXHJcbiAgLy8gV2hldGhlciBvdXIgbG9jYWxCb3VuZHMgaGF2ZSBiZWVuIHNldCAod2l0aCB0aGUgRVM1IHNldHRlci9zZXRMb2NhbEJvdW5kcygpKSB0byBhIGN1c3RvbVxyXG4gIC8vIG92ZXJyaWRkZW4gdmFsdWUuIElmIHRydWUsIHRoZW4gbG9jYWxCb3VuZHMgaXRzZWxmIHdpbGwgbm90IGJlIHVwZGF0ZWQsIGJ1dCB3aWxsIGluc3RlYWQgYWx3YXlzIGJlIHRoZVxyXG4gIC8vIG92ZXJyaWRkZW4gdmFsdWUuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9sb2NhbEJvdW5kc092ZXJyaWRkZW46IGJvb2xlYW47XHJcblxyXG4gIC8vIFttdXRhYmxlXSBXaGV0aGVyIGludmlzaWJsZSBjaGlsZHJlbiB3aWxsIGJlIGV4Y2x1ZGVkIGZyb20gdGhpcyBOb2RlJ3MgYm91bmRzXHJcbiAgcHJpdmF0ZSBfZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogYm9vbGVhbjtcclxuXHJcbiAgLy8gT3B0aW9ucyB0aGF0IGNhbiBiZSBwcm92aWRlZCB0byBsYXlvdXQgbWFuYWdlcnMgdG8gYWRqdXN0IHBvc2l0aW9uaW5nIGZvciB0aGlzIG5vZGUuXHJcbiAgcHJpdmF0ZSBfbGF5b3V0T3B0aW9uczogVExheW91dE9wdGlvbnMgfCBudWxsO1xyXG5cclxuICAvLyBXaGV0aGVyIGJvdW5kcyBuZWVkcyB0byBiZSByZWNvbXB1dGVkIHRvIGJlIHZhbGlkLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYm91bmRzRGlydHk6IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgbG9jYWxCb3VuZHMgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byBiZSB2YWxpZC5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2xvY2FsQm91bmRzRGlydHk6IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgc2VsZkJvdW5kcyBuZWVkcyB0byBiZSByZWNvbXB1dGVkIHRvIGJlIHZhbGlkLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfc2VsZkJvdW5kc0RpcnR5OiBib29sZWFuO1xyXG5cclxuICAvLyBXaGV0aGVyIGNoaWxkQm91bmRzIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQgdG8gYmUgdmFsaWQuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9jaGlsZEJvdW5kc0RpcnR5OiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2ZpbHRlcnM6IEZpbHRlcltdO1xyXG5cclxuICBwcml2YXRlIF9vcmlnaW5hbEJvdW5kcz86IEJvdW5kczI7IC8vIElmIGFzc2VydGlvbnMgYXJlIGVuYWJsZWRcclxuICBwcml2YXRlIF9vcmlnaW5hbExvY2FsQm91bmRzPzogQm91bmRzMjsgLy8gSWYgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZFxyXG4gIHByaXZhdGUgX29yaWdpbmFsU2VsZkJvdW5kcz86IEJvdW5kczI7IC8vIElmIGFzc2VydGlvbnMgYXJlIGVuYWJsZWRcclxuICBwcml2YXRlIF9vcmlnaW5hbENoaWxkQm91bmRzPzogQm91bmRzMjsgLy8gSWYgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZFxyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgUGVyZm9ybWFuY2UgaGludDogV2hhdCB0eXBlIG9mIHJlbmRlcmVyIHNob3VsZCBiZSBmb3JjZWQgZm9yIHRoaXMgTm9kZS4gVXNlcyB0aGUgaW50ZXJuYWxcclxuICAvLyBiaXRtYXNrIHN0cnVjdHVyZSBkZWNsYXJlZCBpbiBSZW5kZXJlci5cclxuICBwdWJsaWMgX3JlbmRlcmVyOiBudW1iZXI7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBQZXJmb3JtYW5jZSBoaW50OiBXaGV0aGVyIGl0IGlzIGFudGljaXBhdGVkIHRoYXQgb3BhY2l0eSB3aWxsIGJlIHN3aXRjaGVkIG9uLiBJZiBzbywgaGF2aW5nIHRoaXNcclxuICAvLyBzZXQgdG8gdHJ1ZSB3aWxsIG1ha2Ugc3dpdGNoaW5nIGJhY2stYW5kLWZvcnRoIGJldHdlZW4gb3BhY2l0eToxIGFuZCBvdGhlciBvcGFjaXRpZXMgbXVjaCBmYXN0ZXIuXHJcbiAgcHVibGljIF91c2VzT3BhY2l0eTogYm9vbGVhbjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFBlcmZvcm1hbmNlIGhpbnQ6IFdoZXRoZXIgbGF5ZXJzIHNob3VsZCBiZSBzcGxpdCBiZWZvcmUgYW5kIGFmdGVyIHRoaXMgTm9kZS5cclxuICBwdWJsaWMgX2xheWVyU3BsaXQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBQZXJmb3JtYW5jZSBoaW50OiBXaGV0aGVyIHRoaXMgTm9kZSBhbmQgaXRzIHN1YnRyZWUgc2hvdWxkIGhhbmRsZSB0cmFuc2Zvcm1zIGJ5IHVzaW5nIGEgQ1NTXHJcbiAgLy8gdHJhbnNmb3JtIG9mIGEgZGl2LlxyXG4gIHB1YmxpYyBfY3NzVHJhbnNmb3JtOiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgUGVyZm9ybWFuY2UgaGludDogV2hldGhlciBTVkcgKG9yIG90aGVyKSBjb250ZW50IHNob3VsZCBiZSBleGNsdWRlZCBmcm9tIHRoZSBET00gdHJlZSB3aGVuXHJcbiAgLy8gaW52aXNpYmxlIChpbnN0ZWFkIG9mIGp1c3QgYmVpbmcgaGlkZGVuKVxyXG4gIHB1YmxpYyBfZXhjbHVkZUludmlzaWJsZTogYm9vbGVhbjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFBlcmZvcm1hbmNlIGhpbnQ6IElmIG5vbi1udWxsLCBhIG11bHRpcGxpZXIgdG8gdGhlIGRldGVjdGVkIHBpeGVsLXRvLXBpeGVsIHNjYWxpbmcgb2YgdGhlXHJcbiAgLy8gV2ViR0wgQ2FudmFzXHJcbiAgcHVibGljIF93ZWJnbFNjYWxlOiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgUGVyZm9ybWFuY2UgaGludDogSWYgdHJ1ZSwgU2NlbmVyeSB3aWxsIG5vdCBmaXQgYW55IGJsb2NrcyB0aGF0IGNvbnRhaW4gZHJhd2FibGVzIGF0dGFjaGVkIHRvXHJcbiAgLy8gTm9kZXMgdW5kZXJuZWF0aCB0aGlzIE5vZGUncyBzdWJ0cmVlLiBUaGlzIHdpbGwgdHlwaWNhbGx5IHByZXZlbnQgU2NlbmVyeSBmcm9tIHRyaWdnZXJpbmcgYm91bmRzIGNvbXB1dGF0aW9uIGZvclxyXG4gIC8vIHRoaXMgc3ViLXRyZWUsIGFuZCBtb3ZlbWVudCBvZiB0aGlzIE5vZGUgb3IgaXRzIGRlc2NlbmRhbnRzIHdpbGwgbmV2ZXIgdHJpZ2dlciB0aGUgcmVmaXR0aW5nIG9mIGEgYmxvY2suXHJcbiAgcHVibGljIF9wcmV2ZW50Rml0OiBib29sZWFuO1xyXG5cclxuICAvLyBUaGlzIGlzIGZpcmVkIG9ubHkgb25jZSBmb3IgYW55IHNpbmdsZSBvcGVyYXRpb24gdGhhdCBtYXkgY2hhbmdlIHRoZSBjaGlsZHJlbiBvZiBhIE5vZGUuXHJcbiAgLy8gRm9yIGV4YW1wbGUsIGlmIGEgTm9kZSdzIGNoaWxkcmVuIGFyZSBbIGEsIGIgXSBhbmQgc2V0Q2hpbGRyZW4oIFsgYSwgeCwgeSwgeiBdICkgaXMgY2FsbGVkIG9uIGl0LCB0aGVcclxuICAvLyBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBvbmx5IGJlIGZpcmVkIG9uY2UgYWZ0ZXIgdGhlIGVudGlyZSBvcGVyYXRpb24gb2YgY2hhbmdpbmcgdGhlIGNoaWxkcmVuIGlzIGNvbXBsZXRlZC5cclxuICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRyZW5DaGFuZ2VkRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRm9yIGV2ZXJ5IHNpbmdsZSBhZGRlZCBjaGlsZCBOb2RlLCBlbWl0cyB3aXRoIHtOb2RlfSBOb2RlLCB7bnVtYmVyfSBpbmRleE9mQ2hpbGRcclxuICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRJbnNlcnRlZEVtaXR0ZXI6IFRFbWl0dGVyPFsgbm9kZTogTm9kZSwgaW5kZXhPZkNoaWxkOiBudW1iZXIgXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRm9yIGV2ZXJ5IHNpbmdsZSByZW1vdmVkIGNoaWxkIE5vZGUsIGVtaXRzIHdpdGgge05vZGV9IE5vZGUsIHtudW1iZXJ9IGluZGV4T2ZDaGlsZFxyXG4gIHB1YmxpYyByZWFkb25seSBjaGlsZFJlbW92ZWRFbWl0dGVyOiBURW1pdHRlcjxbIG5vZGU6IE5vZGUsIGluZGV4T2ZDaGlsZDogbnVtYmVyIF0+ID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIFByb3ZpZGVzIGEgZ2l2ZW4gcmFuZ2UgdGhhdCBtYXkgYmUgYWZmZWN0ZWQgYnkgdGhlIHJlb3JkZXJpbmdcclxuICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyOiBURW1pdHRlcjxbIG1pbkNoYW5nZWRJbmRleDogbnVtYmVyLCBtYXhDaGFuZ2VkSW5kZXg6IG51bWJlciBdPiA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCB3aGVuZXZlciBhIHBhcmVudCBpcyBhZGRlZFxyXG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnRBZGRlZEVtaXR0ZXI6IFRFbWl0dGVyPFsgbm9kZTogTm9kZSBdPiA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCB3aGVuZXZlciBhIHBhcmVudCBpcyByZW1vdmVkXHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudFJlbW92ZWRFbWl0dGVyOiBURW1pdHRlcjxbIG5vZGU6IE5vZGUgXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRmlyZWQgc3luY2hyb25vdXNseSB3aGVuIHRoZSB0cmFuc2Zvcm0gKHRyYW5zZm9ybWF0aW9uIG1hdHJpeCkgb2YgYSBOb2RlIGlzIGNoYW5nZWQuIEFueVxyXG4gIC8vIGNoYW5nZSB0byBhIE5vZGUncyB0cmFuc2xhdGlvbi9yb3RhdGlvbi9zY2FsZS9ldGMuIHdpbGwgdHJpZ2dlciB0aGlzIGV2ZW50LlxyXG4gIHB1YmxpYyByZWFkb25seSB0cmFuc2Zvcm1FbWl0dGVyOiBURW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBTaG91bGQgYmUgZW1pdHRlZCB3aGVuIHdlIG5lZWQgdG8gY2hlY2sgZnVsbCBtZXRhZGF0YSB1cGRhdGVzIGRpcmVjdGx5IG9uIEluc3RhbmNlcyxcclxuICAvLyB0byBzZWUgaWYgd2UgbmVlZCB0byBjaGFuZ2UgZHJhd2FibGUgdHlwZXMsIGV0Yy5cclxuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VSZWZyZXNoRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRW1pdHRlZCB0byB3aGVuIHdlIG5lZWQgdG8gcG90ZW50aWFsbHkgcmVjb21wdXRlIG91ciByZW5kZXJlciBzdW1tYXJ5IChiaXRtYXNrIGZsYWdzLCBvclxyXG4gIC8vIHRoaW5ncyB0aGF0IGNvdWxkIGFmZmVjdCBkZXNjZW5kYW50cylcclxuICBwdWJsaWMgcmVhZG9ubHkgcmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEVtaXR0ZWQgdG8gd2hlbiB3ZSBjaGFuZ2UgZmlsdGVycyAoZWl0aGVyIG9wYWNpdHkgb3IgZ2VuZXJhbGl6ZWQgZmlsdGVycylcclxuICBwdWJsaWMgcmVhZG9ubHkgZmlsdGVyQ2hhbmdlRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRmlyZWQgd2hlbiBhbiBpbnN0YW5jZSBpcyBjaGFuZ2VkIChhZGRlZC9yZW1vdmVkKS4gQ0FSRUZVTCEhIFRoaXMgaXMgcG90ZW50aWFsbHkgYSB2ZXJ5IGRhbmdlcm91cyB0aGluZyB0byBsaXN0ZW5cclxuICAvLyB0by4gSW5zdGFuY2VzIGFyZSB1cGRhdGVkIGluIGFuIGFzeW5jaHJvbm91cyBiYXRjaCBkdXJpbmcgYHVwZGF0ZURpc3BsYXkoKWAsIGFuZCBpdCBpcyB2ZXJ5IGltcG9ydGFudCB0aGF0IGRpc3BsYXlcclxuICAvLyB1cGRhdGVzIGRvIG5vdCBjYXVzZSBjaGFuZ2VzIHRoZSBzY2VuZSBncmFwaC4gVGh1cywgdGhpcyBlbWl0dGVyIHNob3VsZCBORVZFUiB0cmlnZ2VyIGEgTm9kZSdzIHN0YXRlIHRvIGNoYW5nZS5cclxuICAvLyBDdXJyZW50bHksIGFsbCB1c2FnZXMgb2YgdGhpcyBjYXVzZSBpbnRvIHVwZGF0ZXMgdG8gdGhlIGF1ZGlvIHZpZXcsIG9yIHVwZGF0ZXMgdG8gYSBzZXBhcmF0ZSBkaXNwbGF5ICh1c2VkIGFzIGFuXHJcbiAgLy8gb3ZlcmxheSkuIFBsZWFzZSBwcm9jZWVkIHdpdGggY2F1dGlvbi4gTW9zdCBsaWtlbHkgeW91IHByZWZlciB0byB1c2UgdGhlIHN5bmNocm9ub3VzIHN1cHBvcnQgb2YgRGlzcGxheWVkVHJhaWxzUHJvcGVydHksXHJcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNjE1IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTYyMCBmb3IgZGV0YWlscy5cclxuICBwdWJsaWMgcmVhZG9ubHkgY2hhbmdlZEluc3RhbmNlRW1pdHRlcjogVEVtaXR0ZXI8WyBpbnN0YW5jZTogSW5zdGFuY2UsIGFkZGVkOiBib29sZWFuIF0+ID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW5ldmVyIHRoaXMgbm9kZSBpcyBhZGRlZCBhcyBhIHJvb3QgdG8gYSBEaXNwbGF5IE9SIHdoZW4gaXQgaXMgcmVtb3ZlZCBhcyBhIHJvb3QgZnJvbSBhIERpc3BsYXkgKGkuZS5cclxuICAvLyB0aGUgRGlzcGxheSBpcyBkaXNwb3NlZCkuXHJcbiAgcHVibGljIHJlYWRvbmx5IHJvb3RlZERpc3BsYXlDaGFuZ2VkRW1pdHRlcjogVEVtaXR0ZXI8WyBkaXNwbGF5OiBEaXNwbGF5IF0+ID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW4gbGF5b3V0T3B0aW9ucyBjaGFuZ2VzXHJcbiAgcHVibGljIHJlYWRvbmx5IGxheW91dE9wdGlvbnNDaGFuZ2VkRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gQSBiaXRtYXNrIHdoaWNoIHNwZWNpZmllcyB3aGljaCByZW5kZXJlcnMgdGhpcyBOb2RlIChhbmQgb25seSB0aGlzIE5vZGUsIG5vdCBpdHMgc3VidHJlZSkgc3VwcG9ydHMuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9yZW5kZXJlckJpdG1hc2s6IG51bWJlcjtcclxuXHJcbiAgLy8gQSBiaXRtYXNrLWxpa2Ugc3VtbWFyeSBvZiB3aGF0IHJlbmRlcmVycyBhbmQgb3B0aW9ucyBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgTm9kZSBhbmQgYWxsIG9mIGl0cyBkZXNjZW5kYW50c1xyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfcmVuZGVyZXJTdW1tYXJ5OiBSZW5kZXJlclN1bW1hcnk7XHJcblxyXG4gIC8vIFNvIHdlIGNhbiB0cmF2ZXJzZSBvbmx5IHRoZSBzdWJ0cmVlcyB0aGF0IHJlcXVpcmUgYm91bmRzIHZhbGlkYXRpb24gZm9yIGV2ZW50cyBmaXJpbmcuXHJcbiAgLy8gVGhpcyBpcyBhIHN1bSBvZiB0aGUgbnVtYmVyIG9mIGV2ZW50cyByZXF1aXJpbmcgYm91bmRzIHZhbGlkYXRpb24gb24gdGhpcyBOb2RlLCBwbHVzIHRoZSBudW1iZXIgb2YgY2hpbGRyZW4gd2hvc2VcclxuICAvLyBjb3VudCBpcyBub24temVyby5cclxuICAvLyBOT1RFOiB0aGlzIG1lYW5zIHRoYXQgaWYgQSBoYXMgYSBjaGlsZCBCLCBhbmQgQiBoYXMgYSBib3VuZHNFdmVudENvdW50IG9mIDUsIGl0IG9ubHkgY29udHJpYnV0ZXMgMSB0byBBJ3MgY291bnQuXHJcbiAgLy8gVGhpcyBhbGxvd3MgdXMgdG8gaGF2ZSBjaGFuZ2VzIGxvY2FsaXplZCAoaW5jcmVhc2luZyBCJ3MgY291bnQgd29uJ3QgY2hhbmdlIEEgb3IgYW55IG9mIEEncyBhbmNlc3RvcnMpLCBhbmRcclxuICAvLyBndWFyYW50ZWVzIHRoYXQgd2Ugd2lsbCBrbm93IHdoZXRoZXIgYSBzdWJ0cmVlIGhhcyBib3VuZHMgbGlzdGVuZXJzLiBBbHNvIGltcG9ydGFudDogZGVjcmVhc2luZyBCJ3NcclxuICAvLyBib3VuZHNFdmVudENvdW50IGRvd24gdG8gMCB3aWxsIGFsbG93IEEgdG8gZGVjcmVhc2UgaXRzIGNvdW50IGJ5IDEsIHdpdGhvdXQgaGF2aW5nIHRvIGNoZWNrIGl0cyBvdGhlciBjaGlsZHJlblxyXG4gIC8vIChpZiB3ZSB3ZXJlIGp1c3QgdXNpbmcgYSBib29sZWFuIHZhbHVlLCB0aGlzIG9wZXJhdGlvbiB3b3VsZCByZXF1aXJlIEEgdG8gY2hlY2sgaWYgYW55IE9USEVSIGNoaWxkcmVuIGJlc2lkZXNcclxuICAvLyBCIGhhZCBib3VuZHMgbGlzdGVuZXJzKVxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYm91bmRzRXZlbnRDb3VudDogbnVtYmVyO1xyXG5cclxuICAvLyBUaGlzIHNpZ25hbHMgdGhhdCB3ZSBjYW4gdmFsaWRhdGVCb3VuZHMoKSBvbiB0aGlzIHN1YnRyZWUgYW5kIHdlIGRvbid0IGhhdmUgdG8gdHJhdmVyc2UgZnVydGhlclxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYm91bmRzRXZlbnRTZWxmQ291bnQ6IG51bWJlcjtcclxuXHJcbiAgLy8gU3ViY29tcG9uZW50IGRlZGljYXRlZCB0byBoaXQgdGVzdGluZ1xyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfcGlja2VyOiBQaWNrZXI7XHJcblxyXG4gIC8vIFRoZXJlIGFyZSBjZXJ0YWluIHNwZWNpZmljIGNhc2VzIChpbiB0aGlzIGNhc2UgZHVlIHRvIGExMXkpIHdoZXJlIHdlIG5lZWRcclxuICAvLyB0byBrbm93IHRoYXQgYSBOb2RlIGlzIGdldHRpbmcgcmVtb3ZlZCBmcm9tIGl0cyBwYXJlbnQgQlVUIHRoYXQgcHJvY2VzcyBoYXMgbm90IGNvbXBsZXRlZCB5ZXQuIEl0IHdvdWxkIGJlIGlkZWFsXHJcbiAgLy8gdG8gbm90IG5lZWQgdGhpcy5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2lzR2V0dGluZ1JlbW92ZWRGcm9tUGFyZW50OiBib29sZWFuO1xyXG5cclxuICAvLyB7T2JqZWN0fSAtIEEgbWFwcGluZyBvZiBhbGwgb2Ygb3B0aW9ucyB0aGF0IHJlcXVpcmUgQm91bmRzIHRvIGJlIGFwcGxpZWQgcHJvcGVybHkuIE1vc3Qgb2Z0ZW4gdGhlc2Ugc2hvdWxkIGJlIHNldCB0aHJvdWdoIGBtdXRhdGVgIGluIHRoZSBlbmQgb2YgdGhlIGNvbnN0cnVjb3IgaW5zdGVhZCBvZiBiZWluZyBwYXNzZWQgdGhyb3VnaCBgc3VwZXIoKWBcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUyA9IFJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUztcclxuXHJcbiAgLy8gVXNlZCBieSBzY2VuZXJ5RGVzZXJpYWxpemVcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3NlcmlhbGl6YXRpb24/OiBJbnRlbnRpb25hbEFueTtcclxuXHJcbiAgLy8gVHJhY2tzIGFueSBsYXlvdXQgY29uc3RyYWludCwgc28gdGhhdCB3ZSBjYW4gYXZvaWQgaGF2aW5nIG11bHRpcGxlIGxheW91dCBjb25zdHJhaW50cyBvbiB0aGUgc2FtZSBub2RlXHJcbiAgLy8gKGFuZCBhdm9pZCB0aGUgaW5maW5pdGUgbG9vcHMgdGhhdCBjYW4gaGFwcGVuIGlmIHRoYXQgaXMgdHJpZ2dlcmVkKS5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2FjdGl2ZVBhcmVudExheW91dENvbnN0cmFpbnQ6IExheW91dENvbnN0cmFpbnQgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gVGhpcyBpcyBhbiBhcnJheSBvZiBwcm9wZXJ0eSAoc2V0dGVyKSBuYW1lcyBmb3IgTm9kZS5tdXRhdGUoKSwgd2hpY2ggYXJlIGFsc28gdXNlZCB3aGVuIGNyZWF0aW5nXHJcbiAgLy8gTm9kZXMgd2l0aCBwYXJhbWV0ZXIgb2JqZWN0cy5cclxuICAvL1xyXG4gIC8vIEUuZy4gbmV3IHBoZXQuc2NlbmVyeS5Ob2RlKCB7IHg6IDUsIHJvdGF0aW9uOiAyMCB9ICkgd2lsbCBjcmVhdGUgYSBQYXRoLCBhbmQgYXBwbHkgc2V0dGVycyBpbiB0aGUgb3JkZXIgYmVsb3dcclxuICAvLyAobm9kZS54ID0gNTsgbm9kZS5yb3RhdGlvbiA9IDIwKVxyXG4gIC8vXHJcbiAgLy8gU29tZSBzcGVjaWFsIGNhc2VzIGV4aXN0IChmb3IgZnVuY3Rpb24gbmFtZXMpLiBuZXcgcGhldC5zY2VuZXJ5Lk5vZGUoIHsgc2NhbGU6IDIgfSApIHdpbGwgYWN0dWFsbHkgY2FsbFxyXG4gIC8vIG5vZGUuc2NhbGUoIDIgKS5cclxuICAvL1xyXG4gIC8vIFRoZSBvcmRlciBiZWxvdyBpcyBpbXBvcnRhbnQhIERvbid0IGNoYW5nZSB0aGlzIHdpdGhvdXQga25vd2luZyB0aGUgaW1wbGljYXRpb25zLlxyXG4gIC8vXHJcbiAgLy8gTk9URTogVHJhbnNsYXRpb24tYmFzZWQgbXV0YXRvcnMgY29tZSBiZWZvcmUgcm90YXRpb24vc2NhbGUsIHNpbmNlIHR5cGljYWxseSB3ZSB0aGluayBvZiB0aGVpciBvcGVyYXRpb25zXHJcbiAgLy8gICAgICAgb2NjdXJyaW5nIFwiYWZ0ZXJcIiB0aGUgcm90YXRpb24gLyBzY2FsaW5nXHJcbiAgLy8gTk9URTogbGVmdC9yaWdodC90b3AvYm90dG9tL2NlbnRlclgvY2VudGVyWSBhcmUgYXQgdGhlIGVuZCwgc2luY2UgdGhleSByZWx5IHBvdGVudGlhbGx5IG9uIHJvdGF0aW9uIC8gc2NhbGluZ1xyXG4gIC8vICAgICAgIGNoYW5nZXMgb2YgYm91bmRzIHRoYXQgbWF5IGhhcHBlbiBiZWZvcmVoYW5kXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9tdXRhdG9yS2V5cyE6IHN0cmluZ1tdO1xyXG5cclxuICAvLyBMaXN0IG9mIGFsbCBkaXJ0eSBmbGFncyB0aGF0IHNob3VsZCBiZSBhdmFpbGFibGUgb24gZHJhd2FibGVzIGNyZWF0ZWQgZnJvbSB0aGlzIE5vZGUgKG9yXHJcbiAgLy8gc3VidHlwZSkuIEdpdmVuIGEgZmxhZyAoZS5nLiByYWRpdXMpLCBpdCBpbmRpY2F0ZXMgdGhlIGV4aXN0ZW5jZSBvZiBhIGZ1bmN0aW9uXHJcbiAgLy8gZHJhd2FibGUubWFya0RpcnR5UmFkaXVzKCkgdGhhdCB3aWxsIGluZGljYXRlIHRvIHRoZSBkcmF3YWJsZSB0aGF0IHRoZSByYWRpdXMgaGFzIGNoYW5nZWQuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgLy9cclxuICAvLyBTaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBzdWJ0eXBlcy5cclxuICBwdWJsaWMgZHJhd2FibGVNYXJrRmxhZ3MhOiBzdHJpbmdbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIE5vZGUgd2l0aCBvcHRpb25zLlxyXG4gICAqXHJcbiAgICogTk9URTogRGlyZWN0bHkgY3JlYXRlZCBOb2RlcyAobm90IG9mIGFueSBzdWJ0eXBlLCBidXQgY3JlYXRlZCB3aXRoIFwibmV3IE5vZGUoIC4uLiApXCIpIGFyZSBnZW5lcmFsbHkgdXNlZCBhc1xyXG4gICAqICAgICAgIGNvbnRhaW5lcnMsIHdoaWNoIGNhbiBob2xkIG90aGVyIE5vZGVzLCBzdWJ0eXBlcyBvZiBOb2RlIHRoYXQgY2FuIGRpc3BsYXkgdGhpbmdzLlxyXG4gICAqXHJcbiAgICogTm9kZSBhbmQgaXRzIHN1YnR5cGVzIGdlbmVyYWxseSBoYXZlIHRoZSBsYXN0IGNvbnN0cnVjdG9yIHBhcmFtZXRlciByZXNlcnZlZCBmb3IgdGhlICdvcHRpb25zJyBvYmplY3QuIFRoaXMgaXMgYVxyXG4gICAqIGtleS12YWx1ZSBtYXAgdGhhdCBzcGVjaWZpZXMgcmVsZXZhbnQgb3B0aW9ucyB0aGF0IGFyZSB1c2VkIGJ5IE5vZGUgYW5kIHN1YnR5cGVzLlxyXG4gICAqXHJcbiAgICogRm9yIGV4YW1wbGUsIG9uZSBvZiBOb2RlJ3Mgb3B0aW9ucyBpcyBib3R0b20sIGFuZCBvbmUgb2YgQ2lyY2xlJ3Mgb3B0aW9ucyBpcyByYWRpdXMuIFdoZW4gYSBjaXJjbGUgaXMgY3JlYXRlZDpcclxuICAgKiAgIHZhciBjaXJjbGUgPSBuZXcgQ2lyY2xlKCB7XHJcbiAgICogICAgIHJhZGl1czogMTAsXHJcbiAgICogICAgIGJvdHRvbTogMjAwXHJcbiAgICogICB9ICk7XHJcbiAgICogVGhpcyB3aWxsIGNyZWF0ZSBhIENpcmNsZSwgc2V0IGl0cyByYWRpdXMgKGJ5IGV4ZWN1dGluZyBjaXJjbGUucmFkaXVzID0gMTAsIHdoaWNoIHVzZXMgY2lyY2xlLnNldFJhZGl1cygpKSwgYW5kXHJcbiAgICogdGhlbiB3aWxsIGFsaWduIHRoZSBib3R0b20gb2YgdGhlIGNpcmNsZSBhbG9uZyB5PTIwMCAoYnkgZXhlY3V0aW5nIGNpcmNsZS5ib3R0b20gPSAyMDAsIHdoaWNoIHVzZXNcclxuICAgKiBub2RlLnNldEJvdHRvbSgpKS5cclxuICAgKlxyXG4gICAqIFRoZSBvcHRpb25zIGFyZSBleGVjdXRlZCBpbiB0aGUgb3JkZXIgc3BlY2lmaWVkIGJ5IGVhY2ggdHlwZXMgX211dGF0b3JLZXlzIHByb3BlcnR5LlxyXG4gICAqXHJcbiAgICogVGhlIG9wdGlvbnMgb2JqZWN0IGlzIGN1cnJlbnRseSBub3QgY2hlY2tlZCB0byBzZWUgd2hldGhlciB0aGVyZSBhcmUgcHJvcGVydHkgKGtleSkgbmFtZXMgdGhhdCBhcmUgbm90IHVzZWQsIHNvIGl0XHJcbiAgICogaXMgY3VycmVudGx5IGxlZ2FsIHRvIGRvIFwibmV3IE5vZGUoIHsgZm9ya19raXRjaGVuX3Nwb29uOiA1IH0gKVwiLlxyXG4gICAqXHJcbiAgICogVXN1YWxseSwgYW4gb3B0aW9uIChlLmcuICd2aXNpYmxlJyksIHdoZW4gdXNlZCBpbiBhIGNvbnN0cnVjdG9yIG9yIG11dGF0ZSgpIGNhbGwsIHdpbGwgZGlyZWN0bHkgdXNlIHRoZSBFUzUgc2V0dGVyXHJcbiAgICogZm9yIHRoYXQgcHJvcGVydHkgKGUuZy4gbm9kZS52aXNpYmxlID0gLi4uKSwgd2hpY2ggZ2VuZXJhbGx5IGZvcndhcmRzIHRvIGEgbm9uLUVTNSBzZXR0ZXIgZnVuY3Rpb25cclxuICAgKiAoZS5nLiBub2RlLnNldFZpc2libGUoIC4uLiApKSB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciB0aGUgYmVoYXZpb3IuIERvY3VtZW50YXRpb24gaXMgZ2VuZXJhbGx5IG9uIHRoZXNlIG1ldGhvZHNcclxuICAgKiAoZS5nLiBzZXRWaXNpYmxlKSwgYWx0aG91Z2ggc29tZSBtZXRob2RzIG1heSBiZSBkeW5hbWljYWxseSBjcmVhdGVkIHRvIGF2b2lkIHZlcmJvc2l0eSAobGlrZSBub2RlLmxlZnRUb3ApLlxyXG4gICAqXHJcbiAgICogU29tZXRpbWVzLCBvcHRpb25zIGludm9rZSBhIGZ1bmN0aW9uIGluc3RlYWQgKGUuZy4gJ3NjYWxlJykgYmVjYXVzZSB0aGUgdmVyYiBhbmQgbm91biBhcmUgaWRlbnRpY2FsLiBJbiB0aGlzIGNhc2UsXHJcbiAgICogaW5zdGVhZCBvZiBzZXR0aW5nIHRoZSBzZXR0ZXIgKG5vZGUuc2NhbGUgPSAuLi4sIHdoaWNoIHdvdWxkIG92ZXJyaWRlIHRoZSBmdW5jdGlvbiksIGl0IHdpbGwgaW5zdGVhZCBjYWxsXHJcbiAgICogdGhlIG1ldGhvZCBkaXJlY3RseSAoZS5nLiBub2RlLnNjYWxlKCAuLi4gKSkuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLl9pZCA9IGdsb2JhbElkQ291bnRlcisrO1xyXG4gICAgdGhpcy5faW5zdGFuY2VzID0gW107XHJcbiAgICB0aGlzLl9yb290ZWREaXNwbGF5cyA9IFtdO1xyXG4gICAgdGhpcy5fZHJhd2FibGVzID0gW107XHJcbiAgICB0aGlzLl92aXNpYmxlUHJvcGVydHkgPSBuZXcgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSggREVGQVVMVF9PUFRJT05TLnZpc2libGUsIERFRkFVTFRfT1BUSU9OUy5waGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQsXHJcbiAgICAgIHRoaXMub25WaXNpYmxlUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcbiAgICB0aGlzLm9wYWNpdHlQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHkoIERFRkFVTFRfT1BUSU9OUy5vcGFjaXR5LCB0aGlzLm9uT3BhY2l0eVByb3BlcnR5Q2hhbmdlLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5kaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHkoIERFRkFVTFRfT1BUSU9OUy5kaXNhYmxlZE9wYWNpdHksIHRoaXMub25EaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eUNoYW5nZS5iaW5kKCB0aGlzICkgKTtcclxuICAgIHRoaXMuX3BpY2thYmxlUHJvcGVydHkgPSBuZXcgVGlueUZvcndhcmRpbmdQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4oIERFRkFVTFRfT1BUSU9OUy5waWNrYWJsZSxcclxuICAgICAgZmFsc2UsIHRoaXMub25QaWNrYWJsZVByb3BlcnR5Q2hhbmdlLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5fZW5hYmxlZFByb3BlcnR5ID0gbmV3IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8Ym9vbGVhbj4oIERFRkFVTFRfT1BUSU9OUy5lbmFibGVkLFxyXG4gICAgICBERUZBVUxUX09QVElPTlMucGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkLCB0aGlzLm9uRW5hYmxlZFByb3BlcnR5Q2hhbmdlLmJpbmQoIHRoaXMgKSApO1xyXG5cclxuICAgIHRoaXMuX2lucHV0RW5hYmxlZFByb3BlcnR5ID0gbmV3IFRpbnlGb3J3YXJkaW5nUHJvcGVydHkoIERFRkFVTFRfT1BUSU9OUy5pbnB1dEVuYWJsZWQsXHJcbiAgICAgIERFRkFVTFRfT1BUSU9OUy5waGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCApO1xyXG4gICAgdGhpcy5jbGlwQXJlYVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eTxTaGFwZSB8IG51bGw+KCBERUZBVUxUX09QVElPTlMuY2xpcEFyZWEgKTtcclxuICAgIHRoaXMudm9pY2luZ1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8Ym9vbGVhbj4oIHRydWUgKTtcclxuICAgIHRoaXMuX21vdXNlQXJlYSA9IERFRkFVTFRfT1BUSU9OUy5tb3VzZUFyZWE7XHJcbiAgICB0aGlzLl90b3VjaEFyZWEgPSBERUZBVUxUX09QVElPTlMudG91Y2hBcmVhO1xyXG4gICAgdGhpcy5fY3Vyc29yID0gREVGQVVMVF9PUFRJT05TLmN1cnNvcjtcclxuICAgIHRoaXMuX2NoaWxkcmVuID0gW107XHJcbiAgICB0aGlzLl9wYXJlbnRzID0gW107XHJcbiAgICB0aGlzLl90cmFuc2Zvcm1Cb3VuZHMgPSBERUZBVUxUX09QVElPTlMudHJhbnNmb3JtQm91bmRzO1xyXG4gICAgdGhpcy5fdHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybTMoKTtcclxuICAgIHRoaXMuX3RyYW5zZm9ybUxpc3RlbmVyID0gdGhpcy5vblRyYW5zZm9ybUNoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm0uY2hhbmdlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5fdHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuX21heFdpZHRoID0gREVGQVVMVF9PUFRJT05TLm1heFdpZHRoO1xyXG4gICAgdGhpcy5fbWF4SGVpZ2h0ID0gREVGQVVMVF9PUFRJT05TLm1heEhlaWdodDtcclxuICAgIHRoaXMuX2FwcGxpZWRTY2FsZUZhY3RvciA9IDE7XHJcbiAgICB0aGlzLl9pbnB1dExpc3RlbmVycyA9IFtdO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSBERUZBVUxUX0lOVEVSTkFMX1JFTkRFUkVSO1xyXG4gICAgdGhpcy5fdXNlc09wYWNpdHkgPSBERUZBVUxUX09QVElPTlMudXNlc09wYWNpdHk7XHJcbiAgICB0aGlzLl9sYXllclNwbGl0ID0gREVGQVVMVF9PUFRJT05TLmxheWVyU3BsaXQ7XHJcbiAgICB0aGlzLl9jc3NUcmFuc2Zvcm0gPSBERUZBVUxUX09QVElPTlMuY3NzVHJhbnNmb3JtO1xyXG4gICAgdGhpcy5fZXhjbHVkZUludmlzaWJsZSA9IERFRkFVTFRfT1BUSU9OUy5leGNsdWRlSW52aXNpYmxlO1xyXG4gICAgdGhpcy5fd2ViZ2xTY2FsZSA9IERFRkFVTFRfT1BUSU9OUy53ZWJnbFNjYWxlO1xyXG4gICAgdGhpcy5fcHJldmVudEZpdCA9IERFRkFVTFRfT1BUSU9OUy5wcmV2ZW50Rml0O1xyXG5cclxuICAgIHRoaXMuaW5wdXRFbmFibGVkUHJvcGVydHkubGF6eUxpbmsoIHRoaXMucGRvbUJvdW5kSW5wdXRFbmFibGVkTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBBZGQgbGlzdGVuZXIgY291bnQgY2hhbmdlIG5vdGlmaWNhdGlvbnMgaW50byB0aGVzZSBQcm9wZXJ0aWVzLCBzaW5jZSB3ZSBuZWVkIHRvIGtub3cgd2hlbiB0aGVpciBudW1iZXIgb2YgbGlzdGVuZXJzXHJcbiAgICAvLyBjaGFuZ2VzIGR5bmFtaWNhbGx5LlxyXG4gICAgY29uc3QgYm91bmRzTGlzdGVuZXJzQWRkZWRPclJlbW92ZWRMaXN0ZW5lciA9IHRoaXMub25Cb3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZC5iaW5kKCB0aGlzICk7XHJcblxyXG4gICAgY29uc3QgYm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIgPSB0aGlzLnZhbGlkYXRlQm91bmRzLmJpbmQoIHRoaXMgKTtcclxuICAgIGNvbnN0IHNlbGZCb3VuZHNJbnZhbGlkYXRpb25MaXN0ZW5lciA9IHRoaXMudmFsaWRhdGVTZWxmQm91bmRzLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICB0aGlzLmJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlTdGF0aWNQcm9wZXJ0eSggQm91bmRzMi5OT1RISU5HLmNvcHkoKSwgYm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuYm91bmRzUHJvcGVydHkuY2hhbmdlQ291bnQgPSBib3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZExpc3RlbmVyO1xyXG5cclxuICAgIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eSA9IG5ldyBUaW55U3RhdGljUHJvcGVydHkoIEJvdW5kczIuTk9USElORy5jb3B5KCksIGJvdW5kc0ludmFsaWRhdGlvbkxpc3RlbmVyICk7XHJcbiAgICB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkuY2hhbmdlQ291bnQgPSBib3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZExpc3RlbmVyO1xyXG5cclxuICAgIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eSA9IG5ldyBUaW55U3RhdGljUHJvcGVydHkoIEJvdW5kczIuTk9USElORy5jb3B5KCksIGJvdW5kc0ludmFsaWRhdGlvbkxpc3RlbmVyICk7XHJcbiAgICB0aGlzLmNoaWxkQm91bmRzUHJvcGVydHkuY2hhbmdlQ291bnQgPSBib3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZExpc3RlbmVyO1xyXG5cclxuICAgIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlTdGF0aWNQcm9wZXJ0eSggQm91bmRzMi5OT1RISU5HLmNvcHkoKSwgc2VsZkJvdW5kc0ludmFsaWRhdGlvbkxpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuID0gZmFsc2U7XHJcbiAgICB0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzID0gZmFsc2U7XHJcbiAgICB0aGlzLl9sYXlvdXRPcHRpb25zID0gbnVsbDtcclxuICAgIHRoaXMuX2JvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuICAgIHRoaXMuX2xvY2FsQm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgdGhpcy5fc2VsZkJvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuICAgIHRoaXMuX2NoaWxkQm91bmRzRGlydHkgPSB0cnVlO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAvLyBmb3IgYXNzZXJ0aW9ucyBsYXRlciB0byBlbnN1cmUgdGhhdCB3ZSBhcmUgdXNpbmcgdGhlIHNhbWUgQm91bmRzMiBjb3BpZXMgYXMgYmVmb3JlXHJcbiAgICAgIHRoaXMuX29yaWdpbmFsQm91bmRzID0gdGhpcy5ib3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICAgIHRoaXMuX29yaWdpbmFsTG9jYWxCb3VuZHMgPSB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgICB0aGlzLl9vcmlnaW5hbFNlbGZCb3VuZHMgPSB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICAgIHRoaXMuX29yaWdpbmFsQ2hpbGRCb3VuZHMgPSB0aGlzLmNoaWxkQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ZpbHRlcnMgPSBbXTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlckJpdG1hc2sgPSBSZW5kZXJlci5iaXRtYXNrTm9kZURlZmF1bHQ7XHJcbiAgICB0aGlzLl9yZW5kZXJlclN1bW1hcnkgPSBuZXcgUmVuZGVyZXJTdW1tYXJ5KCB0aGlzICk7XHJcblxyXG4gICAgdGhpcy5fYm91bmRzRXZlbnRDb3VudCA9IDA7XHJcbiAgICB0aGlzLl9ib3VuZHNFdmVudFNlbGZDb3VudCA9IDA7XHJcbiAgICB0aGlzLl9waWNrZXIgPSBuZXcgUGlja2VyKCB0aGlzICk7XHJcbiAgICB0aGlzLl9pc0dldHRpbmdSZW1vdmVkRnJvbVBhcmVudCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICggb3B0aW9ucyApIHtcclxuICAgICAgdGhpcy5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBJbnNlcnRzIGEgY2hpbGQgTm9kZSBhdCBhIHNwZWNpZmljIGluZGV4LlxyXG4gICAqXHJcbiAgICogbm9kZS5pbnNlcnRDaGlsZCggMCwgY2hpbGROb2RlICkgd2lsbCBpbnNlcnQgdGhlIGNoaWxkIGludG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgY2hpbGRyZW4gYXJyYXkgKG9uIHRoZSBib3R0b21cclxuICAgKiB2aXN1YWxseSkuXHJcbiAgICpcclxuICAgKiBub2RlLmluc2VydENoaWxkKCBub2RlLmNoaWxkcmVuLmxlbmd0aCwgY2hpbGROb2RlICkgaXMgZXF1aXZhbGVudCB0byBub2RlLmFkZENoaWxkKCBjaGlsZE5vZGUgKSwgYW5kIGFwcGVuZHMgaXRcclxuICAgKiB0byB0aGUgZW5kICh0b3AgdmlzdWFsbHkpIG9mIHRoZSBjaGlsZHJlbiBhcnJheS4gSXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIG5vZGUuYWRkQ2hpbGQgd2hlbiBwb3NzaWJsZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IG92ZXJyaWRkZW4gYnkgTGVhZiBmb3Igc29tZSBzdWJ0eXBlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIGluZGV4IC0gSW5kZXggd2hlcmUgdGhlIGluc2VydGVkIGNoaWxkIE5vZGUgd2lsbCBiZSBhZnRlciB0aGlzIG9wZXJhdGlvbi5cclxuICAgKiBAcGFyYW0gbm9kZSAtIFRoZSBuZXcgY2hpbGQgdG8gaW5zZXJ0LlxyXG4gICAqIEBwYXJhbSBbaXNDb21wb3NpdGVdIC0gKHNjZW5lcnktaW50ZXJuYWwpIElmIHRydWUsIHRoZSBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBub3QgYmUgc2VudCBvdXQuXHJcbiAgICovXHJcbiAgcHVibGljIGluc2VydENoaWxkKCBpbmRleDogbnVtYmVyLCBub2RlOiBOb2RlLCBpc0NvbXBvc2l0ZT86IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlICE9PSBudWxsICYmIG5vZGUgIT09IHVuZGVmaW5lZCwgJ2luc2VydENoaWxkIGNhbm5vdCBpbnNlcnQgYSBudWxsL3VuZGVmaW5lZCBjaGlsZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFfLmluY2x1ZGVzKCB0aGlzLl9jaGlsZHJlbiwgbm9kZSApLCAnUGFyZW50IGFscmVhZHkgY29udGFpbnMgY2hpbGQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlICE9PSB0aGlzLCAnQ2Fubm90IGFkZCBzZWxmIGFzIGEgY2hpbGQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLl9wYXJlbnRzICE9PSBudWxsLCAnVHJpZWQgdG8gaW5zZXJ0IGEgZGlzcG9zZWQgY2hpbGQgbm9kZT8nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhbm9kZS5pc0Rpc3Bvc2VkLCAnVHJpZWQgdG8gaW5zZXJ0IGEgZGlzcG9zZWQgTm9kZScgKTtcclxuXHJcbiAgICAvLyBuZWVkcyB0byBiZSBlYXJseSB0byBwcmV2ZW50IHJlLWVudHJhbnQgY2hpbGRyZW4gbW9kaWZpY2F0aW9uc1xyXG4gICAgdGhpcy5fcGlja2VyLm9uSW5zZXJ0Q2hpbGQoIG5vZGUgKTtcclxuICAgIHRoaXMuY2hhbmdlQm91bmRzRXZlbnRDb3VudCggbm9kZS5fYm91bmRzRXZlbnRDb3VudCA+IDAgPyAxIDogMCApO1xyXG4gICAgdGhpcy5fcmVuZGVyZXJTdW1tYXJ5LnN1bW1hcnlDaGFuZ2UoIFJlbmRlcmVyU3VtbWFyeS5iaXRtYXNrQWxsLCBub2RlLl9yZW5kZXJlclN1bW1hcnkuYml0bWFzayApO1xyXG5cclxuICAgIG5vZGUuX3BhcmVudHMucHVzaCggdGhpcyApO1xyXG4gICAgaWYgKCBhc3NlcnQgJiYgd2luZG93LnBoZXQ/LmNoaXBwZXI/LnF1ZXJ5UGFyYW1ldGVycyAmJiBpc0Zpbml0ZSggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wYXJlbnRMaW1pdCApICkge1xyXG4gICAgICBjb25zdCBwYXJlbnRDb3VudCA9IG5vZGUuX3BhcmVudHMubGVuZ3RoO1xyXG4gICAgICBpZiAoIG1heFBhcmVudENvdW50IDwgcGFyZW50Q291bnQgKSB7XHJcbiAgICAgICAgbWF4UGFyZW50Q291bnQgPSBwYXJlbnRDb3VudDtcclxuICAgICAgICBjb25zb2xlLmxvZyggYE1heCBOb2RlIHBhcmVudHM6ICR7bWF4UGFyZW50Q291bnR9YCApO1xyXG4gICAgICAgIGFzc2VydCggbWF4UGFyZW50Q291bnQgPD0gcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wYXJlbnRMaW1pdCxcclxuICAgICAgICAgIGBwYXJlbnQgY291bnQgb2YgJHttYXhQYXJlbnRDb3VudH0gYWJvdmUgP3BhcmVudExpbWl0PSR7cGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wYXJlbnRMaW1pdH1gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoIGluZGV4LCAwLCBub2RlICk7XHJcbiAgICBpZiAoIGFzc2VydCAmJiB3aW5kb3cucGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzICYmIGlzRmluaXRlKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmNoaWxkTGltaXQgKSApIHtcclxuICAgICAgY29uc3QgY2hpbGRDb3VudCA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgaWYgKCBtYXhDaGlsZENvdW50IDwgY2hpbGRDb3VudCApIHtcclxuICAgICAgICBtYXhDaGlsZENvdW50ID0gY2hpbGRDb3VudDtcclxuICAgICAgICBjb25zb2xlLmxvZyggYE1heCBOb2RlIGNoaWxkcmVuOiAke21heENoaWxkQ291bnR9YCApO1xyXG4gICAgICAgIGFzc2VydCggbWF4Q2hpbGRDb3VudCA8PSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmNoaWxkTGltaXQsXHJcbiAgICAgICAgICBgY2hpbGQgY291bnQgb2YgJHttYXhDaGlsZENvdW50fSBhYm92ZSA/Y2hpbGRMaW1pdD0ke3BoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuY2hpbGRMaW1pdH1gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB0aGlzIGFkZGVkIHN1YnRyZWUgY29udGFpbnMgUERPTSBjb250ZW50LCB3ZSBuZWVkIHRvIG5vdGlmeSBhbnkgcmVsZXZhbnQgZGlzcGxheXNcclxuICAgIGlmICggIW5vZGUuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApIHtcclxuICAgICAgdGhpcy5vblBET01BZGRDaGlsZCggbm9kZSApO1xyXG4gICAgfVxyXG5cclxuICAgIG5vZGUuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG5cclxuICAgIC8vIGxpa2UgY2FsbGluZyB0aGlzLmludmFsaWRhdGVCb3VuZHMoKSwgYnV0IHdlIGFscmVhZHkgbWFya2VkIGFsbCBhbmNlc3RvcnMgd2l0aCBkaXJ0eSBjaGlsZCBib3VuZHNcclxuICAgIHRoaXMuX2JvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmNoaWxkSW5zZXJ0ZWRFbWl0dGVyLmVtaXQoIG5vZGUsIGluZGV4ICk7XHJcbiAgICBub2RlLnBhcmVudEFkZGVkRW1pdHRlci5lbWl0KCB0aGlzICk7XHJcblxyXG4gICAgIWlzQ29tcG9zaXRlICYmIHRoaXMuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwZW5kcyBhIGNoaWxkIE5vZGUgdG8gb3VyIGxpc3Qgb2YgY2hpbGRyZW4uXHJcbiAgICpcclxuICAgKiBUaGUgbmV3IGNoaWxkIE5vZGUgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gZnJvbnQgKG9uIHRvcCkgb2YgYWxsIG9mIHRoaXMgbm9kZSdzIG90aGVyIGNoaWxkcmVuLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5vZGVcclxuICAgKiBAcGFyYW0gW2lzQ29tcG9zaXRlXSAtIChzY2VuZXJ5LWludGVybmFsKSBJZiB0cnVlLCB0aGUgY2hpbGRyZW5DaGFuZ2VkIGV2ZW50IHdpbGwgbm90IGJlIHNlbnQgb3V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRDaGlsZCggbm9kZTogTm9kZSwgaXNDb21wb3NpdGU/OiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgdGhpcy5pbnNlcnRDaGlsZCggdGhpcy5fY2hpbGRyZW4ubGVuZ3RoLCBub2RlLCBpc0NvbXBvc2l0ZSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIGNoaWxkIE5vZGUgZnJvbSBvdXIgbGlzdCBvZiBjaGlsZHJlbiwgc2VlIGh0dHA6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvI25vZGUtcmVtb3ZlQ2hpbGRcclxuICAgKiBXaWxsIGZhaWwgYW4gYXNzZXJ0aW9uIGlmIHRoZSBOb2RlIGlzIG5vdCBjdXJyZW50bHkgb25lIG9mIG91ciBjaGlsZHJlblxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5vZGVcclxuICAgKiBAcGFyYW0gW2lzQ29tcG9zaXRlXSAtIChzY2VuZXJ5LWludGVybmFsKSBJZiB0cnVlLCB0aGUgY2hpbGRyZW5DaGFuZ2VkIGV2ZW50IHdpbGwgbm90IGJlIHNlbnQgb3V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVDaGlsZCggbm9kZTogTm9kZSwgaXNDb21wb3NpdGU/OiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSAmJiBub2RlIGluc3RhbmNlb2YgTm9kZSwgJ05lZWQgdG8gY2FsbCBub2RlLnJlbW92ZUNoaWxkKCkgd2l0aCBhIE5vZGUuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZCggbm9kZSApLCAnQXR0ZW1wdGVkIHRvIHJlbW92ZUNoaWxkIHdpdGggYSBub2RlIHRoYXQgd2FzIG5vdCBhIGNoaWxkLicgKTtcclxuXHJcbiAgICBjb25zdCBpbmRleE9mQ2hpbGQgPSBfLmluZGV4T2YoIHRoaXMuX2NoaWxkcmVuLCBub2RlICk7XHJcblxyXG4gICAgdGhpcy5yZW1vdmVDaGlsZFdpdGhJbmRleCggbm9kZSwgaW5kZXhPZkNoaWxkLCBpc0NvbXBvc2l0ZSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIGNoaWxkIE5vZGUgYXQgYSBzcGVjaWZpYyBpbmRleCAobm9kZS5jaGlsZHJlblsgaW5kZXggXSkgZnJvbSBvdXIgbGlzdCBvZiBjaGlsZHJlbi5cclxuICAgKiBXaWxsIGZhaWwgaWYgdGhlIGluZGV4IGlzIG91dCBvZiBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaW5kZXhcclxuICAgKiBAcGFyYW0gW2lzQ29tcG9zaXRlXSAtIChzY2VuZXJ5LWludGVybmFsKSBJZiB0cnVlLCB0aGUgY2hpbGRyZW5DaGFuZ2VkIGV2ZW50IHdpbGwgbm90IGJlIHNlbnQgb3V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVDaGlsZEF0KCBpbmRleDogbnVtYmVyLCBpc0NvbXBvc2l0ZT86IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCA+PSAwICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aCApO1xyXG5cclxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9jaGlsZHJlblsgaW5kZXggXTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZUNoaWxkV2l0aEluZGV4KCBub2RlLCBpbmRleCwgaXNDb21wb3NpdGUgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVybmFsIG1ldGhvZCBmb3IgcmVtb3ZpbmcgYSBOb2RlIChhbHdheXMgaGFzIHRoZSBOb2RlIGFuZCBpbmRleCkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBvdmVycmlkZGVuIGJ5IExlYWYgZm9yIHNvbWUgc3VidHlwZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSBub2RlIC0gVGhlIGNoaWxkIG5vZGUgdG8gcmVtb3ZlIGZyb20gdGhpcyBOb2RlIChpdCdzIHBhcmVudClcclxuICAgKiBAcGFyYW0gaW5kZXhPZkNoaWxkIC0gU2hvdWxkIHNhdGlzZnkgdGhpcy5jaGlsZHJlblsgaW5kZXhPZkNoaWxkIF0gPT09IG5vZGVcclxuICAgKiBAcGFyYW0gW2lzQ29tcG9zaXRlXSAtIChzY2VuZXJ5LWludGVybmFsKSBJZiB0cnVlLCB0aGUgY2hpbGRyZW5DaGFuZ2VkIGV2ZW50IHdpbGwgbm90IGJlIHNlbnQgb3V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVDaGlsZFdpdGhJbmRleCggbm9kZTogTm9kZSwgaW5kZXhPZkNoaWxkOiBudW1iZXIsIGlzQ29tcG9zaXRlPzogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUgJiYgbm9kZSBpbnN0YW5jZW9mIE5vZGUsICdOZWVkIHRvIGNhbGwgbm9kZS5yZW1vdmVDaGlsZFdpdGhJbmRleCgpIHdpdGggYSBOb2RlLicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzQ2hpbGQoIG5vZGUgKSwgJ0F0dGVtcHRlZCB0byByZW1vdmVDaGlsZCB3aXRoIGEgbm9kZSB0aGF0IHdhcyBub3QgYSBjaGlsZC4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jaGlsZHJlblsgaW5kZXhPZkNoaWxkIF0gPT09IG5vZGUsICdJbmNvcnJlY3QgaW5kZXggZm9yIHJlbW92ZUNoaWxkV2l0aEluZGV4JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fcGFyZW50cyAhPT0gbnVsbCwgJ1RyaWVkIHRvIHJlbW92ZSBhIGRpc3Bvc2VkIGNoaWxkIG5vZGU/JyApO1xyXG5cclxuICAgIGNvbnN0IGluZGV4T2ZQYXJlbnQgPSBfLmluZGV4T2YoIG5vZGUuX3BhcmVudHMsIHRoaXMgKTtcclxuXHJcbiAgICBub2RlLl9pc0dldHRpbmdSZW1vdmVkRnJvbVBhcmVudCA9IHRydWU7XHJcblxyXG4gICAgLy8gSWYgdGhpcyBhZGRlZCBzdWJ0cmVlIGNvbnRhaW5zIFBET00gY29udGVudCwgd2UgbmVlZCB0byBub3RpZnkgYW55IHJlbGV2YW50IGRpc3BsYXlzXHJcbiAgICAvLyBOT1RFOiBQb3RlbnRpYWxseSByZW1vdmVzIGJvdW5kcyBsaXN0ZW5lcnMgaGVyZSFcclxuICAgIGlmICggIW5vZGUuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApIHtcclxuICAgICAgdGhpcy5vblBET01SZW1vdmVDaGlsZCggbm9kZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG5lZWRzIHRvIGJlIGVhcmx5IHRvIHByZXZlbnQgcmUtZW50cmFudCBjaGlsZHJlbiBtb2RpZmljYXRpb25zXHJcbiAgICB0aGlzLl9waWNrZXIub25SZW1vdmVDaGlsZCggbm9kZSApO1xyXG4gICAgdGhpcy5jaGFuZ2VCb3VuZHNFdmVudENvdW50KCBub2RlLl9ib3VuZHNFdmVudENvdW50ID4gMCA/IC0xIDogMCApO1xyXG4gICAgdGhpcy5fcmVuZGVyZXJTdW1tYXJ5LnN1bW1hcnlDaGFuZ2UoIG5vZGUuX3JlbmRlcmVyU3VtbWFyeS5iaXRtYXNrLCBSZW5kZXJlclN1bW1hcnkuYml0bWFza0FsbCApO1xyXG5cclxuICAgIG5vZGUuX3BhcmVudHMuc3BsaWNlKCBpbmRleE9mUGFyZW50LCAxICk7XHJcbiAgICB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoIGluZGV4T2ZDaGlsZCwgMSApO1xyXG4gICAgbm9kZS5faXNHZXR0aW5nUmVtb3ZlZEZyb21QYXJlbnQgPSBmYWxzZTsgLy8gSXQgaXMgXCJjb21wbGV0ZVwiXHJcblxyXG4gICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICB0aGlzLl9jaGlsZEJvdW5kc0RpcnR5ID0gdHJ1ZTsgLy8gZm9yY2UgcmVjb21wdXRhdGlvbiBvZiBjaGlsZCBib3VuZHMgYWZ0ZXIgcmVtb3ZpbmcgYSBjaGlsZFxyXG5cclxuICAgIHRoaXMuY2hpbGRSZW1vdmVkRW1pdHRlci5lbWl0KCBub2RlLCBpbmRleE9mQ2hpbGQgKTtcclxuICAgIG5vZGUucGFyZW50UmVtb3ZlZEVtaXR0ZXIuZW1pdCggdGhpcyApO1xyXG5cclxuICAgICFpc0NvbXBvc2l0ZSAmJiB0aGlzLmNoaWxkcmVuQ2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIGEgY2hpbGQgaXMgbm90IGF0IHRoZSBnaXZlbiBpbmRleCwgaXQgaXMgbW92ZWQgdG8gdGhlIGdpdmVuIGluZGV4LiBUaGlzIHJlb3JkZXJzIHRoZSBjaGlsZHJlbiBvZiB0aGlzIE5vZGUgc29cclxuICAgKiB0aGF0IGB0aGlzLmNoaWxkcmVuWyBpbmRleCBdID09PSBub2RlYC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBub2RlIC0gVGhlIGNoaWxkIE5vZGUgdG8gbW92ZSBpbiB0aGUgb3JkZXJcclxuICAgKiBAcGFyYW0gaW5kZXggLSBUaGUgZGVzaXJlZCBpbmRleCAoaW50byB0aGUgY2hpbGRyZW4gYXJyYXkpIG9mIHRoZSBjaGlsZC5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZUNoaWxkVG9JbmRleCggbm9kZTogTm9kZSwgaW5kZXg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzQ2hpbGQoIG5vZGUgKSwgJ0F0dGVtcHRlZCB0byBtb3ZlQ2hpbGRUb0luZGV4IHdpdGggYSBub2RlIHRoYXQgd2FzIG5vdCBhIGNoaWxkLicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ICUgMSA9PT0gMCAmJiBpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICBgSW52YWxpZCBpbmRleDogJHtpbmRleH1gICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gdGhpcy5pbmRleE9mQ2hpbGQoIG5vZGUgKTtcclxuICAgIGlmICggdGhpcy5fY2hpbGRyZW5bIGluZGV4IF0gIT09IG5vZGUgKSB7XHJcblxyXG4gICAgICAvLyBBcHBseSB0aGUgYWN0dWFsIGNoaWxkcmVuIGNoYW5nZVxyXG4gICAgICB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoIGN1cnJlbnRJbmRleCwgMSApO1xyXG4gICAgICB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoIGluZGV4LCAwLCBub2RlICk7XHJcblxyXG4gICAgICBpZiAoICF0aGlzLl9yZW5kZXJlclN1bW1hcnkuaGFzTm9QRE9NKCkgKSB7XHJcbiAgICAgICAgdGhpcy5vblBET01SZW9yZGVyZWRDaGlsZHJlbigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmNoaWxkcmVuUmVvcmRlcmVkRW1pdHRlci5lbWl0KCBNYXRoLm1pbiggY3VycmVudEluZGV4LCBpbmRleCApLCBNYXRoLm1heCggY3VycmVudEluZGV4LCBpbmRleCApICk7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFsbCBjaGlsZHJlbiBmcm9tIHRoaXMgTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlQWxsQ2hpbGRyZW4oKTogdGhpcyB7XHJcbiAgICB0aGlzLnNldENoaWxkcmVuKCBbXSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2hpbGRyZW4gb2YgdGhlIE5vZGUgdG8gYmUgZXF1aXZhbGVudCB0byB0aGUgcGFzc2VkLWluIGFycmF5IG9mIE5vZGVzLlxyXG4gICAqXHJcbiAgICogTk9URTogTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzb21lIGNhc2VzXHJcbiAgICovXHJcbiAgcHVibGljIHNldENoaWxkcmVuKCBjaGlsZHJlbjogTm9kZVtdICk6IHRoaXMge1xyXG4gICAgLy8gVGhlIGltcGxlbWVudGF0aW9uIGlzIHNwbGl0IGludG8gYmFzaWNhbGx5IHRocmVlIHN0YWdlczpcclxuICAgIC8vIDEuIFJlbW92ZSBjdXJyZW50IGNoaWxkcmVuIHRoYXQgYXJlIG5vdCBpbiB0aGUgbmV3IGNoaWxkcmVuIGFycmF5LlxyXG4gICAgLy8gMi4gUmVvcmRlciBjaGlsZHJlbiB0aGF0IGV4aXN0IGJvdGggYmVmb3JlL2FmdGVyIHRoZSBjaGFuZ2UuXHJcbiAgICAvLyAzLiBJbnNlcnQgaW4gbmV3IGNoaWxkcmVuXHJcblxyXG4gICAgY29uc3QgYmVmb3JlT25seTogTm9kZVtdID0gW107IC8vIFdpbGwgaG9sZCBhbGwgbm9kZXMgdGhhdCB3aWxsIGJlIHJlbW92ZWQuXHJcbiAgICBjb25zdCBhZnRlck9ubHk6IE5vZGVbXSA9IFtdOyAvLyBXaWxsIGhvbGQgYWxsIG5vZGVzIHRoYXQgd2lsbCBiZSBcIm5ld1wiIGNoaWxkcmVuIChhZGRlZClcclxuICAgIGNvbnN0IGluQm90aDogTm9kZVtdID0gW107IC8vIENoaWxkIG5vZGVzIHRoYXQgXCJzdGF5XCIuIFdpbGwgYmUgb3JkZXJlZCBmb3IgdGhlIFwiYWZ0ZXJcIiBjYXNlLlxyXG4gICAgbGV0IGk7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB3aGF0IHRoaW5ncyB3ZXJlIGFkZGVkLCByZW1vdmVkLCBvciBzdGF5LlxyXG4gICAgYXJyYXlEaWZmZXJlbmNlKCBjaGlsZHJlbiwgdGhpcy5fY2hpbGRyZW4sIGFmdGVyT25seSwgYmVmb3JlT25seSwgaW5Cb3RoICk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFueSBub2RlcyB0aGF0IGFyZSBub3QgaW4gdGhlIG5ldyBjaGlsZHJlbi5cclxuICAgIGZvciAoIGkgPSBiZWZvcmVPbmx5Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICB0aGlzLnJlbW92ZUNoaWxkKCBiZWZvcmVPbmx5WyBpIF0sIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jaGlsZHJlbi5sZW5ndGggPT09IGluQm90aC5sZW5ndGgsXHJcbiAgICAgICdSZW1vdmluZyBjaGlsZHJlbiBzaG91bGQgbm90IGhhdmUgdHJpZ2dlcmVkIG90aGVyIGNoaWxkcmVuIGNoYW5nZXMnICk7XHJcblxyXG4gICAgLy8gSGFuZGxlIHRoZSBtYWluIHJlb3JkZXJpbmcgKG9mIG5vZGVzIHRoYXQgXCJzdGF5XCIpXHJcbiAgICBsZXQgbWluQ2hhbmdlSW5kZXggPSAtMTsgLy8gV2hhdCBpcyB0aGUgc21hbGxlc3QgaW5kZXggd2hlcmUgdGhpcy5fY2hpbGRyZW5bIGluZGV4IF0gIT09IGluQm90aFsgaW5kZXggXVxyXG4gICAgbGV0IG1heENoYW5nZUluZGV4ID0gLTE7IC8vIFdoYXQgaXMgdGhlIGxhcmdlc3QgaW5kZXggd2hlcmUgdGhpcy5fY2hpbGRyZW5bIGluZGV4IF0gIT09IGluQm90aFsgaW5kZXggXVxyXG4gICAgZm9yICggaSA9IDA7IGkgPCBpbkJvdGgubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGRlc2lyZWQgPSBpbkJvdGhbIGkgXTtcclxuICAgICAgaWYgKCB0aGlzLl9jaGlsZHJlblsgaSBdICE9PSBkZXNpcmVkICkge1xyXG4gICAgICAgIHRoaXMuX2NoaWxkcmVuWyBpIF0gPSBkZXNpcmVkO1xyXG4gICAgICAgIGlmICggbWluQ2hhbmdlSW5kZXggPT09IC0xICkge1xyXG4gICAgICAgICAgbWluQ2hhbmdlSW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtYXhDaGFuZ2VJbmRleCA9IGk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIElmIG91ciBtaW5DaGFuZ2VJbmRleCBpcyBzdGlsbCAtMSwgdGhlbiBub25lIG9mIHRob3NlIG5vZGVzIHRoYXQgXCJzdGF5XCIgd2VyZSByZW9yZGVyZWQuIEl0J3MgaW1wb3J0YW50IHRvIGNoZWNrXHJcbiAgICAvLyBmb3IgdGhpcyBjYXNlLCBzbyB0aGF0IGBub2RlLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbmAgaXMgZWZmZWN0aXZlbHkgYSBuby1vcCBwZXJmb3JtYW5jZS13aXNlLlxyXG4gICAgY29uc3QgaGFzUmVvcmRlcmluZ0NoYW5nZSA9IG1pbkNoYW5nZUluZGV4ICE9PSAtMTtcclxuXHJcbiAgICAvLyBJbW1lZGlhdGUgY29uc2VxdWVuY2VzL3VwZGF0ZXMgZnJvbSByZW9yZGVyaW5nXHJcbiAgICBpZiAoIGhhc1Jlb3JkZXJpbmdDaGFuZ2UgKSB7XHJcbiAgICAgIGlmICggIXRoaXMuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApIHtcclxuICAgICAgICB0aGlzLm9uUERPTVJlb3JkZXJlZENoaWxkcmVuKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyLmVtaXQoIG1pbkNoYW5nZUluZGV4LCBtYXhDaGFuZ2VJbmRleCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBpbiBcIm5ld1wiIGNoaWxkcmVuLlxyXG4gICAgLy8gU2NhbiB0aHJvdWdoIHRoZSBcImVuZGluZ1wiIGNoaWxkcmVuIGluZGljZXMsIGFkZGluZyBpbiB0aGluZ3MgdGhhdCB3ZXJlIGluIHRoZSBcImFmdGVyT25seVwiIHBhcnQuIFRoaXMgc2NhbiBpc1xyXG4gICAgLy8gZG9uZSB0aHJvdWdoIHRoZSBjaGlsZHJlbiBhcnJheSBpbnN0ZWFkIG9mIHRoZSBhZnRlck9ubHkgYXJyYXkgKGFzIGRldGVybWluaW5nIHRoZSBpbmRleCBpbiBjaGlsZHJlbiB3b3VsZFxyXG4gICAgLy8gdGhlbiBiZSBxdWFkcmF0aWMgaW4gdGltZSwgd2hpY2ggd291bGQgYmUgdW5hY2NlcHRhYmxlIGhlcmUpLiBBdCB0aGlzIHBvaW50LCBhIGZvcndhcmQgc2NhbiBzaG91bGQgYmVcclxuICAgIC8vIHN1ZmZpY2llbnQgdG8gaW5zZXJ0IGluLXBsYWNlLCBhbmQgc2hvdWxkIG1vdmUgdGhlIGxlYXN0IGFtb3VudCBvZiBub2RlcyBpbiB0aGUgYXJyYXkuXHJcbiAgICBpZiAoIGFmdGVyT25seS5sZW5ndGggKSB7XHJcbiAgICAgIGxldCBhZnRlckluZGV4ID0gMDtcclxuICAgICAgbGV0IGFmdGVyID0gYWZ0ZXJPbmx5WyBhZnRlckluZGV4IF07XHJcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgaWYgKCBjaGlsZHJlblsgaSBdID09PSBhZnRlciApIHtcclxuICAgICAgICAgIHRoaXMuaW5zZXJ0Q2hpbGQoIGksIGFmdGVyLCB0cnVlICk7XHJcbiAgICAgICAgICBhZnRlciA9IGFmdGVyT25seVsgKythZnRlckluZGV4IF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGFkIGFueSBjaGFuZ2VzLCBzZW5kIHRoZSBnZW5lcmljIFwiY2hhbmdlZFwiIGV2ZW50LlxyXG4gICAgaWYgKCBiZWZvcmVPbmx5Lmxlbmd0aCAhPT0gMCB8fCBhZnRlck9ubHkubGVuZ3RoICE9PSAwIHx8IGhhc1Jlb3JkZXJpbmdDaGFuZ2UgKSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2FuaXR5IGNoZWNrcyB0byBtYWtlIHN1cmUgb3VyIHJlc3VsdGluZyBjaGlsZHJlbiBhcnJheSBpcyBjb3JyZWN0LlxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIGFzc2VydCggY2hpbGRyZW5bIGogXSA9PT0gdGhpcy5fY2hpbGRyZW5bIGogXSxcclxuICAgICAgICAgICdJbmNvcnJlY3QgY2hpbGQgYWZ0ZXIgc2V0Q2hpbGRyZW4sIHBvc3NpYmx5IGEgcmVlbnRyYW5jeSBpc3N1ZScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGFsbG93IGNoYWluaW5nXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRDaGlsZHJlbigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjaGlsZHJlbiggdmFsdWU6IE5vZGVbXSApIHtcclxuICAgIHRoaXMuc2V0Q2hpbGRyZW4oIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Q2hpbGRyZW4oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY2hpbGRyZW4oKTogTm9kZVtdIHtcclxuICAgIHJldHVybiB0aGlzLmdldENoaWxkcmVuKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgZGVmZW5zaXZlIGNvcHkgb2YgdGhlIGFycmF5IG9mIGRpcmVjdCBjaGlsZHJlbiBvZiB0aGlzIG5vZGUsIG9yZGVyZWQgYnkgd2hhdCBpcyBpbiBmcm9udCAobm9kZXMgYXRcclxuICAgKiB0aGUgZW5kIG9mIHRoZSBhcnJheSBhcmUgaW4gZnJvbnQgb2Ygbm9kZXMgYXQgdGhlIHN0YXJ0KS5cclxuICAgKlxyXG4gICAqIE1ha2luZyBjaGFuZ2VzIHRvIHRoZSByZXR1cm5lZCByZXN1bHQgd2lsbCBub3QgYWZmZWN0IHRoaXMgbm9kZSdzIGNoaWxkcmVuLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDaGlsZHJlbigpOiBOb2RlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuLnNsaWNlKCAwICk7IC8vIGNyZWF0ZSBhIGRlZmVuc2l2ZSBjb3B5XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY291bnQgb2YgY2hpbGRyZW4sIHdpdGhvdXQgbmVlZGluZyB0byBtYWtlIGEgZGVmZW5zaXZlIGNvcHkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENoaWxkcmVuQ291bnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgZGVmZW5zaXZlIGNvcHkgb2Ygb3VyIHBhcmVudHMuIFRoaXMgaXMgYW4gYXJyYXkgb2YgcGFyZW50IG5vZGVzIHRoYXQgaXMgcmV0dXJuZWQgaW4gbm8gcGFydGljdWxhclxyXG4gICAqIG9yZGVyIChhcyBvcmRlciBpcyBub3QgaW1wb3J0YW50IGhlcmUpLlxyXG4gICAqXHJcbiAgICogTk9URTogTW9kaWZ5aW5nIHRoZSByZXR1cm5lZCBhcnJheSB3aWxsIG5vdCBpbiBhbnkgd2F5IG1vZGlmeSB0aGlzIG5vZGUncyBwYXJlbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQYXJlbnRzKCk6IE5vZGVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50cy5zbGljZSggMCApOyAvLyBjcmVhdGUgYSBkZWZlbnNpdmUgY29weVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFBhcmVudHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcGFyZW50cygpOiBOb2RlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHNpbmdsZSBwYXJlbnQgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgbnVsbCAobm8gcGFyZW50cyksIG9yIGFuIGFzc2VydGlvbiBmYWlsdXJlIChtdWx0aXBsZSBwYXJlbnRzKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UGFyZW50KCk6IE5vZGUgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3BhcmVudHMubGVuZ3RoIDw9IDEsICdDYW5ub3QgY2FsbCBnZXRQYXJlbnQgb24gYSBub2RlIHdpdGggbXVsdGlwbGUgcGFyZW50cycgKTtcclxuICAgIHJldHVybiB0aGlzLl9wYXJlbnRzLmxlbmd0aCA/IHRoaXMuX3BhcmVudHNbIDAgXSA6IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UGFyZW50KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBhcmVudCgpOiBOb2RlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJlbnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGNoaWxkIGF0IGEgc3BlY2lmaWMgaW5kZXggaW50byB0aGUgY2hpbGRyZW4gYXJyYXkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENoaWxkQXQoIGluZGV4OiBudW1iZXIgKTogTm9kZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW5bIGluZGV4IF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgaW5kZXggb2YgYSBwYXJlbnQgTm9kZSBpbiB0aGUgcGFyZW50cyBhcnJheS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwYXJlbnQgLSBTaG91bGQgYmUgYSBwYXJlbnQgb2YgdGhpcyBub2RlLlxyXG4gICAqIEByZXR1cm5zIC0gQW4gaW5kZXggc3VjaCB0aGF0IHRoaXMucGFyZW50c1sgaW5kZXggXSA9PT0gcGFyZW50XHJcbiAgICovXHJcbiAgcHVibGljIGluZGV4T2ZQYXJlbnQoIHBhcmVudDogTm9kZSApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIF8uaW5kZXhPZiggdGhpcy5fcGFyZW50cywgcGFyZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgaW5kZXggb2YgYSBjaGlsZCBOb2RlIGluIHRoZSBjaGlsZHJlbiBhcnJheS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjaGlsZCAtIFNob3VsZCBiZSBhIGNoaWxkIG9mIHRoaXMgbm9kZS5cclxuICAgKiBAcmV0dXJucyAtIEFuIGluZGV4IHN1Y2ggdGhhdCB0aGlzLmNoaWxkcmVuWyBpbmRleCBdID09PSBjaGlsZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbmRleE9mQ2hpbGQoIGNoaWxkOiBOb2RlICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gXy5pbmRleE9mKCB0aGlzLl9jaGlsZHJlbiwgY2hpbGQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIHRoaXMgTm9kZSB0byB0aGUgZnJvbnQgKGVuZCkgb2YgYWxsIG9mIGl0cyBwYXJlbnRzIGNoaWxkcmVuIGFycmF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlVG9Gcm9udCgpOiB0aGlzIHtcclxuICAgIF8uZWFjaCggdGhpcy5wYXJlbnRzLCBwYXJlbnQgPT4gcGFyZW50Lm1vdmVDaGlsZFRvRnJvbnQoIHRoaXMgKSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgb25lIG9mIG91ciBjaGlsZHJlbiB0byB0aGUgZnJvbnQgKGVuZCkgb2Ygb3VyIGNoaWxkcmVuIGFycmF5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNoaWxkIC0gT3VyIGNoaWxkIHRvIG1vdmUgdG8gdGhlIGZyb250LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlQ2hpbGRUb0Zyb250KCBjaGlsZDogTm9kZSApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLm1vdmVDaGlsZFRvSW5kZXgoIGNoaWxkLCB0aGlzLl9jaGlsZHJlbi5sZW5ndGggLSAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlIHRoaXMgbm9kZSBvbmUgaW5kZXggZm9yd2FyZCBpbiBlYWNoIG9mIGl0cyBwYXJlbnRzLiAgSWYgdGhlIE5vZGUgaXMgYWxyZWFkeSBhdCB0aGUgZnJvbnQsIHRoaXMgaXMgYSBuby1vcC5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZUZvcndhcmQoKTogdGhpcyB7XHJcbiAgICB0aGlzLnBhcmVudHMuZm9yRWFjaCggcGFyZW50ID0+IHBhcmVudC5tb3ZlQ2hpbGRGb3J3YXJkKCB0aGlzICkgKTtcclxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgdGhlIHNwZWNpZmllZCBjaGlsZCBmb3J3YXJkIGJ5IG9uZSBpbmRleC4gIElmIHRoZSBjaGlsZCBpcyBhbHJlYWR5IGF0IHRoZSBmcm9udCwgdGhpcyBpcyBhIG5vLW9wLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlQ2hpbGRGb3J3YXJkKCBjaGlsZDogTm9kZSApOiB0aGlzIHtcclxuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mQ2hpbGQoIGNoaWxkICk7XHJcbiAgICBpZiAoIGluZGV4IDwgdGhpcy5nZXRDaGlsZHJlbkNvdW50KCkgLSAxICkge1xyXG4gICAgICB0aGlzLm1vdmVDaGlsZFRvSW5kZXgoIGNoaWxkLCBpbmRleCArIDEgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZSB0aGlzIG5vZGUgb25lIGluZGV4IGJhY2t3YXJkIGluIGVhY2ggb2YgaXRzIHBhcmVudHMuICBJZiB0aGUgTm9kZSBpcyBhbHJlYWR5IGF0IHRoZSBiYWNrLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVCYWNrd2FyZCgpOiB0aGlzIHtcclxuICAgIHRoaXMucGFyZW50cy5mb3JFYWNoKCBwYXJlbnQgPT4gcGFyZW50Lm1vdmVDaGlsZEJhY2t3YXJkKCB0aGlzICkgKTtcclxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgdGhlIHNwZWNpZmllZCBjaGlsZCBmb3J3YXJkIGJ5IG9uZSBpbmRleC4gIElmIHRoZSBjaGlsZCBpcyBhbHJlYWR5IGF0IHRoZSBiYWNrLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVDaGlsZEJhY2t3YXJkKCBjaGlsZDogTm9kZSApOiB0aGlzIHtcclxuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mQ2hpbGQoIGNoaWxkICk7XHJcbiAgICBpZiAoIGluZGV4ID4gMCApIHtcclxuICAgICAgdGhpcy5tb3ZlQ2hpbGRUb0luZGV4KCBjaGlsZCwgaW5kZXggLSAxICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIHRoaXMgTm9kZSB0byB0aGUgYmFjayAoZnJvbnQpIG9mIGFsbCBvZiBpdHMgcGFyZW50cyBjaGlsZHJlbiBhcnJheS5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZVRvQmFjaygpOiB0aGlzIHtcclxuICAgIF8uZWFjaCggdGhpcy5wYXJlbnRzLCBwYXJlbnQgPT4gcGFyZW50Lm1vdmVDaGlsZFRvQmFjayggdGhpcyApICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyBvbmUgb2Ygb3VyIGNoaWxkcmVuIHRvIHRoZSBiYWNrIChmcm9udCkgb2Ygb3VyIGNoaWxkcmVuIGFycmF5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNoaWxkIC0gT3VyIGNoaWxkIHRvIG1vdmUgdG8gdGhlIGJhY2suXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVDaGlsZFRvQmFjayggY2hpbGQ6IE5vZGUgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5tb3ZlQ2hpbGRUb0luZGV4KCBjaGlsZCwgMCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVwbGFjZSBhIGNoaWxkIGluIHRoaXMgbm9kZSdzIGNoaWxkcmVuIGFycmF5IHdpdGggYW5vdGhlciBub2RlLiBJZiB0aGUgb2xkIGNoaWxkIGhhZCBET00gZm9jdXMgYW5kXHJcbiAgICogdGhlIG5ldyBjaGlsZCBpcyBmb2N1c2FibGUsIHRoZSBuZXcgY2hpbGQgd2lsbCByZWNlaXZlIGZvY3VzIGFmdGVyIGl0IGlzIGFkZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXBsYWNlQ2hpbGQoIG9sZENoaWxkOiBOb2RlLCBuZXdDaGlsZDogTm9kZSApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzQ2hpbGQoIG9sZENoaWxkICksICdBdHRlbXB0ZWQgdG8gcmVwbGFjZSBhIG5vZGUgdGhhdCB3YXMgbm90IGEgY2hpbGQuJyApO1xyXG5cclxuICAgIC8vIGluZm9ybWF0aW9uIHRoYXQgbmVlZHMgdG8gYmUgcmVzdG9yZWRcclxuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mQ2hpbGQoIG9sZENoaWxkICk7XHJcbiAgICBjb25zdCBvbGRDaGlsZEZvY3VzZWQgPSBvbGRDaGlsZC5mb2N1c2VkO1xyXG5cclxuICAgIHRoaXMucmVtb3ZlQ2hpbGQoIG9sZENoaWxkLCB0cnVlICk7XHJcbiAgICB0aGlzLmluc2VydENoaWxkKCBpbmRleCwgbmV3Q2hpbGQsIHRydWUgKTtcclxuXHJcbiAgICB0aGlzLmNoaWxkcmVuQ2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG5cclxuICAgIGlmICggb2xkQ2hpbGRGb2N1c2VkICYmIG5ld0NoaWxkLmZvY3VzYWJsZSApIHtcclxuICAgICAgbmV3Q2hpbGQuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdGhpcyBOb2RlIGZyb20gYWxsIG9mIGl0cyBwYXJlbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkZXRhY2goKTogdGhpcyB7XHJcbiAgICBfLmVhY2goIHRoaXMuX3BhcmVudHMuc2xpY2UoIDAgKSwgcGFyZW50ID0+IHBhcmVudC5yZW1vdmVDaGlsZCggdGhpcyApICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgb3VyIGV2ZW50IGNvdW50LCB1c3VhbGx5IGJ5IDEgb3IgLTEuIFNlZSBkb2N1bWVudGF0aW9uIG9uIF9ib3VuZHNFdmVudENvdW50IGluIGNvbnN0cnVjdG9yLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG4gLSBIb3cgdG8gaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgYm91bmRzIGV2ZW50IGxpc3RlbmVyIGNvdW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjaGFuZ2VCb3VuZHNFdmVudENvdW50KCBuOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBpZiAoIG4gIT09IDAgKSB7XHJcbiAgICAgIGNvbnN0IHplcm9CZWZvcmUgPSB0aGlzLl9ib3VuZHNFdmVudENvdW50ID09PSAwO1xyXG5cclxuICAgICAgdGhpcy5fYm91bmRzRXZlbnRDb3VudCArPSBuO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9ib3VuZHNFdmVudENvdW50ID49IDAsICdzdWJ0cmVlIGJvdW5kcyBldmVudCBjb3VudCBzaG91bGQgYmUgZ3VhcmFudGVlZCB0byBiZSA+PSAwJyApO1xyXG5cclxuICAgICAgY29uc3QgemVyb0FmdGVyID0gdGhpcy5fYm91bmRzRXZlbnRDb3VudCA9PT0gMDtcclxuXHJcbiAgICAgIGlmICggemVyb0JlZm9yZSAhPT0gemVyb0FmdGVyICkge1xyXG4gICAgICAgIC8vIHBhcmVudHMgd2lsbCBvbmx5IGhhdmUgdGhlaXIgY291bnRcclxuICAgICAgICBjb25zdCBwYXJlbnREZWx0YSA9IHplcm9CZWZvcmUgPyAxIDogLTE7XHJcblxyXG4gICAgICAgIGNvbnN0IGxlbiA9IHRoaXMuX3BhcmVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgICAgICAgdGhpcy5fcGFyZW50c1sgaSBdLmNoYW5nZUJvdW5kc0V2ZW50Q291bnQoIHBhcmVudERlbHRhICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbnN1cmVzIHRoYXQgdGhlIGNhY2hlZCBzZWxmQm91bmRzIG9mIHRoaXMgTm9kZSBpcyBhY2N1cmF0ZS4gUmV0dXJucyB0cnVlIGlmIGFueSBzb3J0IG9mIGRpcnR5IGZsYWcgd2FzIHNldFxyXG4gICAqIGJlZm9yZSB0aGlzIHdhcyBjYWxsZWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdhcyB0aGUgc2VsZi1ib3VuZHMgcG90ZW50aWFsbHkgdXBkYXRlZD9cclxuICAgKi9cclxuICBwdWJsaWMgdmFsaWRhdGVTZWxmQm91bmRzKCk6IGJvb2xlYW4ge1xyXG4gICAgLy8gdmFsaWRhdGUgYm91bmRzIG9mIG91cnNlbGYgaWYgbmVjZXNzYXJ5XHJcbiAgICBpZiAoIHRoaXMuX3NlbGZCb3VuZHNEaXJ0eSApIHtcclxuICAgICAgY29uc3Qgb2xkU2VsZkJvdW5kcyA9IHNjcmF0Y2hCb3VuZHMyLnNldCggdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlICk7XHJcblxyXG4gICAgICAvLyBSZWx5IG9uIGFuIG92ZXJsb2FkYWJsZSBtZXRob2QgdG8gYWNjb21wbGlzaCBjb21wdXRpbmcgb3VyIHNlbGYgYm91bmRzLiBUaGlzIHNob3VsZCB1cGRhdGVcclxuICAgICAgLy8gdGhpcy5zZWxmQm91bmRzIGl0c2VsZiwgcmV0dXJuaW5nIHdoZXRoZXIgaXQgd2FzIGFjdHVhbGx5IGNoYW5nZWQuIElmIGl0IGRpZG4ndCBjaGFuZ2UsIHdlIGRvbid0IHdhbnQgdG9cclxuICAgICAgLy8gc2VuZCBhICdzZWxmQm91bmRzJyBldmVudC5cclxuICAgICAgY29uc3QgZGlkU2VsZkJvdW5kc0NoYW5nZSA9IHRoaXMudXBkYXRlU2VsZkJvdW5kcygpO1xyXG4gICAgICB0aGlzLl9zZWxmQm91bmRzRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIGlmICggZGlkU2VsZkJvdW5kc0NoYW5nZSApIHtcclxuICAgICAgICB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZFNlbGZCb3VuZHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW5zdXJlcyB0aGF0IGNhY2hlZCBib3VuZHMgc3RvcmVkIG9uIHRoaXMgTm9kZSAoYW5kIGFsbCBjaGlsZHJlbikgYXJlIGFjY3VyYXRlLiBSZXR1cm5zIHRydWUgaWYgYW55IHNvcnQgb2YgZGlydHlcclxuICAgKiBmbGFnIHdhcyBzZXQgYmVmb3JlIHRoaXMgd2FzIGNhbGxlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2FzIHNvbWV0aGluZyBwb3RlbnRpYWxseSB1cGRhdGVkP1xyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZUJvdW5kcygpOiBib29sZWFuIHtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCBgdmFsaWRhdGVCb3VuZHMgIyR7dGhpcy5faWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBsZXQgaTtcclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblRocmVzaG9sZCA9IDFlLTEzO1xyXG5cclxuICAgIGxldCB3YXNEaXJ0eUJlZm9yZSA9IHRoaXMudmFsaWRhdGVTZWxmQm91bmRzKCk7XHJcblxyXG4gICAgLy8gV2UncmUgZ29pbmcgdG8gZGlyZWN0bHkgbXV0YXRlIHRoZXNlIGluc3RhbmNlc1xyXG4gICAgY29uc3Qgb3VyQ2hpbGRCb3VuZHMgPSB0aGlzLmNoaWxkQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgY29uc3Qgb3VyTG9jYWxCb3VuZHMgPSB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgY29uc3Qgb3VyU2VsZkJvdW5kcyA9IHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZTtcclxuICAgIGNvbnN0IG91ckJvdW5kcyA9IHRoaXMuYm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG5cclxuICAgIC8vIHZhbGlkYXRlIGJvdW5kcyBvZiBjaGlsZHJlbiBpZiBuZWNlc3NhcnlcclxuICAgIGlmICggdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSApIHtcclxuICAgICAgd2FzRGlydHlCZWZvcmUgPSB0cnVlO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggJ2NoaWxkQm91bmRzIGRpcnR5JyApO1xyXG5cclxuICAgICAgLy8gaGF2ZSBlYWNoIGNoaWxkIHZhbGlkYXRlIHRoZWlyIG93biBib3VuZHNcclxuICAgICAgaSA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLl9jaGlsZHJlblsgaSBdO1xyXG5cclxuICAgICAgICAvLyBSZWVudHJhbmN5IG1pZ2h0IGNhdXNlIHRoZSBjaGlsZCB0byBiZSByZW1vdmVkXHJcbiAgICAgICAgaWYgKCBjaGlsZCApIHtcclxuICAgICAgICAgIGNoaWxkLnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhbmQgcmVjb21wdXRlIG91ciBjaGlsZEJvdW5kc1xyXG4gICAgICBjb25zdCBvbGRDaGlsZEJvdW5kcyA9IHNjcmF0Y2hCb3VuZHMyLnNldCggb3VyQ2hpbGRCb3VuZHMgKTsgLy8gc3RvcmUgb2xkIHZhbHVlIGluIGEgdGVtcG9yYXJ5IEJvdW5kczJcclxuICAgICAgb3VyQ2hpbGRCb3VuZHMuc2V0KCBCb3VuZHMyLk5PVEhJTkcgKTsgLy8gaW5pdGlhbGl6ZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVuaW9uZWQgd2l0aCBpbmNsdWRlQm91bmRzKClcclxuXHJcbiAgICAgIGkgPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgIHdoaWxlICggaS0tICkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgICAgLy8gUmVlbnRyYW5jeSBtaWdodCBjYXVzZSB0aGUgY2hpbGQgdG8gYmUgcmVtb3ZlZFxyXG4gICAgICAgIGlmICggY2hpbGQgJiYgIXRoaXMuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgfHwgY2hpbGQuaXNWaXNpYmxlKCkgKSB7XHJcbiAgICAgICAgICBvdXJDaGlsZEJvdW5kcy5pbmNsdWRlQm91bmRzKCBjaGlsZC5ib3VuZHMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJ1biB0aGlzIGJlZm9yZSBmaXJpbmcgdGhlIGV2ZW50XHJcbiAgICAgIHRoaXMuX2NoaWxkQm91bmRzRGlydHkgPSBmYWxzZTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggYGNoaWxkQm91bmRzOiAke291ckNoaWxkQm91bmRzfWAgKTtcclxuXHJcbiAgICAgIGlmICggIW91ckNoaWxkQm91bmRzLmVxdWFscyggb2xkQ2hpbGRCb3VuZHMgKSApIHtcclxuICAgICAgICAvLyBub3RpZmllcyBvbmx5IG9uIGFuIGFjdHVhbCBjaGFuZ2VcclxuICAgICAgICBpZiAoICFvdXJDaGlsZEJvdW5kcy5lcXVhbHNFcHNpbG9uKCBvbGRDaGlsZEJvdW5kcywgbm90aWZpY2F0aW9uVGhyZXNob2xkICkgKSB7XHJcbiAgICAgICAgICB0aGlzLmNoaWxkQm91bmRzUHJvcGVydHkubm90aWZ5TGlzdGVuZXJzKCBvbGRDaGlsZEJvdW5kcyApOyAvLyBSRS1FTlRSQU5UIENBTEwgSEVSRSwgaXQgd2lsbCB2YWxpZGF0ZUJvdW5kcygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXQVJOSU5HOiBUaGluayB0d2ljZSBiZWZvcmUgYWRkaW5nIGNvZGUgaGVyZSBiZWxvdyB0aGUgbGlzdGVuZXIgbm90aWZpY2F0aW9uLiBUaGUgbm90aWZ5TGlzdGVuZXJzKCkgY2FsbCBjYW5cclxuICAgICAgLy8gdHJpZ2dlciByZS1lbnRyYW5jeSwgc28gdGhpcyBmdW5jdGlvbiBuZWVkcyB0byB3b3JrIHdoZW4gdGhhdCBoYXBwZW5zLiBETyBOT1Qgc2V0IHRoaW5ncyBiYXNlZCBvbiBsb2NhbFxyXG4gICAgICAvLyB2YXJpYWJsZXMgaGVyZS5cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX2xvY2FsQm91bmRzRGlydHkgKSB7XHJcbiAgICAgIHdhc0RpcnR5QmVmb3JlID0gdHJ1ZTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5ib3VuZHMgJiYgc2NlbmVyeUxvZy5ib3VuZHMoICdsb2NhbEJvdW5kcyBkaXJ0eScgKTtcclxuXHJcbiAgICAgIHRoaXMuX2xvY2FsQm91bmRzRGlydHkgPSBmYWxzZTsgLy8gd2Ugb25seSBuZWVkIHRoaXMgdG8gc2V0IGxvY2FsIGJvdW5kcyBhcyBkaXJ0eVxyXG5cclxuICAgICAgY29uc3Qgb2xkTG9jYWxCb3VuZHMgPSBzY3JhdGNoQm91bmRzMi5zZXQoIG91ckxvY2FsQm91bmRzICk7IC8vIHN0b3JlIG9sZCB2YWx1ZSBpbiBhIHRlbXBvcmFyeSBCb3VuZHMyXHJcblxyXG4gICAgICAvLyBPbmx5IGFkanVzdCB0aGUgbG9jYWwgYm91bmRzIGlmIGl0IGlzIG5vdCBvdmVycmlkZGVuXHJcbiAgICAgIGlmICggIXRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiApIHtcclxuICAgICAgICAvLyBsb2NhbCBib3VuZHMgYXJlIGEgdW5pb24gYmV0d2VlbiBvdXIgc2VsZiBib3VuZHMgYW5kIGNoaWxkIGJvdW5kc1xyXG4gICAgICAgIG91ckxvY2FsQm91bmRzLnNldCggb3VyU2VsZkJvdW5kcyApLmluY2x1ZGVCb3VuZHMoIG91ckNoaWxkQm91bmRzICk7XHJcblxyXG4gICAgICAgIC8vIGFwcGx5IGNsaXBwaW5nIHRvIHRoZSBib3VuZHMgaWYgd2UgaGF2ZSBhIGNsaXAgYXJlYSAoYWxsIGRvbmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpXHJcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSB0aGlzLmNsaXBBcmVhO1xyXG4gICAgICAgIGlmICggY2xpcEFyZWEgKSB7XHJcbiAgICAgICAgICBvdXJMb2NhbEJvdW5kcy5jb25zdHJhaW5Cb3VuZHMoIGNsaXBBcmVhLmJvdW5kcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggYGxvY2FsQm91bmRzOiAke291ckxvY2FsQm91bmRzfWAgKTtcclxuXHJcbiAgICAgIC8vIE5PVEU6IHdlIG5lZWQgdG8gdXBkYXRlIG1heCBkaW1lbnNpb25zIHN0aWxsIGV2ZW4gaWYgd2UgYXJlIHNldHRpbmcgb3ZlcnJpZGRlbiBsb2NhbEJvdW5kc1xyXG4gICAgICAvLyBhZGp1c3Qgb3VyIHRyYW5zZm9ybSB0byBtYXRjaCBtYXhpbXVtIGJvdW5kcyBpZiBuZWNlc3Nhcnkgb24gYSBsb2NhbCBib3VuZHMgY2hhbmdlXHJcbiAgICAgIGlmICggdGhpcy5fbWF4V2lkdGggIT09IG51bGwgfHwgdGhpcy5fbWF4SGVpZ2h0ICE9PSBudWxsICkge1xyXG4gICAgICAgIC8vIG5lZWRzIHRvIHJ1biBiZWZvcmUgbm90aWZpY2F0aW9ucyBiZWxvdywgb3RoZXJ3aXNlIHJlZW50cmFuY3kgdGhhdCBoaXRzIHRoaXMgY29kZXBhdGggd2lsbCBoYXZlIGl0c1xyXG4gICAgICAgIC8vIHVwZGF0ZU1heERpbWVuc2lvbiBvdmVycmlkZGVuIGJ5IHRoZSBldmVudHVhbCBvcmlnaW5hbCBmdW5jdGlvbiBjYWxsLCB3aXRoIHRoZSBub3ctaW5jb3JyZWN0IGxvY2FsIGJvdW5kcy5cclxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy83MjVcclxuICAgICAgICB0aGlzLnVwZGF0ZU1heERpbWVuc2lvbiggb3VyTG9jYWxCb3VuZHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCAhb3VyTG9jYWxCb3VuZHMuZXF1YWxzKCBvbGRMb2NhbEJvdW5kcyApICkge1xyXG4gICAgICAgIC8vIHNhbml0eSBjaGVjaywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMDcxLCB3ZSdyZSBydW5uaW5nIHRoaXMgYmVmb3JlIHRoZSBsb2NhbEJvdW5kc1xyXG4gICAgICAgIC8vIGxpc3RlbmVycyBhcmUgbm90aWZpZWQsIHRvIHN1cHBvcnQgbGltaXRlZCByZS1lbnRyYW5jZS5cclxuICAgICAgICB0aGlzLl9ib3VuZHNEaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICggIW91ckxvY2FsQm91bmRzLmVxdWFsc0Vwc2lsb24oIG9sZExvY2FsQm91bmRzLCBub3RpZmljYXRpb25UaHJlc2hvbGQgKSApIHtcclxuICAgICAgICAgIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZExvY2FsQm91bmRzICk7IC8vIFJFLUVOVFJBTlQgQ0FMTCBIRVJFLCBpdCB3aWxsIHZhbGlkYXRlQm91bmRzKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdBUk5JTkc6IFRoaW5rIHR3aWNlIGJlZm9yZSBhZGRpbmcgY29kZSBoZXJlIGJlbG93IHRoZSBsaXN0ZW5lciBub3RpZmljYXRpb24uIFRoZSBub3RpZnlMaXN0ZW5lcnMoKSBjYWxsIGNhblxyXG4gICAgICAvLyB0cmlnZ2VyIHJlLWVudHJhbmN5LCBzbyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIHdvcmsgd2hlbiB0aGF0IGhhcHBlbnMuIERPIE5PVCBzZXQgdGhpbmdzIGJhc2VkIG9uIGxvY2FsXHJcbiAgICAgIC8vIHZhcmlhYmxlcyBoZXJlLlxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IGxheW91dCBoZXJlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIGlmICggdGhpcy5fYm91bmRzRGlydHkgKSB7XHJcbiAgICAgIHdhc0RpcnR5QmVmb3JlID0gdHJ1ZTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5ib3VuZHMgJiYgc2NlbmVyeUxvZy5ib3VuZHMoICdib3VuZHMgZGlydHknICk7XHJcblxyXG4gICAgICAvLyBydW4gdGhpcyBiZWZvcmUgZmlyaW5nIHRoZSBldmVudFxyXG4gICAgICB0aGlzLl9ib3VuZHNEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgY29uc3Qgb2xkQm91bmRzID0gc2NyYXRjaEJvdW5kczIuc2V0KCBvdXJCb3VuZHMgKTsgLy8gc3RvcmUgb2xkIHZhbHVlIGluIGEgdGVtcG9yYXJ5IEJvdW5kczJcclxuXHJcbiAgICAgIC8vIG5vIG5lZWQgdG8gZG8gdGhlIG1vcmUgZXhwZW5zaXZlIGJvdW5kcyB0cmFuc2Zvcm1hdGlvbiBpZiB3ZSBhcmUgc3RpbGwgYXhpcy1hbGlnbmVkXHJcbiAgICAgIGlmICggdGhpcy5fdHJhbnNmb3JtQm91bmRzICYmICF0aGlzLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkuaXNBeGlzQWxpZ25lZCgpICkge1xyXG4gICAgICAgIC8vIG11dGF0ZXMgdGhlIG1hdHJpeCBhbmQgYm91bmRzIGR1cmluZyByZWN1cnNpb25cclxuXHJcbiAgICAgICAgY29uc3QgbWF0cml4ID0gc2NyYXRjaE1hdHJpeDMuc2V0KCB0aGlzLmdldE1hdHJpeCgpICk7IC8vIGNhbGxzIGJlbG93IG11dGF0ZSB0aGlzIG1hdHJpeFxyXG4gICAgICAgIG91ckJvdW5kcy5zZXQoIEJvdW5kczIuTk9USElORyApO1xyXG4gICAgICAgIC8vIEluY2x1ZGUgZWFjaCBwYWludGVkIHNlbGYgaW5kaXZpZHVhbGx5LCB0cmFuc2Zvcm1lZCB3aXRoIHRoZSBleGFjdCB0cmFuc2Zvcm0gbWF0cml4LlxyXG4gICAgICAgIC8vIFRoaXMgaXMgZXhwZW5zaXZlLCBhcyB3ZSBoYXZlIHRvIGRvIDIgbWF0cml4IHRyYW5zZm9ybXMgZm9yIGV2ZXJ5IGRlc2NlbmRhbnQuXHJcbiAgICAgICAgdGhpcy5faW5jbHVkZVRyYW5zZm9ybWVkU3VidHJlZUJvdW5kcyggbWF0cml4LCBvdXJCb3VuZHMgKTsgLy8gc2VsZiBhbmQgY2hpbGRyZW5cclxuXHJcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSB0aGlzLmNsaXBBcmVhO1xyXG4gICAgICAgIGlmICggY2xpcEFyZWEgKSB7XHJcbiAgICAgICAgICBvdXJCb3VuZHMuY29uc3RyYWluQm91bmRzKCBjbGlwQXJlYS5nZXRCb3VuZHNXaXRoVHJhbnNmb3JtKCBtYXRyaXggKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBjb252ZXJ0cyBsb2NhbCB0byBwYXJlbnQgYm91bmRzLiBtdXRhYmxlIG1ldGhvZHMgdXNlZCB0byBtaW5pbWl6ZSBudW1iZXIgb2YgY3JlYXRlZCBib3VuZHMgaW5zdGFuY2VzXHJcbiAgICAgICAgLy8gKHdlIGNyZWF0ZSBvbmUgc28gd2UgZG9uJ3QgY2hhbmdlIHJlZmVyZW5jZXMgdG8gdGhlIG9sZCBvbmUpXHJcbiAgICAgICAgb3VyQm91bmRzLnNldCggb3VyTG9jYWxCb3VuZHMgKTtcclxuICAgICAgICB0aGlzLnRyYW5zZm9ybUJvdW5kc0Zyb21Mb2NhbFRvUGFyZW50KCBvdXJCb3VuZHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggYGJvdW5kczogJHtvdXJCb3VuZHN9YCApO1xyXG5cclxuICAgICAgaWYgKCAhb3VyQm91bmRzLmVxdWFscyggb2xkQm91bmRzICkgKSB7XHJcbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBhIGJvdW5kcyBjaGFuZ2UsIHdlIG5lZWQgdG8gaW52YWxpZGF0ZSBvdXIgcGFyZW50cyBzbyB0aGV5IGNhbiBiZSByZWNvbXB1dGVkXHJcbiAgICAgICAgaSA9IHRoaXMuX3BhcmVudHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlICggaS0tICkge1xyXG4gICAgICAgICAgdGhpcy5fcGFyZW50c1sgaSBdLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIGNoYW5naW5nIHRvIHBhcmFtZXRlciBvYmplY3QgKHRoYXQgbWF5IGJlIGEgcHJvYmxlbSBmb3IgdGhlIEdDIG92ZXJoZWFkKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIGlmICggIW91ckJvdW5kcy5lcXVhbHNFcHNpbG9uKCBvbGRCb3VuZHMsIG5vdGlmaWNhdGlvblRocmVzaG9sZCApICkge1xyXG4gICAgICAgICAgdGhpcy5ib3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZEJvdW5kcyApOyAvLyBSRS1FTlRSQU5UIENBTEwgSEVSRSwgaXQgd2lsbCB2YWxpZGF0ZUJvdW5kcygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXQVJOSU5HOiBUaGluayB0d2ljZSBiZWZvcmUgYWRkaW5nIGNvZGUgaGVyZSBiZWxvdyB0aGUgbGlzdGVuZXIgbm90aWZpY2F0aW9uLiBUaGUgbm90aWZ5TGlzdGVuZXJzKCkgY2FsbCBjYW5cclxuICAgICAgLy8gdHJpZ2dlciByZS1lbnRyYW5jeSwgc28gdGhpcyBmdW5jdGlvbiBuZWVkcyB0byB3b3JrIHdoZW4gdGhhdCBoYXBwZW5zLiBETyBOT1Qgc2V0IHRoaW5ncyBiYXNlZCBvbiBsb2NhbFxyXG4gICAgICAvLyB2YXJpYWJsZXMgaGVyZS5cclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSB3ZXJlIHNpZGUtZWZmZWN0cywgcnVuIHRoZSB2YWxpZGF0aW9uIGFnYWluIHVudGlsIHdlIGFyZSBjbGVhblxyXG4gICAgaWYgKCB0aGlzLl9jaGlsZEJvdW5kc0RpcnR5IHx8IHRoaXMuX2JvdW5kc0RpcnR5ICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCAncmV2YWxpZGF0aW9uJyApO1xyXG5cclxuICAgICAgLy8gVE9ETzogaWYgdGhlcmUgYXJlIHNpZGUtZWZmZWN0cyBpbiBsaXN0ZW5lcnMsIHRoaXMgY291bGQgb3ZlcmZsb3cgdGhlIHN0YWNrLiB3ZSBzaG91bGQgcmVwb3J0IGFuIGVycm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIC8vIGluc3RlYWQgb2YgbG9ja2luZyB1cFxyXG4gICAgICB0aGlzLnZhbGlkYXRlQm91bmRzKCk7IC8vIFJFLUVOVFJBTlQgQ0FMTCBIRVJFLCBpdCB3aWxsIHZhbGlkYXRlQm91bmRzKClcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgYXNzZXJ0KCB0aGlzLl9vcmlnaW5hbEJvdW5kcyA9PT0gdGhpcy5ib3VuZHNQcm9wZXJ0eS5fdmFsdWUsICdSZWZlcmVuY2UgZm9yIGJvdW5kcyBjaGFuZ2VkIScgKTtcclxuICAgICAgYXNzZXJ0KCB0aGlzLl9vcmlnaW5hbExvY2FsQm91bmRzID09PSB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkuX3ZhbHVlLCAnUmVmZXJlbmNlIGZvciBsb2NhbEJvdW5kcyBjaGFuZ2VkIScgKTtcclxuICAgICAgYXNzZXJ0KCB0aGlzLl9vcmlnaW5hbFNlbGZCb3VuZHMgPT09IHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZSwgJ1JlZmVyZW5jZSBmb3Igc2VsZkJvdW5kcyBjaGFuZ2VkIScgKTtcclxuICAgICAgYXNzZXJ0KCB0aGlzLl9vcmlnaW5hbENoaWxkQm91bmRzID09PSB0aGlzLmNoaWxkQm91bmRzUHJvcGVydHkuX3ZhbHVlLCAnUmVmZXJlbmNlIGZvciBjaGlsZEJvdW5kcyBjaGFuZ2VkIScgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb3VibGUtY2hlY2sgdGhhdCBhbGwgb2Ygb3VyIGJvdW5kcyBoYW5kbGluZyBoYXMgYmVlbiBhY2N1cmF0ZVxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICAvLyBuZXcgc2NvcGUgZm9yIHNhZmV0eVxyXG4gICAgICAoICgpID0+IHtcclxuICAgICAgICBjb25zdCBlcHNpbG9uID0gMC4wMDAwMDE7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoaWxkQm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuICAgICAgICBfLmVhY2goIHRoaXMuX2NoaWxkcmVuLCBjaGlsZCA9PiB7XHJcbiAgICAgICAgICBpZiAoICF0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIHx8IGNoaWxkLmlzVmlzaWJsZSgpICkge1xyXG4gICAgICAgICAgICBjaGlsZEJvdW5kcy5pbmNsdWRlQm91bmRzKCBjaGlsZC5ib3VuZHNQcm9wZXJ0eS5fdmFsdWUgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGxldCBsb2NhbEJvdW5kcyA9IHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZS51bmlvbiggY2hpbGRCb3VuZHMgKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2xpcEFyZWEgPSB0aGlzLmNsaXBBcmVhO1xyXG4gICAgICAgIGlmICggY2xpcEFyZWEgKSB7XHJcbiAgICAgICAgICBsb2NhbEJvdW5kcyA9IGxvY2FsQm91bmRzLmludGVyc2VjdGlvbiggY2xpcEFyZWEuYm91bmRzICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmdWxsQm91bmRzID0gdGhpcy5sb2NhbFRvUGFyZW50Qm91bmRzKCBsb2NhbEJvdW5kcyApO1xyXG5cclxuICAgICAgICBhc3NlcnRTbG93ICYmIGFzc2VydFNsb3coIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5fdmFsdWUuZXF1YWxzRXBzaWxvbiggY2hpbGRCb3VuZHMsIGVwc2lsb24gKSxcclxuICAgICAgICAgIGBDaGlsZCBib3VuZHMgbWlzbWF0Y2ggYWZ0ZXIgdmFsaWRhdGVCb3VuZHM6ICR7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5fdmFsdWUudG9TdHJpbmcoKX0sIGV4cGVjdGVkOiAke2NoaWxkQm91bmRzLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICAgIGFzc2VydFNsb3cgJiYgYXNzZXJ0U2xvdyggdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90cmFuc2Zvcm1Cb3VuZHMgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm91bmRzUHJvcGVydHkuX3ZhbHVlLmVxdWFsc0Vwc2lsb24oIGZ1bGxCb3VuZHMsIGVwc2lsb24gKSxcclxuICAgICAgICAgIGBCb3VuZHMgbWlzbWF0Y2ggYWZ0ZXIgdmFsaWRhdGVCb3VuZHM6ICR7dGhpcy5ib3VuZHNQcm9wZXJ0eS5fdmFsdWUudG9TdHJpbmcoKVxyXG4gICAgICAgICAgfSwgZXhwZWN0ZWQ6ICR7ZnVsbEJvdW5kcy50b1N0cmluZygpfS4gVGhpcyBjb3VsZCBoYXZlIGhhcHBlbmVkIGlmIGEgYm91bmRzIGluc3RhbmNlIG93bmVkIGJ5IGEgTm9kZWAgK1xyXG4gICAgICAgICAgJyB3YXMgZGlyZWN0bHkgbXV0YXRlZCAoZS5nLiBib3VuZHMuZXJvZGUoKSknICk7XHJcbiAgICAgIH0gKSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5ib3VuZHMgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICByZXR1cm4gd2FzRGlydHlCZWZvcmU7IC8vIHdoZXRoZXIgYW55IGRpcnR5IGZsYWdzIHdlcmUgc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWN1cnNpb24gZm9yIGFjY3VyYXRlIHRyYW5zZm9ybWVkIGJvdW5kcyBoYW5kbGluZy4gTXV0YXRlcyBib3VuZHMgd2l0aCB0aGUgYWRkZWQgYm91bmRzLlxyXG4gICAqIE11dGF0ZXMgdGhlIG1hdHJpeCAocGFyYW1ldGVyKSwgYnV0IG11dGF0ZXMgaXQgYmFjayB0byB0aGUgc3RhcnRpbmcgcG9pbnQgKHdpdGhpbiBmbG9hdGluZy1wb2ludCBlcnJvcikuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaW5jbHVkZVRyYW5zZm9ybWVkU3VidHJlZUJvdW5kcyggbWF0cml4OiBNYXRyaXgzLCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICBpZiAoICF0aGlzLnNlbGZCb3VuZHMuaXNFbXB0eSgpICkge1xyXG4gICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggdGhpcy5nZXRUcmFuc2Zvcm1lZFNlbGZCb3VuZHMoIG1hdHJpeCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbnVtQ2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1DaGlsZHJlbjsgaSsrICkge1xyXG4gICAgICBjb25zdCBjaGlsZCA9IHRoaXMuX2NoaWxkcmVuWyBpIF07XHJcblxyXG4gICAgICBtYXRyaXgubXVsdGlwbHlNYXRyaXgoIGNoaWxkLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkgKTtcclxuICAgICAgY2hpbGQuX2luY2x1ZGVUcmFuc2Zvcm1lZFN1YnRyZWVCb3VuZHMoIG1hdHJpeCwgYm91bmRzICk7XHJcbiAgICAgIG1hdHJpeC5tdWx0aXBseU1hdHJpeCggY2hpbGQuX3RyYW5zZm9ybS5nZXRJbnZlcnNlKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhdmVyc2VzIHRoaXMgc3VidHJlZSBhbmQgdmFsaWRhdGVzIGJvdW5kcyBvbmx5IGZvciBzdWJ0cmVlcyB0aGF0IGhhdmUgYm91bmRzIGxpc3RlbmVycyAodHJ5aW5nIHRvIGV4Y2x1ZGUgYXNcclxuICAgKiBtdWNoIGFzIHBvc3NpYmxlIGZvciBwZXJmb3JtYW5jZSkuIFRoaXMgaXMgZG9uZSBzbyB0aGF0IHdlIGNhbiBkbyB0aGUgbWluaW11bSBib3VuZHMgdmFsaWRhdGlvbiB0byBwcmV2ZW50IGFueVxyXG4gICAqIGJvdW5kcyBsaXN0ZW5lcnMgZnJvbSBiZWluZyB0cmlnZ2VyZWQgaW4gZnVydGhlciB2YWxpZGF0ZUJvdW5kcygpIGNhbGxzIHdpdGhvdXQgb3RoZXIgTm9kZSBjaGFuZ2VzIGJlaW5nIGRvbmUuXHJcbiAgICogVGhpcyBpcyByZXF1aXJlZCBmb3IgRGlzcGxheSdzIGF0b21pYyAobm9uLXJlZW50cmFudCkgdXBkYXRlRGlzcGxheSgpLCBzbyB0aGF0IHdlIGRvbid0IGFjY2lkZW50YWxseSB0cmlnZ2VyXHJcbiAgICogYm91bmRzIGxpc3RlbmVycyB3aGlsZSBjb21wdXRpbmcgYm91bmRzIGR1cmluZyB1cGRhdGVEaXNwbGF5KCkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogdGhpcyBzaG91bGQgcGFzcyBieSAoaWdub3JlKSBhbnkgb3ZlcnJpZGRlbiBsb2NhbEJvdW5kcywgdG8gdHJpZ2dlciBsaXN0ZW5lcnMgYmVsb3cuXHJcbiAgICovXHJcbiAgcHVibGljIHZhbGlkYXRlV2F0Y2hlZEJvdW5kcygpOiB2b2lkIHtcclxuICAgIC8vIFNpbmNlIGEgYm91bmRzIGxpc3RlbmVyIG9uIG9uZSBvZiB0aGUgcm9vdHMgY291bGQgaW52YWxpZGF0ZSBib3VuZHMgb24gdGhlIG90aGVyLCB3ZSBuZWVkIHRvIGtlZXAgcnVubmluZyB0aGlzXHJcbiAgICAvLyB1bnRpbCB0aGV5IGFyZSBhbGwgY2xlYW4uIE90aGVyd2lzZSwgc2lkZS1lZmZlY3RzIGNvdWxkIG9jY3VyIGZyb20gYm91bmRzIHZhbGlkYXRpb25zXHJcbiAgICAvLyBUT0RPOiBjb25zaWRlciBhIHdheSB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzIGhlcmUgdGhhdCBvY2N1ciBkdWUgdG8gYm91bmRzIGxpc3RlbmVycyB0cmlnZ2VyaW5nIGN5Y2xlcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgd2hpbGUgKCB0aGlzLndhdGNoZWRCb3VuZHNTY2FuKCkgKSB7XHJcbiAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY3Vyc2l2ZSBmdW5jdGlvbiBmb3IgdmFsaWRhdGVXYXRjaGVkQm91bmRzLiBSZXR1cm5lZCB3aGV0aGVyIGFueSB2YWxpZGF0ZUJvdW5kcygpIHJldHVybmVkIHRydWUgKG1lYW5zIHdlIGhhdmVcclxuICAgKiB0byB0cmF2ZXJzZSBhZ2FpbikgLSBzY2VuZXJ5LWludGVybmFsXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgdGhlcmUgY291bGQgaGF2ZSBiZWVuIGFueSBjaGFuZ2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3YXRjaGVkQm91bmRzU2NhbigpOiBib29sZWFuIHtcclxuICAgIGlmICggdGhpcy5fYm91bmRzRXZlbnRTZWxmQ291bnQgIT09IDAgKSB7XHJcbiAgICAgIC8vIHdlIGFyZSBhIHJvb3QgdGhhdCBzaG91bGQgYmUgdmFsaWRhdGVkLiByZXR1cm4gd2hldGhlciB3ZSB1cGRhdGVkIGFueXRoaW5nXHJcbiAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fYm91bmRzRXZlbnRDb3VudCA+IDAgJiYgdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSApIHtcclxuICAgICAgLy8gZGVzY2VuZGFudHMgaGF2ZSB3YXRjaGVkIGJvdW5kcywgdHJhdmVyc2UhXHJcbiAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgIGNvbnN0IG51bUNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1DaGlsZHJlbjsgaSsrICkge1xyXG4gICAgICAgIGNoYW5nZWQgPSB0aGlzLl9jaGlsZHJlblsgaSBdLndhdGNoZWRCb3VuZHNTY2FuKCkgfHwgY2hhbmdlZDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gY2hhbmdlZDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBpZiBfYm91bmRzRXZlbnRDb3VudCBpcyB6ZXJvLCBubyBib3VuZHMgYXJlIHdhdGNoZWQgYmVsb3cgdXMgKGRvbid0IHRyYXZlcnNlKSwgYW5kIGl0IHdhc24ndCBjaGFuZ2VkXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcmtzIHRoZSBib3VuZHMgb2YgdGhpcyBOb2RlIGFzIGludmFsaWQsIHNvIHRoZXkgYXJlIHJlY29tcHV0ZWQgYmVmb3JlIGJlaW5nIGFjY2Vzc2VkIGFnYWluLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlQm91bmRzKCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETzogc29tZXRpbWVzIHdlIHdvbid0IG5lZWQgdG8gaW52YWxpZGF0ZSBsb2NhbCBib3VuZHMhIGl0J3Mgbm90IHRvbyBtdWNoIG9mIGEgaGFzc2xlIHRob3VnaD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHRoaXMuX2JvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuICAgIHRoaXMuX2xvY2FsQm91bmRzRGlydHkgPSB0cnVlO1xyXG5cclxuICAgIC8vIGFuZCBzZXQgZmxhZ3MgZm9yIGFsbCBhbmNlc3RvcnNcclxuICAgIGxldCBpID0gdGhpcy5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoIGktLSApIHtcclxuICAgICAgdGhpcy5fcGFyZW50c1sgaSBdLmludmFsaWRhdGVDaGlsZEJvdW5kcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjdXJzaXZlbHkgdGFnIGFsbCBhbmNlc3RvcnMgd2l0aCBfY2hpbGRCb3VuZHNEaXJ0eSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgaW52YWxpZGF0ZUNoaWxkQm91bmRzKCk6IHZvaWQge1xyXG4gICAgLy8gZG9uJ3QgYm90aGVyIHVwZGF0aW5nIGlmIHdlJ3ZlIGFscmVhZHkgYmVlbiB0YWdnZWRcclxuICAgIGlmICggIXRoaXMuX2NoaWxkQm91bmRzRGlydHkgKSB7XHJcbiAgICAgIHRoaXMuX2NoaWxkQm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9sb2NhbEJvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuICAgICAgbGV0IGkgPSB0aGlzLl9wYXJlbnRzLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgICAgdGhpcy5fcGFyZW50c1sgaSBdLmludmFsaWRhdGVDaGlsZEJvdW5kcygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaG91bGQgYmUgY2FsbGVkIHRvIG5vdGlmeSB0aGF0IG91ciBzZWxmQm91bmRzIG5lZWRzIHRvIGNoYW5nZSB0byB0aGlzIG5ldyB2YWx1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgaW52YWxpZGF0ZVNlbGYoIG5ld1NlbGZCb3VuZHM/OiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbmV3U2VsZkJvdW5kcyA9PT0gdW5kZWZpbmVkIHx8IG5ld1NlbGZCb3VuZHMgaW5zdGFuY2VvZiBCb3VuZHMyLFxyXG4gICAgICAnaW52YWxpZGF0ZVNlbGZcXCdzIG5ld1NlbGZCb3VuZHMsIGlmIHByb3ZpZGVkLCBuZWVkcyB0byBiZSBCb3VuZHMyJyApO1xyXG5cclxuICAgIGNvbnN0IG91clNlbGZCb3VuZHMgPSB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcblxyXG4gICAgLy8gSWYgbm8gc2VsZiBib3VuZHMgYXJlIHByb3ZpZGVkLCByZWx5IG9uIHRoZSBib3VuZHMgdmFsaWRhdGlvbiB0byB0cmlnZ2VyIGNvbXB1dGF0aW9uICh1c2luZyB1cGRhdGVTZWxmQm91bmRzKCkpLlxyXG4gICAgaWYgKCAhbmV3U2VsZkJvdW5kcyApIHtcclxuICAgICAgdGhpcy5fc2VsZkJvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICAgIHRoaXMuX3BpY2tlci5vblNlbGZCb3VuZHNEaXJ0eSgpO1xyXG4gICAgfVxyXG4gICAgLy8gT3RoZXJ3aXNlLCBzZXQgdGhlIHNlbGYgYm91bmRzIGRpcmVjdGx5XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbmV3U2VsZkJvdW5kcy5pc0VtcHR5KCkgfHwgbmV3U2VsZkJvdW5kcy5pc0Zpbml0ZSgpLCAnQm91bmRzIG11c3QgYmUgZW1wdHkgb3IgZmluaXRlIGluIGludmFsaWRhdGVTZWxmJyApO1xyXG5cclxuICAgICAgLy8gRG9uJ3QgcmVjb21wdXRlIHRoZSBzZWxmIGJvdW5kc1xyXG4gICAgICB0aGlzLl9zZWxmQm91bmRzRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIC8vIGlmIHRoZXNlIGJvdW5kcyBhcmUgZGlmZmVyZW50IHRoYW4gY3VycmVudCBzZWxmIGJvdW5kc1xyXG4gICAgICBpZiAoICFvdXJTZWxmQm91bmRzLmVxdWFscyggbmV3U2VsZkJvdW5kcyApICkge1xyXG4gICAgICAgIGNvbnN0IG9sZFNlbGZCb3VuZHMgPSBzY3JhdGNoQm91bmRzMi5zZXQoIG91clNlbGZCb3VuZHMgKTtcclxuXHJcbiAgICAgICAgLy8gc2V0IHJlcGFpbnQgZmxhZ3NcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgICB0aGlzLl9waWNrZXIub25TZWxmQm91bmRzRGlydHkoKTtcclxuXHJcbiAgICAgICAgLy8gcmVjb3JkIHRoZSBuZXcgYm91bmRzXHJcbiAgICAgICAgb3VyU2VsZkJvdW5kcy5zZXQoIG5ld1NlbGZCb3VuZHMgKTtcclxuXHJcbiAgICAgICAgLy8gZmlyZSB0aGUgZXZlbnQgaW1tZWRpYXRlbHlcclxuICAgICAgICB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZFNlbGZCb3VuZHMgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gYnkgTm9kZSBzdWItdHlwZXMgdG8gY29tcHV0ZSBzZWxmIGJvdW5kcyAoaWYgaW52YWxpZGF0ZVNlbGYoKSB3aXRoIG5vIGFyZ3VtZW50cyB3YXMgY2FsbGVkKS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciB0aGUgc2VsZiBib3VuZHMgY2hhbmdlZC5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgdXBkYXRlU2VsZkJvdW5kcygpOiBib29sZWFuIHtcclxuICAgIC8vIFRoZSBOb2RlIGltcGxlbWVudGF0aW9uICh1bi1vdmVycmlkZGVuKSB3aWxsIG5ldmVyIGNoYW5nZSB0aGUgc2VsZiBib3VuZHMgKGFsd2F5cyBOT1RISU5HKS5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZS5lcXVhbHMoIEJvdW5kczIuTk9USElORyApICk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYSBOb2RlIGlzIGEgY2hpbGQgb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIHBvdGVudGlhbENoaWxkIGlzIGFjdHVhbGx5IG91ciBjaGlsZC5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzQ2hpbGQoIHBvdGVudGlhbENoaWxkOiBOb2RlICk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcG90ZW50aWFsQ2hpbGQgJiYgKCBwb3RlbnRpYWxDaGlsZCBpbnN0YW5jZW9mIE5vZGUgKSwgJ2hhc0NoaWxkIG5lZWRzIHRvIGJlIGNhbGxlZCB3aXRoIGEgTm9kZScgKTtcclxuICAgIGNvbnN0IGlzT3VyQ2hpbGQgPSBfLmluY2x1ZGVzKCB0aGlzLl9jaGlsZHJlbiwgcG90ZW50aWFsQ2hpbGQgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzT3VyQ2hpbGQgPT09IF8uaW5jbHVkZXMoIHBvdGVudGlhbENoaWxkLl9wYXJlbnRzLCB0aGlzICksICdjaGlsZC1wYXJlbnQgcmVmZXJlbmNlIHNob3VsZCBtYXRjaCBwYXJlbnQtY2hpbGQgcmVmZXJlbmNlJyApO1xyXG4gICAgcmV0dXJuIGlzT3VyQ2hpbGQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgU2hhcGUgdGhhdCByZXByZXNlbnRzIHRoZSBhcmVhIGNvdmVyZWQgYnkgY29udGFpbnNQb2ludFNlbGYuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNlbGZTaGFwZSgpOiBTaGFwZSB7XHJcbiAgICBjb25zdCBzZWxmQm91bmRzID0gdGhpcy5zZWxmQm91bmRzO1xyXG4gICAgaWYgKCBzZWxmQm91bmRzLmlzRW1wdHkoKSApIHtcclxuICAgICAgcmV0dXJuIG5ldyBTaGFwZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBTaGFwZS5ib3VuZHMoIHRoaXMuc2VsZkJvdW5kcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBvdXIgc2VsZkJvdW5kcyAodGhlIGJvdW5kcyBmb3IgdGhpcyBOb2RlJ3MgY29udGVudCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZXMsIGV4Y2x1ZGluZyBhbnl0aGluZyBmcm9tIG91clxyXG4gICAqIGNoaWxkcmVuIGFuZCBkZXNjZW5kYW50cykuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBOT1QgbXV0YXRlIHRoZSByZXR1cm5lZCB2YWx1ZSFcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2VsZkJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRTZWxmQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHNlbGZCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTZWxmQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYm91bmRpbmcgYm94IHRoYXQgc2hvdWxkIGNvbnRhaW4gYWxsIHNlbGYgY29udGVudCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSAob3VyIG5vcm1hbCBzZWxmIGJvdW5kc1xyXG4gICAqIGFyZW4ndCBndWFyYW50ZWVkIHRoaXMgZm9yIFRleHQsIGV0Yy4pXHJcbiAgICpcclxuICAgKiBPdmVycmlkZSB0aGlzIHRvIHByb3ZpZGUgZGlmZmVyZW50IGJlaGF2aW9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTYWZlU2VsZkJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRTYWZlU2VsZkJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBzYWZlU2VsZkJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFNhZmVTZWxmQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggdGhhdCBzaG91bGQgY29udGFpbiBhbGwgY29udGVudCBvZiBvdXIgY2hpbGRyZW4gaW4gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuIERvZXMgbm90XHJcbiAgICogaW5jbHVkZSBvdXIgXCJzZWxmXCIgYm91bmRzLlxyXG4gICAqXHJcbiAgICogTk9URTogRG8gTk9UIG11dGF0ZSB0aGUgcmV0dXJuZWQgdmFsdWUhXHJcbiAgICovXHJcbiAgcHVibGljIGdldENoaWxkQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDaGlsZEJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjaGlsZEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENoaWxkQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggdGhhdCBzaG91bGQgY29udGFpbiBhbGwgY29udGVudCBvZiBvdXIgY2hpbGRyZW4gQU5EIG91ciBzZWxmIGluIG91ciBsb2NhbCBjb29yZGluYXRlXHJcbiAgICogZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBOT1QgbXV0YXRlIHRoZSByZXR1cm5lZCB2YWx1ZSFcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRMb2NhbEJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBsb2NhbEJvdW5kcyggdmFsdWU6IEJvdW5kczIgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRMb2NhbEJvdW5kcyggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbG9jYWxCb3VuZHNPdmVycmlkZGVuKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIHRoZSB2YWx1ZSBvZiBsb2NhbEJvdW5kcyAoYW5kIHRodXMgY2hhbmdpbmcgdGhpbmdzIGxpa2UgJ2JvdW5kcycgdGhhdCBkZXBlbmQgb24gbG9jYWxCb3VuZHMpLlxyXG4gICAqIElmIGl0J3Mgc2V0IHRvIGEgbm9uLW51bGwgdmFsdWUsIHRoYXQgdmFsdWUgd2lsbCBhbHdheXMgYmUgdXNlZCBmb3IgbG9jYWxCb3VuZHMgdW50aWwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcclxuICAgKiBhZ2Fpbi4gVG8gcmV2ZXJ0IHRvIGhhdmluZyBTY2VuZXJ5IGNvbXB1dGUgdGhlIGxvY2FsQm91bmRzLCBzZXQgdGhpcyB0byBudWxsLiAgVGhlIGJvdW5kcyBzaG91bGQgbm90IGJlIHJlZHVjZWRcclxuICAgKiBzbWFsbGVyIHRoYW4gdGhlIHZpc2libGUgYm91bmRzIG9uIHRoZSBzY3JlZW4uXHJcbiAgICovXHJcbiAgcHVibGljIHNldExvY2FsQm91bmRzKCBsb2NhbEJvdW5kczogQm91bmRzMiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsb2NhbEJvdW5kcyA9PT0gbnVsbCB8fCBsb2NhbEJvdW5kcyBpbnN0YW5jZW9mIEJvdW5kczIsICdsb2NhbEJvdW5kcyBvdmVycmlkZSBzaG91bGQgYmUgc2V0IHRvIGVpdGhlciBudWxsIG9yIGEgQm91bmRzMicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsQm91bmRzID09PSBudWxsIHx8ICFpc05hTiggbG9jYWxCb3VuZHMubWluWCApLCAnbWluWCBmb3IgbG9jYWxCb3VuZHMgc2hvdWxkIG5vdCBiZSBOYU4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsb2NhbEJvdW5kcyA9PT0gbnVsbCB8fCAhaXNOYU4oIGxvY2FsQm91bmRzLm1pblkgKSwgJ21pblkgZm9yIGxvY2FsQm91bmRzIHNob3VsZCBub3QgYmUgTmFOJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbG9jYWxCb3VuZHMgPT09IG51bGwgfHwgIWlzTmFOKCBsb2NhbEJvdW5kcy5tYXhYICksICdtYXhYIGZvciBsb2NhbEJvdW5kcyBzaG91bGQgbm90IGJlIE5hTicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsQm91bmRzID09PSBudWxsIHx8ICFpc05hTiggbG9jYWxCb3VuZHMubWF4WSApLCAnbWF4WSBmb3IgbG9jYWxCb3VuZHMgc2hvdWxkIG5vdCBiZSBOYU4nICk7XHJcblxyXG4gICAgY29uc3Qgb3VyTG9jYWxCb3VuZHMgPSB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgY29uc3Qgb2xkTG9jYWxCb3VuZHMgPSBvdXJMb2NhbEJvdW5kcy5jb3B5KCk7XHJcblxyXG4gICAgaWYgKCBsb2NhbEJvdW5kcyA9PT0gbnVsbCApIHtcclxuICAgICAgLy8gd2UgY2FuIGp1c3QgaWdub3JlIHRoaXMgaWYgd2Ugd2VyZW4ndCBhY3R1YWxseSBvdmVycmlkaW5nIGxvY2FsIGJvdW5kcyBiZWZvcmVcclxuICAgICAgaWYgKCB0aGlzLl9sb2NhbEJvdW5kc092ZXJyaWRkZW4gKSB7XHJcblxyXG4gICAgICAgIHRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZExvY2FsQm91bmRzICk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBqdXN0IGFuIGluc3RhbmNlIGNoZWNrIGZvciBub3cuIGNvbnNpZGVyIGVxdWFscygpIGluIHRoZSBmdXR1cmUgZGVwZW5kaW5nIG9uIGNvc3RcclxuICAgICAgY29uc3QgY2hhbmdlZCA9ICFsb2NhbEJvdW5kcy5lcXVhbHMoIG91ckxvY2FsQm91bmRzICkgfHwgIXRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbjtcclxuXHJcbiAgICAgIGlmICggY2hhbmdlZCApIHtcclxuICAgICAgICBvdXJMb2NhbEJvdW5kcy5zZXQoIGxvY2FsQm91bmRzICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggIXRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiApIHtcclxuICAgICAgICB0aGlzLl9sb2NhbEJvdW5kc092ZXJyaWRkZW4gPSB0cnVlOyAvLyBOT1RFOiBoYXMgdG8gYmUgZG9uZSBiZWZvcmUgaW52YWxpZGF0aW5nIGJvdW5kcywgc2luY2UgdGhpcyBkaXNhYmxlcyBsb2NhbEJvdW5kcyBjb21wdXRhdGlvblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGNoYW5nZWQgKSB7XHJcbiAgICAgICAgdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkTG9jYWxCb3VuZHMgKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzdWItdHlwZXMgdGhhdCBoYXZlIG1vcmUgYWNjdXJhdGUgYm91bmRzIGRldGVybWluYXRpb24gZm9yIHdoZW4gd2UgYXJlIHRyYW5zZm9ybWVkLlxyXG4gICAqIFVzdWFsbHkgcm90YXRpb24gaXMgc2lnbmlmaWNhbnQgaGVyZSwgc28gdGhhdCB0cmFuc2Zvcm1lZCBib3VuZHMgZm9yIG5vbi1yZWN0YW5ndWxhciBzaGFwZXMgd2lsbCBiZSBkaWZmZXJlbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zZm9ybWVkU2VsZkJvdW5kcyggbWF0cml4OiBNYXRyaXgzICk6IEJvdW5kczIge1xyXG4gICAgLy8gYXNzdW1lIHRoYXQgd2UgdGFrZSB1cCB0aGUgZW50aXJlIHJlY3Rhbmd1bGFyIGJvdW5kcyBieSBkZWZhdWx0XHJcbiAgICByZXR1cm4gdGhpcy5zZWxmQm91bmRzLnRyYW5zZm9ybWVkKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gaW4gc3ViLXR5cGVzIHRoYXQgaGF2ZSBtb3JlIGFjY3VyYXRlIGJvdW5kcyBkZXRlcm1pbmF0aW9uIGZvciB3aGVuIHdlIGFyZSB0cmFuc2Zvcm1lZC5cclxuICAgKiBVc3VhbGx5IHJvdGF0aW9uIGlzIHNpZ25pZmljYW50IGhlcmUsIHNvIHRoYXQgdHJhbnNmb3JtZWQgYm91bmRzIGZvciBub24tcmVjdGFuZ3VsYXIgc2hhcGVzIHdpbGwgYmUgZGlmZmVyZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyBzaG91bGQgaW5jbHVkZSB0aGUgXCJmdWxsXCIgYm91bmRzIHRoYXQgZ3VhcmFudGVlIGV2ZXJ5dGhpbmcgcmVuZGVyZWQgc2hvdWxkIGJlIGluc2lkZSAoZS5nLiBUZXh0LCB3aGVyZSB0aGVcclxuICAgKiBub3JtYWwgYm91bmRzIG1heSBub3QgYmUgc3VmZmljaWVudCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zZm9ybWVkU2FmZVNlbGZCb3VuZHMoIG1hdHJpeDogTWF0cml4MyApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnNhZmVTZWxmQm91bmRzLnRyYW5zZm9ybWVkKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHZpc3VhbCBcInNhZmVcIiBib3VuZHMgdGhhdCBhcmUgdGFrZW4gdXAgYnkgdGhpcyBOb2RlIGFuZCBpdHMgc3VidHJlZS4gTm90YWJseSwgdGhpcyBpcyBlc3NlbnRpYWxseSB0aGVcclxuICAgKiBjb21iaW5lZCBlZmZlY3RzIG9mIHRoZSBcInZpc2libGVcIiBib3VuZHMgKGkuZS4gaW52aXNpYmxlIG5vZGVzIGRvIG5vdCBjb250cmlidXRlIHRvIGJvdW5kcyksIGFuZCBcInNhZmVcIiBib3VuZHNcclxuICAgKiAoZS5nLiBUZXh0LCB3aGVyZSB3ZSBuZWVkIGEgbGFyZ2VyIGJvdW5kcyBhcmVhIHRvIGd1YXJhbnRlZSB0aGVyZSBpcyBub3RoaW5nIG91dHNpZGUpLiBJdCBhbHNvIHRyaWVzIHRvIFwiZml0XCJcclxuICAgKiB0cmFuc2Zvcm1lZCBib3VuZHMgbW9yZSB0aWdodGx5LCB3aGVyZSBpdCB3aWxsIGhhbmRsZSByb3RhdGVkIFBhdGggYm91bmRzIGluIGFuIGltcHJvdmVkIHdheS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWV0aG9kIGlzIG5vdCBvcHRpbWl6ZWQsIGFuZCBtYXkgY3JlYXRlIGdhcmJhZ2UgYW5kIG5vdCBiZSB0aGUgZmFzdGVzdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbbWF0cml4XSAtIElmIHByb3ZpZGVkLCB3aWxsIHJldHVybiB0aGUgYm91bmRzIGFzc3VtaW5nIHRoZSBjb250ZW50IGlzIHRyYW5zZm9ybWVkIHdpdGggdGhlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdpdmVuIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcyggbWF0cml4PzogTWF0cml4MyApOiBCb3VuZHMyIHtcclxuICAgIGNvbnN0IGxvY2FsTWF0cml4ID0gKCBtYXRyaXggfHwgTWF0cml4My5JREVOVElUWSApLnRpbWVzTWF0cml4KCB0aGlzLm1hdHJpeCApO1xyXG5cclxuICAgIGNvbnN0IGJvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLnZpc2libGVQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgaWYgKCAhdGhpcy5zZWxmQm91bmRzLmlzRW1wdHkoKSApIHtcclxuICAgICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggdGhpcy5nZXRUcmFuc2Zvcm1lZFNhZmVTZWxmQm91bmRzKCBsb2NhbE1hdHJpeCApICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggdGhpcy5fY2hpbGRyZW4ubGVuZ3RoICkge1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgYm91bmRzLmluY2x1ZGVCb3VuZHMoIHRoaXMuX2NoaWxkcmVuWyBpIF0uZ2V0U2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcyggbG9jYWxNYXRyaXggKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0U2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uIC0tIFRoaXMgaXMgY2FsbGVkIHdpdGhvdXQgYW55IGluaXRpYWwgcGFyYW1ldGVyXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBzYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0U2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZmxhZyB0aGF0IGRldGVybWluZXMgd2hldGhlciB3ZSB3aWxsIHJlcXVpcmUgbW9yZSBhY2N1cmF0ZSAoYW5kIGV4cGVuc2l2ZSkgYm91bmRzIGNvbXB1dGF0aW9uIGZvciB0aGlzXHJcbiAgICogbm9kZSdzIHRyYW5zZm9ybS5cclxuICAgKlxyXG4gICAqIElmIHNldCB0byBmYWxzZSAoZGVmYXVsdCksIFNjZW5lcnkgd2lsbCBnZXQgdGhlIGJvdW5kcyBvZiBjb250ZW50LCBhbmQgdGhlbiBpZiByb3RhdGVkIHdpbGwgZGV0ZXJtaW5lIHRoZSBvbi1heGlzXHJcbiAgICogYm91bmRzIHRoYXQgY29tcGxldGVseSBjb3ZlciB0aGUgcm90YXRlZCBib3VuZHMgKHBvdGVudGlhbGx5IGxhcmdlciB0aGFuIGFjdHVhbCBjb250ZW50KS5cclxuICAgKiBJZiBzZXQgdG8gdHJ1ZSwgU2NlbmVyeSB3aWxsIHRyeSB0byBnZXQgdGhlIGJvdW5kcyBvZiB0aGUgYWN0dWFsIHJvdGF0ZWQvdHJhbnNmb3JtZWQgY29udGVudC5cclxuICAgKlxyXG4gICAqIEEgZ29vZCBleGFtcGxlIG9mIHdoZW4gdGhpcyBpcyBuZWNlc3NhcnkgaXMgaWYgdGhlcmUgYXJlIGEgYnVuY2ggb2YgbmVzdGVkIGNoaWxkcmVuIHRoYXQgZWFjaCBoYXZlIHBpLzQgcm90YXRpb25zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYW5zZm9ybUJvdW5kcyAtIFdoZXRoZXIgYWNjdXJhdGUgdHJhbnNmb3JtIGJvdW5kcyBzaG91bGQgYmUgdXNlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VHJhbnNmb3JtQm91bmRzKCB0cmFuc2Zvcm1Cb3VuZHM6IGJvb2xlYW4gKTogdGhpcyB7XHJcblxyXG4gICAgaWYgKCB0aGlzLl90cmFuc2Zvcm1Cb3VuZHMgIT09IHRyYW5zZm9ybUJvdW5kcyApIHtcclxuICAgICAgdGhpcy5fdHJhbnNmb3JtQm91bmRzID0gdHJhbnNmb3JtQm91bmRzO1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VHJhbnNmb3JtQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHRyYW5zZm9ybUJvdW5kcyggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFRyYW5zZm9ybUJvdW5kcyggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRUcmFuc2Zvcm1Cb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdHJhbnNmb3JtQm91bmRzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmb3JtQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYWNjdXJhdGUgdHJhbnNmb3JtYXRpb24gYm91bmRzIGFyZSB1c2VkIGluIGJvdW5kcyBjb21wdXRhdGlvbiAoc2VlIHNldFRyYW5zZm9ybUJvdW5kcykuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zZm9ybUJvdW5kcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1Cb3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBOb2RlIGFuZCBhbGwgb2YgaXRzIHN1Yi10cmVlcyAoaW4gdGhlIFwicGFyZW50XCIgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBOT1QgbXV0YXRlIHRoZSByZXR1cm5lZCB2YWx1ZSFcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5ib3VuZHNQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRCb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgYm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaWtlIGdldExvY2FsQm91bmRzKCkgaW4gdGhlIFwibG9jYWxcIiBjb29yZGluYXRlIGZyYW1lLCBidXQgaW5jbHVkZXMgb25seSB2aXNpYmxlIG5vZGVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRWaXNpYmxlTG9jYWxCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICAvLyBkZWZlbnNpdmUgY29weSwgc2luY2Ugd2UgdXNlIG11dGFibGUgbW9kaWZpY2F0aW9ucyBiZWxvd1xyXG4gICAgY29uc3QgYm91bmRzID0gdGhpcy5zZWxmQm91bmRzLmNvcHkoKTtcclxuXHJcbiAgICBsZXQgaSA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgIHdoaWxlICggaS0tICkge1xyXG4gICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggdGhpcy5fY2hpbGRyZW5bIGkgXS5nZXRWaXNpYmxlQm91bmRzKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhcHBseSBjbGlwcGluZyB0byB0aGUgYm91bmRzIGlmIHdlIGhhdmUgYSBjbGlwIGFyZWEgKGFsbCBkb25lIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKVxyXG4gICAgY29uc3QgY2xpcEFyZWEgPSB0aGlzLmNsaXBBcmVhO1xyXG4gICAgaWYgKCBjbGlwQXJlYSApIHtcclxuICAgICAgYm91bmRzLmNvbnN0cmFpbkJvdW5kcyggY2xpcEFyZWEuYm91bmRzICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYm91bmRzLmlzRmluaXRlKCkgfHwgYm91bmRzLmlzRW1wdHkoKSwgJ1Zpc2libGUgYm91bmRzIHNob3VsZCBub3QgYmUgaW5maW5pdGUnICk7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFZpc2libGVMb2NhbEJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB2aXNpYmxlTG9jYWxCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRWaXNpYmxlTG9jYWxCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpa2UgZ2V0Qm91bmRzKCkgaW4gdGhlIFwicGFyZW50XCIgY29vcmRpbmF0ZSBmcmFtZSwgYnV0IGluY2x1ZGVzIG9ubHkgdmlzaWJsZSBub2Rlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRWaXNpYmxlQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgaWYgKCB0aGlzLmlzVmlzaWJsZSgpICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXRWaXNpYmxlTG9jYWxCb3VuZHMoKS50cmFuc2Zvcm0oIHRoaXMuZ2V0TWF0cml4KCkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gQm91bmRzMi5OT1RISU5HO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFZpc2libGVCb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdmlzaWJsZUJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFZpc2libGVCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRlc3RzIHdoZXRoZXIgdGhlIGdpdmVuIHBvaW50IGlzIFwiY29udGFpbmVkXCIgaW4gdGhpcyBub2RlJ3Mgc3VidHJlZSAob3B0aW9uYWxseSB1c2luZyBtb3VzZS90b3VjaCBhcmVhcyksIGFuZCBpZlxyXG4gICAqIHNvIHJldHVybnMgdGhlIFRyYWlsIChyb290ZWQgYXQgdGhpcyBub2RlKSB0byB0aGUgdG9wLW1vc3QgKGluIHN0YWNraW5nIG9yZGVyKSBOb2RlIHRoYXQgY29udGFpbnMgdGhlIGdpdmVuXHJcbiAgICogcG9pbnQuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGlzIG9wdGltaXplZCBmb3IgdGhlIGN1cnJlbnQgaW5wdXQgc3lzdGVtIChyYXRoZXIgdGhhbiB3aGF0IGdldHMgdmlzdWFsbHkgZGlzcGxheWVkIG9uIHRoZSBzY3JlZW4pLCBzb1xyXG4gICAqIHBpY2thYmlsaXR5IChOb2RlJ3MgcGlja2FibGUgcHJvcGVydHksIHZpc2liaWxpdHksIGFuZCB0aGUgcHJlc2VuY2Ugb2YgaW5wdXQgbGlzdGVuZXJzKSBhbGwgbWF5IGFmZmVjdCB0aGVcclxuICAgKiByZXR1cm5lZCB2YWx1ZS5cclxuICAgKlxyXG4gICAqIEZvciBleGFtcGxlLCBoaXQtdGVzdGluZyBhIHNpbXBsZSBzaGFwZSAod2l0aCBubyBwaWNrYWJpbGl0eSkgd2lsbCByZXR1cm4gbnVsbDpcclxuICAgKiA+IG5ldyBwaGV0LnNjZW5lcnkuQ2lyY2xlKCAyMCApLmhpdFRlc3QoIHBoZXQuZG90LnYyKCAwLCAwICkgKTsgLy8gbnVsbFxyXG4gICAqXHJcbiAgICogSWYgdGhlIHNhbWUgc2hhcGUgaXMgbWFkZSB0byBiZSBwaWNrYWJsZSwgaXQgd2lsbCByZXR1cm4gYSB0cmFpbDpcclxuICAgKiA+IG5ldyBwaGV0LnNjZW5lcnkuQ2lyY2xlKCAyMCwgeyBwaWNrYWJsZTogdHJ1ZSB9ICkuaGl0VGVzdCggcGhldC5kb3QudjIoIDAsIDAgKSApO1xyXG4gICAqID4gLy8gcmV0dXJucyBhIFRyYWlsIHdpdGggdGhlIGNpcmNsZSBhcyB0aGUgb25seSBub2RlLlxyXG4gICAqXHJcbiAgICogSXQgd2lsbCByZXR1cm4gdGhlIHJlc3VsdCB0aGF0IGlzIHZpc3VhbGx5IHN0YWNrZWQgb24gdG9wLCBzbyBlLmcuOlxyXG4gICAqID4gbmV3IHBoZXQuc2NlbmVyeS5Ob2RlKCB7XHJcbiAgICogPiAgIHBpY2thYmxlOiB0cnVlLFxyXG4gICAqID4gICBjaGlsZHJlbjogW1xyXG4gICAqID4gICAgIG5ldyBwaGV0LnNjZW5lcnkuQ2lyY2xlKCAyMCApLFxyXG4gICAqID4gICAgIG5ldyBwaGV0LnNjZW5lcnkuQ2lyY2xlKCAxNSApXHJcbiAgICogPiAgIF1cclxuICAgKiA+IH0gKS5oaXRUZXN0KCBwaGV0LmRvdC52MiggMCwgMCApICk7IC8vIHJldHVybnMgdGhlIFwidG9wLW1vc3RcIiBjaXJjbGUgKHRoZSBvbmUgd2l0aCByYWRpdXM6MTUpLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB1c2VkIGJ5IFNjZW5lcnkncyBpbnRlcm5hbCBpbnB1dCBzeXN0ZW0gYnkgY2FsbGluZyBoaXRUZXN0IG9uIGEgRGlzcGxheSdzIHJvb3ROb2RlIHdpdGggdGhlXHJcbiAgICogZ2xvYmFsLWNvb3JkaW5hdGUgcG9pbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBUaGUgcG9pbnQgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgdG8gY2hlY2sgYWdhaW5zdCB0aGlzIG5vZGUncyBzdWJ0cmVlLlxyXG4gICAqIEBwYXJhbSBbaXNNb3VzZV0gLSBXaGV0aGVyIG1vdXNlQXJlYXMgc2hvdWxkIGJlIHVzZWQuXHJcbiAgICogQHBhcmFtIFtpc1RvdWNoXSAtIFdoZXRoZXIgdG91Y2hBcmVhcyBzaG91bGQgYmUgdXNlZC5cclxuICAgKiBAcmV0dXJucyAtIFJldHVybnMgbnVsbCBpZiB0aGUgcG9pbnQgaXMgbm90IGNvbnRhaW5lZCBpbiB0aGUgc3VidHJlZS5cclxuICAgKi9cclxuICBwdWJsaWMgaGl0VGVzdCggcG9pbnQ6IFZlY3RvcjIsIGlzTW91c2U/OiBib29sZWFuLCBpc1RvdWNoPzogYm9vbGVhbiApOiBUcmFpbCB8IG51bGwge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcG9pbnQuaXNGaW5pdGUoKSwgJ1RoZSBwb2ludCBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzTW91c2UgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaXNNb3VzZSA9PT0gJ2Jvb2xlYW4nLFxyXG4gICAgICAnSWYgaXNNb3VzZSBpcyBwcm92aWRlZCwgaXQgc2hvdWxkIGJlIGEgYm9vbGVhbicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzVG91Y2ggPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaXNUb3VjaCA9PT0gJ2Jvb2xlYW4nLFxyXG4gICAgICAnSWYgaXNUb3VjaCBpcyBwcm92aWRlZCwgaXQgc2hvdWxkIGJlIGEgYm9vbGVhbicgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fcGlja2VyLmhpdFRlc3QoIHBvaW50LCAhIWlzTW91c2UsICEhaXNUb3VjaCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGl0LXRlc3RzIHdoYXQgaXMgdW5kZXIgdGhlIHBvaW50ZXIsIGFuZCByZXR1cm5zIGEge1RyYWlsfSB0byB0aGF0IE5vZGUgKG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gbWF0Y2hpbmcgbm9kZSkuXHJcbiAgICpcclxuICAgKiBTZWUgaGl0VGVzdCgpIGZvciBtb3JlIGRldGFpbHMgYWJvdXQgd2hhdCB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFpbFVuZGVyUG9pbnRlciggcG9pbnRlcjogUG9pbnRlciApOiBUcmFpbCB8IG51bGwge1xyXG4gICAgcmV0dXJuIHBvaW50ZXIucG9pbnQgPT09IG51bGwgPyBudWxsIDogdGhpcy5oaXRUZXN0KCBwb2ludGVyLnBvaW50LCBwb2ludGVyIGluc3RhbmNlb2YgTW91c2UsIHBvaW50ZXIuaXNUb3VjaExpa2UoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGEgcG9pbnQgKGluIHBhcmVudCBjb29yZGluYXRlcykgaXMgY29udGFpbmVkIGluIHRoaXMgbm9kZSdzIHN1Yi10cmVlLlxyXG4gICAqXHJcbiAgICogU2VlIGhpdFRlc3QoKSBmb3IgbW9yZSBkZXRhaWxzIGFib3V0IHdoYXQgd2lsbCBiZSByZXR1cm5lZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciB0aGUgcG9pbnQgaXMgY29udGFpbmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc1BvaW50KCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmhpdFRlc3QoIHBvaW50ICkgIT09IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPdmVycmlkZSB0aGlzIGZvciBjb21wdXRhdGlvbiBvZiB3aGV0aGVyIGEgcG9pbnQgaXMgaW5zaWRlIG91ciBzZWxmIGNvbnRlbnQgKGRlZmF1bHRzIHRvIHNlbGZCb3VuZHMgY2hlY2spLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50IC0gQ29uc2lkZXJlZCB0byBiZSBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc1BvaW50U2VsZiggcG9pbnQ6IFZlY3RvcjIgKTogYm9vbGVhbiB7XHJcbiAgICAvLyBpZiBzZWxmIGJvdW5kcyBhcmUgbm90IG51bGwgZGVmYXVsdCB0byBjaGVja2luZyBzZWxmIGJvdW5kc1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZkJvdW5kcy5jb250YWluc1BvaW50KCBwb2ludCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgbm9kZSdzIHNlbGZCb3VuZHMgaXMgaW50ZXJzZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm91bmRzIC0gQm91bmRzIHRvIHRlc3QsIGFzc3VtZWQgdG8gYmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGludGVyc2VjdHNCb3VuZHNTZWxmKCBib3VuZHM6IEJvdW5kczIgKTogYm9vbGVhbiB7XHJcbiAgICAvLyBpZiBzZWxmIGJvdW5kcyBhcmUgbm90IG51bGwsIGNoaWxkIHNob3VsZCBvdmVycmlkZSB0aGlzXHJcbiAgICByZXR1cm4gdGhpcy5zZWxmQm91bmRzLmludGVyc2VjdHNCb3VuZHMoIGJvdW5kcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBOb2RlIGlzIGEgY2FuZGlkYXRlIGZvciBwaGV0LWlvIGF1dG9zZWxlY3QuXHJcbiAgICogMS4gSW52aXNpYmxlIHRoaW5ncyBjYW5ub3QgYmUgYXV0b3NlbGVjdGVkXHJcbiAgICogMi4gVHJhbnNmb3JtIHRoZSBwb2ludCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSwgc28gd2UgY2FuIHRlc3QgaXQgd2l0aCB0aGUgY2xpcEFyZWEvY2hpbGRyZW5cclxuICAgKiAzLiBJZiBvdXIgcG9pbnQgaXMgb3V0c2lkZSB0aGUgbG9jYWwtY29vcmRpbmF0ZSBjbGlwcGluZyBhcmVhLCB0aGVyZSBzaG91bGQgYmUgbm8gaGl0LlxyXG4gICAqIDQuIE5vdGUgdGhhdCBub24tcGlja2FibGUgbm9kZXMgY2FuIHN0aWxsIGJlIGF1dG9zZWxlY3RlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1BoZXRpb01vdXNlSGl0dGFibGUoIHBvaW50OiBWZWN0b3IyICk6IGJvb2xlYW4ge1xyXG5cclxuICAgIC8vIHVucGlja2FibGUgdGhpbmdzIGNhbm5vdCBiZSBhdXRvc2VsZWN0ZWQgdW5sZXNzIHRoZXJlIGFyZSBkZXNjZW5kYW50cyB0aGF0IGNvdWxkIGJlIHBvdGVudGlhbCBtb3VzZSBoaXRzLlxyXG4gICAgLy8gSXQgaXMgaW1wb3J0YW50IHRvIG9wdCBvdXQgb2YgdGhlc2Ugc3VidHJlZXMgdG8gbWFrZSBzdXJlIHRoYXQgdGhleSBkb24ndCBmYWxzZWx5IFwic3VjayB1cFwiIGEgbW91c2UgaGl0IHRoYXRcclxuICAgIC8vIHdvdWxkIG90aGVyd2lzZSBnbyB0byBhIHRhcmdldCBiZWhpbmQgdGhlIHVucGlja2FibGUgTm9kZS5cclxuICAgIGlmICggdGhpcy5waWNrYWJsZSA9PT0gZmFsc2UgJiYgIXRoaXMuaXNBbnlEZXNjZW5kYW50QVBoZXRpb01vdXNlSGl0VGFyZ2V0KCkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy52aXNpYmxlICYmXHJcbiAgICAgICAgICAgKCB0aGlzLmNsaXBBcmVhID09PSBudWxsIHx8IHRoaXMuY2xpcEFyZWEuY29udGFpbnNQb2ludCggdGhpcy5fdHJhbnNmb3JtLmdldEludmVyc2UoKS50aW1lc1ZlY3RvcjIoIHBvaW50ICkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgeW91IG5lZWQgdG8ga25vdyBpZiBhbnkgTm9kZSBpbiBhIHN1YnRyZWUgY291bGQgcG9zc2libHkgYmUgYSBwaGV0aW8gbW91c2UgaGl0IHRhcmdldC5cclxuICAgKiBTUiBhbmQgTUsgcmFuIHBlcmZvcm1hbmNlIG9uIHRoaXMgZnVuY3Rpb24gaW4gQ0NLOkRDIGFuZCBDQVYgaW4gNi8yMDIzIGFuZCB0aGVyZSB3YXMgbm8gbm90aWNlYWJsZSBwcm9ibGVtLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0FueURlc2NlbmRhbnRBUGhldGlvTW91c2VIaXRUYXJnZXQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpICE9PSAncGhldGlvTm90U2VsZWN0YWJsZScgfHxcclxuICAgICAgICAgICBfLnNvbWUoIHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLmlzQW55RGVzY2VuZGFudEFQaGV0aW9Nb3VzZUhpdFRhcmdldCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIGluIFN0dWRpbyBBdXRvc2VsZWN0LiAgUmV0dXJucyBhIFBoRVQtaU8gRWxlbWVudCAoYSBQaGV0aW9PYmplY3QpIGlmIHBvc3NpYmxlLCBvciBudWxsIGlmIG5vIGhpdC5cclxuICAgKiBcInBoZXRpb05vdFNlbGVjdGFibGVcIiBpcyBhbiBpbnRlcm1lZGlhdGUgc3RhdGUgdXNlZCB0byBub3RlIHdoZW4gYSBcImhpdFwiIGhhcyBvY2N1cnJlZCwgYnV0IHRoZSBoaXQgd2FzIG9uIGEgTm9kZVxyXG4gICAqIHRoYXQgZGlkbid0IGhhdmUgYSBmaXQgdGFyZ2V0IChzZWUgUGhldGlvT2JqZWN0LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCkpXHJcbiAgICogQSBmZXcgbm90ZXMgb24gdGhlIGltcGxlbWVudGF0aW9uOlxyXG4gICAqIDEuIFByZWZlciB0aGUgbGVhZiBtb3N0IE5vZGUgdGhhdCBpcyBhdCB0aGUgaGlnaGVzdCB6LWluZGV4IGluIHJlbmRlcmluZyBvcmRlclxyXG4gICAqIDIuIFBpY2thYmxlOmZhbHNlIE5vZGVzIGRvbid0IHBydW5lIG91dCBzdWJ0cmVlcyBpZiBkZXNjZW5kZW50cyBjb3VsZCBzdGlsbCBiZSBtb3VzZSBoaXQgdGFyZ2V0c1xyXG4gICAqICAgIChzZWUgUGhldGlvT2JqZWN0LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCkpLlxyXG4gICAqIDMuIEZpcnN0IHRoZSBhbGdvcml0aG0gZmluZHMgYSBOb2RlIHRoYXQgaXMgYSBcImhpdFwiLCBhbmQgdGhlbiBpdCB0cmllcyB0byBmaW5kIHRoZSBtb3N0IGZpdCBcInRhcmdldFwiIGZvciB0aGF0IGhpdC5cclxuICAgKiAgICBhLiBJdHNlbGYsIHNlZSAgUGhldGlvT2JqZWN0LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KClcclxuICAgKiAgICBiLiBBIGNsYXNzIGRlZmluZWQgc3Vic3RpdHV0ZSwgVGV4dC5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpXHJcbiAgICogICAgYy4gQSBzaWJsaW5nIHRoYXQgaXMgcmVuZGVyZWQgYmVoaW5kIHRoZSBoaXRcclxuICAgKiAgICBkLiBUaGUgbW9zdCByZWNlbnQgZGVzY2VuZGFudCB0aGF0IGlzIGEgdXNhYmxlIHRhcmdldC5cclxuICAgKlxyXG4gICAqIEFkYXB0ZWQgb3JpZ2luYWxseSBmcm9tIFBpY2tlci5yZWN1cnNpdmVIaXRUZXN0LCB3aXRoIHNwZWNpZmljIHR3ZWFrcyBuZWVkZWQgZm9yIFBoRVQtaU8gaW5zdHJ1bWVudGF0aW9uLCBkaXNwbGF5XHJcbiAgICogYW5kIGZpbHRlcmluZy5cclxuICAgKiBAcmV0dXJucyAtIG51bGwgaWYgbm8gaGl0IG9jY3VycmVkXHJcbiAgICogICAgICAgICAgLSBBIFBoZXRpb09iamVjdCBpZiBhIGhpdCBvY2N1cnJlZCBvbiBhIE5vZGUgd2l0aCBhIHNlbGVjdGFibGUgdGFyZ2V0XHJcbiAgICogICAgICAgICAgLSAncGhldGlvTm90U2VsZWN0YWJsZScgaWYgYSBoaXQgb2NjdXJyZWQsIGJ1dCBubyBzdWl0YWJsZSB0YXJnZXQgd2FzIGZvdW5kIGZyb20gdGhhdCBoaXQgKHNlZVxyXG4gICAqICAgICAgICAgICAgIFBoZXRpb09iamVjdC5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQaGV0aW9Nb3VzZUhpdCggcG9pbnQ6IFZlY3RvcjIgKTogUGhldGlvT2JqZWN0IHwgbnVsbCB8ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5pc1BoZXRpb01vdXNlSGl0dGFibGUoIHBvaW50ICkgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRyYW5zZm9ybSB0aGUgcG9pbnQgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUsIHNvIHdlIGNhbiB0ZXN0IGl0IHdpdGggdGhlIGNsaXBBcmVhL2NoaWxkcmVuXHJcbiAgICBjb25zdCBsb2NhbFBvaW50ID0gdGhpcy5fdHJhbnNmb3JtLmdldEludmVyc2UoKS50aW1lc1ZlY3RvcjIoIHBvaW50ICk7XHJcblxyXG4gICAgLy8gSWYgYW55IGNoaWxkIHdhcyBoaXQgYnV0IHJldHVybmVkICdwaGV0aW9Ob3RTZWxlY3RhYmxlJywgdGhlbiB0aGF0IHdpbGwgdHJpZ2dlciB0aGUgXCJmaW5kIHRoZSBiZXN0IHRhcmdldFwiIHBvcnRpb25cclxuICAgIC8vIG9mIHRoZSBhbGdvcml0aG0sIG1vdmluZyBvbiBmcm9tIHRoZSBcImZpbmQgdGhlIGhpdCBOb2RlXCIgcGFydC5cclxuICAgIGxldCBjaGlsZEhpdFdpdGhvdXRUYXJnZXQgPSBudWxsO1xyXG5cclxuICAgIC8vIENoZWNrIGNoaWxkcmVuIGJlZm9yZSBvdXIgXCJzZWxmXCIsIHNpbmNlIHRoZSBjaGlsZHJlbiBhcmUgcmVuZGVyZWQgb24gdG9wLlxyXG4gICAgLy8gTWFudWFsIGl0ZXJhdGlvbiBoZXJlIHNvIHdlIGNhbiByZXR1cm4gZGlyZWN0bHksIGFuZCBzbyB3ZSBjYW4gaXRlcmF0ZSBiYWNrd2FyZHMgKGxhc3Qgbm9kZSBpcyByZW5kZXJlZCBpbiBmcm9udCkuXHJcbiAgICBmb3IgKCBsZXQgaSA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG5cclxuICAgICAgLy8gTm90IG5lY2Vzc2FyaWx5IGEgY2hpbGQgb2YgdGhpcyBOb2RlIChzZWUgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKSlcclxuICAgICAgY29uc3QgY2hpbGRUYXJnZXRIaXQgPSB0aGlzLl9jaGlsZHJlblsgaSBdLmdldFBoZXRpb01vdXNlSGl0KCBsb2NhbFBvaW50ICk7XHJcblxyXG4gICAgICBpZiAoIGNoaWxkVGFyZ2V0SGl0IGluc3RhbmNlb2YgUGhldGlvT2JqZWN0ICkge1xyXG4gICAgICAgIHJldHVybiBjaGlsZFRhcmdldEhpdDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggY2hpbGRUYXJnZXRIaXQgPT09ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyApIHtcclxuICAgICAgICBjaGlsZEhpdFdpdGhvdXRUYXJnZXQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIE5vIGhpdCwgc28ga2VlcCBpdGVyYXRpbmcgdG8gbmV4dCBjaGlsZFxyXG4gICAgfVxyXG5cclxuICAgIGlmICggY2hpbGRIaXRXaXRob3V0VGFyZ2V0ICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRlc3RzIGZvciBtb3VzZSBoaXQgYXJlYXMgYmVmb3JlIHRlc3RpbmcgY29udGFpbnNQb2ludFNlbGYuIElmIHRoZXJlIGlzIGEgbW91c2VBcmVhLCB0aGVuIGRvbid0IGV2ZXIgY2hlY2sgc2VsZkJvdW5kcy5cclxuICAgIGlmICggdGhpcy5fbW91c2VBcmVhICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbW91c2VBcmVhLmNvbnRhaW5zUG9pbnQoIGxvY2FsUG9pbnQgKSA/IHRoaXMuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlkbid0IGhpdCBvdXIgY2hpbGRyZW4sIHNvIGNoZWNrIG91cnNlbHZlcyBhcyBhIGxhc3QgcmVzb3J0LiBDaGVjayBvdXIgc2VsZkJvdW5kcyBmaXJzdCwgc28gd2UgY2FuIHBvdGVudGlhbGx5XHJcbiAgICAvLyBhdm9pZCBoaXQtdGVzdGluZyB0aGUgYWN0dWFsIG9iamVjdCAod2hpY2ggbWF5IGJlIG1vcmUgZXhwZW5zaXZlKS5cclxuICAgIGlmICggdGhpcy5zZWxmQm91bmRzLmNvbnRhaW5zUG9pbnQoIGxvY2FsUG9pbnQgKSAmJiB0aGlzLmNvbnRhaW5zUG9pbnRTZWxmKCBsb2NhbFBvaW50ICkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm8gaGl0XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhpcyBOb2RlIGl0c2VsZiBpcyBwYWludGVkIChkaXNwbGF5cyBzb21ldGhpbmcgaXRzZWxmKS4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbi5cclxuICAgKi9cclxuICBwdWJsaWMgaXNQYWludGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgLy8gTm9ybWFsIG5vZGVzIGRvbid0IHJlbmRlciBhbnl0aGluZ1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIE5vZGUncyBzZWxmQm91bmRzIGFyZSBjb25zaWRlcmVkIHRvIGJlIHZhbGlkIChhbHdheXMgY29udGFpbmluZyB0aGUgZGlzcGxheWVkIHNlbGYgY29udGVudFxyXG4gICAqIG9mIHRoaXMgbm9kZSkuIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gaW4gc3VidHlwZXMgd2hlbiB0aGlzIGNhbiBjaGFuZ2UgKGUuZy4gVGV4dCkuXHJcbiAgICpcclxuICAgKiBJZiB0aGlzIHZhbHVlIHdvdWxkIHBvdGVudGlhbGx5IGNoYW5nZSwgcGxlYXNlIHRyaWdnZXIgdGhlIGV2ZW50ICdzZWxmQm91bmRzVmFsaWQnLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcmVTZWxmQm91bmRzVmFsaWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIE5vZGUgaGFzIGFueSBwYXJlbnRzIGF0IGFsbC5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzUGFyZW50KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudHMubGVuZ3RoICE9PSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgTm9kZSBoYXMgYW55IGNoaWxkcmVuIGF0IGFsbC5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzQ2hpbGRyZW4oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoID4gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciBhIGNoaWxkIHNob3VsZCBiZSBpbmNsdWRlZCBmb3IgbGF5b3V0IChpZiB0aGlzIE5vZGUgaXMgYSBsYXlvdXQgY29udGFpbmVyKS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNDaGlsZEluY2x1ZGVkSW5MYXlvdXQoIGNoaWxkOiBOb2RlICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGNoaWxkLmJvdW5kcy5pc1ZhbGlkKCkgJiYgKCAhdGhpcy5fZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyB8fCBjaGlsZC52aXNpYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgY2FsbGJhY2sgb24gbm9kZXMgcmVjdXJzaXZlbHkgaW4gYSBkZXB0aC1maXJzdCBtYW5uZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHdhbGtEZXB0aEZpcnN0KCBjYWxsYmFjazogKCBub2RlOiBOb2RlICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIGNhbGxiYWNrKCB0aGlzICk7XHJcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpcy5fY2hpbGRyZW5bIGkgXS53YWxrRGVwdGhGaXJzdCggY2FsbGJhY2sgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gaW5wdXQgbGlzdGVuZXIuXHJcbiAgICpcclxuICAgKiBTZWUgSW5wdXQuanMgZG9jdW1lbnRhdGlvbiBmb3IgaW5mb3JtYXRpb24gYWJvdXQgaG93IGV2ZW50IGxpc3RlbmVycyBhcmUgdXNlZC5cclxuICAgKlxyXG4gICAqIEFkZGl0aW9uYWxseSwgdGhlIGZvbGxvd2luZyBmaWVsZHMgYXJlIHN1cHBvcnRlZCBvbiBhIGxpc3RlbmVyOlxyXG4gICAqXHJcbiAgICogLSBpbnRlcnJ1cHQge2Z1bmN0aW9uKCl9OiBXaGVuIGEgcG9pbnRlciBpcyBpbnRlcnJ1cHRlZCwgaXQgd2lsbCBhdHRlbXB0IHRvIGNhbGwgdGhpcyBtZXRob2Qgb24gdGhlIGlucHV0IGxpc3RlbmVyXHJcbiAgICogLSBjdXJzb3Ige3N0cmluZ3xudWxsfTogSWYgbm9kZS5jdXJzb3IgaXMgbnVsbCwgYW55IG5vbi1udWxsIGN1cnNvciBvZiBhbiBpbnB1dCBsaXN0ZW5lciB3aWxsIGVmZmVjdGl2ZWx5XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgXCJvdmVycmlkZVwiIGl0LiBOT1RFOiB0aGlzIGNhbiBiZSBpbXBsZW1lbnRlZCBhcyBhbiBlczUgZ2V0dGVyLCBpZiB0aGUgY3Vyc29yIGNhbiBjaGFuZ2VcclxuICAgKi9cclxuICBwdWJsaWMgYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIHRoaXMuX2lucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApLCAnSW5wdXQgbGlzdGVuZXIgYWxyZWFkeSByZWdpc3RlcmVkIG9uIHRoaXMgTm9kZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpc3RlbmVyICE9PSBudWxsLCAnSW5wdXQgbGlzdGVuZXIgY2Fubm90IGJlIG51bGwnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsaXN0ZW5lciAhPT0gdW5kZWZpbmVkLCAnSW5wdXQgbGlzdGVuZXIgY2Fubm90IGJlIHVuZGVmaW5lZCcgKTtcclxuXHJcbiAgICAvLyBkb24ndCBhbGxvdyBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQgbXVsdGlwbGUgdGltZXNcclxuICAgIGlmICggIV8uaW5jbHVkZXMoIHRoaXMuX2lucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApICkge1xyXG4gICAgICB0aGlzLl9pbnB1dExpc3RlbmVycy5wdXNoKCBsaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9waWNrZXIub25BZGRJbnB1dExpc3RlbmVyKCk7XHJcbiAgICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbiBpbnB1dCBsaXN0ZW5lciB0aGF0IHdhcyBwcmV2aW91c2x5IGFkZGVkIHdpdGggYWRkSW5wdXRMaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IHRoaXMge1xyXG4gICAgY29uc3QgaW5kZXggPSBfLmluZGV4T2YoIHRoaXMuX2lucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIGVuc3VyZSB0aGUgbGlzdGVuZXIgaXMgaW4gb3VyIGxpc3QgKGlnbm9yZSBhc3NlcnRpb24gZm9yIGRpc3Bvc2FsLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvMzk0KVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc0Rpc3Bvc2VkIHx8IGluZGV4ID49IDAsICdDb3VsZCBub3QgZmluZCBpbnB1dCBsaXN0ZW5lciB0byByZW1vdmUnICk7XHJcbiAgICBpZiAoIGluZGV4ID49IDAgKSB7XHJcbiAgICAgIHRoaXMuX2lucHV0TGlzdGVuZXJzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuICAgICAgdGhpcy5fcGlja2VyLm9uUmVtb3ZlSW5wdXRMaXN0ZW5lcigpO1xyXG4gICAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBpbnB1dCBsaXN0ZW5lciBpcyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvIHRoaXMgbm9kZS5cclxuICAgKlxyXG4gICAqIE1vcmUgZWZmaWNpZW50IHRoYW4gY2hlY2tpbmcgbm9kZS5pbnB1dExpc3RlbmVycywgYXMgdGhhdCBpbmNsdWRlcyBhIGRlZmVuc2l2ZSBjb3B5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogYm9vbGVhbiB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9pbnB1dExpc3RlbmVycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCB0aGlzLl9pbnB1dExpc3RlbmVyc1sgaSBdID09PSBsaXN0ZW5lciApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgaW5wdXQgbGlzdGVuZXJzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0SW5wdXQoKTogdGhpcyB7XHJcbiAgICBjb25zdCBsaXN0ZW5lcnNDb3B5ID0gdGhpcy5pbnB1dExpc3RlbmVycztcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnNDb3B5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVyc0NvcHlbIGkgXTtcclxuXHJcbiAgICAgIGxpc3RlbmVyLmludGVycnVwdCAmJiBsaXN0ZW5lci5pbnRlcnJ1cHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdHMgYWxsIGlucHV0IGxpc3RlbmVycyB0aGF0IGFyZSBhdHRhY2hlZCB0byBlaXRoZXIgdGhpcyBub2RlLCBvciBhIGRlc2NlbmRhbnQgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0U3VidHJlZUlucHV0KCk6IHRoaXMge1xyXG4gICAgdGhpcy5pbnRlcnJ1cHRJbnB1dCgpO1xyXG5cclxuICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW4uc2xpY2UoKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjaGlsZHJlblsgaSBdLmludGVycnVwdFN1YnRyZWVJbnB1dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlcyB0aGUgdHJhbnNmb3JtIG9mIHRoaXMgTm9kZSBieSBhZGRpbmcgYSB0cmFuc2Zvcm0uIFRoZSBkZWZhdWx0IFwiYXBwZW5kc1wiIHRoZSB0cmFuc2Zvcm0sIHNvIHRoYXQgaXQgd2lsbFxyXG4gICAqIGFwcGVhciB0byBoYXBwZW4gdG8gdGhlIE5vZGUgYmVmb3JlIHRoZSByZXN0IG9mIHRoZSB0cmFuc2Zvcm0gd291bGQgYXBwbHksIGJ1dCBpZiBcInByZXBlbmRlZFwiLCB0aGUgcmVzdCBvZiB0aGVcclxuICAgKiB0cmFuc2Zvcm0gd291bGQgYXBwbHkgZmlyc3QuXHJcbiAgICpcclxuICAgKiBBcyBhbiBleGFtcGxlLCBpZiBhIE5vZGUgaXMgY2VudGVyZWQgYXQgKDAsMCkgYW5kIHNjYWxlZCBieSAyOlxyXG4gICAqIHRyYW5zbGF0ZSggMTAwLCAwICkgd291bGQgY2F1c2UgdGhlIGNlbnRlciBvZiB0aGUgTm9kZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSB0byBiZSBhdCAoMjAwLDApLlxyXG4gICAqIHRyYW5zbGF0ZSggMTAwLCAwLCB0cnVlICkgd291bGQgY2F1c2UgdGhlIGNlbnRlciBvZiB0aGUgTm9kZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSB0byBiZSBhdCAoMTAwLDApLlxyXG4gICAqXHJcbiAgICogQWxsb3dlZCBjYWxsIHNpZ25hdHVyZXM6XHJcbiAgICogdHJhbnNsYXRlKCB4IHtudW1iZXJ9LCB5IHtudW1iZXJ9IClcclxuICAgKiB0cmFuc2xhdGUoIHgge251bWJlcn0sIHkge251bWJlcn0sIHByZXBlbmRJbnN0ZWFkIHtib29sZWFufSApXHJcbiAgICogdHJhbnNsYXRlKCB2ZWN0b3Ige1ZlY3RvcjJ9IClcclxuICAgKiB0cmFuc2xhdGUoIHZlY3RvciB7VmVjdG9yMn0sIHByZXBlbmRJbnN0ZWFkIHtib29sZWFufSApXHJcbiAgICpcclxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvb3JkaW5hdGVcclxuICAgKiBAcGFyYW0gW3ByZXBlbmRJbnN0ZWFkXSAtIFdoZXRoZXIgdGhlIHRyYW5zZm9ybSBzaG91bGQgYmUgcHJlcGVuZGVkIChkZWZhdWx0cyB0byBmYWxzZSlcclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNsYXRlKCB2OiBWZWN0b3IyLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZDtcclxuICB0cmFuc2xhdGUoIHg6IG51bWJlciwgeTogbnVtYmVyLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICB0cmFuc2xhdGUoIHg6IG51bWJlciB8IFZlY3RvcjIsIHk/OiBudW1iZXIgfCBib29sZWFuLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgICBpZiAoIHR5cGVvZiB4ID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgLy8gdHJhbnNsYXRlKCB4LCB5LCBwcmVwZW5kSW5zdGVhZCApXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksICd4IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgeSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHkgKSwgJ3kgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICAgIGlmICggTWF0aC5hYnMoIHggKSA8IDFlLTEyICYmIE1hdGguYWJzKCB5IGFzIG51bWJlciApIDwgMWUtMTIgKSB7IHJldHVybjsgfSAvLyBiYWlsIG91dCBpZiBib3RoIGFyZSB6ZXJvXHJcbiAgICAgIGlmICggcHJlcGVuZEluc3RlYWQgKSB7XHJcbiAgICAgICAgdGhpcy5wcmVwZW5kVHJhbnNsYXRpb24oIHgsIHkgYXMgbnVtYmVyICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRNYXRyaXgoIHNjcmF0Y2hNYXRyaXgzLnNldFRvVHJhbnNsYXRpb24oIHgsIHkgYXMgbnVtYmVyICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHRyYW5zbGF0ZSggdmVjdG9yLCBwcmVwZW5kSW5zdGVhZCApXHJcbiAgICAgIGNvbnN0IHZlY3RvciA9IHg7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZlY3Rvci5pc0Zpbml0ZSgpLCAndHJhbnNsYXRpb24gc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjIgaWYgbm90IGZpbml0ZSBudW1iZXJzJyApO1xyXG4gICAgICBpZiAoICF2ZWN0b3IueCAmJiAhdmVjdG9yLnkgKSB7IHJldHVybjsgfSAvLyBiYWlsIG91dCBpZiBib3RoIGFyZSB6ZXJvXHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCB2ZWN0b3IueCwgdmVjdG9yLnksIHkgYXMgYm9vbGVhbiApOyAvLyBmb3J3YXJkIHRvIGZ1bGwgdmVyc2lvblxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2NhbGVzIHRoZSBub2RlJ3MgdHJhbnNmb3JtLiBUaGUgZGVmYXVsdCBcImFwcGVuZHNcIiB0aGUgdHJhbnNmb3JtLCBzbyB0aGF0IGl0IHdpbGxcclxuICAgKiBhcHBlYXIgdG8gaGFwcGVuIHRvIHRoZSBOb2RlIGJlZm9yZSB0aGUgcmVzdCBvZiB0aGUgdHJhbnNmb3JtIHdvdWxkIGFwcGx5LCBidXQgaWYgXCJwcmVwZW5kZWRcIiwgdGhlIHJlc3Qgb2YgdGhlXHJcbiAgICogdHJhbnNmb3JtIHdvdWxkIGFwcGx5IGZpcnN0LlxyXG4gICAqXHJcbiAgICogQXMgYW4gZXhhbXBsZSwgaWYgYSBOb2RlIGlzIHRyYW5zbGF0ZWQgdG8gKDEwMCwwKTpcclxuICAgKiBzY2FsZSggMiApIHdpbGwgbGVhdmUgdGhlIE5vZGUgdHJhbnNsYXRlZCBhdCAoMTAwLDApLCBidXQgaXQgd2lsbCBiZSB0d2ljZSBhcyBiaWcgYXJvdW5kIGl0cyBvcmlnaW4gYXQgdGhhdCBsb2NhdGlvbi5cclxuICAgKiBzY2FsZSggMiwgdHJ1ZSApIHdpbGwgc2hpZnQgdGhlIE5vZGUgdG8gKDIwMCwwKS5cclxuICAgKlxyXG4gICAqIEFsbG93ZWQgY2FsbCBzaWduYXR1cmVzOlxyXG4gICAqIChzIGludm9jYXRpb24pOiBzY2FsZSggcyB7bnVtYmVyfFZlY3RvcjJ9LCBbcHJlcGVuZEluc3RlYWRdIHtib29sZWFufSApXHJcbiAgICogKHgseSBpbnZvY2F0aW9uKTogc2NhbGUoIHgge251bWJlcn0sIHkge251bWJlcn0sIFtwcmVwZW5kSW5zdGVhZF0ge2Jvb2xlYW59IClcclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gKHMgaW52b2NhdGlvbik6IHtudW1iZXJ9IHNjYWxlcyBib3RoIGRpbWVuc2lvbnMgZXF1YWxseSwgb3Ige1ZlY3RvcjJ9IHNjYWxlcyBpbmRlcGVuZGVudGx5XHJcbiAgICogICAgICAgICAgLSAoeCx5IGludm9jYXRpb24pOiB7bnVtYmVyfSBzY2FsZSBmb3IgdGhlIHgtZGltZW5zaW9uXHJcbiAgICogQHBhcmFtIFt5XSAtIChzIGludm9jYXRpb24pOiB7Ym9vbGVhbn0gcHJlcGVuZEluc3RlYWQgLSBXaGV0aGVyIHRoZSB0cmFuc2Zvcm0gc2hvdWxkIGJlIHByZXBlbmRlZCAoZGVmYXVsdHMgdG8gZmFsc2UpXHJcbiAgICogICAgICAgICAgICAtICh4LHkgaW52b2NhdGlvbik6IHtudW1iZXJ9IHkgLSBzY2FsZSBmb3IgdGhlIHktZGltZW5zaW9uXHJcbiAgICogQHBhcmFtIFtwcmVwZW5kSW5zdGVhZF0gLSAoeCx5IGludm9jYXRpb24pIFdoZXRoZXIgdGhlIHRyYW5zZm9ybSBzaG91bGQgYmUgcHJlcGVuZGVkIChkZWZhdWx0cyB0byBmYWxzZSlcclxuICAgKi9cclxuICBwdWJsaWMgc2NhbGUoIHM6IG51bWJlciwgcHJlcGVuZEluc3RlYWQ/OiBib29sZWFuICk6IHZvaWQ7XHJcbiAgc2NhbGUoIHM6IFZlY3RvcjIsIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gIHNjYWxlKCB4OiBudW1iZXIsIHk6IG51bWJlciwgcHJlcGVuZEluc3RlYWQ/OiBib29sZWFuICk6IHZvaWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgc2NhbGUoIHg6IG51bWJlciB8IFZlY3RvcjIsIHk/OiBudW1iZXIgfCBib29sZWFuLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgICBpZiAoIHR5cGVvZiB4ID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgJ3NjYWxlcyBzaG91bGQgYmUgZmluaXRlJyApO1xyXG4gICAgICBpZiAoIHkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeSA9PT0gJ2Jvb2xlYW4nICkge1xyXG4gICAgICAgIC8vIHNjYWxlKCBzY2FsZSwgW3ByZXBlbmRJbnN0ZWFkXSApXHJcbiAgICAgICAgdGhpcy5zY2FsZSggeCwgeCwgeSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIHNjYWxlKCB4LCB5LCBbcHJlcGVuZEluc3RlYWRdIClcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeSApLCAnc2NhbGVzIHNob3VsZCBiZSBmaW5pdGUgbnVtYmVycycgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcmVwZW5kSW5zdGVhZCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcmVwZW5kSW5zdGVhZCA9PT0gJ2Jvb2xlYW4nLCAnSWYgcHJvdmlkZWQsIHByZXBlbmRJbnN0ZWFkIHNob3VsZCBiZSBib29sZWFuJyApO1xyXG5cclxuICAgICAgICBpZiAoIHggPT09IDEgJiYgeSA9PT0gMSApIHsgcmV0dXJuOyB9IC8vIGJhaWwgb3V0IGlmIHdlIGFyZSBzY2FsaW5nIGJ5IDEgKGlkZW50aXR5KVxyXG4gICAgICAgIGlmICggcHJlcGVuZEluc3RlYWQgKSB7XHJcbiAgICAgICAgICB0aGlzLnByZXBlbmRNYXRyaXgoIE1hdHJpeDMuc2NhbGluZyggeCwgeSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5hcHBlbmRNYXRyaXgoIE1hdHJpeDMuc2NhbGluZyggeCwgeSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gc2NhbGUoIHZlY3RvciwgW3ByZXBlbmRJbnN0ZWFkXSApXHJcbiAgICAgIGNvbnN0IHZlY3RvciA9IHg7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZlY3Rvci5pc0Zpbml0ZSgpLCAnc2NhbGUgc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjIgaWYgbm90IGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgICAgdGhpcy5zY2FsZSggdmVjdG9yLngsIHZlY3Rvci55LCB5IGFzIGJvb2xlYW4gKTsgLy8gZm9yd2FyZCB0byBmdWxsIHZlcnNpb25cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdGF0ZXMgdGhlIG5vZGUncyB0cmFuc2Zvcm0uIFRoZSBkZWZhdWx0IFwiYXBwZW5kc1wiIHRoZSB0cmFuc2Zvcm0sIHNvIHRoYXQgaXQgd2lsbFxyXG4gICAqIGFwcGVhciB0byBoYXBwZW4gdG8gdGhlIE5vZGUgYmVmb3JlIHRoZSByZXN0IG9mIHRoZSB0cmFuc2Zvcm0gd291bGQgYXBwbHksIGJ1dCBpZiBcInByZXBlbmRlZFwiLCB0aGUgcmVzdCBvZiB0aGVcclxuICAgKiB0cmFuc2Zvcm0gd291bGQgYXBwbHkgZmlyc3QuXHJcbiAgICpcclxuICAgKiBBcyBhbiBleGFtcGxlLCBpZiBhIE5vZGUgaXMgdHJhbnNsYXRlZCB0byAoMTAwLDApOlxyXG4gICAqIHJvdGF0ZSggTWF0aC5QSSApIHdpbGwgcm90YXRlIHRoZSBOb2RlIGFyb3VuZCAoMTAwLDApXHJcbiAgICogcm90YXRlKCBNYXRoLlBJLCB0cnVlICkgd2lsbCByb3RhdGUgdGhlIE5vZGUgYXJvdW5kIHRoZSBvcmlnaW4sIG1vdmluZyBpdCB0byAoLTEwMCwwKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFuZ2xlIC0gVGhlIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGUgYnlcclxuICAgKiBAcGFyYW0gW3ByZXBlbmRJbnN0ZWFkXSAtIFdoZXRoZXIgdGhlIHRyYW5zZm9ybSBzaG91bGQgYmUgcHJlcGVuZGVkIChkZWZhdWx0cyB0byBmYWxzZSlcclxuICAgKi9cclxuICBwdWJsaWMgcm90YXRlKCBhbmdsZTogbnVtYmVyLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggYW5nbGUgKSwgJ2FuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcmVwZW5kSW5zdGVhZCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcmVwZW5kSW5zdGVhZCA9PT0gJ2Jvb2xlYW4nICk7XHJcbiAgICBpZiAoIGFuZ2xlICUgKCAyICogTWF0aC5QSSApID09PSAwICkgeyByZXR1cm47IH0gLy8gYmFpbCBvdXQgaWYgb3VyIGFuZ2xlIGlzIGVmZmVjdGl2ZWx5IDBcclxuICAgIGlmICggcHJlcGVuZEluc3RlYWQgKSB7XHJcbiAgICAgIHRoaXMucHJlcGVuZE1hdHJpeCggTWF0cml4My5yb3RhdGlvbjIoIGFuZ2xlICkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmFwcGVuZE1hdHJpeCggTWF0cml4My5yb3RhdGlvbjIoIGFuZ2xlICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJvdGF0ZXMgdGhlIG5vZGUncyB0cmFuc2Zvcm0gYXJvdW5kIGEgc3BlY2lmaWMgcG9pbnQgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgYnkgcHJlcGVuZGluZyB0aGUgdHJhbnNmb3JtLlxyXG4gICAqXHJcbiAgICogVE9ETzogZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBzaG91bGQgdXNlIHRoZSBhcHBlbmRNYXRyaXggbWV0aG9kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBJbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBJbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHJvdGF0ZUFyb3VuZCggcG9pbnQ6IFZlY3RvcjIsIGFuZ2xlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwb2ludC5pc0Zpbml0ZSgpLCAncG9pbnQgc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggYW5nbGUgKSwgJ2FuZ2xlIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgbGV0IG1hdHJpeCA9IE1hdHJpeDMudHJhbnNsYXRpb24oIC1wb2ludC54LCAtcG9pbnQueSApO1xyXG4gICAgbWF0cml4ID0gTWF0cml4My5yb3RhdGlvbjIoIGFuZ2xlICkudGltZXNNYXRyaXgoIG1hdHJpeCApO1xyXG4gICAgbWF0cml4ID0gTWF0cml4My50cmFuc2xhdGlvbiggcG9pbnQueCwgcG9pbnQueSApLnRpbWVzTWF0cml4KCBtYXRyaXggKTtcclxuICAgIHRoaXMucHJlcGVuZE1hdHJpeCggbWF0cml4ICk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGUgeCBjb29yZGluYXRlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIG9mIHdoZXJlIHRoZSBub2RlJ3Mgb3JpZ2luIGlzIHRyYW5zZm9ybWVkIHRvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRYKCB4OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCAneCBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIHRoaXMudHJhbnNsYXRlKCB4IC0gdGhpcy5nZXRYKCksIDAsIHRydWUgKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgeCggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0WCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRYKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHggY29vcmRpbmF0ZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBvZiB3aGVyZSB0aGUgbm9kZSdzIG9yaWdpbiBpcyB0cmFuc2Zvcm1lZCB0by5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5tMDIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGUgeSBjb29yZGluYXRlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIG9mIHdoZXJlIHRoZSBub2RlJ3Mgb3JpZ2luIGlzIHRyYW5zZm9ybWVkIHRvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRZKCB5OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeSApLCAneSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIHRoaXMudHJhbnNsYXRlKCAwLCB5IC0gdGhpcy5nZXRZKCksIHRydWUgKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgeSggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0WSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRZKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHkgY29vcmRpbmF0ZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBvZiB3aGVyZSB0aGUgbm9kZSdzIG9yaWdpbiBpcyB0cmFuc2Zvcm1lZCB0by5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5tMTIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFR5cGljYWxseSB3aXRob3V0IHJvdGF0aW9ucyBvciBuZWdhdGl2ZSBwYXJhbWV0ZXJzLCB0aGlzIHNldHMgdGhlIHNjYWxlIGZvciBlYWNoIGF4aXMuIEluIGl0cyBtb3JlIGdlbmVyYWwgZm9ybSxcclxuICAgKiBpdCBtb2RpZmllcyB0aGUgbm9kZSdzIHRyYW5zZm9ybSBzbyB0aGF0OlxyXG4gICAqIC0gVHJhbnNmb3JtaW5nICgxLDApIHdpdGggb3VyIHRyYW5zZm9ybSB3aWxsIHJlc3VsdCBpbiBhIHZlY3RvciB3aXRoIG1hZ25pdHVkZSBhYnMoIHgtc2NhbGUtbWFnbml0dWRlIClcclxuICAgKiAtIFRyYW5zZm9ybWluZyAoMCwxKSB3aXRoIG91ciB0cmFuc2Zvcm0gd2lsbCByZXN1bHQgaW4gYSB2ZWN0b3Igd2l0aCBtYWduaXR1ZGUgYWJzKCB5LXNjYWxlLW1hZ25pdHVkZSApXHJcbiAgICogLSBJZiBwYXJhbWV0ZXJzIGFyZSBuZWdhdGl2ZSwgaXQgd2lsbCBmbGlwIG9yaWVudGF0aW9uIGluIHRoYXQgZGlyZWN0LlxyXG4gICAqXHJcbiAgICogQWxsb3dlZCBjYWxsIHNpZ25hdHVyZXM6XHJcbiAgICogc2V0U2NhbGVNYWduaXR1ZGUoIHMgKVxyXG4gICAqIHNldFNjYWxlTWFnbml0dWRlKCBzeCwgc3kgKVxyXG4gICAqIHNldFNjYWxlTWFnbml0dWRlKCB2ZWN0b3IgKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGEgLSBTY2FsZSBmb3IgYm90aCBheGVzLCBvciBzY2FsZSBmb3IgeC1heGlzIGlmIHVzaW5nIHRoZSAyLXBhcmFtZXRlciBjYWxsXHJcbiAgICogQHBhcmFtIFtiXSAtIFNjYWxlIGZvciB0aGUgWSBheGlzIChvbmx5IGZvciB0aGUgMi1wYXJhbWV0ZXIgY2FsbClcclxuICAgKi9cclxuICBwdWJsaWMgc2V0U2NhbGVNYWduaXR1ZGUoIHM6IG51bWJlciApOiB0aGlzO1xyXG4gIHNldFNjYWxlTWFnbml0dWRlKCB2OiBWZWN0b3IyICk6IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgc2V0U2NhbGVNYWduaXR1ZGUoIHN4OiBudW1iZXIsIHN5OiBudW1iZXIgKTogdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzZXRTY2FsZU1hZ25pdHVkZSggYTogbnVtYmVyIHwgVmVjdG9yMiwgYj86IG51bWJlciApOiB0aGlzIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICAgIGNvbnN0IGN1cnJlbnRTY2FsZSA9IHRoaXMuZ2V0U2NhbGVWZWN0b3IoKTtcclxuXHJcbiAgICBpZiAoIHR5cGVvZiBhID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgaWYgKCBiID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgLy8gdG8gbWFwIHNldFNjYWxlTWFnbml0dWRlKCBzY2FsZSApID0+IHNldFNjYWxlTWFnbml0dWRlKCBzY2FsZSwgc2NhbGUgKVxyXG4gICAgICAgIGIgPSBhO1xyXG4gICAgICB9XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBhICksICdzZXRTY2FsZU1hZ25pdHVkZSBwYXJhbWV0ZXJzIHNob3VsZCBiZSBmaW5pdGUgbnVtYmVycycgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGIgKSwgJ3NldFNjYWxlTWFnbml0dWRlIHBhcmFtZXRlcnMgc2hvdWxkIGJlIGZpbml0ZSBudW1iZXJzJyApO1xyXG4gICAgICAvLyBzZXRTY2FsZU1hZ25pdHVkZSggeCwgeSApXHJcbiAgICAgIHRoaXMuYXBwZW5kTWF0cml4KCBNYXRyaXgzLnNjYWxpbmcoIGEgLyBjdXJyZW50U2NhbGUueCwgYiAvIGN1cnJlbnRTY2FsZS55ICkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBzZXRTY2FsZU1hZ25pdHVkZSggdmVjdG9yICksIHdoZXJlIHdlIHNldCB0aGUgeC1zY2FsZSB0byB2ZWN0b3IueCBhbmQgeS1zY2FsZSB0byB2ZWN0b3IueVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhLmlzRmluaXRlKCksICdmaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgICB0aGlzLmFwcGVuZE1hdHJpeCggTWF0cml4My5zY2FsaW5nKCBhLnggLyBjdXJyZW50U2NhbGUueCwgYS55IC8gY3VycmVudFNjYWxlLnkgKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdmVjdG9yIHdpdGggYW4gZW50cnkgZm9yIGVhY2ggYXhpcywgZS5nLiAoNSwyKSBmb3IgYW4gYWZmaW5lIG1hdHJpeCB3aXRoIHJvd3MgKCg1LDAsMCksKDAsMiwwKSwoMCwwLDEpKS5cclxuICAgKlxyXG4gICAqIEl0IGlzIGVxdWl2YWxlbnQgdG86XHJcbiAgICogKCBUKDEsMCkubWFnbml0dWRlKCksIFQoMCwxKS5tYWduaXR1ZGUoKSApIHdoZXJlIFQoKSB0cmFuc2Zvcm1zIHBvaW50cyB3aXRoIG91ciB0cmFuc2Zvcm0uXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNjYWxlVmVjdG9yKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5nZXRTY2FsZVZlY3RvcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUm90YXRlcyB0aGlzIG5vZGUncyB0cmFuc2Zvcm0gc28gdGhhdCBhIHVuaXQgKDEsMCkgdmVjdG9yIHdvdWxkIGJlIHJvdGF0ZWQgYnkgdGhpcyBub2RlJ3MgdHJhbnNmb3JtIGJ5IHRoZVxyXG4gICAqIHNwZWNpZmllZCBhbW91bnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcm90YXRpb24gLSBJbiByYWRpYW5zXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJvdGF0aW9uKCByb3RhdGlvbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHJvdGF0aW9uICksXHJcbiAgICAgICdyb3RhdGlvbiBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIHRoaXMuYXBwZW5kTWF0cml4KCBzY3JhdGNoTWF0cml4My5zZXRUb1JvdGF0aW9uWiggcm90YXRpb24gLSB0aGlzLmdldFJvdGF0aW9uKCkgKSApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Um90YXRpb24oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcm90YXRpb24oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLnNldFJvdGF0aW9uKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJvdGF0aW9uKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJvdGF0aW9uKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRSb3RhdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcm90YXRpb24gKGluIHJhZGlhbnMpIHRoYXQgd291bGQgYmUgYXBwbGllZCB0byBhIHVuaXQgKDEsMCkgdmVjdG9yIHdoZW4gdHJhbnNmb3JtZWQgd2l0aCB0aGlzIE5vZGUnc1xyXG4gICAqIHRyYW5zZm9ybS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Um90YXRpb24oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkuZ2V0Um90YXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVzIHRoZSB0cmFuc2xhdGlvbiBvZiB0aGlzIE5vZGUncyB0cmFuc2Zvcm0gc28gdGhhdCB0aGUgbm9kZSdzIGxvY2FsLWNvb3JkaW5hdGUgb3JpZ2luIHdpbGwgYmUgdHJhbnNmb3JtZWRcclxuICAgKiB0byB0aGUgcGFzc2VkLWluIHgveS5cclxuICAgKlxyXG4gICAqIEFsbG93ZWQgY2FsbCBzaWduYXR1cmVzOlxyXG4gICAqIHNldFRyYW5zbGF0aW9uKCB4LCB5IClcclxuICAgKiBzZXRUcmFuc2xhdGlvbiggdmVjdG9yIClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBhIC0gWCB0cmFuc2xhdGlvbiAtIG9yIFZlY3RvciB3aXRoIHgveSB0cmFuc2xhdGlvbiBpbiBjb21wb25lbnRzXHJcbiAgICogQHBhcmFtIFtiXSAtIFkgdHJhbnNsYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VHJhbnNsYXRpb24oIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHRoaXM7XHJcbiAgc2V0VHJhbnNsYXRpb24oIHY6IFZlY3RvcjIgKTogdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzZXRUcmFuc2xhdGlvbiggYTogbnVtYmVyIHwgVmVjdG9yMiwgYj86IG51bWJlciApOiB0aGlzIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICAgIGNvbnN0IG0gPSB0aGlzLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCk7XHJcbiAgICBjb25zdCB0eCA9IG0ubTAyKCk7XHJcbiAgICBjb25zdCB0eSA9IG0ubTEyKCk7XHJcblxyXG4gICAgbGV0IGR4O1xyXG4gICAgbGV0IGR5O1xyXG5cclxuICAgIGlmICggdHlwZW9mIGEgPT09ICdudW1iZXInICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggYSApLCAnUGFyYW1ldGVycyB0byBzZXRUcmFuc2xhdGlvbiBzaG91bGQgYmUgZmluaXRlIG51bWJlcnMnICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGIgIT09IHVuZGVmaW5lZCAmJiBpc0Zpbml0ZSggYiApLCAnUGFyYW1ldGVycyB0byBzZXRUcmFuc2xhdGlvbiBzaG91bGQgYmUgZmluaXRlIG51bWJlcnMnICk7XHJcbiAgICAgIGR4ID0gYSAtIHR4O1xyXG4gICAgICBkeSA9IGIhIC0gdHk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYS5pc0Zpbml0ZSgpLCAnU2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcbiAgICAgIGR4ID0gYS54IC0gdHg7XHJcbiAgICAgIGR5ID0gYS55IC0gdHk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGUoIGR4LCBkeSwgdHJ1ZSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFRyYW5zbGF0aW9uKCkgZm9yIG1vcmUgaW5mb3JtYXRpb24gLSB0aGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgd2l0aCBWZWN0b3IyXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB0cmFuc2xhdGlvbiggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldFRyYW5zbGF0aW9uKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFRyYW5zbGF0aW9uKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHRyYW5zbGF0aW9uKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNsYXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB2ZWN0b3Igb2Ygd2hlcmUgdGhpcyBOb2RlJ3MgbG9jYWwtY29vcmRpbmF0ZSBvcmlnaW4gd2lsbCBiZSB0cmFuc2Zvcm1lZCBieSBpdCdzIG93biB0cmFuc2Zvcm0uXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zbGF0aW9uKCk6IFZlY3RvcjIge1xyXG4gICAgY29uc3QgbWF0cml4ID0gdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpO1xyXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IyKCBtYXRyaXgubTAyKCksIG1hdHJpeC5tMTIoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwZW5kcyBhIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB0byB0aGlzIE5vZGUncyB0cmFuc2Zvcm0uIEFwcGVuZGluZyBtZWFucyB0aGlzIHRyYW5zZm9ybSBpcyBjb25jZXB0dWFsbHkgYXBwbGllZFxyXG4gICAqIGZpcnN0IGJlZm9yZSB0aGUgcmVzdCBvZiB0aGUgTm9kZSdzIGN1cnJlbnQgdHJhbnNmb3JtIChpLmUuIGFwcGxpZWQgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcHBlbmRNYXRyaXgoIG1hdHJpeDogTWF0cml4MyApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1hdHJpeC5pc0Zpbml0ZSgpLCAnbWF0cml4IHNob3VsZCBiZSBhIGZpbml0ZSBNYXRyaXgzJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF0cml4LmdldERldGVybWluYW50KCkgIT09IDAsICdtYXRyaXggc2hvdWxkIG5vdCBtYXAgcGxhbmUgdG8gYSBsaW5lIG9yIHBvaW50JyApO1xyXG4gICAgdGhpcy5fdHJhbnNmb3JtLmFwcGVuZCggbWF0cml4ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQcmVwZW5kcyBhIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB0byB0aGlzIE5vZGUncyB0cmFuc2Zvcm0uIFByZXBlbmRpbmcgbWVhbnMgdGhpcyB0cmFuc2Zvcm0gaXMgY29uY2VwdHVhbGx5IGFwcGxpZWRcclxuICAgKiBhZnRlciB0aGUgcmVzdCBvZiB0aGUgTm9kZSdzIGN1cnJlbnQgdHJhbnNmb3JtIChpLmUuIGFwcGxpZWQgaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKi9cclxuICBwdWJsaWMgcHJlcGVuZE1hdHJpeCggbWF0cml4OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF0cml4LmlzRmluaXRlKCksICdtYXRyaXggc2hvdWxkIGJlIGEgZmluaXRlIE1hdHJpeDMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRyaXguZ2V0RGV0ZXJtaW5hbnQoKSAhPT0gMCwgJ21hdHJpeCBzaG91bGQgbm90IG1hcCBwbGFuZSB0byBhIGxpbmUgb3IgcG9pbnQnICk7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm0ucHJlcGVuZCggbWF0cml4ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQcmVwZW5kcyBhbiAoeCx5KSB0cmFuc2xhdGlvbiB0byBvdXIgTm9kZSdzIHRyYW5zZm9ybSBpbiBhbiBlZmZpY2llbnQgbWFubmVyIHdpdGhvdXQgYWxsb2NhdGluZyBhIG1hdHJpeC5cclxuICAgKiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExOVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwcmVwZW5kVHJhbnNsYXRpb24oIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgJ3ggc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksICd5IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCAheCAmJiAheSApIHsgcmV0dXJuOyB9IC8vIGJhaWwgb3V0IGlmIGJvdGggYXJlIHplcm9cclxuXHJcbiAgICB0aGlzLl90cmFuc2Zvcm0ucHJlcGVuZFRyYW5zbGF0aW9uKCB4LCB5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoaXMgTm9kZSdzIHRyYW5zZm9ybSB0byBtYXRjaCB0aGUgcGFzc2VkLWluIHRyYW5zZm9ybWF0aW9uIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TWF0cml4KCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRyaXguaXNGaW5pdGUoKSwgJ21hdHJpeCBzaG91bGQgYmUgYSBmaW5pdGUgTWF0cml4MycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1hdHJpeC5nZXREZXRlcm1pbmFudCgpICE9PSAwLCAnbWF0cml4IHNob3VsZCBub3QgbWFwIHBsYW5lIHRvIGEgbGluZSBvciBwb2ludCcgKTtcclxuXHJcbiAgICB0aGlzLl90cmFuc2Zvcm0uc2V0TWF0cml4KCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRNYXRyaXgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbWF0cml4KCB2YWx1ZTogTWF0cml4MyApIHtcclxuICAgIHRoaXMuc2V0TWF0cml4KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldE1hdHJpeCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBtYXRyaXgoKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNYXRyaXgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBNYXRyaXgzIHJlcHJlc2VudGluZyBvdXIgTm9kZSdzIHRyYW5zZm9ybS5cclxuICAgKlxyXG4gICAqIE5PVEU6IERvIG5vdCBtdXRhdGUgdGhlIHJldHVybmVkIG1hdHJpeC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gb3VyIE5vZGUncyB0cmFuc2Zvcm1cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNmb3JtKCk6IFRyYW5zZm9ybTMge1xyXG4gICAgLy8gZm9yIG5vdywgcmV0dXJuIGFuIGFjdHVhbCBjb3B5LiB3ZSBjYW4gY29uc2lkZXIgbGlzdGVuaW5nIHRvIGNoYW5nZXMgaW4gdGhlIGZ1dHVyZVxyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRUcmFuc2Zvcm0oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdHJhbnNmb3JtKCk6IFRyYW5zZm9ybTMge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmb3JtKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXNldHMgb3VyIE5vZGUncyB0cmFuc2Zvcm0gdG8gYW4gaWRlbnRpdHkgdHJhbnNmb3JtIChpLmUuIG5vIHRyYW5zZm9ybSBpcyBhcHBsaWVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgcmVzZXRUcmFuc2Zvcm0oKTogdm9pZCB7XHJcbiAgICB0aGlzLnNldE1hdHJpeCggTWF0cml4My5JREVOVElUWSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgY2FsbGVkIHdoZW4gb3VyIHRyYW5zZm9ybSBpcyBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25UcmFuc2Zvcm1DaGFuZ2UoKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPOiB3aHkgaXMgbG9jYWwgYm91bmRzIGludmFsaWRhdGlvbiBuZWVkZWQgaGVyZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG5cclxuICAgIHRoaXMuX3BpY2tlci5vblRyYW5zZm9ybUNoYW5nZSgpO1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG5cclxuICAgIHRoaXMudHJhbnNmb3JtRW1pdHRlci5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBvdXIgc3VtbWFyeSBiaXRtYXNrIGNoYW5nZXMgKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG9uU3VtbWFyeUNoYW5nZSggb2xkQml0bWFzazogbnVtYmVyLCBuZXdCaXRtYXNrOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICAvLyBEZWZpbmVkIGluIFBhcmFsbGVsRE9NLmpzXHJcbiAgICB0aGlzLl9wZG9tRGlzcGxheXNJbmZvLm9uU3VtbWFyeUNoYW5nZSggb2xkQml0bWFzaywgbmV3Qml0bWFzayApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyBvdXIgbm9kZSdzIHNjYWxlIGFuZCBhcHBsaWVkIHNjYWxlIGZhY3RvciBpZiB3ZSBuZWVkIHRvIGNoYW5nZSBvdXIgc2NhbGUgdG8gZml0IHdpdGhpbiB0aGUgbWF4aW11bVxyXG4gICAqIGRpbWVuc2lvbnMgKG1heFdpZHRoIGFuZCBtYXhIZWlnaHQpLiBTZWUgZG9jdW1lbnRhdGlvbiBpbiBjb25zdHJ1Y3RvciBmb3IgZGV0YWlsZWQgYmVoYXZpb3IuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVNYXhEaW1lbnNpb24oIGxvY2FsQm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuYXVkaXRNYXhEaW1lbnNpb25zKCk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudFNjYWxlID0gdGhpcy5fYXBwbGllZFNjYWxlRmFjdG9yO1xyXG4gICAgbGV0IGlkZWFsU2NhbGUgPSAxO1xyXG5cclxuICAgIGlmICggdGhpcy5fbWF4V2lkdGggIT09IG51bGwgKSB7XHJcbiAgICAgIGNvbnN0IHdpZHRoID0gbG9jYWxCb3VuZHMud2lkdGg7XHJcbiAgICAgIGlmICggd2lkdGggPiB0aGlzLl9tYXhXaWR0aCApIHtcclxuICAgICAgICBpZGVhbFNjYWxlID0gTWF0aC5taW4oIGlkZWFsU2NhbGUsIHRoaXMuX21heFdpZHRoIC8gd2lkdGggKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5fbWF4SGVpZ2h0ICE9PSBudWxsICkge1xyXG4gICAgICBjb25zdCBoZWlnaHQgPSBsb2NhbEJvdW5kcy5oZWlnaHQ7XHJcbiAgICAgIGlmICggaGVpZ2h0ID4gdGhpcy5fbWF4SGVpZ2h0ICkge1xyXG4gICAgICAgIGlkZWFsU2NhbGUgPSBNYXRoLm1pbiggaWRlYWxTY2FsZSwgdGhpcy5fbWF4SGVpZ2h0IC8gaGVpZ2h0ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzY2FsZUFkanVzdG1lbnQgPSBpZGVhbFNjYWxlIC8gY3VycmVudFNjYWxlO1xyXG4gICAgaWYgKCBzY2FsZUFkanVzdG1lbnQgIT09IDEgKSB7XHJcbiAgICAgIC8vIFNldCB0aGlzIGZpcnN0LCBmb3Igc3VwcG9ydGluZyByZS1lbnRyYW5jeSBpZiBvdXIgY29udGVudCBjaGFuZ2VzIGJhc2VkIG9uIHRoZSBzY2FsZVxyXG4gICAgICB0aGlzLl9hcHBsaWVkU2NhbGVGYWN0b3IgPSBpZGVhbFNjYWxlO1xyXG5cclxuICAgICAgdGhpcy5zY2FsZSggc2NhbGVBZGp1c3RtZW50ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTY2VuZXJ5LWludGVybmFsIG1ldGhvZCBmb3IgdmVyaWZ5aW5nIG1heGltdW0gZGltZW5zaW9ucyBhcmUgTk9UIHNtYWxsZXIgdGhhbiBwcmVmZXJyZWQgZGltZW5zaW9uc1xyXG4gICAqIE5PVEU6IFRoaXMgaGFzIHRvIGJlIHB1YmxpYyBkdWUgdG8gbWl4aW5zIG5vdCBhYmxlIHRvIGFjY2VzcyBwcm90ZWN0ZWQvcHJpdmF0ZSBtZXRob2RzXHJcbiAgICovXHJcbiAgcHVibGljIGF1ZGl0TWF4RGltZW5zaW9ucygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX21heFdpZHRoID09PSBudWxsIHx8ICFpc1dpZHRoU2l6YWJsZSggdGhpcyApIHx8IHRoaXMucHJlZmVycmVkV2lkdGggPT09IG51bGwgfHwgdGhpcy5fbWF4V2lkdGggPj0gdGhpcy5wcmVmZXJyZWRXaWR0aCAtIDFlLTcsXHJcbiAgICAgICdJZiBtYXhXaWR0aCBhbmQgcHJlZmVycmVkV2lkdGggYXJlIGJvdGggbm9uLW51bGwsIG1heFdpZHRoIHNob3VsZCBOT1QgYmUgc21hbGxlciB0aGFuIHRoZSBwcmVmZXJyZWRXaWR0aC4gSWYgdGhhdCBoYXBwZW5zLCBpdCB3b3VsZCB0cmlnZ2VyIGFuIGluZmluaXRlIGxvb3AnICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbWF4SGVpZ2h0ID09PSBudWxsIHx8ICFpc0hlaWdodFNpemFibGUoIHRoaXMgKSB8fCB0aGlzLnByZWZlcnJlZEhlaWdodCA9PT0gbnVsbCB8fCB0aGlzLl9tYXhIZWlnaHQgPj0gdGhpcy5wcmVmZXJyZWRIZWlnaHQgLSAxZS03LFxyXG4gICAgICAnSWYgbWF4SGVpZ2h0IGFuZCBwcmVmZXJyZWRIZWlnaHQgYXJlIGJvdGggbm9uLW51bGwsIG1heEhlaWdodCBzaG91bGQgTk9UIGJlIHNtYWxsZXIgdGhhbiB0aGUgcHJlZmVycmVkSGVpZ2h0LiBJZiB0aGF0IGhhcHBlbnMsIGl0IHdvdWxkIHRyaWdnZXIgYW4gaW5maW5pdGUgbG9vcCcgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluY3JlbWVudHMvZGVjcmVtZW50cyBib3VuZHMgXCJsaXN0ZW5lclwiIGNvdW50IGJhc2VkIG9uIHRoZSB2YWx1ZXMgb2YgbWF4V2lkdGgvbWF4SGVpZ2h0IGJlZm9yZSBhbmQgYWZ0ZXIuXHJcbiAgICogbnVsbCBpcyBsaWtlIG5vIGxpc3RlbmVyLCBub24tbnVsbCBpcyBsaWtlIGhhdmluZyBhIGxpc3RlbmVyLCBzbyB3ZSBpbmNyZW1lbnQgZm9yIG51bGwgPT4gbm9uLW51bGwsIGFuZFxyXG4gICAqIGRlY3JlbWVudCBmb3Igbm9uLW51bGwgPT4gbnVsbC5cclxuICAgKi9cclxuICBwcml2YXRlIG9uTWF4RGltZW5zaW9uQ2hhbmdlKCBiZWZvcmVNYXhMZW5ndGg6IG51bWJlciB8IG51bGwsIGFmdGVyTWF4TGVuZ3RoOiBudW1iZXIgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCBiZWZvcmVNYXhMZW5ndGggPT09IG51bGwgJiYgYWZ0ZXJNYXhMZW5ndGggIT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuY2hhbmdlQm91bmRzRXZlbnRDb3VudCggMSApO1xyXG4gICAgICB0aGlzLl9ib3VuZHNFdmVudFNlbGZDb3VudCsrO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGJlZm9yZU1heExlbmd0aCAhPT0gbnVsbCAmJiBhZnRlck1heExlbmd0aCA9PT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5jaGFuZ2VCb3VuZHNFdmVudENvdW50KCAtMSApO1xyXG4gICAgICB0aGlzLl9ib3VuZHNFdmVudFNlbGZDb3VudC0tO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWF4aW11bSB3aWR0aCBvZiB0aGUgTm9kZSAoc2VlIGNvbnN0cnVjdG9yIGZvciBkb2N1bWVudGF0aW9uIG9uIGhvdyBtYXhpbXVtIGRpbWVuc2lvbnMgd29yaykuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1heFdpZHRoKCBtYXhXaWR0aDogbnVtYmVyIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1heFdpZHRoID09PSBudWxsIHx8ICggdHlwZW9mIG1heFdpZHRoID09PSAnbnVtYmVyJyAmJiBtYXhXaWR0aCA+IDAgKSxcclxuICAgICAgJ21heFdpZHRoIHNob3VsZCBiZSBudWxsIChubyBjb25zdHJhaW50KSBvciBhIHBvc2l0aXZlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX21heFdpZHRoICE9PSBtYXhXaWR0aCApIHtcclxuICAgICAgLy8gdXBkYXRlIHN5bnRoZXRpYyBib3VuZHMgbGlzdGVuZXIgY291bnQgKHRvIGVuc3VyZSBvdXIgYm91bmRzIGFyZSB2YWxpZGF0ZWQgYXQgdGhlIHN0YXJ0IG9mIHVwZGF0ZURpc3BsYXkpXHJcbiAgICAgIHRoaXMub25NYXhEaW1lbnNpb25DaGFuZ2UoIHRoaXMuX21heFdpZHRoLCBtYXhXaWR0aCApO1xyXG5cclxuICAgICAgdGhpcy5fbWF4V2lkdGggPSBtYXhXaWR0aDtcclxuXHJcbiAgICAgIHRoaXMudXBkYXRlTWF4RGltZW5zaW9uKCB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkudmFsdWUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRNYXhXaWR0aCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBtYXhXaWR0aCggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldE1heFdpZHRoKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldE1heFdpZHRoKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IG1heFdpZHRoKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWF4V2lkdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG1heGltdW0gd2lkdGggKGlmIGFueSkgb2YgdGhlIE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1heFdpZHRoKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX21heFdpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIE5vZGUgKHNlZSBjb25zdHJ1Y3RvciBmb3IgZG9jdW1lbnRhdGlvbiBvbiBob3cgbWF4aW11bSBkaW1lbnNpb25zIHdvcmspLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYXhIZWlnaHQoIG1heEhlaWdodDogbnVtYmVyIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1heEhlaWdodCA9PT0gbnVsbCB8fCAoIHR5cGVvZiBtYXhIZWlnaHQgPT09ICdudW1iZXInICYmIG1heEhlaWdodCA+IDAgKSxcclxuICAgICAgJ21heEhlaWdodCBzaG91bGQgYmUgbnVsbCAobm8gY29uc3RyYWludCkgb3IgYSBwb3NpdGl2ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9tYXhIZWlnaHQgIT09IG1heEhlaWdodCApIHtcclxuICAgICAgLy8gdXBkYXRlIHN5bnRoZXRpYyBib3VuZHMgbGlzdGVuZXIgY291bnQgKHRvIGVuc3VyZSBvdXIgYm91bmRzIGFyZSB2YWxpZGF0ZWQgYXQgdGhlIHN0YXJ0IG9mIHVwZGF0ZURpc3BsYXkpXHJcbiAgICAgIHRoaXMub25NYXhEaW1lbnNpb25DaGFuZ2UoIHRoaXMuX21heEhlaWdodCwgbWF4SGVpZ2h0ICk7XHJcblxyXG4gICAgICB0aGlzLl9tYXhIZWlnaHQgPSBtYXhIZWlnaHQ7XHJcblxyXG4gICAgICB0aGlzLnVwZGF0ZU1heERpbWVuc2lvbiggdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5LnZhbHVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TWF4SGVpZ2h0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IG1heEhlaWdodCggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldE1heEhlaWdodCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRNYXhIZWlnaHQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbWF4SGVpZ2h0KCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWF4SGVpZ2h0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBtYXhpbXVtIGhlaWdodCAoaWYgYW55KSBvZiB0aGUgTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF4SGVpZ2h0KCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX21heEhlaWdodDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGlzIE5vZGUgaG9yaXpvbnRhbGx5IHNvIHRoYXQgaXRzIGxlZnQgYm91bmQgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgaXMgZXF1YWwgdG8gdGhlIHBhc3NlZC1pblxyXG4gICAqICdsZWZ0JyBYIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBsZWZ0IC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUubGVmdCBzaG91bGQgYXBwcm94aW1hdGVseSBlcXVhbCB0aGlzIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMZWZ0KCBsZWZ0OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50TGVmdCA9IHRoaXMuZ2V0TGVmdCgpO1xyXG4gICAgaWYgKCBpc0Zpbml0ZSggY3VycmVudExlZnQgKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGxlZnQgLSBjdXJyZW50TGVmdCwgMCwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldExlZnQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbGVmdCggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0TGVmdCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMZWZ0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxlZnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExlZnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFggdmFsdWUgb2YgdGhlIGxlZnQgc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94IG9mIHRoaXMgTm9kZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlZnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLm1pblg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaGlmdHMgdGhpcyBOb2RlIGhvcml6b250YWxseSBzbyB0aGF0IGl0cyByaWdodCBib3VuZCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBpcyBlcXVhbCB0byB0aGUgcGFzc2VkLWluXHJcbiAgICogJ3JpZ2h0JyBYIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByaWdodCAtIEFmdGVyIHRoaXMgb3BlcmF0aW9uLCBub2RlLnJpZ2h0IHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJpZ2h0KCByaWdodDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgY29uc3QgY3VycmVudFJpZ2h0ID0gdGhpcy5nZXRSaWdodCgpO1xyXG4gICAgaWYgKCBpc0Zpbml0ZSggY3VycmVudFJpZ2h0ICkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCByaWdodCAtIGN1cnJlbnRSaWdodCwgMCwgdHJ1ZSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UmlnaHQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHQoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLnNldFJpZ2h0KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJpZ2h0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRSaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94IG9mIHRoaXMgTm9kZSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5tYXhYO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoaXMgTm9kZSBob3Jpem9udGFsbHkgc28gdGhhdCBpdHMgaG9yaXpvbnRhbCBjZW50ZXIgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgaXMgZXF1YWwgdG8gdGhlXHJcbiAgICogcGFzc2VkLWluIGNlbnRlciBYIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUuY2VudGVyWCBzaG91bGQgYXBwcm94aW1hdGVseSBlcXVhbCB0aGlzIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDZW50ZXJYKCB4OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50Q2VudGVyWCA9IHRoaXMuZ2V0Q2VudGVyWCgpO1xyXG4gICAgaWYgKCBpc0Zpbml0ZSggY3VycmVudENlbnRlclggKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIHggLSBjdXJyZW50Q2VudGVyWCwgMCwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENlbnRlclgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY2VudGVyWCggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0Q2VudGVyWCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDZW50ZXJYKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENlbnRlclgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFggdmFsdWUgb2YgdGhpcyBub2RlJ3MgaG9yaXpvbnRhbCBjZW50ZXIgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSlcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlclgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldENlbnRlclgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGlzIE5vZGUgdmVydGljYWxseSBzbyB0aGF0IGl0cyB2ZXJ0aWNhbCBjZW50ZXIgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgaXMgZXF1YWwgdG8gdGhlXHJcbiAgICogcGFzc2VkLWluIGNlbnRlciBZIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB5IC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUuY2VudGVyWSBzaG91bGQgYXBwcm94aW1hdGVseSBlcXVhbCB0aGlzIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDZW50ZXJZKCB5OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50Q2VudGVyWSA9IHRoaXMuZ2V0Q2VudGVyWSgpO1xyXG4gICAgaWYgKCBpc0Zpbml0ZSggY3VycmVudENlbnRlclkgKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIDAsIHkgLSBjdXJyZW50Q2VudGVyWSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENlbnRlclkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY2VudGVyWSggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0Q2VudGVyWSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDZW50ZXJYKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENlbnRlclkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgdmVydGljYWwgY2VudGVyIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXJZKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRDZW50ZXJZKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaGlmdHMgdGhpcyBOb2RlIHZlcnRpY2FsbHkgc28gdGhhdCBpdHMgdG9wIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQtaW4gWSB2YWx1ZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IHRvcCBpcyB0aGUgbG93ZXN0IFkgdmFsdWUgaW4gb3VyIGJvdW5kcy5cclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRvcCAtIEFmdGVyIHRoaXMgb3BlcmF0aW9uLCBub2RlLnRvcCBzaG91bGQgYXBwcm94aW1hdGVseSBlcXVhbCB0aGlzIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb3AoIHRvcDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgY29uc3QgY3VycmVudFRvcCA9IHRoaXMuZ2V0VG9wKCk7XHJcbiAgICBpZiAoIGlzRmluaXRlKCBjdXJyZW50VG9wICkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCAwLCB0b3AgLSBjdXJyZW50VG9wLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHRvcCggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0VG9wKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB0b3AoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbG93ZXN0IFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VG9wKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5taW5ZO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoaXMgTm9kZSB2ZXJ0aWNhbGx5IHNvIHRoYXQgaXRzIGJvdHRvbSAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBpcyBlcXVhbCB0byB0aGUgcGFzc2VkLWluIFkgdmFsdWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBib3R0b20gaXMgdGhlIGhpZ2hlc3QgWSB2YWx1ZSBpbiBvdXIgYm91bmRzLlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm90dG9tIC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUuYm90dG9tIHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEJvdHRvbSggYm90dG9tOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50Qm90dG9tID0gdGhpcy5nZXRCb3R0b20oKTtcclxuICAgIGlmICggaXNGaW5pdGUoIGN1cnJlbnRCb3R0b20gKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIDAsIGJvdHRvbSAtIGN1cnJlbnRCb3R0b20sIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgYm90dG9tKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRCb3R0b20oIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGJvdHRvbSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBoaWdoZXN0IFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm90dG9tKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5tYXhZO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBDb252ZW5pZW5jZSBsb2NhdGlvbnNcclxuICAgKlxyXG4gICAqIFVwcGVyIGlzIGluIHRlcm1zIG9mIHRoZSB2aXN1YWwgbGF5b3V0IGluIFNjZW5lcnkgYW5kIG90aGVyIHByb2dyYW1zLCBzbyB0aGUgbWluWSBpcyB0aGUgXCJ1cHBlclwiLCBhbmQgbWluWSBpcyB0aGUgXCJsb3dlclwiXHJcbiAgICpcclxuICAgKiAgICAgICAgICAgICBsZWZ0ICh4KSAgICAgY2VudGVyWCAgICAgICAgcmlnaHRcclxuICAgKiAgICAgICAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKiB0b3AgICh5KSB8IGxlZnRUb3AgICAgIGNlbnRlclRvcCAgICAgcmlnaHRUb3BcclxuICAgKiBjZW50ZXJZICB8IGxlZnRDZW50ZXIgIGNlbnRlciAgICAgICAgcmlnaHRDZW50ZXJcclxuICAgKiBib3R0b20gICB8IGxlZnRCb3R0b20gIGNlbnRlckJvdHRvbSAgcmlnaHRCb3R0b21cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgcmVxdWlyZXMgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSB1cHBlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGVmdFRvcCggbGVmdFRvcDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxlZnRUb3AuaXNGaW5pdGUoKSwgJ2xlZnRUb3Agc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudExlZnRUb3AgPSB0aGlzLmdldExlZnRUb3AoKTtcclxuICAgIGlmICggY3VycmVudExlZnRUb3AuaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGxlZnRUb3AubWludXMoIGN1cnJlbnRMZWZ0VG9wICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRMZWZ0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRUb3AoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRMZWZ0VG9wKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExlZnRUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExlZnRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVwcGVyLWxlZnQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldExlZnRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZW50ZXItdG9wIGxvY2F0aW9uIG9mIHRoaXMgbm9kZSdzIGJvdW5kcyB0byB0aGUgc3BlY2lmaWVkIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDZW50ZXJUb3AoIGNlbnRlclRvcDogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNlbnRlclRvcC5pc0Zpbml0ZSgpLCAnY2VudGVyVG9wIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRDZW50ZXJUb3AgPSB0aGlzLmdldENlbnRlclRvcCgpO1xyXG4gICAgaWYgKCBjdXJyZW50Q2VudGVyVG9wLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCBjZW50ZXJUb3AubWludXMoIGN1cnJlbnRDZW50ZXJUb3AgKSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENlbnRlclRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJUb3AoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRDZW50ZXJUb3AoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Q2VudGVyVG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENlbnRlclRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLXRvcCBsb2NhdGlvbiBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlclRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldENlbnRlclRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIHVwcGVyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmlnaHRUb3AoIHJpZ2h0VG9wOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmlnaHRUb3AuaXNGaW5pdGUoKSwgJ3JpZ2h0VG9wIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRSaWdodFRvcCA9IHRoaXMuZ2V0UmlnaHRUb3AoKTtcclxuICAgIGlmICggY3VycmVudFJpZ2h0VG9wLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCByaWdodFRvcC5taW51cyggY3VycmVudFJpZ2h0VG9wICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSaWdodFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByaWdodFRvcCggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldFJpZ2h0VG9wKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJpZ2h0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJpZ2h0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmlnaHRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVwcGVyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0UmlnaHRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZW50ZXItbGVmdCBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGVmdENlbnRlciggbGVmdENlbnRlcjogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxlZnRDZW50ZXIuaXNGaW5pdGUoKSwgJ2xlZnRDZW50ZXIgc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudExlZnRDZW50ZXIgPSB0aGlzLmdldExlZnRDZW50ZXIoKTtcclxuICAgIGlmICggY3VycmVudExlZnRDZW50ZXIuaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGxlZnRDZW50ZXIubWludXMoIGN1cnJlbnRMZWZ0Q2VudGVyICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRMZWZ0Q2VudGVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRDZW50ZXIoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRMZWZ0Q2VudGVyKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExlZnRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExlZnRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlZnRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRMZWZ0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjZW50ZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzIHRvIHRoZSBzcGVjaWZpZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENlbnRlciggY2VudGVyOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY2VudGVyLmlzRmluaXRlKCksICdjZW50ZXIgc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudENlbnRlciA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgICBpZiAoIGN1cnJlbnRDZW50ZXIuaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGNlbnRlci5taW51cyggY3VycmVudENlbnRlciApLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q2VudGVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNlbnRlciggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldENlbnRlciggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZW50ZXItcmlnaHQgb2YgdGhpcyBub2RlJ3MgYm91bmRzIHRvIHRoZSBzcGVjaWZpZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJpZ2h0Q2VudGVyKCByaWdodENlbnRlcjogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJpZ2h0Q2VudGVyLmlzRmluaXRlKCksICdyaWdodENlbnRlciBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50UmlnaHRDZW50ZXIgPSB0aGlzLmdldFJpZ2h0Q2VudGVyKCk7XHJcbiAgICBpZiAoIGN1cnJlbnRSaWdodENlbnRlci5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggcmlnaHRDZW50ZXIubWludXMoIGN1cnJlbnRSaWdodENlbnRlciApLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UmlnaHRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHRDZW50ZXIoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRSaWdodENlbnRlciggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRSaWdodENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByaWdodENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJpZ2h0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXItcmlnaHQgb2YgdGhpcyBub2RlJ3MgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSaWdodENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldFJpZ2h0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgbG93ZXItbGVmdCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzIHRvIHRoZSBzcGVjaWZpZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldExlZnRCb3R0b20oIGxlZnRCb3R0b206IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsZWZ0Qm90dG9tLmlzRmluaXRlKCksICdsZWZ0Qm90dG9tIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRMZWZ0Qm90dG9tID0gdGhpcy5nZXRMZWZ0Qm90dG9tKCk7XHJcbiAgICBpZiAoIGN1cnJlbnRMZWZ0Qm90dG9tLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCBsZWZ0Qm90dG9tLm1pbnVzKCBjdXJyZW50TGVmdEJvdHRvbSApLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TGVmdEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBsZWZ0Qm90dG9tKCB2YWx1ZTogVmVjdG9yMiApIHtcclxuICAgIHRoaXMuc2V0TGVmdEJvdHRvbSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMZWZ0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxlZnRCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMZWZ0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsb3dlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlZnRCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRMZWZ0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VudGVyLWJvdHRvbSBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q2VudGVyQm90dG9tKCBjZW50ZXJCb3R0b206IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjZW50ZXJCb3R0b20uaXNGaW5pdGUoKSwgJ2NlbnRlckJvdHRvbSBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50Q2VudGVyQm90dG9tID0gdGhpcy5nZXRDZW50ZXJCb3R0b20oKTtcclxuICAgIGlmICggY3VycmVudENlbnRlckJvdHRvbS5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggY2VudGVyQm90dG9tLm1pbnVzKCBjdXJyZW50Q2VudGVyQm90dG9tICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRDZW50ZXJCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY2VudGVyQm90dG9tKCB2YWx1ZTogVmVjdG9yMiApIHtcclxuICAgIHRoaXMuc2V0Q2VudGVyQm90dG9tKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlckJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjZW50ZXJCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDZW50ZXJCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci1ib3R0b20gb2YgdGhpcyBub2RlJ3MgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDZW50ZXJCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRDZW50ZXJCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBsb3dlci1yaWdodCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzIHRvIHRoZSBzcGVjaWZpZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJpZ2h0Qm90dG9tKCByaWdodEJvdHRvbTogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJpZ2h0Qm90dG9tLmlzRmluaXRlKCksICdyaWdodEJvdHRvbSBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50UmlnaHRCb3R0b20gPSB0aGlzLmdldFJpZ2h0Qm90dG9tKCk7XHJcbiAgICBpZiAoIGN1cnJlbnRSaWdodEJvdHRvbS5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggcmlnaHRCb3R0b20ubWludXMoIGN1cnJlbnRSaWdodEJvdHRvbSApLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UmlnaHRCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHRCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRSaWdodEJvdHRvbSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRSaWdodEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByaWdodEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJpZ2h0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsb3dlci1yaWdodCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSaWdodEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldFJpZ2h0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRXaWR0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0V2lkdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRXaWR0aCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB3aWR0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRIZWlnaHQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldEhlaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEhlaWdodCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEhlaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgd2lkdGggb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbFdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldFdpZHRoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxXaWR0aCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbFdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbFdpZHRoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRIZWlnaHQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbEhlaWdodCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxIZWlnaHQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFggdmFsdWUgb2YgdGhlIGxlZnQgc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94IG9mIHRoaXMgTm9kZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxMZWZ0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLm1pblg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TGVmdCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbExlZnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsTGVmdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94IG9mIHRoaXMgTm9kZSAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxSaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5tYXhYO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJpZ2h0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsUmlnaHQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsUmlnaHQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFggdmFsdWUgb2YgdGhpcyBub2RlJ3MgaG9yaXpvbnRhbCBjZW50ZXIgKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKVxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxDZW50ZXJYKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldENlbnRlclgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDZW50ZXJYKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQ2VudGVyWCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxDZW50ZXJYKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBZIHZhbHVlIG9mIHRoaXMgbm9kZSdzIHZlcnRpY2FsIGNlbnRlciAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbENlbnRlclkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0Q2VudGVyWSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlclgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxDZW50ZXJZKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbENlbnRlclkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvd2VzdCBZIHZhbHVlIG9mIHRoaXMgbm9kZSdzIGJvdW5kaW5nIGJveCAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxUb3AoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkubWluWTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxUb3AoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsVG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBoaWdoZXN0IFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbEJvdHRvbSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5tYXhZO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsQm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQm90dG9tKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXBwZXItbGVmdCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsTGVmdFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0TGVmdFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsTGVmdFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbExlZnRUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbExlZnRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci10b3AgbG9jYXRpb24gb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQ2VudGVyVG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRDZW50ZXJUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbENlbnRlclRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbENlbnRlclRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQ2VudGVyVG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB1cHBlci1yaWdodCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsUmlnaHRUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldFJpZ2h0VG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxSaWdodFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbFJpZ2h0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxSaWdodFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLWxlZnQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGxvY2FsQm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbExlZnRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldExlZnRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbExlZnRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxMZWZ0Q2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxMZWZ0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQ2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQ2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXItcmlnaHQgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsUmlnaHRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldFJpZ2h0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxSaWdodENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbFJpZ2h0Q2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxSaWdodENlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbG93ZXItbGVmdCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsTGVmdEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0TGVmdEJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsTGVmdEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbExlZnRCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbExlZnRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci1ib3R0b20gb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQ2VudGVyQm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRDZW50ZXJCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbENlbnRlckJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbENlbnRlckJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQ2VudGVyQm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsb3dlci1yaWdodCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsUmlnaHRCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldFJpZ2h0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxSaWdodEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbFJpZ2h0Qm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxSaWdodEJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdW5pcXVlIGludGVncmFsIElEIGZvciB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldElkKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5faWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0SWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgaWQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldElkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBvdXIgdmlzaWJpbGl0eSBQcm9wZXJ0eSBjaGFuZ2VzIHZhbHVlcy5cclxuICAgKi9cclxuICBwcml2YXRlIG9uVmlzaWJsZVByb3BlcnR5Q2hhbmdlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG5cclxuICAgIC8vIGNoYW5naW5nIHZpc2liaWxpdHkgY2FuIGFmZmVjdCBwaWNrYWJpbGl0eSBwcnVuaW5nLCB3aGljaCBhZmZlY3RzIG1vdXNlL3RvdWNoIGJvdW5kc1xyXG4gICAgdGhpcy5fcGlja2VyLm9uVmlzaWJpbGl0eUNoYW5nZSgpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuXHJcbiAgICAvLyBEZWZpbmVkIGluIFBhcmFsbGVsRE9NLmpzXHJcbiAgICB0aGlzLl9wZG9tRGlzcGxheXNJbmZvLm9uVmlzaWJpbGl0eUNoYW5nZSggdmlzaWJsZSApO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3BhcmVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX3BhcmVudHNbIGkgXTtcclxuICAgICAgaWYgKCBwYXJlbnQuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgKSB7XHJcbiAgICAgICAgcGFyZW50LmludmFsaWRhdGVDaGlsZEJvdW5kcygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgUHJvcGVydHkgb3VyIHZpc2libGVQcm9wZXJ0eSBpcyBiYWNrZWQgYnksIHNvIHRoYXQgY2hhbmdlcyB0byB0aGlzIHByb3ZpZGVkIFByb3BlcnR5IHdpbGwgY2hhbmdlIHRoaXNcclxuICAgKiBOb2RlJ3MgdmlzaWJpbGl0eSwgYW5kIHZpY2UgdmVyc2EuIFRoaXMgZG9lcyBub3QgY2hhbmdlIHRoaXMuX3Zpc2libGVQcm9wZXJ0eS4gU2VlIFRpbnlGb3J3YXJkaW5nUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoKVxyXG4gICAqIGZvciBtb3JlIGluZm8uXHJcbiAgICpcclxuICAgKiBOT1RFIEZvciBQaEVULWlPIHVzZTpcclxuICAgKiBBbGwgUGhFVC1pTyBpbnN0cnVtZW50ZWQgTm9kZXMgY3JlYXRlIHRoZWlyIG93biBpbnN0cnVtZW50ZWQgdmlzaWJsZVByb3BlcnR5IChpZiBvbmUgaXMgbm90IHBhc3NlZCBpbiBhc1xyXG4gICAqIGFuIG9wdGlvbikuIE9uY2UgYSBOb2RlJ3MgdmlzaWJsZVByb3BlcnR5IGhhcyBiZWVuIHJlZ2lzdGVyZWQgd2l0aCBQaEVULWlPLCBpdCBjYW5ub3QgYmUgXCJzd2FwcGVkIG91dFwiIGZvciBhbm90aGVyLlxyXG4gICAqIElmIHlvdSBuZWVkIHRvIFwiZGVsYXlcIiBzZXR0aW5nIGFuIGluc3RydW1lbnRlZCB2aXNpYmxlUHJvcGVydHkgdG8gdGhpcyBub2RlLCBwYXNzIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZFxyXG4gICAqIHRvIGluc3RydW1lbnRhdGlvbiBjYWxsIHRvIHRoaXMgTm9kZSAod2hlcmUgVGFuZGVtIGlzIHByb3ZpZGVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VmlzaWJsZVByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl92aXNpYmxlUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCwgdGhpcywgVklTSUJMRV9QUk9QRVJUWV9UQU5ERU1fTkFNRSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFZpc2libGVQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB2aXNpYmxlUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldFZpc2libGVQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRWaXNpYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdmlzaWJsZVByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRWaXNpYmxlUHJvcGVydHkoKTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhpcyBOb2RlJ3MgdmlzaWJsZVByb3BlcnR5LiBOb3RlISBUaGlzIGlzIG5vdCB0aGUgcmVjaXByb2NhbCBvZiBzZXRWaXNpYmxlUHJvcGVydHkuIE5vZGUucHJvdG90eXBlLl92aXNpYmxlUHJvcGVydHlcclxuICAgKiBpcyBhIFRpbnlGb3J3YXJkaW5nUHJvcGVydHksIGFuZCBpcyBzZXQgdXAgdG8gbGlzdGVuIHRvIGNoYW5nZXMgZnJvbSB0aGUgdmlzaWJsZVByb3BlcnR5IHByb3ZpZGVkIGJ5XHJcbiAgICogc2V0VmlzaWJsZVByb3BlcnR5KCksIGJ1dCB0aGUgdW5kZXJseWluZyByZWZlcmVuY2UgZG9lcyBub3QgY2hhbmdlLiBUaGlzIG1lYW5zIHRoZSBmb2xsb3dpbmc6XHJcbiAgICogICAgICogY29uc3QgbXlOb2RlID0gbmV3IE5vZGUoKTtcclxuICAgKiBjb25zdCB2aXNpYmxlUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIGZhbHNlICk7XHJcbiAgICogbXlOb2RlLnNldFZpc2libGVQcm9wZXJ0eSggdmlzaWJsZVByb3BlcnR5IClcclxuICAgKiA9PiBteU5vZGUuZ2V0VmlzaWJsZVByb3BlcnR5KCkgIT09IHZpc2libGVQcm9wZXJ0eSAoISEhISEhKVxyXG4gICAqXHJcbiAgICogUGxlYXNlIHVzZSB0aGlzIHdpdGggY2F1dGlvbi4gU2VlIHNldFZpc2libGVQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRWaXNpYmxlUHJvcGVydHkoKTogVFByb3BlcnR5PGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLl92aXNpYmxlUHJvcGVydHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgdGhpcyBOb2RlIGlzIHZpc2libGUuICBETyBOT1Qgb3ZlcnJpZGUgdGhpcyBhcyBhIHdheSBvZiBhZGRpbmcgYWRkaXRpb25hbCBiZWhhdmlvciB3aGVuIGEgTm9kZSdzXHJcbiAgICogdmlzaWJpbGl0eSBjaGFuZ2VzLCBhZGQgYSBsaXN0ZW5lciB0byB0aGlzLnZpc2libGVQcm9wZXJ0eSBpbnN0ZWFkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgdGhpcy52aXNpYmxlUHJvcGVydHkuc2V0KCB2aXNpYmxlICk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRWaXNpYmxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHZpc2libGUoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRWaXNpYmxlKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzVmlzaWJsZSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB2aXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNWaXNpYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBOb2RlIGlzIHZpc2libGUuXHJcbiAgICovXHJcbiAgcHVibGljIGlzVmlzaWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnZpc2libGVQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZSB0aGlzIHRvIGF1dG9tYXRpY2FsbHkgY3JlYXRlIGEgZm9yd2FyZGVkLCBQaEVULWlPIGluc3RydW1lbnRlZCB2aXNpYmxlUHJvcGVydHkgaW50ZXJuYWwgdG8gTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkKCBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5fdmlzaWJsZVByb3BlcnR5LnNldFRhcmdldFByb3BlcnR5SW5zdHJ1bWVudGVkKCBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0UGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fdmlzaWJsZVByb3BlcnR5LmdldFRhcmdldFByb3BlcnR5SW5zdHJ1bWVudGVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTd2FwIHRoZSB2aXNpYmlsaXR5IG9mIHRoaXMgbm9kZSB3aXRoIGFub3RoZXIgbm9kZS4gVGhlIE5vZGUgdGhhdCBpcyBtYWRlIHZpc2libGUgd2lsbCByZWNlaXZlIGtleWJvYXJkIGZvY3VzXHJcbiAgICogaWYgaXQgaXMgZm9jdXNhYmxlIGFuZCB0aGUgcHJldmlvdXNseSB2aXNpYmxlIE5vZGUgaGFkIGZvY3VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzd2FwVmlzaWJpbGl0eSggb3RoZXJOb2RlOiBOb2RlICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy52aXNpYmxlICE9PSBvdGhlck5vZGUudmlzaWJsZSApO1xyXG5cclxuICAgIGNvbnN0IHZpc2libGVOb2RlID0gdGhpcy52aXNpYmxlID8gdGhpcyA6IG90aGVyTm9kZTtcclxuICAgIGNvbnN0IGludmlzaWJsZU5vZGUgPSB0aGlzLnZpc2libGUgPyBvdGhlck5vZGUgOiB0aGlzO1xyXG5cclxuICAgIC8vIGlmIHRoZSB2aXNpYmxlIG5vZGUgaGFzIGZvY3VzIHdlIHdpbGwgcmVzdG9yZSBmb2N1cyBvbiB0aGUgaW52aXNpYmxlIE5vZGUgb25jZSBpdCBpcyB2aXNpYmxlXHJcbiAgICBjb25zdCB2aXNpYmxlTm9kZUZvY3VzZWQgPSB2aXNpYmxlTm9kZS5mb2N1c2VkO1xyXG5cclxuICAgIHZpc2libGVOb2RlLnZpc2libGUgPSBmYWxzZTtcclxuICAgIGludmlzaWJsZU5vZGUudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgaWYgKCB2aXNpYmxlTm9kZUZvY3VzZWQgJiYgaW52aXNpYmxlTm9kZS5mb2N1c2FibGUgKSB7XHJcbiAgICAgIGludmlzaWJsZU5vZGUuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG9wYWNpdHkgb2YgdGhpcyBOb2RlIChhbmQgaXRzIHN1Yi10cmVlKSwgd2hlcmUgMCBpcyBmdWxseSB0cmFuc3BhcmVudCwgYW5kIDEgaXMgZnVsbHkgb3BhcXVlLiAgVmFsdWVzXHJcbiAgICogb3V0c2lkZSBvZiB0aGF0IHJhbmdlIHRocm93IGFuIEVycm9yLlxyXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgb3BhY2l0eSBvdXQgb2YgcmFuZ2VcclxuICAgKi9cclxuICBwdWJsaWMgc2V0T3BhY2l0eSggb3BhY2l0eTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG9wYWNpdHkgKSwgJ29wYWNpdHkgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIG9wYWNpdHkgPCAwIHx8IG9wYWNpdHkgPiAxICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBvcGFjaXR5IG91dCBvZiByYW5nZTogJHtvcGFjaXR5fWAgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9wYWNpdHlQcm9wZXJ0eS52YWx1ZSA9IG9wYWNpdHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0T3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBvcGFjaXR5KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRPcGFjaXR5KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldE9wYWNpdHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgb3BhY2l0eSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0T3BhY2l0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb3BhY2l0eSBvZiB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE9wYWNpdHkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm9wYWNpdHlQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGRpc2FibGVkT3BhY2l0eSBvZiB0aGlzIE5vZGUgKGFuZCBpdHMgc3ViLXRyZWUpLCB3aGVyZSAwIGlzIGZ1bGx5IHRyYW5zcGFyZW50LCBhbmQgMSBpcyBmdWxseSBvcGFxdWUuXHJcbiAgICogVmFsdWVzIG91dHNpZGUgb2YgdGhhdCByYW5nZSB0aHJvdyBhbiBFcnJvci5cclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIGRpc2FibGVkT3BhY2l0eSBvdXQgb2YgcmFuZ2VcclxuICAgKi9cclxuICBwdWJsaWMgc2V0RGlzYWJsZWRPcGFjaXR5KCBkaXNhYmxlZE9wYWNpdHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBkaXNhYmxlZE9wYWNpdHkgKSwgJ2Rpc2FibGVkT3BhY2l0eSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggZGlzYWJsZWRPcGFjaXR5IDwgMCB8fCBkaXNhYmxlZE9wYWNpdHkgPiAxICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBkaXNhYmxlZE9wYWNpdHkgb3V0IG9mIHJhbmdlOiAke2Rpc2FibGVkT3BhY2l0eX1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eS52YWx1ZSA9IGRpc2FibGVkT3BhY2l0eTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXREaXNhYmxlZE9wYWNpdHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgZGlzYWJsZWRPcGFjaXR5KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXREaXNhYmxlZE9wYWNpdHkoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0RGlzYWJsZWRPcGFjaXR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGRpc2FibGVkT3BhY2l0eSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0RGlzYWJsZWRPcGFjaXR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBkaXNhYmxlZE9wYWNpdHkgb2YgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXREaXNhYmxlZE9wYWNpdHkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmRpc2FibGVkT3BhY2l0eVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb3BhY2l0eSBhY3R1YWxseSBhcHBsaWVkIHRvIHRoZSBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFZmZlY3RpdmVPcGFjaXR5KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5vcGFjaXR5UHJvcGVydHkudmFsdWUgKiAoIHRoaXMuZW5hYmxlZFByb3BlcnR5LnZhbHVlID8gMSA6IHRoaXMuZGlzYWJsZWRPcGFjaXR5UHJvcGVydHkudmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXREaXNhYmxlZE9wYWNpdHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZWZmZWN0aXZlT3BhY2l0eSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0RWZmZWN0aXZlT3BhY2l0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gb3VyIG9wYWNpdHkgb3Igb3RoZXIgZmlsdGVyIGNoYW5nZXMgdmFsdWVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvbk9wYWNpdHlQcm9wZXJ0eUNoYW5nZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZmlsdGVyQ2hhbmdlRW1pdHRlci5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBvdXIgb3BhY2l0eSBvciBvdGhlciBmaWx0ZXIgY2hhbmdlcyB2YWx1ZXNcclxuICAgKi9cclxuICBwcml2YXRlIG9uRGlzYWJsZWRPcGFjaXR5UHJvcGVydHlDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBpZiAoICF0aGlzLl9lbmFibGVkUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuZmlsdGVyQ2hhbmdlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBub24tb3BhY2l0eSBmaWx0ZXJzIGZvciB0aGlzIE5vZGUuXHJcbiAgICpcclxuICAgKiBUaGUgZGVmYXVsdCBpcyBhbiBlbXB0eSBhcnJheSAobm8gZmlsdGVycykuIEl0IHNob3VsZCBiZSBhbiBhcnJheSBvZiBGaWx0ZXIgb2JqZWN0cywgd2hpY2ggd2lsbCBiZSBlZmZlY3RpdmVseVxyXG4gICAqIGFwcGxpZWQgaW4tb3JkZXIgb24gdGhpcyBOb2RlIChhbmQgaXRzIHN1YnRyZWUpLCBhbmQgd2lsbCBiZSBhcHBsaWVkIEJFRk9SRSBvcGFjaXR5L2NsaXBwaW5nLlxyXG4gICAqXHJcbiAgICogTk9URTogU29tZSBmaWx0ZXJzIG1heSBkZWNyZWFzZSBwZXJmb3JtYW5jZSAoYW5kIHRoaXMgbWF5IGJlIHBsYXRmb3JtLXNwZWNpZmljKS4gUGxlYXNlIHJlYWQgZG9jdW1lbnRhdGlvbiBmb3IgZWFjaFxyXG4gICAqIGZpbHRlciBiZWZvcmUgdXNpbmcuXHJcbiAgICpcclxuICAgKiBUeXBpY2FsIGZpbHRlciB0eXBlcyB0byB1c2UgYXJlOlxyXG4gICAqIC0gQnJpZ2h0bmVzc1xyXG4gICAqIC0gQ29udHJhc3RcclxuICAgKiAtIERyb3BTaGFkb3cgKEVYUEVSSU1FTlRBTClcclxuICAgKiAtIEdhdXNzaWFuQmx1ciAoRVhQRVJJTUVOVEFMKVxyXG4gICAqIC0gR3JheXNjYWxlIChHcmF5c2NhbGUuRlVMTCBmb3IgdGhlIGZ1bGwgZWZmZWN0KVxyXG4gICAqIC0gSHVlUm90YXRlXHJcbiAgICogLSBJbnZlcnQgKEludmVydC5GVUxMIGZvciB0aGUgZnVsbCBlZmZlY3QpXHJcbiAgICogLSBTYXR1cmF0ZVxyXG4gICAqIC0gU2VwaWEgKFNlcGlhLkZVTEwgZm9yIHRoZSBmdWxsIGVmZmVjdClcclxuICAgKlxyXG4gICAqIEZpbHRlci5qcyBoYXMgbW9yZSBpbmZvcm1hdGlvbiBpbiBnZW5lcmFsIG9uIGZpbHRlcnMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZpbHRlcnMoIGZpbHRlcnM6IEZpbHRlcltdICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggZmlsdGVycyApLCAnZmlsdGVycyBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmV2ZXJ5KCBmaWx0ZXJzLCBmaWx0ZXIgPT4gZmlsdGVyIGluc3RhbmNlb2YgRmlsdGVyICksICdmaWx0ZXJzIHNob3VsZCBjb25zaXN0IG9mIEZpbHRlciBvYmplY3RzIG9ubHknICk7XHJcblxyXG4gICAgLy8gV2UgcmUtdXNlIHRoZSBzYW1lIGFycmF5IGludGVybmFsbHksIHNvIHdlIGRvbid0IHJlZmVyZW5jZSBhIHBvdGVudGlhbGx5LW11dGFibGUgYXJyYXkgZnJvbSBvdXRzaWRlLlxyXG4gICAgdGhpcy5fZmlsdGVycy5sZW5ndGggPSAwO1xyXG4gICAgdGhpcy5fZmlsdGVycy5wdXNoKCAuLi5maWx0ZXJzICk7XHJcblxyXG4gICAgdGhpcy5pbnZhbGlkYXRlSGludCgpO1xyXG4gICAgdGhpcy5maWx0ZXJDaGFuZ2VFbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRGaWx0ZXJzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGZpbHRlcnMoIHZhbHVlOiBGaWx0ZXJbXSApIHtcclxuICAgIHRoaXMuc2V0RmlsdGVycyggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRGaWx0ZXJzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGZpbHRlcnMoKTogRmlsdGVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0RmlsdGVycygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbm9uLW9wYWNpdHkgZmlsdGVycyBmb3IgdGhpcyBOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRGaWx0ZXJzKCk6IEZpbHRlcltdIHtcclxuICAgIHJldHVybiB0aGlzLl9maWx0ZXJzLnNsaWNlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgUHJvcGVydHkgb3VyIHBpY2thYmxlUHJvcGVydHkgaXMgYmFja2VkIGJ5LCBzbyB0aGF0IGNoYW5nZXMgdG8gdGhpcyBwcm92aWRlZCBQcm9wZXJ0eSB3aWxsIGNoYW5nZSB0aGlzXHJcbiAgICogTm9kZSdzIHBpY2thYmlsaXR5LCBhbmQgdmljZSB2ZXJzYS4gVGhpcyBkb2VzIG5vdCBjaGFuZ2UgdGhpcy5fcGlja2FibGVQcm9wZXJ0eS4gU2VlIFRpbnlGb3J3YXJkaW5nUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoKVxyXG4gICAqIGZvciBtb3JlIGluZm8uXHJcbiAgICpcclxuICAgKiBQaEVULWlPIEluc3RydW1lbnRlZCBOb2RlcyBkbyBub3QgYnkgZGVmYXVsdCBjcmVhdGUgdGhlaXIgb3duIGluc3RydW1lbnRlZCBwaWNrYWJsZVByb3BlcnR5LCBldmVuIHRob3VnaCBOb2RlLnZpc2libGVQcm9wZXJ0eSBkb2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaWNrYWJsZVByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4gfCBudWxsPiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGlja2FibGVQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSggbmV3VGFyZ2V0IGFzIFRQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4sIHRoaXMsIG51bGwgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRQaWNrYWJsZVByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHBpY2thYmxlUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4gfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRQaWNrYWJsZVByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFBpY2thYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcGlja2FibGVQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbiB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLmdldFBpY2thYmxlUHJvcGVydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGlzIE5vZGUncyBwaWNrYWJsZVByb3BlcnR5LiBOb3RlISBUaGlzIGlzIG5vdCB0aGUgcmVjaXByb2NhbCBvZiBzZXRQaWNrYWJsZVByb3BlcnR5LiBOb2RlLnByb3RvdHlwZS5fcGlja2FibGVQcm9wZXJ0eVxyXG4gICAqIGlzIGEgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSwgYW5kIGlzIHNldCB1cCB0byBsaXN0ZW4gdG8gY2hhbmdlcyBmcm9tIHRoZSBwaWNrYWJsZVByb3BlcnR5IHByb3ZpZGVkIGJ5XHJcbiAgICogc2V0UGlja2FibGVQcm9wZXJ0eSgpLCBidXQgdGhlIHVuZGVybHlpbmcgcmVmZXJlbmNlIGRvZXMgbm90IGNoYW5nZS4gVGhpcyBtZWFucyB0aGUgZm9sbG93aW5nOlxyXG4gICAqIGNvbnN0IG15Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgICogY29uc3QgcGlja2FibGVQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgKiBteU5vZGUuc2V0UGlja2FibGVQcm9wZXJ0eSggcGlja2FibGVQcm9wZXJ0eSApXHJcbiAgICogPT4gbXlOb2RlLmdldFBpY2thYmxlUHJvcGVydHkoKSAhPT0gcGlja2FibGVQcm9wZXJ0eSAoISEhISEhKVxyXG4gICAqXHJcbiAgICogUGxlYXNlIHVzZSB0aGlzIHdpdGggY2F1dGlvbi4gU2VlIHNldFBpY2thYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UGlja2FibGVQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbiB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLl9waWNrYWJsZVByb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIHRoaXMgTm9kZSAoYW5kIGl0cyBzdWJ0cmVlKSB3aWxsIGFsbG93IGhpdC10ZXN0aW5nIChhbmQgdGh1cyB1c2VyIGludGVyYWN0aW9uKSwgY29udHJvbGxpbmcgd2hhdFxyXG4gICAqIFRyYWlsIGlzIHJldHVybmVkIGZyb20gbm9kZS50cmFpbFVuZGVyUG9pbnQoKS5cclxuICAgKlxyXG4gICAqIFBpY2thYmxlIGNhbiB0YWtlIG9uZSBvZiB0aHJlZSB2YWx1ZXM6XHJcbiAgICogLSBudWxsOiAoZGVmYXVsdCkgcGFzcy10aHJvdWdoIGJlaGF2aW9yLiBIaXQtdGVzdGluZyB3aWxsIHBydW5lIHRoaXMgc3VidHJlZSBpZiB0aGVyZSBhcmUgbm9cclxuICAgKiAgICAgICAgIGFuY2VzdG9ycy9kZXNjZW5kYW50cyB3aXRoIGVpdGhlciBwaWNrYWJsZTogdHJ1ZSBzZXQgb3Igd2l0aCBhbnkgaW5wdXQgbGlzdGVuZXJzLlxyXG4gICAqIC0gZmFsc2U6IEhpdC10ZXN0aW5nIGlzIHBydW5lZCwgbm90aGluZyBpbiB0aGlzIG5vZGUgb3IgaXRzIHN1YnRyZWUgd2lsbCByZXNwb25kIHRvIGV2ZW50cyBvciBiZSBwaWNrZWQuXHJcbiAgICogLSB0cnVlOiBIaXQtdGVzdGluZyB3aWxsIG5vdCBiZSBwcnVuZWQgaW4gdGhpcyBzdWJ0cmVlLCBleGNlcHQgZm9yIHBpY2thYmxlOiBmYWxzZSBjYXNlcy5cclxuICAgKlxyXG4gICAqIEhpdCB0ZXN0aW5nIGlzIGFjY29tcGxpc2hlZCBtYWlubHkgd2l0aCBub2RlLnRyYWlsVW5kZXJQb2ludGVyKCkgYW5kIG5vZGUudHJhaWxVbmRlclBvaW50KCksIGZvbGxvd2luZyB0aGVcclxuICAgKiBhYm92ZSBydWxlcy4gTm9kZXMgdGhhdCBhcmUgbm90IHBpY2thYmxlIChwcnVuZWQpIHdpbGwgbm90IGhhdmUgaW5wdXQgZXZlbnRzIHRhcmdldGVkIHRvIHRoZW0uXHJcbiAgICpcclxuICAgKiBUaGUgZm9sbG93aW5nIHJ1bGVzIChhcHBsaWVkIGluIHRoZSBnaXZlbiBvcmRlcikgZGV0ZXJtaW5lIHdoZXRoZXIgYSBOb2RlIChyZWFsbHksIGEgVHJhaWwpIHdpbGwgcmVjZWl2ZSBpbnB1dCBldmVudHM6XHJcbiAgICogMS4gSWYgdGhlIG5vZGUgb3Igb25lIG9mIGl0cyBhbmNlc3RvcnMgaGFzIHBpY2thYmxlOiBmYWxzZSBPUiBpcyBpbnZpc2libGUsIHRoZSBOb2RlICp3aWxsIG5vdCogcmVjZWl2ZSBldmVudHNcclxuICAgKiAgICBvciBoaXQgdGVzdGluZy5cclxuICAgKiAyLiBJZiB0aGUgTm9kZSBvciBvbmUgb2YgaXRzIGFuY2VzdG9ycyBvciBkZXNjZW5kYW50cyBpcyBwaWNrYWJsZTogdHJ1ZSBPUiBoYXMgYW4gaW5wdXQgbGlzdGVuZXIgYXR0YWNoZWQsIGl0XHJcbiAgICogICAgKndpbGwqIHJlY2VpdmUgZXZlbnRzIG9yIGhpdCB0ZXN0aW5nLlxyXG4gICAqIDMuIE90aGVyd2lzZSwgaXQgKndpbGwgbm90KiByZWNlaXZlIGV2ZW50cyBvciBoaXQgdGVzdGluZy5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBzZW1pLXRyYW5zcGFyZW50IG92ZXJsYXlzIG9yIG90aGVyIHZpc3VhbCBlbGVtZW50cyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgYnV0IHNob3VsZCBub3RcclxuICAgKiBwcmV2ZW50IG9iamVjdHMgYmVsb3cgZnJvbSBiZWluZyBtYW5pcHVsYXRlZCBieSB1c2VyIGlucHV0LCBhbmQgdGhlIGRlZmF1bHQgbnVsbCB2YWx1ZSBpcyB1c2VkIHRvIGluY3JlYXNlXHJcbiAgICogcGVyZm9ybWFuY2UgYnkgaWdub3JpbmcgYXJlYXMgdGhhdCBkb24ndCBuZWVkIHVzZXIgaW5wdXQuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB5b3Ugd2FudCBzb21ldGhpbmcgdG8gYmUgcGlja2VkIFwibW91c2UgaXMgb3ZlciBpdFwiLCBidXQgYmxvY2sgaW5wdXQgZXZlbnRzIGV2ZW4gaWYgdGhlcmUgYXJlIGxpc3RlbmVycyxcclxuICAgKiAgICAgICB0aGVuIHBpY2thYmxlOmZhbHNlIGlzIG5vdCBhcHByb3ByaWF0ZSwgYW5kIGlucHV0RW5hYmxlZDpmYWxzZSBpcyBwcmVmZXJyZWQuXHJcbiAgICpcclxuICAgKiBGb3IgYSB2aXN1YWwgZXhhbXBsZSBvZiBob3cgcGlja2FiaWxpdHkgaW50ZXJhY3RzIHdpdGggaW5wdXQgbGlzdGVuZXJzIGFuZCB2aXNpYmlsaXR5LCBzZWUgdGhlIG5vdGVzIGF0IHRoZVxyXG4gICAqIGJvdHRvbSBvZiBodHRwOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2ltcGxlbWVudGF0aW9uLW5vdGVzLCBvciBzY2VuZXJ5L2Fzc2V0cy9waWNrYWJpbGl0eS5zdmcuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBpY2thYmxlKCBwaWNrYWJsZTogYm9vbGVhbiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwaWNrYWJsZSA9PT0gbnVsbCB8fCB0eXBlb2YgcGlja2FibGUgPT09ICdib29sZWFuJyApO1xyXG4gICAgdGhpcy5fcGlja2FibGVQcm9wZXJ0eS5zZXQoIHBpY2thYmxlICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UGlja2FibGUoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcGlja2FibGUoIHZhbHVlOiBib29sZWFuIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0UGlja2FibGUoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgaXNQaWNrYWJsZSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwaWNrYWJsZSgpOiBib29sZWFuIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1BpY2thYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwaWNrYWJpbGl0eSBvZiB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGlzUGlja2FibGUoKTogYm9vbGVhbiB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX3BpY2thYmxlUHJvcGVydHkudmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBvdXIgcGlja2FibGVQcm9wZXJ0eSBjaGFuZ2VzIHZhbHVlcy5cclxuICAgKi9cclxuICBwcml2YXRlIG9uUGlja2FibGVQcm9wZXJ0eUNoYW5nZSggcGlja2FibGU6IGJvb2xlYW4gfCBudWxsLCBvbGRQaWNrYWJsZTogYm9vbGVhbiB8IG51bGwgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9waWNrZXIub25QaWNrYWJsZUNoYW5nZSggb2xkUGlja2FibGUsIHBpY2thYmxlICk7XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcbiAgICAvLyBUT0RPOiBpbnZhbGlkYXRlIHRoZSBjdXJzb3Igc29tZWhvdz8gIzE1MFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGF0IFByb3BlcnR5IG91ciBlbmFibGVkUHJvcGVydHkgaXMgYmFja2VkIGJ5LCBzbyB0aGF0IGNoYW5nZXMgdG8gdGhpcyBwcm92aWRlZCBQcm9wZXJ0eSB3aWxsIGNoYW5nZSB0aGlzXHJcbiAgICogTm9kZSdzIGVuYWJsZWQsIGFuZCB2aWNlIHZlcnNhLiBUaGlzIGRvZXMgbm90IGNoYW5nZSB0aGlzLl9lbmFibGVkUHJvcGVydHkuIFNlZSBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LnNldFRhcmdldFByb3BlcnR5KClcclxuICAgKiBmb3IgbW9yZSBpbmZvLlxyXG4gICAqXHJcbiAgICpcclxuICAgKiBOT1RFIEZvciBQaEVULWlPIHVzZTpcclxuICAgKiBBbGwgUGhFVC1pTyBpbnN0cnVtZW50ZWQgTm9kZXMgY3JlYXRlIHRoZWlyIG93biBpbnN0cnVtZW50ZWQgZW5hYmxlZFByb3BlcnR5IChpZiBvbmUgaXMgbm90IHBhc3NlZCBpbiBhc1xyXG4gICAqIGFuIG9wdGlvbikuIE9uY2UgYSBOb2RlJ3MgZW5hYmxlZFByb3BlcnR5IGhhcyBiZWVuIHJlZ2lzdGVyZWQgd2l0aCBQaEVULWlPLCBpdCBjYW5ub3QgYmUgXCJzd2FwcGVkIG91dFwiIGZvciBhbm90aGVyLlxyXG4gICAqIElmIHlvdSBuZWVkIHRvIFwiZGVsYXlcIiBzZXR0aW5nIGFuIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHkgdG8gdGhpcyBub2RlLCBwYXNzIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZFxyXG4gICAqIHRvIGluc3RydW1lbnRhdGlvbiBjYWxsIHRvIHRoaXMgTm9kZSAod2hlcmUgVGFuZGVtIGlzIHByb3ZpZGVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0RW5hYmxlZFByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmFibGVkUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCwgdGhpcywgRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEVuYWJsZWRQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBlbmFibGVkUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldEVuYWJsZWRQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRFbmFibGVkUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZW5hYmxlZFByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRFbmFibGVkUHJvcGVydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGlzIE5vZGUncyBlbmFibGVkUHJvcGVydHkuIE5vdGUhIFRoaXMgaXMgbm90IHRoZSByZWNpcHJvY2FsIG9mIHNldEVuYWJsZWRQcm9wZXJ0eS4gTm9kZS5wcm90b3R5cGUuX2VuYWJsZWRQcm9wZXJ0eVxyXG4gICAqIGlzIGEgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSwgYW5kIGlzIHNldCB1cCB0byBsaXN0ZW4gdG8gY2hhbmdlcyBmcm9tIHRoZSBlbmFibGVkUHJvcGVydHkgcHJvdmlkZWQgYnlcclxuICAgKiBzZXRFbmFibGVkUHJvcGVydHkoKSwgYnV0IHRoZSB1bmRlcmx5aW5nIHJlZmVyZW5jZSBkb2VzIG5vdCBjaGFuZ2UuIFRoaXMgbWVhbnMgdGhlIGZvbGxvd2luZzpcclxuICAgKiBjb25zdCBteU5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gICAqIGNvbnN0IGVuYWJsZWRQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgKiBteU5vZGUuc2V0RW5hYmxlZFByb3BlcnR5KCBlbmFibGVkUHJvcGVydHkgKVxyXG4gICAqID0+IG15Tm9kZS5nZXRFbmFibGVkUHJvcGVydHkoKSAhPT0gZW5hYmxlZFByb3BlcnR5ICghISEhISEpXHJcbiAgICpcclxuICAgKiBQbGVhc2UgdXNlIHRoaXMgd2l0aCBjYXV0aW9uLiBTZWUgc2V0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldEVuYWJsZWRQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZSB0aGlzIHRvIGF1dG9tYXRpY2FsbHkgY3JlYXRlIGEgZm9yd2FyZGVkLCBQaEVULWlPIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHkgaW50ZXJuYWwgdG8gTm9kZS4gVGhpcyBpcyBkaWZmZXJlbnRcclxuICAgKiBmcm9tIHZpc2libGUgYmVjYXVzZSBlbmFibGVkIGJ5IGRlZmF1bHQgZG9lc24ndCBub3QgY3JlYXRlIHRoaXMgZm9yd2FyZGVkIFByb3BlcnR5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmFibGVkUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCwgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRQaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmFibGVkUHJvcGVydHkuZ2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hldGhlciB0aGlzIE5vZGUgaXMgZW5hYmxlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmFibGVkKCBlbmFibGVkOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZW5hYmxlZCA9PT0gbnVsbCB8fCB0eXBlb2YgZW5hYmxlZCA9PT0gJ2Jvb2xlYW4nICk7XHJcbiAgICB0aGlzLl9lbmFibGVkUHJvcGVydHkuc2V0KCBlbmFibGVkICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0RW5hYmxlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBlbmFibGVkKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0RW5hYmxlZCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0VuYWJsZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzRW5hYmxlZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZW5hYmxlZCBvZiB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGlzRW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9lbmFibGVkUHJvcGVydHkudmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBlbmFibGVkUHJvcGVydHkgY2hhbmdlcyB2YWx1ZXMuXHJcbiAgICogLSBvdmVycmlkZSB0aGlzIHRvIGNoYW5nZSB0aGUgYmVoYXZpb3Igb2YgZW5hYmxlZFxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvbkVuYWJsZWRQcm9wZXJ0eUNoYW5nZSggZW5hYmxlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgICFlbmFibGVkICYmIHRoaXMuaW50ZXJydXB0U3VidHJlZUlucHV0KCk7XHJcbiAgICB0aGlzLmlucHV0RW5hYmxlZCA9IGVuYWJsZWQ7XHJcblxyXG4gICAgaWYgKCB0aGlzLmRpc2FibGVkT3BhY2l0eVByb3BlcnR5LnZhbHVlICE9PSAxICkge1xyXG4gICAgICB0aGlzLmZpbHRlckNoYW5nZUVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGF0IFByb3BlcnR5IG91ciBpbnB1dEVuYWJsZWRQcm9wZXJ0eSBpcyBiYWNrZWQgYnksIHNvIHRoYXQgY2hhbmdlcyB0byB0aGlzIHByb3ZpZGVkIFByb3BlcnR5IHdpbGwgY2hhbmdlIHRoaXMgd2hldGhlciB0aGlzXHJcbiAgICogTm9kZSdzIGlucHV0IGlzIGVuYWJsZWQsIGFuZCB2aWNlIHZlcnNhLiBUaGlzIGRvZXMgbm90IGNoYW5nZSB0aGlzLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eS4gU2VlIFRpbnlGb3J3YXJkaW5nUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoKVxyXG4gICAqIGZvciBtb3JlIGluZm8uXHJcbiAgICpcclxuICAgKiBOT1RFIEZvciBQaEVULWlPIHVzZTpcclxuICAgKiBBbGwgUGhFVC1pTyBpbnN0cnVtZW50ZWQgTm9kZXMgY3JlYXRlIHRoZWlyIG93biBpbnN0cnVtZW50ZWQgaW5wdXRFbmFibGVkUHJvcGVydHkgKGlmIG9uZSBpcyBub3QgcGFzc2VkIGluIGFzXHJcbiAgICogYW4gb3B0aW9uKS4gT25jZSBhIE5vZGUncyBpbnB1dEVuYWJsZWRQcm9wZXJ0eSBoYXMgYmVlbiByZWdpc3RlcmVkIHdpdGggUGhFVC1pTywgaXQgY2Fubm90IGJlIFwic3dhcHBlZCBvdXRcIiBmb3IgYW5vdGhlci5cclxuICAgKiBJZiB5b3UgbmVlZCB0byBcImRlbGF5XCIgc2V0dGluZyBhbiBpbnN0cnVtZW50ZWQgaW5wdXRFbmFibGVkUHJvcGVydHkgdG8gdGhpcyBub2RlLCBwYXNzIHBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkXHJcbiAgICogdG8gaW5zdHJ1bWVudGF0aW9uIGNhbGwgdG8gdGhpcyBOb2RlICh3aGVyZSBUYW5kZW0gaXMgcHJvdmlkZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSggbmV3VGFyZ2V0OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCwgdGhpcywgSU5QVVRfRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldElucHV0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGlucHV0RW5hYmxlZFByb3BlcnR5KCBwcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRFbmFibGVkUHJvcGVydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGlzIE5vZGUncyBpbnB1dEVuYWJsZWRQcm9wZXJ0eS4gTm90ZSEgVGhpcyBpcyBub3QgdGhlIHJlY2lwcm9jYWwgb2Ygc2V0SW5wdXRFbmFibGVkUHJvcGVydHkuIE5vZGUucHJvdG90eXBlLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eVxyXG4gICAqIGlzIGEgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSwgYW5kIGlzIHNldCB1cCB0byBsaXN0ZW4gdG8gY2hhbmdlcyBmcm9tIHRoZSBpbnB1dEVuYWJsZWRQcm9wZXJ0eSBwcm92aWRlZCBieVxyXG4gICAqIHNldElucHV0RW5hYmxlZFByb3BlcnR5KCksIGJ1dCB0aGUgdW5kZXJseWluZyByZWZlcmVuY2UgZG9lcyBub3QgY2hhbmdlLiBUaGlzIG1lYW5zIHRoZSBmb2xsb3dpbmc6XHJcbiAgICogY29uc3QgbXlOb2RlID0gbmV3IE5vZGUoKTtcclxuICAgKiBjb25zdCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgKiBteU5vZGUuc2V0SW5wdXRFbmFibGVkUHJvcGVydHkoIGlucHV0RW5hYmxlZFByb3BlcnR5IClcclxuICAgKiA9PiBteU5vZGUuZ2V0SW5wdXRFbmFibGVkUHJvcGVydHkoKSAhPT0gaW5wdXRFbmFibGVkUHJvcGVydHkgKCEhISEhISlcclxuICAgKlxyXG4gICAqIFBsZWFzZSB1c2UgdGhpcyB3aXRoIGNhdXRpb24uIFNlZSBzZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2lucHV0RW5hYmxlZFByb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIHRoaXMgdG8gYXV0b21hdGljYWxseSBjcmVhdGUgYSBmb3J3YXJkZWQsIFBoRVQtaU8gaW5zdHJ1bWVudGVkIGlucHV0RW5hYmxlZFByb3BlcnR5IGludGVybmFsIHRvIE5vZGUuIFRoaXMgaXMgZGlmZmVyZW50XHJcbiAgICogZnJvbSB2aXNpYmxlIGJlY2F1c2UgaW5wdXRFbmFibGVkIGJ5IGRlZmF1bHQgZG9lc24ndCBub3QgY3JlYXRlIHRoaXMgZm9yd2FyZGVkIFByb3BlcnR5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoIHBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkLCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkuZ2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hldGhlciBpbnB1dCBpcyBlbmFibGVkIGZvciB0aGlzIE5vZGUgYW5kIGl0cyBzdWJ0cmVlLiBJZiBmYWxzZSwgaW5wdXQgZXZlbnQgbGlzdGVuZXJzIHdpbGwgbm90IGJlIGZpcmVkXHJcbiAgICogb24gdGhpcyBOb2RlIG9yIGl0cyBkZXNjZW5kYW50cyBpbiB0aGUgcGlja2VkIFRyYWlsLiBUaGlzIGRvZXMgTk9UIGVmZmVjdCBwaWNraW5nICh3aGF0IFRyYWlsL25vZGVzIGFyZSB1bmRlclxyXG4gICAqIGEgcG9pbnRlciksIGJ1dCBvbmx5IGVmZmVjdHMgd2hhdCBsaXN0ZW5lcnMgYXJlIGZpcmVkLlxyXG4gICAqXHJcbiAgICogQWRkaXRpb25hbGx5LCB0aGlzIHdpbGwgYWZmZWN0IGN1cnNvciBiZWhhdmlvci4gSWYgaW5wdXRFbmFibGVkPWZhbHNlLCBkZXNjZW5kYW50cyBvZiB0aGlzIE5vZGUgd2lsbCBub3QgYmVcclxuICAgKiBjaGVja2VkIHdoZW4gZGV0ZXJtaW5pbmcgd2hhdCBjdXJzb3Igd2lsbCBiZSBzaG93bi4gSW5zdGVhZCwgaWYgYSBwb2ludGVyIChlLmcuIG1vdXNlKSBpcyBvdmVyIGEgZGVzY2VuZGFudCxcclxuICAgKiB0aGlzIE5vZGUncyBjdXJzb3Igd2lsbCBiZSBjaGVja2VkIGZpcnN0LCB0aGVuIGFuY2VzdG9ycyB3aWxsIGJlIGNoZWNrZWQgYXMgbm9ybWFsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbnB1dEVuYWJsZWQoIGlucHV0RW5hYmxlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHRoaXMuaW5wdXRFbmFibGVkUHJvcGVydHkudmFsdWUgPSBpbnB1dEVuYWJsZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0SW5wdXRFbmFibGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGlucHV0RW5hYmxlZCggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldElucHV0RW5hYmxlZCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0lucHV0RW5hYmxlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpbnB1dEVuYWJsZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc0lucHV0RW5hYmxlZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGlucHV0IGlzIGVuYWJsZWQgZm9yIHRoaXMgTm9kZSBhbmQgaXRzIHN1YnRyZWUuIFNlZSBzZXRJbnB1dEVuYWJsZWQgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgaXNJbnB1dEVuYWJsZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnB1dEVuYWJsZWRQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYWxsIG9mIHRoZSBpbnB1dCBsaXN0ZW5lcnMgYXR0YWNoZWQgdG8gdGhpcyBOb2RlLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIHJlbW92aW5nIGFsbCBjdXJyZW50IGlucHV0IGxpc3RlbmVycyB3aXRoIHJlbW92ZUlucHV0TGlzdGVuZXIoKSBhbmQgYWRkaW5nIGFsbCBuZXdcclxuICAgKiBsaXN0ZW5lcnMgKGluIG9yZGVyKSB3aXRoIGFkZElucHV0TGlzdGVuZXIoKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0SW5wdXRMaXN0ZW5lcnMoIGlucHV0TGlzdGVuZXJzOiBUSW5wdXRMaXN0ZW5lcltdICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggaW5wdXRMaXN0ZW5lcnMgKSApO1xyXG5cclxuICAgIC8vIFJlbW92ZSBhbGwgb2xkIGlucHV0IGxpc3RlbmVyc1xyXG4gICAgd2hpbGUgKCB0aGlzLl9pbnB1dExpc3RlbmVycy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5faW5wdXRMaXN0ZW5lcnNbIDAgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBpbiBhbGwgbmV3IGlucHV0IGxpc3RlbmVyc1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5wdXRMaXN0ZW5lcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggaW5wdXRMaXN0ZW5lcnNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldElucHV0TGlzdGVuZXJzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGlucHV0TGlzdGVuZXJzKCB2YWx1ZTogVElucHV0TGlzdGVuZXJbXSApIHtcclxuICAgIHRoaXMuc2V0SW5wdXRMaXN0ZW5lcnMoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0SW5wdXRMaXN0ZW5lcnMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgaW5wdXRMaXN0ZW5lcnMoKTogVElucHV0TGlzdGVuZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRJbnB1dExpc3RlbmVycygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgYWxsIG9mIG91ciBpbnB1dCBsaXN0ZW5lcnMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldElucHV0TGlzdGVuZXJzKCk6IFRJbnB1dExpc3RlbmVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2lucHV0TGlzdGVuZXJzLnNsaWNlKCAwICk7IC8vIGRlZmVuc2l2ZSBjb3B5XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBDU1MgY3Vyc29yIHN0cmluZyB0aGF0IHNob3VsZCBiZSB1c2VkIHdoZW4gdGhlIG1vdXNlIGlzIG92ZXIgdGhpcyBub2RlLiBudWxsIGlzIHRoZSBkZWZhdWx0LCBhbmRcclxuICAgKiBpbmRpY2F0ZXMgdGhhdCBhbmNlc3RvciBub2RlcyAob3IgdGhlIGJyb3dzZXIgZGVmYXVsdCkgc2hvdWxkIGJlIHVzZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY3Vyc29yIC0gQSBDU1MgY3Vyc29yIHN0cmluZywgbGlrZSAncG9pbnRlcicsIG9yICdub25lJyAtIEV4YW1wbGVzIGFyZTpcclxuICAgKiBhdXRvIGRlZmF1bHQgbm9uZSBpbmhlcml0IGhlbHAgcG9pbnRlciBwcm9ncmVzcyB3YWl0IGNyb3NzaGFpciB0ZXh0IHZlcnRpY2FsLXRleHQgYWxpYXMgY29weSBtb3ZlIG5vLWRyb3Agbm90LWFsbG93ZWRcclxuICAgKiBlLXJlc2l6ZSBuLXJlc2l6ZSB3LXJlc2l6ZSBzLXJlc2l6ZSBudy1yZXNpemUgbmUtcmVzaXplIHNlLXJlc2l6ZSBzdy1yZXNpemUgZXctcmVzaXplIG5zLXJlc2l6ZSBuZXN3LXJlc2l6ZSBud3NlLXJlc2l6ZVxyXG4gICAqIGNvbnRleHQtbWVudSBjZWxsIGNvbC1yZXNpemUgcm93LXJlc2l6ZSBhbGwtc2Nyb2xsIHVybCggLi4uICkgLS0+IGRvZXMgaXQgc3VwcG9ydCBkYXRhIFVSTHM/XHJcbiAgICovXHJcbiAgcHVibGljIHNldEN1cnNvciggY3Vyc29yOiBzdHJpbmcgfCBudWxsICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIGEgbWFwcGluZyBvZiB0eXBlcyB0byBzZXQgcmVhc29uYWJsZSBkZWZhdWx0cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIC8vIGFsbG93IHRoZSAnYXV0bycgY3Vyc29yIHR5cGUgdG8gbGV0IHRoZSBhbmNlc3RvcnMgb3Igc2NlbmUgcGljayB0aGUgY3Vyc29yIHR5cGVcclxuICAgIHRoaXMuX2N1cnNvciA9IGN1cnNvciA9PT0gJ2F1dG8nID8gbnVsbCA6IGN1cnNvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRDdXJzb3IoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY3Vyc29yKCB2YWx1ZTogc3RyaW5nIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0Q3Vyc29yKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEN1cnNvcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjdXJzb3IoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJzb3IoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIENTUyBjdXJzb3Igc3RyaW5nIGZvciB0aGlzIG5vZGUsIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gY3Vyc29yIHNwZWNpZmllZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q3Vyc29yKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2N1cnNvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIENTUyBjdXJzb3IgdGhhdCBjb3VsZCBiZSBhcHBsaWVkIGVpdGhlciBieSB0aGlzIE5vZGUgaXRzZWxmLCBvciBmcm9tIGFueSBvZiBpdHMgaW5wdXQgbGlzdGVuZXJzJ1xyXG4gICAqIHByZWZlcmVuY2VzLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RWZmZWN0aXZlQ3Vyc29yKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgaWYgKCB0aGlzLl9jdXJzb3IgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9jdXJzb3I7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5faW5wdXRMaXN0ZW5lcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGlucHV0TGlzdGVuZXIgPSB0aGlzLl9pbnB1dExpc3RlbmVyc1sgaSBdO1xyXG5cclxuICAgICAgaWYgKCBpbnB1dExpc3RlbmVyLmN1cnNvciApIHtcclxuICAgICAgICByZXR1cm4gaW5wdXRMaXN0ZW5lci5jdXJzb3I7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGhpdC10ZXN0ZWQgbW91c2UgYXJlYSBmb3IgdGhpcyBOb2RlIChzZWUgY29uc3RydWN0b3IgZm9yIG1vcmUgYWR2YW5jZWQgZG9jdW1lbnRhdGlvbikuIFVzZSBudWxsIGZvciB0aGVcclxuICAgKiBkZWZhdWx0IGJlaGF2aW9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNb3VzZUFyZWEoIGFyZWE6IFNoYXBlIHwgQm91bmRzMiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcmVhID09PSBudWxsIHx8IGFyZWEgaW5zdGFuY2VvZiBTaGFwZSB8fCBhcmVhIGluc3RhbmNlb2YgQm91bmRzMiwgJ21vdXNlQXJlYSBuZWVkcyB0byBiZSBhIHBoZXQua2l0ZS5TaGFwZSwgcGhldC5kb3QuQm91bmRzMiwgb3IgbnVsbCcgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX21vdXNlQXJlYSAhPT0gYXJlYSApIHtcclxuICAgICAgdGhpcy5fbW91c2VBcmVhID0gYXJlYTsgLy8gVE9ETzogY291bGQgY2hhbmdlIHdoYXQgaXMgdW5kZXIgdGhlIG1vdXNlLCBpbnZhbGlkYXRlISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgICAgdGhpcy5fcGlja2VyLm9uTW91c2VBcmVhQ2hhbmdlKCk7XHJcbiAgICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRNb3VzZUFyZWEoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbW91c2VBcmVhKCB2YWx1ZTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0TW91c2VBcmVhKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldE1vdXNlQXJlYSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBtb3VzZUFyZWEoKTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNb3VzZUFyZWEoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhpdC10ZXN0ZWQgbW91c2UgYXJlYSBmb3IgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNb3VzZUFyZWEoKTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbW91c2VBcmVhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaGl0LXRlc3RlZCB0b3VjaCBhcmVhIGZvciB0aGlzIE5vZGUgKHNlZSBjb25zdHJ1Y3RvciBmb3IgbW9yZSBhZHZhbmNlZCBkb2N1bWVudGF0aW9uKS4gVXNlIG51bGwgZm9yIHRoZVxyXG4gICAqIGRlZmF1bHQgYmVoYXZpb3IuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvdWNoQXJlYSggYXJlYTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyZWEgPT09IG51bGwgfHwgYXJlYSBpbnN0YW5jZW9mIFNoYXBlIHx8IGFyZWEgaW5zdGFuY2VvZiBCb3VuZHMyLCAndG91Y2hBcmVhIG5lZWRzIHRvIGJlIGEgcGhldC5raXRlLlNoYXBlLCBwaGV0LmRvdC5Cb3VuZHMyLCBvciBudWxsJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fdG91Y2hBcmVhICE9PSBhcmVhICkge1xyXG4gICAgICB0aGlzLl90b3VjaEFyZWEgPSBhcmVhOyAvLyBUT0RPOiBjb3VsZCBjaGFuZ2Ugd2hhdCBpcyB1bmRlciB0aGUgdG91Y2gsIGludmFsaWRhdGUhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgICB0aGlzLl9waWNrZXIub25Ub3VjaEFyZWFDaGFuZ2UoKTtcclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFRvdWNoQXJlYSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB0b3VjaEFyZWEoIHZhbHVlOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRUb3VjaEFyZWEoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0VG91Y2hBcmVhKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHRvdWNoQXJlYSgpOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldFRvdWNoQXJlYSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaGl0LXRlc3RlZCB0b3VjaCBhcmVhIGZvciB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRvdWNoQXJlYSgpOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl90b3VjaEFyZWE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGEgY2xpcHBlZCBzaGFwZSB3aGVyZSBvbmx5IGNvbnRlbnQgaW4gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgdGhhdCBpcyBpbnNpZGUgdGhlIGNsaXAgYXJlYSB3aWxsIGJlIHNob3duXHJcbiAgICogKGFueXRoaW5nIG91dHNpZGUgaXMgZnVsbHkgdHJhbnNwYXJlbnQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDbGlwQXJlYSggc2hhcGU6IFNoYXBlIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNoYXBlID09PSBudWxsIHx8IHNoYXBlIGluc3RhbmNlb2YgU2hhcGUsICdjbGlwQXJlYSBuZWVkcyB0byBiZSBhIHBoZXQua2l0ZS5TaGFwZSwgb3IgbnVsbCcgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuY2xpcEFyZWEgIT09IHNoYXBlICkge1xyXG4gICAgICB0aGlzLmNsaXBBcmVhUHJvcGVydHkudmFsdWUgPSBzaGFwZTtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG4gICAgICB0aGlzLl9waWNrZXIub25DbGlwQXJlYUNoYW5nZSgpO1xyXG5cclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENsaXBBcmVhKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNsaXBBcmVhKCB2YWx1ZTogU2hhcGUgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRDbGlwQXJlYSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDbGlwQXJlYSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjbGlwQXJlYSgpOiBTaGFwZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2xpcEFyZWEoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNsaXBwZWQgYXJlYSBmb3IgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDbGlwQXJlYSgpOiBTaGFwZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuY2xpcEFyZWFQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIE5vZGUgaGFzIGEgY2xpcCBhcmVhLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNDbGlwQXJlYSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNsaXBBcmVhICE9PSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGF0IHNlbGYgcmVuZGVyZXJzIChhbmQgb3RoZXIgYml0bWFzayBmbGFncykgYXJlIHN1cHBvcnRlZCBieSB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIHNldFJlbmRlcmVyQml0bWFzayggYml0bWFzazogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGJpdG1hc2sgKSApO1xyXG5cclxuICAgIGlmICggYml0bWFzayAhPT0gdGhpcy5fcmVuZGVyZXJCaXRtYXNrICkge1xyXG4gICAgICB0aGlzLl9yZW5kZXJlckJpdG1hc2sgPSBiaXRtYXNrO1xyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXJTdW1tYXJ5LnNlbGZDaGFuZ2UoKTtcclxuXHJcbiAgICAgIHRoaXMuaW5zdGFuY2VSZWZyZXNoRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNZWFudCB0byBiZSBvdmVycmlkZGVuLCBzbyB0aGF0IGl0IGNhbiBiZSBjYWxsZWQgdG8gZW5zdXJlIHRoYXQgdGhlIHJlbmRlcmVyIGJpdG1hc2sgd2lsbCBiZSB1cC10by1kYXRlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzKCk6IHZvaWQge1xyXG4gICAgLy8gc2VlIGRvY3NcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIEhpbnRzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogV2hlbiBBTlkgaGludCBjaGFuZ2VzLCB3ZSByZWZyZXNoIGV2ZXJ5dGhpbmcgY3VycmVudGx5IChmb3Igc2FmZXR5LCB0aGlzIG1heSBiZSBwb3NzaWJsZSB0byBtYWtlIG1vcmUgc3BlY2lmaWNcclxuICAgKiBpbiB0aGUgZnV0dXJlLCBidXQgaGludCBjaGFuZ2VzIGFyZSBub3QgcGFydGljdWxhcmx5IGNvbW1vbiBwZXJmb3JtYW5jZSBib3R0bGVuZWNrKS5cclxuICAgKi9cclxuICBwcml2YXRlIGludmFsaWRhdGVIaW50KCk6IHZvaWQge1xyXG4gICAgdGhpcy5yZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlci5lbWl0KCk7XHJcbiAgICB0aGlzLmluc3RhbmNlUmVmcmVzaEVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBhIHByZWZlcnJlZCByZW5kZXJlciBmb3IgdGhpcyBOb2RlIGFuZCBpdHMgc3ViLXRyZWUuIFNjZW5lcnkgd2lsbCBhdHRlbXB0IHRvIHVzZSB0aGlzIHJlbmRlcmVyIHVuZGVyIGhlcmVcclxuICAgKiB1bmxlc3MgaXQgaXNuJ3Qgc3VwcG9ydGVkLCBPUiBhbm90aGVyIHByZWZlcnJlZCByZW5kZXJlciBpcyBzZXQgYXMgYSBjbG9zZXIgYW5jZXN0b3IuIEFjY2VwdGFibGUgdmFsdWVzIGFyZTpcclxuICAgKiAtIG51bGwgKGRlZmF1bHQsIG5vIHByZWZlcmVuY2UpXHJcbiAgICogLSAnY2FudmFzJ1xyXG4gICAqIC0gJ3N2ZydcclxuICAgKiAtICdkb20nXHJcbiAgICogLSAnd2ViZ2wnXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJlbmRlcmVyKCByZW5kZXJlcjogUmVuZGVyZXJUeXBlICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmVuZGVyZXIgPT09IG51bGwgfHwgcmVuZGVyZXIgPT09ICdjYW52YXMnIHx8IHJlbmRlcmVyID09PSAnc3ZnJyB8fCByZW5kZXJlciA9PT0gJ2RvbScgfHwgcmVuZGVyZXIgPT09ICd3ZWJnbCcsXHJcbiAgICAgICdSZW5kZXJlciBpbnB1dCBzaG91bGQgYmUgbnVsbCwgb3Igb25lIG9mOiBcImNhbnZhc1wiLCBcInN2Z1wiLCBcImRvbVwiIG9yIFwid2ViZ2xcIi4nICk7XHJcblxyXG4gICAgbGV0IG5ld1JlbmRlcmVyID0gMDtcclxuICAgIGlmICggcmVuZGVyZXIgPT09ICdjYW52YXMnICkge1xyXG4gICAgICBuZXdSZW5kZXJlciA9IFJlbmRlcmVyLmJpdG1hc2tDYW52YXM7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcmVuZGVyZXIgPT09ICdzdmcnICkge1xyXG4gICAgICBuZXdSZW5kZXJlciA9IFJlbmRlcmVyLmJpdG1hc2tTVkc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcmVuZGVyZXIgPT09ICdkb20nICkge1xyXG4gICAgICBuZXdSZW5kZXJlciA9IFJlbmRlcmVyLmJpdG1hc2tET007XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcmVuZGVyZXIgPT09ICd3ZWJnbCcgKSB7XHJcbiAgICAgIG5ld1JlbmRlcmVyID0gUmVuZGVyZXIuYml0bWFza1dlYkdMO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggKCByZW5kZXJlciA9PT0gbnVsbCApID09PSAoIG5ld1JlbmRlcmVyID09PSAwICksXHJcbiAgICAgICdXZSBzaG91bGQgb25seSBlbmQgdXAgd2l0aCBubyBhY3R1YWwgcmVuZGVyZXIgaWYgcmVuZGVyZXIgaXMgbnVsbCcgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3JlbmRlcmVyICE9PSBuZXdSZW5kZXJlciApIHtcclxuICAgICAgdGhpcy5fcmVuZGVyZXIgPSBuZXdSZW5kZXJlcjtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSZW5kZXJlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByZW5kZXJlciggdmFsdWU6IFJlbmRlcmVyVHlwZSApIHtcclxuICAgIHRoaXMuc2V0UmVuZGVyZXIoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UmVuZGVyZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcmVuZGVyZXIoKTogUmVuZGVyZXJUeXBlIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJlbmRlcmVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwcmVmZXJyZWQgcmVuZGVyZXIgKGlmIGFueSkgb2YgdGhpcyBub2RlLCBhcyBhIHN0cmluZy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXJUeXBlIHtcclxuICAgIGlmICggdGhpcy5fcmVuZGVyZXIgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX3JlbmRlcmVyID09PSBSZW5kZXJlci5iaXRtYXNrQ2FudmFzICkge1xyXG4gICAgICByZXR1cm4gJ2NhbnZhcyc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fcmVuZGVyZXIgPT09IFJlbmRlcmVyLmJpdG1hc2tTVkcgKSB7XHJcbiAgICAgIHJldHVybiAnc3ZnJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9yZW5kZXJlciA9PT0gUmVuZGVyZXIuYml0bWFza0RPTSApIHtcclxuICAgICAgcmV0dXJuICdkb20nO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX3JlbmRlcmVyID09PSBSZW5kZXJlci5iaXRtYXNrV2ViR0wgKSB7XHJcbiAgICAgIHJldHVybiAnd2ViZ2wnO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICdTZWVtcyB0byBiZSBhbiBpbnZhbGlkIHJlbmRlcmVyPycgKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIG9yIG5vdCBTY2VuZXJ5IHdpbGwgdHJ5IHRvIHB1dCB0aGlzIE5vZGUgKGFuZCBpdHMgZGVzY2VuZGFudHMpIGludG8gYSBzZXBhcmF0ZSBTVkcvQ2FudmFzL1dlYkdML2V0Yy5cclxuICAgKiBsYXllciwgZGlmZmVyZW50IGZyb20gb3RoZXIgc2libGluZ3Mgb3Igb3RoZXIgbm9kZXMuIENhbiBiZSB1c2VkIGZvciBwZXJmb3JtYW5jZSBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGF5ZXJTcGxpdCggc3BsaXQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIHNwbGl0ICE9PSB0aGlzLl9sYXllclNwbGl0ICkge1xyXG4gICAgICB0aGlzLl9sYXllclNwbGl0ID0gc3BsaXQ7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TGF5ZXJTcGxpdCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBsYXllclNwbGl0KCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0TGF5ZXJTcGxpdCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0xheWVyU3BsaXQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGF5ZXJTcGxpdCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzTGF5ZXJTcGxpdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBsYXllclNwbGl0IHBlcmZvcm1hbmNlIGZsYWcgaXMgc2V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0xheWVyU3BsaXQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGF5ZXJTcGxpdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hldGhlciBvciBub3QgU2NlbmVyeSB3aWxsIHRha2UgaW50byBhY2NvdW50IHRoYXQgdGhpcyBOb2RlIHBsYW5zIHRvIHVzZSBvcGFjaXR5LiBDYW4gaGF2ZSBwZXJmb3JtYW5jZVxyXG4gICAqIGdhaW5zIGlmIHRoZXJlIG5lZWQgdG8gYmUgbXVsdGlwbGUgbGF5ZXJzIGZvciB0aGlzIG5vZGUncyBkZXNjZW5kYW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VXNlc09wYWNpdHkoIHVzZXNPcGFjaXR5OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCB1c2VzT3BhY2l0eSAhPT0gdGhpcy5fdXNlc09wYWNpdHkgKSB7XHJcbiAgICAgIHRoaXMuX3VzZXNPcGFjaXR5ID0gdXNlc09wYWNpdHk7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VXNlc09wYWNpdHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdXNlc09wYWNpdHkoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRVc2VzT3BhY2l0eSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRVc2VzT3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB1c2VzT3BhY2l0eSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFVzZXNPcGFjaXR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXNPcGFjaXR5IHBlcmZvcm1hbmNlIGZsYWcgaXMgc2V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVc2VzT3BhY2l0eSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl91c2VzT3BhY2l0eTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYSBmbGFnIGZvciB3aGV0aGVyIHdoZXRoZXIgdGhlIGNvbnRlbnRzIG9mIHRoaXMgTm9kZSBhbmQgaXRzIGNoaWxkcmVuIHNob3VsZCBiZSBkaXNwbGF5ZWQgaW4gYSBzZXBhcmF0ZVxyXG4gICAqIERPTSBlbGVtZW50IHRoYXQgaXMgdHJhbnNmb3JtZWQgd2l0aCBDU1MgdHJhbnNmb3Jtcy4gSXQgY2FuIGhhdmUgcG90ZW50aWFsIHNwZWVkdXBzLCBzaW5jZSB0aGUgYnJvd3NlciBtYXkgbm90XHJcbiAgICogaGF2ZSB0byByZS1yYXN0ZXJpemUgY29udGVudHMgd2hlbiBpdCBpcyBhbmltYXRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q1NTVHJhbnNmb3JtKCBjc3NUcmFuc2Zvcm06IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIGNzc1RyYW5zZm9ybSAhPT0gdGhpcy5fY3NzVHJhbnNmb3JtICkge1xyXG4gICAgICB0aGlzLl9jc3NUcmFuc2Zvcm0gPSBjc3NUcmFuc2Zvcm07XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q1NTVHJhbnNmb3JtKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNzc1RyYW5zZm9ybSggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldENTU1RyYW5zZm9ybSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0NTU1RyYW5zZm9ybWVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNzc1RyYW5zZm9ybSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzQ1NTVHJhbnNmb3JtZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgY3NzVHJhbnNmb3JtIHBlcmZvcm1hbmNlIGZsYWcgaXMgc2V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0NTU1RyYW5zZm9ybWVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2Nzc1RyYW5zZm9ybTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYSBwZXJmb3JtYW5jZSBmbGFnIGZvciB3aGV0aGVyIGxheWVycy9ET00gZWxlbWVudHMgc2hvdWxkIGJlIGV4Y2x1ZGVkIChvciBpbmNsdWRlZCkgd2hlbiB0aGluZ3MgYXJlXHJcbiAgICogaW52aXNpYmxlLiBUaGUgZGVmYXVsdCBpcyBmYWxzZSwgYW5kIGludmlzaWJsZSBjb250ZW50IGlzIGluIHRoZSBET00sIGJ1dCBoaWRkZW4uXHJcbiAgICovXHJcbiAgcHVibGljIHNldEV4Y2x1ZGVJbnZpc2libGUoIGV4Y2x1ZGVJbnZpc2libGU6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIGV4Y2x1ZGVJbnZpc2libGUgIT09IHRoaXMuX2V4Y2x1ZGVJbnZpc2libGUgKSB7XHJcbiAgICAgIHRoaXMuX2V4Y2x1ZGVJbnZpc2libGUgPSBleGNsdWRlSW52aXNpYmxlO1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlSGludCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEV4Y2x1ZGVJbnZpc2libGUoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgZXhjbHVkZUludmlzaWJsZSggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldEV4Y2x1ZGVJbnZpc2libGUoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgaXNFeGNsdWRlSW52aXNpYmxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGV4Y2x1ZGVJbnZpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc0V4Y2x1ZGVJbnZpc2libGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZXhjbHVkZUludmlzaWJsZSBwZXJmb3JtYW5jZSBmbGFnIGlzIHNldC5cclxuICAgKi9cclxuICBwdWJsaWMgaXNFeGNsdWRlSW52aXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2V4Y2x1ZGVJbnZpc2libGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGlzIGlzIHNldCB0byB0cnVlLCBjaGlsZCBub2RlcyB0aGF0IGFyZSBpbnZpc2libGUgd2lsbCBOT1QgY29udHJpYnV0ZSB0byB0aGUgYm91bmRzIG9mIHRoaXMgbm9kZS5cclxuICAgKlxyXG4gICAqIFRoZSBkZWZhdWx0IGlzIGZvciBjaGlsZCBub2RlcyBib3VuZHMnIHRvIGJlIGluY2x1ZGVkIGluIHRoaXMgbm9kZSdzIGJvdW5kcywgYnV0IHRoYXQgd291bGQgaW4gZ2VuZXJhbCBiZSBhXHJcbiAgICogcHJvYmxlbSBmb3IgbGF5b3V0IGNvbnRhaW5lcnMgb3Igb3RoZXIgc2l0dWF0aW9ucywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNjA4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFeGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzKCBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzICE9PSB0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzICkge1xyXG4gICAgICB0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzID0gZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcztcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgaXNFeGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc0V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyBmbGFnIGlzIHNldCwgc2VlXHJcbiAgICogc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpIGZvciBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgb3B0aW9ucyB0aGF0IGFyZSBwcm92aWRlZCB0byBsYXlvdXQgbWFuYWdlcnMgaW4gb3JkZXIgdG8gY3VzdG9taXplIHBvc2l0aW9uaW5nIG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGF5b3V0T3B0aW9ucyggbGF5b3V0T3B0aW9uczogVExheW91dE9wdGlvbnMgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGF5b3V0T3B0aW9ucyA9PT0gbnVsbCB8fCAoIHR5cGVvZiBsYXlvdXRPcHRpb25zID09PSAnb2JqZWN0JyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIGxheW91dE9wdGlvbnMgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSApLFxyXG4gICAgICAnbGF5b3V0T3B0aW9ucyBzaG91bGQgYmUgbnVsbCBvciBhbiBwbGFpbiBvcHRpb25zLXN0eWxlIG9iamVjdCcgKTtcclxuXHJcbiAgICBpZiAoIGxheW91dE9wdGlvbnMgIT09IHRoaXMuX2xheW91dE9wdGlvbnMgKSB7XHJcbiAgICAgIHRoaXMuX2xheW91dE9wdGlvbnMgPSBsYXlvdXRPcHRpb25zO1xyXG5cclxuICAgICAgdGhpcy5sYXlvdXRPcHRpb25zQ2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBsYXlvdXRPcHRpb25zKCB2YWx1ZTogVExheW91dE9wdGlvbnMgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRMYXlvdXRPcHRpb25zKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBsYXlvdXRPcHRpb25zKCk6IFRMYXlvdXRPcHRpb25zIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMYXlvdXRPcHRpb25zKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0TGF5b3V0T3B0aW9ucygpOiBUTGF5b3V0T3B0aW9ucyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xheW91dE9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbXV0YXRlTGF5b3V0T3B0aW9ucyggbGF5b3V0T3B0aW9ucz86IFRMYXlvdXRPcHRpb25zICk6IHZvaWQge1xyXG4gICAgdGhpcy5sYXlvdXRPcHRpb25zID0gb3B0aW9uaXplMzxUTGF5b3V0T3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgVExheW91dE9wdGlvbnM+KCkoIHt9LCB0aGlzLmxheW91dE9wdGlvbnMgfHwge30sIGxheW91dE9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8vIERlZmF1bHRzIGluZGljYXRpbmcgdGhhdCB3ZSBkb24ndCBtaXggaW4gV2lkdGhTaXphYmxlL0hlaWdodFNpemFibGVcclxuICBwdWJsaWMgZ2V0IHdpZHRoU2l6YWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaGVpZ2h0U2l6YWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZXh0ZW5kc1dpZHRoU2l6YWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZXh0ZW5kc0hlaWdodFNpemFibGUoKTogYm9vbGVhbiB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGV4dGVuZHNTaXphYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcHJldmVudEZpdCBwZXJmb3JtYW5jZSBmbGFnLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQcmV2ZW50Rml0KCBwcmV2ZW50Rml0OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCBwcmV2ZW50Rml0ICE9PSB0aGlzLl9wcmV2ZW50Rml0ICkge1xyXG4gICAgICB0aGlzLl9wcmV2ZW50Rml0ID0gcHJldmVudEZpdDtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRQcmV2ZW50Rml0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHByZXZlbnRGaXQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRQcmV2ZW50Rml0KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzUHJldmVudEZpdCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwcmV2ZW50Rml0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNQcmV2ZW50Rml0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHByZXZlbnRGaXQgcGVyZm9ybWFuY2UgZmxhZyBpcyBzZXQuXHJcbiAgICovXHJcbiAgcHVibGljIGlzUHJldmVudEZpdCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9wcmV2ZW50Rml0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIHRoZXJlIGlzIGEgY3VzdG9tIFdlYkdMIHNjYWxlIGFwcGxpZWQgdG8gdGhlIENhbnZhcywgYW5kIGlmIHNvIHdoYXQgc2NhbGUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFdlYkdMU2NhbGUoIHdlYmdsU2NhbGU6IG51bWJlciB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB3ZWJnbFNjYWxlID09PSBudWxsIHx8ICggdHlwZW9mIHdlYmdsU2NhbGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKCB3ZWJnbFNjYWxlICkgKSApO1xyXG5cclxuICAgIGlmICggd2ViZ2xTY2FsZSAhPT0gdGhpcy5fd2ViZ2xTY2FsZSApIHtcclxuICAgICAgdGhpcy5fd2ViZ2xTY2FsZSA9IHdlYmdsU2NhbGU7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0V2ViR0xTY2FsZSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB3ZWJnbFNjYWxlKCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0V2ViR0xTY2FsZSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRXZWJHTFNjYWxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHdlYmdsU2NhbGUoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRXZWJHTFNjYWxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgd2ViZ2xTY2FsZSBwZXJmb3JtYW5jZSBmbGFnLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRXZWJHTFNjYWxlKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX3dlYmdsU2NhbGU7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBUcmFpbCBvcGVyYXRpb25zXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgb25lIFRyYWlsIHRoYXQgc3RhcnRzIGZyb20gYSBub2RlIHdpdGggbm8gcGFyZW50cyAob3IgaWYgdGhlIHByZWRpY2F0ZSBpcyBwcmVzZW50LCBhIE5vZGUgdGhhdFxyXG4gICAqIHNhdGlzZmllcyBpdCksIGFuZCBlbmRzIGF0IHRoaXMgbm9kZS4gSWYgbW9yZSB0aGFuIG9uZSBUcmFpbCB3b3VsZCBzYXRpc2Z5IHRoZXNlIGNvbmRpdGlvbnMsIGFuIGFzc2VydGlvbiBpc1xyXG4gICAqIHRocm93biAocGxlYXNlIHVzZSBnZXRUcmFpbHMoKSBmb3IgdGhvc2UgY2FzZXMpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtwcmVkaWNhdGVdIC0gSWYgc3VwcGxpZWQsIHdlIHdpbGwgb25seSByZXR1cm4gdHJhaWxzIHJvb3RlZCBhdCBhIE5vZGUgdGhhdCBzYXRpc2ZpZXMgcHJlZGljYXRlKCBub2RlICkgPT0gdHJ1ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVbmlxdWVUcmFpbCggcHJlZGljYXRlPzogKCBub2RlOiBOb2RlICkgPT4gYm9vbGVhbiApOiBUcmFpbCB7XHJcblxyXG4gICAgLy8gV2l0aG91dCBhIHByZWRpY2F0ZSwgd2UnbGwgYmUgYWJsZSB0byBiYWlsIG91dCB0aGUgaW5zdGFudCB3ZSBoaXQgYSBOb2RlIHdpdGggMisgcGFyZW50cywgYW5kIGl0IG1ha2VzIHRoZVxyXG4gICAgLy8gbG9naWMgZWFzaWVyLlxyXG4gICAgaWYgKCAhcHJlZGljYXRlICkge1xyXG4gICAgICBjb25zdCB0cmFpbCA9IG5ldyBUcmFpbCgpO1xyXG5cclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXHJcbiAgICAgIGxldCBub2RlOiBOb2RlID0gdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXRoaXNcclxuXHJcbiAgICAgIHdoaWxlICggbm9kZSApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLl9wYXJlbnRzLmxlbmd0aCA8PSAxLFxyXG4gICAgICAgICAgYGdldFVuaXF1ZVRyYWlsIGZvdW5kIGEgTm9kZSB3aXRoICR7bm9kZS5fcGFyZW50cy5sZW5ndGh9IHBhcmVudHMuYCApO1xyXG5cclxuICAgICAgICB0cmFpbC5hZGRBbmNlc3Rvciggbm9kZSApO1xyXG4gICAgICAgIG5vZGUgPSBub2RlLl9wYXJlbnRzWyAwIF07IC8vIHNob3VsZCBiZSB1bmRlZmluZWQgaWYgdGhlcmUgYXJlbid0IGFueSBwYXJlbnRzXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cmFpbDtcclxuICAgIH1cclxuICAgIC8vIFdpdGggYSBwcmVkaWNhdGUsIHdlIG5lZWQgdG8gZXhwbG9yZSBtdWx0aXBsZSBwYXJlbnRzIChzaW5jZSB0aGUgcHJlZGljYXRlIG1heSBmaWx0ZXIgb3V0IGFsbCBidXQgb25lKVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHRyYWlscyA9IHRoaXMuZ2V0VHJhaWxzKCBwcmVkaWNhdGUgKTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRyYWlscy5sZW5ndGggPT09IDEsXHJcbiAgICAgICAgYGdldFVuaXF1ZVRyYWlsIGZvdW5kICR7dHJhaWxzLmxlbmd0aH0gbWF0Y2hpbmcgdHJhaWxzIGZvciB0aGUgcHJlZGljYXRlYCApO1xyXG5cclxuICAgICAgcmV0dXJuIHRyYWlsc1sgMCBdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFRyYWlsIHJvb3RlZCBhdCByb290Tm9kZSBhbmQgZW5kcyBhdCB0aGlzIG5vZGUuIFRocm93cyBhbiBhc3NlcnRpb24gaWYgdGhlIG51bWJlciBvZiB0cmFpbHMgdGhhdCBtYXRjaFxyXG4gICAqIHRoaXMgY29uZGl0aW9uIGlzbid0IGV4YWN0bHkgMS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VW5pcXVlVHJhaWxUbyggcm9vdE5vZGU6IE5vZGUgKTogVHJhaWwge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VW5pcXVlVHJhaWwoIG5vZGUgPT4gcm9vdE5vZGUgPT09IG5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIFRyYWlscyB0aGF0IHN0YXJ0IGZyb20gbm9kZXMgd2l0aCBubyBwYXJlbnQgKG9yIGlmIGEgcHJlZGljYXRlIGlzIHByZXNlbnQsIHRob3NlIHRoYXRcclxuICAgKiBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUpLCBhbmQgZW5kcyBhdCB0aGlzIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW3ByZWRpY2F0ZV0gLSBJZiBzdXBwbGllZCwgd2Ugd2lsbCBvbmx5IHJldHVybiBUcmFpbHMgcm9vdGVkIGF0IG5vZGVzIHRoYXQgc2F0aXNmeSBwcmVkaWNhdGUoIG5vZGUgKSA9PSB0cnVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUcmFpbHMoIHByZWRpY2F0ZT86ICggbm9kZTogTm9kZSApID0+IGJvb2xlYW4gKTogVHJhaWxbXSB7XHJcbiAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUgfHwgTm9kZS5kZWZhdWx0VHJhaWxQcmVkaWNhdGU7XHJcblxyXG4gICAgY29uc3QgdHJhaWxzOiBUcmFpbFtdID0gW107XHJcbiAgICBjb25zdCB0cmFpbCA9IG5ldyBUcmFpbCggdGhpcyApO1xyXG4gICAgVHJhaWwuYXBwZW5kQW5jZXN0b3JUcmFpbHNXaXRoUHJlZGljYXRlKCB0cmFpbHMsIHRyYWlsLCBwcmVkaWNhdGUgKTtcclxuXHJcbiAgICByZXR1cm4gdHJhaWxzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgVHJhaWxzIHJvb3RlZCBhdCByb290Tm9kZSBhbmQgZW5kIGF0IHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhaWxzVG8oIHJvb3ROb2RlOiBOb2RlICk6IFRyYWlsW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhaWxzKCBub2RlID0+IG5vZGUgPT09IHJvb3ROb2RlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBUcmFpbHMgcm9vdGVkIGF0IHRoaXMgTm9kZSBhbmQgZW5kIHdpdGggbm9kZXMgd2l0aCBubyBjaGlsZHJlbiAob3IgaWYgYSBwcmVkaWNhdGUgaXNcclxuICAgKiBwcmVzZW50LCB0aG9zZSB0aGF0IHNhdGlzZnkgdGhlIHByZWRpY2F0ZSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW3ByZWRpY2F0ZV0gLSBJZiBzdXBwbGllZCwgd2Ugd2lsbCBvbmx5IHJldHVybiBUcmFpbHMgZW5kaW5nIGF0IG5vZGVzIHRoYXQgc2F0aXNmeSBwcmVkaWNhdGUoIG5vZGUgKSA9PSB0cnVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMZWFmVHJhaWxzKCBwcmVkaWNhdGU/OiAoIG5vZGU6IE5vZGUgKSA9PiBib29sZWFuICk6IFRyYWlsW10ge1xyXG4gICAgcHJlZGljYXRlID0gcHJlZGljYXRlIHx8IE5vZGUuZGVmYXVsdExlYWZUcmFpbFByZWRpY2F0ZTtcclxuXHJcbiAgICBjb25zdCB0cmFpbHM6IFRyYWlsW10gPSBbXTtcclxuICAgIGNvbnN0IHRyYWlsID0gbmV3IFRyYWlsKCB0aGlzICk7XHJcbiAgICBUcmFpbC5hcHBlbmREZXNjZW5kYW50VHJhaWxzV2l0aFByZWRpY2F0ZSggdHJhaWxzLCB0cmFpbCwgcHJlZGljYXRlICk7XHJcblxyXG4gICAgcmV0dXJuIHRyYWlscztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIFRyYWlscyByb290ZWQgYXQgdGhpcyBOb2RlIGFuZCBlbmQgd2l0aCBsZWFmTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVhZlRyYWlsc1RvKCBsZWFmTm9kZTogTm9kZSApOiBUcmFpbFtdIHtcclxuICAgIHJldHVybiB0aGlzLmdldExlYWZUcmFpbHMoIG5vZGUgPT4gbm9kZSA9PT0gbGVhZk5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBUcmFpbCByb290ZWQgYXQgdGhpcyBub2RlIGFuZCBlbmRpbmcgYXQgYSBOb2RlIHRoYXQgaGFzIG5vIGNoaWxkcmVuIChvciBpZiBhIHByZWRpY2F0ZSBpcyBwcm92aWRlZCwgYVxyXG4gICAqIE5vZGUgdGhhdCBzYXRpc2ZpZXMgdGhlIHByZWRpY2F0ZSkuIElmIG1vcmUgdGhhbiBvbmUgdHJhaWwgbWF0Y2hlcyB0aGlzIGRlc2NyaXB0aW9uLCBhbiBhc3NlcnRpb24gd2lsbCBiZSBmaXJlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbcHJlZGljYXRlXSAtIElmIHN1cHBsaWVkLCB3ZSB3aWxsIHJldHVybiBhIFRyYWlsIHRoYXQgZW5kcyB3aXRoIGEgTm9kZSB0aGF0IHNhdGlzZmllcyBwcmVkaWNhdGUoIG5vZGUgKSA9PSB0cnVlXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXF1ZUxlYWZUcmFpbCggcHJlZGljYXRlPzogKCBub2RlOiBOb2RlICkgPT4gYm9vbGVhbiApOiBUcmFpbCB7XHJcbiAgICBjb25zdCB0cmFpbHMgPSB0aGlzLmdldExlYWZUcmFpbHMoIHByZWRpY2F0ZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRyYWlscy5sZW5ndGggPT09IDEsXHJcbiAgICAgIGBnZXRVbmlxdWVMZWFmVHJhaWwgZm91bmQgJHt0cmFpbHMubGVuZ3RofSBtYXRjaGluZyB0cmFpbHMgZm9yIHRoZSBwcmVkaWNhdGVgICk7XHJcblxyXG4gICAgcmV0dXJuIHRyYWlsc1sgMCBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFRyYWlsIHJvb3RlZCBhdCB0aGlzIE5vZGUgYW5kIGVuZGluZyBhdCBsZWFmTm9kZS4gSWYgbW9yZSB0aGFuIG9uZSB0cmFpbCBtYXRjaGVzIHRoaXMgZGVzY3JpcHRpb24sXHJcbiAgICogYW4gYXNzZXJ0aW9uIHdpbGwgYmUgZmlyZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXF1ZUxlYWZUcmFpbFRvKCBsZWFmTm9kZTogTm9kZSApOiBUcmFpbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRVbmlxdWVMZWFmVHJhaWwoIG5vZGUgPT4gbm9kZSA9PT0gbGVhZk5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIG5vZGVzIGluIHRoZSBjb25uZWN0ZWQgY29tcG9uZW50LCByZXR1cm5lZCBpbiBhbiBhcmJpdHJhcnkgb3JkZXIsIGluY2x1ZGluZyBub2RlcyB0aGF0IGFyZSBhbmNlc3RvcnNcclxuICAgKiBvZiB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbm5lY3RlZE5vZGVzKCk6IE5vZGVbXSB7XHJcbiAgICBjb25zdCByZXN1bHQ6IE5vZGVbXSA9IFtdO1xyXG4gICAgbGV0IGZyZXNoID0gdGhpcy5fY2hpbGRyZW4uY29uY2F0KCB0aGlzLl9wYXJlbnRzICkuY29uY2F0KCB0aGlzICk7XHJcbiAgICB3aGlsZSAoIGZyZXNoLmxlbmd0aCApIHtcclxuICAgICAgY29uc3Qgbm9kZSA9IGZyZXNoLnBvcCgpITtcclxuICAgICAgaWYgKCAhXy5pbmNsdWRlcyggcmVzdWx0LCBub2RlICkgKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2goIG5vZGUgKTtcclxuICAgICAgICBmcmVzaCA9IGZyZXNoLmNvbmNhdCggbm9kZS5fY2hpbGRyZW4sIG5vZGUuX3BhcmVudHMgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIG5vZGVzIGluIHRoZSBzdWJ0cmVlIHdpdGggdGhpcyBOb2RlIGFzIGl0cyByb290LCByZXR1cm5lZCBpbiBhbiBhcmJpdHJhcnkgb3JkZXIuIExpa2VcclxuICAgKiBnZXRDb25uZWN0ZWROb2RlcywgYnV0IGRvZXNuJ3QgaW5jbHVkZSBwYXJlbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdWJ0cmVlTm9kZXMoKTogTm9kZVtdIHtcclxuICAgIGNvbnN0IHJlc3VsdDogTm9kZVtdID0gW107XHJcbiAgICBsZXQgZnJlc2ggPSB0aGlzLl9jaGlsZHJlbi5jb25jYXQoIHRoaXMgKTtcclxuICAgIHdoaWxlICggZnJlc2gubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBub2RlID0gZnJlc2gucG9wKCkhO1xyXG4gICAgICBpZiAoICFfLmluY2x1ZGVzKCByZXN1bHQsIG5vZGUgKSApIHtcclxuICAgICAgICByZXN1bHQucHVzaCggbm9kZSApO1xyXG4gICAgICAgIGZyZXNoID0gZnJlc2guY29uY2F0KCBub2RlLl9jaGlsZHJlbiApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbGwgbm9kZXMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgbm9kZSwgc29ydGVkIGluIHRvcG9sb2dpY2FsIG9yZGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUb3BvbG9naWNhbGx5U29ydGVkTm9kZXMoKTogTm9kZVtdIHtcclxuICAgIC8vIHNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RvcG9sb2dpY2FsX3NvcnRpbmdcclxuICAgIGNvbnN0IGVkZ2VzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4gPSB7fTtcclxuICAgIGNvbnN0IHM6IE5vZGVbXSA9IFtdO1xyXG4gICAgY29uc3QgbDogTm9kZVtdID0gW107XHJcbiAgICBsZXQgbjogTm9kZTtcclxuICAgIF8uZWFjaCggdGhpcy5nZXRDb25uZWN0ZWROb2RlcygpLCBub2RlID0+IHtcclxuICAgICAgZWRnZXNbIG5vZGUuaWQgXSA9IHt9O1xyXG4gICAgICBfLmVhY2goIG5vZGUuX2NoaWxkcmVuLCBtID0+IHtcclxuICAgICAgICBlZGdlc1sgbm9kZS5pZCBdWyBtLmlkIF0gPSB0cnVlO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGlmICggIW5vZGUucGFyZW50cy5sZW5ndGggKSB7XHJcbiAgICAgICAgcy5wdXNoKCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVDaGlsZCggbTogTm9kZSApOiB2b2lkIHtcclxuICAgICAgZGVsZXRlIGVkZ2VzWyBuLmlkIF1bIG0uaWQgXTtcclxuICAgICAgaWYgKCBfLmV2ZXJ5KCBlZGdlcywgY2hpbGRyZW4gPT4gIWNoaWxkcmVuWyBtLmlkIF0gKSApIHtcclxuICAgICAgICAvLyB0aGVyZSBhcmUgbm8gbW9yZSBlZGdlcyB0byBtXHJcbiAgICAgICAgcy5wdXNoKCBtICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoIHMubGVuZ3RoICkge1xyXG4gICAgICBuID0gcy5wb3AoKSE7XHJcbiAgICAgIGwucHVzaCggbiApO1xyXG5cclxuICAgICAgXy5lYWNoKCBuLl9jaGlsZHJlbiwgaGFuZGxlQ2hpbGQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBlbnN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gZWRnZXMgbGVmdCwgc2luY2UgdGhlbiBpdCB3b3VsZCBjb250YWluIGEgY2lyY3VsYXIgcmVmZXJlbmNlXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmV2ZXJ5KCBlZGdlcywgY2hpbGRyZW4gPT4gXy5ldmVyeSggY2hpbGRyZW4sIGZpbmFsID0+IGZhbHNlICkgKSwgJ2NpcmN1bGFyIHJlZmVyZW5jZSBjaGVjaycgKTtcclxuXHJcbiAgICByZXR1cm4gbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzLmFkZENoaWxkKCBjaGlsZCApIHdpbGwgbm90IGNhdXNlIGNpcmN1bGFyIHJlZmVyZW5jZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGNhbkFkZENoaWxkKCBjaGlsZDogTm9kZSApOiBib29sZWFuIHtcclxuICAgIGlmICggdGhpcyA9PT0gY2hpbGQgfHwgXy5pbmNsdWRlcyggdGhpcy5fY2hpbGRyZW4sIGNoaWxkICkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Ub3BvbG9naWNhbF9zb3J0aW5nXHJcbiAgICAvLyBUT0RPOiByZW1vdmUgZHVwbGljYXRpb24gd2l0aCBhYm92ZSBoYW5kbGluZz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGNvbnN0IGVkZ2VzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4gPSB7fTtcclxuICAgIGNvbnN0IHM6IE5vZGVbXSA9IFtdO1xyXG4gICAgY29uc3QgbDogTm9kZVtdID0gW107XHJcbiAgICBsZXQgbjogTm9kZTtcclxuICAgIF8uZWFjaCggdGhpcy5nZXRDb25uZWN0ZWROb2RlcygpLmNvbmNhdCggY2hpbGQuZ2V0Q29ubmVjdGVkTm9kZXMoKSApLCBub2RlID0+IHtcclxuICAgICAgZWRnZXNbIG5vZGUuaWQgXSA9IHt9O1xyXG4gICAgICBfLmVhY2goIG5vZGUuX2NoaWxkcmVuLCBtID0+IHtcclxuICAgICAgICBlZGdlc1sgbm9kZS5pZCBdWyBtLmlkIF0gPSB0cnVlO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGlmICggIW5vZGUucGFyZW50cy5sZW5ndGggJiYgbm9kZSAhPT0gY2hpbGQgKSB7XHJcbiAgICAgICAgcy5wdXNoKCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIGVkZ2VzWyB0aGlzLmlkIF1bIGNoaWxkLmlkIF0gPSB0cnVlOyAvLyBhZGQgaW4gb3VyICduZXcnIGVkZ2VcclxuICAgIGZ1bmN0aW9uIGhhbmRsZUNoaWxkKCBtOiBOb2RlICk6IHZvaWQge1xyXG4gICAgICBkZWxldGUgZWRnZXNbIG4uaWQgXVsgbS5pZCBdO1xyXG4gICAgICBpZiAoIF8uZXZlcnkoIGVkZ2VzLCBjaGlsZHJlbiA9PiAhY2hpbGRyZW5bIG0uaWQgXSApICkge1xyXG4gICAgICAgIC8vIHRoZXJlIGFyZSBubyBtb3JlIGVkZ2VzIHRvIG1cclxuICAgICAgICBzLnB1c2goIG0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlICggcy5sZW5ndGggKSB7XHJcbiAgICAgIG4gPSBzLnBvcCgpITtcclxuICAgICAgbC5wdXNoKCBuICk7XHJcblxyXG4gICAgICBfLmVhY2goIG4uX2NoaWxkcmVuLCBoYW5kbGVDaGlsZCApO1xyXG5cclxuICAgICAgLy8gaGFuZGxlIG91ciBuZXcgZWRnZVxyXG4gICAgICBpZiAoIG4gPT09IHRoaXMgKSB7XHJcbiAgICAgICAgaGFuZGxlQ2hpbGQoIGNoaWxkICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBlbnN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gZWRnZXMgbGVmdCwgc2luY2UgdGhlbiBpdCB3b3VsZCBjb250YWluIGEgY2lyY3VsYXIgcmVmZXJlbmNlXHJcbiAgICByZXR1cm4gXy5ldmVyeSggZWRnZXMsIGNoaWxkcmVuID0+IF8uZXZlcnkoIGNoaWxkcmVuLCBmaW5hbCA9PiBmYWxzZSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUbyBiZSBvdmVycmlkZGVuIGluIHBhaW50YWJsZSBOb2RlIHR5cGVzLiBTaG91bGQgaG9vayBpbnRvIHRoZSBkcmF3YWJsZSdzIHByb3RvdHlwZSAocHJlc3VtYWJseSkuXHJcbiAgICpcclxuICAgKiBEcmF3cyB0aGUgY3VycmVudCBOb2RlJ3Mgc2VsZiByZXByZXNlbnRhdGlvbiwgYXNzdW1pbmcgdGhlIHdyYXBwZXIncyBDYW52YXMgY29udGV4dCBpcyBhbHJlYWR5IGluIHRoZSBsb2NhbFxyXG4gICAqIGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHdyYXBwZXJcclxuICAgKiBAcGFyYW0gbWF0cml4IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhbHJlYWR5IGFwcGxpZWQgdG8gdGhlIGNvbnRleHQuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGNhbnZhc1BhaW50U2VsZiggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIsIG1hdHJpeDogTWF0cml4MyApOiB2b2lkIHtcclxuICAgIC8vIFNlZSBzdWJjbGFzcyBmb3IgaW1wbGVtZW50YXRpb25cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlcnMgdGhpcyBOb2RlIG9ubHkgKGl0cyBzZWxmKSBpbnRvIHRoZSBDYW52YXMgd3JhcHBlciwgaW4gaXRzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gd3JhcHBlclxyXG4gICAqIEBwYXJhbSBtYXRyaXggLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IGFscmVhZHkgYXBwbGllZCB0byB0aGUgY29udGV4dC5cclxuICAgKi9cclxuICBwdWJsaWMgcmVuZGVyVG9DYW52YXNTZWxmKCB3cmFwcGVyOiBDYW52YXNDb250ZXh0V3JhcHBlciwgbWF0cml4OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLmlzUGFpbnRlZCgpICYmICggdGhpcy5fcmVuZGVyZXJCaXRtYXNrICYgUmVuZGVyZXIuYml0bWFza0NhbnZhcyApICkge1xyXG4gICAgICB0aGlzLmNhbnZhc1BhaW50U2VsZiggd3JhcHBlciwgbWF0cml4ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXJzIHRoaXMgTm9kZSBhbmQgaXRzIGRlc2NlbmRhbnRzIGludG8gdGhlIENhbnZhcyB3cmFwcGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHdyYXBwZXJcclxuICAgKiBAcGFyYW0gW21hdHJpeF0gLSBPcHRpb25hbCB0cmFuc2Zvcm0gdG8gYmUgYXBwbGllZFxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW5kZXJUb0NhbnZhc1N1YnRyZWUoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyLCBtYXRyaXg/OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgbWF0cml4ID0gbWF0cml4IHx8IE1hdHJpeDMuaWRlbnRpdHkoKTtcclxuXHJcbiAgICB3cmFwcGVyLnJlc2V0U3R5bGVzKCk7XHJcblxyXG4gICAgdGhpcy5yZW5kZXJUb0NhbnZhc1NlbGYoIHdyYXBwZXIsIG1hdHJpeCApO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgIC8vIElnbm9yZSBpbnZhbGlkIChlbXB0eSkgYm91bmRzLCBzaW5jZSB0aGlzIHdvdWxkIHNob3cgbm90aGluZyAoYW5kIHdlIGNvdWxkbid0IGNvbXB1dGUgZml0dGVkIGJvdW5kcyBmb3IgaXQpLlxyXG4gICAgICBpZiAoIGNoaWxkLmlzVmlzaWJsZSgpICYmIGNoaWxkLmJvdW5kcy5pc1ZhbGlkKCkgKSB7XHJcblxyXG4gICAgICAgIC8vIEZvciBhbnl0aGluZyBmaWx0ZXItbGlrZSwgd2UnbGwgbmVlZCB0byBjcmVhdGUgYSBDYW52YXMsIHJlbmRlciBvdXIgY2hpbGQncyBjb250ZW50IGludG8gdGhhdCBDYW52YXMsXHJcbiAgICAgICAgLy8gYW5kIHRoZW4gKGFwcGx5aW5nIHRoZSBmaWx0ZXIpIHJlbmRlciB0aGF0IGludG8gdGhlIENhbnZhcyBwcm92aWRlZC5cclxuICAgICAgICBjb25zdCByZXF1aXJlc1NjcmF0Y2hDYW52YXMgPSBjaGlsZC5lZmZlY3RpdmVPcGFjaXR5ICE9PSAxIHx8IGNoaWxkLmNsaXBBcmVhIHx8IGNoaWxkLl9maWx0ZXJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd3JhcHBlci5jb250ZXh0LnNhdmUoKTtcclxuICAgICAgICBtYXRyaXgubXVsdGlwbHlNYXRyaXgoIGNoaWxkLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkgKTtcclxuICAgICAgICBtYXRyaXguY2FudmFzU2V0VHJhbnNmb3JtKCB3cmFwcGVyLmNvbnRleHQgKTtcclxuICAgICAgICBpZiAoIHJlcXVpcmVzU2NyYXRjaENhbnZhcyApIHtcclxuICAgICAgICAgIC8vIFdlJ2xsIGF0dGVtcHQgdG8gZml0IHRoZSBDYW52YXMgdG8gdGhlIGNvbnRlbnQgdG8gbWluaW1pemUgbWVtb3J5IHVzZSwgc2VlXHJcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZnVuY3Rpb24tYnVpbGRlci9pc3N1ZXMvMTQ4XHJcblxyXG4gICAgICAgICAgLy8gV2UncmUgZ29pbmcgdG8gaWdub3JlIGNvbnRlbnQgb3V0c2lkZSBvdXIgd3JhcHBlciBjb250ZXh0J3MgY2FudmFzLlxyXG4gICAgICAgICAgLy8gQWRkZWQgcGFkZGluZyBhbmQgcm91bmQtb3V0IGZvciBjYXNlcyB3aGVyZSBDYW52YXMgYm91bmRzIG1pZ2h0IG5vdCBiZSBmdWxseSBhY2N1cmF0ZVxyXG4gICAgICAgICAgLy8gVGhlIG1hdHJpeCBhbHJlYWR5IGluY2x1ZGVzIHRoZSBjaGlsZCdzIHRyYW5zZm9ybSAoc28gd2UgdXNlIGxvY2FsQm91bmRzKS5cclxuICAgICAgICAgIC8vIFdlIHdvbid0IGdvIG91dHNpZGUgb3VyIHBhcmVudCBjYW52YXMnIGJvdW5kcywgc2luY2UgdGhpcyB3b3VsZCBiZSBhIHdhc3RlIG9mIG1lbW9yeSAod291bGRuJ3QgYmUgd3JpdHRlbilcclxuICAgICAgICAgIC8vIFRoZSByb3VuZC1vdXQgd2lsbCBtYWtlIHN1cmUgd2UgaGF2ZSBwaXhlbCBhbGlnbm1lbnQsIHNvIHRoYXQgd2Ugd29uJ3QgZ2V0IGJsdXJzIG9yIGFsaWFzaW5nL2JsaXR0aW5nXHJcbiAgICAgICAgICAvLyBlZmZlY3RzIHdoZW4gY29weWluZyB0aGluZ3Mgb3Zlci5cclxuICAgICAgICAgIGNvbnN0IGNoaWxkQ2FudmFzQm91bmRzID0gY2hpbGQubG9jYWxCb3VuZHMudHJhbnNmb3JtZWQoIG1hdHJpeCApLmRpbGF0ZSggNCApLnJvdW5kT3V0KCkuY29uc3RyYWluQm91bmRzKFxyXG4gICAgICAgICAgICBzY3JhdGNoQm91bmRzMkV4dHJhLnNldE1pbk1heCggMCwgMCwgd3JhcHBlci5jYW52YXMud2lkdGgsIHdyYXBwZXIuY2FudmFzLmhlaWdodCApXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGlmICggY2hpbGRDYW52YXNCb3VuZHMud2lkdGggPiAwICYmIGNoaWxkQ2FudmFzQm91bmRzLmhlaWdodCA+IDAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSdsbCBzZXQgb3VyIENhbnZhcyB0byB0aGUgZml0dGVkIHdpZHRoLCBhbmQgd2lsbCBoYW5kbGUgdGhlIG9mZnNldHMgYmVsb3cuXHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGNoaWxkQ2FudmFzQm91bmRzLndpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gY2hpbGRDYW52YXNCb3VuZHMuaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoICcyZCcgKSE7XHJcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkV3JhcHBlciA9IG5ldyBDYW52YXNDb250ZXh0V3JhcHBlciggY2FudmFzLCBjb250ZXh0ICk7XHJcblxyXG4gICAgICAgICAgICAvLyBBZnRlciBvdXIgYW5jZXN0b3IgdHJhbnNmb3JtIGlzIGFwcGxpZWQsIHdlJ2xsIG5lZWQgdG8gYXBwbHkgYW5vdGhlciBvZmZzZXQgZm9yIGZpdHRlZCBDYW52YXMuIFdlJ2xsXHJcbiAgICAgICAgICAgIC8vIG5lZWQgdG8gcGFzcyB0aGlzIHRvIGRlc2NlbmRhbnRzIEFORCBhcHBseSBpdCB0byB0aGUgc3ViLWNvbnRleHQuXHJcbiAgICAgICAgICAgIGNvbnN0IHN1Yk1hdHJpeCA9IG1hdHJpeC5jb3B5KCkucHJlcGVuZFRyYW5zbGF0aW9uKCAtY2hpbGRDYW52YXNCb3VuZHMubWluWCwgLWNoaWxkQ2FudmFzQm91bmRzLm1pblkgKTtcclxuXHJcbiAgICAgICAgICAgIHN1Yk1hdHJpeC5jYW52YXNTZXRUcmFuc2Zvcm0oIGNvbnRleHQgKTtcclxuICAgICAgICAgICAgY2hpbGQucmVuZGVyVG9DYW52YXNTdWJ0cmVlKCBjaGlsZFdyYXBwZXIsIHN1Yk1hdHJpeCApO1xyXG5cclxuICAgICAgICAgICAgd3JhcHBlci5jb250ZXh0LnNhdmUoKTtcclxuICAgICAgICAgICAgaWYgKCBjaGlsZC5jbGlwQXJlYSApIHtcclxuICAgICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgY2hpbGQuY2xpcEFyZWEud3JpdGVUb0NvbnRleHQoIHdyYXBwZXIuY29udGV4dCApO1xyXG4gICAgICAgICAgICAgIHdyYXBwZXIuY29udGV4dC5jbGlwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd3JhcHBlci5jb250ZXh0LnNldFRyYW5zZm9ybSggMSwgMCwgMCwgMSwgMCwgMCApOyAvLyBpZGVudGl0eVxyXG4gICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSBjaGlsZC5lZmZlY3RpdmVPcGFjaXR5O1xyXG5cclxuICAgICAgICAgICAgbGV0IHNldEZpbHRlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoIGNoaWxkLl9maWx0ZXJzLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgICAvLyBGaWx0ZXJzIHNob3VsZG4ndCBiZSB0b28gb2Z0ZW4sIHNvIGxlc3MgY29uY2VybmVkIGFib3V0IHRoZSBHQyBoZXJlIChhbmQgdGhpcyBpcyBzbyBtdWNoIGVhc2llciB0byByZWFkKS5cclxuICAgICAgICAgICAgICAvLyBQZXJmb3JtYW5jZSBib3R0bGVuZWNrIGZvciBub3QgdXNpbmcgdGhpcyBmYWxsYmFjayBzdHlsZSwgc28gd2UncmUgYWxsb3dpbmcgaXQgZm9yIENocm9tZSBldmVuIHRob3VnaFxyXG4gICAgICAgICAgICAgIC8vIHRoZSB2aXN1YWwgZGlmZmVyZW5jZXMgbWF5IGJlIHByZXNlbnQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTEzOVxyXG4gICAgICAgICAgICAgIGlmICggRmVhdHVyZXMuY2FudmFzRmlsdGVyICYmIF8uZXZlcnkoIGNoaWxkLl9maWx0ZXJzLCBmaWx0ZXIgPT4gZmlsdGVyLmlzRE9NQ29tcGF0aWJsZSgpICkgKSB7XHJcbiAgICAgICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuZmlsdGVyID0gY2hpbGQuX2ZpbHRlcnMubWFwKCBmaWx0ZXIgPT4gZmlsdGVyLmdldENTU0ZpbHRlclN0cmluZygpICkuam9pbiggJyAnICk7XHJcbiAgICAgICAgICAgICAgICBzZXRGaWx0ZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkLl9maWx0ZXJzLmZvckVhY2goIGZpbHRlciA9PiBmaWx0ZXIuYXBwbHlDYW52YXNGaWx0ZXIoIGNoaWxkV3JhcHBlciApICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgaW52ZXJzZSB0cmFuc2Zvcm0gaXMgYXBwbGllZCB0byBoYW5kbGUgZml0dGluZ1xyXG4gICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuZHJhd0ltYWdlKCBjYW52YXMsIGNoaWxkQ2FudmFzQm91bmRzLm1pblgsIGNoaWxkQ2FudmFzQm91bmRzLm1pblkgKTtcclxuICAgICAgICAgICAgd3JhcHBlci5jb250ZXh0LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgaWYgKCBzZXRGaWx0ZXIgKSB7XHJcbiAgICAgICAgICAgICAgd3JhcHBlci5jb250ZXh0LmZpbHRlciA9ICdub25lJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGNoaWxkLnJlbmRlclRvQ2FudmFzU3VidHJlZSggd3JhcHBlciwgbWF0cml4ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1hdHJpeC5tdWx0aXBseU1hdHJpeCggY2hpbGQuX3RyYW5zZm9ybS5nZXRJbnZlcnNlKCkgKTtcclxuICAgICAgICB3cmFwcGVyLmNvbnRleHQucmVzdG9yZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAZGVwcmVjYXRlZFxyXG4gICAqIFJlbmRlciB0aGlzIE5vZGUgdG8gdGhlIENhbnZhcyAoY2xlYXJpbmcgaXQgZmlyc3QpXHJcbiAgICovXHJcbiAgcHVibGljIHJlbmRlclRvQ2FudmFzKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCwgYmFja2dyb3VuZENvbG9yPzogc3RyaW5nICk6IHZvaWQge1xyXG5cclxuICAgIGFzc2VydCAmJiBkZXByZWNhdGlvbldhcm5pbmcoICdOb2RlLnJlbmRlclRvQ2FudmFzKCkgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBOb2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkJyApO1xyXG5cclxuICAgIC8vIHNob3VsZCBiYXNpY2FsbHkgcmVzZXQgZXZlcnl0aGluZyAoYW5kIGNsZWFyIHRoZSBDYW52YXMpXHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXMud2lkdGg7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1hc3NpZ25cclxuXHJcbiAgICBpZiAoIGJhY2tncm91bmRDb2xvciApIHtcclxuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBiYWNrZ3JvdW5kQ29sb3I7XHJcbiAgICAgIGNvbnRleHQuZmlsbFJlY3QoIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHdyYXBwZXIgPSBuZXcgQ2FudmFzQ29udGV4dFdyYXBwZXIoIGNhbnZhcywgY29udGV4dCApO1xyXG5cclxuICAgIHRoaXMucmVuZGVyVG9DYW52YXNTdWJ0cmVlKCB3cmFwcGVyLCBNYXRyaXgzLmlkZW50aXR5KCkgKTtcclxuXHJcbiAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpOyAvLyB0aGlzIHdhcyBvcmlnaW5hbGx5IGFzeW5jaHJvbm91cywgc28gd2UgaGFkIGEgY2FsbGJhY2tcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlcnMgdGhpcyBOb2RlIHRvIGFuIEhUTUxDYW52YXNFbGVtZW50LiBJZiB0b0NhbnZhcyggY2FsbGJhY2sgKSBpcyB1c2VkLCB0aGUgY2FudmFzIHdpbGwgY29udGFpbiB0aGUgbm9kZSdzXHJcbiAgICogZW50aXJlIGJvdW5kcyAoaWYgbm8geC95L3dpZHRoL2hlaWdodCBpcyBwcm92aWRlZClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIGNhbGxiYWNrKCBjYW52YXMsIHgsIHksIHdpZHRoLCBoZWlnaHQgKSBpcyBjYWxsZWQsIHdoZXJlIHgseSBhcmUgY29tcHV0ZWQgaWYgbm90IHNwZWNpZmllZC5cclxuICAgKiBAcGFyYW0gW3hdIC0gVGhlIFggb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3ldIC0gVGhlIFkgb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3dpZHRoXSAtIFRoZSB3aWR0aCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqIEBwYXJhbSBbaGVpZ2h0XSAtIFRoZSBoZWlnaHQgb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKi9cclxuICBwdWJsaWMgdG9DYW52YXMoIGNhbGxiYWNrOiAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApID0+IHZvaWQsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICBjb25zdCBwYWRkaW5nID0gMjsgLy8gcGFkZGluZyB1c2VkIGlmIHggYW5kIHkgYXJlIG5vdCBzZXRcclxuXHJcbiAgICAvLyBmb3Igbm93LCB3ZSBhZGQgYW4gdW5wbGVhc2FudCBoYWNrIGFyb3VuZCBUZXh0IGFuZCBzYWZlIGJvdW5kcyBpbiBnZW5lcmFsLiBXZSBkb24ndCB3YW50IHRvIGFkZCBhbm90aGVyIEJvdW5kczIgb2JqZWN0IHBlciBOb2RlIGZvciBub3cuXHJcbiAgICBjb25zdCBib3VuZHMgPSB0aGlzLmdldEJvdW5kcygpLnVuaW9uKCB0aGlzLmxvY2FsVG9QYXJlbnRCb3VuZHMoIHRoaXMuZ2V0U2FmZVNlbGZCb3VuZHMoKSApICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhYm91bmRzLmlzRW1wdHkoKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgKCB4ICE9PSB1bmRlZmluZWQgJiYgeSAhPT0gdW5kZWZpbmVkICYmIHdpZHRoICE9PSB1bmRlZmluZWQgJiYgaGVpZ2h0ICE9PSB1bmRlZmluZWQgKSxcclxuICAgICAgJ1Nob3VsZCBub3QgY2FsbCB0b0NhbnZhcyBvbiBhIE5vZGUgd2l0aCBlbXB0eSBib3VuZHMsIHVubGVzcyBhbGwgZGltZW5zaW9ucyBhcmUgcHJvdmlkZWQnICk7XHJcblxyXG4gICAgeCA9IHggIT09IHVuZGVmaW5lZCA/IHggOiBNYXRoLmNlaWwoIHBhZGRpbmcgLSBib3VuZHMubWluWCApO1xyXG4gICAgeSA9IHkgIT09IHVuZGVmaW5lZCA/IHkgOiBNYXRoLmNlaWwoIHBhZGRpbmcgLSBib3VuZHMubWluWSApO1xyXG4gICAgd2lkdGggPSB3aWR0aCAhPT0gdW5kZWZpbmVkID8gd2lkdGggOiBNYXRoLmNlaWwoIGJvdW5kcy5nZXRXaWR0aCgpICsgMiAqIHBhZGRpbmcgKTtcclxuICAgIGhlaWdodCA9IGhlaWdodCAhPT0gdW5kZWZpbmVkID8gaGVpZ2h0IDogTWF0aC5jZWlsKCBib3VuZHMuZ2V0SGVpZ2h0KCkgKyAyICogcGFkZGluZyApO1xyXG5cclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoICcyZCcgKSE7XHJcblxyXG4gICAgLy8gc2hpZnQgb3VyIHJlbmRlcmluZyBvdmVyIGJ5IHRoZSBkZXNpcmVkIGFtb3VudFxyXG4gICAgY29udGV4dC50cmFuc2xhdGUoIHgsIHkgKTtcclxuXHJcbiAgICAvLyBmb3IgQVBJIGNvbXBhdGliaWxpdHksIHdlIGFwcGx5IG91ciBvd24gdHJhbnNmb3JtIGhlcmVcclxuICAgIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5jYW52YXNBcHBlbmRUcmFuc2Zvcm0oIGNvbnRleHQgKTtcclxuXHJcbiAgICBjb25zdCB3cmFwcGVyID0gbmV3IENhbnZhc0NvbnRleHRXcmFwcGVyKCBjYW52YXMsIGNvbnRleHQgKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlclRvQ2FudmFzU3VidHJlZSggd3JhcHBlciwgTWF0cml4My50cmFuc2xhdGlvbiggeCwgeSApLnRpbWVzTWF0cml4KCB0aGlzLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkgKSApO1xyXG5cclxuICAgIGNhbGxiYWNrKCBjYW52YXMsIHgsIHksIHdpZHRoLCBoZWlnaHQgKTsgLy8gd2UgdXNlZCB0byBiZSBhc3luY2hyb25vdXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlcnMgdGhpcyBOb2RlIHRvIGEgQ2FudmFzLCB0aGVuIGNhbGxzIHRoZSBjYWxsYmFjayB3aXRoIHRoZSBkYXRhIFVSSSBmcm9tIGl0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gY2FsbGJhY2soIGRhdGFVUkkge3N0cmluZ30sIHgsIHksIHdpZHRoLCBoZWlnaHQgKSBpcyBjYWxsZWQsIHdoZXJlIHgseSBhcmUgY29tcHV0ZWQgaWYgbm90IHNwZWNpZmllZC5cclxuICAgKiBAcGFyYW0gW3hdIC0gVGhlIFggb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3ldIC0gVGhlIFkgb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3dpZHRoXSAtIFRoZSB3aWR0aCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqIEBwYXJhbSBbaGVpZ2h0XSAtIFRoZSBoZWlnaHQgb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKi9cclxuICBwdWJsaWMgdG9EYXRhVVJMKCBjYWxsYmFjazogKCBkYXRhVVJJOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApID0+IHZvaWQsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICB0aGlzLnRvQ2FudmFzKCAoIGNhbnZhcywgeCwgeSwgd2lkdGgsIGhlaWdodCApID0+IHtcclxuICAgICAgLy8gdGhpcyB4IGFuZCB5IHNoYWRvdyB0aGUgb3V0c2lkZSBwYXJhbWV0ZXJzLCBhbmQgd2lsbCBiZSBkaWZmZXJlbnQgaWYgdGhlIG91dHNpZGUgcGFyYW1ldGVycyBhcmUgdW5kZWZpbmVkXHJcbiAgICAgIGNhbGxiYWNrKCBjYW52YXMudG9EYXRhVVJMKCksIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgIH0sIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBjYWxsYmFjayB3aXRoIGFuIEhUTUxJbWFnZUVsZW1lbnQgdGhhdCBjb250YWlucyB0aGlzIE5vZGUncyBzdWJ0cmVlJ3MgdmlzdWFsIGZvcm0uXHJcbiAgICogV2lsbCBhbHdheXMgYmUgYXN5bmNocm9ub3VzLlxyXG4gICAqIEBkZXByZWNhdGVkIC0gVXNlIG5vZGUucmFzdGVyaXplZCgpIGZvciBjcmVhdGluZyBhIHJhc3Rlcml6ZWQgY29weSwgb3IgZ2VuZXJhbGx5IGl0J3MgYmVzdCB0byBnZXQgdGhlIGRhdGFcclxuICAgKiAgICAgICAgICAgICAgIFVSTCBpbnN0ZWFkIGRpcmVjdGx5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gY2FsbGJhY2soIGltYWdlIHtIVE1MSW1hZ2VFbGVtZW50fSwgeCwgeSApIGlzIGNhbGxlZFxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0ltYWdlKCBjYWxsYmFjazogKCBpbWFnZTogSFRNTEltYWdlRWxlbWVudCwgeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkLCB4PzogbnVtYmVyLCB5PzogbnVtYmVyLCB3aWR0aD86IG51bWJlciwgaGVpZ2h0PzogbnVtYmVyICk6IHZvaWQge1xyXG5cclxuICAgIGFzc2VydCAmJiBkZXByZWNhdGlvbldhcm5pbmcoICdOb2RlLnRvSW1hZ2UoKSBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIE5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQnICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB4ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB4IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeSA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeSBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB3aWR0aCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIHdpZHRoID09PSAnbnVtYmVyJyAmJiB3aWR0aCA+PSAwICYmICggd2lkdGggJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCB3aWR0aCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIGhlaWdodCA9PT0gJ251bWJlcicgJiYgaGVpZ2h0ID49IDAgJiYgKCBoZWlnaHQgJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCBoZWlnaHQgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgdGhpcy50b0RhdGFVUkwoICggdXJsLCB4LCB5ICkgPT4ge1xyXG4gICAgICAvLyB0aGlzIHggYW5kIHkgc2hhZG93IHRoZSBvdXRzaWRlIHBhcmFtZXRlcnMsIGFuZCB3aWxsIGJlIGRpZmZlcmVudCBpZiB0aGUgb3V0c2lkZSBwYXJhbWV0ZXJzIGFyZSB1bmRlZmluZWRcclxuICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcclxuICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICBjYWxsYmFjayggaW1nLCB4LCB5ICk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBJIGJlbGlldmUgd2UgbmVlZCB0byBkZWxldGUgdGhpc1xyXG4gICAgICAgICAgZGVsZXRlIGltZy5vbmxvYWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgIH0gLy8gZmFpbHMgb24gU2FmYXJpIDUuMVxyXG4gICAgICB9O1xyXG4gICAgICBpbWcuc3JjID0gdXJsO1xyXG4gICAgfSwgeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIGNhbGxiYWNrIHdpdGggYW4gSW1hZ2UgTm9kZSB0aGF0IGNvbnRhaW5zIHRoaXMgTm9kZSdzIHN1YnRyZWUncyB2aXN1YWwgZm9ybS4gVGhpcyBpcyBhbHdheXNcclxuICAgKiBhc3luY2hyb25vdXMsIGJ1dCB0aGUgcmVzdWx0aW5nIGltYWdlIE5vZGUgY2FuIGJlIHVzZWQgd2l0aCBhbnkgYmFjay1lbmQgKENhbnZhcy9XZWJHTC9TVkcvZXRjLilcclxuICAgKiBAZGVwcmVjYXRlZCAtIFVzZSBub2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkIChzaG91bGQgYXZvaWQgdGhlIGFzeW5jaHJvbm91cy1uZXNzKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gY2FsbGJhY2soIGltYWdlTm9kZSB7SW1hZ2V9ICkgaXMgY2FsbGVkXHJcbiAgICogQHBhcmFtIFt4XSAtIFRoZSBYIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt5XSAtIFRoZSBZIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSBUaGUgd2lkdGggb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBUaGUgaGVpZ2h0IG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRvSW1hZ2VOb2RlQXN5bmNocm9ub3VzKCBjYWxsYmFjazogKCBpbWFnZTogTm9kZSApID0+IHZvaWQsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGRlcHJlY2F0aW9uV2FybmluZyggJ05vZGUudG9JbWFnZU5vZGVBc3luY3Job25vdXMoKSBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIE5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQnICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB4ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB4IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeSA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeSBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB3aWR0aCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIHdpZHRoID09PSAnbnVtYmVyJyAmJiB3aWR0aCA+PSAwICYmICggd2lkdGggJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCB3aWR0aCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIGhlaWdodCA9PT0gJ251bWJlcicgJiYgaGVpZ2h0ID49IDAgJiYgKCBoZWlnaHQgJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCBoZWlnaHQgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgdGhpcy50b0ltYWdlKCAoIGltYWdlLCB4LCB5ICkgPT4ge1xyXG4gICAgICBjYWxsYmFjayggbmV3IE5vZGUoIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1odG1sLWNvbnN0cnVjdG9yc1xyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICBuZXcgSW1hZ2UoIGltYWdlLCB7IHg6IC14LCB5OiAteSB9IClcclxuICAgICAgICBdXHJcbiAgICAgIH0gKSApO1xyXG4gICAgfSwgeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIE5vZGUgY29udGFpbmluZyBhbiBJbWFnZSBOb2RlIHRoYXQgY29udGFpbnMgdGhpcyBOb2RlJ3Mgc3VidHJlZSdzIHZpc3VhbCBmb3JtLiBUaGlzIGlzIGFsd2F5c1xyXG4gICAqIHN5bmNocm9ub3VzLCBidXQgdGhlIHJlc3VsdGluZyBpbWFnZSBOb2RlIGNhbiBPTkxZIHVzZWQgd2l0aCBDYW52YXMvV2ViR0wgKE5PVCBTVkcpLlxyXG4gICAqIEBkZXByZWNhdGVkIC0gVXNlIG5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQsIHNob3VsZCBiZSBtb3N0bHkgZXF1aXZhbGVudCBpZiB1c2VDYW52YXM6dHJ1ZSBpcyBwcm92aWRlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0NhbnZhc05vZGVTeW5jaHJvbm91cyggeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlciApOiBOb2RlIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgZGVwcmVjYXRpb25XYXJuaW5nKCAnTm9kZS50b0NhbnZhc05vZGVTeW5jaHJvbm91cygpIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgTm9kZS5yYXN0ZXJpemVkKCkgaW5zdGVhZCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICBsZXQgcmVzdWx0OiBOb2RlIHwgbnVsbCA9IG51bGw7XHJcbiAgICB0aGlzLnRvQ2FudmFzKCAoIGNhbnZhcywgeCwgeSApID0+IHtcclxuICAgICAgcmVzdWx0ID0gbmV3IE5vZGUoIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1odG1sLWNvbnN0cnVjdG9yc1xyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICBuZXcgSW1hZ2UoIGNhbnZhcywgeyB4OiAteCwgeTogLXkgfSApXHJcbiAgICAgICAgXVxyXG4gICAgICB9ICk7XHJcbiAgICB9LCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXN1bHQsICd0b0NhbnZhc05vZGVTeW5jaHJvbm91cyByZXF1aXJlcyB0aGF0IHRoZSBub2RlIGNhbiBiZSByZW5kZXJlZCBvbmx5IHVzaW5nIENhbnZhcycgKTtcclxuICAgIHJldHVybiByZXN1bHQhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBJbWFnZSB0aGF0IHJlbmRlcnMgdGhpcyBOb2RlLiBUaGlzIGlzIGFsd2F5cyBzeW5jaHJvbm91cywgYW5kIHNldHMgaW5pdGlhbFdpZHRoL2luaXRpYWxIZWlnaHQgc28gdGhhdFxyXG4gICAqIHdlIGhhdmUgdGhlIGJvdW5kcyBpbW1lZGlhdGVseS4gIFVzZSB0aGlzIG1ldGhvZCBpZiB5b3UgbmVlZCB0byByZWR1Y2UgdGhlIG51bWJlciBvZiBwYXJlbnQgTm9kZXMuXHJcbiAgICpcclxuICAgKiBOT1RFOiB0aGUgcmVzdWx0YW50IEltYWdlIHNob3VsZCBiZSBwb3NpdGlvbmVkIHVzaW5nIGl0cyBib3VuZHMgcmF0aGVyIHRoYW4gKHgseSkuICBUbyBjcmVhdGUgYSBOb2RlIHRoYXQgY2FuIGJlXHJcbiAgICogcG9zaXRpb25lZCBsaWtlIGFueSBvdGhlciBub2RlLCBwbGVhc2UgdXNlIHRvRGF0YVVSTE5vZGVTeW5jaHJvbm91cy5cclxuICAgKiBAZGVwcmVjYXRlZCAtIFVzZSBub2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkLCBzaG91bGQgYmUgbW9zdGx5IGVxdWl2YWxlbnQgaWYgd3JhcDpmYWxzZSBpcyBwcm92aWRlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0RhdGFVUkxJbWFnZVN5bmNocm9ub3VzKCB4PzogbnVtYmVyLCB5PzogbnVtYmVyLCB3aWR0aD86IG51bWJlciwgaGVpZ2h0PzogbnVtYmVyICk6IEltYWdlIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgZGVwcmVjYXRpb25XYXJuaW5nKCAnTm9kZS50b0RhdGFVUkxJbWFnZVN5Y2hyb25vdXMoKSBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIE5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQnICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB4ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB4IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeSA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeSBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB3aWR0aCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIHdpZHRoID09PSAnbnVtYmVyJyAmJiB3aWR0aCA+PSAwICYmICggd2lkdGggJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCB3aWR0aCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIGhlaWdodCA9PT0gJ251bWJlcicgJiYgaGVpZ2h0ID49IDAgJiYgKCBoZWlnaHQgJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCBoZWlnaHQgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgbGV0IHJlc3VsdDogSW1hZ2UgfCBudWxsID0gbnVsbDtcclxuICAgIHRoaXMudG9EYXRhVVJMKCAoIGRhdGFVUkwsIHgsIHksIHdpZHRoLCBoZWlnaHQgKSA9PiB7XHJcbiAgICAgIHJlc3VsdCA9IG5ldyBJbWFnZSggZGF0YVVSTCwgeyB4OiAteCwgeTogLXksIGluaXRpYWxXaWR0aDogd2lkdGgsIGluaXRpYWxIZWlnaHQ6IGhlaWdodCB9ICk7XHJcbiAgICB9LCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXN1bHQsICd0b0RhdGFVUkwgZmFpbGVkIHRvIHJldHVybiBhIHJlc3VsdCBzeW5jaHJvbm91c2x5JyApO1xyXG4gICAgcmV0dXJuIHJlc3VsdCE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgTm9kZSB0aGF0IGNvbnRhaW5zIHRoaXMgTm9kZSdzIHN1YnRyZWUncyB2aXN1YWwgZm9ybS4gVGhpcyBpcyBhbHdheXMgc3luY2hyb25vdXMsIGFuZCBzZXRzXHJcbiAgICogaW5pdGlhbFdpZHRoL2luaXRpYWxIZWlnaHQgc28gdGhhdCB3ZSBoYXZlIHRoZSBib3VuZHMgaW1tZWRpYXRlbHkuICBBbiBleHRyYSB3cmFwcGVyIE5vZGUgaXMgcHJvdmlkZWRcclxuICAgKiBzbyB0aGF0IHRyYW5zZm9ybXMgY2FuIGJlIGRvbmUgaW5kZXBlbmRlbnRseS4gIFVzZSB0aGlzIG1ldGhvZCBpZiB5b3UgbmVlZCB0byBiZSBhYmxlIHRvIHRyYW5zZm9ybSB0aGUgbm9kZVxyXG4gICAqIHRoZSBzYW1lIHdheSBhcyBpZiBpdCBoYWQgbm90IGJlZW4gcmFzdGVyaXplZC5cclxuICAgKiBAZGVwcmVjYXRlZCAtIFVzZSBub2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkLCBzaG91bGQgYmUgbW9zdGx5IGVxdWl2YWxlbnRcclxuICAgKlxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0RhdGFVUkxOb2RlU3luY2hyb25vdXMoIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogTm9kZSB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGRlcHJlY2F0aW9uV2FybmluZyggJ05vZGUudG9EYXRhVVJMTm9kZVN5bmNocm9ub3VzKCkgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBOb2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHggPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeCA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeCBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHkgPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHkgc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggd2lkdGggPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiB3aWR0aCA9PT0gJ251bWJlcicgJiYgd2lkdGggPj0gMCAmJiAoIHdpZHRoICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgd2lkdGggc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBoZWlnaHQgPT09ICdudW1iZXInICYmIGhlaWdodCA+PSAwICYmICggaGVpZ2h0ICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgaGVpZ2h0IHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG5cclxuICAgIHJldHVybiBuZXcgTm9kZSggeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWh0bWwtY29uc3RydWN0b3JzXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgdGhpcy50b0RhdGFVUkxJbWFnZVN5bmNocm9ub3VzKCB4LCB5LCB3aWR0aCwgaGVpZ2h0IClcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIE5vZGUgKGJhY2tlZCBieSBhIHNjZW5lcnkgSW1hZ2UpIHRoYXQgaXMgYSByYXN0ZXJpemVkIHZlcnNpb24gb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXSAtIFNlZSBiZWxvdyBvcHRpb25zLiBUaGlzIGlzIGFsc28gcGFzc2VkIGRpcmVjdGx5IHRvIHRoZSBjcmVhdGVkIEltYWdlIG9iamVjdC5cclxuICAgKi9cclxuICBwdWJsaWMgcmFzdGVyaXplZCggcHJvdmlkZWRPcHRpb25zPzogUmFzdGVyaXplZE9wdGlvbnMgKTogTm9kZSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFJhc3Rlcml6ZWRPcHRpb25zLCBSYXN0ZXJpemVkT3B0aW9ucz4oKSgge1xyXG4gICAgICByZXNvbHV0aW9uOiAxLFxyXG4gICAgICBzb3VyY2VCb3VuZHM6IG51bGwsXHJcbiAgICAgIHVzZVRhcmdldEJvdW5kczogdHJ1ZSxcclxuICAgICAgd3JhcDogdHJ1ZSxcclxuICAgICAgdXNlQ2FudmFzOiBmYWxzZSxcclxuICAgICAgaW1hZ2VPcHRpb25zOiB7fVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgcmVzb2x1dGlvbiA9IG9wdGlvbnMucmVzb2x1dGlvbjtcclxuICAgIGNvbnN0IHNvdXJjZUJvdW5kcyA9IG9wdGlvbnMuc291cmNlQm91bmRzO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXNvbHV0aW9uID09PSAnbnVtYmVyJyAmJiByZXNvbHV0aW9uID4gMCwgJ3Jlc29sdXRpb24gc2hvdWxkIGJlIGEgcG9zaXRpdmUgbnVtYmVyJyApO1xyXG4gICAgICBhc3NlcnQoIHNvdXJjZUJvdW5kcyA9PT0gbnVsbCB8fCBzb3VyY2VCb3VuZHMgaW5zdGFuY2VvZiBCb3VuZHMyLCAnc291cmNlQm91bmRzIHNob3VsZCBiZSBudWxsIG9yIGEgQm91bmRzMicgKTtcclxuICAgICAgaWYgKCBzb3VyY2VCb3VuZHMgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCBzb3VyY2VCb3VuZHMuaXNWYWxpZCgpLCAnc291cmNlQm91bmRzIHNob3VsZCBiZSB2YWxpZCAoZmluaXRlIG5vbi1uZWdhdGl2ZSknICk7XHJcbiAgICAgICAgYXNzZXJ0KCBOdW1iZXIuaXNJbnRlZ2VyKCBzb3VyY2VCb3VuZHMud2lkdGggKSwgJ3NvdXJjZUJvdW5kcy53aWR0aCBzaG91bGQgYmUgYW4gaW50ZWdlcicgKTtcclxuICAgICAgICBhc3NlcnQoIE51bWJlci5pc0ludGVnZXIoIHNvdXJjZUJvdW5kcy5oZWlnaHQgKSwgJ3NvdXJjZUJvdW5kcy5oZWlnaHQgc2hvdWxkIGJlIGFuIGludGVnZXInICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSdsbCBuZWVkIHRvIHdyYXAgaXQgaW4gYSBjb250YWluZXIgTm9kZSB0ZW1wb3JhcmlseSAod2hpbGUgcmFzdGVyaXppbmcpIGZvciB0aGUgc2NhbGVcclxuICAgIGNvbnN0IHdyYXBwZXJOb2RlID0gbmV3IE5vZGUoIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1odG1sLWNvbnN0cnVjdG9yc1xyXG4gICAgICBzY2FsZTogcmVzb2x1dGlvbixcclxuICAgICAgY2hpbGRyZW46IFsgdGhpcyBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgbGV0IHRyYW5zZm9ybWVkQm91bmRzID0gc291cmNlQm91bmRzIHx8IHRoaXMuZ2V0U2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcygpLmRpbGF0ZWQoIDIgKS5yb3VuZGVkT3V0KCk7XHJcblxyXG4gICAgLy8gVW5mb3J0dW5hdGVseSBpZiB3ZSBwcm92aWRlIGEgcmVzb2x1dGlvbiBBTkQgYm91bmRzLCB3ZSBjYW4ndCB1c2UgdGhlIHNvdXJjZSBib3VuZHMgZGlyZWN0bHkuXHJcbiAgICBpZiAoIHJlc29sdXRpb24gIT09IDEgKSB7XHJcbiAgICAgIHRyYW5zZm9ybWVkQm91bmRzID0gbmV3IEJvdW5kczIoXHJcbiAgICAgICAgcmVzb2x1dGlvbiAqIHRyYW5zZm9ybWVkQm91bmRzLm1pblgsXHJcbiAgICAgICAgcmVzb2x1dGlvbiAqIHRyYW5zZm9ybWVkQm91bmRzLm1pblksXHJcbiAgICAgICAgcmVzb2x1dGlvbiAqIHRyYW5zZm9ybWVkQm91bmRzLm1heFgsXHJcbiAgICAgICAgcmVzb2x1dGlvbiAqIHRyYW5zZm9ybWVkQm91bmRzLm1heFlcclxuICAgICAgKTtcclxuICAgICAgLy8gQ29tcGVuc2F0ZSBmb3Igbm9uLWludGVncmFsIHRyYW5zZm9ybWVkQm91bmRzIGFmdGVyIG91ciByZXNvbHV0aW9uIHRyYW5zZm9ybVxyXG4gICAgICBpZiAoIHRyYW5zZm9ybWVkQm91bmRzLndpZHRoICUgMSAhPT0gMCApIHtcclxuICAgICAgICB0cmFuc2Zvcm1lZEJvdW5kcy5tYXhYICs9IDEgLSAoIHRyYW5zZm9ybWVkQm91bmRzLndpZHRoICUgMSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdHJhbnNmb3JtZWRCb3VuZHMuaGVpZ2h0ICUgMSAhPT0gMCApIHtcclxuICAgICAgICB0cmFuc2Zvcm1lZEJvdW5kcy5tYXhZICs9IDEgLSAoIHRyYW5zZm9ybWVkQm91bmRzLmhlaWdodCAlIDEgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbWFnZTogSW1hZ2UgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAvLyBOT1RFOiBUaGlzIGNhbGxiYWNrIGlzIGV4ZWN1dGVkIFNZTkNIUk9OT1VTTFlcclxuICAgIGZ1bmN0aW9uIGNhbGxiYWNrKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IGltYWdlU291cmNlID0gb3B0aW9ucy51c2VDYW52YXMgPyBjYW52YXMgOiBjYW52YXMudG9EYXRhVVJMKCk7XHJcblxyXG4gICAgICBpbWFnZSA9IG5ldyBJbWFnZSggaW1hZ2VTb3VyY2UsIGNvbWJpbmVPcHRpb25zPEltYWdlT3B0aW9ucz4oIHt9LCBvcHRpb25zLmltYWdlT3B0aW9ucywge1xyXG4gICAgICAgIHg6IC14LFxyXG4gICAgICAgIHk6IC15LFxyXG4gICAgICAgIGluaXRpYWxXaWR0aDogd2lkdGgsXHJcbiAgICAgICAgaW5pdGlhbEhlaWdodDogaGVpZ2h0XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgLy8gV2UgbmVlZCB0byBwcmVwZW5kIHRoZSBzY2FsZSBkdWUgdG8gb3JkZXIgb2Ygb3BlcmF0aW9uc1xyXG4gICAgICBpbWFnZS5zY2FsZSggMSAvIHJlc29sdXRpb24sIDEgLyByZXNvbHV0aW9uLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTk9URTogUm91bmRpbmcgbmVjZXNzYXJ5IGR1ZSB0byBmbG9hdGluZyBwb2ludCBhcml0aG1ldGljIGluIHRoZSB3aWR0aC9oZWlnaHQgY29tcHV0YXRpb24gb2YgdGhlIGJvdW5kc1xyXG4gICAgd3JhcHBlck5vZGUudG9DYW52YXMoIGNhbGxiYWNrLCAtdHJhbnNmb3JtZWRCb3VuZHMubWluWCwgLXRyYW5zZm9ybWVkQm91bmRzLm1pblksIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB0cmFuc2Zvcm1lZEJvdW5kcy53aWR0aCApLCBVdGlscy5yb3VuZFN5bW1ldHJpYyggdHJhbnNmb3JtZWRCb3VuZHMuaGVpZ2h0ICkgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbWFnZSwgJ1RoZSB0b0NhbnZhcyBzaG91bGQgaGF2ZSBleGVjdXRlZCBzeW5jaHJvbm91c2x5JyApO1xyXG5cclxuICAgIHdyYXBwZXJOb2RlLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAvLyBGb3Igb3VyIHVzZVRhcmdldEJvdW5kcyBvcHRpb24sIHdlIGRvIE5PVCB3YW50IHRvIGluY2x1ZGUgYW55IFwic2FmZVwiIGJvdW5kcywgYW5kIGluc3RlYWQgd2FudCB0byBzdGF5IHRydWUgdG9cclxuICAgIC8vIHRoZSBvcmlnaW5hbCBib3VuZHMuIFdlIGRvIGZpbHRlciBvdXQgaW52aXNpYmxlIHN1YnRyZWVzIHRvIHNldCB0aGUgYm91bmRzLlxyXG4gICAgbGV0IGZpbmFsUGFyZW50Qm91bmRzID0gdGhpcy5nZXRWaXNpYmxlQm91bmRzKCk7XHJcbiAgICBpZiAoIHNvdXJjZUJvdW5kcyApIHtcclxuICAgICAgLy8gSWYgd2UgcHJvdmlkZSBzb3VyY2VCb3VuZHMsIGRvbid0IGhhdmUgcmVzdWx0aW5nIGJvdW5kcyB0aGF0IGdvIG91dHNpZGUuXHJcbiAgICAgIGZpbmFsUGFyZW50Qm91bmRzID0gc291cmNlQm91bmRzLmludGVyc2VjdGlvbiggZmluYWxQYXJlbnRCb3VuZHMgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIG9wdGlvbnMudXNlVGFyZ2V0Qm91bmRzICkge1xyXG4gICAgICBpbWFnZSEuaW1hZ2VCb3VuZHMgPSBpbWFnZSEucGFyZW50VG9Mb2NhbEJvdW5kcyggZmluYWxQYXJlbnRCb3VuZHMgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIG9wdGlvbnMud3JhcCApIHtcclxuICAgICAgY29uc3Qgd3JhcHBlZE5vZGUgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBpbWFnZSEgXSB9ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taHRtbC1jb25zdHJ1Y3RvcnNcclxuICAgICAgaWYgKCBvcHRpb25zLnVzZVRhcmdldEJvdW5kcyApIHtcclxuICAgICAgICB3cmFwcGVkTm9kZS5sb2NhbEJvdW5kcyA9IGZpbmFsUGFyZW50Qm91bmRzO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB3cmFwcGVkTm9kZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIG9wdGlvbnMudXNlVGFyZ2V0Qm91bmRzICkge1xyXG4gICAgICAgIGltYWdlIS5sb2NhbEJvdW5kcyA9IGltYWdlIS5wYXJlbnRUb0xvY2FsQm91bmRzKCBmaW5hbFBhcmVudEJvdW5kcyApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBpbWFnZSE7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgRE9NIGRyYXdhYmxlIGZvciB0aGlzIE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEltcGxlbWVudGVkIGJ5IHN1YnR5cGVzIHRoYXQgc3VwcG9ydCBET00gc2VsZiBkcmF3YWJsZXMuIFRoZXJlIGlzIG5vIG5lZWQgdG8gaW1wbGVtZW50IHRoaXMgZm9yIHN1YnR5cGVzIHRoYXRcclxuICAgKiBkbyBub3QgYWxsb3cgdGhlIERPTSByZW5kZXJlciAobm90IHNldCBpbiBpdHMgcmVuZGVyZXJCaXRtYXNrKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjcmVhdGVET01EcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IERPTVNlbGZEcmF3YWJsZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdjcmVhdGVET01EcmF3YWJsZSBpcyBhYnN0cmFjdC4gVGhlIHN1YnR5cGUgc2hvdWxkIGVpdGhlciBvdmVycmlkZSB0aGlzIG1ldGhvZCwgb3Igbm90IHN1cHBvcnQgdGhlIERPTSByZW5kZXJlcicgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gU1ZHIGRyYXdhYmxlIGZvciB0aGlzIE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEltcGxlbWVudGVkIGJ5IHN1YnR5cGVzIHRoYXQgc3VwcG9ydCBTVkcgc2VsZiBkcmF3YWJsZXMuIFRoZXJlIGlzIG5vIG5lZWQgdG8gaW1wbGVtZW50IHRoaXMgZm9yIHN1YnR5cGVzIHRoYXRcclxuICAgKiBkbyBub3QgYWxsb3cgdGhlIFNWRyByZW5kZXJlciAobm90IHNldCBpbiBpdHMgcmVuZGVyZXJCaXRtYXNrKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjcmVhdGVTVkdEcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IFNWR1NlbGZEcmF3YWJsZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdjcmVhdGVTVkdEcmF3YWJsZSBpcyBhYnN0cmFjdC4gVGhlIHN1YnR5cGUgc2hvdWxkIGVpdGhlciBvdmVycmlkZSB0aGlzIG1ldGhvZCwgb3Igbm90IHN1cHBvcnQgdGhlIERPTSByZW5kZXJlcicgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBDYW52YXMgZHJhd2FibGUgZm9yIHRoaXMgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24uIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogSW1wbGVtZW50ZWQgYnkgc3VidHlwZXMgdGhhdCBzdXBwb3J0IENhbnZhcyBzZWxmIGRyYXdhYmxlcy4gVGhlcmUgaXMgbm8gbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBmb3Igc3VidHlwZXMgdGhhdFxyXG4gICAqIGRvIG5vdCBhbGxvdyB0aGUgQ2FudmFzIHJlbmRlcmVyIChub3Qgc2V0IGluIGl0cyByZW5kZXJlckJpdG1hc2spLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZUNhbnZhc0RyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogQ2FudmFzU2VsZkRyYXdhYmxlIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ2NyZWF0ZUNhbnZhc0RyYXdhYmxlIGlzIGFic3RyYWN0LiBUaGUgc3VidHlwZSBzaG91bGQgZWl0aGVyIG92ZXJyaWRlIHRoaXMgbWV0aG9kLCBvciBub3Qgc3VwcG9ydCB0aGUgRE9NIHJlbmRlcmVyJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIFdlYkdMIGRyYXdhYmxlIGZvciB0aGlzIE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEltcGxlbWVudGVkIGJ5IHN1YnR5cGVzIHRoYXQgc3VwcG9ydCBXZWJHTCBzZWxmIGRyYXdhYmxlcy4gVGhlcmUgaXMgbm8gbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBmb3Igc3VidHlwZXMgdGhhdFxyXG4gICAqIGRvIG5vdCBhbGxvdyB0aGUgV2ViR0wgcmVuZGVyZXIgKG5vdCBzZXQgaW4gaXRzIHJlbmRlcmVyQml0bWFzaykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVuZGVyZXIgLSBJbiB0aGUgYml0bWFzayBmb3JtYXQgc3BlY2lmaWVkIGJ5IFJlbmRlcmVyLCB3aGljaCBtYXkgY29udGFpbiBhZGRpdGlvbmFsIGJpdCBmbGFncy5cclxuICAgKiBAcGFyYW0gaW5zdGFuY2UgLSBJbnN0YW5jZSBvYmplY3QgdGhhdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZHJhd2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgY3JlYXRlV2ViR0xEcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IFdlYkdMU2VsZkRyYXdhYmxlIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ2NyZWF0ZVdlYkdMRHJhd2FibGUgaXMgYWJzdHJhY3QuIFRoZSBzdWJ0eXBlIHNob3VsZCBlaXRoZXIgb3ZlcnJpZGUgdGhpcyBtZXRob2QsIG9yIG5vdCBzdXBwb3J0IHRoZSBET00gcmVuZGVyZXInICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBJbnN0YW5jZSBoYW5kbGluZ1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIGluc3RhbmNlcyBhcnJheS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldEluc3RhbmNlcygpOiBJbnN0YW5jZVtdIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0SW5zdGFuY2VzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb24gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpbnN0YW5jZXMoKTogSW5zdGFuY2VbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRJbnN0YW5jZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gSW5zdGFuY2UgcmVmZXJlbmNlIHRvIG91ciBhcnJheS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGFkZEluc3RhbmNlKCBpbnN0YW5jZTogSW5zdGFuY2UgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9pbnN0YW5jZXMucHVzaCggaW5zdGFuY2UgKTtcclxuXHJcbiAgICB0aGlzLmNoYW5nZWRJbnN0YW5jZUVtaXR0ZXIuZW1pdCggaW5zdGFuY2UsIHRydWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYW4gSW5zdGFuY2UgcmVmZXJlbmNlIGZyb20gb3VyIGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlSW5zdGFuY2UoIGluc3RhbmNlOiBJbnN0YW5jZSApOiB2b2lkIHtcclxuICAgIGNvbnN0IGluZGV4ID0gXy5pbmRleE9mKCB0aGlzLl9pbnN0YW5jZXMsIGluc3RhbmNlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCAhPT0gLTEsICdDYW5ub3QgcmVtb3ZlIGEgSW5zdGFuY2UgZnJvbSBhIE5vZGUgaWYgaXQgd2FzIG5vdCB0aGVyZScgKTtcclxuICAgIHRoaXMuX2luc3RhbmNlcy5zcGxpY2UoIGluZGV4LCAxICk7XHJcblxyXG4gICAgdGhpcy5jaGFuZ2VkSW5zdGFuY2VFbWl0dGVyLmVtaXQoIGluc3RhbmNlLCBmYWxzZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgTm9kZSB3YXMgdmlzdWFsbHkgcmVuZGVyZWQvZGlzcGxheWVkIGJ5IGFueSBEaXNwbGF5IGluIHRoZSBsYXN0IHVwZGF0ZURpc3BsYXkoKSBjYWxsLiBOb3RlXHJcbiAgICogdGhhdCBzb21ldGhpbmcgY2FuIGJlIGluZGVwZW5kZW50bHkgZGlzcGxheWVkIHZpc3VhbGx5LCBhbmQgaW4gdGhlIFBET007IHRoaXMgbWV0aG9kIG9ubHkgY2hlY2tzIHZpc3VhbGx5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtkaXNwbGF5XSAtIGlmIHByb3ZpZGVkLCBvbmx5IGNoZWNrIGlmIHdhcyB2aXNpYmxlIG9uIHRoaXMgcGFydGljdWxhciBEaXNwbGF5XHJcbiAgICovXHJcbiAgcHVibGljIHdhc1Zpc3VhbGx5RGlzcGxheWVkKCBkaXNwbGF5PzogRGlzcGxheSApOiBib29sZWFuIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX2luc3RhbmNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLl9pbnN0YW5jZXNbIGkgXTtcclxuXHJcbiAgICAgIC8vIElmIG5vIGRpc3BsYXkgaXMgcHJvdmlkZWQsIGFueSBpbnN0YW5jZSB2aXNpYmlsaXR5IGlzIGVub3VnaCB0byBiZSB2aXN1YWxseSBkaXNwbGF5ZWRcclxuICAgICAgaWYgKCBpbnN0YW5jZS52aXNpYmxlICYmICggIWRpc3BsYXkgfHwgaW5zdGFuY2UuZGlzcGxheSA9PT0gZGlzcGxheSApICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBEaXNwbGF5IGhhbmRsaW5nXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgZGlzcGxheSBhcnJheS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJvb3RlZERpc3BsYXlzKCk6IERpc3BsYXlbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcm9vdGVkRGlzcGxheXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Um9vdGVkRGlzcGxheXMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJvb3RlZERpc3BsYXlzKCk6IERpc3BsYXlbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRSb290ZWREaXNwbGF5cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBkaXNwbGF5IHJlZmVyZW5jZSB0byBvdXIgYXJyYXkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRSb290ZWREaXNwbGF5KCBkaXNwbGF5OiBEaXNwbGF5ICk6IHZvaWQge1xyXG4gICAgdGhpcy5fcm9vdGVkRGlzcGxheXMucHVzaCggZGlzcGxheSApO1xyXG5cclxuICAgIC8vIERlZmluZWQgaW4gUGFyYWxsZWxET00uanNcclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8ub25BZGRlZFJvb3RlZERpc3BsYXkoIGRpc3BsYXkgKTtcclxuXHJcbiAgICB0aGlzLnJvb3RlZERpc3BsYXlDaGFuZ2VkRW1pdHRlci5lbWl0KCBkaXNwbGF5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgRGlzcGxheSByZWZlcmVuY2UgZnJvbSBvdXIgYXJyYXkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVSb290ZWREaXNwbGF5KCBkaXNwbGF5OiBEaXNwbGF5ICk6IHZvaWQge1xyXG4gICAgY29uc3QgaW5kZXggPSBfLmluZGV4T2YoIHRoaXMuX3Jvb3RlZERpc3BsYXlzLCBkaXNwbGF5ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCAhPT0gLTEsICdDYW5ub3QgcmVtb3ZlIGEgRGlzcGxheSBmcm9tIGEgTm9kZSBpZiBpdCB3YXMgbm90IHRoZXJlJyApO1xyXG4gICAgdGhpcy5fcm9vdGVkRGlzcGxheXMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG5cclxuICAgIC8vIERlZmluZWQgaW4gUGFyYWxsZWxET00uanNcclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8ub25SZW1vdmVkUm9vdGVkRGlzcGxheSggZGlzcGxheSApO1xyXG5cclxuICAgIHRoaXMucm9vdGVkRGlzcGxheUNoYW5nZWRFbWl0dGVyLmVtaXQoIGRpc3BsYXkgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0UmVjdXJzaXZlQ29ubmVjdGVkRGlzcGxheXMoIGRpc3BsYXlzOiBEaXNwbGF5W10gKTogRGlzcGxheVtdIHtcclxuICAgIGlmICggdGhpcy5yb290ZWREaXNwbGF5cy5sZW5ndGggKSB7XHJcbiAgICAgIGRpc3BsYXlzLnB1c2goIC4uLnRoaXMucm9vdGVkRGlzcGxheXMgKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wYXJlbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBkaXNwbGF5cy5wdXNoKCAuLi50aGlzLl9wYXJlbnRzWyBpIF0uZ2V0UmVjdXJzaXZlQ29ubmVjdGVkRGlzcGxheXMoIGRpc3BsYXlzICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkbyBub3QgYWxsb3cgZHVwbGljYXRlIERpc3BsYXlzIHRvIGdldCBjb2xsZWN0ZWQgaW5maW5pdGVseVxyXG4gICAgcmV0dXJuIF8udW5pcSggZGlzcGxheXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIGxpc3Qgb2YgdGhlIGRpc3BsYXlzIHRoYXQgYXJlIGNvbm5lY3RlZCB0byB0aGlzIE5vZGUuIEdhdGhlcmVkIGJ5IGxvb2tpbmcgdXAgdGhlIHNjZW5lIGdyYXBoIGFuY2VzdG9ycyBhbmRcclxuICAgKiBjb2xsZWN0ZWQgYWxsIHJvb3RlZCBEaXNwbGF5cyBhbG9uZyB0aGUgd2F5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb25uZWN0ZWREaXNwbGF5cygpOiBEaXNwbGF5W10ge1xyXG4gICAgcmV0dXJuIF8udW5pcSggdGhpcy5nZXRSZWN1cnNpdmVDb25uZWN0ZWREaXNwbGF5cyggW10gKSApO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogQ29vcmRpbmF0ZSB0cmFuc2Zvcm0gbWV0aG9kc1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBwb2ludCB0cmFuc2Zvcm1lZCBmcm9tIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lIGludG8gb3VyIHBhcmVudCBjb29yZGluYXRlIGZyYW1lLiBBcHBsaWVzIG91ciBub2RlJ3NcclxuICAgKiB0cmFuc2Zvcm0gdG8gaXQuXHJcbiAgICovXHJcbiAgcHVibGljIGxvY2FsVG9QYXJlbnRQb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLnRyYW5zZm9ybVBvc2l0aW9uMiggcG9pbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYm91bmRzIHRyYW5zZm9ybWVkIGZyb20gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgaW50byBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUuIElmIGl0IGluY2x1ZGVzIGFcclxuICAgKiByb3RhdGlvbiwgdGhlIHJlc3VsdGluZyBib3VuZGluZyBib3ggd2lsbCBpbmNsdWRlIGV2ZXJ5IHBvaW50IHRoYXQgY291bGQgaGF2ZSBiZWVuIGluIHRoZSBvcmlnaW5hbCBib3VuZGluZyBib3hcclxuICAgKiAoYW5kIGl0IGNhbiBiZSBleHBhbmRlZCkuXHJcbiAgICovXHJcbiAgcHVibGljIGxvY2FsVG9QYXJlbnRCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm0udHJhbnNmb3JtQm91bmRzMiggYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcG9pbnQgdHJhbnNmb3JtZWQgZnJvbSBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgaW50byBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS4gQXBwbGllcyB0aGUgaW52ZXJzZVxyXG4gICAqIG9mIG91ciBub2RlJ3MgdHJhbnNmb3JtIHRvIGl0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwYXJlbnRUb0xvY2FsUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5pbnZlcnNlUG9zaXRpb24yKCBwb2ludCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBib3VuZHMgdHJhbnNmb3JtZWQgZnJvbSBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgaW50byBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgcGFyZW50VG9Mb2NhbEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5pbnZlcnNlQm91bmRzMiggYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIG11dGFibGUtb3B0aW1pemVkIGZvcm0gb2YgbG9jYWxUb1BhcmVudEJvdW5kcygpIHRoYXQgd2lsbCBtb2RpZnkgdGhlIHByb3ZpZGVkIGJvdW5kcywgdHJhbnNmb3JtaW5nIGl0IGZyb20gb3VyXHJcbiAgICogbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0byBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc2FtZSBib3VuZHMgb2JqZWN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2Zvcm1Cb3VuZHNGcm9tTG9jYWxUb1BhcmVudCggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGJvdW5kcy50cmFuc2Zvcm0oIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBtdXRhYmxlLW9wdGltaXplZCBmb3JtIG9mIHBhcmVudFRvTG9jYWxCb3VuZHMoKSB0aGF0IHdpbGwgbW9kaWZ5IHRoZSBwcm92aWRlZCBib3VuZHMsIHRyYW5zZm9ybWluZyBpdCBmcm9tIG91clxyXG4gICAqIHBhcmVudCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqIEByZXR1cm5zIC0gVGhlIHNhbWUgYm91bmRzIG9iamVjdC5cclxuICAgKi9cclxuICBwdWJsaWMgdHJhbnNmb3JtQm91bmRzRnJvbVBhcmVudFRvTG9jYWwoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBib3VuZHMudHJhbnNmb3JtKCB0aGlzLl90cmFuc2Zvcm0uZ2V0SW52ZXJzZSgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IG1hdHJpeCAoZnJlc2ggY29weSkgdGhhdCB3b3VsZCB0cmFuc2Zvcm0gcG9pbnRzIGZyb20gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgdG8gdGhlIGdsb2JhbFxyXG4gICAqIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxUb0dsb2JhbE1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgbGV0IG5vZGU6IE5vZGUgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpc1xyXG5cclxuICAgIC8vIHdlIG5lZWQgdG8gYXBwbHkgdGhlIHRyYW5zZm9ybWF0aW9ucyBpbiB0aGUgcmV2ZXJzZSBvcmRlciwgc28gd2UgdGVtcG9yYXJpbHkgc3RvcmUgdGhlbVxyXG4gICAgY29uc3QgbWF0cmljZXMgPSBbXTtcclxuXHJcbiAgICAvLyBjb25jYXRlbmF0aW9uIGxpa2UgdGhpcyBoYXMgYmVlbiBmYXN0ZXIgdGhhbiBnZXR0aW5nIGEgdW5pcXVlIHRyYWlsLCBnZXR0aW5nIGl0cyB0cmFuc2Zvcm0sIGFuZCBhcHBseWluZyBpdFxyXG4gICAgd2hpbGUgKCBub2RlICkge1xyXG4gICAgICBtYXRyaWNlcy5wdXNoKCBub2RlLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCkgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fcGFyZW50c1sgMSBdID09PSB1bmRlZmluZWQsICdnZXRMb2NhbFRvR2xvYmFsTWF0cml4IHVuYWJsZSB0byB3b3JrIGZvciBEQUcnICk7XHJcbiAgICAgIG5vZGUgPSBub2RlLl9wYXJlbnRzWyAwIF07XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0cml4ID0gTWF0cml4My5pZGVudGl0eSgpOyAvLyB3aWxsIGJlIG1vZGlmaWVkIGluIHBsYWNlXHJcblxyXG4gICAgLy8gaXRlcmF0ZSBmcm9tIHRoZSBiYWNrIGZvcndhcmRzIChmcm9tIHRoZSByb290IE5vZGUgdG8gaGVyZSlcclxuICAgIGZvciAoIGxldCBpID0gbWF0cmljZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgIG1hdHJpeC5tdWx0aXBseU1hdHJpeCggbWF0cmljZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5PVEU6IGFsd2F5cyByZXR1cm4gYSBmcmVzaCBjb3B5LCBnZXRHbG9iYWxUb0xvY2FsTWF0cml4IGRlcGVuZHMgb24gaXQgdG8gbWluaW1pemUgaW5zdGFuY2UgdXNhZ2UhXHJcbiAgICByZXR1cm4gbWF0cml4O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFRyYW5zZm9ybTMgdGhhdCB3b3VsZCB0cmFuc2Zvcm0gdGhpbmdzIGZyb20gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgdG8gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqIEVxdWl2YWxlbnQgdG8gZ2V0VW5pcXVlVHJhaWwoKS5nZXRUcmFuc2Zvcm0oKSwgYnV0IGZhc3Rlci5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVbmlxdWVUcmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zZm9ybTMoIHRoaXMuZ2V0TG9jYWxUb0dsb2JhbE1hdHJpeCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbmV3IG1hdHJpeCAoZnJlc2ggY29weSkgdGhhdCB3b3VsZCB0cmFuc2Zvcm0gcG9pbnRzIGZyb20gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBsb2NhbFxyXG4gICAqIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0R2xvYmFsVG9Mb2NhbE1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsVG9HbG9iYWxNYXRyaXgoKS5pbnZlcnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zZm9ybXMgYSBwb2ludCBmcm9tIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lIHRvIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBsb2NhbFRvR2xvYmFsUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG5cclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgbGV0IG5vZGU6IE5vZGUgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpc1xyXG4gICAgY29uc3QgcmVzdWx0UG9pbnQgPSBwb2ludC5jb3B5KCk7XHJcbiAgICB3aGlsZSAoIG5vZGUgKSB7XHJcbiAgICAgIC8vIGluLXBsYWNlIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgIG5vZGUuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5tdWx0aXBseVZlY3RvcjIoIHJlc3VsdFBvaW50ICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuX3BhcmVudHNbIDEgXSA9PT0gdW5kZWZpbmVkLCAnbG9jYWxUb0dsb2JhbFBvaW50IHVuYWJsZSB0byB3b3JrIGZvciBEQUcnICk7XHJcbiAgICAgIG5vZGUgPSBub2RlLl9wYXJlbnRzWyAwIF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0UG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGEgcG9pbnQgZnJvbSB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUgdG8gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2xvYmFsVG9Mb2NhbFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuXHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcclxuICAgIGxldCBub2RlOiBOb2RlID0gdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXRoaXNcclxuICAgIC8vIFRPRE86IHBlcmZvcm1hbmNlOiB0ZXN0IHdoZXRoZXIgaXQgaXMgZmFzdGVyIHRvIGdldCBhIHRvdGFsIHRyYW5zZm9ybSBhbmQgdGhlbiBpbnZlcnQgKHdvbid0IGNvbXB1dGUgaW5kaXZpZHVhbCBpbnZlcnNlcykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAvLyB3ZSBuZWVkIHRvIGFwcGx5IHRoZSB0cmFuc2Zvcm1hdGlvbnMgaW4gdGhlIHJldmVyc2Ugb3JkZXIsIHNvIHdlIHRlbXBvcmFyaWx5IHN0b3JlIHRoZW1cclxuICAgIGNvbnN0IHRyYW5zZm9ybXMgPSBbXTtcclxuICAgIHdoaWxlICggbm9kZSApIHtcclxuICAgICAgdHJhbnNmb3Jtcy5wdXNoKCBub2RlLl90cmFuc2Zvcm0gKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fcGFyZW50c1sgMSBdID09PSB1bmRlZmluZWQsICdnbG9iYWxUb0xvY2FsUG9pbnQgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgICAgbm9kZSA9IG5vZGUuX3BhcmVudHNbIDAgXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpdGVyYXRlIGZyb20gdGhlIGJhY2sgZm9yd2FyZHMgKGZyb20gdGhlIHJvb3QgTm9kZSB0byBoZXJlKVxyXG4gICAgY29uc3QgcmVzdWx0UG9pbnQgPSBwb2ludC5jb3B5KCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IHRyYW5zZm9ybXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgIC8vIGluLXBsYWNlIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgIHRyYW5zZm9ybXNbIGkgXS5nZXRJbnZlcnNlKCkubXVsdGlwbHlWZWN0b3IyKCByZXN1bHRQb2ludCApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdFBvaW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNmb3JtcyBib3VuZHMgZnJvbSBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0byB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuIElmIGl0IGluY2x1ZGVzIGFcclxuICAgKiByb3RhdGlvbiwgdGhlIHJlc3VsdGluZyBib3VuZGluZyBib3ggd2lsbCBpbmNsdWRlIGV2ZXJ5IHBvaW50IHRoYXQgY291bGQgaGF2ZSBiZWVuIGluIHRoZSBvcmlnaW5hbCBib3VuZGluZyBib3hcclxuICAgKiAoYW5kIGl0IGNhbiBiZSBleHBhbmRlZCkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgbG9jYWxUb0dsb2JhbEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgLy8gYXBwbHkgdGhlIGJvdW5kcyB0cmFuc2Zvcm0gb25seSBvbmNlLCBzbyB3ZSBjYW4gbWluaW1pemUgdGhlIGV4cGFuc2lvbiBlbmNvdW50ZXJlZCBmcm9tIG11bHRpcGxlIHJvdGF0aW9uc1xyXG4gICAgLy8gaXQgYWxzbyBzZWVtcyB0byBiZSBhIGJpdCBmYXN0ZXIgdGhpcyB3YXlcclxuICAgIHJldHVybiBib3VuZHMudHJhbnNmb3JtZWQoIHRoaXMuZ2V0TG9jYWxUb0dsb2JhbE1hdHJpeCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGJvdW5kcyBmcm9tIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZSB0byBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnbG9iYWxUb0xvY2FsQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICAvLyBhcHBseSB0aGUgYm91bmRzIHRyYW5zZm9ybSBvbmx5IG9uY2UsIHNvIHdlIGNhbiBtaW5pbWl6ZSB0aGUgZXhwYW5zaW9uIGVuY291bnRlcmVkIGZyb20gbXVsdGlwbGUgcm90YXRpb25zXHJcbiAgICByZXR1cm4gYm91bmRzLnRyYW5zZm9ybWVkKCB0aGlzLmdldEdsb2JhbFRvTG9jYWxNYXRyaXgoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNmb3JtcyBhIHBvaW50IGZyb20gb3VyIHBhcmVudCBjb29yZGluYXRlIGZyYW1lIHRvIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwYXJlbnRUb0dsb2JhbFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGFyZW50cy5sZW5ndGggPD0gMSwgJ3BhcmVudFRvR2xvYmFsUG9pbnQgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMubGVuZ3RoID8gdGhpcy5wYXJlbnRzWyAwIF0ubG9jYWxUb0dsb2JhbFBvaW50KCBwb2ludCApIDogcG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGJvdW5kcyBmcm9tIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSB0byB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuIElmIGl0IGluY2x1ZGVzIGFcclxuICAgKiByb3RhdGlvbiwgdGhlIHJlc3VsdGluZyBib3VuZGluZyBib3ggd2lsbCBpbmNsdWRlIGV2ZXJ5IHBvaW50IHRoYXQgY291bGQgaGF2ZSBiZWVuIGluIHRoZSBvcmlnaW5hbCBib3VuZGluZyBib3hcclxuICAgKiAoYW5kIGl0IGNhbiBiZSBleHBhbmRlZCkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgcGFyZW50VG9HbG9iYWxCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGFyZW50cy5sZW5ndGggPD0gMSwgJ3BhcmVudFRvR2xvYmFsQm91bmRzIHVuYWJsZSB0byB3b3JrIGZvciBEQUcnICk7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzLmxlbmd0aCA/IHRoaXMucGFyZW50c1sgMCBdLmxvY2FsVG9HbG9iYWxCb3VuZHMoIGJvdW5kcyApIDogYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNmb3JtcyBhIHBvaW50IGZyb20gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnbG9iYWxUb1BhcmVudFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGFyZW50cy5sZW5ndGggPD0gMSwgJ2dsb2JhbFRvUGFyZW50UG9pbnQgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMubGVuZ3RoID8gdGhpcy5wYXJlbnRzWyAwIF0uZ2xvYmFsVG9Mb2NhbFBvaW50KCBwb2ludCApIDogcG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGJvdW5kcyBmcm9tIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZSB0byBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUuIElmIGl0IGluY2x1ZGVzIGFcclxuICAgKiByb3RhdGlvbiwgdGhlIHJlc3VsdGluZyBib3VuZGluZyBib3ggd2lsbCBpbmNsdWRlIGV2ZXJ5IHBvaW50IHRoYXQgY291bGQgaGF2ZSBiZWVuIGluIHRoZSBvcmlnaW5hbCBib3VuZGluZyBib3hcclxuICAgKiAoYW5kIGl0IGNhbiBiZSBleHBhbmRlZCkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2xvYmFsVG9QYXJlbnRCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGFyZW50cy5sZW5ndGggPD0gMSwgJ2dsb2JhbFRvUGFyZW50Qm91bmRzIHVuYWJsZSB0byB3b3JrIGZvciBEQUcnICk7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzLmxlbmd0aCA/IHRoaXMucGFyZW50c1sgMCBdLmdsb2JhbFRvTG9jYWxCb3VuZHMoIGJvdW5kcyApIDogYm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGJvdW5kaW5nIGJveCBmb3IgdGhpcyBOb2RlIChhbmQgaXRzIHN1Yi10cmVlKSBpbiB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgTm9kZSAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbiAoc2luY2UgdGhlIHRyYW5zZm9ybSB3b3VsZG4ndCBiZSB1bmlxdWVseSBkZWZpbmVkKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgcmVxdWlyZXMgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEdsb2JhbEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGFyZW50cy5sZW5ndGggPD0gMSwgJ2dsb2JhbEJvdW5kcyB1bmFibGUgdG8gd29yayBmb3IgREFHJyApO1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50VG9HbG9iYWxCb3VuZHMoIHRoaXMuZ2V0Qm91bmRzKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRHbG9iYWxCb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZ2xvYmFsQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0R2xvYmFsQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgYW55IG90aGVyIE5vZGUgaW4gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiB0aGlzIG5vZGUgb3IgdGhlIHBhc3NlZCBpbiBOb2RlIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uLlxyXG4gICAqXHJcbiAgICogVE9ETzogUG9zc2libGUgdG8gYmUgd2VsbC1kZWZpbmVkIGFuZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiBlYWNoLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBib3VuZHNPZiggbm9kZTogTm9kZSApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdsb2JhbFRvTG9jYWxCb3VuZHMoIG5vZGUuZ2V0R2xvYmFsQm91bmRzKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiB0aGlzIE5vZGUgaW4gYW5vdGhlciBub2RlJ3MgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoaXMgbm9kZSBvciB0aGUgcGFzc2VkIGluIE5vZGUgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24uXHJcbiAgICpcclxuICAgKiBUT0RPOiBQb3NzaWJsZSB0byBiZSB3ZWxsLWRlZmluZWQgYW5kIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIGVhY2guIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIGJvdW5kc1RvKCBub2RlOiBOb2RlICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIG5vZGUuZ2xvYmFsVG9Mb2NhbEJvdW5kcyggdGhpcy5nZXRHbG9iYWxCb3VuZHMoKSApO1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogRHJhd2FibGUgaGFuZGxpbmdcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIHRoZSBkcmF3YWJsZSB0byBvdXIgbGlzdCBvZiBkcmF3YWJsZXMgdG8gbm90aWZ5IG9mIHZpc3VhbCBjaGFuZ2VzLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgYXR0YWNoRHJhd2FibGUoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB0aGlzIHtcclxuICAgIHRoaXMuX2RyYXdhYmxlcy5wdXNoKCBkcmF3YWJsZSApO1xyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIHRoZSBkcmF3YWJsZSBmcm9tIG91ciBsaXN0IG9mIGRyYXdhYmxlcyB0byBub3RpZnkgb2YgdmlzdWFsIGNoYW5nZXMuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkZXRhY2hEcmF3YWJsZSggZHJhd2FibGU6IERyYXdhYmxlICk6IHRoaXMge1xyXG4gICAgY29uc3QgaW5kZXggPSBfLmluZGV4T2YoIHRoaXMuX2RyYXdhYmxlcywgZHJhd2FibGUgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCA+PSAwLCAnSW52YWxpZCBvcGVyYXRpb246IHRyeWluZyB0byBkZXRhY2ggYSBub24tcmVmZXJlbmNlZCBkcmF3YWJsZScgKTtcclxuXHJcbiAgICB0aGlzLl9kcmF3YWJsZXMuc3BsaWNlKCBpbmRleCwgMSApOyAvLyBUT0RPOiByZXBsYWNlIHdpdGggYSByZW1vdmUoKSBmdW5jdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTY2FucyB0aGUgb3B0aW9ucyBvYmplY3QgZm9yIGtleSBuYW1lcyB0aGF0IGNvcnJlc3BvbmQgdG8gRVM1IHNldHRlcnMgb3Igb3RoZXIgc2V0dGVyIGZ1bmN0aW9ucywgYW5kIGNhbGxzIHRob3NlXHJcbiAgICogd2l0aCB0aGUgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogRm9yIGV4YW1wbGU6XHJcbiAgICpcclxuICAgKiBub2RlLm11dGF0ZSggeyB0b3A6IDAsIGxlZnQ6IDUgfSApO1xyXG4gICAqXHJcbiAgICogd2lsbCBiZSBlcXVpdmFsZW50IHRvOlxyXG4gICAqXHJcbiAgICogbm9kZS5sZWZ0ID0gNTtcclxuICAgKiBub2RlLnRvcCA9IDA7XHJcbiAgICpcclxuICAgKiBJbiBwYXJ0aWN1bGFyLCBub3RlIHRoYXQgdGhlIG9yZGVyIGlzIGRpZmZlcmVudC4gTXV0YXRvcnMgd2lsbCBiZSBhcHBsaWVkIGluIHRoZSBvcmRlciBvZiBfbXV0YXRvcktleXMsIHdoaWNoIGNhblxyXG4gICAqIGJlIGFkZGVkIHRvIGJ5IHN1YnR5cGVzLlxyXG4gICAqXHJcbiAgICogQWRkaXRpb25hbGx5LCBzb21lIGtleXMgYXJlIGFjdHVhbGx5IGRpcmVjdCBmdW5jdGlvbiBuYW1lcywgbGlrZSAnc2NhbGUnLiBtdXRhdGUoIHsgc2NhbGU6IDIgfSApIHdpbGwgY2FsbFxyXG4gICAqIG5vZGUuc2NhbGUoIDIgKSBpbnN0ZWFkIG9mIGFjdGl2YXRpbmcgYW4gRVM1IHNldHRlciBkaXJlY3RseS5cclxuICAgKi9cclxuICBwdWJsaWMgbXV0YXRlKCBvcHRpb25zPzogTm9kZU9wdGlvbnMgKTogdGhpcyB7XHJcblxyXG4gICAgaWYgKCAhb3B0aW9ucyApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggT2JqZWN0LmdldFByb3RvdHlwZU9mKCBvcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICdFeHRyYSBwcm90b3R5cGUgb24gTm9kZSBvcHRpb25zIG9iamVjdCBpcyBhIGNvZGUgc21lbGwnICk7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5maWx0ZXIoIFsgJ3RyYW5zbGF0aW9uJywgJ3gnLCAnbGVmdCcsICdyaWdodCcsICdjZW50ZXJYJywgJ2NlbnRlclRvcCcsICdyaWdodFRvcCcsICdsZWZ0Q2VudGVyJywgJ2NlbnRlcicsICdyaWdodENlbnRlcicsICdsZWZ0Qm90dG9tJywgJ2NlbnRlckJvdHRvbScsICdyaWdodEJvdHRvbScgXSwga2V5ID0+IG9wdGlvbnNbIGtleSBdICE9PSB1bmRlZmluZWQgKS5sZW5ndGggPD0gMSxcclxuICAgICAgYE1vcmUgdGhhbiBvbmUgbXV0YXRpb24gb24gdGhpcyBOb2RlIHNldCB0aGUgeCBjb21wb25lbnQsIGNoZWNrICR7T2JqZWN0LmtleXMoIG9wdGlvbnMgKS5qb2luKCAnLCcgKX1gICk7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5maWx0ZXIoIFsgJ3RyYW5zbGF0aW9uJywgJ3knLCAndG9wJywgJ2JvdHRvbScsICdjZW50ZXJZJywgJ2NlbnRlclRvcCcsICdyaWdodFRvcCcsICdsZWZ0Q2VudGVyJywgJ2NlbnRlcicsICdyaWdodENlbnRlcicsICdsZWZ0Qm90dG9tJywgJ2NlbnRlckJvdHRvbScsICdyaWdodEJvdHRvbScgXSwga2V5ID0+IG9wdGlvbnNbIGtleSBdICE9PSB1bmRlZmluZWQgKS5sZW5ndGggPD0gMSxcclxuICAgICAgYE1vcmUgdGhhbiBvbmUgbXV0YXRpb24gb24gdGhpcyBOb2RlIHNldCB0aGUgeSBjb21wb25lbnQsIGNoZWNrICR7T2JqZWN0LmtleXMoIG9wdGlvbnMgKS5qb2luKCAnLCcgKX1gICk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2VuYWJsZWQnICkgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2VuYWJsZWRQcm9wZXJ0eScgKSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5lbmFibGVkUHJvcGVydHkhLnZhbHVlID09PSBvcHRpb25zLmVuYWJsZWQsICdJZiBib3RoIGVuYWJsZWQgYW5kIGVuYWJsZWRQcm9wZXJ0eSBhcmUgcHJvdmlkZWQsIHRoZW4gdmFsdWVzIHNob3VsZCBtYXRjaCcgKTtcclxuICAgIH1cclxuICAgIGlmICggYXNzZXJ0ICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdpbnB1dEVuYWJsZWQnICkgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2lucHV0RW5hYmxlZFByb3BlcnR5JyApICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmlucHV0RW5hYmxlZFByb3BlcnR5IS52YWx1ZSA9PT0gb3B0aW9ucy5pbnB1dEVuYWJsZWQsICdJZiBib3RoIGlucHV0RW5hYmxlZCBhbmQgaW5wdXRFbmFibGVkUHJvcGVydHkgYXJlIHByb3ZpZGVkLCB0aGVuIHZhbHVlcyBzaG91bGQgbWF0Y2gnICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIGFzc2VydCAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAndmlzaWJsZScgKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAndmlzaWJsZVByb3BlcnR5JyApICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnZpc2libGVQcm9wZXJ0eSEudmFsdWUgPT09IG9wdGlvbnMudmlzaWJsZSwgJ0lmIGJvdGggdmlzaWJsZSBhbmQgdmlzaWJsZVByb3BlcnR5IGFyZSBwcm92aWRlZCwgdGhlbiB2YWx1ZXMgc2hvdWxkIG1hdGNoJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBhc3NlcnQgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ3Bkb21WaXNpYmxlJyApICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwZG9tVmlzaWJsZVByb3BlcnR5JyApICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnBkb21WaXNpYmxlUHJvcGVydHkhLnZhbHVlID09PSBvcHRpb25zLnBkb21WaXNpYmxlLCAnSWYgYm90aCBwZG9tVmlzaWJsZSBhbmQgcGRvbVZpc2libGVQcm9wZXJ0eSBhcmUgcHJvdmlkZWQsIHRoZW4gdmFsdWVzIHNob3VsZCBtYXRjaCcgKTtcclxuICAgIH1cclxuICAgIGlmICggYXNzZXJ0ICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwaWNrYWJsZScgKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAncGlja2FibGVQcm9wZXJ0eScgKSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5waWNrYWJsZVByb3BlcnR5IS52YWx1ZSA9PT0gb3B0aW9ucy5waWNrYWJsZSwgJ0lmIGJvdGggcGlja2FibGUgYW5kIHBpY2thYmxlUHJvcGVydHkgYXJlIHByb3ZpZGVkLCB0aGVuIHZhbHVlcyBzaG91bGQgbWF0Y2gnICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbXV0YXRvcktleXMgPSB0aGlzLl9tdXRhdG9yS2V5cztcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG11dGF0b3JLZXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBrZXkgPSBtdXRhdG9yS2V5c1sgaSBdO1xyXG5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy81ODAgZm9yIG1vcmUgYWJvdXQgcGFzc2luZyB1bmRlZmluZWQuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoIGtleSApIHx8IG9wdGlvbnNbIGtleSBdICE9PSB1bmRlZmluZWQsIGBVbmRlZmluZWQgbm90IGFsbG93ZWQgZm9yIE5vZGUga2V5OiAke2tleX1gICk7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gSG1tLCBiZXR0ZXIgd2F5IHRvIGNoZWNrIHRoaXM/XHJcbiAgICAgIGlmICggb3B0aW9uc1sga2V5IF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICBjb25zdCBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciggTm9kZS5wcm90b3R5cGUsIGtleSApO1xyXG5cclxuICAgICAgICAvLyBpZiB0aGUga2V5IHJlZmVycyB0byBhIGZ1bmN0aW9uIHRoYXQgaXMgbm90IEVTNSB3cml0YWJsZSwgaXQgd2lsbCBleGVjdXRlIHRoYXQgZnVuY3Rpb24gd2l0aCB0aGUgc2luZ2xlIGFyZ3VtZW50XHJcbiAgICAgICAgaWYgKCBkZXNjcmlwdG9yICYmIHR5cGVvZiBkZXNjcmlwdG9yLnZhbHVlID09PSAnZnVuY3Rpb24nICkge1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgdGhpc1sga2V5IF0oIG9wdGlvbnNbIGtleSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgdGhpc1sga2V5IF0gPSBvcHRpb25zWyBrZXkgXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmluaXRpYWxpemVQaGV0aW9PYmplY3QoIERFRkFVTFRfUEhFVF9JT19PQkpFQ1RfQkFTRV9PUFRJT05TLCBvcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgaW5pdGlhbGl6ZVBoZXRpb09iamVjdCggYmFzZU9wdGlvbnM6IFBhcnRpYWw8UGhldGlvT2JqZWN0T3B0aW9ucz4sIGNvbmZpZzogTm9kZU9wdGlvbnMgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gVHJhY2sgdGhpcywgc28gd2Ugb25seSBvdmVycmlkZSBvdXIgdmlzaWJsZVByb3BlcnR5IG9uY2UuXHJcbiAgICBjb25zdCB3YXNJbnN0cnVtZW50ZWQgPSB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCk7XHJcblxyXG4gICAgc3VwZXIuaW5pdGlhbGl6ZVBoZXRpb09iamVjdCggYmFzZU9wdGlvbnMsIGNvbmZpZyApO1xyXG5cclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiAhd2FzSW5zdHJ1bWVudGVkICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuXHJcbiAgICAgIC8vIEZvciBlYWNoIHN1cHBvcnRlZCBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LCBpZiBhIFByb3BlcnR5IHdhcyBhbHJlYWR5IHNwZWNpZmllZCBpbiB0aGUgb3B0aW9ucyAoaW4gdGhlXHJcbiAgICAgIC8vIGNvbnN0cnVjdG9yIG9yIG11dGF0ZSksIHRoZW4gaXQgd2lsbCBiZSBzZXQgYXMgdGhpcy50YXJnZXRQcm9wZXJ0eSB0aGVyZS4gSGVyZSB3ZSBvbmx5IGNyZWF0ZSB0aGUgZGVmYXVsdFxyXG4gICAgICAvLyBpbnN0cnVtZW50ZWQgb25lIGlmIGFub3RoZXIgaGFzbid0IGFscmVhZHkgYmVlbiBzcGVjaWZpZWQuXHJcblxyXG4gICAgICB0aGlzLl92aXNpYmxlUHJvcGVydHkuaW5pdGlhbGl6ZVBoZXRpbyggdGhpcywgVklTSUJMRV9QUk9QRVJUWV9UQU5ERU1fTkFNRSwgKCkgPT4gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdGhpcy52aXNpYmxlLCBjb21iaW5lT3B0aW9uczxCb29sZWFuUHJvcGVydHlPcHRpb25zPigge1xyXG5cclxuICAgICAgICAgIC8vIGJ5IGRlZmF1bHQsIHVzZSB0aGUgdmFsdWUgZnJvbSB0aGUgTm9kZVxyXG4gICAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRoaXMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgICAgICB0YW5kZW06IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggVklTSUJMRV9QUk9QRVJUWV9UQU5ERU1fTkFNRSApLFxyXG4gICAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0NvbnRyb2xzIHdoZXRoZXIgdGhlIE5vZGUgd2lsbCBiZSB2aXNpYmxlIChhbmQgaW50ZXJhY3RpdmUpLidcclxuICAgICAgICB9LCBjb25maWcudmlzaWJsZVByb3BlcnR5T3B0aW9ucyApIClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5pbml0aWFsaXplUGhldGlvKCB0aGlzLCBFTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FLCAoKSA9PiBuZXcgRW5hYmxlZFByb3BlcnR5KCB0aGlzLmVuYWJsZWQsIGNvbWJpbmVPcHRpb25zPEVuYWJsZWRQcm9wZXJ0eU9wdGlvbnM+KCB7XHJcblxyXG4gICAgICAgICAgLy8gYnkgZGVmYXVsdCwgdXNlIHRoZSB2YWx1ZSBmcm9tIHRoZSBOb2RlXHJcbiAgICAgICAgICBwaGV0aW9SZWFkT25seTogdGhpcy5waGV0aW9SZWFkT25seSxcclxuICAgICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdTZXRzIHdoZXRoZXIgdGhlIG5vZGUgaXMgZW5hYmxlZC4gVGhpcyB3aWxsIHNldCB3aGV0aGVyIGlucHV0IGlzIGVuYWJsZWQgZm9yIHRoaXMgTm9kZSBhbmQgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbW9zdCBvZnRlbiBjaGlsZHJlbiBhcyB3ZWxsLiBJdCB3aWxsIGFsc28gY29udHJvbCBhbmQgdG9nZ2xlIHRoZSBcImRpc2FibGVkIGxvb2tcIiBvZiB0aGUgbm9kZS4nLFxyXG4gICAgICAgICAgdGFuZGVtOiB0aGlzLnRhbmRlbS5jcmVhdGVUYW5kZW0oIEVOQUJMRURfUFJPUEVSVFlfVEFOREVNX05BTUUgKVxyXG4gICAgICAgIH0sIGNvbmZpZy5lbmFibGVkUHJvcGVydHlPcHRpb25zICkgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkuaW5pdGlhbGl6ZVBoZXRpbyggdGhpcywgSU5QVVRfRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSwgKCkgPT4gbmV3IFByb3BlcnR5KCB0aGlzLmlucHV0RW5hYmxlZCwgY29tYmluZU9wdGlvbnM8UHJvcGVydHlPcHRpb25zPGJvb2xlYW4+Pigge1xyXG5cclxuICAgICAgICAgIC8vIGJ5IGRlZmF1bHQsIHVzZSB0aGUgdmFsdWUgZnJvbSB0aGUgTm9kZVxyXG4gICAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRoaXMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgICAgICB0YW5kZW06IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggSU5QVVRfRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSApLFxyXG4gICAgICAgICAgcGhldGlvVmFsdWVUeXBlOiBCb29sZWFuSU8sXHJcbiAgICAgICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSwgLy8gU2luY2UgdGhpcyBwcm9wZXJ0eSBpcyBvcHQtaW4sIHdlIHR5cGljYWxseSBvbmx5IG9wdC1pbiB3aGVuIGl0IHNob3VsZCBiZSBmZWF0dXJlZFxyXG4gICAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1NldHMgd2hldGhlciB0aGUgZWxlbWVudCB3aWxsIGhhdmUgaW5wdXQgZW5hYmxlZCwgYW5kIGhlbmNlIGJlIGludGVyYWN0aXZlLidcclxuICAgICAgICB9LCBjb25maWcuaW5wdXRFbmFibGVkUHJvcGVydHlPcHRpb25zICkgKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSB2aXNpYmlsaXR5IG9mIHRoaXMgTm9kZSB3aXRoIHJlc3BlY3QgdG8gdGhlIFZvaWNpbmcgZmVhdHVyZS4gVG90YWxseSBzZXBhcmF0ZSBmcm9tIGdyYXBoaWNhbCBkaXNwbGF5LlxyXG4gICAqIFdoZW4gdmlzaWJsZSwgdGhpcyBOb2RlIGFuZCBhbGwgb2YgaXRzIGFuY2VzdG9ycyB3aWxsIGJlIGFibGUgdG8gc3BlYWsgd2l0aCBWb2ljaW5nLiBXaGVuIHZvaWNpbmdWaXNpYmxlXHJcbiAgICogaXMgZmFsc2UsIGFsbCBWb2ljaW5nIHVuZGVyIHRoaXMgTm9kZSB3aWxsIGJlIG11dGVkLiBgdm9pY2luZ1Zpc2libGVgIHByb3BlcnRpZXMgZXhpc3QgaW4gTm9kZS50cyBiZWNhdXNlXHJcbiAgICogaXQgaXMgdXNlZnVsIHRvIHNldCBgdm9pY2luZ1Zpc2libGVgIG9uIGEgcm9vdCB0aGF0IGlzIGNvbXBvc2VkIHdpdGggVm9pY2luZy50cy4gV2UgY2Fubm90IHB1dCBhbGwgb2YgdGhlXHJcbiAgICogVm9pY2luZy50cyBpbXBsZW1lbnRhdGlvbiBpbiBOb2RlIGJlY2F1c2UgdGhhdCB3b3VsZCBoYXZlIGEgbWFzc2l2ZSBtZW1vcnkgaW1wYWN0LiBTZWUgVm9pY2luZy50cyBmb3IgbW9yZVxyXG4gICAqIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRWb2ljaW5nVmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy52b2ljaW5nVmlzaWJsZVByb3BlcnR5LnZhbHVlICE9PSB2aXNpYmxlICkge1xyXG4gICAgICB0aGlzLnZvaWNpbmdWaXNpYmxlUHJvcGVydHkudmFsdWUgPSB2aXNpYmxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB2b2ljaW5nVmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApIHsgdGhpcy5zZXRWb2ljaW5nVmlzaWJsZSggdmlzaWJsZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdm9pY2luZ1Zpc2libGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzVm9pY2luZ1Zpc2libGUoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBOb2RlIGlzIHZvaWNpbmdWaXNpYmxlLiBXaGVuIHRydWUgVXR0ZXJhbmNlcyBmb3IgdGhpcyBOb2RlIGNhbiBiZSBhbm5vdW5jZWQgd2l0aCB0aGVcclxuICAgKiBWb2ljaW5nIGZlYXR1cmUsIHNlZSBWb2ljaW5nLnRzIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1ZvaWNpbmdWaXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMudm9pY2luZ1Zpc2libGVQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlIGZvciBleHRyYSBpbmZvcm1hdGlvbiBpbiB0aGUgZGVidWdnaW5nIG91dHB1dCAoZnJvbSBEaXNwbGF5LmdldERlYnVnSFRNTCgpKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldERlYnVnSFRNTEV4dHJhcygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFrZXMgdGhpcyBOb2RlJ3Mgc3VidHJlZSBhdmFpbGFibGUgZm9yIGluc3BlY3Rpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGluc3BlY3QoKTogdm9pZCB7XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2NlbmVyeVNuYXBzaG90ID0gSlNPTi5zdHJpbmdpZnkoIHtcclxuICAgICAgdHlwZTogJ1N1YnRyZWUnLFxyXG4gICAgICByb290Tm9kZUlkOiB0aGlzLmlkLFxyXG4gICAgICBub2Rlczogc2VyaWFsaXplQ29ubmVjdGVkTm9kZXMoIHRoaXMgKVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGRlYnVnZ2luZyBzdHJpbmcgdGhhdCBpcyBhbiBhdHRlbXB0ZWQgc2VyaWFsaXphdGlvbiBvZiB0aGlzIG5vZGUncyBzdWItdHJlZS5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IyR7dGhpcy5pZH1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGVyZm9ybXMgY2hlY2tzIHRvIHNlZSBpZiB0aGUgaW50ZXJuYWwgc3RhdGUgb2YgSW5zdGFuY2UgcmVmZXJlbmNlcyBpcyBjb3JyZWN0IGF0IGEgY2VydGFpbiBwb2ludCBpbi9hZnRlciB0aGVcclxuICAgKiBEaXNwbGF5J3MgdXBkYXRlRGlzcGxheSgpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgYXVkaXRJbnN0YW5jZVN1YnRyZWVGb3JEaXNwbGF5KCBkaXNwbGF5OiBEaXNwbGF5ICk6IHZvaWQge1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICBjb25zdCBudW1JbnN0YW5jZXMgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1JbnN0YW5jZXM7IGkrKyApIHtcclxuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuX2luc3RhbmNlc1sgaSBdO1xyXG4gICAgICAgIGlmICggaW5zdGFuY2UuZGlzcGxheSA9PT0gZGlzcGxheSApIHtcclxuICAgICAgICAgIGFzc2VydFNsb3coIGluc3RhbmNlLnRyYWlsIS5pc1ZhbGlkKCksXHJcbiAgICAgICAgICAgIGBJbnZhbGlkIHRyYWlsIG9uIEluc3RhbmNlOiAke2luc3RhbmNlLnRvU3RyaW5nKCl9IHdpdGggdHJhaWwgJHtpbnN0YW5jZS50cmFpbCEudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhdWRpdCBhbGwgb2YgdGhlIGNoaWxkcmVuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCggY2hpbGQgPT4ge1xyXG4gICAgICAgIGNoaWxkLmF1ZGl0SW5zdGFuY2VTdWJ0cmVlRm9yRGlzcGxheSggZGlzcGxheSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIHdlIGFkZCBvciByZW1vdmUgYW55IG51bWJlciBvZiBib3VuZHMgbGlzdGVuZXJzLCB3ZSB3YW50IHRvIGluY3JlbWVudC9kZWNyZW1lbnQgaW50ZXJuYWwgaW5mb3JtYXRpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZGVsdGFRdWFudGl0eSAtIElmIHBvc2l0aXZlLCB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBiZWluZyBhZGRlZCwgb3RoZXJ3aXNlIHRoZSBudW1iZXIgcmVtb3ZlZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25Cb3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZCggZGVsdGFRdWFudGl0eTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5jaGFuZ2VCb3VuZHNFdmVudENvdW50KCBkZWx0YVF1YW50aXR5ICk7XHJcbiAgICB0aGlzLl9ib3VuZHNFdmVudFNlbGZDb3VudCArPSBkZWx0YVF1YW50aXR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMgdGhlIG5vZGUsIHJlbGVhc2luZyBhbGwgcmVmZXJlbmNlcyB0aGF0IGl0IG1haW50YWluZWQuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gcmVtb3ZlIGFsbCBQRE9NIGlucHV0IGxpc3RlbmVyc1xyXG4gICAgdGhpcy5kaXNwb3NlUGFyYWxsZWxET00oKTtcclxuXHJcbiAgICAvLyBXaGVuIGRpc3Bvc2luZywgcmVtb3ZlIGFsbCBjaGlsZHJlbiBhbmQgcGFyZW50cy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy82MjlcclxuICAgIHRoaXMucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcclxuICAgIHRoaXMuZGV0YWNoKCk7XHJcblxyXG4gICAgLy8gSW4gb3Bwb3NpdGUgb3JkZXIgb2YgY3JlYXRpb25cclxuICAgIHRoaXMuX2lucHV0RW5hYmxlZFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLl9waWNrYWJsZVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuX3Zpc2libGVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgLy8gVGVhci1kb3duIGluIHRoZSByZXZlcnNlIG9yZGVyIE5vZGUgd2FzIGNyZWF0ZWRcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3Bvc2VzIHRoaXMgTm9kZSBhbmQgYWxsIG90aGVyIGRlc2NlbmRhbnQgbm9kZXMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBVc2Ugd2l0aCBjYXV0aW9uLCBhcyB5b3Ugc2hvdWxkIG5vdCByZS11c2UgYW55IE5vZGUgdG91Y2hlZCBieSB0aGlzLiBOb3QgY29tcGF0aWJsZSB3aXRoIG1vc3QgREFHXHJcbiAgICogICAgICAgdGVjaG5pcXVlcy5cclxuICAgKi9cclxuICBwdWJsaWMgZGlzcG9zZVN1YnRyZWUoKTogdm9pZCB7XHJcbiAgICBpZiAoICF0aGlzLmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgIC8vIG1ha2VzIGEgY29weSBiZWZvcmUgZGlzcG9zaW5nXHJcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcclxuXHJcbiAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY2hpbGRyZW5bIGkgXS5kaXNwb3NlU3VidHJlZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQSBkZWZhdWx0IGZvciBnZXRUcmFpbHMoKSBzZWFyY2hlcywgcmV0dXJucyB3aGV0aGVyIHRoZSBOb2RlIGhhcyBubyBwYXJlbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZGVmYXVsdFRyYWlsUHJlZGljYXRlKCBub2RlOiBOb2RlICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIG5vZGUuX3BhcmVudHMubGVuZ3RoID09PSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBkZWZhdWx0IGZvciBnZXRMZWFmVHJhaWxzKCkgc2VhcmNoZXMsIHJldHVybnMgd2hldGhlciB0aGUgTm9kZSBoYXMgbm8gcGFyZW50cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGRlZmF1bHRMZWFmVHJhaWxQcmVkaWNhdGUoIG5vZGU6IE5vZGUgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gbm9kZS5fY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBOb2RlSU86IElPVHlwZTtcclxuXHJcbiAgLy8gQSBtYXBwaW5nIG9mIGFsbCBvZiB0aGUgZGVmYXVsdCBvcHRpb25zIHByb3ZpZGVkIHRvIE5vZGVcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfTk9ERV9PUFRJT05TID0gREVGQVVMVF9PUFRJT05TO1xyXG5cclxufVxyXG5cclxuTm9kZS5wcm90b3R5cGUuX211dGF0b3JLZXlzID0gQUNDRVNTSUJJTElUWV9PUFRJT05fS0VZUy5jb25jYXQoIE5PREVfT1BUSU9OX0tFWVMgKTtcclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPFN0cmluZz59IC0gTGlzdCBvZiBhbGwgZGlydHkgZmxhZ3MgdGhhdCBzaG91bGQgYmUgYXZhaWxhYmxlIG9uIGRyYXdhYmxlcyBjcmVhdGVkIGZyb20gdGhpcyBOb2RlIChvclxyXG4gKiAgICAgICAgICAgICAgICAgICAgc3VidHlwZSkuIEdpdmVuIGEgZmxhZyAoZS5nLiByYWRpdXMpLCBpdCBpbmRpY2F0ZXMgdGhlIGV4aXN0ZW5jZSBvZiBhIGZ1bmN0aW9uXHJcbiAqICAgICAgICAgICAgICAgICAgICBkcmF3YWJsZS5tYXJrRGlydHlSYWRpdXMoKSB0aGF0IHdpbGwgaW5kaWNhdGUgdG8gdGhlIGRyYXdhYmxlIHRoYXQgdGhlIHJhZGl1cyBoYXMgY2hhbmdlZC5cclxuICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAqXHJcbiAqIFNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHN1YnR5cGVzLlxyXG4gKi9cclxuTm9kZS5wcm90b3R5cGUuZHJhd2FibGVNYXJrRmxhZ3MgPSBbXTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdOb2RlJywgTm9kZSApO1xyXG5cclxuLy8ge0lPVHlwZX1cclxuTm9kZS5Ob2RlSU8gPSBuZXcgSU9UeXBlKCAnTm9kZUlPJywge1xyXG4gIHZhbHVlVHlwZTogTm9kZSxcclxuICBkb2N1bWVudGF0aW9uOiAnVGhlIGJhc2UgdHlwZSBmb3IgZ3JhcGhpY2FsIGFuZCBwb3RlbnRpYWxseSBpbnRlcmFjdGl2ZSBvYmplY3RzLicsXHJcbiAgbWV0YWRhdGFEZWZhdWx0czoge1xyXG4gICAgcGhldGlvU3RhdGU6IFBIRVRfSU9fU1RBVEVfREVGQVVMVFxyXG4gIH1cclxufSApO1xyXG5cclxuY29uc3QgREVGQVVMVF9QSEVUX0lPX09CSkVDVF9CQVNFX09QVElPTlMgPSB7IHBoZXRpb1R5cGU6IE5vZGUuTm9kZUlPLCBwaGV0aW9TdGF0ZTogUEhFVF9JT19TVEFURV9ERUZBVUxUIH07XHJcblxyXG4vLyBBIGJhc2UgY2xhc3MgZm9yIGEgbm9kZSBpbiB0aGUgU2NlbmVyeSBzY2VuZSBncmFwaC4gU3VwcG9ydHMgZ2VuZXJhbCBkaXJlY3RlZCBhY3ljbGljIGdyYXBoaWNzIChEQUdzKS5cclxuLy8gSGFuZGxlcyBtdWx0aXBsZSBsYXllcnMgd2l0aCBhc3NvcnRlZCB0eXBlcyAoQ2FudmFzIDJELCBTVkcsIERPTSwgV2ViR0wsIGV0Yy4pLlxyXG4vLyBOb3RlOiBXZSB1c2UgaW50ZXJmYWNlIGV4dGVuc2lvbiwgc28gd2UgY2FuJ3QgZXhwb3J0IE5vZGUgYXQgaXRzIGRlY2xhcmF0aW9uIGxvY2F0aW9uXHJcbmV4cG9ydCBkZWZhdWx0IE5vZGU7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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