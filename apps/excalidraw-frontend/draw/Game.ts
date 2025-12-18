import { Tool } from "@/components/Canvas";
import { getExistingShapes, deleteShape, updateShape } from "./http";

export type ShapeStyle = {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    strokeStyle: "solid" | "dotted" | "dashed";
}

type ShapeData = {
    chatId?: number;
    localId?: string;  // Unique ID for local tracking before chatId is assigned
    shape: Shape;
}

type BaseShape = {
    style?: ShapeStyle;
}

type Shape = ({
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "diamond";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
} | {
    type: "pencil";
    points: Array<{x: number, y: number}>;
} | {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
} | {
    type: "arrow";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
} | {
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
}) & BaseShape;

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: ShapeData[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private pencilPoints: Array<{x: number, y: number}> = [];
    private eraserPoints: Array<{x: number, y: number}> = [];
    private laserPoints: Array<{x: number, y: number, timestamp: number}> = [];
    private laserAnimationId: number | null = null;

    private selectedShape: ShapeData | null = null;
    private selectedShapeIndex: number = -1;
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    // Resize handle tracking
    private isResizing: boolean = false;
    private resizeHandle: string | null = null;
    private resizeStartBbox: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

    // Text editing
    private isEditingText: boolean = false;
    private textInputElement: HTMLTextAreaElement | null = null;
    private editingTextShape: ShapeData | null = null;

    // Track pending shapes (locally created, waiting for server chatId)
    // Key: localId, Value: shape data
    private pendingShapes: Map<string, ShapeData> = new Map();
    // Track shapes that were deleted before receiving chatId
    private deletedPendingIds: Set<string> = new Set();
    // Counter for generating unique local IDs
    private localIdCounter: number = 0;

    // Style properties
    private strokeColor: string = "#ffffff";
    private fillColor: string = "transparent";
    private strokeWidth: number = 2;
    private strokeStyle: "solid" | "dotted" | "dashed" = "solid";

    // Pan/scroll offset
    private panX: number = 0;
    private panY: number = 0;
    private isPanning: boolean = false;

    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
        this.canvas.removeEventListener("mouseleave", this.mouseLeaveHandler)
        this.canvas.removeEventListener("wheel", this.wheelHandler)
        if (this.laserAnimationId) {
            cancelAnimationFrame(this.laserAnimationId);
        }
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
        if (tool !== "select") {
            this.selectedShape = null;
            this.selectedShapeIndex = -1;
            this.clearCanvas();
        }
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
    }

    setFillColor(color: string) {
        this.fillColor = color;
    }

    setStrokeWidth(width: number) {
        this.strokeWidth = width;
    }

    setStrokeStyle(style: "solid" | "dotted" | "dashed") {
        this.strokeStyle = style;
    }

    // Convert screen coordinates to canvas (world) coordinates
    private screenToCanvas(screenX: number, screenY: number): { x: number, y: number } {
        return {
            x: screenX - this.panX,
            y: screenY - this.panY
        };
    }

    getCurrentStyle(): ShapeStyle {
        return {
            strokeColor: this.strokeColor,
            fillColor: this.fillColor,
            strokeWidth: this.strokeWidth,
            strokeStyle: this.strokeStyle
        };
    }

    async init() {
        const shapes = await getExistingShapes(this.roomId);
        // @ts-ignore
        this.existingShapes = shapes ? shapes.filter(s => s && s.shape) : [];
        console.log(this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsed = JSON.parse(message.message);
                // chatId comes from the top-level message, not from parsed
                const chatId = message.chatId;
                
                if (parsed.deleteChatId) {
                    // Remove shape with this chatId
                    this.existingShapes = this.existingShapes.filter(s => s.chatId !== parsed.deleteChatId);
                } else if (parsed.updateShape) {
                    // Update shape position from another client
                    const shapeData = this.existingShapes.find(s => s.chatId === parsed.updateShape.chatId);
                    if (shapeData) {
                        shapeData.shape = parsed.updateShape.shape;
                    }
                } else if (parsed.shape && chatId) {
                    const localId = parsed.localId;
                    
                    // Check if this shape was deleted before we got the chatId
                    if (localId && this.deletedPendingIds.has(localId)) {
                        // This shape was deleted locally before server responded
                        // Delete it from database now that we have the chatId
                        deleteShape(chatId).then(success => {
                            if (success) {
                                console.log("Deleted pending shape from database:", chatId);
                            }
                        });
                        // Remove from deleted pending list
                        this.deletedPendingIds.delete(localId);
                        // Don't add to existingShapes
                        this.clearCanvas();
                        return;
                    }
                    
                    // Check if this is a shape we created locally (pending) using localId
                    if (localId && this.pendingShapes.has(localId)) {
                        // This is our own shape coming back - update chatId
                        const pendingData = this.pendingShapes.get(localId);
                        if (pendingData) {
                            pendingData.chatId = chatId;
                        }
                        // Remove from pending
                        this.pendingShapes.delete(localId);
                    } else if (!localId) {
                        // This is from another client (no localId) - add it
                        this.existingShapes.push({ shape: parsed.shape, chatId: chatId });
                    }
                    // If it has localId but not in our pending, it's from another client's pending - ignore
                }
                this.clearCanvas();
            }
        }
    }

    // Helper to check if two shapes are the same (for deduplication)
    private shapesMatch(shape1: Shape, shape2: Shape): boolean {
        if (shape1.type !== shape2.type) return false;
        
        // Compare based on type
        if (shape1.type === "rect" && shape2.type === "rect") {
            return shape1.x === shape2.x && shape1.y === shape2.y && 
                   shape1.width === shape2.width && shape1.height === shape2.height;
        } else if (shape1.type === "circle" && shape2.type === "circle") {
            return shape1.centerX === shape2.centerX && shape1.centerY === shape2.centerY &&
                   shape1.radiusX === shape2.radiusX && shape1.radiusY === shape2.radiusY;
        } else if (shape1.type === "diamond" && shape2.type === "diamond") {
            return shape1.x === shape2.x && shape1.y === shape2.y && 
                   shape1.width === shape2.width && shape1.height === shape2.height;
        } else if (shape1.type === "line" && shape2.type === "line") {
            return shape1.x1 === shape2.x1 && shape1.y1 === shape2.y1 &&
                   shape1.x2 === shape2.x2 && shape1.y2 === shape2.y2;
        } else if (shape1.type === "arrow" && shape2.type === "arrow") {
            return shape1.x1 === shape2.x1 && shape1.y1 === shape2.y1 &&
                   shape1.x2 === shape2.x2 && shape1.y2 === shape2.y2;
        } else if (shape1.type === "text" && shape2.type === "text") {
            return shape1.x === shape2.x && shape1.y === shape2.y && shape1.text === shape2.text;
        } else if (shape1.type === "pencil" && shape2.type === "pencil") {
            // Compare pencil points - just check length and first/last points
            if (!shape1.points || !shape2.points) return false;
            if (shape1.points.length !== shape2.points.length) return false;
            if (shape1.points.length === 0) return true;
            const first1 = shape1.points[0], first2 = shape2.points[0];
            const last1 = shape1.points[shape1.points.length - 1];
            const last2 = shape2.points[shape2.points.length - 1];
            return first1.x === first2.x && first1.y === first2.y &&
                   last1.x === last2.x && last1.y === last2.y;
        }
        return false;
    }



    private isPointInShape(shape: Shape, x: number, y: number): boolean {
        const threshold = 15;
        
        if (shape.type === "rect") {
            return x >= shape.x - threshold && 
                   x <= shape.x + shape.width + threshold &&
                   y >= shape.y - threshold && 
                   y <= shape.y + shape.height + threshold;
        } else if (shape.type === "diamond") {
            // Check if point is in diamond's bounding box with threshold
            return x >= shape.x - threshold && 
                   x <= shape.x + shape.width + threshold &&
                   y >= shape.y - threshold && 
                   y <= shape.y + shape.height + threshold;
        } else if (shape.type === "circle") {
            // Ellipse hit detection: (x-cx)²/rx² + (y-cy)²/ry² <= 1
            const dx = x - shape.centerX;
            const dy = y - shape.centerY;
            const rx = Math.abs(shape.radiusX) + threshold;
            const ry = Math.abs(shape.radiusY) + threshold;
            return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        } else if (shape.type === "pencil") {
            return shape.points?.some(p => {
                const dx = x - p.x;
                const dy = y - p.y;
                return Math.sqrt(dx * dx + dy * dy) < threshold;
            }) ?? false;
        } else if (shape.type === "line") {
            return this.distanceToLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2) < threshold;
        } else if (shape.type === "arrow") {
            return this.distanceToLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2) < threshold;
        } else if (shape.type === "text") {
            return x >= shape.x - threshold && 
                   x <= shape.x + shape.width + threshold &&
                   y >= shape.y - threshold && 
                   y <= shape.y + shape.height + threshold;
        }
        return false;
    }

    private distanceToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state and apply pan offset
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);

        this.existingShapes.map((shapeData) => {
            if (!shapeData || !shapeData.shape) return;
            const shape = shapeData.shape;
            
            // Apply styles
            this.applyShapeStyle(shape.style);
            
            if (shape.type === "rect") {
                if (shape.style?.fillColor && shape.style.fillColor !== "transparent") {
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                }
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.ellipse(shape.centerX, shape.centerY, Math.abs(shape.radiusX), Math.abs(shape.radiusY), 0, 0, Math.PI * 2);
                if (shape.style?.fillColor && shape.style.fillColor !== "transparent") {
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (shape.type === "pencil") {
                if (shape.points && shape.points.length > 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            } else if (shape.type === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "diamond") {
                this.drawDiamondWithStyle(shape.x, shape.y, shape.width, shape.height, shape.style);
            } else if (shape.type === "arrow") {
                this.drawArrowWithStyle(shape.x1, shape.y1, shape.x2, shape.y2, shape.style);
            } else if (shape.type === "text") {
                this.drawTextShape(shape);
            }
            
            // Reset line dash
            this.ctx.setLineDash([]);
        })

        // Restore context state (removes pan translation)
        this.ctx.restore();
    }

    private applyShapeStyle(style?: ShapeStyle) {
        if (style) {
            this.ctx.strokeStyle = style.strokeColor || "#ffffff";
            this.ctx.fillStyle = style.fillColor || "transparent";
            this.ctx.lineWidth = style.strokeWidth || 2;
            
            if (style.strokeStyle === "dotted") {
                this.ctx.setLineDash([2, 4]);
            } else if (style.strokeStyle === "dashed") {
                this.ctx.setLineDash([8, 4]);
            } else {
                this.ctx.setLineDash([]);
            }
        } else {
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.fillStyle = "transparent";
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
        }
    }

    private drawArrowWithStyle(fromX: number, fromY: number, toX: number, toY: number, style?: ShapeStyle) {
        const headlen = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.applyShapeStyle(style);
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        // Draw the main line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Draw the arrowhead as two lines (open arrow like ->)
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    private drawDiamondWithStyle(x: number, y: number, width: number, height: number, style?: ShapeStyle) {
        const points = [
            { x: x + width / 2, y },
            { x: x + width, y: y + height / 2 },
            { x: x + width / 2, y: y + height },
            { x, y: y + height / 2 }
        ];

        this.applyShapeStyle(style);
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        
        if (style?.fillColor && style.fillColor !== "transparent") {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    mouseDownHandler = (e: MouseEvent) => {
        // Ignore if editing text
        if (this.isEditingText) return;

        this.clicked = true
        
        // For pan tool, use screen coordinates
        if (this.selectedTool === "pan") {
            this.isPanning = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            return;
        }

        // For all other tools, convert to canvas coordinates
        const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);
        this.startX = canvasCoords.x;
        this.startY = canvasCoords.y;

        // Handle text tool - create text at click position
        if (this.selectedTool === "text") {
            this.createTextAtPosition(e.clientX, e.clientY);  // Text input uses screen coords for positioning
            this.clicked = false;
            return;
        }
        
        if (this.selectedTool === "select") {
            // Check if clicking on a resize handle of selected shape
            if (this.selectedShape && this.selectedShape.shape) {
                const handle = this.getResizeHandle(this.selectedShape.shape, this.startX, this.startY);
                if (handle) {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.resizeStartBbox = this.getShapeBoundingBox(this.selectedShape.shape);
                    this.lastMouseX = this.startX;
                    this.lastMouseY = this.startY;
                    return;
                }
                
                // Check if clicking inside the selected shape to drag it
                if (this.isPointInShape(this.selectedShape.shape, this.startX, this.startY)) {
                    this.isDragging = true;
                    this.lastMouseX = this.startX;
                    this.lastMouseY = this.startY;
                    return;
                }
            }
            
            // Check if clicking on an existing shape to select it
            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                const shapeData = this.existingShapes[i];
                if (shapeData && shapeData.shape && this.isPointInShape(shapeData.shape, this.startX, this.startY)) {
                    this.selectedShape = shapeData;
                    this.selectedShapeIndex = i;
                    this.isDragging = true;
                    this.lastMouseX = this.startX;
                    this.lastMouseY = this.startY;
                    this.clearCanvas();
                    this.drawSelectionBox(shapeData.shape);
                    return;
                }
            }
            // Clicked on empty area - deselect
            this.selectedShape = null;
            this.selectedShapeIndex = -1;
            this.isDragging = false;
            this.clearCanvas();
            return;
        }
        
        if (this.selectedTool === "pencil") {
            this.pencilPoints = [{x: this.startX, y: this.startY}];
        } else if (this.selectedTool === "eraser") {
            this.eraserPoints = [{x: this.startX, y: this.startY}];
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false
        
        // Convert screen coordinates to canvas coordinates
        const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);
        const height = canvasCoords.y - this.startY;
        const width = canvasCoords.x - this.startX;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;

        if (selectedTool === "text") {
            // Text is handled in mouseDown
            return;
        }

        // Handle pan tool release
        if (selectedTool === "pan") {
            this.isPanning = false;
            return;
        }

        if (selectedTool === "select") {
            // Save the moved/resized shape to database
            if ((this.isDragging || this.isResizing) && this.selectedShape && this.selectedShape.chatId) {
                updateShape(this.selectedShape.chatId, this.selectedShape.shape);
                
                // Notify other clients about the move/resize
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({
                        updateShape: {
                            chatId: this.selectedShape.chatId,
                            shape: this.selectedShape.shape
                        }
                    }),
                    roomId: this.roomId
                }));
            }
            this.isDragging = false;
            this.isResizing = false;
            this.resizeHandle = null;
            this.resizeStartBbox = null;
            return;
        }

        if (selectedTool === "eraser") {
            this.eraserPoints = [];
            return;
        }

        if (selectedTool === "laser") {
            // Laser doesn't save shapes, just clear points and let animation fade
            this.laserPoints = [];
            return;
        }

        if (selectedTool === "rect") {
            const minX = Math.min(this.startX, canvasCoords.x);
            const minY = Math.min(this.startY, canvasCoords.y);
            shape = {
                type: "rect",
                x: minX,
                y: minY,
                height: Math.abs(height),
                width: Math.abs(width),
                style: this.getCurrentStyle()
            }
        } else if (selectedTool === "circle") {
            // Calculate proper center and radii based on bounding box
            const minX = Math.min(this.startX, canvasCoords.x);
            const minY = Math.min(this.startY, canvasCoords.y);
            const boxWidth = Math.abs(width);
            const boxHeight = Math.abs(height);
            const radiusX = boxWidth / 2;
            const radiusY = boxHeight / 2;
            const centerX = minX + radiusX;
            const centerY = minY + radiusY;
            shape = {
                type: "circle",
                radiusX: radiusX,
                radiusY: radiusY,
                centerX: centerX,
                centerY: centerY,
                style: this.getCurrentStyle()
            }
        } else if (selectedTool === "diamond") {
            const minX = Math.min(this.startX, canvasCoords.x);
            const minY = Math.min(this.startY, canvasCoords.y);
            shape = {
                type: "diamond",
                x: minX,
                y: minY,
                width: Math.abs(width),
                height: Math.abs(height),
                style: this.getCurrentStyle()
            }
        } else if (selectedTool === "pencil") {
            if (this.pencilPoints.length > 1) {
                shape = {
                    type: "pencil",
                    points: this.pencilPoints,
                    style: this.getCurrentStyle()
                }
            }
            this.pencilPoints = [];
        } else if (selectedTool === "line") {
            shape = {
                type: "line",
                x1: this.startX,
                y1: this.startY,
                x2: canvasCoords.x,
                y2: canvasCoords.y,
                style: this.getCurrentStyle()
            }
        } else if (selectedTool === "arrow") {
            shape = {
                type: "arrow",
                x1: this.startX,
                y1: this.startY,
                x2: canvasCoords.x,
                y2: canvasCoords.y,
                style: this.getCurrentStyle()
            }
        }

        if (!shape) {
            return;
        }

        // Generate a unique local ID for this shape
        const localId = `${Date.now()}-${this.localIdCounter++}`;
        const shapeData: ShapeData = { shape, chatId: undefined, localId };
        
        this.existingShapes.push(shapeData);
        this.pendingShapes.set(localId, shapeData);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape,
                localId
            }),
            roomId: this.roomId
        }))
    }

    mouseMoveHandler = (e: MouseEvent) => {
        // Show eraser cursor when hovering (even when not clicking)
        if (this.selectedTool === "eraser" && !this.clicked) {
            this.clearCanvas();
            this.drawEraserCursor(e.clientX, e.clientY);
            return;
        }

        // Show laser cursor when hovering (even when not clicking)
        if (this.selectedTool === "laser" && !this.clicked) {
            this.clearCanvas();
            this.drawLaserCursor(e.clientX, e.clientY);
            return;
        }

        // Update cursor based on resize handles when in select mode
        if (this.selectedTool === "select" && this.selectedShape && this.selectedShape.shape && !this.clicked) {
            const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);
            const handle = this.getResizeHandle(this.selectedShape.shape, canvasCoords.x, canvasCoords.y);
            if (handle) {
                this.canvas.style.cursor = this.getResizeCursor(handle);
            } else if (this.isPointInShape(this.selectedShape.shape, canvasCoords.x, canvasCoords.y)) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }

        if (this.clicked) {
            // Convert screen coordinates to canvas coordinates
            const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);
            const height = canvasCoords.y - this.startY;
            const width = canvasCoords.x - this.startX;
            const selectedTool = this.selectedTool;

            // Handle panning
            if (selectedTool === "pan" && this.isPanning) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.panX += deltaX;
                this.panY += deltaY;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
                this.clearCanvas();
                return;
            }

            // Handle resizing selected shape
            if (selectedTool === "select" && this.isResizing && this.selectedShape && this.selectedShape.shape && this.resizeHandle) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.resizeShape(this.selectedShape.shape, this.resizeHandle, deltaX, deltaY);
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.clearCanvas();
                this.drawSelectionBox(this.selectedShape.shape);
                return;
            }

            // Handle dragging selected shape
            if (selectedTool === "select" && this.isDragging && this.selectedShape && this.selectedShape.shape) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.moveShape(this.selectedShape.shape, deltaX, deltaY);
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.clearCanvas();
                this.drawSelectionBox(this.selectedShape.shape);
                return;
            }

            this.clearCanvas();
            
            // Apply current style for preview (not for eraser)
            if (selectedTool !== "eraser") {
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.fillStyle = this.fillColor;
                this.ctx.lineWidth = this.strokeWidth;
                if (this.strokeStyle === "dotted") {
                    this.ctx.setLineDash([2, 4]);
                } else if (this.strokeStyle === "dashed") {
                    this.ctx.setLineDash([8, 4]);
                } else {
                    this.ctx.setLineDash([]);
                }
            }

            if (selectedTool === "rect") {
                const currentX = canvasCoords.x;
                const currentY = canvasCoords.y;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const rectWidth = Math.abs(width);
                const rectHeight = Math.abs(height);
                // Apply pan offset for preview drawing
                this.ctx.save();
                this.ctx.translate(this.panX, this.panY);
                if (this.fillColor !== "transparent") {
                    this.ctx.fillRect(minX, minY, rectWidth, rectHeight);
                }
                this.ctx.strokeRect(minX, minY, rectWidth, rectHeight);
                this.ctx.restore();
            } else if (selectedTool === "circle") {
                // Calculate proper center and radii based on actual mouse position
                const currentX = canvasCoords.x;
                const currentY = canvasCoords.y;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const boxWidth = Math.abs(currentX - this.startX);
                const boxHeight = Math.abs(currentY - this.startY);
                const radiusX = boxWidth / 2;
                const radiusY = boxHeight / 2;
                const centerX = minX + radiusX;
                const centerY = minY + radiusY;
                // Apply pan offset for preview drawing
                this.ctx.save();
                this.ctx.translate(this.panX, this.panY);
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                if (this.fillColor !== "transparent") {
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();
                this.ctx.restore();
            } else if (selectedTool === "diamond") {
                const currentX = canvasCoords.x;
                const currentY = canvasCoords.y;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const diamondWidth = Math.abs(width);
                const diamondHeight = Math.abs(height);
                // Apply pan offset for preview drawing
                this.ctx.save();
                this.ctx.translate(this.panX, this.panY);
                this.drawDiamondPreview(minX, minY, diamondWidth, diamondHeight);
                this.ctx.restore();
            } else if (selectedTool === "pencil") {
                const currentPoint = {x: canvasCoords.x, y: canvasCoords.y};
                this.pencilPoints.push(currentPoint);
                
                // Draw the entire pencil path with pan offset
                if (this.pencilPoints.length > 1) {
                    this.ctx.save();
                    this.ctx.translate(this.panX, this.panY);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints[0].y);
                    for (let i = 1; i < this.pencilPoints.length; i++) {
                        this.ctx.lineTo(this.pencilPoints[i].x, this.pencilPoints[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                    this.ctx.restore();
                }
            } else if (selectedTool === "eraser") {
                const currentPoint = {x: canvasCoords.x, y: canvasCoords.y};
                this.eraserPoints.push(currentPoint);
                
                // Check if eraser is over any shape and delete it instantly
                const shapesToDelete: ShapeData[] = [];
                this.existingShapes.forEach((shapeData) => {
                    if (shapeData && shapeData.shape && this.isPointInShape(shapeData.shape, currentPoint.x, currentPoint.y)) {
                        shapesToDelete.push(shapeData);
                    }
                });
                
                // Delete each shape
                for (const shapeData of shapesToDelete) {
                    // Remove from local array
                    this.existingShapes = this.existingShapes.filter(s => s !== shapeData);
                    
                    if (shapeData.chatId) {
                        // Shape has chatId - delete from database and notify others
                        deleteShape(shapeData.chatId).then(success => {
                            if (success) {
                                console.log("Shape deleted from database:", shapeData.chatId);
                            }
                        });
                        
                        // Notify other clients
                        this.socket.send(JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({
                                deleteChatId: shapeData.chatId
                            }),
                            roomId: this.roomId
                        }));
                    } else if (shapeData.localId) {
                        // Shape doesn't have chatId yet (pending) - track by localId
                        // This prevents it from being re-added when server sends back chatId
                        this.deletedPendingIds.add(shapeData.localId);
                        
                        // Also remove from pendingShapes Map
                        this.pendingShapes.delete(shapeData.localId);
                    }
                }
                
                if (shapesToDelete.length > 0) {
                    this.clearCanvas();
                }
                
                // Draw eraser cursor (uses screen coords)
                this.drawEraserCursor(e.clientX, e.clientY);
            } else if (selectedTool === "line") {
                this.ctx.save();
                this.ctx.translate(this.panX, this.panY);
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(canvasCoords.x, canvasCoords.y);
                this.ctx.stroke();
                this.ctx.closePath();
                this.ctx.restore();
            } else if (selectedTool === "arrow") {
                this.ctx.save();
                this.ctx.translate(this.panX, this.panY);
                this.drawArrowPreview(this.startX, this.startY, canvasCoords.x, canvasCoords.y);
                this.ctx.restore();
            } else if (selectedTool === "laser") {
                const currentPoint = {x: e.clientX, y: e.clientY, timestamp: Date.now()};
                this.laserPoints.push(currentPoint);
                this.drawLaser();
            }
        }
    }

    private drawLaser() {
        // Remove points older than 1 second
        const now = Date.now();
        const fadeTime = 1000; // 1 second fade
        this.laserPoints = this.laserPoints.filter(p => now - p.timestamp < fadeTime);
        
        this.clearCanvas();
        
        if (this.laserPoints.length > 1) {
            for (let i = 1; i < this.laserPoints.length; i++) {
                const point = this.laserPoints[i];
                const prevPoint = this.laserPoints[i - 1];
                const age = now - point.timestamp;
                const opacity = 1 - (age / fadeTime);
                
                this.ctx.save();
                this.ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = "round";
                this.ctx.lineJoin = "round";
                this.ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(prevPoint.x, prevPoint.y);
                this.ctx.lineTo(point.x, point.y);
                this.ctx.stroke();
                this.ctx.closePath();
                this.ctx.restore();
            }
        }
        
        // Draw laser pointer dot at current position
        if (this.laserPoints.length > 0) {
            const lastPoint = this.laserPoints[this.laserPoints.length - 1];
            this.ctx.save();
            this.ctx.fillStyle = "rgba(255, 0, 0, 1)";
            this.ctx.shadowColor = "rgba(255, 0, 0, 1)";
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
            this.ctx.restore();
        }
        
        // Continue animation if there are still points
        if (this.laserPoints.length > 0) {
            this.laserAnimationId = requestAnimationFrame(() => this.drawLaser());
        }
    }

    private drawArrowPreview(fromX: number, fromY: number, toX: number, toY: number) {
        const headlen = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.strokeWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        // Draw the main line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Draw the arrowhead as two lines (open arrow like ->)
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)
        this.canvas.addEventListener("mouseleave", this.mouseLeaveHandler)
        this.canvas.addEventListener("wheel", this.wheelHandler, { passive: false })
    }

    wheelHandler = (e: WheelEvent) => {
        // Prevent default browser scroll
        e.preventDefault();
        
        // Pan the canvas with scroll wheel
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
        this.clearCanvas();
    }

    mouseLeaveHandler = () => {
        // Clear the cursor when mouse leaves canvas
        if ((this.selectedTool === "eraser" || this.selectedTool === "laser") && !this.clicked) {
            this.clearCanvas();
        }
        // Reset panning state
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'grab';
        }
    }

    private moveShape(shape: Shape, deltaX: number, deltaY: number) {
        if (shape.type === "rect") {
            shape.x += deltaX;
            shape.y += deltaY;
        } else if (shape.type === "diamond") {
            shape.x += deltaX;
            shape.y += deltaY;
        } else if (shape.type === "circle") {
            shape.centerX += deltaX;
            shape.centerY += deltaY;
        } else if (shape.type === "pencil" && shape.points) {
            shape.points = shape.points.map(p => ({
                x: p.x + deltaX,
                y: p.y + deltaY
            }));
        } else if (shape.type === "line") {
            shape.x1 += deltaX;
            shape.y1 += deltaY;
            shape.x2 += deltaX;
            shape.y2 += deltaY;
        } else if (shape.type === "arrow") {
            shape.x1 += deltaX;
            shape.y1 += deltaY;
            shape.x2 += deltaX;
            shape.y2 += deltaY;
        } else if (shape.type === "text") {
            shape.x += deltaX;
            shape.y += deltaY;
        }
    }

    private drawEraserCursor(x: number, y: number) {
        this.ctx.save();
        this.ctx.strokeStyle = "rgba(220, 50, 50, 0.9)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fillStyle = "rgba(180, 180, 180, 0.3)";
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }

    private drawLaserCursor(x: number, y: number) {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(255, 0, 0, 1)";
        this.ctx.shadowColor = "rgba(255, 0, 0, 1)";
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }

    private drawDiamond(x: number, y: number, width: number, height: number) {
        const points = [
            { x: x + width / 2, y },           // top
            { x: x + width, y: y + height / 2 },  // right
            { x: x + width / 2, y: y + height },  // bottom
            { x, y: y + height / 2 }           // left
        ];

        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    private drawDiamondPreview(x: number, y: number, width: number, height: number) {
        const points = [
            { x: x + width / 2, y },
            { x: x + width, y: y + height / 2 },
            { x: x + width / 2, y: y + height },
            { x, y: y + height / 2 }
        ];

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        
        if (this.fillColor !== "transparent") {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    private drawSelectionBox(shape: Shape) {
        let bbox = this.getShapeBoundingBox(shape);
        if (!bbox) return;

        // Apply pan offset for selection box
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);

        const padding = 8;
        this.ctx.strokeStyle = "rgba(74, 144, 226, 0.8)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            bbox.minX - padding,
            bbox.minY - padding,
            bbox.maxX - bbox.minX + padding * 2,
            bbox.maxY - bbox.minY + padding * 2
        );
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 1;

        // Draw selection handles - corners and edges
        const handleSize = 8;
        this.ctx.fillStyle = "#ffffff";
        this.ctx.strokeStyle = "rgba(74, 144, 226, 1)";
        this.ctx.lineWidth = 2;
        
        const handles = [
            // Corners
            { x: bbox.minX - padding, y: bbox.minY - padding },
            { x: bbox.maxX + padding, y: bbox.minY - padding },
            { x: bbox.minX - padding, y: bbox.maxY + padding },
            { x: bbox.maxX + padding, y: bbox.maxY + padding },
            // Edge midpoints
            { x: (bbox.minX + bbox.maxX) / 2, y: bbox.minY - padding },
            { x: (bbox.minX + bbox.maxX) / 2, y: bbox.maxY + padding },
            { x: bbox.minX - padding, y: (bbox.minY + bbox.maxY) / 2 },
            { x: bbox.maxX + padding, y: (bbox.minY + bbox.maxY) / 2 }
        ];
        
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });

        this.ctx.restore();
    }

    private getShapeBoundingBox(shape: Shape): { minX: number, minY: number, maxX: number, maxY: number } | null {
        if (shape.type === "rect") {
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + shape.width,
                maxY: shape.y + shape.height
            };
        } else if (shape.type === "diamond") {
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + shape.width,
                maxY: shape.y + shape.height
            };
        } else if (shape.type === "circle") {
            return {
                minX: shape.centerX - Math.abs(shape.radiusX),
                minY: shape.centerY - Math.abs(shape.radiusY),
                maxX: shape.centerX + Math.abs(shape.radiusX),
                maxY: shape.centerY + Math.abs(shape.radiusY)
            };
        } else if (shape.type === "pencil") {
            if (!shape.points || shape.points.length === 0) return null;
            let minX = shape.points[0].x;
            let minY = shape.points[0].y;
            let maxX = shape.points[0].x;
            let maxY = shape.points[0].y;
            for (const point of shape.points) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
            return { minX, minY, maxX, maxY };
        } else if (shape.type === "line") {
            return {
                minX: Math.min(shape.x1, shape.x2),
                minY: Math.min(shape.y1, shape.y2),
                maxX: Math.max(shape.x1, shape.x2),
                maxY: Math.max(shape.y1, shape.y2)
            };
        } else if (shape.type === "arrow") {
            return {
                minX: Math.min(shape.x1, shape.x2),
                minY: Math.min(shape.y1, shape.y2),
                maxX: Math.max(shape.x1, shape.x2),
                maxY: Math.max(shape.y1, shape.y2)
            };
        } else if (shape.type === "text") {
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + shape.width,
                maxY: shape.y + shape.height
            };
        }
        return null;
    }

    private drawTextShape(shape: Extract<Shape, { type: "text" }>) {
        const style = shape.style;
        
        // Draw text box border when selected
        this.ctx.save();
        
        // Set text style
        this.ctx.font = `${shape.fontSize}px sans-serif`;
        this.ctx.fillStyle = style?.strokeColor || "#ffffff";
        this.ctx.textBaseline = "top";
        
        // Word wrap and draw text
        const lines = this.wrapText(shape.text, shape.width - 10);
        const lineHeight = shape.fontSize * 1.2;
        
        lines.forEach((line, index) => {
            this.ctx.fillText(line, shape.x + 5, shape.y + 5 + index * lineHeight);
        });
        
        this.ctx.restore();
    }

    private wrapText(text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Handle newlines
        const finalLines: string[] = [];
        lines.forEach(line => {
            const splitLines = line.split('\n');
            finalLines.push(...splitLines);
        });
        
        return finalLines.length > 0 ? finalLines : [''];
    }

    createTextAtPosition(x: number, y: number) {
        // Create a text input overlay
        if (this.textInputElement) {
            this.finishTextEditing();
        }

        const fontSize = 20;

        const textarea = document.createElement('textarea');
        textarea.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            min-width: 1px;
            min-height: ${fontSize * 1.2}px;
            width: auto;
            height: auto;
            font-size: ${fontSize}px;
            font-family: sans-serif;
            color: ${this.strokeColor};
            background: transparent;
            border: none !important;
            border-width: 0 !important;
            outline: none !important;
            padding: 0;
            margin: 0;
            resize: none;
            overflow: hidden;
            z-index: 10000;
            white-space: pre;
            line-height: 1.2;
            caret-color: ${this.strokeColor};
            box-shadow: none !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            scrollbar-width: none;
            -ms-overflow-style: none;
        `;
        
        // Hide scrollbar for webkit browsers
        const style = document.createElement('style');
        style.textContent = `
            textarea::-webkit-scrollbar { display: none; width: 0; height: 0; }
            textarea::-webkit-resizer { display: none; }
        `;
        document.head.appendChild(style);

        // Auto-resize textarea as user types
        const autoResize = () => {
            textarea.style.width = 'auto';
            textarea.style.height = 'auto';
            textarea.style.width = Math.max(textarea.scrollWidth, 20) + 'px';
            textarea.style.height = Math.max(textarea.scrollHeight, fontSize * 1.2) + 'px';
        };

        textarea.addEventListener('input', autoResize);

        // Prevent events from bubbling to canvas
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());
        textarea.addEventListener('mouseup', (e) => e.stopPropagation());
        textarea.addEventListener('mousemove', (e) => e.stopPropagation());
        textarea.addEventListener('click', (e) => e.stopPropagation());

        this.textInputElement = textarea;
        this.isEditingText = true;

        document.body.appendChild(textarea);
        
        // Use requestAnimationFrame to ensure DOM is ready before focusing
        requestAnimationFrame(() => {
            textarea.focus();
            autoResize();
        });

        // Handle finishing text input
        const finishEditing = () => {
            this.finishTextEditing();
        };

        textarea.addEventListener('blur', (e) => {
            // Small delay to allow for resize operations
            setTimeout(() => {
                if (!document.body.contains(textarea)) return;
                finishEditing();
            }, 100);
        });

        textarea.addEventListener('keydown', (e) => {
            // Stop propagation for all keys to prevent canvas shortcuts from triggering
            e.stopPropagation();
            
            if (e.key === 'Escape') {
                // Cancel without saving
                if (this.textInputElement) {
                    document.body.removeChild(this.textInputElement);
                    this.textInputElement = null;
                    this.isEditingText = false;
                }
            }
        });
    }

    private finishTextEditing() {
        if (!this.textInputElement || !document.body.contains(this.textInputElement)) {
            this.textInputElement = null;
            this.isEditingText = false;
            return;
        }

        const text = this.textInputElement.value;
        const rect = this.textInputElement.getBoundingClientRect();
        const fontSize = 20;
        
        if (text.trim()) {
            // Calculate proper dimensions based on text content
            this.ctx.font = `${fontSize}px sans-serif`;
            const lines = text.split('\n');
            let maxWidth = 0;
            lines.forEach(line => {
                const metrics = this.ctx.measureText(line);
                maxWidth = Math.max(maxWidth, metrics.width);
            });
            const textHeight = lines.length * fontSize * 1.2;

            // Convert screen position to canvas coordinates
            const canvasCoords = this.screenToCanvas(rect.left, rect.top);

            const shape: Shape = {
                type: "text",
                x: canvasCoords.x,
                y: canvasCoords.y,
                width: Math.max(maxWidth + 10, 50),
                height: Math.max(textHeight + 10, 30),
                text: text,
                fontSize: fontSize,
                style: this.getCurrentStyle()
            };

            // Generate a unique local ID for this shape
            const localId = `${Date.now()}-${this.localIdCounter++}`;
            const shapeData: ShapeData = { shape, chatId: undefined, localId };
            
            this.existingShapes.push(shapeData);
            this.pendingShapes.set(localId, shapeData);

            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                    shape,
                    localId
                }),
                roomId: this.roomId
            }));
        }

        document.body.removeChild(this.textInputElement);
        this.textInputElement = null;
        this.isEditingText = false;
        this.clearCanvas();
    }

    editTextShape(shapeData: ShapeData) {
        if (!shapeData.shape || shapeData.shape.type !== "text") return;
        
        const shape = shapeData.shape;
        
        // Remove the shape from canvas temporarily
        this.editingTextShape = shapeData;
        const textColor = shape.style?.strokeColor || this.strokeColor;
        
        const textarea = document.createElement('textarea');
        textarea.style.cssText = `
            position: fixed;
            left: ${shape.x}px;
            top: ${shape.y}px;
            min-width: 1px;
            min-height: ${shape.fontSize * 1.2}px;
            width: auto;
            height: auto;
            font-size: ${shape.fontSize}px;
            font-family: sans-serif;
            color: ${textColor};
            background: transparent;
            border: none !important;
            border-width: 0 !important;
            outline: none !important;
            padding: 0;
            margin: 0;
            resize: none;
            overflow: hidden;
            z-index: 10000;
            white-space: pre;
            line-height: 1.2;
            caret-color: ${textColor};
            box-shadow: none !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            scrollbar-width: none;
            -ms-overflow-style: none;
        `;
        textarea.value = shape.text;

        // Auto-resize textarea as user types
        const autoResize = () => {
            textarea.style.width = 'auto';
            textarea.style.height = 'auto';
            textarea.style.width = Math.max(textarea.scrollWidth, 20) + 'px';
            textarea.style.height = Math.max(textarea.scrollHeight, shape.fontSize * 1.2) + 'px';
        };

        textarea.addEventListener('input', autoResize);

        // Prevent events from bubbling to canvas
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());
        textarea.addEventListener('mouseup', (e) => e.stopPropagation());
        textarea.addEventListener('mousemove', (e) => e.stopPropagation());
        textarea.addEventListener('click', (e) => e.stopPropagation());

        this.textInputElement = textarea;
        this.isEditingText = true;

        document.body.appendChild(textarea);
        
        // Use requestAnimationFrame to ensure DOM is ready before focusing
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.select();
            autoResize();
        });

        textarea.addEventListener('blur', () => {
            setTimeout(() => {
                if (!document.body.contains(textarea)) return;
                this.finishEditingExistingText();
            }, 100);
        });

        textarea.addEventListener('keydown', (e) => {
            // Stop propagation for all keys to prevent canvas shortcuts
            e.stopPropagation();
            
            if (e.key === 'Escape') {
                if (this.textInputElement) {
                    document.body.removeChild(this.textInputElement);
                    this.textInputElement = null;
                    this.isEditingText = false;
                    this.editingTextShape = null;
                    this.clearCanvas();
                }
            }
        });
    }

    private finishEditingExistingText() {
        if (!this.textInputElement || !this.editingTextShape || !document.body.contains(this.textInputElement)) {
            this.textInputElement = null;
            this.isEditingText = false;
            this.editingTextShape = null;
            return;
        }

        const text = this.textInputElement.value.trim();
        const rect = this.textInputElement.getBoundingClientRect();
        const shape = this.editingTextShape.shape;

        if (shape && shape.type === "text") {
            if (text) {
                // Calculate proper dimensions based on text content
                this.ctx.font = `${shape.fontSize}px sans-serif`;
                const lines = text.split('\n');
                let maxWidth = 0;
                lines.forEach(line => {
                    const metrics = this.ctx.measureText(line);
                    maxWidth = Math.max(maxWidth, metrics.width);
                });
                const textHeight = lines.length * shape.fontSize * 1.2;

                // Update the existing shape
                shape.text = text;
                shape.x = rect.left;
                shape.y = rect.top;
                shape.width = Math.max(maxWidth + 10, 50);
                shape.height = Math.max(textHeight + 10, 30);

                // Update in database
                if (this.editingTextShape.chatId) {
                    updateShape(this.editingTextShape.chatId, shape);
                    
                    this.socket.send(JSON.stringify({
                        type: "chat",
                        message: JSON.stringify({
                            updateShape: {
                                chatId: this.editingTextShape.chatId,
                                shape: shape
                            }
                        }),
                        roomId: this.roomId
                    }));
                }
            } else {
                // Delete the shape if text is empty
                this.existingShapes = this.existingShapes.filter(s => s !== this.editingTextShape);
                if (this.editingTextShape.chatId) {
                    deleteShape(this.editingTextShape.chatId);
                    this.socket.send(JSON.stringify({
                        type: "chat",
                        message: JSON.stringify({
                            deleteChatId: this.editingTextShape.chatId
                        }),
                        roomId: this.roomId
                    }));
                }
            }
        }

        document.body.removeChild(this.textInputElement);
        this.textInputElement = null;
        this.isEditingText = false;
        this.editingTextShape = null;
        this.clearCanvas();
    }

    isTextEditing(): boolean {
        return this.isEditingText;
    }

    getSelectedShape(): ShapeData | null {
        return this.selectedShape;
    }

    // Resize functionality for text boxes
    private getResizeHandle(shape: Shape, x: number, y: number): string | null {
        const bbox = this.getShapeBoundingBox(shape);
        if (!bbox) return null;

        const padding = 8;
        const handleSize = 12;

        const handles = {
            'nw': { x: bbox.minX - padding, y: bbox.minY - padding },
            'ne': { x: bbox.maxX + padding, y: bbox.minY - padding },
            'sw': { x: bbox.minX - padding, y: bbox.maxY + padding },
            'se': { x: bbox.maxX + padding, y: bbox.maxY + padding },
            'n': { x: (bbox.minX + bbox.maxX) / 2, y: bbox.minY - padding },
            's': { x: (bbox.minX + bbox.maxX) / 2, y: bbox.maxY + padding },
            'w': { x: bbox.minX - padding, y: (bbox.minY + bbox.maxY) / 2 },
            'e': { x: bbox.maxX + padding, y: (bbox.minY + bbox.maxY) / 2 }
        };

        for (const [key, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) < handleSize && Math.abs(y - pos.y) < handleSize) {
                return key;
            }
        }

        return null;
    }

    private resizeShape(shape: Shape, handle: string, deltaX: number, deltaY: number) {
        if (shape.type === "text" || shape.type === "rect" || shape.type === "diamond") {
            switch (handle) {
                case 'se':
                    shape.width = Math.max(50, shape.width + deltaX);
                    shape.height = Math.max(30, shape.height + deltaY);
                    break;
                case 'sw':
                    const newWidthSW = Math.max(50, shape.width - deltaX);
                    shape.x = shape.x + (shape.width - newWidthSW);
                    shape.width = newWidthSW;
                    shape.height = Math.max(30, shape.height + deltaY);
                    break;
                case 'ne':
                    shape.width = Math.max(50, shape.width + deltaX);
                    const newHeightNE = Math.max(30, shape.height - deltaY);
                    shape.y = shape.y + (shape.height - newHeightNE);
                    shape.height = newHeightNE;
                    break;
                case 'nw':
                    const newWidthNW = Math.max(50, shape.width - deltaX);
                    const newHeightNW = Math.max(30, shape.height - deltaY);
                    shape.x = shape.x + (shape.width - newWidthNW);
                    shape.y = shape.y + (shape.height - newHeightNW);
                    shape.width = newWidthNW;
                    shape.height = newHeightNW;
                    break;
                case 'n':
                    const newHeightN = Math.max(30, shape.height - deltaY);
                    shape.y = shape.y + (shape.height - newHeightN);
                    shape.height = newHeightN;
                    break;
                case 's':
                    shape.height = Math.max(30, shape.height + deltaY);
                    break;
                case 'w':
                    const newWidthW = Math.max(50, shape.width - deltaX);
                    shape.x = shape.x + (shape.width - newWidthW);
                    shape.width = newWidthW;
                    break;
                case 'e':
                    shape.width = Math.max(50, shape.width + deltaX);
                    break;
            }
        }
    }

    private getResizeCursor(handle: string): string {
        const cursors: Record<string, string> = {
            'nw': 'nwse-resize',
            'se': 'nwse-resize',
            'ne': 'nesw-resize',
            'sw': 'nesw-resize',
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize'
        };
        return cursors[handle] || 'default';
    }
}