// Copyright 2024, University of Colorado Boulder

/**
 * A Property that will contain a list of Trails where the root of the trail is a root Node of a Display, and the leaf
 * node is the provided Node.
 *
 * // REVIEW: This is a very complicated component and deserves a bit more doc. Some ideas about what to explain:
 * // REVIEW:   1. That this is synchronously updated and doesn't listen to instances.
 * // REVIEW:   2.
 * // REVIEW:   2.
 * // REVIEW:   2.
 *
 * // REVIEW: can you describe this a bit more. Do you mean any Node in a trail? What about if the provided Node is disposed?
 * NOTE: If a Node is disposed, it will be removed from the trails.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyProperty from '../../../axon/js/TinyProperty.js';
import { Display, scenery, Trail } from '../imports.js';
import optionize from '../../../phet-core/js/optionize.js';
export default class DisplayedTrailsProperty extends TinyProperty {
  // REVIEW: How about a rename like "targetNode", no strong preference if you don't want to.

  // REVIEW: Please add doc why we only need to listen to a Node once, even if it is in multiple trails?
  listenedNodeSet = new Set();

  // Recorded options
  // REVIEW: Please rename this and the option to something less confusing. Perhaps `displaySupport`, or
  // `whichDisplay`, or something that sounds like it could be a predicate.

  /**
   * We will contain Trails whose leaf node (lastNode) is this provided Node.
   */
  constructor(node, providedOptions) {
    const options = optionize()({
      // Listen to all displays
      display: null,
      // Default to visual trails (just children), with only pruning by normal visibility
      followPdomOrder: false,
      requireVisible: true,
      requirePdomVisible: false,
      requireEnabled: false,
      requireInputEnabled: false
    }, providedOptions);
    super([]);

    // Save options for later updates
    this.node = node;
    this.display = options.display;
    this.followPdomOrder = options.followPdomOrder;
    this.requireVisible = options.requireVisible;
    this.requirePdomVisible = options.requirePdomVisible;
    this.requireEnabled = options.requireEnabled;
    this.requireInputEnabled = options.requireInputEnabled;
    this._trailUpdateListener = this.update.bind(this);
    this.update();
  }
  update() {
    // Factored out because we're using a "function" below for recursion (NOT an arrow function)
    const display = this.display;
    const followPdomOrder = this.followPdomOrder;
    const requireVisible = this.requireVisible;
    const requirePdomVisible = this.requirePdomVisible;
    const requireEnabled = this.requireEnabled;
    const requireInputEnabled = this.requireInputEnabled;

    // Trails accumulated in our recursion that will be our Property's value
    const trails = [];

    // Nodes that were touched in the scan (we should listen to changes to ANY of these to see if there is a connection
    // or disconnection). This could potentially cause our Property to change
    const nodeSet = new Set();

    // Modified in-place during the search
    const trail = new Trail(this.node);

    // We will recursively add things to the "front" of the trail (ancestors)
    (function recurse() {
      const root = trail.rootNode();

      // If a Node is disposed, we won't add listeners to it, so we abort slightly earlier.
      if (root.isDisposed) {
        return;
      }
      nodeSet.add(root);

      // REVIEW: Please say why we need listeners on this Node. Also please confirm (via doc) that adding
      // If we fail other conditions, we won't add a trail OR recurse, but we will STILL have listeners added to the Node.
      if (requireVisible && !root.visible || requirePdomVisible && !root.pdomVisible || requireEnabled && !root.enabled || requireInputEnabled && !root.inputEnabled) {
        return;
      }
      const displays = root.getRootedDisplays();

      // REVIEW: initialize to false?
      let displayMatches;
      if (display === null) {
        displayMatches = displays.length > 0;
      } else if (display instanceof Display) {
        displayMatches = displays.includes(display);
      } else {
        displayMatches = displays.some(display);
      }
      if (displayMatches) {
        // Create a permanent copy that won't be mutated
        trails.push(trail.copy());
      }

      // REVIEW: I'm officially confused about this feature. What is the value of "either or", why not be able to
      // support both visual and PDOM in the same Property? If this is indeed best, please be sure to explain where
      // the option is defined.
      const parents = followPdomOrder && root.pdomParent ? [root.pdomParent] : root.parents;
      parents.forEach(parent => {
        trail.addAncestor(parent);
        recurse();
        trail.removeAncestor();
      });
    })();

    // REVIEW: Webstorm flagged the next 29 lines as duplicated with TrailsBetweenProperty. Let's factor that our or fix that somehow.
    // Add in new needed listeners
    nodeSet.forEach(node => {
      if (!this.listenedNodeSet.has(node)) {
        this.addNodeListener(node);
      }
    });

    // Remove listeners not needed anymore
    this.listenedNodeSet.forEach(node => {
      if (!nodeSet.has(node)) {
        this.removeNodeListener(node);
      }
    });

    // Guard in a way that deepEquality on the Property wouldn't (because of the Array wrapper)
    // NOTE: Duplicated with TrailsBetweenProperty, likely can be factored out.
    // REVIEW: ^^^^ +1, yes please factor out.
    const currentTrails = this.value;
    let trailsEqual = currentTrails.length === trails.length;
    if (trailsEqual) {
      for (let i = 0; i < trails.length; i++) {
        if (!currentTrails[i].equals(trails[i])) {
          trailsEqual = false;
          break;
        }
      }
    }

    // REVIEW: Can this be improved upon by utilizing a custom valueComparisonStrategy? I don't see that being much
    // less performant given that you are doing all the above work on each call to update().
    if (!trailsEqual) {
      this.value = trails;
    }
  }

  // REVIEW: Rename to either `addNodeListeners`, or something more general like `listenToNode()`.
  addNodeListener(node) {
    this.listenedNodeSet.add(node);

    // Unconditional listeners, which affect all nodes.
    node.parentAddedEmitter.addListener(this._trailUpdateListener);
    node.parentRemovedEmitter.addListener(this._trailUpdateListener);
    node.rootedDisplayChangedEmitter.addListener(this._trailUpdateListener);
    node.disposeEmitter.addListener(this._trailUpdateListener);
    if (this.followPdomOrder) {
      node.pdomParentChangedEmitter.addListener(this._trailUpdateListener);
    }
    if (this.requireVisible) {
      node.visibleProperty.lazyLink(this._trailUpdateListener);
    }
    if (this.requirePdomVisible) {
      node.pdomVisibleProperty.lazyLink(this._trailUpdateListener);
    }
    if (this.requireEnabled) {
      node.enabledProperty.lazyLink(this._trailUpdateListener);
    }
    if (this.requireInputEnabled) {
      node.inputEnabledProperty.lazyLink(this._trailUpdateListener);
    }
  }
  removeNodeListener(node) {
    this.listenedNodeSet.delete(node);
    node.parentAddedEmitter.removeListener(this._trailUpdateListener);
    node.parentRemovedEmitter.removeListener(this._trailUpdateListener);
    node.rootedDisplayChangedEmitter.removeListener(this._trailUpdateListener);
    node.disposeEmitter.removeListener(this._trailUpdateListener);
    if (this.followPdomOrder) {
      node.pdomParentChangedEmitter.removeListener(this._trailUpdateListener);
    }
    if (this.requireVisible) {
      node.visibleProperty.unlink(this._trailUpdateListener);
    }
    if (this.requirePdomVisible) {
      node.pdomVisibleProperty.unlink(this._trailUpdateListener);
    }
    if (this.requireEnabled) {
      node.enabledProperty.unlink(this._trailUpdateListener);
    }
    if (this.requireInputEnabled) {
      node.inputEnabledProperty.unlink(this._trailUpdateListener);
    }
  }

  // REVIEW: I always forget why you don't need to also clear your reference to the provided Node. Do you?
  // REVIEW: Also maybe assert here that your provided node is in this listened to Node set?
  dispose() {
    this.listenedNodeSet.forEach(node => this.removeNodeListener(node));
    super.dispose();
  }
}
scenery.register('DisplayedTrailsProperty', DisplayedTrailsProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55UHJvcGVydHkiLCJEaXNwbGF5Iiwic2NlbmVyeSIsIlRyYWlsIiwib3B0aW9uaXplIiwiRGlzcGxheWVkVHJhaWxzUHJvcGVydHkiLCJsaXN0ZW5lZE5vZGVTZXQiLCJTZXQiLCJjb25zdHJ1Y3RvciIsIm5vZGUiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiZGlzcGxheSIsImZvbGxvd1Bkb21PcmRlciIsInJlcXVpcmVWaXNpYmxlIiwicmVxdWlyZVBkb21WaXNpYmxlIiwicmVxdWlyZUVuYWJsZWQiLCJyZXF1aXJlSW5wdXRFbmFibGVkIiwiX3RyYWlsVXBkYXRlTGlzdGVuZXIiLCJ1cGRhdGUiLCJiaW5kIiwidHJhaWxzIiwibm9kZVNldCIsInRyYWlsIiwicmVjdXJzZSIsInJvb3QiLCJyb290Tm9kZSIsImlzRGlzcG9zZWQiLCJhZGQiLCJ2aXNpYmxlIiwicGRvbVZpc2libGUiLCJlbmFibGVkIiwiaW5wdXRFbmFibGVkIiwiZGlzcGxheXMiLCJnZXRSb290ZWREaXNwbGF5cyIsImRpc3BsYXlNYXRjaGVzIiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJzb21lIiwicHVzaCIsImNvcHkiLCJwYXJlbnRzIiwicGRvbVBhcmVudCIsImZvckVhY2giLCJwYXJlbnQiLCJhZGRBbmNlc3RvciIsInJlbW92ZUFuY2VzdG9yIiwiaGFzIiwiYWRkTm9kZUxpc3RlbmVyIiwicmVtb3ZlTm9kZUxpc3RlbmVyIiwiY3VycmVudFRyYWlscyIsInZhbHVlIiwidHJhaWxzRXF1YWwiLCJpIiwiZXF1YWxzIiwicGFyZW50QWRkZWRFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJwYXJlbnRSZW1vdmVkRW1pdHRlciIsInJvb3RlZERpc3BsYXlDaGFuZ2VkRW1pdHRlciIsImRpc3Bvc2VFbWl0dGVyIiwicGRvbVBhcmVudENoYW5nZWRFbWl0dGVyIiwidmlzaWJsZVByb3BlcnR5IiwibGF6eUxpbmsiLCJwZG9tVmlzaWJsZVByb3BlcnR5IiwiZW5hYmxlZFByb3BlcnR5IiwiaW5wdXRFbmFibGVkUHJvcGVydHkiLCJkZWxldGUiLCJyZW1vdmVMaXN0ZW5lciIsInVubGluayIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkRpc3BsYXllZFRyYWlsc1Byb3BlcnR5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIFByb3BlcnR5IHRoYXQgd2lsbCBjb250YWluIGEgbGlzdCBvZiBUcmFpbHMgd2hlcmUgdGhlIHJvb3Qgb2YgdGhlIHRyYWlsIGlzIGEgcm9vdCBOb2RlIG9mIGEgRGlzcGxheSwgYW5kIHRoZSBsZWFmXHJcbiAqIG5vZGUgaXMgdGhlIHByb3ZpZGVkIE5vZGUuXHJcbiAqXHJcbiAqIC8vIFJFVklFVzogVGhpcyBpcyBhIHZlcnkgY29tcGxpY2F0ZWQgY29tcG9uZW50IGFuZCBkZXNlcnZlcyBhIGJpdCBtb3JlIGRvYy4gU29tZSBpZGVhcyBhYm91dCB3aGF0IHRvIGV4cGxhaW46XHJcbiAqIC8vIFJFVklFVzogICAxLiBUaGF0IHRoaXMgaXMgc3luY2hyb25vdXNseSB1cGRhdGVkIGFuZCBkb2Vzbid0IGxpc3RlbiB0byBpbnN0YW5jZXMuXHJcbiAqIC8vIFJFVklFVzogICAyLlxyXG4gKiAvLyBSRVZJRVc6ICAgMi5cclxuICogLy8gUkVWSUVXOiAgIDIuXHJcbiAqXHJcbiAqIC8vIFJFVklFVzogY2FuIHlvdSBkZXNjcmliZSB0aGlzIGEgYml0IG1vcmUuIERvIHlvdSBtZWFuIGFueSBOb2RlIGluIGEgdHJhaWw/IFdoYXQgYWJvdXQgaWYgdGhlIHByb3ZpZGVkIE5vZGUgaXMgZGlzcG9zZWQ/XHJcbiAqIE5PVEU6IElmIGEgTm9kZSBpcyBkaXNwb3NlZCwgaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIHRyYWlscy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBEaXNwbGF5LCBOb2RlLCBzY2VuZXJ5LCBUcmFpbCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5cclxudHlwZSBEaXNwbGF5UHJlZGljYXRlID0gRGlzcGxheSB8ICggKCBkaXNwbGF5OiBEaXNwbGF5ICkgPT4gYm9vbGVhbiApIHwgbnVsbDtcclxuXHJcbmV4cG9ydCB0eXBlIERpc3BsYXllZFRyYWlsc1Byb3BlcnR5T3B0aW9ucyA9IHtcclxuICAvLyBJZiBwcm92aWRlZCwgd2Ugd2lsbCBvbmx5IHJlcG9ydCB0cmFpbHMgdGhhdCBhcmUgcm9vdGVkIGZvciB0aGUgc3BlY2lmaWMgRGlzcGxheSBwcm92aWRlZC5cclxuICBkaXNwbGF5PzogRGlzcGxheVByZWRpY2F0ZTtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2Ugd2lsbCBhZGRpdGlvbmFsbHkgZm9sbG93IHRoZSBwZG9tUGFyZW50IGlmIGl0IGlzIGF2YWlsYWJsZSAoaWYgb3VyIGNoaWxkIG5vZGUgaXMgc3BlY2lmaWVkIGluIGEgcGRvbU9yZGVyIG9mIGFub3RoZXJcclxuICAvLyBub2RlLCB3ZSB3aWxsIGZvbGxvdyB0aGF0IG9yZGVyKS5cclxuICAvLyBUaGlzIGVzc2VudGlhbGx5IHRyYWNrcyB0aGUgZm9sbG93aW5nOlxyXG4gIC8vXHJcbiAgLy8gUkVWSUVXOiBSZW5hbWUgb3B0aW9uIHRvIGZvbGxvd1BET01PcmRlcj8gT25seSBtYXRjaGVzIG9mIGBbYS16XVBkb21bQS1aXWAgYXJlIGZyb20gdGhpcyBpc3N1ZS5cclxuICAvL1xyXG4gIC8vIFJFVklFVzogSSdkIGFjdHVhbGx5IGFkZCBbYS16XT9QZG9tW0EtWl0gdG8gYmFkLXNpbS10ZXh0IGlmIHlvdSdyZSBhbHJpZ2h0IHdpdGggdGhhdC4gQ2xvc2UgdG8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvYmxvYi9mNTZjMjczOTcwZjIyZjg1N2JjOGY1YmQwMTQ4ZjI1NjUzNGE3MDJmL2VzbGludC9ydWxlcy9iYWQtc2ltLXRleHQuanMjTDM1LUwzNlxyXG4gIC8vXHJcbiAgLy8gUkVWSUVXOiBBcmVuJ3QgdGhlc2UgYm9vbGVhbiB2YWx1ZXMgb3Bwb3NpdGU/IGZvbGxvd1BET01PcmRlcjp0cnVlIHNob3VsZCByZXNwZWN0IHBkb21PcmRlci4gQWxzbywgaXQgaXNuJ3QgY2xlYXJcclxuICAvLyAgICAgICAgIGZyb20gdGhlIGRvYyBob3cgeW91IGFzayBmb3IgXCJhbGwgdHJhaWxzLCB2aXN1YWwgb3IgUERPTVwiLiBJcyB0aGF0IHBhcnQgb2YgdGhlIGZlYXR1cmVzZXQ/IEkgYmVsaWV2ZVxyXG4gIC8vICAgICAgICAgdGhhdCBsaWtlbHkgd2Ugd291bGQgYWx3YXlzIGZvcmNlIHZpc2libGUgYXMgYSBiYXNlIGZlYXR1cmUsIGFuZCBvbmx5IGFkZCBvbiB2aXNpYmlsaXR5LCBidXQgdGhpcyBzaG91bGRcclxuICAvLyAgICAgICAgIGJlIGV4cGxhaW5lZC4gQXMgZWFzeSBhcyB0aGUgZG9jIHVwZGF0ZSBhYm92ZSBJIGp1c3QgZGlkOiBcIndlIHdpbGwgX2FkZGl0aW9uYWxseV8gZm9sbG93IHRoZSBwZG9tUGFyZW50XCJcclxuICAvLyAtIGZvbGxvd1Bkb21PcmRlcjogdHJ1ZSA9IHZpc3VhbCB0cmFpbHMgKGp1c3QgY2hpbGRyZW4pXHJcbiAgLy8gLSBmb2xsb3dQZG9tT3JkZXI6IGZhbHNlID0gcGRvbSB0cmFpbHMgKHJlc3BlY3RpbmcgcGRvbU9yZGVyKVxyXG4gIGZvbGxvd1Bkb21PcmRlcj86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIHRydWUsIHdlIHdpbGwgb25seSByZXBvcnQgdHJhaWxzIHdoZXJlIGV2ZXJ5IG5vZGUgaXMgdmlzaWJsZTogdHJ1ZS5cclxuICByZXF1aXJlVmlzaWJsZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIHRydWUsIHdlIHdpbGwgb25seSByZXBvcnQgdHJhaWxzIHdoZXJlIGV2ZXJ5IG5vZGUgaXMgcGRvbVZpc2libGU6IHRydWUuXHJcbiAgcmVxdWlyZVBkb21WaXNpYmxlPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2Ugd2lsbCBvbmx5IHJlcG9ydCB0cmFpbHMgd2hlcmUgZXZlcnkgbm9kZSBpcyBlbmFibGVkOiB0cnVlLlxyXG4gIHJlcXVpcmVFbmFibGVkPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2Ugd2lsbCBvbmx5IHJlcG9ydCB0cmFpbHMgd2hlcmUgZXZlcnkgbm9kZSBpcyBpbnB1dEVuYWJsZWQ6IHRydWUuXHJcbiAgcmVxdWlyZUlucHV0RW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gIC8vIFJFVklFVzogSW5zdGVhZCBvZiBmb2xsb3dpbmcgdGhlIHNhbWUgZmVhdHVyZSBhYm92ZSwgY2FuIHdlIGp1c3QgdXNlIGBwaWNrYWJsZTpmYWxzZWAgdG8gaGVscCB1cyBwcnVuZS4gSSBhZ3JlZVxyXG4gIC8vICAgICAgICAgICBpdCBtYXkgbm90IGJlIHdvcnRoIHdoaWxlIHRvIGxpc3RlbiB0byB0aGUgY29tYm8gb2YgcGlja2FibGUraW5wdXRMaXN0ZW5lckxlbmd0aC4gQ2FuIHlvdSBkZXNjcmliZSB3aGF0IGJlbmVmaXRcclxuICAvLyAgICAgICAgICAgd2UgbWF5IGdldCBieSBhZGRpbmcgaW4gUGlja2FibGUgbGlzdGVuaW5nP1xyXG4gIC8vIE5PVEU6IENvdWxkIHRoaW5rIGFib3V0IGFkZGluZyBwaWNrYWJpbGl0eSBoZXJlIGluIHRoZSBmdXR1cmUuIFRoZSBjb21wbGljYXRpb24gaXMgdGhhdCBpdCBkb2Vzbid0IG1lYXN1cmUgb3VyIGhpdFxyXG4gIC8vIHRlc3RpbmcgcHJlY2lzZWx5LCBiZWNhdXNlIG9mIHBpY2thYmxlOm51bGwgKGRlZmF1bHQpIGFuZCB0aGUgcG90ZW50aWFsIGV4aXN0ZW5jZSBvZiBpbnB1dCBsaXN0ZW5lcnMuXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eSBleHRlbmRzIFRpbnlQcm9wZXJ0eTxUcmFpbFtdPiB7XHJcblxyXG4gIC8vIFJFVklFVzogSG93IGFib3V0IGEgcmVuYW1lIGxpa2UgXCJ0YXJnZXROb2RlXCIsIG5vIHN0cm9uZyBwcmVmZXJlbmNlIGlmIHlvdSBkb24ndCB3YW50IHRvLlxyXG4gIHB1YmxpYyByZWFkb25seSBub2RlOiBOb2RlO1xyXG5cclxuICAvLyBSRVZJRVc6IFBsZWFzZSBhZGQgZG9jIHdoeSB3ZSBvbmx5IG5lZWQgdG8gbGlzdGVuIHRvIGEgTm9kZSBvbmNlLCBldmVuIGlmIGl0IGlzIGluIG11bHRpcGxlIHRyYWlscz9cclxuICBwdWJsaWMgcmVhZG9ubHkgbGlzdGVuZWROb2RlU2V0OiBTZXQ8Tm9kZT4gPSBuZXcgU2V0PE5vZGU+KCk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfdHJhaWxVcGRhdGVMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gUmVjb3JkZWQgb3B0aW9uc1xyXG4gIC8vIFJFVklFVzogUGxlYXNlIHJlbmFtZSB0aGlzIGFuZCB0aGUgb3B0aW9uIHRvIHNvbWV0aGluZyBsZXNzIGNvbmZ1c2luZy4gUGVyaGFwcyBgZGlzcGxheVN1cHBvcnRgLCBvclxyXG4gIC8vIGB3aGljaERpc3BsYXlgLCBvciBzb21ldGhpbmcgdGhhdCBzb3VuZHMgbGlrZSBpdCBjb3VsZCBiZSBhIHByZWRpY2F0ZS5cclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3BsYXk6IERpc3BsYXlQcmVkaWNhdGU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBmb2xsb3dQZG9tT3JkZXI6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZXF1aXJlVmlzaWJsZTogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHJlcXVpcmVQZG9tVmlzaWJsZTogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHJlcXVpcmVFbmFibGVkOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVxdWlyZUlucHV0RW5hYmxlZDogYm9vbGVhbjtcclxuXHJcbiAgLyoqXHJcbiAgICogV2Ugd2lsbCBjb250YWluIFRyYWlscyB3aG9zZSBsZWFmIG5vZGUgKGxhc3ROb2RlKSBpcyB0aGlzIHByb3ZpZGVkIE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBub2RlOiBOb2RlLCBwcm92aWRlZE9wdGlvbnM/OiBEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eU9wdGlvbnM+KCkoIHtcclxuICAgICAgLy8gTGlzdGVuIHRvIGFsbCBkaXNwbGF5c1xyXG4gICAgICBkaXNwbGF5OiBudWxsLFxyXG5cclxuICAgICAgLy8gRGVmYXVsdCB0byB2aXN1YWwgdHJhaWxzIChqdXN0IGNoaWxkcmVuKSwgd2l0aCBvbmx5IHBydW5pbmcgYnkgbm9ybWFsIHZpc2liaWxpdHlcclxuICAgICAgZm9sbG93UGRvbU9yZGVyOiBmYWxzZSxcclxuICAgICAgcmVxdWlyZVZpc2libGU6IHRydWUsXHJcbiAgICAgIHJlcXVpcmVQZG9tVmlzaWJsZTogZmFsc2UsXHJcbiAgICAgIHJlcXVpcmVFbmFibGVkOiBmYWxzZSxcclxuICAgICAgcmVxdWlyZUlucHV0RW5hYmxlZDogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBbXSApO1xyXG5cclxuICAgIC8vIFNhdmUgb3B0aW9ucyBmb3IgbGF0ZXIgdXBkYXRlc1xyXG4gICAgdGhpcy5ub2RlID0gbm9kZTtcclxuICAgIHRoaXMuZGlzcGxheSA9IG9wdGlvbnMuZGlzcGxheTtcclxuICAgIHRoaXMuZm9sbG93UGRvbU9yZGVyID0gb3B0aW9ucy5mb2xsb3dQZG9tT3JkZXI7XHJcbiAgICB0aGlzLnJlcXVpcmVWaXNpYmxlID0gb3B0aW9ucy5yZXF1aXJlVmlzaWJsZTtcclxuICAgIHRoaXMucmVxdWlyZVBkb21WaXNpYmxlID0gb3B0aW9ucy5yZXF1aXJlUGRvbVZpc2libGU7XHJcbiAgICB0aGlzLnJlcXVpcmVFbmFibGVkID0gb3B0aW9ucy5yZXF1aXJlRW5hYmxlZDtcclxuICAgIHRoaXMucmVxdWlyZUlucHV0RW5hYmxlZCA9IG9wdGlvbnMucmVxdWlyZUlucHV0RW5hYmxlZDtcclxuXHJcbiAgICB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyID0gdGhpcy51cGRhdGUuYmluZCggdGhpcyApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBGYWN0b3JlZCBvdXQgYmVjYXVzZSB3ZSdyZSB1c2luZyBhIFwiZnVuY3Rpb25cIiBiZWxvdyBmb3IgcmVjdXJzaW9uIChOT1QgYW4gYXJyb3cgZnVuY3Rpb24pXHJcbiAgICBjb25zdCBkaXNwbGF5ID0gdGhpcy5kaXNwbGF5O1xyXG4gICAgY29uc3QgZm9sbG93UGRvbU9yZGVyID0gdGhpcy5mb2xsb3dQZG9tT3JkZXI7XHJcbiAgICBjb25zdCByZXF1aXJlVmlzaWJsZSA9IHRoaXMucmVxdWlyZVZpc2libGU7XHJcbiAgICBjb25zdCByZXF1aXJlUGRvbVZpc2libGUgPSB0aGlzLnJlcXVpcmVQZG9tVmlzaWJsZTtcclxuICAgIGNvbnN0IHJlcXVpcmVFbmFibGVkID0gdGhpcy5yZXF1aXJlRW5hYmxlZDtcclxuICAgIGNvbnN0IHJlcXVpcmVJbnB1dEVuYWJsZWQgPSB0aGlzLnJlcXVpcmVJbnB1dEVuYWJsZWQ7XHJcblxyXG4gICAgLy8gVHJhaWxzIGFjY3VtdWxhdGVkIGluIG91ciByZWN1cnNpb24gdGhhdCB3aWxsIGJlIG91ciBQcm9wZXJ0eSdzIHZhbHVlXHJcbiAgICBjb25zdCB0cmFpbHM6IFRyYWlsW10gPSBbXTtcclxuXHJcbiAgICAvLyBOb2RlcyB0aGF0IHdlcmUgdG91Y2hlZCBpbiB0aGUgc2NhbiAod2Ugc2hvdWxkIGxpc3RlbiB0byBjaGFuZ2VzIHRvIEFOWSBvZiB0aGVzZSB0byBzZWUgaWYgdGhlcmUgaXMgYSBjb25uZWN0aW9uXHJcbiAgICAvLyBvciBkaXNjb25uZWN0aW9uKS4gVGhpcyBjb3VsZCBwb3RlbnRpYWxseSBjYXVzZSBvdXIgUHJvcGVydHkgdG8gY2hhbmdlXHJcbiAgICBjb25zdCBub2RlU2V0ID0gbmV3IFNldDxOb2RlPigpO1xyXG5cclxuICAgIC8vIE1vZGlmaWVkIGluLXBsYWNlIGR1cmluZyB0aGUgc2VhcmNoXHJcbiAgICBjb25zdCB0cmFpbCA9IG5ldyBUcmFpbCggdGhpcy5ub2RlICk7XHJcblxyXG4gICAgLy8gV2Ugd2lsbCByZWN1cnNpdmVseSBhZGQgdGhpbmdzIHRvIHRoZSBcImZyb250XCIgb2YgdGhlIHRyYWlsIChhbmNlc3RvcnMpXHJcbiAgICAoIGZ1bmN0aW9uIHJlY3Vyc2UoKSB7XHJcbiAgICAgIGNvbnN0IHJvb3QgPSB0cmFpbC5yb290Tm9kZSgpO1xyXG5cclxuICAgICAgLy8gSWYgYSBOb2RlIGlzIGRpc3Bvc2VkLCB3ZSB3b24ndCBhZGQgbGlzdGVuZXJzIHRvIGl0LCBzbyB3ZSBhYm9ydCBzbGlnaHRseSBlYXJsaWVyLlxyXG4gICAgICBpZiAoIHJvb3QuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG5vZGVTZXQuYWRkKCByb290ICk7XHJcblxyXG4gICAgICAvLyBSRVZJRVc6IFBsZWFzZSBzYXkgd2h5IHdlIG5lZWQgbGlzdGVuZXJzIG9uIHRoaXMgTm9kZS4gQWxzbyBwbGVhc2UgY29uZmlybSAodmlhIGRvYykgdGhhdCBhZGRpbmdcclxuICAgICAgLy8gSWYgd2UgZmFpbCBvdGhlciBjb25kaXRpb25zLCB3ZSB3b24ndCBhZGQgYSB0cmFpbCBPUiByZWN1cnNlLCBidXQgd2Ugd2lsbCBTVElMTCBoYXZlIGxpc3RlbmVycyBhZGRlZCB0byB0aGUgTm9kZS5cclxuICAgICAgaWYgKFxyXG4gICAgICAgICggcmVxdWlyZVZpc2libGUgJiYgIXJvb3QudmlzaWJsZSApIHx8XHJcbiAgICAgICAgKCByZXF1aXJlUGRvbVZpc2libGUgJiYgIXJvb3QucGRvbVZpc2libGUgKSB8fFxyXG4gICAgICAgICggcmVxdWlyZUVuYWJsZWQgJiYgIXJvb3QuZW5hYmxlZCApIHx8XHJcbiAgICAgICAgKCByZXF1aXJlSW5wdXRFbmFibGVkICYmICFyb290LmlucHV0RW5hYmxlZCApXHJcbiAgICAgICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZGlzcGxheXMgPSByb290LmdldFJvb3RlZERpc3BsYXlzKCk7XHJcblxyXG4gICAgICAvLyBSRVZJRVc6IGluaXRpYWxpemUgdG8gZmFsc2U/XHJcbiAgICAgIGxldCBkaXNwbGF5TWF0Y2hlczogYm9vbGVhbjtcclxuXHJcbiAgICAgIGlmICggZGlzcGxheSA9PT0gbnVsbCApIHtcclxuICAgICAgICBkaXNwbGF5TWF0Y2hlcyA9IGRpc3BsYXlzLmxlbmd0aCA+IDA7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGRpc3BsYXkgaW5zdGFuY2VvZiBEaXNwbGF5ICkge1xyXG4gICAgICAgIGRpc3BsYXlNYXRjaGVzID0gZGlzcGxheXMuaW5jbHVkZXMoIGRpc3BsYXkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBkaXNwbGF5TWF0Y2hlcyA9IGRpc3BsYXlzLnNvbWUoIGRpc3BsYXkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBkaXNwbGF5TWF0Y2hlcyApIHtcclxuICAgICAgICAvLyBDcmVhdGUgYSBwZXJtYW5lbnQgY29weSB0aGF0IHdvbid0IGJlIG11dGF0ZWRcclxuICAgICAgICB0cmFpbHMucHVzaCggdHJhaWwuY29weSgpICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJFVklFVzogSSdtIG9mZmljaWFsbHkgY29uZnVzZWQgYWJvdXQgdGhpcyBmZWF0dXJlLiBXaGF0IGlzIHRoZSB2YWx1ZSBvZiBcImVpdGhlciBvclwiLCB3aHkgbm90IGJlIGFibGUgdG9cclxuICAgICAgLy8gc3VwcG9ydCBib3RoIHZpc3VhbCBhbmQgUERPTSBpbiB0aGUgc2FtZSBQcm9wZXJ0eT8gSWYgdGhpcyBpcyBpbmRlZWQgYmVzdCwgcGxlYXNlIGJlIHN1cmUgdG8gZXhwbGFpbiB3aGVyZVxyXG4gICAgICAvLyB0aGUgb3B0aW9uIGlzIGRlZmluZWQuXHJcbiAgICAgIGNvbnN0IHBhcmVudHMgPSBmb2xsb3dQZG9tT3JkZXIgJiYgcm9vdC5wZG9tUGFyZW50ID8gWyByb290LnBkb21QYXJlbnQgXSA6IHJvb3QucGFyZW50cztcclxuXHJcbiAgICAgIHBhcmVudHMuZm9yRWFjaCggcGFyZW50ID0+IHtcclxuICAgICAgICB0cmFpbC5hZGRBbmNlc3RvciggcGFyZW50ICk7XHJcbiAgICAgICAgcmVjdXJzZSgpO1xyXG4gICAgICAgIHRyYWlsLnJlbW92ZUFuY2VzdG9yKCk7XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKSgpO1xyXG5cclxuICAgIC8vIFJFVklFVzogV2Vic3Rvcm0gZmxhZ2dlZCB0aGUgbmV4dCAyOSBsaW5lcyBhcyBkdXBsaWNhdGVkIHdpdGggVHJhaWxzQmV0d2VlblByb3BlcnR5LiBMZXQncyBmYWN0b3IgdGhhdCBvdXIgb3IgZml4IHRoYXQgc29tZWhvdy5cclxuICAgIC8vIEFkZCBpbiBuZXcgbmVlZGVkIGxpc3RlbmVyc1xyXG4gICAgbm9kZVNldC5mb3JFYWNoKCBub2RlID0+IHtcclxuICAgICAgaWYgKCAhdGhpcy5saXN0ZW5lZE5vZGVTZXQuaGFzKCBub2RlICkgKSB7XHJcbiAgICAgICAgdGhpcy5hZGROb2RlTGlzdGVuZXIoIG5vZGUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFJlbW92ZSBsaXN0ZW5lcnMgbm90IG5lZWRlZCBhbnltb3JlXHJcbiAgICB0aGlzLmxpc3RlbmVkTm9kZVNldC5mb3JFYWNoKCBub2RlID0+IHtcclxuICAgICAgaWYgKCAhbm9kZVNldC5oYXMoIG5vZGUgKSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU5vZGVMaXN0ZW5lciggbm9kZSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gR3VhcmQgaW4gYSB3YXkgdGhhdCBkZWVwRXF1YWxpdHkgb24gdGhlIFByb3BlcnR5IHdvdWxkbid0IChiZWNhdXNlIG9mIHRoZSBBcnJheSB3cmFwcGVyKVxyXG4gICAgLy8gTk9URTogRHVwbGljYXRlZCB3aXRoIFRyYWlsc0JldHdlZW5Qcm9wZXJ0eSwgbGlrZWx5IGNhbiBiZSBmYWN0b3JlZCBvdXQuXHJcbiAgICAvLyBSRVZJRVc6IF5eXl4gKzEsIHllcyBwbGVhc2UgZmFjdG9yIG91dC5cclxuICAgIGNvbnN0IGN1cnJlbnRUcmFpbHMgPSB0aGlzLnZhbHVlO1xyXG4gICAgbGV0IHRyYWlsc0VxdWFsID0gY3VycmVudFRyYWlscy5sZW5ndGggPT09IHRyYWlscy5sZW5ndGg7XHJcbiAgICBpZiAoIHRyYWlsc0VxdWFsICkge1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0cmFpbHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgaWYgKCAhY3VycmVudFRyYWlsc1sgaSBdLmVxdWFscyggdHJhaWxzWyBpIF0gKSApIHtcclxuICAgICAgICAgIHRyYWlsc0VxdWFsID0gZmFsc2U7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBSRVZJRVc6IENhbiB0aGlzIGJlIGltcHJvdmVkIHVwb24gYnkgdXRpbGl6aW5nIGEgY3VzdG9tIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5PyBJIGRvbid0IHNlZSB0aGF0IGJlaW5nIG11Y2hcclxuICAgIC8vIGxlc3MgcGVyZm9ybWFudCBnaXZlbiB0aGF0IHlvdSBhcmUgZG9pbmcgYWxsIHRoZSBhYm92ZSB3b3JrIG9uIGVhY2ggY2FsbCB0byB1cGRhdGUoKS5cclxuICAgIGlmICggIXRyYWlsc0VxdWFsICkge1xyXG4gICAgICB0aGlzLnZhbHVlID0gdHJhaWxzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUkVWSUVXOiBSZW5hbWUgdG8gZWl0aGVyIGBhZGROb2RlTGlzdGVuZXJzYCwgb3Igc29tZXRoaW5nIG1vcmUgZ2VuZXJhbCBsaWtlIGBsaXN0ZW5Ub05vZGUoKWAuXHJcbiAgcHJpdmF0ZSBhZGROb2RlTGlzdGVuZXIoIG5vZGU6IE5vZGUgKTogdm9pZCB7XHJcbiAgICB0aGlzLmxpc3RlbmVkTm9kZVNldC5hZGQoIG5vZGUgKTtcclxuXHJcbiAgICAvLyBVbmNvbmRpdGlvbmFsIGxpc3RlbmVycywgd2hpY2ggYWZmZWN0IGFsbCBub2Rlcy5cclxuICAgIG5vZGUucGFyZW50QWRkZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICBub2RlLnBhcmVudFJlbW92ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICBub2RlLnJvb3RlZERpc3BsYXlDaGFuZ2VkRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5fdHJhaWxVcGRhdGVMaXN0ZW5lciApO1xyXG4gICAgbm9kZS5kaXNwb3NlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5fdHJhaWxVcGRhdGVMaXN0ZW5lciApO1xyXG5cclxuICAgIGlmICggdGhpcy5mb2xsb3dQZG9tT3JkZXIgKSB7XHJcbiAgICAgIG5vZGUucGRvbVBhcmVudENoYW5nZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMucmVxdWlyZVZpc2libGUgKSB7XHJcbiAgICAgIG5vZGUudmlzaWJsZVByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMucmVxdWlyZVBkb21WaXNpYmxlICkge1xyXG4gICAgICBub2RlLnBkb21WaXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5yZXF1aXJlRW5hYmxlZCApIHtcclxuICAgICAgbm9kZS5lbmFibGVkUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5yZXF1aXJlSW5wdXRFbmFibGVkICkge1xyXG4gICAgICBub2RlLmlucHV0RW5hYmxlZFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbW92ZU5vZGVMaXN0ZW5lciggbm9kZTogTm9kZSApOiB2b2lkIHtcclxuICAgIHRoaXMubGlzdGVuZWROb2RlU2V0LmRlbGV0ZSggbm9kZSApO1xyXG4gICAgbm9kZS5wYXJlbnRBZGRlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIG5vZGUucGFyZW50UmVtb3ZlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIG5vZGUucm9vdGVkRGlzcGxheUNoYW5nZWRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICBub2RlLmRpc3Bvc2VFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLmZvbGxvd1Bkb21PcmRlciApIHtcclxuICAgICAgbm9kZS5wZG9tUGFyZW50Q2hhbmdlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5yZXF1aXJlVmlzaWJsZSApIHtcclxuICAgICAgbm9kZS52aXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMucmVxdWlyZVBkb21WaXNpYmxlICkge1xyXG4gICAgICBub2RlLnBkb21WaXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMucmVxdWlyZUVuYWJsZWQgKSB7XHJcbiAgICAgIG5vZGUuZW5hYmxlZFByb3BlcnR5LnVubGluayggdGhpcy5fdHJhaWxVcGRhdGVMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0aGlzLnJlcXVpcmVJbnB1dEVuYWJsZWQgKSB7XHJcbiAgICAgIG5vZGUuaW5wdXRFbmFibGVkUHJvcGVydHkudW5saW5rKCB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBSRVZJRVc6IEkgYWx3YXlzIGZvcmdldCB3aHkgeW91IGRvbid0IG5lZWQgdG8gYWxzbyBjbGVhciB5b3VyIHJlZmVyZW5jZSB0byB0aGUgcHJvdmlkZWQgTm9kZS4gRG8geW91P1xyXG4gIC8vIFJFVklFVzogQWxzbyBtYXliZSBhc3NlcnQgaGVyZSB0aGF0IHlvdXIgcHJvdmlkZWQgbm9kZSBpcyBpbiB0aGlzIGxpc3RlbmVkIHRvIE5vZGUgc2V0P1xyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5saXN0ZW5lZE5vZGVTZXQuZm9yRWFjaCggbm9kZSA9PiB0aGlzLnJlbW92ZU5vZGVMaXN0ZW5lciggbm9kZSApICk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0Rpc3BsYXllZFRyYWlsc1Byb3BlcnR5JywgRGlzcGxheWVkVHJhaWxzUHJvcGVydHkgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxZQUFZLE1BQU0sa0NBQWtDO0FBQzNELFNBQVNDLE9BQU8sRUFBUUMsT0FBTyxFQUFFQyxLQUFLLFFBQVEsZUFBZTtBQUM3RCxPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBMkMxRCxlQUFlLE1BQU1DLHVCQUF1QixTQUFTTCxZQUFZLENBQVU7RUFFekU7O0VBR0E7RUFDZ0JNLGVBQWUsR0FBYyxJQUFJQyxHQUFHLENBQU8sQ0FBQzs7RUFHNUQ7RUFDQTtFQUNBOztFQVFBO0FBQ0Y7QUFDQTtFQUNTQyxXQUFXQSxDQUFFQyxJQUFVLEVBQUVDLGVBQWdELEVBQUc7SUFFakYsTUFBTUMsT0FBTyxHQUFHUCxTQUFTLENBQWlDLENBQUMsQ0FBRTtNQUMzRDtNQUNBUSxPQUFPLEVBQUUsSUFBSTtNQUViO01BQ0FDLGVBQWUsRUFBRSxLQUFLO01BQ3RCQyxjQUFjLEVBQUUsSUFBSTtNQUNwQkMsa0JBQWtCLEVBQUUsS0FBSztNQUN6QkMsY0FBYyxFQUFFLEtBQUs7TUFDckJDLG1CQUFtQixFQUFFO0lBQ3ZCLENBQUMsRUFBRVAsZUFBZ0IsQ0FBQztJQUVwQixLQUFLLENBQUUsRUFBRyxDQUFDOztJQUVYO0lBQ0EsSUFBSSxDQUFDRCxJQUFJLEdBQUdBLElBQUk7SUFDaEIsSUFBSSxDQUFDRyxPQUFPLEdBQUdELE9BQU8sQ0FBQ0MsT0FBTztJQUM5QixJQUFJLENBQUNDLGVBQWUsR0FBR0YsT0FBTyxDQUFDRSxlQUFlO0lBQzlDLElBQUksQ0FBQ0MsY0FBYyxHQUFHSCxPQUFPLENBQUNHLGNBQWM7SUFDNUMsSUFBSSxDQUFDQyxrQkFBa0IsR0FBR0osT0FBTyxD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