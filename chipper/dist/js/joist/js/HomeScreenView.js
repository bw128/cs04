// Copyright 2013-2024, University of Colorado Boulder

/**
 * Shows the home screen for a multi-screen simulation, which lets the user see all of the screens and select one.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { AlignBox, HBox, Node, Text } from '../../scenery/js/imports.js';
import soundManager from '../../tambo/js/soundManager.js';
import HomeScreenButton from './HomeScreenButton.js';
import HomeScreenSoundGenerator from './HomeScreenSoundGenerator.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import ScreenView from './ScreenView.js';
import optionize from '../../phet-core/js/optionize.js';
import PatternStringProperty from '../../axon/js/PatternStringProperty.js';
import Tandem from '../../tandem/js/Tandem.js';
class HomeScreenView extends ScreenView {
  // NOTE: In https://github.com/phetsims/joist/issues/640, we attempted to use ScreenView.DEFAULT_LAYOUT_BOUNDS here.
  // Lots of problems were encountered, since both the Home screen and navigation bar are dependent on this value.
  // If/when joist is cleaned up, this should be ScreenView.DEFAULT_LAYOUT_BOUNDS.
  static LAYOUT_BOUNDS = new Bounds2(0, 0, 768, 504);

  // iPad doesn't support Century Gothic, so fall back to Futura, see http://wordpress.org/support/topic/font-not-working-on-ipad-browser
  static TITLE_FONT_FAMILY = 'Century Gothic, Futura';

  /**
   * @param simNameProperty - the internationalized text for the sim name
   * @param model
   * @param [providedOptions]
   */
  constructor(simNameProperty, model, providedOptions) {
    const options = optionize()({
      layoutBounds: HomeScreenView.LAYOUT_BOUNDS,
      warningNode: null,
      // Remove the "normal" PDOM structure Nodes like the screen summary, play area, and control area Nodes from the
      // HomeScreen. The HomeScreen handles its own description.
      includePDOMNodes: false
    }, providedOptions);
    super(options);
    const homeScreenPDOMNode = new Node({
      tagName: 'p'
    });
    this.addChild(homeScreenPDOMNode);
    this.selectedScreenProperty = model.selectedScreenProperty;
    const titleText = new Text(simNameProperty, {
      font: new PhetFont({
        size: 52,
        family: HomeScreenView.TITLE_FONT_FAMILY
      }),
      fill: 'white',
      y: 130,
      maxWidth: this.layoutBounds.width - 10
    });

    // Have this before adding the child to support the startup layout. Use `localBoundsProperty` to avoid an infinite loop.
    titleText.localBoundsProperty.link(() => {
      titleText.centerX = this.layoutBounds.centerX;
    });
    this.addChild(titleText);
    const buttonGroupTandem = options.tandem.createTandem('buttonGroup');
    this.screenButtons = _.map(model.simScreens, screen => {
      assert && assert(screen.nameProperty.value, `name is required for screen ${model.simScreens.indexOf(screen)}`);
      assert && assert(screen.homeScreenIcon, `homeScreenIcon is required for screen ${screen.nameProperty.value}`);
      const homeScreenButton = new HomeScreenButton(screen, model, {
        showUnselectedHomeScreenIconFrame: screen.showUnselectedHomeScreenIconFrame,
        // pdom
        descriptionContent: screen.descriptionContent,
        // voicing
        voicingHintResponse: screen.descriptionContent,
        // phet-io
        tandem: screen.tandem.supplied ? buttonGroupTandem.createTandem(`${screen.tandem.name}Button`) : Tandem.REQUIRED
      });
      homeScreenButton.voicingNameResponse = screen.pdomDisplayNameProperty;
      homeScreenButton.innerContent = screen.pdomDisplayNameProperty;
      return homeScreenButton;
    });

    // Space the icons out more if there are fewer, so they will be spaced nicely.
    // Cannot have only 1 screen because for 1-screen sims there is no home screen.
    let spacing = 60;
    if (model.simScreens.length === 4) {
      spacing = 33;
    }
    if (model.simScreens.length >= 5) {
      spacing = 20;
    }
    this.homeScreenScreenSummaryIntroProperty = new PatternStringProperty(JoistStrings.a11y.homeScreenDescriptionPatternStringProperty, {
      name: simNameProperty,
      screens: model.simScreens.length
    }, {
      tandem: Tandem.OPT_OUT
    });

    // Add the home screen description, since there are no PDOM container Nodes for this ScreenView
    homeScreenPDOMNode.innerContent = new PatternStringProperty(JoistStrings.a11y.homeScreenIntroPatternStringProperty, {
      description: this.homeScreenScreenSummaryIntroProperty,
      hint: JoistStrings.a11y.homeScreenHintStringProperty
    }, {
      tandem: Tandem.OPT_OUT
    });
    this.screenButtons.forEach(screenButton => {
      screenButton.voicingContextResponse = simNameProperty;
    });
    const buttonBox = new HBox({
      spacing: spacing,
      align: 'top',
      maxWidth: this.layoutBounds.width - 118,
      // pdom
      tagName: 'ol'
    });
    model.activeSimScreensProperty.link(simScreens => {
      buttonBox.children = simScreens.map(screen => _.find(this.screenButtons, screenButton => screenButton.screen === screen));
    });
    this.addChild(new AlignBox(buttonBox, {
      alignBounds: this.layoutBounds,
      yAlign: 'top',
      topMargin: this.layoutBounds.height / 3 + 20
    }));

    // Add sound generation for screen selection.  This generates sound for all changes between screens, not just for the
    // home screen.
    soundManager.addSoundGenerator(new HomeScreenSoundGenerator(model, {
      initialOutputLevel: 0.5
    }), {
      categoryName: 'user-interface'
    });
    if (options.warningNode) {
      const warningNode = options.warningNode;
      this.addChild(warningNode);
      warningNode.centerX = this.layoutBounds.centerX;
      warningNode.bottom = this.layoutBounds.maxY - 2;
    }
  }

  /**
   * For a11y, highlight the currently selected screen button
   */
  focusHighlightedScreenButton() {
    for (let i = 0; i < this.screenButtons.length; i++) {
      const screenButton = this.screenButtons[i];
      if (screenButton.screen === this.selectedScreenProperty.value) {
        screenButton.focus();
        break;
      }
    }
  }

  /**
   * To support voicing.
   */
  getVoicingOverviewContent() {
    return this.homeScreenScreenSummaryIntroProperty;
  }

  /**
   * To support voicing.
   */
  getVoicingDetailsContent() {
    let details = '';

    // Do this dynamically so that it supports changes that may occur to the pdomDisplayNameProperty
    this.screenButtons.forEach(screenButton => {
      if (details !== '') {
        details += ' ';
      }
      details += StringUtils.fillIn(JoistStrings.a11y.homeScreenButtonDetailsPatternStringProperty, {
        name: screenButton.screen.pdomDisplayNameProperty.value,
        screenHint: screenButton.screen.descriptionContent
      });
    });
    return details;
  }

  /**
   * To support voicing.
   */
  getVoicingHintContent() {
    return JoistStrings.a11y.homeScreenHintStringProperty;
  }
}
joist.register('HomeScreenView', HomeScreenView);
export default HomeScreenView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiU3RyaW5nVXRpbHMiLCJQaGV0Rm9udCIsIkFsaWduQm94IiwiSEJveCIsIk5vZGUiLCJUZXh0Iiwic291bmRNYW5hZ2VyIiwiSG9tZVNjcmVlbkJ1dHRvbiIsIkhvbWVTY3JlZW5Tb3VuZEdlbmVyYXRvciIsImpvaXN0IiwiSm9pc3RTdHJpbmdzIiwiU2NyZWVuVmlldyIsIm9wdGlvbml6ZSIsIlBhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsIlRhbmRlbSIsIkhvbWVTY3JlZW5WaWV3IiwiTEFZT1VUX0JPVU5EUyIsIlRJVExFX0ZPTlRfRkFNSUxZIiwiY29uc3RydWN0b3IiLCJzaW1OYW1lUHJvcGVydHkiLCJtb2RlbCIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJsYXlvdXRCb3VuZHMiLCJ3YXJuaW5nTm9kZSIsImluY2x1ZGVQRE9NTm9kZXMiLCJob21lU2NyZWVuUERPTU5vZGUiLCJ0YWdOYW1lIiwiYWRkQ2hpbGQiLCJzZWxlY3RlZFNjcmVlblByb3BlcnR5IiwidGl0bGVUZXh0IiwiZm9udCIsInNpemUiLCJmYW1pbHkiLCJmaWxsIiwieSIsIm1heFdpZHRoIiwid2lkdGgiLCJsb2NhbEJvdW5kc1Byb3BlcnR5IiwibGluayIsImNlbnRlclgiLCJidXR0b25Hcm91cFRhbmRlbSIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsInNjcmVlbkJ1dHRvbnMiLCJfIiwibWFwIiwic2ltU2NyZWVucyIsInNjcmVlbiIsImFzc2VydCIsIm5hbWVQcm9wZXJ0eSIsInZhbHVlIiwiaW5kZXhPZiIsImhvbWVTY3JlZW5JY29uIiwiaG9tZVNjcmVlbkJ1dHRvbiIsInNob3dVbnNlbGVjdGVkSG9tZVNjcmVlbkljb25GcmFtZSIsImRlc2NyaXB0aW9uQ29udGVudCIsInZvaWNpbmdIaW50UmVzcG9uc2UiLCJzdXBwbGllZCIsIm5hbWUiLCJSRVFVSVJFRCIsInZvaWNpbmdOYW1lUmVzcG9uc2UiLCJwZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSIsImlubmVyQ29udGVudCIsInNwYWNpbmciLCJsZW5ndGgiLCJob21lU2NyZWVuU2NyZWVuU3VtbWFyeUludHJvUHJvcGVydHkiLCJhMTF5IiwiaG9tZVNjcmVlbkRlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5Iiwic2NyZWVucyIsIk9QVF9PVVQiLCJob21lU2NyZWVuSW50cm9QYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJkZXNjcmlwdGlvbiIsImhpbnQiLCJob21lU2NyZWVuSGludFN0cmluZ1Byb3BlcnR5IiwiZm9yRWFjaCIsInNjcmVlbkJ1dHRvbiIsInZvaWNpbmdDb250ZXh0UmVzcG9uc2UiLCJidXR0b25Cb3giLCJhbGlnbiIsImFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eSIsImNoaWxkcmVuIiwiZmluZCIsImFsaWduQm91bmRzIiwieUFsaWduIiwidG9wTWFyZ2luIiwiaGVpZ2h0IiwiYWRkU291bmRHZW5lcmF0b3IiLCJpbml0aWFsT3V0cHV0TGV2ZWwiLCJjYXRlZ29yeU5hbWUiLCJib3R0b20iLCJtYXhZIiwiZm9jdXNIaWdobGlnaHRlZFNjcmVlbkJ1dHRvbiIsImkiLCJmb2N1cyIsImdldFZvaWNpbmdPdmVydmlld0NvbnRlbnQiLCJnZXRWb2ljaW5nRGV0YWlsc0NvbnRlbnQiLCJkZXRhaWxzIiwiZmlsbEluIiwiaG9tZVNjcmVlbkJ1dHRvbkRldGFpbHNQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJzY3JlZW5IaW50IiwiZ2V0Vm9pY2luZ0hpbnRDb250ZW50IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJIb21lU2NyZWVuVmlldy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTaG93cyB0aGUgaG9tZSBzY3JlZW4gZm9yIGEgbXVsdGktc2NyZWVuIHNpbXVsYXRpb24sIHdoaWNoIGxldHMgdGhlIHVzZXIgc2VlIGFsbCBvZiB0aGUgc2NyZWVucyBhbmQgc2VsZWN0IG9uZS5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBTdHJpbmdVdGlscyBmcm9tICcuLi8uLi9waGV0Y29tbW9uL2pzL3V0aWwvU3RyaW5nVXRpbHMuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHsgQWxpZ25Cb3gsIEhCb3gsIE5vZGUsIFRleHQgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgc291bmRNYW5hZ2VyIGZyb20gJy4uLy4uL3RhbWJvL2pzL3NvdW5kTWFuYWdlci5qcyc7XHJcbmltcG9ydCBIb21lU2NyZWVuQnV0dG9uIGZyb20gJy4vSG9tZVNjcmVlbkJ1dHRvbi5qcyc7XHJcbmltcG9ydCBIb21lU2NyZWVuU291bmRHZW5lcmF0b3IgZnJvbSAnLi9Ib21lU2NyZWVuU291bmRHZW5lcmF0b3IuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBKb2lzdFN0cmluZ3MgZnJvbSAnLi9Kb2lzdFN0cmluZ3MuanMnO1xyXG5pbXBvcnQgU2NyZWVuVmlldywgeyBTY3JlZW5WaWV3T3B0aW9ucyB9IGZyb20gJy4vU2NyZWVuVmlldy5qcyc7XHJcbmltcG9ydCB7IEFueVNjcmVlbiB9IGZyb20gJy4vU2NyZWVuLmpzJztcclxuaW1wb3J0IEhvbWVTY3JlZW5Nb2RlbCBmcm9tICcuL0hvbWVTY3JlZW5Nb2RlbC5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUGlja1JlcXVpcmVkIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrUmVxdWlyZWQuanMnO1xyXG5pbXBvcnQgUGF0dGVyblN0cmluZ1Byb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUGF0dGVyblN0cmluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHRvIGRpc3BsYXkgYmVsb3cgdGhlIGljb25zIGFzIGEgd2FybmluZyBpZiBhdmFpbGFibGVcclxuICB3YXJuaW5nTm9kZT86IE5vZGUgfCBudWxsO1xyXG59O1xyXG5cclxudHlwZSBIb21lU2NyZWVuVmlld09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBpY2tSZXF1aXJlZDxTY3JlZW5WaWV3T3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5cclxuY2xhc3MgSG9tZVNjcmVlblZpZXcgZXh0ZW5kcyBTY3JlZW5WaWV3IHtcclxuXHJcbiAgcHJpdmF0ZSBob21lU2NyZWVuU2NyZWVuU3VtbWFyeUludHJvUHJvcGVydHkhOiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG4gIHByaXZhdGUgc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eTogUHJvcGVydHk8QW55U2NyZWVuPjtcclxuICBwdWJsaWMgc2NyZWVuQnV0dG9uczogSG9tZVNjcmVlbkJ1dHRvbltdO1xyXG5cclxuICAvLyBOT1RFOiBJbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzY0MCwgd2UgYXR0ZW1wdGVkIHRvIHVzZSBTY3JlZW5WaWV3LkRFRkFVTFRfTEFZT1VUX0JPVU5EUyBoZXJlLlxyXG4gIC8vIExvdHMgb2YgcHJvYmxlbXMgd2VyZSBlbmNvdW50ZXJlZCwgc2luY2UgYm90aCB0aGUgSG9tZSBzY3JlZW4gYW5kIG5hdmlnYXRpb24gYmFyIGFyZSBkZXBlbmRlbnQgb24gdGhpcyB2YWx1ZS5cclxuICAvLyBJZi93aGVuIGpvaXN0IGlzIGNsZWFuZWQgdXAsIHRoaXMgc2hvdWxkIGJlIFNjcmVlblZpZXcuREVGQVVMVF9MQVlPVVRfQk9VTkRTLlxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgTEFZT1VUX0JPVU5EUyA9IG5ldyBCb3VuZHMyKCAwLCAwLCA3NjgsIDUwNCApO1xyXG5cclxuICAvLyBpUGFkIGRvZXNuJ3Qgc3VwcG9ydCBDZW50dXJ5IEdvdGhpYywgc28gZmFsbCBiYWNrIHRvIEZ1dHVyYSwgc2VlIGh0dHA6Ly93b3JkcHJlc3Mub3JnL3N1cHBvcnQvdG9waWMvZm9udC1ub3Qtd29ya2luZy1vbi1pcGFkLWJyb3dzZXJcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRJVExFX0ZPTlRfRkFNSUxZID0gJ0NlbnR1cnkgR290aGljLCBGdXR1cmEnO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gc2ltTmFtZVByb3BlcnR5IC0gdGhlIGludGVybmF0aW9uYWxpemVkIHRleHQgZm9yIHRoZSBzaW0gbmFtZVxyXG4gICAqIEBwYXJhbSBtb2RlbFxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggc2ltTmFtZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+LCBtb2RlbDogSG9tZVNjcmVlbk1vZGVsLCBwcm92aWRlZE9wdGlvbnM/OiBIb21lU2NyZWVuVmlld09wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxIb21lU2NyZWVuVmlld09wdGlvbnMsIFNlbGZPcHRpb25zLCBTY3JlZW5WaWV3T3B0aW9ucz4oKSgge1xyXG4gICAgICBsYXlvdXRCb3VuZHM6IEhvbWVTY3JlZW5WaWV3LkxBWU9VVF9CT1VORFMsXHJcbiAgICAgIHdhcm5pbmdOb2RlOiBudWxsLFxyXG5cclxuICAgICAgLy8gUmVtb3ZlIHRoZSBcIm5vcm1hbFwiIFBET00gc3RydWN0dXJlIE5vZGVzIGxpa2UgdGhlIHNjcmVlbiBzdW1tYXJ5LCBwbGF5IGFyZWEsIGFuZCBjb250cm9sIGFyZWEgTm9kZXMgZnJvbSB0aGVcclxuICAgICAgLy8gSG9tZVNjcmVlbi4gVGhlIEhvbWVTY3JlZW4gaGFuZGxlcyBpdHMgb3duIGRlc2NyaXB0aW9uLlxyXG4gICAgICBpbmNsdWRlUERPTU5vZGVzOiBmYWxzZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBob21lU2NyZWVuUERPTU5vZGUgPSBuZXcgTm9kZSgge1xyXG4gICAgICB0YWdOYW1lOiAncCdcclxuICAgIH0gKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGhvbWVTY3JlZW5QRE9NTm9kZSApO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eSA9IG1vZGVsLnNlbGVjdGVkU2NyZWVuUHJvcGVydHk7XHJcblxyXG4gICAgY29uc3QgdGl0bGVUZXh0ID0gbmV3IFRleHQoIHNpbU5hbWVQcm9wZXJ0eSwge1xyXG4gICAgICBmb250OiBuZXcgUGhldEZvbnQoIHtcclxuICAgICAgICBzaXplOiA1MixcclxuICAgICAgICBmYW1pbHk6IEhvbWVTY3JlZW5WaWV3LlRJVExFX0ZPTlRfRkFNSUxZXHJcbiAgICAgIH0gKSxcclxuICAgICAgZmlsbDogJ3doaXRlJyxcclxuICAgICAgeTogMTMwLFxyXG4gICAgICBtYXhXaWR0aDogdGhpcy5sYXlvdXRCb3VuZHMud2lkdGggLSAxMFxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEhhdmUgdGhpcyBiZWZvcmUgYWRkaW5nIHRoZSBjaGlsZCB0byBzdXBwb3J0IHRoZSBzdGFydHVwIGxheW91dC4gVXNlIGBsb2NhbEJvdW5kc1Byb3BlcnR5YCB0byBhdm9pZCBhbiBpbmZpbml0ZSBsb29wLlxyXG4gICAgdGl0bGVUZXh0LmxvY2FsQm91bmRzUHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICB0aXRsZVRleHQuY2VudGVyWCA9IHRoaXMubGF5b3V0Qm91bmRzLmNlbnRlclg7XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aXRsZVRleHQgKTtcclxuXHJcbiAgICBjb25zdCBidXR0b25Hcm91cFRhbmRlbSA9IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2J1dHRvbkdyb3VwJyApO1xyXG5cclxuICAgIHRoaXMuc2NyZWVuQnV0dG9ucyA9IF8ubWFwKCBtb2RlbC5zaW1TY3JlZW5zLCAoIHNjcmVlbjogQW55U2NyZWVuICkgPT4ge1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc2NyZWVuLm5hbWVQcm9wZXJ0eS52YWx1ZSwgYG5hbWUgaXMgcmVxdWlyZWQgZm9yIHNjcmVlbiAke21vZGVsLnNpbVNjcmVlbnMuaW5kZXhPZiggc2NyZWVuICl9YCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzY3JlZW4uaG9tZVNjcmVlbkljb24sIGBob21lU2NyZWVuSWNvbiBpcyByZXF1aXJlZCBmb3Igc2NyZWVuICR7c2NyZWVuLm5hbWVQcm9wZXJ0eS52YWx1ZX1gICk7XHJcblxyXG4gICAgICBjb25zdCBob21lU2NyZWVuQnV0dG9uID0gbmV3IEhvbWVTY3JlZW5CdXR0b24oXHJcbiAgICAgICAgc2NyZWVuLFxyXG4gICAgICAgIG1vZGVsLCB7XHJcbiAgICAgICAgICBzaG93VW5zZWxlY3RlZEhvbWVTY3JlZW5JY29uRnJhbWU6IHNjcmVlbi5zaG93VW5zZWxlY3RlZEhvbWVTY3JlZW5JY29uRnJhbWUsXHJcblxyXG4gICAgICAgICAgLy8gcGRvbVxyXG4gICAgICAgICAgZGVzY3JpcHRpb25Db250ZW50OiBzY3JlZW4uZGVzY3JpcHRpb25Db250ZW50LFxyXG5cclxuICAgICAgICAgIC8vIHZvaWNpbmdcclxuICAgICAgICAgIHZvaWNpbmdIaW50UmVzcG9uc2U6IHNjcmVlbi5kZXNjcmlwdGlvbkNvbnRlbnQsXHJcblxyXG4gICAgICAgICAgLy8gcGhldC1pb1xyXG4gICAgICAgICAgdGFuZGVtOiBzY3JlZW4udGFuZGVtLnN1cHBsaWVkID8gYnV0dG9uR3JvdXBUYW5kZW0uY3JlYXRlVGFuZGVtKCBgJHtzY3JlZW4udGFuZGVtLm5hbWV9QnV0dG9uYCApIDogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgaG9tZVNjcmVlbkJ1dHRvbi52b2ljaW5nTmFtZVJlc3BvbnNlID0gc2NyZWVuLnBkb21EaXNwbGF5TmFtZVByb3BlcnR5O1xyXG4gICAgICBob21lU2NyZWVuQnV0dG9uLmlubmVyQ29udGVudCA9IHNjcmVlbi5wZG9tRGlzcGxheU5hbWVQcm9wZXJ0eTtcclxuXHJcbiAgICAgIHJldHVybiBob21lU2NyZWVuQnV0dG9uO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFNwYWNlIHRoZSBpY29ucyBvdXQgbW9yZSBpZiB0aGVyZSBhcmUgZmV3ZXIsIHNvIHRoZXkgd2lsbCBiZSBzcGFjZWQgbmljZWx5LlxyXG4gICAgLy8gQ2Fubm90IGhhdmUgb25seSAxIHNjcmVlbiBiZWNhdXNlIGZvciAxLXNjcmVlbiBzaW1zIHRoZXJlIGlzIG5vIGhvbWUgc2NyZWVuLlxyXG4gICAgbGV0IHNwYWNpbmcgPSA2MDtcclxuICAgIGlmICggbW9kZWwuc2ltU2NyZWVucy5sZW5ndGggPT09IDQgKSB7XHJcbiAgICAgIHNwYWNpbmcgPSAzMztcclxuICAgIH1cclxuICAgIGlmICggbW9kZWwuc2ltU2NyZWVucy5sZW5ndGggPj0gNSApIHtcclxuICAgICAgc3BhY2luZyA9IDIwO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaG9tZVNjcmVlblNjcmVlblN1bW1hcnlJbnRyb1Byb3BlcnR5ID0gbmV3IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSggSm9pc3RTdHJpbmdzLmExMXkuaG9tZVNjcmVlbkRlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgIG5hbWU6IHNpbU5hbWVQcm9wZXJ0eSxcclxuICAgICAgc2NyZWVuczogbW9kZWwuc2ltU2NyZWVucy5sZW5ndGhcclxuICAgIH0sIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcblxyXG5cclxuICAgIC8vIEFkZCB0aGUgaG9tZSBzY3JlZW4gZGVzY3JpcHRpb24sIHNpbmNlIHRoZXJlIGFyZSBubyBQRE9NIGNvbnRhaW5lciBOb2RlcyBmb3IgdGhpcyBTY3JlZW5WaWV3XHJcbiAgICBob21lU2NyZWVuUERPTU5vZGUuaW5uZXJDb250ZW50ID0gbmV3IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSggSm9pc3RTdHJpbmdzLmExMXkuaG9tZVNjcmVlbkludHJvUGF0dGVyblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB0aGlzLmhvbWVTY3JlZW5TY3JlZW5TdW1tYXJ5SW50cm9Qcm9wZXJ0eSxcclxuICAgICAgaGludDogSm9pc3RTdHJpbmdzLmExMXkuaG9tZVNjcmVlbkhpbnRTdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSwgeyB0YW5kZW06IFRhbmRlbS5PUFRfT1VUIH0gKTtcclxuXHJcbiAgICB0aGlzLnNjcmVlbkJ1dHRvbnMuZm9yRWFjaCggc2NyZWVuQnV0dG9uID0+IHtcclxuICAgICAgc2NyZWVuQnV0dG9uLnZvaWNpbmdDb250ZXh0UmVzcG9uc2UgPSBzaW1OYW1lUHJvcGVydHk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgYnV0dG9uQm94ID0gbmV3IEhCb3goIHtcclxuICAgICAgc3BhY2luZzogc3BhY2luZyxcclxuICAgICAgYWxpZ246ICd0b3AnLFxyXG4gICAgICBtYXhXaWR0aDogdGhpcy5sYXlvdXRCb3VuZHMud2lkdGggLSAxMTgsXHJcblxyXG4gICAgICAvLyBwZG9tXHJcbiAgICAgIHRhZ05hbWU6ICdvbCdcclxuICAgIH0gKTtcclxuICAgIG1vZGVsLmFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eS5saW5rKCBzaW1TY3JlZW5zID0+IHtcclxuICAgICAgYnV0dG9uQm94LmNoaWxkcmVuID0gc2ltU2NyZWVucy5tYXAoIHNjcmVlbiA9PiBfLmZpbmQoIHRoaXMuc2NyZWVuQnV0dG9ucywgc2NyZWVuQnV0dG9uID0+IHNjcmVlbkJ1dHRvbi5zY3JlZW4gPT09IHNjcmVlbiApISApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuYWRkQ2hpbGQoIG5ldyBBbGlnbkJveCggYnV0dG9uQm94LCB7XHJcbiAgICAgIGFsaWduQm91bmRzOiB0aGlzLmxheW91dEJvdW5kcyxcclxuICAgICAgeUFsaWduOiAndG9wJyxcclxuICAgICAgdG9wTWFyZ2luOiB0aGlzLmxheW91dEJvdW5kcy5oZWlnaHQgLyAzICsgMjBcclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8vIEFkZCBzb3VuZCBnZW5lcmF0aW9uIGZvciBzY3JlZW4gc2VsZWN0aW9uLiAgVGhpcyBnZW5lcmF0ZXMgc291bmQgZm9yIGFsbCBjaGFuZ2VzIGJldHdlZW4gc2NyZWVucywgbm90IGp1c3QgZm9yIHRoZVxyXG4gICAgLy8gaG9tZSBzY3JlZW4uXHJcbiAgICBzb3VuZE1hbmFnZXIuYWRkU291bmRHZW5lcmF0b3IoIG5ldyBIb21lU2NyZWVuU291bmRHZW5lcmF0b3IoIG1vZGVsLCB7IGluaXRpYWxPdXRwdXRMZXZlbDogMC41IH0gKSwge1xyXG4gICAgICBjYXRlZ29yeU5hbWU6ICd1c2VyLWludGVyZmFjZSdcclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMud2FybmluZ05vZGUgKSB7XHJcbiAgICAgIGNvbnN0IHdhcm5pbmdOb2RlID0gb3B0aW9ucy53YXJuaW5nTm9kZTtcclxuICAgICAgdGhpcy5hZGRDaGlsZCggd2FybmluZ05vZGUgKTtcclxuICAgICAgd2FybmluZ05vZGUuY2VudGVyWCA9IHRoaXMubGF5b3V0Qm91bmRzLmNlbnRlclg7XHJcbiAgICAgIHdhcm5pbmdOb2RlLmJvdHRvbSA9IHRoaXMubGF5b3V0Qm91bmRzLm1heFkgLSAyO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yIGExMXksIGhpZ2hsaWdodCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHNjcmVlbiBidXR0b25cclxuICAgKi9cclxuICBwdWJsaWMgZm9jdXNIaWdobGlnaHRlZFNjcmVlbkJ1dHRvbigpOiB2b2lkIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuc2NyZWVuQnV0dG9ucy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgc2NyZWVuQnV0dG9uID0gdGhpcy5zY3JlZW5CdXR0b25zWyBpIF07XHJcbiAgICAgIGlmICggc2NyZWVuQnV0dG9uLnNjcmVlbiA9PT0gdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIHNjcmVlbkJ1dHRvbi5mb2N1cygpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUbyBzdXBwb3J0IHZvaWNpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldFZvaWNpbmdPdmVydmlld0NvbnRlbnQoKTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gdGhpcy5ob21lU2NyZWVuU2NyZWVuU3VtbWFyeUludHJvUHJvcGVydHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUbyBzdXBwb3J0IHZvaWNpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldFZvaWNpbmdEZXRhaWxzQ29udGVudCgpOiBzdHJpbmcge1xyXG5cclxuICAgIGxldCBkZXRhaWxzID0gJyc7XHJcblxyXG4gICAgLy8gRG8gdGhpcyBkeW5hbWljYWxseSBzbyB0aGF0IGl0IHN1cHBvcnRzIGNoYW5nZXMgdGhhdCBtYXkgb2NjdXIgdG8gdGhlIHBkb21EaXNwbGF5TmFtZVByb3BlcnR5XHJcbiAgICB0aGlzLnNjcmVlbkJ1dHRvbnMuZm9yRWFjaCggc2NyZWVuQnV0dG9uID0+IHtcclxuICAgICAgaWYgKCBkZXRhaWxzICE9PSAnJyApIHtcclxuICAgICAgICBkZXRhaWxzICs9ICcgJztcclxuICAgICAgfVxyXG4gICAgICBkZXRhaWxzICs9IFN0cmluZ1V0aWxzLmZpbGxJbiggSm9pc3RTdHJpbmdzLmExMXkuaG9tZVNjcmVlbkJ1dHRvbkRldGFpbHNQYXR0ZXJuU3RyaW5nUHJvcGVydHksIHtcclxuICAgICAgICBuYW1lOiBzY3JlZW5CdXR0b24uc2NyZWVuLnBkb21EaXNwbGF5TmFtZVByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIHNjcmVlbkhpbnQ6IHNjcmVlbkJ1dHRvbi5zY3JlZW4uZGVzY3JpcHRpb25Db250ZW50XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICAgIHJldHVybiBkZXRhaWxzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG8gc3VwcG9ydCB2b2ljaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRWb2ljaW5nSGludENvbnRlbnQoKTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gSm9pc3RTdHJpbmdzLmExMXkuaG9tZVNjcmVlbkhpbnRTdHJpbmdQcm9wZXJ0eTtcclxuICB9XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnSG9tZVNjcmVlblZpZXcnLCBIb21lU2NyZWVuVmlldyApO1xyXG5leHBvcnQgZGVmYXVsdCBIb21lU2NyZWVuVmlldzsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLHlCQUF5QjtBQUM3QyxPQUFPQyxXQUFXLE1BQU0seUNBQXlDO0FBQ2pFLE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsU0FBU0MsUUFBUSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLDZCQUE2QjtB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