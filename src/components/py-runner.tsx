'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Play, Trash2, Bot, TestTube, Sparkles, Send, Copy, PanelLeft, Settings, CircleUser, Terminal as TerminalIcon, Code, Keyboard, MessageSquare,FileOutput, Check, X, File as FileIcon, Plus, MoreVertical } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateComments, handleGenerateTestCases, handleChat, handleSuggestCode } from '@/app/actions';
import { PythonIcon } from './icons';
import { Separator } from './ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const initialFiles = [
  {
    id: 1,
    name: 'main.py',
    content: `def greet(name):
    """
    This function greets the person passed in as a parameter.
    """
    print(f"Hello, {name}!")

greet("PyRunner User")
# This is a simulated environment.
# You can't install packages or run shell commands.
# Try adding 'import sys' and 'print(sys.version)' to see a simulated output.
# You can also try 'error' to see a simulated error.
`,
  },
];

type File = {
  id: number;
  name: string;
  content: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function ChatCodeBlock({ code, onInsert }: { code: string, onInsert: (code: string) => void }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Code block copied to clipboard.' });
  };
  return (
    <div className="bg-muted p-2 rounded-md my-2 relative">
      <pre className="font-code text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 flex gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert(code)}>
          <Keyboard className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function ChatMessageContent({ content, onInsertCode }: { content: string, onInsertCode: (code: string) => void }) {
    if (!content.includes('```')) {
        return <p className="text-sm">{content}</p>;
    }

    const parts = content.split(/(```[\s\S]*?```)/g).filter(part => part.trim() !== '');

    return (
        <div>
            {parts.map((part, index) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const code = part.replace(/```(python|)\n/g, '').replace(/```/g, '');
                    return <ChatCodeBlock key={index} code={code} onInsert={onInsertCode} />;
                }
                return <p key={index} className="text-sm">{part}</p>;
            })}
        </div>
    );
}

