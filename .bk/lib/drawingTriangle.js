/**
 * Define action to draw triangle
 */
(function () {
  const triangleDrawing = function (fabricCanvas) {
    let isDrawing = false, origX, origY, pointer;    

    fabricCanvas.on("mouse:down", (o) => {
      if (!fabricCanvas.isDrawingTriangleMode) return;

      isDrawing = true;
      pointer = fabricCanvas.getPointer(o.e);

      origX = pointer.x;
      origY = pointer.y;

      boxTriangle = new fabric.Triangle({
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
      fabricCanvas.add(boxTriangle);
    });

    fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawing) return;

      pointer = fabricCanvas.getPointer(o.e);
      const isShiftPressed = o.e.shiftKey;

      if (origX > pointer.x) {
        boxTriangle.set({
          left: Math.abs(pointer.x)
        });
      }

      if (origY > pointer.y) {
        boxTriangle.set({
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

      boxTriangle.set({
        width: width,
        height: height
      });

      fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', () => {
      if (!isDrawing) return;

      let triangle;
      const triangleOptions = {
        left: boxTriangle.left,
        top: boxTriangle.top,
        width: boxTriangle.width < 80 ? 80 : boxTriangle.width,
        height: boxTriangle.height < 80 ? 80 : boxTriangle.height,
        fill: '#000000',
        strokeWidth: 0,
        stroke: 'transparent',
        selectable: true,
        originX: 'left',
        originY: 'top'
      };
      
      isDrawing = false; 

      triangle = new fabric.Triangle(triangleOptions);
      
      fabricCanvas.remove(boxTriangle);
      fabricCanvas.add(triangle).setActiveObject(triangle)  

      triangle.set({
        originX: 'center',
        originY: 'center',
        left: triangle.left + triangle.width / 2,
        top: triangle.top + triangle.height / 2
      });

      fabricCanvas.fire('object:modified')
    });
  };

  window.ImageEditor.prototype.initializeTriangleDrawing = triangleDrawing;
})();
