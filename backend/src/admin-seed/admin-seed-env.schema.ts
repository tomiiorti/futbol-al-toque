import { z } from 'zod';

export const adminSeedEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL debe ser un email válido'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD debe tener al menos 8 caracteres'),
});

export type AdminSeedEnv = z.infer<typeof adminSeedEnvSchema>;

export function validateAdminSeedEnv(
  config: Record<string, unknown>,
): AdminSeedEnv {
  const parsed = adminSeedEnvSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      'Variables de entorno inválidas para el seed de administrador:\n' +
        JSON.stringify(parsed.error.format(), null, 2),
    );
  }
  return parsed.data;
}
