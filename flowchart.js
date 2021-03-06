const xlmns = "http://www.w3.org/2000/svg";
const nodeWidth = 40;
const nodeHeight = 20;
const svgWidth = 300;
const svgHeight = 300;
const connectionSize = 2.5;

const NodeType = {
    ACTION: 1,
    INPUT: 2,
    OUTPUT: 3,
    CONDITION: 4,
    END: 5,
    START: 6
};

var $flowcharts = [];

/// Utilities
/**
 * Alias for `elem.setAttributeNS(null, attr, value)`
 */
function setAttr(elem, attr, value) {
    elem.setAttributeNS(null, attr, String(value));
}

function createConnectionNode() {
    var elem = document.createElementNS(xlmns, "rect");
    elem.classList.add("Node-connection");
    setAttr(elem, "width", connectionSize);
    setAttr(elem, "height", connectionSize);
    return elem;
}

/// Node class
function Node(type, text) {
    this.type = type === undefined ? NodeType.START : type;
    this.text = text === undefined ? "" : text;
    this.x = this.y = 0;
    this.captured = false;
    this.createDOMElement();
}

Node.prototype.createDOMElement = function () {
    this.DOMElement = document.createElementNS(xlmns, "g");
    // Figure
    switch (this.type) {
        case NodeType.ACTION:
            this.figureElement = document.createElementNS(xlmns, "rect");
            setAttr(this.figureElement, "width", nodeWidth);
            setAttr(this.figureElement, "height", nodeHeight);
            break;
        case NodeType.CONDITION:
            this.figureElement = document.createElementNS(xlmns, "polygon");
            break;
        case NodeType.INPUT:
        case NodeType.OUTPUT:
            this.figureElement = document.createElementNS(xlmns, "polygon");
            break;
        case NodeType.END:
        case NodeType.START:
        default:
            this.figureElement = document.createElementNS(xlmns, "circle");
            setAttr(this.figureElement, "r", nodeHeight / 2);
    }
    this.figureElement.classList.add("Node-figure");
    // Text
    this.textElement = document.createElementNS(xlmns, "text");
    this.textElement.classList.add("Node-text");
    this.updateText();
    // Connections
    this.inputConnection = createConnectionNode();
    this.outputConnection = createConnectionNode();
    if (this.type === NodeType.CONDITION) this.output2Connection = createConnectionNode();
    // Construct DOMElement
    this.DOMElement.appendChild(this.figureElement);
    if (this.type !== NodeType.START) {
        this.inputConnection.addEventListener("mousedown", this.connect(0).bind(this));
        this.DOMElement.appendChild(this.inputConnection);
    }
    if (this.type !== NodeType.END) {
        this.outputConnection.addEventListener("mousedown", this.connect(1).bind(this));
        this.DOMElement.appendChild(this.outputConnection);
    }
    if (this.type === NodeType.CONDITION) {
        this.output2Connection.addEventListener("mousedown", this.connect(2).bind(this));
        this.DOMElement.appendChild(this.output2Connection);
    }
    this.DOMElement.appendChild(this.textElement);
    this.move(this.x, this.y);
    // Drag config
    this.figureElement.addEventListener("mousedown", this.dragStart.bind(this));
    this.figureElement.addEventListener("dragstart", function () {return false;});
};

