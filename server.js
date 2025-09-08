const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Função para ler dados do db.json
function readData() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler db.json:', error);
    return {};
  }
}

// Função para escrever dados no db.json
function writeData(data) {
  try {
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao escrever db.json:', error);
    return false;
  }
}

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Hotel API funcionando!',
    endpoints: [
      'GET /service_tickets',
      'GET /guest_interactions', 
      'GET /crm_guests',
      'GET /alerts',
      'GET /dashboard_metrics'
    ]
  });
});

// GET endpoints para cada collection
app.get('/service_tickets', (req, res) => {
  const data = readData();
  res.json(data.service_tickets || []);
});

app.get('/service_tickets/:id', (req, res) => {
  const data = readData();
  const ticket = data.service_tickets?.find(t => t.id == req.params.id);
  if (ticket) {
    res.json(ticket);
  } else {
    res.status(404).json({ error: 'Ticket não encontrado' });
  }
});

app.get('/guest_interactions', (req, res) => {
  const data = readData();
  res.json(data.guest_interactions || []);
});

app.get('/guest_interactions/:id', (req, res) => {
  const data = readData();
  const interaction = data.guest_interactions?.find(i => i.id == req.params.id);
  if (interaction) {
    res.json(interaction);
  } else {
    res.status(404).json({ error: 'Interação não encontrada' });
  }
});

app.get('/crm_guests', (req, res) => {
  const data = readData();
  res.json(data.crm_guests || []);
});

app.get('/crm_guests/:id', (req, res) => {
  const data = readData();
  const guest = data.crm_guests?.find(g => g.id == req.params.id);
  if (guest) {
    res.json(guest);
  } else {
    res.status(404).json({ error: 'Hóspede não encontrado' });
  }
});

app.get('/alerts', (req, res) => {
  const data = readData();
  res.json(data.alerts || []);
});

app.get('/alerts/:id', (req, res) => {
  const data = readData();
  const alert = data.alerts?.find(a => a.id == req.params.id);
  if (alert) {
    res.json(alert);
  } else {
    res.status(404).json({ error: 'Alerta não encontrado' });
  }
});

app.get('/dashboard_metrics', (req, res) => {
  const data = readData();
  res.json(data.dashboard_metrics || []);
});

app.get('/dashboard_metrics/:id', (req, res) => {
  const data = readData();
  const metric = data.dashboard_metrics?.find(m => m.id == req.params.id);
  if (metric) {
    res.json(metric);
  } else {
    res.status(404).json({ error: 'Métrica não encontrada' });
  }
});

// POST endpoints
app.post('/service_tickets', (req, res) => {
  const data = readData();
  if (!data.service_tickets) data.service_tickets = [];
  
  const newTicket = {
    id: Math.max(0, ...data.service_tickets.map(t => t.id)) + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  
  data.service_tickets.push(newTicket);
  
  if (writeData(data)) {
    res.status(201).json(newTicket);
  } else {
    res.status(500).json({ error: 'Erro ao salvar ticket' });
  }
});

app.post('/guest_interactions', (req, res) => {
  const data = readData();
  if (!data.guest_interactions) data.guest_interactions = [];
  
  const newInteraction = {
    id: Math.max(0, ...data.guest_interactions.map(i => i.id)) + 1,
    ...req.body,
    timestamp: new Date().toISOString()
  };
  
  data.guest_interactions.push(newInteraction);
  
  if (writeData(data)) {
    res.status(201).json(newInteraction);
  } else {
    res.status(500).json({ error: 'Erro ao salvar interação' });
  }
});

// PUT endpoints
app.put('/service_tickets/:id', (req, res) => {
  const data = readData();
  const index = data.service_tickets?.findIndex(t => t.id == req.params.id);
  
  if (index !== -1) {
    data.service_tickets[index] = { ...data.service_tickets[index], ...req.body };
    if (writeData(data)) {
      res.json(data.service_tickets[index]);
    } else {
      res.status(500).json({ error: 'Erro ao atualizar ticket' });
    }
  } else {
    res.status(404).json({ error: 'Ticket não encontrado' });
  }
});

// DELETE endpoints
app.delete('/service_tickets/:id', (req, res) => {
  const data = readData();
  const index = data.service_tickets?.findIndex(t => t.id == req.params.id);
  
  if (index !== -1) {
    const deleted = data.service_tickets.splice(index, 1)[0];
    if (writeData(data)) {
      res.json(deleted);
    } else {
      res.status(500).json({ error: 'Erro ao deletar ticket' });
    }
  } else {
    res.status(404).json({ error: 'Ticket não encontrado' });
  }
});


// Endpoint para criar alerta de escalação humana
app.post('/api/alerts/human-needed', (req, res) => {
  const data = readData();
  if (!data.alerts) data.alerts = [];
  
  const newAlert = {
    id: Math.max(0, ...data.alerts.map(a => a.id)) + 1,
    guest_phone: req.body.guest_phone,
    message: req.body.message,
    priority: req.body.priority || 'high',
    status: 'pending',
    timestamp: req.body.timestamp || new Date().toISOString(),
    assigned_to: req.body.assigned_to || 'gerencia',
    escalation_reason: req.body.escalation_reason || 'Requer atenção humana'
  };
  
  data.alerts.push(newAlert);
  
  if (writeData(data)) {
    res.status(201).json(newAlert);
  } else {
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// Endpoint para funcionário assumir um alerta
app.put('/alerts/:id/assign', (req, res) => {
  const data = readData();
  const alertIndex = data.alerts?.findIndex(a => a.id == req.params.id);
  
  if (alertIndex !== -1) {
    data.alerts[alertIndex].status = 'assigned';
    data.alerts[alertIndex].assigned_to = req.body.assigned_to;
    data.alerts[alertIndex].assigned_at = new Date().toISOString();
    
    if (writeData(data)) {
      res.json(data.alerts[alertIndex]);
    } else {
      res.status(500).json({ error: 'Erro ao atualizar alerta' });
    }
  } else {
    res.status(404).json({ error: 'Alerta não encontrado' });
  }
});

// Endpoint para resolver um alerta
app.put('/alerts/:id/resolve', (req, res) => {
  const data = readData();
  const alertIndex = data.alerts?.findIndex(a => a.id == req.params.id);
  
  if (alertIndex !== -1) {
    data.alerts[alertIndex].status = 'resolved';
    data.alerts[alertIndex].resolution_notes = req.body.resolution_notes;
    data.alerts[alertIndex].resolved_at = new Date().toISOString();
    data.alerts[alertIndex].resolved_by = req.body.resolved_by;
    
    if (writeData(data)) {
      res.json(data.alerts[alertIndex]);
    } else {
      res.status(500).json({ error: 'Erro ao resolver alerta' });
    }
  } else {
    res.status(404).json({ error: 'Alerta não encontrado' });
  }
});

// Endpoint para listar apenas alertas pendentes
app.get('/alerts/pending', (req, res) => {
  const data = readData();
  const pendingAlerts = data.alerts?.filter(a => a.status === 'pending') || [];
  res.json(pendingAlerts);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hotel API rodando na porta ${PORT}`);
  console.log(`📋 Endpoints disponíveis em http://localhost:${PORT}`);
});

module.exports = app;