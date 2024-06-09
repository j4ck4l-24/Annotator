let annotations = [];
let toolbar;
let isHighlighting = false;

function createT() {
  toolbar = document.createElement('div');
  toolbar.id = 'web-annotator-toolbar';
  toolbar.innerHTML = `<input type="color" id="highlight-color" value="#59f7a6"><button id="highlight-button">Highlight</button><button id="add-note-button">Add Note</button><button id="export-button">Export</button>`;
  document.body.appendChild(toolbar);

  attachE();

  toolbar.style.cssText = 'position:fixed;top:30vh;right:0;margin:0;display:flex;width:90px;flex-direction:column;align-items:center;background-color:transparent;border:2px white solid;padding:10px;z-index:9999;box-shadow:0 4px 8px rgba(0, 0, 0, 0.25);border-radius:12px;';

  const colorButton = document.getElementById('highlight-color');
  colorButton.style.cssText = 'width:80px;height:40px;margin-bottom:5px;border:none;cursor:pointer;transition:border-color 0.3s, box-shadow 0.3s;background-color:#ff5555;';

  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.cssText = 'width:80px;padding:8px 15px;margin-bottom:5px;background-color:#ff5555;border:none;border-radius:12px;color:#fff;cursor:pointer;font-size:14px;box-shadow:0 4px 8px rgba(0, 0, 0, 0.15);transition:background 0.3s, transform 0.2s, box-shadow 0.2s;display:flex;justify-content:center;align-items:center;';
    setHover(button);
  });

  setHover(colorButton);

  makeDraggable(toolbar);
}

function setHover(button) {
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#ff4500';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#ff5555';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
  });
  button.addEventListener('mousedown', () => {
    button.style.backgroundColor = '#ff5555';
    button.style.transform = 'translateY(1px)';
    button.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.1)';
  });
  button.addEventListener('mouseup', () => {
    button.style.backgroundColor = '#ff5555';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
  });
}

function attachE() {
  document.getElementById('highlight-button').addEventListener('click', () => {
    isHighlighting = !isHighlighting;
    if (isHighlighting) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = 'default';
    }
  });

  document.getElementById('add-note-button').addEventListener('click', () => {
    isHighlighting = false;
    document.body.style.cursor = 'default';

    const note = prompt('Enter your note:');
    if (note) {
      const color = document.getElementById('highlight-color').value;
      const noteDiv = createMovableDiv(note, color);
      document.body.appendChild(noteDiv);
      const date = new Date().toISOString();
      annotations.push({ note: note, position: { top: noteDiv.style.top, left: noteDiv.style.left }, color: color, url: window.location.href, date: date });
      saveA();
    }
  });

  document.getElementById('export-button').addEventListener('click', () => {
    isHighlighting = false;
    document.body.style.cursor = 'default';
    exportPage();
  });

  document.addEventListener('mouseup', () => {
    if (isHighlighting) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const color = document.getElementById('highlight-color').value;
          const span = document.createElement('span');
          span.style.backgroundColor = color;

          try {
            adjustRange(range);
            range.surroundContents(span);
            const date = new Date().toISOString();
            annotations.push({ text: selection.toString(), color: color, url: window.location.href, date: date });
            saveA();
            selection.removeAllRanges();
          } catch (e) {
            console.error('Error while surrounding contents:', e);
          }
        }
      }
    }
  });
}

function adjustRange(range) {
  function expand(range) {
    while (range.startContainer.nodeType !== Node.TEXT_NODE) {
      range.setStartBefore(range.startContainer);
    }
    while (range.endContainer.nodeType !== Node.TEXT_NODE) {
      range.setEndAfter(range.endContainer);
    }
  }

  function split(range) {
    const { startContainer, endContainer, startOffset, endOffset } = range;

    if (startContainer.nodeType !== Node.TEXT_NODE) {
      if (startContainer.childNodes.length > 0) {
        range.setStart(startContainer.childNodes[startOffset], 0);
      } else {
        range.setStart(startContainer, 0);
      }
    }

    if (endContainer.nodeType !== Node.TEXT_NODE) {
      if (endContainer.childNodes.length > 0) {
        range.setEnd(endContainer.childNodes[endOffset - 1], endContainer.childNodes[endOffset - 1].textContent.length);
      } else {
        range.setEnd(endContainer, endContainer.textContent.length);
      }
    }
  }

  split(range);
  expand(range);
}

