import { CommandInput, CommandResult } from ".";
import { Handlers, CommandName, getCommandHandlers } from "./command-handlers";

export class CommandBus {
    constructor(private readonly handlers: Handlers) { }

    static get default() {
        return new CommandBus(getCommandHandlers());
    }

    async execute<T extends CommandName>(
        command: T,
        input: CommandInput<T>
    ): Promise<CommandResult<T>> {
        const handler = this.handlers[command];
        return handler.handle(input);
    }
}