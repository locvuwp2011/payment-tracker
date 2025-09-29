// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyDw_7WPzXetyDif9pc4iHlvHhw31z_hCxc",
  authDomain: "payment-tracker-9104a.firebaseapp.com",
  projectId: "payment-tracker-9104a",
  storageBucket: "payment-tracker-9104a.firebasestorage.app",
  messagingSenderId: "30983909978",
  appId: "1:30983909978:web:65ab7b08ec6821fec59e63"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let lastVisible = null;
let editId = null;
const pageSize = 10;

function loadPayments(reset = true) {
  let query = db.collection('payments').orderBy('date', 'desc');
  if (lastVisible && !reset) {
    query = query.startAfter(lastVisible);
  }
  query.limit(pageSize).get().then(snapshot => {
    if (reset) document.getElementById('payment-table').innerHTML = '';
    if (!snapshot.empty) lastVisible = snapshot.docs[snapshot.docs.length - 1];
    snapshot.forEach(doc => {
      const p = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class='border px-2 py-2'>${p.date}</td>
        <td class='border px-2 py-2'>${p.description}</td>
        <td class='border px-2 py-2'>${p.amount}</td>
        <td class='border px-2 py-2'>${p.type}</td>
        <td class='border px-2 py-2'>${p.category}</td>
        <td class='border px-2 py-2'>
          <button onclick='editPayment("${doc.id}")' class='text-blue-500'>Edit</button>
          <button onclick='deletePayment("${doc.id}")' class='text-red-500 ml-2'>Delete</button>
        </td>
      `;
      document.getElementById('payment-table').appendChild(row);
    });
    renderChart();
  });
}

function savePayment(e) {
  e.preventDefault();
  const data = {
    date: document.getElementById('date').value,
    description: document.getElementById('description').value,
    amount: parseFloat(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value
  };
  if (editId) {
    db.collection('payments').doc(editId).set(data).then(() => {
      editId = null;
      e.target.reset();
      lastVisible = null;
      loadPayments();
    });
  } else {
    db.collection('payments').add(data).then(() => {
      e.target.reset();
      lastVisible = null;
      loadPayments();
    });
  }
}

function deletePayment(id) {
  db.collection('payments').doc(id).delete().then(() => {
    lastVisible = null;
    loadPayments();
  });
}

function editPayment(id) {
  db.collection('payments').doc(id).get().then(doc => {
    const p = doc.data();
    document.getElementById('date').value = p.date;
    document.getElementById('description').value = p.description;
    document.getElementById('amount').value = p.amount;
    document.getElementById('type').value = p.type;
    document.getElementById('category').value = p.category;
    editId = id;
  });
}

function renderChart() {
  db.collection('payments').get().then(snapshot => {
    const paymentTotals = Array(12).fill(0);
    const incomeTotals = Array(12).fill(0);
    snapshot.forEach(doc => {
      const p = doc.data();
      const month = new Date(p.date).getMonth();
      if (p.type === 'Payment') paymentTotals[month] += p.amount;
      else incomeTotals[month] += p.amount;
    });
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (window.barChart) window.barChart.destroy();
    window.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          { label: 'Payments', data: paymentTotals, backgroundColor: 'rgba(239,68,68,0.5)', borderColor: 'rgba(239,68,68,1)', borderWidth: 1 },
          { label: 'Income', data: incomeTotals, backgroundColor: 'rgba(34,197,94,0.5)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1 }
        ]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  });
}

function exportCSV() {
  db.collection('payments').get().then(snapshot => {
    let csv = 'Date,Description,Amount,Type,Category';
    snapshot.forEach(doc => {
      const p = doc.data();
      csv += `${p.date},${p.description},${p.amount},${p.type},${p.category}
`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

document.getElementById('payment-form').addEventListener('submit', savePayment);
document.getElementById('load-more').addEventListener('click', () => loadPayments(false));
document.getElementById('export-csv').addEventListener('click', exportCSV);
window.onload = () => loadPayments();
