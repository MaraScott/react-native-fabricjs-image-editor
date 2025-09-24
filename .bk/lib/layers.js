/**
 * Defines the layers functionality for the editor
 */
(function () {
  'use strict';

  function initializeLayers() {
    const _self = this;

    // Container for the layers list
    const layersContainer = document.createElement('div');
    layersContainer.className = 'image-editor-layers';
    

    // Layers header
    const layersHeader = document.createElement('div');
    layersHeader.className = 'layers-header';
    layersHeader.innerHTML = `<p>Layers</p><button class="layers-header-button layers-header-button-minus"><i class="uil uil-minus"></i></button><button class="layers-header-button layers-header-button-times"><i class="uil uil-times"></i></button>`; 
    layersHeader.style.display = 'flex';   
    layersContainer.appendChild(layersHeader);

    layersHeader.querySelector('.layers-header-button-minus').addEventListener('click', (e) => {
      layersContainer.toggleAttribute('closed');
    });

    layersHeader.querySelector('.layers-header-button-times').addEventListener('click', (e) => {
      layersContainer.style.display = 'none';
    });

    // Layers list
    const layersList = document.createElement('div');
    layersList.className = 'layers-list';
    layersContainer.appendChild(layersList);

    // Add container to editor
    _self.containerEl.find('.main-panel').append(layersContainer);

    // Variables for drag and drop control
    let draggedItem = null;
    let placeholder = null;

    // Add drag and drop events to the list container
    layersList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    layersList.addEventListener('drop', (e) => {
      e.preventDefault();
      console.log('drop in container', draggedItem);

      if (draggedItem) {
        const allItems = Array.from(layersList.children);
        const newIndex = allItems.indexOf(placeholder);
        const oldIndex = allItems.indexOf(draggedItem);

        if (newIndex !== -1) {
          const objects = _self.canvas.getObjects().filter(obj => {
            return !obj.id || (!obj.id.startsWith('vertical-') && !obj.id.startsWith('horizontal-'));
          });

          const draggedItemId = draggedItem.dataset.objectId;
          const objectToMove = objects.find(obj => obj.id === draggedItemId);

          if (objectToMove) {
            console.log('Object to move:', objectToMove);
            _self.canvas.remove(objectToMove);
            const clonedObject = fabric.util.object.clone(objectToMove);

            // Insert at the new position corresponding to the new list index
            _self.canvas.insertAt(clonedObject, objects.length - 1 - newIndex);

            _self.canvas.renderAll();
            updateLayersList();
          } else {
            console.warn('Object to be moved not found in canvas with ID:', draggedItemId);
          }
        }
      }
    });

    // Function to create a layer item
    function createLayerItem(fabricObject) {
      const layer = document.createElement('div');
      layer.className = 'layer-item';
      layer.dataset.objectId = fabricObject.id;
      layer.draggable = true;
      
      if(fabricObject.type === 'group') {        
        console.log('group', fabricObject);
        const group = fabricObject.getObjects();        
        group.forEach(obj => {
          // list all objects in the group
        });
      }

      // Determine icon based on object type
      let icon = '<i class="uil uil-file-alt"></i>';
      if (fabricObject.type === 'image') icon = '<i class="uil uil-image"></i>';
      else if (fabricObject.type === 'text') icon = '<i class="uil uil-font"></i>';
      else if (fabricObject.type === 'textbox') icon = '<i class="uil uil-font"></i>';
      else if (fabricObject.type === 'i-text') icon = '<i class="uil uil-font"></i>';
      else if (fabricObject.type === 'rect') icon = '<i class="uil uil-square"></i>';
      else if (fabricObject.type === 'circle') icon = '<i class="uil uil-circle"></i>';
      else if (fabricObject.type === 'ellipse') icon = '<i class="uil uil-circle"></i>';
      else if (fabricObject.type === 'triangle') icon = '<i class="uil uil-triangle"></i>';
      else if (fabricObject.type === 'path') icon = '<i class="uil uil-pathfinder "></i>';
      else if (fabricObject.type === 'group') icon = '<i class="uil uil-layer-group"></i>';

      let typeName = fabricObject.type ? fabricObject.type.charAt(0).toUpperCase() + fabricObject.type.slice(1) : 'Object';
      layer.innerHTML = `
        <div class="layer-info">
          <span class="layer-icon">${icon}</span> <span class="layer-name">${typeName}</span>
        </div>
        <div class="layer-controls">
          <button class="layer-lock" style="opacity: ${fabricObject.locked ? '1' : '0.3'}; "><i class="uil ${fabricObject.locked ? 'uil-lock-alt' : 'uil-lock-open-alt'}"></i></button>
          <button class="layer-visibility" style="opacity: ${fabricObject.visible ? '1' : '0.5'}; "><i class="uil ${fabricObject.visible ? 'uil-eye' : 'uil-eye-slash'}"></i></button>
          <button class="layer-delete"><i class="uil uil-trash-alt"></i></button>
        </div>
      `;

      // Add drag and drop events
      layer.addEventListener('dragstart', (e) => {
        draggedItem = layer;
        layer.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';

        // Create a placeholder
        placeholder = document.createElement('div');
        placeholder.className = 'layer-item-placeholder';
        placeholder.style.cssText = `height: ${layer.offsetHeight}px;`;
      });

      layer.addEventListener('dragend', () => {
        layer.style.opacity = '1';
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
        draggedItem = null;
        placeholder = null;
      });

      layer.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItem !== layer) {
          const rect = layer.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;

          if (e.clientY < midY) {
            layer.parentNode.insertBefore(placeholder, layer);
          } else {
            layer.parentNode.insertBefore(placeholder, layer.nextSibling);
          }
        }
      });

      // Add events
      layer.querySelector('.layer-visibility').addEventListener('click', (e) => {
        e.stopPropagation();
        fabricObject.visible = !fabricObject.visible;
        e.target.style.opacity = fabricObject.visible ? '1' : '0.5';
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
      });

      layer.querySelector('.layer-lock').addEventListener('click', (e) => {
        e.stopPropagation();
        fabricObject.lockMovementX = !fabricObject.lockMovementX;
        fabricObject.lockMovementY = !fabricObject.lockMovementY;
        fabricObject.lockScalingX = !fabricObject.lockScalingX;
        fabricObject.lockScalingY = !fabricObject.lockScalingY;
        fabricObject.lockRotation = !fabricObject.lockRotation;
        fabricObject.lockUniScaling = !fabricObject.lockUniScaling;
        fabricObject.lockSkewingX = !fabricObject.lockSkewingX;
        fabricObject.lockSkewingY = !fabricObject.lockSkewingY;
        fabricObject.hasControls = !fabricObject.hasControls;
        fabricObject.hasRotatingPoint = !fabricObject.hasRotatingPoint;
        fabricObject.locked = !fabricObject.locked;                
        e.target.style.opacity = fabricObject.locked ? '1' : '0.5';
        _self.canvas.fire("layer:locked");
        _self.canvas.fire("object:modified");
        _self.canvas.renderAll();
      });

      layer.querySelector('.layer-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        _self.canvas.remove(fabricObject);
        layer.remove();
        _self.canvas.renderAll();
      });

      layer.addEventListener('click', () => {
        _self.canvas.setActiveObject(fabricObject);
        _self.canvas.renderAll();
      });

      layersList.appendChild(layer);
      return layer;
    }

    // Update layers list when objects are added or removed
    function updateLayersList() {
      updateZIndices();

      layersList.innerHTML = '';
      const objects = _self.canvas.getObjects().filter(obj => {
        // Filter out guide lines
        // Não retorna objetos que são guias ou margens
        return (
          (!obj.metadata || (!obj.metadata.isGuide && !obj.metadata.isMargin)) &&
          (!obj.id || (!obj.id.startsWith('vertical-') && !obj.id.startsWith('horizontal-')) )
          && !obj.isTemporary
        );
      }).reverse(); // Reverse object order
      
      objects.slice().reverse().forEach(obj => {
        const layerItem = createLayerItem(obj);
        // Highlight item if it's the selected object
        if (_self.canvas.getActiveObject() === obj) {
          layerItem.style.background = '#e4e4e4';
          // layerItem.style.outline = '2px solid #6d6d6d';
        }
      });
    }

    function addIdToObject(obj) {
      if (!obj.id) {
        const timestamp = new Date().getTime();
        obj.id = `${obj.type}-${timestamp}`;
      }
    }

    function updateZIndices() {
      const objects = _self.canvas.getObjects();
      objects.forEach((obj, index) => {
        addIdToObject(obj);
        obj.zIndex = index;
      });
    }

    // Add canvas event listeners
    _self.canvas.on('object:added', updateLayersList);
    _self.canvas.on('object:removed', updateLayersList);
    _self.canvas.on('object:modified', updateLayersList);
    _self.canvas.on('selection:created', updateLayersList);
    _self.canvas.on('selection:updated', updateLayersList);
    _self.canvas.on('selection:cleared', updateLayersList);

    // Update initial list
    updateLayersList();
  }

  // Add function to ImageEditor prototype
  if (window.ImageEditor) {
    window.ImageEditor.prototype.initializeLayers = initializeLayers;
  }
})();