// Copyright 2020-2023, University of Colorado Boulder

/**
 * A sound generator that is composed of multiple SoundClips that are all started and stopped at the same time.
 * Basically, this is a container to create and control multiple SoundClip instances as one.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tambo from '../tambo.js';
import SoundClip from './SoundClip.js';
import SoundGenerator from './SoundGenerator.js';
class CompositeSoundClip extends SoundGenerator {
  // array that will hold the individual sound clips

  constructor(soundsAndOptionsTuples, options) {
    super(options);
    this.soundClips = [];
    for (let i = 0; i < soundsAndOptionsTuples.length; i++) {
      const soundAndOptions = soundsAndOptionsTuples[i];
      const soundClip = new SoundClip(soundAndOptions.sound, soundAndOptions.options);
      soundClip.connect(this.soundSourceDestination);
      this.soundClips.push(soundClip);
    }
  }
  play() {
    this.soundClips.forEach(soundClip => soundClip.play());
  }
  stop() {
    this.soundClips.forEach(soundClip => soundClip.stop());
  }
  connect(destination) {
    this.soundClips.forEach(soundClip => soundClip.connect(destination));
  }
  dispose() {
    this.soundClips.forEach(soundClip => soundClip.dispose());
    super.dispose();
  }
  get isPlaying() {
    return _.some(this.soundClips, soundClip => soundClip.isPlaying);
  }
  setOutputLevel(outputLevel, timeConstant) {
    this.soundClips.forEach(soundClip => soundClip.setOutputLevel(outputLevel, timeConstant));
  }
}
tambo.register('CompositeSoundClip', CompositeSoundClip);
export default CompositeSoundClip;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0YW1ibyIsIlNvdW5kQ2xpcCIsIlNvdW5kR2VuZXJhdG9yIiwiQ29tcG9zaXRlU291bmRDbGlwIiwiY29uc3RydWN0b3IiLCJzb3VuZHNBbmRPcHRpb25zVHVwbGVzIiwib3B0aW9ucyIsInNvdW5kQ2xpcHMiLCJpIiwibGVuZ3RoIiwic291bmRBbmRPcHRpb25zIiwic291bmRDbGlwIiwic291bmQiLCJjb25uZWN0Iiwic291bmRTb3VyY2VEZXN0aW5hdGlvbiIsInB1c2giLCJwbGF5IiwiZm9yRWFjaCIsInN0b3AiLCJkZXN0aW5hdGlvbiIsImRpc3Bvc2UiLCJpc1BsYXlpbmciLCJfIiwic29tZSIsInNldE91dHB1dExldmVsIiwib3V0cHV0TGV2ZWwiLCJ0aW1lQ29uc3RhbnQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbXBvc2l0ZVNvdW5kQ2xpcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHNvdW5kIGdlbmVyYXRvciB0aGF0IGlzIGNvbXBvc2VkIG9mIG11bHRpcGxlIFNvdW5kQ2xpcHMgdGhhdCBhcmUgYWxsIHN0YXJ0ZWQgYW5kIHN0b3BwZWQgYXQgdGhlIHNhbWUgdGltZS5cclxuICogQmFzaWNhbGx5LCB0aGlzIGlzIGEgY29udGFpbmVyIHRvIGNyZWF0ZSBhbmQgY29udHJvbCBtdWx0aXBsZSBTb3VuZENsaXAgaW5zdGFuY2VzIGFzIG9uZS5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCB0YW1ibyBmcm9tICcuLi90YW1iby5qcyc7XHJcbmltcG9ydCBTb3VuZENsaXAsIHsgU291bmRDbGlwT3B0aW9ucyB9IGZyb20gJy4vU291bmRDbGlwLmpzJztcclxuaW1wb3J0IFNvdW5kR2VuZXJhdG9yLCB7IFNvdW5kR2VuZXJhdG9yT3B0aW9ucyB9IGZyb20gJy4vU291bmRHZW5lcmF0b3IuanMnO1xyXG5pbXBvcnQgV3JhcHBlZEF1ZGlvQnVmZmVyIGZyb20gJy4uL1dyYXBwZWRBdWRpb0J1ZmZlci5qcyc7XHJcbmltcG9ydCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIFNvdW5kQW5kT3B0aW9ucyA9IHtcclxuICBzb3VuZDogV3JhcHBlZEF1ZGlvQnVmZmVyO1xyXG4gIG9wdGlvbnM/OiBTb3VuZENsaXBPcHRpb25zO1xyXG59O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcbmV4cG9ydCB0eXBlIENvbXBvc2l0ZVNvdW5kQ2xpcE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFNvdW5kR2VuZXJhdG9yT3B0aW9ucztcclxuXHJcbmNsYXNzIENvbXBvc2l0ZVNvdW5kQ2xpcCBleHRlbmRzIFNvdW5kR2VuZXJhdG9yIHtcclxuXHJcbiAgLy8gYXJyYXkgdGhhdCB3aWxsIGhvbGQgdGhlIGluZGl2aWR1YWwgc291bmQgY2xpcHNcclxuICBwcml2YXRlIHJlYWRvbmx5IHNvdW5kQ2xpcHM6IFNvdW5kQ2xpcFtdO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHNvdW5kc0FuZE9wdGlvbnNUdXBsZXM6IFNvdW5kQW5kT3B0aW9uc1tdLCBvcHRpb25zPzogQ29tcG9zaXRlU291bmRDbGlwT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5zb3VuZENsaXBzID0gW107XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc291bmRzQW5kT3B0aW9uc1R1cGxlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgc291bmRBbmRPcHRpb25zID0gc291bmRzQW5kT3B0aW9uc1R1cGxlc1sgaSBdO1xyXG4gICAgICBjb25zdCBzb3VuZENsaXAgPSBuZXcgU291bmRDbGlwKCBzb3VuZEFuZE9wdGlvbnMuc291bmQsIHNvdW5kQW5kT3B0aW9ucy5vcHRpb25zICk7XHJcbiAgICAgIHNvdW5kQ2xpcC5jb25uZWN0KCB0aGlzLnNvdW5kU291cmNlRGVzdGluYXRpb24gKTtcclxuICAgICAgdGhpcy5zb3VuZENsaXBzLnB1c2goIHNvdW5kQ2xpcCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHBsYXkoKTogdm9pZCB7XHJcbiAgICB0aGlzLnNvdW5kQ2xpcHMuZm9yRWFjaCggc291bmRDbGlwID0+IHNvdW5kQ2xpcC5wbGF5KCkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xyXG4gICAgdGhpcy5zb3VuZENsaXBzLmZvckVhY2goIHNvdW5kQ2xpcCA9PiBzb3VuZENsaXAuc3RvcCgpICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgY29ubmVjdCggZGVzdGluYXRpb246IEF1ZGlvUGFyYW0gfCBBdWRpb05vZGUgKTogdm9pZCB7XHJcbiAgICB0aGlzLnNvdW5kQ2xpcHMuZm9yRWFjaCggc291bmRDbGlwID0+IHNvdW5kQ2xpcC5jb25uZWN0KCBkZXN0aW5hdGlvbiApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuc291bmRDbGlwcy5mb3JFYWNoKCBzb3VuZENsaXAgPT4gc291bmRDbGlwLmRpc3Bvc2UoKSApO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpc1BsYXlpbmcoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gXy5zb21lKCB0aGlzLnNvdW5kQ2xpcHMsIHNvdW5kQ2xpcCA9PiBzb3VuZENsaXAuaXNQbGF5aW5nICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0T3V0cHV0TGV2ZWwoIG91dHB1dExldmVsOiBudW1iZXIsIHRpbWVDb25zdGFudDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5zb3VuZENsaXBzLmZvckVhY2goIHNvdW5kQ2xpcCA9PiBzb3VuZENsaXAuc2V0T3V0cHV0TGV2ZWwoIG91dHB1dExldmVsLCB0aW1lQ29uc3RhbnQgKSApO1xyXG4gIH1cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdDb21wb3NpdGVTb3VuZENsaXAnLCBDb21wb3NpdGVTb3VuZENsaXAgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvbXBvc2l0ZVNvdW5kQ2xpcDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sYUFBYTtBQUMvQixPQUFPQyxTQUFTLE1BQTRCLGdCQUFnQjtBQUM1RCxPQUFPQyxjQUFjLE1BQWlDLHFCQUFxQjtBQVkzRSxNQUFNQyxrQkFBa0IsU0FBU0QsY0FBYyxDQUFDO0VBRTlDOztFQUdPRSxXQUFXQSxDQUFFQyxzQkFBeUMsRUFBRUMsT0FBbUMsRUFBRztJQUNuRyxLQUFLLENBQUVBLE9BQVEsQ0FBQztJQUVoQixJQUFJLENBQUNDLFVBQVUsR0FBRyxFQUFFO0lBRXBCLEtBQU0sSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSCxzQkFBc0IsQ0FBQ0ksTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztNQUN4RCxNQUFNRSxlQUFlLEdBQUdMLHNCQUFzQixDQUFFRyxDQUFDLENBQUU7TUFDbkQsTUFBTUcsU0FBUyxHQUFHLElBQUlWLFNBQVMsQ0FBRVMsZUFBZSxDQUFDRSxLQUFLLEVBQUVGLGVBQWUsQ0FBQ0osT0FBUSxDQUFDO01BQ2pGSyxTQUFTLENBQUNFLE9BQU8sQ0FBRSxJQUFJLENBQUNDLHNCQUF1QixDQUFDO01BQ2hELElBQUksQ0FBQ1AsVUFBVSxDQUFDUSxJQUFJLENBQUVKLFNBQVUsQ0FBQztJQUNuQztFQUNGO0VBRU9LLElBQUlBLENBQUEsRUFBUztJQUNsQixJQUFJLENBQUNULFVBQVUsQ0FBQ1UsT0FBTyxDQUFFTixTQUFTLElBQUlBLFNBQVMsQ0FBQ0ssSUFBSSxDQUFDLENBQUUsQ0FBQztFQUMxRDtFQUVPRSxJQUFJQSxDQUFBLEVBQVM7SUFDbEIsSUFBSSxDQUFDWCxVQUFVLENBQUNVLE9BQU8sQ0FBRU4sU0FBUyxJQUFJQSxTQUFTLENBQUNPLElBQUksQ0FBQyxDQUFFLENBQUM7RUFDMUQ7RUFFZ0JMLE9BQU9BLENBQUVNLFdBQW1DLEVBQVM7SUFDbkUsSUFBSSxDQUFDWixVQUFVLENBQUNVLE9BQU8sQ0FBRU4sU0FBUyxJQUFJQSxTQUFTLENBQUNFLE9BQU8sQ0FBRU0sV0FBWSxDQUFFLENBQUM7RUFDMUU7RUFFZ0JDLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNiLFVBQVUsQ0FBQ1UsT0FBTyxDQUFFTixTQUFTLElBQUlBLFNBQVMsQ0FBQ1MsT0FBTyxDQUFDLENBQUUsQ0FBQztJQUMzRCxLQUFLLENBQUNBLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCO0VBRUEsSUFBV0MsU0FBU0EsQ0FBQSxFQUFZO0lBQzlCLE9BQU9DLENBQUMsQ0FBQ0MsSUFBSSxDQUFFLElBQUksQ0FBQ2hCLFVBQVUsRUFBRUksU0FBUyxJQUFJQSxTQUFTLENBQUNVLFNBQVUsQ0FBQztFQUNwRTtFQUVnQkcsY0FBY0EsQ0FBRUMsV0FBbUIsRUFBRUMsWUFBb0IsRUFBUztJQUNoRixJQUFJLENBQUNuQixVQUFVLENBQUNVLE9BQU8sQ0FBRU4sU0FBUyxJQUFJQSxTQUFTLENBQUNhLGNBQWMsQ0FBRUMsV0FBVyxFQUFFQyxZQUFhLENBQUUsQ0FBQztFQUMvRjtBQUNGO0FBRUExQixLQUFLLENBQUMyQixRQUFRLENBQUUsb0JBQW9CLEVBQUV4QixrQkFBbUIsQ0FBQztBQUUxRCxlQUFlQSxrQkFBa0IiLCJpZ25vcmVMaXN0IjpbXX0=