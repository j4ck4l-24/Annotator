function fetchAnnotations() {
  chrome.storage.local.get('annotations', (result) => {
    const notes = result.annotations || [];
    renderAnnotations(notes);
  });
}

function renderAnnotations(notes) {
  const notesContainer = document.getElementById('annotations-list');
  notesContainer.innerHTML = '';
  notes.forEach((note, idx) => {
    const item = document.createElement('li');
    
    const detailsSection = document.createElement('div');
    detailsSection.className = 'note-details';
    
    const textSection = document.createElement('div');
    textSection.innerHTML = `<strong>Text:</strong> ${note.text || ''}`;
    detailsSection.appendChild(textSection);
    
    const colorSection = document.createElement('div');
    colorSection.innerHTML = `<strong>Color:</strong> ${note.color}`;
    detailsSection.appendChild(colorSection);
    
    const dateSection = document.createElement('div');
    dateSection.innerHTML = `<strong>Date:</strong> ${new Date(note.date).toLocaleString()}`;
    detailsSection.appendChild(dateSection);
    
    const noteSection = document.createElement('div');
    noteSection.innerHTML = note.note ? `<strong>Note:</strong> ${note.note}` : '';
    detailsSection.appendChild(noteSection);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Delete';
    removeButton.className = 'delete-btn'; 
    removeButton.addEventListener('click', () => {
      removeAnnotation(idx);
    });

    item.appendChild(detailsSection);
    item.appendChild(removeButton);
    notesContainer.appendChild(item);
  });
}

function removeAnnotation(idx) {
  chrome.storage.local.get('annotations', (result) => {
    let notes = result.annotations || [];
    notes.splice(idx, 1);
    chrome.storage.local.set({ annotations: notes }, () => {
      fetchAnnotations();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  });
}

function filterAnnotations() {
  const searchValue = document.getElementById('search-input').value.toLowerCase();
  chrome.storage.local.get('annotations', (result) => {
    const notes = result.annotations || [];
    const filteredNotes = notes.filter(note => {
      const textMatches = note.text && note.text.toLowerCase().includes(searchValue);
      const noteMatches = note.note && note.note.toLowerCase().includes(searchValue);
      const dateMatches = note.date && new Date(note.date).toLocaleString().toLowerCase().includes(searchValue);
      return textMatches || noteMatches || dateMatches;
    });
    renderAnnotations(filteredNotes);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fetchAnnotations();
  document.getElementById('search-input').addEventListener('input', filterAnnotations);
});
