/**
 * Define action to upload, drag & drop images into canvas
 */
(function () {
  var upload = function () {
    const _self = this;

    const canvasHolder = $(_self.containerSelector).find('.canvas-holder');

    const container = $(_self.containerSelector)
    container.on('click', '.drag-drop-input', function () {
      console.log('click drag drop')
      $(`${_self.containerSelector} #btn-image-upload`).click();
    })

    canvasHolder.on("dragover", ".canvas-container", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).addClass('dragging');
    });

    canvasHolder.on("dragleave",".canvas-container", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass('dragging');
    });

    canvasHolder.on("drop",".canvas-container", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass('dragging');
      if (event.originalEvent.dataTransfer) {
        if (event.originalEvent.dataTransfer.files.length) {
          let files = event.originalEvent.dataTransfer.files
          processFiles(files);
          $('.custom-modal-container').remove();
        }
      }
    });

    container.on("dragover", ".drag-drop-input", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).addClass('dragging');
    });

    container.on("dragleave",".drag-drop-input", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass('dragging');
    });

    container.on("drop",".drag-drop-input", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass('dragging');
      if (event.originalEvent.dataTransfer) {
        if (event.originalEvent.dataTransfer.files.length) {
          let files = event.originalEvent.dataTransfer.files
          processFiles(files);
          $('.custom-modal-container').remove();
        }
      }
    });

    this.openDragDropPanel = function () {
      console.log('open drag drop panel')
      container.append(`<div class="custom-modal-container">
        <div class="custom-modal-content">
          <div class="drag-drop-input">
            <div>Drag & drop files<br>or click to browse.<br>JPG, PNG, WEBP or SVG only!</div>
          </div>
        </div>
      </div>`)
      container.on('click', '.custom-modal-container', function () {
        $(this).remove()
      })
    }

    const processFiles = (files) => {      
      if (files.length === 0) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']

      for (let file of files) {
        // check type
        if (!allowedTypes.includes(file.type)) continue

        if(file.type !== 'image/svg+xml' &&_self.api.upload !== undefined && _self.api.upload !== null){
          uploadToAPI(file);
          continue
        }

        let reader = new FileReader()

        // handle svg
        if (file.type === 'image/svg+xml') {
          reader.onload = (f) => {
            fabric.loadSVGFromString(f.target.result, (objects, options) => {
              let obj = fabric.util.groupSVGElements(objects, options)
              obj.set({
                left: 0,
                top: 0
              }).setCoords()
              _self.canvas.add(obj)

              _self.canvas.renderAll()
              _self.canvas.fire('object:modified')
            })
          }
          reader.readAsText(file)
          continue
        }

        // handle image, read file, add to canvas
        reader.onload = (f) => {
          _self.addImageFromUrl(f.target.result)          
        }

        reader.readAsDataURL(file)
      }
    }

    const uploadToAPI = (file) => {
      var formData = new FormData();
      formData.append('file', file);

      fetch(_self.api.upload, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {          
          _self.images.push(data.url)
          $(`${_self.containerSelector} .toolpanel#Images-panel .content .list-images`).prepend(`<div class="button"><img src="${data.url}" /></div>`) 
          _self.addImageFromUrl(data.url)
        } else {
          console.error('Failed uploading file');         
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
    }

    this.containerEl.append(`<input id="btn-image-upload" type="file" accept="image/*" multiple hidden>`);
    document.querySelector(`${this.containerSelector} #btn-image-upload`).addEventListener('change', function (e) {
      if (e.target.files.length === 0) return;
      processFiles(e.target.files)
    })
  }

  window.ImageEditor.prototype.initializeUpload = upload;
})()