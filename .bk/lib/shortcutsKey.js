/**
 * Gerenciamento centralizado de teclas de atalho
 */
(function () {
  "use strict";

  let SHORTCUTS;

  function initializeShortcuts() {
    const self = this;

    SHORTCUTS = self.getAllActions();

    // Função para obter o atalho pelo nome da ação
    function getShortcutByAction(action) {
      return Object.values(SHORTCUTS).find(
        (shortcut) => shortcut.name === action
      );
    }

    // Função para atualizar os atalhos no menu
    function updateMenuShortcuts() {
      const menuItems = document.querySelectorAll(".menu .item[data-action]");
      menuItems.forEach((item) => {
        const action = item.getAttribute("data-action");
        const shortcut = getShortcutByAction(action);
        if (shortcut) {
          const shortcutElement = item.querySelector(".shortcutkey");
          if (shortcutElement) {
            shortcutElement.textContent = shortcut.shortcut;
          }
        }
      });
    }

    // Adiciona os event listeners para as teclas de atalho
    document.addEventListener("keydown", async (e) => {
      const key = e.key.toUpperCase();
      const ctrlKey = e.ctrlKey;
      const altKey = e.altKey;
      const shiftKey = e.shiftKey;

      // Mapeamento de teclas problemáticas usando e.code
        let normalizedKey = key;
        if (key === "ª") {
            normalizedKey = "["; // Normaliza para "[" independentemente do caractere
        } else if (key === "º") {
            normalizedKey = "]"; // Normaliza para "]" independentemente do caractere
        }

      // Constrói a combinação de teclas
      let keyCombination = [];
      if (ctrlKey) keyCombination.push("Ctrl");
      if (altKey) keyCombination.push("Alt");
      if (shiftKey) keyCombination.push("Shift");
      keyCombination.push(normalizedKey);

      const keyString = keyCombination.join("+");

      // Procura por uma ação correspondente à combinação de teclas
      const shortcut = Object.values(SHORTCUTS).find(
        (s) => s.shortcut === keyString && s.enabled
      );
      if (shortcut) {
        e.preventDefault();
        // if (shortcut.name === "paste") {
        //   console.log(shortcut.name);
        //   const activeObject = self.canvas.getActiveObject();
        //   if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {   
        //     return;
        //   }
        // }
        
        self.executeAction(shortcut.name);
        return;        
      }
    });

    // Atualiza os atalhos quando o menu é inicializado
    updateMenuShortcuts();

    // Expõe as funções necessárias
    this.getShortcutByAction = getShortcutByAction;
    this.updateMenuShortcuts = updateMenuShortcuts;
  }

  // Adiciona o método ao protótipo do ImageEditor
  window.ImageEditor.prototype.initializeShortcuts = initializeShortcuts;
})();
