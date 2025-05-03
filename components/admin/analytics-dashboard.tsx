"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, Users, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"

type KeyMetrics = {
  totalSubscribers: number
  activeSubscribers: number
  mrr: number
  churnRate: number
  averagePlanValue: number
}

type SubscriptionsByPlan = {
  plan: string
  count: number
}[]

type SubscriptionsOverTime = {
  date: string
  count: number
}[]

type AnalyticsDashboardProps = {
  initialMetrics: KeyMetrics
  initialSubscriptionsByPlan: SubscriptionsByPlan
  initialSubscriptionsOverTime: SubscriptionsOverTime
}

export function AnalyticsDashboard({
  initialMetrics,
  initialSubscriptionsByPlan,
  initialSubscriptionsOverTime,
}: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<KeyMetrics>(initialMetrics)
  const [subscriptionsByPlan, setSubscriptionsByPlan] = useState<SubscriptionsByPlan>(initialSubscriptionsByPlan)
  const [subscriptionsOverTime, setSubscriptionsOverTime] =
    useState<SubscriptionsOverTime>(initialSubscriptionsOverTime)
  const [timeRange, setTimeRange] = useState<string>("30")
  const [interval, setInterval] = useState<string>("day")

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value)
    // In a real app, you would fetch new data here
    // const response = await fetch(`/api/admin/analytics?period=${value}&interval=${interval}`)
    // const data = await response.json()
    // setSubscriptionsOverTime(data.subscriptionsOverTime)
  }

  const handleIntervalChange = async (value: string) => {
    setInterval(value)
    // In a real app, you would fetch new data here
    // const response = await fetch(`/api/admin/analytics?period=${timeRange}&interval=${value}`)
    // const data = await response.json()
    // setSubscriptionsOverTime(data.subscriptionsOverTime)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +12.5%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +7.2%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500 inline-flex items-center">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                +0.5%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Plan Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.averagePlanValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +2.1%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Subscriptions by Plan</CardTitle>
                <CardDescription>Distribution of active subscribers by plan</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionsByPlan}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="plan"
                      >
                        {subscriptionsByPlan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>New Subscriptions</CardTitle>
                  <CardDescription>New subscribers over time</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={interval} onValueChange={handleIntervalChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-4">
          {/* Additional subscription analytics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>More detailed subscription analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed subscription analytics would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revenue" className="space-y-4">
          {/* Revenue analytics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Details</CardTitle>
              <CardDescription>More detailed revenue analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed revenue analytics would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
