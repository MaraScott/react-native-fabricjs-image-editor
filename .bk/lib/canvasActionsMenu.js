/**
 * Defines the canvas context menu functionality for the editor
 */
(function () {
  "use strict";

  // Constantes
  const CONSTANTS = {
    MENU_MARGIN: 5,
    SUBMENU_OFFSET: 15,
    ACTION_MENU_OFFSET: 40,
  };

  // Templates HTML
  const TEMPLATES = {
    objMenu: `
      <div class="actions">
        <div class="actions-item" data-action="group" title="Group">
          <span>Group</span>
        </div>
        <div class="actions-item" data-action="ungroup" title="Ungroup">
          <span>Ungroup</span>
        </div>
        <div class="actions-item" data-action="comment" title="Comment">
          <i class="uil uil-comment-plus"></i>
        </div>
        <div class="actions-item" data-action="lock" title="Lock">
          <i class="uil uil-lock-open-alt"></i>
        </div>
        <div class="actions-item" data-action="unlock" title="Unlock">
          <i class="uil uil-lock-alt"></i>
        </div>        
        <div class="actions-item" data-action="duplicate" title="Duplicate">
          <i class="uil uil-minus-path"></i>
        </div>
        <div class="actions-item" data-action="delete" title="Delete">
          <i class="uil uil-trash-alt"></i>
        </div>
        <div class="actions-item" id="action-menu" title="Actions">
          <i class="uil uil-ellipsis-h"></i>
        </div>
      </div>
    `,
    menuWrapper: `
      <div class="menu-wrapper" style="visibility: hidden;">
        <div class="content">
          <ul class="menu">
            <li class="item" data-action="copy">
              <i class="uil uil-copy"></i>
              <span>Copy</span>
              <span class="shortcutkey">Ctrl+C</span>
            </li>
            <li class="item" data-action="paste">
              <i class="uil uil-clipboard"></i>
              <span>Paste</span>
              <span class="shortcutkey">Ctrl+V</span>
            </li>
            <li class="item" data-action="duplicate">
              <i class="uil uil-minus-path"></i>
              <span>Duplicate</span>
              <span class="shortcutkey">Ctrl+D</span>
            </li>
            <li class="item" data-action="delete">
              <i class="uil uil-trash-alt"></i>
              <span>Delete</span>
              <span class="shortcutkey">DELETE</span>
            </li>

            <div class="divisor"></div>
            <li class="item sub-nivel">
              <div>
                <i class="uil uil-layers"></i>
                <span>Layers</span>
              </div>
              <i class="uil uil-angle-right"></i>
              <ul class="sub-nivel-menu">
                <li class="item" data-action="moveForward">
                  <i class="uil uil-top-arrow-to-top"></i>
                  <span>Forward</span>
                  <span class="shortcutkey">Ctrl+]</span>
                </li>
                <li class="item" data-action="moveFullForward">
                  <i class="uil uil-top-arrow-to-top"></i>
                  <span>Bring to Front</span>
                  <span class="shortcutkey">Ctrl+]</span>
                </li>
                <li class="item" data-action="moveBackward">
                  <i class="uil uil-arrow-to-bottom"></i>
                  <span>Backward</span>
                  <span class="shortcutkey">Ctrl+Alt+[</span>
                </li>
                <li class="item" data-action="moveFullBackward">
                  <i class="uil uil-arrow-to-bottom"></i>
                  <span>Send Backward</span>
                  <span class="shortcutkey">Ctrl+Alt[</span>
                </li>
                <div class="divisor"></div>
                <li class="item" data-action="showLayers">
                  <i class="uil uil-layers"></i>
                  <span>Show Layers</span>
                  <span class="shortcutkey">Alt+1</span>
                </li>
              </ul>
            </li>
            <li class="item sub-nivel">
              <div>
                <i class="uil uil-horizontal-align-left"></i>
                <span>Align to Page</span>
              </div>
              <i class="uil uil-angle-right"></i>
              <ul class="sub-nivel-menu">
                <li class="item" data-action="alignLeft">
                  <i class="uil uil-horizontal-align-left"></i>
                  <span>Align Left</span>
                </li>
                <li class="item" data-action="alignCenter">
                  <i class="uil uil-horizontal-align-center"></i>
                  <span>Align Center</span>
                </li>
                <li class="item" data-action="alignRight">
                  <i class="uil uil-horizontal-align-right"></i>
                  <span>Align Right</span>
                </li>
                <div class="divisor"></div>

                <li class="item" data-action="alignTop">
                  <i class="uil uil-vertical-align-top"></i>
                  <span>Align Top</span>
                </li>
                <li class="item" data-action="alignCenterVertical">
                  <i class="uil uil-vertical-align-center"></i>
                  <span>Align Center</span>
                </li>
                <li class="item" data-action="alignBottom">
                  <i class="uil uil-vertical-align-bottom"></i>
                  <span>Align Bottom</span>
                </li>
              </ul>
            </li>
            <li class="item sub-nivel">
              <div>
                <i class="uil uil-flip-v-alt"></i>
                <span>Flip</span>
              </div>
              <i class="uil uil-angle-right"></i>
              <ul class="sub-nivel-menu">
                <li class="item" data-action="flipHorizontal">
                  <i class="uil uil-flip-h"></i>
                  <span>Flip Horizontal</span>
                </li>
                <li class="item" data-action="flipVertical">
                  <i class="uil uil-flip-v"></i>
                  <span>Flip Vertical</span>
                </li>                
              </ul>
            </li>
            <div class="divisor"></div>
            <li class="item" data-action="group">
              <i class="uil uil-object-group"></i>
              <span>Group</span>
              <span class="shortcutkey">Ctrl+G</span>
            </li>
            <li class="item" data-action="ungroup">
              <i class="uil uil-object-ungroup"></i>
              <span>Ungroup</span>
              <span class="shortcutkey">Ctrl+Shift+G</span>
            </li>
            <li class="item" data-action="lock">
              <i class="uil uil-lock-open-alt"></i>
              <span>Lock</span>
            </li>
            <li class="item" data-action="unlock">
              <i class="uil uil-lock-alt"></i>
              <span>Unlock</span>
            </li>
            <li class="item" data-action="showDuration">
              <i class="uil uil-clock"></i>
              <span>Show Duration</span>
            </li>
            <li class="item" data-action="comment">
              <i class="uil uil-comment-plus"></i>
              <span>Comment</span>
              <span class="shortcutkey">Ctrl+Alt+N</span>
            </li>
            <li class="item" data-action="addLink">
              <i class="uil uil-link-add"></i>
              <span>Add Link</span>
              <span class="shortcutkey">Ctrl+K</span>
            </li>
            <li class="item" data-action="removeLink">
              <i class="uil uil-link-broken"></i>
              <span>Remove Link</span>
              <span class="shortcutkey">Ctrl+Shift+K</span>
            </li>
            <li class="item" data-action="editLink">
              <i class="uil uil-link"></i>
              <span>Edit Link</span>
              <span class="shortcutkey">Ctrl+K</span>
            </li>
          </ul>
        </div>
      </div>
    `,
  };

  function initializeCanvasActionsMenu() {
    const self = this;
    const canvas = this.canvas;
    const container = this.containerEl[0];
    let objMenu = document.querySelector("#obj-menu");
    let canvasContainer = document.querySelector(".canvas-container");
    let selectedObject = null;

    // Inicializa o sistema de ações
    this.initializeCanvasActions();

    // Registra a função de atualização do menu
    this.registerMenuUpdateFunction(updateMenuPosition);

    // Criação dos elementos do menu
    if (!objMenu) {
      objMenu = document.createElement("div");
      objMenu.id = "obj-menu";
      objMenu.innerHTML = TEMPLATES.objMenu;
      canvasContainer.appendChild(objMenu);
    }

    const menuWrapper = document.createElement("div");
    menuWrapper.innerHTML = TEMPLATES.menuWrapper;
    document.body.appendChild(menuWrapper);

    // Referências aos elementos do DOM
    const actionMenu = document.querySelector("#obj-menu");
    const contextMenu = document.querySelector(".menu-wrapper");
    const subNivel = document.querySelectorAll(".sub-nivel");
    const btnActionMenu = document.querySelector("#action-menu");

    // Função para atualizar a visibilidade dos itens do menu
    function updateMenuItemsVisibility() {
      // Obtém todos os itens de ação
      const actionItems = document.querySelectorAll("[data-action]");
      if (!selectedObject) {
        actionMenu.style.display = "none";

        // Esconde todos os itens do menu
        actionItems.forEach((item) => {
          if (
            item.getAttribute("data-action") === "paste" ||
            item.getAttribute("data-action") === "comment"
          ) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });

        checkSubNivelVisibility();

        return;
      }

      // Mostra o menu de ações
      actionMenu.style.display = "block";
      btnActionMenu.style.display = "block";

      if (selectedObject.locked) {
        btnActionMenu.style.display = "none";
      }

      actionItems.forEach((item) => {
        const action = item.getAttribute("data-action");

        if (selectedObject.locked && action !== "unlock") {
          item.style.display = "none";
          return;
        }

        switch (action) {
          case "group":
            // Mostra apenas se não for um grupo e houver mais de um objeto selecionado
            item.style.display =
              !selectedObject.isType("group") &&
              canvas.getActiveObjects().length > 1
                ? ""
                : "none";
            break;

          case "ungroup":
            // Mostra apenas se for um grupo
            item.style.display = selectedObject.isType("group") ? "" : "none";
            break;

          case "lock":
            // Mostra apenas se o objeto não estiver bloqueado
            item.style.display = !selectedObject.locked ? "" : "none";
            break;

          case "unlock":
            // Mostra apenas se o objeto estiver bloqueado
            item.style.display = selectedObject.locked ? "" : "none";
            break;

          case "moveForward":
          case "moveFullForward":
          case "moveBackward":
          case "moveFullBackward":
            // Mostra apenas se não for um grupo ou se for um grupo com objetos desbloqueados
            const canMove =
              !selectedObject.isType("group") ||
              (selectedObject.isType("group") && !selectedObject.locked);
            item.style.display = canMove ? "" : "none";
            break;

          case "delete":
            // Mostra apenas se o objeto não estiver bloqueado
            item.style.display = !selectedObject.locked ? "" : "none";
            break;

          case "addLink":
            // Mostra apenas se o objeto não estiver bloqueado
            item.style.display = !selectedObject.link ? "" : "none";
            break;

          case "removeLink":
            // Mostra apenas se o objeto estiver bloqueado
            item.style.display = selectedObject.link ? "" : "none";
            break;

          case "editLink":
            // Mostra apenas se o objeto estiver bloqueado
            item.style.display = selectedObject.link ? "" : "none";
            break;

          case "showDuration":
          case "comment":
          case "addLink":
          case "removeLink":
          case "editLink":
            // Mostra apenas se for um objeto
            item.style.display =
              typeof selectedObject.getObjects === "function" &&
              selectedObject.getObjects().length > 1 &&
              !selectedObject.isType("group")
                ? "none"
                : "";
            break;

          default:
            // Para outras ações, mantém visível por padrão
            item.style.display = "";
        }
      });

      checkSubNivelVisibility();
    }

    function checkSubNivelVisibility() {
      // Verifica se todos os itens do submenu estão ocultos
      const subNivelElements = document.querySelectorAll(".sub-nivel");
      const divisorElements = document.querySelectorAll(".divisor");
      let allSubNivelHidden = true;
      subNivelElements.forEach((subNivel) => {
        const menuItems = subNivel.querySelectorAll(".sub-nivel-menu .item");
        let allHidden = true;

        menuItems.forEach((item) => {
          if (item.style.display !== "none") {
            allHidden = false;
          }
        });

        // Se todos os itens estiverem ocultos, oculta o submenu também
        if (allHidden) {
          subNivel.style.display = "none";
        } else {
          subNivel.style.display = "";
          allSubNivelHidden = false;
        }
      });

      if (allSubNivelHidden) {
        divisorElements.forEach((divisor) => {
          divisor.style.display = "none";
        });
      } else {
        divisorElements.forEach((divisor) => {
          divisor.style.display = "";
        });
      }
    }

    // Funções auxiliares
    function updateMenuPosition() {
      if (!selectedObject) return;
      
      if (selectedObject.metadata && (selectedObject.metadata.isMargin || selectedObject.metadata.isGuide)) {
        selectedObject = null;
        return;
      }

      // Verifica se há mais de um objeto selecionado
      const activeObject = canvas.getActiveObject();
      if (
        activeObject &&
        activeObject.type === "activeSelection" &&
        activeObject.getObjects().length > 1
      ) {
        selectedObject = activeObject;
      }

      // Atualiza a visibilidade dos itens do menu
      updateMenuItemsVisibility();

      const objCoords = selectedObject.getBoundingRect();
      const zoom = canvas.getZoom();
      const offset = canvas._offset;

      let menuLeft = selectedObject.left * zoom;
      let menuTop = selectedObject.top * zoom;

      if (
        selectedObject.originX === "left" &&
        selectedObject.originY === "top"
      ) {
        menuLeft = menuLeft + objCoords.width / 2 - objMenu.offsetWidth / 2;
        menuTop = menuTop - objMenu.offsetHeight - 10;
      } else {
        menuLeft = menuLeft - objMenu.offsetWidth / 2;
        menuTop = menuTop - objCoords.height / 2 - objMenu.offsetHeight - 10;
      }

      objMenu.style.left = `${menuLeft}px`;
      objMenu.style.top = `${menuTop}px`;
      objMenu.style.display = "block";
    }

    function showContextMenu(e) {
      e.preventDefault();

      if (e.type === "contextmenu") {
        actionMenu.style.display = "none";
        canvas.discardActiveObject();
        canvas.renderAll();
        selectedObject = null;
      }

      // Verifica se o clique com botão direito foi em um objeto do canvas
      if (e.type === "contextmenu") {
        const pointer = canvas.getPointer(e);
        const clickedObject = canvas.findTarget(e, false);

        if (clickedObject) {
          canvas.setActiveObject(clickedObject);
          canvas.renderAll();
          selectedObject = clickedObject;
        }
      }

      // Atualiza a visibilidade dos itens do menu
      updateMenuItemsVisibility();

      subNivel.forEach((el) => el.classList.remove("active"));

      if (
        e.target.closest("#action-menu") &&
        contextMenu.style.visibility === "visible"
      ) {
        contextMenu.style.visibility = "hidden";
        return;
      }

      const content = contextMenu.querySelector(".content");
      const { clientX: x, clientY: y } = e;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      const cmWidth = contextMenu.offsetWidth;
      const cmHeight = contextMenu.offsetHeight;

      let finalX =
        x > winWidth - cmWidth ? winWidth - cmWidth - CONSTANTS.MENU_MARGIN : x;
      let finalY =
        y > winHeight - cmHeight
          ? winHeight - cmHeight - CONSTANTS.MENU_MARGIN
          : y;

      contextMenu.style.left = `${finalX}px`;
      contextMenu.style.top = `${finalY}px`;
      contextMenu.style.visibility = "visible";

      // Ajusta submenus
      const subMenu = contextMenu.querySelectorAll(".sub-nivel-menu");
      subMenu.forEach((menu) => {
        const rect = menu.getBoundingClientRect();

        menu.style.transform =
          x > winWidth - cmWidth - rect.width
            ? `translateX(-${cmWidth + CONSTANTS.SUBMENU_OFFSET}px)`
            : `translateX(${cmWidth - CONSTANTS.MENU_MARGIN}px)`;

        if (rect.top + rect.height > winHeight) {
          menu.style.top = `-${
            rect.height - (winHeight - rect.top) + CONSTANTS.MENU_MARGIN
          }px`;
        } else {
          menu.style.top = "0";
        }
      });
    }

    // Eventos do Canvas
    canvas.on("layer:locked", (e) => {
      console.log("layer:locked", e);
      updateMenuPosition();
    });

    canvas.on("selection:created", (e) => {
      selectedObject = e.selected[0];
      updateMenuPosition();
    });

    canvas.on("selection:updated", (e) => {
      selectedObject = e.selected[0];
      updateMenuPosition();
    });

    canvas.on("selection:cleared", () => {
      selectedObject = null;
      objMenu.style.display = "none";
    });

    canvas.on("object:scaling", () => {
      if (selectedObject) {
        actionMenu.style.display = "none";
      }
    });

    canvas.on("object:modified", (e) => {
    
      if (selectedObject && selectedObject.type === "activeSelection") {
        selectedObject = canvas.getActiveObject();
        updateMenuPosition();
      }
      if (
        selectedObject &&
        (e.action === "rotate" || e.action === "scale" || e.action === "drag")
      ) {
        actionMenu.style.display = "";
        updateMenuPosition();
      }
    });

    canvas.on("object:moving", () => {
      if (selectedObject) {
        actionMenu.style.display = "none";
      }
    });
    canvas.on("object:rotating", () => {
      if (selectedObject) {
        actionMenu.style.display = "none";
      }
    });

    canvas.on("group:added", (e) => {
      console.log("group:added", selectedObject);
      selectedObject = canvas.getActiveObject();
      if (selectedObject) updateMenuPosition();
    });

    canvas.on("group:removed", (e) => {
      console.log("group:removed", e);
      selectedObject = canvas.getActiveObject();
      if (selectedObject) updateMenuPosition();
    });

    // Event Listeners
    canvasContainer.addEventListener("contextmenu", showContextMenu);
    actionMenu.addEventListener("click", showContextMenu);

    // Event Listeners para ações do menu
    document.querySelectorAll("[data-action]").forEach((element) => {
      element.addEventListener("click", (e) => {
        const actionName = e.target
          .closest("[data-action]")
          .getAttribute("data-action");
        self.executeAction(actionName);
        contextMenu.style.visibility = "hidden";
      });
    });

    // Event Listeners para fechamento do menu
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest("#action-menu") &&
        !e.target.closest(".sub-nivel")
      ) {
        contextMenu.style.visibility = "hidden";
      }
      if (!e.target.closest(".sub-nivel.active")) {
        document
          .querySelectorAll(".sub-nivel")
          .forEach((el) => el.classList.remove("active"));
      }
      if (e.target.closest(".sub-nivel")) {
        e.target.closest(".sub-nivel").classList.toggle("active");
      }
    });

    // Previne o menu de contexto padrão
    const actionsMenu = canvasContainer.querySelector("#obj-menu");
    actionsMenu.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    canvasContainer.querySelectorAll("#obj-menu *").forEach((element) => {
      element.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Inicializa o sistema de atalhos
    this.initializeShortcuts();
  }

  // Função para inicializar o componente de menu de contexto do canvas
  window.ImageEditor.prototype.initializeCanvasActionsMenu =
    initializeCanvasActionsMenu;
})();
