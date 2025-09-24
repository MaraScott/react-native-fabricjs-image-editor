/**
 * Implementação de frames/molduras para o editor de imagens Fabric.js
 * Permite que o usuário coloque imagens dentro de formas, similar ao recurso de Frames do Canva
 */
(function () {
  'use strict';

  // Adicionar imediatamente o botão frames aos botões padrão do toolbar
  // Isso deve ser feito antes de qualquer outra coisa
  // Esta parte é crucial para que o botão apareça na barra de ferramentas
  if (typeof window.ImageEditor !== 'undefined' && 
      typeof window.ImageEditor.prototype.initializeToolbar !== 'undefined') {
    
    // Definir o botão de frames
    const framesButton = {
      name: 'frames',
      title: 'Molduras',
      icon: `<svg viewBox="0 0 512 512"><path d="M448 128v288H64V128h384m0-64H64C28.65 64 0 92.65 0 128v288c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64V128c0-35.35-28.65-64-64-64z"/><path d="M128 384h256v-32H128zM128 288h256v-32H128zM128 192h256v-32H128z"/></svg>`
    };
    
    // Adicionar ao defaultButtons do toolbar se não existir ainda
    if (!window.ImageEditor.prototype.initializeToolbar.defaultButtons) {
      window.ImageEditor.prototype.initializeToolbar.defaultButtons = [];
    }
    
    // Verificar se já existe o botão na lista padrão
    let exists = false;
    for (let i = 0; i < window.ImageEditor.prototype.initializeToolbar.defaultButtons.length; i++) {
      if (window.ImageEditor.prototype.initializeToolbar.defaultButtons[i].name === 'frames') {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      window.ImageEditor.prototype.initializeToolbar.defaultButtons.push(framesButton);
    }
  }

  // Definição de formas básicas para molduras
  const frameShapes = {
    rectangle: function(size) {
      return new fabric.Rect({
        width: size,
        height: size,
        originX: 'center',
        originY: 'center'
      });
    },
    
    circle: function(size) {
      return new fabric.Circle({
        radius: size / 2,
        originX: 'center',
        originY: 'center'
      });
    },
    
    triangle: function(size) {
      return new fabric.Triangle({
        width: size,
        height: size,
        originX: 'center',
        originY: 'center'
      });
    },
    
    ellipse: function(size) {
      return new fabric.Ellipse({
        rx: size / 2,
        ry: size / 3,
        originX: 'center',
        originY: 'center'
      });
    },
    
    diamond: function(size) {
      const points = [
        { x: 0, y: -size/2 },
        { x: size/2, y: 0 },
        { x: 0, y: size/2 },
        { x: -size/2, y: 0 }
      ];
      return new fabric.Polygon(points, {
        originX: 'center',
        originY: 'center'
      });
    },
    
    heart: function(size) {
      const scale = size / 100;
      const points = [
        { x: 0, y: -25 * scale },
        { x: -25 * scale, y: -10 * scale },
        { x: -40 * scale, y: 10 * scale },
        { x: -25 * scale, y: 30 * scale },
        { x: 0, y: 50 * scale },
        { x: 25 * scale, y: 30 * scale },
        { x: 40 * scale, y: 10 * scale },
        { x: 25 * scale, y: -10 * scale }
      ];
      return new fabric.Polygon(points, {
        originX: 'center',
        originY: 'center'
      });
    },
    
    star: function(size) {
      const points = [];
      const outerRadius = size / 2;
      const innerRadius = size / 5;
      const spikes = 5;
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i + Math.PI / 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      
      return new fabric.Polygon(points, {
        originX: 'center',
        originY: 'center'
      });
    },
    
    hexagon: function(size) {
      const points = [];
      const radius = size / 2;
      const sides = 6;
      
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i / sides);
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        });
      }
      
      return new fabric.Polygon(points, {
        originX: 'center',
        originY: 'center'
      });
    },
    
    cloud: function(size) {
      const path = 'M25,60 a20,20 0 0,1 0,-40 a20,20 0 0,1 35,-15 a25,25 0 0,1 45,0 a20,20 0 0,1 0,40 a20,20 0 0,1 -35,15 a25,25 0 0,1 -45,0 z';
      return new fabric.Path(path, {
        originX: 'center',
        originY: 'center',
        scaleX: size / 100,
        scaleY: size / 100
      });
    },
    
    speech: function(size) {
      const path = 'M10,80 C10,50 30,20 60,20 C90,20 110,50 110,80 C110,110 90,140 60,140 C50,140 30,140 25,150 C20,160 20,170 15,170 C11,170 10,160 15,150 C20,140 10,110 10,80 z';
      return new fabric.Path(path, {
        originX: 'center',
        originY: 'center',
        scaleX: size / 120,
        scaleY: size / 170
      });
    },
    
    // Novas formas adicionadas
    octagon: function(size) {
      const points = [];
      const radius = size / 2;
      const sides = 8;
      
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i / sides);
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        });
      }
      
      return new fabric.Polygon(points, {
        originX: 'center',
        originY: 'center'
      });
    },
    
    flowerFrame: function(size) {
      const path = 'M50,0 C60,30 90,40 100,50 C90,60 60,70 50,100 C40,70 10,60 0,50 C10,40 40,30 50,0 Z';
      return new fabric.Path(path, {
        originX: 'center',
        originY: 'center',
        scaleX: size / 100,
        scaleY: size / 100
      });
    },
    
    drop: function(size) {
      const path = 'M50,0 C80,40 100,80 100,110 C100,150 80,180 50,180 C20,180 0,150 0,110 C0,80 20,40 50,0 Z';
      return new fabric.Path(path, {
        originX: 'center',
        originY: 'center',
        scaleX: size / 180,
        scaleY: size / 180
      });
    },
    
    cross: function(size) {
      const path = 'M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z';
      return new fabric.Path(path, {
        originX: 'center',
        originY: 'center',
        scaleX: size / 100,
        scaleY: size / 100
      });
    }
  };
  
  // Função para aplicar uma forma como máscara para uma imagem
  function applyFrameToImage(canvas, shapeName, options = {}) {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject || !activeObject.type || activeObject.type !== 'image') {
      // Mostrar notificação ao invés de alerta
      if (canvas.fire) {
        canvas.fire('notification:show', {
          message: 'Por favor, selecione uma imagem primeiro',
          type: 'error'
        });
      } else {
        alert('Por favor, selecione uma imagem primeiro');
      }
      return;
    }
    
    if (!frameShapes[shapeName]) {
      if (canvas.fire) {
        canvas.fire('notification:show', {
          message: 'Erro: forma não encontrada',
          type: 'error'
        });
      } else {
        alert('Erro: forma não encontrada');
      }
      return;
    }
    
    // Criar nova forma baseada no shapeName
    const shape = frameShapes[shapeName](200);
    
    // Redimensionar a forma para corresponder ao tamanho da imagem
    const width = activeObject.width * activeObject.scaleX;
    const height = activeObject.height * activeObject.scaleY;
    
    // Salvar ângulo e escala atuais
    const originalAngle = activeObject.angle;
    const originalScaleX = activeObject.scaleX;
    const originalScaleY = activeObject.scaleY;
    
    // Resetar ângulo para aplicar o clip corretamente
    activeObject.set({
      angle: 0
    });
    
    // Aplicar opções personalizadas ao frame
    const frameOptions = {
      left: 0,
      top: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 'center',
      originY: 'center',
      fill: 'transparent',
      stroke: options.stroke || '#000000',
      strokeWidth: options.strokeWidth || 0,
      strokeDashArray: options.strokeDashArray || null
    };
    
    shape.set(frameOptions);
    
    // Dimensionar a forma para combinar com as proporções da imagem
    const frameAspectRatio = shape.width / shape.height;
    const imageAspectRatio = width / height;
    
    if (frameAspectRatio > imageAspectRatio) {
      // A forma é mais larga que a imagem, dimensionar pela altura
      shape.scaleToHeight(height);
      shape.scaleToWidth(height * frameAspectRatio);
    } else {
      // A forma é mais alta que a imagem, dimensionar pela largura
      shape.scaleToWidth(width);
      shape.scaleToHeight(width / frameAspectRatio);
    }
    
    // Aplicar como clipPath à imagem
    activeObject.clipPath = shape;
    
    // Centralizar clipPath na imagem
    activeObject.clipPath.set({
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0
    });
    
    // Restaurar ângulo original
    activeObject.set({
      angle: originalAngle
    });
    
    // Adicionar propriedades para rastrear o frame aplicado
    activeObject.frameType = shapeName;
    activeObject.frameOptions = frameOptions;
    
    // Registrar para desfazer/refazer
    if (canvas.fire) {
      canvas.fire('object:modified', { target: activeObject });
    }
    
    canvas.renderAll();
    
    // Exibir notificação de sucesso
    if (canvas.fire) {
      canvas.fire('notification:show', {
        message: 'Moldura aplicada com sucesso',
        type: 'success'
      });
    }
  }

  // Função para atualizar propriedades do frame
  function updateFrameProperties(canvas, options) {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject || !activeObject.clipPath) {
      return;
    }
    
    // Atualizar propriedades do clipPath
    activeObject.clipPath.set({
      stroke: options.stroke || activeObject.clipPath.stroke,
      strokeWidth: options.strokeWidth || activeObject.clipPath.strokeWidth,
      strokeDashArray: options.strokeDashArray || activeObject.clipPath.strokeDashArray
    });
    
    // Atualizar as opções salvas
    activeObject.frameOptions = {
      ...activeObject.frameOptions,
      ...options
    };
    
    // Registrar para desfazer/refazer
    if (canvas.fire) {
      canvas.fire('object:modified', { target: activeObject });
    }
    
    canvas.renderAll();
  }

  // Função para remover o frame/moldura de uma imagem
  function removeFrameFromImage(canvas) {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject || !activeObject.type || activeObject.type !== 'image' || !activeObject.clipPath) {
      if (canvas.fire) {
        canvas.fire('notification:show', {
          message: 'Selecione uma imagem com moldura para remover',
          type: 'warning'
        });
      } else {
        alert('Selecione uma imagem com moldura para remover');
      }
      return;
    }
    
    // Remover o clipPath
    activeObject.clipPath = null;
    activeObject.frameType = null;
    activeObject.frameOptions = null;
    
    // Registrar para desfazer/refazer
    if (canvas.fire) {
      canvas.fire('object:modified', { target: activeObject });
    }
    
    canvas.renderAll();
    
    // Exibir notificação de sucesso
    if (canvas.fire) {
      canvas.fire('notification:show', {
        message: 'Moldura removida com sucesso',
        type: 'success'
      });
    }
  }
  
  var frames = function() {
    const _self = this;
    
    // Criar o painel de frames
    const framesPanelId = 'frames-panel';
    
    $(`${this.containerSelector} .main-panel`).append(`
      <div class="toolpanel" id="${framesPanelId}">
        <div class="content">
          <p class="title">Molduras</p>
          <div class="frames-container">
            <div class="frames-list"></div>
          </div>
          <div class="frame-properties" style="display: none;">
            <h4>Propriedades da Moldura</h4>
            <div class="input-container">
              <label>Cor da Borda</label>
              <input id="frame-border-color" type="text" value="#000000">
            </div>
            <div class="input-container">
              <label>Espessura da Borda</label>
              <div class="custom-number-input">
                <button class="decrease">-</button>
                <input type="number" min="0" max="20" value="0" step="1" id="frame-border-width">
                <button class="increase">+</button>
              </div>
            </div>
            <div class="input-container">
              <label>Estilo da Borda</label>
              <select id="frame-border-style">
                <option value="">Sólida</option>
                <option value="5,5">Tracejada</option>
                <option value="10,10">Pontilhada</option>
                <option value="15,10,5,10">Traço-Ponto</option>
              </select>
            </div>
          </div>
          <hr>
          <div class="toolpanel-item frames-actions">
            <button id="remove-frame" class="btn btn-danger btn-sm btn-block">Remover Moldura</button>
          </div>
        </div>
        <div class="hide-show-handler"></div>
      </div>
    `);
    
    // Inicializar o colorpicker para a cor da borda
    $(`${this.containerSelector} #frame-border-color`).spectrum({
      color: "#000000",
      showInput: true,
      preferredFormat: "hex",
      change: function(color) {
        updateFrameProperties(_self.canvas, { stroke: color.toHexString() });
      }
    });
    
    // Manipuladores de eventos para as propriedades da moldura
    $(`${this.containerSelector} #frame-border-width`).on('change', function() {
      updateFrameProperties(_self.canvas, { strokeWidth: parseFloat($(this).val()) });
    });
    
    $(`${this.containerSelector} #frame-border-style`).on('change', function() {
      const value = $(this).val();
      let dashArray = null;
      
      if (value) {
        dashArray = value.split(',').map(Number);
      }
      
      updateFrameProperties(_self.canvas, { strokeDashArray: dashArray });
    });
    
    // Mostrar/ocultar propriedades da moldura com base na seleção
    this.canvas.on('selection:created', function(e) {
      updateFramePropertiesPanel(e.selected[0]);
    });
    
    this.canvas.on('selection:updated', function(e) {
      updateFramePropertiesPanel(e.selected[0]);
    });
    
    this.canvas.on('selection:cleared', function() {
      $(`${_self.containerSelector} .frame-properties`).hide();
    });
    
    function updateFramePropertiesPanel(obj) {
      if (obj && obj.type === 'image' && obj.clipPath) {
        $(`${_self.containerSelector} .frame-properties`).show();
        
        // Atualizar os valores dos controles
        $(`${_self.containerSelector} #frame-border-color`).spectrum('set', obj.clipPath.stroke || '#000000');
        $(`${_self.containerSelector} #frame-border-width`).val(obj.clipPath.strokeWidth || 0);
        
        let dashArrayValue = '';
        if (obj.clipPath.strokeDashArray) {
          dashArrayValue = obj.clipPath.strokeDashArray.join(',');
        }
        $(`${_self.containerSelector} #frame-border-style`).val(dashArrayValue);
      } else {
        $(`${_self.containerSelector} .frame-properties`).hide();
      }
    }
    
    // Preencher a lista de frames
    const framesList = $(`${this.containerSelector} .frames-list`);
    
    Object.keys(frameShapes).forEach(shapeName => {
      const frameItem = $(`<div class="frame-item" data-shape="${shapeName}">
        <div class="frame-preview">
          <canvas width="60" height="60"></canvas>
        </div>
        <div class="frame-name">${shapeName.charAt(0).toUpperCase() + shapeName.slice(1)}</div>
      </div>`);
      
      framesList.append(frameItem);
      
      // Renderizar visualização do frame
      const canvas = frameItem.find('canvas')[0];
      const fCanvas = new fabric.StaticCanvas(canvas);
      
      // Criar forma de preview
      const shape = frameShapes[shapeName](40);
      shape.set({
        left: 30,
        top: 30,
        fill: 'rgba(0, 0, 0, 0.1)',
        stroke: '#666',
        strokeWidth: 1
      });
      
      fCanvas.add(shape);
      fCanvas.renderAll();
      
      // Adicionar evento de clique
      frameItem.on('click', function() {
        applyFrameToImage(_self.canvas, shapeName, {
          stroke: $(`${_self.containerSelector} #frame-border-color`).spectrum('get').toHexString(),
          strokeWidth: parseFloat($(`${_self.containerSelector} #frame-border-width`).val()),
          strokeDashArray: $(`${_self.containerSelector} #frame-border-style`).val() ? 
                          $(`${_self.containerSelector} #frame-border-style`).val().split(',').map(Number) : 
                          null
        });
      });
    });
    
    // Adicionar evento para o botão de remover moldura
    $(`${this.containerSelector} #remove-frame`).on('click', function() {
      removeFrameFromImage(_self.canvas);
    });
    
    // Adicionar CSS específico para o painel de frames
    $('head').append(`
      <style>
        .frames-container {
          padding: 10px 0;
          max-height: 400px;
          overflow-y: auto;
        }
        .frames-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .frame-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .frame-item:hover {
          background-color: #f0f0f0;
        }
        .frame-preview {
          width: 60px;
          height: 60px;
          border: 1px solid #ddd;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          border-radius: 4px;
          overflow: hidden;
        }
        .frame-name {
          font-size: 12px;
          text-align: center;
        }
        .frame-properties h4 {
          margin-top: 15px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        #remove-frame {
          width: 100%;
          background-color: #ff3860;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 15px;
        }
        #remove-frame:hover {
          background-color: #e71a48;
        }
      </style>
    `);
  }
  
  // Função para inicializar o componente de frames
  window.ImageEditor.prototype.initializeFrames = frames;
  
  // Modificar o método init original para adicionar o suporte a frames
  const originalInit = window.ImageEditor.prototype.init;
  window.ImageEditor.prototype.init = function() {
    // Chamar o método init original
    if (originalInit && typeof originalInit === 'function') {
      originalInit.call(this);
    }
    
    // Inicializar o componente de frames
    this.initializeFrames();
  };
})(); 