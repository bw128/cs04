// Copyright 2016-2024, University of Colorado Boulder

/**
 * Query parameters for the scenery-phet demo application.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import sceneryPhet from './sceneryPhet.js';
const sceneryPhetQueryParameters = QueryStringMachine.getAll({
  // background color of the screens
  backgroundColor: {
    type: 'string',
    // CSS color format, e.g. 'green', 'ff8c00', 'rgb(255,0,255)'
    defaultValue: 'white'
  },
  // Should be a CSS font-family compatible string, see https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
  fontFamily: {
    type: 'string',
    defaultValue: 'Arial'
  }
});
sceneryPhet.register('sceneryPhetQueryParameters', sceneryPhetQueryParameters);
export default sceneryPhetQueryParameters;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5UGhldCIsInNjZW5lcnlQaGV0UXVlcnlQYXJhbWV0ZXJzIiwiUXVlcnlTdHJpbmdNYWNoaW5lIiwiZ2V0QWxsIiwiYmFja2dyb3VuZENvbG9yIiwidHlwZSIsImRlZmF1bHRWYWx1ZSIsImZvbnRGYW1pbHkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbInNjZW5lcnlQaGV0UXVlcnlQYXJhbWV0ZXJzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFF1ZXJ5IHBhcmFtZXRlcnMgZm9yIHRoZSBzY2VuZXJ5LXBoZXQgZGVtbyBhcHBsaWNhdGlvbi5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcblxyXG5jb25zdCBzY2VuZXJ5UGhldFF1ZXJ5UGFyYW1ldGVycyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRBbGwoIHtcclxuXHJcbiAgLy8gYmFja2dyb3VuZCBjb2xvciBvZiB0aGUgc2NyZWVuc1xyXG4gIGJhY2tncm91bmRDb2xvcjoge1xyXG4gICAgdHlwZTogJ3N0cmluZycsIC8vIENTUyBjb2xvciBmb3JtYXQsIGUuZy4gJ2dyZWVuJywgJ2ZmOGMwMCcsICdyZ2IoMjU1LDAsMjU1KSdcclxuICAgIGRlZmF1bHRWYWx1ZTogJ3doaXRlJ1xyXG4gIH0sXHJcblxyXG4gIC8vIFNob3VsZCBiZSBhIENTUyBmb250LWZhbWlseSBjb21wYXRpYmxlIHN0cmluZywgc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9mb250LWZhbWlseVxyXG4gIGZvbnRGYW1pbHk6IHtcclxuICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgZGVmYXVsdFZhbHVlOiAnQXJpYWwnXHJcbiAgfVxyXG59ICk7XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ3NjZW5lcnlQaGV0UXVlcnlQYXJhbWV0ZXJzJywgc2NlbmVyeVBoZXRRdWVyeVBhcmFtZXRlcnMgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNjZW5lcnlQaGV0UXVlcnlQYXJhbWV0ZXJzOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sa0JBQWtCO0FBRTFDLE1BQU1DLDBCQUEwQixHQUFHQyxrQkFBa0IsQ0FBQ0MsTUFBTSxDQUFFO0VBRTVEO0VBQ0FDLGVBQWUsRUFBRTtJQUNmQyxJQUFJLEVBQUUsUUFBUTtJQUFFO0lBQ2hCQyxZQUFZLEVBQUU7RUFDaEIsQ0FBQztFQUVEO0VBQ0FDLFVBQVUsRUFBRTtJQUNWRixJQUFJLEVBQUUsUUFBUTtJQUNkQyxZQUFZLEVBQUU7RUFDaEI7QUFDRixDQUFFLENBQUM7QUFFSE4sV0FBVyxDQUFDUSxRQUFRLENBQUUsNEJBQTRCLEVBQUVQLDBCQUEyQixDQUFDO0FBRWhGLGVBQWVBLDBCQUEwQiIsImlnbm9yZUxpc3QiOltdfQ==