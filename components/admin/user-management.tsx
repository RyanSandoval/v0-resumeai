"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, UserPlus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: string
  name: string | null
  email: string | null
  subscription: {
    plan: string
    status: string
  } | null
}

type UserManagementProps = {
  initialUsers: User[]
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleUpdateUser = async (userId: string, data: { plan?: string; status?: string }) => {
    try {
      setIsLoading(true)

      // In a real app, you would make an API call here
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // })
      // const updatedUser = await response.json()

      // For demo purposes, we'll just update the state directly
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              subscription: {
                ...user.subscription,
                ...(data.plan && { plan: data.plan }),
                ...(data.status && { status: data.status }),
              },
            }
          }
          return user
        }),
      )

      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the user.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsLoading(true)

      // In a real app, you would make an API call here
      // await fetch(`/api/admin/users/${userId}`, {
      //   method: "DELETE",
      // })

      // For demo purposes, we'll just update the state directly
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))

      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the user.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage your users and their subscriptions</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Add a new user to the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">
                    Name
                  </label>
                  <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input id="email" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="plan" className="text-right">
                    Plan
                  </label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Plan</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2">{user.name || "N/A"}</td>
                  <td className="py-2">{user.email || "N/A"}</td>
                  <td className="py-2 capitalize">{user.subscription?.plan || "free"}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.subscription?.status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.subscription?.status === "canceled"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {user.subscription?.status || "none"}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user details and subscription.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="edit-name" className="text-right">
                                Name
                              </label>
                              <Input id="edit-name" defaultValue={user.name || ""} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="edit-email" className="text-right">
                                Email
                              </label>
                              <Input id="edit-email" defaultValue={user.email || ""} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="edit-plan" className="text-right">
                                Plan
                              </label>
                              <Select
                                defaultValue={user.subscription?.plan || "free"}
                                onValueChange={(value) => handleUpdateUser(user.id, { plan: value })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label htmlFor="edit-status" className="text-right">
                                Status
                              </label>
                              <Select
                                defaultValue={user.subscription?.status || "none"}
                                onValueChange={(value) => handleUpdateUser(user.id, { status: value })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="canceled">Canceled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {}}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
