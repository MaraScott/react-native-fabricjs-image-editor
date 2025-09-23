(function () {
  'use strict';

  var confirmation = function () {
    const editor = this;

    const getHostElement = () => {
      if (editor.containerEl && editor.containerEl[0] instanceof HTMLElement) {
        return editor.containerEl[0];
      }
      return document.body;
    };

    const removeExistingDialog = () => {
      const existing = document.querySelector('.image-editor-confirm');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };

    const focusButton = (button) => {
      try {
        button.focus({ preventScroll: true });
      } catch (error) {
        try {
          button.focus();
        } catch (_) {
          // ignore focus errors
        }
      }
    };

    this.confirm = (message, options = {}) => {
      const promptMessage = typeof message === 'string' ? message : '';
      const { confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = options || {};

      return new Promise((resolve) => {
        removeExistingDialog();

        const host = getHostElement();
        const overlay = document.createElement('div');
        overlay.className = 'image-editor-confirm';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        if (promptMessage) {
          overlay.setAttribute('aria-label', promptMessage);
        }

        const content = document.createElement('div');
        content.className = 'image-editor-confirm__content';

        if (promptMessage) {
          const messageNode = document.createElement('p');
          messageNode.className = 'image-editor-confirm__message';
          messageNode.textContent = promptMessage;
          content.appendChild(messageNode);
        }

        const actions = document.createElement('div');
        actions.className = 'image-editor-confirm__actions';

        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'image-editor-confirm__button image-editor-confirm__button--confirm';
        confirmButton.textContent = confirmLabel;

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'image-editor-confirm__button image-editor-confirm__button--cancel';
        cancelButton.textContent = cancelLabel;

        actions.appendChild(confirmButton);
        actions.appendChild(cancelButton);
        content.appendChild(actions);
        overlay.appendChild(content);
        host.appendChild(overlay);

        let settled = false;
        const cleanup = (result) => {
          if (settled) return;
          settled = true;
          document.removeEventListener('keydown', onKeyDown, true);
          overlay.removeEventListener('click', onOverlayClick);
          confirmButton.removeEventListener('click', onConfirm);
          cancelButton.removeEventListener('click', onCancel);
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          resolve(result);
        };

        const onConfirm = (event) => {
          event.preventDefault();
          cleanup(true);
        };

        const onCancel = (event) => {
          event.preventDefault();
          cleanup(false);
        };

        const onOverlayClick = (event) => {
          if (event.target === overlay) {
            event.preventDefault();
            cleanup(false);
          }
        };

        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            cleanup(false);
            return;
          }

          if ((event.key === 'Enter' || event.key === 'Return') && document.activeElement === confirmButton) {
            event.preventDefault();
            cleanup(true);
          }
        };

        confirmButton.addEventListener('click', onConfirm);
        cancelButton.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKeyDown, true);

        requestAnimationFrame(() => focusButton(confirmButton));
      });
    };
  };

  window.ImageEditor.prototype.initializeConfirmationDialog = confirmation;
})();
