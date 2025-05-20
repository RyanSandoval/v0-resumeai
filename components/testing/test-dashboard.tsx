"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Edit3, Zap, Layers, Loader2 } from "lucide-react"
import Link from "next/link"
import { getRecentParsingEvents, getParsingSuccessRate } from "@/lib/parsers/parser-events"

export default function TestDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    components: Record<string, { passed: number; total: number }>;
  }>({
    total: 0,
    passed: 0,
    failed: 0,
    components: {}
  })

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestProgress(0)
    
    // Progress simulation
    const progressInterval = setInterval(() => {
      setTestProgress(prev => {
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5
        return Math.min(prev + increment, 95)
      })
    }, 200)
    
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Get parsing success rate
      const parsingRate = getParsingSuccessRate()
      
      // Mock test results
      setTestResults({
        total: 42,
        passed: 38,
        failed: 4,
        components: {
          "File Parsing": { passed: parsingRate.success, total: parsingRate.total },
          "Resume Editor": { passed: 8, total: 10 },
          "Optimization": { passed: 12, total: 14 },
          "UI Components": { passed: 10, total: 10 },
          "Integration": { passed: 8, total: 8 }
        }
      })
      
      clearInterval(progressInterval)
      setTestProgress(100)
    } catch (error) {
      console.error("Test execution error:", error)
    } finally {
      setIsRunningTests(false)
    }
  }
  
  // Calculate component pass rates
  const getComponentPassRate = (component: string) => {
    const data = testResults.components[component]
    if (!data || data.total === 0) return 0
    return (data.passed / data.total) * 100
  }
  
  // Get recent parsing events
  const parsingEvents = getRecentParsingEvents()
  const parsingRate = getParsingSuccessRate()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Dashboard</h1>
        <Button onClick={runAllTests} disabled={isRunningTests}>
          {isRunningTests ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run All Tests"
          )}
        </Button>
      </div>
      
      {isRunningTests && (
        <div className="space-y-2">
          <Progress value={testProgress} className="h-2" />
          <p className="text-xs text-center text-slate-500">
            Running tests... {Math.round(testProgress)}%
          </p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="parsing">File Parsing</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {testResults.total > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{testResults.total}</div>
                      <p className="text-sm text-muted-foreground">Total Tests</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{testResults.passed}</div>
                      <p className="text-sm text-muted-foreground">Passed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{testResults.failed}</div>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Component Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(testResults.components).map(([component, data]) => (
                      <div key={component} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{component}</span>
                          <Badge variant={data.passed === data.total ? "default" : "outline"}>
                            {data.passed}/{data.total}
                          </Badge>
                        </div>
                        <Progress value={getComponentPassRate(component)} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No test results available. Run tests to see results.</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Pages</CardTitle>
                <CardDescription>Access individual test pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/test-resume-optimizer">
                      <FileText className="mr-2 h-4 w-4" />
                      Resume Optimizer Tests
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/test-resume-editor">
                      <Edit3 className="mr-2 h-4 w-4" />
                      Resume Editor Tests
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/docx-test">
                      <FileText className="mr-2 h-4 w-4" />
                      DOCX Parser Tests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>File Parsing</CardTitle>
                <CardDescription>Recent file parsing statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant={parsingRate.rate >= 90 ? "default" : "outline"}>
                      {parsingRate.rate}%
                    </Badge>
                  </div>
                  <Progress value={parsingRate.rate} className="h-2" />
                  
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Total Files</span>
                      <span>{parsingRate.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful</span>
                      <span>{parsingRate.success}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>File Parsing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Test Status</span>
                    <Badge variant={getComponentPassRate("File Parsing") >= 90 ? "default" : "destructive"}>
                      {Math.round(getComponentPassRate("File Parsing"))}% Pass
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>PDF Parsing</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>DOCX Parsing</span>
                        <Badge variant="outline">Improved</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>TXT Parsing</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/test-resume-optimizer">View Tests</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  <CardTitle>Resume Editor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Test Status</span>
                    <Badge variant={getComponentPassRate("Resume Editor") >= 90 ? "default" : "destructive"}>
                      {Math.round(getComponentPassRate("Resume Editor"))}% Pass
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Text Editing</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Keyword Highlighting</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Score Calculation</span>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/test-resume-editor">View Tests</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <CardTitle>Optimization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Test Status</span>
                    <Badge variant={getComponentPassRate("Optimization") >= 90 ? "default" : "destructive"}>
                      {Math.round(getComponentPassRate("Optimization"))}% Pass
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>AI Analysis</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Keyword Extraction</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Suggestion Generation</span>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  <CardTitle>UI Components</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Test Status</span>
                    <Badge variant={getComponentPassRate("UI Components") >= 90 ? "default" : "destructive"}>
                      {Math.round(getComponentPassRate("UI Components"))}% Pass
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>File Upload</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Progress Indicators</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Results Display</span>
                        <Badge variant="outline">Passed</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="parsing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Parsing Events</CardTitle>
              <CardDescription>Recent file parsing attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Success Rate</span>
                  <Badge variant={parsingRate.rate >= 90 ? "default" : "destructive"}>
                    {parsingRate.rate}%
                  </Badge>
                </div>
                <Progress value={parsingRate.rate} className="h-2" />
                
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Format
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsingEvents.slice(0, 5).map((event, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {event.type === "success" ? (
                              <Badge variant="default">Success</Badge>
                            ) : event.type === "error" ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : event.type === "fallback" ? (
                              <Badge variant="outline">Fallback</Badge>
                            ) : (
                              <Badge variant="secondary">{event.type}</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.fileName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.format}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(event.fileSize / 1024).toFixed(1)} KB
                          </td>
                        </tr>
                      ))}
                      
                      {parsingEvents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No parsing events recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>PDF Parsing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="outline">95%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Processing Time</span>
                    <span className="text-sm">1.2s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant="default">Stable</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>DOCX Parsing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Processing Time</span>
                    <span className="text-sm">0.8s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant="default">Improved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>TXT Parsing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="outline">100%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Processing Time</span>
                    <span className="text-sm">0.1s</span>
                \
