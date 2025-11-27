#!/usr/bin/env node
require('dotenv').config();
const { Command } = require('commander');
const program = new Command();

program
  .name('stocks')
  .description('Stock portfolio CLI')
  .version('1.0.0');

require('./src/commands/auth')(program);
require('./src/commands/portfolios')(program);
require('./src/commands/stocks')(program);
require('./src/commands/stocklists')(program);
require('./src/commands/friends')(program);
require('./src/commands/reviews')(program);

program.parse(process.argv);