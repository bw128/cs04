// Copyright 2021-2023, University of Colorado Boulder

/**
 * The panels that contain preferences controls. There is one panel for every tab, and it is shown when the
 * corresponding tab is selected.
 *
 * Once the dialog is created it is never destroyed so listeners do not need to be disposed.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import optionize from '../../../phet-core/js/optionize.js';
import { AlignGroup, Node } from '../../../scenery/js/imports.js';
import joist from '../joist.js';
import AudioPreferencesPanel from './AudioPreferencesPanel.js';
import SimulationPreferencesPanel from './SimulationPreferencesPanel.js';
import InputPreferencesPanel from './InputPreferencesPanel.js';
import VisualPreferencesPanel from './VisualPreferencesPanel.js';
import LocalizationPreferencesPanel from './LocalizationPreferencesPanel.js';
import PreferencesType from './PreferencesType.js';
import OverviewPreferencesPanel from './OverviewPreferencesPanel.js';
import Tandem from '../../../tandem/js/Tandem.js';
class PreferencesPanels extends Node {
  // Each Preferences Panel as a Node collected into this array for layout and other management.
  content = [];

  // Property controlling the selected tab, so we can control which panel should be visible.

  /**
   * @param preferencesModel
   * @param supportedTabs - list of Tabs supported by this Dialog
   * @param selectedTabProperty
   * @param preferencesTabs
   * @param [providedOptions]
   */
  constructor(preferencesModel, supportedTabs, selectedTabProperty, preferencesTabs, providedOptions) {
    const options = optionize()({
      phetioVisiblePropertyInstrumented: false,
      isDisposable: false
    }, providedOptions);
    const tandem = options.tandem;

    // Don't instrument the actual PreferencesPanels Node. Then if it doesn't have any children, it won't be in the Studio Tree)
    options.tandem = Tandem.OPT_OUT;
    super(options);
    this.selectedTabProperty = selectedTabProperty;
    const panelAlignGroup = new AlignGroup({
      matchVertical: false
    });
    let overviewPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.OVERVIEW)) {
      overviewPreferencesPanel = new OverviewPreferencesPanel(selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.OVERVIEW));
      const overviewBox = panelAlignGroup.createBox(overviewPreferencesPanel);
      this.addChild(overviewBox);
      this.content.push(new PreferencesPanelContainer(overviewPreferencesPanel, PreferencesType.OVERVIEW));
    }
    let simulationPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.SIMULATION)) {
      simulationPreferencesPanel = new SimulationPreferencesPanel(preferencesModel.simulationModel, selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.SIMULATION), {
        tandem: tandem.createTandem('simulationPreferencesPanel')
      });
      const simulationBox = panelAlignGroup.createBox(simulationPreferencesPanel);
      this.addChild(simulationBox);
      this.content.push(new PreferencesPanelContainer(simulationPreferencesPanel, PreferencesType.SIMULATION));
    }
    let visualPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.VISUAL)) {
      visualPreferencesPanel = new VisualPreferencesPanel(preferencesModel.visualModel, selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.VISUAL), {
        tandem: tandem.createTandem('visualPreferencesPanel')
      });
      const visualBox = panelAlignGroup.createBox(visualPreferencesPanel);
      this.addChild(visualBox);
      this.content.push(new PreferencesPanelContainer(visualPreferencesPanel, PreferencesType.VISUAL));
    }
    let audioPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.AUDIO)) {
      audioPreferencesPanel = new AudioPreferencesPanel(preferencesModel.audioModel, selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.AUDIO), {
        tandem: tandem.createTandem('audioPreferencesPanel')
      });
      const audioBox = panelAlignGroup.createBox(audioPreferencesPanel);
      this.addChild(audioBox);
      this.content.push(new PreferencesPanelContainer(audioPreferencesPanel, PreferencesType.AUDIO));
    }
    let inputPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.INPUT)) {
      inputPreferencesPanel = new InputPreferencesPanel(preferencesModel.inputModel, selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.INPUT), {
        tandem: tandem.createTandem('inputPreferencesPanel')
      });
      const inputBox = panelAlignGroup.createBox(inputPreferencesPanel);
      this.addChild(inputBox);
      this.content.push(new PreferencesPanelContainer(inputPreferencesPanel, PreferencesType.INPUT));
    }
    let localizationPreferencesPanel = null;
    if (supportedTabs.includes(PreferencesType.LOCALIZATION)) {
      localizationPreferencesPanel = new LocalizationPreferencesPanel(preferencesModel.localizationModel, selectedTabProperty, preferencesTabs.getTabVisibleProperty(PreferencesType.LOCALIZATION), {
        tandem: tandem.createTandem('localizationPreferencesPanel')
      });
      const localizationBox = panelAlignGroup.createBox(localizationPreferencesPanel);
      this.addChild(localizationBox);
      this.content.push(new PreferencesPanelContainer(localizationPreferencesPanel, PreferencesType.LOCALIZATION));
    }
  }

  /**
   * Returns the visible content panel Node for the selected PreferencesType.
   * NOTE: Loop shouldn't be necessary, create a map that goes from PreferencesType -> content.
   */
  getSelectedContent() {
    for (let i = 0; i < this.content.length; i++) {
      const currentContent = this.content[i];
      if (currentContent.selectedTabValue === this.selectedTabProperty.value) {
        return currentContent;
      }
    }
    assert && assert(false, 'should never not have a selected panel content.');
    return null;
  }

  /**
   * Focus the selected panel. The panel should not be focusable until this is requested, so it is set to be
   * focusable before the focus() call. When focus is removed from the panel, it should become non-focusable
   * again. That is handled in PreferencesPanelContainer class.
   */
  focusSelectedPanel() {
    const selectedContent = this.getSelectedContent();
    selectedContent.panelContent.focusable = true;
    selectedContent.panelContent.focus();
  }

  /**
   * @param node - the potential content for the selected panel that is focusable
   * @returns true if the provided node is the currently selected panel
   */
  isFocusableSelectedContent(node) {
    const selectedContent = this.getSelectedContent();
    return node === selectedContent.panelContent; // the panelContent is what is focused in focusSelectedPanel()
  }
}

