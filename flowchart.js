const xlmns = "http://www.w3.org/2000/svg";
const nodeWidth = 40;
const nodeHeight = 20;
const svgWidth = 300;
const svgHeight = 300;

const NodeType = {
    ACTION: 1,
    INPUT: 2,
    OUTPUT: 3,
    CONDITION: 4,
    END: 5
};

var $flowcharts = [];

/// Utilities
/**
 * Alias for `elem.setAttributeNS(null, attr, value)`
 */
function setAttr(elem, attr, value) {
    elem.setAttributeNS(null, attr, String(value));
}

/// Node class
function Node(type) {
    this.type = type || NodeType.END;
    this.text = "";
    this.captured = false;
    this.x = 0;
    this.y = 0;
    this.createDOMElement();
    // Drag config
    this.DOMElement.addEventListener('mousedown', this.dragStart.bind(this));
}

Node.prototype.createDOMElement = function () {
    switch (this.type) {
        case NodeType.ACTION:
            this.DOMElement = document.createElementNS(xlmns, "rect");
            setAttr(this.DOMElement, "width", nodeWidth);
            setAttr(this.DOMElement, "height", nodeHeight);
            break;
        case NodeType.CONDITION:
            this.DOMElement = document.createElementNS(xlmns, "polygon");
            break;
        case NodeType.INPUT:
        case NodeType.OUTPUT:
            this.DOMElement = document.createElementNS(xlmns, "polygon");
            break;
        case NodeType.END:
        default:
            this.DOMElement = document.createElementNS(xlmns, "circle");
            setAttr(this.DOMElement, "r", "10");
    }
    this.move(this.x, this.y);
    this.DOMElement.classList.add("Flowchart-node");
};

Node.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
    var points;
    switch (this.type) {
        case NodeType.ACTION:
            setAttr(this.DOMElement, "x", this.x - nodeWidth / 2);
            setAttr(this.DOMElement, "y", this.y - nodeHeight / 2);
            break;
        case NodeType.CONDITION:
            points = this.x + "," + (this.y - nodeHeight / 2) + " ";   // top
            points += (this.x - nodeWidth / 2) + "," + this.y + " ";   // left
            points += this.x + "," + (this.y + nodeHeight / 2) + " ";  // bottom
            points += (this.x + nodeWidth / 2) + "," + this.y;         // right
            setAttr(this.DOMElement, "points", points);
            break;
        case NodeType.INPUT:
        case NodeType.OUTPUT:
            points = (this.x - nodeWidth / 2 + nodeHeight / 4) + "," + (this.y - nodeHeight / 2) + " ";   // left-top
            points += (this.x - nodeWidth / 2 - nodeHeight / 4) + "," + (this.y + nodeHeight / 2) + " ";  // left-bottom
            points += (this.x + nodeWidth / 2 - nodeHeight / 4) + "," + (this.y + nodeHeight / 2) + " ";  // right-bottom
            points += (this.x + nodeWidth / 2 + nodeHeight / 4) + "," + (this.y - nodeHeight / 2);        // right-top
            setAttr(this.DOMElement, "points", points);
            break;
        case NodeType.END:
        default:
            setAttr(this.DOMElement, "cx", this.x);
            setAttr(this.DOMElement, "cy", this.y);
    }
};

Node.prototype.drag = function (dx, dy) {
    this.move(this.x + dx, this.y + dy);
};

Node.prototype.dragStart = function (e) {
    this.capture();
    if (this.onCapture) {
        this.onCapture(this);
    }
};

Node.prototype.capture = function () {
    this.captured = true;
    this.DOMElement.classList.add("Node-captured");
};

Node.prototype.uncapture = function () {
    this.captured = false;
    this.DOMElement.classList.remove("Node-captured");
};

/// Flowchart class
function Flowchart(options) {
    this.nodes = [];
    this.links = [];
    this.captured = [];
    this.editable = options ? !!options.editable : true;
    this.DOMElement = document.createElement("div");
    if (options) {
        if (options.id) this.DOMElement.id = options.id;
        if (options.classList) this.DOMElement.classList = options.classList;
    }
    this.DOMElement.classList.add("Flowchart-container");
    this.drawArea = document.createElementNS(xlmns, "svg");
    setAttr(this.drawArea, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
    this.drawArea.addEventListener("mouseup", this.dragEndAll.bind(this));
    this.drawArea.addEventListener("mousemove", this.dragAll.bind(this));

    this.DOMElement.appendChild(this.drawArea);
}

Flowchart.prototype.addNode = function (node) {
    node.onCapture = this.nodeHasBeenCaptured.bind(this);
    this.nodes.push(node);
    this.drawArea.appendChild(node.DOMElement);
};

Flowchart.prototype.nodeHasBeenCaptured = function (node) {
    this.captured.push(node);
};

Flowchart.prototype.dragAll = function (e) {
    if (e.buttons === 1) {
        var k = svgWidth / this.drawArea.clientWidth;
        for (var i = 0; i < this.captured.length; i++) {
            this.captured[i].drag(k * e.movementX, k * e.movementY);
        }
    }
};

Flowchart.prototype.dragEndAll = function (e) {
    for (var i = 0; i < this.captured.length; i++) {
        this.captured[i].uncapture();
    }
    this.captured = [];
};

/// Init Flowcharts
/**
 * Replace all <Flowchart> tags with Flowchart.DOMElement.
 * Inherit `id` and `class` of <Flowchart>
 */
window.addEventListener("load", function () {
    var flowcharts = document.getElementsByTagName("Flowchart");
    while (flowcharts.length > 0) {
        var tag = flowcharts[0];
        var flowchart = new Flowchart({id: tag.id, classList: tag.classList});
        $flowcharts.push(flowchart);

        var startNode = new Node(NodeType.INPUT);
        startNode.move(30, 20);
        flowchart.addNode(startNode);

        var newTag = flowchart.DOMElement;
        tag.parentNode.replaceChild(newTag, tag);
    }
});