const express = require('express');
const path = require('path');
const client = require('prom-client');

const app = express();
const PORT = 3000;

// Enable default Node.js metrics
client.collectDefaultMetrics();

// Create HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'task_manager_http_requests_total',
  help: 'Total HTTP requests received'
});

// Middleware to count HTTP requests
app.use((req, res, next) => {
  httpRequestCounter.inc();
  next();
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory task storage
let tasks = [];
let nextId = 1;

// GET all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// POST add a new task
app.post('/tasks', (req, res) => {
  const { task } = req.body;

  if (!task || task.trim() === '') {
    return res.status(400).json({
      error: 'Task cannot be empty'
    });
  }

  const newTask = {
    id: nextId++,
    text: task.trim()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// DELETE a task by id
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  tasks.splice(index, 1);
  res.json({ message: 'Task deleted' });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Student Task Manager running at http://localhost:${PORT}`
    );
  });
}

module.exports = app;
