import { db, auditLog } from "@/server/db";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
}

/**
 * Registra una acción de auditoría en la tabla audit_log para trazabilidad estricta.
 */
export async function logAudit({
  userId = null,
  action,
  entity,
  entityId,
}: LogAuditParams): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId,
      action,
      entity,
      entityId,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("[audit_log] Error insertando registro de auditoría:", err);
  }
}
