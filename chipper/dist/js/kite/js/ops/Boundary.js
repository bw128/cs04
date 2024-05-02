// Copyright 2017-2023, University of Colorado Boulder

/**
 * A boundary is a loop of directed half-edges that always follow in the tightest counter-clockwise direction around
 * vertices.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Ray2 from '../../../dot/js/Ray2.js';
import Vector2 from '../../../dot/js/Vector2.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Pool from '../../../phet-core/js/Pool.js';
import { kite, Subpath } from '../imports.js';
let globaId = 0;
class Boundary {
  /**
   * @public (kite-internal)
   *
   * NOTE: Use Boundary.pool.create for most usage instead of using the constructor directly.
   *
   * @param {Array.<HalfEdge>} halfEdges
   */
  constructor(halfEdges) {
    // @public {number}
    this.id = ++globaId;

    // NOTE: most object properties are declared/documented in the initialize method. Please look there for most
    // definitions.
    this.initialize(halfEdges);
  }

  /**
   * Similar to a usual constructor, but is set up so it can be called multiple times (with dispose() in-between) to
   * support pooling.
   * @private
   *
   * @param {Array.<HalfEdge>} halfEdges
   * @returns {Boundary} - This reference for chaining
   */
  initialize(halfEdges) {
    // @public {Array.<HalfEdge>}
    this.halfEdges = halfEdges;

    // @public {number}
    this.signedArea = this.computeSignedArea();

    // @public {Bounds2}
    this.bounds = this.computeBounds();

    // @public {Array.<Boundary>}
    this.childBoundaries = cleanArray(this.childBoundaries);
    return this;
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   * @public
   *
   * @returns {Object}
   */
  serialize() {
    return {
      type: 'Boundary',
      id: this.id,
      halfEdges: this.halfEdges.map(halfEdge => halfEdge.id),
      signedArea: this.signedArea,
      bounds: Bounds2.Bounds2IO.toStateObject(this.bounds),
      childBoundaries: this.childBoundaries.map(boundary => boundary.id)
    };
  }

  /**
   * Removes references (so it can allow other objects to be GC'ed or pooled), and frees itself to the pool so it
   * can be reused.
   * @public
   */
  dispose() {
    this.halfEdges = [];
    cleanArray(this.childBoundaries);
    this.freeToPool();
  }

  /**
   * Returns whether this boundary is essentially "counter-clockwise" (in the non-reversed coordinate system) with
   * positive signed area, or "clockwise" with negative signed area.
   * @public
   *
   * Boundaries are treated as "inner" boundaries when they are counter-clockwise, as the path followed will generally
   * follow the inside of a face (given how the "next" edge of a vertex is computed).
   *
   * @returns {number}
   */
  isInner() {
    return this.signedArea > 0;
  }

  /**
   * Returns the signed area of this boundary, given its half edges.
   * @public
   *
   * Each half-edge has its own contribution to the signed area, which are summed together.
   *
   * @returns {number}
   */
  computeSignedArea() {
    let signedArea = 0;
    for (let i = 0; i < this.halfEdges.length; i++) {
      signedArea += this.halfEdges[i].signedAreaFragment;
    }
    return signedArea;
  }

  /**
   * Returns the bounds of the boundary (the union of each of the boundary's segments' bounds).
   * @public
   *
   * @returns {Bounds2}
   */
  computeBounds() {
    const bounds = Bounds2.NOTHING.copy();
    for (let i = 0; i < this.halfEdges.length; i++) {
      bounds.includeBounds(this.halfEdges[i].edge.segment.getBounds());
    }
    return bounds;
  }

  /**
   * Returns a point on the boundary which, when the shape (and point) are transformed with the given transform, would
   * be a point with the minimal y value.
   * @public
   *
   * Will only return one point, even if there are multiple points that have the same minimal y values for the
   * boundary. The point may be at the end of one of the edges/segments (at a vertex), but also may somewhere in the
   * middle of an edge/segment.
   *
   * @param {Transform3} transform - Transform used because we want the inverse also.
   * @returns {Vector2}
   */
  computeExtremePoint(transform) {
    assert && assert(this.halfEdges.length > 0, 'There is no extreme point if we have no edges');

    // Transform all of the segments into the new transformed coordinate space.
    const transformedSegments = [];
    for (let i = 0; i < this.halfEdges.length; i++) {
      transformedSegments.push(this.halfEdges[i].edge.segment.transformed(transform.getMatrix()));
    }

    // Find the bounds of the entire transformed boundary
    const transformedBounds = Bounds2.NOTHING.copy();
    for (let i = 0; i < transformedSegments.length; i++) {
      transformedBounds.includeBounds(transformedSegments[i].getBounds());
    }
    for (let i = 0; i < transformedSegments.length; i++) {
      const segment = transformedSegments[i];

      // See if this is one of our potential segments whose bounds have the minimal y value. This indicates at least
      // one point on this segment will be a minimal-y point.
      if (segment.getBounds().top === transformedBounds.top) {
        // Pick a point with values that guarantees any point will have a smaller y value.
        let minimalPoint = new Vector2(0, Number.POSITIVE_INFINITY);

        // Grab parametric t-values for where our segment has extreme points, and adds the end points (which are
        // candidates). One of the points at these values should be our minimal point.
        const tValues = [0, 1].concat(segment.getInteriorExtremaTs());
        for (let j = 0; j < tValues.length; j++) {
          const point = segment.positionAt(tValues[j]);
          if (point.y < minimalPoint.y) {
            minimalPoint = point;
          }
        }

        // Transform this minimal point back into our (non-transformed) boundary's coordinate space.
        return transform.inversePosition2(minimalPoint);
      }
    }
    throw new Error('Should not reach here if we have segments');
  }

  /**
   * Returns a ray (position and direction) pointing away from our boundary at an "extreme" point, so that the ray
   * will be guaranteed not to intersect this boundary.
   * @public
   *
   * The ray's position will be slightly offset from the boundary, so that it will not technically intersect the
   * boundary where the extreme point lies. The extreme point will be chosen such that it would have the smallest
   * y value when the boundary is transformed by the given transformation.
   *
   * The ray's direction will be such that if the ray is transformed by the given transform, it will be pointing
   * in the negative-y direction (e.g. a vector of (0,-1)). This should guarantee it is facing away from the
   * boundary, and will be consistent in direction with other extreme rays (needed for its use case with the
   * boundary graph).
   *
   * @param {Transform3} transform
   * @returns {Ray2}
   */
  computeExtremeRay(transform) {
    const extremePoint = this.computeExtremePoint(transform);
    const orientation = transform.inverseDelta2(new Vector2(0, -1)).normalized();
    return new Ray2(extremePoint.plus(orientation.timesScalar(1e-4)), orientation);
  }

  /**
   * Returns whether this boundary includes the specified half-edge.
   * @public
   *
   * @param {HalfEdge} halfEdge
   * @returns {boolean}
   */
  hasHalfEdge(halfEdge) {
    for (let i = 0; i < this.halfEdges.length; i++) {
      if (this.halfEdges[i] === halfEdge) {
        return true;
      }
    }
    return false;
  }

  /**
   * Converts this boundary to a Subpath, so that we can construct things like Shape objects from it.
   * @public
   *
   * @returns {Subpath}
   */
  toSubpath() {
    const segments = [];
    for (let i = 0; i < this.halfEdges.length; i++) {
      segments.push(this.halfEdges[i].getDirectionalSegment());
    }
    return new Subpath(segments, null, true);
  }

  // @public
  freeToPool() {
    Boundary.pool.freeToPool(this);
  }

  // @public
  static pool = new Pool(Boundary);
}
kite.register('Boundary', Boundary);
export default Boundary;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiUmF5MiIsIlZlY3RvcjIiLCJjbGVhbkFycmF5IiwiUG9vbCIsImtpdGUiLCJTdWJwYXRoIiwiZ2xvYmFJZCIsIkJvdW5kYXJ5IiwiY29uc3RydWN0b3IiLCJoYWxmRWRnZXMiLCJpZCIsImluaXRpYWxpemUiLCJzaWduZWRBcmVhIiwiY29tcHV0ZVNpZ25lZEFyZWEiLCJib3VuZHMiLCJjb21wdXRlQm91bmRzIiwiY2hpbGRCb3VuZGFyaWVzIiwic2VyaWFsaXplIiwidHlwZSIsIm1hcCIsImhhbGZFZGdlIiwiQm91bmRzMklPIiwidG9TdGF0ZU9iamVjdCIsImJvdW5kYXJ5IiwiZGlzcG9zZSIsImZyZWVUb1Bvb2wiLCJpc0lubmVyIiwiaSIsImxlbmd0aCIsInNpZ25lZEFyZWFGcmFnbWVudCIsIk5PVEhJTkciLCJjb3B5IiwiaW5jbHVkZUJvdW5kcyIsImVkZ2UiLCJzZWdtZW50IiwiZ2V0Qm91bmRzIiwiY29tcHV0ZUV4dHJlbWVQb2ludCIsInRyYW5zZm9ybSIsImFzc2VydCIsInRyYW5zZm9ybWVkU2VnbWVudHMiLCJwdXNoIiwidHJhbnNmb3JtZWQiLCJnZXRNYXRyaXgiLCJ0cmFuc2Zvcm1lZEJvdW5kcyIsInRvcCIsIm1pbmltYWxQb2ludCIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwidFZhbHVlcyIsImNvbmNhdCIsImdldEludGVyaW9yRXh0cmVtYVRzIiwiaiIsInBvaW50IiwicG9zaXRpb25BdCIsInkiLCJpbnZlcnNlUG9zaXRpb24yIiwiRXJyb3IiLCJjb21wdXRlRXh0cmVtZVJheSIsImV4dHJlbWVQb2ludCIsIm9yaWVudGF0aW9uIiwiaW52ZXJzZURlbHRhMiIsIm5vcm1hbGl6ZWQiLCJwbHVzIiwidGltZXNTY2FsYXIiLCJoYXNIYWxmRWRnZSIsInRvU3VicGF0aCIsInNlZ21lbnRzIiwiZ2V0RGlyZWN0aW9uYWxTZWdtZW50IiwicG9vbCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQm91bmRhcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBib3VuZGFyeSBpcyBhIGxvb3Agb2YgZGlyZWN0ZWQgaGFsZi1lZGdlcyB0aGF0IGFsd2F5cyBmb2xsb3cgaW4gdGhlIHRpZ2h0ZXN0IGNvdW50ZXItY2xvY2t3aXNlIGRpcmVjdGlvbiBhcm91bmRcclxuICogdmVydGljZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBSYXkyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9SYXkyLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBQb29sIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sLmpzJztcclxuaW1wb3J0IHsga2l0ZSwgU3VicGF0aCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxubGV0IGdsb2JhSWQgPSAwO1xyXG5cclxuY2xhc3MgQm91bmRhcnkge1xyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWMgKGtpdGUtaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBVc2UgQm91bmRhcnkucG9vbC5jcmVhdGUgZm9yIG1vc3QgdXNhZ2UgaW5zdGVhZCBvZiB1c2luZyB0aGUgY29uc3RydWN0b3IgZGlyZWN0bHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5LjxIYWxmRWRnZT59IGhhbGZFZGdlc1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBoYWxmRWRnZXMgKSB7XHJcbiAgICAvLyBAcHVibGljIHtudW1iZXJ9XHJcbiAgICB0aGlzLmlkID0gKytnbG9iYUlkO1xyXG5cclxuICAgIC8vIE5PVEU6IG1vc3Qgb2JqZWN0IHByb3BlcnRpZXMgYXJlIGRlY2xhcmVkL2RvY3VtZW50ZWQgaW4gdGhlIGluaXRpYWxpemUgbWV0aG9kLiBQbGVhc2UgbG9vayB0aGVyZSBmb3IgbW9zdFxyXG4gICAgLy8gZGVmaW5pdGlvbnMuXHJcbiAgICB0aGlzLmluaXRpYWxpemUoIGhhbGZFZGdlcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2ltaWxhciB0byBhIHVzdWFsIGNvbnN0cnVjdG9yLCBidXQgaXMgc2V0IHVwIHNvIGl0IGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgKHdpdGggZGlzcG9zZSgpIGluLWJldHdlZW4pIHRvXHJcbiAgICogc3VwcG9ydCBwb29saW5nLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5LjxIYWxmRWRnZT59IGhhbGZFZGdlc1xyXG4gICAqIEByZXR1cm5zIHtCb3VuZGFyeX0gLSBUaGlzIHJlZmVyZW5jZSBmb3IgY2hhaW5pbmdcclxuICAgKi9cclxuICBpbml0aWFsaXplKCBoYWxmRWRnZXMgKSB7XHJcbiAgICAvLyBAcHVibGljIHtBcnJheS48SGFsZkVkZ2U+fVxyXG4gICAgdGhpcy5oYWxmRWRnZXMgPSBoYWxmRWRnZXM7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7bnVtYmVyfVxyXG4gICAgdGhpcy5zaWduZWRBcmVhID0gdGhpcy5jb21wdXRlU2lnbmVkQXJlYSgpO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0JvdW5kczJ9XHJcbiAgICB0aGlzLmJvdW5kcyA9IHRoaXMuY29tcHV0ZUJvdW5kcygpO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0FycmF5LjxCb3VuZGFyeT59XHJcbiAgICB0aGlzLmNoaWxkQm91bmRhcmllcyA9IGNsZWFuQXJyYXkoIHRoaXMuY2hpbGRCb3VuZGFyaWVzICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICovXHJcbiAgc2VyaWFsaXplKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0JvdW5kYXJ5JyxcclxuICAgICAgaWQ6IHRoaXMuaWQsXHJcbiAgICAgIGhhbGZFZGdlczogdGhpcy5oYWxmRWRnZXMubWFwKCBoYWxmRWRnZSA9PiBoYWxmRWRnZS5pZCApLFxyXG4gICAgICBzaWduZWRBcmVhOiB0aGlzLnNpZ25lZEFyZWEsXHJcbiAgICAgIGJvdW5kczogQm91bmRzMi5Cb3VuZHMySU8udG9TdGF0ZU9iamVjdCggdGhpcy5ib3VuZHMgKSxcclxuICAgICAgY2hpbGRCb3VuZGFyaWVzOiB0aGlzLmNoaWxkQm91bmRhcmllcy5tYXAoIGJvdW5kYXJ5ID0+IGJvdW5kYXJ5LmlkIClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIHJlZmVyZW5jZXMgKHNvIGl0IGNhbiBhbGxvdyBvdGhlciBvYmplY3RzIHRvIGJlIEdDJ2VkIG9yIHBvb2xlZCksIGFuZCBmcmVlcyBpdHNlbGYgdG8gdGhlIHBvb2wgc28gaXRcclxuICAgKiBjYW4gYmUgcmV1c2VkLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBkaXNwb3NlKCkge1xyXG4gICAgdGhpcy5oYWxmRWRnZXMgPSBbXTtcclxuICAgIGNsZWFuQXJyYXkoIHRoaXMuY2hpbGRCb3VuZGFyaWVzICk7XHJcbiAgICB0aGlzLmZyZWVUb1Bvb2woKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIGJvdW5kYXJ5IGlzIGVzc2VudGlhbGx5IFwiY291bnRlci1jbG9ja3dpc2VcIiAoaW4gdGhlIG5vbi1yZXZlcnNlZCBjb29yZGluYXRlIHN5c3RlbSkgd2l0aFxyXG4gICAqIHBvc2l0aXZlIHNpZ25lZCBhcmVhLCBvciBcImNsb2Nrd2lzZVwiIHdpdGggbmVnYXRpdmUgc2lnbmVkIGFyZWEuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQm91bmRhcmllcyBhcmUgdHJlYXRlZCBhcyBcImlubmVyXCIgYm91bmRhcmllcyB3aGVuIHRoZXkgYXJlIGNvdW50ZXItY2xvY2t3aXNlLCBhcyB0aGUgcGF0aCBmb2xsb3dlZCB3aWxsIGdlbmVyYWxseVxyXG4gICAqIGZvbGxvdyB0aGUgaW5zaWRlIG9mIGEgZmFjZSAoZ2l2ZW4gaG93IHRoZSBcIm5leHRcIiBlZGdlIG9mIGEgdmVydGV4IGlzIGNvbXB1dGVkKS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgaXNJbm5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLnNpZ25lZEFyZWEgPiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2lnbmVkIGFyZWEgb2YgdGhpcyBib3VuZGFyeSwgZ2l2ZW4gaXRzIGhhbGYgZWRnZXMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogRWFjaCBoYWxmLWVkZ2UgaGFzIGl0cyBvd24gY29udHJpYnV0aW9uIHRvIHRoZSBzaWduZWQgYXJlYSwgd2hpY2ggYXJlIHN1bW1lZCB0b2dldGhlci5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgY29tcHV0ZVNpZ25lZEFyZWEoKSB7XHJcbiAgICBsZXQgc2lnbmVkQXJlYSA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmhhbGZFZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgc2lnbmVkQXJlYSArPSB0aGlzLmhhbGZFZGdlc1sgaSBdLnNpZ25lZEFyZWFGcmFnbWVudDtcclxuICAgIH1cclxuICAgIHJldHVybiBzaWduZWRBcmVhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoZSBib3VuZGFyeSAodGhlIHVuaW9uIG9mIGVhY2ggb2YgdGhlIGJvdW5kYXJ5J3Mgc2VnbWVudHMnIGJvdW5kcykuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge0JvdW5kczJ9XHJcbiAgICovXHJcbiAgY29tcHV0ZUJvdW5kcygpIHtcclxuICAgIGNvbnN0IGJvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5oYWxmRWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCB0aGlzLmhhbGZFZGdlc1sgaSBdLmVkZ2Uuc2VnbWVudC5nZXRCb3VuZHMoKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBwb2ludCBvbiB0aGUgYm91bmRhcnkgd2hpY2gsIHdoZW4gdGhlIHNoYXBlIChhbmQgcG9pbnQpIGFyZSB0cmFuc2Zvcm1lZCB3aXRoIHRoZSBnaXZlbiB0cmFuc2Zvcm0sIHdvdWxkXHJcbiAgICogYmUgYSBwb2ludCB3aXRoIHRoZSBtaW5pbWFsIHkgdmFsdWUuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogV2lsbCBvbmx5IHJldHVybiBvbmUgcG9pbnQsIGV2ZW4gaWYgdGhlcmUgYXJlIG11bHRpcGxlIHBvaW50cyB0aGF0IGhhdmUgdGhlIHNhbWUgbWluaW1hbCB5IHZhbHVlcyBmb3IgdGhlXHJcbiAgICogYm91bmRhcnkuIFRoZSBwb2ludCBtYXkgYmUgYXQgdGhlIGVuZCBvZiBvbmUgb2YgdGhlIGVkZ2VzL3NlZ21lbnRzIChhdCBhIHZlcnRleCksIGJ1dCBhbHNvIG1heSBzb21ld2hlcmUgaW4gdGhlXHJcbiAgICogbWlkZGxlIG9mIGFuIGVkZ2Uvc2VnbWVudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VHJhbnNmb3JtM30gdHJhbnNmb3JtIC0gVHJhbnNmb3JtIHVzZWQgYmVjYXVzZSB3ZSB3YW50IHRoZSBpbnZlcnNlIGFsc28uXHJcbiAgICogQHJldHVybnMge1ZlY3RvcjJ9XHJcbiAgICovXHJcbiAgY29tcHV0ZUV4dHJlbWVQb2ludCggdHJhbnNmb3JtICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYWxmRWRnZXMubGVuZ3RoID4gMCwgJ1RoZXJlIGlzIG5vIGV4dHJlbWUgcG9pbnQgaWYgd2UgaGF2ZSBubyBlZGdlcycgKTtcclxuXHJcbiAgICAvLyBUcmFuc2Zvcm0gYWxsIG9mIHRoZSBzZWdtZW50cyBpbnRvIHRoZSBuZXcgdHJhbnNmb3JtZWQgY29vcmRpbmF0ZSBzcGFjZS5cclxuICAgIGNvbnN0IHRyYW5zZm9ybWVkU2VnbWVudHMgPSBbXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuaGFsZkVkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0cmFuc2Zvcm1lZFNlZ21lbnRzLnB1c2goIHRoaXMuaGFsZkVkZ2VzWyBpIF0uZWRnZS5zZWdtZW50LnRyYW5zZm9ybWVkKCB0cmFuc2Zvcm0uZ2V0TWF0cml4KCkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgdGhlIGJvdW5kcyBvZiB0aGUgZW50aXJlIHRyYW5zZm9ybWVkIGJvdW5kYXJ5XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1lZEJvdW5kcyA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0cmFuc2Zvcm1lZFNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0cmFuc2Zvcm1lZEJvdW5kcy5pbmNsdWRlQm91bmRzKCB0cmFuc2Zvcm1lZFNlZ21lbnRzWyBpIF0uZ2V0Qm91bmRzKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0cmFuc2Zvcm1lZFNlZ21lbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBzZWdtZW50ID0gdHJhbnNmb3JtZWRTZWdtZW50c1sgaSBdO1xyXG5cclxuICAgICAgLy8gU2VlIGlmIHRoaXMgaXMgb25lIG9mIG91ciBwb3RlbnRpYWwgc2VnbWVudHMgd2hvc2UgYm91bmRzIGhhdmUgdGhlIG1pbmltYWwgeSB2YWx1ZS4gVGhpcyBpbmRpY2F0ZXMgYXQgbGVhc3RcclxuICAgICAgLy8gb25lIHBvaW50IG9uIHRoaXMgc2VnbWVudCB3aWxsIGJlIGEgbWluaW1hbC15IHBvaW50LlxyXG4gICAgICBpZiAoIHNlZ21lbnQuZ2V0Qm91bmRzKCkudG9wID09PSB0cmFuc2Zvcm1lZEJvdW5kcy50b3AgKSB7XHJcbiAgICAgICAgLy8gUGljayBhIHBvaW50IHdpdGggdmFsdWVzIHRoYXQgZ3VhcmFudGVlcyBhbnkgcG9pbnQgd2lsbCBoYXZlIGEgc21hbGxlciB5IHZhbHVlLlxyXG4gICAgICAgIGxldCBtaW5pbWFsUG9pbnQgPSBuZXcgVmVjdG9yMiggMCwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZICk7XHJcblxyXG4gICAgICAgIC8vIEdyYWIgcGFyYW1ldHJpYyB0LXZhbHVlcyBmb3Igd2hlcmUgb3VyIHNlZ21lbnQgaGFzIGV4dHJlbWUgcG9pbnRzLCBhbmQgYWRkcyB0aGUgZW5kIHBvaW50cyAod2hpY2ggYXJlXHJcbiAgICAgICAgLy8gY2FuZGlkYXRlcykuIE9uZSBvZiB0aGUgcG9pbnRzIGF0IHRoZXNlIHZhbHVlcyBzaG91bGQgYmUgb3VyIG1pbmltYWwgcG9pbnQuXHJcbiAgICAgICAgY29uc3QgdFZhbHVlcyA9IFsgMCwgMSBdLmNvbmNhdCggc2VnbWVudC5nZXRJbnRlcmlvckV4dHJlbWFUcygpICk7XHJcbiAgICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgdFZhbHVlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgIGNvbnN0IHBvaW50ID0gc2VnbWVudC5wb3NpdGlvbkF0KCB0VmFsdWVzWyBqIF0gKTtcclxuICAgICAgICAgIGlmICggcG9pbnQueSA8IG1pbmltYWxQb2ludC55ICkge1xyXG4gICAgICAgICAgICBtaW5pbWFsUG9pbnQgPSBwb2ludDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGlzIG1pbmltYWwgcG9pbnQgYmFjayBpbnRvIG91ciAobm9uLXRyYW5zZm9ybWVkKSBib3VuZGFyeSdzIGNvb3JkaW5hdGUgc3BhY2UuXHJcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybS5pbnZlcnNlUG9zaXRpb24yKCBtaW5pbWFsUG9pbnQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvciggJ1Nob3VsZCBub3QgcmVhY2ggaGVyZSBpZiB3ZSBoYXZlIHNlZ21lbnRzJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJheSAocG9zaXRpb24gYW5kIGRpcmVjdGlvbikgcG9pbnRpbmcgYXdheSBmcm9tIG91ciBib3VuZGFyeSBhdCBhbiBcImV4dHJlbWVcIiBwb2ludCwgc28gdGhhdCB0aGUgcmF5XHJcbiAgICogd2lsbCBiZSBndWFyYW50ZWVkIG5vdCB0byBpbnRlcnNlY3QgdGhpcyBib3VuZGFyeS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBUaGUgcmF5J3MgcG9zaXRpb24gd2lsbCBiZSBzbGlnaHRseSBvZmZzZXQgZnJvbSB0aGUgYm91bmRhcnksIHNvIHRoYXQgaXQgd2lsbCBub3QgdGVjaG5pY2FsbHkgaW50ZXJzZWN0IHRoZVxyXG4gICAqIGJvdW5kYXJ5IHdoZXJlIHRoZSBleHRyZW1lIHBvaW50IGxpZXMuIFRoZSBleHRyZW1lIHBvaW50IHdpbGwgYmUgY2hvc2VuIHN1Y2ggdGhhdCBpdCB3b3VsZCBoYXZlIHRoZSBzbWFsbGVzdFxyXG4gICAqIHkgdmFsdWUgd2hlbiB0aGUgYm91bmRhcnkgaXMgdHJhbnNmb3JtZWQgYnkgdGhlIGdpdmVuIHRyYW5zZm9ybWF0aW9uLlxyXG4gICAqXHJcbiAgICogVGhlIHJheSdzIGRpcmVjdGlvbiB3aWxsIGJlIHN1Y2ggdGhhdCBpZiB0aGUgcmF5IGlzIHRyYW5zZm9ybWVkIGJ5IHRoZSBnaXZlbiB0cmFuc2Zvcm0sIGl0IHdpbGwgYmUgcG9pbnRpbmdcclxuICAgKiBpbiB0aGUgbmVnYXRpdmUteSBkaXJlY3Rpb24gKGUuZy4gYSB2ZWN0b3Igb2YgKDAsLTEpKS4gVGhpcyBzaG91bGQgZ3VhcmFudGVlIGl0IGlzIGZhY2luZyBhd2F5IGZyb20gdGhlXHJcbiAgICogYm91bmRhcnksIGFuZCB3aWxsIGJlIGNvbnNpc3RlbnQgaW4gZGlyZWN0aW9uIHdpdGggb3RoZXIgZXh0cmVtZSByYXlzIChuZWVkZWQgZm9yIGl0cyB1c2UgY2FzZSB3aXRoIHRoZVxyXG4gICAqIGJvdW5kYXJ5IGdyYXBoKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VHJhbnNmb3JtM30gdHJhbnNmb3JtXHJcbiAgICogQHJldHVybnMge1JheTJ9XHJcbiAgICovXHJcbiAgY29tcHV0ZUV4dHJlbWVSYXkoIHRyYW5zZm9ybSApIHtcclxuICAgIGNvbnN0IGV4dHJlbWVQb2ludCA9IHRoaXMuY29tcHV0ZUV4dHJlbWVQb2ludCggdHJhbnNmb3JtICk7XHJcbiAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRyYW5zZm9ybS5pbnZlcnNlRGVsdGEyKCBuZXcgVmVjdG9yMiggMCwgLTEgKSApLm5vcm1hbGl6ZWQoKTtcclxuICAgIHJldHVybiBuZXcgUmF5MiggZXh0cmVtZVBvaW50LnBsdXMoIG9yaWVudGF0aW9uLnRpbWVzU2NhbGFyKCAxZS00ICkgKSwgb3JpZW50YXRpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIGJvdW5kYXJ5IGluY2x1ZGVzIHRoZSBzcGVjaWZpZWQgaGFsZi1lZGdlLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SGFsZkVkZ2V9IGhhbGZFZGdlXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgaGFzSGFsZkVkZ2UoIGhhbGZFZGdlICkge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5oYWxmRWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggdGhpcy5oYWxmRWRnZXNbIGkgXSA9PT0gaGFsZkVkZ2UgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIHRoaXMgYm91bmRhcnkgdG8gYSBTdWJwYXRoLCBzbyB0aGF0IHdlIGNhbiBjb25zdHJ1Y3QgdGhpbmdzIGxpa2UgU2hhcGUgb2JqZWN0cyBmcm9tIGl0LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtTdWJwYXRofVxyXG4gICAqL1xyXG4gIHRvU3VicGF0aCgpIHtcclxuICAgIGNvbnN0IHNlZ21lbnRzID0gW107XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmhhbGZFZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgc2VnbWVudHMucHVzaCggdGhpcy5oYWxmRWRnZXNbIGkgXS5nZXREaXJlY3Rpb25hbFNlZ21lbnQoKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBTdWJwYXRoKCBzZWdtZW50cywgbnVsbCwgdHJ1ZSApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpY1xyXG4gIGZyZWVUb1Bvb2woKSB7XHJcbiAgICBCb3VuZGFyeS5wb29sLmZyZWVUb1Bvb2woIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWNcclxuICBzdGF0aWMgcG9vbCA9IG5ldyBQb29sKCBCb3VuZGFyeSApO1xyXG59XHJcblxyXG5raXRlLnJlZ2lzdGVyKCAnQm91bmRhcnknLCBCb3VuZGFyeSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQm91bmRhcnk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxJQUFJLE1BQU0seUJBQXlCO0FBQzFDLE9BQU9DLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsVUFBVSxNQUFNLHFDQUFxQztBQUM1RCxPQUFPQyxJQUFJLE1BQU0sK0JBQStCO0FBQ2hELFNBQVNDLElBQUksRUFBRUMsT0FBTyxRQUFRLGVBQWU7QUFFN0MsSUFBSUMsT0FBTyxHQUFHLENBQUM7QUFFZixNQUFNQyxRQUFRLENBQUM7RUFDYjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxXQUFXQSxDQUFFQyxTQUFTLEVBQUc7SUFDdkI7SUFDQSxJQUFJLENBQUNDLEVBQUUsR0FBRyxFQUFFSixPQUFPOztJQUVuQjtJQUNBO0lBQ0EsSUFBSSxDQUFDSyxVQUFVLENBQUVGLFNBQVUsQ0FBQztFQUM5Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VFLFVBQVVBLENBQUVGLFNBQVMsRUFBRztJQUN0QjtJQUNBLElBQUksQ0FBQ0EsU0FBUyxHQUFHQSxTQUFTOztJQUUxQjtJQUNBLElBQUksQ0FBQ0csVUFBVSxHQUFHLElBQUksQ0FBQ0MsaUJBQWlCLENBQUMsQ0FBQzs7SUFFMUM7SUFDQSxJQUFJLENBQUNDLE1BQU0sR0FBRyxJQUFJLENBQUNDLGFBQWEsQ0FBQyxDQUFDOztJQUVsQztJQUNBLElBQUksQ0FBQ0MsZUFBZSxHQUFHZCxVQUFVLENBQUUsSUFBSSxDQUFDYyxlQUFnQixDQUFDO0lBRXpELE9BQU8sSUFBSTtFQUNiOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxTQUFTQSxDQUFBLEVBQUc7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