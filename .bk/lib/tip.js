/**
 * Define actions to manage tip section
 */
(function () {
  'use strict';

  function tipPanel() {
    const defaultTips = [
      'Tip: use arrows to move a selected object by 1 pixel!',
      'Tip: Shift + Click to select and modify multiple objects!',
      'Tip: hold Shift when rotating an object for 15° angle jumps!',
      'Tip: hold Shift when drawing a line for 15° angle jumps!',
      'Tip: Ctrl +/-, Ctrl + wheel to zoom in and zoom out!',
      'Tip: Shift + R to toggle rulers!',
      'Tip: hold Shift when drawing a circle or rectangle to keep the 1:1 ratio!',
    ]
    const _self = this;
    $(`${this.containerSelector} #footerbar`).prepend(`
    <div id="tip-container">${defaultTips[parseInt(Math.random() * defaultTips.length)]}</div>`)
    this.hideTip = function () {
      $(`${_self.containerSelector} #footerbar #tip-container`).hide();
    }

    this.showTip = function () {
      $(`${_self.containerSelector} #footerbar #tip-container`).show();
    }

    this.updateTip = function (str) {
      typeof str === 'string' && $(`${_self.containerSelector} #footerbar #tip-container`).html(str);
    }

    this.updateTipRandom = function () {
      const randomTip = defaultTips[parseInt(Math.random() * defaultTips.length)];
      this.updateTip(randomTip);
    }
  }

  window.ImageEditor.prototype.initializeTipSection = tipPanel;
})();