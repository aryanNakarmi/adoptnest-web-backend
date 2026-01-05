export class HttpError extends Error{
    statusCode: number;
    constructor(statusCode : number,
        message : string
    ){
        super(message);
        this.statusCode = statusCode;
    }
}

//custom error to handle HTTP errors with status code