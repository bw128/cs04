// Copyright 2019-2024, University of Colorado Boulder

/**
 * ContinuousPropertySoundClip is a sound generator that alters the playback rate of a sound clip based on the
 * value of a continuous numerical Property.  It is specifically designed to work with sound clips and does not support
 * other types of sound production, such as oscillators.  It is implemented such that the sound fades in when changes
 * occur in the Property's value and fades out when the value doesn't change for some (configurable) amount of time.
 * This was generalized from GRAVITY_FORCE_LAB_BASICS/ForceSoundGenerator, see
 * https://github.com/phetsims/tambo/issues/76.
 *
 * NOTE: This SoundClip is inherently tied to a Properties changes instead of user input. This can lead to undesirable
 * situations where this can play based on internal model changes and not from user interaction (the best example of this
 * is during reset). Please make sure to use `enableControlProperties` to silence sound during these cases (like model reset!)
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import tambo from '../tambo.js';
import SoundClip from './SoundClip.js';
import optionize from '../../../phet-core/js/optionize.js';
import Range from '../../../dot/js/Range.js';
import isSettingPhetioStateProperty from '../../../tandem/js/isSettingPhetioStateProperty.js';
import soundConstants from '../soundConstants.js';
import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import ResetAllButton from '../../../scenery-phet/js/buttons/ResetAllButton.js';
import stepTimer from '../../../axon/js/stepTimer.js';
class ContinuousPropertySoundClip extends SoundClip {
  // duration of inactivity fade out

  // see docs in options type declaration

  // the output level before fade out starts

  // countdown time used for fade out

  /**
   * @param property
   * @param range - the range of values that the provided property can take on
   * @param sound - returned by the import directive, should be optimized for good continuous looping, which
   *   may require it to be a .wav file, since .mp3 files generally have a bit of silence at the beginning.
   * @param [providedOptions]
   */
  constructor(property, range, sound, providedOptions) {
    assert && assert(!providedOptions || !providedOptions.loop, 'loop option should be supplied by ContinuousPropertySoundClip');
    const options = optionize()({
      initialOutputLevel: 0.7,
      loop: true,
      trimSilence: true,
      fadeStartDelay: 0.2,
      fadeTime: 0.15,
      delayBeforeStop: 0.1,
      playbackRateRange: new Range(0.5, 2),
      // 2 octaves, one below and one above the provided sound's inherent pitch
      normalizationMappingExponent: 1,
      // linear mapping by default
      stopOnDisabled: false,
      stepEmitter: stepTimer,
      // By default, sound production is disabled during "reset all" operations.
      enableControlProperties: [DerivedProperty.not(ResetAllButton.isResettingAllProperty)]
    }, providedOptions);
    super(sound, options);
    this.fadeTime = options.fadeTime;
    this.delayBeforeStop = options.delayBeforeStop;
    this.nonFadedOutputLevel = options.initialOutputLevel === undefined ? 1 : options.initialOutputLevel;
    this.remainingFadeTime = 0;

    // start with the output level at zero so that the initial sound generation has a bit of fade in
    this.setOutputLevel(0, 0);

    // function for starting the sound or adjusting the volume
    const listener = value => {
      // Update the sound generation when the value changes, but only if we enabled. This prevents the play() from
      // occurring at all.
      if (this.fullyEnabled) {
        // Calculate the playback rate.  This is done by first normalizing the value over the provided range, then
        // mapping that value using an exponential function that can be used to create a non-linear mapping to emphasize
        // certain portions of the range.
        const normalizedValue = range.getNormalizedValue(value);
        const mappedNormalizedValueNew = Math.pow(normalizedValue, options.normalizationMappingExponent);
        const playbackRate = options.playbackRateRange.expandNormalizedValue(mappedNormalizedValueNew);

        // Update the parameters of the sound clip based on the new value.
        this.setPlaybackRate(playbackRate);
        this.setOutputLevel(this.nonFadedOutputLevel);
        if (!this.isPlaying && !isSettingPhetioStateProperty.value) {
          this.play();
        }

        // reset the fade countdown
        this.remainingFadeTime = options.fadeStartDelay + options.fadeTime + this.delayBeforeStop;
      }
    };
    property.lazyLink(listener);
    this.disposeEmitter.addListener(() => property.unlink(listener));
    if (options.stopOnDisabled) {
      this.fullyEnabledProperty.lazyLink(enabled => {
        !enabled && this.stop(soundConstants.DEFAULT_LINEAR_GAIN_CHANGE_TIME);
      });
    }

    // Hook up the time-driven behavior.
    if (options.stepEmitter) {
      const stepEmitterListener = dt => this.step(dt);
      options.stepEmitter.addListener(stepEmitterListener);

      // Remove step emitter listener on disposal.
      this.disposeEmitter.addListener(() => options.stepEmitter?.removeListener(stepEmitterListener));
    }
  }

  /**
   * Step this sound generator, used for fading out the sound in the absence of change.
   * @param dt - change in time (i.e. delta time) in seconds
   */
  step(dt) {
    if (this.remainingFadeTime > 0) {
      this.remainingFadeTime = Math.max(this.remainingFadeTime - dt, 0);
      if (this.remainingFadeTime < this.fadeTime + this.delayBeforeStop && this.outputLevel > 0) {
        // the sound is fading out, adjust the output level
        const outputLevel = Math.max((this.remainingFadeTime - this.delayBeforeStop) / this.fadeTime, 0);
        this.setOutputLevel(outputLevel * this.nonFadedOutputLevel);
      }

      // fade out complete, stop playback
      if (this.remainingFadeTime === 0 && this.isPlaying) {
        this.stop(0);
      }
    }
  }

  /**
   * stop any in-progress sound generation
   */
  reset() {
    this.stop(0);
    this.remainingFadeTime = 0;
  }
}
tambo.register('ContinuousPropertySoundClip', ContinuousPropertySoundClip);
export default ContinuousPropertySoundClip;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0YW1ibyIsIlNvdW5kQ2xpcCIsIm9wdGlvbml6ZSIsIlJhbmdlIiwiaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSIsInNvdW5kQ29uc3RhbnRzIiwiRGVyaXZlZFByb3BlcnR5IiwiUmVzZXRBbGxCdXR0b24iLCJzdGVwVGltZXIiLCJDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXAiLCJjb25zdHJ1Y3RvciIsInByb3BlcnR5IiwicmFuZ2UiLCJzb3VuZCIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImxvb3AiLCJvcHRpb25zIiwiaW5pdGlhbE91dHB1dExldmVsIiwidHJpbVNpbGVuY2UiLCJmYWRlU3RhcnREZWxheSIsImZhZGVUaW1lIiwiZGVsYXlCZWZvcmVTdG9wIiwicGxheWJhY2tSYXRlUmFuZ2UiLCJub3JtYWxpemF0aW9uTWFwcGluZ0V4cG9uZW50Iiwic3RvcE9uRGlzYWJsZWQiLCJzdGVwRW1pdHRlciIsImVuYWJsZUNvbnRyb2xQcm9wZXJ0aWVzIiwibm90IiwiaXNSZXNldHRpbmdBbGxQcm9wZXJ0eSIsIm5vbkZhZGVkT3V0cHV0TGV2ZWwiLCJ1bmRlZmluZWQiLCJyZW1haW5pbmdGYWRlVGltZSIsInNldE91dHB1dExldmVsIiwibGlzdGVuZXIiLCJ2YWx1ZSIsImZ1bGx5RW5hYmxlZCIsIm5vcm1hbGl6ZWRWYWx1ZSIsImdldE5vcm1hbGl6ZWRWYWx1ZSIsIm1hcHBlZE5vcm1hbGl6ZWRWYWx1ZU5ldyIsIk1hdGgiLCJwb3ciLCJwbGF5YmFja1JhdGUiLCJleHBhbmROb3JtYWxpemVkVmFsdWUiLCJzZXRQbGF5YmFja1JhdGUiLCJpc1BsYXlpbmciLCJwbGF5IiwibGF6eUxpbmsiLCJkaXNwb3NlRW1pdHRlciIsImFkZExpc3RlbmVyIiwidW5saW5rIiwiZnVsbHlFbmFibGVkUHJvcGVydHkiLCJlbmFibGVkIiwic3RvcCIsIkRFRkFVTFRfTElORUFSX0dBSU5fQ0hBTkdFX1RJTUUiLCJzdGVwRW1pdHRlckxpc3RlbmVyIiwiZHQiLCJzdGVwIiwicmVtb3ZlTGlzdGVuZXIiLCJtYXgiLCJvdXRwdXRMZXZlbCIsInJlc2V0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29udGludW91c1Byb3BlcnR5U291bmRDbGlwIGlzIGEgc291bmQgZ2VuZXJhdG9yIHRoYXQgYWx0ZXJzIHRoZSBwbGF5YmFjayByYXRlIG9mIGEgc291bmQgY2xpcCBiYXNlZCBvbiB0aGVcclxuICogdmFsdWUgb2YgYSBjb250aW51b3VzIG51bWVyaWNhbCBQcm9wZXJ0eS4gIEl0IGlzIHNwZWNpZmljYWxseSBkZXNpZ25lZCB0byB3b3JrIHdpdGggc291bmQgY2xpcHMgYW5kIGRvZXMgbm90IHN1cHBvcnRcclxuICogb3RoZXIgdHlwZXMgb2Ygc291bmQgcHJvZHVjdGlvbiwgc3VjaCBhcyBvc2NpbGxhdG9ycy4gIEl0IGlzIGltcGxlbWVudGVkIHN1Y2ggdGhhdCB0aGUgc291bmQgZmFkZXMgaW4gd2hlbiBjaGFuZ2VzXHJcbiAqIG9jY3VyIGluIHRoZSBQcm9wZXJ0eSdzIHZhbHVlIGFuZCBmYWRlcyBvdXQgd2hlbiB0aGUgdmFsdWUgZG9lc24ndCBjaGFuZ2UgZm9yIHNvbWUgKGNvbmZpZ3VyYWJsZSkgYW1vdW50IG9mIHRpbWUuXHJcbiAqIFRoaXMgd2FzIGdlbmVyYWxpemVkIGZyb20gR1JBVklUWV9GT1JDRV9MQUJfQkFTSUNTL0ZvcmNlU291bmRHZW5lcmF0b3IsIHNlZVxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFtYm8vaXNzdWVzLzc2LlxyXG4gKlxyXG4gKiBOT1RFOiBUaGlzIFNvdW5kQ2xpcCBpcyBpbmhlcmVudGx5IHRpZWQgdG8gYSBQcm9wZXJ0aWVzIGNoYW5nZXMgaW5zdGVhZCBvZiB1c2VyIGlucHV0LiBUaGlzIGNhbiBsZWFkIHRvIHVuZGVzaXJhYmxlXHJcbiAqIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjYW4gcGxheSBiYXNlZCBvbiBpbnRlcm5hbCBtb2RlbCBjaGFuZ2VzIGFuZCBub3QgZnJvbSB1c2VyIGludGVyYWN0aW9uICh0aGUgYmVzdCBleGFtcGxlIG9mIHRoaXNcclxuICogaXMgZHVyaW5nIHJlc2V0KS4gUGxlYXNlIG1ha2Ugc3VyZSB0byB1c2UgYGVuYWJsZUNvbnRyb2xQcm9wZXJ0aWVzYCB0byBzaWxlbmNlIHNvdW5kIGR1cmluZyB0aGVzZSBjYXNlcyAobGlrZSBtb2RlbCByZXNldCEpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY28gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHRhbWJvIGZyb20gJy4uL3RhbWJvLmpzJztcclxuaW1wb3J0IFNvdW5kQ2xpcCwgeyBTb3VuZENsaXBPcHRpb25zIH0gZnJvbSAnLi9Tb3VuZENsaXAuanMnO1xyXG5pbXBvcnQgV3JhcHBlZEF1ZGlvQnVmZmVyIGZyb20gJy4uL1dyYXBwZWRBdWRpb0J1ZmZlci5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9pc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LmpzJztcclxuaW1wb3J0IHNvdW5kQ29uc3RhbnRzIGZyb20gJy4uL3NvdW5kQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IERlcml2ZWRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0Rlcml2ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBSZXNldEFsbEJ1dHRvbiBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvYnV0dG9ucy9SZXNldEFsbEJ1dHRvbi5qcyc7XHJcbmltcG9ydCB7IFRSZWFkT25seUVtaXR0ZXIgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyB0aW1lIHRvIHdhaXQgYmVmb3JlIHN0YXJ0aW5nIGZhZGUgb3V0IGlmIG5vIGFjdGl2aXR5LCBpbiBzZWNvbmRzXHJcbiAgZmFkZVN0YXJ0RGVsYXk/OiBudW1iZXI7XHJcblxyXG4gIC8vIGR1cmF0aW9uIG9mIGZhZGUgb3V0LCBpbiBzZWNvbmRzXHJcbiAgZmFkZVRpbWU/OiBudW1iZXI7XHJcblxyXG4gIC8vIGFtb3VudCBvZiB0aW1lIGluIHNlY29uZHMgZnJvbSBmdWxsIGZhZGUgdG8gc3RvcCBvZiBzb3VuZCwgZG9uZSB0byBhdm9pZCBzb25pYyBnbGl0Y2hlc1xyXG4gIGRlbGF5QmVmb3JlU3RvcD86IG51bWJlcjtcclxuXHJcbiAgLy8gVGhpcyBvcHRpb24gZGVmaW5lcyB0aGUgcmFuZ2Ugb2YgcGxheWJhY2sgcmF0ZXMgdXNlZCB3aGVuIG1hcHBpbmcgdGhlIHByb3ZpZGVkIFByb3BlcnR5IHZhbHVlIHRvIGEgcGl0Y2guICBBIHZhbHVlXHJcbiAgLy8gb2YgMSBpbmRpY2F0ZXMgdGhlIG5vbWluYWwgcGxheWJhY2sgcmF0ZSwgMC41IGlzIGhhbGYgc3BlZWQgKGFuIG9jdGF2ZSBsb3dlciksIDIgaXMgZG91YmxlIHNwZWVkIChhbiBvY3RhdmVcclxuICAvLyBoaWdoZXIpLiAgU28sIGEgcmFuZ2Ugb2YgMSB0byAyIHdvdWxkIGdvIGZyb20gdGhlIG5vbWluYWwgcGxheWJhY2sgcmF0ZSBvZiB0aGUgc291bmQgdG8gb25lIG9jdGF2ZSBoaWdoZXIuICBWYWx1ZXNcclxuICAvLyBvZiAwIG9yIGxlc3MgYXJlIGludmFsaWQuXHJcbiAgcGxheWJhY2tSYXRlUmFuZ2U/OiBSYW5nZTtcclxuXHJcbiAgLy8gVGhlIGV4cG9uZW50IHVzZWQgd2hlbiBtYXBwaW5nIGEgbm9ybWFsaXplZCB2YWx1ZSB0byBhIHBsYXliYWNrIHJhdGUuICBTZWUgY29kZSBmb3IgZXhhY3RseSBob3cgdGhpcyBpcyB1c2VkLCBidXRcclxuICAvLyB0aGUgYmFzaWMgaWRlYSBpcyB0aGF0IGEgdmFsdWUgb2YgMSAodGhlIGRlZmF1bHQpIHNob3VsZCBiZSB1c2VkIGZvciBhIGxpbmVhciBtYXBwaW5nIGFjcm9zcyB0aGUgcmFuZ2UsIGEgdmFsdWVcclxuICAvLyBhYm92ZSAxIGZvciBzbWFsbGVyIGNoYW5nZXMgYXQgdGhlIGxvd2VyIHBvcnRpb24gb2YgdGhlIHJhbmdlIGFuZCBncmVhdGVyIGNoYW5nZXMgdG93YXJkcyB0aGUgdG9wLCBhbmQgYSB2YWx1ZVxyXG4gIC8vIGJlbG93IDEgZm9yIGdyZWF0ZXIgY2hhbmdlcyBpbiB0aGUgbG93ZXIgcG9ydGlvbiBvZiB0aGUgcmFuZ2UgYW5kIHNtYWxsZXIgY2hhbmdlcyB0b3dhcmRzIHRoZSB0b3AuXHJcbiAgbm9ybWFsaXphdGlvbk1hcHBpbmdFeHBvbmVudD86IG51bWJlcjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgd2Ugd2lsbCBzdG9wKCkgd2hlbiB0aGUgc291bmQgaXMgZGlzYWJsZWQuIFRoZSBzdG9wIHVzZXMgdGhlIERFRkFVTFRfTElORUFSX0dBSU5fQ0hBTkdFX1RJTUUgYXMgaXRzIGRlbGF5XHJcbiAgLy8gdG8gbWF0Y2ggdGhlIGZ1bGx5RW5hYmxlZFByb3BlcnR5IGxpbmsgbG9naWMgaW4gU291bmRHZW5lcmF0b3IuXHJcbiAgc3RvcE9uRGlzYWJsZWQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBBbiBlbWl0dGVyIHRoYXQgY2FuIGJlIHByb3ZpZGVkIHRvIHN0ZXAgdGhlIHRpbWUtZHJpdmVuIGJlaGF2aW9yIG9mIHRoaXMgc291bmQgZ2VuZXJhdG9yLiAgQnkgZGVmYXVsdCwgdGhpcyB1c2VzXHJcbiAgLy8gdGhlIGdsb2JhbGx5IGF2YWlsYWJsZSBzdGVwVGltZXIgaW5zdGFuY2UuICBJZiBzZXQgdG8gbnVsbCwgbm90aGluZyB3aWxsIGJlIGhvb2tlZCB1cCwgYW5kIGl0IHdpbGwgYmUgdXAgdG8gdGhlXHJcbiAgLy8gY2xpZW50IHRvIHN0ZXAgdGhlIGluc3RhbmNlIGRpcmVjdGx5LlxyXG4gIHN0ZXBFbWl0dGVyPzogVFJlYWRPbmx5RW1pdHRlcjxbIG51bWJlciBdPiB8IG51bGw7XHJcbn07XHJcbmV4cG9ydCB0eXBlIENvbnRpbnVvdXNQcm9wZXJ0eVNvdW5kQ2xpcE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFNvdW5kQ2xpcE9wdGlvbnM7XHJcblxyXG5jbGFzcyBDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXAgZXh0ZW5kcyBTb3VuZENsaXAge1xyXG5cclxuICAvLyBkdXJhdGlvbiBvZiBpbmFjdGl2aXR5IGZhZGUgb3V0XHJcbiAgcHJpdmF0ZSByZWFkb25seSBmYWRlVGltZTogbnVtYmVyO1xyXG5cclxuICAvLyBzZWUgZG9jcyBpbiBvcHRpb25zIHR5cGUgZGVjbGFyYXRpb25cclxuICBwcml2YXRlIHJlYWRvbmx5IGRlbGF5QmVmb3JlU3RvcDogbnVtYmVyO1xyXG5cclxuICAvLyB0aGUgb3V0cHV0IGxldmVsIGJlZm9yZSBmYWRlIG91dCBzdGFydHNcclxuICBwcml2YXRlIHJlYWRvbmx5IG5vbkZhZGVkT3V0cHV0TGV2ZWw6IG51bWJlcjtcclxuXHJcbiAgLy8gY291bnRkb3duIHRpbWUgdXNlZCBmb3IgZmFkZSBvdXRcclxuICBwcml2YXRlIHJlbWFpbmluZ0ZhZGVUaW1lOiBudW1iZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSByYW5nZSAtIHRoZSByYW5nZSBvZiB2YWx1ZXMgdGhhdCB0aGUgcHJvdmlkZWQgcHJvcGVydHkgY2FuIHRha2Ugb25cclxuICAgKiBAcGFyYW0gc291bmQgLSByZXR1cm5lZCBieSB0aGUgaW1wb3J0IGRpcmVjdGl2ZSwgc2hvdWxkIGJlIG9wdGltaXplZCBmb3IgZ29vZCBjb250aW51b3VzIGxvb3BpbmcsIHdoaWNoXHJcbiAgICogICBtYXkgcmVxdWlyZSBpdCB0byBiZSBhIC53YXYgZmlsZSwgc2luY2UgLm1wMyBmaWxlcyBnZW5lcmFsbHkgaGF2ZSBhIGJpdCBvZiBzaWxlbmNlIGF0IHRoZSBiZWdpbm5pbmcuXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPixcclxuICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiBSYW5nZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHNvdW5kOiBXcmFwcGVkQXVkaW9CdWZmZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXBPcHRpb25zICkge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoXHJcbiAgICAgICFwcm92aWRlZE9wdGlvbnMgfHwgIXByb3ZpZGVkT3B0aW9ucy5sb29wLFxyXG4gICAgICAnbG9vcCBvcHRpb24gc2hvdWxkIGJlIHN1cHBsaWVkIGJ5IENvbnRpbnVvdXNQcm9wZXJ0eVNvdW5kQ2xpcCdcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXBPcHRpb25zLCBTZWxmT3B0aW9ucywgU291bmRDbGlwT3B0aW9ucz4oKSgge1xyXG4gICAgICBpbml0aWFsT3V0cHV0TGV2ZWw6IDAuNyxcclxuICAgICAgbG9vcDogdHJ1ZSxcclxuICAgICAgdHJpbVNpbGVuY2U6IHRydWUsXHJcbiAgICAgIGZhZGVTdGFydERlbGF5OiAwLjIsXHJcbiAgICAgIGZhZGVUaW1lOiAwLjE1LFxyXG4gICAgICBkZWxheUJlZm9yZVN0b3A6IDAuMSxcclxuICAgICAgcGxheWJhY2tSYXRlUmFuZ2U6IG5ldyBSYW5nZSggMC41LCAyICksIC8vIDIgb2N0YXZlcywgb25lIGJlbG93IGFuZCBvbmUgYWJvdmUgdGhlIHByb3ZpZGVkIHNvdW5kJ3MgaW5oZXJlbnQgcGl0Y2hcclxuICAgICAgbm9ybWFsaXphdGlvbk1hcHBpbmdFeHBvbmVudDogMSwgLy8gbGluZWFyIG1hcHBpbmcgYnkgZGVmYXVsdFxyXG4gICAgICBzdG9wT25EaXNhYmxlZDogZmFsc2UsXHJcbiAgICAgIHN0ZXBFbWl0dGVyOiBzdGVwVGltZXIsXHJcblxyXG4gICAgICAvLyBCeSBkZWZhdWx0LCBzb3VuZCBwcm9kdWN0aW9uIGlzIGRpc2FibGVkIGR1cmluZyBcInJlc2V0IGFsbFwiIG9wZXJhdGlvbnMuXHJcbiAgICAgIGVuYWJsZUNvbnRyb2xQcm9wZXJ0aWVzOiBbIERlcml2ZWRQcm9wZXJ0eS5ub3QoIFJlc2V0QWxsQnV0dG9uLmlzUmVzZXR0aW5nQWxsUHJvcGVydHkgKSBdXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggc291bmQsIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmZhZGVUaW1lID0gb3B0aW9ucy5mYWRlVGltZTtcclxuICAgIHRoaXMuZGVsYXlCZWZvcmVTdG9wID0gb3B0aW9ucy5kZWxheUJlZm9yZVN0b3A7XHJcbiAgICB0aGlzLm5vbkZhZGVkT3V0cHV0TGV2ZWwgPSBvcHRpb25zLmluaXRpYWxPdXRwdXRMZXZlbCA9PT0gdW5kZWZpbmVkID8gMSA6IG9wdGlvbnMuaW5pdGlhbE91dHB1dExldmVsO1xyXG4gICAgdGhpcy5yZW1haW5pbmdGYWRlVGltZSA9IDA7XHJcblxyXG4gICAgLy8gc3RhcnQgd2l0aCB0aGUgb3V0cHV0IGxldmVsIGF0IHplcm8gc28gdGhhdCB0aGUgaW5pdGlhbCBzb3VuZCBnZW5lcmF0aW9uIGhhcyBhIGJpdCBvZiBmYWRlIGluXHJcbiAgICB0aGlzLnNldE91dHB1dExldmVsKCAwLCAwICk7XHJcblxyXG4gICAgLy8gZnVuY3Rpb24gZm9yIHN0YXJ0aW5nIHRoZSBzb3VuZCBvciBhZGp1c3RpbmcgdGhlIHZvbHVtZVxyXG4gICAgY29uc3QgbGlzdGVuZXIgPSAoIHZhbHVlOiBudW1iZXIgKSA9PiB7XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGdlbmVyYXRpb24gd2hlbiB0aGUgdmFsdWUgY2hhbmdlcywgYnV0IG9ubHkgaWYgd2UgZW5hYmxlZC4gVGhpcyBwcmV2ZW50cyB0aGUgcGxheSgpIGZyb21cclxuICAgICAgLy8gb2NjdXJyaW5nIGF0IGFsbC5cclxuICAgICAgaWYgKCB0aGlzLmZ1bGx5RW5hYmxlZCApIHtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBwbGF5YmFjayByYXRlLiAgVGhpcyBpcyBkb25lIGJ5IGZpcnN0IG5vcm1hbGl6aW5nIHRoZSB2YWx1ZSBvdmVyIHRoZSBwcm92aWRlZCByYW5nZSwgdGhlblxyXG4gICAgICAgIC8vIG1hcHBpbmcgdGhhdCB2YWx1ZSB1c2luZyBhbiBleHBvbmVudGlhbCBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZSBhIG5vbi1saW5lYXIgbWFwcGluZyB0byBlbXBoYXNpemVcclxuICAgICAgICAvLyBjZXJ0YWluIHBvcnRpb25zIG9mIHRoZSByYW5nZS5cclxuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsdWUgPSByYW5nZS5nZXROb3JtYWxpemVkVmFsdWUoIHZhbHVlICk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTm9ybWFsaXplZFZhbHVlTmV3ID0gTWF0aC5wb3coIG5vcm1hbGl6ZWRWYWx1ZSwgb3B0aW9ucy5ub3JtYWxpemF0aW9uTWFwcGluZ0V4cG9uZW50ICk7XHJcbiAgICAgICAgY29uc3QgcGxheWJhY2tSYXRlID0gb3B0aW9ucy5wbGF5YmFja1JhdGVSYW5nZS5leHBhbmROb3JtYWxpemVkVmFsdWUoIG1hcHBlZE5vcm1hbGl6ZWRWYWx1ZU5ldyApO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIHNvdW5kIGNsaXAgYmFzZWQgb24gdGhlIG5ldyB2YWx1ZS5cclxuICAgICAgICB0aGlzLnNldFBsYXliYWNrUmF0ZSggcGxheWJhY2tSYXRlICk7XHJcbiAgICAgICAgdGhpcy5zZXRPdXRwdXRMZXZlbCggdGhpcy5ub25GYWRlZE91dHB1dExldmVsICk7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pc1BsYXlpbmcgJiYgIWlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgICB0aGlzLnBsYXkoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlc2V0IHRoZSBmYWRlIGNvdW50ZG93blxyXG4gICAgICAgIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgPSBvcHRpb25zLmZhZGVTdGFydERlbGF5ICsgb3B0aW9ucy5mYWRlVGltZSArIHRoaXMuZGVsYXlCZWZvcmVTdG9wO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgcHJvcGVydHkubGF6eUxpbmsoIGxpc3RlbmVyICk7XHJcbiAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiBwcm9wZXJ0eS51bmxpbmsoIGxpc3RlbmVyICkgKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuc3RvcE9uRGlzYWJsZWQgKSB7XHJcbiAgICAgIHRoaXMuZnVsbHlFbmFibGVkUHJvcGVydHkubGF6eUxpbmsoIGVuYWJsZWQgPT4ge1xyXG4gICAgICAgICFlbmFibGVkICYmIHRoaXMuc3RvcCggc291bmRDb25zdGFudHMuREVGQVVMVF9MSU5FQVJfR0FJTl9DSEFOR0VfVElNRSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSG9vayB1cCB0aGUgdGltZS1kcml2ZW4gYmVoYXZpb3IuXHJcbiAgICBpZiAoIG9wdGlvbnMuc3RlcEVtaXR0ZXIgKSB7XHJcbiAgICAgIGNvbnN0IHN0ZXBFbWl0dGVyTGlzdGVuZXIgPSAoIGR0OiBudW1iZXIgKSA9PiB0aGlzLnN0ZXAoIGR0ICk7XHJcbiAgICAgIG9wdGlvbnMuc3RlcEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHN0ZXBFbWl0dGVyTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBzdGVwIGVtaXR0ZXIgbGlzdGVuZXIgb24gZGlzcG9zYWwuXHJcbiAgICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IG9wdGlvbnMuc3RlcEVtaXR0ZXI/LnJlbW92ZUxpc3RlbmVyKCBzdGVwRW1pdHRlckxpc3RlbmVyICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0ZXAgdGhpcyBzb3VuZCBnZW5lcmF0b3IsIHVzZWQgZm9yIGZhZGluZyBvdXQgdGhlIHNvdW5kIGluIHRoZSBhYnNlbmNlIG9mIGNoYW5nZS5cclxuICAgKiBAcGFyYW0gZHQgLSBjaGFuZ2UgaW4gdGltZSAoaS5lLiBkZWx0YSB0aW1lKSBpbiBzZWNvbmRzXHJcbiAgICovXHJcbiAgcHVibGljIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgPiAwICkge1xyXG4gICAgICB0aGlzLnJlbWFpbmluZ0ZhZGVUaW1lID0gTWF0aC5tYXgoIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgLSBkdCwgMCApO1xyXG5cclxuICAgICAgaWYgKCAoIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgPCB0aGlzLmZhZGVUaW1lICsgdGhpcy5kZWxheUJlZm9yZVN0b3AgKSAmJiB0aGlzLm91dHB1dExldmVsID4gMCApIHtcclxuXHJcbiAgICAgICAgLy8gdGhlIHNvdW5kIGlzIGZhZGluZyBvdXQsIGFkanVzdCB0aGUgb3V0cHV0IGxldmVsXHJcbiAgICAgICAgY29uc3Qgb3V0cHV0TGV2ZWwgPSBNYXRoLm1heCggKCB0aGlzLnJlbWFpbmluZ0ZhZGVUaW1lIC0gdGhpcy5kZWxheUJlZm9yZVN0b3AgKSAvIHRoaXMuZmFkZVRpbWUsIDAgKTtcclxuICAgICAgICB0aGlzLnNldE91dHB1dExldmVsKCBvdXRwdXRMZXZlbCAqIHRoaXMubm9uRmFkZWRPdXRwdXRMZXZlbCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBmYWRlIG91dCBjb21wbGV0ZSwgc3RvcCBwbGF5YmFja1xyXG4gICAgICBpZiAoIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgPT09IDAgJiYgdGhpcy5pc1BsYXlpbmcgKSB7XHJcbiAgICAgICAgdGhpcy5zdG9wKCAwICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHN0b3AgYW55IGluLXByb2dyZXNzIHNvdW5kIGdlbmVyYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnN0b3AoIDAgKTtcclxuICAgIHRoaXMucmVtYWluaW5nRmFkZVRpbWUgPSAwO1xyXG4gIH1cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXAnLCBDb250aW51b3VzUHJvcGVydHlTb3VuZENsaXAgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvbnRpbnVvdXNQcm9wZXJ0eVNvdW5kQ2xpcDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sYUFBYTtBQUMvQixPQUFPQyxTQUFTLE1BQTRCLGdCQUFnQjtBQUU1RCxPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBQzFELE9B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