function createMovableDiv(note, color) {
  const noteDiv = document.createElement('div');
  noteDiv.textContent = note;
  noteDiv.classList.add('movable-note');
  noteDiv.style.cssText = 'position:absolute;top:200px;left:300px;background-color:transparent;color:' + color + ';padding:8px;border:1px solid #000;cursor:move;max-width:300px;width:fit-content;word-wrap:break-word;white-space:pre-wrap;z-index:2000;';
  let offsetX, offsetY;
  let isDragging = false;

  noteDiv.addEventListener('mousedown', (e) => {
    if (!isDragging) {
      isDragging = true;
      offsetX = e.clientX - noteDiv.getBoundingClientRect().left;
      offsetY = e.clientY - noteDiv.getBoundingClientRect().top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });

  function onMouseMove(e) {
    if (isDragging) {
      noteDiv.style.left = `${e.clientX - offsetX}px`;
      noteDiv.style.top = `${e.clientY - offsetY}px`;
    }
  }
  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      annotations = annotations.map(annotation => {
        if (annotation.note === note) {
          annotation.position = { top: noteDiv.style.top, left: noteDiv.style.left };
        }
        return annotation;
      });
      saveA();
    }
  }

  return noteDiv;
}

function removeT() {
  if (toolbar) {
    toolbar.remove();
  }
}

function saveA() {
  chrome.storage.local.set({ annotations: annotations });
}

function loadA() {
  chrome.storage.local.get('annotations', (data) => {
    annotations = data.annotations || [];
    annotations.forEach((annotation) => {
      if (annotation.url === window.location.href) {
        if (annotation.text) {
          highlightT(annotation.text, annotation.color);
        }
        if (annotation.note) {
          const noteDiv = createMovableDiv(annotation.note, annotation.color);
          noteDiv.style.top = annotation.position.top;
          noteDiv.style.left = annotation.position.left;
          document.body.appendChild(noteDiv);
        }
      }
    });
  });
}

function highlightT(text, color) {
  const nodes = findTextNodes(document.body, text);
  nodes.forEach((node) => {
    const range = document.createRange();
    range.setStart(node, node.nodeValue.indexOf(text));
    range.setEnd(node, node.nodeValue.indexOf(text) + text.length);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    try {
      range.surroundContents(span);
    } catch (e) {
      console.error('Error while surrounding contents:', e);
    }
  });
}

function findTextNodes(node, text) {
  const textNodes = [];
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.includes(text)) {
      textNodes.push(node);
    }
  } else {
    node.childNodes.forEach((childNode) => {
      textNodes.push(...findTextNodes(childNode, text));
    });
  }
  return textNodes;
}

function exportPage() {
  const doc = document.cloneNode(true);
  const toolbar = doc.getElementById('web-annotator-toolbar');
  if (toolbar) {
    toolbar.remove();
  }

  const annotationsScript = document.createElement('script');
  annotationsScript.textContent = `(${restoreA.toString()})();\n(${annotationsJSON.toString()})();`;
  doc.body.appendChild(annotationsScript);

  const data = new Blob([doc.documentElement.outerHTML], { type: 'text/html' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${document.title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function restoreA() {
  const annotationsData = annotationsJSON();
  annotationsData.forEach((annotation) => {
    if (annotation.text) {
      highlightT(annotation.text, annotation.color);
    }
    if (annotation.note) {
      const noteDiv = createMovableDiv(annotation.note, annotation.color);
      noteDiv.style.top = annotation.position.top;
      noteDiv.style.left = annotation.position.left;
      document.body.appendChild(noteDiv);
    }
  });
}

function annotationsJSON() {
  return JSON.parse(localStorage.getItem('annotations')) || [];
}

createT();
loadA();

window.addEventListener('beforeunload', removeT);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleToolbar') {
    if (toolbar && toolbar.parentNode) {
      removeT();
    } else {
      createT();
    }
  }
});

 
