/**
 * Canvas section management of image editor
 */
(function () {
  "use strict";

  var canvas = function () {
    const _self = this;

    try {
      $(`${this.containerSelector} .main-panel`).append(
        `<div class="canvas-holder" id="canvas-holder"><div class="content"><canvas id="c"></canvas></div></div>`
      );

      fabric.Object.prototype.toObject = (function (toObject) {
        return function (properties) {
          var obj = toObject.call(this, properties);
          obj.animation = this.animation;
          return obj;
        };
      })(fabric.Object.prototype.toObject);

      fabric.Object.prototype.initialize = (function (initialize) {
        return function (options) {
          initialize.call(this, options);
          this.animation = options.animation || null; // Definindo um valor padrão
        };
      })(fabric.Object.prototype.initialize);

      fabric.Object.prototype.originX = "center";
      fabric.Object.prototype.originY = "center";

      const fabricOptions = {
        renderOnAddRemove: false,
      };
      const fabricCanvas = new fabric.Canvas("c", fabricOptions).setDimensions(
        this.dimensions
      );

      fabricCanvas.originalW = fabricCanvas.width;
      fabricCanvas.originalH = fabricCanvas.height;

      // set up selection style
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerStyle = "circle";
      fabric.Object.prototype.borderColor = "#8b3dff";
      fabric.Object.prototype.cornerColor = "#ffffff";
      fabric.Object.prototype.cornerStrokeColor = "#6d6d6d";      
      fabric.Object.prototype.padding = 0;

      // Custom icon control
      const svgRotateIcon = encodeURIComponent(`
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d)">
            <circle cx="9" cy="9" r="5" fill="white"/>
            <circle cx="9" cy="9" r="4.75" stroke="black" stroke-opacity="0.3" stroke-width="0.5"/>
          </g>
            <path d="M10.8047 11.1242L9.49934 11.1242L9.49934 9.81885" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.94856 6.72607L8.25391 6.72607L8.25391 8.03142" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.69517 6.92267C10.007 7.03301 10.2858 7.22054 10.5055 7.46776C10.7252 7.71497 10.8787 8.01382 10.9517 8.33642C11.0247 8.65902 11.0148 8.99485 10.9229 9.31258C10.831 9.63031 10.6601 9.91958 10.4262 10.1534L9.49701 11.0421M8.25792 6.72607L7.30937 7.73554C7.07543 7.96936 6.90454 8.25863 6.81264 8.57636C6.72073 8.89408 6.71081 9.22992 6.78381 9.55251C6.8568 9.87511 7.01032 10.174 7.23005 10.4212C7.44978 10.6684 7.72855 10.8559 8.04036 10.9663" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
          <filter id="filter0_d" x="0" y="0" width="18" height="18" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="2"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0.137674 0 0 0 0 0.190937 0 0 0 0 0.270833 0 0 0 0.15 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </filter>
          </defs>
        </svg>
        `);
      const rotateIcon = `data:image/svg+xml;utf8,${svgRotateIcon}`;
      const imgIcon = document.createElement("img");
      imgIcon.src = rotateIcon;

      function renderIcon(ctx, left, top, styleOverride, fabricObject) {
        var size = this.cornerSize;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.drawImage(imgIcon, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      fabric.Object.prototype.controls.mtr = new fabric.Control({
        x: 0,
        y: 0.5,
        offsetX: 0,
        offsetY: 40,
        actionHandler: fabric.controlsUtils.rotationWithSnapping,
        actionName: "rotate",
        render: renderIcon,
        cornerSize: 38,
        withConnection: true,
      });

      // set up selection controls
      // fabric.Object.prototype.controls.deleteControl = new fabric.Control({
      //   x: 0.5,
      //   y: -0.5,
      //   offsetY: -16,
      //   offsetX: -10,
      //   cursorStyle: 'pointer',
      //   mouseUpHandler: this.deleteObject,
      //   render: this.renderIcon("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z' fill='%234c4c4c'/%3E%3C/svg%3E"),
      //   cornerSize: 16
      // });

      // fabric.Object.prototype.controls.clone = new fabric.Control({
      //   x: 0.5,
      //   y: -0.5,
      //   offsetY: -16,
      //   offsetX: -36,
      //   cursorStyle: 'pointer',
      //   mouseUpHandler: this.cloneObject,
      //   render: this.renderIcon("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M288 448H64V224h64V160H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H288v64zm-64-96H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64z' fill='%234c4c4c' /%3E%3C/svg%3E"),
      //   cornerSize: 16
      // });

      fabricCanvas.preserveObjectStacking = true;

      // retrieve active selection to react state
      fabricCanvas.on("selection:created", (e) =>
        this.setActiveSelection(e.selected)
      );
      fabricCanvas.on("selection:updated", (e) =>
        this.setActiveSelection(e.selected)
      );
      fabricCanvas.on("selection:cleared", (e) =>
        this.setActiveSelection(null)
      );

      // snap to an angle on rotate if shift key is down
      fabricCanvas.on("object:rotating", (e) => {
        if (e.e.shiftKey) {
          e.target.snapAngle = 15;
        } else {
          e.target.snapAngle = false;
        }
      });

      // add angle text to object
      fabricCanvas.on("object:rotating", (e) => {
        var obj = e.target;
        var angle = Math.round(obj.angle); // Rounds the angle for display

        // Creates or updates the angle text
        if (!obj.angleText) {
          // Creates the text
          var text = new fabric.Text(angle + "°", {
            fontSize: 18,
            fill: "white",
            fontFamily: "sans-serif",
            originX: "center",
            originY: "center",
          });

          // Creates a rectangle as background with padding and borders
          var bgRect = new fabric.Rect({
            fill: "#333333",
            width: text.width + 20, // Text width + padding
            height: text.height + 20, // Text height + padding
            rx: 5, // Horizontal border-radius
            ry: 5, // Vertical border-radius
            stroke: "white",
            strokeWidth: 1,
            originX: "center",
            originY: "center",
          });

          // Groups text and rectangle
          obj.angleText = new fabric.Group([bgRect, text], {
            originX: "center",
            originY: "center",
          });

          // Atualiza a posição do angleText para seguir o cursor do mouse
          fabricCanvas.on('mouse:move', function(options) {
            if (obj.angleText) {
              const pointer = fabricCanvas.getPointer(options.e);
              obj.angleText.set({
                left: pointer.x + 50,
                top: pointer.y + 50 // Desloca um pouco acima do cursor
              });
              fabricCanvas.renderAll();
            }
          });
          fabricCanvas.add(obj.angleText);
        } else {
          // Updates text and rectangle size
          var text = obj.angleText.item(1);
          var bgRect = obj.angleText.item(0);
          text.set("text", angle + "°"); // Updates the text
          bgRect.set({
            width: text.width + 20,
            height: text.height + 20,
          });
          obj.angleText.setCoords(); // Recalculates group coordinates
        }

        // Positions the text near the object
        obj.angleText.set({
          left: obj.left, // Centers horizontally considering scale
          top: obj.top - 10, // Positions above the object (adjust distance as needed)
        });

        obj.set({
          hasControls: false, // Oculta os controles          
        });

        fabricCanvas.renderAll();
      });

      fabricCanvas.on("mouse:up", function (options) {
        if (
          fabricCanvas.getActiveObject() &&
          fabricCanvas.getActiveObject().angleText
        ) {
          fabricCanvas.remove(fabricCanvas.getActiveObject().angleText);
          fabricCanvas.getActiveObject().angleText = null;
          fabricCanvas.renderAll();
        }
      });

      fabricCanvas.on("object:moving", (e) => {
        var obj = e.target;
        this.handleObjectMoving(fabricCanvas, obj);
        // this.onObjectMoving(fabricCanvas, obj);
        obj.set({
          hasControls: false, // Oculta os controles          
        });
      });

      fabricCanvas.on("object:scaling", (e) => {
        var obj = e.target;
        obj.set({
          hasControls: false, // Oculta os controles          
        });
      });

      fabricCanvas.on("object:modified", (e) => {
        
        if (this.canvas) {
          let currentState = this.canvas.toJSON();
          if (this.history) {
            this.history.push(JSON.stringify(currentState));
          } else {
            console.error("History (this.history) is not defined.");
          }
        } else {
          console.error("Canvas (this.canvas) is not defined.");
        }
        this.clearGuidesline(fabricCanvas);

        var obj = e.target;
        if (obj && !obj.metadata && (!obj.metadata?.isGuide && !obj.metadata?.isMargin)) {
          obj.set({
            hasControls: true, // Restaura os controles          
          });
        }
      });

      // Verificar se saveInBrowser foi carregado corretamente antes de usá-lo
      let savedCanvas = null;
      if (window.saveInBrowser) {
        try {
          savedCanvas = window.saveInBrowser.load("canvasEditor");
          if (savedCanvas) {
            console.log("loading canvas from local storage", savedCanvas);
            fabricCanvas.loadFromJSON(savedCanvas, () => {
              // Restaurar propriedades de bloqueio após carregar
              fabricCanvas.getObjects().forEach((obj) => {
                if (obj.locked) {
                  obj.lockMovementX = true;
                  obj.lockMovementY = true;
                  obj.lockScalingX = true;
                  obj.lockScalingY = true;
                  obj.lockRotation = true;
                  obj.lockUniScaling = true;
                  obj.lockSkewingX = true;
                  obj.lockSkewingY = true;
                  obj.selectable = true;
                  obj.hasControls = true;
                  obj.hasRotatingPoint = true;
                }
              });
              fabricCanvas.renderAll();
            });
          }
        } catch (error) {
          console.error("Erro ao carregar canvas salvo:", error);
        }
      } else {
        console.warn(
          "saveInBrowser não está disponível. O canvas não será carregado do armazenamento local."
        );
      }

      // move objects with arrow keys
      (() =>
        document.addEventListener("keydown", (e) => {
          const key = e.which || e.keyCode;
          let activeObject;

          if (
            document.querySelectorAll("textarea:focus, input:focus").length > 0
          )
            return;

          if (key === 37 || key === 38 || key === 39 || key === 40) {
            e.preventDefault();
            activeObject = fabricCanvas.getActiveObject();
            if (!activeObject) {
              return;
            }
          }

          if (key === 37) {
            activeObject.left -= 1;
          } else if (key === 39) {
            activeObject.left += 1;
          } else if (key === 38) {
            activeObject.top -= 1;
          } else if (key === 40) {
            activeObject.top += 1;
          }

          if (key === 37 || key === 38 || key === 39 || key === 40) {
            activeObject.setCoords();
            fabricCanvas.renderAll();
            fabricCanvas.fire("object:modified");
          }
        }))();

      // delete object on del key
      (() => {
        document.addEventListener("keydown", (e) => {
          const key = e.which || e.keyCode;
          if (
            key === 46 &&
            document.querySelectorAll("textarea:focus, input:focus").length ===
              0
          ) {
            fabricCanvas.getActiveObjects().forEach((obj) => {
              fabricCanvas.remove(obj);
            });

            fabricCanvas.discardActiveObject().requestRenderAll();
            fabricCanvas.fire("object:modified");
          }
        });
      })();

      // remove selection on click outside canvas
      (() => {
        document.addEventListener("mousedown", (event) => {
          const canvasElement = document.getElementById("canvas-holder");
          if (canvasElement == event.target) {
            fabricCanvas.discardActiveObject();
            fabricCanvas.renderAll();
          }
        });
      })();

      setTimeout(() => {
        let currentState = fabricCanvas.toJSON();
        if (this.history) {
          this.history.push(JSON.stringify(currentState));
        }
      }, 1000);

      // Inicializar o componente de réguas após o canvas estar pronto
      this.canvas = fabricCanvas;
      if (this.initRulerComponent) {
        this.initRulerComponent();
      } else {
        console.warn("initRulerComponent não está disponível");
      }

      // Configurar o componente de réguas após o canvas estar pronto
      setTimeout(() => {
        if (this.setupRulerAfterCanvasReady) {
          this.setupRulerAfterCanvasReady();
        } else {
          console.warn("setupRulerAfterCanvasReady não está disponível");
        }
      }, 500);

      return fabricCanvas;
    } catch (error) {
      console.error("can't create canvas instance", error);
      return null;
    }
  };

  window.ImageEditor.prototype.initializeCanvas = canvas;
})();
