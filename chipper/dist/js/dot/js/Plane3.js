// Copyright 2014-2024, University of Colorado Boulder

/**
 * A mathematical plane in 3 dimensions determined by a normal vector to the plane and the distance to the closest
 * point on the plane to the origin
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Ray3 from './Ray3.js';
import Vector3 from './Vector3.js';
import dot from './dot.js';
export default class Plane3 {
  /**
   * @param normal - A normal vector (perpendicular) to the plane
   * @param distance - The signed distance to the plane from the origin, so that normal.times( distance )
   *                            will be a point on the plane.
   */
  constructor(normal, distance) {
    this.normal = normal;
    this.distance = distance;
    assert && assert(Math.abs(normal.magnitude - 1) < 0.01, 'the normal vector must be a unit vector');
  }
  intersectWithRay(ray) {
    return ray.pointAtDistance(ray.distanceToPlane(this));
  }

  /**
   * Returns a new plane that passes through three points $(\vec{a},\vec{b},\vec{c})$
   * The normal of the plane points along $\vec{c-a} \times \vec{b-a}$
   * Passing three collinear points will return null
   *
   * @param a - first point
   * @param b - second point
   * @param c - third point
   */
  static fromTriangle(a, b, c) {
    const normal = c.minus(a).cross(b.minus(a));
    if (normal.magnitude === 0) {
      return null;
    }
    normal.normalize();
    return new Plane3(normal, normal.dot(a));
  }
  getIntersection(plane) {
    // see https://en.wikipedia.org/wiki/Plane%E2%80%93plane_intersection

    const dot = this.normal.dot(plane.normal);
    const det = 1 - dot * dot;

    // parallel planes
    if (det === 0) {
      return null;
    }
    const c1 = (this.distance - plane.distance * dot) / det;
    const c2 = (plane.distance - this.distance * dot) / det;
    return new Ray3(this.normal.timesScalar(c1).plus(plane.normal.timesScalar(c2)), this.normal.cross(plane.normal).normalized());
  }
  static XY = new Plane3(new Vector3(0, 0, 1), 0);
  static XZ = new Plane3(new Vector3(0, 1, 0), 0);
  static YZ = new Plane3(new Vector3(1, 0, 0), 0);
}
dot.register('Plane3', Plane3);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSYXkzIiwiVmVjdG9yMyIsImRvdCIsIlBsYW5lMyIsImNvbnN0cnVjdG9yIiwibm9ybWFsIiwiZGlzdGFuY2UiLCJhc3NlcnQiLCJNYXRoIiwiYWJzIiwibWFnbml0dWRlIiwiaW50ZXJzZWN0V2l0aFJheSIsInJheSIsInBvaW50QXREaXN0YW5jZSIsImRpc3RhbmNlVG9QbGFuZSIsImZyb21UcmlhbmdsZSIsImEiLCJiIiwiYyIsIm1pbnVzIiwiY3Jvc3MiLCJub3JtYWxpemUiLCJnZXRJbnRlcnNlY3Rpb24iLCJwbGFuZSIsImRldCIsImMxIiwiYzIiLCJ0aW1lc1NjYWxhciIsInBsdXMiLCJub3JtYWxpemVkIiwiWFkiLCJYWiIsIllaIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQbGFuZTMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBtYXRoZW1hdGljYWwgcGxhbmUgaW4gMyBkaW1lbnNpb25zIGRldGVybWluZWQgYnkgYSBub3JtYWwgdmVjdG9yIHRvIHRoZSBwbGFuZSBhbmQgdGhlIGRpc3RhbmNlIHRvIHRoZSBjbG9zZXN0XHJcbiAqIHBvaW50IG9uIHRoZSBwbGFuZSB0byB0aGUgb3JpZ2luXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgUmF5MyBmcm9tICcuL1JheTMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMyBmcm9tICcuL1ZlY3RvcjMuanMnO1xyXG5pbXBvcnQgZG90IGZyb20gJy4vZG90LmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYW5lMyB7XHJcblxyXG4gIHB1YmxpYyBub3JtYWw6IFZlY3RvcjM7XHJcbiAgcHVibGljIGRpc3RhbmNlOiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBub3JtYWwgLSBBIG5vcm1hbCB2ZWN0b3IgKHBlcnBlbmRpY3VsYXIpIHRvIHRoZSBwbGFuZVxyXG4gICAqIEBwYXJhbSBkaXN0YW5jZSAtIFRoZSBzaWduZWQgZGlzdGFuY2UgdG8gdGhlIHBsYW5lIGZyb20gdGhlIG9yaWdpbiwgc28gdGhhdCBub3JtYWwudGltZXMoIGRpc3RhbmNlIClcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIGJlIGEgcG9pbnQgb24gdGhlIHBsYW5lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggbm9ybWFsOiBWZWN0b3IzLCBkaXN0YW5jZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5ub3JtYWwgPSBub3JtYWw7XHJcbiAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggTWF0aC5hYnMoIG5vcm1hbC5tYWduaXR1ZGUgLSAxICkgPCAwLjAxLCAndGhlIG5vcm1hbCB2ZWN0b3IgbXVzdCBiZSBhIHVuaXQgdmVjdG9yJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGludGVyc2VjdFdpdGhSYXkoIHJheTogUmF5MyApOiBWZWN0b3IzIHtcclxuICAgIHJldHVybiByYXkucG9pbnRBdERpc3RhbmNlKCByYXkuZGlzdGFuY2VUb1BsYW5lKCB0aGlzICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgcGxhbmUgdGhhdCBwYXNzZXMgdGhyb3VnaCB0aHJlZSBwb2ludHMgJChcXHZlY3thfSxcXHZlY3tifSxcXHZlY3tjfSkkXHJcbiAgICogVGhlIG5vcm1hbCBvZiB0aGUgcGxhbmUgcG9pbnRzIGFsb25nICRcXHZlY3tjLWF9IFxcdGltZXMgXFx2ZWN7Yi1hfSRcclxuICAgKiBQYXNzaW5nIHRocmVlIGNvbGxpbmVhciBwb2ludHMgd2lsbCByZXR1cm4gbnVsbFxyXG4gICAqXHJcbiAgICogQHBhcmFtIGEgLSBmaXJzdCBwb2ludFxyXG4gICAqIEBwYXJhbSBiIC0gc2Vjb25kIHBvaW50XHJcbiAgICogQHBhcmFtIGMgLSB0aGlyZCBwb2ludFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVRyaWFuZ2xlKCBhOiBWZWN0b3IzLCBiOiBWZWN0b3IzLCBjOiBWZWN0b3IzICk6IFBsYW5lMyB8IG51bGwge1xyXG4gICAgY29uc3Qgbm9ybWFsID0gKCBjLm1pbnVzKCBhICkgKS5jcm9zcyggYi5taW51cyggYSApICk7XHJcbiAgICBpZiAoIG5vcm1hbC5tYWduaXR1ZGUgPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgbm9ybWFsLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgUGxhbmUzKCBub3JtYWwsIG5vcm1hbC5kb3QoIGEgKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEludGVyc2VjdGlvbiggcGxhbmU6IFBsYW5lMyApOiBSYXkzIHwgbnVsbCB7XHJcbiAgICAvLyBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUGxhbmUlRTIlODAlOTNwbGFuZV9pbnRlcnNlY3Rpb25cclxuXHJcbiAgICBjb25zdCBkb3QgPSB0aGlzLm5vcm1hbC5kb3QoIHBsYW5lLm5vcm1hbCApO1xyXG4gICAgY29uc3QgZGV0ID0gMSAtIGRvdCAqIGRvdDtcclxuXHJcbiAgICAvLyBwYXJhbGxlbCBwbGFuZXNcclxuICAgIGlmICggZGV0ID09PSAwICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjMSA9ICggdGhpcy5kaXN0YW5jZSAtIHBsYW5lLmRpc3RhbmNlICogZG90ICkgLyBkZXQ7XHJcbiAgICBjb25zdCBjMiA9ICggcGxhbmUuZGlzdGFuY2UgLSB0aGlzLmRpc3RhbmNlICogZG90ICkgLyBkZXQ7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBSYXkzKFxyXG4gICAgICB0aGlzLm5vcm1hbC50aW1lc1NjYWxhciggYzEgKS5wbHVzKCBwbGFuZS5ub3JtYWwudGltZXNTY2FsYXIoIGMyICkgKSxcclxuICAgICAgdGhpcy5ub3JtYWwuY3Jvc3MoIHBsYW5lLm5vcm1hbCApLm5vcm1hbGl6ZWQoKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgWFkgPSBuZXcgUGxhbmUzKCBuZXcgVmVjdG9yMyggMCwgMCwgMSApLCAwICk7XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBYWiA9IG5ldyBQbGFuZTMoIG5ldyBWZWN0b3IzKCAwLCAxLCAwICksIDAgKTtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFlaID0gbmV3IFBsYW5lMyggbmV3IFZlY3RvcjMoIDEsIDAsIDAgKSwgMCApO1xyXG59XHJcblxyXG5kb3QucmVnaXN0ZXIoICdQbGFuZTMnLCBQbGFuZTMgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxJQUFJLE1BQU0sV0FBVztBQUM1QixPQUFPQyxPQUFPLE1BQU0sY0FBYztBQUNsQyxPQUFPQyxHQUFHLE1BQU0sVUFBVTtBQUUxQixlQUFlLE1BQU1DLE1BQU0sQ0FBQztFQUsxQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLFdBQVdBLENBQUVDLE1BQWUsRUFBRUMsUUFBZ0IsRUFBRztJQUN0RCxJQUFJLENBQUNELE1BQU0sR0FBR0EsTUFBTTtJQUNwQixJQUFJLENBQUNDLFFBQVEsR0FBR0EsUUFBUTtJQUV4QkMsTUFBTSxJQUFJQSxNQUFNLENBQUVDLElBQUksQ0FBQ0MsR0FBRyxDQUFFSixNQUFNLENBQUNLLFNBQVMsR0FBRyxDQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUseUNBQTBDLENBQUM7RUFDeEc7RUFFT0MsZ0JBQWdCQSxDQUFFQyxHQUFTLEVBQVk7SUFDNUMsT0FBT0EsR0FBRyxDQUFDQyxlQUFlLENBQUVELEdBQUcsQ0FBQ0UsZUFBZSxDQUFFLElBQUssQ0FBRSxDQUFDO0VBQzNEOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWNDLFlBQVlBLENBQUVDLENBQVUsRUFBRUMsQ0FBVSxFQUFFQyxDQUFVLEVBQWtCO0lBQzlFLE1BQU1iLE1BQU0sR0FBS2EsQ0FBQyxDQUFDQyxLQUFLLENBQUVILENBQUUsQ0FBQyxDQUFHSSxLQUFLLENBQUVILENBQUMsQ0FBQ0UsS0FBSyxDQUFFSCxDQUFFLENBQUUsQ0FBQztJQUNyRCxJQUFLWCxNQUFNLENBQUNLLFNBQVMsS0FBSyxDQUFDLEVBQUc7TUFDNUIsT0FBTyxJQUFJO0lBQ2I7SUFDQUwsTUFBTSxDQUFDZ0IsU0FBUyxDQUFDLENBQUM7SUFFbEIsT0FBTyxJQUFJbEIsTUFBTSxDQUFFRSxNQUFNLEVBQUVBLE1BQU0sQ0FBQ0gsR0FBRyxDQUFFYyxDQUFFLENBQUUsQ0FBQztFQUM5QztFQUVPTSxlQUFlQSxDQUFFQyxLQUFhLEVBQWdCO0lBQ25EOztJQUVBLE1BQU1yQixHQUFHLEdBQUcsSUFBSSxDQUFDRyxNQUFNLENBQUNILEdBQUcsQ0FBRXFCLEtBQUssQ0FBQ2xCLE1BQU8sQ0FBQztJQUMzQyxNQUFNbUIsR0FBRyxHQUFHLENBQUMsR0FBR3RCLEdBQUcsR0FBR0EsR0FBRzs7SUFFekI7SUFDQSxJQUFLc0IsR0FBRyxLQUFLLENBQUMsRUFBRztNQUNmLE9BQU8sSUFBSTtJQUNiO0lBRUEsTUFBTUMsRUFBRSxHQUFHLENBQUUsSUFBSSxDQUFDbkIsUUFBUSxHQUFHaUIsS0FBSyxDQUFDakIsUUFBUSxHQUFHSixHQUFHLElBQUtzQixHQUFHO0lBQ3pELE1BQU1FLEVBQUUsR0FBRyxDQUFFSCxLQUFLLENBQUNqQixRQUFRLEdBQUcsSUFBSSxDQUFDQSxRQUFRLEdBQUdKLEdBQUcsSUFBS3NCLEdBQUc7SUFFekQsT0FBTyxJQUFJeEIsSUFBSSxDQUNiLElBQUksQ0FBQ0ssTUFBTSxDQUFDc0IsV0FBVyxDQUFFRixFQUFHLENBQUMsQ0FBQ0csSUFBSSxDQUFFTCxLQUFLLENBQUNsQixNQUFNLENBQUNzQixXQUFXLENBQUVELEVBQUcsQ0FBRSxDQUFDLEVBQ3BFLElBQUksQ0FBQ3JCLE1BQU0sQ0FBQ2UsS0FBSyxDQUFFRyxLQUFLLENBQUNsQixNQUFPLENBQUMsQ0FBQ3dCLFVBQVUsQ0FBQyxDQUMvQyxDQUFDO0VBQ0g7RUFFQSxPQUF1QkMsRUFBRSxHQUFHLElBQUkzQixNQUFNLENBQUUsSUFBSUYsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ25FLE9BQXVCOEIsRUFBRSxHQUFHLElBQUk1QixNQUFNLENBQUUsSUFBSUYsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0VBQ25FLE9BQXVCK0IsRUFBRSxHQUFHLElBQUk3QixNQUFNLENBQUUsSUFBSUYsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQ3JFO0FBRUFDLEdBQUcsQ0FBQytCLFFBQVEsQ0FBRSxRQUFRLEVBQUU5QixNQUFPLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=