// Copyright 2018-2023, University of Colorado Boulder

/**
 * a panel that contains controls used to exercise the addition, removal, and disposal of sound generators
 *
 * @author John Blanco
 */

import createObservableArray from '../../../../../axon/js/createObservableArray.js';
import Property from '../../../../../axon/js/Property.js';
import stepTimer from '../../../../../axon/js/stepTimer.js';
import dotRandom from '../../../../../dot/js/dotRandom.js';
import optionize from '../../../../../phet-core/js/optionize.js';
import StringUtils from '../../../../../phetcommon/js/util/StringUtils.js';
import PhetFont from '../../../../../scenery-phet/js/PhetFont.js';
import { HBox, Node, Text, VBox } from '../../../../../scenery/js/imports.js';
import TextPushButton from '../../../../../sun/js/buttons/TextPushButton.js';
import ComboBox from '../../../../../sun/js/ComboBox.js';
import Panel from '../../../../../sun/js/Panel.js';
import birdCall_mp3 from '../../../../sounds/demo-and-test/birdCall_mp3.js';
import cricketsLoop_mp3 from '../../../../sounds/demo-and-test/cricketsLoop_mp3.js';
import PitchedPopGenerator from '../../../sound-generators/PitchedPopGenerator.js';
import SoundClip from '../../../sound-generators/SoundClip.js';
import soundManager from '../../../soundManager.js';
import tambo from '../../../tambo.js';
// constants
const BUTTON_FONT = new PhetFont(18);
const COMBO_BOX_FONT = new PhetFont(16);
const TOTAL_ADDED_TEMPLATE = 'Total Added: {{numSoundGenerators}}';
const ADD_BUTTON_COLOR = '#C0D890';

