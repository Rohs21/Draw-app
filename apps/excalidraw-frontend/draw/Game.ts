import { Tool } from "@/components/Canvas";
import { getExistingShapes, deleteShape } from "./http";

type ShapeData = {
    chatId?: number;
    shape: Shape;
}

type Shape = {
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
    radius: number;
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
}

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

    private selectedShape: ShapeData | null = null;
    private selectedShapeIndex: number = -1;

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
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
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
            const dx = x - shape.centerX;
            const dy = y - shape.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= Math.abs(shape.radius) + threshold;
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
            
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (shape.type === "pencil") {
                if (shape.points && shape.points.length > 0) {
                    this.ctx.strokeStyle = "rgba(255, 255, 255)"
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            } else if (shape.type === "line") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "diamond") {
                this.drawDiamond(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "arrow") {
                this.drawArrow(shape.x1, shape.y1, shape.x2, shape.y2);
            }
        })
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const headlen = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.strokeStyle = "rgba(255, 255, 255)"
        this.ctx.fillStyle = "rgba(255, 255, 255)"

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY
        
        if (this.selectedTool === "select") {
            // Check if clicking on an existing shape
            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                const shapeData = this.existingShapes[i];
                if (shapeData && shapeData.shape && this.isPointInShape(shapeData.shape, this.startX, this.startY)) {
                    this.selectedShape = shapeData;
                    this.selectedShapeIndex = i;
                    this.clearCanvas();
                    this.drawSelectionBox(shapeData.shape);
                    return;
                }
            }
            this.selectedShape = null;
            this.selectedShapeIndex = -1;
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

        if (selectedTool === "eraser") {
            this.eraserPoints = [];
            return;
        }

        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + radius,
                centerY: this.startY + radius,
            }
        } else if (selectedTool === "diamond") {
            shape = {
                type: "diamond",
                x: this.startX,
                y: this.startY,
                width,
                height
            }
        } else if (selectedTool === "pencil") {
            if (this.pencilPoints.length > 1) {
                shape = {
                    type: "pencil",
                    points: this.pencilPoints
                }
            }
            this.pencilPoints = [];
        } else if (selectedTool === "line") {
            shape = {
                type: "line",
                x1: this.startX,
                y1: this.startY,
                x2: e.clientX,
                y2: e.clientY
            }
        } else if (selectedTool === "arrow") {
            shape = {
                type: "arrow",
                x1: this.startX,
                y1: this.startY,
                x2: e.clientX,
                y2: e.clientY
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
        if (this.clicked) {
            const height = e.clientY - this.startY;
            const width = e.clientX - this.startX;
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)"
            const selectedTool = this.selectedTool;

            if (selectedTool === "rect") {
                this.ctx.strokeRect(this.startX, this.startY, width, height);   
            } else if (selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                const centerX = this.startX + radius;
                const centerY = this.startY + radius;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (selectedTool === "diamond") {
                this.drawDiamond(this.startX, this.startY, width, height);
            } else if (selectedTool === "pencil") {
                const currentPoint = {x: e.clientX, y: e.clientY};
                this.pencilPoints.push(currentPoint);
                
                if (this.pencilPoints.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.pencilPoints[this.pencilPoints.length - 2].x, this.pencilPoints[this.pencilPoints.length - 2].y);
                    this.ctx.lineTo(currentPoint.x, currentPoint.y);
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
                this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
                this.ctx.beginPath();
                this.ctx.arc(currentPoint.x, currentPoint.y, 15, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (selectedTool === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(e.clientX, e.clientY);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (selectedTool === "arrow") {
                this.drawArrow(this.startX, this.startY, e.clientX, e.clientY);
            }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    
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
                minX: shape.centerX - Math.abs(shape.radius),
                minY: shape.centerY - Math.abs(shape.radius),
                maxX: shape.centerX + Math.abs(shape.radius),
                maxY: shape.centerY + Math.abs(shape.radius)
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