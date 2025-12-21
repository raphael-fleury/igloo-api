export class AlreadyExistsError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'AlreadyExistsError';
    }
}

export class NotFoundError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class SelfInteractionError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'SelfInteractionError';
    }
}

export class BlockedError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'BlockedError';
    }
}