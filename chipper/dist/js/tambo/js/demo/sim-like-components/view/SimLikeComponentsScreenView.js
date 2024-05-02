// Copyright 2018-2024, University of Colorado Boulder

/**
 * view for a screen that demonstrates views and sounds for components that interact with the model in some way
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../../axon/js/DerivedProperty.js';
import Property from '../../../../../axon/js/Property.js';
import Dimension2 from '../../../../../dot/js/Dimension2.js';
import Range from '../../../../../dot/js/Range.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import ScreenView from '../../../../../joist/js/ScreenView.js';
import ModelViewTransform2 from '../../../../../phetcommon/js/view/ModelViewTransform2.js';
import ResetAllButton from '../../../../../scenery-phet/js/buttons/ResetAllButton.js';
import PhetFont from '../../../../../scenery-phet/js/PhetFont.js';
import { Path, Text } from '../../../../../scenery/js/imports.js';
import ABSwitch from '../../../../../sun/js/ABSwitch.js';
import NumberSpinner from '../../../../../sun/js/NumberSpinner.js';
import PitchedPopGenerator from '../../../sound-generators/PitchedPopGenerator.js';
import soundManager from '../../../soundManager.js';
import tambo from '../../../tambo.js';
import BallNode from './BallNode.js';
import Tandem from '../../../../../tandem/js/Tandem.js';

// constants
const MAX_BALLS = 8;
const FONT = new PhetFont(16);
class SimLikeComponentsScreenView extends ScreenView {
  constructor(model) {
    super({
      tandem: Tandem.OPT_OUT
    });

    // set up the model view transform
    const modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping(Vector2.ZERO, new Vector2(this.layoutBounds.width * 0.275, this.layoutBounds.height * 0.5), 2);

    // add the box where the balls bounce around
    const boxNode = new Path(modelViewTransform.modelToViewShape(model.boxOfBalls.box), {
      fill: 'white',
      stroke: 'black'
    });
    this.addChild(boxNode);

    // handle balls being added to or removed from the box
    model.boxOfBalls.balls.addItemAddedListener(addedBall => {
      // add a node that represents the ball
      const ballNode = new BallNode(addedBall, modelViewTransform);
      this.addChild(ballNode);

      // set up a listener to remove the nodes when the corresponding ball is removed from the model
      const removalListener = removedBall => {
        if (removedBall === addedBall) {
          this.removeChild(ballNode);
          ballNode.dispose();
          model.boxOfBalls.balls.removeItemRemovedListener(removalListener);
        }
      };
      model.boxOfBalls.balls.addItemRemovedListener(removalListener);
    });

    // generate sound when balls are added or removed
    const pitchedPopGenerator = new PitchedPopGenerator({
      enableControlProperties: [DerivedProperty.not(ResetAllButton.isResettingAllProperty)]
    });
    soundManager.addSoundGenerator(pitchedPopGenerator);
    model.boxOfBalls.balls.lengthProperty.lazyLink(numBalls => {
      pitchedPopGenerator.playPop(numBalls / MAX_BALLS);
    });

    // add a switch to turn ball motion on and off
    const ballsMovingSwitch = new ABSwitch(model.ballsMovingProperty, false, new Text('Paused', {
      font: FONT
    }), true, new Text('Running', {
      font: FONT
    }), {
      toggleSwitchOptions: {
        size: new Dimension2(60, 30)
      },
      centerX: boxNode.centerX,
      top: boxNode.bottom + 25
    });
    this.addChild(ballsMovingSwitch);

    // add a number spinner for adding and removing balls
    const ballCountSpinner = new NumberSpinner(model.numberOfBallsProperty, new Property(new Range(0, MAX_BALLS)), {
      numberDisplayOptions: {
        backgroundFill: '#cccccc',
        backgroundStroke: 'green',
        backgroundLineWidth: 3,
        align: 'center',
        xMargin: 20,
        yMargin: 3,
        textOptions: {
          font: new PhetFont(35)
        }
      },
      arrowsPosition: 'bothBottom',
      arrowButtonFill: 'lightblue',
      arrowButtonStroke: 'blue',
      arrowButtonLineWidth: 0.2,
      centerX: ballsMovingSwitch.centerX,
      top: ballsMovingSwitch.bottom + 25
    });
    this.addChild(ballCountSpinner);

    // add the reset all button
    const resetAllButton = new ResetAllButton({
      right: this.layoutBounds.maxX - 25,
      bottom: this.layoutBounds.maxY - 25,
      listener: () => {
        model.reset();
      }
    });
    this.addChild(resetAllButton);
  }
}
tambo.register('SimLikeComponentsScreenView', SimLikeComponentsScreenView);
export default SimLikeComponentsScreenView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJQcm9wZXJ0eSIsIkRpbWVuc2lvbjIiLCJSYW5nZSIsIlZlY3RvcjIiLCJTY3JlZW5WaWV3IiwiTW9kZWxWaWV3VHJhbnNmb3JtMiIsIlJlc2V0QWxsQnV0dG9uIiwiUGhldEZvbnQiLCJQYXRoIiwiVGV4dCIsIkFCU3dpdGNoIiwiTnVtYmVyU3Bpbm5lciIsIlBpdGNoZWRQb3BHZW5lcmF0b3IiLCJzb3VuZE1hbmFnZXIiLCJ0YW1ibyIsIkJhbGxOb2RlIiwiVGFuZGVtIiwiTUFYX0JBTExTIiwiRk9OVCIsIlNpbUxpa2VDb21wb25lbnRzU2NyZWVuVmlldyIsImNvbnN0cnVjdG9yIiwibW9kZWwiLCJ0YW5kZW0iLCJPUFRfT1VUIiwibW9kZWxWaWV3VHJhbnNmb3JtIiwiY3JlYXRlU2luZ2xlUG9pbnRTY2FsZUludmVydGVkWU1hcHBpbmciLCJaRVJPIiwibGF5b3V0Qm91bmRzIiwid2lkdGgiLCJoZWlnaHQiLCJib3hOb2RlIiwibW9kZWxUb1ZpZXdTaGFwZSIsImJveE9mQmFsbHMiLCJib3giLCJmaWxsIiwic3Ryb2tlIiwiYWRkQ2hpbGQiLCJiYWxscyIsImFkZEl0ZW1BZGRlZExpc3RlbmVyIiwiYWRkZWRCYWxsIiwiYmFsbE5vZGUiLCJyZW1vdmFsTGlzdGVuZXIiLCJyZW1vdmVkQmFsbCIsInJlbW92ZUNoaWxkIiwiZGlzcG9zZSIsInJlbW92ZUl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJhZGRJdGVtUmVtb3ZlZExpc3RlbmVyIiwicGl0Y2hlZFBvcEdlbmVyYXRvciIsImVuYWJsZUNvbnRyb2xQcm9wZXJ0aWVzIiwibm90IiwiaXNSZXNldHRpbmdBbGxQcm9wZXJ0eSIsImFkZFNvdW5kR2VuZXJhdG9yIiwibGVuZ3RoUHJvcGVydHkiLCJsYXp5TGluayIsIm51bUJhbGxzIiwicGxheVBvcCIsImJhbGxzTW92aW5nU3dpdGNoIiwiYmFsbHNNb3ZpbmdQcm9wZXJ0eSIsImZvbnQiLCJ0b2dnbGVTd2l0Y2hPcHRpb25zIiwic2l6ZSIsImNlbnRlclgiLCJ0b3AiLCJib3R0b20iLCJiYWxsQ291bnRTcGlubmVyIiwibnVtYmVyT2ZCYWxsc1Byb3BlcnR5IiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJiYWNrZ3JvdW5kRmlsbCIsImJhY2tncm91bmRTdHJva2UiLCJiYWNrZ3JvdW5kTGluZVdpZHRoIiwiYWxpZ24iLCJ4TWFyZ2luIiwieU1hcmdpbiIsInRleHRPcHRpb25zIiwiYXJyb3dzUG9zaXRpb24iLCJhcnJvd0J1dHRvbkZpbGwiLCJhcnJvd0J1dHRvblN0cm9rZSIsImFycm93QnV0dG9uTGluZVdpZHRoIiwicmVzZXRBbGxCdXR0b24iLCJyaWdodCIsIm1heFgiLCJtYXhZIiwibGlzdGVuZXIiLCJyZXNldCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU2ltTGlrZUNvbXBvbmVudHNTY3JlZW5WaWV3LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIHZpZXcgZm9yIGEgc2NyZWVuIHRoYXQgZGVtb25zdHJhdGVzIHZpZXdzIGFuZCBzb3VuZHMgZm9yIGNvbXBvbmVudHMgdGhhdCBpbnRlcmFjdCB3aXRoIHRoZSBtb2RlbCBpbiBzb21lIHdheVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEaW1lbnNpb24yIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9EaW1lbnNpb24yLmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IFNjcmVlblZpZXcgZnJvbSAnLi4vLi4vLi4vLi4vLi4vam9pc3QvanMvU2NyZWVuVmlldy5qcyc7XHJcbmltcG9ydCBNb2RlbFZpZXdUcmFuc2Zvcm0yIGZyb20gJy4uLy4uLy4uLy4uLy4uL3BoZXRjb21tb24vanMvdmlldy9Nb2RlbFZpZXdUcmFuc2Zvcm0yLmpzJztcclxuaW1wb3J0IFJlc2V0QWxsQnV0dG9uIGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9idXR0b25zL1Jlc2V0QWxsQnV0dG9uLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCB7IFBhdGgsIFRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQUJTd2l0Y2ggZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL0FCU3dpdGNoLmpzJztcclxuaW1wb3J0IE51bWJlclNwaW5uZXIgZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL051bWJlclNwaW5uZXIuanMnO1xyXG5pbXBvcnQgUGl0Y2hlZFBvcEdlbmVyYXRvciBmcm9tICcuLi8uLi8uLi9zb3VuZC1nZW5lcmF0b3JzL1BpdGNoZWRQb3BHZW5lcmF0b3IuanMnO1xyXG5pbXBvcnQgc291bmRNYW5hZ2VyIGZyb20gJy4uLy4uLy4uL3NvdW5kTWFuYWdlci5qcyc7XHJcbmltcG9ydCB0YW1ibyBmcm9tICcuLi8uLi8uLi90YW1iby5qcyc7XHJcbmltcG9ydCBCYWxsTm9kZSBmcm9tICcuL0JhbGxOb2RlLmpzJztcclxuaW1wb3J0IFNpbUxpa2VDb21wb25lbnRzTW9kZWwgZnJvbSAnLi4vbW9kZWwvU2ltTGlrZUNvbXBvbmVudHNNb2RlbC5qcyc7XHJcbmltcG9ydCBCYWxsIGZyb20gJy4uL21vZGVsL0JhbGwuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IE1BWF9CQUxMUyA9IDg7XHJcbmNvbnN0IEZPTlQgPSBuZXcgUGhldEZvbnQoIDE2ICk7XHJcblxyXG5jbGFzcyBTaW1MaWtlQ29tcG9uZW50c1NjcmVlblZpZXcgZXh0ZW5kcyBTY3JlZW5WaWV3IHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtb2RlbDogU2ltTGlrZUNvbXBvbmVudHNNb2RlbCApIHtcclxuXHJcbiAgICBzdXBlcigge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gc2V0IHVwIHRoZSBtb2RlbCB2aWV3IHRyYW5zZm9ybVxyXG4gICAgY29uc3QgbW9kZWxWaWV3VHJhbnNmb3JtID0gTW9kZWxWaWV3VHJhbnNmb3JtMi5jcmVhdGVTaW5nbGVQb2ludFNjYWxlSW52ZXJ0ZWRZTWFwcGluZyhcclxuICAgICAgVmVjdG9yMi5aRVJPLFxyXG4gICAgICBuZXcgVmVjdG9yMiggdGhpcy5sYXlvdXRCb3VuZHMud2lkdGggKiAwLjI3NSwgdGhpcy5sYXlvdXRCb3VuZHMuaGVpZ2h0ICogMC41ICksXHJcbiAgICAgIDJcclxuICAgICk7XHJcblxyXG4gICAgLy8gYWRkIHRoZSBib3ggd2hlcmUgdGhlIGJhbGxzIGJvdW5jZSBhcm91bmRcclxuICAgIGNvbnN0IGJveE5vZGUgPSBuZXcgUGF0aCggbW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3U2hhcGUoIG1vZGVsLmJveE9mQmFsbHMuYm94ICksIHtcclxuICAgICAgZmlsbDogJ3doaXRlJyxcclxuICAgICAgc3Ryb2tlOiAnYmxhY2snXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBib3hOb2RlICk7XHJcblxyXG4gICAgLy8gaGFuZGxlIGJhbGxzIGJlaW5nIGFkZGVkIHRvIG9yIHJlbW92ZWQgZnJvbSB0aGUgYm94XHJcbiAgICBtb2RlbC5ib3hPZkJhbGxzLmJhbGxzLmFkZEl0ZW1BZGRlZExpc3RlbmVyKCBhZGRlZEJhbGwgPT4ge1xyXG5cclxuICAgICAgLy8gYWRkIGEgbm9kZSB0aGF0IHJlcHJlc2VudHMgdGhlIGJhbGxcclxuICAgICAgY29uc3QgYmFsbE5vZGUgPSBuZXcgQmFsbE5vZGUoIGFkZGVkQmFsbCwgbW9kZWxWaWV3VHJhbnNmb3JtICk7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIGJhbGxOb2RlICk7XHJcblxyXG4gICAgICAvLyBzZXQgdXAgYSBsaXN0ZW5lciB0byByZW1vdmUgdGhlIG5vZGVzIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgYmFsbCBpcyByZW1vdmVkIGZyb20gdGhlIG1vZGVsXHJcbiAgICAgIGNvbnN0IHJlbW92YWxMaXN0ZW5lciA9ICggcmVtb3ZlZEJhbGw6IEJhbGwgKSA9PiB7XHJcbiAgICAgICAgaWYgKCByZW1vdmVkQmFsbCA9PT0gYWRkZWRCYWxsICkge1xyXG4gICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZCggYmFsbE5vZGUgKTtcclxuICAgICAgICAgIGJhbGxOb2RlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgIG1vZGVsLmJveE9mQmFsbHMuYmFsbHMucmVtb3ZlSXRlbVJlbW92ZWRMaXN0ZW5lciggcmVtb3ZhbExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBtb2RlbC5ib3hPZkJhbGxzLmJhbGxzLmFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIoIHJlbW92YWxMaXN0ZW5lciApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIHNvdW5kIHdoZW4gYmFsbHMgYXJlIGFkZGVkIG9yIHJlbW92ZWRcclxuICAgIGNvbnN0IHBpdGNoZWRQb3BHZW5lcmF0b3IgPSBuZXcgUGl0Y2hlZFBvcEdlbmVyYXRvcigge1xyXG4gICAgICBlbmFibGVDb250cm9sUHJvcGVydGllczogWyBEZXJpdmVkUHJvcGVydHkubm90KCBSZXNldEFsbEJ1dHRvbi5pc1Jlc2V0dGluZ0FsbFByb3BlcnR5ICkgXVxyXG4gICAgfSApO1xyXG4gICAgc291bmRNYW5hZ2VyLmFkZFNvdW5kR2VuZXJhdG9yKCBwaXRjaGVkUG9wR2VuZXJhdG9yICk7XHJcbiAgICBtb2RlbC5ib3hPZkJhbGxzLmJhbGxzLmxlbmd0aFByb3BlcnR5LmxhenlMaW5rKCBudW1CYWxscyA9PiB7XHJcbiAgICAgIHBpdGNoZWRQb3BHZW5lcmF0b3IucGxheVBvcCggbnVtQmFsbHMgLyBNQVhfQkFMTFMgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBhZGQgYSBzd2l0Y2ggdG8gdHVybiBiYWxsIG1vdGlvbiBvbiBhbmQgb2ZmXHJcbiAgICBjb25zdCBiYWxsc01vdmluZ1N3aXRjaCA9IG5ldyBBQlN3aXRjaChcclxuICAgICAgbW9kZWwuYmFsbHNNb3ZpbmdQcm9wZXJ0eSxcclxuICAgICAgZmFsc2UsXHJcbiAgICAgIG5ldyBUZXh0KCAnUGF1c2VkJywgeyBmb250OiBGT05UIH0gKSxcclxuICAgICAgdHJ1ZSxcclxuICAgICAgbmV3IFRleHQoICdSdW5uaW5nJywgeyBmb250OiBGT05UIH0gKSxcclxuICAgICAge1xyXG4gICAgICAgIHRvZ2dsZVN3aXRjaE9wdGlvbnM6IHsgc2l6ZTogbmV3IERpbWVuc2lvbjIoIDYwLCAzMCApIH0sXHJcbiAgICAgICAgY2VudGVyWDogYm94Tm9kZS5jZW50ZXJYLFxyXG4gICAgICAgIHRvcDogYm94Tm9kZS5ib3R0b20gKyAyNVxyXG4gICAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBiYWxsc01vdmluZ1N3aXRjaCApO1xyXG5cclxuICAgIC8vIGFkZCBhIG51bWJlciBzcGlubmVyIGZvciBhZGRpbmcgYW5kIHJlbW92aW5nIGJhbGxzXHJcbiAgICBjb25zdCBiYWxsQ291bnRTcGlubmVyID0gbmV3IE51bWJlclNwaW5uZXIoXHJcbiAgICAgIG1vZGVsLm51bWJlck9mQmFsbHNQcm9wZXJ0eSxcclxuICAgICAgbmV3IFByb3BlcnR5KCBuZXcgUmFuZ2UoIDAsIE1BWF9CQUxMUyApICksXHJcbiAgICAgIHtcclxuICAgICAgICBudW1iZXJEaXNwbGF5T3B0aW9uczoge1xyXG4gICAgICAgICAgYmFja2dyb3VuZEZpbGw6ICcjY2NjY2NjJyxcclxuICAgICAgICAgIGJhY2tncm91bmRTdHJva2U6ICdncmVlbicsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kTGluZVdpZHRoOiAzLFxyXG4gICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgeE1hcmdpbjogMjAsXHJcbiAgICAgICAgICB5TWFyZ2luOiAzLFxyXG4gICAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAzNSApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcnJvd3NQb3NpdGlvbjogJ2JvdGhCb3R0b20nLFxyXG4gICAgICAgIGFycm93QnV0dG9uRmlsbDogJ2xpZ2h0Ymx1ZScsXHJcbiAgICAgICAgYXJyb3dCdXR0b25TdHJva2U6ICdibHVlJyxcclxuICAgICAgICBhcnJvd0J1dHRvbkxpbmVXaWR0aDogMC4yLFxyXG4gICAgICAgIGNlbnRlclg6IGJhbGxzTW92aW5nU3dpdGNoLmNlbnRlclgsXHJcbiAgICAgICAgdG9wOiBiYWxsc01vdmluZ1N3aXRjaC5ib3R0b20gKyAyNVxyXG4gICAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBiYWxsQ291bnRTcGlubmVyICk7XHJcblxyXG4gICAgLy8gYWRkIHRoZSByZXNldCBhbGwgYnV0dG9uXHJcbiAgICBjb25zdCByZXNldEFsbEJ1dHRvbiA9IG5ldyBSZXNldEFsbEJ1dHRvbigge1xyXG4gICAgICByaWdodDogdGhpcy5sYXlvdXRCb3VuZHMubWF4WCAtIDI1LFxyXG4gICAgICBib3R0b206IHRoaXMubGF5b3V0Qm91bmRzLm1heFkgLSAyNSxcclxuICAgICAgbGlzdGVuZXI6ICgpID0+IHsgbW9kZWwucmVzZXQoKTsgfVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggcmVzZXRBbGxCdXR0b24gKTtcclxuICB9XHJcbn1cclxuXHJcbnRhbWJvLnJlZ2lzdGVyKCAnU2ltTGlrZUNvbXBvbmVudHNTY3JlZW5WaWV3JywgU2ltTGlrZUNvbXBvbmVudHNTY3JlZW5WaWV3ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTaW1MaWtlQ29tcG9uZW50c1NjcmVlblZpZXc7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSwyQ0FBMkM7QUFDdkUsT0FBT0MsUUFBUSxNQUFNLG9DQUFvQztBQUN6RCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLEtBQUssTUFBTSxnQ0FBZ0M7QUFDbEQsT0FBT0MsT0FBTyxNQUFNLGtDQUFrQztBQUN0RCxPQUFPQyxVQUFVLE1BQU0sdUNBQXVDO0FBQzlELE9BQU9DLG1CQUFtQixNQUFNLDBEQUEwRDtBQUMxRixPQUFPQyxjQUFjLE1BQU0sMERBQTBEO0FBQ3JGLE9BQU9DLFFBQVEsTUFBTSw0Q0FBNEM7QUFDakUsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLFFBQVEsc0NBQXNDO0FBQ2pFLE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsT0FBT0MsYUFBYSxNQUFNLHdDQUF3QztBQUNsRSxPQUFPQyxtQkFBbUIsTUFBTSxrREFBa0Q7QUFDbEYsT0FBT0MsWUFBWSxNQUFNLDBCQUEwQjtBQUNuRCxPQUFPQyxLQUFLLE1BQU0sbUJBQW1CO0FBQ3JDLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBR3BDLE9BQU9DLE1BQU0sTUFBTSxvQ0FBb0M7O0FBRXZEO0FBQ0EsTUFBTUMsU0FBUyxHQUFHLENBQUM7QUFDbkIsTUFBTUMsSUFBSSxHQUFHLElBQUlYLFFBQVEsQ0FBRSxFQUFHLENBQUM7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