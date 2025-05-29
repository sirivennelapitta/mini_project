// Authentication Check
if(!localStorage.getItem('isAuthenticated')) {
  window.location.href = 'index.html';
}

let inventoryData = [];
let chartInstance = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  try {
    inventoryData = await fetchInventoryData();
    initDashboard();
    initEventListeners();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    alert('Failed to load inventory data');
  } finally {
    showLoading(false);
  }
});

// async function fetchInventoryData() {
//   // Simulated API call
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve([
//         { id: 1, product: 'Laptop', status: 'shipped', quantity: 15, date: '2023-07-20' },
//         { id: 2, product: 'Mouse', status: 'pending', quantity: 5, date: '2023-07-19' },
//         { id: 3, product: 'Keyboard', status: 'delivered', quantity: 20, date: '2023-07-18' },
//         { id: 4, product: 'Monitor', status: 'canceled', quantity: 8, date: '2023-07-17' }
//       ]);
//     }, 1000);
//   });
// }
async function fetchInventoryData() {
  const response = await fetch('https://2b7656daj8.execute-api.eu-north-1.amazonaws.com/dev/inventory'); // Replace with your actual URL
  if (!response.ok) {
    throw new Error('Failed to fetch inventory data');
  }
  return await response.json();
}

function initDashboard() {
  updateSummary();
  renderTable();
  initChart();
  checkLowStock();
}

function initEventListeners() {
  document.getElementById('productFilter').addEventListener('input', applyFilters);
  document.getElementById('startDate').addEventListener('change', applyFilters);
  document.getElementById('endDate').addEventListener('change', applyFilters);
}

function updateSummary() {
  const statusCounts = inventoryData.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  document.querySelectorAll('[data-summary]').forEach(card => {
    const status = card.dataset.summary;
    card.querySelector('.card-value').textContent = statusCounts[status] || 0;
  });
}

function renderTable(data = inventoryData) {
  const tbody = document.querySelector('#inventoryTable tbody');
  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${item.product}</td>
      <td>
        <span class="status-badge" data-status="${item.status}">
          ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </td>
      <td>${item.quantity}</td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function applyFilters() {
  const filters = {
    product: document.getElementById('productFilter').value.toLowerCase(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value
  };

  const filteredData = inventoryData.filter(item => {
    const dateMatch = (!filters.startDate || item.date >= filters.startDate) &&
                     (!filters.endDate || item.date <= filters.endDate);
    const productMatch = item.product.toLowerCase().includes(filters.product);
    return dateMatch && productMatch;
  });

  renderTable(filteredData);
  updateChart(filteredData);
}

function initChart() {
  if(chartInstance) chartInstance.destroy();
  
  const ctx = document.getElementById('stockChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: getChartData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Stock Quantity'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
}
function getChartData() {
  const rootStyles = getComputedStyle(document.documentElement);
  const primaryColor = rootStyles.getPropertyValue('--primary').trim();
  
  // Process inventory data for chart
  const stockLevels = inventoryData.map(item => item.quantity);
  const dates = inventoryData.map(item => 
    new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  );

  return {
    labels: dates,
    datasets: [{
      label: 'Stock Levels',
      data: stockLevels,
      borderColor: primaryColor,
      backgroundColor: primaryColor + '40',
      tension: 0.4,
      fill: true,
      borderWidth: 2
    }]
  };
}

function updateChart(data) {
  chartInstance.data.labels = data.map(item => 
    new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  );
  chartInstance.data.datasets[0].data = data.map(item => item.quantity);
  chartInstance.update();
}
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Inventory Report', 10, 15);
  
  doc.autoTable({
    head: [['Product', 'Status', 'Quantity', 'Date']],
    body: inventoryData.map(item => [
      item.product,
      item.status,
      item.quantity,
      new Date(item.date).toLocaleDateString()
    ]),
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] }
  });
  
  doc.save('inventory-report.pdf');
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function checkLowStock() {
  const lowStockItems = inventoryData.filter(item => item.quantity < 10);
  const alert = document.getElementById('lowStockAlert');
  alert.style.display = lowStockItems.length > 0 ? 'block' : 'none';
}



// Put the chart initialization code here

const shippedCount = 120;  // Replace with dynamic values
const pendingCount = 45;
const deliveredCount = 95;

const ctxShipped = document.getElementById('shippedChart').getContext('2d');
const shippedChart = new Chart(ctxShipped, {
  type: 'bar',
  data: {
    labels: ['Shipped'],
    datasets: [{
      label: 'Count',
      data: [shippedCount],
      backgroundColor: 'rgba(33, 150, 243, 0.7)',
      borderColor: 'rgba(33, 150, 243, 1)',
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

const ctxPending = document.getElementById('pendingChart').getContext('2d');
const pendingChart = new Chart(ctxPending, {
  type: 'bar',
  data: {
    labels: ['Pending'],
    datasets: [{
      label: 'Count',
      data: [pendingCount],
      backgroundColor: 'rgba(255, 193, 7, 0.7)',
      borderColor: 'rgba(255, 193, 7, 1)',
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

const ctxDelivered = document.getElementById('deliveredChart').getContext('2d');
const deliveredChart = new Chart(ctxDelivered, {
  type: 'bar',
  data: {
    labels: ['Delivered'],
    datasets: [{
      label: 'Count',
      data: [deliveredCount],
      backgroundColor: 'rgba(76, 175, 80, 0.7)',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  }
});
const chartOptions = {
  responsive: false,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};
const options = {
  responsive: true,
  maintainAspectRatio: true, // keeps the chart proportional
  aspectRatio: 1.5, // optional, tweak for height/width ratio
  // ...other options
};
