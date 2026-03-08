/**
 * Variables module
 * Variable resolution system
 */

export {
  VariableResolver,
  variableResolver
} from './resolver';

export {
  generateGuid,
  generateTimestamp,
  generateRandomInt,
  generateDatetime,
  getSystemVariables,
  resolveSystemVariable,
  isSystemVariable,
  type SystemVariables
} from './system-vars';

export {
  extractFileVariables,
  parseFileVariables,
  type FileVariable
} from './file-vars';

export {
  EnvironmentManager,
  environmentManager,
  type Environment,
  type EnvironmentFile
} from './environment';
