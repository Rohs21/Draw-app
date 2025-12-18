import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, ArrowRight, Minus, Pointer, Diamond, LogOut, Crosshair, Type, Hand } from "lucide-react";
import { Game, ShapeStyle } from "@/draw/Game";

export type Tool = "select" | "pan" | "circle" | "rect" | "diamond" | "pencil" | "eraser" | "line" | "arrow" | "laser" | "text";

const STROKE_COLORS = ["#e03131", "#2f9e44", "#1971c2", "#f08c00", "#ffffff", "#868e96"];
const FILL_COLORS = ["#ffc9c9", "#b2f2bb", "#a5d8ff", "#ffec99", "transparent", "#e9ecef"];

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [strokeColor, setStrokeColor] = useState("#ffffff");
    const [fillColor, setFillColor] = useState("transparent");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeStyle, setStrokeStyle] = useState<"solid" | "dotted" | "dashed">("solid");
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        game?.setStrokeColor(strokeColor);
    }, [strokeColor, game]);

    useEffect(() => {
        game?.setFillColor(fillColor);
    }, [fillColor, game]);

    useEffect(() => {
        game?.setStrokeWidth(strokeWidth);
    }, [strokeWidth, game]);

    useEffect(() => {
        game?.setStrokeStyle(strokeStyle);
    }, [strokeStyle, game]);

    // Keyboard shortcuts for tools
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            
            switch (e.key) {
                case "h":
                case "H":
                    setSelectedTool("pan");
                    break;
                case "1":
                    setSelectedTool("select");
                    break;
                
                case "2":
                    setSelectedTool("rect");
                    break;
                case "3":
                    setSelectedTool("circle");
                    break;
                case "4":
                    setSelectedTool("diamond");
                    break;
                case "5":
                    setSelectedTool("arrow");
                    break;
                case "6":
                    setSelectedTool("line");
                    break;
                case "7":
                    setSelectedTool("pencil");
                    break;
                case "8":
                    setSelectedTool("text");
                    break;
                case "9":
                    setSelectedTool("laser");
                    break;
                case "0":
                    setSelectedTool("eraser");
                    break;
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }


    }, [canvasRef]);

    // Handle double-click to edit text
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (game && selectedTool === "select") {
            const selectedShape = game.getSelectedShape();
            if (selectedShape && selectedShape.shape?.type === "text") {
                game.editTextShape(selectedShape);
            }
        }
    };

    return <div style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000"
    }}>
        <canvas 
            ref={canvasRef} 
            width={window.innerWidth} 
            height={window.innerHeight} 
            style={{
                display: "block",
                flex: 1,
                cursor: selectedTool === "eraser" ? "none" : 
                       selectedTool === "laser" ? "none" :
                       selectedTool === "text" ? "text" :
                       selectedTool === "pan" ? "grab" :
                       selectedTool === "select" ? "default" : "crosshair"
            }}
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            onDoubleClick={handleDoubleClick}
        ></canvas>
        <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} isDrawing={isDrawing} />
        <StylePanel 
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            strokeStyle={strokeStyle}
            setStrokeStyle={setStrokeStyle}
            isDrawing={isDrawing}
        />
    </div>
}

