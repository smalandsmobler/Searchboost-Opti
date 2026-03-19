// ============================================================
// Searchboost Worker API
// Express-server som hanterar jobbkö + triggar n8n-workflows
// Port: 4000
// ============================================================

const express = require('express');
const helmet = require('helmet');
const axios = require('axios');
const os = require('os');
const { execSync } = require('child_process');
const jobQueue = require('./job-queue');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.WORKER_PORT || 4000;
const WORKER_API_KEY = process.env.WORKER_API_KEY;
const N8N_URL = process.env.N8N_URL || 'http://127.0.0.1:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// ============================================================
// Auth middleware
// ============================================================
function requireAuth(req, res, next) {
  // Healthcheck tillåts utan auth
  if (req.path === '/worker/health') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Saknar Authorization header' });
  }
  const token = authHeader.slice(7);
  if (!WORKER_API_KEY || token !== WORKER_API_KEY) {
    return res.status(403).json({ error: 'Ogiltig API-nyckel' });
  }
  next();
}

app.use('/worker', (req, res, next) => {
  if (req.path === '/health') return next();
  requireAuth(req, res, next);
});

// ============================================================
// Jobbtyper → n8n webhook-mappning
// ============================================================
const JOB_TYPES = {
  'weekly-audit': {
    name: 'Vecko-audit',
    webhook: '/webhook/weekly-audit',
    description: 'Crawlar alla kunders WP-siter, hittar SEO-problem'
  },
  'autonomous-optimizer': {
    name: 'Autonom optimerare',
    webhook: '/webhook/autonomous-optimizer',
    description: 'Tar uppgifter från kön, genererar metadata via AI'
  },
  'weekly-report': {
    name: 'Veckorapport',
    webhook: '/webhook/weekly-report',
    description: 'Sammanställer veckans arbete, skickar e-post'
  },
  'data-collector': {
    name: 'Datainsamling',
    webhook: '/webhook/data-collector',
    description: 'Samlar GSC + Ads + Social Media-data'
  },
  'performance-monitor': {
    name: 'Prestandaövervakning',
    webhook: '/webhook/performance-monitor',
    description: 'Kollar PageSpeed + uptime för alla kunder'
  },
  'prospect-analyzer': {
    name: 'Prospektanalys',
    webhook: '/webhook/prospect-analyzer',
    description: 'Djupanalys av ny prospect'
  },
  'backlink-monitor': {
    name: 'Backlinkbevakning',
    webhook: '/webhook/backlink-monitor',
    description: 'Övervakar bakåtlänkar och konkurrenter'
  },
  'keyword-researcher': {
    name: 'Nyckelordsanalys',
    webhook: '/webhook/keyword-researcher',
    description: 'Analyserar söktrender, föreslår nyckelord'
  },
  'content-publisher': {
    name: 'Innehållspublicering',
    webhook: '/webhook/content-publisher',
    description: 'Publicerar genererat blogginnehåll'
  },
  'full-site-audit': {
    name: 'Komplett SEO-audit',
    webhook: '/webhook/full-site-audit',
    description: 'Crawl + PageSpeed + AI-analys av en sajt'
  }
};

// ============================================================
// ENDPOINTS
// ============================================================

// Hälsokontroll — öppen utan auth
app.get('/worker/health', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // CPU-belastning (1 min medel)
  const load = os.loadavg();

  // Disk
  let disk = { total_gb: 0, used_gb: 0, free_gb: 0 };
  try {
    const dfOutput = execSync("df -BG / | tail -1 | awk '{print $2,$3,$4}'").toString().trim();
    const [total, used, free] = dfOutput.split(' ').map(s => parseInt(s));
    disk = { total_gb: total, used_gb: used, free_gb: free };
  } catch (e) { /* ok */ }

  // n8n status
  let n8nRunning = false;
  try {
    execSync('pm2 jlist', { encoding: 'utf8' });
    const pm2List = JSON.parse(execSync('pm2 jlist', { encoding: 'utf8' }));
    const n8nProc = pm2List.find(p => p.name === 'n8n');
    n8nRunning = n8nProc && n8nProc.pm2_env.status === 'online';
  } catch (e) { /* ok */ }

  const stats = jobQueue.stats();

  res.json({
    status: 'ok',
    server: 'searchboost-worker',
    arch: os.arch(),
    uptime_seconds: Math.floor(os.uptime()),
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || 'unknown',
      load_1m: load[0],
      load_5m: load[1],
      load_15m: load[2]
    },
    memory: {
      total_gb: +(totalMem / 1073741824).toFixed(1),
      used_gb: +(usedMem / 1073741824).toFixed(1),
      free_gb: +(freeMem / 1073741824).toFixed(1),
      usage_pct: +((usedMem / totalMem) * 100).toFixed(1)
    },
    disk,
    n8n: { running: n8nRunning },
    jobs: stats,
    timestamp: new Date().toISOString()
  });
});