export function PyRunner() {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<number>(1);
  const [output, setOutput] = useState('Click "Run" to see the output of your code.');
  const [consoleOutput, setConsoleOutput] = useState('This is a simulated console. Code is not actually executed.');
  const [isError, setIsError] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isChatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const activeFile = files.find(f => f.id === activeFileId);
  const code = activeFile?.content ?? '';
  const setCode = (newContent: string | ((prev: string) => string)) => {
    setFiles(files.map(f => {
      if (f.id === activeFileId) {
        const content = typeof newContent === 'function' ? newContent(f.content) : newContent;
        return { ...f, content };
      }
      return f;
    }));
  };

  const [testCasesState, testCasesAction] = useFormState(handleGenerateTestCases, { message: '' });
  const [isTestCasesPending, startTestCasesTransition] = useTransition();
  
  const [commentsState, commentsAction] = useFormState(handleGenerateComments, { message: '' });
  const [isCommentsPending, startCommentsTransition] = useTransition();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [chatState, chatAction] = useFormState(handleChat, { message: '' });
  const [isChatPending, startChatTransition] = useTransition();

  const [suggestionState, suggestionAction] = useFormState(handleSuggestCode, { message: '' });
  const [isSuggestionPending, startSuggestionTransition] = useTransition();

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

  useEffect(() => {
    if (suggestionState?.message === 'success' && suggestionState.suggestion) {
      setSuggestion(suggestionState.suggestion);
      toast({ title: 'Suggestion Ready', description: 'AI has provided a code suggestion.' });
    } else if (suggestionState?.message === 'An error occurred' || (suggestionState?.message === 'Invalid input' && suggestionState?.error)) {
        const errorMsg = typeof suggestionState.error === 'string' ? suggestionState.error : 'Please check your inputs.';
        toast({ variant: 'destructive', title: 'Error Generating Suggestion', description: errorMsg });
    }
  }, [suggestionState, toast]);

  const handleRunCode = () => {
    setIsError(false);
    setOutput('');
    setConsoleOutput(`Executing ${activeFile?.name || 'file'}...`);
    
    const trimmedCode = code.trim();

    if (trimmedCode === '') {
      setOutput('No code to execute.');
      setConsoleOutput('Execution finished.');
      return;
    }
    
    // Check for print statements
    const printRegex = /print\((['"])(.*?)\1\)/g;
    let match;
    let printedOutput = '';
    while ((match = printRegex.exec(code)) !== null) {
      printedOutput += match[2] + '\n';
    }

    if (code.toLowerCase().includes('import sys') && code.toLowerCase().includes('print(sys.version)')) {
        printedOutput += '3.12.2 (v3.12.2:6AB1243, Apr  2 2024, 15:23:54) [Clang 15.0.0 (clang-1500.3.9.4)]\n';
    }

    if (code.toLowerCase().includes('error')) {
      const errorMsg = `Traceback (most recent call last):\n  File "${activeFile?.name}", line 1, in <module>\nNameError: name 'error' is not defined`;
      setOutput(errorMsg);
      setConsoleOutput('Execution finished with error.');
      setIsError(true);
    } else if (printedOutput) {
        setOutput(printedOutput);
        setConsoleOutput('Execution finished.');
    } else {
      setOutput(`(No output from print statements)`);
      setConsoleOutput(`Execution finished.\n---\n(This is a mock output. Python code is not actually executed.)`);
    }
  };

  const handleClear = () => {
    setCode('');
    setSuggestion(null);
  };
  
  const handleChatSubmit = (formData: FormData) => {
    const prompt = formData.get('prompt') as string;
    if (!prompt) return;
    setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);
    startChatTransition(() => chatAction(formData));
    const form = document.getElementById('chat-form') as HTMLFormElement;
    form.reset();
  }
  
  const handleSuggestCodeClick = () => {
    if (!apiKey) {
      toast({ variant: 'destructive', title: 'API Key Required', description: 'Please enter your Gemini API key in the chat panel to use this feature.' });
      return;
    }
    setSuggestion(null);
    const formData = new FormData();
    formData.append('apiKey', apiKey);
    formData.append('code', code);
    startSuggestionTransition(() => suggestionAction(formData));
  }

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      setCode(prev => prev + suggestion);
      setSuggestion(null);
      toast({ title: 'Suggestion Accepted', description: 'The suggested code has been added to the editor.' });
    }
  }

  const handleRejectSuggestion = () => {
    setSuggestion(null);
    toast({ title: 'Suggestion Rejected' });
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code has been copied to clipboard."});
  }

  const handleInsertCode = (codeToInsert: string) => {
    setCode(prev => prev + '\n' + codeToInsert);
    toast({ title: 'Code Inserted', description: 'The code has been added to the editor.' });
  }

  const handleNewFile = () => {
    const newFileName = `file${files.length + 1}.py`;
    const newFile: File = {
      id: Date.now(),
      name: newFileName,
      content: `# ${newFileName}\n`,
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    toast({title: 'File Created', description: `New file "${newFileName}" created.`});
  };

  const handleDeleteFile = (fileId: number) => {
    if (files.length === 1) {
      toast({variant: 'destructive', title: 'Cannot Delete', description: 'You must have at least one file.'});
      return;
    }
    const fileToDelete = files.find(f => f.id === fileId);
    setFiles(files.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(files[0].id);
    }
    toast({title: 'File Deleted', description: `File "${fileToDelete?.name}" deleted.`});
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
  };

  const ChatPanel = () => (
    <Card className="h-full flex flex-col rounded-none border-0 border-t">
       <CardHeader className="py-3 px-4">
         <CardTitle className='flex items-center gap-2 text-lg'><Bot /> AI Coder</CardTitle>
         <CardDescription>Chat with Gemini to get help with your code.</CardDescription>
       </CardHeader>
       <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-4 px-4">
         {chatHistory.length === 0 && (
           <div className="flex items-center justify-center h-full text-muted-foreground">
             <p>Ask me anything about your code!</p>
           </div>
         )}
         {chatHistory.map((msg, index) => (
           <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
             {msg.role === 'assistant' && <div className="p-2 rounded-full bg-primary"><Bot className="h-4 w-4 text-primary-foreground" /></div>}
             <div className={`rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <ChatMessageContent content={msg.content} onInsertCode={handleInsertCode} />
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
             <Input id="api-key" type="password" placeholder="Your API Key" onBlur={(e) => handleApiKeyChange(e.target.value)} />
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
               className="pr-12 resize-none"
               rows={1}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   (e.target as HTMLTextAreaElement).form?.requestSubmit();
                 }
               }}
             />
             <Button type="submit" size="icon" className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8" disabled={isChatPending}>
               <Send className="h-4 w-4" />
             </Button>
           </form>
         )}
       </div>
     </Card>
  );

  const FileExplorer = () => (
    <Collapsible defaultOpen className="h-full flex flex-col">
      <CollapsibleTrigger className="flex items-center justify-between p-2 bg-muted/50 border-b">
        <span className="font-semibold text-sm">Explorer</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewFile}>
          <Plus className="h-4 w-4"/>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex-1 overflow-y-auto">
        {files.map(file => (
          <div key={file.id} className={`flex items-center justify-between pr-2 group ${activeFileId === file.id ? 'bg-primary/10' : ''}`}>
            <button
              onClick={() => setActiveFileId(file.id)}
              className="flex items-center gap-2 p-2 text-sm flex-1 text-left hover:bg-muted"
            >
              <FileIcon className="h-4 w-4" />
              <span>{file.name}</span>
            </button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDeleteFile(file.id)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-sm">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[50px] lg:px-6">
          <div className="flex items-center gap-2">
              <PythonIcon className="h-6 w-6 text-primary" />
              <h1 className="text-md font-semibold md:text-xl">PyRunner</h1>
          </div>
          <div className="flex w-full items-center gap-2 md:gap-2 ml-auto">
            <div className='ml-auto'>
              <Button onClick={handleRunCode} size="sm"><Play className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Run</span></Button>
            </div>
            <div>
              <Button onClick={handleSuggestCodeClick} size="sm" variant="secondary" disabled={isSuggestionPending}>
                <Sparkles className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">{isSuggestionPending ? 'Thinking...': 'Suggest'}</span>
              </Button>
            </div>
            <div>
              <Button onClick={handleCopyCode} size="sm" variant="secondary" className="hidden sm:flex"><Copy className="mr-1 h-4 w-4" /> Copy</Button>
               <Button onClick={handleCopyCode} size="icon" variant="secondary" className="flex sm:hidden"><Copy className="h-4 w-4" /></Button>
            </div>
            <div>
               <Button onClick={handleClear} size="sm" variant="secondary" className="hidden sm:flex"><Trash2 className="mr-1 h-4 w-4" /> Clear</Button>
               <Button onClick={handleClear} size="icon" variant="secondary" className="flex sm:hidden"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="hidden md:flex items-center gap-2">
              <CircleUser className="h-5 w-5" />
              <Settings className="h-5 w-5" />
            </div>
            <Button onClick={() => setChatOpen(true)} size="sm" className="md:hidden"><Bot className="h-4 w-4" /></Button>
          </div>
      </header>
      <main className='flex-1 flex flex-col'>
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
            <FileExplorer />
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="flex-1 w-full h-full">
            <ResizablePanel defaultSize={60} minSize={isMobile ? 30 : 25}>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your Python code here..."
                    className="font-code text-xs h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  />
                </div>
                {suggestion && (
                  <div className="bg-muted/70 p-4 border-t relative">
                    <Label className="text-xs font-bold text-muted-foreground">AI SUGGESTION</Label>
                    <pre className="font-code text-xs mt-2 bg-background p-2 rounded-md max-h-40 overflow-auto">
                      <code>{suggestion}</code>
                    </pre>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={handleAcceptSuggestion}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={handleRejectSuggestion}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={isMobile ? 40: 30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={isMobile ? 50 : 60} minSize={isMobile ? 40 : 25}>
                  <Tabs defaultValue="output" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="output"><FileOutput className="mr-1 h-4 w-4" />Output</TabsTrigger>
                      <TabsTrigger value="console"><TerminalIcon className="mr-1 h-4 w-4" />Console</TabsTrigger>
                      <TabsTrigger value="tests"><TestTube className="mr-1 h-4 w-4" />Tests</TabsTrigger>
                      <TabsTrigger value="comments"><Sparkles className="mr-1 h-4 w-4" />Comments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="output" className="flex-grow mt-2">
                      <Card className="h-full rounded-none border-0 border-t">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-base">Output</CardTitle>
                          <CardDescription className="text-xs">Output from `print` statements in your code.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <pre className="bg-muted/50 rounded-none p-4 h-full overflow-auto">
                            <code className={`font-code text-xs whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-foreground'}`}>
                              {output}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="console" className="flex-grow mt-2">
                      <Card className="h-full rounded-none border-0 border-t">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-base">Console</CardTitle>
                          <CardDescription className="text-xs">Simulated execution logs. Code is not actually executed.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <pre className="bg-muted/50 rounded-none p-4 h-full overflow-auto">
                            <code className="font-code text-xs whitespace-pre-wrap text-muted-foreground">
                              {consoleOutput}
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
                              <Textarea id="documentation" name="documentation" placeholder="Provide documentation or context for your code..." className="font-code text-xs" />
                            </div>
                            <Button type="submit" disabled={isTestCasesPending} size="sm">
                              {isTestCasesPending ? 'Generating...' : 'Generate Tests'}
                            </Button>
                          </form>
                          {testCasesState?.testCases && (
                            <div className="space-y-2 pt-4">
                              <Label>Generated Test Cases</Label>
                              <pre className="bg-muted rounded-md p-4 max-h-[40vh] overflow-auto">
                                <code className="font-code text-xs whitespace-pre-wrap">{testCasesState.testCases}</code>
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
                              <Textarea id="projectRequirements" name="projectRequirements" placeholder="e.g., 'Add docstrings to all functions...'" className="font-code text-xs" />
                            </div>
                            <Button type="submit" disabled={isCommentsPending} size="sm">
                              {isCommentsPending ? 'Generating...' : 'Generate Comments'}
                            </Button>
                          </form>
                          {isCommentsPending && <p className="text-xs text-muted-foreground">Generating comments...</p>}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </ResizablePanel>
                
                {!isMobile && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={40} minSize={25}>
                      <ChatPanel />
                    </ResizablePanel>
                  </>
                )}

              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      </main>

      {isMobile && (
        <Dialog open={isChatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="h-[80vh] w-[90vw] max-w-[90vw] flex flex-col p-0 gap-0">
             <ChatPanel />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