function Topbar({selectedTool, setSelectedTool, isDrawing}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    isDrawing: boolean
}) {
    return <div style={{
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            height: "48px",
            backgroundColor: "rgba(32, 32, 32, 0.98)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            gap: "1px",
            zIndex: 1000,
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
            border: "1px solid rgba(80, 80, 80, 0.4)",
            pointerEvents: isDrawing ? "none" : "auto"
        }}>
            
            <ToolButton 
                onClick={() => setSelectedTool("pan")}
                activated={selectedTool === "pan"}
                icon={<Hand size={18} />}
                label="H"
                tooltip="Pan — H"
            />
            <ToolButton 
                onClick={() => setSelectedTool("select")}
                activated={selectedTool === "select"}
                icon={<Pointer size={18} />}
                label="1"
                tooltip="Select — 1"
            />
            <ToolButton 
                onClick={() => setSelectedTool("rect")}
                activated={selectedTool === "rect"}
                icon={<RectangleHorizontalIcon size={18} />}
                label="2"
                tooltip="Rectangle — 2"
            />
            <ToolButton 
                onClick={() => setSelectedTool("circle")}
                activated={selectedTool === "circle"}
                icon={<Circle size={18} />}
                label="3"
                tooltip="Ellipse — 3"
            />
            <ToolButton 
                onClick={() => setSelectedTool("diamond")}
                activated={selectedTool === "diamond"}
                icon={<Diamond size={18} />}
                label="4"
                tooltip="Diamond — 4"
            />
            <ToolButton 
                onClick={() => setSelectedTool("arrow")}
                activated={selectedTool === "arrow"}
                icon={<ArrowRight size={18} />}
                label="5"
                tooltip="Arrow — 5"
            />
            <ToolButton 
                onClick={() => setSelectedTool("line")}
                activated={selectedTool === "line"}
                icon={<Minus size={18} />}
                label="6"
                tooltip="Line — 6"
            />
            <ToolButton 
                onClick={() => setSelectedTool("pencil")}
                activated={selectedTool === "pencil"}
                icon={<Pencil size={18} />}
                label="7"
                tooltip="Pencil — 7"
            />
            <ToolButton 
                onClick={() => setSelectedTool("text")}
                activated={selectedTool === "text"}
                icon={<Type size={18} />}
                label="8"
                tooltip="Text — 8"
            />
            <ToolButton 
                onClick={() => setSelectedTool("laser")}
                activated={selectedTool === "laser"}
                icon={<Crosshair size={18} />}
                label="9"
                tooltip="Laser — 9"
            />
            
            <div style={{
                width: "1px",
                height: "28px",
                backgroundColor: "rgba(100, 100, 100, 0.4)",
                margin: "0 6px"
            }} />
            
            <ToolButton 
                onClick={() => setSelectedTool("eraser")}
                activated={selectedTool === "eraser"}
                icon={<Eraser size={18} />}
                label="0"
                tooltip="Eraser — 0"
            />
            
            <div style={{
                width: "1px",
                height: "28px",
                backgroundColor: "rgba(100, 100, 100, 0.4)",
                margin: "0 6px"
            }} />
            
            <ExitButton />
        </div>
}

function ToolButton({icon, onClick, activated, label, tooltip}: {
    icon: React.ReactNode,
    onClick: () => void,
    activated: boolean,
    label: string,
    tooltip?: string
}) {
    return <button
        onClick={onClick}
        title={tooltip}
        style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: activated ? "rgba(74, 144, 226, 1)" : "transparent",
            color: activated ? "white" : "rgba(200, 200, 200, 1)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontSize: "14px",
            margin: "0",
            padding: "0"
        }}
        onMouseEnter={(e) => {
            if (!activated) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(70, 70, 70, 0.9)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }
        }}
        onMouseLeave={(e) => {
            if (!activated) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(200, 200, 200, 1)";
            }
        }}
    >
        {icon}
        <span style={{
            position: "absolute",
            bottom: "2px",
            right: "3px",
            fontSize: "9px",
            color: activated ? "rgba(255,255,255,0.7)" : "rgba(150, 150, 150, 0.7)",
            lineHeight: 1,
            fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
            {label}
        </span>
    </button>
}

function ExitButton() {
    const router = useRouter();
    
    return <button
        onClick={() => router.push("/dashboard")}
        title="Back to Dashboard"
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "transparent",
            color: "rgba(200, 200, 200, 1)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            margin: "0",
            padding: "0"
        }}
        onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(70, 70, 70, 0.9)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(200, 200, 200, 1)";
        }}
    >
        <LogOut size={18} />
    </button>
}

