/**
 * Define action to zoom in/out
 */
(function () {
  'use strict';

  function zoom() {
    const _self = this; 
    let currentZoomLevel = 1;

        $(`${this.containerSelector} #footerbar`).append(
          `<div class="zoom-level-container"></div>`
        );
        $(`${this.containerSelector} #footerbar .zoom-level-container`).append(`
          <button id="zoom-fit">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/></svg> 
          </button>
          <input type="range" id="input-zoom-level" min="0.1" max="3" step="0.05" value="${currentZoomLevel}" oninput="updateZoomValue(this.value)">
          <div id="zoom-value">${Math.round(currentZoomLevel * 100)}%</div>
        `);

        $(`${this.containerSelector} #footerbar .zoom-level-container button`).click(function () {
          typeof _self.fitZoom === 'function' && _self.fitZoom();
        })

        window.updateZoomValue = function (value) {
          // document.getElementById('zoom-value').textContent = Math.round((value * 100)) + '%';
          if (value === 'fit') {
            typeof _self.fitZoom === 'function' && _self.fitZoom();
          } else {
            let zoom = parseFloat(value);
            typeof _self.applyZoom === 'function' && _self.applyZoom(zoom);
          }
        };
        
        if (currentZoomLevel === 'fit') {
          typeof _self.fitZoom === 'function' && _self.fitZoom();
        } else {
          typeof _self.applyZoom === 'function' && _self.applyZoom(currentZoomLevel);
        } 

    const minZoom = 0.05
    const maxZoom = 3

    this.applyZoom = (zoom) => {
      this.canvas.setZoom(zoom)
      this.canvas.setWidth(this.canvas.originalW * this.canvas.getZoom())
      this.canvas.setHeight(this.canvas.originalH * this.canvas.getZoom())
      this.inputZoomLevel(zoom)
    }
    
    // zoom fit the area
    this.fitZoom = () => {
      const container = document.querySelector(this.containerSelector + ' .canvas-holder');  
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const canvasWidth = this.canvas.originalW;
      const canvasHeight = this.canvas.originalH;

      // Ajustar a largura do container se estiver em modo fixo
      let adjustedContainerWidth = containerWidth;

      const widthRatio = adjustedContainerWidth / canvasWidth;
      const heightRatio = containerHeight / canvasHeight;
      const newZoom = Math.min(widthRatio, heightRatio) - 0.05;
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom)).toFixed(2); 
      this.applyZoom(clampedZoom)
    };

    // zoom out/in/reset (ctr + -/+/0)
    const keyZoom = (e) => {
      const key = e.which || e.keyCode
    
      // ctr -: zoom out
      if (key === 189 && e.ctrlKey) {
        e.preventDefault()
        if (this.canvas.getZoom() === minZoom) return
    
        let updatedZoom = parseInt(this.canvas.getZoom() * 100)
    
        // 25% jumps
        if ((updatedZoom % 25) !== 0) {
          while ((updatedZoom % 25) !== 0) {
            updatedZoom = updatedZoom - 1
          }
        } else {
          updatedZoom = updatedZoom - 25
        }
    
        updatedZoom = updatedZoom / 100
        updatedZoom = (updatedZoom <= 0) ? minZoom : updatedZoom
    
        this.applyZoom(updatedZoom)
      }
    
    
      // ctr +: zoom in
      if (key === 187 && e.ctrlKey) {
        e.preventDefault()
        if (this.canvas.getZoom() === maxZoom) return
    
        let updatedZoom = parseInt(this.canvas.getZoom() * 100)
    
        // 25% jumps
        if ((updatedZoom % 25) !== 0) {
          while ((updatedZoom % 25) !== 0) {
            updatedZoom = updatedZoom + 1
          }
        } else {
          updatedZoom = updatedZoom + 25
        }
    
        updatedZoom = updatedZoom / 100
        updatedZoom = (updatedZoom > maxZoom) ? maxZoom : updatedZoom
    
        this.applyZoom(updatedZoom)
      }
    
    
      // ctr 0: reset
      if ((key === 96 || key === 48 || key === 192) && e.ctrlKey) {
        e.preventDefault()
        this.applyZoom(1)
      }
    }
    document.addEventListener('keydown', keyZoom)

    // zoom out/in with mouse    
    const mouseZoom = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
    
      let updatedZoom = this.canvas.getZoom()
      let zoomAmount = (e.deltaY > 0) ? -5 : 5
      updatedZoom = ((updatedZoom * 100) + zoomAmount) / 100
      if (updatedZoom < minZoom || updatedZoom > maxZoom) return
    
      this.applyZoom(updatedZoom)
    }
    document.addEventListener('wheel', mouseZoom, {
      passive: false
    })   
    
    this.inputZoomLevel = (zoom) => {      
      const inputZoomLevel = document.querySelector(this.containerSelector + ' #input-zoom-level');
      if(inputZoomLevel) {
        inputZoomLevel.value = zoom
        document.getElementById('zoom-value').textContent = Math.round((zoom * 100)) + '%'
      } 
    }
  
  }

  window.ImageEditor.prototype.initializeZoomEvents = zoom;
})();