Node.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
    var points;
    // Figure
    switch (this.type) {
        case NodeType.ACTION:
            setAttr(this.figureElement, "x", this.x - nodeWidth / 2);
            setAttr(this.figureElement, "y", this.y - nodeHeight / 2);
            break;
        case NodeType.CONDITION:
            points = this.x + "," + (this.y - nodeHeight / 2) + " ";   // top
            points += (this.x - nodeWidth / 2) + "," + this.y + " ";   // left
            points += this.x + "," + (this.y + nodeHeight / 2) + " ";  // bottom
            points += (this.x + nodeWidth / 2) + "," + this.y;         // right
            setAttr(this.figureElement, "points", points);
            break;
        case NodeType.INPUT:
        case NodeType.OUTPUT:
            points = (this.x - nodeWidth / 2 + nodeHeight / 4) + "," + (this.y - nodeHeight / 2) + " ";   // left-top
            points += (this.x - nodeWidth / 2 - nodeHeight / 4) + "," + (this.y + nodeHeight / 2) + " ";  // left-bottom
            points += (this.x + nodeWidth / 2 - nodeHeight / 4) + "," + (this.y + nodeHeight / 2) + " ";  // right-bottom
            points += (this.x + nodeWidth / 2 + nodeHeight / 4) + "," + (this.y - nodeHeight / 2);        // right-top
            setAttr(this.figureElement, "points", points);
            break;
        case NodeType.END:
        case NodeType.START:
        default:
            setAttr(this.figureElement, "cx", this.x);
            setAttr(this.figureElement, "cy", this.y);
    }
    // Text
    setAttr(this.textElement, "y", this.y);
    for (var i = 0; i < this.textElement.childNodes.length; i++) {
        setAttr(this.textElement.childNodes[i], "x", this.x);
    }
    // Connections
    setAttr(this.inputConnection, "x", this.x - connectionSize / 2);
    setAttr(this.inputConnection, "y", this.y - connectionSize / 2 - nodeHeight / 2);
    if (this.type === NodeType.CONDITION) {
        setAttr(this.outputConnection, "x", this.x - connectionSize / 2 - nodeWidth / 2);
        setAttr(this.outputConnection, "y", this.y - connectionSize / 2);
        setAttr(this.output2Connection, "x", this.x - connectionSize / 2 + nodeWidth / 2);
        setAttr(this.output2Connection, "y", this.y - connectionSize / 2);
    } else {
        setAttr(this.outputConnection, "x", this.x - connectionSize / 2);
        setAttr(this.outputConnection, "y", this.y - connectionSize / 2 + nodeHeight / 2);
    }
};

Node.prototype.drag = function (dx, dy) {
    this.move(this.x + dx, this.y + dy);
};

Node.prototype.dragStart = function (e) {
    this.onCapture(this, e.ctrlKey);
    e.stopPropagation();
};

Node.prototype.capture = function () {
    this.captured = true;
    this.figureElement.classList.add("Node-captured");
};

Node.prototype.uncapture = function () {
    this.captured = false;
    this.figureElement.classList.remove("Node-captured");
};

Node.prototype.updateText = function() {
    // todo auto-wrapping
    var lines = [this.text];
    // Remove old text
    while (this.textElement.firstChild) {
        this.textElement.removeChild(this.textElement.firstChild);
    }
    // Create new lines
    for (var i = 0; i < lines.length; i++) {
        var line = document.createElementNS(xlmns, "tspan");
        setAttr(line, "text-anchor", "middle");
        setAttr(line, "x", this.x);
        if (i > 0) setAttr(line, "dy", "1.1em");
        line.appendChild(document.createTextNode(lines[i]));
        this.textElement.appendChild(line);
    }
    setAttr(this.textElement, "dy", ((2 - lines.length) * 1.1 - 0.1) / 2 + "em");  // TODO it's terrible
};

Node.prototype.connect = function (connectionIndex) {
    return function () {
        switch (connectionIndex) {
            case 1:
                this.outputConnection.classList.add("Node-connection-active");
                break;
            case 2:
                this.output2Connection.classList.add("Node-connection-active");
                break;
            case 0:
            default:
                this.inputConnection.classList.add("Node-connection-active");
        }
        if (this.onConnect) {
            this.onConnect(this, connectionIndex);
        }
    };
};

Node.prototype.disableConnection = function (connectionIndex) {
    switch (connectionIndex) {
        case 1:
            this.outputConnection.classList.remove("Node-connection-active");
            break;
        case 2:
            this.output2Connection.classList.remove("Node-connection-active");
            break;
        case 0:
        default:
            this.inputConnection.classList.remove("Node-connection-active");
    }
};

Node.prototype.getConnectionPoint = function (connectionIndex) {
    switch (connectionIndex) {
        case 1:
            if (this.type === NodeType.CONDITION) {
                return {x: this.x - nodeWidth / 2, y: this.y, bottom: false};
            }
            return {x: this.x, y: this.y + nodeHeight / 2, bottom: true};
        case 2:
            return {x: this.x + nodeWidth / 2, y: this.y, bottom: false};
        default:
            return {x: this.x, y: this.y - nodeHeight / 2, bottom: false};
    }
};

