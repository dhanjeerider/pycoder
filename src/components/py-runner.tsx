'use client';

import { useState, useTransition, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Play, Trash2, Bot, TestTube, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateComments, handleGenerateTestCases } from '@/app/actions';
import { PythonIcon } from './icons';

const initialCode = `def greet(name):
    """
    This function greets the person passed in as a parameter.
    """
    print(f"Hello, {name}!")

greet("PyRunner User")
# Try adding 'error' to this code to see error handling
`;

export function PyRunner() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const [testCasesState, testCasesAction] = useFormState(handleGenerateTestCases, { message: '' });
  const [isTestCasesPending, startTestCasesTransition] = useTransition();
  
  const [commentsState, commentsAction] = useFormState(handleGenerateComments, { message: '' });
  const [isCommentsPending, startCommentsTransition] = useTransition();

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
    // Mock execution
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
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen p-4 gap-4">
      <div className="flex flex-col md:w-1/2 h-full">
        <Card className="flex-grow flex flex-col min-h-[40vh] md:min-h-0">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <PythonIcon className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline">PyRunner</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRunCode} size="sm"><Play className="mr-2 h-4 w-4" /> Run</Button>
              <Button onClick={handleClear} size="sm" variant="secondary"><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex p-0">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your Python code here..."
              className="font-code text-base h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </CardContent>
        </Card>
      </div>

      <div className="md:w-1/2 h-full">
        <Tabs defaultValue="output" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="tests"><TestTube className="mr-2 h-4 w-4" />Tests</TabsTrigger>
            <TabsTrigger value="comments"><Sparkles className="mr-2 h-4 w-4" />Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="flex-grow mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Execution Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted rounded-md p-4 h-[60vh] md:h-[calc(100vh-14rem)] overflow-auto">
                  <code className={`font-code text-sm whitespace-pre-wrap ${isError ? 'text-accent' : 'text-foreground'}`}>
                    {output || 'Click "Run" to see the output of your code.'}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="flex-grow mt-4">
            <Card className="h-full">
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

          <TabsContent value="comments" className="flex-grow mt-4">
            <Card className="h-full">
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
      </div>
    </div>
  );
}
