/**
 * Define action to draw rect
 */
(function () {
  const rectDrawing = function (fabricCanvas) {
    let isDrawing = false, origX, origY, pointer;    

    fabricCanvas.on("mouse:down", (o) => {
      if (!fabricCanvas.isDrawingRectMode) return;

      isDrawing = true;
      pointer = fabricCanvas.getPointer(o.e);

      origX = pointer.x;
      origY = pointer.y;

      boxRect = new fabric.Rect({
        left: origX,
        top: origY,
        width: pointer.x - origX,
        height: pointer.y - origY,
        strokeWidth: 1,
        stroke: '#C00000',
        fill: 'rgba(192, 0, 0, 0.2)',
        transparentCorners: false,
        originX: 'left',
        originY: 'top',
        isTemporary: true
      });
      fabricCanvas.add(boxRect);
    });

    fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawing) return;

      pointer = fabricCanvas.getPointer(o.e);
      const isShiftPressed = o.e.shiftKey;

      if (origX > pointer.x) {
        boxRect.set({
          left: Math.abs(pointer.x)
        });
      }

      if (origY > pointer.y) {
        boxRect.set({
          top: Math.abs(pointer.y)
        });
      }

      let width = Math.abs(origX - pointer.x);
      let height = Math.abs(origY - pointer.y);

      if (isShiftPressed) {
        // Mantém a proporção 1:1 usando a maior dimensão
        const maxDimension = Math.max(width, height);
        width = maxDimension;
        height = maxDimension;
      }

      boxRect.set({
        width: width,
        height: height
      });

      fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', () => {
      if (!isDrawing) return;

      let box;
      const rectOptions = {
        left: boxRect.left,
        top: boxRect.top,
        width: boxRect.width < 80 ? 80 : boxRect.width,
        height: boxRect.height < 80 ? 80 : boxRect.height,
        fill: '#000000',
        strokeWidth: 0,
        stroke: 'transparent',
        selectable: true,
        originX: 'left',
        originY: 'top'
      };
      
      isDrawing = false; 

      box = new fabric.Rect(rectOptions);
      
      fabricCanvas.remove(boxRect);
      fabricCanvas.add(box).setActiveObject(box)    
      box.set({
        originX: 'center',
        originY: 'center',
        left: box.left + box.width / 2,
        top: box.top + box.height / 2
      });

      fabricCanvas.fire('object:modified')
    });
  };

  window.ImageEditor.prototype.initializeRectDrawing = rectDrawing;
})();
