import { CommandName, Handlers } from "./command-handlers";

export interface CommandHandler<TInput = any, TResult = any> {
    handle(input: TInput): Promise<TResult>;
}

export type CommandInput<T extends CommandName> =
  Parameters<Handlers[T]["handle"]>[0];

export type CommandResult<T extends CommandName> =
  Awaited<ReturnType<Handlers[T]["handle"]>>;