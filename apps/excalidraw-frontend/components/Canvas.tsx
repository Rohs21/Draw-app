import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, ArrowRight, Minus, Pointer, Diamond } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "select" | "circle" | "rect" | "diamond" | "pencil" | "eraser" | "line" | "arrow";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select")

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }


    }, [canvasRef]);

    return <div style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style={{
            display: "block",
            flex: 1
        }}></canvas>
        <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
}

function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return <div style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            height: "auto",
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            paddingLeft: "8px",
            paddingRight: "8px",
            gap: "2px",
            zIndex: 1000,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            border: "1px solid rgba(100, 100, 100, 0.3)",
            backdropFilter: "blur(10px)"
        }}>
            <ToolButton 
                onClick={() => setSelectedTool("select")}
                activated={selectedTool === "select"}
                icon={<Pointer size={20} />}
                label="0"
            />
            <ToolButton 
                onClick={() => setSelectedTool("pencil")}
                activated={selectedTool === "pencil"}
                icon={<Pencil size={20} />}
                label="P"
            />
            <ToolButton 
                onClick={() => setSelectedTool("rect")}
                activated={selectedTool === "rect"}
                icon={<RectangleHorizontalIcon size={20} />}
                label="2"
            />
            <ToolButton 
                onClick={() => setSelectedTool("circle")}
                activated={selectedTool === "circle"}
                icon={<Circle size={20} />}
                label="3"
            />
            <ToolButton 
                onClick={() => setSelectedTool("diamond")}
                activated={selectedTool === "diamond"}
                icon={<Diamond size={20} />}
                label="4"
            />
            <ToolButton 
                onClick={() => setSelectedTool("arrow")}
                activated={selectedTool === "arrow"}
                icon={<ArrowRight size={20} />}
                label="5"
            />
            <ToolButton 
                onClick={() => setSelectedTool("line")}
                activated={selectedTool === "line"}
                icon={<Minus size={20} />}
                label="6"
            />
            
            <div style={{
                width: "1px",
                height: "24px",
                backgroundColor: "rgba(100, 100, 100, 0.3)",
                margin: "0 8px"
            }} />
            
            <ToolButton 
                onClick={() => setSelectedTool("eraser")}
                activated={selectedTool === "eraser"}
                icon={<Eraser size={20} />}
                label="trash"
            />
        </div>
}

function ToolButton({icon, onClick, activated, label}: {
    icon: React.ReactNode,
    onClick: () => void,
    activated: boolean,
    label: string
}) {
    return <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    }}>
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activated ? "rgba(74, 144, 226, 1)" : "transparent",
                color: activated ? "white" : "rgba(180, 180, 180, 1)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: "14px"
            }}
            onMouseEnter={(e) => {
                if (!activated) {
                    (e.target as HTMLButtonElement).style.backgroundColor = "rgba(60, 60, 60, 0.8)";
                    (e.target as HTMLButtonElement).style.color = "#fff";
                }
            }}
            onMouseLeave={(e) => {
                if (!activated) {
                    (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.target as HTMLButtonElement).style.color = "rgba(180, 180, 180, 1)";
                }
            }}
        >
            {icon}
        </button>
        <span style={{
            fontSize: "10px",
            color: "rgba(150, 150, 150, 0.8)",
            marginTop: "2px",
            minWidth: "20px",
            textAlign: "center"
        }}>
            {label}
        </span>
    </div>
}