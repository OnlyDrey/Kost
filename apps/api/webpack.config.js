module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      // Exclude native modules
      'bcrypt',
      '@mapbox/node-pre-gyp',

      // Exclude optional Terminus database dependencies we don't use
      '@mikro-orm/core',
      '@nestjs/mongoose',
      '@nestjs/sequelize',
      '@nestjs/typeorm',
      'mongoose',
      'sequelize',
      'typeorm',

      // Exclude other optional dependencies
      'mock-aws-s3',
      'aws-sdk',
      'nock',

      // Common native modules
      'pg-native',
      'sqlite3',
      'better-sqlite3',
      'mysql',
      'mysql2',
      'oracledb',
      'pg-query-stream',

      // Keep these as external (they'll be resolved from node_modules at runtime)
      ...(options.externals || []),
    ],
  };
};