/// Flowchart class
function Flowchart(options) {
    this.nodes = [];
    this.links = [];
    this.captured = [];
    this.linked = undefined;
    this.linkIndex = undefined;
    this.editable = (options && options.editable) ? !!options.editable : true;
    this.currentTool = "move";
    this.offsetX = 0;
    this.offsetY = 0;
    // DOM Elements
    this.DOMElement = document.createElement("div");
    if (options) {
        if (options.id) this.DOMElement.id = options.id;
        if (options.classList) this.DOMElement.classList = options.classList;
    }
    this.DOMElement.classList.add("Flowchart");
    // Config part
    var config = document.createElement("div");
    config.classList.add("Flowchart-config");
    this.createToolbar();
    this.textedit = document.createElement("input");
    this.textedit.classList.add("Flowchart-textedit");
    this.textedit.addEventListener("input", this.texteditInput.bind(this));
    this.texteditUpdate();
    // Draw part
    var container = document.createElement("div");
    container.classList.add("Flowchart-container");
    this.drawArea = document.createElementNS(xlmns, "svg");
    this.drawArea.classList.add("Flowchart-svg");
    setAttr(this.drawArea, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
    this.drawArea.style.width = "1000px";  // Default zoom
    this.drawArea.style.height = "1000px";
    this.drawArea.addEventListener("mousedown", this.areaClick.bind(this));
    container.addEventListener("mousemove", this.areaMove.bind(this));
    // Assemble
    config.appendChild(this.toolbar);
    config.appendChild(this.textedit);
    container.appendChild(this.drawArea);
    this.DOMElement.appendChild(config);
    this.DOMElement.appendChild(container);
}

Flowchart.prototype.addNode = function (node) {
    node.onCapture = this.nodeHasBeenCaptured.bind(this);
    node.onConnect = this.nodeHasBeenConnected.bind(this);
    this.nodes.push(node);
    // Place new node at the beginning for correct link render
    if (this.drawArea.firstChild) {
        this.drawArea.insertBefore(node.DOMElement, this.drawArea.firstChild);
    } else {
        this.drawArea.appendChild(node.DOMElement);
    }
};

Flowchart.prototype.nodeHasBeenCaptured = function (node, addMode) {
    if (this.currentTool === "delete") {
        if (node.type !== NodeType.END && node.type !== NodeType.START) {
            this.deleteLinks(node, true, 3);  // Delete all related links
            var i = this.nodes.indexOf(node);
            this.drawArea.removeChild(node.DOMElement);
            this.nodes.splice(i, 1);
        }
        this.changeTool("select");
        this.texteditUpdate();
    } else {
        if (!addMode) {
            this.uncaptureAll();
        }
        if (this.captured.indexOf(node) === -1) {
            node.capture();
            this.captured.push(node);
            this.texteditUpdate();
        }
    }
};

Flowchart.prototype.areaClick = function (e) {
    this.uncaptureAll();
    var node = undefined;
    if (this.currentTool === "action") {
        node = new Node(NodeType.ACTION, "...");
    } else if (this.currentTool === "condition") {
        node = new Node(NodeType.CONDITION, "...");
    } else if (this.currentTool === "io") {  // todo
        node = new Node(NodeType.OUTPUT, "...");
    }
    if (node !== undefined) {
        const k = svgWidth / this.drawArea.getBoundingClientRect().width;
        node.move(k * e.offsetX, k * e.offsetY);
        this.addNode(node);
        this.changeTool("select");
        this.nodeHasBeenCaptured(node);
    }
    this.texteditUpdate();
};

Flowchart.prototype.areaMove = function (e) {
    const k = svgWidth / this.drawArea.getBoundingClientRect().width;
    if (e.buttons === 1) {
        if (this.currentTool === "select") {
            for (var i = 0; i < this.captured.length; i++) {
                this.captured[i].drag(k * e.movementX, k * e.movementY);
            }
            for (var j = 0; j < this.links.length; j++) {
                if (this.captured.indexOf(this.links[j].to) !== -1 ||
                    this.captured.indexOf(this.links[j].from) !== -1) {
                    this.redrawLink(j);
                }
            }
        } else if (this.currentTool === "move") {
            this.offsetX += e.movementX;
            this.offsetY += e.movementY;
            this.drawArea.style.transform = "translate(" + this.offsetX + "px, " + this.offsetY + "px)";
        }
    }
};

Flowchart.prototype.uncaptureAll = function () {
    for (var i = 0; i < this.captured.length; i++) {
        this.captured[i].uncapture();
    }
    this.captured = [];
};

Flowchart.prototype.serialize = function () {
    var nodes = [];
    var links = [];
    for (var i = 0; i < this.nodes.length; i++) {
        nodes.push({
            type: this.nodes[i].type,
            x: this.nodes[i].x,
            y: this.nodes[i].y,
            text: this.nodes[i].text
        });
    }
    for (var j = 0; j < this.links.length; j++) {
        links.push({
            from: this.nodes.indexOf(this.links[j].from),
            to: this.nodes.indexOf(this.links[j].to),
            type: this.links[j].type
        });
    }
    return {editable: this.editable, nodes: nodes, links: links};
};

/**
 * This method works correctly only with empty Flowchart
 */
Flowchart.prototype.load = function (serializedFlowchart) {
    this.editable = serializedFlowchart.editable !== undefined ? serializedFlowchart.editable : true;
    const nodes = serializedFlowchart.nodes;
    this.nodes = [];
    const links = serializedFlowchart.links;
    this.links = [];
    for (var i = 0; i < nodes.length; i++) {
        var newNode = new Node(nodes[i].type, nodes[i].text);
        newNode.move(nodes[i].x, nodes[i].y);
        this.addNode(newNode);
    }
    for (var j = 0; j < links.length; j++) {
        var newLink = {
            from: this.nodes[links[j].from],
            to: this.nodes[links[j].to],
            type: links[j].type,
            DOMElement: document.createElementNS(xlmns, "path")
        };
        newLink.DOMElement.classList.add("Flowchart-link");
        this.drawArea.appendChild(newLink.DOMElement);
        this.links.push(newLink);
        this.redrawLink(this.links.length - 1);
    }
};

Flowchart.prototype.nodeHasBeenConnected = function (node, connectionIndex) {
    if (this.currentTool === "cut") {
        if (connectionIndex === 0) this.deleteLinks(node, true, 0);  // All incoming
        else this.deleteLinks(node, false, connectionIndex);
        node.disableConnection(connectionIndex);
        this.changeTool("select");
    } else if (this.linked === undefined) {
        this.linked = node;
        this.linkIndex = connectionIndex;
    } else {
        var fromNode, toNode, type;
        if (this.linkIndex === 0 && connectionIndex > 0) {  // From `node` to `this.linked`
            type = connectionIndex;
            fromNode = node;
            toNode = this.linked;
        } else if (connectionIndex === 0 && this.linkIndex > 0) {  // From `this.linked` to `node`
            type = this.linkIndex;
            fromNode = this.linked;
            toNode = node;
        }
        if (fromNode !== undefined) {
            this.deleteLinks(fromNode, false, type);
            var newLink = {
                from: fromNode,
                to: toNode,
                type: type,
                DOMElement: document.createElementNS(xlmns, "path")
            };
            newLink.DOMElement.classList.add("Flowchart-link");
            this.drawArea.appendChild(newLink.DOMElement);
            this.links.push(newLink);
            this.redrawLink(this.links.length - 1);
        }
        // Clear connection data
        node.disableConnection(connectionIndex);
        this.linked.disableConnection(this.linkIndex);
        this.linked = undefined;
        this.linkIndex = undefined;
    }
};

Flowchart.prototype.deleteLinks = function (node, incoming, outcomingType) {
    for (var i = this.links.length - 1; i >= 0; i--) {
        if (this.links[i].to === node && incoming) {
            this.deleteLinkByIndex(i);
        } else if (this.links[i].from === node) {
            switch (outcomingType) {
                case 1:  // Normal output
                case 2:  // Alternative output of condition
                    if (this.links[i].type === outcomingType) {
                        this.deleteLinkByIndex(i);
                    }
                    break;
                case 3:  // Any link type
                    this.deleteLinkByIndex(i);
                    break;
            }
        }
    }
};

Flowchart.prototype.deleteLinkByIndex = function (index) {
    if (this.links[index].DOMElement.parentNode) {
        this.links[index].DOMElement.parentNode.removeChild(this.links[index].DOMElement);
    }
    this.links.splice(index, 1);
};

Flowchart.prototype.redrawLink = function (index) {
    var fromType = this.links[index].type;
    var from = this.links[index].from.getConnectionPoint(fromType);
    var to = this.links[index].to.getConnectionPoint(0);

    var path = "M " + from.x + " " + from.y;
    to.y -= connectionSize;  // Point before final line. To simplify conditions.
    if (from.bottom) {
        path += " m " + 0 + " " + connectionSize / 2 + " v " + connectionSize / 2;
        from.y += connectionSize;
    } else if (fromType === 1) {
        path += " m " + -connectionSize / 2 + " " + 0 + " h " + -connectionSize / 2;
        from.x -= connectionSize;
    } else if (fromType === 2) {
        path += " m " + connectionSize / 2 + " " + 0 + " h " + connectionSize / 2;
        from.x += connectionSize;
    }

    if (to.y < from.y && from.bottom) {
        // Prevent line over node
        path += " h " + (to.x < from.x ? -1 : 1) * (nodeWidth / 2 + connectionSize);
        path += " V " + to.y;
        path += " H " + to.x;
    } else if (from.bottom || to.y < from.y ||
        (!from.bottom && ((fromType === 1 && to.x > from.x) || (fromType === 2 && to.x < from.x)))) {
        path += " V " + to.y;
        path += " H " + to.x;
    } else {
        path += " H " + to.x;
        path += " V " + to.y;
    }
    path += " v " + connectionSize / 2;
    setAttr(this.links[index].DOMElement, "d", path);
};

Flowchart.prototype.createToolButton = function (tool, title) {
    var button = document.createElement("img");
    button.classList.add("Flowchart-tool");
    button.src = "assets/" + tool + "-icon.svg";
    button.setAttribute("title", title);
    button.setAttribute("data-tool", tool);
    button.addEventListener("click", function () {
        this.changeTool(tool);
    }.bind(this));
    return button;
};

Flowchart.prototype.changeTool = function (tool) {
    this.currentTool = tool;
    for (var i = 0; i < this.toolbar.childNodes.length; i++) {
        this.toolbar.childNodes[i].classList.remove("active");
        if (this.toolbar.childNodes[i].getAttribute("data-tool") === tool) {
            this.toolbar.childNodes[i].classList.add("active");
        }
    }
};

Flowchart.prototype.texteditInput = function (e) {
    if (this.captured.length === 1) {
        this.captured[0].text = this.textedit.value;
        this.captured[0].updateText();
    }
};

Flowchart.prototype.texteditUpdate = function () {
    if (this.captured.length !== 1) {
        this.textedit.value = "Выберите один блок";
        this.textedit.disabled = true;
    } else {
        this.textedit.value = this.captured[0].text;
        this.textedit.disabled = false;
    }
};

Flowchart.prototype.createToolbar = function () {
    this.toolbar = document.createElement("div");
    this.toolbar.classList.add("Flowchart-toolbar");
    this.toolbar.appendChild(this.createToolButton("select", "Выделение"));
    this.toolbar.appendChild(this.createToolButton("move", "Обзор"));
    this.toolbar.appendChild(this.createToolButton("action", "Блок действия"));
    this.toolbar.appendChild(this.createToolButton("io", "Блок ввода/вывода"));
    this.toolbar.appendChild(this.createToolButton("condition", "Блок условия"));
    this.toolbar.appendChild(this.createToolButton("delete", "Удалить блок"));
    this.toolbar.appendChild(this.createToolButton("cut", "Удалить связи"));
    this.changeTool("select");
    
    var zoomin = document.createElement("img");
    zoomin.classList.add("Flowchart-tool");
    zoomin.src = "assets/zoom-in-icon.svg";
    zoomin.setAttribute("title", "Приблизить");
    zoomin.addEventListener("click", function () {
        this.drawArea.style.width = this.drawArea.getBoundingClientRect().width * 1.3 + "px";
        this.drawArea.style.height = this.drawArea.getBoundingClientRect().height * 1.3 + "px";
    }.bind(this));
    this.toolbar.appendChild(zoomin);
    var zoomout = document.createElement("img");
    zoomout.classList.add("Flowchart-tool");
    zoomout.src = "assets/zoom-out-icon.svg";
    zoomout.setAttribute("title", "Отдалить");
    zoomout.addEventListener("click", function () {
        this.drawArea.style.width = this.drawArea.getBoundingClientRect().width / 1.3 + "px";
        this.drawArea.style.height = this.drawArea.getBoundingClientRect().height / 1.3 + "px";
    }.bind(this));
    this.toolbar.appendChild(zoomout);
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

        if (window.localStorage.flowchart !== undefined) {  // TODO test only
            flowchart.load(JSON.parse(window.localStorage.flowchart));
        } else {
            var begin = new Node(NodeType.START, "Начало");
            var end = new Node(NodeType.END, "Конец");
            flowchart.addNode(begin);
            flowchart.addNode(end);
            begin.move(nodeWidth, nodeWidth);
            end.move(nodeWidth, 2 * nodeWidth);
        }

        var newTag = flowchart.DOMElement;
        tag.parentNode.replaceChild(newTag, tag);
    }
});