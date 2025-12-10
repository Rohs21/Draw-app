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

    // Style properties
    private strokeColor: string = "#ffffff";
    private fillColor: string = "transparent";
    private strokeWidth: number = 2;
    private strokeStyle: "solid" | "dotted" | "dashed" = "solid";

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
                const parsed = JSON.parse(message.message)
                if (parsed.deleteChatId) {
                    // Remove shape with this chatId
                    this.existingShapes = this.existingShapes.filter(s => s.chatId !== parsed.deleteChatId);
                } else if (parsed.updateShape) {
                    // Update shape position from another client
                    const shapeData = this.existingShapes.find(s => s.chatId === parsed.updateShape.chatId);
                    if (shapeData) {
                        shapeData.shape = parsed.updateShape.shape;
                    }
                } else if (parsed.shape) {
                    this.existingShapes.push({ shape: parsed.shape, chatId: parsed.chatId });
                }
                this.clearCanvas();
            }
        }
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
            }
            
            // Reset line dash
            this.ctx.setLineDash([]);
        })
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
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY
        
        if (this.selectedTool === "select") {
            // Check if clicking on the already selected shape to drag it
            if (this.selectedShape && this.selectedShape.shape && 
                this.isPointInShape(this.selectedShape.shape, this.startX, this.startY)) {
                this.isDragging = true;
                this.lastMouseX = this.startX;
                this.lastMouseY = this.startY;
                return;
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
        const height = e.clientY - this.startY;
        const width = e.clientX - this.startX;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;

        if (selectedTool === "select") {
            // Save the moved shape to database
            if (this.isDragging && this.selectedShape && this.selectedShape.chatId) {
                updateShape(this.selectedShape.chatId, this.selectedShape.shape);
                
                // Notify other clients about the move
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
            const minX = Math.min(this.startX, e.clientX);
            const minY = Math.min(this.startY, e.clientY);
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
            const minX = Math.min(this.startX, e.clientX);
            const minY = Math.min(this.startY, e.clientY);
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
            const minX = Math.min(this.startX, e.clientX);
            const minY = Math.min(this.startY, e.clientY);
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
                x2: e.clientX,
                y2: e.clientY,
                style: this.getCurrentStyle()
            }
        } else if (selectedTool === "arrow") {
            shape = {
                type: "arrow",
                x1: this.startX,
                y1: this.startY,
                x2: e.clientX,
                y2: e.clientY,
                style: this.getCurrentStyle()
            }
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push({ shape, chatId: undefined });

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
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

        if (this.clicked) {
            const height = e.clientY - this.startY;
            const width = e.clientX - this.startX;
            const selectedTool = this.selectedTool;

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
                const currentX = e.clientX;
                const currentY = e.clientY;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const rectWidth = Math.abs(width);
                const rectHeight = Math.abs(height);
                if (this.fillColor !== "transparent") {
                    this.ctx.fillRect(minX, minY, rectWidth, rectHeight);
                }
                this.ctx.strokeRect(minX, minY, rectWidth, rectHeight);   
            } else if (selectedTool === "circle") {
                // Calculate proper center and radii based on actual mouse position
                const currentX = e.clientX;
                const currentY = e.clientY;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const boxWidth = Math.abs(currentX - this.startX);
                const boxHeight = Math.abs(currentY - this.startY);
                const radiusX = boxWidth / 2;
                const radiusY = boxHeight / 2;
                const centerX = minX + radiusX;
                const centerY = minY + radiusY;
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                if (this.fillColor !== "transparent") {
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (selectedTool === "diamond") {
                const currentX = e.clientX;
                const currentY = e.clientY;
                const minX = Math.min(this.startX, currentX);
                const minY = Math.min(this.startY, currentY);
                const diamondWidth = Math.abs(width);
                const diamondHeight = Math.abs(height);
                this.drawDiamondPreview(minX, minY, diamondWidth, diamondHeight);
            } else if (selectedTool === "pencil") {
                const currentPoint = {x: e.clientX, y: e.clientY};
                this.pencilPoints.push(currentPoint);
                
                // Draw the entire pencil path
                if (this.pencilPoints.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints[0].y);
                    for (let i = 1; i < this.pencilPoints.length; i++) {
                        this.ctx.lineTo(this.pencilPoints[i].x, this.pencilPoints[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            } else if (selectedTool === "eraser") {
                const currentPoint = {x: e.clientX, y: e.clientY};
                this.eraserPoints.push(currentPoint);
                
                // Check if eraser is over any shape and delete it instantly
                const shapesToDelete: ShapeData[] = [];
                this.existingShapes.forEach((shapeData) => {
                    if (shapeData && shapeData.shape && this.isPointInShape(shapeData.shape, currentPoint.x, currentPoint.y)) {
                        shapesToDelete.push(shapeData);
                    }
                });
                
                // Delete each shape
                shapesToDelete.forEach(async (shapeData) => {
                    // Remove from local array
                    this.existingShapes = this.existingShapes.filter(s => s !== shapeData);
                    
                    // Delete from database if it has a chatId
                    if (shapeData.chatId) {
                        await deleteShape(shapeData.chatId);
                        
                        // Notify other clients
                        this.socket.send(JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({
                                deleteChatId: shapeData.chatId
                            }),
                            roomId: this.roomId
                        }));
                    }
                });
                
                if (shapesToDelete.length > 0) {
                    this.clearCanvas();
                }
                
                // Draw eraser cursor
                this.drawEraserCursor(currentPoint.x, currentPoint.y);
            } else if (selectedTool === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(e.clientX, e.clientY);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (selectedTool === "arrow") {
                this.drawArrowPreview(this.startX, this.startY, e.clientX, e.clientY);
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
    }

    mouseLeaveHandler = () => {
        // Clear the cursor when mouse leaves canvas
        if ((this.selectedTool === "eraser" || this.selectedTool === "laser") && !this.clicked) {
            this.clearCanvas();
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

        // Draw selection handles
        const handleSize = 6;
        this.ctx.fillStyle = "rgba(74, 144, 226, 1)";
        const handles = [
            { x: bbox.minX - padding, y: bbox.minY - padding },
            { x: bbox.maxX + padding, y: bbox.minY - padding },
            { x: bbox.minX - padding, y: bbox.maxY + padding },
            { x: bbox.maxX + padding, y: bbox.maxY + padding }
        ];
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });
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
        }
        return null;
    }
}