import { db } from './db.js';

let currentSheetId = null;

const els = {
    dashboardView: document.getElementById('dashboardView'),
    sheetView: document.getElementById('sheetView'),
    sheetsGrid: document.getElementById('sheetsGrid'),
    emptyState: document.getElementById('emptyState'),
    btnNewSheet: document.getElementById('btnNewSheet'),
    
    currentSheetTitle: document.getElementById('currentSheetTitle'),
    currentSheetCount: document.getElementById('currentSheetCount'),
    btnBackToDashboard: document.getElementById('btnBackToDashboard'),
    btnPrintSheet: document.getElementById('btnPrintSheet'),
    a3Grid: document.getElementById('a3Grid'),
    
    sheetModal: document.getElementById('sheetModal'),
    modalTitle: document.getElementById('modalTitle'),
    sheetNameInput: document.getElementById('sheetNameInput'),
    btnCancelModal: document.getElementById('btnCancelModal'),
    btnSaveSheet: document.getElementById('btnSaveSheet'),
    btnPasteTop: null, // Will create dynamically or just use slots
};

let editingSheetId = null;
const COPY_STORAGE_KEY = 'polaroify_a3_copied_slot';

// Initial render
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we arrived here back from the generator
    const urlParams = new URLSearchParams(window.location.search);
    const returnSheetId = urlParams.get('sheetId');
    if (returnSheetId) {
        await openSheet(Number(returnSheetId));
    } else {
        await loadDashboard();
    }
});

async function loadDashboard() {
    els.dashboardView.style.display = 'block';
    els.sheetView.style.display = 'none';
    currentSheetId = null;

    const sheets = await db.getAllSheets();
    renderSheets(sheets);
}

function renderSheets(sheets) {
    els.sheetsGrid.innerHTML = '';
    
    if (!sheets || sheets.length === 0) {
        els.sheetsGrid.appendChild(els.emptyState);
        els.emptyState.style.display = 'block';
        return;
    }

    els.emptyState.style.display = 'none';

    // Sort by newest
    sheets.sort((a, b) => b.createdAt - a.createdAt);

    for (const sheet of sheets) {
        const d = new Date(sheet.createdAt);
        const card = document.createElement('div');
        card.className = 'sheet-card';
        card.innerHTML = `
            <div class="sheet-header">
                <div>
                    <h3 class="sheet-title" title="${escapeHtml(sheet.name)}">${escapeHtml(sheet.name)}</h3>
                    <p class="sheet-meta">Created ${d.toLocaleDateString()}</p>
                </div>
            </div>
            <div class="sheet-actions">
                <button class="btn-secondary btn-open-sheet" data-id="${sheet.id}">Open</button>
                <button class="btn-secondary btn-rename-sheet" data-id="${sheet.id}" data-name="${escapeHtml(sheet.name)}">Rename</button>
                <button class="btn-danger btn-delete-sheet" data-id="${sheet.id}">Delete</button>
            </div>
        `;
        
        card.querySelector('.btn-open-sheet').addEventListener('click', () => openSheet(sheet.id));
        card.querySelector('.btn-rename-sheet').addEventListener('click', (e) => {
            e.stopPropagation();
            openModal('Rename Sheet', sheet.name, sheet.id);
        });
        card.querySelector('.btn-delete-sheet').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this sheet and all its polaroids?')) {
                await db.deleteSheet(sheet.id);
                loadDashboard();
            }
        });

        els.sheetsGrid.appendChild(card);
    }
}

async function openSheet(id) {
    const sheet = await db.getSheet(id);
    if (!sheet) {
        alert("Sheet not found");
        window.history.replaceState({}, document.title, window.location.pathname);
        loadDashboard();
        return;
    }

    currentSheetId = id;
    els.dashboardView.style.display = 'none';
    els.sheetView.style.display = 'flex';
    els.currentSheetTitle.textContent = sheet.name;

    // Update URL to allow sharing / reloading
    const url = new URL(window.location);
    url.searchParams.set('sheetId', id);
    window.history.pushState({}, '', url);

    await renderGrid(id);
}

