// ============================================================
// Searchboost Worker — Jobbkö
// In-memory kö med BigQuery-persistering
// ============================================================

const { v4: uuidv4 } = require('uuid');

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.maxInMemory = 200;
  }

  create(type, params = {}) {
    const job = {
      id: uuidv4(),
      type,
      status: 'queued',
      params,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      progress: 0,
      result: null,
      error: null
    };
    this.jobs.set(job.id, job);
    this._prune();
    return job;
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  start(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'running';
      job.started_at = new Date().toISOString();
    }
    return job;
  }

  progress(id, pct, message) {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = pct;
      if (message) job.progress_message = message;
    }
    return job;
  }

  complete(id, result) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      job.progress = 100;
      job.result = result;
    }
    return job;
  }

  fail(id, error) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'error';
      job.completed_at = new Date().toISOString();
      job.error = typeof error === 'string' ? error : error.message;
    }
    return job;
  }

  cancel(id) {
    const job = this.jobs.get(id);
    if (job && (job.status === 'queued' || job.status === 'running')) {
      job.status = 'cancelled';
      job.completed_at = new Date().toISOString();
    }
    return job;
  }

  list({ status, limit = 50 } = {}) {
    let jobs = Array.from(this.jobs.values());
    if (status) jobs = jobs.filter(j => j.status === status);
    return jobs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  stats() {
    const jobs = Array.from(this.jobs.values());
    const today = new Date().toISOString().slice(0, 10);
    const todayJobs = jobs.filter(j => j.created_at.startsWith(today));
    return {
      total: jobs.length,
      running: jobs.filter(j => j.status === 'running').length,
      queued: jobs.filter(j => j.status === 'queued').length,
      completed_today: todayJobs.filter(j => j.status === 'completed').length,
      errors_today: todayJobs.filter(j => j.status === 'error').length
    };
  }

  _prune() {
    if (this.jobs.size > this.maxInMemory) {
      const sorted = Array.from(this.jobs.entries())
        .sort((a, b) => new Date(a[1].created_at) - new Date(b[1].created_at));
      const toRemove = sorted.slice(0, this.jobs.size - this.maxInMemory);
      for (const [id] of toRemove) {
        this.jobs.delete(id);
      }
    }
  }
}

module.exports = new JobQueue();
