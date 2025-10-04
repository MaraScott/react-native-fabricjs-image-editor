const icons = require('../assets/img/icons.json');
const container = document.createElement('div');
container.style.fontFamily = 'sans-serif';
container.style.lineHeight = '1.8';
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.gap = '8px';
document.body.appendChild(container);

icons.forEach(icon => {
  const line = document.createElement('div');
  line.style.display = 'flex';
  line.style.alignItems = 'center';
  line.style.gap = '10px';

  const img = document.createElement('img');
  img.src = icon.src.original;
  img.alt = icon.name;
  img.width = 32;
  img.height = 32;
  img.style.backgroundColor = '#aaaaaa';

  const label = document.createElement('span');
  label.textContent = icon.name;

  line.appendChild(img);
  const imglight = img.cloneNode(true); 
  imglight.src = icon.src.light;
  line.appendChild(imglight);
  const imgdark = img.cloneNode(true); 
  imgdark.src = icon.src.dark;
  line.appendChild(imgdark);
  const imgdefault = img.cloneNode(true); 
  imgdefault.src = icon.src[icon.src.default];
  line.appendChild(imgdefault);
  line.appendChild(label);
  container.appendChild(line);
});