/**
 * An inner class that manages the panelContent and its value. A listener as added to the panel so that
 * whenever focus is lost from the panel, it is removed from the traversal order.
 */
class PreferencesPanelContainer extends Node {
  constructor(panelContent, selectedTabValue) {
    super();
    this.panelContent = panelContent;
    this.selectedTabValue = selectedTabValue;
    panelContent.addInputListener({
      focusout: event => {
        panelContent.focusable = false;
      }
    });
  }
}
joist.register('PreferencesPanels', PreferencesPanels);
export default PreferencesPanels;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJBbGlnbkdyb3VwIiwiTm9kZSIsImpvaXN0IiwiQXVkaW9QcmVmZXJlbmNlc1BhbmVsIiwiU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwiLCJJbnB1dFByZWZlcmVuY2VzUGFuZWwiLCJWaXN1YWxQcmVmZXJlbmNlc1BhbmVsIiwiTG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbCIsIlByZWZlcmVuY2VzVHlwZSIsIk92ZXJ2aWV3UHJlZmVyZW5jZXNQYW5lbCIsIlRhbmRlbSIsIlByZWZlcmVuY2VzUGFuZWxzIiwiY29udGVudCIsImNvbnN0cnVjdG9yIiwicHJlZmVyZW5jZXNNb2RlbCIsInN1cHBvcnRlZFRhYnMiLCJzZWxlY3RlZFRhYlByb3BlcnR5IiwicHJlZmVyZW5jZXNUYWJzIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsImlzRGlzcG9zYWJsZSIsInRhbmRlbSIsIk9QVF9PVVQiLCJwYW5lbEFsaWduR3JvdXAiLCJtYXRjaFZlcnRpY2FsIiwib3ZlcnZpZXdQcmVmZXJlbmNlc1BhbmVsIiwiaW5jbHVkZXMiLCJPVkVSVklFVyIsImdldFRhYlZpc2libGVQcm9wZXJ0eSIsIm92ZXJ2aWV3Qm94IiwiY3JlYXRlQm94IiwiYWRkQ2hpbGQiLCJwdXNoIiwiUHJlZmVyZW5jZXNQYW5lbENvbnRhaW5lciIsInNpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsIiwiU0lNVUxBVElPTiIsInNpbXVsYXRpb25Nb2RlbCIsImNyZWF0ZVRhbmRlbSIsInNpbXVsYXRpb25Cb3giLCJ2aXN1YWxQcmVmZXJlbmNlc1BhbmVsIiwiVklTVUFMIiwidmlzdWFsTW9kZWwiLCJ2aXN1YWxCb3giLCJhdWRpb1ByZWZlcmVuY2VzUGFuZWwiLCJBVURJTyIsImF1ZGlvTW9kZWwiLCJhdWRpb0JveCIsImlucHV0UHJlZmVyZW5jZXNQYW5lbCIsIklOUFVUIiwiaW5wdXRNb2RlbCIsImlucHV0Qm94IiwibG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbCIsIkxPQ0FMSVpBVElPTiIsImxvY2FsaXphdGlvbk1vZGVsIiwibG9jYWxpemF0aW9uQm94IiwiZ2V0U2VsZWN0ZWRDb250ZW50IiwiaSIsImxlbmd0aCIsImN1cnJlbnRDb250ZW50Iiwic2VsZWN0ZWRUYWJWYWx1ZSIsInZhbHVlIiwiYXNzZXJ0IiwiZm9jdXNTZWxlY3RlZFBhbmVsIiwic2VsZWN0ZWRDb250ZW50IiwicGFuZWxDb250ZW50IiwiZm9jdXNhYmxlIiwiZm9jdXMiLCJpc0ZvY3VzYWJsZVNlbGVjdGVkQ29udGVudCIsIm5vZGUiLCJhZGRJbnB1dExpc3RlbmVyIiwiZm9jdXNvdXQiLCJldmVudCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUHJlZmVyZW5jZXNQYW5lbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIHBhbmVscyB0aGF0IGNvbnRhaW4gcHJlZmVyZW5jZXMgY29udHJvbHMuIFRoZXJlIGlzIG9uZSBwYW5lbCBmb3IgZXZlcnkgdGFiLCBhbmQgaXQgaXMgc2hvd24gd2hlbiB0aGVcclxuICogY29ycmVzcG9uZGluZyB0YWIgaXMgc2VsZWN0ZWQuXHJcbiAqXHJcbiAqIE9uY2UgdGhlIGRpYWxvZyBpcyBjcmVhdGVkIGl0IGlzIG5ldmVyIGRlc3Ryb3llZCBzbyBsaXN0ZW5lcnMgZG8gbm90IG5lZWQgdG8gYmUgZGlzcG9zZWQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgeyBBbGlnbkdyb3VwLCBOb2RlLCBOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBBdWRpb1ByZWZlcmVuY2VzUGFuZWwgZnJvbSAnLi9BdWRpb1ByZWZlcmVuY2VzUGFuZWwuanMnO1xyXG5pbXBvcnQgU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwgZnJvbSAnLi9TaW11bGF0aW9uUHJlZmVyZW5jZXNQYW5lbC5qcyc7XHJcbmltcG9ydCBJbnB1dFByZWZlcmVuY2VzUGFuZWwgZnJvbSAnLi9JbnB1dFByZWZlcmVuY2VzUGFuZWwuanMnO1xyXG5pbXBvcnQgVmlzdWFsUHJlZmVyZW5jZXNQYW5lbCBmcm9tICcuL1Zpc3VhbFByZWZlcmVuY2VzUGFuZWwuanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNNb2RlbCBmcm9tICcuL1ByZWZlcmVuY2VzTW9kZWwuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsIGZyb20gJy4vTG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc1R5cGUgZnJvbSAnLi9QcmVmZXJlbmNlc1R5cGUuanMnO1xyXG5pbXBvcnQgT3ZlcnZpZXdQcmVmZXJlbmNlc1BhbmVsIGZyb20gJy4vT3ZlcnZpZXdQcmVmZXJlbmNlc1BhbmVsLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzVGFicyBmcm9tICcuL1ByZWZlcmVuY2VzVGFicy5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxudHlwZSBQcmVmZXJlbmNlc1BhbmVsc09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zICYgUGlja1JlcXVpcmVkPE5vZGVPcHRpb25zLCAndGFuZGVtJz47XHJcblxyXG5jbGFzcyBQcmVmZXJlbmNlc1BhbmVscyBleHRlbmRzIE5vZGUge1xyXG5cclxuICAvLyBFYWNoIFByZWZlcmVuY2VzIFBhbmVsIGFzIGEgTm9kZSBjb2xsZWN0ZWQgaW50byB0aGlzIGFycmF5IGZvciBsYXlvdXQgYW5kIG90aGVyIG1hbmFnZW1lbnQuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb250ZW50OiBQcmVmZXJlbmNlc1BhbmVsQ29udGFpbmVyW10gPSBbXTtcclxuXHJcbiAgLy8gUHJvcGVydHkgY29udHJvbGxpbmcgdGhlIHNlbGVjdGVkIHRhYiwgc28gd2UgY2FuIGNvbnRyb2wgd2hpY2ggcGFuZWwgc2hvdWxkIGJlIHZpc2libGUuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZFRhYlByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxQcmVmZXJlbmNlc1R5cGU+O1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gcHJlZmVyZW5jZXNNb2RlbFxyXG4gICAqIEBwYXJhbSBzdXBwb3J0ZWRUYWJzIC0gbGlzdCBvZiBUYWJzIHN1cHBvcnRlZCBieSB0aGlzIERpYWxvZ1xyXG4gICAqIEBwYXJhbSBzZWxlY3RlZFRhYlByb3BlcnR5XHJcbiAgICogQHBhcmFtIHByZWZlcmVuY2VzVGFic1xyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJlZmVyZW5jZXNNb2RlbDogUHJlZmVyZW5jZXNNb2RlbCwgc3VwcG9ydGVkVGFiczogUHJlZmVyZW5jZXNUeXBlW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFRhYlByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxQcmVmZXJlbmNlc1R5cGU+LCBwcmVmZXJlbmNlc1RhYnM6IFByZWZlcmVuY2VzVGFicyxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IFByZWZlcmVuY2VzUGFuZWxzT3B0aW9ucyApIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UHJlZmVyZW5jZXNQYW5lbHNPcHRpb25zLCBTZWxmT3B0aW9ucywgTm9kZU9wdGlvbnM+KCkoIHtcclxuICAgICAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZSxcclxuICAgICAgaXNEaXNwb3NhYmxlOiBmYWxzZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgdGFuZGVtID0gb3B0aW9ucy50YW5kZW07XHJcblxyXG4gICAgLy8gRG9uJ3QgaW5zdHJ1bWVudCB0aGUgYWN0dWFsIFByZWZlcmVuY2VzUGFuZWxzIE5vZGUuIFRoZW4gaWYgaXQgZG9lc24ndCBoYXZlIGFueSBjaGlsZHJlbiwgaXQgd29uJ3QgYmUgaW4gdGhlIFN0dWRpbyBUcmVlKVxyXG4gICAgb3B0aW9ucy50YW5kZW0gPSBUYW5kZW0uT1BUX09VVDtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRUYWJQcm9wZXJ0eSA9IHNlbGVjdGVkVGFiUHJvcGVydHk7XHJcblxyXG4gICAgY29uc3QgcGFuZWxBbGlnbkdyb3VwID0gbmV3IEFsaWduR3JvdXAoIHtcclxuICAgICAgbWF0Y2hWZXJ0aWNhbDogZmFsc2VcclxuICAgIH0gKTtcclxuXHJcbiAgICBsZXQgb3ZlcnZpZXdQcmVmZXJlbmNlc1BhbmVsOiBOb2RlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIHN1cHBvcnRlZFRhYnMuaW5jbHVkZXMoIFByZWZlcmVuY2VzVHlwZS5PVkVSVklFVyApICkge1xyXG4gICAgICBvdmVydmlld1ByZWZlcmVuY2VzUGFuZWwgPSBuZXcgT3ZlcnZpZXdQcmVmZXJlbmNlc1BhbmVsKCBzZWxlY3RlZFRhYlByb3BlcnR5LCBwcmVmZXJlbmNlc1RhYnMuZ2V0VGFiVmlzaWJsZVByb3BlcnR5KCBQcmVmZXJlbmNlc1R5cGUuT1ZFUlZJRVcgKSApO1xyXG4gICAgICBjb25zdCBvdmVydmlld0JveCA9IHBhbmVsQWxpZ25Hcm91cC5jcmVhdGVCb3goIG92ZXJ2aWV3UHJlZmVyZW5jZXNQYW5lbCApO1xyXG4gICAgICB0aGlzLmFkZENoaWxkKCBvdmVydmlld0JveCApO1xyXG4gICAgICB0aGlzLmNvbnRlbnQucHVzaCggbmV3IFByZWZlcmVuY2VzUGFuZWxDb250YWluZXIoIG92ZXJ2aWV3UHJlZmVyZW5jZXNQYW5lbCwgUHJlZmVyZW5jZXNUeXBlLk9WRVJWSUVXICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWw6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIGlmICggc3VwcG9ydGVkVGFicy5pbmNsdWRlcyggUHJlZmVyZW5jZXNUeXBlLlNJTVVMQVRJT04gKSApIHtcclxuICAgICAgc2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwgPSBuZXcgU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwoXHJcbiAgICAgICAgcHJlZmVyZW5jZXNNb2RlbC5zaW11bGF0aW9uTW9kZWwsIHNlbGVjdGVkVGFiUHJvcGVydHksIHByZWZlcmVuY2VzVGFicy5nZXRUYWJWaXNpYmxlUHJvcGVydHkoIFByZWZlcmVuY2VzVHlwZS5TSU1VTEFUSU9OICksIHtcclxuICAgICAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3NpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsJyApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICBjb25zdCBzaW11bGF0aW9uQm94ID0gcGFuZWxBbGlnbkdyb3VwLmNyZWF0ZUJveCggc2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwgKTtcclxuICAgICAgdGhpcy5hZGRDaGlsZCggc2ltdWxhdGlvbkJveCApO1xyXG4gICAgICB0aGlzLmNvbnRlbnQucHVzaCggbmV3IFByZWZlcmVuY2VzUGFuZWxDb250YWluZXIoIHNpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsLCBQcmVmZXJlbmNlc1R5cGUuU0lNVUxBVElPTiApICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHZpc3VhbFByZWZlcmVuY2VzUGFuZWw6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIGlmICggc3VwcG9ydGVkVGFicy5pbmNsdWRlcyggUHJlZmVyZW5jZXNUeXBlLlZJU1VBTCApICkge1xyXG4gICAgICB2aXN1YWxQcmVmZXJlbmNlc1BhbmVsID0gbmV3IFZpc3VhbFByZWZlcmVuY2VzUGFuZWwoXHJcbiAgICAgICAgcHJlZmVyZW5jZXNNb2RlbC52aXN1YWxNb2RlbCxcclxuICAgICAgICBzZWxlY3RlZFRhYlByb3BlcnR5LFxyXG4gICAgICAgIHByZWZlcmVuY2VzVGFicy5nZXRUYWJWaXNpYmxlUHJvcGVydHkoIFByZWZlcmVuY2VzVHlwZS5WSVNVQUwgKSwge1xyXG4gICAgICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAndmlzdWFsUHJlZmVyZW5jZXNQYW5lbCcgKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgY29uc3QgdmlzdWFsQm94ID0gcGFuZWxBbGlnbkdyb3VwLmNyZWF0ZUJveCggdmlzdWFsUHJlZmVyZW5jZXNQYW5lbCApO1xyXG4gICAgICB0aGlzLmFkZENoaWxkKCB2aXN1YWxCb3ggKTtcclxuICAgICAgdGhpcy5jb250ZW50LnB1c2goIG5ldyBQcmVmZXJlbmNlc1BhbmVsQ29udGFpbmVyKCB2aXN1YWxQcmVmZXJlbmNlc1BhbmVsLCBQcmVmZXJlbmNlc1R5cGUuVklTVUFMICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgYXVkaW9QcmVmZXJlbmNlc1BhbmVsOiBOb2RlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIHN1cHBvcnRlZFRhYnMuaW5jbHVkZXMoIFByZWZlcmVuY2VzVHlwZS5BVURJTyApICkge1xyXG4gICAgICBhdWRpb1ByZWZlcmVuY2VzUGFuZWwgPSBuZXcgQXVkaW9QcmVmZXJlbmNlc1BhbmVsKFxyXG4gICAgICAgIHByZWZlcmVuY2VzTW9kZWwuYXVkaW9Nb2RlbCxcclxuICAgICAgICBzZWxlY3RlZFRhYlByb3BlcnR5LFxyXG4gICAgICAgIHByZWZlcmVuY2VzVGFicy5nZXRUYWJWaXNpYmxlUHJvcGVydHkoIFByZWZlcmVuY2VzVHlwZS5BVURJTyApLCB7XHJcbiAgICAgICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdhdWRpb1ByZWZlcmVuY2VzUGFuZWwnIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIGNvbnN0IGF1ZGlvQm94ID0gcGFuZWxBbGlnbkdyb3VwLmNyZWF0ZUJveCggYXVkaW9QcmVmZXJlbmNlc1BhbmVsICk7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIGF1ZGlvQm94ICk7XHJcbiAgICAgIHRoaXMuY29udGVudC5wdXNoKCBuZXcgUHJlZmVyZW5jZXNQYW5lbENvbnRhaW5lciggYXVkaW9QcmVmZXJlbmNlc1BhbmVsLCBQcmVmZXJlbmNlc1R5cGUuQVVESU8gKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbnB1dFByZWZlcmVuY2VzUGFuZWw6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIGlmICggc3VwcG9ydGVkVGFicy5pbmNsdWRlcyggUHJlZmVyZW5jZXNUeXBlLklOUFVUICkgKSB7XHJcbiAgICAgIGlucHV0UHJlZmVyZW5jZXNQYW5lbCA9IG5ldyBJbnB1dFByZWZlcmVuY2VzUGFuZWwoXHJcbiAgICAgICAgcHJlZmVyZW5jZXNNb2RlbC5pbnB1dE1vZGVsLFxyXG4gICAgICAgIHNlbGVjdGVkVGFiUHJvcGVydHksXHJcbiAgICAgICAgcHJlZmVyZW5jZXNUYWJzLmdldFRhYlZpc2libGVQcm9wZXJ0eSggUHJlZmVyZW5jZXNUeXBlLklOUFVUICksIHtcclxuICAgICAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2lucHV0UHJlZmVyZW5jZXNQYW5lbCcgKVxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgICAgY29uc3QgaW5wdXRCb3ggPSBwYW5lbEFsaWduR3JvdXAuY3JlYXRlQm94KCBpbnB1dFByZWZlcmVuY2VzUGFuZWwgKTtcclxuICAgICAgdGhpcy5hZGRDaGlsZCggaW5wdXRCb3ggKTtcclxuICAgICAgdGhpcy5jb250ZW50LnB1c2goIG5ldyBQcmVmZXJlbmNlc1BhbmVsQ29udGFpbmVyKCBpbnB1dFByZWZlcmVuY2VzUGFuZWwsIFByZWZlcmVuY2VzVHlwZS5JTlBVVCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGxvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWw6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIGlmICggc3VwcG9ydGVkVGFicy5pbmNsdWRlcyggUHJlZmVyZW5jZXNUeXBlLkxPQ0FMSVpBVElPTiApICkge1xyXG4gICAgICBsb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsID0gbmV3IExvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWwoXHJcbiAgICAgICAgcHJlZmVyZW5jZXNNb2RlbC5sb2NhbGl6YXRpb25Nb2RlbCxcclxuICAgICAgICBzZWxlY3RlZFRhYlByb3BlcnR5LFxyXG4gICAgICAgIHByZWZlcmVuY2VzVGFicy5nZXRUYWJWaXNpYmxlUHJvcGVydHkoIFByZWZlcmVuY2VzVHlwZS5MT0NBTElaQVRJT04gKSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdsb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsJyApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICBjb25zdCBsb2NhbGl6YXRpb25Cb3ggPSBwYW5lbEFsaWduR3JvdXAuY3JlYXRlQm94KCBsb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsICk7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIGxvY2FsaXphdGlvbkJveCApO1xyXG4gICAgICB0aGlzLmNvbnRlbnQucHVzaCggbmV3IFByZWZlcmVuY2VzUGFuZWxDb250YWluZXIoIGxvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWwsIFByZWZlcmVuY2VzVHlwZS5MT0NBTElaQVRJT04gKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdmlzaWJsZSBjb250ZW50IHBhbmVsIE5vZGUgZm9yIHRoZSBzZWxlY3RlZCBQcmVmZXJlbmNlc1R5cGUuXHJcbiAgICogTk9URTogTG9vcCBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5LCBjcmVhdGUgYSBtYXAgdGhhdCBnb2VzIGZyb20gUHJlZmVyZW5jZXNUeXBlIC0+IGNvbnRlbnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRTZWxlY3RlZENvbnRlbnQoKTogUHJlZmVyZW5jZXNQYW5lbENvbnRhaW5lciB8IG51bGwge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5jb250ZW50Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBjdXJyZW50Q29udGVudCA9IHRoaXMuY29udGVudFsgaSBdO1xyXG4gICAgICBpZiAoIGN1cnJlbnRDb250ZW50LnNlbGVjdGVkVGFiVmFsdWUgPT09IHRoaXMuc2VsZWN0ZWRUYWJQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICByZXR1cm4gY3VycmVudENvbnRlbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnc2hvdWxkIG5ldmVyIG5vdCBoYXZlIGEgc2VsZWN0ZWQgcGFuZWwgY29udGVudC4nICk7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvY3VzIHRoZSBzZWxlY3RlZCBwYW5lbC4gVGhlIHBhbmVsIHNob3VsZCBub3QgYmUgZm9jdXNhYmxlIHVudGlsIHRoaXMgaXMgcmVxdWVzdGVkLCBzbyBpdCBpcyBzZXQgdG8gYmVcclxuICAgKiBmb2N1c2FibGUgYmVmb3JlIHRoZSBmb2N1cygpIGNhbGwuIFdoZW4gZm9jdXMgaXMgcmVtb3ZlZCBmcm9tIHRoZSBwYW5lbCwgaXQgc2hvdWxkIGJlY29tZSBub24tZm9jdXNhYmxlXHJcbiAgICogYWdhaW4uIFRoYXQgaXMgaGFuZGxlZCBpbiBQcmVmZXJlbmNlc1BhbmVsQ29udGFpbmVyIGNsYXNzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb2N1c1NlbGVjdGVkUGFuZWwoKTogdm9pZCB7XHJcbiAgICBjb25zdCBzZWxlY3RlZENvbnRlbnQgPSB0aGlzLmdldFNlbGVjdGVkQ29udGVudCgpO1xyXG4gICAgc2VsZWN0ZWRDb250ZW50IS5wYW5lbENvbnRlbnQuZm9jdXNhYmxlID0gdHJ1ZTtcclxuICAgIHNlbGVjdGVkQ29udGVudCEucGFuZWxDb250ZW50LmZvY3VzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gbm9kZSAtIHRoZSBwb3RlbnRpYWwgY29udGVudCBmb3IgdGhlIHNlbGVjdGVkIHBhbmVsIHRoYXQgaXMgZm9jdXNhYmxlXHJcbiAgICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgcHJvdmlkZWQgbm9kZSBpcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHBhbmVsXHJcbiAgICovXHJcbiAgcHVibGljIGlzRm9jdXNhYmxlU2VsZWN0ZWRDb250ZW50KCBub2RlOiBOb2RlICk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRDb250ZW50ID0gdGhpcy5nZXRTZWxlY3RlZENvbnRlbnQoKTtcclxuICAgIHJldHVybiBub2RlID09PSBzZWxlY3RlZENvbnRlbnQhLnBhbmVsQ29udGVudDsgLy8gdGhlIHBhbmVsQ29udGVudCBpcyB3aGF0IGlzIGZvY3VzZWQgaW4gZm9jdXNTZWxlY3RlZFBhbmVsKClcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbiBpbm5lciBjbGFzcyB0aGF0IG1hbmFnZXMgdGhlIHBhbmVsQ29udGVudCBhbmQgaXRzIHZhbHVlLiBBIGxpc3RlbmVyIGFzIGFkZGVkIHRvIHRoZSBwYW5lbCBzbyB0aGF0XHJcbiAqIHdoZW5ldmVyIGZvY3VzIGlzIGxvc3QgZnJvbSB0aGUgcGFuZWwsIGl0IGlzIHJlbW92ZWQgZnJvbSB0aGUgdHJhdmVyc2FsIG9yZGVyLlxyXG4gKi9cclxuY2xhc3MgUHJlZmVyZW5jZXNQYW5lbENvbnRhaW5lciBleHRlbmRzIE5vZGUge1xyXG4gIHB1YmxpYyByZWFkb25seSBwYW5lbENvbnRlbnQ6IE5vZGU7XHJcbiAgcHVibGljIHJlYWRvbmx5IHNlbGVjdGVkVGFiVmFsdWU6IFByZWZlcmVuY2VzVHlwZTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwYW5lbENvbnRlbnQ6IE5vZGUsIHNlbGVjdGVkVGFiVmFsdWU6IFByZWZlcmVuY2VzVHlwZSApIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5wYW5lbENvbnRlbnQgPSBwYW5lbENvbnRlbnQ7XHJcbiAgICB0aGlzLnNlbGVjdGVkVGFiVmFsdWUgPSBzZWxlY3RlZFRhYlZhbHVlO1xyXG5cclxuICAgIHBhbmVsQ29udGVudC5hZGRJbnB1dExpc3RlbmVyKCB7XHJcbiAgICAgIGZvY3Vzb3V0OiBldmVudCA9PiB7XHJcbiAgICAgICAgcGFuZWxDb250ZW50LmZvY3VzYWJsZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1ByZWZlcmVuY2VzUGFuZWxzJywgUHJlZmVyZW5jZXNQYW5lbHMgKTtcclxuZXhwb3J0IGRlZmF1bHQgUHJlZmVyZW5jZXNQYW5lbHM7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBNEIsb0NBQW9DO0FBQ2hGLFNBQVNDLFVBQVUsRUFBRUMsSUFBSSxRQUFxQixnQ0FBZ0M7QUFDOUUsT0FBT0Ms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NUMsZUFBZSxDQUFDNkMsWUFBYSxDQUFFLENBQUM7SUFDbEg7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNVRyxrQkFBa0JBLENBQUEsRUFBcUM7SUFDN0QsS0FBTSxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsSUFBSSxDQUFDN0MsT0FBTyxDQUFDOEMsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztNQUM5QyxNQUFNRSxjQUFjLEdBQUcsSUFBSSxDQUFDL0MsT0FBTyxDQUFFNkMsQ0FBQyxDQUFFO01BQ3hDLElBQUtFLGNBQWMsQ0FBQ0MsZ0JBQWdCLEtBQUssSUFBSSxDQUFDNUMsbUJBQW1CLENBQUM2QyxLQUFLLEVBQUc7UUFDeEUsT0FBT0YsY0FBYztNQUN2QjtJQUNGO0lBQ0FHLE1BQU0sSUFBSUEsTUFBTSxDQUFFLEtBQUssRUFBRSxpREFBa0QsQ0FBQztJQUM1RSxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLGtCQUFrQkEsQ0FBQSxFQUFTO0lBQ2hDLE1BQU1DLGVBQWUsR0FBRyxJQUFJLENBQUNSLGtCQUFrQixDQUFDLENBQUM7SUFDakRRLGVBQWUsQ0FBRUMsWUFBWSxDQUFDQyxTQUFTLEdBQUcsSUFBSTtJQUM5Q0YsZUFBZSxDQUFFQyxZQUFZLENBQUNFLEtBQUssQ0FBQyxDQUFDO0VBQ3ZDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NDLDBCQUEwQkEsQ0FBRUMsSUFBVSxFQUFZO0lBQ3ZELE1BQU1MLGVBQWUsR0FBRyxJQUFJLENBQUNSLGtCQUFrQixDQUFDLENBQUM7SUFDakQsT0FBT2EsSUFBSSxLQUFLTCxlQUFlLENBQUVDLFlBQVksQ0FBQyxDQUFDO0VBQ2pEO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNL0IseUJBQXlCLFNBQVNqQyxJQUFJLENBQUM7RUFJcENZLFdBQVdBLENBQUVvRCxZQUFrQixFQUFFTCxnQkFBaUMsRUFBRztJQUMxRSxLQUFLLENBQUMsQ0FBQztJQUVQLElBQUksQ0FBQ0ssWUFBWSxHQUFHQSxZQUFZO0lBQ2hDLElBQUksQ0FBQ0wsZ0JBQWdCLEdBQUdBLGdCQUFnQjtJQUV4Q0ssWUFBWSxDQUFDSyxnQkFBZ0IsQ0FBRTtNQUM3QkMsUUFBUSxFQUFFQyxLQUFLLElBQUk7UUFDakJQLFlBQVksQ0FBQ0MsU0FBUyxHQUFHLEtBQUs7TUFDaEM7SUFDRixDQUFFLENBQUM7RUFDTDtBQUNGO0FBRUFoRSxLQUFLLENBQUN1RSxRQUFRLENBQUUsbUJBQW1CLEVBQUU5RCxpQkFBa0IsQ0FBQztBQUN4RCxlQUFlQSxpQkFBaUIiLCJpZ25vcmVMaXN0IjpbXX0=