// info needed for selecting and using different sound generators from the combo box
const SOUND_GENERATOR_INFO = new Map([['recordedOneShot', {
  comboBoxItemName: 'Recorded one shot',
  createSoundGenerator: () => new SoundClip(birdCall_mp3)
}], ['recordedLoop', {
  comboBoxItemName: 'Recorded loop',
  createSoundGenerator: () => new SoundClip(cricketsLoop_mp3, {
    loop: true
  })
}], ['synthesizedSound', {
  comboBoxItemName: 'Synthesized sound',
  createSoundGenerator: () => new PitchedPopGenerator({
    numPopGenerators: 2
  })
}]]);
class RemoveAndDisposeSoundGeneratorsTestPanel extends Panel {
  constructor(providedOptions) {
    const options = optionize()({
      fill: '#f5d3b3',
      xMargin: 14,
      yMargin: 14
    }, providedOptions);

    // array of sound generators that have been added and not yet removed and disposed
    const soundGenerators = createObservableArray();

    // node where the content goes, needed so that ComboBox will have a good place to put its list
    const panelContentNode = new Node();

    // informational text that goes at the top of the panel
    const infoText = new Text('Test addition, removal, and disposal of sound generators', {
      font: new PhetFont({
        size: 18,
        weight: 'bold'
      })
    });

    // Create the combo box for selecting the type of sound generator to add.
    const comboBoxItems = [];
    SOUND_GENERATOR_INFO.forEach((soundGenerator, soundGeneratorKey) => {
      comboBoxItems.push({
        value: soundGeneratorKey,
        createNode: () => new Text(soundGenerator.comboBoxItemName, {
          font: COMBO_BOX_FONT
        })
      });
    });
    const selectedSoundGeneratorTypeProperty = new Property(comboBoxItems[0].value);
    const comboBox = new ComboBox(selectedSoundGeneratorTypeProperty, comboBoxItems, panelContentNode, {
      buttonFill: 'rgb( 218, 236, 255 )'
    });
    const sgSelectorNode = new HBox({
      children: [new Text('SG type to add:', {
        font: new PhetFont(19)
      }), comboBox],
      spacing: 7
    });
    function addSoundGenerators(numberToAdd) {
      _.times(numberToAdd, () => {
        const soundGenerator = SOUND_GENERATOR_INFO.get(selectedSoundGeneratorTypeProperty.value).createSoundGenerator();
        soundManager.addSoundGenerator(soundGenerator);
        soundGenerators.push(soundGenerator);
      });
    }

    // create a horizontal set of buttons for adding sound generators at different orders of magnitude
    const addButtonHBox = new HBox({
      children: [new TextPushButton('Add 1', {
        baseColor: ADD_BUTTON_COLOR,
        font: BUTTON_FONT,
        listener: () => {
          addSoundGenerators(1);
        }
      }), new TextPushButton('Add 10', {
        baseColor: ADD_BUTTON_COLOR,
        font: BUTTON_FONT,
        listener: () => {
          addSoundGenerators(10);
        }
      }), new TextPushButton('Add 100', {
        baseColor: ADD_BUTTON_COLOR,
        font: BUTTON_FONT,
        listener: () => {
          addSoundGenerators(100);
        }
      })],
      spacing: 14
    });

    // create a horizontal box with an indicator for the number of sound generators added and a button to remove them all
    const totalAddedIndicator = new Text(TOTAL_ADDED_TEMPLATE, {
      font: new PhetFont(19)
    });
    const removeAllSoundGeneratorsButton = new TextPushButton('Remove All', {
      font: BUTTON_FONT,
      listener: () => {
        soundGenerators.clear();
      }
    });
    const showTotalHBox = new HBox({
      children: [totalAddedIndicator, removeAllSoundGeneratorsButton],
      spacing: 14
    });

    // create a button that will test the most recently added sound generator
    const testLastAddedSGButton = new TextPushButton('Test last added SG', {
      font: BUTTON_FONT,
      baseColor: '#BABFFF',
      listener: () => {
        const mostRecentlyAddedSoundGenerator = soundGenerators.get(soundGenerators.length - 1);
        if (mostRecentlyAddedSoundGenerator instanceof SoundClip) {
          if (mostRecentlyAddedSoundGenerator.loop) {
            // only start the loop if not already playing
            if (!mostRecentlyAddedSoundGenerator.isPlaying) {
              // play the loop for a fixed time and then stop, but make sure the sound generator wasn't removed in the
              // interim
              mostRecentlyAddedSoundGenerator.play();
              stepTimer.setTimeout(() => {
                if (soundGenerators.includes(mostRecentlyAddedSoundGenerator)) {
                  mostRecentlyAddedSoundGenerator.stop();
                }
              }, 3000);
            }
          } else {
            // play one-shot sounds whenever the button is pressed
            mostRecentlyAddedSoundGenerator.play();
          }
        } else if (mostRecentlyAddedSoundGenerator instanceof PitchedPopGenerator) {
          mostRecentlyAddedSoundGenerator.playPop(dotRandom.nextDouble());
        }
      }
    });

    // update the total added indicator when the total changes, also the state of the "Remove All" button
    soundGenerators.lengthProperty.link(numSGs => {
      totalAddedIndicator.string = StringUtils.fillIn(TOTAL_ADDED_TEMPLATE, {
        numSoundGenerators: numSGs
      });
      testLastAddedSGButton.enabled = numSGs > 0;
      removeAllSoundGeneratorsButton.enabled = numSGs > 0;
    });

    // listen for removal of sound generators from the observable array and remove them from the sound manager
    soundGenerators.addItemRemovedListener(removedSoundGenerator => {
      soundManager.removeSoundGenerator(removedSoundGenerator);
      removedSoundGenerator.dispose();
    });

    // add everything to a vertical box
    const rootVBox = new VBox({
      children: [infoText, sgSelectorNode, addButtonHBox, showTotalHBox, testLastAddedSGButton],
      spacing: 19
    });
    panelContentNode.addChild(rootVBox);
    super(panelContentNode, options);
  }
}
tambo.register('RemoveAndDisposeSoundGeneratorsTestPanel', RemoveAndDisposeSoundGeneratorsTestPanel);
export default RemoveAndDisposeSoundGeneratorsTestPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJQcm9wZXJ0eSIsInN0ZXBUaW1lciIsImRvdFJhbmRvbSIsIm9wdGlvbml6ZSIsIlN0cmluZ1V0aWxzIiwiUGhldEZvbnQiLCJIQm94IiwiTm9kZSIsIlRleHQiLCJWQm94IiwiVGV4dFB1c2hCdXR0b24iLCJDb21ib0JveCIsIlBhbmVsIiwiYmlyZENhbGxfbXAzIiwiY3JpY2tldHNMb29wX21wMyIsIlBpdGNoZWRQb3BHZW5lcmF0b3IiLCJTb3VuZENsaXAiLCJzb3VuZE1hbmFnZXIiLCJ0YW1ibyIsIkJVVFRPTl9GT05UIiwiQ09NQk9fQk9YX0ZPTlQiLCJUT1RBTF9BRERFRF9URU1QTEFURSIsIkFERF9CVVRUT05fQ09MT1IiLCJTT1VORF9HRU5FUkFUT1JfSU5GTyIsIk1hcCIsImNvbWJvQm94SXRlbU5hbWUiLCJjcmVhdGVTb3VuZEdlbmVyYXRvciIsImxvb3AiLCJudW1Qb3BHZW5lcmF0b3JzIiwiUmVtb3ZlQW5kRGlzcG9zZVNvdW5kR2VuZXJhdG9yc1Rlc3RQYW5lbCIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImZpbGwiLCJ4TWFyZ2luIiwieU1hcmdpbiIsInNvdW5kR2VuZXJhdG9ycyIsInBhbmVsQ29udGVudE5vZGUiLCJpbmZvVGV4dCIsImZvbnQiLCJzaXplIiwid2VpZ2h0IiwiY29tYm9Cb3hJdGVtcyIsImZvckVhY2giLCJzb3VuZEdlbmVyYXRvciIsInNvdW5kR2VuZXJhdG9yS2V5IiwicHVzaCIsInZhbHVlIiwiY3JlYXRlTm9kZSIsInNlbGVjdGVkU291bmRHZW5lcmF0b3JUeXBlUHJvcGVydHkiLCJjb21ib0JveCIsImJ1dHRvbkZpbGwiLCJzZ1NlbGVjdG9yTm9kZSIsImNoaWxkcmVuIiwic3BhY2luZyIsImFkZFNvdW5kR2VuZXJhdG9ycyIsIm51bWJlclRvQWRkIiwiXyIsInRpbWVzIiwiZ2V0IiwiYWRkU291bmRHZW5lcmF0b3IiLCJhZGRCdXR0b25IQm94IiwiYmFzZUNvbG9yIiwibGlzdGVuZXIiLCJ0b3RhbEFkZGVkSW5kaWNhdG9yIiwicmVtb3ZlQWxsU291bmRHZW5lcmF0b3JzQnV0dG9uIiwiY2xlYXIiLCJzaG93VG90YWxIQm94IiwidGVzdExhc3RBZGRlZFNHQnV0dG9uIiwibW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvciIsImxlbmd0aCIsImlzUGxheWluZyIsInBsYXkiLCJzZXRUaW1lb3V0IiwiaW5jbHVkZXMiLCJzdG9wIiwicGxheVBvcCIsIm5leHREb3VibGUiLCJsZW5ndGhQcm9wZXJ0eSIsImxpbmsiLCJudW1TR3MiLCJzdHJpbmciLCJmaWxsSW4iLCJudW1Tb3VuZEdlbmVyYXRvcnMiLCJlbmFibGVkIiwiYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciIsInJlbW92ZWRTb3VuZEdlbmVyYXRvciIsInJlbW92ZVNvdW5kR2VuZXJhdG9yIiwiZGlzcG9zZSIsInJvb3RWQm94IiwiYWRkQ2hpbGQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlJlbW92ZUFuZERpc3Bvc2VTb3VuZEdlbmVyYXRvcnNUZXN0UGFuZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogYSBwYW5lbCB0aGF0IGNvbnRhaW5zIGNvbnRyb2xzIHVzZWQgdG8gZXhlcmNpc2UgdGhlIGFkZGl0aW9uLCByZW1vdmFsLCBhbmQgZGlzcG9zYWwgb2Ygc291bmQgZ2VuZXJhdG9yc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvXHJcbiAqL1xyXG5cclxuaW1wb3J0IGNyZWF0ZU9ic2VydmFibGVBcnJheSBmcm9tICcuLi8uLi8uLi8uLi8uLi9heG9uL2pzL2NyZWF0ZU9ic2VydmFibGVBcnJheS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi8uLi8uLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vLi4vLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCB7IEhCb3gsIE5vZGUsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGV4dFB1c2hCdXR0b24gZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL2J1dHRvbnMvVGV4dFB1c2hCdXR0b24uanMnO1xyXG5pbXBvcnQgQ29tYm9Cb3gsIHsgQ29tYm9Cb3hJdGVtIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL0NvbWJvQm94LmpzJztcclxuaW1wb3J0IFBhbmVsLCB7IFBhbmVsT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3N1bi9qcy9QYW5lbC5qcyc7XHJcbmltcG9ydCBiaXJkQ2FsbF9tcDMgZnJvbSAnLi4vLi4vLi4vLi4vc291bmRzL2RlbW8tYW5kLXRlc3QvYmlyZENhbGxfbXAzLmpzJztcclxuaW1wb3J0IGNyaWNrZXRzTG9vcF9tcDMgZnJvbSAnLi4vLi4vLi4vLi4vc291bmRzL2RlbW8tYW5kLXRlc3QvY3JpY2tldHNMb29wX21wMy5qcyc7XHJcbmltcG9ydCBQaXRjaGVkUG9wR2VuZXJhdG9yIGZyb20gJy4uLy4uLy4uL3NvdW5kLWdlbmVyYXRvcnMvUGl0Y2hlZFBvcEdlbmVyYXRvci5qcyc7XHJcbmltcG9ydCBTb3VuZENsaXAgZnJvbSAnLi4vLi4vLi4vc291bmQtZ2VuZXJhdG9ycy9Tb3VuZENsaXAuanMnO1xyXG5pbXBvcnQgc291bmRNYW5hZ2VyIGZyb20gJy4uLy4uLy4uL3NvdW5kTWFuYWdlci5qcyc7XHJcbmltcG9ydCB0YW1ibyBmcm9tICcuLi8uLi8uLi90YW1iby5qcyc7XHJcbmltcG9ydCBTb3VuZEdlbmVyYXRvciBmcm9tICcuLi8uLi8uLi9zb3VuZC1nZW5lcmF0b3JzL1NvdW5kR2VuZXJhdG9yLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zO1xyXG5leHBvcnQgdHlwZSBSZW1vdmVBbmREaXNwb3NlU291bmRHZW5lcmF0b3JzVGVzdFBhbmVsT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGFuZWxPcHRpb25zO1xyXG50eXBlIFNvdW5kR2VuZXJhdG9yQ29tYm9Cb3hJdGVtSW5mbyA9IHtcclxuICBjb21ib0JveEl0ZW1OYW1lOiBzdHJpbmc7XHJcbiAgY3JlYXRlU291bmRHZW5lcmF0b3I6ICgpID0+IFNvdW5kR2VuZXJhdG9yO1xyXG59O1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IEJVVFRPTl9GT05UID0gbmV3IFBoZXRGb250KCAxOCApO1xyXG5jb25zdCBDT01CT19CT1hfRk9OVCA9IG5ldyBQaGV0Rm9udCggMTYgKTtcclxuY29uc3QgVE9UQUxfQURERURfVEVNUExBVEUgPSAnVG90YWwgQWRkZWQ6IHt7bnVtU291bmRHZW5lcmF0b3JzfX0nO1xyXG5jb25zdCBBRERfQlVUVE9OX0NPTE9SID0gJyNDMEQ4OTAnO1xyXG5cclxuLy8gaW5mbyBuZWVkZWQgZm9yIHNlbGVjdGluZyBhbmQgdXNpbmcgZGlmZmVyZW50IHNvdW5kIGdlbmVyYXRvcnMgZnJvbSB0aGUgY29tYm8gYm94XHJcbmNvbnN0IFNPVU5EX0dFTkVSQVRPUl9JTkZPID0gbmV3IE1hcDxzdHJpbmcsIFNvdW5kR2VuZXJhdG9yQ29tYm9Cb3hJdGVtSW5mbz4oIFtcclxuICBbXHJcbiAgICAncmVjb3JkZWRPbmVTaG90JyxcclxuICAgIHtcclxuICAgICAgY29tYm9Cb3hJdGVtTmFtZTogJ1JlY29yZGVkIG9uZSBzaG90JyxcclxuICAgICAgY3JlYXRlU291bmRHZW5lcmF0b3I6ICgpID0+IG5ldyBTb3VuZENsaXAoIGJpcmRDYWxsX21wMyApXHJcbiAgICB9XHJcbiAgXSxcclxuICBbXHJcbiAgICAncmVjb3JkZWRMb29wJyxcclxuICAgIHtcclxuICAgICAgY29tYm9Cb3hJdGVtTmFtZTogJ1JlY29yZGVkIGxvb3AnLFxyXG4gICAgICBjcmVhdGVTb3VuZEdlbmVyYXRvcjogKCkgPT4gbmV3IFNvdW5kQ2xpcCggY3JpY2tldHNMb29wX21wMywgeyBsb29wOiB0cnVlIH0gKVxyXG4gICAgfVxyXG4gIF0sXHJcbiAgW1xyXG4gICAgJ3N5bnRoZXNpemVkU291bmQnLFxyXG4gICAge1xyXG4gICAgICBjb21ib0JveEl0ZW1OYW1lOiAnU3ludGhlc2l6ZWQgc291bmQnLFxyXG4gICAgICBjcmVhdGVTb3VuZEdlbmVyYXRvcjogKCkgPT4gbmV3IFBpdGNoZWRQb3BHZW5lcmF0b3IoIHsgbnVtUG9wR2VuZXJhdG9yczogMiB9IClcclxuICAgIH1cclxuICBdXHJcbl0gKTtcclxuXHJcbmNsYXNzIFJlbW92ZUFuZERpc3Bvc2VTb3VuZEdlbmVyYXRvcnNUZXN0UGFuZWwgZXh0ZW5kcyBQYW5lbCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogUmVtb3ZlQW5kRGlzcG9zZVNvdW5kR2VuZXJhdG9yc1Rlc3RQYW5lbE9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxSZW1vdmVBbmREaXNwb3NlU291bmRHZW5lcmF0b3JzVGVzdFBhbmVsT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhbmVsT3B0aW9ucz4oKSgge1xyXG4gICAgICBmaWxsOiAnI2Y1ZDNiMycsXHJcbiAgICAgIHhNYXJnaW46IDE0LFxyXG4gICAgICB5TWFyZ2luOiAxNFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gYXJyYXkgb2Ygc291bmQgZ2VuZXJhdG9ycyB0aGF0IGhhdmUgYmVlbiBhZGRlZCBhbmQgbm90IHlldCByZW1vdmVkIGFuZCBkaXNwb3NlZFxyXG4gICAgY29uc3Qgc291bmRHZW5lcmF0b3JzID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5PFNvdW5kR2VuZXJhdG9yPigpO1xyXG5cclxuICAgIC8vIG5vZGUgd2hlcmUgdGhlIGNvbnRlbnQgZ29lcywgbmVlZGVkIHNvIHRoYXQgQ29tYm9Cb3ggd2lsbCBoYXZlIGEgZ29vZCBwbGFjZSB0byBwdXQgaXRzIGxpc3RcclxuICAgIGNvbnN0IHBhbmVsQ29udGVudE5vZGUgPSBuZXcgTm9kZSgpO1xyXG5cclxuICAgIC8vIGluZm9ybWF0aW9uYWwgdGV4dCB0aGF0IGdvZXMgYXQgdGhlIHRvcCBvZiB0aGUgcGFuZWxcclxuICAgIGNvbnN0IGluZm9UZXh0ID0gbmV3IFRleHQoICdUZXN0IGFkZGl0aW9uLCByZW1vdmFsLCBhbmQgZGlzcG9zYWwgb2Ygc291bmQgZ2VuZXJhdG9ycycsIHtcclxuICAgICAgZm9udDogbmV3IFBoZXRGb250KCB7IHNpemU6IDE4LCB3ZWlnaHQ6ICdib2xkJyB9IClcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGNvbWJvIGJveCBmb3Igc2VsZWN0aW5nIHRoZSB0eXBlIG9mIHNvdW5kIGdlbmVyYXRvciB0byBhZGQuXHJcbiAgICBjb25zdCBjb21ib0JveEl0ZW1zOiBDb21ib0JveEl0ZW08c3RyaW5nPltdID0gW107XHJcbiAgICBTT1VORF9HRU5FUkFUT1JfSU5GTy5mb3JFYWNoKCAoIHNvdW5kR2VuZXJhdG9yLCBzb3VuZEdlbmVyYXRvcktleSApID0+IHtcclxuICAgICAgY29tYm9Cb3hJdGVtcy5wdXNoKCB7XHJcbiAgICAgICAgdmFsdWU6IHNvdW5kR2VuZXJhdG9yS2V5LFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICgpID0+IG5ldyBUZXh0KCBzb3VuZEdlbmVyYXRvci5jb21ib0JveEl0ZW1OYW1lLCB7IGZvbnQ6IENPTUJPX0JPWF9GT05UIH0gKVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBzZWxlY3RlZFNvdW5kR2VuZXJhdG9yVHlwZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBjb21ib0JveEl0ZW1zWyAwIF0udmFsdWUgKTtcclxuICAgIGNvbnN0IGNvbWJvQm94ID0gbmV3IENvbWJvQm94KCBzZWxlY3RlZFNvdW5kR2VuZXJhdG9yVHlwZVByb3BlcnR5LCBjb21ib0JveEl0ZW1zLCBwYW5lbENvbnRlbnROb2RlLCB7XHJcbiAgICAgIGJ1dHRvbkZpbGw6ICdyZ2IoIDIxOCwgMjM2LCAyNTUgKSdcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHNnU2VsZWN0b3JOb2RlID0gbmV3IEhCb3goIHtcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBuZXcgVGV4dCggJ1NHIHR5cGUgdG8gYWRkOicsIHsgZm9udDogbmV3IFBoZXRGb250KCAxOSApIH0gKSxcclxuICAgICAgICBjb21ib0JveFxyXG4gICAgICBdLFxyXG4gICAgICBzcGFjaW5nOiA3XHJcbiAgICB9ICk7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkU291bmRHZW5lcmF0b3JzKCBudW1iZXJUb0FkZDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgICBfLnRpbWVzKCBudW1iZXJUb0FkZCwgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNvdW5kR2VuZXJhdG9yID0gU09VTkRfR0VORVJBVE9SX0lORk8uZ2V0KCBzZWxlY3RlZFNvdW5kR2VuZXJhdG9yVHlwZVByb3BlcnR5LnZhbHVlICkhLmNyZWF0ZVNvdW5kR2VuZXJhdG9yKCk7XHJcbiAgICAgICAgc291bmRNYW5hZ2VyLmFkZFNvdW5kR2VuZXJhdG9yKCBzb3VuZEdlbmVyYXRvciApO1xyXG4gICAgICAgIHNvdW5kR2VuZXJhdG9ycy5wdXNoKCBzb3VuZEdlbmVyYXRvciApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY3JlYXRlIGEgaG9yaXpvbnRhbCBzZXQgb2YgYnV0dG9ucyBmb3IgYWRkaW5nIHNvdW5kIGdlbmVyYXRvcnMgYXQgZGlmZmVyZW50IG9yZGVycyBvZiBtYWduaXR1ZGVcclxuICAgIGNvbnN0IGFkZEJ1dHRvbkhCb3ggPSBuZXcgSEJveCgge1xyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIG5ldyBUZXh0UHVzaEJ1dHRvbiggJ0FkZCAxJywge1xyXG4gICAgICAgICAgYmFzZUNvbG9yOiBBRERfQlVUVE9OX0NPTE9SLFxyXG4gICAgICAgICAgZm9udDogQlVUVE9OX0ZPTlQsXHJcbiAgICAgICAgICBsaXN0ZW5lcjogKCkgPT4geyBhZGRTb3VuZEdlbmVyYXRvcnMoIDEgKTsgfVxyXG4gICAgICAgIH0gKSxcclxuICAgICAgICBuZXcgVGV4dFB1c2hCdXR0b24oICdBZGQgMTAnLCB7XHJcbiAgICAgICAgICBiYXNlQ29sb3I6IEFERF9CVVRUT05fQ09MT1IsXHJcbiAgICAgICAgICBmb250OiBCVVRUT05fRk9OVCxcclxuICAgICAgICAgIGxpc3RlbmVyOiAoKSA9PiB7IGFkZFNvdW5kR2VuZXJhdG9ycyggMTAgKTsgfVxyXG4gICAgICAgIH0gKSxcclxuICAgICAgICBuZXcgVGV4dFB1c2hCdXR0b24oICdBZGQgMTAwJywge1xyXG4gICAgICAgICAgYmFzZUNvbG9yOiBBRERfQlVUVE9OX0NPTE9SLFxyXG4gICAgICAgICAgZm9udDogQlVUVE9OX0ZPTlQsXHJcbiAgICAgICAgICBsaXN0ZW5lcjogKCkgPT4geyBhZGRTb3VuZEdlbmVyYXRvcnMoIDEwMCApOyB9XHJcbiAgICAgICAgfSApXHJcbiAgICAgIF0sXHJcbiAgICAgIHNwYWNpbmc6IDE0XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIGEgaG9yaXpvbnRhbCBib3ggd2l0aCBhbiBpbmRpY2F0b3IgZm9yIHRoZSBudW1iZXIgb2Ygc291bmQgZ2VuZXJhdG9ycyBhZGRlZCBhbmQgYSBidXR0b24gdG8gcmVtb3ZlIHRoZW0gYWxsXHJcbiAgICBjb25zdCB0b3RhbEFkZGVkSW5kaWNhdG9yID0gbmV3IFRleHQoIFRPVEFMX0FEREVEX1RFTVBMQVRFLCB7IGZvbnQ6IG5ldyBQaGV0Rm9udCggMTkgKSB9ICk7XHJcbiAgICBjb25zdCByZW1vdmVBbGxTb3VuZEdlbmVyYXRvcnNCdXR0b24gPSBuZXcgVGV4dFB1c2hCdXR0b24oICdSZW1vdmUgQWxsJywge1xyXG4gICAgICBmb250OiBCVVRUT05fRk9OVCxcclxuICAgICAgbGlzdGVuZXI6ICgpID0+IHsgc291bmRHZW5lcmF0b3JzLmNsZWFyKCk7IH1cclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHNob3dUb3RhbEhCb3ggPSBuZXcgSEJveCgge1xyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIHRvdGFsQWRkZWRJbmRpY2F0b3IsXHJcbiAgICAgICAgcmVtb3ZlQWxsU291bmRHZW5lcmF0b3JzQnV0dG9uXHJcbiAgICAgIF0sXHJcbiAgICAgIHNwYWNpbmc6IDE0XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIGEgYnV0dG9uIHRoYXQgd2lsbCB0ZXN0IHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIHNvdW5kIGdlbmVyYXRvclxyXG4gICAgY29uc3QgdGVzdExhc3RBZGRlZFNHQnV0dG9uID0gbmV3IFRleHRQdXNoQnV0dG9uKCAnVGVzdCBsYXN0IGFkZGVkIFNHJywge1xyXG4gICAgICBmb250OiBCVVRUT05fRk9OVCxcclxuICAgICAgYmFzZUNvbG9yOiAnI0JBQkZGRicsXHJcbiAgICAgIGxpc3RlbmVyOiAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgbW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvciA9IHNvdW5kR2VuZXJhdG9ycy5nZXQoIHNvdW5kR2VuZXJhdG9ycy5sZW5ndGggLSAxICk7XHJcblxyXG4gICAgICAgIGlmICggbW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvciBpbnN0YW5jZW9mIFNvdW5kQ2xpcCApIHtcclxuICAgICAgICAgIGlmICggbW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvci5sb29wICkge1xyXG5cclxuICAgICAgICAgICAgLy8gb25seSBzdGFydCB0aGUgbG9vcCBpZiBub3QgYWxyZWFkeSBwbGF5aW5nXHJcbiAgICAgICAgICAgIGlmICggIW1vc3RSZWNlbnRseUFkZGVkU291bmRHZW5lcmF0b3IuaXNQbGF5aW5nICkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBwbGF5IHRoZSBsb29wIGZvciBhIGZpeGVkIHRpbWUgYW5kIHRoZW4gc3RvcCwgYnV0IG1ha2Ugc3VyZSB0aGUgc291bmQgZ2VuZXJhdG9yIHdhc24ndCByZW1vdmVkIGluIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGludGVyaW1cclxuICAgICAgICAgICAgICBtb3N0UmVjZW50bHlBZGRlZFNvdW5kR2VuZXJhdG9yLnBsYXkoKTtcclxuICAgICAgICAgICAgICBzdGVwVGltZXIuc2V0VGltZW91dCggKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzb3VuZEdlbmVyYXRvcnMuaW5jbHVkZXMoIG1vc3RSZWNlbnRseUFkZGVkU291bmRHZW5lcmF0b3IgKSApIHtcclxuICAgICAgICAgICAgICAgICAgbW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvci5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSwgMzAwMCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHBsYXkgb25lLXNob3Qgc291bmRzIHdoZW5ldmVyIHRoZSBidXR0b24gaXMgcHJlc3NlZFxyXG4gICAgICAgICAgICBtb3N0UmVjZW50bHlBZGRlZFNvdW5kR2VuZXJhdG9yLnBsYXkoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIG1vc3RSZWNlbnRseUFkZGVkU291bmRHZW5lcmF0b3IgaW5zdGFuY2VvZiBQaXRjaGVkUG9wR2VuZXJhdG9yICkge1xyXG4gICAgICAgICAgbW9zdFJlY2VudGx5QWRkZWRTb3VuZEdlbmVyYXRvci5wbGF5UG9wKCBkb3RSYW5kb20ubmV4dERvdWJsZSgpICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRoZSB0b3RhbCBhZGRlZCBpbmRpY2F0b3Igd2hlbiB0aGUgdG90YWwgY2hhbmdlcywgYWxzbyB0aGUgc3RhdGUgb2YgdGhlIFwiUmVtb3ZlIEFsbFwiIGJ1dHRvblxyXG4gICAgc291bmRHZW5lcmF0b3JzLmxlbmd0aFByb3BlcnR5LmxpbmsoIG51bVNHcyA9PiB7XHJcbiAgICAgIHRvdGFsQWRkZWRJbmRpY2F0b3Iuc3RyaW5nID0gU3RyaW5nVXRpbHMuZmlsbEluKCBUT1RBTF9BRERFRF9URU1QTEFURSwge1xyXG4gICAgICAgIG51bVNvdW5kR2VuZXJhdG9yczogbnVtU0dzXHJcbiAgICAgIH0gKTtcclxuICAgICAgdGVzdExhc3RBZGRlZFNHQnV0dG9uLmVuYWJsZWQgPSBudW1TR3MgPiAwO1xyXG4gICAgICByZW1vdmVBbGxTb3VuZEdlbmVyYXRvcnNCdXR0b24uZW5hYmxlZCA9IG51bVNHcyA+IDA7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gbGlzdGVuIGZvciByZW1vdmFsIG9mIHNvdW5kIGdlbmVyYXRvcnMgZnJvbSB0aGUgb2JzZXJ2YWJsZSBhcnJheSBhbmQgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgc291bmQgbWFuYWdlclxyXG4gICAgc291bmRHZW5lcmF0b3JzLmFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIoIHJlbW92ZWRTb3VuZEdlbmVyYXRvciA9PiB7XHJcbiAgICAgIHNvdW5kTWFuYWdlci5yZW1vdmVTb3VuZEdlbmVyYXRvciggcmVtb3ZlZFNvdW5kR2VuZXJhdG9yICk7XHJcbiAgICAgIHJlbW92ZWRTb3VuZEdlbmVyYXRvci5kaXNwb3NlKCk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gYWRkIGV2ZXJ5dGhpbmcgdG8gYSB2ZXJ0aWNhbCBib3hcclxuICAgIGNvbnN0IHJvb3RWQm94ID0gbmV3IFZCb3goIHtcclxuICAgICAgY2hpbGRyZW46IFsgaW5mb1RleHQsIHNnU2VsZWN0b3JOb2RlLCBhZGRCdXR0b25IQm94LCBzaG93VG90YWxIQm94LCB0ZXN0TGFzdEFkZGVkU0dCdXR0b24gXSxcclxuICAgICAgc3BhY2luZzogMTlcclxuICAgIH0gKTtcclxuXHJcbiAgICBwYW5lbENvbnRlbnROb2RlLmFkZENoaWxkKCByb290VkJveCApO1xyXG5cclxuICAgIHN1cGVyKCBwYW5lbENvbnRlbnROb2RlLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdSZW1vdmVBbmREaXNwb3NlU291bmRHZW5lcmF0b3JzVGVzdFBhbmVsJywgUmVtb3ZlQW5kRGlzcG9zZVNvdW5kR2VuZXJhdG9yc1Rlc3RQYW5lbCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUmVtb3ZlQW5kRGlzcG9zZVNvdW5kR2VuZXJhdG9yc1Rlc3RQYW5lbDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EscUJBQXFCLE1BQU0saURBQWlEO0FBQ25GLE9BQU9DLFFBQVEsTUFBTSxvQ0FBb0M7QUFDekQsT0FBT0MsU0FBUyxNQUFNLHFDQUFxQztBQUMzRCxPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBQzFELE9BQU9DLFNBQVMsTUFBNEIsMENBQTBDO0FBQ3RGLE9BQU9DLFdBQVcsTUFBTSxrREFBa0Q7QUFDMUUsT0FBT0MsUUFBUSxNQUFNLDRDQUE0QztBQUNqRSxTQUFTQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEs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Y0FFaEQ7Y0FDQTtjQUNBRiwrQkFBK0IsQ0FBQ0csSUFBSSxDQUFDLENBQUM7Y0FDdEN2RSxTQUFTLENBQUN3RSxVQUFVLENBQUUsTUFBTTtnQkFDMUIsSUFBS3JDLGVBQWUsQ0FBQ3NDLFFBQVEsQ0FBRUwsK0JBQWdDLENBQUMsRUFBRztrQkFDakVBLCtCQUErQixDQUFDTSxJQUFJLENBQUMsQ0FBQztnQkFDeEM7Y0FDRixDQUFDLEVBQUUsSUFBSyxDQUFDO1lBQ1g7VUFDRixDQUFDLE1BQ0k7WUFFSDtZQUNBTiwrQkFBK0IsQ0FBQ0csSUFBSSxDQUFDLENBQUM7VUFDeEM7UUFDRixDQUFDLE1BQ0ksSUFBS0gsK0JBQStCLFlBQVl0RCxtQkFBbUIsRUFBRztVQUN6RXNELCtCQUErQixDQUFDTyxPQUFPLENBQUUxRSxTQUFTLENBQUMyRSxVQUFVLENBQUMsQ0FBRSxDQUFDO1FBQ25FO01BQ0Y7SUFDRixDQUFFLENBQUM7O0lBRUg7SUFDQXpDLGVBQWUsQ0FBQzBDLGNBQWMsQ0FBQ0MsSUFBSSxDQUFFQyxNQUFNLElBQUk7TUFDN0NoQixtQkFBbUIsQ0FBQ2lCLE1BQU0sR0FBRzdFLFdBQVcsQ0FBQzhFLE1BQU0sQ0FBRTdELG9CQUFvQixFQUFFO1FBQ3JFOEQsa0JBQWtCLEVBQUVIO01BQ3RCLENBQUUsQ0FBQztNQUNIWixxQkFBcUIsQ0FBQ2dCLE9BQU8sR0FBR0osTUFBTSxHQUFHLENBQUM7TUFDMUNmLDhCQUE4QixDQUFDbUIsT0FBTyxHQUFHSixNQUFNLEdBQUcsQ0FBQztJQUNyRCxDQUFFLENBQUM7O0lBRUg7SUFDQTVDLGVBQWUsQ0FBQ2lELHNCQUFzQixDQUFFQyxxQkFBcUIsSUFBSTtNQUMvRHJFLFlBQVksQ0FBQ3NFLG9CQUFvQixDQUFFRCxxQkFBc0IsQ0FBQztNQUMxREEscUJBQXFCLENBQUNFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUUsQ0FBQzs7SUFFSDtJQUNBLE1BQU1DLFFBQVEsR0FBRyxJQUFJaEYsSUFBSSxDQUFFO01BQ3pCNEMsUUFBUSxFQUFFLENBQUVmLFFBQVEsRUFBRWMsY0FBYyxFQUFFUyxhQUFhLEVBQUVNLGFBQWEsRUFBRUMscUJBQXFCLENBQUU7TUFDM0ZkLE9BQU8sRUFBRTtJQUNYLENBQUUsQ0FBQztJQUVIakIsZ0JBQWdCLENBQUNxRCxRQUFRLENBQUVELFFBQVMsQ0FBQztJQUVyQyxLQUFLLENBQUVwRCxnQkFBZ0IsRUFBRUwsT0FBUSxDQUFDO0VBQ3BDO0FBRUY7QUFFQWQsS0FBSyxDQUFDeUUsUUFBUSxDQUFFLDBDQUEwQyxFQUFFOUQsd0NBQXlDLENBQUM7QUFFdEcsZUFBZUEsd0NBQXdDIiwiaWdub3JlTGlzdCI6W119