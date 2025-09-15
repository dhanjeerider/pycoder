'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Play, Trash2, Bot, TestTube, Sparkles, Send, Copy, PanelLeft, Settings, CircleUser } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateComments, handleGenerateTestCases, handleChat } from '@/app/actions';
import { PythonIcon } from './icons';
import { Separator } from './ui/separator';

const initialCode = `def greet(name):
    """
    This function greets the person passed in as a parameter.
    """
    print(f"Hello, {name}!")

greet("PyRunner User")
# Try adding 'error' to this code to see error handling
`;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function PyRunner() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const [testCasesState, testCasesAction] = useFormState(handleGenerateTestCases, { message: '' });
  const [isTestCasesPending, startTestCasesTransition] = useTransition();
  
  const [commentsState, commentsAction] = useFormState(handleGenerateComments, { message: '' });
  const [isCommentsPending, startCommentsTransition] = useTransition();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [chatState, chatAction] = useFormState(handleChat, { message: '' });
  const [isChatPending, startChatTransition] = useTransition();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatState?.message === 'success' && chatState.response) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: chatState.response as string }]);
    } else if (chatState?.message === 'An error occurred' || (chatState?.message === 'Invalid input' && chatState?.error)) {
        const errorMsg = typeof chatState.error === 'string' ? chatState.error : 'Please check your inputs.';
        toast({ variant: 'destructive', title: 'Error in Chat', description: errorMsg });
    }
  }, [chatState, toast]);

  useEffect(() => {
    if (commentsState?.message === 'success' && commentsState.commentedPythonCode) {
      setCode(commentsState.commentedPythonCode);
      toast({ title: 'Success', description: 'Comments generated and added to the code.' });
    } else if (commentsState?.message === 'An error occurred' || (commentsState?.message === 'Invalid input' && commentsState?.error)) {
        const errorMsg = typeof commentsState.error === 'string' ? commentsState.error : 'Please check your inputs.';
        toast({ variant: 'destructive', title: 'Error Generating Comments', description: errorMsg });
    }
  }, [commentsState, toast]);

  useEffect(() => {
    if (testCasesState?.message === 'success') {
      toast({ title: 'Success', description: 'Test cases generated successfully.' });
    } else if (testCasesState?.message === 'An error occurred' || (testCasesState?.message === 'Invalid input' && testCasesState?.error)) {
        const errorMsg = typeof testCasesState.error === 'string' ? testCasesState.error : 'Please check your inputs.';
        toast({ variant: 'destructive', title: 'Error Generating Test Cases', description: errorMsg });
    }
  }, [testCasesState, toast]);

  const handleRunCode = () => {
    setIsError(false);
    setOutput('');
    if (code.trim() === '') {
      setOutput('No code to execute.');
      return;
    }
    if (code.toLowerCase().includes('error')) {
      setOutput('Traceback (most recent call last):\n  File "<stdin>", line 1, in <module>\nNameError: name \'error\' is not defined');
      setIsError(true);
    } else {
      setOutput(`Hello from PyRunner!\nExecution successful.\n---\n(This is a mock output. Python code is not actually executed.)`);
    }
  };

  const handleClear = () => {
    setCode('');
    setOutput('');
    setIsError(false);
  };
  
  const handleChatSubmit = (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    if (!prompt) return;
    setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);
    startChatTransition(() => chatAction(formData));
    const form = document.getElementById('chat-form') as HTMLFormElement;
    form.reset();
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code has been copied to clipboard."});
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-3">
              <PythonIcon className="h-8 w-8 text-primary" />
              <h1 className="text-lg font-semibold md:text-2xl">PyRunner</h1>
          </div>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className='ml-auto flex-1 sm:flex-initial'>
              <Button onClick={handleRunCode} size="sm"><Play className="mr-2 h-4 w-4" /> Run</Button>
            </div>
            <div className='flex-initial'>
              <Button onClick={handleCopyCode} size="sm" variant="secondary"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
            </div>
            <div className='flex-initial'>
               <Button onClick={handleClear} size="sm" variant="secondary"><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <CircleUser className="h-5 w-5" />
            <Settings className="h-5 w-5" />
          </div>
      </header>
      <main className='flex-1 flex flex-col'>
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full h-full">
        <ResizablePanel defaultSize={60}>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your Python code here..."
              className="font-code text-sm h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
            />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60}>
              <Tabs defaultValue="output" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="tests"><TestTube className="mr-2 h-4 w-4" />Tests</TabsTrigger>
                  <TabsTrigger value="comments"><Sparkles className="mr-2 h-4 w-4" />Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="flex-grow mt-2">
                  <Card className="h-full rounded-none border-0 border-t">
                    <CardHeader>
                      <CardTitle>Execution Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted rounded-md p-4 h-full overflow-auto">
                        <code className={`font-code text-sm whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-foreground'}`}>
                          {output || 'Click "Run" to see the output of your code.'}
                        </code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tests" className="flex-grow mt-2">
                  <Card className="h-full rounded-none border-0 border-t">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Bot /> Generate Test Cases</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form action={(formData) => startTestCasesTransition(() => testCasesAction(formData))} className="space-y-4">
                        <input type="hidden" name="code" value={code} />
                        <div className="space-y-2">
                          <Label htmlFor="documentation">Documentation (Optional)</Label>
                          <Textarea id="documentation" name="documentation" placeholder="Provide documentation or context for your code..." className="font-code" />
                        </div>
                        <Button type="submit" disabled={isTestCasesPending}>
                          {isTestCasesPending ? 'Generating...' : 'Generate Tests'}
                        </Button>
                      </form>
                      {testCasesState?.testCases && (
                         <div className="space-y-2 pt-4">
                          <Label>Generated Test Cases</Label>
                           <pre className="bg-muted rounded-md p-4 max-h-[40vh] overflow-auto">
                             <code className="font-code text-sm whitespace-pre-wrap">{testCasesState.testCases}</code>
                           </pre>
                         </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comments" className="flex-grow mt-2">
                  <Card className="h-full rounded-none border-0 border-t">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Bot /> Generate Comments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <form action={(formData) => startCommentsTransition(() => commentsAction(formData))} className="space-y-4">
                         <input type="hidden" name="pythonCode" value={code} />
                         <div className="space-y-2">
                           <Label htmlFor="projectRequirements">Project Requirements</Label>
                           <Textarea id="projectRequirements" name="projectRequirements" placeholder="e.g., 'Add docstrings to all functions and explain complex logic.'" className="font-code" />
                         </div>
                         <Button type="submit" disabled={isCommentsPending}>
                          {isCommentsPending ? 'Generating...' : 'Generate Comments'}
                        </Button>
                       </form>
                       {isCommentsPending && <p className="text-sm text-muted-foreground">Generating comments...</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>
               <Card className="h-full flex flex-col rounded-none border-0 border-t">
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Bot /> AI Coder</CardTitle>
                    <CardDescription>Chat with Gemini to get help with your code.</CardDescription>
                  </CardHeader>
                  <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {chatHistory.length === 0 && (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Ask me anything about your code!</p>
                      </div>
                    )}
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && <div className="p-2 rounded-full bg-primary"><Bot className="h-4 w-4 text-primary-foreground" /></div>}
                        <div className={`rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                         {msg.role === 'user' && <div className="p-2 rounded-full bg-muted"><CircleUser className="h-4 w-4 text-muted-foreground" /></div>}
                      </div>
                    ))}
                    {isChatPending && (
                       <div className="flex items-start gap-3">
                         <div className="p-2 rounded-full bg-primary"><Bot className="h-4 w-4 text-primary-foreground" /></div>
                         <div className="rounded-lg px-3 py-2 bg-muted">
                           <p className="text-sm animate-pulse">Thinking...</p>
                         </div>
                       </div>
                    )}
                  </CardContent>
                  <div className="p-4 border-t">
                    {!apiKey ? (
                       <div className="space-y-2">
                        <Label htmlFor="api-key">Enter your Gemini API Key</Label>
                        <Input id="api-key" type="password" placeholder="Your API Key" onBlur={(e) => setApiKey(e.target.value)} />
                        <p className="text-xs text-muted-foreground">You can get a key from Google AI Studio.</p>
                       </div>
                    ) : (
                      <form id="chat-form" action={handleChatSubmit} className="relative">
                        <input type="hidden" name="apiKey" value={apiKey} />
                        <input type="hidden" name="chatHistory" value={JSON.stringify(chatHistory)} />
                        <input type="hidden" name="code" value={code} />
                        <Textarea
                          name="prompt"
                          placeholder="Ask a question..."
                          className="pr-16 resize-none"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              (e.target as HTMLTextAreaElement).form?.requestSubmit();
                            }
                          }}
                        />
                        <Button type="submit" size="icon" className="absolute top-1/2 -translate-y-1/2 right-3" disabled={isChatPending}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      </main>
    </div>
  );
}
