module.exports = {
    convType: function (payload, targetType) {
        if (typeof payload !== targetType) {
            if (targetType == 'string') {
                payload = JSON.stringify(payload);
            } else {
                payload = JSON.parse(payload);
            }
        }
        return payload;
    }
}