function BusError (app, method, inner_error) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = "BusError";

    this.app = app;
    this.method = method;
    this.inner_error = inner_error;

    this.message = [
        'app:',
        this.app,
        'method:',
        this.method,
        'error_name:',
        this.inner_error.name,
        'error_message:',
        this.inner_error.message,
        'error_code:',
        this.inner_error.code
    ].join(" ");
}

BusError.prototype = Object.create(Error.prototype);
BusError.prototype.constructor = BusError;

module.exports = BusError;