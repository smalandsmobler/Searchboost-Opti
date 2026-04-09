// bq-table-guard — daglig kontroll att kritiska BigQuery-tabeller finns.
// Larmar via SNS om någon saknas. Skapat efter incident 2026-04-08 då
// seo_work_queue/seo_optimization_log/weekly_reports försvann utan spår.

const { BigQuery } = require('@google-cloud/bigquery');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const PROJECT_ID = 'searchboost-485810';
const DATASET = 'seo_data';
const TOPIC_ARN = process.env.SNS_TOPIC_ARN
  || 'arn:aws:sns:eu-north-1:176823989073:seo-optimizer-alerts';

const CRITICAL_TABLES = [
  'seo_work_queue',
  'seo_optimization_log',
  'weekly_reports',
  'customer_pipeline',
  'customer_keywords',
  'action_plans',
  'gsc_daily_metrics',
  'customer_tasks',
];

async function getBqCredentials() {
  const { Parameter } = await ssm.send(new GetParameterCommand({
    Name: '/seo-mcp/bigquery/credentials',
    WithDecryption: true,
  }));
  return JSON.parse(Parameter.Value);
}

async function alert(subject, message) {
  await sns.send(new PublishCommand({
    TopicArn: TOPIC_ARN,
    Subject: subject.slice(0, 100),
    Message: message,
  }));
}

// Snapshot-suffix: daily date
function snapshotSuffix() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function snapshotTable(bq, table) {
  const suffix = snapshotSuffix();
  const snapName = `_backup_${table}_${suffix}`;
  // 30 dagars retention via expiration_timestamp (BQ auto-raderar)
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  // Använder CLONE (table clone) istället för SNAPSHOT TABLE —
  // CLONE använder noll extra storage tills källan ändras, kräver bara
  // tables.create (ingen specialrätt för snapshots).
  const sql = `
    CREATE TABLE \`${PROJECT_ID}.${DATASET}.${snapName}\`
    CLONE \`${PROJECT_ID}.${DATASET}.${table}\`
    OPTIONS(expiration_timestamp = TIMESTAMP "${expiration}")
  `;
  try {
    const [job] = await bq.createQueryJob({ query: sql, location: 'EU' });
    await job.getQueryResults();
    return { table, snapshot: snapName, status: 'ok' };
  } catch (err) {
    if (/Already Exists|already exists/.test(err.message)) {
      return { table, snapshot: snapName, status: 'ok', note: 'already exists' };
    }
    return { table, snapshot: snapName, status: 'error', error: err.message };
  }
}

exports.handler = async () => {
  const credentials = await getBqCredentials();
  const bq = new BigQuery({ projectId: PROJECT_ID, credentials });
  const dataset = bq.dataset(DATASET);

  const [tables] = await dataset.getTables();
  const existing = new Set(tables.map((t) => t.id));
  const missing = CRITICAL_TABLES.filter((t) => !existing.has(t));

  // Skapa dagliga snapshots av de tabeller som finns
  const presentCritical = CRITICAL_TABLES.filter((t) => existing.has(t));
  const snapshotResults = await Promise.all(
    presentCritical.map((t) => snapshotTable(bq, t))
  );
  const snapshotFailures = snapshotResults.filter((r) => r.status === 'error');

  const result = {
    checked_at: new Date().toISOString(),
    existing_count: existing.size,
    missing,
    snapshots_created: snapshotResults.filter((r) => r.status === 'ok').length,
    snapshot_failures: snapshotFailures,
  };

  if (missing.length > 0) {
    const msg = [
      'KRITISKT: BigQuery-tabeller saknas i searchboost-485810.seo_data',
      '',
      `Saknade: ${missing.join(', ')}`,
      `Totalt existerande: ${existing.size}`,
      `Tid: ${result.checked_at}`,
      '',
      'Återskapa omedelbart enligt schema i lambda-functions/*.js',
    ].join('\n');
    await alert(`[BQ-GUARD] ${missing.length} tabeller saknas`, msg);
    console.error('MISSING TABLES', result);
    return { statusCode: 500, ...result };
  }

  if (snapshotFailures.length > 0) {
    const msg = [
      'Snapshot-fel i bq-table-guard',
      '',
      ...snapshotFailures.map((f) => `${f.table}: ${f.error}`),
    ].join('\n');
    await alert(`[BQ-GUARD] ${snapshotFailures.length} snapshots misslyckades`, msg);
  }

  console.log('OK — alla kritiska tabeller finns', result);
  return { statusCode: 200, ...result };
};
