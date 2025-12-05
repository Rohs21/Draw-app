import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = res.data.messages;

    const shapes = messages.map((x: {id: number, message: string}) => {
        const messageData = JSON.parse(x.message)
        return {
            shape: messageData.shape,
            chatId: x.id
        };
    })

    return shapes;
}

export async function deleteShape(chatId: number) {
    try {
        const url = `${HTTP_BACKEND}/chat/${chatId}`;
        console.log("Deleting shape with chatId:", chatId, "URL:", url);
        await axios.delete(url);
        return true;
    } catch (e: any) {
        console.error("Failed to delete shape:", chatId, e.response?.status, e.message);
        return false;
    }
}

export async function updateShape(chatId: number, shape: any) {
    try {
        const url = `${HTTP_BACKEND}/chat/${chatId}`;
        await axios.put(url, { message: JSON.stringify({ shape }) });
        return true;
    } catch (e: any) {
        console.error("Failed to update shape:", chatId, e.response?.status, e.message);
        return false;
    }
}