function StylePanel({
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    isDrawing
}: {
    strokeColor: string;
    setStrokeColor: (color: string) => void;
    fillColor: string;
    setFillColor: (color: string) => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
    strokeStyle: "solid" | "dotted" | "dashed";
    setStrokeStyle: (style: "solid" | "dotted" | "dashed") => void;
    isDrawing: boolean;
}) {
    return <div style={{
        position: "fixed",
        left: "20px",
        top: "80px",
        backgroundColor: "rgba(32, 32, 32, 0.98)",
        borderRadius: "12px",
        padding: "16px",
        zIndex: 1000,
        pointerEvents: isDrawing ? "none" : "auto",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        border: "1px solid rgba(80, 80, 80, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minWidth: "200px"
    }}>
        {/* Stroke Color */}
        <div>
            <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "8px" }}>Stroke</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {STROKE_COLORS.map((color) => (
                    <ColorButton 
                        key={color}
                        color={color}
                        selected={strokeColor === color}
                        onClick={() => setStrokeColor(color)}
                    />
                ))}
                <div style={{
                    width: "1px",
                    height: "20px",
                    backgroundColor: "rgba(100, 100, 100, 0.5)",
                    margin: "0 4px"
                }} />
                <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: strokeColor,
                    border: "1px solid rgba(100, 100, 100, 0.5)"
                }} />
            </div>
        </div>

        {/* Fill Color */}
        <div>
            <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "8px" }}>Background</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {FILL_COLORS.map((color, index) => (
                    <ColorButton 
                        key={color + index}
                        color={color}
                        selected={fillColor === color}
                        onClick={() => setFillColor(color)}
                        isTransparent={color === "transparent"}
                    />
                ))}
                <div style={{
                    width: "1px",
                    height: "20px",
                    backgroundColor: "rgba(100, 100, 100, 0.5)",
                    margin: "0 4px"
                }} />
                <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: fillColor === "transparent" ? "transparent" : fillColor,
                    border: "1px solid rgba(100, 100, 100, 0.5)",
                    position: "relative",
                    overflow: "hidden"
                }}>
                    {fillColor === "transparent" && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 8px 8px"
                        }} />
                    )}
                </div>
            </div>
        </div>

        {/* Stroke Width */}
        <div>
            <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "8px" }}>Stroke Width</div>
            <div style={{ display: "flex", gap: "6px" }}>
                <StrokeWidthButton width={2} selected={strokeWidth === 2} onClick={() => setStrokeWidth(2)} />
                <StrokeWidthButton width={4} selected={strokeWidth === 4} onClick={() => setStrokeWidth(4)} />
                <StrokeWidthButton width={6} selected={strokeWidth === 6} onClick={() => setStrokeWidth(6)} />
            </div>
        </div>

        {/* Stroke Style */}
        <div>
            <div style={{ color: "#aaa", fontSize: "12px", marginBottom: "8px" }}>Stroke Style</div>
            <div style={{ display: "flex", gap: "6px" }}>
                <StrokeStyleButton style="solid" selected={strokeStyle === "solid"} onClick={() => setStrokeStyle("solid")} />
                <StrokeStyleButton style="dotted" selected={strokeStyle === "dotted"} onClick={() => setStrokeStyle("dotted")} />
                <StrokeStyleButton style="dashed" selected={strokeStyle === "dashed"} onClick={() => setStrokeStyle("dashed")} />
            </div>
        </div>
    </div>
}

function ColorButton({ color, selected, onClick, isTransparent }: {
    color: string;
    selected: boolean;
    onClick: () => void;
    isTransparent?: boolean;
}) {
    return <button
        onClick={onClick}
        style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            border: selected ? "2px solid #4a90e2" : "2px solid transparent",
            backgroundColor: isTransparent ? "transparent" : color,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden"
        }}
    >
        {isTransparent && (
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 8px 8px"
            }} />
        )}
    </button>
}

function StrokeWidthButton({ width, selected, onClick }: {
    width: number;
    selected: boolean;
    onClick: () => void;
}) {
    return <button
        onClick={onClick}
        style={{
            width: "48px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: selected ? "rgba(74, 144, 226, 1)" : "rgba(60, 60, 60, 0.8)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}
    >
        <div style={{
            width: "24px",
            height: `${width}px`,
            backgroundColor: "#fff",
            borderRadius: "1px"
        }} />
    </button>
}

function StrokeStyleButton({ style, selected, onClick }: {
    style: "solid" | "dotted" | "dashed";
    selected: boolean;
    onClick: () => void;
}) {
    return <button
        onClick={onClick}
        style={{
            width: "48px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: selected ? "rgba(74, 144, 226, 1)" : "rgba(60, 60, 60, 0.8)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}
    >
        <div style={{
            width: "24px",
            height: "2px",
            backgroundColor: "#fff",
            borderRadius: "1px",
            ...(style === "dotted" ? {
                background: "repeating-linear-gradient(90deg, #fff 0px, #fff 2px, transparent 2px, transparent 6px)"
            } : style === "dashed" ? {
                background: "repeating-linear-gradient(90deg, #fff 0px, #fff 6px, transparent 6px, transparent 10px)"
            } : {})
        }} />
    </button>
}