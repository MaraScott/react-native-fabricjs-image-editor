/**
 * initialize selection setting panel
 */
(function () {
  'use strict';
  const BorderStyleList = [{
    value: {
      strokeDashArray: [],
      strokeLineCap: 'butt'
    },
    label: "Stroke"
  }, {
    value: {
      strokeDashArray: [1, 10],
      strokeLineCap: 'butt'
    },
    label: 'Dash-1'
  }, {
    value: {
      strokeDashArray: [1, 10],
      strokeLineCap: 'round'
    },
    label: 'Dash-2'
  }, {
    value: {
      strokeDashArray: [15, 15],
      strokeLineCap: 'square'
    },
    label: 'Dash-3'
  }, {
    value: {
      strokeDashArray: [15, 15],
      strokeLineCap: 'round'
    },
    label: 'Dash-4'
  }, {
    value: {
      strokeDashArray: [25, 25],
      strokeLineCap: 'square'
    },
    label: 'Dash-5',
  }, {
    value: {
      strokeDashArray: [25, 25],
      strokeLineCap: 'round'
    },
    label: 'Dash-6',
  }, {
    value: {
      strokeDashArray: [1, 8, 16, 8, 1, 20],
      strokeLineCap: 'square'
    },
    label: 'Dash-7',
  }, {
    value: {
      strokeDashArray: [1, 8, 16, 8, 1, 20],
      strokeLineCap: 'round'
    },
    label: 'Dash-8',
  }]
  const AlignmentButtonList = [{
    pos: 'left',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect x="14.815" y="48.16" width="85.185" height="24.691"></rect><rect x="14.815" y="87.025" width="45.679" height="24.691"></rect><rect y="34.877" width="8.642" height="90.123"></rect></g></svg>`
  }, {
    pos: 'center-h',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect x="7.4075" y="30.722" width="85.185" height="24.691"></rect><rect x="27.16" y="69.587" width="45.679" height="24.691"></rect><rect x="45.679" y="17.439" width="8.642" height="90.123"></rect></g></svg>`,
  }, {
    pos: 'right',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></svg>`,
  }, {
    pos: 'top',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="matrix(0 -1 -1 0 129.94 129.94)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`,
  }, {
    pos: 'center-v',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect transform="rotate(90)" x="19.908" y="-81.779" width="85.185" height="24.691"></rect><rect transform="rotate(90)" x="39.66" y="-42.913" width="45.679" height="24.691"></rect><rect transform="rotate(90)" x="58.179" y="-95.062" width="8.642" height="90.123"></rect></g></svg>`
  }, {
    pos: 'bottom',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="rotate(90 50 79.938)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`
  }]
  var selectionSettings = function () {
    const _self = this;
   
    $(`${this.containerSelector} .main-panel`).append(`<div class="toolpanel" id="select-panel"><div class="content"><p class="title">Selection Settings</p></div></div>`);

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
            console.log('Cor selecionada:', result.sRGBHex);
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

    // animate section
    // (() => {
    //   $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
    //     <div class="animate-section">
    //       <h4>Animate</h4>
    //       <div class="animate">
    //         <div class="input-container">
    //           <label>Tipo</label>
    //           <select id="animate-type">
    //             <option value="none">None</option>           
    //             <option value="slideInLeft">Slide (Deslizar) - Left</option>
    //             <option value="slideInRight">Slide (Deslizar) - Right</option>
    //             <option value="slideInTop">Slide (Deslizar) - Top</option>
    //             <option value="slideInBottom">Slide (Deslizar) - Bottom </option>
    //             <option value="fade">Fade (Desaparecer)</option>
    //             <option value="zoom">Zoom</option>
    //             <option value="spin">Spin (Girar)</option>
    //             <option value="swing">Swing (Balanço)</option>
    //             <option value="float">Float (Flutuar)</option>
    //             <option value="typewriter">Typewriter (Máquina de Escrever)</option>                
    //           </select>
    //         </div>
    //       </div>          
    //       <hr>
    //     </div>
    //   `);

    //   $(`${this.containerSelector} .toolpanel#select-panel .animate-section #animate-type`).change(function () {
        
    //     const animate = $(this).val();
    //     const obj = _self.activeSelection;
        
    //     if (obj && _self.animations.animations[animate]) {
    //       obj.set('animation', {
    //         type: animate,
    //         duration: 1000,
    //         easing: 'easeInOutQuad'
    //       });
    //       _self.animations.animations[animate](obj);
    //     } else {
    //       obj.set('animation', null);
    //     }

    //   });
      
    // })();
    // end animate section

    // font section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="text-section">
          <h4>Font Style</h4>
          <div class="style">
            <button id="bold"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M218.133,144.853c20.587-14.4,35.2-37.653,35.2-59.52C253.333,37.227,216.107,0,168,0H34.667v298.667h150.187 c44.693,0,79.147-36.267,79.147-80.853C264,185.387,245.547,157.76,218.133,144.853z M98.667,53.333h64c17.707,0,32,14.293,32,32 s-14.293,32-32,32h-64V53.333z M173.333,245.333H98.667v-64h74.667c17.707,0,32,14.293,32,32S191.04,245.333,173.333,245.333z"></path></svg></button>
            <button id="italic"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="106.667,0 106.667,64 153.92,64 80.747,234.667 21.333,234.667 21.333,298.667 192,298.667 192,234.667 144.747,234.667 217.92,64 277.333,64 277.333,0  "></polygon></svg></button>
            <button id="underline"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M192,298.667c70.72,0,128-57.28,128-128V0h-53.333v170.667c0,41.28-33.387,74.667-74.667,74.667 s-74.667-33.387-74.667-74.667V0H64v170.667C64,241.387,121.28,298.667,192,298.667z"></path><rect x="42.667" y="341.333" width="298.667" height="42.667"></rect></svg></button>
            <button id="linethrough"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="149.333,160 234.667,160 234.667,96 341.333,96 341.333,32 42.667,32 42.667,96 149.333,96"></polygon><rect x="149.333" y="288" width="85.333" height="64"></rect><rect x="0" y="202.667" width="384" height="42.667"></rect></svg></button>
            <button id="subscript"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M248.257,256l103.986-103.758c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455l-49.057-48.948 c-5.765-5.753-15.098-5.753-20.863,0L178.29,186.188L74.258,82.384c-5.764-5.751-15.098-5.752-20.863,0L4.337,131.333 C1.561,134.103,0,137.865,0,141.788c0,3.923,1.561,7.684,4.337,10.455L108.324,256L4.337,359.758 C1.561,362.528,0,366.29,0,370.212c0,3.923,1.561,7.684,4.337,10.455l49.057,48.948c5.765,5.753,15.098,5.753,20.863,0 l104.033-103.804l104.032,103.804c2.883,2.876,6.657,4.315,10.432,4.315s7.549-1.438,10.432-4.315l49.056-48.948 c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455L248.257,256z"></path><path d="M497.231,384.331h-44.973l35.508-31.887c14.878-13.36,20.056-34.18,13.192-53.04 c-6.874-18.89-23.565-31.044-43.561-31.717c-0.639-0.021-1.283-0.032-1.928-0.032c-31.171,0-56.531,25.318-56.531,56.439 c0,8.157,6.613,14.769,14.769,14.769c8.156,0,14.769-6.613,14.769-14.769c0-14.833,12.109-26.901,26.992-26.901 c0.316,0,0.631,0.005,0.937,0.016c11.573,0.39,15.78,9.511,16.795,12.297c2.163,5.946,1.942,14.574-5.171,20.962l-64.19,57.643 c-4.552,4.088-6.112,10.56-3.923,16.273c2.189,5.714,7.673,9.486,13.792,9.486h83.523c8.157,0,14.769-6.613,14.769-14.769 S505.387,384.331,497.231,384.331z"></path></svg></button>
            <button id="superscript"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M248.257,259.854l103.986-103.758c2.777-2.771,4.337-6.532,4.337-10.455c0-3.923-1.561-7.684-4.337-10.455l-49.057-48.948 c-5.765-5.753-15.098-5.753-20.863,0L178.29,190.042L74.258,86.238c-5.764-5.751-15.099-5.752-20.863,0L4.337,135.187 C1.561,137.958,0,141.719,0,145.642s1.561,7.684,4.337,10.455l103.986,103.758L4.337,363.612C1.561,366.383,0,370.145,0,374.067 c0,3.922,1.561,7.684,4.337,10.455l49.057,48.948c5.765,5.753,15.098,5.753,20.863,0l104.033-103.804l104.032,103.804 c2.883,2.876,6.657,4.315,10.432,4.315s7.549-1.438,10.432-4.315l49.056-48.948c2.777-2.771,4.337-6.532,4.337-10.455 s-1.561-7.684-4.337-10.455L248.257,259.854z"></path><path d="M497.231,190.893h-44.973l35.508-31.887c14.878-13.36,20.056-34.18,13.192-53.04 c-6.874-18.89-23.565-31.044-43.561-31.717c-0.639-0.021-1.283-0.032-1.928-0.032c-31.171,0-56.531,25.318-56.531,56.439 c0,8.157,6.613,14.769,14.769,14.769c8.156,0,14.769-6.613,14.769-14.769c0-14.833,12.109-26.901,26.992-26.901 c0.316,0,0.631,0.005,0.937,0.016c11.573,0.39,15.78,9.511,16.795,12.297c2.163,5.946,1.942,14.574-5.171,20.962l-64.19,57.643 c-4.552,4.088-6.112,10.56-3.923,16.273c2.189,5.714,7.673,9.486,13.792,9.486h83.523c8.157,0,14.769-6.613,14.769-14.769 S505.387,190.893,497.231,190.893z"></path></svg></button>
          </div>
          <div class="family">
            <div class="input-container">
            <label>Font Family</label>
            <select id="font-family">
              <option value=""></option>
              ${this.fonts && this.fonts.length > 0 ? `
                <optgroup label="Fontes Personalizadas">
                  ${[...new Set(this.fonts.map(font => font.name))].map(fontName => 
                    `<option value="'${fontName}', sans-serif">${fontName}</option>`
                  ).join('')}
                </optgroup>
              ` : ''}
              <optgroup label="Fontes do Sistema">
                <option value="'Open Sans', sans-serif">Open Sans</option>                
                <option value="'Oswald', sans-serif">Oswald</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                <option value="Impact, Charcoal, sans-serif">Impact</option>
                <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                <option value="'Comic Sans MS', 'Comic Sans', cursive, sans-serif">Comic Sans</option>
                <option value="'Dancing Script', cursive">Dancing Script</option>
                <option value="'Indie Flower', cursive">Indie Flower</option>
                <option value="'Amatic SC', cursive">Amatic SC</option>
                <option value="'Permanent Marker', cursive">Permanent Marker</option>
              </optgroup>
            </select>
            </div>
          </div>
          <div class="sizes">
            <div class="input-container"><label>Font Size</label>
              <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="1" value="20" id="fontSize">
              <button class="increase">+</button>
              </div>
            </div>
            <div class="input-container"><label>Line Height</label>
              <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="0" max="3" value="1" step="0.1" id="lineHeight">
              <button class="increase">+</button>
              </div>
            </div>
            <div class="input-container"><label>Letter Spacing</label>
              <div class="custom-number-input">
              <button class="decrease">-</button>
              <input type="number" min="0" max="2000" step="100" value="0" id="charSpacing">
              <button class="increase">+</button>
              </div>
            </div>
            </p>
          </div>
          <div class="align">
            <div class="input-container">
            <label>Text Alignment</label>
            <select id="text-align">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
            </div>
          </div>
          <div class="color">
            <div class="input-container">
            <label>Text Color</label>
            <div class="color-picker-container">
              <input id="color-picker" value="black">
              ${createEyeDropperButton('text-section', 'color-picker')}
            </div>
            ${!window.EyeDropper ? '<div class="eyedropper-not-supported">Conta-gotas não suportado neste navegador</div>' : ''}
            </div>
          </div>
          <hr>
        </div>
      `);
      $(`${this.containerSelector} .toolpanel#select-panel .style button`).click(function () {
        let type = $(this).attr('id');
        switch (type) {
          case 'bold':
            _self.setActiveFontStyle(_self.activeSelection, 'fontWeight', _self.getActiveFontStyle(_self.activeSelection, 'fontWeight') === 'bold' ? '' : 'bold')
            break;
          case 'italic':
            _self.setActiveFontStyle(_self.activeSelection, 'fontStyle', _self.getActiveFontStyle(_self.activeSelection, 'fontStyle') === 'italic' ? '' : 'italic')
            break;
          case 'underline':
            _self.setActiveFontStyle(_self.activeSelection, 'underline', !_self.getActiveFontStyle(_self.activeSelection, 'underline'))
            break;
          case 'linethrough':
            _self.setActiveFontStyle(_self.activeSelection, 'linethrough', !_self.getActiveFontStyle(_self.activeSelection, 'linethrough'))
            break;
          case 'subscript':
            if (_self.getActiveFontStyle(_self.activeSelection, 'deltaY') > 0) {
              _self.setActiveFontStyle(_self.activeSelection, 'fontSize', undefined)
              _self.setActiveFontStyle(_self.activeSelection, 'deltaY', undefined)
            } else {
              _self.activeSelection.setSubscript()
              _self.canvas.renderAll()
            }
            break;
          case 'superscript':
            if (_self.getActiveFontStyle(_self.activeSelection, 'deltaY') < 0) {
              _self.setActiveFontStyle(_self.activeSelection, 'fontSize', undefined)
              _self.setActiveFontStyle(_self.activeSelection, 'deltaY', undefined)
            } else {
              _self.activeSelection.setSuperscript()
              _self.canvas.renderAll()
            }
            break;
          default:
            break;
        }
        _self.canvas.renderAll(), _self.canvas.fire('object:modified');
      })

      $(`${this.containerSelector} .toolpanel#select-panel .family #font-family`).change(function () {
        let family = $(this).val();
        _self.setActiveFontStyle(_self.activeSelection, 'fontFamily', family)
        _self.canvas.renderAll(), _self.canvas.fire('object:modified');
      })

      $(`${this.containerSelector} .toolpanel#select-panel .sizes input`).change(function () {
        let value = parseFloat($(this).val());
        let type = $(this).attr('id');
        _self.setActiveFontStyle(_self.activeSelection, type, value);
        _self.canvas.renderAll(), _self.canvas.fire('object:modified');
      })

      $(`${this.containerSelector} .toolpanel#select-panel .align #text-align`).change(function () {
        let mode = $(this).val();
        _self.setActiveFontStyle(_self.activeSelection, 'textAlign', mode);
        _self.canvas.renderAll(), _self.canvas.fire('object:modified');
      })

      $(`${this.containerSelector} .toolpanel#select-panel .color #color-picker`).spectrum({
        type: "color",
        showInput: "true",
        allowEmpty: "false"
      });

      // Inicializar EyeDropper para color picker de texto
      initializeEyeDropper(this.containerSelector + ' .toolpanel#select-panel .text-section', 'color-picker', (color) => {
        _self.setActiveFontStyle(_self.activeSelection, 'fill', color);
        _self.canvas.renderAll();
        _self.canvas.fire('object:modified');
      });

      $(`${this.containerSelector} .toolpanel#select-panel .color #color-picker`).change(function () {
        let color = $(this).val();
        _self.setActiveFontStyle(_self.activeSelection, 'fill', color)
        _self.canvas.renderAll(), _self.canvas.fire('object:modified');
      })
    })();
    // end font section

    // fill color section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="fill-section">
          <div class="tab-container">
            <div class="input-container">
              <label>
                <h4>Fill</h4>
              </label>
              <label>
                <div class="tabs">
                  <div class="tab-label" data-value="color-fill">
                    <button type="">Color</button>
                  </div>
                  <div class="tab-label" data-value="gradient-fill">
                    <button type="">Gradient</button>
                  </div>
                </div>
              </label>
            </div>
            <div class="tab-content" data-value="color-fill">
              <div class="input-container">
                <label>Color</label>
                <div class="color-picker-container">
                  <input id="color-picker" value="${_self.activeSelection ? _self.activeSelection.fill : '#000000'}">
                  ${createEyeDropperButton('fill-section', 'color-picker')}
                </div>
                ${!window.EyeDropper ? '<div class="eyedropper-not-supported">Conta-gotas não suportado neste navegador</div>' : ''}
              </div>
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
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .content .tab-label`).click(function () {
        $(`${_self.containerSelector} .toolpanel#select-panel .content .tab-label`).removeClass('active');
        $(this).addClass('active');
        let target = $(this).data('value');
        $(this).closest('.tab-container').find('.tab-content').hide();
        $(this).closest('.tab-container').find(`.tab-content[data-value=${target}]`).show();
        if (target === 'color-fill') {
          let color = $(`${_self.containerSelector} .toolpanel#select-panel .fill-section #color-picker`).val();
          try {
            _self.canvas.getActiveObjects().forEach(obj => obj.set('fill', color))
            _self.canvas.renderAll(), _self.canvas.fire('object:modified')
          } catch (_) {
            console.log("can't update background color")
          }
        } else {
          updateGradientFill();
        }
      })

      $(`${_self.containerSelector} .toolpanel#select-panel .content .tab-label[data-value=color-fill]`).click();

      $(`${this.containerSelector} .toolpanel#select-panel .fill-section #color-picker`).spectrum({
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        move: function (color) {
          let hex = 'transparent';
          color && (hex = color.toRgbString()); // #ff0000
          _self.canvas.getActiveObjects().forEach(obj => obj.set('fill', hex))
          _self.canvas.renderAll(), _self.canvas.fire('object:modified')
        }
      });

      // Inicializar EyeDropper para color picker de preenchimento
      initializeEyeDropper(this.containerSelector + ' .toolpanel#select-panel .fill-section', 'color-picker', (color) => {
        _self.canvas.getActiveObjects().forEach(obj => obj.set('fill', color));
        _self.canvas.renderAll();
        _self.canvas.fire('object:modified');
      });

      const gp = new Grapick({
        el: `${this.containerSelector} .toolpanel#select-panel .fill-section #gradient-picker`,
        colorEl: '<input id="colorpicker"/>'
      });

      gp.setColorPicker(handler => {
        const el = handler.getEl().querySelector('#colorpicker');
        $(el).spectrum({
          showPalette: true,
          showButtons: false,
          type: "color",
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
        let orientation = $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #select-orientation`).val();
        let angle = parseInt($(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #input-angle`).val());

        let gradient = _self.generateFabricGradientFromColorStops(stops, _self.activeSelection.width, _self.activeSelection.height, orientation, angle);
        _self.activeSelection.set('fill', gradient);
        _self.canvas.renderAll()
      }

      gp.on('change', complete => {
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #select-orientation`).change(function () {
        let type = $(this).val();
        console.log('orientation', type)
        if (type === 'radial') {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').hide();
        } else {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').show();
        }
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #input-angle`).change(function () {
        updateGradientFill();
      })

    })();
    // end fill color section

    // border section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="border-section">
          <h4>Border</h4>
          <div class="input-container"><label>Width</label>
            <div class="custom-number-input">
            <button class="decrease">-</button>
            <input type="number" min="0" value="0" id="input-border-width">
            <button class="increase">+</button>
            </div>
          </div>
          <div class="input-container"><label>Style</label><select id="input-border-style">${BorderStyleList.map(item => `<option value='${JSON.stringify(item.value)}'>${item.label}</option>`)}</select></div>
          <div class="input-container"><label>Corner Type</label><select id="input-corner-type"><option value="miter" selected>Square</option><option value="round">Round</option><option value="circle">Circle</option></select></div>
          <div class="input-container">
            <label>Color</label>
            <div class="color-picker-container">
              <input id="color-picker" value="black">
              ${createEyeDropperButton('border-section', 'color-picker')}
            </div>
            ${!window.EyeDropper ? '<div class="eyedropper-not-supported">Conta-gotas não suportado neste navegador</div>' : ''}
          </div>
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .border-section #color-picker`).spectrum({
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        move: function (color) {
          let hex = 'transparent';
          color && (hex = color.toRgbString()); // #ff0000
          _self.canvas.getActiveObjects().forEach(obj => obj.set('stroke', hex))
          _self.canvas.renderAll(), _self.canvas.fire('object:modified')
        }
      });

      // Inicializar EyeDropper para color picker de borda
      initializeEyeDropper(this.containerSelector + ' .toolpanel#select-panel .border-section', 'color-picker', (color) => {
        _self.canvas.getActiveObjects().forEach(obj => obj.set('stroke', color));
        _self.canvas.renderAll();
        _self.canvas.fire('object:modified');
      });

      $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-border-width`).change(function () {
        let width = parseInt($(this).val());
        _self.canvas.getActiveObjects().forEach(obj => obj.set({
          strokeUniform: true,
          strokeWidth: width
        }))
        _self.canvas.renderAll(), _self.canvas.fire('object:modified')
      })

      $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-border-style`).change(function () {
        try {
          let style = JSON.parse($(this).val());
          _self.canvas.getActiveObjects().forEach(obj => obj.set({
            strokeUniform: true,
            strokeDashArray: style.strokeDashArray,
            strokeLineCap: style.strokeLineCap
          }))
          _self.canvas.renderAll(), _self.canvas.fire('object:modified')
        } catch (_) { }
      })

      $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-corner-type`).change(function () {
        let corner = $(this).val();
        _self.canvas.getActiveObjects().forEach(obj => obj.set('strokeLineJoin', corner))
        _self.canvas.renderAll(), _self.canvas.fire('object:modified')
      })
    })();
    // end border section


    /*
    // alignment section
    (() => {
      let buttons = ``;
      AlignmentButtonList.forEach(item => {
        buttons += `<button data-pos="${item.pos}">${item.icon}</button>`
      })
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="alignment-section">
          <h4>Alignment</h4>
          ${buttons}
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .alignment-section button`).click(function () {
        // Ajusta o ponto de origem de todos os objetos selecionados para 'center'
        // _self.canvas.getActiveObjects().forEach(obj => {
        //   obj.set({
        //     originX: 'center',
        //     originY: 'center'
        //   });
        // });

        let pos = $(this).data('pos');
        const activeObjects = _self.canvas.getActiveObjects();

        if (activeObjects.length === 1) {
          // Alinha ao canvas
          _self.alignObject(_self.canvas, activeObjects[0], pos, { alignToCanvas: true });
        } else if (activeObjects.length > 1) {
          // Alinha todos ao último objeto selecionado
          const referenceObject = activeObjects[activeObjects.length - 1];
          activeObjects.forEach(obj => {
            if (obj !== referenceObject) {
              _self.alignObject(referenceObject, obj, pos, { alignToObject: true });
            }
          });
          _self.canvas.renderAll();
          _self.canvas.fire('object:modified');
        }
      })
    })();
    // end alignment section
    */
    /*
    // object options section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="object-options">
          <h4>Object Options</h4>
          <button id="flip-h" title="Flip Horizontal"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(0 1.5365 1.5385 0 -5.0769 1.5495)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="10 15 5.5 11 1 15"></polygon></g></svg></button>
          <button id="flip-v" title="Flip Vertical"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(1.5365 0 0 1.5385 -.45052 -3.0769)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="5.5 11 1 15 10 15"></polygon></g></svg></button>
          <button id="bring-fwd" title="Bring Forward"><svg x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M10,10h686v686H10V10 M990,304v686H304V794h98v98h490V402h-98v-98H990z"></path></g></svg></button>
          <button id="bring-back" title="Send Backward"><svg enable-background="new 0 0 1000 1000" viewBox="0 0 1e3 1e3" xml:space="preserve"><path d="m990 990h-686v-686h686v686m-980-294v-686h686v680h-98v-582h-490v490h200v98z"></path><rect x="108.44" y="108" width="490" height="490" fill="#fff"></rect></svg></button>
          <button id="duplicate" title="Duplicate"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><g><path d="M42.667,256c0-59.52,35.093-110.827,85.547-134.827V75.2C53.653,101.44,0,172.48,0,256s53.653,154.56,128.213,180.8 v-45.973C77.76,366.827,42.667,315.52,42.667,256z"></path><path d="M320,64c-105.92,0-192,86.08-192,192s86.08,192,192,192s192-86.08,192-192S425.92,64,320,64z M320,405.333 c-82.347,0-149.333-66.987-149.333-149.333S237.653,106.667,320,106.667S469.333,173.653,469.333,256 S402.347,405.333,320,405.333z"></path><polygon points="341.333,170.667 298.667,170.667 298.667,234.667 234.667,234.667 234.667,277.333 298.667,277.333 298.667,341.333 341.333,341.333 341.333,277.333 405.333,277.333 405.333,234.667 341.333,234.667  "></polygon></g></g></g></svg></button>
          <button id="delete" title="Delete"><svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg></button>
          <button id="group" title="Group Objects"><svg width="248" height="249" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="14" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect><rect id="svg_4" height="26.016205" width="26.016205" y="4.813006" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_5" height="26.016205" width="26.016205" y="3.999999" x="217.820703" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_7" height="26.016205" width="26.016205" y="218.633712" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_8" height="26.016205" width="26.016205" y="218.633712" x="217.820694" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect></g></svg></button>
          <button id="ungroup" title="Ungroup Objects"><svg width="247.99999999999997" height="248.99999999999997" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect stroke-dasharray="20" id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="16" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect></g></svg></button>
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .object-options #flip-h`).click(() => {
        this.executeAction("flipHorizontal");
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #flip-v`).click(() => {
        this.executeAction("flipVertical");
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #bring-fwd`).click(() => {
        this.executeAction("moveForward");
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #bring-back`).click(() => {
        this.executeAction("moveBackward");
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #duplicate`).click(() => {
        this.executeAction("duplicate");               
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #delete`).click(() => {
        this.executeAction("delete");
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #group`).click(() => {
        this.executeAction("group"); 
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #ungroup`).click(() => {
        this.executeAction("ungroup");
      })
    })();
    */
    // end object options section

    // effect section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="effect-section">
          <h4>Effect</h4>
          <div class="input-container"><label>Opacity</label><input id="opacity" type="range" min="0" max="1" value="1" step="0.01"></div>
          <div class="input-container"><label>Blur</label><input class="effect" id="blur" type="range" min="0" max="100" value="50"></div>
          <div class="input-container"><label>Brightness</label><input class="effect" id="brightness" type="range" min="0" max="100" value="50"></div>
          <div class="input-container"><label>Saturation</label><input class="effect" id="saturation" type="range" min="0" max="100" value="50"></div>
          <h5>Gamma</h5>
          <div class="input-container"><label>Red</label><input class="effect" id="gamma.r" type="range" min="0" max="100" value="50"></div>
          <div class="input-container"><label>Green</label><input class="effect" id="gamma.g" type="range" min="0" max="100" value="50"></div>
          <div class="input-container"><label>Blue</label><input class="effect" id="gamma.b" type="range" min="0" max="100" value="50"></div>
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .effect-section #opacity`).change(function () {
        let opacity = parseFloat($(this).val());
        _self.activeSelection.set('opacity', opacity)
        _self.canvas.renderAll(), _self.canvas.fire('object:modified')
      })

      $(`${this.containerSelector} .toolpanel#select-panel .effect-section .effect`).change(function () {
        let effect = $(this).attr('id');
        let value = parseFloat($(this).val());
        let currentEffect = _self.getCurrentEffect(_self.activeSelection);
        _self.activeSelection.filters = _self.getUpdatedFilter(currentEffect, effect, value);
        _self.activeSelection.applyFilters();
        _self.canvas.renderAll(), _self.canvas.fire('object:modified')
      })
    })();
    // end effect section

    this.setSelectionValues = () => {
      const _self = this;

      let count = _self.canvas.getActiveObjects().length

      if (count == 1) {
        let activeObject = _self.activeSelection;

        if (activeObject) {

          const {
            strokeWidth,
            stroke,
            strokeLineCap,
            cornerStyle,
            fill,
            fontFamily,
            fontSize,
            lineHeight,
            charSpacing,
            textAlign,
            type,
            animation
          } = activeObject;

          const setValue = (selector, value) => {
            if (value !== undefined && value !== null) {
              $(`${_self.containerSelector} .toolpanel#select-panel ${selector}`).val(value).trigger("change");
            }
          };

          // Fill section
          setValue('.fill-section #color-picker', fill);

          // Border section
          setValue('.border-section #color-picker', stroke);
          setValue('.border-section #input-border-width', strokeWidth);
          if (strokeLineCap !== undefined && strokeLineCap !== null) {
            const borderStyleValue = JSON.stringify({
              strokeDashArray: activeObject.strokeDashArray ?? [],
              strokeLineCap: strokeLineCap
            });
            setValue('.border-section #input-border-style', borderStyleValue);
          }
          setValue('.border-section #input-corner-type', cornerStyle);

          if (type === 'textbox' || type === 'i-text') {
            // Text section
            setValue('.text-section #font-family', fontFamily);
            setValue('.text-section #fontSize', fontSize);
            setValue('.text-section #lineHeight', lineHeight);
            setValue('.text-section #charSpacing', charSpacing);
            setValue('.text-section #text-align', textAlign);
            setValue('.text-section #color-picker', fill);
          }
          // console.log(animation)
          if(animation) {
            setValue('.animate-section #animate-type', animation.type);
          }

        }
      }
    }
  }

  window.ImageEditor.prototype.initializeSelectionSettings = selectionSettings;
})()