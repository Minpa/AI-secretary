// Module alias setup for production
require('module-alias/register');
require('module-alias').addAliases({
  '@': __dirname + '/dist',
  '@/modules': __dirname + '/dist/modules',
  '@/shared': __dirname + '/dist/shared',
  '@/config': __dirname + '/dist/config'
});

// Start the application
require('./dist/app.js');