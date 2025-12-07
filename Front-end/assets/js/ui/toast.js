
function showToast(message, type = 'danger') {
  const toastEl = document.getElementById('global-toast');
  const bodyEl = document.getElementById('global-toast-body');

  toastEl.classList.remove('text-bg-danger','text-bg-success','text-bg-warning','text-bg-info');
  toastEl.classList.add(`text-bg-${type}`);

  bodyEl.textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

window.Toast = { show: showToast };
