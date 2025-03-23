#!/usr/bin/env node

const { program } = require("commander");
const { initProject } = require("./commands/init");
const { compileContracts } = require("./commands/compile");
const { deployContract } = require("./commands/deploy");

program
  .command("init")
  .description("Initialize a new smart contract project")
  .action(initProject);

program
  .command("compile")
  .description("Compile the smart contract")
  .action(compileContracts);

program
  .command("deploy")
  .description("Deploy the smart contract")
  .action(deployContract);

program.parse(process.argv);
