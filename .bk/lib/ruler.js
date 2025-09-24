/**
 * Ruler and guides implementation for image editor
 */
(function () {
  'use strict';

  var ruler = function() {
    const _self = this;
    const RULER_HEIGHT = 20; // altura da régua em pixels
    const GUIDE_COLOR = 'rgba(0, 162, 255, 0.5)';
    const GUIDE_SELECTED_COLOR = 'rgba(0, 162, 255, 0.8)';
    const MARGIN_COLOR = 'rgba(255, 0, 0, 0.5)';
    const SNAP_THRESHOLD = 10; // distância para ativar o snap em pixels
    
    // Constantes para localStorage
    const STORAGE_KEY_RULERS_VISIBLE = 'imageEditor_rulersVisible';
    const STORAGE_KEY_MARGINS_CONFIG = 'imageEditor_marginsConfig';
    
    // Armazenar configuração de margens de respiro
    this.margins = {
      show: false,
      top: 70,
      right: 70,
      bottom: 70,
      left: 70
    };

    // Salvar configurações no localStorage
    this.saveRulerSettings = function() {
      if (window.saveInBrowser) {
        try {
          // Salvar visibilidade das réguas
          window.saveInBrowser.save(STORAGE_KEY_RULERS_VISIBLE, this.isRulersVisible);
          
          // Salvar configuração de margens
          window.saveInBrowser.save(STORAGE_KEY_MARGINS_CONFIG, this.margins);
                  } catch (error) {
          console.error('Erro ao salvar configurações de réguas:', error);
        }
      }
    };
    
    // Carregar configurações do localStorage
    this.loadRulerSettings = function() {
      if (window.saveInBrowser) {
        try {
          // Carregar visibilidade das réguas
          const rulersVisible = window.saveInBrowser.load(STORAGE_KEY_RULERS_VISIBLE);
          if (rulersVisible !== null && rulersVisible !== undefined) {
            this.isRulersVisible = rulersVisible;
          }
          
          // Carregar configuração de margens
          const marginsConfig = window.saveInBrowser.load(STORAGE_KEY_MARGINS_CONFIG);
          if (marginsConfig) {
            this.margins = marginsConfig;
          }
        } catch (error) {
          console.error('Erro ao carregar configurações de réguas:', error);
        }
      }
    };

    // Adicionar elementos DOM para as réguas
    this.initRulers = function() {
      // Adicionar os elementos de régua para horizontal e vertical
      $(`${this.containerSelector}  .canvas-holder .content`).append(
        `<canvas id="ruler-horizontal" class="ruler horizontal-ruler"></canvas>
         <canvas id="ruler-vertical" class="ruler vertical-ruler"></canvas>
         <div id="ruler-corner" class="ruler-corner"></div>
         <div id="ruler-menu" class="ruler-menu" style="display: none;">
           <button id="toggle-margins">Mostrar margens</button>
           <button id="clear-guides">Limpar guias</button>
         </div>`
      );

      // Estilizar as réguas
      $(`${this.containerSelector} .horizontal-ruler`).css({
        'position': 'absolute',
        'top': '0',
        'left': `${RULER_HEIGHT}px`,
        'height': `${RULER_HEIGHT}px`,
        'right': '0',
        'background-color': '#f0f0f0',
        'border-bottom': '1px solid #ccc',
        'display': 'none'
      });

      $(`${this.containerSelector} .vertical-ruler`).css({
        'position': 'absolute',
        'top': `${RULER_HEIGHT}px`,
        'left': '0',
        'width': `${RULER_HEIGHT}px`,
        'bottom': '0',
        'background-color': '#f0f0f0',
        'border-right': '1px solid #ccc',
        'display': 'none'
      });

      $(`${this.containerSelector} .ruler-corner`).css({
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'width': `${RULER_HEIGHT}px`,
        'height': `${RULER_HEIGHT}px`,
        'background-color': '#f0f0f0',
        'border-right': '1px solid #ccc',
        'border-bottom': '1px solid #ccc',
        'display': 'none',
        'cursor': 'pointer'
      });

      $(`${this.containerSelector} .ruler-menu`).css({
        'position': 'absolute',
        'top': `${RULER_HEIGHT + 5}px`,
        'left': `${RULER_HEIGHT + 5}px`,
        'padding': '5px',
        'background-color': '#fff',
        'border': '1px solid #ccc',
        'border-radius': '4px',
        'box-shadow': '0px 2px 5px rgba(0,0,0,0.2)',
        'z-index': '1000'
      });

      $(`${this.containerSelector} .ruler-menu button`).css({
        'display': 'block',
        'margin': '5px 0',
        'padding': '5px 10px',
        'width': '100%',
        'text-align': 'left',
        'background': 'none',
        'border': 'none',
        'cursor': 'pointer'
      });

      $(`${this.containerSelector} .ruler-menu button:hover`).css({
        'background-color': '#f0f0f0'
      });

      // Inicializar os canvas das réguas
      this.horizontalRuler = document.getElementById('ruler-horizontal');
      this.verticalRuler = document.getElementById('ruler-vertical');
      
      if (this.horizontalRuler && this.verticalRuler) {
        this.ctxH = this.horizontalRuler.getContext('2d');
        this.ctxV = this.verticalRuler.getContext('2d');
      }
      
      // Configurar evento para o canto da régua
      $(`${this.containerSelector} .ruler-corner`).click(function(e) {
        const menu = $(`${_self.containerSelector} .ruler-menu`);
        if (menu.is(':visible')) {
          menu.hide();
        } else {
          menu.show();
        }
        e.stopPropagation();
      });

      // Esconder menu ao clicar fora dele
      $(document).click(function(e) {
        if (!$(e.target).closest('.ruler-corner, .ruler-menu').length) {
          $(`${_self.containerSelector} .ruler-menu`).hide();
        }
      });

      // Configurar eventos do menu
      $(`${this.containerSelector} #toggle-margins`).click(function() {
        _self.margins.show = !_self.margins.show;
        $(this).text(_self.margins.show ? 'Ocultar margens' : 'Mostrar margens');
        _self.drawCanvasElements();
        $(`${_self.containerSelector} .ruler-menu`).hide();
        
        // Salvar configurações após alteração
        _self.saveRulerSettings();
      });

      $(`${this.containerSelector} #clear-guides`).click(function() {
        _self.clearGuides();
        $(`${_self.containerSelector} .ruler-menu`).hide();
      });
      
      // Redimensionar as réguas baseado no tamanho do canvas depois que o canvas estiver pronto
      // Não chamar resizeRulers aqui para evitar o acesso ao canvas que ainda não está definido
    };

    // Redimensionar as réguas
    this.resizeRulers = function() {
      if (!this.canvas) return;
      
      try {
        const container = document.querySelector(this.containerSelector + '  .canvas-holder .content');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Obter a posição do canvas-container
        const canvasContainer = document.querySelector(this.containerSelector + ' .canvas-container');
        const containerRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
        const containerLeft = containerRect ? containerRect.left : 0;
        
        // Ajustar largura e altura das réguas
        this.horizontalRuler.width = containerWidth - RULER_HEIGHT;
        this.horizontalRuler.height = RULER_HEIGHT;
        this.verticalRuler.width = RULER_HEIGHT;
        this.verticalRuler.height = containerHeight - RULER_HEIGHT;
        
        // Ajustar posição das réguas
        this.horizontalRuler.style.left = RULER_HEIGHT + 'px';
        this.horizontalRuler.style.top = '0';
        this.verticalRuler.style.left = '0';
        this.verticalRuler.style.top = RULER_HEIGHT + 'px';
        
        // Redesenhar as réguas
        this.drawRulers();
      } catch (error) {
        console.error("Erro ao redimensionar réguas:", error);
      }
    };

    // Desenhar margens de respiro
    this.drawMargins = function() {
      if (!this.margins.show || !this.canvas) return;
      
      this.logCanvasDimensions('drawMargins');
      
      // Limites do canvas - usar this.dimensions se disponível
      const canvasWidth = this.dimensions ? this.dimensions.width : (this.canvas.width || 1000);
      const canvasHeight = this.dimensions ? this.dimensions.height : (this.canvas.height || 1000);

      // Log para debug das dimensões
      console.log('Dimensões do canvas para margens:', canvasWidth, 'x', canvasHeight);

      // Calcular posições das margens
      const marginLeft = this.margins.left;
      const marginRight = canvasWidth - this.margins.right;
      const marginTop = this.margins.top;
      const marginBottom = canvasHeight - this.margins.bottom;

      // Criar retângulos para representar as margens
      // Criar ou atualizar as linhas de margem
      this.updateOrCreateMargin('marginTop', [0, marginTop, canvasWidth, marginTop]);
      this.updateOrCreateMargin('marginRight', [marginRight, 0, marginRight, canvasHeight]);
      this.updateOrCreateMargin('marginBottom', [0, marginBottom, canvasWidth, marginBottom]);
      this.updateOrCreateMargin('marginLeft', [marginLeft, 0, marginLeft, canvasHeight]);
    };

    // Atualizar ou criar uma linha de margem
    this.updateOrCreateMargin = function(id, coords) {
      if (!this.canvas) return null; // Verificar se o canvas existe
      
      // Verificar se a margem já existe
      let margin = this.canvas.getObjects().find(obj => obj.metadata && obj.metadata.isMargin && obj.metadata.id === id);
      if (margin) {
        // Atualizar a posição da linha existente
        margin.set({
          x1: coords[0],
          y1: coords[1],
          x2: coords[2],
          y2: coords[3],
          excludeFromExport: true
        });
      } else {

        if(id === 'marginTop' || id === 'marginBottom') {
        // Criar uma nova linha
        margin = new fabric.Line(coords, {
          stroke: MARGIN_COLOR,
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          evented: true,
          lockMovementX: true,
          lockMovementY: false,

          hasControls: false,
          hasBorders: true,
          hoverCursor: 'ns-resize',
          moveCursor: 'ns-resize',
          padding: 5,
          originX: 'center',
          originY: 'center',        
            
          excludeFromExport: true,
          metadata: { isMargin: true, id: id , isHorizontal: true }
        });
      } else {
        // Criar uma nova linha
        margin = new fabric.Line(coords, {
          stroke: MARGIN_COLOR,
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: true,

          hasControls: false,
          hasBorders: true,
          hoverCursor: 'ew-resize',
          moveCursor: 'ew-resize',
          padding: 5,
          originX: 'center',
          originY: 'center',        
            
          excludeFromExport: true,
          metadata: { isMargin: true, id: id, isHorizontal: false }
        });
      }
        this.canvas.add(margin);
      }
      
      return margin;
    };

    // Limpar todas as guias
    this.clearGuides = function() {
      if (!this.canvas) return; // Verificar se o canvas existe
      
      const guides = this.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isGuide);
      guides.forEach(guide => {
        this.canvas.remove(guide);
      });
      this.canvas.renderAll();
    };

    // Limpar as margens
    this.clearMargins = function() {
      if (!this.canvas) return; // Verificar se o canvas existe
      
      const margins = this.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isMargin);
      margins.forEach(margin => {
        this.canvas.remove(margin);
      });
      this.canvas.renderAll();
    };

    // Desenhar as réguas
    this.drawRulers = function() {
      if (!this.ctxH || !this.ctxV || !this.canvas) return;
      
      try {
        const zoom = this.canvas.getZoom();
        const vp = this.canvas.viewportTransform;
        
        // Limpar os canvas das réguas
        this.ctxH.clearRect(0, 0, this.horizontalRuler.width, this.horizontalRuler.height);
        this.ctxV.clearRect(0, 0, this.verticalRuler.width, this.verticalRuler.height);
        
        // Configurar o estilo de desenho
        this.ctxH.font = '9px Arial';
        this.ctxH.fillStyle = '#666';
        this.ctxH.strokeStyle = '#666';
        
        this.ctxV.font = '9px Arial';
        this.ctxV.fillStyle = '#666';
        this.ctxV.strokeStyle = '#666';
        
        // Desenhar a régua horizontal
        const stepSize = zoom >= 1 ? 10 : 50; // Ajustar a escala com base no zoom
        
        // Calcular ponto de início baseado no viewport e ajustar para a posição do canvas-container
        const canvasContainer = document.querySelector(this.containerSelector + ' .canvas-container');
        const containerRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
        const containerLeft = containerRect ? containerRect.left : 0;
        
        const startX = Math.floor(-vp[4] / zoom / stepSize) * stepSize;
        const startY = Math.floor(-vp[5] / zoom / stepSize) * stepSize;
        
        // Desenhar marcações na régua horizontal
        for (let i = startX; i <= startX + (this.horizontalRuler.width / zoom); i += stepSize) {
          const x = (i - startX) * zoom + vp[4];
          
          // Desenhar marcação maior a cada 100 pixels
          const isMajor = i % 100 === 0;
          const tickHeight = isMajor ? 15 : 10;
          
          this.ctxH.beginPath();
          this.ctxH.moveTo(x, RULER_HEIGHT);
          this.ctxH.lineTo(x, RULER_HEIGHT - tickHeight);
          this.ctxH.stroke();
          
          if (isMajor) {
            this.ctxH.fillText(i.toString(), x + 2, 10);
          }
        }
        
        // Desenhar a régua vertical
        for (let i = startY; i <= startY + (this.verticalRuler.height / zoom); i += stepSize) {
          const y = (i - startY) * zoom + vp[5];
          
          // Desenhar marcação maior a cada 100 pixels
          const isMajor = i % 100 === 0;
          const tickWidth = isMajor ? 15 : 10;
          
          this.ctxV.beginPath();
          this.ctxV.moveTo(RULER_HEIGHT, y);
          this.ctxV.lineTo(RULER_HEIGHT - tickWidth, y);
          this.ctxV.stroke();
          
          if (isMajor) {
            // Salvar contexto para rotacionar o texto
            this.ctxV.save();
            this.ctxV.translate(10, y + 10);
            this.ctxV.rotate(-Math.PI/2);
            this.ctxV.fillText(i.toString(), 0, 0);
            this.ctxV.restore();
          }
        }
        
        // IMPORTANTE: NÃO chamar drawRulerCursors aqui para evitar recursão infinita
        // Se precisarmos mostrar o cursor nas réguas, precisamos fazer isso separadamente
        if (this.lastMousePosition) {
          this.drawCursorOnly(this.lastMousePosition.x, this.lastMousePosition.y);
        }
      } catch (error) {
        console.error("Erro ao desenhar réguas:", error);
      }
    };
    
    // Novo método para desenhar APENAS o cursor, sem redesenhar as réguas
    this.drawCursorOnly = function(x, y) {
      if (!this.isRulersVisible || !this.ctxH || !this.ctxV) return;
      
      try {
        const canvasContainer = document.querySelector(`${this.containerSelector}  .canvas-holder .content`);
        if (!canvasContainer) return;
        
        const rect = canvasContainer.getBoundingClientRect();
        
        // Converter para coordenadas relativas ao canvas
        const containerX = x - rect.left;
        const containerY = y - rect.top;
        
        // Desenhar cursor na régua horizontal
        if (containerX > RULER_HEIGHT) {
          this.ctxH.fillStyle = "rgba(255, 0, 0, 0.5)";
          this.ctxH.fillRect(containerX - RULER_HEIGHT, 0, 1, RULER_HEIGHT);
        }
        
        // Desenhar cursor na régua vertical
        if (containerY > RULER_HEIGHT) {
          this.ctxV.fillStyle = "rgba(255, 0, 0, 0.5)";
          this.ctxV.fillRect(0, containerY - RULER_HEIGHT, RULER_HEIGHT, 1);
        }
      } catch (error) {
        console.error("Erro ao desenhar cursor nas réguas:", error);
      }
    };

    // Desenhar todos os elementos relacionados ao canvas
    this.drawCanvasElements = function() {
      if (!this.canvas) return; // Verificar se o canvas existe
      
      if (this.margins.show) {
        this.drawMargins();
      } else {
        this.clearMargins();
      }
      this.canvas.renderAll();
    };

    // Adicionar uma guia - versão reescrita para maior compatibilidade
    this.addGuide = function(isHorizontal, position) {
      if (!this.canvas) {
        console.error("Canvas não está disponível para adicionar guia");
        return null;
      }
      
      try {
        this.logCanvasDimensions('addGuide início');
        
        // Obter as dimensões reais do canvas a partir do objeto dimensions
        const canvasWidth = this.dimensions ? this.dimensions.width : (this.canvas.width || 1000);
        const canvasHeight = this.dimensions ? this.dimensions.height : (this.canvas.height || 1000);
        
        // Calcular a posição no canvas
        const canvasElement = this.canvas.getElement();
        const rect = canvasElement.getBoundingClientRect();
        const zoom = this.canvas.getZoom();
        const vp = this.canvas.viewportTransform;
        
        // Converter posição da tela para posição no canvas
        let canvasPosition;
        if (isHorizontal) {
          // Para guias horizontais
          canvasPosition = (position - rect.top) / zoom - vp[5] / zoom;
          if (canvasPosition < 0) canvasPosition = 0;
          if (canvasPosition > canvasHeight) canvasPosition = canvasHeight;
        } else {
          // Para guias verticais
          canvasPosition = (position - rect.left) / zoom - vp[4] / zoom;
          if (canvasPosition < 0) canvasPosition = 0;
          if (canvasPosition > canvasWidth) canvasPosition = canvasWidth;
        }
        
        // Criar a guia como um objeto do tipo Line (mais básico e consistente)
        let guide;
        
        if (isHorizontal) {
          // Para guias horizontais
          guide = new fabric.Line([0, canvasPosition, canvasWidth, canvasPosition], {
            stroke: GUIDE_COLOR,
            strokeWidth: 3,
            selectable: true,
            evented: true,
            lockMovementX: true,  // Bloquear movimento horizontal para guias horizontais
            lockMovementY: false, // Permitir movimento vertical
            hasControls: false,
            hasBorders: true,
            hoverCursor: 'ns-resize',
            moveCursor: 'ns-resize',
            padding: 5,
            originX: 'center',
            originY: 'center',
            opacity: 0.7,
            excludeFromExport: true,
            metadata: { isGuide: true, isHorizontal: true }
          });
        } else {
          // Para guias verticais
          guide = new fabric.Line([canvasPosition, 0, canvasPosition, canvasHeight], {
            stroke: GUIDE_COLOR,
            strokeWidth: 3,
            selectable: true,
            evented: true,
            lockMovementX: false, // Permitir movimento horizontal
            lockMovementY: true,  // Bloquear movimento vertical para guias verticais
            hasControls: false,
            hasBorders: true,
            hoverCursor: 'ew-resize',
            moveCursor: 'ew-resize',
            padding: 5,
            originX: 'center',
            originY: 'center',
            opacity: 0.7,
            excludeFromExport: true,
            metadata: { isGuide: true, isHorizontal: false }
          });
        }
        
        // Definir ordem de empilhamento para garantir que as guias fiquem acima de outros objetos
        // mas não interfiram com a seleção
        guide.active = false;
        
        // Adicionar a guia ao canvas
        this.canvas.add(guide);
        
        // Trazer a guia para o topo, mas abaixo de qualquer objeto ativo
        guide.bringToFront();
        
        // Garantir que a guia seja renderizada corretamente
        this.canvas.renderAll();

        // Selecionar a guia recém-criada
        this.canvas.setActiveObject(guide);

        return guide;
      } catch (error) {
        console.error("Erro ao adicionar guia:", error);
        return null;
      }
    };

    // Verificar se um objeto está próximo a uma guia ou margem para alinhamento
    this.checkSnapping = function(target) {
      if (!this.canvas || !target) return false; // Verificar se o canvas e o target existem
      
      // Se não for um objeto normal (for uma guia), não aplicar snap
      if (target.metadata && (target.metadata.isGuide || target.metadata.isMargin)) {
        return false;
      }
      
      try {
        const zoom = this.canvas.getZoom();
        const threshold = SNAP_THRESHOLD / zoom;
        
        // Obter limites do objeto
        const objectBounds = target.getBoundingRect();
        const objectLeft = objectBounds.left;
        const objectTop = objectBounds.top;
        const objectRight = objectBounds.left + objectBounds.width;
        const objectBottom = objectBounds.top + objectBounds.height;
        const objectCenterX = objectLeft + objectBounds.width / 2;
        const objectCenterY = objectTop + objectBounds.height / 2;
        
        // Obter todas as guias e margens
        const guides = this.canvas.getObjects().filter(obj => 
          obj.metadata && (obj.metadata.isGuide || obj.metadata.isMargin)
        );
        
        let closestSnap = null;
        let minDistance = threshold;
        
        guides.forEach(guide => {
          // Para guias horizontais e margens horizontais
          if ((guide.metadata.isGuide && guide.metadata.isHorizontal) || 
              (guide.metadata.isMargin && (guide.metadata.id === 'marginTop' || guide.metadata.id === 'marginBottom'))) {
            const guideY = guide.y1;
            
            // Snap para o topo
            const topDistance = Math.abs(guideY - objectTop);
            if (topDistance < minDistance) {
              minDistance = topDistance;
              closestSnap = { axis: 'y', target: objectTop, value: guideY, guide: guide };
            }
            
            // Snap para o centro
            const centerDistance = Math.abs(guideY - objectCenterY);
            if (centerDistance < minDistance) {
              minDistance = centerDistance;
              closestSnap = { axis: 'y', target: objectCenterY, value: guideY, guide: guide };
            }
            
            // Snap para o fundo
            const bottomDistance = Math.abs(guideY - objectBottom);
            if (bottomDistance < minDistance) {
              minDistance = bottomDistance;
              closestSnap = { axis: 'y', target: objectBottom, value: guideY, guide: guide };
            }
          } 
          // Para guias verticais e margens verticais
          else if ((guide.metadata.isGuide && !guide.metadata.isHorizontal) || 
                  (guide.metadata.isMargin && (guide.metadata.id === 'marginLeft' || guide.metadata.id === 'marginRight'))) {
            const guideX = guide.x1;
            
            // Snap para a esquerda
            const leftDistance = Math.abs(guideX - objectLeft);
            if (leftDistance < minDistance) {
              minDistance = leftDistance;
              closestSnap = { axis: 'x', target: objectLeft, value: guideX, guide: guide };
            }
            
            // Snap para o centro
            const centerDistance = Math.abs(guideX - objectCenterX);
            if (centerDistance < minDistance) {
              minDistance = centerDistance;
              closestSnap = { axis: 'x', target: objectCenterX, value: guideX, guide: guide };
            }
            
            // Snap para a direita
            const rightDistance = Math.abs(guideX - objectRight);
            if (rightDistance < minDistance) {
              minDistance = rightDistance;
              closestSnap = { axis: 'x', target: objectRight, value: guideX, guide: guide };
            }
          }
        });
        
        // Se encontrou um ponto de snap, aplicar
        if (closestSnap) {
          // Destaque visual temporário da guia
          if (closestSnap.guide.metadata.isGuide) {
            // Armazenar valores originais para restaurar depois
            const originalStroke = closestSnap.guide.stroke;
            const originalStrokeWidth = closestSnap.guide.strokeWidth;
            const originalOpacity = closestSnap.guide.opacity;
            
            // Aplicar destaque visual
            closestSnap.guide.set({ 
              stroke: GUIDE_SELECTED_COLOR, 
              strokeWidth: 2,
              opacity: 1
            });
          }
          
          // Aplicar o snap
          if (closestSnap.axis === 'y') {
            const deltaY = closestSnap.value - closestSnap.target;
            target.set({ top: target.top + deltaY });
          } else {
            const deltaX = closestSnap.value - closestSnap.target;
            target.set({ left: target.left + deltaX });
          }
          
          // Mostrar pequena animação/indicação de que ocorreu um snap
          // e restaurar a aparência normal da guia depois
          setTimeout(() => {
            if (closestSnap.guide && closestSnap.guide.metadata && closestSnap.guide.metadata.isGuide) {
              // Restaurar aparência normal apenas se a guia não estiver ativamente selecionada
              if (!closestSnap.guide.active) {
                closestSnap.guide.set({ 
                  stroke: GUIDE_COLOR, 
                  strokeWidth: 3,
                  opacity: 0.7  
                });
              }
              this.canvas.renderAll();
            }
          }, 300);
          
          return true;
        }
      } catch (error) {
        console.error("Erro ao verificar snapping:", error);
      }
      
      return false;
    };

    // Mostrar/ocultar réguas
    this.toggleRulers = function() {
      
      this.isRulersVisible = !this.isRulersVisible;
      
      const display = this.isRulersVisible ? 'block' : 'none';
      $(`${this.containerSelector} .ruler`).css('display', display);
      $(`${this.containerSelector} .ruler-corner`).css('display', display);
      
      // Esconder o menu das réguas quando as réguas são ocultadas
      $(`${this.containerSelector} .ruler-menu`).hide();
      
      // Ajustar o padding do conteúdo do canvas
      if (this.isRulersVisible) {
        $(`${this.containerSelector}  .canvas-holder .content .content`).css({
          'padding-top': `${RULER_HEIGHT}px`,
          'padding-left': `${RULER_HEIGHT}px`
        });
        
        // Registrar dimensões para debug
        this.logCanvasDimensions('toggleRulers - mostrar');
        
        // Garantir que as guias estejam movíveis após exibir réguas
        setTimeout(() => this.forceGuidesMovable(), 100);
      } else {
        $(`${this.containerSelector}  .canvas-holder .content .content`).css({
          'padding-top': '0',
          'padding-left': '0'
        });
        
        // Ocultar margens quando as réguas são ocultadas
        if (this.margins && this.margins.show) {
          this.margins.show = false;
          this.clearMargins();
        }
      }
      
      // Redimensionar e redesenhar réguas se elas estiverem visíveis
      if (this.isRulersVisible && this.canvas) {
        this.resizeRulers();
        this.drawCanvasElements();
        
        // Atualizar todas as guias para garantir que elas tenham o tamanho correto
        this.updateGuidesAfterCanvasChange();
      }

      // Salvar configurações após alteração
      this.saveRulerSettings();

      this.fitZoom();
    };

    // Configurar comportamento interativo das réguas
    this.setupRulerInteractions = function() {
      const _self = this;
      
      // Atualizar cursor nas réguas ao mover o mouse
      $(`${this.containerSelector}  .canvas-holder .content`).mousemove(function(e) {
        if (!_self.isRulersVisible || !_self.canvas) return;
        
        const rect = this.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        _self.drawRulerCursors(x, y);
      });
      
      // Adicionar guias ao clicar nas réguas
      $(`${this.containerSelector} .horizontal-ruler`).mousedown(function(e) {
        if (!_self.canvas) return;
        // Obter a posição Y exata do clique em relação à janela
        const y = e.clientY;
        
        // Obter mais informações para debug
        const rulerRect = this.getBoundingClientRect();
        
        const guide = _self.addGuide(true, y);
        if (guide) {
          console.log('Horizontal guide added at Y:', y);
        } else {
          console.error('Failed to add horizontal guide');
        }
      });
      
      $(`${this.containerSelector} .vertical-ruler`).mousedown(function(e) {
        if (!_self.canvas) return;

        // Obter a posição X exata do clique em relação à janela
        const x = e.clientX;
        
        // Obter mais informações para debug
        const rulerRect = this.getBoundingClientRect();        
        
        const guide = _self.addGuide(false, x);
        if (guide) {
          console.log('Vertical guide added at X:', x);
        } else {
          console.error('Failed to add vertical guide');
        }
      });
      
      // Suporte para snapping quando mover objetos
      if (this.canvas) {
        this.canvas.on('object:moving', function(e) {
          if (!e.target) return;
          
          // Se o objeto for uma guia
          if (e.target.metadata && e.target.metadata.isGuide) {
            try {
              // Obter as dimensões reais do canvas
              const canvasWidth = _self.dimensions ? _self.dimensions.width : (_self.canvas.width || 1000);
              const canvasHeight = _self.dimensions ? _self.dimensions.height : (_self.canvas.height || 1000);
              
              // Garantir que a guia permaneça dentro dos limites do canvas
              if (e.target.metadata.isHorizontal) {
                // É uma guia horizontal - mover apenas verticalmente 
                // Limitar o movimento dentro dos limites do canvas
                if (e.target.top < 0) e.target.top = 0;
                if (e.target.top > canvasHeight) e.target.top = canvasHeight;
                
                // Atualizar os pontos da linha
                e.target.set({
                  x1: 0,
                  y1: e.target.top,
                  x2: canvasWidth,
                  y2: e.target.top,
                  opacity: 1 // Tornar totalmente visível durante o movimento
                });
              } else {                
                // Limitar o movimento dentro dos limites do canvas
                if (e.target.left < 0) e.target.left = 0;
                if (e.target.left > canvasWidth) e.target.left = canvasWidth;
                
                // Atualizar os pontos da linha
                e.target.set({
                  x1: e.target.left,
                  y1: 0,
                  x2: e.target.left,
                  y2: canvasHeight,
                  opacity: 1 // Tornar totalmente visível durante o movimento
                });
              }
            } catch (error) {
              console.error("Erro ao mover guia:", error);
            }
          }
          // Para objetos normais, verificar snapping
          else if (_self.isRulersVisible) {
            _self.checkSnapping(e.target);
          }
        });
        
        // Excluir guias com duplo clique
        this.canvas.on('mouse:dblclick', function(e) {
          if (e.target && e.target.metadata && e.target.metadata.isGuide) {
            _self.canvas.remove(e.target);
            _self.canvas.renderAll();
          }
        });
        
        // Atualizar réguas quando o canvas é redimensionado ou movido
        this.canvas.on('mouse:wheel', function() {
          if (_self.isRulersVisible) {
            _self.drawRulers();
            _self.updateGuidesAfterCanvasChange();
          }
        });
        
        // Eventos para detectar pan do canvas
        this.canvas.on('mouse:down', function(e) {
          if (e.e.altKey || e.e.metaKey) {
            _self.isPanning = true;
          }
        });

        this.canvas.on('mouse:up', function() {
          if (_self.isPanning) {
            _self.isPanning = false;
            if (_self.isRulersVisible) {
              _self.updateGuidesAfterCanvasChange();
            }
          }
        });

        this.canvas.on('object:modified', function(e) {
          const target = e.target;
          if (target && target.metadata && target.metadata.isGuide) {
            
            // Se a guia não está ativamente selecionada, reduzir a opacidade
            if (!target.active) {
              target.set({ opacity: 0.7 });
            }
            
            // Garantir que as guias continuem movíveis
            setTimeout(() => _self.forceGuidesMovable(), 100);
            _self.canvas.renderAll();
          }
        });
      };

      // Tecla de atalho para mostrar/ocultar réguas (Shift+R)
      $(document).keydown(function(e) {
        if (e.shiftKey && e.key === 'R') {
          _self.toggleRulers();
          // Alternar botão ativo na toolbar
          $(`${_self.containerSelector} #toolbar button#ruler`).toggleClass('active');
          e.preventDefault();
        }
      });

      // Adicionar eventos para seleção de guias
      this.canvas.on('selection:created', function(e) {
        if (e.selected && e.selected.length === 1 && e.selected[0].metadata && e.selected[0].metadata.isGuide) {
          const guide = e.selected[0];
          guide.set({ 
            stroke: GUIDE_SELECTED_COLOR,
            strokeWidth: 2,
            opacity: 1 // Total opacidade quando selecionada
          });
          guide.active = true;
          _self.canvas.renderAll();
        }
      });

      this.canvas.on('selection:updated', function(e) {
        // Restaurar guias não selecionadas
        const guides = _self.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isGuide);
        guides.forEach(guide => {
          guide.active = false;
          guide.set({ 
            stroke: GUIDE_COLOR,
            strokeWidth: 3,
            opacity: 0.7
          });
        });
        
        // Destacar guia selecionada
        if (e.selected && e.selected.length === 1 && e.selected[0].metadata && e.selected[0].metadata.isGuide) {
          const guide = e.selected[0];
          guide.set({ 
            stroke: GUIDE_SELECTED_COLOR,
            strokeWidth: 2,
            opacity: 1
          });
          guide.active = true;
          _self.canvas.renderAll();
        }
      });

      this.canvas.on('selection:cleared', function() {
        // Restaurar a aparência normal de todas as guias
        const guides = _self.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isGuide);
        if(guides.length > 0){
          guides.forEach(guide => {
            guide.active = false;
            guide.set({ 
              stroke: GUIDE_COLOR,
              strokeWidth: 3,
              opacity: 0.7
            });
          });
          _self.canvas.renderAll();
        }
      });
      
      // Permitir que guias e outros objetos possam ser selecionados sequencialmente
      this.canvas.on('mouse:down', function(e) {
        // Se clicar em um objeto que não é guia enquanto uma guia está selecionada
        if (e.target && !e.target.metadata?.isGuide) {
          // Verificar se existe guia selecionada atualmente
          const activeObject = _self.canvas.getActiveObject();
          if (activeObject && activeObject.metadata && activeObject.metadata.isGuide) {
            // Limpar seleção da guia atual
            _self.canvas.discardActiveObject();
            // Imediatamente selecionar o novo objeto após um pequeno delay
            setTimeout(() => {
              _self.canvas.setActiveObject(e.target);
              _self.canvas.renderAll();
            }, 50);
          }
        }
      });
    };

    // Inicializar o componente de réguas
    this.initRulerComponent = function() {
      // Definir valor padrão para isRulersVisible
      this.isRulersVisible = false;
      
      // Carregar configurações salvas
      this.loadRulerSettings();
      
      // Inicializar réguas
      this.initRulers();
      
      // Não configurar interações ainda - isso será feito após o canvas estar pronto
    };
    
    // Método para ser chamado após o canvas estar pronto
    this.setupRulerAfterCanvasReady = function() {
      if (!this.canvas) {
        console.error("Canvas ainda não está pronto para configurar réguas");
        return;
      }
      
      this.setupRulerInteractions();
      this.resizeRulers();
      this.logCanvasDimensions('setupRulerAfterCanvasReady');
      
      // Garantir que guias existentes possam ser movidas
      this.forceGuidesMovable();
      
      this.canvas.on('after:render', function() {
        if (_self.calcOffset) {
          _self.calcOffset();
        }
      });
      
      // Forçar guias movíveis após configuração inicial
      this.forceGuidesMovable();
      
      // Adicionar evento para verificar guias movíveis após zoom ou pan
      this.canvas.on('mouse:up', function() {
        if (_self.isRulersVisible) {
          setTimeout(() => _self.forceGuidesMovable(), 100);
        }
      });
      
      // Aplicar configurações carregadas do localStorage
      if (this.isRulersVisible) {
        const display = 'block';
        $(`${this.containerSelector} .ruler`).css('display', display);
        $(`${this.containerSelector} .ruler-corner`).css('display', display);
        
        $(`${this.containerSelector}  .canvas-holder .content .content`).css({
          'padding-top': `${RULER_HEIGHT}px`,
          'padding-left': `${RULER_HEIGHT}px`
        });
        
        // Atualizar texto do botão de margens
        $(`${this.containerSelector} #toggle-margins`).text(
          this.margins.show ? 'Ocultar margens' : 'Mostrar margens'
        );
        
        // Desenhar margens se necessário
        if (this.margins.show) {
          this.drawCanvasElements();
        }
      }
    };

    // Desenhar os cursores nas réguas
    this.drawRulerCursors = function(x, y) {
      if (!this.isRulersVisible) return;
      
      try {
        // Salvar a última posição do mouse
        this.lastMousePosition = { x, y };
        
        // Limpar e redesenhar as réguas
        this.drawRulers();
        
        // O cursor será desenhado pelo método drawRulers que chama drawCursorOnly
      } catch (error) {
        console.error("Erro ao desenhar cursores nas réguas:", error);
      }
    };

    // Função auxiliar para registrar as dimensões do canvas para depuração
    this.logCanvasDimensions = function(context) {
      if (!this.canvas) return;
      
      const canvasWidth = this.dimensions ? this.dimensions.width : (this.canvas.width || 1000);
      const canvasHeight = this.dimensions ? this.dimensions.height : (this.canvas.height || 1000);
      const zoom = this.canvas.getZoom();
      const vp = this.canvas.viewportTransform;
      
      console.log(`--- Dimensões do Canvas (${context}) ---`);
      console.log('Dimensões:', canvasWidth, 'x', canvasHeight);
      console.log('this.dimensions:', this.dimensions);
      console.log('this.canvas.width/height:', this.canvas.width, 'x', this.canvas.height);
      console.log('Zoom atual:', zoom);
      console.log('ViewportTransform:', vp);
      console.log('---------------------------------------');
    };

    // Atualizar guias quando o canvas muda (zoom ou pan)
    this.updateGuidesAfterCanvasChange = function() {
      if (!this.canvas) return;
      
      const canvasWidth = this.dimensions ? this.dimensions.width : (this.canvas.width || 1000);
      const canvasHeight = this.dimensions ? this.dimensions.height : (this.canvas.height || 1000);
            
      // Buscar todas as guias
      const guides = this.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isGuide);
      
      if (guides.length === 0) return;
      
      // Atualizar cada guia
      guides.forEach(guide => {
        try {
          if (guide.metadata.isHorizontal) {
            // Para guias horizontais - manter a posição Y, ajustar a largura
            const y = guide.top !== undefined ? guide.top : (guide.y1 !== undefined ? guide.y1 : 0);
            
            guide.set({
              x1: 0,
              y1: y,
              x2: canvasWidth,
              y2: y
            });
            
          } else {
            // Para guias verticais - manter a posição X, ajustar a altura
            const x = guide.left !== undefined ? guide.left : (guide.x1 !== undefined ? guide.x1 : 0);
            
            guide.set({
              x1: x,
              y1: 0,
              x2: x,
              y2: canvasHeight
            });
            
          }
        } catch (error) {
          console.error('Erro ao atualizar guia:', error);
        }
      });
      
      // Renderizar as alterações
      this.canvas.renderAll();
      
      // Garantir que as guias continuem movíveis após atualização
      setTimeout(() => this.forceGuidesMovable(), 100);
    };

    // Reforçar a movimentação das guias (uso interno)
    this.forceGuidesMovable = function() {
      if (!this.canvas) return;
      
      
      // Buscar todas as guias
      const guides = this.canvas.getObjects().filter(obj => obj.metadata && obj.metadata.isGuide);
      
      if (guides.length === 0) {
        console.log('Nenhuma guia encontrada para tornar movível');
        return;
      }
      
      // Forçar configurações de movimentação para cada guia
      guides.forEach((guide, index) => {
        try {
          // Identificar o tipo de guia
          const isHorizontal = guide.metadata.isHorizontal;
          
          // Log detalhado
          console.log(`Configurando guia ${index+1}/${guides.length} (${isHorizontal ? 'horizontal' : 'vertical'})`);
          console.log('Propriedades atuais:', {
            selectable: guide.selectable,
            lockMovementX: guide.lockMovementX,
            lockMovementY: guide.lockMovementY
          });
          
          // Configurar propriedades de movimento
          guide.set({
            selectable: true,
            evented: true,
            lockMovementX: isHorizontal,
            lockMovementY: !isHorizontal,
            hasControls: false,
            hasBorders: true,
            padding: 8,
            strokeWidth: 2,  // Reduzido para não interferir tanto visualmente
            hoverCursor: isHorizontal ? 'ns-resize' : 'ew-resize',
            moveCursor: isHorizontal ? 'ns-resize' : 'ew-resize',
            excludeFromExport: true, // Não exportar guias com a imagem
            // Ajustar transparência para facilitar a seleção de outros objetos
            opacity: guide.active ? 1 : 0.7
          });
        } catch (error) {
          console.error(`Erro ao configurar guia ${index+1}:`, error);
        }
      });
      
      // Renderizar as mudanças
      this.canvas.renderAll();
    };
  };

  window.ImageEditor.prototype.initializeRuler = ruler;

  window.addEventListener('resize', function() {
    if (window.app && window.app.ruler) {
      window.app.ruler.resizeRulers();
    }
  });

  // Método para ser chamado após o canvas estar completamente inicializado
  // Verificar se window.app existe antes de definir a função
  if (window.app) {
    window.app.setupRulerAfterCanvasReady = function() {
      try {
        if (!window.app.canvas) {
          console.error('Canvas ainda não está inicializado');
          return;
        }
        
        // Garantir que a régua está configurada
        if (!window.app.ruler) {
          console.error('Objeto ruler não foi inicializado');
          return;
        }
        
        // Configurar réguas com o canvas já pronto
        window.app.ruler.setupRulerAfterCanvasReady();
      } catch (error) {
        console.error('Erro ao configurar réguas após inicialização do canvas:', error);
      }
    };
  } else {
    console.warn('window.app não está disponível para configurar setupRulerAfterCanvasReady');
  }
})(); 