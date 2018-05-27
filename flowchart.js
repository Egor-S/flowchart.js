const xlmns = "http://www.w3.org/2000/svg";
const nodeWidth = 40;
const nodeHeight = 20;
var $flowcharts = [];

const NodeType = {
    ACTION: 1,
    INPUT: 2,
    OUTPUT: 3,
    CONDITION: 4,
    END: 5
};

/// Node class
function Node(type) {
    this.type = type || NodeType.END;
    this.text = "";
    this.x = 0;
    this.y = 0;
    switch (this.type) {
        case NodeType.ACTION:
            this.DOMElement = document.createElementNS(xlmns, "rect");
            this.DOMElement.setAttributeNS(null, "width", nodeWidth);
            this.DOMElement.setAttributeNS(null, "height", nodeHeight);
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
            this.DOMElement.setAttributeNS(null, "r", "10");
    }
    this.DOMElement.classList.add("Flowchart-node");
    this.move(this.x, this.y);
}

Node.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
    switch (this.type) {
        case NodeType.ACTION:
            this.DOMElement.setAttributeNS(null, "x", this.x - nodeWidth / 2);
            this.DOMElement.setAttributeNS(null, "y", this.y - nodeHeight / 2);
            break;
        case NodeType.CONDITION:
            var points = this.x + "," + (this.y - nodeHeight / 2) + " ";
            points += (this.x - nodeWidth / 2) + "," + this.y + " ";
            points += this.x + "," + (this.y + nodeHeight / 2) + " ";
            points += (this.x + nodeWidth / 2) + "," + this.y;
            this.DOMElement.setAttributeNS(null, "points", points);
            break;
        case NodeType.END:
        default:
            this.DOMElement.setAttributeNS(null, "cx", this.x);
            this.DOMElement.setAttributeNS(null, "cy", this.y);
    }
};

/// Flowchart class
function Flowchart(options) {
    this.nodes = [];
    this.links = [];
    this.editable = options ? !!options.editable : true;
    this.DOMElement = document.createElement("div");
    if (options) {
        if (options.id) this.DOMElement.id = options.id;
        if (options.classList) this.DOMElement.classList = options.classList;
    }
    this.DOMElement.classList.add("Flowchart-container");
    this.drawArea = document.createElementNS(xlmns, "svg");
    this.drawArea.setAttributeNS(null, "viewBox", "0 0 1000 1000");

    // this.drawArea.classList.add("Flowchart-svg");
    this.DOMElement.appendChild(this.drawArea);
}

Flowchart.prototype.addNode = function (node) {
    this.nodes.push(node);
    this.drawArea.appendChild(node.DOMElement);
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

        var startNode = new Node(NodeType.CONDITION);
        startNode.move(20, 20);
        flowchart.addNode(startNode);

        var newTag = flowchart.DOMElement;
        tag.parentNode.replaceChild(newTag, tag);
    }
});