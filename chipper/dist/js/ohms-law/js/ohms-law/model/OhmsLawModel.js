// Copyright 2013-2024, University of Colorado Boulder

/**
 * Primary model for the Ohm's Law simulation, see doc/model.md for more information.
 * @author Vasily Shakhov (Mlearner)
 * @author Anton Ulyanov (Mlearner)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import EnumerationDeprecatedProperty from '../../../../axon/js/EnumerationDeprecatedProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import ohmsLaw from '../../ohmsLaw.js';
import OhmsLawConstants from '../OhmsLawConstants.js';
import CurrentUnit from './CurrentUnit.js';
class OhmsLawModel {
  /**
   */
  constructor(tandem) {
    // @public {Property.<number>} in volts
    this.voltageProperty = new NumberProperty(OhmsLawConstants.VOLTAGE_RANGE.getDefaultValue(), {
      tandem: tandem.createTandem('voltageProperty'),
      units: 'V',
      range: OhmsLawConstants.VOLTAGE_RANGE,
      phetioDocumentation: 'The voltage in the circuit'
    });

    // @public {Property.<number>} in Ohms
    this.resistanceProperty = new NumberProperty(OhmsLawConstants.RESISTANCE_RANGE.getDefaultValue(), {
      tandem: tandem.createTandem('resistanceProperty'),
      units: '\u2126',
      // ohms
      range: OhmsLawConstants.RESISTANCE_RANGE,
      phetioDocumentation: 'The resistance in the circuit'
    });

    // @public {Property.<number>} create a derived property that tracks the current in milli amps
    this.currentProperty = new DerivedProperty([this.voltageProperty, this.resistanceProperty], computeCurrent, {
      tandem: tandem.createTandem('currentProperty'),
      units: 'mA',
      phetioValueType: NumberIO,
      phetioDocumentation: 'The current flowing in the circuit'
    });

    // @public
    this.currentUnitsProperty = new EnumerationDeprecatedProperty(CurrentUnit, CurrentUnit.MILLIAMPS, {
      tandem: tandem.createTandem('currentUnitsProperty'),
      phetioDocumentation: 'Determines the displayed unit for the current'
    });
  }

  /**
   * resets the properties of the model
   * @public
   */
  reset() {
    this.voltageProperty.reset();
    this.resistanceProperty.reset();
  }

  /**
   * Get the normalized voltage over the range of allowed voltages in this sim.
   * @public
   * @returns {number}
   */
  getNormalizedVoltage() {
    const range = OhmsLawConstants.VOLTAGE_RANGE;
    return (this.voltageProperty.get() - range.min) / range.getLength();
  }

  /**
   * Get the normalized current, based on the allowable values for current in this sim.
   * @public
   * @returns {number}
   */
  getNormalizedCurrent() {
    const range = OhmsLawModel.getCurrentRange();
    return (this.currentProperty.get() - range.min) / range.getLength();
  }

  /**
   * Get the normalized resistance, based on the allowable values for resistance in this
   * sim.
   * @public
   * @returns {number}
   */
  getNormalizedResistance() {
    const range = OhmsLawConstants.RESISTANCE_RANGE;
    return (this.resistanceProperty.get() - range.min) / range.getLength();
  }

  /**
   * Get the current as a number formatted based on the appropriate decimal places for the display unit.
   * @public
   * @returns {string}
   */
  getFixedCurrent() {
    let current = this.currentProperty.value;
    const units = this.currentUnitsProperty.value;
    if (units === CurrentUnit.AMPS) {
      current = current / 100;
    }
    return Utils.toFixed(current, CurrentUnit.getSigFigs(units));
  }

  /**
   * Get the maximum current that can be computed by the model
   * @returns {number} - the max current.
   * @public
   */
  static getMaxCurrent() {
    return computeCurrent(OhmsLawConstants.VOLTAGE_RANGE.max, OhmsLawConstants.RESISTANCE_RANGE.min);
  }

  /**
   * Get the minimum current that can be computed by the model.
   * @returns {number} [description]
   * @private
   */
  static getMinCurrent() {
    return computeCurrent(OhmsLawConstants.VOLTAGE_RANGE.min, OhmsLawConstants.RESISTANCE_RANGE.max);
  }

  /**
   * Get the Range of the current, will construct a new range if not yet set
   * @returns {Range}
   * @public
   */
  static getCurrentRange() {
    if (!this.currentRange) {
      // @private, use the getter
      this.currentRange = new Range(OhmsLawModel.getMinCurrent(), OhmsLawModel.getMaxCurrent());
    }
    return this.currentRange;
  }
}

/**
 * The main model function, used to compute the current of the model
 * @param voltage
 * @param resistance
 * @returns {number} - current in milliamps
 */
