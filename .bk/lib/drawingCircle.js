/**
 * Define action to draw circle
 */
(function () {
  const circleDrawing = function (fabricCanvas) {
    let isDrawing = false, origX, origY, pointer;    

    fabricCanvas.on("mouse:down", (o) => {
      if (!fabricCanvas.isDrawingCircleMode) return;

      isDrawing = true;
      pointer = fabricCanvas.getPointer(o.e);

      origX = pointer.x;
      origY = pointer.y;

      boxRect = new fabric.Ellipse({
        left: origX,
        top: origY,
        rx: (pointer.x - origX),
        ry: (pointer.y - origY),
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
        rx: width / 2,
        ry: height / 2
      });

      fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', () => {
      if (!isDrawing) return;

      if (boxRect.width < 20 || boxRect.height < 20) {
        fabricCanvas.remove(boxRect);
        isDrawing = false;
        return;
      }
      let circle;

      const options = {
        left: boxRect.left,
        top: boxRect.top,
        rx: boxRect.width / 2,
        ry: boxRect.height / 2,
        originX: 'left', 
        originY: 'top',
        fill: '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        selectable: true
      };      
           
      circle = new fabric.Ellipse(options);     
      
      isDrawing = false;       
      
      fabricCanvas.remove(boxRect);
      fabricCanvas.add(circle).setActiveObject(circle)      
      circle.set({
        originX: 'center',
        originY: 'center',
        left: circle.left + circle.rx,
        top: circle.top + circle.ry
      });
      fabricCanvas.fire('object:modified')
    });
  };

  window.ImageEditor.prototype.initializeCircleDrawing = circleDrawing;
})();