async function renderGrid(sheetId) {
    els.a3Grid.innerHTML = '';
    const slots = await db.getSlotsForSheet(sheetId);
    
    // Create map for easy lookup
    const slotMap = new Map();
    for (const slot of slots) {
        slotMap.set(slot.slotIndex, slot);
    }

    let filledCount = 0;

    // Check if we have a copied slot
    const copiedStr = localStorage.getItem(COPY_STORAGE_KEY);
    let hasCopied = false;
    if (copiedStr) {
        try {
            JSON.parse(copiedStr);
            hasCopied = true;
        } catch (e) {}
    }

    for (let i = 0; i < 25; i++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'grid-cell';
        
        const slotEl = document.createElement('div');
        slotEl.className = 'grid-slot';
        
        const slotData = slotMap.get(i);
        if (slotData) {
            filledCount++;
            slotEl.innerHTML = `
                <img src="${slotData.dataUrl}" alt="Polaroid slot ${i + 1}" />
                <div class="slot-actions">
                    <button class="btn-edit-slot">Replace</button>
                    ${slotData.snapshot ? `<button class="btn-update-slot">Edit</button>` : ''}
                    <button class="btn-copy-slot">Copy</button>
                    <button class="btn-delete-slot">Remove</button>
                </div>
            `;
            
            slotEl.querySelector('.btn-edit-slot').addEventListener('click', (e) => {
                e.stopPropagation();
                goToGenerator(sheetId, i);
            });
            
            const updateBtn = slotEl.querySelector('.btn-update-slot');
            if (updateBtn) {
                updateBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToGenerator(sheetId, i, true);
                });
            }

            slotEl.querySelector('.btn-copy-slot').addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.setItem(COPY_STORAGE_KEY, JSON.stringify({
                    dataUrl: slotData.dataUrl,
                    snapshot: slotData.snapshot
                }));
                alert("Polaroid copied! You can now paste it into any empty slot.");
                renderGrid(sheetId); // Re-render to show paste buttons
            });

            slotEl.querySelector('.btn-delete-slot').addEventListener('click', (e) => {
                e.stopPropagation();
                setTimeout(async () => {
                    if (confirm('Remove this polaroid from the sheet?')) {
                        await db.deleteSlot(sheetId, i);
                        renderGrid(sheetId);
                    }
                }, 10);
            });
        } else {
            slotEl.classList.add('empty');
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'slot-actions';
            
            if (hasCopied) {
                const pasteBtn = document.createElement('button');
                pasteBtn.className = 'btn-paste-slot';
                pasteBtn.textContent = 'Paste Here';
                pasteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const copiedData = JSON.parse(localStorage.getItem(COPY_STORAGE_KEY));
                        if (!copiedData || !copiedData.dataUrl) throw new Error("Invalid clipboard data");
                        await db.saveSlot(sheetId, i, copiedData.dataUrl, copiedData.snapshot);
                        renderGrid(sheetId);
                    } catch (err) {
                        alert("Failed to paste: the copied data is corrupted or missing.");
                        console.error("Paste error", err);
                    }
                });
                actionsDiv.appendChild(pasteBtn);
            }
            
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'btn-upload-slot';
            uploadBtn.style.marginTop = hasCopied ? '8px' : '0';
            uploadBtn.style.marginBottom = hasCopied ? '0' : '8px';
            uploadBtn.textContent = 'Upload Image';
            
            const createBtn = document.createElement('button');
            createBtn.className = 'btn-edit-slot';
            createBtn.style.marginTop = hasCopied ? '8px' : '0';
            createBtn.textContent = 'Create New';
            createBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToGenerator(sheetId, i);
            });
            
            actionsDiv.appendChild(uploadBtn);
            actionsDiv.appendChild(createBtn);
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'hidden-upload';
            fileInput.accept = 'image/png, image/jpeg, image/jpg';
            fileInput.style.display = 'none';
            
            uploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        await db.saveSlot(sheetId, i, event.target.result, null);
                        renderGrid(sheetId);
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            slotEl.appendChild(actionsDiv);
            slotEl.appendChild(fileInput);
        }
        
        cellEl.appendChild(slotEl);
        els.a3Grid.appendChild(cellEl);
    }
    
    els.currentSheetCount.textContent = `${filledCount}/25 slots filled`;
}

function goToGenerator(sheetId, slotIndex, isEdit = false) {
    let url = `/generator.html?sheetId=${sheetId}&slot=${slotIndex}`;
    if (isEdit) {
        url += '&edit=1';
    }
    window.location.href = url;
}

// Modal handling
function openModal(title, initialValue = '', sheetId = null) {
    editingSheetId = sheetId;
    els.modalTitle.textContent = title;
    els.sheetNameInput.value = initialValue;
    els.sheetModal.classList.add('active');
    els.sheetNameInput.focus();
}

function closeModal() {
    els.sheetModal.classList.remove('active');
    els.sheetNameInput.value = '';
    editingSheetId = null;
}

// Event Listeners
els.btnNewSheet.addEventListener('click', () => openModal('Create New Sheet'));
els.btnCancelModal.addEventListener('click', closeModal);
els.btnBackToDashboard.addEventListener('click', () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    els.sheetView.classList.add('hidden');
    setTimeout(() => {
        loadDashboard();
    }, 10);
});
els.btnPrintSheet.addEventListener('click', () => {
    window.print();
});

els.btnSaveSheet.addEventListener('click', async () => {
    const name = els.sheetNameInput.value.trim();
    if (!name) {
        alert("Please enter a name for the sheet.");
        return;
    }

    if (editingSheetId) {
        const sheet = await db.getSheet(editingSheetId);
        if (sheet) {
            sheet.name = name;
            await db.saveSheet(sheet);
        }
    } else {
        await db.saveSheet({
            id: Date.now(),
            name: name,
            createdAt: Date.now()
        });
    }

    closeModal();
    loadDashboard();
});

els.sheetNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') els.btnSaveSheet.click();
    if (e.key === 'Escape') closeModal();
});

function escapeHtml(unsafe) {
    return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
