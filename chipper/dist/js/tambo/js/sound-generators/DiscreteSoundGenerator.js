// Copyright 2019-2022, University of Colorado Boulder

/**
 * DiscreteSoundGenerator produces sounds based on the value of a number property.  It monitors the property value and
 * maps it to one of a finite number of bins, and produces a discrete sound when the bin to which the value is mapped
 * changes.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import Range from '../../../dot/js/Range.js';
import optionize from '../../../phet-core/js/optionize.js';
import brightMarimba_mp3 from '../../sounds/brightMarimba_mp3.js';
import tambo from '../tambo.js';
import SoundClip from './SoundClip.js';
import BinMapper from '../BinMapper.js';
class DiscreteSoundGenerator extends SoundClip {
  /**
   * @param valueProperty - the value that is monitored to trigger sounds
   * @param valueRange - the range of values expected and over which sounds will be played
   * @param [providedOptions] - options for this sound generation and its parent class
   */
  constructor(valueProperty, valueRange, providedOptions) {
    const options = optionize()({
      sound: brightMarimba_mp3,
      initialOutputLevel: 1,
      numBins: 7,
      playbackRateRange: new Range(1, 1),
      // default is no change to the sound
      alwaysPlayOnChangesProperty: null,
      playSoundAtMin: true,
      playSoundAtMax: true,
      outOfRangeValuesOK: false
    }, providedOptions);

    // invoke superconstructor
    super(options.sound, options);

    // create the object that will place the continuous values into bins
    const binMapper = new BinMapper(valueRange, options.numBins, {
      tolerateOutOfRangeValues: options.outOfRangeValuesOK
    });

    // function for playing sound when the appropriate conditions are met
    const playSoundOnChanges = (newValue, oldValue) => {
      const newBin = binMapper.mapToBin(newValue);
      const oldBin = binMapper.mapToBin(oldValue);
      if (options.alwaysPlayOnChangesProperty && options.alwaysPlayOnChangesProperty.value || newValue === valueRange.min && options.playSoundAtMin || newValue === valueRange.max && options.playSoundAtMax || newBin !== oldBin) {
        const normalizedValue = (newValue - valueRange.min) / valueRange.getLength();
        const playbackRate = normalizedValue * (options.playbackRateRange.max - options.playbackRateRange.min) + options.playbackRateRange.min;
        this.setPlaybackRate(playbackRate);
        this.play();
      }
    };

    // monitor the value, playing sounds when appropriate
    valueProperty.lazyLink(playSoundOnChanges);

    // dispose function
    this.disposeDiscreteSoundGenerator = () => {
      valueProperty.unlink(playSoundOnChanges);
    };
  }

  /**
   */
  dispose() {
    this.disposeDiscreteSoundGenerator();
    super.dispose();
  }
}
tambo.register('DiscreteSoundGenerator', DiscreteSoundGenerator);
export default DiscreteSoundGenerator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSYW5nZSIsIm9wdGlvbml6ZSIsImJyaWdodE1hcmltYmFfbXAzIiwidGFtYm8iLCJTb3VuZENsaXAiLCJCaW5NYXBwZXIiLCJEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yIiwiY29uc3RydWN0b3IiLCJ2YWx1ZVByb3BlcnR5IiwidmFsdWVSYW5nZSIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJzb3VuZCIsImluaXRpYWxPdXRwdXRMZXZlbCIsIm51bUJpbnMiLCJwbGF5YmFja1JhdGVSYW5nZSIsImFsd2F5c1BsYXlPbkNoYW5nZXNQcm9wZXJ0eSIsInBsYXlTb3VuZEF0TWluIiwicGxheVNvdW5kQXRNYXgiLCJvdXRPZlJhbmdlVmFsdWVzT0siLCJiaW5NYXBwZXIiLCJ0b2xlcmF0ZU91dE9mUmFuZ2VWYWx1ZXMiLCJwbGF5U291bmRPbkNoYW5nZXMiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwibmV3QmluIiwibWFwVG9CaW4iLCJvbGRCaW4iLCJ2YWx1ZSIsIm1pbiIsIm1heCIsIm5vcm1hbGl6ZWRWYWx1ZSIsImdldExlbmd0aCIsInBsYXliYWNrUmF0ZSIsInNldFBsYXliYWNrUmF0ZSIsInBsYXkiLCJsYXp5TGluayIsImRpc3Bvc2VEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yIiwidW5saW5rIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRGlzY3JldGVTb3VuZEdlbmVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yIHByb2R1Y2VzIHNvdW5kcyBiYXNlZCBvbiB0aGUgdmFsdWUgb2YgYSBudW1iZXIgcHJvcGVydHkuICBJdCBtb25pdG9ycyB0aGUgcHJvcGVydHkgdmFsdWUgYW5kXHJcbiAqIG1hcHMgaXQgdG8gb25lIG9mIGEgZmluaXRlIG51bWJlciBvZiBiaW5zLCBhbmQgcHJvZHVjZXMgYSBkaXNjcmV0ZSBzb3VuZCB3aGVuIHRoZSBiaW4gdG8gd2hpY2ggdGhlIHZhbHVlIGlzIG1hcHBlZFxyXG4gKiBjaGFuZ2VzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgYnJpZ2h0TWFyaW1iYV9tcDMgZnJvbSAnLi4vLi4vc291bmRzL2JyaWdodE1hcmltYmFfbXAzLmpzJztcclxuaW1wb3J0IHRhbWJvIGZyb20gJy4uL3RhbWJvLmpzJztcclxuaW1wb3J0IFNvdW5kQ2xpcCwgeyBTb3VuZENsaXBPcHRpb25zIH0gZnJvbSAnLi9Tb3VuZENsaXAuanMnO1xyXG5pbXBvcnQgV3JhcHBlZEF1ZGlvQnVmZmVyIGZyb20gJy4uL1dyYXBwZWRBdWRpb0J1ZmZlci5qcyc7XHJcbmltcG9ydCBCaW5NYXBwZXIgZnJvbSAnLi4vQmluTWFwcGVyLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHRoZSBzb3VuZCB0aGF0IHdpbGwgYmUgcGxheWVkIGF0IHRoZSBkaXNjcmV0ZSB2YWx1ZXNcclxuICBzb3VuZD86IFdyYXBwZWRBdWRpb0J1ZmZlcjtcclxuXHJcbiAgLy8gbnVtYmVyIG9mIGRpc2NyZXRlIGJpbnMsIGNyb3NzaW5nIGJldHdlZW4gdGhlbSB3aWxsIHByb2R1Y2UgYSBzb3VuZFxyXG4gIG51bUJpbnM/OiA3O1xyXG5cclxuICAvLyB0aGUgcmFuZ2Ugb3ZlciB3aGljaCB0aGUgcGxheWJhY2sgcmF0ZSBpcyB2YXJpZWQsIDEgaXMgbm9ybWFsIHNwZWVkLCAyIGlzIGRvdWJsZSBzcGVlZCwgZXQgY2V0ZXJhXHJcbiAgcGxheWJhY2tSYXRlUmFuZ2U/OiBSYW5nZTtcclxuXHJcbiAgLy8gd2hlbiB0cnVlIHdpbGwgY2F1c2Ugc291bmQgdG8gYmUgcGxheWVkIG9uIGFueSBjaGFuZ2Ugb2YgdGhlIHZhbHVlIHByb3BlcnR5XHJcbiAgYWx3YXlzUGxheU9uQ2hhbmdlc1Byb3BlcnR5PzogbnVsbCB8IEJvb2xlYW5Qcm9wZXJ0eTtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgdGhlIHNvdW5kIHdpbGwgYmUgcGxheWVkIHdoZW4gdGhlIHZhbHVlIHJlYWNoZXMgdGhlIG1pbi5cclxuICBwbGF5U291bmRBdE1pbj86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIHRydWUsIHRoZSBzb3VuZCB3aWxsIGJlIHBsYXllZCB3aGVuIHRoZSB2YWx1ZSByZWFjaGVzIHRoZSBtYXguXHJcbiAgcGxheVNvdW5kQXRNYXg/OiBib29sZWFuO1xyXG5cclxuICAvLyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBvdXQgb2YgcmFuZ2UgdmFsdWVzIHNob3VsZCBiZSBpZ25vcmVkXHJcbiAgb3V0T2ZSYW5nZVZhbHVlc09LPzogYm9vbGVhbjtcclxufTtcclxuZXhwb3J0IHR5cGUgRGlzY3JldGVTb3VuZEdlbmVyYXRvck9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFNvdW5kQ2xpcE9wdGlvbnM7XHJcblxyXG5jbGFzcyBEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yIGV4dGVuZHMgU291bmRDbGlwIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3Bvc2VEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdmFsdWVQcm9wZXJ0eSAtIHRoZSB2YWx1ZSB0aGF0IGlzIG1vbml0b3JlZCB0byB0cmlnZ2VyIHNvdW5kc1xyXG4gICAqIEBwYXJhbSB2YWx1ZVJhbmdlIC0gdGhlIHJhbmdlIG9mIHZhbHVlcyBleHBlY3RlZCBhbmQgb3ZlciB3aGljaCBzb3VuZHMgd2lsbCBiZSBwbGF5ZWRcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBvcHRpb25zIGZvciB0aGlzIHNvdW5kIGdlbmVyYXRpb24gYW5kIGl0cyBwYXJlbnQgY2xhc3NcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHZhbHVlUHJvcGVydHk6IE51bWJlclByb3BlcnR5LCB2YWx1ZVJhbmdlOiBSYW5nZSwgcHJvdmlkZWRPcHRpb25zPzogRGlzY3JldGVTb3VuZEdlbmVyYXRvck9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yT3B0aW9ucywgU2VsZk9wdGlvbnMsIFNvdW5kQ2xpcE9wdGlvbnM+KCkoIHtcclxuICAgICAgc291bmQ6IGJyaWdodE1hcmltYmFfbXAzLFxyXG4gICAgICBpbml0aWFsT3V0cHV0TGV2ZWw6IDEsXHJcbiAgICAgIG51bUJpbnM6IDcsXHJcbiAgICAgIHBsYXliYWNrUmF0ZVJhbmdlOiBuZXcgUmFuZ2UoIDEsIDEgKSwgLy8gZGVmYXVsdCBpcyBubyBjaGFuZ2UgdG8gdGhlIHNvdW5kXHJcbiAgICAgIGFsd2F5c1BsYXlPbkNoYW5nZXNQcm9wZXJ0eTogbnVsbCxcclxuICAgICAgcGxheVNvdW5kQXRNaW46IHRydWUsXHJcbiAgICAgIHBsYXlTb3VuZEF0TWF4OiB0cnVlLFxyXG4gICAgICBvdXRPZlJhbmdlVmFsdWVzT0s6IGZhbHNlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBpbnZva2Ugc3VwZXJjb25zdHJ1Y3RvclxyXG4gICAgc3VwZXIoIG9wdGlvbnMuc291bmQsIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgdGhlIG9iamVjdCB0aGF0IHdpbGwgcGxhY2UgdGhlIGNvbnRpbnVvdXMgdmFsdWVzIGludG8gYmluc1xyXG4gICAgY29uc3QgYmluTWFwcGVyID0gbmV3IEJpbk1hcHBlciggdmFsdWVSYW5nZSwgb3B0aW9ucy5udW1CaW5zLCB7XHJcbiAgICAgIHRvbGVyYXRlT3V0T2ZSYW5nZVZhbHVlczogb3B0aW9ucy5vdXRPZlJhbmdlVmFsdWVzT0tcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBmdW5jdGlvbiBmb3IgcGxheWluZyBzb3VuZCB3aGVuIHRoZSBhcHByb3ByaWF0ZSBjb25kaXRpb25zIGFyZSBtZXRcclxuICAgIGNvbnN0IHBsYXlTb3VuZE9uQ2hhbmdlcyA9ICggbmV3VmFsdWU6IG51bWJlciwgb2xkVmFsdWU6IG51bWJlciApID0+IHtcclxuXHJcbiAgICAgIGNvbnN0IG5ld0JpbiA9IGJpbk1hcHBlci5tYXBUb0JpbiggbmV3VmFsdWUgKTtcclxuICAgICAgY29uc3Qgb2xkQmluID0gYmluTWFwcGVyLm1hcFRvQmluKCBvbGRWYWx1ZSApO1xyXG5cclxuICAgICAgaWYgKCBvcHRpb25zLmFsd2F5c1BsYXlPbkNoYW5nZXNQcm9wZXJ0eSAmJiBvcHRpb25zLmFsd2F5c1BsYXlPbkNoYW5nZXNQcm9wZXJ0eS52YWx1ZSB8fFxyXG4gICAgICAgICAgICggbmV3VmFsdWUgPT09IHZhbHVlUmFuZ2UubWluICYmIG9wdGlvbnMucGxheVNvdW5kQXRNaW4gKSB8fFxyXG4gICAgICAgICAgICggbmV3VmFsdWUgPT09IHZhbHVlUmFuZ2UubWF4ICYmIG9wdGlvbnMucGxheVNvdW5kQXRNYXggKSB8fFxyXG4gICAgICAgICAgIG5ld0JpbiAhPT0gb2xkQmluICkge1xyXG5cclxuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsdWUgPSAoIG5ld1ZhbHVlIC0gdmFsdWVSYW5nZS5taW4gKSAvIHZhbHVlUmFuZ2UuZ2V0TGVuZ3RoKCk7XHJcbiAgICAgICAgY29uc3QgcGxheWJhY2tSYXRlID0gbm9ybWFsaXplZFZhbHVlICogKCBvcHRpb25zLnBsYXliYWNrUmF0ZVJhbmdlLm1heCAtIG9wdGlvbnMucGxheWJhY2tSYXRlUmFuZ2UubWluICkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucGxheWJhY2tSYXRlUmFuZ2UubWluO1xyXG4gICAgICAgIHRoaXMuc2V0UGxheWJhY2tSYXRlKCBwbGF5YmFja1JhdGUgKTtcclxuICAgICAgICB0aGlzLnBsYXkoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBtb25pdG9yIHRoZSB2YWx1ZSwgcGxheWluZyBzb3VuZHMgd2hlbiBhcHByb3ByaWF0ZVxyXG4gICAgdmFsdWVQcm9wZXJ0eS5sYXp5TGluayggcGxheVNvdW5kT25DaGFuZ2VzICk7XHJcblxyXG4gICAgLy8gZGlzcG9zZSBmdW5jdGlvblxyXG4gICAgdGhpcy5kaXNwb3NlRGlzY3JldGVTb3VuZEdlbmVyYXRvciA9ICgpID0+IHsgdmFsdWVQcm9wZXJ0eS51bmxpbmsoIHBsYXlTb3VuZE9uQ2hhbmdlcyApOyB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdEaXNjcmV0ZVNvdW5kR2VuZXJhdG9yJywgRGlzY3JldGVTb3VuZEdlbmVyYXRvciApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRGlzY3JldGVTb3VuZEdlbmVyYXRvcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBLE9BQU9BLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsU0FBUyxNQUFNLG9DQUFvQztBQUMxRCxPQUFPQyxpQkFBaUIsTUFBTSxtQ0FB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