function computeCurrent(voltage, resistance) {
  return 1000 * voltage / resistance;
}
ohmsLaw.register('OhmsLawModel', OhmsLawModel);
export default OhmsLawModel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJFbnVtZXJhdGlvbkRlcHJlY2F0ZWRQcm9wZXJ0eSIsIk51bWJlclByb3BlcnR5IiwiUmFuZ2UiLCJVdGlscyIsIk51bWJlcklPIiwib2htc0xhdyIsIk9obXNMYXdDb25zdGFudHMiLCJDdXJyZW50VW5pdCIsIk9obXNMYXdNb2RlbCIsImNvbnN0cnVjdG9yIiwidGFuZGVtIiwidm9sdGFnZVByb3BlcnR5IiwiVk9MVEFHRV9SQU5HRSIsImdldERlZmF1bHRWYWx1ZSIsImNyZWF0ZVRhbmRlbSIsInVuaXRzIiwicmFuZ2UiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicmVzaXN0YW5jZVByb3BlcnR5IiwiUkVTSVNUQU5DRV9SQU5HRSIsImN1cnJlbnRQcm9wZXJ0eSIsImNvbXB1dGVDdXJyZW50IiwicGhldGlvVmFsdWVUeXBlIiwiY3VycmVudFVuaXRzUHJvcGVydHkiLCJNSUxMSUFNUFMiLCJyZXNldCIsImdldE5vcm1hbGl6ZWRWb2x0YWdlIiwiZ2V0IiwibWluIiwiZ2V0TGVuZ3RoIiwiZ2V0Tm9ybWFsaXplZEN1cnJlbnQiLCJnZXRDdXJyZW50UmFuZ2UiLCJnZXROb3JtYWxpemVkUmVzaXN0YW5jZSIsImdldEZpeGVkQ3VycmVudCIsImN1cnJlbnQiLCJ2YWx1ZSIsIkFNUFMiLCJ0b0ZpeGVkIiwiZ2V0U2lnRmlncyIsImdldE1heEN1cnJlbnQiLCJtYXgiLCJnZXRNaW5DdXJyZW50IiwiY3VycmVudFJhbmdlIiwidm9sdGFnZSIsInJlc2lzdGFuY2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIk9obXNMYXdNb2RlbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQcmltYXJ5IG1vZGVsIGZvciB0aGUgT2htJ3MgTGF3IHNpbXVsYXRpb24sIHNlZSBkb2MvbW9kZWwubWQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAqIEBhdXRob3IgVmFzaWx5IFNoYWtob3YgKE1sZWFybmVyKVxyXG4gKiBAYXV0aG9yIEFudG9uIFVseWFub3YgKE1sZWFybmVyKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25EZXByZWNhdGVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9FbnVtZXJhdGlvbkRlcHJlY2F0ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IG9obXNMYXcgZnJvbSAnLi4vLi4vb2htc0xhdy5qcyc7XHJcbmltcG9ydCBPaG1zTGF3Q29uc3RhbnRzIGZyb20gJy4uL09obXNMYXdDb25zdGFudHMuanMnO1xyXG5pbXBvcnQgQ3VycmVudFVuaXQgZnJvbSAnLi9DdXJyZW50VW5pdC5qcyc7XHJcblxyXG5jbGFzcyBPaG1zTGF3TW9kZWwge1xyXG4gIC8qKlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCB0YW5kZW0gKSB7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7UHJvcGVydHkuPG51bWJlcj59IGluIHZvbHRzXHJcbiAgICB0aGlzLnZvbHRhZ2VQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggT2htc0xhd0NvbnN0YW50cy5WT0xUQUdFX1JBTkdFLmdldERlZmF1bHRWYWx1ZSgpLCB7XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ZvbHRhZ2VQcm9wZXJ0eScgKSxcclxuICAgICAgdW5pdHM6ICdWJyxcclxuICAgICAgcmFuZ2U6IE9obXNMYXdDb25zdGFudHMuVk9MVEFHRV9SQU5HRSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSB2b2x0YWdlIGluIHRoZSBjaXJjdWl0J1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge1Byb3BlcnR5LjxudW1iZXI+fSBpbiBPaG1zXHJcbiAgICB0aGlzLnJlc2lzdGFuY2VQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggT2htc0xhd0NvbnN0YW50cy5SRVNJU1RBTkNFX1JBTkdFLmdldERlZmF1bHRWYWx1ZSgpLCB7XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3Jlc2lzdGFuY2VQcm9wZXJ0eScgKSxcclxuICAgICAgdW5pdHM6ICdcXHUyMTI2JywgLy8gb2htc1xyXG4gICAgICByYW5nZTogT2htc0xhd0NvbnN0YW50cy5SRVNJU1RBTkNFX1JBTkdFLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVGhlIHJlc2lzdGFuY2UgaW4gdGhlIGNpcmN1aXQnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7UHJvcGVydHkuPG51bWJlcj59IGNyZWF0ZSBhIGRlcml2ZWQgcHJvcGVydHkgdGhhdCB0cmFja3MgdGhlIGN1cnJlbnQgaW4gbWlsbGkgYW1wc1xyXG4gICAgdGhpcy5jdXJyZW50UHJvcGVydHkgPSBuZXcgRGVyaXZlZFByb3BlcnR5KFxyXG4gICAgICBbIHRoaXMudm9sdGFnZVByb3BlcnR5LCB0aGlzLnJlc2lzdGFuY2VQcm9wZXJ0eSBdLFxyXG4gICAgICBjb21wdXRlQ3VycmVudCwge1xyXG4gICAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2N1cnJlbnRQcm9wZXJ0eScgKSxcclxuICAgICAgICB1bml0czogJ21BJyxcclxuICAgICAgICBwaGV0aW9WYWx1ZVR5cGU6IE51bWJlcklPLFxyXG4gICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdUaGUgY3VycmVudCBmbG93aW5nIGluIHRoZSBjaXJjdWl0J1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEBwdWJsaWNcclxuICAgIHRoaXMuY3VycmVudFVuaXRzUHJvcGVydHkgPSBuZXcgRW51bWVyYXRpb25EZXByZWNhdGVkUHJvcGVydHkoIEN1cnJlbnRVbml0LCBDdXJyZW50VW5pdC5NSUxMSUFNUFMsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnY3VycmVudFVuaXRzUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdEZXRlcm1pbmVzIHRoZSBkaXNwbGF5ZWQgdW5pdCBmb3IgdGhlIGN1cnJlbnQnXHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZXNldHMgdGhlIHByb3BlcnRpZXMgb2YgdGhlIG1vZGVsXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHJlc2V0KCkge1xyXG4gICAgdGhpcy52b2x0YWdlUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMucmVzaXN0YW5jZVByb3BlcnR5LnJlc2V0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIG5vcm1hbGl6ZWQgdm9sdGFnZSBvdmVyIHRoZSByYW5nZSBvZiBhbGxvd2VkIHZvbHRhZ2VzIGluIHRoaXMgc2ltLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGdldE5vcm1hbGl6ZWRWb2x0YWdlKCkge1xyXG4gICAgY29uc3QgcmFuZ2UgPSBPaG1zTGF3Q29uc3RhbnRzLlZPTFRBR0VfUkFOR0U7XHJcbiAgICByZXR1cm4gKCB0aGlzLnZvbHRhZ2VQcm9wZXJ0eS5nZXQoKSAtIHJhbmdlLm1pbiApIC8gcmFuZ2UuZ2V0TGVuZ3RoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIG5vcm1hbGl6ZWQgY3VycmVudCwgYmFzZWQgb24gdGhlIGFsbG93YWJsZSB2YWx1ZXMgZm9yIGN1cnJlbnQgaW4gdGhpcyBzaW0uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgZ2V0Tm9ybWFsaXplZEN1cnJlbnQoKSB7XHJcbiAgICBjb25zdCByYW5nZSA9IE9obXNMYXdNb2RlbC5nZXRDdXJyZW50UmFuZ2UoKTtcclxuICAgIHJldHVybiAoIHRoaXMuY3VycmVudFByb3BlcnR5LmdldCgpIC0gcmFuZ2UubWluICkgLyByYW5nZS5nZXRMZW5ndGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgbm9ybWFsaXplZCByZXNpc3RhbmNlLCBiYXNlZCBvbiB0aGUgYWxsb3dhYmxlIHZhbHVlcyBmb3IgcmVzaXN0YW5jZSBpbiB0aGlzXHJcbiAgICogc2ltLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGdldE5vcm1hbGl6ZWRSZXNpc3RhbmNlKCkge1xyXG4gICAgY29uc3QgcmFuZ2UgPSBPaG1zTGF3Q29uc3RhbnRzLlJFU0lTVEFOQ0VfUkFOR0U7XHJcbiAgICByZXR1cm4gKCB0aGlzLnJlc2lzdGFuY2VQcm9wZXJ0eS5nZXQoKSAtIHJhbmdlLm1pbiApIC8gcmFuZ2UuZ2V0TGVuZ3RoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGN1cnJlbnQgYXMgYSBudW1iZXIgZm9ybWF0dGVkIGJhc2VkIG9uIHRoZSBhcHByb3ByaWF0ZSBkZWNpbWFsIHBsYWNlcyBmb3IgdGhlIGRpc3BsYXkgdW5pdC5cclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBnZXRGaXhlZEN1cnJlbnQoKSB7XHJcbiAgICBsZXQgY3VycmVudCA9IHRoaXMuY3VycmVudFByb3BlcnR5LnZhbHVlO1xyXG4gICAgY29uc3QgdW5pdHMgPSB0aGlzLmN1cnJlbnRVbml0c1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgaWYgKCB1bml0cyA9PT0gQ3VycmVudFVuaXQuQU1QUyApIHtcclxuICAgICAgY3VycmVudCA9IGN1cnJlbnQgLyAxMDA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVXRpbHMudG9GaXhlZCggY3VycmVudCwgQ3VycmVudFVuaXQuZ2V0U2lnRmlncyggdW5pdHMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBtYXhpbXVtIGN1cnJlbnQgdGhhdCBjYW4gYmUgY29tcHV0ZWQgYnkgdGhlIG1vZGVsXHJcbiAgICogQHJldHVybnMge251bWJlcn0gLSB0aGUgbWF4IGN1cnJlbnQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRNYXhDdXJyZW50KCkge1xyXG4gICAgcmV0dXJuIGNvbXB1dGVDdXJyZW50KCBPaG1zTGF3Q29uc3RhbnRzLlZPTFRBR0VfUkFOR0UubWF4LCBPaG1zTGF3Q29uc3RhbnRzLlJFU0lTVEFOQ0VfUkFOR0UubWluICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIG1pbmltdW0gY3VycmVudCB0aGF0IGNhbiBiZSBjb21wdXRlZCBieSB0aGUgbW9kZWwuXHJcbiAgICogQHJldHVybnMge251bWJlcn0gW2Rlc2NyaXB0aW9uXVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgc3RhdGljIGdldE1pbkN1cnJlbnQoKSB7XHJcbiAgICByZXR1cm4gY29tcHV0ZUN1cnJlbnQoIE9obXNMYXdDb25zdGFudHMuVk9MVEFHRV9SQU5HRS5taW4sIE9obXNMYXdDb25zdGFudHMuUkVTSVNUQU5DRV9SQU5HRS5tYXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgUmFuZ2Ugb2YgdGhlIGN1cnJlbnQsIHdpbGwgY29uc3RydWN0IGEgbmV3IHJhbmdlIGlmIG5vdCB5ZXQgc2V0XHJcbiAgICogQHJldHVybnMge1JhbmdlfVxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBzdGF0aWMgZ2V0Q3VycmVudFJhbmdlKCkge1xyXG5cclxuICAgIGlmICggIXRoaXMuY3VycmVudFJhbmdlICkge1xyXG5cclxuICAgICAgLy8gQHByaXZhdGUsIHVzZSB0aGUgZ2V0dGVyXHJcbiAgICAgIHRoaXMuY3VycmVudFJhbmdlID0gbmV3IFJhbmdlKCBPaG1zTGF3TW9kZWwuZ2V0TWluQ3VycmVudCgpLCBPaG1zTGF3TW9kZWwuZ2V0TWF4Q3VycmVudCgpICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50UmFuZ2U7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhlIG1haW4gbW9kZWwgZnVuY3Rpb24sIHVzZWQgdG8gY29tcHV0ZSB0aGUgY3VycmVudCBvZiB0aGUgbW9kZWxcclxuICogQHBhcmFtIHZvbHRhZ2VcclxuICogQHBhcmFtIHJlc2lzdGFuY2VcclxuICogQHJldHVybnMge251bWJlcn0gLSBjdXJyZW50IGluIG1pbGxpYW1wc1xyXG4gKi9cclxuZnVuY3Rpb24gY29tcHV0ZUN1cnJlbnQoIHZvbHRhZ2UsIHJlc2lzdGFuY2UgKSB7XHJcbiAgcmV0dXJuIDEwMDAgKiB2b2x0YWdlIC8gcmVzaXN0YW5jZTtcclxufVxyXG5cclxub2htc0xhdy5yZWdpc3RlciggJ09obXNMYXdNb2RlbCcsIE9obXNMYXdNb2RlbCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgT2htc0xhd01vZGVsOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sd0NBQXdDO0FBQ3BFLE9BQU9DLDZCQUE2QixNQUFNLHNEQUFzRDtBQUNoRyxPQUFPQyxjQUFjLE1BQU0sdUNBQXVDO0FBQ2xFLE9BQU9DLEtBQUssTUFBTSw2QkFBNkI7QUFDL0MsT0FBT0MsS0FBSyxNQUFN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