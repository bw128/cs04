// Copyright 2022, University of Colorado Boulder

/**
 * Demo for GridBox
 *
 * @author Jonathan Olson
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Range from '../../../../dot/js/Range.js';
import { Color, GridBox, HBox, Node, Rectangle, Text, VBox } from '../../../../scenery/js/imports.js';
import HSlider from '../../../../sun/js/HSlider.js';
export default function demoGridBox(layoutBounds) {
  const scene = new Node({
    y: 50
  });
  const niceColors = [new Color(62, 171, 3), new Color(23, 180, 77), new Color(24, 183, 138), new Color(23, 178, 194), new Color(20, 163, 238), new Color(71, 136, 255), new Color(171, 101, 255), new Color(228, 72, 235), new Color(252, 66, 186), new Color(252, 82, 127)];
  class ExampleExpandingRectangle extends Rectangle {
    constructor(...args) {
      super(...args);
      this.localMinimumWidth = 50;
      this.localMinimumHeight = 50;
      this.widthSizable = true;
      this.heightSizable = true;
    }
  }
  const blockSizeProperty = new NumberProperty(50, {
    range: new Range(50, 200)
  });
  const preferredWidthProperty = new NumberProperty(500, {
    range: new Range(200, 800)
  });
  const preferredHeightProperty = new NumberProperty(500, {
    range: new Range(200, 800)
  });
  const rectA = new Rectangle(0, 0, 50, 50, {
    fill: niceColors[9]
  });
  const rectB = new Rectangle(0, 0, 50, 50, {
    fill: niceColors[6]
  });
  const rectC = new Rectangle(0, 0, 50, 50, {
    fill: niceColors[3]
  });
  const rectD = new Rectangle(0, 0, 50, 50, {
    fill: niceColors[0]
  });
  blockSizeProperty.link(size => {
    rectA.rectWidth = size;
    rectB.rectWidth = size * 0.5;
    rectC.rectWidth = size * 2;
    rectD.rectWidth = size * 0.5;
    rectA.rectHeight = size;
    rectB.rectHeight = size * 0.5;
    rectC.rectHeight = size * 2;
    rectD.rectHeight = size * 0.5;
  });
  const mainBox = new VBox({
    spacing: 10,
    align: 'left',
    children: [new HBox({
      children: [new Text('Block Size'), new HSlider(blockSizeProperty, blockSizeProperty.range), new Text('Preferred Width'), new HSlider(preferredWidthProperty, preferredWidthProperty.range), new Text('Preferred Height'), new HSlider(preferredHeightProperty, preferredHeightProperty.range)]
    })]
  });
  scene.addChild(mainBox);
  const gridBox = new GridBox({
    spacing: 10,
    children: [new Node({
      children: [rectA],
      layoutOptions: {
        column: 0,
        row: 0,
        xAlign: 'left'
      }
    }), new Node({
      children: [rectB],
      layoutOptions: {
        column: 1,
        row: 0
      }
    }), new Node({
      children: [rectC],
      layoutOptions: {
        column: 2,
        row: 0
      }
    }), new Node({
      children: [rectD],
      layoutOptions: {
        column: 0,
        row: 2
      }
    }), new Node({
      children: [rectD],
      layoutOptions: {
        column: 1,
        row: 1,
        horizontalSpan: 2,
        yAlign: 'bottom'
      }
    }), new ExampleExpandingRectangle({
      fill: 'gray',
      layoutOptions: {
        column: 0,
        row: 1,
        stretch: true,
        grow: 1
      }
    }), new ExampleExpandingRectangle({
      fill: 'gray',
      layoutOptions: {
        column: 3,
        row: 0,
        verticalSpan: 3,
        yStretch: true,
        leftMargin: 20,
        yMargin: 10
      }
    })]
  });
  const backgroundRect = new Rectangle({
    fill: 'rgba(0,0,0,0.1)'
  });
  gridBox.localBoundsProperty.link(localBounds => {
    backgroundRect.rectBounds = localBounds.copy();
  });
  mainBox.addChild(new Node({
    children: [backgroundRect, gridBox]
  }));
  preferredWidthProperty.link(width => {
    gridBox.preferredWidth = width;
  });
  preferredHeightProperty.link(height => {
    gridBox.preferredHeight = height;
  });
  window.gridBox = gridBox;
  return new Node({
    children: [scene],
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOdW1iZXJQcm9wZXJ0eSIsIlJhbmdlIiwiQ29sb3IiLCJHcmlkQm94IiwiSEJveCIsIk5vZGUiLCJSZWN0YW5nbGUiLCJUZXh0IiwiVkJveCIsIkhTbGlkZXIiLCJkZW1vR3JpZEJveCIsImxheW91dEJvdW5kcyIsInNjZW5lIiwieSIsIm5pY2VDb2xvcnMiLCJFeGFtcGxlRXhwYW5kaW5nUmVjdGFuZ2xlIiwiY29uc3RydWN0b3IiLCJhcmdzIiwibG9jYWxNaW5pbXVtV2lkdGgiLCJsb2NhbE1pbmltdW1IZWlnaHQiLCJ3aWR0aFNpemFibGUiLCJoZWlnaHRTaXphYmxlIiwiYmxvY2tTaXplUHJvcGVydHkiLCJyYW5nZSIsInByZWZlcnJlZFdpZHRoUHJvcGVydHkiLCJwcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eSIsInJlY3RBIiwiZmlsbCIsInJlY3RCIiwicmVjdEMiLCJyZWN0RCIsImxpbmsiLCJzaXplIiwicmVjdFdpZHRoIiwicmVjdEhlaWdodCIsIm1haW5Cb3giLCJzcGFjaW5nIiwiYWxpZ24iLCJjaGlsZHJlbiIsImFkZENoaWxkIiwiZ3JpZEJveCIsImxheW91dE9wdGlvbnMiLCJjb2x1bW4iLCJyb3ciLCJ4QWxpZ24iLCJob3Jpem9udGFsU3BhbiIsInlBbGlnbiIsInN0cmV0Y2giLCJncm93IiwidmVydGljYWxTcGFuIiwieVN0cmV0Y2giLCJsZWZ0TWFyZ2luIiwieU1hcmdpbiIsImJhY2tncm91bmRSZWN0IiwibG9jYWxCb3VuZHNQcm9wZXJ0eSIsImxvY2FsQm91bmRzIiwicmVjdEJvdW5kcyIsImNvcHkiLCJ3aWR0aCIsInByZWZlcnJlZFdpZHRoIiwiaGVpZ2h0IiwicHJlZmVycmVkSGVpZ2h0Iiwid2luZG93IiwiY2VudGVyIl0sInNvdXJjZXMiOlsiZGVtb0dyaWRCb3guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW8gZm9yIEdyaWRCb3hcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvblxyXG4gKi9cclxuXHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCB7IENvbG9yLCBHcmlkQm94LCBIQm94LCBOb2RlLCBSZWN0YW5nbGUsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSFNsaWRlciBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvSFNsaWRlci5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZW1vR3JpZEJveCggbGF5b3V0Qm91bmRzICkge1xyXG4gIGNvbnN0IHNjZW5lID0gbmV3IE5vZGUoIHsgeTogNTAgfSApO1xyXG5cclxuICBjb25zdCBuaWNlQ29sb3JzID0gW1xyXG4gICAgbmV3IENvbG9yKCA2MiwgMTcxLCAzICksXHJcbiAgICBuZXcgQ29sb3IoIDIzLCAxODAsIDc3ICksXHJcbiAgICBuZXcgQ29sb3IoIDI0LCAxODMsIDEzOCApLFxyXG4gICAgbmV3IENvbG9yKCAyMywgMTc4LCAxOTQgKSxcclxuICAgIG5ldyBDb2xvciggMjAsIDE2MywgMjM4ICksXHJcbiAgICBuZXcgQ29sb3IoIDcxLCAxMzYsIDI1NSApLFxyXG4gICAgbmV3IENvbG9yKCAxNzEsIDEwMSwgMjU1ICksXHJcbiAgICBuZXcgQ29sb3IoIDIyOCwgNzIsIDIzNSApLFxyXG4gICAgbmV3IENvbG9yKCAyNTIsIDY2LCAxODYgKSxcclxuICAgIG5ldyBDb2xvciggMjUyLCA4MiwgMTI3IClcclxuICBdO1xyXG5cclxuICBjbGFzcyBFeGFtcGxlRXhwYW5kaW5nUmVjdGFuZ2xlIGV4dGVuZHMgUmVjdGFuZ2xlIHtcclxuICAgIGNvbnN0cnVjdG9yKCAuLi5hcmdzICkge1xyXG4gICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgdGhpcy5sb2NhbE1pbmltdW1XaWR0aCA9IDUwO1xyXG4gICAgICB0aGlzLmxvY2FsTWluaW11bUhlaWdodCA9IDUwO1xyXG4gICAgICB0aGlzLndpZHRoU2l6YWJsZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuaGVpZ2h0U2l6YWJsZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBibG9ja1NpemVQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggNTAsIHtcclxuICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDUwLCAyMDAgKVxyXG4gIH0gKTtcclxuICBjb25zdCBwcmVmZXJyZWRXaWR0aFByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCA1MDAsIHtcclxuICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDIwMCwgODAwIClcclxuICB9ICk7XHJcbiAgY29uc3QgcHJlZmVycmVkSGVpZ2h0UHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDUwMCwge1xyXG4gICAgcmFuZ2U6IG5ldyBSYW5nZSggMjAwLCA4MDAgKVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcmVjdEEgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCA1MCwgNTAsIHtcclxuICAgIGZpbGw6IG5pY2VDb2xvcnNbIDkgXVxyXG4gIH0gKTtcclxuICBjb25zdCByZWN0QiA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDUwLCA1MCwge1xyXG4gICAgZmlsbDogbmljZUNvbG9yc1sgNiBdXHJcbiAgfSApO1xyXG4gIGNvbnN0IHJlY3RDID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgNTAsIDUwLCB7XHJcbiAgICBmaWxsOiBuaWNlQ29sb3JzWyAzIF1cclxuICB9ICk7XHJcbiAgY29uc3QgcmVjdEQgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCA1MCwgNTAsIHtcclxuICAgIGZpbGw6IG5pY2VDb2xvcnNbIDAgXVxyXG4gIH0gKTtcclxuICBibG9ja1NpemVQcm9wZXJ0eS5saW5rKCBzaXplID0+IHtcclxuICAgIHJlY3RBLnJlY3RXaWR0aCA9IHNpemU7XHJcbiAgICByZWN0Qi5yZWN0V2lkdGggPSBzaXplICogMC41O1xyXG4gICAgcmVjdEMucmVjdFdpZHRoID0gc2l6ZSAqIDI7XHJcbiAgICByZWN0RC5yZWN0V2lkdGggPSBzaXplICogMC41O1xyXG4gICAgcmVjdEEucmVjdEhlaWdodCA9IHNpemU7XHJcbiAgICByZWN0Qi5yZWN0SGVpZ2h0ID0gc2l6ZSAqIDAuNTtcclxuICAgIHJlY3RDLnJlY3RIZWlnaHQgPSBzaXplICogMjtcclxuICAgIHJlY3RELnJlY3RIZWlnaHQgPSBzaXplICogMC41O1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgbWFpbkJveCA9IG5ldyBWQm94KCB7XHJcbiAgICBzcGFjaW5nOiAxMCxcclxuICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICBuZXcgSEJveCgge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICBuZXcgVGV4dCggJ0Jsb2NrIFNpemUnICksXHJcbiAgICAgICAgICBuZXcgSFNsaWRlciggYmxvY2tTaXplUHJvcGVydHksIGJsb2NrU2l6ZVByb3BlcnR5LnJhbmdlICksXHJcbiAgICAgICAgICBuZXcgVGV4dCggJ1ByZWZlcnJlZCBXaWR0aCcgKSxcclxuICAgICAgICAgIG5ldyBIU2xpZGVyKCBwcmVmZXJyZWRXaWR0aFByb3BlcnR5LCBwcmVmZXJyZWRXaWR0aFByb3BlcnR5LnJhbmdlICksXHJcbiAgICAgICAgICBuZXcgVGV4dCggJ1ByZWZlcnJlZCBIZWlnaHQnICksXHJcbiAgICAgICAgICBuZXcgSFNsaWRlciggcHJlZmVycmVkSGVpZ2h0UHJvcGVydHksIHByZWZlcnJlZEhlaWdodFByb3BlcnR5LnJhbmdlIClcclxuICAgICAgICBdXHJcbiAgICAgIH0gKVxyXG4gICAgXVxyXG4gIH0gKTtcclxuICBzY2VuZS5hZGRDaGlsZCggbWFpbkJveCApO1xyXG5cclxuICBjb25zdCBncmlkQm94ID0gbmV3IEdyaWRCb3goIHtcclxuICAgIHNwYWNpbmc6IDEwLFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgbmV3IE5vZGUoIHtcclxuICAgICAgICBjaGlsZHJlbjogWyByZWN0QSBdLFxyXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAwLCByb3c6IDAsIHhBbGlnbjogJ2xlZnQnIH1cclxuICAgICAgfSApLFxyXG4gICAgICBuZXcgTm9kZSgge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbIHJlY3RCIF0sXHJcbiAgICAgICAgbGF5b3V0T3B0aW9uczogeyBjb2x1bW46IDEsIHJvdzogMCB9XHJcbiAgICAgIH0gKSxcclxuICAgICAgbmV3IE5vZGUoIHtcclxuICAgICAgICBjaGlsZHJlbjogWyByZWN0QyBdLFxyXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAyLCByb3c6IDAgfVxyXG4gICAgICB9ICksXHJcbiAgICAgIG5ldyBOb2RlKCB7XHJcbiAgICAgICAgY2hpbGRyZW46IFsgcmVjdEQgXSxcclxuICAgICAgICBsYXlvdXRPcHRpb25zOiB7IGNvbHVtbjogMCwgcm93OiAyIH1cclxuICAgICAgfSApLFxyXG4gICAgICBuZXcgTm9kZSgge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbIHJlY3REIF0sXHJcbiAgICAgICAgbGF5b3V0T3B0aW9uczogeyBjb2x1bW46IDEsIHJvdzogMSwgaG9yaXpvbnRhbFNwYW46IDIsIHlBbGlnbjogJ2JvdHRvbScgfVxyXG4gICAgICB9ICksXHJcbiAgICAgIG5ldyBFeGFtcGxlRXhwYW5kaW5nUmVjdGFuZ2xlKCB7XHJcbiAgICAgICAgZmlsbDogJ2dyYXknLFxyXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAwLCByb3c6IDEsIHN0cmV0Y2g6IHRydWUsIGdyb3c6IDEgfVxyXG4gICAgICB9ICksXHJcbiAgICAgIG5ldyBFeGFtcGxlRXhwYW5kaW5nUmVjdGFuZ2xlKCB7XHJcbiAgICAgICAgZmlsbDogJ2dyYXknLFxyXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAzLCByb3c6IDAsIHZlcnRpY2FsU3BhbjogMywgeVN0cmV0Y2g6IHRydWUsIGxlZnRNYXJnaW46IDIwLCB5TWFyZ2luOiAxMCB9XHJcbiAgICAgIH0gKVxyXG4gICAgXVxyXG4gIH0gKTtcclxuICBjb25zdCBiYWNrZ3JvdW5kUmVjdCA9IG5ldyBSZWN0YW5nbGUoIHtcclxuICAgIGZpbGw6ICdyZ2JhKDAsMCwwLDAuMSknXHJcbiAgfSApO1xyXG4gIGdyaWRCb3gubG9jYWxCb3VuZHNQcm9wZXJ0eS5saW5rKCBsb2NhbEJvdW5kcyA9PiB7XHJcbiAgICBiYWNrZ3JvdW5kUmVjdC5yZWN0Qm91bmRzID0gbG9jYWxCb3VuZHMuY29weSgpO1xyXG4gIH0gKTtcclxuICBtYWluQm94LmFkZENoaWxkKCBuZXcgTm9kZSgge1xyXG4gICAgY2hpbGRyZW46IFsgYmFja2dyb3VuZFJlY3QsIGdyaWRCb3ggXVxyXG4gIH0gKSApO1xyXG5cclxuICBwcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxpbmsoIHdpZHRoID0+IHsgZ3JpZEJveC5wcmVmZXJyZWRXaWR0aCA9IHdpZHRoOyB9ICk7XHJcbiAgcHJlZmVycmVkSGVpZ2h0UHJvcGVydHkubGluayggaGVpZ2h0ID0+IHsgZ3JpZEJveC5wcmVmZXJyZWRIZWlnaHQgPSBoZWlnaHQ7IH0gKTtcclxuXHJcbiAgd2luZG93LmdyaWRCb3ggPSBncmlkQm94O1xyXG5cclxuICByZXR1cm4gbmV3IE5vZGUoIHtcclxuICAgIGNoaWxkcmVuOiBbIHNjZW5lIF0sXHJcbiAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICB9ICk7XHJcbn0iXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsY0FBYyxNQUFNLHVDQUF1QztBQUNsRSxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FB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