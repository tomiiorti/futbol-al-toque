import { validateAdminSeedEnv } from './admin-seed-env.schema';

describe('validateAdminSeedEnv', () => {
  const validConfig = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'validpassword123',
  };

  it('devuelve ADMIN_EMAIL y ADMIN_PASSWORD cuando ambos son válidos', () => {
    expect(validateAdminSeedEnv(validConfig)).toEqual(validConfig);
  });

  it('lanza un error si falta ADMIN_EMAIL', () => {
    expect(() =>
      validateAdminSeedEnv({ ADMIN_PASSWORD: validConfig.ADMIN_PASSWORD }),
    ).toThrow();
  });

  it('lanza un error si falta ADMIN_PASSWORD', () => {
    expect(() =>
      validateAdminSeedEnv({ ADMIN_EMAIL: validConfig.ADMIN_EMAIL }),
    ).toThrow();
  });

  it('lanza un error si ADMIN_EMAIL tiene formato inválido', () => {
    expect(() =>
      validateAdminSeedEnv({ ...validConfig, ADMIN_EMAIL: 'no-es-un-email' }),
    ).toThrow();
  });

  it('lanza un error si ADMIN_PASSWORD tiene menos de 8 caracteres', () => {
    expect(() =>
      validateAdminSeedEnv({ ...validConfig, ADMIN_PASSWORD: '123' }),
    ).toThrow();
  });

  it('no aplica ningún valor por defecto cuando las variables no están definidas', () => {
    expect(() => validateAdminSeedEnv({})).toThrow();
  });
});
