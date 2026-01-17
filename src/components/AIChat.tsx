import { useChat } from "@ai-sdk/react";
import { Send, Terminal, Loader2, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIChatProps {
    className?: string;
    onExpand?: () => void;
}

export function AIChat({ className, onExpand }: AIChatProps) {
    const [inputValue, setInputValue] = useState("");
    const chatHelpers = useChat({
        api: "/api/chat",
        onError: (e: Error) => {
            console.error("AI Chat Error:", e);
            alert("Error: " + e.message);
        }
    } as any) as any;

    const { messages, isLoading, sendMessage } = chatHelpers;
    console.log("useChat helpers:", chatHelpers);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        console.log("Sending message:", inputValue);
        const userMessage = inputValue;
        setInputValue(""); // clear immediately

        try {
            // Using sendMessage as detected in runtime logs
            await sendMessage({
                role: 'user',
                content: userMessage,
            });
        } catch (err) {
            console.error("Send error:", err);
            setInputValue(userMessage); // restore on error
        }
    };

    return (
        <Card className={cn("flex flex-col h-[600px] w-full shadow-xl", className)}>
            <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Terminal className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base">CRM Assistant</CardTitle>
                        <p className="text-xs text-muted-foreground">Ask about your data</p>
                    </div>
                </div>
                {onExpand && (
                    <Button variant="ghost" size="icon" onClick={onExpand} className="h-8 w-8">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground space-y-2 opacity-50">
                                <Terminal className="h-12 w-12" />
                                <p>Ask me anything about your contracts, companies, or deals.</p>
                            </div>
                        )}

                        {messages.map((m: any) => {
                            console.log('Rendering message:', {
                                id: m.id,
                                role: m.role,
                                contentLength: m.content?.length,
                                hasToolInvocations: !!m.toolInvocations,
                                content: m.content,
                                parts: m.parts,
                                partsCount: m.parts?.length
                            });
                            if (m.parts) {
                                console.log('Parts detail:', JSON.stringify(m.parts, null, 2));
                            }
                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex flex-col max-w-[90%] gap-1",
                                        m.role === "user" ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 text-sm prose prose-sm max-w-none dark:prose-invert",
                                            m.role === "user"
                                                ? "bg-primary text-primary-foreground prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex gap-3 my-4 text-sm">
                                            <div className={`flex-1 ${m.role === "user" ? "text-right" : ""}`}>
                                                {m.role === "user" ? (
                                                    <p className="whitespace-pre-wrap">{m.parts?.map((p: any) => p.type === 'text' ? p.text : '').join('')}</p>
                                                ) : (
                                                    <div>
                                                        {/* <div className="text-xs text-red-500 mb-2">DEBUG: Assistant message rendering</div> */}
                                                        {m.parts?.map((part: any, i: number) => {
                                                            if (part.type === 'text') {
                                                                return (
                                                                    <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                                                                        {part.text}
                                                                    </ReactMarkdown>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tool Invocations (Data Tables) */}
                                    {m.toolInvocations?.map((tool: any) => {
                                        if (tool.toolName === "queryDatabase") {
                                            if (tool.state === "call") {
                                                return (
                                                    <div key={tool.toolCallId} className="w-full mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded animate-pulse">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        Searching database...
                                                    </div>
                                                );
                                            }

                                            if (tool.state === "result") {
                                                const data = tool.result;
                                                // ... (rest of rendering logic is inside the table component, handled below)
                                                // For simplicity in this edit, I will just keep the result logic nested or cleaned up.
                                                // Re-inserting the result logic:

                                                // Ensure data is parsed if it came back as a string from our backend fix
                                                let parsedData = data;
                                                if (typeof data === 'string') {
                                                    try { parsedData = JSON.parse(data); } catch (e) { parsedData = []; }
                                                }

                                                // Handle the wrapped object format from backend { results: [...] }
                                                if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData) && (parsedData as any).results) {
                                                    parsedData = (parsedData as any).results;
                                                }

                                                if (!Array.isArray(parsedData) || parsedData.length === 0) {
                                                    return (
                                                        <div key={tool.toolCallId} className="w-full mt-2 text-xs text-muted-foreground italic border p-2 rounded">
                                                            No data returned.
                                                        </div>
                                                    )
                                                }

                                                if ((parsedData as any).error) {
                                                    return (
                                                        <div key={tool.toolCallId} className="w-full mt-2 text-xs text-red-500 border border-red-200 bg-red-50 p-2 rounded">
                                                            Error: {(parsedData as any).error}
                                                        </div>
                                                    )
                                                }

                                                // Only render table if we have data
                                                const headers = Object.keys(parsedData[0]);
                                                return (
                                                    <div key={tool.toolCallId} className="w-full mt-2 overflow-hidden rounded-md border shadow-sm max-w-full overflow-x-auto bg-card">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    {headers.map((h) => (
                                                                        <TableHead key={h} className="h-8 px-2 text-xs">{h}</TableHead>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {parsedData.slice(0, 5).map((row: any, i: number) => (
                                                                    <TableRow key={i}>
                                                                        {headers.map((h) => (
                                                                            <TableCell key={h} className="py-2 px-2 text-xs whitespace-nowrap">
                                                                                {typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h]}
                                                                            </TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                ))}
                                                                {parsedData.length > 5 && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={headers.length} className="text-center text-xs text-muted-foreground py-1">
                                                                            ... {parsedData.length - 5} more rows
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })}
                                </div>
                            );
                        })}

                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Thinking...
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-background">
                <form
                    onSubmit={handleSend}
                    className="flex w-full items-center space-x-2"
                >
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
