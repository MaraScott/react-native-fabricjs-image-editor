/**
 * Centraliza as ações do menu do editor
 */
(function () {
  "use strict";

  let copiedObject = null;

  // Objeto que contém todas as ações disponíveis
  const ACTIONS = {
    copy: {
      name: "copy",
      icon: "uil-copy",
      label: "Copiar",
      shortcut: "Ctrl+C",
      enabled: true,
      handler: async (canvas) => {    

        copiedObject = null;

        const activeObject = canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
          const selectedText = activeObject.getSelectedText();
          if (selectedText) {
            await navigator.clipboard.writeText(selectedText);
            return;
          }
        } 
        
        if (activeObject) {
          activeObject.clone((cloned) => {
            copiedObject = cloned;
            canvas.fire("copy", { id: cloned.id, type: cloned.type });
          }, ['id']);
        }
        else {
          canvas.fire("copy:failed", { message: 'Nenhum objeto selecionado' });
        }
      }
    },
    paste: {
      name: "paste",
      icon: "uil-clipboard",
      label: "Colar",
      shortcut: "Ctrl+V",
      enabled: true,
      handler: async (canvas) => {
        console.log('copiedObject',copiedObject);

        // const clipboardText = await navigator.clipboard.readText();
        //   if (clipboardText) {
        //     activeObject.insertChars(clipboardText, null, activeObject.selectionStart, activeObject.selectionEnd);
        //     canvas.renderAll();            
        //   }
        

        if (copiedObject) {
          copiedObject.clone((cloned) => {
            canvas.discardActiveObject(); // Limpa a seleção atual
            cloned.set({
              left: cloned.left + 20, // Desloca 20px para evitar sobreposição
              top: cloned.top + 20,
              id: `${cloned.id}_copia_${Date.now()}` // ID único para a cópia
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            canvas.fire("paste", { id: cloned.id, type: cloned.type });
          }, ['id']);
        } else {
          canvas.fire("paste:failed", { message: 'Nenhum objeto copiado' });
        }
      }
    },
    duplicate: {
      name: "duplicate",
      icon: "uil-minus-path",
      label: "Duplicar",
      shortcut: "Ctrl+D",
      enabled: true,
      handler: function(canvas) {
        const activeObjects = canvas.getActiveObjects();

        if(activeObjects.locked) {
          alert("Objeto bloqueado");
          return;
        }

        const clonedObjects = [];
        
        activeObjects.forEach((obj) => {
          obj.clone((clone) => {
            canvas.add(
              clone.set({
                strokeUniform: true,
                left: obj.aCoords.tl.x + 20,
                top: obj.aCoords.tl.y + 20,
              })
            );

            if (activeObjects.length === 1) {
              canvas.setActiveObject(clone);
            }
            clonedObjects.push(clone);
          });
        });

        if (clonedObjects.length > 1) {
          let sel = new fabric.ActiveSelection(clonedObjects, {
            canvas: canvas,
          });
          canvas.setActiveObject(sel);
        }

        canvas.requestRenderAll();
        canvas.fire("object:modified");
      }
    },
    delete: {
      name: "delete",
      icon: "uil-trash-alt",
      label: "Excluir",
      shortcut: "DELETE",
      enabled: true,
      handler: function(canvas) {
        // Implementação da ação de excluir
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    group: {
      name: "group",
      icon: "uil-object-group",
      label: "Agrupar",
      shortcut: "Ctrl+G",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (
          activeObject &&
          activeObject.type === "activeSelection" &&
          activeObject.getObjects().length > 1
        ) {          
          activeObject.toGroup();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
          canvas.fire("group:added");
        }
      }
    },
    ungroup: {
      name: "ungroup",
      icon: "uil-object-ungroup",
      label: "Desagrupar",
      shortcut: "Ctrl+Shift+G",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === "group") {
          activeObject.toActiveSelection();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
          canvas.fire("group:removed");
        }
      }
    },
    moveForward: {
      name: "move-forward",
      icon: "uil-top-arrow-to-top",
      label: "Mover para frente",
      shortcut: "Ctrl+]",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.bringForward();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    moveFullForward: {
      name: "move-full-forward",
      icon: "uil-top-arrow-to-top",
      label: "Trazer para frente",
      shortcut: "Ctrl+Alt+]",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.bringToFront();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    moveBackward: {
      name: "move-backward",
      icon: "uil-arrow-to-bottom",
      label: "Mover para trás",
      shortcut: "Ctrl+[",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.sendBackwards();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    moveFullBackward: {
      name: "move-full-backward",
      icon: "uil-arrow-to-bottom",
      label: "Enviar para trás",
      shortcut: "Ctrl+Alt+[",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.sendToBack();
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    showLayers: {
      name: "show-layers",
      icon: "uil-layers",
      label: "Mostrar camadas",
      shortcut: "Alt+1",
      enabled: false,
      handler: function(canvas) {
        const layersContainer = document.querySelector('.image-editor-layers');
        layersContainer.style.display = 'block';
      }
    },
    comment: {
      name: "comment",
      icon: "uil-comment-plus",
      label: "Comentar",
      shortcut: "Ctrl+Alt+N",
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    },
    addLink: {
      name: "add-link",
      icon: "uil-link",
      label: "Adicionar link",
      shortcut: "Ctrl+K",
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    },
    flipHorizontal: {
      name: "flip-horizontal",
      icon: "uil-flip-h",
      label: "Inverter horizontalmente",
      shortcut: "Ctrl+H",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.set('flipX', !activeObject.flipX);
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    flipVertical: {
      name: "flip-vertical",
      icon: "uil-flip-v",
      label: "Inverter verticalmente",
      shortcut: "Ctrl+V",
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();  
        if (activeObject) {
          activeObject.set('flipY', !activeObject.flipY);
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    lock: {
      name: "lock",
      icon: "uil-lock-open-alt",
      label: "Bloquear",
      shortcut: false,
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          activeObject.lockMovementX = true;
          activeObject.lockMovementY = true;
          activeObject.lockScalingX = true;
          activeObject.lockScalingY = true;
          activeObject.lockRotation = true;
          activeObject.lockUniScaling = true;
          activeObject.lockSkewingX = true;
          activeObject.lockSkewingY = true;
          activeObject.hasControls = true;
          activeObject.hasRotatingPoint = true;
          activeObject.locked = true;
          canvas.requestRenderAll();
          canvas.fire("object:modified");
          canvas.setActiveObject(activeObject);
        }
      }
    },
    unlock: {
      name: "unlock",
      icon: "uil-lock-alt",
      label: "Desbloquear",
      shortcut: false,
      enabled: true,
      handler: function(canvas) {
        const activeObject = canvas.getActiveObject();  
        if (activeObject) {
          activeObject.lockMovementX = false;
          activeObject.lockMovementY = false;
          activeObject.lockScalingX = false;
          activeObject.lockScalingY = false;
          activeObject.lockRotation = false;
          activeObject.evented = true;
          activeObject.locked = false;
          canvas.requestRenderAll();
          canvas.fire("object:modified");
        }
      }
    },
    showDuration: {
      name: "show-duration",
      icon: "uil-clock",
      label: "Show duration",
      shortcut: false,
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    },
    addLink: {
      name: "add-link",
      icon: "uil-link",
      label: "Add link",
      shortcut: "Ctrl+K",
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    },
    removeLink: {
      name: "remove-link",
      icon: "uil-link-broken",
      label: "Remove link",
      shortcut: "Ctrl+Shift+K",
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    },
    editLink: {
      name: "edit-link",
      icon: "uil-link",
      label: "Edit link",
      shortcut: "Ctrl+K",
      enabled: false,
      handler: function(canvas) {
        alert("coming soon");
      }
    }
  };

  function initializeCanvasActions() {
    const self = this;
    const canvas = this.canvas;
    let updateMenuItemsVisibility = null;

    // Função para registrar a função de atualização do menu
    function registerMenuUpdateFunction(callback) {
      updateMenuItemsVisibility = callback;
    }

    // Função para executar uma ação
    function executeAction(actionName) {
      const action = ACTIONS[actionName];
      if (action && action.handler) {
        action.handler(canvas);
        // Atualiza a visibilidade dos itens do menu após executar a ação
        if (updateMenuItemsVisibility) {
          updateMenuItemsVisibility();
        }
      }
    }

    // Função para obter uma ação pelo nome
    function getAction(actionName) {
      return ACTIONS[actionName];
    }

    // Função para obter todas as ações
    function getAllActions() {
      return ACTIONS;
    }

    // Expõe as funções necessárias
    this.executeAction = executeAction;
    this.getAction = getAction;
    this.getAllActions = getAllActions;
    this.registerMenuUpdateFunction = registerMenuUpdateFunction;
  }

  // Adiciona o método ao protótipo do ImageEditor
  window.ImageEditor.prototype.initializeCanvasActions = initializeCanvasActions;
})();
  