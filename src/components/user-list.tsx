"use client";

import { type User } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { Users as UsersIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


type UserListProps = {
  users: User[];
  self: User | undefined;
};

export default function UserList({ users, self }: UserListProps) {
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shadow-lg">
                        <UsersIcon className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
                <p>Connected Users</p>
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Connected Users</h4>
            <p className="text-sm text-muted-foreground">
              Users currently in this session.
            </p>
          </div>
          <div className="grid gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-md p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback style={{ backgroundColor: user.color, color: 'white' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium">
                  {user.name} {user.id === self?.id && "(You)"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
