// ====  FUNCTION TO SET AND OPTIONALLY CLEAR A NODE'S STATUS  =================
// ----  Node Status Options:
// ----  FILL - red, green, yellow, blue or grey
// ----  SHAPE - ring or dot.
// ----  LINGER - Time in ms for message to be displayed. 0 = permanent
exports.statusUpdate = function (node, fill, shape, text, linger = 0) {
    node.status({ fill: fill, shape: shape, text: text });
    if (linger > 0) { // if 'linger' is > 0, then clear the status message after
        // the period defined (in ms) by the 'linger' value
        setTimeout(function () { node.status({}); }, linger);
    }
};


// ====  FUNCTION TO TOGGLE THE DISPLAY OF AN ARRAY OF ELEMENTS  ===============
// ====  NOT CURRENTLY USED/WORKING
exports.toggleVisibility = function (document, elementArray) {
    let element;
    for (element of elementArray) {
        let x = document.getElementById(element[0]);
        if (element[1]) {
            x.style.display = "block";
        } else {
            x.style.display = "none";
        }
    }
};
