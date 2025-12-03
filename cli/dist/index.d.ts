#!/usr/bin/env node
interface CliArgs {
    sprint?: string;
    sprintId?: string;
    dryRun?: boolean;
    help?: boolean;
}
declare function parseArgs(args: string[]): CliArgs;
declare function printHelp(): void;
declare function main(): Promise<void>;
//# sourceMappingURL=index.d.ts.map