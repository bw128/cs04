// Copyright 2022-2024, University of Colorado Boulder

/**
 * Popupable trait
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrea Lin (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import ScreenView from '../../joist/js/ScreenView.js';
import gracefulBind from '../../phet-core/js/gracefulBind.js';
import optionize from '../../phet-core/js/optionize.js';
import { FocusManager, Node } from '../../scenery/js/imports.js';
import sun from './sun.js';
const Popupable = (Type, optionsArgPosition) => {
  return class extends Type {
    // The Node to return focus to after the Popupable has been hidden. A reference to this Node is saved when
    // the Popupable is shown. By default, focus is returned to Node that has focus when the Popupable is open
    // but can be overridden with `options.focusOnHideNode`.

    // The node provided to showPopup, with the transform applied

    // Whether the popup is being shown

    // Support the same signature as the type we mix into.  However, we also have our own options, which we assume
    // are passed in the last arg.
    // TODO - We're trying not to use "any", so how can we specify the types more specifically?  See https://github.com/phetsims/sun/issues/777.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args) {
      super(...args);
      const providedOptions = args[optionsArgPosition] || {};

      // `config` is required for Popupable, to work well with ...args but all fields of the config are optional
      const requiredConfig = args[args.length - 1];
      assert && assert(requiredConfig !== undefined, 'config object is required for Popupable.');
      const showPopup = gracefulBind('phet.joist.sim.showPopup');
      const hidePopup = gracefulBind('phet.joist.sim.hidePopup');
      const options = optionize()({
        showPopup: showPopup,
        hidePopup: hidePopup,
        isModal: true,
        layoutBounds: null,
        focusOnShowNode: null,
        focusOnHideNode: null,
        disableModals: _.get(window, 'phet.chipper.queryParameters.disableModals') || false
      }, providedOptions);

      // see https://github.com/phetsims/joist/issues/293
      assert && assert(options.isModal, 'Non-modal popups not currently supported');
      this.layoutBounds = options.layoutBounds;
      this._focusOnShowNode = options.focusOnShowNode;
      this.disableModals = options.disableModals;
      this.isModal = options.isModal;
      this._focusOnHideNode = options.focusOnHideNode;
      this._nodeToFocusOnHide = null;
      this.popupParent = new PopupParentNode(this, {
        show: this.show.bind(this),
        hide: this.hide.bind(this),
        layout: this.layout.bind(this)
      });
      this.isShowingProperty = new BooleanProperty(false, {
        tandem: options.tandem?.createTandem('isShowingProperty'),
        phetioReadOnly: true,
        phetioFeatured: true
      });
      this.isShowingProperty.lazyLink(isShowing => {
        if (isShowing) {
          options.showPopup(this.popupParent, options.isModal);
        } else {
          options.hidePopup(this.popupParent, options.isModal);
        }
      });
    }
    layout(bounds) {
      if (this.layoutBounds) {
        this.popupParent.matrix = ScreenView.getLayoutMatrix(this.layoutBounds, bounds);
      }
    }

    // Provide a chance of not showing, see disableModals
    // @mixin-protected - made public for use in the mixin only
    shouldShowPopup() {
      const optOut = this.isModal && this.disableModals;
      return !optOut;
    }
    show() {
      if (!this.shouldShowPopup()) {
        return;
      }

      // save a reference before setting isShowingProperty because listeners on the isShowingProperty may modify or
      // clear focus from FocusManager.pdomFocusedNode.
      this._nodeToFocusOnHide = this._focusOnHideNode || FocusManager.pdomFocusedNode;
      this.isShowingProperty.value = true;

      // after it is shown, move focus to the focusOnShownNode, presumably moving focus into the Popupable content
      if (this._focusOnShowNode && this._focusOnShowNode.focusable) {
        this._focusOnShowNode.focus();
      }
    }

    /**
     * Hide the popup. If you create a new popup next time you show(), be sure to dispose this popup instead.
     */
    hide() {
      this.interruptSubtreeInput();
      this.isShowingProperty.value = false;

      // return focus to the Node that had focus when the Popupable was opened (or the focusOnHideNode if provided)
      if (this._nodeToFocusOnHide && this._nodeToFocusOnHide.focusable && this._nodeToFocusOnHide.instances[0]?.visible) {
        this._nodeToFocusOnHide.focus();
      }
    }

    // @mixin-protected - made public for use in the mixin only
    get focusOnHideNode() {
      return this._focusOnHideNode;
    }

    /**
     * Releases references
     */
    dispose() {
      this.hide();
      this.isShowingProperty.dispose();
      super.dispose();
    }
  };
};
class PopupParentNode extends Node {
  constructor(popupableNode, providedOptions) {
    const options = optionize()({
      children: [popupableNode]
    }, providedOptions);
    super(options);
    this.show = options.show;
    this.hide = options.hide;
    this.layout = options.layout;
  }
}
sun.register('Popupable', Popupable);
export default Popupable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJTY3JlZW5WaWV3IiwiZ3JhY2VmdWxCaW5kIiwib3B0aW9uaXplIiwiRm9jdXNNYW5hZ2VyIiwiTm9kZSIsInN1biIsIlBvcHVwYWJsZSIsIlR5cGUiLCJvcHRpb25zQXJnUG9zaXRpb24iLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJwcm92aWRlZE9wdGlvbnMiLCJyZXF1aXJlZENvbmZpZyIsImxlbmd0aCIsImFzc2VydCIsInVuZGVmaW5lZCIsInNob3dQb3B1cCIsImhpZGVQb3B1cCIsIm9wdGlvbnMiLCJpc01vZGFsIiwibGF5b3V0Qm91bmRzIiwiZm9jdXNPblNob3dOb2RlIiwiZm9jdXNPbkhpZGVOb2RlIiwiZGlzYWJsZU1vZGFscyIsIl8iLCJnZXQiLCJ3aW5kb3ciLCJfZm9jdXNPblNob3dOb2RlIiwiX2ZvY3VzT25IaWRlTm9kZSIsIl9ub2RlVG9Gb2N1c09uSGlkZSIsInBvcHVwUGFyZW50IiwiUG9wdXBQYXJlbnROb2RlIiwic2hvdyIsImJpbmQiLCJoaWRlIiwibGF5b3V0IiwiaXNTaG93aW5nUHJvcGVydHkiLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9SZWFkT25seSIsInBoZXRpb0ZlYXR1cmVkIiwibGF6eUxpbmsiLCJpc1Nob3dpbmciLCJib3VuZHMiLCJtYXRyaXgiLCJnZXRMYXlvdXRNYXRyaXgiLCJzaG91bGRTaG93UG9wdXAiLCJvcHRPdXQiLCJwZG9tRm9jdXNlZE5vZGUiLCJ2YWx1ZSIsImZvY3VzYWJsZSIsImZvY3VzIiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwiaW5zdGFuY2VzIiwidmlzaWJsZSIsImRpc3Bvc2UiLCJwb3B1cGFibGVOb2RlIiwiY2hpbGRyZW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBvcHVwYWJsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQb3B1cGFibGUgdHJhaXRcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEFuZHJlYSBMaW4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgU2NyZWVuVmlldyBmcm9tICcuLi8uLi9qb2lzdC9qcy9TY3JlZW5WaWV3LmpzJztcclxuaW1wb3J0IGdyYWNlZnVsQmluZCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZ3JhY2VmdWxCaW5kLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IENvbnN0cnVjdG9yIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9Db25zdHJ1Y3Rvci5qcyc7XHJcbmltcG9ydCBQaWNrT3B0aW9uYWwgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tPcHRpb25hbC5qcyc7XHJcbmltcG9ydCB7IEZvY3VzTWFuYWdlciwgTm9kZSwgTm9kZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgc3VuIGZyb20gJy4vc3VuLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIERvbid0IHVzZSBQb3B1cGFibGVOb2RlIGhlcmUgKGl0IGNyZWF0ZXMuLi4gYSBsb3Qgb2YgdHlwZSBpc3N1ZXMgYW5kIGNpcmN1bGFyaXR5KVxyXG4gIHNob3dQb3B1cD86ICggcG9wdXA6IE5vZGUsIGlzTW9kYWw6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG4gIGhpZGVQb3B1cD86ICggcG9wdXA6IE5vZGUsIGlzTW9kYWw6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBtb2RhbCBwb3B1cHMgcHJldmVudCBpbnRlcmFjdGlvbiB3aXRoIHRoZSByZXN0IG9mIHRoZSBzaW0gd2hpbGUgb3BlblxyXG4gIGlzTW9kYWw/OiBib29sZWFuO1xyXG5cclxuICAvLyBJZiBkZXNpcmVkLCB0aGUgbGF5b3V0Qm91bmRzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIGxheW91dFxyXG4gIGxheW91dEJvdW5kcz86IEJvdW5kczIgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgTm9kZSB0aGF0IHJlY2VpdmVzIGZvY3VzIHdoZW4gdGhlIFBvcHVwYWJsZSBpcyBzaG93bi4gSWYgbnVsbCwgZm9jdXMgaXMgbm90IHNldC5cclxuICBmb2N1c09uU2hvd05vZGU/OiBOb2RlIHwgbnVsbDtcclxuXHJcbiAgLy8gVGhlIE5vZGUgdGhhdCByZWNlaXZlcyBmb2N1cyB3aGVuIHRoZSBQb3B1cGFibGUgaXMgY2xvc2VkLiBJZiBudWxsLCBmb2N1cyB3aWxsIHJldHVyblxyXG4gIC8vIHRvIHRoZSBOb2RlIHRoYXQgaGFkIGZvY3VzIHdoZW4gdGhlIERpYWxvZyBvcGVuZWQuXHJcbiAgZm9jdXNPbkhpZGVOb2RlPzogTm9kZSB8IG51bGw7XHJcblxyXG4gIC8vIFdoZW4gdHJ1ZSwgbm8gbW9kYWwgc2hvdy9oaWRlIGZlYXR1cmUgd2lsbCBiZSBzdXBwb3J0ZWQuIFRoaXMgaXMgYSB3YXkgb2Ygb3B0aW5nIG91dCBvZiB0aGUgUG9wdXBhYmxlIGZlYXR1cmVcclxuICAvLyBhbHRvZ2V0aGVyIGZvciB0aGlzIHJ1bnRpbWUuXHJcbiAgZGlzYWJsZU1vZGFscz86IGJvb2xlYW47XHJcbn07XHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IFBpY2tPcHRpb25hbDxOb2RlT3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5leHBvcnQgdHlwZSBQb3B1cGFibGVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBQYXJlbnRPcHRpb25zO1xyXG5cclxudHlwZSBUUG9wdXBhYmxlID0ge1xyXG4gIHJlYWRvbmx5IGxheW91dEJvdW5kczogQm91bmRzMiB8IG51bGw7XHJcbiAgcmVhZG9ubHkgcG9wdXBQYXJlbnQ6IE5vZGU7XHJcbiAgcmVhZG9ubHkgaXNTaG93aW5nUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIGxheW91dCggYm91bmRzOiBCb3VuZHMyICk6IHZvaWQ7XHJcblxyXG4gIC8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgc2hvdWxkU2hvd1BvcHVwKCk6IGJvb2xlYW47XHJcblxyXG4gIHNob3coKTogdm9pZDtcclxuICBoaWRlKCk6IHZvaWQ7XHJcblxyXG4gIC8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgZ2V0IGZvY3VzT25IaWRlTm9kZSgpOiBOb2RlIHwgbnVsbDtcclxufTtcclxuXHJcbmNvbnN0IFBvcHVwYWJsZSA9IDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3RvcjxOb2RlPj4oIFR5cGU6IFN1cGVyVHlwZSwgb3B0aW9uc0FyZ1Bvc2l0aW9uOiBudW1iZXIgKTogU3VwZXJUeXBlICYgQ29uc3RydWN0b3I8VFBvcHVwYWJsZT4gPT4ge1xyXG5cclxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBUeXBlIGltcGxlbWVudHMgVFBvcHVwYWJsZSB7XHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IGxheW91dEJvdW5kczogQm91bmRzMiB8IG51bGw7XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfZm9jdXNPblNob3dOb2RlOiBOb2RlIHwgbnVsbDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2ZvY3VzT25IaWRlTm9kZTogTm9kZSB8IG51bGw7XHJcblxyXG4gICAgLy8gVGhlIE5vZGUgdG8gcmV0dXJuIGZvY3VzIHRvIGFmdGVyIHRoZSBQb3B1cGFibGUgaGFzIGJlZW4gaGlkZGVuLiBBIHJlZmVyZW5jZSB0byB0aGlzIE5vZGUgaXMgc2F2ZWQgd2hlblxyXG4gICAgLy8gdGhlIFBvcHVwYWJsZSBpcyBzaG93bi4gQnkgZGVmYXVsdCwgZm9jdXMgaXMgcmV0dXJuZWQgdG8gTm9kZSB0aGF0IGhhcyBmb2N1cyB3aGVuIHRoZSBQb3B1cGFibGUgaXMgb3BlblxyXG4gICAgLy8gYnV0IGNhbiBiZSBvdmVycmlkZGVuIHdpdGggYG9wdGlvbnMuZm9jdXNPbkhpZGVOb2RlYC5cclxuICAgIHByaXZhdGUgX25vZGVUb0ZvY3VzT25IaWRlOiBOb2RlIHwgbnVsbDtcclxuXHJcbiAgICAvLyBUaGUgbm9kZSBwcm92aWRlZCB0byBzaG93UG9wdXAsIHdpdGggdGhlIHRyYW5zZm9ybSBhcHBsaWVkXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcG9wdXBQYXJlbnQ6IE5vZGU7XHJcblxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlTW9kYWxzOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBpc01vZGFsOiBib29sZWFuO1xyXG5cclxuICAgIC8vIFdoZXRoZXIgdGhlIHBvcHVwIGlzIGJlaW5nIHNob3duXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgaXNTaG93aW5nUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAgIC8vIFN1cHBvcnQgdGhlIHNhbWUgc2lnbmF0dXJlIGFzIHRoZSB0eXBlIHdlIG1peCBpbnRvLiAgSG93ZXZlciwgd2UgYWxzbyBoYXZlIG91ciBvd24gb3B0aW9ucywgd2hpY2ggd2UgYXNzdW1lXHJcbiAgICAvLyBhcmUgcGFzc2VkIGluIHRoZSBsYXN0IGFyZy5cclxuICAgIC8vIFRPRE8gLSBXZSdyZSB0cnlpbmcgbm90IHRvIHVzZSBcImFueVwiLCBzbyBob3cgY2FuIHdlIHNwZWNpZnkgdGhlIHR5cGVzIG1vcmUgc3BlY2lmaWNhbGx5PyAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzc3Ny5cclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoIC4uLmFyZ3M6IGFueVtdICkge1xyXG4gICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgY29uc3QgcHJvdmlkZWRPcHRpb25zID0gKCBhcmdzWyBvcHRpb25zQXJnUG9zaXRpb24gXSB8fCB7fSApIGFzIFBvcHVwYWJsZU9wdGlvbnM7XHJcblxyXG4gICAgICAvLyBgY29uZmlnYCBpcyByZXF1aXJlZCBmb3IgUG9wdXBhYmxlLCB0byB3b3JrIHdlbGwgd2l0aCAuLi5hcmdzIGJ1dCBhbGwgZmllbGRzIG9mIHRoZSBjb25maWcgYXJlIG9wdGlvbmFsXHJcbiAgICAgIGNvbnN0IHJlcXVpcmVkQ29uZmlnID0gYXJnc1sgYXJncy5sZW5ndGggLSAxIF07XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlcXVpcmVkQ29uZmlnICE9PSB1bmRlZmluZWQsICdjb25maWcgb2JqZWN0IGlzIHJlcXVpcmVkIGZvciBQb3B1cGFibGUuJyApO1xyXG5cclxuICAgICAgY29uc3Qgc2hvd1BvcHVwID0gZ3JhY2VmdWxCaW5kKCAncGhldC5qb2lzdC5zaW0uc2hvd1BvcHVwJyApIGFzIEV4Y2x1ZGU8UG9wdXBhYmxlT3B0aW9uc1sgJ3Nob3dQb3B1cCcgXSwgdW5kZWZpbmVkPjtcclxuICAgICAgY29uc3QgaGlkZVBvcHVwID0gZ3JhY2VmdWxCaW5kKCAncGhldC5qb2lzdC5zaW0uaGlkZVBvcHVwJyApIGFzIEV4Y2x1ZGU8UG9wdXBhYmxlT3B0aW9uc1sgJ2hpZGVQb3B1cCcgXSwgdW5kZWZpbmVkPjtcclxuXHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UG9wdXBhYmxlT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuICAgICAgICBzaG93UG9wdXA6IHNob3dQb3B1cCxcclxuICAgICAgICBoaWRlUG9wdXA6IGhpZGVQb3B1cCxcclxuICAgICAgICBpc01vZGFsOiB0cnVlLFxyXG4gICAgICAgIGxheW91dEJvdW5kczogbnVsbCxcclxuICAgICAgICBmb2N1c09uU2hvd05vZGU6IG51bGwsXHJcbiAgICAgICAgZm9jdXNPbkhpZGVOb2RlOiBudWxsLFxyXG4gICAgICAgIGRpc2FibGVNb2RhbHM6IF8uZ2V0KCB3aW5kb3csICdwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmRpc2FibGVNb2RhbHMnICkgfHwgZmFsc2VcclxuICAgICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy8yOTNcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5pc01vZGFsLCAnTm9uLW1vZGFsIHBvcHVwcyBub3QgY3VycmVudGx5IHN1cHBvcnRlZCcgKTtcclxuXHJcbiAgICAgIHRoaXMubGF5b3V0Qm91bmRzID0gb3B0aW9ucy5sYXlvdXRCb3VuZHM7XHJcbiAgICAgIHRoaXMuX2ZvY3VzT25TaG93Tm9kZSA9IG9wdGlvbnMuZm9jdXNPblNob3dOb2RlO1xyXG4gICAgICB0aGlzLmRpc2FibGVNb2RhbHMgPSBvcHRpb25zLmRpc2FibGVNb2RhbHM7XHJcbiAgICAgIHRoaXMuaXNNb2RhbCA9IG9wdGlvbnMuaXNNb2RhbDtcclxuICAgICAgdGhpcy5fZm9jdXNPbkhpZGVOb2RlID0gb3B0aW9ucy5mb2N1c09uSGlkZU5vZGU7XHJcbiAgICAgIHRoaXMuX25vZGVUb0ZvY3VzT25IaWRlID0gbnVsbDtcclxuICAgICAgdGhpcy5wb3B1cFBhcmVudCA9IG5ldyBQb3B1cFBhcmVudE5vZGUoIHRoaXMsIHtcclxuICAgICAgICBzaG93OiB0aGlzLnNob3cuYmluZCggdGhpcyApLFxyXG4gICAgICAgIGhpZGU6IHRoaXMuaGlkZS5iaW5kKCB0aGlzICksXHJcbiAgICAgICAgbGF5b3V0OiB0aGlzLmxheW91dC5iaW5kKCB0aGlzIClcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlLCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnaXNTaG93aW5nUHJvcGVydHknICksXHJcbiAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IHRydWVcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eS5sYXp5TGluayggaXNTaG93aW5nID0+IHtcclxuICAgICAgICBpZiAoIGlzU2hvd2luZyApIHtcclxuICAgICAgICAgIG9wdGlvbnMuc2hvd1BvcHVwKCB0aGlzLnBvcHVwUGFyZW50LCBvcHRpb25zLmlzTW9kYWwgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBvcHRpb25zLmhpZGVQb3B1cCggdGhpcy5wb3B1cFBhcmVudCwgb3B0aW9ucy5pc01vZGFsICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxheW91dCggYm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgICBpZiAoIHRoaXMubGF5b3V0Qm91bmRzICkge1xyXG4gICAgICAgIHRoaXMucG9wdXBQYXJlbnQubWF0cml4ID0gU2NyZWVuVmlldy5nZXRMYXlvdXRNYXRyaXgoIHRoaXMubGF5b3V0Qm91bmRzLCBib3VuZHMgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFByb3ZpZGUgYSBjaGFuY2Ugb2Ygbm90IHNob3dpbmcsIHNlZSBkaXNhYmxlTW9kYWxzXHJcbiAgICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gICAgcHVibGljIHNob3VsZFNob3dQb3B1cCgpOiBib29sZWFuIHtcclxuICAgICAgY29uc3Qgb3B0T3V0ID0gdGhpcy5pc01vZGFsICYmIHRoaXMuZGlzYWJsZU1vZGFscztcclxuICAgICAgcmV0dXJuICFvcHRPdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XHJcbiAgICAgIGlmICggIXRoaXMuc2hvdWxkU2hvd1BvcHVwKCkgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzYXZlIGEgcmVmZXJlbmNlIGJlZm9yZSBzZXR0aW5nIGlzU2hvd2luZ1Byb3BlcnR5IGJlY2F1c2UgbGlzdGVuZXJzIG9uIHRoZSBpc1Nob3dpbmdQcm9wZXJ0eSBtYXkgbW9kaWZ5IG9yXHJcbiAgICAgIC8vIGNsZWFyIGZvY3VzIGZyb20gRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c2VkTm9kZS5cclxuICAgICAgdGhpcy5fbm9kZVRvRm9jdXNPbkhpZGUgPSB0aGlzLl9mb2N1c09uSGlkZU5vZGUgfHwgRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c2VkTm9kZTtcclxuICAgICAgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcblxyXG4gICAgICAvLyBhZnRlciBpdCBpcyBzaG93biwgbW92ZSBmb2N1cyB0byB0aGUgZm9jdXNPblNob3duTm9kZSwgcHJlc3VtYWJseSBtb3ZpbmcgZm9jdXMgaW50byB0aGUgUG9wdXBhYmxlIGNvbnRlbnRcclxuICAgICAgaWYgKCB0aGlzLl9mb2N1c09uU2hvd05vZGUgJiYgdGhpcy5fZm9jdXNPblNob3dOb2RlLmZvY3VzYWJsZSApIHtcclxuICAgICAgICB0aGlzLl9mb2N1c09uU2hvd05vZGUuZm9jdXMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlkZSB0aGUgcG9wdXAuIElmIHlvdSBjcmVhdGUgYSBuZXcgcG9wdXAgbmV4dCB0aW1lIHlvdSBzaG93KCksIGJlIHN1cmUgdG8gZGlzcG9zZSB0aGlzIHBvcHVwIGluc3RlYWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xyXG4gICAgICB0aGlzLmludGVycnVwdFN1YnRyZWVJbnB1dCgpO1xyXG5cclxuICAgICAgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gcmV0dXJuIGZvY3VzIHRvIHRoZSBOb2RlIHRoYXQgaGFkIGZvY3VzIHdoZW4gdGhlIFBvcHVwYWJsZSB3YXMgb3BlbmVkIChvciB0aGUgZm9jdXNPbkhpZGVOb2RlIGlmIHByb3ZpZGVkKVxyXG4gICAgICBpZiAoIHRoaXMuX25vZGVUb0ZvY3VzT25IaWRlICYmIHRoaXMuX25vZGVUb0ZvY3VzT25IaWRlLmZvY3VzYWJsZSAmJiB0aGlzLl9ub2RlVG9Gb2N1c09uSGlkZS5pbnN0YW5jZXNbIDAgXT8udmlzaWJsZSApIHtcclxuICAgICAgICB0aGlzLl9ub2RlVG9Gb2N1c09uSGlkZS5mb2N1cygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICAgIHB1YmxpYyBnZXQgZm9jdXNPbkhpZGVOb2RlKCk6IE5vZGUgfCBudWxsIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzT25IaWRlTm9kZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbGVhc2VzIHJlZmVyZW5jZXNcclxuICAgICAqL1xyXG4gICAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAgIHRoaXMuaGlkZSgpO1xyXG5cclxuICAgICAgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuXHJcbnR5cGUgUG9wdXBhYmxlUGFyZW50Tm9kZVNlbGZPcHRpb25zID0ge1xyXG4gIHNob3c6ICgpID0+IHZvaWQ7XHJcbiAgaGlkZTogKCkgPT4gdm9pZDtcclxuICBsYXlvdXQ6ICggYm91bmRzOiBCb3VuZHMyICkgPT4gdm9pZDtcclxufTtcclxudHlwZSBQb3B1cGFibGVQYXJlbnROb2RlT3B0aW9ucyA9IFBvcHVwYWJsZVBhcmVudE5vZGVTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5cclxuY2xhc3MgUG9wdXBQYXJlbnROb2RlIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBzaG93OiBQb3B1cGFibGVQYXJlbnROb2RlU2VsZk9wdGlvbnNbICdzaG93JyBdO1xyXG4gIHB1YmxpYyByZWFkb25seSBoaWRlOiBQb3B1cGFibGVQYXJlbnROb2RlU2VsZk9wdGlvbnNbICdoaWRlJyBdO1xyXG4gIHB1YmxpYyByZWFkb25seSBsYXlvdXQ6IFBvcHVwYWJsZVBhcmVudE5vZGVTZWxmT3B0aW9uc1sgJ2xheW91dCcgXTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwb3B1cGFibGVOb2RlOiBOb2RlLCBwcm92aWRlZE9wdGlvbnM6IFBvcHVwYWJsZVBhcmVudE5vZGVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UG9wdXBhYmxlUGFyZW50Tm9kZU9wdGlvbnMsIFBvcHVwYWJsZVBhcmVudE5vZGVTZWxmT3B0aW9ucywgTm9kZU9wdGlvbnM+KCkoIHtcclxuICAgICAgY2hpbGRyZW46IFsgcG9wdXBhYmxlTm9kZSBdXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuc2hvdyA9IG9wdGlvbnMuc2hvdztcclxuICAgIHRoaXMuaGlkZSA9IG9wdGlvbnMuaGlkZTtcclxuICAgIHRoaXMubGF5b3V0ID0gb3B0aW9ucy5sYXlvdXQ7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBQb3B1cGFibGVOb2RlID0gTm9kZSAmIFRQb3B1cGFibGU7XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdQb3B1cGFibGUnLCBQb3B1cGFibGUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBvcHVwYWJsZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLGtDQUFrQztBQUc5RCxPQUFPQyxVQUFVLE1BQU0sOEJBQThCO0FBQ3JELE9BQU9DLFlBQVksTUFBTSxvQ0FBb0M7QUFDN0QsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUd2RCxTQUFTQyxZQUFZLEVBQUVDLElBQUksUUFBcUIsNkJBQTZCO0FBQzdFLE9BQU9DLEdBQUcsTUFBTSxVQUFVO0FBNEMxQixNQUFNQyxTQUFTLEdBQUdBLENBQXVDQyxJQUFlLEVBQUVDLGtCQUEwQixLQUEyQztFQUU3SSxPQUFPLGNBQWNELElBQUksQ0FBdUI7SUFPOUM7SUFDQTtJQUNBOztJQUdBOztJQU1BOztJQUdBO0lBQ0E7SUFDQTtJQUNBO0lBQ09FLFdBQVdBLENBQUUsR0FBR0MsSUFBVyxFQUFHO01BQ25DLEtBQUssQ0FBRSxHQUFHQSxJQUFLLENBQUM7TUFFaEIsTUFBTUMsZUFBZSxHQUFLRCxJQUFJLENBQUVGLGtCQUFrQixDQUFFLElBQUksQ0FBQyxDQUF1Qjs7TUFFaEY7TUFDQSxNQUFNSSxjQUFjLEdBQUdGLElBQUksQ0FBRUEsSUFBSSxDQUFDRyxNQUFNLEdBQUcsQ0FBQyxDQUFFO01BQzlDQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUYsY0FBYyxLQUFL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