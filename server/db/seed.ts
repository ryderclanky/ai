import { getDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase(): void {
  const db = getDb();

  // Only seed if DB is empty
  const taskCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  if (taskCount > 0) return;

  console.log('Seeding database with initial data...');

  // Seed tasks
  const tasks = [
    { id: uuidv4(), title: 'Find restaurant leads', status: 'done', note: 'Done · 12 found' },
    { id: uuidv4(), title: 'Draft outreach emails', status: 'in_progress', note: 'In progress · 8 of 12' },
    { id: uuidv4(), title: 'Send outreach emails', status: 'waiting', note: 'Awaiting approval' },
    { id: uuidv4(), title: 'Follow-up sequence', status: 'todo', note: 'Not started' },
    { id: uuidv4(), title: 'Update CRM records', status: 'todo', note: 'Not started' },
  ];

  const insertTask = db.prepare(
    'INSERT INTO tasks (id, title, status, note) VALUES (?, ?, ?, ?)'
  );
  for (const task of tasks) {
    insertTask.run(task.id, task.title, task.status, task.note);
  }

  // Seed leads
  const leads = [
    { id: uuidv4(), name: 'Rosario Trattoria', business_type: 'Italian', location: 'Downtown', seats: 80, status: 'draft_ready', score: 85, note: 'Their events page mentions corporate dinners but no catering partner listed.' },
    { id: uuidv4(), name: 'The Garden Bistro', business_type: 'American', location: 'Midtown', seats: 120, status: 'draft_ready', score: 90, note: 'Hosts quarterly business brunches — no catering provider mentioned.' },
    { id: uuidv4(), name: 'Miso Modern', business_type: 'Japanese', location: 'Westside', seats: 65, status: 'in_review', score: 72, note: 'New private dining room on their website — likely expanding event capacity.' },
    { id: uuidv4(), name: 'Ember & Ash', business_type: 'Steakhouse', location: 'Financial District', seats: 95, status: 'draft_ready', score: 88, note: 'Features a "corporate packages" link with no pricing — strong signal.' },
    { id: uuidv4(), name: 'Blue Harbor Kitchen', business_type: 'Seafood', location: 'Waterfront', seats: 110, status: 'new', score: 76, note: 'Recently renovated event space visible on Google Maps.' },
    { id: uuidv4(), name: 'Verde Fusion', business_type: 'Fusion', location: 'Arts District', seats: 70, status: 'new', score: 68, note: 'Active Instagram with corporate event photos.' },
  ];

  const insertLead = db.prepare(
    'INSERT INTO leads (id, name, business_type, location, seats, status, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const lead of leads) {
    insertLead.run(lead.id, lead.name, lead.business_type, lead.location, lead.seats, lead.status, lead.score, lead.note);
  }

  // Seed memories
  const memories = [
    { id: uuidv4(), content: "You prefer outreach emails under 90 words with a personal observation from the recipient's site.", category: 'preference', tags: JSON.stringify(['email', 'outreach']) },
    { id: uuidv4(), content: 'Current quarterly goal: 20% growth in catering clients. 34% complete as of today.', category: 'business_goal', tags: JSON.stringify(['goal', 'quarterly']) },
    { id: uuidv4(), content: 'Restaurants with "corporate packages" or "private dining" links on their site are strong leads.', category: 'lead_scoring', tags: JSON.stringify(['leads', 'scoring', 'rule']) },
    { id: uuidv4(), content: 'Best time to send cold outreach emails is Tuesday-Thursday between 9-11am.', category: 'strategy', tags: JSON.stringify(['email', 'timing']) },
  ];

  const insertMemory = db.prepare(
    'INSERT INTO memories (id, content, category, tags) VALUES (?, ?, ?, ?)'
  );
  for (const memory of memories) {
    insertMemory.run(memory.id, memory.content, memory.category, memory.tags);
  }

  // Seed approvals
  const approvals = [
    {
      id: uuidv4(),
      type: 'spend',
      title: 'Apollo.io Pro Plan',
      description: 'To find verified contact emails for 12 restaurant leads without manual lookup.',
      payload: JSON.stringify({ amount: 49, currency: 'USD', interval: 'monthly', vendor: 'Apollo.io', why_needed: 'Verified contact emails for leads', if_rejected: "Use Hunter.io free tier — expect 30% lower email accuracy", alternatives: 'Hunter.io (50/mo free) or manual search (~3 hrs)', expected_roi: 'One catering booking covers ~6 months of this cost' }),
      risk_level: 'low',
      status: 'pending'
    },
    {
      id: uuidv4(),
      type: 'email',
      title: 'Catering intro — Batch 1',
      description: '5 personalized emails, under 90 words each, sent from your business address.',
      payload: JSON.stringify({ recipient_count: 5, word_limit: 90, from_address: 'business@catering.com' }),
      risk_level: 'low',
      status: 'pending'
    },
    {
      id: uuidv4(),
      type: 'playbook',
      title: 'Email length rule update',
      description: 'Keep all outreach emails under 90 words and include one observation from the recipient\'s website.',
      payload: JSON.stringify({ rule: 'max_words', value: 90, additional: 'Include one website observation' }),
      risk_level: 'safe',
      status: 'pending'
    },
  ];

  const insertApproval = db.prepare(
    'INSERT INTO approvals (id, type, title, description, payload, risk_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const approval of approvals) {
    insertApproval.run(approval.id, approval.type, approval.title, approval.description, approval.payload, approval.risk_level, approval.status);
  }

  // Seed action logs
  const logs = [
    { id: uuidv4(), action: 'Searched Google Maps for restaurants', detail: 'Found 28 results', status: 'success', agent: 'ResearchAgent' },
    { id: uuidv4(), action: 'Scored and ranked leads', detail: 'Filtered 14 leads by seat count and event history', status: 'success', agent: 'ManagerAgent' },
    { id: uuidv4(), action: 'Drafted personalized emails', detail: 'Created 8 email drafts under 90 words', status: 'success', agent: 'BuilderAgent' },
    { id: uuidv4(), action: 'Flagged Apollo.io as needed tool', detail: 'Created spend approval request', status: 'warning', agent: 'ManagerAgent' },
  ];

  const insertLog = db.prepare(
    'INSERT INTO action_logs (id, action, detail, status, agent) VALUES (?, ?, ?, ?, ?)'
  );
  for (const log of logs) {
    insertLog.run(log.id, log.action, log.detail, log.status, log.agent);
  }

  // Seed reports
  const reports = [
    {
      id: uuidv4(),
      title: 'Daily Report · Today',
      content: 'Strong start on the restaurant outreach project. Lead quality is high — 12 of 14 matches had no existing catering partner. Recommend approving the first email batch today to stay on timeline.',
      metrics: JSON.stringify({ leads_found: 12, emails_drafted: 8, awaiting_approval: 3 }),
    },
  ];

  const insertReport = db.prepare(
    'INSERT INTO business_reports (id, title, content, metrics) VALUES (?, ?, ?, ?)'
  );
  for (const report of reports) {
    insertReport.run(report.id, report.title, report.content, report.metrics);
  }

  // Seed playbooks
  const playbooks = [
    { id: uuidv4(), name: 'Outreach Playbook', description: 'Find leads → draft personalized email → await approval → send → follow up in 5 days.', steps: JSON.stringify(['Find leads', 'Draft emails', 'Get approval', 'Send emails', 'Follow up in 5 days']), status: 'active' },
    { id: uuidv4(), name: 'Lead Scoring', description: 'Score leads by seat count, event history, and absence of a catering partner. Top 12 proceed.', steps: JSON.stringify(['Check seat count (min 50)', 'Check event history', 'Check for existing catering partner', 'Score and rank top 12']), status: 'active' },
    { id: uuidv4(), name: 'CRM Sync', description: 'Auto-log all lead interactions to CRM after each outreach action. Needs your approval.', steps: JSON.stringify(['Log lead contact', 'Update CRM status', 'Sync email history']), status: 'draft' },
  ];

  const insertPlaybook = db.prepare(
    'INSERT INTO playbooks (id, name, description, steps, status) VALUES (?, ?, ?, ?, ?)'
  );
  for (const pb of playbooks) {
    insertPlaybook.run(pb.id, pb.name, pb.description, pb.steps, pb.status);
  }

  // Seed experiments
  const insertExperiment = db.prepare(
    'INSERT INTO experiments (id, name, hypothesis, status) VALUES (?, ?, ?, ?)'
  );
  insertExperiment.run(uuidv4(), 'Subject line A/B test', 'Question subject lines will outperform statement subject lines on cold outreach.', 'running');

  console.log('Database seeded successfully.');
}
