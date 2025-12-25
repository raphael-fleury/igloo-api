import { Elysia } from "elysia";
import { AlreadyExistsError, NotFoundError, SelfInteractionError, BlockedError, UnauthorizedError, ConflictError } from "@/app/errors";

export const onErrorMiddleware = (app: Elysia) => app
    .error({
        AlreadyExistsError,
        NotFoundError,
        SelfInteractionError,
        BlockedError,
        UnauthorizedError,
        ConflictError
    })
    .onError(({ code, error, set }) => {
        switch (code) {
            case 'AlreadyExistsError':
                set.status = 409;
                break;
            case 'SelfInteractionError':
                set.status = 400;
                break;
            case 'BlockedError':
            case 'UnauthorizedError':
                set.status = 403;
                break;
            case 'NOT_FOUND':
            case 'NotFoundError':
                set.status = 404;
                break;
            case 'ConflictError':
                set.status = 409;
                break;
            case 'PARSE':
            case 'VALIDATION':
                set.status = 422;
                set.headers["content-type"] = "application/json";
                return error.message;
            case 'INVALID_COOKIE_SIGNATURE':
            case 'INVALID_FILE_TYPE':
                set.status = 400;
                break;
            case 'UNKNOWN':
            case 'INTERNAL_SERVER_ERROR':
                set.status = 500;
                break;
            default:
                set.status = 500;
                console.error(error);
                return { message: 'Internal Server Error' }
        }

        const { message } = error;
        return { message };
    });