// Lista tillgängliga jobbtyper
app.get('/worker/job-types', (req, res) => {
  res.json(JOB_TYPES);
});

// Trigga ett jobb
app.post('/worker/jobs/trigger', async (req, res) => {
  const { type, params = {} } = req.body;

  if (!type || !JOB_TYPES[type]) {
    return res.status(400).json({
      error: `Okänd jobbtyp: ${type}`,
      available: Object.keys(JOB_TYPES)
    });
  }

  // Kolla om samma typ redan körs
  const running = jobQueue.list({ status: 'running' });
  const duplicate = running.find(j => j.type === type);
  if (duplicate) {
    return res.status(409).json({
      error: `${JOB_TYPES[type].name} körs redan`,
      job_id: duplicate.id,
      started_at: duplicate.started_at
    });
  }

  // Skapa jobb
  const job = jobQueue.create(type, params);

  // Trigga n8n webhook asynkront
  triggerN8nWorkflow(job);

  res.status(202).json({
    message: `${JOB_TYPES[type].name} köat`,
    job_id: job.id,
    status: job.status
  });
});

// Hämta jobbstatus
app.get('/worker/jobs/:id/status', (req, res) => {
  const job = jobQueue.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Jobb hittades inte' });
  }
  res.json(job);
});

// Lista jobb
app.get('/worker/jobs', (req, res) => {
  const { status, limit } = req.query;
  const jobs = jobQueue.list({
    status,
    limit: limit ? parseInt(limit) : 50
  });
  res.json({
    jobs,
    stats: jobQueue.stats()
  });
});

// Avbryt jobb
app.post('/worker/jobs/:id/cancel', (req, res) => {
  const job = jobQueue.cancel(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Jobb hittades inte' });
  }
  res.json({ message: 'Jobb avbrutet', job });
});

// Uppdatera jobbstatus (anropas av n8n-workflows)
app.post('/worker/jobs/:id/update', (req, res) => {
  const { status, progress, result, error } = req.body;
  const id = req.params.id;
  let job;

  switch (status) {
    case 'running':
      job = jobQueue.start(id);
      break;
    case 'progress':
      job = jobQueue.progress(id, progress, result);
      break;
    case 'completed':
      job = jobQueue.complete(id, result);
      break;
    case 'error':
      job = jobQueue.fail(id, error || 'Okänt fel');
      break;
    default:
      return res.status(400).json({ error: `Okänd status: ${status}` });
  }

  if (!job) {
    return res.status(404).json({ error: 'Jobb hittades inte' });
  }
  res.json(job);
});

// ============================================================
// n8n webhook-trigger
// ============================================================
async function triggerN8nWorkflow(job) {
  const jobType = JOB_TYPES[job.type];
  const webhookUrl = `${N8N_URL}${jobType.webhook}`;

  jobQueue.start(job.id);

  try {
    const response = await axios.post(webhookUrl, {
      job_id: job.id,
      type: job.type,
      params: job.params,
      callback_url: `http://127.0.0.1:${PORT}/worker/jobs/${job.id}/update`
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {})
      },
      timeout: 10000
    });

    // Om n8n svarar direkt med resultat (synkront workflow)
    if (response.data && response.data.status === 'completed') {
      jobQueue.complete(job.id, response.data.result);
    }
  } catch (err) {
    const errMsg = err.response
      ? `n8n svarade ${err.response.status}: ${JSON.stringify(err.response.data)}`
      : `Kunde inte nå n8n: ${err.message}`;
    console.error(`[JOB ${job.id}] Trigger misslyckades:`, errMsg);
    jobQueue.fail(job.id, errMsg);
  }
}

// ============================================================
// Starta server
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Worker API] Lyssnar på port ${PORT}`);
  console.log(`[Worker API] n8n URL: ${N8N_URL}`);
  console.log(`[Worker API] Auth: ${WORKER_API_KEY ? 'aktiverad' : 'VARNING — ingen API-nyckel!'}`);
  console.log(`[Worker API] Jobbtyper: ${Object.keys(JOB_TYPES).join(', ')}`);
});
