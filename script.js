// Função auxiliar para formatar valores em Real
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// Elementos principais
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const grandTotalEl = document.getElementById('grandTotal');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const openSavedBtn = document.getElementById('openSavedBtn');
const savedListsContainer = document.getElementById('savedListsContainer');

// Chaves do localStorage
const STATE_KEY = 'shopping.currentList';
const SAVED_KEY = 'shopping.savedLists';

// Inicializa modais do Materialize
document.addEventListener('DOMContentLoaded', () => {
  M.Modal.init(document.querySelectorAll('.modal'));
  render();
});

// Carregar e salvar estado atual
function loadState() {
  return JSON.parse(localStorage.getItem(STATE_KEY) || '[]');
}
function saveState(list) {
  localStorage.setItem(STATE_KEY, JSON.stringify(list));
}

// Renderiza a lista na tela
function render() {
  const list = loadState();
  productList.innerHTML = '';
  let grand = 0;

  list.forEach((item, idx) => {
    const total = item.qty * item.price;
    grand += total;

    const li = document.createElement('li');
    li.className = 'collection-item';
    li.innerHTML = `
      <div class="product-row">
        <div class="col s12 m5"><strong>${item.name}</strong></div>
        <div class="col s4 m2">Qtd: ${item.qty}</div>
        <div class="col s4 m2 money">Unit: R$ ${fmt(item.price)}</div>
        <div class="col s6 m2 money">Total: R$ ${fmt(total)}</div>
        <div class="col s2 m1 right-align">
          <button class="btn-small red lighten-1 delete-item" data-idx="${idx}">
            <i class="material-icons">delete</i>
          </button>
        </div>
      </div>`;
    productList.appendChild(li);
  });

  grandTotalEl.textContent = fmt(grand);

  document.querySelectorAll('.delete-item').forEach(btn => {
    btn.onclick = () => removeItem(btn.dataset.idx);
  });
}

function addItem(item) {
  const list = loadState();
  list.push(item);
  saveState(list);
  render();
  M.toast({ html: 'Produto adicionado' });
}

function removeItem(index) {
  const list = loadState();
  list.splice(index, 1);
  saveState(list);
  render();
}

function clearAll() {
  localStorage.removeItem(STATE_KEY);
  render();
  M.toast({ html: 'Lista apagada' });
}

// Salvar lista com data
function saveSnapshot() {
  const list = loadState();
  if (!list.length) return M.toast({ html: 'Lista vazia!' });

  const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  saved.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    items: list
  });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  M.toast({ html: 'Lista salva!' });
}

// Eventos
productForm.onsubmit = e => {
  e.preventDefault();
  const name = productForm.productName.value.trim();
  const qty = Number(productForm.productQty.value);
  const price = Number(productForm.productPrice.value);
  if (!name || qty <= 0) return;
  addItem({ name, qty, price });
  productForm.reset();
  productForm.productQty.value = 1;
  productForm.productPrice.value = '0.00';
  M.updateTextFields();
};

clearBtn.onclick = () => {
  if (confirm('Deseja apagar toda a lista?')) clearAll();
};

saveBtn.onclick = saveSnapshot;

// Listas salvas
openSavedBtn.onclick = () => {
  const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  savedListsContainer.innerHTML = saved.length
    ? saved.map(s => `
      <div class="card-panel grey lighten-4">
        <div class="flex" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${new Date(s.date).toLocaleString('pt-BR')}</strong><br>
            ${s.items.length} itens - R$ ${fmt(s.items.reduce((a,b)=>a+b.price*b.qty,0))}
          </div>
          <div>
            <button class="btn-small blue load-list" data-id="${s.id}">Abrir</button>
            <button class="btn-small red delete-list" data-id="${s.id}">Apagar</button>
          </div>
        </div>
      </div>`).join('')
    : '<p>Nenhuma lista salva.</p>';

  document.querySelectorAll('.load-list').forEach(btn => {
    btn.onclick = () => {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY));
      const found = saved.find(s => s.id == btn.dataset.id);
      saveState(found.items);
      render();
      M.toast({ html: 'Lista carregada!' });
    };
  });

  document.querySelectorAll('.delete-list').forEach(btn => {
    btn.onclick = () => {
      let saved = JSON.parse(localStorage.getItem(SAVED_KEY));
      saved = saved.filter(s => s.id != btn.dataset.id);
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
      openSavedBtn.click(); // Atualiza
      M.toast({ html: 'Lista apagada!' });
    };
  });
};

// Registro do Service Worker (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker registrado com sucesso!'))
    .catch(err => console.error('❌ Erro ao registrar o Service Worker:', err));
}