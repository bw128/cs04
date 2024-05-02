// Copyright 2021-2024, University of Colorado Boulder

/**
 * The panel of the PreferencesDialog related to options related to user input.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import merge from '../../../phet-core/js/merge.js';
import StringUtils from '../../../phetcommon/js/util/StringUtils.js';
import { Node, Text, VBox, VoicingRichText } from '../../../scenery/js/imports.js';
import ToggleSwitch from '../../../sun/js/ToggleSwitch.js';
import joist from '../joist.js';
import JoistStrings from '../JoistStrings.js';
import PreferencesDialog from './PreferencesDialog.js';
import PreferencesPanel from './PreferencesPanel.js';
import PreferencesPanelSection from './PreferencesPanelSection.js';
import PreferencesControl from './PreferencesControl.js';
import PreferencesType from './PreferencesType.js';
import PreferencesDialogConstants from './PreferencesDialogConstants.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';

// constants
const gestureControlEnabledAlertStringProperty = JoistStrings.a11y.preferences.tabs.input.gestureControl.enabledAlertStringProperty;
const gestureControlDisabledAlertStringProperty = JoistStrings.a11y.preferences.tabs.input.gestureControl.disabledAlertStringProperty;
const labelledDescriptionPatternStringProperty = JoistStrings.a11y.preferences.tabs.labelledDescriptionPatternStringProperty;

// NOT translatable yet because this tab does not appear in any published simulation.
const inputTitleString = 'Input';
const gestureControlsString = 'Gesture Control';
const gestureControlsDescriptionString = 'Use touch with custom swipes and taps instead. No direct touch with gesture control enabled.';
class InputPreferencesPanel extends PreferencesPanel {
  constructor(inputModel, selectedTabProperty, tabVisibleProperty, providedOptions) {
    super(PreferencesType.INPUT, selectedTabProperty, tabVisibleProperty, {
      labelContent: inputTitleString
    });

    // children are filled in later depending on what is supported in the InputModel
    const contentVBox = new VBox({
      spacing: PreferencesDialog.CONTENT_SPACING,
      align: 'left'
    });
    this.addChild(contentVBox);
    if (inputModel.supportsGestureControl) {
      const gestureControlText = new Text(gestureControlsString, PreferencesDialog.PANEL_SECTION_LABEL_OPTIONS);
      const gestureControlDescriptionNode = new VoicingRichText(gestureControlsDescriptionString, merge({}, PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS, {
        lineWrap: 350,
        maxHeight: 100,
        readingBlockNameResponse: StringUtils.fillIn(labelledDescriptionPatternStringProperty, {
          label: gestureControlsString,
          description: gestureControlsDescriptionString
        })
      }));
      const gestureControlsEnabledSwitch = new ToggleSwitch(inputModel.gestureControlsEnabledProperty, false, true, combineOptions({
        a11yName: gestureControlsString,
        leftValueContextResponse: gestureControlDisabledAlertStringProperty,
        rightValueContextResponse: gestureControlEnabledAlertStringProperty
      }, PreferencesDialogConstants.TOGGLE_SWITCH_OPTIONS));
      const gestureControlsControl = new PreferencesControl({
        labelNode: gestureControlText,
        descriptionNode: gestureControlDescriptionNode,
        controlNode: gestureControlsEnabledSwitch
      });
      const gesturePanelSection = new PreferencesPanelSection({
        titleNode: gestureControlsControl,
        contentLeftMargin: 0
      });
      contentVBox.addChild(gesturePanelSection);
    }
    const contentNode = new VBox({
      spacing: PreferencesDialog.CONTENT_SPACING,
      align: 'left'
    });
    inputModel.customPreferences.forEach(customPreference => {
      const customContent = customPreference.createContent(providedOptions.tandem);
      contentNode.addChild(new Node({
        children: [customContent]
      }));
    });
    const customPanelSection = new PreferencesPanelSection({
      contentNode: contentNode,
      contentLeftMargin: 0
    });
    contentVBox.addChild(customPanelSection);
  }
}
joist.register('InputPreferencesPanel', InputPreferencesPanel);
export default InputPreferencesPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIlN0cmluZ1V0aWxzIiwiTm9kZSIsIlRleHQiLCJWQm94IiwiVm9pY2luZ1JpY2hUZXh0IiwiVG9nZ2xlU3dpdGNoIiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJQcmVmZXJlbmNlc0RpYWxvZyIsIlByZWZlcmVuY2VzUGFuZWwiLCJQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiIsIlByZWZlcmVuY2VzQ29udHJvbCIsIlByZWZlcmVuY2VzVHlwZSIsIlByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzIiwiY29tYmluZU9wdGlvbnMiLCJnZXN0dXJlQ29udHJvbEVuYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5IiwiYTExeSIsInByZWZlcmVuY2VzIiwidGFicyIsImlucHV0IiwiZ2VzdHVyZUNvbnRyb2wiLCJlbmFibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eSIsImdlc3R1cmVDb250cm9sRGlzYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5IiwiZGlzYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5IiwibGFiZWxsZWREZXNjcmlwdGlvblBhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsImlucHV0VGl0bGVTdHJpbmciLCJnZXN0dXJlQ29udHJvbHNTdHJpbmciLCJnZXN0dXJlQ29udHJvbHNEZXNjcmlwdGlvblN0cmluZyIsIklucHV0UHJlZmVyZW5jZXNQYW5lbCIsImNvbnN0cnVjdG9yIiwiaW5wdXRNb2RlbCIsInNlbGVjdGVkVGFiUHJvcGVydHkiLCJ0YWJWaXNpYmxlUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJJTlBVVCIsImxhYmVsQ29udGVudCIsImNvbnRlbnRWQm94Iiwic3BhY2luZyIsIkNPTlRFTlRfU1BBQ0lORyIsImFsaWduIiwiYWRkQ2hpbGQiLCJzdXBwb3J0c0dlc3R1cmVDb250cm9sIiwiZ2VzdHVyZUNvbnRyb2xUZXh0IiwiUEFORUxfU0VDVElPTl9MQUJFTF9PUFRJT05TIiwiZ2VzdHVyZUNvbnRyb2xEZXNjcmlwdGlvbk5vZGUiLCJQQU5FTF9TRUNUSU9OX0NPTlRFTlRfT1BUSU9OUyIsImxpbmVXcmFwIiwibWF4SGVpZ2h0IiwicmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlIiwiZmlsbEluIiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsImdlc3R1cmVDb250cm9sc0VuYWJsZWRTd2l0Y2giLCJnZXN0dXJlQ29udHJvbHNFbmFibGVkUHJvcGVydHkiLCJhMTF5TmFtZSIsImxlZnRWYWx1ZUNvbnRleHRSZXNwb25zZSIsInJpZ2h0VmFsdWVDb250ZXh0UmVzcG9uc2UiLCJUT0dHTEVfU1dJVENIX09QVElPTlMiLCJnZXN0dXJlQ29udHJvbHNDb250cm9sIiwibGFiZWxOb2RlIiwiZGVzY3JpcHRpb25Ob2RlIiwiY29udHJvbE5vZGUiLCJnZXN0dXJlUGFuZWxTZWN0aW9uIiwidGl0bGVOb2RlIiwiY29udGVudExlZnRNYXJnaW4iLCJjb250ZW50Tm9kZSIsImN1c3RvbVByZWZlcmVuY2VzIiwiZm9yRWFjaCIsImN1c3RvbVByZWZlcmVuY2UiLCJjdXN0b21Db250ZW50IiwiY3JlYXRlQ29udGVudCIsInRhbmRlbSIsImNoaWxkcmVuIiwiY3VzdG9tUGFuZWxTZWN0aW9uIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJJbnB1dFByZWZlcmVuY2VzUGFuZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIHBhbmVsIG9mIHRoZSBQcmVmZXJlbmNlc0RpYWxvZyByZWxhdGVkIHRvIG9wdGlvbnMgcmVsYXRlZCB0byB1c2VyIGlucHV0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgUGlja1JlcXVpcmVkIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrUmVxdWlyZWQuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IHsgTm9kZSwgVGV4dCwgVkJveCwgVm9pY2luZ1JpY2hUZXh0IH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRvZ2dsZVN3aXRjaCwgeyBUb2dnbGVTd2l0Y2hPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vc3VuL2pzL1RvZ2dsZVN3aXRjaC5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBKb2lzdFN0cmluZ3MgZnJvbSAnLi4vSm9pc3RTdHJpbmdzLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzRGlhbG9nIGZyb20gJy4vUHJlZmVyZW5jZXNEaWFsb2cuanMnO1xyXG5pbXBvcnQgeyBJbnB1dE1vZGVsIH0gZnJvbSAnLi9QcmVmZXJlbmNlc01vZGVsLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzUGFuZWwsIHsgUHJlZmVyZW5jZXNQYW5lbE9wdGlvbnMgfSBmcm9tICcuL1ByZWZlcmVuY2VzUGFuZWwuanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24gZnJvbSAnLi9QcmVmZXJlbmNlc1BhbmVsU2VjdGlvbi5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0NvbnRyb2wgZnJvbSAnLi9QcmVmZXJlbmNlc0NvbnRyb2wuanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNUeXBlIGZyb20gJy4vUHJlZmVyZW5jZXNUeXBlLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzIGZyb20gJy4vUHJlZmVyZW5jZXNEaWFsb2dDb25zdGFudHMuanMnO1xyXG5pbXBvcnQgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IGdlc3R1cmVDb250cm9sRW5hYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmlucHV0Lmdlc3R1cmVDb250cm9sLmVuYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBnZXN0dXJlQ29udHJvbERpc2FibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LnByZWZlcmVuY2VzLnRhYnMuaW5wdXQuZ2VzdHVyZUNvbnRyb2wuZGlzYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5ID0gSm9pc3RTdHJpbmdzLmExMXkucHJlZmVyZW5jZXMudGFicy5sYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5O1xyXG5cclxuLy8gTk9UIHRyYW5zbGF0YWJsZSB5ZXQgYmVjYXVzZSB0aGlzIHRhYiBkb2VzIG5vdCBhcHBlYXIgaW4gYW55IHB1Ymxpc2hlZCBzaW11bGF0aW9uLlxyXG5jb25zdCBpbnB1dFRpdGxlU3RyaW5nID0gJ0lucHV0JztcclxuY29uc3QgZ2VzdHVyZUNvbnRyb2xzU3RyaW5nID0gJ0dlc3R1cmUgQ29udHJvbCc7XHJcbmNvbnN0IGdlc3R1cmVDb250cm9sc0Rlc2NyaXB0aW9uU3RyaW5nID0gJ1VzZSB0b3VjaCB3aXRoIGN1c3RvbSBzd2lwZXMgYW5kIHRhcHMgaW5zdGVhZC4gTm8gZGlyZWN0IHRvdWNoIHdpdGggZ2VzdHVyZSBjb250cm9sIGVuYWJsZWQuJztcclxuXHJcbnR5cGUgSW5wdXRQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucyA9IFBpY2tSZXF1aXJlZDxQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5cclxuY2xhc3MgSW5wdXRQcmVmZXJlbmNlc1BhbmVsIGV4dGVuZHMgUHJlZmVyZW5jZXNQYW5lbCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggaW5wdXRNb2RlbDogSW5wdXRNb2RlbCwgc2VsZWN0ZWRUYWJQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8UHJlZmVyZW5jZXNUeXBlPiwgdGFiVmlzaWJsZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiwgcHJvdmlkZWRPcHRpb25zOiBJbnB1dFByZWZlcmVuY2VzUGFuZWxPcHRpb25zICkge1xyXG5cclxuICAgIHN1cGVyKCBQcmVmZXJlbmNlc1R5cGUuSU5QVVQsIHNlbGVjdGVkVGFiUHJvcGVydHksIHRhYlZpc2libGVQcm9wZXJ0eSwge1xyXG4gICAgICBsYWJlbENvbnRlbnQ6IGlucHV0VGl0bGVTdHJpbmdcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBjaGlsZHJlbiBhcmUgZmlsbGVkIGluIGxhdGVyIGRlcGVuZGluZyBvbiB3aGF0IGlzIHN1cHBvcnRlZCBpbiB0aGUgSW5wdXRNb2RlbFxyXG4gICAgY29uc3QgY29udGVudFZCb3ggPSBuZXcgVkJveCgge1xyXG4gICAgICBzcGFjaW5nOiBQcmVmZXJlbmNlc0RpYWxvZy5DT05URU5UX1NQQUNJTkcsXHJcbiAgICAgIGFsaWduOiAnbGVmdCdcclxuICAgIH0gKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGNvbnRlbnRWQm94ICk7XHJcblxyXG4gICAgaWYgKCBpbnB1dE1vZGVsLnN1cHBvcnRzR2VzdHVyZUNvbnRyb2wgKSB7XHJcblxyXG4gICAgICBjb25zdCBnZXN0dXJlQ29udHJvbFRleHQgPSBuZXcgVGV4dCggZ2VzdHVyZUNvbnRyb2xzU3RyaW5nLCBQcmVmZXJlbmNlc0RpYWxvZy5QQU5FTF9TRUNUSU9OX0xBQkVMX09QVElPTlMgKTtcclxuICAgICAgY29uc3QgZ2VzdHVyZUNvbnRyb2xEZXNjcmlwdGlvbk5vZGUgPSBuZXcgVm9pY2luZ1JpY2hUZXh0KCBnZXN0dXJlQ29udHJvbHNEZXNjcmlwdGlvblN0cmluZywgbWVyZ2UoIHt9LCBQcmVmZXJlbmNlc0RpYWxvZy5QQU5FTF9TRUNUSU9OX0NPTlRFTlRfT1BUSU9OUywge1xyXG4gICAgICAgIGxpbmVXcmFwOiAzNTAsXHJcbiAgICAgICAgbWF4SGVpZ2h0OiAxMDAsXHJcblxyXG4gICAgICAgIHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZTogU3RyaW5nVXRpbHMuZmlsbEluKCBsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgICAgICBsYWJlbDogZ2VzdHVyZUNvbnRyb2xzU3RyaW5nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGdlc3R1cmVDb250cm9sc0Rlc2NyaXB0aW9uU3RyaW5nXHJcbiAgICAgICAgfSApXHJcbiAgICAgIH0gKSApO1xyXG4gICAgICBjb25zdCBnZXN0dXJlQ29udHJvbHNFbmFibGVkU3dpdGNoID0gbmV3IFRvZ2dsZVN3aXRjaCggaW5wdXRNb2RlbC5nZXN0dXJlQ29udHJvbHNFbmFibGVkUHJvcGVydHksIGZhbHNlLCB0cnVlLCBjb21iaW5lT3B0aW9uczxUb2dnbGVTd2l0Y2hPcHRpb25zPigge1xyXG4gICAgICAgIGExMXlOYW1lOiBnZXN0dXJlQ29udHJvbHNTdHJpbmcsXHJcbiAgICAgICAgbGVmdFZhbHVlQ29udGV4dFJlc3BvbnNlOiBnZXN0dXJlQ29udHJvbERpc2FibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICByaWdodFZhbHVlQ29udGV4dFJlc3BvbnNlOiBnZXN0dXJlQ29udHJvbEVuYWJsZWRBbGVydFN0cmluZ1Byb3BlcnR5XHJcbiAgICAgIH0sIFByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLlRPR0dMRV9TV0lUQ0hfT1BUSU9OUyApICk7XHJcbiAgICAgIGNvbnN0IGdlc3R1cmVDb250cm9sc0NvbnRyb2wgPSBuZXcgUHJlZmVyZW5jZXNDb250cm9sKCB7XHJcbiAgICAgICAgbGFiZWxOb2RlOiBnZXN0dXJlQ29udHJvbFRleHQsXHJcbiAgICAgICAgZGVzY3JpcHRpb25Ob2RlOiBnZXN0dXJlQ29udHJvbERlc2NyaXB0aW9uTm9kZSxcclxuICAgICAgICBjb250cm9sTm9kZTogZ2VzdHVyZUNvbnRyb2xzRW5hYmxlZFN3aXRjaFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zdCBnZXN0dXJlUGFuZWxTZWN0aW9uID0gbmV3IFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uKCB7XHJcbiAgICAgICAgdGl0bGVOb2RlOiBnZXN0dXJlQ29udHJvbHNDb250cm9sLFxyXG4gICAgICAgIGNvbnRlbnRMZWZ0TWFyZ2luOiAwXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnRlbnRWQm94LmFkZENoaWxkKCBnZXN0dXJlUGFuZWxTZWN0aW9uICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29udGVudE5vZGUgPSBuZXcgVkJveCgge1xyXG4gICAgICBzcGFjaW5nOiBQcmVmZXJlbmNlc0RpYWxvZy5DT05URU5UX1NQQUNJTkcsXHJcbiAgICAgIGFsaWduOiAnbGVmdCdcclxuICAgIH0gKTtcclxuXHJcbiAgICBpbnB1dE1vZGVsLmN1c3RvbVByZWZlcmVuY2VzLmZvckVhY2goIGN1c3RvbVByZWZlcmVuY2UgPT4ge1xyXG4gICAgICBjb25zdCBjdXN0b21Db250ZW50ID0gY3VzdG9tUHJlZmVyZW5jZS5jcmVhdGVDb250ZW50KCBwcm92aWRlZE9wdGlvbnMudGFuZGVtICk7XHJcbiAgICAgIGNvbnRlbnROb2RlLmFkZENoaWxkKFxyXG4gICAgICAgIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGN1c3RvbUNvbnRlbnQgXSB9IClcclxuICAgICAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBjdXN0b21QYW5lbFNlY3Rpb24gPSBuZXcgUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24oIHtcclxuICAgICAgY29udGVudE5vZGU6IGNvbnRlbnROb2RlLFxyXG4gICAgICBjb250ZW50TGVmdE1hcmdpbjogMFxyXG4gICAgfSApO1xyXG4gICAgY29udGVudFZCb3guYWRkQ2hpbGQoIGN1c3RvbVBhbmVsU2VjdGlvbiApO1xyXG4gIH1cclxufVxyXG5cclxuam9pc3QucmVnaXN0ZXIoICdJbnB1dFByZWZlcmVuY2VzUGFuZWwnLCBJbnB1dFByZWZlcmVuY2VzUGFuZWwgKTtcclxuZXhwb3J0IGRlZmF1bHQgSW5wdXRQcmVmZXJlbmNlc1BhbmVsOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxLQUFLLE1BQU0sZ0NBQWdDO0FBRWxELE9BQU9DLFdBQVcsTUFBTSw0Q0FBNEM7QUFDcEUsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsZUFBZSxRQUFRLGdDQUFnQztBQUNsRixPQUFPQyxZQUFZLE1BQStCLGlDQUFpQztBQUNuRixPQUFPQyxLQUFLLE1BQU0sYUFBYTtBQUMvQixPQUFPQyxZQUFZLE1BQU0sb0JBQW9CO0FBQzdDLE9BQU9DLGlCQUFpQixNQUFNLHdCQUF3QjtBQUV0RCxPQUFPQyxnQkFBZ0IsTUFBbUMsdUJBQXVCO0FBQ2pGLE9BQU9DLHVCQUF1QixNQUFNLDhCQUE4QjtBQUNsRSxPQUFPQyxrQkFBa0IsTUFBTSx5QkFBeUI7QUFDeEQsT0FBT0MsZUFBZSxNQUFNLHNCQUFzQjtBQUNsRCxPQUFPQywwQkFBMEIsTUFBTSxpQ0FBaUM7QUFDeEUsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQzs7QUFFbkU7QUFDQSxNQUFNQyx3Q0FBd0MsR0FBR1IsWUFBWSxDQUFDUyxJQUFJLENBQUNDLFdBQVcsQ0FBQ0MsSUFBSSxDQUFDQyxLQUFLLENBQUNDLGNBQWMsQ0FBQ0MsMEJBQTBCO0FBQ25JLE1BQU1DLHlDQUF5QyxHQUFHZixZQUFZLENBQUNTLElBQUksQ0FBQ0MsV0FBVyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBQ0MsY0FBYyxDQUFDRywyQkFBMkI7QUFDckksTUFBTUMsd0NBQXdDLEdBQUdqQixZQUFZLENBQUNTLElBQUksQ0FBQ0MsV0FBVyxDQUFDQyxJQUFJLENBQUNNLHdDQUF3Qzs7QUFFNUg7QUFDQSxNQUFNQyxnQkFBZ0IsR0FBRyxPQUFPO0FBQ2hDLE1BQU1DLHFCQUFxQixHQUFHLGlCQUFpQjtBQUMvQyxNQUFNQyxnQ0FBZ0MsR0FBRyw4RkFBOEY7QUFJdkksTUFBTUMscUJBQXFCLFNBQVNuQixnQkFBZ0IsQ0FBQztFQUU1Q29CLFdBQVdBLENBQUVDLFVBQXNCLEVBQUVDLG1CQUF1RCxFQUFFQyxrQkFBOEMsRUFBRUMsZUFBNkMsRUFBRztJQUVuTSxLQUFLLENBQUVyQixlQUFlLENBQUNzQixLQUFLLEVBQUVILG1CQUFtQixFQUFFQyxrQkFBa0IsRUFBRTtNQUNyRUcsWUFBWSxFQUFFVjtJQUNoQixDQUFFLENBQUM7O0lBRUg7SUFDQSxNQUFNVyxXQUFXLEdBQUcsSUFBSWpDLElBQUksQ0FBRTtNQUM1QmtDLE9BQU8sRUFBRTdCLGlCQUFpQixDQUFDOEIsZUFBZTtNQUMxQ0MsS0FBSyxFQUFFO0lBQ1QsQ0FBRSxDQUFDO0lBQ0gsSUFBSSxDQUFDQyxRQUFRLENBQUVKLFdBQVksQ0FBQztJQUU1QixJQUFLTixVQUFVLENBQUNXLHNCQUFzQixFQUFHO01BRXZDLE1BQU1DLGtCQUFrQixHQUFHLElBQUl4QyxJQUFJLENBQUV3QixxQkFBcUIsRUFBRWxCLGlCQUFpQixDQUFDbUMsMkJBQTRCLENBQUM7TUFDM0csTUFBTUMsNkJBQTZCLEdBQUcsSUFBSXhDLGVBQWUsQ0FBRXVCLGdDQUFnQyxFQUFFNUIsS0FBSyxDQUFFLENBQUMsQ0FBQyxFQUFFUyxpQkFBaUIsQ0FBQ3FDLDZCQUE2QixFQUFFO1FBQ3ZKQyxRQUFRLEVBQUUsR0FBRztRQUNiQyxTQUFTLEVBQUUsR0FBRztRQUVkQyx3QkFBd0IsRUFBRWhELFdBQVcsQ0FBQ2lELE1BQU0sQ0FBRXpCLHdDQUF3QyxFQUFFO1VBQ3RGMEIsS0FBSyxFQUFFeEIscUJBQXFCO1VBQzVCeUIsV0FBVyxFQUFFeEI7UUFDZixDQUFFO01BQ0osQ0FBRSxDQUFFLENBQUM7TUFDTCxNQUFNeUIsNEJBQTRCLEdBQUcsSUFBSS9DLFlBQVksQ0FBRXlCLFVBQVUsQ0FBQ3VCLDhCQUE4QixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUV2QyxjQUFjLENBQXVCO1FBQ2xKd0MsUUFBUSxFQUFFNUIscUJBQXFCO1FBQy9CNkIsd0JBQXdCLEVBQUVqQyx5Q0FBeUM7UUFDbkVrQyx5QkFBeUIsRUFBRXpDO01BQzdCLENBQUMsRUFBRUYsMEJBQTBCLENBQUM0QyxxQkFBc0IsQ0FBRSxDQUFDO01BQ3ZELE1BQU1DLHNCQUFzQixHQUFHLElBQUkvQyxrQkFBa0IsQ0FBRTtRQUNyRGdELFNBQVMsRUFBRWpCLGtCQUFrQjtRQUM3QmtCLGVBQWUsRUFBRWhCLDZCQUE2QjtRQUM5Q2lCLFdBQVcsRUFBRVQ7TUFDZixDQUFFLENBQUM7TUFFSCxNQUFNVSxtQkFBbUIsR0FBRyxJQUFJcEQsdUJBQXVCLENBQUU7UUFDdkRxRCxTQUFTLEVBQUVMLHNCQUFzQjtRQUNqQ00saUJBQWlCLEVBQUU7TUFDckIsQ0FBRSxDQUFDO01BRUg1QixXQUFXLENBQUNJLFFBQVEsQ0FBRXNCLG1CQUFvQixDQUFDO0lBQzdDO0lBRUEsTUFBTUcsV0FBVyxHQUFHLElBQUk5RCxJQUFJLENBQUU7TUFDNUJrQyxPQUFPLEVBQUU3QixpQkFBaUIsQ0FBQzhCLGVBQWU7TUFDMUNDLEtBQUssRUFBRTtJQUNULENBQUUsQ0FBQztJQUVIVCxVQUFVLENBQUNvQyxpQkFBaUIsQ0FBQ0MsT0FBTyxDQUFFQyxnQkFBZ0IsSUFBSTtNQUN4RCxNQUFNQyxhQUFhLEdBQUdELGdCQUFnQixDQUFDRSxhQUFhLENBQUVyQyxlQUFlLENBQUNzQyxNQUFPLENBQUM7TUFDOUVOLFdBQVcsQ0FBQ3pCLFFBQVEsQ0FDbEIsSUFBSXZDLElBQUksQ0FBRTtRQUFFdUUsUUFBUSxFQUFFLENBQUVILGFBQWE7TUFBRyxDQUFFLENBQzVDLENBQUM7SUFDSCxDQUFFLENBQUM7SUFFSCxNQUFNSSxrQkFBa0IsR0FBRyxJQUFJL0QsdUJBQXVCLENBQUU7TUFDdER1RCxXQUFXLEVBQUVBLFdBQVc7TUFDeEJELGlCQUFpQixFQUFFO0lBQ3JCLENBQUUsQ0FBQztJQUNINUIsV0FBVyxDQUFDSSxRQUFRLENBQUVpQyxrQkFBbUIsQ0FBQztFQUM1QztBQUNGO0FBRUFuRSxLQUFLLENBQUNvRSxRQUFRLENBQUUsdUJBQXVCLEVBQUU5QyxxQkFBc0IsQ0FBQztBQUNoRSxlQUFlQSxxQkFBcUIiLCJpZ25vcmVMaXN0IjpbXX0=