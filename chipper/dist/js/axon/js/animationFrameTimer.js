// Copyright 2020-2024, University of Colorado Boulder
// @author Sam Reid (PhET Interactive Simulations)

import axon from './axon.js';
import Timer from './Timer.js';

// Like stepTimer but runs every frame whether the sim is active or not.
const animationFrameTimer = new Timer();
axon.register('animationFrameTimer', animationFrameTimer);
export default animationFrameTimer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIiwiVGltZXIiLCJhbmltYXRpb25GcmFtZVRpbWVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJhbmltYXRpb25GcmFtZVRpbWVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG5cclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IFRpbWVyIGZyb20gJy4vVGltZXIuanMnO1xyXG5cclxuLy8gTGlrZSBzdGVwVGltZXIgYnV0IHJ1bnMgZXZlcnkgZnJhbWUgd2hldGhlciB0aGUgc2ltIGlzIGFjdGl2ZSBvciBub3QuXHJcbmNvbnN0IGFuaW1hdGlvbkZyYW1lVGltZXIgPSBuZXcgVGltZXIoKTtcclxuXHJcbmF4b24ucmVnaXN0ZXIoICdhbmltYXRpb25GcmFtZVRpbWVyJywgYW5pbWF0aW9uRnJhbWVUaW1lciApO1xyXG5leHBvcnQgZGVmYXVsdCBhbmltYXRpb25GcmFtZVRpbWVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFFQSxPQUFPQSxJQUFJLE1BQU0sV0FBVztBQUM1QixPQUFPQyxLQUFLLE1BQU0sWUFBWTs7QUFFOUI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRyxJQUFJRCxLQUFLLENBQUMsQ0FBQztBQUV2Q0QsSUFBSSxDQUFDRyxRQUFRLENBQUUscUJBQXFCLEVBQUVELG1CQUFvQixDQUFDO0FBQzNELGVBQWVBLG1CQUFtQiIsImlnbm9yZUxpc3QiOltdfQ==