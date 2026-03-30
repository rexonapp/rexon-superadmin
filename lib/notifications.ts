import query from '@/lib/db';

export async function createSuperadminNotification({
  type,
  title,
  message,
  referenceId,
  referenceTable,
  superadminId,
}: {
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceTable?: string;
  superadminId: string;
}) {
  await query.query(`
    INSERT INTO superadmin_notifications 
      (type, title, message, reference_id, reference_table, superadmin_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [type, title, message, referenceId ?? null, referenceTable ?? null, superadminId]);
}

export async function createAgentNotification({
  agentId,
  type,
  title,
  message,
  referenceId,
  referenceTable,
}: {
  agentId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceTable?: string;
}) {
  await query.query(`
    INSERT INTO agent_notifications
      (agent_id, type, title, message, reference_id, reference_table)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [agentId, type, title, message, referenceId ?? null, referenceTable ?? null]);
}