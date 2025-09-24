/**
 * Define action to draw text
 */
(function () {
  const textBoxDrawing = function (fabricCanvas) {

    let isDrawingText = false,
      textboxRect, origX, origY, pointer;


    fabricCanvas.on('mouse:down', (o) => {
      if (!fabricCanvas.isDrawingTextMode) return;

      isDrawingText = true;
      pointer = fabricCanvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;
      textboxRect = new fabric.Rect({
        left: origX,
        top: origY,
        width: pointer.x - origX,
        height: pointer.y - origY,
        strokeWidth: 1,
        stroke: '#C00000',
        fill: 'rgba(192, 0, 0, 0.2)',
        transparentCorners: false,
        originX: 'left',
        originY: 'top'
      });
      fabricCanvas.add(textboxRect);
    });


    fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawingText) return;

      pointer = fabricCanvas.getPointer(o.e);

      if (origX > pointer.x) {
        textboxRect.set({
          left: Math.abs(pointer.x)
        });
      }

      if (origY > pointer.y) {
        textboxRect.set({
          top: Math.abs(pointer.y)
        });
      }

      textboxRect.set({
        width: Math.abs(origX - pointer.x)
      });
      textboxRect.set({
        height: Math.abs(origY - pointer.y)
      });

      fabricCanvas.renderAll();
    });


    fabricCanvas.on('mouse:up', () => {
      if (!isDrawingText) return;

      let textbox;
      const textOptions = {
        left: textboxRect.left,
        top: textboxRect.top,
        width: textboxRect.width < 80 ? 80 : textboxRect.width,
        fontSize: 30,
        fontFamily: "'Open Sans', sans-serif",
        lineHeight: 1.2, 
        letterSpacing : 0 
      };
      
      isDrawingText = false;

      // get final rect coords and replace it with textbox
      if (textboxRect.width > 80) {
        textbox = new fabric.Textbox('Your text goes here...', textOptions);
      } else {
        textbox = new fabric.IText('Your text goes here...', textOptions);
      }

      fabricCanvas.remove(textboxRect);
      fabricCanvas.add(textbox).setActiveObject(textbox)      

      fabricCanvas.fire('object:modified')
    });

  }

  window.ImageEditor.prototype.initializeTextBoxDrawing = textBoxDrawing;
})();