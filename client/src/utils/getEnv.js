export const getEnv = (envname) => {
  return import.meta.env[envname];
};

export const getEnvOrThrow = (envname) => {
  const env = getEnv(envname);
  if (!env) {
    throw new Error(`Environment variable ${envname} is not defined.`);
  }
  return env;
};
