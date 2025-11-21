import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZmI1MjY4ZS1hNTRjLTQzZjYtYmYxOS1lN2FkZmMxMDZkYzgiLCJpYXQiOjE3NjM3MTUyNjV9.C23nJDHcxOhkk1mnlD2a68H3apt7z1hQmx9c1uQVCSo`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);

    return {
        socket,
        loading
    }

}