/**
 * initialize canvas setting panel
 */
(function () {
  'use strict';
  var canvasSettings = function () {
    const _self = this;
    $(`${this.containerSelector} .main-panel`).append(`<div class="toolpanel" id="background-panel"><div class="content"><p class="title">Canvas Settings</p></div></div>`);

    // Função helper para criar EyeDropper
    const createEyeDropperButton = (containerId, colorPickerId) => {
      // Verificar se o navegador suporta EyeDropper
      if (!window.EyeDropper) {
        return ''; // Retorna string vazia se não suportar
      }
      
      return `<button type="button" class="eyedropper-btn" data-target="${colorPickerId}" title="Conta-gotas (selecionar cor da tela)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
          <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z"/>
        </svg>
      </button>`;
    };

    // Função para inicializar EyeDropper em um color picker
    const initializeEyeDropper = (containerSelector, colorPickerId, callback) => {
      if (!window.EyeDropper) {
        console.warn('EyeDropper API não é suportada neste navegador');
        // Mostrar mensagem de aviso se o elemento existir
        const warningElement = $(`${containerSelector} .eyedropper-not-supported`);
        if (warningElement.length) {
          warningElement.show();
        }
        return;
      }

      const eyeDropperBtn = $(`${containerSelector} .eyedropper-btn[data-target="${colorPickerId}"]`);
      
      eyeDropperBtn.click(async function() {
        try {
          // Adicionar classe de estado ativo
          $(this).addClass('active');
          
          // Mudar cursor para indicar modo de seleção
          $('body').css('cursor', 'crosshair');
          
          const eyeDropper = new EyeDropper();
          const result = await eyeDropper.open();
          
          if (result && result.sRGBHex) {
            // Atualizar o color picker com a cor selecionada
            $(`${containerSelector} #${colorPickerId}`).spectrum('set', result.sRGBHex);
            
            // Trigger change event para sincronizar
            $(`${containerSelector} #${colorPickerId}`).trigger('change');
            
            // Executar callback se fornecido
            if (callback && typeof callback === 'function') {
              callback(result.sRGBHex);
            }
            
            // Mostrar feedback de sucesso (opcional)
            console.log('Cor de fundo selecionada:', result.sRGBHex);
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error('Erro ao usar EyeDropper:', e);
            // Mostrar mensagem de erro ao usuário (opcional)
            alert('Ocorreu um erro ao selecionar a cor. Tente novamente.');
          }
        } finally {
          // Remover estado ativo e restaurar cursor
          $(this).removeClass('active');
          $('body').css('cursor', 'default');
        }
      });
    };

    if(_self.canvasSizeBlock === false) {
      // set dimension section
      (() => {
        $(`${this.containerSelector} .toolpanel#background-panel .content`).append(`
        <div class="canvas-size-setting">
          <p>Canvas Size</p>
          <div class="input-container">
            <label>Width</label>
            <div class="custom-number-input">
            <button class="decrease">-</button>
            <input type="number" min="100" id="input-width" value="1360"/>
            <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>Height</label>
            <div class="custom-number-input">
            <button class="decrease">-</button>
            <input type="number" min="100" id="input-height" value="768"/>
            <button class="increase">+</button>
            </div>
          </div>
        </div>
      `);

        var setDimension = () => {
          try {
            let width = $(`${this.containerSelector} .toolpanel#background-panel .content #input-width`).val();
            let height = $(`${this.containerSelector} .toolpanel#background-panel .content #input-height`).val();
            _self.canvas.setWidth(width)
            _self.canvas.originalW = width
            _self.canvas.setHeight(height)
            _self.canvas.originalH = height
            _self.canvas.renderAll()
            _self.canvas.fire('object:modified')
          } catch (_) {}
        }

        $(`${this.containerSelector} .toolpanel#background-panel .content #input-width`).change(setDimension)
        $(`${this.containerSelector} .toolpanel#background-panel .content #input-height`).change(setDimension)
      })();
      // end set dimension section
    }

    // background color
    (() => {
      $(`${this.containerSelector} .toolpanel#background-panel .content`).append(`
      <div class="color-settings">
        <p>Background Color</p>
        <div class="tab-container">
          <div class="tabs">
            <div class="tab-label" data-value="color-fill">Color Fill</div>
            <div class="tab-label" data-value="gradient-fill">Gradient Fill</div>
          </div>
          <div class="tab-content" data-value="color-fill">
            <div class="color-picker-container">
              <input id="color-picker" value=''/>
              ${createEyeDropperButton('background-panel', 'color-picker')}
            </div>
            ${!window.EyeDropper ? '<div class="eyedropper-not-supported">Conta-gotas não suportado neste navegador</div>' : ''}
            <br>
          </div>
          <div class="tab-content" data-value="gradient-fill">
            <div id="gradient-picker"></div>

            <div class="gradient-orientation-container">
              <div class="input-container">
                <label>Orientation</label>
                <select id="select-orientation">
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
              <div id="angle-input-container" class="input-container">
                <label>Angle</label>
                <div class="custom-number-input">
                  <button class="decrease">-</button>
                  <input type="number" min="0" max="360" value="0" id="input-angle">
                  <button class="increase">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

      $(`${this.containerSelector} .toolpanel#background-panel .content .tab-label`).click(function () {
        $(`${_self.containerSelector} .toolpanel#background-panel .content .tab-label`).removeClass('active');
        $(this).addClass('active');
        let target = $(this).data('value');
        $(this).closest('.tab-container').find('.tab-content').hide();
        $(this).closest('.tab-container').find(`.tab-content[data-value=${target}]`).show();

        if (target === 'color-fill') {
          let color = $(`${_self.containerSelector} .toolpanel#background-panel .content #color-picker`).val();
          try {
            _self.canvas.backgroundColor = color;
            _self.canvas.renderAll();
          } catch (_) {
            console.log("can't update background color")
          }
        } else {
          updateGradientFill();
        }
      })

      $(`${this.containerSelector} .toolpanel#background-panel .content .tab-label[data-value=color-fill]`).click();

      $(`${this.containerSelector} .toolpanel#background-panel .content #color-picker`).spectrum({
        showPalette: true,
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        move: function (color) {
          let hex = 'transparent';
            color && (hex = color.toHexString()); // #ff0000
          _self.canvas.backgroundColor = hex;
          _self.canvas.renderAll();
        }
      });

      // Inicializar EyeDropper para color picker de fundo
      initializeEyeDropper(this.containerSelector + ' .toolpanel#background-panel .content', 'color-picker', (color) => {
        _self.canvas.backgroundColor = color;
        _self.canvas.renderAll();
      });

      const gp = new Grapick({
        el: `${this.containerSelector} .toolpanel#background-panel .content #gradient-picker`,
        colorEl: '<input id="colorpicker"/>' // I'll use this for the custom color picker
      });

      gp.setColorPicker(handler => {
        const el = handler.getEl().querySelector('#colorpicker');
        $(el).spectrum({
          showPalette: false,
          showButtons: false,
          type: "color",
          showInput: "true",
          allowEmpty: "false",
          color: handler.getColor(),
          showAlpha: true,
          change(color) {
            handler.setColor(color.toRgbString());
          },
          move(color) {
            handler.setColor(color.toRgbString(), 0);
          }
        });
      });

      gp.addHandler(0, 'red');
      gp.addHandler(100, 'blue');

      const updateGradientFill = () => {
        let stops = gp.getHandlers();
        let orientation = $(`${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`).val();
        let angle = parseInt($(`${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`).val());

        let gradient = _self.generateFabricGradientFromColorStops(stops, _self.canvas.width, _self.canvas.height, orientation, angle);
        _self.canvas.setBackgroundColor(gradient)
        _self.canvas.renderAll()
      }

      // Do stuff on change of the gradient
      gp.on('change', complete => {
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #select-orientation`).change(function () {
        let type = $(this).val();
        if (type === 'radial') {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').hide();
        } else {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').show();
        }
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#background-panel .content .gradient-orientation-container #input-angle`).change(function () {
        updateGradientFill();
      })
    })();
  }

  window.ImageEditor.prototype.initializeCanvasSettingPanel = canvasSettings;
})()